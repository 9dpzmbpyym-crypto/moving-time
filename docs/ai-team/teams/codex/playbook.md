# Codex harness playbook — sub-agents

**Owner:** GPT-5.6 Sol in Codex (team lead). Luna and Terra are workers; Sol owns their output, review, commits, and merges.

## What exists here

Codex can spawn independent agent threads and collect their summaries in the lead thread. Pack It Up defines two project agents in `.codex/agents/`:

| Agent | Model / effort | Use | Edits |
|---|---|---|---|
| `project_explorer` | GPT-5.6 Terra / medium | Repository mapping, dependency tracing, test-gap analysis | No — read-only |
| `luna_worker` | GPT-5.6 Luna / high | Narrow, pre-approved implementation tickets | Yes, within the ticket; never commits |

Invoke the exact agent name. If the configured agent or pinned model is unavailable, stop and tell Eloisa; never silently substitute the default worker or another model. Sub-agents start with their own context, so every ticket must restate the relevant constraints.

## When Sol delegates

**Default: no delegation.** Use a sub-agent only when Eloisa asks, an approved ticket names one, or independent read-heavy work materially protects the lead thread from noisy output. Never run parallel writers in `BedroomSlice.jsx`.

- Keep architecture, ambiguous debugging, save/load, cross-system state, taste decisions, and final verification with Sol.
- Use `project_explorer` for questions such as tracing every `glowRegions` consumer or mapping the audio path before a change.
- Use `luna_worker` for a ticket such as replacing one approved SFX mapping or implementing an already-decided, narrow UI adjustment.
- The current glow-region tuning stays with Sol or Cursor because it combines visual judgment with one-file conflict risk. Shirley voice stays with Fable/Opus until its ruleset is approved.

Luna receives a ticket only when all are true: the behavior and file scope are explicit; acceptance criteria and verification are supplied; no architecture decision remains; no hidden cross-system behavior is expected; and a lead has approved the plan. `high` is the normal effort. Do not raise effort to compensate for an unclear ticket—return it to Sol.

## Delegation contract

Every prompt states: scope, risk, files allowed, whether edits are allowed, forbidden changes, done-condition, verification command, and the concise evidence to return. A worker that discovers ambiguity or out-of-scope dependencies stops without improvising.

Sol reviews the complete diff, checks scope, reruns verification, and explains the result to Eloisa. A worker never stages, commits, pushes, switches branches, merges, or edits session/plan records. Delegation never raises authority: all landed work is Sol's responsibility.

## Usage and failure handling

At session start, record the visible five-hour and weekly allowance; ask Eloisa only when Codex does not expose it. Re-check before expensive fan-out and report remaining usage at close-out. Prefer one focused agent over broad parallelism.

Known failure modes: vague “review” prompts manufacture findings; cold agents miss constraints; overlapping writers conflict in the monolithic game file; successful builds can hide behavioral regressions; raw logs pollute the lead context; silent model fallback defeats routing. Prevent these with falsifiable tickets, exact agent names, serialized writes, lead-run behavioral checks, and summarized evidence.
