# World-Truth Pass — reconcile game world with the real apartment (DRAFT)

**Status: DRAFT — blocked on Eloisa's suitcase + sublet-box packing lists (incoming).**
Ruling: Fable, Jul 19. Principle extends the scheduler ruling — *fictional data
teaches distrust*. Every packable object is either **real** (tracked), **set
dressing** (visibly not part of the job), or **out of the catalog**. No new
systems, no destination engine: destinations live in task titles and real box
labels (`m_labels` lanes: U-BOX / PLANE / SUBLET / DO NOT PACK / SELL / TRASH).

Two deliverables:
1. **Save patch** (data only — Fable produces import-ready JSON; Eloisa pastes
   into Settings → Import, which backs up first).
2. **Code ticket** (Composer/Grok-sized — set-dressing pass + TV split).

## Root cause: "book task refuses to stay done" (fixed by patch)

`p_books` is world-bound (`completionMode: "world"`) to `office:hutch_books_upper`
· packed. Save has hutch binders + coffee-table books packed but NOT the upper
hutch books, so `reconcileTasksFromWorldState` silently reopens every manual
Done. Patch marks the object packed (true IRL) → card resolves and stays.
**Taste ticket rider:** a world-bound card must never silently revert a manual
Done — surface one line ("Tracks: Hutch Books — still unpacked in the Office").

## New items (art/code)

- **`living:tv`** — split Roku TV out of the TV hutch (it is a separate $100
  listing); bind existing `f_buyer_tv` / `f_remove_tv` to it.
- Nothing else gets art. Shoe shelf (= the "west elm" listing), outdoor set,
  metal shelves, AC, mattress: task pairs are the tracker. Confirmed OK.

## New tasks

1. **Pack makeup, jewelry & keepsakes (suitcase / sublet box)** — vanity
   makeup + jewelry + hair accessories, nightstand papers & keepsakes +
   personal items. Trigger *handled*. Due ~Jul 23 (feeds Jul 24 luggage).
   May be reshaped by the suitcase/sublet lists.
2. **Pack lamps** — mushroom lamp, red desk lamp, torchiere (torchiere moves
   OUT of `p_roll_rug_lamp`, which retitles "Roll/protect rugs" and gains the
   bedroom rug). Trigger *handled*.
3. **Pack standing mirror** — `living:standing_mirror`, trigger *packed*.
4. **Donate vanity desk** — `bedroom:vanity`, trigger *handled* ("probs
   donating"; handled keeps sell open).
5. **Pack remaining loose furnishings** (catch-all, due ~Jul 26) — stool,
   everything basket, laundry basket, sewing machine, computer (pending
   confirmation it exists IRL), desk clutter, storage tote, dish rack,
   door towel. Trigger *handled*. Replaces archived "one-night mode".

## Retitled / rescoped tasks

- **`p_linens` → "Pack bedding & towels"** — keeps task-set binding (fancy
  towels object + sheet stack + quilt); due moves late (~Jul 29, bedding in
  use until the last night). Scope may grow with Eloisa's list.
- **`p_roll_rug_lamp` → "Roll/protect rugs"** — living rug + bedroom rug
  (torchiere leaves for the lamps task).
- **`h_empty_fridge` → "Empty fridge & pantry"** — fridge everything +
  pantry food + pantry spices, trigger *handled*.
- **`m_pack_bath`** — gains the pack-half of toiletries once Eloisa's split
  arrives (suitcase-half goes to the suitcase card). PENDING LIST.

## Bindings to add (existing task ↔ existing world)

| Task | Change |
|---|---|
| `f_remove_desk` | + `office:office_chair`, `office:side_cabinet` (one L-desk sale clears all) |
| `f_remove_dining` | + `dining:dining_chairs` (buyer task already requires both) |
| `f_remove_bedframe` | bind `bedroom:bed`, *handled* (mattress stays manual — binding-uniqueness) |
| `p_reduce_kitchen` | + junk-drawer collection, kettle, cutting board; trigger → *handled* (trash counts) |
| `p_decor` | + red vase, figurines, candle centerpiece, table clutter, tank-top decor |
| `p_art` | + cross-stitch flower |
| `h_moveout_clean` | + cleaning-supplies collection, *handled* (finish cleaning, toss the kit) |
| `h_restore_blinds` | all three curtain objects (bedroom / office / dining), *handled* |
| `w_wifi_return` | `office:wifi_router` (confirmed by Eloisa) |
| `w_work_return` | active work kit — work laptop + charger (confirmed by Eloisa) |
| `t_skin` | health appointment *skin · booked* (parity with t_teeth / t_obgyn) |
| `t_labs` | health zone *lymph · stabilized* (parity with t_med_bridge) |
| `f_buyer_tv` / `f_remove_tv` | new `living:tv` after the split |

## World-state truth-ups (same patch)

- `office:hutch_books_upper` packed; tv-hutch `book_flowers` + `book_humans`
  packed (all books packed IRL — kills the zombie card).
- 8 sewing items + 4 fabrics packed (craft task done IRL; stops false glow).

## Set-dressing pass (code ticket — removed from packable catalog, art stays)

Six plant objects (bedroom sill plants + hanging pothos, kitchen sill herbs +
fridge-top plant, dining sill succulents — and bathroom windowsill bottles),
wastebasket. `side_cabinet` retired as an independent target. Room packed-X/Y
counts become honest automatically. The plants stay alive in the art on
purpose — let them keep the apartment warm while everything else empties.

## Deliberately unbound (real work, no honest world hook)

Load-day sequence, U-Box logistics/photos, jobs, housing paperwork, Stretchy
plane-day kit + departure, phantom-sale pairs (outdoor set, shoe shelf,
metal shelves, AC, mattress).

## Open before the patch cuts

1. **Eloisa's suitcase + sublet-box lists** → finalizes toiletries split,
   makeup/keepsakes card scope, possibly linens scope.
2. **Computer object** — real desktop, or set dressing?
3. Marketplace below-the-fold: any active listings not yet mapped?
