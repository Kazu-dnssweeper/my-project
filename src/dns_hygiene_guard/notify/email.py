"""SMTP notification helper."""

from __future__ import annotations

import os
import smtplib
import ssl
from email.message import EmailMessage


def send(config: dict, subject: str, body: str) -> None:
    """Send an email according to the provided configuration."""

    message = EmailMessage()
    message["From"] = config["from"]
    message["To"] = ", ".join(config["to"])
    message["Subject"] = subject
    message.set_content(body)

    context = ssl.create_default_context()
    with smtplib.SMTP(config["smtp_host"], config.get("smtp_port", 587)) as server:
        if config.get("use_tls", True):
            server.starttls(context=context)
        username = config.get("username")
        if username:
            password = os.getenv(config.get("password_env", ""), "")
            server.login(username, password)
        server.send_message(message)
