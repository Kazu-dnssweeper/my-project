# DNS Hygiene Guard (Offline Demo Ready)

**Purpose**: Detect risky DNS misconfigurations and "unused (zero‑traffic) FQDN/IP" inside **your own zones**.

## Quick Start

```bash
python scripts/generate_demo.py
# -> demo-output/{report.md, report.json, usage_index.json}
```

## Config Highlights

- `reporting.language` / `reporting.date_format`
- `runtime.timezone` (internal data stays in UTC; presentation converts)
- `dns.zone.allowed_online_axfr` (self-zone only; denied otherwise)
- `config/fieldmap/*.yaml` (regex / json mappings, IDN + timezone normalisation)

## Safety

- Internal timestamps are stored as UTC; only presentation applies the configured timezone.
- No raw logs are stored—only **sets/aggregates** are persisted.
- Online AXFR runs via `workflow_dispatch` with both allowlist and CODEOWNERS approval.

## CLI

```bash
# Demo execution (offline fixtures)
dng --demo
```

See `README.md` (Japanese) and `docs/OPERATIONS.md` for the detailed workflow and approval process.
