import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import JOB_ROW from "../assets/items/task_card_assets/horizontal/job_row_card.png";
import HOUSING_ROW from "../assets/items/task_card_assets/horizontal/housing_row_card.png";
import MOVE_ROW from "../assets/items/task_card_assets/horizontal/move_row_card.png";
import ADMIN_ROW from "../assets/items/task_card_assets/horizontal/admin_row_card.png";
import HEALTH_ROW from "../assets/items/task_card_assets/horizontal/health_row_card.png";
import STRETCHY_ROW from "../assets/items/task_card_assets/horizontal/stretchy_row_card.png";
import JOB_FULL from "../assets/items/task_card_assets/vertical/job_full_card.png";
import HOUSING_FULL from "../assets/items/task_card_assets/vertical/housing_full_card.png";
import MOVE_FULL from "../assets/items/task_card_assets/vertical/move_full_card.png";
import ADMIN_FULL from "../assets/items/task_card_assets/vertical/admin_full_card.png";
import HEALTH_FULL from "../assets/items/task_card_assets/vertical/health_full_card.png";
import STRETCHY_FULL from "../assets/items/task_card_assets/vertical/stretchy_full_card.png";

/**
 * Dev tool — flat upright card overlay placer.
 * Open: /?cards=1
 *
 * Drag boxes to move, corner handles to resize, drag pip dots to place fills.
 * Copy emits % values ready to paste into Screens.jsx.
 */

const STORE_KEY = "packitup-card-layout-v2";

const LB = { fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "0.5px" };

const ROW_SRC = {
  job: JOB_ROW, housing: HOUSING_ROW, move: MOVE_ROW,
  admin: ADMIN_ROW, health: HEALTH_ROW, stretchy: STRETCHY_ROW,
};
const FULL_SRC = {
  job: JOB_FULL, housing: HOUSING_FULL, move: MOVE_FULL,
  admin: ADMIN_FULL, health: HEALTH_FULL, stretchy: STRETCHY_FULL,
};
const CATS = ["job", "housing", "move", "admin", "health", "stretchy"];

const SAMPLE = {
  title: "Apply: Contract Manager — Population Health Data Science",
  target: "Jul 11",
  latest: "Jul 11",
  effort: 2,
  importance: 2,
};

/** Defaults match current Screens.jsx (full title eased from the too-tight inset). */
const DEFAULTS = {
  thin: {
    title: { left: 3, top: 28.2, width: 94.4, height: 24 },
    target: { left: 18.5, top: 69.5, width: 14, height: 6 },
    latest: { left: 47.5, top: 69.5, width: 14, height: 6 },
    titleMaxPx: 11,
    datePx: 8,
    pips: {
      effort: [[66.7, 74.8], [70.5, 74.8], [74.4, 74.8]],
      importance: [[87.85, 74.8], [91.7, 74.8], [95.2, 74.8]],
      size: 2.15,
    },
  },
  full: {
    title: { left: 12, top: 22.5, width: 76, height: 15.5 },
    target: { left: 34, top: 41.3, width: 58, height: 4 },
    latest: { left: 34, top: 46.3, width: 58, height: 4 },
    bound: { left: 4, top: 2, width: 10, height: 4.5 },
    titleMaxPx: 11,
    datePx: 9,
    pips: {
      effort: [[20.55, 16.6], [28.22, 16.65], [36.13, 16.61]],
      importance: [[20.77, 86.88], [28.55, 86.93], [36.27, 86.97]],
      size: 5.2,
    },
  },
};

