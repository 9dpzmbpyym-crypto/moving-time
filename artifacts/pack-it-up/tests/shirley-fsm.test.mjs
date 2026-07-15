/*
 * Shirley phone FSM tests — bank-side (offline) logic + the live-path
 * machine-line parser. Plain Node assert style, same pattern as the other
 * tests/*.test.mjs files. Run with:
 *   node tests/shirley-fsm.test.mjs
 * from artifacts/pack-it-up/.
 */
import assert from "node:assert/strict";
import {
  bankReply,
  cancelAppointment,
  LINES,
  SHIRLEY_SYSTEM_PROMPT,
  SHIRLEY_SHARED_RUNTIME,
  SHIRLEY_STYLE,
  SHIRLEY_RULES,
} from "../src/receptionist.js";
import {
  parseBookTag,
  parseCancelTag,
  parseMarkTag,
  parseAddTag,
} from "../src/receptionistCall.js";

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

/** Minimal health-task fixture mirroring tasks.js's real bookable cards. */
function mkTasks() {
  return [
    {
      id: "t_pcp", title: "Book: PCP — 90-day medication bridge", category: "health",
      zone: "brain", kind: "book", status: "pending", effort: 2, urgency: 2,
    },
    {
      id: "t_teeth", title: "Book: Dentist visit", category: "health",
      zone: "teeth", kind: "book", status: "pending", effort: 2, urgency: 1,
    },
    {
      id: "t_obgyn", title: "Book: OB/GYN — IUD replacement", category: "health",
      zone: "obgyn", kind: "book", status: "pending", effort: 3, urgency: 3,
    },
    {
      id: "c_vet_book", title: "Book: Stretchy's travel vet (meds + certificate)",
      category: "cat", kind: "book", status: "pending", effort: 2, urgency: 3,
    },
  ];
}

/* ---------------------------------------------------------------------- *
 * BUG 1 — opener duplication
 * ---------------------------------------------------------------------- */

/** LINES entries are templates with a {visit} slot; match against the
 *  filled reply regardless of which visit is currently priority. */
function matchesBucket(bucketLines, filledLine) {
  return bucketLines.some((tpl) => {
    const re = new RegExp(
      `^${tpl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\{(\w+)\\\}/g, ".*")}$`
    );
    return re.test(filledLine);
  });
}

test("bare greeting never returns an 'open'-bucket line", () => {
  const tasks = mkTasks();
  const reply = bankReply("Hi Shirley", { phase: "await_visit", draft: {}, priorityId: null }, tasks, []);
  assert.ok(!matchesBucket(LINES.open, reply.line), `greeting produced an open-bucket line: "${reply.line}"`);
  assert.ok(matchesBucket(LINES.greet, reply.line), `expected a greet-bucket line, got: "${reply.line}"`);
});

test("greeting reply never equals the dial-in opener text", () => {
  const tasks = mkTasks();
  const opener = LINES.open[0].replace("{visit}", "the dentist visit");
  const reply = bankReply("hey", { phase: "await_visit", draft: {}, priorityId: null }, tasks, []);
  assert.notEqual(reply.line, opener);
});

test("final catch-all fallback uses probe_day, never open", () => {
  const tasks = mkTasks();
  // Text that matches none of the special-case branches (no greeting, no
  // denial, no date, no cave, no named visit, no reported booking).
  const reply = bankReply("blah blah nonsense", { phase: "await_visit", draft: {}, priorityId: null }, tasks, []);
  assert.ok(!matchesBucket(LINES.open, reply.line), "fallback leaked an open-bucket line");
});

/* ---------------------------------------------------------------------- *
 * BUG 2 — cancel
 * ---------------------------------------------------------------------- */

test("cancelAppointment mirrors bookAppointment's { ok, appointments } shape", () => {
  const appts = [{ id: "a1", taskId: "t_teeth", zone: "teeth", dueAt: "2026-07-20", time: null, status: "booked", reschedules: 0 }];
  const result = cancelAppointment(appts, "t_teeth");
  assert.equal(result.ok, true);
  assert.equal(result.cancelled.status, "cancelled");
  assert.equal(result.appointments.find((a) => a.taskId === "t_teeth").status, "cancelled");
});

