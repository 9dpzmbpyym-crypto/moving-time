/* Pack It Up progress — one localStorage key, versioned so schema
   bumps can wipe or migrate. Audio volumes live in gameAudio.js
   (`pack-it-up-audio`); this file is packing / coins / tasks / room. */

const SAVE_KEY = "pack-it-up-save";
export const SAVE_VERSION = 1;

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

/** Read raw save or null if missing / bad / wrong version. */
export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    if (data.v !== SAVE_VERSION) {
      // Schema bump: wipe so we never half-apply an old shape.
      clearSave();
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {}
}

/** Persist progress. Safe to call often (caller should debounce). */
export function writeSave(partial) {
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
 * Keep task definitions from code; restore status + needsInfo from save.
 * New tasks in INITIAL_TASKS appear; removed ids are dropped.
 */
export function mergeTasks(initial, savedTasks) {
  if (!Array.isArray(savedTasks) || savedTasks.length === 0) return initial;
  const byId = Object.fromEntries(
    savedTasks.filter((t) => t && t.id).map((t) => [t.id, t])
  );
  const ok = new Set(["pending", "active", "done", "dismissed"]);
  return initial.map((t) => {
    const s = byId[t.id];
    if (!s || !ok.has(s.status)) return t;
    const urgency = typeof s.urgency === "number" ? Math.min(3, Math.max(1, s.urgency)) : t.urgency;
    return {
      ...t,
      status: s.status,
      urgency,
      needsInfo: !!s.needsInfo,
    };
  });
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
