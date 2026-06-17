from typing import Annotated

from core.models import BusinessPlan, PlanBlock, db_helper
from fastapi import Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.api_v1.business.business_plan.dependencies import business_plan_owner_only


async def plan_block_by_id(
    block_id: Annotated[int, Path],
    business_plan: BusinessPlan = Depends(business_plan_owner_only),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = (
        select(PlanBlock)
        .where(PlanBlock.id == block_id)
        .options(
            selectinload(PlanBlock.tags),
            selectinload(PlanBlock.linked_financial_charts),
        )
    )
    result = await session.execute(stmt)
    block = result.scalar_one_or_none()

    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Блок плана не найден: {block_id}",
        )

    if block.business_plan_id != business_plan.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Блок плана не найден: {block_id}",
        )

    return block
