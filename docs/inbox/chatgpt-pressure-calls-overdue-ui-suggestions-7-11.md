pressure, calls, and overdue ui

caller ownership

* moving dispatcher: packing, furniture, u-box, housing, landlord, wifi, utilities, flight logistics
* shirley: health, medications, medical records, stretchy’s vet, paperwork, meds, carrier, travel kit
* recruiter: jobs, applications, work equipment, final pay, pto, cobra, employment records
* low-stakes neutral admin stays on the ledger with no caller

when calls happen

A call becomes eligible when:

* a criticality-3 task is overdue
* a task reaches high pressure or its latest date
* an exact-date event is within 24 hours and prerequisites are unfinished
* several tasks in one domain are overdue
* a required daily task was skipped

Do not call when the task is blocked, already in today’s hand, recently handled, or optional.

call limits and order

* normally 2 live calls per day
* maximum 1 live call per npc per day
* a third caller becomes voicemail unless all three domains have serious critical pressure
* never play calls back-to-back

Priority order:

1. exact-date event
2. past latest
3. criticality-3 overdue
4. blocking another critical task
5. largest overdue cluster
6. caller who has waited longest

Calls should happen after the app loads, only from the home screen or board, and never during animations, forms, dialogue, or hand selection.

call actions

Each call focuses on one top task and offers:

* add to today’s hand
* already handled
* blocked or waiting
* not today, unless the card is bound

pressure visuals

Avoid a constant bright-red vignette.

* manageable: normal palette
* building: amber edges, small phone light
* tight: subtle red-brown vignette, stronger stamps and shadows
* overloaded: fixed-today stack, pressure-waiting stack, waiting caller shown
* final call: one brief red pulse and a FINAL CALL stamp

Board sections:

* Fixed Today
* Your Hand
* Pressure Waiting

stretchy pressure

Use restrained signals:

* restless idle behavior
* looking toward the player or carrier
* rare stress meow using the existing cooldown
* alert or tucked-tail idle
* relevant object gently pulses
* shirley calls about the specific overdue cat task

persistence

Save daily call state so refreshes do not repeat or reroll calls:

callState: {
  day,
  liveCallsUsed,
  lastCallAt,
  callers,
  pendingCalls,
  missedCalls
}

Pressure should affect the atmosphere continuously. Calls should remain rare, prioritized interventions.