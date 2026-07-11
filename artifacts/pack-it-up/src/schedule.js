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
  const dt = new Date(Date.UTC(y, m - 1, d + n));
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
  if (t.latestDate && todayK >= t.latestDate) return true;
  if (t.recurrence === "daily" && (t.criticality || 1) >= 3) return true;
  if (fumesIds && fumesIds.has(t.id)) return true;
  return false;
}

/**
 * Whole-card backward Fumes floor (Sol §5B).
 * Places crit ≥2 open tasks as late as possible; anything forced onto today = minimum.
 */
export function buildMinimumSchedule(tasks, today = new Date(), horizon = MOVE_DATE) {
  const todayK = dateKey(today);
  const horizonK = dateKey(horizon) || MOVE_DATE;
  const list = normalizeTasks(tasks).filter(isOpen);
  const capacity = {}; // day -> remaining effort
  const placed = {}; // taskId -> day

  for (let d = todayK; d && d <= horizonK; d = addDaysISO(d, 1)) {
    capacity[d] = ENERGY_BUDGET.fumes; // 3/day baseline
  }

  // Reserve exact-date events on their day
  for (const t of list) {
    if (!t.exactDate || t.exactDate < todayK || t.exactDate > horizonK) continue;
    const e = effortOf(t);
    capacity[t.exactDate] = Math.max(0, (capacity[t.exactDate] ?? 0) - e);
    placed[t.id] = t.exactDate;
  }

  const required = list
    .filter((t) => (t.criticality || 1) >= 2 && !placed[t.id])
    .filter((t) => !t.selfTarget || (t.criticality || 1) >= 2)
    .sort((a, b) => {
      const la = a.latestDate || a.targetDate || horizonK;
      const lb = b.latestDate || b.targetDate || horizonK;
      return lb.localeCompare(la);
    });

  for (const task of required) {
    const earliest = [todayK, task.availableFrom].filter(Boolean).sort().pop();
    const latest = task.latestDate || task.targetDate || horizonK;
    const e = effortOf(task);
    let placedDay = null;
    // Walk latest → earliest; pick last day with room (and deps — simplified: ignore dep days for now)
    for (let d = latest; d && d >= earliest; d = addDaysISO(d, -1)) {
      if (d > horizonK || d < todayK) continue;
      if ((capacity[d] ?? 0) >= e) {
        placedDay = d;
        break;
      }
    }
    if (!placedDay) placedDay = todayK; // forced today
    capacity[placedDay] = Math.max(0, (capacity[placedDay] ?? 0) - e);
    placed[task.id] = placedDay;
  }

  const fumesIds = Object.entries(placed)
    .filter(([, day]) => day === todayK)
    .map(([id]) => id);

  // Also bind exact-date-today and past-latest crit tasks even if not in required loop
  for (const t of list) {
    if (fumesIds.includes(t.id)) continue;
    if (t.exactDate === todayK) fumesIds.push(t.id);
    else if (t.latestDate && todayK >= t.latestDate && (t.criticality || 1) >= 2) fumesIds.push(t.id);
  }

  const fumesTasks = fumesIds
    .map((id) => list.find((t) => t.id === id))
    .filter(Boolean);
  const fumesEffort = fumesTasks.reduce((s, t) => s + effortOf(t), 0);

  return {
    placed,
    fumesIds,
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

/**
 * Deal for the day: all bound + enough flex for full-steam + up to 2 alts.
 * selectedIds start as the plan for the chosen energy (player can refine later).
 */
export function dealDailyHand(tasks, energy = "steady", today = new Date()) {
  const full = buildFullSteamPlan(tasks, today);
  const fumesSet = new Set(full.fumesIds);
  const boundIds = normalizeTasks(tasks)
    .filter(isOpen)
    .filter((t) => isBoundToday(t, today, tasks, fumesSet))
    .map((t) => t.id);

  // Bound always includes fumes floor
  for (const id of full.fumesIds) {
    if (!boundIds.includes(id)) boundIds.push(id);
  }

  const boundSet = new Set(boundIds);
  const planIds =
    energy === "fumes" ? full.fumesIds
      : energy === "full" ? full.fullIds
        : full.steadyIds;

  const selectedIds = [...new Set([...boundIds, ...planIds])];

  // Deal pool = bound + full plan + up to 2 alternatives
  const exclude = new Set(selectedIds);
  const alts = eligibleFlexible(tasks, today, tasks, exclude).slice(0, 2);
  const dealtTaskIds = [...selectedIds, ...alts.map((t) => t.id)];
  const dealCount = Math.min(9, dealtTaskIds.length);
  // If bound > 9, still show all bound (scroll) — don't hide obligations
  const dealt = boundIds.length > 9
    ? [...new Set([...boundIds, ...dealtTaskIds])]
    : dealtTaskIds.slice(0, Math.max(dealCount, boundIds.length));

  return {
    day: todayKey(today),
    energy,
    boundTaskIds: boundIds,
    dealtTaskIds: dealt,
    selectedTaskIds: selectedIds,
    fumesIds: full.fumesIds,
    minimumEffort: full.fumesEffort,
    steadyEffort: full.steadyEffort,
    fullEffort: full.fullEffort,
    fixedDay: full.fixedDay,
    dealConfirmed: true,
  };
}

/** Ensure session has today's deal for the chosen energy (persistent hand). */
export function ensureDailyDeal(session, tasks, energy, today = new Date()) {
  const day = todayKey(today);
  const e = energy || session?.energy;
  if (!e) return session;
  const prev = session?.dailyDeal;
  if (
    prev
    && prev.day === day
    && prev.energy === e
    && prev.dealConfirmed
    && Array.isArray(prev.selectedTaskIds)
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
