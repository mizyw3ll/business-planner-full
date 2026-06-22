# core/authentication/user_manager.py   (или где он у тебя лежит)

import logging
from typing import TYPE_CHECKING, Optional

from api.api_v1.auth.schemas import UserCreate
from fastapi import Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_users import BaseUserManager, IntegerIDMixin
from fastapi_users.exceptions import UserAlreadyExists
from services.email import EmailService
from sqlalchemy import select

from core.config import settings
from core.models import User
from core.types.user_id import UserIdType

if TYPE_CHECKING:
    from fastapi_users.password import PasswordHelperProtocol
    from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase

log = logging.getLogger(__name__)


class CustomUserManager(
    IntegerIDMixin,
    BaseUserManager[User, UserIdType],  # type: ignore[type-var]
):
    reset_password_token_secret = settings.access_token.reset_password_token_secret
    verification_token_secret = settings.access_token.verification_token_secret
    email_service = EmailService()

    def __init__(
        self,
        user_db: "SQLAlchemyUserDatabase[User, UserIdType]",  # type: ignore[type-var]
        password_helper: Optional["PasswordHelperProtocol"] = None,
    ):
        super().__init__(user_db, password_helper)

    async def create(  # type: ignore[override]
        self,
        user_create: UserCreate,
        safe: bool = False,
        request: Optional["Request"] = None,
    ) -> User:
        """
        Создание пользователя с обработкой ошибок уникальности.
        """
        from sqlalchemy.exc import IntegrityError

        try:
            return await super().create(user_create, safe, request)
        except IntegrityError as e:
            # Определяем какое поле вызвало конфликт
            error_str = str(e.orig)
            if "ix_users_username" in error_str or "username" in error_str.lower():
                raise UserAlreadyExists("Пользователь с таким username уже существует")
            elif "ix_users_email" in error_str or "email" in error_str.lower():
                raise UserAlreadyExists("Пользователь с таким email уже зарегистрирован")
            else:
                raise UserAlreadyExists("Пользователь с такими данными уже существует")

    # ────────────────────────────────────────────────────────────────
    # Главное изменение — переопределяем authenticate
    # ────────────────────────────────────────────────────────────────
    async def authenticate(
        self,
        credentials: OAuth2PasswordRequestForm,  # это объект с .username и .password
        request: Request | None = None,
    ) -> User | None:
        # credentials.username — это значение, которое прислал клиент в поле "username"
        login_value = credentials.username.strip().lower()

        # Ищем пользователя по email ИЛИ по username (регистронезависимо)
        stmt = select(User).where((User.email == login_value) | (User.username == login_value))
        result = await self.user_db.session.execute(stmt)  # type: ignore[attr-defined]
        user = result.scalar_one_or_none()

        if user is None:
            # Защита от timing attack — хешируем "мусорный" пароль
            self.password_helper.hash(credentials.password + "dummy-salt")
            return None

        # Проверяем пароль
        verified, updated_password_hash = self.password_helper.verify_and_update(
            credentials.password,
            user.hashed_password,
        )

        if not verified:
            return None

        # Проверяем активность (если используешь is_active)
        if not user.is_active:
            return None

        # Если хеш пароля нужно обновить (смена алгоритма) — сохраняем
        if updated_password_hash:
            updated = await self.user_db.update(user, {"hashed_password": updated_password_hash})
            if updated:
                user.hashed_password = updated_password_hash

        return user

    # Твои хуки остаются без изменений
    async def on_after_register(
        self,
        user: User,
        request: Optional["Request"] = None,
    ):
        log.info("User %r has registered.", user.id)
        # Не отправляем email здесь - токен еще не создан
        # Email будет отправлен при вызове /request-verify-token
        pass

    async def on_after_request_verify(
        self,
        user: User,
        token: str,
        request: Optional["Request"] = None,
    ):
        log.info("Verification requested for user %r", user.id)
        try:
            result = await self.email_service.send_verification_email(
                to=user.email,
                username=user.username,
                token=token,
                frontend_url=settings.email.frontend_url,
                session=self.user_db.session,  # type: ignore[attr-defined]
                email_type="verify",
                user_id=user.id,
            )
            log.info(f"Email sent! Message ID: {result}")
        except Exception as e:
            log.error(f"Failed to send verification email: {e}")
            import traceback

            log.error(traceback.format_exc())
            raise

    async def on_after_forgot_password(
        self,
        user: User,
        token: str,
        request: Optional["Request"] = None,
    ):
        log.info("Password reset requested for user %r", user.id)
        ip = request.client.host if request and request.client else ""
        ua = request.headers.get("user-agent", "") if request else ""
        try:
            result = await self.email_service.send_password_reset_email(
                to=user.email,
                username=user.username,
                token=token,
                frontend_url=settings.email.frontend_url,
                ip_address=ip,
                user_agent=ua,
                session=self.user_db.session,  # type: ignore[attr-defined]
                email_type="reset",
                user_id=user.id,
            )
            log.info(f"Email sent! Message ID: {result}")
        except Exception as e:
            log.error(f"Failed to send password reset email: {e}")
            import traceback

            log.error(traceback.format_exc())
            raise

    async def on_after_reset_password(
        self,
        user: User,
        request: Optional["Request"] = None,
    ):
        """После успешного сброса пароля"""
        log.info("Password reset completed for user %r", user.id)
        try:
            from datetime import UTC, datetime

            ip = request.client.host if request and request.client else ""
            await self.email_service.send_password_changed_notification(
                to=user.email,
                username=user.username,
                changed_at=datetime.now(UTC).isoformat(),
                ip_address=ip,
                session=self.user_db.session,  # type: ignore[attr-defined]
                email_type="password_changed",
                user_id=user.id,
            )
            log.info("Password changed notification sent")
        except Exception as e:
            log.error("Failed to send password changed notification: %s", e)
            raise
