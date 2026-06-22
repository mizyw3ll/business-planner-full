"""
Create
Read
Update
Delete
"""

from datetime import UTC, datetime

from core.models import BusinessPlan
from sqlalchemy import select
from sqlalchemy.engine import Result
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.api_v1.business.business_plan.schemas import (
    BusinessPlanCreate,
    BusinessPlanUpdate,
)


async def get_business_plans_light(
    session: AsyncSession,
    user_id: int,
) -> list[BusinessPlan]:
    stmt = (
        select(BusinessPlan)
        .where(BusinessPlan.user_id == user_id)
        .order_by(BusinessPlan.id)
        .options(selectinload(BusinessPlan.tags))
    )
    result: Result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_business_plan(
    session: AsyncSession,
    business_plan_id: int,
) -> BusinessPlan | None:
    stmt = select(BusinessPlan).where(BusinessPlan.id == business_plan_id).options(selectinload(BusinessPlan.tags))
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def create_business_plan(
    session: AsyncSession,
    plan_in: BusinessPlanCreate,
    user_id: int,
) -> BusinessPlan:
    business_plan = BusinessPlan(
        **plan_in.model_dump(),
        user_id=user_id,
    )
    session.add(business_plan)
    await session.commit()
    stmt = select(BusinessPlan).where(BusinessPlan.id == business_plan.id).options(selectinload(BusinessPlan.tags))
    result = await session.execute(stmt)
    return result.scalar_one()


async def update_business_plan(
    session: AsyncSession,
    plan: BusinessPlan,
    plan_update: BusinessPlanUpdate,
) -> BusinessPlan:
    update_data = plan_update.model_dump(exclude_unset=True)
    plan.updated_at = datetime.now(UTC)  # type: ignore[assignment]
    for name, value in update_data.items():
        setattr(plan, name, value)
    await session.commit()
    stmt = select(BusinessPlan).where(BusinessPlan.id == plan.id).options(selectinload(BusinessPlan.tags))
    result = await session.execute(stmt)
    return result.scalar_one()


async def delete_business_plan(
    session: AsyncSession,
    plan: BusinessPlan,
) -> None:
    await session.delete(plan)
    await session.commit()
