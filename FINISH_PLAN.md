# Pack It Up — Finish Plan (weekend cut)

**Hard date:** usable by end of weekend (before/around Jul 12 Fable renew).  
**Move:** end of month — this is a productivity tool, not an endless art project.  
**Product bar:** fun to open every day + helps you pack / apply / stay covered.

---

## P0 — Must ship this weekend

### 1. Commit + host (Vercel)
- [ ] Commit audio/radio/storage night work (large `public/assets/audio/` — check git LFS / size)
- [ ] Deploy `artifacts/pack-it-up` to Vercel (static Vite build)
- [ ] Open the URL on your phone once; confirm audio primes on first tap

**Files:** `package.json` / Vite `base`, any Vercel config at repo or artifact root.

### 2. Persist progress (`localStorage`)
- [ ] Save `objState`, `contentsState`, `coins`, `minutes`, `tasks`, radio prefs
- [ ] Load on boot; version key so you can wipe if schema changes
- [ ] Coming back tomorrow must feel continuous

**Files:** `BedroomSlice.jsx` (PackItUp state), maybe tiny `save.js` — or keep in `gameAudio`-style module. Prefer one `pack-it-up-save` key.

### 3. Daily ritual (the “open it even when not packing” loop)
Pick **one** and ship it thin:
- [ ] **A.** Stretchy morning check-in (mood from yesterday’s pressure / cleared count)
- [ ] **B.** One “today’s paper” on the desk — stamp it → finished pile grows
- [ ] **C.** “Clear 3 things” daily quest chip on the HUD

Reward = visible pile / Stretchy reaction / soft chime — not a new meta-game.

**Files:** `Screens.jsx` (Desk or Stretchy), `tasks.js`, light state in `BedroomSlice.jsx`.

---

## P1 — Motivation systems (this week if P0 done)

### 4. Desk: finished pile
- [ ] Stamped / done job+admin cards stack into a satisfying physical pile
- [ ] Count badge (“12 filed”)
- [ ] Keep Papers-Please stamp feel you already have

**Files:** `Screens.jsx` Desk section, `tasks.js` status → `done`.

### 5. Live job tracker sync
- [ ] Read from [job-tracker-sandy-two.vercel.app](https://job-tracker-sandy-two.vercel.app) (or its API)
- [ ] Map into `SAMPLE_JOBS` / task shape in `tasks.js` (fields already match “future import”)
- [ ] v1 = **read-only** pull on Desk open; no write-back yet
- [ ] Fallback to sample jobs if offline

**Files:** `tasks.js`, `Screens.jsx` Desk, maybe `jobTracker.js`.

---

## P2 — Cool but don’t block hosting

### 6. Health: Operation-style board
- [ ] Replace placeholder zones with real “body board” interaction
- [ ] Wire health tasks to calm zones (shell already pulses)

**Files:** `Screens.jsx` Health section, `tasks.js` health category.

### 7. More storage contents / SFX polish
- [ ] Fill any thin containers; AGENTS.md pantry-pilot note is partly outdated (many rooms already have contents)
- [ ] Only if P0–P1 feel good

### 8. `CODEX_TASKS.md` pixel placement (dining/kitchen/living)
- [x] **DONE (Jul 9)** — original hand-off complete; only reopen if something is broken on phone

---

## Explicitly defer (deadly traps)

| Trap | Why wait |
|------|----------|
| Full UI / “the look” redesign | Endless; current Courier + wood frames already read as the game |
| Splitting `BedroomSlice.jsx` | Other sessions in flight; AGENTS.md says not yet |
| Perfect every sprite to mockup | Diminishing returns vs. daily ritual + save + host |
| Write-back job tracker + full CRM | Read-only sync is enough to feel real |

---

## Suggested weekend order

**Sat morning:** commit + Vercel + smoke test on phone  
**Sat afternoon:** localStorage save/load  
**Sat night / Sun:** daily ritual + desk finished pile  
**If time:** job tracker read-only  
**After renew / next week:** Operation health, CODEX pixel nits, more contents

---

## Definition of done (weekend)

You can text yourself a URL, open it on your phone, hear Cherry Blossom, pack something, come back tomorrow and it’s still packed, and stamp at least one desk paper into a growing pile.
