from __future__ import annotations

import pytest

from dns_hygiene_guard.config_loader import load_settings
from dns_hygiene_guard.rules import static_rules
from dns_hygiene_guard.runner import GuardRunner


def test_static_rules_cover_all_fr(demo_bundle) -> None:
    settings = load_settings(demo_bundle.config_path)
    runner = GuardRunner(settings=settings, base_dir=demo_bundle.config_path.parent)
    report = runner.run_static_checks(demo_bundle.targets, demo_bundle.zone)
    rules = {finding.rule for finding in report.findings}
    expected = {"MX-CNAME", "MX-NXDOMAIN", "SPF-LOOKUP", "PRIVATE-IP", "NS-HEALTH", "OPEN-AXFR"}
    assert expected.issubset(rules)


def test_online_axfr_requires_allowlist(demo_bundle) -> None:
    settings = load_settings(demo_bundle.config_path)
    with pytest.raises(PermissionError):
        static_rules.check_open_axfr(
            zone=demo_bundle.zone,
            allowlist=set(),
            online=True,
            runtime=settings.runtime,
            allowed_zones=[],
        )
