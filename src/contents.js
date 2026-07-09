/* contents.js — items living inside closed-storage objects across the apartment.
 *
 * Each key is `${roomId}:${storageId}` (matching the objState sk() namespace).
 * Each value is an array of items:
 *   { id, name, spr: { w, h, draw(ctx) }, value? }
 *
 * `spr` follows the same { w, h, draw } shape PixelCanvas expects, so swapping
 * a procedural sprite for a PNG later is a one-line change (replace draw() with
 * an image-draw helper, or extend PixelCanvas to accept an img src).
 *
 * For now these use tiny procedural sprites built from the BedroomSlice palette
 * + helpers (r, outlineRect) so the feature is clickable end-to-end without
 * needing the final PNGs. Pantry is the pilot; other rooms are stubbed so the
 * wiring is visible but not overwhelming.
 */

// local copies of the palette + helpers so this file is standalone until PNGs arrive.
// (kept in sync with BedroomSlice.jsx — once sprites move to PNGs these are moot)
const P = {
  out: "#221306",
  wood: "#5A381F", woodDark: "#3E2413", woodMid: "#6E452A", woodLight: "#7F5230", woodHi: "#96653C",
  cream: "#EFE7D2", creamLo: "#DBCFAF",
  white: "#F3EDDD", whiteLo: "#DDD4BD",
  mustard: "#C9942E", mustardHi: "#DDAB45", mustardLo: "#A87823",
  burgundy: "#7C2E37", burgundyLo: "#591F27",
  teal: "#5C8C7C", tealLo: "#44695B", tealHi: "#6FA08E",
  green: "#5D7C3B", greenLo: "#465F2B", greenHi: "#77974C",
  red: "#A3252C", redHi: "#C74B4F",
  gold: "#D9A33C", goldHi: "#EFC463",
  glass: "#C9DCD2", glassHi: "#E9F0E4", glassLo: "#AEC6BA",
  card: "#C08A4A", cardLo: "#9C6C36", cardHi: "#D3A263",
};

