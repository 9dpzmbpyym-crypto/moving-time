import { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ============================================================
   PACK IT UP — vertical slice: The Bedroom
   Architecture:
   - STAGE: 960x720 design px. Pixel cell = 4px (sprites drawn at
     low-res on <canvas>, CSS-scaled with image-rendering:pixelated)
   - Layer 0: RoomShell (walls/floor/window/door — static canvas)
   - Layer 1+: object sprites, each its own canvas, absolutely
     positioned, sorted by z then baseline
   - ROOMS data model → extensible to more rooms / camera pan
   ============================================================ */

const CELL = 4; // 1 sprite pixel = 4 screen px
const STAGE_W = 960;
const STAGE_H = 720;

/* ---------- palette ---------- */
const P = {
  out: "#221306",
  wall: "#E7D9B9", wallLight: "#F1E7CC", wallShade: "#D6C49E",
  floor: "#7A4826", floorDark: "#5E351B", floorLight: "#8C5931", floorSun: "#A06A38",
  woodDark: "#3E2413", wood: "#5A381F", woodMid: "#6E452A", woodLight: "#7F5230", woodHi: "#96653C",
  mustard: "#C9942E", mustardHi: "#DDAB45", mustardLo: "#A87823",
  burgundy: "#7C2E37", burgundyLo: "#591F27",
  teal: "#5C8C7C", tealLo: "#44695B", tealHi: "#6FA08E",
  cream: "#EFE7D2", creamLo: "#DBCFAF",
  white: "#F3EDDD", whiteLo: "#DDD4BD",
  green: "#5D7C3B", greenLo: "#465F2B", greenHi: "#77974C",
  terra: "#A85A32", terraLo: "#8A4526",
  gold: "#D9A33C", goldHi: "#EFC463",
  glass: "#C9DCD2", glassHi: "#E9F0E4", glassLo: "#AEC6BA",
  red: "#A3252C", redHi: "#C74B4F",
  sky: "#BFD8CC",
  card: "#C08A4A", cardLo: "#9C6C36", cardHi: "#D3A263",
};

/* ---------- tiny canvas helpers ---------- */
const r = (ctx, c, x, y, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
const dith = (ctx, c, x, y, w, h, step = 2, off = 0) => {
  ctx.fillStyle = c;
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++)
    if ((i + j + off) % step === 0) ctx.fillRect(i, j, 1, 1);
};
const outlineRect = (ctx, c, x, y, w, h) => {
  r(ctx, c, x, y, w, 1); r(ctx, c, x, y + h - 1, w, 1);
  r(ctx, c, x, y, 1, h); r(ctx, c, x + w - 1, y, 1, h);
};

/* ============================================================
   ROOM SHELL — static architecture (240 x 180 cells)
   ============================================================ */
function drawShell(ctx) {
  const W = 240, H = 180, WALL_B = 112;

  // wall
  r(ctx, P.wall, 0, 0, W, WALL_B);
  dith(ctx, P.wallLight, 0, 0, W, 30, 3, 0);
  dith(ctx, P.wallShade, 0, WALL_B - 26, W, 26, 3, 1);
  // crown + baseboard
  r(ctx, P.wallLight, 0, 0, W, 3); r(ctx, P.wallShade, 0, 3, W, 1);
  r(ctx, P.cream, 0, WALL_B - 6, W, 6); r(ctx, P.creamLo, 0, WALL_B - 6, W, 1);
  r(ctx, P.out, 0, WALL_B - 1, W, 1);

  // floor: planks
  r(ctx, P.floor, 0, WALL_B, W, H - WALL_B);
  for (let row = 0; row * 8 + WALL_B < H; row++) {
    const y0 = WALL_B + row * 8;
    r(ctx, P.floorDark, 0, y0 + 7, W, 1);
    dith(ctx, P.floorLight, 0, y0 + 1, W, 3, 5, row * 3);
    const off = (row % 2) * 24;
    for (let x = off + 10; x < W; x += 48) r(ctx, P.floorDark, x, y0, 1, 7);
  }

  // open-door hint on far left (dark jamb, like the hallway beyond)
  r(ctx, P.out, 0, 0, 7, WALL_B);
  r(ctx, P.woodDark, 0, 0, 5, WALL_B);
  r(ctx, P.woodMid, 4, 4, 1, WALL_B - 8);

  // window (x 88..152, y 16..72) with sill
  r(ctx, P.out, 86, 14, 68, 62);
  r(ctx, P.cream, 88, 16, 64, 58);
  r(ctx, P.sky, 92, 20, 56, 50);
  // blinds + light
  for (let j = 21; j < 69; j += 3) r(ctx, P.glassHi, 92, j, 56, 1);
  dith(ctx, P.green, 92, 58, 12, 12, 2, 0);         // tree hint, low left
  dith(ctx, P.green, 136, 54, 12, 16, 2, 1);        // tree hint, low right
  r(ctx, P.cream, 118, 20, 4, 50);                   // center mullion
  r(ctx, P.creamLo, 92, 44, 56, 2);                  // sash rail
  // sill
  r(ctx, P.out, 82, 74, 76, 1);
  r(ctx, P.cream, 82, 72, 76, 3); r(ctx, P.creamLo, 82, 74, 76, 1);

  // white closet door (x 166..190, y 20..106)
  r(ctx, P.out, 164, 18, 28, 89);
  r(ctx, P.white, 166, 20, 24, 86);
  outlineRect(ctx, P.whiteLo, 169, 26, 18, 34);
  outlineRect(ctx, P.whiteLo, 169, 66, 18, 34);
  r(ctx, P.gold, 186, 62, 2, 3);

  // sunlight pooling on the floor under the window
  const sunX = 96, sunW = 54;
  r(ctx, P.floorSun, sunX, WALL_B + 2, sunW, 30);
  dith(ctx, P.floor, sunX, WALL_B + 2, sunW, 30, 2, 0);      // soften
  dith(ctx, P.floorSun, sunX - 6, WALL_B + 2, 6, 30, 2, 1);  // ragged left edge
  dith(ctx, P.floorSun, sunX + sunW, WALL_B + 2, 6, 30, 2, 0);
  for (let j = WALL_B + 2; j < WALL_B + 32; j += 6) r(ctx, P.floor, sunX, j, sunW, 1); // slat gaps

  // wall vignette corners
  dith(ctx, P.wallShade, 0, 0, 26, WALL_B, 2, 0);
  dith(ctx, P.wallShade, W - 22, 0, 22, WALL_B, 2, 1);
}

/* ============================================================
   SPRITES — one draw fn per object (low-res cells)
   ============================================================ */
const SPRITES = {
  rug: { w: 100, h: 54, draw(ctx) {
    r(ctx, P.tealLo, 2, 2, 96, 50);
    r(ctx, P.teal, 5, 5, 90, 44);
    const stripes = [10, 17, 27, 34, 41];
    stripes.forEach((y, i) => r(ctx, i % 2 ? P.cream : P.tealHi, 5, y, 90, 3));
    dith(ctx, P.tealLo, 5, 5, 90, 44, 5, 2);
    for (let y = 3; y < 52; y += 3) { r(ctx, P.cream, 0, y, 2, 1); r(ctx, P.cream, 98, y, 2, 1); } // fringe
  }},

  bed: { w: 66, h: 74, draw(ctx) {
    // headboard
    r(ctx, P.out, 3, 0, 60, 12);
    r(ctx, P.woodDark, 4, 1, 58, 10); r(ctx, P.woodMid, 4, 1, 58, 2);
    // mattress body outline
    r(ctx, P.out, 1, 10, 64, 58);
    // pillows
    r(ctx, P.mustard, 4, 11, 27, 12); r(ctx, P.mustard, 35, 11, 27, 12);
    r(ctx, P.mustardHi, 5, 12, 25, 3); r(ctx, P.mustardHi, 36, 12, 25, 3);
    r(ctx, P.mustardLo, 4, 21, 58, 2);
    // burgundy accent pillow
    r(ctx, P.out, 15, 15, 36, 13);
    r(ctx, P.burgundy, 16, 16, 34, 11); r(ctx, "#96424C", 17, 17, 32, 3);
    r(ctx, P.burgundyLo, 16, 25, 34, 2);
    // mustard fold band
    r(ctx, P.mustard, 3, 28, 60, 8); r(ctx, P.mustardHi, 3, 28, 60, 2); r(ctx, P.mustardLo, 3, 34, 60, 2);
    // duvet
    r(ctx, "#8A6A4C", 3, 36, 60, 30);
    r(ctx, "#9C7B5A", 3, 36, 60, 3);
    dith(ctx, "#7A5B40", 40, 38, 23, 28, 2, 0);       // right shade
    r(ctx, "#7A5B40", 3, 46, 60, 1); r(ctx, "#7A5B40", 3, 56, 60, 1); // fold creases
    dith(ctx, "#9C7B5A", 6, 40, 20, 20, 4, 1);
    // frame + legs
    r(ctx, P.out, 1, 66, 64, 3);
    r(ctx, P.woodDark, 2, 66, 62, 2);
    r(ctx, P.out, 4, 69, 4, 5); r(ctx, P.out, 58, 69, 4, 5);
    r(ctx, P.woodDark, 5, 69, 2, 4); r(ctx, P.woodDark, 59, 69, 2, 4);
  }},

  nightstand: { w: 28, h: 34, draw(ctx) {
    r(ctx, P.out, 0, 2, 28, 26);
    r(ctx, P.woodLight, 1, 3, 26, 2);                 // top slab
    r(ctx, P.woodDark, 1, 5, 26, 22);
    outlineRect(ctx, "#2E1A0C", 3, 7, 22, 8);         // drawer
    r(ctx, P.wood, 4, 8, 20, 6);
    r(ctx, P.gold, 12, 10, 4, 2);
    r(ctx, "#180D04", 3, 17, 22, 9);                  // shelf inset
    r(ctx, P.green, 5, 19, 3, 7); r(ctx, "#6B4A8A", 9, 20, 3, 6); r(ctx, "#B08A4A", 13, 19, 4, 7); // books
    r(ctx, P.out, 2, 28, 3, 6); r(ctx, P.out, 23, 28, 3, 6);   // legs
    r(ctx, P.woodDark, 3, 28, 1, 5); r(ctx, P.woodDark, 24, 28, 1, 5);
  }},

  lamp: { w: 18, h: 22, draw(ctx) {
    r(ctx, P.out, 3, 0, 12, 1); r(ctx, P.out, 1, 1, 16, 1);
    r(ctx, P.cream, 2, 2, 14, 5); r(ctx, P.out, 1, 2, 1, 5); r(ctx, P.out, 16, 2, 1, 5); // dome
    r(ctx, P.whiteLo, 2, 6, 14, 1); r(ctx, "#FBF6E6", 4, 2, 5, 2);
    r(ctx, P.out, 1, 7, 16, 1);
    r(ctx, P.goldHi, 8, 8, 2, 1);                      // warm glow at neck
    r(ctx, P.out, 8, 8, 1, 10); r(ctx, P.woodDark, 9, 8, 1, 10);  // stem
    r(ctx, P.out, 4, 18, 10, 1); r(ctx, P.woodDark, 3, 19, 12, 2); r(ctx, P.out, 3, 21, 12, 1);
  }},

  art_tree: { w: 14, h: 18, draw(ctx) {
    r(ctx, P.out, 0, 0, 14, 18);
    r(ctx, P.woodDark, 1, 1, 12, 16);
    r(ctx, P.cream, 2, 2, 10, 14);
    r(ctx, P.greenHi, 4, 4, 6, 6); r(ctx, P.green, 5, 6, 5, 5); dith(ctx, P.greenLo, 5, 6, 5, 4, 2, 0);
    r(ctx, P.wood, 6, 10, 2, 4);
    r(ctx, "#A8B87C", 3, 13, 8, 2);
  }},

  art_poster: { w: 22, h: 28, draw(ctx) {
    r(ctx, P.out, 0, 0, 22, 28);
    r(ctx, P.woodDark, 1, 1, 20, 26);
    r(ctx, P.cream, 2, 2, 18, 24);
    // target
    r(ctx, "#28304A", 5, 4, 12, 12);
    r(ctx, P.cream, 7, 6, 8, 8);
    r(ctx, P.burgundy, 8, 7, 6, 6);
    r(ctx, "#28304A", 10, 9, 2, 2);
    // "BIRMINGHAM coin co." text bars
    r(ctx, P.redHi, 5, 18, 12, 2);
    r(ctx, "#7C6A4A", 6, 21, 10, 1); r(ctx, "#7C6A4A", 7, 23, 8, 1);
  }},

  curtains: { w: 90, h: 70, draw(ctx) {
    // rod
    r(ctx, P.out, 0, 2, 90, 2); r(ctx, P.woodDark, 1, 2, 88, 1);
    r(ctx, P.out, 0, 0, 3, 6); r(ctx, P.out, 87, 0, 3, 6);
    // panels (transparent middle so the window shows through)
    const panel = (x) => {
      r(ctx, P.out, x, 4, 13, 64);
      r(ctx, P.mustard, x + 1, 5, 11, 62);
      r(ctx, P.mustardHi, x + 2, 5, 2, 62); r(ctx, P.mustardHi, x + 7, 5, 1, 62);
      r(ctx, P.mustardLo, x + 5, 5, 1, 62); r(ctx, P.mustardLo, x + 10, 5, 1, 62);
      dith(ctx, P.mustardLo, x + 1, 52, 11, 15, 2, 0);
    };
    panel(1); panel(76);
  }},

  sill_plants: { w: 24, h: 10, draw(ctx) {
    const pot = (x) => {
      r(ctx, P.out, x, 4, 8, 6); r(ctx, P.terra, x + 1, 5, 6, 4); r(ctx, P.terraLo, x + 1, 8, 6, 1);
      r(ctx, P.green, x + 2, 1, 2, 3); r(ctx, P.greenHi, x + 4, 0, 2, 4); r(ctx, P.green, x + 5, 2, 2, 2);
    };
    pot(1); pot(14);
  }},

  hanging_plant: { w: 20, h: 26, draw(ctx) {
    r(ctx, P.out, 9, 0, 2, 2);                        // hook
    r(ctx, "#6E5A3A", 9, 2, 1, 5);
    r(ctx, "#6E5A3A", 4, 7, 1, 6); r(ctx, "#6E5A3A", 15, 7, 1, 6); r(ctx, "#6E5A3A", 9, 6, 1, 7); // ropes
    r(ctx, P.out, 3, 12, 14, 7);                      // pot
    r(ctx, P.terra, 4, 13, 12, 5); r(ctx, P.terraLo, 4, 16, 12, 2);
    // leaves spilling
    dith(ctx, P.green, 2, 9, 16, 5, 2, 0);
    r(ctx, P.greenHi, 5, 9, 3, 2); r(ctx, P.green, 12, 10, 3, 2);
    r(ctx, P.green, 1, 17, 3, 5); r(ctx, P.greenHi, 2, 19, 2, 3);
    r(ctx, P.green, 16, 17, 3, 4); r(ctx, P.greenLo, 17, 20, 2, 4);
    r(ctx, P.greenHi, 8, 19, 3, 3); r(ctx, P.greenLo, 9, 22, 2, 3);
  }},

  // vanity desk + its standing mirror leaning behind/beside it, one composite sprite
  vanity: { w: 46, h: 66, draw(ctx) {
    // standing mirror, leaning at the back, top of frame rising above the desk
    r(ctx, P.out, 13, 0, 26, 28);
    r(ctx, P.woodMid, 14, 1, 24, 26); r(ctx, P.woodHi, 14, 1, 24, 1);
    r(ctx, P.glass, 16, 3, 20, 22);
    r(ctx, P.glassHi, 18, 4, 3, 20); r(ctx, P.glassHi, 23, 4, 1, 20);  // light streak
    dith(ctx, P.glassLo, 26, 5, 9, 19, 2, 0);
    r(ctx, P.out, 16, 28, 3, 3); r(ctx, P.out, 33, 28, 3, 3);          // stand feet
    // desk
    r(ctx, P.out, 0, 30, 46, 4);                       // top
    r(ctx, P.white, 1, 31, 44, 2);
    r(ctx, P.out, 2, 34, 42, 12);                      // drawer box
    r(ctx, P.white, 3, 35, 40, 10);
    r(ctx, P.whiteLo, 3, 35, 40, 1);
    r(ctx, P.whiteLo, 22, 35, 1, 10);                  // drawer split
    r(ctx, "#B8AE96", 12, 39, 3, 2); r(ctx, "#B8AE96", 31, 39, 3, 2);
    // legs
    r(ctx, P.out, 3, 46, 4, 20); r(ctx, P.white, 4, 46, 2, 19);
    r(ctx, P.out, 39, 46, 4, 20); r(ctx, P.white, 40, 46, 2, 19);
    dith(ctx, P.whiteLo, 4, 56, 2, 9, 2, 0); dith(ctx, P.whiteLo, 40, 56, 2, 9, 2, 1);
  }},

  stool: { w: 16, h: 16, draw(ctx) {
    r(ctx, P.out, 0, 0, 16, 4); r(ctx, P.woodDark, 1, 1, 14, 2); r(ctx, P.woodMid, 1, 1, 14, 1);
    r(ctx, P.out, 1, 4, 3, 12); r(ctx, P.out, 12, 4, 3, 12);
    r(ctx, P.woodDark, 2, 4, 1, 11); r(ctx, P.woodDark, 13, 4, 1, 11);
    r(ctx, P.woodDark, 3, 9, 10, 1);
  }},

  // dresser + its wall mirror mounted just above it, one composite sprite
  dresser: { w: 48, h: 99, draw(ctx) {
    // mirror, centered above
    r(ctx, P.out, 4, 0, 40, 36);
    r(ctx, P.woodMid, 5, 1, 38, 34); r(ctx, P.woodHi, 5, 1, 38, 1);
    r(ctx, P.glass, 8, 4, 32, 28);
    r(ctx, P.glassHi, 11, 5, 4, 26); r(ctx, P.glassHi, 17, 5, 2, 26);
    dith(ctx, P.glassLo, 24, 6, 14, 25, 2, 1);
    r(ctx, P.mustardLo, 34, 8, 4, 14);               // curtain reflection wink
    // dresser body
    r(ctx, P.out, 0, 39, 48, 54);
    r(ctx, P.woodHi, 1, 40, 46, 3);                   // top slab
    r(ctx, P.woodMid, 1, 43, 46, 48);
    dith(ctx, P.wood, 36, 43, 11, 48, 2, 0);          // right shading
    const drawer = (x, y, w, h) => {
      outlineRect(ctx, "#33200F", x, y, w, h);
      r(ctx, P.woodLight, x + 1, y + 1, w - 2, h - 2);
      r(ctx, P.woodHi, x + 1, y + 1, w - 2, 1);
    };
    drawer(3, 45, 20, 9); drawer(25, 45, 20, 9);        // two small
    drawer(3, 56, 42, 10); drawer(3, 68, 42, 10); drawer(3, 80, 42, 9); // three wide
    // knobs
    [[12, 49], [34, 49]].forEach(([x, y]) => r(ctx, P.gold, x, y, 2, 2));
    [[14, 60], [32, 60], [14, 72], [32, 72], [14, 83], [32, 83]].forEach(([x, y]) => r(ctx, P.gold, x, y, 2, 2));
    // feet
    r(ctx, P.out, 2, 93, 5, 6); r(ctx, P.out, 41, 93, 5, 6);
    r(ctx, P.woodDark, 3, 93, 3, 5); r(ctx, P.woodDark, 42, 93, 3, 5);
  }},

  vase: { w: 8, h: 16, draw(ctx) {
    r(ctx, P.out, 2, 0, 4, 2);
    r(ctx, P.out, 3, 2, 2, 4); r(ctx, P.red, 3, 1, 2, 5);
    r(ctx, P.out, 1, 6, 6, 10);
    r(ctx, P.red, 2, 7, 4, 8); r(ctx, P.redHi, 2, 7, 1, 7);
  }},

  figurines: { w: 14, h: 13, draw(ctx) {
    // doll
    r(ctx, P.out, 1, 0, 4, 13); r(ctx, P.cream, 2, 1, 2, 3); r(ctx, "#C8A87C", 2, 4, 2, 8);
    // little gold friend
    r(ctx, P.out, 8, 4, 5, 9); r(ctx, P.gold, 9, 5, 3, 7); r(ctx, P.goldHi, 9, 5, 1, 4);
  }},

  basket: { w: 15, h: 10, draw(ctx) {
    r(ctx, P.out, 0, 3, 15, 7);
    r(ctx, "#B08A4A", 1, 4, 13, 5); dith(ctx, "#8E6C34", 1, 4, 13, 5, 2, 0);
    r(ctx, P.redHi, 3, 2, 3, 2); r(ctx, "#C97B2E", 8, 1, 3, 3);   // fruit
  }},
};

/* box stack sprite (grows near the door as you pack) */
function drawBoxes(ctx, count) {
  ctx.clearRect(0, 0, 40, 40);
  const box = (x, y) => {
    r(ctx, P.out, x, y, 16, 12);
    r(ctx, P.card, x + 1, y + 1, 14, 10);
    r(ctx, P.cardHi, x + 1, y + 1, 14, 2);
    r(ctx, P.cardLo, x + 1, y + 5, 14, 1);
    r(ctx, "#EBDDBE", x + 6, y + 1, 4, 10); // tape
  };
  if (count >= 1) box(2, 26);
  if (count >= 2) box(20, 26);
  if (count >= 3) box(6, 13);
  if (count >= 4) box(16, 0);
}

/* ============================================================
   ROOM DATA MODEL  (extensible: add rooms to ROOMS, pan later)
   ============================================================ */
const ROOMS = {
  bedroom: {
    id: "bedroom",
    name: "Bedroom",
    objects: [
      { id: "rug",            name: "Striped Rug",      category: "textiles",  x: 230, y: 470, z: 1, removable: true, value: 15,
        check: "Blue-green stripes. It has caught every midnight water glass you ever dropped." },
      { id: "curtains",       name: "Curtains",         category: "textiles",  x: 300, y: 32,  z: 2, removable: false,
        check: "These stay behind — the listing said “partially furnished.”" },
      { id: "art_tree",       name: "Tree Painting",    category: "decor",     x: 88,  y: 112, z: 2, removable: true, value: 8,
        check: "A small green painting that made a rented wall feel less rented." },
      { id: "art_poster",     name: "Coin Co. Poster",  category: "decor",     x: 184, y: 84,  z: 2, removable: true, value: 5,
        check: "Birmingham Coin Company. You don't collect coins. It just looked cool." },
      { id: "sill_plants",    name: "Windowsill Plants",category: "plants",    x: 408, y: 248, z: 3, removable: true, value: 6,
        check: "The windowsill crew. They ride up front, obviously." },
      { id: "hanging_plant",  name: "Hanging Pothos",   category: "plants",    x: 676, y: 14,  z: 3, removable: true, value: 10,
        check: "It survived three heat waves. It can survive Queens." },
      { id: "bed",            name: "Bed",              category: "furniture", x: 180, y: 280, z: 3, removable: true, value: 60,
        check: "Still smells like laundry day. The burgundy pillow matches nothing, which is why it works." },
      { id: "nightstand",     name: "Nightstand",       category: "furniture", x: 52,  y: 372, z: 3, removable: true, value: 25,
        check: "One drawer of mysteries, one shelf of books you swear you'll finish before the flight." },
      { id: "vanity",         name: "Vanity Desk",      category: "furniture", x: 548, y: 228, z: 3, removable: true, value: 67,
        check: "White desk, good light — where letters and eyeliner both happened. The standing mirror beside it leans just so; you never once hung it properly, no regrets." },
      { id: "dresser",        name: "Dresser",          category: "furniture", x: 740, y: 174, z: 3, removable: true, value: 90,
        check: "Solid wood, heavier than it looks — the movers will curse its name. The mirror on top has checked a thousand outfits and kept every secret." },
      { id: "lamp",           name: "Mushroom Lamp",    category: "lighting",  x: 80,  y: 296, z: 4, removable: true, value: 18,
        check: "Chief mood-setter. Warm light or nothing." },
      { id: "stool",          name: "Stool",            category: "furniture", x: 600, y: 446, z: 4, removable: true, value: 10,
        check: "A little wobbly. Sit anyway." },
      { id: "vase",           name: "Red Glass Vase",   category: "decor",     x: 772, y: 270, z: 4, removable: true, value: 12,
        check: "Absolutely not surviving the box unless it's wrapped twice." },
      { id: "figurines",      name: "Thrifted Figurines",category: "decor",    x: 852, y: 286, z: 4, removable: true, value: 8,
        check: "Two tiny companions from a good thrift run. They've seen things." },
      { id: "basket",         name: "Everything Basket",category: "decor",     x: 812, y: 308, z: 4, removable: true, value: 5,
        check: "Currently holding: keys, receipts, one dried orange." },
    ],
  },
};

const CATEGORY_COLORS = {
  furniture: "#B07A3C", textiles: "#5C8C7C", decor: "#96424C",
  plants: "#5D7C3B", lighting: "#C9942E",
};

/* ============================================================
   PIXEL CANVAS
   ============================================================ */
function PixelCanvas({ w, h, draw, redrawKey, style }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    draw(ctx);
  }, [w, h, draw, redrawKey]);
  return (
    <canvas
      ref={ref}
      style={{ width: w * CELL, height: h * CELL, imageRendering: "pixelated", display: "block", ...style }}
    />
  );
}

