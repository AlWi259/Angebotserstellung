"""Prompt and markdown generation for the local MVP."""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, StrictUndefined

from .config import Config, UserProfileConfig

_TEMPLATE_DIR = Path(__file__).parent.parent / "templates"

_MONTHS_DE = [
    "",
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
]


@dataclass
class SimpleContractType:
    id: str = "consulting_offer"
    label: str = "Beratungsangebot"
    template: str = "offer.md.j2"


def format_date_german(d: date) -> str:
    return f"{d.day}. {_MONTHS_DE[d.month]} {d.year}"


def compute_validity_date(from_date: date, weeks: int) -> date:
    return from_date + timedelta(weeks=weeks)


def _salutation(gender: str, last_name: str) -> str:
    gender_normalized = (gender or "").lower()
    if gender_normalized in ("m", "herr", "male", "männlich"):
        return f"Sehr geehrter Herr {last_name}"
    if gender_normalized in ("f", "frau", "female", "weiblich"):
        return f"Sehr geehrte Frau {last_name}"
    return "Sehr geehrte Damen und Herren"


def _fmt_eur(amount: float) -> str:
    formatted = f"{amount:,.0f}".replace(",", ".")
    return f"{formatted} EUR"


def _build_pricing_rows(line_items: list[dict[str, Any]], discount_percent: float = 0) -> dict[str, Any]:
    items: list[dict[str, Any]] = []
    subtotal = 0.0
    for item in line_items:
        item_type = item.get("type", "days")
        if item_type == "fixed":
            amount = float(item.get("fixed_amount", 0))
            items.append({
                "description": item.get("description", ""),
                "unit": "Pauschal",
                "is_fixed": True,
                "rate_formatted": "–",
                "days_display": "–",
                "amount": amount,
                "amount_formatted": _fmt_eur(amount),
            })
        else:
            rate = float(item.get("rate", 0))
            days = float(item.get("days", 0))
            amount = rate * days
            items.append({
                "description": item.get("description", ""),
                "unit": item.get("unit", "Tag(e)"),
                "is_fixed": False,
                "rate": rate,
                "days": days,
                "amount": amount,
                "rate_formatted": _fmt_eur(rate),
                "days_display": f"{days:g}",
                "amount_formatted": _fmt_eur(amount),
            })
        subtotal += amount

    discount_amount = round(subtotal * discount_percent / 100, 2) if discount_percent > 0 else 0.0
    total = subtotal - discount_amount

    return {
        "items": items,
        "subtotal": subtotal,
        "subtotal_formatted": _fmt_eur(subtotal),
        "has_discount": discount_percent > 0,
        "discount_percent": int(discount_percent),
        "discount_amount": discount_amount,
        "discount_formatted": _fmt_eur(discount_amount),
        "total_amount": total,
        "total_formatted": _fmt_eur(total),
    }


def _render_markdown_fragment(text: str) -> str:
    if not text:
        return ""
    try:
        import markdown as md_lib  # type: ignore

        html = md_lib.markdown(
            text,
            extensions=["tables", "extra", "nl2br"],
        )
        return _linkify_html(html)
    except ImportError:
        return _linkify_html(f"<p>{text}</p>")


def _linkify_html(html: str) -> str:
    def replace_url(match: re.Match[str]) -> str:
        value = match.group(0)
        suffix = ""
        while value and value[-1] in ".,);":
            suffix = value[-1] + suffix
            value = value[:-1]
        href = value if value.startswith("http") else f"https://{value}"
        return f'<a href="{href}">{value}</a>{suffix}'

    def replace_email(match: re.Match[str]) -> str:
        value = match.group(0)
        return f'<a href="mailto:{value}">{value}</a>'

    html = re.sub(r'(?<!["\'>])(https?://[^\s<]+|www\.[^\s<]+)', replace_url, html)
    html = re.sub(
        r'(?<!["\'>])([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})',
        replace_email,
        html,
    )
    return html


