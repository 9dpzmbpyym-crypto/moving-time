# Pack It Up — Dev Log

> **Convention:** newest entries near the top, headers signed `## <date> — [<Harness> / <model>]` so we know who did what. Session detail lives in `docs/sessions/`.

Covers **July 5–10, 2026**. Combines:
- ChatGPT / design-session history (concept → art direction → assets)
- Git history in this repo (first commit **Jul 6**; coded game from **Jul 7**)
- Jul 9–10: audio/radio, save/session, Shirley landline

---

## 2026-07-12 — [Codex / GPT-5]
- Second screenshot pass: smaller Psychiatry/Dentist markers, paper lowered over the feet, Overview made viewport-filling without scroll, and Overview/apartment text placement refined.
- Added `/?ui=1` live layout editor with Body Board, Apartment, and Overview tabs plus persisted drafts, reset, JSON export, and paper-content X control; shortened nav labels to Bath/Dining/Living.
- Verified at 390×844 and 509×939; selected OB/GYN remains clickable and full typecheck/build pass.
- Session: `docs/sessions/2026-07-12-codex-body-board-apartment-text-2.md`
- Corrected Body Board zone coordinates for the enlarged figure; OB/GYN is visible and selectable above the raised detail paper.
- Raised the selected-zone sheet and added the mockup-matched content inset; selected-state interaction verified at 509×939.
- Repositioned apartment HUD values and room-navigation labels within existing chrome only; typecheck and production build pass.
- Session: `docs/sessions/2026-07-12-codex-body-board-apartment-text.md`

## 2026-07-12 — [Claude / Opus 4.8 + Fable 5] UI redesign from mockups + fixes
- 4 screens recreated from Eloisa's mockups (sliced UI sheets): Overview/Main menu, Command Board chrome (segmented energy control), Apartment HUD (wood/brass), Body Board — merged to main
- Fix pass: white boxes (de-matte + button-default-bg → backgroundColor:transparent), text overflow (apartment HUD room names/coins/days-left, Overview footer+header box-sizing bug), Body Board (bigger figure, legs behind note, note over legs, OB/GYN z-index), centered nav room names
- Same cycle earlier: Parts 1-5 (fan/board layout, perf patch, urgency engine + effort deal), procedural calendar, asset reorg, scheduler adoption
- Deferred: Part 7 (task↔gameplay wiring — packing↔task, health↔Shirley) still stashed; needs a fresh run
- Session: docs/sessions/2026-07-12-claude-ui-redesign-overnight.md

## 2026-07-11 — [Claude / Fable 5] Scheduler adoption ruling
- Adopted ChatGPT's full scheduler spec with 4 binding amendments (editable dates via existing Ledger editor, explainable bindings, tone guard, absolute save protection) — `docs/design/scheduler-adoption.md`
- Re-cut to Eloisa's bar (usable tonight/tomorrow): engine on existing board first, presentation after; ticket atop FINISH_PLAN; paste-ready Codex prompt in `docs/inbox/handoff-codex-scheduler.md`
- Session: `docs/sessions/2026-07-11-claude-scheduler-adoption.md`

## 2026-07-11 — [Codex / GPT-5.6 Sol] Task-card overlay pixel match
- Made `CARD_OVERLAY` the live/designer source of truth; removed hidden editor geometry and pip/type rendering drift
- Preserved 120px Board hand, 56px apartment fan, card width clamps, and PNG footer art; typecheck/build pass
- Session: `docs/sessions/2026-07-11-codex-task-card-pixel-match.md`
## 2026-07-11 — [Cursor / Grok 4.5] Task card overlays + layout designer
- Wired thin/full task-card PNGs into Board draw + hand (+ apt fan); built `/？cards=1` overlay designer (drag/resize, bound B, outline toggle, copy)
- Applied Eloisa `CARD_OVERLAY` layout; taller full title frame without moving footer; clamped card minWidth; fixed clipped-hand CSS-scale mistake
- Session `docs/sessions/2026-07-11-cursor-task-card-overlays.md` — Codex owns remaining Board↔designer pixel match
- Left for Codex: subtle live vs designer drift (prompt in session file)

## 2026-07-11 — [Cursor / Grok 4.5] Command Board + ledger (Jul 15 nag)
- Menu → Command Board: energy check-in, ≤3 picks, critical-path strip, Go/Done
- Ledger page-flip + quick-add sticky; Desk Housing tray + Messages 10 / Backups 5
- Shirley Settings refuse empty key/model wipe; session `docs/sessions/2026-07-11-cursor-command-board.md`; merge to main

