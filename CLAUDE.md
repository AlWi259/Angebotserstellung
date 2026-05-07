# CLAUDE.md

This file is the Claude Code wrapper for this repository.
Read `AGENTS.md` first.

## Claude Code Startup Order

1. Read `AGENTS.md`
2. Read `CLAUDE.md`
3. Use `.claude/agents/`, `.claude/skills/` and `docs/` as needed

## Claude-Specific Delta

- Keep outputs concise and restart-friendly.
- Prefer repo files over long chat-only state.
- Use `.claude/agents/` for bounded parallel work only.
- Put Claude-only rules here, not in `AGENTS.md`.
