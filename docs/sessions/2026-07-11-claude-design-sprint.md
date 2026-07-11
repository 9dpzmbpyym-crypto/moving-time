# Design sprint: move-spine integration, plan fold, onboarding — session summary
**Date:** 2026-07-11
**Harness / model:** [Claude / Fable 5 · Opus 4.8 via /model mid-session · Sonnet 5 + Opus sub-agents]
**Branch:** `claude/team-onboarding-b0c4c9` (merged to main: yes)

### Done
- **ChatGPT reviews folded into FINISH_PLAN, code-verified first** (Opus pass): perf ticket corrected — Shirley's 4-fallback×25s chain is the only real usage risk; the "live" badge lies on silent failures (explains Eloisa's zero-dashboard report); July-10 test block is date-gated inert, not active churn; the 1s clock re-renders the whole monolith while neither clock shows seconds. Alignment review's 9 items landed as tickets (Sonnet audit confirmed none secretly built; lifecycle = *extend* existing 4-state model + appt FSM).
- **`docs/ai-team/teams/claude/start-here.md` written** (Opus fact-checked: SHIP) — onboarding set now complete across all three agentic harnesses.
- **Design layer for the move-spine, five docs/sections** (`docs/design/move-spine-integration.md` + `master-list-incorporation.md`): morning-dispatch thesis; energy check-in (Fumes/Steady/Full tank → effort budget, critical-path-first); ledger page-flip see-all; pinned goal chips; reminder ruling (.ics first); seed-task manifest (~35 missing master-plan items curated per lane; SAMPLE_JOBS are fictional — replace with real shortlist); NPC casting (Shirley data-only, Sal packing/U-Box, Vivian jobs, sublet+admin deliberately voiceless); **calendar spine** = the one new structure (pure-data phase/trigger module); kitchen wall-calendar prop (Stretchy pin-up, X'd-off days); **Pressure v2** (loudness not volume — old sum-of-urgency would pin at max after the data drop; Stretchy stress decoupled to HIS travel chain; meow tiers; Fumes-day quiet rule); functional-companion gaps (2-tap reality contract, quick-add, phone=canon + migrate-never-wipe, arrival ending SOFT).
- **Sequencing decided (Eloisa):** data drop + ledger + quick-add **jump ahead of Shirley Pass 1** (sublet locks Jul 15). Handoff prompts written and delivered in-chat for Codex (productivity core) and Cursor (perf patch, parallel-safe).
- **Interim reminder system live:** send_later triggers → this session → PushNotification to Eloisa's phone (2pm sublet / 5:30 box / 8:30 wrap today). Dies when the app's .ics export ships.
- **Nag mandate written into `AGENTS.md`** (Eloisa-ordered): all agents assertively redirect her to critical-path move tasks when game dev is eating move time.
- Housekeeping: doubled `docs/inbox/docs/inbox/` path flattened; ledger usage.claude corrected from stale PAUSED.

### Still broken / unfinished (do next)
1. **[eloisa] Paste the two handoff prompts** — Codex: seed data + calendar spine + Pressure v2 + save migration + ledger/quick-add; Cursor: perf patch. Parallel-safe.
2. Board skeleton (P1c) after the data layer lands.
3. Body Board plate asset ask (board mockup) — ChatGPT generates, Fable reviews.
4. Glow-rect judging still pending screenshots (Fable judges / Grok edits).
5. Branch hygiene still on Eloisa (GitHub UI deletions listed in FINISH_PLAN).

### Do not
- Seed the data drop without Pressure v2 in the same change — the old meter pins at 3 forever and the cat turns permanently guilty.
- Wipe save data on schema bump ever again after the drop (phone = canonical device).
- Start Sal/Vivian/board before the data layer exists.

### Quick verify
`docs/design/` has `move-spine-integration.md` + `master-list-incorporation.md`; FINISH_PLAN P1b2 says DECIDED/jump-the-queue; AGENTS.md ends its AI-team section with "The nag mandate."
