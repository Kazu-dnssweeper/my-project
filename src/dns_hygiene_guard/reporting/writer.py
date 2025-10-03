"""Utilities to persist reports to disk."""

from __future__ import annotations

import json
import pathlib

from ..models import Report


def save_report(directory: pathlib.Path, report: Report, markdown: str) -> None:
    json_path = directory / "report.json"
    md_path = directory / "report.md"
    with json_path.open("w", encoding="utf-8") as handle:
        json.dump(report.to_json(), handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    with md_path.open("w", encoding="utf-8") as handle:
        handle.write(markdown)
        if not markdown.endswith("\n"):
            handle.write("\n")
