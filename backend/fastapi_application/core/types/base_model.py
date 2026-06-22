from pydantic import BaseModel as PydanticBaseModel


class BaseModel(PydanticBaseModel):
    """BaseModel — валидация на русском через exception handler."""

    pass
