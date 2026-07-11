const DAY_MS = 24 * 60 * 60 * 1000;

export const MOVE_DATE = "2026-07-31";

export const PHASES = [
  { id: "pack-first", label: "Pack first", start: "2026-07-01", end: "2026-07-14" },
  { id: "mid-month", label: "Mid-month", start: "2026-07-15", end: "2026-07-24" },
  { id: "ubox-week", label: "U-Box week", start: "2026-07-25", end: "2026-07-26" },
  { id: "load-days", label: "Load days", start: "2026-07-27", end: "2026-07-29" },
  { id: "lock-night", label: "Lock night", start: "2026-07-30", end: "2026-07-30" },
  { id: "flight-day", label: "Flight day", start: "2026-07-31", end: "2026-07-31" },
  { id: "arrived", label: "Arrived", start: "2026-08-01", end: null },
];

export const DATE_TRIGGERS = [
  { id: "sublet-lock", date: "2026-07-15", label: "Lock the Aug 1 sublet", critical: true, lane: "housing" },
  { id: "vet-window", date: "2026-07-22", end: "2026-07-25", label: "Stretchy vet window", critical: true, lane: "cat" },
  { id: "ubox-arrives", date: "2026-07-27", label: "U-Box arrives", critical: true, lane: "move" },
  { id: "main-load", date: "2026-07-28", end: "2026-07-29", label: "Main loading days", critical: true, lane: "move" },
  { id: "lock-box", date: "2026-07-30", label: "Lock the U-Box tonight", critical: true, lane: "move" },
  { id: "flight", date: "2026-07-31", label: "Flight day — sweep, do not pack", critical: true, lane: "move" },
];

export function dateKey(value = new Date()) {
  if (typeof value === "string") return value.slice(0, 10);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayNumber(value) {
  const key = dateKey(value);
  if (!key) return null;
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / DAY_MS;
}

export function daysUntil(date, from = new Date()) {
  if (date == null || date === "") return null;
  const target = dayNumber(date);
  const start = dayNumber(from);
  return target == null || start == null ? null : target - start;
}

export function currentPhase(date = new Date()) {
  const key = dateKey(date);
  if (!key) return PHASES[0];
  return PHASES.find((phase) => key >= phase.start && (!phase.end || key <= phase.end)) || PHASES[0];
}

export function dueTriggers(date = new Date(), windowDays = 2) {
  return DATE_TRIGGERS.filter((trigger) => {
    const delta = daysUntil(trigger.date, date);
    const endDelta = daysUntil(trigger.end || trigger.date, date);
    return delta != null && endDelta != null && delta <= windowDays && endDelta >= 0;
  });
}

export function taskDueDelta(task, date = new Date()) {
  return task?.dueDate ? daysUntil(task.dueDate, date) : null;
}

export function isDueSoon(task, date = new Date(), windowDays = 2) {
  const start = taskDueDelta(task, date);
  if (start == null) return false;
  const end = task?.dueEnd ? daysUntil(task.dueEnd, date) : start;
  return start <= windowDays && end >= 0;
}

export function isOverdue(task, date = new Date()) {
  const end = daysUntil(task?.dueEnd || task?.dueDate, date);
  return end != null && end < 0;
}