def _placeholder_content(form_data: dict[str, Any]) -> dict[str, Any]:
    customer = form_data.get("customer_company", "dem Auftraggeber")
    project = form_data.get("project_name", "das Projekt")
    context = form_data.get("project_context", "")

    ausgangssituation = (
        f"Der Auftraggeber {customer} steht vor der Herausforderung, {project} erfolgreich umzusetzen. "
        f"Im Rahmen der digitalen Transformation bestehen konkrete Anforderungen an die Modernisierung "
        f"bestehender Prozesse und Systeme.\n\n"
        f"Die aktuelle Situation erfordert eine strukturierte Herangehensweise, die sowohl technische als auch "
        f"organisatorische Aspekte berücksichtigt. Bestehende Lösungen decken die aktuellen Anforderungen nicht "
        f"vollständig ab.\n\n"
        f"accantec unterstützt {customer} dabei, die notwendigen Schritte zu planen, umzusetzen und nachhaltig "
        f"zu verankern."
    )

    if context:
        ausgangssituation = (
            f"Der Auftraggeber {customer} hat folgenden Handlungsbedarf identifiziert: {context}\n\n"
            f"Diese Situation erfordert eine strukturierte Analyse und gezielte Maßnahmen, um die definierten "
            f"Projektziele zu erreichen.\n\n"
            f"accantec bringt die notwendige Expertise mit, um {customer} in diesem Vorhaben kompetent "
            f"zu begleiten."
        )

    return {
        "cover_paragraphs": [
            (
                "vielen Dank für Ihr Interesse an einer Zusammenarbeit mit der accantec information solutions "
                "GmbH. Wir freuen uns, Ihnen hiermit unser Angebot für das angefragte Vorhaben zu unterbreiten."
            ),
            (
                f"Auf Basis Ihrer Anfrage zum Projekt \"{project}\" haben wir die Ausgangssituation strukturiert "
                f"aufbereitet und den vorgeschlagenen Leistungsumfang beschrieben."
            ),
            (
                "Für Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung und freuen uns auf die weitere "
                "Abstimmung."
            ),
        ],
        "ausgangssituation": ausgangssituation,
        "einschaetzung_rows": [
            {
                "problem": "Die bestehende Ausgangssituation ist nicht ausreichend strukturiert dokumentiert.",
                "empfehlung": "Wir führen eine fokussierte Ist-Analyse durch und leiten daraus einen belastbaren Maßnahmenplan ab.",
            },
            {
                "problem": "Relevante Anforderungen, Prozesse und Verantwortlichkeiten sind noch nicht konsistent abgestimmt.",
                "empfehlung": "Wir schaffen Transparenz über Ziele, Rollen und Umsetzungsprioritäten und sichern die Abstimmung mit den Stakeholdern ab.",
            },
            {
                "problem": "Für die erfolgreiche Umsetzung fehlt ein klar gegliederter Leistungsrahmen.",
                "empfehlung": "Wir strukturieren das Vorhaben in konkrete Arbeitspakete und begleiten die Umsetzung methodisch und fachlich.",
            },
        ],
        "projektziele": [
            "Transparenz über Ausgangssituation, Anforderungen und Handlungsfelder herstellen",
            "Ein belastbares Zielbild für die weitere Projektumsetzung definieren",
            "Konkrete Maßnahmen, Verantwortlichkeiten und Prioritäten ableiten",
            "Die Umsetzung mit fachlicher und methodischer Beratung absichern",
        ],
        "leistungsbeschreibung": (
            "### Phase 1: Analyse und Strukturierung\n\n"
            "- Sichtung der Ausgangssituation und Einordnung der zentralen Herausforderungen\n"
            "- Abstimmung mit den relevanten Ansprechpartnern auf Kundenseite\n"
            "- Strukturierung der Anforderungen, Abhängigkeiten und Rahmenbedingungen\n"
            "- Ableitung eines umsetzbaren Vorgehensmodells\n\n"
            "### Phase 2: Konzeption und Umsetzungsvorbereitung\n\n"
            "- Konkretisierung der vereinbarten Arbeitspakete und Ergebnisse\n"
            "- Vorbereitung der fachlichen und organisatorischen Umsetzung\n"
            "- Abstimmung der Prioritäten und des weiteren Projektvorgehens\n"
            "- Dokumentation der Ergebnisse für die nächsten Projektphasen\n\n"
            "### Phase 3: Begleitung und Qualitätssicherung\n\n"
            "- Fachliche Begleitung der vereinbarten Maßnahmen\n"
            "- Regelmäßige Reviews und Abstimmungen mit dem Auftraggeber\n"
            "- Qualitätssicherung der Ergebnisse und Übergabe der Dokumentation\n"
            "- Sicherstellung des Wissenstransfers in die Organisation"
        ),
    }


def parse_ai_response(ai_response: str) -> dict[str, Any]:
    if not ai_response or not ai_response.strip():
        raise ValueError("Leere KI-Antwort.")

    cleaned = ai_response.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ValueError("Die KI-Antwort ist kein valides JSON.") from exc

    required_fields = ["ausgangssituation", "einschaetzung_rows", "projektziele", "leistungsbeschreibung"]
    missing = [field_name for field_name in required_fields if field_name not in payload]
    if missing:
        raise ValueError(
            "Die KI-Antwort ist unvollständig. Fehlende Felder: " + ", ".join(missing)
        )

    if not isinstance(payload["einschaetzung_rows"], list):
        raise ValueError("einschaetzung_rows muss eine Liste sein.")
    if not isinstance(payload["projektziele"], list):
        raise ValueError("projektziele muss eine Liste sein.")

    cover_paragraphs = payload.get("cover_paragraphs")
    if cover_paragraphs is not None and not isinstance(cover_paragraphs, list):
        raise ValueError("cover_paragraphs muss eine Liste sein.")

    return payload


