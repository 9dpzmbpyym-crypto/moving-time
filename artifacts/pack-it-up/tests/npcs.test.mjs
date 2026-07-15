/*
 * NPC registry tests (Sal + Vivian + call routing). Plain Node assert style,
 * same pattern as tests/shirley-fsm.test.mjs. Run with:
 *   node tests/npcs.test.mjs
 * from artifacts/pack-it-up/.
 */
import assert from "node:assert/strict";
import {
  NPCS,
  canNpcMark,
  pickIncomingCaller,
  SAL_SYSTEM_PROMPT,
  SAL_STYLE,
  SAL_RULES,
  SAL_LINES,
  VIVIAN_SYSTEM_PROMPT,
  VIVIAN_STYLE,
  VIVIAN_RULES,
  VIVIAN_LINES,
} from "../src/npcs.js";
import { todayKey } from "../src/session.js";

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

/* ---------------------------------------------------------------------- *
 * Registry shape
 * ---------------------------------------------------------------------- */

test("registry has 3 NPCs with required fields", () => {
  const required = ["id", "name", "sub", "systemPrompt", "factsBlock", "bankReply", "opener", "allowedMarkCategories"];
  for (const id of ["shirley", "sal", "vivian"]) {
    const npc = NPCS[id];
    assert.ok(npc, `missing NPC ${id}`);
    for (const key of required) {
      assert.ok(key in npc, `NPC ${id} missing field ${key}`);
    }
    assert.equal(typeof npc.factsBlock, "function");
    assert.equal(typeof npc.bankReply, "function");
    assert.equal(typeof npc.opener, "function");
    assert.ok(Array.isArray(npc.allowedMarkCategories) && npc.allowedMarkCategories.length > 0);
  }
  assert.deepEqual(NPCS.shirley.allowedMarkCategories, ["health", "cat"]);
  assert.deepEqual(NPCS.sal.allowedMarkCategories, ["move"]);
  assert.deepEqual(NPCS.vivian.allowedMarkCategories, ["job"]);
});

/* ---------------------------------------------------------------------- *
 * Sal bank
 * ---------------------------------------------------------------------- */

test("sal bankReply greeting returns greet, not open", () => {
  const gameState = { tasks: [], appointments: [], session: {}, objState: {}, today: "2026-07-15" };
  const reply = NPCS.sal.bankReply("hi", {}, gameState);
  assert.ok(SAL_LINES.greet.includes(reply.line), `expected a greet-bucket line, got: "${reply.line}"`);
  assert.ok(!SAL_LINES.open.includes(reply.line), "greeting must not return an open-bucket line");
});

test("sal progress report with a named open move task returns a mark payload", () => {
  const tasks = [
    { id: "p_death_cords", title: "Pack death-closet cords/electronics", category: "move", status: "pending", effort: 2 },
  ];
  const gameState = { tasks, appointments: [], session: {}, objState: {}, today: "2026-07-15" };
  const reply = NPCS.sal.bankReply("closed the death closet cords, all done", {}, gameState);
  assert.ok(reply.mark, "expected a mark payload");
  assert.equal(reply.mark.taskId, "p_death_cords");
  assert.equal(reply.mark.status, "done");
});

/* ---------------------------------------------------------------------- *
 * Vivian bank
 * ---------------------------------------------------------------------- */

function vivianTasksFixture() {
  return [
    { id: "j_hunter", title: "Apply: Administrative Coordinator - Business Office", category: "job", status: "pending", score: 73, dueDate: "2026-07-14", targetDate: "2026-07-14" },
  ];
}

test('vivian "I applied to hunter" with open j_hunter marks done', () => {
  const gameState = { tasks: vivianTasksFixture(), appointments: [], session: {}, objState: {}, today: "2026-07-15" };
  const reply = NPCS.vivian.bankReply("I applied to hunter", {}, gameState);
  assert.ok(reply.mark, "expected a mark payload");
  assert.equal(reply.mark.taskId, "j_hunter");
  assert.equal(reply.mark.status, "done");
});

test("vivian archive intent marks archived", () => {
  const gameState = { tasks: vivianTasksFixture(), appointments: [], session: {}, objState: {}, today: "2026-07-15" };
  const reply = NPCS.vivian.bankReply("archive hunter, not doing it", {}, gameState);
  assert.ok(reply.mark, "expected a mark payload");
  assert.equal(reply.mark.taskId, "j_hunter");
  assert.equal(reply.mark.status, "archived");
});

/* ---------------------------------------------------------------------- *
 * canNpcMark guard
 * ---------------------------------------------------------------------- */

test("canNpcMark refuses mark payloads for the wrong lane", () => {
  assert.equal(canNpcMark("sal", { category: "move" }), true);
  assert.equal(canNpcMark("sal", { category: "job" }), false);
  assert.equal(canNpcMark("vivian", { category: "job" }), true);
  assert.equal(canNpcMark("vivian", { category: "move" }), false);
  assert.equal(canNpcMark("shirley", { category: "health" }), true);
  assert.equal(canNpcMark("shirley", { category: "cat" }), true);
  assert.equal(canNpcMark("shirley", { category: "move" }), false);
  assert.equal(canNpcMark("nonexistent", { category: "move" }), false);
});

