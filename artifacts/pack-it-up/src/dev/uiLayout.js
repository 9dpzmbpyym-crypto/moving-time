import { useEffect, useState } from "react";

export const UI_LAYOUT_STORE_KEY = "packitup-ui-layout-v1";

export const UI_LAYOUT_DEFAULTS = {
  body: {
    zones: {
      brain: { x: 50, y: 5, size: 15 },
      teeth: { x: 50, y: 15.5, size: 15 },
      heart: { x: 50, y: 29, size: 19 },
      skin: { x: 20, y: 36, size: 19 },
      lymph: { x: 79, y: 36, size: 19 },
      obgyn: { x: 50, y: 56, size: 19 },
    },
    paper: { top: 64, bottom: 5, paddingTop: 6 },
  },
  apartment: {
    nav: { top: 64, bottom: 12 },
    clock: { left: 30, right: 8, top: 14, bottom: 18, timeY: 7, dateY: 0, daysY: 3, daysLeft: -18 },
    coins: { padLeft: 36, y: 2 },
    room: { padTop: 20, padLeft: 26, countGap: 3 },
    boxes: { padLeft: 23, y: 2 },
  },
  overview: {
    pressureTop: 17,
    tileLeft: 12,
    tileTop: 8,
    gapDvh: 0.7,
  },
};

const clone = (v) => JSON.parse(JSON.stringify(v));
const merge = (base, extra) => {
  if (!extra || typeof extra !== "object" || Array.isArray(extra)) return base;
  const out = { ...base };
  Object.keys(extra).forEach((key) => {
    out[key] = base[key] && typeof base[key] === "object" && !Array.isArray(base[key])
      ? merge(base[key], extra[key])
      : extra[key];
  });
  return out;
};

export function loadUiLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem(UI_LAYOUT_STORE_KEY) || "null");
    return merge(clone(UI_LAYOUT_DEFAULTS), saved);
  } catch {
    return clone(UI_LAYOUT_DEFAULTS);
  }
}

export function saveUiLayout(layout) {
  localStorage.setItem(UI_LAYOUT_STORE_KEY, JSON.stringify(layout));
  window.dispatchEvent(new CustomEvent("packitup-ui-layout", { detail: layout }));
}

export function resetUiLayout() {
  localStorage.removeItem(UI_LAYOUT_STORE_KEY);
  const layout = clone(UI_LAYOUT_DEFAULTS);
  window.dispatchEvent(new CustomEvent("packitup-ui-layout", { detail: layout }));
  return layout;
}

export function useUiLayout() {
  const isPreview = new URLSearchParams(window.location.search).has("uiPreview");
  const [layout, setLayout] = useState(() => isPreview ? loadUiLayout() : clone(UI_LAYOUT_DEFAULTS));
  useEffect(() => {
    const onLocal = (event) => setLayout(merge(clone(UI_LAYOUT_DEFAULTS), event.detail));
    const onMessage = (event) => {
      if (event.data?.type === "packitup-ui-layout") setLayout(merge(clone(UI_LAYOUT_DEFAULTS), event.data.layout));
    };
    window.addEventListener("packitup-ui-layout", onLocal);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("packitup-ui-layout", onLocal);
      window.removeEventListener("message", onMessage);
    };
  }, []);
  return layout;
}
