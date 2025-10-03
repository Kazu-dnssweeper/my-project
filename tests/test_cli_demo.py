from __future__ import annotations

import pathlib
import shutil
import subprocess
import sys


def test_cli_demo_executes() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "dns_hygiene_guard", "--demo"],
        check=True,
        capture_output=True,
        text=True,
    )
    assert "Report generated" in result.stdout or "Demo report generated" in result.stdout
    demo_output = pathlib.Path("demo-output")
    assert demo_output.exists()
    shutil.rmtree(demo_output)
