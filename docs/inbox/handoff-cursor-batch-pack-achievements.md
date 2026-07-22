# Handoff → Cursor Grok (paste this whole file) — batch packing + collection achievements + card progress

You are Cursor Grok. Pull `main` into `cursor` first; never work on `main`. Mark
ACTIVE in `artifacts/agent_ledger.json` (lock BedroomSlice.jsx, Screens.jsx,
taskBindings.js). Fable designed this; the design calls below are made — implement
them, flag Fable only if one turns out infeasible. Ship the three parts in order;
each is independently valuable, so land + report incrementally.

## Part 1 — Multi-select batch packing in the storage overlay (highest value)

Today the storage overlay (`BedroomSlice.jsx`, `packContent`/`sellContent`/
`donateContent` ~line 3025+, single `selectedContentId` ~2546, panel with
Pack/Sell/Donate buttons ~3855) packs ONE item then closes. Change to batch:

- Replace single `selectedContentId` with a **Set of checked item ids**
  (`selectedContentIds`). Tapping an item toggles a **gold check** in its corner
  (not a full re-navigation). Keep a "last tapped" for Sell/Donate targeting.
- Bottom bar: **"📦 Pack (N)"** primary button packs **all checked items in one
  batch** — overlay STAYS OPEN, one grouped undo entry (extend `undoContentEntry`
  or push a batch entry that restores all), and a staggered fly animation of each
  packed sprite into the box (reuse the existing fly fx per item, offset by
  ~60ms). Bump session `cleared` by the count once.
- **Sell** and **Donate** stay single-item: enabled only when **exactly one**
  item is checked; disabled (greyed) with 0 or 2+ checked. Carry-on items
  (`it.carryOn`) still refuse Sell/Donate and show "🎒 Carry-on" on Pack.
- Undo must cleanly reverse a batch (restore every item's prior flags, coins,
  minutes). Test the undo path.

## Part 2 — Collection-complete achievement popup

When a pack (single or batch) makes a **named collection** fully packed-or-handled
for the first time, fire a celebratory popup.

- Detection: after packing, for each just-packed item, find the
  `INVENTORY_COLLECTIONS` groups it belongs to (semantic groups in
  `inventoryCollections.js` SEMANTIC_GROUPS + the whole-container `:all`) and
  check whether every key in that collection now reads packed/sold/donated. Only
  fire for collections not already achieved.
- Persist achieved collection ids in the save (e.g. `save.packedCollections: []`,
  wire through `save.js` write/merge like other fields) so each fires **once ever**
  and survives reload.
- Popup: a new `AchievementToast` (model on `RewardToast`, Screens.jsx:790, but
  larger + gold/stamp treatment). Copy: **"COLLECTION PACKED ✦"** + human label
  (`INVENTORY_COLLECTION_OPTIONS` has labels, e.g. "Dining · Bar Cabinet · Vases")
  + "N/N". Whole-container `:all` completion = bigger flourish ("ROOM ZONE CLEARED").
  Cozy, in-world, tap-or-~2.5s auto-dismiss.
- Batch that completes several collections at once: **queue** them, show
  sequentially, cap at 3 visible then "+N more". Never overlap/spam.

## Part 3 — "How to finish it" progress line on VerticalTaskCard

- Add `taskBindingProgress(task, world)` to `taskBindings.js` → `{ done, total,
  nextKey }` across all bound keys (reuse `inventoryTargetKeys` /
  `taskBindingSatisfied` logic; count packed/handled per the trigger). `nextKey` =
  first unhandled key, mapped to its `room:container` for a location label.
- In `VerticalTaskCard` (Screens.jsx:444, info lines ~560 where `describeBinding`
  pushes `🔗 …`), for `inventory_collection` / `packing_requirement` bindings add a
  second muted line: **"▸ 3/12 packed · finish in Dining · Bar Cabinet"**. Thread
  the world state (objState + contentsState) into the card as a prop; it renders in
  many places (board hand, ledger, apartment fan) so pass a compact `world` object
  or a precomputed progress map. Keep it to one line; hide when total is 0/undefined.

## Acceptance
- Open a container, check 3 items, Pack (N) → all three pack in one animation,
  overlay stays open, single undo restores all three.
- Packing the last vase in "Bar Cabinet · Vases" fires the achievement once;
  reloading and re-opening does NOT re-fire it.
- A collection-bound card shows "▸ X/Y packed · finish in <place>"; it ticks up as
  items pack and reads complete when done.
- `pnpm typecheck` + all `tests/*.test.mjs` + `pnpm build` green. Add a
  `taskBindingProgress` unit test to `tests/task-bindings.test.mjs`.

Session file per `docs/ai-team/end-here.md`; merge `cursor` → main at close.
Fallback if slipping: Part 1 alone is the win — ship it and report.
