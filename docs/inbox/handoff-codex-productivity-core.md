# Handoff → Codex Sol (paste this whole file as the task prompt)

You are Codex Sol. Read `docs/ai-team/teams/codex/start-here.md` and mark yourself
ACTIVE in `artifacts/agent_ledger.json` first. Pull main into the `codex` branch.

TASK — productivity core, jumped ahead of Shirley Pass 1 (Eloisa needs it live
this week; sublet locks Jul 15). Everything is pre-designed — implement, don't
redesign. Read first: `FINISH_PLAN.md` "P1b2" + `docs/design/master-list-incorporation.md`
+ `docs/design/move-spine-integration.md` (v2 + "Pressure v2" + "Functional-companion
gaps" sections).

Ordered deliverables (stop cleanly wherever confidence runs out; data layer first):

1. Seed data drop: transcribe the seed-task manifest into `tasks.js` exactly as
   specced (new `housing` category; replace all 3 fictional SAMPLE_JOBS with the
   real shortlist; fix `t_vet` due to Jul 22–25; `effort` field 1|2|3 on all tasks).
2. Calendar spine: new `movePhase.js` — PHASES table + date triggers +
   `currentPhase(date)` / `dueTriggers(date)`. Pure data, no state, no screen.
3. Pressure v2 per the design section: `taskPressure` counts overdue/due-≤48h
   (critical-path ×2) via the spine, NOT total urgency. Add decoupled
   `stretchyStress` (0–2, reads only the cat chain + U-Box week). Consumers unchanged.
4. `save.js`: migrate-don't-wipe — schema bumps must carry task status forward.
   Phone is the canonical save device; deploys must never wipe it.
5. If capacity remains: ledger page (plain scrollable see-all per lane —
   simple list, `Screens.jsx`) + quick-add (text + lane + effort → normal task;
   a sticky note, not a form).

Hard rules: game code in existing files only (`movePhase.js` allowed — it's the
one new module the design authorizes). No new deps. Do NOT ship item 1 without
item 3 in the same change (old pressure meter pins at max with real data).
Close out per `docs/ai-team/end-here.md`.
