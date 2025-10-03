"""HTTP probing helpers used by dangling CNAME detection."""

from __future__ import annotations

import dataclasses
from pathlib import Path


@dataclasses.dataclass(slots=True)
class HttpResult:
    status: int
    body: str


class FileHttpFetcher:
    """Reads canned HTTP bodies from a manifest for offline demos/tests."""

    def __init__(self, manifest: Path, base_dir: Path | None = None) -> None:
        import json

        self.base_dir = base_dir or manifest.parent
        with manifest.open("r", encoding="utf-8") as handle:
            self.mapping: dict[str, str] = json.load(handle)

    def fetch(self, host: str) -> HttpResult | None:
        relative = self.mapping.get(host)
        if not relative:
            return None
        body_path = self.base_dir / relative
        if not body_path.exists():
            return None
        with body_path.open("r", encoding="utf-8") as handle:
            body = handle.read()
        return HttpResult(status=404, body=body)
