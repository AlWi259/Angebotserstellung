"""Small CLI helpers for the local MVP."""
from __future__ import annotations

import argparse
import sys
from datetime import date
from pathlib import Path


def cmd_number(_: argparse.Namespace) -> None:
    from .config import get_config
    from .numbering import get_next_number

    config = get_config()
    print(get_next_number(date.today(), config.xlsx_path))


def cmd_render(args: argparse.Namespace) -> None:
    from .config import get_config
    from .renderer import render_offer

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Eingabedatei nicht gefunden: {input_path}", file=sys.stderr)
        sys.exit(1)

    output_path = Path(args.output) if args.output else input_path.with_suffix(".pdf")
    config = get_config()
    markdown = input_path.read_text(encoding="utf-8")
    render_offer(markdown, config, output_path=output_path)
    print(output_path)


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="python -m backend.cli",
        description="accantec Angebotserstellung MVP CLI",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("number", help="Naechste Angebotsnummer anzeigen")

    render_parser = subparsers.add_parser("render", help="Markdown zu PDF rendern")
    render_parser.add_argument("--input", "-i", required=True, help="Markdown-Datei")
    render_parser.add_argument("--output", "-o", help="PDF-Ausgabedatei")

    args = parser.parse_args()
    if args.command == "number":
        cmd_number(args)
    elif args.command == "render":
        cmd_render(args)


if __name__ == "__main__":
    main()
