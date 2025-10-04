from __future__ import annotations

import datetime as dt
import pathlib

import pytest

from dns_hygiene_guard.config_loader import (
    DnsZoneConfig,
    NotifyConfig,
    ReportingConfig,
    RuntimeConfig,
    Settings,
)
from dns_hygiene_guard.models import Evidence, Finding, Report
from dns_hygiene_guard.runner import maybe_notify


def _make_settings(*, slack: dict | None = None, email: dict | None = None) -> Settings:
    return Settings(
        window_days=30,
        logs=[],
        dns=DnsZoneConfig(mode="targets_file", paths=[], allowed_online_axfr=[]),
        notify=NotifyConfig(slack=slack or {}, email=email or {}),
        runtime=RuntimeConfig(concurrency=1, timeout_sec=1, retries=1, timezone="UTC"),
        report_dir=pathlib.Path("."),
        reporting=ReportingConfig(language="en", date_format="%Y-%m-%d"),
    )


def _make_report(has_findings: bool) -> Report:
    findings: list[Finding] = []
    if has_findings:
        findings.append(
            Finding(
                rule="MX-NXDOMAIN",
                severity="high",
                subject="dead.example",
                evidence=Evidence(detail="MX points to nowhere"),
            )
        )
    return Report(
        generated_at=dt.datetime(2025, 10, 1, tzinfo=dt.timezone.utc),
        window_days=30,
        targets=["example"],
        findings=findings,
    )


def test_maybe_notify_posts_to_slack(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[str, str]] = []

    def fake_send(url: str, text: str, timeout: int = 10) -> int:
        calls.append((url, text))
        return 200

    monkeypatch.setattr("dns_hygiene_guard.runner.slack_send", fake_send)
    settings = _make_settings(
        slack={
            "enabled": True,
            "webhook_url": "https://hooks.slack.test/T000/B000/KEY",
            "only_when_findings": True,
        }
    )
    report = _make_report(has_findings=True)

    maybe_notify(settings, report)

    assert calls
    url, summary = calls[0]
    assert url == "https://hooks.slack.test/T000/B000/KEY"
    assert summary.startswith("DNS Hygiene: 1 findings")
    assert "MX-NXDOMAIN" in summary


def test_maybe_notify_skips_slack_when_no_findings(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[str, str]] = []

    def fake_send(url: str, text: str, timeout: int = 10) -> int:
        calls.append((url, text))
        return 200

    monkeypatch.setattr("dns_hygiene_guard.runner.slack_send", fake_send)
    settings = _make_settings(
        slack={
            "enabled": True,
            "webhook_url": "https://hooks.slack.test/T000/B000/KEY",
            "only_when_findings": True,
        }
    )
    report = _make_report(has_findings=False)

    maybe_notify(settings, report)

    assert not calls


def test_maybe_notify_email_requires_complete_config() -> None:
    settings = _make_settings(email={"enabled": True})
    report = _make_report(has_findings=True)

    with pytest.raises(RuntimeError):
        maybe_notify(settings, report)


def test_maybe_notify_sends_email(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: list[tuple[dict, str, str]] = []

    def fake_email_send(config: dict, subject: str, body: str) -> None:
        captured.append((config, subject, body))

    monkeypatch.setattr("dns_hygiene_guard.runner.email_send", fake_email_send)
    settings = _make_settings(
        email={
            "enabled": True,
            "smtp_host": "smtp.test",
            "smtp_port": 2525,
            "use_tls": False,
            "from": "dns@example.test",
            "to": ["ops@example.test"],
            "only_when_findings": True,
        }
    )
    report = _make_report(has_findings=True)

    maybe_notify(settings, report)

    assert captured
    cfg, subject, body = captured[0]
    assert subject == "DNS Hygiene Report"
    assert cfg["smtp_host"] == "smtp.test"
    assert body.startswith("DNS Hygiene: 1 findings")
    assert "MX-NXDOMAIN" in body
