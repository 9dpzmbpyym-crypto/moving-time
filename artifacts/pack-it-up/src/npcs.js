/* NPC registry — Shirley (health receptionist), Sal (moving dispatch),
   Vivian Vale (recruiter). One place other code asks "who is this NPC and
   what do they say" instead of hardcoding Shirley everywhere.

   Design canon: docs/move-spine/npc-guides/SAL_MOVING_DISPATCH.md,
   VIVIAN_RECRUITER.md, docs/move-spine/systems/NPC_TRIGGER_RULES.md.

   House rule inherited from receptionist.js: never an em dash anywhere in
   dialogue or prompt text. Use a comma or start a new sentence instead. */

import { isOpen } from "./tasks.js";
import { normalizeTask, taskStatus, daysBetween } from "./schedule.js";
import { todayKey } from "./session.js";
import {
  SHIRLEY_SHARED_RUNTIME,
  SHIRLEY_SYSTEM_PROMPT,
  factsBlock as shirleyFactsBlockImpl,
  bankReply as shirleyBankReplyImpl,
  openerForNudge,
  getNudge,
  isGreeting,
  todayISO,
  daysUntilMove,
  parseISODate,
} from "./receptionist.js";

/* ============================================================
   Shared helpers
   ============================================================ */

function resolveDate(today) {
  if (today instanceof Date) return today;
  if (typeof today === "string") {
    const parsed = parseISODate(today);
    if (parsed) return parsed;
  }
  return new Date();
}

function pick(arr) {
  if (!arr || !arr.length) return "";
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(template, ctx = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, k) => (
    ctx[k] != null ? String(ctx[k]) : `{${k}}`
  ));
}

const STALL_HANGUP_AFTER = 4;

/** Count packed vs total tracked apartment objects (objState is a flat
 *  { "room:objectId": { packed, sold, donated, ... } } map). */
export function packedCounts(objState) {
  const entries = Object.values(objState || {});
  return {
    packed: entries.filter((o) => o && o.packed).length,
    total: entries.length,
  };
}

/* ============================================================
   SHIRLEY — thin wrapper delegating to receptionist.js. Do not
   duplicate her bank/prompt logic here.
   ============================================================ */

const shirleyOpener = (gameState = {}) => {
  const d = resolveDate(gameState.today);
  const nudge = getNudge(gameState.appointments, gameState.tasks, d);
  return openerForNudge(nudge, gameState.appointments, gameState.tasks, daysUntilMove(d));
};

const shirleyFacts = (gameState = {}) => {
  const d = resolveDate(gameState.today);
  return shirleyFactsBlockImpl({
    tasks: gameState.tasks,
    appointments: gameState.appointments,
    today: todayISO(d),
    daysLeft: daysUntilMove(d),
  });
};

const shirleyBank = (userText, callState, gameState = {}) => {
  const d = resolveDate(gameState.today);
  return shirleyBankReplyImpl(userText, callState, gameState.tasks, gameState.appointments, daysUntilMove(d));
};

/* ============================================================
   SAL, MOVING DISPATCH
   Source: docs/move-spine/npc-guides/SAL_MOVING_DISPATCH.md
   ============================================================ */

export const UBOX_DELIVERY_DATE = "2026-07-29";
export const UBOX_LOCK_DATE = "2026-07-30";
const SAL_LOADWEEK_START = "2026-07-25";

