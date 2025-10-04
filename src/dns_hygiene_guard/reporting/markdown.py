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
    *,
    include_unused_section: bool = False,
    unused_fqdns: list[str] | None = None,
    unused_ips: list[str] | None = None,
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
    if include_unused_section:
        unused_fqdns = sorted(unused_fqdns or [])
        unused_ips = sorted(unused_ips or [])
        lines.extend(
            _render_unused_section(
                locale,
                unused_fqdns,
                unused_ips,
                heading_level=3,
            )
        )
    if report.ingest_stats:
        lines.append(locale.stats_heading)
        for key, value in sorted(report.ingest_stats.items()):
            pretty_key = locale.stats_label(key)
            lines.append(f"- {pretty_key}: {value}")
        lines.append("")
    return "\n".join(lines)


def render_unused_markdown(
    report: Report,
    reporting: ReportingConfig,
    timezone: str,
    unused_fqdns: list[str],
    unused_ips: list[str],
) -> str:
    locale = _Locale.for_code(reporting.language)
    tzinfo = _safe_zoneinfo(timezone)
    timestamp = report.generated_at.astimezone(tzinfo)
    date_str = timestamp.strftime(reporting.date_format)
    lines: list[str] = []
    lines.append(locale.unused_section_title(heading_level=1))
    lines.append("")
    lines.append(locale.unused_generated_line(date_str))
    lines.append("")
    lines.extend(
        _render_unused_section(
            locale,
            sorted(unused_fqdns),
            sorted(unused_ips),
            heading_level=2,
            show_title=False,
        )
    )
    return "\n".join(lines)


def _render_unused_section(
    locale: "_Locale",
    unused_fqdns: list[str],
    unused_ips: list[str],
    *,
    heading_level: int,
    show_title: bool = True,
) -> list[str]:
    lines: list[str] = []
    if show_title:
        lines.append(locale.unused_section_title(heading_level))
    lines.append(locale.unused_summary_intro(len(unused_fqdns), len(unused_ips)))
    lines.append("")
    lines.append(locale.unused_fqdns_heading(heading_level + 1))
    if unused_fqdns:
        lines.extend(f"- {host}" for host in unused_fqdns)
    else:
        lines.append(locale.unused_none)
    lines.append("")
    lines.append(locale.unused_ips_heading(heading_level + 1))
    if unused_ips:
        lines.extend(f"- {ip}" for ip in unused_ips)
    else:
        lines.append(locale.unused_none)
    lines.append("")
    return lines


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

    def unused_section_title(self, heading_level: int) -> str:
        raise NotImplementedError

    def unused_fqdns_heading(self, heading_level: int) -> str:
        raise NotImplementedError

    def unused_ips_heading(self, heading_level: int) -> str:
        raise NotImplementedError

    def unused_summary_intro(self, fqdn_count: int, ip_count: int) -> str:
        raise NotImplementedError

    @property
    def unused_none(self) -> str:
        raise NotImplementedError

    def unused_generated_line(self, timestamp_str: str) -> str:
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

    @property
    def stats_heading(self) -> str:
        return "### 実行統計"

    def stats_label(self, key: str) -> str:
        mapping = {
            "total_lines": "ログ行数",
            "matched_fieldmap": "fieldmapマッチ",
            "matched_fallback": "フォールバックマッチ",
            "unmatched": "未マッチ"
        }
        return mapping.get(key, key)

    def unused_section_title(self, heading_level: int) -> str:
        return f"{'#' * heading_level} 未使用リソースサマリ"

    def unused_fqdns_heading(self, heading_level: int) -> str:
        return f"{'#' * heading_level} 未使用FQDN"

    def unused_ips_heading(self, heading_level: int) -> str:
        return f"{'#' * heading_level} 未使用IP"

    def unused_summary_intro(self, fqdn_count: int, ip_count: int) -> str:
        return f"未使用FQDN {fqdn_count} 件 / 未使用IP {ip_count} 件"

    @property
    def unused_none(self) -> str:
        return "(該当なし)"

    def unused_generated_line(self, timestamp_str: str) -> str:
        return f"_生成日時: {timestamp_str}_"


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

    @property
    def stats_heading(self) -> str:
        return "### Run Statistics"

    def stats_label(self, key: str) -> str:
        mapping = {
            "total_lines": "Total lines",
            "matched_fieldmap": "Matched by fieldmap",
            "matched_fallback": "Matched by fallback",
            "unmatched": "Unmatched",
        }
        return mapping.get(key, key.replace("_", " ").title())

    def unused_section_title(self, heading_level: int) -> str:
        return f"{'#' * heading_level} Unused Resource Summary"

    def unused_fqdns_heading(self, heading_level: int) -> str:
        return f"{'#' * heading_level} Unused FQDNs"

    def unused_ips_heading(self, heading_level: int) -> str:
        return f"{'#' * heading_level} Unused IPs"

    def unused_summary_intro(self, fqdn_count: int, ip_count: int) -> str:
        return f"Unused FQDNs: {fqdn_count} / Unused IPs: {ip_count}"

    @property
    def unused_none(self) -> str:
        return "(none)"

    def unused_generated_line(self, timestamp_str: str) -> str:
        return f"_Generated at: {timestamp_str}_"
