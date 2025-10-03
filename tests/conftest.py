from __future__ import annotations

import pytest

from dns_hygiene_guard.demo import load_demo_bundle


@pytest.fixture()
def demo_bundle():
    bundle = load_demo_bundle()
    try:
        yield bundle
    finally:
        bundle.cleanup()
