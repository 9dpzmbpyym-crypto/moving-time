/* Daily card-deal + schedule status. Ledger = deck; Board = today's hand.
   Structure first — thin backward Fumes floor; full data seed comes later. */

import { dateKey, daysUntil, dayNumber, MOVE_DATE } from "./movePhase.js";
import { isOpen } from "./tasks.js";
import { ENERGY_BUDGET, todayKey } from "./session.js";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const FALLBACK_LEAD_DAYS = 7;

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

  const manualCriticality = task.criticalityOverride ?? task.manualCriticality ?? null;
  let criticality = manualCriticality;
  if (criticality == null && task.category === "job" && Number.isFinite(Number(task.score))) {
    const fit = Number(task.score);
    criticality = fit >= 85 ? 3 : fit >= 70 ? 2 : 1;
  }
  if (criticality == null) criticality = task.criticality;
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
    criticalityOverride: manualCriticality,
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
  // Inclusive — the latest day itself is FINAL CALL, not one more day of grace
  // (buildMinimumSchedule / isBoundToday already bind todayK >= latestDate; this
  // keeps the display state machine in step with the scheduler's own math).
  if (t.latestDate && todayK >= t.latestDate) return "past-latest";
  if (t.targetDate && todayK > t.targetDate) return "overdue";
  if (t.targetDate && todayK === t.targetDate) return "due";
  return "available";
}

/**
 * Sort key: criticality-weighted deadline pressure (higher = handle sooner).
 * `deadline` is a 0–110 time-pressure term; the return multiplies it by
 * criticality (1–3) so importance and urgency both count in ordering.
 * Self-imposed job deadlines (selfTarget + estimatedLatest) are damped so a
 * fake "overdue" can never outrank real crit-3 move work. Job fit score
 * (task.score) is deliberately NOT consulted here — deadline urgency only.
 */
export function urgencyScore(task, today = new Date()) {
  const t = normalizeTask(task);
  if (!t || !isOpen(t)) return 0;
  const todayK = dateKey(today);
  const finalDate = t.exactDate || t.latestDate || t.targetDate;
  const daysToFinal = finalDate ? daysBetween(todayK, finalDate) : null;
  const soft = !!(t.selfTarget && t.estimatedLatest); // fake / self-imposed deadline
  const daysPastTarget = (!soft && t.targetDate && todayK > t.targetDate)
    ? Math.max(0, daysBetween(t.targetDate, todayK) || 0)
    : 0;
  let deadline = 5;
  if (t.exactDate === todayK) deadline = 100;
  else if (daysToFinal != null) {
    deadline = daysToFinal <= 0
      ? 90 + Math.min(10, Math.abs(daysToFinal) * 2)
      : Math.max(8, 88 - daysToFinal * 7);
  }
  deadline += daysPastTarget * 6;
  if (t.latestDate && finalDate === t.latestDate) deadline += 8;
  if (soft) deadline = Math.min(deadline, 50); // never dominate real deadlines
  deadline = Math.max(0, Math.min(110, deadline));
  return Math.round((t.criticality || 1) * deadline);
}

/**
 * Display status (Sol §4 / Part A): one of
 * SOON/DUE/OVERDUE/CLOSING/FINAL CALL/BLOCKED/SCHEDULED/available.
 * A thin wrapper over taskScheduleStatus (the one state machine) — only adds
 * the SOON (approaching target) / OVERDUE-vs-CLOSING (progress within the
 * target→latest grace window) refinement needed for display. Job fit score
 * (task.score) is never consulted here — deadline urgency stays separate.
 */
