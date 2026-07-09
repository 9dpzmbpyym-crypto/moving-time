import assetManifest from "./assets/items/packitup_cropped_assets/manifest.json";

const normalizedAssetModules = import.meta.glob(
  "./assets/items/packitup_cropped_assets/normalized/*.png",
  { eager: true, import: "default" },
);

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
 * Final item art comes from the normalized transparent PNG asset pack. The tiny
 * procedural sprites remain as graceful fallbacks for items without custom art.
 */

const normalizedModuleKey = (filename) =>
  `./assets/items/packitup_cropped_assets/normalized/${filename}`;

// Manifest-backed registry. Keeping every metadata field here makes this useful
// for later inventory/task/log screens without coupling those screens to files.
export const ITEM_ASSETS = Object.fromEntries(
  assetManifest.map((entry) => [
    entry.asset_filename.replace(/\.png$/i, ""),
    {
      id: entry.asset_filename.replace(/\.png$/i, ""),
      filename: entry.asset_filename,
      src: normalizedAssetModules[normalizedModuleKey(entry.asset_filename)] || null,
      room: entry.rooms,
      category: entry.categories,
      usageType: entry.usage_type,
      displayName: entry.source_label,
      canvasSize: entry.canvas_size_actual,
    },
  ]),
);

const loadedImages = new Map();
const imageReadyPromises = [];

const pngSprite = (filename) => {
  const asset = ITEM_ASSETS[filename.replace(/\.png$/i, "")];
  if (!asset?.src || typeof Image === "undefined") return null;

  let image = loadedImages.get(filename);
  if (!image) {
    image = new Image();
    image.decoding = "async";
    const ready = new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      // A broken optional asset must never block the storage screen.
      image.addEventListener("error", resolve, { once: true });
    });
    imageReadyPromises.push(ready);
    image.src = asset.src;
    loadedImages.set(filename, image);
  }

  return {
    w: asset.canvasSize,
    h: asset.canvasSize,
    draw(ctx) {
      if (!image.complete || !image.naturalWidth) return;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, 0, 0, asset.canvasSize, asset.canvasSize);
    },
  };
};

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

const withArt = (filename, fallback) => pngSprite(filename) || fallback;

const ART = {
  cereal: withArt("s1_r01_i01_cereal_box.png", cerealBox),
  pasta: withArt("s1_r01_i02_pasta_box.png", pastaBag),
  cannedFood: withArt("s1_r01_i05_green_canned_food.png", soupCan),
  sauce: withArt("s1_r01_i07_red_sauce_jar.png", soupCan),
  spiceGreen: withArt("s1_r02_i01_green_spice_jar.png", spiceJar),
  spiceRed: withArt("s1_r02_i03_paprika_red_spice_jar.png", spiceJar),
  plate: withArt("s1_r08_i01_dinner_plate.png", plate),
  bowl: withArt("s1_r08_i03_bowl.png", plate),
  redMug: withArt("s1_r08_i04_red_mug.png", mug),
  foldedSweater: withArt("s2_r01_i01_green_folded_sweater.png", sock),
  foldedJeans: withArt("s2_r01_i03_folded_jeans.png", sock),
  sweaterStack: withArt("s2_r01_i06_purple_folded_sweater_stack.png", sock),
  journal: withArt("s2_r08_i02_blue_journal_keepsake_book.png", book),
  letter: withArt("s2_r08_i04_letter_postcard.png", photo),
  lipstick: withArt("s2_r09_i01_lipstick.png", spiceJar),
  blush: withArt("s2_r09_i03_blush_compact.png", spiceJar),
  eyeshadow: withArt("s2_r09_i04_eyeshadow_palette.png", spiceJar),
  mascara: withArt("s2_r09_i05_mascara_tube_wand.png", spiceJar),
  perfume: withArt("s2_r09_i08_perfume_bottle.png", mug),
  shirt: withArt("s2_r02_i01_white_button_up_shirt.png", towel),
  dress: withArt("s2_r02_i03_green_dress.png", towel),
  coat: withArt("s2_r03_i01_brown_long_coat.png", book),
  peacoat: withArt("s2_r03_i05_navy_peacoat.png", book),
  prescription: withArt("s3_r01_i01_prescription_bottle.png", bottle),
  blisterPack: withArt("s3_r01_i03_pill_blister_pack.png", spiceJar),
  pillOrganizer: withArt("s3_r01_i08_weekly_pill_organizer.png", binder),
  toothpaste: withArt("s3_r04_i02_toothpaste.png", bottle),
  deodorant: withArt("s3_r04_i03_deodorant.png", bottle),
  soap: withArt("s3_r04_i04_soap_bar.png", towel),
  razor: withArt("s3_r04_i05_razor.png", bottle),
  lotion: withArt("s3_r04_i06_lotion_bottle.png", bottle),
  passport: withArt("s3_r05_i01_passport.png", book),
  fileFolders: withArt("s3_r05_i03_blue_file_folders.png", binder),
  penCup: withArt("s3_r08_i01_pen_cup.png", mug),
  stickyNotes: withArt("s3_r08_i06_sticky_notes.png", spiceJar),
  notebook: withArt("s3_r08_i07_blue_notebook.png", book),
  wine: withArt("s4_r01_i01_red_wine_bottle.png", bottle),
  liquor: withArt("s4_r01_i04_liquor_bottle.png", bottle),
  wineGlass: withArt("s4_r02_i01_red_wine_glass.png", glass_cup),
  champagne: withArt("s4_r02_i02_champagne_flute.png", glass_cup),
  gameConsole: withArt("s4_r05_i01_game_console.png", remote),
  controller: withArt("s4_r05_i03_game_controller.png", remote),
  cards: withArt("s4_r06_i02_playing_card_deck.png", book),
  dice: withArt("s4_r06_i03_dice.png", spiceJar),
};

