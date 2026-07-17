const DAY_MS = 24 * 60 * 60 * 1000;

export const MOVE_DATE = "2026-07-31";

export const PHASES = [
  { id: "pack-first", label: "Pack first", start: "2026-07-01", end: "2026-07-14" },
  { id: "mid-month", label: "Mid-month", start: "2026-07-15", end: "2026-07-24" },
  { id: "ubox-week", label: "U-Box week", start: "2026-07-25", end: "2026-07-26" },
  { id: "load-days", label: "Load days", start: "2026-07-27", end: "2026-07-29" },
  { id: "lock-night", label: "Lock night", start: "2026-07-30", end: "2026-07-30" },
  { id: "flight-day", label: "Flight day", start: "2026-07-31", end: "2026-07-31" },
  { id: "arrived", label: "Arrived", start: "2026-08-01", end: null },
];

export const DATE_TRIGGERS = [
  // `anchor` + `short` mark the four milestones the calendar's Critical Path
  // footer pins. Everything else on the grid is derived from live task due
  // dates, so this table stays the single source of truth for the move spine.
  { id: "sublet-lock", date: "2026-07-15", label: "Lock the Aug 1 sublet", critical: true, lane: "housing", anchor: true, short: "Sublet Lock" },
  { id: "vet-window", date: "2026-07-22", end: "2026-07-25", label: "Stretchy vet window", critical: true, lane: "cat", anchor: true, short: "Vet Visit" },
  { id: "ubox-arrives", date: "2026-07-27", label: "U-Box arrives", critical: true, lane: "move", anchor: true, short: "U-Box Day" },
  { id: "main-load", date: "2026-07-28", end: "2026-07-29", label: "Main loading days", critical: true, lane: "move" },
  { id: "lock-box", date: "2026-07-30", label: "Lock the U-Box tonight", critical: true, lane: "move" },
  { id: "flight", date: "2026-07-31", label: "Flight day — sweep, do not pack", critical: true, lane: "move", anchor: true, short: "Flight Day" },
];

// Order used to pick the one lane icon a busy day shows, most move-critical
// first. Mirrors TASK_CATEGORIES ids so a task's `category` doubles as its lane.
export const CALENDAR_LANES = ["move", "housing", "cat", "health", "job", "admin"];

// Move-spine milestones. Each is pinned to a real task by id, so its calendar
// date is whatever date that task carries — edit the task and the milestone
// moves with it. `key` maps to a glyph PNG in Screens.jsx. A milestone whose
// task is missing or undated simply doesn't render (e.g. vision until you add a
// vision appointment). Remapping a milestone to a different task is a one-line
// edit here. Order is the pre-sort tiebreaker for the Critical Path list.
export const MILESTONES = [
  // Health milestones match by health `zone` (stable across task edits) and take
  // the latest-dated open task in that zone — the appointment day, not the
  // earlier "book it" task. Move/housing milestones pin to a task id.
  { key: "obgyn", zone: "obgyn", label: "OB/GYN" },
  { key: "vision", zone: "custom:Vision", label: "Vision" },
  { key: "dentist", zone: "teeth", label: "Dentist" },
  { key: "derm", zone: "skin", label: "Dermatology" },
  { key: "vet", taskId: "c_vet_attend", label: "Vet Visit" },
  { key: "walkthrough", taskId: "h_walkthrough", label: "Walkthrough" },
  { key: "ubox", taskId: "m_load1", label: "U-Box Day" },
  { key: "laptop", taskId: "w_work_return", label: "Work Return" },
  { key: "suitcase", taskId: "m_plane_bags", label: "Finish Packing" },
  { key: "lock", taskId: "m_lock_final", label: "Lock U-Box" },
  { key: "wifi", taskId: "w_wifi_return", label: "Wi-Fi Return" },
  { key: "flight", taskId: "w_flight", label: "Flight" },
];

