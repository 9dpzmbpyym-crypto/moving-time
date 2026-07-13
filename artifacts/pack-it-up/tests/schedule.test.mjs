/*
 * Lightweight, dependency-free assertions for the urgency/scheduling engine
 * and the effort-based daily deal (Part H of the schedule.js work). No test
 * framework in this repo yet, so this is a plain Node script: run with
 *   node tests/schedule.test.mjs
 * from artifacts/pack-it-up/. Exits non-zero on any failure.
 */
import assert from "node:assert/strict";
import {
  taskStatus,
  urgencyScore,
  isBoundToday,
  buildMinimumSchedule,
  dealDailyHand,
  toggleDealPick,
  manualToggleHand,
  dealProgress,
  ensureDailyDeal,
  normalizeTask,
  calculateTierQuotas,
} from "../src/schedule.js";
import { mergeSession, todayKey } from "../src/session.js";
import { dateKey } from "../src/movePhase.js";

let pass = 0;
let fail = 0;
function test(name, fn) {
  try {
    fn();
    pass += 1;
    console.log(`ok   - ${name}`);
  } catch (err) {
    fail += 1;
    console.log(`FAIL - ${name}`);
    console.log(`       ${err?.message || err}`);
  }
}

/** Minimal task shape — deliberately independent of tasks.js's real seed data. */
function mkTask(overrides = {}) {
  return {
    id: "t1",
    title: "Test task",
    category: "move",
    status: "pending",
    effort: 1,
    criticality: 2,
    availableFrom: null,
    targetDate: null,
    latestDate: null,
    exactDate: null,
    dependencies: [],
    blocks: [],
    selfTarget: false,
    ...overrides,
  };
}

const d = (iso) => new Date(`${iso}T12:00:00`); // noon avoids local-midnight edge cases

/* ---------------- Part A: taskStatus state machine ---------------- */

test("before-target -> SOON (within lead window)", () => {
  const t = mkTask({ targetDate: "2026-07-15", latestDate: "2026-07-20" });
  assert.equal(taskStatus(t, d("2026-07-13")), "SOON");
});

test("before-target, far out -> available (not SOON yet)", () => {
  const t = mkTask({ targetDate: "2026-07-15", latestDate: "2026-07-20" });
  assert.equal(taskStatus(t, d("2026-07-01")), "available");
});

test("on-target -> DUE", () => {
  const t = mkTask({ targetDate: "2026-07-15", latestDate: "2026-07-20" });
  assert.equal(taskStatus(t, d("2026-07-15")), "DUE");
});

test("day-after-target -> OVERDUE", () => {
  const t = mkTask({ targetDate: "2026-07-15", latestDate: "2026-07-20" });
  assert.equal(taskStatus(t, d("2026-07-16")), "OVERDUE");
});

test("approaching-latest -> CLOSING", () => {
  // target 07-15, latest 07-20 (5-day grace) — 07-19 is 4/5 through, past the 50% mark.
  const t = mkTask({ targetDate: "2026-07-15", latestDate: "2026-07-20" });
  assert.equal(taskStatus(t, d("2026-07-19")), "CLOSING");
});

test("on-latest -> FINAL CALL", () => {
  const t = mkTask({ targetDate: "2026-07-15", latestDate: "2026-07-20" });
  assert.equal(taskStatus(t, d("2026-07-20")), "FINAL CALL");
});

test("after-latest -> stays FINAL CALL", () => {
  const t = mkTask({ targetDate: "2026-07-15", latestDate: "2026-07-20" });
  assert.equal(taskStatus(t, d("2026-07-25")), "FINAL CALL");
});

test("blocked (unmet dependency) -> BLOCKED, overrides date math", () => {
  const dep = mkTask({ id: "dep1", status: "pending" });
  const t = mkTask({ id: "t2", dependencies: ["dep1"], targetDate: "2026-07-01" });
  assert.equal(taskStatus(t, d("2026-07-15"), [dep, t]), "BLOCKED");
});

test("exactDate in the future -> SCHEDULED", () => {
  const t = mkTask({ exactDate: "2026-07-27", targetDate: "2026-07-27", latestDate: "2026-07-27" });
  assert.equal(taskStatus(t, d("2026-07-20")), "SCHEDULED");
});

/* ---------------- Part B: self-target jobs ---------------- */

test("self-target overdue past target is NOT Bound today", () => {
  const t = mkTask({
    id: "job1", category: "job", selfTarget: true, criticality: 1,
    targetDate: "2026-07-05", latestDate: "2026-07-15", estimatedLatest: true,
  });
  assert.equal(isBoundToday(t, d("2026-07-10"), [t]), false);
});

