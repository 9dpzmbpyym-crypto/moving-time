/* Real move task data. `due` is display copy; `dueDate` / `dueEnd` drive
   calendar and pressure behavior. Effort: 1 tiny, 2 medium, 3 heavy. */
import { currentPhase, isDueSoon, isOverdue, dateKey, taskDueDelta } from "./movePhase.js";
import { ENERGY_BUDGET } from "./session.js";

export const SUBLET_OUTREACH_ID = "h_outreach_daily";

/** Dropped from the live list — prune on save merge so old localStorage can't revive them. */
export const REMOVED_TASK_IDS = new Set([
  "a_pharmacy", "a_records", "c_records", "t_stomach", "t_nerves", "t_vet",
]);

export const TASK_CATEGORIES = {
  move:    { label: "Move",       icon: "📦", color: "#C9942E" },
  housing: { label: "Housing",    icon: "🏠", color: "#D6A66A" },
  job:     { label: "Job Apps",   icon: "💼", color: "#E4B4A8" },
  admin:   { label: "Admin",      icon: "🗂️", color: "#B9CEDC" },
  health:  { label: "Health",     icon: "🩺", color: "#8FD14F" },
  cat:     { label: "Stretchy",   icon: "🐈", color: "#E8944A" },
};

const base = (task) => ({
  urgency: 1,
  effort: 1,
  due: "",
  dueDate: null,
  dueEnd: null,
  criticalPath: false,
  status: "pending",
  room: null,
  objectId: null,
  relief: task.category === "health" || task.category === "cat" ? "slide" : "stamp",
  jobId: null,
  zone: null,
  needsInfo: false,
  score: null,
  selfTarget: false,
  ...task,
});

/**
 * Active job tracker only (Saved + Applied-watch still in play).
 * Excludes ghosted, withdrawn, closed postings (e.g. DYCD), and loss-cause.
 * selfTarget = fake/self-imposed due — never counts as overdue pressure.
 * Source: docs/move-spine/master/MASTER_REAL_WORLD_GOALS_JULY_2026.md
 */
