"""Dangling CNAME detection (FR-07)."""

from __future__ import annotations

from typing import Callable

from .. import zones
from ..fingerprints import Fingerprints
from ..idn import to_ascii, to_unicode
from ..models import Evidence, Finding
from ..prober import HttpResult


def detect_dangling_cnames(
    zone: zones.ZoneData | None,
    fingerprints: Fingerprints,
    allowlist: set[str],
    fetch_http: Callable[[str], HttpResult | None],
) -> list[Finding]:
    if zone is None:
        return []
    findings: list[Finding] = []
    for host, rdata in zone.iter_records("CNAME"):
        subject = to_ascii(host)
        if subject in allowlist:
            continue
        target = to_ascii(rdata.target.to_text().rstrip("."))
        lower_target = target.lower()
        for provider in fingerprints.matching(lower_target):
            result = fetch_http(lower_target)
            if result is None:
                continue
            if any(snippet in result.body for snippet in provider.body_substrings):
                detail = (
                    f"CNAME {to_unicode(subject)} -> {to_unicode(target)} responds with body "
                    f"matching {provider.name}."
                )
                findings.append(
                    Finding(
                        rule="DANGLING-CNAME",
                        severity="high",
                        subject=to_unicode(subject),
                        evidence=Evidence(detail=detail, http_status=result.status),
                        confidence="medium",
                        remediation="Reclaim or remove the dangling CNAME to prevent takeover.",
                    )
                )
    return findings
