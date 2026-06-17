from __future__ import annotations

from collections.abc import Sequence
from typing import Any, cast

from core.config import settings

from .providers import AIProvider, DisabledAIProvider, FullAIProvider, OllamaProvider
from .types import AIChatRequest, AIChatResponse, AIMessage, AIRole


class AIService:
    def __init__(self, provider: AIProvider | None = None) -> None:
        self.provider = provider or self._build_provider()

    def _build_provider(self) -> AIProvider:
        provider_name = settings.ai.provider.lower().strip()
        if provider_name == "ollama":
            return OllamaProvider()
        if provider_name == "fullai":
            return FullAIProvider()
        return DisabledAIProvider()

    def _normalize_messages(self, messages: Sequence[AIMessage | dict[str, str] | Any]) -> list[AIMessage]:
        normalized: list[AIMessage] = []
        for message in messages:
            if isinstance(message, AIMessage):
                normalized.append(message)
                continue
            if isinstance(message, dict):
                role = cast(AIRole, message.get("role", "user"))
                content = message.get("content", "")
            else:
                role = cast(AIRole, getattr(message, "role", "user"))
                content = getattr(message, "content", "")
            normalized.append(
                AIMessage(
                    role=role,
                    content=content,
                )
            )
        return normalized

    async def chat(
        self,
        messages: Sequence[AIMessage | dict[str, str] | Any],
        *,
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AIChatResponse:
        request = AIChatRequest(
            messages=self._normalize_messages(messages),
            model=model or settings.ai.model,
            temperature=temperature if temperature is not None else settings.ai.temperature,
            max_tokens=max_tokens if max_tokens is not None else settings.ai.max_tokens,
        )
        return await self.provider.chat(request)

    async def generate_text(
        self,
        prompt: str,
        *,
        system_prompt: str | None = None,
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AIChatResponse:
        messages = []
        if system_prompt or settings.ai.system_prompt:
            messages.append({"role": "system", "content": system_prompt or settings.ai.system_prompt})
        messages.append({"role": "user", "content": prompt})
        return await self.chat(messages, model=model, temperature=temperature, max_tokens=max_tokens)

    async def healthcheck(self) -> bool:
        return await self.provider.healthcheck()


ai_service = AIService()
