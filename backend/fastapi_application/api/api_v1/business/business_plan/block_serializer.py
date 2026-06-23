"""Serialize plan block rich_content for export and plain-text display."""

from __future__ import annotations

from typing import Any

from core.block_types import (
    ALL_BLOCK_TYPES,
    BLOCK_TYPE_LABELS,
    EXPORT_HTML_STYLES,
    RICH_TEXT_BLOCK_TYPES,
    SMART_BLOCK_TYPES,
)
from core.html_utils import escape as _escape, markdown_to_html as _markdown_to_html, tiptap_json_to_html


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
