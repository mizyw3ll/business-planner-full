from typing import Annotated

from core.models import (
    ChartPoint,
    FinancialChart,
    db_helper,
)
from fastapi import (
    Depends,
    HTTPException,
    Path,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from api.api_v1.financial.financial_chart.dependencies import financial_chart_by_id


async def chart_point_by_id(
    point_id: Annotated[int, Path],
    chart: FinancialChart = Depends(financial_chart_by_id),
    session: AsyncSession = Depends(db_helper.session_getter),
):  # -> ChartPoint (пересмотерть)
    point = await session.get(
        ChartPoint,
        point_id,
    )
    if not point or point.chart_id != chart.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Точка не найдена",
        )
    return point
