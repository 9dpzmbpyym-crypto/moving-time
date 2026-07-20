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
  // baked into the sprite. Clamp the crop so off-center manifest values can't
  // read past the image edge.
  const canvas = Math.max(1, asset.canvasSize | 0);
  const rawW = Math.max(1, Math.min(asset.rawWidth | 0, canvas));
  const rawH = Math.max(1, Math.min(asset.rawHeight | 0, canvas));
  let offsetX = Math.floor((canvas - rawW) / 2);
  let offsetY = Math.floor((canvas - rawH) / 2);
  offsetX = Math.max(0, Math.min(offsetX, canvas - rawW));
  offsetY = Math.max(0, Math.min(offsetY, canvas - rawH));

  return {
    w: rawW,
    h: rawH,
    draw(ctx) {
      if (!image.complete || !image.naturalWidth) return;
      ctx.imageSmoothingEnabled = false;
      const maxW = image.naturalWidth;
      const maxH = image.naturalHeight;
      const sx = Math.max(0, Math.min(offsetX, Math.max(0, maxW - 1)));
      const sy = Math.max(0, Math.min(offsetY, Math.max(0, maxH - 1)));
      const sw = Math.max(1, Math.min(rawW, maxW - sx));
      const sh = Math.max(1, Math.min(rawH, maxH - sy));
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, rawW, rawH);
    },
  };
};

// Look up a sprite by manifest filename. Returns the PNG sprite or null (never a
// procedural placeholder) so missing art degrades gracefully to "no thumbnail"
// instead of showing hand-drawn stand-ins.
const art = (filename) => pngSprite(filename);

