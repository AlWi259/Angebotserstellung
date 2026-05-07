# AGENTS.md

Repository guidance for coding agents working in `Angebotserstellung`.

## Startup

- All coding agents read `AGENTS.md` first.
- Claude Code then reads `CLAUDE.md`.
- Codex then reads `CODEX.md`.

## Repo Context

- Repo name: `Angebotserstellung`
- Repo type: `Produkt- und Workflow-Repo`
- Main stack: `FastAPI, Python, React, TypeScript, Tailwind, Markdown, WeasyPrint`
- Primary language: `Deutsch`
- Data class default: `CONFIDENTIAL`
- Privacy default: `Kunden-, Angebots-, Preis- und Personendaten nur lokal oder in freigegebenen Enterprise-Umgebungen verarbeiten.`

## Shared Operating Model

- `AGENTS.md` is the shared source of truth.
- `CLAUDE.md` and `CODEX.md` are thin tool wrappers.
- Durable work belongs in repo files, not chat memory only.
- Use `plans/` for execution plans, `specs/` for implementation specs, `reviews/` for review artifacts and `tasks/` for bounded handoffs.

## Product Focus

- The target experience is a simple chat-first offer workflow.
- The frontend should stay visually calm, modern and company-aligned.
- The backend should stay operationally simple and reuse the proven Markdown/PDF pipeline where possible.
- Prefer incremental migration over large rewrites that break rendering.

## Quality Gates

- Classify data before using AI or external tools.
- Prefer one primary user action per screen.
- Reuse existing offer rendering and template assets before inventing new output paths.
- Use a reviewer role for risky refactors, pricing logic, rendering output and governance text.
- Validate frontend with a running preview whenever meaningful UI changes are made.

## Working Rules

- Do not commit secrets, customer documents, generated PDFs or raw prompt logs with sensitive data.
- Keep React UI code in `web/`.
- Build output is generated into `frontend/` for FastAPI serving.
- Keep backend orchestration in `backend/`.
- Treat `templates/`, `styles/` and `assets/` as production-critical output assets.
