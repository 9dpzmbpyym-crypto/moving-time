# Implementation Manifest for Grok

## Intended repo placement

Recommended folder:

`docs/move-spine/`

Suggested files:

* `README_FOR_GROK.md`
* `master/MASTER_REAL_WORLD_GOALS_JULY_2026.md`
* `npc-guides/SHIRLEY_HEALTH_RECEPTIONIST.md`
* `npc-guides/SAL_MOVING_DISPATCH.md`
* `npc-guides/VIVIAN_RECRUITER.md`
* `systems/COMMAND_BOARD_AND_TASK_SPINE.md`
* `systems/NPC_TRIGGER_RULES.md`
* `systems/IMPLEMENTATION_MANIFEST.md`
* `systems/CHEAP_API_MODEL_STRATEGY.md`
* `prompts/RUNTIME_SYSTEM_PROMPTS.md`

## Recommended first implementation pass

Do not implement all characters in one pass.

Pass 1:
* Add docs to repo.
* Replace Shirley guide, runtime prompt, and fallback line bank.
* Keep existing appointment FSM where useful.
* Remove old Shirley examples and style if they conflict with this guide.

Pass 2:
* Add Command Board visual skeleton.
* Show four lanes: Packing, Health, Jobs, Admin.
* Use static master list data first.

Pass 3:
* Add task lifecycle fields.
* Separate scheduled from attended.
* Add waiting and follow-up states.

Pass 4:
* Add Sal as moving dispatcher.
* Trigger from packing/U-Box progress.

Pass 5:
* Add Vivian as recruiter.
* Trigger from job tracker progress and follow-up timing.

## Existing code areas likely involved

Do not assume exact names without inspecting.

Likely files:
* `artifacts/pack-it-up/src/tasks.js`
* `artifacts/pack-it-up/src/Screens.jsx`
* `artifacts/pack-it-up/src/receptionist.js`
* `artifacts/pack-it-up/src/receptionistCall.js`
* `artifacts/pack-it-up/src/save.js`
* possibly a new data file for move spine, if approved

## Important implementation constraints

* Do not split `BedroomSlice.jsx`.
* Do not add a complex framework.
* Do not convert every real-world item into a game object.
* Do not make NPC calls constant.
* Do not create three simultaneous chat systems before one works.
* Keep deterministic fallback banks.
* Live AI is optional and should fail gracefully.
* Completion states matter more than clever dialogue.
* The custom API model should receive small tasks only.

## Acceptance criteria

After first Shirley replacement:
* Shirley no longer sounds like the old prompt.
* Shirley uses the user-approved calibration lines as style source.
* Shirley asks about scheduling, attending, records, labs, refills, or follow-up.
* Shirley does not overtalk.
* Shirley does not give medical advice.
* Shirley can hang up if stalled.
* Scheduling and attending are separate.

After Command Board:
* Player can see top Packing, Health, Jobs, and Admin pressures from one screen.
* Each lane routes to the right existing screen.
* Critical path items are visible.
* The board does not show every task at once.

After Sal:
* Sal can call about packing progress and U-Box deadlines.
* Sal can warn about Wi-Fi equipment and do-not-pack items.
* Sal gives one useful instruction per call.

After Vivian:
* Vivian can ask for job status updates.
* Vivian can prompt one apply, follow-up, or archive action.
* Vivian can mark one-week follow-ups.
* Vivian can flag class conflicts and poor-fit roles.
