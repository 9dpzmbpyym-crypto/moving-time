/* Daily card-deal + schedule status. Ledger = deck; Board = today's hand.
   Structure first — thin backward Fumes floor; full data seed comes later. */

import { dateKey, daysUntil, dayNumber, MOVE_DATE } from "./movePhase.js";
import { isOpen } from "./tasks.js";
import { ENERGY_BUDGET, todayKey } from "./session.js";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function daysBetween(a, b) {
  const A = dayNumber(a);
  const B = dayNumber(b);
  if (A == null || B == null) return null;
  return B - A;
}

export function addDaysISO(iso, n) {
  const key = dateKey(iso);
  if (!key || !ISO.test(key)) return null;
  const [y, m, d] = key.split("-").map(Number);
  // Local calendar math — must match dateKey()'s getFullYear/getMonth/getDate
  // (UTC midnight shifts the local day westward and can infinite-loop day walks).
  const dt = new Date(y, m - 1, d + Number(n) || 0);
  return dateKey(dt);
}

/** Map legacy dueDate/dueEnd/criticalPath onto Sol schedule fields (idempotent). */
export function normalizeTask(task) {
  if (!task || typeof task !== "object") return task;
  const targetDate = task.targetDate ?? task.dueDate ?? null;
  let latestDate = task.latestDate ?? task.dueEnd ?? null;
  let estimatedLatest = !!task.estimatedLatest;
  if (!latestDate && targetDate && task.selfTarget) {
    latestDate = addDaysISO(targetDate, 10);
    estimatedLatest = true;
  }
  if (!latestDate && targetDate) latestDate = targetDate;

  let criticality = task.criticality;
  if (criticality == null) {
    if (task.criticalPath) criticality = 3;
    else if (task.selfTarget) criticality = Math.min(2, Math.max(1, task.urgency || 1));
    else if ((task.urgency || 1) >= 3) criticality = 2;
    else criticality = 1;
  }
  criticality = Math.min(3, Math.max(1, Number(criticality) || 1));

  return {
    ...task,
    availableFrom: task.availableFrom ?? null,
    targetDate,
    latestDate,
    exactDate: task.exactDate ?? null,
    criticality,
    dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
    blocks: Array.isArray(task.blocks) ? task.blocks : [],
    recurrence: task.recurrence ?? null,
    completionMode: task.completionMode || "manual",
    estimatedLatest,
    checklist: Array.isArray(task.checklist) ? task.checklist : [],
    nextTaskOnComplete: task.nextTaskOnComplete ?? null,
    branchOptions: task.branchOptions ?? null,
  };
}

export function normalizeTasks(tasks) {
  return (Array.isArray(tasks) ? tasks : []).map(normalizeTask);
}

function depsComplete(task, tasks) {
  const deps = task.dependencies || [];
  if (!deps.length) return true;
  const byId = Object.fromEntries((tasks || []).map((t) => [t.id, t]));
  return deps.every((id) => {
    const d = byId[id];
    return d && (d.status === "done" || d.status === "archived");
  });
}

export function taskScheduleStatus(task, today = new Date(), tasks = []) {
  const t = normalizeTask(task);
  const todayK = dateKey(today);
  if (!t) return "available";
  if (t.status === "done") return "done";
  if (t.status === "archived" || t.status === "dismissed") return "archived";
  if (t.availableFrom && todayK < t.availableFrom) return "not-available";
  if (!depsComplete(t, tasks)) return "blocked";
  if (t.exactDate && todayK < t.exactDate) return "scheduled";
  if (t.latestDate && todayK > t.latestDate) return "past-latest";
  if (t.targetDate && todayK > t.targetDate) return "overdue";
  if (t.targetDate && todayK === t.targetDate) return "due";
  return "available";
}

