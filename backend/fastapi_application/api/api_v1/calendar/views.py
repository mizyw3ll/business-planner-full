import asyncio
from datetime import UTC, date, datetime, timedelta
from email.utils import parsedate_to_datetime

from icalendar import Calendar, Event
from core.models import CalendarEvent, User, db_helper
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from fastapi.responses import PlainTextResponse
from pydantic import ValidationError
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.api_v1.auth.fastapi_users import current_active_user

from .schemas import CalendarEventCreate, CalendarEventRead, CalendarEventUpdate, CalendarImportResult

router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get("/events", response_model=list[CalendarEventRead])
async def get_events(
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = select(CalendarEvent).where(CalendarEvent.user_id == user.id)

    if from_date:
        stmt = stmt.where(CalendarEvent.event_date >= from_date)
    if to_date:
        stmt = stmt.where(CalendarEvent.event_date <= to_date)

    stmt = stmt.order_by(CalendarEvent.event_date, CalendarEvent.id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.post("/events", response_model=CalendarEventRead, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_in: CalendarEventCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    event = CalendarEvent(
        user_id=user.id,
        **event_in.model_dump(),
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event


@router.patch("/events/{event_id}", response_model=CalendarEventRead)
async def update_event(
    event_id: int,
    event_update: CalendarEventUpdate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    event = await session.get(CalendarEvent, event_id)
    if not event or event.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")

    update_data = event_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)

    await session.commit()
    await session.refresh(event)
    return event


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    event = await session.get(CalendarEvent, event_id)
    if not event or event.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")

    await session.delete(event)
    await session.commit()


@router.get("/events/pending-notifications", response_model=list[CalendarEventRead])
async def get_calendar_pending_notifications(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    now = datetime.now(UTC)
    stmt = (
        select(CalendarEvent)
        .where(
            and_(
                CalendarEvent.user_id == user.id,
                CalendarEvent.notify_before.isnot(None),
                CalendarEvent.event_date >= now,
            )
        )
        .order_by(CalendarEvent.event_date)
    )
    result = await session.execute(stmt)
    events = list(result.scalars().all())
    pending = []
    for e in events:
        if not e.notify_before:
            continue
        event_dt = e.event_date if e.event_date.tzinfo else e.event_date.replace(tzinfo=UTC)
        for minutes in e.notify_before:
            if e.notified_values and minutes in e.notified_values:
                continue
            if now >= event_dt - timedelta(minutes=minutes):
                pending.append(e)
                break
    return pending


@router.post("/events/{event_id}/mark-notified", response_model=CalendarEventRead)
async def mark_calendar_notified(
    event_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    event = await session.get(CalendarEvent, event_id)
    if not event or event.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")
    event.notified_at = datetime.now(UTC)  # type: ignore[assignment]
    # Отмечаем все значения notify_before, которые уже наступили
    now = datetime.now(UTC)
    if event.notify_before:
        event_dt = event.event_date if event.event_date.tzinfo else event.event_date.replace(tzinfo=UTC)
        new_values = [m for m in event.notify_before if now >= event_dt - timedelta(minutes=m)]
        if new_values:
            existing = set(event.notified_values or [])
            existing.update(new_values)
            event.notified_values = sorted(existing)
    await session.commit()
    await session.refresh(event)
    return event


def _parse_datetime(dt_value) -> datetime | None:
    """Parse datetime from various iCalendar formats."""
    if dt_value is None:
        return None

    dt = dt_value.dt if hasattr(dt_value, "dt") else dt_value

    if isinstance(dt, datetime):
        if dt.tzinfo is None:
            return dt.replace(tzinfo=UTC)
        return dt
    elif isinstance(dt, date):
        return datetime.combine(dt, datetime.min.time(), tzinfo=UTC)
    return None


def _parse_alarm_minutes(component) -> int | None:
    """Extract reminder minutes from VALARM component."""
    trigger = component.get("TRIGGER")
    if trigger is None:
        return None

    td = trigger.dt if hasattr(trigger, "dt") else trigger

    if isinstance(td, timedelta):
        total_minutes = int(td.total_seconds() / 60)
        return abs(total_minutes)
    return None


@router.get("/export.ics")
async def export_ical(
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = select(CalendarEvent).where(CalendarEvent.user_id == user.id)

    if from_date:
        stmt = stmt.where(CalendarEvent.event_date >= from_date)
    if to_date:
        stmt = stmt.where(CalendarEvent.event_date <= to_date)

    stmt = stmt.order_by(CalendarEvent.event_date)
    result = await session.execute(stmt)
    events = list(result.scalars().all())

    cal = Calendar()
    cal.add("prodid", "-//Business Planner//Calendar//RU")
    cal.add("version", "2.0")
    cal.add("calscale", "GREGORIAN")
    cal.add("method", "PUBLISH")
    cal.add("x-wr-calname", "Конструктор бизнес-планов")
    cal.add("x-wr-timezone", "Europe/Moscow")

    now = datetime.now(UTC)

    for event in events:
        vevent = Event()
        vevent.add("uid", f"{event.id}@business-planner")
        vevent.add("dtstamp", now)
        vevent.add("dtstart", event.event_date)
        vevent.add("dtend", event.event_date + timedelta(hours=1))
        vevent.add("summary", event.title)
        vevent.add("status", "CONFIRMED")
        vevent.add("created", event.created_at)

        if event.description:
            vevent.add("description", event.description)

        if event.event_type and event.event_type != "manual":
            vevent.add("categories", [event.event_type])

        if event.notify_before:
            from icalendar import Alarm

            for minutes in event.notify_before:
                alarm = Alarm()
                alarm.add("action", "DISPLAY")
                alarm.add("description", f"Напоминание: {event.title}")
                alarm.add("trigger", timedelta(minutes=-minutes))
                vevent.add_component(alarm)

        cal.add_component(vevent)

    return PlainTextResponse(
        content=cal.to_ical().decode("utf-8"),
        media_type="text/calendar; charset=utf-8",
        headers={
            "Content-Disposition": "attachment; filename=calendar.ics",
        },
    )


@router.post("/import.ics", response_model=CalendarImportResult)
async def import_ical(
    file: UploadFile,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    if not file.filename or not file.filename.lower().endswith(".ics"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл должен быть в формате .ics",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл пуст",
        )

    try:
        cal = await asyncio.to_thread(Calendar.from_ical, content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка парсинга .ics файла: {e}",
        )

    imported = 0
    skipped = 0
    errors = 0
    details: list[str] = []

    stmt = select(CalendarEvent).where(CalendarEvent.user_id == user.id)
    existing_result = await session.execute(stmt)
    existing_events = list(existing_result.scalars().all())
    existing_uids = set()
    existing_keys = set()
    for ev in existing_events:
        if hasattr(ev, "source_uid") and ev.source_uid:
            existing_uids.add(ev.source_uid)
        existing_keys.add((ev.title.strip().lower(), ev.event_date.replace(tzinfo=None) if ev.event_date else None))

    for component in cal.walk():
        if component.name != "VEVENT":
            continue

        try:
            summary = str(component.get("SUMMARY", "")).strip()
            if not summary:
                errors += 1
                details.append("Пропущено событие без названия (SUMMARY)")
                continue

            dtstart = _parse_datetime(component.get("DTSTART"))
            if dtstart is None:
                errors += 1
                details.append(f"Пропущено '{summary}': нет даты начала (DTSTART)")
                continue

            uid = str(component.get("UID", "")).strip()
            if uid and uid in existing_uids:
                skipped += 1
                continue

            key = (summary.lower(), dtstart.replace(tzinfo=None))
            if key in existing_keys:
                skipped += 1
                continue

            description = str(component.get("DESCRIPTION", "")).strip() or None

            notify_before = None
            for sub in component.walk():
                if sub.name == "VALARM":
                    val = _parse_alarm_minutes(sub)
                    if val is not None:
                        notify_before = [val]
                    break

            event_type = "imported"
            categories = component.get("CATEGORIES")
            if categories:
                cats = str(categories).split(",") if hasattr(categories, "__iter__") else [str(categories)]
                if cats:
                    event_type = cats[0].strip()

            new_event = CalendarEvent(
                user_id=user.id,
                title=summary[:200],
                description=description,
                event_date=dtstart,
                notify_before=notify_before,
                event_type=event_type,
            )
            session.add(new_event)
            imported += 1

            if uid:
                existing_uids.add(uid)
            existing_keys.add(key)

        except Exception as e:
            errors += 1
            details.append(f"Ошибка обработки события: {e}")

    if imported > 0:
        await session.commit()

    return CalendarImportResult(
        imported=imported,
        skipped=skipped,
        errors=errors,
        details=details[:20],
    )