test("self-target overdue status still reads OVERDUE/CLOSING/FINAL CALL (display only)", () => {
  const t = mkTask({
    id: "job2", category: "job", selfTarget: true, criticality: 1,
    targetDate: "2026-07-05", latestDate: "2026-07-15", estimatedLatest: true,
  });
  assert.equal(taskStatus(t, d("2026-07-06")), "OVERDUE");
});

/* ---------------- Part C: bound hand ---------------- */

test("exact-date-today task is Bound", () => {
  const t = mkTask({
    id: "exact1", criticality: 3,
    exactDate: "2026-07-15", targetDate: "2026-07-15", latestDate: "2026-07-15",
  });
  assert.equal(isBoundToday(t, d("2026-07-15"), [t]), true);
});

test("past-latest real (non-self-target) criticality>=2 task is Bound", () => {
  const t = mkTask({
    id: "late1", criticality: 2, targetDate: "2026-07-05", latestDate: "2026-07-10",
  });
  assert.equal(isBoundToday(t, d("2026-07-12"), [t]), true);
});

test("blocked task is excluded from the offer pile", () => {
  const dep = mkTask({ id: "depA", status: "pending" });
  const blocked = mkTask({
    id: "blockedA", criticality: 1, dependencies: ["depA"],
    targetDate: "2026-07-01", latestDate: "2026-07-30",
  });
  const tasks = [dep, blocked];
  const deal = dealDailyHand(tasks, "full", d("2026-07-11"));
  assert.ok(!deal.offerTaskIds.includes("blockedA"), "blocked task leaked into offer pile");
  assert.ok(!deal.boundTaskIds.includes("blockedA"), "blocked task leaked into bound pile");
});

test("blocked, unavailable, and future exact-date tasks cannot consume minimum-schedule capacity or leak Bound", () => {
  const dep = mkTask({ id: "depFloor", status: "pending", criticality: 1 });
  const blocked = mkTask({
    id: "blockedFloor", criticality: 3, effort: 3,
    targetDate: "2026-07-11", latestDate: "2026-07-11", dependencies: ["depFloor"],
  });
  const unavailable = mkTask({
    id: "unavailableFloor", criticality: 3, effort: 3, availableFrom: "2026-07-20",
    targetDate: "2026-07-20", latestDate: "2026-07-20",
  });
  const scheduled = mkTask({
    id: "scheduledFloor", criticality: 3, effort: 3, exactDate: "2026-07-20",
    targetDate: "2026-07-20", latestDate: "2026-07-20",
  });
  const actionable = mkTask({
    id: "actionableFloor", criticality: 3, effort: 3,
    targetDate: "2026-07-11", latestDate: "2026-07-11",
  });
  const tasks = [dep, blocked, unavailable, scheduled, actionable];
  const minimum = buildMinimumSchedule(tasks, d("2026-07-11"));
  assert.deepEqual(minimum.fumesIds, ["actionableFloor"]);
  assert.equal(minimum.placed.blockedFloor, undefined);
  assert.equal(minimum.placed.unavailableFloor, undefined);
  assert.equal(minimum.placed.scheduledFloor, undefined);
  const deal = dealDailyHand(tasks, "fumes", d("2026-07-11"));
  assert.ok(!deal.boundTaskIds.includes("blockedFloor"));
  assert.ok(!deal.boundTaskIds.includes("unavailableFloor"));
  assert.ok(!deal.boundTaskIds.includes("scheduledFloor"));
});

test("latest-only deadline ramps before cutoff and reaches final-call urgency", () => {
  const t = mkTask({ id: "latestOnly", criticality: 1, targetDate: null, latestDate: "2026-07-20" });
  const early = urgencyScore(t, d("2026-07-13"));
  const closing = urgencyScore(t, d("2026-07-19"));
  const finalCall = urgencyScore(t, d("2026-07-20"));
  assert.ok(closing > early, `${closing} should exceed ${early}`);
  assert.ok(finalCall >= 95, `expected final-call urgency >=95, got ${finalCall}`);
  assert.equal(taskStatus(t, d("2026-07-20"), [t]), "FINAL CALL");
});

test("missing availableFrom uses a stable fallback lead window", () => {
  const t = mkTask({ id: "fallbackLead", criticality: 1, targetDate: "2026-07-20", latestDate: "2026-07-24" });
  const early = urgencyScore(t, d("2026-07-13"));
  const later = urgencyScore(t, d("2026-07-19"));
  assert.ok(later > early, `${later} should exceed ${early}`);
  assert.equal(early, urgencyScore(t, d("2026-07-13")), "same date must produce the same score");
});

