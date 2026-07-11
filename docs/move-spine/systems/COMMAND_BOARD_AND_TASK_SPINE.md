# System Spec — Command Board and Task Spine

## Purpose

The app needs one real-world master spine and one visible daily dashboard.

The player should not have to inspect every screen to know what matters today. The Command Board should answer:

* what matters today
* what is due soon
* what is overdue
* who is going to call if ignored
* where to tap to fix it

## Existing categories

Use the existing task categories where possible:

* move
* job
* admin
* health
* cat

Do not create a separate new universe of task types unless needed.

## Command Board lanes

### Packing

Owns room packing, death closet, furniture sell or donate, U-Box loading, lock and security, final sweep.

Tap target: Apartment screen  
NPC: Sal

### Health

Owns scheduling appointments, attending appointments, labs, medication bridge, records, health coverage countdown.

Tap target: Body Board and Shirley phone  
NPC: Shirley

### Jobs

Owns active apply shortlist, applications, follow-ups, job tracker cleanup, schedule fit, archived or dead jobs.

Tap target: Desk  
NPC: Vivian

### Admin

Owns sublet messages, Wi-Fi equipment return, utilities, USPS forwarding, CUNY documents, final paycheck or insurance records, receipts, and confirmations.

Tap target: Desk  
NPC: no dedicated NPC for v1

Admin should be handled by the Desk itself to avoid too many voices.

## Daily Dispatch

Each day, choose a small set of tasks.

Default daily load:
* one packing or moving task
* one job or admin task
* one health or Stretchy task
* one urgent override only if needed

Do not show everything as mandatory every day.

## Critical Path panel

Create a pinned section for deadlines that can wreck the move.

Critical Path items:
* sublet by July 15 if possible
* vet certificate and records before flight
* U-Box delivery July 27
* U-Box fully packed by July 30 night
* flight July 31 at 3:20 PM
* Wi-Fi equipment must not be packed
* meds, records, ID, chargers, Stretchy items must not be packed
* OB/GYN, rheum labs, medication bridge if possible before coverage changes

## Task lifecycle

Use richer statuses than pending and done where needed.

Suggested lifecycle:

* not_started
* active
* requested
* scheduled
* submitted
* waiting
* reminded
* followup_due
* attended
* records_needed
* complete
* deferred
* dead
* archived

Use category-specific states sparingly. Do not overbuild.

## Proof of completion

Packing:
* box packed
* item sold
* item donated
* room percent changed
* U-Box readiness changed

Health:
* appointment requested
* appointment scheduled with date/time
* appointment attended
* labs done
* refill obtained
* records saved

Jobs:
* application submitted
* status updated
* follow-up sent
* role archived or dead

Admin:
* message sent
* confirmation saved
* return receipt recorded
* utility scheduled
* document filed

Cat:
* vet scheduled
* vet attended
* certificate obtained
* meds tested
* carrier acclimation done
* travel kit packed

## Do not overbuild

The Command Board should be useful before it is fancy.

Start with static data from the master list. Later, hook up more dynamic task generation.
