from fastapi.responses import Response

from core.config import settings
from core.models import User
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi_users import exceptions

from api.api_v1.auth.fastapi_users import current_active_user, fastapi_users
from api.api_v1.auth.schemas import (
    UserRead,
    UserUpdate,
)
from api.dependencies.authentication.user_manager import get_user_manager

router = APIRouter(
    prefix=settings.api.v1.users,
    tags=["Users"],
)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    name="users:delete_user",
)
async def delete_user(
    id: int,
    request: Request,
    current_user: User = Depends(current_active_user),
    user_manager=Depends(get_user_manager),
):
    if current_user.id != id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нельзя удалить этого пользователя",
        )
    try:
        user = await user_manager.get(id)
        await user_manager.delete(user, request=request)
    except exceptions.UserNotExists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)


router.include_router(
    router=fastapi_users.get_users_router(
        UserRead,
        UserUpdate,
    ),
)
