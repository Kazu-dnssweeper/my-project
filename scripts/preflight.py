from __future__ import annotations

import argparse
import glob
import os
import pathlib
import sys

import yaml

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

    log_total = 0
    log_matched = 0
    for source in settings.logs:
        for pattern in source.paths:
            for path in _resolve_pattern(base_dir, pattern):
                log_total += 1
                ok, message = _check_read(path)
                target = f"log:{source.name}:{pattern}"
                if ok:
                    print(f"[OK] {target} -> {path}")
                    if path.exists() and path.is_file():
                        log_matched += 1
                else:
                    errors.append(f"{target} ({message})")
                    print(f"[NG] {target} ({message})")

    if log_total:
        print(f"[INFO] logs checked: {log_matched}/{log_total} entries readable")
        if log_matched == 0:
            print(
                "[HINT] Update settings.logs[*].paths or place sample logs "
                "under the configured paths."
            )
    else:
        print("[WARN] logs: no paths configured in settings.logs")

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

    fm_errors, fm_warnings = _check_fieldmaps(base_dir / "fieldmap")
    errors.extend(fm_errors)
    warnings.extend(fm_warnings)

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


def _check_fieldmaps(directory: pathlib.Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    if not directory.exists():
        print(f"[SKIP] fieldmap: {directory} not found")
        return errors, warnings
    files = list(directory.glob("*.yaml"))
    if not files:
        print(f"[SKIP] fieldmap: no yaml files in {directory}")
        return errors, warnings
    checked = 0
    for file in files:
        try:
            data = yaml.safe_load(file.read_text(encoding="utf-8")) or {}
            map_type = data.get("type", "regex")
            if map_type == "regex" and "pattern" not in data:
                raise ValueError("pattern is required for regex fieldmap")
            if map_type == "json":
                paths = data.get("json_paths") or data.get("paths")
                if not paths or "fqdn" not in paths:
                    raise ValueError("json_paths.fqdn is required for json fieldmap")
            print(f"[OK] fieldmap -> {file.name} ({map_type})")
            checked += 1
        except Exception as exc:  # pragma: no cover - best effort
            msg = f"fieldmap:{file.name} ({exc})"
            errors.append(msg)
            print(f"[NG] {msg}")
    print(f"[INFO] fieldmap checked: {checked} file(s)")
    return errors, warnings


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
