from datetime import UTC, datetime

from core.models import Note, Project, Tag, User, db_helper
from core.models.tag import note_tags
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.api_v1.auth.fastapi_users import current_active_user

from .schemas import (
    NoteCreate,
    NoteRead,
    NoteUpdate,
    PaginatedNotes,
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
)

router = APIRouter(prefix="/notes", tags=["Notes"])


# ── Projects ──


@router.get("/projects", response_model=list[ProjectRead])
async def get_my_projects(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = select(Project).where(Project.user_id == user.id).order_by(Project.name)
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.post("/projects", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    project = Project(
        user_id=user.id,
        name=project_in.name,
        description=project_in.description,
        color_idx=project_in.color_idx,
    )
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return project


@router.patch("/projects/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    project = await session.get(Project, project_id)
    if not project or project.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Проект не найден")

    update_data = project_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    await session.commit()
    await session.refresh(project)
    return project


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    project = await session.get(Project, project_id)
    if not project or project.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Проект не найден")

    await session.delete(project)
    await session.commit()


# ── Notes ──


@router.get("", response_model=PaginatedNotes)
async def get_my_notes(
    project_id: int | None = Query(None),
    tag_ids: str | None = Query(None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    tag_id_list: list[int] = []
    if tag_ids:
        tag_id_list = [int(t) for t in tag_ids.split(",") if t.strip().isdigit()]

    conditions = [Note.user_id == user.id]
    if project_id is not None:
        conditions.append(Note.project_id == project_id)

    # Count
    if tag_id_list:
        count_stmt = (
            select(func.count(Note.id.distinct()))
            .select_from(Note)
            .join(note_tags, Note.id == note_tags.c.note_id)
            .where(*conditions, note_tags.c.tag_id.in_(tag_id_list))
        )
    else:
        count_stmt = select(func.count(Note.id.distinct())).select_from(Note).where(*conditions)

    total_result = await session.execute(count_stmt)
    total = total_result.scalar() or 0

    # Paginated query
    stmt = select(Note).where(*conditions)
    if tag_id_list:
        stmt = (
            stmt.join(note_tags, Note.id == note_tags.c.note_id).where(note_tags.c.tag_id.in_(tag_id_list)).distinct()
        )

    stmt = stmt.options(selectinload(Note.tags)).order_by(Note.updated_at.desc())
    stmt = stmt.offset((page - 1) * per_page).limit(per_page)
    result = await session.execute(stmt)
    items = list(result.scalars().all())

    return PaginatedNotes(items=items, total=total, page=page, per_page=per_page)  # type: ignore[arg-type]


@router.post("", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_in: NoteCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    tag_ids = note_in.tag_ids or []
    tags: list[Tag] = []
    if tag_ids:
        stmt = select(Tag).where(Tag.id.in_(tag_ids), Tag.user_id == user.id)
        result = await session.execute(stmt)
        tags = list(result.scalars().all())

    note = Note(
        user_id=user.id,
        project_id=note_in.project_id,
        title=note_in.title,
        content_markdown=note_in.content_markdown,
        tags=tags,
    )
    session.add(note)
    await session.commit()

    note_stmt: Select[tuple[Note]] = select(Note).where(Note.id == note.id).options(selectinload(Note.tags))
    result = await session.execute(note_stmt)
    return result.scalar_one()


@router.get("/{note_id}", response_model=NoteRead)
async def get_note(
    note_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = select(Note).where(Note.id == note_id, Note.user_id == user.id).options(selectinload(Note.tags))
    result = await session.execute(stmt)
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заметка не найдена")
    return note


@router.patch("/{note_id}", response_model=NoteRead)
async def update_note(
    note_id: int,
    note_update: NoteUpdate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    stmt = select(Note).where(Note.id == note_id, Note.user_id == user.id).options(selectinload(Note.tags))
    result = await session.execute(stmt)
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заметка не найдена")

    update_data = note_update.model_dump(exclude_unset=True)
    tag_ids = update_data.pop("tag_ids", None)
    note.updated_at = datetime.now(UTC)  # type: ignore[assignment]
    for field, value in update_data.items():
        setattr(note, field, value)

    if tag_ids is not None:
        if tag_ids:
            tag_stmt = select(Tag).where(Tag.id.in_(tag_ids), Tag.user_id == user.id)
            tag_result = await session.execute(tag_stmt)
            note.tags = list(tag_result.scalars().all())
        else:
            note.tags = []

    await session.commit()

    stmt = select(Note).where(Note.id == note.id).options(selectinload(Note.tags))
    result = await session.execute(stmt)
    return result.scalar_one()


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    note = await session.get(Note, note_id)
    if not note or note.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заметка не найдена")

    await session.delete(note)
    await session.commit()
