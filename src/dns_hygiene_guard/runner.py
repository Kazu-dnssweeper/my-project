"""High-level orchestration for DNS Hygiene Guard runs."""

from __future__ import annotations

import datetime as dt
import pathlib

import yaml

from . import zones
from .config_loader import Settings, load_settings
from .fingerprints import Fingerprints
from .logs import ingest as log_ingest
from .logs.index import UsageIndex, usage_file_path
from .models import Finding, Report
from .notify.email import send as email_send
from .notify.slack import send as slack_send
from .prober import FileHttpFetcher
from .reporting.markdown import render_markdown, render_unused_markdown
from .reporting.writer import save_report
from .rules import dangling, static_rules
from .rules import usage as usage_rules


class GuardRunner:
    def __init__(
        self,
        settings: Settings,
        base_dir: pathlib.Path,
        allowlist: set[str] | None = None,
        online_axfr: bool = False,
    ) -> None:
        self.settings = settings
        self.base_dir = base_dir
        self.allowlist = allowlist or set()
        self.online_axfr = online_axfr
        self.ingest_stats: dict[str, int] | None = None

    def run_static_checks(
        self, targets: zones.Targets, zone_data: zones.ZoneData | None = None
    ) -> Report:
        generated_at = dt.datetime.now(dt.timezone.utc)
        findings: list[Finding] = []
        findings.extend(
            static_rules.check_mx_cname(
                targets=targets, zone=zone_data, allowlist=self.allowlist
            )
        )
        findings.extend(
            static_rules.check_mx_nxdomain(
                targets=targets, zone=zone_data, allowlist=self.allowlist
            )
        )
        findings.extend(static_rules.check_spf_lookup(zone=zone_data, allowlist=self.allowlist))
        findings.extend(static_rules.check_private_ip(zone=zone_data, allowlist=self.allowlist))
        findings.extend(static_rules.check_ns_health(zone=zone_data, allowlist=self.allowlist))
        findings.extend(
            static_rules.check_open_axfr(
                zone=zone_data,
                allowlist=self.allowlist,
                online=self.online_axfr,
                runtime=self.settings.runtime,
                allowed_zones=self.settings.dns.allowed_online_axfr,
            )
        )
        report = Report(
            generated_at=generated_at,
            window_days=self.settings.window_days,
            targets=list(targets),
            findings=findings,
        )
        return report

    def run_pro_checks(
        self, zone_data: zones.ZoneData | None
    ) -> tuple[list[Finding], UsageIndex]:
        usage_index_path = usage_file_path(self.settings.report_dir)
        usage_index = UsageIndex.load(usage_index_path, self.settings.window_days)
        usage_batch, stats = log_ingest.ingest_sources(
            self.settings.logs,
            self.base_dir,
            timezone=self.settings.runtime.timezone,
        )
        self.ingest_stats = stats
        if usage_batch:
            usage_index.update_from_batch(usage_batch)
        findings: list[Finding] = []
        findings.extend(usage_rules.detect_unused_fqdns(zone_data, usage_index, self.allowlist))
        findings.extend(usage_rules.detect_unused_ips(zone_data, usage_index, self.allowlist))

        fingerprint_path = self.base_dir / "fingerprints.json"
        manifest_candidates = [
            self.base_dir / "http" / "manifest.json",
            self.base_dir.parent / "http" / "manifest.json",
        ]
        manifest_path = next((path for path in manifest_candidates if path.exists()), None)
        if zone_data and fingerprint_path.exists() and manifest_path:
            fingerprints = Fingerprints.load(fingerprint_path)
            fetcher = FileHttpFetcher(manifest_path)
            findings.extend(
                dangling.detect_dangling_cnames(
                    zone=zone_data,
                    fingerprints=fingerprints,
                    allowlist=self.allowlist,
                    fetch_http=fetcher.fetch,
                )
            )
        return findings, usage_index