export function dateKey(value = new Date()) {
  if (typeof value === "string") return value.slice(0, 10);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayNumber(value) {
  const key = dateKey(value);
  if (!key) return null;
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / DAY_MS;
}

export function daysUntil(date, from = new Date()) {
  if (date == null || date === "") return null;
  const target = dayNumber(date);
  const start = dayNumber(from);
  return target == null || start == null ? null : target - start;
}

export function currentPhase(date = new Date()) {
  const key = dateKey(date);
  if (!key) return PHASES[0];
  return PHASES.find((phase) => key >= phase.start && (!phase.end || key <= phase.end)) || PHASES[0];
}

export function dueTriggers(date = new Date(), windowDays = 2) {
  return DATE_TRIGGERS.filter((trigger) => {
    const delta = daysUntil(trigger.date, date);
    const endDelta = daysUntil(trigger.end || trigger.date, date);
    return delta != null && endDelta != null && delta <= windowDays && endDelta >= 0;
  });
}

export function taskDueDelta(task, date = new Date()) {
  return task?.dueDate ? daysUntil(task.dueDate, date) : null;
}

export function isDueSoon(task, date = new Date(), windowDays = 2) {
  const start = taskDueDelta(task, date);
  if (start == null) return false;
  const end = task?.dueEnd ? daysUntil(task.dueEnd, date) : start;
  return start <= windowDays && end >= 0;
}

export function isOverdue(task, date = new Date()) {
  const end = daysUntil(task?.dueEnd || task?.dueDate, date);
  return end != null && end < 0;
}

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_LABELS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
const laneRank = (lane) => {
  const i = CALENDAR_LANES.indexOf(lane);
  return i === -1 ? CALENDAR_LANES.length : i;
};

/**
 * Pure data model for the kitchen wall calendar. Never touches art or React —
 * Screens.jsx maps the lane ids returned here to icon PNGs. The grid weekday
 * layout is computed from the real month (not the mockup), and every inked day
 * is derived from live task due dates + the DATE_TRIGGERS spine, so the
 * calendar can never drift from the ledger.
 *
 * Each in-month cell: { day, key, inMonth, lane, isToday, isPast, isCritical,
 * count, labels[] }. `lane` is the single icon a busy day shows (most
 * move-critical of everything due that day), or null when nothing is scheduled.
 */
export function buildJulyCalendar({ tasks = [], today = new Date(), year = 2026, month = 7 } = {}) {
  const monthIndex = month - 1;
  const todayKey = dateKey(today);
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const pad = (n) => String(n).padStart(2, "0");
  const keyFor = (d) => `${year}-${pad(month)}-${pad(d)}`;

  // day number -> { best:{lane,score}, critical:bool, labels:[] }. The single
  // icon a day shows is the highest-scoring thing due that day: spine triggers
  // (the defining move anchors) outrank tasks, criticalPath outranks plain
  // criticality, and lane rank only breaks exact ties.
  const marks = new Map();
  const noteFor = (d) => {
    const key = keyFor(d);
    let m = marks.get(key);
    if (!m) { m = { best: null, lanes: new Set(), critical: false, labels: [], milestones: [] }; marks.set(key, m); }
    return m;
  };
  const consider = (d, lane, score, isCritical, label) => {
    const m = noteFor(d);
    m.lanes.add(lane);
    if (!m.best || score > m.best.score
      || (score === m.best.score && laneRank(lane) < laneRank(m.best.lane))) {
      m.best = { lane, score };
    }
    if (isCritical) m.critical = true;
    if (label) m.labels.push(label);
  };
  for (const t of tasks) {
    const due = t?.dueDate;
    if (!due || due.slice(0, 7) !== `${year}-${pad(month)}`) continue;
    const crit = t.criticality || 0;
    const score = (t.criticalPath ? 100 : 0) + crit * 10;
    consider(Number(due.slice(8, 10)), t.category || "admin", score, t.criticalPath || crit >= 3, t.title);
  }
  for (const tr of DATE_TRIGGERS) {
    if (!tr.date || tr.date.slice(0, 7) !== `${year}-${pad(month)}`) continue;
    consider(Number(tr.date.slice(8, 10)), tr.lane, 1000 + (tr.critical ? 100 : 0), !!tr.critical, tr.label);
  }

  // Milestones follow their pinned task's live date. A day can carry more than
  // one (flight day also has the Wi-Fi return, etc.).
  const byId = {};
  for (const t of tasks) if (t?.id) byId[t.id] = t;
  const monthPrefix = `${year}-${pad(month)}`;
  const resolveMilestoneTask = (ms) => {
    if (ms.zone) {
      // latest-dated open task in the zone = the appointment, not "book it"
      return (tasks || [])
        .filter((t) => t?.zone === ms.zone && t?.dueDate)
        .sort((a, b) => (a.dueDate < b.dueDate ? 1 : a.dueDate > b.dueDate ? -1 : 0))[0];
    }
    return byId[ms.taskId];
  };
  const milestoneList = [];
  for (const ms of MILESTONES) {
    const due = resolveMilestoneTask(ms)?.dueDate;
    if (!due || due.slice(0, 7) !== monthPrefix) continue;
    const day = Number(due.slice(8, 10));
    noteFor(day).milestones.push(ms.key);
    milestoneList.push({ key: ms.key, day, date: due, label: ms.label });
  }
  milestoneList.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const cellFor = (d, inMonth) => {
    if (!inMonth) return { day: d, key: null, inMonth: false, lane: null, lanes: [], milestones: [], isToday: false, isPast: false, isCritical: false, count: 0, labels: [] };
    const key = keyFor(d);
    const m = marks.get(key);
    // The scored primary lane leads; every other distinct lane due that day
    // follows by move-criticality, so a cell can show every kind of work.
    const primary = m?.best?.lane || null;
    const rest = m ? [...m.lanes].filter((l) => l !== primary).sort((a, b) => laneRank(a) - laneRank(b)) : [];
    const lanes = primary ? [primary, ...rest] : rest;
    return {
      day: d, key, inMonth: true,
      lane: primary,
      lanes,
      milestones: m ? m.milestones : [],
      isToday: key === todayKey,
      isPast: todayKey != null && key < todayKey,
      isCritical: !!(m && m.critical),
      count: m ? m.labels.length : 0,
      labels: m ? m.labels : [],
    };
  };

  // Leading days from the previous month, then this month, padded to full weeks.
  const prevDays = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  const flat = [];
  for (let i = 0; i < firstWeekday; i++) flat.push(cellFor(prevDays - firstWeekday + 1 + i, false));
  for (let d = 1; d <= daysInMonth; d++) flat.push(cellFor(d, true));
  let next = 1;
  while (flat.length % 7 !== 0) flat.push(cellFor(next++, false));
  const weeks = [];
  for (let i = 0; i < flat.length; i += 7) weeks.push(flat.slice(i, i + 7));

  return {
    title: MONTH_LABELS[monthIndex],
    year,
    phaseLabel: currentPhase(today).label,
    weekdays: WEEKDAY_LABELS,
    weeks,
    milestones: milestoneList,
    todayKey,
  };
}