/* ---------------- Part D: effort-based dealing (the key change) ---------------- */

test("one effort-3 card satisfies 3 required optional effort", () => {
  // No bound work -> steady budget (6) all optional, but we only care that the
  // *effort accounting*, not card count, drives dealConfirmed.
  const heavy = mkTask({ id: "heavy1", category: "admin", criticality: 1, effort: 3 });
  const tasks = [heavy];
  let deal = dealDailyHand(tasks, "fumes", d("2026-07-11")); // fumes budget 3, no bound work
  assert.equal(deal.requiredOptionalEffort, 0);
  assert.equal(deal.dealConfirmed, true);
  deal = toggleDealPick(deal, "heavy1");
  const progress = dealProgress(deal);
  assert.equal(progress.selectedOptionalEffort, 0);
  assert.equal(progress.remainingEffort, 0);
  assert.equal(deal.dealConfirmed, true);
});

test("three effort-1 cards also satisfy 3 required optional effort", () => {
  const tasks = [
    mkTask({ id: "a1", category: "admin", criticality: 1, effort: 1 }),
    mkTask({ id: "a2", category: "admin", criticality: 1, effort: 1 }),
    mkTask({ id: "a3", category: "admin", criticality: 1, effort: 1 }),
  ];
  let deal = dealDailyHand(tasks, "fumes", d("2026-07-11"));
  assert.equal(deal.requiredOptionalEffort, 0);
  deal = toggleDealPick(deal, "a1");
  deal = toggleDealPick(deal, "a2");
  deal = toggleDealPick(deal, "a3");
  const progress = dealProgress(deal);
  assert.equal(progress.selectedOptionalEffort, 0);
  assert.equal(progress.remainingEffort, 0);
  assert.equal(deal.dealConfirmed, true);
});

test("boundEffort already >= budget requires zero optional effort", () => {
  // Three criticality-3 exact-date-today tasks at effort 1 each = 3 bound effort,
  // which already meets the Fumes budget (3) on its own.
  const tasks = [
    mkTask({ id: "b1", criticality: 3, effort: 1, exactDate: "2026-07-11", targetDate: "2026-07-11", latestDate: "2026-07-11" }),
    mkTask({ id: "b2", criticality: 3, effort: 1, exactDate: "2026-07-11", targetDate: "2026-07-11", latestDate: "2026-07-11" }),
    mkTask({ id: "b3", criticality: 3, effort: 1, exactDate: "2026-07-11", targetDate: "2026-07-11", latestDate: "2026-07-11" }),
  ];
  const deal = dealDailyHand(tasks, "fumes", d("2026-07-11"));
  assert.ok(deal.boundEffort >= 3, `expected boundEffort >= 3, got ${deal.boundEffort}`);
  assert.equal(deal.requiredOptionalEffort, 0);
  assert.equal(deal.dealConfirmed, true);
});

/* ---------------- Part G: save migration (old chooseNeeded -> effort) ---------------- */

test("old chooseNeeded-shaped same-day deal migrates without losing selected/Bound cards", () => {
  // mergeSession() compares against the REAL current date (no injectable "now" —
  // matches production, which always calls it as mergeSession(bootSave?.session)).
  // So this deal must genuinely be "today" from the test runner's point of view.
  const today = new Date();
  const isoToday = dateKey(today); // e.g. "2026-07-12" — matches task date fields
  const sessionDay = todayKey(today); // e.g. "2026-7-12" — matches session/deal .day bookkeeping
  const tasks = [
    mkTask({ id: "bound1", criticality: 3, effort: 2, exactDate: isoToday, targetDate: isoToday, latestDate: isoToday }),
    mkTask({ id: "offerA", criticality: 1, effort: 2 }),
    mkTask({ id: "offerB", criticality: 1, effort: 1 }),
  ];
  // Simulate a raw save from before the effort model: chooseNeeded, no effortById.
  const legacyRawSession = {
    day: sessionDay,
    energy: "steady",
    dailyDeal: {
      day: sessionDay,
      energy: "steady",
      boundTaskIds: ["bound1"],
      boundTotal: 1,
      offerTaskIds: ["offerA", "offerB"],
      selectedTaskIds: ["bound1", "offerA"], // user had manually drawn offerA
      fumesIds: ["bound1"],
      chooseNeeded: 2,
      minimumEffort: 2,
      steadyEffort: 4,
      fullEffort: 5,
      fixedDay: false,
      dealConfirmed: false,
    },
  };
  const merged = mergeSession(legacyRawSession);
  assert.deepEqual(merged.dailyDeal.selectedTaskIds, ["bound1", "offerA"], "mergeSession must not reshuffle selection");
  assert.deepEqual(merged.dailyDeal.boundTaskIds, ["bound1"], "mergeSession must not drop Bound cards");
  const afterEnsure = ensureDailyDeal(merged, tasks, "steady", today);
  const deal = afterEnsure.dailyDeal;
  assert.deepEqual(deal.selectedTaskIds, ["bound1"], "stale ineligible picks are removed cleanly");
  assert.deepEqual(deal.boundTaskIds, ["bound1"], "migration must not lose Bound cards");
  assert.deepEqual(deal.offerTaskIds, [], "steady only offers C2/C3 work");
  assert.equal(deal.effortById.bound1, 2, "effort must be backfilled from real task data");
  assert.equal(deal.boundEffort, 2);
  // steady budget 6 - boundEffort 2 = 4 required; offerA (effort 2) selected -> 2 remaining.
  assert.equal(deal.requiredOptionalEffort, 0);
  const progress = dealProgress(deal);
  assert.equal(progress.selectedOptionalEffort, 0);
  assert.equal(progress.remainingEffort, 0);
});

