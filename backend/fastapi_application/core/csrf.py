"""CSRF Protection — Double Submit Cookie pattern.

- GET /api/v1/csrf-token generates a random token and sets it as a non-HttpOnly cookie
- Mutation requests (POST/PUT/PATCH/DELETE) must include X-CSRF-Token header
  matching the csrf-token cookie value
- Auth and GET endpoints are exempt
"""
import secrets
from datetime import timedelta

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint


CSRF_COOKIE_NAME = "csrf-token"
CSRF_HEADER_NAME = "x-csrf-token"
CSRF_COOKIE_MAX_AGE = int(timedelta(hours=1).total_seconds())  # 1 hour

# Paths that are exempt from CSRF validation
CSRF_EXEMPT_PATHS = frozenset({
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/request-verify-token",
    "/api/v1/auth/verify",
    "/api/v1/csrf-token",
})


def generate_csrf_token() -> str:
    """Generate a cryptographically secure CSRF token."""
    return secrets.token_urlsafe(32)


async def get_csrf_response(response: Response, request: Request, token: str) -> Response:
    """Set the CSRF cookie on the response."""
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=token,
        max_age=CSRF_COOKIE_MAX_AGE,
        httponly=False,  # Must be readable by JS
        samesite="lax",
        secure=request.url.scheme == "https",
        path="/",
    )
    return response


class CSRFMiddleware(BaseHTTPMiddleware):
    """Middleware that validates CSRF token on mutation requests."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path

        # Skip CSRF for exempt paths, non-API paths, and GET/HEAD/OPTIONS
        if (
            not path.startswith("/api/")
            or path in CSRF_EXEMPT_PATHS
            or request.method in ("GET", "HEAD", "OPTIONS")
        ):
            return await call_next(request)

        # CSRF validation for mutation requests
        csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)
        csrf_header = request.headers.get(CSRF_HEADER_NAME)

        if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=403,
                content={
                    "detail": "CSRF validation failed",
                    "error_code": "CSRF_FAILED",
                },
            )

        return await call_next(request)
