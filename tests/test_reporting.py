from __future__ import annotations

import datetime as dt

from dns_hygiene_guard.config_loader import ReportingConfig
from dns_hygiene_guard.models import Evidence, Finding, Report
from dns_hygiene_guard.reporting.markdown import render_markdown


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
    ja = render_markdown(report, ReportingConfig(language="ja", date_format="%Y-%m-%d"))
    en = render_markdown(report, ReportingConfig(language="en", date_format="%Y-%m-%d"))
    assert "重大度" in ja
    assert "Severity" in en
    assert "DNS Hygiene Guard レポート" in ja
    assert "DNS Hygiene Guard Report" in en
