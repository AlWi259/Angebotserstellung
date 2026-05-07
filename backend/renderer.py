"""Markdown → HTML → PDF rendering via WeasyPrint.

Pipeline:
  1. Strip YAML front matter from the Markdown source.
  2. Convert Markdown to HTML with python-markdown (tables, extra, md_in_html).
  3. Embed CSS and inject running-element context into an HTML wrapper template.
  4. Render HTML to PDF with WeasyPrint, using the project root as base_url
     so relative asset references (CSS background-image, <img> src) resolve.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Optional

import yaml
from jinja2 import Environment, FileSystemLoader

from .config import Config

_PROJECT_ROOT = Path(__file__).parent.parent
_TEMPLATE_DIR = _PROJECT_ROOT / "templates"
_STYLES_DIR = _PROJECT_ROOT / "styles"
_ASSETS_DIR = _PROJECT_ROOT / "assets"

# German month names for date formatting in the footer
_MONTHS_DE = [
    "", "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
]


def _format_date_german(d_iso: str) -> str:
    """Convert ISO date string 'YYYY-MM-DD' to German format 'DD. Month YYYY'."""
    try:
        from dateutil.parser import parse as parse_date  # type: ignore
        if hasattr(d_iso, "year") and hasattr(d_iso, "month") and hasattr(d_iso, "day"):
            d = d_iso
        else:
            d = parse_date(str(d_iso)).date()
        return f"{d.day}. {_MONTHS_DE[d.month]} {d.year}"
    except Exception:
        return str(d_iso)


def _parse_front_matter(markdown_text: str) -> tuple[dict, str]:
    """Strip YAML front matter from Markdown and return (meta_dict, body_text)."""
    stripped = markdown_text.lstrip("\n")
    if not stripped.startswith("---"):
        return {}, markdown_text

    end = stripped.find("\n---", 3)
    if end == -1:
        return {}, markdown_text

    yaml_block = stripped[3:end].strip()
    body = stripped[end + 4:].lstrip("\n")

    try:
        meta = yaml.safe_load(yaml_block) or {}
    except yaml.YAMLError:
        meta = {}

    return meta, body


def render_markdown_to_html(
    markdown_text: str,
    config: Config,
    total_body_pages: Optional[int] = None,
) -> str:
    """Convert a complete offer Markdown document to a full HTML page.

    Args:
        markdown_text: The complete offer Markdown (may include YAML front matter).
        config: Loaded Config instance (used for company context in the template).

    Returns:
        Complete HTML string ready for WeasyPrint.
    """
    # 1. Parse front matter for footer context
    meta, body_md = _parse_front_matter(markdown_text)
    offer_number = meta.get("angebot_nr", "")
    datum_iso = meta.get("datum", "")
    date_german = _format_date_german(datum_iso) if datum_iso else ""

    # 2. Markdown → HTML
    try:
        import markdown as md_lib  # type: ignore
        body_html = md_lib.markdown(
            body_md,
            extensions=[
                "tables",
                "extra",    # includes md_in_html, attr_list, def_list, etc.
                "nl2br",
            ],
        )
    except ImportError:
        body_html = f"<pre>{body_md}</pre>"

    # 3. Load CSS
    css_path = _STYLES_DIR / "offer.css"
    css_content = css_path.read_text(encoding="utf-8") if css_path.exists() else ""

    # 4. Render into HTML wrapper template
    env = Environment(
        loader=FileSystemLoader(str(_TEMPLATE_DIR)),
        autoescape=False,  # body_html is trusted output from markdown parser
    )
    template = env.get_template("offer_html.html")

    html = template.render(
        body=body_html,
        css=css_content,
        company=config.company,
        offer_number=offer_number,
        date_german=date_german,
        total_body_pages=total_body_pages,
    )
    return html


def _build_weasy_html(html: str):
    """Create a WeasyPrint HTML object with the project asset base URL."""
    try:
        from weasyprint import HTML  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "WeasyPrint is not installed. Run: pip install weasyprint"
        ) from exc

    base_url = _ASSETS_DIR.as_uri() + "/"
    return HTML(string=html, base_url=base_url)


def count_pdf_pages(html: str) -> int:
    """Return the number of PDF pages WeasyPrint would generate for this HTML."""
    return len(_build_weasy_html(html).render().pages)


def render_html_to_pdf(html: str, output_path: Optional[Path] = None) -> bytes:
    """Render an HTML string to PDF bytes using WeasyPrint.

    Args:
        html: Complete HTML document string.
        output_path: If provided, also write the PDF to this file path.

    Returns:
        PDF content as bytes.

    Raises:
        RuntimeError: If WeasyPrint is not installed.
    """
    pdf_bytes = _build_weasy_html(html).write_pdf()

    if output_path is not None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(pdf_bytes)

    return pdf_bytes


def render_offer(
    markdown_text: str,
    config: Config,
    output_path: Optional[Path] = None,
) -> bytes:
    """Full pipeline: Markdown → HTML → PDF.

    Args:
        markdown_text: Complete offer Markdown.
        config: Config instance.
        output_path: If provided, write PDF to this path as well.

    Returns:
        PDF bytes.
    """
    first_pass_html = render_markdown_to_html(markdown_text, config)
    total_pages = count_pdf_pages(first_pass_html)
    total_body_pages = max(total_pages - 1, 1)
    html = render_markdown_to_html(
        markdown_text,
        config,
        total_body_pages=total_body_pages,
    )
    return render_html_to_pdf(html, output_path=output_path)
