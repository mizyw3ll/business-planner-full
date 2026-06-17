import asyncio
import logging
import secrets
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

import uvicorn

# импорт роутеров
from api import router as api_router

# импорт остальных файлов
from core.config import settings
from core.models import AccessToken, db_helper
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi_users.exceptions import UserAlreadyExists
from services import currency_sync
from sqlalchemy import delete, select

# CSRF токен для double-submit cookie pattern
_CSRF_SECRET = secrets.token_hex(32)

# Пути, которые не требуют валидации токена
_AUTH_SKIP_PATHS = frozenset({
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/request-verify-token",
    "/api/v1/auth/verify",
})

_perf_logger = logging.getLogger("api.performance")
_token_logger = logging.getLogger("api.token_validation")


async def _cleanup_expired_tokens():
    """Delete all expired access tokens from the database."""
    try:
        async with db_helper.session_factory() as session:
            now = datetime.now(timezone.utc)
            lifetime = timedelta(seconds=settings.access_token.lifetime_seconds)
            expired_cutoff = now - lifetime

            result = await session.execute(
                delete(AccessToken).where(AccessToken.created_at < expired_cutoff)
            )
            deleted = result.rowcount
            await session.commit()
            if deleted:
                _token_logger.info("Cleaned up %d expired tokens", deleted)
    except Exception:
        _token_logger.exception("Failed to cleanup expired tokens")


async def _periodic_token_cleanup():
    """Background task that cleans up expired tokens every hour."""
    while True:
        await asyncio.sleep(3600)  # 1 hour
        await _cleanup_expired_tokens()


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_periodic_token_cleanup())
    currency_sync.start()
    yield
    task.cancel()
    currency_sync.stop()
    await db_helper.dispose()


main_app = FastAPI(
    lifespan=lifespan,
)

# ═══════════════════════════════════════════════════════════════
# Глобальные обработчики исключений
# ═══════════════════════════════════════════════════════════════


@main_app.exception_handler(UserAlreadyExists)
async def user_already_exists_handler(request: Request, exc: UserAlreadyExists):
    """Обработка ошибки дублирования username/email."""
    return JSONResponse(status_code=400, content={"detail": str(exc), "error_code": "USER_ALREADY_EXISTS"})


@main_app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Обработка непредвиденных ошибок."""
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    logger = logging.getLogger(__name__)
    logger.exception(f"Unhandled exception: {exc}")

    return JSONResponse(
        status_code=500, content={"detail": "Внутренняя ошибка сервера", "error_code": "INTERNAL_ERROR"}
    )


_SLOW_REQUEST_MS = 500


@main_app.middleware("http")
async def request_timing_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    if duration_ms >= _SLOW_REQUEST_MS:
        _perf_logger.warning(
            "slow_request path=%s method=%s status=%s duration_ms=%.1f",
            request.url.path,
            request.method,
            response.status_code,
            duration_ms,
        )
    response.headers["X-Response-Time-Ms"] = f"{duration_ms:.1f}"
    return response


@main_app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


# Rate limiting for failed login attempts only
_login_failures: dict[str, list[float]] = defaultdict(list)
LOGIN_FAIL_WINDOW = 60  # seconds
LOGIN_FAIL_MAX = 5  # max failed attempts before blocking


@main_app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    path = request.url.path
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()

    if path == "/api/v1/auth/login" and request.method == "POST":
        key = f"{client_ip}:login"
        _login_failures[key] = [t for t in _login_failures[key] if now - t < LOGIN_FAIL_WINDOW]

        if len(_login_failures[key]) >= LOGIN_FAIL_MAX:
            oldest = _login_failures[key][0]
            retry_after = int(LOGIN_FAIL_WINDOW - (now - oldest))
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Слишком много неудачных попыток входа. Подождите {retry_after} сек.",
                    "error_code": "LOGIN_RATE_LIMITED",
                    "retry_after": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )

    response = await call_next(request)

    if path == "/api/v1/auth/login" and request.method == "POST" and response.status_code in (400, 401, 422):
        key = f"{client_ip}:login"
        _login_failures[key].append(now)

    return response


# ═══════════════════════════════════════════════════════════════
# Token device-binding validation middleware
# ═══════════════════════════════════════════════════════════════

_COOKIE_NAME = "fastapiusersauth"


def _get_client_ip(request: Request) -> str | None:
    """Extract client IP, respecting X-Forwarded-For behind proxy."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


@main_app.middleware("http")
async def token_device_validation_middleware(request: Request, call_next):
    """Validate token IP/UA binding on every API request.

    Rules:
    - Different User-Agent → delete token, return 401
    - Different IP → update IP in DB, allow request
    - Same IP/UA → pass through
    """
    path = request.url.path

    # Skip validation for non-API and auth paths
    if not path.startswith("/api/") or path in _AUTH_SKIP_PATHS:
        return await call_next(request)

    token_value = request.cookies.get(_COOKIE_NAME)
    if not token_value:
        return await call_next(request)

    current_ip = _get_client_ip(request)
    current_ua = request.headers.get("user-agent", "")[:512]

    try:
        async with db_helper.session_factory() as session:
            now = datetime.now(timezone.utc)
            lifetime = timedelta(seconds=settings.access_token.lifetime_seconds)

            result = await session.execute(
                select(AccessToken).where(
                    AccessToken.token == token_value,
                    AccessToken.created_at >= now - lifetime,
                )
            )
            db_token = result.scalar_one_or_none()

            if db_token is None:
                # Token not found or expired — let fastapi-users handle 401
                return await call_next(request)

            # Check User-Agent
            if db_token.user_agent and current_ua and db_token.user_agent != current_ua:
                _token_logger.warning(
                    "Token UA mismatch: token_ua=%s current_ua=%s user_id=%s — deleting token",
                    db_token.user_agent,
                    current_ua,
                    db_token.user_id,
                )
                await session.delete(db_token)
                await session.commit()
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Устройство не распознано. Выполните вход заново."},
                )

            # Check IP — update if different (don't block)
            if db_token.ip_address and current_ip and db_token.ip_address != current_ip:
                _token_logger.info(
                    "Token IP change: old_ip=%s new_ip=%s user_id=%s — updating",
                    db_token.ip_address,
                    current_ip,
                    db_token.user_id,
                )
                db_token.ip_address = current_ip
                await session.commit()

    except Exception:
        _token_logger.exception("Token validation middleware error")

    return await call_next(request)


main_app.add_middleware(GZipMiddleware, minimum_size=1000)
main_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors.allow_origins,
    allow_credentials=settings.cors.allow_credentials,
    allow_methods=settings.cors.allow_methods,
    allow_headers=settings.cors.allow_headers,
)

main_app.include_router(
    api_router,
)

_uploads_dir = Path(__file__).resolve().parent / "uploads"
_uploads_dir.mkdir(parents=True, exist_ok=True)

# StaticFiles mount removed for security — files served via authenticated endpoint
# in api/api_v1/business/plan_block/attachments.py

if __name__ == "__main__":
    uvicorn.run(
        "main:main_app",
        host=settings.run.host,
        port=settings.run.port,
        reload=False,
    )