test("job fit score derives criticality unless manually overridden", () => {
  assert.equal(normalizeTask({ id: "great", category: "job", score: 90 }).criticality, 3);
  assert.equal(normalizeTask({ id: "good", category: "job", score: 75 }).criticality, 2);
  assert.equal(normalizeTask({ id: "low", category: "job", score: 60 }).criticality, 1);
  assert.equal(normalizeTask({ id: "manual", category: "job", score: 90, criticalityOverride: 1 }).criticality, 1);
});

test("dynamic quota reserves future unavailable work without offering it today", () => {
  const tasks = [
    mkTask({ id: "future", criticality: 2, effort: 3, availableFrom: "2026-07-31", latestDate: "2026-07-31" }),
    mkTask({ id: "now", criticality: 2, effort: 1, latestDate: "2026-07-31" }),
  ];
  assert.equal(calculateTierQuotas(tasks, d("2026-07-30")).steady, 2);
  const deal = dealDailyHand(tasks, "steady", d("2026-07-30"));
  assert.ok(deal.offerTaskIds.includes("now"));
  assert.ok(!deal.offerTaskIds.includes("future"));
});

test("Fumes does NOT force-bind future crit-3; it offers it instead", () => {
  // A crit-3 whose deadline is days away must not be pulled into today's floor.
  const tasks = [mkTask({ id: "heavy", criticality: 3, effort: 3, latestDate: "2026-07-31" })];
  const deal = dealDailyHand(tasks, "fumes", d("2026-07-29"));
  assert.deepEqual(deal.boundTaskIds, []);        // not date-forced on Jul 29
  assert.equal(deal.requiredOptionalEffort, 0);   // fumes floor requires no optional
  assert.ok(deal.offerTaskIds.includes("heavy")); // but fumes still offers it to draw
});

test("Only date-forced tasks bind (exact-date-today / past-latest real deadline)", () => {
  const exact = mkTask({ id: "exact", criticality: 2, effort: 1, exactDate: "2026-07-29" });
  const past = mkTask({ id: "past", criticality: 3, effort: 1, latestDate: "2026-07-20" });
  const softPast = mkTask({ id: "soft", criticality: 1, effort: 1, latestDate: "2026-07-20", selfTarget: true });
  const deal = dealDailyHand([exact, past, softPast], "steady", d("2026-07-29"));
  assert.ok(deal.boundTaskIds.includes("exact"));
  assert.ok(deal.boundTaskIds.includes("past"));
  assert.ok(!deal.boundTaskIds.includes("soft"));  // self-imposed past-latest never binds
});

test("Full Steam exposes optional work that Steady excludes", () => {
  const tasks = [
    mkTask({ id: "c3", criticality: 3, effort: 1, latestDate: "2026-07-31" }),
    mkTask({ id: "c2", criticality: 2, effort: 1, latestDate: "2026-07-31" }),
    mkTask({ id: "c1", criticality: 1, effort: 1, latestDate: "2026-07-31" }),
  ];
  const steady = dealDailyHand(tasks, "steady", d("2026-07-30"));
  const full = dealDailyHand(tasks, "full", d("2026-07-30"));
  assert.ok(!steady.offerTaskIds.includes("c1"));
  assert.ok(full.offerTaskIds.includes("c1"));
});

/* ---------------- Part H: user-customizable hand (manualToggleHand) ---------------- */

