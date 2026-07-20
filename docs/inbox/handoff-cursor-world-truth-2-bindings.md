> **STATUS: DONE — landed by Fable directly in `main` commit `e63bda6` (Jul 20).**
> Do NOT run this as a Cursor task; it's already implemented and verified
> (typecheck + binding-uniqueness 61 bindings + build all green). Kept for record.

# Handoff → Cursor Grok (paste this whole file) — world-truth pass 2: canonical bindings

You are Cursor Grok. Pull `main` into `cursor` first; never work on `main`. Mark
ACTIVE in `artifacts/agent_ledger.json` (lock `tasks.js`). Fable authored this;
full context in `docs/design/2026-07-19-world-truth-pass.md`.

## Why this is code, not a save patch

These tasks currently have **no binding** in Eloisa's save (`binding: null`), and
`save.js mergeTasks` uses `s.binding || t.binding` — so a binding added to
`INITIAL_TASKS` in `tasks.js` reaches her existing device automatically (her null
saved-binding falls through to the code binding) AND fixes fresh installs. No save
reimport, no coins reset.

## Task — add these bindings to `INITIAL_TASKS` in `src/tasks.js`

Add a `binding: {...}` to each of these existing task defs (leave everything else
as-is). Targets verified against `apartmentObjectCatalog.js` /
`inventoryCollections.js` — do not invent new ids.

| Task id | binding |
|---|---|
| `w_wifi_return` | `{ feature: "apartment_item", target: "office:wifi_router", trigger: "packed", resultStatus: "done" }` |
| `w_work_return` | `{ feature: "packing_requirement", targets: ["object:office:computer", "collection:office:desk_hutch:active work kit"], aggregate: "all", trigger: "packed", resultStatus: "done" }` |
| `h_empty_fridge` | `{ feature: "inventory_collection", target: "collection:kitchen:fridge:food & containers", trigger: "packed", resultStatus: "done" }` |
| `h_restore_blinds` | `{ feature: "apartment_item", targets: ["bedroom:curtains", "office:office_curtains", "dining:dining_curtains"], aggregate: "all", trigger: "handled", resultStatus: "done" }` |
| `h_moveout_clean` | `{ feature: "inventory_collection", target: "collection:kitchen:counter_sink:cleaning supplies", trigger: "handled", resultStatus: "done" }` |
| `t_skin` | `{ feature: "health_appointment", target: "skin", trigger: "booked", resultStatus: "done" }` (mirror `t_teeth`/`t_obgyn`) |
| `t_labs` | `{ feature: "health_zone", target: "lymph", trigger: "stabilized", resultStatus: "done" }` |
| `f_remove_bedframe` | `{ feature: "apartment_item", target: "bedroom:bed", trigger: "handled", resultStatus: "done" }` |

Notes:
- `active work kit` = work laptop + charger; `object:office:computer` = the work
  monitor. Both are returned to her employer → packing them satisfies the return.
- `w_work_return` uses `packing_requirement` (mixed object + collection). Confirm
  `taskBindingSatisfied` handles that shape (it does — object: keys read objState,
  collection keys read contentsState).
- Do NOT bind `m_plane_bags` (broad "finish packing luggage" — leave manual; the
  personal-laptop carry-on item is self-contained).
- Do NOT touch tasks where Eloisa already has a saved binding (dining, desk, sofa,
  dresser, coffee, entertainment, tv, health-book tasks) — those are handled.

## Guard the invariant

`binding-uniqueness.test.mjs` must still pass — every (target,trigger) owned by
exactly one task. None of the above collides with existing bindings; if the test
flags one, stop and report rather than forcing it.

## Acceptance
- The 8 tasks carry the bindings above; `binding-uniqueness`, `task-bindings`, and
  all other `tests/*.test.mjs` pass; `pnpm typecheck` + `pnpm build` clean.
- Sanity: with the work laptop/charger + monitor packed in-game, `w_work_return`
  reads done; packing the Wi-Fi router completes `w_wifi_return`.

Session file per `docs/ai-team/end-here.md`; merge `cursor` → main at close.

---
### Separate — NOT for Cursor, for Eloisa (4 quick-adds in the app)
These are new tasks; a curated save won't take them from code. Add via Ledger
quick-add (title + lane), stamp when done (manual-Done now sticks):
1. "Pack makeup, jewelry & keepsakes for suitcase" — lane: move
2. "Pack standing mirror" — lane: move
3. "Donate vanity desk" — lane: move
4. "Donate/trash bedroom rug" — lane: move
