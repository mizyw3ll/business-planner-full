from typing import Annotated

from core.models import Board, BoardCard, BoardColumn, User, db_helper
from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.api_v1.auth.fastapi_users import current_active_user


async def _get_board_for_column(
    column_id: int,
    user: User,
    session: AsyncSession,
) -> Board:
    """Load column + board in a single query (eliminates N+1)."""
    stmt = (
        select(BoardColumn, Board)
        .join(Board, BoardColumn.board_id == Board.id)
        .where(BoardColumn.id == column_id)
    )
    result = await session.execute(stmt)
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Колонка не найдена")
    column, board = row
    if board.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Доступ запрещён")
    return board


async def _get_board_for_card(
    card_id: int,
    user: User,
    session: AsyncSession,
) -> tuple[BoardCard, BoardColumn, Board]:
    """Load card + column + board in a single query (eliminates N+1)."""
    stmt = (
        select(BoardCard, BoardColumn, Board)
        .join(BoardColumn, BoardCard.column_id == BoardColumn.id)
        .join(Board, BoardColumn.board_id == Board.id)
        .where(BoardCard.id == card_id)
    )
    result = await session.execute(stmt)
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Карточка не найдена")
    card, column, board = row
    if board.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Доступ запрещён")
    return card, column, board


async def _get_board_for_card_target_column(
    card_id: int,
    target_column_id: int,
    user: User,
    session: AsyncSession,
) -> tuple[BoardCard, BoardColumn, Board]:
    """Load card + target column + board in a single query (eliminates N+1 for move_card)."""
    stmt = (
        select(BoardCard, BoardColumn, Board)
        .join(BoardColumn, BoardCard.column_id == BoardColumn.id)
        .join(Board, BoardColumn.board_id == Board.id)
        .where(BoardCard.id == card_id)
    )
    result = await session.execute(stmt)
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Карточка не найдена")
    card, column, board = row
    if board.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Доступ запрещён")

    # Verify target column belongs to the same board
    if target_column_id != column.id:
        target_col_result = await session.execute(
            select(BoardColumn).where(
                BoardColumn.id == target_column_id,
                BoardColumn.board_id == board.id,
            )
        )
        target_col = target_col_result.scalar_one_or_none()
        if not target_col:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Колонка не принадлежит этой доске",
            )

    return card, column, board