## 2026-07-11 — [Cursor / Grok 4.5] Perf patch + Shirley Pass 1 + Fable queue
- Standing `cursor` branch from main; tiny OpenRouter/usage safety + per-minute HUD clock + dead test-call removal
- Audio raw-ES cleanup; kitchen 4 zones; hard-case guitar; bowls pinned; crop guard; toiletries/tote containers; ringtone radio duck; glow shrink
- Shirley Pass 1 prompt + thin bank from move-spine; session `docs/sessions/2026-07-11-cursor-perf-shirley-queue.md`; merge to main

## 2026-07-11 — [Codex / GPT-5.6 Sol] Productivity core data layer
- Replaced fictional sample tasks with the real move/housing/jobs/admin/health/Stretchy manifest and effort metadata
- Added the calendar spine and deadline-loudness Pressure v2 data contract, including cat-only `stretchyStress`
- Added save v2 migration that preserves phone progress and saved task status; verified typecheck, migration fixture, and production build
- Session: `docs/sessions/2026-07-11-codex-productivity-core.md`
## 2026-07-11 — [Claude / Fable 5 + Opus 4.8] Design sprint: move-spine integration
- ChatGPT perf/alignment reviews code-verified (Opus) and folded into FINISH_PLAN; two overclaims corrected; Shirley "live badge lies" diagnosis written into the ticket
- Claude `start-here.md` added — per-team onboarding set complete
- Move-spine design layer: energy dispatch (Fumes/Steady/Full tank), ledger page, pinned goals, seed-task manifest (~35 missing items), NPC casting, calendar spine + kitchen wall-calendar prop, Pressure v2 + Stretchy stress decoupling, companion gaps (2-tap rule, quick-add, phone=canon/migrate-never-wipe)
- Sequencing decided: data drop + ledger jump ahead of Shirley Pass 1 (sublet locks Jul 15); Codex + Cursor handoff prompts delivered in-chat
- Interim phone reminders live via Claude session push relay; nag mandate added to AGENTS.md
- Session: `docs/sessions/2026-07-11-claude-design-sprint.md`

## 2026-07-11 — [Codex / GPT-5.6 Sol] Agent ledger coordination
- Added the machine-readable agent ledger, ESM updater, coordination cross-links, and Fable resume trail; no game behavior changed
- Added the sparse/modular Body Board background v2 as an uninstalled Fable review asset; tactile-prop UI direction remains taste-review pending

## 2026-07-11 — [Cursor / Grok 4.5]
- Storage fills + env props: `contents.js` homes, procedural router/cat bed/bowls/amp, packable hutch + coffee-table books, Eloisa layout in `layout.json`
- Temporary acoustic guitar PNG in living (replace with electric or case); Wi‑Fi z above desk so selectable
- Container SFX / Shirley ringtone / music-duck passes already on branch; Vercel https://moving-time.vercel.app
- Folded Fable’s 5 playbook review answers; session `docs/sessions/2026-07-11-cursor-storage-env-props.md`; merge close-out

## July 10, 2026 — [Codex / GPT-5.6 Sol] Codex team configuration

- Replaced the Codex playbook stub with the real delegation, authority, review, usage, and failure-handling contract
- Added pinned project agents: Luna/high for approved narrow implementation and Terra/medium for read-only exploration
- Capped agent fan-out at three threads and one level; required exact agent selection with no silent fallback
- Added the append-only Codex session report; no game code or canonical plan items changed

---

## July 11, 2026 — [Claude / Fable 5] Playbook reviews + file audit + branch cleanup

