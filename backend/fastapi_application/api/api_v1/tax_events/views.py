from datetime import UTC, datetime, timedelta

from core.models import TaxEvent, User, db_helper
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.api_v1.auth.fastapi_users import current_active_user

from .schemas import TaxEventCreate, TaxEventRead, TaxEventUpdate

router = APIRouter(prefix="/tax-events", tags=["Tax Events"])


@router.get("", response_model=list[TaxEventRead])
async def get_tax_events(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = select(TaxEvent).where(TaxEvent.user_id == user.id).order_by(TaxEvent.event_date)
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.post("", response_model=TaxEventRead, status_code=status.HTTP_201_CREATED)
async def create_tax_event(
    event_in: TaxEventCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    event = TaxEvent(
        user_id=user.id,
        title=event_in.title,
        description=event_in.description,
        event_date=event_in.event_date,
        event_type=event_in.event_type,
        amount=event_in.amount,
        is_recurring=event_in.is_recurring,
        recurrence_rule=event_in.recurrence_rule,
        notify_before=event_in.notify_before,
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event


@router.patch("/{event_id}", response_model=TaxEventRead)
async def update_tax_event(
    event_id: int,
    event_update: TaxEventUpdate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    event = await session.get(TaxEvent, event_id)
    if not event or event.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")

    update_data = event_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)

    await session.commit()
    await session.refresh(event)
    return event


@router.get("/pending-notifications", response_model=list[TaxEventRead])
async def get_pending_notifications(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    now = datetime.now(UTC)
    stmt = (
        select(TaxEvent)
        .where(
            and_(
                TaxEvent.user_id == user.id,
                TaxEvent.notify_before.isnot(None),
                ~TaxEvent.is_completed,
            )
        )
        .order_by(TaxEvent.event_date)
    )
    result = await session.execute(stmt)
    events = list(result.scalars().all())
    pending = []
    for e in events:
        if not e.notify_before:
            continue
        ed = e.event_date
        if ed.tzinfo is None:  # type: ignore[attr-defined]
            ed = ed.replace(tzinfo=UTC)  # type: ignore[attr-defined]
        for minutes in e.notify_before:
            if e.notified_values and minutes in e.notified_values:
                continue
            if now >= ed - timedelta(minutes=minutes):  # type: ignore[operator]
                pending.append(e)
                break
    return pending


@router.post("/{event_id}/mark-notified", response_model=TaxEventRead)
async def mark_notified(
    event_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    event = await session.get(TaxEvent, event_id)
    if not event or event.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")
    event.notified_at = datetime.now(UTC)  # type: ignore[assignment]
    now = datetime.now(UTC)
    if event.notify_before:
        ed = event.event_date
        if ed.tzinfo is None:
            ed = ed.replace(tzinfo=UTC)
        new_values = [m for m in event.notify_before if now >= ed - timedelta(minutes=m)]
        if new_values:
            existing = set(event.notified_values or [])
            existing.update(new_values)
            event.notified_values = sorted(existing)
    await session.commit()
    await session.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tax_event(
    event_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    event = await session.get(TaxEvent, event_id)
    if not event or event.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")

    await session.delete(event)
    await session.commit()
