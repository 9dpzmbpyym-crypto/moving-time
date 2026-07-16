/*
 * buildJulyCalendar() — pure data model for the kitchen wall calendar.
 * movePhase.js imports nothing Vite-only, so this runs under plain Node:
 * `node tests/calendar-model.test.mjs` from artifacts/pack-it-up/.
 */
import assert from "node:assert/strict";
import { buildJulyCalendar, CALENDAR_LANES } from "../src/movePhase.js";
import { INITIAL_TASKS } from "../src/tasks.js";

const today = new Date("2026-07-16T12:00:00Z");
const cal = buildJulyCalendar({ tasks: INITIAL_TASKS, today });

// Real July 2026 layout: Jul 1 is a Wednesday, so the first row leads with
// three previous-month filler cells (Sun/Mon/Tue) before Jul 1 lands on Wed.
assert.equal(cal.title, "JULY", "month title");
assert.equal(cal.weekdays[0], "SUN", "week starts Sunday");
const firstWeek = cal.weeks[0];
assert.equal(firstWeek.filter((c) => !c.inMonth).length, 3, "3 leading filler cells before Jul 1");
assert.equal(firstWeek[3].day, 1, "Jul 1 sits under Wed");
assert.equal(firstWeek[3].inMonth, true, "Jul 1 is in-month");

// Every week is 7 cells; all 31 July days appear exactly once.
for (const w of cal.weeks) assert.equal(w.length, 7, "week has 7 cells");
const inMonth = cal.weeks.flat().filter((c) => c.inMonth).map((c) => c.day);
assert.deepEqual(inMonth, Array.from({ length: 31 }, (_, i) => i + 1), "days 1..31 in order");

// Today (the 16th) is flagged, and days before it are past.
const cells = cal.weeks.flat();
const t16 = cells.find((c) => c.key === "2026-07-16");
assert.ok(t16.isToday && !t16.isPast, "Jul 16 is today, not past");
assert.ok(cells.find((c) => c.key === "2026-07-10").isPast, "Jul 10 is past");
assert.ok(!cells.find((c) => c.key === "2026-07-20").isPast, "Jul 20 is not past");

// A day's shown lane is always the most move-critical of what's due that day.
for (const c of cells) {
  if (c.lane) assert.ok(CALENDAR_LANES.includes(c.lane), `lane ${c.lane} is a known lane`);
}
// Jul 15 carries the critical sublet-lock (housing) trigger.
const t15 = cells.find((c) => c.key === "2026-07-15");
assert.equal(t15.lane, "housing", "Jul 15 shows the housing sublet-lock");
assert.ok(t15.isCritical, "Jul 15 is critical");

// Each in-month day exposes every distinct lane due that day (primary first),
// so the cell can show more than one icon; filler cells expose none.
for (const c of cells) {
  if (!c.inMonth) { assert.deepEqual(c.lanes, [], "filler cell has no lanes"); continue; }
  assert.ok(Array.isArray(c.lanes), "in-month cell has a lanes array");
  assert.equal(new Set(c.lanes).size, c.lanes.length, `Jul ${c.day} lanes are distinct`);
  if (c.lane) assert.equal(c.lanes[0], c.lane, `Jul ${c.day} primary lane leads the list`);
  for (const l of c.lanes) assert.ok(CALENDAR_LANES.includes(l), `lane ${l} is known`);
}
// Jul 15 has several kinds of work due, not just the sublet lock.
assert.ok(t15.lanes.length >= 3, "Jul 15 surfaces multiple lanes");
assert.ok(t15.lanes.includes("move") && t15.lanes.includes("housing"), "Jul 15 includes move + housing");

// Anchors: exactly the four move milestones, in date order, with lanes.
assert.deepEqual(cal.anchors.map((a) => a.day), [15, 22, 27, 31], "anchor days");
assert.deepEqual(cal.anchors.map((a) => a.lane), ["housing", "cat", "move", "move"], "anchor lanes");
assert.equal(cal.anchors[0].label, "Sublet Lock", "anchor short label");

// Phase on Jul 16 is mid-month (source of truth, not the mockup's "Final Push").
assert.equal(cal.phaseLabel, "Mid-month", "phase label from the spine");

console.log("buildJulyCalendar tests passed");
