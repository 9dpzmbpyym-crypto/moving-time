/* OpenRouter multi-turn for Shirley. Optional — bank path works without a key.
   Settings live in localStorage (`pack-it-up-shirley`). */

import {
  SHIRLEY_SYSTEM_PROMPT,
  factsBlock,
  bookAppointment,
  todayISO,
  daysUntilMove,
} from "./receptionist.js";

const SETTINGS_KEY = "pack-it-up-shirley";
/** Auto-picks any free model that isn't currently rate-limited. */
export const DEFAULT_MODEL = "openrouter/free";
/** Free models are slow / flaky — give them room, then try short backups.
 *  Reasoning free models burn tokens on thinking; keep headroom. */
const TIMEOUT_MS = 25000;
const MAX_TOKENS = 220;
const TEMPERATURE = 0.6;
/**
 * On 429/404/502/503, try different provider families.
 * Prefer short chat models (not giant reasoning) so replies aren't empty.
 * Verified against /api/v1/models (pricing 0) on 2026-07-14.
 */
const RATE_LIMIT_FALLBACKS = [
  "meta-llama/llama-3.2-3b-instruct:free",
  "openai/gpt-oss-20b:free",
  "google/gemma-4-31b-it:free",
  "qwen/qwen3-coder:free",
];
const MAX_MODEL_ATTEMPTS = 4;
/** Slugs we used to ship that are dead, paid-only, or permanently congested. */
const STALE_DEFAULTS = new Set([
  "deepseek/deepseek-chat-v3.1:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "google/gemma-2-9b-it:free",
  "nvidia/nemotron-nano-9b-v2:free",
]);

/** Strip paste junk (ZWSP, smart quotes, BOM) — OpenRouter keys are ASCII. */
export function sanitizeApiKey(key) {
  return String(key || "").replace(/[^\x20-\x7E]/g, "").trim();
}

/** Last-4 fingerprint so Settings can confirm what localStorage actually holds. */
export function keyFingerprint(key) {
  const k = sanitizeApiKey(key);
  if (!k) return "";
  return k.length <= 4 ? "····" : `…${k.slice(-4)}`;
}

/**
 * Turn raw askShirley failures into short actionable labels for the phone UI.
 * OpenRouter's 401 body is often the cryptic "User not found" (invalid OR expired).
 */
export function formatShirleyLineError(error, detail) {
  const raw = detail ? `${error || ""} — ${String(detail)}` : String(error || "failed");
  if (/http_401|user not found/i.test(raw)) {
    return "key rejected (bad/expired/revoked) — Clear key, paste a new one from openrouter.ai/keys, Test key";
  }
  if (/http_402/i.test(raw)) {
    return "OpenRouter needs credits — add a little balance (free models often still need this)";
  }
  if (/unavailable for free|no longer free|paid version is available/i.test(raw)) {
    return "that free slug retired — set model to openrouter/free in Settings (or pick a current :free model)";
  }
  if (/http_404|no endpoints|no allowed providers/i.test(raw)) {
    return "free model blocked/gone — enable free endpoints in openrouter.ai/settings/privacy, or set openrouter/free";
  }
  if (/http_429|rate.?limit|too many requests/i.test(raw)) {
    return "free model busy (429) — wait ~1 min, or set model to openrouter/free in Settings";
  }
  if (error === "timeout" || /abort/i.test(raw)) {
    return "timed out — free models are slow; try again or set openrouter/free";
  }
  if (/http_502|http_503/i.test(raw)) {
    return "model unavailable — try openrouter/free in Settings";
  }
  if (error === "bad_model") {
    return detail ? String(detail).slice(0, 100) : "bad model slug in Settings";
  }
  if (error === "disabled") return "improv off — turn on in Settings";
  if (error === "empty") return "empty model reply — try again";
  return raw.slice(0, 120);
}

/** OpenRouter slugs look like `vendor/model[:variant]`. */
export function isPlausibleModelSlug(model) {
  return typeof model === "string" && /^[a-z0-9._-]+\/[a-z0-9._/:_-]+$/i.test(model.trim());
}

