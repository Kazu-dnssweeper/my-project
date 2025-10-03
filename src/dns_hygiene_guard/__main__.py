"""CLI entry-point for DNS Hygiene Guard."""

from __future__ import annotations

import argparse
import pathlib
import shutil

from . import runner, zones
from .idn import to_ascii


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="DNS Hygiene Guard")
    parser.add_argument(
        "--config", default="config/settings.yaml", help="Path to settings.yaml"
    )
    parser.add_argument(
        "--targets",
        nargs="*",
        default=["targets.txt"],
        help="Paths to targets files (used when zone data is unavailable)",
    )
    parser.add_argument(
        "--zone",
        help="Path to a BIND zone file to use for static rules.",
    )
    parser.add_argument(
        "--allowlist", default="config/allowlist.txt", help="Allowlist file path"
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run using bundled demo fixtures (ignores --targets/--zone)",
    )
    parser.add_argument(
        "--online-axfr",
        action="store_true",
        help="Attempt live AXFR checks instead of demo markers.",
    )
    return parser.parse_args()


def load_allowlist(path: pathlib.Path) -> set[str]:
    allowlist: set[str] = set()
    if not path.exists():
        return allowlist
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if line and not line.startswith("#"):
                allowlist.add(to_ascii(line))
    return allowlist


def main() -> int:
    args = parse_args()
    config_path = pathlib.Path(args.config)
    allowlist = load_allowlist(pathlib.Path(args.allowlist))
    if args.demo:
        from .demo import loader as demo_loader

        demo_bundle = demo_loader.load_demo_bundle()
        try:
            report, settings = runner.run_from_config(
                config_path=demo_bundle.config_path,
                targets=demo_bundle.targets,
                zone=demo_bundle.zone,
                allowlist=allowlist,
                online_axfr=args.online_axfr,
            )
            demo_output = pathlib.Path("demo-output")
            if demo_output.exists():
                shutil.rmtree(demo_output)
            shutil.copytree(settings.report_dir, demo_output, dirs_exist_ok=True)
        except PermissionError as exc:
            print(f"[AXFR] {exc}")
            return 1
        finally:
            demo_bundle.cleanup()
        print(
            "Demo report generated with",
            len(report.findings),
            "findings at",
            demo_output,
        )
        return 0
    target_paths = [pathlib.Path(path) for path in args.targets]
    targets = zones.load_targets(target_paths)
    zone_data = zones.load_zone_from_file(pathlib.Path(args.zone)) if args.zone else None
    try:
        report, settings = runner.run_from_config(
            config_path,
            targets=targets,
            zone=zone_data,
            allowlist=allowlist,
            online_axfr=args.online_axfr,
        )
    except PermissionError as exc:
        print(f"[AXFR] {exc}")
        return 1
    print(
        "Report generated with",
        len(report.findings),
        "findings at",
        settings.report_dir,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