/** Room-prop sprite: PNG pixels ≈ screen pixels (canvas cells = raw/4). */
export function roomItemSprite(filename) {
  const asset = ITEM_ASSETS[filename.replace(/\.png$/i, "")];
  if (!asset?.src || typeof Image === "undefined") {
    return { w: 8, h: 8, draw() {} };
  }
  const base = pngSprite(filename);
  if (!base) return { w: 8, h: 8, draw() {} };
  const PX = 4; // matches CELL in BedroomSlice
  const w = Math.max(1, Math.round(base.w / PX));
  const h = Math.max(1, Math.round(base.h / PX));
  return {
    w,
    h,
    draw(ctx) {
      // Reuse clamped crop from pngSprite; scale into room cells.
      ctx.save();
      ctx.scale(w / base.w, h / base.h);
      base.draw(ctx);
      ctx.restore();
    },
  };
}

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
    { id: "cat_food",  name: "Dry Cat Food",        spr: art("s1_r12_i03_dry_cat_food_bag.png"),            value: 8 },
    { id: "wet_food",  name: "Wet Cat Food",        spr: art("s1_r12_i04_wet_food_can.png"),               value: 2 },
  ],
  "kitchen:fridge": [
    { id: "leftovers", name: "Leftovers",          spr: art("s1_r01_i05_green_canned_food.png"),           value: 0 },
    { id: "tupper_1",  name: "Food Container",     spr: art("s1_r09_i02_rectangular_food_container.png"),  value: 3 },
    { id: "tupper_2",  name: "Storage Stack",      spr: art("s1_r09_i03_stacked_food_storage_containers.png"), value: 5 },
    { id: "bento_1",   name: "Bento Box",          spr: art("s1_r09_i06_white_bento_storage_box.png"),     value: 4 },
  ],
  // Counter & sink: 4 tap zones — utensil/junk drawers (upper L/R),
  // cookware / under-sink cabinets (lower L/R).
  "kitchen:counter_sink": [
    { id: "fork_1",    name: "Fork",               zone: "utensils", spr: art("s1_r03_i01_fork.png"),         value: 1 },
    { id: "spoon_1",   name: "Spoon",              zone: "utensils", spr: art("s1_r03_i02_spoon.png"),        value: 1 },
    { id: "knife_1",   name: "Table Knife",        zone: "utensils", spr: art("s1_r03_i03_table_knife.png"),  value: 1 },
    { id: "spatula_1", name: "Spatula",            zone: "utensils", spr: art("s1_r03_i05_spatula.png"),      value: 3 },
    { id: "whisk_1",   name: "Whisk",              zone: "utensils", spr: art("s1_r03_i06_whisk.png"),        value: 3 },
    { id: "tongs_1",   name: "Tongs",              zone: "utensils", spr: art("s1_r03_i08_tongs.png"),        value: 3 },
    { id: "wood_spoon", name: "Wooden Spoon",      zone: "utensils", spr: art("s1_r03_i09_wooden_spoon.png"), value: 2 },
    { id: "batteries", name: "Batteries",          zone: "junk", spr: art("s1_r04_i01_batteries.png"),    value: 2 },
    { id: "tape_roll", name: "Tape Roll",          zone: "junk", spr: art("s1_r04_i03_tape_roll.png"),    value: 1 },
    { id: "blue_pen",  name: "Blue Pen",           zone: "junk", spr: art("s1_r04_i04_blue_pen.png"),     value: 1 },
    { id: "rubber_bands", name: "Rubber Bands",    zone: "junk", spr: art("s1_r04_i07_rubber_bands.png"), value: 1 },
    { id: "flashlight", name: "Flashlight",        zone: "junk", spr: art("s1_r04_i09_flashlight.png"),  value: 4 },
    { id: "paper_clips", name: "Paper Clips",      zone: "junk", spr: art("s1_r04_i10_paper_clips.png"), value: 1 },
    { id: "screwdriver", name: "Screwdriver",      zone: "junk", spr: art("s1_r04_i12_screwdriver.png"), value: 3 },
    { id: "plate_1",   name: "Dinner Plate",       zone: "cookware", spr: art("s1_r08_i01_dinner_plate.png"), value: 4 },
    { id: "plate_2",   name: "Dinner Plate",       zone: "cookware", spr: art("s1_r08_i01_dinner_plate.png"), value: 4 },
    { id: "bowl_1",    name: "Bowl",               zone: "cookware", spr: art("s1_r08_i03_bowl.png"),         value: 4 },
    { id: "mug_1",     name: "Red Mug",            zone: "cookware", spr: art("s1_r08_i04_red_mug.png"),      value: 2 },
    { id: "mug_2",     name: "Red Mug",            zone: "cookware", spr: art("s1_r08_i04_red_mug.png"),      value: 2 },
    { id: "plate_stack", name: "Plate Stack",      zone: "cookware", spr: art("s1_r08_i06_plate_stack.png"),  value: 6 },
    { id: "skillet",   name: "Skillet",            zone: "cookware", spr: art("s1_r06_i01_skillet.png"),      value: 12 },
    { id: "saucepan",  name: "Saucepan",           zone: "cookware", spr: art("s1_r06_i03_saucepan.png"),     value: 10 },
    { id: "stock_pot", name: "Stock Pot",          zone: "cookware", spr: art("s1_r06_i04_stock_pot.png"),    value: 14 },
    { id: "pot_lid",   name: "Pot Lid",            zone: "cookware", spr: art("s1_r06_i05_pot_lid.png"),      value: 4 },
    { id: "baking_sheet", name: "Baking Sheet",    zone: "cookware", spr: art("s1_r07_i01_baking_sheet.png"), value: 6 },
    { id: "muffin_tin", name: "Muffin Tin",       zone: "cookware", spr: art("s1_r07_i02_muffin_tin.png"),   value: 5 },
    { id: "casserole", name: "Casserole Dish",     zone: "cookware", spr: art("s1_r07_i04_casserole_dish.png"), value: 8 },
    { id: "cleaner",   name: "Spray Cleaner",      zone: "under_sink", spr: art("s1_r05_i01_spray_cleaner.png"), value: 3 },
    { id: "sponge",    name: "Sponge",             zone: "under_sink", spr: art("s1_r05_i02_sponge.png"),       value: 1 },
    { id: "cleaner_g", name: "Green Cleaner",      zone: "under_sink", spr: art("s1_r05_i04_green_cleaning_bottle.png"), value: 3 },
    { id: "gloves",    name: "Rubber Gloves",      zone: "under_sink", spr: art("s1_r05_i07_rubber_gloves.png"), value: 2 },
    { id: "trash_bags", name: "Trash Bags",        zone: "under_sink", spr: art("s1_r05_i08_trash_bags.png"),  value: 2 },
  ],

  // ===================== BATHROOM =====================
  "bathroom:bath_vanity": [
    { id: "curl_cream", name: "Curl Cream",         spr: art("s3_r02_i04_curl_cream_jar.png"),             value: 6 },
    { id: "hair_oil",   name: "Hair Oil",           spr: art("s3_r02_i06_hair_oil_bottle.png"),            value: 5 },
    { id: "mousse",     name: "Mousse",             spr: art("s3_r02_i08_mousse_bottle.png"),              value: 4 },
    { id: "nail_polish", name: "Purple Nail Polish", spr: art("s3_r03_i02_purple_nail_polish.png"),         value: 4 },
    { id: "polish_remover", name: "Polish Remover", spr: art("s3_r03_i03_nail_polish_remover.png"),        value: 3 },
    { id: "nail_file",  name: "Nail File",          spr: art("s3_r03_i05_pink_nail_file.png"),             value: 1 },
    { id: "cuticle",    name: "Cuticle Nippers",    spr: art("s3_r03_i06_cuticle_nippers.png"),            value: 6 },
    { id: "gel_lamp",   name: "UV Gel Lamp",        spr: art("s5_r07_i05_uv_gel_nail_lamp.png"),           value: 25 },
    { id: "rx_bottle",  name: "Prescription Bottle", spr: art("s3_r01_i01_prescription_bottle.png"),       value: 8 },
    { id: "pill_pack",  name: "Pill Blister Pack",  spr: art("s3_r01_i03_pill_blister_pack.png"),          value: 4 },
    { id: "pill_org",   name: "Weekly Pill Organizer", spr: art("s3_r01_i08_weekly_pill_organizer.png"),   value: 6 },
    { id: "cat_med_liq", name: "Liquid Cat Medicine", spr: art("s4_r10_i03_liquid_cat_medicine_bottle.png"), value: 12 },
    { id: "cat_med",    name: "Cat Medication",     spr: art("s4_r10_i01_cat_medication_bottle.png"),      value: 10 },
  ],
  "bathroom:toiletries": [
    { id: "toothpaste", name: "Toothpaste",         spr: art("s3_r04_i02_toothpaste.png"),                 value: 4 },
    { id: "deodorant",  name: "Deodorant",          spr: art("s3_r04_i03_deodorant.png"),                   value: 4 },
    { id: "soap",       name: "Soap Bar",           spr: art("s3_r04_i04_soap_bar.png"),                   value: 2 },
    { id: "razor",      name: "Razor",              spr: art("s3_r04_i05_razor.png"),                      value: 3 },
    { id: "lotion",     name: "Lotion",             spr: art("s3_r04_i06_lotion_bottle.png"),              value: 5 },
    { id: "floss",      name: "Floss",              spr: art("s3_r04_i07_floss_container.png"),            value: 2 },
    { id: "perfume",   name: "Perfume",            spr: art("s2_r09_i08_perfume_bottle.png"),             value: 15 },
  ],

  // ===================== BEDROOM =====================
  "bedroom:nightstand": [
    { id: "journal",   name: "Blue Journal",       spr: art("s2_r08_i02_blue_journal_keepsake_book.png"),  value: 5 },
    { id: "letter",    name: "Letter / Postcard",  spr: art("s2_r08_i04_letter_postcard.png"),             value: 1 },
    { id: "admit_one", name: "Admit One Ticket",   spr: art("s2_r08_i05_admit_one_ticket.png"),            value: 2 },
    { id: "keepsake",  name: "Green Keepsake Box", spr: art("s2_r08_i09_green_keepsake_box.png"),          value: 8 },
    { id: "pouch",     name: "Quilted Pouch",      spr: art("s5_r08_i01_quilted_pouch.png"),              value: 4 },
    { id: "zip_case",  name: "Small Zip Case",     spr: art("s5_r08_i03_small_zip_case.png"),             value: 3 },
    { id: "discreet",  name: "Personal Item",      spr: art("s5_r08_i06_discreet_personal_item.png"),     value: 2 },
  ],
  "bedroom:vanity": [
    { id: "lipstick",  name: "Lipstick",           spr: art("s2_r09_i01_lipstick.png"),                   value: 2 },
    { id: "blush",     name: "Blush Compact",      spr: art("s2_r09_i03_blush_compact.png"),              value: 1 },
    { id: "eyeshadow", name: "Eyeshadow Palette",  spr: art("s2_r09_i04_eyeshadow_palette.png"),          value: 8 },
    { id: "mascara",   name: "Mascara",            spr: art("s2_r09_i05_mascara_tube_wand.png"),          value: 4 },
    { id: "m_brush",   name: "Makeup Brush",       spr: art("s2_r09_i07_makeup_brush.png"),               value: 3 },
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
    { id: "belt",      name: "Brown Belt",         spr: art("s2_r06_i02_brown_belt.png"),                 value: 8 },
  ],

  // ===================== OFFICE =====================
  "office:desk_hutch": [
    { id: "pen_cup",   name: "Pen Cup",            spr: art("s3_r08_i01_pen_cup.png"),                    value: 1 },
    { id: "stapler",   name: "Stapler",            spr: art("s3_r08_i03_stapler.png"),                    value: 4 },
    { id: "tape_disp", name: "Tape Dispenser",     spr: art("s3_r08_i04_tape_dispenser.png"),             value: 3 },
    { id: "binder_clip", name: "Binder Clip",      spr: art("s3_r08_i05_binder_clip.png"),               value: 1 },
    { id: "sticky",    name: "Sticky Notes",       spr: art("s3_r08_i06_sticky_notes.png"),               value: 1 },
    { id: "notebook",  name: "Blue Notebook",      spr: art("s3_r08_i07_blue_notebook.png"),              value: 2 },
    { id: "manila_folders", name: "Manila Folders", spr: art("s3_r08_i08_manila_folders.png"),            value: 2 },
    // drawers: laptop + small electronics
    { id: "laptop",    name: "Work Laptop",        spr: art("s3_r11_i01_work_laptop.png"),                value: 200 },
    { id: "laptop_chg", name: "Laptop Charger",    spr: art("s3_r11_i02_laptop_charger.png"),             value: 25 },
    // Personal machine — flies in carry-on; never sold or U-Box-loaded.
    { id: "personal_laptop", name: "Personal Laptop", spr: art("s3_r11_i01_work_laptop.png"), value: 0, carryOn: true },
    { id: "tablet",    name: "Tablet",             spr: art("s3_r12_i02_tablet.png"),                     value: 120 },
    { id: "earbuds",   name: "Earbuds",            spr: art("s3_r12_i03_earbuds.png"),                    value: 20 },
    { id: "ext_drive", name: "External Drive",     spr: art("s3_r12_i08_external_drive_power_bank.png"),  value: 35 },
    { id: "charge_cable", name: "Charging Cable",  spr: art("s3_r12_i07_charging_cable.png"),             value: 5 },
  ],
  "office:side_cabinet": [
    { id: "passport",  name: "Passport",           spr: art("s3_r05_i01_passport.png"),                   value: 9 },
    { id: "id_card",   name: "ID Card",            spr: art("s3_r05_i02_id_card.png"),                    value: 5 },
    { id: "file_folders", name: "Blue File Folders", spr: art("s3_r05_i03_blue_file_folders.png"),        value: 3 },
    { id: "manila_env", name: "Manila Envelope",   spr: art("s3_r05_i04_manila_envelope.png"),            value: 2 },
    { id: "certificate", name: "Certificate",      spr: art("s3_r05_i05_certificate_official_document.png"), value: 10 },
    { id: "confidential", name: "Confidential Envelope", spr: art("s3_r05_i08_confidential_envelope.png"), value: 8 },
    { id: "paper_stack", name: "Loose Paper Stack", spr: art("s3_r06_i01_loose_paper_stack.png"),         value: 1 },
    { id: "bill",      name: "Bill",               spr: art("s3_r06_i03_bill.png"),                       value: 0 },
    { id: "lined_paper", name: "Lined Paper",      spr: art("s3_r06_i05_loose_lined_paper.png"),          value: 1 },
    { id: "yellow_note", name: "Yellow Note",      spr: art("s3_r06_i06_yellow_note.png"),               value: 1 },
    { id: "clipboard", name: "Clipboard Papers",   spr: art("s3_r06_i07_clipboard_papers.png"),           value: 2 },
    { id: "mail_stack", name: "Stack of Mail",     spr: art("s3_r06_i08_stack_of_mail.png"),              value: 1 },
    { id: "book_set",  name: "Upright Book Set",   spr: art("s3_r13_i01_upright_book_set.png"),           value: 12 },
    { id: "print_bot", name: "Botanical Print",    spr: art("s3_r15_i01_small_botanical_print.png"),      value: 8 },
    { id: "print_roll", name: "Rolled Print",      spr: art("s3_r15_i04_rolled_print.png"),               value: 6 },
    { id: "print_stack", name: "Stack of Prints",  spr: art("s3_r15_i06_loose_stack_of_prints_artwork.png"), value: 10 },
  ],
  "office:storage_bin": [
    // sewing kit (moved from side cabinet)
    { id: "thread_b",  name: "Blue Thread",        spr: art("s3_r07_i01_blue_thread_spool.png"),          value: 2 },
    { id: "thread_r",  name: "Red Thread",         spr: art("s3_r07_i02_red_thread_spool.png"),           value: 2 },
    { id: "needle_card", name: "Needle Card",      spr: art("s3_r07_i03_needle_card.png"),               value: 2 },
    { id: "pincushion", name: "Tomato Pincushion", spr: art("s3_r07_i04_tomato_pincushion.png"),         value: 4 },
    { id: "scissors",  name: "Scissors",           spr: art("s3_r07_i05_scissors.png"),                   value: 5 },
    { id: "meas_tape", name: "Measuring Tape",     spr: art("s3_r07_i06_measuring_tape.png"),             value: 3 },
    { id: "buttons",   name: "Buttons",            spr: art("s3_r07_i07_buttons.png"),                    value: 2 },
    { id: "seam_ripper", name: "Seam Ripper",      spr: art("s3_r07_i08_seam_ripper.png"),               value: 3 },
  ],

  // ===================== DINING =====================
  "dining:bar_bottles": [
    { id: "wine",       name: "Red Wine",          spr: art("s4_r01_i01_red_wine_bottle.png"),            value: 14 },
    { id: "liquor",     name: "Liquor Bottle",     spr: art("s4_r01_i04_liquor_bottle.png"),              value: 22 },
    { id: "shaker",     name: "Cocktail Shaker",   spr: art("s4_r01_i05_cocktail_shaker.png"),            value: 12 },
    { id: "jigger",     name: "Jigger",            spr: art("s4_r01_i06_jigger.png"),                     value: 6 },
    { id: "corkscrew",  name: "Corkscrew",         spr: art("s4_r01_i07_corkscrew.png"),                  value: 4 },
    { id: "opener",     name: "Bottle Opener",     spr: art("s4_r01_i08_bottle_opener.png"),              value: 3 },
  ],
  "dining:bar_cabinet": [
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
    { id: "switch_dock", name: "Switch Dock",      spr: art("s4_r05_i07_switch_joy_con_dock.png"),         value: 40 },
    { id: "cards",      name: "Playing Cards",      spr: art("s4_r06_i02_playing_card_deck.png"),          value: 7 },
    { id: "dice",       name: "Dice",               spr: art("s4_r06_i03_dice.png"),                       value: 2 },
    { id: "chess",      name: "Chess Knight",       spr: art("s4_r06_i04_chess_knight.png"),               value: 10 },
    { id: "puzzle",     name: "Puzzle Box",         spr: art("s4_r06_i07_puzzle_box.png"),                 value: 8 },
    { id: "fabric_floral", name: "Floral Fabric",  spr: art("s4_r07_i01_floral_folded_fabric.png"),        value: 5 },
    { id: "fabric_plaid",  name: "Plaid Fabric",   spr: art("s4_r07_i02_green_plaid_folded_fabric.png"),   value: 5 },
    { id: "fabric_pink", name: "Pink Fabric Roll", spr: art("s4_r07_i04_pink_fabric_roll.png"),           value: 5 },
    { id: "fabric_stripe", name: "Striped Fabric", spr: art("s4_r07_i07_blue_striped_folded_fabric.png"), value: 5 },
    // guitar accessories (case + amp are room props)
    { id: "picks",      name: "Pack of Picks",      spr: art("s4_r08_i05_pack_of_picks.png"),              value: 3 },
    { id: "tuner",      name: "Tuner",              spr: art("s4_r08_i07_tuner.png"),                      value: 15 },
    { id: "cable",      name: "Instrument Cable",   spr: art("s4_r08_i08_instrument_cable.png"),           value: 12 },
    // coffee-table overflow / knickknacks
    { id: "cat_pic",    name: "Framed Cat Picture", spr: art("s5_r05_i01_framed_cat_picture.png"),         value: 8 },
    { id: "shell_dish", name: "Shell Dish",         spr: art("s5_r05_i03_shell_dish.png"),                 value: 4 },
    { id: "candle_ct",  name: "Candle",             spr: art("s5_r05_i05_candle.png"),                     value: 5 },
    { id: "jar_vase",   name: "Blue-and-White Jar", spr: art("s5_r05_i07_blue_and_white_jar_vase.png"),    value: 10 },
    { id: "book_flowers", name: "Art of Flowers",  spr: art("s3_r14_i03_the_art_of_flowers_book.png"),    value: 12 },
    { id: "book_humans", name: "Humans Photo Book", spr: art("s3_r14_i04_humans_photography_book.png"),   value: 14 },
  ],
};

