# services/email/providers/resend.py
import httpx
from core.config import settings

from .base import EmailPayload, EmailProvider


class ResendProvider(EmailProvider):
    def __init__(self):
        self.api_key = settings.email.resend_api_key
        self.from_email = settings.email.from_email
        self.from_name = settings.email.from_name

    async def send(self, payload: EmailPayload) -> str:
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        data = {
            "from": f"{payload.from_name or self.from_name} <{payload.from_email or self.from_email}>",
            "to": [payload.to],
            "subject": payload.subject,
            "html": payload.html_body,
        }

        if payload.text_body:
            data["text"] = payload.text_body

        if payload.reply_to:
            data["reply_to"] = payload.reply_to

        try:
            async with httpx.AsyncClient(trust_env=False) as client:
                response = await client.post(url, headers=headers, json=data)
                response.raise_for_status()
                result = response.json()
        except httpx.HTTPStatusError as exc:
            error_detail = ""
            try:
                error_detail = exc.response.json()
            except Exception:
                error_detail = exc.response.text
            raise RuntimeError(f"Resend API error {exc.response.status_code}: {error_detail}") from exc

        return f"resend-{result.get('id', 'unknown')}"
