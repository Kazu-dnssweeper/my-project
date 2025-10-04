from __future__ import annotations

import datetime as dt

from dns_hygiene_guard.config_loader import ReportingConfig
from dns_hygiene_guard.models import Evidence, Finding, Report
from dns_hygiene_guard.reporting.markdown import render_markdown, render_unused_markdown


def test_render_markdown_bilingual() -> None:
    report = Report(
        generated_at=dt.datetime(2025, 9, 1, tzinfo=dt.timezone.utc),
        window_days=30,
        targets=["demo"],
        findings=[
            Finding(
                rule="MX-CNAME",
                severity="medium",
                subject="demo.example",
                evidence=Evidence(detail="sample evidence"),
                confidence="medium",
                remediation="fix",
            )
        ],
    )
    report.ingest_stats = {
        "total_lines": 10,
        "matched_fieldmap": 6,
        "matched_fallback": 3,
        "unmatched": 1,
    }
    unused_fqdns = ["fastly.demo-public.test"]
    unused_ips = ["93.184.216.34"]
    ja = render_markdown(
        report,
        ReportingConfig(language="ja", date_format="%Y-%m-%d"),
        include_unused_section=True,
        unused_fqdns=unused_fqdns,
        unused_ips=unused_ips,
    )
    en = render_markdown(
        report,
        ReportingConfig(language="en", date_format="%Y-%m-%d"),
        include_unused_section=True,
        unused_fqdns=unused_fqdns,
        unused_ips=unused_ips,
    )
    assert "重大度" in ja
    assert "Severity" in en
    assert "DNS Hygiene Guard レポート" in ja
    assert "DNS Hygiene Guard Report" in en
    assert "実行統計" in ja
    assert "Run Statistics" in en
    assert "未使用リソースサマリ" in ja
    assert "Unused Resource Summary" in en


def test_report_json_contains_ingest_stats() -> None:
    report = Report(
        generated_at=dt.datetime(2025, 9, 1, tzinfo=dt.timezone.utc),
        window_days=30,
        targets=[],
        findings=[],
        ingest_stats={"total_lines": 5},
    )
    data = report.to_json()
    assert data.get("ingest_stats") == {"total_lines": 5}


def test_render_unused_markdown_generates_lists() -> None:
    report = Report(
        generated_at=dt.datetime(2025, 9, 1, tzinfo=dt.timezone.utc),
        window_days=30,
        targets=["demo"],
        findings=[],
    )
    output = render_unused_markdown(
        report,
        ReportingConfig(language="en", date_format="%Y-%m-%d"),
        timezone="UTC",
        unused_fqdns=["foo.example"],
        unused_ips=["192.0.2.1"],
    )
    assert "# Unused Resource Summary" in output
    assert "## Unused FQDNs" in output
    assert "foo.example" in output
    assert "192.0.2.1" in output
