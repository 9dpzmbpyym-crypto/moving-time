FINISH_PLAN.md is close, but it is not fully aligned with what we talked through. It has the Shirley move-spine note and says later passes are sequenced, but several things are either missing, too buried, or still only living in docs/inbox / docs/move-spine.

Main things I’d add or adjust:

1. Promote the perf/usage safety review from inbox into Open next.

Right now the perf note exists only in docs/inbox/Chatgpt perf + usage review recommendations, not in FINISH_PLAN.md. The inbox note says this should be a tiny patch: remove the July 10 Shirley test-call path, tighten Shirley API/fallback behavior, reduce clock churn if cheap, and avoid broad refactor.

Add this near the top of Open next, before audio cleanup:

### Tiny perf / usage safety patch — [cursor] Composer/Grok-sized
- [ ] Remove July 10 Shirley test-call path; keep only real `getNudge` behavior.
- [ ] Tighten `receptionistCall.js`: live Shirley API truly opt-in, lower max tokens, lower temp, configured model + at most one fallback before script bank.
- [ ] If cheap, reduce one-second clock churn or isolate clock components.
- [ ] Leave audio lazy-loading / incoming pulse / infinite CSS animation notes as watchlist, not broad refactor.
- Acceptance: Shirley script bank works with no API key; live API remains opt-in; no July 10 auto-call remains; app still runs; no architecture pass.

2. Make Command Board / Daily Dispatch an explicit future ticket, not just “later passes.”

FINISH_PLAN currently says later passes are sequenced in the implementation manifest and should not start in Shirley Pass 1.  That is correct, but too buried. The actual spec says the app needs one visible daily dashboard that answers what matters today, what is due, what is overdue, who will call, and where to tap.

Add under P1b or a new P1c:

## P1c — Command Board / Daily Dispatch
- [ ] Add Command Board skeleton after Shirley Pass 1, not before.
- [ ] Four lanes: Packing, Health, Jobs, Admin.
- [ ] Show only a small daily load: one packing/move task, one job/admin task, one health/Stretchy task, plus urgent override only if needed.
- [ ] Add Critical Path panel: sublet Jul 15, vet records/certificate, U-Box Jul 27, packed Jul 30 night, flight Jul 31 3:20 PM, Wi-Fi/meds/docs/ID/chargers/Stretchy items not packed.
- [ ] Start static from master list; do not generate everything dynamically yet.

3. Add task lifecycle/proof-of-completion as its own technical ticket.

The implementation manifest says Pass 3 should add lifecycle states and separate scheduled from attended.  The Command Board spec also defines statuses like scheduled, waiting, followup_due, attended, records_needed, dead, and archived.  FINISH_PLAN mentions this only indirectly.

Add:

### Task lifecycle / proof-of-done — [codex/grok]
- [ ] Add richer lifecycle states where needed: not_started, requested, scheduled, submitted, waiting, reminded, followup_due, attended, records_needed, complete, deferred, dead, archived.
- [ ] Separate “scheduled” from “attended” for appointments.
- [ ] Separate “applied” from “waiting/followup_due/interview/rejected/ghosted” for jobs.
- [ ] Add proof-of-done fields for: appointment date/time, attended, labs/refills/records, job status update, follow-up sent, admin receipt/confirmation, cat vet certificate/records.

4. Add Sal and Vivian as parked but defined passes.

FINISH_PLAN says Sal and Vivian are later, but it does not preserve the concrete acceptance criteria. The implementation manifest already defines Pass 4 as Sal and Pass 5 as Vivian.  It also says Sal should warn about packing/U-Box/Wi-Fi/do-not-pack items, and Vivian should handle job status, follow-ups, archives, class conflicts, and poor-fit roles.

Add to a deferred-but-real section:

### Later NPC passes — do not start before Shirley + Command Board
- [ ] Sal from Dispatch: packing/U-Box trigger layer. Calls only on packing neglect, U-Box timing, Wi-Fi risk, furniture/sell deadlines, final sweep.
- [ ] Vivian Vale: job tracker trigger layer. Calls only for no job progress, high-fit deadline, 7-day follow-up, too many saved jobs, class conflict, or poor-fit role.
- [ ] Global rule: one NPC call per session unless critical deadline.

5. Add Stretchy travel prep as more than meow wiring.