test("cancel intent with one active appointment returns cancel_confirm + cancelled appointment", () => {
  const tasks = mkTasks();
  const appts = [{ id: "a1", taskId: "t_teeth", zone: "teeth", dueAt: "2026-07-20", time: null, status: "booked", reschedules: 0 }];
  const reply = bankReply("wait no that was an accident", { phase: "await_visit", draft: {}, priorityId: null }, tasks, appts);
  assert.ok(matchesBucket(LINES.cancel_confirm, reply.line), `expected a cancel_confirm line, got: "${reply.line}"`);
  assert.equal(reply.cancelled.status, "cancelled");
  assert.equal(reply.appointments.find((a) => a.taskId === "t_teeth").status, "cancelled");
});

test("cancel intent with no active appointments says nothing is booked", () => {
  const tasks = mkTasks();
  const reply = bankReply("cancel it", { phase: "await_visit", draft: {}, priorityId: null }, tasks, []);
  assert.ok(!reply.cancelled);
  assert.ok(/nothing/i.test(reply.line));
});

test("cancel intent with multiple active appointments asks which one", () => {
  const tasks = mkTasks();
  const appts = [
    { id: "a1", taskId: "t_teeth", zone: "teeth", dueAt: "2026-07-20", time: null, status: "booked", reschedules: 0 },
    { id: "a2", taskId: "t_obgyn", zone: "obgyn", dueAt: "2026-07-21", time: null, status: "booked", reschedules: 0 },
  ];
  const reply = bankReply("cancel", { phase: "await_visit", draft: {}, priorityId: null }, tasks, appts);
  assert.ok(!reply.cancelled);
  assert.ok(/which one/i.test(reply.line));
});

/* ---------------------------------------------------------------------- *
 * BUG 3 — reported real-world bookings (BOOK / ADD / MARK)
 * ---------------------------------------------------------------------- */

test("reported outside booking matching an open task returns confirm + book payload", () => {
  const tasks = mkTasks();
  const reply = bankReply("I have pcp scheduled for 7/16", { phase: "await_visit", draft: {}, priorityId: null }, tasks, []);
  assert.ok(reply.book?.ok, "expected a successful book payload");
  assert.equal(reply.book.appt.taskId, "t_pcp");
  assert.equal(reply.book.appt.dueAt, "2026-07-16");
  assert.ok(/all set|done/i.test(reply.line));
});

test("multiple reported bookings: handles the first cleanly, mentions the second by name", () => {
  const tasks = mkTasks();
  const reply = bankReply(
    "I have pcp scheduled for 7/16 and vet for 7/18",
    { phase: "await_visit", draft: {}, priorityId: null },
    tasks,
    []
  );
  assert.ok(reply.book?.ok, "expected the first (pcp) to book cleanly");
  assert.equal(reply.book.appt.taskId, "t_pcp");
  assert.equal(reply.book.appt.dueAt, "2026-07-16");
  assert.match(reply.line, /vet/i);
});

test("reported booking with no matching card produces an ADD payload (and appointment when dated)", () => {
  const tasks = mkTasks();
  const reply = bankReply("I already booked an eye exam for 7/22", { phase: "await_visit", draft: {}, priorityId: null }, tasks, []);
  assert.ok(reply.added?.task, "expected an added task payload");
  assert.equal(reply.added.task.category, "health");
  assert.ok(reply.added.appt, "expected an appointment recorded for the new card");
  assert.equal(reply.added.appt.dueAt, "2026-07-22");
  assert.ok(LINES.noted_outside.some((l) => reply.line.startsWith(l)));
  assert.ok(!/mark.*(card|it) (yourself|done)|ledger|body board/i.test(reply.line), "must never tell the player to record it themselves");
});

test("reported booking with no date at all falls through (no ADD, no BOOK)", () => {
  const tasks = mkTasks();
  const reply = bankReply("I already booked something", { phase: "await_visit", draft: {}, priorityId: null }, tasks, []);
  assert.ok(!reply.added);
  assert.ok(!reply.book);
});

