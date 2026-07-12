# Task card overlay calibration — session summary
**Date:** 2026-07-11
**Harness / model:** [Cursor / Grok 4.5]
**Branch:** `cursor` (merged to main: yes — `a41724e`)

### Done
- Wired horizontal (thin) + vertical (full) task-card PNGs into Command Board draw pile + hand fan (+ apartment corner fan)
- Built `/？cards=1` overlay layout designer (`src/dev/cardLayoutEditor.jsx`): drag/resize title·target·latest·bound B, pip dots, outline toggle, copy layout, localStorage draft
- Eloisa-tuned layout applied as `CARD_OVERLAY` in `Screens.jsx` (thin + full % + titleMaxPx/datePx)
- Full-card art: taller title frame / dates shifted down without moving footer (info bottom + bubbles pixel-identical)
- Dropped Critical Path strip; draw pane taller for ~2 thin cards; hand cards sized for board
- Clamped `VerticalTaskCard` min/max width so button min-content can’t blow cards to PNG intrinsic size
- Removed broken CSS-scale hand approach that clipped card bottoms; hand renders whole at 120px with scaled fonts from designer refW

### Still broken / unfinished (do next)
- **Subtle mismatch:** Board live cards still don’t pixel-match `/？cards=1` (Eloisa eye). Likely causes: hand at 120px vs designer full preview at 220px (font wrap / FitText), thin cards at live width vs designer 420px, residual pip/date micro-offsets
- Designer resize chrome was noisy (toned down); further polish optional
- Untracked extract folders under `packitup_cropped_assets/` — do not commit zips/extracts unless intentional

### Do not
- Do not rebuild Command Board / ledger / energy flow
- Do not force-push; do not ship Vercel until Eloisa says so (merge to main is close-out; prod push is hers)
- Do not re-run PNG title-frame redistribute that touches footer/bubbles without a footer pixel check

### Quick verify
1. `pnpm` vite on pack-it-up → open `http://127.0.0.1:8091/?cards=1` (flat designer)
2. Open Command Board hand + draw pile; compare overlays side-by-side with outlines hidden
3. Apartment corner fan stays small (~56px), not giant

### Suggested next-session order
1. **Codex:** calibrate live Board overlays to match `/？cards=1` (prompt below)
2. Then resume kitchen calendar portal / HUD chips if Eloisa wants product next

---

## Codex handoff prompt (copy-paste)

```
You are Codex (GPT-5.6 Sol), lead on the standing `codex` branch for Pack It Up.

## Identity / branch
- Pull `main` into `codex` first. Never work on `main` directly. Never force-push.
- Commit locally as you go; do not push to Vercel / prod unless Eloisa explicitly asks.
- Close out per `docs/ai-team/end-here.md` when done.

## Context (read these)
- `docs/sessions/2026-07-11-cursor-task-card-overlays.md` (this session)
- `HANDOFF.md` → points here
- Hard rules: `AGENTS.md` — game overlays live in `artifacts/pack-it-up/src/Screens.jsx`; no new game-feature files; no Tailwind.

## What’s already shipped (do NOT rebuild)
- Command Board energy + draw + hand
- Task card PNGs (thin horizontal / full vertical) wired in
- Layout designer at `/?cards=1` → `artifacts/pack-it-up/src/dev/cardLayoutEditor.jsx`
- Canonical overlay constants: `CARD_OVERLAY` + `H_PIP` / `V_PIP` in `Screens.jsx`
- Eloisa’s latest copied layout (already in `CARD_OVERLAY`):

### thin (HorizontalTaskCard) — designer refW 420
- title: left 2.4% / right 3.2% / top 30.1% / height 26.5% · titleMaxPx 13
- target: left 18.5% top 67.9% width 14% · latest: left 47.6% top 67.8% width 14% · datePx 9
- H_PIP unchanged (effort/importance centers + size 2.15)

### full (VerticalTaskCard) — designer refW 220
- title: left 8.2% / right 9.2% / top 21.7% / height 16.9% · titleMaxPx 12.5
- target: left 36.3% top 41.3% width 58% · latest: left 36.5% top 46.5% width 58% · datePx 10.5
- bound B: left 3.9% top 1.1% width 9.8% height 8.4%
- V_PIP unchanged (size 5.2)
- Board hand currently renders at width 120 with fonts scaled from refW 220

## Your job
Eloisa still sees subtle differences between:
1. Flat upright samples at `http://127.0.0.1:8091/?cards=1` (outlines hidden)
2. Live Command Board thin draw cards + full hand cards

Make the live Board match the designer as closely as possible (same relative placement of title, dates, bound B, pip fills; same visual weight of type). Prefer fixing one shared source of truth so designer defaults and Board stay in sync.

## Constraints / pitfalls already burned
- Do NOT CSS-scale a 220px card with a bad transformOrigin — last attempt clipped the bottom half of hand cards.
- Keep `minWidth`/`maxWidth` on `VerticalTaskCard` equal to `width` so `<button>` can’t expand to PNG intrinsic size (that made apartment/desk cards giant).
- Full-card PNG footer + bottom bubbles must stay put if you touch art; only overlay CSS/% unless Eloisa asks for art.
- No Tailwind / no new game feature files. Dev tool stays in `src/dev/`.

## Acceptance
- Side-by-side: `/？cards=1` (hide outlines) vs Board draw + hand — Eloisa can’t spot obvious drift in title box, dates, B, or pips.
- Apartment corner fan stays ~56px and fully on-screen.
- `CARD_OVERLAY` (or successor) remains the single paste target from the designer Copy button.
- Local commit on `codex`; merge to main at session end with signed DEVLOG + new session file.

## Out of scope
Kitchen calendar portal, HUD chips, Shirley stall, Stretchy meows, Vercel push.
```
