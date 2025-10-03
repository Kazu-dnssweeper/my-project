"""Markdown rendering for reports."""

from __future__ import annotations

import datetime as dt
from zoneinfo import ZoneInfo

from ..config_loader import ReportingConfig
from ..models import Report


def _safe_zoneinfo(tz_name: str) -> dt.tzinfo:
    try:
        return ZoneInfo(tz_name)
    except Exception:  # pragma: no cover - fallback in case tz database missing
        return dt.timezone.utc


def render_markdown(
    report: Report,
    reporting: ReportingConfig,
    timezone: str = "UTC",
) -> str:
    locale = _Locale.for_code(reporting.language)
    tzinfo = _safe_zoneinfo(timezone)
    timestamp = report.generated_at.astimezone(tzinfo)
    date_str = timestamp.strftime(reporting.date_format)
    lines: list[str] = []
    lines.append(locale.header_title(date_str))
    lines.append("")
    lines.append(locale.summary(len(report.targets), len(report.findings)))
    lines.append("")
    if not report.findings:
        lines.append(locale.no_findings)
        return "\n".join(lines)
    for finding in report.findings:
        lines.append(locale.finding_title(finding.rule, finding.subject))
        lines.append(locale.kv("severity", finding.severity))
        lines.append(locale.kv("confidence", finding.confidence))
        if finding.remediation:
            lines.append(locale.kv("remediation", finding.remediation))
        if finding.references:
            joined = ", ".join(finding.references)
            lines.append(locale.kv("references", joined))
        lines.append("")
        lines.append("```")
        lines.append(finding.evidence.detail)
        lines.append("```")
        lines.append("")
    return "\n".join(lines)


class _Locale:
    def __init__(self, code: str | None = None) -> None:
        self.code = code or ""

    @staticmethod
    def for_code(code: str) -> "_Locale":
        return _Locale_EN() if code == "en" else _Locale_JA()

    def header_title(self, timestamp_str: str) -> str:  # pragma: no cover - overridden
        raise NotImplementedError

    def summary(self, total_targets: int, total_findings: int) -> str:
        raise NotImplementedError

    @property
    def no_findings(self) -> str:
        raise NotImplementedError

    def finding_title(self, rule: str, subject: str) -> str:
        raise NotImplementedError

    def kv(self, key: str, value: str) -> str:
        raise NotImplementedError


class _Locale_JA(_Locale):
    def __init__(self) -> None:
        super().__init__("ja")

    def header_title(self, timestamp_str: str) -> str:
        return f"# DNS Hygiene Guard レポート ({timestamp_str})"

    def summary(self, total_targets: int, total_findings: int) -> str:
        return f"対象: {total_targets} 件 / 検出: {total_findings} 件"

    @property
    def no_findings(self) -> str:
        return "検出はありませんでした。"

    def finding_title(self, rule: str, subject: str) -> str:
        return f"## {rule} — {subject}"

    def kv(self, key: str, value: str) -> str:
        labels = {
            "severity": "重大度",
            "confidence": "確信度",
            "remediation": "推奨対応",
            "references": "参考資料",
        }
        label = labels.get(key, key)
        return f"- {label}: {value}"


class _Locale_EN(_Locale):
    def __init__(self) -> None:
        super().__init__("en")

    def header_title(self, timestamp_str: str) -> str:
        return f"# DNS Hygiene Guard Report ({timestamp_str})"

    def summary(self, total_targets: int, total_findings: int) -> str:
        return f"Targets: {total_targets} / Findings: {total_findings}"

    @property
    def no_findings(self) -> str:
        return "No findings detected."

    def finding_title(self, rule: str, subject: str) -> str:
        return f"## {rule} — {subject}"

    def kv(self, key: str, value: str) -> str:
        labels = {
            "severity": "Severity",
            "confidence": "Confidence",
            "remediation": "Remediation",
            "references": "References",
        }
        label = labels.get(key, key.title())
        return f"- {label}: {value}"
