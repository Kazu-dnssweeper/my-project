"""Log ingestion for zero-traffic analysis (FR-09)."""

from __future__ import annotations

import datetime as dt
import gzip
import json
import pathlib
import re
from collections import defaultdict
from dataclasses import dataclass
from typing import Iterable
from zoneinfo import ZoneInfo

import yaml

from ..config_loader import LogSource
from ..idn import to_ascii

_LOG_DATE_RE = re.compile(r"\[(?P<timestamp>[^]]+)\]")
_LOG_TIMESTAMP_FORMATS = [
    "%d/%b/%Y:%H:%M:%S %z",
    "%Y-%m-%dT%H:%M:%S%z",
]

_FIELD_RE = re.compile(r"(host|sni|server|dst|dst_ip)=([^\s]+)")


@dataclass(slots=True)
class FieldMap:
    """Representation of a field mapping rule."""

    type: str  # "regex" or "json"
    name: str
    pattern: re.Pattern | None = None
    fields: dict[str, str] | None = None
    ts_group: str | None = None
    ts_format: str | None = None
    timestamp_regex: re.Pattern | None = None
    json_paths: dict[str, str] | None = None
    tz_assume: dt.tzinfo | None = None
    idn_normalize: bool = True


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


def load_fieldmaps(directory: pathlib.Path) -> list[FieldMap]:
    mappings: list[FieldMap] = []
    if not directory.exists():
        return mappings
    for path in sorted(directory.glob("*.yaml")):
        with path.open("r", encoding="utf-8") as handle:
            config = yaml.safe_load(handle) or {}
        map_type = str(config.get("type", "regex")).lower()
        mapping = FieldMap(type=map_type, name=path.name)
        mapping.idn_normalize = bool(config.get("idn_normalize", True))
        tz_name = config.get("tz_assume")
        mapping.tz_assume = _safe_zoneinfo(tz_name) if tz_name else None

        if map_type == "regex":
            pattern = config.get("pattern")
            if not pattern:
                continue
            mapping.pattern = re.compile(pattern)
            mapping.fields = config.get("fields", {})
            ts_conf = config.get("timestamp", {})
            if ts_conf:
                group = ts_conf.get("group", "ts")
                regex_pattern = ts_conf.get("regex")
                fmt = ts_conf.get("strptime")
                if regex_pattern and fmt:
                    mapping.timestamp_regex = re.compile(regex_pattern)
                    mapping.ts_group = group
                    mapping.ts_format = fmt
        elif map_type == "json":
            paths = config.get("json_paths") or config.get("paths", {})
            if not isinstance(paths, dict) or "fqdn" not in paths:
                continue
            mapping.json_paths = {k: str(v) for k, v in paths.items()}
        mappings.append(mapping)
    return mappings


def _extract_via_regex(
    line: str, mapping: FieldMap
) -> tuple[str | None, str | None, dt.datetime | None]:
    if not mapping.pattern:
        return None, None, None
    match = mapping.pattern.search(line)
    if not match:
        return None, None, None
    groups = match.groupdict()
    fqdn_tpl = (mapping.fields or {}).get("fqdn")
    ip_tpl = (mapping.fields or {}).get("ip")
    fqdn = fqdn_tpl.format(**groups) if fqdn_tpl else None
    ip = ip_tpl.format(**groups) if ip_tpl else None

    timestamp: dt.datetime | None = None
    if mapping.timestamp_regex and mapping.ts_format:
        ts_match = mapping.timestamp_regex.search(line)
        if ts_match:
            raw_ts = ts_match.group(mapping.ts_group or "ts")
            timestamp = _parse_with_format(raw_ts, mapping.ts_format, mapping.tz_assume)

    return fqdn, ip, timestamp


def _get_by_dotted_path(obj: dict, path: str) -> str | None:
    current = obj
    for key in path.split("."):
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return None
    if isinstance(current, (str, int, float)):
        return str(current)
    return None


def _extract_via_json(
    line: str, mapping: FieldMap
) -> tuple[str | None, str | None, dt.datetime | None]:
    if not mapping.json_paths:
        return None, None, None
    try:
        payload = json.loads(line)
    except json.JSONDecodeError:
        return None, None, None
    fqdn = _get_by_dotted_path(payload, mapping.json_paths.get("fqdn", ""))
    ip = (
        _get_by_dotted_path(payload, mapping.json_paths.get("ip", ""))
        if mapping.json_paths.get("ip")
        else None
    )
    raw_ts = (
        _get_by_dotted_path(payload, mapping.json_paths.get("ts", ""))
        if mapping.json_paths.get("ts")
        else None
    )

    timestamp = None
    if raw_ts:
        timestamp = _parse_isoformat(raw_ts, mapping.tz_assume)

    return fqdn, ip, timestamp


