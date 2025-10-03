"""Datamodels representing findings and report payloads."""

from __future__ import annotations

import dataclasses
import datetime as dt
import uuid


@dataclasses.dataclass(slots=True)
class Evidence:
    detail: str
    http_status: int | None = None
    sample: str | None = None
    last_seen_at: dt.datetime | None = None

    def to_json(self) -> dict[str, str | int | None]:
        return {
            "detail": self.detail,
            "http_status": self.http_status,
            "sample": self.sample,
            "last_seen_at": self.last_seen_at.isoformat() if self.last_seen_at else None,
        }


@dataclasses.dataclass(slots=True)
class Finding:
    rule: str
    severity: str
    subject: str
    evidence: Evidence
    confidence: str = "n/a"
    references: tuple[str, ...] = ()
    remediation: str | None = None
    finding_id: str = dataclasses.field(default_factory=lambda: str(uuid.uuid4()))

    def to_json(self) -> dict[str, object]:
        return {
            "id": self.finding_id,
            "rule": self.rule,
            "severity": self.severity,
            "confidence": self.confidence,
            "subject": self.subject,
            "evidence": self.evidence.to_json(),
            "remediation": self.remediation,
            "references": list(self.references),
        }


@dataclasses.dataclass(slots=True)
class Report:
    generated_at: dt.datetime
    window_days: int
    targets: list[str]
    findings: list[Finding]

    def to_json(self) -> dict[str, object]:
        return {
            "generated_at": self.generated_at.isoformat(),
            "window_days": self.window_days,
            "targets": self.targets,
            "findings": [finding.to_json() for finding in self.findings],
            "stats": {
                "total_targets": len(self.targets),
                "total_findings": len(self.findings),
            },
        }
