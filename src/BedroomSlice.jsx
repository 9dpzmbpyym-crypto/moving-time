import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import SAVED_LAYOUT from "./layout.json";

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

  // closet door is now a movable object (SPRITES.closet_door)

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
  closet_door: { w: 28, h: 89, draw(ctx) {
    r(ctx, P.out, 0, 0, 28, 89);
    r(ctx, P.white, 2, 2, 24, 86);
    outlineRect(ctx, P.whiteLo, 5, 8, 18, 34);
    outlineRect(ctx, P.whiteLo, 5, 48, 18, 34);
    r(ctx, P.gold, 22, 44, 2, 3);
  }},
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

/* ============================================================
   OFFICE — shell + sprites (ref: cozy corner-desk office)
   ============================================================ */
function drawOfficeShell(ctx) {
  const W = 240, H = 180, WALL_B = 112;

  // warm tan wall
  r(ctx, "#D8C49A", 0, 0, W, WALL_B);
  dith(ctx, "#E6D6B0", 0, 0, W, 30, 3, 0);
  dith(ctx, "#C0AA7E", 0, WALL_B - 26, W, 26, 3, 1);
  r(ctx, "#E6D6B0", 0, 0, W, 3); r(ctx, "#C0AA7E", 0, 3, W, 1);
  r(ctx, P.cream, 0, WALL_B - 6, W, 6); r(ctx, P.creamLo, 0, WALL_B - 6, W, 1);
  r(ctx, P.out, 0, WALL_B - 1, W, 1);

  // plank floor (same colors as bedroom so the mobile floor-fill continues it)
  r(ctx, P.floor, 0, WALL_B, W, H - WALL_B);
  for (let row = 0; row * 8 + WALL_B < H; row++) {
    const y0 = WALL_B + row * 8;
    r(ctx, P.floorDark, 0, y0 + 7, W, 1);
    dith(ctx, P.floorLight, 0, y0 + 1, W, 3, 5, row * 3);
    const off = (row % 2) * 24;
    for (let x = off + 10; x < W; x += 48) r(ctx, P.floorDark, x, y0, 1, 7);
  }

  // open-door hint, far left
  r(ctx, P.out, 0, 0, 7, WALL_B);
  r(ctx, P.woodDark, 0, 0, 5, WALL_B);
  r(ctx, P.woodMid, 4, 4, 1, WALL_B - 8);

  // window with a green summer view (x 126..194, y 14..76)
  r(ctx, P.out, 126, 14, 68, 62);
  r(ctx, P.cream, 128, 16, 64, 58);
  r(ctx, P.sky, 132, 20, 56, 50);
  dith(ctx, P.glassHi, 132, 20, 56, 8, 2, 0);            // bright sky top
  dith(ctx, P.greenHi, 132, 30, 24, 14, 2, 0);           // tree canopies
  r(ctx, P.green, 134, 34, 20, 12); dith(ctx, P.greenLo, 136, 38, 16, 8, 2, 1);
  dith(ctx, P.greenHi, 162, 26, 26, 16, 2, 1);
  r(ctx, P.green, 164, 30, 22, 14); dith(ctx, P.greenLo, 166, 36, 18, 8, 2, 0);
  r(ctx, P.woodDark, 168, 48, 16, 10);                    // house across the street
  r(ctx, "#8A9BA8", 168, 44, 16, 4);
  r(ctx, P.red, 174, 52, 3, 6);                           // its red door
  dith(ctx, P.green, 132, 58, 56, 12, 2, 0);              // hedge line
  r(ctx, P.cream, 158, 20, 4, 50);                        // mullion
  r(ctx, P.creamLo, 132, 44, 56, 2);                      // sash rail
  r(ctx, P.out, 122, 78, 76, 1);
  r(ctx, P.cream, 122, 76, 76, 3); r(ctx, P.creamLo, 122, 78, 76, 1);

  // sunlight pool under the window
  const sunX = 136, sunW = 50;
  r(ctx, P.floorSun, sunX, WALL_B + 2, sunW, 28);
  dith(ctx, P.floor, sunX, WALL_B + 2, sunW, 28, 2, 0);
  dith(ctx, P.floorSun, sunX - 6, WALL_B + 2, 6, 28, 2, 1);
  dith(ctx, P.floorSun, sunX + sunW, WALL_B + 2, 6, 28, 2, 0);
  for (let j = WALL_B + 2; j < WALL_B + 30; j += 6) r(ctx, P.floor, sunX, j, sunW, 1);

  // corner vignettes
  dith(ctx, "#C0AA7E", 0, 0, 26, WALL_B, 2, 0);
  dith(ctx, "#C0AA7E", W - 22, 0, 22, WALL_B, 2, 1);
}

const OFFICE_SPRITES = {
  office_curtains: { w: 90, h: 70, draw(ctx) {
    r(ctx, P.out, 0, 2, 90, 2); r(ctx, P.woodDark, 1, 2, 88, 1);
    r(ctx, P.out, 0, 0, 3, 6); r(ctx, P.out, 87, 0, 3, 6);
    const panel = (x) => {
      r(ctx, P.out, x, 4, 13, 64);
      r(ctx, "#3F5C46", x + 1, 5, 11, 62);
      r(ctx, "#527455", x + 2, 5, 2, 62); r(ctx, "#527455", x + 7, 5, 1, 62);
      r(ctx, "#2E4735", x + 5, 5, 1, 62); r(ctx, "#2E4735", x + 10, 5, 1, 62);
      dith(ctx, "#2E4735", x + 1, 52, 11, 15, 2, 0);
    };
    panel(1); panel(76);
  }},

  desk_hutch: { w: 150, h: 96, draw(ctx) {
    // hutch shelves
    r(ctx, P.out, 2, 0, 60, 46);
    r(ctx, P.woodMid, 3, 1, 58, 44); r(ctx, P.woodHi, 3, 1, 58, 2);
    r(ctx, "#1E1206", 6, 5, 24, 16); r(ctx, "#1E1206", 34, 5, 24, 16);   // upper cavities
    r(ctx, "#1E1206", 6, 25, 52, 17);                                     // lower cavity
    // books, upper left
    r(ctx, P.green, 8, 9, 3, 12); r(ctx, "#6B4A8A", 12, 8, 3, 13); r(ctx, P.red, 16, 10, 3, 11);
    r(ctx, "#28304A", 20, 9, 3, 12); r(ctx, "#B08A4A", 24, 11, 4, 10);
    // jars + bear, upper right
    r(ctx, P.glass, 37, 12, 5, 9); r(ctx, P.glassHi, 38, 13, 1, 7); r(ctx, P.woodDark, 37, 11, 5, 2);
    r(ctx, P.glass, 44, 14, 4, 7); r(ctx, P.glassHi, 45, 15, 1, 5);
    r(ctx, P.creamLo, 51, 12, 5, 6); r(ctx, P.cream, 52, 11, 3, 3);       // little bear
    // lower shelf: binders shifted right (left half stays dark so the red
    // lamp in front reads cleanly)
    r(ctx, P.burgundy, 26, 29, 4, 13); r(ctx, P.teal, 31, 30, 4, 12); r(ctx, P.mustard, 36, 29, 4, 13);
    r(ctx, "#28304A", 41, 31, 4, 11); r(ctx, P.green, 46, 30, 4, 12);
    r(ctx, P.cardLo, 52, 33, 5, 9);                                       // box
    // one long desk top, running from the hutch to under the window
    r(ctx, P.out, 0, 46, 150, 5);
    r(ctx, P.woodLight, 1, 47, 148, 3); r(ctx, P.woodHi, 1, 47, 148, 1);
    // drawer pedestal (right) + open leg space (left)
    r(ctx, P.out, 34, 51, 28, 42);
    r(ctx, P.woodMid, 35, 52, 26, 40);
    const drw = (y) => {
      outlineRect(ctx, "#33200F", 37, y, 22, 10);
      r(ctx, P.woodLight, 38, y + 1, 20, 8); r(ctx, P.woodHi, 38, y + 1, 20, 1);
      r(ctx, P.gold, 46, y + 4, 4, 2);
    };
    drw(54); drw(66); drw(78);
    // left legs + solid shadow under the hutch half
    r(ctx, P.out, 2, 51, 4, 42); r(ctx, P.woodDark, 3, 51, 2, 41);
    r(ctx, "#1E1206", 6, 51, 28, 41);
    r(ctx, P.out, 2, 92, 60, 2);
    // open knee span under the window: thin shadow + far leg
    r(ctx, "#1E1206", 64, 51, 80, 2);
    r(ctx, P.out, 144, 51, 4, 42); r(ctx, P.woodDark, 145, 51, 2, 41);
  }},

  computer: { w: 28, h: 24, draw(ctx) {
    r(ctx, P.out, 2, 0, 24, 16);
    r(ctx, "#3A362F", 3, 1, 22, 14);
    r(ctx, "#28304A", 5, 3, 18, 10);
    r(ctx, P.glassHi, 6, 4, 2, 8); r(ctx, P.glassHi, 9, 4, 1, 8);        // screen glare
    r(ctx, P.out, 12, 16, 4, 2); r(ctx, P.out, 8, 18, 12, 1);            // stand
    r(ctx, P.out, 0, 20, 26, 4);                                          // keyboard
    r(ctx, "#B8AE96", 1, 21, 24, 2);
    for (let x = 3; x < 23; x += 3) r(ctx, "#8A8272", x, 21, 1, 1);
  }},

  desk_lamp: { w: 22, h: 24, draw(ctx) {
    r(ctx, P.out, 2, 20, 10, 2); r(ctx, P.red, 3, 20, 8, 1);              // base
    r(ctx, P.out, 6, 12, 2, 8); r(ctx, P.redHi, 6, 12, 1, 8);             // lower arm
    r(ctx, P.out, 6, 10, 10, 2); r(ctx, P.red, 7, 10, 8, 1);              // upper arm
    r(ctx, P.out, 14, 4, 7, 8);                                            // head cone
    r(ctx, P.red, 15, 5, 5, 6); r(ctx, P.redHi, 15, 5, 2, 4);
    r(ctx, P.goldHi, 16, 11, 4, 2); r(ctx, "#FBF6E6", 17, 12, 2, 1);      // warm glow
    r(ctx, P.out, 5, 9, 3, 3); r(ctx, P.out, 12, 9, 3, 3);                // knuckles
  }},

  office_chair: { w: 34, h: 46, draw(ctx) {
    r(ctx, P.out, 6, 0, 22, 22);                                           // backrest
    r(ctx, "#2A2622", 7, 1, 20, 20); r(ctx, "#3A362F", 8, 2, 18, 3);
    dith(ctx, "#1C1916", 9, 12, 16, 8, 2, 0);
    r(ctx, P.out, 2, 22, 30, 8);                                           // seat
    r(ctx, "#2A2622", 3, 23, 28, 6); r(ctx, "#3A362F", 3, 23, 28, 2);
    r(ctx, P.out, 0, 18, 4, 8); r(ctx, P.out, 30, 18, 4, 8);               // armrests
    r(ctx, "#3A362F", 1, 19, 2, 6); r(ctx, "#3A362F", 31, 19, 2, 6);
    r(ctx, P.out, 15, 30, 4, 8); r(ctx, "#8A8272", 16, 30, 2, 7);          // gas lift
    r(ctx, P.out, 4, 38, 26, 2);                                           // star base
    r(ctx, P.out, 6, 40, 3, 4); r(ctx, P.out, 15, 40, 3, 4); r(ctx, P.out, 24, 40, 3, 4);
    r(ctx, "#4A463F", 7, 41, 1, 2); r(ctx, "#4A463F", 16, 41, 1, 2); r(ctx, "#4A463F", 25, 41, 1, 2);
  }},

  sewing_machine: { w: 22, h: 16, draw(ctx) {
    r(ctx, P.out, 0, 12, 22, 4); r(ctx, P.white, 1, 13, 20, 2);            // base
    r(ctx, P.out, 2, 0, 14, 13);                                           // body arm
    r(ctx, P.white, 3, 1, 12, 11); r(ctx, P.whiteLo, 3, 9, 12, 3);
    r(ctx, "#5C7C9C", 5, 3, 6, 5); dith(ctx, P.white, 5, 3, 6, 5, 2, 0);   // blue floral hint
    r(ctx, P.out, 14, 3, 4, 7); r(ctx, P.white, 15, 4, 2, 5);              // needle head
    r(ctx, P.red, 6, 0, 2, 2);                                             // spool
    r(ctx, P.out, 17, 9, 1, 4);                                            // needle
  }},

  storage_bin: { w: 26, h: 18, draw(ctx) {
    r(ctx, P.out, 0, 0, 26, 6);                                            // lid
    r(ctx, P.teal, 1, 1, 24, 4); r(ctx, P.tealHi, 1, 1, 24, 1);
    r(ctx, P.out, 2, 6, 22, 12);                                           // tub
    r(ctx, "#8A857C", 3, 7, 20, 10); dith(ctx, "#6E6A61", 3, 9, 20, 8, 2, 0);
    r(ctx, "#B8AE96", 5, 9, 6, 4);                                         // label
  }},

  side_cabinet: { w: 48, h: 62, draw(ctx) {
    // book stack
    r(ctx, P.out, 2, 10, 12, 8);
    r(ctx, P.burgundy, 3, 11, 10, 2); r(ctx, P.teal, 3, 13, 10, 2); r(ctx, "#B08A4A", 3, 15, 10, 2);
    // red vase
    r(ctx, P.out, 17, 6, 6, 12); r(ctx, P.red, 18, 7, 4, 10); r(ctx, P.redHi, 18, 7, 1, 8);
    // cabinet body
    r(ctx, P.out, 0, 18, 48, 40);
    r(ctx, P.woodHi, 1, 19, 46, 3);
    r(ctx, P.woodMid, 1, 22, 46, 33);
    dith(ctx, P.wood, 36, 22, 11, 33, 2, 0);
    outlineRect(ctx, "#33200F", 4, 25, 19, 27); r(ctx, P.woodLight, 5, 26, 17, 25); r(ctx, P.woodHi, 5, 26, 17, 1);
    outlineRect(ctx, "#33200F", 25, 25, 19, 27); r(ctx, P.woodLight, 26, 26, 17, 25); r(ctx, P.woodHi, 26, 26, 17, 1);
    r(ctx, P.gold, 20, 37, 2, 3); r(ctx, P.gold, 26, 37, 2, 3);
    r(ctx, P.out, 2, 58, 5, 4); r(ctx, P.out, 41, 58, 5, 4);
    r(ctx, P.woodDark, 3, 58, 3, 3); r(ctx, P.woodDark, 42, 58, 3, 3);
  }},

  waste_bin: { w: 14, h: 16, draw(ctx) {
    r(ctx, P.out, 1, 0, 12, 16);
    r(ctx, "#2A2622", 2, 1, 10, 14); r(ctx, "#3A362F", 2, 1, 10, 2);
    dith(ctx, "#1C1916", 3, 6, 8, 9, 2, 0);
    r(ctx, P.cream, 4, 2, 3, 2);                                           // crumpled draft
  }},

  desk_clutter: { w: 30, h: 14, draw(ctx) {
    // open notebook
    r(ctx, P.out, 0, 6, 16, 8);
    r(ctx, P.cream, 1, 7, 14, 6); r(ctx, P.creamLo, 8, 7, 1, 6);
    r(ctx, "#7C6A4A", 3, 9, 4, 1); r(ctx, "#7C6A4A", 3, 11, 4, 1); r(ctx, "#7C6A4A", 10, 9, 4, 1);
    r(ctx, "#28304A", 12, 4, 6, 2);                                        // pen
    // mug
    r(ctx, P.out, 20, 4, 8, 10);
    r(ctx, P.red, 21, 5, 6, 8); r(ctx, P.redHi, 21, 5, 2, 6);
    r(ctx, P.out, 27, 6, 3, 5); r(ctx, P.red, 28, 7, 1, 3);                // handle
  }},

  wall_frames: { w: 28, h: 20, draw(ctx) {
    r(ctx, P.out, 0, 2, 13, 16); r(ctx, P.woodDark, 1, 3, 11, 14); r(ctx, P.cream, 2, 4, 9, 12);
    r(ctx, "#7C6A4A", 3, 6, 7, 1); r(ctx, "#7C6A4A", 3, 8, 6, 1); r(ctx, "#7C6A4A", 3, 10, 7, 1);
    r(ctx, P.gold, 5, 12, 3, 2);                                           // seal
    r(ctx, P.out, 15, 0, 13, 18); r(ctx, P.woodMid, 16, 1, 11, 16); r(ctx, P.cream, 17, 2, 9, 14);
    r(ctx, P.greenHi, 19, 4, 5, 5); r(ctx, P.green, 20, 6, 4, 4); r(ctx, P.wood, 21, 9, 2, 4); // little botanical
  }},
};

/* ============================================================
   BATHROOM — shell + sprites (ref: red tile + tan diamond floor)
   ============================================================ */
