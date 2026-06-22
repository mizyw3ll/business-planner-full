from typing import Annotated

from core.models import (
    BusinessPlan,
    PlanBlock,
    Tag,
    User,
    db_helper,
)
from fastapi import (
    APIRouter,
    Body,
    Depends,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.api_v1.auth.fastapi_users import current_active_user
from api.api_v1.business.business_plan.dependencies import (
    business_plan_by_id,
    business_plan_owner_only,
)

from . import crud
from .attachments_views import attachments_router
from .comments_views import comments_router
from .dependencies import plan_block_by_id
from .schemas import (
    PlanBlockCreate,
    PlanBlockDraftSave,
    PlanBlockRead,
    PlanBlockUpdate,
)

router = APIRouter()

# Include sub-routers
router.include_router(comments_router)
router.include_router(attachments_router)


# drag and drop в начале так как фастапи ломает
@router.patch("/reorder")
async def reorder_blocks(
    plan: Annotated[BusinessPlan, Depends(business_plan_owner_only)],
    new_order: list[int] = Body(..., embed=True),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    await crud.reorder_plan_blocks(
        session=session,
        business_plan_id=plan.id,
        new_order=new_order,
    )
    return {"message": "Порядок блоков обновлен"}


@router.get("", response_model=list[PlanBlockRead])
async def get_blocks(
    plan: Annotated[BusinessPlan, Depends(business_plan_by_id)],
):
    return plan.blocks


@router.post(
    "",
    response_model=PlanBlockRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_block(
    block_in: PlanBlockCreate,
    plan: Annotated[BusinessPlan, Depends(business_plan_owner_only)],
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await crud.create_plan_block(
        session=session,
        plan_block_in=block_in,
        business_plan_id=plan.id,
        user_id=user.id,
    )


@router.patch(
    "/{block_id}",
    response_model=PlanBlockRead,
)
async def update_block(
    block_update: PlanBlockUpdate,
    block: Annotated[PlanBlock, Depends(plan_block_by_id)],
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await crud.update_plan_block(
        session=session,
        plan_block=block,
        plan_block_update=block_update,
        user_id=user.id,
    )


@router.patch(
    "/{block_id}/draft",
    response_model=PlanBlockRead,
)
async def save_block_draft(
    draft_update: PlanBlockDraftSave,
    block: Annotated[PlanBlock, Depends(plan_block_by_id)],
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await crud.save_plan_block_draft(
        session=session,
        plan_block=block,
        draft_in=draft_update,
    )


@router.post(
    "/{block_id}/publish-draft",
    response_model=PlanBlockRead,
)
async def publish_block_draft(
    block: Annotated[PlanBlock, Depends(plan_block_by_id)],
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await crud.publish_plan_block_draft(
        session=session,
        plan_block=block,
    )


@router.delete(
    "/{block_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_block(
    block: Annotated[PlanBlock, Depends(plan_block_by_id)],
    session: AsyncSession = Depends(db_helper.session_getter),
):
    await crud.delete_plan_block(session=session, plan_block=block)


@router.post("/{block_id}/duplicate", response_model=PlanBlockRead, status_code=status.HTTP_201_CREATED)
async def duplicate_block(
    block: Annotated[PlanBlock, Depends(plan_block_by_id)],
    session: AsyncSession = Depends(db_helper.session_getter),
):
    existing = await crud.get_plan_blocks(session, block.business_plan_id)
    max_order = max((b.block_order for b in existing), default=-1)

    new_block = PlanBlock(
        business_plan_id=block.business_plan_id,
        title=f"Копия: {block.title}",
        content=block.content,
        block_type=block.block_type,
        block_order=max_order + 1,
        rich_content=block.rich_content,
        media_attachments=block.media_attachments,
        due_date=block.due_date,
    )
    new_block.linked_financial_charts = block.linked_financial_charts
    session.add(new_block)
    await session.commit()

    stmt = (
        select(PlanBlock)
        .where(PlanBlock.id == new_block.id)
        .options(
            selectinload(PlanBlock.tags),
            selectinload(PlanBlock.linked_financial_charts),
        )
    )
    result = await session.execute(stmt)
    return result.scalar_one()


@router.post("/{block_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def assign_tag_to_block(
    block: Annotated[PlanBlock, Depends(plan_block_by_id)],
    tag_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    tag = await session.get(Tag, tag_id)
    if not tag or tag.user_id != block.business_plan.user_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Тег не найден")

    if tag not in block.tags:
        block.tags.append(tag)
        await session.commit()


@router.delete("/{block_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_tag_from_block(
    block: Annotated[PlanBlock, Depends(plan_block_by_id)],
    tag_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    tag = await session.get(Tag, tag_id)
    if not tag or tag.user_id != block.business_plan.user_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Тег не найден")

    if tag in block.tags:
        block.tags.remove(tag)
        await session.commit()
