Use the local Vite app as the laptop development version and keep the existing Vercel URL as the phone-browser canon. Do not create a second permanent Vercel project. Work on a feature branch locally; use a temporary Vercel Preview only when phone testing is necessary. Preview deployments use a different origin, so their browser storage stays separate from the production phone save.

Only merge to main after the session is finished, the production build passes, and the save migration has been tested. The repo already has a local Vite development command and a single production Vercel configuration.

The current save is versioned and uses the stable pack-it-up-save localStorage key. The migration must be extended rather than wiping or replacing that key.

Copy this to Grok:

You are the only active implementation agent for Pack It Up right now.
This is a substantial task-system and scheduling pass. Inspect the current repo before editing. Do not assume this prompt describes the current implementation perfectly. Preserve working systems and implement only the delta.
Repository:
9dpzmbpyym-crypto/moving-time
Main app:
artifacts/pack-it-up
Important current files:
- artifacts/pack-it-up/src/tasks.js
- artifacts/pack-it-up/src/session.js
- artifacts/pack-it-up/src/save.js
- artifacts/pack-it-up/src/Screens.jsx
- artifacts/pack-it-up/src/BedroomSlice.jsx
- artifacts/pack-it-up/src/movePhase.js
- docs/move-spine/master/MASTER_REAL_WORLD_GOALS_JULY_2026.md
- FINISH_PLAN.md
Do not broadly refactor the apartment, audio, Shirley, room rendering, or unrelated game systems.
============================================================
1. DEVELOPMENT AND PRODUCTION WORKFLOW
============================================================
The source-of-truth player version is the phone-browser production deployment.
Use this workflow:
- `main` is production and deploys to the canonical Vercel phone URL.
- Do not work directly on `main` during the session.
- Create and work on a feature branch, for example:
  `grok/task-scheduler`
- Develop primarily through the local Vite version on the laptop.
- Use:
  `pnpm --filter @workspace/pack-it-up dev`
- Do not create a second permanent Vercel project.
- A temporary branch Preview deployment is allowed for phone-size testing before release.
- Do not merge or push this work to production until Eloisa explicitly says the session is finished.
- Before production merge:
  1. typecheck
  2. production build
  3. local smoke test
  4. old-save migration test
  5. phone-layout check
  6. report the exact migration and files changed
Production phone save protection is mandatory.
Current production save key:
`pack-it-up-save`
Rules:
- Never change the production save key.
- Never automatically call `clearSave()`.
- Never make a schema bump that wipes progress.
- Increment `SAVE_VERSION` only with an explicit, idempotent migration.
- Preserve:
  - packed/sold/donated object state
  - storage contents state
  - task completion and archived state
  - user-edited task notes and dates where appropriate
  - appointments
  - coins
  - minutes
  - room
  - daily session state
  - the selected daily hand
- Before rewriting a save during migration, retain the original raw payload under a backup key such as:
  `pack-it-up-save-pre-migration`
- If migration fails, do not overwrite the original save.
- Add a small Settings utility to export/copy the save JSON and restore an exported save.
- Validate imported JSON before replacing production data.
A Vercel Preview has separate localStorage from the production URL. Do not attempt to copy Preview progress into production automatically.
============================================================
2. CURRENT SYSTEMS TO PRESERVE
============================================================
The repo already has:
- real move, housing, job, admin, health and Stretchy task lanes
- active job-tracker cards and job scores
- selfTarget metadata for some jobs
- Command Board
- full ledger
- ledger editing and archiving
- effort values
- daily energy selection:
  - fumes
  - steady
  - full
