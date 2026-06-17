from ..types import AIChatRequest, AIChatResponse
from .base import AIProvider


class DisabledAIProvider(AIProvider):
    name = "disabled"

    async def chat(self, request: AIChatRequest) -> AIChatResponse:
        raise RuntimeError("AI provider is disabled")

    async def healthcheck(self) -> bool:
        return False
