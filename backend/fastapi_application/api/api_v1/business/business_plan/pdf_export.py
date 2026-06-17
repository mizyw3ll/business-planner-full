from __future__ import annotations

import html
import os

from core.models import BusinessPlan

from .block_serializer import (
    EXPORT_HTML_STYLES,
    block_type_label,
    serialize_block_html,
)

_FONT_REGISTERED = False
_FONT_PATH = r"C:\Windows\Fonts\arial.ttf"


def _ensure_font_registered() -> None:
    global _FONT_REGISTERED
    if _FONT_REGISTERED:
        return
    try:
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont

        if os.path.exists(_FONT_PATH):
            pdfmetrics.registerFont(TTFont("Arial", _FONT_PATH))
            pdfmetrics.registerFont(TTFont("Arial-Bold", r"C:\Windows\Fonts\arialbd.ttf"))
            _FONT_REGISTERED = True
    except Exception:
        pass


def _build_pdf_html(plan: BusinessPlan) -> str:
    blocks_html = ""
    for block in sorted(plan.blocks, key=lambda b: b.block_order):
        rc = block.rich_content if isinstance(block.rich_content, dict) else None
        content_html = serialize_block_html(block.block_type, block.content or "", rc)
        title_esc = html.escape(block.title, quote=True)
        type_esc = html.escape(block_type_label(block.block_type), quote=True)
        blocks_html += f"""
        <div class="block">
            <h3>{title_esc}</h3>
            <p class="type">{type_esc}</p>
            <div class="content">{content_html}</div>
        </div>
        """

    title_esc = html.escape(plan.title, quote=True)
    desc_esc = html.escape(plan.description or "", quote=True)
    created_esc = html.escape(plan.created_at.strftime("%Y-%m-%d"), quote=True)  # type: ignore[attr-defined]

    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>{title_esc}</title>
<style>
    {EXPORT_HTML_STYLES}
    @page {{ margin: 20mm 15mm; }}
    body {{ font-family: Arial, sans-serif; font-size: 12pt; }}
    h1 {{ font-size: 22pt; }}
    .block h3 {{ font-size: 14pt; }}
    .block .content {{ font-size: 10pt; }}
</style>
</head>
<body>
    <h1>{title_esc}</h1>
    <p class="meta">{desc_esc}<br>Создан: {created_esc}</p>
    {blocks_html}
</body>
</html>"""


def _override_font_mapping() -> None:
    try:
        import xhtml2pdf.default

        xhtml2pdf.default.DEFAULT_FONT["arial"] = "Arial"
        xhtml2pdf.default.DEFAULT_FONT["sansserif"] = "Arial"
    except Exception:
        pass


def generate_plan_pdf(plan: BusinessPlan) -> bytes:
    from io import BytesIO

    from xhtml2pdf import pisa

    _ensure_font_registered()
    _override_font_mapping()
    html_str = _build_pdf_html(plan)
    output = BytesIO()
    pisa.CreatePDF(html_str, dest=output)
    return output.getvalue()
