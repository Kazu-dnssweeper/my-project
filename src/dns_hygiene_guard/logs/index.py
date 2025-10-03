"""Usage index maintenance (FR-10)."""

from __future__ import annotations

import dataclasses
import json
import pathlib


@dataclasses.dataclass(slots=True)
class UsageIndex:
    window_days: int
    seen_hosts: dict[str, set[str]]
    seen_ips: dict[str, set[str]]

    def update_from_batch(self, batch: dict[str, dict[str, set[str]]]) -> None:
        for day, payload in batch.items():
            hosts = self.seen_hosts.setdefault(day, set())
            hosts.update(payload.get("hosts", set()))
            ips = self.seen_ips.setdefault(day, set())
            ips.update(payload.get("ips", set()))
        self._prune()

    def active_hosts(self) -> set[str]:
        aggregate: set[str] = set()
        for hosts in self.seen_hosts.values():
            aggregate.update(hosts)
        return aggregate

    def active_ips(self) -> set[str]:
        aggregate: set[str] = set()
        for ips in self.seen_ips.values():
            aggregate.update(ips)
        return aggregate

    def _prune(self) -> None:
        if self.window_days <= 0:
            return
        all_days = sorted(self.seen_hosts.keys())
        if len(all_days) <= self.window_days:
            return
        to_drop = set(all_days[:-self.window_days])
        for day in to_drop:
            self.seen_hosts.pop(day, None)
            self.seen_ips.pop(day, None)

    def to_json(self) -> dict[str, object]:
        return {
            "days": self.window_days,
            "seen_fqdns": {day: sorted(hosts) for day, hosts in self.seen_hosts.items()},
            "seen_ips": {day: sorted(ips) for day, ips in self.seen_ips.items()},
        }

    def save(self, path: pathlib.Path) -> None:
        payload = self.to_json()
        with path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")

    @staticmethod
    def load(path: pathlib.Path, window_days: int) -> "UsageIndex":
        if path.exists():
            with path.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
            seen_hosts = {day: set(items) for day, items in data.get("seen_fqdns", {}).items()}
            seen_ips = {day: set(items) for day, items in data.get("seen_ips", {}).items()}
            return UsageIndex(window_days=window_days, seen_hosts=seen_hosts, seen_ips=seen_ips)
        return UsageIndex(window_days=window_days, seen_hosts={}, seen_ips={})


def usage_file_path(report_dir: pathlib.Path) -> pathlib.Path:
    return report_dir / "usage_index.json"
