# Live coordination ledger

The agent ledger is Pack It Up's lightweight, machine-readable whiteboard. It does not replace `FINISH_PLAN.md`, `HANDOFF.md`, `docs/sessions/`, or `DEVLOG.md`; it adds live-ish visibility into who is active, what is locked, and which usage limits affect routing.

**Location:** `artifacts/agent_ledger.json`
**Updater:** `scripts/update-agent-ledger.js`

## Required workflow

Every editing agent reads `AGENTS.md` and the ledger before changing files. A lead updates its agent block before work, when locks or status change, when blocked or rate-limited, and after work. Luna updates only for an explicitly assigned implementation ticket. Read-only explorers normally do not claim locks.

`files_locked` lists exact paths or deliberate globs. `systems_locked` protects broader concerns such as `agent-coordination`, `save-system`, or `org-chart`. Do **not** halt merely because another agent is ACTIVE on the same branch. Halt when file or system locks overlap, or when your task is structural and another structural task is active. Ask Eloisa rather than guessing about an overlap.

There is intentionally no PID: agents may run in different editors, clouds, sandboxes, or machines, so a local process ID would create false confidence. Use `last_seen` and `expires_at` instead. An expired entry is potentially stale, not automatically safe; inspect the branch/handoff and confirm before taking its locks.

## Usage and rate limits

Usage values are manual, approximate snapshots—not perfect telemetry. When a harness hits a limit, set its agent status and `rate_limited`, add `cooldown_until` when known, and leave a `handoff_needed` note. Correct the shared `usage` block manually when Eloisa provides a newer screenshot or reset time.

Paid API work, including Cursor OpenRouter GLM or Luna, requires explicit Eloisa approval. An available model is not approval to spend. Prefer subscription/native capacity recorded in the ledger.

## Examples

```bash
node scripts/update-agent-ledger.js codex_sol --status ACTIVE --working-on "Add agent ledger" --branch codex --files docs/ai-team/README.md,artifacts/agent_ledger.json --systems ai-team-docs,agent-coordination --risk routine

node scripts/update-agent-ledger.js codex_sol --status IDLE --clear-locks

node scripts/update-agent-ledger.js cursor_grok_4_5 --status RATE_LIMITED --rate-limited true --cooldown-until 2026-07-10T23:45:00Z
```

## Fable resuming after the usage limit

Fable reads `HANDOFF.md`, then `docs/ai-team/fable-resume-note.md`, then this ledger documentation. Before resuming the org-chart/docs pass, Fable updates `claude_fable` to ACTIVE with current locks and expiry. Fable retains design authority over the presentation and wording, while preserving the live coordination function unless Eloisa explicitly asks to remove it.
