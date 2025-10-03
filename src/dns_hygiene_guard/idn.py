"""Helpers for IDN (Internationalized Domain Name) conversions."""

from __future__ import annotations

import idna


def to_ascii(label: str) -> str:
    """Convert a domain label to ASCII (Punycode)."""
    label = label.strip().rstrip(".")
    if not label:
        return label
    try:
        return idna.encode(label).decode("ascii")
    except idna.IDNAError:
        return label


def to_unicode(label: str) -> str:
    """Convert a domain label to its Unicode representation for display."""
    label = label.strip().rstrip(".")
    if not label:
        return label
    try:
        return idna.decode(label)
    except idna.IDNAError:
        return label