const r = (ctx, c, x, y, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
const outlineRect = (ctx, c, x, y, w, h) => {
  r(ctx, c, x, y, w, 1); r(ctx, c, x + y + h - 1, w, 1);
  r(ctx, c, x, y, 1, h); r(ctx, c, x + w - 1, y, 1, h);
};

// ---- tiny placeholder item sprites (procedural, swappable for PNGs later) ----

const cerealBox = {
  w: 8, h: 12,
  draw(ctx) {
    r(ctx, P.red, 0, 0, 8, 12);
    outlineRect(ctx, P.out, 0, 0, 8, 12);
    r(ctx, P.mustardHi, 1, 2, 6, 1);
    r(ctx, P.cream, 1, 9, 6, 1);
  },
};

const pastaBag = {
  w: 7, h: 9,
  draw(ctx) {
    r(ctx, P.creamLo, 0, 0, 7, 9);
    outlineRect(ctx, P.out, 0, 0, 7, 9);
    r(ctx, P.mustard, 1, 1, 5, 2);
  },
};

const soupCan = {
  w: 6, h: 8,
  draw(ctx) {
    r(ctx, P.teal, 0, 0, 6, 8);
    outlineRect(ctx, P.out, 0, 0, 6, 8);
    r(ctx, P.whiteLo, 0, 0, 6, 1);
    r(ctx, P.cream, 1, 3, 4, 2);
  },
};

const spiceJar = {
  w: 5, h: 7,
  draw(ctx) {
    r(ctx, P.burgundy, 0, 0, 5, 7);
    outlineRect(ctx, P.out, 0, 0, 5, 7);
    r(ctx, P.gold, 1, 0, 3, 1);
  },
};

const mug = {
  w: 6, h: 6,
  draw(ctx) {
    r(ctx, P.white, 0, 1, 5, 5);
    outlineRect(ctx, P.out, 0, 1, 5, 5);
    r(ctx, P.out, 5, 2, 1, 3);
    r(ctx, P.whiteLo, 0, 0, 5, 1);
  },
};

const towel = {
  w: 8, h: 5,
  draw(ctx) {
    r(ctx, P.tealHi, 0, 0, 8, 5);
    outlineRect(ctx, P.out, 0, 0, 8, 5);
    r(ctx, P.tealLo, 0, 2, 8, 1);
  },
};

const book = {
  w: 7, h: 10,
  draw(ctx) {
    r(ctx, P.burgundy, 0, 0, 7, 10);
    outlineRect(ctx, P.out, 0, 0, 7, 10);
    r(ctx, P.gold, 1, 1, 5, 1);
    r(ctx, P.cream, 1, 8, 5, 1);
  },
};

const sock = {
  w: 6, h: 8,
  draw(ctx) {
    r(ctx, P.teal, 0, 0, 6, 8);
    outlineRect(ctx, P.out, 0, 0, 6, 8);
    r(ctx, P.tealHi, 0, 0, 6, 2);
  },
};

const bottle = {
  w: 5, h: 10,
  draw(ctx) {
    r(ctx, P.out, 1, 0, 3, 2);
    r(ctx, P.out, 0, 2, 5, 8);
    r(ctx, P.green, 1, 3, 3, 6); r(ctx, P.greenHi, 1, 3, 3, 1);
  },
};

const binder = {
  w: 8, h: 10,
  draw(ctx) {
    r(ctx, P.burgundy, 0, 0, 8, 10);
    outlineRect(ctx, P.out, 0, 0, 8, 10);
    r(ctx, P.white, 2, 2, 4, 1);
    r(ctx, P.white, 2, 7, 4, 1);
  },
};

const photo = {
  w: 7, h: 9,
  draw(ctx) {
    r(ctx, P.woodDark, 0, 0, 7, 9);
    outlineRect(ctx, P.out, 0, 0, 7, 9);
    r(ctx, P.cream, 1, 1, 5, 7);
    r(ctx, P.red, 2, 3, 3, 2);
  },
};

const remote = {
  w: 8, h: 4,
  draw(ctx) {
    r(ctx, P.out, 0, 0, 8, 4);
    r(ctx, P.woodDark, 1, 1, 6, 2);
    r(ctx, P.red, 2, 1, 1, 1); r(ctx, P.red, 5, 1, 1, 1);
  },
};

const plate = {
  w: 8, h: 8,
  draw(ctx) {
    r(ctx, P.white, 0, 0, 8, 8);
    outlineRect(ctx, P.out, 0, 0, 8, 8);
    r(ctx, P.whiteLo, 2, 2, 4, 4);
    outlineRect(ctx, P.creamLo, 2, 2, 4, 4);
  },
};

const glass_cup = {
  w: 5, h: 6,
  draw(ctx) {
    r(ctx, P.glass, 0, 0, 5, 6);
    outlineRect(ctx, P.out, 0, 0, 5, 6);
    r(ctx, P.glassHi, 1, 1, 1, 4);
  },
};

// ---- the map: which storage objects contain what ----

export const CONTENTS = {
  // kitchen — pilot room
  "kitchen:pantry": [
    { id: "cereal_1",  name: "Cereal Box",        spr: cerealBox, value: 2 },
    { id: "pasta_1",   name: "Pasta Bag",          spr: pastaBag,  value: 1 },
    { id: "soup_1",    name: "Soup Can",            spr: soupCan,   value: 1 },
    { id: "soup_2",    name: "Soup Can",            spr: soupCan,   value: 1 },
    { id: "spice_1",   name: "Spice Jar",           spr: spiceJar,  value: 3 },
    { id: "spice_2",   name: "Spice Jar",           spr: spiceJar,  value: 3 },
  ],
  "kitchen:fridge": [
    { id: "leftovers", name: "Leftovers",          spr: soupCan,   value: 0 },
  ],
  // bathroom
  "bathroom:bath_vanity": [
    { id: "towel_1",   name: "Hand Towel",          spr: towel,     value: 4 },
    { id: "towel_2",   name: "Hand Towel",          spr: towel,     value: 4 },
    { id: "mug_1",     name: "Toothbrush Mug",      spr: mug,       value: 2 },
  ],
  // bedroom
  "bedroom:nightstand": [
    { id: "book_1",    name: "Paperback",           spr: book,      value: 5 },
    { id: "mug_2",     name: "Water Glass",         spr: mug,       value: 1 },
  ],
  "bedroom:vanity": [
    { id: "lip_balm",  name: "Lip Balm",            spr: spiceJar,   value: 2 },
    { id: "hair_tie",  name: "Hair Tie",            spr: sock,       value: 1 },
    { id: "perfume",   name: "Perfume",             spr: mug,        value: 15 },
  ],
  "bedroom:dresser": [
    { id: "sock_1",    name: "Sock",               spr: sock,      value: 1 },
    { id: "sock_2",    name: "Sock",               spr: sock,      value: 1 },
    { id: "sock_3",    name: "Sock",               spr: sock,      value: 1 },
  ],
  "bedroom:closet_door": [
    { id: "coat_1",    name: "Winter Coat",        spr: book,      value: 25 },
    { id: "jacket_1",  name: "Denim Jacket",       spr: sock,      value: 18 },
    { id: "shirt_1",   name: "Hang Shirt",         spr: towel,     value: 8 },
  ],
  // office
  "office:desk_hutch": [
    { id: "binder_1",  name: "Binder",             spr: binder,    value: 3 },
    { id: "binder_2",  name: "Binder",             spr: binder,    value: 3 },
    { id: "notebook",  name: "Notebook",           spr: book,      value: 2 },
    { id: "pen_cup",   name: "Pen Cup",            spr: mug,       value: 1 },
    { id: "sticky",    name: "Sticky Notes",       spr: spiceJar,  value: 1 },
  ],
  "office:side_cabinet": [
    { id: "photo_1",   name: "Photo Album",        spr: photo,     value: 9 },
    { id: "binder_3",  name: "Archive Binder",     spr: binder,    value: 4 },
    { id: "book_2",    name: "Reference Book",     spr: book,      value: 12 },
  ],
  // dining
  "dining:bar_cabinet": [
    { id: "bottle_1",  name: "Wine Bottle",        spr: bottle,    value: 14 },
    { id: "bottle_2",  name: "Whiskey Bottle",     spr: bottle,    value: 22 },
    { id: "glass_1",   name: "Crystal Glass",      spr: glass_cup, value: 5 },
    { id: "glass_2",   name: "Crystal Glass",      spr: glass_cup, value: 5 },
  ],
  // living
  "living:tv_hutch": [
    { id: "remote_1",  name: "Remote",            spr: remote,    value: 3 },
    { id: "photo_2",    name: "Framed Photo",      spr: photo,     value: 10 },
    { id: "book_3",     name: "Coffee-Table Book", spr: book,      value: 7 },
    { id: "binder_4",   name: "Manual Binder",     spr: binder,    value: 2 },
  ],
  // kitchen — counter & sink cabinets
  "kitchen:counter_sink": [
    { id: "plate_1",   name: "Dinner Plate",       spr: plate,     value: 4 },
    { id: "plate_2",   name: "Dinner Plate",       spr: plate,     value: 4 },
    { id: "plate_3",   name: "Dinner Plate",       spr: plate,     value: 4 },
    { id: "glass_3",   name: "Drinking Glass",     spr: glass_cup, value: 2 },
    { id: "glass_4",   name: "Drinking Glass",     spr: glass_cup, value: 2 },
    { id: "mug_3",     name: "Coffee Mug",         spr: mug,       value: 2 },
    { id: "mug_4",     name: "Coffee Mug",         spr: mug,       value: 2 },
  ],
};

// convenience predicate: does this room+object have interior contents?
export const hasContents = (roomId, objectId) => !!CONTENTS[`${roomId}:${objectId}`];
