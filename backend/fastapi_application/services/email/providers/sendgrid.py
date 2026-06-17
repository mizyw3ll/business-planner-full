# services/email/providers/sendgrid.py
import httpx
from core.config import settings

from .base import EmailPayload, EmailProvider


class SendGridProvider(EmailProvider):
    def __init__(self):
        self.api_key = settings.email.sendgrid_api_key
        self.from_email = settings.email.from_email
        self.from_name = settings.email.from_name

    async def send(self, payload: EmailPayload) -> str:
        url = "https://api.sendgrid.com/v3/mail/send"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        data = {
            "personalizations": [{"to": [{"email": payload.to}]}],
            "from": {
                "email": payload.from_email or self.from_email,
                "name": payload.from_name or self.from_name,
            },
            "subject": payload.subject,
            "content": [
                {"type": "text/html", "value": payload.html_body},
            ],
        }

        if payload.text_body:
            data["content"].append({"type": "text/plain", "value": payload.text_body})  # type: ignore[attr-defined]

        if payload.reply_to:
            data["reply_to"] = {"email": payload.reply_to}

        try:
            async with httpx.AsyncClient(trust_env=False) as client:
                response = await client.post(url, headers=headers, json=data)
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            error_detail = ""
            try:
                error_detail = exc.response.json()
            except Exception:
                error_detail = exc.response.text
            raise RuntimeError(f"SendGrid API error {exc.response.status_code}: {error_detail}") from exc

        return f"sg-{response.headers.get('X-Message-Id', 'unknown')}"
