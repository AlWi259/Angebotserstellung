"""Offer numbering adapter for Angebotsnummern.xlsx.

Format: YYYYMMDD-XX  (XX starts at 01 per calendar day)

Thread-safety: uses filelock to prevent concurrent writes.
"""
from __future__ import annotations

import re
from datetime import date
from pathlib import Path
from typing import Optional

import openpyxl
from openpyxl.styles import Font
from filelock import FileLock


# Column layout for year sheets (2025+)
_COL_NUMBER = 1        # Angebotsnummer
_COL_CREATED = 2       # Erstellungsdatum
_COL_KUNDE = 3         # Kunde
_COL_PROJEKT = 4       # Projektname
_COL_STATUS = 5        # Status
_COL_VON = 6           # Von

_HEADERS = ["Angebotsnummer", "Erstellungsdatum", "Kunde", "Projektname", "Status", "Von"]

# Regex for YYYYMMDD-XX format
_NUMBER_RE = re.compile(r"^(\d{8})-(\d{2,})$")


def _lock_path(xlsx_path: Path) -> Path:
    return xlsx_path.with_suffix(".xlsx.lock")


def _ensure_workbook(xlsx_path: Path) -> openpyxl.Workbook:
    """Load workbook or create a fresh one."""
    if xlsx_path.exists():
        try:
            return openpyxl.load_workbook(xlsx_path)
        except Exception:
            pass
    wb = openpyxl.Workbook()
    # Remove default sheet
    if "Sheet" in wb.sheetnames:
        del wb["Sheet"]
    return wb


def _ensure_year_sheet(wb: openpyxl.Workbook, year: int) -> openpyxl.worksheet.worksheet.Worksheet:
    """Get or create a year sheet with proper headers."""
    sheet_name = str(year)
    if sheet_name in wb.sheetnames:
        return wb[sheet_name]

    ws = wb.create_sheet(title=sheet_name)
    # Write headers in bold
    for col_idx, header in enumerate(_HEADERS, start=1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = Font(bold=True)

    # Set reasonable column widths
    ws.column_dimensions["A"].width = 20
    ws.column_dimensions["B"].width = 16
    ws.column_dimensions["C"].width = 40
    ws.column_dimensions["D"].width = 50
    ws.column_dimensions["E"].width = 20
    ws.column_dimensions["F"].width = 20

    return ws


def _date_prefix(d: date) -> str:
    """Return 'YYYYMMDD' prefix string."""
    return d.strftime("%Y%m%d")


def get_existing_numbers_for_date(target_date: date, xlsx_path: Path) -> list[str]:
    """Return all existing offer numbers for a given date (without file lock)."""
    if not xlsx_path.exists():
        return []

    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    sheet_name = str(target_date.year)
    if sheet_name not in wb.sheetnames:
        wb.close()
        return []

    ws = wb[sheet_name]
    prefix = _date_prefix(target_date)
    results: list[str] = []

    for row in ws.iter_rows(min_row=2, values_only=True):
        val = row[_COL_NUMBER - 1] if row else None
        if val is None:
            continue
        val = str(val).strip()
        if val.startswith(prefix + "-"):
            results.append(val)

    wb.close()
    return results


def get_next_number(target_date: date, xlsx_path: Path) -> str:
    """Allocate (but do NOT persist) the next offer number for the given date.

    This reads existing numbers under a file lock so it is safe to call
    concurrently. To actually save the number, call persist_offer().
    """
    lock = FileLock(str(_lock_path(xlsx_path)), timeout=30)
    with lock:
        existing = get_existing_numbers_for_date(target_date, xlsx_path)
        max_seq = 0
        prefix = _date_prefix(target_date)
        for num in existing:
            m = _NUMBER_RE.match(num)
            if m and m.group(1) == prefix:
                seq = int(m.group(2))
                max_seq = max(max_seq, seq)
        next_seq = max_seq + 1
        return f"{prefix}-{next_seq:02d}"


def persist_offer(
    number: str,
    customer: str,
    project: str,
    created_by: str,
    xlsx_path: Path,
    status: Optional[str] = None,
    created_date: Optional[date] = None,
) -> None:
    """Write the offer record to the Excel workbook atomically."""
    # Parse year from number
    m = _NUMBER_RE.match(number)
    if not m:
        raise ValueError(f"Invalid offer number format: {number!r}")
    year = int(m.group(1)[:4])
    date_str = m.group(1)
    entry_date = created_date or date(year, int(date_str[4:6]), int(date_str[6:8]))

    lock = FileLock(str(_lock_path(xlsx_path)), timeout=30)
    with lock:
        wb = _ensure_workbook(xlsx_path)
        ws = _ensure_year_sheet(wb, year)

        # Check for duplicate
        for row in ws.iter_rows(min_row=2, values_only=True):
            if row and row[_COL_NUMBER - 1] == number:
                # Already recorded – update in place
                for r_idx, r in enumerate(ws.iter_rows(min_row=2), start=2):
                    if r[_COL_NUMBER - 1].value == number:
                        r[_COL_KUNDE - 1].value = customer
                        r[_COL_PROJEKT - 1].value = project
                        r[_COL_VON - 1].value = created_by
                        if status:
                            r[_COL_STATUS - 1].value = status
                        break
                wb.save(xlsx_path)
                return

        # Append new row
        next_row = ws.max_row + 1
        ws.cell(row=next_row, column=_COL_NUMBER, value=number)
        ws.cell(row=next_row, column=_COL_CREATED, value=entry_date.strftime("%Y-%m-%d"))
        ws.cell(row=next_row, column=_COL_KUNDE, value=customer)
        ws.cell(row=next_row, column=_COL_PROJEKT, value=project)
        ws.cell(row=next_row, column=_COL_STATUS, value=status or "")
        ws.cell(row=next_row, column=_COL_VON, value=created_by)

        wb.save(xlsx_path)


def allocate_and_persist(
    target_date: date,
    customer: str,
    project: str,
    created_by: str,
    xlsx_path: Path,
    status: Optional[str] = None,
) -> str:
    """Atomically allocate the next number and write it to the workbook.

    Returns the allocated offer number string.
    """
    lock = FileLock(str(_lock_path(xlsx_path)), timeout=30)
    with lock:
        existing = get_existing_numbers_for_date(target_date, xlsx_path)
        prefix = _date_prefix(target_date)
        max_seq = 0
        for num in existing:
            m = _NUMBER_RE.match(num)
            if m and m.group(1) == prefix:
                seq = int(m.group(2))
                max_seq = max(max_seq, seq)
        next_seq = max_seq + 1
        number = f"{prefix}-{next_seq:02d}"

        year = target_date.year
        wb = _ensure_workbook(xlsx_path)
        ws = _ensure_year_sheet(wb, year)

        next_row = ws.max_row + 1
        ws.cell(row=next_row, column=_COL_NUMBER, value=number)
        ws.cell(row=next_row, column=_COL_CREATED, value=target_date.strftime("%Y-%m-%d"))
        ws.cell(row=next_row, column=_COL_KUNDE, value=customer)
        ws.cell(row=next_row, column=_COL_PROJEKT, value=project)
        ws.cell(row=next_row, column=_COL_STATUS, value=status or "")
        ws.cell(row=next_row, column=_COL_VON, value=created_by)

        wb.save(xlsx_path)

    return number