export function taskStatus(task, today = new Date(), tasks = []) {
  const t = normalizeTask(task);
  if (!t) return "available";
  const status = taskScheduleStatus(t, today, tasks);
  switch (status) {
    case "blocked":
      return "BLOCKED";
    case "scheduled":
      return "SCHEDULED";
    case "past-latest":
      return "FINAL CALL";
    case "due":
      return "DUE";
    case "overdue": {
      const todayK = dateKey(today);
      const target = t.targetDate;
      const latest = t.latestDate || target;
      if (!target || !latest || latest <= target) return "OVERDUE";
      const span = Math.max(1, daysBetween(target, latest) || 1);
      const elapsed = Math.max(0, daysBetween(target, todayK) || 0);
      const progress = Math.min(1, elapsed / span);
      return progress >= 0.5 ? "CLOSING" : "OVERDUE";
    }
    case "done":
    case "archived":
    case "not-available":
      return "available";
    case "available":
    default: {
      if (!t.targetDate) return "available";
      const todayK = dateKey(today);
      const daysToTarget = daysBetween(todayK, t.targetDate);
      return daysToTarget != null && daysToTarget >= 0 && daysToTarget <= 3 ? "SOON" : "available";
    }
  }
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
  const schedulable = list.filter((t) => {
    const status = taskScheduleStatus(t, today, list);
    return status !== "blocked" && status !== "not-available" && status !== "scheduled";
  });
  const capacity = {}; // day -> remaining effort (may go negative when overbooked)
  const placed = {}; // taskId -> day

  // Build day capacity table (guarded — never spin forever)
  let guard = 0;
  for (let d = todayK; d && d <= horizonK && guard < 400; d = addDaysISO(d, 1), guard += 1) {
    capacity[d] = ENERGY_BUDGET.fumes; // 3/day baseline
  }

  // Reserve exact-date events on their day (these always land on that date)
  for (const t of schedulable) {
    if (!t.exactDate || t.exactDate < todayK || t.exactDate > horizonK) continue;
    const e = effortOf(t);
    capacity[t.exactDate] = (capacity[t.exactDate] ?? 0) - e;
    placed[t.id] = t.exactDate;
  }

  // Most-constrained first (soonest latestDate), so urgent windows keep capacity
  // and flexible cards absorb overbook on later days.
  const required = schedulable
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
  for (const t of schedulable) {
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
    .map((id) => schedulable.find((t) => t.id === id))
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

function finalDeadline(task) {
  return task.exactDate || task.latestDate || task.targetDate || MOVE_DATE;
}

function daysPastTarget(task, todayK) {
  return task.targetDate && todayK > task.targetDate
    ? Math.max(0, daysBetween(task.targetDate, todayK) || 0)
    : 0;
}

export function compareTaskUrgency(a, b, today = new Date()) {
  const todayK = dateKey(today);
  return urgencyScore(b, today) - urgencyScore(a, today)
    || daysPastTarget(b, todayK) - daysPastTarget(a, todayK)
    || finalDeadline(a).localeCompare(finalDeadline(b))
    || (b.criticality || 1) - (a.criticality || 1)
    || (Number(b.score) || 0) - (Number(a.score) || 0)
    || effortOf(b) - effortOf(a);
}

function isActionable(task, today, allTasks) {
  return !["blocked", "not-available", "scheduled", "done", "archived"]
    .includes(taskScheduleStatus(task, today, allTasks));
}

/** QUOTA eligibility — how much effort each tier's target represents.
 *  fumes = crit-3 floor · steady = crit ≥ 2 · full = everything before the move. */
function tierEligible(task, tier) {
  if (tier === "fumes") return task.criticality === 3;
  if (tier === "steady") return (task.criticality || 1) >= 2;
  return finalDeadline(task) <= MOVE_DATE;
}

/** OFFER-pool eligibility — what the player may draw/swap on a given energy.
 *  Looser than the quota tier so a fumes day still has real near-term cards. */
function offerEligible(task, tier) {
  if (tier === "full") return finalDeadline(task) <= MOVE_DATE;
  return (task.criticality || 1) >= 2; // fumes + steady both offer important work
}

function usableDays(todayK, deadline = MOVE_DATE) {
  if (todayK > deadline) return 1;
  return Math.max(1, (daysBetween(todayK, deadline) || 0) + 1);
}

export function calculateTierQuotas(tasks, today = new Date()) {
  const todayK = dateKey(today);
  const open = normalizeTasks(tasks).filter(isOpen);
  const quotaFor = (tier) => {
    const eligible = open.filter((t) => tierEligible(t, tier));
    const totalEffort = eligible.reduce((sum, t) => sum + effortOf(t), 0);
    let quota = Math.ceil(totalEffort / usableDays(todayK));
    const deadlines = [...new Set(eligible.map(finalDeadline))]
      .filter((d) => d >= todayK && d <= MOVE_DATE).sort();
    for (const deadline of deadlines) {
      const dueEffort = eligible.filter((t) => finalDeadline(t) <= deadline)
        .reduce((sum, t) => sum + effortOf(t), 0);
      quota = Math.max(quota, Math.ceil(dueEffort / usableDays(todayK, deadline)));
    }
    return quota;
  };
  return { fumes: quotaFor("fumes"), steady: quotaFor("steady"), full: quotaFor("full") };
}

export function taskScheduleKey(tasks, today = new Date()) {
  const rows = normalizeTasks(tasks).map((t) => ({
    id: t.id, status: t.status, effort: t.effort, criticality: t.criticality,
    criticalityOverride: t.criticalityOverride, score: t.score,
    availableFrom: t.availableFrom, targetDate: t.targetDate,
    latestDate: t.latestDate, exactDate: t.exactDate,
    dependencies: [...t.dependencies].sort(), recurrence: t.recurrence,
  })).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return `${dateKey(today)}:${JSON.stringify(rows)}`;
}

export function dealDailyHand(tasks, energy = "steady", today = new Date()) {
  const todayK = dateKey(today);
  const openTasks = normalizeTasks(tasks).filter(isOpen);
  const ranked = [...openTasks].sort((a, b) => compareTaskUrgency(a, b, today));
  const quotas = calculateTierQuotas(openTasks, today);
  // Bound = date-forced ONLY (isBoundToday: exact-date today, past-latest real
  // non-selfTarget deadlines, daily-recurrence). We no longer fill bound with
  // ranked crit-3 until the fumes quota — that pulled future (Jul-27+) operational
  // cards into today. The quota is a "how much to select" target, not a binder.
  const bound = ranked.filter((t) => isBoundToday(t, today, openTasks));
  const boundSet = new Set(bound.map((t) => t.id));
  const boundEffort = bound.reduce((sum, t) => sum + effortOf(t), 0);
  // Offer pile: ranked, actionable (isActionable already drops blocked-by-deps,
  // unavailable, future-exactDate, done/archived), non-bound, tier-eligible.
  // Every tier gets a pool now — including fumes (was hard-set to []).
  const eligiblePool = ranked.filter((t) => (
    !boundSet.has(t.id) && isActionable(t, today, openTasks) && offerEligible(t, energy)
  ));
  // fumes target = just the date-forced floor (require 0 optional; offers are
  // voluntary). steady/full use their computed effort quotas.
  const target = energy === "fumes" ? boundEffort : (quotas[energy] ?? quotas.steady);
  const requiredOptionalEffort = Math.max(0, target - boundEffort);
  const poolLimit = energy === "full"
    ? Math.max(8, requiredOptionalEffort * 3)
    : Math.max(6, requiredOptionalEffort * 2); // fumes/steady still get 6+ to draw/swap
  const offerList = eligiblePool.slice(0, poolLimit);
  const effortById = {};
  for (const t of [...bound, ...offerList]) effortById[t.id] = effortOf(t);
  const overloadReasons = openTasks
    .filter((t) => t.availableFrom && t.availableFrom > finalDeadline(t))
    .map((t) => `${t.title || t.id} is unavailable until after its deadline`);
  return {
    day: todayKey(today), energy,
    boundTaskIds: bound.map((t) => t.id), boundTotal: bound.length, boundEffort,
    offerTaskIds: offerList.map((t) => t.id), selectedTaskIds: bound.map((t) => t.id),
    fumesIds: bound.filter((t) => t.criticality === 3).map((t) => t.id), effortById,
    requiredOptionalEffort, minimumEffort: quotas.fumes,
    steadyEffort: quotas.steady, fullEffort: quotas.full,
    dailyQuota: target, tierQuotas: quotas,
    fixedDay: boundEffort > target || bound.some((t) => t.exactDate === todayK),
    overload: overloadReasons.length > 0, overloadReasons,
    scheduleKey: taskScheduleKey(openTasks, today),
    dealConfirmed: requiredOptionalEffort === 0,
  };
}

/** Toggle a flexible card into / out of the hand (bound cards ignored). Effort
 *  is read from the deal's own effortById cache — never recomputed from task data. */
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
  const effortById = dailyDeal.effortById || {};
  const selectedOptionalEffort = [...selected]
    .filter((id) => !bound.has(id))
    .reduce((s, id) => s + (effortById[id] ?? 1), 0);
  const requiredOptionalEffort = dailyDeal.requiredOptionalEffort || 0;
  const remainingEffort = Math.max(0, requiredOptionalEffort - selectedOptionalEffort);
  return {
    ...dailyDeal,
    selectedTaskIds: [...selected],
    dealConfirmed: remainingEffort <= 0,
  };
}

/** {selectedOptionalEffort, requiredOptionalEffort, remainingEffort} — effort model (Part D). */
export function dealProgress(dailyDeal) {
  if (!dailyDeal) {
    return { selectedOptionalEffort: 0, requiredOptionalEffort: 0, remainingEffort: 0, ready: true };
  }
  const bound = new Set(dailyDeal.boundTaskIds || []);
  const effortById = dailyDeal.effortById || {};
  const selectedOptionalEffort = (dailyDeal.selectedTaskIds || [])
    .filter((id) => !bound.has(id))
    .reduce((s, id) => s + (effortById[id] ?? 1), 0);
  const requiredOptionalEffort = dailyDeal.requiredOptionalEffort || 0;
  const remainingEffort = Math.max(0, requiredOptionalEffort - selectedOptionalEffort);
  return {
    selectedOptionalEffort,
    requiredOptionalEffort,
    remainingEffort,
    ready: remainingEffort <= 0,
  };
}

/**
 * Detects a same-day deal saved before the effort model (old chooseNeeded /
 * card-count shape) — its effortById cache is missing or incomplete for the
 * ids it carries. Robust to mergeSession's field coercion (which always fills
 * in `{}` / `0` defaults) because it checks per-id coverage, not presence.
 */
function needsEffortMigration(deal) {
  if (!deal) return false;
  const ids = [...(deal.boundTaskIds || []), ...(deal.offerTaskIds || [])];
  if (!ids.length) return false;
  const effortById = deal.effortById || {};
  return ids.some((id) => effortById[id] == null);
}

/**
 * Migrate an existing (possibly legacy card-count) deal to the effort model
 * IN PLACE — never touches boundTaskIds / offerTaskIds / selectedTaskIds /
 * fumesIds, so selected cards, Bound cards, and manual picks all survive.
 * Only backfills the effort bookkeeping fields from current task data.
 */
export function migrateDealEffort(deal, tasks, energy) {
  if (!deal) return deal;
  const byId = Object.fromEntries(normalizeTasks(tasks).map((t) => [t.id, t]));
  const effortById = { ...(deal.effortById || {}) };
  const ids = new Set([
    ...(deal.boundTaskIds || []),
    ...(deal.offerTaskIds || []),
    ...(deal.selectedTaskIds || []),
  ]);
  for (const id of ids) {
    if (effortById[id] == null) {
      effortById[id] = byId[id] ? effortOf(byId[id]) : 1;
    }
  }
  const boundEffort = (deal.boundTaskIds || [])
    .reduce((s, id) => s + (effortById[id] ?? 1), 0);
  const budget = deal.dailyQuota
    ?? deal.tierQuotas?.[energy || deal.energy]
    ?? deal.steadyEffort
    ?? ENERGY_BUDGET.steady;
  const requiredOptionalEffort = Math.max(0, budget - boundEffort);
  const boundSet = new Set(deal.boundTaskIds || []);
  const selectedOptionalEffort = (deal.selectedTaskIds || [])
    .filter((id) => !boundSet.has(id))
    .reduce((s, id) => s + (effortById[id] ?? 1), 0);
  const remainingEffort = Math.max(0, requiredOptionalEffort - selectedOptionalEffort);
  return {
    ...deal,
    effortById,
    boundEffort,
    requiredOptionalEffort,
    dealConfirmed: remainingEffort <= 0,
  };
}

/** Ensure session has today's deal for the chosen energy (persistent hand).
 *  Re-deals if a prior bloated hand was persisted (task data untouched).
 *  A same-day legacy (pre-effort) deal is migrated in place instead — never
 *  rebuilt from scratch — so selected/Bound cards are never lost. */
export function ensureDailyDeal(session, tasks, energy, today = new Date()) {
  const day = todayKey(today);
  const e = energy || session?.energy;
  if (!e) return session;
  const prev = session?.dailyDeal;
  const bloated = Array.isArray(prev?.boundTaskIds) && prev.boundTaskIds.length > 12;
  const scheduleKey = taskScheduleKey(normalizeTasks(tasks).filter(isOpen), today);
  const sameDaySameEnergy = !!(
    prev
    && prev.day === day
    && prev.energy === e
    && Array.isArray(prev.selectedTaskIds)
    && Array.isArray(prev.offerTaskIds)
    && !bloated
  );
  if (sameDaySameEnergy && prev.scheduleKey === scheduleKey) {
    if (!needsEffortMigration(prev)) return session;
    return { ...session, dailyDeal: migrateDealEffort(prev, tasks, e) };
  }
  const deal = dealDailyHand(tasks, e, today);
  // Keep explicit choices only while they are still valid in the regenerated pool.
  if (prev?.day === day) {
    const validOffers = new Set(deal.offerTaskIds);
    const selected = new Set(deal.boundTaskIds);
    for (const id of prev.selectedTaskIds || []) {
      if (validOffers.has(id)) selected.add(id);
    }
    deal.selectedTaskIds = [...selected];
    deal.dealConfirmed = dealProgress(deal).ready;
  }
  return {
    ...session,
    day: session?.day || day,
    energy: e,
    dailyDeal: deal,
  };
}

/** Resolve selected hand tasks from a deal (open only; drop completed).
 *  Each task carries `urgencyStatus` (Part E badge text) computed against the
 *  full task list, so card components never need tasks/today plumbed in. */
export function handTasks(tasks, dailyDeal) {
  if (!dailyDeal?.selectedTaskIds?.length) return [];
  const all = tasks || [];
  const byId = Object.fromEntries(all.map((t) => [t.id, t]));
  const bound = new Set(dailyDeal.boundTaskIds || []);
  const today = new Date();
  return dailyDeal.selectedTaskIds
    .map((id) => byId[id])
    .filter((t) => t && isOpen(t))
    .map((t) => ({
      ...normalizeTask(t),
      bound: bound.has(t.id),
      urgencyStatus: taskStatus(t, today, all),
    }));
}

/** Offer pile cards (not yet required to be in hand). */
export function offerTasks(tasks, dailyDeal) {
  if (!dailyDeal?.offerTaskIds?.length) return [];
  const all = tasks || [];
  const byId = Object.fromEntries(all.map((t) => [t.id, t]));
  const selected = new Set(dailyDeal.selectedTaskIds || []);
  const today = new Date();
  return dailyDeal.offerTaskIds
    .map((id) => byId[id])
    .filter((t) => t && isOpen(t))
    .map((t) => ({
      ...normalizeTask(t),
      picked: selected.has(t.id),
      urgencyStatus: taskStatus(t, today, all),
    }));
}
