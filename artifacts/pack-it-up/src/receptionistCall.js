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
/** Small chat model — openrouter/free often picks thinky models that dump CoT into content. */
export const DEFAULT_MODEL = "meta-llama/llama-3.2-3b-instruct:free";
/** Per-attempt cap. Whole askShirley also has an overall budget so the phone never spins. */
const TIMEOUT_MS = 10000;
const OVERALL_BUDGET_MS = 14000;
/** Enough for 2 short sentences; not enough for a planning essay. */
const MAX_TOKENS = 120;
const TEMPERATURE = 0.55;
/**
 * On 429/404/502/503, try one other family then give up to script bank.
 * Verified against /api/v1/models (pricing 0) on 2026-07-14.
 */
const RATE_LIMIT_FALLBACKS = [
  "openai/gpt-oss-20b:free",
  "google/gemma-4-31b-it:free",
];
const MAX_MODEL_ATTEMPTS = 2;
/** Slugs we used to ship that are dead, paid-only, congested, or CoT-leaky for Shirley. */
const STALE_DEFAULTS = new Set([
  "openrouter/free",
  "deepseek/deepseek-chat-v3.1:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "google/gemma-3-27b-it:free",
  "google/gemma-2-9b-it:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "qwen/qwen3-coder:free",
  "meta-llama/llama-3.3-70b-instruct:free",
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
    return "that free slug retired — set model to meta-llama/llama-3.2-3b-instruct:free in Settings";
  }
  if (/http_404|no endpoints|no allowed providers/i.test(raw)) {
    return "free model blocked/gone — enable free endpoints in openrouter.ai/settings/privacy";
  }
  if (/http_429|rate.?limit|too many requests/i.test(raw)) {
    return "free model busy (429) — wait ~1 min or switch free model slug in Settings";
  }
  if (error === "timeout" || /abort/i.test(raw)) {
    return "timed out — free models are slow; try again";
  }
  if (/http_502|http_503/i.test(raw)) {
    return "model unavailable — try another free slug in Settings";
  }
  if (error === "bad_model") {
    return detail ? String(detail).slice(0, 100) : "bad model slug in Settings";
  }
  if (error === "disabled") return "improv off — turn on in Settings";
  if (error === "empty") return "model thought out loud — try again (or script bank)";
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

/** Pull assistant text from OpenRouter payloads. Never use reasoning fields
 *  as dialogue — that dumps chain-of-thought into the phone UI. */
function extractAssistantText(data) {
  const choice = data?.choices?.[0];
  const msg = choice?.message || {};
  const fromParts = (val) => {
    if (typeof val === "string") return val;
    if (Array.isArray(val)) {
      return val
        .map((p) => {
          if (typeof p === "string") return p;
          // Skip thinking/reasoning parts if the API tags them.
          if (p?.type && /reason|think/i.test(p.type)) return "";
          return p?.text || p?.content || "";
        })
        .join("");
    }
    return "";
  };
  let text = fromParts(msg.content);
  if (!String(text).trim()) text = fromParts(choice?.text);
  return String(text || "").trim();
}

/**
 * Free models often dump planning into `content`. Keep only in-character speech.
 * Returns "" when the reply is unusable so we fall through to the next model/bank.
 */
export function scrubShirleyReply(raw) {
  let text = String(raw || "").replace(/\r/g, "").trim();
  if (!text) return "";

  text = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<\/?thinking>/gi, "")
    .replace(/```[\s\S]*?```/g, "")
    .trim();

  // Planning / meta markers that must never reach the phone UI.
  const leak = /the player|let me craft|openhealth|taskid\b|priorityvisit|no em dashes|in.?character|something like that|i switch|i need to confirm|keep it short|never narrate|output rules|facts \(|named another|urgency\s*\d|zone\s*brain|dry,? irritated|reply body|machine line|so i (need|switch|should)|confirm which one|ask for (a )?date\/time|one to three sentences|no emoji|no markdown|draft options|what day and time did you book|sure,? we need\b/i;

  const looksLikeLeak =
    leak.test(text)
    || text.length > 280
    || (text.match(/\n/g) || []).length >= 2
    || /\b(taskId|openHealthTasks|priorityVisit)\b/.test(text);

  if (!looksLikeLeak) {
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    text = sentences.slice(0, 3).join(" ").trim().slice(0, 280);
    return isIncompleteShirleyLine(text) ? "" : text;
  }

  // Salvage last clean quoted Shirley line only.
  const quotes = [...text.matchAll(/"([^"]{12,220})"/g)].map((m) => m[1].trim());
  const goodQuote = [...quotes].reverse().find((q) => {
    if (!q || leak.test(q) || q.length > 220 || isIncompleteShirleyLine(q)) return false;
    if (/^(so |okay so |the player|i need|keep it|sure,? we)/i.test(q)) return false;
    return /[.!?]$/.test(q) || /^(hey|hi|cool|okay|pcp|stretchy|book|got it|locked|wrote|shirley|day|date)/i.test(q);
  });
  if (goodQuote) return goodQuote;

  const lines = text.split(/\n/).map((l) => l.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (line.length < 12 || line.length > 220 || leak.test(line) || isIncompleteShirleyLine(line)) continue;
    if (/^(the player|so |i |let |keep |never |ask |confirm |name the|switch|sure)/i.test(line)) continue;
    if (/[.!?]$/.test(line) || /^(hey|hi|cool|okay|pcp|stretchy|got it|locked|wrote|shirley)/i.test(line)) {
      return line;
    }
  }

  return "";
}

/** Truncated model output like "Sure, we need" — reject and use bank. */
function isIncompleteShirleyLine(text) {
  const t = String(text || "").trim();
  if (!t || t.length < 10) return true;
  if (/[,:;—\-]\s*$/.test(t)) return true;
  if (/\b(we need|i need|so i|let me|and|or|the|a|to|for)\s*$/i.test(t)) return true;
  // Short reply with no sentence end is almost always a cut-off.
  if (t.length < 48 && !/[.!?]"?\s*$/.test(t)) return true;
  return false;
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
        reasoning: { exclude: true },
        include_reasoning: false,
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
  const raw = scrubShirleyReply(extractAssistantText(data));
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
  const deadline = Date.now() + OVERALL_BUDGET_MS;

  let lastError = "network";
  let lastDetail = "";
  for (const model of models) {
    const left = deadline - Date.now();
    if (left < 1500) {
      lastError = "timeout";
      lastDetail = "overall budget";
      break;
    }
    try {
      const raw = await callOpenRouterOnce({
        apiKey: settings.apiKey,
        model,
        messages: chatMessages,
        timeoutMs: Math.min(timeoutMs, left),
      });
      const { display, book } = parseBookTag(raw);
      const text = scrubShirleyReply(display || raw);
      if (!text) {
        const err = new Error("empty");
        throw err;
      }
      if (model !== primary) {
        console.info("[Shirley] used fallback model:", model);
      }
      return { ok: true, text, book, error: null, model };
    } catch (e) {
      lastError = e?.name === "AbortError" ? "timeout" : (e?.message || "network");
      lastDetail = e?.detail || "";
      console.warn("[Shirley] model failed:", model, lastError, lastDetail);
      // Auth / billing — don't burn the rest of the free pool
      if (e?.status === 401 || e?.status === 402 || e?.status === 403) break;
      // 404/429/502/503/timeout/empty → try next (capped)
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
