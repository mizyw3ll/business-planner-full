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
    User,
    db_helper,
)
from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.api_v1.auth.fastapi_users import current_active_user

from .schemas import (
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

router = APIRouter(prefix="/search", tags=["Search"])


def _escape_like(value: str) -> str:
    """Экранирует спецсимволы % и _ для SQL LIKE."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1, description="Поисковый запрос"),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    escaped_q = _escape_like(q)
    pattern = f"%{escaped_q}%"

    # Search plans
    plans_stmt = (
        select(BusinessPlan.id, BusinessPlan.title, BusinessPlan.description)
        .where(
            BusinessPlan.user_id == user.id,
            or_(
                BusinessPlan.title.ilike(pattern),
                BusinessPlan.description.ilike(pattern),
            ),
        )
        .order_by(BusinessPlan.updated_at.desc())
        .limit(10)
    )
    plans_result = await session.execute(plans_stmt)
    plans = [SearchPlanResult(id=row.id, title=row.title, description=row.description) for row in plans_result.all()]

    # Search blocks (with plan title)
    blocks_stmt = (
        select(
            PlanBlock.id,
            PlanBlock.title,
            PlanBlock.content,
            PlanBlock.business_plan_id,
            BusinessPlan.title.label("plan_title"),
        )
        .join(BusinessPlan, PlanBlock.business_plan_id == BusinessPlan.id)
        .where(
            BusinessPlan.user_id == user.id,
            or_(
                PlanBlock.title.ilike(pattern),
                PlanBlock.content.ilike(pattern),
            ),
        )
        .order_by(PlanBlock.id.desc())
        .limit(10)
    )
    blocks_result = await session.execute(blocks_stmt)
    blocks = [
        SearchBlockResult(
            id=row.id,
            title=row.title,
            content=row.content[:200] if row.content else "",
            plan_id=row.business_plan_id,
            plan_title=row.plan_title,
        )
        for row in blocks_result.all()
    ]

    # Search notes
    notes_stmt = (
        select(Note.id, Note.title, Note.content_markdown)
        .where(
            Note.user_id == user.id,
            or_(
                Note.title.ilike(pattern),
                Note.content_markdown.ilike(pattern),
            ),
        )
        .order_by(Note.updated_at.desc())
        .limit(10)
    )
    notes_result = await session.execute(notes_stmt)
    notes = [
        SearchNoteResult(
            id=row.id,
            title=row.title,
            content_markdown=row.content_markdown[:200] if row.content_markdown else "",
        )
        for row in notes_result.all()
    ]

    # Search boards
    boards_stmt = (
        select(Board.id, Board.title)
        .where(
            Board.user_id == user.id,
            Board.title.ilike(pattern),
        )
        .order_by(Board.updated_at.desc())
        .limit(10)
    )
    boards_result = await session.execute(boards_stmt)
    boards = [SearchBoardResult(id=row.id, title=row.title) for row in boards_result.all()]

    # Search cards (with board title)
    cards_stmt = (
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
            Board.user_id == user.id,
            or_(
                BoardCard.title.ilike(pattern),
                BoardCard.description.ilike(pattern),
            ),
        )
        .order_by(BoardCard.id.desc())
        .limit(10)
    )
    cards_result = await session.execute(cards_stmt)
    cards = [
        SearchCardResult(
            id=row.id,
            title=row.title,
            description=(row.description[:200] if row.description else None),
            board_id=row.board_id,
            board_title=row.board_title,
            column_id=row.column_id,
        )
        for row in cards_result.all()
    ]

    # Search contacts
    contacts_stmt = (
        select(Contact.id, Contact.name, Contact.email, Contact.phone, Contact.company, Contact.notes)
        .where(
            Contact.user_id == user.id,
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
    contacts_result = await session.execute(contacts_stmt)
    contacts = [
        SearchContactResult(
            id=row.id,
            name=row.name,
            email=row.email,
            phone=row.phone,
            company=row.company,
            notes=(row.notes[:200] if row.notes else None),
        )
        for row in contacts_result.all()
    ]

    # Search deals
    deals_stmt = (
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
            Deal.user_id == user.id,
            or_(
                Deal.title.ilike(pattern),
                Deal.description.ilike(pattern),
            ),
        )
        .order_by(Deal.updated_at.desc())
        .limit(10)
    )
    deals_result = await session.execute(deals_stmt)
    deals = [
        SearchDealResult(
            id=row.id,
            title=row.title,
            description=(row.description[:200] if row.description else None),
            status=row.status,
            value=row.value,
            contact_id=row.contact_id,
            contact_name=row.contact_name,
        )
        for row in deals_result.all()
    ]

    # Search financial charts
    charts_stmt = (
        select(FinancialChart.id, FinancialChart.title, FinancialChart.description)
        .where(
            FinancialChart.user_id == user.id,
            FinancialChart.is_active,
            or_(
                FinancialChart.title.ilike(pattern),
                FinancialChart.description.ilike(pattern),
            ),
        )
        .order_by(FinancialChart.updated_at.desc())
        .limit(10)
    )
    charts_result = await session.execute(charts_stmt)
    charts = [
        SearchFinancialChartResult(id=row.id, title=row.title, description=row.description)
        for row in charts_result.all()
    ]

    # Search tax events
    tax_events_stmt = (
        select(TaxEvent.id, TaxEvent.title)
        .where(
            TaxEvent.user_id == user.id,
            or_(
                TaxEvent.title.ilike(pattern),
                TaxEvent.description.ilike(pattern),
            ),
        )
        .order_by(TaxEvent.event_date.desc())
        .limit(10)
    )
    tax_events_result = await session.execute(tax_events_stmt)
    tax_events = [SearchTaxEventResult(id=row.id, title=row.title) for row in tax_events_result.all()]

    total = (
        len(plans)
        + len(blocks)
        + len(notes)
        + len(boards)
        + len(cards)
        + len(contacts)
        + len(deals)
        + len(charts)
        + len(tax_events)
    )

    return SearchResponse(
        plans=plans,
        blocks=blocks,
        notes=notes,
        boards=boards,
        cards=cards,
        contacts=contacts,
        deals=deals,
        financial_charts=charts,
        tax_events=tax_events,
        total=total,
    )
