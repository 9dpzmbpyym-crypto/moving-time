import assert from "node:assert/strict";
import { mergeFlagMap, migrateSave, SAVE_VERSION } from "../src/save.js";
import { INITIAL_TASKS } from "../src/tasks.js";
import { taskStatus } from "../src/schedule.js";

const defaults = {
  "living:sofa": { packed: false, sold: false, soldFor: 0, donated: false, buyerFound: false },
};
const restored = mergeFlagMap(defaults, {
  "living:sofa": { packed: false, sold: false, soldFor: 0, donated: false, buyerFound: true },
});
assert.equal(restored["living:sofa"].buyerFound, true, "buyer confirmation survives save restore");

const legacy = mergeFlagMap(defaults, {
  "living:sofa": { packed: true, sold: false, soldFor: 0, donated: false },
});
assert.equal(legacy["living:sofa"].buyerFound, false, "older saves safely default buyerFound to false");
assert.equal(migrateSave({ v: 3 }).v, SAVE_VERSION, "v3 saves migrate to the current schema");

const pairs = [
  ["f_buyer_outdoor", "f_remove_outdoor"],
  ["f_buyer_dining", "f_remove_dining"],
  ["f_buyer_entertainment", "f_remove_entertainment"],
  ["f_buyer_coffee", "f_remove_coffee"],
  ["f_buyer_shoeshelf", "f_remove_shoeshelf"],
  ["f_buyer_shelves", "f_remove_shelves"],
  ["f_buyer_tv", "f_remove_tv"],
  ["f_buyer_desk", "f_remove_desk"],
  ["f_buyer_sofa", "f_remove_sofa"],
  ["f_buyer_dresser", "f_remove_dresser"],
  ["f_buyer_bedside", "f_remove_bedside"],
  ["f_buyer_ac", "f_remove_ac"],
];

for (const [buyerId, removalId] of pairs) {
  const removal = INITIAL_TASKS.find((task) => task.id === removalId);
  assert.deepEqual(removal?.dependencies, [buyerId], `${removalId} is wired to its buyer task`);
  assert.equal(taskStatus(removal, new Date("2026-07-20T12:00:00"), INITIAL_TASKS), "BLOCKED");
  const buyerDone = INITIAL_TASKS.map((task) => task.id === buyerId ? { ...task, status: "done" } : task);
  assert.notEqual(taskStatus(removal, new Date("2026-07-20T12:00:00"), buyerDone), "BLOCKED");
}

console.log("buyer wiring and save migration passed");
