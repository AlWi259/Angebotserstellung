import {
  ChevronDown,
  FileOutput,
  LayoutPanelTop,
  MessageSquareText,
  MoonStar,
  Plus,
  Trash2,
  WandSparkles,
} from "lucide-react";
import React from "react";

import brandLogoDark from "@/assets/accantec_logo_x1f_white.png";
import brandLogoLight from "@/assets/accantec_part_of_x1f.png";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";

// ─── Types ────────────────────────────────────────────────────────────────────

type Theme = "dark" | "light";
type WorkspaceMode = "chat" | "canvas";
type LocationMode = "remote" | "hybrid" | "onsite";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type EinschaetzungRow = {
  problem: string;
  empfehlung: string;
};

type LineItem = {
  description: string;
  unit: string;
  rate: number;
  days: number;
};

type OfferDraft = {
  offer_number: string;
  project_name: string;
  location_mode: LocationMode;
  customer_company: string;
  customer_street: string;
  customer_postal: string;
  customer_city: string;
  customer_primary_contact_gender: string;
  customer_primary_contact_name: string;
  customer_primary_contact_phone: string;
  customer_primary_contact_email: string;
  customer_requester_name: string;
  customer_requester_role: string;
  customer_requester_email: string;
  cover_paragraphs: string[];
  ausgangssituation: string;
  einschaetzung_rows: EinschaetzungRow[];
  projektziele: string[];
  leistungsbeschreibung: string;
  leistungsausschluesse: string;
  line_items: LineItem[];
};

// ─── Fixed company / sender data (mirrors config/company.yaml + user_profile.yaml) ───

const COMPANY = {
  name: "accantec information solutions GmbH",
  address_line1: "Alstertor 17",
  address_line2: "20095 Hamburg",
  city: "Hamburg",
  website: "https://www.accantec.de",
  agb_date: "09. Oktober 2025",
  agb_url:
    "https://www.accantec.de/images/dokumente_pdf/251009_agb_accantec_information_solutions_gmbh.pdf",
};

const SENDER = {
  name: "Alexander Winkelmann",
  title: "Consultant",
  email: "a.winkelmann@accantec.com",
  phone: "+49 151 6851 8009",
  closing: "Mit freundlichen Grüßen",
};

const PRAEMBEL_PARAGRAPHS = [
  "Die accantec Gruppe ist ein Teil von x1F, einem führenden europäischen Anbieter für digitale Transformation im Finanzdienstleistungsbereich. Seit mehr als zwei Jahrzehnten ist accantec ein zuverlässiger Partner für exzellente Beratung und maßgeschneiderte Lösungen in den Bereichen Business Intelligence (BI), Data Science und Enterprise Software (SAP). Mit Hauptsitz in Hamburg und weiteren Standorten in Berlin, Frankfurt am Main, Heidelberg und Köln unterstützt unser Team aus über 70 engagierten Mitarbeitenden – davon über 50 erfahrene Beraterinnen und Berater – Unternehmen verschiedenster Branchen bei der erfolgreichen Umsetzung innovativer Datenstrategien.",
  "Als Unternehmensgruppe, bestehend aus der accantec consulting GmbH sowie den Tochtergesellschaften accantec information solutions GmbH und accantec finance solutions GmbH begleiten wir unsere Kunden in allen Phasen ihrer datengetriebenen Transformation – von der Konzeption und Implementierung über den Betrieb bis hin zur kontinuierlichen Optimierung ihrer BI- und Data-Science-Lösungen.",
  "Wir arbeiten sowohl mit den Plattformen marktführender Softwarehersteller wie Microsoft, SAP, IBM, AWS, Databricks und Snowflake als auch mit Open-Source-Tools wie n8n, KNIME, dbt, Qdrant, Weaviate, BAML und LangChain.",
  "Unsere fachliche Expertise reicht von Controlling und Finanzen über Risikomanagement und Kampagnenmanagement bis hin zu Bedarfsprognosen, Anomalieerkennung und analytischem Datenqualitätsmanagement. Wir bieten umfassende Implementierungskompetenz für klassische und cloudbasierte Architekturen, sei es beim Aufbau von Data Warehouses oder beim Einsatz von Advanced Analytics und Künstlicher Intelligenz. Managed Services, die alle Aspekte vom Incident Management bis zur Schulung abdecken, runden unser Portfolio ab und bieten unseren Kunden flexible Unterstützung – vor Ort oder remote.",
];

const BILLING_TERMS =
  "Der Auftragnehmer stellt seine Leistungen monatlich in Rechnung. Die Vergütung ist binnen 14 Tagen nach Eingang der Rechnung beim Auftraggeber fällig. Reisekosten werden nach Aufwand abgerechnet. Für die Nutzung des privaten PKW werden 0,60 EUR/km berechnet. Alle Preise verstehen sich zzgl. der gesetzlichen Mehrwertsteuer.";

const NEUTRALITY_NOTE =
  "Die in diesem Vertragstext verwendeten Personenbezeichnungen erfolgen geschlechtsunabhängig. Sie werden ausschließlich aus Gründen der besseren Lesbarkeit verwendet.";

