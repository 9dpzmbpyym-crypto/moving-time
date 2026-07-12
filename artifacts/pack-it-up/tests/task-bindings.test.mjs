import assert from "node:assert/strict";
import {
  completeTaskFromEvent,
  reconcileTasksFromWorldState,
  resolveTaskDestination,
  taskBindingSatisfied,
} from "../src/taskBindings.js";
import { makeQuickTask } from "../src/tasks.js";
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

console.log("task binding transitions passed");
