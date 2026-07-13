# Asset map — what's actually used vs source clutter

This tree mixes shipped assets with large source/intermediate art. To save agents
from hunting (and to stop anyone importing the wrong copy), here's the ground truth
as of **Jul 13, 2026**.

## USED at runtime — do not move/rename without updating imports

| Path | How it's loaded | Used by |
|------|-----------------|---------|
| `normalized/*.png` | `import.meta.glob(".../normalized/*.png")` | `contents.js` — every inventory item sprite |
| `manifest.json` | static import | `contents.js` — item metadata (maps to `normalized/`) |
| `ui_mockups/board_slices/*.png` | static imports | `Screens.jsx` Command Board chrome |
| `ui_mockups/health_slices/*.png` | static imports | `Screens.jsx` Body Board chrome |
| `ui_mockups/menu_slices/*.png` | static imports | `Screens.jsx` Menu chrome |

Also used, but one level up in `src/assets/` (not in this folder):
`ui_chrome/`, `ui_screen_chrome/`, `items/task_card_assets/{horizontal,vertical}/`
(the **real** task-card PNGs), `splash.png`, `landline-phone.png`,
`health-clipboard.png`, `Stretchy Icon.png`, `Cat-Sheet.png`.

**Task cards** = the shared `VerticalTaskCard` / `HorizontalTaskCard` components in
`Screens.jsx`, which render `task_card_assets/`. There is no bespoke "drawn desk
card" — the Desk, Command Board hand, and ledger all use the same card component.

## SOURCE / INTERMEDIATE — MOVED OUT of `src/` (Jul 13)

The ~46 MB of unimported source art that used to clutter this folder now lives in
**`artifacts/pack-it-up/asset-sources/`** (loose mockups, `source_sheets/`,
`by_room/`, `contact_sheets/`, `pack_it_up_individual_cards/`, `raw_crops/`). See
`asset-sources/README.md`. Nothing imports it; it's reference only. This folder now
contains only shipped assets + metadata (`manifest.json`, `manifest.csv`,
`README.txt`).

Already deleted (Jul 13): `packitup_cropped_assets.zip` (10 MB archive),
`task_card_assets_pack/` (exact duplicate of `task_card_assets/`), `src/sell.mp3`
(orphan; sell chime is base64-inlined).
