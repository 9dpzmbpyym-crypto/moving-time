import { useEffect, useState } from "react";
import CAT_SHEET from "./assets/Cat-Sheet.png";
import { itemArtReady } from "./contents.js";
import {
  TASK_CATEGORIES, SAMPLE_JOBS, isOpen, taskPressure,
  PRESSURE_LABELS, PRESSURE_COLORS,
} from "./tasks.js";
import { PixelCanvas } from "./BedroomSlice.jsx";

/* ============================================================
   SCREENS — the "next layer" on top of the apartment hub.

   ScreenLayer renders full-screen overlays above the apartment
   (which stays mounted underneath, state intact): Menu, Desk,
   Health, Inventory, Log, Stretchy, Settings. All are visual
   shells / placeholders — no real systems yet. Same style
   language as the hub: Courier, hard #120A04 borders, chunky
   frames, no gradients on art surfaces.
   ============================================================ */

const FR = { background: "#241509", border: "3px solid #120A04", boxShadow: "inset 0 0 0 2px #4A2E17, 0 3px 0 #000" };
const LB = { fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "0.5px" };
const PAPER = { job: "#E9BFB2", admin: "#B9CEDC", move: "#EBDDBA", health: "#CBDCC2", cat: "#EBD2A8" };

const screenCss = (
  <style>{`
    @keyframes screenIn { from { opacity: 0; transform: translateY(14px); } }
    @keyframes zonePulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(199,75,79,0.55); }
      50%      { box-shadow: 0 0 0 9px rgba(199,75,79,0); }
    }
    @keyframes zoneCalm { from { box-shadow: 0 0 0 10px rgba(143,209,79,0.5); } to { box-shadow: 0 0 0 0 rgba(143,209,79,0); } }
    @keyframes stampIn {
      0%   { opacity: 0; transform: rotate(-14deg) scale(2.4); }
      55%  { opacity: 1; transform: rotate(-14deg) scale(0.92); }
      75%  { transform: rotate(-14deg) scale(1.06); }
      100% { opacity: 1; transform: rotate(-14deg) scale(1); }
    }
    /* the physical stamp block that lifts from the desk corner and
       travels over the paper before slamming down. Used as an overlay
       layer above the inspected card; art can be swapped for a PNG later. */
    @keyframes stampTravel {
      0%   { transform: translate(-140px, 90px) rotate(20deg) scale(0.6); opacity: 0; }
      35%  { opacity: 1; }
      70%  { transform: translate(0, 0) rotate(-14deg) scale(1.15); opacity: 1; }
      85%  { transform: translate(0, 0) rotate(-14deg) scale(0.92); }
      100% { transform: translate(0, 0) rotate(-14deg) scale(1); opacity: 0; }
    }
    .stampTravel { animation: stampTravel 420ms cubic-bezier(0.2, 1.2, 0.4, 1) both; }
    @keyframes cardOff  { to { transform: translate(120%, -30px) rotate(14deg); opacity: 0; } }
    @keyframes cardFile { to { transform: translate(60%, 140%) rotate(6deg) scale(0.5); opacity: 0; } }
    @keyframes reliefUp {
      0% { opacity: 0; transform: translateY(6px); } 20% { opacity: 1; }
      80% { opacity: 1; } 100% { opacity: 0; transform: translateY(-10px); }
    }
    .stampMark { animation: stampIn 320ms cubic-bezier(0.2, 1.4, 0.4, 1) both; }
    .cardOff   { animation: cardOff 460ms ease-in 420ms both; }
    .cardFile  { animation: cardFile 460ms ease-in 420ms both; }
  `}</style>
);

/* ---- shared shell: header w/ Back-to-apartment + scrollable body ---- */
function Screen({ title, icon, onBack, children, bg = "#160D06" }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 250, background: bg, display: "flex", flexDirection: "column",
      animation: "screenIn 200ms ease-out", overflow: "hidden",
    }}>
      {screenCss}
      <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 8, padding: "calc(env(safe-area-inset-top, 0px) + 10px) 10px 8px" }}>
        <button onClick={onBack} style={{ padding: "9px 13px", color: "#FFD97A", fontSize: 13, cursor: "pointer", ...FR, ...LB }}>
          ← Apartment
        </button>
        <div style={{ flex: 1, padding: "9px 12px", color: "#F2E4C0", fontSize: 14, textAlign: "center", ...FR, ...LB }}>
          {icon} {title}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
        {children}
      </div>
    </div>
  );
}

const soonTag = <span style={{ fontSize: 9, color: "#8A7350", ...LB }}>(soon)</span>;