test("'I already went to the dentist' produces a MARK done/attended for the teeth card", () => {
  const tasks = mkTasks();
  const appts = [{ id: "a1", taskId: "t_teeth", zone: "teeth", dueAt: "2026-07-10", time: null, status: "booked", reschedules: 0 }];
  const reply = bankReply("I already went to the dentist", { phase: "await_visit", draft: {}, priorityId: null }, tasks, appts);
  assert.ok(reply.marked, "expected a marked payload");
  assert.equal(reply.marked.taskId, "t_teeth");
  assert.equal(reply.marked.status, "attended");
  assert.equal(reply.tasks.find((t) => t.id === "t_teeth").status, "attended");
  assert.equal(reply.appointments.find((a) => a.taskId === "t_teeth").status, "attended");
});

/* ---------------------------------------------------------------------- *
 * Live-path machine-line parser (BOOK / CANCEL / MARK / ADD)
 * ---------------------------------------------------------------------- */

test("parseBookTag still parses a trailing BOOK: line (export signature stable)", () => {
  const { display, book } = parseBookTag('Got it, see you then.\nBOOK:{"taskId":"t_teeth","zone":"teeth","dueAt":"2026-07-20","time":null}');
  assert.equal(display, "Got it, see you then.");
  assert.equal(book.taskId, "t_teeth");
  assert.equal(book.dueAt, "2026-07-20");
});

test("parseCancelTag parses a trailing CANCEL: line", () => {
  const { display, cancel } = parseCancelTag('No problem, I\'ll take it off the books.\nCANCEL:{"taskId":"t_teeth"}');
  assert.equal(display, "No problem, I'll take it off the books.");
  assert.equal(cancel.taskId, "t_teeth");
});

test("parseMarkTag parses a trailing MARK: line with status", () => {
  const { display, mark } = parseMarkTag('Marked, nice work.\nMARK:{"taskId":"t_teeth","status":"attended"}');
  assert.equal(display, "Marked, nice work.");
  assert.equal(mark.taskId, "t_teeth");
  assert.equal(mark.status, "attended");
});

test("parseAddTag parses a trailing ADD: line", () => {
  const { display, add } = parseAddTag('Oh good, I\'ll write that down.\nADD:{"title":"Eye exam","category":"health","dueAt":"2026-07-22"}');
  assert.equal(display, "Oh good, I'll write that down.");
  assert.equal(add.title, "Eye exam");
  assert.equal(add.category, "health");
  assert.equal(add.dueAt, "2026-07-22");
});

test("machine-line parsers chain cleanly on a single sample model reply ending in each tag", () => {
  const sample = 'Sure thing, hon.\nADD:{"title":"Optometrist","category":"health","dueAt":"2026-07-25"}';
  const afterBook = parseBookTag(sample);
  const afterCancel = parseCancelTag(afterBook.display);
  const afterMark = parseMarkTag(afterCancel.display);
  const afterAdd = parseAddTag(afterMark.display);
  assert.equal(afterBook.book, null);
  assert.equal(afterCancel.cancel, null);
  assert.equal(afterMark.mark, null);
  assert.equal(afterAdd.add.title, "Optometrist");
  assert.equal(afterAdd.display, "Sure thing, hon.");
});

/* ---------------------------------------------------------------------- *
 * House rules — no em dashes, plain/short bank lines
 * ---------------------------------------------------------------------- */

test("no line in LINES contains an em dash", () => {
  for (const [bucket, arr] of Object.entries(LINES)) {
    for (const line of arr) {
      assert.ok(!line.includes("—"), `em dash found in LINES.${bucket}: "${line}"`);
    }
  }
});

test("every LINES bucket line is <= 120 characters", () => {
  for (const [bucket, arr] of Object.entries(LINES)) {
    for (const line of arr) {
      assert.ok(line.length <= 120, `LINES.${bucket} line too long (${line.length} chars): "${line}"`);
    }
  }
});

test("system prompt (shared runtime + style + rules) contains no em dash", () => {
  assert.ok(!SHIRLEY_SYSTEM_PROMPT.includes("—"), "em dash found in SHIRLEY_SYSTEM_PROMPT");
  assert.ok(!SHIRLEY_SHARED_RUNTIME.includes("—"), "em dash found in SHIRLEY_SHARED_RUNTIME");
  assert.ok(!SHIRLEY_STYLE.includes("—"), "em dash found in SHIRLEY_STYLE");
  assert.ok(!SHIRLEY_RULES.includes("—"), "em dash found in SHIRLEY_RULES");
});

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
