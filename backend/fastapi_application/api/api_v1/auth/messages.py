from typing import Annotated

from core.config import settings
from core.models import User
from fastapi import APIRouter, Depends

from api.api_v1.auth.fastapi_users import (
    current_active_super_user,
    current_active_user,
)
from api.api_v1.auth.schemas import UserRead

router = APIRouter(
    prefix=settings.api.v1.messages,
    tags=["Messages"],
)


@router.get("")
def get_user_messages(
    user: Annotated[
        User,
        Depends(current_active_user),
    ],
):
    return {
        "messages": ["m1", "m2", "m3", "m4"],
        "user": UserRead.model_validate(user),
    }


@router.get("/secrets")
def get_superuser_messages(
    user: Annotated[
        User,
        Depends(current_active_super_user),
    ],
):
    return {
        "messages": ["s_m1", "s_m2", "s_m3", "s_m4"],
        "user": UserRead.model_validate(user),
    }
