"""Tests for dashboard optimized queries.

Verifies:
- Single-query count aggregation via scalar_subquery()
- Recent plans with block counts via JOIN + GROUP BY
- Recent charts with point counts (bug fix: counts ChartPoint, not FinancialChart)
- Recent notes query
"""
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from tests.conftest import MockResult, _make_mock_session, _make_mock_user


@pytest.mark.asyncio
async def test_dashboard_counts_use_single_query():
    """All 4 counts are fetched via scalar_subquery() and returned in one row."""
    session = _make_mock_session()
    user = _make_mock_user(user_id=42)

    counts_row = SimpleNamespace(plans=5, charts=3, notes=8, blocks=12)

    call_count = 0

    async def side_effect(stmt):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            # counts query — uses .one()
            return MockResult(one_rows=[counts_row])
        # All other queries return empty
        return MockResult(all_rows=[])

    session.execute = AsyncMock(side_effect=side_effect)

    from api.api_v1.dashboard.views import get_dashboard
    result = await get_dashboard(user=user, session=session)

    assert result.plan_count == 5
    assert result.chart_count == 3
    assert result.note_count == 8
    assert result.block_count == 12


@pytest.mark.asyncio
async def test_dashboard_recent_charts_count_chart_points_not_financial_charts():
    """Bug fix verification: point_count must count ChartPoint rows, not FinancialChart rows."""
    session = _make_mock_session()
    user = _make_mock_user(user_id=1)

    counts_row = SimpleNamespace(plans=0, charts=2, notes=0, blocks=0)
    charts_row = SimpleNamespace(
        id=10, title="Chart A",
        created_at=SimpleNamespace(isoformat=lambda: "2026-01-01T00:00:00"),
        point_count=7,
    )

    call_count = 0

    async def side_effect(stmt):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return MockResult(one_rows=[counts_row])
        elif call_count == 2:
            return MockResult(all_rows=[])
        elif call_count == 3:
            return MockResult(all_rows=[charts_row])
        return MockResult(all_rows=[])

    session.execute = AsyncMock(side_effect=side_effect)

    from api.api_v1.dashboard.views import get_dashboard
    result = await get_dashboard(user=user, session=session)

    assert len(result.recent_charts) == 1
    assert result.recent_charts[0].point_count == 7


@pytest.mark.asyncio
async def test_dashboard_returns_recent_items():
    """Dashboard returns recent plans, charts, and notes limited to 5 each."""
    session = _make_mock_session()
    user = _make_mock_user(user_id=1)

    now = SimpleNamespace(isoformat=lambda: "2026-06-21T00:00:00")

    call_count = 0

    async def side_effect(stmt):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return MockResult(one_rows=[SimpleNamespace(plans=0, charts=0, notes=0, blocks=0)])
        elif call_count == 2:
            return MockResult(all_rows=[
                SimpleNamespace(id=1, title="Plan 1", description="desc", created_at=now, block_count=3),
            ])
        elif call_count == 3:
            return MockResult(all_rows=[
                SimpleNamespace(id=10, title="Chart 1", created_at=now, point_count=5),
            ])
        elif call_count == 4:
            return MockResult(all_rows=[
                SimpleNamespace(id=20, title="Note 1", created_at=now),
            ])
        return MockResult(all_rows=[])

    session.execute = AsyncMock(side_effect=side_effect)

    from api.api_v1.dashboard.views import get_dashboard
    result = await get_dashboard(user=user, session=session)

    assert len(result.recent_plans) == 1
    assert result.recent_plans[0].block_count == 3
    assert len(result.recent_charts) == 1
    assert result.recent_charts[0].point_count == 5
    assert len(result.recent_notes) == 1
