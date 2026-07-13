import assert from "node:assert/strict";
import {
  completeTaskFromEvent,
  reconcileTasksFromWorldState,
  resolveTaskDestination,
  taskBindingSatisfied,
} from "../src/taskBindings.js";
import { makeQuickTask, isTaskDateLocked, scheduleDatesForLedger } from "../src/tasks.js";
import { mergeTasks } from "../src/save.js";

const itemTask = {
  id: "pack_sofa",
  status: "pending",
  binding: { feature: "apartment_item", target: "living:sofa", trigger: "packed", resultStatus: "done" },
};

assert.equal(completeTaskFromEvent([itemTask], {
  feature: "apartment_item", target: "living:sofa", trigger: "viewed",
})[0].status, "pending", "viewing an item does not finish its task");

assert.equal(completeTaskFromEvent([itemTask], {
  feature: "apartment_item", target: "living:sofa", trigger: "packed",
})[0].status, "done", "the configured world event finishes its task");

assert.equal(taskBindingSatisfied(itemTask, {
  objState: { "living:sofa": { packed: true } },
}), true, "saved world state satisfies a linked task");

const reopened = reconcileTasksFromWorldState([{ ...itemTask, status: "done" }], {
  objState: { "living:sofa": { packed: false, sold: false, donated: false } },
});
assert.equal(reopened[0].status, "pending", "undoing world state reopens a linked task");

assert.deepEqual(resolveTaskDestination(itemTask), {
  screen: "apartment", roomId: "living", objectId: "sofa",
});
assert.deepEqual(resolveTaskDestination({ binding: {
  feature: "health_appointment", target: "heart", trigger: "booked", resultStatus: "done",
} }), { screen: "health", zone: "heart" });

const appointmentTask = makeQuickTask({
  title: "Book follow-up", category: "health", binding: {
    feature: "health_appointment", target: "heart", trigger: "booked", resultStatus: "done",
  },
});
assert.equal(appointmentTask.kind, "book", "new booking links enter the existing appointment flow");
assert.equal(appointmentTask.zone, "heart");

const restored = mergeTasks([], [{ ...appointmentTask, status: "pending" }]);
assert.deepEqual(restored[0].binding, appointmentTask.binding, "custom task bindings survive save restore");

const canonical = mergeTasks([
  { id: "kept", title: "Source title", category: "move", status: "pending", dueDate: "2026-07-10",
    binding: { feature: "apartment_item", target: "living:sofa", trigger: "removed", resultStatus: "done" } },
  { id: "new_default", title: "Must not revive", category: "move", status: "pending" },
], [{
  id: "kept", title: "Mobile title", category: "admin", status: "pending",
  due: "Jul 25", dueDate: "2026-07-25", dueEnd: "2026-07-16",
  targetDate: "2026-07-10", latestDate: "2026-07-16", availableFrom: "2026-07-30",
  binding: null,
}]);
assert.deepEqual(canonical.map((task) => task.id), ["kept"], "source defaults absent from the mobile ledger do not revive");
assert.equal(canonical[0].title, "Mobile title", "mobile title remains canonical");
assert.equal(canonical[0].category, "admin", "mobile lane remains canonical");
assert.equal(canonical[0].targetDate, "2026-07-25", "mobile dueDate drives scheduler target");
assert.equal(canonical[0].latestDate, "2026-07-28", "pre-Jul-27 tasks receive a three-day latest window");
assert.equal(canonical[0].availableFrom, "2026-07-25", "availability cannot open after the canonical due date");
assert.equal(canonical[0].binding?.trigger, "removed", "code wiring enriches a saved task without replacing mobile edits");

assert.deepEqual(scheduleDatesForLedger({ category: "move" }, "2026-07-20"), {
  targetDate: "2026-07-20", latestDate: "2026-07-23", dueEnd: "2026-07-23",
});
assert.deepEqual(scheduleDatesForLedger({ category: "housing" }, "2026-07-27"), {
  targetDate: "2026-07-27", latestDate: "2026-07-30", dueEnd: "2026-07-30",
});
assert.deepEqual(scheduleDatesForLedger({ category: "job", selfTarget: false }, "2026-07-20"), {
  targetDate: "2026-07-15", latestDate: "2026-07-20", dueEnd: "2026-07-20",
});
assert.deepEqual(scheduleDatesForLedger({ category: "job", selfTarget: true }, "2026-07-20"), {
  targetDate: "2026-07-20", latestDate: "2026-07-25", dueEnd: "2026-07-25",
});
assert.equal(isTaskDateLocked({ id: "w_flight" }), true, "flight dates are locked");
assert.equal(isTaskDateLocked({ kind: "attend" }), true, "recorded appointment dates are locked");
assert.equal(isTaskDateLocked({ id: "m_load_main" }), true, "U-Box operation dates are locked");

console.log("task binding transitions passed");
