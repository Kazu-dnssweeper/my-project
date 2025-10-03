"""Static DNS hygiene rules (FR-01〜FR-06)."""

from __future__ import annotations

import ipaddress
import re
from typing import Iterable

from .. import zones
from ..config_loader import RuntimeConfig
from ..idn import to_ascii, to_unicode
from ..models import Evidence, Finding


def _filtered_targets(targets: Iterable[str], allowlist: set[str]) -> list[str]:
    return [target for target in targets if target not in allowlist]


def check_mx_cname(
    targets: zones.Targets, zone: zones.ZoneData | None, allowlist: set[str]
) -> list[Finding]:
    if zone is None:
        return []
    findings: list[Finding] = []
    for host, rdata in zone.iter_records("MX"):
        subject = to_ascii(host)
        if subject in allowlist:
            continue
        mx_target = to_ascii(rdata.exchange.to_text().rstrip("."))
        if mx_target in allowlist:
            continue
        cname_target = zone.cname_target(mx_target)
        if cname_target is None:
            continue
        detail = (
            f"MX record for {to_unicode(subject)} points to {to_unicode(mx_target)}, "
            f"which is a CNAME to {to_unicode(cname_target)}."
        )
        findings.append(
            Finding(
                rule="MX-CNAME",
                severity="medium",
                subject=to_unicode(subject),
                evidence=Evidence(detail=detail),
                remediation="Replace the MX with an A/AAAA host or remove the alias.",
                references=("RFC2181",),
            )
        )
    return findings


def check_mx_nxdomain(
    targets: zones.Targets, zone: zones.ZoneData | None, allowlist: set[str]
) -> list[Finding]:
    if zone is None:
        return []
    findings: list[Finding] = []
    for host, rdata in zone.iter_records("MX"):
        subject = to_ascii(host)
        if subject in allowlist:
            continue
        mx_target = to_ascii(rdata.exchange.to_text().rstrip("."))
        if mx_target in allowlist:
            continue
        if zone.has_a_or_aaaa(mx_target):
            continue
        detail = (
            f"MX record for {to_unicode(subject)} points to {to_unicode(mx_target)}, but no "
            "A/AAAA/CNAME records were found in the current zone snapshot (heuristic check)."
        )
        findings.append(
            Finding(
                rule="MX-NXDOMAIN",
                severity="high",
                subject=to_unicode(subject),
                evidence=Evidence(detail=detail),
                remediation="Ensure the MX endpoint resolves to an addressable host.",
                references=("RFC5321", "Heuristic: zone data only"),
            )
        )
    return findings


def check_spf_lookup(zone: zones.ZoneData | None, allowlist: set[str]) -> list[Finding]:
    if zone is None:
        return []
    findings: list[Finding] = []
    for host, rdata in zone.iter_records("TXT"):
        subject = to_ascii(host)
        if subject in allowlist:
            continue
        spf_chunks = [
            txt.decode("utf-8") if isinstance(txt, bytes) else str(txt) for txt in rdata.strings
        ]
        spf = "".join(spf_chunks)
        if not spf.lower().startswith("v=spf1"):
            continue
        if _count_spf_dns_lookups(spf) <= 10:
            continue
        detail = f"SPF record for {to_unicode(subject)} contains more than 10 DNS lookups."
        findings.append(
            Finding(
                rule="SPF-LOOKUP",
                severity="medium",
                subject=to_unicode(subject),
                evidence=Evidence(detail=detail, sample=spf),
                remediation="Reduce include/mechanisms or use SPF macros to stay within limits.",
                references=("RFC7208",),
            )
        )
    return findings


def check_private_ip(zone: zones.ZoneData | None, allowlist: set[str]) -> list[Finding]:
    if zone is None:
        return []
    findings: list[Finding] = []
    for host, rdata in zone.iter_records("A"):
        subject = to_ascii(host)
        if subject in allowlist:
            continue
        ip = ipaddress.ip_address(rdata.address)
        if not (ip.is_private or ip.is_loopback or ip.is_link_local):
            continue
        detail = (
            f"Record {to_unicode(subject)} resolves to {ip}, which is not routable on the public "
            "Internet."
        )
        findings.append(
            Finding(
                rule="PRIVATE-IP",
                severity="low",
                subject=to_unicode(subject),
                evidence=Evidence(detail=detail),
                remediation=
                "Move the record to an internal-only zone or document the exception via labels.",
            )
        )
    for host, rdata in zone.iter_records("AAAA"):
        subject = to_ascii(host)
        if subject in allowlist:
            continue
        ip = ipaddress.ip_address(rdata.address)
        if not (ip.is_private or ip.is_loopback or ip.is_link_local):
            continue
        detail = (
            f"Record {to_unicode(subject)} resolves to {ip}, which is not routable on the public "
            "Internet."
        )
        findings.append(
            Finding(
                rule="PRIVATE-IP",
                severity="low",
                subject=to_unicode(subject),
                evidence=Evidence(detail=detail),
                remediation=
                "Move the record to an internal-only zone or document the exception via labels.",
            )
        )
    return findings


