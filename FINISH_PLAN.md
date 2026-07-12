# Pack It Up — Plan (canonical)

**This file is the single source of truth** for short-term and longer-term work.  
Other docs (`AGENTS.md`, `CLAUDE.md`, `DEVLOG.md`, `replit.md`) should only *point here* — don’t maintain parallel todo lists.

| Section | Horizon |
|---------|---------|
| **Open next** (top) | Immediate handoff / next session |
| **P0 → P2c** | Weekend + near-term product goals |
| **Explicitly defer** | Long-term traps — do not start |
| **Definition of done** | Weekend ship bar |

**Weekend ship bar (Jul 12): met — historical.** ("Definition of done" below is frozen as the record; phone smoke still on Eloisa.)  
**Current next bar:** phone smoke · kitchen calendar portal / HUD chips (Codex leftovers) · Shirley stall · Stretchy meows.  
**Landed Jul 11 (Grok):** Command Board + ledger/quick-add + Desk housing + 10+5 meter (Jul 15 nag).  
**Patch Jul 11 evening:** Sol correctness (no health scramble · book-only Shirley · OB/GYN zone · one vet Book · date-aware board) + self-target jobs + archive + drop moot diet/pharmacy/records.  
**Move:** end of month — productivity tool, not an endless art project.  
**Product bar:** fun to open every day + helps you pack / apply / stay covered.  
**North star mockups:** `artifacts/pack-it-up/docs/mockups/`

Legend: **YES** = ship soon · **SOFT** = ship if cheap / after YES

---

## Open next (Jul 11 — after Grok env/storage session)

### Jul 12 screenshot correction pass — [codex]
- [x] Match Body Board zone markers to the enlarged figure, keep OB/GYN fully selectable, and raise/inset the selected-zone paper.
- [x] Re-center apartment HUD and room-navigation text inside the existing mockup chrome; no room-art or layout redesign.
- [x] Second pass: shrink Psychiatry/Dentist, lower the paper over the feet, fit Overview into 390×844 without scrolling, and refine Overview/apartment text placement.

