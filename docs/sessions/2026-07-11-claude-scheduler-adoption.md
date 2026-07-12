# Scheduler adoption ruling — session summary
**Date:** 2026-07-11 (evening mini-session)
**Harness / model:** [Claude / Fable 5; Opus 4.8 earlier for review]
**Branch:** `claude/team-onboarding-b0c4c9` (recreated; merged to main: yes)

### Done
- Reviewed both ChatGPT inbox notes (scheduler spec + pressure/calls). **Adopted with 4 binding amendments** — ruling in `docs/design/scheduler-adoption.md`: editable reality (extend existing Ledger editor to target/latest), explainable bindings, tone guard, absolute save protection.
- Re-cut the spec's 5-commit sequence for Eloisa's bar (**usable tonight/tomorrow**): commits 1–3 + minimal wiring into the existing board = ship; presentation + object-sync after; fallback = commits 1–2 alone.
- Ticketed at top of FINISH_PLAN Open next; card pixel-match resequenced after the bar. Paste-ready Codex prompt: `docs/inbox/handoff-codex-scheduler.md`.
- Card-overlay drift diagnosed (Opus): designer 420/220px vs live 120px = two render paths; fix = one component, one scale factor (told to Eloisa for the Codex card session).

### Do next
1. **[eloisa]** Paste `docs/inbox/handoff-codex-scheduler.md` into Codex.
2. After the bar: card pixel-match, then commit 4/5.
3. Kitchen calendar portal + HUD chips still queued (Codex leftovers).

### Do not
- Build the call system yet (Sal/Vivian layer, after scheduler).
- Prod-push from any agent — phone URL is canon, Eloisa decides.