/* ================= MENU / OVERVIEW ================= */
function MenuScreen({ go, tasks }) {
  const pressure = taskPressure(tasks);
  const count = (cats) => tasks.filter((t) => isOpen(t) && cats.includes(t.category)).length;
  // soonest open due date per category group, for a "due: X" line on tiles
  const soonest = (cats) => {
    const t = tasks.filter((x) => isOpen(x) && cats.includes(x.category));
    if (!t.length) return null;
    return t.slice().sort((a, b) => b.urgency - a.urgency)[0].due;
  };
  const tiles = [
    { key: "desk",      icon: "🗂️", label: "Desk / Admin",    sub: "papers & job apps", badge: count(["job", "admin", "move"]), due: soonest(["job", "admin", "move"]) },
    { key: "health",    icon: "🩺", label: "Health / Body",    sub: "use it while covered", badge: count(["health"]), due: soonest(["health"]) },
    { key: "inventory", icon: "📦", label: "Inventory",        sub: "packed items", badge: 0, due: null },
    { key: "log",       icon: "💰", label: "Sold / Donated",   sub: "the money log", badge: 0, due: null },
    { key: "stretchy",  icon: "🐈", label: "Stretchy",         sub: "orange & fine", badge: count(["cat"]), due: soonest(["cat"]) },
    { key: "settings",  icon: "⚙️", label: "Settings",         sub: "sound & such", badge: 0, due: null },
  ];
  return (
    <Screen title="Overview" icon="☰" onBack={() => go("apartment")}>
      {/* pressure meter: the one glance that says how loud life is right now */}
      <div style={{ padding: "10px 12px", marginBottom: 12, ...FR }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ color: "#C9B896", fontSize: 11, ...LB }}>PRESSURE</span>
          <span style={{ color: PRESSURE_COLORS[pressure], fontSize: 12, ...LB }}>{PRESSURE_LABELS[pressure]}</span>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 7 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              flex: 1, height: 10, border: "2px solid #120A04",
              background: i <= pressure ? PRESSURE_COLORS[pressure] : "#1A0F06",
            }} />
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {tiles.map((t) => (
          <button key={t.key} onClick={() => go(t.key)} style={{
            position: "relative", minHeight: 96, display: "flex", flexDirection: "column",
            alignItems: "flex-start", justifyContent: "flex-end", gap: 2, padding: "10px 12px",
            cursor: "pointer", textAlign: "left", ...FR, ...LB,
          }}>
            <span style={{ fontSize: 24, marginBottom: 4 }}>{t.icon}</span>
            <span style={{ color: "#F2E4C0", fontSize: 13 }}>{t.label}</span>
            <span style={{ color: "#8A7350", fontSize: 10 }}>{t.sub}</span>
            {t.due && (
              <span style={{ color: "#C74B4F", fontSize: 10, marginTop: 2, ...LB }}>due: {t.due}</span>
            )}
            {t.badge > 0 && (
              <span style={{
                position: "absolute", top: 8, right: 8, minWidth: 20, height: 20, padding: "0 4px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#C43B34", color: "#F3EDDD", fontSize: 11, border: "2px solid #120A04", ...LB,
              }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 14, color: "#6B563B", fontSize: 11, textAlign: "center", ...LB }}>
        The apartment is home base — everything here is a side table.
      </div>
    </Screen>
  );
}

/* ================= DESK / ADMIN / DOCUMENTS ================= */
/* Papers-Please-flavored visual shell: an inbox pile, up to 3
   active cards, an inspect mat, stamp/file actions. Resolving a
   card marks its task done (the one real effect: pressure drops). */
function DeskCard({ task, small, onClick, resolving }) {
  const job = task.jobId ? SAMPLE_JOBS[task.jobId] : null;
  const bg = PAPER[task.category] || "#EBDDBA";
  const cls = resolving ? (resolving.mode === "file" ? "cardFile" : "cardOff") : "";
  return (
    <div className={cls} onClick={onClick} style={{
      position: "relative", background: bg, border: "2px solid #120A04",
      boxShadow: "3px 3px 0 rgba(0,0,0,0.45)", padding: small ? "7px 8px" : "12px 12px",
      width: small ? 96 : "100%", flex: small ? "0 0 auto" : undefined,
      cursor: onClick ? "pointer" : "default", color: "#3A2018",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
        <span style={{ fontSize: small ? 10 : 14, ...LB }}>{job ? job.title : task.title}</span>
        <span style={{ fontSize: small ? 11 : 14 }}>{TASK_CATEGORIES[task.category].icon}</span>
      </div>
      {job ? (
        small ? (
          <div style={{ fontSize: 8, marginTop: 3, opacity: 0.75, ...LB }}>{job.org}</div>
        ) : (
          <div style={{ fontSize: 11, marginTop: 8, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 10px", ...LB }}>
            <span style={{ opacity: 0.6 }}>org</span><span>{job.org}</span>
            <span style={{ opacity: 0.6 }}>where</span><span>{job.location}</span>
            <span style={{ opacity: 0.6 }}>pay</span><span>{job.salary}</span>
            <span style={{ opacity: 0.6 }}>due</span><span style={{ color: "#A3252C" }}>{job.deadline}</span>
            <span style={{ opacity: 0.6 }}>status</span><span>{job.status}</span>
            <span style={{ opacity: 0.6 }}>next</span><span>{job.nextAction}</span>
          </div>
        )
      ) : (
        // non-job tasks get the same grid treatment, colored blue like the fan's admin card
        small ? (
          <div style={{ fontSize: 8, marginTop: 3, opacity: 0.75, ...LB }}>
            <span style={{ color: "#A3252C" }}>{task.due}</span>
          </div>
        ) : (
          <div style={{ fontSize: 11, marginTop: 8, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 10px", ...LB }}>
            <span style={{ opacity: 0.6 }}>kind</span><span>{TASK_CATEGORIES[task.category].label}</span>
            <span style={{ opacity: 0.6 }}>due</span><span style={{ color: "#A3252C" }}>{task.due}</span>
            <span style={{ opacity: 0.6 }}>status</span><span>{task.status}</span>
            <span style={{ opacity: 0.6 }}>relief</span><span>{task.relief === "stamp" ? "stamp it" : task.relief === "file" ? "file it" : "slide it away"}</span>
          </div>
        )
      )}
      {!small && task.jobId && SAMPLE_JOBS[task.jobId].notes && (
        <div style={{ fontSize: 10, marginTop: 8, padding: "5px 7px", background: "rgba(255,255,255,0.35)", border: "1px dashed rgba(0,0,0,0.3)", ...LB }}>
          ✎ {SAMPLE_JOBS[task.jobId].notes}
        </div>
      )}
      {/* ruled lines: makes even a stub read as "a piece of paper" */}
      {small && [0, 1].map((j) => <div key={j} style={{ height: 3, marginTop: 4, background: "rgba(0,0,0,0.18)", width: `${80 - j * 20}%` }} />)}
      {resolving && (
        <div className="stampMark" style={{
          position: "absolute", top: "28%", left: "8%", padding: "4px 10px",
          border: `4px solid ${resolving.mode === "file" ? "#44695B" : "#A3252C"}`,
          color: resolving.mode === "file" ? "#44695B" : "#A3252C",
          fontSize: 22, letterSpacing: 3, background: "rgba(255,255,255,0.25)", ...LB,
        }}>
          {resolving.mode === "file" ? "FILED" : "DONE ✓"}
        </div>
      )}
    </div>
  );
}

function DeskScreen({ go, tasks, setTasks }) {
  const deskTasks = tasks.filter((t) => isOpen(t) && ["job", "admin", "move"].includes(t.category));
  const doneCount = tasks.filter((t) => t.status === "done" && ["job", "admin", "move"].includes(t.category)).length;
  const active = deskTasks.slice(0, 3);
  const pile = deskTasks.slice(3);
  const [inspectId, setInspectId] = useState(null);
  const [resolving, setResolving] = useState(null); // { id, mode: "stamp" | "file" }
  const [relief, setRelief] = useState(null);
  const inspected = deskTasks.find((t) => t.id === inspectId) || null;

  const resolve = (mode) => {
    if (!inspected || resolving) return;
    const id = inspected.id;
    setResolving({ id, mode });
    setTimeout(() => {
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: "done" } : t)));
      setResolving(null);
      setInspectId(null);
      setRelief(mode === "file" ? "Filed away. One less thing." : "Stamped. Off the desk.");
      setTimeout(() => setRelief(null), 1600);
    }, 950);
  };

  const stampBtn = (label, icon, mode, color) => (
    <button onClick={() => resolve(mode)} disabled={!inspected || !!resolving} style={{
      flex: 1, minHeight: 56, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
      background: inspected ? "#3A2410" : "#241509", color: inspected ? color : "#6B563B",
      border: "3px solid #120A04", boxShadow: inspected ? "inset 0 -3px 0 #1A0F06" : "none",
      fontSize: 12, cursor: inspected ? "pointer" : "default", ...LB,
    }}>
      <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>{label}
    </button>
  );

  return (
    <Screen title="Desk" icon="🗂️" onBack={() => go("apartment")} bg="#2E1D0E">
      {/* desk surface: wood grain bands, like the room floors */}
      <div style={{
        border: "3px solid #120A04", background: "repeating-linear-gradient(0deg, #5A381F 0 14px, #6E452A 14px 16px)",
        padding: "10px 10px 12px", boxShadow: "inset 0 0 0 2px #3E2413",
      }}>
        {/* top of desk: inbox pile + filed tray */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ position: "relative", width: 74, height: 58 }}>
            {[2, 1, 0].map((i) => (
              <div key={i} style={{
                position: "absolute", left: i * 3, top: i * -4, width: 62, height: 44,
                background: "#EBDDBA", border: "2px solid #120A04",
                transform: `rotate(${i % 2 ? 2 : -3}deg)`, boxShadow: "2px 2px 0 rgba(0,0,0,0.35)",
              }} />
            ))}
            <div style={{ position: "absolute", left: 12, top: 8, fontSize: 10, color: "#3A2018", zIndex: 1, ...LB }}>
              inbox<br />+{pile.length}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              width: 66, height: 34, border: "2px solid #120A04", background: "#44695B",
              boxShadow: "inset 0 4px 0 rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#EFE7D2", fontSize: 10, ...LB,
            }}>filed: {doneCount}</div>
          </div>
        </div>

        {/* active stack: 1–3 cards, tap one to lay it on the mat */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
          {active.map((t, i) => (
            <div key={t.id} style={{ transform: `rotate(${[-2, 1, -1][i]}deg)`, outline: t.id === inspectId ? "3px solid #FFD97A" : "none" }}>
              <DeskCard task={t} small onClick={() => setInspectId(t.id)} />
            </div>
          ))}
          {active.length === 0 && (
            <div style={{ color: "#C9B896", fontSize: 12, padding: "14px 4px", ...LB }}>
              Desk is clear. Genuinely impressive.
            </div>
          )}
        </div>

        {/* inspect mat: the "hold it up to the light" area */}
        <div style={{
          marginTop: 8, minHeight: 168, border: "3px solid #120A04", background: "#3E2413",
          boxShadow: "inset 0 0 0 2px #2A1709, inset 0 6px 12px rgba(0,0,0,0.35)", padding: 10,
          display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
        }}>
          {inspected ? (
            <DeskCard task={inspected} resolving={resolving && resolving.id === inspected.id ? resolving : null} />
          ) : (
            <div style={{ color: "#8A7350", fontSize: 12, textAlign: "center", ...LB }}>
              Tap a paper above to inspect it.
            </div>
          )}
          {/* the traveling stamp block — sweeps in from the desk corner and
              slams onto the paper. Procedural for now; swap the inner block for
              a PNG of a real rubber stamp when one is provided. */}
          {resolving && (
            <div className="stampTravel" style={{
              position: "absolute", top: "32%", left: "18%", zIndex: 6, pointerEvents: "none",
              width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: "100%", height: "100%", background: "#2A1709",
                border: `5px solid ${resolving.mode === "file" ? "#44695B" : "#A3252C"}`,
                borderRadius: 10, boxShadow: "0 4px 0 rgba(0,0,0,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: resolving.mode === "file" ? "#44695B" : "#A3252C",
                fontSize: 26, ...LB,
              }}>★</div>
            </div>
          )}
          {relief && (
            <div style={{
              position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center",
              color: "#8FD14F", fontSize: 12, animation: "reliefUp 1.6s ease-out both", ...LB,
            }}>{relief}</div>
          )}
        </div>
      </div>

      {/* stamp bar — mirrors the apartment action bar's shape */}
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        {stampBtn("Stamp done", "🔴", "stamp", "#F2E4C0")}
        {stampBtn("File it", "📁", "file", "#F2E4C0")}
        <button onClick={() => setInspectId(null)} disabled={!inspected || !!resolving} style={{
          flex: 1, minHeight: 56, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
          background: "#241509", color: inspected ? "#C9B896" : "#6B563B", border: "3px solid #120A04",
          fontSize: 12, cursor: inspected ? "pointer" : "default", ...LB,
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>↩</span>Put back
        </button>
      </div>
      <div style={{ marginTop: 10, color: "#6B563B", fontSize: 10, textAlign: "center", ...LB }}>
        Sample papers only — the real job tracker plugs in here later.
      </div>
    </Screen>
  );
}

/* ================= HEALTH / BODY ================= */
/* Operation-board shell: cream body on a burgundy board, sockets
   pulse where something needs booking; "stabilize" is a visual
   calm only (no task logic yet). */
const HEALTH_ZONES = [
  { id: "brain",   label: "Brain",   note: "Psychiatry + med renewals", x: "50%", y: "7%" },
  { id: "teeth",   label: "Teeth",   note: "Dentist visit",             x: "50%", y: "17%" },
  { id: "heart",   label: "Heart",   note: "Cardiology appointment",    x: "42%", y: "32%" },
  { id: "lymph",   label: "Lymph",   note: "Rheumatology appointment",  x: "63%", y: "36%" },
  { id: "stomach", label: "Stomach", note: "Diet — gentle, steady",     x: "50%", y: "47%" },
  { id: "skin",    label: "Skin",    note: "Dermatology appointment",   x: "22%", y: "42%" },
  { id: "nerves",  label: "Nerves",  note: "Self-care + healthy habits", x: "78%", y: "42%" },
];

function HealthScreen({ go }) {
  const [zone, setZone] = useState(null);
  const [calm, setCalm] = useState({}); // id -> true, visual-only stabilization
  const sel = HEALTH_ZONES.find((z) => z.id === zone) || null;
  const part = (st) => <div style={{ position: "absolute", background: "#EFE7D2", border: "3px solid #221306", ...st }} />;
  return (
    <Screen title="Health" icon="🩺" onBack={() => go("apartment")}>
      <div style={{ padding: "8px 12px", marginBottom: 10, color: "#C9B896", fontSize: 11, ...FR, ...LB }}>
        Your coverage is active right now — a good window to book things. No rush, just doors that are open.
      </div>

      {/* the board */}
      <div style={{
        position: "relative", border: "3px solid #120A04", background: "#7C2E37",
        boxShadow: "inset 0 0 0 3px #591F27, 0 3px 0 #000", height: 380, overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 8, left: 0, right: 0, textAlign: "center", color: "#EFC463", fontSize: 11, letterSpacing: 3, ...LB }}>
          ✦ BODY BOARD ✦
        </div>
        {/* body silhouette, chunky like the sprites */}
        <div style={{ position: "absolute", left: "50%", top: 40, transform: "translateX(-50%)", width: 210, height: 320 }}>
          {part({ left: 73, top: 0, width: 64, height: 60, borderRadius: 14 })}          {/* head */}
          {part({ left: 88, top: 58, width: 34, height: 14 })}                            {/* neck */}
          {part({ left: 52, top: 70, width: 106, height: 118, borderRadius: 10 })}        {/* torso */}
          {part({ left: 22, top: 76, width: 26, height: 96, borderRadius: 9 })}           {/* arm L */}
          {part({ left: 162, top: 76, width: 26, height: 96, borderRadius: 9 })}          {/* arm R */}
          {part({ left: 58, top: 190, width: 34, height: 110, borderRadius: 9 })}         {/* leg L */}
          {part({ left: 118, top: 190, width: 34, height: 110, borderRadius: 9 })}        {/* leg R */}
          {/* sockets */}
          {HEALTH_ZONES.map((z) => {
            const ok = calm[z.id];
            return (
              <button key={z.id} onClick={() => setZone(z.id)} style={{
                position: "absolute", left: z.x, top: z.y, transform: "translate(-50%, -50%)",
                width: 36, height: 36, borderRadius: "50%", cursor: "pointer",
                background: "#221306", border: `4px solid ${ok ? "#8FD14F" : zone === z.id ? "#FFD97A" : "#C74B4F"}`,
                animation: ok ? "zoneCalm 900ms ease-out" : "zonePulse 1.8s ease-in-out infinite",
                color: ok ? "#8FD14F" : "#C74B4F", fontSize: 13, padding: 0, ...LB,
              }}>{ok ? "✓" : "!"}</button>
            );
          })}
        </div>
      </div>

      {/* zone detail card */}
      <div style={{ marginTop: 10, padding: "12px 14px", minHeight: 88, ...FR }}>
        {sel ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ color: "#F2E4C0", fontSize: 15, ...LB }}>{sel.label}</span>
              <span style={{ color: calm[sel.id] ? "#8FD14F" : "#C74B4F", fontSize: 11, ...LB }}>
                {calm[sel.id] ? "stable" : "needs attention"}
              </span>
            </div>
            <div style={{ color: "#C9B896", fontSize: 12, marginTop: 6, ...LB }}>{sel.note}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={() => setCalm((c) => ({ ...c, [sel.id]: !c[sel.id] }))}
                style={{ padding: "9px 14px", background: "#3A2410", color: "#F2E4C0", border: "3px solid #120A04", boxShadow: "inset 0 -3px 0 #1A0F06", fontSize: 12, cursor: "pointer", ...LB }}
              >
                {calm[sel.id] ? "Un-stabilize" : "Stabilize ✨"}
              </button>
              <span style={{ alignSelf: "center" }}>{soonTag}</span>
            </div>
          </>
        ) : (
          <div style={{ color: "#8A7350", fontSize: 12, ...LB }}>Tap a spot on the board. Nothing here bites.</div>
        )}
      </div>
      <div style={{ marginTop: 10, color: "#6B563B", fontSize: 10, textAlign: "center", ...LB }}>
        Visual shell — real health tasks will calm these zones later.
      </div>
    </Screen>
  );
}

/* ================= INVENTORY & LOG (read-only overviews) ================= */
function listRow(key, name, room, tag, tagColor, spr) {
  // tiny sprite thumbnail: fit the object's sprite into ~28px on its largest side
  const maxDim = 28;
  const w = spr ? spr.w : 0, h = spr ? spr.h : 0;
  const fit = w && h ? Math.min(maxDim / w, maxDim / h) : 0;
  return (
    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 8, padding: "10px 12px", background: "#1A0F06", border: "2px solid #4A2E17" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {spr && (
          <div style={{ flex: "0 0 auto", width: maxDim, height: maxDim, display: "flex", alignItems: "center", justifyContent: "center", background: "#241509", border: "2px solid #4A2E17", overflow: "hidden" }}>
            <div style={{ transform: `scale(${fit})`, transformOrigin: "center", imageRendering: "pixelated" }}>
              <PixelCanvas w={w} h={h} draw={spr.draw} />
            </div>
          </div>
        )}
        <div>
          <div style={{ color: "#F2E4C0", fontSize: 13, ...LB }}>{name}</div>
          <div style={{ color: "#8A7350", fontSize: 10, ...LB }}>{room}</div>
        </div>
      </div>
      <div style={{ color: tagColor, fontSize: 12, ...LB }}>{tag}</div>
    </div>
  );
}

function InventoryScreen({ go, handled, openHandledSheet }) {
  const packed = handled.filter((h) => h.state === "packed");
  return (
    <Screen title="Inventory" icon="📦" onBack={() => go("apartment")}>
      <div style={{ color: "#C9B896", fontSize: 12, ...LB }}>
        Everything boxed for the new place — {packed.length} item{packed.length === 1 ? "" : "s"}.
      </div>
      {packed.length === 0 && (
        <div style={{ color: "#8A7350", fontSize: 12, marginTop: 12, ...LB }}>Nothing packed yet. The boxes are waiting.</div>
      )}
      {packed.map((h, i) => listRow(i, h.name, h.room, "packed", "#B07A3C", h.spr))}
      <button onClick={openHandledSheet} style={{ marginTop: 14, width: "100%", padding: "12px", color: "#FFD97A", fontSize: 12, cursor: "pointer", ...FR, ...LB }}>
        Manage this room's items (unpack / take back)
      </button>
    </Screen>
  );
}

function LogScreen({ go, handled }) {
  const sold = handled.filter((h) => h.state === "sold");
  const donated = handled.filter((h) => h.state === "donated");
  const earned = sold.reduce((s, h) => s + (h.amount || 0), 0);
  return (
    <Screen title="Sold / Donated" icon="💰" onBack={() => go("apartment")}>
      <div style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", ...FR }}>
        <span style={{ color: "#C9B896", fontSize: 12, ...LB }}>Move-sale money so far</span>
        <span style={{ color: "#FFD97A", fontSize: 15, ...LB }}>${earned}</span>
      </div>
      {sold.length === 0 && donated.length === 0 && (
        <div style={{ color: "#8A7350", fontSize: 12, marginTop: 12, ...LB }}>No sales or donations logged yet.</div>
      )}
      {sold.map((h, i) => listRow(`s${i}`, h.name, h.room, `+$${h.amount}`, "#D9A33C", h.spr))}
      {donated.map((h, i) => listRow(`d${i}`, h.name, h.room, "donated ♥", "#B9CEDC", h.spr))}
      <div style={{ marginTop: 14, color: "#6B563B", fontSize: 10, textAlign: "center", ...LB }}>
        Full log with dates & receipts {soonTag}
      </div>
    </Screen>
  );
}

/* ================= STRETCHY STATUS ================= */
function StretchyScreen({ go, tasks }) {
  const catTasks = tasks.filter((t) => isOpen(t) && t.category === "cat");
  const rows = [
    { icon: "🏥", text: "Vet visit around mid-month — meds refill + travel certificate." },
    { icon: "💊", text: "Meds test drive before the trip, so nothing is a surprise." },
    { icon: "🧳", text: "Travel prep: carrier out early so it becomes furniture, not a threat." },
  ];
  return (
    <Screen title="Stretchy" icon="🐈" onBack={() => go("apartment")}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px", ...FR }}>
        <div style={{
          width: 128, height: 128, flex: "0 0 auto", imageRendering: "pixelated",
          backgroundImage: `url(${CAT_SHEET})`,
          // row 25 = "look around"; its last frame (col 3) is the head-turned-toward-you
          // eye-contact pose. 32px frames on an 8-col sheet (256px wide, 1632px tall).
          backgroundPosition: "-96px -800px", backgroundSize: "1024px 6528px",
          border: "3px solid #120A04", backgroundColor: "#3A2410",
        }} />
        <div>
          <div style={{ color: "#FFD97A", fontSize: 16, ...LB }}>Stretchy</div>
          <div style={{ color: "#C9B896", fontSize: 12, marginTop: 4, ...LB }}>Orange. Employed as a cat.</div>
          <div style={{ color: "#8FD14F", fontSize: 11, marginTop: 8, ...LB }}>mood: loafing contentedly</div>
        </div>
      </div>
      <div style={{ color: "#C9B896", fontSize: 12, marginTop: 14, ...LB }}>Coming up for him ({catTasks.length} noted):</div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, padding: "11px 12px", background: "#1A0F06", border: "2px solid #4A2E17" }}>
          <span style={{ fontSize: 16 }}>{r.icon}</span>
          <span style={{ color: "#F2E4C0", fontSize: 12, lineHeight: 1.5, ...LB }}>{r.text}</span>
        </div>
      ))}
      <div style={{ marginTop: 14, color: "#6B563B", fontSize: 10, textAlign: "center", ...LB }}>
        He is not a Tamagotchi. He is doing great. {soonTag}
      </div>
    </Screen>
  );
}

