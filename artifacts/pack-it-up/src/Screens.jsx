import { useEffect, useRef, useState } from "react";
import STRETCHY_ICON from "./assets/Stretchy Icon.png";
import HEALTH_CLIPBOARD from "./assets/health-clipboard.png";
import LANDLINE_PHONE from "./assets/landline-phone.png";
import {
  TASK_CATEGORIES, SAMPLE_JOBS, isOpen, taskPressure,
  PRESSURE_LABELS, PRESSURE_COLORS,
} from "./tasks.js";
import { PixelCanvas } from "./BedroomSlice.jsx";
import {
  getAudioSettings,
  setMusicVolume,
  setSfxVolume,
  playContainerSfx,
  playPhonePickupSfx,
  playPhoneRingSfx,
  stopPhoneRingSfx,
  playPhoneHangupSfx,
} from "./gameAudio.js";
import { clearSave } from "./save.js";
import {
  SESSION_GOALS,
  HEALTH_SESSION_GOALS,
  sessionProgress,
  bumpSession,
} from "./session.js";
import {
  RECEPTIONIST_NAME,
  openerForNudge,
  getNudge,
  bankReply,
  buildQuickChips,
  confirmLine,
  markReminded,
  attendAppointment,
  canAttendZone,
  visitLabel,
  formatApptDay,
  priorityHealthTask,
  activeAppointments,
  daysUntilMove,
} from "./receptionist.js";
import {
  loadShirleySettings,
  saveShirleySettings,
  improvEnabled,
  askShirley,
  applyBookPayload,
  DEFAULT_MODEL,
} from "./receptionistCall.js";

/* ============================================================
   SCREENS — mockup chrome (wood / gold / progress / checklist).
   Apartment stays the hub; overlays share one design language.
   ============================================================ */

