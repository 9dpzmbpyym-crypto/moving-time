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
**Current next bar:** tiny perf/usage safety patch + safe Shirley Pass 1 + phone smoke test. **No scope expansion until those land.**  
**Move:** end of month — productivity tool, not an endless art project.  
**Product bar:** fun to open every day + helps you pack / apply / stay covered.  
**North star mockups:** `artifacts/pack-it-up/docs/mockups/`

Legend: **YES** = ship soon · **SOFT** = ship if cheap / after YES

---

## Open next (Jul 11 — after Grok env/storage session)

### Branch swap at Grok session close — [cursor] (this close-out)
- [x] Merge `cursor/storage-glow-7a01` → `main` (session file + signed DEVLOG)
- [ ] **[eloisa]** Delete `cursor/storage-glow-7a01` in GitHub UI (agents get 403), then create standing `cursor` from main

### Tiny perf / usage safety patch — [cursor] (from ChatGPT Jul 11 review, Opus-verified against code — do FIRST)
- [ ] **Grok-sized — Shirley API tightening** (`receptionistCall.js`, the only real usage/$ risk): cap fallback chain to configured model + **one** backup (today: 4 free fallbacks × 25s timeout ≈ up to ~125s of hanging attempts per send) · `max_tokens` 320→~120 · `temperature` 0.95→~0.6 · fail loudly on unknown model slug · surface reply source + last error **in the phone UI** — the Settings "live" badge is only `improvEnabled()` (config check), so silent failures read as live improv. This explains Eloisa's "OpenRouter on, dashboard shows nothing, replies match bank verbatim" report: likely invalid slug (`deepseek/deepseek-v4-flash`) → all attempts 404 → bank answers behind a "live" badge. Per-message source IS tracked (`setLineSource` `live`/`script`) — expose it.
- [ ] **Composer-sized — clock churn:** `now` ticks every 1s at the top of BedroomSlice (~line 2919) → full-tree re-render of the 3,800-line monolith every second, and **neither clock displays seconds** (both `h:mm`) → tick per minute. Leave `DeskScreen`'s `deskNow` alone (only runs while Desk is open).
- [ ] **Composer-sized — dead code:** delete the July-10 test-call block (BedroomSlice ~2475–2490). Date-gated to 2026-07-10 so it's already inert — hygiene, not active churn.
- Acceptance: bank works with no key · live improv opt-in · one failed call falls back fast · phone UI shows source/error · a real test call appears on the OpenRouter dashboard **or** the UI shows why not · no broad refactor.
- Watchlist only, do NOT touch this pass: audio front-load, radio preload, 40ms phone pulse (self-clears), infinite CSS animations.

### Audio file cleanup — [cursor] Composer-sized (now that Grok session is merging)
- [ ] Delete the 7 **original-named** Epidemic drops only — code slices `cabinet/fridge/drawer_open_close_es.mp3` at runtime and uses all four `phone_*.mp3`, so those STAY:
  - repo root: `ES_Doors, Appliance, Fridge…`.mp3 + `ES_Doors, Cabinet, Cupboard…`.mp3 (uploaded to the wrong folder)
  - `sfx/ui/`: `Dial Tone and pickup…`, `Receiver Tone…`, `Rotary dial…`, `ES_Communications, Telephone…`
  - `sfx/containers/`: `ES_Drawers, Wood, Writing Bureau…`
- [ ] Slice/wire the cupboard creak if still wanted (no replacement on the branch yet)
- [ ] Update `audio_index.csv` / `audio_manifest.json` if they reference removed files
- Naming rule now lives at the top of `README_AUDIO_INDEX.txt`

