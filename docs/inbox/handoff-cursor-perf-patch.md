# Handoff → Cursor Grok 4.5 (paste this whole file as the task prompt)

You are Grok 4.5. Read `docs/ai-team/teams/cursor/start-here.md`, mark yourself
ACTIVE in `artifacts/agent_ledger.json`, pull main into the `cursor` branch.

TASK — the "Tiny perf / usage safety patch" at the top of `FINISH_PLAN.md` Open
next (fully specced there; Opus-verified against code — trust the ticket over
the original ChatGPT review):

1. Tighten `receptionistCall.js` — one fallback model max, `max_tokens` ~120,
   temperature ~0.6, surface reply source + last error in the phone UI (the
   Settings "live" badge currently lies when calls silently fail).
2. `BedroomSlice.jsx` `now` clock: 1s → per-minute tick (neither clock displays
   seconds; the 1s tick re-renders the whole monolith). Leave `DeskScreen`'s
   `deskNow` alone.
3. Delete the inert July-10 test-call block (`BedroomSlice.jsx` ~2475–2490) —
   date-gated to 2026-07-10, already dead.

Acceptance criteria are in the ticket. Do NOT touch the watchlist items (audio
front-load, radio preload, 40ms phone pulse, CSS animations). Composer may take
items 2–3; you review. Runs parallel-safe with Codex's P1b2 work (different
files). Close out per `docs/ai-team/end-here.md`.
