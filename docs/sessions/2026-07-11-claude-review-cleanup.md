# Playbook reviews, file-organization audit, branch cleanup — session summary
**Date:** 2026-07-11
**Harness / model:** [Claude / Fable 5, with Sonnet 5 sub-agents earlier in the session]
**Branch:** `claude/say-hi-b1ijhk` (merged to main: yes)

### Done
- **Reviewed Codex Sol's onboarding: exemplary.** Playbook matches the delegation contract; pinned agents (`luna_worker` Luna/high write-scoped, `project_explorer` Terra/medium read-only) with a no-silent-fallback rule; 3-thread/1-depth caps; recorded real usage; proper session file; merged via its own `codex` branch. Watch-item (theirs): custom agents only load in a fresh *trusted* Codex task.
- **Reviewed Grok's playbook (on its unmerged branch): excellent content.** Real Cursor Task roster, Composer-vs-Task decision table, actual Pro usage pools (Auto+Composer 41% / API 100%), IDE settings table, plain-English roster. Ritual gaps (no session file / signed DEVLOG) are explained by its branch predating those files — backfills at its own close-out.
- **Answered Grok's 5 review notes** (to be folded into its playbook after merge): 1) API-maxed routing confirmed — stay first-party, Luna-shaped overflow → Codex credits; 2) Explore=Composer + chat=Grok confirmed; 3) standing-branch smell real — swap sequence now in FINISH_PLAN; 4) glow = Fable judges screenshots/sets proportions, Grok edits rects; voice/pixels stay Claude; 5) Codex-stub note stale (Sol delivered) — remove.
- **File-organization audit:** 7 raw Epidemic Sound files violate the (otherwise good) audio naming convention — 5 in the audio tree, 2 uploaded to the repo root by mistake. Grok's branch already has sliced replacements for 3. Cleanup ticket with the full list added to FINISH_PLAN (`[cursor]`, Composer-sized, after merge). Naming rule added to `README_AUDIO_INDEX.txt`. `src/assets/audio/` duplicate correctly absent from git. Open flag for Eloisa: two stray screenshots in `attached_assets/` — move to `artifacts/pack-it-up/docs/` or delete?
- **Branch cleanup (blocked at the last step):** verified 5 stale branches have zero unmerged commits and 2 more are safely parked as `archive/*` branches — but the GitHub App token cannot delete branches (403), same as tag pushes. **Eloisa deletes them in the GitHub UI** (repo → Branches → trash icon): `chatgpt-version`, `claude/game-dev-setup-bhs0lt`, `claude/pack-it-up-polish-yln7jy`, `cursor/combine-local-with-replit-main`, `cursor/fix-vite-dev-server-7a01`, `cursor/local-updates-backup`, `cursor/tech-debt-housekeeping-7a01`. All are merged or archived; deleting loses nothing.

- **Triaged ChatGPT Sol's move-spine/NPC pack (inbox → `docs/move-spine/`).** Reviewed all 10 files; approved as the NPC voice source of truth (Shirley replacement, Sal, Vivian, Command Board spec, trigger rules, cheap-runtime-model strategy). Internal folder structure kept so the pack's read-order links work; self-referencing paths fixed to the real location; inbox zip deleted. FINISH_PLAN Shirley section now points at the landed guides and sequences implementation passes for Grok.

- **Voice pass on `docs/move-spine/` (Eloisa-flagged AI-tells).** Rewrote 9 dialogue lines across Sal/Shirley/Vivian that used "it's not X, it's Y" reframes or metaphor-swap zingers ("anxiety with corners", "concept of healthcare", "performance art", "metaphorical hallway", "file vibes", "call it strategy"); Eloisa's six approved Shirley calibration lines untouched. Added anti-tell rules to README_FOR_GROK, the runtime wrapper prompt, and the cheap-model test criteria so the runtime model doesn't regenerate the pattern.
- **Grok close-out review: textbook.** Session file, signed DEVLOG, HANDOFF refreshed, my 5 answers folded into its playbook, merged to main, Vercel live (moving-time.vercel.app). One nit (not fixed — append-only rule): its session file says the inbox is `artifacts/pack-it-up/docs/inbox/`; it's `docs/inbox/`.
- **Codex close-out review: accepted.** Built the agent-ledger coordination layer (`artifacts/agent_ledger.json` + updater + docs) while Claude was rate-limited; zero game-code changes; courteous resume note preserving Fable's design authority; proper ritual; self-merged. Ledger adopted — this session used it (claude_fable ACTIVE→IDLE). Light wording pass on ledger docs reserved for a future Claude session if needed.
- **Body Board v2 mockup taste review (Codex's ask): APPROVED as background plate.** Sparse walnut/brass clipboard with empty parchment center is the right direction — tactile prop, not a generic box; matches the wood/gold Screens.jsx language. Notes: corner parchment staining slightly "fantasy scroll," acceptable; verify pixel density against CELL=4 in-situ before wiring; next asset ask = body + 7 zone overlays as separate layers per Codex's spec.

### Still broken / unfinished (do next)
1. Grok session close: commit → session file → signed DEVLOG → merge → delete `cursor/storage-glow-7a01` → create standing `cursor` branch (sequence in FINISH_PLAN)
2. Codex session close for the Health-UI work (Eloisa prompts it)
3. Audio cleanup ticket (after #1)
4. Composer real benchmarks (Eloisa) → swap flagged estimates in `docs/ai-team/data/`
5. Fold the 5 review answers into Grok's playbook once it merges

### Do not
- Rename/delete the raw audio files before Grok's branch merges — its uncommitted wiring may reference them
- Create the standing `cursor` branch before `cursor/storage-glow-7a01` is deleted (git ref namespace blocks it)

### Quick verify
After Eloisa's UI deletions, `git branch -r` shows only: `main`, `codex`, `cursor/storage-glow-7a01`, `claude/say-hi-b1ijhk`, and the two `archive/*` branches.

### Suggested next-session order
1. Grok close-out + branch swap
2. Codex close-out
3. Audio cleanup ticket
4. Back to the game: glow (Fable judges, Grok implements) → Shirley voice → Vercel
