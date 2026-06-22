from typing import Annotated

from core.models import BlockComment, PlanBlock, User, db_helper
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.api_v1.auth.fastapi_users import current_active_user

from .dependencies import plan_block_by_id

comments_router = APIRouter()


@comments_router.get("/{block_id}/comments", response_model=list[dict])
async def get_comments(
    block: Annotated[PlanBlock, Depends(plan_block_by_id)],
    session: AsyncSession = Depends(db_helper.session_getter),
):
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


@comments_router.post("/{block_id}/comments", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_comment(
    content: str = Body(..., embed=True),
    block: Annotated[PlanBlock | None, Depends(plan_block_by_id)] = None,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    assert block is not None
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


@comments_router.patch("/{block_id}/comments/{comment_id}", response_model=dict)
async def update_comment(
    comment_id: int,
    content: str | None = Body(None, embed=True),
    resolved: bool | None = Body(None, embed=True),
    block: Annotated[PlanBlock | None, Depends(plan_block_by_id)] = None,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    assert block is not None
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


@comments_router.delete("/{block_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    block: Annotated[PlanBlock | None, Depends(plan_block_by_id)] = None,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    assert block is not None
    comment = await session.get(BlockComment, comment_id)
    if not comment or comment.plan_block_id != block.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Комментарий не найден")
    if comment.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Это не ваш комментарий")
    await session.delete(comment)
    await session.commit()