function drawBathroomShell(ctx) {
  const W = 240, H = 180, WALL_B = 112;

  // cream wall
  r(ctx, "#EFE3C6", 0, 0, W, WALL_B);
  dith(ctx, "#F7EDD6", 0, 0, W, 30, 3, 0);
  dith(ctx, "#DCCDA8", 0, WALL_B - 32, W, 12, 3, 1);
  r(ctx, "#F7EDD6", 0, 0, W, 3); r(ctx, "#DCCDA8", 0, 3, W, 1);

  // burgundy tile wainscot band
  r(ctx, "#D9C9A8", 0, 90, W, 2);
  r(ctx, "#8A3038", 0, 92, W, WALL_B - 92);
  dith(ctx, "#A3444C", 0, 92, W, 4, 2, 0);
  for (let x = 0; x < W; x += 10) r(ctx, "#6E242B", x, 92, 1, WALL_B - 92);
  r(ctx, "#6E242B", 0, 102, W, 1);
  r(ctx, P.out, 0, WALL_B - 1, W, 1);

  // tan diamond-tile floor (position-based pattern; extendFloorBathTile continues it)
  r(ctx, "#D9C289", 0, WALL_B, W, H - WALL_B);
  for (let y = WALL_B; y < H; y++)
    for (let x = 0; x < W; x++) {
      if ((x + y) % 16 === 0 || (x - y + 960) % 16 === 0) r(ctx, "#C1A76F", x, y, 1, 1);
    }
  dith(ctx, "#E5D3A0", 0, WALL_B, W, H - WALL_B, 7, 2);

  // open-door hint, far left
  r(ctx, P.out, 0, 0, 7, WALL_B);
  r(ctx, P.woodDark, 0, 0, 5, WALL_B);
  r(ctx, P.woodMid, 4, 4, 1, WALL_B - 8);

  // frosted window (x 56..104, y 14..62)
  r(ctx, P.out, 54, 12, 54, 54);
  r(ctx, P.white, 56, 14, 50, 50);
  r(ctx, "#AECBDD", 59, 17, 44, 44);
  dith(ctx, "#CBE0EC", 59, 17, 44, 44, 2, 0);
  for (let j = 18; j < 34; j += 3) r(ctx, "#CBE0EC", 59, j, 44, 1);        // blinds, half-drawn
  r(ctx, P.white, 79, 17, 4, 44);                                          // mullion
  r(ctx, P.out, 50, 66, 62, 1);
  r(ctx, P.cream, 50, 64, 62, 3); r(ctx, P.creamLo, 50, 66, 62, 1);

  // wall heater vent, small and warm-toned
  r(ctx, P.out, 80, 68, 18, 20);
  r(ctx, "#8A754F", 81, 69, 16, 18); r(ctx, "#9C8760", 81, 69, 16, 2);
  for (let j = 73; j < 85; j += 3) r(ctx, "#5C4B32", 83, j, 12, 1);

  // toilet paper is now a movable object (BATH_SPRITES.tp_roll)

  // corner vignettes
  dith(ctx, "#DCCDA8", 0, 0, 22, 90, 2, 0);
  dith(ctx, "#DCCDA8", W - 20, 0, 20, 90, 2, 1);
}

function extendFloorBathTile(ctx, extH) {
  const WALL_B = 112, W = 240;
  r(ctx, "#D9C289", 0, 180, W, extH - 180);
  for (let y = 180; y < extH; y++)
    for (let x = 0; x < W; x++) {
      if ((x + y) % 16 === 0 || (x - y + 960) % 16 === 0) r(ctx, "#C1A76F", x, y, 1, 1);
    }
  dith(ctx, "#E5D3A0", 0, 180, W, extH - 180, 7, 2);
}

const BATH_SPRITES = {
  tp_roll: { w: 8, h: 8, draw(ctx) {
    r(ctx, "#8A8272", 0, 0, 8, 2);
    r(ctx, P.out, 0, 2, 8, 6); r(ctx, P.white, 1, 3, 6, 4); r(ctx, P.whiteLo, 1, 6, 6, 1);
  }},
  // lengthwise tub at the bed's 3/4 angle: inside of the far wall (with the
  // faucet) at top, basin interior in the middle, outer front panel + feet
  // at the bottom
  bathtub: { w: 58, h: 96, draw(ctx) {
    // far end: inside wall tilted toward the viewer
    r(ctx, P.out, 2, 0, 54, 22); r(ctx, P.out, 0, 2, 58, 20);
    r(ctx, P.white, 3, 1, 52, 20); r(ctx, P.white, 1, 3, 56, 18);
    r(ctx, "#FBF6E6", 3, 1, 52, 4);
    dith(ctx, P.whiteLo, 2, 14, 54, 8, 2, 0);
    // faucet + taps mounted on that wall
    r(ctx, P.out, 24, 6, 10, 13); r(ctx, "#B8AE96", 25, 7, 8, 11);
    r(ctx, P.out, 27, 19, 4, 4); r(ctx, "#B8AE96", 28, 20, 2, 2);
    r(ctx, P.out, 13, 8, 6, 6); r(ctx, "#B8AE96", 14, 9, 4, 4);
    r(ctx, P.out, 39, 8, 6, 6); r(ctx, "#B8AE96", 40, 9, 4, 4);
    // long side rims
    r(ctx, P.out, 0, 20, 7, 52); r(ctx, P.white, 1, 21, 5, 50);
    r(ctx, P.out, 51, 20, 7, 52); r(ctx, P.white, 52, 21, 5, 50);
    // basin interior
    r(ctx, P.out, 6, 21, 46, 50);
    r(ctx, P.whiteLo, 7, 22, 44, 48);
    dith(ctx, P.white, 8, 23, 16, 42, 2, 0);
    dith(ctx, "#C4BAA0", 34, 25, 15, 42, 2, 1);
    r(ctx, "#C4BAA0", 7, 63, 44, 5);
    r(ctx, P.out, 26, 56, 5, 5); r(ctx, "#B8AE96", 27, 57, 3, 3);  // drain
    // near end: rolled rim, then the outer front panel
    r(ctx, P.out, 0, 70, 58, 8);
    r(ctx, P.white, 1, 71, 56, 6); r(ctx, "#FBF6E6", 1, 71, 56, 2);
    r(ctx, P.out, 2, 78, 54, 12);
    r(ctx, P.white, 3, 79, 52, 10);
    dith(ctx, P.whiteLo, 30, 79, 24, 10, 2, 0);
    r(ctx, P.whiteLo, 3, 86, 52, 3);
    // feet
    r(ctx, P.out, 7, 90, 8, 5); r(ctx, P.whiteLo, 8, 90, 6, 4);
    r(ctx, P.out, 43, 90, 8, 5); r(ctx, P.whiteLo, 44, 90, 6, 4);
    // towel over the right rim
    r(ctx, P.out, 48, 30, 10, 28);
    r(ctx, P.cream, 49, 31, 8, 26);
    r(ctx, P.creamLo, 49, 38, 8, 1); r(ctx, P.creamLo, 49, 47, 8, 1);
    r(ctx, P.red, 49, 52, 8, 3);
  }},

  toilet: { w: 32, h: 48, draw(ctx) {
    // tank
    r(ctx, P.out, 4, 0, 24, 18);
    r(ctx, P.white, 5, 1, 22, 16); r(ctx, "#FBF6E6", 5, 1, 22, 3);
    r(ctx, P.whiteLo, 5, 5, 22, 1);                                        // lid seam
    r(ctx, P.out, 25, 8, 4, 3); r(ctx, "#B8AE96", 26, 9, 2, 1);            // flush handle
    // seat, widest part
    r(ctx, P.out, 0, 18, 32, 11);
    r(ctx, P.white, 1, 19, 30, 9); r(ctx, "#FBF6E6", 1, 19, 30, 2);
    r(ctx, P.whiteLo, 6, 22, 20, 5);                                       // seat oval hint
    dith(ctx, P.whiteLo, 21, 20, 9, 8, 2, 0);
    // bowl tapering straight into the base
    r(ctx, P.out, 5, 29, 22, 9);
    r(ctx, P.white, 6, 30, 20, 7); dith(ctx, P.whiteLo, 17, 30, 8, 7, 2, 0);
    r(ctx, P.out, 10, 38, 12, 6);
    r(ctx, P.white, 11, 39, 10, 4);
    // base flare
    r(ctx, P.out, 7, 44, 18, 4);
    r(ctx, P.white, 8, 45, 16, 2); r(ctx, P.whiteLo, 8, 46, 16, 1);
  }},

  bath_vanity: { w: 66, h: 68, draw(ctx) {
    // faucet
    r(ctx, P.out, 30, 0, 3, 8); r(ctx, "#B8AE96", 31, 1, 1, 6);
    r(ctx, P.out, 30, 0, 8, 3); r(ctx, "#B8AE96", 31, 1, 6, 1);
    r(ctx, P.out, 24, 4, 4, 4); r(ctx, P.out, 40, 4, 4, 4);                // taps
    // red tile counter
    r(ctx, P.out, 0, 8, 66, 12);
    r(ctx, "#8A3038", 1, 9, 64, 10); dith(ctx, "#A3444C", 1, 9, 64, 3, 2, 0);
    for (let x = 1; x < 65; x += 9) r(ctx, "#6E242B", x, 9, 1, 10);
    r(ctx, "#6E242B", 1, 14, 64, 1);
    // sink basin inset
    r(ctx, P.out, 18, 10, 30, 8);
    r(ctx, P.white, 19, 11, 28, 6); r(ctx, "#FBF6E6", 19, 11, 28, 2);
    dith(ctx, P.whiteLo, 33, 12, 13, 5, 2, 0);
    // cabinet
    r(ctx, P.out, 4, 20, 58, 44);
    r(ctx, P.white, 5, 21, 56, 42);
    r(ctx, P.whiteLo, 5, 21, 56, 1);
    outlineRect(ctx, P.whiteLo, 9, 25, 23, 34); outlineRect(ctx, P.whiteLo, 34, 25, 23, 34);
    r(ctx, "#B8AE96", 29, 40, 2, 4); r(ctx, "#B8AE96", 35, 40, 2, 4);
    dith(ctx, P.whiteLo, 46, 25, 11, 34, 2, 0);
    // kick
    r(ctx, P.out, 6, 64, 54, 4); r(ctx, P.whiteLo, 7, 65, 52, 2);
  }},

  mirror_cabinet: { w: 40, h: 32, draw(ctx) {
    r(ctx, P.out, 0, 0, 40, 32);
    r(ctx, P.white, 1, 1, 38, 30); r(ctx, "#FBF6E6", 1, 1, 38, 2);
    r(ctx, P.out, 4, 4, 15, 24); r(ctx, P.out, 21, 4, 15, 24);
    r(ctx, P.glass, 5, 5, 13, 22); r(ctx, P.glass, 22, 5, 13, 22);
    r(ctx, P.glassHi, 7, 6, 3, 20); r(ctx, P.glassHi, 11, 6, 1, 20);
    r(ctx, P.glassHi, 24, 6, 3, 20); r(ctx, P.glassHi, 28, 6, 1, 20);
    dith(ctx, P.glassLo, 13, 7, 4, 19, 2, 0); dith(ctx, P.glassLo, 30, 7, 4, 19, 2, 1);
    r(ctx, "#B8AE96", 18, 14, 1, 4); r(ctx, "#B8AE96", 21, 14, 1, 4);
  }},

  red_towels: { w: 30, h: 30, draw(ctx) {
    r(ctx, P.out, 0, 2, 30, 3); r(ctx, "#8A8272", 1, 3, 28, 1);            // rail
    r(ctx, P.out, 0, 0, 3, 5); r(ctx, P.out, 27, 0, 3, 5);
    // red towel
    r(ctx, P.out, 4, 5, 12, 22);
    r(ctx, P.red, 5, 6, 10, 20); r(ctx, P.redHi, 5, 6, 3, 18);
    r(ctx, P.burgundyLo, 5, 22, 10, 2); r(ctx, P.burgundyLo, 5, 14, 10, 1);
    // white towel
    r(ctx, P.out, 18, 5, 10, 18);
    r(ctx, P.cream, 19, 6, 8, 16); r(ctx, P.creamLo, 19, 18, 8, 1);
    r(ctx, P.red, 19, 14, 8, 2);
  }},

  crossstitch_art: { w: 16, h: 20, draw(ctx) {
    r(ctx, P.out, 0, 0, 16, 20);
    r(ctx, P.woodMid, 1, 1, 14, 18); r(ctx, P.woodHi, 1, 1, 14, 1);
    r(ctx, P.cream, 3, 3, 10, 14);
    r(ctx, P.redHi, 6, 5, 2, 2); r(ctx, P.redHi, 9, 6, 2, 2); r(ctx, P.red, 7, 7, 2, 2); // petals
    r(ctx, P.green, 7, 9, 1, 5); r(ctx, P.greenLo, 6, 12, 1, 2); r(ctx, P.greenLo, 9, 11, 1, 2);
  }},

  sill_bottles: { w: 28, h: 12, draw(ctx) {
    r(ctx, P.green, 2, 0, 2, 4); r(ctx, P.greenHi, 4, 1, 2, 3); r(ctx, P.green, 6, 2, 1, 2);
    r(ctx, P.out, 1, 4, 8, 8); r(ctx, P.terra, 2, 5, 6, 6); r(ctx, P.terraLo, 2, 9, 6, 2);
    r(ctx, P.out, 12, 2, 4, 10); r(ctx, P.glass, 13, 3, 2, 8); r(ctx, P.glassHi, 13, 3, 1, 6);
    r(ctx, P.out, 18, 4, 4, 8); r(ctx, "#B87A2E", 19, 5, 2, 6); r(ctx, "#D69A48", 19, 5, 1, 4);
    r(ctx, P.out, 24, 6, 3, 6); r(ctx, P.glass, 25, 7, 1, 4);
  }},

  laundry_basket: { w: 26, h: 22, draw(ctx) {
    // spilling laundry
    r(ctx, P.out, 3, 0, 20, 8);
    r(ctx, P.cream, 4, 1, 8, 6); r(ctx, P.creamLo, 4, 5, 8, 2);
    r(ctx, P.red, 13, 1, 9, 6); r(ctx, P.redHi, 13, 1, 4, 3);
    // wicker basket
    r(ctx, P.out, 0, 8, 26, 14);
    r(ctx, "#B08A4A", 1, 9, 24, 12); dith(ctx, "#8E6C34", 1, 9, 24, 12, 2, 0);
    r(ctx, "#C9A96A", 1, 9, 24, 2);
  }},

  toiletries: { w: 30, h: 14, draw(ctx) {
    r(ctx, P.out, 0, 11, 30, 3); r(ctx, "#C9A96A", 1, 12, 28, 1);          // tray
    r(ctx, P.out, 2, 3, 4, 9); r(ctx, "#B87A2E", 3, 4, 2, 7);              // amber bottle
    r(ctx, P.out, 8, 0, 4, 12); r(ctx, P.redHi, 9, 1, 2, 10); r(ctx, P.red, 9, 7, 2, 4); // shampoo
    r(ctx, P.out, 14, 4, 4, 8); r(ctx, P.white, 15, 5, 2, 6);              // pump
    r(ctx, P.out, 20, 6, 4, 6); r(ctx, P.glass, 21, 7, 2, 4); r(ctx, P.glassHi, 21, 7, 1, 2);
    r(ctx, P.out, 25, 5, 4, 7); r(ctx, "#6B4A8A", 26, 6, 2, 5);            // perfume
  }},

  toilet_decor: { w: 22, h: 18, draw(ctx) {
    // leaning frame
    r(ctx, P.out, 0, 0, 13, 16);
    r(ctx, P.woodDark, 1, 1, 11, 14);
    r(ctx, P.cream, 2, 2, 9, 12);
    r(ctx, "#8A9BA8", 3, 3, 7, 6); r(ctx, P.green, 3, 7, 7, 3);            // little landscape
    // succulent
    r(ctx, P.greenHi, 16, 6, 2, 3); r(ctx, P.green, 18, 5, 2, 4); r(ctx, P.greenLo, 15, 8, 1, 2);
    r(ctx, P.out, 14, 9, 7, 7); r(ctx, P.white, 15, 10, 5, 5); r(ctx, P.whiteLo, 15, 13, 5, 2);
  }},
};

/* ============================================================
   KITCHEN — shell + sprites (ref: galley kitchen mockup)
   ============================================================ */
