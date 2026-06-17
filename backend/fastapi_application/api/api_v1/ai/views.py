import httpx
from core.config import settings
from core.models import BusinessPlan, FinancialChart, User, db_helper
from fastapi import APIRouter, Depends, HTTPException, status
from services.ai import ai_service
from services.ai.prompts import (
    build_block_improvement_prompt,
    build_business_plan_outline_prompt,
    build_financial_summary_prompt,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.api_v1.auth.fastapi_users import current_active_user

from .schemas import AIChatRequest, AIChatResponse

router = APIRouter()


@router.get("/health")
async def ai_health(_user: User = Depends(current_active_user)):
    return {"enabled": await ai_service.healthcheck(), "provider": ai_service.provider.name}


async def _call_ai(coro):
    if not await ai_service.healthcheck():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI-помощник отключён. Укажите APP_CONFIG__AI__PROVIDER=fullai в .env",
        )
    try:
        return await coro
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Сервис временно недоступен",
        ) from e
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ошибка подключения к AI-серверу",
        )


@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(payload: AIChatRequest, _user: User = Depends(current_active_user)):
    max_chars = payload.max_chars or settings.ai.max_chars
    result = await _call_ai(
        ai_service.chat(
            payload.messages,
            model=payload.model,
            temperature=payload.temperature,
            max_tokens=payload.max_tokens,
        )
    )
    content = result.content[:max_chars]
    return AIChatResponse(
        content=content,
        provider=result.provider,
        model=result.model,
        char_count=len(content),
        max_chars=max_chars,
    )


@router.post("/business-plans/{plan_id}/generate", response_model=AIChatResponse)
async def generate_business_plan(
    plan_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = (
        select(BusinessPlan)
        .where(BusinessPlan.id == plan_id)
        .where(BusinessPlan.user_id == user.id)
        .options(selectinload(BusinessPlan.blocks))
    )
    result = await session.execute(stmt)
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    max_chars = settings.ai.max_chars
    prompt = build_business_plan_outline_prompt(plan, max_chars=max_chars)
    generated = await _call_ai(ai_service.generate_text(prompt))
    content = generated.content[:max_chars]
    return AIChatResponse(
        content=content,
        provider=generated.provider,
        model=generated.model,
        char_count=len(content),
        max_chars=max_chars,
    )


@router.post("/business-plans/{plan_id}/blocks/{block_id}/improve", response_model=AIChatResponse)
async def improve_business_plan_block(
    plan_id: int,
    block_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = (
        select(BusinessPlan)
        .where(BusinessPlan.id == plan_id)
        .where(BusinessPlan.user_id == user.id)
        .options(selectinload(BusinessPlan.blocks))
    )
    result = await session.execute(stmt)
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    block = next((item for item in plan.blocks if item.id == block_id), None)
    if not block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")

    max_chars = settings.ai.max_chars
    prompt = build_block_improvement_prompt(plan, block, other_blocks=plan.blocks, max_chars=max_chars)
    generated = await _call_ai(ai_service.generate_text(prompt))
    content = generated.content[:max_chars]
    return AIChatResponse(
        content=content,
        provider=generated.provider,
        model=generated.model,
        char_count=len(content),
        max_chars=max_chars,
    )


@router.post("/financial-charts/{chart_id}/summary", response_model=AIChatResponse)
async def summarize_financial_chart(
    chart_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = (
        select(FinancialChart)
        .where(FinancialChart.id == chart_id)
        .where(FinancialChart.user_id == user.id)
        .options(selectinload(FinancialChart.chart_points), selectinload(FinancialChart.currency))
    )
    result = await session.execute(stmt)
    chart = result.scalar_one_or_none()
    if not chart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found")

    max_chars = settings.ai.max_chars
    prompt = build_financial_summary_prompt(chart, max_chars=max_chars)
    generated = await _call_ai(ai_service.generate_text(prompt))
    content = generated.content[:max_chars]
    return AIChatResponse(
        content=content,
        provider=generated.provider,
        model=generated.model,
        char_count=len(content),
        max_chars=max_chars,
    )
