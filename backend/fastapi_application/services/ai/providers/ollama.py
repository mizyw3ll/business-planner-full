from typing import Any

import httpx
from core.config import settings

from ..types import AIChatRequest, AIChatResponse
from .base import AIProvider


class OllamaProvider(AIProvider):
    name = "ollama"

    def __init__(self) -> None:
        self.base_url = settings.ai.base_url.rstrip("/")
        self.timeout = httpx.Timeout(settings.ai.timeout_seconds)

    async def chat(self, request: AIChatRequest) -> AIChatResponse:
        payload: dict[str, Any] = {
            "model": request.model,
            "messages": [{"role": msg.role, "content": msg.content} for msg in request.messages],
            "stream": False,
            "options": {
                "temperature": request.temperature,
            },
        }
        if request.max_tokens is not None:
            payload["options"]["num_predict"] = request.max_tokens

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(f"{self.base_url}/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()

        content = data.get("message", {}).get("content", "")
        return AIChatResponse(
            content=content,
            provider=self.name,
            model=request.model,
            raw=data,
        )
