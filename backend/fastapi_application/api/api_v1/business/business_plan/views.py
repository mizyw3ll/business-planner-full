from typing import Annotated

from core.models import BusinessPlan, PlanBlock, User, db_helper
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.api_v1.auth.fastapi_users import current_active_user

from . import crud
from .dependencies import (
    business_plan_by_id,
    business_plan_for_read,
    business_plan_light_by_id,
    business_plan_owner_only,
)
from .schemas import (
    BusinessPlanAnalyticsRead,
    BusinessPlanCreate,
    BusinessPlanListItemRead,
    BusinessPlanRead,
    BusinessPlanUpdate,
)

router = APIRouter()


@router.get("", response_model=list[BusinessPlanListItemRead])
async def get_my_plans(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await crud.get_business_plans_light(
        session=session,
        user_id=user.id,
    )


@router.get(
    "/{plan_id}",
    response_model=BusinessPlanRead,
)
async def get_plan(plan: Annotated[BusinessPlan, Depends(business_plan_for_read)]):
    return plan


@router.get(
    "/{plan_id}/analytics",
    response_model=BusinessPlanAnalyticsRead,
)
async def get_plan_analytics(
    plan_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = (
        select(BusinessPlan)
        .where(BusinessPlan.id == plan_id)
        .where(BusinessPlan.user_id == user.id)
        .options(
            selectinload(BusinessPlan.blocks).selectinload(PlanBlock.comments),
            selectinload(BusinessPlan.blocks).selectinload(PlanBlock.linked_financial_charts),
        )
    )
    result = await session.execute(stmt)
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Бизнес-план не найден")

    blocks = list(plan.blocks)
    block_type_breakdown: dict[str, int] = {}
    drafts_count = 0
    comments_count = 0
    attachments_count = 0
    linked_chart_ids: set[int] = set()
    total_content_chars = 0
    rich_blocks_count = 0

    for block in blocks:
        block_type_breakdown[block.block_type] = block_type_breakdown.get(block.block_type, 0) + 1
        if block.has_unpublished_draft:
            drafts_count += 1
        if block.rich_content:
            rich_blocks_count += 1
        total_content_chars += len(block.content or "")
        attachments_count += len(block.media_attachments or [])
        comments_count += len(block.comments or [])
        linked_chart_ids.update(block.linked_financial_chart_ids)

    average_content_chars = total_content_chars / len(blocks) if blocks else 0.0

    return BusinessPlanAnalyticsRead(
        plan_id=plan.id,
        blocks_count=len(blocks),
        drafts_count=drafts_count,
        comments_count=comments_count,
        attachments_count=attachments_count,
        linked_financial_charts_count=len(linked_chart_ids),
        rich_blocks_count=rich_blocks_count,
        total_content_chars=total_content_chars,
        average_content_chars=average_content_chars,
        block_type_breakdown=block_type_breakdown,
    )


@router.post(
    "",
    response_model=BusinessPlanListItemRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_plan(
    plan_in: BusinessPlanCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await crud.create_business_plan(
        session=session,
        plan_in=plan_in,
        user_id=user.id,
    )


@router.patch("/{plan_id}", response_model=BusinessPlanListItemRead)
async def update_plan(
    plan_update: BusinessPlanUpdate,
    plan: Annotated[BusinessPlan, Depends(business_plan_light_by_id)],
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await crud.update_business_plan(
        session=session,
        plan=plan,
        plan_update=plan_update,
    )


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan: Annotated[BusinessPlan, Depends(business_plan_owner_only)],
    session: AsyncSession = Depends(db_helper.session_getter),
) -> None:
    await crud.delete_business_plan(
        session=session,
        plan=plan,
    )


@router.post("/{plan_id}/duplicate", response_model=BusinessPlanRead, status_code=status.HTTP_201_CREATED)
async def duplicate_plan(
    plan: Annotated[BusinessPlan, Depends(business_plan_by_id)],
    session: AsyncSession = Depends(db_helper.session_getter),
):
    new_plan = BusinessPlan(
        user_id=plan.user_id,
        title=f"Копия: {plan.title}",
        description=plan.description,
    )
    session.add(new_plan)
    await session.flush()

    for block in sorted(plan.blocks, key=lambda b: b.block_order):
        new_block = PlanBlock(
            business_plan_id=new_plan.id,
            title=block.title,
            content=block.content,
            block_type=block.block_type,
            block_order=block.block_order,
            rich_content=block.rich_content,
            media_attachments=block.media_attachments,
            due_date=block.due_date,
        )
        new_block.linked_financial_charts = block.linked_financial_charts
        session.add(new_block)

    await session.commit()

    stmt: Select[tuple[BusinessPlan]] = (
        select(BusinessPlan)
        .where(BusinessPlan.id == new_plan.id)
        .options(
            selectinload(BusinessPlan.blocks).selectinload(PlanBlock.tags),
            selectinload(BusinessPlan.blocks).selectinload(PlanBlock.linked_financial_charts),
            selectinload(BusinessPlan.tags),
        )
    )
    result = await session.execute(stmt)
    return result.scalar_one()
