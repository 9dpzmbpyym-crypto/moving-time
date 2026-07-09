# Pack It Up — Agent Instructions

> Read this before touching anything. It will save you from breaking the game.

## What this is

A personal pixel-art moving game built with React + HTML canvas. The player walks through rooms of an apartment and decides what to pack, sell, or donate. No backend. No database. No UI libraries. Just one large game file.

## The only files that matter for the game

```
artifacts/pack-it-up/src/BedroomSlice.jsx   ← entire game (~3,300 lines)
artifacts/pack-it-up/src/main.tsx           ← 15-line entry point
artifacts/pack-it-up/src/layout.json        ← furniture X/Y positions per room
artifacts/pack-it-up/src/sell.mp3           ← sell sound
artifacts/pack-it-up/src/assets/Cat-Sheet.png ← cat sprite sheet
artifacts/pack-it-up/src/dev/spritePreview.jsx ← dev tool only
```

Everything else at the root is monorepo config. Do not touch it.

## BedroomSlice.jsx — where to look

Don't read the whole file. Find your section first:

| Lines | Content |
|-------|---------|
| 1–28 | Imports + stage size constants |
| 29–60 | Color palette (`P` object) + canvas helpers (`r`, `dith`, `outlineRect`) |
| 61–334 | Bedroom shell + sprites |
| 335–543 | Office shell + sprites |
| 544–772 | Bathroom shell + sprites |
| 773–961 | Kitchen shell + sprites + objects |
| 962–1162 | Dining room shell + sprites + objects |
| 1163–1428 | Living room shell + sprites + objects + box stack |
| 1429–1589 | ROOMS data model + ROOMS_ORDER + floor/ceiling helpers |
| 1590–1624 | PixelCanvas component + CATEGORY_COLORS |
| 1625–1790 | LayoutEditor (dev tool, `?edit=1` only) |
| 1791–1860 | Haptics + audio init |
| 1861–2017 | Stretchy the cat (sprite AI + animation loop) |
| 2018–3311 | PackItUp main component (state, game logic, mobile UI, desktop UI) |

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