const LOCATION_TEXTS: Record<LocationMode, string> = {
  remote: "Die Tätigkeiten des Beraters erfolgen überwiegend remote.",
  hybrid: "Die Tätigkeiten des Beraters erfolgen hybrid (remote und vor Ort beim Auftraggeber).",
  onsite: "Die Tätigkeiten des Beraters erfolgen überwiegend vor Ort beim Auftraggeber.",
};

const MONTHS_DE = [
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
];

const VALIDITY_WEEKS = 6;

// ─── Initial data ─────────────────────────────────────────────────────────────

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "Beschreibe mir einfach in ein paar Sätzen Kunde, Vorhaben, gewünschten Leistungsumfang und falls vorhanden die Angebotsnummer. Ich führe dich dann Schritt für Schritt durch den Angebotsentwurf.",
  },
];

const initialDraft: OfferDraft = {
  offer_number: "20260507-01",
  project_name: "Azure AI Foundry Einführung",
  location_mode: "remote",
  customer_company: "Bestandskunde Nord GmbH",
  customer_street: "Musterstraße 1",
  customer_postal: "20095",
  customer_city: "Hamburg",
  customer_primary_contact_gender: "Herr",
  customer_primary_contact_name: "Max Mustermann",
  customer_primary_contact_phone: "+49 40 1234567",
  customer_primary_contact_email: "m.mustermann@kunde.example",
  customer_requester_name: "Max Mustermann",
  customer_requester_role: "Projektleitung",
  customer_requester_email: "m.mustermann@kunde.example",
  cover_paragraphs: [
    "vielen Dank für Ihr Interesse an einer Zusammenarbeit mit der accantec information solutions GmbH. Wir freuen uns, Ihnen hiermit unser Angebot für das angefragte Vorhaben zu unterbreiten.",
    "Auf Basis Ihrer Anfrage zum Projekt „Azure AI Foundry Einführung“ haben wir die Ausgangssituation strukturiert aufbereitet und den vorgeschlagenen Leistungsumfang beschrieben.",
    "Für Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung und freuen uns auf die weitere Abstimmung.",
  ],
  ausgangssituation:
    "Der Auftraggeber Bestandskunde Nord GmbH hat folgenden Handlungsbedarf identifiziert: Begleitung bei der Einführung eines belastbaren Azure-AI-Foundry-Setups inklusive Zielbild, Governance und erster Umsetzungsstrecke.\n\nDiese Situation erfordert eine strukturierte Analyse und gezielte Maßnahmen, um die definierten Projektziele zu erreichen.\n\naccantec bringt die notwendige Expertise mit, um Bestandskunde Nord GmbH in diesem Vorhaben kompetent zu begleiten.",
  einschaetzung_rows: [
    {
      problem: "Die bestehende KI-Infrastruktur ist nicht ausreichend strukturiert dokumentiert.",
      empfehlung:
        "Wir führen eine fokussierte Ist-Analyse durch und leiten daraus einen belastbaren Maßnahmenplan ab.",
    },
    {
      problem:
        "Relevante Anforderungen, Prozesse und Verantwortlichkeiten sind noch nicht konsistent abgestimmt.",
      empfehlung:
        "Wir schaffen Transparenz über Ziele, Rollen und Umsetzungsprioritäten und sichern die Abstimmung mit den Stakeholdern ab.",
    },
    {
      problem: "Für die erfolgreiche Umsetzung fehlt ein klar gegliederter Leistungsrahmen.",
      empfehlung:
        "Wir strukturieren das Vorhaben in konkrete Arbeitspakete und begleiten die Umsetzung methodisch und fachlich.",
    },
  ],
  projektziele: [
    "Transparenz über Ausgangssituation, Anforderungen und Handlungsfelder herstellen",
    "Ein belastbares Zielbild für die weitere Projektumsetzung definieren",
    "Konkrete Maßnahmen, Verantwortlichkeiten und Prioritäten ableiten",
    "Die Umsetzung mit fachlicher und methodischer Beratung absichern",
  ],
  leistungsbeschreibung:
    "### Phase 1: Analyse und Strukturierung\n\n- Sichtung der Ausgangssituation und Einordnung der zentralen Herausforderungen\n- Abstimmung mit den relevanten Ansprechpartnern auf Kundenseite\n- Strukturierung der Anforderungen, Abhängigkeiten und Rahmenbedingungen\n- Ableitung eines umsetzbaren Vorgehensmodells\n\n### Phase 2: Konzeption und Umsetzungsvorbereitung\n\n- Konkretisierung der vereinbarten Arbeitspakete und Ergebnisse\n- Vorbereitung der fachlichen und organisatorischen Umsetzung\n- Abstimmung der Prioritäten und des weiteren Projektvorgehens\n- Dokumentation der Ergebnisse für die nächsten Projektphasen\n\n### Phase 3: Begleitung und Qualitätssicherung\n\n- Fachliche Begleitung der vereinbarten Maßnahmen\n- Regelmäßige Reviews und Abstimmungen mit dem Auftraggeber\n- Qualitätssicherung der Ergebnisse und Übergabe der Dokumentation\n- Sicherstellung des Wissenstransfers in die Organisation",
  leistungsausschluesse: "./.",
  line_items: [
    { description: "Analyse und Zielbildentwicklung", unit: "Tag(e)", rate: 1300, days: 4 },
    {
      description: "Fachliche Konzeption und Umsetzungsbegleitung",
      unit: "Tag(e)",
      rate: 1300,
      days: 8,
    },
  ],
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateGerman(d: Date): string {
  return `${d.getDate()}. ${MONTHS_DE[d.getMonth() + 1]} ${d.getFullYear()}`;
}

function computeValidityDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + VALIDITY_WEEKS * 7);
  return d;
}

