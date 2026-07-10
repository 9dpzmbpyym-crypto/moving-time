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
    calmedZones: {}, // zoneId -> true (persists within the day)
  };
}

/** Restore session from save; roll to a fresh day if the date changed. */
export function mergeSession(savedSession) {
  const fresh = defaultSession();
  if (!savedSession || typeof savedSession !== "object") return fresh;
  if (savedSession.day !== fresh.day) return fresh;
  return {
    ...fresh,
    filed: Math.max(0, Number(savedSession.filed) || 0),
    stamped: Math.max(0, Number(savedSession.stamped) || 0),
    cleared: Math.max(0, Number(savedSession.cleared) || 0),
    care: Math.max(0, Number(savedSession.care) || 0),
    zones: Math.max(0, Number(savedSession.zones) || 0),
    appt: Math.max(0, Number(savedSession.appt) || 0),
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
  const goals = [...SESSION_GOALS, ...HEALTH_SESSION_GOALS];
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
