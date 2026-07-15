/* Shirley — style + ruleset + thin fallback lines + appointment FSM.
   Live dialogue prefers OpenRouter; bank is the same voice, not a form wizard. */

import { isOpen, makeQuickTask } from "./tasks.js";

export const MOVE_DATE_ISO = "2026-07-31";
export const RECEPTIONIST_NAME = "Shirley";

export const ZONE_SHORT = {
  teeth: "the dentist visit",
  brain: "the psychiatry appointment",
  heart: "the cardiology appointment",
  lymph: "the rheumatology appointment",
  stomach: "the diet follow-up",
  skin: "the dermatology appointment",
  nerves: "the self-care check-in",
  obgyn: "the OB/GYN appointment",
};

export const BOOKABLE_ZONES = new Set([
  "teeth", "brain", "heart", "lymph", "skin", "obgyn",
]);

/** Book cards only — habits / Attend cards are never phone bookings. */
export function isBookableHealthTask(t) {
  if (!t || !isOpen(t) || t.kind !== "book") return false;
  if (String(t.id).startsWith("attend_")) return false;
  if (t.category === "health") {
    // Zoned cards from the seed list, plus zone-less quick cards Shirley
    // writes down herself for real-world bookings that match nothing on
    // the board (ADD machine line) — those never get a zone assigned.
    return BOOKABLE_ZONES.has(t.zone) || (!t.zone && String(t.id).startsWith("u_"));
  }
  // Stretchy travel vet Book card (cat lane, Shirley still books it)
  if (t.category === "cat") return true;
  return false;
}

/** Dev/test only — do not call from production boot. */
export function scrambleBookableHealthUrgencies(tasks) {
  const next = (tasks || []).map((t) => {
    if (!isBookableHealthTask(t)) return t;
    return { ...t, urgency: 1 + Math.floor(Math.random() * 3) };
  });
  const openBookable = next.filter((t) => isBookableHealthTask(t));
  if (openBookable.length && !openBookable.some((t) => (t.urgency || 0) >= 3)) {
    const hit = openBookable[Math.floor(Math.random() * openBookable.length)];
    return next.map((t) => (t.id === hit.id ? { ...t, urgency: 3 } : t));
  }
  return next;
}

export function todayISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysUntilMove(d = new Date()) {
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const b = new Date(2026, 6, 31);
  return Math.max(0, Math.round((b - a) / 86400000));
}

export function parseISODate(s) {
  if (!s || typeof s !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const dt = new Date(y, mo, day);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== day) return null;
  return dt;
}

export function formatApptDay(iso) {
  const dt = parseISODate(iso);
  if (!dt) return iso || "?";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[dt.getMonth()]} ${dt.getDate()}`;
}

function fill(template, ctx = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, k) => (
    ctx[k] != null ? String(ctx[k]) : `{${k}}`
  ));
}

function pick(arr) {
  if (!arr || !arr.length) return "";
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Module-level "last line served" per bucket, so a 2-line bucket doesn't
 *  coin-flip into repeating itself back to back (e.g. two "greet" turns
 *  in a row landing on the exact same line). Session-lifetime only. */
const lastPick = new Map();

function pickFresh(bucket, arr) {
  if (!arr || !arr.length) return "";
  if (arr.length === 1) return arr[0];
  const last = lastPick.get(bucket);
  let choice = pick(arr);
  if (choice === last) {
    const rest = arr.filter((l) => l !== last);
    choice = pick(rest.length ? rest : arr);
  }
  lastPick.set(bucket, choice);
  return choice;
}

/* ============================================================
   CHARACTER — style + ruleset (canonical). Thin lines = offline twin.
   ============================================================ */

/** Move-spine source: docs/move-spine/prompts/RUNTIME_SYSTEM_PROMPTS.md
 *  (+ npc-guides/SHIRLEY_HEALTH_RECEPTIONIST.md for lifecycle / boundaries).
 *  Shared wrapper there asks for JSON; we keep plain dialogue + BOOK: so the
 *  existing phone FSM / parseBookTag path still works. */
export const SHIRLEY_SHARED_RUNTIME = `
You are an in-game NPC in Pack It Up, a cozy moving productivity game.

Speak as the assigned character. You are on the phone with the player about their real-world tasks. Keep the conversation short.

Rules:
* when a call starts, answer like a person picking up a desk phone: office, your name, one short nudge. No speeches, no bits in the pickup
* ask for one concrete action or status update
* stay on the current task
* if the player stalls, end the call (Debbie exit / short hang-up line is fine)
* never use an em dash or double hyphen anywhere. Use a comma or start a new sentence
* do not use "it is not X, it is Y" reframes
* do not use metaphor-swap punchlines ("X is just Y with Z"); humor comes from specifics, not wordplay
* do not use emoji
* do not use markdown
* do not sound like a chatbot
* do not repeat the examples verbatim
* vary wording
* do not give medical, legal, financial, or safety advice beyond telling the player to contact the proper provider or follow their existing plan
* if the player reports completion, confirm the status and end cleanly
* at most one joke per call. Most replies are plain logistics
`.trim();

export const SHIRLEY_STYLE = `
You are Shirley, a medical office receptionist.

You are practical and a little tired, and you care about the player using their health coverage before the move. You are not sweet in a normal way. You are not a therapist. You are not a medical provider.

