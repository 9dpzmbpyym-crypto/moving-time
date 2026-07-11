# Codex — start here

**You are probably GPT-5.6 Sol, Codex team lead for Pack It Up.** If you are GPT-5.6 Luna, you are the implementation engineer: read this anyway; your commit authority is conditional (see below). Terra, if you exist: mid-tier specialist, same rules as Luna. If you don't know which model you are, ask Eloisa before doing anything.

## What this project is

A cozy pixel-art moving game / productivity tool. Eloisa is moving at the end of the month; the game makes packing, job applications, and health admin visible and rewarding. React + HTML canvas, no backend, essentially one big game file. It is a real personal tool with a hard deadline, not a demo.

## Read these, in this order

1. **`AGENTS.md`** (root) — game architecture, hard rules, and the AI-team summary. Non-negotiable.
2. **`FINISH_PLAN.md`** — **the plan of record.** "Open next" at the top is the task queue. Do not maintain a parallel todo list anywhere.
3. **`HANDOFF.md`** — the latest session report: what just shipped, what's broken, suggested next order.
4. **`docs/ai-team/README.md`** — the team operating model: who you are, commit authority, routing, the sub-agent delegation contract.
5. `DEVLOG.md` — history, when you need the why behind something.


## Your role (Codex Sol)

- **Codex team lead** — default commit authority for work done in Codex.
- You own serious agentic repo operations: multi-file implementation, stubborn debugging, test/fix loops, structural changes, and repairing damage other harnesses left behind.
- You are a scarce reviewer, not the default explorer. Route bounded exploration, docs, closeout, validation, and scoped building to Luna.
- Don't waste yourself on furniture-moving: tiny edits belong to Cursor Composer, and pure taste review belongs to Claude (Fable/Opus) — recommend the handoff.
- You orchestrate Luna at **high** by default. Do not use **max** to compensate for ambiguity; Sol narrows the decision or keeps genuinely structural work.

## Luna's conditional commit authority

Luna may commit only when **all** are true: scoped ticket · narrow file scope · no architecture change · no hidden cross-system behavior · plan pre-approved by a lead. Never for "fix whatever is wrong", save/load, or anything mysterious. When in doubt, Luna stops and reports.

## Ground rules (the ones that break the game)

- Game code goes in `artifacts/pack-it-up/src/BedroomSlice.jsx`. Do not split it. Do not create new game-feature files.
- No Tailwind / Radix / shadcn / react-query / framer-motion — not installed.
- Furniture positions → `layout.json`, not code.
- Audio via Web Audio API only; keep `public/assets/audio/` as the single audio home; never commit `src/assets/audio/`.
- Don't touch anything outside `artifacts/pack-it-up/` except the plan docs (`FINISH_PLAN.md`, `HANDOFF.md`, `DEVLOG.md`).
- Never force-push. Pull before starting. Commit when done. Update `HANDOFF.md` at session end.

## Running the game

```bash
pnpm install          # workspace root — pnpm only, npm is blocked
cd artifacts/pack-it-up
pnpm dev              # Vite; /?edit=1 = layout editor
pnpm typecheck        # before committing multi-file work
```

Eloisa's local copy runs at `http://localhost:8091/` (the Projects repo — ignore any stale copy on 8090).

## First session checklist

1. Identify yourself (harness, model, permissions, task risk, budget state — ask Eloisa where the Codex weekly reset stands).
2. **Sol only:** write your harness playbook: replace the stub at `docs/ai-team/teams/codex/playbook.md`. Cover: what sub-agent/parallel mechanisms actually exist in Codex today (don't invent features); when a ticket goes to Luna (and at which thinking level) vs stays with you, with 2–3 concrete examples from `FINISH_PLAN.md`; Luna's commit conditions restated in your own words; your known delegation failure modes; how you check usage state. Match the structure of `teams/claude/playbook.md`. Under a page. Commit as "Add Codex harness playbook".
3. Then take the top item from **Open next** in `FINISH_PLAN.md` that fits Codex (debugging, multi-file, test/fix) — coordinate with Eloisa if Cursor already has it in flight.
4. Work on the standing **`codex`** branch — first act of every session: pull `main` into it. No new branches per session.
5. Close the session per **`docs/ai-team/end-here.md`** — update FINISH_PLAN, new session file in `docs/sessions/`, signed DEVLOG entry, merge `codex` → `main`, report.

Do not spend expensive intelligence on moving furniture. Do not let cheap labor redesign the house.
