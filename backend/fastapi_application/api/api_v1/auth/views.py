import logging
from datetime import UTC, datetime, timedelta

from core.authentication.transport import cookie_transport
from core.authentication.user_manager import CustomUserManager
from core.config import settings
from core.models import AccessToken, User, db_helper
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy import delete

from api.api_v1.auth.fastapi_users import current_active_user, fastapi_users
from api.api_v1.auth.schemas import (
    ChangePasswordRequest,
    UserCreate,
    UserRead,
)
from api.dependencies.authentication import (
    authentication_backend,
    get_user_manager,
)
from utils import get_client_ip

log = logging.getLogger(__name__)

router = APIRouter(
    prefix=settings.api.v1.auth,
    tags=["Auth"],
)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


# ═══════════════════════════════════════════════════════════════
# Custom endpoints with proper JSON responses
# (registered before fastapi-users routers to take precedence)
# ═══════════════════════════════════════════════════════════════


@router.post(
    "/login",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_204_NO_CONTENT: {"description": "Successful login"},
        status.HTTP_400_BAD_REQUEST: {"description": "Bad request or validation error"},
        status.HTTP_401_UNAUTHORIZED: {"description": "Invalid credentials"},
    },
)
async def custom_login(
    request: Request,
    credentials: OAuth2PasswordRequestForm = Depends(),
    user_manager: CustomUserManager = Depends(get_user_manager),
):
    """Custom login that captures IP and User-Agent for device binding.

    On successful login:
    - Deletes all expired tokens for this user
    - Creates a new token with ip_address and user_agent
    - Sets the HttpOnly cookie
    """
    user = await user_manager.authenticate(credentials)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Учётная запись не активна",
        )

    ip = get_client_ip(request)
    ua = request.headers.get("user-agent", "")[:512]

    async with db_helper.session_factory() as session:
        token_db = AccessToken.get_db(session=session)

        # Delete expired tokens for this user
        now = datetime.now(UTC)
        lifetime = timedelta(seconds=settings.access_token.lifetime_seconds)
        expired_cutoff = now - lifetime

        await session.execute(
            delete(AccessToken).where(
                AccessToken.user_id == user.id,
                AccessToken.created_at < expired_cutoff,
            )
        )

        # Create new token with IP and User-Agent
        import secrets

        token_value = secrets.token_urlsafe()
        await token_db.create(
            {
                "token": token_value,
                "user_id": user.id,
                "ip_address": ip,
                "user_agent": ua,
            }
        )

    # Set HttpOnly cookie
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    cookie_transport._set_login_cookie(response, token_value)
    return response


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def custom_logout(
    request: Request,
    user: User = Depends(current_active_user),
):
    """Logout: delete the current token from DB and clear cookie."""
    token_value = request.cookies.get(cookie_transport.cookie_name)
    if token_value and user:
        async with db_helper.session_factory() as session:
            await session.execute(
                delete(AccessToken).where(
                    AccessToken.user_id == user.id,
                )
            )
            await session.commit()

    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    cookie_transport._set_logout_cookie(response)
    return response


@router.post(
    "/request-verify-token",
    status_code=status.HTTP_202_ACCEPTED,
)
async def request_verify_token(
    request: Request,
    user: User = Depends(current_active_user),
    user_manager: CustomUserManager = Depends(get_user_manager),
):
    """Request email verification token."""
    try:
        await user_manager.request_verify(user, request)
    except Exception as exc:
        log.error("Failed to request verification: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось отправить письмо для подтверждения email",
        )
    return {"detail": "Verification email sent"}


@router.post(
    "/forgot-password",
    status_code=status.HTTP_202_ACCEPTED,
)
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    user_manager: CustomUserManager = Depends(get_user_manager),
):
    """Request password reset email."""
    from fastapi_users.exceptions import UserNotExists

    try:
        user = await user_manager.get_by_email(body.email)
    except UserNotExists:
        user = None

    if user is not None and user.is_active:
        try:
            await user_manager.forgot_password(user, request)
        except Exception as exc:
            log.error("Failed to send password reset email: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Не удалось отправить письмо для сброса пароля",
            )
    # Always return generic success to prevent email enumeration
    return {"detail": "Password reset email sent"}


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
)
async def change_password(
    request: Request,
    body: ChangePasswordRequest,
    user: User = Depends(current_active_user),
    user_manager: CustomUserManager = Depends(get_user_manager),
):
    """Change password with old password verification and similarity check."""
    # Verify old password
    verified, _ = user_manager.password_helper.verify_and_update(
        body.old_password,
        user.hashed_password,
    )
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный текущий пароль",
        )
    # Hash and update new password
    new_hash = user_manager.password_helper.hash(body.new_password)
    await user_manager.user_db.update(user, {"hashed_password": new_hash})

    # Send notification email (no session = no DB log, but email still sends)
    try:
        ip = get_client_ip(request)
        await user_manager.email_service.send_password_changed_notification(
            to=user.email,
            username=user.username,
            changed_at=datetime.now(UTC).isoformat(),
            ip_address=ip,
        )
    except Exception as exc:
        log.error("Failed to send password changed notification: %s", exc)

    return {"detail": "Пароль успешно изменен"}


# ═══════════════════════════════════════════════════════════════
# fastapi-users built-in routers (overridden paths above take precedence)
# ═══════════════════════════════════════════════════════════════

# /login — overridden by custom_login above
# /logout — overridden by custom_logout above
router.include_router(
    router=fastapi_users.get_auth_router(
        authentication_backend,
    ),
)


# /register
router.include_router(
    router=fastapi_users.get_register_router(
        UserRead,
        UserCreate,
    ),
)

# /request-verify-token  (overridden by custom endpoint above)
# /verify
router.include_router(
    router=fastapi_users.get_verify_router(UserRead),
)


# /forgot-password  (overridden by custom endpoint above)
# /reset-password
router.include_router(
    router=fastapi_users.get_reset_password_router(),
)
