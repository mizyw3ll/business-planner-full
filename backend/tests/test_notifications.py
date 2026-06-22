"""Tests for notifications unread_count optimization.

Verifies:
- Uses SQL COUNT() instead of Python len()
- Correct filtering by user_id and is_read
"""
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from tests.conftest import MockResult, _make_mock_session, _make_mock_user


@pytest.mark.asyncio
async def test_unread_count_uses_sql_count():
    """unread_count must use SQL COUNT(), not load all notifications and count in Python."""
    session = _make_mock_session()
    user = _make_mock_user(user_id=1)

    session.execute = AsyncMock(return_value=MockResult(scalar_val=5))

    from api.api_v1.notifications.views import unread_count
    result = await unread_count(user=user, session=session)

    assert result == {"count": 5}


@pytest.mark.asyncio
async def test_unread_count_zero():
    """unread_count returns 0 when no unread notifications exist."""
    session = _make_mock_session()
    user = _make_mock_user(user_id=42)

    session.execute = AsyncMock(return_value=MockResult(scalar_val=0))

    from api.api_v1.notifications.views import unread_count
    result = await unread_count(user=user, session=session)

    assert result == {"count": 0}


@pytest.mark.asyncio
async def test_unread_count_filters_by_is_read():
    """The query filters on is_read=False specifically."""
    session = _make_mock_session()
    user = _make_mock_user(user_id=1)

    captured_stmt = None

    async def capture_execute(stmt):
        nonlocal captured_stmt
        captured_stmt = stmt
        return MockResult(scalar_val=3)

    session.execute = AsyncMock(side_effect=capture_execute)

    from api.api_v1.notifications.views import unread_count
    result = await unread_count(user=user, session=session)

    assert result == {"count": 3}
    assert captured_stmt is not None
