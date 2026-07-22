import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useUiLayout } from "./dev/uiLayout.js";
import STRETCHY_ICON from "./assets/Stretchy Icon.png";
import HEALTH_CLIPBOARD from "./assets/health-clipboard.png";
import HEALTH_BODY_FIGURE from "./assets/items/packitup_cropped_assets/ui_mockups/health_slices/body_figure.png";
import HEALTH_BACK_BUTTON from "./assets/items/packitup_cropped_assets/ui_mockups/health_slices/back_button.png";
import HEALTH_ZONE_PSYCH from "./assets/items/packitup_cropped_assets/ui_mockups/health_slices/zone_psychiatry.png";
import HEALTH_ZONE_DENTIST from "./assets/items/packitup_cropped_assets/ui_mockups/health_slices/zone_dentist.png";
import HEALTH_ZONE_CARDIO from "./assets/items/packitup_cropped_assets/ui_mockups/health_slices/zone_cardiology.png";
import HEALTH_ZONE_DERM from "./assets/items/packitup_cropped_assets/ui_mockups/health_slices/zone_dermatology.png";
import HEALTH_ZONE_RHEUM from "./assets/items/packitup_cropped_assets/ui_mockups/health_slices/zone_rheumatology.png";
import HEALTH_ZONE_OBGYN from "./assets/items/packitup_cropped_assets/ui_mockups/health_slices/zone_obgyn.png";
import HEALTH_NOTE_PAPER from "./assets/items/packitup_cropped_assets/ui_mockups/health_slices/note_paper.png";
import HEALTH_SHIRLEY_BTN from "./assets/items/packitup_cropped_assets/ui_mockups/health_slices/shirley_button.png";
import HEALTH_CAREKIT_BTN from "./assets/items/packitup_cropped_assets/ui_mockups/health_slices/carekit_button.png";
import HEALTH_RECORDS_BTN from "./assets/items/packitup_cropped_assets/ui_mockups/health_slices/records_button.png";
import HEALTH_LEGEND_BAR from "./assets/items/packitup_cropped_assets/ui_mockups/health_slices/legend_bar.png";
import LANDLINE_PHONE from "./assets/landline-phone.png";
import MENU_HEADER_FRAME from "./assets/items/packitup_cropped_assets/ui_mockups/menu_slices/header_frame.png";
import MENU_FOOTER_FRAME from "./assets/items/packitup_cropped_assets/ui_mockups/menu_slices/footer_frame.png";
import MENU_BACK_ARROW from "./assets/items/packitup_cropped_assets/ui_mockups/menu_slices/back_arrow.png";
import MENU_LIST_ICON from "./assets/items/packitup_cropped_assets/ui_mockups/menu_slices/list_icon.png";
import MENU_PRESSURE_FRAME from "./assets/items/packitup_cropped_assets/ui_mockups/menu_slices/pressure_frame.png";
import MENU_COMMAND_BANNER from "./assets/items/packitup_cropped_assets/ui_mockups/menu_slices/command_board_banner.png";
import MENU_TILE_FRAME from "./assets/items/packitup_cropped_assets/ui_mockups/menu_slices/tile_frame.png";
import MENU_ICON_FOLDER from "./assets/items/packitup_cropped_assets/ui_mockups/menu_slices/folder_icon.png";
import MENU_ICON_HEALTH from "./assets/items/packitup_cropped_assets/ui_mockups/menu_slices/stethoscope_icon.png";
import MENU_ICON_BOX from "./assets/items/packitup_cropped_assets/ui_mockups/menu_slices/box_icon.png";
import MENU_ICON_MONEYBAG from "./assets/items/packitup_cropped_assets/ui_mockups/menu_slices/moneybag_icon.png";
import MENU_ICON_CAT from "./assets/items/packitup_cropped_assets/ui_mockups/menu_slices/cat_icon.png";
import MENU_ICON_GEAR from "./assets/items/packitup_cropped_assets/ui_mockups/menu_slices/gear_icon.png";
import BOARD_HEADER_FRAME from "./assets/items/packitup_cropped_assets/ui_mockups/board_slices/header_command_board.png";
import BOARD_BACK_BUTTON from "./assets/items/packitup_cropped_assets/ui_mockups/board_slices/back_button.png";
import BOARD_ENERGY_LABEL from "./assets/items/packitup_cropped_assets/ui_mockups/board_slices/energy_label_chip.png";
import BOARD_FIXED_DAY_CHIP from "./assets/items/packitup_cropped_assets/ui_mockups/board_slices/fixed_day_chip.png";
import BOARD_FUMES_OFF from "./assets/items/packitup_cropped_assets/ui_mockups/board_slices/fumes_off.png";
import BOARD_FUMES_ON from "./assets/items/packitup_cropped_assets/ui_mockups/board_slices/fumes_on.png";
import BOARD_STEADY_OFF from "./assets/items/packitup_cropped_assets/ui_mockups/board_slices/steady_off.png";
import BOARD_STEADY_ON from "./assets/items/packitup_cropped_assets/ui_mockups/board_slices/steady_on.png";
import BOARD_FULL_OFF from "./assets/items/packitup_cropped_assets/ui_mockups/board_slices/full_off.png";
import BOARD_FULL_ON from "./assets/items/packitup_cropped_assets/ui_mockups/board_slices/full_on.png";
import BOARD_DRAW_BUTTON from "./assets/items/packitup_cropped_assets/ui_mockups/board_slices/draw_button.png";
import BOARD_SCROLLBAR from "./assets/items/packitup_cropped_assets/ui_mockups/board_slices/scrollbar_track.png";
import BOARD_LEDGER_BUTTON from "./assets/items/packitup_cropped_assets/ui_mockups/board_slices/ledger_button_frame.png";
import STRETCHY_HEART_FULL from "./assets/ui_screen_chrome/stretchy_heart_full.png";
import STRETCHY_HEART_EMPTY from "./assets/ui_screen_chrome/stretchy_heart_empty.png";
import SHIRLEY_PORTRAIT from "./assets/ui_screen_chrome/shirley_portrait.png";
import CALL_SHIRLEY_BUTTON from "./assets/ui_screen_chrome/call_shirley_button.png";
import SETTINGS_HEADER from "./assets/ui_screen_chrome/settings_header.png";
import SETTINGS_SLIDER_TRACK from "./assets/ui_screen_chrome/settings_slider_track.png";
import SETTINGS_SLIDER_KNOB from "./assets/ui_screen_chrome/settings_slider_knob.png";
import SETTINGS_TOGGLE_ON from "./assets/ui_screen_chrome/settings_toggle_on.png";
import SETTINGS_TOGGLE_OFF from "./assets/ui_screen_chrome/settings_toggle_off.png";
import SETTINGS_INPUT from "./assets/ui_screen_chrome/settings_input.png";
import SETTINGS_SAVE from "./assets/ui_screen_chrome/settings_save.png";
import SETTINGS_CLEAR from "./assets/ui_screen_chrome/settings_clear.png";
import SETTINGS_CHECK from "./assets/ui_screen_chrome/settings_check.png";
import LEDGER_HEADER from "./assets/ui_screen_chrome/ledger_header.png";
import LEDGER_EDIT from "./assets/ui_screen_chrome/ledger_edit.png";
import LEDGER_DONE from "./assets/ui_screen_chrome/ledger_done.png";
import LEDGER_CHIP_DARK from "./assets/ui_screen_chrome/ledger_chip_dark.png";
import LEDGER_CHIP_PAPER from "./assets/ui_screen_chrome/ledger_chip_paper.png";
import LEDGER_CHIP_ACTIVE from "./assets/ui_screen_chrome/ledger_chip_active.png";
import LEDGER_QUICK_ADD from "./assets/ui_screen_chrome/ledger_quick_add.png";
import DESK_TRAY from "./assets/ui_screen_chrome/desk_tray.png";
import DESK_STAMP_FILED from "./assets/ui_screen_chrome/desk_stamp_filed.png";
import DESK_STAMP_APPROVED from "./assets/ui_screen_chrome/desk_stamp_approved.png";
import DESK_STAMP_DONE from "./assets/ui_screen_chrome/desk_stamp_done.png";
import DESK_CONTACTS from "./assets/ui_screen_chrome/desk_contacts.png";
import DESK_DAILY_PANEL from "./assets/ui_screen_chrome/desk_daily_panel.png";
import DESK_INBOX_PANEL from "./assets/ui_screen_chrome/desk_inbox_panel.png";
import DESK_PHYSICAL_STAMP from "./assets/ui_screen_chrome/desk_physical_stamp.png";
import DESK_PLAQUE from "./assets/ui_screen_chrome/desk_plaque.png";
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
  TASK_CATEGORIES, SAMPLE_JOBS, isOpen, taskPressure, stretchyStress, isHardOverdue,
  PRESSURE_LABELS, PRESSURE_COLORS,
  doorForTask, makeQuickTask, refreshDailyHousingTasks,
  tasksAfterBooking, tasksAfterAttend,
  isTaskDateLocked, scheduleDatesForLedger,
} from "./tasks.js";
import {
  ensureDailyDeal, handTasks, offerTasks, dealProgress, toggleDealPick, manualToggleHand,
  taskStatus, urgencyScore, isBoundToday,
} from "./schedule.js";
import { PixelCanvas, CELL } from "./BedroomSlice.jsx";
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
import { clearSave, SAVE_VERSION, suspendSaves } from "./save.js";
import {
  GAME_FEATURE_OPTIONS,
  targetOptionsForFeature,
  COMPLETION_TRIGGER_OPTIONS,
  TASK_RESULT_OPTIONS,
  completeTaskFromEvent,
  resolveTaskDestination,
  isWorldBoundTask,
  normalizeTaskBinding,
  describeBinding,
  taskBindingProgress,
} from "./taskBindings.js";
import {
  SESSION_GOALS,
  HEALTH_SESSION_GOALS,
  HOUSING_SESSION_GOALS,
  sessionProgress,
  bumpSession,
  todayKey,
} from "./session.js";
import { DATE_TRIGGERS, daysUntil, buildJulyCalendar } from "./movePhase.js";
import CAL_HEADER from "./assets/calendar/cat_of_month_full_group_exact.png";
import CAL_TODAY_RING from "./assets/calendar/today_ring.png";
import CAL_INK_X from "./assets/calendar/ink_x_1.png";
import CAL_ICON_MOVE from "./assets/calendar/move_truck.png";
import CAL_ICON_HOUSING from "./assets/calendar/housing_house.png";
import CAL_ICON_JOB from "./assets/calendar/job_briefcase.png";
import CAL_ICON_ADMIN from "./assets/calendar/admin_folder.png";
import CAL_ICON_HEALTH from "./assets/calendar/health_cross.png";
import CAL_ICON_CAT from "./assets/calendar/stretchy_cat_face.png";
import MS_DENTIST from "./assets/calendar/milestone_dentist.png";
import MS_VISION from "./assets/calendar/milestone_vision.png";
import MS_DERM from "./assets/calendar/milestone_derm.png";
import MS_OBGYN from "./assets/calendar/milestone_obgyn.png";
import MS_VET from "./assets/calendar/milestone_vet.png";
import MS_UBOX from "./assets/calendar/milestone_ubox.png";
import MS_WALKTHROUGH from "./assets/calendar/milestone_walkthrough.png";
import MS_FLIGHT from "./assets/calendar/milestone_flight.png";
import MS_LOCK from "./assets/calendar/milestone_lock.png";
import MS_LAPTOP from "./assets/calendar/milestone_laptop.png";
import MS_WIFI from "./assets/calendar/milestone_wifi.png";
import MS_SUITCASE from "./assets/calendar/milestone_suitcase.png";
import {
  RECEPTIONIST_NAME,
  getNudge,
  buildQuickChips,
  confirmLine,
  markReminded,
  attendAppointment,
  canAttendZone,
  visitLabel,
  formatApptDay,
  activeAppointments,
  priorityHealthTask,
  isBookableHealthTask,
  cancelAppointment,
  findApptForTask,
  bookAppointment,
} from "./receptionist.js";
import {
  loadShirleySettings,
  saveShirleySettings,
  improvEnabled,
  askNpc,
  applyBookPayload,
  DEFAULT_MODEL,
  sanitizeApiKey,
  keyFingerprint,
  formatShirleyLineError,
  LINE_BUSY_LABEL,
} from "./receptionistCall.js";
import { NPCS, canNpcMark, pickIncomingCaller } from "./npcs.js";

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

/**
 * Urgency badge colors (Part E) — task.urgencyStatus comes pre-computed from
 * schedule.js's taskStatus() via handTasks()/offerTasks(); cards never
 * recompute it, so they don't need the full task list or "today" passed in.
 * Sharp corners, small type — no modern pill components.
 */
const URGENCY_TAG_STYLE = {
  SOON: { bg: "#C9942E", fg: "#1A1008" },
  DUE: { bg: "#E8B94A", fg: "#1A1008" },
  OVERDUE: { bg: "#C9773A", fg: "#FFF3DE" },
  CLOSING: { bg: "#C43B34", fg: "#FFF3DE" },
  "FINAL CALL": { bg: "#7A1E1E", fg: "#FFD97A" },
  BLOCKED: { bg: "#5B6472", fg: "#F3EDDD" },
  SCHEDULED: { bg: "#3E6491", fg: "#F3EDDD" },
};

/** Small pixel-native urgency tag — caller positions it (corner varies per card layout). */
function UrgencyTag({ status, fontSize, style }) {
  const tone = URGENCY_TAG_STYLE[status];
  if (!tone) return null;
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        fontSize,
        lineHeight: 1,
        padding: "1px 3px",
        background: tone.bg,
        color: tone.fg,
        border: "1px solid #120A04",
        whiteSpace: "nowrap",
        ...LB,
        ...style,
      }}
    >
      {status}
    </div>
  );
}

/**
 * Overlay layout from /?cards=1 (Eloisa 2026-07-11).
 * refW = designer preview width so px fonts scale with live card size.
 */
export const CARD_OVERLAY = {
  thin: {
    refW: 420,
    title: { left: "3.3%", right: "2.3%", top: "28.3%", height: "26.5%" },
    target: { left: "18.5%", top: "70%", width: "12.2%" },
    latest: { left: "47.5%", top: "70.4%", width: "12.3%" },
    titleMaxPx: 13,
    datePx: 9,
    pips: { effort: [[66.7, 74.8], [70.5, 74.8], [74.4, 74.8]], importance: [[87.85, 74.8], [91.7, 74.8], [95.2, 74.8]], size: 2.15 },
  },
  full: {
    refW: 220,
    title: { left: "8.2%", right: "7.4%", top: "21.5%", height: "17.9%" },
    target: { left: "36.1%", top: "41.7%", width: "58%" },
    latest: { left: "36.7%", top: "47.1%", width: "58%" },
    bound: { left: "3.9%", top: "1.1%", width: "9.8%", height: "8.4%" },
    titleMaxPx: 18,
    datePx: 10.5,
    pips: { effort: [[20.55, 16.6], [28.22, 16.65], [36.13, 16.61]], importance: [[20.77, 86.88], [28.55, 86.93], [36.27, 86.97]], size: 5.2 },
  },
};

export function scaleOverlayPx(px, width, refW) {
  return Math.max(3, px * (width / refW));
}

/** Shrink font until text fits the parent box (no clip). */
export function FitText({ text, maxPx, minPx = 5, style }) {
  const ref = useRef(null);
  const [size, setSize] = useState(maxPx);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const parent = el.parentElement;
    if (!parent) return undefined;
    let s = maxPx;
    el.style.fontSize = `${s}px`;
    // Binary-ish shrink: also re-run on resize
    const fit = () => {
      s = maxPx;
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
    <span
      ref={ref}
      style={{
        display: "block",
        width: "100%",
        fontSize: size,
        lineHeight: 1.15,
        overflow: "hidden",
        ...style,
      }}
    >
      {text}
    </span>
  );
}

