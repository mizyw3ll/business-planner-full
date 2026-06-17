from typing import Annotated

from core.models import BusinessPlan, Tag, db_helper
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from .dependencies import business_plan_light_by_id

tag_router = APIRouter()


@tag_router.post("/{plan_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def assign_tag_to_plan(
    plan: Annotated[BusinessPlan, Depends(business_plan_light_by_id)],
    tag_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    tag = await session.get(Tag, tag_id)
    if not tag or tag.user_id != plan.user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Тег не найден")

    if tag not in plan.tags:
        plan.tags.append(tag)
        await session.commit()


@tag_router.delete("/{plan_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_tag_from_plan(
    plan: Annotated[BusinessPlan, Depends(business_plan_light_by_id)],
    tag_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    tag = await session.get(Tag, tag_id)
    if not tag or tag.user_id != plan.user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Тег не найден")

    if tag in plan.tags:
        plan.tags.remove(tag)
        await session.commit()
