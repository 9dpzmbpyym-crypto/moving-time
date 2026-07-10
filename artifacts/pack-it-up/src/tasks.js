/* ============================================================
   TASK / URGENCY SCAFFOLD — data only, no systems yet.

   This file is the architectural hook for the future task engine
   (job tracker sync, prioritization, deadlines, save/load). For
   now it holds hand-written sample data so the UI shells in
   Screens.jsx have something real-shaped to render.

   A task:
   {
     id: string,
     title: string,
     category: "move" | "job" | "admin" | "health" | "cat",
     urgency: 1 | 2 | 3,
     due: string,
     status: "pending" | "active" | "done" | "dismissed",
     room: string | null,
     objectId: string | null,
     relief: "stamp" | "file" | "slide",
     jobId: string | null,
     zone: string | null,       // Body Board zone id
     needsInfo: boolean,        // Desk "Needs Info" stamp
   }
   ============================================================ */

export const TASK_CATEGORIES = {
  move:   { label: "Move",       icon: "📦", color: "#C9942E" },
  job:    { label: "Job Apps",   icon: "💼", color: "#E4B4A8" },
  admin:  { label: "Admin",      icon: "🗂️", color: "#B9CEDC" },
  health: { label: "Health",     icon: "🩺", color: "#8FD14F" },
  cat:    { label: "Stretchy",   icon: "🐈", color: "#E8944A" },
};

export const INITIAL_TASKS = [
  { id: "t_van",     title: "Book the moving van",              category: "move",   urgency: 2, due: "Move day −6", status: "pending", room: null,      objectId: null, relief: "stamp", jobId: null, zone: null, needsInfo: false },
  { id: "t_bedroom", title: "Finish clearing the bedroom",      category: "move",   urgency: 1, due: "This week",   status: "pending", room: "bedroom", objectId: null, relief: "slide", jobId: null, zone: null, needsInfo: false },
  { id: "t_job1",    title: "Apply: Program Coordinator",       category: "job",    urgency: 3, due: "Fri",         status: "pending", room: null,      objectId: null, relief: "stamp", jobId: "job_cuny", zone: null, needsInfo: false },
  { id: "t_job2",    title: "Apply: Patient Care Associate",    category: "job",    urgency: 2, due: "Next week",   status: "pending", room: null,      objectId: null, relief: "stamp", jobId: "job_hh", zone: null, needsInfo: false },
  { id: "t_job3",    title: "Follow up: Office Assistant",      category: "job",    urgency: 1, due: "Sitting 9d",  status: "pending", room: null,      objectId: null, relief: "stamp", jobId: "job_nys", zone: null, needsInfo: false },
  { id: "t_id",      title: "Update ID before the move",        category: "admin",  urgency: 2, due: "Move day −3", status: "pending", room: null,      objectId: null, relief: "file",  jobId: null, zone: null, needsInfo: false },
  { id: "t_brain",   title: "Psychiatry / med renewals",        category: "health", urgency: 2, due: "This month",  status: "pending", room: null,      objectId: null, relief: "slide", jobId: null, zone: "brain", needsInfo: false },
  { id: "t_teeth",   title: "Dentist visit",                    category: "health", urgency: 1, due: "This month",  status: "pending", room: null,      objectId: null, relief: "slide", jobId: null, zone: "teeth", needsInfo: false },
  { id: "t_heart",   title: "Cardiology appointment",           category: "health", urgency: 2, due: "This month",  status: "pending", room: null,      objectId: null, relief: "slide", jobId: null, zone: "heart", needsInfo: false },
  { id: "t_lymph",   title: "Rheumatology appointment",         category: "health", urgency: 3, due: "This month",  status: "pending", room: null,      objectId: null, relief: "slide", jobId: null, zone: "lymph", needsInfo: false },
  { id: "t_stomach", title: "Diet — gentle, steady",            category: "health", urgency: 1, due: "Ongoing",     status: "pending", room: null,      objectId: null, relief: "slide", jobId: null, zone: "stomach", needsInfo: false },
  { id: "t_skin",    title: "Dermatology appointment",          category: "health", urgency: 1, due: "This month",  status: "pending", room: null,      objectId: null, relief: "slide", jobId: null, zone: "skin", needsInfo: false },
  { id: "t_nerves",  title: "Self-care + healthy habits",       category: "health", urgency: 2, due: "This week",   status: "pending", room: null,      objectId: null, relief: "slide", jobId: null, zone: "nerves", needsInfo: false },
  { id: "t_vet",     title: "Stretchy: vet visit (meds + cert)", category: "cat",   urgency: 1, due: "Mid-month",   status: "pending", room: null,      objectId: null, relief: "slide", jobId: null, zone: null, needsInfo: false },
];

export const SAMPLE_JOBS = {
  job_cuny: {
    title: "Program Coordinator",
    org: "CUNY — Hunter College",
    location: "Manhattan, NY",
    salary: "$58k–$65k",
    deadline: "Fri Jul 11",
    status: "not started",
    priority: 92,
    url: "#",
    notes: "Tuition waiver benefit. Strong fit.",
    nextAction: "Tailor resume + submit",
  },
  job_hh: {
    title: "Patient Care Associate",
    org: "NYC Health + Hospitals",
    location: "Queens, NY",
    salary: "$47k–$52k",
    deadline: "Jul 18",
    status: "drafting",
    priority: 81,
    url: "#",
    notes: "Union role, good benefits.",
    nextAction: "Finish cover letter",
  },
  job_nys: {
    title: "Office Assistant 2",
    org: "NY State — DOH",
    location: "Remote / Albany",
    salary: "$42k",
    deadline: "rolling",
    status: "submitted",
    priority: 64,
    url: "#",
    notes: "Applied 9 days ago.",
    nextAction: "Send follow-up email",
  },
};

export const isOpen = (t) => t.status === "pending" || t.status === "active";

export function taskPressure(tasks) {
  const load = tasks.filter(isOpen).reduce((s, t) => s + t.urgency, 0);
  if (load === 0) return 0;
  if (load <= 5) return 1;
  if (load <= 11) return 2;
  return 3;
}

export const PRESSURE_LABELS = ["All clear", "Manageable", "Piling up", "Getting loud"];
export const PRESSURE_COLORS = ["#5D7C3B", "#C9942E", "#C9942E", "#C43B34"];