/** 0–100 schedule urgency (Sol §4). Job fit score stays separate. */
export function urgencyScore(task, today = new Date()) {
  const t = normalizeTask(task);
  if (!t || !isOpen(t)) return 0;
  const todayK = dateKey(today);
  const criticalityBonus = { 1: 0, 2: 10, 3: 20 }[t.criticality || 1] || 0;
  let timePressure = 0;

  if (t.exactDate && todayK < t.exactDate) {
    const delta = daysBetween(todayK, t.exactDate);
    timePressure = delta <= 1 ? 45 : delta <= 3 ? 25 : 5;
  } else if (!t.targetDate) {
    timePressure = 10;
  } else if (todayK < t.targetDate) {
    const start = t.availableFrom || todayK;
    const totalLead = Math.max(1, daysBetween(start, t.targetDate) || 1);
    const elapsed = Math.max(0, daysBetween(start, todayK) || 0);
    const progress = Math.min(1, elapsed / totalLead);
    timePressure = 10 + 20 * progress;
  } else if (todayK === t.targetDate) {
    timePressure = 35;
  } else if (!t.latestDate || todayK <= t.latestDate) {
    const grace = Math.max(1, daysBetween(t.targetDate, t.latestDate || t.targetDate) || 1);
    const overdue = Math.max(1, daysBetween(t.targetDate, todayK) || 1);
    const progress = Math.min(1, overdue / grace);
    timePressure = 35 + 50 * progress * progress;
  } else {
    const past = daysBetween(t.latestDate, todayK) || 0;
    timePressure = 95 + Math.min(5, past * 2);
  }

  const dependencyBonus = (t.blocks || []).length ? 10 : 0;
  // Self-target jobs never outrank crit-3 move work merely by being overdue
  let score = Math.min(100, Math.round(timePressure + criticalityBonus + dependencyBonus));
  if (t.selfTarget && (t.criticality || 1) <= 2) score = Math.min(score, 69);
  return score;
}

export function urgencyBadge(task, today = new Date(), tasks = []) {
  const status = taskScheduleStatus(task, today, tasks);
  if (status === "overdue") return "OVERDUE";
  if (status === "past-latest") return "FINAL CALL";
  if (status === "due") return "DUE";
  if (status === "blocked") return "BLOCKED";
  if (status === "scheduled") return "SCHEDULED";
  const score = urgencyScore(task, today);
  if (score >= 90) return "FINAL CALL";
  if (score >= 70) return "CLOSING";
  if (score >= 50) return "OVERDUE";
  if (score >= 30) return "SOON";
  return null;
}

function effortOf(t) {
  return Math.min(3, Math.max(1, Number(t.effort) || 1));
}

/**
 * Bound today (Sol §5A) — scheduler-infeasibility (rule 4) comes from fumes floor.
 * Self-imposed job targets stay urgent in the deck; they do not auto-flood the hand.
 */
export function isBoundToday(task, today = new Date(), tasks = [], fumesIds = null) {
  const t = normalizeTask(task);
  if (!t || !isOpen(t)) return false;
  const todayK = dateKey(today);
  const status = taskScheduleStatus(t, today, tasks);
  if (status === "blocked" || status === "not-available" || status === "scheduled") {
    if (!(t.exactDate && todayK === t.exactDate)) return false;
  }
  if (t.exactDate && todayK === t.exactDate) return true;
  // Past-latest binds real deadlines only (crit ≥ 2, not self-target soft dates).
  if (
    t.latestDate
    && todayK >= t.latestDate
    && (t.criticality || 1) >= 2
    && !t.selfTarget
  ) return true;
  if (t.recurrence === "daily" && (t.criticality || 1) >= 3) return true;
  if (fumesIds && fumesIds.has(t.id)) return true;
  return false;
}

/**
 * Whole-card backward Fumes floor (Sol §5B).
 *
 * Reverse-calculate: place every required (crit ≥ 2) card as late as possible
 * within the fumes capacity (3/day). Most-constrained deadlines claim capacity
 * first. If a day is full, overbook that card's *latest* day — never dump the
 * whole backlog onto today. Today's placements = the true fumes floor / bound hand.
 */
