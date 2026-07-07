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

/* six evenly-spaced directions for the sell coin-burst */
const COIN_ANGLES = Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2);

/* real embedded audio (not raw Web Audio oscillators) — media playback
   like this has a much better chance of ignoring a phone's silent switch
   than synthesized tones, same as how video sites get through it */
const SELL_CHIME_SRC = "data:audio/wav;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAGAA2AFwAiAC3AOQADQEtAUEBRgE6ARoB5wChAEkA4/9w//b+ev4C/pP9Mv3n/LT8n/yr/Nn8Kv2d/TD+3v6j/3cAVAExAgUDyANyBPkEWQWJBYgFUgXnBEgEegODAmkBNgD1/rH9dfxP+0n6b/nK+GP4P/hi+M34f/lz+qL7BP2M/iwA2QGCAxYFhwbHB8cIfgniCe4Jngn0CPMHogYLBTwDRAE1/x/9F/sw+X33Dfbw9DL03fP083v0bvXH9nz4f/q//Cj/pQEgBIIGtAiiCjgMZw0gDlwOFg5NDQgMTwowCL0FCgMwAEj9a/q19z/1IPNu8TnwkO957/jvDPGs8sz0W/dC+mr9swAFBD4HQQrzDDkP/BAsEroSoRLdEXQQcQ7jC+AIggXmAS3+ePro9p/zu/BY7o7sb+sH61zrbuw17qPwpfMg9/f6B/8sA0EHIguoDrURKhTvFfIWKBeMFiIV9BIUEJoMowhTBNH/QvvS9qny7e7D60fpkue25r7mqud26RPsa+9j89f3ofyUAYcGSwu1D5wT2xZTGesakxtDG/wZxReyFNwQZAxxBy4Czfx692nyx+2/6XfmD+Sf4jXi2eKG5C/nwOoZ7xT0h/lA/wwFtwoOEN8U/hhDHI8ezB/rH+kezhypGZUVthA1C0MFF//l+OfyU+1d6DPk/ODX3tvdEd573w7iteVR6rvvwvUx/M4CYAmpD3EVghqsHsghuSNqJNMj9yHkHrQaixWVDwgJHAIT+yj0nO2q54ribN5228XZa9lt2sXcYOAf5dnqXPFv+NP/RAeADkYVVxt7IIIkRSeqKKIoKidNJCQg0RqDFHEN2gUD/jD2qu60547hctyQ2AvW/tR11WzX1tqU34DlZOwD9Bz8YgSPDFcUchuhIakmWyqTLDwtTizNKc8ldSDuGXMSRgqxAQD5gfCC6EvhINs51sTS49Cq0BvSLtXI2cLf5+b57rH3vwDTCZwSyRoOIiso5CwPMIsxSjFML58rYybFH/8XVg8XBpb8JfMc6s3hhNqE1AXQMc0lzOzMgc/Q07PZ+OBf6Z3yYPxPBhMQUhm4Ifgozy4HM3c1BzawNHsxhCz0JQUe/RQsC+sAlfaH7B3jrNqC0+HN/sn+x/XH58nDzWrTqtpF4+zsTPcGAroMCReUIAMpCjBnNek4bDriOUw3wDJkLHEkKxvlEPoFz/rE70DlodtA02rMXsdLxFDDeMS7x/7ME9S83K7mj/H+/JUI6xOaHkAohTAdN8s7Yj7IPvg8/zgAMy4rzSEyF7kLzP/b81zotd1H1GXMV8ZRwnjA3MB4wzTI5c5N1yHhCOyf93wDOA9mGqMkki3lNFk6vT31PvY9yTqMNW8usiWlG6IQDQVQ+dLt++It2cDQ/skmxWHCx8FewxbHzcxP1Fjdlues8jf+zQkIFYEf3CjDMPI2LztWPVQ9KzvtNsIw4yiWHy8VDgqX/i/zPugn3kTV5c1LyKjEHcO3w2/GLMvE0fnZguMI7i35igS8D1waCyRzLEgzTThVO0Y8GTvXN6AypCsgI2QZxQ6mA2r4du0s4+jZ/9G3y0fH2MR+xDvGAcqqzwbXz9+46Wb0eP+LCjwVKx/9J2UvHzX6ONI6mDpPOAs09S1DJjsdLhN5CHz9mPIw6KPeRNZhzzXK78asxXfGR8kDzn/UgdzA5ejvnfp+BSwQRBpsI1MrsDFNNv84rzlXOAU11y/7KLEgRBcIDVoCnPcs7Wnjqto+02jNW8k8xxzH/MjLzGbSmdkk4rjrAPaeADMLYBXKHhsnCS5WM9Q2Yzj1N5A1SjFKK8UjAhtOEQEHevwV8jHoJt9H19jQFMwlySXIHMkBzLnQGdfn3tznqPHy+1sGiRAfGsYiMiofMFk0ujYuN7E1UTItLXUmZB5FFWkLKQHk9vPssONw23zUEs9iy4zJosmhy3fPAdUL3Ffkmu1+96wBxwt2FV8eNSawLJYxvTQHNms17jKoLr8oaSHpGIsPpQWQ+6XxP+iy30rYS9LpzUvLicqoy57OUNOS2Szh2elL8yz9IgfWEO8ZGyISKZQucjKINMQ0JTO7L6QqDyQ3HGQT5QkRAED2yewC5Dvct9Wz0FrNyssRzCvOBdJ8113ea+Zd7+H4ogJIDH0V7R1NJVsr4C+1MsAz+jJoMCQsVCYsH+8W5g1iBLz6RvFZ6ETgT9m407LPYc3XzBvOH9HI1ezbUuO469L0Tv7VBxMRtBlrIfInEC2WMGYycDKzMEEtOCjHISgaoRF9CBH/r/Wu7F3kCN3w1kzSRc/2zWnOm9B21NnZkeBh6ATxK/qCA7gMeBVzHWMkCSozLrwwjTGfMP0tvSkHJA4dEhVbDDgD/Pn48H/o2+BT2iDVcdFmzxHPddCF0yTYKN5b5XvtP/ZY/3QIQRFvGbYg1CaTK8guVjAxMFou4irqJZ4fNxj5Dy4HJv4x9aDswOTY3SbY3dMj0Q/Qq9Dx0szWGdyn4jvqkPJc+04EFg1nFfMceSO9KJAs0S5sL1wuqytyJ9YhDRtSE+sKJQJQ+bnwruh44VfbgtYk01zRN9G40tDVY9pH4EbnIu+T90wAAAlhESIZ/h+5JR0qBS1XLgcuGSyeKLgjkR1iFmwO9wVP/cP0nuwq5areWdll1fLSFtLX0i/VB9k93qHk+esD9Hb8BgVmDUsVbRyOInUn9yr2LF8tLyxyKUElwh8nGawRlAkoAbb4h/Dn6BjiWtze183UQtNK0+TUA9iI3EviF+mw8M/4LAF9CXURzRhEH58kryhPK2gs8SvvKXQmoCGfG6cU+AzWBI38ZPSn7Jrlfd+I2uXWtdQM1O7UVdco20bggOad7V31e/2rBacNJhXjG6MhMiZoKSgrYysYKlInKyPIHVwXHxBTCD8ALfhj8CjpvOJb3TPZatYY1UnV+tYc2pLeNOTO6iTy9fn5AekJfRFyGIgeiSNIJ6UpiirwKdwnYiSiH8cZBhObC8sD3PsU9LrsEOZR4LLbW9hq1vDV8dZj2TDdNeJF6CjvofZr/kAG2w33FFQbuSD1JOMnaSl6KRYoSSUtIegbqRWqDikHa/+090rwcOlj41regtr81+DWNtf72B/chOAE5mzsgvMG+7MCRwp7ERAYyh11IuklByi8KAEo3yVoIr0dCBh8EVUK1AI8+9Hz1uyK5iXh2NzJ2RLYxNfg2FzbId8M5PLpnPDO90j/xQYEDsEUwhrQH74jaCa4J6InKCZWI0cfIBoPFEwNFAao/kn3PPC/6QzkV9/K24PZmNgQ2ebaCt5e4rzn8u3J9AP8XQOXCm8RqRcLHWYhkyR1Jv0mJSb3I4Ug8BthFgoQJQnwAa36m/P77Ann+eH53S3brtmH2bzaP9364Mzlh+v58ej4EgA7ByAOhBQtGugejCL3JBUm3CVNJHkheB1vGIwSBAwSBfb97fY48BTqt+RR4Ard/9pC2tnavtzg3yLkXeli7/v17Pz2A9oKWxE9F0wcWiBEI+8kTiVcJCMiuB46GtEUrg4JCB4BLPpw8yjti+fM4hXfidw82zvbhdwN377idOcH7ULz7fnMAKMHMw5AFJYZAx5gIZAjfyQmJIcisR+/G9UWHxHRCiMEU/2d9j7wbupj5UjhRN5x3N7bkNyC3qDhz+Xo6r3wGvfF/YAEEgs+Ec0WjBtSH/0hdSOtI6QiZCABHZkYVhNmDQAHXQC6+VDzW+0Q6J7jLeDb3b7c3tw73sfgbOQI6XDudfTg+ncB/gc8DvcT/RggHTsgMyL3IoAi0iD9HRwaUBXHD7EJRgPA/Fn2S/DN6g/mPOJ339fda9033jPgTONn513sA/Il+Iz+/AQ/CxoRWRbOGk8evyAHIhwi/iC3Hl0bDhfwETMMCQat/1T5OvOV7ZfobuQ+4SXfM95z3uDfbuIG5obqxu+W9cL7EgJNCDwOqBNiGD8cHB/gIHwh6iAwH10cjRjgE4IOpAh5Ajv8IfZh8DDrvOYs46LgM9/r3s7f0uHl5Ovov+028x/5Q/9rBWIL7xDjFRAaUR2IH6QgmSBoHx0dzRmWFZ4QEgskBQv/+/gt89TtIOk85UriZeCd3/jfdOEC5Izn8OsI8aX2lPyeApEINA5VE8cXYRsEHpcfDSBjH58d0BoRF4MSUQ2oB7wBxPvy9X3wluto5xnkxuGE4F7gVOFf42rmW+oN71f0B/rs/84Fewu/EGoVUxlXHFoeTB8jH+MdlRtQGDIUXw8DCk8Edv6t+CjzGO6r6QjmUeOc4frgb+H44oXl/+hI7TjyovdV/R4DygglDv4SKxeGGvIcVx6sHuwdHhxVGagVORExDL0GDgFY+831oPD/6xToAeXi4srhw+HL4tvk3ue560nwZvXg+oUAJQaMC4kQ7xSYGGIbNB3/HbwdbRweGuYW4BIxDgUJiQPw/Wr4KvNg7jbq0uZR5MviTOLY4mvk9eZh6o3uVvOO+Aj+kQP5CA8OpBKQFq8Z5hshHVYdghyuGusXURQBECML4gVuAPn6sfXJ8Gvsv+jl5ffjB+Mb4zTkRuZA6QXtdPFk9qn7EwFyBpULThBzFN4XchoWHL0cYRwGG7gYjBWfERUNFwjRAnX9Mfg0863uw+qZ50zl8OOS4zPkz+VW6LHrwe9j9Gv5rv75AyAJ8w1HEvQV2xjhGvUbDBwnG04ZkhYLE9oOJQoWBdz/pPqe9ffw2exp6cXmBeU55GfkjuWi55HqQO6N8lL3ZPyTAbQGlwsPEPYTJxeHGQAbhhsUG64ZYhdEFHAQCgw4BygCBv0B+ETz/O5P613oQeYN5c3kgeUk56bp8Ozl8GD1OvpG/1YEPgnRDecRWhULGOMZ0hrPGtoZ/RdJFdYRww02CVgEVf9Z+pH1KfFI7RHqoOcM5mHlp+Xa5u7o0utq75fzMvgR/QkC7QaSC8wPdxNyFqEY8xlaGtMZZRgbFgsTUQ8OC2gGiwGj/Nn3WvNP79vrHukw5yLm/eXC5mro5uof7vjxTvb6+tL/qARUCasNhRHAFD8X7Bi4GZwZmhi7Fg8UsBC8DFcIpwPa/hf6jPVg8bntt+p36AvngObb5hjoLOoE7YXwkfQD+bL9cwIeB4YLhg/5Er8VwRftGDcZnxgpF+MU4hFBDiAKpgX7AEn8ufd286TvZ+zc6RnoLuci5/bno+kY7D/v/fIu9637UQDxBGQJgA0hEScUdhb7F6cYdRhnF4YV5RKaD8QLhQcEA2r+3/mN9ZrxKu5c60npA+iV5wPoSelb6yfukvF99cf5Rv7TAkYHdgs9D3oSDxXmFu8XHxh2F/oVuRPHED8NQQnxBHYA+fuh95bz++/z7Jfq/Ogx6D3oHunO6jvtUfDz8wD4VPzGADEFbAlRDbwQkBOyFREXnxdZF0AWYBTIEZIO2QrABmwCBP6u+ZP11/Gc7v/rFurz6KHoIOlu6n3sO++P8lz2ffrP/ioDZwdgC/IO+xFiFBEW+BYRF1kW2RSdErsPTAxvCEgE/f+y+4/3uvNU8H3tTuvZ6SzpTek66uzrUe5U8dv0xfjv/DIBaQVvCR4NVhD6EvIULRagFkcWJhVGE7oQmA38CQgG3wGo/Yb5n/UY8g/vn+ze6t3po+ky6obrke1C8IDzLfco+03/dwOBB0YLpA59EbgTQRUKFgwWRxXEE48RvA5mC6oHqwON/3P7hPfi86/wBu4B7LDqH+pU6kvr/exZ70rytvV9+X79kwGZBWwJ6AzwD2YSNhRQFakVQBUXFDkSuA+rDCwJXAVdAVT9ZPmw9Vvyge897aLrv+qc6jrrkuyZ7jzxY/Tx98f7wv+8A5QHJwtVDgARERN2FCIVEBVAFLsSjRDKDY0K8gYZAyf/PPt+9w70CvGO7rDsgesK61DrUewC7lXwNPOF9ir6A/7sAcIFZAmwDIkP1BF/E3kUuxRCFBMTORHEDssLaQi8BOYACv1J+cX1n/Lz79jtYeyb643rN+yT7ZXvKfI69ar4W/wrAPkDogcFCwQOgxBtErETQxQeFEQTvRGXD+UMwAlEBpECyf4N+373PfRn8RXvXO1M7O3rROxM7fzuRPER9Ej3zPp+/jwC5QVXCXUMIQ9FEcwSqRPVE08TGhJEENsN9wqwByYEdwDH/DT53/Xm8mTwcO4b7XDsdewq7YnuhPAL8wT2V/nl/I0ALwSqB+AKsg0IEM0R8RJqEzQTUhLLEK0ODAz/CKIFFAJ1/uT6gvdu9MPxmu8E7hHtyewu7Tzu6u8o8uL0//dj+/D+hAIBBkcJOAy6DrcQHRLfEvcSZRIsEVoP/gwuCgMHmgMSAIv8JPn89S7z1fAG79DtPu1V7RTudO9p8eDzxPb6+WX95gBeBK4HtwpfDY4PMBE2EpkSVBJqEeMPzg0+C0kICgWfASj+wfqL96L0IPIc8Kju0e2d7Q/uIu/N8ADzqPWr+PD7WP/EAhcGMgn5C1QOLBBzERsSIRKEEUkQew4sDHEJYQYYA7b/V/wa+Rz2ePNF8ZjvgO4F7izu9O5V8ELyq/R595L63P03AYYErAeMCgwNFQ+WEIERzxF7EYsQBg/6DHoKnQd8BDMB4v2k+pj32PR98p3wSO+K7mru5+7/76bxzvNj9k75dPy5//4CKAYaCbkL7Q2kD80QXhFTEawQbw+nDWULvQjIBZ8CYf8p/BT5P/bC87TxKPAr78bu/O7L7yzxEvNr9SP4IftK/oABqQSnB14KuAyeDgAQ0RALEasQtg8zDjEMwgn7BvcD0ACk/Y36qPcQ9dryHPHk7z7vL++379LwdfKS9BT35vnu/BAAMQM0Bv8IdwuIDR4PKxCmEIwQ3A+eDt0MqAoUCDkFLwIU/wH8E/lk9g30IvK18NHvgO/E75nw+fHX8yH2xPin+7D+wwHGBJ0HLwpkDCkObQ8nEE4Q4w/pDmkNcQsTCWMGewN1AGz9e/q890n1N/OZ8X3w7e/u73/wnPE680v1u/d1+mD9YQBeAzwG4Qg1CyMNmg6OD/UPzA8VD9cNHAz1CXUHswTHAc3+3vsV+Yz2WPSO8j7xc/A08ITwX/G98pL0zvZb+ST8Dv//Ad4EkAf9CRAMtQ3eDoEPmA8jDyYOqQy7Cm0I1AUIAyEAOv1t+tP3g/WT8xPyEfGW8KXwP/Fe8vbz+/VZ+Pz6yv2rAIYDQAbACPIKvwwaDvUOSQ8UD1YOGA1lC0sJ3wY1BGcBjf7B+xz5tvak9PnyxPEQ8eLwPfEc8njzRPVx9+r5mPxl/zUC8QSAB8sJvAtDDVMO4Q7pDmoOag3yCw4K0QdOBZwC1f8O/WT67fe/9e7zi/Kh8TnxVvH38RbzqvSi9u74evst/u4AqAM/Bp4IrgpdDJwNYQ6jDmIOnw1jDLYKqghRBsADDQFT/qn7Jvnh9vD0YvNH8qjxivHu8dHyKvTu9Qv4cPoF/bX/ZQIABW0HlwlpC9QMyw1FDj8OuQ23DEMLagk9B9AEOAKO/+j8XvoJ+Pv1SfQA8y3y1/EA8qjyx/NU9UD3e/nw+4j+LAHFAzwGeQhqCvwLIQ3QDQMOtw3wDLULEQoSCMwFUgO7AB/+lfsy+Q73O/XK88fyPPIs8pnyf/PV9I/2nfjt+mv9/v+QAgsFWAdhCRYLZgxGDa8NnA0ODQwMnQrPCLIGWgTbAU7/xvxd+if4OPai9HPztvJw8qXyUfNw9Pb11/cA+l783P5jAd4DNQZTCCUKnAupDEUNaA0TDUgMDwtzCYIHTgXsAm8A8f2F+0L5PfeH9TD0RPPL8sjyPfMl9Hf1KPcn+WT7yf1AALYCEgVABysJxAr7C8YMHQ3/DGsMaAv+CTsILwbrA4UBE/+p/F76R/h19vv05PM68wTzQvP08xH1kfZl+Hz6xfwq/5UB8gMrBisI4Qk9CzQMvQzTDHUMpwtxCt0I+gbYBIwCKQDH/Xn7VPls99L1lPS981XzX/Pb88T0Eva596n50/sh/n4A1wIWBSYH9QhzCpILSQyQDGcMzgvLCmcJrwezBYMDNQHe/pD8Y/po+LP2UvVS9LvzkvPa84/0q/Uj9+v48vom/XL/wgEDBB4GAgidCeEKwgs5DEIM3QsNC9oJTwh5BmkEMwLq/6L9cPto+Zz3HPb29DP02/Pw83L0XPWl9kL4JPo7/HL+tgD0AhYFCge+CCIKKwvPCwgM1Qs4CzYK2AgrBz4FIgPrAK3+fPxq+ov48fao9b30N/Qc9Gz0JPU+9q/3avlh+4D9tf/rARAEDwbYB1kJhQpTC7oLtwtLC3oKSgnIB/8FAQTgAbD/gv1r+3/5zfdm9lb1pvRd9Hz0A/Xt9TH3xfiY+pz8vv7pAAwDFAXsBoYI0wnGClkLhQtJC6gKpwlPCK0G0ATHAqcAgv5q/HT6sPgu9/31JvWw9KH0+fSz9cr2M/jj+cj71P3y/w4CGQT+BawHFQksCuYKPwsxC78K7QnBCEcHjAWgA5MBev9m/Wn7l/n/96/2tPUW9dr0A/WP9Xj2t/dA+Qb79/wE/xcBIQMOBc0GTwiECWQK5goGC8IKHgoeCc0HNgZoBHMCaABb/l38gPrV+Gz3UPaM9Sb1IvV/9Tz2UPex+FT6Kvwi/igALgIfBOsFgQfSCNQJfQrHCrAKOQpmCT8IzgYgBUQDTAFJ/039avuw+TH49/YQ9oL1U/WF9RT2/fY2+LX5bftN/UT/QQEzAwcFrQYXCDcJBAp3CosKQAqZCZwIUgfGBQcEJAIuADj+UvyO+vz4qfei9u/1l/Wd9QH2vvbP9yn5wPqG/Gr+XABKAiME1gVUB5AIfgkWClQKNAq4CeUIwwdaBrkE7gIKAR3/OP1t+8z5Y/g/92r27PXI9QH2lPZ796/4JPrO+5z9gP9nAUED/QSMBt8H6winCQsKFQrECRsJIAjdBlwFqwPaAfr/Gv5L/J76I/nm9/L2UPYF9hT2ffY790j4mvkl+9z8rv6KAGICJATABSgHTggqCbMJ5Am8CT0JaghMB+0FWQSeAswA9f4n/XP76PmV+IX3wvZS9jr2efYO9/T3IvmN+in85/23/4gBTAPxBGoGqAehCEwJowmjCUwJogiqB20G9wRVA5YByf/+/Ub8sPpL+SL4QPeu9m/2h/b09rP3vPgG+oX7LP3s/rUAdwIiBKgF+gYNCNgIUgl4CUkJxgj1B9wGhgX+A1MClADR/hj9evsF+sf4yvcX97X2p/bs9oT3Z/iP+fD6f/ws/ur/pgFUA+QERwZxB1gI8wg9CTUJ2QguCDkHBAaZBAUDVgGd/+f9RPzE+nP5XfiN9wn31vb29mf3Jfgq+Wv63/t4/Sb/2wCJAh8EjwXNBs4Hhwj0CBAJ2ghVCIUHcQYkBakDDQJgALD+DP2E+yT6+fgO+Gv3FfcQ91v39PfV+Pf5TvvP/G3+FwDBAVoD1QQjBjoHEAidCNwIywhrCL8HzgagBT8EuQIbAXT/0v1E/Nj6m/mY+Nj3Yvc692D31PeS+JL5zPo0/L79XP/+AJcCGQR1BaAGjwc5CJkIqwhwCOgHGgcLBscEWAPMATAAk/4D/Y/7Q/or+VH4vPdy93X3xfdg+D75Wfqn+xv9qf5BANgBXQPEBP8FBAfKB0kIfQhlCAEIVQdnBkEF6wNyAuQAT//A/Ub87vrE+dP4Ivi595r3x/c++Pr49vkn+4T8AP6N/x0BowIRBFoFcwZRB+wHQAhKCAkIgAe0BqsFcAQNA48BBAB6/v38nPtj+lz5kvgM+Mz31/cs+Mb4ovm2+vr7Yv3h/mgA7AFfA7IE2wXPBoUH9wchCAIImwfwBgYG5wSbAzACsQAu/7H9SvwF++35DPlq+Az49/cp+KL4XvlU+n77z/w+/rv/OQGtAggEPwVGBhQHogfrB+wHpwccB1IGTwUdBMYCVgHc/2P++Pyq+4P6jvnT+Fn4JPg2+I74KfkB+g/7Sfyk/RX/iwD+AV4DnwS2BZoGQQeoB8kHpAc6B48GqgWRBFAD8gGCABD/pf1Q/B37FvpE+bD4XvhQ+Ij4A/m8+a760PsW/Xf+5f9SAbQC/gMiBRkG2AZZB5gHkgdIB70G9QX4BM8DgwIiAbf/T/72/Ln7o/q++RL5pPh4+JD47PiG+Vv6Y/uU/OP9Rf+rAA0CWwOLBJIFZgYAB1sHcwdJB90GMwZSBUEECgO4AVcA9f6b/Vf8Nfs/+nz59Pis+Kf44/hf+Rf6BPsd/Fn9rP4KAGgBugLyAwYF7AWdBhIHRwc7B+4GYgadBaYEhQNFAvEAlf89/vb8yvvE+u75T/ns+Mr46PhG+eD5svqy+9r8Hf5x/8gAGQJXA3YEbQUyBr8GEAchB/EGgwbbBf4E9APHAoIBLwDc/pP9YPxO+2f6s/k3+fn4+vg6+bf5bfpV+2b8l/3e/i4AfAG9AuQD6ATABWQGzQb6BucGlwYLBkkFVwQ/AwoCwwB3/y/+9/zb++b6HvqL+TP5GPk8+Zz5NvoD+/77HP1U/pr/4wAkAlEDYARIBf8FgQbHBtEGnQYuBocFrgSsA4kCUAELAMf+jf1q/Gj7kPro+Xj5Q/lK+Y75DPq/+qH7q/zS/Qz/TgCNAb4C1gPLBJQFKwaKBq8GlwZDBrgF+QQNBP4C0wGZAFv/Iv76/O77B/tN+sb5ePll+Y357/mI+lH7Rfxa/Yb+wP/6ACwCSgNKBCMFzgVEBoEGhAZMBtwFNwVjBGgDTgIhAer/tP6J/Xb8gvu4+h36t/mK+Zj53/ld+g376vvs/An+N/9rAJwBvgLHA60EaQX0BUkGZgZJBvMFaAWtBMcDwAKgAXIAQv8X/v/8Afwo+3v6APq6+a752vk++tb6m/uI/JT9tv7j/w8BMgJCAzME/wSdBQgGPQY6Bv8FjQXqBBsEJwMXAvUAy/+j/of9gvyd+9/6UPr1+c/54vks+qr6WPsw/Cn9PP5f/4YAqQG8ArYDjwQ+Bb4FCgYgBv4FpwUcBWQEhQOGAnABTwAr/w/+BP0V/En7qPo4+vv59fkl+or6IPvi+8j8y/3i/gEAIQE3AjgDHATaBG0FzgX7BfMFtAVCBaIE1wPrAuQBzQCv/5T+h/2P/Lj7B/uD+jD6Evoq+nb69Pqf+3H8Y/1t/oT/ngCzAbkCpgNxBBQFigXNBdwFtgVdBdQEHwRGA08CRAEtABf/CP4L/Sn8avvV+m76Ovo5+m360/pn+yT8BP3//Qv/HwAyAToCLQMEBLYEPgWWBbwFrgVtBfsEXASXA7ECtAGnAJb/iP6H/Z780vst+7T6avpT+m/6vfo6++L7r/ya/Zr+pv+0ALwBtAKUA1ME6wRWBZIFmwVxBRcFjwTeAwoDGwIaAQ8ABf8D/hP9PvyL+wH7o/p2+nv6svoY+6v7ZPw9/S/+Mf86AEABOwIiA+wDkwQQBV8FfgVrBSgFtgQaBFoDewKGAYQAf/99/on9rPzu+1T75Pqi+pH6sfoB+337Ivzq/M39xP7F/8cAwwGvAoIDNQTCBCQFWAVcBS8F1ARNBKAD0gLrAfMA9P/1/v/9HP1T/Kz7LPvX+rH6u/r0+lv76/ug/HP9Xf5V/1IATQE7AhYD1ANvBOMEKgVCBSwF5gR1BNwDIANIAlwBZABq/3T+jf28/An8efsT+9n6zvrx+kL7vvtf/CH9/f3r/uL/2QDJAagCbwMXBJoE9AQgBR8F7wSTBA4EZAOdAr4BzwDb/+f+/f0m/Wn8zPtW+wn76vr4+jP7mvso/Nn8pv2H/nb/aABXAToCCQO7A0wEtwT2BAkF7gSnBDcEoAPpAhgCNAFGAFf/bf6R/cz8JPye+0H7DvsI+y77gPv7+5n8Vv0r/g///P/oAM0BoAJcA/oDcwTEBOoE5ASyBFUE0gMsA2sCkwGuAMP/2/78/TH9f/zs+3/7Ovsh+zP7cPvX+2P8D/3V/a/+lP98AGABOAL7AqMDKgSMBMQE0QSzBGsE+wNnA7UC6wEPASsARv9n/pf93Pw//MP7bftB+0D7afu8+zX80PyI/VX+Mf8UAPYAzwGYAkkD3ANNBJYEtgSsBHcEGwSZA/cCOwJrAY4Arv/Q/v39PP2V/Az8p/tq+1b7bPur+xH8mvxC/QL+1P6x/44AaAE0Au0CiwMIBGIEkwScBHsEMQTCAzEDhALAAe0AEgA3/2P+nf3t/Fn85/uZ+3P7dvui+/X7bfwE/bf9ff5R/yoAAgHRAY8CNgO/AycEaQSEBHUEPwTiA2MDxQIPAkYBcgCb/8f+/v1I/av8K/zP+5j7ifui++P7SPzP/HL9Lf73/sv/nwBuATAC3gJyA+cDOQRkBGgERAT6A4wD/gJWApgBzQD7/yr/X/6k/f/8dPwK/MP7o/uq+9j7LPyi/Db94/2j/m//PgANAdEBhQIiA6IDAgQ+BFMEQQQJBKwDLwOVAuQBIwFXAIn/v/4B/lX9wfxK/PX7xfu6+9f7GPx9/AH9oP1U/hf/4v+tAHMBKwLPAloDxgMRBDYENgQQBMUDWAPNAioCcwGvAOb/Hv9d/qz9EP2P/Cz87fvS+937Dfxg/NT8Zf0N/sb+iv9RABYB0AF6Ag4DhgPeAxMEIwQPBNUDeQP+AmgCvQECAT4Aev+5/gT+Yv3X/Gj8G/zw++r7CfxL/K/8Mf3M/Xr+Nv/4/7oAdgElAsACQgOmA+oDCgQGBN0DkgMnA58CAAJQAZMA0/8T/13+tf0i/an8TvwV/P/7Dfw//JL8BP2R/TT+5/6j/2EAHQHPAW8C+gJqA7sD6gP2A94DowNIA88CPQKXAeMAKABs/7T+Cf5v/e38hvw//Br8GPw5/H383/xe/fT9nf5S/wwAxgB5AR4CsAIqA4cDxAPfA9cDrQNiA/gCdALZAS8BeQDB/wr/Xf6+/TP9w/xv/Dz8Kvw7/G/8wvwy/bv9Wf4F/7r/cQAkAcwBZALmAk4DmQPCA8oDrwN0AxkDowIVAnQBxwATAF//sP4O/n39Av2j/GP8Q/xF/Gj8rPwN/Yn9G/6+/mz/HgDQAHoBFwKgAhIDaAOfA7YDqwN/AzMDywJKArUBEAFiALH/A/9e/sf9Rf3c/I/8YfxU/Gj8nfzv/F394/18/iL/0P9+ACkByQFYAtMCMwN3A5sDnwODA0YD7QJ5Au8BUwGsAAAAVP+t/hP+i/0Y/cD8hfxq/G/8lfzY/Dn9sv1A/t3+hP8vANkAegEPApAC+wJKA3sDjgOAA1IDBwOhAiMCkgHzAEsAo//8/mD+0f1X/fX8r/yG/H38k/zJ/Bv9h/0J/p3+Pf/k/4oALQHFAUwCvwIZA1YDdgN2A1gDGwPCAlECywE0AZQA7/9K/6z+Gv6Z/S793Pyn/JD8mfy//AP9Yv3Z/WL++v6b/z4A4AB6AQYCgALjAiwDWQNnA1YDKAPdAngC/gFxAdgANwCW//f+Yv7c/Wn9Dv3N/Kr8pPy9/PP8RP2u/S3+vP5W//b/lQAwAcABQAKrAv4CNgNSA08DLgPxApoCKwKoARcBfQDf/0H/q/4g/qf9Q/34/Mj8tfzA/Oj8LP2K/f39g/4V/7D/TADnAHkB/QFwAswCEAM3A0EDLwP/ArUCUgLaAVIBvwAkAIr/8/5l/uf9e/0m/ev8zPzK/OT8G/1s/dP9T/7Z/m3/BgCfADIBugEzApcC5QIXAy8DKQMHA8kCcwIHAogB/ABnAND/Ov+r/ij+tv1Y/RP96PzZ/Ob8EP1U/a/9IP6h/i//w/9ZAOwAdwH0AWACtgLzAhYDHQMIA9gCjgItArkBNQGnABMAf//v/mn+8v2N/T79CP3u/O78C/1C/ZH99/1u/vT+g/8VAKcAMwG1ASYChALLAvkCDQMEA+ECowJOAuQBagHjAFQAw/8z/6v+L/7E/W39Lf0H/fz8C/02/Xn90/1B/r7+Rv/V/2QA8QB0AesBUAKgAtgC9wL6AuQCswJpAgsCmQEaAZEAAwB2/+3+bv79/Z/9Vv0l/Q79Ef0v/Wf9tf0Y/o3+Dv+X/yMArwA0Aa4BGQJxArMC3ALsAuECvAJ/AisCxAFNAcsAQQC3/y7/rf44/tP9gv1H/SX9Hf0v/Vr9nf31/WD+2f5d/+b/bgD0AHEB4QFAAooCvQLYAtkCwAKPAkYC6gF8AQEBfQD1/27/6/5z/gn+sP1t/UH9Lf0z/VP9iv3X/Tj+qf4m/6r/MAC1ADQBpwEMAl4CmwLAAswCvwKZAlwCCgKlATIBtAAwAKz/Kf+v/kD+4f2W/WD9Qv09/VH9fP2//Rb+ff7z/nH/9f93APcAbQHXATACdAKjAroCuAKeAm0CJQLKAWAB6QBqAOj/Zv/q/nj+FP7C/YP9W/1L/VT9dP2s/fj9Vv7E/jz/u/88ALsAMwGgAf8BSwKDAqQCrQKeAngCOwLqAYgBGQGgACEAov8m/7H+Sf7w/ar9ef1e/Vz9cf2e/d/9NP6Z/gv/hf8CAIAA+QBpAcwBIAJfAooCnQKZAn4CTAIFAq0BRQHSAFgA3P9g/+r+fv4g/tP9mf12/Wn9c/2V/cz9F/5z/t3+Uf/L/0YAvwAxAZkB8gE5AmwCiQKQAn8CWAIbAswBbQEBAYwAEgCZ/yP/tP5S/v79vf2R/Xr9ev2R/b39/v1R/rP+If+W/w4AhwD6AGQBwgEQAksCcQKBAnsCXgIsAucBkAEsAb0ARwDR/1v/6/6E/iz+5P2v/Y/9hf2R/bT96/00/o7+9f5l/9r/TwDDAC8BkQHlAScCVgJvAnMCYQI5Av0BsAFTAeoAegAFAJH/If+4/lv+Df7Q/aj9lP2X/a/93P0c/m3+zP42/6f/GgCNAPsAXwG3AQACNwJZAmYCXgJAAg8CygF2ARQBqQA4AMf/Vv/s/ov+OP71/cT9qP2g/a/90v0I/lD+qP4L/3f/6P9YAMYALQGJAdcBFQJAAlYCVwJEAhsC4AGUAToB1QBpAPr/iv8f/7z+ZP4b/uP9vv2u/bP9zP35/Tj+h/7k/kr/t/8lAJIA+wBaAa0B8QEjAkICTAJCAiQC8gGvAVwB/gCXACoAvf9S/+3+kv5E/gX+2f3A/bv9yv3u/ST+a/7A/iD/iP/0/2AAyAAqAYEBygEDAioCPgI9AigC/wHFAXsBIwHCAFkA7/+E/x7/wP5u/in+9v3U/cf9zf3o/RX+U/6g/vr+Xf/F/y4AlwD6AFQBogHhARACKwIzAicCCALXAZUBRQHpAIUAHQC1/0//7/6Z/lD+Ff7t/df91P3l/Qn+P/6E/tf+NP+Y/wAAZgDKACcBeQG9AfIBFQImAiMCDQLkAasBYgENAa8ASwDl/3//Hv/F/nf+N/4I/ur93/3n/QL+L/5s/rj+D/9u/9L/NwCbAPkATgGXAdIB/QEVAhsCDgLuAb0BfAEuAdUAdQARAK7/TP/y/qD+W/4l/gD+7f3t/f/9I/5Y/pz+7f5H/6f/CQBsAMsAIwFwAbAB4QEBAg8CCgLzAcsBkgFLAfkAnQA9ANv/ev8e/8r+gf5F/hn+//32/QD+HP5I/oX+zv4i/37/3/8/AJ4A9wBIAY0BxAHqAQACAwL1AdQBpAFkARgBwwBmAAYAp/9L//T+qP5n/jX+E/4D/gT+GP48/nH+s/4B/1j/tf8TAHEAzAAfAWgBpAHRAe4B+QHzAdsBsgF6ATUB5QCNADAA0/93/x//z/6L/lP+K/4T/g3+GP40/mH+nP7j/jX/jf/q/0YAoQD1AEEBggG1AdgB6wHtAd0BvAGMAU4BBAGxAFgA/f+i/0n/+P6v/nP+RP4m/hj+G/4w/lT+iP7J/hX/aP/C/xwAdgDMABoBXwGXAcEB2gHkAdwBwwGaAWMBIAHTAH4AJQDM/3P/IP/V/pT+Yf48/ib+Iv4v/kz+eP6y/vf+Rv+c//T/TACjAPMAOwF3AacBxwHXAdcBxgGlAXUBOQHxAKEASwD0/5z/SP/7/rf+fv5U/jj+LP4x/kb+a/6e/t3+J/94/83/JAB6AMwAFgFWAYsBsQHIAc8BxgGsAYQBTgEMAcEAcAAaAMX/cf8i/9r+nv5u/kz+Of43/kX+Yv6O/sb+Cv9X/6n//v9SAKQA8AA0AW0BmQG2AcQBwgGwAY8BYAElAd8AkgA/AOz/mP9I///+v/6K/mL+Sf5A/kb+XP6B/rP+8f44/4b/2P8rAH0AywARAU4BfgGhAbYBuwGwAZcBbwE6AfoAsQBiABAAv/9u/yP/4P6o/nv+XP5M/kv+Wv53/qP+2v4c/2b/tf8GAFcApQDtAC0BYgGLAaUBsQGuAZsBegFLAREBzgCDADQA5P+U/0j/A//G/pX+cf5a/lP+W/5x/pb+x/4D/0j/lP/j/zIAgADKAAwBRQFyAZIBpAGoAZwBggFaASYB6ACiAFYABwC5/23/Jv/m/rH+iP5s/l7+X/5u/oz+t/7t/i3/dP/A/w4AWwCmAOoAJgFYAX0BlQGfAZoBhwFmATgB/wC+AHYAKgDd/5H/Sf8H/87+oP5//mv+Zf5u/oX+qv7a/hX/V/+g/+z/OACCAMgABwE8AWYBhAGUAZUBiAFuAUcBFAHXAJMASgAAALT/bP8o/+3+u/6U/nv+b/5x/oL+oP7K/v/+Pf+C/8v/FQBfAKYA5wAfAU4BcAGGAY0BhwFzAVIBJQHuAK8AaQAgANf/jv9K/wz/1v6r/o3+e/53/oH+mf69/uz+Jf9m/6z/9f89AIQAxgABATMBWwF1AYMBgwF2AVsBNAECAcgAhgBAAPj/sP9r/yv/8/7E/qH+iv6A/oP+lP6y/tz+EP9M/47/1f8cAGIApgDjABgBQwFjAXYBfAF1AWEBQAEUAd4AoABdABcA0f+M/0v/EP/e/rb+mv6L/oj+k/6r/s/+/f41/3P/t//9/0IAhQDEAPwAKwFPAWcBcwFyAWQBSQEiAfIAuQB5ADYA8f+s/2r/Lv/5/s3+rf6Y/pD+lf6m/sT+7f4g/1r/mv/e/yIAZQClAN8AEQE5AVcBaAFsAWQBTwEuAQMBzwCTAFIADwDM/4r/TP8V/+b+wf6n/pr+mf6l/r3+4P4N/0P/gP/B/wMARgCGAMIA9gAiAUQBWgFkAWEBUgE3AREB4gCrAG0ALADr/6n/av8x///+1/65/qb+n/6l/rj+1f7+/i//aP+l/+b/JwBoAKQA2wAKAS8BSgFZAVwBUwE+AR0B8wDAAIYASAAHAMf/iP9O/xr/7v7L/rT+qP6p/rX+zv7w/h3/Uf+M/8r/CgBKAIcAvwDxABoBOQFNAVUBUQFCAScBAQHTAJ0AYgAkAOX/pv9r/zX/Bv/g/sT+s/6v/rb+yP7m/g3/Pf90/7D/7v8sAGoAowDXAAMBJgE+AUsBTQFDAS0BDQHkALIAegA+AAAAw/+H/1D/H//1/tb+wP63/rj+xf7e/gD/LP9e/5f/0/8QAE0AhwC8AOsAEQEuAUABRwFCATIBFwHyAMUAkQBYABwA4P+k/2v/OP8M/+n+z/7B/r3+xf7Y/vX+HP9L/4D/uf/1/zEAawCiANIA/AAcATIBPgE+ATMBHgH+ANUApQBvADYA+//A/4f/Uv8k//3+4P7N/sT+x/7V/u3+D/85/2v/of/b/xUATwCHALkA5QAJASMBMwE5ATMBIgEIAeMAtwCFAE4AFADb/6L/bP88/xP/8v7a/s3+y/7U/uf+BP8q/1j/i//C//z/NQBsAKAAzgD1ABMBJwExATABJQEPAe8AyACZAGUALQD1/73/hv9V/yn/Bf/q/tj+0f7V/uT+/P4d/0f/d/+r/+P/GgBSAIYAtgDfAAEBGQEnASsBJQEUAfkA1gCrAHoARQANANf/oP9t/0D/Gf/6/uX+2v7Z/uL+9v4T/zj/ZP+W/8v/AQA4AG0AngDJAO4ACgEcASQBIgEWAQAB4QC7AI0AWwAmAPD/uv+G/1f/Lv8M//P+5P7e/uP+8v4K/yv/U/+C/7T/6v8fAFQAhgCzANoA+QAPARwBHgEXAQYB6wDIAJ8AcAA8AAcA0/+f/2//RP8f/wP/8P7m/ub+8P4E/yD/RP9v/5//0/8HADsAbgCcAMUA5wAAAREBGAEVAQkB8wDUAK4AggBSAB4A6/+3/4f/Wv8z/xT//f7v/uv+8P7//hf/OP9f/4z/vf/w/yMAVQCFAK8A1ADxAAUBEAESAQoB+ADeALwAkwBmADQAAQDP/57/cP9I/yb/C//6/vH+8v79/hH/Lf9R/3r/qf/a/wwAPgBuAJoAwADgAPgABwEMAQkB/ADmAMgAowB4AEkAGADn/7X/h/9d/zj/G/8G//r+9/79/gz/JP9E/2r/lv/F//b/JwBXAIQArADOAOkA/AAFAQYB/QDrANEAsACJAF0ALQD9/8z/nf9y/0z/LP8U/wT//f7//gr/Hv85/1z/hP+x/+H/EABAAG4AlwC8ANkA7wD8AAEB/ADvANkAvACYAG4AQQASAOP/tP+I/2D/Pv8i/w//BP8C/wn/Gf8x/1D/df+f/8z//P8qAFgAggCoAMgA4QDyAPsA+gDxAN8AxQClAH8AVAAmAPj/yv+d/3T/UP8y/xz/Df8H/wr/Fv8q/0X/Z/+O/7n/5/8UAEIAbQCVALcA0gDnAPMA9gDxAOMAzQCwAI0AZQA6AAwA3/+y/4n/Y/9D/yr/GP8O/w3/Ff8l/zz/W/9//6j/0/8AAC0AWQCBAKUAwwDaAOkA8ADvAOUA0wC6AJoAdQBMACAA9P/H/53/dv9U/zj/JP8X/xL/Fv8i/zX/UP9x/5f/wf/t/xgARABtAJIAsgDMAN4A6QDrAOUA1wDCAKUAgwBdADMABwDc/7H/iv9m/0j/Mf8g/xj/GP8g/zD/R/9l/4j/sP/a/wQALwBZAH8AoQC9ANIA4ADmAOQA2gDIAK8AkABsAEQAGgDw/8X/nf94/1j/P/8r/yD/HP8g/y3/QP9b/3v/oP/I//L/HABFAGwAjwCtAMUA1gDgAOEA2wDMALcAmwB6AFQALAACANn/sf+L/2n/Tf83/yn/Iv8i/yv/O/9S/2//kf+3/+D/CAAyAFkAfQCdALcAywDYANwA2gDPAL0ApQCGAGMAPQAUAOz/xP+d/3v/Xf9F/zP/Kf8m/yv/N/9L/2X/hP+o/8//9/8fAEYAawCNAKkAvwDOANcA1wDQAMIArQCRAHEATQAmAP//1/+w/4z/bf9S/z7/Mf8r/yz/Nf9F/1z/ef+a/77/5f8MADQAWQB8AJkAsgDEAM8A0wDQAMUAswCbAH0AWwA2AA8A6f/C/57/ff9h/0r/Ov8x/y//Nf9C/1X/bv+N/6//1f/8/yIARwBqAIoApAC5AMcAzgDOAMYAuACjAIgAaQBGACAA+//U/7D/jv9w/1f/Rf85/zT/Nv8//0//Zv+B/6L/xf/r/xAANQBZAHkAlgCsAL0AxwDKAMYAuwCpAJEAdQBUADAACwDm/8H/n/+A/2X/UP9C/zr/Of8//0v/X/94/5X/t//a/wAAJABIAGkAhwCfALMAvwDFAMQAvACuAJkAfwBhAD8AGwD3/9L/sP+Q/3T/Xf9L/0D/PP8//0n/Wf9v/4r/qf/L/+//EwA3AFkAdwCSAKcAtgC/AMEAvQCxAKAAiQBtAE0AKgAGAOP/wP+g/4L/af9W/0n/Qv9B/0j/Vf9o/4D/nf+9/+D/AwAmAEgAaACEAJsArAC4AL0AuwCzAKUAkAB3AFkAOQAWAPT/0f+w/5H/d/9h/1L/SP9F/0j/Uv9i/3j/kv+w/9H/9P8WADgAWAB1AI4AogCwALgAuQC0AKgAlwCAAGUARgAlAAIA4f/A/6H/hf9u/1z/T/9J/0r/Uf9e/3H/iP+k/8T/5f8GACgASABmAIEAlgCnALEAtQCzAKoAnACIAG8AUgAzABIA8f/P/7D/k/96/2b/WP9P/03/Uf9b/2v/gP+a/7f/1//4/xgAOQBXAHMAigCdAKkAsACxAKsAoACOAHgAXgBAACAAAADf/7//ov+I/3L/Yf9W/1H/Uv9Z/2b/ef+Q/6v/yf/p/wkAKgBJAGUAfgCSAKEAqgCtAKsAogCTAIAAaABMAC0ADQDu/87/sP+V/37/a/9e/1b/Vf9Z/2P/c/+I/6H/vf/c//z/GwA6AFcAcACGAJcAowCpAKkAowCXAIYAcABXADoAGwD8/93/v/+j/4r/dv9n/1z/WP9a/2H/b/+B/5j/sv/P/+7/DAArAEgAYwB6AI0AmwCjAKYAowCaAIsAeABgAEYAKAAJAOv/zf+x/5f/gf9w/2T/Xf9c/2H/a/97/4//qP/D/+H///8dADoAVgBuAIMAkgCdAKIAoQCbAI8AfgBpAFAANAAXAPn/2/+//6T/jf96/2z/Y/9f/2L/af92/4j/nv+4/9T/8v8PACwASABhAHcAiQCWAJ0AnwCbAJIAhABxAFoAQAAjAAYA6f/M/7H/mf+F/3X/af9k/2P/af9z/4P/lv+u/8n/5f8BAB8AOwBVAGwAfwCNAJcAmwCaAJMAiAB3AGIASgAvABMA9//a/7//pv+Q/37/cf9p/2b/af9x/37/kP+l/77/2f/1/xEALQBIAGAAdACFAJAAlwCYAJQAigB8AGoAUwA6AB8AAwDn/8z/sv+b/4j/ef9v/2r/av9w/3r/iv+d/7T/zv/p/wQAIAA7AFQAaQB7AIkAkQCVAJMAjACAAHAAXABEACoADwD0/9n/v/+n/5P/gv92/2//bf9w/3j/hf+W/6v/w//d//n/EwAuAEcAXgBxAIAAiwCRAJEAjQCDAHUAYwBNADUAGwAAAOX/y/+z/57/jP9+/3X/cP9x/3f/gf+R/6T/uv/T/+3/BwAiADsA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DgADAPn/7v/k/9v/0//N/8j/xv/F/8f/y//Q/9j/4P/q//X/AAAKABQAHgAnAC4ANAA4ADoAOgA3ADMALQAmAB0AEwAIAP7/8//p/9//1//Q/8v/yP/H/8f/yv/P/9X/3f/m//D/+/8FAA8AGQAjACoAMQA1ADgAOQA3ADQALwAoACAAFwANAAIA+P/u/+T/3P/U/87/yv/I/8j/yv/O/9P/2v/j/+z/9v8AAAsAFQAeACYALQAyADYANwA3ADUAMQArACMAGgARAAcA/f/z/+n/4P/Y/9L/zf/K/8n/yv/N/9H/2P/g/+j/8v/8/wYAEAAZACIAKQAvADMANgA2ADUAMgAsACYAHgAVAAsAAQD4/+7/5P/c/9X/0P/M/8r/yv/M/9D/1v/d/+X/7v/4/wEACwAVAB4AJQAsADEANAA1ADUAMgAuACgAIQAYAA8ABQD8//L/6f/g/9n/0//P/8z/y//M/8//1P/a/+L/6v/0//7/BgAQABkAIQAoAC4AMgA0ADQAMgAvACoAIwAcABMACQAAAPf/7v/l/93/1//S/87/zf/N/8//0//Y/9//5//w//n/AgAMABUAHQAkACsALwAyADMAMgAwACsAJgAfABYADQAEAPv/8v/p/+H/2v/V/9H/zv/O/8//0v/X/93/5P/s//X///8HABAAGQAhACcALAAwADIAMgAwACwAKAAhABoAEQAIAAAA9v/t/+X/3v/Y/9P/0P/P/8//0f/V/9v/4f/p//L/+/8DAAwAFQAdACQAKQAtADAAMQAwAC0AKQAjABwAFQAMAAMA+//y/+n/4v/b/9b/0v/Q/9D/0f/U/9n/3//m/+7/9/8AAAgAEQAZACAAJgArAC4ALwAvAC4AKgAlAB8AGAAPAAcA///2/+3/5v/f/9n/1f/S/9H/0f/U/9j/3f/j/+v/8//8/wQADAAVABwAIwAoACwALgAvAC4AKwAnACEAGgATAAoAAgD6//H/6f/i/9z/1//U/9L/0v/U/9f/2//h/+j/8P/4/wAACAARABgAHwAlACkALAAuAC0AKwAoACMAHQAWAA4ABgD+//X/7f/m/9//2v/W/9T/0//U/9b/2v/f/+X/7f/1//3/BAANABUAHAAiACcAKgAsAC0AKwApACUAHwAZABEACQABAPn/8f/q/+P/3f/Z/9b/1P/U/9b/2f/d/+P/6v/x//n/AQAJABEAGAAeACQAKAAqACwAKwApACYAIQAbABQADAAEAP3/9f/t/+b/4P/b/9j/1v/V/9b/2P/c/+H/5//u//b//v8FAA0AFAAbACEAJQApACoAKwApACcAIgAdABcAEAAIAAAA+f/x/+r/4//e/9r/1//W/9b/2P/b/9//5f/r//P/+v8BAAkAEQAYAB4AIwAmACkAKgApACcAJAAfABkAEgALAAMA/P/1/+3/5//h/9z/2f/X/9f/2P/a/97/4//p//D/9////wYADQAUABsAIAAkACcAKQApACcAJQAgABsAFQAOAAcAAAD4//H/6v/k/9//2//Z/9j/2P/a/93/4f/n/+3/9P/7/wIACgA=";

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
    setSellingId(id);
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
  const sellingObj = sellingId && room.objects.find((o) => o.id === sellingId);

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
          0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }
          25% { opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(1); opacity: 0; }
        }
        .obj { cursor: pointer; transition: filter 120ms; }
        .obj:hover, .obj.sel { filter: drop-shadow(0 0 0 #FFD97A) drop-shadow(2px 0 0 #FFD97A) drop-shadow(-2px 0 0 #FFD97A) drop-shadow(0 2px 0 #FFD97A) drop-shadow(0 -2px 0 #FFD97A) brightness(1.06); }
        .obj.static { cursor: help; }
        .obj.packing { animation: packAway 0.5s ease-in forwards; }
        .panel { animation: popIn 140ms ease-out; }
        .coin { animation: coinBurst 0.6s ease-out forwards; }
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

          {/* coin burst — independent overlay so the item's shrink-away
              animation doesn't compound with (and swallow) this motion */}
          {sellingObj && (
            <div style={{
              position: "absolute",
              left: sellingObj.x + (SPRITES[sellingObj.id].w * CELL) / 2,
              top: sellingObj.y + (SPRITES[sellingObj.id].h * CELL) / 2,
              zIndex: 500, pointerEvents: "none",
            }}>
              {COIN_ANGLES.map((deg, i) => (
                <span
                  key={i}
                  className="coin"
                  style={{
                    position: "absolute", left: 0, top: 0, width: 10, height: 10,
                    background: P.gold, border: "2px solid #8A5E14", borderRadius: "50%",
                    "--tx": `${Math.cos(deg) * 46 - 5}px`, "--ty": `${Math.sin(deg) * 46 - 5}px`,
                  }}
                />
              ))}
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
                            flex: 1, padding: "6px 8px", fontSize: 14, background: "#160D06", color: "#F2E4C0",
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
                        onClick={() => { setSellAmount(String(selected.value)); setSellFormOpen(true); }}
                        disabled={!!packingId || !!sellingId}
                        style={{
                          flex: 1, padding: "8px 0", fontSize: 14, cursor: "pointer",
                          background: "linear-gradient(#E0B65A,#B8862E)", color: "#2A1B08",
                          border: "3px solid #120A04", boxShadow: "inset 0 -3px 0 #8A5E14", fontWeight: 700, ...ui.label,
                        }}
                      >
                        Sell (~${selected.value})
                      </button>
                    </>
                  )
                ) : (
                  <div style={{ flex: 1, padding: "8px 0", textAlign: "center", fontSize: 13, color: "#8A7350", border: "2px dashed #4A2E17", ...ui.label }}>
                    Stays with the room
                  </div>
                )}
              </div>
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
