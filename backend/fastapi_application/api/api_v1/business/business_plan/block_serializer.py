"""Serialize plan block rich_content for export and plain-text display."""

from __future__ import annotations

import html
from typing import Any

try:
    import markdown as md_lib
except ImportError:  # pragma: no cover
    md_lib = None  # type: ignore[assignment]


SMART_BLOCK_TYPES = frozenset(
    {
        "swot",
        "timeline",
        "metrics",
        "markdown",
        "checklist",
        "chart_embed",
    }
)

RICH_TEXT_BLOCK_TYPES = frozenset(
    {
        "general",
        "financial",
        "marketing",
        "operations",
    }
)

BLOCK_TYPE_LABELS = {
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
    .block { margin-bottom: 24px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; break-inside: avoid; }
    .block h3 { margin: 0 0 8px; font-size: 18px; }
    .block .type { margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .block .content { margin-top: 12px; font-size: 14px; color: #374151; line-height: 1.6; }
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


def _escape(text: str) -> str:
    return html.escape(text, quote=True)


def _apply_marks(text: str, marks: list[dict[str, Any]] | None) -> str:
    if not marks:
        return _escape(text)
    result = _escape(text)
    for mark in marks:
        if not isinstance(mark, dict):
            continue
        mtype = mark.get("type")
        if mtype == "bold":
            result = f"<strong>{result}</strong>"
        elif mtype == "italic":
            result = f"<em>{result}</em>"
        elif mtype == "strike":
            result = f"<s>{result}</s>"
        elif mtype == "code":
            result = f"<code>{result}</code>"
        elif mtype == "highlight":
            result = f"<mark>{result}</mark>"
        elif mtype == "subscript":
            result = f"<sub>{result}</sub>"
        elif mtype == "link":
            href = _escape(str(mark.get("attrs", {}).get("href", "#")))
            result = f'<a href="{href}" rel="noopener noreferrer">{result}</a>'
    return result


def tiptap_json_to_html(node: Any) -> str:
    if not node:
        return ""
    if isinstance(node, list):
        return "".join(tiptap_json_to_html(n) for n in node)
    if not isinstance(node, dict):
        return _escape(str(node))

    ntype = node.get("type")
    content = node.get("content") or []
    attrs = node.get("attrs") or {}

    if ntype == "text":
        return _apply_marks(str(node.get("text", "")), node.get("marks"))

    if ntype == "doc":
        return "".join(tiptap_json_to_html(content))

    if ntype == "paragraph":
        inner = "".join(tiptap_json_to_html(content))
        return f"<p>{inner or '<br>'}</p>"

    if ntype == "heading":
        level = attrs.get("level", 2)
        level = max(1, min(6, int(level)))
        inner = "".join(tiptap_json_to_html(content))
        return f"<h{level}>{inner}</h{level}>"

    if ntype == "bulletList":
        inner = "".join(tiptap_json_to_html(content))
        return f"<ul>{inner}</ul>"

    if ntype == "orderedList":
        inner = "".join(tiptap_json_to_html(content))
        return f"<ol>{inner}</ol>"

    if ntype == "listItem":
        inner = "".join(tiptap_json_to_html(content))
        return f"<li>{inner}</li>"

    if ntype == "blockquote":
        inner = "".join(tiptap_json_to_html(content))
        return f"<blockquote>{inner}</blockquote>"

    if ntype == "codeBlock":
        text_parts = []
        for child in content:
            if isinstance(child, dict) and child.get("type") == "text":
                text_parts.append(str(child.get("text", "")))
        code_text = _escape("".join(text_parts))
        return f"<pre><code>{code_text}</code></pre>"

    if ntype == "hardBreak":
        return "<br>"

    if ntype == "horizontalRule":
        return "<hr>"

    if ntype == "table":
        inner = "".join(tiptap_json_to_html(content))
        return f"<table>{inner}</table>"

    if ntype == "tableRow":
        inner = "".join(tiptap_json_to_html(content))
        return f"<tr>{inner}</tr>"

    if ntype in ("tableCell", "tableHeader"):
        tag = "th" if ntype == "tableHeader" else "td"
        colspan = attrs.get("colspan", 1)
        rowspan = attrs.get("rowspan", 1)
        extra = ""
        if colspan and colspan != 1:
            extra += f' colspan="{int(colspan)}"'
        if rowspan and rowspan != 1:
            extra += f' rowspan="{int(rowspan)}"'
        inner = "".join(tiptap_json_to_html(content))
        return f"<{tag}{extra}>{inner}</{tag}>"

    if ntype == "image":
        src = _escape(str(attrs.get("src", "")))
        alt = _escape(str(attrs.get("alt", "")))
        return f'<img src="{src}" alt="{alt}" style="max-width:100%;height:auto;">'

    # Fallback: render children
    return "".join(tiptap_json_to_html(content))


def _markdown_to_html(text: str) -> str:
    if not text.strip():
        return ""
    if md_lib is None:
        return _escape(text).replace("\n", "<br>")
    return md_lib.markdown(
        text,
        extensions=["tables", "fenced_code", "nl2br"],
    )


def _swot_to_html(rc: dict[str, Any]) -> str:
    labels = {
        "strengths": "Сильные стороны",
        "weaknesses": "Слабые стороны",
        "opportunities": "Возможности",
        "threats": "Угрозы",
    }
    parts: list[str] = []
    for key, label in labels.items():
        items = [s.strip() for s in (rc.get(key) or []) if isinstance(s, str) and s.strip()]
        if not items:
            continue
        lis = "".join(f"<li>{_escape(item)}</li>" for item in items)
        parts.append(f'<div class="swot-section"><h4>{_escape(label)}</h4><ul>{lis}</ul></div>')
    return "".join(parts)


def tiptap_to_text(rich_content: dict[str, Any] | None) -> str:
    if not rich_content or not isinstance(rich_content, dict):
        return ""
    nodes = rich_content.get("content", [])
    if not isinstance(nodes, list):
        return ""
    texts: list[str] = []
    for node in nodes:
        if isinstance(node, dict) and "content" in node:
            for child in node.get("content", []):
                if isinstance(child, dict) and "text" in child:
                    texts.append(str(child["text"]))
    return "\n".join(texts)


def serialize_block_plain(block_type: str, content: str, rich_content: dict[str, Any] | None) -> str:
    rc = rich_content if isinstance(rich_content, dict) else {}

    if block_type == "swot":
        lines: list[str] = []
        labels = {
            "strengths": "Сильные стороны",
            "weaknesses": "Слабые стороны",
            "opportunities": "Возможности",
            "threats": "Угрозы",
        }
        for key, label in labels.items():
            items = [s.strip() for s in (rc.get(key) or []) if isinstance(s, str) and s.strip()]
            if items:
                lines.append(f"{label}:")
                lines.extend(f"  • {item}" for item in items)
        return "\n".join(lines) if lines else content

    if block_type == "markdown":
        return str(rc.get("markdown") or content)

    if block_type == "timeline":
        lines = []
        for m in rc.get("milestones") or []:
            if not isinstance(m, dict):
                continue
            title = str(m.get("title") or "").strip()
            date = str(m.get("date") or "").strip()
            desc = str(m.get("description") or "").strip()
            if title or date or desc:
                parts = [p for p in [title, date, desc] if p]
                lines.append(" — ".join(parts))
        return "\n".join(lines) if lines else content

    if block_type == "metrics":
        lines = []
        for m in rc.get("metrics") or []:
            if not isinstance(m, dict):
                continue
            label = str(m.get("label") or "").strip()
            value = str(m.get("value") or "").strip()
            unit = str(m.get("unit") or "").strip()
            change = str(m.get("change") or "").strip()
            if label or value:
                line = f"{label}: {value} {unit}".strip()
                if change:
                    line += f" ({change})"
                lines.append(line)
        return "\n".join(lines) if lines else content

    if block_type == "checklist":
        lines = []
        for item in rc.get("items") or []:
            if not isinstance(item, dict):
                continue
            text = str(item.get("text") or "").strip()
            if text:
                mark = "☑" if item.get("checked") else "☐"
                lines.append(f"{mark} {text}")
        return "\n".join(lines) if lines else content

    if block_type == "chart_embed":
        return content or "(встроенные графики)"

    if block_type in RICH_TEXT_BLOCK_TYPES or rc.get("type") == "doc":
        text = tiptap_to_text(rc)
        return text if text else content

    return content


def serialize_block_html(block_type: str, content: str, rich_content: dict[str, Any] | None) -> str:
    rc = rich_content if isinstance(rich_content, dict) else {}

    if block_type == "swot":
        html_out = _swot_to_html(rc)
        return html_out if html_out else _escape(content).replace("\n", "<br>")

    if block_type == "markdown":
        return _markdown_to_html(str(rc.get("markdown") or content))

    if block_type == "timeline":
        parts = []
        for m in rc.get("milestones") or []:
            if not isinstance(m, dict):
                continue
            title = str(m.get("title") or "").strip()
            date = str(m.get("date") or "").strip()
            desc = str(m.get("description") or "").strip()
            if title or date or desc:
                line = " — ".join(_escape(p) for p in [title, date, desc] if p)
                parts.append(f"<p>{line}</p>")
        return "".join(parts) if parts else _escape(content).replace("\n", "<br>")

    if block_type == "metrics":
        rows = []
        for m in rc.get("metrics") or []:
            if not isinstance(m, dict):
                continue
            label = str(m.get("label") or "").strip()
            value = str(m.get("value") or "").strip()
            unit = str(m.get("unit") or "").strip()
            change = str(m.get("change") or "").strip()
            if label or value:
                line = f"<strong>{_escape(label)}</strong>: {_escape(value)} {_escape(unit)}"
                if change:
                    line += f" <em>({_escape(change)})</em>"
                rows.append(f"<p>{line}</p>")
        return "".join(rows) if rows else _escape(content).replace("\n", "<br>")

    if block_type == "checklist":
        items = []
        for item in rc.get("items") or []:
            if not isinstance(item, dict):
                continue
            text = str(item.get("text") or "").strip()
            if text:
                mark = "☑" if item.get("checked") else "☐"
                style = "text-decoration:line-through;color:#6b7280;" if item.get("checked") else ""
                items.append(f'<li style="{style}">{mark} {_escape(text)}</li>')
        return f"<ul>{''.join(items)}</ul>" if items else _escape(content).replace("\n", "<br>")

    if block_type in RICH_TEXT_BLOCK_TYPES or rc.get("type") == "doc":
        html_out = tiptap_json_to_html(rc)
        if html_out:
            return html_out
        return _escape(content).replace("\n", "<br>")

    plain = serialize_block_plain(block_type, content, rich_content)
    return _escape(plain).replace("\n", "<br>")


def block_type_label(block_type: str) -> str:
    return BLOCK_TYPE_LABELS.get(block_type, block_type.replace("_", " "))


def build_import_rich_content(block_type: str, text_content: str) -> dict[str, Any]:
    text = text_content or ""
    if block_type == "swot":
        return {
            "strengths": [text] if text else [""],
            "weaknesses": [""],
            "opportunities": [""],
            "threats": [""],
        }
    if block_type == "markdown":
        return {"markdown": text}
    if block_type == "timeline":
        return {"milestones": [{"title": text, "date": "", "description": ""}]} if text else {"milestones": []}
    if block_type == "metrics":
        return {"metrics": [{"label": text, "value": "", "unit": ""}]} if text else {"metrics": []}
    if block_type == "checklist":
        return {"items": [{"text": text, "checked": False}]} if text else {"items": []}
    if block_type == "chart_embed":
        return {}
    if text:
        return {
            "type": "doc",
            "content": [{"type": "paragraph", "content": [{"type": "text", "text": text}]}],
        }
    return {"type": "doc", "content": []}


ALL_BLOCK_TYPES = RICH_TEXT_BLOCK_TYPES | SMART_BLOCK_TYPES
