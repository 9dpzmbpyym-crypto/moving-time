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

## Open next (Jul 11 — after Grok env/storage session)

### Branch swap at Grok session close — [cursor] (this close-out)
- [x] Merge `cursor/storage-glow-7a01` → `main` (session file + signed DEVLOG)
- [ ] **[eloisa]** Delete `cursor/storage-glow-7a01` in GitHub UI (agents get 403), then create standing `cursor` from main

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
- [ ] **[cursor]** Wire stressed / desperate Stretchy meows (buffers already load in `gameAudio.js`; ambient path is happy-only today)
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

- [ ] **Hallway room (death closet + coat closet)** — 7th room, parked by Fable review Jul 12: additive (rooms are data entries) but room-scale art + contents work. Holds: Stretchy travel/toys, extras/task piles. Do not start before weekend ship bar.

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