/* ================= SETTINGS ================= */
function SettingsScreen({ go }) {
  const [t, setT] = useState({ sound: true, music: false, haptics: true, motion: false, bigText: false });
  const flip = (k) => setT((s) => ({ ...s, [k]: !s[k] }));
  const rows = [
    ["sound", "Sound effects"], ["music", "Music / ambience"], ["haptics", "Haptics"],
    ["motion", "Reduce motion"], ["bigText", "Larger text"],
  ];
  return (
    <Screen title="Settings" icon="⚙️" onBack={() => go("apartment")}>
      {rows.map(([k, label]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, padding: "12px", background: "#1A0F06", border: "2px solid #4A2E17" }}>
          <span style={{ color: "#F2E4C0", fontSize: 13, ...LB }}>{label} {soonTag}</span>
          {/* a real native checkbox on top of the styled track is what makes
             iOS produce a tiny toggle haptic — purely cosmetic haptics on a
             web button don't fire. The checkbox is visually hidden but drives
             the same `flip` state. */}
          <div style={{ position: "relative", width: 52, height: 26 }}>
            <div style={{
              width: 52, height: 26, padding: 2, border: "3px solid #120A04",
              background: t[k] ? "#5D7C3B" : "#241509", display: "flex", justifyContent: t[k] ? "flex-end" : "flex-start",
              pointerEvents: "none",
            }}>
              <span style={{ width: 16, height: "100%", background: "#EFE7D2", border: "2px solid #120A04", display: "block" }} />
            </div>
            <input
              type="checkbox"
              checked={t[k]}
              onChange={() => flip(k)}
              aria-label={label}
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                margin: 0, padding: 0, opacity: 0, cursor: "pointer",
              }}
            />
          </div>
        </div>
      ))}
      {["Reset save", "Export save", "Import save"].map((label) => (
        <button key={label} disabled style={{
          width: "100%", marginTop: 8, padding: "12px", background: "#241509", color: "#6B563B",
          border: "3px solid #120A04", fontSize: 12, textAlign: "left", ...LB,
        }}>{label} — (soon)</button>
      ))}
      <div style={{ marginTop: 14, color: "#6B563B", fontSize: 10, textAlign: "center", ...LB }}>
        Toggles are visual placeholders — not wired up yet.
      </div>
    </Screen>
  );
}

