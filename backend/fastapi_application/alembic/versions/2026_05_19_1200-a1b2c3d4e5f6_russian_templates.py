"""russian_templates

Revision ID: a1b2c3d4e5f6
Revises: 2f8703357c5a
Create Date: 2026-05-19 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: str | Sequence[str] | None = "2f8703357c5a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SWOT_EMPTY = {
    "strengths": [""],
    "weaknesses": [""],
    "opportunities": [""],
    "threats": [""],
}


def _doc(text: str) -> dict:
    return {
        "type": "doc",
        "content": [{"type": "paragraph", "content": [{"type": "text", "text": text}]}],
    }


RU_TEMPLATES = [
    {
        "old_title": "SaaS Startup",
        "title": "SaaS-стартап",
        "description": "Классический бизнес-план SaaS: резюме, проблема, решение и финансовые прогнозы.",
        "blocks": [
            {
                "title": "Резюме",
                "content": "Краткий обзор SaaS-продукта и видения.",
                "block_type": "general",
                "rich_content": _doc("Краткий обзор SaaS-продукта и видения."),
            },
            {
                "title": "Проблема",
                "content": "Опишите боль, которую решает ваш SaaS.",
                "block_type": "general",
                "rich_content": _doc("Опишите боль, которую решает ваш SaaS."),
            },
            {
                "title": "Решение",
                "content": "Как продукт решает проблему.",
                "block_type": "general",
                "rich_content": _doc("Как продукт решает проблему."),
            },
            {"title": "Рыночная возможность", "content": "TAM, SAM, SOM.", "block_type": "metrics"},
            {
                "title": "Бизнес-модель",
                "content": "Тарифы, MRR, отток.",
                "block_type": "financial",
                "rich_content": _doc("Тарифы, MRR, отток."),
            },
            {
                "title": "Выход на рынок",
                "content": "Каналы маркетинга и продаж.",
                "block_type": "marketing",
                "rich_content": _doc("Каналы маркетинга и продаж."),
            },
            {"title": "SWOT-анализ", "content": "", "block_type": "swot", "rich_content": SWOT_EMPTY},
            {"title": "Дорожная карта", "content": "", "block_type": "timeline"},
            {"title": "Финансовые прогнозы", "content": "", "block_type": "chart_embed"},
        ],
    },
    {
        "old_title": "Restaurant",
        "title": "Ресторан",
        "description": "Бизнес-план ресторана: концепция, меню, локация и операции.",
        "blocks": [
            {
                "title": "Концепция и видение",
                "content": "Чем уникален ваш ресторан.",
                "block_type": "general",
                "rich_content": _doc("Чем уникален ваш ресторан."),
            },
            {
                "title": "Обзор меню",
                "content": "Блюда, цены и поставщики.",
                "block_type": "general",
                "rich_content": _doc("Блюда, цены и поставщики."),
            },
            {
                "title": "Анализ локации",
                "content": "Трафик, аренда, демография.",
                "block_type": "general",
                "rich_content": _doc("Трафик, аренда, демография."),
            },
            {
                "title": "Операционный план",
                "content": "Персонал, часы работы, оборудование.",
                "block_type": "operations",
                "rich_content": _doc("Персонал, часы работы, оборудование."),
            },
            {
                "title": "Маркетинг",
                "content": "Соцсети и локальные партнёрства.",
                "block_type": "marketing",
                "rich_content": _doc("Соцсети и локальные партнёрства."),
            },
            {
                "title": "Финансовый план",
                "content": "Стартовые затраты и точка безубыточности.",
                "block_type": "financial",
                "rich_content": _doc("Стартовые затраты и точка безубыточности."),
            },
            {"title": "SWOT-анализ", "content": "", "block_type": "swot", "rich_content": SWOT_EMPTY},
        ],
    },
    {
        "old_title": "E-commerce Store",
        "title": "Интернет-магазин",
        "description": "Бизнес-план онлайн-ритейла: продукт, логистика и digital-маркетинг.",
        "blocks": [
            {
                "title": "Обзор магазина",
                "content": "Ниша, бренд и аудитория.",
                "block_type": "general",
                "rich_content": _doc("Ниша, бренд и аудитория."),
            },
            {
                "title": "Продуктовая стратегия",
                "content": "Каталог и склад.",
                "block_type": "general",
                "rich_content": _doc("Каталог и склад."),
            },
            {
                "title": "Маркетинговая воронка",
                "content": "Реклама, SEO, email.",
                "block_type": "marketing",
                "rich_content": _doc("Реклама, SEO, email."),
            },
            {
                "title": "Логистика",
                "content": "Доставка и возвраты.",
                "block_type": "operations",
                "rich_content": _doc("Доставка и возвраты."),
            },
            {"title": "Ключевые метрики", "content": "", "block_type": "metrics"},
            {"title": "Финансовые прогнозы", "content": "", "block_type": "financial"},
        ],
    },
    {
        "old_title": "Freelance Agency",
        "title": "Фриланс-агентство",
        "description": "Бизнес-план услуг для фриланс- или консалтингового агентства.",
        "blocks": [
            {
                "title": "Обзор агентства",
                "content": "Услуги и ценностное предложение.",
                "block_type": "general",
                "rich_content": _doc("Услуги и ценностное предложение."),
            },
            {
                "title": "Целевые клиенты",
                "content": "Портрет идеального клиента.",
                "block_type": "general",
                "rich_content": _doc("Портрет идеального клиента."),
            },
            {
                "title": "Цены и пакеты",
                "content": "Ставки и ретейнеры.",
                "block_type": "financial",
                "rich_content": _doc("Ставки и ретейнеры."),
            },
            {
                "title": "Продажи",
                "content": "Лиды и коммерческие предложения.",
                "block_type": "marketing",
                "rich_content": _doc("Лиды и коммерческие предложения."),
            },
            {
                "title": "Команда",
                "content": "Штат и подрядчики.",
                "block_type": "operations",
                "rich_content": _doc("Штат и подрядчики."),
            },
            {"title": "Цели и этапы", "content": "", "block_type": "timeline"},
        ],
    },
    {
        "old_title": "Mobile App",
        "title": "Мобильное приложение",
        "description": "План мобильного стартапа: UX, монетизация и рост.",
        "blocks": [
            {
                "title": "Концепция приложения",
                "content": "Функции и user stories.",
                "block_type": "general",
                "rich_content": _doc("Функции и user stories."),
            },
            {
                "title": "Персоны пользователей",
                "content": "Целевая аудитория.",
                "block_type": "general",
                "rich_content": _doc("Целевая аудитория."),
            },
            {
                "title": "Монетизация",
                "content": "Подписки, реклама, покупки.",
                "block_type": "financial",
                "rich_content": _doc("Подписки, реклама, покупки."),
            },
            {
                "title": "Стратегия роста",
                "content": "ASO и виральность.",
                "block_type": "marketing",
                "rich_content": _doc("ASO и виральность."),
            },
            {
                "title": "Технологии",
                "content": "Стек и интеграции.",
                "block_type": "operations",
                "rich_content": _doc("Стек и интеграции."),
            },
            {"title": "KPI", "content": "", "block_type": "metrics"},
            {"title": "Дорожная карта запуска", "content": "", "block_type": "timeline"},
        ],
    },
]


def upgrade() -> None:
    import json

    conn = op.get_bind()
    for tpl in RU_TEMPLATES:
        blocks_json = json.dumps(tpl["blocks"], ensure_ascii=False)
        conn.execute(
            sa.text(
                """
                UPDATE templates
                SET title = :title, description = :description, blocks = CAST(:blocks AS json)
                WHERE title = :old_title
                """
            ),
            {
                "title": tpl["title"],
                "description": tpl["description"],
                "blocks": blocks_json,
                "old_title": tpl["old_title"],
            },
        )


def downgrade() -> None:
    pass
