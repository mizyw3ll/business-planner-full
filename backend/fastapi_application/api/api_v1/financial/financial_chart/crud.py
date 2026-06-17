"""
Create
Read
Update
Delete
"""

from datetime import UTC, datetime

from core.models import Currency, FinancialChart
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.engine import Result
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .schemas import (
    FinancialChartCreate,
    FinancialChartUpdate,
)


async def get_user_charts_light(
    session: AsyncSession,
    user_id: int,
) -> list[FinancialChart]:
    stmt = (
        select(FinancialChart)
        .where(FinancialChart.user_id == user_id)
        .order_by(FinancialChart.id)
        .options(selectinload(FinancialChart.currency))
    )
    result: Result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_user_charts(
    session: AsyncSession,
    user_id: int,
) -> list[FinancialChart]:
    stmt = (
        select(FinancialChart)
        .where(FinancialChart.user_id == user_id)
        .order_by(FinancialChart.id)
        .options(
            selectinload(FinancialChart.chart_points),
            selectinload(FinancialChart.currency),
        )
    )
    result: Result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_chart_points_batch(
    session: AsyncSession,
    user_id: int,
    chart_ids: list[int],
) -> dict[int, list]:
    if not chart_ids:
        return {}
    from core.models import ChartPoint

    stmt = (
        select(ChartPoint)
        .join(FinancialChart, ChartPoint.chart_id == FinancialChart.id)
        .where(
            FinancialChart.user_id == user_id,
            ChartPoint.chart_id.in_(chart_ids),
        )
        .order_by(ChartPoint.chart_id, ChartPoint.date)
    )
    result = await session.execute(stmt)
    points = list(result.scalars().all())
    grouped: dict[int, list] = {cid: [] for cid in chart_ids}
    for point in points:
        grouped.setdefault(point.chart_id, []).append(point)
    return grouped


async def create_chart(
    session: AsyncSession,
    chart_in: FinancialChartCreate,
    user_id: int,
) -> FinancialChart:
    # Валидация currency_id
    currency_stmt = select(Currency).where(Currency.id == chart_in.currency_id, Currency.is_active)
    currency_result = await session.execute(currency_stmt)
    currency = currency_result.scalar_one_or_none()
    if not currency:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Валюта с указанным ID не найдена или неактивна"
        )

    chart = FinancialChart(**chart_in.model_dump(), user_id=user_id)
    session.add(chart)
    await session.commit()

    stmt = (
        select(FinancialChart)
        .where(FinancialChart.id == chart.id)
        .options(
            selectinload(FinancialChart.chart_points),
            selectinload(FinancialChart.currency),
        )
    )
    result = await session.execute(stmt)
    return result.scalar_one()


async def update_chart(
    session: AsyncSession,
    chart: FinancialChart,
    chart_update: FinancialChartUpdate,
) -> FinancialChart:
    update_data = chart_update.model_dump(exclude_unset=True)

    # Валидация currency_id если он указан для обновления
    if "currency_id" in update_data:
        currency_stmt = select(Currency).where(Currency.id == update_data["currency_id"], Currency.is_active)
        currency_result = await session.execute(currency_stmt)
        currency = currency_result.scalar_one_or_none()
        if not currency:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Валюта с указанным ID не найдена или неактивна"
            )

    chart.updated_at = datetime.now(UTC)  # type: ignore[assignment]
    for name, value in update_data.items():
        setattr(chart, name, value)
    await session.commit()

    stmt = (
        select(FinancialChart)
        .where(FinancialChart.id == chart.id)
        .options(
            selectinload(FinancialChart.chart_points),
            selectinload(FinancialChart.currency),
        )
    )
    result = await session.execute(stmt)
    return result.unique().scalar_one()


async def delete_chart(
    session: AsyncSession,
    chart: FinancialChart,
) -> None:
    await session.delete(chart)
    await session.commit()
