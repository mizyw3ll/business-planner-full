from typing import Annotated

from core.models import (
    FinancialChart,
    User,
    db_helper,
)
from fastapi import (
    Depends,
    HTTPException,
    Path,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import noload, selectinload

from api.api_v1.auth.fastapi_users import current_active_user


async def financial_chart_owner_only(
    chart_id: Annotated[int, Path],
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
) -> FinancialChart:
    """Ownership-проверка: 1 запрос, без подгрузки relations."""
    stmt = select(FinancialChart).where(FinancialChart.id == chart_id).options(noload(FinancialChart.chart_points))
    result = await session.execute(stmt)
    chart = result.scalar_one_or_none()
    if not chart or chart.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="График не найден",
        )
    return chart


async def financial_chart_by_id(
    chart_id: Annotated[int, Path],
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = (
        select(FinancialChart)
        .where(FinancialChart.id == chart_id)
        .options(
            selectinload(FinancialChart.chart_points),
            selectinload(FinancialChart.currency),
        )
    )
    result = await session.execute(stmt)
    chart = result.scalar_one_or_none()
    if not chart or chart.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="График не найден",
        )
    return chart