function drawKitchenShell(ctx) {
  const wallBase = "#EDE0B4", wallLight = "#F6ECC8", wallShade = "#D6C592";

  r(ctx, wallBase, 0, 0, 240, 112);
  dith(ctx, wallLight, 0, 0, 240, 8, 3, 0);
  dith(ctx, wallShade, 0, 100, 240, 12, 3, 1);
  r(ctx, wallLight, 0, 0, 240, 3);
  r(ctx, wallShade, 0, 3, 240, 1);
  r(ctx, P.cream, 0, 106, 240, 6);
  r(ctx, P.creamLo, 0, 106, 240, 1);
  r(ctx, P.out, 0, 111, 240, 1);

  // tile floor (must match extendFloorTile exactly)
  r(ctx, "#D8BC86", 0, 112, 240, 68);
  for (let ty = 112; ty < 180; ty += 12)
    for (let tx = 0; tx < 240; tx += 12) {
      if ((tx / 12 + (ty - 112) / 12) % 2 === 0) r(ctx, "#CBAD72", tx, ty, 12, 12);
      r(ctx, "#B4955C", tx, ty, 12, 1); r(ctx, "#B4955C", tx, ty, 1, 12);
    }

  // back door is now a movable object (KITCHEN_SPRITES.kitchen_door)

  // green tile backsplash: window sill down to the counter line
  r(ctx, "#6FA482", 50, 58, 128, 20);
  r(ctx, "#7FB596", 50, 58, 128, 2);
  for (let ty = 58; ty < 78; ty += 10)
    for (let tx = 50; tx < 178; tx += 10) {
      r(ctx, "#4E7E5E", tx, ty, 10, 1);
      r(ctx, "#4E7E5E", tx, ty, 1, 10);
    }

  // window over the sink, blinds half-drawn
  r(ctx, P.out, 104, 14, 56, 50);
  r(ctx, P.cream, 106, 16, 52, 46);
  r(ctx, "#BFD8CC", 110, 20, 44, 40);
  for (let by = 21; by < 39; by += 3) r(ctx, P.glassHi, 110, by, 44, 1);
  r(ctx, P.glassLo, 110, 39, 44, 1);
  r(ctx, P.cream, 130, 20, 4, 40);
  r(ctx, P.creamLo, 110, 44, 44, 2);
  r(ctx, P.out, 102, 64, 60, 1);
  r(ctx, P.creamLo, 102, 65, 60, 4);

  dith(ctx, wallShade, 0, 0, 26, 112, 2, 0);
  dith(ctx, wallShade, 218, 0, 22, 112, 2, 1);
}

const KITCHEN_SPRITES = {
  kitchen_door: { w: 32, h: 102, draw(ctx) {
    r(ctx, P.out, 0, 0, 32, 102);
    r(ctx, P.cream, 1, 1, 30, 100); r(ctx, P.creamLo, 1, 1, 30, 2);
    r(ctx, P.out, 8, 14, 16, 26); r(ctx, "#BFD8CC", 9, 15, 14, 24);
    r(ctx, P.out, 15, 15, 2, 24); r(ctx, P.out, 9, 26, 14, 2);
    outlineRect(ctx, P.creamLo, 6, 46, 20, 22);
    outlineRect(ctx, P.creamLo, 6, 72, 20, 22);
    r(ctx, P.gold, 26, 56, 2, 4); r(ctx, P.out, 26, 60, 2, 1);
  }},
  stove: { w: 30, h: 44, draw(ctx) {
    // back rail with dials
    r(ctx, P.out, 0, 0, 30, 8);
    r(ctx, P.white, 1, 1, 28, 6); r(ctx, "#FBF6E6", 1, 1, 28, 2);
    [[5, 3], [11, 3], [17, 3], [23, 3]].forEach(([x, y]) => { r(ctx, P.out, x, y, 3, 3); r(ctx, P.gold, x + 1, y + 1, 1, 1); });
    // cooktop with two big burner grates
    r(ctx, P.out, 0, 8, 30, 10);
    r(ctx, P.whiteLo, 1, 9, 28, 8);
    [[4, 10], [17, 10]].forEach(([x, y]) => { r(ctx, P.out, x, y, 9, 6); r(ctx, "#2A2622", x + 1, y + 1, 7, 4); r(ctx, "#4A463F", x + 2, y + 2, 5, 2); });
    // oven
    r(ctx, P.out, 0, 18, 30, 26);
    r(ctx, P.white, 1, 19, 28, 24);
    r(ctx, "#B8AE96", 4, 21, 22, 2);
    r(ctx, P.out, 4, 25, 22, 12);
    r(ctx, "#2A1A0C", 5, 26, 20, 10);
    r(ctx, P.glassHi, 7, 27, 5, 2);
    r(ctx, P.out, 1, 38, 28, 1);
    r(ctx, P.whiteLo, 1, 39, 28, 4);
  }},
  counter_sink: { w: 80, h: 44, draw(ctx) {
    // faucet rising above the counter
    r(ctx, P.out, 39, 0, 2, 6); r(ctx, "#B8AE96", 39, 1, 1, 5);
    r(ctx, P.out, 39, 0, 8, 2); r(ctx, "#B8AE96", 40, 0, 6, 1);
    r(ctx, P.out, 46, 2, 1, 2);
    // yellow tiled countertop
    r(ctx, P.out, 0, 6, 80, 9);
    r(ctx, "#E3C25E", 1, 7, 78, 4); r(ctx, "#EFD98A", 1, 7, 78, 1);
    r(ctx, "#C9A63E", 1, 11, 78, 3);
    for (let x = 9; x < 79; x += 8) r(ctx, "#A8862E", x, 7, 1, 7);
    // sink basin inset
    r(ctx, P.out, 31, 7, 22, 7);
    r(ctx, P.white, 32, 8, 20, 5); r(ctx, P.whiteLo, 32, 11, 20, 2);
    // cabinet run
    r(ctx, P.out, 1, 15, 78, 25);
    r(ctx, P.white, 2, 16, 76, 22);
    const door = (x, w, y, h) => { outlineRect(ctx, P.creamLo, x, y, w, h); r(ctx, "#B8AE96", x + Math.floor(w / 2), y + Math.floor(h / 2) - 1, 1, 2); };
    door(3, 17, 18, 8); door(22, 17, 18, 8); door(41, 17, 18, 8); door(60, 17, 18, 8);
    door(3, 17, 27, 10); door(22, 17, 27, 10); door(41, 17, 27, 10); door(60, 17, 27, 10);
    r(ctx, P.out, 2, 38, 76, 1);
    r(ctx, P.whiteLo, 4, 39, 72, 4);
    r(ctx, P.out, 4, 43, 72, 1);
  }},
  fridge: { w: 32, h: 60, draw(ctx) {
    r(ctx, P.out, 0, 0, 32, 60);
    r(ctx, P.white, 1, 1, 30, 58);
    r(ctx, "#FBF6E6", 1, 1, 30, 2);
    r(ctx, P.whiteLo, 1, 1, 3, 58);
    r(ctx, P.out, 1, 22, 30, 1);
    r(ctx, "#B8AE96", 25, 4, 2, 14);
    r(ctx, "#B8AE96", 25, 28, 2, 26);
    r(ctx, P.whiteLo, 1, 56, 30, 3);
  }},
  pantry: { w: 26, h: 72, draw(ctx) {
    r(ctx, P.out, 0, 0, 26, 72);
    r(ctx, P.cream, 1, 1, 24, 70); r(ctx, "#FBF6E6", 1, 1, 24, 2);
    outlineRect(ctx, P.creamLo, 4, 5, 18, 30);
    outlineRect(ctx, P.creamLo, 4, 39, 18, 28);
    r(ctx, P.creamLo, 1, 68, 24, 3);
    r(ctx, "#B8AE96", 20, 33, 2, 8);
  }},
  kettle: { w: 14, h: 11, draw(ctx) {
    r(ctx, P.out, 4, 0, 6, 3); r(ctx, "#6C90BE", 5, 1, 4, 1);
    r(ctx, P.out, 1, 2, 12, 9);
    r(ctx, "#4A6E9C", 2, 3, 10, 7);
    r(ctx, "#6C90BE", 2, 3, 10, 2);
    r(ctx, P.out, 0, 4, 3, 2); r(ctx, "#6C90BE", 0, 4, 2, 1);
    r(ctx, P.out, 10, 0, 3, 1); r(ctx, P.out, 12, 1, 1, 3); r(ctx, P.out, 9, 3, 2, 1);
  }},
  cutting_board: { w: 12, h: 6, draw(ctx) {
    r(ctx, P.out, 0, 0, 12, 6);
    r(ctx, P.woodMid, 1, 1, 10, 4);
    r(ctx, P.woodHi, 1, 1, 10, 1);
    r(ctx, P.woodDark, 1, 4, 10, 1);
  }},
  dish_rack: { w: 18, h: 10, draw(ctx) {
    r(ctx, P.out, 0, 7, 18, 3);
    r(ctx, "#B8AE96", 1, 8, 16, 1);
    [2, 5, 8, 11, 14, 16].forEach((x) => r(ctx, "#B8AE96", x, 0, 1, 8));
    r(ctx, P.out, 3, 1, 5, 7); r(ctx, P.cream, 4, 2, 3, 5);
    r(ctx, P.out, 10, 1, 5, 7); r(ctx, P.cream, 11, 2, 3, 5);
  }},
  sill_plants_k: { w: 20, h: 9, draw(ctx) {
    [0, 11].forEach((x) => {
      r(ctx, P.green, x + 2, 0, 1, 5); r(ctx, P.greenHi, x + 4, 1, 1, 4); r(ctx, P.green, x + 6, 0, 1, 5);
      r(ctx, P.out, x, 5, 8, 4); r(ctx, P.terra, x + 1, 6, 6, 3); r(ctx, P.terraLo, x + 1, 8, 6, 1);
    });
  }},
  fridge_plant: { w: 16, h: 12, draw(ctx) {
    r(ctx, P.out, 3, 6, 10, 6);
    r(ctx, P.terra, 4, 7, 8, 4); r(ctx, P.terraLo, 4, 10, 8, 1);
    r(ctx, P.green, 3, 1, 10, 6); r(ctx, P.greenHi, 3, 1, 10, 2);
    dith(ctx, P.greenLo, 3, 4, 10, 3, 2, 0);
    r(ctx, P.green, 0, 8, 3, 1); r(ctx, P.greenHi, 0, 7, 2, 1);
    r(ctx, P.green, 13, 8, 3, 1); r(ctx, P.greenHi, 14, 7, 2, 1);
  }},
  door_towel: { w: 13, h: 16, draw(ctx) {
    r(ctx, P.out, 0, 0, 13, 2);
    r(ctx, "#B8AE96", 1, 0, 11, 1);
    r(ctx, P.out, 1, 2, 11, 14);
    r(ctx, P.cream, 2, 3, 9, 12);
    [3, 6, 9, 12].forEach((y, i) => r(ctx, i % 2 ? "#A3252C" : "#C97B2E", 2, y, 9, 2));
    dith(ctx, P.creamLo, 2, 13, 9, 2, 2, 0);
  }},
};

const KITCHEN_OBJECTS = [
  { id: "stove", name: "Stove & Oven", category: "furniture", x: 200, y: 286, z: 3, removable: false,
    check: "Gas line's hooked in behind it — this range isn't budging from that wall." },
  { id: "counter_sink", name: "Counter & Sink", category: "furniture", x: 320, y: 286, z: 3, removable: false,
    check: "Plumbed straight into the wall. The sink comes with the house, not the boxes." },
  { id: "fridge", name: "Refrigerator", category: "furniture", x: 640, y: 222, z: 3, removable: false,
    check: "That compressor's been humming since before you moved in — it'll keep humming after." },
  { id: "pantry", name: "Pantry Cabinet", category: "furniture", x: 768, y: 174, z: 3, removable: false,
    check: "Built in stud by stud. That cabinet is part of the wall now." },
  { id: "kettle", name: "Blue Kettle", category: "decor", value: 12, x: 236, y: 278, z: 4, removable: true,
    check: "It's announced every cup of tea in this kitchen for a decade. Still whistles right on cue." },
  { id: "cutting_board", name: "Cutting Board", category: "decor", value: 5, x: 344, y: 294, z: 4, removable: true,
    check: "Scarred with a thousand onions. Somehow still your favorite one." },
  { id: "dish_rack", name: "Dish Rack", category: "decor", value: 8, x: 544, y: 276, z: 4, removable: true,
    check: "Two plates and a prayer. It's held up the whole time you've lived here." },
  { id: "sill_plants_k", name: "Windowsill Herbs", category: "plants", value: 6, x: 488, y: 226, z: 4, removable: true,
    check: "Herbs that outlived three New Year's resolutions to cook more." },
  { id: "fridge_plant", name: "Fridge-top Plant", category: "plants", value: 7, x: 672, y: 178, z: 4, removable: true,
    check: "It's trailed off that fridge top so long it's basically a factory feature." },
  { id: "kitchen_door", name: "Back Door", category: "furniture", x: 96, y: 40, z: 1, removable: false,
    check: "The service door to the back stairs. Comes with the building." },
  { id: "door_towel", name: "Striped Towel", category: "textiles", value: 3, x: 128, y: 140, z: 2, removable: true,
    check: "Threadbare, stained, irreplaceable. It stays folded over that bar out of pure habit." },
];

/* ============================================================
   DINING ROOM — shell + sprites (ref: dining mockup)
   ============================================================ */
function drawDiningShell(ctx) {
  const W = 240;
  const WALL_BASE = "#EDE3C4", WALL_LIGHT = "#F6EFD8", WALL_SHADE = "#D8CBA4";

  r(ctx, WALL_BASE, 0, 0, W, 112);
  r(ctx, WALL_LIGHT, 0, 0, W, 17);
  r(ctx, WALL_LIGHT, 0, 0, W, 3);
  r(ctx, WALL_SHADE, 0, 3, W, 1);
  r(ctx, WALL_LIGHT, 0, 17, W, 1);
  dith(ctx, WALL_SHADE, 0, 18, W, 4, 2, 0);
  r(ctx, WALL_SHADE, 0, 22, W, 1);
  // chair rail with a slightly deeper lower wall band
  r(ctx, "#E2D5B0", 0, 87, W, 19);
  r(ctx, P.cream, 0, 84, W, 3);
  r(ctx, "#C9BA92", 0, 87, W, 1);
  dith(ctx, WALL_SHADE, 0, 98, W, 8, 2, 0);
  r(ctx, P.cream, 0, 106, W, 6);
  r(ctx, P.creamLo, 0, 106, W, 1);
  r(ctx, P.out, 0, 111, W, 1);

  // plank floor (must match extendFloorPlank exactly)
  r(ctx, P.floor, 0, 112, 240, 68);
  for (let row = 0; row * 8 + 112 < 180; row++) {
    const y0 = 112 + row * 8;
    r(ctx, P.floorDark, 0, y0 + 7, 240, 1);
    dith(ctx, P.floorLight, 0, y0 + 1, 240, 3, 5, row * 3);
    const off = (row % 2) * 24;
    for (let x = off + 10; x < 240; x += 48) r(ctx, P.floorDark, x, y0, 1, 7);
  }

  r(ctx, P.out, 0, 0, 7, 112);
  r(ctx, P.woodDark, 0, 0, 5, 112);
  r(ctx, P.woodMid, 4, 4, 1, 104);

  // window is now a movable object (DINING_SPRITES.dining_window)

  dith(ctx, WALL_SHADE, 0, 0, 26, 112, 2, 0);
  dith(ctx, WALL_SHADE, 240 - 22, 0, 22, 112, 2, 1);
}

function drawDiningChairSides(ctx) {
  const sideChair = (ox, flip) => {
    const outer = flip ? ox + 19 : ox;
    r(ctx, P.out, outer, 7, 4, 33); r(ctx, "#1C1916", outer + 1, 8, 2, 31);
    const seatX = flip ? ox : ox + 6;
    r(ctx, P.out, seatX, 32, 17, 7); r(ctx, "#5C6C80", seatX + 1, 33, 15, 5);
    r(ctx, "#6E7E92", seatX + 1, 33, 15, 2);
    r(ctx, P.out, ox, 39, 23, 4); r(ctx, "#3A362F", ox + 1, 40, 21, 2);
    r(ctx, P.out, seatX + 2, 39, 3, 14); r(ctx, P.out, seatX + 13, 39, 3, 14);
    r(ctx, "#1C1916", seatX + 3, 40, 1, 12); r(ctx, "#1C1916", seatX + 14, 40, 1, 12);
  };
  sideChair(8, false); sideChair(65, true);
}
function drawDiningFrontCushion(ctx) {
  r(ctx, P.out, 0, 0, 30, 9); r(ctx, "#5C6C80", 1, 1, 28, 7); r(ctx, "#6E7E92", 1, 1, 28, 2);
}
function drawDiningFrontFrame(ctx) {
  r(ctx, P.out, 3, 19, 4, 19); r(ctx, P.out, 27, 19, 4, 19);
  r(ctx, "#1C1916", 4, 20, 2, 17); r(ctx, "#1C1916", 28, 20, 2, 17);
  r(ctx, P.out, 0, 0, 34, 5); r(ctx, "#3A362F", 1, 1, 32, 3);
  r(ctx, P.out, 1, 4, 4, 25); r(ctx, P.out, 29, 4, 4, 25);
  [8, 16, 24].forEach((x) => { r(ctx, P.out, x, 5, 3, 21); r(ctx, "#1C1916", x + 1, 6, 1, 19); });
  r(ctx, P.out, 1, 25, 32, 5); r(ctx, "#3A362F", 2, 26, 30, 3);
}