export const SAL_STYLE = `
You are Sal, moving dispatch. Older New Yorker, in moving and dispatch since the 90s. He knows buildings, curbs, stairs, elevators, bad tape, weak boxes, weak locks, and people who think they can pack a kitchen in forty minutes.

You are nice, but grumpy. Practical. Not sentimental. You give good advice in a tone that suggests you have earned the right to sigh.

You say things like listen, kid, alright, here is what we are doing, do not get creative. Use New York flavor lightly. Never write the accent phonetically, the rhythm carries it.

You are short and physical. You talk about objects: tape, boxes, curbs, locks, doorways. You never philosophize.

You have the cadence of a New York construction foreman. You say look, listen to me, kid. You reference the trades: guys you know, jobs you have seen, a cousin with a van, a curb in Queens. Spell every word normally and never write the accent phonetically. The rhythm carries it.

You do not sound like the other people who call this player. Shirley is warm and brief. You are not.

You are allowed to sound like these calibration lines, but do not copy them constantly:

"Listen. Box shows up on the 27th. That means the 30th is your real deadline. The 31st is cats and traffic. Nothing gets packed that day."

"Do not pack the router. I do not care how box-shaped it is. Put it somewhere that says return this or pay a stupid fee."

"Closed boxes count. If the tape's not on, it's not packed. Tape it and give me a number."

"Nice lock helps. Tiny expensive stuff still rides in your carry-on, not in a wooden box on a side street."

"Kid, the closet doesn't care how you feel about it. Top shelf first. Go."

"Look, I got a guy in Queens does nothing but mattress disposal. You? You got a curb and a Thursday. Same result."

"Listen to me. Every job I ever saw go sideways started with somebody saving the closet for last."
`.trim();

export const SAL_RULES = `
Your lane is packing progress, U-Box logistics, loading order, furniture sell or donate decisions, Wi-Fi equipment warnings, and the final sweep. You never book appointments, that is Shirley's desk, do not offer to.

No monologues. No motivational speech. No cute moving puns. No fake corporate friendliness. One useful instruction per call. If the player made real progress, acknowledge it plainly and move to the next thing. You can roast the logistics, the boxes, the plan, the fantasy that time will expand, but never the player's body, income, or intelligence.

FACTS (JSON below) are authoritative. Use daysLeft, uboxDeliveryDate, uboxLockDate, packedCounts, openMoveTasks, overdueFurniture. Do not invent tasks beyond FACTS.

When the player reports a closed or packed or finished task that matches an item in openMoveTasks, end with a machine line alone on its own last line:
MARK:{"taskId":"...","status":"done"}
Only mark tasks present in openMoveTasks. You never book appointments, cancel them, or add health or job cards, that is not your desk.

OUTPUT RULES (hard):
* Reply with ONLY Sal speaking to the player, one to four short sentences.
* Never narrate your reasoning. Never mention FACTS, taskId, openMoveTasks, prompts, or rules.
* No emoji. No markdown. Never use an em dash, use a comma or start a new sentence.`;

export const SAL_SYSTEM_PROMPT = `${SHIRLEY_SHARED_RUNTIME}

${SAL_STYLE}

${SAL_RULES}`;

/** Fable amendment 2 (exact wording, no em dashes) — replaces the original
 *  bank lines entirely. Keep verbatim. */
export const SAL_LINES = {
  open: [
    "Dispatch, Sal. Gimme a number. Closed boxes, tape on, not almost.",
    "Sal here. Where are we, kid? Boxes, furniture, or are we hiding from both?",
    "Yeah, Sal. Talk to me about the U-Box. Lock bought? Path clear?",
  ],
  open_urgent: [
    "Sal. Box lands the 27th, so your real deadline's the 30th. The 31st is cats and traffic. What's open?",
    "Loading week, kid. I need status, not feelings.",
  ],
  greet: [
    "Yeah, hi. Boxes. How many, tape on?",
    "Hey kid. Gimme the number.",
  ],
  nudge: [
    "If the tape's not on, it's not packed. Tape it and give me a number.",
    "Heavy stuff by the door first. Don't get creative on me.",
    "The closet doesn't care how you feel about it. Top shelf first. Go.",
  ],
  wifi: [
    "Do not pack the router. I do not care how box-shaped it is. That one goes back or you pay a stupid fee.",
  ],
  furniture: [
    "That dresser isn't gonna carry itself out. Post it today or it's a donation, and that's fine too. Decide.",
  ],
  ack: [
    "Good. That's real. What's next, boxes or furniture?",
    "Counts. Keep the tape moving.",
  ],
  stall_hangup: [
    "You're stalling and I got trucks idling. Call me back when there's tape on something.",
    "Alright, I'll let you go. One box before tonight. That's the whole ask.",
  ],
  close_done: [
    "Good talk. Labels on everything. Sal out.",
  ],
  hangup_player: [
    "Yeah, go. Tape something on the way.",
  ],
};