export function buildMinimumSchedule(tasks, today = new Date(), horizon = MOVE_DATE) {
  const todayK = dateKey(today);
  const horizonK = dateKey(horizon) || MOVE_DATE;
  const list = normalizeTasks(tasks).filter(isOpen);
  const capacity = {}; // day -> remaining effort (may go negative when overbooked)
  const placed = {}; // taskId -> day

  // Build day capacity table (guarded — never spin forever)
  let guard = 0;
  for (let d = todayK; d && d <= horizonK && guard < 400; d = addDaysISO(d, 1), guard += 1) {
    capacity[d] = ENERGY_BUDGET.fumes; // 3/day baseline
  }

  // Reserve exact-date events on their day (these always land on that date)
  for (const t of list) {
    if (!t.exactDate || t.exactDate < todayK || t.exactDate > horizonK) continue;
    const e = effortOf(t);
    capacity[t.exactDate] = (capacity[t.exactDate] ?? 0) - e;
    placed[t.id] = t.exactDate;
  }

  // Most-constrained first (soonest latestDate), so urgent windows keep capacity
  // and flexible cards absorb overbook on later days.
  const required = list
    .filter((t) => (t.criticality || 1) >= 2 && !placed[t.id])
    .filter((t) => {
      // Self-target soft jobs only enter the floor at crit ≥ 2 (already filtered)
      // and never solely because a fake due is past — see isBoundToday.
      if (t.selfTarget && (t.criticality || 1) < 2) return false;
      return true;
    })
    .sort((a, b) => {
      const la = a.latestDate || a.targetDate || horizonK;
      const lb = b.latestDate || b.targetDate || horizonK;
      if (la !== lb) return la.localeCompare(lb); // soonest deadline first
      return effortOf(b) - effortOf(a); // heavier first within a day
    });

  for (const task of required) {
    const earliest = [todayK, task.availableFrom].filter(Boolean).sort().pop();
    let latest = task.latestDate || task.targetDate || horizonK;
    if (latest < earliest) latest = earliest;
    if (latest > horizonK) latest = horizonK;
    if (latest < todayK) latest = todayK; // already late — competes for today
    const e = effortOf(task);
    let placedDay = null;
    // Walk latest → earliest; pick last day with room
    guard = 0;
    for (let d = latest; d && d >= earliest && guard < 400; d = addDaysISO(d, -1), guard += 1) {
      if (d > horizonK || d < todayK) continue;
      if ((capacity[d] ?? 0) >= e) {
        placedDay = d;
        break;
      }
    }
    // No room in the window: overbook the card's latest day (true reverse pressure),
    // not today — unless latest is today / already past.
    if (!placedDay) placedDay = latest;
    capacity[placedDay] = (capacity[placedDay] ?? 0) - e;
    placed[task.id] = placedDay;
  }

  const fumesIds = Object.entries(placed)
    .filter(([, day]) => day === todayK)
    .map(([id]) => id);

  // Past-latest real deadlines that weren't in the placement loop still belong today
  for (const t of list) {
    if (fumesIds.includes(t.id)) continue;
    if (t.exactDate === todayK) fumesIds.push(t.id);
    else if (
      t.latestDate
      && todayK >= t.latestDate
      && (t.criticality || 1) >= 2
      && !t.selfTarget
    ) {
      fumesIds.push(t.id);
    }
  }

  const fumesTasks = fumesIds
    .map((id) => list.find((t) => t.id === id))
    .filter(Boolean)
    .sort((a, b) => urgencyScore(b, today) - urgencyScore(a, today));
  const fumesEffort = fumesTasks.reduce((s, t) => s + effortOf(t), 0);

  return {
    placed,
    fumesIds: fumesTasks.map((t) => t.id),
    fumesTasks,
    fumesEffort,
    fixedDay: fumesEffort > ENERGY_BUDGET.fumes,
  };
}

