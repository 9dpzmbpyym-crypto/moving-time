# Pack It Up — Agent Instructions

> Read this before touching anything. It will save you from breaking the game.

## What this is

A personal pixel-art moving game built with React + HTML canvas. The player walks through rooms of an apartment and decides what to pack, sell, or donate. No backend. No database. No UI libraries. Just one large game file.

## The only files that matter for the game

```
artifacts/pack-it-up/src/BedroomSlice.jsx   ← entire hub + game (~3,800 lines)
artifacts/pack-it-up/src/Screens.jsx       ← full-screen overlays (Menu/Desk/Health/Storage/etc.)
artifacts/pack-it-up/src/contents.js       ← storage contents data (items inside cabinets/drawers)
artifacts/pack-it-up/src/tasks.js          ← task/urgency scaffold (sample data for the overlay shells)
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
| 1590–1650 | PixelCanvas component + CATEGORY_COLORS |
| 1650–1885 | Stretchy the cat (sprite sheet config + AI + animation loop) |
| 1885–2055 | LayoutEditor (dev tool, `?edit=1` only) |
| 2055–2090 | Haptics + audio init |
| 2091–3783 | PackItUp main component (state, storage feature, drawer glow, game logic, mobile UI, desktop UI) |

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

Fixed (don't re-fix): action timers are cancelled on unmount via the `schedule()`
registry in PackItUp — route any new game timers through it. Sale prices are
clamped to ≥ 0. The cat writes its position straight to the DOM and only
re-renders on sprite-frame changes.

## Next planned work

See `FINISH_PLAN.md` (weekend cut) and `DEVLOG.md` (Jul 5–9 history).

**P0:** host on Vercel, persist progress (`localStorage`), one daily ritual.  
**P1:** desk finished pile; read-only job tracker sync (`job-tracker-sandy-two.vercel.app`).  
**P2:** Operation-style health board; more contents polish only if P0–P1 feel good.

`CODEX_TASKS.md` dining/kitchen/living pixel list = **done** (Jul 9).  
Overlay screens in `Screens.jsx` (Desk/Health/Inventory/Log/Stretchy) are still mostly shells — Settings has volume sliders. Storage contents exist beyond the pantry pilot for most rooms.