/* ================= STORAGE (inside cabinets/drawers/closets) ================= */
/* Tapping a storage object on the hub opens this overlay. Shows the items
   inside as a grid of tappable sprites. Tap an item = pack immediately;
   sell/donate are secondary buttons on each card. The cabinet sprite itself
   is rendered as a header so you remember what you're inside. */
function StorageScreen({ go, storageId, room, storageObj, items, contentsState, onPack, onSell, onDonate, busy }) {
  const [itemArtRedrawKey, setItemArtRedrawKey] = useState(0);
  useEffect(() => {
    let mounted = true;
    itemArtReady.then(() => {
      if (mounted) setItemArtRedrawKey((key) => key + 1);
    });
    return () => { mounted = false; };
  }, []);

  if (!storageObj) return null;
  const storageKey = `${room.id}:${storageId}`;
  const remaining = items.filter((it) => {
    const st = contentsState[`${storageKey}:${it.id}`];
    // missing state = fresh/unhandled item, counts toward remaining
    if (!st) return true;
    return !st.packed && !st.sold && !st.donated;
  }).length;

  return (
    <Screen title={storageObj.name} icon="≡" onBack={() => go("apartment")}>
      {/* header: cabinet sprite (scaled to fit) + count of remaining items */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", marginBottom: 12, ...FR }}>
        <div style={{ flex: "0 0 auto", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "#241509", border: "2px solid #4A2E17", overflow: "hidden" }}>
          {(() => {
            const spr = storageObj.spr;
            if (!spr) return null;
            const maxDim = 40;
            const fit = Math.min(maxDim / (spr.w * CELL), maxDim / (spr.h * CELL));
            return (
              <div style={{ transform: `scale(${fit})`, transformOrigin: "center", imageRendering: "pixelated" }}>
                <PixelCanvas w={spr.w} h={spr.h} draw={spr.draw} />
              </div>
            );
          })()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#F2E4C0", fontSize: 14, ...LB }}>{storageObj.name}</div>
          <div style={{ color: remaining > 0 ? "#C9B896" : "#5D7C3B", fontSize: 11, ...LB }}>
            {remaining > 0 ? `${remaining} item${remaining === 1 ? "" : "s"} inside` : "empty — safe to pack the whole thing"}
          </div>
        </div>
      </div>

      {/* item grid: each card shows sprite + name + (state tag or action row) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
        {items.map((it) => {
          const k = `${storageKey}:${it.id}`;
          const st = contentsState[k] || { packed: false, sold: false, soldFor: 0, donated: false };
          const done = st.packed || st.sold || st.donated;
          // sprite thumbnail fit
          const maxDim = 40;
          const fit = it.spr ? Math.min(maxDim / it.spr.w, maxDim / it.spr.h) : 0;
          return (
            <div key={it.id} style={{
              padding: 10, background: done ? "#0F0904" : "#1A0F06", border: "2px solid #4A2E17",
              opacity: done ? 0.5 : 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            }}>
              {it.spr && (
                <div style={{ width: maxDim, height: maxDim, display: "flex", alignItems: "center", justifyContent: "center", background: "#241509", border: "2px solid #4A2E17", overflow: "hidden" }}>
                  <div style={{ transform: `scale(${fit})`, transformOrigin: "center", imageRendering: "pixelated" }}>
                    <PixelCanvas w={it.spr.w} h={it.spr.h} draw={it.spr.draw} redrawKey={itemArtRedrawKey} />
                  </div>
                </div>
              )}
              <div style={{ color: "#F2E4C0", fontSize: 11, textAlign: "center", ...LB }}>{it.name}</div>
              {st.packed && <div style={{ color: "#C9B896", fontSize: 10, ...LB }}>packed</div>}
              {st.sold   && <div style={{ color: "#D9A33C", fontSize: 10, ...LB }}>sold ${st.soldFor}</div>}
              {st.donated && <div style={{ color: "#77974C", fontSize: 10, ...LB }}>donated</div>}
              {!done && (
                <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                  <button onClick={() => onPack(storageId, it.id)} disabled={busy}
                    style={{ flex: 1, padding: "5px 6px", fontSize: 10, cursor: busy ? "not-allowed" : "pointer", color: "#F2E4C0", background: "#3A2410", border: "2px solid #120A04", ...LB }}>
                    📦 Pack
                  </button>
                  <button onClick={() => onSell(storageId, it.id)} disabled={busy || !it.value}
                    title={it.value ? `sell for ~$${it.value}` : "can't sell this"}
                    style={{ flex: 0, padding: "5px 6px", fontSize: 10, cursor: busy || !it.value ? "not-allowed" : "pointer", color: "#FFD97A", background: "#3A2410", border: "2px solid #120A04", ...LB, opacity: it.value ? 1 : 0.4 }}>
                    💰
                  </button>
                  <button onClick={() => onDonate(storageId, it.id)} disabled={busy}
                    style={{ flex: 0, padding: "5px 6px", fontSize: 10, cursor: busy ? "not-allowed" : "pointer", color: "#9CC76F", background: "#3A2410", border: "2px solid #120A04", ...LB }}>
                    🎁
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

/* ================= ROUTER ================= */
export default function ScreenLayer({ screen, go, tasks, setTasks, handled, openHandledSheet, storageId, room, storageObj, storageItems, contentsState, onPackContent, onSellContent, onDonateContent, busy }) {
  if (screen === "apartment") return null;
  if (screen === "menu")      return <MenuScreen go={go} tasks={tasks} />;
  if (screen === "desk")      return <DeskScreen go={go} tasks={tasks} setTasks={setTasks} />;
  if (screen === "health")    return <HealthScreen go={go} />;
  if (screen === "storage")   return <StorageScreen go={go} storageId={storageId} room={room} storageObj={storageObj} items={storageItems} contentsState={contentsState} onPack={onPackContent} onSell={onSellContent} onDonate={onDonateContent} busy={busy} />;
  if (screen === "inventory") return <InventoryScreen go={go} handled={handled} openHandledSheet={openHandledSheet} />;
  if (screen === "log")       return <LogScreen go={go} handled={handled} />;
  if (screen === "stretchy")  return <StretchyScreen go={go} tasks={tasks} />;
  if (screen === "settings")  return <SettingsScreen go={go} />;
  return null;
}
