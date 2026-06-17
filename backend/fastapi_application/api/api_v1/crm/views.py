from core.models import Contact, Deal, User, db_helper
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.api_v1.auth.fastapi_users import current_active_user

from .schemas import (
    ContactCreate,
    ContactRead,
    ContactUpdate,
    DealCreate,
    DealRead,
    DealUpdate,
    PipelineStats,
)

router = APIRouter(prefix="/crm", tags=["CRM"])


# ── Contacts ──


@router.get("/contacts", response_model=list[ContactRead])
async def get_contacts(
    is_lead: bool | None = Query(None),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = select(Contact).where(Contact.user_id == user.id)
    if is_lead is not None:
        stmt = stmt.where(Contact.is_lead == is_lead)
    stmt = stmt.order_by(Contact.created_at.desc())
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.post("/contacts", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
async def create_contact(
    contact_in: ContactCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    contact = Contact(
        user_id=user.id,
        **contact_in.model_dump(),
    )
    session.add(contact)
    await session.commit()
    await session.refresh(contact)
    return contact


@router.get("/contacts/{contact_id}", response_model=ContactRead)
async def get_contact(
    contact_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    contact = await session.get(Contact, contact_id)
    if not contact or contact.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Контакт не найден")
    return contact


@router.patch("/contacts/{contact_id}", response_model=ContactRead)
async def update_contact(
    contact_id: int,
    contact_update: ContactUpdate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    contact = await session.get(Contact, contact_id)
    if not contact or contact.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Контакт не найден")

    update_data = contact_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contact, field, value)

    await session.commit()
    await session.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    contact = await session.get(Contact, contact_id)
    if not contact or contact.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Контакт не найден")
    await session.delete(contact)
    await session.commit()


# ── Deals ──


@router.get("/deals", response_model=list[DealRead])
async def get_deals(
    status_filter: str | None = Query(None, alias="status"),
    contact_id: int | None = Query(None),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = select(Deal).where(Deal.user_id == user.id)
    if status_filter:
        stmt = stmt.where(Deal.status == status_filter)
    if contact_id:
        stmt = stmt.where(Deal.contact_id == contact_id)
    stmt = stmt.order_by(Deal.created_at.desc())
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.post("/deals", response_model=DealRead, status_code=status.HTTP_201_CREATED)
async def create_deal(
    deal_in: DealCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    deal = Deal(
        user_id=user.id,
        **deal_in.model_dump(),
    )
    session.add(deal)
    await session.commit()
    await session.refresh(deal)
    return deal


@router.get("/deals/{deal_id}", response_model=DealRead)
async def get_deal(
    deal_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    deal = await session.get(Deal, deal_id)
    if not deal or deal.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Сделка не найдена")
    return deal


@router.patch("/deals/{deal_id}", response_model=DealRead)
async def update_deal(
    deal_id: int,
    deal_update: DealUpdate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    deal = await session.get(Deal, deal_id)
    if not deal or deal.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Сделка не найдена")

    update_data = deal_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(deal, field, value)

    await session.commit()
    await session.refresh(deal)
    return deal


@router.delete("/deals/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deal(
    deal_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    deal = await session.get(Deal, deal_id)
    if not deal or deal.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Сделка не найдена")
    await session.delete(deal)
    await session.commit()


# ── Pipeline Stats ──


@router.get("/pipeline/stats", response_model=PipelineStats)
async def get_pipeline_stats(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    total = (await session.execute(select(func.count()).select_from(Deal).where(Deal.user_id == user.id))).scalar() or 0

    total_value = (
        await session.execute(select(func.coalesce(func.sum(Deal.value), 0.0)).where(Deal.user_id == user.id))
    ).scalar() or 0.0

    # By status
    status_result = await session.execute(
        select(Deal.status, func.count()).where(Deal.user_id == user.id).group_by(Deal.status)
    )
    by_status = {row[0]: row[1] for row in status_result.all()}

    # By priority
    priority_result = await session.execute(
        select(Deal.priority, func.count()).where(Deal.user_id == user.id).group_by(Deal.priority)
    )
    by_priority = {row[0]: row[1] for row in priority_result.all()}

    return PipelineStats(
        total_deals=total,
        total_value=total_value,
        by_status=by_status,
        by_priority=by_priority,
    )
