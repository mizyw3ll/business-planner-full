from dataclasses import dataclass
from typing import Any, Literal

AIRole = Literal["system", "user", "assistant"]


@dataclass(slots=True)
class AIMessage:
    role: AIRole
    content: str


@dataclass(slots=True)
class AIChatRequest:
    messages: list[AIMessage]
    model: str
    temperature: float = 0.2
    max_tokens: int | None = None


@dataclass(slots=True)
class AIChatResponse:
    content: str
    provider: str
    model: str
    raw: dict[str, Any]
