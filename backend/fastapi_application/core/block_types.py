"""Block type constants and labels for plan block serialization."""

from __future__ import annotations

from typing import Any

SMART_BLOCK_TYPES: frozenset[str] = frozenset(
    {
        "swot",
        "timeline",
        "metrics",
        "markdown",
        "checklist",
        "chart_embed",
    }
)

RICH_TEXT_BLOCK_TYPES: frozenset[str] = frozenset(
    {
        "general",
        "financial",
        "marketing",
        "operations",
    }
)

BLOCK_TYPE_LABELS: dict[str, str] = {
    "general": "Общий",
    "financial": "Финансы",
    "marketing": "Маркетинг",
    "operations": "Операции",
    "swot": "SWOT-анализ",
    "timeline": "Дорожная карта",
    "metrics": "Метрики",
    "chart_embed": "Встроенный график",
    "markdown": "Markdown",
    "checklist": "Чеклист",
}

EXPORT_HTML_STYLES = """
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #111827; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    .meta { color: #6b7280; font-size: 14px; margin-bottom: 32px; }
    .block { margin-bottom: 24px; break-inside: avoid; }
    .block h3 { margin: 0 0 4px; font-size: 18px; }
    .block .type { margin: 0 0 8px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .block .content { font-size: 14px; color: #374151; line-height: 1.6; }
    .block .content ul { list-style: disc; padding-left: 1.5rem; margin: 0.5em 0; }
    .block .content ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5em 0; }
    .block .content h2, .block .content h3, .block .content h4 { margin: 0.75em 0 0.35em; }
    .block .content blockquote { margin: 0.75em 0; padding-left: 1em; border-left: 3px solid #d1d5db; color: #6b7280; }
    .block .content pre { background: #f3f4f6; padding: 0.75em 1em; border-radius: 6px; overflow-x: auto; }
    .block .content code { font-family: ui-monospace, monospace; font-size: 0.9em; background: #f3f4f6; padding: 0.1em 0.35em; border-radius: 4px; }
    .block .content pre code { background: transparent; padding: 0; }
    .block .content table { border-collapse: collapse; width: 100%; margin: 0.75em 0; }
    .block .content th, .block .content td { border: 1px solid #d1d5db; padding: 0.4em 0.6em; text-align: left; }
    .block .content th { background: #f9fafb; font-weight: 600; }
    .block .content mark { background: #fef08a; padding: 0 0.15em; }
    .block .content sub { font-size: 0.75em; }
    .block .content a { color: #2563eb; }
    .swot-section { margin-bottom: 12px; }
    .swot-section h4 { margin: 0 0 6px; font-size: 14px; color: #374151; }
    @media print { body { margin: 0; } }
"""

ALL_BLOCK_TYPES: frozenset[str] = RICH_TEXT_BLOCK_TYPES | SMART_BLOCK_TYPES
