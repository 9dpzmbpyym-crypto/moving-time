# Shirley OpenRouter 429 — session summary
**Date:** 2026-07-14
**Harness / model:** [Cursor / Grok 4.5]
**Branch:** cursor (merged to main: yes)

### Done
- Diagnosed “key still fails after Test ✓” on Vercel: not auth — free-model **http_429** (Meta/Llama pool). Screenshot showed raw provider JSON under `script bank · http_429`.
- Default model → `openrouter/free`; on 429/5xx rotate through other free providers (capped at 3).
- Auto-migrate stale congested defaults (`deepseek…`, `llama-3.3…`).
- Settings: Test key saves then verifies *saved* key; fingerprint + origin note; cleaner phone error labels (401/402/429/timeout).

### Still broken / unfinished (do next)
- Free tier can still 429 when every pool is busy — wait or use a paid slug.
- Shirley stall → hang-up cadence still open in FINISH_PLAN.
- Stretchy stressed/desperate meows still unwired.

### Do not
- Do not treat 429 as a bad API key.
- Do not assume localhost and Vercel share `pack-it-up-shirley` localStorage.

### Quick verify
1. Hard-refresh https://moving-time.vercel.app
2. Settings → model `openrouter/free` (or leave blank to migrate) → Test key ✓
3. Desk → call Shirley → status should show `live · OpenRouter` (or a clean “free model busy (429)” line, not raw JSON)

### Suggested next-session order
1. Shirley stall → hang-up
2. Stretchy meow tiers
3. Whatever Eloisa queues from Open next
