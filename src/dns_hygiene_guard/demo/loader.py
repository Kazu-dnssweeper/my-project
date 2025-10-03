"""Helper to copy bundled demo data into a temporary workspace."""

from __future__ import annotations

import dataclasses
import shutil
import tempfile
from importlib import resources
from pathlib import Path

from .. import zones


@dataclasses.dataclass(slots=True)
class DemoBundle:
    root: Path
    config_path: Path
    targets: zones.Targets
    zone: zones.ZoneData

    def cleanup(self) -> None:
        shutil.rmtree(self.root, ignore_errors=True)


def _copy_demo_tree() -> Path:
    data_root = resources.files("dns_hygiene_guard.demo") / "data"
    temp_dir = Path(tempfile.mkdtemp(prefix="dns-hygiene-demo-"))
    shutil.copytree(data_root, temp_dir, dirs_exist_ok=True)
    return temp_dir


def load_demo_bundle() -> DemoBundle:
    root = _copy_demo_tree()
    config_path = root / "config" / "settings.yaml"
    targets = zones.load_targets([root / "targets.txt"])
    zone = zones.load_zone_from_file(root / "zones" / "demo-public.test.zone")
    return DemoBundle(root=root, config_path=config_path, targets=targets, zone=zone)