const JOB_TRACKER = [
  { id: "job_hpd", taskId: "j_hpd", title: "Project Manager — Tenant & Owner Resources", org: "HPD", score: 75, due: "Jul 19", dueDate: "2026-07-19", salary: "$62,868–$72,298", tracker: "applied", prefix: "Follow up:", notes: "Applied Jul 2 — watch.", next: "Monitor", effort: 1, urgency: 2 },
  { id: "job_hunter", taskId: "j_hunter", title: "Administrative Coordinator — Business Office", org: "Hunter College (CUNY)", score: 73, due: "Jul 14", dueDate: "2026-07-14", salary: "$84,815–$94,409", tracker: "saved", prefix: "Apply:", notes: "P0 CUNY/back-end admin; open until filled.", next: "Tailor and submit", effort: 3, urgency: 3, selfTarget: true },
  { id: "job_acm", taskId: "j_acm", title: "Assistant Coordinating Manager — Managed Care Finance", org: "H+H — Elmhurst", score: 73, due: "Jul 5", dueDate: "2026-07-05", salary: "$55,105–$63,371", tracker: "saved", prefix: "Verify open:", notes: "Self-imposed target; check portal.", next: "Verify still open", effort: 1, urgency: 2, selfTarget: true },
  { id: "job_hopwa1", taskId: "j_hopwa1", title: "HOPWA Program Analyst — seat 1", org: "DOHMH — BHHS", score: 71, due: "Jul 18", dueDate: "2026-07-18", salary: "$62,868–$72,298", tracker: "saved", prefix: "Apply:", notes: "P0 housing + public health.", next: "Tailor and submit", effort: 3, urgency: 2 },
  { id: "job_hopwa2", taskId: "j_hopwa2", title: "HOPWA Program Analyst — seat 2", org: "DOHMH — BHHS", score: 71, due: "Jul 18", dueDate: "2026-07-18", salary: "$62,868–$72,298", tracker: "saved", prefix: "Apply:", notes: "Reuse seat-1 materials.", next: "Submit", effort: 3, urgency: 2 },
  { id: "job_cphds", taskId: "j_cphds", title: "Contract Manager — Population Health Data Science", org: "DOHMH — CPHDS", score: 68, due: "Jul 11", dueDate: "2026-07-11", salary: "$68,214–$110,000", tracker: "saved", prefix: "Apply:", notes: "Closes Jul 11 — only if still open/fast.", next: "Check portal", effort: 2, urgency: 3 },
  { id: "job_mopt", taskId: "j_mopt", title: "Public Housing Outreach & Advocacy Coordinator", org: "MOPT", score: 68, due: "Jul 28", dueDate: "2026-07-28", salary: "$100,000–$105,000", tracker: "saved", prefix: "Apply:", notes: "After CUNY/DOHMH batch; watch outreach-heavy duties.", next: "Review and submit", effort: 3, urgency: 2 },
  { id: "job_enroll", taskId: "j_enroll", title: "Enrollment Registrar Specialist", org: "Hunter — School of Social Work", score: 67, due: "Jul 7", dueDate: "2026-07-07", salary: "$82,663–$94,909", tracker: "saved", prefix: "Verify open:", notes: "Self-imposed target; open until filled.", next: "Verify still open", effort: 1, urgency: 2, selfTarget: true },
  { id: "job_hpd_hqe", taskId: "j_hpd_hqe", title: "Housing Quality Enforcement Specialist", org: "HPD — Budget & Program Ops", score: 63, due: "Jul 25", dueDate: "2026-07-25", salary: "$44,545–$51,227", tracker: "saved", prefix: "Apply:", notes: "P2 — salary low; possible inspection flavor.", next: "Decide fit", effort: 2, urgency: 1 },
  { id: "job_exec", taskId: "j_exec", title: "Confidential Executive Associate", org: "CUNY — University HR", score: 62, due: "Jul 3", dueDate: "2026-07-03", salary: "$98,995–$109,898", tracker: "saved", prefix: "Verify open:", notes: "Self-imposed target; steep experience bar.", next: "Verify still open", effort: 1, urgency: 1, selfTarget: true },
  { id: "job_onboard", taskId: "j_onboard", title: "Onboarding Specialist", org: "H+H — Harlem Hospital", score: 62, due: "Jul 10", dueDate: "2026-07-10", salary: "$60,000–$65,000", tracker: "saved", prefix: "Apply:", notes: "Self-imposed Jul 10 target; H+H HR/back-end.", next: "Quick apply if open", effort: 2, urgency: 2, selfTarget: true },
  { id: "job_student", taskId: "j_student", title: "Administrative Coordinator — Student Services, Social Work", org: "Hunter — School of Social Work", score: 61, due: "Jul 8", dueDate: "2026-07-08", salary: "$63,003–$72,236", tracker: "saved", prefix: "Verify open:", notes: "Self-imposed target; student-facing concern.", next: "Verify still open", effort: 1, urgency: 1, selfTarget: true },
  { id: "job_labor", taskId: "j_labor", title: "Labor Relations Associate", org: "H+H Central Office", score: 60, due: "Aug 30", dueDate: "2026-08-30", salary: "$68,000", tracker: "saved", prefix: "Apply:", notes: "Backburner until after move triage.", next: "Revisit in August", effort: 2, urgency: 1 },
  { id: "job_mocs", taskId: "j_mocs", title: "Project Manager", org: "MOCS", score: 58, due: "Jul 26", dueDate: "2026-07-26", salary: "$70,000–$80,000", tracker: "saved", prefix: "Apply:", notes: "P1/P2 contracts/admin.", next: "Review and submit", effort: 3, urgency: 2 },
  { id: "job_equity", taskId: "j_equity", title: "Housing Equity Associate", org: "NYC Public Advocate", score: 56, due: "Jul 15", dueDate: "2026-07-15", salary: "$63,916", tracker: "saved", prefix: "Apply:", notes: "P2 — mission fit; may be advocacy-facing.", next: "Decide fit", effort: 2, urgency: 2 },
];

export const SAMPLE_JOBS = Object.fromEntries(JOB_TRACKER.map((j) => [j.id, {
  title: j.title,
  org: j.org,
  location: "New York, NY",
  salary: j.salary,
  deadline: j.due,
  status: j.tracker,
  priority: j.score,
  url: "#",
  notes: j.notes,
  nextAction: j.next,
  selfTarget: !!j.selfTarget,
}]));

const JOB_TRACKER_TASKS = JOB_TRACKER.map((j) => base({
  id: j.taskId,
  title: `${j.prefix} ${j.title}`,
  category: "job",
  effort: j.effort,
  urgency: j.urgency,
  due: j.selfTarget ? `Self-target ${j.due}` : j.due,
  dueDate: j.dueDate,
  jobId: j.id,
  score: j.score,
  selfTarget: !!j.selfTarget,
  relief: "stamp",
}));