You are allowed to sound like these calibration lines, but do not copy them constantly:

"Doctor's office, this is Shirley."

"Okay. What day works for you?"

"You're all set for the 25th at ten. Bring your insurance card."

"No problem, I'll take it off the books. Want me to rebook it?"

"Honestly, hon, just come in before the 31st. After that your insurance is gone."

"Hold on. Debbie's using the good printer again."

"Book the dentist, hon. Teeth are luxury bones."

A real front-desk woman. Plain, brief, practical, a little tired, quietly kind. Says hon. Most lines are simple logistics: days, times, insurance cards, what happened. At most one dry joke per call, often none. Debbie exists but comes up rarely. She never performs, never stacks punchlines, never talks in quips. She also books Stretchy the cat's travel vet and treats it as normal desk work.
`.trim();

export const SHIRLEY_RULES = `
Your job is to get a health task into the correct status:
not_started, requested, scheduled, reminded, attended, labs_or_records_needed, refill_needed, records_needed, followup_needed, complete, or deferred_to_nyc.

Ask for dates and times when scheduling. Ask if they attended after the date passes. Ask if records, labs, refills, or follow-up are needed.

Never mark a task complete just because it is scheduled. Scheduling and attending are different.

Allowed actions only: schedule, confirm, remind, attend, refill, request records, request labs, ask the clinician, mark complete, or defer to NYC.

Do not give medical advice. Tell the player to call the office, ask the clinician, request records, or mark what happened.

Call behavior:
* priorityVisit is the default nudge, but the player may book ANY item in openHealthTasks, including Stretchy's travel vet (category cat) and PCP. If they name another open visit, switch to that taskId, confirm which one, and ask for a date/time. Never refuse Stretchy, PCP, or any listed visit just because another one is listed first. The vet is normal desk work for you, never say you do not handle it.
* If nothing is booked: ask what they are going to book and give one concrete next step (a date/time).
* If they give a date and time: confirm in-character, emit BOOK (below), then you may end the call.
* If they talk around the task: redirect once. If they keep stalling, hang up.
* If the appointment date passed: ask whether they attended and what status should be recorded.
* OBJECTIVE THREAD: name the visit you are currently booking (the one the player picked, else priorityVisit). Do not go more than one message without it.

If the player says they already made an appointment in the real world, that is GOOD news. Record it: if it matches an item in openHealthTasks, confirm and emit BOOK with their stated date. If the player reports an appointment or completed visit that matches nothing you can see, write it down yourself: emit ADD (and MARK when they say it already happened). Never tell the player to go mark a card themselves. You hold the pen. Never scold the player for booking things themselves and never claim you cannot write down reality.
`.trim();

export const SHIRLEY_SYSTEM_PROMPT = `${SHIRLEY_SHARED_RUNTIME}

${SHIRLEY_STYLE}

${SHIRLEY_RULES}

FACTS (JSON below) are authoritative. Use priorityVisit, daysLeft, openHealthTasks, bookedAppointments. Do not invent bookings or specialties beyond FACTS. Stretchy's travel vet appears in openHealthTasks when available, and it is a real visit you book like any other.

When the user clearly books with a date (optional time) and you can match an openHealthTasks.id, end with a machine line alone on its own last line:
BOOK:{"taskId":"...","zone":"...","dueAt":"YYYY-MM-DD","time":"HH:mm"|null}
zone may be null for Stretchy/cat tasks. Only BOOK when facts are complete.

If the player clearly cancels or says a booking was a mistake, confirm which visit, then end with a machine line alone: CANCEL:{"taskId":"..."}. Only cancel bookings present in bookedAppointments.

If the player reports a visit that already happened, confirm it warmly, then end with a machine line alone: MARK:{"taskId":"...","status":"done"|"attended"}. Only mark tasks present in openHealthTasks or bookedAppointments.

If the player reports a real booking or completed visit that matches nothing in openHealthTasks, write it down yourself, then end with a machine line alone: ADD:{"title":"...","category":"health"|"cat","dueAt":"YYYY-MM-DD"|null}. Never tell the player to record it themselves, you hold the pen.

