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


def to_ascii_hostname(host: str) -> str:
    """Return hostname in ASCII with a trailing dot for canonical form."""

    ascii_label = to_ascii(host)
    if not ascii_label:
        return ascii_label
    return ascii_label if ascii_label.endswith(".") else f"{ascii_label}."


def to_unicode_hostname(host: str) -> str:
    """Return hostname in Unicode with no trailing dot."""

    return to_unicode(host)
