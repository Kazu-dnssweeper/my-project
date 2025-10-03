"""Log ingestion for zero-traffic analysis (FR-09)."""

from __future__ import annotations

import datetime as dt
import gzip
import pathlib
import re
from collections import defaultdict
from typing import Iterable
from zoneinfo import ZoneInfo

from ..config_loader import LogSource
from ..idn import to_ascii

_LOG_DATE_RE = re.compile(r"\[(?P<timestamp>[^]]+)\]")
_LOG_TIMESTAMP_FORMATS = [
    "%d/%b/%Y:%H:%M:%S %z",
    "%Y-%m-%dT%H:%M:%S%z",
]

_FIELD_RE = re.compile(r"(host|sni|server|dst|dst_ip)=([^\s]+)")


def _parse_timestamp(line: str) -> dt.datetime | None:
    match = _LOG_DATE_RE.search(line)
    if not match:
        return None
    raw = match.group("timestamp")
    for fmt in _LOG_TIMESTAMP_FORMATS:
        try:
            return dt.datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return None


def _normalise_fields(line: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    for key, value in _FIELD_RE.findall(line):
        fields[key] = value
    return fields


def _read_lines(path: pathlib.Path) -> Iterable[str]:
    if path.suffix == ".gz":
        with gzip.open(path, "rt", encoding="utf-8", errors="ignore") as handle:
            yield from handle
    else:
        with path.open("r", encoding="utf-8", errors="ignore") as handle:
            yield from handle


def ingest_sources(
    sources: Iterable[LogSource],
    root: pathlib.Path,
    timezone: str = "UTC",
) -> dict[str, dict[str, set[str]]]:
    """Return mapping of date -> {"hosts": set, "ips": set}."""

    usage: dict[str, dict[str, set[str]]] = defaultdict(lambda: {"hosts": set(), "ips": set()})
    tzinfo = _safe_zoneinfo(timezone)
    for source in sources:
        for raw_path in source.paths:
            for path in root.glob(raw_path):
                for line in _read_lines(path):
                    timestamp = _parse_timestamp(line)
                    if not timestamp:
                        continue
                    if timestamp.tzinfo is None:
                        timestamp = timestamp.replace(tzinfo=tzinfo)
                    timestamp = timestamp.astimezone(dt.timezone.utc)
                    day = timestamp.date().isoformat()
                    fields = _normalise_fields(line)
                    host = fields.get("host") or fields.get("sni")
                    if host:
                        usage[day]["hosts"].add(to_ascii(host))
                    dest_ip = fields.get("server") or fields.get("dst") or fields.get("dst_ip")
                    if dest_ip:
                        usage[day]["ips"].add(dest_ip)
    return usage


def _safe_zoneinfo(tz_name: str) -> dt.tzinfo:
    try:
        return ZoneInfo(tz_name)
    except Exception:  # pragma: no cover - fallback to UTC
        return dt.timezone.utc
