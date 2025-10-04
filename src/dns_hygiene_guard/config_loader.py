"""Configuration loading utilities for DNS Hygiene Guard."""

from __future__ import annotations

import dataclasses
import pathlib
from typing import Any

import yaml

from .idn import to_ascii


@dataclasses.dataclass(slots=True)
class LogSource:
    name: str
    type: str
    paths: list[str]
    format: str | None = None


@dataclasses.dataclass(slots=True)
class DnsZoneConfig:
    mode: str
    paths: list[str]
    allowed_online_axfr: list[str]


@dataclasses.dataclass(slots=True)
class NotifyConfig:
    slack: dict[str, Any]
    email: dict[str, Any]

    @property
    def has_notifications(self) -> bool:
        return bool(self.slack.get("enabled") or self.email.get("enabled"))


@dataclasses.dataclass(slots=True)
class RuntimeConfig:
    concurrency: int
    timeout_sec: int
    retries: int = 1
    timezone: str = "UTC"


@dataclasses.dataclass(slots=True)
class ReportingConfig:
    language: str
    date_format: str
    sort: str = "severity_then_rule"
    include_unused_in_main: bool = True
    emit_unused_file: bool = False
    unused_filename: str = "unused_report.md"


@dataclasses.dataclass(slots=True)
class Settings:
    window_days: int
    logs: list[LogSource]
    dns: DnsZoneConfig
    notify: NotifyConfig
    runtime: RuntimeConfig
    report_dir: pathlib.Path
    reporting: ReportingConfig

    @staticmethod
    def from_mapping(mapping: dict[str, Any], base_dir: pathlib.Path) -> "Settings":
        window_days = int(mapping.get("window_days", 30))
        logs_config = mapping.get("logs", [])
        logs: list[LogSource] = []
        for entry in logs_config:
            logs.append(
                LogSource(
                    name=entry["name"],
                    type=entry["type"],
                    paths=[str(path) for path in entry.get("paths", [])],
                    format=entry.get("format"),
                )
            )
        dns_section = mapping.get("dns", {})
        zone_section = dns_section.get("zone", {})
        dns = DnsZoneConfig(
            mode=zone_section.get("mode", "targets_file"),
            paths=[str(path) for path in zone_section.get("paths", [])],
            allowed_online_axfr=[
                to_ascii(str(item)) for item in zone_section.get("allowed_online_axfr", [])
            ],
        )
        notify_section = mapping.get("notify", {})
        notify = NotifyConfig(
            slack=notify_section.get("slack", {}),
            email=notify_section.get("email", {}),
        )
        runtime_section = mapping.get("runtime", {})
        runtime = RuntimeConfig(
            concurrency=int(runtime_section.get("concurrency", 8)),
            timeout_sec=int(runtime_section.get("timeout_sec", 5)),
            retries=int(runtime_section.get("retries", 1)),
            timezone=runtime_section.get("timezone", "UTC"),
        )
        report_dir_value = mapping.get("report_dir")
        if report_dir_value:
            report_dir = pathlib.Path(report_dir_value)
            if not report_dir.is_absolute():
                report_dir = base_dir / report_dir
        else:
            report_dir = base_dir / "reports"
        reporting_section = mapping.get("reporting", {})
        language = (reporting_section.get("language") or "ja").lower()
        if language not in {"ja", "en"}:
            language = "ja"
        date_format = reporting_section.get("date_format") or "%Y-%m-%d %H:%M:%S %Z"
        sort_mode = reporting_section.get("sort", "severity_then_rule")
        include_unused = reporting_section.get("include_unused_in_main", True)
        emit_unused = reporting_section.get("emit_unused_file", False)
        unused_filename = reporting_section.get("unused_filename", "unused_report.md")
        reporting = ReportingConfig(
            language=language,
            date_format=date_format,
            sort=sort_mode,
            include_unused_in_main=bool(include_unused),
            emit_unused_file=bool(emit_unused),
            unused_filename=str(unused_filename),
        )
        return Settings(
            window_days=window_days,
            logs=logs,
            dns=dns,
            notify=notify,
            runtime=runtime,
            report_dir=report_dir,
            reporting=reporting,
        )


def load_settings(path: pathlib.Path) -> Settings:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    return Settings.from_mapping(data, base_dir=path.parent)
