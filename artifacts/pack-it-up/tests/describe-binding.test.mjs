/*
 * describeBinding() — short human string for the card info box, showing what
 * a task's game binding is linked to.
 *
 * taskBindings.js transitively imports contents.js, which uses Vite-only
 * `import.meta.glob` + a JSON import attribute and therefore cannot be loaded
 * by plain Node (this is the same reason the sibling task-bindings.test.mjs
 * only runs under a Vite-capable runner). describeBinding itself needs none of
 * that item art — only the label option arrays — so we load taskBindings.js
 * from source with those Vite-only imports stubbed. This keeps the test runnable
 * with `node tests/describe-binding.test.mjs` from artifacts/pack-it-up/.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const srcPath = fileURLToPath(new URL("../src/taskBindings.js", import.meta.url));
let source = readFileSync(srcPath, "utf8");
source = source
  .replace(/^import .*inventoryCollections\.js";\n/m, "")
  .replace(/^import .*apartmentObjectCatalog\.js";\n/m, "");

// Minimal stubs for the label sources describeBinding reads. Real values live
// in the Vite-only modules above; the shapes here match what the app ships.
const stubs = `
const INVENTORY_COLLECTION_OPTIONS = [
  { value: "collection:living:tv_hutch:games & gaming extras", label: "Living · Tv Hutch · Games & Gaming Extras" },
  { value: "collection:office:desk_hutch:office supplies", label: "Office · Desk Hutch · Office Supplies" },
];
const INVENTORY_ITEM_OPTIONS = [];
const inventoryTargetKeys = () => [];
const PACKABLE_APARTMENT_TARGET_OPTIONS = [
  { value: "living:sofa", label: "Living · Sofa" },
];
`;

const { describeBinding } = await import(
  "data:text/javascript," + encodeURIComponent(stubs + source)
);

// packedCollections-style multi-target binding surfaces a "+N" count.
const multi = describeBinding({
  feature: "inventory_collection",
  targets: [
    "collection:living:tv_hutch:games & gaming extras",
    "collection:office:desk_hutch:office supplies",
  ],
  aggregate: "all",
  trigger: "packed",
  resultStatus: "done",
});
assert.ok(typeof multi === "string" && /\+1\b/.test(multi), `multi-target binding should include "+1", got: ${multi}`);
assert.ok(/when packed$/.test(multi), `collection binding should end with its trigger, got: ${multi}`);

// apartment_item buyerFound binding describes plainly.
const buyerFound = describeBinding({
  feature: "apartment_item", target: "living:sofa", trigger: "buyerFound", resultStatus: "done",
});
assert.equal(buyerFound, "Buyer found: sofa", "apartment_item buyerFound binding describes as expected");

// Unknown collection labels fall back to a prettified target (no crash).
const fallback = describeBinding({
  feature: "inventory_collection", target: "collection:kitchen:counter_sink:dishes & cookware",
  trigger: "packed", resultStatus: "done",
});
assert.ok(/dishes & cookware/.test(fallback), `unknown label should prettify the target, got: ${fallback}`);

// No (valid) binding describes as null.
assert.equal(describeBinding(null), null, "null binding describes as null");
assert.equal(describeBinding(undefined), null, "undefined binding describes as null");

console.log("describeBinding tests passed");
