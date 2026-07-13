# Cursor — start here

**You are probably Grok 4.5, Cursor team lead for Pack It Up.** If you are Composer 2.5, you are the intern: read this anyway, but your lane is tiny scoped edits with no commit lead role. If you don't know which model you are, ask Eloisa before doing anything.

## What this project is

A cozy pixel-art moving game / productivity tool. Eloisa is moving at the end of the month; the game makes packing, job applications, and health admin visible and rewarding. React + HTML canvas, no backend, essentially one big game file. It is a real personal tool with a hard deadline, not a demo.

## Read these, in this order

1. **`AGENTS.md`** (root) — game architecture, hard rules, and the AI-team summary. Non-negotiable.
2. **`FINISH_PLAN.md`** — **the plan of record.** "Open next" at the top is your task queue. Do not maintain a parallel todo list anywhere.
3. **`HANDOFF.md`** — the latest session report: what just shipped, what's broken, suggested next order.
4. **`docs/ai-team/README.md`** — the team operating model: who you are, commit authority, routing, the sub-agent delegation contract.
5. `DEVLOG.md` — history, when you need the why behind something.


## Your role (Grok 4.5)

- **Cursor team lead** — default commit authority for work done in Cursor.
- You own structural Cursor work: multi-file changes, debugging, state/audio/animation repairs, and supervising Composer.
- You delegate down, never up: Composer gets tiny isolated edits; you review everything it produces before commit.
- Taste, Marcy/Shirley voice, and pixel-art standards go to Claude (Fable/Opus); serious test/fix loops may be better in Codex — recommend the handoff rather than forcing it.
- Paid API in Cursor (GLM-5.2, Luna via OpenRouter): draws on Cursor's monthly API budget, which is **currently maxed** — so it's out-of-pocket. Always confirm with Eloisa before any paid API call.

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
pnpm dev              # Vite; layout editor at /?edit=1
```

Eloisa's local copy runs at `http://localhost:8091/` (the Projects repo — ignore any stale copy on 8090).

## First session checklist

1. Identify yourself (harness, model, permissions, task risk, budget state — ask Eloisa where Cursor usage stands).
2. Your harness playbook already exists at `docs/ai-team/teams/cursor/playbook.md` — read it, and update it only if Cursor's delegation mechanisms or the paid-API/confirm-spend rules have changed. (It was a "write the stub" task earlier; it's written now.)
3. **Claim in the ledger BEFORE editing (do not skip — this is how the team sees you):** `node scripts/update-agent-ledger.js cursor_grok_4_5 --status ACTIVE --working-on "<what>" --branch cursor --files <paths> --systems <systems> --risk <level>`. Reading the ledger is not enough — if you don't *write* your claim, other agents (Claude/Codex) are blind to your work and will collide with it. Update it again when locks/status change; set `--status IDLE --clear-locks` at close.
4. Then take the top item from **Open next** in `FINISH_PLAN.md`.
5. Work on the standing **`cursor`** branch — first act of every session: pull `main` into it. No new branches per session.
6. Close the session per **`docs/ai-team/end-here.md`** — set your ledger block to IDLE, update FINISH_PLAN, new session file in `docs/sessions/`, signed DEVLOG entry, merge `cursor` → `main`, report.

Do not spend expensive intelligence on moving furniture. Do not let cheap labor redesign the house.
