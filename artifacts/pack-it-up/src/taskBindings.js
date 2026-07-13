/* Canonical links between Ledger tasks and gameplay state. Static binding
   definitions stay in code/tasks; saves persist only the chosen binding and
   the resulting world/task state. */

export const GAME_FEATURE_OPTIONS = [
  { value: "apartment_item", label: "Apartment item / packing" },
  { value: "health_zone", label: "Health body zone" },
  { value: "health_appointment", label: "Health appointment" },
];

const HEALTH_TARGETS = [
  ["brain", "Psychiatry / medication"], ["teeth", "Dentist"],
  ["heart", "Cardiology"], ["skin", "Dermatology"],
  ["lymph", "Rheumatology / labs"], ["obgyn", "OB/GYN"],
].map(([value, label]) => ({ value, label }));

// Stable room:item IDs. A custom value remains valid even when it is not in
// this convenience list, so future objects do not require a schema change.
export const ITEM_TARGET_OPTIONS = [
  ["bedroom:nightstand", "Bedroom · Nightstand"],
  ["bedroom:dresser", "Bedroom · Dresser"],
  ["bedroom:closet_door", "Bedroom · Closet"],
  ["bedroom:bed_frame", "Bedroom · Bed frame"],
  ["bedroom:mattress", "Bedroom · Mattress"],
  ["office:desk_hutch", "Office · Desk & hutch"],
  ["office:office_chair", "Office · Chair"],
  ["office:wifi_router", "Office · Wi-Fi router"],
  ["dining:dining_table", "Dining · Table"],
  ["dining:dining_chairs", "Dining · Chair set"],
  ["living:tv_hutch", "Living · TV hutch"],
  ["living:coffee_table", "Living · Coffee table"],
  ["living:sofa", "Living · Sofa"],
].map(([value, label]) => ({ value, label }));

export const COMPLETION_TRIGGER_OPTIONS = {
  manual: [{ value: "confirmed", label: "Player confirms it" }],
  apartment_item: [
    { value: "handled", label: "Packed, sold, or donated" },
    { value: "packed", label: "Packed" },
    { value: "sold", label: "Sold" },
    { value: "donated", label: "Donated" },
    { value: "buyerFound", label: "Buyer found" },
    { value: "removed", label: "Sold or donated (physically removed)" },
  ],
  health_zone: [{ value: "stabilized", label: "Zone stabilized" }],
  health_appointment: [
    { value: "booked", label: "Appointment booked" },
    { value: "attended", label: "Appointment attended" },
  ],
};

export const TASK_RESULT_OPTIONS = [
  { value: "done", label: "Mark task done" },
  { value: "pending", label: "Reopen task" },
  { value: "dismissed", label: "Dismiss task" },
  { value: "archived", label: "Archive task" },
];

export function targetOptionsForFeature(feature) {
  if (feature === "apartment_item") return ITEM_TARGET_OPTIONS;
  if (feature === "health_zone" || feature === "health_appointment") return HEALTH_TARGETS;
  return [];
}

export function normalizeTaskBinding(binding) {
  if (!binding || typeof binding !== "object" || !binding.feature) return null;
  const feature = String(binding.feature);
  const validFeature = GAME_FEATURE_OPTIONS.some((option) => option.value === feature);
  if (!validFeature) return null;
  const triggers = COMPLETION_TRIGGER_OPTIONS[feature] || [];
  const trigger = triggers.some((option) => option.value === binding.trigger)
    ? binding.trigger
    : triggers[0]?.value;
  const targets = Array.isArray(binding.targets)
    ? binding.targets.map((target) => String(target || "").trim()).filter(Boolean)
    : [];
  const rawTarget = String(binding.target || targets[0] || "").trim();
  const target = rawTarget.startsWith("custom:") ? rawTarget.slice("custom:".length).trim() : rawTarget;
  if (!trigger || !target) return null;
  const resultStatus = TASK_RESULT_OPTIONS.some((option) => option.value === binding.resultStatus)
    ? binding.resultStatus
    : "done";
  return {
    feature,
    target,
    ...(targets.length > 1 ? { targets: [...new Set(targets)], aggregate: binding.aggregate === "any" ? "any" : "all" } : {}),
    trigger,
    resultStatus,
  };
}

export function resolveTaskDestination(task) {
  const binding = normalizeTaskBinding(task?.binding);
  if (binding?.feature === "apartment_item") {
    const [roomId, objectId] = binding.target.split(":");
    return { screen: "apartment", roomId, objectId };
  }
  if (binding?.feature === "health_zone" || binding?.feature === "health_appointment") {
    return { screen: "health", zone: binding.target };
  }
  return null;
}

export function bindingMatchesEvent(bindingLike, event) {
  const binding = normalizeTaskBinding(bindingLike);
  if (!binding || !event) return false;
  const targets = binding.targets || [binding.target];
  if (binding.feature !== event.feature || !targets.includes(event.target)) return false;
  if (binding.trigger === event.trigger) return true;
  if (binding.trigger === "handled") return ["packed", "sold", "donated"].includes(event.trigger);
  return binding.trigger === "removed" && ["sold", "donated"].includes(event.trigger);
}

export function completeTaskFromEvent(tasks, event) {
  return (tasks || []).map((task) => {
    if (["dismissed", "archived"].includes(task.status)) return task;
    const binding = normalizeTaskBinding(task.binding);
    return bindingMatchesEvent(binding, event)
      ? { ...task, status: binding.resultStatus }
      : task;
  });
}

export function taskBindingSatisfied(task, world = {}) {
  const binding = normalizeTaskBinding(task?.binding);
  if (!binding) return null;
  if (binding.feature === "apartment_item") {
    const targets = binding.targets || [binding.target];
    const checks = targets.map((target) => {
      const flags = world.objState?.[target];
      if (!flags) return false;
      if (binding.trigger === "handled") return !!(flags.packed || flags.sold || flags.donated);
      if (binding.trigger === "removed") return !!(flags.sold || flags.donated);
      return !!flags[binding.trigger];
    });
    return binding.aggregate === "any" ? checks.some(Boolean) : checks.every(Boolean);
  }
  if (binding.feature === "health_zone") {
    return binding.trigger === "stabilized" && !!world.calmedZones?.[binding.target];
  }
  if (binding.feature === "health_appointment") {
    const matches = (world.appointments || []).filter((appt) => appt.zone === binding.target && appt.status !== "cancelled");
    return binding.trigger === "attended"
      ? matches.some((appt) => appt.status === "attended")
      : matches.length > 0;
  }
  return null;
}

export function reconcileTasksFromWorldState(tasks, world) {
  return (tasks || []).map((task) => {
    if (["dismissed", "archived"].includes(task.status)) return task;
    const binding = normalizeTaskBinding(task.binding);
    if (!binding) return task;
    const satisfied = taskBindingSatisfied(task, world);
    if (satisfied === true) return { ...task, status: binding.resultStatus };
    // State-bound "done" tasks reopen when an undo restores the world.
    if (satisfied === false && binding.resultStatus === "done" && task.status === "done") {
      return { ...task, status: "pending" };
    }
    return task;
  });
}

export function isWorldBoundTask(task) {
  return !!normalizeTaskBinding(task?.binding);
}
