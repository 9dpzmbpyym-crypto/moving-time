import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import SAVED_LAYOUT from "./layout.json";
// Game audio lives in gameAudio.js (module singleton) so React StrictMode / HMR
// remounts don't kill the AudioContext or stop the music. Assets load from
// /assets/audio/ (public/) as real audio/mpeg — never Vite .mp3 imports in
// dev (those become JS modules and break decodeAudioData).
import {
  primeAudio,
  playSellSound,
  playPackSfx,
  playDonateSfx,
  playStampSfx,
  playRoomSwitchSfx,
  playContainerSfx,
  playCatSfx,
  kitchenTapZone,
  RADIO_STATIONS,
  getRadioState,
  playStation,
  toggleRadio,
  preloadRadioStations,
  ensureMusicPlaying,
  startPhoneIncomingRingtone,
  stopPhoneIncomingRingtone,
} from "./gameAudio.js";
// Stretchy the cat: PNG sprite sheet. Guitar hard case is canvas-drawn.
import CAT_SHEET from "./assets/Cat-Sheet.png";
// Next-layer screens (Menu/Desk/Health/etc.) + the task/urgency scaffold.
// The apartment stays the hub; these render as full-screen overlays above it.
import ScreenLayer, { RewardToast, IncomingPhoneCue } from "./Screens.jsx";
import { INITIAL_TASKS, isOpen as isTaskOpen, taskPressure, SAMPLE_JOBS, TASK_CATEGORIES } from "./tasks.js";
import { CONTENTS, hasContents, remainingCount, contentsFor, itemArtReady } from "./contents.js";
import {
  loadSave,
  writeSave,
  mergeFlagMap,
  mergeTasks,
  clampCoins,
  clampMinutes,
  clampRoomIndex,
} from "./save.js";
import { mergeSession, bumpSession } from "./session.js";
import {
  sanitizeAppointments,
  markMissed,
  getNudge,
  scrambleBookableHealthUrgencies,
} from "./receptionist.js";

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

export const CELL = 4; // 1 sprite pixel = 4 screen px
const STAGE_W = 960;
const STAGE_H = 720;

/** Real move target — drives the "days left" HUD chip. */
const MOVE_DATE = new Date(2026, 6, 31); // Jul 31, 2026 (local)

