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

## SOURCE / INTERMEDIATE — not imported, safe to archive or delete

Kept only as source material; nothing in code imports these. They're ~44 MB of
clone weight and the main reason this folder is confusing.

| Path | What it is | Size |
|------|-----------|------|
| `ui_mockups/*.png` (loose root files) | Original full UI mockups + source sheets the `_slices/` were cut from. Canonical mockups already live in `docs/mockups/`. | ~35 MB |
| `source_sheets/` | Original sprite source sheets | ~3.3 MB |
| `contact_sheets/` | Preview contact sheets | ~2.5 MB |
| `by_room/` | Per-room organization of the same crops that ended up in `normalized/` | ~1.9 MB |
| `pack_it_up_individual_cards/` | Loose individual card art | ~0.6 MB |
| `raw_crops/` | Pre-normalization crops. **Named in `manifest.json`/`manifest.csv`** (metadata only — code loads `normalized/`), so verify before deleting. | ~1.7 MB |

Already removed (Jul 13): `packitup_cropped_assets.zip` (10 MB archive),
`task_card_assets_pack/` (exact duplicate of `task_card_assets/`), `src/sell.mp3`
(orphan; sell chime is base64-inlined).

**Recommendation:** move the source rows above out of `src/` (e.g. to
`artifacts/pack-it-up/asset-sources/`) or delete them — git history preserves
them either way. Left in place pending Eloisa's OK because they're her source art.
