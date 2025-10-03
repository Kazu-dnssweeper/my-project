from __future__ import annotations

from dns_hygiene_guard.config_loader import load_settings
from dns_hygiene_guard.runner import GuardRunner


def test_usage_index_and_unused_detection(demo_bundle) -> None:
    settings = load_settings(demo_bundle.config_path)
    runner = GuardRunner(settings=settings, base_dir=demo_bundle.config_path.parent)
    findings, usage_index = runner.run_pro_checks(demo_bundle.zone)
    active_hosts = usage_index.active_hosts()
    assert "www.demo-public.test" in active_hosts
    assert any(f.rule == "UNUSED-FQDN" for f in findings)
    assert any(f.rule == "UNUSED-IP" for f in findings)
    assert any(f.rule == "DANGLING-CNAME" for f in findings)
    unused_subjects = {f.subject for f in findings if f.rule == "UNUSED-FQDN"}
    assert any("fastly.demo-public.test" in subject for subject in unused_subjects)
