from api.api_v1.auth.fastapi_users import current_active_user
from core.models import User, db_helper
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from . import crud
from .schemas import TemplateCreate, TemplateRead, TemplateUpdate

router = APIRouter()


@router.get("", response_model=list[TemplateRead])
async def get_templates(
    category: str | None = Query(None, description="Filter by category"),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await crud.get_templates(session=session, category=category)


@router.get("/{template_id}", response_model=TemplateRead)
async def get_template(
    template_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    template = await crud.get_template_by_id(session=session, template_id=template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Шаблон не найден")
    return template


@router.post("", response_model=TemplateRead, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_in: TemplateCreate,
    session: AsyncSession = Depends(db_helper.session_getter),
    user: User = Depends(current_active_user),
):
    return await crud.create_template(session=session, template_in=template_in)


@router.patch("/{template_id}", response_model=TemplateRead)
async def update_template(
    template_id: int,
    template_update: TemplateUpdate,
    session: AsyncSession = Depends(db_helper.session_getter),
    user: User = Depends(current_active_user),
):
    template = await crud.get_template_by_id(session=session, template_id=template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Шаблон не найден")
    return await crud.update_template(session=session, template=template, template_update=template_update)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    user: User = Depends(current_active_user),
):
    template = await crud.get_template_by_id(session=session, template_id=template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Шаблон не найден")
    await crud.delete_template(session=session, template=template)
