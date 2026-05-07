"""Configuration loader for the local MVP."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

_ROOT = Path(__file__).parent.parent
_DEFAULT_CONFIG_PATH = _ROOT / "config" / "company.yaml"
_DEFAULT_POLICY_PATH = _ROOT / "config" / "generation_policy.md"
_DEFAULT_USER_PROFILE_PATH = _ROOT / "config" / "user_profile.yaml"


@dataclass
class CompanyConfig:
    name: str
    address_line1: str
    address_line2: str
    city: str
    website: str
    agb_date: str


@dataclass
class UserProfileConfig:
    id: str
    name: str
    title: str
    email: str
    phone: str
    company_name: str
    signature_name: str
    signature_title: str
    closing: str = "Mit freundlichen Grüßen"


@dataclass
class RatesConfig:
    managing_consultant: float
    senior_consultant: float
    consultant: float
    junior_consultant: float


@dataclass
class DefaultsConfig:
    validity_weeks: int
    location_mode: str
    location_text_remote: str
    location_text_hybrid: str
    location_text_onsite: str
    currency: str


@dataclass
class LegalConfig:
    neutrality_note: str
    praembel: str
    billing_terms: str
    agb_text: str
    leistungsausschluesse_default: str
    vertragsschluss_intro: str
    vertragsschluss_body: str


@dataclass
class Config:
    company: CompanyConfig
    rates: RatesConfig
    defaults: DefaultsConfig
    legal: LegalConfig
    _raw: dict[str, Any] = field(default_factory=dict, repr=False)

    def location_text(self, mode: str | None = None) -> str:
        selected_mode = (mode or self.defaults.location_mode).lower()
        if selected_mode == "hybrid":
            return self.defaults.location_text_hybrid
        if selected_mode == "onsite":
            return self.defaults.location_text_onsite
        return self.defaults.location_text_remote

    def agb_text_formatted(self) -> str:
        return self.legal.agb_text.format(agb_date=self.company.agb_date)

    def vertragsschluss_text(
        self,
        validity_date: str,
        user_profile: UserProfileConfig,
    ) -> str:
        intro = self.legal.vertragsschluss_intro.format(validity_date=validity_date)
        return self.legal.vertragsschluss_body.format(
            validity_date=validity_date,
            vertragsschluss_intro=intro,
            agb_date=self.company.agb_date,
            company_name=user_profile.company_name,
            company_address_line1=self.company.address_line1,
            company_address_line2=self.company.address_line2,
            contact_email=user_profile.email,
        )

    @property
    def xlsx_path(self) -> Path:
        env = os.environ.get("ACCANTEC_XLSX")
        if env:
            return Path(env)
        return _ROOT / "Angebotsnummern.xlsx"

    @property
    def generation_policy(self) -> str:
        policy_path = Path(os.environ.get("ACCANTEC_POLICY", str(_DEFAULT_POLICY_PATH)))
        if policy_path.exists():
            return policy_path.read_text(encoding="utf-8")
        return ""

    def rate_for_role(self, role: str) -> float:
        mapping = {
            "managing_consultant": self.rates.managing_consultant,
            "managing consultant": self.rates.managing_consultant,
            "senior_consultant": self.rates.senior_consultant,
            "senior consultant": self.rates.senior_consultant,
            "consultant": self.rates.consultant,
            "junior_consultant": self.rates.junior_consultant,
            "junior consultant": self.rates.junior_consultant,
        }
        return mapping.get(role.lower(), self.rates.consultant)


def _load_yaml(path: Path) -> dict[str, Any]:
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def load_config(path: Path | None = None) -> Config:
    config_path = path or Path(os.environ.get("ACCANTEC_CONFIG", str(_DEFAULT_CONFIG_PATH)))
    raw = _load_yaml(config_path)

    c = raw["company"]
    r = raw["rates"]
    d = raw["defaults"]
    lg = raw["legal"]

    company = CompanyConfig(
        name=c["name"],
        address_line1=c["address_line1"],
        address_line2=c["address_line2"],
        city=c["city"],
        website=c["website"],
        agb_date=c["agb_date"],
    )
    rates = RatesConfig(
        managing_consultant=float(r["managing_consultant"]),
        senior_consultant=float(r["senior_consultant"]),
        consultant=float(r["consultant"]),
        junior_consultant=float(r["junior_consultant"]),
    )
    defaults = DefaultsConfig(
        validity_weeks=int(d["validity_weeks"]),
        location_mode=d["location_mode"],
        location_text_remote=d["location_text_remote"],
        location_text_hybrid=d["location_text_hybrid"],
        location_text_onsite=d["location_text_onsite"],
        currency=d["currency"],
    )
    legal = LegalConfig(
        neutrality_note=lg["neutrality_note"].strip(),
        praembel=lg["praembel"].strip(),
        billing_terms=lg["billing_terms"].strip(),
        agb_text=lg["agb_text"],
        leistungsausschluesse_default=lg["leistungsausschluesse_default"],
        vertragsschluss_intro=lg["vertragsschluss_intro"],
        vertragsschluss_body=lg["vertragsschluss_body"].strip(),
    )
    return Config(company=company, rates=rates, defaults=defaults, legal=legal, _raw=raw)


def load_user_profile(path: Path | None = None) -> UserProfileConfig:
    profile_path = path or Path(
        os.environ.get("ACCANTEC_USER_PROFILE", str(_DEFAULT_USER_PROFILE_PATH))
    )
    if not profile_path.exists():
        raise FileNotFoundError(
            "config/user_profile.yaml fehlt. Bitte config/user_profile.example.yaml kopieren "
            "und Ihre Kontaktdaten eintragen."
        )

    raw = _load_yaml(profile_path)
    required_fields = [
        "id",
        "name",
        "title",
        "email",
        "phone",
        "company_name",
        "signature_name",
        "signature_title",
    ]
    missing = [field_name for field_name in required_fields if not str(raw.get(field_name, "")).strip()]
    if missing:
        joined = ", ".join(missing)
        raise ValueError(f"config/user_profile.yaml ist unvollstaendig. Fehlend: {joined}")

    return UserProfileConfig(
        id=str(raw["id"]).strip(),
        name=str(raw["name"]).strip(),
        title=str(raw["title"]).strip(),
        email=str(raw["email"]).strip(),
        phone=str(raw["phone"]).strip(),
        company_name=str(raw["company_name"]).strip(),
        signature_name=str(raw["signature_name"]).strip(),
        signature_title=str(raw["signature_title"]).strip(),
        closing=str(raw.get("closing", "Mit freundlichen Grüßen")).strip(),
    )


_config: Config | None = None
_user_profile: UserProfileConfig | None = None


def get_config() -> Config:
    global _config
    if _config is None:
        _config = load_config()
    return _config


def get_user_profile() -> UserProfileConfig:
    global _user_profile
    if _user_profile is None:
        _user_profile = load_user_profile()
    return _user_profile