- Reviewed Codex Sol onboarding (exemplary: pinned agents, proper ritual) and Grok's playbook (excellent; ritual backfill due at its close-out); answered Grok's 5 embedded review questions
- Audio audit: 7 raw Epidemic Sound files flagged (2 at repo root); cleanup ticket in FINISH_PLAN; naming rule added to README_AUDIO_INDEX.txt
- Deleted 6 fully-merged stale branches; unique work parked as archive/* branches; standing `cursor` branch blocked until storage-glow merges (sequence in FINISH_PLAN)

---

## July 10, 2026 — [Claude / Fable 5] AI team operating model + docs/branch reorg

- Org chart redesign + full operating model (`docs/ai-team/`): commit ladder, routing, sub-agent contract, per-team folders
- Corrected benchmark data + rebuilt all 13 scatter graphs (Composer added as flagged estimate)
- Session lifecycle: `docs/sessions/` append-only archive, `end-here.md` ritual, signed DEVLOG convention
- Branch model: `main` = canon, standing `cursor`/`codex` branches, Claude merge-and-delete; stale branches archived as tags
- Instruction files consolidated: `AGENTS.md` is the single copy; `CLAUDE.md`/`replit.md`/`.cursor/rules` are shims

---

## July 10, 2026 — [Cursor / Grok + Composer] Shirley landline + storage glow handoff

### Shipped
- Desk **landline ceremony** (pickup → dial → ring → call UI) + OpenRouter improv with bank fallback
- `receptionist.js` / `receptionistCall.js`; appointments persisted in `save.js`; Body Board attend gated on booked+due
- Storage glow unify: all containers on `.drawerGlow` / `glowRegions`; edge-only halo (no green fill); closet/fridge/pantry off `faceGlowRegions`; storage no longer falls back to silhouette `.portal` (mirror keeps portal)
- Plan consolidated: **`FINISH_PLAN.md`** = short + long SoT; **`HANDOFF.md`** = latest session report; agent docs only point there

### Outstanding (carry forward)
- **Glow still looks wrong:** same code path, but fridge/pantry/closet `glowRegions` cover most of the sprite → full-object aura vs bar/vanity door halo. Next fix = shrink those rects; compare dining bar vs kitchen fridge vs bath vanity
- **Shirley voice:** ChatGPT style/ruleset prompt as source of truth — do **not** paste example convos into line banks; then rebuild `SHIRLEY_SYSTEM_PROMPT` / thin bank; stall→hang-up + objective cadence
- **SFX:** replace room-switch (`sfx/ui/room_switch_01.mp3`) + cabinet open/close; more clips incoming; prefer `public/assets/audio/` only (leave `src/assets/audio/` untracked duplicate)
- **Ship:** Vercel deploy + phone smoke (audio prime, save, desk phone)
- **Systems still open:** Stretchy morning check-in; job-tracker read-only → Desk; soft Rejected stamp / labeled boxes / thin storage contents
- **Dev note:** game on `http://localhost:8091/` from Projects repo — ignore Downloads copy on 8090 if still running

### Branch
`cursor/storage-glow-7a01` — glow unify + plan/handoff commits; see `HANDOFF.md` for next-session order

---

## Overview

Between July 5 and July 9, Pack It Up moved from a loose productivity/game idea into a real early-stage game: emotional premise, visual direction, six-room apartment, item taxonomy, Stretchy, sprite workflow, audio rules, and a working interactive build.

The original problem was not “make a cute moving game.” It was: how do you make a terrifying life transition feel concrete enough to act on? Packing, selling, job apps, admin, and wellness needed to be visible, structured, and rewarding.

By end of July 9 the project had a playable apartment, storage + item art, Stretchy, and a full sound/radio layer (partly still uncommitted).

---

## July 5, 2026 — Concept formation (“Side Quest” → Pack It Up)

First known game-dev work: conversation **“App idea: Side Quest.”** Shift from general move logistics help into an actual game/app concept.

Ideas locked in:
- Gamify packing, selling, job apps, admin, wellness
- Cozy apartment diorama that changes as you clear it
- Desk/card system (Papers, Please energy)
- Wellness / body-map screen
- Room → boxes → items → daily actions
- Tone: cozy game × moving simulator × productivity tool

Influences noted: Unpacking, Habitica/Duolingo, Dave the Diver, Papers Please, Potion Craft, Do Not Feed the Monkeys, gentle completion bars.

**Original mockups** (saved under `artifacts/pack-it-up/docs/mockups/`):
1. **Paperwork Desk** — trays, stamps, outbox, drag-to-process
2. **Hub dashboard** — room strip + cards in hand + body meters + days left
3. **Apartment diorama** — side cutaway + Death Closet + labeled boxes
4. **Body Board** — Operation zones + care items + appointments

These are denser than the current playable build; they remain the emotional north star for Desk / Health / daily ritual — not a mandate to rebuild the apartment as a cutaway.

**Milestone:** coherent product idea, not just a coping mechanism.

*Not in this git repo yet as code — design/chat + mockup images.*

---

## July 5–6, 2026 — Bedroom vertical slice (buildability)

Bedroom became the first test case: layered sprites, palette, canvas-like structure, objects as independent drawables.

Question shifted from “can this look cute?” to “can this be built?”

---

## July 6, 2026 — Visual direction + constraints

Pivoted away from perspective grids / photo-matching 3D-ish rooms.

**Decision:** simple flat low-detail pixel art — thin dark outlines, muted cozy palette, readable silhouettes, portrait mobile compositions, stylized back-wall scenes.

**Git:** `Initial commit` (repo born).

---

## July 6–7, 2026 — Core apartment room system

Room order settled:
1. Bedroom → 2. Bathroom → 3. Office → 4. Dining → 5. Kitchen → 6. Living

Principle: emotionally accurate and mechanically useful, not photorealistic. Furniture can be rearranged for playable clarity.

---

## July 7, 2026 — Full room art direction + first coded game

### Design (ChatGPT / mockups)
Biggest visual production day — dining, kitchen, living, office, bathroom, bedroom pushed into one style. Highly specific art direction (knobs, drawers, chair orientations, gaps). Transition from image generation to **enforceable art direction**.

### Code (git — dense day)
- Vite + React bedroom slice scaffold
- Bed sprite WIP / preview harness
- Pack / Sell / Donate + undo stack
- Sell FX + cash-register chime
- Bathroom + office furnished
- Mobile portrait UI + six-room pan
- Ceiling band / horizon / scale passes
- Curtains removable (donate = leave-behind)

**Milestone:** apartment is a progress map you can click.

---

## July 7–8, 2026 — Tooling / phone-first survival

Hit AI credit limits; investigated Claude, Codex, Cursor, Replit, OpenRouter, GLM. Phone-friendly, cost-sustainable workflow became part of the project’s survival — not a side quest.

---

## July 8, 2026 — Items, Stretchy, six rooms complete

### Design / assets
- Item taxonomy + sheets (kitchen, clothes/makeup, personal/office, bar/entertainment/cat, extras)
- Rule: **3–6 tiny sprites max per open container**
- Stretchy animation direction from orange cat sprite set
- README + **CODEX_TASKS.md** pixel hand-off written

### Code (git)
- Kitchen, dining, living furnished (**all six rooms complete**)
- Layout editor + official `layout.json`
- Stretchy the cat
- Pack-to-box, bigger box pile, haptics
- Sell sound as real file (iOS mute-switch friendly)
- Next-layer screens + task scaffold (`Screens.jsx`, `tasks.js`)

---

## July 9, 2026 — Storage, Stretchy assets, audio, radio

### Design / assets (ChatGPT context)
- Stretchy extraction from Aseprite / Cat-Sheet (32×32, frames 203/208/209 → 128px centered)
- Meow behavior: rare, after idle→walk, long cooldown (not constant)
- Storage open/close SFX mapping by furniture family
- Boombox / radio personality object requested (front-facing, low-pixel)

### Code (git — committed)
- Storage feature + drawer glow
- PNG item art pipeline → contents thumbnails
- Pack/sell/donate storage contents + pack-to-box fly
- Stretchy perf (DOM position, frame-only re-renders)
- Sale price ≥ 0; timers cancelled on unmount
- Agent docs; scaffold cleanup
- Storage panel polish

### Code (uncommitted — tonight)
- Full `gameAudio.js` (music + SFX singleton)
- Cherry Blossom + living-room radio (6 stations, diegetic sprite, random-on)
- One-song-at-a-time (stop → 1s silence → next); RMS level; volume −50%
- Container / pack / stamp / room-switch / meow SFX; settings sliders
- Bedroom ↔ living nav loop; radio on TV hutch

---

## Production milestones (rolled up)

| Area | Done |
|------|------|
| Concept | Premise, loops, apartment / desk / wellness split |
| Visual | Flat pixel language, six rooms designed + coded |
| Assets | Item sheets, contents in most containers, Stretchy sheet |
| Character | Stretchy walks, rare meows, profile sprites |
| Audio | Sell → full SFX + music + radio (night work) |
| Tooling | Multi-harness (Cursor / Claude / Replit / Codex) |

---

## Layout / CODEX_TASKS status

The Jul 8 **CODEX_TASKS.md** pixel placement list (dining window/chairs, kitchen gaps/door, living back-wall lineup, etc.) is **COMPLETE** as of Jul 9 — marked done in `CODEX_TASKS.md`. Do not re-open as a week-long art pass unless something is broken on phone.

---

## How to update this log

```bash
git log --since=midnight --pretty=format:"- %s" -- artifacts/pack-it-up/
```

Append under today’s date; note uncommitted work separately until committed.
