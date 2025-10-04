# Security Policy

- This project targets **self-managed DNS zones only**. Do not run online AXFR against third-party zones.
- Online AXFR requires the zone to be allowlisted in `dns.zone.allowed_online_axfr` and approved via CODEOWNERS.
- The tool never stores raw logs; only **sets/aggregates** (e.g. `seen_fqdns`, `seen_ips`, reports).
- To report a vulnerability, please open a private security advisory on GitHub or contact the maintainers directly.
