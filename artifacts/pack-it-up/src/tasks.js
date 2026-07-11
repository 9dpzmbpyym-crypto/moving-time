/* Real move task data. `due` is display copy; `dueDate` / `dueEnd` drive
   calendar and pressure behavior. Effort: 1 tiny, 2 medium, 3 heavy. */
import { currentPhase, isDueSoon, isOverdue } from "./movePhase.js";
import { ENERGY_BUDGET } from "./session.js";

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
  ...task,
});

export const INITIAL_TASKS = [
  // Packing / U-Box
  base({ id: "m_lock", title: "Buy U-Box lock (verify hasp fit)", category: "move", effort: 1, urgency: 2, due: "Jul 26", dueDate: "2026-07-26" }),
  base({ id: "m_labels", title: "Label boxes: U-BOX / PLANE / SUBLET / DO NOT PACK / SELL / TRASH", category: "move", effort: 1, due: "Jul 26", dueDate: "2026-07-26" }),
  base({ id: "m_photos_val", title: "Photograph valuables before packing", category: "move", effort: 1, due: "Jul 26", dueDate: "2026-07-26" }),
  base({ id: "m_stage", title: "Stage heavy boxes near loading path", category: "move", effort: 2, urgency: 2, due: "Jul 26", dueDate: "2026-07-26" }),
  base({ id: "m_fragile", title: "Wrap framed art + fragiles", category: "move", effort: 2, urgency: 2, due: "Jul 26", dueDate: "2026-07-26" }),
  base({ id: "m_furn_decide", title: "Decide which furniture rides the U-Box", category: "move", effort: 2, urgency: 2, due: "Jul 26", dueDate: "2026-07-26" }),
  base({ id: "m_load1", title: "U-Box day: load heavy / boring / low-theft first", category: "move", effort: 3, urgency: 3, due: "Jul 27", dueDate: "2026-07-27", criticalPath: true }),
  base({ id: "m_load_main", title: "Main loading days", category: "move", effort: 3, urgency: 3, due: "Jul 28–29", dueDate: "2026-07-28", dueEnd: "2026-07-29", criticalPath: true }),
  base({ id: "m_sell_final", title: "Final sell / free / donate calls", category: "move", effort: 2, urgency: 2, due: "Jul 29", dueDate: "2026-07-29" }),
  base({ id: "m_photo_lock", title: "Photograph packed interior + lock placement", category: "move", effort: 1, urgency: 2, due: "Jul 30", dueDate: "2026-07-30" }),
  base({ id: "m_lock_final", title: "Lock the U-Box — packed by tonight", category: "move", effort: 1, urgency: 3, due: "Jul 30", dueDate: "2026-07-30", criticalPath: true }),
  base({ id: "m_sweep", title: "Final sweep — flight day, no packing", category: "move", effort: 2, urgency: 3, due: "Jul 31", dueDate: "2026-07-31", criticalPath: true }),

  // Housing. Daily 10+5 outreach remains a session meter, not task cards.
  base({ id: "h_lock", title: "Lock the Aug 1 sublet", category: "housing", effort: 3, urgency: 3, due: "Jul 15", dueDate: "2026-07-15", criticalPath: true }),
  base({ id: "h_followups", title: "Follow up warm replies (24–48h)", category: "housing", effort: 1, urgency: 2, due: "Daily" }),
  base({ id: "h_widen", title: "If not locked: widen to furnished room / month-to-month / friends", category: "housing", effort: 2, urgency: 2, due: "Jul 15+", dueDate: "2026-07-15" }),
  base({ id: "h_comfort_box", title: "Sublet comfort box — ship once address is confirmed", category: "housing", effort: 1, due: "After address", status: "dismissed" }),

  // Real job shortlist
  base({ id: "j_hunter", title: "Apply: Administrative Coordinator, Business Office", category: "job", effort: 3, urgency: 3, due: "Jul 14", dueDate: "2026-07-14", jobId: "job_hunter" }),
  base({ id: "j_hopwa1", title: "Apply: HOPWA Program Analyst — seat 1", category: "job", effort: 3, urgency: 2, due: "Jul 18", dueDate: "2026-07-18", jobId: "job_hopwa1" }),
  base({ id: "j_hopwa2", title: "Apply: HOPWA Program Analyst — seat 2", category: "job", effort: 3, urgency: 2, due: "Jul 18", dueDate: "2026-07-18", jobId: "job_hopwa2" }),
  base({ id: "j_mocs", title: "Apply: MOCS Project Manager", category: "job", effort: 3, urgency: 2, due: "Jul 26", dueDate: "2026-07-26", jobId: "job_mocs" }),
  base({ id: "j_mopt", title: "Apply: MOPT Outreach Coordinator", category: "job", effort: 3, urgency: 2, due: "Jul 28", dueDate: "2026-07-28", jobId: "job_mopt" }),
  base({ id: "j_labor", title: "Apply: Labor Relations Associate, H+H", category: "job", effort: 3, urgency: 1, due: "Aug 30", dueDate: "2026-08-30", jobId: "job_labor" }),

  // Admin cutoff cards
  base({ id: "a_wifi", title: "Wi-Fi return: kit, serial photos, cancel, method, receipt", category: "admin", effort: 2, urgency: 2, due: "Before Jul 30", dueDate: "2026-07-30", criticalPath: true, relief: "file" }),
  base({ id: "a_utils", title: "Utilities cancel / transfer (electric + gas)", category: "admin", effort: 1, due: "Before move", dueDate: "2026-07-30", relief: "file" }),
  base({ id: "a_insurance", title: "Renter's insurance transfer / cancel", category: "admin", effort: 1, due: "Before move", dueDate: "2026-07-30", relief: "file" }),
  base({ id: "a_usps", title: "USPS forwarding once address exists", category: "admin", effort: 1, due: "After address", relief: "file" }),
  base({ id: "a_bank", title: "Bank + credit-card address updates", category: "admin", effort: 1, due: "Before move", dueDate: "2026-07-30", relief: "file" }),
  base({ id: "a_cuny", title: "CUNY account + student-loan address", category: "admin", effort: 1, due: "Before move", dueDate: "2026-07-30", relief: "file" }),
  base({ id: "a_pharmacy", title: "Pharmacy transfer + refills", category: "admin", effort: 1, due: "Before move", dueDate: "2026-07-30", relief: "file" }),
  base({ id: "a_records", title: "Medical + vet records PDFs", category: "admin", effort: 2, due: "Before move", dueDate: "2026-07-30", relief: "file" }),
  base({ id: "a_payout", title: "Final paycheck: PTO payout + insurance end / COBRA", category: "admin", effort: 1, due: "Move day", dueDate: "2026-07-31", relief: "file" }),
  base({ id: "a_voter", title: "Voter registration (NYC)", category: "admin", effort: 1, urgency: 1, due: "Post-move", dueDate: "2026-08-01", status: "dismissed", relief: "file" }),

  // Existing Body Board tasks plus real additions
  base({ id: "t_brain", title: "Psychiatry / med renewals", category: "health", effort: 2, urgency: 2, due: "Before move", dueDate: "2026-07-30", zone: "brain" }),
  base({ id: "t_teeth", title: "Dentist visit", category: "health", effort: 2, urgency: 1, due: "Opportunistic", status: "dismissed", zone: "teeth" }),
  base({ id: "t_heart", title: "Cardiology appointment", category: "health", effort: 2, urgency: 1, due: "After move", status: "dismissed", zone: "heart" }),
  base({ id: "t_lymph", title: "Rheumatology appointment + deferred labs", category: "health", effort: 3, urgency: 2, due: "Before move", dueDate: "2026-07-30", zone: "lymph" }),
  base({ id: "t_stomach", title: "Diet — gentle, steady", category: "health", effort: 1, urgency: 1, due: "Ongoing", zone: "stomach" }),
  base({ id: "t_skin", title: "Dermatology appointment", category: "health", effort: 2, urgency: 1, due: "After move", status: "dismissed", zone: "skin" }),
  base({ id: "t_nerves", title: "Self-care + healthy habits", category: "health", effort: 1, urgency: 1, due: "Ongoing", zone: "nerves" }),
  base({ id: "t_obgyn", title: "OB/GYN — IUD replacement", category: "health", effort: 3, urgency: 3, due: "Try by Jul 25", dueDate: "2026-07-25", zone: "stomach" }),
  base({ id: "t_pcp", title: "PCP — 90-day medication bridge", category: "health", effort: 2, urgency: 2, due: "Before move", dueDate: "2026-07-30", zone: "brain" }),
  base({ id: "t_vet", title: "Stretchy: vet visit (meds + certificate)", category: "cat", effort: 2, urgency: 3, due: "Jul 22–25", dueDate: "2026-07-22", dueEnd: "2026-07-25", criticalPath: true }),

  // Stretchy travel-prep chain
  base({ id: "c_vet_book", title: "Book Stretchy's travel vet visit", category: "cat", effort: 1, urgency: 2, due: "Before Jul 22", dueDate: "2026-07-21", criticalPath: true }),
  base({ id: "c_vet_attend", title: "Attend Stretchy's travel vet visit", category: "cat", effort: 2, urgency: 3, due: "Jul 22–25", dueDate: "2026-07-22", dueEnd: "2026-07-25", criticalPath: true }),
  base({ id: "c_cert", title: "Get Stretchy's travel certificate", category: "cat", effort: 1, urgency: 2, due: "After vet", dueDate: "2026-07-25", criticalPath: true }),
  base({ id: "c_records", title: "Save Stretchy's vet records PDF", category: "cat", effort: 1, due: "After vet", dueDate: "2026-07-25" }),
  base({ id: "c_meds_run", title: "Pick up Stretchy's travel medications", category: "cat", effort: 1, urgency: 2, due: "By Jul 30", dueDate: "2026-07-30", criticalPath: true }),
  base({ id: "c_carrier", title: "Leave carrier out for daily practice", category: "cat", effort: 1, due: "Daily" }),
  base({ id: "c_kit", title: "Pack Stretchy's plane-day kit", category: "cat", effort: 1, urgency: 3, due: "Jul 30", dueDate: "2026-07-30", criticalPath: true }),
];