const BOX_KEYS = ["title", "target", "latest", "bound"];
const BOX_COLORS = { title: "#FF4D4D", target: "#4D9FFF", latest: "#5DDE7A", bound: "#E8A0FF" };

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function loadStored() {
  try {
    const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem("packitup-card-layout-v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // merge missing keys (e.g. bound badge) from defaults
    return {
      thin: { ...structuredClone(DEFAULTS.thin), ...parsed.thin, pips: { ...DEFAULTS.thin.pips, ...(parsed.thin?.pips || {}) } },
      full: {
        ...structuredClone(DEFAULTS.full),
        ...parsed.full,
        bound: parsed.full?.bound || structuredClone(DEFAULTS.full.bound),
        pips: { ...DEFAULTS.full.pips, ...(parsed.full?.pips || {}) },
      },
    };
  } catch {
    return null;
  }
}

function boxToCss(b) {
  return {
    left: `${b.left}%`,
    top: `${b.top}%`,
    width: `${b.width}%`,
    height: `${b.height}%`,
  };
}

function exportSnippet(layout) {
  const t = layout.thin;
  const f = layout.full;
  const fmtPips = (p) => p.map(([x, y]) => `[${x}, ${y}]`).join(", ");
  return `// thin (HorizontalTaskCard)
title: left ${t.title.left}% / top ${t.title.top}% / width ${t.title.width}% / height ${t.title.height}%
  → style left:"${t.title.left}%", right:"${round1(100 - t.title.left - t.title.width)}%", top:"${t.title.top}%", height:"${t.title.height}%"
target: left ${t.target.left}% top ${t.target.top}% width ${t.target.width}%
latest: left ${t.latest.left}% top ${t.latest.top}% width ${t.latest.width}%
titleMaxPx ${t.titleMaxPx}  datePx ${t.datePx}
H_PIP.effort: [${fmtPips(t.pips.effort)}]
H_PIP.importance: [${fmtPips(t.pips.importance)}]
H_PIP.size: ${t.pips.size}

// full (VerticalTaskCard)
title: left ${f.title.left}% / top ${f.title.top}% / width ${f.title.width}% / height ${f.title.height}%
  → style left:"${f.title.left}%", right:"${round1(100 - f.title.left - f.title.width)}%", top:"${f.title.top}%", height:"${f.title.height}%"
target: left ${f.target.left}% top ${f.target.top}% width ${f.target.width}%
latest: left ${f.latest.left}% top ${f.latest.top}% width ${f.latest.width}%
bound B: left ${f.bound.left}% top ${f.bound.top}% width ${f.bound.width}% height ${f.bound.height}%
titleMaxPx ${f.titleMaxPx}  datePx ${f.datePx}
V_PIP.effort: [${fmtPips(f.pips.effort)}]
V_PIP.importance: [${fmtPips(f.pips.importance)}]
V_PIP.size: ${f.pips.size}
`;
}

function FitPreview({ text, maxPx, minPx = 5, style }) {
  const ref = useRef(null);
  const [size, setSize] = useState(maxPx);
  useEffect(() => {
    const el = ref.current;
    if (!el?.parentElement) return undefined;
    const parent = el.parentElement;
    const fit = () => {
      let s = maxPx;
      el.style.fontSize = `${s}px`;
      let guard = 40;
      while (
        guard-- > 0
        && s > minPx
        && (el.scrollHeight > parent.clientHeight + 1 || el.scrollWidth > parent.clientWidth + 1)
      ) {
        s -= 0.5;
        el.style.fontSize = `${s}px`;
      }
      setSize(s);
    };
    fit();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [text, maxPx, minPx]);
  return (
    <span ref={ref} style={{ display: "block", width: "100%", fontSize: size, lineHeight: 1.1, overflow: "hidden", ...style }}>
      {text}
    </span>
  );
}

function OverlayBox({
  id, box, color, selected, label, children, onSelect, onMove, onResize, showOutlines = true,
}) {
  const drag = useRef(null);

  const onPointerDown = (e, mode) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(id);
    const parent = e.currentTarget.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    drag.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...box },
      rectW: rect.width,
      rectH: rect.height,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = ((e.clientX - d.startX) / d.rectW) * 100;
    const dy = ((e.clientY - d.startY) / d.rectH) * 100;
    if (d.mode === "move") {
      onMove(id, {
        left: round1(clamp(d.orig.left + dx, 0, 100 - d.orig.width)),
        top: round1(clamp(d.orig.top + dy, 0, 100 - d.orig.height)),
      });
    } else if (d.mode === "se") {
      onResize(id, {
        width: round1(clamp(d.orig.width + dx, 4, 100 - d.orig.left)),
        height: round1(clamp(d.orig.height + dy, 3, 100 - d.orig.top)),
      });
    } else if (d.mode === "e") {
      onResize(id, { width: round1(clamp(d.orig.width + dx, 4, 100 - d.orig.left)) });
    } else if (d.mode === "s") {
      onResize(id, { height: round1(clamp(d.orig.height + dy, 3, 100 - d.orig.top)) });
    }
  };

  const onPointerUp = () => { drag.current = null; };

  const handle = (mode, style) => (
    <div
      onPointerDown={(e) => onPointerDown(e, mode)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "absolute", background: color, border: "1px solid #fff",
        zIndex: 5, ...style,
      }}
    />
  );

  const showChrome = showOutlines || selected;

  return (
    <div
      onPointerDown={(e) => onPointerDown(e, "move")}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "absolute", ...boxToCss(box),
        border: showChrome ? `2px solid ${color}` : "2px solid transparent",
        background: showOutlines ? (selected ? `${color}22` : `${color}11`) : (selected ? `${color}18` : "transparent"),
        boxSizing: "border-box",
        cursor: "move",
        zIndex: selected ? 4 : 2,
        display: "flex", alignItems: "center", justifyContent: label === "bound" ? "center" : "flex-start",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      {showChrome && (
        <div style={{
          position: "absolute", top: -16, left: 0, fontSize: 9, color, whiteSpace: "nowrap",
          pointerEvents: "none", ...LB,
        }}>{label}</div>
      )}
      {children}
      {selected && (
        <>
          {handle("e", { right: -4, top: "30%", width: 8, height: "40%", cursor: "ew-resize" })}
          {handle("s", { bottom: -4, left: "30%", width: "40%", height: 8, cursor: "ns-resize" })}
          {handle("se", { right: -5, bottom: -5, width: 10, height: 10, cursor: "nwse-resize", borderRadius: 2 })}
        </>
      )}
    </div>
  );
}

