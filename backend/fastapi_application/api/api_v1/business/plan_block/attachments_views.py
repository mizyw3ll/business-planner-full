import re
from typing import Annotated
from urllib.parse import quote

from core.models import BusinessPlan, PlanBlock, db_helper
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from api.api_v1.business.business_plan.dependencies import business_plan_owner_only

from . import attachments as att
from .dependencies import plan_block_by_id

attachments_router = APIRouter()


@attachments_router.post("/{block_id}/attachments", response_model=dict)
async def upload_attachment(
    file: UploadFile = File(...),
    plan: Annotated[BusinessPlan | None, Depends(business_plan_owner_only)] = None,
    block: Annotated[PlanBlock | None, Depends(plan_block_by_id)] = None,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    assert plan is not None
    assert block is not None
    meta = await att.save_attachment(plan.id, file)
    items = list(block.media_attachments or [])
    items.append(meta)
    block.media_attachments = items
    await session.commit()
    await session.refresh(block)
    return meta


@attachments_router.delete("/{block_id}/attachments/{attachment_id}", status_code=204)
async def delete_attachment(
    attachment_id: str,
    plan: Annotated[BusinessPlan | None, Depends(business_plan_owner_only)] = None,
    block: Annotated[PlanBlock | None, Depends(plan_block_by_id)] = None,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    assert plan is not None
    assert block is not None
    items = list(block.media_attachments or [])
    found = next((a for a in items if a.get("id") == attachment_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="Вложение не найдено")
    att.delete_attachment_file(plan.id, found)
    block.media_attachments = [a for a in items if a.get("id") != attachment_id]
    await session.commit()


@attachments_router.get("/attachments/{att_plan_id}/{filename}")
async def download_attachment(
    att_plan_id: int,
    filename: str,
):
    """Загрузка файлов — публичный доступ, т.к. URL содержит UUID (неугадываемый)."""
    safe_filename = re.sub(r"[^\w.\-]", "_", filename)
    try:
        data, content_type = await att.get_attachment_bytes(att_plan_id, safe_filename)
    except FileNotFoundError:
        try:
            data, content_type = await att.get_attachment_bytes(att_plan_id, filename)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="Файл не найден")

    encoded_name = quote(filename)
    disposition = f"attachment; filename*=UTF-8''{encoded_name}"
    return Response(
        content=data,
        media_type=content_type,
        headers={"Content-Disposition": disposition},
    )