// Promise consumed by StorageScreen to force a repaint after asynchronously
// decoded PNGs become drawable. In production the URLs are base64-inlined, but
// image decode can still finish just after the first canvas paint.
export const itemArtReady = Promise.all(imageReadyPromises);

/** Items inside a storage object, optionally filtered by tap zone (upper/lower). */
export function contentsFor(roomId, objectId, zone = null) {
  const items = CONTENTS[`${roomId}:${objectId}`] || [];
  if (!zone) return items;
  const zoned = items.some((it) => it.zone);
  if (!zoned) return items;
  return items.filter((it) => it.zone === zone);
}

// convenience predicate: does this room+object have interior contents?
export const hasContents = (roomId, objectId) => !!CONTENTS[`${roomId}:${objectId}`]?.length;

// shared count of how many items inside a storage object are still unhandled
// (not packed / sold / donated). Used by both the drawer-glow render block and
// the .portal silhouette glow so they turn off together once a container is
// emptied. `contentsState` is the per-item state map keyed by `${storageKey}:${itemId}`.
// Pass `zone` to count only that half of a split container (kitchen counter).
export const remainingCount = (roomId, objectId, contentsState, zone = null) => {
  const storageKey = `${roomId}:${objectId}`;
  const items = contentsFor(roomId, objectId, zone);
  if (!items.length) return 0;
  let remaining = 0;
  for (const it of items) {
    const st = contentsState[`${storageKey}:${it.id}`];
    if (!st || (!st.packed && !st.sold && !st.donated)) remaining += 1;
  }
  return remaining;
};