function PipDot({ x, y, sizePct, selected, onSelect, onMove, label }) {
  const drag = useRef(null);
  const onPointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    const parent = e.currentTarget.parentElement;
    const rect = parent.getBoundingClientRect();
    drag.current = { startX: e.clientX, startY: e.clientY, ox: x, oy: y, rectW: rect.width, rectH: rect.height };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = ((e.clientX - d.startX) / d.rectW) * 100;
    const dy = ((e.clientY - d.startY) / d.rectH) * 100;
    onMove(round1(clamp(d.ox + dx, 1, 99)), round1(clamp(d.oy + dy, 1, 99)));
  };
  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => { drag.current = null; }}
      title={label}
      style={{
        position: "absolute",
        left: `${x}%`, top: `${y}%`,
        width: `${sizePct}%`, aspectRatio: "1 / 1",
        borderRadius: "50%",
        background: "#120A04",
        transform: "translate(-50%, -50%)",
        cursor: "grab",
        outline: selected ? "2px solid #FFD97A" : "1px solid rgba(255,255,255,0.35)",
        zIndex: 6,
        touchAction: "none",
      }}
    />
  );
}

function CardStage({
  kind, src, displayW, layout, selected, onSelect, setLayoutBox, setPip, sampleTitle, showOutlines,
}) {
  const L = layout[kind];
  return (
    <div style={{ position: "relative", width: displayW, lineHeight: 0, userSelect: "none" }}>
      <img
        src={src}
        alt=""
        draggable={false}
        onPointerDown={() => onSelect(null)}
        style={{ width: "100%", height: "auto", display: "block", imageRendering: "pixelated" }}
      />
      <div style={{ position: "absolute", inset: 0 }}>
        {kind === "full" && L.bound && (
          <OverlayBox
            id="full:bound"
            box={L.bound}
            color={BOX_COLORS.bound}
            selected={selected === "full:bound"}
            label="bound"
            showOutlines={showOutlines}
            onSelect={onSelect}
            onMove={(_, p) => setLayoutBox("full", "bound", p)}
            onResize={(_, p) => setLayoutBox("full", "bound", p)}
          >
            <span style={{
              color: "#A3252C", fontSize: Math.max(8, Math.round(displayW * 0.045)),
              border: "1px solid #A3252C", background: "rgba(255,248,235,0.9)",
              padding: "1px 3px", lineHeight: 1, ...LB,
            }}>B</span>
          </OverlayBox>
        )}
        <OverlayBox
          id={`${kind}:title`}
          box={L.title}
          color={BOX_COLORS.title}
          selected={selected === `${kind}:title`}
          label="title"
          showOutlines={showOutlines}
          onSelect={onSelect}
          onMove={(_, p) => setLayoutBox(kind, "title", p)}
          onResize={(_, p) => setLayoutBox(kind, "title", p)}
        >
          <FitPreview
            text={sampleTitle}
            maxPx={L.titleMaxPx}
            style={{ color: "#1A1008", fontWeight: 700, padding: "0 2px", ...LB }}
          />
        </OverlayBox>
        <OverlayBox
          id={`${kind}:target`}
          box={L.target}
          color={BOX_COLORS.target}
          selected={selected === `${kind}:target`}
          label="target"
          showOutlines={showOutlines}
          onSelect={onSelect}
          onMove={(_, p) => setLayoutBox(kind, "target", p)}
          onResize={(_, p) => setLayoutBox(kind, "target", p)}
        >
          <span style={{ color: "#1A1008", fontSize: L.datePx, ...LB }}>{SAMPLE.target}</span>
        </OverlayBox>
        <OverlayBox
          id={`${kind}:latest`}
          box={L.latest}
          color={BOX_COLORS.latest}
          selected={selected === `${kind}:latest`}
          label="latest"
          showOutlines={showOutlines}
          onSelect={onSelect}
          onMove={(_, p) => setLayoutBox(kind, "latest", p)}
          onResize={(_, p) => setLayoutBox(kind, "latest", p)}
        >
          <span style={{ color: "#1A1008", fontSize: L.datePx, ...LB }}>{SAMPLE.latest}</span>
        </OverlayBox>
        {L.pips.effort.map(([x, y], i) => (
          <PipDot
            key={`e${i}`}
            x={x} y={y} sizePct={Math.max(L.pips.size, kind === "thin" ? 2.5 : 4)}
            selected={selected === `${kind}:effort:${i}`}
            label={`effort ${i + 1}`}
            onSelect={() => onSelect(`${kind}:effort:${i}`)}
            onMove={(nx, ny) => setPip(kind, "effort", i, nx, ny)}
          />
        ))}
        {L.pips.importance.map(([x, y], i) => (
          <PipDot
            key={`i${i}`}
            x={x} y={y} sizePct={Math.max(L.pips.size, kind === "thin" ? 2.5 : 4)}
            selected={selected === `${kind}:importance:${i}`}
            label={`importance ${i + 1}`}
            onSelect={() => onSelect(`${kind}:importance:${i}`)}
            onMove={(nx, ny) => setPip(kind, "importance", i, nx, ny)}
          />
        ))}
      </div>
    </div>
  );
}

