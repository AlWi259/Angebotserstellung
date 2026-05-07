import {
  ChevronDown,
  Download,
  FileCode2,
  FileText,
  LayoutPanelTop,
  MessageSquareText,
  Plus,
  RefreshCw,
  Trash2,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtEur(amount: number): string {
  return `${amount.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} EUR`;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "Beschreibe mir einfach in ein paar Sätzen Kunde, Vorhaben, gewünschten Leistungsumfang und falls vorhanden die Angebotsnummer. Ich führe dich dann Schritt für Schritt durch den Angebotsentwurf.",
  },
];

const initialDraft: OfferDraft = {
  offer_number: "",
  project_name: "",
  location_mode: "remote",
  customer_company: "",
  customer_street: "",
  customer_postal: "",
  customer_city: "",
  customer_primary_contact_gender: "",
  customer_primary_contact_name: "",
  customer_primary_contact_phone: "",
  customer_primary_contact_email: "",
  customer_requester_name: "",
  customer_requester_role: "",
  customer_requester_email: "",
  cover_paragraphs: ["", "", ""],
  ausgangssituation: "",
  einschaetzung_rows: [],
  projektziele: [],
  leistungsbeschreibung: "",
  leistungsausschluesse: "./.",
  line_items: [],
};

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [theme, setTheme] = React.useState<Theme>(() =>
    window.localStorage.getItem("angebot-ui-theme") === "light" ? "light" : "dark",
  );
  const [mode, setMode] = React.useState<WorkspaceMode>("chat");
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isGeneratingNumber, setIsGeneratingNumber] = React.useState(false);
  const [draft, setDraft] = React.useState<OfferDraft>(initialDraft);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("angebot-ui-theme", theme);
  }, [theme]);

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

  const handleGenerateNumber = async () => {
    if (isGeneratingNumber) return;
    setIsGeneratingNumber(true);
    try {
      const res = await fetch("/api/offer-number/next", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { angebotsnummer: string };
      setDraft((d) => ({ ...d, offer_number: data.angebotsnummer }));
    } catch (err) {
      alert(`Angebotsnummer konnte nicht erzeugt werden: ${err instanceof Error ? err.message : err}`);
    } finally {
      setIsGeneratingNumber(false);
    }
  };

  const handleExport = async (format: "markdown" | "html" | "pdf") => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const validity = new Date();
      validity.setDate(validity.getDate() + 42);
      const validityDate = validity.toISOString().split("T")[0];
      const offerNumber = draft.offer_number.trim() || "001";

      const aiPayload = JSON.stringify({
        cover_paragraphs: draft.cover_paragraphs.filter(Boolean),
        ausgangssituation: draft.ausgangssituation || ".",
        einschaetzung_rows: draft.einschaetzung_rows,
        projektziele: draft.projektziele,
        leistungsbeschreibung: draft.leistungsbeschreibung || ".",
      });

      const formData = {
        offer_number: offerNumber,
        validity_date: validityDate,
        customer_company: draft.customer_company || ".",
        customer_street: draft.customer_street || ".",
        customer_postal: draft.customer_postal || ".",
        customer_city: draft.customer_city || ".",
        customer_country: "Deutschland",
        customer_requester_name: draft.customer_requester_name || ".",
        customer_requester_email: draft.customer_requester_email || ".",
        customer_requester_role: draft.customer_requester_role,
        customer_primary_contact_gender: draft.customer_primary_contact_gender,
        customer_primary_contact_name: draft.customer_primary_contact_name || ".",
        customer_primary_contact_email: draft.customer_primary_contact_email || ".",
        customer_primary_contact_phone: draft.customer_primary_contact_phone,
        project_name: draft.project_name || ".",
        project_context: draft.ausgangssituation || draft.leistungsbeschreibung || ".",
        location_mode: draft.location_mode,
        line_items: draft.line_items,
        leistungsausschluesse: draft.leistungsausschluesse,
      };

      // Step 1: generate markdown
      const mdRes = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "markdown",
          offer_number: offerNumber,
          form_data: formData,
          ai_response: aiPayload,
        }),
      });
      if (!mdRes.ok) {
        const err = await mdRes.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `HTTP ${mdRes.status}`);
      }
      const mdData = (await mdRes.json()) as { markdown: string; offer_number: string };

      // Step 2: download in requested format
      const exportMode = format === "markdown" ? "markdown_download" : format;
      const ext = format === "markdown" ? "md" : format;
      const exportRes = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: exportMode,
          offer_number: mdData.offer_number,
          markdown: mdData.markdown,
        }),
      });
      if (!exportRes.ok) {
        const err = await exportRes.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `HTTP ${exportRes.status}`);
      }

      const blob = await exportRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Angebot_${mdData.offer_number}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      alert(`Export fehlgeschlagen: ${msg}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSend = async (message: string, _files?: File[]) => {
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
        { id: crypto.randomUUID(), role: "assistant", text: `Fehler: ${msg}` },
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
              <div className="min-w-0">
                <h1>Angebotserstellung</h1>
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
            {mode === "chat" ? (
              <div className="single-col">
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
                    placeholder="Beschreibe Kunde, Vorhaben und Leistungsumfang – oder lade eine Datei hoch."
                  />
                </div>
              </div>
            ) : (
              <div className="single-col">
                <section className="canvas-panel">
                  <div className="canvas-panel__header">
                    <div className="canvas-panel__header-top">
                      <h3>Inhalt bearbeiten</h3>
                      <div className="canvas-export-actions">
                        <button
                          type="button"
                          className="canvas-export-btn"
                          onClick={handleGenerateNumber}
                          disabled={isGeneratingNumber}
                          title="Nächste Angebotsnummer aus Supabase holen"
                        >
                          <RefreshCw className={`h-4 w-4 ${isGeneratingNumber ? "animate-spin" : ""}`} />
                          Nr.
                        </button>
                        <button
                          type="button"
                          className="canvas-export-btn"
                          onClick={() => handleExport("markdown")}
                          disabled={isExporting}
                          title="Als Markdown herunterladen"
                        >
                          <FileText className="h-4 w-4" />
                          MD
                        </button>
                        <button
                          type="button"
                          className="canvas-export-btn"
                          onClick={() => handleExport("html")}
                          disabled={isExporting}
                          title="Als HTML herunterladen"
                        >
                          <FileCode2 className="h-4 w-4" />
                          HTML
                        </button>
                        <button
                          type="button"
                          className="canvas-export-btn canvas-export-btn--primary"
                          onClick={() => handleExport("pdf")}
                          disabled={isExporting}
                          title="Als PDF herunterladen"
                        >
                          <Download className="h-4 w-4" />
                          {isExporting ? "…" : "PDF"}
                        </button>
                      </div>
                    </div>
                    <p>Nur die Felder, die pro Angebot variieren. Präambel, Vertragsschluss und Firmendaten werden automatisch gesetzt.</p>
                  </div>

                  {/* Auftraggeberdaten */}
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

                  {/* Projektdaten */}
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
                        <select value={draft.location_mode} onChange={handleField("location_mode")}>
                          <option value="remote">Remote</option>
                          <option value="hybrid">Hybrid</option>
                          <option value="onsite">Vor Ort</option>
                        </select>
                      </label>
                    </div>
                  </details>

                  {/* Anschreiben */}
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

                  {/* Inhalt */}
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

                  {/* Preispositionen */}
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
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
