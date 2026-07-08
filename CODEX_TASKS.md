# Pending visual fixes (hand-off spec)

Read `README.md` first — especially the **coordinate system** section. Quick recap of the
facts every task below depends on:

- `CELL = 4` px/cell. Stage 960×720 px = 240×180 cells.
- **Floor line ("horizon") = px y 448** (cell y 112).
- **Frame horizontal center = px x 480** (cell x 120). On mobile the outer ~16 cells each
  side are cropped by the doorway frame, so keep composition inside roughly px 64–896.
- Object `x`/`y` (in `objects[]`) are the sprite's **top-left in px**. An object's
  **baseline = `y + spriteHeightCells * 4`**. Sprite `w`/`h` are in cells.
- Verify with Playwright at 390×844 and *look at the screenshot* — do not trust the numbers
  blind; nudge until it reads right.

Everything below lives in `src/BedroomSlice.jsx`. Sprite draw fns are in the `*_SPRITES`
objects; positions are in the `*_OBJECTS` arrays.

---

## DINING ROOM (`DINING_SPRITES`, `DINING_OBJECTS`, `drawDiningShell`)

**Window — scale ~2× and center in the room.** Currently drawn in `drawDiningShell` at
cells x 60–112 (52 wide), y 22–72 (50 tall). Make it ~2× wider (~104 cells) and as tall as
fits cleanly above the floor line with a sill (roughly y 14 → 96), **centered on the room
center** (cell x 120 / px 480). Keep the blinds + center mullion + sill.

**Curtains (`dining_curtains`, currently `x200,y80`, sprite `w72 h64`).** Re-draw/re-widen
so the rod spans the new (wider) window and the two green panels hug its new outer edges;
reposition `x` so it lines up. The middle must stay open so the blinds show.

**Sill plants (`sill_plants_d`, `x316,y264`).** Re-center on the new window's sill.

**Bar cabinet (`bar_cabinet`, currently `x688,y369`, sprite `w48 h44`).** Two changes:
(a) **scale up slightly** (e.g. `w54 h50`); (b) **move up 72px** so its **bottom sits 24px
below the floor line** → target baseline px 472. With height H cells, set
`y = 472 − H*4` (for h50: `y = 272`). Keep `bar_bottles` resting on its new top surface
(bottles' baseline a few px into the cabinet top).

**Painting (`shelf_art`, currently `x640,y148`, sprite `w22 h28`).** Scale it up so it is
**as wide as the (newly enlarged) bar cabinet** (~54 cells wide, keep aspect → ~h68), and
**center it horizontally over the bar cabinet** (painting center x = bar center x). It's a
z:2 wall piece; sit its bottom a comfortable gap above the bar's top.

**Dining chairs — full redraw (`dining_chairs`, one sprite `w96 h58` at `x236,y332`).**
The sprite draws three chairs around the table. Redraw them as:
- **Front chair** (center): seen **from behind, facing away from the viewer** (toward the
  table). Draw the **seat cushion first, then the chair back/frame ON TOP of it** so the
  back visually overlaps the cushion (back is nearer the camera than the seat).
- **Two side chairs** (left & right): each a **side/profile view facing inward** toward the
  table. Center each one **along the length of the table's side** (not shoved to the far
  edges). Profile = you see the back as a vertical bar on the outer side, the seat
  extending toward the table, legs in profile.
Keep the blue-grey cushions (`#5C6C80` / `#6E7E92`). Make sure the front chair's back sits
in front of the table's front edge and the side chairs read clearly as profiles.

---

## KITCHEN (`KITCHEN_SPRITES`, `KITCHEN_OBJECTS`, `drawKitchenShell`)

Already close. Changes:

**Back door — in frame and flush with the backsplash.** Door is drawn in `drawKitchenShell`
(cells x 8–36). Its left edge (x8) is partly cropped by the mobile frame, and there's a gap
before the backsplash. Move the door **right** so it's fully visible (left edge ≥ cell 16)
and its **right edge meets the backsplash start** (backsplash begins at cell x 46, so door
right edge = 46 → door at cells x 18–46). The `door_towel` object (`x72,y140`) must move
with it.