const DINING_SPRITES = {
  dining_window: { w: 78, h: 69, draw(ctx) {
    r(ctx, P.out, 3, 0, 72, 66);
    r(ctx, P.cream, 4, 1, 70, 64);
    r(ctx, P.creamLo, 4, 64, 70, 1);
    r(ctx, P.sky, 7, 4, 64, 58);
    for (let sy = 5; sy < 61; sy += 4) r(ctx, P.glassHi, 8, sy, 62, 2);
    r(ctx, P.cream, 38, 2, 2, 62);
    r(ctx, P.out, 0, 64, 78, 5);
    r(ctx, P.creamLo, 1, 65, 76, 3);
    r(ctx, P.woodDark, 0, 68, 78, 1);
  }},
  dining_curtains: { w: 80, h: 68, draw(ctx) {
    r(ctx, P.out, 0, 0, 80, 3);
    r(ctx, P.woodDark, 1, 1, 78, 1);
    r(ctx, P.woodDark, 0, 0, 2, 3); r(ctx, P.woodDark, 78, 0, 2, 3);
    [1, 61].forEach((x) => {
      r(ctx, P.out, x, 3, 18, 64);
      r(ctx, "#3F5C46", x + 1, 4, 16, 62);
      r(ctx, "#527455", x + 1, 4, 18, 3);
      dith(ctx, "#2E4735", x + 1, 44, 16, 20, 2, 0);
      r(ctx, "#2E4735", x + 5, 4, 1, 62); r(ctx, "#2E4735", x + 11, 4, 1, 62);
    });
  }},
  sill_plants_d: { w: 14, h: 8, draw(ctx) {
    [0, 8].forEach((x) => {
      r(ctx, P.out, x, 0, 6, 5);
      r(ctx, P.green, x + 1, 1, 2, 3); r(ctx, P.greenHi, x + 1, 1, 2, 1);
      r(ctx, P.greenLo, x + 3, 1, 2, 3);
      r(ctx, P.out, x, 4, 6, 4);
      r(ctx, P.terra, x + 1, 5, 4, 3); r(ctx, P.terraLo, x + 1, 7, 4, 1);
    });
  }},
  shelf_art: { w: 46, h: 50, draw(ctx) {
    r(ctx, P.out, 0, 0, 46, 50); r(ctx, P.wood, 1, 1, 44, 48);
    r(ctx, P.woodHi, 1, 1, 44, 2); r(ctx, P.cream, 4, 4, 38, 42);
    r(ctx, P.glass, 5, 5, 36, 18); r(ctx, P.woodMid, 5, 23, 36, 2);
    r(ctx, "#4A4A4A", 19, 9, 8, 13); r(ctx, P.mustardHi, 21, 13, 4, 8);
    r(ctx, P.burgundy, 8, 29, 6, 13); r(ctx, P.teal, 17, 27, 6, 15);
    r(ctx, P.mustard, 26, 30, 5, 12); r(ctx, P.wood, 35, 28, 4, 14);
  }},
  dining_table: { w: 64, h: 50, draw(ctx) {
    const w = 64;
    const steps = [8, 4, 1];
    for (let i = 0; i < 3; i++) {
      const inset = steps[i];
      r(ctx, P.out, inset, i, w - 2 * inset, 1);
    }
    r(ctx, P.out, 0, 3, 1, 26); r(ctx, P.out, w - 1, 3, 1, 26);
    for (let i = 0; i < 3; i++) {
      const inset = steps[2 - i];
      r(ctx, P.out, inset, 29 + i, w - 2 * inset, 1);
    }
    r(ctx, P.cream, 8, 1, w - 16, 1);
    r(ctx, P.cream, 4, 2, w - 8, 1);
    r(ctx, P.cream, 1, 3, w - 2, 26);
    r(ctx, P.cream, 4, 29, w - 8, 1);
    r(ctx, P.cream, 8, 30, w - 16, 1);
    r(ctx, P.white, 8, 1, w - 16, 1);
    r(ctx, P.white, 4, 2, w - 8, 1);
    r(ctx, P.white, 1, 3, w - 2, 2);
    dith(ctx, P.creamLo, 4, 24, w - 8, 6, 2, 0);
    r(ctx, P.out, 3, 31, w - 6, 9);
    r(ctx, P.creamLo, 4, 32, w - 8, 7);
    r(ctx, P.whiteLo, 4, 32, w - 8, 1);
    r(ctx, P.out, 14, 40, 4, 10); r(ctx, P.out, 46, 40, 4, 10);
    r(ctx, P.cream, 15, 41, 2, 8); r(ctx, P.cream, 47, 41, 2, 8);
  }},
  dining_chairs: { w: 96, h: 58, draw(ctx) {
    drawDiningChairSides(ctx);
    ctx.save(); ctx.translate(33, 30); drawDiningFrontCushion(ctx); ctx.restore();
    ctx.save(); ctx.translate(31, 18); drawDiningFrontFrame(ctx); ctx.restore();
  }},
  candle_bowl: { w: 16, h: 12, draw(ctx) {
    r(ctx, P.out, 0, 6, 16, 6);
    r(ctx, P.teal, 1, 7, 14, 4);
    r(ctx, P.tealHi, 1, 7, 14, 1);
    dith(ctx, P.tealLo, 1, 9, 14, 1, 2, 0);
    r(ctx, P.out, 3, 4, 10, 3);
    r(ctx, P.woodLight, 4, 5, 8, 1);
    r(ctx, P.out, 6, 0, 4, 5);
    r(ctx, P.cream, 7, 0, 2, 4);
    r(ctx, P.mustardHi, 7, 0, 2, 1);
  }},
  bar_cabinet: { w: 54, h: 50, draw(ctx) {
    r(ctx, P.out, 0, 0, 54, 5); r(ctx, P.woodLight, 1, 1, 52, 3);
    r(ctx, P.out, 2, 5, 50, 40); r(ctx, P.woodDark, 3, 6, 48, 38);
    r(ctx, P.out, 26, 6, 2, 38);
    r(ctx, P.woodMid, 4, 7, 21, 36); r(ctx, P.woodMid, 29, 7, 21, 36);
    r(ctx, P.woodHi, 4, 7, 21, 2); r(ctx, P.woodHi, 29, 7, 21, 2);
    r(ctx, "#B8AE96", 22, 25, 3, 3); r(ctx, "#B8AE96", 29, 25, 3, 3);
    r(ctx, P.out, 4, 45, 7, 5); r(ctx, P.out, 43, 45, 7, 5);
    r(ctx, P.woodDark, 5, 46, 5, 3); r(ctx, P.woodDark, 44, 46, 5, 3);
  }},
  bar_bottles: { w: 28, h: 16, draw(ctx) {
    r(ctx, P.out, 0, 4, 6, 12);
    r(ctx, P.wood, 1, 5, 4, 10);
    r(ctx, P.woodHi, 1, 5, 4, 1);
    r(ctx, P.out, 8, 2, 4, 14);
    r(ctx, P.green, 9, 3, 2, 12); r(ctx, P.greenHi, 9, 3, 2, 2);
    r(ctx, P.out, 9, 0, 2, 3); r(ctx, P.green, 9, 0, 2, 3);
    r(ctx, P.out, 14, 3, 4, 13);
    r(ctx, P.mustard, 15, 4, 2, 11); r(ctx, P.mustardHi, 15, 4, 2, 2);
    r(ctx, P.out, 15, 1, 2, 3); r(ctx, P.mustard, 15, 1, 2, 3);
    r(ctx, P.out, 20, 5, 8, 11);
    r(ctx, P.glass, 21, 6, 6, 9);
    r(ctx, P.red, 21, 9, 6, 6); r(ctx, P.redHi, 21, 9, 6, 1);
    r(ctx, P.out, 22, 1, 4, 5);
    r(ctx, P.glassHi, 23, 0, 2, 2);
  }},
};

const DINING_OBJECTS = [
  { id: "dining_window", name: "Window", category: "furniture", x: 324, y: 48, z: 1, removable: false,
    check: "Single-pane, drafty, yours to look through until the last box is out. It stays." },
  { id: "dining_curtains", name: "Green Curtains", category: "textiles", x: 320, y: 48, z: 2, removable: true, value: 10,
    check: "They never belonged to the landlord — take them, or leave them for the next tenant." },
  { id: "sill_plants_d", name: "Sill Succulents", category: "plants", x: 452, y: 280, z: 3, removable: true, value: 6,
    check: "Low-maintenance succulents. They've survived worse landlords than this one." },
  { id: "shelf_art", name: "Still-life Print", category: "decor", x: 696, y: 56, z: 2, removable: true, value: 9,
    check: "A framed print of a shelf. The real shelf was sold separately, apparently." },
  { id: "dining_table", name: "Dining Table", category: "furniture", x: 300, y: 350, z: 4, removable: true, value: 70,
    check: "Hosted exactly one dinner party. It was, by all accounts, a triumph." },
  { id: "dining_chairs", name: "Chair Set", category: "furniture", x: 236, y: 332, z: 3, removable: true, value: 60,
    check: "Four chairs, three matching. Close enough." },
  { id: "candle_bowl", name: "Candle Centerpiece", category: "decor", x: 396, y: 366, z: 5, removable: true, value: 6,
    check: "Never once lit. Purely decorative, deeply judgmental about it." },
  { id: "bar_cabinet", name: "Bar Cabinet", category: "furniture", x: 680, y: 272, z: 3, removable: true, value: 45,
    check: "Small, dark, and full of the good glasses. Mostly good glasses." },
  { id: "bar_bottles", name: "Bar Collection", category: "decor", x: 732, y: 216, z: 4, removable: true, value: 18,
    check: "The bar collection has opinions, mostly about your taste in wine." },
];

/* ============================================================
   LIVING ROOM — shell + sprites (ref: living room mockup)
   ============================================================ */
function drawLivingShell(ctx) {
  const wallBase = "#EBDFC0", wallLight = "#F5EDD4", wallShade = "#D5C79E";
  r(ctx, wallBase, 0, 0, 240, 112);
  r(ctx, wallLight, 0, 0, 240, 3);
  r(ctx, wallShade, 0, 3, 240, 1);
  dith(ctx, wallShade, 0, 16, 240, 3, 2, 0);
  r(ctx, P.cream, 0, 106, 240, 6);
  r(ctx, P.creamLo, 0, 106, 240, 1);
  r(ctx, P.out, 0, 111, 240, 1);

  // plank floor (must match extendFloorPlank exactly), warmed with a tint pass
  r(ctx, P.floor, 0, 112, 240, 68);
  for (let row = 0; row * 8 + 112 < 180; row++) {
    const y0 = 112 + row * 8;
    r(ctx, P.floorDark, 0, y0 + 7, 240, 1);
    dith(ctx, P.floorLight, 0, y0 + 1, 240, 3, 5, row * 3);
    const off = (row % 2) * 24;
    for (let x = off + 10; x < 240; x += 48) r(ctx, P.floorDark, x, y0, 1, 7);
  }
  dith(ctx, "#8C5931", 0, 112, 240, 68, 6, 1);

  r(ctx, P.out, 0, 0, 7, 112);
  r(ctx, P.woodDark, 0, 0, 5, 112);
  r(ctx, P.woodMid, 4, 4, 1, 104);

  dith(ctx, wallShade, 0, 0, 26, 112, 2, 0);
  dith(ctx, wallShade, 240 - 22, 0, 22, 112, 2, 1);
}

const LIVING_SPRITES = {
  tv_hutch: { w: 56, h: 96, draw(ctx) {
    r(ctx, P.woodDark, 24, 6, 8, 4);
    r(ctx, P.green, 22, 0, 3, 7); r(ctx, P.greenHi, 25, 0, 2, 6);
    r(ctx, P.green, 28, 1, 3, 6); r(ctx, P.greenLo, 26, 3, 2, 4);
    r(ctx, P.out, 0, 10, 56, 4);
    r(ctx, P.woodHi, 1, 11, 54, 2);
    r(ctx, P.woodDark, 1, 13, 54, 1);
    r(ctx, P.out, 0, 14, 56, 82);
    r(ctx, P.woodMid, 1, 15, 54, 80);
    r(ctx, P.woodDark, 1, 15, 54, 1);
    outlineRect(ctx, "#2A1A0C", 4, 18, 48, 13);
    r(ctx, P.woodDark, 5, 19, 46, 11);
    r(ctx, P.woodHi, 5, 27, 46, 1);
    [[6, 20, 2, 7, P.burgundy], [9, 21, 2, 6, P.teal], [12, 19, 2, 8, P.mustard],
     [15, 21, 2, 6, P.green], [41, 20, 2, 7, P.burgundy], [44, 21, 2, 6, P.mustard]]
      .forEach(([x, y, w, h, c]) => { r(ctx, P.out, x, y, w, h); r(ctx, c, x, y + 1, w, h - 1); });
    outlineRect(ctx, "#2A1A0C", 4, 33, 48, 24);
    r(ctx, P.woodDark, 5, 34, 46, 22);
    r(ctx, P.out, 8, 36, 40, 17);
    r(ctx, "#141414", 9, 37, 38, 15);
    r(ctx, P.glassHi, 12, 38, 6, 2);
    r(ctx, P.glassHi, 21, 40, 3, 1);
    r(ctx, P.woodDark, 26, 53, 4, 3);
    r(ctx, P.woodHi, 1, 57, 54, 2);
    r(ctx, P.woodDark, 1, 59, 54, 1);
    outlineRect(ctx, "#2A1A0C", 3, 61, 24, 31);
    r(ctx, P.woodLight, 4, 62, 22, 29);
    r(ctx, P.woodHi, 4, 62, 22, 2);
    outlineRect(ctx, "#2A1A0C", 29, 61, 24, 31);
    r(ctx, P.woodLight, 30, 62, 22, 29);
    r(ctx, P.woodHi, 30, 62, 22, 2);
    dith(ctx, P.wood, 5, 66, 20, 22, 3, 0);
    dith(ctx, P.wood, 31, 66, 20, 22, 3, 0);
    r(ctx, P.gold, 23, 76, 2, 2);
    r(ctx, P.gold, 31, 76, 2, 2);
    r(ctx, P.woodDark, 2, 92, 52, 4);
  }},
  wall_art_pair: { w: 52, h: 30, draw(ctx) {
    r(ctx, P.out, 0, 0, 31, 30); r(ctx, P.woodDark, 1, 1, 29, 2);
    r(ctx, "#17233F", 3, 4, 25, 18); r(ctx, "#0F1830", 3, 17, 25, 5);
    r(ctx, P.goldHi, 13, 18, 4, 6); r(ctx, P.gold, 13, 23, 4, 1);
    [[6, 6], [11, 5], [23, 7], [19, 11], [8, 13]].forEach(([x, y]) => r(ctx, P.white, x, y, 1, 1));
    r(ctx, P.woodDark, 1, 26, 29, 3);
    r(ctx, P.out, 36, 4, 16, 24); r(ctx, P.woodDark, 37, 5, 14, 2);
    r(ctx, P.white, 37, 7, 14, 19);
    r(ctx, P.out, 39, 9, 5, 8); r(ctx, P.out, 45, 14, 5, 7); r(ctx, P.out, 41, 20, 4, 4);
  }},
  sofa: { w: 76, h: 52, draw(ctx) {
    r(ctx, P.out, 0, 8, 12, 44);
    r(ctx, "#2A2622", 1, 9, 10, 42);
    r(ctx, "#3A362F", 1, 9, 10, 3);
    r(ctx, P.out, 64, 8, 12, 44);
    r(ctx, "#2A2622", 65, 9, 10, 42);
    r(ctx, "#3A362F", 65, 9, 10, 3);
    r(ctx, P.out, 10, 2, 56, 30);
    r(ctx, "#2A2622", 11, 3, 54, 28);
    r(ctx, "#3A362F", 11, 3, 54, 3);
    r(ctx, P.out, 38, 3, 1, 28);
    r(ctx, P.out, 8, 30, 60, 22);
    r(ctx, "#2A2622", 9, 31, 58, 20);
    r(ctx, "#3A362F", 9, 31, 58, 2);
    r(ctx, P.out, 38, 31, 1, 19);
    dith(ctx, "#1C1916", 9, 44, 58, 3, 2, 0);
    r(ctx, "#1C1916", 9, 47, 58, 4);
    r(ctx, P.out, 9, 3, 26, 5);
    r(ctx, P.cream, 10, 4, 24, 4);
    r(ctx, P.out, 12, 8, 18, 23);
    r(ctx, P.cream, 13, 9, 16, 21);
    r(ctx, P.creamLo, 13, 9, 16, 3);
    dith(ctx, P.creamLo, 13, 20, 16, 9, 3, 0);
    for (let fx = 13; fx < 29; fx += 2) r(ctx, P.creamLo, fx, 29, 1, 2);
    r(ctx, P.out, 46, 16, 18, 15);
    r(ctx, P.red, 47, 17, 16, 13);
    r(ctx, P.redHi, 47, 17, 16, 3);
    [[50, 22], [56, 22], [53, 26], [50, 29], [56, 29]].forEach(([x, y]) => r(ctx, P.gold, x, y, 1, 1));
  }},
  living_rug: { w: 150, h: 60, draw(ctx) {
    r(ctx, "#3E2413", 2, 2, 146, 56);
    r(ctx, "#8C5931", 4, 4, 142, 52);
    [8, 16, 28, 36, 48].forEach((y, i) => r(ctx, i % 2 ? "#C9B48E" : "#5E351B", 4, y, 142, 5));
    dith(ctx, "#5E351B", 4, 4, 142, 52, 6, 1);
    for (let y = 4; y < 56; y += 3) { r(ctx, P.creamLo, 0, y, 2, 1); r(ctx, P.creamLo, 148, y, 2, 1); }
  }},
  // 3/4 view: deep light-wood top plane, front edge, block legs, lower shelf
  coffee_table: { w: 104, h: 44, draw(ctx) {
    r(ctx, P.out, 0, 0, 104, 17); r(ctx, "#C49964", 1, 1, 102, 15);
    r(ctx, "#D9B27E", 1, 1, 102, 4);
    r(ctx, "#A87A4A", 1, 8, 102, 1); r(ctx, "#A87A4A", 1, 13, 102, 1);
    r(ctx, P.out, 0, 17, 104, 7); r(ctx, "#A87A4A", 1, 18, 102, 5);
    r(ctx, "#8F6538", 1, 21, 102, 2);
    r(ctx, P.out, 4, 24, 8, 20); r(ctx, "#8F6538", 5, 25, 6, 18);
    r(ctx, P.out, 92, 24, 8, 20); r(ctx, "#8F6538", 93, 25, 6, 18);
    r(ctx, P.out, 10, 32, 84, 6); r(ctx, "#B98F5C", 11, 33, 82, 4);
    dith(ctx, "#8F6538", 11, 33, 82, 4, 3, 0);
  }},
  table_decor: { w: 34, h: 14, draw(ctx) {
    r(ctx, P.out, 1, 10, 10, 3);
    r(ctx, P.woodDark, 2, 11, 8, 2);
    r(ctx, P.out, 2, 2, 7, 9);
    r(ctx, P.cream, 3, 3, 5, 8);
    r(ctx, P.creamLo, 3, 3, 5, 2);
    r(ctx, P.goldHi, 5, 1, 1, 2);
    r(ctx, P.out, 12, 7, 6, 7);
    r(ctx, P.woodDark, 13, 8, 4, 5);
    r(ctx, "#8A4526", 13, 5, 1, 3);
    r(ctx, "#A85A32", 15, 4, 1, 4);
    r(ctx, "#8A4526", 16, 5, 1, 3);
    r(ctx, P.out, 19, 9, 15, 4);
    r(ctx, P.green, 20, 10, 13, 2);
    r(ctx, P.out, 19, 5, 15, 4);
    r(ctx, "#3C5C86", 20, 6, 13, 2);
  }},
  destijl_poster: { w: 26, h: 36, draw(ctx) {
    r(ctx, P.out, 0, 0, 26, 36);
    r(ctx, P.white, 1, 1, 24, 34);
    r(ctx, P.out, 3, 3, 20, 24);
    r(ctx, P.white, 4, 4, 18, 22);
    r(ctx, P.red, 4, 4, 8, 10);
    r(ctx, "#1F4E9C", 14, 4, 8, 6);
    r(ctx, P.gold, 4, 16, 6, 10);
    r(ctx, "#1F4E9C", 14, 16, 8, 10);
    r(ctx, P.out, 12, 4, 2, 22);
    r(ctx, P.out, 4, 14, 18, 2);
    r(ctx, P.out, 5, 29, 16, 2);
    r(ctx, P.out, 7, 32, 12, 2);
  }},
  standing_mirror: { w: 20, h: 58, draw(ctx) {
    r(ctx, P.out, 0, 0, 20, 58);
    r(ctx, P.wood, 1, 1, 18, 56);
    r(ctx, P.woodHi, 1, 1, 18, 2);
    r(ctx, P.out, 3, 3, 14, 52);
    r(ctx, P.glass, 4, 4, 12, 50);
    r(ctx, P.glassHi, 6, 5, 2, 48);
    r(ctx, P.glassHi, 11, 5, 1, 48);
    dith(ctx, P.glassLo, 13, 6, 3, 46, 2, 1);
    r(ctx, P.woodDark, 2, 56, 4, 2);
    r(ctx, P.woodDark, 14, 56, 4, 2);
  }},
  floor_lamp: { w: 18, h: 72, draw(ctx) {
    r(ctx, P.out, 2, 0, 14, 8);
    r(ctx, P.red, 3, 1, 12, 6);
    r(ctx, P.redHi, 3, 1, 12, 2);
    r(ctx, P.goldHi, 6, 8, 6, 2);
    r(ctx, P.out, 7, 10, 4, 54);
    r(ctx, "#1C1916", 8, 10, 2, 54);
    r(ctx, P.woodHi, 8, 10, 1, 38);
    r(ctx, P.out, 5, 62, 8, 3); r(ctx, "#1C1916", 6, 63, 6, 1);
    // round, weighted base instead of feet
    r(ctx, P.out, 3, 65, 12, 1); r(ctx, P.out, 1, 66, 16, 4);
    r(ctx, P.out, 3, 70, 12, 2); r(ctx, "#1C1916", 2, 67, 14, 2);
  }},
};