test("manualToggleHand adds an open non-hand task to the hand", () => {
  const extra = mkTask({ id: "extra1", category: "admin", criticality: 1, effort: 2 });
  const tasks = [extra];
  const deal = dealDailyHand(tasks, "fumes", d("2026-07-11")); // fumes: no bound work, empty hand
  assert.ok(!deal.selectedTaskIds.includes("extra1"));
  const next = manualToggleHand(deal, "extra1", tasks, d("2026-07-11"));
  assert.ok(next.selectedTaskIds.includes("extra1"), "manual add must land in selectedTaskIds");
  assert.ok(next.manualAddIds.includes("extra1"), "manual add must be tracked in manualAddIds");
  assert.equal(next.effortById.extra1, 2, "effortById must be backfilled for the manual add");
});

test("manualToggleHand removes a scheduler-selected non-forced card", () => {
  const c1 = mkTask({ id: "sel1", category: "admin", criticality: 1, effort: 1, latestDate: "2026-07-31" });
  const tasks = [c1];
  let deal = dealDailyHand(tasks, "full", d("2026-07-11"));
  deal = toggleDealPick(deal, "sel1");
  assert.ok(deal.selectedTaskIds.includes("sel1"), "setup: card should be selected via toggleDealPick");
  const next = manualToggleHand(deal, "sel1", tasks, d("2026-07-11"));
  assert.ok(!next.selectedTaskIds.includes("sel1"), "removed card must leave selectedTaskIds");
  assert.ok(next.manualDropIds.includes("sel1"), "removed card must be tracked in manualDropIds");
});

test("manualToggleHand cannot remove a date-forced card", () => {
  const forced = mkTask({
    id: "forced1", criticality: 2,
    exactDate: "2026-07-11", targetDate: "2026-07-11", latestDate: "2026-07-11",
  });
  const tasks = [forced];
  const deal = dealDailyHand(tasks, "fumes", d("2026-07-11"));
  assert.ok(deal.selectedTaskIds.includes("forced1"), "setup: exact-date-today card is bound + selected");
  const next = manualToggleHand(deal, "forced1", tasks, d("2026-07-11"));
  assert.deepEqual(next, deal, "removing a date-forced card must be a no-op");
});

test("re-toggling a manually dropped card restores it", () => {
  const c1 = mkTask({ id: "sel2", category: "admin", criticality: 1, effort: 1, latestDate: "2026-07-31" });
  const tasks = [c1];
  let deal = dealDailyHand(tasks, "full", d("2026-07-11"));
  deal = toggleDealPick(deal, "sel2");
  deal = manualToggleHand(deal, "sel2", tasks, d("2026-07-11")); // drop
  assert.ok(deal.manualDropIds.includes("sel2"));
  assert.ok(!deal.selectedTaskIds.includes("sel2"));
  deal = manualToggleHand(deal, "sel2", tasks, d("2026-07-11")); // re-toggle: restore
  assert.ok(!deal.manualDropIds.includes("sel2"), "restored card must leave manualDropIds");
  assert.ok(deal.selectedTaskIds.includes("sel2"), "restored card must be back in the hand");
});

test("ensureDailyDeal preserves a manual add across a same-day regen", () => {
  const today = d("2026-07-11");
  const day = todayKey(today);
  const base = mkTask({ id: "base1", category: "admin", criticality: 1, effort: 1 });
  const extra = mkTask({ id: "manualExtra", category: "admin", criticality: 1, effort: 1 });
  let tasks = [base, extra];
  let deal = dealDailyHand(tasks, "steady", today);
  deal = manualToggleHand(deal, "manualExtra", tasks, today);
  assert.ok(deal.selectedTaskIds.includes("manualExtra"));
  assert.ok(deal.manualAddIds.includes("manualExtra"));
  const session = { day, energy: "steady", dailyDeal: deal };
  // Add a new task so taskScheduleKey changes and ensureDailyDeal regenerates the deal.
  const newTask = mkTask({ id: "newOne", category: "admin", criticality: 1, effort: 1 });
  tasks = [base, extra, newTask];
  const after = ensureDailyDeal(session, tasks, "steady", today);
  assert.notEqual(after.dailyDeal.scheduleKey, deal.scheduleKey, "setup: scheduleKey must actually change");
  assert.ok(after.dailyDeal.selectedTaskIds.includes("manualExtra"), "manual add must survive the regen");
  assert.ok(after.dailyDeal.manualAddIds.includes("manualExtra"), "manualAddIds must carry the id forward");
});

/* ---------------- summary ---------------- */

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