function daysUntilMove(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(MOVE_DATE.getFullYear(), MOVE_DATE.getMonth(), MOVE_DATE.getDate());
  return Math.max(0, Math.round((end - start) / 86400000));
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatRealTime(d) {
  let h = d.getHours();
  const m = d.getMinutes();
  const am = h < 12;
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")}${am ? "am" : "pm"}`;
}

function formatRealDate(d) {
  return `${WEEKDAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

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
  closet_door: { w: 28, h: 89, glowRegions: [[7, 12, 14, 28], [7, 52, 14, 28]], draw(ctx) {
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

  nightstand: { w: 28, h: 34, glowRegions: [[3, 7, 22, 8]], draw(ctx) {
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
  vanity: { w: 46, h: 66, glowRegions: [[2, 34, 20, 12], [22, 34, 22, 12]], draw(ctx) {
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
  dresser: { w: 48, h: 99, glowRegions: [[3, 45, 20, 9], [25, 45, 20, 9], [3, 56, 42, 10], [3, 68, 42, 10], [3, 80, 42, 9]], draw(ctx) {
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

  desk_hutch: { w: 150, h: 96, glowRegions: [[37, 54, 22, 10], [37, 66, 22, 10], [37, 78, 22, 10]], draw(ctx) {
    // hutch shelves (books live as separate packable objects on top)
    r(ctx, P.out, 2, 0, 60, 46);
    r(ctx, P.woodMid, 3, 1, 58, 44); r(ctx, P.woodHi, 3, 1, 58, 2);
    r(ctx, "#1E1206", 6, 5, 24, 16); r(ctx, "#1E1206", 34, 5, 24, 16);   // upper cavities
    r(ctx, "#1E1206", 6, 25, 52, 17);                                     // lower cavity
    // jars + bear, upper right
    r(ctx, P.glass, 37, 12, 5, 9); r(ctx, P.glassHi, 38, 13, 1, 7); r(ctx, P.woodDark, 37, 11, 5, 2);
    r(ctx, P.glass, 44, 14, 4, 7); r(ctx, P.glassHi, 45, 15, 1, 5);
    r(ctx, P.creamLo, 51, 12, 5, 6); r(ctx, P.cream, 52, 11, 3, 3);       // little bear
    // lower shelf: empty left (binders are a separate object); box stays
    r(ctx, P.cardLo, 52, 33, 5, 9);
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

  // upright books that used to be painted into the upper-left hutch shelf
  hutch_books_upper: { w: 22, h: 14, draw(ctx) {
    r(ctx, P.green, 0, 2, 3, 12); r(ctx, "#6B4A8A", 4, 1, 3, 13); r(ctx, P.red, 8, 3, 3, 11);
    r(ctx, "#28304A", 12, 2, 3, 12); r(ctx, "#B08A4A", 16, 4, 4, 10);
    r(ctx, P.creamLo, 1, 2, 1, 3); r(ctx, P.creamLo, 5, 1, 1, 3);
  }},

  // binders on the lower hutch shelf
  hutch_books_lower: { w: 26, h: 14, draw(ctx) {
    r(ctx, P.burgundy, 0, 0, 4, 13); r(ctx, P.teal, 5, 1, 4, 12); r(ctx, P.mustard, 10, 0, 4, 13);
    r(ctx, "#28304A", 15, 2, 4, 11); r(ctx, P.green, 20, 1, 4, 12);
    r(ctx, P.creamLo, 1, 1, 1, 4); r(ctx, P.creamLo, 11, 1, 1, 4);
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

  storage_bin: { w: 26, h: 18, glowRegions: [[2, 4, 22, 12]], draw(ctx) {
    r(ctx, P.out, 0, 0, 26, 6);                                            // lid
    r(ctx, P.teal, 1, 1, 24, 4); r(ctx, P.tealHi, 1, 1, 24, 1);
    r(ctx, P.out, 2, 6, 22, 12);                                           // tub
    r(ctx, "#8A857C", 3, 7, 20, 10); dith(ctx, "#6E6A61", 3, 9, 20, 8, 2, 0);
    r(ctx, "#B8AE96", 5, 9, 6, 4);                                         // label
  }},

  side_cabinet: { w: 48, h: 62, glowRegions: [[4, 25, 19, 27], [25, 25, 19, 27]], draw(ctx) {
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

  // Wi-Fi modem under the desk — small box + twin antennas
  wifi_router: { w: 18, h: 14, draw(ctx) {
    r(ctx, P.out, 1, 6, 16, 8);
    r(ctx, "#3A362F", 2, 7, 14, 6); r(ctx, "#4A463F", 2, 7, 14, 2);
    r(ctx, P.tealHi, 4, 9, 2, 2); r(ctx, P.mustard, 8, 9, 2, 2); r(ctx, P.greenHi, 12, 9, 2, 2);
    r(ctx, P.out, 4, 0, 2, 7); r(ctx, "#8A8272", 4, 1, 1, 5);
    r(ctx, P.out, 12, 1, 2, 6); r(ctx, "#8A8272", 12, 2, 1, 4);
    r(ctx, P.out, 3, 0, 4, 2); r(ctx, P.out, 11, 1, 4, 2);
  }},

  // Stretchy's round plush bed — flatter side view for the desk top
  cat_bed: { w: 30, h: 11, draw(ctx) {
    // soft contact shadow
    r(ctx, "#1E1206", 3, 9, 24, 2);
    // outer rim
    r(ctx, P.out, 1, 3, 28, 7);
    r(ctx, "#C4A882", 2, 4, 26, 5);
    r(ctx, "#A88862", 2, 7, 26, 2);
    // short back lip — just a peek above the rim
    r(ctx, P.out, 5, 1, 20, 3);
    r(ctx, "#D4B892", 6, 1, 18, 2);
    // inner pad
    r(ctx, P.out, 6, 5, 18, 3);
    r(ctx, "#E8D4B0", 7, 5, 16, 2);
    dith(ctx, "#D4C09A", 7, 6, 16, 1, 2, 0);
    r(ctx, P.creamLo, 8, 5, 4, 1);
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

  bath_vanity: { w: 66, h: 68, glowRegions: [[9, 25, 23, 34], [34, 25, 23, 34]], draw(ctx) {
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

  toiletries: { w: 30, h: 14, glowRegions: [[2, 2, 26, 10]], draw(ctx) {
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
  counter_sink: { w: 80, h: 44,
    glowRegions: [
      [3, 18, 17, 8], [22, 18, 17, 8], [41, 18, 17, 8], [60, 18, 17, 8],
      [3, 27, 17, 10], [22, 27, 17, 10], [41, 27, 17, 10], [60, 27, 17, 10],
    ], draw(ctx) {
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
  fridge: { w: 32, h: 60, glowRegions: [[6, 5, 16, 14], [6, 26, 16, 24]], draw(ctx) {
    r(ctx, P.out, 0, 0, 32, 60);
    r(ctx, P.white, 1, 1, 30, 58);
    r(ctx, "#FBF6E6", 1, 1, 30, 2);
    r(ctx, P.whiteLo, 1, 1, 3, 58);
    r(ctx, P.out, 1, 22, 30, 1);
    r(ctx, "#B8AE96", 25, 4, 2, 14);
    r(ctx, "#B8AE96", 25, 28, 2, 26);
    r(ctx, P.whiteLo, 1, 56, 30, 3);
  }},
  pantry: { w: 26, h: 72, glowRegions: [[6, 8, 14, 24], [6, 42, 14, 22]], draw(ctx) {
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
  // Stretchy food station — bowls on the floor (procedural, slight 3/4)
  cat_food_bowl: { w: 14, h: 8, draw(ctx) {
    r(ctx, P.out, 1, 3, 12, 5);
    r(ctx, "#3A6EA5", 2, 4, 10, 3);
    r(ctx, "#2A547C", 2, 6, 10, 1);
    r(ctx, P.out, 2, 1, 10, 4);
    r(ctx, "#4A82B8", 3, 2, 8, 2);
    r(ctx, "#5C94C4", 4, 2, 3, 1);
    r(ctx, P.mustardLo, 5, 3, 4, 1); // kibble hint
  }},
  cat_water_bowl: { w: 14, h: 8, draw(ctx) {
    r(ctx, P.out, 1, 3, 12, 5);
    r(ctx, P.tealLo, 2, 4, 10, 3);
    r(ctx, "#35584C", 2, 6, 10, 1);
    r(ctx, P.out, 2, 1, 10, 4);
    r(ctx, P.teal, 3, 2, 8, 2);
    r(ctx, P.tealHi, 4, 2, 3, 1);
    r(ctx, P.glassHi, 6, 3, 3, 1); // water glint
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
  { id: "cat_food_bowl", name: "Cat Food Bowl", category: "decor", value: 4, x: 150, y: 500, z: 2, removable: true,
    check: "Blue bowl, floor rights. Stretchy's breakfast station starts here." },
  { id: "cat_water_bowl", name: "Water Bowl", category: "decor", value: 3, x: 210, y: 505, z: 2, removable: true,
    check: "Teal twin to the food bowl. Always somehow emptier than you left it." },
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
  bar_cabinet: { w: 54, h: 50, glowRegions: [[4, 7, 21, 36], [29, 7, 21, 36]], draw(ctx) {
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

/* Diegetic radio — LCD blink when idle, EQ + tuner LED when playing.
   `t` is a rising tick (ms or frame); `on` mirrors getRadioState().on */
function drawRadio(ctx, { on = false, t = 0 } = {}) {
  const phase = (t / 1000) % 1; // 0..1 over ~1s
  // antenna — tip leans a hair when playing
  const tipX = on ? (Math.sin(t / 280) > 0 ? 23 : 21) : 22;
  r(ctx, P.out, 22, 1, 1, 4);
  r(ctx, P.goldHi, 22, 1, 1, 3);
  r(ctx, P.out, tipX, 0, 1, 2);
  r(ctx, P.goldHi, tipX, 0, 1, 1);
  // body
  r(ctx, P.out, 1, 5, 26, 12);
  r(ctx, "#3A342C", 2, 6, 24, 10);
  r(ctx, "#4A4338", 2, 6, 24, 2);
  r(ctx, "#2A2620", 2, 14, 24, 2);
  // speaker grille
  r(ctx, "#1C1916", 3, 8, 8, 6);
  for (let i = 0; i < 5; i++) r(ctx, "#0E0C0A", 4 + i, 8, 1, 6);
  // EQ bars on the grille — only while a station is playing
  if (on) {
    const bars = [
      2 + Math.floor((Math.sin(t / 90) + 1) * 2),
      2 + Math.floor((Math.sin(t / 70 + 1.2) + 1) * 2),
      2 + Math.floor((Math.sin(t / 110 + 2.4) + 1) * 2),
    ];
    bars.forEach((h, i) => {
      const bx = 5 + i * 2;
      const by = 13 - h;
      r(ctx, "#8FD14F", bx, by, 1, h);
      r(ctx, "#C8E8A0", bx, by, 1, 1);
    });
  }
  // station display — blinks when idle (invites a tap), steady when on
  r(ctx, P.out, 12, 8, 9, 5);
  const blinkOn = on || (Math.floor(t / 700) % 2 === 0);
  if (blinkOn) {
    r(ctx, on ? "#C8E8A0" : "#7A9A58", 13, 9, 7, 3);
    r(ctx, on ? "#8FD14F" : "#5D7C3B", 14, 10, on ? 4 : 2, 1);
  } else {
    r(ctx, "#2A3A1C", 13, 9, 7, 3); // dim "asleep" LCD
  }
  // tuner knob + power LED (LED lit only when playing)
  r(ctx, P.out, 22, 8, 4, 4);
  r(ctx, P.gold, 23, 9, 2, 2);
  r(ctx, P.goldHi, 23, 9, 1, 1);
  if (on) {
    const ledBright = phase < 0.5;
    r(ctx, ledBright ? "#8FD14F" : "#5D7C3B", 25, 7, 1, 1);
  } else {
    r(ctx, "#3A2A18", 25, 7, 1, 1);
  }
  // feet
  r(ctx, P.out, 3, 16, 3, 1);
  r(ctx, P.out, 22, 16, 3, 1);
}

const LIVING_SPRITES = {
  tv_hutch: { w: 56, h: 96, glowRegions: [[3, 61, 24, 31], [29, 61, 24, 31]], draw(ctx) {
    // plant — left side of the top so the radio has room on the right
    r(ctx, P.woodDark, 4, 6, 8, 4);
    r(ctx, P.green, 2, 0, 3, 7); r(ctx, P.greenHi, 5, 0, 2, 6);
    r(ctx, P.green, 8, 1, 3, 6); r(ctx, P.greenLo, 6, 3, 2, 4);
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
  table_decor: { w: 20, h: 14, draw(ctx) {
    // candle + pencil cup only — books are a separate packable object
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
  }},
  // coffee-table book stack (was baked into table_decor)
  coffee_table_books: { w: 18, h: 8, draw(ctx) {
    r(ctx, P.out, 0, 4, 17, 4);
    r(ctx, P.green, 1, 5, 15, 2);
    r(ctx, P.out, 0, 0, 17, 4);
    r(ctx, "#3C5C86", 1, 1, 15, 2);
    r(ctx, P.creamLo, 3, 1, 4, 1); r(ctx, P.creamLo, 3, 5, 5, 1);
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
  // small tabletop radio — sits on the TV hutch
  // draw(ctx) is the static/editor fallback; roomArt uses drawRadio(ctx, live)
  radio: { w: 28, h: 18, draw(ctx) { drawRadio(ctx, { on: false, t: 0 }); } },
  // hard case leaning by the amp — moving-story prop (tight procedural case)
  guitar_case: { w: 22, h: 48, draw(ctx) {
    // case body (slight lean via stepped silhouette)
    r(ctx, P.out, 4, 2, 14, 44);
    r(ctx, "#2A1A0C", 5, 3, 12, 42);
    r(ctx, "#3A2410", 5, 3, 12, 6);
    r(ctx, P.out, 3, 8, 16, 28);
    r(ctx, "#2A1A0C", 4, 9, 14, 26);
    // latch + handle
    r(ctx, P.gold, 9, 6, 4, 2);
    r(ctx, P.out, 8, 0, 6, 3); r(ctx, "#4A2E17", 9, 1, 4, 1);
    r(ctx, P.goldHi, 10, 20, 2, 2);
    r(ctx, P.goldHi, 10, 30, 2, 2);
    // floor contact shadow
    r(ctx, P.out, 2, 46, 18, 2);
  }},
  // small practice amp
  amplifier: { w: 22, h: 20, draw(ctx) {
    r(ctx, P.out, 0, 2, 22, 18);
    r(ctx, "#2A2622", 1, 3, 20, 16);
    r(ctx, "#3A362F", 1, 3, 20, 3);
    // speaker grille
    r(ctx, P.out, 4, 7, 14, 10);
    r(ctx, "#1C1916", 5, 8, 12, 8);
    dith(ctx, "#4A463F", 5, 8, 12, 8, 2, 0);
    dith(ctx, "#6A6660", 5, 8, 12, 8, 3, 1);
    // handle + knobs
    r(ctx, P.out, 7, 0, 8, 3); r(ctx, "#4A463F", 8, 1, 6, 1);
    r(ctx, P.gold, 3, 4, 2, 2); r(ctx, P.gold, 17, 4, 2, 2);
    r(ctx, P.creamLo, 10, 4, 2, 1);
  }},
};

const LIVING_OBJECTS = [
  { id: "tv_hutch", name: "TV Hutch", category: "furniture", value: 120, x: 72, y: 78, z: 3, removable: true,
    check: "Every remote from the last decade is lost somewhere inside this thing." },
  { id: "radio", name: "Apartment Radio", category: "decor", value: 18, x: 195, y: 12, z: 5, removable: false,
    check: "Cherry Blossom is the apartment's heartbeat. This little box is optional personality." },
  { id: "wall_art_pair", name: "Wall Art", category: "decor", value: 12, x: 376, y: 104, z: 2, removable: true,
    check: "The night scene came first; the little black-and-white one followed you home from a yard sale." },
  { id: "sofa", name: "Leather Loveseat", category: "furniture", value: 150, x: 328, y: 257, z: 3, removable: true,
    check: "This is the couch that remembers every nap you've ever taken on it. It's coming with you." },
  { id: "living_rug", name: "Striped Rug", category: "textiles", value: 20, x: 180, y: 500, z: 1, removable: true,
    check: "Vacuumed a thousand times, forgiven nothing. Roll it up carefully." },
  { id: "coffee_table", name: "Coffee Table", category: "furniture", value: 40, x: 272, y: 468, z: 4, removable: true,
    check: "Ring stains from a decade of mugs you swore you'd use a coaster for." },
  { id: "table_decor", name: "Table Clutter", category: "decor", value: 8, x: 412, y: 424, z: 5, removable: true,
    check: "A candle you're saving for a special occasion that never comes, and a cup of pencils that have seen things." },
  { id: "coffee_table_books", name: "Coffee Table Books", category: "decor", value: 14, x: 360, y: 430, z: 5, removable: true,
    check: "Architecture and forests. You'll finish them after the move. You will." },
  { id: "destijl_poster", name: "De Stijl Poster", category: "decor", value: 15, x: 640, y: 314, z: 3, removable: true,
    check: "Picked it up on that museum trip you half remember — mostly you remember the gift shop." },
  { id: "standing_mirror", name: "Standing Mirror", category: "furniture", value: 35, x: 752, y: 230, z: 2, removable: true,
    check: "Leans just enough to make you check your posture on the way out the door." },
  { id: "floor_lamp", name: "Torchiere Lamp", category: "lighting", value: 25, x: 836, y: 174, z: 3, removable: true,
    check: "Casts exactly one warm circle of light and no more. Very committed to its one job." },
  { id: "guitar_case", name: "Guitar Hard Case", category: "decor", value: 45, x: 700, y: 480, z: 3, removable: true,
    check: "Cased and ready. The amp already knows where this leans." },
  { id: "amplifier", name: "Amplifier", category: "decor", value: 80, x: 770, y: 500, z: 3, removable: true,
    check: "Heavier than it looks. The neighbors already know its name." },
];

/* box stack sprite (grows near the door as you pack).
   Geometry lives in constants so the pack-to-box fly animation can aim at the
   exact slot the incoming item lands in. Bigger boxes than before, and the pile
   grows one box per packed item (a widening pyramid) up to BOX_MAX. */
const BOX_ORIGIN = { x: 212, y: 452 };  // stage px: top-left of the pile canvas
                                         // centered in the foreground so the pile
                                         // clears fixtures (tub, etc.) in every room
const BOX_CW = 124, BOX_CH = 72;        // pile canvas size, cells
const BOX_W = 34, BOX_H = 26;           // one box, cells (~2x the old boxes)
// fill order: bottom row L→R, then middle row, then apex
const BOX_SLOTS = [[16, 42], [50, 42], [84, 42], [33, 23], [67, 23], [50, 4]];
const BOX_MAX = BOX_SLOTS.length;
const boxSlotCenter = (i) => {
  const [sx, sy] = BOX_SLOTS[Math.min(Math.max(i, 0), BOX_MAX - 1)];
  return { x: BOX_ORIGIN.x + (sx + BOX_W / 2) * CELL, y: BOX_ORIGIN.y + (sy + BOX_H / 2) * CELL };
};

function drawBoxes(ctx, count, openIdx = -1) {
  ctx.clearRect(0, 0, BOX_CW, BOX_CH);
  const midX = Math.floor(BOX_W / 2);
  const closed = (x, y) => {
    r(ctx, P.out, x, y, BOX_W, BOX_H);
    r(ctx, P.card, x + 1, y + 1, BOX_W - 2, BOX_H - 2);
    r(ctx, P.cardHi, x + 1, y + 1, BOX_W - 2, 4);                       // lit top
    dith(ctx, P.cardLo, x + midX, y + 5, BOX_W - midX - 1, BOX_H - 8, 2, 0); // right shade
    r(ctx, P.out, x + 1, y + midX - 1, BOX_W - 2, 1);                   // closed-flap seam
    r(ctx, P.out, x + 1, y + BOX_H - 4, BOX_W - 2, 1);                  // base shadow
    r(ctx, "#EBDDBE", x + midX - 2, y + 1, 5, BOX_H - 2);               // vertical tape
    r(ctx, "#D9C79E", x + 1, y + midX - 3, BOX_W - 2, 3);               // horizontal tape
  };
  const open = (x, y) => {
    const top = y + 6;                          // mouth line; flaps hinge here
    r(ctx, P.out, x, top, BOX_W, BOX_H - 6);    // body (top is open)
    r(ctx, P.card, x + 1, top + 1, BOX_W - 2, BOX_H - 8);
    dith(ctx, P.cardLo, x + midX, top + 2, BOX_W - midX - 1, BOX_H - 10, 2, 0);
    r(ctx, P.out, x + 1, y + BOX_H - 4, BOX_W - 2, 1);
    // dark interior mouth
    r(ctx, "#2A1A0C", x + 2, top, BOX_W - 4, 5);
    r(ctx, "#160D06", x + 2, top + 1, BOX_W - 4, 3);
    r(ctx, "#5A3A1E", x + 2, top, BOX_W - 4, 1);                        // lit front rim
    // hinged flaps: rooted at the two mouth corners, angled up and outward.
    // Flap length (along the diagonal) = half the box width, like a real lid.
    const flap = (hx, dir) => {
      const L = Math.round(BOX_W / 2), th = 5;
      for (let k = 0; k <= L; k++) {
        const cx = hx + dir * Math.round(k * 0.77);  // ~40° open
        const cy = top - Math.round(k * 0.64);
        r(ctx, P.out, cx, cy - th, 1, th + 1);
        r(ctx, P.card, cx, cy - th + 1, 1, th - 1);
        r(ctx, P.cardHi, cx, cy - th + 1, 1, 1); // lit outer face
        r(ctx, P.cardLo, cx, cy - 1, 1, 1);      // shaded inner face
      }
      r(ctx, P.out, hx, top - th, 1, th + 2);    // hinge seam at the corner
    };
    flap(x + 1, -1);              // left flap swings left-up
    flap(x + BOX_W - 2, +1);      // right flap swings right-up
  };
  for (let i = 0; i < Math.min(count, BOX_MAX); i++) closed(BOX_SLOTS[i][0], BOX_SLOTS[i][1]);
  if (openIdx >= 0 && openIdx < BOX_MAX) open(BOX_SLOTS[openIdx][0], BOX_SLOTS[openIdx][1]);
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
    { id: "hutch_books_upper", name: "Hutch Books",    category: "decor",     x: 98,  y: 170, z: 4, removable: true, value: 12,
      check: "The colorful upright row. Half of them are still bookmarks for chapters you meant to finish." },
    { id: "hutch_books_lower", name: "Hutch Binders",  category: "decor",     x: 168, y: 250, z: 4, removable: true, value: 10,
      check: "Binders of almost-organized life. The mustard one is taxes. You know this." },
    { id: "sewing_machine",  name: "Sewing Machine",   category: "furniture", x: 164, y: 116, z: 4, removable: true, value: 75,
      check: "It hemmed curtains once. Mostly it judges you from the shelf." },
    { id: "desk_lamp",       name: "Red Desk Lamp",    category: "lighting",  x: 92,  y: 262, z: 4, removable: true, value: 22,
      check: "Red, articulated, dramatic. It has supervised every all-nighter." },
    { id: "computer",        name: "Computer",         category: "furniture", x: 346, y: 264, z: 4, removable: true, value: 60,
      check: "Still runs. The fan sounds like it's trying its best." },
    { id: "desk_clutter",    name: "Desk Clutter",     category: "decor",     x: 470, y: 300, z: 5, removable: true, value: 10,
      check: "An open notebook, a dead pen, and a mug that never made it back to the kitchen." },
    { id: "office_chair",    name: "Office Chair",     category: "furniture", x: 430, y: 386, z: 4, removable: true, value: 35,
      check: "Molded to exactly one spine: yours." },
    { id: "storage_bin",     name: "Storage Tote",     category: "decor",     x: 752, y: 288, z: 4, removable: true, value: 6,
      check: "Labeled “MISC” — which was ambitious." },
    { id: "waste_bin",       name: "Wastebasket",      category: "decor",     x: 600, y: 296, z: 4, removable: true, value: 3,
      check: "Promoted to the desk for the move. Contains at least three drafts of the same letter." },
    { id: "side_cabinet",    name: "Side Cabinet",     category: "furniture", x: 664, y: 288, z: 3, removable: true, value: 30,
      check: "Short cabinet drafted into desk duty: books, one dramatic vase, and room for whatever's next." },
    { id: "wifi_router",     name: "Wi-Fi Router",     category: "decor",     x: 280, y: 378, z: 6, removable: true, value: 40,
      check: "Blinks under the desk like it knows the password and refuses to share." },
    { id: "cat_bed",         name: "Stretchy's Bed",   category: "decor",     x: 560, y: 280, z: 5, removable: true, value: 22,
      check: "Round, plush, and claimed — parked by the window where the sun hits. Stretchy will notice." },
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
export function PixelCanvas({ w, h, draw, redrawKey, style }) {
  const ref = useRef(null);
  // useLayoutEffect (not useEffect) so the canvas is painted BEFORE the browser
  // shows the frame — otherwise there's a blank frame where the <canvas> exists
  // but hasn't been drawn yet, which reads as sprites/shell "popping in" a beat
  // after a room switch.
  useLayoutEffect(() => {
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

/** Living-room radio — owns its own animation tick so PackItUp doesn't re-render. */
function RadioSprite() {
  const [tick, setTick] = useState(0);
  const [on, setOn] = useState(() => getRadioState().on);
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 120);
      setOn(getRadioState().on);
      ensureMusicPlaying();
    }, 120);
    return () => clearInterval(id);
  }, []);
  return (
    <PixelCanvas
      w={28}
      h={18}
      draw={(ctx) => drawRadio(ctx, { on, t: tick })}
      redrawKey={`${on ? 1 : 0}-${tick}`}
    />
  );
}

/* ============================================================
   STRETCHY — the cat companion
   The one image asset in the game. Sheet is 256x1632, 8 cols x
   51 rows of 32x32 frames, arranged by animation ROW (col 0..n-1
   per row), NOT continuous Aseprite frame number. Rendered as a
   background-image window scaled with image-rendering:pixelated
   to match the game's crisp low-res look. He lives in stage-px
   space inside roomArt() so he scales with the room on both
   desktop and mobile. Purely decorative: pointer-events:none, so
   he's never selectable/packable/etc.
   ============================================================ */
const CAT_CELL = 32;                    // source px per frame
const CAT_SHEET_W = 256, CAT_SHEET_H = 1632;
const CAT_PX = 7.2;                     // stage px per source px (display scale)
const CAT_FOOT_FRAC = 0.84;             // where his feet sit inside the 32px frame
const CAT_FACES_RIGHT = true;           // source art faces RIGHT by default

// animation table — { row, n(frames from col 0), fps, once? }
const CAT_ANIM = {
  walk:  { row: 4,  n: 8, fps: 11 },    // Walk_1
  idle:  { row: 2,  n: 8, fps: 6 },     // Idle_1 (tail flick / blink)
  idle2: { row: 3,  n: 8, fps: 6 },     // Idle_2 (ear twitch / head turn)
  sit:   { row: 0,  n: 8, fps: 5 },     // Sit_1
  rest:  { row: 10, n: 8, fps: 4 },     // Rest_2 (lie down)
  look:  { row: 25, n: 4, fps: 5 },     // Look_Around_Right_1
  run:   { row: 8,  n: 3, fps: 13 },    // Run_2
};

// frame of the look row where his head is turned fully toward you (eye contact)
const LOOK_FACE_FRAME = CAT_ANIM.look.n - 1;

// per-room safe floor spots (stage px, cat's feet). Kept in the deep
// foreground band BELOW where the rugs end (well under the horizon at px
// y 448) and spread wide across the room so he covers a big stretch of
// screen. Clear of the box pile (left), major furniture, and UI.
const CAT_SPOTS = {
  bedroom:  [{ x: 220, y: 745 }, { x: 380, y: 771 }, { x: 545, y: 759 }, { x: 695, y: 747 }, { x: 760, y: 737 }],
  bathroom: [{ x: 215, y: 741 }, { x: 380, y: 767 }, { x: 545, y: 755 }, { x: 690, y: 743 }, { x: 755, y: 733 }],
  office:   [{ x: 220, y: 743 }, { x: 390, y: 769 }, { x: 560, y: 757 }, { x: 700, y: 745 }, { x: 760, y: 735 }],
  dining:   [{ x: 215, y: 743 }, { x: 385, y: 769 }, { x: 560, y: 757 }, { x: 700, y: 745 }, { x: 760, y: 735 }],
  kitchen:  [{ x: 220, y: 743 }, { x: 390, y: 769 }, { x: 560, y: 757 }, { x: 700, y: 745 }, { x: 760, y: 735 }],
  living:   [{ x: 210, y: 745 }, { x: 385, y: 771 }, { x: 560, y: 759 }, { x: 705, y: 747 }, { x: 760, y: 737 }],
};

function Stretchy({ spots, enterSide, pressure = 0, onOpen, playCatSfx }) {
  const list = spots && spots.length ? spots : [{ x: STAGE_W / 2, y: 520 }];
  const startY = list[0].y;
  const fw = CAT_CELL * CAT_PX;          // display frame size (stage px)
  const HALF = fw / 2;
  const OFF = HALF + 24;                  // spawn fully off the side
  const CLAMP_MIN = HALF, CLAMP_MAX = STAGE_W - HALF; // keep frame on-stage
  /* Position lives in a ref and is written straight to the DOM every rAF tick;
     React state only holds what changes the rendered sprite (anim row, frame,
     facing), so the component re-renders a few times a second instead of 60. */
  const wrapRef = useRef(null);
  const posRef = useRef({ x: enterSide < 0 ? -OFF : STAGE_W + OFF, y: startY });
  const [view, setView] = useState(() => ({
    anim: "idle",
    frame: 0,
    facing: enterSide < 0 ? 1 : -1,
  }));

  useEffect(() => {
    const pick = (cur) => {
      let t = cur;
      for (let i = 0; i < 8 && t === cur; i++) t = list[(Math.random() * list.length) | 0];
      return t || list[0];
    };
    const s = {
      x: enterSide < 0 ? -OFF : STAGE_W + OFF,
      y: startY,
      facing: enterSide < 0 ? 1 : -1,
      anim: "idle",
      frame: 0,
      frameT: 0,
      mode: "delay",                                  // short pause, then trot in
      wait: 0.45 + Math.random() * 0.5,
      pauseAnim: "idle",
      target: pick(null),
      last: 0,
    };

    const advance = (dt) => {
      switch (s.mode) {
        case "delay":
          s.anim = "idle";
          s.wait -= dt;
          if (s.wait <= 0) { s.mode = "enter"; s.target = pick(null); }
          break;
        case "enter":
        case "walk": {
          s.anim = s.mode === "enter" ? "run" : "walk";
          const dx = s.target.x - s.x, dy = s.target.y - s.y;
          const dist = Math.hypot(dx, dy) || 1;
          const speed = s.mode === "enter" ? 120 : 46;
          if (Math.abs(dx) > 2) s.facing = dx > 0 ? 1 : -1;
          if (dist < 3) {
            // settle in for a while — long, deliberate stationary beats so he
            // isn't constantly on the move.
            const roll = Math.random();
            if (roll < 0.30) {
              // "look at you" beat: turn his head to meet your eyes, hold that
              // eye-contact frame, then reverse the turn back to forward before
              // walking off again.
              s.mode = "lookturn";
              s.anim = "look";
              s.frame = 0;
              s.frameT = 0;
            } else {
              s.mode = "pause";
              // other idle beats ~3x longer than before, like the lie-down.
              if (roll < 0.55) { s.pauseAnim = "sit"; s.wait = 9.0 + Math.random() * 6.0; }      // 9-15s sit
              else if (roll < 0.72) { s.pauseAnim = "idle"; s.wait = 9.0 + Math.random() * 4.5; }  // 9-13.5s idle
              else if (roll < 0.85) { s.pauseAnim = "idle2"; s.wait = 9.0 + Math.random() * 4.5; } // 9-13.5s idle
              else { s.pauseAnim = "rest"; s.wait = 12.0 + Math.random() * 6.0; }                  // 12-18s lie down
              s.frame = 0;
            }
          } else {
            s.x += (dx / dist) * speed * dt;
            s.y += (dy / dist) * speed * dt;
          }
          break;
        }
        case "pause":
          s.anim = s.pauseAnim;
          s.wait -= dt;
          // Soft ambient meow only — rare, happy clips, never stress/desperate.
          if (playCatSfx && Math.random() < 0.0015) playCatSfx("happy");
          if (s.wait <= 0) { s.mode = "walk"; s.target = pick(s.target); }
          break;
        case "lookturn": {
          // turn head to meet the viewer's eyes
          s.anim = "look";
          const spf = 1 / CAT_ANIM.look.fps;
          s.frameT += dt;
          while (s.frameT >= spf) { s.frameT -= spf; s.frame += 1; }
          if (s.frame >= LOOK_FACE_FRAME) { s.frame = LOOK_FACE_FRAME; s.mode = "lookhold"; s.wait = 2.2; }
          break;
        }
        case "lookhold":
          // hold eye contact, dead still, for a beat
          s.anim = "look";
          s.frame = LOOK_FACE_FRAME;
          s.wait -= dt;
          if (playCatSfx && Math.random() < 0.004) playCatSfx("happy");
          if (s.wait <= 0) { s.mode = "lookreturn"; s.frameT = 0; }
          break;
        case "lookreturn": {
          // reverse the turn — head back to forward — then walk off
          s.anim = "look";
          const spf = 1 / CAT_ANIM.look.fps;
          s.frameT += dt;
          while (s.frameT >= spf) { s.frameT -= spf; s.frame -= 1; }
          if (s.frame <= 0) { s.frame = 0; s.mode = "walk"; s.target = pick(s.target); }
          break;
        }
        default:
          break;
      }
    };

    let raf;
    const step = (t) => {
      if (!s.last) s.last = t;
      let dt = (t - s.last) / 1000;
      s.last = t;
      if (dt > 0.1) dt = 0.1;                          // clamp after tab-switch
      advance(dt);
      // safety net: once he's wandering (not making his off-screen entrance),
      // never let him leave the stage horizontally
      if (s.mode === "walk" || s.mode === "pause") {
        s.x = Math.max(CLAMP_MIN, Math.min(CLAMP_MAX, s.x));
        s.y = Math.min(STAGE_H + 60, s.y);             // allow him low on the floor near the bottom
      }
      // the look beat drives its own frame (turn in, hold, turn back), so leave
      // it alone; every other state uses the normal looping frame clock.
      if (s.mode !== "lookturn" && s.mode !== "lookhold" && s.mode !== "lookreturn") {
        const a = CAT_ANIM[s.anim] || CAT_ANIM.idle;
        s.frameT += dt;
        while (s.frameT >= 1 / a.fps) {
          s.frameT -= 1 / a.fps;
          s.frame = a.once ? Math.min(s.frame + 1, a.n - 1) : (s.frame + 1) % a.n;
        }
      }
      // position: straight to the DOM, no re-render
      posRef.current = { x: s.x, y: s.y };
      const el = wrapRef.current;
      if (el) {
        el.style.left = `${s.x - HALF}px`;
        el.style.top = `${s.y - fw * CAT_FOOT_FRAC}px`;
      }
      // sprite: re-render only when the visible frame actually changes
      setView((v) =>
        v.anim === s.anim && v.frame === s.frame && v.facing === s.facing
          ? v
          : { anim: s.anim, frame: s.frame, facing: s.facing }
      );
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const a = CAT_ANIM[view.anim] || CAT_ANIM.idle;
  const flip = view.facing * (CAT_FACES_RIGHT ? 1 : -1);
  const guilty = pressure >= 2;
  return (
    <div
      ref={wrapRef}
      aria-hidden={guilty ? undefined : "true"}
      onClick={guilty && onOpen ? (e) => { e.stopPropagation(); onOpen(); } : undefined}
      style={{
        position: "absolute",
        left: posRef.current.x - fw / 2,
        top: posRef.current.y - fw * CAT_FOOT_FRAC,
        width: fw,
        height: fw,
        pointerEvents: guilty && onOpen ? "auto" : "none",
        cursor: guilty && onOpen ? "pointer" : "default",
        zIndex: 90,
      }}
    >
      <div
        style={{
          width: fw, height: fw,
          backgroundImage: `url(${CAT_SHEET})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${CAT_SHEET_W * CAT_PX}px ${CAT_SHEET_H * CAT_PX}px`,
          backgroundPosition: `-${view.frame * CAT_CELL * CAT_PX}px -${a.row * CAT_CELL * CAT_PX}px`,
          imageRendering: "pixelated",
          transform: `scaleX(${flip})`,
          transformOrigin: "center",
          // guilt glow: a soft red halo around him when tasks are piling up
          filter: guilty ? "drop-shadow(0 0 6px rgba(196,59,52,0.8))" : "none",
        }}
      />
      {/* guilt bubble: a red "!" that floats above his head at high pressure,
          a little nudge to go handle things. */}
      {guilty && (
        <div className="redPulse guiltBubble" style={{
          position: "absolute", top: -fw * 0.08 + 70, left: `${50 + view.facing * 15}%`, transform: "translateX(-50%)",
          width: Math.max(11, fw * 0.15), height: Math.max(11, fw * 0.15),
          borderRadius: "50%", background: "#C43B34", border: "2px solid #120A04",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#F3EDDD", fontSize: Math.max(9, fw * 0.11),
          fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "0.5px",
          filter: "drop-shadow(0 0 6px rgba(196,59,52,0.8))",
        }}>!</div>
      )}
    </div>
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
export const COIN_BURSTS = [
  { tx: -52, ty: -50, d: 0 }, { tx: -14, ty: -60, d: 90 },
  { tx: 24,  ty: -56, d: 30 }, { tx: 56,  ty: -40, d: 120 },
];

/* ---------- haptics ----------
   Android (and most browsers) honor navigator.vibrate; iOS Safari ignores it
   completely. So we ALSO fire the iOS trick: toggling a hidden <input switch>
   (a Safari-only control) makes iOS play a light haptic tick — provided the
   user has System Haptics on. We fire both every time: each platform responds
   only to its own, and a device that supports neither simply feels nothing.
   Calls happen inside tap/pointer handlers, i.e. within a user gesture, which
   iOS requires for the tick. */
let _iosHapticLabel = null;
function iosHapticTick() {
  if (typeof document === "undefined" || !document.body) return;
  if (!_iosHapticLabel) {
    const label = document.createElement("label");
    label.setAttribute("aria-hidden", "true");
    label.style.cssText = "position:absolute;width:0;height:0;opacity:0;pointer-events:none;overflow:hidden";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", ""); // Safari-only; this is what carries the haptic
    label.appendChild(input);
    document.body.appendChild(label);
    _iosHapticLabel = label;
  }
  _iosHapticLabel.click(); // toggling fires the tick on iOS (either direction)
}
function haptic(pattern) {
  try { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern); } catch {}
  try { iosHapticTick(); } catch {}
}
const HAPTIC = { room: [10], pack: [20], sell: [15, 30, 15], donate: [12] };

/* ============================================================
   APP
   ============================================================ */
export default function PackItUp({ glowMode = "split" }) {
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

  // Progress restore — one localStorage key (`pack-it-up-save`). Audio volumes
  // stay in gameAudio's own key. Defaults always built fresh so new furniture
  // / contents / tasks appear even when an older save is present.
  const bootSave = useMemo(() => loadSave(), []);
  const defaultObjState = useMemo(
    () =>
      Object.fromEntries(
        ROOMS_ORDER.flatMap((rid) =>
          ROOMS[rid].objects.map((o) => [
            sk(rid, o.id),
            { packed: false, sold: false, soldFor: 0, donated: false },
          ])
        )
      ),
    []
  );
  const defaultContentsState = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(CONTENTS).flatMap(([storageKey, items]) =>
          items.map((it) => [
            `${storageKey}:${it.id}`,
            { packed: false, sold: false, soldFor: 0, donated: false },
          ])
        )
      ),
    []
  );

  const [roomIndex, setRoomIndex] = useState(() =>
    clampRoomIndex(bootSave?.roomIndex, ROOMS_ORDER.length)
  );
  const room = isMobile ? ROOMS[ROOMS_ORDER[roomIndex]] : ROOMS.bedroom;

  /* Stretchy re-mounts per room and trots in from the side the player came
     from (moved to a higher-index room → he follows in from the left). */
  const prevRoomIdxRef = useRef(roomIndex);
  const catEnterSide = roomIndex >= prevRoomIdxRef.current ? -1 : 1;
  useEffect(() => { prevRoomIdxRef.current = roomIndex; }, [roomIndex]);

  // object state: { [`${roomId}:${id}`]: { packed, sold, soldFor, donated } }
  const [objState, setObjState] = useState(() =>
    mergeFlagMap(defaultObjState, bootSave?.objState)
  );
  // contents state: per-storage-item flags, keyed `${roomId}:${storageId}:${itemId}`.
  // Mirrors objState's shape so the same undo/handled patterns reuse cleanly.
  const [contentsState, setContentsState] = useState(() =>
    mergeFlagMap(defaultContentsState, bootSave?.contentsState)
  );
  // a storage item is mid pack/sell/donate animation (drives fly-to-box)
  const [packingContentKey, setPackingContentKey] = useState(null);
  // tracks which stored item is animating INSIDE the storage overlay, plus the
  // kind of animation ("pack" | "sell" | "donate"). Drives the in-overlay shrink
  // and the local coin burst so the storage screen never has to close-then-fly
  // back to the apartment to show feedback.
  const [contentAnim, setContentAnim] = useState(null); // { key, kind }
  const [storageSellFx, setStorageSellFx] = useState(null); // { itemId, amount }
  // bumped once when PNG item art finishes loading so inline-panel thumbnails repaint
  const [itemArtRedrawKey, setItemArtRedrawKey] = useState(0);
  useEffect(() => {
    let mounted = true;
    itemArtReady.then(() => { if (mounted) setItemArtRedrawKey((k) => k + 1); });
    return () => { mounted = false; };
  }, []);
  // content pack-to-box fly: when a content item is packed, we close the storage
  // overlay and spawn a small sprite flying from the storage object's center to
  // the box pile's mouth, reusing the furniture packToBox keyframe. Holds the
  // item's sprite + computed CSS vars for the fly; null when idle.
  const [contentFlyFx, setContentFlyFx] = useState(null); // { spr, x, y, pdx, pdy, pscale }
  // which content item is selected inside the inline storage panel — drives
  // the Pack/Sell/Donate action bar instead of per-card tiny emoji buttons.
  const [selectedContentId, setSelectedContentId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [packingId, setPackingId] = useState(null); // mid pack animation
  const [sellingId, setSellingId] = useState(null); // mid sell animation
  const [donatingId, setDonatingId] = useState(null); // mid donate animation
  const [donateToast, setDonateToast] = useState(null); // { name } receipt
  const [invOpen, setInvOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false); // mobile object-detail bottom sheet
  /* next-layer navigation: apartment is the hub, everything else is an
     overlay screen (menu/desk/health/inventory/log/stretchy/settings) */
  const [screen, setScreen] = useState("apartment");
  // which storage object's contents are open in the StorageScreen overlay.
  // Set when a storage object (cabinet/drawer/closet) is tapped.
  const [storageId, setStorageId] = useState(null);
  // for kitchen counter: which half was opened (upper drawer vs lower cabinet)
  // so the matching close sound plays when the panel shuts.
  const [storageZone, setStorageZone] = useState(null);
  // screen-space rect of the tapped furniture (from getBoundingClientRect) so the
  // mobile panel can sit above it without inheriting the room's zoom transform.
  const [storageAnchor, setStorageAnchor] = useState(null); // { left, top, right, bottom, width, height }
  // living-room radio panel (diegetic station picker — not packable storage)
  const [radioOpen, setRadioOpen] = useState(null); // null | { left, top, right, bottom, width, height }
  const [radioUi, setRadioUi] = useState(() => getRadioState());
  const refreshRadioUi = useCallback(() => setRadioUi(getRadioState()), []);
  /* task/urgency scaffold — sample data only, drives the paper fan + badges */
  const [tasks, setTasks] = useState(() =>
    scrambleBookableHealthUrgencies(mergeTasks(INITIAL_TASKS, bootSave?.tasks))
  );
  const [minutes, setMinutes] = useState(() => clampMinutes(bootSave?.minutes ?? 0)); // game time advances as you pack/sell
  const [coins, setCoins] = useState(() =>
    bootSave && typeof bootSave.coins === "number" ? clampCoins(bootSave.coins) : 125
  );
  const [session, setSession] = useState(() => mergeSession(bootSave?.session));
  const [appointments, setAppointments] = useState(() =>
    markMissed(sanitizeAppointments(bootSave?.appointments))
  );
  const [phoneNudge, setPhoneNudge] = useState(null);
  const phoneNudgeShownRef = useRef(false);
  useEffect(() => {
    const n = getNudge(appointments, tasks);
    // Soft desk nudge for remind/overdue; cold open is available anytime via landline
    if (n && (n.kind === "remind" || n.kind === "overdue")) {
      if (phoneNudgeShownRef.current) return;
      phoneNudgeShownRef.current = true;
      setPhoneNudge(n);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — boot once

  // Shirley calling: bell ringtone as normal UI SFX (no music duck) while nudge is live.
  useEffect(() => {
    if (!phoneNudge) {
      stopPhoneIncomingRingtone();
      return;
    }
    if (phoneNudge.kind !== "remind" && phoneNudge.kind !== "overdue") return;
    startPhoneIncomingRingtone();
    return () => stopPhoneIncomingRingtone();
  }, [phoneNudge]);
  const [rewardToast, setRewardToast] = useState(null);
  const [scale, setScale] = useState(1);
  const [sellFormOpen, setSellFormOpen] = useState(false);
  const [sellAmount, setSellAmount] = useState("");
  const [undoStack, setUndoStack] = useState([]); // undo history, most recent last
  const [sellFx, setSellFx] = useState(null); // { x, y, amount } coin-burst overlay
  const wrapRef = useRef(null);

  /* Debounced persist — pack/sell/donate/tasks/room. Flush on hide so a
     phone lock mid-pack still keeps progress. */
  const savePayloadRef = useRef(null);
  savePayloadRef.current = { objState, contentsState, coins, minutes, tasks, roomIndex, session, appointments };
  useEffect(() => {
    const id = setTimeout(() => writeSave(savePayloadRef.current), 250);
    return () => clearTimeout(id);
  }, [objState, contentsState, coins, minutes, tasks, roomIndex, session]);
  useEffect(() => {
    const flush = () => writeSave(savePayloadRef.current);
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
      flush(); // unmount / HMR — don't lose the last pack
    };
  }, []);

  /* mobile pan-strip state: live drag offset + measured viewport box */
  const viewRef = useRef(null);
  const [viewSize, setViewSize] = useState({ w: 0, h: 0 });
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ active: false, startX: 0, intent: false, id: null });
  const animRef = useRef(null); // in-flight rAF pan animation: { raf, commit }
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
    setRadioOpen(null);
  }, [roomIndex]);

  /* keep radio panel ON/OFF in sync (cheap — only while panel open) */
  useEffect(() => {
    if (!radioOpen) return;
    const id = setInterval(() => setRadioUi(getRadioState()), 250);
    return () => clearInterval(id);
  }, [radioOpen]);

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

  /* Audio is owned by gameAudio.js (singleton). First tap primes the
     AudioContext + starts Cherry Blossom; SFX fire only from action handlers. */
  const primeSellAudio = () => { primeAudio(); ensureMusicPlaying(); };
  const closeStorage = (id = storageId) => {
    if (id) playContainerSfx(id, "close", storageZone);
    setStorageId(null);
    setStorageZone(null);
    setStorageAnchor(null);
    setSelectedContentId(null);
  };
  const closeRadio = () => setRadioOpen(null);

  /* Timeout registry — every animation/toast timer goes through schedule() so
     they can all be cancelled if the component unmounts mid-flight (otherwise
     the callbacks would set state on an unmounted tree). */
  const timeoutsRef = useRef(new Set());
  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timeoutsRef.current.delete(id);
      fn();
    }, ms);
    timeoutsRef.current.add(id);
    return id;
  }, []);
  useEffect(() => () => {
    for (const id of timeoutsRef.current) clearTimeout(id);
    timeoutsRef.current.clear();
  }, []);

  const removable = room.objects.filter((o) => o.removable);
  const packedCount = removable.filter((o) => objState[sk(room.id, o.id)].packed).length;
  const soldCount = removable.filter((o) => objState[sk(room.id, o.id)].sold).length;
  const donatedCount = removable.filter((o) => objState[sk(room.id, o.id)].donated).length;
  const total = removable.length;
  const clearedCount = packedCount + soldCount + donatedCount;
  const done = total > 0 && clearedCount === total;
  const boxCount = Math.min(4, Math.ceil(packedCount / 4));

  /* Global packing progress (hub mockup chips). daysLeft comes from real clock below. */
  const { globalPacked, globalTotal } = useMemo(() => {
    let packed = 0;
    let tot = 0;
    for (const rid of ROOMS_ORDER) {
      for (const o of ROOMS[rid].objects) {
        if (!o.removable) continue;
        tot += 1;
        if (objState[sk(rid, o.id)]?.packed) packed += 1;
      }
    }
    return { globalPacked: packed, globalTotal: tot };
  }, [objState]);

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
  const busy = packingId || sellingId || donatingId || packingContentKey;

  const showReward = useCallback((label) => {
    if (!label) return;
    setRewardToast(label);
    schedule(() => setRewardToast(null), 1800);
  }, [schedule]);

  const onSessionBump = useCallback((key, amount = 1, rewardLabel, extra) => {
    setSession((prev) => {
      const { session: next, justCompletedGoal, rewardLabel: auto } = bumpSession(prev, key, amount, rewardLabel);
      if (extra?.calmedZone) {
        next.calmedZones = { ...next.calmedZones, [extra.calmedZone]: true };
      }
      const toast = rewardLabel || (justCompletedGoal ? auto : null);
      if (toast) schedule(() => showReward(toast), 0);
      return next;
    });
  }, [schedule, showReward]);

  const packObject = useCallback((id) => {
    const k = sk(room.id, id);
    const obj = room.objects.find((o) => o.id === id);
    if (!obj || !obj.removable || objState[k].packed || objState[k].sold || objState[k].donated || busy) return;
    const prev = objState[k];
    haptic(HAPTIC.pack);
    playPackSfx();
    setPackingId(id);
    schedule(() => {
      setObjState((s) => ({ ...s, [k]: { ...s[k], packed: true } }));
      setUndoStack((stack) => [...stack, undoEntry(id, prev, 0, 10)]);
      setPackingId(null);
      setSelectedId(null);
      setMinutes((m) => m + 10);
      onSessionBump("cleared", 1, "Cleared +1");
    }, 520);
  }, [room, objState, busy, schedule, onSessionBump]);

  const sellObject = useCallback((id, amount) => {
    const k = sk(room.id, id);
    const obj = room.objects.find((o) => o.id === id);
    if (!obj || !obj.removable || objState[k].packed || objState[k].sold || objState[k].donated || busy) return;
    const prev = objState[k];
    // negative custom prices are user error — never debit the player on a sale
    const credit = Math.max(0, Number.isFinite(amount) ? amount : (obj.value || 0));
    const spr = room.sprites[id];
    setSellingId(id);
    // burst effect lives on its own timer so the sell animation ending
    // doesn't cut it short
    setSellFx({ roomId: room.id, x: obj.x + (spr.w * CELL) / 2, y: obj.y + (spr.h * CELL) / 2, amount: credit });
    schedule(() => setSellFx(null), 1000);
    haptic(HAPTIC.sell);
    playSellSound();
    schedule(() => {
      setObjState((s) => ({ ...s, [k]: { ...s[k], sold: true, soldFor: credit } }));
      setCoins((c) => c + credit);
      setUndoStack((stack) => [...stack, undoEntry(id, prev, credit, 5)]);
      setSellingId(null);
      setSelectedId(null);
      setMinutes((m) => m + 5);
      onSessionBump("cleared", 1, "Cleared +1");
    }, 520);
  }, [room, objState, busy, schedule, onSessionBump]);

  const donateObject = useCallback((id) => {
    const k = sk(room.id, id);
    const obj = room.objects.find((o) => o.id === id);
    if (!obj || !obj.removable || objState[k].packed || objState[k].sold || objState[k].donated || busy) return;
    const prev = objState[k];
    haptic(HAPTIC.donate);
    playDonateSfx();
    setDonatingId(id);
    schedule(() => {
      setObjState((s) => ({ ...s, [k]: { ...s[k], donated: true } }));
      setUndoStack((stack) => [...stack, undoEntry(id, prev, 0, 5)]);
      setDonatingId(null);
      setSelectedId(null);
      setMinutes((m) => m + 5);
      setDonateToast({ name: obj.name });
      schedule(() => setDonateToast((t) => (t && t.name === obj.name ? null : t)), 3500);
      onSessionBump("cleared", 1, "Cleared +1");
    }, 520);
  }, [room, objState, busy, schedule, onSessionBump]);

  /* ---- content actions: pack/sell/donate items from inside storage ----
     All three close the storage overlay first (close-then-fly), then flip
     contentsState. The box pile grows as the receiving cue; the cabinet's
     storage badge count drops. Undo restores via the storageId marker. */
  const undoContentEntry = (storageId, itemId, prev, coinsDelta, minutesDelta) => ({
    roomId: room.id, id: itemId, storageId,
    prevPacked: prev.packed, prevSold: prev.sold, prevSoldFor: prev.soldFor, prevDonated: prev.donated,
    coinsDelta, minutesDelta,
  });

  const packContent = useCallback((storageId, itemId) => {
    const k = `${room.id}:${storageId}:${itemId}`;
    const prev = contentsState[k];
    if (!prev || prev.packed || prev.sold || prev.donated || busy) return;
    haptic(HAPTIC.pack);
    playPackSfx();
    // Flip packed immediately so the room box pile stays visible after the
    // fly ends (visibility is driven by packed counts, not only packingHere).
    setContentsState((s) => ({ ...s, [k]: { ...s[k], packed: true } }));
    // Close back to the apartment so the box stack is visible, then fly the
    // item sprite from the storage object to the box pile's mouth — same
    // packToBox keyframe the furniture uses.
    const items = CONTENTS[`${room.id}:${storageId}`] || [];
    const it = items.find((x) => x.id === itemId);
    const spr = it?.spr;
    const storageObj = room.objects.find((o) => o.id === storageId);
    const storageSpr = room.sprites[storageId];
    if (spr && storageObj && storageSpr) {
      // Fly originates from the storage sprite's TOP (where the inline panel
      // sits), so visually the item flies out of the open UI and into the box.
      const saved = SAVED_LAYOUT[room.id]?.[storageId] || {};
      const placed = { ...storageObj, ...saved };
      const sScale = saved.scale ?? storageObj.scale ?? 1;
      const sw = (storageSpr.w || 32) * CELL * sScale;
      // Keep the departing item clearly readable while normalizing sprites with
      // very different source dimensions to one visual size.
      const targetPx = 40;
      const pscale = Math.min(targetPx / ((spr.w || 16) * CELL), targetPx / ((spr.h || 16) * CELL));
      const iw = (spr.w || 16) * CELL * pscale;
      const ih = (spr.h || 16) * CELL * pscale;
      // start centered horizontally over the storage sprite, at its top edge
      const ox = placed.x + (sw - iw) / 2;
      const oy = placed.y - Math.max(8, ih * 0.35);
      // target: receiving box slot. Count already includes this item (optimistic
      // pack above), so the open mouth is at settled-1.
      const rmPacked = room.objects.filter(
        (o) => o.removable && objState[sk(room.id, o.id)].packed
      ).length;
      const contentPacked = Object.entries(contentsState)
        .filter(([key, st]) => key.startsWith(`${room.id}:`) && st.packed)
        .length + 1; // +1 = this item (state update not flushed yet)
      const totalPacked = rmPacked + contentPacked;
      const boxIdx = Math.min(Math.max(0, totalPacked - 1), BOX_MAX - 1);
      const boxTarget = boxSlotCenter(boxIdx);
      setContentFlyFx({
        spr,
        x: ox, y: oy,
        pdx: boxTarget.x - (ox + iw / 2),
        pdy: boxTarget.y - (oy + ih / 2),
        pscale,
      });
    }
    // Close the panel immediately so the apartment + pack-to-box fly are visible
    // (mobile portal was covering the whole screen and swallowing the animation).
    setStorageId(null);
    setStorageZone(null);
    setStorageAnchor(null);
    setSelectedContentId(null);
    setScreen("apartment");
    setPackingContentKey(k);
    setContentAnim({ key: k, kind: "pack" });
    schedule(() => {
      setUndoStack((stack) => [...stack, undoContentEntry(storageId, itemId, prev, 0, 10)]);
      setPackingContentKey(null);
      setContentAnim(null);
      setContentFlyFx(null);
      setMinutes((m) => m + 10);
      onSessionBump("cleared", 1, "Cleared +1");
    }, 520);
  }, [room, objState, contentsState, busy, schedule, onSessionBump]);

  const sellContent = useCallback((storageId, itemId) => {
    const k = `${room.id}:${storageId}:${itemId}`;
    const prev = contentsState[k];
    if (!prev || prev.packed || prev.sold || prev.donated || busy) return;
    const items = CONTENTS[`${room.id}:${storageId}`] || [];
    const it = items.find((x) => x.id === itemId);
    const credit = it?.value || 0;
    // Stay in the storage overlay; play the coin burst + floating amount locally
    // over the item thumbnail instead of closing back to the apartment.
    setContentAnim({ key: k, kind: "sell" });
    setStorageSellFx({ itemId, amount: credit });
    haptic(HAPTIC.sell);
    playSellSound();
    schedule(() => setStorageSellFx(null), 1000);
    schedule(() => {
      setContentsState((s) => ({ ...s, [k]: { ...s[k], sold: true, soldFor: credit } }));
      setCoins((c) => c + credit);
      setUndoStack((stack) => [...stack, undoContentEntry(storageId, itemId, prev, credit, 5)]);
      setContentAnim(null);
      setMinutes((m) => m + 5);
      onSessionBump("cleared", 1, "Cleared +1");
    }, 520);
  }, [room, contentsState, busy, schedule, onSessionBump]);

  const donateContent = useCallback((storageId, itemId) => {
    const k = `${room.id}:${storageId}:${itemId}`;
    const prev = contentsState[k];
    if (!prev || prev.packed || prev.sold || prev.donated || busy) return;
    const items = CONTENTS[`${room.id}:${storageId}`] || [];
    const it = items.find((x) => x.id === itemId);
    haptic(HAPTIC.donate);
    playDonateSfx();
    // Stay in the storage overlay; the shrink animation plays locally.
    setContentAnim({ key: k, kind: "donate" });
    schedule(() => {
      setContentsState((s) => ({ ...s, [k]: { ...s[k], donated: true } }));
      setUndoStack((stack) => [...stack, undoContentEntry(storageId, itemId, prev, 0, 5)]);
      setContentAnim(null);
      setMinutes((m) => m + 5);
      onSessionBump("cleared", 1, "Cleared +1");
      if (it) {
        setDonateToast({ name: it.name });
        schedule(() => setDonateToast((t) => (t && t.name === it.name ? null : t)), 3500);
      }
    }, 520);
  }, [room, contentsState, busy, schedule, onSessionBump]);

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
    const entry = undoStack[undoStack.length - 1];
    const { roomId, id, storageId, prevPacked, prevSold, prevSoldFor, prevDonated, coinsDelta, minutesDelta } = entry;
    if (storageId) {
      // content undo: restore contentsState at ${roomId}:${storageId}:${id}
      const ck = `${roomId}:${storageId}:${id}`;
      setContentsState((s) => ({ ...s, [ck]: { ...s[ck], packed: prevPacked, sold: prevSold, soldFor: prevSoldFor, donated: prevDonated } }));
    } else {
      // object undo: restore objState at ${roomId}:${id}
      const k = sk(roomId, id);
      setObjState((s) => ({ ...s, [k]: { ...s[k], packed: prevPacked, sold: prevSold, soldFor: prevSoldFor, donated: prevDonated } }));
    }
    setCoins((c) => c - coinsDelta);
    setMinutes((m) => m - minutesDelta);
    setUndoStack((stack) => stack.slice(0, -1));
    setDonateToast(null);
  };

  /* hotkeys: X pack · Z check(select) · Tab inventory · Esc close */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Tab") { e.preventDefault(); setInvOpen((v) => !v); }
      else if (e.key === "Escape") { setSelectedId(null); setInvOpen(false); closeRadio(); }
      else if ((e.key === "x" || e.key === "X") && selectedId) packObject(selectedId);
      else if ((e.key === "z" || e.key === "Z") && hoverId) setSelectedId(hoverId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, hoverId, packObject]);

  /* Real wall-clock — minute tick (HUD shows h:mm only; 1s re-rendered the whole tree). */
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const alignMs = 60000 - (Date.now() % 60000);
    let intervalId = null;
    const timeoutId = setTimeout(() => {
      tick();
      intervalId = setInterval(tick, 60000);
    }, alignMs);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
  const clock = formatRealTime(now);
  const dateLabel = formatRealDate(now);
  const daysLeft = daysUntilMove(now);

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

  /* urgency scaffold: overall pressure + how many papers are on the desk */
  const pressure = taskPressure(tasks);
  const deskTasksOpen = tasks.filter((t) => isTaskOpen(t) && ["job", "admin", "move"].includes(t.category));
  const deskPaperCount = deskTasksOpen.length;
  /* the physical fan in the corner: the 3 most urgent desk papers, colored by
     kind (job = pink/red, admin/move = blue) and labeled with the real task */
  const fanCards = [...deskTasksOpen]
    .sort((a, b) => b.urgency - a.urgency)
    .slice(0, 3)
    .map((t) => {
      const job = t.jobId ? SAMPLE_JOBS[t.jobId] : null;
      const isJob = t.category === "job";
      return {
        id: t.id,
        name: job ? job.title : t.title,
        due: job ? job.deadline : t.due,
        urgency: t.urgency,
        icon: TASK_CATEGORIES[t.category]?.icon || "📄",
        bg: isJob ? "#E9BFB2" : "#B9CEDC",
        lo: isJob ? "#C08578" : "#8AA6B8",
      };
    });

  /* everything handled across ALL rooms — feeds Inventory + Log screens.
     Carries the object's own sprite so the screens can draw tiny thumbnails. */
  const handled = [];
  for (const rid of ROOMS_ORDER) {
    for (const o of ROOMS[rid].objects) {
      const st = objState[sk(rid, o.id)];
      if (!st) continue;
      const spr = ROOMS[rid].sprites[o.id];
      const base = { key: sk(rid, o.id), name: o.name, room: ROOMS[rid].name, spr };
      if (st.packed) handled.push({ ...base, state: "packed" });
      else if (st.sold) handled.push({ ...base, state: "sold", amount: st.soldFor });
      else if (st.donated) handled.push({ ...base, state: "donated" });
    }
  }
  // storage contents: items packed/sold/donated from inside cabinets/drawers
  for (const [storageKey, items] of Object.entries(CONTENTS)) {
    const [rid, sid] = storageKey.split(":");
    const storageObj = ROOMS[rid]?.objects.find((o) => o.id === sid);
    if (!storageObj) continue;
    for (const it of items) {
      const ck = `${storageKey}:${it.id}`;
      const st = contentsState[ck];
      if (!st) continue;
      const base = { key: ck, name: it.name, room: ROOMS[rid].name, spr: it.spr };
      if (st.packed) handled.push({ ...base, state: "packed" });
      else if (st.sold) handled.push({ ...base, state: "sold", amount: st.soldFor });
      else if (st.donated) handled.push({ ...base, state: "donated" });
    }
  }

  const selected = room.objects.find((o) => o.id === selectedId) || null;
  const packedList = removable.filter((o) => objState[sk(room.id, o.id)].packed);
  const soldList = removable.filter((o) => objState[sk(room.id, o.id)].sold);
  const donatedList = removable.filter((o) => objState[sk(room.id, o.id)].donated);
  const lastUndo = undoStack.length > 0 ? undoStack[undoStack.length - 1] : null;
  const lastUndoObj = lastUndo && ROOMS[lastUndo.roomId].objects.find((o) => o.id === lastUndo.id);

  const ui = {
    // Match Screens.jsx mockup chrome (gold-warm inset, hard outer border)
    frame: { background: "#241509", border: "3px solid #120A04", boxShadow: "inset 0 0 0 2px #6B4423, 0 3px 0 #000" },
    label: { fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "0.5px" },
  };

  const styleTag = (
    <style>{`
      @keyframes packAway { to { transform: scale(0.05) translate(-40%, 60%); opacity: 0; } }
      @keyframes packToBox {
        0%   { transform: translate(0px, 0px) scale(var(--pscale, 1)); opacity: 1; }
        30%  { transform: translate(calc(var(--pdx) * 0.25), calc(var(--pdy) * 0.25 - 40px)) scale(calc(var(--pscale, 1) * 0.82)); opacity: 1; }
        100% { transform: translate(var(--pdx), var(--pdy)) scale(calc(var(--pscale, 1) * 0.18)); opacity: 0; }
      }
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
      @keyframes boxReceive {
        0% { transform: translateY(0) scaleY(1); }
        40% { transform: translateY(-4px) scaleY(1.05); }
        70% { transform: translateY(0) scaleY(0.96); }
        100% { transform: translateY(0) scaleY(1); }
      }
      .boxReceiving { animation: boxReceive 0.52s ease-in-out; }
      .obj { cursor: pointer; transition: filter 120ms; }
      .obj:hover, .obj.sel { filter: drop-shadow(0 0 0 #FFD97A) drop-shadow(2px 0 0 #FFD97A) drop-shadow(-2px 0 0 #FFD97A) drop-shadow(0 2px 0 #FFD97A) drop-shadow(0 -2px 0 #FFD97A) brightness(1.06); }
      .obj.static { cursor: help; }
      .obj.packing { animation: packToBox 0.52s cubic-bezier(0.4, 0, 0.7, 1) forwards; }
      .contentPacking { animation: packToBox 0.52s cubic-bezier(0.4, 0, 0.7, 1) forwards; pointer-events: none; }
      .obj.removing { animation: packAway 0.5s ease-in forwards; }
      .panel { animation: popIn 140ms ease-out; }
      .coin { animation: coinBurst 0.8s cubic-bezier(0.3, 0.4, 0.7, 1) both; }
      .sellAmt { animation: sellAmt 0.9s ease-out both; }
      .sheet { animation: sheetUp 240ms cubic-bezier(0.22, 1, 0.36, 1); }
      /* paper fan urgency: an occasional twitch, more insistent as pressure rises */
      @keyframes fanNudge {
        0%, 86%, 100% { transform: translateY(0) rotate(0deg); }
        88% { transform: translateY(-3px) rotate(-1.4deg); }
        91% { transform: translateY(1px) rotate(1deg); }
        94% { transform: translateY(-2px) rotate(-0.7deg); }
        97% { transform: translateY(0) rotate(0.4deg); }
      }
      .fanNudge2 { animation: fanNudge 4.6s ease-in-out infinite; }
      .fanNudge3 { animation: fanNudge 2.3s ease-in-out infinite; }
      /* portal glow: hugs the furniture silhouette (drop-shadow follows the
         sprite's alpha, unlike box-shadow which hugs the border-box rectangle).
         Two layered drop-shadows blend green + yellow; the opacity breathes. */
      @keyframes portalGlow {
        0%, 100% { filter: drop-shadow(0 0 6px rgba(143,209,79,0.45)) drop-shadow(0 0 3px rgba(218,200,90,0.4)); }
        50%      { filter: drop-shadow(0 0 12px rgba(143,209,79,0.8)) drop-shadow(0 0 6px rgba(218,200,90,0.7)); }
      }
      .portal { animation: portalGlow 2.6s ease-in-out infinite; }
      /* Door/drawer face glow — outward halo only (no green fill wash).
         Fill made white fridges/closets look neon while green wood cabinets
         (bar, desk, dresser) barely showed; edge shadow reads the same on both. */
      @keyframes drawerGlowPulse {
        0%, 100% { box-shadow: 0 0 6px 2px rgba(143,209,79,0.50), 0 0 3px 1px rgba(218,200,90,0.38); }
        50%      { box-shadow: 0 0 11px 3px rgba(143,209,79,0.78), 0 0 5px 2px rgba(218,200,90,0.55); }
      }
      .drawerGlow {
        animation: drawerGlowPulse 3.8s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        pointer-events: none;
        background: transparent;
        border-radius: 1px;
      }
      /* red dot pulse for the Tasks chip when pressure is high */
      @keyframes redPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(196,59,52,0); }
        50%      { box-shadow: 0 0 8px 2px rgba(196,59,52,0.8); }
      }
      .redPulse { animation: redPulse 1.8s ease-in-out infinite; }
      /* guilt bubble scale pulse: grows the "!" and eases back, on its own loop.
         translateX(-50%) is baked into each keyframe so centering isn't lost. */
      @keyframes guiltBubbleScale {
        0%, 100% { transform: translateX(-50%) scale(1); }
        50%      { transform: translateX(-50%) scale(1.25); }
      }
      .guiltBubble { animation: guiltBubbleScale 2.2s ease-in-out infinite; }
      /* pressure vignette: a red edge-tint that breathes, stronger as the
         open-task load climbs. Purely a guilt cue on the apartment hub. */
      @keyframes pressurePulse {
        0%, 100% { opacity: var(--pmin, 0.10); }
        50%      { opacity: var(--pmax, 0.22); }
      }
      .pressureVignette { animation: pressurePulse 3.4s ease-in-out infinite; }
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
    const rmContentPacked = Object.entries(contentsState)
      .filter(([key, st]) => key.startsWith(`${rm.id}:`) && st.packed)
      .length;
    const rmBoxes = Math.min(BOX_MAX, rmPacked + rmContentPacked);
    // an item is flying to the pile now — furniture (packingId) OR a content
    // item (packingContentKey). Both must open the box to catch it.
    const packingHere = rm.id === room.id && (!!packingId || !!packingContentKey);
    // Content packs flip packed immediately; open the slot for the newest box
    // (rmBoxes-1) while the fly is in progress. Furniture packs still settle
    // packed at the end of the anim, so open at rmBoxes while in flight.
    const openIdx = packingHere
      ? Math.min(
          Math.max(0, packingContentKey ? rmBoxes - 1 : rmBoxes),
          BOX_MAX - 1,
        )
      : -1;
    const boxTarget = boxSlotCenter(openIdx < 0 ? Math.max(0, rmBoxes - 1) : openIdx);
    return (
      <>
        {/* LAYER 0 — room shell */}
        <div style={{ position: "absolute", inset: 0 }} onClick={() => { setSelectedId(null); closeStorage(); closeRadio(); }}>
          <PixelCanvas w={240} h={extCells} draw={getShellDraw(rm, extCells)} redrawKey={extCells} />
        </div>

        {/* LAYER 1+ — object sprites */}
        {visibleObjectsFor(rm).map((o) => {
          const spr = rm.sprites[o.id];
          const placed = SAVED_LAYOUT[rm.id]?.[o.id] || o;
          const isCur = rm.id === room.id;
          const isSel = isCur && selectedId === o.id;
          const isPacking = isCur && packingId === o.id;
          const isRemoving = isCur && (sellingId === o.id || donatingId === o.id);
          const isBusy = isPacking || isRemoving;
          const storageHasRemaining =
            hasContents(rm.id, o.id) &&
            remainingCount(rm.id, o.id, contentsState) > 0;
          // ONE storage cue only: bar-cabinet door/drawer face halos (.drawerGlow).
          // Never use silhouette .portal on containers — that filter:drop-shadow
          // reads as a different effect (glow around the whole sprite). Portal
          // stays on the bathroom mirror only (health doorway).
          const activeGlowRegions = spr?.glowRegions || null;
          const useFaceGlow =
            storageHasRemaining &&
            glowMode !== "outline" &&
            !!activeGlowRegions;
          const useOutlineGlow =
            storageHasRemaining && glowMode === "outline";
          if (rm.id === "dining" && o.id === "dining_chairs" && placed.parts) {
            const p = placed.parts;
            const common = { position: "absolute", left: placed.x, top: placed.y, transform: `scale(${placed.scale || 1})`, transformOrigin: "top left" };
            const click = (e) => { e.stopPropagation(); setSelectedId(o.id); };
            return <div key={o.id}>
              <div className={`obj ${isSel ? "sel" : ""} ${isBusy ? "removing" : ""}`} onClick={click} style={{ ...common, zIndex: 30, width: spr.w * CELL, height: spr.h * CELL }}>
                <div style={{ position: "absolute", left: p.sides.x * CELL, top: p.sides.y * CELL, transform: `scale(${p.sides.scaleX},${p.sides.scaleY})`, transformOrigin: "top left" }}>
                  <PixelCanvas w={96} h={58} draw={drawDiningChairSides} />
                </div>
              </div>
              <div className={`obj ${isSel ? "sel" : ""} ${isBusy ? "removing" : ""}`} onClick={click} style={{ ...common, zIndex: 50, width: spr.w * CELL, height: spr.h * CELL }}>
                <div style={{ position: "absolute", left: p.cushion.x * CELL, top: p.cushion.y * CELL, transform: `scale(${p.cushion.scaleX},${p.cushion.scaleY})`, transformOrigin: "top left" }}>
                  <PixelCanvas w={30} h={9} draw={drawDiningFrontCushion} />
                </div>
                <div style={{ position: "absolute", left: p.frame.x * CELL, top: p.frame.y * CELL, transform: `scale(${p.frame.scaleX},${p.frame.scaleY})`, transformOrigin: "top left" }}>
                  <PixelCanvas w={34} h={38} draw={drawDiningFrontFrame} />
                </div>
              </div>
            </div>;
          }
          // pack-to-box: fly the sprite into the open box as it shrinks. Deltas
          // are stage px from the sprite's top-left to the receiving box's mouth;
          // it lands as a speck in the box. Sell/donate just shrink in place
          // (`removing`) — only packing goes to the box.
          const packSc = placed.scale || 1;
          const packVars = isPacking ? {
            "--pdx": `${boxTarget.x - placed.x}px`,
            "--pdy": `${boxTarget.y - placed.y}px`,
            "--pscale": packSc,
          } : null;
          return (
            <div
              key={o.id}
              data-object-id={o.id}
              data-room-id={rm.id}
              className={`obj ${isSel ? "sel" : ""} ${isPacking ? "packing" : ""} ${isRemoving ? "removing" : ""} ${o.removable ? "" : "static"} ${rm.id === "bathroom" && o.id === "mirror_cabinet" ? "portal" : ""} ${useOutlineGlow ? "portal" : ""}`}
              style={{
                position: "absolute", left: placed.x, top: placed.y, zIndex: o.z * 10,
                transform: `scale(${placed.scale || 1})`, transformOrigin: "top left",
                // radio is tiny — pad the hit box so mobile taps land reliably
                ...(o.id === "radio" ? { padding: 10, margin: -10 } : null),
                ...packVars,
              }}
              onClick={(e) => {
                e.stopPropagation();
                // the medicine cabinet is a doorway to the Health screen
                if (rm.id === "bathroom" && o.id === "mirror_cabinet") {
                  playContainerSfx("mirror_cabinet", "open");
                  setScreen("health");
                  return;
                }
                // living-room radio — open the station panel (not packable)
                if (o.id === "radio") {
                  primeSellAudio();
                  const box = e.currentTarget.getBoundingClientRect();
                  setSelectedId(null);
                  closeStorage();
                  setRadioOpen({
                    left: box.left, top: box.top, right: box.right, bottom: box.bottom,
                    width: box.width, height: box.height,
                  });
                  preloadRadioStations().then(refreshRadioUi);
                  refreshRadioUi();
                  return;
                }
                // Storage with remaining items → open contents panel.
                // Emptied storage → select the furniture so Pack/Sell/Donate
                // can run on the cabinet itself (empty-first rule).
                if (hasContents(rm.id, o.id) && remainingCount(rm.id, o.id, contentsState) > 0) {
                  // kitchen counter only: tap upper half → drawer SFX + tools/cutlery,
                  // lower half → cabinet SFX + dishes/cookware.
                  const box = e.currentTarget.getBoundingClientRect();
                  let zone = null;
                  if (o.id === "counter_sink") {
                    const localY = ((e.clientY - box.top) / Math.max(1, box.height)) * (spr?.h || 1);
                    const localX = ((e.clientX - box.left) / Math.max(1, box.width)) * (spr?.w || 1);
                    zone = kitchenTapZone(o.id, localY, localX);
                    if (remainingCount(rm.id, o.id, contentsState, zone) <= 0) return;
                  }
                  playContainerSfx(o.id, "open", zone);
                  setStorageZone(zone);
                  setStorageAnchor({
                    left: box.left, top: box.top, right: box.right, bottom: box.bottom,
                    width: box.width, height: box.height,
                  });
                  setStorageId(o.id);
                  closeRadio();
                  return;
                }
                setSelectedId(o.id);
                closeRadio();
                closeStorage();
              }}
              onMouseEnter={() => setHoverId(o.id)}
              onMouseLeave={() => setHoverId((h) => (h === o.id ? null : h))}
              title=""
            >
              {o.id === "radio"
                ? <RadioSprite />
                : <PixelCanvas w={spr.w} h={spr.h} draw={spr.draw} />}
              {/* Door/drawer face glow (universal): one .drawerGlow rect per
                  face region — same pulse as the bar cabinet doors. Outward
                  box-shadow keeps the face readable. Only while storage still
                  has unpacked items. */}
              {useFaceGlow && (() => {
                return activeGlowRegions.map(([gx, gy, gw, gh], i) => (
                  <div
                    key={`drawerGlow-${i}`}
                    className="drawerGlow"
                    style={{
                      position: "absolute",
                      left: gx * CELL,
                      top: gy * CELL,
                      width: gw * CELL,
                      height: gh * CELL,
                      zIndex: 2,
                    }}
                  />
                ));
              })()}
              {/* portal hint: a tiny cross-icon badge so the glow reads as "doorway" */}
              {rm.id === "bathroom" && o.id === "mirror_cabinet" && (
                <div style={{
                  position: "absolute", top: -10, right: -10, zIndex: 5,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#8FD14F", border: "2px solid #120A04",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#120A04", fontSize: 10, ...ui.label,
                }}>+</div>
              )}
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

        {/* inline storage panel — rendered as a SIBLING of all object sprites
            (not inside any object's div) so it sits in the room's root stacking
            context and can't be overlapped by sprites with a higher per-object
            z-index. Mirrors the furniture action-bar pattern: click an item to
            select it, then Pack/Sell/Donate from the bar at the panel bottom. */}
        {storageId && rm.id === room.id && (() => {
          const o = room.objects.find((ob) => ob.id === storageId);
          if (!o) return null;
          const saved = SAVED_LAYOUT[room.id]?.[o.id] || {};
          const placed = { ...o, ...saved };
          const items = contentsFor(rm.id, o.id, storageZone);
          const sKey = `${rm.id}:${o.id}`;
          const rem = items.filter((it) => {
            const st = contentsState[`${sKey}:${it.id}`];
            return !st || (!st.packed && !st.sold && !st.donated);
          }).length;
          const sel = items.find((it) => it.id === selectedContentId) || null;
          const selSt = sel ? (contentsState[`${sKey}:${sel.id}`] || { packed: false, sold: false, soldFor: 0, donated: false }) : null;
          const selDone = selSt && (selSt.packed || selSt.sold || selSt.donated);
          const storageTitle = ({
            utensils: "Utensil drawer",
            junk: "Junk drawer",
            cookware: "Cookware",
            under_sink: "Under-sink",
            upper: "Upper drawers",
            lower: "Lower cabinets",
          })[storageZone] || o.name;
          // Compact card above the furniture. Mobile portals it in screen px
          // (room zoom must not scale the UI). Desktop stays stage-absolute.
          const panelW = Math.min(260, typeof window !== "undefined" ? window.innerWidth - 36 : 260);
          const panelHIdeal = 230;
          const objSpr = rm.sprites[o.id];
          const sScale = placed.scale || 1;
          const objW = (objSpr?.w || 32) * CELL * sScale;
          let panelPos;
          let panelH = panelHIdeal;
          if (isMobile) {
            const a = storageAnchor;
            const gap = 8;
            // Clear of the top HUD (clock / coins / room chip / undo)
            const safeTop = 78;
            const safeBottom = 92;
            const vw = typeof window !== "undefined" ? window.innerWidth : 390;
            const vh = typeof window !== "undefined" ? window.innerHeight : 700;
            const maxH = Math.max(160, vh - safeTop - safeBottom);
            panelH = Math.min(panelHIdeal, maxH);
            let left = a
              ? a.left + a.width / 2 - panelW / 2
              : (vw - panelW) / 2;
            left = Math.max(12, Math.min(left, vw - panelW - 12));
            // Prefer fully above the furniture so it doesn't cover the item.
            let top;
            if (a && a.top - panelH - gap >= safeTop) {
              top = a.top - panelH - gap;
            } else if (a && a.bottom + gap + panelH <= vh - safeBottom) {
              top = a.bottom + gap;
            } else {
              // Not enough room above or below — park in the free band above chrome
              // without covering the furniture center if we can help it.
              top = safeTop;
              if (a && top + panelH > a.top - 4) {
                top = Math.max(safeTop, Math.min(a.top - panelH - gap, vh - panelH - safeBottom));
              }
            }
            top = Math.max(safeTop, Math.min(top, vh - panelH - safeBottom));
            panelPos = { position: "fixed", left, top, width: panelW, height: panelH };
          } else {
            const padTop = 70;
            const padX = 8;
            let pLeft = placed.x + (objW - panelW) / 2;
            pLeft = Math.max(padX, Math.min(pLeft, STAGE_W - panelW - padX));
            let pTop = placed.y - panelH - 10;
            if (pTop < padTop) pTop = Math.min(placed.y + (objSpr?.h || 32) * CELL * sScale + 8, STAGE_H - panelH - 8);
            pTop = Math.max(padTop, Math.min(pTop, STAGE_H - panelH - 8));
            panelPos = { position: "absolute", left: pLeft, top: pTop, width: panelW, height: panelH };
          }
          const panel = (
            <div
              data-testid="storage-panel"
              style={{
                ...panelPos,
                maxHeight: panelH,
                zIndex: 9999, pointerEvents: "auto", boxSizing: "border-box",
                background: "#1D1006", border: "3px solid #120A04",
                boxShadow: "inset 0 0 0 2px #4A2E17, 0 8px 24px rgba(0,0,0,0.8)",
                padding: 8, ...ui.frame,
                scrollbarColor: "#4A2E17 #1A0F06",
                scrollbarWidth: "thin",
                display: "flex", flexDirection: "column", overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <style>{`
                .storageScroll::-webkit-scrollbar { width: 8px; }
                .storageScroll::-webkit-scrollbar-track { background: #1A0F06; border-left: 2px solid #120A04; }
                .storageScroll::-webkit-scrollbar-thumb { background: #4A2E17; border: 2px solid #120A04; }
                .storageScroll::-webkit-scrollbar-thumb:hover { background: #6B4A28; }
              `}</style>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flex: "0 0 auto" }}>
                <div style={{ color: "#FFD97A", fontSize: 13, ...ui.label }}>{storageTitle}</div>
                <button
                  onClick={(e) => { e.stopPropagation(); closeStorage(o.id); }}
                  style={{ background: "none", border: "none", color: "#C9B896", fontSize: 18, cursor: "pointer", lineHeight: 1, minWidth: 32, minHeight: 32, ...ui.label }}
                  title="close"
                >×</button>
              </div>
              <div style={{ color: rem > 0 ? "#C9B896" : "#5D7C3B", fontSize: 11, marginBottom: 6, flex: "0 0 auto", ...ui.label }}>
                {rem > 0 ? `${rem} inside` : "empty — safe to pack whole"}
              </div>
              <div className="storageScroll" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 4, minHeight: 0, flex: "1 1 auto", overflowY: "auto", paddingRight: 2 }}>
                {items.map((it) => {
                  const k = `${sKey}:${it.id}`;
                  const st = contentsState[k] || { packed: false, sold: false, soldFor: 0, donated: false };
                  const done = st.packed || st.sold || st.donated;
                  const isSel = selectedContentId === it.id && !done;
                  const maxDim = 32;
                  const fit = it.spr ? Math.min(maxDim / (it.spr.w * CELL), maxDim / (it.spr.h * CELL)) : 0;
                  return (
                    <div key={it.id} data-content-id={it.id} style={{
                      position: "relative", padding: 4,
                      background: done ? "#0F0904" : (isSel ? "#3A2410" : "#1A0F06"),
                      border: isSel ? "2px solid #FFD97A" : "2px solid #4A2E17",
                      opacity: done ? 0.5 : 1, cursor: done ? "default" : "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    }}
                      onClick={(e) => { e.stopPropagation(); if (!done) setSelectedContentId(isSel ? null : it.id); }}
                    >
                      {storageSellFx && storageSellFx.itemId === it.id && (
                        <div style={{ position: "absolute", left: "50%", top: "50%", zIndex: 500, pointerEvents: "none" }}>
                          {COIN_BURSTS.map(({ tx, ty, d }, i) => (
                            <span key={i} className="coin" style={{
                              position: "absolute", left: 0, top: 0, width: 12, height: 12,
                              background: "#EFC463", border: "2px solid #8A5E14", borderRadius: "50%",
                              boxShadow: "inset 1px 1px 0 #FFE9A8",
                              animationDelay: `${d}ms`, "--tx": `${tx}px`, "--ty": `${ty}px`,
                            }} />
                          ))}
                          <div className="sellAmt" style={{
                            position: "absolute", left: 0, top: -24, whiteSpace: "nowrap",
                            color: "#FFD97A", fontSize: 14,
                            textShadow: "2px 2px 0 #120A04, -2px 2px 0 #120A04, 2px -2px 0 #120A04, -2px -2px 0 #120A04",
                            ...ui.label,
                          }}>+${storageSellFx.amount}</div>
                        </div>
                      )}
                      {it.spr && (
                        <div style={{ width: maxDim, height: maxDim, display: "flex", alignItems: "center", justifyContent: "center", background: "#241509", border: "1px solid #4A2E17", overflow: "hidden" }}>
                          <div style={{ transform: `scale(${fit})`, transformOrigin: "center", imageRendering: "pixelated" }}>
                            <PixelCanvas w={it.spr.w} h={it.spr.h} draw={it.spr.draw} redrawKey={itemArtRedrawKey} />
                          </div>
                        </div>
                      )}
                      <div style={{ color: "#F2E4C0", fontSize: 10, textAlign: "center", lineHeight: 1.15, ...ui.label }}>{it.name}</div>
                      {st.packed && <div style={{ color: "#C9B896", fontSize: 9, ...ui.label }}>packed</div>}
                      {st.sold && <div style={{ color: "#D9A33C", fontSize: 9, ...ui.label }}>sold ${st.soldFor}</div>}
                      {st.donated && <div style={{ color: "#77974C", fontSize: 9, ...ui.label }}>donated</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 5, marginTop: 6, paddingTop: 6, borderTop: "2px solid #4A2E17", flex: "0 0 auto" }}>
                <button
                  data-storage-action="pack"
                  onClick={() => { if (sel) { packContent(o.id, sel.id); } }}
                  disabled={!sel || !!selDone || !!busy}
                  style={{ flex: 1, padding: "8px 2px", fontSize: 11, cursor: (!sel || selDone || busy) ? "not-allowed" : "pointer", color: "#F2E4C0", background: sel ? "#3A2410" : "#1A0F06", border: "2px solid #120A04", opacity: (!sel || selDone) ? 0.4 : 1, ...ui.label }}
                >📦 Pack</button>
                <button
                  data-storage-action="sell"
                  onClick={() => { if (sel) { sellContent(o.id, sel.id); } }}
                  disabled={!sel || !!selDone || !!busy || !sel?.value}
                  title={sel?.value ? `sell ~$${sel.value}` : "can't sell"}
                  style={{ flex: 1, padding: "8px 2px", fontSize: 11, cursor: (!sel || selDone || busy || !sel?.value) ? "not-allowed" : "pointer", color: "#FFD97A", background: sel ? "#3A2410" : "#1A0F06", border: "2px solid #120A04", opacity: (!sel || selDone || !sel?.value) ? 0.4 : 1, ...ui.label }}
                >💰 Sell</button>
                <button
                  data-storage-action="donate"
                  onClick={() => { if (sel) { donateContent(o.id, sel.id); } }}
                  disabled={!sel || !!selDone || !!busy}
                  style={{ flex: 1, padding: "8px 2px", fontSize: 11, cursor: (!sel || selDone || busy) ? "not-allowed" : "pointer", color: "#9CC76F", background: sel ? "#3A2410" : "#1A0F06", border: "2px solid #120A04", opacity: (!sel || selDone) ? 0.4 : 1, ...ui.label }}
                >🎁 Donate</button>
              </div>
            </div>
          );
          return isMobile
            ? createPortal(
                <>
                  <div
                    onClick={() => { closeStorage(o.id); }}
                    style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(10, 5, 2, 0.18)" }}
                  />
                  {panel}
                </>,
                document.body
              )
            : panel;
        })()}

        {/* living-room radio panel — ON/OFF + station list */}
        {radioOpen && rm.id === room.id && rm.id === "living" && (() => {
          const stations = radioUi.stations?.length ? radioUi.stations : RADIO_STATIONS.map((s) => ({ ...s, available: true }));
          const cur = stations.find((s) => s.id === radioUi.stationId) || stations[0];
          const panelW = Math.min(220, typeof window !== "undefined" ? window.innerWidth - 40 : 220);
          const a = radioOpen;
          const safeTop = 78;
          const safeBottom = 92;
          const vw = typeof window !== "undefined" ? window.innerWidth : 390;
          const vh = typeof window !== "undefined" ? window.innerHeight : 700;
          let left = a ? a.left + a.width / 2 - panelW / 2 : (vw - panelW) / 2;
          left = Math.max(12, Math.min(left, vw - panelW - 12));
          const above = a ? a.top - 8 : vh / 2;
          const below = a ? a.bottom + 8 : vh / 2;
          let top = above - 268;
          if (top < safeTop) top = Math.min(below, vh - safeBottom - 268);
          top = Math.max(safeTop, Math.min(top, vh - safeBottom - 200));

          const panel = (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: isMobile ? "fixed" : "absolute",
                left: isMobile ? left : (a ? undefined : 200),
                top: isMobile ? top : 20,
                ...(isMobile ? null : (() => {
                  const o = room.objects.find((ob) => ob.id === "radio");
                  const saved = SAVED_LAYOUT.living?.radio || {};
                  const px = (saved.x ?? o?.x ?? 198);
                  const py = (saved.y ?? o?.y ?? 36);
                  return { left: Math.max(8, px - 40), top: Math.max(8, py - 210) };
                })()),
                width: panelW,
                zIndex: isMobile ? 9999 : 400,
                background: "#1A0F06",
                border: "3px solid #120A04",
                boxShadow: "inset 0 0 0 2px #4A2E17, 0 8px 0 #0A0502",
                padding: 10,
                scrollbarColor: "#4A2E17 #1A0F06",
                scrollbarWidth: "thin",
                ...ui.label,
              }}
            >
              <style>{`
                .storageScroll::-webkit-scrollbar { width: 8px; }
                .storageScroll::-webkit-scrollbar-track { background: #1A0F06; border-left: 2px solid #120A04; }
                .storageScroll::-webkit-scrollbar-thumb { background: #4A2E17; border: 2px solid #120A04; }
                .storageScroll::-webkit-scrollbar-thumb:hover { background: #6B4A28; }
              `}</style>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ color: "#FFD97A", fontSize: 14 }}>RADIO</div>
                <button
                  onClick={(e) => { e.stopPropagation(); closeRadio(); }}
                  style={{ background: "none", border: "none", color: "#C9B896", fontSize: 16, cursor: "pointer", lineHeight: 1, ...ui.label }}
                >✕</button>
              </div>
              <div style={{
                display: "flex", gap: 6, marginBottom: 8, padding: 6,
                background: "#120A04", border: "2px solid #4A2E17",
              }}>
                <div style={{
                  flex: 1, color: radioUi.on ? "#8FD14F" : "#6B563B", fontSize: 11,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: radioUi.on ? "#8FD14F" : "#3A2A18",
                    boxShadow: radioUi.on ? "0 0 6px #8FD14F" : "none",
                    display: "inline-block",
                  }} />
                  {radioUi.on ? (cur?.display || "ON") : "OFF"}
                </div>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    primeSellAudio();
                    const turningOn = !radioUi.on;
                    if (turningOn) {
                      // random station on power-on — don't pass last stationId
                      setRadioUi((u) => ({ ...u, on: true }));
                      await toggleRadio();
                    } else {
                      setRadioUi((u) => ({ ...u, on: false }));
                      await toggleRadio();
                    }
                    refreshRadioUi();
                  }}
                  style={{
                    padding: "6px 10px", fontSize: 11, cursor: "pointer",
                    color: "#F2E4C0", background: radioUi.on ? "#3A2410" : "#2A4A20",
                    border: "2px solid #120A04", ...ui.label,
                  }}
                >{radioUi.on ? "OFF" : "ON"}</button>
              </div>
              <div
                className="storageScroll"
                style={{
                  display: "flex", flexDirection: "column", gap: 4, maxHeight: 200,
                  overflowY: "auto", paddingRight: 2,
                  scrollbarColor: "#4A2E17 #1A0F06", scrollbarWidth: "thin",
                }}
              >
                {stations.map((s) => {
                  const active = radioUi.on && radioUi.stationId === s.id;
                  const avail = s.available !== false;
                  return (
                    <button
                      key={s.id}
                      disabled={!avail}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!avail) return;
                        primeSellAudio();
                        setRadioUi((u) => ({ ...u, on: true, stationId: s.id }));
                        const ok = await playStation(s.id);
                        if (!ok) refreshRadioUi();
                        else refreshRadioUi();
                      }}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        gap: 8, padding: "7px 8px", textAlign: "left", cursor: avail ? "pointer" : "not-allowed",
                        color: !avail ? "#5A4A38" : active ? "#120A04" : "#F2E4C0",
                        background: active ? "#FFD97A" : "#241509",
                        border: active ? "2px solid #FFD97A" : "2px solid #4A2E17",
                        opacity: avail ? 1 : 0.45,
                        ...ui.label,
                      }}
                    >
                      <span style={{ fontSize: 11, letterSpacing: "0.5px" }}>{s.display}</span>
                      <span style={{ fontSize: 10, color: active ? "#3A2410" : "#C9B896" }}>{s.label}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ color: "#6B563B", fontSize: 9, marginTop: 8, lineHeight: 1.3 }}>
                Off returns to Cherry Blossom
              </div>
            </div>
          );
          return isMobile
            ? createPortal(
                <>
                  <div
                    onClick={() => closeRadio()}
                    style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(10, 5, 2, 0.18)" }}
                  />
                  {panel}
                </>,
                document.body
              )
            : panel;
        })()}

        {/* STRETCHY — the cat, only in the current room, above the floor/furniture
            but non-interactive. Keyed by room so he re-mounts and trots back in. */}
        {rm.id === room.id && (
          <Stretchy key={rm.id} spots={CAT_SPOTS[rm.id]} enterSide={catEnterSide} pressure={pressure} playCatSfx={playCatSfx} onOpen={() => setScreen("stretchy")} />
        )}

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

        {/* box stack near the open door — grows as you pack; the top box opens
            to catch the incoming item, then closes as part of the pile.
            Show for furniture packs OR storage-content packs (rmBoxes includes
            both). packingHere covers the fly-in frame before state flips. */}
        {(rmBoxes > 0 || packingHere) && (
          <div style={{ position: "absolute", left: BOX_ORIGIN.x, top: BOX_ORIGIN.y, zIndex: 60, animation: "popIn 220ms ease-out" }}>
            <div className={packingHere ? "boxReceiving" : ""} style={{ transformOrigin: "bottom center" }}>
              <PixelCanvas w={BOX_CW} h={BOX_CH} draw={(ctx) => drawBoxes(ctx, rmBoxes, openIdx)} redrawKey={`${rmBoxes}-${openIdx}`} />
            </div>
          </div>
        )}

        {/* content pack-to-box fly: when a stored item is packed from the
            storage overlay, we close back to the apartment and spawn the item's
            sprite flying from the storage object to the box pile's mouth.
            Reuses the furniture packToBox keyframe + CSS vars. The sprite is
            scaled way down so the raw-dim PNG renders as a small speck (the
            packToBox keyframe shrinks it to 0.12x of --pscale as it lands). */}
        {contentFlyFx && rm.id === room.id && contentFlyFx.spr && (
          <div
            className="contentPacking"
            style={{
              position: "absolute",
              left: contentFlyFx.x,
              top: contentFlyFx.y,
              zIndex: 200,
              "--pdx": `${contentFlyFx.pdx}px`,
              "--pdy": `${contentFlyFx.pdy}px`,
              "--pscale": contentFlyFx.pscale,
              transformOrigin: "top left",
              // Match furniture .obj: base scale before packToBox runs, or the
              // first frame flashes at full PNG size and the fly looks broken.
              transform: `scale(${contentFlyFx.pscale})`,
            }}
          >
            <PixelCanvas w={contentFlyFx.spr.w} h={contentFlyFx.spr.h} draw={contentFlyFx.spr.draw} />
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
    const prevIdx = (roomIndex - 1 + N) % N;
    const nextIdx = (roomIndex + 1) % N;
    const prevRoom = ROOMS[ROOMS_ORDER[prevIdx]];
    const nextRoom = ROOMS[ROOMS_ORDER[nextIdx]];

    // Pan animation is driven by requestAnimationFrame on the MAIN thread, not a
    // CSS `transition: transform`. A CSS transition hands the whole 600%-wide
    // strip to the compositor, which rasterizes it into a single texture at the
    // start of the animation — that momentary raster is the room-switch "pop
    // out". A live drag never flashes because it's JS-driven each frame; snaps
    // and arrows now animate identically, so they don't flash either.
    const cancelAnim = (finalize) => {
      const a = animRef.current;
      if (!a) return;
      cancelAnimationFrame(a.raf);
      animRef.current = null;
      if (finalize) a.commit();
    };
    const animateTo = (fromX, toX, delta) => {
      cancelAnim(true);
      const t0 = performance.now(), dur = 300;
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      // rooms loop: bedroom ↔ living closes the apartment circuit
      const self = { raf: 0, commit: () => {
        if (delta) setRoomIndex((i) => (i + delta + N) % N);
        setDragX(0);
      } };
      const step = (now) => {
        if (animRef.current !== self) return;              // superseded or cancelled
        const t = Math.min(1, (now - t0) / dur);
        setDragX(fromX + (toX - fromX) * ease(t));
        if (t < 1) self.raf = requestAnimationFrame(step);
        else { animRef.current = null; self.commit(); }    // land: commit index, reset offset
      };
      self.raf = requestAnimationFrame(step);
      animRef.current = self;
    };

    const onPointerDown = (e) => {
      cancelAnim(true);   // settle any in-flight snap so the drag starts clean
      dragRef.current = { active: true, startX: e.clientX, intent: false, id: e.pointerId };
    };
    const onPointerMove = (e) => {
      const d = dragRef.current;
      if (!d.active || e.pointerId !== d.id) return;
      let dx = e.clientX - d.startX;
      if (!d.intent && Math.abs(dx) > 10) { d.intent = true; setDragging(true); }
      if (!d.intent) return;
      setDragX(dx);
    };
    const endDrag = (e) => {
      const d = dragRef.current;
      if (!d.active || (e && e.pointerId !== d.id)) return;
      d.active = false;
      let delta = 0;
      if (d.intent) {
        suppressClickRef.current = true;
        schedule(() => { suppressClickRef.current = false; }, 80);
        const threshold = Math.max(60, viewSize.w * 0.18);
        // loop: swipe past either end wraps bedroom ↔ living
        if (dragX <= -threshold) delta = 1;
        else if (dragX >= threshold) delta = -1;
        if (delta) { haptic(HAPTIC.room); playRoomSwitchSfx(); }
      }
      setDragging(false);
      animateTo(dragX, -delta * viewSize.w, delta);
    };

    const arrowBtn = (dir, target) => target && (
      <button
        onClick={() => { haptic(HAPTIC.room); playRoomSwitchSfx(); animateTo(0, -dir * viewSize.w, dir); }}
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

    // empty-first rule: a removable storage object (bar cabinet, nightstand, etc.)
    // can't be packed/sold/donated as a whole while it still has items inside.
    // Once emptied, Pack unlocks (tap the furniture — it selects instead of
    // reopening an empty storage panel).
    const selectedHasContents = selected && hasContents(room.id, selected.id);
    const selectedContentsRemaining = selectedHasContents
      ? remainingCount(room.id, selected.id, contentsState)
      : 0;
    const blockedByContents = selectedHasContents && selectedContentsRemaining > 0;
    const actions = [
      { key: "check",  icon: "🔍", label: "Check",  disabled: !selected, onClick: () => setSheetOpen(true) },
      { key: "pack",   icon: "📦", label: "Pack",   disabled: !selected || !selected.removable || !!busy || blockedByContents, onClick: () => packObject(selected.id) },
      { key: "sell",   icon: "💰", label: "Sell",   disabled: !selected || !selected.removable || !!busy || blockedByContents, onClick: () => sellObject(selected.id) },
      { key: "donate", icon: "🎁", label: "Donate", disabled: !selected || !selected.removable || !!busy || blockedByContents, onClick: () => donateObject(selected.id) },
      { key: "menu",   icon: "☰",  label: "Menu",   disabled: false, onClick: () => setScreen("menu") },
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

        {/* pressure vignette — a red edge tint that grows with the open-task
            load. Only on the hub (screen === "apartment"); never over a sheet
            or overlay screen. */}
        {screen === "apartment" && pressure > 0 && (
          <div
            className="pressureVignette"
            style={{
              position: "fixed", inset: 0, zIndex: 140, pointerEvents: "none",
              background: "radial-gradient(120% 90% at 50% 60%, transparent 52%, rgba(163,37,44,0.55) 100%)",
              ["--pmin"]: 0.06 + pressure * 0.05,
              ["--pmax"]: 0.16 + pressure * 0.10,
            }}
          />
        )}

        {/* ---- top HUD: native-sized chrome, never scales with the room ---- */}
        <div style={{ flex: "0 0 auto", display: "flex", alignItems: "stretch", gap: 6, padding: "calc(env(safe-area-inset-top, 0px) + 10px) 10px 8px", zIndex: 130 }}>
          <div style={{ padding: "7px 10px", flex: "1 1 auto", minWidth: 0, ...ui.frame }}>
            <div style={{ color: "#F2E4C0", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", ...ui.label }}>{clock}</div>
            <div style={{ color: "#C9B896", fontSize: 10, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", ...ui.label }}>
              {dateLabel}
            </div>
            <div style={{ color: "#8A7350", fontSize: 9, marginTop: 2, whiteSpace: "nowrap", ...ui.label }}>
              {daysLeft === 0 ? "Move day" : `${daysLeft}d left`}
            </div>
          </div>
          <div style={{ padding: "7px 10px", display: "flex", alignItems: "center", gap: 6, color: "#F2E4C0", fontSize: 14, ...ui.frame, ...ui.label }}>
            <span style={{ width: 12, height: 12, background: P.gold, border: "2px solid #8A5E14", borderRadius: "50%", display: "inline-block" }} />
            {coins}
          </div>
          <div style={{ padding: "6px 9px", textAlign: "center", minWidth: 56, ...ui.frame }}>
            <div style={{ color: "#F2E4C0", fontSize: 11, whiteSpace: "nowrap", ...ui.label }}>{room.name}</div>
            <div style={{ color: "#C9B896", fontSize: 10, marginTop: 2, whiteSpace: "nowrap", ...ui.label }}>
              {total > 0 ? `${clearedCount}/${total}` : "—"}
            </div>
            {total > 0 && (
              <div style={{ marginTop: 4, width: "100%", height: 6, background: "#120A04", border: "1px solid #4A2E17" }}>
                <div style={{
                  width: `${Math.round((clearedCount / total) * 100)}%`, height: "100%",
                  background: "linear-gradient(#8FD14F,#5EA032)",
                }} />
              </div>
            )}
          </div>
          <div style={{ padding: "6px 9px", textAlign: "center", ...ui.frame }} title="Furniture packed into boxes (apartment-wide)">
            <div style={{ color: "#F2E4C0", fontSize: 11, whiteSpace: "nowrap", ...ui.label }}>📦</div>
            <div style={{ color: "#C9B896", fontSize: 10, marginTop: 2, whiteSpace: "nowrap", ...ui.label }}>
              {globalPacked}/{globalTotal}
            </div>
          </div>
          <button
            onClick={undoLast}
            disabled={undoStack.length === 0}
            title={lastUndoObj ? `Undo: ${lastUndoObj.name}` : "Nothing to undo"}
            style={{
              padding: "7px 12px", fontSize: 17, minWidth: 48, cursor: undoStack.length ? "pointer" : "default",
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
            transform: `translateX(${-roomIndex * viewSize.w + dragX}px)`,
            transition: "none",
          }}>
            {ROOMS_ORDER.map((rid, i) => {
              // Every room is rendered and painted up front (drawn synchronously via
              // useLayoutEffect in PixelCanvas). We deliberately do NOT window the
              // rooms or promote them with will-change: both caused a flash on the
              // snap — windowing mounts/unmounts a room the instant you release, and
              // will-change re-rasterizes the layer as the transform animates. With
              // all rooms static and unpromoted, the snap is just a translate of an
              // already-painted strip, so nothing pops out.
              return (
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
              );
            })}
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
                Next up: {nextRoom.name} →
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

        {/* ---- paper fan: 2 job apps + 1 admin card, tucked partly behind
             the action bar. Now the physical face of the task pile: it peeks
             out further and twitches as pressure rises, and tapping it opens
             the Desk. ---- */}
        {fanCards.length > 0 && (
        <div
          className={pressure >= 3 ? "fanNudge3" : pressure === 2 ? "fanNudge2" : undefined}
          onClick={() => setScreen("desk")}
          style={{
            position: "absolute", left: 22, zIndex: 110, width: 130, height: 100, cursor: "pointer",
            /* peek: papers ride up out from behind the bar as things pile up.
               Kept low so the fan never climbs over Stretchy in the foreground. */
            bottom: `calc(env(safe-area-inset-bottom, 0px) + ${22 + pressure * 5}px)`,
            transition: "bottom 400ms ease",
          }}
        >
          {fanCards.map((c, i) => {
            const pos = [{ rot: -14, dx: 0 }, { rot: -4, dx: 26 }, { rot: 7, dx: 54 }][i] || { rot: 0, dx: 54 };
            return (
              <div key={c.id} style={{
                position: "absolute", left: pos.dx, bottom: 0, width: 58, height: 92, background: c.bg,
                border: "2px solid #120A04", boxShadow: "2px 2px 0 rgba(0,0,0,0.45)",
                transform: `rotate(${pos.rot}deg)`, transformOrigin: "50% 90%", padding: "5px 5px 0", zIndex: i,
                overflow: "hidden",
              }}>
                <div style={{ fontSize: 11, marginBottom: 2 }}>{c.icon}</div>
                <div style={{ fontSize: 8, lineHeight: 1.15, fontWeight: 700, color: "#3A2018", maxHeight: 38, overflow: "hidden", ...ui.label }}>{c.name}</div>
                <div style={{ position: "absolute", left: 5, right: 5, bottom: 4, fontSize: 7, color: c.urgency >= 3 ? "#A3252C" : "#5A4636", ...ui.label }}>{c.due}</div>
                {/* red marker: urgent scrawl on the loudest papers */}
                {c.urgency >= 3 && (
                  <div style={{ position: "absolute", top: 3, right: 4, color: "#C43B34", fontSize: 12, fontWeight: 700, transform: "rotate(8deg)", ...ui.label }}>!</div>
                )}
              </div>
            );
          })}
          {deskPaperCount > 0 && (
            <span style={{
              position: "absolute", top: -8, right: -16, zIndex: 5, minWidth: 20, height: 20, padding: "0 4px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "#C43B34", color: "#F3EDDD", fontSize: 11, border: "2px solid #120A04", ...ui.label,
            }}>{deskPaperCount}</span>
          )}
        </div>
        )}

        {/* ---- Tasks chip: shows live open-task count, opens the overview.
             Full task system still to come — this is just the doorbell. ---- */}
        <div style={{ position: "absolute", right: 10, bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)", zIndex: 105 }}>
          <button onClick={() => setScreen("menu")} style={{ position: "relative", display: "flex", alignItems: "center", gap: 7, padding: "9px 13px", cursor: "pointer", ...ui.frame }}>
            <span style={{ fontSize: 14 }}>📋</span>
            <span style={{ color: "#F2E4C0", fontSize: 13, ...ui.label }}>Tasks</span>
            <span style={{ fontSize: 11, color: "#C9B896", ...ui.label }}>{tasks.filter(isTaskOpen).length}</span>
            {pressure > 0 && (
              <span className={pressure >= 2 ? "redPulse" : undefined} style={{ position: "absolute", top: -5, right: -5, width: 12, height: 12, borderRadius: "50%", background: "#C43B34", border: "2px solid #120A04" }} />
            )}
          </button>
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
                        min="0"
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
                        disabled={!!busy || sellAmount === "" || Number.isNaN(parseFloat(sellAmount)) || parseFloat(sellAmount) < 0}
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

        {/* ---- next-layer screens: full-screen overlays above the hub.
             The apartment stays mounted underneath, state intact. ---- */}
        <ScreenLayer
          screen={screen}
          go={setScreen}
          tasks={tasks}
          setTasks={setTasks}
          handled={handled}
          openHandledSheet={() => { setScreen("apartment"); setInvOpen(true); }}
          busy={!!busy}
          playSfx={(name) => { if (name === "stamp") playStampSfx(); }}
          session={session}
          onSessionBump={onSessionBump}
          rewardToast={rewardToast}
          appointments={appointments}
          setAppointments={setAppointments}
          phoneNudge={phoneNudge}
          clearPhoneNudge={() => setPhoneNudge(null)}
        />
        {screen === "apartment" && phoneNudge && (phoneNudge.kind === "remind" || phoneNudge.kind === "overdue") && (
          <IncomingPhoneCue onAnswer={() => setScreen("desk")} />
        )}
        <RewardToast text={screen === "apartment" ? rewardToast : null} />
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
            <div style={{ color: "#C9B896", fontSize: 13, marginTop: 5, ...ui.label }}>
              {dateLabel}
            </div>
            <div style={{ color: "#8A7350", fontSize: 12, marginTop: 3, ...ui.label }}>
              {daysLeft === 0 ? "Move day" : `${daysLeft} days left`}
            </div>
          </div>

          {/* ---- HUD: room quest (center-top) ---- */}
          <div style={{
            position: "absolute", left: "50%", top: 12, transform: "translateX(-50%)",
            padding: "8px 16px", textAlign: "center", zIndex: 200, minWidth: 120, ...ui.frame,
          }}>
            <div style={{ color: "#F2E4C0", fontSize: 15, ...ui.label }}>{room.name}</div>
            <div style={{ color: "#C9B896", fontSize: 12, marginTop: 3, ...ui.label }}>
              {total > 0 ? `${clearedCount}/${total}` : "—"}
            </div>
            {total > 0 && (
              <div style={{ marginTop: 5, width: "100%", height: 8, background: "#120A04", border: "2px solid #4A2E17" }}>
                <div style={{
                  width: `${Math.round((clearedCount / total) * 100)}%`, height: "100%",
                  background: "linear-gradient(#8FD14F,#5EA032)",
                }} />
              </div>
            )}
          </div>

          {/* ---- HUD: top-right coins + boxes + undo ---- */}
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
              title="Boxes packed (apartment-wide)"
              style={{ padding: "6px 12px", color: "#F2E4C0", fontSize: 14, cursor: "pointer", ...ui.frame, ...ui.label }}
            >
              📦 {globalPacked}/{globalTotal}
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
                          min="0"
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
                          disabled={!!packingId || !!sellingId || sellAmount === "" || Number.isNaN(parseFloat(sellAmount)) || parseFloat(sellAmount) < 0}
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
              {room.name} · {clearedCount}/{total}
              <span style={{ color: "#8A7350" }}> · </span>
              📦 {globalPacked}/{globalTotal}
              <span style={{ color: "#8A7350" }}> · </span>
              {daysLeft === 0 ? "Move day" : `${daysLeft}d left`}
            </span>
          </div>
        </div>
      </div>

      {donateToastEl}
      <RewardToast text={screen === "apartment" ? rewardToast : null} />
      {screen === "apartment" && phoneNudge && (phoneNudge.kind === "remind" || phoneNudge.kind === "overdue") && (
        <IncomingPhoneCue onAnswer={() => setScreen("desk")} />
      )}
      <ScreenLayer
        screen={screen}
        go={setScreen}
        tasks={tasks}
        setTasks={setTasks}
        handled={handled}
        openHandledSheet={() => { setScreen("apartment"); setInvOpen(true); }}
        busy={!!busy}
        playSfx={(name) => { if (name === "stamp") playStampSfx(); }}
        session={session}
        onSessionBump={onSessionBump}
        rewardToast={rewardToast}
        appointments={appointments}
        setAppointments={setAppointments}
        phoneNudge={phoneNudge}
        clearPhoneNudge={() => setPhoneNudge(null)}
      />
    </div>
  );
}