function eligibleFlexible(tasks, today, tasksAll, excludeIds) {
  const todayK = dateKey(today);
  return normalizeTasks(tasks)
    .filter(isOpen)
    .filter((t) => !excludeIds.has(t.id))
    .filter((t) => {
      const st = taskScheduleStatus(t, today, tasksAll);
      if (st === "blocked" || st === "not-available" || st === "archived" || st === "done") return false;
      if (st === "scheduled") return false; // exact-date future — strip only
      if (t.availableFrom && todayK < t.availableFrom) return false;
      return true;
    })
    .sort((a, b) => urgencyScore(b, today) - urgencyScore(a, today));
}

/** Steady = fumes floor + fill toward targets (soft ~6). */
export function buildSteadyPlan(tasks, today = new Date()) {
  const min = buildMinimumSchedule(tasks, today);
  const exclude = new Set(min.fumesIds);
  const flex = eligibleFlexible(tasks, today, tasks, exclude);
  const hand = [...min.fumesTasks];
  let effort = min.fumesEffort;
  const soft = Math.max(ENERGY_BUDGET.steady, min.fumesEffort);
  for (const t of flex) {
    if (effort >= soft) break;
    // Prefer finishing by target — skip low-crit jobs when fumes already heavy
    if (t.selfTarget && (t.criticality || 1) <= 1 && min.fixedDay) continue;
    hand.push(t);
    effort += effortOf(t);
  }
  return { ...min, steadyIds: hand.map((t) => t.id), steadyTasks: hand, steadyEffort: effort };
}

/** Full steam = steady + pull from next 3 days (soft ~9). */
export function buildFullSteamPlan(tasks, today = new Date()) {
  const steady = buildSteadyPlan(tasks, today);
  const exclude = new Set(steady.steadyIds);
  const flex = eligibleFlexible(tasks, today, tasks, exclude);
  const hand = [...steady.steadyTasks];
  let effort = steady.steadyEffort;
  const soft = Math.max(ENERGY_BUDGET.full, steady.fumesEffort);
  for (const t of flex) {
    if (effort >= soft) break;
    if (t.selfTarget && (t.criticality || 1) <= 1 && steady.fixedDay) continue;
    hand.push(t);
    effort += effortOf(t);
  }
  return {
    ...steady,
    fullIds: hand.map((t) => t.id),
    fullTasks: hand,
    fullEffort: effort,
  };
}

/** Extra flexible cards to draw into the hand by energy (beyond bound). */
export const ENERGY_DRAW = {
  fumes: 0,   // absolute min — bound only; optional offer still shown
  steady: 2,
  full: 4,
};

/**
 * Deal for the day (draft model):
 * - Bound hand = reverse-scheduled fumes floor (true minimum for today).
 * - Energy sets how many MORE flexible cards you draw (Fumes = 0).
 * - Offer pile ≈ 2× chooseNeeded, urgency-ranked.
 * - Does not touch task data / localStorage saves — only reshapes today's deal.
 */
export function dealDailyHand(tasks, energy = "steady", today = new Date()) {
  const full = buildFullSteamPlan(tasks, today);
  const fumesSet = new Set(full.fumesIds);
  // Bound = fumes floor + any other isBoundToday (exact / past-latest real deadlines)
  const boundIds = [];
  for (const id of full.fumesIds) {
    if (!boundIds.includes(id)) boundIds.push(id);
  }
  for (const t of normalizeTasks(tasks).filter(isOpen)) {
    if (isBoundToday(t, today, tasks, fumesSet) && !boundIds.includes(t.id)) {
      boundIds.push(t.id);
    }
  }

  const chooseNeeded = ENERGY_DRAW[energy] ?? ENERGY_DRAW.steady;
  const offerSize = chooseNeeded > 0
    ? Math.max(chooseNeeded * 2, chooseNeeded)
    : 2;
  const exclude = new Set(boundIds);
  const offerTaskIds = eligibleFlexible(tasks, today, tasks, exclude)
    .slice(0, offerSize)
    .map((t) => t.id);

  return {
    day: todayKey(today),
    energy,
    boundTaskIds: boundIds,
    boundTotal: boundIds.length,
    offerTaskIds,
    selectedTaskIds: [...boundIds],
    fumesIds: full.fumesIds,
    chooseNeeded,
    minimumEffort: full.fumesEffort,
    steadyEffort: full.steadyEffort,
    fullEffort: full.fullEffort,
    fixedDay: full.fixedDay,
    dealConfirmed: chooseNeeded === 0,
  };
}

