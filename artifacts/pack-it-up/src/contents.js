import assetManifest from "./assets/items/packitup_cropped_assets/manifest.json";

const normalizedAssetModules = import.meta.glob(
  "./assets/items/packitup_cropped_assets/normalized/*.png",
  { eager: true, import: "default" },
);

/* contents.js — items living inside closed-storage objects across the apartment.
 *
 * Each key is `${roomId}:${storageId}` (matching the objState sk() namespace).
 * Each value is an array of items:
 *   { id, name, spr: { w, h, draw(ctx) } | null, value? }
 *
 * `spr` follows the same { w, h, draw } shape PixelCanvas expects. All item art
 * comes from the normalized transparent PNG asset pack; there are no procedural
 * placeholder sprites anymore — if a PNG is missing the item renders with no
 * thumbnail (the name + actions still work) rather than a hand-drawn stand-in.
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
      // The transparent PNG is centered on a square canvas of `canvasSize`, but
      // the actual content only occupies `rawWidth` × `rawHeight` of it. Reporting
      // the raw dims as the sprite's w/h keeps every existing thumbnail / layout
      // formula (which expects low-res content dims, not the full canvas) working
      // unchanged.
      rawWidth: entry.raw_width,
      rawHeight: entry.raw_height,
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

  // The PNG canvas is `canvasSize`×`canvasSize` with the content centered inside
  // an `rawWidth`×`rawHeight` region. We report w/h as the raw content dims so
  // existing thumbnail math (tuned for low-res procedural sprites) works the same,
  // and crop-draw only the content region so no extra transparent padding is
  // baked into the sprite.
  const offsetX = Math.floor((asset.canvasSize - asset.rawWidth) / 2);
  const offsetY = Math.floor((asset.canvasSize - asset.rawHeight) / 2);

  return {
    w: asset.rawWidth,
    h: asset.rawHeight,
    draw(ctx) {
      if (!image.complete || !image.naturalWidth) return;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        image,
        offsetX, offsetY, asset.rawWidth, asset.rawHeight,
        0, 0, asset.rawWidth, asset.rawHeight,
      );
    },
  };
};

// Look up a sprite by manifest filename. Returns the PNG sprite or null (never a
// procedural placeholder) so missing art degrades gracefully to "no thumbnail"
// instead of showing hand-drawn stand-ins.
const art = (filename) => pngSprite(filename);

// ---- the map: which storage objects contain what ----
// Curated 3–6 items per container per the asset-usage plan. Items whose PNG
// exists get a real sprite; items without art get spr: null and render as
// name-only cards in the storage grid.

export const CONTENTS = {
  // ===================== KITCHEN =====================
  "kitchen:pantry": [
    { id: "cereal_1",  name: "Cereal Box",        spr: art("s1_r01_i01_cereal_box.png"),                 value: 2 },
    { id: "pasta_1",   name: "Pasta Box",          spr: art("s1_r01_i02_pasta_box.png"),                   value: 1 },
    { id: "canned_1",  name: "Canned Food",        spr: art("s1_r01_i05_green_canned_food.png"),           value: 1 },
    { id: "sauce_1",   name: "Sauce Jar",           spr: art("s1_r01_i07_red_sauce_jar.png"),               value: 1 },
    { id: "oil_1",     name: "Oil Bottle",          spr: art("s1_r01_i10_oil_bottle.png"),                  value: 4 },
    { id: "cracker_1", name: "Cracker Box",        spr: art("s1_r01_i12_cracker_cookie_box.png"),          value: 3 },
    { id: "chip_1",    name: "Chip Bag",            spr: art("s1_r01_i13_chip_snack_bag.png"),              value: 2 },
    { id: "spice_g",   name: "Green Spice Jar",     spr: art("s1_r02_i01_green_spice_jar.png"),             value: 3 },
    { id: "spice_r",   name: "Paprika",             spr: art("s1_r02_i03_paprika_red_spice_jar.png"),       value: 3 },
    { id: "salt_1",    name: "Salt Shaker",         spr: art("s1_r02_i06_salt_shaker.png"),                 value: 2 },
    { id: "pepper_1",  name: "Pepper Grinder",      spr: art("s1_r02_i07_pepper_grinder.png"),              value: 5 },
    { id: "herb_1",    name: "Green Herb Jar",      spr: art("s1_r02_i08_green_herb_jar.png"),              value: 3 },
  ],
  "kitchen:fridge": [
    { id: "leftovers", name: "Leftovers",          spr: art("s1_r01_i05_green_canned_food.png"),           value: 0 },
  ],
  "kitchen:counter_sink": [
    { id: "plate_1",   name: "Dinner Plate",       spr: art("s1_r08_i01_dinner_plate.png"),                value: 4 },
    { id: "plate_2",   name: "Dinner Plate",       spr: art("s1_r08_i01_dinner_plate.png"),                value: 4 },
    { id: "bowl_1",    name: "Bowl",                spr: art("s1_r08_i03_bowl.png"),                        value: 4 },
    { id: "mug_1",     name: "Red Mug",            spr: art("s1_r08_i04_red_mug.png"),                     value: 2 },
    { id: "mug_2",     name: "Red Mug",            spr: art("s1_r08_i04_red_mug.png"),                     value: 2 },
    { id: "plate_stack", name: "Plate Stack",      spr: art("s1_r08_i06_plate_stack.png"),                 value: 6 },
  ],

  // ===================== BATHROOM =====================
  "bathroom:bath_vanity": [
    // toiletries
    { id: "toothpaste", name: "Toothpaste",         spr: art("s3_r04_i02_toothpaste.png"),                 value: 4 },
    { id: "deodorant",  name: "Deodorant",          spr: art("s3_r04_i03_deodorant.png"),                   value: 4 },
    { id: "soap",       name: "Soap Bar",           spr: art("s3_r04_i04_soap_bar.png"),                   value: 2 },
    { id: "razor",      name: "Razor",              spr: art("s3_r04_i05_razor.png"),                      value: 3 },
    { id: "lotion",     name: "Lotion",             spr: art("s3_r04_i06_lotion_bottle.png"),              value: 5 },
    { id: "floss",      name: "Floss",              spr: art("s3_r04_i07_floss_container.png"),            value: 2 },
    // hair
    { id: "curl_cream", name: "Curl Cream",         spr: art("s3_r02_i04_curl_cream_jar.png"),             value: 6 },
    { id: "hair_oil",   name: "Hair Oil",           spr: art("s3_r02_i06_hair_oil_bottle.png"),            value: 5 },
    { id: "mousse",     name: "Mousse",             spr: art("s3_r02_i08_mousse_bottle.png"),              value: 4 },
    // nails
    { id: "nail_polish", name: "Purple Nail Polish", spr: art("s3_r03_i02_purple_nail_polish.png"),         value: 4 },
    { id: "polish_remover", name: "Polish Remover", spr: art("s3_r03_i03_nail_polish_remover.png"),        value: 3 },
    { id: "nail_file",  name: "Nail File",          spr: art("s3_r03_i05_pink_nail_file.png"),             value: 1 },
    { id: "cuticle",    name: "Cuticle Nippers",    spr: art("s3_r03_i06_cuticle_nippers.png"),            value: 6 },
    { id: "gel_lamp",   name: "UV Gel Lamp",        spr: art("s5_r07_i05_uv_gel_nail_lamp.png"),           value: 25 },
  ],

  // ===================== BEDROOM =====================
  "bedroom:nightstand": [
    { id: "journal",   name: "Blue Journal",       spr: art("s2_r08_i02_blue_journal_keepsake_book.png"),  value: 5 },
    { id: "letter",    name: "Letter / Postcard",  spr: art("s2_r08_i04_letter_postcard.png"),             value: 1 },
    { id: "admit_one", name: "Admit One Ticket",   spr: art("s2_r08_i05_admit_one_ticket.png"),            value: 2 },
    { id: "keepsake",  name: "Green Keepsake Box", spr: art("s2_r08_i09_green_keepsake_box.png"),          value: 8 },
    { id: "pouch",     name: "Quilted Pouch",      spr: art("s5_r08_i01_quilted_pouch.png"),              value: 4 },
    { id: "zip_case",  name: "Small Zip Case",     spr: art("s5_r08_i03_small_zip_case.png"),             value: 3 },
  ],
  "bedroom:vanity": [
    { id: "lipstick",  name: "Lipstick",           spr: art("s2_r09_i01_lipstick.png"),                   value: 2 },
    { id: "blush",     name: "Blush Compact",      spr: art("s2_r09_i03_blush_compact.png"),              value: 1 },
    { id: "eyeshadow", name: "Eyeshadow Palette",  spr: art("s2_r09_i04_eyeshadow_palette.png"),          value: 8 },
    { id: "mascara",   name: "Mascara",            spr: art("s2_r09_i05_mascara_tube_wand.png"),          value: 4 },
    { id: "m_brush",   name: "Makeup Brush",       spr: art("s2_r09_i07_makeup_brush.png"),               value: 3 },
    { id: "perfume",   name: "Perfume",            spr: art("s2_r09_i08_perfume_bottle.png"),             value: 15 },
    { id: "ring",      name: "Ring",               spr: art("s5_r04_i01_ring.png"),                       value: 40 },
    { id: "earrings",  name: "Hoop Earrings",      spr: art("s5_r04_i02_hoop_earrings.png"),               value: 18 },
    { id: "necklace",  name: "Necklace",           spr: art("s5_r04_i03_necklace.png"),                   value: 30 },
    { id: "claw_clip", name: "Claw Clip",          spr: art("s5_r04_i07_claw_clip.png"),                  value: 2 },
  ],
  "bedroom:dresser": [
    { id: "sweater_g", name: "Green Sweater",      spr: art("s2_r01_i01_green_folded_sweater.png"),        value: 8 },
    { id: "jeans",     name: "Folded Jeans",       spr: art("s2_r01_i03_folded_jeans.png"),               value: 10 },
    { id: "sweater_p", name: "Purple Sweater Stack", spr: art("s2_r01_i06_purple_folded_sweater_stack.png"), value: 12 },
  ],
  "bedroom:closet_door": [
    { id: "shirt_w",   name: "White Shirt",        spr: art("s2_r02_i01_white_button_up_shirt.png"),       value: 8 },
    { id: "dress_g",   name: "Green Dress",        spr: art("s2_r02_i03_green_dress.png"),                value: 14 },
    { id: "pants_b",   name: "Black Pants",        spr: art("s2_r02_i05_black_pants.png"),                value: 12 },
    { id: "cardigan",  name: "Beige Cardigan",     spr: art("s2_r02_i06_beige_cardigan.png"),             value: 10 },
    { id: "coat_b",    name: "Brown Coat",        spr: art("s2_r03_i01_brown_long_coat.png"),            value: 25 },
    { id: "peacoat",   name: "Navy Peacoat",       spr: art("s2_r03_i05_navy_peacoat.png"),               value: 18 },
    { id: "sweater_w", name: "Winter Sweater",     spr: art("s2_r04_i01_cream_winter_sweater.png"),       value: 15 },
    { id: "scarf",     name: "Green Scarf",        spr: art("s2_r04_i03_green_scarf.png"),                value: 6 },
    { id: "boots",     name: "Winter Boots",       spr: art("s2_r04_i07_brown_winter_boots.png"),         value: 20 },
    { id: "tote",      name: "Cream Tote",         spr: art("s2_r05_i01_cream_tote_bag.png"),             value: 12 },
    { id: "satchel",   name: "Green Satchel",      spr: art("s2_r05_i05_green_satchel.png"),              value: 16 },
    { id: "sheets",    name: "White Sheet Stack",  spr: art("s2_r07_i02_white_sheet_stack.png"),           value: 7 },
    { id: "quilt",     name: "Patchwork Quilt",    spr: art("s2_r07_i07_patchwork_quilt.png"),             value: 22 },
  ],

  // ===================== OFFICE =====================
  "office:desk_hutch": [
    { id: "pen_cup",   name: "Pen Cup",            spr: art("s3_r08_i01_pen_cup.png"),                    value: 1 },
    { id: "stapler",   name: "Stapler",            spr: art("s3_r08_i03_stapler.png"),                    value: 4 },
    { id: "binder_clip", name: "Binder Clip",      spr: art("s3_r08_i05_binder_clip.png"),               value: 1 },
    { id: "sticky",    name: "Sticky Notes",       spr: art("s3_r08_i06_sticky_notes.png"),               value: 1 },
    { id: "notebook",  name: "Blue Notebook",      spr: art("s3_r08_i07_blue_notebook.png"),              value: 2 },
  ],
  "office:side_cabinet": [
    { id: "passport",  name: "Passport",           spr: art("s3_r05_i01_passport.png"),                   value: 9 },
    { id: "id_card",   name: "ID Card",            spr: art("s3_r05_i02_id_card.png"),                    value: 5 },
    { id: "file_folders", name: "Blue File Folders", spr: art("s3_r05_i03_blue_file_folders.png"),        value: 3 },
    { id: "manila_env", name: "Manila Envelope",   spr: art("s3_r05_i04_manila_envelope.png"),            value: 2 },
    { id: "certificate", name: "Certificate",      spr: art("s3_r05_i05_certificate_official_document.png"), value: 10 },
    { id: "confidential", name: "Confidential Envelope", spr: art("s3_r05_i08_confidential_envelope.png"), value: 8 },
    { id: "bill",      name: "Bill",               spr: art("s3_r06_i03_bill.png"),                       value: 0 },
    { id: "lined_paper", name: "Lined Paper",      spr: art("s3_r06_i05_loose_lined_paper.png"),          value: 1 },
    { id: "yellow_note", name: "Yellow Note",      spr: art("s3_r06_i06_yellow_note.png"),               value: 1 },
  ],

  // ===================== DINING =====================
  "dining:bar_cabinet": [
    // alcohol
    { id: "wine",       name: "Red Wine",          spr: art("s4_r01_i01_red_wine_bottle.png"),            value: 14 },
    { id: "liquor",     name: "Liquor Bottle",     spr: art("s4_r01_i04_liquor_bottle.png"),              value: 22 },
    { id: "shaker",     name: "Cocktail Shaker",   spr: art("s4_r01_i05_cocktail_shaker.png"),            value: 12 },
    { id: "jigger",     name: "Jigger",            spr: art("s4_r01_i06_jigger.png"),                     value: 6 },
    { id: "corkscrew",  name: "Corkscrew",        spr: art("s4_r01_i07_corkscrew.png"),                  value: 4 },
    { id: "opener",     name: "Bottle Opener",    spr: art("s4_r01_i08_bottle_opener.png"),              value: 3 },
    // glassware
    { id: "wine_glass", name: "Wine Glass",        spr: art("s4_r02_i01_red_wine_glass.png"),             value: 5 },
    { id: "champagne",  name: "Champagne Flute",   spr: art("s4_r02_i02_champagne_flute.png"),            value: 5 },
    { id: "rocks",      name: "Rocks Glass",       spr: art("s4_r02_i03_rocks_glass.png"),                value: 4 },
    { id: "martini",    name: "Martini Glass",     spr: art("s4_r02_i05_martini_glass.png"),              value: 6 },
    { id: "shot",       name: "Shot Glass",        spr: art("s4_r02_i07_shot_glass.png"),                 value: 3 },
    // vases
    { id: "vase_bw",    name: "Blue-and-White Vase", spr: art("s4_r03_i01_blue_and_white_vase.png"),      value: 15 },
    { id: "vase_bud",   name: "Green Bud Vase",    spr: art("s4_r03_i02_green_bud_vase_with_leaves.png"),  value: 8 },
    { id: "vase_round", name: "Round Blue Vase",   spr: art("s4_r03_i04_round_blue_and_white_vase.png"),   value: 12 },
    { id: "vase_cream", name: "Tall Cream Vase",   spr: art("s4_r03_i05_tall_cream_vase.png"),            value: 14 },
    { id: "vase_pitch", name: "Green Pitcher Vase", spr: art("s4_r03_i06_green_pitcher_vase.png"),       value: 11 },
    // candles / incense
    { id: "candle_brown", name: "Brown Jar Candle", spr: art("s4_r04_i01_brown_jar_candle.png"),          value: 5 },
    { id: "candle_pillar", name: "Pillar Candle",  spr: art("s4_r04_i02_white_pillar_candle.png"),        value: 5 },
    { id: "candle_tapers", name: "Green Tapers",    spr: art("s4_r04_i03_pair_of_green_taper_candles.png"), value: 4 },
    { id: "incense",     name: "Incense Burner",   spr: art("s4_r04_i06_black_incense_burner.png"),       value: 7 },
    { id: "matchbox",    name: "Matchbox",         spr: art("s4_r04_i08_matchbox.png"),                   value: 2 },
    { id: "holder",      name: "Incense Holder",   spr: art("s4_r04_i09_blue_holder_with_lighters_incense_sticks.png"), value: 4 },
  ],

  // ===================== LIVING =====================
  "living:tv_hutch": [
    { id: "console",   name: "Game Console",       spr: art("s4_r05_i01_game_console.png"),                value: 80 },
    { id: "controller", name: "Game Controller",   spr: art("s4_r05_i03_game_controller.png"),             value: 25 },
    { id: "cards",      name: "Playing Cards",      spr: art("s4_r06_i02_playing_card_deck.png"),          value: 7 },
    { id: "dice",       name: "Dice",               spr: art("s4_r06_i03_dice.png"),                       value: 2 },
    { id: "chess",      name: "Chess Knight",       spr: art("s4_r06_i04_chess_knight.png"),               value: 10 },
    { id: "puzzle",     name: "Puzzle Box",         spr: art("s4_r06_i07_puzzle_box.png"),                 value: 8 },
    { id: "fabric_floral", name: "Floral Fabric",  spr: art("s4_r07_i01_floral_folded_fabric.png"),        value: 5 },
    { id: "fabric_plaid",  name: "Plaid Fabric",   spr: art("s4_r07_i02_green_plaid_folded_fabric.png"),   value: 5 },
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