### Fable design review tickets (Jul 12 — see docs/design/2026-07-12-fable-game-review.md)
- [ ] **[cursor]** Kitchen counter → 4 zones: **Utensil drawer / Junk drawer** (upper L/R) · **Cookware / Under-sink** (lower L/R). Data supports it; touch `kitchenTapZone` (quadrants), `containerKind` (SFX), `storageTitle` (panel names); re-tag items' `zone` in contents.js
- [ ] **[cursor]** Guitar: replace with **hard case leaning by the amp** (tight-cropped PNG — pipeline blits whole image; current PNG doesn't render in live build)
- [ ] **[cursor]** Pin kitchen cat bowls against counter/fridge base (currently float mid-tile, no anchor)
- [ ] **[cursor]** Crop guard: clamp/bounds-check thumbnail crop rect in contents.js (pipeline blind-trusts manifest center values)
- [ ] **[cursor]** Make `toiletries` + `storage_bin` real containers (CONTENTS keys + glow + SFX kind); move vanity `perfume` item → toiletries; move sewing items from `office:side_cabinet` → tote
- [ ] **[chatgpt/eloisa]** Asset pulls from source stack: more dresser items (only 3 now), unique "Leftovers" sprite (currently reuses canned-food), regenerate off-center normalized item PNGs
- [ ] **[cursor]** Listen-check on phone: incoming ringtone vs radio; duck radio ~0.6 during ring if they fight
- Medicine cabinet ruling: **portal only, meds stay in vanity** — already true in code; do not add storage to the mirror

### Branch deletions — [eloisa] (GitHub UI: repo → Branches → trash icon; agents get 403 on ref deletion)
- [ ] Delete: `chatgpt-version` · `claude/game-dev-setup-bhs0lt` · `claude/pack-it-up-polish-yln7jy` · `cursor/combine-local-with-replit-main` · `cursor/fix-vite-dev-server-7a01` · `cursor/local-updates-backup` · `cursor/tech-debt-housekeeping-7a01` (all merged or parked in `archive/*` — zero loss)

### Storage glow (IN PROGRESS — handoff)
- [ ] **Outstanding:** container glows still read as two looks — soft outer halo on some faces vs heavy/full-face aura on others (fridge/pantry/closet regions cover most of the sprite). Mirror correctly keeps silhouette `.portal`; storage should stay bar-cabinet `.drawerGlow` only.
- [ ] **[claude]** Judge screenshots / set proportions; **[cursor]** tune `glowRegions` rects (shrink fridge/pantry/closet toward vanity/bar door proportions)
- [ ] Optional: delete `?glow=outline` path if unused; default is face-only for storage
- [x] Partial: route all storage through `glowRegions` + edge-only `.drawerGlow` (no green fill); closet/fridge/pantry renamed off `faceGlowRegions`

### Shirley / receptionist — source of truth LANDED: `docs/move-spine/` (Fable-reviewed ✓)
- [x] Style + ruleset prompt landed: `docs/move-spine/npc-guides/SHIRLEY_HEALTH_RECEPTIONIST.md` + `prompts/RUNTIME_SYSTEM_PROMPTS.md`
- [ ] [cursor] **Pass 1** per `docs/move-spine/systems/IMPLEMENTATION_MANIFEST.md`: rebuild `SHIRLEY_SYSTEM_PROMPT` + thin fallback bank from the guide; keep FSM bookings; calibration lines are style source, not verbatim scripts (except the small curated bank)
- [ ] [cursor] Tune stall → hang-up + “mention objective ≤1 message gap” once prompt lands
- [ ] Optional: landline pixel art per `docs/art-briefs/landline-shirley.md`
- Later passes (Command Board → lifecycle states → Sal → Vivian) sequenced in the implementation manifest; don’t start them in Pass 1

### Apartment contents / env props (Jul 11 Cursor session)
- [x] Fill remaining `container_item` homes in `contents.js` (pantry cat food, desk electronics, TV hutch guitar accessories, vanity meds, etc.)
- [x] Kitchen counter upper/lower zones; procedural bowls; office router/cat bed/hutch books; living amp + coffee-table books
- [ ] **[cursor]** Replace living `guitar_case` art — current acoustic PNG is a stopgap (crop odd; with an amp it should be electric **or** a hard case). Hold Stretchy travel/toys for hallway / coat closet / “death closet”
- [ ] Soft: extras / task piles still deferred

### Audio
- [ ] **[cursor]** Replace **room switch** SFX when Eloisa drops the new file (`sfx/ui/room_switch_01.mp3`)
- [ ] **[cursor]** Replace **cabinet** open/close SFX when new files land
- [ ] Grab / drop in the **other SFX** Eloisa flagged (tomorrow grab list)
- [ ] **[cursor]** Wire stressed / desperate Stretchy meows (buffers already load in `gameAudio.js`; ambient path is happy-only today) — **tiers now specced in Pressure v2 ticket (P1b2); don't wire against old `taskPressure`**
- [ ] **[cursor]** Prefer `public/assets/audio/` only — do not commit `src/assets/audio/` duplicate

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
- [x] Load on boot; version key (`v: 1`) wipes on schema mismatch
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
`admin` category exists (`tasks.js:29`) but holds exactly one task — populate it; Desk-owned in v1, **no admin NPC**.
- [ ] Sublet sprint as a **session meter**, not cards (design: `move-spine-integration.md`): `Messages 10 · Backups 5` beside File/Stamp/Clear in `session.js`; warm-reply follow-ups + backup plan if no sublet by **Jul 15** stay as ADMIN-tray cards
- [ ] Wi-Fi return card: equipment located · **DO NOT PACK** · return method confirmed · receipt/tracking saved
- [ ] Utilities/account cutoffs: renter's insurance, USPS forwarding (once address exists), pharmacy/records, CUNY docs, final pay/insurance/PTO emails

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

- [ ] **[cursor/codex]** Seed `tasks.js` + `save.js` defaults from the manifest in **`docs/design/master-list-incorporation.md`** (mechanical transcription): ~12 packing/U-Box process tasks · new `housing` category (4 tasks; daily 10+5 quota is a session meter, NOT tasks) · **replace all 3 fictional SAMPLE_JOBS with the real shortlist** (Hunter Jul 14, HOPWA ×2 Jul 18, MOCS Jul 26, MOPT Jul 28, Labor Relations Aug 30) · ~10 admin cutoff cards · health additions (OB/GYN IUD by ~Jul 25 → nearest existing zone for v1, PCP 90-day bridge) · fix `t_vet` due to the real **Jul 22–25** window · Stretchy chain tasks
- [ ] **[cursor/codex]** **Pressure v2 — MUST land with the data drop** (design: `move-spine-integration.md` → "Pressure v2 & Stretchy stress"): current sum-of-all-urgency `taskPressure` pins at 3 forever once ~35 real tasks seed. v2 = overdue/due-≤48h count (critical-path ×2) via calendar spine; consumers unchanged. Decouple `stretchyStress` (0–2, reads HIS travel chain + U-Box-week disruption only); "!" bubble only when a cat task is truly due; wire stressed/desperate meow tiers (desperate = final week + chain incomplete only); Fumes-day quiet rule (vignette/fan suppressed); morning check-in = his status line
- [ ] **[cursor/codex]** Calendar spine: one pure-data module (`movePhase.js`-shaped) — `PHASES` table (pack-first → mid-month → U-Box week → load days → lock night → flight day) + date triggers, helpers `currentPhase(date)` / `dueTriggers(date)`. No screen, no state. Board emphasis, Sal's ladder, flight-day mode, and the HUD "next: U-Box Jul 27" line all consume it. **The only new structure the master list requires.**
- NPC casting ruled (see doc): Shirley = health+Stretchy (data only, no new code) · Sal = packing/U-Box/DO-NOT-PACK/sell cutoff · Vivian = jobs · sublet + admin = Desk-owned, **no voice, deliberately**
- [ ] **[cursor]** Kitchen wall-calendar prop (design: `master-list-incorporation.md` → "The calendar prop"): portal object above the oven (never packable, mirror pattern) → `calendar` overlay in `Screens.jsx` — July paper page, Stretchy pin-up header, key dates inked **from the calendar spine table** (never hand-duplicated), past days penciled X, today circled, tap-a-date note strip. Read-only v1; August flip SOFT.

## P1c — Command Board / Daily Dispatch (after Shirley Pass 1 — not before)

One visible daily dashboard answering: what matters today, what's due/overdue, who will call, where to tap. Full spec: `docs/move-spine/` Command Board pass. **Design ruling: `docs/design/move-spine-integration.md`** — clipboard sibling, cards are doors not forms.
- Acceptance (Fable): **3+1 card cap** · cards route to existing screens (nothing completes on the board) · critical-path strip ≤5 pinned dates, quiet · morning-dispatch boot behavior (first open of the day only, then Menu tile)
- **v2 (Eloisa, Jul 11 — see design doc):** energy check-in first ("Fumes / Steady / Full tank") sets an effort budget; board fills slots critical-path-first within budget; low energy never punished · tasks gain `effort: 1|2|3` (fold into lifecycle ticket §8) · **ledger page-flip**: plain scrollable see-all list per lane behind the daily page · accepted goals ride the HUD as a pinned chip strip (≤3) across screens
- [ ] SOFT (after skeleton): "remind me" on a pinned goal → .ics / Google Calendar export (backend-free); in-world landline nudge variant later
- [ ] **Grow the existing `MenuScreen` 6-tile grid** (`Screens.jsx:300` — already has per-tile due badges) into the board; don't start from zero
- [ ] Four lanes: Packing · Health · Jobs · Admin
- [ ] Small daily load only: one packing/move task + one job/admin task + one health/Stretchy task (+ urgent override only if needed)
- [ ] Critical Path panel, **static from master list first**: sublet Jul 15 · vet records/cert · U-Box Jul 27 · packed Jul 30 night · flight Jul 31 3:20 PM · DO-NOT-PACK reminders

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