**Scale every element up slightly** (stove, counter+sink, fridge, pantry, and the small
items). ~10–15%. Keep them all sharing one floor baseline.

**No gaps along the wall.** After scaling, position door → stove → counter+sink → fridge →
pantry so their sides touch (or nearly), reading as one continuous counter/appliance run
like the reference. Current x/baselines: stove `x210` (w30), counter_sink `x340` (w60),
fridge `x610` (w32), pantry `x760` (w26). Close the gaps between them.

**Cutting board on the blank counter, not overlapping the sink.** `cutting_board`
(`x400,y294`) currently sits over/near the sink basin. The sink basin is the inset in the
middle of `counter_sink`. Move the board onto the **blank left stretch of the countertop**
(left of the basin), resting on the counter's top surface. `dish_rack` stays to the **right**
of the sink.

---

## LIVING ROOM (`LIVING_SPRITES`, `LIVING_OBJECTS`, `drawLivingShell`)

Mostly placement. Target: a clean back-wall lineup with **no two back-wall pieces
overlapping**, and their bottoms aligned on one line just below the floor line.

Define **backWallBottom ≈ px 462** (14px below the floor line). The bottoms
(baselines) of **tv_hutch, destijl_poster, standing_mirror, floor_lamp** should all land on
this line. For each, `y = 462 − spriteH*4`.

**Couch (`sofa`, `w76 h52`, currently `x430,y356`).** **Center it in the frame** (couch
center x = 480 → `x = 480 − 76*4/2 = 328`) and set its **bottom just below the horizon**
(baseline ≈ 465 → `y = 465 − 52*4 = 257`; tune so it reads as sitting just below the line).

**De Stijl poster (`destijl_poster`, `w26 h36`).** Place **closely to the right of the
couch**, bottom **even closer to the horizon** than the couch (baseline ≈ 458 →
`y = 458 − 36*4 = 314`). `x` = just right of the couch's right edge (couch right ≈ 328+304
= 632, so poster ≈ x 640), no overlap.

**Standing mirror (`standing_mirror`, `w20 h58`).** **A little further right** of the
poster, **bottom aligned with the poster's bottom and the lamp's bottom** (baseline 462 →
`y = 462 − 58*4 = 230`). No overlap with poster or lamp.

**Floor lamp (`floor_lamp`, `w18 h60`).** **Furthest right.** Baseline 462 →
`y = 462 − 60*4 = 222`. Keep within the frame (right edge ≤ ~px 896).

**TV hutch / entertainment center (`tv_hutch`, `w56 h96`, `x80`).** Looks good — **scale up
a touch** and set its **bottom on the same backWallBottom line** as the art/mirror/lamp
(`y = 462 − newH*4`). It's on the left; make sure nothing on the back wall overlaps it.

**Nothing on the back wall may overlap** — hutch, wall_art_pair, poster, mirror, lamp must
all be clear of one another horizontally.

**Throw blanket + pillow (drawn inside the `sofa` sprite).** In `LIVING_SPRITES.sofa`:
- **Throw**: its **top edge should align with the top of the right section of the couch
  back** (i.e. start the throw at the same local y as the sofa's back-cushion top, not
  above it).
- **Pillow**: its **bottom edge should sit on the crease between the upper (back) cushion
  and the lower (seat) cushion** — align the pillow's bottom to that seam local y.

**Coffee table (`coffee_table`).** Was just redrawn in 3/4 view with lighter wood — keep
that. **Scale it ~2× (a bit taller too)** and **center it in front of the couch** (table
center x = couch center x = 480). It's z:4, in front of the sofa/rug. Re-center
`table_decor` (candle/vase/books) on the enlarged tabletop so the items sit nicely on top.

**Rug (`living_rug`).** Was enlarged; make sure it still reads as lying flat under the
(re-centered, enlarged) coffee table and extends past the couch. Adjust `x`/`y` if the new
couch/table centering leaves it off.

---

## After the changes

1. `npm run build` must succeed.
2. Screenshot dining, kitchen, living at 390×844 and confirm each matches the intent above.
3. Spot-check the other three rooms + desktop still render (you touched shared helpers only
   if you edited the floor/ceiling code — you shouldn't need to).
4. Don't commit Playwright into `package.json`.