export const INITIAL_TASKS = [
  // Packing / U-Box
  base({ id: "m_lock", title: "Buy U-Box lock (verify hasp fit)", category: "move", effort: 1, urgency: 2, due: "Jul 26", dueDate: "2026-07-26" }),
  base({ id: "m_labels", title: "Label boxes: U-BOX / PLANE / SUBLET / DO NOT PACK / SELL / TRASH", category: "move", effort: 1, due: "Jul 26", dueDate: "2026-07-26" }),
  base({ id: "m_photos_val", title: "Photograph valuables before packing", category: "move", effort: 1, due: "Jul 26", dueDate: "2026-07-26" }),
  base({ id: "m_stage", title: "Stage heavy boxes near loading path", category: "move", effort: 2, urgency: 2, due: "Jul 26", dueDate: "2026-07-26" }),
  base({ id: "m_fragile", title: "Wrap framed art + fragiles", category: "move", effort: 2, urgency: 2, due: "Jul 26", dueDate: "2026-07-26" }),
  base({ id: "m_furn_decide", title: "Decide which furniture rides the U-Box", category: "move", effort: 2, urgency: 2, due: "Jul 26", dueDate: "2026-07-26" }),
  // Mid-month room packing (apartment Pack verb is still the real work — these are planning cards)
  base({ id: "m_pack_overflow", title: "Pack bedroom + closet overflow", category: "move", effort: 2, urgency: 2, due: "Jul 16–24", dueDate: "2026-07-16", dueEnd: "2026-07-24" }),
  base({ id: "m_pack_bath", title: "Pack bathroom backup + vanity extras", category: "move", effort: 2, due: "Jul 16–24", dueDate: "2026-07-16", dueEnd: "2026-07-24" }),
  base({ id: "m_pack_office", title: "Pack office supplies and papers", category: "move", effort: 2, due: "Jul 16–24", dueDate: "2026-07-16", dueEnd: "2026-07-24" }),
  base({ id: "m_pack_kitchen", title: "Pack nonessential kitchen", category: "move", effort: 2, due: "Jul 16–24", dueDate: "2026-07-16", dueEnd: "2026-07-24" }),
  base({ id: "m_pack_living", title: "Pack living decor/electronics + dining/bar", category: "move", effort: 2, due: "Jul 16–24", dueDate: "2026-07-16", dueEnd: "2026-07-24" }),
  base({ id: "m_load1", title: "U-Box day: load heavy / boring / low-theft first", category: "move", effort: 3, urgency: 3, due: "Jul 27", dueDate: "2026-07-27", criticalPath: true }),
  base({ id: "m_load_main", title: "Main loading days", category: "move", effort: 3, urgency: 3, due: "Jul 28–29", dueDate: "2026-07-28", dueEnd: "2026-07-29", criticalPath: true }),
  base({ id: "m_sell_final", title: "Final sell / free / donate calls", category: "move", effort: 2, urgency: 2, due: "Jul 29", dueDate: "2026-07-29" }),
  base({ id: "m_photo_lock", title: "Photograph packed interior + lock placement", category: "move", effort: 1, urgency: 2, due: "Jul 30", dueDate: "2026-07-30" }),
  base({ id: "m_lock_final", title: "Lock the U-Box — packed by tonight", category: "move", effort: 1, urgency: 3, due: "Jul 30", dueDate: "2026-07-30", criticalPath: true }),
  base({ id: "m_sweep", title: "Final sweep — flight day, no packing", category: "move", effort: 2, urgency: 3, due: "Jul 31", dueDate: "2026-07-31", criticalPath: true }),

  // Housing. Session meter = Messages 10 / Backups 5 ticks; daily card = today's outreach batch.
  base({ id: "h_lock", title: "Lock the Aug 1 sublet", category: "housing", effort: 3, urgency: 3, due: "Jul 15", dueDate: "2026-07-15", criticalPath: true }),
  base({
    id: SUBLET_OUTREACH_ID,
    title: "Send 5–10 sublet inquiries",
    category: "housing",
    effort: 2,
    urgency: 3,
    due: "Today",
    dueDate: null,
    criticalPath: true,
    kind: "daily",
  }),
  base({ id: "h_followups", title: "Follow up warm replies (24–48h)", category: "housing", effort: 1, urgency: 2, due: "Daily" }),
  base({ id: "h_widen", title: "If not locked: widen to furnished room / month-to-month / friends", category: "housing", effort: 2, urgency: 2, due: "Jul 15+", dueDate: "2026-07-15" }),
  base({ id: "h_comfort_box", title: "Sublet comfort box — ship once address is confirmed", category: "housing", effort: 1, due: "After address", status: "dismissed" }),

  // Active job tracker only (score + dueDate) — no ghosted/withdrawn/closed/loss-cause
  ...JOB_TRACKER_TASKS,

  // Admin cutoff cards
  base({ id: "a_wifi", title: "Wi-Fi return: kit, serial photos, cancel, method, receipt", category: "admin", effort: 2, urgency: 2, due: "Before Jul 30", dueDate: "2026-07-30", criticalPath: true, relief: "file" }),
  base({ id: "a_utils", title: "Utilities cancel / transfer (electric + gas)", category: "admin", effort: 1, due: "Before move", dueDate: "2026-07-30", relief: "file" }),
  base({ id: "a_insurance", title: "Renter's insurance transfer / cancel", category: "admin", effort: 1, due: "Before move", dueDate: "2026-07-30", relief: "file" }),
  base({ id: "a_usps", title: "USPS forwarding once address exists", category: "admin", effort: 1, due: "After address", relief: "file" }),
  base({ id: "a_bank", title: "Bank + credit-card address updates", category: "admin", effort: 1, due: "Before move", dueDate: "2026-07-30", relief: "file" }),
  base({ id: "a_cuny", title: "CUNY account + student-loan address", category: "admin", effort: 1, due: "Before move", dueDate: "2026-07-30", relief: "file" }),
  base({ id: "a_payout", title: "Final paycheck: PTO payout + insurance end / COBRA", category: "admin", effort: 1, due: "Move day", dueDate: "2026-07-31", relief: "file" }),
  base({ id: "a_voter", title: "Voter registration (NYC)", category: "admin", effort: 1, urgency: 1, due: "Post-move", dueDate: "2026-08-01", status: "dismissed", relief: "file" }),

  // Existing Body Board tasks plus real additions — "Book" cards; Attend spawns when Shirley confirms
  base({ id: "t_brain", title: "Book: Psychiatry / med renewals", category: "health", effort: 2, urgency: 2, due: "Book by Jul 28", dueDate: "2026-07-28", zone: "brain", kind: "book" }),
  base({ id: "t_teeth", title: "Book: Dentist visit", category: "health", effort: 2, urgency: 1, due: "Opportunistic", status: "dismissed", zone: "teeth", kind: "book" }),
  base({ id: "t_heart", title: "Book: Cardiology appointment", category: "health", effort: 2, urgency: 1, due: "After move", status: "dismissed", zone: "heart", kind: "book" }),
  base({ id: "t_lymph", title: "Book: Rheumatology + deferred labs", category: "health", effort: 3, urgency: 2, due: "Book by Jul 28", dueDate: "2026-07-28", zone: "lymph", kind: "book" }),
  base({ id: "t_skin", title: "Book: Dermatology appointment", category: "health", effort: 2, urgency: 1, due: "After move", status: "dismissed", zone: "skin", kind: "book" }),
  base({ id: "t_obgyn", title: "Book: OB/GYN — IUD replacement", category: "health", effort: 3, urgency: 3, due: "Book by Jul 20", dueDate: "2026-07-20", zone: "obgyn", kind: "book" }),
  base({ id: "t_pcp", title: "Book: PCP — 90-day medication bridge", category: "health", effort: 2, urgency: 2, due: "Book by Jul 28", dueDate: "2026-07-28", zone: "brain", kind: "book" }),

  // Stretchy travel-prep chain (one Book card — Shirley can book it; Attend stays cat-lane)
  base({ id: "c_vet_book", title: "Book: Stretchy's travel vet (meds + certificate)", category: "cat", effort: 2, urgency: 3, due: "Book by Jul 21", dueDate: "2026-07-21", dueEnd: "2026-07-25", criticalPath: true, kind: "book" }),
  base({ id: "c_vet_attend", title: "Attend Stretchy's travel vet visit", category: "cat", effort: 2, urgency: 3, due: "Jul 22–25", dueDate: "2026-07-22", dueEnd: "2026-07-25", criticalPath: true }),
  base({ id: "c_cert", title: "Get Stretchy's travel certificate", category: "cat", effort: 1, urgency: 2, due: "After vet", dueDate: "2026-07-25", criticalPath: true }),
  base({ id: "c_meds_run", title: "Pick up Stretchy's travel medications", category: "cat", effort: 1, urgency: 2, due: "By Jul 30", dueDate: "2026-07-30", criticalPath: true }),
  base({ id: "c_carrier", title: "Leave carrier out for daily practice", category: "cat", effort: 1, due: "Daily" }),
  base({ id: "c_kit", title: "Pack Stretchy's plane-day kit", category: "cat", effort: 1, urgency: 3, due: "Jul 30", dueDate: "2026-07-30", criticalPath: true }),
];

