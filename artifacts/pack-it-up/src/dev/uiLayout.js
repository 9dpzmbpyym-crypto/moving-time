import { useEffect, useState } from "react";

export const UI_LAYOUT_STORE_KEY = "packitup-ui-layout-v1";

export const UI_LAYOUT_DEFAULTS = {
  body: {
    zones: {
      brain: { x: 50, y: 4.5, size: 15.5 },
      teeth: { x: 50.5, y: 18, size: 15.5 },
      heart: { x: 50, y: 30.5, size: 17.5 },
      skin: { x: 24.5, y: 38, size: 19 },
      lymph: { x: 78, y: 38, size: 19 },
      obgyn: { x: 50, y: 50.5, size: 19 },
    },
    paper: { top: 62.5, bottom: 5.5, paddingTop: 19, contentX: 6 },
  },
  apartment: {
    nav: { top: 59.5, bottom: 14 },
    clock: { left: 36.5, right: 8, top: 26, bottom: 18, timeY: 3, dateY: 0, daysY: 1, daysLeft: -18 },
    coins: { padLeft: 42.5, y: -0.5 },
    room: { padTop: 24.5, padLeft: 28.5, countGap: 0 },
    boxes: { padLeft: 23, y: 8 },
  },
  overview: {
    pressureTop: 18,
    tileLeft: 13.5,
    tileTop: 20,
    gapDvh: 0.2,
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
