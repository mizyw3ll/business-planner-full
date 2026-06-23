"""Search across all entity types — extracted from search/views.py."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable

from sqlalchemy import ColumnElement, Select, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import (
    Board,
    BoardCard,
    BoardColumn,
    BusinessPlan,
    Contact,
    Deal,
    FinancialChart,
    Note,
    PlanBlock,
    TaxEvent,
)

from api.api_v1.search.schemas import (
    SearchBlockResult,
    SearchBoardResult,
    SearchCardResult,
    SearchContactResult,
    SearchDealResult,
    SearchFinancialChartResult,
    SearchNoteResult,
    SearchPlanResult,
    SearchResponse,
    SearchTaxEventResult,
)


def escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@dataclass
class SearchHandler:
    entity_name: str
    query_builder: Callable[[int], Select]
    result_mapper: Callable[[list[Any]], list]

    def execute(self, session: AsyncSession, user_id: int, pattern: str) -> list:
        stmt = self.query_builder(pattern).where(
            or_(...),  # This won't work as-is — need a different approach
        )


# ── Plan search handler ──────────────────────────────────────────────────


async def search_plans(session: AsyncSession, user_id: int, pattern: str) -> list[SearchPlanResult]:
    stmt = (
        select(BusinessPlan.id, BusinessPlan.title, BusinessPlan.description)
        .where(
            BusinessPlan.user_id == user_id,
            or_(
                BusinessPlan.title.ilike(pattern),
                BusinessPlan.description.ilike(pattern),
            ),
        )
        .order_by(BusinessPlan.updated_at.desc())
        .limit(10)
    )
    rows = (await session.execute(stmt)).all()
    return [SearchPlanResult(id=row.id, title=row.title, description=row.description) for row in rows]


async def search_blocks(session: AsyncSession, user_id: int, pattern: str) -> list[SearchBlockResult]:
    stmt = (
        select(
            PlanBlock.id,
            PlanBlock.title,
            PlanBlock.content,
            PlanBlock.business_plan_id,
            BusinessPlan.title.label("plan_title"),
        )
        .join(BusinessPlan, PlanBlock.business_plan_id == BusinessPlan.id)
        .where(
            BusinessPlan.user_id == user_id,
            or_(
                PlanBlock.title.ilike(pattern),
                PlanBlock.content.ilike(pattern),
            ),
        )
        .order_by(PlanBlock.id.desc())
        .limit(10)
    )
    rows = (await session.execute(stmt)).all()
    return [
        SearchBlockResult(
            id=row.id,
            title=row.title,
            content=(row.content[:200] if row.content else ""),
            plan_id=row.business_plan_id,
            plan_title=row.plan_title,
        )
        for row in rows
    ]


async def search_notes(session: AsyncSession, user_id: int, pattern: str) -> list[SearchNoteResult]:
    stmt = (
        select(Note.id, Note.title, Note.content_markdown)
        .where(
            Note.user_id == user_id,
            or_(
                Note.title.ilike(pattern),
                Note.content_markdown.ilike(pattern),
            ),
        )
        .order_by(Note.updated_at.desc())
        .limit(10)
    )
    rows = (await session.execute(stmt)).all()
    return [
        SearchNoteResult(
            id=row.id,
            title=row.title,
            content_markdown=(row.content_markdown[:200] if row.content_markdown else ""),
        )
        for row in rows
    ]


async def search_boards(session: AsyncSession, user_id: int, pattern: str) -> list[SearchBoardResult]:
    stmt = (
        select(Board.id, Board.title)
        .where(Board.user_id == user_id, Board.title.ilike(pattern))
        .order_by(Board.updated_at.desc())
        .limit(10)
    )
    rows = (await session.execute(stmt)).all()
    return [SearchBoardResult(id=row.id, title=row.title) for row in rows]


async def search_cards(session: AsyncSession, user_id: int, pattern: str) -> list[SearchCardResult]:
    stmt = (
        select(
            BoardCard.id,
            BoardCard.title,
            BoardCard.description,
            Board.id.label("board_id"),
            Board.title.label("board_title"),
            BoardCard.column_id,
        )
        .join(BoardColumn, BoardCard.column_id == BoardColumn.id)
        .join(Board, BoardColumn.board_id == Board.id)
        .where(
            Board.user_id == user_id,
            or_(
                BoardCard.title.ilike(pattern),
                BoardCard.description.ilike(pattern),
            ),
        )
        .order_by(BoardCard.id.desc())
        .limit(10)
    )
    rows = (await session.execute(stmt)).all()
    return [
        SearchCardResult(
            id=row.id,
            title=row.title,
            description=(row.description[:200] if row.description else None),
            board_id=row.board_id,
            board_title=row.board_title,
            column_id=row.column_id,
        )
        for row in rows
    ]


async def search_contacts(session: AsyncSession, user_id: int, pattern: str) -> list[SearchContactResult]:
    stmt = (
        select(Contact.id, Contact.name, Contact.email, Contact.phone, Contact.company, Contact.notes)
        .where(
            Contact.user_id == user_id,
            or_(
                Contact.name.ilike(pattern),
                Contact.email.ilike(pattern),
                Contact.phone.ilike(pattern),
                Contact.company.ilike(pattern),
                Contact.notes.ilike(pattern),
            ),
        )
        .order_by(Contact.updated_at.desc())
        .limit(10)
    )
    rows = (await session.execute(stmt)).all()
    return [
        SearchContactResult(
            id=row.id,
            name=row.name,
            email=row.email,
            phone=row.phone,
            company=row.company,
            notes=(row.notes[:200] if row.notes else None),
        )
        for row in rows
    ]


async def search_deals(session: AsyncSession, user_id: int, pattern: str) -> list[SearchDealResult]:
    stmt = (
        select(
            Deal.id,
            Deal.title,
            Deal.description,
            Deal.status,
            Deal.value,
            Deal.contact_id,
            Contact.name.label("contact_name"),
        )
        .outerjoin(Contact, Deal.contact_id == Contact.id)
        .where(
            Deal.user_id == user_id,
            or_(
                Deal.title.ilike(pattern),
                Deal.description.ilike(pattern),
            ),
        )
        .order_by(Deal.updated_at.desc())
        .limit(10)
    )
    rows = (await session.execute(stmt)).all()
    return [
        SearchDealResult(
            id=row.id,
            title=row.title,
            description=(row.description[:200] if row.description else None),
            status=row.status,
            value=row.value,
            contact_id=row.contact_id,
            contact_name=row.contact_name,
        )
        for row in rows
    ]


async def search_financial_charts(session: AsyncSession, user_id: int, pattern: str) -> list[SearchFinancialChartResult]:
    stmt = (
        select(FinancialChart.id, FinancialChart.title, FinancialChart.description)
        .where(
            FinancialChart.user_id == user_id,
            FinancialChart.is_active,
            or_(
                FinancialChart.title.ilike(pattern),
                FinancialChart.description.ilike(pattern),
            ),
        )
        .order_by(FinancialChart.updated_at.desc())
        .limit(10)
    )
    rows = (await session.execute(stmt)).all()
    return [
        SearchFinancialChartResult(id=row.id, title=row.title, description=row.description) for row in rows
    ]


async def search_tax_events(session: AsyncSession, user_id: int, pattern: str) -> list[SearchTaxEventResult]:
    stmt = (
        select(TaxEvent.id, TaxEvent.title)
        .where(
            TaxEvent.user_id == user_id,
            or_(
                TaxEvent.title.ilike(pattern),
                TaxEvent.description.ilike(pattern),
            ),
        )
        .order_by(TaxEvent.event_date.desc())
        .limit(10)
    )
    rows = (await session.execute(stmt)).all()
    return [SearchTaxEventResult(id=row.id, title=row.title) for row in rows]


SEARCH_HANDLERS = [
    search_plans,
    search_blocks,
    search_notes,
    search_boards,
    search_cards,
    search_contacts,
    search_deals,
    search_financial_charts,
    search_tax_events,
]


async def search_all(session: AsyncSession, user_id: int, query: str) -> SearchResponse:
    escaped = escape_like(query)
    pattern = f"%{escaped}%"

    results = [await handler(session, user_id, pattern) for handler in SEARCH_HANDLERS]

    return SearchResponse(
        plans=results[0],
        blocks=results[1],
        notes=results[2],
        boards=results[3],
        cards=results[4],
        contacts=results[5],
        deals=results[6],
        financial_charts=results[7],
        tax_events=results[8],
        total=sum(len(r) for r in results),
    )
