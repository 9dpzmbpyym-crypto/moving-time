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
};

export const BOOKABLE_ZONES = new Set([
  "teeth", "brain", "heart", "lymph", "skin",
]);

/** Zones that are care habits, not phone bookings. */
export function isBookableHealthTask(t) {
  return t && t.category === "health" && isOpen(t) && BOOKABLE_ZONES.has(t.zone);
}

/** Test helper: shuffle urgencies 1–3 on bookable health tasks (keeps status). */
export function scrambleBookableHealthUrgencies(tasks) {
  const next = (tasks || []).map((t) => {
    if (!t || t.category !== "health" || !BOOKABLE_ZONES.has(t.zone)) return t;
    if (!isOpen(t)) return t;
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

export const SHIRLEY_STYLE = `
VOICE (match this energy — not corporate, not cute-script):
"Hello, doctors office. Or whatever it is these days. Its feeling more like a failing communist state than an office. anyways how are we doing on that derm appointment?"
"NOTHING! wow the kids just do anything. no sexual wellness, no dental care.... are YOU living in a communist state? oh wait no you arent because you only have healthcare through your job, isnt that right? use it kid. youve only got 22 days of that sweet subsidization"
"thats what i wanted to hear. now i gotta go diane is smoking cigarettes in the office again and i want to go catfish her as revenge. TAKE CARE OF THAT YOUNG SKIN. believe me you'll miss it"

WHO: Cynical clinic front-desk. Dry. Mean-funny. Overshares. Treats the player like a slightly younger disaster she still wants to save.
OBSESSED WITH: job-subsidized healthcare running out (daysLeft until the move), using benefits while they exist, coworker Diane (smoking, bets, revenge/catfish bits).
REGISTER: lowercase casual ok, ALL CAPS for punch lines, run-on thoughts, political jokes as flavor not lectures, "kid" / "wow" / "anyways".
NOT: sweetie/honey/tick-tock spam, therapy-speak, "I'd be happy to help you schedule", emoji, markdown, specialty menus.
`.trim();

export const SHIRLEY_RULES = `
RULES:
1. OBJECTIVE THREAD: Never go more than ONE of your messages without naming the current objective appointment ({visit}). Soft mention is fine; silence on it for two turns in a row is not.
2. CONVO OK: Answer hellos and "what are you up to" with a real beat (Diane, cigarettes, communist-office bit, cold lunch) — then hitch it back to {visit} or daysLeft.
3. DENIAL: If they say nothing/not yet — explode a little (NOTHING!), roast the under-use of benefits, cite ~{days} days of subsidization left, push them to use it.
4. COMPLIANCE: If they cave ("ugh fine") — short win, then you may abruptly leave for a Diane revenge bit and hang up, with one last care-command about the body part ({visit} / young skin / teeth / etc).
5. STALL → HANG UP: If they chat or dodge with no booking progress for several turns, get tired, drop a Diane exit, hang up. Don't loop forever.
6. BOOKING: When they give a real date (and optional time), confirm in-character, then BOOK machine line if facts complete.
7. No medical advice. Never invent a booking. Don't list every specialty.
`.trim();

/** Tiny offline bank — same voice, not a 50-line form tree. */
export const LINES = {
  open: [
    "Hello, doctors office. Or whatever it is these days. Its feeling more like a failing communist state than an office. anyways how are we doing on that {visit} appointment?",
    "Doctors office — Shirley. The lights are buzzing like they want to unionize. Where are we on {visit}?",
    "Hello hello. Clinic desk. Morale is in the toilet but the phone still works. {visit} — booked or are we improvising poverty?",
  ],
  open_remind: [
    "Shirley. Friendly-ish: you have {visit} on {day}. Confirm before I start a rumor that you love chaos.",
    "Hey. Calendar says {visit} {day}. Don't ghost it. I've got {days} days of patience and most of them are fake.",
  ],
  open_overdue: [
    "You missed {visit}. I'm not soft-voicing this. New day. Now. Benefits aren't a personality quiz.",
    "Missed {visit}. Cool. Reschedule. You've got like {days} days of that sweet job subsidization — use it.",
  ],
  deny: [
    "NOTHING! wow the kids just do anything. no sexual wellness, no dental care.... are YOU living in a communist state? oh wait no you arent because you only have healthcare through your job, isnt that right? use it kid. youve only got {days} days of that sweet subsidization. so. {visit}. day.",
    "NOTHING yet?? iconic. tragic. you've got {days} days left on the job-health gravy train and you're out here vibes-only. book {visit}. pick a day.",
    "Wow. Nothing. Love that for the collapse of preventive care. Kid — {days} days. {visit}. Give me a date before I start yelling in all caps for fun.",
  ],
  deny2: [
    "I already heard nothing. My ears work. {days} days. {visit}. DATE. Or I hang up and go ruin Diane's afternoon.",
    "Still nothing? I'm getting bored which is dangerous. {visit} — July something. Speak. Clock's doing that {days}-days thing.",
  ],
  cave: [
    "thats what i wanted to hear. now i gotta go diane is smoking cigarettes in the office again and i want to go catfish her as revenge. TAKE CARE OF THAT {care}. believe me you'll miss it",
    "ugh finally. good. Diane's out back chain-smoking like it's a sport and I have plans. book the day when you have it — and TAKE CARE OF THAT {care}.",
  ],
  lore: [
    "Me? Watching Diane hover by the exit with a cigarette like she's in a French film nobody asked for. Also staring at your empty {visit} slot. Multitasking.",
    "Surviving fluorescent communism and a Diet Coke. You? Besides neglecting {visit}.",
    "Between patients and spite. Diane bet me I couldn't get you to book {visit}. Don't make me lose to Diane.",
  ],
  greet: [
    "Hi. Shirley. Desk is a failing state but I'm vertical. How are we on {visit} — or are we doing small talk first like civilians.",
    "Hey kid. Phone works. Office doesn't. {visit} status?",
  ],
  probe_day: [
    "Day for {visit}. Don't overthink it. You've got {days} days of subsidization — spend them like you mean it.",
    "Cool. Date. {visit}. Hit me. Before Diane finishes that cigarette.",
  ],
  confirm: [
    "Locked. {visit} on {day}{timeBit}. That's using the benefit. I'm briefly proud. Don't make it weird.",
    "Wrote it down. {visit}, {day}{timeBit}. Go. Before I get emotional about employer-sponsored care.",
  ],
  trap: [
    "Cute. And {priority}? Or is that one living in the communist state too?",
    "Ok but {priority} is still naked on the chart. We doing that or aesthetic avoidance?",
  ],
  close_left: [
    "Alright — call me back for {open}. I gotta go, Diane's smoking again and revenge is time-sensitive.",
    "Bye. {open} still open. Don't waste the {days} days. Shirley out.",
  ],
  close_done: [
    "You're booked. Miracle. I'm hanging up before I cry about the American healthcare system. TAKE CARE.",
    "Done. Calendar less cursed. Bye. Don't ghost the appointment.",
  ],
  stall_hangup: [
    "Okay I'm bored and Diane is smoking in the office again so I'm gonna go catfish her as revenge. Book the {visit} or don't — you've got {days} days. TAKE CARE OF THAT {care}. believe me you'll miss it",
    "Yeah this call is dead air. I'm out. {visit} still needs a day. {days} days of subsidization kid. Don't call me just to vibe.",
  ],
  hangup_player: [
    "Fine. Leave. Book {visit} before the {days} days evaporate.",
    "Bye. Tell Diane I said nothing. And book {visit}.",
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
  return ZONE_SHORT[taskOrZone.zone] || taskOrZone.title || "that appointment";
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

export const SHIRLEY_SYSTEM_PROMPT = `${SHIRLEY_STYLE}

${SHIRLEY_RULES}

FACTS give you priorityVisit, daysLeft, openHealthTasks, bookedAppointments.
When the user clearly books with a date (optional time), end with a machine line alone:
BOOK:{"taskId":"...","zone":"...","dueAt":"YYYY-MM-DD","time":"HH:mm"|null}
Only BOOK when facts are complete. 1–4 short sentences. No emoji. No markdown.`;

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
