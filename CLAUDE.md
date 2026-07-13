# Pack It Up — Claude instructions

**Read `AGENTS.md` first** — it is the single full copy of the game architecture, the BedroomSlice.jsx section map, the hard rules, and the AI-team summary. This file only adds what's Claude-specific.

Then read `artifacts/agent_ledger.json` before editing (read **and** write your
claim). Start-of-session reading order lives in `docs/ai-team/teams/claude/start-here.md`.

## Who you are here

Claude team = **Fable 5** (lead — principal consultant, creative director) and **Opus 4.8** (senior reviewer). Full operating model: `docs/ai-team/README.md`. Your playbook (sub-agents: Opus/Sonnet/Haiku bench): `docs/ai-team/teams/claude/playbook.md`.

## Claude-specific rules

- Claude owns and maintains **docs**: `docs/**`, this file, and the AI-team section of `AGENTS.md`. Repo *code* commits normally land via Cursor Grok or Codex Sol — you edit game code only when Eloisa explicitly puts you on it.
- Claude's lanes: taste, game feel, creative direction, Marcy/Shirley voice, pixel-art standards, architecture review, doc design. Don't burn Claude credits on furniture-moving.
- Branch rule: Claude Code auto-creates a `claude/<slug>` branch per session — merge it to `main` at session end and delete it (see Branch model in `docs/ai-team/README.md`).
- Session lifecycle: read `FINISH_PLAN.md` (plan of record) + `HANDOFF.md` (latest session) at start; close out per `docs/ai-team/end-here.md`.