export const FR = {
  background: "#241509",
  border: "3px solid #120A04",
  boxShadow: "inset 0 0 0 2px #6B4423, 0 3px 0 #000",
};
export const LB = { fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "0.5px" };
const PAPER = { job: "#E9BFB2", admin: "#B9CEDC", move: "#EBDDBA", health: "#CBDCC2", cat: "#EBD2A8" };
const GOLD_PLATE = {
  background: "linear-gradient(#3A2A12, #2A1C0C)",
  border: "3px solid #120A04",
  boxShadow: "inset 0 0 0 2px #C9942E, 0 3px 0 #000",
};

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
    @keyframes stampTravel {
      0%   { transform: translate(-140px, 90px) rotate(20deg) scale(0.6); opacity: 0; }
      35%  { opacity: 1; }
      70%  { transform: translate(0, 0) rotate(-14deg) scale(1.15); opacity: 1; }
      85%  { transform: translate(0, 0) rotate(-14deg) scale(0.92); }
      100% { transform: translate(0, 0) rotate(-14deg) scale(1); opacity: 0; }
    }
    .stampTravel { animation: stampTravel 420ms cubic-bezier(0.2, 1.2, 0.4, 1) both; }
    @keyframes cardOff  { to { transform: translate(120%, -30px) rotate(14deg); opacity: 0; } }
    @keyframes cardFile { to { transform: translate(70%, 20%) rotate(8deg) scale(0.45); opacity: 0; } }
    @keyframes outboxLand {
      0%   { transform: translateY(-14px) scale(1.08); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes reliefUp {
      0% { opacity: 0; transform: translateY(6px); } 20% { opacity: 1; }
      80% { opacity: 1; } 100% { opacity: 0; transform: translateY(-10px); }
    }
    @keyframes rewardPop {
      0% { opacity: 0; transform: translate(-50%, 8px) scale(0.9); }
      15% { opacity: 1; transform: translate(-50%, 0) scale(1.05); }
      80% { opacity: 1; }
      100% { opacity: 0; transform: translate(-50%, -12px) scale(1); }
    }
    .stampMark { animation: stampIn 320ms cubic-bezier(0.2, 1.4, 0.4, 1) both; }
    .cardOff   { animation: cardOff 460ms ease-in 420ms both; }
    .cardFile  { animation: cardFile 460ms ease-in 420ms both; }
    .outboxLand { animation: outboxLand 380ms cubic-bezier(0.2, 1.2, 0.4, 1) both; }
    .rewardPop { animation: rewardPop 1.8s ease-out both; }
    @keyframes handsetUp {
      from { transform: translateY(10px) rotate(-8deg); opacity: 0.5; }
      to   { transform: translateY(-6px) rotate(0deg); opacity: 1; }
    }
    @keyframes handsetDown {
      from { transform: translateY(-6px); opacity: 1; }
      to   { transform: translateY(14px) rotate(6deg); opacity: 0.4; }
    }
    @keyframes ringPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(201,148,46,0.5); }
      50% { box-shadow: 0 0 0 8px rgba(201,148,46,0); }
    }
    @keyframes receiverRise {
      from { transform: translateY(24px) scale(0.92); opacity: 0; }
      to   { transform: translateY(0) scale(1); opacity: 1; }
    }
    .handsetUp { animation: handsetUp 320ms ease-out both; }
    .handsetDown { animation: handsetDown 280ms ease-in both; }
    .ringPulse { animation: ringPulse 0.9s ease-in-out infinite; }
    .receiverRise { animation: receiverRise 380ms cubic-bezier(0.2, 1.1, 0.4, 1) both; }
  `}</style>
);

export function ProgressBar({ value = 0, height = 12 }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div style={{ width: "100%", height, background: "#120A04", border: "2px solid #4A2E17" }}>
      <div style={{
        width: `${pct}%`, height: "100%",
        background: "linear-gradient(#8FD14F, #5EA032)",
        transition: "width 280ms ease-out",
      }} />
    </div>
  );
}

export function Panel({ children, style, gold }) {
  return (
    <div style={{ padding: "10px 12px", ...(gold ? GOLD_PLATE : FR), ...style }}>
      {children}
    </div>
  );
}

export function ChecklistCard({ items, title = "Today" }) {
  return (
    <div style={{
      padding: "8px 10px", background: "#EFE7D2", border: "3px solid #120A04",
      boxShadow: "2px 2px 0 rgba(0,0,0,0.35)", minWidth: 140, maxWidth: 180,
    }}>
      <div style={{ color: "#3A2018", fontSize: 10, marginBottom: 6, ...LB }}>{title}</div>
      {items.map((it) => (
        <div key={it.id} style={{
          display: "flex", alignItems: "center", gap: 6, marginTop: 4,
          color: it.done ? "#5D7C3B" : "#3A2018", fontSize: 10, ...LB,
        }}>
          <span style={{
            width: 12, height: 12, flex: "0 0 auto", border: "2px solid #120A04",
            background: it.done ? "#8FD14F" : "#EFE7D2",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8,
          }}>{it.done ? "✓" : ""}</span>
          <span style={{ flex: 1, lineHeight: 1.2 }}>{it.label}</span>
          <span style={{ opacity: 0.7 }}>{it.cur}/{it.target}</span>
        </div>
      ))}
    </div>
  );
}

export function RewardToast({ text }) {
  if (!text) return null;
  return (
    <div className="rewardPop" style={{
      position: "fixed", left: "50%", bottom: 88, zIndex: 400,
      padding: "10px 16px", background: "#3A2410", color: "#FFD97A",
      border: "3px solid #120A04", boxShadow: "inset 0 0 0 2px #C9942E, 0 4px 0 #000",
      fontSize: 13, pointerEvents: "none", ...LB,
    }}>
      {text}
    </div>
  );
}

function Screen({ title, icon, onBack, children, bg = "#1A1008", subtitle, progress, progressLabel, checklist, compact = false, flush = false }) {
  const slim = compact || flush;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 250, background: bg, display: "flex", flexDirection: "column",
      animation: "screenIn 200ms ease-out", overflow: "hidden",
    }}>
      {screenCss}
      <div style={{
        flex: "0 0 auto",
        padding: slim
          ? "calc(env(safe-area-inset-top, 0px) + 2px) 6px 2px"
          : "calc(env(safe-area-inset-top, 0px) + 10px) 10px 8px",
        display: "flex", gap: slim ? 4 : 8, alignItems: "center",
      }}>
        <button onClick={onBack} style={{
          padding: slim ? "4px 8px" : "9px 12px",
          color: "#FFD97A", fontSize: slim ? 10 : 12, cursor: "pointer", flex: "0 0 auto", ...FR, ...LB,
        }}>
          ← Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            padding: slim ? "2px 6px" : "8px 12px",
            textAlign: "center", color: "#FFD97A",
            fontSize: slim ? 11 : 14, ...GOLD_PLATE, ...LB,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <span>{icon} {title}</span>
            {slim && progress != null && (
              <span style={{ flex: "0 0 auto", width: 56 }}>
                <ProgressBar value={progress} height={6} />
              </span>
            )}
            {slim && progressLabel ? (
              <span style={{ color: "#8A7350", fontSize: 9 }}>{progressLabel}</span>
            ) : null}
          </div>
          {!slim && (subtitle || progress != null) && (
            <div style={{ marginTop: 6, padding: "6px 8px", ...FR }}>
              {subtitle && (
                <div style={{ color: "#C9B896", fontSize: 10, marginBottom: progress != null ? 5 : 0, ...LB }}>
                  {subtitle}
                </div>
              )}
              {progress != null && (
                <>
                  <ProgressBar value={progress} />
                  {progressLabel && (
                    <div style={{ color: "#8A7350", fontSize: 9, marginTop: 3, textAlign: "right", ...LB }}>
                      {progressLabel}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        {checklist && !slim && (
          <div style={{ flex: "0 0 auto" }}>{checklist}</div>
        )}
      </div>
      <div style={{
        flex: 1, minHeight: 0,
        overflowY: slim ? "hidden" : "auto",
        padding: flush
          ? "0 0 calc(env(safe-area-inset-bottom, 0px) + 4px)"
          : compact
            ? "4px 8px calc(env(safe-area-inset-bottom, 0px) + 8px)"
            : "8px 12px calc(env(safe-area-inset-bottom, 0px) + 16px)",
        display: slim ? "flex" : undefined,
        flexDirection: slim ? "column" : undefined,
      }}>
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
  const soonest = (cats) => {
    const t = tasks.filter((x) => isOpen(x) && cats.includes(x.category));
    if (!t.length) return null;
    return t.slice().sort((a, b) => b.urgency - a.urgency)[0].due;
  };
  const tiles = [
    { key: "desk",      icon: "🗂️", label: "Desk / Admin",    sub: "papers · call Shirley", badge: count(["job", "admin", "move"]), due: soonest(["job", "admin", "move"]) },
    { key: "health",    icon: "🩺", label: "Health / Body",    sub: "use it while covered", badge: count(["health"]), due: soonest(["health"]) },
    { key: "inventory", icon: "📦", label: "Inventory",        sub: "packed items", badge: 0, due: null },
    { key: "log",       icon: "💰", label: "Sold / Donated",   sub: "the money log", badge: 0, due: null },
    { key: "stretchy",  icon: "🐈", label: "Stretchy",         sub: "orange & fine", badge: count(["cat"]), due: soonest(["cat"]) },
    { key: "settings",  icon: "⚙️", label: "Settings",         sub: "sound & such", badge: 0, due: null },
  ];
  const pressurePct = pressure / 3;
  return (
    <Screen
      title="Overview"
      icon="☰"
      onBack={() => go("apartment")}
      subtitle="Pressure — how loud life is right now"
      progress={pressurePct}
      progressLabel={PRESSURE_LABELS[pressure]}
    >
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

/* ================= DESK ================= */
function DeskCard({ task, small, onClick, resolving }) {
  const job = task.jobId ? SAMPLE_JOBS[task.jobId] : null;
  const bg = PAPER[task.category] || "#EBDDBA";
  const cls = resolving
    ? (resolving.mode === "file" || resolving.mode === "stamp" ? (resolving.mode === "file" ? "cardFile" : "cardOff") : "")
    : "";
  const markColor = resolving?.mode === "info" ? "#C9942E"
    : resolving?.mode === "file" ? "#44695B" : "#A3252C";
  const markText = resolving?.mode === "info" ? "NEEDS INFO"
    : resolving?.mode === "file" ? "FILED" : "APPROVED";
  return (
    <div className={cls} onClick={onClick} style={{
      position: "relative", background: bg, border: "2px solid #120A04",
      boxShadow: "3px 3px 0 rgba(0,0,0,0.45)", padding: small ? "7px 8px" : "12px 12px",
      width: small ? 96 : "100%", flex: small ? "0 0 auto" : undefined,
      cursor: onClick ? "pointer" : "default", color: "#3A2018",
    }}>
      {task.needsInfo && !resolving && (
        <div style={{
          position: "absolute", top: 4, right: 4, padding: "1px 4px",
          border: "2px solid #C9942E", color: "#8A5E14", fontSize: 7, background: "rgba(255,255,255,0.5)", ...LB,
        }}>INFO</div>
      )}
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
      {small && [0, 1].map((j) => <div key={j} style={{ height: 3, marginTop: 4, background: "rgba(0,0,0,0.18)", width: `${80 - j * 20}%` }} />)}
      {resolving && resolving.mode !== "info" && (
        <div className="stampMark" style={{
          position: "absolute", top: "28%", left: "8%", padding: "4px 10px",
          border: `4px solid ${markColor}`, color: markColor,
          fontSize: 18, letterSpacing: 2, background: "rgba(255,255,255,0.25)", ...LB,
        }}>
          {markText}
        </div>
      )}
      {resolving && resolving.mode === "info" && (
        <div className="stampMark" style={{
          position: "absolute", top: "28%", left: "8%", padding: "4px 10px",
          border: `4px solid ${markColor}`, color: markColor,
          fontSize: 14, letterSpacing: 1, background: "rgba(255,255,255,0.25)", ...LB,
        }}>
          NEEDS INFO
        </div>
      )}
    </div>
  );
}

/* ================= SHIRLEY / LANDLINE ================= */

function LandlineHotspot({ onPickUp, ringing }) {
  return (
    <button
      type="button"
      onClick={onPickUp}
      title={`Call ${RECEPTIONIST_NAME}`}
      className={ringing ? "ringPulse" : undefined}
      style={{
        position: "absolute", left: 6, bottom: 6, zIndex: 4,
        width: 72, height: 72, padding: 4, cursor: "pointer",
        background: "transparent", border: "none", ...LB,
      }}
    >
      <img
        src={LANDLINE_PHONE}
        alt=""
        draggable={false}
        style={{
          display: "block", width: "100%", height: "100%",
          objectFit: "contain", imageRendering: "pixelated",
          pointerEvents: "none", userSelect: "none",
          filter: ringing ? "brightness(1.15)" : "none",
        }}
      />
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: -12,
        textAlign: "center", color: ringing ? "#FFD97A" : "#C9B896", fontSize: 8, ...LB,
      }}>
        {ringing ? "RING" : "phone"}
      </div>
    </button>
  );
}

function ShirleyCallOverlay({
  phase, // pickup | dial | ringing | talking | hanging
  messages,
  chips,
  waiting,
  draftHint,
  onDial,
  onSend,
  onHangUp,
  onCancelCeremony,
}) {
  const [text, setText] = useState("");
  const threadRef = useRef(null);
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, phase]);

  const submit = (raw) => {
    const t = (raw != null ? raw : text).trim();
    if (!t || waiting) return;
    setText("");
    onSend(t);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300, background: "rgba(18,10,4,0.94)",
      display: "flex", flexDirection: "column", padding: 12,
      paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)", ...LB,
    }}>
      {(phase === "pickup" || phase === "dial" || phase === "ringing") && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div className={phase === "pickup" ? "handsetUp" : phase === "hanging" ? "handsetDown" : "ringPulse"} style={{
            width: 160, height: 160, position: "relative",
          }}>
            <img
              src={LANDLINE_PHONE}
              alt=""
              draggable={false}
              style={{
                display: "block", width: "100%", height: "100%",
                objectFit: "contain", imageRendering: "pixelated",
                pointerEvents: "none", userSelect: "none",
              }}
            />
          </div>
          {phase === "pickup" && (
            <>
              <div style={{ color: "#F2E4C0", fontSize: 14 }}>Handset up.</div>
              <button type="button" onClick={onDial} style={{
                padding: "14px 22px", background: "#EFE7D2", color: "#221306",
                border: "3px solid #120A04", fontSize: 14, cursor: "pointer", ...LB,
              }}>
                Dial {RECEPTIONIST_NAME}
              </button>
              <button type="button" onClick={onCancelCeremony} style={{
                background: "transparent", border: "none", color: "#8A7350", fontSize: 11, cursor: "pointer", ...LB,
              }}>Put down</button>
            </>
          )}
          {phase === "dial" && (
            <div style={{ color: "#C9B896", fontSize: 13 }}>Dialing {RECEPTIONIST_NAME}…</div>
          )}
          {phase === "ringing" && (
            <div style={{ color: "#FFD97A", fontSize: 13 }}>…ringing…</div>
          )}
        </div>
      )}

      {(phase === "talking" || phase === "hanging") && (
        <>
          <div className="receiverRise" style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
            padding: "8px 10px", background: "#2A1709", border: "3px solid #120A04",
          }}>
            <img
              src={LANDLINE_PHONE}
              alt=""
              draggable={false}
              style={{
                width: 44, height: 44, objectFit: "contain",
                imageRendering: "pixelated", flex: "0 0 auto",
                pointerEvents: "none", userSelect: "none",
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ color: "#FFD97A", fontSize: 13 }}>{RECEPTIONIST_NAME}</div>
              <div style={{ color: "#8A7350", fontSize: 10 }}>
                {waiting ? "…" : "doctors office · or whatever"}
              </div>
            </div>
            <button type="button" onClick={onHangUp} style={{
              padding: "8px 10px", background: "#3A1810", color: "#E8C4A8",
              border: "2px solid #120A04", fontSize: 10, cursor: "pointer", ...LB,
            }}>Hang up</button>
          </div>

          <div ref={threadRef} style={{
            flex: 1, minHeight: 160, overflowY: "auto", padding: "8px 6px",
            background: "#1A0F06", border: "3px solid #120A04", marginBottom: 8,
          }}>
            {(messages || []).map((m, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                marginTop: i ? 8 : 0,
              }}>
                <div style={{
                  maxWidth: "88%", padding: "8px 10px",
                  background: m.role === "user" ? "#3A2410" : "#EFE7D2",
                  color: m.role === "user" ? "#F2E4C0" : "#221306",
                  border: "2px solid #120A04", fontSize: 12, lineHeight: 1.35, ...LB,
                }}>
                  {m.role !== "user" && (
                    <div style={{ fontSize: 8, color: "#8A7350", marginBottom: 4 }}>{RECEPTIONIST_NAME}</div>
                  )}
                  {m.text}
                </div>
              </div>
            ))}
            {waiting && (
              <div style={{ color: "#8A7350", fontSize: 11, marginTop: 8 }}>…</div>
            )}
          </div>

          {draftHint && (
            <div style={{ color: "#C9942E", fontSize: 10, marginBottom: 6 }}>{draftHint}</div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {(chips || []).map((c) => (
              <button key={c.id} type="button" disabled={waiting} onClick={() => submit(c.text)} style={{
                padding: "7px 9px", background: "#3A2410", color: "#F2E4C0",
                border: "2px solid #120A04", fontSize: 10, cursor: waiting ? "default" : "pointer", ...LB,
              }}>{c.label}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="Say something…"
              disabled={waiting || phase === "hanging"}
              style={{
                flex: 1, padding: "10px 10px", background: "#EFE7D2", color: "#221306",
                border: "3px solid #120A04", fontSize: 12, ...LB,
              }}
            />
            <button type="button" disabled={waiting || !text.trim()} onClick={() => submit()} style={{
              padding: "10px 14px", background: "#5D7C3B", color: "#F2E4C0",
              border: "3px solid #120A04", fontSize: 11, cursor: "pointer", ...LB,
            }}>Send</button>
          </div>
        </>
      )}
    </div>
  );
}

function DeskScreen({ go, tasks, setTasks, playSfx, session, onSessionBump, rewardToast,
  appointments, setAppointments, phoneNudge, clearPhoneNudge }) {
  const [tray, setTray] = useState("all"); // all | admin | job
  const deskTasks = tasks.filter((t) => isOpen(t) && ["job", "admin", "move"].includes(t.category));
  const filtered = deskTasks.filter((t) => {
    if (tray === "admin") return t.category === "admin" || t.category === "move";
    if (tray === "job") return t.category === "job";
    return true;
  });
  const filed = tasks.filter((t) => t.status === "done" && ["job", "admin", "move"].includes(t.category));
  const doneCount = filed.length;
  const outboxVis = filed.slice(-6);
  const adminCount = deskTasks.filter((t) => t.category === "admin" || t.category === "move").length;
  const jobCount = deskTasks.filter((t) => t.category === "job").length;
  const active = filtered.slice(0, 3);
  const pile = filtered.slice(3);
  const [inspectId, setInspectId] = useState(null);
  const [resolving, setResolving] = useState(null);
  const [relief, setRelief] = useState(null);
  const [outboxBump, setOutboxBump] = useState(0);
  const inspected = filtered.find((t) => t.id === inspectId) || deskTasks.find((t) => t.id === inspectId) || null;
  const [deskNow, setDeskNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setDeskNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* Shirley landline ceremony + call */
  const [phonePhase, setPhonePhase] = useState(null); // null | pickup | dial | ringing | talking | hanging
  const [phoneMsgs, setPhoneMsgs] = useState([]);
  const [callState, setCallState] = useState({ phase: "await_visit", draft: {}, priorityId: null });
  const [phoneWaiting, setPhoneWaiting] = useState(false);
  const [lineSource, setLineSource] = useState(null); // live | script
  const [incomingRing, setIncomingRing] = useState(!!phoneNudge);
  const apptsRef = useRef(appointments);
  apptsRef.current = appointments;
  const callStateRef = useRef(callState);
  callStateRef.current = callState;
  const msgsRef = useRef(phoneMsgs);
  msgsRef.current = phoneMsgs;

  useEffect(() => {
    if (phoneNudge) setIncomingRing(true);
  }, [phoneNudge]);

  useEffect(() => {
    if (!phoneNudge) return;
    if (phoneNudge.kind !== "remind" && phoneNudge.kind !== "overdue") return;
    playPhoneRingSfx(2);
    setIncomingRing(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — ring once when desk opens with nudge

  useEffect(() => () => { stopPhoneRingSfx(); }, []);

  const startTalking = (nudgeOverride) => {
    stopPhoneRingSfx();
    const nudge = nudgeOverride || phoneNudge || getNudge(apptsRef.current, tasks);
    const pri = nudge?.task || priorityHealthTask(tasks, apptsRef.current);
    const days = daysUntilMove();
    const opener = openerForNudge(nudge, apptsRef.current, tasks, days);
    setCallState({
      phase: "await_visit",
      draft: {},
      priorityId: pri?.id || null,
      stall: 0,
      denyCount: 0,
    });
    setPhoneMsgs([{ role: "shirley", text: opener }]);
    setPhonePhase("talking");
    setIncomingRing(false);
    if (nudge?.kind === "remind" && nudge.appt) {
      setAppointments((a) => markReminded(a, nudge.appt.id));
    }
    clearPhoneNudge?.();
  };

  const pickUpPhone = () => {
    playPhonePickupSfx();
    setPhonePhase("pickup");
    setIncomingRing(false);
  };

  const dialShirley = () => {
    setPhonePhase("dial");
    setTimeout(() => {
      setPhonePhase("ringing");
      playPhoneRingSfx(2);
      setTimeout(() => startTalking(phoneNudge || getNudge(apptsRef.current, tasks)), 2200);
    }, 400);
  };

  const cancelCeremony = () => {
    stopPhoneRingSfx();
    playPhoneHangupSfx();
    setPhonePhase(null);
  };

  const hangUp = () => {
    stopPhoneRingSfx();
    playPhoneHangupSfx();
    setPhonePhase("hanging");
    setTimeout(() => {
      setPhonePhase(null);
      setPhoneMsgs([]);
      setCallState({ phase: "await_visit", draft: {}, priorityId: null });
    }, 320);
  };

  const applyBookResult = (result) => {
    if (!result?.ok) return;
    setAppointments(result.appointments);
  };

  const handlePhoneSend = async (userText) => {
    if (phoneWaiting || phonePhase !== "talking") return;
    const nextMsgs = [...msgsRef.current, { role: "user", text: userText }];
    setPhoneMsgs(nextMsgs);
    setPhoneWaiting(true);

    let usedAgent = false;
    if (improvEnabled()) {
      const agent = await askShirley({
        messages: nextMsgs,
        tasks,
        appointments: apptsRef.current,
      });
      if (agent.ok && agent.text) {
        usedAgent = true;
        let appts = apptsRef.current;
        let line = agent.text;
        if (agent.book) {
          const booked = applyBookPayload(appts, tasks, agent.book);
          if (booked?.ok) {
            applyBookResult(booked);
            appts = booked.appointments;
            const task = tasks.find((t) => t.id === booked.appt.taskId);
            if (!/booked|got it|written|locked/i.test(line)) {
              line = `${line} ${confirmLine(booked.appt, task)}`.trim();
            }
          }
        }
        setLineSource("live");
        setPhoneMsgs([...nextMsgs, { role: "shirley", text: line }]);
        setPhoneWaiting(false);
        return;
      }
      console.warn("[Shirley] falling back to script bank:", agent.error);
    }

    if (!usedAgent) {
      const reply = bankReply(
        userText,
        callStateRef.current,
        tasks,
        apptsRef.current,
        daysUntilMove()
      );
      if (reply.appointments) setAppointments(reply.appointments);
      else if (reply.book?.ok) applyBookResult(reply.book);
      setCallState(reply.callState || callStateRef.current);
      setLineSource("script");
      setPhoneMsgs([...nextMsgs, { role: "shirley", text: reply.line }]);
      setPhoneWaiting(false);
      if (reply.hangup) {
        setTimeout(() => hangUp(), 1400);
      }
    }
  };

  const chips = phonePhase === "talking"
    ? buildQuickChips(tasks, appointments, callState)
    : [];
  const draftHint = null; // keep UI clean — no draft/nagging chrome

  const bookedCount = activeAppointments(appointments).length;
  const deskTime = (() => {
    let h = deskNow.getHours();
    const m = deskNow.getMinutes();
    const am = h < 12;
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, "0")}${am ? "am" : "pm"}`;
  })();
  const deskDate = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][deskNow.getDay()]
    + " " + ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][deskNow.getMonth()]
    + " " + deskNow.getDate();
  const moveEnd = new Date(2026, 6, 31);
  const day0 = new Date(deskNow.getFullYear(), deskNow.getMonth(), deskNow.getDate());
  const daysLeft = Math.max(0, Math.round((new Date(moveEnd.getFullYear(), moveEnd.getMonth(), moveEnd.getDate()) - day0) / 86400000));
  const prog = sessionProgress(session, SESSION_GOALS);

  const resolve = (mode) => {
    if (!inspected || resolving) return;
    const id = inspected.id;
    setResolving({ id, mode });
    if ((mode === "stamp" || mode === "info") && playSfx) playSfx("stamp");
    setTimeout(() => {
      if (mode === "info") {
        setTasks((ts) => ts.map((t) => (
          t.id === id
            ? { ...t, needsInfo: true, urgency: Math.min(3, (t.urgency || 1) + 1) }
            : t
        )));
        setResolving(null);
        setInspectId(null);
        setRelief("Needs info — still on the desk.");
        setTimeout(() => setRelief(null), 1600);
        return;
      }
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: "done", needsInfo: false } : t)));
      setResolving(null);
      setInspectId(null);
      setOutboxBump((n) => n + 1);
      if (mode === "file") onSessionBump?.("filed", 1, "Filed +1");
      else onSessionBump?.("stamped", 1, "Approved +1");
      setRelief(mode === "file" ? "Filed — on the outbox pile." : "Approved — on the outbox pile.");
      setTimeout(() => setRelief(null), 1600);
    }, 950);
  };

  const stampBtn = (label, icon, mode, color) => (
    <button onClick={() => resolve(mode)} disabled={!inspected || !!resolving} style={{
      flex: 1, minHeight: 52, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
      background: inspected ? "#3A2410" : "#241509", color: inspected ? color : "#6B563B",
      border: "3px solid #120A04", boxShadow: inspected ? "inset 0 -3px 0 #1A0F06" : "none",
      fontSize: 10, cursor: inspected ? "pointer" : "default", ...LB,
    }}>
      <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>{label}
    </button>
  );

  const trayBtn = (id, label, color, count) => (
    <button onClick={() => { setTray(id); setInspectId(null); }} style={{
      flex: 1, padding: "8px 6px", border: "3px solid #120A04", cursor: "pointer",
      background: tray === id ? color : "#3A2410",
      boxShadow: tray === id ? "inset 0 0 0 2px #120A04" : "none",
      ...LB,
    }}>
      <div style={{ color: tray === id ? "#120A04" : "#F2E4C0", fontSize: 10 }}>{label}</div>
      <div style={{ color: tray === id ? "#3A2018" : "#C9B896", fontSize: 12, marginTop: 2 }}>{count}</div>
    </button>
  );

  return (
    <Screen
      title="Paperwork Desk"
      icon="🗂️"
      onBack={() => go("apartment")}
      bg="#2E1D0E"
      subtitle="Process & file documents"
      progress={prog.pct}
      progressLabel={`${prog.done}/${prog.total} goals`}
      checklist={<ChecklistCard items={prog.items} title="Session" />}
    >
      <RewardToast text={rewardToast} />
      <div style={{
        border: "3px solid #120A04", background: "repeating-linear-gradient(0deg, #5A381F 0 14px, #6E452A 14px 16px)",
        padding: "10px 10px 12px", boxShadow: "inset 0 0 0 2px #3E2413",
      }}>
        {/* trays */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {trayBtn("admin", "ADMIN", "#B9CEDC", adminCount)}
          {trayBtn("job", "APPLICATIONS", "#E9BFB2", jobCount)}
          {trayBtn("all", "ALL", "#EBDDBA", deskTasks.length)}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
          <div style={{ position: "relative", width: 64, height: 52, flex: "0 0 auto" }}>
            {[2, 1, 0].map((i) => (
              <div key={i} style={{
                position: "absolute", left: i * 3, top: i * -3, width: 54, height: 38,
                background: "#EBDDBA", border: "2px solid #120A04",
                transform: `rotate(${i % 2 ? 2 : -3}deg)`, boxShadow: "2px 2px 0 rgba(0,0,0,0.35)",
              }} />
            ))}
            <div style={{ position: "absolute", left: 8, top: 6, fontSize: 9, color: "#3A2018", zIndex: 1, ...LB }}>
              IN<br />+{pile.length}
            </div>
            {/* soft: Stretchy asleep on papers */}
            <div style={{
              position: "absolute", left: -4, bottom: -2, width: 28, height: 18, zIndex: 5,
              background: "#E8944A", border: "2px solid #120A04", borderRadius: "10px 10px 4px 4px",
              boxShadow: "1px 1px 0 rgba(0,0,0,0.3)",
            }} title="Stretchy (asleep)">
              <div style={{ position: "absolute", top: 4, left: 6, width: 4, height: 4, background: "#221306", borderRadius: "50%" }} />
              <div style={{ position: "absolute", top: 4, left: 14, width: 4, height: 4, background: "#221306", borderRadius: "50%" }} />
            </div>
          </div>

          <div style={{
            flex: "1 1 auto", minWidth: 0, border: "2px solid #120A04", background: "#EFE7D2",
            boxShadow: "2px 2px 0 rgba(0,0,0,0.35)", textAlign: "center", padding: "4px 6px 6px",
          }}>
            <div style={{ background: "#A3252C", color: "#F2E4C0", fontSize: 9, padding: "2px 0", ...LB }}>
              {["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][deskNow.getMonth()]}
            </div>
            <div style={{ color: "#221306", fontSize: 20, lineHeight: 1.1, marginTop: 2, ...LB }}>{deskNow.getDate()}</div>
            <div style={{ color: "#5A381F", fontSize: 9, marginTop: 2, ...LB }}>{deskTime}</div>
            <div style={{ color: "#8A4526", fontSize: 8, marginTop: 1, ...LB }}>
              {daysLeft === 0 ? "MOVE DAY" : `${daysLeft}d left`}
            </div>
          </div>

          <div style={{ position: "relative", width: 84, height: 60, flex: "0 0 auto" }}>
            {doneCount === 0 ? (
              <div style={{
                position: "absolute", right: 0, bottom: 0, width: 68, height: 36,
                border: "2px dashed #3E2413", background: "rgba(68,105,91,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#C9B896", fontSize: 9, ...LB,
              }}>OUTBOX</div>
            ) : (
              outboxVis.map((t, i) => {
                const n = outboxVis.length;
                const bg = PAPER[t.category] || "#EBDDBA";
                const isTop = i === n - 1;
                const rot = ((i % 3) - 1) * 3;
                return (
                  <div
                    key={`${t.id}-${isTop ? outboxBump : 0}`}
                    className={isTop ? "outboxLand" : undefined}
                    style={{
                      position: "absolute",
                      right: 4 + (n - 1 - i) * 2,
                      bottom: (n - 1 - i) * 3,
                      width: 66, height: 40, background: bg, border: "2px solid #120A04",
                      transform: `rotate(${rot}deg)`, boxShadow: "2px 2px 0 rgba(0,0,0,0.4)",
                      zIndex: i + 1, padding: "3px 4px", overflow: "hidden",
                    }}
                  >
                    {isTop && (
                      <>
                        <div style={{ fontSize: 7, color: "#3A2018", lineHeight: 1.15, ...LB }}>
                          {(t.jobId && SAMPLE_JOBS[t.jobId]?.title) || t.title}
                        </div>
                        <div style={{
                          position: "absolute", top: 12, left: 3, padding: "1px 3px",
                          border: "2px solid #A3252C", color: "#A3252C", fontSize: 6,
                          background: "rgba(255,255,255,0.35)", transform: "rotate(-8deg)", ...LB,
                        }}>OK</div>
                      </>
                    )}
                  </div>
                );
              })
            )}
            <div style={{
              position: "absolute", right: -2, top: -6, zIndex: 20,
              minWidth: 28, padding: "2px 6px", background: "#44695B", color: "#EFE7D2",
              border: "2px solid #120A04", fontSize: 10, textAlign: "center", ...LB,
            }}>
              {doneCount}
            </div>
            <div style={{
              position: "absolute", left: 0, bottom: -12, width: "100%",
              textAlign: "center", color: "#C9B896", fontSize: 8, ...LB,
            }}>
              {doneCount === 0 ? "outbox" : `${doneCount} filed`}
            </div>
          </div>
        </div>
        <div style={{ height: 8 }} />

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
          {active.map((t, i) => (
            <div key={t.id} style={{ transform: `rotate(${[-2, 1, -1][i]}deg)`, outline: t.id === inspectId ? "3px solid #FFD97A" : "none" }}>
              <DeskCard task={t} small onClick={() => setInspectId(t.id)} />
            </div>
          ))}
          {active.length === 0 && (
            <div style={{ color: "#C9B896", fontSize: 12, padding: "14px 4px", ...LB }}>
              {tray === "all" ? "Desk is clear. Genuinely impressive." : "This tray is empty."}
            </div>
          )}
        </div>

        <div style={{
          marginTop: 8, minHeight: 150, border: "3px solid #120A04", background: "#3E2413",
          boxShadow: "inset 0 0 0 2px #2A1709, inset 0 6px 12px rgba(0,0,0,0.35)", padding: 10,
          display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
        }}>
          {!phonePhase && (
            <LandlineHotspot onPickUp={pickUpPhone} ringing={incomingRing} />
          )}
          {phonePhase && (
            <ShirleyCallOverlay
              phase={phonePhase}
              messages={phoneMsgs}
              chips={chips}
              waiting={phoneWaiting}
              draftHint={draftHint}
              onDial={dialShirley}
              onSend={handlePhoneSend}
              onHangUp={hangUp}
              onCancelCeremony={cancelCeremony}
            />
          )}
          {inspected ? (
            <DeskCard task={inspected} resolving={resolving && resolving.id === inspected.id ? resolving : null} />
          ) : !phonePhase && (
            <div style={{ color: "#8A7350", fontSize: 12, textAlign: "center", ...LB }}>
              Tap a paper above to inspect it.
              <div style={{ marginTop: 6, fontSize: 10, color: "#6B563B" }}>{deskDate} · {deskTime}</div>
              {bookedCount > 0 && (
                <div style={{ marginTop: 6, fontSize: 10, color: "#8FD14F" }}>
                  {bookedCount} appt{bookedCount === 1 ? "" : "s"} on the board
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 10, color: "#C9942E" }}>
                Landline → call {RECEPTIONIST_NAME}
              </div>
            </div>
          )}
          {resolving && (
            <div className="stampTravel" style={{
              position: "absolute", top: "32%", left: "18%", zIndex: 6, pointerEvents: "none",
              width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: "100%", height: "100%", background: "#2A1709",
                border: `5px solid ${resolving.mode === "info" ? "#C9942E" : resolving.mode === "file" ? "#44695B" : "#A3252C"}`,
                borderRadius: 10, boxShadow: "0 4px 0 rgba(0,0,0,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: resolving.mode === "info" ? "#C9942E" : resolving.mode === "file" ? "#44695B" : "#A3252C",
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

      <div style={{ display: "flex", gap: 5, marginTop: 10 }}>
        {stampBtn("Approved", "🟢", "stamp", "#F2E4C0")}
        {stampBtn("Needs Info", "🟡", "info", "#FFD97A")}
        {stampBtn("File it", "📁", "file", "#F2E4C0")}
        <button onClick={() => setInspectId(null)} disabled={!inspected || !!resolving} style={{
          flex: 0.7, minHeight: 52, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
          background: "#241509", color: inspected ? "#C9B896" : "#6B563B", border: "3px solid #120A04",
          fontSize: 10, cursor: inspected ? "pointer" : "default", ...LB,
        }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>↩</span>Back
        </button>
      </div>
      <div style={{ marginTop: 10, color: "#6B563B", fontSize: 10, textAlign: "center", ...LB }}>
        Approved / File → outbox. Needs Info stays on the desk.
      </div>
    </Screen>
  );
}

/* ================= HEALTH / BODY ================= */
const HEALTH_ZONES = [
  { id: "brain",   label: "Brain",   note: "Psychiatry + med renewals", x: "50%", y: "7%",  care: "herbal" },
  { id: "teeth",   label: "Teeth",   note: "Dentist visit",             x: "50%", y: "17%", care: "balm" },
  { id: "heart",   label: "Heart",   note: "Cardiology appointment",    x: "42%", y: "32%", care: "patch" },
  { id: "lymph",   label: "Lymph",   note: "Rheumatology appointment",  x: "63%", y: "36%", care: "balm" },
  { id: "stomach", label: "Stomach", note: "Diet — gentle, steady",     x: "50%", y: "47%", care: "herbal" },
  { id: "skin",    label: "Skin",    note: "Dermatology appointment",   x: "22%", y: "42%", care: "balm" },
  { id: "nerves",  label: "Nerves",  note: "Self-care + healthy habits", x: "78%", y: "42%", care: "patch" },
];

const CARE_ITEMS = [
  { id: "herbal", label: "Calm Herbal", icon: "🌿" },
  { id: "patch",  label: "Patch Kit",   icon: "🩹" },
  { id: "balm",   label: "Soothe Balm", icon: "🧴" },
];

function HealthScreen({ go, tasks, setTasks, session, onSessionBump, rewardToast,
  appointments, setAppointments }) {
  const [zone, setZone] = useState(null);
  const sel = HEALTH_ZONES.find((z) => z.id === zone) || null;
  // Tan silhouette so the figure reads on the clipboard parchment (not cream-on-cream).
  const part = (st) => <div style={{ position: "absolute", background: "#C4A882", border: "3px solid #2A180C", ...st }} />;
  const leave = () => {
    playContainerSfx("mirror_cabinet", "close");
    go("apartment");
  };

  const zoneDone = (zid) => {
    if (session.calmedZones?.[zid]) return true;
    const t = tasks.find((x) => x.zone === zid);
    return t ? t.status === "done" : false;
  };
  const stabilized = HEALTH_ZONES.filter((z) => zoneDone(z.id)).length;
  const prog = sessionProgress(session, HEALTH_SESSION_GOALS);
  const openHealth = tasks.filter((t) => isOpen(t) && t.category === "health");
  const diag = [
    openHealth.length >= 4 ? { c: "#C43B34", t: "Stress high" } : { c: "#5D7C3B", t: "Stress ok" },
    zoneDone("brain") ? { c: "#5D7C3B", t: "Sleep ok" } : { c: "#B9CEDC", t: "Sleep low" },
    zoneDone("stomach") ? { c: "#5D7C3B", t: "Hydration ok" } : { c: "#C9942E", t: "Hydration watch" },
  ];

  const booked = activeAppointments(appointments);

  const stabilizeZone = (zid) => {
    if (zoneDone(zid)) return;
    setTasks((ts) => ts.map((t) => (t.zone === zid ? { ...t, status: "done" } : t)));
    onSessionBump?.("zones", 1, "Well Rested +1", { calmedZone: zid });
  };

  const useCare = (careId) => {
    const target = sel && !zoneDone(sel.id) ? sel
      : HEALTH_ZONES.find((z) => z.care === careId && !zoneDone(z.id));
    if (target && !zoneDone(target.id)) {
      setTasks((ts) => ts.map((t) => (t.zone === target.id ? { ...t, status: "done" } : t)));
      onSessionBump?.("zones", 1, null, { calmedZone: target.id });
    }
    onSessionBump?.("care", 1, "Self-Care +1");
  };

  const finishAppt = (appt) => {
    const gate = canAttendZone(appointments, appt.zone);
    if (!gate || gate.id !== appt.id) return;
    setAppointments((list) => attendAppointment(list, appt.id));
    stabilizeZone(appt.zone);
    onSessionBump?.("appt", 1, "Appointment ✓");
  };

  return (
    <Screen
      compact
      flush
      title="Body Board"
      icon="🩺"
      onBack={leave}
      progress={stabilized / HEALTH_ZONES.length}
      progressLabel={`${stabilized}/${HEALTH_ZONES.length}`}
    >
      <RewardToast text={rewardToast} />

      {/* Top band — only when there are bookings (no empty placeholder) */}
      {booked.length > 0 && (
        <div style={{
          flex: "0 0 auto",
          padding: "2px 6px 4px",
          display: "flex", gap: 4, overflowX: "auto",
        }}>
          {booked.map((a) => {
            const due = canAttendZone(appointments, a.zone)?.id === a.id;
            const task = tasks.find((t) => t.id === a.taskId);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => due && finishAppt(a)}
                disabled={!due}
                style={{
                  flex: "0 0 auto", width: 96, padding: "3px 5px", textAlign: "left",
                  cursor: due ? "pointer" : "default",
                  background: due ? "#EFE7D2" : "#2A1709",
                  border: "2px solid #120A04", ...LB,
                }}
              >
                <div style={{ fontSize: 8, color: "#8A7350" }}>{due ? "ATTEND" : "BOOKED"}</div>
                <div style={{ fontSize: 9, color: due ? "#3A2018" : "#C9B896", marginTop: 1 }}>
                  {visitLabel(task || a.zone)}
                </div>
                <div style={{ fontSize: 8, color: "#5A381F", marginTop: 1 }}>
                  {formatApptDay(a.dueAt)}{a.time ? ` · ${a.time}` : ""}
                  {!due ? " · wait" : " · today"}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Full-width clipboard — flush L/R; short screens clip top/bottom evenly */}
      <div style={{
        position: "relative",
        flex: 1,
        minHeight: 0,
        width: "100%",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: "100%",
          aspectRatio: "682 / 1024",
        }}>
          <img
            src={HEALTH_CLIPBOARD}
            alt=""
            draggable={false}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "fill",
              imageRendering: "pixelated",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
          <div style={{
            position: "absolute",
            left: "14%",
            top: "12%",
            width: "72%",
            height: "78%",
          }}>
            {part({ left: "35%", top: "0%", width: "30%", height: "18%", borderRadius: 14 })}
            {part({ left: "42%", top: "17%", width: "16%", height: "5%" })}
            {part({ left: "25%", top: "21%", width: "50%", height: "36%", borderRadius: 10 })}
            {part({ left: "10%", top: "23%", width: "12%", height: "30%", borderRadius: 9 })}
            {part({ left: "78%", top: "23%", width: "12%", height: "30%", borderRadius: 9 })}
            {part({ left: "28%", top: "58%", width: "16%", height: "34%", borderRadius: 9 })}
            {part({ left: "56%", top: "58%", width: "16%", height: "34%", borderRadius: 9 })}
            {HEALTH_ZONES.map((z) => {
              const ok = zoneDone(z.id);
              return (
                <button key={z.id} onClick={() => setZone(z.id)} style={{
                  position: "absolute", left: z.x, top: z.y, transform: "translate(-50%, -50%)",
                  width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
                  background: "#221306", border: `3px solid ${ok ? "#8FD14F" : zone === z.id ? "#FFD97A" : "#C74B4F"}`,
                  animation: ok ? "zoneCalm 900ms ease-out" : "zonePulse 1.8s ease-in-out infinite",
                  color: ok ? "#8FD14F" : "#C74B4F", fontSize: 12, padding: 0, ...LB,
                }}>{ok ? "✓" : "!"}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom band — zone detail only when selected; thin care + notes */}
      <div style={{ flex: "0 0 auto", padding: "2px 6px 0" }}>
        {sel && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
            padding: "2px 0 2px",
          }}>
            <span style={{ color: "#F2E4C0", fontSize: 12, ...LB }}>{sel.label}</span>
            <span style={{ color: zoneDone(sel.id) ? "#8FD14F" : "#C74B4F", fontSize: 9, ...LB }}>
              {zoneDone(sel.id) ? "stable" : "needs attention"}
            </span>
            <span style={{ color: "#C9B896", fontSize: 9, flex: 1, minWidth: 60, ...LB }}>{sel.note}</span>
            {!zoneDone(sel.id) && (
              <button
                onClick={() => stabilizeZone(sel.id)}
                style={{ padding: "4px 8px", background: "#3A2410", color: "#F2E4C0", border: "2px solid #120A04", fontSize: 10, cursor: "pointer", ...LB }}
              >
                Stabilize ✨
              </button>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 3, marginTop: sel ? 2 : 0 }}>
          {CARE_ITEMS.map((c) => (
            <button key={c.id} onClick={() => useCare(c.id)} style={{
              flex: 1, padding: "4px 2px", background: "#3A2410", color: "#F2E4C0",
              border: "2px solid #120A04", fontSize: 8, cursor: "pointer", lineHeight: 1.15, ...LB,
            }}>
              <div style={{ fontSize: 12 }}>{c.icon}</div>
              {c.label}
            </button>
          ))}
        </div>

        <div style={{
          marginTop: 2, padding: "1px 0", display: "flex",
          gap: 8, alignItems: "center", flexWrap: "nowrap", overflow: "hidden",
        }}>
          {diag.map((d, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, ...LB }}>
              <span style={{ width: 6, height: 6, background: d.c, border: "1px solid #120A04", flex: "0 0 auto" }} />
              <span style={{ color: "#C9B896", fontSize: 9, whiteSpace: "nowrap" }}>{d.t}</span>
            </span>
          ))}
          {prog.items?.length > 0 && (
            <span style={{ marginLeft: "auto", color: "#8A7350", fontSize: 8, ...LB }}>
              Care {prog.items.filter((it) => it.done).length}/{prog.items.length}
            </span>
          )}
        </div>
      </div>
    </Screen>
  );
}

/* ================= INVENTORY & LOG ================= */
function listRow(key, name, room, tag, tagColor, spr) {
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
    <Screen title="Inventory" icon="📦" onBack={() => go("apartment")} subtitle="Everything boxed for the new place">
      <div style={{ color: "#C9B896", fontSize: 12, ...LB }}>
        {packed.length} item{packed.length === 1 ? "" : "s"} packed.
      </div>
      {packed.length === 0 && (
        <div style={{ color: "#8A7350", fontSize: 12, marginTop: 12, ...LB }}>Nothing packed yet. The boxes are waiting.</div>
      )}
      {packed.map((h, i) => listRow(i, h.name, h.room, "packed", "#B07A3C", h.spr))}
      <button onClick={openHandledSheet} style={{ marginTop: 14, width: "100%", padding: "12px", color: "#FFD97A", fontSize: 12, cursor: "pointer", ...FR, ...LB }}>
        Manage this room&apos;s items (unpack / take back)
      </button>
    </Screen>
  );
}

function LogScreen({ go, handled }) {
  const sold = handled.filter((h) => h.state === "sold");
  const donated = handled.filter((h) => h.state === "donated");
  const earned = sold.reduce((s, h) => s + (h.amount || 0), 0);
  return (
    <Screen title="Sold / Donated" icon="💰" onBack={() => go("apartment")} subtitle="Move-sale money so far">
      <Panel gold style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#C9B896", fontSize: 12, ...LB }}>Earned</span>
        <span style={{ color: "#FFD97A", fontSize: 15, ...LB }}>${earned}</span>
      </Panel>
      {sold.length === 0 && donated.length === 0 && (
        <div style={{ color: "#8A7350", fontSize: 12, marginTop: 12, ...LB }}>No sales or donations logged yet.</div>
      )}
      {sold.map((h, i) => listRow(`s${i}`, h.name, h.room, `+$${h.amount}`, "#D9A33C", h.spr))}
      {donated.map((h, i) => listRow(`d${i}`, h.name, h.room, "donated ♥", "#B9CEDC", h.spr))}
    </Screen>
  );
}

/* ================= STRETCHY ================= */
function StretchyScreen({ go, tasks }) {
  const pressure = taskPressure(tasks);
  const hearts = pressure === 0 ? 3 : pressure === 1 ? 3 : pressure === 2 ? 2 : 1;
  const catTasks = tasks.filter((t) => isOpen(t) && t.category === "cat");
  const rows = [
    { icon: "🏥", text: "Vet visit around mid-month — meds refill + travel certificate." },
    { icon: "💊", text: "Meds test drive before the trip, so nothing is a surprise." },
    { icon: "🧳", text: "Travel prep: carrier out early so it becomes furniture, not a threat." },
  ];
  const mood = hearts === 3 ? "loafing contentedly" : hearts === 2 ? "a little watchful" : "needs a quiet corner";
  return (
    <Screen title="Stretchy" icon="🐈" onBack={() => go("apartment")} subtitle="Orange. Employed as a cat.">
      <Panel style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{
          width: 128, height: 128, flex: "0 0 auto", imageRendering: "pixelated",
          backgroundImage: `url(${STRETCHY_ICON})`,
          backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat",
          border: "3px solid #120A04", backgroundColor: "#3A2410",
        }} />
        <div>
          <div style={{ color: "#FFD97A", fontSize: 16, ...LB }}>Stretchy</div>
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            {[1, 2, 3].map((i) => (
              <span key={i} style={{
                fontSize: 18, color: i <= hearts ? "#C43B34" : "#4A2E17",
                textShadow: i <= hearts ? "0 0 0 #120A04" : "none",
              }}>♥</span>
            ))}
          </div>
          <div style={{ color: "#8FD14F", fontSize: 11, marginTop: 8, ...LB }}>mood: {mood}</div>
        </div>
      </Panel>
      <div style={{ color: "#C9B896", fontSize: 12, marginTop: 14, ...LB }}>Coming up for him ({catTasks.length} noted):</div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, padding: "11px 12px", ...FR }}>
          <span style={{ fontSize: 16 }}>{r.icon}</span>
          <span style={{ color: "#F2E4C0", fontSize: 12, lineHeight: 1.5, ...LB }}>{r.text}</span>
        </div>
      ))}
    </Screen>
  );
}

/* ================= SETTINGS ================= */
function VolSlider({ label, value, onChange }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ marginTop: 8, padding: "12px", ...FR }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ color: "#F2E4C0", fontSize: 13, ...LB }}>{label}</span>
        <span style={{ color: "#C9B896", fontSize: 12, ...LB }}>{pct === 0 ? "off" : `${pct}%`}</span>
      </div>
      <input
        type="range" min={0} max={100} step={1} value={pct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        aria-label={label}
        style={{ width: "100%", height: 18, cursor: "pointer", accentColor: "#5D7C3B" }}
      />
    </div>
  );
}

