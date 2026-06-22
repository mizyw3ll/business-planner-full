from datetime import datetime

from pydantic import ConfigDict, Field, field_validator

from core.types import BaseModel
from api.api_v1.business.plan_block.schemas import PlanBlockRead
from api.api_v1.tags.schemas import TagRead


class BusinessPlanBase(BaseModel):
    title: str = Field(..., max_length=100)
    description: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Название не может быть пустым")
        return v.strip()


class BusinessPlanCreate(BusinessPlanBase):
    pass


class BusinessPlanUpdate(BaseModel):
    title: str | None = Field(None, max_length=100)
    description: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Название не может быть пустым")
        return v.strip() if v else v


class BusinessPlanListItemRead(BusinessPlanBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    tags: list[TagRead] = Field(default_factory=list)


class BusinessPlanRead(BusinessPlanBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    blocks: list[PlanBlockRead] = Field(default_factory=list)
    tags: list[TagRead] = Field(default_factory=list)


class BusinessPlanAnalyticsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plan_id: int
    blocks_count: int
    drafts_count: int
    comments_count: int
    attachments_count: int
    linked_financial_charts_count: int
    rich_blocks_count: int
    total_content_chars: int
    average_content_chars: float
    block_type_breakdown: dict[str, int] = Field(default_factory=dict)
