from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class Role(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class AIMessageIn(BaseModel):
    role: Role = Field(default=Role.USER)
    content: str

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Содержимое не может быть пустым")
        return v.strip()


class AIChatRequest(BaseModel):
    messages: List[AIMessageIn]
    model: Optional[str] = None
    temperature: Optional[float] = Field(default=None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, gt=0, le=4000)
    max_chars: Optional[int] = Field(default=None, gt=0, le=100000)

    @field_validator("messages")
    @classmethod
    def messages_not_empty(cls, v: List[AIMessageIn]) -> List[AIMessageIn]:
        if not v:
            raise ValueError("Список сообщений не может быть пустым")
        return v


class AIChatResponse(BaseModel):
    content: str
    provider: str
    model: str
    char_count: int = Field(default=0, ge=0)
    max_chars: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=datetime.now)

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Содержимое не может быть пустым")
        return v.strip()
