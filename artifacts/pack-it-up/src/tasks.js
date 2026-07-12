/* Real move task data. `due` is display copy; `dueDate` / `dueEnd` drive
   calendar and pressure behavior. Effort: 1 tiny, 2 medium, 3 heavy. */
import { currentPhase, isDueSoon, isOverdue, dateKey, taskDueDelta } from "./movePhase.js";
import { ENERGY_BUDGET } from "./session.js";
// Deadline urgency lives in schedule.js (the one engine) — pressure reads it
// rather than re-deriving its own overdue/due-soon math. (Note: schedule.js
// imports `isOpen` from this file — a circular ESM import, safe here because
// both sides only touch the other's exports inside function bodies, never at
// module-eval time.)
import { taskStatus, urgencyScore } from "./schedule.js";

export const SUBLET_OUTREACH_ID = "h_outreach_daily";

/** Dropped from the live list — prune on save merge so old localStorage can't revive them. */
export const REMOVED_TASK_IDS = new Set([
  "t_stomach", "t_nerves", "t_vet",
]);

/** Seeded tasks that moved lanes — force category on merge so old saves don't stick them in admin. */
export const FORCE_TASK_CATEGORY = {
  a_pharmacy: "health",
  a_records: "health",
  c_records: "cat",
};

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
  { id: "job_hunter", taskId: "j_hunter", title: "Administrative Coordinator — Business Office", org: "Hunter College (CUNY)", score: 73, due: "Jul 14", dueDate: "2026-07-14", salary: "$84,815–$94,409", tracker: "saved", prefix: "Apply:", notes: "P0 CUNY/back-end admin; open until filled.", next: "Tailor and submit", effort: 3, urgency: 3, selfTarget: true, latestDate: "2026-07-24", estimatedLatest: true },
  { id: "job_acm", taskId: "j_acm", title: "Assistant Coordinating Manager — Managed Care Finance", org: "H+H — Elmhurst", score: 73, due: "Jul 5", dueDate: "2026-07-05", salary: "$55,105–$63,371", tracker: "saved", prefix: "Apply:", notes: "Self-imposed target; confirm still open, then apply.", next: "Apply if open", effort: 2, urgency: 2, selfTarget: true, latestDate: "2026-07-15", estimatedLatest: true },
  { id: "job_hopwa1", taskId: "j_hopwa1", title: "HOPWA Program Analyst — seat 1", org: "DOHMH — BHHS", score: 71, due: "Jul 18", dueDate: "2026-07-18", salary: "$62,868–$72,298", tracker: "saved", prefix: "Apply:", notes: "P0 housing + public health.", next: "Tailor and submit", effort: 3, urgency: 2 },
  { id: "job_hopwa2", taskId: "j_hopwa2", title: "HOPWA Program Analyst — seat 2", org: "DOHMH — BHHS", score: 71, due: "Jul 18", dueDate: "2026-07-18", salary: "$62,868–$72,298", tracker: "saved", prefix: "Apply:", notes: "Reuse seat-1 materials.", next: "Submit", effort: 3, urgency: 2 },
  { id: "job_cphds", taskId: "j_cphds", title: "Contract Manager — Population Health Data Science", org: "DOHMH — CPHDS", score: 68, due: "Jul 11", dueDate: "2026-07-11", salary: "$68,214–$110,000", tracker: "saved", prefix: "Apply:", notes: "Closes Jul 11 — only if still open/fast.", next: "Check portal", effort: 2, urgency: 3 },
  { id: "job_mopt", taskId: "j_mopt", title: "Public Housing Outreach & Advocacy Coordinator", org: "MOPT", score: 68, due: "Jul 28", dueDate: "2026-07-28", salary: "$100,000–$105,000", tracker: "saved", prefix: "Apply:", notes: "After CUNY/DOHMH batch; watch outreach-heavy duties.", next: "Review and submit", effort: 3, urgency: 2 },
  { id: "job_enroll", taskId: "j_enroll", title: "Enrollment Registrar Specialist", org: "Hunter — School of Social Work", score: 67, due: "Jul 7", dueDate: "2026-07-07", salary: "$82,663–$94,909", tracker: "saved", prefix: "Apply:", notes: "Self-imposed target; open until filled — apply if still open.", next: "Apply if open", effort: 2, urgency: 2, selfTarget: true, latestDate: "2026-07-17", estimatedLatest: true },
  { id: "job_hpd_hqe", taskId: "j_hpd_hqe", title: "Housing Quality Enforcement Specialist", org: "HPD — Budget & Program Ops", score: 63, due: "Jul 25", dueDate: "2026-07-25", salary: "$44,545–$51,227", tracker: "saved", prefix: "Apply:", notes: "P2 — salary low; possible inspection flavor.", next: "Decide fit", effort: 2, urgency: 1 },
  { id: "job_exec", taskId: "j_exec", title: "Confidential Executive Associate", org: "CUNY — University HR", score: 62, due: "Jul 3", dueDate: "2026-07-03", salary: "$98,995–$109,898", tracker: "saved", prefix: "Apply:", notes: "Self-imposed target; steep experience bar — apply if open.", next: "Apply if open", effort: 2, urgency: 1, selfTarget: true, latestDate: "2026-07-13", estimatedLatest: true },
  { id: "job_onboard", taskId: "j_onboard", title: "Onboarding Specialist", org: "H+H — Harlem Hospital", score: 62, due: "Jul 10", dueDate: "2026-07-10", salary: "$60,000–$65,000", tracker: "saved", prefix: "Apply:", notes: "Self-imposed Jul 10 target; H+H HR/back-end.", next: "Quick apply if open", effort: 2, urgency: 2, selfTarget: true, latestDate: "2026-07-20", estimatedLatest: true },
  { id: "job_student", taskId: "j_student", title: "Administrative Coordinator — Student Services, Social Work", org: "Hunter — School of Social Work", score: 61, due: "Jul 8", dueDate: "2026-07-08", salary: "$63,003–$72,236", tracker: "saved", prefix: "Apply:", notes: "Self-imposed target; student-facing concern — apply if open.", next: "Apply if open", effort: 2, urgency: 1, selfTarget: true, latestDate: "2026-07-18", estimatedLatest: true },
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
  // Forward-compat only — §14 rule: selfTarget jobs get an estimated Latest (target + 10d)
  // until a real closing date replaces it. Non-selfTarget jobs just carry targetDate.
  targetDate: j.dueDate,
  latestDate: j.latestDate || null,
  estimatedLatest: !!j.estimatedLatest,
}));

