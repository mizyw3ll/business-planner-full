"""
Create
Read
Update
Delete
"""

from datetime import UTC, datetime

from core.models import FinancialChart, PlanBlock
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .schemas import (
    PlanBlockCreate,
    PlanBlockDraftSave,
    PlanBlockUpdate,
)


async def get_plan_blocks(
    session: AsyncSession,
    business_plan_id: int,
) -> list[PlanBlock]:
    stmt = (
        select(PlanBlock)
        .where(PlanBlock.business_plan_id == business_plan_id)
        .order_by(PlanBlock.block_order, PlanBlock.id)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_plan_block(
    session: AsyncSession,
    plan_block_id: int,
) -> PlanBlock | None:
    return await session.get(
        PlanBlock,
        plan_block_id,
    )


async def create_plan_block(
    session: AsyncSession,
    plan_block_in: PlanBlockCreate,
    business_plan_id: int,
    user_id: int | None = None,
) -> PlanBlock:
    chart_ids = plan_block_in.linked_financial_chart_ids
    linked_charts: list[FinancialChart] = []
    if chart_ids:
        linked_charts = await _get_financial_charts_by_ids(session, chart_ids, user_id)

    existing = await get_plan_blocks(session, business_plan_id)
    max_order = max((b.block_order for b in existing), default=-1)

    block_data = plan_block_in.model_dump(exclude={"linked_financial_chart_ids"})
    if block_data.get("block_order", 0) == 0 and existing:
        block_data["block_order"] = max_order + 1

    block = PlanBlock(
        **block_data,
        business_plan_id=business_plan_id,
        linked_financial_charts=linked_charts,
    )
    session.add(block)
    await session.commit()

    # Reload with tags + charts
    stmt = (
        select(PlanBlock)
        .where(PlanBlock.id == block.id)
        .options(
            selectinload(PlanBlock.tags),
            selectinload(PlanBlock.linked_financial_charts),
        )
    )
    result = await session.execute(stmt)
    return result.scalar_one()


async def update_plan_block(
    session: AsyncSession,
    plan_block: PlanBlock,
    plan_block_update: PlanBlockUpdate,
    user_id: int | None = None,
) -> PlanBlock:
    update_data = plan_block_update.model_dump(exclude_unset=True)

    if "linked_financial_chart_ids" in update_data:
        plan_block.linked_financial_charts = await _get_financial_charts_by_ids(
            session,
            update_data.pop("linked_financial_chart_ids") or [],
            user_id,
        )

    for name, value in update_data.items():
        setattr(plan_block, name, value)
    await session.commit()

    # Reload with tags + charts
    stmt = (
        select(PlanBlock)
        .where(PlanBlock.id == plan_block.id)
        .options(
            selectinload(PlanBlock.tags),
            selectinload(PlanBlock.linked_financial_charts),
        )
    )
    result = await session.execute(stmt)
    return result.scalar_one()


async def save_plan_block_draft(
    session: AsyncSession,
    plan_block: PlanBlock,
    draft_in: PlanBlockDraftSave,
) -> PlanBlock:
    update_data = draft_in.model_dump(exclude_unset=True)
    for name, value in update_data.items():
        setattr(plan_block, name, value)
    plan_block.has_unpublished_draft = True
    plan_block.draft_saved_at = datetime.now(UTC)
    await session.commit()
    return plan_block


async def publish_plan_block_draft(
    session: AsyncSession,
    plan_block: PlanBlock,
) -> PlanBlock:
    if plan_block.draft_title is not None:
        plan_block.title = plan_block.draft_title
    if plan_block.draft_content is not None:
        plan_block.content = plan_block.draft_content
    if plan_block.draft_rich_content is not None:
        plan_block.rich_content = plan_block.draft_rich_content
    if plan_block.draft_media_attachments is not None:
        plan_block.media_attachments = plan_block.draft_media_attachments

    plan_block.has_unpublished_draft = False
    plan_block.draft_title = None
    plan_block.draft_content = None
    plan_block.draft_rich_content = None
    plan_block.draft_media_attachments = None
    plan_block.draft_saved_at = datetime.now(UTC)
    await session.commit()
    return plan_block


async def delete_plan_block(
    session: AsyncSession,
    plan_block: PlanBlock,
) -> None:
    await session.delete(plan_block)
    await session.commit()


# grad and drop
async def reorder_plan_blocks(
    session: AsyncSession,
    business_plan_id: int,
    new_order: list[int],
) -> None:
    """
    Переупорядочивает блоки в бизнес-плане по новому порядку ID
    """
    # Получаем все блоки плана
    stmt = select(PlanBlock).where(PlanBlock.business_plan_id == business_plan_id)
    result = await session.execute(stmt)
    blocks = result.scalars().all()

    block_map = {block.id: block for block in blocks}

    # Проверяем, что все ID из new_order существуют
    for idx, block_id in enumerate(new_order):
        block = block_map.get(block_id)
        if not block:
            raise HTTPException(status_code=404, detail=f"Блок с id {block_id} не найден в плане {business_plan_id}")
        block.block_order = idx

    await session.commit()


async def _get_financial_charts_by_ids(
    session: AsyncSession,
    chart_ids: list[int],
    user_id: int | None = None,
) -> list[FinancialChart]:
    if not chart_ids:
        return []

    stmt = select(FinancialChart).where(FinancialChart.id.in_(chart_ids))
    if user_id is not None:
        stmt = stmt.where(FinancialChart.user_id == user_id)
    result = await session.execute(stmt)
    charts = list(result.scalars().all())
    found_ids = {chart.id for chart in charts}
    missing_ids = [chart_id for chart_id in chart_ids if chart_id not in found_ids]
    if missing_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Финансовые графики не найдены: {missing_ids}",
        )
    return charts
