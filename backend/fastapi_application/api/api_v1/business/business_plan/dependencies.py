from typing import Annotated

from core.models import BusinessPlan, PlanBlock, User, db_helper
from fastapi import Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import noload, selectinload

from api.api_v1.auth.fastapi_users import current_active_user


def _plan_ownership_check(plan: BusinessPlan | None, user: User) -> BusinessPlan:
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бизнес-план не найден",
        )
    if plan.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бизнес-план не найден",
        )
    return plan


async def business_plan_owner_only(
    plan_id: Annotated[int, Path],
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
) -> BusinessPlan:
    """Только ownership-проверка: 1 запрос, без подгрузки relations."""
    stmt = select(BusinessPlan).where(BusinessPlan.id == plan_id).options(noload("*"))
    result = await session.execute(stmt)
    return _plan_ownership_check(result.scalar_one_or_none(), user)


async def business_plan_light_by_id(
    plan_id: Annotated[int, Path],
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
) -> BusinessPlan:
    """Метаданные плана и теги — без блоков и снимков."""
    stmt = (
        select(BusinessPlan)
        .where(BusinessPlan.id == plan_id)
        .options(
            noload(BusinessPlan.blocks),
            noload(BusinessPlan.snapshots),
            selectinload(BusinessPlan.tags),
        )
    )
    result = await session.execute(stmt)
    return _plan_ownership_check(result.scalar_one_or_none(), user)


async def business_plan_for_read(
    plan_id: Annotated[int, Path],
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
) -> BusinessPlan:
    """Полный план для GET /plans/{id}: блоки + теги, без снимков."""
    stmt = (
        select(BusinessPlan)
        .where(BusinessPlan.id == plan_id)
        .options(
            noload(BusinessPlan.snapshots),
            selectinload(BusinessPlan.tags),
            selectinload(BusinessPlan.blocks).selectinload(PlanBlock.tags),
            selectinload(BusinessPlan.blocks).selectinload(PlanBlock.linked_financial_charts),
            selectinload(BusinessPlan.blocks).selectinload(PlanBlock.comments),
        )
    )
    result = await session.execute(stmt)
    return _plan_ownership_check(result.scalar_one_or_none(), user)


async def business_plan_by_id(
    plan_id: Annotated[int, Path],
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
) -> BusinessPlan:
    """Полный план для мутаций блоков: блоки + теги + графики, без снимков."""
    stmt = (
        select(BusinessPlan)
        .where(BusinessPlan.id == plan_id)
        .options(
            noload(BusinessPlan.snapshots),
            selectinload(BusinessPlan.blocks).selectinload(PlanBlock.tags),
            selectinload(BusinessPlan.blocks).selectinload(PlanBlock.linked_financial_charts),
            selectinload(BusinessPlan.tags),
        )
    )
    result = await session.execute(stmt)
    return _plan_ownership_check(result.scalar_one_or_none(), user)


async def business_plan_with_snapshots_by_id(
    plan_id: Annotated[int, Path],
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
) -> BusinessPlan:
    """План со снимками — только для snapshot endpoints."""
    stmt = (
        select(BusinessPlan)
        .where(BusinessPlan.id == plan_id)
        .options(
            selectinload(BusinessPlan.snapshots),
            selectinload(BusinessPlan.blocks).selectinload(PlanBlock.linked_financial_charts),
            selectinload(BusinessPlan.tags),
        )
    )
    result = await session.execute(stmt)
    return _plan_ownership_check(result.scalar_one_or_none(), user)
