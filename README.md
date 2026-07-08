# Pack It Up

A cozy pixel-art "moving out" game. You walk through a six-room apartment and, for
each object, **Check** it (read its flavor text), then **Pack** it (take it to the new
place), **Sell** it (log a real resale price — the owner uses this to track actual
move-sale money), or **Donate** it (give it away, no money). Progress is tracked per
room; **Undo** reverses any action.

Everything is drawn procedurally on `<canvas>` — there are **no image assets**. All the
pixel art is code (chunky flat fills), a deliberate choice so every object can be an
independent, clickable, packable sprite.

## Run it

```bash
npm install
npm run dev      # Vite dev server, hot reload
npm run build    # production build → dist/
npm run preview  # serve the built bundle
```

Plain Vite + React 18. No UI framework, no CSS files — all styling is inline JS style
objects plus one `<style>` block inside the component. Do not add Tailwind/MUI/etc.

There is a dev-only sprite preview harness at `src/dev/spritePreview.jsx`, reachable at
`?preview=bed`. Safe to ignore or delete.

## Where everything lives

The **entire game is one file**: `src/BedroomSlice.jsx` (~2000 lines). `src/main.jsx` is
the entry point. The filename is historical — it started as just the bedroom.

File layout, top to bottom:
1. Constants + palette (`P`) + canvas helpers (`r`, `dith`, `outlineRect`)
2. `drawShell` + `SPRITES` + `ROOMS.bedroom` (the original room)
3. Placeholder-shell / floor-extension / ceiling helpers
4. `drawKitchenShell` / `KITCHEN_SPRITES` / `KITCHEN_OBJECTS`, and the same trio for
   dining and living
5. `ROOMS_ORDER`, the `ROOMS` object, per-room wiring
6. `PixelCanvas` component, coin-burst config, embedded audio
7. `PackItUp` — the whole app component (state, actions, mobile layout, desktop layout)

## The coordinate system (read this before touching sprites)

- Art is drawn in low-res **cells**. `CELL = 4` screen px per cell.
- The stage is `STAGE_W = 960` × `STAGE_H = 720` px = **240 × 180 cells**.
- The **wall meets the floor at cell y = 112**, i.e. **px y = 448**. This is "the floor
  line" / "the horizon" — memorize it.
- Each **sprite** is `{ w, h, draw(ctx) }` where `w`/`h` are in **cells** and `draw` uses
  cell coordinates local to the sprite's own top-left.
- Each **object** in a room's `objects[]` is
  `{ id, name, category, x, y, z, removable, value?, check }` where **`x`/`y` are screen
  px** marking the sprite's **top-left corner** on the stage.
- An object's **baseline** (where it visually meets the floor) = `y + spriteHeightCells *
  CELL`. To rest an object on the floor line, aim its baseline near px 448+. To rest item A
  on top of furniture B, set A's baseline a few px into B's top surface.
- **z** = layer: `1` flat on floor (rugs), `2` wall-mounted (art, mirrors), `3` furniture
  on floor, `4` items on furniture, `5` small items on top of those. Within a z, draw order
  is by baseline (lower on screen = drawn later = in front).

### Drawing helpers (use only these)

```js
r(ctx, color, x, y, w=1, h=1)               // filled rect (the workhorse)
dith(ctx, color, x, y, w, h, step=2, off=0) // checkerboard dither (texture/shading)
outlineRect(ctx, color, x, y, w, h)         // 1px hollow rectangle
```

Style rules that keep the art coherent: every piece gets a `P.out` (near-black) outline;
2–3 flat tone steps per surface (base + a highlight cap on the top edge + a shadow edge,
often via `dith`); **no gradients**; chrome/metal is `#B8AE96`. The `P` object holds all
named colors — prefer it; use hex literals only for one-off accents.

## The six rooms

Ordered strip you pan through: **bedroom → bathroom → office → dining → kitchen → living**
(`ROOMS_ORDER`). Each is `ROOMS[id] = { id, name, drawShell, floorKind, ceilTones,
sprites, objects }`.