OUTPUT RULES (hard):
* Reply with ONLY Shirley speaking to the player, one to four short sentences.
* Never narrate your reasoning. Never mention FACTS, taskId, openHealthTasks, prompts, or rules.
* Never write "let me craft", "the player says", or draft options out loud.
* Never repeat or closely paraphrase your previous message. If the player just greets you, greet back in one short fresh line and re-ask for the one thing you need.
* No emoji. No markdown.`;

/** Tiny offline bank. Natural desk lines; calibration bits only as seasoning.
 *  HOUSE RULE: no em dashes anywhere in here. The live model imitates whatever
 *  shapes these lines use, so they double as style calibration. */
export const LINES = {
  open: [
    "Doctor's office, this is Shirley. I still need a day from you for {visit}.",
    "Doctor's office, Shirley speaking. Calling about {visit}. What day works?",
    "Hi, it's Shirley at the office. We should get {visit} on the calendar. Any day good?",
  ],
  open_remind: [
    "Hi, it's Shirley. Just a reminder, you've got {visit} on {day}. Bring your insurance card.",
    "Shirley here. {visit} is {day}. See you then.",
  ],
  open_overdue: [
    "Hi, it's Shirley. You missed {visit}. It happens. Let's pick a new day.",
    "Shirley calling. We had you down for {visit} and didn't see you. Want to rebook?",
  ],
  deny: [
    "Okay. You've got {days} days left on your insurance though. What day could work for {visit}?",
    "That's fine, but the clock is real. {days} days. Think about a day for {visit}.",
  ],
  deny2: [
    "I still need a day, hon. {visit}. Anything. Morning, afternoon, whatever you've got.",
    "We can do this next call, but there are only {days} days left. {visit} needs a date.",
  ],
  cave: [
    "Good. What day?",
    "Okay, great. Give me a day for {visit} and I'll put you in.",
  ],
  lore: [
    "Same as always here. Debbie's using the good printer again. Anyway, about {visit}.",
    "Busy morning. Anyway, I've still got {visit} open for you.",
    "Oh, you know. Phones, files, Debbie. Where are we on {visit}?",
  ],
  greet: [
    "Hi hon. Where are we on {visit}?",
    "Hey. Any news on {visit}?",
  ],
  probe_day: [
    "What day works? I'll put you in for {visit}.",
    "Give me a day for {visit} and you're set.",
    "Morning or afternoon for {visit}? I've got room most days.",
  ],
  confirm: [
    "You're all set. {visit} on {day}{timeBit}. Bring your insurance card.",
    "Done, {visit} on {day}{timeBit}. See you then.",
  ],
  trap: [
    "And {priority}? Want to knock that one out too while I have you?",
    "While I've got you, {priority} is still open. Want a day for that one?",
  ],
  close_left: [
    "Okay, call me back about {open}. Have a good one.",
    "Alright. {open} is still open when you're ready. Bye hon.",
  ],
  close_done: [
    "You're booked. That's everything. Take care, hon.",
    "All set. See you then. TAKE CARE.",
  ],
  stall_hangup: [
    "I've got another call, hon. Book {visit} when you can, you've got {days} days. TAKE CARE OF THAT {care}.",
    "I have to run. Think about a day for {visit}. Bye.",
  ],
  hangup_player: [
    "Okay, bye hon. Don't forget {visit}.",
    "Bye. Call me back about {visit}.",
  ],
  cancel_confirm: [
    "No problem, I'll take {visit} off the books. Want a new day?",
    "Okay, cancelled. If you change your mind just call back.",
  ],
  noted_outside: [
    "Oh good. I'll write that down on my end.",
    "Perfect, I'll note it. Anything else you've already booked?",
  ],
};

export function pickLine(bucket, ctx = {}) {
  const key = LINES[bucket] ? bucket : "open";
  const line = pickFresh(key, LINES[key]);
  return fill(line, ctx);
}

export function carePhrase(visitOrZone) {
  const v = typeof visitOrZone === "string" && !ZONE_SHORT[visitOrZone]
    ? visitOrZone
    : visitLabel(visitOrZone);
  if (/derm|skin/i.test(v)) return "YOUNG SKIN";
  if (/dent|teeth/i.test(v)) return "TEETH";
  if (/cardio|heart/i.test(v)) return "HEART";
  if (/rheum|joint/i.test(v)) return "JOINTS";
  if (/psych|brain/i.test(v)) return "BRAIN";
  if (/ob.?gyn|iud/i.test(v)) return "OB/GYN";
  if (/vet|stretchy/i.test(v)) return "STRETCHY";
  return String(v || "BODY").toUpperCase();
}

export function ctxFor(visit, days) {
  return {
    visit: visit || "that appointment",
    days: days != null ? String(days) : String(daysUntilMove()),
    care: carePhrase(visit),
    day: "",
    timeBit: "",
    priority: visit,
    open: visit,
  };
}

export function visitLabel(taskOrZone) {
  if (!taskOrZone) return "that appointment";
  if (typeof taskOrZone === "string") {
    return ZONE_SHORT[taskOrZone] || taskOrZone;
  }
  // Stretchy's vet rides the health desk. Give it a spoken name, not a card title.
  if (taskOrZone.category === "cat") return "Stretchy's travel vet visit";
  // Zone nickname FIRST: raw ledger titles read stilted on the phone and carry
  // typos straight into Shirley's mouth. Titles are the fallback, not the voice.
  const short = ZONE_SHORT[taskOrZone.zone];
  if (short) return short;
  if (taskOrZone.title) {
    const cleaned = String(taskOrZone.title).replace(/^Book:\s*/i, "").trim();
    if (cleaned) return cleaned;
  }
  return "that appointment";
}

/** Highest-urgency open bookable health task. Ties break by id (stable). */
export function priorityHealthTask(tasks, appointments = []) {
  const bookedIds = new Set(
    (appointments || [])
      .filter((a) => a && (a.status === "booked" || a.status === "reminded"))
      .map((a) => a.taskId)
  );
  const open = (tasks || []).filter(
    (t) => isBookableHealthTask(t) && !bookedIds.has(t.id)
  );
  if (!open.length) return null;
  open.sort((a, b) => {
    const du = (b.urgency || 0) - (a.urgency || 0);
    if (du) return du;
    return String(a.id).localeCompare(String(b.id));
  });
  return open[0];
}

export function openBookableTasks(tasks, appointments = []) {
  const bookedIds = new Set(
    (appointments || [])
      .filter((a) => a && (a.status === "booked" || a.status === "reminded"))
      .map((a) => a.taskId)
  );
  return (tasks || []).filter((t) => isBookableHealthTask(t) && !bookedIds.has(t.id));
}

export function activeAppointments(appointments = []) {
  return (appointments || []).filter(
    (a) => a && (a.status === "booked" || a.status === "reminded")
  );
}

export function findApptForTask(appointments, taskId) {
  return (appointments || []).find(
    (a) => a && a.taskId === taskId && ["booked", "reminded", "missed"].includes(a.status)
  );
}

export function apptDueToday(appt, d = new Date()) {
  return appt && appt.dueAt === todayISO(d);
}

export function apptOverdue(appt, d = new Date()) {
  if (!appt || !appt.dueAt) return false;
  if (appt.status === "attended" || appt.status === "cancelled") return false;
  return appt.dueAt < todayISO(d);
}

export function apptWithin48h(appt, d = new Date()) {
  if (!appt || !appt.dueAt) return false;
  if (appt.status !== "booked" && appt.status !== "reminded") return false;
  const due = parseISODate(appt.dueAt);
  if (!due) return false;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((due - start) / 86400000);
  return diff >= 0 && diff <= 2;
}

export function getNudge(appointments = [], tasks = [], d = new Date()) {
  const active = activeAppointments(appointments);
  const overdue = active.find((a) => apptOverdue(a, d));
  if (overdue) {
    return { kind: "overdue", appt: overdue, task: (tasks || []).find((t) => t.id === overdue.taskId) };
  }
  const soon = active.find((a) => apptWithin48h(a, d) && a.status === "booked");
  if (soon) {
    return { kind: "remind", appt: soon, task: (tasks || []).find((t) => t.id === soon.taskId) };
  }
  const pri = priorityHealthTask(tasks, appointments);
  if (pri) return { kind: "cold", appt: null, task: pri };
  return null;
}

export function openerForNudge(nudge, appointments, tasks, days = daysUntilMove()) {
  const c = (visit, extra = {}) => ({ ...ctxFor(visit, days), ...extra });
  if (!nudge) {
    const pri = priorityHealthTask(tasks, appointments);
    return pickLine("open", c(visitLabel(pri)));
  }
  if (nudge.kind === "overdue") {
    return pickLine("open_overdue", c(visitLabel(nudge.task || nudge.appt?.zone), {
      day: formatApptDay(nudge.appt?.dueAt),
    }));
  }
  if (nudge.kind === "remind") {
    return pickLine("open_remind", c(visitLabel(nudge.task || nudge.appt?.zone), {
      day: formatApptDay(nudge.appt?.dueAt),
    }));
  }
  return pickLine("open", c(visitLabel(nudge.task)));
}

/* ---------- FSM ---------- */

function newId() {
  return `appt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function sanitizeAppointments(raw) {
  if (!Array.isArray(raw)) return [];
  const ok = new Set(["booked", "reminded", "attended", "missed", "cancelled"]);
  return raw
    .filter((a) => a && a.taskId && a.dueAt && ok.has(a.status))
    .map((a) => ({
      id: a.id || newId(),
      taskId: String(a.taskId),
      zone: a.zone || null,
      dueAt: String(a.dueAt),
      time: a.time ? String(a.time) : null,
      status: a.status,
      reschedules: Math.max(0, Number(a.reschedules) || 0),
    }));
}

