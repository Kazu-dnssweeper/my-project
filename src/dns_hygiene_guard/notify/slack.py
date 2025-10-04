"""Slack notification helper."""

from __future__ import annotations

import json
import urllib.request


def send(webhook_url: str, text: str, timeout: int = 10) -> int:
    """Post a simple text message to a Slack webhook."""

    payload = {"text": text}
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        webhook_url,
        data=data,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.status
