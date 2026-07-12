PART 7 — CONNECT TASKS TO THE ACTUAL GAMEPLAY AND NPC SYSTEMS

This is not a request to create another task list or duplicate task state inside each screen.

There must be one canonical task system. The apartment, Health screen, Stretchy screen, Command Board, Ledger, appointments, and NPC calls must all read and update the same tasks.

Use one Sonnet subagent specifically for this part. Give it only the relevant task, screen, appointment, receptionist, save, and apartment-action files. Opus must review and integrate the result.

HIGH-LEVEL RULE

A task should no longer merely route to a vaguely related screen.

Where a task represents an actual game action:

- “Go” takes the player to the exact relevant room, object, storage container, body zone, Stretchy preparation step, or NPC interaction.
- Performing that action updates the canonical task.
- Completing the task updates every screen immediately.
- The task disappears from the active hand once completed.
- Completion must remain consistent after reload.
- Rewards and session counters must not be granted twice.

Do not create parallel “screen task” objects.

A. CENTRAL TASK-BINDING MODEL

Audit the existing task fields and preserve useful fields such as:

- room
- objectId
- zone
- kind
- bookTaskId
- dependencies
- blocks
- completionMode

For more complex links, create a small code-owned binding registry keyed by stable task ID rather than scattering task-ID conditionals across components.

A binding may need to describe:

- destination screen
- room ID
- one object ID or several object IDs
- containing storage ID
- storage-content key or keys
- required state: packed, sold, donated, handled, emptied, booked, attended, confirmed, or manually completed
- health zone
- Stretchy preparation section
- owning NPC
- dependency or prerequisite task IDs

Do not persist static binding definitions into the user save. Keep them in code. Persist only actual user state, task status, appointments, daily-deal state, and NPC contact history.

Create a small set of pure helpers rather than duplicating behavior:

- resolveTaskDestination(task)
- taskBindingProgress(task, worldState)
- reconcileTasksFromWorldState(tasks, worldState)
- completeTaskFromEvent(tasks, event)
- upsertAppointmentTasks(...)
- nextNpcContact(...)

Exact names may differ, but the architecture should remain similarly centralized.

B. CONNECT PACKING TASKS TO APARTMENT OBJECTS

Audit every active Move/Packing task.

Separate them into:

1. Tasks that genuinely correspond to apartment objects, storage contents, rooms, or handling state.
2. Move-logistics tasks that are genuinely manual, such as confirming delivery, buying a lock, or calling a company.

Do not force logistics tasks onto random furniture.

For every genuinely item-based packing task:

- Bind it to the correct room and object or storage contents.
- Card “Go” must switch to the correct room.
- Highlight the relevant object or containing storage unit.
- If the target is inside a cabinet, drawer, closet, dresser, pantry, or other container, highlight the container first and then the relevant contents when opened.
- Do not automatically mark a task done merely because the player viewed or tapped the object.
- Complete it only when its required state is achieved.

Examples of valid completion semantics:

- “Pack X” completes only when X is packed.
- “Sell X” completes only when X is sold.
- “Donate X” completes only when X is donated.
- “Deal with X” may accept packed, sold, or donated.
- “Empty dresser” completes when all mapped contents have been handled.
- “Pack bedroom clothes” may use aggregate progress over several mapped contents.
- “Clear room” completes only when its defined required objects or contents are handled, not merely from the room’s generic visual percentage unless those sets are intentionally identical.

Aggregate tasks must display useful progress such as:

- 3/7 packed
- 5/6 handled
- 2 items remaining

Use one resolver for apartment object actions. Pack, Sell, Donate, Undo, unpack, buy-back, and take-back must all reconcile linked task state.

If an object is unpacked or restored, a directly state-bound task should reopen so the task and world cannot contradict one another.

Prevent reward farming:

- Reopening after Undo may restore task status.
- Re-completing the same task must not repeatedly grant the original completion reward.
- Track whether the task’s completion reward was already awarded if necessary.

On first load after this feature ships:

- If an object was already packed/sold/donated in the mobile save, reconcile its linked task correctly.
- Do not grant retroactive duplicate rewards merely from migration.
- Never restore tasks the user deliberately dismissed or archived.
- Never revive tasks deleted from the current save.

C. CONNECT COMMAND-BOARD CARDS TO EXACT DESTINATIONS

Replace broad category-only routing where a more precise binding exists.

Card “Go” should:

- switch to the apartment and correct room for object-bound tasks;
- focus/highlight the correct apartment object or container;
- open Health focused on the correct body zone;
- open Stretchy focused on the correct preparation task or section;
- open the Paperwork Desk or NPC interaction where appropriate;
- preserve a back path to the Command Board.