export function bookAppointment(appointments, tasks, draft, moveDateIso = MOVE_DATE_ISO) {
  const taskId = draft?.taskId;
  const task = (tasks || []).find((t) => t.id === taskId);
  if (!task || !isBookableHealthTask(task)) {
    return { ok: false, appointments, error: "unknown_task" };
  }
  const dueAt = draft?.dueAt;
  const due = parseISODate(dueAt);
  if (!due) return { ok: false, appointments, error: "bad_date" };
  if (dueAt > moveDateIso) return { ok: false, appointments, error: "after_move" };
  if (dueAt < todayISO()) return { ok: false, appointments, error: "past_date" };
  let time = draft?.time || null;
  if (time && !/^\d{1,2}:\d{2}$/.test(time)) time = null;
  if (time && time.length === 4) time = `0${time}`;

  const zone = task.zone;
  const existing = (appointments || []).filter(
    (a) => !(a.taskId === taskId && ["booked", "reminded", "missed"].includes(a.status))
  );
  const appt = {
    id: newId(),
    taskId,
    zone,
    dueAt,
    time,
    status: "booked",
    reschedules: 0,
  };
  return { ok: true, appointments: [...existing, appt], appt, error: null };
}

/** Cancel the active (booked/reminded) appointment for a task. Mirrors
 *  bookAppointment's { ok, appointments, ... } contract. */
export function cancelAppointment(appointments, taskId) {
  const list = appointments || [];
  const idx = list.findIndex(
    (a) => a && a.taskId === taskId && (a.status === "booked" || a.status === "reminded")
  );
  if (idx === -1) return { ok: false, appointments: list, error: "no_active_appointment" };
  const cancelled = { ...list[idx], status: "cancelled" };
  const next = list.map((a, i) => (i === idx ? cancelled : a));
  return { ok: true, appointments: next, cancelled, error: null };
}

export function markReminded(appointments, apptId) {
  return (appointments || []).map((a) =>
    a.id === apptId && a.status === "booked" ? { ...a, status: "reminded" } : a
  );
}

