# Pack It Up — Instructions for Claude

## What this project is

A pixel-art moving game. The player walks through apartment rooms and packs, sells, or donates furniture. Personal motivation tool for a real move. No backend, no database, no UI framework.

## File map

```
artifacts/pack-it-up/src/
  BedroomSlice.jsx    ← the entire game (~3,300 lines). This is everything.
  main.tsx            ← mounts the game. 15 lines. Don't touch.
  layout.json         ← furniture positions (x, y, scale) per room
  sell.mp3            ← sell chime (base64-inlined at build time for iOS CSP)
  assets/Cat-Sheet.png ← Stretchy the cat sprite sheet
  dev/spritePreview.jsx ← developer-only tool, not part of the game
```

Root-level files (`lib/`, `scripts/`, monorepo config) are infrastructure. Leave them alone.

## BedroomSlice.jsx section map

| Lines | What |
|-------|------|
| 1–60 | Imports, constants, color palette `P`, canvas helpers |
| 61–334 | Bedroom (shell + sprites) |
| 335–543 | Office (shell + sprites) |
| 544–772 | Bathroom (shell + sprites) |
| 773–961 | Kitchen (shell + sprites + objects) |
| 962–1162 | Dining room (shell + sprites + objects) |
| 1163–1428 | Living room (shell + sprites + objects + box stack) |
| 1429–1589 | ROOMS model + ROOMS_ORDER + helpers |
| 1590–1624 | PixelCanvas component |
| 1625–1790 | LayoutEditor dev tool (`?edit=1`) |
| 1791–1860 | Haptics + audio |
| 1861–2017 | Stretchy the cat |
| 2018–3311 | PackItUp — main component (all state + logic + UI) |

## Rules

- All game code belongs in `BedroomSlice.jsx`. Do not create extra files for game features.
- No Tailwind. No Radix UI. No shadcn. None are installed. Use inline styles and canvas.
- Do not import: react-query, wouter, framer-motion, recharts, zod — not in package.json.
- For furniture layout changes, edit `layout.json`, not BedroomSlice.jsx.
- **Do not split BedroomSlice.jsx** — other harnesses have in-flight work. Split later.
- Do not touch anything outside `artifacts/pack-it-up/`.

## How pixel art sprites work

```js
const CELL = 4; // 1 sprite pixel = 4 screen pixels
const r = (ctx, color, x, y, w=1, h=1) => { ctx.fillStyle=color; ctx.fillRect(x,y,w,h); }
```
All sprites are drawn at low resolution and CSS-scaled with `image-rendering: pixelated`. Every piece of furniture is a `draw(ctx)` function inside a sprites object.

## Adding a new room

1. Add `drawXShell(ctx)` for walls/floor/window
2. Add `X_SPRITES = { itemName: { w, h, draw(ctx) } }` 
3. Add `X_OBJECTS = [{ id, name, category, value, sprite }]`
4. Add entry to `ROOMS` object (line ~1432)
5. Add room id to `ROOMS_ORDER` array (line ~1511)

## Adding a new sprite to an existing room

Add a new entry to the room's sprites object following the exact same pattern as existing ones. Use colors from the `P` palette. Use the `r()`, `dith()`, and `outlineRect()` helpers.

## Multi-harness

Always `git pull` before starting work. Always commit when done. Other sessions (Cursor, ChatGPT, Replit) may be working concurrently.

## Known issues — do not fix unless asked

- BedroomSlice.jsx should be split into modules eventually
- Unmanaged `setTimeout` calls (no cleanup on unmount)  
- Negative sale prices accepted without validation
- Cat animation rerenders the whole game (isolation needed)
