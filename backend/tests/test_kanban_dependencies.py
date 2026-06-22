"""Tests for Kanban N+1 fix via batch loading.

Verifies:
- _get_board_for_column loads column + board in single JOIN query
- _get_board_for_card loads card + column + board in single JOIN query
- Authorization check (board.user_id must match requesting user)
- 404 handling for missing resources
"""
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from tests.conftest import _make_mock_session, _make_mock_user


@pytest.mark.asyncio
async def test_get_board_for_column_single_query():
    """_get_board_for_column must use a single JOIN query, not separate session.get() calls."""
    session = _make_mock_session()
    user = _make_mock_user(user_id=1)

    mock_column = SimpleNamespace(id=10, board_id=5)
    mock_board = SimpleNamespace(id=5, user_id=1)

    session.execute = AsyncMock(return_value=SimpleNamespace(
        one_or_none=lambda: (mock_column, mock_board)
    ))

    from fastapi_application.api.api_v1.kanban.dependencies import _get_board_for_column
    result = await _get_board_for_column(column_id=10, user=user, session=session)

    # Single execute call (no N+1)
    assert session.execute.call_count == 1
    assert result.id == 5
    assert result.user_id == 1


@pytest.mark.asyncio
async def test_get_board_for_column_forbidden():
    """_get_board_for_column rejects access when board.user_id != user.id."""
    session = _make_mock_session()
    user = _make_mock_user(user_id=1)

    mock_column = SimpleNamespace(id=10, board_id=5)
    mock_board = SimpleNamespace(id=5, user_id=99)  # Different user

    session.execute = AsyncMock(return_value=SimpleNamespace(
        one_or_none=lambda: (mock_column, mock_board)
    ))

    from fastapi_application.api.api_v1.kanban.dependencies import _get_board_for_column
    with pytest.raises(HTTPException) as exc_info:
        await _get_board_for_column(column_id=10, user=user, session=session)

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_board_for_column_not_found():
    """_get_board_for_column returns 404 when column doesn't exist."""
    session = _make_mock_session()
    user = _make_mock_user(user_id=1)

    session.execute = AsyncMock(return_value=SimpleNamespace(
        one_or_none=lambda: None
    ))

    from fastapi_application.api.api_v1.kanban.dependencies import _get_board_for_column
    with pytest.raises(HTTPException) as exc_info:
        await _get_board_for_column(column_id=999, user=user, session=session)

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_board_for_card_single_query():
    """_get_board_for_card must use a single 3-way JOIN query."""
    session = _make_mock_session()
    user = _make_mock_user(user_id=1)

    mock_card = SimpleNamespace(id=20, column_id=10, title="Test card")
    mock_column = SimpleNamespace(id=10, board_id=5)
    mock_board = SimpleNamespace(id=5, user_id=1)

    session.execute = AsyncMock(return_value=SimpleNamespace(
        one_or_none=lambda: (mock_card, mock_column, mock_board)
    ))

    from fastapi_application.api.api_v1.kanban.dependencies import _get_board_for_card
    card, column, board = await _get_board_for_card(card_id=20, user=user, session=session)

    # Single execute call (no N+1)
    assert session.execute.call_count == 1
    assert card.id == 20
    assert column.id == 10
    assert board.id == 5


@pytest.mark.asyncio
async def test_get_board_for_card_not_found():
    """_get_board_for_card returns 404 when card doesn't exist."""
    session = _make_mock_session()
    user = _make_mock_user(user_id=1)

    session.execute = AsyncMock(return_value=SimpleNamespace(
        one_or_none=lambda: None
    ))

    from fastapi_application.api.api_v1.kanban.dependencies import _get_board_for_card
    with pytest.raises(HTTPException) as exc_info:
        await _get_board_for_card(card_id=999, user=user, session=session)

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_board_for_card_target_column_same_board():
    """_get_board_for_card_target_column verifies target column belongs to same board."""
    session = _make_mock_session()
    user = _make_mock_user(user_id=1)

    mock_card = SimpleNamespace(id=20, column_id=10)
    mock_column = SimpleNamespace(id=10, board_id=5)
    mock_board = SimpleNamespace(id=5, user_id=1)
    mock_target_col = SimpleNamespace(id=15, board_id=5)

    call_count = 0

    async def side_effect(stmt):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return SimpleNamespace(one_or_none=lambda: (mock_card, mock_column, mock_board))
        elif call_count == 2:
            return SimpleNamespace(scalar_one_or_none=lambda: mock_target_col)
        return SimpleNamespace(scalar_one_or_none=lambda: None)

    session.execute = AsyncMock(side_effect=side_effect)

    from fastapi_application.api.api_v1.kanban.dependencies import _get_board_for_card_target_column
    card, column, board = await _get_board_for_card_target_column(
        card_id=20, target_column_id=15, user=user, session=session
    )

    assert card.id == 20
    assert board.id == 5
