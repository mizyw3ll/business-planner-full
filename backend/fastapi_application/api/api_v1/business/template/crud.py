from core.models import Template
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .schemas import TemplateCreate, TemplateUpdate


async def get_templates(session: AsyncSession, category: str | None = None) -> list[Template]:
    stmt = select(Template).where(Template.is_public)
    if category:
        stmt = stmt.where(Template.category == category)
    stmt = stmt.order_by(Template.id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_template_by_id(session: AsyncSession, template_id: int) -> Template | None:
    return await session.get(Template, template_id)


async def create_template(session: AsyncSession, template_in: TemplateCreate) -> Template:
    template = Template(**template_in.model_dump())
    session.add(template)
    await session.commit()
    await session.refresh(template)
    return template


async def update_template(session: AsyncSession, template: Template, template_update: TemplateUpdate) -> Template:
    update_data = template_update.model_dump(exclude_unset=True)
    for name, value in update_data.items():
        setattr(template, name, value)
    await session.commit()
    await session.refresh(template)
    return template


async def delete_template(session: AsyncSession, template: Template) -> None:
    await session.delete(template)
    await session.commit()
