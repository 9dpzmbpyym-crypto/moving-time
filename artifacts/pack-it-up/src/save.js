/* Pack It Up progress — one localStorage key, versioned so schema
   bumps can wipe or migrate. Audio volumes live in gameAudio.js
   (`pack-it-up-audio`); this file is packing / coins / tasks / room. */

import { REMOVED_TASK_IDS, FORCE_TASK_CATEGORY, scheduleDatesForLedger } from "./tasks.js";
import { normalizeTask } from "./schedule.js";

const SAVE_KEY = "pack-it-up-save";
const SAVE_BACKUP_KEY = "pack-it-up-save-pre-migration";
export const SAVE_VERSION = 4;

/** After Reset save, block writeSave so the unmount/pagehide flush cannot
 *  resurrect the wiped progress before reload finishes. */
let saveSuspended = false;

/** Freeze all future writes until reload. Used before importing a save so the
 *  still-running app's autosave / pagehide flush cannot clobber what we just
 *  wrote to localStorage. Irreversible for the session (caller reloads). */
export function suspendSaves() {
  saveSuspended = true;
}

const EMPTY_FLAGS = { packed: false, sold: false, soldFor: 0, donated: false, buyerFound: false };

function sanitizeFlags(raw) {
  if (!raw || typeof raw !== "object") return { ...EMPTY_FLAGS };
  return {
    packed: !!raw.packed,
    sold: !!raw.sold,
    soldFor: Math.max(0, Number(raw.soldFor) || 0),
    donated: !!raw.donated,
    buyerFound: !!raw.buyerFound,
  };
}

export function migrateSave(data) {
  if (!data || typeof data !== "object") return null;
  const sourceVersion = Number(data.v) || 1;
  if (sourceVersion > SAVE_VERSION) return null;
  const tasks = Array.isArray(data.tasks)
    ? data.tasks.map((t) => (t && t.id ? normalizeTask(t) : t))
    : [];
  return {
    ...data,
    v: SAVE_VERSION,
    objState: data.objState && typeof data.objState === "object" ? data.objState : {},
    contentsState: data.contentsState && typeof data.contentsState === "object" ? data.contentsState : {},
    tasks,
    appointments: Array.isArray(data.appointments) ? data.appointments : [],
  };
}

/** Read and migrate the save. A schema bump must never wipe phone progress. */
export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const sourceVersion = Number(parsed?.v) || 1;
    if (sourceVersion < SAVE_VERSION) {
      try {
        // One-shot backup before rewriting a newer schema
        if (!localStorage.getItem(SAVE_BACKUP_KEY)) {
          localStorage.setItem(SAVE_BACKUP_KEY, raw);
        }
      } catch {}
    }
    const data = migrateSave(parsed);
    if (!data) return null;
    if (data.v !== parsed.v) {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
    }
    return data;
  } catch {
    return null;
  }
}

export function clearSave() {
  saveSuspended = true;
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {}
}

