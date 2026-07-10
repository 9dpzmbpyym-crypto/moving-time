# Pack It Up — Agent Instructions

> Read this before touching anything. It will save you from breaking the game.

## AI team — who you are and what you may commit

Full operating model: `docs/ai-team/README.md`. Hierarchy runs by harness, not model IQ.

1. **Identify yourself first**: harness, model, permissions, task risk, and
   budget state (check usage if your harness shows it, otherwise ask Eloisa).
   Unknown? Ask: "Which harness/model am I right now?" Do not guess.
2. **Commit authority**: only harness leads commit by default — Grok 4.5
   (Cursor) and GPT-5.6 Sol (Codex). Luna: conditional, pre-approved scoped
   tickets only. Composer never leads commits. Fable commits docs/design
   only; repo code lands via Grok/Codex Sol.
3. **Routing**: tiny edit → Composer · structural/risky → Grok or Codex Sol ·
   thinking only → ChatGPT Sol · taste/voice/pixels → Fable/Opus ·
   long-context grind → GLM (paid API, ask first).
4. **Sub-agents**: delegation never raises authority — a sub-agent's work is
   its lead's commit. See the delegation contract in `docs/ai-team/README.md`
   and your harness playbook in `docs/ai-team/playbooks/`.
5. **Session lifecycle**: start at `docs/ai-team/start-here-<harness>.md`;
   close per `docs/ai-team/end-here.md` (update FINISH_PLAN, replace
   HANDOFF, append DEVLOG, push). One branch per session, named
   `harness/topic`; a session ends merged to main or with a HANDOFF line
   saying why not.
6. **Eloisa is final taste authority.** Warn about risk or cost; never
   overrule her taste.

Do not spend expensive intelligence on moving furniture. Do not let cheap
labor redesign the house. If you do not know who you are, ask. If the task
is outside your role, hand it off. If the task can break the house, do not
pretend it is moving the radio.

## What this is

A personal pixel-art moving game built with React + HTML canvas. The player walks through rooms of an apartment and decides what to pack, sell, or donate. No backend. No database. No UI libraries. Just one large game file.

## The only files that matter for the game

```
artifacts/pack-it-up/src/BedroomSlice.jsx   ← entire hub + game (~3,500 lines)
artifacts/pack-it-up/src/Screens.jsx       ← full-screen overlays (Menu/Desk/Health/Storage/etc.)
artifacts/pack-it-up/src/contents.js       ← storage contents data (items inside cabinets/drawers)
artifacts/pack-it-up/src/main.tsx          ← 15-line entry point
artifacts/pack-it-up/src/layout.json       ← furniture X/Y positions per room
artifacts/pack-it-up/src/sell.mp3          ← sell sound
artifacts/pack-it-up/src/assets/Cat-Sheet.png ← cat sprite sheet
artifacts/pack-it-up/src/dev/spritePreview.jsx ← dev tool only
```

Everything else at the root is monorepo config. Do not touch it.

## BedroomSlice.jsx — where to look

Line numbers below are approximate — the file grows as features land. Find your section by searching for the labels shown.

| Lines | Content |
|-------|---------|
| 1–30 | Imports + stage size constants |
| 30–60 | Color palette (`P` object) + canvas helpers (`r`, `dith`, `outlineRect`) |
| 60–335 | Bedroom shell + sprites |
| 335–545 | Office shell + sprites |
| 545–775 | Bathroom shell + sprites |
| 775–965 | Kitchen shell + sprites + objects |
| 965–1165 | Dining room shell + sprites + objects |
| 1165–1430 | Living room shell + sprites + objects + box stack |
| 1430–1590 | ROOMS data model + ROOMS_ORDER + floor/ceiling helpers |
| 1590–1625 | PixelCanvas component + CATEGORY_COLORS |
| 1625–1790 | LayoutEditor (dev tool, `?edit=1` only) |
| 1791–1860 | Haptics + audio init |
| 1861–2017 | Stretchy the cat (sprite AI + animation loop) |
| 2018–3560 | PackItUp main component (state, storage feature, drawer glow, game logic, mobile UI, desktop UI) |

`Screens.jsx` and `contents.js` are imported by BedroomSlice but kept as separate files (overlays + data, not game logic).

## Hard rules

1. **Game code goes in BedroomSlice.jsx** — do not create new game feature files
2. **No Tailwind** — zero Tailwind classes, not installed
3. **No UI component libraries** — no Radix, no shadcn, not installed. Draw UI with canvas or inline styles.
4. **Do not import** react-query, wouter, framer-motion, recharts, zod — not installed
5. **layout.json** = furniture positions. Edit it for layout, not BedroomSlice.jsx
6. **Do not split BedroomSlice.jsx** — other work is in flight. Leave it as one file for now.
7. **Do not touch** anything outside `artifacts/pack-it-up/` unless explicitly asked

## How sprites work

Each sprite is a function that draws onto a tiny canvas using pixel operations:
```js
const r = (ctx, color, x, y, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(x,y,w,h); }
```
`CELL = 4` — one sprite pixel = 4 screen pixels. Sprites are drawn at low-res and CSS-scaled with `image-rendering: pixelated`.

## How rooms work

Each room is an entry in `ROOMS` (line 1432). It has:
- `drawShell(ctx)` — draws the static background (walls, floor, windows)
- `sprites` — object of `{ name: { w, h, draw(ctx) } }` entries
- `objects` — array of `{ id, name, category, value, sprite }` entries

`ROOMS_ORDER` (line 1511) controls the pan order left→right.

## Audio

Web Audio API only — no `<audio>` tags. The sell chime is a base64-inlined MP3 decoded once and played via AudioContext. Do not change this pattern; it's required for iOS + the hosted CSP.

## Multi-harness note

This project is worked on from Replit, Claude.ai, Cursor, and ChatGPT/Codex.
- **Always `git pull` before starting**
- **Always commit when done**
- Never force-push

## Dev URLs

- Game: `/`
- Layout editor: `/?edit=1`
- Sprite preview: `/?preview=bed`

## Known tech debt (do not fix unless asked)

- BedroomSlice.jsx should eventually be split into modules — not yet
- `setTimeout` calls aren't cancelled on unmount
- Negative custom sale prices not validated
- Cat animation triggers full-game re-renders