def run_from_config(
    config_path: pathlib.Path,
    targets: zones.Targets,
    zone: zones.ZoneData | None,
    allowlist: set[str] | None = None,
    online_axfr: bool = False,
) -> tuple[Report, Settings]:
    settings = load_settings(config_path)
    runner = GuardRunner(
        settings=settings,
        base_dir=config_path.parent,
        allowlist=allowlist,
        online_axfr=online_axfr,
    )
    report = runner.run_static_checks(targets=targets, zone_data=zone)
    pro_findings, usage_index = runner.run_pro_checks(zone)
    report.findings.extend(pro_findings)
    if runner.ingest_stats:
        report.ingest_stats = runner.ingest_stats
    severity_path = runner.base_dir / "severity.yaml"
    apply_severity_override(report.findings, severity_path)
    sort_mode = getattr(settings.reporting, "sort", "severity_then_rule")
    report.findings = sort_findings(report.findings, sort_mode)
    report_dir = settings.report_dir
    report_dir.mkdir(parents=True, exist_ok=True)
    unused_fqdns = sorted(
        {finding.subject for finding in report.findings if finding.rule == "UNUSED-FQDN"}
    )
    unused_ips = sorted(
        {finding.subject for finding in report.findings if finding.rule == "UNUSED-IP"}
    )
    markdown = render_markdown(
        report,
        settings.reporting,
        timezone=settings.runtime.timezone,
        include_unused_section=getattr(settings.reporting, "include_unused_in_main", True),
        unused_fqdns=unused_fqdns,
        unused_ips=unused_ips,
    )
    save_report(report_dir, report, markdown)
    if getattr(settings.reporting, "emit_unused_file", False):
        filename = getattr(settings.reporting, "unused_filename", "unused_report.md")
        unused_md = render_unused_markdown(
            report,
            settings.reporting,
            settings.runtime.timezone,
            unused_fqdns,
            unused_ips,
        )
        (report_dir / filename).write_text(unused_md, encoding="utf-8")
    maybe_notify(settings, report)
    usage_index_path = usage_file_path(report_dir)
    usage_index.save(usage_index_path)
    return report, settings


SEVERITY_ORDER = {"low": 0, "medium": 1, "high": 2, "critical": 3}


def apply_severity_override(findings: list[Finding], path: pathlib.Path) -> None:
    if not path.exists():
        return
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except Exception:
        return
    rule_map = data.get("rules", {})
    if not isinstance(rule_map, dict):
        return
    for finding in findings:
        override = rule_map.get(finding.rule)
        if isinstance(override, str):
            finding.severity = override


def sort_findings(findings: list[Finding], mode: str) -> list[Finding]:
    mode = (mode or "severity_then_rule").lower()
    if mode == "rule_then_subject":
        return sorted(findings, key=lambda f: (f.rule, f.subject))
    # default: severity_then_rule
    return sorted(
        findings,
        key=lambda f: (
            -SEVERITY_ORDER.get(f.severity.lower(), 0),
            f.rule,
            f.subject,
        ),
    )


def maybe_notify(settings: Settings, report: Report) -> None:
    notify_cfg = getattr(settings, "notify", None)
    if not notify_cfg:
        return
    findings = report.findings
    summary = _format_summary(findings)

    slack_cfg = notify_cfg.slack if notify_cfg.slack else {}
    if slack_cfg.get("enabled"):
        url = slack_cfg.get("webhook_url", "")
        if not url:
            raise RuntimeError("Slack webhook_url not set (notify.slack.webhook_url)")
        if not (slack_cfg.get("only_when_findings", True) and len(findings) == 0):
            slack_send(url, summary)

    email_cfg = notify_cfg.email if notify_cfg.email else {}
    if email_cfg.get("enabled"):
        required = ["smtp_host", "from", "to"]
        if any(k not in email_cfg or not email_cfg[k] for k in required):
            raise RuntimeError("Email config incomplete (notify.email.*)")
        if not (email_cfg.get("only_when_findings", True) and len(findings) == 0):
            email_send(email_cfg, "DNS Hygiene Report", summary)


def _format_summary(findings: list[Finding]) -> str:
    if not findings:
        return "DNS Hygiene: no findings"
    by_rule: dict[str, int] = {}
    for finding in findings:
        by_rule[finding.rule] = by_rule.get(finding.rule, 0) + 1
    lines = [f"DNS Hygiene: {len(findings)} findings"]
    for rule, count in sorted(by_rule.items()):
        lines.append(f"- {rule}: {count}")
    return "\n".join(lines)