export const INITIAL_TASKS = [
  // Packing / U-Box. Existing dates refined per docs/inbox/chatgpt-productivity-structure-for-claude-7-11.md
  // §9 U-BOX PREPARATION table — dueDate now tracks spec Target, dueEnd tracks spec Latest.
  // Forward-compat fields (targetDate/latestDate/availableFrom/criticality) added for the future engine;
  // legacy urgency/effort/criticalPath left as-is to avoid re-tuning current Command Board scoring.
  base({ id: "m_lock", title: "Buy U-Box lock (verify hasp fit)", category: "move", effort: 1, urgency: 2, due: "Jul 24", dueDate: "2026-07-24", dueEnd: "2026-07-26", availableFrom: "2026-07-11", targetDate: "2026-07-24", latestDate: "2026-07-26", criticality: 3 }),
  base({ id: "m_labels", title: "Label boxes: U-BOX / PLANE / SUBLET / DO NOT PACK / SELL / TRASH", category: "move", effort: 1, due: "Jul 11", dueDate: "2026-07-11", dueEnd: "2026-07-13", availableFrom: "2026-07-11", targetDate: "2026-07-11", latestDate: "2026-07-13", criticality: 2 }),
  base({ id: "m_photos_val", title: "Photograph valuables before packing", category: "move", effort: 1, due: "Jul 24", dueDate: "2026-07-24", dueEnd: "2026-07-26", availableFrom: "2026-07-11", targetDate: "2026-07-24", latestDate: "2026-07-26", criticality: 2 }),
  base({ id: "m_stage", title: "Stage heavy boxes near loading path", category: "move", effort: 2, urgency: 2, due: "Jul 24", dueDate: "2026-07-24", dueEnd: "2026-07-26", availableFrom: "2026-07-22", targetDate: "2026-07-24", latestDate: "2026-07-26", criticality: 3 }),
  base({ id: "m_fragile", title: "Wrap framed art + fragiles", category: "move", effort: 2, urgency: 2, due: "Jul 24", dueDate: "2026-07-24", dueEnd: "2026-07-26", availableFrom: "2026-07-11", targetDate: "2026-07-24", latestDate: "2026-07-26", criticality: 2 }),
  base({ id: "m_furn_decide", title: "Decide which furniture rides the U-Box", category: "move", effort: 2, urgency: 2, due: "Jul 25", dueDate: "2026-07-25", dueEnd: "2026-07-26", availableFrom: "2026-07-23", targetDate: "2026-07-25", latestDate: "2026-07-26", criticality: 3 }),
  base({ id: "m_confirm_delivery", title: "Confirm U-Box delivery access/placement", category: "move", effort: 1, urgency: 2, due: "Jul 23", dueDate: "2026-07-23", dueEnd: "2026-07-26", availableFrom: "2026-07-20", targetDate: "2026-07-23", latestDate: "2026-07-26", criticality: 3 }),
  base({ id: "m_confirm_pickup", title: "Confirm unattended U-Box pickup instructions", category: "move", effort: 1, urgency: 2, due: "Jul 24", dueDate: "2026-07-24", dueEnd: "2026-07-30", availableFrom: "2026-07-20", targetDate: "2026-07-24", latestDate: "2026-07-30", criticality: 3 }),
  base({ id: "p_roll_rug_lamp", title: "Roll/protect rug and lamp", category: "move", effort: 2, urgency: 2, due: "Jul 25", dueDate: "2026-07-25", dueEnd: "2026-07-26", availableFrom: "2026-07-23", targetDate: "2026-07-25", latestDate: "2026-07-26", criticality: 3 }),
  base({ id: "p_guitar_amp", title: "Secure guitar/amp/accessories", category: "move", effort: 2, urgency: 2, due: "Jul 25", dueDate: "2026-07-25", dueEnd: "2026-07-26", availableFrom: "2026-07-23", targetDate: "2026-07-25", latestDate: "2026-07-26", criticality: 3 }),
  base({ id: "m_clear_path", title: "Clear loading path", category: "move", effort: 2, urgency: 2, due: "Jul 26", dueDate: "2026-07-26", dueEnd: "2026-07-26", availableFrom: "2026-07-24", targetDate: "2026-07-26", latestDate: "2026-07-26", criticality: 3 }),
  base({ id: "m_load_map", title: "Create load map", category: "move", effort: 1, urgency: 2, due: "Jul 26", dueDate: "2026-07-26", dueEnd: "2026-07-26", availableFrom: "2026-07-24", targetDate: "2026-07-26", latestDate: "2026-07-26", criticality: 3 }),
  base({ id: "m_one_night_mode", title: "Convert apartment to one-night mode", category: "move", effort: 2, urgency: 2, due: "Jul 26", dueDate: "2026-07-26", dueEnd: "2026-07-26", availableFrom: "2026-07-24", targetDate: "2026-07-26", latestDate: "2026-07-26", criticality: 3 }),

  // §9 EARLY PACKING — none of these existed yet; all new granular packing cards.
  base({ id: "p_books", title: "Pack books and coffee-table books", category: "move", effort: 2, due: "Jul 11", dueDate: "2026-07-11", dueEnd: "2026-07-15", availableFrom: "2026-07-11", targetDate: "2026-07-11", latestDate: "2026-07-15", criticality: 2 }),
  base({ id: "p_death_cords", title: "Pack death-closet cords/electronics", category: "move", effort: 2, due: "Jul 11", dueDate: "2026-07-11", dueEnd: "2026-07-15", availableFrom: "2026-07-11", targetDate: "2026-07-11", latestDate: "2026-07-15", criticality: 2 }),
  base({ id: "p_decor", title: "Pack decor/vases/candles/knickknacks", category: "move", effort: 2, due: "Jul 12", dueDate: "2026-07-12", dueEnd: "2026-07-15", availableFrom: "2026-07-11", targetDate: "2026-07-12", latestDate: "2026-07-15", criticality: 2 }),
  base({ id: "p_art", title: "Pack framed art and prints", category: "move", effort: 2, due: "Jul 13", dueDate: "2026-07-13", dueEnd: "2026-07-16", availableFrom: "2026-07-11", targetDate: "2026-07-13", latestDate: "2026-07-16", criticality: 2 }),
  base({ id: "p_craft_supplies", title: "Pack art/sewing/fabric supplies", category: "move", effort: 2, due: "Jul 13", dueDate: "2026-07-13", dueEnd: "2026-07-16", availableFrom: "2026-07-11", targetDate: "2026-07-13", latestDate: "2026-07-16", criticality: 2 }),
  base({ id: "p_games", title: "Pack board games and gaming extras", category: "move", effort: 1, due: "Jul 12", dueDate: "2026-07-12", dueEnd: "2026-07-16", availableFrom: "2026-07-11", targetDate: "2026-07-12", latestDate: "2026-07-16", criticality: 2 }),
  base({ id: "p_winter_clothes", title: "Pack winter/off-season clothes", category: "move", effort: 2, due: "Jul 14", dueDate: "2026-07-14", dueEnd: "2026-07-18", availableFrom: "2026-07-12", targetDate: "2026-07-14", latestDate: "2026-07-18", criticality: 2 }),
  base({ id: "p_linens", title: "Pack extra linens/towels", category: "move", effort: 1, due: "Jul 14", dueDate: "2026-07-14", dueEnd: "2026-07-18", availableFrom: "2026-07-12", targetDate: "2026-07-14", latestDate: "2026-07-18", criticality: 2 }),
  base({ id: "p_barware", title: "Pack unused barware/glassware", category: "move", effort: 2, due: "Jul 14", dueDate: "2026-07-14", dueEnd: "2026-07-19", availableFrom: "2026-07-12", targetDate: "2026-07-14", latestDate: "2026-07-19", criticality: 2 }),
  base({ id: "p_outdoor_keep", title: "Pack outdoor/garden items being kept", category: "move", effort: 2, due: "Jul 15", dueDate: "2026-07-15", dueEnd: "2026-07-18", availableFrom: "2026-07-13", targetDate: "2026-07-15", latestDate: "2026-07-18", criticality: 2 }),
  base({ id: "p_electronics", title: "Pack remaining nonessential electronics", category: "move", effort: 2, due: "Jul 15", dueDate: "2026-07-15", dueEnd: "2026-07-19", availableFrom: "2026-07-13", targetDate: "2026-07-15", latestDate: "2026-07-19", criticality: 2 }),

  // Mid-month room packing (apartment Pack verb is still the real work — these are planning cards)
  base({ id: "m_pack_overflow", title: "Pack bedroom + closet overflow", category: "move", effort: 2, urgency: 2, due: "Jul 16–22", dueDate: "2026-07-16", dueEnd: "2026-07-22", availableFrom: "2026-07-16", targetDate: "2026-07-16", latestDate: "2026-07-22", criticality: 2 }),
  base({ id: "m_pack_bath", title: "Pack bathroom backup + vanity extras", category: "move", effort: 2, due: "Jul 17–23", dueDate: "2026-07-17", dueEnd: "2026-07-23", availableFrom: "2026-07-16", targetDate: "2026-07-17", latestDate: "2026-07-23", criticality: 2 }),
  base({ id: "m_pack_office", title: "Pack office supplies and papers", category: "move", effort: 2, due: "Jul 18–24", dueDate: "2026-07-18", dueEnd: "2026-07-24", availableFrom: "2026-07-16", targetDate: "2026-07-18", latestDate: "2026-07-24", criticality: 2 }),
  base({ id: "p_triage_docs", title: "Triage documents into archive/carry/shred", category: "move", effort: 2, urgency: 2, due: "Jul 18", dueDate: "2026-07-18", dueEnd: "2026-07-22", availableFrom: "2026-07-16", targetDate: "2026-07-18", latestDate: "2026-07-22", criticality: 3 }),
  base({ id: "m_pack_kitchen", title: "Pack nonessential kitchen", category: "move", effort: 2, due: "Jul 19–23", dueDate: "2026-07-19", dueEnd: "2026-07-23", availableFrom: "2026-07-17", targetDate: "2026-07-19", latestDate: "2026-07-23", criticality: 2 }),
  base({ id: "p_dining_bar", title: "Pack dining/bar cabinet contents", category: "move", effort: 2, due: "Jul 19", dueDate: "2026-07-19", dueEnd: "2026-07-23", availableFrom: "2026-07-17", targetDate: "2026-07-19", latestDate: "2026-07-23", criticality: 2 }),
  base({ id: "m_pack_living", title: "Pack living decor/electronics + dining/bar", category: "move", effort: 2, due: "Jul 20–24", dueDate: "2026-07-20", dueEnd: "2026-07-24", availableFrom: "2026-07-18", targetDate: "2026-07-20", latestDate: "2026-07-24", criticality: 2 }),
  base({ id: "p_cat_belongings", title: "Pack Stretchy's nonessential belongings", category: "move", effort: 1, due: "Jul 21", dueDate: "2026-07-21", dueEnd: "2026-07-25", availableFrom: "2026-07-19", targetDate: "2026-07-21", latestDate: "2026-07-25", criticality: 2 }),
  base({ id: "p_bedroom_capsule", title: "Reduce bedroom to travel capsule", category: "move", effort: 2, due: "Jul 22", dueDate: "2026-07-22", dueEnd: "2026-07-25", availableFrom: "2026-07-20", targetDate: "2026-07-22", latestDate: "2026-07-25", criticality: 2 }),
  base({ id: "p_bathroom_kit", title: "Reduce bathroom to daily kit", category: "move", effort: 1, due: "Jul 22", dueDate: "2026-07-22", dueEnd: "2026-07-25", availableFrom: "2026-07-20", targetDate: "2026-07-22", latestDate: "2026-07-25", criticality: 2 }),
  base({ id: "p_zones_plane", title: "Establish PLANE and DO NOT PACK zones", category: "move", effort: 1, urgency: 2, due: "Jul 22", dueDate: "2026-07-22", dueEnd: "2026-07-24", availableFrom: "2026-07-18", targetDate: "2026-07-22", latestDate: "2026-07-24", criticality: 3 }),
  base({ id: "p_reduce_kitchen", title: "Reduce kitchen to survival kit", category: "move", effort: 2, due: "Jul 23", dueDate: "2026-07-23", dueEnd: "2026-07-25", availableFrom: "2026-07-20", targetDate: "2026-07-23", latestDate: "2026-07-25", criticality: 2 }),
  base({ id: "p_food_drawdown", title: "Begin food drawdown", category: "move", effort: 1, due: "Jul 23", dueDate: "2026-07-23", dueEnd: "2026-07-25", availableFrom: "2026-07-20", targetDate: "2026-07-23", latestDate: "2026-07-25", criticality: 2 }),
  base({ id: "p_final_clean_kit", title: "Prepare final-clean kit", category: "move", effort: 1, due: "Jul 23", dueDate: "2026-07-23", dueEnd: "2026-07-26", availableFrom: "2026-07-20", targetDate: "2026-07-23", latestDate: "2026-07-26", criticality: 2 }),
  base({ id: "p_close_office", title: "Close office except active work kit", category: "move", effort: 2, due: "Jul 24", dueDate: "2026-07-24", dueEnd: "2026-07-26", availableFrom: "2026-07-22", targetDate: "2026-07-24", latestDate: "2026-07-26", criticality: 2 }),

  // §7 Furniture sale windows. Buyer is responsible for loading/transport; "remove" isn't
  // done until the item is physically gone. Dresser/sofa/desk/bed are late on purpose — still in use.
  base({ id: "f_buyer_outdoor", title: "Find buyer: outdoor furniture", category: "move", effort: 1, due: "Jul 12", dueDate: "2026-07-12", dueEnd: "2026-07-14", availableFrom: "2026-07-11", targetDate: "2026-07-12", latestDate: "2026-07-14", criticality: 2 }),
  base({ id: "f_remove_outdoor", title: "Remove outdoor furniture", category: "move", effort: 2, urgency: 2, due: "Jul 15", dueDate: "2026-07-15", dueEnd: "2026-07-17", availableFrom: null, targetDate: "2026-07-15", latestDate: "2026-07-17", criticality: 3, dependsNote: "after buyer found" }),
  base({ id: "f_buyer_dining", title: "Find buyer: dining table/chairs", category: "move", effort: 1, due: "Jul 12", dueDate: "2026-07-12", dueEnd: "2026-07-14", availableFrom: "2026-07-11", targetDate: "2026-07-12", latestDate: "2026-07-14", criticality: 2 }),
  base({ id: "f_remove_dining", title: "Remove dining set", category: "move", effort: 2, urgency: 2, due: "Jul 16", dueDate: "2026-07-16", dueEnd: "2026-07-18", availableFrom: null, targetDate: "2026-07-16", latestDate: "2026-07-18", criticality: 3, dependsNote: "after buyer found" }),
  base({ id: "f_buyer_entertainment", title: "Find buyer: entertainment center", category: "move", effort: 1, due: "Jul 14", dueDate: "2026-07-14", dueEnd: "2026-07-17", availableFrom: "2026-07-12", targetDate: "2026-07-14", latestDate: "2026-07-17", criticality: 2 }),
  base({ id: "f_remove_entertainment", title: "Remove entertainment center", category: "move", effort: 2, urgency: 2, due: "Jul 19", dueDate: "2026-07-19", dueEnd: "2026-07-22", availableFrom: null, targetDate: "2026-07-19", latestDate: "2026-07-22", criticality: 3, dependsNote: "after buyer found" }),
  base({ id: "f_buyer_coffee", title: "Find buyer: coffee table", category: "move", effort: 1, due: "Jul 15", dueDate: "2026-07-15", dueEnd: "2026-07-18", availableFrom: "2026-07-12", targetDate: "2026-07-15", latestDate: "2026-07-18", criticality: 2 }),
  base({ id: "f_remove_coffee", title: "Remove coffee table", category: "move", effort: 2, urgency: 2, due: "Jul 20", dueDate: "2026-07-20", dueEnd: "2026-07-23", availableFrom: null, targetDate: "2026-07-20", latestDate: "2026-07-23", criticality: 3, dependsNote: "after buyer found" }),
  base({ id: "f_buyer_shoeshelf", title: "Find buyer: shoe shelf", category: "move", effort: 1, due: "Jul 14", dueDate: "2026-07-14", dueEnd: "2026-07-18", availableFrom: "2026-07-11", targetDate: "2026-07-14", latestDate: "2026-07-18", criticality: 2 }),
  base({ id: "f_remove_shoeshelf", title: "Remove shoe shelf", category: "move", effort: 1, urgency: 2, due: "Jul 22", dueDate: "2026-07-22", dueEnd: "2026-07-25", availableFrom: null, targetDate: "2026-07-22", latestDate: "2026-07-25", criticality: 3, dependsNote: "after buyer found" }),
  base({ id: "f_buyer_shelves", title: "Find buyer/donation home: kitchen metal shelves", category: "move", effort: 1, due: "Jul 15", dueDate: "2026-07-15", dueEnd: "2026-07-19", availableFrom: "2026-07-11", targetDate: "2026-07-15", latestDate: "2026-07-19", criticality: 2 }),
  base({ id: "f_remove_shelves", title: "Remove kitchen metal shelves", category: "move", effort: 2, urgency: 2, due: "Jul 23", dueDate: "2026-07-23", dueEnd: "2026-07-26", availableFrom: null, targetDate: "2026-07-23", latestDate: "2026-07-26", criticality: 3, dependsNote: "after buyer/donation decision" }),
  base({ id: "f_buyer_tv", title: "Find buyer: TV", category: "move", effort: 1, due: "Jul 22", dueDate: "2026-07-22", dueEnd: "2026-07-25", availableFrom: "2026-07-18", targetDate: "2026-07-22", latestDate: "2026-07-25", criticality: 2 }),
  base({ id: "f_remove_tv", title: "Remove TV", category: "move", effort: 2, urgency: 2, due: "Jul 28", dueDate: "2026-07-28", dueEnd: "2026-07-29", availableFrom: null, targetDate: "2026-07-28", latestDate: "2026-07-29", criticality: 3, dependsNote: "after buyer found" }),
  base({ id: "f_buyer_desk", title: "Find buyer: office desk and chair", category: "move", effort: 1, due: "Jul 20", dueDate: "2026-07-20", dueEnd: "2026-07-23", availableFrom: "2026-07-18", targetDate: "2026-07-20", latestDate: "2026-07-23", criticality: 2 }),
  base({ id: "f_remove_desk", title: "Remove desk and chair", category: "move", effort: 2, urgency: 2, due: "Jul 27", dueDate: "2026-07-27", dueEnd: "2026-07-28", availableFrom: null, targetDate: "2026-07-27", latestDate: "2026-07-28", criticality: 3, dependsNote: "after buyer found" }),
  base({ id: "f_buyer_sofa", title: "Find buyer: sofa", category: "move", effort: 1, due: "Jul 20", dueDate: "2026-07-20", dueEnd: "2026-07-24", availableFrom: "2026-07-18", targetDate: "2026-07-20", latestDate: "2026-07-24", criticality: 2 }),
  base({ id: "f_remove_sofa", title: "Remove sofa", category: "move", effort: 2, urgency: 2, due: "Jul 27", dueDate: "2026-07-27", dueEnd: "2026-07-29", availableFrom: null, targetDate: "2026-07-27", latestDate: "2026-07-29", criticality: 3, dependsNote: "after buyer found" }),
  base({ id: "f_buyer_dresser", title: "Find buyer: dresser", category: "move", effort: 1, due: "Jul 21", dueDate: "2026-07-21", dueEnd: "2026-07-24", availableFrom: "2026-07-20", targetDate: "2026-07-21", latestDate: "2026-07-24", criticality: 2 }),
  base({ id: "f_remove_dresser", title: "Remove dresser", category: "move", effort: 2, urgency: 2, due: "Jul 27", dueDate: "2026-07-27", dueEnd: "2026-07-29", availableFrom: null, targetDate: "2026-07-27", latestDate: "2026-07-29", criticality: 3, dependsNote: "after buyer found" }),
  base({ id: "f_buyer_bedside", title: "Find buyer: bedside table", category: "move", effort: 1, due: "Jul 23", dueDate: "2026-07-23", dueEnd: "2026-07-25", availableFrom: "2026-07-22", targetDate: "2026-07-23", latestDate: "2026-07-25", criticality: 2 }),
  base({ id: "f_remove_bedside", title: "Remove bedside table", category: "move", effort: 1, urgency: 2, due: "Jul 28", dueDate: "2026-07-28", dueEnd: "2026-07-29", availableFrom: null, targetDate: "2026-07-28", latestDate: "2026-07-29", criticality: 3, dependsNote: "after buyer found" }),
  base({ id: "f_buyer_ac", title: "Find buyer: AC unit", category: "move", effort: 1, due: "Jul 20", dueDate: "2026-07-20", dueEnd: "2026-07-24", availableFrom: "2026-07-15", targetDate: "2026-07-20", latestDate: "2026-07-24", criticality: 2 }),
  base({ id: "f_remove_ac", title: "Remove AC unit", category: "move", effort: 2, urgency: 2, due: "Jul 28", dueDate: "2026-07-28", dueEnd: "2026-07-30", availableFrom: null, targetDate: "2026-07-28", latestDate: "2026-07-30", criticality: 3, dependsNote: "after buyer found" }),
  base({ id: "f_bed_plan", title: "Plan bed-frame/mattress disposal", category: "move", effort: 2, urgency: 2, due: "Jul 18", dueDate: "2026-07-18", dueEnd: "2026-07-22", availableFrom: "2026-07-11", targetDate: "2026-07-18", latestDate: "2026-07-22", criticality: 3 }),
  base({ id: "f_remove_bedframe", title: "Remove bed frame", category: "move", effort: 2, urgency: 2, due: "Jul 29", dueDate: "2026-07-29", dueEnd: "2026-07-30", availableFrom: "2026-07-28", targetDate: "2026-07-29", latestDate: "2026-07-30", criticality: 3 }),
  base({ id: "f_remove_mattress", title: "Remove mattress", category: "move", effort: 2, urgency: 3, due: "Jul 31 morning", dueDate: "2026-07-31", dueEnd: "2026-07-31", availableFrom: "2026-07-31", targetDate: "2026-07-31", latestDate: "2026-07-31", criticality: 3, criticalPath: true, dependsNote: "before key handover" }),
  base({ id: "f_keep_lamp", title: "Confirm keep/load: floor lamp", category: "move", effort: 1, due: "Jul 23", dueDate: "2026-07-23", dueEnd: "2026-07-25", availableFrom: "2026-07-20", targetDate: "2026-07-23", latestDate: "2026-07-25", criticality: 2 }),
  base({ id: "f_keep_bar", title: "Confirm keep/load: bar cabinet", category: "move", effort: 1, due: "Jul 23", dueDate: "2026-07-23", dueEnd: "2026-07-25", availableFrom: "2026-07-20", targetDate: "2026-07-23", latestDate: "2026-07-25", criticality: 2 }),
  base({ id: "f_keep_rug", title: "Confirm keep/load: large rug", category: "move", effort: 1, due: "Jul 23", dueDate: "2026-07-23", dueEnd: "2026-07-25", availableFrom: "2026-07-20", targetDate: "2026-07-23", latestDate: "2026-07-25", criticality: 2 }),

  // Recurring — Facebook Marketplace inbox (§6.2). Seeded for today; ends when all sellable furniture is resolved.
  base({ id: "s_fb_inbox", title: "Clear Facebook Marketplace messages", category: "move", effort: 1, urgency: 2, due: "Today", dueDate: "2026-07-11", dueEnd: "2026-07-12", availableFrom: "2026-07-11", targetDate: "2026-07-11", latestDate: "2026-07-12", criticality: 2, kind: "daily" }),

  base({ id: "m_load1", title: "U-Box day: load heavy / boring / low-theft first", category: "move", effort: 3, urgency: 3, due: "Jul 27", dueDate: "2026-07-27", exactDate: "2026-07-27", criticalPath: true, availableFrom: "2026-07-27", targetDate: "2026-07-27", latestDate: "2026-07-27", criticality: 3 }),
  base({ id: "m_load_main", title: "Main loading days", category: "move", effort: 3, urgency: 3, due: "Jul 28–29", dueDate: "2026-07-28", dueEnd: "2026-07-29", criticalPath: true, availableFrom: "2026-07-27", targetDate: "2026-07-28", latestDate: "2026-07-29", criticality: 3 }),
  base({ id: "m_ubox_receive", title: "Receive and inspect U-Box", category: "move", effort: 1, urgency: 2, due: "Jul 27", dueDate: "2026-07-27", exactDate: "2026-07-27", availableFrom: "2026-07-27", targetDate: "2026-07-27", latestDate: "2026-07-27", criticality: 3 }),
  base({ id: "m_ubox_photo_empty", title: "Photograph empty U-Box interior", category: "move", effort: 1, due: "Jul 27", dueDate: "2026-07-27", availableFrom: "2026-07-27", targetDate: "2026-07-27", latestDate: "2026-07-27", criticality: 2 }),
  base({ id: "m_load_late_value", title: "Load late-value storage items", category: "move", effort: 2, urgency: 2, due: "Jul 29", dueDate: "2026-07-29", dueEnd: "2026-07-30", availableFrom: "2026-07-29", targetDate: "2026-07-29", latestDate: "2026-07-30", criticality: 3 }),
  base({ id: "m_plane_bags", title: "Finish plane bags", category: "move", effort: 2, urgency: 2, due: "Jul 29", dueDate: "2026-07-29", dueEnd: "2026-07-30", availableFrom: "2026-07-27", targetDate: "2026-07-29", latestDate: "2026-07-30", criticality: 3 }),
  base({ id: "m_pack_final_items", title: "Pack final apartment-use items", category: "move", effort: 2, urgency: 2, due: "Jul 30", dueDate: "2026-07-30", availableFrom: "2026-07-30", targetDate: "2026-07-30", latestDate: "2026-07-30", criticality: 3 }),
  base({ id: "m_load_complete", title: "Complete final U-Box load", category: "move", effort: 3, urgency: 3, due: "Jul 30", dueDate: "2026-07-30", criticalPath: true, availableFrom: "2026-07-30", targetDate: "2026-07-30", latestDate: "2026-07-30", criticality: 3 }),
  base({ id: "m_sell_final", title: "Final sell / free / donate calls", category: "move", effort: 2, urgency: 2, due: "Jul 29", dueDate: "2026-07-29" }),
  base({ id: "m_photo_lock", title: "Photograph packed interior + lock placement", category: "move", effort: 1, urgency: 2, due: "Jul 30", dueDate: "2026-07-30", dueEnd: "2026-07-30", availableFrom: "2026-07-30", targetDate: "2026-07-30", latestDate: "2026-07-30", criticality: 3 }),
  base({ id: "m_lock_final", title: "Lock the U-Box — packed by tonight", category: "move", effort: 1, urgency: 3, due: "Jul 30", dueDate: "2026-07-30", dueEnd: "2026-07-30", exactDate: "2026-07-30", criticalPath: true, availableFrom: "2026-07-30", targetDate: "2026-07-30", latestDate: "2026-07-30", criticality: 3 }),
  base({ id: "m_sweep", title: "Final sweep — flight day, no packing", category: "move", effort: 2, urgency: 3, due: "Jul 31", dueDate: "2026-07-31", dueEnd: "2026-07-31", exactDate: "2026-07-31", criticalPath: true, availableFrom: "2026-07-31", targetDate: "2026-07-31", latestDate: "2026-07-31", criticality: 3 }),

  // §8 Stretchy furniture decisions — decision branches; keep/donate outcomes are dependency-gated.
  base({ id: "c_scratch_decide", title: "Decide: keep or donate Stretchy's scratching post", category: "cat", effort: 1, due: "Jul 18", dueDate: "2026-07-18", dueEnd: "2026-07-23", availableFrom: "2026-07-11", targetDate: "2026-07-18", latestDate: "2026-07-23", criticality: 2 }),
  base({ id: "c_scratch_keep", title: "Pack/load scratching post (keep branch)", category: "cat", effort: 1, due: "Jul 25", dueDate: "2026-07-25", dueEnd: "2026-07-28", availableFrom: null, targetDate: "2026-07-25", latestDate: "2026-07-28", criticality: 2, dependsNote: "if keep chosen for scratching post" }),
  base({ id: "c_scratch_donate", title: "Donate scratching post (donate branch)", category: "cat", effort: 1, due: "Jul 23", dueDate: "2026-07-23", dueEnd: "2026-07-26", availableFrom: null, targetDate: "2026-07-23", latestDate: "2026-07-26", criticality: 2, dependsNote: "if donate chosen for scratching post" }),
  base({ id: "c_tree_decide", title: "Decide: bring or donate disassembled cat tree", category: "cat", effort: 1, due: "Jul 17", dueDate: "2026-07-17", dueEnd: "2026-07-21", availableFrom: "2026-07-11", targetDate: "2026-07-17", latestDate: "2026-07-21", criticality: 2 }),
  base({ id: "c_tree_keep", title: "Pack/load cat tree (keep branch)", category: "cat", effort: 2, due: "Jul 24", dueDate: "2026-07-24", dueEnd: "2026-07-28", availableFrom: null, targetDate: "2026-07-24", latestDate: "2026-07-28", criticality: 2, dependsNote: "if keep chosen for cat tree" }),
  base({ id: "c_tree_donate", title: "Donate cat tree (donate branch)", category: "cat", effort: 1, due: "Jul 22", dueDate: "2026-07-22", dueEnd: "2026-07-25", availableFrom: null, targetDate: "2026-07-22", latestDate: "2026-07-25", criticality: 2, dependsNote: "if donate chosen for cat tree" }),

  // Housing. Session meter = Messages 10 / Backups 5 ticks; daily card = today's outreach batch.
  // §10 SUBLET / LANDLORD — dates refined from the productivity structure doc; forward-compat fields added.
  base({ id: "h_lock", title: "Lock the Aug 1 sublet", category: "housing", effort: 3, urgency: 3, due: "Jul 15", dueDate: "2026-07-15", dueEnd: "2026-07-20", criticalPath: true, availableFrom: "2026-07-11", targetDate: "2026-07-15", latestDate: "2026-07-20", criticality: 3 }),
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
    criticality: 3,
  }),
  base({ id: "h_followups", title: "Follow up warm replies (24–48h)", category: "housing", effort: 1, urgency: 2, due: "Daily" }),
  base({ id: "h_widen", title: "If not locked: widen to furnished room / month-to-month / friends", category: "housing", effort: 2, urgency: 3, due: "Jul 15+", dueDate: "2026-07-15", dueEnd: "2026-07-16", availableFrom: "2026-07-15", targetDate: "2026-07-15", latestDate: "2026-07-16", criticality: 3, dependsNote: "only if sublet not locked by Jul 15" }),
  base({ id: "h_comfort_box", title: "Sublet comfort box — ship once address is confirmed", category: "housing", effort: 1, due: "After address", status: "dismissed", availableFrom: null, dependsNote: "after receiving address confirmed" }),
  base({ id: "h_proof_packet", title: "Prepare proof-of-income/reference packet", category: "housing", effort: 1, due: "Jul 11", dueDate: "2026-07-11", dueEnd: "2026-07-12", availableFrom: "2026-07-11", targetDate: "2026-07-11", latestDate: "2026-07-12", criticality: 2 }),
  base({ id: "h_qualify_lead", title: "Qualify warm lead", category: "housing", effort: 1, urgency: 2, due: "Same day as reply", dueDate: null, availableFrom: null, criticality: 3, dependsNote: "after reply received; latest 24h" }),
  base({ id: "h_confirm_price", title: "Confirm exact move-in dates and price", category: "housing", effort: 1, urgency: 2, due: "Before payment", dueDate: null, availableFrom: null, criticality: 3, dependsNote: "before sending payment" }),
  base({ id: "h_confirm_pet", title: "Confirm Stretchy approval in writing", category: "housing", effort: 1, urgency: 2, due: "Before payment", dueDate: null, availableFrom: null, criticality: 3, dependsNote: "before sending payment" }),
  base({ id: "h_confirm_extension", title: "Confirm possible Sept/Oct extension", category: "housing", effort: 1, due: "Before agreement", dueDate: null, availableFrom: null, criticality: 2, dependsNote: "before signing agreement" }),
  base({ id: "h_video_tour", title: "Complete video tour or trusted verification", category: "housing", effort: 1, urgency: 2, due: "Within 48h of warm lead", dueDate: null, availableFrom: null, criticality: 3, dependsNote: "within 48h of a warm lead" }),
  base({ id: "h_verify_payment", title: "Verify identity, agreement and payment method", category: "housing", effort: 1, urgency: 2, due: "Before sending money", dueDate: null, availableFrom: null, criticality: 3, dependsNote: "before sending money" }),
  base({ id: "h_temp_fallback", title: "Secure temporary fallback housing", category: "housing", effort: 2, urgency: 2, due: "Jul 20", dueDate: "2026-07-20", dueEnd: "2026-07-23", availableFrom: "2026-07-16", targetDate: "2026-07-20", latestDate: "2026-07-23", criticality: 3, dependsNote: "if sublet not locked by Jul 16" }),
  base({ id: "h_finalize_address", title: "Finalize receiving address", category: "housing", effort: 1, urgency: 2, due: "After housing lock", dueDate: null, dueEnd: "2026-07-27", availableFrom: null, latestDate: "2026-07-27", criticality: 3, dependsNote: "after housing lock" }),
  base({ id: "h_keys_access", title: "Finalize keys and midnight-arrival access", category: "housing", effort: 1, urgency: 2, due: "After housing lock", dueDate: null, dueEnd: "2026-07-29", availableFrom: null, latestDate: "2026-07-29", criticality: 3, dependsNote: "after housing lock, within 48h" }),
  base({ id: "h_ask_blinds", title: "Ask whether vertical blinds must be restored", category: "housing", effort: 1, urgency: 3, due: "Jul 20", dueDate: "2026-07-20", dueEnd: "2026-07-22", criticalPath: true, availableFrom: "2026-07-11", targetDate: "2026-07-20", latestDate: "2026-07-22", criticality: 3, dependsNote: "Eloisa timing - editable" }),
  base({ id: "h_locate_blinds", title: "Locate vertical blinds and hardware", category: "housing", effort: 1, due: "Jul 18", dueDate: "2026-07-18", dueEnd: "2026-07-22", availableFrom: "2026-07-11", targetDate: "2026-07-18", latestDate: "2026-07-22", criticality: 2 }),
  base({ id: "h_curtains_decide", title: "Decide curtains: take, donate or discard", category: "housing", effort: 1, due: "Jul 25", dueDate: "2026-07-25", dueEnd: "2026-07-28", availableFrom: "2026-07-20", targetDate: "2026-07-25", latestDate: "2026-07-28", criticality: 2, dependsNote: "depends on landlord response about blinds" }),
  base({ id: "h_walkthrough_prep", title: "Prepare landlord walkthrough/deposit checklist", category: "housing", effort: 1, urgency: 3, due: "Jul 27", dueDate: "2026-07-27", dueEnd: "2026-07-27", criticalPath: true, availableFrom: "2026-07-24", targetDate: "2026-07-27", latestDate: "2026-07-27", criticality: 3 }),
  base({ id: "h_walkthrough", title: "Landlord walkthrough", category: "housing", effort: 1, urgency: 3, due: "Jul 27", dueDate: "2026-07-27", exactDate: "2026-07-27", criticalPath: true, availableFrom: "2026-07-27", targetDate: "2026-07-27", latestDate: "2026-07-27", criticality: 3 }),
  base({ id: "h_restore_blinds", title: "Restore vertical blinds/remove curtains as instructed", category: "housing", effort: 2, urgency: 2, due: "Jul 29", dueDate: "2026-07-29", dueEnd: "2026-07-30", availableFrom: null, targetDate: "2026-07-29", latestDate: "2026-07-30", criticality: 3, dependsNote: "after landlord walkthrough response" }),
  base({ id: "h_fill_holes", title: "Fill curtain-rod and other wall holes", category: "housing", effort: 2, urgency: 2, due: "Jul 30", dueDate: "2026-07-30", dueEnd: "2026-07-31", availableFrom: null, targetDate: "2026-07-30", latestDate: "2026-07-31", criticality: 3, dependsNote: "after curtain rods removed" }),
  base({ id: "h_moveout_clean", title: "Complete move-out cleaning", category: "housing", effort: 3, urgency: 2, due: "Jul 30", dueDate: "2026-07-30", dueEnd: "2026-07-31", availableFrom: "2026-07-28", targetDate: "2026-07-30", latestDate: "2026-07-31", criticality: 3 }),
  base({ id: "h_empty_fridge", title: "Empty refrigerator/freezer", category: "housing", effort: 1, urgency: 2, due: "Jul 30", dueDate: "2026-07-30", dueEnd: "2026-07-31", availableFrom: "2026-07-28", targetDate: "2026-07-30", latestDate: "2026-07-31", criticality: 3 }),
  base({ id: "h_final_trash", title: "Remove final trash/donations", category: "housing", effort: 2, urgency: 2, due: "Jul 30", dueDate: "2026-07-30", dueEnd: "2026-07-31", availableFrom: "2026-07-28", targetDate: "2026-07-30", latestDate: "2026-07-31", criticality: 3 }),
  base({ id: "h_photo_condition", title: "Photograph apartment condition for deposit", category: "housing", effort: 1, urgency: 2, due: "Jul 30", dueDate: "2026-07-30", dueEnd: "2026-07-31", availableFrom: null, targetDate: "2026-07-30", latestDate: "2026-07-31", criticality: 3, dependsNote: "after move-out cleaning" }),
  base({ id: "h_key_handover", title: "Final key handover", category: "housing", effort: 1, urgency: 3, due: "Jul 31", dueDate: "2026-07-31", exactDate: "2026-07-31", criticalPath: true, availableFrom: "2026-07-31", targetDate: "2026-07-31", latestDate: "2026-07-31", criticality: 3 }),
  base({ id: "h_forward_deposit_address", title: "Provide forwarding address for deposit", category: "housing", effort: 1, due: "Jul 31", dueDate: "2026-07-31", dueEnd: "2026-08-01", availableFrom: null, targetDate: "2026-07-31", latestDate: "2026-08-01", criticality: 2, dependsNote: "after receiving address confirmed" }),

  // Active job tracker only (score + dueDate) — no ghosted/withdrawn/closed/loss-cause
  ...JOB_TRACKER_TASKS,

  // Admin cutoff cards. §11 — a_wifi split into the 7-step Wi-Fi return chain (w_wifi_*);
  // work-exit (w_work_*) and travel (w_travel_*) chains added; other admin dates refined.
  base({ id: "a_wifi", title: "Locate Wi-Fi kit", category: "admin", effort: 1, urgency: 3, due: "Jul 15", dueDate: "2026-07-15", dueEnd: "2026-07-18", criticalPath: true, relief: "file", availableFrom: "2026-07-11", targetDate: "2026-07-15", latestDate: "2026-07-18", criticality: 3 }),
  base({ id: "w_wifi_zone", title: "Put Wi-Fi equipment in DO NOT PACK zone", category: "admin", effort: 1, urgency: 2, due: "Jul 15", dueDate: "2026-07-15", dueEnd: "2026-07-18", relief: "file", availableFrom: null, targetDate: "2026-07-15", latestDate: "2026-07-18", criticality: 3, dependsNote: "after locating Wi-Fi kit" }),
  base({ id: "w_wifi_serial", title: "Photograph Wi-Fi serial numbers", category: "admin", effort: 1, urgency: 2, due: "Jul 18", dueDate: "2026-07-18", dueEnd: "2026-07-20", relief: "file", availableFrom: null, targetDate: "2026-07-18", latestDate: "2026-07-20", criticality: 3, dependsNote: "after locating Wi-Fi kit" }),
  base({ id: "w_wifi_cutoff", title: "Schedule internet cutoff", category: "admin", effort: 1, urgency: 2, due: "Jul 20", dueDate: "2026-07-20", dueEnd: "2026-07-24", relief: "file", availableFrom: "2026-07-18", targetDate: "2026-07-20", latestDate: "2026-07-24", criticality: 3 }),
  base({ id: "w_wifi_return_method", title: "Confirm Wi-Fi return method/location", category: "admin", effort: 1, urgency: 2, due: "Jul 20", dueDate: "2026-07-20", dueEnd: "2026-07-24", relief: "file", availableFrom: "2026-07-18", targetDate: "2026-07-20", latestDate: "2026-07-24", criticality: 3 }),
  base({ id: "w_wifi_return", title: "Return Wi-Fi equipment", category: "admin", effort: 2, urgency: 3, due: "Jul 31", dueDate: "2026-07-31", dueEnd: "2026-07-31", criticalPath: true, relief: "file", availableFrom: "2026-07-30", targetDate: "2026-07-31", latestDate: "2026-07-31", criticality: 3 }),
  base({ id: "w_wifi_receipt", title: "Save Wi-Fi receipt/tracking", category: "admin", effort: 1, urgency: 2, due: "Jul 31", dueDate: "2026-07-31", dueEnd: "2026-07-31", relief: "file", availableFrom: null, targetDate: "2026-07-31", latestDate: "2026-07-31", criticality: 3, dependsNote: "same day as Wi-Fi return" }),
  base({ id: "w_work_gather", title: "Gather work laptop/charger/badge/accessories", category: "admin", effort: 1, urgency: 2, due: "Jul 20", dueDate: "2026-07-20", dueEnd: "2026-07-24", relief: "file", availableFrom: "2026-07-18", targetDate: "2026-07-20", latestDate: "2026-07-24", criticality: 3 }),
  base({ id: "w_work_return_process", title: "Confirm work-equipment return process", category: "admin", effort: 1, urgency: 2, due: "Jul 22", dueDate: "2026-07-22", dueEnd: "2026-07-25", relief: "file", availableFrom: "2026-07-18", targetDate: "2026-07-22", latestDate: "2026-07-25", criticality: 3 }),
  base({ id: "w_work_return", title: "Return work equipment", category: "admin", effort: 2, urgency: 2, due: "Jul 30", dueDate: "2026-07-30", dueEnd: "2026-07-31", relief: "file", availableFrom: "2026-07-29", targetDate: "2026-07-30", latestDate: "2026-07-31", criticality: 3 }),
  base({ id: "w_work_docs", title: "Save final pay/PTO/insurance/employment documents", category: "admin", effort: 1, due: "Jul 23", dueDate: "2026-07-23", dueEnd: "2026-07-30", relief: "file", availableFrom: "2026-07-18", targetDate: "2026-07-23", latestDate: "2026-07-30", criticality: 2 }),
  base({ id: "w_travel_reqs", title: "Verify airline luggage and pet requirements", category: "admin", effort: 1, urgency: 2, due: "Jul 20", dueDate: "2026-07-20", dueEnd: "2026-07-24", availableFrom: "2026-07-18", targetDate: "2026-07-20", latestDate: "2026-07-24", criticality: 3 }),
  base({ id: "w_travel_transport", title: "Arrange transportation to LAX", category: "admin", effort: 1, urgency: 2, due: "Jul 24", dueDate: "2026-07-24", dueEnd: "2026-07-28", availableFrom: "2026-07-20", targetDate: "2026-07-24", latestDate: "2026-07-28", criticality: 3 }),
  base({ id: "w_travel_checkin", title: "Airline check-in", category: "admin", effort: 1, urgency: 3, due: "Jul 30", dueDate: "2026-07-30", dueEnd: "2026-07-31", availableFrom: null, targetDate: "2026-07-30", latestDate: "2026-07-31", criticality: 3, dependsNote: "check-in window opens ~24h before flight; latest before airport" }),
  base({ id: "w_flight", title: "Flight — 3:20 PM departure", category: "admin", effort: 1, urgency: 3, due: "Jul 31, 3:20 PM", dueDate: "2026-07-31", exactDate: "2026-07-31", criticalPath: true, availableFrom: "2026-07-31", targetDate: "2026-07-31", latestDate: "2026-07-31", criticality: 3 }),
  base({ id: "a_utils", title: "Utilities cancel / transfer (electric + gas)", category: "admin", effort: 1, due: "Jul 22", dueDate: "2026-07-22", dueEnd: "2026-07-26", relief: "file", availableFrom: "2026-07-18", targetDate: "2026-07-22", latestDate: "2026-07-26", criticality: 3 }),
  base({ id: "a_insurance", title: "Renter's insurance transfer / cancel", category: "admin", effort: 1, due: "Jul 23", dueDate: "2026-07-23", dueEnd: "2026-07-27", relief: "file", availableFrom: "2026-07-20", targetDate: "2026-07-23", latestDate: "2026-07-27", criticality: 2 }),
  base({ id: "a_usps", title: "USPS forwarding once address exists", category: "admin", effort: 1, due: "After address", dueEnd: "2026-07-29", relief: "file", availableFrom: null, latestDate: "2026-07-29", criticality: 2, dependsNote: "after receiving address confirmed" }),
  base({ id: "a_bank", title: "Bank + credit-card address updates", category: "admin", effort: 1, due: "Jul 29", dueDate: "2026-07-29", dueEnd: "2026-07-31", relief: "file", availableFrom: null, targetDate: "2026-07-29", latestDate: "2026-07-31", criticality: 1, dependsNote: "after receiving address confirmed" }),
  base({ id: "a_cuny", title: "CUNY account + student-loan address", category: "admin", effort: 1, due: "Jul 29", dueDate: "2026-07-29", dueEnd: "2026-08-03", relief: "file", availableFrom: null, targetDate: "2026-07-29", latestDate: "2026-08-03", criticality: 2, dependsNote: "after receiving address confirmed" }),
  base({ id: "a_payout", title: "Final paycheck: PTO payout + insurance end / COBRA", category: "admin", effort: 1, due: "Jul 22", dueDate: "2026-07-22", dueEnd: "2026-07-25", relief: "file", availableFrom: "2026-07-18", targetDate: "2026-07-22", latestDate: "2026-07-25", criticality: 2 }),
  base({ id: "a_voter", title: "Voter registration (NYC)", category: "admin", effort: 1, urgency: 1, due: "Post-move", dueDate: "2026-08-01", status: "dismissed", relief: "file" }),

  // Existing Body Board tasks plus real additions — "Book" cards; Attend spawns when Shirley confirms.
  // §12 — dates refined from productivity structure doc. Weekend rule applied: Jul 12/26 (Sun) and
  // Jul 18/19/25 (Sat/Sun) office-contact targets shifted to the next Monday; async/physical tasks left as-is.
  base({ id: "t_brain", title: "Book: Psychiatry / med renewals", category: "health", effort: 2, urgency: 2, due: "Book by Jul 28", dueDate: "2026-07-28", zone: "brain", kind: "book" }),
  base({ id: "t_teeth", title: "Book: Dentist visit", category: "health", effort: 2, urgency: 1, due: "Jul 27", status: "dismissed", zone: "teeth", kind: "book", dueDate: "2026-07-27", dueEnd: "2026-07-29", availableFrom: "2026-07-24", targetDate: "2026-07-27", latestDate: "2026-07-29", criticality: 1, dependsNote: "do not deal while required move work is compressed" }),
  base({ id: "t_heart", title: "Book: Cardiology appointment", category: "health", effort: 2, urgency: 1, status: "pending", zone: "heart", kind: "book", due: "Jul 22", dueDate: "2026-07-22", dueEnd: "2026-07-27", availableFrom: "2026-07-18", targetDate: "2026-07-22", latestDate: "2026-07-27", criticality: 1 }),
  base({ id: "t_lymph", title: "Book: Rheumatology + deferred labs", category: "health", effort: 3, urgency: 2, due: "Jul 13", dueDate: "2026-07-13", dueEnd: "2026-07-16", zone: "lymph", kind: "book", availableFrom: "2026-07-11", targetDate: "2026-07-13", latestDate: "2026-07-16", criticality: 2 }),
  base({ id: "t_labs", title: "Complete deferred labs", category: "health", effort: 2, urgency: 2, due: "Jul 22", dueDate: "2026-07-22", dueEnd: "2026-07-28", zone: "lymph", availableFrom: null, targetDate: "2026-07-22", latestDate: "2026-07-28", criticality: 2, dependsNote: "after rheumatology/PCP orders" }),
  base({ id: "t_rheum_records", title: "Obtain rheumatology records/referral plan", category: "health", effort: 1, urgency: 2, due: "Jul 24", dueDate: "2026-07-24", dueEnd: "2026-07-29", zone: "lymph", availableFrom: null, targetDate: "2026-07-24", latestDate: "2026-07-29", criticality: 2, dependsNote: "after rheumatology office responds" }),
  base({ id: "t_skin", title: "Book: Dermatology appointment", category: "health", effort: 2, urgency: 1, status: "pending", zone: "skin", kind: "book", due: "Jul 24", dueDate: "2026-07-24", dueEnd: "2026-07-28", availableFrom: "2026-07-20", targetDate: "2026-07-24", latestDate: "2026-07-28", criticality: 1 }),
  base({ id: "t_obgyn", title: "Book: OB/GYN — IUD replacement", category: "health", effort: 3, urgency: 3, due: "Jul 13", dueDate: "2026-07-13", dueEnd: "2026-07-15", zone: "obgyn", kind: "book", availableFrom: "2026-07-11", targetDate: "2026-07-13", latestDate: "2026-07-15", criticality: 2 }),
  base({ id: "t_obgyn_attend", title: "Attend OB/GYN — IUD replacement", category: "health", effort: 3, urgency: 2, due: "After booking", dueDate: null, dueEnd: "2026-07-25", zone: "obgyn", availableFrom: null, latestDate: "2026-07-25", criticality: 2, dependsNote: "after OB/GYN booked" }),
  base({ id: "t_obgyn_contingency", title: "Obtain contingency plan if no pre-move OB/GYN appointment", category: "health", effort: 1, urgency: 2, due: "Jul 20", dueDate: "2026-07-20", dueEnd: "2026-07-22", zone: "obgyn", availableFrom: "2026-07-16", targetDate: "2026-07-20", latestDate: "2026-07-22", criticality: 2, dependsNote: "if no appointment secured before move" }),
  base({ id: "t_pcp", title: "Book: PCP — 90-day medication bridge", category: "health", effort: 2, urgency: 2, due: "Jul 13", dueDate: "2026-07-13", dueEnd: "2026-07-17", zone: "brain", kind: "book", availableFrom: "2026-07-11", targetDate: "2026-07-13", latestDate: "2026-07-17", criticality: 3 }),
  base({ id: "t_med_bridge", title: "Obtain medication bridge/refills", category: "health", effort: 1, urgency: 3, due: "Jul 24", dueDate: "2026-07-24", dueEnd: "2026-07-29", zone: "brain", availableFrom: null, targetDate: "2026-07-24", latestDate: "2026-07-29", criticality: 3, dependsNote: "after PCP approves bridge" }),
  base({ id: "a_pharmacy", title: "Pharmacy transfer + refills", category: "health", effort: 1, due: "Jul 24", dueDate: "2026-07-24", dueEnd: "2026-07-29", relief: "file", availableFrom: "2026-07-20", targetDate: "2026-07-24", latestDate: "2026-07-29", criticality: 3 }),
  base({ id: "a_records", title: "Medical records PDFs", category: "health", effort: 2, due: "Jul 23", dueDate: "2026-07-23", dueEnd: "2026-07-30", relief: "file", availableFrom: "2026-07-18", targetDate: "2026-07-23", latestDate: "2026-07-30", criticality: 2 }),

  // Stretchy travel-prep chain (one Book card — Shirley can book it; Attend stays cat-lane).
  // §13 — dates refined; "Book travel vet" target shifted off Sunday Jul 12 to Monday Jul 13 (weekend rule).
  base({ id: "c_vet_book", title: "Book: Stretchy's travel vet (meds + certificate)", category: "cat", effort: 2, urgency: 3, due: "Jul 13", dueDate: "2026-07-13", dueEnd: "2026-07-16", criticalPath: true, kind: "book", availableFrom: "2026-07-11", targetDate: "2026-07-13", latestDate: "2026-07-16", criticality: 3 }),
  base({ id: "c_vet_agenda", title: "Prepare vet agenda", category: "cat", effort: 1, urgency: 3, due: "Jul 20", dueDate: "2026-07-20", availableFrom: null, targetDate: "2026-07-20", latestDate: null, criticality: 3, dependsNote: "after vet booked; latest = day before the scheduled visit" }),
  base({ id: "c_vet_attend", title: "Attend Stretchy's travel vet visit", category: "cat", effort: 2, urgency: 3, due: "Jul 22–25", dueDate: "2026-07-22", dueEnd: "2026-07-25", criticalPath: true, availableFrom: "2026-07-22", targetDate: null, latestDate: "2026-07-25", criticality: 3 }),
  base({ id: "c_cert", title: "Get Stretchy's travel certificate", category: "cat", effort: 1, urgency: 2, due: "After vet", dueDate: "2026-07-25", criticalPath: true, targetDate: "2026-07-25", latestDate: "2026-07-25", criticality: 3, dependsNote: "after vet visit" }),
  base({ id: "c_vax_records", title: "Obtain rabies/vaccine records", category: "cat", effort: 1, urgency: 3, due: "After vet", dueDate: "2026-07-25", dueEnd: "2026-07-25", targetDate: "2026-07-25", latestDate: "2026-07-25", criticality: 3, dependsNote: "after vet visit" }),
  base({ id: "c_records", title: "Save Stretchy's vet records PDF", category: "cat", effort: 1, due: "After vet", dueDate: "2026-07-25", dueEnd: "2026-07-26", targetDate: "2026-07-25", latestDate: "2026-07-26", criticality: 2, dependsNote: "after vet visit" }),
  base({ id: "c_meds_run", title: "Pick up Stretchy's travel medications", category: "cat", effort: 1, urgency: 2, due: "Jul 25–26", dueDate: "2026-07-25", dueEnd: "2026-07-28", criticalPath: true, availableFrom: null, targetDate: "2026-07-25", latestDate: "2026-07-28", criticality: 3, dependsNote: "after vet visit" }),
  base({ id: "c_med_test", title: "Medication test run", category: "cat", effort: 2, urgency: 2, due: "Jul 27", dueDate: "2026-07-27", dueEnd: "2026-07-29", availableFrom: null, targetDate: "2026-07-27", latestDate: "2026-07-29", criticality: 3, dependsNote: "after medication pickup" }),
  base({ id: "c_med_reaction", title: "Record reaction/contact vet if needed", category: "cat", effort: 1, urgency: 2, due: "Jul 28", dueDate: "2026-07-28", dueEnd: "2026-07-30", availableFrom: null, targetDate: "2026-07-28", latestDate: "2026-07-30", criticality: 3, dependsNote: "after medication test run" }),
  base({ id: "c_carrier", title: "Leave carrier out for daily practice", category: "cat", effort: 1, due: "Daily through Jul 30", dueEnd: "2026-07-30", availableFrom: "2026-07-11", latestDate: "2026-07-30", criticality: 2 }),
  base({ id: "c_kit", title: "Pack Stretchy's plane-day kit", category: "cat", effort: 1, urgency: 3, due: "Jul 29", dueDate: "2026-07-29", dueEnd: "2026-07-30", criticalPath: true, availableFrom: "2026-07-27", targetDate: "2026-07-29", latestDate: "2026-07-30", criticality: 3 }),
  base({ id: "c_final_doc_check", title: "Final document check", category: "cat", effort: 1, urgency: 3, due: "Jul 30", dueDate: "2026-07-30", dueEnd: "2026-07-31", exactDate: "2026-07-30", availableFrom: "2026-07-30", targetDate: "2026-07-30", latestDate: "2026-07-31", criticality: 3 }),
  base({ id: "c_departure", title: "Carrier departure", category: "cat", effort: 2, urgency: 3, due: "Jul 31", dueDate: "2026-07-31", exactDate: "2026-07-31", criticalPath: true, availableFrom: "2026-07-31", targetDate: "2026-07-31", latestDate: "2026-07-31", criticality: 3 }),
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

/**
 * Pressure (Part F) is deadline loudness (urgency statuses/scores), never raw
 * backlog count. A large pile of distant low-criticality tasks stays quiet; a
 * single true FINAL CALL on real (non-self-target) criticality ≥ 2 work maxes
 * it out on its own, exactly like one genuinely late thing should feel.
 */
export function taskPressure(tasks, date = new Date()) {
  const open = (tasks || []).filter(isOpen);
  let maxScore = 0;
  let closingOrLouder = false;
  let genuineFinalCall = false;
  for (const task of open) {
    const status = taskStatus(task, date, tasks);
    if (status === "BLOCKED") continue; // excluded from actionable pressure — see ledger BLOCKED label instead
    const score = urgencyScore(task, date);
    if (score > maxScore) maxScore = score;
    if (status === "FINAL CALL" && (task.criticality || 1) >= 2 && !task.selfTarget) {
      genuineFinalCall = true;
    } else if (status === "FINAL CALL" || status === "CLOSING") {
      closingOrLouder = true;
    }
  }
  if (genuineFinalCall) return 3;
  if (maxScore >= 70 || closingOrLouder) return 2;
  if (maxScore >= 30) return 1;
  return 0;
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
