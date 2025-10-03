from __future__ import annotations

import subprocess
import sys


def main() -> int:
    cmd = [sys.executable, "-m", "dns_hygiene_guard", "--demo"]
    result = subprocess.run(cmd, check=False)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