Use a short-lived `taskFocus` or equivalent navigation state.

Do not encode focus state inside the saved task itself.

A focused object/zone should have a visible but restrained cue. Do not create constant pulsing around every urgent item. Highlight only the task the player explicitly navigated to, plus genuinely actionable doorway cues already present.

D. CONNECT HEALTH TASKS TO THE HEALTH SCREEN

The existing task `zone` field should drive the Health screen.

Audit every active Health task and map it to the correct existing body zone or health interface section.

Each zone should show:

- active related task or tasks;
- urgency status;
- target/latest date;
- whether it is blocked;
- appointment status where applicable;
- the next valid action.

Examples:

- Book appointment
- Record appointment
- Attend appointment
- Complete labs
- Obtain records
- Secure medication bridge
- Confirm contingency plan

Do not mark a real-world task complete from a meaningless decorative click.

For tasks requiring real confirmation, provide a clear confirmation action or route through Shirley’s recording flow.

Health-screen task actions and Shirley must use the same pure task-transition functions. They must not have separate appointment logic.

When a health task is selected from the Board:

- open the correct zone;
- scroll or focus it into view;
- visibly identify the active card;
- show its actual next step.

Blocked health tasks should explain the prerequisite rather than offering an invalid completion action.

E. CONNECT STRETCHY TASKS TO THE STRETCHY SCREEN

Audit every active Cat/Stretchy task.

Map each task to a real section or interaction on the Stretchy screen, using the existing task data rather than inventing unrelated chores.

Likely functional groups should come from the existing tasks, such as:

- booking the travel vet;
- attending the travel-vet appointment;
- medication test run;
- health certificate or records;
- carrier/travel preparation;
- food, medication, and travel supplies;
- flight readiness.

Do not invent additional tasks merely to fill the screen.

The Stretchy screen should show:

- the current preparation chain;
- completed and blocked steps;
- urgency;
- target/latest dates;
- the next actionable step;
- any related appointment.

Card “Go” must focus the relevant Stretchy step.

If a Stretchy task also corresponds to an apartment object or packed item, allow the task destination to route to that actual item where appropriate while keeping it represented in the Stretchy preparation chain.

Dependencies must work. For example, an Attend task cannot become actionable before an appointment exists.

F. SHIRLEY AND APPOINTMENT TASKS

Shirley does not schedule appointments.

Her role remains:

- ask what appointment the player scheduled;
- collect or confirm the date and time;
- record it;
- remind the player;
- notice overdue or missed health actions;
- remain brief and hang up if the player stalls.

When the player confirms an appointment through Shirley or through the Health screen, use one idempotent transition:

1. Locate the matching Book task.
2. Mark the Book task complete.
3. Create or update the appointment record.
4. Create or update exactly one Attend task.
5. Link the Attend task back to the Book task and appointment.
6. Preserve the correct health or Stretchy zone/category.
7. Give the Attend task the appointment date and time.
8. Treat the appointment date as an exact scheduled date where appropriate.
9. Recalculate urgency and the daily deal without duplicating cards.

Do not create duplicate Attend tasks if:

- Shirley receives the same appointment twice;
- the user confirms it from two different screens;
- the page reloads;
- the appointment is edited.

Rescheduling must update the existing appointment and Attend task.

Cancellation must:

- cancel or archive the associated Attend task;
- reopen the Book task when booking is still required;
- avoid erasing historical appointment information unnecessarily.

Attending the appointment must complete the Attend task everywhere.

A missed appointment should not silently count as attended. It should become missed/overdue and may produce the correct rescheduling action.

G. URGENCY MUST CONTROL NPC CONTACT

Connect the urgency engine to NPC calls and reminders.

Do not make every urgent task create a call.

Create one centralized NPC-contact policy that evaluates:

- task status;
- urgency band;
- criticality;
- target date;
- latest date;
- exact appointment date/time;
- whether the task is blocked;
- whether the task is already complete;
- whether the player has already received or acknowledged this contact;
- cooldown and local day.

For Shirley:

- SOON: no incoming call by default.
- DUE: a restrained reminder may appear, especially for a booking or same-day health action.
- OVERDUE: eligible for an incoming accountability call.
- CLOSING: higher priority for a call.
- FINAL CALL: highest health-call priority.
- Upcoming Attend task: reminder based on appointment timing.
- Missed Attend task: missed-appointment call or reschedule prompt.
- BLOCKED: do not call as though the player can complete it; explain the blocker only when relevant.
- DONE, DISMISSED, or ARCHIVED: no call.

Avoid harassment:

