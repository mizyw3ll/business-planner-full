from datetime import UTC, datetime

from core.models import Board, BoardCard, BoardColumn, User, db_helper
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.api_v1.auth.fastapi_users import current_active_user

from .schemas import (
    BoardCardRead,
    BoardColumnRead,
    BoardCreate,
    BoardListItemRead,
    BoardRead,
    BoardUpdate,
    CardCreate,
    CardMoveRequest,
    CardUpdate,
    ColumnCreate,
    ColumnUpdate,
    ReorderColumnsRequest,
)

router = APIRouter(prefix="/kanban", tags=["Kanban"])


# ── Boards ──


@router.get("/boards", response_model=list[BoardListItemRead])
async def get_boards(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = select(Board).where(Board.user_id == user.id).order_by(Board.created_at.desc())
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.post("/boards", response_model=BoardRead, status_code=status.HTTP_201_CREATED)
async def create_board(
    board_in: BoardCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    board = Board(
        user_id=user.id,
        title=board_in.title,
        business_plan_id=board_in.business_plan_id,
    )
    session.add(board)
    await session.flush()

    # Create default columns
    default_columns = [
        BoardColumn(board_id=board.id, title="К выполнению", color="#3b82f6", column_order=0),
        BoardColumn(board_id=board.id, title="В работе", color="#f59e0b", column_order=1),
        BoardColumn(board_id=board.id, title="Готово", color="#10b981", column_order=2),
    ]
    session.add_all(default_columns)
    await session.commit()

    # Reload with columns
    stmt = (
        select(Board).options(selectinload(Board.columns).selectinload(BoardColumn.cards)).where(Board.id == board.id)
    )
    result = await session.execute(stmt)
    return result.scalar_one()


@router.get("/boards/{board_id}", response_model=BoardRead)
async def get_board(
    board_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = (
        select(Board)
        .options(selectinload(Board.columns).selectinload(BoardColumn.cards))
        .where(Board.id == board_id, Board.user_id == user.id)
    )
    result = await session.execute(stmt)
    board = result.scalar_one_or_none()
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Доска не найдена")
    return board


@router.patch("/boards/{board_id}", response_model=BoardRead)
async def update_board(
    board_id: int,
    board_update: BoardUpdate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    board = await session.get(Board, board_id)
    if not board or board.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Доска не найдена")

    update_data = board_update.model_dump(exclude_unset=True)
    board.updated_at = datetime.now(UTC)  # type: ignore[assignment]
    for field, value in update_data.items():
        setattr(board, field, value)

    await session.commit()

    stmt = (
        select(Board).options(selectinload(Board.columns).selectinload(BoardColumn.cards)).where(Board.id == board_id)
    )
    result = await session.execute(stmt)
    return result.scalar_one()


@router.delete("/boards/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board(
    board_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    board = await session.get(Board, board_id)
    if not board or board.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Доска не найдена")
    await session.delete(board)
    await session.commit()


# ── Columns ──


@router.post("/boards/{board_id}/columns", response_model=BoardColumnRead, status_code=status.HTTP_201_CREATED)
async def create_column(
    board_id: int,
    column_in: ColumnCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    board = await session.get(Board, board_id)
    if not board or board.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Доска не найдена")

    order = column_in.column_order
    if order is None:
        result = await session.execute(
            select(BoardColumn.column_order)
            .where(BoardColumn.board_id == board_id)
            .order_by(BoardColumn.column_order.desc())
            .limit(1)
        )
        last_order = result.scalar()
        order = (last_order or 0) + 1

    column = BoardColumn(
        board_id=board_id,
        title=column_in.title,
        color=column_in.color,
        column_order=order,
    )
    session.add(column)
    await session.commit()
    await session.refresh(column)
    return column


@router.patch("/columns/{column_id}", response_model=BoardColumnRead)
async def update_column(
    column_id: int,
    column_update: ColumnUpdate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    column = await session.get(BoardColumn, column_id)
    if not column:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Колонка не найдена")

    board = await session.get(Board, column.board_id)
    if not board or board.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Доступ запрещён")

    update_data = column_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(column, field, value)

    await session.commit()
    await session.refresh(column)
    return column


@router.delete("/columns/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_column(
    column_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    column = await session.get(BoardColumn, column_id)
    if not column:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Колонка не найдена")

    board = await session.get(Board, column.board_id)
    if not board or board.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Доступ запрещён")

    await session.delete(column)
    await session.commit()


@router.patch("/boards/{board_id}/columns/reorder")
async def reorder_columns(
    board_id: int,
    body: ReorderColumnsRequest,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    board = await session.get(Board, board_id)
    if not board or board.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Доска не найдена")

    for idx, col_id in enumerate(body.column_ids):
        col = await session.get(BoardColumn, col_id)
        if col and col.board_id == board_id:
            col.column_order = idx

    await session.commit()
    return {"ok": True}


# ── Cards ──


@router.post("/columns/{column_id}/cards", response_model=BoardCardRead, status_code=status.HTTP_201_CREATED)
async def create_card(
    column_id: int,
    card_in: CardCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    column = await session.get(BoardColumn, column_id)
    if not column:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Колонка не найдена")

    board = await session.get(Board, column.board_id)
    if not board or board.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Доступ запрещён")

    result = await session.execute(
        select(BoardCard.card_order)
        .where(BoardCard.column_id == column_id)
        .order_by(BoardCard.card_order.desc())
        .limit(1)
    )
    last_order = result.scalar()
    order = (last_order or 0) + 1

    card = BoardCard(
        column_id=column_id,
        title=card_in.title,
        description=card_in.description,
        card_order=order,
        metadata_json=card_in.metadata_json,
    )
    session.add(card)
    await session.commit()
    await session.refresh(card)
    return card


@router.patch("/cards/{card_id}", response_model=BoardCardRead)
async def update_card(
    card_id: int,
    card_update: CardUpdate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    card = await session.get(BoardCard, card_id)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Карточка не найдена")

    column = await session.get(BoardColumn, card.column_id)
    if not column:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Колонка не найдена")
    board = await session.get(Board, column.board_id)
    if not board or board.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Доступ запрещён")

    update_data = card_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(card, field, value)

    await session.commit()
    await session.refresh(card)
    return card


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(
    card_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    card = await session.get(BoardCard, card_id)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Карточка не найдена")

    column = await session.get(BoardColumn, card.column_id)
    if not column:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Колонка не найдена")
    board = await session.get(Board, column.board_id)
    if not board or board.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Доступ запрещён")

    await session.delete(card)
    await session.commit()


@router.patch("/cards/{card_id}/move", response_model=BoardCardRead)
async def move_card(
    card_id: int,
    body: CardMoveRequest,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    card = await session.get(BoardCard, card_id)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Карточка не найдена")

    column = await session.get(BoardColumn, card.column_id)
    if not column:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Колонка не найдена")
    board = await session.get(Board, column.board_id)
    if not board or board.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Доступ запрещён")

    if body.column_id != card.column_id:
        target_column = await session.get(BoardColumn, body.column_id)
        if not target_column or target_column.board_id != board.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Колонка не принадлежит этой доске")

    card.column_id = body.column_id
    card.card_order = body.card_order

    await session.commit()
    await session.refresh(card)
    return card
