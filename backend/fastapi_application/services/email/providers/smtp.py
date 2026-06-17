# services/email/providers/smtp.py
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
from core.config import settings

from .base import EmailPayload, EmailProvider


class SMTPProvider(EmailProvider):
    def __init__(self):
        self.host = settings.email.smtp_host
        self.port = settings.email.smtp_port
        self.user = settings.email.smtp_user
        self.password = settings.email.smtp_password
        self.use_tls = settings.email.smtp_tls
        self.from_email = settings.email.from_email
        self.from_name = settings.email.from_name

    async def send(self, payload: EmailPayload) -> str:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = payload.subject
        msg["From"] = f"{payload.from_name or self.from_name} <{payload.from_email or self.from_email}>"
        msg["To"] = payload.to

        if payload.reply_to:
            msg["Reply-To"] = payload.reply_to

        # HTML version
        html_part = MIMEText(payload.html_body, "html", "utf-8")
        msg.attach(html_part)

        # Text version (fallback)
        if payload.text_body:
            text_part = MIMEText(payload.text_body, "plain", "utf-8")
            msg.attach(text_part)

        # Port 465 = implicit SSL, port 587 = STARTTLS
        use_ssl = self.port == 465

        await aiosmtplib.send(
            msg,
            hostname=self.host,
            port=self.port,
            username=self.user,
            password=self.password,
            use_tls=use_ssl,
            start_tls=self.use_tls if not use_ssl else False,
        )

        return f"smtp-{payload.to}-{hash(payload.subject) % 10000}"
