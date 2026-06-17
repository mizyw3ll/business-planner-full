from core.config import settings
from fastapi import APIRouter

from api.api_v1.auth.fastapi_users import fastapi_users
from api.api_v1.auth.schemas import (
    UserRead,
    UserUpdate,
)

router = APIRouter(
    prefix=settings.api.v1.users,
    tags=["Users"],
)

# me
# /{id}
router.include_router(
    router=fastapi_users.get_users_router(
        UserRead,
        UserUpdate,
    ),
)
