from abc import ABC, abstractmethod

from ..types import AIChatRequest, AIChatResponse


class AIProvider(ABC):
    name: str = "base"

    @abstractmethod
    async def chat(self, request: AIChatRequest) -> AIChatResponse:
        raise NotImplementedError

    async def healthcheck(self) -> bool:
        return True
