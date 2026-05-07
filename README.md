# Angebotserstellung

Lokales Tool der accantec information solutions GmbH zur Erstellung formatierter Angebots-PDFs.
Das Repo befindet sich in der Umstellung von einem formularlastigen MVP auf einen chat-first Angebotsworkflow.

## Aktueller Fokus

- simples, modernes Frontend mit einem zentralen Chat-Eingabefeld
- React-, TypeScript- und Tailwind-Quellcode in `web/`
- Build-Ausgabe nach `frontend/` fuer das bestehende FastAPI-Serving
- Wiederverwendung der bestehenden Markdown- und PDF-Erzeugung

## Vorschau

### Live-Frontend waehrend der Entwicklung

```bash
cd web
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

Dann im Browser öffnen:

```text
http://127.0.0.1:4173/static/
```

### Build fuer das Python-Backend

```bash
cd web
npm run build
```

## Quick Start

### Voraussetzungen

- Python 3.11+
- WeasyPrint-Systemabhängigkeiten

```bash
# macOS
brew install cairo pango gdk-pixbuf libffi

# Ubuntu / Debian
sudo apt install libcairo2-dev libpango1.0-dev libgdk-pixbuf2.0-dev
```

### Installation

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Persönliches Profil pflegen

```bash
cp config/user_profile.example.yaml config/user_profile.yaml
```

Danach die Werte in `config/user_profile.yaml` anpassen:

- `name`
- `title`
- `email`
- `phone`
- `company_name`
- `signature_name`
- `signature_title`
- `closing`

### Backend starten

```bash
python3 -m uvicorn backend.main:app --reload --port 8000
```

Dann im Browser öffnen:

```text
http://localhost:8000
```

## Bisheriger MVP-Workflow

### 1. Angebotsnummer

Die Angebotsnummer wird **manuell** aus der SharePoint-Excel übernommen.
Im MVP gibt es bewusst keine technische SharePoint-Anbindung.

### 2. Prompt erzeugen

Nach dem Ausfüllen der Pflichtfelder erzeugt die App einen fertigen Prompt und speichert ihn zusätzlich unter:

```text
output/prompts/<angebotsnummer>.md
```

### 3. Externe KI nutzen

Den Prompt in Claude Code oder Codex CLI verwenden und die JSON-Antwort zurück in die App kopieren.
Wenn keine KI genutzt wird, kann trotzdem Markdown erzeugt werden. Dann werden Standard-Platzhaltertexte für die variablen Projektabschnitte eingesetzt.

### 4. PDF erzeugen

Die App erzeugt erst das finale Markdown und daraus dann das PDF.
Artefakte werden lokal unter `output/offers/<angebotsnummer>/` abgelegt.

## API

| Methode | Pfad | Zweck |
|---------|------|-------|
| `GET` | `/api/profile` | Lädt und validiert `config/user_profile.yaml` |
| `POST` | `/api/prompt` | Erzeugt den externen Prompt |
| `POST` | `/api/render` | Erzeugt Markdown oder PDF |

`/api/render` arbeitet in zwei Modi:

- `mode=markdown`: Formulardaten + optionale KI-Antwort rein, finales Angebots-Markdown zurück
- `mode=pdf`: Vorhandenes Markdown rein, PDF zurück

## Wichtige Dateien

- `config/company.yaml`: feste Unternehmens- und Standardtexte
- `config/user_profile.yaml`: persönliches Absenderprofil
- `backend/main.py`: schlanke lokale FastAPI-App
- `backend/generator.py`: Prompt- und Markdown-Generierung
- `web/`: React-/TypeScript-/Tailwind-Quellcode für das neue Frontend
- `frontend/`: gebautes Frontend für FastAPI
- `templates/` und `styles/`: bestehendes Angebotslayout
- `docs/`: Agenten-, Governance- und Architekturkontext

## Repo-Aufräumen

Frühere Produktions-/Infra-Artefakte wurden nach `archive/non-mvp/` verschoben, damit das aktive Repo auf den lokalen MVP fokussiert bleibt.

## Tests

```bash
pytest -q
```