- Do not call repeatedly every render or every minute.
- Persist contact history.
- At most one incoming call for the same task and urgency band per local day unless the appointment itself enters a distinct time-based reminder window.
- Acknowledging the call suppresses repeats until the relevant state changes.
- Completing, rescheduling, dismissing, or archiving the task cancels stale pending contact.
- If several tasks qualify, choose the highest-priority actionable one.
- Do not queue five consecutive calls.

Urgency should affect why Shirley calls and how direct she is, but not turn her into a long monologue machine.

The call content must be grounded in the actual task:

- what appointment needs booking;
- what date/time was recorded;
- how close the latest date is;
- whether the appointment is tomorrow/today/missed;
- what action she expects the player to confirm.

Do not let the language model decide task state by itself. The model may generate dialogue, but validated structured actions must drive task and appointment changes.

H. SUPPORT FUTURE NPCS WITHOUT INVENTING THEM

Create a small `npcOwner` or contact-policy mechanism so other existing NPCs can eventually own relevant tasks.

Do not invent new callers, names, voices, or dialogue in this pass.

Only wire NPCs that already exist in the project.

A task without an existing NPC owner should remain a normal task rather than producing a fake call.

I. DAILY HAND AND COMPLETION ACCOUNTING

When a linked gameplay action completes a card:

- remove it from the active visible hand;
- remove it from offers;
- preserve the fact that its effort was completed today;
- do not make the player draw replacement effort merely because the completed card disappeared.

This is especially important after converting energy selection to effort points.

Track daily completed selected effort or an equivalent durable measure so:

- completing a selected optional effort-3 card still satisfies three effort points;
- completing a Bound card counts toward completed work;
- the daily effort target does not move backward;
- reloading the page preserves today’s progress;
- undoing the underlying action does not allow infinite effort/reward farming.

Do not silently reshuffle or redeal the rest of the hand after every object action.

Only add a newly Bound card during the same day if a genuine deadline/state change makes it newly non-negotiable. Do not churn the hand from ordinary completion.

J. SAVE COMPATIBILITY

Extend the save non-destructively for any required:

- appointment-task links;
- task reward-awarded markers;
- completed daily-deal effort;
- NPC contact history;
- acknowledged reminders;
- focused-screen state only if truly necessary—prefer not to persist focus.

Do not wipe the mobile save.

Do not restore the source-default task list over the user’s reduced list.

Do not recreate tasks the user deleted, dismissed, or archived except for intentionally generated dynamic tasks such as a valid Attend task tied to a confirmed appointment.

Migration must be idempotent.

K. TESTS

Add focused tests for at least:

1. Packing the mapped object completes its task.
2. Merely viewing the object does not complete it.
3. An aggregate packing task remains open until every required object/content item is handled.
4. Undoing a linked object state reopens the task without duplicating rewards.
5. Existing packed mobile-save state reconciles correctly on load.
6. Card “Go” selects the correct room and object.
7. Health Card “Go” focuses the correct body zone.
8. Stretchy Card “Go” focuses the correct preparation step.
9. Recording an appointment completes Book and creates one Attend task.
10. Recording the same appointment twice does not duplicate Attend.
11. Rescheduling updates the existing Attend task.
12. Canceling reopens the appropriate Book task.
13. Attending completes the Attend task.
14. An overdue actionable health task may create a Shirley call.
15. A blocked, done, dismissed, or distant task does not create a call.
16. Reopening the app does not repeat the same acknowledged call.
17. When multiple tasks qualify, only the highest-priority call is selected.
18. Completed selected effort remains credited after the card leaves the visible hand.
19. Reloading preserves task/world/appointment/NPC consistency.

L. VISUAL VERIFICATION

Capture:

- a Command Board packing card navigating to and highlighting the correct apartment object;
- an aggregate packing task showing progress;
- a Health card focused on its correct body zone;
- a Stretchy card focused on its preparation step;
- a Book task before appointment recording;
- the resulting Attend task after Shirley records an appointment;
- an urgency-triggered incoming Shirley call;
- the same task after acknowledgment, proving it does not immediately call again.

M. IMPLEMENTATION ORDER

Complete this in the following order:

1. Define the binding and event-transition helpers.
2. Connect apartment actions.
3. Connect precise Board navigation.
4. Connect Health zones.
5. Connect Stretchy preparation.
6. Unify Shirley and appointment transitions.
7. Add persisted NPC-contact policy.
8. Reconcile daily effort accounting.
9. Add tests.
10. Capture screenshots.

Keep this as a separate commit from the visual card-layout/PNG work so regressions are easier to isolate.

Suggested commit:

Connect tasks to apartment, health, Stretchy, and NPC events

Do not deploy or merge until I review the screenshots and task-transition tests.