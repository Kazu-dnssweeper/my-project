"""Zone and target loading utilities."""

from __future__ import annotations

import pathlib
from typing import Iterable, Iterator

import dns.name
import dns.rdatatype
import dns.rdtypes.ANY.CNAME
import dns.rdtypes.ANY.MX
import dns.rdtypes.ANY.NS
import dns.rdtypes.ANY.SOA
import dns.rdtypes.IN.A
import dns.rdtypes.IN.AAAA
import dns.zone

from .idn import to_ascii


def _fqdn_for_name(name: dns.name.Name, origin: dns.name.Name) -> str:
    text = name.to_text()
    if text in {"@", ""}:
        return origin.to_text().rstrip(".")
    if text.endswith("."):
        return text.rstrip(".")
    return f"{text}.{origin.to_text().rstrip('.')}"


class ZoneData:
    """Simple wrapper that exposes record lookups for static rules."""

    def __init__(self, origin: str, zone: dns.zone.Zone) -> None:
        self.origin = to_ascii(origin)
        self._zone = zone

    def iter_records(self, rdtype: str) -> Iterator[tuple[str, object]]:
        for name, node in self._zone.nodes.items():
            for rdataset in node.rdatasets:
                if dns.rdatatype.to_text(rdataset.rdtype) == rdtype:
                    fqdn = to_ascii(_fqdn_for_name(name, self._zone.origin))
                    for rdata in rdataset:
                        yield fqdn, rdata

    def has_a_or_aaaa(self, target: str) -> bool:
        name = target.rstrip(".")
        try:
            node = self._zone.get_node(dns.name.from_text(name), create=False)
        except Exception:
            return False
        if not node:
            return False
        for rdataset in node.rdatasets:
            rdtype = dns.rdatatype.to_text(rdataset.rdtype)
            if rdtype in {"A", "AAAA", "CNAME"}:
                return True
        return False

    def cname_target(self, host: str) -> str | None:
        name = host.rstrip(".")
        try:
            node = self._zone.get_node(dns.name.from_text(name), create=False)
        except Exception:
            return None
        if not node:
            return None
        for rdataset in node.rdatasets:
            if dns.rdatatype.to_text(rdataset.rdtype) == "CNAME":
                cname: dns.rdtypes.ANY.CNAME.CNAME = rdataset[0]
                return cname.target.to_text().rstrip(".")
        return None

    def resolve_cname_chain(self, host: str, max_depth: int = 5) -> str:
        current = host.rstrip(".")
        seen: set[str] = set()
        for _ in range(max_depth):
            if current in seen:
                break
            seen.add(current)
            target = self.cname_target(current)
            if not target:
                break
            current = to_ascii(target)
        return current

    def a_records(self, host: str) -> list[str]:
        name = host.rstrip(".")
        try:
            node = self._zone.get_node(dns.name.from_text(name), create=False)
        except Exception:
            return []
        if not node:
            return []
        addresses: list[str] = []
        for rdataset in node.rdatasets:
            rdtype = dns.rdatatype.to_text(rdataset.rdtype)
            if rdtype == "A":
                addresses.extend(rdata.address for rdata in rdataset)
            elif rdtype == "AAAA":
                addresses.extend(rdata.address for rdata in rdataset)
        return addresses


class Targets:
    def __init__(self, hosts: Iterable[str]):
        self.hosts = sorted({to_ascii(host) for host in hosts})

    def __iter__(self) -> Iterator[str]:
        return iter(self.hosts)

    def __len__(self) -> int:  # noqa: D401
        return len(self.hosts)


def load_zone_from_file(path: pathlib.Path) -> ZoneData:
    zone = dns.zone.from_file(str(path), relativize=False)
    origin = zone.origin.to_text().rstrip(".")
    return ZoneData(origin=origin, zone=zone)


def load_targets_file(path: pathlib.Path) -> Targets:
    hosts: list[str] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            hosts.append(to_ascii(line))
    return Targets(hosts)


def load_targets(paths: list[pathlib.Path]) -> Targets:
    hosts: list[str] = []
    for path in paths:
        hosts.extend(load_targets_file(path).hosts)
    return Targets(hosts)
