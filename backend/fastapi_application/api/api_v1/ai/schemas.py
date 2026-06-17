from pydantic import BaseModel, Field


class AIMessageIn(BaseModel):
    role: str = Field(default="user")
    content: str


class AIChatRequest(BaseModel):
    messages: list[AIMessageIn]
    model: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None
    max_chars: int | None = None


class AIChatResponse(BaseModel):
    content: str
    provider: str
    model: str
    char_count: int = 0
    max_chars: int = 0
