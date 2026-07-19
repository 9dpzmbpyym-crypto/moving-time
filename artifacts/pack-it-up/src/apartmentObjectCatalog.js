// Every environment object currently marked `removable: true` in ROOMS.
// This is the canonical Ledger target catalog for furniture and loose props.
const PACKABLE_OBJECTS = {
  bedroom: [
    ["rug", "Striped Rug"], ["curtains", "Curtains"], ["art_tree", "Tree Painting"],
    ["art_poster", "Coin Co. Poster"], ["bed", "Bed"], ["nightstand", "Nightstand"],
    ["vanity", "Vanity Desk"], ["dresser", "Dresser"], ["lamp", "Mushroom Lamp"],
    ["stool", "Stool"], ["vase", "Red Glass Vase"], ["figurines", "Thrifted Figurines"],
    ["basket", "Everything Basket"],
  ],
  bathroom: [
    ["crossstitch_art", "Cross-stitch Flower"], ["red_towels", "Fancy Towels"],
    ["toilet_decor", "Tank-top Decor"],
    ["toiletries", "Toiletry Collection"], ["laundry_basket", "Laundry Basket"],
  ],
  office: [
    ["office_curtains", "Green Curtains"], ["wall_frames", "Framed Certificates"],
    ["desk_hutch", "Desk & Hutch"], ["hutch_books_upper", "Hutch Books"],
    ["hutch_books_lower", "Hutch Binders"], ["sewing_machine", "Sewing Machine"],
    ["desk_lamp", "Red Desk Lamp"], ["computer", "Computer"],
    ["desk_clutter", "Desk Clutter"], ["office_chair", "Office Chair"],
    ["storage_bin", "Storage Tote"], ["wifi_router", "Wi-Fi Router"],
    ["cat_bed", "Stretchy's Bed"],
  ],
  kitchen: [
    ["kettle", "Blue Kettle"], ["cutting_board", "Cutting Board"],
    ["dish_rack", "Dish Rack"], ["door_towel", "Striped Towel"],
    ["cat_food_bowl", "Cat Food Bowl"], ["cat_water_bowl", "Water Bowl"],
  ],
  dining: [
    ["dining_curtains", "Green Curtains"],
    ["shelf_art", "Still-life Print"], ["dining_table", "Dining Table"],
    ["dining_chairs", "Chair Set"], ["candle_bowl", "Candle Centerpiece"],
    ["bar_cabinet", "Bar Cabinet"], ["bar_bottles", "Bar Collection"],
  ],
  living: [
    ["tv_hutch", "TV Hutch"], ["tv", "Roku TV"], ["wall_art_pair", "Wall Art"],
    ["sofa", "Leather Loveseat"],
    ["living_rug", "Striped Rug"], ["coffee_table", "Coffee Table"],
    ["table_decor", "Table Clutter"], ["coffee_table_books", "Coffee Table Books"],
    ["destijl_poster", "De Stijl Poster"], ["standing_mirror", "Standing Mirror"],
    ["floor_lamp", "Torchiere Lamp"], ["guitar_case", "Guitar Hard Case"],
    ["amplifier", "Amplifier"],
  ],
};

const ROOM_LABELS = { bedroom: "Bedroom", bathroom: "Bathroom", office: "Office", kitchen: "Kitchen", dining: "Dining", living: "Living" };

export const PACKABLE_APARTMENT_TARGET_OPTIONS = Object.entries(PACKABLE_OBJECTS).flatMap(([roomId, objects]) =>
  objects.map(([objectId, name]) => ({ value: `${roomId}:${objectId}`, label: `${ROOM_LABELS[roomId]} · ${name}` })),
);

export const PACKABLE_APARTMENT_TARGET_IDS = new Set(PACKABLE_APARTMENT_TARGET_OPTIONS.map((option) => option.value));