const LIVING_OBJECTS = [
  { id: "tv_hutch", name: "TV Hutch", category: "furniture", value: 120, x: 72, y: 78, z: 3, removable: true,
    check: "Every remote from the last decade is lost somewhere inside this thing." },
  { id: "wall_art_pair", name: "Wall Art", category: "decor", value: 12, x: 376, y: 104, z: 2, removable: true,
    check: "The night scene came first; the little black-and-white one followed you home from a yard sale." },
  { id: "sofa", name: "Leather Loveseat", category: "furniture", value: 150, x: 328, y: 257, z: 3, removable: true,
    check: "This is the couch that remembers every nap you've ever taken on it. It's coming with you." },
  { id: "living_rug", name: "Striped Rug", category: "textiles", value: 20, x: 180, y: 500, z: 1, removable: true,
    check: "Vacuumed a thousand times, forgiven nothing. Roll it up carefully." },
  { id: "coffee_table", name: "Coffee Table", category: "furniture", value: 40, x: 272, y: 468, z: 4, removable: true,
    check: "Ring stains from a decade of mugs you swore you'd use a coaster for." },
  { id: "table_decor", name: "Table Clutter", category: "decor", value: 8, x: 412, y: 424, z: 5, removable: true,
    check: "A candle you're saving for a special occasion that never comes, plus two books you'll definitely finish." },
  { id: "destijl_poster", name: "De Stijl Poster", category: "decor", value: 15, x: 640, y: 314, z: 3, removable: true,
    check: "Picked it up on that museum trip you half remember — mostly you remember the gift shop." },
  { id: "standing_mirror", name: "Standing Mirror", category: "furniture", value: 35, x: 752, y: 230, z: 2, removable: true,
    check: "Leans just enough to make you check your posture on the way out the door." },
  { id: "floor_lamp", name: "Torchiere Lamp", category: "lighting", value: 25, x: 836, y: 174, z: 3, removable: true,
    check: "Casts exactly one warm circle of light and no more. Very committed to its one job." },
];

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
      { id: "curtains",       name: "Curtains",         category: "textiles",  x: 300, y: 32,  z: 2, removable: true, value: 12,
        check: "Technically yours. Take them, sell them, or leave them hanging for the next tenant — donating counts." },
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
      { id: "nightstand",     name: "Nightstand",       category: "furniture", x: 68,  y: 372, z: 3, removable: true, value: 25,
        check: "One drawer of mysteries, one shelf of books you swear you'll finish before the flight." },
      { id: "vanity",         name: "Vanity Desk",      category: "furniture", x: 548, y: 228, z: 3, removable: true, value: 67,
        check: "White desk, good light — where letters and eyeliner both happened. The standing mirror beside it leans just so; you never once hung it properly, no regrets." },
      { id: "dresser",        name: "Dresser",          category: "furniture", x: 700, y: 174, z: 3, removable: true, value: 90,
        check: "Solid wood, heavier than it looks — the movers will curse its name. The mirror on top has checked a thousand outfits and kept every secret." },
      { id: "lamp",           name: "Mushroom Lamp",    category: "lighting",  x: 96,  y: 296, z: 4, removable: true, value: 18,
        check: "Chief mood-setter. Warm light or nothing." },
      { id: "stool",          name: "Stool",            category: "furniture", x: 600, y: 446, z: 4, removable: true, value: 10,
        check: "A little wobbly. Sit anyway." },
      { id: "vase",           name: "Red Glass Vase",   category: "decor",     x: 732, y: 270, z: 4, removable: true, value: 12,
        check: "Absolutely not surviving the box unless it's wrapped twice." },
      { id: "figurines",      name: "Thrifted Figurines",category: "decor",    x: 812, y: 286, z: 4, removable: true, value: 8,
        check: "Two tiny companions from a good thrift run. They've seen things." },
      { id: "basket",         name: "Everything Basket",category: "decor",     x: 772, y: 308, z: 4, removable: true, value: 5,
        check: "Currently holding: keys, receipts, one dried orange." },
      { id: "closet_door",    name: "Closet Door",      category: "furniture", x: 656, y: 72,  z: 1, removable: false,
        check: "Built into the wall — it stays. You'll miss the way it never quite latched." },
    ],
  },
};

/* floor continuation for tall (portrait) stages: repaint from the last full
   pattern row down to extH cells with the exact same formulas the shells use,
   so the overlap pixels are identical and the seam is invisible */
function extendFloorPlank(ctx, extH) {
  const WALL_B = 112, W = 240;
  const startRow = Math.floor((180 - WALL_B) / 8) - 1;
  for (let row = startRow; row * 8 + WALL_B < extH; row++) {
    const y0 = WALL_B + row * 8;
    r(ctx, P.floor, 0, y0, W, 8);
    r(ctx, P.floorDark, 0, y0 + 7, W, 1);
    dith(ctx, P.floorLight, 0, y0 + 1, W, 3, 5, row * 3);
    const off = (row % 2) * 24;
    for (let x = off + 10; x < W; x += 48) r(ctx, P.floorDark, x, y0, 1, 7);
  }
}
function extendFloorTile(ctx, extH) {
  const WALL_B = 112, W = 240;
  const startY = WALL_B + Math.floor((180 - WALL_B) / 12) * 12;
  for (let ty = startY; ty < extH; ty += 12)
    for (let tx = 0; tx < W; tx += 12) {
      r(ctx, "#D8BC86", tx, ty, 12, 12);
      if ((tx / 12 + (ty - WALL_B) / 12) % 2 === 0) r(ctx, "#CBAD72", tx, ty, 12, 12);
      r(ctx, "#B4955C", tx, ty, 12, 1); r(ctx, "#B4955C", tx, ty, 1, 12);
    }
}

/* ceiling band for tall portrait stages: dark wood planks above the wall,
   pushing the room toward the vertical middle of the phone screen */
function drawCeiling(ctx, h, shade = "#C7B28A", wall = "#D5C29B") {
  // upper wall in shadow, lightening as it approaches the crown molding —
  // tinted per room so it reads as the same wall, higher up
  const W = 240;
  r(ctx, shade, 0, 0, W, h);
  if (h > 24) dith(ctx, wall, 0, h - 24, W, 24, 3, 0);
  if (h > 10) dith(ctx, wall, 0, h - 10, W, 10, 2, 1);
}

/* ordered apartment strip: pan left/right through these */
const ROOMS_ORDER = ["bedroom", "bathroom", "office", "dining", "kitchen", "living"];
ROOMS.bedroom.sprites = SPRITES;
ROOMS.bedroom.drawShell = drawShell;
ROOMS.bedroom.floorKind = "plank";
ROOMS.bedroom.ceilTones = ["#D6C49E", "#E7D9B9"];
ROOMS.dining = {
  id: "dining", name: "Dining Room",
  drawShell: drawDiningShell, floorKind: "plank", ceilTones: ["#D8CBA4", "#EDE3C4"],
  sprites: DINING_SPRITES, objects: DINING_OBJECTS,
};
ROOMS.kitchen = {
  id: "kitchen", name: "Kitchen",
  drawShell: drawKitchenShell, floorKind: "tile", ceilTones: ["#D6C592", "#EDE0B4"],
  sprites: KITCHEN_SPRITES, objects: KITCHEN_OBJECTS,
};
ROOMS.living = {
  id: "living", name: "Living Room",
  drawShell: drawLivingShell, floorKind: "plank", ceilTones: ["#D5C79E", "#EBDFC0"],
  sprites: LIVING_SPRITES, objects: LIVING_OBJECTS,
};

ROOMS.bathroom = {
  id: "bathroom", name: "Bathroom",
  drawShell: drawBathroomShell, floorKind: "bathtile", sprites: BATH_SPRITES,
  objects: [
    { id: "crossstitch_art", name: "Cross-stitch Flower", category: "decor",    x: 96,  y: 140, z: 2, removable: true, value: 6,
      check: "Somebody's grandmother made this. Possibly yours." },
    { id: "red_towels",      name: "Fancy Towels",        category: "textiles", x: 480, y: 120, z: 2, removable: true, value: 5,
      check: "The fancy towels. Guests were never allowed to actually use them." },
    { id: "mirror_cabinet",  name: "Mirrored Cabinet",    category: "furniture",x: 640, y: 96,  z: 2, removable: false,
      check: "Behind the mirror: expired everything. The cabinet stays put." },
    { id: "sill_bottles",    name: "Windowsill Bottles",  category: "plants",   x: 248, y: 208, z: 3, removable: true, value: 7,
      check: "A tiny skyline of glass bottles and one determined plant." },
    { id: "bathtub",         name: "Bathtub",             category: "furniture",x: 66,  y: 344, z: 3, removable: false,
      check: "Deep enough to think in. It stays with the pipes." },
    { id: "toilet",          name: "Toilet",              category: "furniture",x: 460, y: 340, z: 3, removable: false,
      check: "The throne. Comes with the kingdom — it stays." },
    { id: "bath_vanity",     name: "Tiled Vanity",        category: "furniture",x: 610, y: 330, z: 3, removable: false,
      check: "Red tile counter, white cabinet, one optimistic sink. Plumbed in for good." },
    { id: "toilet_decor",    name: "Tank-top Decor",      category: "decor",    x: 484, y: 276, z: 4, removable: true, value: 6,
      check: "A leaning picture and a succulent that thrives on neglect." },
    { id: "toiletries",      name: "Toiletry Collection", category: "decor",    x: 630, y: 318, z: 4, removable: true, value: 10,
      check: "A perfume district. You use maybe two of these." },
    { id: "laundry_basket",  name: "Laundry Basket",      category: "textiles", x: 310, y: 500, z: 4, removable: true, value: 8,
      check: "One last load of “we'll deal with it at the new place.”" },
    { id: "tp_roll",         name: "Toilet Paper",        category: "decor",    x: 432, y: 288, z: 2, removable: false,
      check: "The last roll. Leave it for the next tenant — a small kindness." },
  ],
};

ROOMS.office = {
  id: "office", name: "Office",
  drawShell: drawOfficeShell, floorKind: "plank", sprites: OFFICE_SPRITES,
  objects: [
    { id: "office_curtains", name: "Green Curtains",   category: "textiles",  x: 468, y: 32,  z: 2, removable: true, value: 10,
      check: "Deep green, your taste. The landlord gets them only if you leave them." },
    { id: "wall_frames",     name: "Framed Certificates", category: "decor",  x: 240, y: 110, z: 2, removable: true, value: 6,
      check: "Certificates of things you're pretty sure you can still do." },
    { id: "desk_hutch",      name: "Desk & Hutch",     category: "furniture", x: 80,  y: 176, z: 3, removable: true, value: 85,
      check: "The command center. Every drawer is a junk drawer if you believe in yourself." },
    { id: "sewing_machine",  name: "Sewing Machine",   category: "furniture", x: 164, y: 116, z: 4, removable: true, value: 75,
      check: "It hemmed curtains once. Mostly it judges you from the shelf." },
    { id: "desk_lamp",       name: "Red Desk Lamp",    category: "lighting",  x: 92,  y: 262, z: 4, removable: true, value: 22,
      check: "Red, articulated, dramatic. It has supervised every all-nighter." },
    { id: "computer",        name: "Computer",         category: "furniture", x: 346, y: 264, z: 4, removable: true, value: 60,
      check: "Still runs. The fan sounds like it's trying its best." },
    { id: "desk_clutter",    name: "Desk Clutter",     category: "decor",     x: 470, y: 300, z: 4, removable: true, value: 10,
      check: "An open notebook, a dead pen, and a mug that never made it back to the kitchen." },
    { id: "office_chair",    name: "Office Chair",     category: "furniture", x: 430, y: 386, z: 4, removable: true, value: 35,
      check: "Molded to exactly one spine: yours." },
    { id: "storage_bin",     name: "Storage Tote",     category: "decor",     x: 752, y: 288, z: 4, removable: true, value: 6,
      check: "Labeled “MISC” — which was ambitious." },
    { id: "waste_bin",       name: "Wastebasket",      category: "decor",     x: 600, y: 296, z: 4, removable: true, value: 3,
      check: "Promoted to the desk for the move. Contains at least three drafts of the same letter." },
    { id: "side_cabinet",    name: "Side Cabinet",     category: "furniture", x: 664, y: 288, z: 3, removable: true, value: 30,
      check: "Short cabinet drafted into desk duty: books, one dramatic vase, and room for whatever's next." },
  ],
};

