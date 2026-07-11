# Cheap API Model Strategy

## Purpose

The app runtime should use a custom API key with a cheap or free model. These guides are not written for expensive script-generation models at runtime.

Use stronger models only outside the app to write or review the guides. The runtime model should be cheap, constrained, and replaceable.

## Recommended runtime approach

Primary design:
* deterministic task state machine
* curated fallback line banks
* cheap model call only for short variation
* strict JSON response format
* one NPC message at a time

The model should not plan the move. The app already has the move spine.

The model should not decide medical, legal, financial, or safety questions. It should ask for status updates and route the task.

## Candidate runtime models

Use whichever is cheapest and stable in the actual API setup.

Likely candidates:
* DeepSeek chat model
* GLM model
* Grok model if already available through the user's key or plan
* Luna only if quality justifies cost
* any other cheap OpenAI-compatible chat model that can follow short prompts and JSON

Do not hardcode the model choice into the design. Make the model configurable.

## What the cheap model receives

Give it only:

* NPC identity
* current task
* current task status
* due date
* days until due
* one or two relevant facts
* allowed state updates
* short NPC voice guide
* output schema

Do not give it the entire master goals file on every call.

## What the cheap model returns

Required JSON:

{
  "npc_message": "short in-character message",
  "optional_state_update": null,
  "should_end_call": true
}

If JSON parsing fails, use fallback line bank.

## Suggested low-cost settings

Use:
* low or moderate temperature
* short max output
* no streaming required
* response format JSON if supported
* stop after one message

Avoid:
* long conversation history
* sending all docs every time
* multi-NPC prompts
* open-ended brainstorming
* asking the model to rank all jobs
* asking the model to create new mechanics

## Fallback bank requirement

Every NPC needs fallback lines for:

* not started
* scheduled or submitted
* overdue
* due tomorrow
* completed
* stalled
* call ending

If live model output is bad, the app should still work.

## Testing cheap models

For each candidate model, run the same test pack:

1. Shirley asks about an unscheduled IUD appointment.
2. Shirley follows up after an appointment date passed.
3. Sal calls because no packing was done in two days.
4. Sal warns not to pack the router.
5. Vivian follows up on a job after seven days.
6. Vivian rejects a direct-service role as poor fit.
7. Player stalls twice.
8. Player reports completion.

Pass criteria:
* response is short
* no em dashes
* no markdown
* no medical advice
* correct character voice
* correct task focus
* valid JSON
* no repetition of exact example lines unless fallback mode

## Recommendation for implementation

Start with fallback banks and one cheap model behind a config flag.

Example config:
* `NPC_AI_ENABLED=false`
* `NPC_AI_PROVIDER=openrouter`
* `NPC_AI_MODEL=deepseek-or-glm-placeholder`
* `NPC_AI_MAX_TOKENS=120`
* `NPC_AI_TEMPERATURE=0.6`

Grok should not spend time optimizing model selection first. Implement the interface so models can be swapped.
