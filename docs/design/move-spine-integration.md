# Move-spine integration — how the game serves the actual move
**Owner:** [Claude / Fable 5] · design ruling for P1c and the lifecycle / admin / Stretchy / U-Box tickets in `FINISH_PLAN.md`.
**Sources:** `docs/move-spine/` (full inventory Jul 11) · `ui-direction.md` · the live build.

## Thesis

The game does not absorb the move plan. It becomes the **morning dispatch ritual** for it. The apartment already *is* the packing plan (rooms, objects, Pack/Sell/Donate). The Desk already *is* the job/admin plan (trays, stamps, outbox). The Body Board already *is* the health plan. What's missing is one surface that answers "**what, today?**" — and discipline about what we refuse to build.

Three rules shape everything below:

1. **One new surface only** — the Command Board. Every spine element lands on an existing screen or doesn't land at all.
2. **Dates enter as phases and one pinned critical path** — never as forty dated task cards.
3. **Real daily quotas become session meters** (the proven `File 6 · Stamp 4 · Clear 3` pattern) — never card stacks.

## The mapping

| Spine element | Game surface | Mechanic | Verdict |
|---|---|---|---|
| Phased packing (pack-first now → U-Box week Jul 25–30) | Apartment | Current **phase** reorders room-chip emphasis; the game suggests *which room* today | EXTEND |
| Furniture sell-by Jul 29 | Apartment Sell verb | Sell/Donate already work; as cutoff nears, Sal (later pass) mentions it. **No price decay** — punishment isn't motivation | EXTEND |
| DO NOT PACK list (meds, ID, Wi-Fi kit, Stretchy kit…) | Apartment items | `noPack` flag: the item refuses the Pack verb with one in-world line ("That stays out."). Wi-Fi router is already an object — flag it | **BUILD** (small, high value) |
| U-Box countdown / readiness | Living-room box stack + HUD | Box stack reads as the readiness meter; days-left HUD gains a "next: U-Box Jul 27" line during U-Box week | EXTEND |
| Sublet sprint (10 serious + 5 backup msgs/day, lock Jul 15) | Desk session meter | `Messages 10 · Backups 5` join the session ritual; each message is a checkbox tick, **not** a task card | EXTEND |
| Job apps (5–7 serious *total* — spine says don't turn search into avoidance) | Desk trays + stamps | A handful of papers, not a pipeline. Fit-screening = the existing **Needs Info** stamp | EXISTS |
| Job follow-up states (applied/waiting/followup_due/ghosted…) | Desk papers only | Minimal enum on job papers (ticketed, P1 §8) — nowhere else | EXTEND |
| Health priority order (OB/GYN → rheum labs → med bridge → vet → …) | Body Board | Zone *ordering* = spine priority; opportunistic items (dentist, vision) rendered dim, never nudged | EXTEND |
| Stretchy travel chain (vet Jul 22–25 → cert → meds run → carrier) | Stretchy screen | Static rows become real states (ticketed, P2b) | EXTEND |
| Admin cutoffs (Wi-Fi return, USPS, utilities, CUNY, COBRA) | Desk ADMIN tray | Static cards from master list v1 (ticketed, P1 §9) | EXTEND |
| Daily dispatch (1 packing + 1 job/admin + 1 health/cat + urgent) | **Command Board** | The board's entire job — see below | BUILD (P1c) |
| NPC trigger ladder + priority order | Phone | Caps stand as specced: one call per session, one ask per call, stall → hang up, task stays open | BUILD (Sal/Vivian passes, later) |

## The Command Board — design ruling for P1c

A **clipboard sibling** per `ui-direction.md` — same walnut/brass/parchment family as the Body Board, papers clipped to it, not a dashboard with widgets.

- **Shows at most 3 + 1:** one card per lane cluster (Packing · Health/Stretchy · Jobs/Admin) + one urgent override slot, used only when the trigger rules demand it. The spine's own words: *"do not show everything as mandatory every day."*
- **Cards are doors, not forms.** Tapping the packing card goes to the suggested room; the health card to the Body Board (or rings Shirley); the job/admin card to the Desk. Nothing completes *on* the board.
- **Critical-path strip:** five pinned dates max (sublet Jul 15 · vet window · U-Box Jul 27 · packed Jul 30 night · flight Jul 31 3:20 PM), a thin paper strip under the clip — present, quiet, never blinking.
- **Cadence:** the board is the first screen once per day (the morning dispatch), then retreats to a Menu tile. Second open of the day goes straight to the apartment.

## v2 — energy dispatch, the ledger page, pinned goals (Eloisa, Jul 11)

Eloisa's refinement (Sweepy-style): the board should carry the executive functioning, not just list work. Four additions, all riding the clipboard:

**1. The energy check-in.** First open of the day, before goals are offered, the clipboard asks one form question — *"Running on: ☐ Fumes ☐ Steady ☐ Full tank."* Every task gets an `effort` field (1 tiny · 2 medium · 3 heavy). The day's energy sets an effort budget, and the board fills the 3+1 slots by **critical-path-first within budget**:
- **Fumes** ≈ 3 points: tiny tasks only, gentlest wins first — one drawer, one message batch, one care item. Completing *one* thing earns the full session reward.
- **Steady** ≈ 5–6 points: the normal 1+1+1 mix.
- **Full tank** ≈ 8–9 points: structural work gets offered — pack the closet, two applications, the vet call.
Binding rule: **low energy is never punished or even remarked on.** No "you're behind," no smaller reward chips on fumes days. The dial adjusts the ask, never the tone.

**2. The ledger page (see-all).** The daily dispatch is page one on the clipboard; **flip the page** for the full manifest — one plain scrollable list per lane (Packing · Health/Stretchy · Jobs · Admin), every task with status, effort dots, and due date. No fancy chrome, no interactions beyond scroll/inspect — it exists for *planning ahead*, not doing. This is the pressure-relief valve that lets the daily page stay tiny: you can always see everything, so the board never has to show everything.

**3. Pinned goals.** Goals accepted at morning dispatch ride the HUD as a slim chip strip (≤3) across every screen — same visual grammar as the room-quest chip. Tap a chip → jump to its surface. Chips check off in place; ✓ chips linger until midnight (the pile principle: evidence stays visible).

**4. Reminders — honest ruling.** True SMS/push needs a server; the game has no backend and that stays true. Two backend-free paths, both SOFT:
- **In-world:** if the app is open around a chosen time, the landline rings — Sal/Shirley already own the phone; "you said you'd start boxes around now" is one line.
- **Out-of-world:** "remind me" on a pinned goal exports a calendar event (.ics / Google Calendar link) — her real phone then does the notifying, reliably, for free.
Park both until after the board skeleton; ticket the .ics version first (cheaper, more reliable).

Amended acceptance for P1c: energy check-in precedes goal offer · `effort` field on tasks (this folds into the lifecycle ticket, P1 §8) · ledger page-flip per lane · pinned-goal chip strip.

## Motivation architecture

Everything that already works here is **accumulation you can see**: the outbox pile, the box stack, the session checkmarks, Stretchy's hearts. We extend those and add nothing novel. New meters (sublet messages, U-Box readiness) reuse existing visual grammar.

Pressure rules (binding on all future passes, including Sal/Vivian):
- Pressure may **concentrate attention** — one call, one ask, one suggested room.
- Pressure may never **shame** — no streak loss, no decay, no red-splattered screens. The guilt bubble and vignette stay flavor, not systems.
- Optional care (dentist, vision, low-fit jobs) never outranks the critical path, and the game never nags about it. Spine's rule, our aesthetic too.
- Voice per `docs/move-spine/README_FOR_GROK.md`: a person, not a content generator. No therapy voice, no cute-productivity voice.

## Pressure v2 & Stretchy stress (Eloisa, Jul 11)

**Why now:** current `taskPressure` (`tasks.js:92`) sums urgency across ALL open tasks. The seed-data drop (~35 real tasks) pins it at 3/"Getting loud" from day one to move day — permanent red vignette, permanently 1-heart guilty cat. A meter pinned at max is no meter. **Pressure v2 must land WITH the data drop.**

**1. Pressure measures loudness, not volume.** v2 = weighted count of open tasks that are *overdue or due within ~48h* (critical-path items weigh double), read via the calendar spine. Thirty-five tasks due in two weeks = "All clear." One vet appointment tomorrow = pressure. The existing 0–3 scale, labels ("All clear / Manageable / Piling up / Getting loud"), and every consumer (vignette, fan twitch, red dots) keep working unchanged — only the input honestly changes.

**2. Stretchy's stress is his own, decoupled from Eloisa's todo list.** Today his hearts mirror her total backlog — which makes him a guilt proxy (the code comment admits it: "purely a guilt cue"). Wrong emotional target: the cat shouldn't be sad because paperwork is unfiled. New `stretchyStress` (0–2: content / watchful / needs-you) reads only **his** reality: the Stretchy travel-prep chain (vet → cert → meds run → carrier → kit) vs the calendar, plus mild ambient disruption during U-Box week (boxes everywhere — cats notice). Hearts, mood line, and the "!" bubble consume this instead. The bubble now only appears when a cat-chain task is genuinely due — so it's always *true*, and tapping him goes to something real. Guilt glow: keep the visual, but it now means "Stretchy needs something," never "you are behind."

**3. Wire the meow tiers (buffers already load).** Ambient meow pool follows `stretchyStress`: content → happy clips (current behavior) · watchful → occasional stressed clip · needs-you → stressed, with **desperate reserved for final week + prep chain incomplete** — if desperate meows are common they're wallpaper; if they're rare they're a fire alarm. Keeps the "ambient = rare" rule.

**4. Fumes-day quiet rule.** On a Fumes energy day the vignette and fan-twitch are suppressed entirely and pressure display softens to text only. Someone running on fumes gets a quiet apartment, not a breathing red screen. (Stretchy's bubble stays — his needs are real regardless of her energy.)

**5. Morning check-in (open P0 item) becomes his status report:** first open of the day, Stretchy's line reflects `stretchyStress` + phase — one sentence, from the approved voice, never a task list.

## Refusals (as load-bearing as the features)

- **No job CRM.** 5–7 applications is a stack of papers on a desk. If it needs a database, we built the wrong thing.
- **No 14-state machine everywhere.** Per-lane minimal states only; the spine itself says *"do not overbuild."*
- **No push/background anything.** The game speaks only when opened. The move is stressful enough.
- **No auto-import of the master list.** Curation is the feature — spine §13 says most items become background pressure, not gameplay.
- **No new NPCs before Shirley Pass 1 proves the call pattern.** Sequenced already; this doc doesn't reorder it.
- **No new screens beyond the board.** If a spine element can't land on an existing surface, it waits.

## Functional-companion gaps (Eloisa's "are we missing anything," Jul 11)

Audit of "could this actually run the move" — four gaps, all connective tissue between game and reality, none of them screens:

**1. The reality contract.** The apartment is an **honor-system mirror**: packing the pixel box *records* that the real box got packed — the game never verifies, never doubts. For non-physical tasks the binding rule is **≤2 taps to mark a real-world thing done** (tap task → done, anywhere it appears: card, ledger row, chip). If logging a completed errand takes more effort than the errand's dopamine pays back, she stops logging and the companion dies. Every future surface obeys this.

**2. Quick-add — the biggest true gap.** Life generates tasks mid-move (a sublet reply, a form nobody predicted). Today there is no way to add a task in-app; without one this is a fixed script, not a companion. v1: one plain input on the ledger page — text + lane + effort dots, becomes a normal task card. No recurring rules, no due-date picker beyond "this week / a date"; it's a sticky note, not a form.

**3. Device canon + save safety (Eloisa-confirmed, Jul 11).** **Laptop = dev. Phone = canonical app usage.** Saves are per-device localStorage, so this split is law, not preference. Deploys reach the phone **carefully**: every Vercel push must preserve the phone's save — after the seed-data drop, schema bumps may **never wipe status again** (today `v` mismatch wipes clean): mid-move, her packed/done states are irreplaceable real-world records. Migrations carry status forward; test the migration against a copy of real save data before deploying. SOFT: save export/import (clipboard JSON) as a lifeboat.

**4. Sequencing reality check (Eloisa's call).** Sublet lock is Jul 15; the current build order (perf → Shirley Pass 1 → data drop → board) won't surface the sublet lane until after it's moot. If the app should help *this week*, the **data drop + ledger page jump the queue** ahead of Shirley Pass 1 — Shirley already works via bank lines; a companion that doesn't know about the sublet sprint during the sublet sprint doesn't get a second first impression.

**Deliberately still absent** (checked, refused): accounts/cloud sync (backend), push (ruled — .ics), streaks/analytics (shame machinery), evening review ceremony (session checkmarks already close the day). SOFT someday: an **arrival ending** — Aug 1, boxes gone, one quiet screen with Stretchy in the new place. The countdown deserves a landing.

## What this changes in FINISH_PLAN (deltas only)

1. **P1c acceptance gains:** 3+1 card cap · cards route to existing screens · critical-path strip ≤5 items · morning-dispatch boot behavior (once/day).
2. **U-Box ticket (P2b):** DO NOT PACK becomes a `noPack` item flag with an in-world refusal line — cheapest, most diegetic version; the carry-on checklist rides the same flag.
3. **Admin/sublet ticket (P1 §9):** sublet daily quota is a **session meter**, not cards — implement in `session.js` beside File/Stamp/Clear.
4. **Body Board (done, P2):** future zone ordering follows spine health priority; dim the opportunistic items.

Everything else in the plan already agrees with this design.
