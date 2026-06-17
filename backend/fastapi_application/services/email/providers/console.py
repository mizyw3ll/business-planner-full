# services/email/providers/console.py
import logging

from .base import EmailPayload, EmailProvider

log = logging.getLogger(__name__)


class ConsoleProvider(EmailProvider):
    """For development - just logs email to console."""

    async def send(self, payload: EmailPayload) -> str:
        log.info("=" * 70)
        log.info("EMAIL NOTIFICATION")
        log.info("=" * 70)
        log.info("To: %s", payload.to)
        log.info("Subject: %s", payload.subject)
        log.info("From: %s (%s)", payload.from_email, payload.from_name)
        if payload.reply_to:
            log.info("Reply-To: %s", payload.reply_to)
        log.info("-" * 70)
        log.info("Body:\n%s...", payload.html_body[:500])
        log.info("=" * 70)

        return f"console-{hash(payload.to + payload.subject) % 10000}"
