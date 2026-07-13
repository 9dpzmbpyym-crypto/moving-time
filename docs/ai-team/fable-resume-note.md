# Fable resume note — AI-team docs and org chart

> **✅ COMPLETED — historical (closed Jul 13, 2026).** This resume trail is kept
> for history only. The pause is over and everything below landed: the AI-team
> docs/org-chart pass is done, the coordination ledger (`artifacts/agent_ledger.json`)
> is in daily use by every harness, and the Body Board shipped. **Do not "resume"
> this task** — there is nothing pending here. For a fresh session, start at
> `docs/ai-team/teams/claude/start-here.md`; the live queue is `FINISH_PLAN.md`.

Claude/Fable was paused because Eloisa hit the Claude usage limit during the AI-team docs/org-chart reorganization and design pass. While Claude was paused, Codex added a lightweight machine-readable coordination ledger so non-conflicting Cursor and Codex work could continue without replacing Fable's design direction.

## Read in this order

1. `AGENTS.md`
2. `HANDOFF.md`
3. `docs/ai-team/fable-resume-note.md`
4. `artifacts/agent_ledger.json`
5. `docs/ai-team/README.md`
6. `docs/ai-team/agent-ledger.md`
7. `docs/ai-team/teams/claude/playbook.md`

## Resume task

Finish and review the AI-team org chart/docs design, then reconcile Codex and Cursor additions made during the pause. Codex added the ledger JSON, its Node updater, focused documentation, harness reminders, and this resume trail. Cursor may have continued non-conflicting Cursor setup; verify its branch, session records, and ledger entry rather than assuming.

Do not overwrite or erase in-progress work from other harnesses. In particular, do not delete the ledger system unless Eloisa explicitly asks. Fable may rewrite its presentation and wording, but should preserve the live coordination function: status, locks, expiry, rate-limit state, and paid-API approval. Update `claude_fable` in the ledger before resuming.

## Current status for Fable

- **Claude:** `PAUSED_USAGE_LIMIT`; AI-team docs/org-chart pass remains resume-needed, not complete.
- **Codex:** installing the agent-ledger/playbook coordination layer; no game code changed.
- **Cursor:** may handle non-conflicting Cursor work; inspect current ledger/branch/session state on return.
- **Protected systems:** `docs/ai-team`, `AGENTS.md`, `CLAUDE.md`, `HANDOFF.md`, and `artifacts/agent_ledger.json`.

The ledger is a clipboard Codex installed while the design studio was closed. Fable still owns the wording and design of that clipboard system.

## July 11 reconciliation and Body Board review

Grok's merged storage/environment work is documented authoritatively in `docs/sessions/2026-07-11-cursor-storage-env-props.md`: storage contents; procedural router, cat bed, bowls, and amp; packable TV-hutch and coffee-table books; layout updates; a temporary standing guitar PNG; audio/phone polish; and Vercel deployment.

Codex added only the coordination ledger, its ESM updater, related documentation/cross-links, and an uninstalled Body Board review asset. Codex changed no game behavior.

### UI direction

Interfaces should feel like tactile props rather than generic boxes. For the Body Board, prefer one static plate plus a separate body, seven zone/organ overlays, reusable state markers, and coded UI/text. The first generated board was too ornate. The second pass is sparse and modular, with a wide empty parchment center and restrained walnut/brass framing; review `artifacts/pack-it-up/docs/mockups/body-board-background-v2-codex-review.png`. It still needs Fable's taste review before anyone installs or wires it into the game.
