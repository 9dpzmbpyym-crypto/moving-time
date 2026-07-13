import { CONTENTS } from "./contents.js";

const ROOM_LABELS = { bedroom: "Bedroom", bathroom: "Bathroom", office: "Office", dining: "Dining", kitchen: "Kitchen", living: "Living" };
const SEMANTIC_GROUPS = {
  "bedroom:closet_door": {
    "winter & off-season clothes": ["coat_b", "peacoat", "sweater_w", "scarf", "boots"],
    "everyday clothes & bags": ["shirt_w", "dress_g", "pants_b", "cardigan", "tote", "satchel", "belt"],
    "extra linens": ["sheets", "quilt"],
  },
  "bedroom:dresser": { clothes: ["sweater_g", "jeans", "sweater_p"] },
  "bedroom:vanity": {
    makeup: ["lipstick", "blush", "eyeshadow", "mascara", "m_brush"],
    jewelry: ["ring", "earrings", "necklace"],
    "hair accessories": ["claw_clip"],
  },
  "bedroom:nightstand": {
    "papers & keepsakes": ["journal", "letter", "admit_one", "keepsake"],
    "personal items": ["pouch", "zip_case", "discreet"],
  },
  "bathroom:bath_vanity": {
    "hair care": ["curl_cream", "hair_oil", "mousse"],
    "nail care": ["nail_polish", "polish_remover", "nail_file", "cuticle", "gel_lamp"],
    medications: ["rx_bottle", "pill_pack", "pill_org", "cat_med_liq", "cat_med"],
  },
  "bathroom:toiletries": { toiletries: ["toothpaste", "deodorant", "soap", "razor", "lotion", "floss", "perfume"] },
  "kitchen:pantry": {
    food: ["cereal_1", "pasta_1", "canned_1", "sauce_1", "oil_1", "cracker_1", "chip_1"],
    "spices & seasonings": ["spice_g", "spice_r", "salt_1", "pepper_1", "herb_1"],
    "cat food": ["cat_food", "wet_food"],
  },
  "kitchen:fridge": { "food & containers": ["leftovers", "tupper_1", "tupper_2", "bento_1"] },
  "dining:bar_bottles": { alcohol: ["wine", "liquor"], "bar tools": ["shaker", "jigger", "corkscrew", "opener"] },
  "dining:bar_cabinet": {
    glassware: ["wine_glass", "champagne", "rocks", "martini", "shot"],
    vases: ["vase_bw", "vase_bud", "vase_round", "vase_cream", "vase_pitch"],
    "candles & incense": ["candle_brown", "candle_pillar", "candle_tapers", "incense", "matchbox", "holder"],
  },
  "living:tv_hutch": {
    "games & gaming extras": ["console", "controller", "switch_dock", "cards", "dice", "chess", "puzzle"],
    "fabric & craft supplies": ["fabric_floral", "fabric_plaid", "fabric_pink", "fabric_stripe"],
    "guitar accessories": ["picks", "tuner", "cable"],
    "decor & knickknacks": ["cat_pic", "shell_dish", "candle_ct", "jar_vase"],
    "coffee-table books": ["book_flowers", "book_humans"],
  },
  "office:desk_hutch": {
    "office supplies": ["pen_cup", "stapler", "tape_disp", "binder_clip", "sticky", "notebook", "manila_folders"],
    "active work kit": ["laptop", "laptop_chg"],
    "nonessential electronics": ["tablet", "earbuds", "ext_drive", "charge_cable"],
  },
  "office:side_cabinet": {
    documents: ["passport", "id_card", "file_folders", "manila_env", "certificate", "confidential", "paper_stack", "bill", "lined_paper", "yellow_note", "clipboard", "mail_stack"],
    "books & prints": ["book_set", "print_bot", "print_roll", "print_stack"],
  },
  "office:storage_bin": { "sewing supplies": ["thread_b", "thread_r", "needle_card", "pincushion", "scissors", "meas_tape", "buttons", "seam_ripper"] },
  "kitchen:counter_sink": {
    utensils: ["fork_1", "spoon_1", "knife_1", "spatula_1", "whisk_1", "tongs_1", "wood_spoon"],
    "junk drawer": ["batteries", "tape_roll", "blue_pen", "rubber_bands", "flashlight", "paper_clips", "screwdriver"],
    "dishes & cookware": ["plate_1", "plate_2", "bowl_1", "mug_1", "mug_2", "plate_stack", "skillet", "saucepan", "stock_pot", "pot_lid", "baking_sheet", "muffin_tin", "casserole"],
    "cleaning supplies": ["cleaner", "sponge", "cleaner_g", "gloves", "trash_bags"],
  },
};

