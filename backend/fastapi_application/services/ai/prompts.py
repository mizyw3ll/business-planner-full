from __future__ import annotations

from core.models import BusinessPlan, FinancialChart, PlanBlock

BLOCK_TYPE_INSTRUCTIONS: dict[str, str] = {
    "general": "Пиши структурно: используй заголовки, списки и короткие абзацы. Раскрой тему полноценно.",
    "financial": "Используй конкретные цифры, проценты и расчёты. Приводи сравнения и прогнозы. Формулы уместны.",
    "marketing": "Опиши целевую аудиторию, каналы продвижения, конкурентные преимущества и стратегии.",
    "operations": "Опиши процессы, ресурсы, сроки, ответственных и этапы реализации.",
    "swot": "Заполни все 4 категории: сильные стороны, слабые стороны, возможности, угрозы. Будь конкретен.",
    "timeline": "Представь в виде пошагового плана с датами и вехами. Используй хронологический порядок.",
    "metrics": "Опиши ключевые метрики (KPI), целевые значения, пороговые значения и методы измерения.",
    "checklist": "Составь чёткий список пунктов с кратким описанием каждого. Каждый пункт — выполнимое действие.",
    "markdown": "Используй markdown-разметку для структурирования: заголовки, списки, таблицы, код.",
}


def build_business_plan_outline_prompt(plan: BusinessPlan, *, max_chars: int = 5000) -> str:
    blocks = (
        "\n".join(f"- {block.block_order + 1}. {block.title} ({block.block_type})" for block in plan.blocks)
        or "- Пока блоков нет"
    )

    return f"""
Сгенерируй короткую, практичную структуру бизнес-плана на русском языке.

Требования:
- Верни только готовый текст в markdown.
- Используй заголовок и список разделов.
- Пиши кратко, но по делу.
- Добавь блок 'Следующие шаги'.
- Не добавляй пояснений о том, что ты AI.
- Максимальная длина ответа: {max_chars} символов. Строго не превышай этот лимит.

Данные проекта:
- Название: {plan.title}
- Описание: {plan.description or "нет описания"}

Уже есть блоки:
{blocks}

Сделай структуру, которую можно сразу вставить в новый блок плана.
""".strip()


def build_block_improvement_prompt(
    plan: BusinessPlan,
    block: PlanBlock,
    *,
    other_blocks: list[PlanBlock] | None = None,
    max_chars: int = 5000,
) -> str:
    plan_ctx = f"- Название: {plan.title}"
    if plan.description:
        plan_ctx += f"\n- Описание: {plan.description}"

    instruction = BLOCK_TYPE_INSTRUCTIONS.get(block.block_type, "Пиши профессионально и по делу.")

    others = ""
    if other_blocks:
        items: list[str] = []
        for b in other_blocks:
            if b.id == block.id:
                continue
            snippet = (b.content or "")[:100].replace("\n", " ").strip()
            if snippet:
                items.append(f"- {b.title} ({b.block_type}) — «{snippet}...»")
        if items:
            others = "\n\nДругие блоки плана (для контекста):\n" + "\n".join(items[:5])

    return f"""Улучши текст блока бизнес-плана на русском языке.

ВАЖНО: Ты должен обязательно учитывать контекст проекта и других блоков при улучшении текста.
Если план описывает бизнес, связанный с кошками — улучшенный текст должен отражать эту тематику.
Если другие блоки содержат конкретные данные (цифры, даты, названия) — используй их в тексте.

Требования:
- Верни только готовый текст без вступлений.
- Сохрани смысл, но сделай текст более ясным и профессиональным.
- Если уместно, используй списки и короткие абзацы.
- Не добавляй лишней воды.
- Максимальная длина ответа: {max_chars} символов. Строго не превышай этот лимит.

Контекст проекта:
{plan_ctx}

Текущий блок:
- Название: {block.title}
- Тип: {block.block_type}

Инструкция по типу «{block.block_type}»:
{instruction}

Текущий текст блока:
{block.content or "пусто"}{others}

Улучши текст, обязательно используя контекст проекта и данных из других блоков.""".strip()


def build_financial_summary_prompt(chart: FinancialChart, *, max_chars: int = 5000) -> str:
    points = []
    total_income = 0.0
    total_expense = 0.0

    for point in chart.chart_points:
        amount = float(point.amount)
        if point.type == "income":
            total_income += amount
        else:
            total_expense += amount
        points.append(
            f"- {point.date.date().isoformat()}: {point.type} {amount:.2f} {point.description or ''}".rstrip()  # type: ignore[attr-defined]
        )

    points_text = "\n".join(points) or "- Пока нет точек"
    net = total_income - total_expense

    return f"""
Сделай короткую сводку по финансовому графику на русском языке.

Требования:
- Верни только готовый текст в markdown.
- Сначала дай общий вывод в 1-2 предложениях.
- Потом покажи 3-5 буллетов с выводами и рисками.
- Добавь короткий блок 'Рекомендации'.
- Не упоминай внутренние расчёты, если они не нужны.
- Максимальная длина ответа: {max_chars} символов. Строго не превышай этот лимит.

Контекст:
- Название: {chart.title}
- Описание: {chart.description or "нет описания"}
- Валюта: {chart.currency.code}
- Доход: {total_income:.2f}
- Расход: {total_expense:.2f}
- Net: {net:.2f}

Точки:
{points_text}

Сделай текст, который можно вставить в описание графика.
""".strip()