### Scheduler engine — [codex] ADOPTED, SHIP BAR: usable tonight/tomorrow
- Ruling: **`docs/design/scheduler-adoption.md`** · spec: `docs/inbox/chatgpt-productivity-structure-for-claude-7-11.md` · paste-ready prompt: **`docs/inbox/handoff-codex-scheduler.md`**
- [ ] **[codex]** Commits 1–3 (schema+migration+real dated data → urgency/status/deps → backward scheduler + persisted deal) wired minimally into the EXISTING board = usable bar. Bound cards preselected + explained ("why" one-liner); "minimum today: N pts"; OVERDUE badges; Ledger editor extended to target/latest
- [ ] **[codex]** After bar: commit 4 (card-draft presentation + graduated pressure visuals per companion note) · commit 5 (object/card sync, furniture state machine)
- Binding: save protection absolute (never wipe, backup before migration, branch-only, report per spec §21 — prod push is Eloisa's) · tone guard (in-world stamps, fumes = quieter) · fallback = ship commits 1–2 alone
- Call system from the pressure/calls note = LATER (Sal/Vivian trigger layer, after scheduler)

### Task card overlay — one component / one scale — [codex] (Claude root cause, Jul 11 eve)
- [x] **[codex]** First pass: fold pips into `CARD_OVERLAY`, share FitText/scaleOverlayPx with designer (credits ran out; designer briefly broke on undefined titleMax — Grok fixed)
- [x] **[cursor]** Apply Eloisa’s latest `/？cards=1` nudge into `CARD_OVERLAY` (thin title/dates + full date nudge). See `HANDOFF.md`.
- [ ] **[codex]** Real fix (Claude): designer + Board must render the **same** card component and only change outer width. Everything (position, font, pips) relative to card width; **one scale factor**; no independent per-element px fonts. Stop micro-nudging two paths. Pitfalls already burned: CSS-scale clip, VerticalTaskCard minWidth blow-up, full-card footer art.
- Acceptance: `/？cards=1` (outlines hidden) vs Board draw + hand — same component, scaled; apartment fan ~56px.

### Branch swap at Grok session close — [cursor] (this close-out)
- [x] Merge `cursor/storage-glow-7a01` → `main` (session file + signed DEVLOG)
- [x] **[eloisa]** Delete stale `cursor/*` in GitHub UI; standing `cursor` created from main and pushed (Jul 11 Grok)

### Tiny perf / usage safety patch — [cursor] (from ChatGPT Jul 11 review, Opus-verified against code — LANDED)
- [x] **Grok-sized — Shirley API tightening** (`receptionistCall.js`): one backup · `max_tokens` ~120 · temperature ~0.6 · fail loudly on unknown model slug · surface reply source + last error in the phone UI · Settings status no longer claims “live”
- [x] **Composer-sized — clock churn:** HUD `now` ticks per minute (DeskScreen `deskNow` left alone)
- [x] **Composer-sized — dead code:** July-10 test-call block deleted
- Acceptance: bank works with no key · live improv opt-in · one failed call falls back fast · phone UI shows source/error · a real test call appears on the OpenRouter dashboard **or** the UI shows why not · no broad refactor.
- Watchlist only, do NOT touch this pass: audio front-load, radio preload, 40ms phone pulse (self-clears), infinite CSS animations.

### Audio file cleanup — [cursor] Composer-sized (LANDED)
- [x] Delete the 7 **original-named** Epidemic drops only — code slices `cabinet/fridge/drawer_open_close_es.mp3` at runtime and uses all four `phone_*.mp3`, so those STAY
- [ ] Slice/wire the cupboard creak if still wanted (no replacement yet)
- [x] `audio_index.csv` / `audio_manifest.json` did not reference the removed raw filenames (no update needed)
- Naming rule now lives at the top of `README_AUDIO_INDEX.txt`

### Fable design review tickets (Jul 12 — see docs/design/2026-07-12-fable-game-review.md)
- [x] **[cursor]** Kitchen counter → 4 zones: **Utensil drawer / Junk drawer** (upper L/R) · **Cookware / Under-sink** (lower L/R)
- [x] **[cursor]** Guitar: procedural **hard case** leaning by the amp (PNG path removed)
- [x] **[cursor]** Pin kitchen cat bowls against fridge base (`layout.json`)
- [x] **[cursor]** Crop guard: clamp/bounds-check thumbnail crop rect in contents.js
- [x] **[cursor]** Make `toiletries` + `storage_bin` real containers; perfume → toiletries; sewing → tote
- [ ] **[chatgpt/eloisa]** Asset pulls from source stack: more dresser items (only 3 now), unique "Leftovers" sprite (currently reuses canned-food), regenerate off-center normalized item PNGs
- [x] **[cursor]** Incoming ringtone ducks radio ~0.6
- Medicine cabinet ruling: **portal only, meds stay in vanity** — already true in code; do not add storage to the mirror

### Branch deletions — [eloisa] (GitHub UI)
- [x] Stale `cursor/*` / listed branches cleaned (Jul 11) — standing `cursor` + `codex` + `main` remain

### Storage glow (IN PROGRESS — handoff)
- [ ] **Outstanding:** Fable still judges screenshots / sets proportions after Grok shrink pass
- [x] **[cursor]** Shrink fridge/pantry/closet `glowRegions` toward door-face proportions (first pass)
- [ ] Optional: delete `?glow=outline` path if unused; default is face-only for storage
- [x] Partial: route all storage through `glowRegions` + edge-only `.drawerGlow` (no green fill); closet/fridge/pantry renamed off `faceGlowRegions`

### Shirley / receptionist — source of truth LANDED: `docs/move-spine/` (Fable-reviewed ✓)
- [x] Style + ruleset prompt landed: `docs/move-spine/npc-guides/SHIRLEY_HEALTH_RECEPTIONIST.md` + `prompts/RUNTIME_SYSTEM_PROMPTS.md`
- [x] [cursor] **Pass 1**: rebuild `SHIRLEY_SYSTEM_PROMPT` + thin fallback bank from the guide; FSM bookings kept; calibration lines in bank sparingly
- [ ] [cursor] Tune stall → hang-up + “mention objective ≤1 message gap”
- [ ] Optional: landline pixel art per `docs/art-briefs/landline-shirley.md`
- Later passes (Command Board → lifecycle states → Sal → Vivian) sequenced in the implementation manifest; don’t start them in Pass 1

### Apartment contents / env props (Jul 11 Cursor session)
- [x] Fill remaining `container_item` homes in `contents.js` (pantry cat food, desk electronics, TV hutch guitar accessories, vanity meds, etc.)
- [x] Kitchen counter upper/lower zones; procedural bowls; office router/cat bed/hutch books; living amp + coffee-table books
- [x] **[cursor]** Replace living `guitar_case` art with hard case (procedural). Hold Stretchy travel/toys for hallway / coat closet / “death closet”
- [ ] Soft: extras / task piles still deferred

### Audio
- [ ] **[cursor]** Replace **room switch** SFX when Eloisa drops the new file (`sfx/ui/room_switch_01.mp3`)
- [ ] **[cursor]** Replace **cabinet** open/close SFX when new files land
- [ ] Grab / drop in the **other SFX** Eloisa flagged (tomorrow grab list)
- [ ] **[cursor]** Wire stressed / desperate Stretchy meows (buffers already load; Pressure v2 core landed on Codex — wire tiers next)
- [x] **[cursor]** Prefer `public/assets/audio/` only — do not commit `src/assets/audio/` duplicate

### Cursor grunt / Composer-sized
- [ ] **[cursor]** Delete unused `?glow=outline` plumbing *only if* Claude confirms face-only forever (else leave)
- [x] **[cursor]** Fill thin `contents.js` containers (Jul 11 — remaining homes; Stretchy travel/toys held for closet)
- [ ] **[cursor]** Soft: labeled box pile by room when packed (BOOKS / BATHROOM / …) if cheap
- [x] **[cursor]** Vercel deploy — https://moving-time.vercel.app (phone smoke still on Eloisa)

### Ship / host
- [x] Commit Shirley + save/session/desk/health on `cursor/storage-glow-7a01` (Jul 10)
- [x] Commit storage-glow unify + plan/handoff; push branch
- [x] **[cursor]** Deploy to Vercel — https://moving-time.vercel.app (Jul 10/11; phone smoke still on you)
- [ ] Commit `vercel.json` + Vite VERCEL defaults to git when ready

### Systems still open from plan
- [ ] **[cursor]** Stretchy morning check-in (after meow wiring or with it)
- [ ] **[codex]** Job tracker read-only sync → Desk piles (multi-file / API-shaped)
- [ ] Soft: Rejected stamp; labeled box pile by room

**Shipped in this pass (code on branch):** landline ceremony + Shirley call UI, container SFX slicing/duck, storage fills + env props, `receptionist.js` / `receptionistCall.js`, appointments in `save.js`, Body Board attend gate, session ritual, desk outbox/trays, HUD days-left / packed counts, Settings OpenRouter key.

---

## P0 — Must ship this weekend

### 1. Commit + host (Vercel)
- [x] Commit audio/radio/storage + Shirley landline work (Jul 10 — see Open next)
- [x] Deploy `artifacts/pack-it-up` to Vercel — https://moving-time.vercel.app
- [ ] Open the URL on your phone once; confirm audio primes on first tap

### 2. Persist progress (`localStorage`) — DONE Jul 9
- [x] Save `objState`, `contentsState`, `coins`, `minutes`, `tasks`, `roomIndex`
- [x] Load on boot; version key — **v2 migrates**, never wipes on schema bump (`save.js`)
- [x] Coming back tomorrow must feel continuous
- [x] Settings → Reset save (audio volumes stay in `pack-it-up-audio`)

**Files:** `save.js` + `BedroomSlice.jsx` + Settings in `Screens.jsx`. Key: `pack-it-up-save`.

### 3. Daily ritual + session to-dos / rewards (mockup UI energy) — DONE Jul 9
- [x] **YES** Session to-do card (3 lines with X/Y + checkmarks) on Desk and Health
- [x] **YES** Reward chip on complete — toast (`Filed +1` / `Approved +1` / `Cleared +1` / `Self-Care +1`)
- [x] **YES** Days left until move (calendar / countdown — hub + desk mockups) — Jul 31, 2026
- [x] **YES** Global boxes packed X/Y on HUD (hub mockup “12 / 48”)
- [x] **YES** Room quest chip under room name — e.g. “Bathroom 4/9” (diorama checklist)
- [x] Daily open-loop: session goals (File 6 · Stamp 4 · Clear 3) reset at local midnight
- [ ] Stretchy morning check-in (still open)

**UI style target:** warm wood panels, gold title plate, chunky progress bar, checklist — **shipped** in `Screens.jsx` shell + HUD frame unify.

**Files:** `Screens.jsx`, `session.js`, `tasks.js`, `save.js`, `BedroomSlice.jsx` HUD.

---

## P1 — Desk (toward Paperwork Desk mockup)

### 4. Finished pile / outbox — DONE Jul 9
- [x] **YES** OUTBOX / SENT pile — stamped papers stack and stay (the dopamine pile)
- [x] **YES** Count badge (“12 filed”)
- [x] Keep / amp Papers-Please stamp feel (shake + haptic if easy) — stamp travel + APPROVED mark

### 5. Trays + stamp outcomes — DONE Jul 9
- [x] **YES** Two color trays — ADMIN (blue) vs APPLICATIONS (pink)
- [x] **YES** Stamps: **Approved** + **Needs Info** + File  
      (Needs Info stays on desk + urgency bump; Approved / File → outbox)
- [ ] **SOFT** Third stamp **Rejected** only if the first two feel good

### 6. Desk atmosphere (soft)
- [x] **SOFT** Stretchy asleep on a paper stack on the Desk screen (tiny procedural loaf)
- [x] **SOFT** Flip calendar widget (date + days-left echo) — real clock on desk

### 7. Live job tracker sync
- [ ] Read from [job-tracker-sandy-two.vercel.app](https://job-tracker-sandy-two.vercel.app) (or its API)
- [ ] Map into `SAMPLE_JOBS` / task shape in `tasks.js`
- [ ] v1 = **read-only** pull on Desk open; fallback to samples if offline

**Files:** `Screens.jsx` Desk, `tasks.js`, maybe `jobTracker.js`.

### 8. Task lifecycle / proof-of-done — [codex/grok]
**Extend, don't rebuild** (audited Jul 11): tasks already have `pending/active/done/dismissed` (`tasks.js:16`); appointments already have a real FSM — `booked/reminded/attended/missed/cancelled` (`receptionist.js`). Grow from these.
- [ ] Jobs: replace SAMPLE_JOBS free-text `status` with a real enum — `applied / waiting / followup_due / interview / rejected / ghosted`
- [ ] Appointments: keep the FSM; surface scheduled-vs-attended in UI; add `records_needed` where labs/records gate completion
- [ ] Proof-of-done fields per lane: appt date/time + attended · labs/refills/records · job status update · follow-up sent · admin receipt/confirmation · vet certificate/records

### 9. Admin / sublet lane — [desk]
`admin` category is populated with cutoff cards (Wi-Fi, utilities, insurance, USPS, bank, CUNY, payout, …). Desk-owned in v1, **no admin NPC**.
- [x] Sublet sprint as a **session meter**, not cards (design: `move-spine-integration.md`): `Messages 10 · Backups 5` beside File/Stamp/Clear in `session.js`; warm-reply follow-ups + backup plan if no sublet by **Jul 15** stay as ADMIN-tray cards / Housing tray
- [ ] Wi-Fi return card: equipment located · **DO NOT PACK** · return method confirmed · receipt/tracking saved (card exists — deepen proof-of-done later)
- [ ] Utilities/account cutoffs: renter's insurance, USPS forwarding (once address exists), CUNY docs, final pay/insurance/PTO emails (cards exist — deepen later)

---

## P1b — Hub / apartment HUD (from hub mockup)

- [x] **YES** Days left (apartment HUD + desk calendar)
- [x] **YES** Global packed X/Y
- [x] **YES** Room quest chip (+ thin progress bar)
- [ ] **SOFT** Cards-in-hand upgrade — grow the paper fan toward explicit job/admin slots
- [x] **SOFT** Stretchy hearts (3) on Stretchy screen (from pressure)

**Defer:** five body meters always on apartment HUD; multi-room strip visible at once.

---

## P1b2 — Real move data drop + calendar spine (BEFORE or WITH the board — a dispatch with fictional data teaches distrust on day one)

> **DECIDED (Eloisa, Jul 11): this section + ledger page + quick-add JUMP THE QUEUE — ahead of Shirley Pass 1.** She needs the productivity core live now (sublet locks Jul 15). Order: [codex] data layer (seed drop, calendar spine, pressure v2, save migration) → [codex] ledger page + quick-add → board skeleton later. Shirley Pass 1 waits; she works via bank lines today. [cursor] perf patch runs in parallel (independent files).

- **Binding rules (design: `move-spine-integration.md` → "Functional-companion gaps"):** ≤2 taps to mark any real-world task done, everywhere it appears · phone is the canonical save device · after this drop, schema bumps must MIGRATE status, never wipe (`save.js` `v`-mismatch wipe becomes forbidden)
- [x] **[cursor]** Quick-add on the ledger page: text + lane + effort dots → normal task card. A sticky note, not a form (no recurrence, no complex dates). Without this the app is a fixed script.
- [ ] SOFT **[cursor]** Save export/import (clipboard JSON) as a lifeboat

- [x] **[cursor/codex]** Seed `tasks.js` + `save.js` defaults from the manifest in **`docs/design/master-list-incorporation.md`** (mechanical transcription): ~12 packing/U-Box process tasks · new `housing` category (4 tasks; daily 10+5 quota is a session meter, NOT tasks) · **replace all 3 fictional SAMPLE_JOBS with the real shortlist** (Hunter Jul 14, HOPWA ×2 Jul 18, MOCS Jul 26, MOPT Jul 28, Labor Relations Aug 30) · ~10 admin cutoff cards · health additions (OB/GYN IUD by ~Jul 25 → nearest existing zone for v1, PCP 90-day bridge) · fix `t_vet` due to the real **Jul 22–25** window · Stretchy chain tasks
- [ ] **[cursor/codex]** **Pressure v2 — MUST land with the data drop** (design: `move-spine-integration.md` → "Pressure v2 & Stretchy stress"): current sum-of-all-urgency `taskPressure` pins at 3 forever once ~35 real tasks seed. v2 = overdue/due-≤48h count (critical-path ×2) via calendar spine; consumers unchanged. Decouple `stretchyStress` (0–2, reads HIS travel chain + U-Box-week disruption only); "!" bubble only when a cat task is truly due; wire stressed/desperate meow tiers (desperate = final week + chain incomplete only); Fumes-day quiet rule (vignette/fan suppressed); morning check-in = his status line
  - [x] **[codex] Core landed on codex:** due/overdue weighted pressure + decoupled cat-chain/U-Box stretchyStress data API.
  - [ ] **[codex/cursor integration]** Wire Stretchy hearts/mood/glow/bubble and later meow tiers to stretchyStress; Fumes-day suppression waits for energy check-in.
  - [x] **[codex] Save v2 migration:** schema bumps preserve packed/content state and saved task status; no version-mismatch wipe.
- [x] **[cursor/codex]** Calendar spine: one pure-data module (`movePhase.js`-shaped) — `PHASES` table (pack-first → mid-month → U-Box week → load days → lock night → flight day) + date triggers, helpers `currentPhase(date)` / `dueTriggers(date)`. No screen, no state. Board emphasis, Sal's ladder, flight-day mode, and the HUD "next: U-Box Jul 27" line all consume it. **The only new structure the master list requires.**
- NPC casting ruled (see doc): Shirley = health+Stretchy (data only, no new code) · Sal = packing/U-Box/DO-NOT-PACK/sell cutoff · Vivian = jobs · sublet + admin = Desk-owned, **no voice, deliberately**
- [ ] **[cursor]** Kitchen wall-calendar prop (design: `master-list-incorporation.md` → "The calendar prop"): portal object above the oven (never packable, mirror pattern) → `calendar` overlay in `Screens.jsx` — July paper page, Stretchy pin-up header, key dates inked **from the calendar spine table** (never hand-duplicated), past days penciled X, today circled, tap-a-date note strip. Read-only v1; August flip SOFT.

## P1c — Command Board / Daily Dispatch — LANDED Jul 11 (Grok)

Energy check-in (Fumes/Steady/Full) · ≤3 lane picks · critical-path strip · ledger (sort/edit/archive) · Housing tray + daily outreach. Cards are doors to existing screens.
- Acceptance (Fable): **3+1 card cap** · cards route to existing screens · critical-path strip quiet · morning energy check-in
- [x] Energy budget fills board critical/due-first within effort (date-aware critical weight)
- [x] Ledger see-all per lane (sort due/effort/score · edit · archive)
- [ ] SOFT (after skeleton): "remind me" on a pinned goal → .ics / Google Calendar export (backend-free); in-world landline nudge variant later
- [ ] HUD pinned chip strip for accepted goals (≤3) — still open
- [x] Critical Path panel seeds from master list (sublet Jul 15 · vet · U-Box Jul 27 · lock Jul 30 · flight Jul 31)

---

## P2 — Body Board / Health (toward Body Board mockup) — DONE Jul 9

- [x] **YES** Named zones tied to real health tasks (`tasks.js` zone field)
- [x] **YES** Green check when a zone is stabilized; progress N/7
- [x] **SOFT** 2–3 care items (balm / herbal / patch) that calm a zone
- [x] **SOFT** Appointment cards (Cardio / Stretch / Rest)
- [x] **SOFT** Diagnostic notes line
- [x] Session to-dos + reward chips on this screen too

**Files:** `Screens.jsx` Health, `tasks.js` health category, `session.js`.

---

## P2b — Packing flavor (from diorama mockup)

- [ ] **Hallway room (death closet + coat closet)** — 7th room, parked by Fable review Jul 12: additive (rooms are data entries) but room-scale art + contents work. Holds: Stretchy travel/toys, extras/task piles. Do not start before weekend ship bar.

- [ ] **SOFT** Label box pile by room when packed (BOOKS / BATHROOM / …)
- [ ] **YES** Room quest chip (listed under P0 — don’t duplicate work)

### Stretchy travel prep — [cat/health lane]
Today: one bundled `t_vet` task (`tasks.js:48`) + 3 static flavor rows on StretchyScreen (`Screens.jsx:1599`) — make them real states, not decoration.
- [ ] Task cards/states: vet **scheduled → attended** · certificate/records obtained · meds discussed · meds test run · carrier acclimation · travel kit packed
- [ ] Stretchy stays screen-state/meows/notes in v1 — **not** a phone NPC
- [ ] Vet window from master list: **Jul 22–25** unless vet/airline says otherwise

### U-Box / do-not-pack / final sweep — [apartment/packing]
- [ ] U-Box readiness cards: lock bought · boxes labeled · heavy boxes staged · delivery **Jul 27** · fully packed **Jul 30 night** · no normal packing Jul 31
- [ ] **DO NOT PACK** as a `noPack` item flag (design: `move-spine-integration.md`): flagged items refuse the Pack verb with one in-world line ("That stays out."); Wi-Fi router is already an object — flag it. Carry-on checklist rides the same flag. List: ID, meds, insurance card, health/vet paperwork, laptop, phone, chargers, power bank, travel outfit, Stretchy kit, Wi-Fi equipment, CUNY/sublet docs, keys
- [ ] Final sweep checklist (Jul 31): closets, drawers, cabinets, outlets, fridge, medicine cabinet, under bed, behind doors, router, meds/docs/cat kit

**Defer:** side-view cutaway rebuild, Death Closet as a 7th room, roof/balcony staging.

---

## P2c — Polish / contents

- [ ] Fill any thin storage containers
- [ ] SFX / radio polish only if P0–P1 feel good
- [x] `CODEX_TASKS.md` dining/kitchen/living pixel list — **DONE (Jul 9)**

---

## Deferred but defined — later NPC passes (do NOT start before Shirley Pass 1 + Command Board)

Zero code exists for either today (audited Jul 11). Acceptance criteria live in `docs/move-spine/systems/IMPLEMENTATION_MANIFEST.md` (Sal = Pass 4, Vivian = Pass 5) — preserved here so they don't get lost:
- [ ] **Sal from Dispatch** — packing/U-Box trigger layer. Calls **only** on: packing neglect, U-Box timing, Wi-Fi risk, furniture/sell deadlines, final sweep
- [ ] **Vivian Vale** — job-tracker trigger layer. Calls **only** on: no job progress, high-fit deadline, 7-day follow-up, too many saved jobs, class conflict, poor-fit role
- Global rule: **one NPC call per session** unless critical deadline

---

## Explicitly defer (deadly traps)

| Trap | Why wait |
|------|----------|
| Full apartment UI redesign / photoreal hub | Endless; nudge overlays only |
| Side-view diorama rebuild | You already have six playable flat rooms |
| Drag-and-drop desk (full) | Tap-to-inspect is fine on phone; trays + stamps first |
| Tool-belt replacing Pack/Sell/Donate | Apartment verbs stay |
| Splitting `BedroomSlice.jsx` | Other sessions in flight |
| Write-back job tracker + full CRM | Read-only sync is enough |
| Five body meters always on packing HUD | Keep meters on Body Board |

---

## Suggested order

**Sat:** Vercel + save/load + days left + packed X/Y + room quest chip  
**Sun:** Desk outbox pile + session to-dos + reward toast + two stamps + two trays  
**Next:** job tracker read-only · Body Board zones · soft Stretchy hearts / asleep / care items / labeled boxes  

---

## Definition of done (weekend)

You can text yourself a URL, open it on your phone, hear Cherry Blossom, pack something, come back tomorrow and it’s still packed, see **days left** + **boxes packed**, stamp at least one paper into an **outbox pile**, and clear a **session to-do** for a little **reward chip**.