function SettingsScreen({ go }) {
  const audio = getAudioSettings();
  const [musicVol, setMusicVol] = useState(audio.musicVol);
  const [sfxVol, setSfxVolUi] = useState(audio.sfxVol);
  const shirleyBoot = loadShirleySettings();
  const [apiKey, setApiKey] = useState(shirleyBoot.apiKey);
  const [model, setModel] = useState(shirleyBoot.model);
  const [improv, setImprov] = useState(shirleyBoot.improv);
  const [t, setT] = useState({ haptics: true, motion: false, bigText: false });
  const flip = (k) => setT((s) => ({ ...s, [k]: !s[k] }));
  const soonRows = [
    ["haptics", "Haptics"],
    ["motion", "Reduce motion"],
    ["bigText", "Larger text"],
  ];
  const persistShirley = (patch) => {
    const next = saveShirleySettings(patch);
    setApiKey(next.apiKey);
    setModel(next.model);
    setImprov(next.improv);
  };
  return (
    <Screen title="Settings" icon="⚙️" onBack={() => go("apartment")} subtitle="Sound & such">
      <VolSlider label="Music / ambience" value={musicVol} onChange={(v) => { setMusicVol(v); setMusicVolume(v); }} />
      <VolSlider label="Sound effects" value={sfxVol} onChange={(v) => { setSfxVolUi(v); setSfxVolume(v); }} />

      <Panel style={{ marginTop: 10 }}>
        <div style={{ color: "#FFD97A", fontSize: 12, marginBottom: 8, ...LB }}>{RECEPTIONIST_NAME} (OpenRouter)</div>
        <div style={{ color: "#8A7350", fontSize: 10, marginBottom: 8, ...LB }}>
          Paste your key — improv turns on automatically. Replies can take a few seconds on free models.
        </div>
        <label style={{ display: "block", color: "#C9B896", fontSize: 10, marginBottom: 4, ...LB }}>API key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onBlur={() => persistShirley({ apiKey, model, improv: apiKey.trim() ? true : false })}
          placeholder="sk-or-…"
          style={{
            width: "100%", boxSizing: "border-box", padding: "10px", marginBottom: 8,
            background: "#1A0F06", color: "#F2E4C0", border: "2px solid #4A2E17", fontSize: 12, ...LB,
          }}
        />
        <label style={{ display: "block", color: "#C9B896", fontSize: 10, marginBottom: 4, ...LB }}>Free model slug</label>
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          onBlur={() => persistShirley({ apiKey, model, improv })}
          placeholder={DEFAULT_MODEL}
          style={{
            width: "100%", boxSizing: "border-box", padding: "10px", marginBottom: 8,
            background: "#1A0F06", color: "#F2E4C0", border: "2px solid #4A2E17", fontSize: 11, ...LB,
          }}
        />
        <button
          type="button"
          onClick={() => persistShirley({ apiKey, model, improv: apiKey.trim() ? (improv || true) : false })}
          style={{
            width: "100%", marginBottom: 10, padding: "10px", background: "#3A2410", color: "#FFD97A",
            border: "3px solid #120A04", fontSize: 12, cursor: "pointer", ...LB,
          }}
        >
          Save Shirley settings
        </button>
        <div style={{ color: improv && apiKey.trim() ? "#8FD14F" : "#C9942E", fontSize: 10, marginBottom: 8, ...LB }}>
          {apiKey.trim()
            ? (improv ? "Status: live (OpenRouter on)" : "Status: key saved, improv off")
            : "Status: offline script bank"}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#F2E4C0", fontSize: 12, ...LB }}>Improv dialogue</span>
          <div style={{ position: "relative", width: 52, height: 26 }}>
            <div style={{
              width: 52, height: 26, padding: 2, border: "3px solid #120A04",
              background: improv && apiKey.trim() ? "#5D7C3B" : "#241509",
              display: "flex", justifyContent: improv && apiKey.trim() ? "flex-end" : "flex-start",
              pointerEvents: "none",
            }}>
              <span style={{ width: 16, height: "100%", background: "#EFE7D2", border: "2px solid #120A04", display: "block" }} />
            </div>
            <input
              type="checkbox"
              checked={!!(improv && apiKey.trim())}
              onChange={() => {
                const next = !(improv && apiKey.trim());
                persistShirley({ apiKey, model, improv: next && !!apiKey.trim() });
              }}
              aria-label="Improv dialogue"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", margin: 0, padding: 0, opacity: 0, cursor: "pointer" }}
            />
          </div>
        </div>
      </Panel>

      {soonRows.map(([k, label]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, padding: "12px", ...FR }}>
          <span style={{ color: "#F2E4C0", fontSize: 13, ...LB }}>{label} {soonTag}</span>
          <div style={{ position: "relative", width: 52, height: 26 }}>
            <div style={{
              width: 52, height: 26, padding: 2, border: "3px solid #120A04",
              background: t[k] ? "#5D7C3B" : "#241509", display: "flex", justifyContent: t[k] ? "flex-end" : "flex-start",
              pointerEvents: "none",
            }}>
              <span style={{ width: 16, height: "100%", background: "#EFE7D2", border: "2px solid #120A04", display: "block" }} />
            </div>
            <input type="checkbox" checked={t[k]} onChange={() => flip(k)} aria-label={label}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", margin: 0, padding: 0, opacity: 0, cursor: "pointer" }} />
          </div>
        </div>
      ))}
      {["Export save", "Import save"].map((label) => (
        <button key={label} disabled style={{
          width: "100%", marginTop: 8, padding: "12px", background: "#241509", color: "#6B563B",
          border: "3px solid #120A04", fontSize: 12, textAlign: "left", ...LB,
        }}>{label} — (soon)</button>
      ))}
      <button
        type="button"
        onClick={() => {
          if (!window.confirm("Wipe packing progress, coins, minutes, and task status? Audio settings stay.")) return;
          // clearSave suspends further writes so the PackItUp unmount flush
          // cannot rewrite the old in-memory save over the wipe.
          clearSave();
          window.location.reload();
        }}
        style={{
          width: "100%", marginTop: 8, padding: "12px", background: "#3A1810", color: "#E8C4A8",
          border: "3px solid #120A04", fontSize: 12, textAlign: "left", cursor: "pointer", ...LB,
        }}
      >
        Reset save — wipe progress
      </button>
      <div style={{ marginTop: 14, color: "#6B563B", fontSize: 10, textAlign: "center", ...LB }}>
        Drag a slider to 0 to mute that channel — music and SFX are independent.
      </div>
    </Screen>
  );
}

