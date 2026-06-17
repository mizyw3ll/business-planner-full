from typing import Annotated

from core.models import (
    ChartPoint,
    FinancialChart,
    db_helper,
)
from fastapi import (
    APIRouter,
    Depends,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from api.api_v1.financial.financial_chart.dependencies import (
    financial_chart_by_id,
)

from . import crud
from .dependencies import chart_point_by_id
from .schemas import (
    ChartPointCreate,
    ChartPointRead,
    ChartPointUpdate,
)

router = APIRouter(
    # tags=["Chart Points"],
)


@router.get("", response_model=list[ChartPointRead])
async def get_points(
    chart: Annotated[FinancialChart, Depends(financial_chart_by_id)],
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await crud.get_chart_points(
        session=session,
        chart_id=chart.id,
    )


@router.post(
    "",
    response_model=ChartPointRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_point(
    point_in: ChartPointCreate,
    chart: Annotated[FinancialChart, Depends(financial_chart_by_id)],
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await crud.create_chart_point(
        session=session,
        point_in=point_in,
        chart_id=chart.id,
    )


@router.patch(
    "/{point_id}",
    response_model=ChartPointRead,
)
async def update_point(
    point_update: ChartPointUpdate,
    point: Annotated[ChartPoint, Depends(chart_point_by_id)],
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await crud.update_chart_point(
        session=session,
        point=point,
        point_update=point_update,
    )


@router.delete(
    "/{point_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_point(
    point: Annotated[ChartPoint, Depends(chart_point_by_id)],
    session: AsyncSession = Depends(db_helper.session_getter),
):
    await crud.delete_chart_point(session=session, point=point)
