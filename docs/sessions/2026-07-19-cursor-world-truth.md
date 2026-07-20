# World-truth code pass — session summary
**Date:** 2026-07-19
**Harness / model:** [Cursor / Grok 4.5]
**Branch:** cursor (merged to main: yes)

### Done
- **manual-Done sticks:** hand Done on world-bound cards sets `manualDone: true`; `reconcileTasksFromWorldState` no longer silently reopens those. Auto-complete + undo-reopen for world completions unchanged. Covered in `tests/task-bindings.test.mjs` (stub-loader, plain Node).
- **Set-dressing:** plants / sill bottles / wastebasket / side-cabinet out of packable catalog; `removable: false` in rooms (art stays; side-cabinet contents still open). Non-removable objects always drawn even if an old save had them packed.
- **Roku TV split:** new `living:tv` ($100, selectable/sellable); TV screen removed from `tv_hutch` draw; `f_buyer_tv` / `f_remove_tv` bound for fresh installs; layout.json position.
- **Personal laptop:** `office:desk_hutch:personal_laptop` with `carryOn: true` (reuses work-laptop PNG); Pack → “Carry-on”; Sell/Donate hidden/guarded.
- Windows CRLF fix for binding stub tests so they run under plain Node.

### Still broken / unfinished (do next)
- Fable’s **save patch** (bindings + world-state truth-ups for Eloisa’s live device) — code-only this session; do not invent that data here.
- TV niche placement may need a one-nudge in `/?edit=1` after visual check.
- Shirley stall → hang-up · Stretchy meows · bank-path `applyBookResult` skip (prior Open next).

### Do not
- Do not edit Eloisa’s save / Import blob from this ticket — Fable owns that patch.
- Do not re-add plants as packables; they are intentional set dressing.

### Quick verify
1. Hard-refresh localhost (or deploy) → Living: Roku TV selectable separate from hutch; hutch niche empty when TV sold.
2. Office desk hutch → Personal Laptop → **Carry-on** only (no Sell/Donate).
3. Mark a world-bound card Done by hand while world unsatisfied → stays Done after room change / reload.

### Suggested next-session order
1. Fable save patch import (Eloisa pastes)
2. Visual nudge TV if needed
3. Shirley stall hang-up / Stretchy meows
