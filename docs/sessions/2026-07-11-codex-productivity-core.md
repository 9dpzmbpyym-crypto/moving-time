# Productivity core data layer — session summary
**Date:** 2026-07-11
**Harness / model:** [Codex / GPT-5.6 Sol]
**Branch:** `codex` (merged to main: yes)

### Done
- Replaced fictional task samples with 49 real move, housing, job, admin, health, and Stretchy-chain tasks; all carry effort and normalized due metadata.
- Added `movePhase.js`: pure phase/trigger data plus deterministic date helpers.
- Replaced backlog-volume pressure with due/overdue weighted Pressure v2 and added cat-only `stretchyStress`.
- Bumped saves to v2 with migration that preserves furniture/content progress and saved task status instead of wiping on schema mismatch.
- Verified fixed-date pressure behavior, representative v1 migration, TypeScript, and production Vite build.

### Still broken / unfinished (do next)
- After Cursor lands shared-file edits, wire `stretchyStress` into Stretchy hearts/mood/glow/`!`; stressed/desperate audio remains Cursor's later ticket.
- Surface housing in Desk/ledger UI; build the plain ledger page and quick-add sticky note.
- Fumes-day pressure suppression waits for the energy check-in system.

### Do not
- Do not restore sum-of-urgency pressure or schema-mismatch save wiping.
- Do not hand-duplicate calendar dates outside `movePhase.js`.
- Do not edit `BedroomSlice.jsx` or `Screens.jsx` over Cursor's active work.

### Quick verify
Run the project typecheck/build, then load a v1 save fixture and confirm it becomes v2 while retaining a completed task and packed object.

### Suggested next-session order
1. Reconcile Cursor's shared-file commit.
2. Wire Stretchy/housing consumers.
3. Add ledger + quick-add, verify on phone, then finish P1b2 closeout.
