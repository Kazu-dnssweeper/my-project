from __future__ import annotations

import argparse
import glob
import os
import pathlib
import sys

from dns_hygiene_guard.config_loader import load_settings


def _resolve_pattern(base: pathlib.Path, pattern: str) -> list[pathlib.Path]:
    path = pathlib.Path(pattern)
    if not path.is_absolute():
        path = base / pattern
    matches = [pathlib.Path(match) for match in glob.glob(str(path), recursive=True)]
    if matches:
        return matches
    return [path]


def _check_read(path: pathlib.Path) -> tuple[bool, str]:
    if not path.exists():
        return False, "missing"
    if path.is_dir():
        # directories are acceptable if readable
        if os.access(path, os.R_OK | os.X_OK):
            return True, "dir"
        return False, "no execute permission"
    if not os.access(path, os.R_OK):
        return False, "no read permission"
    return True, "ok"


def _check_report_dir(path: pathlib.Path) -> tuple[bool, str]:
    try:
        path.mkdir(parents=True, exist_ok=True)
        test_file = path / ".preflight"
        test_file.write_text("ok", encoding="utf-8")
        if test_file.exists():
            test_file.unlink()
        return True, "writeable"
    except Exception as exc:  # pragma: no cover - best effort
        return False, f"cannot write ({exc})"


def preflight(config_path: pathlib.Path) -> int:
    settings = load_settings(config_path)
    base_dir = config_path.parent
    errors: list[str] = []
    warnings: list[str] = []

    for source in settings.logs:
        for pattern in source.paths:
            for path in _resolve_pattern(base_dir, pattern):
                ok, message = _check_read(path)
                target = f"log:{source.name}:{pattern}"
                if ok:
                    print(f"[OK] {target} -> {path}")
                else:
                    errors.append(f"{target} ({message})")
                    print(f"[NG] {target} ({message})")

    zone_paths = settings.dns.paths
    for pattern in zone_paths:
        for path in _resolve_pattern(base_dir, pattern):
            ok, message = _check_read(path)
            target = f"zone:{pattern}"
            if ok:
                print(f"[OK] {target} -> {path}")
            else:
                errors.append(f"{target} ({message})")
                print(f"[NG] {target} ({message})")

    allowlist_path = base_dir / "allowlist.txt"
    if allowlist_path.exists():
        ok, message = _check_read(allowlist_path)
        if ok:
            print(f"[OK] allowlist -> {allowlist_path}")
        else:
            warnings.append(f"allowlist ({message})")
            print(f"[WARN] allowlist ({message})")

    report_dir = settings.report_dir
    ok, message = _check_report_dir(report_dir)
    if ok:
        print(f"[OK] report directory -> {report_dir}")
    else:
        errors.append(f"report_dir ({message})")
        print(f"[NG] report directory ({message})")

    if errors:
        print("\nPreflight failed:")
        for err in errors:
            print(f"  - {err}")
        if warnings:
            print("Warnings:")
            for warn in warnings:
                print(f"  - {warn}")
        return 1

    if warnings:
        print("\nWarnings:")
        for warn in warnings:
            print(f"  - {warn}")
    print("\nPreflight complete.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="DNS Hygiene Guard preflight checks")
    parser.add_argument(
        "--config",
        default="config/settings.yaml",
        help="Path to settings.yaml",
    )
    parser.add_argument(
        "--mode",
        choices=["demo", "online", "default"],
        default="default",
        help="Optional hint for reporting (no behavioural change).",
    )
    args = parser.parse_args()
    config_path = pathlib.Path(args.config)
    if not config_path.exists():
        print(f"config not found: {config_path}")
        return 1
    print(f"[INFO] Preflight mode: {args.mode}")
    return preflight(config_path)


if __name__ == "__main__":
    sys.exit(main())
