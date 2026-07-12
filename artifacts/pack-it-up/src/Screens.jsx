import { useEffect, useRef, useState } from "react";
import STRETCHY_ICON from "./assets/Stretchy Icon.png";
import HEALTH_CLIPBOARD from "./assets/health-clipboard.png";
import LANDLINE_PHONE from "./assets/landline-phone.png";
import MOVE_ROW from "./assets/items/task_card_assets/horizontal/move_row_card.png";
import JOB_ROW from "./assets/items/task_card_assets/horizontal/job_row_card.png";
import ADMIN_ROW from "./assets/items/task_card_assets/horizontal/admin_row_card.png";
import HEALTH_ROW from "./assets/items/task_card_assets/horizontal/health_row_card.png";
import STRETCHY_ROW from "./assets/items/task_card_assets/horizontal/stretchy_row_card.png";
import HOUSING_ROW from "./assets/items/task_card_assets/horizontal/housing_row_card.png";
import MOVE_FULL from "./assets/items/task_card_assets/vertical/move_full_card.png";
import JOB_FULL from "./assets/items/task_card_assets/vertical/job_full_card.png";
import ADMIN_FULL from "./assets/items/task_card_assets/vertical/admin_full_card.png";
import HEALTH_FULL from "./assets/items/task_card_assets/vertical/health_full_card.png";
import STRETCHY_FULL from "./assets/items/task_card_assets/vertical/stretchy_full_card.png";
import HOUSING_FULL from "./assets/items/task_card_assets/vertical/housing_full_card.png";
import {
  TASK_CATEGORIES, SAMPLE_JOBS, isOpen, taskPressure, isHardOverdue,
  PRESSURE_LABELS, PRESSURE_COLORS,
  doorForTask, makeQuickTask, refreshDailyHousingTasks,
  tasksAfterBooking, tasksAfterAttend,
} from "./tasks.js";
import {
  ensureDailyDeal, handTasks, offerTasks, dealProgress, toggleDealPick,
} from "./schedule.js";
import { PixelCanvas } from "./BedroomSlice.jsx";
import {
  getAudioSettings,
  setMusicVolume,
  setSfxVolume,
  playContainerSfx,
  playPhonePickupSfx,
  playPhoneRotaryDial,
  playPhoneAnswerSfx,
  playPhoneRingPattern,
  stopPhoneRingSfx,
  stopPhoneReceiverLoop,
  playPhoneHangupSfx,
  PHONE_RING_ON_MS,
  PHONE_RING_GAP_MS,
  setPhoneMusicDuck,
  startPhoneIncomingRingtone,
  stopPhoneIncomingRingtone,
  PHONE_SFX_AFTER_DUCK_MS,
  onIncomingRingPulse,
} from "./gameAudio.js";
import { clearSave } from "./save.js";
import {
  SESSION_GOALS,
  HEALTH_SESSION_GOALS,
  HOUSING_SESSION_GOALS,
  sessionProgress,
  bumpSession,
} from "./session.js";
import { DATE_TRIGGERS, daysUntil } from "./movePhase.js";
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
const PAPER = { job: "#E9BFB2", admin: "#B9CEDC", move: "#EBDDBA", health: "#CBDCC2", cat: "#EBD2A8", housing: "#E8C9A0" };

/** Pixel task-card art — cat maps to Stretchy sheet. */
export const CARD_ROW = {
  move: MOVE_ROW, job: JOB_ROW, admin: ADMIN_ROW, health: HEALTH_ROW,
  stretchy: STRETCHY_ROW, cat: STRETCHY_ROW, housing: HOUSING_ROW,
};
export const CARD_FULL = {
  move: MOVE_FULL, job: JOB_FULL, admin: ADMIN_FULL, health: HEALTH_FULL,
  stretchy: STRETCHY_FULL, cat: STRETCHY_FULL, housing: HOUSING_FULL,
};