export function markMissed(appointments, d = new Date()) {
  const today = todayISO(d);
  return (appointments || []).map((a) => {
    if ((a.status === "booked" || a.status === "reminded") && a.dueAt < today) {
      return { ...a, status: "missed" };
    }
    return a;
  });
}

export function attendAppointment(appointments, apptId) {
  return (appointments || []).map((a) =>
    a.id === apptId && (a.status === "booked" || a.status === "reminded")
      ? { ...a, status: "attended" }
      : a
  );
}

export function canAttendZone(appointments, zone, d = new Date()) {
  const today = todayISO(d);
  return (appointments || []).find(
    (a) =>
      a.zone === zone
      && (a.status === "booked" || a.status === "reminded")
      && a.dueAt === today
  ) || null;
}

export function confirmLine(appt, task, days = daysUntilMove()) {
  const visit = visitLabel(task || appt?.zone);
  return pickLine("confirm", {
    ...ctxFor(visit, days),
    day: formatApptDay(appt?.dueAt),
    timeBit: appt?.time ? ` at ${appt.time}` : "",
  });
}

export function closeLine(tasks, appointments, days = daysUntilMove()) {
  const still = priorityHealthTask(tasks, appointments);
  if (!still) return pickLine("close_done", ctxFor("appointment", days));
  return pickLine("close_left", { ...ctxFor(visitLabel(still), days), open: visitLabel(still) });
}

export function trapLine(priorityTask, days = daysUntilMove()) {
  return pickLine("trap", { ...ctxFor(visitLabel(priorityTask), days), priority: visitLabel(priorityTask) });
}

/* ---------- Conversation helpers ---------- */

export function isGreeting(text) {
  const t = String(text || "").trim();
  return /^(hi|hey|hello|yo|sup|hiya)\b/i.test(t)
    || /^(hi|hey|hello)\s*,?\s*shirley\b/i.test(t);
}

