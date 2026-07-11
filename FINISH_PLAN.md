# Pack It Up — Plan (canonical)

**This file is the single source of truth** for short-term and longer-term work.  
Other docs (`AGENTS.md`, `CLAUDE.md`, `DEVLOG.md`, `replit.md`) should only *point here* — don’t maintain parallel todo lists.

| Section | Horizon |
|---------|---------|
| **Open next** (top) | Immediate handoff / next session |
| **P0 → P2c** | Weekend + near-term product goals |
| **Explicitly defer** | Long-term traps — do not start |
| **Definition of done** | Weekend ship bar |

**Hard date:** usable by end of weekend (before/around Jul 12 Fable renew).  
**Move:** end of month — productivity tool, not an endless art project.  
**Product bar:** fun to open every day + helps you pack / apply / stay covered.  
**North star mockups:** `artifacts/pack-it-up/docs/mockups/`

Legend: **YES** = ship soon · **SOFT** = ship if cheap / after YES

---

## Open next (Jul 10 — after Shirley landline night)

### Audio file cleanup — [cursor] Composer-sized (AFTER Grok's current session merges)
- [ ] Delete the 7 raw Epidemic Sound files from the repo once each has a sliced, convention-named replacement wired in code (Grok's branch already has `fridge_open_close_es.mp3`, `phone_receiver_tone.mp3`, `phone_rotary_dial.mp3`):
  - repo root: `ES_Doors, Appliance, Fridge…`.mp3 + `ES_Doors, Cabinet, Cupboard…`.mp3 (uploaded to the wrong folder)
  - `sfx/ui/`: `Dial Tone and pickup…`, `Receiver Tone…`, `Rotary dial…`, `ES_Communications, Telephone…`
  - `sfx/containers/`: `ES_Drawers, Wood, Writing Bureau…`
- [ ] Slice/wire the cupboard creak if still wanted (no replacement on the branch yet)
- [ ] Update `audio_index.csv` / `audio_manifest.json` if they reference removed files
- Naming rule now lives at the top of `README_AUDIO_INDEX.txt`

### Branch deletions — [eloisa] (GitHub UI: repo → Branches → trash icon; agents get 403 on ref deletion)
- [ ] Delete: `chatgpt-version` · `claude/game-dev-setup-bhs0lt` · `claude/pack-it-up-polish-yln7jy` · `cursor/combine-local-with-replit-main` · `cursor/fix-vite-dev-server-7a01` · `cursor/local-updates-backup` · `cursor/tech-debt-housekeeping-7a01` (all merged or parked in `archive/*` — zero loss)

### Branch swap at Grok session close — [cursor]
- [ ] Merge `cursor/storage-glow-7a01` → `main` (with session file + signed DEVLOG per `docs/ai-team/end-here.md`)
- [ ] Delete `cursor/storage-glow-7a01`, then create standing `cursor` branch from main (git blocks the name until the old `cursor/*` branches are gone)

### Storage glow (IN PROGRESS — handoff)
- [ ] **Outstanding:** container glows still read as two looks — soft outer halo on some faces vs heavy/full-face aura on others (fridge/pantry/closet regions cover most of the sprite). Mirror correctly keeps silhouette `.portal`; storage should stay bar-cabinet `.drawerGlow` only.
- [ ] Tune `glowRegions` rects (shrink fridge/pantry/closet toward vanity/bar door proportions) until every container matches the bar-cabinet door halo
- [ ] Optional: delete `?glow=outline` path if unused; default is face-only for storage
- [x] Partial: route all storage through `glowRegions` + edge-only `.drawerGlow` (no green fill); closet/fridge/pantry renamed off `faceGlowRegions`

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
- [x] Commit Shirley + save/session/desk/health on `cursor/storage-glow-7a01` (Jul 10)
- [x] Commit storage-glow unify + plan/handoff; push branch
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
