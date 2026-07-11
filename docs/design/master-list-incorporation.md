# Master-list incorporation — seed data, NPC casting, and the one new structure
**Owner:** [Claude / Fable 5] · companion to `move-spine-integration.md`.
**Source of truth for items:** `docs/move-spine/master/MASTER_REAL_WORLD_GOALS_JULY_2026.md` (gap-diffed against game data Jul 11).

## Finding

The game's task data is largely fictional while the real move is largely absent: SAMPLE_JOBS are three invented placeholder jobs; `t_van`/`t_id` are generic; the sublet lane doesn't exist; ~35 of ~45 concrete master-list items have no game presence. Nothing *contradicts* (move date Jul 31 is correct in `receptionist.js:6` and `BedroomSlice.jsx:69`) — the gap is pure missing content. So incorporation is **one data drop + one small engine**, not new screens.

## Seed-task manifest (transcribe into `tasks.js` — [cursor/codex], mechanical)

Effort: 1 tiny · 2 medium · 3 heavy. Categories reuse existing ones (`move/job/admin/health`); `housing` is new.

**Packing / U-Box (category `move`)**
| id | title | effort | due |
|---|---|---|---|
| m_lock | Buy U-Box lock (verify hasp fit) | 1 | Jul 26 |
| m_labels | Label boxes: U-BOX / PLANE / SUBLET / DO NOT PACK / SELL / TRASH | 1 | Jul 26 |
| m_photos_val | Photograph valuables before packing | 1 | Jul 26 |
| m_stage | Stage heavy boxes near loading path | 2 | Jul 26 |
| m_fragile | Wrap framed art + fragiles | 2 | Jul 26 |
| m_furn_decide | Decide which furniture rides the U-Box | 2 | Jul 26 |
| m_load1 | U-Box day: load heavy/boring/low-theft first | 3 | Jul 27 |
| m_load_main | Main loading days | 3 | Jul 28–29 |
| m_sell_final | Final sell/free/donate calls | 2 | Jul 29 |
| m_photo_lock | Photograph packed interior + lock placement | 1 | Jul 30 |
| m_lock_final | Lock the U-Box — packed by tonight | 1 | Jul 30 |
| m_sweep | Final sweep — flight day, no packing | 2 | Jul 31 |

*(`t_van` → retitle to real terms or retire; physical pack/sell/donate of belongings stays on apartment objects — no duplicate tasks.)*

**Sublet / Housing (new category `housing`)**
| id | title | effort | due |
|---|---|---|---|
| h_lock | Lock the Aug 1 sublet | 3 | Jul 15 |
| h_followups | Follow up warm replies (24–48h) | 1 | daily |
| h_widen | If not locked by Jul 15: widen (furnished room, month-to-month, friends) | 2 | Jul 15+ |
| h_comfort_box | Sublet comfort box — ship only once address confirmed | 1 | conditional |

*Daily 10+5 message quota = **session meter**, not tasks (designed in v2). Lead tracking (neighborhood/price/cat/status) stays **external** — building a lead CRM in a pixel game four days before the deadline can't ship in time to matter. The ledger page may list leads statically later.*

**Jobs (category `job`) — replace all three fictional SAMPLE_JOBS with the real shortlist**
| id | title | due |
|---|---|---|
| j_hunter | Administrative Coordinator, Business Office — Hunter/CUNY | Jul 14 |
| j_hopwa1 / j_hopwa2 | HOPWA Program Analyst (both seats) | Jul 18 |
| j_mocs | MOCS Project Manager | Jul 26 |
| j_mopt | MOPT Outreach Coordinator | Jul 28 |
| j_labor | Labor Relations Associate, H+H (backburner) | Aug 30 |

*Applied-already (HPD Jul 19-applied, DYCD) enter as `waiting` once the lifecycle enum lands. The 33/20/18 tracker snapshot is background, not gameplay. CUNY-schedule screening = Vivian's judgment lane + the Needs Info stamp — not data.*

**Admin (category `admin`)**
| id | title | effort | due |
|---|---|---|---|
| a_wifi | Wi-Fi return: locate kit, photo serials, schedule cancel, confirm method, keep receipt | 2 | before Jul 30 |
| a_utils | Utilities cancel/transfer (electric/gas) | 1 | cutoff |
| a_insurance | Renter's insurance transfer/cancel | 1 | cutoff |
| a_usps | USPS forwarding (once address exists) | 1 | conditional |
| a_bank | Bank/CC address updates | 1 | before move |
| a_cuny | CUNY account + student-loan address | 1 | before move |
| a_pharmacy | Pharmacy transfer + refills | 1 | before move |
| a_records | Medical + vet records PDFs | 2 | before move |
| a_payout | Final paycheck: PTO payout + insurance end date / COBRA | 1 | move day |
| a_voter | Voter registration (NYC) | 1 | post-move (deferred card) |

