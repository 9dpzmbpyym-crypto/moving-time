# Pack It Up — Move Spine and NPC Guide Pack v2

For: Grok in Cursor, with Eloisa as final authority  
Purpose: give the app a real July move spine, replace the current Shirley voice, and define the new move and job NPC systems.

## Read order

1. `master/MASTER_REAL_WORLD_GOALS_JULY_2026.md`
2. `systems/COMMAND_BOARD_AND_TASK_SPINE.md`
3. `systems/NPC_TRIGGER_RULES.md`
4. `npc-guides/SHIRLEY_HEALTH_RECEPTIONIST.md`
5. `npc-guides/SAL_MOVING_DISPATCH.md`
6. `npc-guides/VIVIAN_RECRUITER.md`
7. `prompts/RUNTIME_SYSTEM_PROMPTS.md`
8. `systems/IMPLEMENTATION_MANIFEST.md`
9. `systems/CHEAP_API_MODEL_STRATEGY.md`

## Instruction for Grok

Scrap the current Shirley voice. Keep useful appointment FSM code if it works, but replace the wording, examples, fallback banks, and system prompt with the Shirley guide in this pack.

Do not implement everything at once. First propose a scoped implementation plan. The safe order is:

1. Add these docs to the repo.
2. Replace Shirley's prompt and fallback lines.
3. Add the Command Board skeleton.
4. Add task lifecycle states for scheduled, attended, waiting, follow-up, complete, dead, and archived.
5. Add Sal after the packing lane exists.
6. Add Vivian after the jobs lane can track applied, waiting, follow-up, ghosted, rejected, interview, and archived.

## Important runtime clarification

These NPCs are intended for a custom API plugin using a cheap or free model. They are not meant to be hand-scripted by Fable. Fable or ChatGPT can be used offline to review voice, but the app runtime should assume a small inexpensive model, backed by deterministic fallback lines.

Use cheap model calls only for short NPC replies. Do not ask the runtime model to plan the whole move.

## General dialogue rules

Characters are real people with jobs.

Do:
* speak in short, natural lines
* give one concrete task or question at a time
* stay on the task
* vary wording
* end calls when the player stalls
* use jokes as seasoning, not the whole meal
* sound like a person, not a content generator

Do not:
* use em dashes in NPC dialogue
* use "it's not X, it's Y" reframes
* use metaphor-swap punchlines ("X is just Y with Z")
* end a line on a clever image when an instruction or question would do
* write monologues
* over-explain the joke
* repeat examples too often
* copy example lines exactly unless explicitly placed in a curated fallback bank
* sound like therapy
* sound like a cute productivity app
* use emoji
* use markdown in character dialogue
* give medical, legal, or financial advice