export function isSmallTalk(text) {
  const t = String(text || "").trim();
  if (!t || isDenial(t) || isSoftYes(t) || isCave(t) || parseUserDateTime(t).dueAt) return false;
  return /\b(what('?re| are) you up to|how are you|how'?s it going|what'?s up|whats up|you good|diane|cigarette|busy)\b/i.test(t)
    || /^(how are you|what'?s up|whats up)\??$/i.test(t);
}

export function isDenial(text) {
  const t = String(text || "").trim();
  if (!t) return false;
  if (/^(no|nope|nah|not yet|nothing|nothing yet|not really)\.?$/i.test(t)) return true;
  return /\b(haven'?t|have not|nothing yet|not booked|not yet|no appointment)\b/i.test(t)
    && !/\b(i booked|already booked)\b/i.test(t);
}

export function isSoftYes(text) {
  const t = String(text || "").trim();
  return /^(yes|yeah|yep|yup|i did|booked)\.?$/i.test(t)
    || /\b(i (already )?booked|yes i did)\b/i.test(t);
}

export function isCave(text) {
  const t = String(text || "").trim();
  return /\b(ugh\s*okay|okay fine|fine\b|alright fine|i'?ll book|you win|whatever fine)\b/i.test(t)
    || /^(fine|ok fine|okay fine|ugh fine)\.?$/i.test(t);
}

export function parseUserDateTime(text) {
  const t = String(text || "");
  let dueAt = null;
  let time = null;
  const iso = t.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) dueAt = iso[1];
  const md = t.match(/\b(?:july|jul|august|aug|june|jun)\s+(\d{1,2})\b/i);
  if (!dueAt && md) {
    const mon = md[0].toLowerCase();
    let month = 6;
    if (mon.startsWith("aug")) month = 7;
    if (mon.startsWith("jun")) month = 5;
    dueAt = `2026-${String(month + 1).padStart(2, "0")}-${String(Number(md[1])).padStart(2, "0")}`;
  }
  // Bare slash dates ("7/16", "7/16/26") — players report real-world
  // bookings this way more often than "July 16".
  const slash = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?\b/);
  if (!dueAt && slash) {
    const mo = Number(slash[1]);
    const da = Number(slash[2]);
    if (mo >= 1 && mo <= 12 && da >= 1 && da <= 31) {
      dueAt = `2026-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}`;
    }
  }
  const tm = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (tm) {
    let h = Number(tm[1]);
    const min = tm[2] ? Number(tm[2]) : 0;
    const ap = tm[3].toLowerCase();
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    time = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
  return { dueAt, time };
}

// Named visits the player actually says (Stretchy / PCP / specialties).
// Shared by matchTaskFromText (open-only) and matchAnyTaskFromText (any status).
const NAMED_VISIT_MATCHERS = [
  [/stretchy|travel vet|\bvet\b|\bcat\b/, (x) => x.category === "cat" || /stretchy|vet/i.test(x.title || "")],
  [/pcp|primary care|med(?:ication)? bridge|prescriber/, (x) => x.id === "t_pcp" || /pcp/i.test(x.title || "")],
  [/ob\s*\/?\s*gyn|iud/, (x) => x.zone === "obgyn"],
  [/dent|teeth|tooth/, (x) => x.zone === "teeth"],
  [/rheum|lymph|joint|\blabs?\b/, (x) => x.zone === "lymph"],
  [/cardio|heart/, (x) => x.zone === "heart"],
  [/derm|skin/, (x) => x.zone === "skin"],
  [/psych|brain|psychiatr|med renew/, (x) => x.zone === "brain" && x.id !== "t_pcp"],
];

export function matchTaskFromText(text, tasks, appointments) {
  const t = String(text || "").toLowerCase();
  const open = openBookableTasks(tasks, appointments);
  if (!open.length) return null;

  for (const [re, pred] of NAMED_VISIT_MATCHERS) {
    if (!re.test(t)) continue;
    const hit = open.find(pred);
    if (hit) return hit;
  }

  // Title / id keyword fallback for any open bookable.
  for (const task of open) {
    const hay = `${task.id} ${task.title || ""} ${task.zone || ""}`.toLowerCase();
    const words = hay.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
    if (words.some((w) => t.includes(w))) return task;
  }
  return null;
}

/** Same named-visit matching as matchTaskFromText, but against ANY bookable
 *  task regardless of open/booked status — used for "I already went to X" /
 *  reported-booking flows where the visit may already be on the calendar. */
export function matchAnyTaskFromText(text, tasks) {
  const t = String(text || "").toLowerCase();
  const all = (tasks || []).filter((x) => isBookableHealthTask(x));
  for (const [re, pred] of NAMED_VISIT_MATCHERS) {
    if (!re.test(t)) continue;
    const hit = all.find((x) => pred(x));
    if (hit) return hit;
  }
  return null;
}

/** Strip connective/date words from a reported-booking clause to get a
 *  human title for a new ad hoc card ("vet for 7/18" -> "Vet"). */
export function deriveReportedTitle(clause) {
  let s = String(clause || "")
    .replace(/\b(i|have|already|got|scheduled|booked|an|a|for|on|at|and)\b/gi, " ")
    .replace(/\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/g, " ")
    .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}\b/gi, " ")
    .replace(/\d{1,2}(:\d{2})?\s*(am|pm)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "Outside appointment";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Split a message into clauses so "PCP for 7/16 and vet for 7/18" pairs
 *  each visit with its own date instead of cross-wiring the first date
 *  found in the whole string to whichever visit regex fires first. */
export function splitReportedClauses(text) {
  return String(text || "")
    .split(/\band\b|,/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

const STALL_HANGUP_AFTER = 4; // player turns with no booking progress

/**
 * Offline Shirley — same style/rules as the live prompt.
 * callState: { draft, priorityId, denyCount, stall, skippedObjective }
 */
export function bankReply(userText, callState, tasks, appointments, days = daysUntilMove()) {
  const locked = callState?.priorityId
    ? (tasks || []).find((t) => t.id === callState.priorityId && isBookableHealthTask(t))
    : null;
  const priority = locked || priorityHealthTask(tasks, appointments);
  const visit = visitLabel(priority);
  const base = ctxFor(visit, days);
  const text = String(userText || "").trim();
  const withPriority = {
    ...callState,
    priorityId: priority?.id || callState?.priorityId || null,
  };

  const bumpStall = (n = 1) => (Number(callState?.stall) || 0) + n;
  const clearStall = { stall: 0 };
  const focusCtx = (taskId) => {
    const task = taskId ? (tasks || []).find((x) => x.id === taskId) : priority;
    return ctxFor(visitLabel(task || priority), days);
  };

  if (/gotta go|hang up|bye|later/i.test(text)) {
    return {
      line: pickLine("hangup_player", base),
      callState: withPriority,
      hangup: true,
      book: null,
    };
  }

  // Cave / compliance → win + Diane exit hangup
  if (isCave(text) && !parseUserDateTime(text).dueAt) {
    return {
      line: pickLine("cave", base),
      callState: {
        ...withPriority,
        ...clearStall,
        draft: priority ? { taskId: priority.id } : (callState?.draft || {}),
        phase: "await_day",
      },
      hangup: true,
      book: null,
    };
  }

  // Player wants to unbook something ("wait no that was an accident").
  if (/(cancel|nevermind|never mind|that was (an accident|a mistake)|undo|wrong (day|date|time))/i.test(text)) {
    const active = activeAppointments(appointments);
    if (!active.length) {
      return {
        line: "Cancel what, hon? There's nothing of yours on my books right now.",
        callState: withPriority,
        hangup: false,
        book: null,
      };
    }
    if (active.length > 1) {
      const list = active
        .map((a) => visitLabel((tasks || []).find((t) => t.id === a.taskId) || a.zone))
        .join(", ");
      return {
        line: `Which one, hon? I've got ${list} on the books for you.`,
        callState: withPriority,
        hangup: false,
        book: null,
      };
    }
    const appt = active[0];
    const cancelTask = (tasks || []).find((t) => t.id === appt.taskId);
    const cancelVisit = visitLabel(cancelTask || appt.zone);
    const result = cancelAppointment(appointments, appt.taskId);
    return {
      line: pickLine("cancel_confirm", { ...ctxFor(cancelVisit, days), visit: cancelVisit }),
      callState: { ...withPriority, stall: 0 },
      hangup: false,
      book: null,
      cancelled: result.cancelled,
      appointments: result.appointments,
    };
  }

  // Player reports a visit that already happened in the real world.
  if (/\b(already (went|attended|been|did)|i went to|i was at|went to (the|my|a)\b|attended (the|my)\b)/i.test(text)) {
    const attendedTask = matchAnyTaskFromText(text, tasks);
    if (attendedTask) {
      const nextTasks = (tasks || []).map((t) => (
        t.id === attendedTask.id ? { ...t, status: "attended" } : t
      ));
      const existingAppt = findApptForTask(appointments, attendedTask.id);
      const nextAppointments = existingAppt
        ? attendAppointment(appointments, existingAppt.id)
        : appointments;
      const attendedVisit = visitLabel(attendedTask);
      return {
        line: `Marked ${attendedVisit} attended. Look at you, following through.`,
        callState: withPriority,
        hangup: false,
        book: null,
        marked: { taskId: attendedTask.id, status: "attended" },
        tasks: nextTasks,
        appointments: nextAppointments,
      };
    }
  }

  // Player reports a booking they made themselves, outside this call
  // ("I have pcp scheduled for 7/16 and vet for 7/18"). Recording reality
  // is her job: book it if it matches an open visit, write it down (ADD)
  // if it matches nothing she can see.
  if (/\b(i (?:have|already|got)|scheduled|booked)\b/i.test(text)) {
    const clauses = splitReportedClauses(text);
    const items = clauses.length ? clauses : [text];
    const first = items[0];
    const { dueAt: firstDueAt, time: firstTime } = parseUserDateTime(first);
    if (firstDueAt) {
      const restClause = items[1];
      const restTask = restClause ? matchAnyTaskFromText(restClause, tasks) : null;
      const restLabel = restClause ? (restTask ? visitLabel(restTask) : deriveReportedTitle(restClause)) : null;
      const reportedTask = matchAnyTaskFromText(first, tasks);
      if (reportedTask) {
        const result = bookAppointment(appointments, tasks, {
          taskId: reportedTask.id,
          dueAt: firstDueAt,
          time: firstTime,
        });
        if (result.ok) {
          const confirm = confirmLine(result.appt, reportedTask, days);
          const mention = restLabel ? ` Mentioned ${restLabel} too, we'll get that one squared away next.` : "";
          return {
            line: `${confirm}${mention}`,
            callState: {
              ...withPriority,
              priorityId: priority?.id || callState?.priorityId || null,
              draft: {},
              stall: 0,
            },
            hangup: false,
            book: result,
            appointments: result.appointments,
          };
        }
      } else {
        const title = deriveReportedTitle(first);
        const newTask = makeQuickTask({
          title,
          category: "health",
          effort: 1,
          binding: { feature: "health_appointment", trigger: "booked", target: null },
        });
        const withNewTask = [...(tasks || []), newTask];
        const apptResult = bookAppointment(appointments, withNewTask, {
          taskId: newTask.id,
          dueAt: firstDueAt,
          time: firstTime,
        });
        const mention = restLabel ? ` Mentioned ${restLabel} too, tell me when you're ready for that one.` : "";
        return {
          line: `${pickLine("noted_outside", base)}${mention}`,
          callState: withPriority,
          hangup: false,
          book: null,
          added: { task: newTask, appt: apptResult.ok ? apptResult.appt : null },
          tasks: withNewTask,
          appointments: apptResult.ok ? apptResult.appointments : appointments,
        };
      }
    }
  }

  let draft = { ...(callState?.draft || {}) };
  const matched = matchTaskFromText(text, tasks, appointments);
  if (matched) draft.taskId = matched.id;
  const { dueAt, time } = parseUserDateTime(text);
  if (dueAt) draft.dueAt = dueAt;
  if (time) draft.time = time;

  // Player named a different open visit (Stretchy, PCP, …) — switch to it and ask for a day.
  if (matched && !dueAt) {
    const switched = visitLabel(matched);
    return {
      line: pickLine("probe_day", ctxFor(switched, days)),
      callState: {
        ...withPriority,
        priorityId: matched.id,
        draft: { taskId: matched.id },
        phase: "await_day",
        stall: 0,
        skippedObjective: false,
      },
      hangup: false,
      book: null,
    };
  }

  // Progress if date arrived
  if (draft.taskId && draft.dueAt) {
    const result = bookAppointment(appointments, tasks, draft);
    if (result.ok) {
      const task = (tasks || []).find((t) => t.id === draft.taskId);
      const confirm = confirmLine(result.appt, task, days);
      const still = priorityHealthTask(tasks, result.appointments);
      const bookedPri = priority && draft.taskId === priority.id;
      if (still && !bookedPri) {
        return {
          line: `${confirm} ${trapLine(still, days)}`,
          callState: { phase: "await_visit", draft: {}, priorityId: still.id, stall: 0 },
          hangup: false,
          book: result,
          appointments: result.appointments,
        };
      }
      return {
        line: `${confirm} ${closeLine(tasks, result.appointments, days)}`,
        callState: { phase: "done", draft: {}, stall: 0 },
        hangup: true,
        book: result,
        appointments: result.appointments,
      };
    }
  }

  if (isDenial(text)) {
    const denyCount = (Number(callState?.denyCount) || 0) + 1;
    return {
      line: pickLine(denyCount >= 2 ? "deny2" : "deny", base),
      callState: {
        ...withPriority,
        denyCount,
        stall: bumpStall(0), // denial is engagement, don't hang for this
        draft: priority ? { taskId: priority.id } : draft,
        phase: "await_day",
        skippedObjective: false,
      },
      hangup: false,
      book: null,
    };
  }

  if (isSoftYes(text) && priority) {
    draft.taskId = draft.taskId || priority.id;
    return {
      line: pickLine("probe_day", focusCtx(draft.taskId)),
      callState: { ...withPriority, ...clearStall, phase: "await_day", draft, skippedObjective: false },
      hangup: false,
      book: null,
    };
  }

  if (/book both|i'?ll book|book it/i.test(text) && priority) {
    draft.taskId = draft.taskId || priority.id;
  }

  // Greet / small talk — lore, but rule #1: mention objective (unless last msg already did and we skip once — we always mention in these lines)
  if (isGreeting(text)) {
    const stall = bumpStall();
    if (stall >= STALL_HANGUP_AFTER) {
      return { line: pickLine("stall_hangup", base), callState: withPriority, hangup: true, book: null };
    }
    return {
      line: pickLine("greet", base),
      callState: { ...withPriority, stall, skippedObjective: false },
      hangup: false,
      book: null,
    };
  }

  if (isSmallTalk(text)) {
    const stall = bumpStall();
    if (stall >= STALL_HANGUP_AFTER) {
      return { line: pickLine("stall_hangup", base), callState: withPriority, hangup: true, book: null };
    }
    return {
      line: pickLine("lore", base),
      callState: { ...withPriority, stall, skippedObjective: false },
      hangup: false,
      book: null,
    };
  }

  // Awaiting day
  if ((draft.taskId || priority) && !draft.dueAt) {
    if (!draft.taskId && priority) draft.taskId = priority.id;
    const scheduling = /\b(day|date|july|aug|book|schedule|am|pm|\d)\b/i.test(text);
    if (scheduling) {
      return {
        line: pickLine("probe_day", focusCtx(draft.taskId)),
        callState: { ...withPriority, phase: "await_day", draft, stall: 0, skippedObjective: false },
        hangup: false,
        book: null,
      };
    }
    const stall = bumpStall();
    if (stall >= STALL_HANGUP_AFTER) {
      return { line: pickLine("stall_hangup", focusCtx(draft.taskId)), callState: withPriority, hangup: true, book: null };
    }
    // Still mention objective (rule 1)
    return {
      line: pickLine("lore", focusCtx(draft.taskId)),
      callState: { ...withPriority, stall, draft, skippedObjective: false },
      hangup: false,
      book: null,
    };
  }

  // Default fallback — never "open" (that bucket is call-pickup only).
  // Nudge back toward the one concrete thing she needs: a day.
  const stall = bumpStall();
  if (stall >= STALL_HANGUP_AFTER) {
    return { line: pickLine("stall_hangup", base), callState: withPriority, hangup: true, book: null };
  }
  return {
    line: pickLine("probe_day", base),
    callState: { ...withPriority, stall, skippedObjective: false },
    hangup: false,
    book: null,
  };
}

export function buildQuickChips(tasks, appointments, callState) {
  const chips = [];
  const draft = callState?.draft || {};
  const pri = callState?.priorityId
    ? (tasks || []).find((t) => t.id === callState.priorityId)
    : priorityHealthTask(tasks, appointments);

  if (!draft.dueAt) {
    chips.push({ id: "hi", label: "Hey", text: "Hi Shirley" });
    chips.push({ id: "up", label: "What's up?", text: "what are you up to" });
    chips.push({ id: "nothing", label: "Nothing yet", text: "nothing yet" });
    chips.push({ id: "fine", label: "Ugh okay fine", text: "ugh okay fine" });
    const cat = openBookableTasks(tasks, appointments).find(
      (t) => t.category === "cat" || /stretchy|vet/i.test(t.title || "")
    );
    if (cat && draft.taskId !== cat.id) {
      chips.push({ id: "vet", label: "Stretchy vet", text: "I want to book Stretchy's travel vet" });
    }
  }
  if ((draft.taskId || pri) && !draft.dueAt) {
    chips.push({ id: "d1", label: "Jul 20 11am", text: "July 20 at 11am" });
    chips.push({ id: "d2", label: "Jul 22 2pm", text: "July 22 at 2pm" });
    chips.push({ id: "d3", label: "Jul 25 10am", text: "July 25 at 10am" });
  }
  chips.push({ id: "bye", label: "Gotta go", text: "Gotta go" });
  return chips;
}

export function factsBlock({ tasks, appointments, today, daysLeft }) {
  const open = openBookableTasks(tasks, appointments).map((t) => ({
    id: t.id,
    title: t.title,
    zone: t.zone,
    visit: visitLabel(t),
    urgency: t.urgency || 1,
  }));
  const pri = priorityHealthTask(tasks, appointments);
  if (pri) {
    const rest = open.filter((t) => t.id !== pri.id);
    open.length = 0;
    open.push(
      { id: pri.id, title: pri.title, zone: pri.zone, visit: visitLabel(pri), urgency: pri.urgency || 1 },
      ...rest
    );
  }
  const booked = activeAppointments(appointments).map((a) => ({
    taskId: a.taskId,
    zone: a.zone,
    dueAt: a.dueAt,
    time: a.time,
    status: a.status,
  }));
  return {
    today,
    moveDate: MOVE_DATE_ISO,
    daysLeft,
    priorityVisit: pri ? visitLabel(pri) : null,
    openHealthTasks: open,
    bookedAppointments: booked,
  };
}
