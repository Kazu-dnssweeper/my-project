"""Unused host/IP detection based on usage index (FR-11/FR-12)."""

from __future__ import annotations

from .. import zones
from ..idn import to_unicode
from ..logs.index import UsageIndex
from ..models import Evidence, Finding


def detect_unused_fqdns(
    zone: zones.ZoneData | None,
    usage: UsageIndex,
    allowlist: set[str],
) -> list[Finding]:
    if zone is None:
        return []
    zone_hosts, host_ip_map = _extract_zone_hosts(zone)
    active_hosts = usage.active_hosts()
    active_ips = usage.active_ips()
    findings: list[Finding] = []
    for host in sorted(zone_hosts):
        if host in allowlist:
            continue
        if host in active_hosts:
            continue
        ip_candidates = host_ip_map.get(host, set())
        confidence = _confidence_for_host(ip_candidates, active_ips)
        display_host = to_unicode(host)
        detail_lines = [
            f"Host {display_host} not observed in the last {usage.window_days} days."
        ]
        if ip_candidates:
            detail_lines.append(f"Associated IPs: {sorted(ip_candidates)}")
        detail = "\n".join(detail_lines)
        findings.append(
            Finding(
                rule="UNUSED-FQDN",
                severity="medium",
                subject=display_host,
                confidence=confidence,
                evidence=Evidence(detail=detail),
                remediation="Review and remove the record if it is no longer required.",
            )
        )
    return findings


def detect_unused_ips(
    zone: zones.ZoneData | None,
    usage: UsageIndex,
    allowlist: set[str],
) -> list[Finding]:
    if zone is None:
        return []
    zone_hosts, host_ip_map = _extract_zone_hosts(zone)
    all_ips: set[str] = set()
    for ips in host_ip_map.values():
        all_ips.update(ips)
    active_ips = usage.active_ips()
    findings: list[Finding] = []
    for ip in sorted(all_ips):
        if ip in allowlist:
            continue
        if ip in active_ips:
            continue
        detail = f"IP address {ip} was not observed in the last {usage.window_days} days."
        findings.append(
            Finding(
                rule="UNUSED-IP",
                severity="medium",
                subject=ip,
                confidence="high",
                evidence=Evidence(detail=detail),
                remediation=
                "Decommission DNS entries pointing to unused IPs or document the exception.",
            )
        )
    return findings


def _extract_zone_hosts(zone: zones.ZoneData) -> tuple[set[str], dict[str, set[str]]]:
    hosts: set[str] = set()
    host_ip_map: dict[str, set[str]] = {}
    for host, rdata in zone.iter_records("A"):
        fqdn = host.rstrip(".")
        hosts.add(fqdn)
        host_ip_map.setdefault(fqdn, set()).add(rdata.address)
    for host, rdata in zone.iter_records("AAAA"):
        fqdn = host.rstrip(".")
        hosts.add(fqdn)
        host_ip_map.setdefault(fqdn, set()).add(rdata.address)
    for host, _ in zone.iter_records("CNAME"):
        fqdn = host.rstrip(".")
        hosts.add(fqdn)
        terminal = zone.resolve_cname_chain(fqdn)
        for address in zone.a_records(terminal):
            host_ip_map.setdefault(fqdn, set()).add(address)
    return hosts, host_ip_map


def _confidence_for_host(ip_candidates: set[str], active_ips: set[str]) -> str:
    """Map観測対象に応じて確信度を与える。

    ルール: DNSのみ=low / HTTPのみ=medium / HTTP+L4=high。

    - DNSのみ: ゾーンにIP情報が無い場合（CNAMEのみ、またはA/AAAAなし）
    - HTTPのみ: IP情報はあるがL4ログで観測できていない
    - HTTP+L4: 紐づくIPがL4ログで観測済み
    """

    if not ip_candidates:
        # DNSログなどメタデータだけで判定しているため確信度は低。
        return "low"
    if any(ip in active_ips for ip in ip_candidates):
        # HTTPログに加えL4ログでも観測できる構成なので確信度は高。
        return "high"
    # HTTPログのみを参照（Hostは取得できるがL4では観測できていない）
    return "medium"