export default function CardLayoutEditor() {
  const stored = useMemo(() => loadStored(), []);
  const [layout, setLayout] = useState(() => stored || structuredClone(DEFAULTS));
  const [cat, setCat] = useState("job");
  const [selected, setSelected] = useState("full:title");
  const [copied, setCopied] = useState(false);
  const [sampleTitle, setSampleTitle] = useState(SAMPLE.title);
  const [showOutlines, setShowOutlines] = useState(true);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(layout));
  }, [layout]);

  const setLayoutBox = useCallback((kind, key, patch) => {
    setLayout((prev) => ({
      ...prev,
      [kind]: {
        ...prev[kind],
        [key]: { ...prev[kind][key], ...patch },
      },
    }));
  }, []);

  const setPip = useCallback((kind, group, index, x, y) => {
    setLayout((prev) => {
      const next = prev[kind].pips[group].map((p, i) => (i === index ? [x, y] : p));
      return {
        ...prev,
        [kind]: {
          ...prev[kind],
          pips: { ...prev[kind].pips, [group]: next },
        },
      };
    });
  }, []);

  const setScalar = (kind, key, value) => {
    setLayout((prev) => ({ ...prev, [kind]: { ...prev[kind], [key]: value } }));
  };

  const setPipSize = (kind, size) => {
    setLayout((prev) => ({
      ...prev,
      [kind]: { ...prev[kind], pips: { ...prev[kind].pips, size: round1(size) } },
    }));
  };

  const copyOut = async () => {
    const text = exportSnippet(layout);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // eslint-disable-next-line no-alert
      window.prompt("Copy layout:", text);
    }
  };

  // keyboard nudge
  useEffect(() => {
    const onKey = (e) => {
      if (!selected) return;
      const step = e.shiftKey ? 1 : 0.5;
      const [kind, part, idx] = selected.split(":");
      if (!layout[kind]) return;
      if (part === "title" || part === "target" || part === "latest" || part === "bound") {
        const box = layout[kind][part];
        if (!box) return;
        if (e.key === "ArrowLeft") { e.preventDefault(); setLayoutBox(kind, part, { left: round1(clamp(box.left - step, 0, 99)) }); }
        if (e.key === "ArrowRight") { e.preventDefault(); setLayoutBox(kind, part, { left: round1(clamp(box.left + step, 0, 99)) }); }
        if (e.key === "ArrowUp") { e.preventDefault(); setLayoutBox(kind, part, { top: round1(clamp(box.top - step, 0, 99)) }); }
        if (e.key === "ArrowDown") { e.preventDefault(); setLayoutBox(kind, part, { top: round1(clamp(box.top + step, 0, 99)) }); }
      } else if ((part === "effort" || part === "importance") && idx != null) {
        const i = Number(idx);
        const [x, y] = layout[kind].pips[part][i];
        if (e.key === "ArrowLeft") { e.preventDefault(); setPip(kind, part, i, round1(clamp(x - step, 1, 99)), y); }
        if (e.key === "ArrowRight") { e.preventDefault(); setPip(kind, part, i, round1(clamp(x + step, 1, 99)), y); }
        if (e.key === "ArrowUp") { e.preventDefault(); setPip(kind, part, i, x, round1(clamp(y - step, 1, 99))); }
        if (e.key === "ArrowDown") { e.preventDefault(); setPip(kind, part, i, x, round1(clamp(y + step, 1, 99))); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, layout, setLayoutBox, setPip]);

  const selKind = selected?.split(":")[0];
  const selPart = selected?.split(":")[1];
  const activeBox = (selPart && BOX_KEYS.includes(selPart) && layout[selKind])
    ? layout[selKind][selPart]
    : null;

  return (
    <div style={{
      minHeight: "100vh", background: "#160D06", color: "#F2E4C0",
      padding: "16px 18px 40px", boxSizing: "border-box", ...LB,
    }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 16, color: "#FFD97A" }}>Card overlay layout · /?cards=1</div>
        <div style={{ flex: 1 }} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} style={selStyle}>
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="button" onClick={() => setShowOutlines((v) => !v)} style={btnStyle}>
          {showOutlines ? "Hide outlines" : "Show outlines"}
        </button>
        <button type="button" onClick={() => setLayout(structuredClone(DEFAULTS))} style={btnStyle}>Reset defaults</button>
        <button type="button" onClick={copyOut} style={{ ...btnStyle, background: "#5D7C3B" }}>
          {copied ? "Copied!" : "Copy layout"}
        </button>
        <a href="/" style={{ color: "#8A7350", fontSize: 12 }}>← game</a>
      </div>

      <div style={{ color: "#8A7350", fontSize: 11, marginBottom: 12, maxWidth: 720 }}>
        Flat upright samples. Drag boxes for title / dates / bound B; drag dots for pips.
        Hide outlines to preview clean. Arrows nudge 0.5% (Shift = 1%). Copy → paste into Screens.jsx.
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "#FFD97A", fontSize: 12, marginBottom: 8 }}>Thin (draw row)</div>
          <CardStage
            kind="thin"
            src={ROW_SRC[cat]}
            displayW={420}
            layout={layout}
            selected={selected}
            onSelect={setSelected}
            setLayoutBox={setLayoutBox}
            setPip={setPip}
            sampleTitle={sampleTitle}
            showOutlines={showOutlines}
          />
        </div>
        <div>
          <div style={{ color: "#FFD97A", fontSize: 12, marginBottom: 8 }}>Full (hand card)</div>
          <CardStage
            kind="full"
            src={FULL_SRC[cat]}
            displayW={220}
            layout={layout}
            selected={selected}
            onSelect={setSelected}
            setLayoutBox={setLayoutBox}
            setPip={setPip}
            sampleTitle={sampleTitle}
            showOutlines={showOutlines}
          />
        </div>

        <div style={{
          minWidth: 260, maxWidth: 320, background: "#241509", border: "3px solid #120A04",
          padding: 12, fontSize: 11,
        }}>
          <div style={{ color: "#FFD97A", marginBottom: 8 }}>Inspector</div>
          <label style={labStyle}>Sample title</label>
          <textarea
            value={sampleTitle}
            onChange={(e) => setSampleTitle(e.target.value)}
            rows={3}
            style={{ width: "100%", background: "#1A1008", color: "#F2E4C0", border: "2px solid #120A04", ...LB, fontSize: 11, marginBottom: 10 }}
          />

          {["thin", "full"].map((kind) => (
            <div key={kind} style={{ marginBottom: 12, borderTop: "1px solid #3A2410", paddingTop: 8 }}>
              <div style={{ color: "#C9B896", marginBottom: 4 }}>{kind}</div>
              <label style={labStyle}>title maxPx {layout[kind].titleMaxPx}</label>
              <input
                type="range" min={6} max={18} step={0.5} value={layout[kind].titleMaxPx}
                onChange={(e) => setScalar(kind, "titleMaxPx", Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <label style={labStyle}>date px {layout[kind].datePx}</label>
              <input
                type="range" min={5} max={14} step={0.5} value={layout[kind].datePx}
                onChange={(e) => setScalar(kind, "datePx", Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <label style={labStyle}>pip size % {layout[kind].pips.size}</label>
              <input
                type="range" min={1} max={8} step={0.05} value={layout[kind].pips.size}
                onChange={(e) => setPipSize(kind, Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
          ))}

          {activeBox && (
            <div style={{ borderTop: "1px solid #3A2410", paddingTop: 8 }}>
              <div style={{ color: "#FFD97A", marginBottom: 6 }}>{selected}</div>
              {["left", "top", "width", "height"].map((k) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 44, color: "#8A7350" }}>{k}</span>
                  <input
                    type="number" step={0.1} value={activeBox[k]}
                    onChange={(e) => setLayoutBox(selKind, selPart, { [k]: Number(e.target.value) })}
                    style={{ flex: 1, background: "#1A1008", color: "#F2E4C0", border: "2px solid #120A04", padding: 4, ...LB }}
                  />
                </div>
              ))}
            </div>
          )}

          <pre style={{
            marginTop: 12, padding: 8, background: "#1A1008", color: "#C9B896",
            fontSize: 9, overflow: "auto", maxHeight: 180, whiteSpace: "pre-wrap",
          }}>{exportSnippet(layout)}</pre>
        </div>
      </div>
    </div>
  );
}

const btnStyle = {
  background: "#3A2410", color: "#F2E4C0", border: "2px solid #120A04",
  padding: "6px 10px", cursor: "pointer", fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: 11,
};
const selStyle = { ...btnStyle, padding: "6px 8px" };
const labStyle = { display: "block", color: "#8A7350", fontSize: 10, marginBottom: 2 };