def build_offer_prompt(
    form_data: dict[str, Any],
    config: Config,
    user_profile: UserProfileConfig,
) -> str:
    policy = config.generation_policy.strip()
    project_name = form_data.get("project_name", "")
    line_items = form_data.get("line_items", [])
    line_items_text = "\n".join(
        [
            f"- {item.get('description', '')}: {item.get('days', 0)} {item.get('unit', 'Tag(e)')} à {item.get('rate', 0)} EUR"
            for item in line_items
            if item.get("description")
        ]
    ) or "- Keine Preispositionen angegeben"

    input_summary = f"""Absender:
- Name: {user_profile.name}
- Rolle: {user_profile.title}
- E-Mail: {user_profile.email}
- Telefon: {user_profile.phone}

Angebots-Metadaten:
- Angebotsnummer: {form_data.get("offer_number", "")}
- Projektname: {project_name}
- Gültig bis: {form_data.get("validity_date_german", "")}
- Leistungsort: {form_data.get("location_mode", "")}

Auftraggeber:
- Unternehmen: {form_data.get("customer_company", "")}
- Straße: {form_data.get("customer_street", "")}
- PLZ / Ort: {form_data.get("customer_postal", "")} {form_data.get("customer_city", "")}
- Land: {form_data.get("customer_country", "")}

Anfragende Person:
- Name: {form_data.get("customer_requester_name", "")}
- Rolle: {form_data.get("customer_requester_role", "")}
- E-Mail: {form_data.get("customer_requester_email", "")}

Ansprechpartner Auftraggeber:
- Anrede: {form_data.get("customer_primary_contact_gender", "")}
- Name: {form_data.get("customer_primary_contact_name", "")}
- E-Mail: {form_data.get("customer_primary_contact_email", "")}
- Telefon: {form_data.get("customer_primary_contact_phone", "")}

Projektkontext:
{form_data.get("project_context", "")}

Preispositionen:
{line_items_text}

Wichtige Regeln:
- Standardtexte, Rechtstexte, Footer, Kontaktdaten und feste Template-Elemente NICHT neu schreiben.
- Keine Kontaktdaten erfinden oder umformulieren.
- Schreibe nur die variablen Projektabschnitte.
- Antworte ausschließlich mit validem JSON.
"""

    return (
        f"{policy}\n\n"
        "Zusätzliche MVP-Anweisung:\n"
        "- Dieser Prompt ist für Claude Code oder Codex CLI gedacht.\n"
        "- Optional dürfen 2 bis 3 Anschreiben-Absätze als cover_paragraphs geliefert werden.\n"
        "- Wenn cover_paragraphs geliefert werden, dann als Liste von Strings.\n"
        "- Gib KEIN vollständiges Angebot zurück, sondern nur die variablen Inhalte im JSON-Format.\n\n"
        "Erwartetes JSON-Schema:\n"
        "{\n"
        '  "cover_paragraphs": ["Absatz 1", "Absatz 2", "Absatz 3"],\n'
        '  "ausgangssituation": "Text mit \\n\\n für Absätze",\n'
        '  "einschaetzung_rows": [{"problem": "...", "empfehlung": "..."}],\n'
        '  "projektziele": ["Ziel 1", "Ziel 2"],\n'
        '  "leistungsbeschreibung": "Markdown mit ###-Überschriften"\n'
        "}\n\n"
        "Verwende folgende Eingaben:\n"
        f"{input_summary}"
    )


