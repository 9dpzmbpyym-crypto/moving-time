# Pack It Up — Finish Plan (weekend cut)

**Hard date:** usable by end of weekend (before/around Jul 12 Fable renew).  
**Move:** end of month — this is a productivity tool, not an endless art project.  
**Product bar:** fun to open every day + helps you pack / apply / stay covered.  
**North star mockups:** `artifacts/pack-it-up/docs/mockups/`

Legend: **YES** = ship soon · **SOFT** = ship if cheap / after YES

---

## Open next (Jul 10 — after Shirley landline night)

### Shirley / receptionist
- [ ] Bring ChatGPT **style + ruleset prompt** as source of truth (do **not** paste example convos literally into line banks)
- [ ] Rebuild `SHIRLEY_SYSTEM_PROMPT` / thin bank from that prompt; keep FSM bookings + OpenRouter improv
- [ ] Tune stall → hang-up + “mention objective ≤1 message gap” once prompt lands
- [ ] Optional: landline pixel art per `docs/art-briefs/landline-shirley.md`

### Audio
- [ ] Replace **room switch** SFX (`sfx/ui/room_switch_01.mp3`) — current one feels wrong
- [ ] Replace **cabinet** open/close SFX — current ones feel wrong
- [ ] Grab / drop in the **other SFX** Eloisa flagged (tomorrow grab list)
- [ ] Wire stressed / desperate Stretchy meows if still unused
- [ ] Prefer `public/assets/audio/` only (avoid duplicating under `src/assets/audio/`)

### Ship / host
- [ ] Commit + push this branch (Shirley + save/session/desk/health) — in progress Jul 10
- [ ] Deploy `artifacts/pack-it-up` to Vercel; smoke-test on phone (audio prime + save + desk phone)

### Systems still open from plan
- [ ] Stretchy morning check-in
- [ ] Job tracker read-only sync → Desk piles
- [ ] Soft: Rejected stamp; labeled box pile by room; fill thin storage contents

**Shipped in this pass (code on branch):** landline ceremony + Shirley call UI, `receptionist.js` / `receptionistCall.js`, appointments in `save.js`, Body Board attend gate, session ritual, desk outbox/trays, HUD days-left / packed counts, Settings OpenRouter key.

---

## P0 — Must ship this weekend

### 1. Commit + host (Vercel)
- [x] Commit audio/radio/storage + Shirley landline work (Jul 10 — see Open next)
- [ ] Deploy `artifacts/pack-it-up` to Vercel (static Vite build)
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

---

## P1b — Hub / apartment HUD (from hub mockup)

- [x] **YES** Days left (apartment HUD + desk calendar)
- [x] **YES** Global packed X/Y
- [x] **YES** Room quest chip (+ thin progress bar)
- [ ] **SOFT** Cards-in-hand upgrade — grow the paper fan toward explicit job/admin slots
- [x] **SOFT** Stretchy hearts (3) on Stretchy screen (from pressure)

**Defer:** five body meters always on apartment HUD; multi-room strip visible at once.

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

- [ ] **SOFT** Label box pile by room when packed (BOOKS / BATHROOM / …)
- [ ] **YES** Room quest chip (listed under P0 — don’t duplicate work)

**Defer:** side-view cutaway rebuild, Death Closet as a 7th room, roof/balcony staging.

---

## P2c — Polish / contents

- [ ] Fill any thin storage containers
- [ ] SFX / radio polish only if P0–P1 feel good
- [x] `CODEX_TASKS.md` dining/kitchen/living pixel list — **DONE (Jul 9)**

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
