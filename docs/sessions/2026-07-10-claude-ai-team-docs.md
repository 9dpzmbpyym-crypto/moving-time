# AI team operating model + docs/branch reorganization — session summary
**Date:** 2026-07-10
**Harness / model:** [Claude / Fable 5, with Sonnet 5 sub-agents for graph QA + doc inventory]
**Branch:** `claude/say-hi-b1ijhk` (merged to main: yes — with this reorg)

### Done
- Redesigned the AI dev team org chart (HTML, light/dark, packing-manifest style) after the broken v3 PNG; published as `docs/ai-team/org-chart.html`
- Wrote the full operating model `docs/ai-team/README.md`: harness hierarchy, self-ID protocol (incl. budget-state check), commit-authority ladder, task routing, sub-agent delegation contract, model-switching format
- Corrected the benchmark set: fixed harness labels to match the org chart, added Composer 2.5 (flagged Fable estimates), rebuilt all 13 scatter graphs (symlog cost axis, credit-class colors, validated palette); Sonnet sub-agent QA caught one clipped label, fixed
- Wrote `model-routing.md` (roster-only recommendations superseding the old CSV advice)
- Team folders: `docs/ai-team/teams/{cursor,codex,claude,chatgpt}/` — per-team start-here docs, playbooks (Claude's written; Cursor/Codex stubs awaiting their leads), ChatGPT paste-brief
- Session lifecycle: `end-here.md` close-out ritual + this append-only `docs/sessions/` archive
- Branch model adopted: `main` = canon, standing `cursor`/`codex` team branches, Claude merges per-session branches; 8 stale branches archived as tags and deleted
- Consolidated 4 duplicate instruction files: `AGENTS.md` is the single full copy; `CLAUDE.md`, `replit.md`, `.cursor/rules/pack-it-up.mdc` are thin shims

### Still broken / unfinished (do next)
1. Grok writes `teams/cursor/playbook.md`; Codex Sol writes `teams/codex/playbook.md` (prompts in `lead-prompts.md`)
2. Composer 2.5 real benchmarks — Eloisa fetching; swap the flagged estimates in `data/model-task-scores.csv` + regenerate graphs
3. Game work continues from `FINISH_PLAN.md` Open next (glow rects, Shirley prompt, SFX, Vercel)

### Do not
- Re-split the instruction files back into four copies — edit `AGENTS.md`, shims only point
- Overwrite files in `docs/sessions/` — append-only
- Route work to off-roster benchmark models (DeepSeek/Kimi/Qwen rows are reference data)

### Quick verify
`docs/ai-team/org-chart.html` opens standalone in a browser; `git branch -r` shows `main`, `cursor`, `codex` only; every path in `AGENTS.md` resolves.

### Suggested next-session order
1. Paste lead prompts into Cursor + Codex (playbooks get written)
2. Swap Composer benchmarks when available
3. Back to the game: glow rects first