def _extract_with_fieldmaps(
    line: str, mappings: list[FieldMap]
) -> tuple[str | None, str | None, dt.datetime | None]:
    for mapping in mappings:
        if mapping.type == "regex":
            fqdn, ip, ts = _extract_via_regex(line, mapping)
        elif mapping.type == "json":
            fqdn, ip, ts = _extract_via_json(line, mapping)
        else:
            continue

        if fqdn:
            fqdn = to_ascii(fqdn) if mapping.idn_normalize else fqdn.strip().rstrip(".")
        if fqdn or ip:
            return fqdn, ip, ts
    return None, None, None


def ingest_sources(
    sources: Iterable[LogSource],
    root: pathlib.Path,
    timezone: str = "UTC",
) -> tuple[dict[str, dict[str, set[str]]], dict[str, int]]:
    """Return mapping of date -> {"hosts": set, "ips": set}."""

    usage: dict[str, dict[str, set[str]]] = defaultdict(lambda: {"hosts": set(), "ips": set()})
    tzinfo = _safe_zoneinfo(timezone)
    fieldmaps = load_fieldmaps(root / "fieldmap")
    total_lines = 0
    matched_fieldmap = 0
    matched_fallback = 0

    for source in sources:
        for raw_path in source.paths:
            for path in root.glob(raw_path):
                for line in _read_lines(path):
                    total_lines += 1
                    fqdn = ip = None
                    timestamp: dt.datetime | None = None
                    fieldmap_hit = False
                    fallback_hit = False

                    if fieldmaps:
                        fqdn, ip, timestamp = _extract_with_fieldmaps(line, fieldmaps)
                        if fqdn or ip:
                            matched_fieldmap += 1
                            fieldmap_hit = True

                    if not timestamp:
                        timestamp = _parse_timestamp(line)
                    if not timestamp:
                        continue
                    if timestamp.tzinfo is None:
                        timestamp = timestamp.replace(tzinfo=tzinfo)
                    timestamp = timestamp.astimezone(dt.timezone.utc)

                    day = timestamp.date().isoformat()
                    entry = usage[day]

                    if fqdn:
                        entry["hosts"].add(fqdn)
                    if ip:
                        entry["ips"].add(ip)

                    if fieldmap_hit and (fqdn or ip):
                        continue

                    fields = _normalise_fields(line)
                    host_field = fields.get("host") or fields.get("sni")
                    if host_field:
                        ascii_host = to_ascii(host_field)
                        entry["hosts"].add(ascii_host)
                        fallback_hit = True
                    dest_ip = fields.get("server") or fields.get("dst") or fields.get("dst_ip")
                    if dest_ip:
                        entry["ips"].add(dest_ip)
                        fallback_hit = True
                    if fallback_hit and not fieldmap_hit:
                        matched_fallback += 1
    stats = {
        "total_lines": total_lines,
        "matched_fieldmap": matched_fieldmap,
        "matched_fallback": matched_fallback,
        "unmatched": max(total_lines - matched_fieldmap - matched_fallback, 0),
    }
    return usage, stats


def _parse_with_format(value: str, fmt: str, tz_assume: dt.tzinfo | None) -> dt.datetime | None:
    try:
        parsed = dt.datetime.strptime(value, fmt)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=tz_assume or dt.timezone.utc)
    return parsed.astimezone(dt.timezone.utc)


def _parse_isoformat(value: str, tz_assume: dt.tzinfo | None) -> dt.datetime | None:
    try:
        # handle Z suffix
        if value.endswith("Z"):
            value = value[:-1] + "+00:00"
        parsed = dt.datetime.fromisoformat(value)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=tz_assume or dt.timezone.utc)
    return parsed.astimezone(dt.timezone.utc)


def _safe_zoneinfo(tz_name: str | None) -> dt.tzinfo:
    if not tz_name:
        return dt.timezone.utc
    try:
        return ZoneInfo(tz_name)
    except Exception:  # pragma: no cover - fallback to UTC
        return dt.timezone.utc
