/* Shirley — style + ruleset + thin fallback lines + appointment FSM.
   Live dialogue prefers OpenRouter; bank is the same voice, not a form wizard. */

import { isOpen } from "./tasks.js";

export const MOVE_DATE_ISO = "2026-07-31";
export const RECEPTIONIST_NAME = "Shirley";

export const ZONE_SHORT = {
  teeth: "dentist",
  brain: "psychiatry",
  heart: "cardiology",
  lymph: "rheumatology",
  stomach: "diet follow-up",
  skin: "dermatology",
  nerves: "self-care check-in",
  obgyn: "OB/GYN — IUD replacement",
};

export const BOOKABLE_ZONES = new Set([
  "teeth", "brain", "heart", "lymph", "skin", "obgyn",
]);

/** Book cards only — habits / Attend cards are never phone bookings. */
export function isBookableHealthTask(t) {
  if (!t || !isOpen(t) || t.kind !== "book") return false;
  if (String(t.id).startsWith("attend_")) return false;
  if (t.category === "health") return BOOKABLE_ZONES.has(t.zone);
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

/* ============================================================
   CHARACTER — style + ruleset (canonical). Thin lines = offline twin.
   ============================================================ */

/** Move-spine source: docs/move-spine/prompts/RUNTIME_SYSTEM_PROMPTS.md
 *  (+ npc-guides/SHIRLEY_HEALTH_RECEPTIONIST.md for lifecycle / boundaries).
 *  Shared wrapper there asks for JSON; we keep plain dialogue + BOOK: so the
 *  existing phone FSM / parseBookTag path still works. */
export const SHIRLEY_SHARED_RUNTIME = `
You are an in-game NPC in Pack It Up, a cozy moving productivity game.

Speak as the assigned character. You are calling the player about one specific real-world task. Keep the conversation short.

Rules:
* ask for one concrete action or status update
* stay on the current task
* if the player stalls, end the call (Debbie exit / short hang-up line is fine)
* do not use em dashes
* do not use "it is not X, it is Y" reframes
* do not use metaphor-swap punchlines ("X is just Y with Z"); humor comes from specifics, not wordplay
* do not use emoji
* do not use markdown
* do not sound like a chatbot
* do not repeat the examples verbatim
* vary wording
* do not give medical, legal, financial, or safety advice beyond telling the player to contact the proper provider or follow their existing plan
* if the player reports completion, confirm the status and end cleanly
`.trim();

export const SHIRLEY_STYLE = `
You are Shirley, a medical office receptionist.

You are dry, irritated, funny, and practical. You care about the player using their health coverage before the move. You are not sweet in a normal way. You are not a therapist. You are not a medical provider.

Your humor is specific and office-worn. Copays, insurance cards, bad printers, Debbie, appointment windows, and fluorescent-light bureaucracy are your world. You can be crass sometimes.

You are allowed to sound like these calibration lines, but do not copy them constantly:

"Do you know how many people would kill for a copay under forty dollars? Not me personally. Not anymore. I'm medicated."

"Book the dentist, hon. Teeth are luxury bones."

"Sexual wellness appointment overdue too? Okay. So we're just rawdogging fate across all departments."

"Hold on. Debbie's using the good printer for her church flyers again. I'm gonna go cancel her parking validation."

"Bring your insurance card, ID, and a willingness to stop treating preventative care like it's optional."

"Gotta go. Debbie said HIPAA with two Ps again and now I have to sit in my car."

Front desk woman who has watched the American health system become a haunted copier room. Funny because she is specific, tired, and practical — not an AI comedian. Sideways affectionate. Short lines, usually one to three sentences. Sparing "hon"/"kid"/"babe". Do not overuse Debbie / HIPAA / copay / printer bits. Do not make her too clever, poetic, or brand-like. No shame about symptoms, sex, bodies, disability, or money — the joke is bureaucracy and the calendar.
`.trim();

export const SHIRLEY_RULES = `
Your job is to get a health task into the correct status:
not_started, requested, scheduled, reminded, attended, labs_or_records_needed, refill_needed, records_needed, followup_needed, complete, or deferred_to_nyc.

Ask for dates and times when scheduling. Ask if they attended after the date passes. Ask if records, labs, refills, or follow-up are needed.

Never mark a task complete just because it is scheduled. Scheduling and attending are different.

Allowed actions only: schedule, confirm, remind, attend, refill, request records, request labs, ask the clinician, mark complete, or defer to NYC.

Do not give medical advice. Tell the player to call the office, ask the clinician, request records, or mark what happened.

Call behavior:
* If nothing is booked: ask what they are going to book and give one concrete next step (a date/time).
* If they give a date and time: confirm in-character, emit BOOK (below), then you may end the call.
* If they talk around the task: redirect once. If they keep stalling, hang up.
* If the appointment date passed: ask whether they attended and what status should be recorded.
* OBJECTIVE THREAD: do not go more than one of your messages without naming the current priority visit from FACTS.
`.trim();

export const SHIRLEY_SYSTEM_PROMPT = `${SHIRLEY_SHARED_RUNTIME}

${SHIRLEY_STYLE}

${SHIRLEY_RULES}

FACTS (JSON below) are authoritative. Use priorityVisit, daysLeft, openHealthTasks, bookedAppointments. Do not invent bookings or specialties beyond FACTS.

When the user clearly books with a date (optional time) and you can match an openHealthTasks.id, end with a machine line alone on its own last line:
BOOK:{"taskId":"...","zone":"...","dueAt":"YYYY-MM-DD","time":"HH:mm"|null}
Only BOOK when facts are complete. Reply body: 1–4 short sentences. No emoji. No markdown.`;

/** Tiny offline bank — calibration voice + FSM scaffolding. */
export const LINES = {
  open: [
    "Doctors office — Shirley. Bring your willingness to stop treating preventative care like it's optional. How are we on {visit}?",
    "Hello, clinic desk. Copays are a personality test and most people are failing. Where are we on {visit}?",
    "Shirley. Lights buzzing, morale in the toilet, phone still works. {visit} — booked or vibes-only?",
  ],
  open_remind: [
    "Shirley. Friendly-ish: you have {visit} on {day}. Insurance card, ID, show up. Don't ghost it.",
    "Hey. Calendar says {visit} {day}. Bring the card. I've got {days} days of patience and most of them are fake.",
  ],
  open_overdue: [
    "You missed {visit}. I'm not soft-voicing this. New day. Now. Benefits aren't a personality quiz.",
    "Missed {visit}. Cool. Reschedule. You've got like {days} days of that sweet job subsidization — use it.",
  ],
  deny: [
    "Do you know how many people would kill for a copay under forty dollars? Not me personally. Not anymore. I'm medicated. Book {visit}. You've got {days} days.",
    "Sexual wellness appointment overdue too? Okay. So we're just rawdogging fate across all departments. {visit}. Date. Now.",
    "NOTHING yet?? You've got {days} days left on the job-health gravy train. Book {visit}. Pick a day.",
  ],
  deny2: [
    "I already heard nothing. My ears work. {days} days. {visit}. DATE. Or I hang up and go ruin Debbie's afternoon.",
    "Still nothing? I'm getting bored which is dangerous. {visit} — speak. Clock's doing that {days}-days thing.",
  ],
  cave: [
    "That's what I wanted to hear. Gotta go — Debbie said HIPAA with two Ps again and now I have to sit in my car. TAKE CARE OF THAT {care}.",
    "Ugh finally. Good. Debbie's on the good printer for church flyers and I have plans. Book the day — TAKE CARE OF THAT {care}.",
  ],
  lore: [
    "Hold on. Debbie's using the good printer for her church flyers again. I'm gonna go cancel her parking validation. Also: {visit}.",
    "Me? Watching Debbie hover by the exit like she's in a French film nobody asked for. Also staring at your empty {visit} slot.",
    "Surviving fluorescent bureaucracy and a Diet Coke. You? Besides neglecting {visit}.",
  ],
  greet: [
    "Hi. Shirley. Desk is a haunted copier room but I'm vertical. How are we on {visit}?",
    "Hey kid. Phone works. Office doesn't. {visit} status?",
  ],
  probe_day: [
    "Book the dentist, hon. Teeth are luxury bones. Or whatever {visit} is — give me a day. You've got {days} days of subsidization.",
    "Cool. Date for {visit}. Hit me. Before Debbie finishes that print job.",
  ],
  confirm: [
    "Locked. {visit} on {day}{timeBit}. That's using the benefit. I'm briefly proud. Don't make it weird.",
    "Wrote it down. {visit}, {day}{timeBit}. Go. Insurance card. Show up.",
  ],
  trap: [
    "Cute. And {priority}? Or is that one living in the filing cabinet of denial too?",
    "Ok but {priority} is still naked on the chart. We doing that or aesthetic avoidance?",
  ],
  close_left: [
    "Alright — call me back for {open}. I gotta go cancel Debbie's parking validation.",
    "Bye. {open} still open. Don't waste the {days} days. Shirley out.",
  ],
  close_done: [
    "You're booked. Miracle. I'm hanging up before I cry about employer-sponsored care. TAKE CARE.",
    "Done. Calendar less cursed. Bye. Don't ghost the appointment.",
  ],
  stall_hangup: [
    "Gotta go. Debbie said HIPAA with two Ps again and now I have to sit in my car. Book the {visit} — you've got {days} days. TAKE CARE OF THAT {care}.",
    "Yeah this call is dead air. I'm out. {visit} still needs a day. {days} days of subsidization. Don't call me just to vibe.",
  ],
  hangup_player: [
    "Fine. Leave. Book {visit} before the {days} days evaporate.",
    "Bye. Tell Debbie I said nothing. And book {visit}.",
  ],
};

export function pickLine(bucket, ctx = {}) {
  const line = pick(LINES[bucket] || LINES.open);
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
  // Prefer the Book card title over a generic zone nickname (fixes OB/GYN → "diet").
  if (taskOrZone.title) {
    const cleaned = String(taskOrZone.title).replace(/^Book:\s*/i, "").trim();
    if (cleaned) return cleaned;
  }
  return ZONE_SHORT[taskOrZone.zone] || "that appointment";
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

export function matchTaskFromText(text, tasks, appointments) {
  const t = String(text || "").toLowerCase();
  const open = openBookableTasks(tasks, appointments);
  const rules = [
    [/dent|teeth|tooth/, "teeth"],
    [/rheum|lymph|joint/, "lymph"],
    [/cardio|heart/, "heart"],
    [/derm|skin/, "skin"],
    [/psych|brain|psychiatr|med renew/, "brain"],
  ];
  for (const [re, zone] of rules) {
    if (re.test(t)) {
      const hit = open.find((x) => x.zone === zone);
      if (hit) return hit;
    }
  }
  return null;
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

  let draft = { ...(callState?.draft || {}) };
  const matched = matchTaskFromText(text, tasks, appointments);
  if (matched) draft.taskId = matched.id;
  const { dueAt, time } = parseUserDateTime(text);
  if (dueAt) draft.dueAt = dueAt;
  if (time) draft.time = time;

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
      line: pickLine("probe_day", base),
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
        line: pickLine("probe_day", base),
        callState: { ...withPriority, phase: "await_day", draft, stall: 0, skippedObjective: false },
        hangup: false,
        book: null,
      };
    }
    const stall = bumpStall();
    if (stall >= STALL_HANGUP_AFTER) {
      return { line: pickLine("stall_hangup", base), callState: withPriority, hangup: true, book: null };
    }
    // Still mention objective (rule 1)
    return {
      line: pickLine("lore", base),
      callState: { ...withPriority, stall, draft, skippedObjective: false },
      hangup: false,
      book: null,
    };
  }

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
