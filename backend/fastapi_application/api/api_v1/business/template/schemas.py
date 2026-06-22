from typing import Any

from pydantic import ConfigDict, Field

from core.types import BaseModel


class TemplateBase(BaseModel):
    title: str = Field(..., max_length=100)
    description: str | None = None
    category: str = Field(..., max_length=50)
    blocks: list[dict[str, Any]] = Field(default_factory=list)
    is_public: bool = True


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    title: str | None = Field(None, max_length=100)
    description: str | None = None
    category: str | None = Field(None, max_length=50)
    blocks: list[dict[str, Any]] | None = None
    is_public: bool | None = None


class TemplateRead(TemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
