# Handoff → Cursor Grok (paste this whole file as the task prompt)

You are Cursor Grok. Pull `main` into the `cursor` branch first; never work on
`main`. Mark yourself ACTIVE in `artifacts/agent_ledger.json` (lock the files
below). Fable authored this ticket; the full reasoning lives in
**`docs/design/2026-07-19-world-truth-pass.md`** — read it first, it wins on
intent. This file is the code-only cut.

## Why

The game world has drifted from Eloisa's real apartment: objects that don't exist
IRL are still packable, one real listing (the Roku TV) is fused into another
object, her personal laptop isn't represented, and world-bound task cards silently
un-complete themselves. This is the code half. Fable produces a separate save
patch afterward for Eloisa's live device (world-state + her per-device bindings) —
**do not touch her save data; only code.**

## Scope — four changes, all in code

### 1. manual-Done-sticks fix (the "won't stay done" bug) — HIGHEST VALUE
`reconcileTasksFromWorldState` (`src/taskBindings.js`) reopens any world-bound
task whose world state isn't satisfied, so a card the player marks Done by hand
flips back to pending on the next reconcile (BedroomSlice effect at
`src/BedroomSlice.jsx:2574`). Fix: **a manual Done must never be silently
reverted.** When the player explicitly completes a world-bound card (the
board/ledger/desk `markDone` paths), record that it was hand-completed (e.g.
`manualDone: true` on the task, or flip `completionMode` to `"manual"`), and make
`reconcileTasksFromWorldState` skip the reopen branch for hand-completed tasks.
World→done auto-completion and the undo→reopen for *auto*-completed tasks must
still work. Add a test in `tests/task-bindings.test.mjs` covering: hand-Done a
world-bound task whose world is unsatisfied → stays done across a reconcile.

### 2. Set-dressing pass — drop non-existent objects from the packable catalog
In `src/apartmentObjectCatalog.js` `PACKABLE_OBJECTS`, remove (art stays drawn in
the rooms — only the packable/removable catalog entries go):
- All plants: `sill_plants`, `hanging_plant` (bedroom), `sill_plants_k`,
  `fridge_plant` (kitchen), `sill_plants_d` (dining)
- `sill_bottles` (bathroom windowsill bottles), `waste_bin` (office wastebasket)
- Retire `side_cabinet` as an INDEPENDENT sale target — it's part of the desk
  (folds into `f_remove_desk`, see the save patch). Keep its *contents* collection
  working; just don't offer the cabinet itself as its own packable furniture.

Also set `removable: false` on those objects' ROOM defs in `BedroomSlice.jsx` so
they can't be selected/packed in the apartment. Room packed-X/Y counts should drop
them automatically. Verify the counts still add up.

### 3. Split the Roku TV out of the TV hutch
The TV screen is currently drawn INTO the procedural `tv_hutch` sprite
(`BedroomSlice.jsx:1423`, the `#141414` screen rect). Make `living:tv` its own
`removable: true` object (its own procedural draw for the Roku/screen; remove that
screen block from the hutch draw so they don't double-render). It's Eloisa's
separate $100 Marketplace listing. Fable's save patch will bind the existing
`f_buyer_tv` / `f_remove_tv` tasks to `living:tv`; you just create the object +
sprite + make it selectable/sellable. Pick a sensible value (~100).

### 4. Add the personal laptop as a carry-on item
Eloisa owns a personal laptop (flies in her carry-on) not yet in the game. Add one
item to `office:desk_hutch` in `src/contents.js`:
`{ id: "personal_laptop", name: "Personal Laptop", spr: art("s3_r11_i01_work_laptop.png"), value: 0 }`
— **reuse the existing work-laptop PNG** (Eloisa may drop a distinct sprite later;
no new art is required). It must be a **do-not-pack / carry-on** item: it can be
"packed" (into the carry-on) but must never be Sold or U-Box-loaded. If a `noPack`
/ carry-on flag doesn't exist yet, add the minimal version (a flag on the item that
hides Sell and routes Pack to "carry-on"). Fable's save patch binds it to
`m_plane_bags` ("Finish packing luggage").

## Out of scope (Fable's save patch handles these — do NOT do them)
Task→object binding edits (desk+chair+cabinet, work_return+monitor, fridge/pantry,
curtains, wifi, health-zone/appointment links), and world-state truth-ups
(hutch-books/craft marked packed). Those land as saved values on Eloisa's device.
You MAY additionally update the canonical bindings in `tasks.js` INITIAL_TASKS for
fresh installs if you want them correct-by-default, but it is not required and
saved bindings win on existing devices — coordinate with Fable if you do.

## Acceptance
- Hand-Done a world-bound card whose world isn't satisfied → it stays done after a
  reconcile (new test green). Auto-complete + undo-reopen still work.
- Plants / windowsill bottles / wastebasket no longer selectable or counted; their
  art still renders in the rooms.
- Roku TV is its own object, selectable and sellable, hutch no longer draws a TV.
- Personal Laptop shows on the desk, can be packed to carry-on, cannot be sold.
- `pnpm typecheck` + all `tests/*.test.mjs` pass; `pnpm build` clean.

Report back in a session file per `docs/ai-team/end-here.md`; merge `cursor` → main
at close. Flag Fable if the noPack flag or TV split turns out bigger than one
session — fallback is ship #1 (manual-Done fix) alone, it's the highest value.