function buildModelAttempts(primary) {
  const out = [];
  const push = (slug) => {
    const s = (slug || "").trim();
    if (!s || !isPlausibleModelSlug(s) || out.includes(s)) return;
    if (out.length < MAX_MODEL_ATTEMPTS) out.push(s);
  };
  push(primary);
  // Prefer the free router next — it skips providers that are currently 429ing.
  if (primary !== DEFAULT_MODEL) push(DEFAULT_MODEL);
  for (const slug of RATE_LIMIT_FALLBACKS) push(slug);
  return out;
}

export function loadShirleySettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { apiKey: "", model: DEFAULT_MODEL, improv: false };
    const p = JSON.parse(raw);
    const apiKey = sanitizeApiKey(typeof p.apiKey === "string" ? p.apiKey : "");
    const hasKey = !!apiKey;
    // Explicit opt-out only. Old builds saved improv:false whenever the
    // toggle wasn't flipped — treat that as "on" if a key exists.
    const improvOff = p.improvOff === true;
    const improv = hasKey && !improvOff;
    let model = typeof p.model === "string" && p.model ? p.model : DEFAULT_MODEL;
    const staleModel = STALE_DEFAULTS.has(model);
    const needsImprovMigrate = hasKey && p.improv === false && !improvOff;
    if (hasKey && (needsImprovMigrate || staleModel)) {
      if (staleModel) model = DEFAULT_MODEL;
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
          apiKey,
          model,
          improv: true,
          improvOff: false,
        }));
      } catch {}
      return { apiKey, model, improv: true };
    }
    return { apiKey, model, improv };
  } catch {
    return { apiKey: "", model: DEFAULT_MODEL, improv: false };
  }
}

export function saveShirleySettings(partial) {
  const cur = loadShirleySettings();
  // Never clobber a saved key/model with "" from blur / stale React state / autofill.
  // Explicit clear: pass clearApiKey: true (Settings "Clear key" button).
  let apiKey = partial.apiKey != null ? sanitizeApiKey(partial.apiKey) : cur.apiKey;
  if (
    partial.apiKey != null &&
    !sanitizeApiKey(partial.apiKey) &&
    cur.apiKey.trim() &&
    !partial.clearApiKey
  ) {
    apiKey = cur.apiKey;
  }
  let model = partial.model != null ? String(partial.model) : cur.model;
  if (partial.model != null && !String(partial.model).trim() && cur.model.trim()) {
    model = cur.model;
  }
  if (!String(model || "").trim()) model = DEFAULT_MODEL;
  const next = {
    apiKey,
    model,
    improv: partial.improv != null ? !!partial.improv : cur.improv,
    improvOff: false,
  };
  if (!next.apiKey.trim()) {
    next.improv = false;
    next.improvOff = false;
  } else if (partial.improv === false) {
    next.improvOff = true;
    next.improv = false;
  } else if (partial.apiKey != null || partial.improv === true) {
    next.improv = true;
    next.improvOff = false;
  }
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {}
  return { apiKey: next.apiKey, model: next.model, improv: next.improv };
}

export function improvEnabled() {
  const s = loadShirleySettings();
  return !!(s.improv && s.apiKey.trim());
}

/** Strip and parse trailing BOOK:{...} from model text. */
export function parseBookTag(text) {
  if (!text || typeof text !== "string") return { display: "", book: null };
  const re = /BOOK:\s*(\{[\s\S]*?\})\s*$/m;
  const m = text.match(re);
  if (!m) return { display: text.trim(), book: null };
  const display = text.replace(re, "").trim();
  try {
    const book = JSON.parse(m[1]);
    if (!book || typeof book !== "object") return { display, book: null };
    return {
      display,
      book: {
        taskId: book.taskId || null,
        zone: book.zone || null,
        dueAt: book.dueAt || null,
        time: book.time || null,
      },
    };
  } catch {
    return { display, book: null };
  }
}

async function fetchWithTimeout(url, opts, ms) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

