from typing import Annotated

from core.models import (
    BlockComment,
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
    File,
    HTTPException,
    UploadFile,
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

from . import attachments as att
from . import crud
from .dependencies import plan_block_by_id
from .schemas import (
    PlanBlockCreate,
    PlanBlockDraftSave,
    PlanBlockRead,
    PlanBlockUpdate,
)

router = APIRouter(
    # prefix=settings.api.nested.blocks,
    # tags=["Plan Blocks"],
)


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


@router.post("/{block_id}/attachments", response_model=dict)
async def upload_attachment(
    file: UploadFile = File(...),
    plan: Annotated[BusinessPlan | None, Depends(business_plan_owner_only)] = None,
    block: Annotated[PlanBlock | None, Depends(plan_block_by_id)] = None,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    assert plan is not None  # resolved by Depends
    assert block is not None  # resolved by Depends
    meta = await att.save_attachment(plan.id, file)
    items = list(block.media_attachments or [])
    items.append(meta)
    block.media_attachments = items
    await session.commit()
    await session.refresh(block)
    return meta


@router.delete("/{block_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment(
    attachment_id: str,
    plan: Annotated[BusinessPlan | None, Depends(business_plan_owner_only)] = None,
    block: Annotated[PlanBlock | None, Depends(plan_block_by_id)] = None,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    assert plan is not None  # resolved by Depends
    assert block is not None  # resolved by Depends
    items = list(block.media_attachments or [])
    found = next((a for a in items if a.get("id") == attachment_id), None)
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Вложение не найдено")
    att.delete_attachment_file(plan.id, found)
    block.media_attachments = [a for a in items if a.get("id") != attachment_id]
    await session.commit()


@router.get("/attachments/{att_plan_id}/{filename}")
async def download_attachment(
    att_plan_id: int,
    filename: str,
):
    """Загрузка файлов — публичный доступ, т.к. URL содержит UUID (неугадываемый)."""
    import re
    from urllib.parse import quote

    from fastapi.responses import Response

    safe_filename = re.sub(r"[^\w.\-]", "_", filename)
    try:
        data, content_type = await att.get_attachment_bytes(att_plan_id, safe_filename)
    except FileNotFoundError:
        try:
            data, content_type = await att.get_attachment_bytes(att_plan_id, filename)
        except FileNotFoundError:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")

    encoded_name = quote(filename)
    disposition = f"attachment; filename*=UTF-8''{encoded_name}"
    return Response(
        content=data,
        media_type=content_type,
        headers={"Content-Disposition": disposition},
    )


# ── Comments ──


@router.get("/{block_id}/comments", response_model=list[dict])
async def get_comments(
    block: Annotated[PlanBlock, Depends(plan_block_by_id)],
    session: AsyncSession = Depends(db_helper.session_getter),
):
    from sqlalchemy.orm import selectinload

    stmt = select(BlockComment).where(BlockComment.plan_block_id == block.id).options(selectinload(BlockComment.user))
    result = await session.execute(stmt)
    comments = result.scalars().all()
    return [
        {
            "id": c.id,
            "content": c.content,
            "resolved": c.resolved,
            "created_at": c.created_at.isoformat(),
            "user_id": c.user_id,
            "username": c.user.username if c.user else None,
        }
        for c in comments
    ]


@router.post("/{block_id}/comments", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_comment(
    content: str = Body(..., embed=True),
    block: Annotated[PlanBlock | None, Depends(plan_block_by_id)] = None,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    assert block is not None  # resolved by Depends
    comment = BlockComment(
        plan_block_id=block.id,
        user_id=user.id,
        content=content,
    )
    session.add(comment)
    await session.commit()
    return {
        "id": comment.id,
        "content": comment.content,
        "resolved": comment.resolved,
        "created_at": comment.created_at.isoformat(),
        "user_id": user.id,
    }


@router.patch("/{block_id}/comments/{comment_id}", response_model=dict)
async def update_comment(
    comment_id: int,
    content: str | None = Body(None, embed=True),
    resolved: bool | None = Body(None, embed=True),
    block: Annotated[PlanBlock | None, Depends(plan_block_by_id)] = None,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    assert block is not None  # resolved by Depends
    comment = await session.get(BlockComment, comment_id)
    if not comment or comment.plan_block_id != block.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Комментарий не найден")
    if comment.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Это не ваш комментарий")
    if content is not None:
        comment.content = content
    if resolved is not None:
        comment.resolved = resolved
    await session.commit()
    return {
        "id": comment.id,
        "content": comment.content,
        "resolved": comment.resolved,
        "created_at": comment.created_at.isoformat(),
        "user_id": comment.user_id,
    }


@router.delete("/{block_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    block: Annotated[PlanBlock | None, Depends(plan_block_by_id)] = None,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    assert block is not None  # resolved by Depends
    comment = await session.get(BlockComment, comment_id)
    if not comment or comment.plan_block_id != block.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Комментарий не найден")
    if comment.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Это не ваш комментарий")
    await session.delete(comment)
    await session.commit()


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Тег не найден")

    if tag in block.tags:
        block.tags.remove(tag)
        await session.commit()
