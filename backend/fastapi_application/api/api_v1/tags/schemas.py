from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TagBase(BaseModel):
    name: str = Field(..., max_length=50)
    color_idx: int = Field(default=0, ge=0, le=9)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Название тега не может быть пустым")
        return v.strip()


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: str | None = Field(None, max_length=50)
    color_idx: int | None = Field(None, ge=0, le=9)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Название тега не может быть пустым")
        return v.strip() if v else v


class TagRead(TagBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