/* ================= ROUTER ================= */
export default function ScreenLayer({
  screen, go, tasks, setTasks, handled, openHandledSheet, busy, playSfx,
  session, onSessionBump, rewardToast,
  appointments, setAppointments, phoneNudge, clearPhoneNudge,
}) {
  if (screen === "apartment") return null;
  if (screen === "menu")      return <MenuScreen go={go} tasks={tasks} />;
  if (screen === "desk")      return (
    <DeskScreen go={go} tasks={tasks} setTasks={setTasks} playSfx={playSfx}
      session={session} onSessionBump={onSessionBump} rewardToast={rewardToast}
      appointments={appointments || []} setAppointments={setAppointments}
      phoneNudge={phoneNudge} clearPhoneNudge={clearPhoneNudge} />
  );
  if (screen === "health")    return (
    <HealthScreen go={go} tasks={tasks} setTasks={setTasks}
      session={session} onSessionBump={onSessionBump} rewardToast={rewardToast}
      appointments={appointments || []} setAppointments={setAppointments} />
  );
  if (screen === "inventory") return <InventoryScreen go={go} handled={handled} openHandledSheet={openHandledSheet} />;
  if (screen === "log")       return <LogScreen go={go} handled={handled} />;
  if (screen === "stretchy")  return <StretchyScreen go={go} tasks={tasks} />;
  if (screen === "settings")  return <SettingsScreen go={go} />;
  return null;
}
