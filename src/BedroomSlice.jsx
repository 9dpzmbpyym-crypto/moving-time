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
   than synthesized tones, same as how video sites get through it.
   User-recorded cash register hit; measured onset is at frame 0, no
   leading silence to trim. */
const SELL_CHIME_SRC = "data:audio/mpeg;base64,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/v95vDW40iO6bB4FQTqTBxdrDmXXHy7//v+Yc3vv//////////////cN/3X4fzev/////////////wEjHAQcEwm3Hbxy5e4cnlkAAAAAFWROvHl/R384omAgJTAtW5NbUHIjqjCDkEWFFRQPMsSgFsNn1TMTAOeIL7G7aYGeJmYCMA4tNJbzMuGiJwAFBABCxgxyEz6KGggnmo50TI8XCZZ1UWWyKfTlwkz5cEzJc8PRN0n1qaifNEkFvWxNJcFmYF+gmVGmtSCZ1Or1qTTZb6aaBfPWTLhQGAKyGX7f//////////jAFZT8SYIVUwZAxwpAwgYQoFAhFAgFANSFsxWEEblx/5iM5joRAgHaV/nRy8YoT6CwJBH+ZykG/FDAWm/5peAc0OG0nspdJnX/6uomBCZrT6u7/+NDhgwEDlMxIGMMBqV9neXM+v//+EGhrx0MGplYGZmSkwA7timmWGxL///8EgJesYAzCxMMBk8xwUgaAZVQsNq1P////CDgHEgkDgIIGgUuekMYiJNa/fK1rVL/////g4gMCAFJw+qovFf7UkmX/qQ1Mv6/sql1N///////+lGAAJJViTd3BSyHBBke0JBgwESAlWVQ9GqsZf2JOUw6Iv67P////////vW68zBDuTkNtbgeHLHP/////////////5VLoalMthmt//u0ZIoACL11TP5zYACFa/kkyUQAAAABpBwAACAAADSDgAAEa1+5SAABwMBgCAbEERVy6XuBWwKkiXcOVCmMjbDqguA/pe+VySICYqS5eNiAIkMSRZIy+R5kaFJEvl4vLRMVfk2bmqRoilR1V/2L6SZWLhmaUS6XVGRFjH/JgcwbZ2lQeXUUS6XdJaP/oFdk6czZRu60VooqSSRRMVJJf/0DQVD4IAP/6wCRCuxMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

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
  const audioCtxRef = useRef(null);
  const sellBufferRef = useRef(null);
  const audioPrimedRef = useRef(false);

  useEffect(() => {
    setSellFormOpen(false);
    setSellAmount("");
  }, [selectedId]);

  /* decode the sell sound once via the Web Audio API — AudioBufferSourceNode
     schedules playback with near-zero, sample-accurate latency, unlike
     <audio>.play() which has real (and on mobile, sometimes large) startup
     lag. The context starts suspended on iOS until resumed by a user
     gesture, which primeSellAudio does on the very first tap. */
  useEffect(() => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    audioCtxRef.current = ctx;
    fetch(SELL_CHIME_SRC)
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((decoded) => { sellBufferRef.current = decoded; })
      .catch(() => {});
    return () => { ctx.close().catch(() => {}); };
  }, []);

  const primeSellAudio = () => {
    if (audioPrimedRef.current) return;
    audioPrimedRef.current = true;
    audioCtxRef.current?.resume().catch(() => {});
  };

  const playSellSound = () => {
    const ctx = audioCtxRef.current;
    const buf = sellBufferRef.current;
    if (!ctx || !buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  };

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
    playSellSound();
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
    <div
      style={{ position: "fixed", inset: 0, background: "#160D06", overflow: "hidden", userSelect: "none" }}
      onPointerDownCapture={primeSellAudio}
    >
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
