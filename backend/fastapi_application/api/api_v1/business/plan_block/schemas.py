from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from api.api_v1.tags.schemas import TagRead


class PlanBlockBase(BaseModel):
    title: str = Field(..., max_length=100)
    content: str
    block_type: str = Field(..., max_length=100)
    rich_content: dict[str, Any] = Field(default_factory=dict)
    media_attachments: list[dict[str, Any]] = Field(default_factory=list)
    linked_financial_chart_ids: list[int] = Field(default_factory=list)
    due_date: date | None = None

    @field_validator("title", "block_type")
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Поле не может быть пустым")
        return v.strip()


class ReorderBlocksRequest(BaseModel):
    new_order: list[int] = Field(..., description="Новый порядок ID блоков")

    @field_validator("new_order")
    @classmethod
    def validate_new_order(cls, v: list[int]) -> list[int]:
        if not v:
            raise ValueError("new_order не может быть пустым")
        return v


class PlanBlockCreate(PlanBlockBase):
    pass


class PlanBlockUpdate(BaseModel):
    title: str | None = Field(None, max_length=100)
    content: str | None = None
    block_type: str | None = Field(None, max_length=100)
    rich_content: dict[str, Any] | None = None
    media_attachments: list[dict[str, Any]] | None = None
    linked_financial_chart_ids: list[int] | None = None
    due_date: date | None = None

    @field_validator("title", "block_type")
    @classmethod
    def validate_not_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Поле не может быть пустым")
        return v.strip() if v else v


class PlanBlockDraftSave(BaseModel):
    draft_title: str | None = Field(None, max_length=100)
    draft_content: str | None = None
    draft_rich_content: dict[str, Any] | None = None
    draft_media_attachments: list[dict[str, Any]] | None = None

    @field_validator("draft_title", "draft_content")
    @classmethod
    def validate_not_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Поле не может быть пустым")
        return v.strip() if v else v


class PlanBlockRead(PlanBlockBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    business_plan_id: int
    has_unpublished_draft: bool
    draft_saved_at: datetime | None
    tags: list[TagRead] = Field(default_factory=list)
    due_date: date | None = None
    comments_count: int = 0