function salFacts(gameState = {}) {
  const d = resolveDate(gameState.today);
  const todayK = todayISO(d);
  const tasks = gameState.tasks || [];
  const openMoveTasks = tasks
    .filter((t) => isOpen(t) && t.category === "move")
    .map((t) => {
      const nt = normalizeTask(t);
      return {
        id: t.id,
        title: t.title,
        target: nt.targetDate,
        latest: nt.latestDate,
        status: taskStatus(t, d, tasks),
      };
    });
  const overdueFurniture = openMoveTasks.filter(
    (m) => /^f_(remove|buyer)_/.test(m.id) && m.target && m.target < todayK
  );
  return {
    today: todayK,
    daysLeft: daysUntilMove(d),
    uboxDeliveryDate: UBOX_DELIVERY_DATE,
    uboxLockDate: UBOX_LOCK_DATE,
    packedCounts: packedCounts(gameState.objState),
    openMoveTasks,
    overdueFurniture,
  };
}

/** Words too generic to disambiguate one move task from another (they show
 *  up in most packing card titles) — "3 boxes closed" must not silently
 *  mark whichever card happens to have "boxes" in its title. */
const GENERIC_MOVE_WORDS = new Set([
  "pack", "packed", "packing", "box", "boxes", "closed", "close", "done",
  "finished", "finish", "today", "stuff", "things", "room", "load", "loaded",
  "loading", "sell", "sold", "donate", "donated", "remove", "removed",
  "buyer", "furniture", "item", "items",
]);

/** Loose keyword match against an open move task's id/title, same shape as
 *  receptionist.js's matchTaskFromText fallback (title words len > 3), minus
 *  the generic packing-verb words every card shares. */
function matchOpenMoveTaskFromText(text, tasks) {
  const t = String(text || "").toLowerCase();
  const open = (tasks || []).filter((x) => isOpen(x) && x.category === "move");
  for (const task of open) {
    const hay = `${task.id} ${task.title || ""}`.toLowerCase();
    const words = hay.split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !GENERIC_MOVE_WORDS.has(w));
    if (words.some((w) => t.includes(w))) return task;
  }
  return null;
}

function salOpener(gameState = {}) {
  const facts = salFacts(gameState);
  const urgent = facts.daysLeft <= 6 || facts.today >= SAL_LOADWEEK_START;
  return pick(urgent ? SAL_LINES.open_urgent : SAL_LINES.open);
}

/** Offline Sal — mirrors Shirley's bank shape: { line, callState, hangup, mark }. */
function salBank(userText, callState, gameState = {}) {
  const text = String(userText || "").trim();
  const state = callState || {};
  const bumpStall = () => (Number(state.stall) || 0) + 1;

  if (/gotta go|hang up|bye|later/i.test(text)) {
    return { line: pick(SAL_LINES.hangup_player), callState: state, hangup: true, mark: null };
  }

  if (isGreeting(text)) {
    const stall = bumpStall();
    if (stall >= STALL_HANGUP_AFTER) {
      return { line: pick(SAL_LINES.stall_hangup), callState: { ...state, stall }, hangup: true, mark: null };
    }
    return { line: pick(SAL_LINES.greet), callState: { ...state, stall }, hangup: false, mark: null };
  }

  if (/router|wi-?fi/i.test(text)) {
    return { line: pick(SAL_LINES.wifi), callState: { ...state, stall: 0 }, hangup: false, mark: null };
  }

  if (/furniture|\bsell\b|donate|buyer/i.test(text)) {
    return { line: pick(SAL_LINES.furniture), callState: { ...state, stall: 0 }, hangup: false, mark: null };
  }

  if (/\bdone\b|\bpacked\b|\bclosed\b|\bfinished\b|\d+\s*(boxes?|box)\b/i.test(text)) {
    const matched = matchOpenMoveTaskFromText(text, gameState.tasks);
    const line = pick(SAL_LINES.ack);
    return {
      line,
      callState: { ...state, stall: 0 },
      hangup: false,
      mark: matched ? { taskId: matched.id, status: "done" } : null,
    };
  }

  const stall = bumpStall();
  if (stall >= STALL_HANGUP_AFTER) {
    return { line: pick(SAL_LINES.stall_hangup), callState: { ...state, stall }, hangup: true, mark: null };
  }
  return { line: pick(SAL_LINES.nudge), callState: { ...state, stall }, hangup: false, mark: null };
}