/* object state is keyed per-room so an id reused across rooms can never collide */
const sk = (roomId, id) => `${roomId}:${id}`;

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

/* Dev-only visual layout editor, opened with ?edit=1. It keeps drafts in
   localStorage and exports stage coordinates without changing game state. */
export function LayoutEditor() {
  const makeLayout = () => Object.fromEntries(ROOMS_ORDER.map((rid) => [rid,
    Object.fromEntries(ROOMS[rid].objects.map((o) => { const saved = SAVED_LAYOUT[rid]?.[o.id]; return [o.id, {
      x: saved?.x ?? o.x, y: saved?.y ?? o.y, scale: saved?.scale ?? 1,
      ...(rid === "dining" && o.id === "dining_chairs" ? { parts: {
        sides: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
        cushion: { x: 33, y: 30, scaleX: 1, scaleY: 1 },
        frame: { x: 31, y: 18, scaleX: 1, scaleY: 1 },
      } } : {}), ...(saved?.parts ? { parts: saved.parts } : {}),
    }]; }))
  ]));
  const [roomId, setRoomId] = useState("kitchen");
  const [layout, setLayout] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pack-it-up-layout")) || makeLayout(); }
    catch { return makeLayout(); }
  });
  const [selectedId, setSelectedId] = useState(null);
  const [chairPart, setChairPart] = useState("group");
  const [copied, setCopied] = useState(false);
  const drag = useRef(null);
  const stageRef = useRef(null);
  const room = ROOMS[roomId];
  const selected = selectedId ? layout[roomId]?.[selectedId] : null;

  useEffect(() => { localStorage.setItem("pack-it-up-layout", JSON.stringify(layout)); }, [layout]);
  useEffect(() => { setSelectedId(null); }, [roomId]);
  const [fit, setFit] = useState(0.4);
  useEffect(() => {
    const calc = () => setFit(Math.min(1, (window.innerWidth - 20) / STAGE_W));
    calc(); window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const updateSelected = (patch) => {
    if (!selectedId) return;
    setLayout((all) => ({ ...all, [roomId]: { ...all[roomId], [selectedId]: { ...all[roomId][selectedId], ...patch } } }));
  };
  const updateChairPart = (patch) => {
    if (selectedId !== "dining_chairs") return;
    setLayout((all) => {
      const item = all.dining.dining_chairs;
      const defaults = makeLayout().dining.dining_chairs.parts;
      const parts = item.parts || defaults;
      return { ...all, dining: { ...all.dining, dining_chairs: { ...item, parts: {
        ...parts, [chairPart]: { ...parts[chairPart], ...patch },
      } } } };
    });
  };
  const stagePoint = (e) => {
    const box = stageRef.current.getBoundingClientRect();
    return { x: (e.clientX - box.left) * STAGE_W / box.width, y: (e.clientY - box.top) * STAGE_H / box.height };
  };
  const beginDrag = (e, id) => {
    e.preventDefault(); e.stopPropagation();
    const p = stagePoint(e); const item = layout[roomId][id];
    drag.current = { id, dx: p.x - item.x, dy: p.y - item.y };
    setSelectedId(id); e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const moveDrag = (e) => {
    if (!drag.current) return;
    const p = stagePoint(e); const { id, dx, dy } = drag.current;
    setLayout((all) => ({ ...all, [roomId]: { ...all[roomId], [id]: {
      ...all[roomId][id], x: Math.round(p.x - dx), y: Math.round(p.y - dy),
    } } }));
  };
  const endDrag = () => { drag.current = null; };
  const resetRoom = () => setLayout((all) => ({ ...all, [roomId]: makeLayout()[roomId] }));
  const exportText = JSON.stringify(Object.fromEntries(ROOMS_ORDER.map((rid) => [rid,
    Object.fromEntries(ROOMS[rid].objects.map((o) => {
      const v = layout[rid][o.id];
      return [o.id, { x: Math.round(v.x), y: Math.round(v.y), scale: Number(v.scale.toFixed(2)), ...(v.parts ? { parts: v.parts } : {}) }];
    }))
  ])), null, 2);
  const copyLayout = async () => {
    try { await navigator.clipboard.writeText(exportText); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { setCopied(false); }
  };

  const ordered = [...room.objects].sort((a, b) => a.z - b.z ||
    (layout[roomId][a.id].y + room.sprites[a.id].h * CELL * layout[roomId][a.id].scale) -
    (layout[roomId][b.id].y + room.sprites[b.id].h * CELL * layout[roomId][b.id].scale));
  const panel = { background: "#241509", color: "#F2E4C0", border: "3px solid #120A04", boxShadow: "inset 0 0 0 2px #4A2E17" };
  const button = { ...panel, padding: "8px 10px", cursor: "pointer", fontFamily: "'Courier New', monospace", fontWeight: 700 };

  return <div style={{ minHeight: "100vh", background: "#160D06", color: "#F2E4C0", fontFamily: "'Courier New', monospace", display: "flex", flexDirection: "column" }}>
    <div style={{ ...panel, padding: 10, display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", zIndex: 20 }}>
      <strong style={{ marginRight: 8, color: "#FFD97A" }}>LAYOUT EDITOR</strong>
      {ROOMS_ORDER.map((rid) => <button key={rid} onClick={() => setRoomId(rid)} style={{ ...button, color: rid === roomId ? "#FFD97A" : "#C9B896" }}>{ROOMS[rid].name}</button>)}
      <button onClick={resetRoom} style={{ ...button, marginLeft: "auto" }}>Reset room</button>
      <button onClick={copyLayout} style={{ ...button, color: "#FFD97A" }}>{copied ? "Copied!" : "Copy layout"}</button>
    </div>
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, overflow: "auto", padding: 10, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
        <div style={{ width: STAGE_W * fit, height: STAGE_H * fit, flex: "0 0 auto", overflow: "hidden" }}>
        <div ref={stageRef} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}
          onPointerDown={() => setSelectedId(null)} style={{ position: "relative", width: STAGE_W, height: STAGE_H, transform: `scale(${fit})`, transformOrigin: "top left", touchAction: "none", boxShadow: "0 0 0 8px #3E2413, 0 0 0 12px #000" }}>
          <div style={{ position: "absolute", inset: 0 }}><PixelCanvas w={240} h={180} draw={room.drawShell} /></div>
          {ordered.map((o) => {
            const spr = room.sprites[o.id], v = layout[roomId][o.id], active = selectedId === o.id;
            return <div key={o.id} onPointerDown={(e) => beginDrag(e, o.id)} style={{
              position: "absolute", left: v.x, top: v.y, zIndex: o.z * 10, transform: `scale(${v.scale})`, transformOrigin: "top left",
              cursor: "grab", outline: active ? "5px solid #FFD97A" : "none", outlineOffset: 3,
            }}>{roomId === "dining" && o.id === "dining_chairs" ? (() => {
              const parts = v.parts || makeLayout().dining.dining_chairs.parts;
              const part = (key, w, h, draw) => <div key={key} onPointerDown={(e) => {
                if (chairPart === "group") beginDrag(e, o.id);
                else { e.stopPropagation(); setSelectedId(o.id); setChairPart(key); }
              }} style={{
                position: "absolute", left: parts[key].x * CELL, top: parts[key].y * CELL,
                transform: `scale(${parts[key].scaleX}, ${parts[key].scaleY})`, transformOrigin: "top left",
                outline: selectedId === o.id && chairPart === key ? "3px solid #67B7FF" : "none",
              }}><PixelCanvas w={w} h={h} draw={draw} /></div>;
              return <div style={{ position: "relative", width: spr.w * CELL, height: spr.h * CELL }}>
                {part("sides", 96, 58, drawDiningChairSides)}
                {part("cushion", 30, 9, drawDiningFrontCushion)}
                {part("frame", 34, 38, drawDiningFrontFrame)}
              </div>;
            })() : <PixelCanvas w={spr.w} h={spr.h} draw={spr.draw} />}</div>;
          })}
          {/* game-crop guide: the game zooms in and only shows the bright middle band.
              Anything under the dimmed side strips gets cut off in the real game. */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 63, height: STAGE_H, background: "rgba(8,4,1,0.62)", borderRight: "2px dashed #FFD97A", pointerEvents: "none", zIndex: 900 }} />
          <div style={{ position: "absolute", top: 0, left: STAGE_W - 63, width: 63, height: STAGE_H, background: "rgba(8,4,1,0.62)", borderLeft: "2px dashed #FFD97A", pointerEvents: "none", zIndex: 900 }} />
          <div style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", background: "#241509", color: "#FFD97A", padding: "4px 10px", fontSize: 15, border: "2px solid #120A04", pointerEvents: "none", zIndex: 900 }}>keep items inside the bright area</div>
        </div>
        </div>
      </div>
      <aside style={{ ...panel, width: "auto", height: 260, padding: 14, overflow: "auto", flex: "0 0 260px", columnWidth: 270, columnGap: 24 }}>
        <h2 style={{ color: "#FFD97A", fontSize: 17, margin: "0 0 10px" }}>{selectedId ? room.objects.find((o) => o.id === selectedId)?.name : "Select an item"}</h2>
        {selected && <>
          <div style={{ color: "#C9B896", marginBottom: 12 }}>Drag the highlighted item to move it.</div>
          <label style={{ display: "block", marginBottom: 6 }}>Size: {Math.round(selected.scale * 100)}%</label>
          <input type="range" min="0.5" max="2" step="0.05" value={selected.scale} onChange={(e) => updateSelected({ scale: Number(e.target.value) })} style={{ width: "100%" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => updateSelected({ scale: Math.max(.5, selected.scale - .05) })} style={{ ...button, flex: 1 }}>Smaller</button>
            <button onClick={() => updateSelected({ scale: Math.min(2, selected.scale + .05) })} style={{ ...button, flex: 1 }}>Larger</button>
          </div>
          <div style={{ marginTop: 14, color: "#C9B896" }}>x: {Math.round(selected.x)} &nbsp; y: {Math.round(selected.y)}</div>
          {roomId === "dining" && selectedId === "dining_chairs" && (() => {
            const parts = selected.parts || makeLayout().dining.dining_chairs.parts;
            const p = parts[chairPart];
            const slider = (label, key, min, max, step) => <label style={{ display: "block", marginTop: 10 }}>{label}: {Number(p[key]).toFixed(key.startsWith("scale") ? 2 : 0)}
              <input type="range" min={min} max={max} step={step} value={p[key]} onChange={(e) => updateChairPart({ [key]: Number(e.target.value) })} style={{ width: "100%" }} />
            </label>;
            return <div style={{ marginTop: 18, borderTop: "2px solid #4A2E17", paddingTop: 12 }}>
              <div style={{ color: "#FFD97A", marginBottom: 8 }}>Chair parts</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {[['group','Move whole set'],['sides','Side pair'],['cushion','Middle cushion'],['frame','Middle frame']].map(([key,label]) => <button key={key} onClick={() => setChairPart(key)} style={{ ...button, color: chairPart === key ? "#67B7FF" : "#C9B896", padding: "6px" }}>{label}</button>)}
              </div>
              {chairPart !== "group" && <>
                {slider("Horizontal position", "x", -20, 80, 1)}
                {slider("Vertical position", "y", -10, 70, 1)}
                {slider("Width", "scaleX", .4, 1.8, .05)}
                {slider("Height", "scaleY", .4, 1.8, .05)}
              </>}
            </div>;
          })()}
        </>}
        <p style={{ color: "#C9B896", fontSize: 12, lineHeight: 1.5, marginTop: 20 }}>Your draft saves automatically on this computer. When you are happy, press <b>Copy layout</b> and paste it into our chat.</p>
        <textarea readOnly value={exportText} style={{ width: "100%", height: 180, marginTop: 8, background: "#100904", color: "#C9B896", border: "2px solid #4A2E17", fontSize: 10 }} />
      </aside>
    </div>
  </div>;
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
  /* mobile = portrait phone layout with its own UI chrome; desktop keeps the
     original single-scale stage. */
  const mobileQuery = "(max-width: 760px), (orientation: portrait)";
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(mobileQuery).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(mobileQuery);
    const on = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const [roomIndex, setRoomIndex] = useState(0);
  const room = isMobile ? ROOMS[ROOMS_ORDER[roomIndex]] : ROOMS.bedroom;

  // object state: { [`${roomId}:${id}`]: { packed, sold, soldFor, donated } }
  const [objState, setObjState] = useState(() =>
    Object.fromEntries(
      ROOMS_ORDER.flatMap((rid) =>
        ROOMS[rid].objects.map((o) => [sk(rid, o.id), { packed: false, sold: false, soldFor: 0, donated: false }])
      )
    )
  );
  const [selectedId, setSelectedId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [packingId, setPackingId] = useState(null); // mid pack animation
  const [sellingId, setSellingId] = useState(null); // mid sell animation
  const [donatingId, setDonatingId] = useState(null); // mid donate animation
  const [donateToast, setDonateToast] = useState(null); // { name } receipt
  const [invOpen, setInvOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false); // mobile object-detail bottom sheet
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

  /* mobile pan-strip state: live drag offset + measured viewport box */
  const viewRef = useRef(null);
  const [viewSize, setViewSize] = useState({ w: 0, h: 0 });
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ active: false, startX: 0, intent: false, id: null });
  const suppressClickRef = useRef(false);

  useEffect(() => {
    setSellFormOpen(false);
    setSellAmount("");
    if (!selectedId) setSheetOpen(false);
  }, [selectedId]);

  /* leaving a room closes anything room-specific */
  useEffect(() => {
    setSelectedId(null);
    setInvOpen(false);
  }, [roomIndex]);

  /* measure the mobile room-viewport so the stage can width/height-fit it */
  useEffect(() => {
    if (!isMobile) return;
    const measure = () => {
      const el = viewRef.current;
      if (el) setViewSize({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(measure)
      : null;
    if (viewRef.current) observer?.observe(viewRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isMobile]);

  /* decode the sell sound once via the Web Audio API — AudioBufferSourceNode
     schedules playback with near-zero, sample-accurate latency, unlike
     <audio>.play() which has real (and on mobile, sometimes large) startup
     lag. Decode goes through atob, NOT fetch(dataURI): the hosted preview
     page's CSP blocks fetch of data: URIs (connect-src), which silently
     killed the sound there. The context starts suspended on iOS until
     resumed by a user gesture, which primeSellAudio does on the first tap. */
  useEffect(() => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    audioCtxRef.current = ctx;
    try {
      const bin = atob(SELL_CHIME_SRC.split(",")[1]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      ctx.decodeAudioData(bytes.buffer)
        .then((decoded) => { sellBufferRef.current = decoded; })
        .catch(() => {});
    } catch {
      // sound stays off; the game itself is unaffected
    }
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
  const packedCount = removable.filter((o) => objState[sk(room.id, o.id)].packed).length;
  const soldCount = removable.filter((o) => objState[sk(room.id, o.id)].sold).length;
  const donatedCount = removable.filter((o) => objState[sk(room.id, o.id)].donated).length;
  const total = removable.length;
  const clearedCount = packedCount + soldCount + donatedCount;
  const done = total > 0 && clearedCount === total;
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

  /* snapshot the pre-action state for the undo stack (roomId included so
     undo works across rooms) */
  const undoEntry = (id, prev, coinsDelta, minutesDelta) => ({
    roomId: room.id, id,
    prevPacked: prev.packed, prevSold: prev.sold, prevSoldFor: prev.soldFor, prevDonated: prev.donated,
    coinsDelta, minutesDelta,
  });
  const busy = packingId || sellingId || donatingId;

  const packObject = useCallback((id) => {
    const k = sk(room.id, id);
    const obj = room.objects.find((o) => o.id === id);
    if (!obj || !obj.removable || objState[k].packed || objState[k].sold || objState[k].donated || busy) return;
    const prev = objState[k];
    setPackingId(id);
    setTimeout(() => {
      setObjState((s) => ({ ...s, [k]: { ...s[k], packed: true } }));
      setUndoStack((stack) => [...stack, undoEntry(id, prev, 0, 10)]);
      setPackingId(null);
      setSelectedId(null);
      setMinutes((m) => m + 10);
    }, 520);
  }, [room, objState, busy]);

  const sellObject = useCallback((id, amount) => {
    const k = sk(room.id, id);
    const obj = room.objects.find((o) => o.id === id);
    if (!obj || !obj.removable || objState[k].packed || objState[k].sold || objState[k].donated || busy) return;
    const prev = objState[k];
    const credit = Number.isFinite(amount) ? amount : (obj.value || 0);
    const spr = room.sprites[id];
    setSellingId(id);
    // burst effect lives on its own timer so the sell animation ending
    // doesn't cut it short
    setSellFx({ roomId: room.id, x: obj.x + (spr.w * CELL) / 2, y: obj.y + (spr.h * CELL) / 2, amount: credit });
    setTimeout(() => setSellFx(null), 1000);
    playSellSound();
    setTimeout(() => {
      setObjState((s) => ({ ...s, [k]: { ...s[k], sold: true, soldFor: credit } }));
      setCoins((c) => c + credit);
      setUndoStack((stack) => [...stack, undoEntry(id, prev, credit, 5)]);
      setSellingId(null);
      setSelectedId(null);
      setMinutes((m) => m + 5);
    }, 520);
  }, [room, objState, busy]);

  const donateObject = useCallback((id) => {
    const k = sk(room.id, id);
    const obj = room.objects.find((o) => o.id === id);
    if (!obj || !obj.removable || objState[k].packed || objState[k].sold || objState[k].donated || busy) return;
    const prev = objState[k];
    setDonatingId(id);
    setTimeout(() => {
      setObjState((s) => ({ ...s, [k]: { ...s[k], donated: true } }));
      setUndoStack((stack) => [...stack, undoEntry(id, prev, 0, 5)]);
      setDonatingId(null);
      setSelectedId(null);
      setMinutes((m) => m + 5);
      setDonateToast({ name: obj.name });
      setTimeout(() => setDonateToast((t) => (t && t.name === obj.name ? null : t)), 3500);
    }, 520);
  }, [room, objState, busy]);

  const unpackObject = (id) => {
    const k = sk(room.id, id);
    const prev = objState[k];
    setUndoStack((stack) => [...stack, undoEntry(id, prev, 0, 0)]);
    setObjState((s) => ({ ...s, [k]: { ...s[k], packed: false } }));
  };

  const unsellObject = (id) => {
    const k = sk(room.id, id);
    const prev = objState[k];
    setCoins((c) => c - (prev.soldFor || 0));
    setUndoStack((stack) => [...stack, undoEntry(id, prev, -(prev.soldFor || 0), 0)]);
    setObjState((s) => ({ ...s, [k]: { ...s[k], sold: false, soldFor: 0 } }));
  };

  const undonateObject = (id) => {
    const k = sk(room.id, id);
    const prev = objState[k];
    setUndoStack((stack) => [...stack, undoEntry(id, prev, 0, 0)]);
    setObjState((s) => ({ ...s, [k]: { ...s[k], donated: false } }));
  };

  const undoLast = () => {
    if (undoStack.length === 0) return;
    const { roomId, id, prevPacked, prevSold, prevSoldFor, prevDonated, coinsDelta, minutesDelta } = undoStack[undoStack.length - 1];
    const k = sk(roomId, id);
    setObjState((s) => ({ ...s, [k]: { ...s[k], packed: prevPacked, sold: prevSold, soldFor: prevSoldFor, donated: prevDonated } }));
    setCoins((c) => c - coinsDelta);
    setMinutes((m) => m - minutesDelta);
    setUndoStack((stack) => stack.slice(0, -1));
    setDonateToast(null);
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

  /* per-room visible objects (mid-animation items stay visible while shrinking) */
  const visibleObjectsFor = (rm) =>
    rm.objects
      .filter((o) => {
        const st = objState[sk(rm.id, o.id)];
        const animating = rm.id === room.id && (o.id === packingId || o.id === sellingId || o.id === donatingId);
        return (!st.packed && !st.sold && !st.donated) || animating;
      })
      .sort((a, b) => {
        const av = SAVED_LAYOUT[rm.id]?.[a.id] || a;
        const bv = SAVED_LAYOUT[rm.id]?.[b.id] || b;
        return a.z - b.z || (av.y + rm.sprites[a.id].h * CELL * (av.scale || 1)) - (bv.y + rm.sprites[b.id].h * CELL * (bv.scale || 1));
      });

  const selected = room.objects.find((o) => o.id === selectedId) || null;
  const packedList = removable.filter((o) => objState[sk(room.id, o.id)].packed);
  const soldList = removable.filter((o) => objState[sk(room.id, o.id)].sold);
  const donatedList = removable.filter((o) => objState[sk(room.id, o.id)].donated);
  const lastUndo = undoStack.length > 0 ? undoStack[undoStack.length - 1] : null;
  const lastUndoObj = lastUndo && ROOMS[lastUndo.roomId].objects.find((o) => o.id === lastUndo.id);

  const ui = {
    frame: { background: "#241509", border: "3px solid #120A04", boxShadow: "inset 0 0 0 2px #4A2E17, 0 3px 0 #000" },
    label: { fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "0.5px" },
  };

  const styleTag = (
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
      @keyframes sheetUp { from { transform: translateY(100%); } }
      @keyframes fadeIn { from { opacity: 0; } }
      .obj { cursor: pointer; transition: filter 120ms; }
      .obj:hover, .obj.sel { filter: drop-shadow(0 0 0 #FFD97A) drop-shadow(2px 0 0 #FFD97A) drop-shadow(-2px 0 0 #FFD97A) drop-shadow(0 2px 0 #FFD97A) drop-shadow(0 -2px 0 #FFD97A) brightness(1.06); }
      .obj.static { cursor: help; }
      .obj.packing { animation: packAway 0.5s ease-in forwards; }
      .panel { animation: popIn 140ms ease-out; }
      .coin { animation: coinBurst 0.8s cubic-bezier(0.3, 0.4, 0.7, 1) both; }
      .sellAmt { animation: sellAmt 0.9s ease-out both; }
      .sheet { animation: sheetUp 240ms cubic-bezier(0.22, 1, 0.36, 1); }
      button { font-family: 'Courier New', monospace; touch-action: manipulation; }
    `}</style>
  );

  /* the room picture itself — shell + sprites + sell FX + box stack, always
     drawn in 960-wide stage coordinates. Whatever scales it must scale it as
     ONE box: the sellFx overlay math relies on living inside this space.
     extCells > 180 continues the floor downward for tall portrait stages;
     draw fns are cached so canvases don't repaint on every drag frame. */
  const shellDrawCache = useRef({});
  const getShellDraw = (rm, extCells) => {
    if (extCells <= 180) return rm.drawShell;
    const key = `${rm.id}:${extCells}`;
    if (!shellDrawCache.current[key]) {
      const extend = { tile: extendFloorTile, bathtile: extendFloorBathTile }[rm.floorKind] || extendFloorPlank;
      shellDrawCache.current[key] = (ctx) => { rm.drawShell(ctx); extend(ctx, extCells); };
    }
    return shellDrawCache.current[key];
  };
  const getCeilingDraw = (rm, h) => {
    const key = `${rm.id}:ceil:${h}`;
    if (!shellDrawCache.current[key]) {
      const [shade, wall] = rm.ceilTones || [];
      shellDrawCache.current[key] = (ctx) => drawCeiling(ctx, h, shade, wall);
    }
    return shellDrawCache.current[key];
  };

  const roomArt = (rm, extCells = 180) => {
    const rmPacked = rm.objects.filter((o) => o.removable && objState[sk(rm.id, o.id)].packed).length;
    const rmBoxes = Math.min(4, Math.ceil(rmPacked / 4));
    return (
      <>
        {/* LAYER 0 — room shell */}
        <div style={{ position: "absolute", inset: 0 }} onClick={() => setSelectedId(null)}>
          <PixelCanvas w={240} h={extCells} draw={getShellDraw(rm, extCells)} redrawKey={extCells} />
        </div>

        {/* LAYER 1+ — object sprites */}
        {visibleObjectsFor(rm).map((o) => {
          const spr = rm.sprites[o.id];
          const placed = SAVED_LAYOUT[rm.id]?.[o.id] || o;
          const isCur = rm.id === room.id;
          const isSel = isCur && selectedId === o.id;
          const isBusy = isCur && (packingId === o.id || sellingId === o.id || donatingId === o.id);
          if (rm.id === "dining" && o.id === "dining_chairs" && placed.parts) {
            const p = placed.parts;
            const common = { position: "absolute", left: placed.x, top: placed.y, transform: `scale(${placed.scale || 1})`, transformOrigin: "top left" };
            const click = (e) => { e.stopPropagation(); setSelectedId(o.id); };
            return <div key={o.id}>
              <div className={`obj ${isSel ? "sel" : ""}`} onClick={click} style={{ ...common, zIndex: 30, width: spr.w * CELL, height: spr.h * CELL }}>
                <div style={{ position: "absolute", left: p.sides.x * CELL, top: p.sides.y * CELL, transform: `scale(${p.sides.scaleX},${p.sides.scaleY})`, transformOrigin: "top left" }}>
                  <PixelCanvas w={96} h={58} draw={drawDiningChairSides} />
                </div>
              </div>
              <div className={`obj ${isSel ? "sel" : ""}`} onClick={click} style={{ ...common, zIndex: 50, width: spr.w * CELL, height: spr.h * CELL }}>
                <div style={{ position: "absolute", left: p.cushion.x * CELL, top: p.cushion.y * CELL, transform: `scale(${p.cushion.scaleX},${p.cushion.scaleY})`, transformOrigin: "top left" }}>
                  <PixelCanvas w={30} h={9} draw={drawDiningFrontCushion} />
                </div>
                <div style={{ position: "absolute", left: p.frame.x * CELL, top: p.frame.y * CELL, transform: `scale(${p.frame.scaleX},${p.frame.scaleY})`, transformOrigin: "top left" }}>
                  <PixelCanvas w={34} h={38} draw={drawDiningFrontFrame} />
                </div>
              </div>
            </div>;
          }
          return (
            <div
              key={o.id}
              className={`obj ${isSel ? "sel" : ""} ${isBusy ? "packing" : ""} ${o.removable ? "" : "static"}`}
              style={{ position: "absolute", left: placed.x, top: placed.y, zIndex: o.z * 10, transform: `scale(${placed.scale || 1})`, transformOrigin: "top left" }}
              onClick={(e) => { e.stopPropagation(); setSelectedId(o.id); }}
              onMouseEnter={() => setHoverId(o.id)}
              onMouseLeave={() => setHoverId((h) => (h === o.id ? null : h))}
              title=""
            >
              <PixelCanvas w={spr.w} h={spr.h} draw={spr.draw} />
              {!isMobile && isCur && hoverId === o.id && !isBusy && (
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
        {sellFx && sellFx.roomId === rm.id && (
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
        {rmPacked > 0 && (
          <div style={{ position: "absolute", left: 70, top: 540, zIndex: 60, animation: "popIn 200ms ease-out" }}>
            <PixelCanvas w={40} h={40} draw={(ctx) => drawBoxes(ctx, rmBoxes)} redrawKey={rmBoxes} />
          </div>
        )}
      </>
    );
  };

  const donateToastEl = donateToast && (
    <div className="panel" style={{
      position: "fixed", left: "50%", bottom: isMobile ? "calc(env(safe-area-inset-bottom, 0px) + 92px)" : 70,
      transform: "translateX(-50%)", zIndex: 320, display: "flex", gap: 10, alignItems: "center",
      padding: "10px 14px", whiteSpace: "nowrap", ...ui.frame,
    }}>
      <span style={{ color: "#F2E4C0", fontSize: 14, ...ui.label }}>🎁 Donated: {donateToast.name}</span>
      <button
        onClick={undoLast}
        style={{ padding: "6px 12px", fontSize: 13, cursor: "pointer", color: "#FFD97A", background: "#3A2410", border: "2px solid #120A04", ...ui.label }}
      >
        Undo
      </button>
    </div>
  );

  /* ================= MOBILE — portrait phone layout =================
     UI chrome lives in real CSS (flex/dvh) and never scales with the room;
     only the room art inside the doorway frame gets the fit-scale. */
  if (isMobile) {
    const N = ROOMS_ORDER.length;
    // zoom the room art past width-fit so furniture reads big; the doorway
    // frame crops the outer sliver of the stage symmetrically
    const ZOOM = 1.15;
    const frameW = Math.max(200, viewSize.w - 16);
    const stageScale = viewSize.w > 0 ? Math.max(0.15, (frameW / STAGE_W) * ZOOM) : 0.4;
    const cropX = Math.max(0, Math.round((STAGE_W * stageScale - frameW) / 2));
    // continue the floor downward so the room fills the tall viewport
    const extCells = viewSize.h > 0
      ? Math.max(STAGE_H / CELL, Math.ceil((viewSize.h - 16) / stageScale / CELL))
      : STAGE_H / CELL;
    // enough ceiling that the wall/floor line lands near mid-screen
    const ceilCells = Math.max(0, Math.min(
      extCells - STAGE_H / CELL,
      Math.round((viewSize.h * 0.5) / (stageScale * CELL)) - 112
    ));
    const roomCells = extCells - ceilCells;
    const extPx = extCells * CELL;
    const stageH = Math.round(extPx * stageScale);
    const prevRoom = roomIndex > 0 ? ROOMS[ROOMS_ORDER[roomIndex - 1]] : null;
    const nextRoom = roomIndex < N - 1 ? ROOMS[ROOMS_ORDER[roomIndex + 1]] : null;

    const onPointerDown = (e) => {
      dragRef.current = { active: true, startX: e.clientX, intent: false, id: e.pointerId };
    };
    const onPointerMove = (e) => {
      const d = dragRef.current;
      if (!d.active || e.pointerId !== d.id) return;
      let dx = e.clientX - d.startX;
      if (!d.intent && Math.abs(dx) > 10) { d.intent = true; setDragging(true); }
      if (!d.intent) return;
      // ends of the apartment: no room beyond, so the strip only gives a little
      if ((roomIndex === 0 && dx > 0) || (roomIndex === N - 1 && dx < 0)) {
        dx = Math.max(-48, Math.min(48, dx / 4));
      }
      setDragX(dx);
    };
    const endDrag = (e) => {
      const d = dragRef.current;
      if (!d.active || (e && e.pointerId !== d.id)) return;
      d.active = false;
      if (d.intent) {
        suppressClickRef.current = true;
        setTimeout(() => { suppressClickRef.current = false; }, 80);
        const threshold = Math.max(60, viewSize.w * 0.18);
        setRoomIndex((i) => {
          if (dragX <= -threshold) return Math.min(N - 1, i + 1);
          if (dragX >= threshold) return Math.max(0, i - 1);
          return i;
        });
      }
      setDragging(false);
      setDragX(0);
    };

    const arrowBtn = (dir, target) => target && (
      <button
        onClick={() => setRoomIndex((i) => i + dir)}
        style={{
          position: "absolute", top: 12, [dir < 0 ? "left" : "right"]: 14, zIndex: 60,
          width: 54, minHeight: 48, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          color: "#FFD97A", cursor: "pointer", padding: "3px 2px",
          ...ui.frame, ...ui.label,
        }}
      >
        <span style={{ fontSize: 20, lineHeight: 1 }}>{dir < 0 ? "←" : "→"}</span>
        <span style={{ fontSize: 8, marginTop: 2, maxWidth: 48, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {target.name}
        </span>
      </button>
    );

    const actions = [
      { key: "check",  icon: "🔍", label: "Check",  disabled: !selected, onClick: () => setSheetOpen(true) },
      { key: "pack",   icon: "📦", label: "Pack",   disabled: !selected || !selected.removable || !!busy, onClick: () => packObject(selected.id) },
      { key: "sell",   icon: "💰", label: "Sell",   disabled: !selected || !selected.removable || !!busy, onClick: () => sellObject(selected.id) },
      { key: "donate", icon: "🎁", label: "Donate", disabled: !selected || !selected.removable || !!busy, onClick: () => donateObject(selected.id) },
      { key: "menu",   icon: "☰",  label: "Menu",   disabled: false, onClick: () => setInvOpen(true) },
    ];

    const invRow = (o, tagColor, tagText, btnText, btnFn) => (
      <div key={o.id} style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 8, padding: "10px 12px", background: "#1A0F06", border: "2px solid #4A2E17",
      }}>
        <div>
          <div style={{ color: "#F2E4C0", fontSize: 14, ...ui.label }}>{o.name}</div>
          <div style={{ color: tagColor, fontSize: 12, ...ui.label }}>{tagText}</div>
        </div>
        <button
          onClick={() => btnFn(o.id)}
          style={{ padding: "8px 12px", fontSize: 12, background: "#2E1D0E", color: "#C9B896", border: "2px solid #120A04", cursor: "pointer", ...ui.label }}
        >
          {btnText}
        </button>
      </div>
    );

    return (
      <div
        style={{
          position: "fixed", inset: 0, height: "100dvh", background: "#160D06", overflow: "hidden",
          userSelect: "none", WebkitUserSelect: "none", WebkitTapHighlightColor: "transparent",
          display: "flex", flexDirection: "column",
        }}
        onPointerDownCapture={primeSellAudio}
      >
        {styleTag}

        {/* ---- top HUD: native-sized chrome, never scales with the room ---- */}
        <div style={{ flex: "0 0 auto", display: "flex", alignItems: "stretch", gap: 8, padding: "calc(env(safe-area-inset-top, 0px) + 10px) 10px 8px", zIndex: 130 }}>
          <div style={{ padding: "7px 10px", flex: "1 1 auto", minWidth: 0, ...ui.frame }}>
            <div style={{ color: "#F2E4C0", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", ...ui.label }}>{clock.replace(/^\w+\.\s*/, "")}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{ color: "#D94A4A", fontSize: 11 }}>♥</span>
              <div style={{ flex: 1, maxWidth: 70, height: 9, background: "#120A04", border: "2px solid #4A2E17" }}>
                <div style={{ width: "100%", height: "100%", background: "linear-gradient(#8FD14F,#5EA032)" }} />
              </div>
            </div>
          </div>
          <div style={{ padding: "7px 12px", display: "flex", alignItems: "center", gap: 7, color: "#F2E4C0", fontSize: 15, ...ui.frame, ...ui.label }}>
            <span style={{ width: 12, height: 12, background: P.gold, border: "2px solid #8A5E14", borderRadius: "50%", display: "inline-block" }} />
            {coins}
          </div>
          <div style={{ padding: "6px 9px", textAlign: "right", ...ui.frame }}>
            <div style={{ color: "#F2E4C0", fontSize: 11, whiteSpace: "nowrap", ...ui.label }}>{room.name}</div>
            <div style={{ color: "#C9B896", fontSize: 10, marginTop: 2, whiteSpace: "nowrap", ...ui.label }}>
              {total > 0 ? `${clearedCount}/${total} cleared` : "soon"}
            </div>
          </div>
          <button
            onClick={undoLast}
            disabled={undoStack.length === 0}
            title={lastUndoObj ? `Undo: ${lastUndoObj.name}` : "Nothing to undo"}
            style={{
              padding: "7px 12px", fontSize: 17, minWidth: 52, cursor: undoStack.length ? "pointer" : "default",
              color: undoStack.length ? "#F2E4C0" : "#6B563B", ...ui.frame, ...ui.label,
            }}
          >
            ↺
          </button>
        </div>

        {/* ---- room viewport: pannable apartment strip ---- */}
        <div
          ref={viewRef}
          style={{ flex: 1, position: "relative", overflow: "hidden", touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={(e) => {
            if (suppressClickRef.current) { e.preventDefault(); e.stopPropagation(); }
          }}
        >
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: 0, width: `${N * 100}%`, display: "flex",
            transform: `translateX(calc(${-roomIndex * (100 / N)}% + ${dragX}px))`,
            transition: dragging ? "none" : "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}>
            {ROOMS_ORDER.map((rid, i) => (
              <div key={rid} style={{
                width: `${100 / N}%`, flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: i === roomIndex ? "auto" : "none",
              }}>
                {/* doorway frame: outward wood jambs painted OUTSIDE the room box,
                    so they can never cover furniture */}
                <div style={{
                  position: "relative", width: frameW, height: stageH, overflow: "hidden",
                  boxShadow: "0 0 0 6px #3E2413, 0 0 0 10px #120A04, 0 0 0 13px #4A2E17, 0 16px 34px rgba(0,0,0,0.65)",
                }}>
                  <div style={{ width: STAGE_W, height: extPx, transform: `translateX(${-cropX}px) scale(${stageScale})`, transformOrigin: "top left", position: "relative" }}>
                    {ceilCells > 0 && (
                      <div style={{ position: "absolute", top: 0, left: 0 }}>
                        <PixelCanvas w={240} h={ceilCells} draw={getCeilingDraw(ROOMS[rid], ceilCells)} redrawKey={ceilCells} />
                      </div>
                    )}
                    <div style={{ position: "absolute", top: ceilCells * CELL, left: 0, right: 0, bottom: 0 }}>
                      {roomArt(ROOMS[rid], roomCells)}
                    </div>
                  </div>
                  {/* looking-through-an-opening vignette: smooth fade at the very
                      edges only, pointer-transparent */}
                  <div style={{
                    position: "absolute", inset: 0, pointerEvents: "none",
                    background: "radial-gradient(ellipse at center, transparent 62%, rgba(10,5,2,0.38) 100%)",
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* nav arrows over the room's top corners (bare wall there) */}
          {arrowBtn(-1, prevRoom)}
          {arrowBtn(1, nextRoom)}

          {/* selected-object chip: tap for the detail sheet */}
          {selected && !sheetOpen && !invOpen && (
            <button
              className="panel"
              onClick={() => setSheetOpen(true)}
              style={{
                position: "absolute", left: "50%", bottom: 130, transform: "translateX(-50%)", zIndex: 80,
                padding: "9px 14px", color: "#FFD97A", fontSize: 13, whiteSpace: "nowrap", cursor: "pointer",
                maxWidth: "88%", overflow: "hidden", textOverflow: "ellipsis", ...ui.frame, ...ui.label,
              }}
            >
              {selected.name}{selected.removable && selected.value ? ` · $${selected.value}` : ""} — details
            </button>
          )}

          {/* room-cleared banner */}
          {done && (
            <div className="panel" style={{
              position: "absolute", left: "50%", top: "12%", transform: "translateX(-50%)",
              padding: "14px 22px", textAlign: "center", zIndex: 70, width: "max-content", maxWidth: "86%", ...ui.frame,
            }}>
              <div style={{ color: "#FFD97A", fontSize: 17, animation: "bounce 1.2s infinite", ...ui.label }}>
                ★ {room.name} cleared! ★
              </div>
              <div style={{ color: "#C9B896", fontSize: 12, marginTop: 6, ...ui.label }}>
                {nextRoom ? `Next up: ${nextRoom.name} →` : "That's the whole place."}
              </div>
            </div>
          )}
        </div>

        {/* ---- bottom action bar: touch-sized, real gameplay verbs ---- */}
        <div style={{
          flex: "0 0 auto", position: "relative", zIndex: 120, display: "flex", gap: 6,
          padding: "8px 8px calc(env(safe-area-inset-bottom, 0px) + 8px)",
          background: "#1D1006", borderTop: "3px solid #120A04", boxShadow: "inset 0 3px 0 #3A2410",
        }}>
          {actions.map((a) => (
            <button
              key={a.key}
              onClick={a.onClick}
              disabled={a.disabled}
              style={{
                flex: 1, minHeight: 56, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                background: a.disabled ? "#241509" : "#3A2410", color: a.disabled ? "#6B563B" : "#F2E4C0",
                border: "3px solid #120A04", boxShadow: a.disabled ? "none" : "inset 0 -3px 0 #1A0F06",
                fontSize: 12, cursor: a.disabled ? "default" : "pointer", padding: 0, ...ui.label,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>

        {/* ---- paper fan: 2 job apps + 1 admin card, visual only, tucked
             partly behind the action bar ---- */}
        <div style={{ position: "absolute", left: 8, bottom: "calc(env(safe-area-inset-bottom, 0px) + 34px)", zIndex: 110, pointerEvents: "none", width: 130, height: 100 }}>
          {[
            { rot: -14, dx: 0,  bg: "#E4B4A8", lo: "#C08578", label: "Job App", icon: "💼" },
            { rot: -4,  dx: 26, bg: "#E9BFB2", lo: "#C08578", label: "Job App", icon: "💼" },
            { rot: 7,   dx: 54, bg: "#B9CEDC", lo: "#8AA6B8", label: "Admin",   icon: "👤" },
          ].map((c, i) => (
            <div key={i} style={{
              position: "absolute", left: c.dx, bottom: 0, width: 58, height: 92, background: c.bg,
              border: "2px solid #120A04", boxShadow: "2px 2px 0 rgba(0,0,0,0.45)",
              transform: `rotate(${c.rot}deg)`, transformOrigin: "50% 90%", padding: "5px 5px 0", zIndex: i,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#3A2018", ...ui.label }}>{c.label}</div>
              <div style={{ marginTop: 3, fontSize: 11 }}>{c.icon}</div>
              {[0, 1, 2, 3].map((j) => (
                <div key={j} style={{ height: 3, marginTop: 4, background: c.lo, width: `${88 - j * 14}%` }} />
              ))}
            </div>
          ))}
        </div>

        {/* ---- Tasks: reserved spot, no system behind it yet ---- */}
        <div style={{ position: "absolute", right: 10, bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)", zIndex: 105 }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 7, padding: "9px 13px", ...ui.frame }}>
            <span style={{ fontSize: 14 }}>📋</span>
            <span style={{ color: "#F2E4C0", fontSize: 13, ...ui.label }}>Tasks</span>
            <span style={{ fontSize: 9, color: "#8A7350", ...ui.label }}>(soon)</span>
            <span style={{ position: "absolute", top: -5, right: -5, width: 12, height: 12, borderRadius: "50%", background: "#C43B34", border: "2px solid #120A04" }} />
          </div>
        </div>

        {donateToastEl}

        {/* ---- object detail bottom sheet ---- */}
        {sheetOpen && selected && !invOpen && (
          <>
            <div
              onClick={() => setSheetOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 190, animation: "fadeIn 160ms ease-out" }}
            />
            <div className="sheet" style={{
              position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 200, maxHeight: "72dvh", overflowY: "auto",
              background: "#241509", borderTop: "3px solid #120A04", boxShadow: "inset 0 3px 0 #4A2E17",
              padding: "10px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)",
            }}>
              <div style={{ width: 44, height: 5, background: "#4A2E17", borderRadius: 3, margin: "0 auto 10px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ color: "#FFD97A", fontSize: 18, ...ui.label }}>{selected.name}</div>
                <button
                  onClick={() => setSheetOpen(false)}
                  style={{ background: "none", border: "none", color: "#8A7350", fontSize: 20, cursor: "pointer", padding: "2px 6px", ...ui.label }}
                >
                  ✕
                </button>
              </div>
              <div style={{
                display: "inline-block", marginTop: 5, padding: "2px 10px", fontSize: 12, color: "#160D06",
                background: CATEGORY_COLORS[selected.category] || "#888", border: "2px solid #120A04", ...ui.label,
              }}>
                {selected.category}
              </div>
              <div style={{ color: "#DACBA6", fontSize: 15, lineHeight: 1.5, marginTop: 10, ...ui.label }}>
                {selected.check}
              </div>
              {selected.removable ? (
                sellFormOpen ? (
                  <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ color: "#DACBA6", fontSize: 15, ...ui.label }}>Sold for $</span>
                      <input
                        type="number"
                        autoFocus
                        value={sellAmount}
                        onChange={(e) => setSellAmount(e.target.value)}
                        style={{
                          flex: 1, minWidth: 0, padding: "10px 10px", fontSize: 16, background: "#160D06", color: "#F2E4C0",
                          border: "2px solid #4A2E17", ...ui.label,
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => sellObject(selected.id, parseFloat(sellAmount))}
                        disabled={!!busy || sellAmount === "" || Number.isNaN(parseFloat(sellAmount))}
                        style={{
                          flex: 1, minHeight: 50, fontSize: 15, cursor: "pointer",
                          background: "linear-gradient(#E0B65A,#B8862E)", color: "#2A1B08",
                          border: "3px solid #120A04", boxShadow: "inset 0 -3px 0 #8A5E14", fontWeight: 700, ...ui.label,
                        }}
                      >
                        Confirm sale
                      </button>
                      <button
                        onClick={() => setSellFormOpen(false)}
                        style={{
                          flex: 1, minHeight: 50, fontSize: 15, cursor: "pointer",
                          background: "#2E1D0E", color: "#C9B896", border: "3px solid #120A04", ...ui.label,
                        }}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button
                        onClick={() => packObject(selected.id)}
                        disabled={!!busy}
                        style={{
                          flex: 1, minHeight: 52, fontSize: 15, cursor: "pointer",
                          background: "linear-gradient(#8FD14F,#5EA032)", color: "#12260A",
                          border: "3px solid #120A04", boxShadow: "inset 0 -3px 0 #3E7020", fontWeight: 700, ...ui.label,
                        }}
                      >
                        📦 Pack it up
                      </button>
                      <button
                        onClick={() => sellObject(selected.id)}
                        disabled={!!busy}
                        style={{
                          flex: 1, minHeight: 52, fontSize: 15, cursor: "pointer",
                          background: "linear-gradient(#E0B65A,#B8862E)", color: "#2A1B08",
                          border: "3px solid #120A04", boxShadow: "inset 0 -3px 0 #8A5E14", fontWeight: 700, ...ui.label,
                        }}
                      >
                        Sell (${selected.value})
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => donateObject(selected.id)}
                        disabled={!!busy}
                        style={{
                          flex: 1, minHeight: 44, fontSize: 14, cursor: "pointer",
                          background: "#2E1D0E", color: "#C9B896", border: "3px solid #120A04", ...ui.label,
                        }}
                      >
                        🎁 Donate
                      </button>
                      <button
                        onClick={() => { setSellAmount(String(selected.value)); setSellFormOpen(true); }}
                        disabled={!!busy}
                        style={{
                          flex: 1.4, minHeight: 44, fontSize: 12, cursor: "pointer",
                          background: "#2E1D0E", color: "#C9B896", border: "2px solid #120A04", ...ui.label,
                        }}
                      >
                        ✎ Sold for a different price?
                      </button>
                    </div>
                  </>
                )
              ) : (
                <div style={{ marginTop: 14, padding: "12px 0", textAlign: "center", fontSize: 14, color: "#8A7350", border: "2px dashed #4A2E17", ...ui.label }}>
                  Stays with the room
                </div>
              )}
            </div>
          </>
        )}

        {/* ---- inventory bottom sheet ---- */}
        {invOpen && (
          <>
            <div
              onClick={() => setInvOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 190, animation: "fadeIn 160ms ease-out" }}
            />
            <div className="sheet" style={{
              position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 200, maxHeight: "72dvh", overflowY: "auto",
              background: "#241509", borderTop: "3px solid #120A04", boxShadow: "inset 0 3px 0 #4A2E17",
              padding: "10px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)",
            }}>
              <div style={{ width: 44, height: 5, background: "#4A2E17", borderRadius: 3, margin: "0 auto 10px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ color: "#FFD97A", fontSize: 17, ...ui.label }}>📦 Handled ({clearedCount}/{total})</div>
                <button
                  onClick={() => setInvOpen(false)}
                  style={{ background: "none", border: "none", color: "#8A7350", fontSize: 20, cursor: "pointer", padding: "2px 6px", ...ui.label }}
                >
                  ✕
                </button>
              </div>
              {packedList.length === 0 && soldList.length === 0 && donatedList.length === 0 && (
                <div style={{ color: "#8A7350", fontSize: 14, marginTop: 12, ...ui.label }}>
                  Nothing handled yet. Tap something in the room to start.
                </div>
              )}
              {packedList.map((o) => invRow(o, CATEGORY_COLORS[o.category], "packed", "unpack", unpackObject))}
              {soldList.map((o) => invRow(o, P.gold, `sold · +$${objState[sk(room.id, o.id)].soldFor}`, "buy back", unsellObject))}
              {donatedList.map((o) => invRow(o, "#B9CEDC", "donated", "take back", undonateObject))}
            </div>
          </>
        )}
      </div>
    );
  }

  /* ================= DESKTOP — original single-scale layout ================= */
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "#160D06", overflow: "hidden", userSelect: "none" }}
      onPointerDownCapture={primeSellAudio}
    >
      {styleTag}

      {/* stage wrapper */}
      <div ref={wrapRef} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "center", position: "relative", flex: "0 0 auto" }}>

          {roomArt(room)}

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
                Every last thing handled. On to the next room…
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
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => donateObject(selected.id)}
                    disabled={!!busy}
                    style={{
                      flex: 1, padding: "6px 0", fontSize: 12, cursor: "pointer",
                      background: "#2E1D0E", color: "#C9B896", border: "2px solid #120A04", ...ui.label,
                    }}
                  >
                    🎁 Donate
                  </button>
                  <button
                    onClick={() => { setSellAmount(String(selected.value)); setSellFormOpen(true); }}
                    disabled={!!busy}
                    style={{
                      flex: 1.6, padding: "6px 0", fontSize: 12, cursor: "pointer",
                      background: "#2E1D0E", color: "#C9B896", border: "2px solid #120A04", ...ui.label,
                    }}
                  >
                    ✎ Sold for a different price?
                  </button>
                </div>
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
                    <div style={{ color: P.gold, fontSize: 11, ...ui.label }}>sold · +${objState[sk(room.id, o.id)].soldFor}</div>
                  </div>
                  <button
                    onClick={() => unsellObject(o.id)}
                    style={{ padding: "3px 8px", fontSize: 11, background: "#2E1D0E", color: "#C9B896", border: "2px solid #120A04", cursor: "pointer", ...ui.label }}
                  >
                    buy back
                  </button>
                </div>
              ))}
              {donatedList.map((o) => (
                <div key={o.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginTop: 8, padding: "7px 10px", background: "#1A0F06", border: "2px solid #4A2E17",
                }}>
                  <div>
                    <div style={{ color: "#F2E4C0", fontSize: 13, ...ui.label }}>{o.name}</div>
                    <div style={{ color: "#B9CEDC", fontSize: 11, ...ui.label }}>donated</div>
                  </div>
                  <button
                    onClick={() => undonateObject(o.id)}
                    style={{ padding: "3px 8px", fontSize: 11, background: "#2E1D0E", color: "#C9B896", border: "2px solid #120A04", cursor: "pointer", ...ui.label }}
                  >
                    take back
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

      {donateToastEl}
    </div>
  );
}