// ---- the map: which storage objects contain what ----

export const CONTENTS = {
  // kitchen — pilot room
  "kitchen:pantry": [
    { id: "cereal_1",  name: "Cereal Box",          spr: ART.cereal, value: 2 },
    { id: "pasta_1",   name: "Pasta Box",           spr: ART.pasta, value: 1 },
    { id: "soup_1",    name: "Canned Food",         spr: ART.cannedFood, value: 1 },
    { id: "soup_2",    name: "Sauce Jar",           spr: ART.sauce, value: 1 },
    { id: "spice_1",   name: "Green Spice Jar",     spr: ART.spiceGreen, value: 3 },
    { id: "spice_2",   name: "Paprika",             spr: ART.spiceRed, value: 3 },
  ],
  "kitchen:fridge": [
    { id: "leftovers", name: "Leftovers",          spr: soupCan,   value: 0 },
  ],
  // bathroom
  "bathroom:bath_vanity": [
    { id: "towel_1",   name: "Toothpaste",          spr: ART.toothpaste, value: 4 },
    { id: "towel_2",   name: "Deodorant",           spr: ART.deodorant, value: 4 },
    { id: "mug_1",     name: "Soap",                spr: ART.soap, value: 2 },
    { id: "razor_1",   name: "Razor",               spr: ART.razor, value: 3 },
    { id: "lotion_1",  name: "Lotion",              spr: ART.lotion, value: 5 },
  ],
  // bedroom
  "bedroom:nightstand": [
    { id: "book_1",    name: "Blue Journal",        spr: ART.journal, value: 5 },
    { id: "mug_2",     name: "Letter / Postcard",   spr: ART.letter, value: 1 },
  ],
  "bedroom:vanity": [
    { id: "lip_balm",  name: "Lipstick",            spr: ART.lipstick, value: 2 },
    { id: "hair_tie",  name: "Blush Compact",       spr: ART.blush, value: 1 },
    { id: "eyeshadow", name: "Eyeshadow Palette",   spr: ART.eyeshadow, value: 8 },
    { id: "mascara",   name: "Mascara",             spr: ART.mascara, value: 4 },
    { id: "perfume",   name: "Perfume",             spr: ART.perfume, value: 15 },
  ],
  "bedroom:dresser": [
    { id: "sock_1",    name: "Green Sweater",       spr: ART.foldedSweater, value: 8 },
    { id: "sock_2",    name: "Folded Jeans",        spr: ART.foldedJeans, value: 10 },
    { id: "sock_3",    name: "Purple Sweater Stack", spr: ART.sweaterStack, value: 12 },
  ],
  "bedroom:closet_door": [
    { id: "coat_1",    name: "Brown Coat",          spr: ART.coat, value: 25 },
    { id: "jacket_1",  name: "Navy Peacoat",       spr: ART.peacoat, value: 18 },
    { id: "shirt_1",   name: "White Shirt",         spr: ART.shirt, value: 8 },
    { id: "dress_1",   name: "Green Dress",         spr: ART.dress, value: 14 },
  ],
  // office
  "office:desk_hutch": [
    { id: "binder_1",  name: "Binder",             spr: binder,    value: 3 },
    { id: "binder_2",  name: "Blue File Folders",  spr: ART.fileFolders, value: 3 },
    { id: "notebook",  name: "Blue Notebook",      spr: ART.notebook, value: 2 },
    { id: "pen_cup",   name: "Pen Cup",            spr: ART.penCup, value: 1 },
    { id: "sticky",    name: "Sticky Notes",       spr: ART.stickyNotes, value: 1 },
  ],
  "office:side_cabinet": [
    { id: "photo_1",   name: "Passport",           spr: ART.passport, value: 9 },
    { id: "binder_3",  name: "Blue File Folders",  spr: ART.fileFolders, value: 4 },
    { id: "book_2",    name: "Reference Book",     spr: book,      value: 12 },
  ],
  // dining
  "dining:bar_cabinet": [
    { id: "bottle_1",  name: "Red Wine",           spr: ART.wine, value: 14 },
    { id: "bottle_2",  name: "Liquor Bottle",      spr: ART.liquor, value: 22 },
    { id: "glass_1",   name: "Wine Glass",         spr: ART.wineGlass, value: 5 },
    { id: "glass_2",   name: "Champagne Flute",    spr: ART.champagne, value: 5 },
  ],
  // living
  "living:tv_hutch": [
    { id: "remote_1",  name: "Game Console",       spr: ART.gameConsole, value: 80 },
    { id: "photo_2",   name: "Game Controller",    spr: ART.controller, value: 25 },
    { id: "book_3",    name: "Playing Cards",      spr: ART.cards, value: 7 },
    { id: "binder_4",  name: "Dice",               spr: ART.dice, value: 2 },
  ],
  // kitchen — counter & sink cabinets
  "kitchen:counter_sink": [
    { id: "plate_1",   name: "Dinner Plate",       spr: ART.plate, value: 4 },
    { id: "plate_2",   name: "Dinner Plate",       spr: ART.plate, value: 4 },
    { id: "plate_3",   name: "Bowl",               spr: ART.bowl, value: 4 },
    { id: "glass_3",   name: "Drinking Glass",     spr: glass_cup, value: 2 },
    { id: "glass_4",   name: "Drinking Glass",     spr: glass_cup, value: 2 },
    { id: "mug_3",     name: "Red Mug",            spr: ART.redMug, value: 2 },
    { id: "mug_4",     name: "Red Mug",            spr: ART.redMug, value: 2 },
  ],
};

// Promise consumed by StorageScreen to force a repaint after asynchronously
// decoded PNGs become drawable. In production the URLs are base64-inlined, but
// image decode can still finish just after the first canvas paint.
export const itemArtReady = Promise.all(imageReadyPromises);

// convenience predicate: does this room+object have interior contents?
export const hasContents = (roomId, objectId) => !!CONTENTS[`${roomId}:${objectId}`];

// shared count of how many items inside a storage object are still unhandled
// (not packed / sold / donated). Used by both the drawer-glow render block and
// the .portal silhouette glow so they turn off together once a container is
// emptied. `contentsState` is the per-item state map keyed by `${storageKey}:${itemId}`.
export const remainingCount = (roomId, objectId, contentsState) => {
  const storageKey = `${roomId}:${objectId}`;
  const items = CONTENTS[storageKey];
  if (!items) return 0;
  let remaining = 0;
  for (const it of items) {
    const st = contentsState[`${storageKey}:${it.id}`];
    if (!st || (!st.packed && !st.sold && !st.donated)) remaining += 1;
  }
  return remaining;
};