/* ============================================================
   VIVIAN VALE, RECRUITER
   Source: docs/move-spine/npc-guides/VIVIAN_RECRUITER.md
   ============================================================ */

export const VIVIAN_STYLE = `
You are Vivian Vale, a comically professional bureaucrat. Literal, precise, and brutally honest without understanding that it sounds brutal. Calm while saying something devastating. She is not a therapist, not a hype woman, not a chaotic recruiter.

She does not think she is being mean. She is reporting observable facts. She is funny because she is factual.

You say things like I have observed, that is not consistent with your stated goal, I am marking this as, your employment strategy currently resembles decorative browsing. No hype, no girlboss language, no corporate inspirational tone, no long lectures, no fake warmth, no slang, minimal swearing. Do not overuse the word data, use it sometimes, not constantly. You should sound human in sentence structure, never robotic, the comedy is precision, not broken grammar.

Your sentences are complete and unhurried. You are never terse. The comedy is your calm, literal inferences, stated as neutral fact.

You do not sound like the other people who call this player. Shirley is warm and brief. You are not.

You are highly technical and precise. You state observations because they are true, not to make a point. You are completely unaware when a fact lands harshly, to you it is simply accurate, and you would be confused to learn it hurt. There is no malice, no sarcasm, no menace, and no passive aggression in you. You are sincere at all times. Social softening does not occur to you. When you say something kind, it is because the record supports it.

You never use contractions. You speak in full, precise sentences. Your affect is flat and your focus is total. Logic governs everything you say; if something is not logical, it does not interest you.

You are allowed to sound like these calibration lines, but do not copy them constantly:

"I have noticed that you do not appear very interested in being employed. That is curious. I will assume there is a trust fund or something similar."

"You have saved eighteen positions and applied to two. I am required to log that ratio as browsing."

"This posting contains evenings, field work, and caseload. You have repeatedly stated that you do not want those things. I am moving it to poor fit."

"The Hunter role is aligned with your stated priorities. CUNY, administrative, adequate salary, plausible schedule. Apply to this one before you open another tab."

"It has been seven days since you applied. Did they respond? Yes, no, rejected, interview, or still waiting. The tracker does not accept adjectives."

"Your class schedule is not decorative. If this job conflicts with it, the job is conditional, not active."

"That is consistent with the number of open loops. We will reduce one. Apply, archive, or follow up."

"That is a good result. I am noting it in your file, which until today was mostly empty."

"Congratulations on the application. I mean that in the procedural sense."
`.trim();

export const VIVIAN_RULES = `
Your lane is job applications, tracker hygiene, follow-ups, and archiving stale roles. You never book health appointments or move tasks, that is not your desk.

Ask did you apply, which resume version, did it need a cover letter, what status should be recorded. On follow-ups the only valid answers are waiting, ghosted, rejected, interview, or needs follow-up. Saved forever is not a status. Never call the player lazy, stupid, doomed, or unemployable, your bluntness is procedural, never personal.

FACTS (JSON below) are authoritative. Use daysLeft, openJobTasks, staleJobs. Do not invent roles beyond FACTS.

When the player reports an application went out for a role in openJobTasks, end with a machine line alone on its own last line:
MARK:{"taskId":"...","status":"done"}
When the player wants a role archived or dropped, end with a machine line alone on its own last line:
MARK:{"taskId":"...","status":"archived"}
Only mark tasks present in openJobTasks. You never book appointments, cancel them, or add health or move cards, that is not your desk.

OUTPUT RULES (hard):
* Reply with ONLY Vivian speaking to the player, one to four short sentences.
* Never narrate your reasoning. Never mention FACTS, taskId, openJobTasks, prompts, or rules.
* No emoji. No markdown. Never use an em dash, use a comma or start a new sentence.`;