const CARD_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function fmtCardDate(v) {
  if (!v) return "";
  const s = String(v).trim();
  if (/^(Today|Tomorrow)$/i.test(s)) return s;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${CARD_MONTHS[+iso[2] - 1]} ${+iso[3]}`;
  const mon = s.match(/^([A-Za-z]{3})\s+(\d{1,2})/);
  if (mon) return `${mon[1]} ${mon[2]}`;
  return s.slice(0, 8);
}

function clampPips(n) {
  return Math.min(3, Math.max(0, Number(n) || 0));
}

/** Absolute pip centers as % of card — measured from the PNGs. */
const H_PIP = {
  effort: [[66.7, 74.7], [70.5, 74.7], [74.4, 74.7]],
  importance: [[87.8, 74.7], [91.7, 74.7], [95.2, 74.7]],
  size: 1.85, // % of card width
};
const V_PIP = {
  effort: [[19.8, 16.7], [27.6, 16.7], [35.4, 16.7]],
  importance: [[20.2, 86.6], [28.0, 86.6], [35.6, 86.6]],
  size: 4.4,
};

/** Fill hollow circles baked into the art — centers are % of card box. */
function BubblePips({ filled, centers, sizePct }) {
  const n = clampPips(filled);
  return (
    <>
      {centers.map(([x, y], i) => (
        i < n ? (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: `${sizePct}%`,
              aspectRatio: "1",
              borderRadius: "50%",
              background: "#1A1008",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />
        ) : null
      ))}
    </>
  );
}

/** Board / draw-pile row — PNG chrome + title / dates / pips overlaid. */
export function HorizontalTaskCard({ task, dimmed = false, style }) {
  const src = CARD_ROW[task?.category] || CARD_ROW.admin;
  const effort = clampPips(task?.effort || 1) || 1;
  const importance = clampPips(task?.criticality || 1) || 1;
  return (
    <div style={{
      position: "relative", width: "100%", lineHeight: 0,
      opacity: dimmed ? 0.42 : 1, filter: dimmed ? "grayscale(0.35)" : "none",
      ...style,
    }}>
      <img
        src={src}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "auto", display: "block", imageRendering: "pixelated" }}
      />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", left: "4%", right: "4%", top: "24%", height: "30%",
          color: "#1A1008", fontSize: 12, lineHeight: 1.15, overflow: "hidden", textAlign: "left", ...LB,
        }}>
          {task?.title || ""}
        </div>
        {/* Date values sit on the TARGET / LATEST underlines in the footer */}
        <div style={{
          position: "absolute", left: "19%", top: "71%", width: "10%",
          color: "#1A1008", fontSize: 9, lineHeight: 1, overflow: "hidden", whiteSpace: "nowrap", ...LB,
        }}>{fmtCardDate(task?.targetDate || task?.due)}</div>
        <div style={{
          position: "absolute", left: "48%", top: "71%", width: "10%",
          color: "#1A1008", fontSize: 9, lineHeight: 1, overflow: "hidden", whiteSpace: "nowrap", ...LB,
        }}>{fmtCardDate(task?.latestDate)}</div>
        <BubblePips filled={effort} centers={H_PIP.effort} sizePct={H_PIP.size} />
        <BubblePips filled={importance} centers={H_PIP.importance} sizePct={H_PIP.size} />
      </div>
    </div>
  );
}

/**
 * Vertical “real card” — hand fan / detail peek.
 * Natural PNG aspect (no stretch) so % overlays stay locked to art.
 */
export function VerticalTaskCard({
  task, width = 76, bound = false, selected = false, compact = false, onClick, style,
}) {
  const src = CARD_FULL[task?.category] || CARD_FULL.admin;
  const effort = clampPips(task?.effort || 1) || 1;
  const importance = clampPips(task?.criticality || 1) || 1;
  const titlePx = compact ? Math.max(5, Math.round(width * 0.10)) : Math.max(8, Math.round(width * 0.11));
  const metaPx = compact ? Math.max(4, Math.round(width * 0.075)) : Math.max(7, Math.round(width * 0.085));
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      style={{
        position: "relative", width, height: "auto", padding: 0, margin: 0,
        border: "none",
        outline: selected ? "3px solid #FFD97A" : "none",
        outlineOffset: "-2px",
        background: "transparent", cursor: onClick ? "pointer" : "default",
        boxShadow: selected ? "0 0 0 1px #120A04" : "2px 2px 0 rgba(0,0,0,0.4)",
        overflow: "hidden", lineHeight: 0, displayAlign: "left", ...style,
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "auto", display: "block", imageRendering: "pixelated", pointerEvents: "none" }}
      />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {bound && (
          <div style={{
            position: "absolute", top: "2%", right: "4%", padding: "1px 3px",
            border: "1px solid #A3252C", color: "#A3252C", fontSize: Math.max(5, metaPx),
            background: "rgba(255,248,235,0.85)", lineHeight: 1, ...LB,
          }}>B</div>
        )}
        <BubblePips filled={effort} centers={V_PIP.effort} sizePct={V_PIP.size} />
        {/* Title field box ~21–35% */}
        <div style={{
          position: "absolute", left: "9%", right: "9%", top: "22%", height: compact ? "14%" : "12%",
          color: "#1A1008", fontSize: titlePx, lineHeight: 1.1, overflow: "hidden", textAlign: "left", ...LB,
        }}>
          {task?.title || ""}
        </div>
        {!compact && (
          <>
            <div style={{
              position: "absolute", left: "40%", top: "37%", width: "48%",
              color: "#1A1008", fontSize: metaPx, lineHeight: 1, overflow: "hidden", whiteSpace: "nowrap", ...LB,
            }}>{fmtCardDate(task?.targetDate || task?.due)}</div>
            <div style={{
              position: "absolute", left: "40%", top: "42%", width: "48%",
              color: "#1A1008", fontSize: metaPx, lineHeight: 1, overflow: "hidden", whiteSpace: "nowrap", ...LB,
            }}>{fmtCardDate(task?.latestDate)}</div>
            {(task?.notes || task?.detail) && (
              <div style={{
                position: "absolute", left: "10%", right: "10%", top: "50%", height: "28%",
                color: "#3A2018", fontSize: metaPx, lineHeight: 1.15, overflow: "hidden", textAlign: "left", ...LB,
              }}>{task.notes || task.detail}</div>
            )}
          </>
        )}
        {compact && (
          <div style={{
            position: "absolute", left: "10%", right: "10%", top: "38%",
            color: "#3A2018", fontSize: metaPx, lineHeight: 1, overflow: "hidden", whiteSpace: "nowrap", ...LB,
          }}>{fmtCardDate(task?.targetDate || task?.due) || "—"}</div>
        )}
        <BubblePips filled={importance} centers={V_PIP.importance} sizePct={V_PIP.size} />
      </div>
    </Tag>
  );
}

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
    @keyframes phoneRattle {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      12% { transform: translate(2px, -1px) rotate(-2deg); }
      24% { transform: translate(-2px, 1px) rotate(2deg); }
      36% { transform: translate(2px, 1px) rotate(-1.5deg); }
      48% { transform: translate(-1px, -2px) rotate(2deg); }
      60% { transform: translate(1px, 1px) rotate(-2deg); }
      72% { transform: translate(-2px, 0) rotate(1deg); }
      84% { transform: translate(1px, -1px) rotate(-1deg); }
    }
    @keyframes ringArcs {
      0%, 100% { opacity: 0.35; transform: scale(0.92); }
      40% { opacity: 1; transform: scale(1.06); }
      70% { opacity: 0.7; transform: scale(1.02); }
    }
    @keyframes receiverRise {
      from { transform: translateY(24px) scale(0.92); opacity: 0; }
      to   { transform: translateY(0) scale(1); opacity: 1; }
    }
    .handsetUp { animation: handsetUp 320ms ease-out both; }
    .handsetDown { animation: handsetDown 280ms ease-in both; }
    .phoneRattle { animation: phoneRattle 0.28s linear infinite; transform-origin: 50% 70%; }
    .ringArcs { animation: ringArcs 0.9s ease-in-out infinite; transform-origin: left center; pointer-events: none; }
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
    { key: "board",     icon: "📋", label: "Command Board",  sub: "what matters today", badge: 0, due: null, wide: true },
    { key: "desk",      icon: "🗂️", label: "Desk / Admin",    sub: "papers · housing · Shirley", badge: count(["job", "admin", "move", "housing"]), due: soonest(["job", "admin", "move", "housing"]) },
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
            position: "relative", minHeight: t.wide ? 72 : 96, display: "flex", flexDirection: "column",
            alignItems: "flex-start", justifyContent: "flex-end", gap: 2, padding: "10px 12px",
            cursor: "pointer", textAlign: "left", gridColumn: t.wide ? "1 / -1" : undefined, ...FR, ...LB,
          }}>
            <span style={{ fontSize: t.wide ? 20 : 24, marginBottom: 4 }}>{t.icon}</span>
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

/* ================= COMMAND BOARD + LEDGER ================= */
const EFFORT_DOT = (n) => "●".repeat(Math.min(3, Math.max(1, n || 1))) + "○".repeat(Math.max(0, 3 - Math.min(3, Math.max(1, n || 1))));

function CriticalStrip() {
  const today = new Date();
  const rows = DATE_TRIGGERS.filter((t) => t.critical).slice(0, 5);
  return (
    <div style={{
      marginBottom: 10, padding: "8px 10px", background: "#EFE7D2", border: "2px solid #120A04",
      boxShadow: "2px 2px 0 rgba(0,0,0,0.35)",
    }}>
      <div style={{ color: "#8A4526", fontSize: 9, marginBottom: 4, ...LB }}>Critical path</div>
      {rows.map((t) => {
        const d = daysUntil(t.date, today);
        const hot = d != null && d <= 4 && d >= 0;
        const past = d != null && d < 0;
        return (
          <div key={t.id} style={{
            display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10, marginTop: 2,
            color: past ? "#8A7350" : hot ? "#A3252C" : "#3A2018", ...LB,
          }}>
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span>
            <span>{t.date.slice(5).replace("-", "/")}</span>
          </div>
        );
      })}
    </div>
  );
}

function BoardScreen({ go, tasks, setTasks, session, onSessionBump, rewardToast }) {
  const energy = session?.energy || null;
  const deal = session?.dailyDeal;
  const picks = energy && deal ? handTasks(tasks, deal) : [];
  const offers = energy && deal ? offerTasks(tasks, deal) : [];
  const progress = dealProgress(deal);
  const [focusId, setFocusId] = useState(null);
  const handRef = useRef(null);
  const [handW, setHandW] = useState(300);

  useEffect(() => {
    const el = handRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const measure = () => setHandW(Math.max(180, el.clientWidth || 300));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [energy, picks.length]);

  const markDone = (id) => {
    setTasks((ts) => refreshDailyHousingTasks(
      ts.map((t) => (t.id === id ? { ...t, status: "done" } : t))
    ));
    onSessionBump?.("cleared", 1, "Cleared +1");
    if (focusId === id) setFocusId(null);
  };
  const pickEnergy = (id) => {
    setFocusId(null);
    onSessionBump?.("energy", 0, null, { energy: id, dealTasks: tasks });
  };
  const toggleOffer = (id) => {
    onSessionBump?.("dealPick", 0, null, { toggleDealId: id });
  };
  const drawLabel = progress.chooseNeeded > 0
    ? `Draw (${progress.remaining})`
    : "Draw (optional)";
  const focus = picks.find((t) => t.id === focusId) || null;

  /** Casino-dealer spread: fill left→right, mild arc, stay on-screen. */
  const fanLayout = (n, i, width) => {
    const cardW = 78;
    const pad = 4;
    const avail = Math.max(width - pad * 2, cardW);
    if (n <= 1) return { left: pad, rot: -3, lift: 0 };
    const maxTravel = avail - cardW;
    const step = Math.max(28, Math.min(62, maxTravel / (n - 1)));
    const left = pad + i * step;
    const t = i / (n - 1);
    const rot = -8 + t * 16;
    const lift = Math.sin(t * Math.PI) * 6;
    return { left, rot, lift };
  };
  const handCardH = Math.round(78 * (487 / 290));

  return (
    <Screen
      title="Command Board"
      icon="📋"
      onBack={() => go("menu")}
      subtitle={energy ? "Draw · then play your hand" : "Running on — pick one"}
      bg="#2A1A0C"
      compact
    >
      <RewardToast text={rewardToast} />
      <CriticalStrip />
      {!energy ? (
        <div style={{ ...FR, padding: 12, marginBottom: 10 }}>
          <div style={{ color: "#FFD97A", fontSize: 12, marginBottom: 8, ...LB }}>Running on:</div>
          {[
            ["fumes", "Fumes", "bound must-dos only — optional draws if useful"],
            ["steady", "Steady", "bound + draw 2 more from the offer deck"],
            ["full", "Full steam", "bound + draw 4 more from the offer deck"],
          ].map(([id, label, sub]) => (
            <button
              key={id}
              type="button"
              onClick={() => pickEnergy(id)}
              style={{
                width: "100%", textAlign: "left", marginBottom: 6, padding: "10px 12px",
                background: "#3A2410", color: "#F2E4C0", border: "3px solid #120A04", cursor: "pointer", ...LB,
              }}
            >
              <div style={{ fontSize: 13 }}>{label}</div>
              <div style={{ color: "#8A7350", fontSize: 10, marginTop: 2 }}>{sub}</div>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 8 }}>
          <div style={{ color: "#C9B896", fontSize: 10, flex: "0 0 auto", ...LB }}>
            Energy: {energy === "fumes" ? "Fumes" : energy === "full" ? "Full steam" : "Steady"}
            {deal?.fixedDay ? " · fixed day" : ""}
            {" · "}
            <button type="button" onClick={() => { setFocusId(null); onSessionBump?.("energy", 0, null, { energy: null, clearDeal: true }); }}
              style={{ background: "none", border: "none", color: "#8A7350", cursor: "pointer", padding: 0, ...LB }}>
              change
            </button>
          </div>

          {/* TOP — offer deck */}
          <div style={{
            ...FR, padding: 10, flex: "1 1 auto", minHeight: 120, overflowY: "auto",
          }}>
            <div style={{
              display: "flex", alignItems: "baseline", justifyContent: "space-between",
              marginBottom: 8, gap: 8,
            }}>
              <div style={{ color: "#FFD97A", fontSize: 14, ...LB }}>{drawLabel}</div>
              <div style={{ color: "#8A7350", fontSize: 9, ...LB }}>
                {offers.length} in deck · urgency
              </div>
            </div>
            {deal?.fixedDay && (
              <div style={{ color: "#E8C4A8", fontSize: 10, marginBottom: 8, ...LB }}>
                Fixed day — bound cards already spoken for.
              </div>
            )}
            {offers.length === 0 ? (
              <div style={{ color: "#8A7350", fontSize: 11, ...LB }}>No extras to draw right now.</div>
            ) : offers.map((t) => (
              <div key={t.id} style={{
                display: "flex", gap: 8, alignItems: "center", marginBottom: 8,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <HorizontalTaskCard task={t} dimmed={!!t.picked} />
                </div>
                <button type="button" onClick={() => toggleOffer(t.id)} style={{
                  padding: "10px 10px", flex: "0 0 auto", alignSelf: "stretch",
                  background: t.picked ? "#3A1810" : "#5D7C3B",
                  color: "#F2E4C0", border: "2px solid #120A04",
                  fontSize: 11, cursor: "pointer", ...LB,
                }}>{t.picked ? "Remove" : "Draw"}</button>
              </div>
            ))}
          </div>

          {/* Focused hand card actions */}
          {focus && (
            <div style={{
              ...FR, padding: "8px 10px", flex: "0 0 auto",
              display: "flex", gap: 6, alignItems: "center",
            }}>
              <div style={{ flex: 1, minWidth: 0, color: "#F2E4C0", fontSize: 11, ...LB }}>
                {focus.bound ? "BOUND · " : ""}{focus.title}
              </div>
              <button type="button" onClick={() => go(doorForTask(focus))} style={{
                padding: "6px 8px", background: "#3A2410", color: "#FFD97A",
                border: "2px solid #120A04", fontSize: 10, cursor: "pointer", ...LB,
              }}>Go</button>
              <button type="button" onClick={() => markDone(focus.id)} style={{
                padding: "6px 8px", background: "#5D7C3B", color: "#F2E4C0",
                border: "2px solid #120A04", fontSize: 10, cursor: "pointer", ...LB,
              }}>Done</button>
            </div>
          )}

          {/* BOTTOM — dealer spread, fills left → right */}
          <div style={{ flex: "0 0 auto" }}>
            <div style={{ color: "#FFD97A", fontSize: 10, marginBottom: 4, ...LB }}>
              Your hand · tap a card
            </div>
            <div
              ref={handRef}
              style={{
                position: "relative",
                width: "100%",
                height: picks.length ? handCardH + 10 : 48,
                marginBottom: 4,
                overflow: "visible",
              }}
            >
              {picks.length === 0 ? (
                <div style={{ color: "#8A7350", fontSize: 11, paddingTop: 12, ...LB }}>
                  Empty hand — draw from the deck above.
                </div>
              ) : picks.map((t, i) => {
                const pos = fanLayout(picks.length, i, handW);
                const on = focusId === t.id;
                return (
                  <VerticalTaskCard
                    key={t.id}
                    task={t}
                    width={78}
                    bound={!!t.bound}
                    selected={on}
                    onClick={() => setFocusId(on ? null : t.id)}
                    style={{
                      position: "absolute",
                      left: pos.left,
                      bottom: pos.lift,
                      zIndex: on ? 40 : 10 + i,
                      transform: `rotate(${pos.rot}deg)`,
                      transformOrigin: "50% 100%",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
      <button type="button" onClick={() => go("ledger")} style={{
        width: "100%", marginTop: 6, padding: "10px", background: "#241509", color: "#FFD97A",
        border: "3px solid #120A04", fontSize: 12, cursor: "pointer", flex: "0 0 auto", ...LB,
      }}>
        Flip page — full ledger
      </button>
    </Screen>
  );
}

const LEDGER_LANES = [
  { id: "move", label: "Packing" },
  { id: "housing", label: "Housing" },
  { id: "job", label: "Jobs" },
  { id: "admin", label: "Admin" },
  { id: "health", label: "Health" },
  { id: "cat", label: "Stretchy" },
];

const LEDGER_SORTS = [
  { id: "due", label: "Due" },
  { id: "effort", label: "Effort" },
  { id: "score", label: "Score" },
];

function ledgerDueKey(t) {
  if (t.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)) return t.dueDate;
  return "9999-99-99";
}

function LedgerScreen({ go, tasks, setTasks, onSessionBump }) {
  const [lane, setLane] = useState("housing");
  const [sortBy, setSortBy] = useState("due");
  const [showArchived, setShowArchived] = useState(false);
  const [draft, setDraft] = useState("");
  const [effort, setEffort] = useState(1);
  const [editId, setEditId] = useState(null);
  const [editDraft, setEditDraft] = useState({
    title: "", due: "", dueDate: "", effort: 1, category: "housing", status: "pending",
  });
  const rows = tasks
    .filter((t) => {
      if (t.category !== lane) return false;
      if (showArchived) return t.status === "archived";
      return t.status !== "dismissed" && t.status !== "archived";
    })
    .slice()
    .sort((a, b) => {
      const ao = isOpen(a) ? 0 : 1;
      const bo = isOpen(b) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      if (sortBy === "effort") {
        const e = (b.effort || 1) - (a.effort || 1);
        if (e !== 0) return e;
      } else if (sortBy === "score") {
        const as = a.score ?? SAMPLE_JOBS[a.jobId]?.priority ?? -1;
        const bs = b.score ?? SAMPLE_JOBS[b.jobId]?.priority ?? -1;
        const s = bs - as;
        if (s !== 0) return s;
      } else {
        const d = ledgerDueKey(a).localeCompare(ledgerDueKey(b));
        if (d !== 0) return d;
      }
      return (b.urgency || 1) - (a.urgency || 1);
    });
  const markDone = (id) => {
    setTasks((ts) => refreshDailyHousingTasks(
      ts.map((t) => (t.id === id ? { ...t, status: "done" } : t))
    ));
    onSessionBump?.("cleared", 1, "Cleared +1");
    if (editId === id) setEditId(null);
  };
  const beginEdit = (t) => {
    setEditId(t.id);
    setEditDraft({
      title: t.title || "",
      due: t.due || "",
      dueDate: t.dueDate || "",
      effort: t.effort || 1,
      category: t.category || lane,
      status: t.status || "pending",
    });
  };
  const saveEdit = () => {
    if (!editId) return;
    const title = editDraft.title.trim();
    if (!title) return;
    const cat = TASK_CATEGORIES[editDraft.category] ? editDraft.category : lane;
    const dueDate = editDraft.dueDate.trim() || null;
    setTasks((ts) => refreshDailyHousingTasks(
      ts.map((t) => (t.id === editId ? {
        ...t,
        title,
        due: editDraft.due.trim(),
        dueDate,
        effort: Math.min(3, Math.max(1, Number(editDraft.effort) || 1)),
        category: cat,
        status: editDraft.status === "done" ? "done" : "pending",
      } : t))
    ));
    if (cat !== lane) setLane(cat);
    setEditId(null);
  };
  const archiveEdit = () => {
    if (!editId) return;
    setTasks((ts) => ts.map((t) => (t.id === editId ? { ...t, status: "archived" } : t)));
    setEditId(null);
  };
  const restoreArchived = (id) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: "pending" } : t)));
  };
  const addSticky = () => {
    const title = draft.trim();
    if (!title) return;
    setTasks((ts) => [...ts, makeQuickTask({ title, category: lane, effort })]);
    setDraft("");
    setEffort(1);
  };
  const field = {
    width: "100%", boxSizing: "border-box", padding: "8px", marginBottom: 6,
    background: "#1A0F06", color: "#F2E4C0", border: "2px solid #4A2E17", fontSize: 12, ...LB,
  };
  return (
    <Screen title="Ledger" icon="📒" onBack={() => go("board")} subtitle="See-all · Edit · Archive" bg="#2A1A0C">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        {LEDGER_LANES.map((l) => (
          <button key={l.id} type="button" onClick={() => { setLane(l.id); setEditId(null); }} style={{
            padding: "6px 8px", fontSize: 10, cursor: "pointer",
            background: lane === l.id ? "#C9942E" : "#3A2410",
            color: lane === l.id ? "#120A04" : "#C9B896",
            border: "2px solid #120A04", ...LB,
          }}>{l.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10, alignItems: "center" }}>
        <span style={{ color: "#8A7350", fontSize: 9, ...LB }}>Sort</span>
        {LEDGER_SORTS.map((s) => (
          <button key={s.id} type="button" onClick={() => setSortBy(s.id)} style={{
            padding: "4px 8px", fontSize: 10, cursor: "pointer",
            background: sortBy === s.id ? "#5D7C3B" : "#241509",
            color: sortBy === s.id ? "#F2E4C0" : "#C9B896",
            border: "2px solid #120A04", ...LB,
          }}>{s.label}</button>
        ))}
        <button type="button" onClick={() => { setShowArchived((v) => !v); setEditId(null); }} style={{
          marginLeft: "auto", padding: "4px 8px", fontSize: 10, cursor: "pointer",
          background: showArchived ? "#6B3A2A" : "#241509",
          color: showArchived ? "#F2E4C0" : "#C9B896",
          border: "2px solid #120A04", ...LB,
        }}>{showArchived ? "Active" : "Archived"}</button>
      </div>
      {!showArchived && (
      <div style={{ ...FR, padding: 10, marginBottom: 10 }}>
        <div style={{ color: "#FFD97A", fontSize: 10, marginBottom: 6, ...LB }}>Quick-add sticky</div>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="One line…"
          style={field}
        />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[1, 2, 3].map((n) => (
            <button key={n} type="button" onClick={() => setEffort(n)} style={{
              flex: 1, padding: "6px", fontSize: 10, cursor: "pointer",
              background: effort === n ? "#5D7C3B" : "#241509", color: "#F2E4C0",
              border: "2px solid #120A04", ...LB,
            }}>{EFFORT_DOT(n)}</button>
          ))}
          <button type="button" onClick={addSticky} style={{
            flex: 1.4, padding: "6px", background: "#3A2410", color: "#FFD97A",
            border: "2px solid #120A04", fontSize: 11, cursor: "pointer", ...LB,
          }}>Pin</button>
        </div>
      </div>
      )}
      {rows.length === 0 && (
        <div style={{ color: "#8A7350", fontSize: 12, ...LB }}>
          {showArchived ? "No archived cards in this lane." : "No cards in this lane."}
        </div>
      )}
      {rows.map((t) => {
        const open = isOpen(t);
        if (editId === t.id) {
          return (
            <div key={t.id} style={{ ...FR, padding: 10, marginBottom: 8 }}>
              <div style={{ color: "#FFD97A", fontSize: 10, marginBottom: 6, ...LB }}>Edit card</div>
              <input value={editDraft.title} onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))} style={field} />
              <input value={editDraft.due} onChange={(e) => setEditDraft((d) => ({ ...d, due: e.target.value }))} placeholder="Due label (e.g. Jul 15)" style={field} />
              <input value={editDraft.dueDate} onChange={(e) => setEditDraft((d) => ({ ...d, dueDate: e.target.value }))} placeholder="dueDate YYYY-MM-DD" style={field} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                {LEDGER_LANES.map((l) => (
                  <button key={l.id} type="button" onClick={() => setEditDraft((d) => ({ ...d, category: l.id }))} style={{
                    padding: "4px 6px", fontSize: 9, cursor: "pointer",
                    background: editDraft.category === l.id ? "#C9942E" : "#241509",
                    color: editDraft.category === l.id ? "#120A04" : "#C9B896",
                    border: "2px solid #120A04", ...LB,
                  }}>{l.label}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {[1, 2, 3].map((n) => (
                  <button key={n} type="button" onClick={() => setEditDraft((d) => ({ ...d, effort: n }))} style={{
                    flex: 1, padding: "6px", fontSize: 10, cursor: "pointer",
                    background: editDraft.effort === n ? "#5D7C3B" : "#241509", color: "#F2E4C0",
                    border: "2px solid #120A04", ...LB,
                  }}>{EFFORT_DOT(n)}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <button type="button" onClick={saveEdit} style={{ flex: 1, padding: "8px", background: "#5D7C3B", color: "#F2E4C0", border: "2px solid #120A04", fontSize: 11, cursor: "pointer", ...LB }}>Save</button>
                <button type="button" onClick={() => setEditId(null)} style={{ flex: 1, padding: "8px", background: "#3A2410", color: "#C9B896", border: "2px solid #120A04", fontSize: 11, cursor: "pointer", ...LB }}>Cancel</button>
                <button type="button" onClick={archiveEdit} style={{ flex: 1, padding: "8px", background: "#3A1810", color: "#E8C4A8", border: "2px solid #120A04", fontSize: 11, cursor: "pointer", ...LB }}>Archive</button>
              </div>
            </div>
          );
        }
        return (
          <div key={t.id} style={{
            display: "flex", gap: 6, alignItems: "center", marginBottom: 6, padding: "8px 10px",
            background: open ? (PAPER[t.category] || "#EBDDBA") : "#3A2A1A",
            border: "2px solid #120A04", color: open ? "#3A2018" : "#8A7350", opacity: open ? 1 : 0.7,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, ...LB }}>{t.title}</div>
              <div style={{ fontSize: 9, marginTop: 2, ...LB }}>
                {t.due || "—"} · {EFFORT_DOT(t.effort)}
                {(t.score != null || SAMPLE_JOBS[t.jobId]?.priority != null)
                  ? ` · score ${t.score ?? SAMPLE_JOBS[t.jobId].priority}`
                  : ""}
                {isHardOverdue(t) ? " · overdue" : ""}
                {t.status === "done" ? " · done" : ""}
                {t.status === "archived" ? " · archived" : ""}
              </div>
            </div>
            {showArchived ? (
              <button type="button" onClick={() => restoreArchived(t.id)} style={{
                padding: "8px 10px", background: "#5D7C3B", color: "#F2E4C0",
                border: "2px solid #120A04", fontSize: 11, cursor: "pointer", flex: "0 0 auto", ...LB,
              }}>Restore</button>
            ) : (
              <>
                <button type="button" onClick={() => beginEdit(t)} style={{
                  padding: "8px 8px", background: "#3A2410", color: "#FFD97A",
                  border: "2px solid #120A04", fontSize: 10, cursor: "pointer", flex: "0 0 auto", ...LB,
                }}>Edit</button>
                {open && (
                  <button type="button" onClick={() => markDone(t.id)} style={{
                    padding: "8px 10px", background: "#5D7C3B", color: "#F2E4C0",
                    border: "2px solid #120A04", fontSize: 11, cursor: "pointer", flex: "0 0 auto", ...LB,
                  }}>Done</button>
                )}
              </>
            )}
          </div>
        );
      })}
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

/** Cartoon ringing arcs — comic “)))” sound waves off a phone. */
export function RingArcs({ side = "right", size = 36, color = "#FFD97A" }) {
  const flip = side === "left";
  return (
    <svg
      className="ringArcs"
      width={size}
      height={size}
      viewBox="0 0 36 36"
      style={{
        position: "absolute",
        top: "8%",
        [flip ? "right" : "left"]: "100%",
        marginLeft: flip ? undefined : 2,
        marginRight: flip ? 2 : undefined,
        transform: flip ? "scaleX(-1)" : undefined,
        overflow: "visible",
      }}
      aria-hidden
    >
      <path d="M8 10 Q18 18 8 26" fill="none" stroke={color} strokeWidth="3" strokeLinecap="square" />
      <path d="M16 6 Q30 18 16 30" fill="none" stroke={color} strokeWidth="3" strokeLinecap="square" opacity="0.85" />
      <path d="M24 2 Q40 18 24 34" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="square" opacity="0.65" />
    </svg>
  );
}

function LandlineHotspot({ onPickUp, ringing, rattling, showArcs }) {
  return (
    <button
      type="button"
      onClick={onPickUp}
      title={`Call ${RECEPTIONIST_NAME}`}
      style={{
        position: "absolute", left: 6, bottom: 6, zIndex: 4,
        width: 72, height: 72, padding: 4, cursor: "pointer",
        background: "transparent", border: "none", ...LB,
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <img
          src={LANDLINE_PHONE}
          alt=""
          draggable={false}
          className={rattling ? "phoneRattle" : undefined}
          style={{
            display: "block", width: "100%", height: "100%",
            objectFit: "contain", imageRendering: "pixelated",
            pointerEvents: "none", userSelect: "none",
          }}
        />
        {showArcs && <RingArcs side="right" size={28} />}
      </div>
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: -12,
        textAlign: "center", color: ringing ? "#FFD97A" : "#C9B896", fontSize: 8, ...LB,
      }}>
        {ringing ? "RING" : "phone"}
      </div>
    </button>
  );
}

/** Apartment HUD: floating ringing phone with arcs — tap to open Desk. */
export function IncomingPhoneCue({ onAnswer }) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => onIncomingRingPulse(setPulse), []);
  return (
    <button
      type="button"
      onClick={onAnswer}
      title={`${RECEPTIONIST_NAME} is calling`}
      style={{
        position: "fixed",
        right: 12,
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)",
        zIndex: 220,
        width: 88,
        height: 88,
        padding: 6,
        cursor: "pointer",
        background: "rgba(26,16,8,0.88)",
        border: "3px solid #120A04",
        boxShadow: "inset 0 0 0 2px #C9942E, 0 3px 0 #000",
        ...LB,
      }}
    >
      {/* Styles live here too — cue shows on the apartment HUD, outside Screen. */}
      <style>{`
        @keyframes phoneRattle {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          12% { transform: translate(2px, -1px) rotate(-2deg); }
          24% { transform: translate(-2px, 1px) rotate(2deg); }
          36% { transform: translate(2px, 1px) rotate(-1.5deg); }
          48% { transform: translate(-1px, -2px) rotate(2deg); }
          60% { transform: translate(1px, 1px) rotate(-2deg); }
          72% { transform: translate(-2px, 0) rotate(1deg); }
          84% { transform: translate(1px, -1px) rotate(-1deg); }
        }
        @keyframes ringArcs {
          0%, 100% { opacity: 0.35; transform: scale(0.92); }
          40% { opacity: 1; transform: scale(1.06); }
          70% { opacity: 0.7; transform: scale(1.02); }
        }
        .phoneRattle { animation: phoneRattle 0.28s linear infinite; transform-origin: 50% 70%; }
        .ringArcs { animation: ringArcs 0.9s ease-in-out infinite; transform-origin: left center; pointer-events: none; }
      `}</style>
      <div style={{ position: "relative", width: "100%", height: "70%" }}>
        <img
          src={LANDLINE_PHONE}
          alt=""
          draggable={false}
          className={pulse ? "phoneRattle" : undefined}
          style={{
            display: "block", width: "100%", height: "100%",
            objectFit: "contain", imageRendering: "pixelated",
            pointerEvents: "none", userSelect: "none",
          }}
        />
        {pulse && <RingArcs side="right" size={32} />}
      </div>
      <div style={{ color: "#FFD97A", fontSize: 9, textAlign: "center", marginTop: 2 }}>
        {RECEPTIONIST_NAME}…
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
  rattling,
  lineSource,
  lineError,
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

  const sourceLabel = (() => {
    if (waiting) return "…";
    if (lineSource === "live") return "live · OpenRouter";
    if (lineSource === "script") {
      return lineError
        ? `script bank · ${lineError}`
        : "script bank";
    }
    return "doctors office · or whatever";
  })();

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300, background: "rgba(18,10,4,0.94)",
      display: "flex", flexDirection: "column", padding: 12,
      paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)", ...LB,
    }}>
      {(phase === "pickup" || phase === "dial" || phase === "ringing") && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div
            className={
              phase === "pickup" ? "handsetUp"
                : phase === "hanging" ? "handsetDown"
                  : rattling ? "phoneRattle"
                    : undefined
            }
            style={{ width: 160, height: 160, position: "relative" }}
          >
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
              <div style={{ color: lineSource === "live" ? "#8FD14F" : lineError ? "#C9942E" : "#8A7350", fontSize: 10 }}>
                {sourceLabel}
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
  const [tray, setTray] = useState("all"); // all | admin | job | housing
  const deskTasks = tasks.filter((t) => isOpen(t) && ["job", "admin", "move", "housing"].includes(t.category));
  const filtered = deskTasks.filter((t) => {
    if (tray === "admin") return t.category === "admin" || t.category === "move";
    if (tray === "job") return t.category === "job";
    if (tray === "housing") return t.category === "housing";
    return true;
  });
  const filed = tasks.filter((t) => t.status === "done" && ["job", "admin", "move", "housing"].includes(t.category));
  const doneCount = filed.length;
  const outboxVis = filed.slice(-6);
  const adminCount = deskTasks.filter((t) => t.category === "admin" || t.category === "move").length;
  const jobCount = deskTasks.filter((t) => t.category === "job").length;
  const housingCount = deskTasks.filter((t) => t.category === "housing").length;
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
  const [lineError, setLineError] = useState(null); // last improv failure reason, if any
  const [incomingRing, setIncomingRing] = useState(!!phoneNudge);
  const [phoneRattling, setPhoneRattling] = useState(false);
  const [incomingPulse, setIncomingPulse] = useState(false);
  const ringCancelRef = useRef(null);
  const rattleOffRef = useRef(null);
  const ceremonyDelayRef = useRef(null);
  const apptsRef = useRef(appointments);
  apptsRef.current = appointments;
  const callStateRef = useRef(callState);
  callStateRef.current = callState;
  const msgsRef = useRef(phoneMsgs);
  msgsRef.current = phoneMsgs;

  useEffect(() => {
    if (!incomingRing) {
      setIncomingPulse(false);
      return;
    }
    return onIncomingRingPulse(setIncomingPulse);
  }, [incomingRing]);

  const clearCeremonyDelay = () => {
    if (ceremonyDelayRef.current) {
      clearTimeout(ceremonyDelayRef.current);
      ceremonyDelayRef.current = null;
    }
  };

  /** Duck music first; run SFX only after fade settles + 1s quiet lead. */
  const afterPhoneDuck = (fn) => {
    clearCeremonyDelay();
    setPhoneMusicDuck(true);
    ceremonyDelayRef.current = setTimeout(() => {
      ceremonyDelayRef.current = null;
      fn();
    }, PHONE_SFX_AFTER_DUCK_MS);
  };

  const clearPhoneRing = () => {
    clearCeremonyDelay();
    if (ringCancelRef.current) {
      ringCancelRef.current();
      ringCancelRef.current = null;
    }
    if (rattleOffRef.current) {
      clearTimeout(rattleOffRef.current);
      rattleOffRef.current = null;
    }
    stopPhoneRingSfx();
    setPhoneRattling(false);
  };

  /** Outbound dial-tone cadence only (ducks music). Incoming uses bell ringtone elsewhere. */
  const beginRingPattern = ({ bursts = 2, onDone } = {}) => {
    clearPhoneRing();
    afterPhoneDuck(() => {
      const startBurst = () => {
        setPhoneRattling(true);
        if (rattleOffRef.current) clearTimeout(rattleOffRef.current);
        rattleOffRef.current = setTimeout(() => setPhoneRattling(false), PHONE_RING_ON_MS);
      };
      ringCancelRef.current = playPhoneRingPattern({
        bursts,
        onMs: PHONE_RING_ON_MS,
        gapMs: PHONE_RING_GAP_MS,
        onBurst: startBurst,
        onDone: () => {
          ringCancelRef.current = null;
          onDone?.();
        },
      });
    });
  };

  useEffect(() => {
    if (phoneNudge && (phoneNudge.kind === "remind" || phoneNudge.kind === "overdue")) {
      setIncomingRing(true);
    }
  }, [phoneNudge]);

  useEffect(() => () => {
    clearPhoneRing();
    stopPhoneReceiverLoop();
    stopPhoneIncomingRingtone();
    setPhoneMusicDuck(false);
  }, []);

  const startTalking = (nudgeOverride) => {
    clearPhoneRing();
    stopPhoneReceiverLoop();
    stopPhoneIncomingRingtone();
    setIncomingRing(false);
    setPhoneMusicDuck(true);
    playPhoneAnswerSfx();
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
    if (nudge?.kind === "remind" && nudge.appt) {
      setAppointments((a) => markReminded(a, nudge.appt.id));
    }
    clearPhoneNudge?.();
  };

  const pickUpPhone = () => {
    clearPhoneRing();
    stopPhoneIncomingRingtone();
    const wasIncoming = incomingRing;
    setIncomingRing(false);
    // Shirley calling you → answer straight into the chat (no dial ceremony).
    if (wasIncoming) {
      startTalking(phoneNudge || getNudge(apptsRef.current, tasks));
      return;
    }
    setPhonePhase("pickup");
    afterPhoneDuck(() => {
      playPhonePickupSfx(); // starts looping receiver tone
    });
  };

  const dialShirley = () => {
    // Music already ducked from pickup — no second lead-in before rotary.
    setPhonePhase("dial");
    setPhoneMusicDuck(true);
    playPhoneRotaryDial(); // stops receiver loop + short rotary
    clearCeremonyDelay();
    ceremonyDelayRef.current = setTimeout(() => {
      ceremonyDelayRef.current = null;
      setPhonePhase("ringing");
      const startBurst = () => {
        setPhoneRattling(true);
        if (rattleOffRef.current) clearTimeout(rattleOffRef.current);
        rattleOffRef.current = setTimeout(() => setPhoneRattling(false), PHONE_RING_ON_MS);
      };
      ringCancelRef.current = playPhoneRingPattern({
        bursts: 2,
        onMs: PHONE_RING_ON_MS,
        gapMs: PHONE_RING_GAP_MS,
        onBurst: startBurst,
        onDone: () => {
          ringCancelRef.current = null;
          startTalking(phoneNudge || getNudge(apptsRef.current, tasks));
        },
      });
    }, 1100);
  };

  const cancelCeremony = () => {
    clearPhoneRing();
    stopPhoneReceiverLoop();
    playPhoneHangupSfx(); // answer click + unduck
    setPhonePhase(null);
  };

  const hangUp = () => {
    clearPhoneRing();
    stopPhoneReceiverLoop();
    playPhoneHangupSfx(); // same pickup click as Shirley answering
    setPhonePhase("hanging");
    setTimeout(() => {
      setPhonePhase(null);
      setPhoneMsgs([]);
      setLineSource(null);
      setLineError(null);
      setCallState({ phase: "await_visit", draft: {}, priorityId: null });
    }, 320);
  };

  const applyBookResult = (result) => {
    if (!result?.ok) return;
    setAppointments(result.appointments);
    const bookTask = tasks.find((t) => t.id === result.appt?.taskId);
    if (bookTask) {
      setTasks((ts) => refreshDailyHousingTasks(tasksAfterBooking(ts, result.appt, bookTask)));
    }
  };

  const handlePhoneSend = async (userText) => {
    if (phoneWaiting || phonePhase !== "talking") return;
    const nextMsgs = [...msgsRef.current, { role: "user", text: userText }];
    setPhoneMsgs(nextMsgs);
    setPhoneWaiting(true);
    setLineError(null);

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
        setLineError(null);
        setPhoneMsgs([...nextMsgs, { role: "shirley", text: line }]);
        setPhoneWaiting(false);
        return;
      }
      const errLabel = agent.detail
        ? `${agent.error} — ${String(agent.detail).slice(0, 80)}`
        : (agent.error || "failed");
      setLineError(errLabel);
      console.warn("[Shirley] falling back to script bank:", errLabel);
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
  const housingProg = sessionProgress(session, HOUSING_SESSION_GOALS);

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
      setTasks((ts) => refreshDailyHousingTasks(
        ts.map((t) => (t.id === id ? { ...t, status: "done", needsInfo: false } : t))
      ));
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
        display: "flex", gap: 8, marginBottom: 8, padding: "8px 10px",
        background: "#EFE7D2", border: "2px solid #120A04", boxShadow: "2px 2px 0 rgba(0,0,0,0.35)",
      }}>
        {housingProg.items.map((it) => (
          <button
            key={it.id}
            type="button"
            disabled={it.done}
            onClick={() => {
              if (it.done) return;
              onSessionBump?.(it.key, 1, it.key === "messages" ? "Msg +1" : "Backup +1");
            }}
            style={{
              flex: 1, padding: "6px 4px", textAlign: "center", cursor: it.done ? "default" : "pointer",
              background: it.done ? "#CBDCC2" : "#F7F0DC", border: "2px solid #120A04", color: "#3A2018", ...LB,
            }}
          >
            <div style={{ fontSize: 9 }}>{it.label}</div>
            <div style={{ fontSize: 12, marginTop: 2 }}>{it.cur}/{it.target}{it.done ? " ✓" : " +"}</div>
          </button>
        ))}
      </div>
      <div style={{
        border: "3px solid #120A04", background: "repeating-linear-gradient(0deg, #5A381F 0 14px, #6E452A 14px 16px)",
        padding: "10px 10px 12px", boxShadow: "inset 0 0 0 2px #3E2413",
      }}>
        {/* trays */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {trayBtn("housing", "HOUSING", "#E8C9A0", housingCount)}
          {trayBtn("admin", "ADMIN", "#B9CEDC", adminCount)}
          {trayBtn("job", "APPS", "#E9BFB2", jobCount)}
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
            <LandlineHotspot
              onPickUp={pickUpPhone}
              ringing={incomingRing}
              rattling={phoneRattling || incomingPulse}
              showArcs={incomingPulse}
            />
          )}
          {phonePhase && (
            <ShirleyCallOverlay
              phase={phonePhase}
              messages={phoneMsgs}
              chips={chips}
              waiting={phoneWaiting}
              draftHint={draftHint}
              rattling={phoneRattling}
              lineSource={lineSource}
              lineError={lineError}
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
  { id: "obgyn",   label: "OB/GYN",  note: "IUD replacement",           x: "50%", y: "47%", care: "herbal" },
  { id: "skin",    label: "Skin",    note: "Dermatology appointment",   x: "22%", y: "42%", care: "balm" },
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
    zoneDone("obgyn") ? { c: "#5D7C3B", t: "OB/GYN booked" } : { c: "#C9942E", t: "OB/GYN open" },
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
    setTasks((ts) => tasksAfterAttend(ts, appt));
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
          onBlur={(e) => {
            const v = e.target.value;
            // Only touch the key — don't rewrite model from possibly-stale state.
            persistShirley({ apiKey: v, improv: !!v.trim() });
          }}
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
          onBlur={(e) => persistShirley({ model: e.target.value })}
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
            width: "100%", marginBottom: 8, padding: "10px", background: "#3A2410", color: "#FFD97A",
            border: "3px solid #120A04", fontSize: 12, cursor: "pointer", ...LB,
          }}
        >
          Save Shirley settings
        </button>
        <button
          type="button"
          onClick={() => {
            if (!window.confirm("Remove the saved OpenRouter key from this device?")) return;
            persistShirley({ apiKey: "", clearApiKey: true, improv: false });
          }}
          style={{
            width: "100%", marginBottom: 10, padding: "8px", background: "#241509", color: "#C9B896",
            border: "2px solid #4A2E17", fontSize: 11, cursor: "pointer", ...LB,
          }}
        >
          Clear API key
        </button>
        <div style={{ color: improv && apiKey.trim() ? "#8FD14F" : "#C9942E", fontSize: 10, marginBottom: 8, ...LB }}>
          {apiKey.trim()
            ? (improv
              ? "Status: improv on (OpenRouter key saved) — phone shows live vs script per reply"
              : "Status: key saved, improv off")
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
                persistShirley({ improv: next && !!apiKey.trim() });
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
  if (screen === "board")     return (
    <BoardScreen go={go} tasks={tasks} setTasks={setTasks}
      session={session} onSessionBump={onSessionBump} rewardToast={rewardToast} />
  );
  if (screen === "ledger")    return (
    <LedgerScreen go={go} tasks={tasks} setTasks={setTasks} onSessionBump={onSessionBump} />
  );
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
