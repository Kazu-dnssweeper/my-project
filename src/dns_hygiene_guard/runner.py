"""High-level orchestration for DNS Hygiene Guard runs."""

from __future__ import annotations

import datetime as dt
import pathlib

from . import zones
from .config_loader import Settings, load_settings
from .fingerprints import Fingerprints
from .logs import ingest as log_ingest
from .logs.index import UsageIndex, usage_file_path
from .models import Finding, Report
from .prober import FileHttpFetcher
from .reporting.markdown import render_markdown
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
        batch = log_ingest.ingest_sources(
            self.settings.logs,
            self.base_dir,
            timezone=self.settings.runtime.timezone,
        )
        if batch:
            usage_index.update_from_batch(batch)
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
    report_dir = settings.report_dir
    report_dir.mkdir(parents=True, exist_ok=True)
    markdown = render_markdown(
        report,
        settings.reporting,
        timezone=settings.runtime.timezone,
    )
    save_report(report_dir, report, markdown)
    usage_index_path = usage_file_path(report_dir)
    usage_index.save(usage_index_path)
    return report, settings