FINISH_PLAN currently has Stretchy morning check-in and stressed/desperate meows.   But our move-spine says Stretchy still needs vet appointment, health certificate if required, vaccine/rabies records, full vet records PDF, med discussion/test run, and carrier acclimation, ideally July 22–25.

Add:

### Stretchy travel prep — [cat/health lane]
- [ ] Add task cards/states for vet scheduled, vet attended, certificate/records obtained, meds discussed, meds test run, carrier acclimation, travel kit packed.
- [ ] Surface Stretchy only as screen state/meows/notes in v1, not a full phone NPC.
- [ ] Target vet window from master list: Jul 22–25 unless vet/airline says otherwise.

6. Add sublet/admin pressure to the actual app plan.

The master goals file says sublet is unresolved, target lock by July 15, and daily action is 10 serious messages/day, 5 backup messages/day, and follow-ups.  Command Board spec says Admin owns sublet messages, Wi-Fi return, utilities, USPS forwarding, CUNY docs, final paycheck/insurance records, receipts, and confirmations.  FINISH_PLAN does not really have a visible sublet/admin lane beyond Desk/job sync.

Add:

### Admin / sublet lane — [desk]
- [ ] Add admin cards for sublet sprint: messages sent, warm replies, follow-ups, backup plan if no sublet by Jul 15.
- [ ] Add Wi-Fi return card: equipment located, DO NOT PACK, return method confirmed, receipt/tracking saved.
- [ ] Add utilities/account cutoff cards: renter’s insurance, USPS forwarding once address exists, pharmacy/records, CUNY docs, final insurance/pay/PTO emails.
- [ ] Admin stays Desk-owned for v1. No separate admin NPC.

7. Add U-Box / do-not-pack / final sweep as a concrete packing ticket.

FINISH_PLAN has hallway/death closet and box labels, but not the full U-Box critical path. Master goals say U-Box arrives Jul 27, main loading Jul 28–29, final load/lock/photos Jul 30, no normal packing Jul 31.  The Command Board critical path also calls out U-Box delivery, fully packed by Jul 30 night, Wi-Fi equipment and meds/docs/ID/chargers/Stretchy items not packed.

Add:

### U-Box / do-not-pack / final sweep — [apartment/packing]
- [ ] Add U-Box countdown/readiness cards: lock bought, boxes labeled, heavy boxes staged, U-Box delivery Jul 27, fully packed Jul 30 night.
- [ ] Add DO NOT PACK list in app: ID, meds, insurance card, health/vet paperwork, laptop, phone, chargers, power bank, travel outfit, Stretchy kit, Wi-Fi equipment, CUNY/sublet docs, keys.
- [ ] Add final sweep checklist for Jul 31: closets, drawers, cabinets, outlets, fridge, medicine cabinet, under bed, behind doors, router, meds/docs/cat kit.

8. Update stale “weekend ship bar” language or clearly freeze it as historical.

FINISH_PLAN still says “usable by end of weekend” and “before/around Jul 12 Fable renew.”  That was useful, but now the plan has moved into post-vertical-slice cleanup. I would either change it to “historical weekend ship bar” or add a new “Current next bar.”

Add:

**Current next bar:** safe, non-runaway Shirley Pass 1 + tiny perf/usage patch + phone smoke test. Do not expand scope until that is done.

9. Rename or acknowledge the inbox file.

Not required for functionality, but the inbox file lacks .md. FINISH_PLAN can reference it either as-is or after rename. The current path is:

docs/inbox/Chatgpt perf + usage review recommendations

It contains the full perf review.

Suggested tiny cleanup:

- [ ] Optional docs cleanup: rename `docs/inbox/Chatgpt perf + usage review recommendations` → `docs/inbox/2026-07-11-chatgpt-perf-usage-review.md`.

My priority order for adding to FINISH_PLAN:

1. Tiny perf / usage safety patch.
2. Shirley Pass 1 remains next.
3. Command Board / Daily Dispatch explicit future ticket.
4. Lifecycle/proof-of-done ticket.
5. Stretchy travel prep.
6. Admin/sublet lane.
7. U-Box/do-not-pack/final sweep.
8. Sal/Vivian parked passes.
9. Rename inbox file.

I would not add all of these to “Open next.” Only the perf patch and Shirley Pass 1 belong there. The rest should be structured under P1/P2 or “explicitly deferred but accepted.”