**Health (category `health`) — additions/corrections to existing zones**
| id | title | effort | due |
|---|---|---|---|
| t_obgyn | OB/GYN — IUD replacement | 3 | try by Jul 25 |
| t_pcp | PCP — 90-day med bridge | 2 | before move |
| (t_lymph) | + note: deferred labs ride this task | — | — |
| (t_vet) | correct due: **Jul 22–25 window**, not "Mid-month" | — | — |

*Zone mapping: no reproductive-health zone exists in `ZONE_SHORT` — map `t_obgyn` to the nearest existing torso zone for v1; a dedicated zone overlay is Body Board art, deferred. Vision stays absent (opportunistic tier, never nudged).*

**Stretchy chain (category `health`, cat-tagged — feeds the ticketed Stretchy states)**
c_vet_book (1) → c_vet_attend (2, Jul 22–25) → c_cert (1) → c_records (1) → c_meds_run (1) → c_carrier (1, daily-ish) → c_kit (1, Jul 30). *Vet agenda specifics (gabapentin history, Cerenia, food/water timing) are **Shirley call-script facts**, not tasks.*

**Carry-on / DO NOT PACK** — not tasks: the `noPack` item flag set (designed in v2) + one flight-day checklist card (`m_sweep` covers the sweep).

## NPC casting (who owns which lane)

| Lane | Voice | Notes |
|---|---|---|
| Health + Stretchy | **Shirley** (live) | Her remit grows by data only — OB/GYN, PCP bridge, labs, the vet chain all book through her existing FSM. No new code. |
| Packing / U-Box / Admin-move | **Sal** (Pass 4) | The escalation ladder (Jul 25 staging → Jul 30 lock) is his entire personality. Also guards DO NOT PACK ("tell me the router isn't in a box") and the sell/donate cutoff. |
| Jobs | **Vivian** (Pass 5) | Needs the real shortlist + lifecycle enum before she has anything true to say. Follow-up timing + CUNY-conflict screening are her judgment calls. |
| Sublet / Housing | **nobody, deliberately** | Desk-owned meter + cards. If it ever gets a voice it's Sal (dispatch owns both ends of a move) — but the Jul 15 lock date will likely resolve before Pass 4 ships. Don't build a voice for a lane that expires. |
| Admin (non-move) | **nobody** | Desk trays + stamps. Paperwork shouldn't talk. |

Global trigger rules stand unchanged: one call per session, one ask per call, priority order per `NPC_TRIGGER_RULES.md`.

## The one new structure: the calendar spine

Everything above fits existing structures (tasks, trays, meters, FSM) **except** one thing nothing currently models: *the move has phases and date-triggered behavior.* Phase emphasis on the board, Sal's escalation ladder, flight-day mode ("no packing, sweep only"), sell-cutoff messaging — all read from the same table.

Ruling: **one small pure-data module** (`movePhase.js`-shaped, lives beside `receptionist.js`): a `PHASES` table (pack-first → mid-month → U-Box week → load days → lock night → flight day) + a date-trigger list, with helpers `currentPhase(date)` / `dueTriggers(date)`. No screen, no loop, no state — callers ask it questions. The board, the NPCs, and the HUD's "next: U-Box Jul 27" line all consume it. This is the only new game structure the master list requires; everything else is content.

## The calendar prop (Eloisa, Jul 11)

The calendar spine gets a physical body: a **wall calendar sprite above the oven** in the kitchen. Like the bathroom mirror, it's a portal object — never packable, tap → full-screen overlay.

**The overlay:** one paper month page (July 2026), pinned curl at the top, in the walnut/parchment family. **Stretchy is the pin-up** — a tiny cat-of-the-month photo header (July: Stretchy sitting in a box). Key dates marked in ink, straight from the spine's `PHASES`/trigger table — never hand-duplicated: sublet **15** circled · vet window **22–25** bracketed · U-Box **27** · load **28–29** · lock **30** · flight **31** starred with a little plane. Days already past get pencil X's (the crossing-off is the dopamine); today gets the red circle. Tap a marked date → one-line note strip ("U-Box arrives"). Read-only v1 — it's a calendar, not a form. SOFT later: flip to August (sublet start Aug 1).

Sprite: small flip-calendar, ~8–12 px wide, above the oven ([cursor] places via `layout.json`); overlay is a new `calendar` screen in `Screens.jsx`, procedural v1 (no plate PNG needed — paper grid + ink marks draw fine in canvas/inline styles).

## Order of operations

1. **Seed data drop** (this manifest → `tasks.js` + `save.js` merge defaults) — [cursor/codex], mechanical, do **before or with** the board skeleton: a dispatch with fictional data teaches distrust on day one.
2. Calendar spine module — small, with the drop.
3. Board skeleton (P1c) consumes both.
4. Sal/Vivian passes inherit their lanes' data for free.
