from core.models import BusinessPlan, PlanBlock, Template, User, db_helper
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from services.import_parsers import parse_csv, parse_html, parse_pdf, parse_xlsx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.api_v1.auth.fastapi_users import current_active_user

from .block_serializer import ALL_BLOCK_TYPES, build_import_rich_content
from .schemas import BusinessPlanRead

import_router = APIRouter()


@import_router.post("/import", response_model=BusinessPlanRead, status_code=status.HTTP_201_CREATED)
async def import_plan(
    file: UploadFile = File(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    content = await file.read()
    filename = (file.filename or "").lower()

    if filename.endswith(".csv"):
        parsed = parse_csv(content.decode("utf-8"))
    elif filename.endswith((".xlsx", ".xls")):
        parsed = await parse_xlsx(content)
    elif filename.endswith(".html"):
        parsed = parse_html(content.decode("utf-8"))
    elif filename.endswith(".pdf"):
        parsed = await parse_pdf(content)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неподдерживаемый формат файла. Используйте CSV, XLSX, HTML или PDF.",
        )

    plan_title = parsed["title"]
    plan_description = parsed["description"]
    blocks_data = parsed["blocks"]

    plan = BusinessPlan(
        title=plan_title,
        description=plan_description,
        user_id=user.id,
    )
    session.add(plan)
    await session.flush()

    for block_data in blocks_data:
        text_content: str = block_data.get("content") or ""  # type: ignore[assignment]
        raw_type: str = block_data.get("block_type") or "general"  # type: ignore[assignment]
        block_type = raw_type if raw_type in ALL_BLOCK_TYPES else "general"
        rich_content = build_import_rich_content(block_type, text_content)

        block = PlanBlock(
            business_plan_id=plan.id,
            title=block_data["title"],
            content=block_data["content"],
            block_type=block_type,
            block_order=block_data["block_order"],
            rich_content=rich_content,
            media_attachments=[],
        )
        session.add(block)

    await session.commit()

    stmt = (
        select(BusinessPlan)
        .where(BusinessPlan.id == plan.id)
        .options(
            selectinload(BusinessPlan.blocks).selectinload(PlanBlock.tags),
            selectinload(BusinessPlan.blocks).selectinload(PlanBlock.linked_financial_charts),
            selectinload(BusinessPlan.tags),
        )
    )
    result = await session.execute(stmt)
    return result.scalar_one()


@import_router.post(
    "/from-template/{template_id}", response_model=BusinessPlanRead, status_code=status.HTTP_201_CREATED
)
async def create_plan_from_template(
    template_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    template = await session.get(Template, template_id)
    if not template or not template.is_public:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Шаблон не найден")

    plan = BusinessPlan(
        title=template.title,
        description=template.description,
        user_id=user.id,
    )
    session.add(plan)
    await session.flush()

    for idx, block_data in enumerate(template.blocks):
        block = PlanBlock(
            business_plan_id=plan.id,
            title=block_data.get("title", "Untitled"),
            content=block_data.get("content", ""),
            block_type=block_data.get("block_type", "general"),
            block_order=idx,
            rich_content=block_data.get("rich_content", {}),
            media_attachments=block_data.get("media_attachments", []),
        )
        session.add(block)

    await session.commit()

    stmt = (
        select(BusinessPlan)
        .where(BusinessPlan.id == plan.id)
        .options(
            selectinload(BusinessPlan.blocks).selectinload(PlanBlock.tags),
            selectinload(BusinessPlan.blocks).selectinload(PlanBlock.linked_financial_charts),
            selectinload(BusinessPlan.tags),
        )
    )
    result = await session.execute(stmt)
    return result.scalar_one()