/** Fill hollow circles baked into the art — solid discs centered on rings. */
function BubblePips({ filled, centers, sizePct }) {
  const n = clampPips(filled);
  return (
    <>
      {centers.map(([x, y], i) => (
        i < n ? (
          <span
            key={i}
            aria-hidden
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: `${sizePct}%`,
              aspectRatio: "1 / 1",
              borderRadius: "50%",
              background: "#120A04",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              display: "block",
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
  const wrapRef = useRef(null);
  const [cardW, setCardW] = useState(CARD_OVERLAY.thin.refW);
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setCardW(w);
    });
    ro.observe(el);
    setCardW(el.getBoundingClientRect().width || CARD_OVERLAY.thin.refW);
    return () => ro.disconnect();
  }, []);
  const L = CARD_OVERLAY.thin;
  const titleMax = scaleOverlayPx(L.titleMaxPx, cardW, L.refW);
  const datePx = scaleOverlayPx(L.datePx, cardW, L.refW);
  return (
    <div ref={wrapRef} style={{
      position: "relative", width: "100%", minWidth: 0, lineHeight: 0,
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
          position: "absolute", ...L.title,
          color: "#1A1008", textAlign: "left", overflow: "hidden",
          display: "flex", alignItems: "center", ...LB,
        }}>
          <FitText text={task?.title || ""} maxPx={titleMax} minPx={Math.max(5, titleMax * 0.45)} style={{ fontWeight: 700, letterSpacing: "0.5px", lineHeight: 1.1 }} />
        </div>
        <div style={{
          position: "absolute", ...L.target,
          color: "#1A1008", fontSize: datePx, lineHeight: 1, overflow: "visible", whiteSpace: "nowrap", ...LB,
        }}>{fmtCardDate(task?.targetDate || task?.due)}</div>
        <div style={{
          position: "absolute", ...L.latest,
          color: "#1A1008", fontSize: datePx, lineHeight: 1, overflow: "visible", whiteSpace: "nowrap", ...LB,
        }}>{fmtCardDate(task?.latestDate)}</div>
        <UrgencyTag
          status={task?.urgencyStatus}
          fontSize={scaleOverlayPx(8, cardW, L.refW)}
          style={{ top: "4%", right: "3%" }}
        />
        <BubblePips filled={effort} centers={L.pips.effort} sizePct={L.pips.size} />
        <BubblePips filled={importance} centers={L.pips.importance} sizePct={L.pips.size} />
      </div>
    </div>
  );
}

/**
 * Vertical “real card” — hand fan / detail peek.
 * Natural PNG aspect (no stretch) so % overlays stay locked to art.
 */
export function VerticalTaskCard({
  task, width = 106, bound = false, manual = false, selected = false, compact = false, textScale = 1, onClick, style, world = null,
}) {
  const src = CARD_FULL[task?.category] || CARD_FULL.admin;
  const effort = clampPips(task?.effort || 1) || 1;
  const importance = clampPips(task?.criticality || 1) || 1;
  const L = CARD_OVERLAY.full;
  const fontW = width * (textScale || 1);
  const titlePx = compact
    ? Math.max(5, Math.round(fontW * 0.085))
    : scaleOverlayPx(L.titleMaxPx, fontW, L.refW);
  const metaPx = compact
    ? Math.max(4, Math.round(fontW * 0.07))
    : scaleOverlayPx(L.datePx, fontW, L.refW);
  const boundPx = Math.max(5, scaleOverlayPx(10, fontW, L.refW));
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      style={{
        position: "relative",
        width,
        minWidth: width,
        maxWidth: width,
        height: "auto",
        padding: 0,
        margin: 0,
        appearance: "none",
        WebkitAppearance: "none",
        font: "inherit",
        color: "inherit",
        border: "none",
        outline: selected ? "3px solid #FFD97A" : "none",
        outlineOffset: "-2px",
        background: "transparent",
        cursor: onClick ? "pointer" : "default",
        boxShadow: selected ? "0 0 0 1px #120A04" : "2px 2px 0 rgba(0,0,0,0.4)",
        overflow: "hidden",
        lineHeight: 0,
        textAlign: "left",
        boxSizing: "border-box",
        flex: "0 0 auto",
        ...style,
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
            position: "absolute", ...L.bound,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              border: "1px solid #A3252C", color: "#A3252C",
              fontSize: boundPx,
              background: "rgba(255,248,235,0.85)", padding: "1px 3px", lineHeight: 1, ...LB,
            }}>B</span>
          </div>
        )}
        {!bound && manual && (
          <div style={{
            position: "absolute", ...L.bound,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              border: "1px solid #B77A1E", color: "#B77A1E",
              fontSize: boundPx,
              background: "rgba(255,248,235,0.85)", padding: "1px 3px", lineHeight: 1, ...LB,
            }}>M</span>
          </div>
        )}
        <UrgencyTag
          status={task?.urgencyStatus}
          fontSize={Math.max(4, Math.round(fontW * 0.06))}
          style={{ top: "1.5%", right: "3%" }}
        />
        <BubblePips filled={effort} centers={L.pips.effort} sizePct={L.pips.size} />
        <div style={{
          position: "absolute", ...L.title,
          color: "#1A1008", textAlign: "left", overflow: "hidden",
          display: "flex", alignItems: "center",
          fontFamily: LB.fontFamily, fontWeight: 700,
        }}>
          <FitText
            text={task?.title || ""}
            maxPx={titlePx}
            minPx={Math.max(4, titlePx * 0.4)}
            style={{ letterSpacing: "0.2px", fontWeight: 700 }}
          />
        </div>
        {!compact && (
          <>
            <div style={{
              position: "absolute", ...L.target,
              color: "#1A1008", fontSize: metaPx, lineHeight: 1, overflow: "visible", whiteSpace: "nowrap",
              textAlign: "left", ...LB,
            }}>{fmtCardDate(task?.targetDate || task?.due)}</div>
            <div style={{
              position: "absolute", ...L.latest,
              color: "#1A1008", fontSize: metaPx, lineHeight: 1, overflow: "visible", whiteSpace: "nowrap",
              textAlign: "left", ...LB,
            }}>{fmtCardDate(task?.latestDate)}</div>
            {(() => {
              const lines = [];
              const job = task?.jobId ? SAMPLE_JOBS[task.jobId] : null;
              if (job) {
                if (job.org) lines.push(job.org);
                if (job.salary) lines.push(job.salary);
                if (job.nextAction) lines.push(`next: ${job.nextAction}`);
              } else {
                const bindingDesc = describeBinding(task?.binding);
                if (bindingDesc) lines.push(`🔗 ${bindingDesc}`);
                const prog = world ? taskBindingProgress(task, world) : null;
                if (prog && prog.done < prog.total) {
                  lines.push(`${prog.done}/${prog.total} packed${prog.next ? ` · finish in ${prog.next}` : ""}`);
                }
              }
              if (lines.length < 3 && task?.dependsNote) lines.push(`after: ${task.dependsNote}`);
              if (lines.length < 3 && (task?.notes || task?.detail)) lines.push(task.notes || task.detail);
              const bodyLines = lines.slice(0, 3);
              return bodyLines.length > 0 && (
                <div style={{
                  position: "absolute", left: "10%", right: "10%", top: "54%", height: "23%",
                  color: "#6B4A28", fontSize: Math.max(5, metaPx - 1), lineHeight: 1.25, overflow: "hidden",
                  textAlign: "left", display: "flex", flexDirection: "column", ...LB, fontWeight: 400,
                }}>
                  {bodyLines.map((line, i) => (
                    <div key={i} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{line}</div>
                  ))}
                </div>
              );
            })()}
          </>
        )}
        {compact && (
          <div style={{
            position: "absolute", left: "10%", right: "10%", top: "38%",
            color: "#3A2018", fontSize: metaPx, lineHeight: 1, overflow: "hidden", whiteSpace: "nowrap", ...LB,
          }}>{fmtCardDate(task?.targetDate || task?.due) || "—"}</div>
        )}
        <BubblePips filled={importance} centers={L.pips.importance} sizePct={L.pips.size} />
      </div>
    </Tag>
  );
}

/* Full-card aspect ratio shared with the hand/deal VerticalTaskCard (487/284 source art). */
const DESK_STACK_CARD_H_OVER_W = 487 / 284;

/* One category's incoming pile on the Paperwork Desk: the REAL next-in-stack
   VerticalTaskCard peeks from behind the top card (same width, offset down-
   right, non-interactive) so the pile reads as actual papers, not decoration.
   A third card (if any) only adds a plain paper edge behind that for depth.
   No bespoke drawn card — this is the exact component the hand/deal screens
   use. Tapping routes straight to the desk's inspection tray via onClick. */
function DeskIncomingStack({ category, stack = [], width = 90, selected, onClick }) {
  const color = TASK_CATEGORIES[category]?.color || "#C9942E";
  const n = stack.length;
  const top = stack[0];
  const next = stack[1];
  const cardH = Math.round(width * DESK_STACK_CARD_H_OVER_W);
  if (!top) {
    return (
      <div style={{
        width, height: cardH, border: "2px dashed #6B563B", opacity: 0.32,
        display: "grid", placeItems: "center", color: "#6B563B", fontSize: 8, ...LB,
      }}>
        empty
      </div>
    );
  }
  const peekOffset = 5;
  // Only REAL cards in the pile — the top card and the literal next card
  // peeking behind it. No fake paper edges (Eloisa's ruling, twice).
  const totalOffset = next ? peekOffset : 0;
  return (
    <div style={{ position: "relative", width: width + totalOffset, height: cardH + totalOffset }}>
      {next && (
        <VerticalTaskCard
          task={next}
          width={width}
          style={{ position: "absolute", left: peekOffset, top: peekOffset, pointerEvents: "none" }}
        />
      )}
      <VerticalTaskCard
        task={top}
        width={width}
        selected={selected}
        onClick={onClick}
        style={{ position: "absolute", left: 0, top: 0 }}
      />
      <div style={{
        position: "absolute", top: -6, right: -6, width: 16, height: 16, zIndex: 2,
        border: "2px solid #120A04", background: color, color: "#180E04",
        display: "grid", placeItems: "center", fontSize: 8, ...LB,
      }}>
        {n}
      </div>
    </div>
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
    /* Physical stamp flies up from its desk spot, presses the page, returns.
       The translate origin (down-left) is the stamp button's offset from the
       inspected card; --sx/--sy let callers tune it. */
    @keyframes stampFly {
      0%   { transform: translate(var(--sx, -140px), var(--sy, 250px)) scale(1); }
      14%  { transform: translate(var(--sx, -140px), var(--sy, 250px)) scale(1); }
      46%  { transform: translate(0, -12px) scale(1.14); }
      58%  { transform: translate(0, 6px) scale(0.82); }
      70%  { transform: translate(0, -8px) scale(1.06); }
      100% { transform: translate(var(--sx, -140px), var(--sy, 250px)) scale(1); }
    }
    .stampFly { animation: stampFly 900ms cubic-bezier(0.4, 0, 0.3, 1) both; }
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

/** Collection-complete celebration. Bigger + gold vs RewardToast; whole-container
 *  clears get a brighter flourish. Tap to dismiss (also auto-dismisses). */
export function AchievementToast({ data, onDismiss }) {
  if (!data) return null;
  const whole = data.whole;
  return (
    <div
      onClick={onDismiss}
      className="rewardPop"
      style={{
        position: "fixed", left: "50%", top: "22%", transform: "translateX(-50%)", zIndex: 600,
        width: "min(320px, 84vw)", padding: "14px 18px", textAlign: "center",
        background: whole ? "#4A2E17" : "#2A1A0C", color: "#FFD97A",
        border: "3px solid #120A04",
        boxShadow: `inset 0 0 0 2px ${whole ? "#FFD97A" : "#C9942E"}, 0 6px 0 #000, 0 0 24px rgba(201,148,46,0.5)`,
        cursor: "pointer", ...LB,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "1px", color: "#C9942E", marginBottom: 4 }}>
        {whole ? "✦ ZONE CLEARED ✦" : "✦ COLLECTION PACKED ✦"}
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.25, color: "#F2E4C0" }}>{data.label}</div>
      <div style={{ fontSize: 11, color: "#9CC76F", marginTop: 5 }}>all {data.count} packed</div>
    </div>
  );
}

function Screen({ title, icon, onBack, children, bg = "#1A1008", subtitle, progress, progressLabel, checklist, compact = false, flush = false, headerPad = 0, hideChrome = false, hideBack = false }) {
  const slim = compact || flush;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 250, background: bg, display: "flex", flexDirection: "column",
      animation: "screenIn 200ms ease-out", overflow: "hidden",
    }}>
      {screenCss}
      {!hideChrome && <div style={{
        flex: "0 0 auto",
        padding: slim
          ? `calc(env(safe-area-inset-top, 0px) + ${2 + headerPad}px) 6px ${2 + headerPad}px`
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
      </div>}
      <div style={{
        flex: 1, minHeight: 0,
        overflowY: slim ? "hidden" : "auto",
        padding: hideChrome
          ? `calc(env(safe-area-inset-top, 0px) + 6px) 8px calc(env(safe-area-inset-bottom, 0px) + 8px)`
          : flush
          ? "0 0 calc(env(safe-area-inset-bottom, 0px) + 4px)"
          : compact
            ? "4px 8px calc(env(safe-area-inset-bottom, 0px) + 8px)"
            : "8px 12px calc(env(safe-area-inset-bottom, 0px) + 16px)",
        display: slim ? "flex" : undefined,
        flexDirection: slim ? "column" : undefined,
      }}>
        {hideChrome && !hideBack && <button type="button" onClick={onBack} aria-label={`Back from ${title}`} style={{
          position: "absolute", top: `calc(env(safe-area-inset-top, 0px) + 10px)`, left: 10, zIndex: 20,
          width: 42, height: 30, border: "2px solid #120A04", background: "#2A1709", color: "#FFD97A",
          boxShadow: "inset 0 0 0 1px #8A5B24", fontSize: 10, cursor: "pointer", ...LB,
        }}>BACK</button>}
        {children}
      </div>
    </div>
  );
}

const soonTag = <span style={{ fontSize: 9, color: "#8A7350", ...LB }}>(soon)</span>;

/* ================= MENU / OVERVIEW ================= */
/** Tile icon art, sliced from the Main-menu UI asset sheet (see menu_slices/). */
const MENU_TILE_ICON = {
  desk: MENU_ICON_FOLDER,
  health: MENU_ICON_HEALTH,
  inventory: MENU_ICON_BOX,
  log: MENU_ICON_MONEYBAG,
  stretchy: MENU_ICON_CAT,
  settings: MENU_ICON_GEAR,
};

/**
 * Dark inset track within pressure_frame.png, measured in source-image
 * percentages (frame is 1091×191px; the empty track sits at x77–1006,
 * y72–131). Used to align the dynamic fill bar over the static frame art.
 */
const PRESSURE_TRACK = { left: 7.06, right: 7.79, top: 37.7, bottom: 31.4 };