function buildSalutation(gender: string, name: string): string {
  const lastName = name.trim().split(" ").at(-1) ?? name;
  const g = gender.toLowerCase();
  if (["herr", "m", "male", "männlich"].includes(g)) return `Sehr geehrter Herr ${escapeHtml(lastName)}`;
  if (["frau", "f", "female", "weiblich"].includes(g)) return `Sehr geehrte Frau ${escapeHtml(lastName)}`;
  return "Sehr geehrte Damen und Herren";
}

function fmtEur(amount: number): string {
  return `${amount.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} EUR`;
}

function renderMarkdown(md: string): string {
  if (!md) return "";
  const out: string[] = [];
  let inUl = false;
  for (const line of md.split("\n")) {
    const t = line.trimStart();
    if (t.startsWith("### ")) {
      if (inUl) { out.push("</ul>"); inUl = false; }
      out.push(`<h3 class="prev-h3">${escapeHtml(t.slice(4).trim())}</h3>`);
    } else if (t.startsWith("## ")) {
      if (inUl) { out.push("</ul>"); inUl = false; }
      out.push(`<h2 class="prev-h2">${escapeHtml(t.slice(3).trim())}</h2>`);
    } else if (t.startsWith("- ")) {
      if (!inUl) { out.push('<ul class="prev-ul">'); inUl = true; }
      out.push(`<li>${escapeHtml(t.slice(2).trim())}</li>`);
    } else if (t === "") {
      if (inUl) { out.push("</ul>"); inUl = false; }
    } else {
      if (inUl) { out.push("</ul>"); inUl = false; }
      out.push(`<p>${escapeHtml(t)}</p>`);
    }
  }
  if (inUl) out.push("</ul>");
  return out.join("");
}

function renderPlainParagraphs(text: string): string {
  if (!text) return "";
  return text
    .split(/\n\n+/)
    .map((p) => `<p>${escapeHtml(p.replace(/\n/g, " ").trim())}</p>`)
    .filter((p) => p !== "<p></p>")
    .join("");
}

// ─── Preview HTML builder ─────────────────────────────────────────────────────

