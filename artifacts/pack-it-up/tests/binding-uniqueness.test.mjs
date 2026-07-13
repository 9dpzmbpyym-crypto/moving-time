/*
 * Invariant: a packing/world item belongs to exactly ONE task.
 *
 * A task may bind any mix of environment objects and storage collections, but
 * the reverse is forbidden — no single (target, trigger) pair may be claimed by
 * more than one task, or one action would silently complete two tasks. Buyer →
 * remove furniture pairs are allowed because they share the object under
 * DIFFERENT triggers (buyerFound vs handled/packed), so they key distinctly.
 *
 * Plain Node script (no framework in this repo): run with
 *   node tests/binding-uniqueness.test.mjs
 * from artifacts/pack-it-up/. Exits non-zero on any collision.
 */
import assert from "node:assert/strict";
import { INITIAL_TASKS } from "../src/tasks.js";

const targetsOf = (b) => {
  if (!b) return [];
  if (Array.isArray(b.targets) && b.targets.length) return b.targets;
  return b.target ? [b.target] : [];
};

const owners = new Map(); // "target::trigger" -> [taskId]
for (const t of INITIAL_TASKS) {
  const b = t.binding;
  if (!b || !b.feature) continue;
  const trigger = b.trigger || "packed";
  for (const target of targetsOf(b)) {
    const key = `${target}::${trigger}`;
    if (!owners.has(key)) owners.set(key, []);
    owners.get(key).push(t.id);
  }
}

const collisions = [...owners.entries()].filter(([, ids]) => ids.length > 1);
for (const [key, ids] of collisions) {
  console.error(`COLLISION  ${key}  ->  ${ids.join(", ")}`);
}
assert.equal(
  collisions.length,
  0,
  `${collisions.length} item(s) bound by more than one task (see COLLISION lines above)`,
);

console.log(`ok   - ${owners.size} (target,trigger) bindings, each owned by exactly one task`);
console.log("binding uniqueness passed");