/** Toggle a flexible card into / out of the hand (bound cards ignored). */
export function toggleDealPick(dailyDeal, taskId) {
  if (!dailyDeal || !taskId) return dailyDeal;
  const bound = new Set(dailyDeal.boundTaskIds || []);
  if (bound.has(taskId)) return dailyDeal;
  const offer = new Set(dailyDeal.offerTaskIds || []);
  if (!offer.has(taskId)) return dailyDeal;
  const selected = new Set(dailyDeal.selectedTaskIds || dailyDeal.boundTaskIds || []);
  if (selected.has(taskId)) selected.delete(taskId);
  else selected.add(taskId);
  // Bound always stay selected
  for (const id of bound) selected.add(id);
  const flexCount = [...selected].filter((id) => !bound.has(id)).length;
  const chooseNeeded = dailyDeal.chooseNeeded || 0;
  return {
    ...dailyDeal,
    selectedTaskIds: [...selected],
    dealConfirmed: flexCount >= chooseNeeded,
  };
}

export function dealProgress(dailyDeal) {
  if (!dailyDeal) return { flexPicked: 0, chooseNeeded: 0, remaining: 0, ready: false };
  const bound = new Set(dailyDeal.boundTaskIds || []);
  const flexPicked = (dailyDeal.selectedTaskIds || []).filter((id) => !bound.has(id)).length;
  const chooseNeeded = dailyDeal.chooseNeeded || 0;
  const remaining = Math.max(0, chooseNeeded - flexPicked);
  return {
    flexPicked,
    chooseNeeded,
    remaining,
    ready: remaining === 0 || chooseNeeded === 0,
  };
}

/** Ensure session has today's deal for the chosen energy (persistent hand).
 *  Re-deals if a prior bloated hand was persisted (task data untouched). */
export function ensureDailyDeal(session, tasks, energy, today = new Date()) {
  const day = todayKey(today);
  const e = energy || session?.energy;
  if (!e) return session;
  const prev = session?.dailyDeal;
  const bloated = Array.isArray(prev?.boundTaskIds) && prev.boundTaskIds.length > 12;
  if (
    prev
    && prev.day === day
    && prev.energy === e
    && Array.isArray(prev.selectedTaskIds)
    && Array.isArray(prev.offerTaskIds)
    && !bloated
  ) {
    return session;
  }
  const deal = dealDailyHand(tasks, e, today);
  return {
    ...session,
    day: session?.day || day,
    energy: e,
    dailyDeal: deal,
  };
}

/** Resolve selected hand tasks from a deal (open only; drop completed). */
export function handTasks(tasks, dailyDeal) {
  if (!dailyDeal?.selectedTaskIds?.length) return [];
  const byId = Object.fromEntries((tasks || []).map((t) => [t.id, t]));
  const bound = new Set(dailyDeal.boundTaskIds || []);
  return dailyDeal.selectedTaskIds
    .map((id) => byId[id])
    .filter((t) => t && isOpen(t))
    .map((t) => ({ ...normalizeTask(t), bound: bound.has(t.id) }));
}

/** Offer pile cards (not yet required to be in hand). */
export function offerTasks(tasks, dailyDeal) {
  if (!dailyDeal?.offerTaskIds?.length) return [];
  const byId = Object.fromEntries((tasks || []).map((t) => [t.id, t]));
  const selected = new Set(dailyDeal.selectedTaskIds || []);
  return dailyDeal.offerTaskIds
    .map((id) => byId[id])
    .filter((t) => t && isOpen(t))
    .map((t) => ({ ...normalizeTask(t), picked: selected.has(t.id) }));
}
