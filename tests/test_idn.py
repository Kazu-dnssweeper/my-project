from __future__ import annotations

import textwrap

from dns_hygiene_guard import zones
from dns_hygiene_guard.rules import static_rules


def test_idn_handling(tmp_path) -> None:
    zone_text = textwrap.dedent(
        """
        $ORIGIN xn--r8jz45g.xn--zckzah.
        $TTL 3600
        @      IN SOA ns.xn--r8jz45g.xn--zckzah. admin.xn--r8jz45g.xn--zckzah. (
                         1 7200 3600 1209600 3600 )
               IN NS  ns.xn--r8jz45g.xn--zckzah.
        ns     IN A   198.51.100.2
        www    IN A   10.0.0.1
        mail   IN MX  10 mail.xn--r8jz45g.xn--zckzah.
        mail   IN A   198.51.100.3
        www    IN TXT (
            "v=spf1 include:example.com include:example.org include:example.net "
            "include:a include:b include:c include:d include:e include:f "
            "include:g include:h include:i include:j include:k -all"
        )
        """
    ).strip()
    zone_file = tmp_path / "idn.zone"
    zone_file.write_text(zone_text, encoding="utf-8")

    zone_data = zones.load_zone_from_file(zone_file)
    findings = static_rules.check_private_ip(zone=zone_data, allowlist=set())
    subjects = {finding.subject for finding in findings}
    assert any(subject.endswith("例え.テスト") for subject in subjects)

    mx_findings = static_rules.check_spf_lookup(zone=zone_data, allowlist=set())
    assert any(finding.subject.endswith("例え.テスト") for finding in mx_findings)
