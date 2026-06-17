from fastapi_users.authentication import CookieTransport

cookie_transport = CookieTransport(
    cookie_max_age=86400 * 5,  # 5 дней
    cookie_secure=True,
    cookie_httponly=True,
    cookie_samesite="lax",
)
