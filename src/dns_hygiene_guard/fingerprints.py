"""Fingerprint loading for dangling CNAME detection."""

from __future__ import annotations

import dataclasses
import json
import pathlib
from typing import Iterable


@dataclasses.dataclass(slots=True)
class Fingerprint:
    name: str
    cname_suffixes: tuple[str, ...]
    body_substrings: tuple[str, ...]

    def matches_cname(self, target: str) -> bool:
        return any(target.endswith(suffix) for suffix in self.cname_suffixes)


@dataclasses.dataclass(slots=True)
class Fingerprints:
    providers: tuple[Fingerprint, ...]

    @staticmethod
    def load(path: pathlib.Path) -> "Fingerprints":
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        providers: list[Fingerprint] = []
        for entry in data.get("providers", []):
            providers.append(
                Fingerprint(
                    name=entry["name"],
                    cname_suffixes=tuple(entry.get("cname_suffixes", [])),
                    body_substrings=tuple(entry.get("body_substrings", [])),
                )
            )
        return Fingerprints(tuple(providers))

    def matching(self, target: str) -> Iterable[Fingerprint]:
        lowered = target.lower()
        for provider in self.providers:
            if provider.matches_cname(lowered):
                yield provider