function buildOfferPreviewHtml(draft: OfferDraft): string {
  const today = new Date();
  const validityDate = computeValidityDate();
  const todayGerman = formatDateGerman(today);
  const validityDateGerman = formatDateGerman(validityDate);
  const salutation = buildSalutation(
    draft.customer_primary_contact_gender,
    draft.customer_primary_contact_name,
  );

  let totalAmount = 0;
  const pricingRows = draft.line_items
    .map((item) => {
      const amount = item.rate * item.days;
      totalAmount += amount;
      return `<tr>
          <td>${escapeHtml(item.description)}</td>
          <td>${escapeHtml(item.unit)}</td>
          <td>${fmtEur(item.rate)}</td>
          <td>${item.days % 1 === 0 ? item.days : item.days.toFixed(1)}</td>
          <td>${fmtEur(amount)}</td>
        </tr>`;
    })
    .join("");

  const praembelHtml =
    PRAEMBEL_PARAGRAPHS.map((p) => `<p>${escapeHtml(p)}</p>`).join("") +
    `<p>Mehr Informationen zur Unternehmensgruppe finden Sie auf unserer Homepage: <a href="${escapeHtml(COMPANY.website)}">${escapeHtml(COMPANY.website.replace("https://", ""))}</a>.</p>`;

  const vertragsschlussHtml = `
    <p>Dieses Angebot ist freibleibend und gültig bis zum ${escapeHtml(validityDateGerman)}.</p>
    <p>Bitte senden Sie dieses Angebot bis zum oben genannten Termin unterschrieben oder eingescannt per E-Mail zurück:</p>
    <p>${escapeHtml(COMPANY.name)}, ${escapeHtml(COMPANY.address_line1)}, ${escapeHtml(COMPANY.address_line2)}<br>
       E-Mail: <a href="mailto:${escapeHtml(SENDER.email)}">${escapeHtml(SENDER.email)}</a></p>
    <p>Ein verbindlicher Vertragsabschluss kommt in jedem Fall erst mit der schriftlichen oder elektronischen Annahmeerklärung des unterzeichneten Angebots durch den Auftragnehmer zustande.</p>
    <p>Sollte eine Bestimmung des auf Basis dieses Angebots geschlossenen Vertrages unwirksam oder undurchführbar sein oder werden, bleibt der Vertrag im Übrigen wirksam. Die Parteien verpflichten sich, in einem solchen Fall eine Regelung zu vereinbaren, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung möglichst nahekommt.</p>
    <p>Mit seiner Unterschrift erklärt der Auftraggeber die Annahme der im Angebot aufgeführten Arbeitspakete sowie die Geltung der Allgemeinen Geschäftsbedingungen (AGB) der ${escapeHtml(COMPANY.name)} in der Fassung vom ${escapeHtml(COMPANY.agb_date)}.</p>
    <p>Die vollständigen AGB können Sie hier einsehen: <a href="${escapeHtml(COMPANY.agb_url)}">${escapeHtml(COMPANY.agb_url)}</a></p>`;

  return `
<div class="prev-cover">
  <div class="prev-recipient">
    <p><strong>${escapeHtml(draft.customer_company)}</strong></p>
    <p>${escapeHtml(draft.customer_primary_contact_name)}</p>
    <p>${escapeHtml(draft.customer_street)}</p>
    <p>${escapeHtml(draft.customer_postal)} ${escapeHtml(draft.customer_city)}</p>
  </div>
  <p class="prev-cover-date">Hamburg, den ${escapeHtml(todayGerman)}</p>
  <div class="prev-subject-wrap">
    <div class="prev-subject-title">${escapeHtml(draft.project_name)}</div>
  </div>
  <div class="prev-offer-nr">Angebot Nr. ${escapeHtml(draft.offer_number)}</div>
  <p class="prev-salutation">${salutation},</p>
  <div class="prev-cover-letter">
    ${draft.cover_paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
  </div>
  <p class="prev-closing">${escapeHtml(SENDER.closing)}</p>
  <div class="prev-signature-name">
    <p>${escapeHtml(SENDER.name)}</p>
    <p>${escapeHtml(SENDER.phone)}</p>
  </div>
</div>

<div class="prev-main">
  <h1 class="prev-h1">Angebot</h1>
  <div class="prev-between">zwischen</div>
  <div class="prev-party">
    <p>${escapeHtml(COMPANY.name)}</p>
    <p>${escapeHtml(COMPANY.address_line1)}</p>
    <p>${escapeHtml(COMPANY.address_line2)}</p>
  </div>
  <div class="prev-role">– Auftragnehmer –</div>
  <div class="prev-connector">und</div>
  <div class="prev-party">
    <p>${escapeHtml(draft.customer_company)}</p>
    <p>${escapeHtml(draft.customer_street)}</p>
    <p>${escapeHtml(draft.customer_postal)} ${escapeHtml(draft.customer_city)}</p>
  </div>
  <div class="prev-role">– Auftraggeber –</div>
  <p class="prev-neutrality">${escapeHtml(NEUTRALITY_NOTE)}</p>

  <div class="prev-section">
    <h2 class="prev-heading"><span class="prev-nr"></span><span>Präambel</span></h2>
    <div class="prev-copy">${praembelHtml}</div>
  </div>

  <div class="prev-section">
    <h2 class="prev-heading"><span class="prev-nr"></span><span>Kontaktperson</span></h2>
    <p class="prev-copy-intro">Die folgenden Kontaktdaten werden für dieses Angebot verwendet:</p>
    <div class="prev-contacts">
      <div class="prev-contact">
        <p class="prev-contact-title">Angefragt durch</p>
        <p>${escapeHtml(draft.customer_requester_name)}</p>
        ${draft.customer_requester_role ? `<p>${escapeHtml(draft.customer_requester_role)}</p>` : ""}
        ${draft.customer_requester_email ? `<p><a href="mailto:${escapeHtml(draft.customer_requester_email)}">${escapeHtml(draft.customer_requester_email)}</a></p>` : ""}
      </div>
      <div class="prev-contact">
        <p class="prev-contact-title">Ansprechpartner Auftraggeber</p>
        <p>${escapeHtml(draft.customer_primary_contact_name)}</p>
        ${draft.customer_primary_contact_phone ? `<p>Tel.: ${escapeHtml(draft.customer_primary_contact_phone)}</p>` : ""}
        ${draft.customer_primary_contact_email ? `<p><a href="mailto:${escapeHtml(draft.customer_primary_contact_email)}">${escapeHtml(draft.customer_primary_contact_email)}</a></p>` : ""}
      </div>
      <div class="prev-contact">
        <p class="prev-contact-title">Versand durch</p>
        <p>${escapeHtml(SENDER.name)}</p>
        <p>${escapeHtml(SENDER.title)}</p>
        <p>Tel.: ${escapeHtml(SENDER.phone)}</p>
        <p>Mail: <a href="mailto:${escapeHtml(SENDER.email)}">${escapeHtml(SENDER.email)}</a></p>
      </div>
    </div>
  </div>

  <div class="prev-section">
    <h2 class="prev-heading"><span class="prev-nr">0</span><span>Ausgangssituation</span></h2>
    <div class="prev-copy">${renderPlainParagraphs(draft.ausgangssituation)}</div>
  </div>

  <div class="prev-section">
    <h2 class="prev-heading"><span class="prev-nr">1</span><span>Unsere Einschätzung der Situation</span></h2>
    <table class="prev-table">
      <thead><tr><th>Problemstellung</th><th>Unsere Empfehlung</th></tr></thead>
      <tbody>
        ${draft.einschaetzung_rows
          .map((r) => `<tr><td>${escapeHtml(r.problem)}</td><td>${escapeHtml(r.empfehlung)}</td></tr>`)
          .join("")}
      </tbody>
    </table>
  </div>

  <div class="prev-section">
    <h2 class="prev-heading"><span class="prev-nr">2</span><span>Projektziele</span></h2>
    <p class="prev-copy-intro">Der Auftraggeber verfolgt mit der Beauftragung folgende Ziele:</p>
    <ul class="prev-ul prev-goals">
      ${draft.projektziele.map((z) => `<li>${escapeHtml(z)}</li>`).join("")}
    </ul>
  </div>

  <div class="prev-section">
    <h2 class="prev-heading"><span class="prev-nr">3</span><span>Leistungsbeschreibung</span></h2>
    <div class="prev-service">${renderMarkdown(draft.leistungsbeschreibung)}</div>
    <p><strong>Leistungsausschlüsse:</strong> ${escapeHtml(draft.leistungsausschluesse || "./.")}</p>
    <p><strong>Leistungsort:</strong> ${escapeHtml(LOCATION_TEXTS[draft.location_mode])}</p>
  </div>

  <div class="prev-section">
    <h2 class="prev-heading"><span class="prev-nr">4</span><span>Aufwand und Vergütung</span></h2>
    ${
      draft.line_items.length > 0
        ? `<table class="prev-table prev-pricing">
      <thead><tr><th>Leistung</th><th>Einheit</th><th>Tagessatz</th><th>Tage</th><th>Betrag</th></tr></thead>
      <tbody>
        ${pricingRows}
        <tr class="prev-total-row">
          <td><strong>Gesamt (netto)</strong></td><td></td><td></td><td></td>
          <td><strong>${fmtEur(totalAmount)}</strong></td>
        </tr>
      </tbody>
    </table>`
        : `<p>Der Aufwand und die Vergütung werden auf Basis der vereinbarten Konditionen abgerechnet.</p>`
    }
    <div class="prev-copy"><p>${escapeHtml(BILLING_TERMS)}</p></div>
  </div>

  <div class="prev-section">
    <h2 class="prev-heading"><span class="prev-nr">5</span><span>Vertragsschluss</span></h2>
    <div class="prev-copy prev-vertragsschluss">${vertragsschlussHtml}</div>
  </div>

  <div class="prev-sig-section">
    <table class="prev-sig-table">
      <tbody><tr>
        <td>
          <div class="prev-sig-title">Annahmeerklärung Auftragnehmer</div>
          <div class="prev-sig-meta"><span>${escapeHtml(COMPANY.city)}, den</span><span>Vor- &amp; Nachname</span></div>
          <div class="prev-sig-line"></div>
          <div class="prev-sig-labels"><span>Ort, Datum</span><span>Name in Druckbuchstaben</span><span>Unterschrift Auftragnehmer</span></div>
        </td>
        <td>
          <div class="prev-sig-title">Annahmeerklärung Auftraggeber</div>
          <div class="prev-sig-meta"><span>${escapeHtml(draft.customer_city)}, den</span><span>Vor- &amp; Nachname</span></div>
          <div class="prev-sig-line"></div>
          <div class="prev-sig-labels"><span>Ort, Datum</span><span>Name in Druckbuchstaben</span><span>Unterschrift Auftraggeber</span><span>Stempel</span></div>
        </td>
      </tr></tbody>
    </table>
  </div>
</div>`;
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [theme, setTheme] = React.useState<Theme>(() =>
    window.localStorage.getItem("angebot-ui-theme") === "light" ? "light" : "dark",
  );
  const [mode, setMode] = React.useState<WorkspaceMode>("chat");
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = React.useState(false);
  const [draft, setDraft] = React.useState<OfferDraft>(initialDraft);
  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("angebot-ui-theme", theme);
  }, [theme]);

  const previewHtml = React.useMemo(() => buildOfferPreviewHtml(draft), [draft]);

  // ── handlers ────────────────────────────────────────────────────────────────

  const handleField =
    (field: keyof OfferDraft) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setDraft((d) => ({ ...d, [field]: e.target.value }));

  const handleCoverParagraph =
    (i: number) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = [...draft.cover_paragraphs];
      next[i] = e.target.value;
      setDraft((d) => ({ ...d, cover_paragraphs: next }));
    };

  const handleEinschaetzung =
    (i: number, key: keyof EinschaetzungRow) =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      setDraft((d) => ({
        ...d,
        einschaetzung_rows: d.einschaetzung_rows.map((row, j) =>
          j === i ? { ...row, [key]: e.target.value } : row,
        ),
      }));

  const addEinschaetzungRow = () =>
    setDraft((d) => ({
      ...d,
      einschaetzung_rows: [...d.einschaetzung_rows, { problem: "", empfehlung: "" }],
    }));

  const removeEinschaetzungRow = (i: number) =>
    setDraft((d) => ({
      ...d,
      einschaetzung_rows: d.einschaetzung_rows.filter((_, j) => j !== i),
    }));

  const handleProjektziel =
    (i: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setDraft((d) => ({
        ...d,
        projektziele: d.projektziele.map((z, j) => (j === i ? e.target.value : z)),
      }));

  const addProjektziel = () =>
    setDraft((d) => ({ ...d, projektziele: [...d.projektziele, ""] }));

  const removeProjektziel = (i: number) =>
    setDraft((d) => ({ ...d, projektziele: d.projektziele.filter((_, j) => j !== i) }));

  const handleLineItem =
    (i: number, key: keyof LineItem) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val =
        key === "rate" || key === "days" ? parseFloat(e.target.value) || 0 : e.target.value;
      setDraft((d) => ({
        ...d,
        line_items: d.line_items.map((item, j) =>
          j === i ? { ...item, [key]: val } : item,
        ),
      }));
    };

  const addLineItem = () =>
    setDraft((d) => ({
      ...d,
      line_items: [...d.line_items, { description: "", unit: "Tag(e)", rate: 1300, days: 1 }],
    }));

  const removeLineItem = (i: number) =>
    setDraft((d) => ({ ...d, line_items: d.line_items.filter((_, j) => j !== i) }));

  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text: message };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.text })),
          draft,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { reply: string; updates?: Partial<OfferDraft> };
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", text: data.reply }]);

      if (data.updates && Object.keys(data.updates).length > 0) {
        setDraft((d) => ({ ...d, ...data.updates }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `Fehler beim Verarbeiten: ${msg}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      <div className="page-shell">
        <header className="brandbar">
          <div className="brandbar-inner">
            <div className="brand-left">
              <div className="brand-mark">
                <WandSparkles className="h-5 w-5 text-[var(--brand)]" />
              </div>
              <div className="min-w-0">
                <h1>Angebotserstellung</h1>
                <p className="brand-subline">Chat zuerst. Canvas danach. HTML und PDF als Zielpfad.</p>
              </div>
            </div>
            <div className="brand-right">
              <button
                type="button"
                className="theme-toggle"
                onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                role="switch"
                aria-checked={theme === "dark"}
                aria-label="Darstellung umschalten"
                title="Light/Dark Mode umschalten"
              >
                <span className="theme-toggle__track" aria-hidden="true">
                  <span className="theme-toggle__thumb" />
                </span>
              </button>
              <img className="brand-logo brand-logo--light" src={brandLogoLight} alt="accantec" />
              <img className="brand-logo brand-logo--dark" src={brandLogoDark} alt="accantec" />
            </div>
          </div>
        </header>

        <main className="page-content">
          <section className="assistant-card">
            <div className="assistant-card__header">
              <div>
                <p className="section-eyebrow">accantec workflow</p>
                <h2 className="section-title">
                  {mode === "chat" ? "Beschreibe einfach das Vorhaben" : "Überarbeite den Entwurf im Canvas"}
                </h2>
                <p className="section-copy">
                  {mode === "chat"
                    ? "Ich sammle die Eckdaten im Gespräch und führe daraus den ersten Angebotsentwurf zusammen."
                    : "Bearbeite Kundendaten, Inhalt und Preise – Präambel, Vertragsschluss und Firmendaten werden automatisch gesetzt."}
                </p>
              </div>
              <div className="status-chip">
                {isLoading ? (
                  <>
                    <span className="status-dot status-dot--live" />
                    Antwort wird vorbereitet
                  </>
                ) : (
                  <>
                    <MoonStar className="h-3.5 w-3.5" />
                    Workflow bereit
                  </>
                )}
              </div>
            </div>

            <div className="workspace-switch" role="tablist" aria-label="Arbeitsmodus">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "chat"}
                className={`workspace-switch__button ${mode === "chat" ? "is-active" : ""}`}
                onClick={() => setMode("chat")}
              >
                <MessageSquareText className="h-4 w-4" />
                Chat
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "canvas"}
                className={`workspace-switch__button ${mode === "canvas" ? "is-active" : ""}`}
                onClick={() => setMode("canvas")}
              >
                <LayoutPanelTop className="h-4 w-4" />
                Canvas
              </button>
            </div>

            {mode === "chat" ? (
              <div className="canvas-layout">
                {/* LEFT: Chat */}
                <div className="chat-column">
                  <div className="chat-surface">
                    {messages.map((msg) => (
                      <article
                        key={msg.id}
                        className={`message-row ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`message-bubble ${msg.role === "user" ? "message-bubble--user" : "message-bubble--assistant"}`}
                        >
                          <p>{msg.text}</p>
                        </div>
                      </article>
                    ))}
                    {isLoading && (
                      <div className="message-row justify-start">
                        <div className="message-bubble message-bubble--assistant">
                          <div className="typing-dots" aria-label="Antwort wird vorbereitet">
                            <span />
                            <span />
                            <span />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="prompt-dock">
                    <PromptInputBox
                      className="mx-auto w-full"
                      isLoading={isLoading}
                      onSend={handleSend}
                      placeholder="Zum Beispiel: Angebot für Azure-AI-Foundry-Einführung bei Bestandskunde Nord GmbH, Ansprechpartner Max Mustermann."
                    />
                  </div>
                </div>

                {/* RIGHT: Live document */}
                <section className="canvas-panel canvas-panel--preview">
                  <div className="canvas-panel__header">
                    <h3>Angebotsentwurf</h3>
                    <p>Wird live aktualisiert während du chattest.</p>
                  </div>
                  <article className="offer-preview">
                    <div
                      className="offer-preview__inner"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </article>
                </section>
              </div>
            ) : (
              <div className="canvas-layout">
                {/* ── LEFT: Editor ─────────────────────────────────────────── */}
                <section className="canvas-panel">
                  <div className="canvas-panel__header">
                    <h3>Inhalt bearbeiten</h3>
                    <p>Nur die Felder, die pro Angebot variieren. Präambel, Vertragsschluss und Firmendaten werden automatisch gesetzt.</p>
                  </div>

                  {/* 1 – Auftraggeberdaten */}
                  <details className="canvas-section" open>
                    <summary className="canvas-section__summary">
                      <span>Auftraggeberdaten</span>
                      <ChevronDown className="canvas-section__chevron h-4 w-4" />
                    </summary>
                    <div className="canvas-section__body">
                      <label className="canvas-field">
                        <span>Unternehmen</span>
                        <input value={draft.customer_company} onChange={handleField("customer_company")} />
                      </label>
                      <label className="canvas-field">
                        <span>Straße</span>
                        <input value={draft.customer_street} onChange={handleField("customer_street")} />
                      </label>
                      <div className="canvas-field-row">
                        <label className="canvas-field">
                          <span>PLZ</span>
                          <input value={draft.customer_postal} onChange={handleField("customer_postal")} />
                        </label>
                        <label className="canvas-field">
                          <span>Ort</span>
                          <input value={draft.customer_city} onChange={handleField("customer_city")} />
                        </label>
                      </div>

                      <div className="canvas-subsection-label">Ansprechpartner Auftraggeber</div>
                      <label className="canvas-field">
                        <span>Anrede</span>
                        <select
                          value={draft.customer_primary_contact_gender}
                          onChange={handleField("customer_primary_contact_gender")}
                        >
                          <option value="">Keine / Neutral</option>
                          <option value="Herr">Herr</option>
                          <option value="Frau">Frau</option>
                        </select>
                      </label>
                      <label className="canvas-field">
                        <span>Name</span>
                        <input
                          value={draft.customer_primary_contact_name}
                          onChange={handleField("customer_primary_contact_name")}
                        />
                      </label>
                      <label className="canvas-field">
                        <span>Telefon</span>
                        <input
                          value={draft.customer_primary_contact_phone}
                          onChange={handleField("customer_primary_contact_phone")}
                        />
                      </label>
                      <label className="canvas-field">
                        <span>E-Mail</span>
                        <input
                          type="email"
                          value={draft.customer_primary_contact_email}
                          onChange={handleField("customer_primary_contact_email")}
                        />
                      </label>

                      <div className="canvas-subsection-label">Anfragender</div>
                      <label className="canvas-field">
                        <span>Name</span>
                        <input
                          value={draft.customer_requester_name}
                          onChange={handleField("customer_requester_name")}
                        />
                      </label>
                      <label className="canvas-field">
                        <span>Rolle</span>
                        <input
                          value={draft.customer_requester_role}
                          onChange={handleField("customer_requester_role")}
                        />
                      </label>
                      <label className="canvas-field">
                        <span>E-Mail</span>
                        <input
                          type="email"
                          value={draft.customer_requester_email}
                          onChange={handleField("customer_requester_email")}
                        />
                      </label>
                    </div>
                  </details>

                  {/* 2 – Projektdaten */}
                  <details className="canvas-section" open>
                    <summary className="canvas-section__summary">
                      <span>Projektdaten</span>
                      <ChevronDown className="canvas-section__chevron h-4 w-4" />
                    </summary>
                    <div className="canvas-section__body">
                      <label className="canvas-field">
                        <span>Projektname</span>
                        <input value={draft.project_name} onChange={handleField("project_name")} />
                      </label>
                      <label className="canvas-field">
                        <span>Angebotsnummer</span>
                        <input value={draft.offer_number} onChange={handleField("offer_number")} />
                      </label>
                      <label className="canvas-field">
                        <span>Leistungsort</span>
                        <select
                          value={draft.location_mode}
                          onChange={handleField("location_mode")}
                        >
                          <option value="remote">Remote</option>
                          <option value="hybrid">Hybrid</option>
                          <option value="onsite">Vor Ort</option>
                        </select>
                      </label>
                    </div>
                  </details>

                  {/* 3 – Anschreiben */}
                  <details className="canvas-section">
                    <summary className="canvas-section__summary">
                      <span>Anschreiben</span>
                      <ChevronDown className="canvas-section__chevron h-4 w-4" />
                    </summary>
                    <div className="canvas-section__body">
                      {[0, 1, 2].map((i) => (
                        <label key={i} className="canvas-field">
                          <span>Absatz {i + 1}</span>
                          <textarea
                            rows={3}
                            value={draft.cover_paragraphs[i] ?? ""}
                            onChange={handleCoverParagraph(i)}
                          />
                        </label>
                      ))}
                    </div>
                  </details>

                  {/* 4 – Inhalt */}
                  <details className="canvas-section" open>
                    <summary className="canvas-section__summary">
                      <span>Inhalt</span>
                      <ChevronDown className="canvas-section__chevron h-4 w-4" />
                    </summary>
                    <div className="canvas-section__body">
                      <label className="canvas-field">
                        <span>Ausgangssituation</span>
                        <textarea
                          rows={5}
                          value={draft.ausgangssituation}
                          onChange={handleField("ausgangssituation")}
                        />
                      </label>

                      <div className="canvas-subsection-label">Einschätzung der Situation</div>
                      {draft.einschaetzung_rows.map((row, i) => (
                        <div key={i} className="canvas-dynamic-row">
                          <div className="canvas-dynamic-row__header">
                            <span className="canvas-dynamic-row__nr">Zeile {i + 1}</span>
                            <button
                              type="button"
                              className="canvas-remove-btn"
                              onClick={() => removeEinschaetzungRow(i)}
                              aria-label="Zeile entfernen"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <label className="canvas-field">
                            <span>Problemstellung</span>
                            <textarea
                              rows={2}
                              value={row.problem}
                              onChange={handleEinschaetzung(i, "problem")}
                            />
                          </label>
                          <label className="canvas-field">
                            <span>Empfehlung</span>
                            <textarea
                              rows={2}
                              value={row.empfehlung}
                              onChange={handleEinschaetzung(i, "empfehlung")}
                            />
                          </label>
                        </div>
                      ))}
                      <button type="button" className="canvas-add-btn" onClick={addEinschaetzungRow}>
                        <Plus className="h-3.5 w-3.5" />
                        Zeile hinzufügen
                      </button>

                      <div className="canvas-subsection-label">Projektziele</div>
                      {draft.projektziele.map((z, i) => (
                        <div key={i} className="canvas-goal-row">
                          <input
                            value={z}
                            onChange={handleProjektziel(i)}
                            placeholder={`Ziel ${i + 1}`}
                          />
                          <button
                            type="button"
                            className="canvas-remove-btn"
                            onClick={() => removeProjektziel(i)}
                            aria-label="Ziel entfernen"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button type="button" className="canvas-add-btn" onClick={addProjektziel}>
                        <Plus className="h-3.5 w-3.5" />
                        Ziel hinzufügen
                      </button>

                      <label className="canvas-field" style={{ marginTop: "14px" }}>
                        <span>Leistungsbeschreibung</span>
                        <span className="canvas-field__hint">Markdown: ### Phasenüberschrift, - Stichpunkt</span>
                        <textarea
                          rows={8}
                          value={draft.leistungsbeschreibung}
                          onChange={handleField("leistungsbeschreibung")}
                        />
                      </label>
                      <label className="canvas-field">
                        <span>Leistungsausschlüsse</span>
                        <input
                          value={draft.leistungsausschluesse}
                          onChange={handleField("leistungsausschluesse")}
                          placeholder="./."
                        />
                      </label>
                    </div>
                  </details>

                  {/* 5 – Preispositionen */}
                  <details className="canvas-section" open>
                    <summary className="canvas-section__summary">
                      <span>Preispositionen</span>
                      <ChevronDown className="canvas-section__chevron h-4 w-4" />
                    </summary>
                    <div className="canvas-section__body">
                      {draft.line_items.map((item, i) => (
                        <div key={i} className="canvas-lineitem">
                          <div className="canvas-lineitem__header">
                            <span className="canvas-dynamic-row__nr">Position {i + 1}</span>
                            <button
                              type="button"
                              className="canvas-remove-btn"
                              onClick={() => removeLineItem(i)}
                              aria-label="Position entfernen"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <label className="canvas-field">
                            <span>Leistungsbeschreibung</span>
                            <input
                              value={item.description}
                              onChange={handleLineItem(i, "description")}
                            />
                          </label>
                          <div className="canvas-field-row">
                            <label className="canvas-field">
                              <span>Tagessatz (EUR)</span>
                              <input
                                type="number"
                                min={0}
                                step={50}
                                value={item.rate}
                                onChange={handleLineItem(i, "rate")}
                              />
                            </label>
                            <label className="canvas-field">
                              <span>Tage</span>
                              <input
                                type="number"
                                min={0}
                                step={0.5}
                                value={item.days}
                                onChange={handleLineItem(i, "days")}
                              />
                            </label>
                          </div>
                          <div className="canvas-lineitem__amount">
                            Betrag: <strong>{fmtEur(item.rate * item.days)}</strong>
                          </div>
                        </div>
                      ))}
                      {draft.line_items.length > 0 && (
                        <div className="canvas-lineitem__total">
                          Gesamt (netto):{" "}
                          <strong>
                            {fmtEur(draft.line_items.reduce((s, i) => s + i.rate * i.days, 0))}
                          </strong>
                        </div>
                      )}
                      <button type="button" className="canvas-add-btn" onClick={addLineItem}>
                        <Plus className="h-3.5 w-3.5" />
                        Position hinzufügen
                      </button>
                    </div>
                  </details>
                </section>

                {/* ── RIGHT: Preview ──────────────────────────────────────── */}
                <section className="canvas-panel canvas-panel--preview">
                  <div className="canvas-panel__header">
                    <h3>Live-Vorschau</h3>
                    <p>HTML ist die visuelle Wahrheit, PDF das finale Artefakt.</p>
                  </div>
                  <div className="offer-actions">
                    <button
                      type="button"
                      className="offer-action offer-action--primary"
                      disabled
                      title="Export-Anbindung noch nicht verfügbar"
                    >
                      <FileOutput className="h-4 w-4" />
                      HTML erzeugen
                    </button>
                    <button
                      type="button"
                      className="offer-action"
                      disabled
                      title="Export-Anbindung noch nicht verfügbar"
                    >
                      PDF erzeugen
                    </button>
                  </div>
                  <article className="offer-preview">
                    <div
                      className="offer-preview__inner"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </article>
                </section>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
