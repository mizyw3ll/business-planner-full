import asyncio
import contextlib
from os import getenv

from api.api_v1.auth.schemas import UserCreate
from api.dependencies.authentication.user_manager import get_user_manager
from api.dependencies.authentication.users import get_user_db
from core.authentication.user_manager import CustomUserManager
from core.models import (
    User,
    db_helper,
)
from pydantic import EmailStr

# get_async_session_context = contextlib.asynccontextmanager(get_async_session)
get_users_db_context = contextlib.asynccontextmanager(get_user_db)
get_user_manager_context = contextlib.asynccontextmanager(get_user_manager)

default_email = getenv("DEFAULT_EMAIL", "admin@admin.com")
default_password = getenv("DEFAULT_PASSWORD")
default_is_active = True
default_is_superuser = True
default_is_verified = True
default_username = getenv("DEFAULT_USERNAME", "admin")


async def create_user(
    user_manager: CustomUserManager,
    user_create: UserCreate,
) -> User:
    user = await user_manager.create(
        user_create=user_create,
        safe=False,
    )
    return user


async def create_superuser(
    email: EmailStr = default_email,
    password: str | None = default_password,
    is_active: bool = default_is_active,
    is_superuser: bool = default_is_superuser,
    is_verified: bool = default_is_verified,
    username: str = default_username,
):
    if not password:
        raise ValueError("Пароль обязателен. Установите переменную окружения DEFAULT_PASSWORD")
    user_create = UserCreate(
        email=email,
        password=password,
        is_active=is_active,
        is_superuser=is_superuser,
        is_verified=is_verified,
        username=username,
        first_name=None,
        last_name=None,
    )
    async with (
        db_helper.session_factory() as session,
        get_users_db_context(session) as user_db,
        get_user_manager_context(user_db) as user_manager,
    ):
        return await create_user(
            user_manager=user_manager,
            user_create=user_create,
        )


if __name__ == "__main__":
    asyncio.run(create_superuser())
