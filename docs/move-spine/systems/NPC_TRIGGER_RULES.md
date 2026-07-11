# System Spec — NPC Trigger Rules

## Purpose

NPCs should feel alive, not spammy.

They call when a category is neglected, a due date is close, or a status needs confirmation.

## Global rules

Do not let more than one NPC initiate a call on app open unless there is a critical deadline.

Prefer one call per session.

The call should ask for one action or one status update.

NPCs should not loop forever. If the player stalls, they end the call and leave the task open.

## Shirley triggers

Shirley calls or surfaces if:

* a core health appointment is not scheduled
* an appointment is tomorrow
* an appointment date passed and the player has not marked attended
* a refill or lab task is unresolved
* health tasks have been ignored for two days
* insurance countdown is under two weeks and major health tasks are open

Highest priority health tasks:
* OB/GYN and IUD replacement
* rheum labs or IgA vasculitis follow-up
* medication bridge
* Stretchy vet if health certificate is missing
* cardiology if unscheduled
* dermatology if other major items are handled
* dentist and vision as optional bonuses

## Sal triggers

Sal calls or surfaces if:

* no packing progress in two days
* U-Box delivery is within seven days
* U-Box has arrived
* death closet is not sorted
* July 30 arrives and U-Box is not complete
* Wi-Fi equipment is at risk of being packed
* furniture sell or donate tasks are overdue
* room packing progress is below expected threshold
* final sweep is due

Escalation near U-Box:
* July 25: staging reminder
* July 27: delivery and first load
* July 28: main loading
* July 29: main loading and sell or donate cutoff
* July 30: final load, photos, lock
* July 31: no packing, final sweep only

## Vivian triggers

Vivian calls or surfaces if:

* no job progress in three days
* high-score role is due within forty-eight hours
* saved role is overdue
* applied role is seven days old with no status update
* too many roles are saved with no decision
* the player is looking at jobs that violate stated constraints
* a role may conflict with class schedule

Job constraints:
* prioritize CUNY, H+H, DOHMH, HPD, MOPT, MOCS, public-sector admin or ops
* avoid direct service, caseload, heavy advising, supervision, evenings, weekends
* screen against CUNY hybrid class schedule
* apply to 5 to 7 serious jobs total before move day, not dozens of weak jobs

## Stretchy triggers

Stretchy is not a phone NPC in v1. He can surface as screen state, meows, notes, or stress.

Surface Stretchy if:

* carrier acclimation is not started
* vet is not scheduled
* certificate or records are missing
* meds have not been tested
* travel kit is incomplete
* packing chaos is high near flight day

## Priority conflicts

When multiple categories are overdue, choose in this order:

1. hard date within 48 hours
2. health or pet travel paperwork
3. sublet or housing
4. U-Box or loading
5. job application deadline
6. admin cutoff
7. general packing

Do not let optional dentist, vision, or low-fit jobs outrank U-Box, sublet, meds, or Stretchy.
