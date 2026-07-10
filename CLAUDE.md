# Pack It Up — Instructions for Claude

## What this project is

A pixel-art moving game. The player walks through apartment rooms and packs, sells, or donates furniture. Personal motivation tool for a real move. No backend, no database, no UI framework.

## File map

```
artifacts/pack-it-up/src/
  BedroomSlice.jsx    ← the entire hub + game (~3,800 lines). This is everything.
  Screens.jsx         ← full-screen overlays (Menu/Desk/Health/Storage/etc.)
  contents.js         ← storage contents data (items inside cabinets/drawers)
  tasks.js            ← task/urgency scaffold (sample data for the overlay shells)
  main.tsx            ← mounts the game. 15 lines. Don't touch.
  layout.json         ← furniture positions (x, y, scale) per room
  sell.mp3            ← sell chime (base64-inlined at build time for iOS CSP)
  assets/Cat-Sheet.png ← Stretchy the cat sprite sheet
  dev/spritePreview.jsx ← developer-only tool, not part of the game
```

Root-level files (`lib/`, `scripts/`, monorepo config) are infrastructure. Leave them alone.

## BedroomSlice.jsx section map

Line numbers below are approximate — the file grows as features land. Search for the labels shown.

| Lines | What |
|-------|------|
| 1–60 | Imports, constants, color palette `P`, canvas helpers |
| 60–335 | Bedroom (shell + sprites) |
| 335–545 | Office (shell + sprites) |
| 545–775 | Bathroom (shell + sprites) |
| 775–965 | Kitchen (shell + sprites + objects) |
| 965–1165 | Dining room (shell + sprites + objects) |
| 1165–1430 | Living room (shell + sprites + objects + box stack) |
| 1430–1590 | ROOMS model + ROOMS_ORDER + helpers |
| 1590–1650 | PixelCanvas component |
| 1650–1885 | Stretchy the cat |
| 1885–2055 | LayoutEditor dev tool (`?edit=1`) |
| 2055–2090 | Haptics + audio |
| 2091–3783 | PackItUp — main component (all state + logic + UI, incl. storage feature + drawer glow) |

`Screens.jsx` and `contents.js` are imported by BedroomSlice but kept separate (overlays + data, not game logic).

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

Fixed (don't re-fix): action timers are cancelled on unmount via the
`schedule()` registry in PackItUp — route any new game timers through it. Sale
prices are clamped to ≥ 0. The cat writes its position straight to the DOM and
only re-renders on sprite-frame changes.

## Next planned work

See `FINISH_PLAN.md` (weekend cut) and `DEVLOG.md` (Jul 5–9 history).

**P0:** host on Vercel, persist progress (`localStorage`), one daily ritual.  
**P1:** desk finished pile (toward Paperwork Desk mockup); read-only job tracker sync.  
**P2:** Operation-style health board (toward Body Board mockup); contents polish only if P0–P1 feel good.

Original concept mockups: `artifacts/pack-it-up/docs/mockups/`.  
`CODEX_TASKS.md` dining/kitchen/living pixel list = **done** (Jul 9).  
Overlay screens in `Screens.jsx` are still mostly shells (Settings has volume). Storage contents exist beyond the pantry pilot for most rooms.
