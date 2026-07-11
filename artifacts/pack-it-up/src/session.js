/* Daily session ritual — File / Stamp / Clear goals + reward toasts.
   Resets at local midnight via `day` key. Persisted inside pack-it-up-save. */

export const SESSION_GOALS = [
  { id: "file",   label: "File documents",   target: 6, key: "filed" },
  { id: "stamp",  label: "Stamp approvals",  target: 4, key: "stamped" },
  { id: "clear",  label: "Clear 3 things",   target: 3, key: "cleared" },
];

export const HEALTH_SESSION_GOALS = [
  { id: "zones", label: "Stabilize zones",  target: 3, key: "zones" },
  { id: "care",  label: "Use care items",   target: 3, key: "care" },
  { id: "appt",  label: "Finish appointment", target: 1, key: "appt" },
];

/** Sublet sprint — ticks only, never task cards. */
export const HOUSING_SESSION_GOALS = [
  { id: "msgs",  label: "Serious msgs", target: 10, key: "messages" },
  { id: "backs", label: "Backup msgs",  target: 5,  key: "backups" },
];

/** Effort budget for Command Board picks. */
export const ENERGY_BUDGET = { fumes: 3, steady: 6, full: 9 };

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function defaultSession() {
  return {
    day: todayKey(),
    filed: 0,
    stamped: 0,
    cleared: 0,
    care: 0,
    zones: 0,
    appt: 0,
    messages: 0,
    backups: 0,
    energy: null, // null | "fumes" | "steady" | "full"
    dailyDeal: null, // persisted hand for the local day (see schedule.js)
    calmedZones: {},
  };
}

/** Restore session from save; roll to a fresh day if the date changed. */
export function mergeSession(savedSession) {
  const fresh = defaultSession();
  if (!savedSession || typeof savedSession !== "object") return fresh;
  if (savedSession.day !== fresh.day) return fresh;
  const energy = ["fumes", "steady", "full"].includes(savedSession.energy)
    ? savedSession.energy
    : null;
  const dailyDeal = savedSession.dailyDeal && typeof savedSession.dailyDeal === "object"
    && savedSession.dailyDeal.day === fresh.day
    ? {
      day: fresh.day,
      energy: savedSession.dailyDeal.energy || energy,
      boundTaskIds: Array.isArray(savedSession.dailyDeal.boundTaskIds) ? savedSession.dailyDeal.boundTaskIds : [],
      dealtTaskIds: Array.isArray(savedSession.dailyDeal.dealtTaskIds) ? savedSession.dailyDeal.dealtTaskIds : [],
      selectedTaskIds: Array.isArray(savedSession.dailyDeal.selectedTaskIds) ? savedSession.dailyDeal.selectedTaskIds : [],
      fumesIds: Array.isArray(savedSession.dailyDeal.fumesIds) ? savedSession.dailyDeal.fumesIds : [],
      minimumEffort: Math.max(0, Number(savedSession.dailyDeal.minimumEffort) || 0),
      steadyEffort: Math.max(0, Number(savedSession.dailyDeal.steadyEffort) || 0),
      fullEffort: Math.max(0, Number(savedSession.dailyDeal.fullEffort) || 0),
      fixedDay: !!savedSession.dailyDeal.fixedDay,
      dealConfirmed: !!savedSession.dailyDeal.dealConfirmed,
    }
    : null;
  return {
    ...fresh,
    filed: Math.max(0, Number(savedSession.filed) || 0),
    stamped: Math.max(0, Number(savedSession.stamped) || 0),
    cleared: Math.max(0, Number(savedSession.cleared) || 0),
    care: Math.max(0, Number(savedSession.care) || 0),
    zones: Math.max(0, Number(savedSession.zones) || 0),
    appt: Math.max(0, Number(savedSession.appt) || 0),
    messages: Math.max(0, Number(savedSession.messages) || 0),
    backups: Math.max(0, Number(savedSession.backups) || 0),
    energy,
    dailyDeal,
    calmedZones: savedSession.calmedZones && typeof savedSession.calmedZones === "object"
      ? { ...savedSession.calmedZones }
      : {},
  };
}

export function sessionProgress(session, goals = SESSION_GOALS) {
  const items = goals.map((g) => {
    const cur = Math.min(g.target, Math.max(0, Number(session[g.key]) || 0));
    return { ...g, cur, done: cur >= g.target };
  });
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? done / items.length : 0;
  return { items, done, total: items.length, pct };
}

/** Increment a counter; returns { session, justCompletedGoal, rewardLabel }. */
export function bumpSession(session, key, amount = 1, rewardLabel) {
  const next = { ...session, [key]: Math.max(0, (Number(session[key]) || 0) + amount) };
  const goals = [...SESSION_GOALS, ...HEALTH_SESSION_GOALS, ...HOUSING_SESSION_GOALS];
  const g = goals.find((x) => x.key === key);
  let justCompletedGoal = false;
  if (g) {
    const before = Math.min(g.target, Number(session[key]) || 0);
    const after = Math.min(g.target, next[key]);
    justCompletedGoal = before < g.target && after >= g.target;
  }
  return {
    session: next,
    justCompletedGoal,
    rewardLabel: rewardLabel || (justCompletedGoal ? `${g?.label || key} ✓` : null),
  };
}