def check_ns_health(zone: zones.ZoneData | None, allowlist: set[str]) -> list[Finding]:
    if zone is None:
        return []
    findings: list[Finding] = []
    for host, rdata in zone.iter_records("NS"):
        subject = to_ascii(host)
        if subject in allowlist:
            continue
        ns_target = rdata.target.to_text().rstrip(".")
        if ns_target in allowlist:
            continue
        if zone.has_a_or_aaaa(ns_target):
            continue
        detail = (
            f"NS {to_unicode(ns_target)} referenced by {to_unicode(subject)} lacks address records "
            "in the zone."
        )
        findings.append(
            Finding(
                rule="NS-HEALTH",
                severity="medium",
                subject=to_unicode(subject),
                evidence=Evidence(detail=detail),
                remediation=
                "Add glue/host records for the listed name server or update delegation.",
            )
        )
    return findings


def check_open_axfr(
    zone: zones.ZoneData | None,
    allowlist: set[str],
    *,
    online: bool = False,
    runtime: RuntimeConfig | None = None,
    allowed_zones: list[str] | None = None,
) -> list[Finding]:
    if zone is None:
        return []
    findings: list[Finding] = []

    if online:
        allowed = {to_ascii(item) for item in (allowed_zones or [])}
        timeout = getattr(runtime, "timeout_sec", 5)
        retries = getattr(runtime, "retries", 1)
        origin = zone.origin
        if allowed and origin not in allowed:
            raise PermissionError(
                "Online AXFR is restricted. Add the zone to dns.zone.allowed_online_axfr to "
                "allow transfers or disable --online-axfr."
            )
        if not allowed:
            raise PermissionError(
                "Online AXFR requires dns.zone.allowed_online_axfr to contain your zone."
            )
        for _, rdata in zone.iter_records("NS"):
            ns_target = to_ascii(rdata.target.to_text().rstrip("."))
            if ns_target in allowlist:
                continue
            if _axfr_is_open(origin, ns_target, timeout=timeout, retries=retries):
                detail = (
                    f"AXFR to name server {to_unicode(ns_target)} for zone {to_unicode(origin)} "
                    "succeeded from the current location."
                )
                findings.append(
                    Finding(
                        rule="OPEN-AXFR",
                        severity="critical",
                        subject=to_unicode(origin),
                        evidence=Evidence(detail=detail),
                        remediation="Restrict AXFR to authorised IPs or disable zone transfers.",
                        references=("RFC5936",),
                    )
                )

    # Demo/fixture path: fallback to TXT marker if present
    for host, rdata in zone.iter_records("TXT"):
        subject = to_ascii(host)
        if subject in allowlist:
            continue
        txt_values = [s.decode("utf-8") if isinstance(s, bytes) else str(s) for s in rdata.strings]
        if any(value.startswith("axfr:open") for value in txt_values):
            detail = "Demo marker indicates AXFR was possible from an unauthorised source."
            findings.append(
                Finding(
                    rule="OPEN-AXFR",
                    severity="critical",
                    subject=to_unicode(subject),
                    evidence=Evidence(detail=detail),
                    remediation="Restrict AXFR to authorised IPs or disable zone transfers.",
                    references=("RFC5936",),
                )
            )
    return findings


def _axfr_is_open(origin: str, nameserver: str, timeout: int, retries: int) -> bool:
    import dns.exception
    import dns.query
    import dns.zone

    for attempt in range(retries + 1):
        try:
            xfr = dns.query.xfr(nameserver, origin, timeout=timeout, lifetime=timeout)
            dns.zone.from_xfr(xfr)
            return True
        except dns.exception.DNSException:
            continue
        except OSError:
            continue
    return False


_SPF_LOOKUP_KEYWORDS = {
    "include",
    "a",
    "mx",
    "ptr",
    "exists",
    "redirect",
} 


def _count_spf_dns_lookups(spf: str) -> int:
    sanitised = spf.replace('"', ' ').replace("'", " ")
    tokens = re.split(r"\s+", sanitised.strip())
    count = 0
    for token in tokens:
        if token == "" or token.startswith("v="):
            continue
        bare = token.rstrip(":+?~-")
        key = bare.split(":", 1)[0].split("=", 1)[0]
        if key in _SPF_LOOKUP_KEYWORDS:
            count += 1
    return count