export const isOpen = (task) => task.status === "pending" || task.status === "active";

/** Hard posting deadlines only — self-imposed job targets never count as overdue. */
export function isHardOverdue(task, date = new Date()) {
  if (!task || task.selfTarget) return false;
  return isOverdue(task, date);
}

/**
 * Daily sublet outreach card: regenerates each local day until h_lock is done.
 * Completing it today keeps it done until midnight; next open reopens a fresh card.
 */
export function refreshDailyHousingTasks(tasks, date = new Date()) {
  const list = Array.isArray(tasks) ? tasks : [];
  const locked = list.some((t) => t.id === "h_lock" && t.status === "done");
  const today = dateKey(date);
  if (!today) return list;

  if (locked) {
    return list.map((t) => (
      t.id === SUBLET_OUTREACH_ID && t.status !== "dismissed"
        ? { ...t, status: "dismissed", due: "Locked", dueDate: today }
        : t
    ));
  }

  const prev = list.find((t) => t.id === SUBLET_OUTREACH_ID);
  // Finished today's batch — leave the checkmark until the day rolls.
  if (prev && prev.status === "done" && prev.dueDate === today) return list;

  const fresh = {
    id: SUBLET_OUTREACH_ID,
    title: "Send 5–10 sublet inquiries",
    category: "housing",
    effort: 2,
    urgency: 3,
    due: "Today",
    dueDate: today,
    dueEnd: null,
    criticalPath: true,
    status: "pending",
    room: null,
    objectId: null,
    relief: "stamp",
    jobId: null,
    zone: null,
    needsInfo: false,
    kind: "daily",
  };

  if (prev) {
    return list.map((t) => (t.id === SUBLET_OUTREACH_ID ? { ...fresh } : t));
  }
  return [...list, fresh];
}

