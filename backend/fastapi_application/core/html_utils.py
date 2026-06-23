"""HTML rendering utilities for TipTap rich content and markdown."""

from __future__ import annotations

import html
from typing import Any

try:
    import markdown as md_lib
except ImportError:  # pragma: no cover
    md_lib = None  # type: ignore[assignment]


def escape(text: str) -> str:
    return html.escape(text, quote=True)


def apply_marks(text: str, marks: list[dict[str, Any]] | None) -> str:
    if not marks:
        return escape(text)
    result = escape(text)
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
            href = escape(str(mark.get("attrs", {}).get("href", "#")))
            result = f'<a href="{href}" rel="noopener noreferrer">{result}</a>'
    return result


def tiptap_json_to_html(node: Any) -> str:
    if not node:
        return ""
    if isinstance(node, list):
        return "".join(tiptap_json_to_html(n) for n in node)
    if not isinstance(node, dict):
        return escape(str(node))

    ntype = node.get("type")
    content = node.get("content") or []
    attrs = node.get("attrs") or {}

    if ntype == "text":
        return apply_marks(str(node.get("text", "")), node.get("marks"))

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
        code_text = escape("".join(text_parts))
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
        src = escape(str(attrs.get("src", "")))
        alt = escape(str(attrs.get("alt", "")))
        return f'<img src="{src}" alt="{alt}" style="max-width:100%;height:auto;">'

    return "".join(tiptap_json_to_html(content))


def markdown_to_html(text: str) -> str:
    if not text.strip():
        return ""
    if md_lib is None:
        return escape(text).replace("\n", "<br>")
    return md_lib.markdown(
        text,
        extensions=["tables", "fenced_code", "nl2br"],
    )