- `floorKind`: `"plank"` | `"tile"` | `"bathtile"` — picks which `extendFloor*` function
  continues the floor downward on tall mobile screens. **A shell's own floor block and its
  matching `extendFloor*` function must stay pixel-identical** or you get a visible seam.
- `ceilTones: [shadeColor, wallColor]` — the mobile ceiling band is the room's upper wall
  in shadow, drawn from these.
- Fixtures that stay with the apartment (tub, toilet, sink, stove, fridge, etc.) are
  `removable: false` with flavor text explaining why. Everything else is packable /
  sellable / donatable. Curtains belong to the tenant, so they're removable everywhere.

## Object + money state

- `objState[sk(roomId, id)] = { packed, sold, soldFor, donated }`. **State is namespaced by
  room** via `sk(roomId, id)` so ids can't collide across rooms. Always go through `sk()`.
- Actions: `packObject`, `sellObject`, `donateObject`, plus `unpackObject` /
  `unsellObject` / `undonateObject`. Each pushes a snapshot to `undoStack`; `undoLast()`
  pops and restores. Undo entries carry their `roomId`, so undo works across rooms.
- `coins`, `minutes` (in-game clock), and derived `clearedCount`/`total` drive the HUD.
- **Sell FX** (coin burst + floating "+$amount" + sound) is positioned relative to the
  *scaled stage div*, not the viewport. Keep it a descendant of the stage; moving it to a
  differently-transformed ancestor makes the burst drift off the object.

## Mobile vs. desktop layout

`useIsMobile()` (`matchMedia("(max-width: 760px)")`) forks the render:

- **Desktop** keeps the original model: the whole 960×720 stage (art + HUD + panels) is
  uniformly `transform: scale()`-d to fit. Only shows the bedroom.
- **Mobile** is the real product. Room art and UI chrome scale **independently**:
  - Room art is zoomed `ZOOM = 1.15` past width-fit; the doorway frame's `overflow:hidden`
    crops the outer sliver so furniture reads big.
  - A **ceiling band** is sized so the floor line lands near mid-screen; the floor is
    procedurally extended below it to fill the tall viewport.
  - HUD (top), bottom action bar (Check/Pack/Sell/Donate/Menu), and bottom sheets are real
    flex/dvh CSS at native size — they never shrink with the art.
  - **Panning**: a flex row of room stages translated by `currentRoomIndex`; arrow buttons
    plus pointer-drag with snap-to-nearest and hard clamping at the ends.
  - Selecting an object opens a **bottom sheet** with its detail + actions; Menu opens the
    inventory sheet.
  - Decorative only: the 3-card paper fan (2 Job App + 1 Admin) and "Tasks (soon)". **No
    systems behind them** — visual placeholders.

## Two gotchas that cost real debugging time

1. **Audio must be decoded via `atob` → `Uint8Array` → `decodeAudioData`, never
   `fetch(dataURI)`.** The hosted preview page's CSP has no `data:` in `connect-src`, so
   `fetch` on a data URI is silently blocked there (works on the dev server, dead on the
   hosted build). See the comment above `SELL_CHIME_SRC`.
2. **Don't fake silent audio priming by muting an `<audio>` element** — iOS ignores the
   `volume` property and plays it aloud. The code primes the Web Audio context on first tap.

## Verifying visual changes

Playwright is **not** a dependency — install temporarily, verify, remove before committing:

```bash
npm install --no-save playwright
# drive a phone-sized viewport, screenshot, inspect
npm uninstall --no-save playwright playwright-core
```

Use `executablePath: "/opt/pw-browsers/chromium"` if Chromium is pre-installed; otherwise
`npx playwright install chromium`. Screenshot an iPhone-ish viewport (390×844) and actually
look before calling a visual change done — reading the code isn't enough for pixel work.

## Current status

All six rooms are furnished and interactive. Ongoing work is visual polish (sizing,
placement, matching reference mockups). The next specific, pixel-level fixes are written up
in **CODEX_TASKS.md**.

Reserved-but-unbuilt future systems (visual space only, no logic): Tasks, Desk/Documents,
Health/Body, a Sold/Donated log, a "stretchy" status, Settings. Don't build these unless
asked.