/** Pressure is deadline loudness, never backlog volume. Self-targets don't overdue. */
export function taskPressure(tasks, date = new Date()) {
  const weight = tasks.filter(isOpen).reduce((sum, task) => {
    if (!isHardOverdue(task, date) && !isDueSoon(task, date, 2)) return sum;
    if (task.selfTarget) return sum + 0.5; // mild due-soon nudge only
    return sum + (task.criticalPath ? 2 : 1);
  }, 0);
  if (weight === 0) return 0;
  if (weight <= 2) return 1;
  if (weight <= 4) return 2;
  return 3;
}

/** Stretchy reacts only to his own due chain plus mild U-Box disruption. */
export function stretchyStress(tasks, date = new Date()) {
  const openCat = tasks.filter((task) => isOpen(task) && task.category === "cat");
  if (openCat.some((task) => isHardOverdue(task, date) || isDueSoon(task, date, 2))) return 2;
  const phase = currentPhase(date).id;
  if (openCat.length && ["ubox-week", "load-days", "lock-night"].includes(phase)) return 1;
  return 0;
}

export const PRESSURE_LABELS = ["All clear", "Manageable", "Piling up", "Getting loud"];
export const PRESSURE_COLORS = ["#5D7C3B", "#C9942E", "#C9942E", "#C43B34"];

const LANE_GROUPS = [
  { id: "pack", cats: ["move"] },
  { id: "desk", cats: ["housing", "job", "admin"] },
  { id: "care", cats: ["health", "cat"] },
];

