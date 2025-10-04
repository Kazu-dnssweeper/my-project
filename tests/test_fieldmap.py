from __future__ import annotations

import json
from pathlib import Path
from textwrap import dedent

from dns_hygiene_guard.idn import to_unicode
from dns_hygiene_guard.logs.ingest import _extract_with_fieldmaps, load_fieldmaps


def test_regex_fieldmap(tmp_path: Path) -> None:
    mapping = tmp_path / "regex.yaml"
    mapping.write_text(
        dedent(
            r"""
            type: regex
            pattern: 'host=(?P<host>[^\s]+).*?dst=(?P<dst>[0-9a-fA-F\.:]+)'
            fields:
              fqdn: '{host}'
              ip: '{dst}'
            timestamp:
              regex: '(?P<ts>\d{2}/[A-Za-z]{3}/\d{4}:\d{2}:\d{2}:\d{2} [+-]\d{4})'
              strptime: '%d/%b/%Y:%H:%M:%S %z'
            idn_normalize: true
            """
        )
    )
    line = "host=www.例え.テスト something dst=203.0.113.10 30/Sep/2025:03:12:34 +0000"
    mappings = load_fieldmaps(tmp_path)
    fqdn, ip, ts = _extract_with_fieldmaps(line, mappings)
    assert fqdn == "www.xn--r8jz45g.xn--zckzah"
    assert to_unicode(fqdn) == "www.例え.テスト"
    assert ip == "203.0.113.10"
    assert ts is not None and ts.tzinfo is not None


def test_json_fieldmap(tmp_path: Path) -> None:
    mapping = tmp_path / "json.yaml"
    mapping.write_text(
        dedent(
            """
            type: json
            json_paths:
              fqdn: 'request.host'
              ip: 'dst.ip'
              ts: '@timestamp'
            idn_normalize: true
            """
        )
    )
    payload = {
        "request": {"host": "api.例え.テスト"},
        "dst": {"ip": "203.0.113.20"},
        "@timestamp": "2025-09-30T03:12:34Z",
    }
    line = json.dumps(payload)
    mappings = load_fieldmaps(tmp_path)
    fqdn, ip, ts = _extract_with_fieldmaps(line, mappings)
    assert fqdn == "api.xn--r8jz45g.xn--zckzah"
    assert to_unicode(fqdn) == "api.例え.テスト"
    assert ip == "203.0.113.20"
    assert ts is not None and ts.tzinfo is not None