/* ---------------------------------------------------------------------- *
 * pickIncomingCaller priority ladder
 * ---------------------------------------------------------------------- */

test("shirley beats sal when both are triggered", () => {
  const d = new Date(2026, 6, 20); // Jul 20 2026
  const appointments = [
    { id: "a1", taskId: "t_x", zone: "teeth", dueAt: "2026-07-21", time: null, status: "booked", reschedules: 0 },
  ];
  const tasks = [
    { id: "f_remove_outdoor", title: "Remove outdoor furniture", category: "move", status: "pending", targetDate: "2026-07-15", latestDate: "2026-07-17" },
  ];
  const call = pickIncomingCaller({ tasks, appointments, session: {}, today: d });
  assert.ok(call, "expected an incoming call");
  assert.equal(call.npcId, "shirley");
});

test("sal beats vivian when both are triggered (no shirley)", () => {
  const d = new Date(2026, 6, 20);
  const tasks = [
    { id: "f_remove_outdoor", title: "Remove outdoor furniture", category: "move", status: "pending", targetDate: "2026-07-15", latestDate: "2026-07-17" },
    { id: "j_stale", title: "Apply: Stale Role", category: "job", status: "pending", targetDate: "2026-07-01", latestDate: "2026-07-10" },
  ];
  const call = pickIncomingCaller({ tasks, appointments: [], session: {}, today: d });
  assert.ok(call, "expected an incoming call");
  assert.equal(call.npcId, "sal");
});

test("one-per-day guard suppresses a non-critical repeat call", () => {
  const d = new Date(2026, 6, 20);
  const tasks = [
    { id: "j_stale", title: "Apply: Stale Role", category: "job", status: "pending", targetDate: "2026-07-01", latestDate: "2026-07-10" },
  ];
  const session = { lastIncomingDay: todayKey(d) };
  const call = pickIncomingCaller({ tasks, appointments: [], session, today: d });
  assert.equal(call, null, "expected the one-per-day guard to suppress a non-critical repeat");
});

test("critical override (48h job deadline) beats the one-per-day guard", () => {
  const d = new Date(2026, 6, 20);
  const tasks = [
    { id: "j_urgent", title: "Apply: Urgent Role", category: "job", status: "pending", targetDate: "2026-07-19", latestDate: "2026-07-21" },
  ];
  const session = { lastIncomingDay: todayKey(d) };
  const call = pickIncomingCaller({ tasks, appointments: [], session, today: d });
  assert.ok(call, "expected the critical override to still surface a call");
  assert.equal(call.npcId, "vivian");
});

/* ---------------------------------------------------------------------- *
 * House rules — no em dashes, per-NPC line-length caps, no contractions
 * for Vivian.
 * ---------------------------------------------------------------------- */

test("no em dash in Sal's or Vivian's system prompt", () => {
  for (const [name, text] of [
    ["SAL_SYSTEM_PROMPT", SAL_SYSTEM_PROMPT],
    ["SAL_STYLE", SAL_STYLE],
    ["SAL_RULES", SAL_RULES],
    ["VIVIAN_SYSTEM_PROMPT", VIVIAN_SYSTEM_PROMPT],
    ["VIVIAN_STYLE", VIVIAN_STYLE],
    ["VIVIAN_RULES", VIVIAN_RULES],
  ]) {
    assert.ok(!text.includes("—"), `em dash found in ${name}`);
  }
});

test("no em dash in any Sal or Vivian bank line", () => {
  for (const [npcName, LINES] of [["SAL_LINES", SAL_LINES], ["VIVIAN_LINES", VIVIAN_LINES]]) {
    for (const [bucket, arr] of Object.entries(LINES)) {
      for (const line of arr) {
        assert.ok(!line.includes("—"), `em dash found in ${npcName}.${bucket}: "${line}"`);
      }
    }
  }
});

test("per-NPC bank line length caps: sal <= 130, vivian <= 200", () => {
  for (const line of Object.values(SAL_LINES).flat()) {
    assert.ok(line.length <= 130, `SAL_LINES line too long (${line.length} chars): "${line}"`);
  }
  for (const line of Object.values(VIVIAN_LINES).flat()) {
    assert.ok(line.length <= 200, `VIVIAN_LINES line too long (${line.length} chars): "${line}"`);
  }
});

test("no Vivian bank line contains a contraction", () => {
  for (const [bucket, arr] of Object.entries(VIVIAN_LINES)) {
    for (const line of arr) {
      assert.ok(!/\w'\w/.test(line), `contraction found in VIVIAN_LINES.${bucket}: "${line}"`);
    }
  }
});

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