/** Critical-path weight scales with how soon the date is — far-future criticals stay quiet. */
function boardScore(task, date) {
  let s = (task.urgency || 1) * 5;
  const delta = taskDueDelta(task, date);
  if (task.criticalPath) {
    if (delta == null) s += 15;
    else if (delta < 0) s += 100;
    else if (delta <= 2) s += 90;
    else if (delta <= 7) s += 45;
    else if (delta <= 14) s += 20;
    else s += 4;
  }
  if (isHardOverdue(task, date)) s += 80;
  else if (isDueSoon(task, date, 2)) s += task.selfTarget ? 12 : 40;
  return s;
}

/** ≤3 Command Board picks: one per lane cluster, critical/due-soon first, within energy budget. */
export function pickBoardTasks(tasks, energy = "steady", date = new Date()) {
  const budget = ENERGY_BUDGET[energy] || ENERGY_BUDGET.steady;
  const open = tasks.filter(isOpen);
  const picked = [];
  let used = 0;
  for (const lane of LANE_GROUPS) {
    const candidates = open
      .filter((t) => lane.cats.includes(t.category) && !picked.some((p) => p.id === t.id))
      .sort((a, b) => boardScore(b, date) - boardScore(a, date));
    const fit = candidates.filter((t) => {
      const e = t.effort || 1;
      if (energy === "fumes" && e > 1) return false;
      return used + e <= budget;
    });
    const choice = fit[0] || (picked.length === 0 ? candidates[0] : null);
    if (!choice) continue;
    picked.push(choice);
    used += choice.effort || 1;
    if (picked.length >= 3) break;
  }
  return picked;
}

/** Where a board/ledger card should send the player. */
export function doorForTask(task) {
  if (!task) return "apartment";
  if (task.category === "move") return "apartment";
  if (task.category === "health") return "health";
  if (task.category === "cat") return "stretchy";
  return "desk";
}

export function makeQuickTask({ title, category, effort = 1 }) {
  const cat = TASK_CATEGORIES[category] ? category : "admin";
  return {
    id: `u_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e4).toString(36)}`,
    title: String(title || "Untitled").trim().slice(0, 120) || "Untitled",
    category: cat,
    effort: Math.min(3, Math.max(1, Number(effort) || 1)),
    urgency: 1,
    due: "",
    dueDate: null,
    dueEnd: null,
    criticalPath: false,
    status: "pending",
    room: null,
    objectId: null,
    relief: cat === "health" || cat === "cat" ? "slide" : "stamp",
    jobId: null,
    zone: null,
    needsInfo: false,
  };
}

function dueLabelFromISO(iso, time) {
  if (!iso || typeof iso !== "string") return "";
  const parts = iso.slice(0, 10).split("-").map(Number);
  if (parts.length < 3 || parts.some((n) => !n)) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const label = `${months[parts[1] - 1]} ${parts[2]}`;
  return time ? `${label} ${time}` : label;
}

/** After Shirley confirms a booking: mark Book done, spawn Attend with that date. */
export function tasksAfterBooking(tasks, appt, bookTask) {
  if (!appt?.dueAt || !bookTask?.id) return tasks;
  const list = Array.isArray(tasks) ? tasks : [];
  const attendId = `attend_${bookTask.id}`;
  const baseTitle = String(bookTask.title || "appointment").replace(/^Book:\s*/i, "");
  const due = dueLabelFromISO(appt.dueAt, appt.time);
  const attend = {
    id: attendId,
    title: `Attend: ${baseTitle}`,
    category: bookTask.category === "cat" ? "cat" : "health",
    effort: bookTask.effort || 2,
    urgency: 3,
    due,
    dueDate: appt.dueAt,
    dueEnd: null,
    criticalPath: !!bookTask.criticalPath,
    status: "pending",
    room: null,
    objectId: null,
    relief: "slide",
    jobId: null,
    zone: bookTask.zone || null,
    needsInfo: false,
    kind: "attend",
    bookTaskId: bookTask.id,
  };
  let next = list.map((t) => (t.id === bookTask.id ? { ...t, status: "done" } : t));
  if (next.some((t) => t.id === attendId)) {
    return next.map((t) => (
      t.id === attendId
        ? { ...attend, status: t.status === "done" ? "done" : "pending" }
        : t
    ));
  }
  return [...next, attend];
}

/** When Body Board marks an appointment attended, close the Attend card too. */
export function tasksAfterAttend(tasks, appt) {
  if (!appt?.taskId) return tasks;
  const attendId = `attend_${appt.taskId}`;
  return (tasks || []).map((t) => (
    t.id === attendId || t.id === appt.taskId ? { ...t, status: "done" } : t
  ));
}
