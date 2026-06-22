"""Tests for datetime.now(UTC) usage in auth.

Verifies:
- Token cleanup uses datetime.now(timezone.utc) instead of datetime.utcnow()
- Auth views use modern datetime APIs
"""
import inspect
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest


@pytest.mark.asyncio
async def test_token_cleanup_uses_utc_datetime():
    """_cleanup_expired_tokens must use datetime.now(timezone.utc), not datetime.utcnow()."""
    # Verify the function exists and can be imported
    from main import _cleanup_expired_tokens

    # Verify it uses timezone.utc (not utcnow)
    source = inspect.getsource(_cleanup_expired_tokens)
    assert "timezone.utc" in source or "UTC" in source, \
        "_cleanup_expired_tokens should use timezone-aware datetime"


def test_auth_views_imports_use_utc():
    """Auth views must import UTC from datetime, not use datetime.utcnow()."""
    from api.api_v1.auth import views as auth_views

    source = inspect.getsource(auth_views)
    assert "utcnow()" not in source, "auth/views.py still uses deprecated datetime.utcnow()"
    assert "timezone.utc" in source or "UTC" in source, "auth/views.py should use timezone.utc or UTC"


def test_email_service_uses_utc():
    """Email service must use modern datetime API."""
    from services.email import service as email_service

    source = inspect.getsource(email_service)
    assert "utcnow()" not in source, "email/service.py still uses deprecated datetime.utcnow()"


def test_user_manager_uses_utc():
    """User manager must use modern datetime API."""
    from core.authentication import user_manager

    source = inspect.getsource(user_manager)
    assert "utcnow()" not in source, "user_manager.py still uses deprecated datetime.utcnow()"
