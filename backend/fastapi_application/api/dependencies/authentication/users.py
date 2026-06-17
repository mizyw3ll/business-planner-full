from typing import TYPE_CHECKING, Annotated

from core.models import User, db_helper  # или откуда берётся session_getter
from fastapi import Depends
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


async def get_user_db(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    yield SQLAlchemyUserDatabase[User, int](session, User)  # type: ignore[type-var]
