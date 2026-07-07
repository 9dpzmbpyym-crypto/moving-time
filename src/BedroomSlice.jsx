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
  { tx: -64, ty: -38, d: 0 },   { tx: -38, ty: -56, d: 60 },
  { tx: -14, ty: -44, d: 120 }, { tx: 10,  ty: -60, d: 30 },
  { tx: 34,  ty: -48, d: 90 },  { tx: 58,  ty: -36, d: 0 },
  { tx: -52, ty: -30, d: 150 }, { tx: 46,  ty: -58, d: 150 },
];

/* real embedded audio (not raw Web Audio oscillators) — media playback
   like this has a much better chance of ignoring a phone's silent switch
   than synthesized tones, same as how video sites get through it */
const SELL_CHIME_SRC = "data:audio/wav;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

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
