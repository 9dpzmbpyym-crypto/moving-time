# asset-sources — source art, NOT shipped

These are original/intermediate image files that **nothing in the app imports**.
They were moved out of `src/assets/` on Jul 13, 2026 so the code asset folders
only contain what actually ships — dropping or browsing images in `src/assets/`
no longer means wading through 46 MB of source material.

| Folder | What it is |
|--------|-----------|
| `ui-mockups-full/` | The 20 original full-screen UI mockups + source sheets the shipped `ui_mockups/*_slices/` were cut from. (Clean canonical mockups also live in `docs/mockups/`.) |
| `source_sheets/` | Original sprite source sheets |
| `by_room/` | Per-room organization of the item crops (the shipped copies are in `src/…/normalized/`) |
| `contact_sheets/` | Preview / contact sheets |
| `pack_it_up_individual_cards/` | Loose individual card art |
| `raw_crops/` | Pre-normalization crops (named in `manifest.json` as metadata; the app loads `normalized/`) |

Safe to keep here as reference, or delete — git history preserves everything.
**Do not import from here** — shipped assets live under `src/assets/`. See
`src/assets/items/packitup_cropped_assets/ASSET_MAP.md`.