/** Persist progress. Safe to call often (caller should debounce). */
export function writeSave(partial) {
  if (saveSuspended) return;
  try {
    const payload = {
      v: SAVE_VERSION,
      savedAt: Date.now(),
      // Persist only touched flags — load re-expands via mergeFlagMap defaults.
      objState: pruneFlagMap(partial.objState),
      contentsState: pruneFlagMap(partial.contentsState),
      coins: Math.max(0, Number(partial.coins) || 0),
      minutes: Math.max(0, Number(partial.minutes) || 0),
      tasks: Array.isArray(partial.tasks) ? partial.tasks : [],
      roomIndex: Math.max(0, Number(partial.roomIndex) || 0),
      session: partial.session && typeof partial.session === "object" ? partial.session : undefined,
      appointments: Array.isArray(partial.appointments) ? partial.appointments : [],
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch {
    // Quota / private mode — game still runs, just won't persist.
  }
}

/** Overlay saved flags onto fresh defaults (new furniture keeps empty flags). */
export function mergeFlagMap(defaults, saved) {
  if (!saved || typeof saved !== "object") return defaults;
  const out = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (saved[key]) out[key] = sanitizeFlags(saved[key]);
  }
  return out;
}

/**
 * Keep task definitions from code; restore editable fields + status from save.
 * New INITIAL_TASKS appear; user/quick-add/attend cards (ids not in initial) are kept.
 */
export function mergeTasks(initial, savedTasks) {
  if (!Array.isArray(savedTasks) || savedTasks.length === 0) {
    return initial.filter((t) => !REMOVED_TASK_IDS.has(t.id)).map(normalizeTask);
  }
  const byId = Object.fromEntries(
    savedTasks.filter((t) => t && t.id && !REMOVED_TASK_IDS.has(t.id)).map((t) => [t.id, t])
  );
  // Once a device has a task ledger, that saved membership is canonical. New
  // source defaults must not silently repopulate a list the player curated.
  const savedIds = new Set(Object.keys(byId));
  const ok = new Set(["pending", "active", "done", "dismissed", "archived"]);
  const initialIds = new Set(initial.map((t) => t.id));
  const merged = initial
    .filter((t) => !REMOVED_TASK_IDS.has(t.id) && savedIds.has(t.id))
    .map((t) => {
    const s = byId[t.id];
    if (!s || !ok.has(s.status)) return normalizeTask(t);
    const urgency = typeof s.urgency === "number" ? Math.min(3, Math.max(1, s.urgency)) : t.urgency;
    const effort = typeof s.effort === "number" ? Math.min(3, Math.max(1, s.effort)) : t.effort;
    const category = FORCE_TASK_CATEGORY[t.id]
      || (typeof s.category === "string" && s.category ? s.category : t.category);
    const savedDueDate = typeof s.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.dueDate)
      ? s.dueDate
      : null;
    // Ledger dueDate is the mobile player's edited date and therefore wins
    // over stale source target/latest fields. Never allow a deadline window
    // or availability gate to end after/before it nonsensically.
    const scheduled = savedDueDate && !s.scheduleOverride
      ? scheduleDatesForLedger({ ...t, ...s, category, selfTarget: !!(s.selfTarget ?? t.selfTarget) }, savedDueDate)
      : {
        targetDate: s.targetDate || t.targetDate || t.dueDate || null,
        latestDate: s.latestDate || s.dueEnd || t.latestDate || t.dueEnd || null,
        dueEnd: s.dueEnd || t.dueEnd || null,
      };
    const { targetDate, latestDate } = scheduled;
    const rawAvailable = s.availableFrom !== undefined ? s.availableFrom : t.availableFrom;
    const availableFrom = targetDate && rawAvailable && rawAvailable > targetDate ? targetDate : rawAvailable;
    return normalizeTask({
      ...t,
      status: s.status,
      urgency,
      effort,
      needsInfo: !!s.needsInfo,
      title: t.jobId
        ? t.title
        : (typeof s.title === "string" && s.title.trim() ? s.title.trim() : t.title),
      due: t.selfTarget ? t.due : (typeof s.due === "string" ? s.due : t.due),
      dueDate: savedDueDate || (s.dueDate !== undefined ? s.dueDate : t.dueDate),
      dueEnd: scheduled.dueEnd,
      targetDate,
      latestDate,
      exactDate: (s.exactDate || t.exactDate) && savedDueDate
        ? savedDueDate
        : (s.exactDate !== undefined ? s.exactDate : t.exactDate),
      availableFrom,
      criticality: s.criticality !== undefined ? s.criticality : t.criticality,
      category,
      kind: s.kind || t.kind || null,
      zone: s.zone !== undefined ? s.zone : (t.zone || null),
      room: s.room !== undefined ? s.room : (t.room || null),
      objectId: s.objectId !== undefined ? s.objectId : (t.objectId || null),
      completionMode: s.completionMode || t.completionMode || "manual",
      bookTaskId: s.bookTaskId || t.bookTaskId || null,
      score: typeof s.score === "number" ? s.score : t.score,
      jobId: s.jobId !== undefined && s.jobId !== null ? s.jobId : t.jobId,
      selfTarget: s.selfTarget !== undefined ? !!s.selfTarget : !!t.selfTarget,
      estimatedLatest: s.estimatedLatest !== undefined ? !!s.estimatedLatest : !!t.estimatedLatest,
      // Canonical mixed packing bindings supersede the older single-kind
      // bindings saved before environment + contents could be selected together.
      binding: t.binding?.feature === "packing_requirement" && s.binding?.feature !== "packing_requirement"
        ? t.binding
        : (s.binding || t.binding || null),
      scheduleOverride: !!s.scheduleOverride,
    });
  });
  for (const s of savedTasks) {
    if (!s?.id || REMOVED_TASK_IDS.has(s.id) || initialIds.has(s.id) || !ok.has(s.status)) continue;
    merged.push(normalizeTask({
      id: s.id,
      title: String(s.title || "Untitled").trim() || "Untitled",
      category: s.category || "admin",
      effort: Math.min(3, Math.max(1, Number(s.effort) || 1)),
      urgency: Math.min(3, Math.max(1, Number(s.urgency) || 1)),
      due: typeof s.due === "string" ? s.due : "",
      dueDate: s.dueDate ?? null,
      dueEnd: s.dueEnd ?? null,
      targetDate: s.targetDate ?? null,
      latestDate: s.latestDate ?? null,
      exactDate: s.exactDate ?? null,
      availableFrom: s.availableFrom ?? null,
      criticality: s.criticality ?? null,
      criticalPath: !!s.criticalPath,
      status: s.status,
      room: s.room ?? null,
      objectId: s.objectId ?? null,
      relief: s.relief || "stamp",
      jobId: s.jobId ?? null,
      zone: s.zone ?? null,
      needsInfo: !!s.needsInfo,
      kind: s.kind || null,
      bookTaskId: s.bookTaskId || null,
      score: typeof s.score === "number" ? s.score : null,
      selfTarget: !!s.selfTarget,
      estimatedLatest: !!s.estimatedLatest,
      binding: s.binding || null,
      scheduleOverride: !!s.scheduleOverride,
    }));
  }
  return merged;
}

/**
 * Drop all-default (untouched) flag entries before persisting. Load rebuilds the
 * full map with mergeFlagMap(defaults, saved) — every object/item key exists in
 * the code-side defaults — so an absent entry restores as EMPTY_FLAGS. Her save
 * carried a flag object for every object AND every inventory item (~400, ~90%
 * all-false); this keeps only the ones she actually touched.
 */
export function pruneFlagMap(map) {
  if (!map || typeof map !== "object") return {};
  const out = {};
  for (const [key, v] of Object.entries(map)) {
    if (v && typeof v === "object" &&
        (v.packed || v.sold || v.donated || v.buyerFound || (Number(v.soldFor) || 0) > 0)) {
      out[key] = sanitizeFlags(v);
    }
  }
  return out;
}

export function clampCoins(n) {
  return Math.max(0, Number(n) || 0);
}

export function clampMinutes(n) {
  return Math.max(0, Number(n) || 0);
}

export function clampRoomIndex(n, roomCount) {
  const i = Math.max(0, Number(n) || 0);
  if (!roomCount || roomCount < 1) return 0;
  return Math.min(i, roomCount - 1);
}
