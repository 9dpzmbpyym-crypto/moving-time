/* Pack It Up progress — one localStorage key, versioned so schema
   bumps can wipe or migrate. Audio volumes live in gameAudio.js
   (`pack-it-up-audio`); this file is packing / coins / tasks / room. */

import { REMOVED_TASK_IDS } from "./tasks.js";

const SAVE_KEY = "pack-it-up-save";
export const SAVE_VERSION = 2;

/** After Reset save, block writeSave so the unmount/pagehide flush cannot
 *  resurrect the wiped progress before reload finishes. */
let saveSuspended = false;

const EMPTY_FLAGS = { packed: false, sold: false, soldFor: 0, donated: false };

function sanitizeFlags(raw) {
  if (!raw || typeof raw !== "object") return { ...EMPTY_FLAGS };
  return {
    packed: !!raw.packed,
    sold: !!raw.sold,
    soldFor: Math.max(0, Number(raw.soldFor) || 0),
    donated: !!raw.donated,
  };
}

export function migrateSave(data) {
  if (!data || typeof data !== "object") return null;
  const sourceVersion = Number(data.v) || 1;
  if (sourceVersion > SAVE_VERSION) return null;
  return {
    ...data,
    v: SAVE_VERSION,
    objState: data.objState && typeof data.objState === "object" ? data.objState : {},
    contentsState: data.contentsState && typeof data.contentsState === "object" ? data.contentsState : {},
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    appointments: Array.isArray(data.appointments) ? data.appointments : [],
  };
}

/** Read and migrate the save. A schema bump must never wipe phone progress. */
export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
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
      objState: partial.objState || {},
      contentsState: partial.contentsState || {},
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
    return initial.filter((t) => !REMOVED_TASK_IDS.has(t.id));
  }
  const byId = Object.fromEntries(
    savedTasks.filter((t) => t && t.id && !REMOVED_TASK_IDS.has(t.id)).map((t) => [t.id, t])
  );
  const ok = new Set(["pending", "active", "done", "dismissed", "archived"]);
  const initialIds = new Set(initial.map((t) => t.id));
  const merged = initial
    .filter((t) => !REMOVED_TASK_IDS.has(t.id))
    .map((t) => {
    const s = byId[t.id];
    if (!s || !ok.has(s.status)) return t;
    const urgency = typeof s.urgency === "number" ? Math.min(3, Math.max(1, s.urgency)) : t.urgency;
    const effort = typeof s.effort === "number" ? Math.min(3, Math.max(1, s.effort)) : t.effort;
    const category = typeof s.category === "string" && s.category ? s.category : t.category;
    return {
      ...t,
      status: s.status,
      urgency,
      effort,
      needsInfo: !!s.needsInfo,
      title: typeof s.title === "string" && s.title.trim() ? s.title.trim() : t.title,
      due: t.selfTarget ? t.due : (typeof s.due === "string" ? s.due : t.due),
      dueDate: s.dueDate !== undefined ? s.dueDate : t.dueDate,
      dueEnd: s.dueEnd !== undefined ? s.dueEnd : t.dueEnd,
      category,
      kind: s.kind || t.kind || null,
      bookTaskId: s.bookTaskId || t.bookTaskId || null,
      score: typeof s.score === "number" ? s.score : t.score,
      jobId: s.jobId !== undefined && s.jobId !== null ? s.jobId : t.jobId,
      selfTarget: !!t.selfTarget,
    };
  });
  for (const s of savedTasks) {
    if (!s?.id || REMOVED_TASK_IDS.has(s.id) || initialIds.has(s.id) || !ok.has(s.status)) continue;
    merged.push({
      id: s.id,
      title: String(s.title || "Untitled").trim() || "Untitled",
      category: s.category || "admin",
      effort: Math.min(3, Math.max(1, Number(s.effort) || 1)),
      urgency: Math.min(3, Math.max(1, Number(s.urgency) || 1)),
      due: typeof s.due === "string" ? s.due : "",
      dueDate: s.dueDate ?? null,
      dueEnd: s.dueEnd ?? null,
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
    });
  }
  return merged;
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
