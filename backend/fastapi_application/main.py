import asyncio
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

import uvicorn

# импорт роутеров
from api import router as api_router

# импорт остальных файлов
from core.config import settings
from core.models import AccessToken, db_helper
from core.exceptions import APIException, ValidationException, AuthenticationException, AuthorizationException, NotFoundException, ConflictException
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi_users.exceptions import UserAlreadyExists
from core.validation_translator import translate_request_validation
from services import currency_sync
from sqlalchemy import delete, select
from core.logging import StructuredLogger
from utils import get_client_ip

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

# Initialize structured logger
logger = StructuredLogger(__name__)


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


@main_app.exception_handler(RequestValidationError)
async def request_validation_error_handler(request: Request, exc: RequestValidationError):
    """Translate Pydantic validation errors to Russian."""
    return JSONResponse(status_code=422, content=translate_request_validation(exc))


@main_app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    """Handle custom API exceptions with structured error codes."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": exc.error_code.name if exc.error_code else "API_ERROR",
        },
    )


@main_app.exception_handler(ValidationException)
async def validation_exception_handler(request: Request, exc: ValidationException):
    """Handle validation errors."""
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.detail,
            "error_code": "VALIDATION_ERROR",
            "field_errors": exc.field_errors if hasattr(exc, "field_errors") else {},
        },
    )


@main_app.exception_handler(AuthenticationException)
async def authentication_exception_handler(request: Request, exc: AuthenticationException):
    """Handle authentication errors."""
    return JSONResponse(
        status_code=401,
        content={
            "detail": exc.detail,
            "error_code": "AUTHENTICATION_ERROR",
        },
    )


@main_app.exception_handler(AuthorizationException)
async def authorization_exception_handler(request: Request, exc: AuthorizationException):
    """Handle authorization errors."""
    return JSONResponse(
        status_code=403,
        content={
            "detail": exc.detail,
            "error_code": "AUTHORIZATION_ERROR",
        },
    )


@main_app.exception_handler(NotFoundException)
async def not_found_exception_handler(request: Request, exc: NotFoundException):
    """Handle not found errors."""
    return JSONResponse(
        status_code=404,
        content={
            "detail": exc.detail,
            "error_code": "NOT_FOUND_ERROR",
        },
    )


@main_app.exception_handler(ConflictException)
async def conflict_exception_handler(request: Request, exc: ConflictException):
    """Handle conflict errors (e.g., duplicate resource)."""
    return JSONResponse(
        status_code=409,
        content={
            "detail": exc.detail,
            "error_code": "CONFLICT_ERROR",
        },
    )


@main_app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors with detailed logging"""
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    # Log the error with structured logging
    import uuid
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    
    logger.log_error(
        request_id=request_id,
        error=exc,
        method=request.method,
        path=request.url.path,
        ip_address=request.client.host if request.client else "unknown",
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error_code": "INTERNAL_ERROR",
            "timestamp": datetime.now().isoformat(),
            "request_id": request_id,
        },
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
    """Add security headers to all responses"""
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    
    # Content Security Policy
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' https://cdn.jsdelivr.net; "
        "connect-src 'self' https://api.; "
        "frame-ancestors 'none';"
    )
    
    # HSTS (only if using HTTPS)
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )
    
    return response


@main_app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Implement rate limiting for all endpoints"""
    client_ip = request.client.host if request.client else "unknown"
    path = request.url.path
    method = request.method
    
    # Skip rate limiting for health checks and static files
    if path.startswith("/health") or path.startswith("/static"):
        return await call_next(request)
    
    # Implement rate limiting logic here
    # This is a simplified example - in production, use Redis or similar
    
    response = await call_next(request)
    return response


@main_app.middleware("http")
async def request_validation_middleware(request: Request, call_next):
    """Validate request size and headers"""
    # Check request size
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB
        return JSONResponse(
            status_code=413,
            content={
                "detail": "Request too large",
                "error_code": "PAYLOAD_TOO_LARGE",
            },
        )
    
    # Check for required headers (skip for empty-body POSTs like from-template)
    if request.method in ["POST", "PUT", "PATCH"]:
        cl = request.headers.get("content-length", "0")
        has_body = cl != "0" and request.headers.get("content-type") is not None
        if cl != "0" and "content-type" not in request.headers:
            return JSONResponse(
                status_code=400,
                content={
                    "detail": "Content-Type header is required",
                    "error_code": "MISSING_CONTENT_TYPE",
                },
            )
    
    response = await call_next(request)
    return response


@main_app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Add request ID to all API responses"""
    import time
    import uuid
    
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        logger.log_error(
            request_id=request_id,
            error=e,
            method=request.method,
            path=request.url.path,
            ip_address=request.client.host if request.client else "unknown",
        )
        raise


# ═══════════════════════════════════════════════════════════════
# Token device-binding validation middleware
# ═══════════════════════════════════════════════════════════════

_COOKIE_NAME = "fastapiusersauth"


@main_app.middleware("http")
async def token_device_validation_middleware(request: Request, call_next):
    """Validate token IP/UA binding on every API request.

    Rules:
    - Different User-Agent → update UA in DB, allow request
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

    current_ip = get_client_ip(request)
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

            # Check User-Agent — update if different (don't block)
            if db_token.user_agent and current_ua and db_token.user_agent != current_ua:
                _token_logger.info(
                    "Token UA change: old_ua=%s new_ua=%s user_id=%s — updating",
                    db_token.user_agent,
                    current_ua,
                    db_token.user_id,
                )
                db_token.user_agent = current_ua
                await session.commit()

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