export const SAMPLE_JOBS = {
  job_hunter: { title: "Administrative Coordinator, Business Office", org: "CUNY — Hunter College", location: "New York, NY", salary: "", deadline: "Jul 14", status: "not started", priority: 96, url: "#", notes: "Real shortlist. Check CUNY schedule fit.", nextAction: "Tailor and submit" },
  job_hopwa1: { title: "HOPWA Program Analyst — seat 1", org: "NYC", location: "New York, NY", salary: "", deadline: "Jul 18", status: "not started", priority: 90, url: "#", notes: "First of two seats.", nextAction: "Tailor and submit" },
  job_hopwa2: { title: "HOPWA Program Analyst — seat 2", org: "NYC", location: "New York, NY", salary: "", deadline: "Jul 18", status: "not started", priority: 89, url: "#", notes: "Second of two seats.", nextAction: "Tailor and submit" },
  job_mocs: { title: "Project Manager", org: "MOCS", location: "New York, NY", salary: "", deadline: "Jul 26", status: "not started", priority: 82, url: "#", notes: "Real shortlist.", nextAction: "Review and submit" },
  job_mopt: { title: "Outreach Coordinator", org: "MOPT", location: "New York, NY", salary: "", deadline: "Jul 28", status: "not started", priority: 78, url: "#", notes: "Real shortlist.", nextAction: "Review and submit" },
  job_labor: { title: "Labor Relations Associate", org: "NYC Health + Hospitals", location: "New York, NY", salary: "", deadline: "Aug 30", status: "backburner", priority: 55, url: "#", notes: "Backburner until move-critical work clears.", nextAction: "Revisit in August" },
};

export const isOpen = (task) => task.status === "pending" || task.status === "active";

/** Pressure is deadline loudness, never backlog volume. */
export function taskPressure(tasks, date = new Date()) {
  const weight = tasks.filter(isOpen).reduce((sum, task) => {
    if (!isOverdue(task, date) && !isDueSoon(task, date, 2)) return sum;
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
  if (openCat.some((task) => isOverdue(task, date) || isDueSoon(task, date, 2))) return 2;
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

function boardScore(task, date) {
  let s = (task.urgency || 1) * 5;
  if (task.criticalPath) s += 100;
  if (isOverdue(task, date)) s += 80;
  else if (isDueSoon(task, date, 2)) s += 40;
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
