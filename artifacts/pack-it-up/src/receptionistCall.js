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
export const DEFAULT_MODEL = "deepseek/deepseek-chat-v3.1:free";
/** Free models are slow / flaky — give them room, then try a backup. */
const TIMEOUT_MS = 25000;
const FALLBACK_MODELS = [
  "deepseek/deepseek-chat-v3.1:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-12b-it:free",
  "openrouter/free",
];

export function loadShirleySettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { apiKey: "", model: DEFAULT_MODEL, improv: false };
    const p = JSON.parse(raw);
    const apiKey = typeof p.apiKey === "string" ? p.apiKey : "";
    const hasKey = !!apiKey.trim();
    // Explicit opt-out only. Old builds saved improv:false whenever the
    // toggle wasn't flipped — treat that as "on" if a key exists.
    const improvOff = p.improvOff === true;
    const improv = hasKey && !improvOff;
    const model = typeof p.model === "string" && p.model ? p.model : DEFAULT_MODEL;
    // Migrate stale false + tiny default model once.
    if (hasKey && (p.improv === false || p.model === "meta-llama/llama-3.2-3b-instruct:free")) {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
          apiKey,
          model: p.model === "meta-llama/llama-3.2-3b-instruct:free" ? DEFAULT_MODEL : model,
          improv: true,
          improvOff: false,
        }));
      } catch {}
      return {
        apiKey,
        model: p.model === "meta-llama/llama-3.2-3b-instruct:free" ? DEFAULT_MODEL : model,
        improv: true,
      };
    }
    return { apiKey, model, improv };
  } catch {
    return { apiKey: "", model: DEFAULT_MODEL, improv: false };
  }
}

export function saveShirleySettings(partial) {
  const cur = loadShirleySettings();
  const next = {
    apiKey: partial.apiKey != null ? String(partial.apiKey) : cur.apiKey,
    model: partial.model != null ? String(partial.model) || DEFAULT_MODEL : cur.model,
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

async function callOpenRouterOnce({ apiKey, model, messages, timeoutMs }) {
  const res = await fetchWithTimeout(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://localhost",
        "X-Title": "Pack It Up — Shirley",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.95,
        max_tokens: 320,
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
  const raw = data?.choices?.[0]?.message?.content || "";
  if (!raw.trim()) {
    const err = new Error("empty");
    throw err;
  }
  return raw;
}

/**
 * Ask Shirley via OpenRouter. Returns { ok, text, book, error }.
 * Tries the configured model, then free fallbacks.
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

  const models = [];
  for (const m of [settings.model, ...FALLBACK_MODELS]) {
    if (m && !models.includes(m)) models.push(m);
  }

  let lastError = "network";
  for (const model of models) {
    try {
      const raw = await callOpenRouterOnce({
        apiKey: settings.apiKey.trim(),
        model,
        messages: chatMessages,
        timeoutMs,
      });
      const { display, book } = parseBookTag(raw);
      if (model !== settings.model) {
        console.info("[Shirley] used fallback model:", model);
      }
      return { ok: true, text: display || raw.trim(), book, error: null, model };
    } catch (e) {
      lastError = e?.name === "AbortError" ? "timeout" : (e?.message || "network");
      console.warn("[Shirley] model failed:", model, lastError, e?.detail || "");
      // Auth errors — don't burn through fallbacks
      if (e?.status === 401 || e?.status === 402 || e?.status === 403) break;
    }
  }
  return { ok: false, text: "", book: null, error: lastError };
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