- daily sublet outreach behavior
- appointment Book → Attend behavior
- date-aware critical-path scoring
- save migration and task merging
Do not create parallel task, board, save, or session systems.
Modify the existing architecture.
============================================================
3. CORE TASK MODEL
============================================================
Replace the overloaded current due-date model with these explicit fields:
```js
{
  availableFrom: "2026-07-11" | null,
  targetDate: "2026-07-15" | null,
  latestDate: "2026-07-20" | null,
  exactDate: "2026-07-27" | null,
  effort: 1 | 2 | 3,
  criticality: 1 | 2 | 3,
  dependencies: ["task_id"],
  blocks: ["task_id"],
  recurrence: null | "daily",
  completionMode: "manual" | "object-pack" | "object-sell" |
                  "appointment" | "decision" | "checklist",
  sourceLocation: null | "death_closet" | "bedroom" | etc.,
  objectId: null | string,
  selfTarget: boolean,
  estimatedLatest: boolean,
  checklist: [],
  nextTaskOnComplete: null | string,
  branchOptions: null | [...]
}

Definitions:

* availableFrom: first date the task may appear.
* targetDate: preferred completion date.
* The task becomes OVERDUE the day after targetDate.
* latestDate: final safe boundary.
* Pressure grows sharply between Target and Latest.
* After Latest, the task is a schedule breach/final-call task.
* exactDate: event must occur on this date. Do not deal it early as actionable.
* effort: time/energy cost.
* criticality: consequence of not completing it.

Criticality:

* 1 = optional or safe to defer
* 2 = necessary but flexible
* 3 = non-negotiable external consequence

Examples:

* returning Wi-Fi equipment can be effort 1–2 but criticality 3
* an optional job application can be effort 3 but criticality 1
* flight, U-Box lock night and key handover are criticality 3

Urgency must be calculated. Do not store a user-facing static urgency value as the main source of truth.

Legacy fields may remain temporarily for compatibility, but new scheduling logic must use the new fields.

============================================================
4. DATE AND URGENCY BEHAVIOR

Task state:

function taskScheduleStatus(task, today) {
  if (task.status === "done") return "done";
  if (task.status === "archived") return "archived";
  if (task.availableFrom && today < task.availableFrom) return "not-available";
  if (!dependenciesComplete(task)) return "blocked";
  if (task.exactDate && today < task.exactDate) return "scheduled";
  if (task.latestDate && today > task.latestDate) return "past-latest";
  if (task.targetDate && today > task.targetDate) return "overdue";
  if (task.targetDate && today === task.targetDate) return "due";
  return "available";
}

Important:

* Target passed means overdue.
* Latest passed means the safe window was missed.
* Exact-date events should appear on calendars/critical strips before their date but should not count as actionable daily cards until appropriate preparation time or the exact date.

Implement a 0–100 urgency score.

Use this behavior:

Before Target:

* gentle linear rise as Target approaches

On Target:

* clearly due

After Target through Latest:

* immediately marked OVERDUE
* quadratic pressure growth
* increasingly likely to become bound

After Latest:

* final-call/schedule-breach state
* maximum pressure

Suggested calculation:

function urgencyScore(task, today) {
  const criticalityBonus = {
    1: 0,
    2: 10,
    3: 20,
  }[task.criticality || 1];
  let timePressure = 0;
  if (task.exactDate && today < task.exactDate) {
    const delta = daysBetween(today, task.exactDate);
    timePressure = delta <= 1 ? 45 : delta <= 3 ? 25 : 5;
  } else if (!task.targetDate) {
    timePressure = 10;
  } else if (today < task.targetDate) {
    const start = task.availableFrom || today;
    const totalLead = Math.max(1, daysBetween(start, task.targetDate));
    const elapsed = Math.max(0, daysBetween(start, today));
    const progress = Math.min(1, elapsed / totalLead);
    timePressure = 10 + 20 * progress;
  } else if (today === task.targetDate) {
    timePressure = 35;
  } else if (!task.latestDate || today <= task.latestDate) {
    const grace = Math.max(
      1,
      daysBetween(task.targetDate, task.latestDate || task.targetDate)
    );
    const overdue = Math.max(1, daysBetween(task.targetDate, today));
    const progress = Math.min(1, overdue / grace);
    timePressure = 35 + 50 * progress * progress;
  } else {
    const past = daysBetween(task.latestDate, today);
    timePressure = 95 + Math.min(5, past * 2);
  }
  const dependencyBonus = task.blocks?.length ? 10 : 0;
  return Math.min(
    100,
    Math.round(timePressure + criticalityBonus + dependencyBonus)
  );
}

Visual categories:

* 0–29: Available
* 30–49: Due soon
* 50–69: Overdue
* 70–89: Closing window
* 90–100: Final call

The text badge must say OVERDUE immediately after Target even when the score is only in the 50s.

============================================================
5. DAILY CARD-DEAL SYSTEM

The Ledger is the complete deck.

The Command Board is today’s hand.

The daily hand must be persistent for the local calendar day. Closing or reopening the app must not redeal it.

The first time the player opens the Board each day:

1. Ask energy:
    * Fumes
    * Steady
    * Full steam
2. Calculate the minimum required plan.
3. Preselect all bound cards.
4. Deal eligible flexible cards.
5. Let the player choose enough cards/effort to reach the selected plan.

Do not use a fixed card count.

The scheduler calculates:

* minimum effort and minimum card count
* steady effort and steady card count
* suggested maximum effort and card count

Energy definitions:

FUMES

* The absolute minimum work required today to keep Criticality-2 and Criticality-3 commitments feasible.
* It is not always 3 points.
* It may be 7 or 10 points on a genuinely fixed move day.
* Do not present a fake easy option when deadlines make it impossible.

STEADY

* Includes the Fumes floor.
* Attempts to finish work around Target dates rather than Latest dates.
* Normal soft budget is approximately 6 effort points.
* It may exceed 6 when the minimum required plan already exceeds 6.

FULL STEAM

* Includes Steady.
* Pulls forward useful tasks from the next three days to reduce future congestion.
* Normal soft budget is approximately 9 effort points.
* Do not add meaningless filler tasks merely to hit 9.

Current static budgets may remain as soft defaults:

* fumes: 3
* steady: 6
* full: 9

They are not hard caps.

⸻

5A. BOUND CARD RULES

A task is bound today when:

1. It is an exact-date event today.
2. Latest is today or has passed.
3. It is a Criticality-3 recurring task due today.
4. The backward scheduler finds that postponing it makes a deadline infeasible.
5. It unlocks another approaching Criticality-3 task and no slack remains.
6. It was selected into today’s hand earlier and has not been completed or intentionally rescheduled.

Bound cards:

* are preselected
* cannot be discarded
* consume effort
* visually show a LOCKED or BOUND stamp

When bound work exceeds the normal Fumes baseline, display:

“fixed day. these cards are already spoken for.”

Do not say “choose two” when three or more tasks are non-negotiable.

⸻

5B. MINIMUM BACKWARD SCHEDULER

Build a whole-card backward scheduler.

Input:

* unfinished Criticality-2 and Criticality-3 tasks
* available windows
* dependencies
* exact-date reservations
* effort values
* recurrence instances
* today through July 31

Baseline future Fumes capacity:
3 effort points per ordinary day

Process:

1. Pre-place exact-date events.
2. Expand required recurring task instances.
3. Sort required tasks by Latest.
4. Starting from Latest, place each whole task on the latest feasible date.
5. Respect availability and dependencies.
6. If future dates cannot absorb the task, it must be placed today.
7. Today’s assigned tasks become the Fumes minimum.

Do not split one card’s effort across days unless the task is explicitly defined as a multi-stage/checklist task.

Pseudocode:

function buildMinimumSchedule(tasks, today, horizon) {
  const calendar = makeCalendar(today, horizon, {
    defaultCapacity: 3,
  });
  prePlaceExactDateTasks(calendar, tasks);
  prePlaceRequiredRecurringInstances(calendar, tasks);
  const required = tasks
    .filter(isOpen)
    .filter(t => (t.criticality || 1) >= 2)
    .sort((a, b) =>
      compareDatesDesc(a.latestDate, b.latestDate)
    );
  for (const task of required) {
    placeWholeCardAsLateAsPossible(calendar, task, {
      earliest: maxDate(today, task.availableFrom),
      latest: task.latestDate,
      respectDependencies: true,
    });
  }
  return calendar;
}

⸻

5C. STEADY PLAN

Create a target-based schedule.

* Include every Fumes task.
* Prefer completion by Target.
* Add overdue tasks by urgency score.
* Spread tasks so Target days do not become overloaded.
* Respect lane variety where practical.
* Do not prioritize an optional job over Criticality-3 move/housing/health work.

⸻

5D. FULL-STEAM PLAN

Start with Steady.

Look ahead three days.

Pull work forward when:

* an upcoming day is overloaded
* the task is already available
* dependencies are complete
* early completion reduces schedule compression
* it is not a daily card that will simply regenerate

Stop when:

* future days are reasonably balanced
* no useful eligible card remains
* the normal total reaches about 9 points
* or the day is already above 9 due to bound work

⸻

5E. DEAL SIZE

The deal contains:

* all bound cards
* enough eligible cards to represent the Full-steam plan
* up to two meaningful alternatives

Suggested:

dealCount = Math.min(
  9,
  boundCount + flexibleCardsNeededForFullPlan + 2
);

If bound cards exceed nine:

* show all required cards in a scrollable required stack
* do not hide obligations

No unlimited redealing.

The player may edit/archive tasks in the Ledger, but the Board should not allow free rerolls to escape required work.

============================================================
6. RECURRING CARDS

Create dated daily instances or an equivalent persisted daily state.

Do not inflate the board with several cards for one workflow.

Use:

1. SUBLET OUTREACH BATCH
    * checklist:
        * 10 serious messages
        * 5 backup messages
        * follow up warm replies
        * update lead tracker
    * available: daily
    * target: same day
    * latest: same day
    * effort: 2
    * criticality: 3
    * ends when housing is locked
2. FACEBOOK MARKETPLACE INBOX
    * title: “Clear Facebook Marketplace messages”
    * checklist:
        * answer every active inquiry
        * send requested dimensions
        * confirm availability
        * identify serious buyer
        * schedule pickup when ready
    * available: daily
    * target: same day
    * latest: next day
    * effort: 1
    * criticality: 2
    * ends when all sellable furniture is resolved
3. STRETCHY CARRIER PRACTICE
    * daily lightweight habit
    * effort: 1
    * criticality: 2
    * latest: next day
    * end Jul 30
    * this may remain a meter/habit rather than consume a full card every day unless it becomes overdue

============================================================
7. FURNITURE SALE STATE MACHINE

All furniture listings have already been posted.

Do not create “post listing” cards.

Each sellable furniture item begins with:

find buyer
  → pickup scheduled
  → complete sale/removal

“Find buyer” includes:

* responding to messages
* sending dimensions
* negotiating if appropriate
* confirming seriousness
* scheduling pickup

“Complete sale/removal” is not done until the item is physically gone.

Buyer is responsible for loading and transport.

When Find Buyer reaches Latest with no buyer:

* change or spawn:
    “Lower price / cross-post / Buy Nothing / donate fallback”
* do not silently complete the item
* keep the physical removal deadline

Use these windows:

Item/task	Available	Target	Latest	Effort	Criticality
Find buyer: outdoor furniture	Jul 11	Jul 12	Jul 14	1	2
Remove outdoor furniture	after buyer	Jul 15	Jul 17	2	3
Find buyer: dining table/chairs	Jul 11	Jul 12	Jul 14	1	2
Remove dining set	after buyer	Jul 16	Jul 18	2	3
Find buyer: entertainment center	Jul 12	Jul 14	Jul 17	1	2
Remove entertainment center	after buyer	Jul 19	Jul 22	2	3
Find buyer: coffee table	Jul 12	Jul 15	Jul 18	1	2
Remove coffee table	after buyer	Jul 20	Jul 23	2	3
Find buyer: shoe shelf	Jul 11	Jul 14	Jul 18	1	2
Remove shoe shelf	after buyer	Jul 22	Jul 25	1	3
Find buyer/donation home: kitchen metal shelves	Jul 11	Jul 15	Jul 19	1	2
Remove kitchen metal shelves	after decision	Jul 23	Jul 26	2	3
Find buyer: TV	Jul 18	Jul 22	Jul 25	1	2
Remove TV	after buyer	Jul 28	Jul 29	2	3
Find buyer: office desk and chair	Jul 18	Jul 20	Jul 23	1	2
Remove desk and chair	after buyer	Jul 27	Jul 28	2	3
Find buyer: sofa	Jul 18	Jul 20	Jul 24	1	2
Remove sofa	after buyer	Jul 27	Jul 29	2	3
Find buyer: dresser	Jul 20	Jul 21	Jul 24	1	2
Remove dresser	after buyer	Jul 27	Jul 29	2	3
Find buyer: bedside table	Jul 22	Jul 23	Jul 25	1	2
Remove bedside table	after buyer	Jul 28	Jul 29	1	3
Find buyer: AC unit	Jul 15	Jul 20	Jul 24	1	2
Remove AC unit	after buyer	Jul 28	Jul 30	2	3
Plan bed-frame/mattress disposal	Jul 11	Jul 18	Jul 22	2	3
Remove bed frame	Jul 28	Jul 29	Jul 30	2	3
Remove mattress	Jul 31	Jul 31 morning	before key handover	2	3

The dresser, sofa, desk/chair and bed are intentionally later because Eloisa still needs them.

Keep/sell decisions:

* floor lamp: likely keep
* bar cabinet: likely keep
* large rug: likely keep

Add:

* confirm keep/load for each
* available Jul 20
* target Jul 23
* latest Jul 25
* effort 1
* criticality 2

============================================================
8. STRETCHY FURNITURE DECISIONS

Add decision branches:

SCRATCHING POST

* “Decide: keep or donate Stretchy’s scratching post”
* available Jul 11
* target Jul 18
* latest Jul 23
* effort 1
* criticality 2

Keep branch:

* pack/load scratching post
* target Jul 25
* latest Jul 28
* effort 1
* criticality 2

Donate branch:

* donate scratching post
* target Jul 23
* latest Jul 26
* effort 1
* criticality 2

DISASSEMBLED CAT TREE IN DEATH CLOSET

* “Decide: bring or donate disassembled cat tree”
* available Jul 11
* target Jul 17
* latest Jul 21
* effort 1
* criticality 2
* sourceLocation: death_closet

Keep branch:

* pack/load cat tree
* target Jul 24
* latest Jul 28
* effort 2
* criticality 2

Donate branch:

* donate cat tree
* target Jul 22
* latest Jul 25
* effort 1
* criticality 2

Do not create a separate “clear death closet” task.

The death closet clears naturally as category tasks are completed.

Use sourceLocation: "death_closet" for items stored there.

Possible bedroom scratching-post sprite:

* Add an object/task integration hook.
* Do not invent or redraw a final sprite without an approved asset.
* If no approved sprite exists, leave a clear visual-asset TODO rather than creating inconsistent art.

============================================================
9. PACKING TASK WINDOWS

Do not auto-mark the books or existing packed electronics as done.

Eloisa wants to perform the existing Pack animation in the app so the app records the progress.

Link object packing to task/checklist completion where possible.

Replace broad packing cards with parent cards/checklists using these windows:

EARLY PACKING

Card	Available	Target	Latest	Effort	Criticality
Set up destination zones and box labels	Jul 11	Jul 11	Jul 13	1	2
Pack books and coffee-table books	Jul 11	Jul 11	Jul 15	2	2
Pack death-closet cords/electronics	Jul 11	Jul 11	Jul 15	2	2
Pack decor/vases/candles/knickknacks	Jul 11	Jul 12	Jul 15	2	2
Pack framed art and prints	Jul 11	Jul 13	Jul 16	2	2
Pack art/sewing/fabric supplies	Jul 11	Jul 13	Jul 16	2	2
Pack board games and gaming extras	Jul 11	Jul 12	Jul 16	1	2
Pack winter/off-season clothes	Jul 12	Jul 14	Jul 18	2	2
Pack extra linens/towels	Jul 12	Jul 14	Jul 18	1	2
Pack unused barware/glassware	Jul 12	Jul 14	Jul 19	2	2
Pack outdoor/garden items being kept	Jul 13	Jul 15	Jul 18	2	2
Pack remaining nonessential electronics	Jul 13	Jul 15	Jul 19	2	2

MID-MONTH

Card	Available	Target	Latest	Effort	Criticality
Pack bedroom and closet overflow	Jul 16	Jul 16	Jul 22	3	2
Pack vanity/makeup/nail extras	Jul 16	Jul 17	Jul 23	2	2
Pack bathroom backups	Jul 16	Jul 17	Jul 23	2	2
Pack office supplies/inactive papers	Jul 16	Jul 18	Jul 24	2	2
Triage documents into archive/carry/shred	Jul 16	Jul 18	Jul 22	2	3
Pack kitchen deep storage	Jul 17	Jul 19	Jul 23	3	2
Pack dining/bar cabinet contents	Jul 17	Jul 19	Jul 23	2	2
Pack living-room decor/electronics	Jul 18	Jul 20	Jul 24	2	2
Pack Stretchy’s nonessential belongings	Jul 19	Jul 21	Jul 25	1	2
Reduce bedroom to travel capsule	Jul 20	Jul 22	Jul 25	2	2
Reduce bathroom to daily kit	Jul 20	Jul 22	Jul 25	1	2
Establish PLANE and DO NOT PACK zones	Jul 18	Jul 22	Jul 24	1	3
Reduce kitchen to survival kit	Jul 20	Jul 23	Jul 25	2	2
Begin food drawdown	Jul 20	Jul 23	Jul 25	1	2
Prepare final-clean kit	Jul 20	Jul 23	Jul 26	1	2
Close office except active work kit	Jul 22	Jul 24	Jul 26	2	2
Stage sealed boxes by load order	Jul 22	Jul 24	Jul 26	2	3

U-BOX PREPARATION

Card	Available	Target	Latest	Effort	Criticality
Prepare kept furniture	Jul 23	Jul 25	Jul 26	3	3
Roll/protect rug and lamp	Jul 23	Jul 25	Jul 26	2	3
Secure guitar/amp/accessories	Jul 23	Jul 25	Jul 26	2	3
Buy U-Box lock and verify hasp fit	Jul 11	Jul 24	Jul 26	1	3
Photograph valuables before packing	Jul 11	Jul 24	Jul 26	1	2
Wrap remaining fragiles	Jul 11	Jul 24	Jul 26	2	2
Confirm U-Box delivery access/placement	Jul 20	Jul 23	Jul 26	1	3
Confirm unattended pickup instructions	Jul 20	Jul 24	Jul 30	1	3
Clear loading path	Jul 24	Jul 26	Jul 26	2	3
Create load map	Jul 24	Jul 26	Jul 26	1	3
Convert apartment to one-night mode	Jul 24	Jul 26	Jul 26	2	3

LOADING

Card	Exact/available	Target	Latest	Effort	Criticality
Receive and inspect U-Box	Jul 27 exact	Jul 27	Jul 27	1	3
Photograph empty interior	Jul 27	Jul 27	Jul 27	1	2
Load heavy/boring/low-theft items	Jul 27	Jul 27	Jul 27	3	3
Load kept furniture	Jul 27	Jul 27	Jul 28	3	3
Load bedroom and office boxes	Jul 27	Jul 28	Jul 28	3	3
Load living and dining boxes	Jul 27	Jul 28	Jul 29	3	3
Load kitchen and bathroom boxes	Jul 28	Jul 29	Jul 29	3	3
Load late-value storage items	Jul 29	Jul 29	Jul 30	2	3
Finish plane bags	Jul 27	Jul 29	Jul 30	2	3
Pack final apartment-use items	Jul 30	Jul 30	Jul 30	2	3
Complete final U-Box load	Jul 30	Jul 30	Jul 30	3	3
Photograph packed interior	Jul 30	Jul 30	Jul 30	1	3
Lock U-Box and photograph lock/placement	Jul 30	Jul 30	Jul 30	1	3

After the U-Box is locked:

* block ordinary Pack-to-U-Box actions
* only allow:
    * plane
    * return
    * donate/discard
    * cleaning
    * final sweep

============================================================
10. HOUSING AND APARTMENT-HANDOFF TASKS

Keep sublet tasks in Housing.

Move landlord, apartment handoff, cleaning and deposit-related work into Housing rather than further bloating Admin.

SUBLET

* Prepare proof-of-income/reference packet
    * Jul 11 / Jul 11 / Jul 12
    * effort 1, criticality 2
* Daily outreach batch
    * daily until housing locked
    * effort 2, criticality 3
* Qualify warm lead
    * available when reply received
    * target same day
    * latest 24h
    * effort 1, criticality 3
* Confirm exact dates and price
    * before payment
    * effort 1, criticality 3
* Confirm Stretchy approval in writing
    * before payment
    * effort 1, criticality 3
* Confirm possible Sept/Oct extension
    * before agreement
    * effort 1, criticality 2
* Complete video tour or trusted verification
    * within 48h of warm lead
    * effort 1, criticality 3
* Verify identity, agreement and payment method
    * before sending money
    * effort 1, criticality 3
* Lock Aug 1 sublet
    * available Jul 11
    * target Jul 15
    * latest Jul 20
    * effort 3, criticality 3
* Widen search
    * available Jul 15 only if not locked
    * target Jul 15
    * latest Jul 16
    * effort 2, criticality 3
* Secure temporary fallback
    * available Jul 16 if needed
    * target Jul 20
    * latest Jul 23
    * effort 2, criticality 3
* Finalize receiving address
    * available after housing lock
    * latest Jul 27
    * effort 1, criticality 3
* Finalize keys and midnight-arrival access
    * after housing lock
    * target within 48h
    * latest Jul 29
    * effort 1, criticality 3

LANDLORD / MOVE-OUT

* Ask whether vertical blinds must be restored
    * available Jul 11
    * target Jul 15
    * latest Jul 20
    * effort 1
    * criticality 3
* Locate vertical blinds and hardware
    * available Jul 11
    * target Jul 18
    * latest Jul 22
    * effort 1
    * criticality 2
* Decide curtains: take, donate or discard
    * available Jul 20
    * target Jul 25
    * latest Jul 28
    * effort 1
    * criticality 2
    * depends on landlord response
* Prepare landlord walkthrough/deposit checklist
    * available Jul 24
    * target Jul 26
    * latest Jul 27
    * effort 1
    * criticality 3
* Landlord walkthrough
    * exact Jul 27
    * effort 1
    * criticality 3

The walkthrough may generate new restoration cards. Support adding these without code changes.

* Restore vertical blinds/remove curtains as instructed
    * after landlord response/walkthrough
    * target Jul 29
    * latest Jul 30
    * effort 2
    * criticality 3
* Fill curtain-rod and other wall holes
    * after rods removed
    * target Jul 30
    * latest before key handover Jul 31
    * effort 2
    * criticality 3
* Complete move-out cleaning
    * available Jul 28
    * target Jul 30
    * latest before handover Jul 31
    * effort 3
    * criticality 3
* Empty refrigerator/freezer
    * Jul 28 / Jul 30 / Jul 31 before handover
    * effort 1
    * criticality 3
* Remove final trash/donations
    * Jul 28 / Jul 30 / Jul 31 before handover
    * effort 2
    * criticality 3
* Photograph apartment condition for deposit
    * available after cleaning
    * target Jul 30
    * latest before key handover
    * effort 1
    * criticality 3
* Final apartment sweep
    * exact Jul 31
    * before departure
    * effort 2
    * criticality 3
* Final key handover
    * exact Jul 31
    * effort 1
    * criticality 3
* Provide forwarding address for deposit
    * after address exists
    * target Jul 31
    * latest Aug 1
    * effort 1
    * criticality 2

============================================================
11. ADMIN, WORK EXIT AND TRAVEL

Split the current broad Wi-Fi card into a dependency chain:

1. Locate Wi-Fi kit
    * Jul 11 / Jul 15 / Jul 18
    * effort 1, criticality 3
2. Put Wi-Fi equipment in DO NOT PACK zone
    * after locating
    * target Jul 15
    * latest Jul 18
    * effort 1, criticality 3
3. Photograph serial numbers
    * after locating
    * target Jul 18
    * latest Jul 20
    * effort 1, criticality 3
4. Schedule internet cutoff
    * Jul 18 / Jul 20 / Jul 24
    * effort 1, criticality 3
5. Confirm return method/location
    * Jul 18 / Jul 20 / Jul 24
    * effort 1, criticality 3
6. Return Wi-Fi equipment
    * available Jul 30
    * target Jul 31
    * latest Jul 31
    * effort 2, criticality 3
7. Save receipt/tracking
    * same day as return
    * effort 1, criticality 3

WORK EXIT

* Gather work laptop/charger/badge/accessories
    * Jul 18 / Jul 20 / Jul 24
    * effort 1, criticality 3
* Confirm work-equipment return process
    * Jul 18 / Jul 22 / Jul 25
    * effort 1, criticality 3
* Return work equipment
    * Jul 29 / Jul 30 / Jul 31
    * effort 2, criticality 3
* Save final pay/PTO/insurance/employment documents
    * Jul 18 / Jul 23 / Jul 30
    * effort 1, criticality 2
* Confirm final paycheck and PTO
    * Jul 18 / Jul 22 / Jul 25
    * effort 1, criticality 2
* Confirm insurance end/COBRA information
    * Jul 18 / Jul 22 / Jul 25
    * effort 1, criticality 2

OTHER ADMIN

* Schedule utilities cutoff/transfer
    * Jul 18 / Jul 22 / Jul 26
    * effort 1, criticality 3
* Schedule renter’s-insurance transfer/cancel
    * Jul 20 / Jul 23 / Jul 27
    * effort 1, criticality 2
* USPS forwarding
    * unlock after address
    * target within 24h
    * latest Jul 29
    * effort 1, criticality 2
* Bank/credit-card address
    * unlock after address
    * target Jul 29
    * latest Jul 31
    * effort 1, criticality 1
* CUNY/student-loan address
    * unlock after address
    * target Jul 29
    * latest Aug 3
    * effort 1, criticality 2

TRAVEL

* Verify airline luggage and pet requirements
    * Jul 18 / Jul 20 / Jul 24
    * effort 1, criticality 3
* Arrange transportation to LAX
    * Jul 20 / Jul 24 / Jul 28
    * effort 1, criticality 3
* Airline check-in
    * exact availability based on check-in window
    * target Jul 30
    * latest before airport
    * effort 1, criticality 3
* Flight
    * exact Jul 31, 3:20 PM
    * criticality 3
    * calendar milestone, not a normal Done button before the event

============================================================
12. HEALTH

Preserve Book → Attend behavior.

Health priority:

1. OB/GYN/IUD
2. rheumatology/labs
3. medication bridge/refills
4. Stretchy vet
5. cardiology
6. dermatology
7. dentist/vision only if capacity exists

Use:

* Contact OB/GYN
    * Jul 11 / Jul 12 / Jul 15
    * effort 2, criticality 2
* Attend OB/GYN
    * after booking
    * target earliest opening
    * latest Jul 25
    * effort 3, criticality 2
* Obtain contingency plan if no appointment
    * unlock if no pre-move appointment
    * Jul 16 / Jul 18 / Jul 22
    * effort 1, criticality 2
* Contact rheumatology/PCP for visit or lab orders
    * Jul 11 / Jul 13 / Jul 16
    * effort 2, criticality 2
* Complete deferred labs
    * after orders
    * target Jul 22
    * latest Jul 28
    * effort 2, criticality 2
* Obtain rheumatology records/referral plan
    * after office response
    * target Jul 24
    * latest Jul 29
    * effort 1, criticality 2
* Contact prescriber/PCP for 90-day bridge
    * Jul 11 / Jul 13 / Jul 17
    * effort 2, criticality 3
* Obtain medication bridge/refills
    * after approval
    * target Jul 24
    * latest Jul 29
    * effort 1, criticality 3
* Transfer pharmacy/confirm refill pickup
    * Jul 20 / Jul 24 / Jul 29
    * effort 1, criticality 3
* Download medical records
    * Jul 18 / Jul 23 / Jul 30
    * effort 2, criticality 2
* Request cardiology screening/referral
    * Jul 18 / Jul 22 / Jul 27
    * effort 2, criticality 1
* Request dermatology
    * Jul 20 / Jul 24 / Jul 28
    * effort 1, criticality 1
* Dentist and vision
    * available Jul 24
    * target Jul 26
    * latest Jul 29
    * effort 1
    * criticality 1
    * do not deal while required move work is compressed

Avoid duplicate Psychiatry/med-renewal and PCP-bridge outcome chains. They may contact different clinicians, but the player-facing goal is medication continuity.

============================================================
13. STRETCHY TRAVEL CHAIN

Preserve the existing cat lane and remove duplicate concepts.

* Carrier practice
    * daily through Jul 30
* Book travel vet
    * Jul 11 / Jul 12 / Jul 16
    * effort 2, criticality 3
* Prepare vet agenda
    * after booking
    * target Jul 20
    * latest day before visit
    * effort 1, criticality 3
* Attend travel vet
    * exact appointment in Jul 22–25 window
    * effort 2, criticality 3

Vet checklist:

* explain prior gabapentin reaction
* discuss alternative/dose
* ask about nausea support
* ask about food/water timing
* confirm certificate requirement/window
* request printed/PDF records

After vet:

* Obtain certificate if required
    * target same day
    * latest required certificate window
    * effort 1, criticality 3
* Obtain rabies/vaccine records
    * target same day
    * latest Jul 25
    * effort 1, criticality 3
* Save full records PDF
    * target same day
    * latest Jul 26
    * effort 1, criticality 2
* Pick up travel medication
    * target Jul 25–26
    * latest Jul 28
    * effort 1, criticality 3
* Medication test run
    * after pickup
    * target Jul 27
    * latest Jul 29
    * effort 2, criticality 3
* Record reaction/contact vet if needed
    * after test
    * target next day
    * latest Jul 30
    * effort 1, criticality 3
* Pack plane-day kit
    * Jul 27 / Jul 29 / Jul 30
    * effort 2, criticality 3
* Final document check
    * Jul 30 exact/target
    * latest Jul 31 before departure
    * effort 1, criticality 3
* Carrier departure
    * exact Jul 31
    * effort 2, criticality 3

============================================================
14. SELF-IMPOSED JOB DEADLINES

Current behavior that prevents selfTarget jobs from becoming overdue must change.

Rules:

* All active selfTarget jobs are available today.
* A selfTarget becomes overdue the day after Target.
* A selfTarget already past Target is overdue now.
* Default estimated Latest:
    Target + 10 days
* Store:
    estimatedLatest: true
* A real closing date replaces the estimate.
* An estimated Latest must be visually identified as estimated or editable.
* SelfTarget jobs remain Criticality 1 or 2.
* They must never outrank Criticality-3 move, housing, medication, cat or flight work merely because they are overdue.

Examples:

{
  selfTarget: true,
  availableFrom: "2026-07-11",
  targetDate: "2026-07-14",
  latestDate: "2026-07-24",
  estimatedLatest: true
}

A Jul 5 self-target is already overdue on Jul 11 and gets an estimated Latest of Jul 15.

Preserve job-fit score as a separate concept. Do not reuse job score as task criticality or urgency.

============================================================
15. DEPENDENCIES

Implement explicit dependency behavior.

Required chains:

housing locked
  → receiving address
  → USPS / address updates
  → comfort box
  → arrival/key access
furniture listing already posted
  → find buyer
  → pickup scheduled
  → complete sale/removal
no buyer by Find Buyer Latest
  → price/drop/donate fallback
  → complete removal
scratch post decision
  → keep/load OR donate
cat tree decision
  → keep/load OR donate
landlord response/walkthrough
  → blinds/curtains restoration
  → wall-hole repair
  → cleaning/photos
  → key handover
vet booked
  → prepare agenda
  → attend vet
  → certificate/records/medication
  → medication test
  → travel kit
early packing
  → room closeout
  → staging/load map
  → U-Box loading
  → final photos
  → lock
U-Box locked
  → disable normal U-Box packing
address confirmed
  → USPS/bank/CUNY/deposit address tasks

Blocked cards:

* may appear in the Ledger
* show what they are waiting on
* must not be dealt as actionable cards

============================================================
16. OBJECT AND CARD SYNCHRONIZATION

Where a task corresponds to an apartment object or storage category:

* completing the Pack/Sell/Donate animation should update the matching task/checklist
* completing the task manually should not make an object disappear without the correct animation or explicit confirmation
* use stable object/task identifiers
* avoid double-counting the same real action

Books and death-closet electronics are physically already packed, but do not seed them complete. Eloisa wants to perform those animations in the production app.

Furniture removal:

* Find Buyer completion does not remove the object.
* Complete Sale/Removal triggers or requires the Sell animation.
* Donation branch uses Donate.
* Physical disappearance means removal is complete.

============================================================
17. SESSION AND SAVE DATA

Persist the daily planning result:

session: {
  day,
  energy,
  dealtTaskIds,
  selectedTaskIds,
  boundTaskIds,
  minimumEffort,
  steadyEffort,
  fullEffort,
  dealConfirmed,
  ...
}

On local midnight:

* generate a new planning session
* do not reopen completed daily recurring cards from earlier dates
* create the new daily instances
* carry unfinished non-recurring selected tasks forward
* recalculate urgency and bound state

Save migration must map existing task data safely:

* current dueDate usually becomes Target unless the current copy clearly indicates an exact or Latest deadline
* current dueEnd often becomes Latest
* current criticalPath: true usually maps to Criticality 3, but inspect each task
* preserve user edits and archive notes
* preserve existing completion
* introduce new tasks without resetting old task states
* do not revive removed duplicate tasks

Add tests for:

* migration from current production v2 save
* no loss of packed/sold/donated state
* no loss of archived notes/tasks
* daily hand persistence
* midnight rollover
* overdue-after-Target
* sharp pressure near Latest
* selfTarget estimated Latest
* dependency blocking
* bound-card calculation
* U-Box exact-day workload
* Preview/prod storage isolation does not require application code

============================================================
18. COMMAND BOARD PRESENTATION

Keep the Board physical and game-like.

Daily opening:

* card fan/draft presentation
* warm paper/pixel style
* selected cards slide into the hand
* bound cards visibly stamped
* do not make it look like a generic productivity dashboard
* no occult imagery

Each card should show:

* category
* title
* effort dots
* criticality/stakes seals
* Target
* Latest when relevant
* OVERDUE or FINAL CALL state
* dependency/blocker when blocked

Criticality should be called something player-friendly such as:

* optional
* important
* locked

Do not label it “importance score.”

The player chooses cards, but the UI must communicate effort requirements:

Examples:

* “minimum today: 4 points”
* “steady: 7 points”
* “full steam: 10 points”

The card count is derived from the selected whole cards, not imposed in advance.

Keep Ledger access available at all times.

============================================================
19. GLOBAL PRESSURE

Do not calculate global pressure from raw backlog size.

Use schedule compression.

For each upcoming deadline:

compression =
remaining required effort due by that date
/
available Fumes capacity before that date

Use the worst upcoming ratio.

Suggested labels:

* under 0.60: Manageable
* 0.60–0.84: Building
* 0.85–0.99: Tight
* 1.00–1.19: Overloaded
* 1.20+: Schedule breach

Daily recurring tasks and exact-date tasks must reserve capacity appropriately.

============================================================
20. IMPLEMENTATION ORDER

Do not attempt a visual redesign and data rewrite simultaneously.

Recommended sequence:

Commit 1:

* task schema
* migration
* normalized dates/criticality/dependencies
* missing task data
* no major Board UI change yet

Commit 2:

* urgency calculation
* status labels
* dependency resolver
* recurring task instances
* unit tests

Commit 3:

* backward Fumes scheduler
* Steady and Full-steam plans
* persisted daily deal
* tests

Commit 4:

* card-draft Board UI
* bound-card presentation
* effort requirements
* mobile layout

Commit 5:

* object/task synchronization
* furniture state transitions
* final migration and regression checks

Do not merge to main during the work.

============================================================
21. REQUIRED REPORT BEFORE PRODUCTION

Before requesting production merge, report:

1. Branch name and commit list.
2. Exact files changed.
3. New save version.
4. Migration path from current production save.
5. Proof that the old phone save is preserved.
6. Tests run and results.
7. Build/typecheck results.
8. Screens tested at phone dimensions.
9. Which task data is still editable/uncertain.
10. Any behavior intentionally deferred.
11. A concise production-release checklist.

Do not deploy production merely because the build succeeds.

The phone-browser production URL is canon. Development remains local/branch-based until Eloisa closes the session.