function MenuScreen({ go, tasks }) {
  const uiLayout = useUiLayout();
  const pressure = taskPressure(tasks);
  const count = (cats) => tasks.filter((t) => isOpen(t) && cats.includes(t.category)).length;
  const soonest = (cats) => {
    const t = tasks.filter((x) => isOpen(x) && cats.includes(x.category));
    if (!t.length) return null;
    return t.slice().sort((a, b) => b.urgency - a.urgency)[0].due;
  };
  const tiles = [
    { key: "desk",      label: "Desk / Admin",   sub: "papers · housing · Shirley", badge: count(["job", "admin", "move", "housing"]), due: soonest(["job", "admin", "move", "housing"]) },
    { key: "health",    label: "Health / Body",  sub: "use it while covered",        badge: count(["health"]), due: soonest(["health"]) },
    { key: "inventory", label: "Inventory",      sub: "packed items",                badge: 0, due: null },
    { key: "log",       label: "Sold / Donated", sub: "the money log",               badge: 0, due: null },
    { key: "stretchy",  label: "Stretchy",       sub: "orange & fine",               badge: count(["cat"]), due: soonest(["cat"]) },
    { key: "settings",  label: "Settings",       sub: "sound & such",                badge: 0, due: null },
  ];
  const pressurePct = pressure / 3;
  const pressureColor = PRESSURE_COLORS[pressure] || PRESSURE_COLORS[0];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 250, background: "#1A1008", display: "flex", flexDirection: "column",
      animation: "screenIn 200ms ease-out", overflow: "hidden",
    }}>
      {screenCss}
      <div style={{
        flex: 1, minHeight: 0, overflow: "hidden",
        padding: "calc(env(safe-area-inset-top, 0px) + 8px) 10px calc(env(safe-area-inset-bottom, 0px) + 14px)",
        display: "flex", flexDirection: "column", gap: `clamp(4px, ${uiLayout.overview.gapDvh}dvh, 8px)`,
      }}>
        {/* Header: back arrow + list icon + title, on the ornate wood rail.
            Inset (not padding-on-100%-width) keeps this within the viewport —
            padding on top of an already-100%-wide box pushed the right edge
            past the screen edge. */}
        <div style={{
          position: "relative", width: "100%", aspectRatio: "1135 / 190",
          backgroundImage: `url(${MENU_HEADER_FRAME})`, backgroundSize: "100% 100%",
          imageRendering: "pixelated",
        }}>
          <div style={{
            position: "absolute", inset: "0 4%",
            display: "flex", alignItems: "center", gap: "3%",
          }}>
            <button onClick={() => go("apartment")} aria-label="Back" style={{
              flex: "0 0 auto", width: "10%", aspectRatio: "1 / 1", background: "none", border: "none", padding: 0,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <img src={MENU_BACK_ARROW} alt="" style={{ width: "100%", display: "block", imageRendering: "pixelated" }} />
            </button>
            <img src={MENU_LIST_ICON} alt="" style={{ width: "8%", flex: "0 0 auto", imageRendering: "pixelated" }} />
            <div style={{
              flex: 1, textAlign: "center", color: "#FFD97A", fontSize: "clamp(16px, 6vw, 26px)",
              letterSpacing: "2px", ...LB,
            }}>
              OVERVIEW
            </div>
            <div style={{ width: "10%", flex: "0 0 auto" }} aria-hidden />
          </div>
        </div>

        {/* Pressure bar */}
        <div style={{
          position: "relative", width: "100%", aspectRatio: "1091 / 191",
          backgroundImage: `url(${MENU_PRESSURE_FRAME})`, backgroundSize: "100% 100%", imageRendering: "pixelated",
        }}>
          <div style={{
            position: "absolute", left: "5%", right: "7%", top: `${uiLayout.overview.pressureTop}%`,
            display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6,
            color: "#3A2018", fontSize: "clamp(7px, 2.2vw, 9px)", ...LB,
          }}>
            <span style={{ flex: "1 1 auto", minWidth: 0 }}>PRESSURE — HOW LOUD LIFE IS RIGHT NOW</span>
            <span style={{ color: pressureColor, flex: "0 0 auto", fontSize: "clamp(6px, 2vw, 8px)", whiteSpace: "nowrap", paddingLeft: 2 }}>{(PRESSURE_LABELS[pressure] || "").toUpperCase()}</span>
          </div>
          <div style={{
            position: "absolute",
            left: `${PRESSURE_TRACK.left}%`, right: `${PRESSURE_TRACK.right}%`,
            top: `${PRESSURE_TRACK.top}%`, bottom: `${PRESSURE_TRACK.bottom}%`,
          }}>
            <div style={{
              width: `${Math.max(6, pressurePct * 100)}%`, height: "100%",
              background: pressureColor, transition: "width 280ms ease-out",
            }} />
          </div>
        </div>

        {/* Command board banner */}
        <button onClick={() => go("board")} style={{
          position: "relative", width: "100%", aspectRatio: "991 / 211", background: "none", border: "none",
          padding: 0, cursor: "pointer", textAlign: "left",
          backgroundImage: `url(${MENU_COMMAND_BANNER})`, backgroundSize: "100% 100%", imageRendering: "pixelated",
        }}>
          <div style={{
            position: "absolute", left: "20%", top: 0, right: "4%", bottom: 0,
            display: "flex", flexDirection: "column", justifyContent: "center", gap: 4,
          }}>
            <span style={{ color: "#241509", fontSize: "clamp(14px, 4.4vw, 19px)", ...LB }}>COMMAND BOARD</span>
            <span style={{ color: "#6B563B", fontSize: "clamp(9px, 2.8vw, 12px)", ...LB }}>what matters today</span>
          </div>
        </button>

        {/* Tile grid */}
        <div style={{ flex: "1 1 auto", minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "repeat(3, minmax(0, 1fr))", gap: `clamp(4px, ${uiLayout.overview.gapDvh}dvh, 8px)` }}>
          {tiles.map((t) => (
            <button key={t.key} onClick={() => go(t.key)} style={{
              position: "relative", width: "100%", height: "100%", minHeight: 0, background: "none", border: "none",
              padding: 0, cursor: "pointer", textAlign: "left",
              backgroundImage: `url(${MENU_TILE_FRAME})`, backgroundSize: "100% 100%", imageRendering: "pixelated",
            }}>
              <div style={{
                position: "absolute", inset: `${uiLayout.overview.tileTop}% 8% 8% ${uiLayout.overview.tileLeft}%`,
                display: "flex", flexDirection: "column", alignItems: "flex-start",
              }}>
                <img src={MENU_TILE_ICON[t.key]} alt="" style={{ width: "28%", marginBottom: "6%", imageRendering: "pixelated" }} />
                <span style={{ color: "#241509", fontSize: "clamp(11px, 3.6vw, 15px)", ...LB }}>{t.label.toUpperCase()}</span>
                <span style={{ color: "#6B563B", fontSize: "clamp(8px, 2.5vw, 10px)", lineHeight: 1.2, marginTop: 3, ...LB }}>{t.sub}</span>
                {t.due && (
                  <span style={{ color: "#A3252C", fontSize: "clamp(8px, 2.5vw, 10px)", marginTop: "auto", marginBottom: "6%", ...LB }}>due: {t.due}</span>
                )}
              </div>
              {t.badge > 0 && (
                <span style={{
                  position: "absolute", top: "6%", right: "6%", minWidth: 20, height: 20, padding: "0 5px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#C43B34", color: "#F3EDDD", fontSize: 12, border: "2px solid #120A04", ...LB,
                }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Footer — tall enough for the line to wrap to 2 lines inside the frame.
            Inset (not padding-on-100%-width) keeps this consistent with the other
            frames and avoids a content-box width+padding overflow. */}
        <div style={{
          position: "relative", width: "100%", aspectRatio: "1120 / 190",
          backgroundImage: `url(${MENU_FOOTER_FRAME})`, backgroundSize: "100% 100%", imageRendering: "pixelated",
        }}>
          <div style={{
            position: "absolute", inset: "0 9%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              display: "block", width: "100%", color: "#C9A876", fontSize: "clamp(9px, 2.6vw, 11px)", lineHeight: 1.35,
              textAlign: "center", whiteSpace: "normal", ...LB,
            }}>
              The apartment is home base — everything here is a side table.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= COMMAND BOARD + LEDGER ================= */
const EFFORT_DOT = (n) => "●".repeat(Math.min(3, Math.max(1, n || 1))) + "○".repeat(Math.max(0, 3 - Math.min(3, Math.max(1, n || 1))));
/** Horizontal task-card PNG aspect (job_row_card.png is 711×219). */
const THIN_CARD_H_OVER_W = 219 / 711;
/** Vertical full-card PNG aspect (job_full_card.png is 284×487). */
const FULL_CARD_H_OVER_W = 487 / 284;
/** Approx Draw/Remove button + row gap when estimating empty-deck height. */
const DRAW_ROW_SIDE_W = 64;

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

/** Command-board chrome: segmented energy row + custom scrollbar theming for the draw pile. */
const BOARD_ENERGY_SEGMENTS = [
  { id: "fumes", label: "FUMES", off: BOARD_FUMES_OFF, on: BOARD_FUMES_ON, sub: "bound must-dos only" },
  { id: "steady", label: "STEADY", off: BOARD_STEADY_OFF, on: BOARD_STEADY_ON, sub: "bound + draw 2 more" },
  { id: "full", label: "FULL", off: BOARD_FULL_OFF, on: BOARD_FULL_ON, sub: "bound + draw 4 more" },
];
const boardChromeCss = (
  <style>{`
    .board-draw-pane::-webkit-scrollbar { width: 10px; }
    .board-draw-pane::-webkit-scrollbar-track { background: #120A04; }
    .board-draw-pane::-webkit-scrollbar-thumb { background: #8A5A2E; border: 2px solid #120A04; }
    .board-draw-pane { scrollbar-width: thin; scrollbar-color: #8A5A2E #120A04; }
  `}</style>
);

function BoardScreen({ go, tasks, setTasks, session, onSessionBump, rewardToast, world }) {
  const energy = session?.energy || null;
  const deal = session?.dailyDeal;
  const picks = energy && deal ? handTasks(tasks, deal) : [];
  const offers = energy && deal ? offerTasks(tasks, deal) : [];
  const progress = dealProgress(deal);
  const [focusId, setFocusId] = useState(null);
  const handRef = useRef(null);
  const drawPaneRef = useRef(null);
  const [handW, setHandW] = useState(300);
  const [drawPaneH, setDrawPaneH] = useState(220);

  useEffect(() => {
    const el = handRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const measure = () => {
      setHandW(Math.max(180, el.clientWidth || 300));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [energy, picks.length, focusId, drawPaneH]);

  // Draw window height = chrome + exactly 2 thin-card rows (scroll for more).
  useLayoutEffect(() => {
    if (!energy) return undefined;
    const pane = drawPaneRef.current;
    if (!pane || typeof ResizeObserver === "undefined") return undefined;
    const measure = () => {
      const cardWrap = pane.querySelector("[data-draw-card]");
      const cardW = Math.max(100, pane.clientWidth - 16 - DRAW_ROW_SIDE_W);
      const measured = cardWrap ? cardWrap.getBoundingClientRect().height : 0;
      const cardH = measured > 1 ? measured : cardW * THIN_CARD_H_OVER_W;
      const header = pane.querySelector("[data-draw-header]");
      const note = pane.querySelector("[data-draw-note]");
      const headerH = header ? header.getBoundingClientRect().height : 18;
      const noteH = note ? note.getBoundingClientRect().height + 4 : 0;
      const padY = 12;
      const rowGap = 4;
      setDrawPaneH(Math.round(padY + headerH + noteH + 2 * cardH + rowGap));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(pane);
    const cardWrap = pane.querySelector("[data-draw-card]");
    if (cardWrap) ro.observe(cardWrap);
    return () => ro.disconnect();
  }, [energy, offers.length, deal?.fixedDay]);

  const markDone = (id) => {
    setTasks((ts) => refreshDailyHousingTasks(
      ts.map((t) => (t.id === id ? { ...t, status: "done", manualDone: true } : t))
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
  const putBack = (id) => {
    onSessionBump?.("manualPick", 0, null, { manualToggleId: id, manualToggleTasks: tasks });
    if (focusId === id) setFocusId(null);
  };
  const drawLabel = progress.requiredOptionalEffort > 0
    ? `Draw · ${progress.remainingEffort} effort left`
    : "Draw (optional)";
  const focus = picks.find((t) => t.id === focusId) || null;

  /** Hand card size is derived from WIDTH only (stable cap) — never inflated by leftover vertical space. */
  const HAND_PAD = 12;
  const HAND_MIN_STEP = 14;
  const HAND_STEP_RATIO = 0.38;
  const HAND_LIFT_ALLOWANCE = 16;
  /** Responsive cap: lands ~155 CSS px on a typical 390-414px-wide hand, never above 160. */
  const HAND_CARD_CAP = Math.round(Math.min(160, Math.max(120, handW * 0.42)));
  const handCardW = (() => {
    const n = Math.max(1, picks.length);
    const avail = Math.max(80, handW - HAND_PAD * 2);
    const byRatio = n <= 1 ? avail : avail / (1 + (n - 1) * HAND_STEP_RATIO);
    const byMinStep = n <= 1 ? avail : avail - (n - 1) * HAND_MIN_STEP;
    const fitW = Math.min(byRatio, Math.max(48, byMinStep));
    return Math.round(Math.max(48, Math.min(fitW, HAND_CARD_CAP)));
  })();
  const handCardH = Math.round(handCardW * FULL_CARD_H_OVER_W);
  /** Hand region hugs the card size — a small rotation/lift allowance, not a flex-filled void. */
  const handAreaHeight = handCardH + HAND_LIFT_ALLOWANCE;
  const fanLayout = (n, i, width) => {
    const cardW = handCardW;
    const avail = Math.max(width - HAND_PAD * 2, cardW);
    if (n <= 1) return { left: Math.max(HAND_PAD, (width - cardW) / 2), rot: -2, lift: 0 };
    const maxTravel = Math.max(0, avail - cardW);
    const ideal = maxTravel / Math.max(1, n - 1);
    const step = Math.max(8, Math.min(cardW * HAND_STEP_RATIO, ideal));
    const span = cardW + (n - 1) * step;
    const start = HAND_PAD + Math.max(0, (avail - span) / 2);
    const t = i / (n - 1);
    const rot = -6 + t * 12;
    const lift = Math.sin(t * Math.PI) * Math.min(10, handCardH * 0.03);
    return { left: start + i * step, rot, lift };
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 250, background: "#1A1008", display: "flex", flexDirection: "column",
      animation: "screenIn 200ms ease-out", overflow: "hidden",
    }}>
      {screenCss}
      {boardChromeCss}
      <div style={{
        flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden",
        padding: "calc(env(safe-area-inset-top, 0px) + 6px) 8px calc(env(safe-area-inset-bottom, 0px) + 8px)",
        gap: 6,
      }}>
        <RewardToast text={rewardToast} />

        {/* Framed header: back + COMMAND BOARD banner + N IN HAND chip */}
        <div style={{ display: "flex", alignItems: "stretch", gap: 6, flex: "0 0 auto" }}>
          <button type="button" onClick={() => go("menu")} aria-label="Back" style={{
            position: "relative", flex: "0 0 auto", width: 78, aspectRatio: "259 / 142",
            backgroundImage: `url(${BOARD_BACK_BUTTON})`, backgroundSize: "100% 100%", backgroundRepeat: "no-repeat",
            backgroundColor: "transparent", appearance: "none", WebkitAppearance: "none",
            border: "none", padding: 0, cursor: "pointer", imageRendering: "pixelated",
          }} />
          <div style={{
            position: "relative", flex: 1, minWidth: 0, aspectRatio: "569 / 144",
            backgroundImage: `url(${BOARD_HEADER_FRAME})`, backgroundSize: "100% 100%", backgroundRepeat: "no-repeat",
            imageRendering: "pixelated",
          }} />
          <div style={{
            position: "relative", flex: "0 0 auto", display: "flex", alignItems: "center", gap: 6,
            padding: "0 10px", background: "#241509", border: "3px solid #120A04",
            boxShadow: "inset 0 0 0 2px #6B4423, 0 3px 0 #000",
          }}>
            <span style={{ position: "relative", width: 14, height: 14, flex: "0 0 auto" }} aria-hidden>
              <span style={{ position: "absolute", left: 0, top: 2, width: 10, height: 12, background: "#8A5A2E", border: "1px solid #120A04", transform: "rotate(-10deg)" }} />
              <span style={{ position: "absolute", left: 3, top: 0, width: 10, height: 12, background: "#E8C4A8", border: "1px solid #120A04" }} />
            </span>
            <span style={{ color: "#FFD97A", fontSize: 10, whiteSpace: "nowrap", ...LB }}>{picks.length} IN HAND</span>
          </div>
        </div>

        {/* ENERGY segmented row + FIXED DAY indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flex: "0 0 auto", overflowX: "auto" }}>
          <div style={{
            position: "relative", flex: "0 0 auto", width: 62, aspectRatio: "274 / 103",
            backgroundImage: `url(${BOARD_ENERGY_LABEL})`, backgroundSize: "100% 100%", backgroundRepeat: "no-repeat",
            imageRendering: "pixelated",
          }} />
          {BOARD_ENERGY_SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              type="button"
              onClick={() => pickEnergy(seg.id)}
              aria-pressed={energy === seg.id}
              style={{
                position: "relative", flex: "1 1 0", minWidth: 0, aspectRatio: "223 / 95",
                backgroundImage: `url(${energy === seg.id ? seg.on : seg.off})`,
                backgroundSize: "100% 100%", backgroundRepeat: "no-repeat",
                backgroundColor: "transparent", appearance: "none", WebkitAppearance: "none",
                border: "none", padding: 0, cursor: "pointer", imageRendering: "pixelated",
              }}
            />
          ))}
          {deal?.fixedDay && (
            <div style={{
              position: "relative", flex: "0 0 auto", width: 74, aspectRatio: "237 / 103",
              backgroundImage: `url(${BOARD_FIXED_DAY_CHIP})`, backgroundSize: "100% 100%", backgroundRepeat: "no-repeat",
              imageRendering: "pixelated",
            }} />
          )}
        </div>

        {!energy ? (
          <div style={{ ...FR, padding: "10px 12px", flex: "0 0 auto" }}>
            <div style={{ color: "#F2E4C0", fontSize: 10, lineHeight: 1.5, ...LB }}>
              Pick a pace above to start your day — Fumes: bound must-dos only ·
              Steady: + 2 draws · Full: + 4 draws.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 6 }}>
            {/* OPTIONAL DRAW pane — same ref/measurement contract as before, restyled to the mockup frame */}
            <div
              ref={drawPaneRef}
              className="board-draw-pane"
              style={{
                position: "relative", padding: "6px 8px", flex: "0 0 auto",
                height: drawPaneH, overflowY: "auto",
                background: "#1B1006", border: "3px solid #120A04",
                boxShadow: "inset 0 0 0 2px #6B4423, 0 3px 0 #000",
              }}
            >
              <div
                data-draw-header
                style={{
                  display: "flex", alignItems: "baseline", justifyContent: "space-between",
                  marginBottom: 2, gap: 8,
                }}
              >
                <div style={{ color: "#FFD97A", fontSize: 12, ...LB }}>OPTIONAL DRAW</div>
                <div style={{ color: "#8A7350", fontSize: 9, ...LB }}>
                  {offers.length} IN DECK
                </div>
              </div>
              <div data-draw-note style={{ color: "#E8C4A8", fontSize: 9, marginBottom: 4, ...LB }}>
                {drawLabel}
                {deal?.fixedDay ? " · fixed day — these cards are already spoken for." : ""}
              </div>
              {offers.length === 0 ? (
                <div style={{ color: "#8A7350", fontSize: 11, ...LB }}>No extras to draw right now.</div>
              ) : offers.map((t) => (
                <div key={t.id} style={{
                  display: "flex", gap: 6, alignItems: "center", marginBottom: 4,
                }}>
                  <div data-draw-card style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <HorizontalTaskCard task={t} dimmed={!!t.picked} />
                  </div>
                  {t.picked ? (
                    <button type="button" onClick={() => toggleOffer(t.id)} style={{
                      flex: "0 0 56px", alignSelf: "stretch",
                      background: "#3A1810", color: "#F2E4C0", border: "2px solid #120A04",
                      fontSize: 9, cursor: "pointer", ...LB,
                    }}>Remove</button>
                  ) : (
                    <button type="button" onClick={() => toggleOffer(t.id)} aria-label="Draw" style={{
                      position: "relative", flex: "0 0 auto", alignSelf: "center", width: 52,
                      aspectRatio: "198 / 278",
                      backgroundImage: `url(${BOARD_DRAW_BUTTON})`, backgroundSize: "100% 100%", backgroundRepeat: "no-repeat",
                      backgroundColor: "transparent", appearance: "none", WebkitAppearance: "none",
                      border: "none", padding: 0, cursor: "pointer", imageRendering: "pixelated",
                    }} />
                  )}
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
                <button type="button" onClick={() => {
                  const destination = resolveTaskDestination(focus);
                  go(destination?.screen || doorForTask(focus), destination);
                }} style={{
                  padding: "6px 8px", background: "#3A2410", color: "#FFD97A",
                  border: "2px solid #120A04", fontSize: 10, cursor: "pointer", ...LB,
                }}>Go</button>
                <button type="button" onClick={() => markDone(focus.id)} style={{
                  padding: "6px 8px", background: "#5D7C3B", color: "#F2E4C0",
                  border: "2px solid #120A04", fontSize: 10, cursor: "pointer", ...LB,
                }}>Done</button>
                <button type="button" onClick={() => putBack(focus.id)} style={{
                  padding: "6px 8px", background: "#3A1810", color: "#E8C4A8",
                  border: "2px solid #120A04", fontSize: 10, cursor: "pointer", ...LB,
                }}>Put back</button>
              </div>
            )}

            {/* YOUR HAND · TAP A CARD — framed panel; hand sizing/geometry below is untouched */}
            <div style={{
              flex: "0 0 auto", display: "flex", flexDirection: "column",
              background: "#1B1006", border: "3px solid #120A04",
              boxShadow: "inset 0 0 0 2px #6B4423, 0 3px 0 #000",
              padding: "6px 8px",
            }}>
              <div style={{ color: "#FFD97A", fontSize: 10, textAlign: "center", marginBottom: 4, flex: "0 0 auto", ...LB }}>
                YOUR HAND · TAP A CARD
              </div>
              <div
                ref={handRef}
                style={{
                  position: "relative",
                  width: "100%",
                  height: handAreaHeight,
                  flex: "0 0 auto",
                  marginBottom: 4,
                  overflow: "hidden",
                }}
              >
                {picks.length === 0 ? (
                  <div style={{
                    color: "#8A7350", fontSize: 11, ...LB,
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    Empty hand — draw from the deck above.
                  </div>
                ) : picks.map((t, i) => {
                  const pos = fanLayout(picks.length, i, handW);
                  const on = focusId === t.id;
                  return (
                    <VerticalTaskCard
                      key={t.id}
                      task={t}
                      world={world}
                      width={handCardW}
                      bound={!!t.bound}
                      manual={!!t.manual}
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

        {/* FULL LEDGER · FLIP PAGE */}
        <button type="button" onClick={() => go("ledger")} aria-label="Full ledger — flip page" style={{
          position: "relative", width: "100%", aspectRatio: "1016 / 269", flex: "0 0 auto",
          backgroundImage: `url(${BOARD_LEDGER_BUTTON})`, backgroundSize: "100% 100%", backgroundRepeat: "no-repeat",
          backgroundColor: "transparent", appearance: "none", WebkitAppearance: "none",
          border: "none", padding: 0, cursor: "pointer", imageRendering: "pixelated",
        }} />
      </div>
    </div>
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
  { id: "crit", label: "Priority" },
  { id: "effort", label: "Effort" },
  { id: "score", label: "Fit" },
];

function ledgerDueKey(t) {
  if (t.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)) return t.dueDate;
  return "9999-99-99";
}

const EMPTY_TASK_BINDING = { feature: "", target: "", trigger: "", resultStatus: "" };
const optionValue = (option) => typeof option === "string" ? option : option.value;
const optionLabel = (option) => typeof option === "string" ? option : option.label;

function TaskBindingFields({ value, onChange, fieldStyle }) {
  const binding = value || EMPTY_TASK_BINDING;
  const targets = binding.feature ? targetOptionsForFeature(binding.feature) : [];
  const triggers = binding.feature ? (COMPLETION_TRIGGER_OPTIONS[binding.feature] || []) : [];
  const targetIsKnown = targets.some((option) => optionValue(option) === binding.target);
  const supportsMany = ["packing_requirement", "apartment_item", "inventory_collection", "inventory_item"].includes(binding.feature);
  const selectedTargets = binding.targets?.length ? binding.targets : (binding.target ? [binding.target] : []);
  const update = (patch) => onChange({ ...binding, ...patch });
  const selectStyle = { ...fieldStyle, marginBottom: 0, minWidth: 0 };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: "#8A7350", fontSize: 9, marginBottom: 4, ...LB }}>Game link (optional)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 5 }}>
        <select
          aria-label="Game feature"
          value={binding.feature}
          onChange={(e) => {
            const feature = e.target.value;
            const featureTriggers = COMPLETION_TRIGGER_OPTIONS[feature] || [];
            update({
              feature,
              target: "",
              targets: undefined,
              aggregate: undefined,
              trigger: optionValue(featureTriggers[0] || ""),
              resultStatus: feature ? "done" : "",
            });
          }}
          style={selectStyle}
        >
          <option value="">Feature</option>
          {GAME_FEATURE_OPTIONS.map((option) => (
            <option key={optionValue(option)} value={optionValue(option)}>{optionLabel(option)}</option>
          ))}
        </select>
        <select
          aria-label="Game target"
          multiple={supportsMany}
          size={supportsMany ? 6 : undefined}
          value={supportsMany ? selectedTargets : (binding.target ? (targetIsKnown ? binding.target : "__custom__") : "")}
          disabled={!binding.feature}
          onChange={(e) => {
            if (supportsMany) {
              const selected = Array.from(e.target.selectedOptions, (option) => option.value).filter((value) => value !== "__custom__");
              update({ target: selected[0] || "", targets: selected.length > 1 ? selected : undefined, aggregate: "all" });
            } else {
              update({ target: e.target.value === "__custom__" ? "custom:" : e.target.value, targets: undefined, aggregate: undefined });
            }
          }}
          style={{ ...selectStyle, opacity: binding.feature ? 1 : 0.55 }}
        >
          <option value="">Target</option>
          {targets.map((option) => (
            <option key={optionValue(option)} value={optionValue(option)}>{optionLabel(option)}</option>
          ))}
          <option value="__custom__">Custom ID…</option>
        </select>
        <select
          aria-label="Completion trigger"
          value={binding.trigger}
          disabled={!binding.feature}
          onChange={(e) => update({ trigger: e.target.value })}
          style={{ ...selectStyle, opacity: binding.feature ? 1 : 0.55 }}
        >
          <option value="">Completion trigger</option>
          {triggers.map((option) => (
            <option key={optionValue(option)} value={optionValue(option)}>{optionLabel(option)}</option>
          ))}
        </select>
        <select
          aria-label="Resulting task status"
          value={binding.resultStatus}
          disabled={!binding.feature}
          onChange={(e) => update({ resultStatus: e.target.value })}
          style={{ ...selectStyle, opacity: binding.feature ? 1 : 0.55 }}
        >
          <option value="">Result status</option>
          {TASK_RESULT_OPTIONS.map((option) => (
            <option key={optionValue(option)} value={optionValue(option)}>{optionLabel(option)}</option>
          ))}
        </select>
      </div>
      {supportsMany && <div style={{ color: "#8A7350", fontSize: 8, marginTop: 4, ...LB }}>
        Select one or more. All selected requirements must be complete.
      </div>}
      {binding.feature && (binding.target?.startsWith("custom:") || (binding.target && !targetIsKnown)) && (
        <input
          aria-label="Custom game target ID"
          value={binding.target.startsWith("custom:") ? binding.target.slice("custom:".length) : binding.target}
          placeholder={binding.feature === "apartment_item" ? "room:item_id" : "Custom target ID"}
          onChange={(e) => update({ target: `custom:${e.target.value}`, targets: undefined, aggregate: undefined })}
          style={{ ...fieldStyle, marginTop: 5, marginBottom: 0 }}
        />
      )}
    </div>
  );
}

function LedgerScreen({ go, tasks, setTasks, session, onSessionBump, world }) {
  const [lane, setLane] = useState("housing");
  const [sortBy, setSortBy] = useState("due");
  const [showArchived, setShowArchived] = useState(false);
  const [draft, setDraft] = useState("");
  const [effort, setEffort] = useState(1);
  const [editId, setEditId] = useState(null);
  const [editDraft, setEditDraft] = useState({
    title: "", due: "", dueDate: "", targetDate: "", latestDate: "",
    effort: 1, criticality: 1, category: "housing", status: "pending", selfTarget: false, scheduleOverride: false,
    binding: EMPTY_TASK_BINDING,
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
      } else if (sortBy === "crit") {
        const c = (b.criticality || 1) - (a.criticality || 1);
        if (c !== 0) return c;
        const d = ledgerDueKey(a).localeCompare(ledgerDueKey(b));
        if (d !== 0) return d;
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
      ts.map((t) => (t.id === id ? { ...t, status: "done", manualDone: true } : t))
    ));
    onSessionBump?.("cleared", 1, "Cleared +1");
    if (editId === id) setEditId(null);
  };
  const dailyDeal = session?.dailyDeal;
  const hasTodayDeal = dailyDeal?.day === todayKey();
  const handSet = new Set(dailyDeal?.selectedTaskIds || []);
  const toggleHand = (id) => {
    onSessionBump?.("manualPick", 0, null, { manualToggleId: id, manualToggleTasks: tasks });
  };
  const beginEdit = (t) => {
    const calculated = t.dueDate ? scheduleDatesForLedger(t, t.dueDate) : null;
    const normalizedBinding = normalizeTaskBinding(t.binding);
    setEditId(t.id);
    setEditDraft({
      title: t.title || "",
      due: t.due || "",
      dueDate: t.dueDate || "",
      targetDate: calculated?.targetDate || t.targetDate || "",
      latestDate: calculated?.latestDate || t.latestDate || t.dueEnd || "",
      scheduleOverride: !!t.scheduleOverride,
      effort: t.effort || 1,
      criticality: Math.min(3, Math.max(1, Number(t.criticality) || 1)),
      category: t.category || lane,
      status: t.status || "pending",
      selfTarget: !!t.selfTarget,
      binding: { ...EMPTY_TASK_BINDING, ...(t.binding || {}), ...(normalizedBinding || {}) },
    });
  };
  const saveEdit = () => {
    if (!editId) return;
    const title = editDraft.title.trim();
    if (!title) return;
    const cat = TASK_CATEGORIES[editDraft.category] ? editDraft.category : lane;
    const dueDate = editDraft.dueDate.trim() || null;
    setTasks((ts) => refreshDailyHousingTasks(
      ts.map((t) => {
        if (t.id !== editId) return t;
        const dateLocked = isTaskDateLocked(t);
        // Ledger dueDate is the player's date — keep schedule fields in sync so
        // Vercel/local edits actually drive the binder (never wipe other save fields).
        const next = {
          ...t,
          title,
          due: dateLocked ? t.due : editDraft.due.trim(),
          dueDate: dateLocked ? t.dueDate : dueDate,
          effort: Math.min(3, Math.max(1, Number(editDraft.effort) || 1)),
          // Persist as criticalityOverride so normalizeTask honours the manual
          // value over the job fit-score bucket; mirror into criticality so the
          // importance pips update immediately (before the next normalize pass).
          criticality: Math.min(3, Math.max(1, Number(editDraft.criticality) || 1)),
          criticalityOverride: Math.min(3, Math.max(1, Number(editDraft.criticality) || 1)),
          category: cat,
          status: editDraft.status === "done" ? "done" : "pending",
          selfTarget: !!editDraft.selfTarget,
          binding: editDraft.binding?.feature ? { ...editDraft.binding } : null,
          scheduleOverride: !!editDraft.scheduleOverride,
        };
        if (next.status === "done" && t.status !== "done") next.manualDone = true;
        if (next.status !== "done") next.manualDone = false;
        if (next.binding?.feature === "health_zone" || next.binding?.feature === "health_appointment") {
          next.zone = next.binding.target;
        }
        next.kind = next.binding?.feature === "health_appointment" && next.binding.trigger === "booked"
          ? "book"
          : (next.kind === "book" ? null : next.kind);
        next.completionMode = next.binding ? "world" : "manual";
        if (!dateLocked && dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
          const calculated = scheduleDatesForLedger(next, dueDate);
          const targetDate = /^\d{4}-\d{2}-\d{2}$/.test(editDraft.targetDate) ? editDraft.targetDate : calculated.targetDate;
          const requestedLatest = /^\d{4}-\d{2}-\d{2}$/.test(editDraft.latestDate) ? editDraft.latestDate : calculated.latestDate;
          const latestDate = requestedLatest < targetDate ? targetDate : requestedLatest;
          Object.assign(next, { targetDate, latestDate, dueEnd: latestDate });
        }
        return next;
      })
    ));
    if (cat !== lane) setLane(cat);
    setEditId(null);
  };
  const archiveEdit = () => {
    if (!editId) return;
    setTasks((ts) => ts.map((t) => (t.id === editId ? { ...t, status: "archived" } : t)));
    setEditId(null);
  };
  const archivedCount = tasks.filter((t) => t.status === "archived").length;
  const clearArchived = () => {
    if (!archivedCount) return;
    if (!window.confirm(`Permanently delete all ${archivedCount} archived task${archivedCount === 1 ? "" : "s"} (every lane)? This can't be undone.`)) return;
    // Removing from the saved list is permanent: mergeTasks treats saved membership
    // as canonical, so the seed won't re-add them on next load.
    setTasks((ts) => ts.filter((t) => t.status !== "archived"));
  };
  const restoreArchived = (id) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: "pending", manualDone: false } : t)));
  };
  const addSticky = () => {
    const title = draft.trim();
    if (!title) return;
    setTasks((ts) => [...ts, makeQuickTask({ title, category: lane, effort, binding: null })]);
    setDraft("");
    setEffort(1);
  };
  const field = {
    width: "100%", boxSizing: "border-box", padding: "8px", marginBottom: 6,
    background: "#1A0F06", color: "#F2E4C0", border: "2px solid #4A2E17", fontSize: 12, ...LB,
  };
  return (
    <Screen title="Ledger" icon="📒" onBack={() => go("board")} bg="#2A1A0C" hideChrome>
      <div aria-hidden="true" style={{ height: 48, width: "calc(100% - 52px)", margin: "-4px 0 8px 52px", maxWidth: 390, display: "grid", placeItems: "center", background: `url(${LEDGER_HEADER}) center/100% 100% no-repeat`, color: "#FFD97A", fontSize: 16, ...LB }}>LEDGER</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        {LEDGER_LANES.map((l) => (
          <button key={l.id} type="button" onClick={() => { setLane(l.id); setEditId(null); }} style={{
            padding: "6px 8px", fontSize: 10, cursor: "pointer",
            background: `url(${lane === l.id ? LEDGER_CHIP_PAPER : LEDGER_CHIP_DARK}) center/100% 100% no-repeat`,
            color: lane === l.id ? "#120A04" : "#C9B896", border: 0, ...LB,
          }}>{l.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10, alignItems: "center" }}>
        <span style={{ color: "#8A7350", fontSize: 9, ...LB }}>Sort</span>
        {LEDGER_SORTS.map((s) => (
          <button key={s.id} type="button" onClick={() => setSortBy(s.id)} style={{
            padding: "4px 8px", fontSize: 10, cursor: "pointer",
            background: `url(${sortBy === s.id ? LEDGER_CHIP_ACTIVE : LEDGER_CHIP_DARK}) center/100% 100% no-repeat`,
            color: sortBy === s.id ? "#F2E4C0" : "#C9B896",
            border: 0, ...LB,
          }}>{s.label}</button>
        ))}
        <button type="button" onClick={() => { setShowArchived((v) => !v); setEditId(null); }} style={{
          marginLeft: "auto", padding: "4px 8px", fontSize: 10, cursor: "pointer",
          background: showArchived ? "#6B3A2A" : "#241509",
          color: showArchived ? "#F2E4C0" : "#C9B896",
          border: "2px solid #120A04", ...LB,
        }}>{showArchived ? "Active" : "Archived"}</button>
      </div>
      {showArchived && archivedCount > 0 && (
        <button type="button" onClick={clearArchived} style={{
          width: "100%", marginBottom: 10, padding: "10px", cursor: "pointer",
          background: "#5A1E18", color: "#F2C9C0", border: "2px solid #120A04", fontSize: 11, ...LB,
        }}>🗑 Delete all {archivedCount} archived (every lane) — permanent</button>
      )}
      {!showArchived && (
      <div style={{ ...FR, padding: "18px 12px 12px", marginBottom: 10, background: `url(${LEDGER_QUICK_ADD}) center/100% 100% no-repeat`, border: 0 }}>
        <div style={{ color: "#3A2018", fontSize: 10, marginBottom: 8, ...LB }}>QUICK-ADD STICKY</div>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="One line..."
          style={{ ...field, height: 44, marginBottom: 10 }}
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
        const inHand = handSet.has(t.id);
        if (editId === t.id) {
          const dateLocked = isTaskDateLocked(t);
          const datePreview = !dateLocked && /^\d{4}-\d{2}-\d{2}$/.test(editDraft.dueDate)
            ? scheduleDatesForLedger({ ...t, category: editDraft.category, selfTarget: editDraft.selfTarget }, editDraft.dueDate)
            : null;
          return (
            <div key={t.id} style={{ ...FR, padding: 10, marginBottom: 8 }}>
              <div style={{ color: "#FFD97A", fontSize: 10, marginBottom: 6, ...LB }}>Edit card</div>
              <input value={editDraft.title} onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))} style={field} />
              <input disabled={dateLocked} value={editDraft.due} onChange={(e) => setEditDraft((d) => ({ ...d, due: e.target.value }))} placeholder="Due label (e.g. Jul 15)" style={{ ...field, opacity: dateLocked ? 0.55 : 1 }} />
              <input disabled={dateLocked} type="date" value={editDraft.dueDate} onChange={(e) => setEditDraft((d) => {
                const dueDate = e.target.value;
                const calculated = scheduleDatesForLedger({ ...t, category: d.category, selfTarget: d.selfTarget }, dueDate);
                return { ...d, dueDate, targetDate: calculated.targetDate || "", latestDate: calculated.latestDate || "", scheduleOverride: false };
              })} style={{ ...field, opacity: dateLocked ? 0.55 : 1 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 6 }}>
                <label style={{ color: "#8A7350", fontSize: 8, ...LB }}>
                  TARGET
                  <input disabled={dateLocked} type="date" value={editDraft.targetDate} onChange={(e) => setEditDraft((d) => ({ ...d, targetDate: e.target.value, scheduleOverride: true }))} style={{ ...field, margin: "3px 0 0", opacity: dateLocked ? 0.55 : 1 }} />
                </label>
                <label style={{ color: "#8A7350", fontSize: 8, ...LB }}>
                  LATEST
                  <input disabled={dateLocked} type="date" value={editDraft.latestDate} onChange={(e) => setEditDraft((d) => ({ ...d, latestDate: e.target.value, scheduleOverride: true }))} style={{ ...field, margin: "3px 0 0", opacity: dateLocked ? 0.55 : 1 }} />
                </label>
              </div>
              <div style={{ color: dateLocked ? "#D9A33C" : "#8A7350", fontSize: 9, margin: "-2px 0 7px", ...LB }}>
                {dateLocked
                  ? `Fixed schedule · target ${t.targetDate || t.dueDate || "—"} · latest ${t.latestDate || t.dueEnd || t.dueDate || "—"}`
                  : datePreview
                    ? `Default rule: target ${datePreview.targetDate} · latest ${datePreview.latestDate}. You can override either above.`
                    : "Choose a date to calculate target and latest."}
              </div>
              <TaskBindingFields
                value={editDraft.binding}
                onChange={(binding) => setEditDraft((d) => ({ ...d, binding }))}
                fieldStyle={field}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                {LEDGER_LANES.map((l) => (
                  <button key={l.id} type="button" onClick={() => setEditDraft((d) => {
                    const calculated = scheduleDatesForLedger({ ...t, category: l.id, selfTarget: d.selfTarget }, d.dueDate);
                    return { ...d, category: l.id, targetDate: calculated.targetDate || d.targetDate, latestDate: calculated.latestDate || d.latestDate, scheduleOverride: false };
                  })} style={{
                    padding: "4px 6px", fontSize: 9, cursor: "pointer",
                    background: editDraft.category === l.id ? "#C9942E" : "#241509",
                    color: editDraft.category === l.id ? "#120A04" : "#C9B896",
                    border: "2px solid #120A04", ...LB,
                  }}>{l.label}</button>
                ))}
              </div>
              {editDraft.category === "job" && (
                <label style={{ display: "flex", alignItems: "center", gap: 7, color: "#C9B896", fontSize: 9, marginBottom: 7, ...LB }}>
                  <input type="checkbox" checked={!!editDraft.selfTarget} onChange={(e) => setEditDraft((d) => {
                    const selfTarget = e.target.checked;
                    const calculated = scheduleDatesForLedger({ ...t, category: "job", selfTarget }, d.dueDate);
                    return { ...d, selfTarget, targetDate: calculated.targetDate || d.targetDate, latestDate: calculated.latestDate || d.latestDate, scheduleOverride: false };
                  })} />
                  Self-imposed date (latest becomes +5 days)
                </label>
              )}
              <div style={{ color: "#8A7350", fontSize: 8, margin: "0 0 2px", ...LB }}>EFFORT — top circles on card (⚡)</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                {[1, 2, 3].map((n) => (
                  <button key={n} type="button" onClick={() => setEditDraft((d) => ({ ...d, effort: n }))} style={{
                    flex: 1, padding: "6px", fontSize: 10, cursor: "pointer",
                    background: editDraft.effort === n ? "#5D7C3B" : "#241509", color: "#F2E4C0",
                    border: "2px solid #120A04", ...LB,
                  }}>{EFFORT_DOT(n)}</button>
                ))}
              </div>
              <div style={{ color: "#8A7350", fontSize: 8, margin: "0 0 2px", ...LB }}>
                IMPORTANCE (criticality) — bottom circles on card (⚠), drives Priority sort{editDraft.category === "job" ? " · overrides fit-score default" : ""}
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {[1, 2, 3].map((n) => (
                  <button key={n} type="button" onClick={() => setEditDraft((d) => ({ ...d, criticality: n }))} style={{
                    flex: 1, padding: "6px", fontSize: 10, cursor: "pointer",
                    background: editDraft.criticality === n ? "#C43B34" : "#241509", color: "#F2E4C0",
                    border: "2px solid #120A04", ...LB,
                  }}>{"●".repeat(n)}{"○".repeat(3 - n)}</button>
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
          <div key={t.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 72px", gap: 6, alignItems: "center", marginBottom: 7, opacity: open ? 1 : 0.68 }}>
            <HorizontalTaskCard task={t} dimmed={!open} style={{ width: "100%", minWidth: 0 }} />
            <div style={{ display: "grid", gap: 4 }}>
            {showArchived ? (
              <button type="button" onClick={() => restoreArchived(t.id)} style={{
                padding: "8px 10px", background: "#5D7C3B", color: "#F2E4C0",
                border: "2px solid #120A04", fontSize: 11, cursor: "pointer", flex: "0 0 auto", ...LB,
              }}>Restore</button>
            ) : (
              <>
                <button aria-label={`Edit ${t.title}`} type="button" onClick={() => beginEdit(t)} style={{ height: 34, border: 0, cursor: "pointer", background: `url(${LEDGER_EDIT}) center/100% 100% no-repeat` }} />
                {open && (
                  // Always allow manual completion — world-bound tasks auto-complete
                  // via their game action, but the ledger must never trap a real
                  // task behind gameplay.
                  <button aria-label={`Done ${t.title}`} type="button" onClick={() => markDone(t.id)} style={{ height: 34, border: 0, cursor: "pointer", background: `url(${LEDGER_DONE}) center/100% 100% no-repeat` }} />
                )}
                {!open && t.status === "done" && (
                  <button aria-label={`Undo done ${t.title}`} type="button" onClick={() => restoreArchived(t.id)} style={{
                    padding: "8px 6px", background: "#3A2410", color: "#FFD97A",
                    border: "2px solid #120A04", fontSize: 10, cursor: "pointer", ...LB,
                  }}>UNDO ✓</button>
                )}
                {open && !!dailyDeal && (
                  <button
                    type="button"
                    aria-label={inHand ? `Remove ${t.title} from today's hand` : `Add ${t.title} to today's hand`}
                    onClick={() => toggleHand(t.id)}
                    style={{
                      padding: "3px 4px", border: "2px solid #120A04", cursor: "pointer",
                      background: inHand ? "#44695B" : "#241509",
                      color: inHand ? "#F2E4C0" : "#C9B896",
                      fontSize: 9, textAlign: "center", ...LB,
                    }}
                  >{inHand ? "IN HAND ✓" : "HAND +"}</button>
                )}
              </>
            )}
            </div>
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

function LandlineHotspot({ onPickUp, ringing, rattling, showArcs, size = 72, idleLabel = "phone", bottom = 6, center = false, title = "Call" }) {
  return (
    <button
      type="button"
      onClick={onPickUp}
      title={title}
      style={{
        position: "absolute", bottom, zIndex: 4,
        ...(center ? { left: "50%", transform: "translateX(-50%)" } : { left: 6 }),
        width: size, height: size, padding: 4, cursor: "pointer",
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
        {ringing ? "RING" : idleLabel}
      </div>
    </button>
  );
}

/** Apartment HUD: floating ringing phone with arcs — tap to open Desk. */
export function IncomingPhoneCue({ onAnswer, npcName = RECEPTIONIST_NAME }) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => onIncomingRingPulse(setPulse), []);
  return (
    <button
      type="button"
      onClick={onAnswer}
      title={`${npcName} is calling`}
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
        {npcName}…
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
  npcName = RECEPTIONIST_NAME,
  idleSourceLabel = "on the line",
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
      if (lineError === LINE_BUSY_LABEL) return "desk line";
      return lineError
        ? `script bank · ${lineError}`
        : "script bank";
    }
    return idleSourceLabel;
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
                Dial {npcName}
              </button>
              <button type="button" onClick={onCancelCeremony} style={{
                background: "transparent", border: "none", color: "#8A7350", fontSize: 11, cursor: "pointer", ...LB,
              }}>Put down</button>
            </>
          )}
          {phase === "dial" && (
            <div style={{ color: "#C9B896", fontSize: 13 }}>Dialing {npcName}…</div>
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
              <div style={{ color: "#FFD97A", fontSize: 13 }}>{npcName}</div>
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
                    <div style={{ fontSize: 8, color: "#8A7350", marginBottom: 4 }}>{npcName}</div>
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

/** Outgoing contact picker — small in-tray list, one row per phone NPC. */
function ContactPickerOverlay({ onPick, onClose }) {
  const rows = [
    { id: "shirley", label: `${NPCS.shirley.name} · ${NPCS.shirley.sub}` },
    { id: "sal", label: `${NPCS.sal.name} · ${NPCS.sal.sub}` },
    { id: "vivian", label: `${NPCS.vivian.name} · ${NPCS.vivian.sub}` },
  ];
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 6, width: "100%", padding: 4,
    }}>
      <div style={{ color: "#C9B896", fontSize: 10, textAlign: "center", marginBottom: 2, ...LB }}>Contacts</div>
      {rows.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onPick(r.id)}
          style={{
            padding: "8px 10px", background: "#3A2410", color: "#F2E4C0",
            border: "2px solid #120A04", fontSize: 11, cursor: "pointer", textAlign: "left", ...LB,
          }}
        >{r.label}</button>
      ))}
      <button
        type="button"
        onClick={onClose}
        style={{ background: "transparent", border: "none", color: "#8A7350", fontSize: 10, cursor: "pointer", ...LB }}
      >Close</button>
    </div>
  );
}

function DeskScreen({ go, tasks, setTasks, playSfx, session, onSessionBump, rewardToast,
  appointments, setAppointments, objState, incomingCall, clearIncomingCall, world }) {
  const [tray, setTray] = useState("all"); // all | admin | job | housing
  const deskTasks = tasks.filter((t) => isOpen(t) && ["job", "admin", "move", "housing", "health", "cat"].includes(t.category));
  const filtered = deskTasks.filter((t) => {
    if (tray === "admin") return t.category === "admin" || t.category === "move";
    if (tray === "job") return t.category === "job";
    if (tray === "housing") return t.category === "housing";
    return true;
  });
  const filed = tasks.filter((t) => t.status === "done" && ["job", "admin", "move", "housing", "health", "cat"].includes(t.category));
  const deskCategories = ["move", "job", "admin", "health", "cat", "housing"];
  const incomingByCategory = deskCategories.map((category) => ({
    category,
    tasks: deskTasks.filter((task) => task.category === category).sort((a, b) => urgencyScore(b) - urgencyScore(a)),
  }));
  const filedByCategory = deskCategories.map((category) => ({ category, tasks: filed.filter((task) => task.category === category) }));
  const filedRecent = filed.slice().reverse();
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

  /* Landline ceremony + call — shared across Shirley/Sal/Vivian */
  const [phonePhase, setPhonePhase] = useState(null); // null | pickup | dial | ringing | talking | hanging
  const [phoneNpc, setPhoneNpc] = useState("shirley"); // shirley | sal | vivian
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [phoneMsgs, setPhoneMsgs] = useState([]);
  const [callState, setCallState] = useState({ phase: "await_visit", draft: {}, priorityId: null });
  const [phoneWaiting, setPhoneWaiting] = useState(false);
  const [lineSource, setLineSource] = useState(null); // live | script
  const [lineError, setLineError] = useState(null); // last improv failure reason, if any
  const [incomingRing, setIncomingRing] = useState(!!incomingCall);
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
    if (incomingCall) setIncomingRing(true);
  }, [incomingCall]);

  useEffect(() => () => {
    clearPhoneRing();
    stopPhoneReceiverLoop();
    stopPhoneIncomingRingtone();
    setPhoneMusicDuck(false);
  }, []);

  /** Current gameState snapshot handed to an NPC's opener/factsBlock/bankReply. */
  const gameStateNow = () => ({ tasks, appointments: apptsRef.current, session, objState });

  const startTalking = (npcId) => {
    clearPhoneRing();
    stopPhoneReceiverLoop();
    stopPhoneIncomingRingtone();
    setIncomingRing(false);
    setPhoneMusicDuck(true);
    playPhoneAnswerSfx();
    const id = npcId || "shirley";
    const npc = NPCS[id] || NPCS.shirley;
    const gs = gameStateNow();
    const opener = npc.opener(gs);
    setPhoneNpc(id);
    // Shirley-only: seed the FSM's priority task from her nudge (a "remind"/
    // "overdue" nudge points at an already-booked appt, which priorityHealthTask
    // alone would miss since it only looks at unbooked open visits), and mark
    // a delivered reminder call. Sal/Vivian don't use priorityId.
    let priorityId = null;
    if (id === "shirley") {
      const nudge = getNudge(apptsRef.current, tasks);
      const pri = nudge?.task || priorityHealthTask(tasks, apptsRef.current);
      priorityId = pri?.id || null;
      if (nudge?.kind === "remind" && nudge.appt) {
        setAppointments((a) => markReminded(a, nudge.appt.id));
      }
    }
    setCallState({
      phase: "await_visit",
      draft: {},
      priorityId,
      stall: 0,
      denyCount: 0,
    });
    setPhoneMsgs([{ role: "npc", text: opener }]);
    setPhonePhase("talking");
    if (incomingCall && incomingCall.npcId === id) {
      onSessionBump?.("lastIncomingDay", 0, null, { lastIncomingDay: todayKey() });
      clearIncomingCall?.();
    }
  };

  const pickUpPhone = () => {
    clearPhoneRing();
    stopPhoneIncomingRingtone();
    const wasIncoming = incomingRing;
    setIncomingRing(false);
    // Someone's calling you → answer straight into the chat (no dial ceremony).
    if (wasIncoming) {
      startTalking(incomingCall?.npcId || "shirley");
      return;
    }
    // Quick-dial from the handset: ring whoever's highest priority right now.
    const target = pickIncomingCaller({ tasks, appointments: apptsRef.current, session, today: new Date() });
    setPhoneNpc(target?.npcId || "shirley");
    setPhonePhase("pickup");
    afterPhoneDuck(() => {
      playPhonePickupSfx(); // starts looping receiver tone
    });
  };

  /** Contact-picker row tap: same pickup ceremony as the handset, for a chosen NPC. */
  const startContactCall = (npcId) => {
    setContactPickerOpen(false);
    setPhoneNpc(npcId);
    setPhonePhase("pickup");
    afterPhoneDuck(() => {
      playPhonePickupSfx();
    });
  };

  const dialCall = () => {
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
          startTalking(phoneNpc);
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
      setTasks((ts) => refreshDailyHousingTasks(completeTaskFromEvent(
        tasksAfterBooking(ts, result.appt, bookTask),
        { feature: "health_appointment", target: result.appt.zone, trigger: "booked" }
      )));
    }
  };

  /** MARK application layer: only apply if the task's category is in that
   *  NPC's allowed lane (Sal/move, Vivian/job, Shirley/health+cat). */
  const applyMarkPayload = (npcId, mark, appts) => {
    if (!mark?.taskId) return;
    const task = tasks.find((t) => t.id === mark.taskId);
    if (!task || !canNpcMark(npcId, task)) return;
    const status = mark.status === "archived" ? "archived" : (mark.status === "attended" ? "attended" : "done");
    setTasks((ts) => refreshDailyHousingTasks(
      ts.map((t) => (t.id === mark.taskId ? { ...t, status } : t))
    ));
    if (status === "attended") {
      const activeAppt = findApptForTask(appts, mark.taskId);
      if (activeAppt) setAppointments(attendAppointment(appts, activeAppt.id));
    }
  };

  const handlePhoneSend = async (userText) => {
    if (phoneWaiting || phonePhase !== "talking") return;
    const npcId = phoneNpc;
    const npc = NPCS[npcId] || NPCS.shirley;
    const nextMsgs = [...msgsRef.current, { role: "user", text: userText }];
    setPhoneMsgs(nextMsgs);
    setPhoneWaiting(true);
    setLineError(null);

    let usedAgent = false;
    if (improvEnabled()) {
      let agent = { ok: false, error: "network" };
      try {
        agent = await askNpc(npcId, {
          messages: nextMsgs,
          tasks,
          appointments: apptsRef.current,
          session,
          objState,
        });
      } catch (e) {
        console.warn(`[${npc.name}] askNpc threw:`, e);
        agent = { ok: false, error: "network", detail: String(e?.message || e) };
      }
      if (agent.ok && agent.text) {
        usedAgent = true;
        let appts = apptsRef.current;
        let line = agent.text;
        // BOOK/CANCEL/ADD are Shirley's desk only — parsed for every NPC by
        // the shared tag parser, but only ever applied for her.
        if (npcId === "shirley") {
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
          if (agent.cancel?.taskId) {
            const cancelled = cancelAppointment(appts, agent.cancel.taskId);
            if (cancelled.ok) {
              setAppointments(cancelled.appointments);
              appts = cancelled.appointments;
            }
          }
          if (agent.add?.title) {
            const newTask = makeQuickTask({
              title: agent.add.title,
              category: agent.add.category === "cat" ? "cat" : "health",
              effort: 1,
              binding: { feature: "health_appointment", trigger: "booked", target: null },
            });
            setTasks((ts) => [...ts, newTask]);
            if (agent.add.dueAt) {
              const apptResult = bookAppointment(appts, [...tasks, newTask], {
                taskId: newTask.id,
                dueAt: agent.add.dueAt,
                time: null,
              });
              if (apptResult.ok) {
                setAppointments(apptResult.appointments);
                appts = apptResult.appointments;
              }
            }
          }
        }
        if (agent.mark?.taskId) applyMarkPayload(npcId, agent.mark, appts);
        setLineSource("live");
        setLineError(null);
        setPhoneMsgs([...nextMsgs, { role: "npc", text: line }]);
        setPhoneWaiting(false);
        return;
      }
      const errLabel = formatShirleyLineError(agent.error, agent.detail);
      setLineError(errLabel);
      console.warn(`[${npc.name}] falling back to script bank:`, errLabel);
    }

    if (!usedAgent) {
      const reply = npc.bankReply(userText, callStateRef.current, gameStateNow());
      if (npcId === "shirley") {
        if (reply.tasks) setTasks(refreshDailyHousingTasks(reply.tasks));
        if (reply.appointments) setAppointments(reply.appointments);
        else if (reply.book?.ok) applyBookResult(reply.book);
      } else if (reply.mark) {
        applyMarkPayload(npcId, reply.mark, apptsRef.current);
      }
      setCallState(reply.callState || callStateRef.current);
      setLineSource("script");
      setPhoneMsgs([...nextMsgs, { role: "npc", text: reply.line }]);
      setPhoneWaiting(false);
      if (reply.hangup) {
        setTimeout(() => hangUp(), 1400);
      }
    }
  };

  const SAL_CHIPS = [
    { id: "hi", label: "Hey Sal", text: "Hey Sal" },
    { id: "boxes", label: "3 boxes closed", text: "3 boxes closed" },
    { id: "next", label: "What's next?", text: "What's next?" },
    { id: "bye", label: "Gotta go", text: "Gotta go" },
  ];
  const VIVIAN_CHIPS = [
    { id: "hi", label: "Hi Vivian", text: "Hi Vivian" },
    { id: "applied", label: "I applied", text: "I applied" },
    { id: "notyet", label: "Not yet", text: "Not yet" },
    { id: "bye", label: "Gotta go", text: "Gotta go" },
  ];
  const chips = phonePhase === "talking"
    ? (phoneNpc === "shirley" ? buildQuickChips(tasks, appointments, callState)
      : phoneNpc === "sal" ? SAL_CHIPS
        : VIVIAN_CHIPS)
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

  /* Today's Hand status for the left daily panel — reads session.dailyDeal
     directly against selectedTaskIds (not handTasks(), which filters to open
     tasks only and would hide the done ones we need to count). */
  const dailyDeal = session?.dailyDeal;
  const hasHandToday = dailyDeal?.day === todayKey();
  const handTaskObjs = hasHandToday
    ? (dailyDeal.selectedTaskIds || []).map((id) => tasks.find((t) => t.id === id)).filter(Boolean)
    : [];
  const handTotal = handTaskObjs.length;
  const handDoneCount = handTaskObjs.filter((t) => t.status === "done").length;
  const handRemaining = handTaskObjs.filter((t) => t.status !== "done");

  const resolve = (mode) => {
    if (!inspected || resolving) return;
    if (isWorldBoundTask(inspected) && mode !== "info") {
      setRelief("Complete this card through its linked game action.");
      setTimeout(() => setRelief(null), 1800);
      return;
    }
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
        ts.map((t) => (t.id === id ? { ...t, status: "done", needsInfo: false, manualDone: true } : t))
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
      hideChrome
      hideBack
      flush
    >
      <RewardToast text={rewardToast} />
      <div style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ height: 40, flex: "0 0 auto", display: "grid", gridTemplateColumns: "72px 1fr", gap: 8 }}>
        <button type="button" onClick={() => go("apartment")} style={{ border: 0, background: `url(${LEDGER_CHIP_DARK}) center/100% 100% no-repeat`, color: "#FFD97A", fontSize: 11, ...LB }}>BACK</button>
        <div style={{ display: "grid", placeItems: "center", background: `url(${DESK_PLAQUE}) center/100% 100% no-repeat`, color: "#FFD97A", fontSize: 15, ...LB }}>PAPERWORK DESK</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 7, flex: "0 0 84px" }}>
        <button
          type="button"
          onClick={() => go("board")}
          style={{
            /* paddingTop clears the baked-in "Daily To-Do Board" band of the
               stretched panel PNG (~26% of panel height at 84px). minWidth 0
               stops long card titles from inflating the grid column. */
            minWidth: 0, minHeight: 0, height: "100%", boxSizing: "border-box", padding: "23px 11px 6px",
            background: `url(${DESK_DAILY_PANEL}) center/100% 100% no-repeat`, color: "#3A2018",
            border: 0, margin: 0, appearance: "none", WebkitAppearance: "none",
            font: "inherit", textAlign: "left", cursor: "pointer", overflow: "hidden",
            display: "flex", flexDirection: "column", justifyContent: "center",
          }}
        >
          {!hasHandToday || handTotal === 0 ? (
            <div style={{ fontSize: 9, lineHeight: 1.25, ...LB }}>No hand dealt yet — tap to pick today's pace.</div>
          ) : handDoneCount === handTotal ? (
            <div style={{ fontSize: 9, lineHeight: 1.25, ...LB }}>Hand clear — nicely done.</div>
          ) : (
            <>
              <div style={{ fontSize: 9, ...LB }}>HAND&nbsp;&nbsp;{handDoneCount}/{handTotal}</div>
              {handRemaining.slice(0, 2).map((t) => (
                <div key={t.id} style={{
                  fontSize: 8, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden",
                  textOverflow: "ellipsis", ...LB,
                }}>
                  {t.title}
                </div>
              ))}
            </>
          )}
        </button>
        <div style={{
          /* paddingTop clears the baked-in "Inbox" band of the stretched panel
             PNG (~42% of panel height at 84px); content centers below it. */
          minWidth: 0, minHeight: 0, height: "100%", boxSizing: "border-box", padding: "34px 11px 7px",
          background: `url(${DESK_INBOX_PANEL}) center/100% 100% no-repeat`, color: "#3A2018",
          display: "flex", flexDirection: "column", justifyContent: "center",
        }}>
          <div style={{ fontSize: 10, ...LB }}>{deskTasks.length} open</div>
          <div style={{ fontSize: 8.5, marginTop: 4, ...LB }}>
            <span style={{ color: "#A3252C" }}>● {deskTasks.filter((t) => t.urgency >= 3).length}</span> urgent{"   "}
            <span style={{ color: "#B77A1E" }}>● {deskTasks.filter((t) => t.urgency === 2).length}</span> soon
          </div>
        </div>
      </div>
      <div style={{
        position: "relative",
        border: "3px solid #120A04", background: "repeating-linear-gradient(0deg, #5A381F 0 14px, #6E452A 14px 16px)",
        padding: "4px 7px 4px", boxShadow: "inset 0 0 0 2px #3E2413", flex: 1, minHeight: 0,
        display: "flex", flexDirection: "column",
      }}>
        {/* No overlay here anymore — tapping a stack/filed card sets inspectId,
            and the real card renders down in the DESK_TRAY area below.
            This wrapper (not the tray/phone row) absorbs any height pressure
            from INCOMING/FILED growing — flex:1 + minHeight:0 + overflowY
            keeps the stamp/tray/phone row pinned at a fixed height so it can
            never get pushed off the bottom of the screen. */}
        <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#C9B896", fontSize: 10, textAlign: "center", margin: "1px 0 4px", ...LB }}>INCOMING — one stack per category</div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridAutoRows: "min-content",
            columnGap: 5, rowGap: 7, marginBottom: 6, flex: "0 0 auto", justifyItems: "center",
          }}>
            {incomingByCategory.map(({ category, tasks: stack }) => (
              <DeskIncomingStack
                key={category}
                category={category}
                stack={stack}
                width={90}
                selected={!!inspected && stack.some((t) => t.id === inspected.id)}
                onClick={() => stack[0] && setInspectId(stack[0].id)}
              />
            ))}
          </div>

          <div style={{ color: "#C9B896", fontSize: 10, textAlign: "center", margin: "1px 0 4px", ...LB }}>FILED — finished</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 4, flex: "0 0 auto" }}>
            {filedRecent.length === 0 ? (
              <div style={{ color: "#9C8A66", fontSize: 9, padding: "10px 4px", ...LB }}>Nothing filed yet — stamp a paper to finish it.</div>
            ) : (
              <>
                {/* ALL filed cards, wrapped — never a side-scroll, never hidden
                    behind a "+N more". The blotter scrolls vertically if the
                    pile outgrows the screen; the tray row stays pinned. */}
                {filedRecent.map((task, index) => (
                  <div key={task.id} style={{ position: "relative", flex: "0 0 auto" }}>
                    <VerticalTaskCard
                      task={task}
                      world={world}
                      width={62}
                      selected={inspectId === task.id}
                      onClick={() => setInspectId(task.id)}
                      style={{ opacity: 0.9 }}
                    />
                    <img
                      src={[DESK_STAMP_APPROVED, DESK_STAMP_FILED, DESK_STAMP_DONE][index % 3]}
                      alt=""
                      style={{ position: "absolute", left: "8%", bottom: "6%", width: "84%", pointerEvents: "none" }}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div style={{ display: "none", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
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
        <div style={{ height: 4 }} />

        <div style={{ display: "none", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "88px minmax(0, 1fr) 82px", gap: 6, flex: "0 0 clamp(150px, 23dvh, 205px)", minHeight: 0 }}>
          <div style={{ display: "grid", gridTemplateRows: "1fr 72px", gap: 5, minHeight: 0 }}>
            <button type="button" onClick={() => resolve("stamp")} disabled={!inspected || !!resolving} aria-label="Stamp selected paper done" style={{ border: 0, opacity: 1, filter: inspected ? "none" : "brightness(.8)", background: `url(${DESK_PHYSICAL_STAMP}) center/100% 100% no-repeat`, cursor: inspected ? "pointer" : "default" }} />
            <div style={{ border: "2px solid #120A04", background: "#EFE7D2", textAlign: "center", padding: 3 }}>
              <div style={{ background: "#A3252C", color: "#F2E4C0", fontSize: 7, ...LB }}>{["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][deskNow.getMonth()]}</div>
              <div style={{ color: "#221306", fontSize: 18, lineHeight: 1.15, ...LB }}>{deskNow.getDate()}</div>
              <div style={{ color: "#5A381F", fontSize: 7, ...LB }}>{["SUN","MON","TUE","WED","THU","FRI","SAT"][deskNow.getDay()]}</div>
            </div>
          </div>
          <div style={{ minHeight: 0, border: 0, background: `url(${DESK_TRAY}) center/100% 100% no-repeat`, boxShadow: "none", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "visible" }}>
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
              npcName={NPCS[phoneNpc]?.name}
              idleSourceLabel={
                phoneNpc === "sal" ? "dispatch office · or whatever"
                  : phoneNpc === "vivian" ? "recruiter's desk · or whatever"
                    : "doctors office · or whatever"
              }
              onDial={dialCall}
              onSend={handlePhoneSend}
              onHangUp={hangUp}
              onCancelCeremony={cancelCeremony}
            />
          )}
          {!phonePhase && contactPickerOpen && (
            <ContactPickerOverlay onPick={startContactCall} onClose={() => setContactPickerOpen(false)} />
          )}
          {!phonePhase && !contactPickerOpen && inspected && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ position: "relative" }}>
                <VerticalTaskCard task={inspected} width={84} world={world} />
                {resolving && resolving.id === inspected.id && resolving.mode !== "info" && (
                  <>
                    {/* ink residue left on the paper — pops in as the stamp presses */}
                    <div className="stampMark" style={{
                      position: "absolute", top: "26%", left: "8%", padding: "3px 8px", zIndex: 4,
                      border: `4px solid ${resolving.mode === "file" ? "#44695B" : "#A3252C"}`,
                      color: resolving.mode === "file" ? "#44695B" : "#A3252C",
                      fontSize: 14, letterSpacing: 1, background: "rgba(255,255,255,0.28)",
                      transform: "rotate(-8deg)", animation: "stampIn 300ms cubic-bezier(0.2,1.4,0.4,1) 500ms both", ...LB,
                    }}>{resolving.mode === "file" ? "FILED" : "DONE"}</div>
                    {/* the real stamp sprite flies in from the physical stamp button at the tray's left, presses, returns */}
                    <div style={{
                      position: "absolute", top: "34%", left: "50%", transform: "translate(-50%, -50%)",
                      pointerEvents: "none", zIndex: 6,
                    }}>
                      <img
                        src={DESK_PHYSICAL_STAMP}
                        alt=""
                        className="stampFly"
                        style={{ "--sx": "-120px", "--sy": "40px", width: 48, height: 48, imageRendering: "pixelated", display: "block" }}
                      />
                    </div>
                  </>
                )}
              </div>
              {inspected.status !== "done" ? (
                <div style={{ display: "flex", gap: 3 }}>
                  <button type="button" onClick={() => resolve("stamp")} disabled={!!resolving} style={{ padding: "2px 5px", border: "2px solid #120A04", background: "#44695B", color: "#F2E4C0", fontSize: 7.5, lineHeight: 1.2, cursor: "pointer", ...LB }}>✓ Done</button>
                  <button type="button" onClick={() => resolve("info")} disabled={!!resolving} style={{ padding: "2px 5px", border: "2px solid #120A04", background: "#3A2410", color: "#FFD97A", fontSize: 7.5, lineHeight: 1.2, cursor: "pointer", ...LB }}>Needs info</button>
                  <button type="button" onClick={() => setInspectId(null)} disabled={!!resolving} style={{ padding: "2px 5px", border: "2px solid #120A04", background: "#241509", color: "#C9B896", fontSize: 7.5, lineHeight: 1.2, cursor: "pointer", ...LB }}>Close</button>
                </div>
              ) : (
                <button type="button" onClick={() => setInspectId(null)} style={{ padding: "2px 7px", border: "2px solid #120A04", background: "#241509", color: "#C9B896", fontSize: 7.5, lineHeight: 1.2, cursor: "pointer", ...LB }}>Close</button>
              )}
            </div>
          )}
          {!phonePhase && !contactPickerOpen && !inspected && (
            <div style={{ color: "#8A7350", fontSize: 11, textAlign: "center", ...LB }}>
              Tap a stack to inspect a paper.
            </div>
          )}
          {relief && (
            <div style={{
              position: "absolute", bottom: 2, left: 0, right: 0, textAlign: "center",
              color: "#8FD14F", fontSize: 11, animation: "reliefUp 1.6s ease-out both", ...LB,
            }}>{relief}</div>
          )}
        </div>
          <div style={{ display: "grid", gridTemplateRows: "1fr 60px", gap: 4, minHeight: 0 }}>
            <div style={{ position: "relative", minHeight: 0 }}>
              {!phonePhase && <LandlineHotspot onPickUp={pickUpPhone} ringing={incomingRing} rattling={phoneRattling || incomingPulse} showArcs={incomingPulse} size={82} bottom={20} center idleLabel="CALL" title={incomingRing ? `${NPCS[incomingCall?.npcId || "shirley"]?.name} is calling` : "Call"} />}
            </div>
            <button type="button" onClick={() => { if (!phonePhase) setContactPickerOpen((v) => !v); }} aria-label="Contacts" style={{ border: 0, cursor: "pointer", background: `url(${DESK_CONTACTS}) center/100% 100% no-repeat` }} />
          </div>
        </div>
      </div>

      <div style={{ display: "none", gap: 5, marginTop: 10 }}>
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
      <div style={{ display: "none", marginTop: 10, color: "#6B563B", fontSize: 10, textAlign: "center", ...LB }}>
        Approved / File → outbox. Needs Info stays on the desk.
      </div>
      </div>
    </Screen>
  );
}

/* ================= HEALTH / BODY ================= */
/**
 * x/y = center of the octagon icon, in percent of the BODY FIGURE's own
 * bounding box (measured off body_board_health_mockup.png — figure spans
 * roughly x:225-705 / y:285-995 in that 941x1672 render). zone ids are the
 * real task.zone values from tasks.js — do not rename, Shirley/schedule.js
 * key off them directly.
 */
const HEALTH_ZONES = [
  { id: "brain",  label: "PSYCHIATRY",   note: "Psychiatry + med renewals", icon: HEALTH_ZONE_PSYCH,  x: 50,   y: 5,   size: 15, care: "herbal" },
  { id: "teeth",  label: "DENTIST",      note: "Dentist visit",             icon: HEALTH_ZONE_DENTIST, x: 50,  y: 15.5, size: 15, care: "balm" },
  { id: "heart",  label: "CARDIOLOGY",   note: "Cardiology appointment",    icon: HEALTH_ZONE_CARDIO,  x: 50,  y: 29, care: "patch" },
  { id: "skin",   label: "DERMATOLOGY",  note: "Dermatology appointment",   icon: HEALTH_ZONE_DERM,    x: 20,  y: 36, care: "balm" },
  { id: "lymph",  label: "RHEUMATOLOGY", note: "Rheumatology appointment",  icon: HEALTH_ZONE_RHEUM,   x: 79,  y: 36, care: "balm" },
  { id: "obgyn",  label: "OB/GYN",       note: "IUD replacement",           icon: HEALTH_ZONE_OBGYN,   x: 50,  y: 56, care: "herbal" },
];

const CARE_ITEMS = [
  { id: "herbal", label: "Calm Herbal", icon: "🌿" },
  { id: "patch",  label: "Patch Kit",   icon: "🩹" },
  { id: "balm",   label: "Soothe Balm", icon: "🧴" },
];

/** need-booking / scheduled / later — same palette as the legend dots. */
const ZONE_STATE_COLOR = { ready: "#C24F2A", scheduled: "#4A7CAE", later: "#D9A33C", done: "#8FD14F" };

const healthCallBtnStyle = {
  width: "100%", marginTop: 8, padding: "10px 8px", textAlign: "center",
  background: "linear-gradient(#3B577A, #22344C)", border: "3px solid #120A04",
  boxShadow: "inset 0 0 0 2px #17233350, 0 3px 0 #000",
  color: "#F2E4C0", fontSize: 13, cursor: "pointer", ...LB,
};

function HealthScreen({ go, tasks, setTasks, session, onSessionBump, rewardToast,
  appointments, setAppointments, taskFocus }) {
  const uiLayout = useUiLayout();
  const healthZones = HEALTH_ZONES.map((z) => ({ ...z, ...(uiLayout.body.zones[z.id] || {}) }));
  const [zone, setZone] = useState(null);
  useEffect(() => {
    if (taskFocus?.zone) setZone(taskFocus.zone);
  }, [taskFocus?.zone]);
  const [panel, setPanel] = useState(null); // null | "care" | "records"
  const [detailsOpen, setDetailsOpen] = useState(false);
  const sel = healthZones.find((z) => z.id === zone) || null;

  const leave = () => {
    playContainerSfx("mirror_cabinet", "close");
    go("apartment");
  };

  const zoneDone = (zid) => {
    if (session.calmedZones?.[zid]) return true;
    const t = tasks.find((x) => x.zone === zid);
    return t ? t.status === "done" : false;
  };
  const stabilized = healthZones.filter((z) => zoneDone(z.id)).length;
  const openCount = healthZones.length - stabilized;
  const prog = sessionProgress(session, HEALTH_SESSION_GOALS);
  const booked = activeAppointments(appointments);

  const zoneBookTask = (zid) => tasks.find((t) => t.zone === zid && t.kind === "book");
  const zoneAppt = (zid) => booked.find((a) => a.zone === zid) || null;
  /** ready = callable now · scheduled = booked/reminded · later = deferred or already handled elsewhere · done = stabilized. */
  const zoneState = (z) => {
    if (zoneDone(z.id)) return "done";
    if (zoneAppt(z.id)) return "scheduled";
    const bt = zoneBookTask(z.id);
    if (bt && isBookableHealthTask(bt)) return "ready";
    return "later";
  };
  const stateCounts = healthZones.reduce((acc, z) => {
    const s = zoneState(z);
    if (s !== "done") acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const needBooking = stateCounts.ready || 0;
  const scheduledCount = stateCounts.scheduled || 0;
  const laterCount = stateCounts.later || 0;

  const stabilizeZone = (zid) => {
    if (zoneDone(zid)) return;
    setTasks((ts) => completeTaskFromEvent(ts, { feature: "health_zone", target: zid, trigger: "stabilized" }));
    onSessionBump?.("zones", 1, "Well Rested +1", { calmedZone: zid });
  };

  const useCare = (careId) => {
    const target = sel && !zoneDone(sel.id) ? sel
      : healthZones.find((z) => z.care === careId && !zoneDone(z.id));
    if (target && !zoneDone(target.id)) {
      setTasks((ts) => completeTaskFromEvent(ts, { feature: "health_zone", target: target.id, trigger: "stabilized" }));
      onSessionBump?.("zones", 1, null, { calmedZone: target.id });
    }
    onSessionBump?.("care", 1, "Self-Care +1");
  };

  const finishAppt = (appt) => {
    const gate = canAttendZone(appointments, appt.zone);
    if (!gate || gate.id !== appt.id) return;
    setAppointments((list) => attendAppointment(list, appt.id));
    setTasks((ts) => completeTaskFromEvent(tasksAfterAttend(ts, appt), {
      feature: "health_appointment", target: appt.zone, trigger: "attended",
    }));
    stabilizeZone(appt.zone);
    onSessionBump?.("appt", 1, "Appointment ✓");
  };

  // Same nav Shirley/booking already lives behind — Health never forks the
  // appointment FSM, it just routes to the Desk landline that owns it.
  const callOffice = () => go("desk");

  const selectZone = (zid) => {
    setZone(zid);
    setPanel(null);
    setDetailsOpen(false);
  };
  const togglePanel = (name) => setPanel((p) => (p === name ? null : name));

  const laterExplain = (bt) => {
    if (bt?.dependsNote) return bt.dependsNote;
    if (bt?.availableFrom) return `Opens ${formatApptDay(bt.availableFrom)}`;
    return "Nothing to do here yet.";
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 250, background: "#1A1008", display: "flex", flexDirection: "column",
      animation: "screenIn 200ms ease-out", overflow: "hidden",
    }}>
      {screenCss}
      <div style={{
        flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden",
        padding: "calc(env(safe-area-inset-top, 0px) + 6px) 8px calc(env(safe-area-inset-bottom, 0px) + 8px)",
        gap: 6,
      }}>
        <RewardToast text={rewardToast} />

        {/* Framed header: back arrow + BODY BOARD banner + N OPEN chip — the
            title segment reuses the ornate wood/brass menu-header frame so it
            reads as a framed banner instead of a flat bar. */}
        <div style={{ display: "flex", alignItems: "stretch", gap: 6, flex: "0 0 auto" }}>
          <button type="button" onClick={leave} aria-label="Back" style={{
            position: "relative", flex: "0 0 auto", width: 66, aspectRatio: "213 / 92",
            backgroundImage: `url(${HEALTH_BACK_BUTTON})`, backgroundSize: "100% 100%", backgroundRepeat: "no-repeat",
            backgroundColor: "transparent", appearance: "none", WebkitAppearance: "none",
            border: "none", padding: 0, cursor: "pointer", imageRendering: "pixelated",
          }} />
          <div style={{
            position: "relative", flex: 1, minWidth: 0, aspectRatio: "1135 / 190",
            backgroundImage: `url(${MENU_HEADER_FRAME})`, backgroundSize: "100% 100%", backgroundRepeat: "no-repeat",
            imageRendering: "pixelated", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#FFD97A", fontSize: "clamp(13px, 4.2vw, 18px)", ...LB }}>BODY BOARD</span>
          </div>
          <div style={{
            position: "relative", flex: "0 0 auto", display: "flex", alignItems: "center",
            padding: "0 9px", ...FR,
          }}>
            <span style={{ color: "#FFD97A", fontSize: 10, whiteSpace: "nowrap", ...LB }}>{openCount} OPEN</span>
          </div>
        </div>

        {/* Clipboard — body figure with zone octagons pinned on it, plus the
            selected-zone note pinned near the bottom so it overlaps the legs
            like the mockup (not a separate panel below the board). The
            clipboard box is sized by BOTH width and height (never just
            width), so the top clasp/badge is never cropped. */}
        <div style={{
          position: "relative", flex: 1, minHeight: 0, width: "100%", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            position: "relative", height: "100%", width: "auto", maxWidth: "100%",
            aspectRatio: "682 / 1024",
          }}>
            <img
              src={HEALTH_CLIPBOARD}
              alt=""
              draggable={false}
              style={{
                display: "block", width: "100%", height: "100%", objectFit: "fill",
                imageRendering: "pixelated", pointerEvents: "none", userSelect: "none",
              }}
            />
            {/* body figure — sized to fill the parchment top-to-bottom
                (height-driven, so it stays true to the sprite's tall aspect
                ratio); pushed low enough that the lower legs run behind the
                note paper pinned below, matching the mockup. */}
            <div style={{
              position: "absolute", left: "50%", top: "9%", height: "84%",
              transform: "translateX(-50%)", aspectRatio: "406 / 903",
            }}>
              <img
                src={HEALTH_BODY_FIGURE}
                alt=""
                draggable={false}
                style={{
                  width: "100%", height: "100%", objectFit: "contain",
                  imageRendering: "pixelated", pointerEvents: "none", userSelect: "none",
                }}
              />
              {healthZones.map((z) => {
                const state = zoneState(z);
                const isSel = zone === z.id;
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => selectZone(z.id)}
                    aria-label={z.label}
                    style={{
                      position: "absolute", left: `${z.x}%`, top: `${z.y}%`, zIndex: 2,
                      transform: "translate(-50%, -38%)",
                      width: `${z.size || 19}%`, aspectRatio: "140 / 188",
                      background: "transparent", appearance: "none", WebkitAppearance: "none",
                      border: "none", padding: 0, cursor: "pointer",
                      outline: isSel ? "3px solid #FFD97A" : "none",
                      boxShadow: isSel ? "0 0 10px 2px rgba(255,217,122,0.65)" : "none",
                    }}
                  >
                    <img
                      src={z.icon}
                      alt=""
                      draggable={false}
                      style={{ width: "100%", height: "100%", objectFit: "contain", imageRendering: "pixelated" }}
                    />
                    <span
                      aria-hidden
                      style={{
                        position: "absolute", top: "6%", right: "4%", width: 11, height: 11, borderRadius: "50%",
                        border: "2px solid #120A04", background: ZONE_STATE_COLOR[state],
                        animation: state === "ready" ? "zonePulse 1.8s ease-in-out infinite"
                          : state === "done" ? "zoneCalm 900ms ease-out" : "none",
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Selected-zone / Care Kit / Records note — pinned near the
                clipboard's bottom edge so it overlaps the figure's legs,
                sized to ~30% of the parchment height like the mockup. */}
            <div style={{
              position: "absolute", left: "6%", right: "9%", top: `${uiLayout.body.paper.top}%`, bottom: `${uiLayout.body.paper.bottom}%`,
              backgroundImage: panel ? "none" : `url(${HEALTH_NOTE_PAPER})`,
              backgroundColor: panel ? "#241509" : "transparent",
              backgroundSize: "100% 100%", backgroundRepeat: "no-repeat",
              border: panel ? "3px solid #120A04" : "none",
              boxShadow: panel ? "inset 0 0 0 2px #6B4423" : "none",
              padding: panel ? "8px 10px" : `${uiLayout.body.paper.paddingTop}% 12px 8px ${uiLayout.body.paper.contentX}%`,
              imageRendering: "pixelated", overflow: "auto",
            }}>
              {panel === "care" && (
            <>
              <div style={{ color: "#FFD97A", fontSize: 12, marginBottom: 6, ...LB }}>Care Kit</div>
              <div style={{ display: "flex", gap: 4 }}>
                {CARE_ITEMS.map((c) => (
                  <button key={c.id} onClick={() => useCare(c.id)} style={{
                    flex: 1, padding: "6px 2px", background: "#3A2410", color: "#F2E4C0",
                    border: "2px solid #120A04", fontSize: 9, cursor: "pointer", lineHeight: 1.2, ...LB,
                  }}>
                    <div style={{ fontSize: 14 }}>{c.icon}</div>
                    {c.label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 6, color: "#8A7350", fontSize: 9, ...LB }}>
                Uses the selected zone first, else the next open match. Care used {prog.items?.find((i) => i.id === "care")?.cur ?? 0}/3 today.
              </div>
            </>
          )}

          {panel === "records" && (
            <>
              <div style={{ color: "#FFD97A", fontSize: 12, marginBottom: 6, ...LB }}>Records — booked appointments</div>
              {booked.length === 0 && (
                <div style={{ color: "#8A7350", fontSize: 10, ...LB }}>Nothing on the books yet.</div>
              )}
              <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
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
                        flex: "0 0 auto", width: 100, padding: "4px 6px", textAlign: "left",
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
            </>
          )}

          {!panel && !sel && (
            <div style={{ color: "#6B563B", fontSize: 11, textAlign: "center", marginTop: 18, ...LB }}>
              Tap a zone on the chart.
            </div>
          )}

          {!panel && sel && (() => {
            const state = zoneState(sel);
            const bt = zoneBookTask(sel.id);
            const appt = zoneAppt(sel.id);
            const dueToday = appt && canAttendZone(appointments, sel.id)?.id === appt.id;
            const statusText = state === "done" ? "stable"
              : state === "scheduled" ? (dueToday ? "ready to attend" : `booked ${formatApptDay(appt.dueAt)}`)
              : state === "ready" ? "needs scheduling"
              : "later";
            return (
              <>
                <div style={{ color: "#2A1808", fontSize: 16, ...LB }}>{sel.label}</div>
                <div style={{ borderTop: "1px dashed #B89A6A", margin: "4px 0 6px" }} />
                <div style={{ color: "#4A3420", fontSize: 11, ...LB }}>
                  {sel.note} · {statusText}
                </div>
                {bt && state !== "done" && (
                  <div style={{ marginTop: 3, color: "#8A6B3E", fontSize: 9, ...LB }}>{taskStatus(bt)}</div>
                )}

                {state === "ready" && (
                  <button onClick={callOffice} style={healthCallBtnStyle}>CALL OFFICE</button>
                )}
                {state === "scheduled" && dueToday && (
                  <button onClick={() => finishAppt(appt)} style={{ ...healthCallBtnStyle, background: "linear-gradient(#3E7A52, #245234)" }}>
                    ATTEND APPOINTMENT
                  </button>
                )}
                {state === "scheduled" && !dueToday && (
                  <div style={{ marginTop: 8, color: "#5A4526", fontSize: 10, ...LB }}>Come back on the day of the visit.</div>
                )}
                {state === "later" && (
                  <div style={{ marginTop: 8, color: "#5A4526", fontSize: 10, ...LB }}>Not callable yet — {laterExplain(bt)}</div>
                )}
                {state === "done" && (
                  <div style={{ marginTop: 8, color: "#3B6B2E", fontSize: 10, ...LB }}>Handled. Nice.</div>
                )}

                <div style={{ textAlign: "center", marginTop: 6 }}>
                  <button
                    onClick={() => setDetailsOpen((v) => !v)}
                    style={{ background: "none", border: "none", color: "#2C4F7A", fontSize: 10, textDecoration: "underline", cursor: "pointer", ...LB }}
                  >
                    {detailsOpen ? "Hide details" : "View details"}
                  </button>
                  {detailsOpen && (
                    <div style={{ marginTop: 4, color: "#5A4526", fontSize: 9, textAlign: "left", ...LB }}>
                      {bt ? bt.title : "No open task for this zone."}
                      {bt?.due ? ` · ${bt.due}` : ""}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
            </div>
          </div>
        </div>

        {/* Status legend strip */}
        <div style={{
          position: "relative", flex: "0 0 auto", minHeight: 26,
          backgroundImage: `url(${HEALTH_LEGEND_BAR})`, backgroundSize: "100% 100%", backgroundRepeat: "no-repeat",
          imageRendering: "pixelated", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "4px 8px", flexWrap: "nowrap", overflow: "hidden",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: ZONE_STATE_COLOR.ready, border: "1px solid #120A04", flex: "0 0 auto" }} />
          <span style={{ color: "#E4917A", fontSize: 10, whiteSpace: "nowrap", ...LB }}>{needBooking} need booking</span>
          <span style={{ color: "#6B563B" }}>·</span>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: ZONE_STATE_COLOR.scheduled, border: "1px solid #120A04", flex: "0 0 auto" }} />
          <span style={{ color: "#8FB4D9", fontSize: 10, whiteSpace: "nowrap", ...LB }}>{scheduledCount} scheduled</span>
          <span style={{ color: "#6B563B" }}>·</span>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: ZONE_STATE_COLOR.later, border: "1px solid #120A04", flex: "0 0 auto" }} />
          <span style={{ color: "#E8C98A", fontSize: 10, whiteSpace: "nowrap", ...LB }}>{laterCount} later</span>
        </div>

        {/* SHIRLEY / CARE KIT / RECORDS */}
        <div style={{ display: "flex", gap: 6, flex: "0 0 auto" }}>
          <button type="button" onClick={callOffice} aria-label="Shirley" style={{
            flex: 1, position: "relative", aspectRatio: "323 / 142",
            backgroundImage: `url(${HEALTH_SHIRLEY_BTN})`, backgroundSize: "100% 100%", backgroundRepeat: "no-repeat",
            backgroundColor: "transparent", appearance: "none", WebkitAppearance: "none",
            border: "none", padding: 0, cursor: "pointer", imageRendering: "pixelated",
          }} />
          <button type="button" onClick={() => togglePanel("care")} aria-label="Care Kit" style={{
            flex: 1, position: "relative", aspectRatio: "339 / 142",
            backgroundImage: `url(${HEALTH_CAREKIT_BTN})`, backgroundSize: "100% 100%", backgroundRepeat: "no-repeat",
            backgroundColor: "transparent", appearance: "none", WebkitAppearance: "none",
            border: "none", padding: 0, cursor: "pointer", imageRendering: "pixelated",
            outline: panel === "care" ? "3px solid #FFD97A" : "none",
          }} />
          <button type="button" onClick={() => togglePanel("records")} aria-label="Records" style={{
            flex: 1, position: "relative", aspectRatio: "340 / 142",
            backgroundImage: `url(${HEALTH_RECORDS_BTN})`, backgroundSize: "100% 100%", backgroundRepeat: "no-repeat",
            backgroundColor: "transparent", appearance: "none", WebkitAppearance: "none",
            border: "none", padding: 0, cursor: "pointer", imageRendering: "pixelated",
            outline: panel === "records" ? "3px solid #FFD97A" : "none",
          }} />
        </div>
      </div>
    </div>
  );
}

/* ================= INVENTORY & LOG ================= */
function listRow(key, name, room, tag, tagColor, spr) {
  const maxDim = 28;
  const w = spr ? spr.w : 0, h = spr ? spr.h : 0;
  // PixelCanvas CSS size is (w*CELL)×(h*CELL) — fit must use screen px, not cells,
  // or content PNGs (raw pixel dims as cells) read as a 4× zoomed crop.
  const fit = w && h ? Math.min(maxDim / (w * CELL), maxDim / (h * CELL)) : 0;
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
  // Stretchy reacts to HIS OWN care chain (vet/meds/kit/carrier) + U-Box-week
  // disruption, not the whole apartment's task load. stretchyStress: 0/1/2.
  const stress = stretchyStress(tasks);
  const hearts = 3 - stress;
  const catTasks = tasks.filter((t) => isOpen(t) && t.category === "cat");
  const mood = hearts === 3 ? "loafing contentedly" : hearts === 2 ? "a little watchful" : "needs a quiet corner";
  return (
    <Screen title="Stretchy" icon="🐈" onBack={() => go("apartment")} hideChrome hideBack>
      <div style={{ height: 50, display: "grid", gridTemplateColumns: "78px 1fr", gap: 8, marginBottom: 6 }}>
        <button type="button" onClick={() => go("apartment")} style={{ border: 0, background: `url(${LEDGER_CHIP_DARK}) center/100% 100% no-repeat`, color: "#FFD97A", fontSize: 11, ...LB }}>BACK</button>
        <div style={{ display: "grid", placeItems: "center", background: `url(${DESK_PLAQUE}) center/100% 100% no-repeat`, color: "#FFD97A", textAlign: "center", fontSize: 18, ...LB }}>STRETCHY</div>
      </div>
      <div style={{ padding: "8px 14px", marginBottom: 7, background: `url(${LEDGER_CHIP_DARK}) center/100% 100% no-repeat`, color: "#C9B896", textAlign: "center", fontSize: 12, lineHeight: 1, overflow: "hidden", ...LB }}>Orange. Employed as a cat.</div>
      <div style={{ display: "flex", gap: 14, alignItems: "center", padding: 10, border: "3px solid #120A04", boxShadow: "inset 0 0 0 2px #8A5B24, 0 3px 0 #000", background: "linear-gradient(90deg, #241509, #3A2410)" }}>
        <div style={{
          width: 128, height: 128, flex: "0 0 auto", imageRendering: "pixelated",
          backgroundImage: `url(${STRETCHY_ICON})`,
          backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat",
          border: "3px solid #120A04", boxShadow: "inset 0 0 0 2px #8A5B24", backgroundColor: "#3A2410",
        }} />
        <div>
          <div style={{ color: "#FFD97A", fontSize: 16, ...LB }}>Stretchy</div>
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            {[1, 2, 3].map((i) => (
              <img key={i} src={i <= hearts ? STRETCHY_HEART_FULL : STRETCHY_HEART_EMPTY} alt="" style={{ width: 28, height: 24, objectFit: "contain", imageRendering: "pixelated" }} />
            ))}
          </div>
          <div style={{ color: "#8FD14F", fontSize: 11, marginTop: 8, ...LB }}>mood: {mood}</div>
        </div>
      </div>
      <div style={{ color: "#C9B896", fontSize: 12, marginTop: 14, ...LB }}>Coming up for him ({catTasks.length} noted):</div>
      <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
        {catTasks.length ? catTasks.map((task) => <HorizontalTaskCard key={task.id} task={task} style={{ width: "100%" }} />) : (
          <div style={{ color: "#8A7350", padding: 12, ...LB }}>Nothing pending for Stretchy.</div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "64px 1fr", alignItems: "center", gap: 8, marginTop: 12 }}>
        <img src={SHIRLEY_PORTRAIT} alt="Shirley" style={{ width: 64, height: 58, objectFit: "contain", imageRendering: "pixelated" }} />
        <button type="button" onClick={() => go("desk")} aria-label="Call Shirley" style={{ height: 58, border: 0, cursor: "pointer", background: `url(${CALL_SHIRLEY_BUTTON}) center/100% 100% no-repeat` }} />
      </div>
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
      <div style={{ position: "relative", height: 24, background: `url(${SETTINGS_SLIDER_TRACK}) center/100% 100% no-repeat` }}>
        <img src={SETTINGS_SLIDER_KNOB} alt="" style={{ position: "absolute", width: 28, height: 28, top: -2, left: `calc(${pct}% - ${pct * 0.28}px)`, imageRendering: "pixelated", pointerEvents: "none" }} />
        <input type="range" min={0} max={100} step={1} value={pct} onChange={(e) => onChange(Number(e.target.value) / 100)} aria-label={label}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", margin: 0, opacity: 0, cursor: "pointer" }} />
      </div>
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
  const [exportState, setExportState] = useState("idle");
  const [keyTest, setKeyTest] = useState(null); // null | "testing" | result string
  const testApiKey = async () => {
    // Persist first — Shirley reads localStorage, not the input's ephemeral value.
    // Then verify the *saved* key so Test and phone can't disagree.
    const saved = saveShirleySettings({
      apiKey,
      improv: !!sanitizeApiKey(apiKey),
    });
    setApiKey(saved.apiKey);
    setModel(saved.model);
    setImprov(saved.improv);
    const k = sanitizeApiKey(saved.apiKey);
    if (!k) { setKeyTest("✗ no key saved — paste, then Test again"); return; }
    if (!k.startsWith("sk-or-")) {
      setKeyTest("✗ that doesn't look like an OpenRouter key (should start with sk-or-)");
      return;
    }
    setKeyTest("testing");
    try {
      const res = await fetch("https://openrouter.ai/api/v1/key", {
        headers: { Authorization: `Bearer ${k}` },
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const label = data?.data?.label ? ` (${data.data.label})` : "";
        const fp = keyFingerprint(k);
        setKeyTest(`✓ key valid${label} · saved ${fp} on this site`);
      } else if (res.status === 401) {
        setKeyTest("✗ key rejected — create a NEW key at openrouter.ai/keys (expired/revoked also look like this), Clear key, paste, Test");
      } else if (res.status === 402) {
        setKeyTest("✗ OpenRouter needs credits — add a small balance at openrouter.ai/settings/credits");
      } else {
        setKeyTest(`✗ OpenRouter answered ${res.status}`);
      }
    } catch {
      setKeyTest("✗ network error — try again");
    }
  };
  const [importText, setImportText] = useState("");
  const [importState, setImportState] = useState("idle");
  const [importOpen, setImportOpen] = useState(false);
  const flip = (k) => setT((s) => ({ ...s, [k]: !s[k] }));

  /** Restore a save from an exported "Copy canonical mobile save" blob.
   *  Rebuilds the tasks array from activeTasks (full) + allTaskStatuses
   *  (lightweight — mergeTasks overlays these onto the code definitions at
   *  boot), backs up whatever is here now, writes the save, and reloads. */
  const restoreFromText = () => {
    try {
      const data = JSON.parse(importText.trim());
      const byId = new Map();
      for (const s of (Array.isArray(data.allTaskStatuses) ? data.allTaskStatuses : [])) {
        if (s && s.id) byId.set(s.id, { ...s });
      }
      for (const tk of (Array.isArray(data.activeTasks) ? data.activeTasks : [])) {
        if (tk && tk.id) byId.set(tk.id, tk); // full objects win over the status stubs
      }
      const tasks = Array.from(byId.values());
      if (tasks.length === 0) throw new Error("No tasks found in that text.");
      // Freeze the running app's autosave/pagehide flush FIRST, or it clobbers
      // the imported save before the reload finishes reading it.
      suspendSaves();
      const existing = localStorage.getItem("pack-it-up-save");
      if (existing) localStorage.setItem("pack-it-up-save-pre-import", existing);
      const payload = {
        v: SAVE_VERSION,
        savedAt: Date.now(),
        objState: data.objState && typeof data.objState === "object" ? data.objState : {},
        contentsState: data.contentsState && typeof data.contentsState === "object" ? data.contentsState : {},
        coins: Math.max(0, Number(data.coins) || 0),
        minutes: Math.max(0, Number(data.minutes) || 0),
        tasks,
        roomIndex: 0,
        session: data.session && typeof data.session === "object" ? data.session : undefined,
        appointments: Array.isArray(data.appointments) ? data.appointments : [],
        achievedCollections: Array.isArray(data.achievedCollections) ? data.achievedCollections : [],
      };
      localStorage.setItem("pack-it-up-save", JSON.stringify(payload));
      setImportState(`✓ Restored ${tasks.length} tasks — reloading…`);
      setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      setImportState(error?.message ? `Couldn't read that: ${error.message}` : "Couldn't read that save text.");
    }
  };
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
  const copyCanonicalSave = async () => {
    try {
      const raw = localStorage.getItem("pack-it-up-save");
      if (!raw) throw new Error("No save found on this device");
      const save = JSON.parse(raw);
      const tasks = Array.isArray(save.tasks) ? save.tasks : [];
      const payload = JSON.stringify({
        exportedAt: new Date().toISOString(),
        source: window.location.origin,
        saveVersion: save.v,
        savedAt: save.savedAt,
        activeTasks: tasks.filter((task) => task && (task.status === "pending" || task.status === "active")),
        allTaskStatuses: tasks.map((task) => ({
          id: task.id, status: task.status, title: task.title,
          due: task.due, dueDate: task.dueDate, targetDate: task.targetDate,
          latestDate: task.latestDate, category: task.category,
          urgency: task.urgency, effort: task.effort,
        })),
        appointments: save.appointments || [],
        session: save.session || null,
        objState: save.objState || {},
        contentsState: save.contentsState || {},
        achievedCollections: save.achievedCollections || [],
      }, null, 2);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        const area = document.createElement("textarea");
        area.value = payload;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.focus();
        area.select();
        const copied = document.execCommand("copy");
        area.remove();
        if (!copied) throw new Error("Copy was blocked");
      }
      setExportState("copied");
      setTimeout(() => setExportState("idle"), 3000);
    } catch (error) {
      setExportState(error?.message || "Could not copy save");
    }
  };
  return (
    <Screen title="Settings" icon="⚙️" onBack={() => go("apartment")} hideChrome>
      <div aria-hidden="true" style={{ height: 48, width: "calc(100% - 52px)", maxWidth: 390, margin: "-4px 0 6px 52px", display: "grid", placeItems: "center", background: `url(${SETTINGS_HEADER}) center/100% 100% no-repeat`, color: "#FFD97A", fontSize: 16, ...LB }}>SETTINGS</div>
      <VolSlider label="Music / ambience" value={musicVol} onChange={(v) => { setMusicVol(v); setMusicVolume(v); }} />
      <VolSlider label="Sound effects" value={sfxVol} onChange={(v) => { setSfxVolUi(v); setSfxVolume(v); }} />

      <Panel style={{ marginTop: 10 }}>
        <div style={{ color: "#FFD97A", fontSize: 12, marginBottom: 8, ...LB }}>Contacts (OpenRouter)</div>
        <div style={{ color: "#8A7350", fontSize: 10, marginBottom: 8, ...LB }}>
          Paste your OpenRouter key — improv turns on automatically. Keys are stored
          only on this site ({typeof window !== "undefined" ? window.location.host : "…"});
          localhost and Vercel do not share a key. Default model is a small Llama
          chat slug (openrouter/free was dumping thoughts into the phone). A ✓ Test
          key only proves auth. If every free call fails, enable free endpoints at
          openrouter.ai/settings/privacy (or use a paid slug).
        </div>
        <label style={{ display: "block", color: "#C9B896", fontSize: 10, marginBottom: 4, ...LB }}>API key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onBlur={(e) => {
            const v = e.target.value;
            // Only touch the key — don't rewrite model from possibly-stale state.
            persistShirley({ apiKey: v, improv: !!sanitizeApiKey(v) });
          }}
          placeholder="sk-or-…"
          autoComplete="off"
          spellCheck={false}
          style={{
            width: "100%", boxSizing: "border-box", padding: "10px", marginBottom: 8,
            background: `#1A0F06 url(${SETTINGS_INPUT}) center/100% 100% no-repeat`, color: "#F2E4C0", border: 0, fontSize: 12, ...LB,
          }}
        />
        <button
          type="button"
          onClick={testApiKey}
          disabled={keyTest === "testing"}
          style={{
            width: "100%", padding: "8px", marginBottom: keyTest ? 4 : 8,
            background: "#3A2410", color: "#FFD97A", border: "2px solid #120A04",
            fontSize: 11, cursor: "pointer", textAlign: "left", ...LB,
          }}
        >{keyTest === "testing" ? "Testing key…" : "Test key"}</button>
        {keyTest && keyTest !== "testing" && (
          <div role="status" style={{ marginBottom: 8, color: keyTest.startsWith("✓") ? "#8FD14F" : "#E8A080", fontSize: 10, ...LB }}>{keyTest}</div>
        )}
        {apiKey.trim() && !keyTest && (
          <div style={{ marginBottom: 8, color: "#8A7350", fontSize: 10, ...LB }}>
            Saved on this device: {keyFingerprint(apiKey) || "—"}
          </div>
        )}
        <label style={{ display: "block", color: "#C9B896", fontSize: 10, marginBottom: 4, ...LB }}>Model slug (free router recommended)</label>
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          onBlur={(e) => persistShirley({ model: e.target.value })}
          placeholder={DEFAULT_MODEL}
          style={{
            width: "100%", boxSizing: "border-box", padding: "10px", marginBottom: 8,
            background: `#1A0F06 url(${SETTINGS_INPUT}) center/100% 100% no-repeat`, color: "#F2E4C0", border: 0, fontSize: 11, ...LB,
          }}
        />
        <button
          type="button"
          onClick={() => persistShirley({ apiKey, model, improv: sanitizeApiKey(apiKey) ? (improv || true) : false })}
          aria-label="Save Contacts Settings"
          style={{ width: "100%", height: 54, marginBottom: 8, border: 0, cursor: "pointer", background: `url(${SETTINGS_SAVE}) center/100% 100% no-repeat` }}
        />
        <button
          type="button"
          onClick={() => {
            if (!window.confirm("Remove the saved OpenRouter key from this device?")) return;
            persistShirley({ apiKey: "", clearApiKey: true, improv: false });
          }}
          aria-label="Clear API Key"
          style={{ width: "100%", height: 50, marginBottom: 10, border: 0, cursor: "pointer", background: `url(${SETTINGS_CLEAR}) center/100% 100% no-repeat` }}
        />
        <div style={{ display: "flex", gap: 6, alignItems: "center", color: improv && apiKey.trim() ? "#8FD14F" : "#C9942E", fontSize: 10, marginBottom: 8, ...LB }}>
          {apiKey.trim() && <img src={SETTINGS_CHECK} alt="" style={{ width: 26, height: 26, objectFit: "contain" }} />}
          <span>
          {apiKey.trim()
            ? (improv
              ? "Status: improv on (OpenRouter key saved) — phone shows live vs script per reply"
              : "Status: key saved, improv off")
            : "Status: offline script bank"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#F2E4C0", fontSize: 12, ...LB }}>Improv dialogue</span>
          <div style={{ position: "relative", width: 52, height: 26 }}>
            <div style={{ width: 56, height: 28, background: `url(${improv && apiKey.trim() ? SETTINGS_TOGGLE_ON : SETTINGS_TOGGLE_OFF}) center/100% 100% no-repeat`, pointerEvents: "none" }} />
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
            <div style={{ width: 56, height: 28, background: `url(${t[k] ? SETTINGS_TOGGLE_ON : SETTINGS_TOGGLE_OFF}) center/100% 100% no-repeat`, pointerEvents: "none" }} />
            <input type="checkbox" checked={t[k]} onChange={() => flip(k)} aria-label={label}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", margin: 0, padding: 0, opacity: 0, cursor: "pointer" }} />
          </div>
        </div>
      ))}
      <button type="button" onClick={copyCanonicalSave} style={{
        width: "100%", marginTop: 8, padding: "12px", background: "#3A2410", color: "#FFD97A",
        border: "3px solid #120A04", fontSize: 12, textAlign: "left", cursor: "pointer", ...LB,
      }}>
        {exportState === "copied" ? "✓ Canonical mobile save copied" : "Copy canonical mobile save"}
      </button>
      {exportState !== "idle" && exportState !== "copied" && (
        <div role="alert" style={{ marginTop: 4, color: "#E8A080", fontSize: 10, ...LB }}>{exportState}</div>
      )}
      <button type="button" onClick={() => { setImportOpen((v) => !v); setImportState("idle"); }} style={{
        width: "100%", marginTop: 8, padding: "12px", background: "#3A2410", color: "#FFD97A",
        border: "3px solid #120A04", fontSize: 12, textAlign: "left", cursor: "pointer", ...LB,
      }}>{importOpen ? "Close import" : "Import / restore save…"}</button>
      {importOpen && (
        <div style={{ marginTop: 8, padding: 12, ...FR }}>
          <div style={{ color: "#C9B896", fontSize: 10, marginBottom: 8, lineHeight: 1.5, ...LB }}>
            Paste a save you copied with “Copy canonical mobile save” (from any device), then Restore.
            This replaces what’s on this device — the current save is backed up first.
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste your save JSON here…"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            style={{
              width: "100%", boxSizing: "border-box", minHeight: 120, padding: 10, marginBottom: 8,
              background: "#1A0F06", color: "#F2E4C0", border: "2px solid #120A04", fontSize: 11,
              fontFamily: "'Courier New', monospace", resize: "vertical",
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (!window.confirm("Restore this save? It replaces the tasks and progress on this device (a backup is kept).")) return;
              restoreFromText();
            }}
            disabled={!importText.trim()}
            style={{
              width: "100%", padding: "12px", border: "3px solid #120A04", fontSize: 12, ...LB,
              background: importText.trim() ? "#44695B" : "#241509",
              color: importText.trim() ? "#F2E4C0" : "#6B563B",
              cursor: importText.trim() ? "pointer" : "default",
            }}
          >Restore save</button>
          {importState !== "idle" && (
            <div role="status" style={{ marginTop: 6, color: importState.startsWith("✓") ? "#8FD14F" : "#E8A080", fontSize: 10, ...LB }}>{importState}</div>
          )}
        </div>
      )}
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
      <div style={{ marginTop: 8, color: "#5A4832", fontSize: 9, textAlign: "center", ...LB }}>
        build {typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "dev"}
      </div>
    </Screen>
  );
}

/* ================= KITCHEN WALL CALENDAR ================= */
const CAL_LANE_ICON = {
  move: CAL_ICON_MOVE, housing: CAL_ICON_HOUSING, job: CAL_ICON_JOB,
  admin: CAL_ICON_ADMIN, health: CAL_ICON_HEALTH, cat: CAL_ICON_CAT,
};
const CAL_LANE_LABEL = {
  move: "Move", housing: "Housing", job: "Job",
  admin: "Admin", health: "Health", cat: "Stretchy",
};
// Legend reads in the mockup's order, not lane-priority order.
const CAL_LEGEND_ORDER = ["move", "job", "admin", "health", "cat", "housing"];
// Milestone glyphs, keyed to movePhase.MILESTONES.key.
const CAL_MILESTONE_ICON = {
  dentist: MS_DENTIST, vision: MS_VISION, derm: MS_DERM, obgyn: MS_OBGYN,
  vet: MS_VET, ubox: MS_UBOX, walkthrough: MS_WALKTHROUGH, flight: MS_FLIGHT,
  lock: MS_LOCK, laptop: MS_LAPTOP, wifi: MS_WIFI, suitcase: MS_SUITCASE,
};
// Prominent header flap (roughly the weight of the grid below it); the Critical
// Path flap stays thin, hugging its single compact row.
const CAL_HEADER_H = "24vh";

/**
 * Read-only kitchen wall calendar. Every inked day comes from buildJulyCalendar
 * (live task due dates + the move spine), so it can never drift from the ledger;
 * the mockup only governs layout. Paper page, grid, legend and text are
 * code-drawn — the PNGs are just the Cat-of-the-Month header, lane icons, the
 * today ring, and the past-day ink X.
 */
function CalendarScreen({ go, tasks }) {
  const cal = buildJulyCalendar({ tasks: tasks || [], today: new Date() });
  const PAPER = "#F1E4C4", INK = "#3A2A18", FAINT = "#B7A67F", LINE = "#CBB98E";
  const icon = (src, size) => (
    <img src={src} alt="" style={{ width: size, height: size, objectFit: "contain", imageRendering: "pixelated" }} />
  );
  const card = { background: PAPER, borderRadius: 10, border: `3px solid ${INK}` };
  const perforation = { flexShrink: 0, height: 0, borderTop: `3px dashed ${INK}`, margin: "0 10px" };
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 250, background: "#1A1008", boxSizing: "border-box",
      display: "flex", flexDirection: "column", animation: "screenIn 200ms ease-out",
      padding: "calc(env(safe-area-inset-top,0px) + 6px) 8px calc(env(safe-area-inset-bottom,0px) + 8px)",
    }}>
      <style>{"@keyframes screenIn{from{opacity:0;transform:translateY(14px)}}"}</style>
      <div style={{ flexShrink: 0, width: "100%", maxWidth: 430, margin: "0 auto 6px" }}>
        <button type="button" onClick={() => go("apartment")} style={{
          width: 74, height: 28, border: 0, cursor: "pointer", color: "#FFD97A", fontSize: 11, ...LB,
          background: `url(${LEDGER_CHIP_DARK}) center/100% 100% no-repeat`,
        }}>BACK</button>
      </div>
      {/* One connected calendar: header flap · body · critical-path flap, joined
          by perforations inside a single paper card. Natural height, centered in
          the viewport so the whole thing is visible without scrolling. */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", maxWidth: 430, margin: "0 auto" }}>
      <div style={{
        ...card, flex: "0 1 auto", maxHeight: "100%",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* header flap — prominent */}
        <div style={{ flex: "0 0 auto", height: CAL_HEADER_H, display: "flex", justifyContent: "center", alignItems: "center", padding: "8px 12px 4px" }}>
          <img src={CAL_HEADER} alt="Cat of the Month: Stretchy" style={{
            maxHeight: "100%", maxWidth: "80%", objectFit: "contain", imageRendering: "pixelated", display: "block",
          }} />
        </div>
        <div style={perforation} />
        {/* body (natural height; square grid) */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", padding: "6px 10px 4px" }}>
          <div style={{ position: "relative", marginBottom: 4, flexShrink: 0 }}>
            <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", color: "#7A6446", fontSize: 9, ...LB }}>PHASE: {cal.phaseLabel.toUpperCase()}</span>
            <div style={{ textAlign: "center", color: INK, fontSize: 18, ...LB, letterSpacing: 3 }}>— {cal.title} —</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 3, flexShrink: 0 }}>
            {cal.weekdays.map((wd) => (
              <div key={wd} style={{ textAlign: "center", color: "#7A6446", fontSize: 9, ...LB }}>{wd}</div>
            ))}
          </div>
          <div style={{ display: "grid", gap: 3, gridTemplateColumns: "repeat(7,1fr)" }}>
            {cal.weeks.flat().map((cell, ci) => (
              <div key={ci} style={{
                position: "relative", aspectRatio: "1 / 1", borderRadius: 4, overflow: "hidden",
                border: `1.5px solid ${cell.inMonth ? LINE : "transparent"}`,
                background: cell.inMonth ? "rgba(255,255,255,0.22)" : "transparent",
              }}>
                <span style={{
                  position: "absolute", top: 1, left: 3, fontSize: 9, ...LB, zIndex: 3,
                  color: !cell.inMonth ? LINE : cell.isPast ? FAINT : INK,
                }}>{cell.day}</span>
                {/* milestone glyphs — bigger than the routine lane icons */}
                {cell.inMonth && cell.milestones.length > 0 && (
                  <div style={{
                    position: "absolute", left: 0, right: 0, top: 1,
                    bottom: cell.lanes.length > 0 ? 12 : 1,
                    display: "flex", flexWrap: "wrap", alignContent: "center", justifyContent: "center",
                    gap: 1, opacity: cell.isPast ? 0.5 : 1, zIndex: 2,
                  }}>
                    {cell.milestones.map((k) => {
                      const s = cell.milestones.length >= 3 ? 9 : cell.milestones.length === 2 ? 11 : 15;
                      return (
                        <img key={k} src={CAL_MILESTONE_ICON[k]} alt="" style={{
                          width: s, height: s, objectFit: "contain", imageRendering: "pixelated",
                        }} />
                      );
                    })}
                  </div>
                )}
                {/* routine lane icons — small; drop to a bottom strip when a milestone leads */}
                {cell.inMonth && cell.lanes.length > 0 && (
                  <div style={{
                    position: "absolute", left: 1, right: 1,
                    ...(cell.milestones.length > 0 ? { bottom: 1, height: 10 } : { top: 11, bottom: 1 }),
                    display: "flex", flexWrap: "wrap", alignContent: "center", justifyContent: "center",
                    gap: 1, opacity: cell.isPast ? 0.4 : 1,
                  }}>
                    {cell.lanes.map((lane) => {
                      const s = cell.milestones.length > 0 ? 9 : 12;
                      return (
                        <img key={lane} src={CAL_LANE_ICON[lane]} alt="" style={{
                          width: s, height: s, objectFit: "contain", imageRendering: "pixelated",
                        }} />
                      );
                    })}
                  </div>
                )}
                {/* every elapsed day is crossed off, over any icons it carries */}
                {cell.inMonth && cell.isPast && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, opacity: 0.85 }}>
                    {icon(CAL_INK_X, "60%")}
                  </div>
                )}
                {cell.isToday && (
                  <img src={CAL_TODAY_RING} alt="today" style={{
                    position: "absolute", inset: "4%", width: "92%", height: "92%",
                    imageRendering: "pixelated", pointerEvents: "none", zIndex: 2,
                  }} />
                )}
              </div>
            ))}
          </div>
          <div style={{
            flexShrink: 0, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "3px 12px",
            marginTop: 7, paddingTop: 6, borderTop: `2px dotted ${LINE}`,
          }}>
            {CAL_LEGEND_ORDER.map((lane) => (
              <div key={lane} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {icon(CAL_LANE_ICON[lane], 14)}
                <span style={{ color: "#6B563B", fontSize: 9, ...LB }}>{CAL_LANE_LABEL[lane].toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={perforation} />
        {/* critical-path flap — every milestone in thin two-per-row lines */}
        <div style={{ flex: "0 0 auto", padding: "5px 10px 7px", background: "rgba(0,0,0,0.05)" }}>
          <div style={{ textAlign: "center", color: INK, fontSize: 9, ...LB, letterSpacing: 2, marginBottom: 4 }}>— CRITICAL PATH —</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 10px" }}>
            {cal.milestones.map((m) => (
              <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                <img src={CAL_MILESTONE_ICON[m.key]} alt="" style={{ width: 15, height: 15, objectFit: "contain", imageRendering: "pixelated", flexShrink: 0 }} />
                <span style={{ flexShrink: 0, color: "#8A7250", fontSize: 7.5, ...LB }}>JUL {m.day}</span>
                <span style={{ minWidth: 0, color: INK, fontSize: 7.5, ...LB, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

/* ================= ROUTER ================= */
export default function ScreenLayer({
  screen, go, tasks, setTasks, handled, openHandledSheet, busy, playSfx,
  session, onSessionBump, rewardToast,
  appointments, setAppointments, objState, contentsState, incomingCall, clearIncomingCall,
  taskFocus,
}) {
  const world = { objState: objState || {}, contentsState: contentsState || {} };
  if (screen === "apartment") return null;
  if (screen === "menu")      return <MenuScreen go={go} tasks={tasks} />;
  if (screen === "board")     return (
    <BoardScreen go={go} tasks={tasks} setTasks={setTasks}
      session={session} onSessionBump={onSessionBump} rewardToast={rewardToast} world={world} />
  );
  if (screen === "ledger")    return (
    <LedgerScreen go={go} tasks={tasks} setTasks={setTasks} session={session} onSessionBump={onSessionBump} world={world} />
  );
  if (screen === "desk")      return (
    <DeskScreen go={go} tasks={tasks} setTasks={setTasks} playSfx={playSfx}
      session={session} onSessionBump={onSessionBump} rewardToast={rewardToast}
      appointments={appointments || []} setAppointments={setAppointments}
      objState={objState} incomingCall={incomingCall} clearIncomingCall={clearIncomingCall} world={world} />
  );
  if (screen === "health")    return (
    <HealthScreen go={go} tasks={tasks} setTasks={setTasks}
      session={session} onSessionBump={onSessionBump} rewardToast={rewardToast}
      appointments={appointments || []} setAppointments={setAppointments} taskFocus={taskFocus} />
  );
  if (screen === "inventory") return <InventoryScreen go={go} handled={handled} openHandledSheet={openHandledSheet} />;
  if (screen === "log")       return <LogScreen go={go} handled={handled} />;
  if (screen === "stretchy")  return <StretchyScreen go={go} tasks={tasks} />;
  if (screen === "calendar")  return <CalendarScreen go={go} tasks={tasks} />;
  if (screen === "settings")  return <SettingsScreen go={go} />;
  return null;
}