def generate_offer(
    form_data: dict[str, Any],
    config: Config,
    user_profile: UserProfileConfig,
    ai_content: dict[str, Any] | None = None,
) -> str:
    if ai_content is None:
        ai_content = _placeholder_content(form_data)

    generation_date = form_data.get("generation_date") or date.today()
    if isinstance(generation_date, str):
        from dateutil.parser import parse as parse_date  # type: ignore

        generation_date = parse_date(generation_date).date()

    validity_date = form_data.get("validity_date")
    if isinstance(validity_date, str) and validity_date:
        from dateutil.parser import parse as parse_date  # type: ignore

        validity_date = parse_date(validity_date).date()
    elif not validity_date:
        validity_date = compute_validity_date(generation_date, config.defaults.validity_weeks)

    leistungsausschluesse = form_data.get(
        "leistungsausschluesse", config.legal.leistungsausschluesse_default
    )
    location_mode = form_data.get("location_mode", config.defaults.location_mode)
    leistungsort_text = config.location_text(location_mode)
    pricing = _build_pricing_rows(
        form_data.get("line_items", []),
        discount_percent=float(form_data.get("discount_percent", 0)),
    )

    gender = form_data.get("customer_primary_contact_gender", form_data.get("customer_gender", ""))
    contact_last_name = (
        form_data.get("customer_primary_contact_last_name")
        or form_data.get("customer_contact_last_name")
        or form_data.get("customer_primary_contact_name", "").split()[-1]
    )
    salutation = _salutation(gender, contact_last_name)
    contract_type = SimpleContractType()

    cover_paragraphs = ai_content.get("cover_paragraphs") or _build_cover_letter(form_data)
    vertragsschluss_text = config.vertragsschluss_text(
        format_date_german(validity_date),
        user_profile=user_profile,
    )

    env = Environment(
        loader=FileSystemLoader(str(_TEMPLATE_DIR)),
        undefined=StrictUndefined,
        trim_blocks=True,
        lstrip_blocks=True,
    )
    template = env.get_template(contract_type.template)

    context = {
        "offer_number": form_data.get("offer_number", "XXXXXXXX-00"),
        "contract_type": contract_type,
        "generation_date": generation_date.isoformat(),
        "generation_date_german": format_date_german(generation_date),
        "validity_date_german": format_date_german(validity_date),
        "project_name": form_data.get("project_name", "Beratungsprojekt"),
        "customer_company": form_data.get("customer_company", ""),
        "customer_company_legal_name": form_data.get("customer_company", ""),
        "customer_contact_person": form_data.get("customer_primary_contact_name", ""),
        "customer_primary_contact_name": form_data.get("customer_primary_contact_name", ""),
        "customer_primary_contact_email": form_data.get("customer_primary_contact_email", ""),
        "customer_primary_contact_phone": form_data.get("customer_primary_contact_phone", ""),
        "customer_requester_name": form_data.get("customer_requester_name", ""),
        "customer_requester_email": form_data.get("customer_requester_email", ""),
        "customer_requester_role": form_data.get("customer_requester_role", ""),
        "customer_street": form_data.get("customer_street", ""),
        "customer_postal": form_data.get("customer_postal", ""),
        "customer_city": form_data.get("customer_city", ""),
        "customer_country": form_data.get("customer_country", "Deutschland"),
        "salutation": salutation,
        "cover_paragraphs": cover_paragraphs,
        "company": config.company,
        "sender_profile": user_profile,
        "neutrality_note": config.legal.neutrality_note,
        "praembel": config.legal.praembel,
        "praembel_html": _render_markdown_fragment(config.legal.praembel),
        "ausgangssituation": ai_content.get("ausgangssituation", ""),
        "ausgangssituation_html": _render_markdown_fragment(ai_content.get("ausgangssituation", "")),
        "einschaetzung_rows": ai_content.get("einschaetzung_rows", []),
        "projektziele": ai_content.get("projektziele", []),
        "leistungsbeschreibung": ai_content.get("leistungsbeschreibung", ""),
        "leistungsbeschreibung_html": _render_markdown_fragment(
            ai_content.get("leistungsbeschreibung", "")
        ),
        "leistungsausschluesse": leistungsausschluesse,
        "leistungsort_text": leistungsort_text,
        "pricing": pricing,
        "pricing_mode": form_data.get("pricing_mode", "time-and-materials"),
        "billing_terms": config.legal.billing_terms,
        "billing_terms_html": _render_markdown_fragment(config.legal.billing_terms),
        "vertragsschluss_text": vertragsschluss_text,
        "vertragsschluss_html": _render_markdown_fragment(vertragsschluss_text),
    }
    return template.render(**context)


def _build_cover_letter(form_data: dict[str, Any]) -> list[str]:
    customer = form_data.get("customer_company", "Ihrem Unternehmen")
    project = form_data.get("project_name", "das beschriebene Vorhaben")
    return [
        (
            "vielen Dank für Ihr Interesse an einer Zusammenarbeit mit der accantec information "
            f"solutions GmbH. Wir freuen uns, Ihnen hiermit unser Angebot für das Projekt „{project}“ "
            "zu unterbreiten."
        ),
        (
            "Auf Basis Ihrer Anfrage haben wir uns mit der beschriebenen Ausgangssituation "
            "auseinandergesetzt und den vorgeschlagenen Leistungsumfang für die weitere Zusammenarbeit "
            "zusammengestellt."
        ),
        (
            f"Für Rückfragen stehe ich Ihnen jederzeit gerne zur Verfügung. Ich freue mich auf eine "
            f"erfolgreiche Zusammenarbeit mit {customer}."
        ),
    ]