/* coin-burst trajectories: horizontal spread, arc peak height, start delay(ms) */
const COIN_BURSTS = [
  { tx: -52, ty: -50, d: 0 }, { tx: -14, ty: -60, d: 90 },
  { tx: 24,  ty: -56, d: 30 }, { tx: 56,  ty: -40, d: 120 },
];

/* real embedded audio (not raw Web Audio oscillators) — media playback
   like this has a much better chance of ignoring a phone's silent switch
   than synthesized tones, same as how video sites get through it */
const SELL_CHIME_SRC = "data:audio/wav;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

/* ============================================================
   APP
   ============================================================ */
export default function PackItUp() {
  const roomId = "bedroom"; // future: currentRoom state + camera pan
  const room = ROOMS[roomId];

  // object state: { [id]: { packed, sold, soldFor } }
  const [objState, setObjState] = useState(() =>
    Object.fromEntries(room.objects.map((o) => [o.id, { packed: false, sold: false, soldFor: 0 }]))
  );
  const [selectedId, setSelectedId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [packingId, setPackingId] = useState(null); // mid pack animation
  const [sellingId, setSellingId] = useState(null); // mid sell animation
  const [invOpen, setInvOpen] = useState(false);
  const [minutes, setMinutes] = useState(0); // game time advances as you pack/sell
  const [coins, setCoins] = useState(125);
  const [scale, setScale] = useState(1);
  const [sellFormOpen, setSellFormOpen] = useState(false);
  const [sellAmount, setSellAmount] = useState("");
  const [undoStack, setUndoStack] = useState([]); // undo history, most recent last
  const [sellFx, setSellFx] = useState(null); // { x, y, amount } coin-burst overlay
  const wrapRef = useRef(null);
  const sellAudioRef = useRef(null);

  useEffect(() => {
    setSellFormOpen(false);
    setSellAmount("");
  }, [selectedId]);

  const removable = room.objects.filter((o) => o.removable);
  const packedCount = removable.filter((o) => objState[o.id].packed).length;
  const soldCount = removable.filter((o) => objState[o.id].sold).length;
  const total = removable.length;
  const clearedCount = packedCount + soldCount;
  const done = clearedCount === total;
  const boxCount = Math.min(4, Math.ceil(packedCount / 4));

  /* fit stage to viewport */
  useEffect(() => {
    const fit = () => {
      const el = wrapRef.current;
      if (!el) return;
      const s = Math.min(el.clientWidth / STAGE_W, el.clientHeight / STAGE_H);
      setScale(Math.max(0.3, s));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const packObject = useCallback((id) => {
    const obj = room.objects.find((o) => o.id === id);
    if (!obj || !obj.removable || objState[id].packed || objState[id].sold || packingId || sellingId) return;
    const prev = objState[id];
    setPackingId(id);
    setTimeout(() => {
      setObjState((s) => ({ ...s, [id]: { ...s[id], packed: true } }));
      setUndoStack((stack) => [...stack, { id, prevPacked: prev.packed, prevSold: prev.sold, prevSoldFor: prev.soldFor, coinsDelta: 0, minutesDelta: 10 }]);
      setPackingId(null);
      setSelectedId(null);
      setMinutes((m) => m + 10);
    }, 520);
  }, [room.objects, objState, packingId, sellingId]);

  const sellObject = useCallback((id, amount) => {
    const obj = room.objects.find((o) => o.id === id);
    if (!obj || !obj.removable || objState[id].packed || objState[id].sold || packingId || sellingId) return;
    const prev = objState[id];
    const credit = Number.isFinite(amount) ? amount : (obj.value || 0);
    const spr = SPRITES[id];
    setSellingId(id);
    // burst effect lives on its own timer so the sell animation ending
    // doesn't cut it short
    setSellFx({ x: obj.x + (spr.w * CELL) / 2, y: obj.y + (spr.h * CELL) / 2, amount: credit });
    setTimeout(() => setSellFx(null), 1000);
    if (sellAudioRef.current) {
      sellAudioRef.current.currentTime = 0;
      sellAudioRef.current.play().catch(() => {});
    }
    setTimeout(() => {
      setObjState((s) => ({ ...s, [id]: { ...s[id], sold: true, soldFor: credit } }));
      setCoins((c) => c + credit);
      setUndoStack((stack) => [...stack, { id, prevPacked: prev.packed, prevSold: prev.sold, prevSoldFor: prev.soldFor, coinsDelta: credit, minutesDelta: 5 }]);
      setSellingId(null);
      setSelectedId(null);
      setMinutes((m) => m + 5);
    }, 520);
  }, [room.objects, objState, packingId, sellingId]);

  const unpackObject = (id) => {
    const prev = objState[id];
    setUndoStack((stack) => [...stack, { id, prevPacked: prev.packed, prevSold: prev.sold, prevSoldFor: prev.soldFor, coinsDelta: 0, minutesDelta: 0 }]);
    setObjState((s) => ({ ...s, [id]: { ...s[id], packed: false } }));
  };

  const unsellObject = (id) => {
    const prev = objState[id];
    setCoins((c) => c - (prev.soldFor || 0));
    setUndoStack((stack) => [...stack, { id, prevPacked: prev.packed, prevSold: prev.sold, prevSoldFor: prev.soldFor, coinsDelta: -(prev.soldFor || 0), minutesDelta: 0 }]);
    setObjState((s) => ({ ...s, [id]: { ...s[id], sold: false, soldFor: 0 } }));
  };

  const undoLast = () => {
    if (undoStack.length === 0) return;
    const { id, prevPacked, prevSold, prevSoldFor, coinsDelta, minutesDelta } = undoStack[undoStack.length - 1];
    setObjState((s) => ({ ...s, [id]: { ...s[id], packed: prevPacked, sold: prevSold, soldFor: prevSoldFor } }));
    setCoins((c) => c - coinsDelta);
    setMinutes((m) => m - minutesDelta);
    setUndoStack((stack) => stack.slice(0, -1));
  };

  /* hotkeys: X pack · Z check(select) · Tab inventory · Esc close */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Tab") { e.preventDefault(); setInvOpen((v) => !v); }
      else if (e.key === "Escape") { setSelectedId(null); setInvOpen(false); }
      else if ((e.key === "x" || e.key === "X") && selectedId) packObject(selectedId);
      else if ((e.key === "z" || e.key === "Z") && hoverId) setSelectedId(hoverId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, hoverId, packObject]);

  /* clock */
  const t0 = 10 * 60 + 15 + minutes; // Sun 10:15am + packing time
  const hr12 = (Math.floor(t0 / 60) % 12) || 12;
  const clock = `Sun. ${hr12}:${String(t0 % 60).padStart(2, "0")}${Math.floor(t0 / 60) < 12 ? "am" : "pm"}`;

  const visibleObjects = useMemo(
    () =>
      room.objects
        .filter((o) => (!objState[o.id].packed && !objState[o.id].sold) || o.id === packingId || o.id === sellingId)
        .sort((a, b) => a.z - b.z || (a.y + SPRITES[a.id].h * CELL) - (b.y + SPRITES[b.id].h * CELL)),
    [room.objects, objState, packingId, sellingId]
  );

  const selected = room.objects.find((o) => o.id === selectedId) || null;
  const packedList = removable.filter((o) => objState[o.id].packed);
  const soldList = removable.filter((o) => objState[o.id].sold);
  const lastUndoObj = undoStack.length > 0 && room.objects.find((o) => o.id === undoStack[undoStack.length - 1].id);

  const ui = {
    frame: { background: "#241509", border: "3px solid #120A04", boxShadow: "inset 0 0 0 2px #4A2E17, 0 3px 0 #000" },
    label: { fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "0.5px" },
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#160D06", overflow: "hidden", userSelect: "none" }}>
      <style>{`
        @keyframes packAway { to { transform: scale(0.05) translate(-40%, 60%); opacity: 0; } }
        @keyframes popIn { from { transform: scale(0.6); opacity: 0; } }
        @keyframes bounce { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-3px);} }
        @keyframes coinBurst {
          0% { transform: translate(-8px, -8px) scale(0.5); opacity: 0; }
          12% { opacity: 1; transform: translate(calc(var(--tx) * 0.35 - 8px), calc(var(--ty) * 0.8 - 8px)) scale(1); }
          40% { transform: translate(calc(var(--tx) * 0.7 - 8px), calc(var(--ty) - 8px)) scale(1); opacity: 1; }
          100% { transform: translate(calc(var(--tx) - 8px), 64px) scale(0.9); opacity: 0; }
        }
        @keyframes sellAmt {
          0% { transform: translate(-50%, 0); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translate(-50%, -52px); opacity: 0; }
        }
        .obj { cursor: pointer; transition: filter 120ms; }
        .obj:hover, .obj.sel { filter: drop-shadow(0 0 0 #FFD97A) drop-shadow(2px 0 0 #FFD97A) drop-shadow(-2px 0 0 #FFD97A) drop-shadow(0 2px 0 #FFD97A) drop-shadow(0 -2px 0 #FFD97A) brightness(1.06); }
        .obj.static { cursor: help; }
        .obj.packing { animation: packAway 0.5s ease-in forwards; }
        .panel { animation: popIn 140ms ease-out; }
        .coin { animation: coinBurst 0.8s cubic-bezier(0.3, 0.4, 0.7, 1) both; }
        .sellAmt { animation: sellAmt 0.9s ease-out both; }
        button { font-family: 'Courier New', monospace; }
      `}</style>

      <audio ref={sellAudioRef} src={SELL_CHIME_SRC} preload="auto" />

      {/* stage wrapper */}
      <div ref={wrapRef} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "center", position: "relative", flex: "0 0 auto" }}>

          {/* LAYER 0 — room shell */}
          <div style={{ position: "absolute", inset: 0 }} onClick={() => setSelectedId(null)}>
            <PixelCanvas w={240} h={180} draw={drawShell} />
          </div>

          {/* LAYER 1+ — object sprites */}
          {visibleObjects.map((o) => {
            const spr = SPRITES[o.id];
            const isSel = selectedId === o.id;
            const isPacking = packingId === o.id;
            const isSelling = sellingId === o.id;
            return (
              <div
                key={o.id}
                className={`obj ${isSel ? "sel" : ""} ${(isPacking || isSelling) ? "packing" : ""} ${o.removable ? "" : "static"}`}
                style={{ position: "absolute", left: o.x, top: o.y, zIndex: o.z * 10 }}
                onClick={(e) => { e.stopPropagation(); setSelectedId(o.id); }}
                onMouseEnter={() => setHoverId(o.id)}
                onMouseLeave={() => setHoverId((h) => (h === o.id ? null : h))}
                title=""
              >
                <PixelCanvas w={spr.w} h={spr.h} draw={spr.draw} />
                {hoverId === o.id && !isPacking && !isSelling && (
                  <div style={{
                    position: "absolute", left: "50%", top: -30, transform: "translateX(-50%)",
                    background: "#241509", color: "#F2E4C0", padding: "3px 8px", whiteSpace: "nowrap",
                    border: "2px solid #120A04", boxShadow: "inset 0 0 0 1px #4A2E17",
                    fontSize: 13, zIndex: 999, ...ui.label,
                  }}>
                    {o.name}{o.removable ? "" : " · stays"}
                  </div>
                )}
              </div>
            );
          })}

          {/* coin burst + floating amount — own overlay on its own timer so the
              item's shrink-away animation can't swallow or cut it short */}
          {sellFx && (
            <div style={{ position: "absolute", left: sellFx.x, top: sellFx.y, zIndex: 500, pointerEvents: "none" }}>
              {COIN_BURSTS.map(({ tx, ty, d }, i) => (
                <span
                  key={i}
                  className="coin"
                  style={{
                    position: "absolute", left: 0, top: 0, width: 16, height: 16,
                    background: P.goldHi, border: "3px solid #8A5E14", borderRadius: "50%",
                    boxShadow: `inset 2px 2px 0 #FFE9A8`,
                    animationDelay: `${d}ms`,
                    "--tx": `${tx}px`, "--ty": `${ty}px`,
                  }}
                />
              ))}
              <div
                className="sellAmt"
                style={{
                  position: "absolute", left: 0, top: -34, whiteSpace: "nowrap",
                  color: "#FFD97A", fontSize: 26, textShadow: "2px 2px 0 #120A04, -2px 2px 0 #120A04, 2px -2px 0 #120A04, -2px -2px 0 #120A04",
                  ...ui.label,
                }}
              >
                +${sellFx.amount}
              </div>
            </div>
          )}

          {/* box stack near the open door */}
          {packedCount > 0 && (
            <div style={{ position: "absolute", left: 24, top: 540, zIndex: 60, animation: "popIn 200ms ease-out" }}>
              <PixelCanvas w={40} h={40} draw={(ctx) => drawBoxes(ctx, boxCount)} redrawKey={boxCount} />
            </div>
          )}

          {/* ---- HUD: top-left status ---- */}
          <div style={{ position: "absolute", left: 14, top: 12, padding: "8px 14px 10px", zIndex: 200, ...ui.frame }}>
            <div style={{ color: "#F2E4C0", fontSize: 16, display: "flex", alignItems: "center", gap: 8, ...ui.label }}>
              <span style={{ display: "inline-block", width: 14, height: 14, background: "#E0A05A", border: "2px solid #120A04", borderRadius: 3 }} />
              {clock}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <span style={{ color: "#D94A4A", fontSize: 14 }}>♥</span>
              <div style={{ width: 110, height: 12, background: "#120A04", border: "2px solid #4A2E17" }}>
                <div style={{ width: "100%", height: "100%", background: "linear-gradient(#8FD14F,#5EA032)" }} />
              </div>
            </div>
          </div>

          {/* ---- HUD: top-right coins + inventory + undo ---- */}
          <div style={{ position: "absolute", right: 14, top: 12, display: "flex", gap: 8, zIndex: 200 }}>
            <button
              onClick={undoLast}
              disabled={undoStack.length === 0}
              title={lastUndoObj ? `Undo: ${lastUndoObj.name}` : "Nothing to undo"}
              style={{
                padding: "6px 12px", fontSize: 14, cursor: undoStack.length ? "pointer" : "default",
                color: undoStack.length ? "#F2E4C0" : "#6B563B", ...ui.frame, ...ui.label,
              }}
            >
              ↺ Undo
            </button>
            <div style={{ padding: "8px 14px", color: "#F2E4C0", fontSize: 16, display: "flex", alignItems: "center", gap: 8, ...ui.frame, ...ui.label }}>
              <span style={{ width: 12, height: 12, background: P.gold, border: "2px solid #8A5E14", borderRadius: "50%", display: "inline-block" }} />
              {coins}
            </div>
            <button
              onClick={() => setInvOpen((v) => !v)}
              style={{ padding: "6px 12px", color: "#F2E4C0", fontSize: 14, cursor: "pointer", ...ui.frame, ...ui.label }}
            >
              📦 {clearedCount}
            </button>
          </div>

          {/* ---- room-cleared banner ---- */}
          {done && (
            <div className="panel" style={{
              position: "absolute", left: "50%", top: 200, transform: "translateX(-50%)",
              padding: "16px 28px", textAlign: "center", zIndex: 300, ...ui.frame,
            }}>
              <div style={{ color: "#FFD97A", fontSize: 20, animation: "bounce 1.2s infinite", ...ui.label }}>
                ★ Bedroom cleared! ★
              </div>
              <div style={{ color: "#C9B896", fontSize: 13, marginTop: 6, ...ui.label }}>
                Only the curtains stay. Next room coming soon…
              </div>
            </div>
          )}

          {/* ---- selection panel ---- */}
          {selected && !invOpen && (
            <div className="panel" style={{
              position: "absolute", right: 16, bottom: 70, width: 300, padding: 14, zIndex: 300, ...ui.frame,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ color: "#FFD97A", fontSize: 16, ...ui.label }}>{selected.name}</div>
                <button onClick={() => setSelectedId(null)}
                  style={{ background: "none", border: "none", color: "#8A7350", fontSize: 15, cursor: "pointer", ...ui.label }}>✕</button>
              </div>
              <div style={{
                display: "inline-block", marginTop: 4, padding: "1px 8px", fontSize: 11, color: "#160D06",
                background: CATEGORY_COLORS[selected.category] || "#888", border: "2px solid #120A04", ...ui.label,
              }}>
                {selected.category}
              </div>
              <div style={{ color: "#DACBA6", fontSize: 13, lineHeight: 1.45, marginTop: 8, ...ui.label }}>
                {selected.check}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {selected.removable ? (
                  sellFormOpen ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ color: "#DACBA6", fontSize: 13, ...ui.label }}>Sold for $</span>
                        <input
                          type="number"
                          autoFocus
                          value={sellAmount}
                          onChange={(e) => setSellAmount(e.target.value)}
                          style={{
                            flex: 1, minWidth: 0, padding: "6px 8px", fontSize: 16, background: "#160D06", color: "#F2E4C0",
                            border: "2px solid #4A2E17", ...ui.label,
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => sellObject(selected.id, parseFloat(sellAmount))}
                          disabled={!!packingId || !!sellingId || sellAmount === "" || Number.isNaN(parseFloat(sellAmount))}
                          style={{
                            flex: 1, padding: "8px 0", fontSize: 14, cursor: "pointer",
                            background: "linear-gradient(#E0B65A,#B8862E)", color: "#2A1B08",
                            border: "3px solid #120A04", boxShadow: "inset 0 -3px 0 #8A5E14", fontWeight: 700, ...ui.label,
                          }}
                        >
                          Confirm sale
                        </button>
                        <button
                          onClick={() => setSellFormOpen(false)}
                          style={{
                            flex: 1, padding: "8px 0", fontSize: 14, cursor: "pointer",
                            background: "#2E1D0E", color: "#C9B896", border: "3px solid #120A04", ...ui.label,
                          }}
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => packObject(selected.id)}
                        disabled={!!packingId || !!sellingId}
                        style={{
                          flex: 1, padding: "8px 0", fontSize: 14, cursor: "pointer",
                          background: "linear-gradient(#8FD14F,#5EA032)", color: "#12260A",
                          border: "3px solid #120A04", boxShadow: "inset 0 -3px 0 #3E7020", fontWeight: 700, ...ui.label,
                        }}
                      >
                        [X] Pack it up
                      </button>
                      <button
                        onClick={() => sellObject(selected.id)}
                        disabled={!!packingId || !!sellingId}
                        style={{
                          flex: 1, padding: "8px 0", fontSize: 14, cursor: "pointer",
                          background: "linear-gradient(#E0B65A,#B8862E)", color: "#2A1B08",
                          border: "3px solid #120A04", boxShadow: "inset 0 -3px 0 #8A5E14", fontWeight: 700, ...ui.label,
                        }}
                      >
                        Sell (${selected.value})
                      </button>
                    </>
                  )
                ) : (
                  <div style={{ flex: 1, padding: "8px 0", textAlign: "center", fontSize: 13, color: "#8A7350", border: "2px dashed #4A2E17", ...ui.label }}>
                    Stays with the room
                  </div>
                )}
              </div>
              {selected.removable && !sellFormOpen && (
                <button
                  onClick={() => { setSellAmount(String(selected.value)); setSellFormOpen(true); }}
                  disabled={!!packingId || !!sellingId}
                  style={{
                    width: "100%", marginTop: 8, padding: "6px 0", fontSize: 12, cursor: "pointer",
                    background: "#2E1D0E", color: "#C9B896", border: "2px solid #120A04", ...ui.label,
                  }}
                >
                  ✎ Sold it for a different price? Enter it
                </button>
              )}
            </div>
          )}

          {/* ---- inventory panel ---- */}
          {invOpen && (
            <div className="panel" style={{
              position: "absolute", right: 16, top: 70, bottom: 70, width: 300, padding: 14, zIndex: 300,
              overflowY: "auto", ...ui.frame,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ color: "#FFD97A", fontSize: 16, ...ui.label }}>📦 Handled ({clearedCount}/{total})</div>
                <button onClick={() => setInvOpen(false)}
                  style={{ background: "none", border: "none", color: "#8A7350", fontSize: 15, cursor: "pointer", ...ui.label }}>✕</button>
              </div>
              {packedList.length === 0 && soldList.length === 0 && (
                <div style={{ color: "#8A7350", fontSize: 13, marginTop: 12, ...ui.label }}>
                  Nothing handled yet. Click something in the room to start.
                </div>
              )}
              {packedList.map((o) => (
                <div key={o.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginTop: 8, padding: "7px 10px", background: "#1A0F06", border: "2px solid #4A2E17",
                }}>
                  <div>
                    <div style={{ color: "#F2E4C0", fontSize: 13, ...ui.label }}>{o.name}</div>
                    <div style={{ color: CATEGORY_COLORS[o.category], fontSize: 11, ...ui.label }}>packed</div>
                  </div>
                  <button
                    onClick={() => unpackObject(o.id)}
                    style={{ padding: "3px 8px", fontSize: 11, background: "#2E1D0E", color: "#C9B896", border: "2px solid #120A04", cursor: "pointer", ...ui.label }}
                  >
                    unpack
                  </button>
                </div>
              ))}
              {soldList.map((o) => (
                <div key={o.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginTop: 8, padding: "7px 10px", background: "#1A0F06", border: "2px solid #4A2E17",
                }}>
                  <div>
                    <div style={{ color: "#F2E4C0", fontSize: 13, ...ui.label }}>{o.name}</div>
                    <div style={{ color: P.gold, fontSize: 11, ...ui.label }}>sold · +${objState[o.id].soldFor}</div>
                  </div>
                  <button
                    onClick={() => unsellObject(o.id)}
                    style={{ padding: "3px 8px", fontSize: 11, background: "#2E1D0E", color: "#C9B896", border: "2px solid #120A04", cursor: "pointer", ...ui.label }}
                  >
                    buy back
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ---- bottom hotbar ---- */}
          <div style={{
            position: "absolute", left: "50%", bottom: 12, transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 18, padding: "8px 18px", zIndex: 200, ...ui.frame,
          }}>
            {[["Z", "Check"], ["X", "Pack"], ["C", "Decorate·soon"], ["Tab", "Inventory"]].map(([k, label]) => (
              <span key={k} style={{ display: "flex", alignItems: "center", gap: 6, color: label.includes("soon") ? "#6B563B" : "#F2E4C0", fontSize: 13, ...ui.label }}>
                <span style={{ padding: "1px 7px", background: "#3A2410", border: "2px solid #120A04", boxShadow: "inset 0 -2px 0 #1A0F06", color: "#FFD97A" }}>{k}</span>
                {label.replace("·soon", "")}
                {label.includes("soon") && <span style={{ fontSize: 10, color: "#6B563B" }}>(soon)</span>}
              </span>
            ))}
            <span style={{ width: 2, height: 22, background: "#4A2E17" }} />
            <span style={{ color: "#C9B896", fontSize: 13, ...ui.label }}>
              {room.name} · {clearedCount}/{total} cleared
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
