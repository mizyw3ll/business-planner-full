from typing import Annotated

from core.models import BusinessPlan, FinancialChart, PlanBlock, PlanSnapshot, User, db_helper
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.api_v1.auth.fastapi_users import current_active_user

from .dependencies import business_plan_by_id, business_plan_owner_only, business_plan_with_snapshots_by_id
from .schemas import BusinessPlanRead

snapshot_router = APIRouter()

SNAPSHOT_LIMIT = 20


@snapshot_router.post("/{plan_id}/snapshots", response_model=dict)
async def save_snapshot(
    plan: Annotated[BusinessPlan | None, Depends(business_plan_with_snapshots_by_id)] = None,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
    title: str | None = Query(None),
    note: str | None = Query(None),
):
    assert plan is not None
    if len(plan.snapshots) >= SNAPSHOT_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Достигнут лимит снимков ({SNAPSHOT_LIMIT})",
        )
    blocks_data = []
    for block in sorted(plan.blocks, key=lambda b: b.block_order):
        blocks_data.append(
            {
                "title": block.title,
                "content": block.content,
                "block_type": block.block_type,
                "block_order": block.block_order,
                "rich_content": block.rich_content,
                "media_attachments": block.media_attachments,
                "linked_financial_chart_ids": block.linked_financial_chart_ids,
            }
        )
    snapshot = PlanSnapshot(
        business_plan_id=plan.id,
        title=title or plan.title,
        blocks_snapshot=blocks_data,
        created_by_id=user.id,
        note=note,
    )
    session.add(snapshot)
    await session.commit()
    return {"detail": "Снимок сохранён", "snapshot_id": snapshot.id}


@snapshot_router.get("/{plan_id}/snapshots", response_model=list[dict])
async def list_snapshots(
    plan: Annotated[BusinessPlan, Depends(business_plan_with_snapshots_by_id)],
):
    return [
        {
            "id": s.id,
            "title": s.title,
            "note": s.note,
            "created_at": s.created_at.isoformat(),
            "created_by_id": s.created_by_id,
        }
        for s in plan.snapshots
    ]


@snapshot_router.delete("/{plan_id}/snapshots/{snapshot_id}", response_model=dict)
async def delete_snapshot(
    snapshot_id: int,
    plan: Annotated[BusinessPlan | None, Depends(business_plan_owner_only)] = None,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    assert plan is not None
    snapshot = await session.get(PlanSnapshot, snapshot_id)
    if not snapshot or snapshot.business_plan_id != plan.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Снимок не найден")
    await session.delete(snapshot)
    await session.commit()
    return {"detail": "Снимок удалён"}


@snapshot_router.post("/{plan_id}/snapshots/{snapshot_id}/restore", response_model=BusinessPlanRead)
async def restore_snapshot(
    snapshot_id: int,
    plan: Annotated[BusinessPlan | None, Depends(business_plan_by_id)] = None,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    assert plan is not None
    snapshot = await session.get(PlanSnapshot, snapshot_id)
    if not snapshot or snapshot.business_plan_id != plan.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Снимок не найден")

    for block in plan.blocks:
        await session.delete(block)
    await session.flush()

    # Batch-load all financial charts in a single query (fix N+1)
    all_chart_ids: set[int] = set()
    for block_data in snapshot.blocks_snapshot:
        chart_ids = block_data.get("linked_financial_chart_ids") or []
        all_chart_ids.update(chart_ids)

    charts_by_id: dict[int, FinancialChart] = {}
    if all_chart_ids:
        stmt = select(FinancialChart).where(FinancialChart.id.in_(all_chart_ids))
        result = await session.execute(stmt)
        charts_by_id = {chart.id: chart for chart in result.scalars().all()}

    for block_data in snapshot.blocks_snapshot:
        chart_ids = block_data.get("linked_financial_chart_ids") or []
        linked_charts = [charts_by_id[cid] for cid in chart_ids if cid in charts_by_id]
        block = PlanBlock(
            business_plan_id=plan.id,
            title=block_data.get("title", "Без названия"),
            content=block_data.get("content", ""),
            block_type=block_data.get("block_type", "general"),
            block_order=block_data.get("block_order", 0),
            rich_content=block_data.get("rich_content", {}),
            media_attachments=block_data.get("media_attachments", []),
            linked_financial_charts=linked_charts,
        )
        session.add(block)

    await session.commit()

    plan_stmt: Select[tuple[BusinessPlan]] = (
        select(BusinessPlan)
        .where(BusinessPlan.id == plan.id)
        .options(
            selectinload(BusinessPlan.blocks).selectinload(PlanBlock.tags),
            selectinload(BusinessPlan.blocks).selectinload(PlanBlock.linked_financial_charts),
            selectinload(BusinessPlan.tags),
        )
    )
    result = await session.execute(plan_stmt)
    return result.scalar_one()