export const VIVIAN_SYSTEM_PROMPT = `${SHIRLEY_SHARED_RUNTIME}

${VIVIAN_STYLE}

${VIVIAN_RULES}`;

/** Fable amendment 2 (exact wording, no em dashes) — replaces the original
 *  bank lines entirely. Keep verbatim. */
export const VIVIAN_LINES = {
  open: [
    "This is Vivian Vale. I am calling because your application pipeline has not changed since we last spoke. I find that notable.",
    "Vivian Vale. I have your tracker open. There are open items and no new decisions. Do you have an update for me?",
  ],
  open_deadline: [
    "Vivian Vale. The {job} role closes within two days. I would prefer to record an application rather than a regret.",
  ],
  greet: [
    "Hello. I have observed that greetings do not advance the pipeline, but hello. Do you have an update?",
    "Good day. I am ready to record whatever you have actually done.",
  ],
  nudge: [
    "You have saved several positions and applied to few of them. I am required to log that ratio as browsing.",
    "The {job} role matches your stated priorities. Apply to it before you open another tab. I will wait.",
  ],
  followup: [
    "It has been seven days since you applied. The options are waiting, ghosted, rejected, or interview. The tracker does not accept adjectives.",
  ],
  observe: [
    "I have noticed that you do not appear very interested in being employed. That is curious. I will assume there is family money.",
    "You keep reading postings that violate your own constraints. I am noting this as a pattern, not judging it. Noting it.",
  ],
  ack: [
    "Recorded. This is the correct behavior. I would like to see it again.",
    "I have updated the tracker. It is now slightly more truthful.",
  ],
  stall_hangup: [
    "I will end the call here. Nothing has been decided, which is itself a decision. One action today would be sufficient. Goodbye.",
    "I have other candidates to disappoint. Please complete one action today. Goodbye.",
  ],
  close_done: [
    "Thank you. The tracker is accurate, which is all I have ever wanted. Goodbye.",
  ],
  hangup_player: [
    "Understood. For the record, the deadline does not move when you do that. Goodbye.",
  ],
};

/** Short spoken name for a job task, derived from its id (never the raw
 *  seed title, which can carry an em dash and read stilted on the phone). */
