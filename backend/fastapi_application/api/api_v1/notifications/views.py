import asyncio
import json
import logging
from datetime import UTC, datetime, timedelta, timezone

from core.models import Notification, User, db_helper
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from services.email import EmailService
from services.notification_broadcaster import broadcaster
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.api_v1.auth.fastapi_users import current_active_user

from .schemas import NotificationCreate, NotificationRead

log = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationRead])
async def get_notifications(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = (
        select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(100)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.get("/unread-count", response_model=dict)
async def unread_count(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = select(Notification).where(
        and_(
            Notification.user_id == user.id,
            ~Notification.is_read,
        )
    )
    result = await session.execute(stmt)
    return {"count": len(list(result.scalars().all()))}


@router.get("/stream")
async def notification_stream(
    request: Request,
    user: User = Depends(current_active_user),
):
    queue = broadcaster.subscribe(user_id=user.id)

    async def event_generator():
        try:
            # Send initial keepalive
            yield f"data: {json.dumps({'type': 'connected'})}\n\n"

            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break

                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=30)
                    yield f"data: {payload}\n\n"
                except TimeoutError:
                    # Send keepalive to detect disconnects
                    yield f": keepalive {datetime.now(UTC).isoformat()}\n\n"
        finally:
            broadcaster.unsubscribe(user.id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("", response_model=NotificationRead, status_code=status.HTTP_201_CREATED)
async def create_notification(
    payload: NotificationCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    notif = Notification(
        user_id=user.id,
        title=payload.title,
        body=payload.body,
        source_type=payload.source_type,
        source_id=payload.source_id,
    )
    session.add(notif)
    await session.commit()
    await session.refresh(notif)

    # Broadcast to SSE subscribers
    broadcaster.broadcast(
        user_id=user.id,
        notification={
            "type": "notification",
            "id": notif.id,
            "title": notif.title,
            "body": notif.body,
            "source_type": notif.source_type,
            "source_id": notif.source_id,
            "is_read": notif.is_read,
            "created_at": notif.created_at.isoformat() if notif.created_at else None,
        },
    )

    # Send email notification in background
    try:
        email_service = EmailService()
        moscow_tz = timezone(timedelta(hours=3))
        event_date = notif.created_at.astimezone(moscow_tz).strftime("%d.%m.%Y %H:%M") if notif.created_at else ""
        await email_service.send_notification_email(
            to=user.email,
            username=user.username,
            title=notif.title,
            body=notif.body,
            source_type=notif.source_type or "notification",
            event_date=event_date,
            session=session,
            user_id=user.id,
        )
        log.info("Notification email sent to %s for notification %d", user.email, notif.id)
    except Exception as e:
        log.error("Failed to send notification email to %s: %s", user.email, e)

    return notif


@router.post("/{notification_id}/read", response_model=NotificationRead)
async def mark_read(
    notification_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    notif = await session.get(Notification, notification_id)
    if not notif or notif.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Уведомление не найдено")
    notif.is_read = True
    await session.commit()
    await session.refresh(notif)
    return notif


@router.post("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_read(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = select(Notification).where(
        and_(
            Notification.user_id == user.id,
            ~Notification.is_read,
        )
    )
    result = await session.execute(stmt)
    for notif in result.scalars().all():
        notif.is_read = True
    await session.commit()
    return {"ok": True}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    notif = await session.get(Notification, notification_id)
    if not notif or notif.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Уведомление не найдено")
    await session.delete(notif)
    await session.commit()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_notifications(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = select(Notification).where(Notification.user_id == user.id)
    result = await session.execute(stmt)
    for notif in result.scalars().all():
        await session.delete(notif)
    await session.commit()
