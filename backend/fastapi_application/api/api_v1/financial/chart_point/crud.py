"""
Create
Read
Update
Delete
"""

from core.models import ChartPoint
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.api_v1.financial.chart_point.schemas import (
    ChartPointCreate,
    ChartPointUpdate,
)


async def get_chart_points(
    session: AsyncSession,
    chart_id: int,
) -> list[ChartPoint]:
    stmt = select(ChartPoint).where(ChartPoint.chart_id == chart_id).order_by(ChartPoint.date)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def create_chart_point(
    session: AsyncSession,
    point_in: ChartPointCreate,
    chart_id: int,
) -> ChartPoint:
    point = ChartPoint(
        **point_in.model_dump(),
        chart_id=chart_id,
    )
    session.add(point)
    await session.commit()
    return point


async def update_chart_point(
    session: AsyncSession,
    point: ChartPoint,
    point_update: ChartPointUpdate,
) -> ChartPoint:
    update_date = point_update.model_dump(exclude_unset=True).items()
    for key, value in update_date:
        setattr(point, key, value)
    await session.commit()
    return point


async def delete_chart_point(
    session: AsyncSession,
    point: ChartPoint,
) -> None:
    await session.delete(point)
    await session.commit()