/** Pull assistant text from messy OpenRouter payloads (parts / reasoning empties). */
function extractAssistantText(data) {
  const choice = data?.choices?.[0];
  const msg = choice?.message || {};
  const fromParts = (val) => {
    if (typeof val === "string") return val;
    if (Array.isArray(val)) {
      return val
        .map((p) => (typeof p === "string" ? p : p?.text || p?.content || ""))
        .join("");
    }
    return "";
  };
  let text = fromParts(msg.content);
  if (!String(text).trim()) text = fromParts(choice?.text);
  if (!String(text).trim()) text = fromParts(msg.reasoning) || fromParts(msg.reasoning_content);
  return String(text || "").trim();
}

async function callOpenRouterOnce({ apiKey, model, messages, timeoutMs }) {
  const safeApiKey = sanitizeApiKey(apiKey);
  const res = await fetchWithTimeout(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${safeApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://localhost",
        "X-Title": "Pack It Up - Shirley",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
      }),
    },
    timeoutMs
  );
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.text()).slice(0, 200); } catch {}
    const err = new Error(`http_${res.status}`);
    err.detail = detail;
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const raw = extractAssistantText(data);
  if (!raw.trim()) {
    const err = new Error("empty");
    throw err;
  }
  return raw;
}

/**
 * Ask Shirley via OpenRouter. Returns { ok, text, book, error, detail?, model? }.
 * Tries the configured model, then other free providers on 429/5xx (capped).
 */
export async function askShirley({
  messages,
  tasks,
  appointments,
  timeoutMs = TIMEOUT_MS,
}) {
  const settings = loadShirleySettings();
  if (!settings.improv || !settings.apiKey.trim()) {
    return { ok: false, text: "", book: null, error: "disabled" };
  }

  const primary = (settings.model || DEFAULT_MODEL).trim();
  if (!isPlausibleModelSlug(primary)) {
    console.warn("[Shirley] bad model slug:", primary);
    return {
      ok: false,
      text: "",
      book: null,
      error: "bad_model",
      detail: `Unknown model slug: ${primary || "(empty)"}`,
    };
  }

  const facts = factsBlock({
    tasks,
    appointments,
    today: todayISO(),
    daysLeft: daysUntilMove(),
  });

  const system = `${SHIRLEY_SYSTEM_PROMPT}\n\nFACTS (authoritative, do not invent beyond these):\n${JSON.stringify(facts)}`;

  const chatMessages = [
    { role: "system", content: system },
    ...(messages || []).map((m) => ({
      role: m.role === "shirley" || m.role === "assistant" ? "assistant" : "user",
      content: m.text || m.content || "",
    })),
  ];

  const models = buildModelAttempts(primary);

  let lastError = "network";
  let lastDetail = "";
  for (const model of models) {
    try {
      const raw = await callOpenRouterOnce({
        apiKey: settings.apiKey,
        model,
        messages: chatMessages,
        timeoutMs,
      });
      const { display, book } = parseBookTag(raw);
      if (model !== primary) {
        console.info("[Shirley] used fallback model:", model);
      }
      return { ok: true, text: display || raw.trim(), book, error: null, model };
    } catch (e) {
      lastError = e?.name === "AbortError" ? "timeout" : (e?.message || "network");
      lastDetail = e?.detail || "";
      console.warn("[Shirley] model failed:", model, lastError, lastDetail);
      // Auth / billing — don't burn the rest of the free pool
      if (e?.status === 401 || e?.status === 402 || e?.status === 403) break;
      // 404/429/502/503/timeout → try next provider family (retired :free slugs 404)
    }
  }
  return { ok: false, text: "", book: null, error: lastError, detail: lastDetail || undefined };
}

/** Apply a BOOK payload through the FSM; returns bookAppointment result or null. */
export function applyBookPayload(appointments, tasks, book) {
  if (!book || !book.taskId || !book.dueAt) return null;
  return bookAppointment(appointments, tasks, {
    taskId: book.taskId,
    dueAt: book.dueAt,
    time: book.time || null,
  });
}
