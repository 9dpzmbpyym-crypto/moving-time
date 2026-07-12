# Task Card Asset Manifest + Grok Implementation Notes

This pack contains two parallel asset families extracted from the provided PNG sheets:

1. **Horizontal row cards** — used for the task board / draw pile / list screen.
2. **Vertical full cards** — used for detailed card views, deck-style views, or card templates.

## Included categories
- Move
- Job
- Admin
- Health
- Stretchy
- Housing

## Folder structure
- `horizontal/` — six horizontal row cards
- `vertical/` — six vertical full cards
- `task_card_manifest.json` — machine-readable manifest

---

## Core visual system

### Category colors
- **Move** — yellow
- **Job** — red
- **Admin** — blue
- **Health** — green
- **Stretchy** — orange
- **Housing** — purple

### Typography
Use the existing in-game pixel/retro monospace display font if already present.
Preferred style: **chunky pixel serif / monospace with high readability**.
Good fallback classes of fonts:
- VT323-like pixel monospace for dense UI
- Silkscreen / Press Start 2P–style only for small labels if needed, but avoid if too cramped
- If the app already uses a typewriter/pixel font, keep that as source of truth

Priority: visual consistency with the current app > exact font name.

### Color + border behavior
- Preserve the thick dark outer border
- Preserve the cream paper interior
- Preserve the category color header and footer strips
- Do not add gradients or glossy effects beyond what is already in the art

---

## Horizontal row card anatomy
These are the long cards from `horizontal/`.

### Layout zones
1. **Header strip**
   - category icon at far left
   - category label next to icon
2. **Main blank body**
   - large empty area for the task title / summary text
3. **Bottom metadata rail**
   - `TARGET:` field with small calendar icon and fillable date text
   - `LATEST:` field with small calendar icon and fillable date text
   - effort marker: lightning icon + 3 hollow circles
   - importance / urgency marker: warning icon + 3 hollow circles

### Text placement
- **Task title** goes in the large upper blank body area
- It should be left-aligned
- Prefer 1–2 lines on mobile
- If title wraps, keep line height tight but readable
- Do not vertically center the title in the whole card; anchor it in the upper half of the body area

### Recommended horizontal text sizing
- category label: small / medium, bold pixel
- task title: largest text on the card
- target/latest labels: small label text
- dates: same size or slightly smaller than labels

### Date usage
- `TARGET` = preferred completion date; task begins to pressure the player after this passes
- `LATEST` = hard latest acceptable completion date; task should be treated as high urgency by this point
- If a task has no hard latest date, either:
  - still render the field but leave it blank, or
  - populate from system logic if derived

### Bubble usage (horizontal)
- **Lightning row** = effort
- **Warning row** = importance / urgency / non-negotiability
- Each row has exactly **3 circles**
- Circles should be **hollow by default** in the base asset
- Fill logic should happen in code, not in the PNG itself

#### Suggested fill mapping
- 1 filled = low
- 2 filled = medium
- 3 filled = high

Recommended rendering behavior:
- Fill with a dark brown / category-coherent tone
- Leave unfilled circles as hollow outlines
- Do not replace circles with numbers

---

## Vertical full card anatomy
These are the cards from `vertical/`.

### Layout zones
1. **Header strip**
   - category label
   - category icon
2. **Top effort row**
   - lightning icon + 3 hollow circles
3. **Title field**
   - blank rectangular field intended for the task title
4. **Date block**
   - `TARGET:` line
   - `LATEST:` line
5. **Body / notes area**
   - large blank rectangle for details, dependencies, notes, or flavor text
6. **Bottom importance row**
   - exclamation/warning indicator + 3 hollow circles
7. **Footer strip**
   - can remain decorative, or later hold status if desired

### Text placement
- **Task title** belongs in the title field near the top
- allow 1–3 lines max
- details / notes go inside the larger notes box
- keep notes shorter and scannable; do not treat the card like a full paragraph page

### Bubble usage (vertical)
- **Top lightning row** = effort
- **Bottom alert row** = importance / urgency
- exactly 3 bubbles each
- hollow in asset, filled dynamically in code

---

## Implementation guidance for Grok

### Use the asset family intentionally
- Use **horizontal cards** anywhere the player is browsing, drawing, or choosing between tasks
- Use **vertical cards** anywhere the player is inspecting one task in more detail, or if the UI wants a “real card” feel

### Do not redraw these assets in code
- Use the provided PNGs directly as UI art
- Overlay text and dynamic symbols on top
- If scaling is necessary, scale by integer multiples where possible to keep pixels crisp

### Keep text inside safe zones
Do not write text flush against edges.
Use padding inside the blank fields.
Recommended safe behavior:
- 8–16 px inset on mobile depending on render scale
- clamp title length or wrap cleanly
- truncate only as a last resort

### Bubble fill logic
Render the bubbles as a dynamic overlay:
- row starts at 0/3 filled
- fill left to right
- keep unfilled ones hollow
- preserve icon alignment

Example:
- effort = 2 -> `● ● ○`
- importance = 3 -> `● ● ●`

### Date display rules
- `TARGET` and `LATEST` should be short-form text (e.g. `Jul 22`, `Jul 27`, `Today`, `Tomorrow`)
- Keep both fields visually short
- Avoid long date strings like `Wednesday, July 27, 2026`

### Suggested hierarchy for horizontal rows
1. category icon + category
2. task title
3. target/latest dates
4. bubbles

### Suggested hierarchy for vertical cards
1. category header
2. effort
3. task title
4. dates
5. notes/details
6. importance

---

## Suggested metadata model
Each task should be able to provide at least:
- `category`
- `title`
- `targetDate`
- `latestDate`
- `effort` (1–3)
- `importance` (1–3)
- `notes` or `details`
- `status`

Example:
```ts
{
  category: 'move',
  title: 'Book moving van',
  targetDate: 'Jul 18',
  latestDate: 'Jul 21',
  effort: 2,
  importance: 3,
  notes: 'Confirm pickup window and address.'
}
```

---

## Final recommendation
Treat these as a **single coherent card system**:
- horizontal = browse / choose / queue
- vertical = inspect / read / detail

Use the same font, color logic, date format, bubble logic, and spacing rules across both.
