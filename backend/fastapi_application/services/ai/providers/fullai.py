from typing import Any

import httpx
from core.config import settings

from ..types import AIChatRequest, AIChatResponse
from .base import AIProvider


class FullAIProvider(AIProvider):
    name = "fullai"

    def __init__(self) -> None:
        self.base_url = settings.ai.base_url.rstrip("/")
        self.api_key = settings.ai.api_key
        self.timeout = httpx.Timeout(settings.ai.timeout_seconds)

    async def chat(self, request: AIChatRequest) -> AIChatResponse:
        payload: dict[str, Any] = {
            "model": request.model,
            "messages": [{"role": msg.role, "content": msg.content} for msg in request.messages],
            "temperature": request.temperature,
            "stream": False,
        }
        if request.max_tokens is not None:
            payload["max_tokens"] = request.max_tokens

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(f"{self.base_url}/chat/completions", json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

        content = ""
        choices = data.get("choices") or []
        if choices:
            message = choices[0].get("message", {})
            content = message.get("content", "") or ""
            # Qwen3 models return thinking in reasoning_content, answer in content.
            # If content is empty but reasoning_content exists — use it.
            if not content.strip():
                content = message.get("reasoning_content", "") or ""

        return AIChatResponse(
            content=content,
            provider=self.name,
            model=request.model,
            raw=data,
        )
