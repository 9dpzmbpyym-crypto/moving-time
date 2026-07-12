import { useMemo, useRef, useState } from "react";
import { loadUiLayout, resetUiLayout, saveUiLayout } from "./uiLayout.js";

const FONT = { fontFamily: "'Courier New', monospace", fontWeight: 700 };
const VIEW_SCREEN = { body: "health", apartment: "apartment", overview: "menu" };
const ZONE_LABELS = { brain: "Psychiatry", teeth: "Dentist", heart: "Cardiology", skin: "Dermatology", lymph: "Rheumatology", obgyn: "OB/GYN" };

const FIELDS = {
  body: [
    ...Object.keys(ZONE_LABELS).flatMap((id) => [
      { label: `${ZONE_LABELS[id]} X`, path: ["body", "zones", id, "x"], min: 0, max: 100, step: 0.5 },
      { label: `${ZONE_LABELS[id]} Y`, path: ["body", "zones", id, "y"], min: 0, max: 100, step: 0.5 },
      { label: `${ZONE_LABELS[id]} size`, path: ["body", "zones", id, "size"], min: 8, max: 30, step: 0.5 },
    ]),
    { label: "Paper top", path: ["body", "paper", "top"], min: 45, max: 75, step: 0.5 },
    { label: "Paper bottom", path: ["body", "paper", "bottom"], min: 0, max: 20, step: 0.5 },
    { label: "Paper content top", path: ["body", "paper", "paddingTop"], min: 0, max: 15, step: 0.5 },
    { label: "Paper content X", path: ["body", "paper", "contentX"], min: 5, max: 30, step: 0.5 },
  ],
  apartment: [
    { label: "Nav label top", path: ["apartment", "nav", "top"], min: 45, max: 85, step: 0.5 },
    { label: "Nav label bottom", path: ["apartment", "nav", "bottom"], min: 0, max: 30, step: 0.5 },
    { label: "Clock left", path: ["apartment", "clock", "left"], min: 10, max: 50, step: 0.5 },
    { label: "Clock top", path: ["apartment", "clock", "top"], min: 0, max: 35, step: 0.5 },
    { label: "Time Y", path: ["apartment", "clock", "timeY"], min: -10, max: 20, step: 0.5 },
    { label: "Date Y", path: ["apartment", "clock", "dateY"], min: -10, max: 20, step: 0.5 },
    { label: "Days Y", path: ["apartment", "clock", "daysY"], min: -10, max: 20, step: 0.5 },
    { label: "Days horizontal", path: ["apartment", "clock", "daysLeft"], min: -40, max: 20, step: 0.5 },
    { label: "Coins left padding", path: ["apartment", "coins", "padLeft"], min: 10, max: 60, step: 0.5 },
    { label: "Coins Y", path: ["apartment", "coins", "y"], min: -15, max: 15, step: 0.5 },
    { label: "Room top padding", path: ["apartment", "room", "padTop"], min: 0, max: 40, step: 0.5 },
    { label: "Room left padding", path: ["apartment", "room", "padLeft"], min: 5, max: 45, step: 0.5 },
    { label: "Room count gap", path: ["apartment", "room", "countGap"], min: 0, max: 12, step: 0.5 },
    { label: "Boxes left padding", path: ["apartment", "boxes", "padLeft"], min: 0, max: 50, step: 0.5 },
    { label: "Boxes Y", path: ["apartment", "boxes", "y"], min: -15, max: 15, step: 0.5 },
  ],
  overview: [
    { label: "Pressure text top", path: ["overview", "pressureTop"], min: 0, max: 35, step: 0.5 },
    { label: "Tile content left", path: ["overview", "tileLeft"], min: 4, max: 25, step: 0.5 },
    { label: "Tile content top", path: ["overview", "tileTop"], min: 2, max: 20, step: 0.5 },
    { label: "Vertical gap (dvh)", path: ["overview", "gapDvh"], min: 0.2, max: 2, step: 0.1 },
  ],
};

const getAt = (obj, path) => path.reduce((cur, key) => cur[key], obj);
const setAt = (obj, path, value) => {
  const next = JSON.parse(JSON.stringify(obj));
  let cur = next;
  path.slice(0, -1).forEach((key) => { cur = cur[key]; });
  cur[path[path.length - 1]] = value;
  return next;
};

export default function UiLayoutEditor() {
  const [view, setView] = useState("body");
  const [layout, setLayout] = useState(loadUiLayout);
  const [copied, setCopied] = useState(false);
  const frameRef = useRef(null);
  const src = useMemo(() => `/?uiPreview=${VIEW_SCREEN[view]}`, [view]);

  const publish = (next) => {
    setLayout(next);
    saveUiLayout(next);
    frameRef.current?.contentWindow?.postMessage({ type: "packitup-ui-layout", layout: next }, "*");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#120A04", color: "#F2E4C0", display: "flex", gap: 14, padding: 14, boxSizing: "border-box", ...FONT }}>
      <div style={{ flex: "0 0 auto" }}>
        <iframe ref={frameRef} key={src} src={src} title="Live UI preview" style={{ width: 390, height: 844, border: "3px solid #C9942E", background: "#000" }} />
      </div>
      <div style={{ flex: 1, minWidth: 320, maxHeight: "calc(100vh - 28px)", overflow: "auto", padding: 14, background: "#241509", border: "2px solid #6B4423" }}>
        <h1 style={{ margin: "0 0 10px", color: "#FFD97A", fontSize: 20 }}>UI Layout Editor</h1>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {Object.keys(VIEW_SCREEN).map((key) => <button key={key} onClick={() => setView(key)} style={{ padding: "7px 10px", background: view === key ? "#C9942E" : "#3A2410", color: view === key ? "#120A04" : "#F2E4C0", border: "2px solid #120A04", ...FONT }}>{key.toUpperCase()}</button>)}
        </div>
        {FIELDS[view].map((field) => {
          const value = getAt(layout, field.path);
          return <label key={field.path.join(".")} style={{ display: "grid", gridTemplateColumns: "150px 1fr 62px", gap: 8, alignItems: "center", marginBottom: 7, fontSize: 11 }}>
            <span>{field.label}</span>
            <input type="range" min={field.min} max={field.max} step={field.step} value={value} onChange={(e) => publish(setAt(layout, field.path, Number(e.target.value)))} />
            <input type="number" min={field.min} max={field.max} step={field.step} value={value} onChange={(e) => publish(setAt(layout, field.path, Number(e.target.value)))} style={{ width: 58, background: "#EFE7D2", color: "#241509", border: "1px solid #000", ...FONT }} />
          </label>;
        })}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={() => { const next = resetUiLayout(); publish(next); }} style={{ padding: "8px 12px", ...FONT }}>Reset defaults</button>
          <button onClick={async () => { await navigator.clipboard.writeText(JSON.stringify(layout, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 1200); }} style={{ padding: "8px 12px", ...FONT }}>{copied ? "Copied!" : "Copy JSON"}</button>
        </div>
        <pre style={{ marginTop: 12, padding: 10, background: "#120A04", color: "#C9B896", fontSize: 9, whiteSpace: "pre-wrap" }}>{JSON.stringify(layout[view], null, 2)}</pre>
      </div>
    </div>
  );
}
