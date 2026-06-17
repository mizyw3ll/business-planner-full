from core.models import BusinessPlan, FinancialChart, Note, PlanBlock, User, db_helper
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.api_v1.auth.fastapi_users import current_active_user

from .schemas import (
    DashboardChartItem,
    DashboardNoteItem,
    DashboardPlanItem,
    DashboardResponse,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    # Counts
    plan_count = (
        await session.execute(select(func.count()).select_from(BusinessPlan).where(BusinessPlan.user_id == user.id))
    ).scalar() or 0

    chart_count = (
        await session.execute(select(func.count()).select_from(FinancialChart).where(FinancialChart.user_id == user.id))
    ).scalar() or 0

    note_count = (
        await session.execute(select(func.count()).select_from(Note).where(Note.user_id == user.id))
    ).scalar() or 0

    block_count = (
        await session.execute(
            select(func.count())
            .select_from(PlanBlock)
            .join(BusinessPlan, PlanBlock.business_plan_id == BusinessPlan.id)
            .where(BusinessPlan.user_id == user.id)
        )
    ).scalar() or 0

    # Recent plans with block counts
    recent_plans_stmt = (
        select(
            BusinessPlan.id,
            BusinessPlan.title,
            BusinessPlan.description,
            BusinessPlan.created_at,
            func.count(PlanBlock.id).label("block_count"),
        )
        .outerjoin(PlanBlock, BusinessPlan.id == PlanBlock.business_plan_id)
        .where(BusinessPlan.user_id == user.id)
        .group_by(BusinessPlan.id, BusinessPlan.title, BusinessPlan.description, BusinessPlan.created_at)
        .order_by(BusinessPlan.created_at.desc())
        .limit(5)
    )
    recent_plans_result = await session.execute(recent_plans_stmt)
    recent_plans = [
        DashboardPlanItem(
            id=row.id,
            title=row.title,
            description=row.description,
            block_count=row.block_count,
            created_at=row.created_at.isoformat() if row.created_at else "",
        )
        for row in recent_plans_result.all()
    ]

    # Recent charts with point counts
    recent_charts_stmt = (
        select(
            FinancialChart.id,
            FinancialChart.title,
            FinancialChart.created_at,
            func.count(FinancialChart.id).label("point_count"),
        )
        .where(FinancialChart.user_id == user.id)
        .group_by(FinancialChart.id, FinancialChart.title, FinancialChart.created_at)
        .order_by(FinancialChart.created_at.desc())
        .limit(5)
    )
    recent_charts_result = await session.execute(recent_charts_stmt)
    recent_charts = [
        DashboardChartItem(
            id=row.id,
            title=row.title,
            point_count=row.point_count,
            created_at=row.created_at.isoformat() if row.created_at else "",
        )
        for row in recent_charts_result.all()
    ]

    # Recent notes
    recent_notes_stmt = (
        select(Note.id, Note.title, Note.created_at)
        .where(Note.user_id == user.id)
        .order_by(Note.created_at.desc())
        .limit(5)
    )
    recent_notes_result = await session.execute(recent_notes_stmt)
    recent_notes = [
        DashboardNoteItem(
            id=row.id,
            title=row.title,
            created_at=row.created_at.isoformat() if row.created_at else "",
        )
        for row in recent_notes_result.all()
    ]

    return DashboardResponse(
        plan_count=plan_count,
        chart_count=chart_count,
        note_count=note_count,
        block_count=block_count,
        recent_plans=recent_plans,
        recent_charts=recent_charts,
        recent_notes=recent_notes,
    )