const titleCase = (value) => value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const collectionId = (storageKey, group = "all") => `collection:${storageKey}:${group}`;
export const INVENTORY_COLLECTIONS = {};
export const INVENTORY_COLLECTION_OPTIONS = [];
export const INVENTORY_ITEM_OPTIONS = [];

for (const [storageKey, items] of Object.entries(CONTENTS)) {
  const [roomId, storageId] = storageKey.split(":");
  const prefix = `${ROOM_LABELS[roomId] || titleCase(roomId)} · ${titleCase(storageId)}`;
  const allId = collectionId(storageKey);
  INVENTORY_COLLECTIONS[allId] = items.map((item) => `${storageKey}:${item.id}`);
  INVENTORY_COLLECTION_OPTIONS.push({ value: allId, label: `${prefix} · Everything` });
  for (const [group, ids] of Object.entries(SEMANTIC_GROUPS[storageKey] || {})) {
    const id = collectionId(storageKey, group);
    INVENTORY_COLLECTIONS[id] = ids.filter((itemId) => items.some((item) => item.id === itemId)).map((itemId) => `${storageKey}:${itemId}`);
    INVENTORY_COLLECTION_OPTIONS.push({ value: id, label: `${prefix} · ${titleCase(group)}` });
  }
  const assigned = new Set(Object.values(SEMANTIC_GROUPS[storageKey] || {}).flat());
  const otherIds = items.map((item) => item.id).filter((id) => !assigned.has(id));
  if (otherIds.length) {
    const id = collectionId(storageKey, "other items");
    INVENTORY_COLLECTIONS[id] = otherIds.map((itemId) => `${storageKey}:${itemId}`);
    INVENTORY_COLLECTION_OPTIONS.push({ value: id, label: `${prefix} · Other Items` });
  }
  for (const item of items) INVENTORY_ITEM_OPTIONS.push({ value: `${storageKey}:${item.id}`, label: `${prefix} · ${item.name}` });
}

const addTaskCollection = (id, label, keys) => {
  INVENTORY_COLLECTIONS[id] = keys;
  INVENTORY_COLLECTION_OPTIONS.push({ value: id, label: `Task Set · ${label}` });
};

// Cross-surface collections can contain both stored-content keys and
// `object:room:id` references. They make one real packing task correspond to
// everything the player actually handles, even when some pieces are furniture.
addTaskCollection("collection:task:guitar gear", "Guitar, Amp & Accessories", [
  "object:living:guitar_case", "object:living:amplifier",
  ...INVENTORY_COLLECTIONS["collection:living:tv_hutch:guitar accessories"],
]);
addTaskCollection("collection:task:art and prints", "Framed Art & Prints", [
  "object:bedroom:art_tree", "object:bedroom:art_poster", "object:office:wall_frames",
  "object:dining:shelf_art", "object:living:wall_art_pair", "object:living:destijl_poster",
  ...INVENTORY_COLLECTIONS["collection:office:side_cabinet:books & prints"].filter((key) => !key.endsWith(":book_set")),
]);
addTaskCollection("collection:task:linens and towels", "Extra Linens & Towels", [
  "object:bathroom:red_towels",
  ...INVENTORY_COLLECTIONS["collection:bedroom:closet_door:extra linens"],
]);
addTaskCollection("collection:task:cat belongings", "Stretchy's Belongings", [
  "object:office:cat_bed", "object:kitchen:cat_food_bowl", "object:kitchen:cat_water_bowl",
  ...INVENTORY_COLLECTIONS["collection:kitchen:pantry:cat food"],
  ...INVENTORY_COLLECTIONS["collection:bathroom:bath_vanity:medications"].filter((key) => key.includes(":cat_med")),
]);

export function inventoryTargetKeys(feature, target) {
  if (feature === "inventory_collection") return INVENTORY_COLLECTIONS[target] || [];
  if (feature === "inventory_item") return target ? [target] : [];
  return [];
}