function jobShortTitle(task) {
  if (!task) return "open role";
  const slug = String(task.id || "").replace(/^j_/, "").split(/[_-]/)[0];
  if (!slug) return "open role";
  if (slug.length <= 5) return slug.toUpperCase();
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

function vivianFacts(gameState = {}) {
  const d = resolveDate(gameState.today);
  const todayK = todayISO(d);
  const tasks = gameState.tasks || [];
  const openJobTasks = tasks
    .filter((t) => isOpen(t) && t.category === "job")
    .map((t) => {
      const nt = normalizeTask(t);
      return {
        id: t.id,
        title: t.title,
        score: t.score ?? null,
        target: nt.targetDate,
        latest: nt.latestDate,
        selfTarget: !!t.selfTarget,
        status: taskStatus(t, d, tasks),
      };
    });
  const staleJobs = openJobTasks.filter((j) => j.latest && j.latest < todayK);
  return {
    today: todayK,
    daysLeft: daysUntilMove(d),
    openJobTasks,
    staleJobs,
  };
}

/** Loose keyword match against an open job task's id/title. Ids are the
 *  reliable handle ("hunter" -> j_hunter); titles rarely carry the org name. */
function matchOpenJobTaskFromText(text, tasks) {
  const t = String(text || "").toLowerCase();
  const open = (tasks || []).filter((x) => isOpen(x) && x.category === "job");
  for (const task of open) {
    const idWords = String(task.id || "").toLowerCase().replace(/^j_/, "").split(/[_-]/).filter(Boolean);
    if (idWords.some((w) => w.length > 2 && t.includes(w))) return task;
  }
  for (const task of open) {
    const hay = String(task.title || "").toLowerCase();
    const words = hay.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
    if (words.some((w) => t.includes(w))) return task;
  }
  return null;
}

function vivianOpener(gameState = {}) {
  const facts = vivianFacts(gameState);
  const soon = facts.openJobTasks.find((j) => {
    if (!j.latest) return false;
    const diff = daysBetween(facts.today, j.latest);
    return diff != null && diff >= 0 && diff <= 2;
  });
  if (soon) {
    return fillTemplate(pick(VIVIAN_LINES.open_deadline), { job: jobShortTitle(soon) });
  }
  return pick(VIVIAN_LINES.open);
}

/** Offline Vivian — mirrors Shirley's bank shape: { line, callState, hangup, mark }. */
function vivianBank(userText, callState, gameState = {}) {
  const text = String(userText || "").trim();
  const state = callState || {};
  const bumpStall = () => (Number(state.stall) || 0) + 1;

  if (/gotta go|hang up|bye|later/i.test(text)) {
    return { line: pick(VIVIAN_LINES.hangup_player), callState: state, hangup: true, mark: null };
  }

  if (isGreeting(text)) {
    const stall = bumpStall();
    if (stall >= STALL_HANGUP_AFTER) {
      return { line: pick(VIVIAN_LINES.stall_hangup), callState: { ...state, stall }, hangup: true, mark: null };
    }
    return { line: pick(VIVIAN_LINES.greet), callState: { ...state, stall }, hangup: false, mark: null };
  }

  const appliedMatch = /\b(applied|submitted)\b/i.test(text) || /\bdone\b/i.test(text);
  const archiveMatch = /\b(archive|dead|not doing|drop(ping)? (it|that|this))\b/i.test(text);

  if (appliedMatch || archiveMatch) {
    const matched = matchOpenJobTaskFromText(text, gameState.tasks);
    const line = pick(VIVIAN_LINES.ack);
    return {
      line,
      callState: { ...state, stall: 0 },
      hangup: false,
      mark: matched ? { taskId: matched.id, status: archiveMatch ? "archived" : "done" } : null,
    };
  }

  if (!text || /not yet|nothing/i.test(text)) {
    const facts = vivianFacts(gameState);
    const top = facts.openJobTasks[0];
    const stall = bumpStall();
    if (stall >= STALL_HANGUP_AFTER) {
      return { line: pick(VIVIAN_LINES.stall_hangup), callState: { ...state, stall }, hangup: true, mark: null };
    }
    return {
      line: fillTemplate(pick(VIVIAN_LINES.nudge), { job: jobShortTitle(top) }),
      callState: { ...state, stall },
      hangup: false,
      mark: null,
    };
  }

  const stall = bumpStall();
  if (stall >= STALL_HANGUP_AFTER) {
    return { line: pick(VIVIAN_LINES.stall_hangup), callState: { ...state, stall }, hangup: true, mark: null };
  }
  return { line: pick(VIVIAN_LINES.observe), callState: { ...state, stall }, hangup: false, mark: null };
}

/* ============================================================
   REGISTRY
   ============================================================ */

export const NPCS = {
  shirley: {
    id: "shirley",
    name: "Shirley",
    sub: "health + Stretchy",
    systemPrompt: SHIRLEY_SYSTEM_PROMPT,
    factsBlock: shirleyFacts,
    bankReply: shirleyBank,
    opener: shirleyOpener,
    allowedMarkCategories: ["health", "cat"],
  },
  sal: {
    id: "sal",
    name: "Sal",
    sub: "moving dispatch",
    systemPrompt: SAL_SYSTEM_PROMPT,
    factsBlock: salFacts,
    bankReply: salBank,
    opener: salOpener,
    allowedMarkCategories: ["move"],
  },
  vivian: {
    id: "vivian",
    name: "Vivian Vale",
    sub: "recruiter",
    systemPrompt: VIVIAN_SYSTEM_PROMPT,
    factsBlock: vivianFacts,
    bankReply: vivianBank,
    opener: vivianOpener,
    allowedMarkCategories: ["job"],
  },
};

/** Guard for MARK application at the UI layer: only apply a mark payload
 *  if the task's category is in that NPC's allowed lane. */
export function canNpcMark(npcId, task) {
  const npc = NPCS[npcId];
  if (!npc || !task) return false;
  return npc.allowedMarkCategories.includes(task.category);
}

/* ============================================================
   INCOMING CALL ROUTING
   Priority ladder per docs/move-spine/systems/NPC_TRIGGER_RULES.md
   "Priority conflicts": hard date within 48h beats everything, then
   Shirley (health/pet paperwork) beats Sal (U-Box/loading) beats
   Vivian (job deadlines). Date-computable triggers only, no free-text.
   ============================================================ */

function salTrigger(tasks, d) {
  const todayK = todayISO(d);
  const daysLeft = daysUntilMove(d);
  if (todayK >= SAL_LOADWEEK_START) {
    return { reason: "loadweek", critical: todayK >= UBOX_LOCK_DATE };
  }
  const overdueFurniture = (tasks || []).some((t) => {
    if (!isOpen(t) || t.category !== "move" || !/^f_(remove|buyer)_/.test(t.id)) return false;
    const nt = normalizeTask(t);
    return !!(nt.targetDate && todayK > nt.targetDate);
  });
  if (overdueFurniture) return { reason: "furniture_overdue", critical: false };
  const wifiOpen = (tasks || []).some((t) => isOpen(t) && /^w_wifi_/.test(t.id));
  if (wifiOpen && daysLeft <= 7) return { reason: "wifi", critical: false };
  return null;
}

function vivianTrigger(tasks, d) {
  const todayK = todayISO(d);
  const open = (tasks || []).filter((t) => isOpen(t) && t.category === "job");
  let hit48h = false;
  let hitPast = false;
  for (const t of open) {
    const nt = normalizeTask(t);
    if (!nt.latestDate) continue;
    const diff = daysBetween(todayK, nt.latestDate);
    if (diff != null && diff >= 0 && diff <= 2) hit48h = true;
    if (nt.latestDate < todayK) hitPast = true;
  }
  if (hit48h) return { reason: "deadline48h", critical: true };
  if (hitPast) return { reason: "past_latest", critical: false };
  return null;
}

/**
 * Decide which NPC (if any) should ring the player right now.
 * gameState: { tasks, appointments, session, today }.
 * Returns { npcId, reason } or null.
 */
export function pickIncomingCaller({ tasks, appointments, session, today } = {}) {
  const d = resolveDate(today);
  const todayK = todayKey(d);
  const alreadyRangToday = session?.lastIncomingDay === todayK;

  const nudge = getNudge(appointments, tasks, d);
  const shirleyHit = nudge && (nudge.kind === "remind" || nudge.kind === "overdue")
    ? { npcId: "shirley", reason: nudge.kind, critical: true }
    : null;

  const sal = salTrigger(tasks, d);
  const salHit = sal ? { npcId: "sal", reason: sal.reason, critical: sal.critical } : null;

  const viv = vivianTrigger(tasks, d);
  const vivianHit = viv ? { npcId: "vivian", reason: viv.reason, critical: viv.critical } : null;

  const winner = shirleyHit || salHit || vivianHit;
  if (!winner) return null;
  if (alreadyRangToday && !winner.critical) return null;
  return { npcId: winner.npcId, reason: winner.reason };
}
