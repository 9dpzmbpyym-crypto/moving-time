# Pack It Up

A personal pixel-art moving game. The player walks through each room of their apartment and decides what to pack, sell, or donate — motivation to actually get through a real move.

## What this project actually is

A single-page React app. No backend, no database, no API. Just one big game file rendered in the browser using HTML `<canvas>` elements and inline styles. Everything the game does lives in one file.

## Where everything lives

```
artifacts/pack-it-up/         ← the entire game lives here
  src/
    BedroomSlice.jsx          ← THE hub + game. All ~3,800 lines. Do not split yet.
    Screens.jsx               ← full-screen overlays (Menu/Desk/Health/Storage/etc.)
    contents.js               ← storage contents data (items inside cabinets/drawers)
    tasks.js                  ← task/urgency scaffold (sample data for the overlay shells)
    main.tsx                  ← 15-line entry point. Just mounts the game.
    layout.json               ← Furniture X/Y positions for every room.
    sell.mp3                  ← Sell chime sound effect.
    assets/Cat-Sheet.png      ← Stretchy the cat sprite sheet.
    dev/spritePreview.jsx     ← Dev-only sprite tester (?preview=bed). Not for players.
  vite.config.ts              ← Build config. Don't change unless you know why.
  package.json                ← Only 10 deps. Keep it that way.
```

Everything else at the root (`lib/`, `scripts/`, `artifacts/api-server/`) is monorepo infrastructure. **Leave it alone.**

## BedroomSlice.jsx section map

Because the file is large, here's where things are so you don't have to read all of it. Line numbers are approximate — search for the labels shown.

| Lines | What's there |
|-------|-------------|
| 1–28 | Imports + stage constants (CELL, STAGE_W, STAGE_H) |
| 29–60 | Color palette (the `P` object) + tiny canvas helpers |
| 60–335 | **Bedroom** — shell (walls/floor) + all furniture sprites |
| 335–545 | **Office** — shell + sprites |
| 545–775 | **Bathroom** — shell + sprites |
| 775–965 | **Kitchen** — shell + sprites + objects list |
| 965–1165 | **Dining room** — shell + sprites + objects list |
| 1165–1430 | **Living room** — shell + sprites + objects list + box stack sprite |
| 1430–1590 | ROOMS data model + floor/ceiling helpers + ROOMS_ORDER |
| 1590–1650 | PixelCanvas component + category colors |
| 1650–1885 | **Stretchy the cat** — sprite animation + wander AI |
| 1885–2055 | **LayoutEditor** — dev tool only, visible at `?edit=1` |
| 2055–2090 | Haptics + audio setup |
| 2091–3783 | **PackItUp** — main game component, all state + logic + mobile + desktop UI (incl. storage feature + drawer glow) |

`Screens.jsx` and `contents.js` are imported by BedroomSlice but kept as separate files (overlays + data, not game logic).

## Rules for any AI working on this

1. **All game code goes in BedroomSlice.jsx** — don't create new files for features unless explicitly asked
2. **No Tailwind, no UI component libraries** — the game draws everything with canvas and inline styles. There are no installed UI packages to use.
3. **Do not import** from react-query, wouter, framer-motion, recharts, or any @radix-ui/* — none are installed
4. **layout.json** controls furniture positions — for layout tweaks, edit that file, not BedroomSlice.jsx
5. **Do not split BedroomSlice.jsx yet** — in-flight work from other sessions needs to land first. Flag it as future work.
6. The `dev/spritePreview.jsx` file is a developer tool, not a game feature. Don't add game logic to it.

## Multi-harness workflow (important)

This game is being worked on across multiple AI tools (Replit, Claude, Cursor, ChatGPT/Codex). To avoid overwriting each other:

- **Always `git pull` before starting work**
- **Always commit when you're done** with a clear message
- **Never force-push** unless you know what's on the remote

## Running the game

```bash
pnpm --filter @workspace/pack-it-up run dev
```

Then open the preview. The game runs at `/`.

Dev tools:
- `?edit=1` — layout editor (drag furniture to set positions)
- `?preview=bed` — sprite preview tool

## Known issues to fix eventually

- BedroomSlice.jsx should be split into modules (sprites, game state, UI, cat, audio)

Fixed (don't re-fix): action timers are cancelled on unmount via the
`schedule()` registry in PackItUp — route any new game timers through it. Sale
prices are clamped to ≥ 0. The cat writes its position straight to the DOM and
only re-renders on sprite-frame changes.

## Next planned work

Wire real systems into the placeholder overlay screens in `Screens.jsx`
(Menu/Desk/Health/Inventory/Log/Stretchy/Settings are visual shells), and fill
in storage contents for rooms beyond the pantry pilot in `contents.js`.
