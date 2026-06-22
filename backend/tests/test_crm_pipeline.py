"""Tests for CRM pipeline stats optimization.

Verifies:
- Conditional aggregation (single GROUP BY for both status and priority)
- Correct totals calculation
- Empty state handling
"""
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from tests.conftest import MockResult, _make_mock_session, _make_mock_user


@pytest.mark.asyncio
async def test_pipeline_stats_uses_conditional_aggregation():
    """Pipeline stats must use 2 queries: totals + grouped, not 4+ separate queries."""
    session = _make_mock_session()
    user = _make_mock_user(user_id=1)

    call_count = 0

    async def side_effect(stmt):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return MockResult(one_rows=[SimpleNamespace(total=10, total_value=50000.0)])
        elif call_count == 2:
            return MockResult(all_rows=[
                SimpleNamespace(status="new", priority="high", cnt=3),
                SimpleNamespace(status="new", priority="medium", cnt=2),
                SimpleNamespace(status="won", priority="high", cnt=4),
                SimpleNamespace(status="lost", priority="low", cnt=1),
            ])
        return MockResult(all_rows=[])

    session.execute = AsyncMock(side_effect=side_effect)

    from api.api_v1.crm.views import get_pipeline_stats
    result = await get_pipeline_stats(user=user, session=session)

    assert call_count == 2
    assert result.total_deals == 10
    assert result.total_value == 50000.0
    assert result.by_status == {"new": 5, "won": 4, "lost": 1}
    assert result.by_priority == {"high": 7, "medium": 2, "low": 1}


@pytest.mark.asyncio
async def test_pipeline_stats_empty_deals():
    """Pipeline stats handles zero deals gracefully."""
    session = _make_mock_session()
    user = _make_mock_user(user_id=99)

    call_count = 0

    async def side_effect(stmt):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return MockResult(one_rows=[SimpleNamespace(total=0, total_value=0)])
        elif call_count == 2:
            return MockResult(all_rows=[])
        return MockResult(all_rows=[])

    session.execute = AsyncMock(side_effect=side_effect)

    from api.api_v1.crm.views import get_pipeline_stats
    result = await get_pipeline_stats(user=user, session=session)

    assert result.total_deals == 0
    assert result.total_value == 0.0
    assert result.by_status == {}
    assert result.by_priority == {}


@pytest.mark.asyncio
async def test_pipeline_stats_aggregates_across_priorities():
    """Status counts are summed across all priorities correctly."""
    session = _make_mock_session()
    user = _make_mock_user(user_id=1)

    call_count = 0

    async def side_effect(stmt):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return MockResult(one_rows=[SimpleNamespace(total=6, total_value=30000.0)])
        elif call_count == 2:
            return MockResult(all_rows=[
                SimpleNamespace(status="new", priority="low", cnt=1),
                SimpleNamespace(status="new", priority="medium", cnt=1),
                SimpleNamespace(status="new", priority="high", cnt=1),
                SimpleNamespace(status="qualified", priority="low", cnt=1),
                SimpleNamespace(status="qualified", priority="medium", cnt=1),
                SimpleNamespace(status="qualified", priority="high", cnt=1),
            ])
        return MockResult(all_rows=[])

    session.execute = AsyncMock(side_effect=side_effect)

    from api.api_v1.crm.views import get_pipeline_stats
    result = await get_pipeline_stats(user=user, session=session)

    assert result.by_status == {"new": 3, "qualified": 3}
    assert result.by_priority == {"low": 2, "medium": 2, "high": 2}
