# Inbox — drop zone

**Eloisa drops files here; Claude (Fable) reviews, renames to convention, and moves them to their real home.** Nothing in this folder is canon — agents should not treat inbox contents as decided until they've been triaged out.

How to use (from the GitHub app/site): navigate to `docs/inbox/` → **Add file → Upload files** → commit straight to `main`. Raw filenames are fine *here* — naming gets fixed during triage.

Typical destinations after review:
- Game design docs / NPC guides / voice material → `artifacts/pack-it-up/docs/`
- Plan-of-record changes → folded into `FINISH_PLAN.md`
- Team/process docs → `docs/ai-team/`
- Audio/art assets → `artifacts/pack-it-up/public/assets/` (per the naming rules there)

After triage the inbox copy is deleted — an empty inbox means nothing is waiting.

## Triage status (Jul 13, 2026) — everything below is DONE, kept for reference only

None of the current inbox files are pending. They were implemented but never
deleted; treat them as **historical context, not current spec** (the systems
below have shipped and several were reworked afterward):

| File | Status |
|------|--------|
| `chatgpt-productivity-structure-for-claude-7-11.md` | **IMPLEMENTED then REWORKED** — the scheduler/prioritization spec. Codex built it; the daily-deal model + `urgencyScore`/`taskPressure` were later reworked (see `schedule.js` + the Jul 13 priority fixes). Do not read as the current scoring. |
| `chatgpt-pressure-calls-overdue-ui-suggestions-7-11.md` | **PARTIALLY implemented / SUPERSEDED** — pressure + overdue UI landed; the pressure meter has since been re-derived from the deadline state machine. |
| `chat-gpt-connecting-tasks-to-gameplay-suggestions.md` | **IMPLEMENTED** — task↔gameplay bindings live in `taskBindings.js` / `tasks.js` bindings + the packing/sell/appointment wiring. |
| `Chatgpt-perf-usage-review-recs.md` | **IMPLEMENTED** — the perf/usage safety patch landed (Shirley API tightening, clock churn, dead code). |
| `handoff-codex-scheduler.md` · `handoff-codex-productivity-core.md` · `handoff-cursor-perf-patch.md` · `handoff-grok-scheduler.md` | **COMPLETED** — one-shot paste-ready session prompts; those sessions shipped. |

Cleanup note: these can be deleted once `FINISH_PLAN.md` / `docs/design/scheduler-adoption.md` stop referencing them by path.
