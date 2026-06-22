# services/email/service.py
import logging
import os
from datetime import UTC, datetime
from typing import Any

from core.config import settings
from core.models.email_log import EmailLog
from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy.ext.asyncio import AsyncSession

from .providers.base import EmailPayload
from .providers.console import ConsoleProvider
from .providers.resend import ResendProvider
from .providers.sendgrid import SendGridProvider
from .providers.smtp import SMTPProvider

log = logging.getLogger(__name__)

# Абсолютный путь к папке с шаблонами
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(CURRENT_DIR, "templates")


class EmailService:
    def __init__(self):
        self.provider = self._get_provider()
        log.info("EmailService initialized: provider=%s, templates_dir=%s", settings.email.provider, TEMPLATES_DIR)
        self.env = Environment(
            loader=FileSystemLoader(TEMPLATES_DIR),
            autoescape=select_autoescape(["html", "xml"]),
        )

    def _get_provider(self):
        provider_name = settings.email.provider.lower()
        if provider_name == "smtp":
            return SMTPProvider()
        elif provider_name == "sendgrid":
            return SendGridProvider()
        elif provider_name == "resend":
            return ResendProvider()
        else:
            return ConsoleProvider()

    def _render_template(self, template_name: str, context: dict[str, Any]) -> str:
        template = self.env.get_template(f"{template_name}.html")
        return template.render(**context)

    async def send_email(
        self,
        to: str,
        subject: str,
        template: str,
        context: dict[str, Any],
        from_email: str | None = None,
        from_name: str | None = None,
        reply_to: str | None = None,
        session: AsyncSession | None = None,
        email_type: str | None = None,
        user_id: int | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> str:
        """Send email using template."""
        html_body = self._render_template(template, context)

        # Generate text version (simple strip tags)
        text_body = self._html_to_text(html_body)

        payload = EmailPayload(
            to=to,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            from_email=from_email or settings.email.from_email,
            from_name=from_name or settings.email.from_name,
            reply_to=reply_to,
        )

        # Create log entry if session and email_type are provided
        email_log = None
        if session is not None and email_type is not None:
            email_log = EmailLog(
                user_id=user_id,
                email_type=email_type,
                recipient=to,
                subject=subject,
                status="pending",
                provider=settings.email.provider,
                ip_address=ip_address,
                user_agent=user_agent,
            )
            session.add(email_log)

        try:
            message_id = await self.provider.send(payload)
            if email_log is not None:
                email_log.status = "sent"
                email_log.message_id = message_id
                email_log.sent_at = datetime.now(UTC)
            return message_id
        except Exception as e:
            if email_log is not None:
                email_log.status = "failed"
                email_log.error_message = str(e)[:500]
            raise

    def _html_to_text(self, html: str) -> str:
        """Simple HTML to text conversion."""
        import re

        # Remove style and script tags
        text = re.sub(r"<(style|script)[^>]*>[^<]*</\1>", "", html, flags=re.I)
        # Replace BR, P tags with newlines
        text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
        text = re.sub(r"</p>", "\n", text, flags=re.I)
        # Remove all other tags
        text = re.sub(r"<[^>]+>", "", text)
        # Decode entities
        import html as html_module

        text = html_module.unescape(text)
        return text.strip()

    async def close(self):
        await self.provider.close()

    # Convenience methods for auth emails

    async def send_verification_email(
        self,
        to: str,
        username: str,
        token: str,
        frontend_url: str,
        session: AsyncSession | None = None,
        email_type: str | None = "verify",
        user_id: int | None = None,
    ) -> str:
        verify_url = f"{frontend_url}/verify?token={token}"
        context = {
            "username": username,
            "verify_url": verify_url,
            "expires_at": "24 hours",
            "support_email": settings.email.from_email,
        }
        return await self.send_email(
            to=to,
            subject="Подтвердите ваш email | Конструктор бизнес-планов",
            template="verify_email",
            context=context,
            session=session,
            email_type=email_type,
            user_id=user_id,
        )

    async def send_password_reset_email(
        self,
        to: str,
        username: str,
        token: str,
        frontend_url: str,
        ip_address: str = "",
        user_agent: str = "",
        session: AsyncSession | None = None,
        email_type: str | None = "reset",
        user_id: int | None = None,
    ) -> str:
        reset_url = f"{frontend_url}/reset-password?token={token}"
        context = {
            "username": username,
            "reset_url": reset_url,
            "expires_at": "1 hour",
            "ip_address": ip_address,
            "user_agent": user_agent,
        }
        return await self.send_email(
            to=to,
            subject="Восстановление пароля | Конструктор бизнес-планов",
            template="password_reset",
            context=context,
            session=session,
            email_type=email_type,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    async def send_password_changed_notification(
        self,
        to: str,
        username: str,
        changed_at: str,
        ip_address: str = "",
        session: AsyncSession | None = None,
        email_type: str | None = "password_changed",
        user_id: int | None = None,
    ) -> str:
        context = {
            "username": username,
            "changed_at": changed_at,
            "ip_address": ip_address,
            "support_email": settings.email.from_email,
        }
        return await self.send_email(
            to=to,
            subject="Пароль изменен | Конструктор бизнес-планов",
            template="password_changed",
            context=context,
            session=session,
            email_type=email_type,
            user_id=user_id,
            ip_address=ip_address,
        )

    async def send_notification_email(
        self,
        to: str,
        username: str,
        title: str,
        body: str | None,
        source_type: str,
        event_date: str,
        session: AsyncSession | None = None,
        user_id: int | None = None,
    ) -> str:
        source_type_label = {
            "calendar_event": "Календарь",
            "tax_event": "Налоговое событие",
            "tax_calendar": "Налоговый календарь",
            "task": "Задача",
        }.get(source_type, source_type)

        context = {
            "username": username,
            "title": title,
            "body": body or "",
            "source_type_label": source_type_label,
            "event_date": event_date,
            "support_email": settings.email.from_email,
        }
        return await self.send_email(
            to=to,
            subject=f"{title} | Конструктор бизнес-планов",
            template="notification_event",
            context=context,
            session=session,
            email_type="notification",
            user_id=user_id,
        )
