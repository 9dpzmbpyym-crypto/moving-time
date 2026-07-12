# Handoff → Codex Sol (paste this whole file as the task prompt)

You are Codex Sol. Pull `main` into the `codex` branch first; never work on `main`.
Mark yourself ACTIVE in `artifacts/agent_ledger.json`.

TASK — the full scheduler engine. **Ship bar: usable TONIGHT/TOMORROW** (Eloisa's
call). Read, in order:

1. `docs/design/scheduler-adoption.md` — Fable's ruling: what's adopted, the bar,
   4 binding amendments. This file wins on priority/sequencing.
2. `docs/inbox/chatgpt-productivity-structure-for-claude-7-11.md` — the complete
   implementation spec (schema, urgency, backward scheduler, recurring cards,
   furniture state machine, all real dated task data). Implement the delta;
   preserve everything working (board, ledger, quick-add, energy, housing lane).
3. `docs/inbox/chatgpt-pressure-calls-overdue-ui-suggestions-7-11.md` — pressure
   visuals ride commit 4; the call system is a LATER pass (Sal/Vivian layer). Do
   not build calls now.

## The cut (re-sequenced for the bar)

- **Commits 1–3 per spec §20** (schema+migration+real data → urgency/status/
  dependencies → backward scheduler + persisted daily deal), then **minimally
  wire into the EXISTING Command Board**: bound cards preselected and
  un-discardable, "minimum today: N points" line, correct OVERDUE badges.
  **That = usable. Stop and report there.**
- Commit 4 (card-draft presentation + graduated pressure visuals) and commit 5
  (object/card sync, furniture state machine) come after Eloisa confirms the bar.
- Fallback if slipping: commits 1–2 alone (the real dated data is half the value).

## Fable's binding amendments

1. **Extend the existing Ledger editor** (`Screens.jsx` ~1107) to `targetDate` /
   `latestDate` (+ show `estimatedLatest`). Re-dating ≤2 taps + typing. No new editor.
2. **Every bound card explains why in one line** ("Latest is Jul 14 and tomorrow
   is full").
3. **Tone guard:** "fixed day. these cards are already spoken for." — never
   "you must complete N points." Fumes days get *quieter* atmosphere even when
   the floor is high.
4. **Save protection absolute** (spec §1/§17): never wipe, never change the
   `pack-it-up-save` key, backup key before migration, migration tested against
   a copy of the current production v2 save. Branch-only; NO prod push — report
   per spec §21 and Eloisa decides.

## Constraints

- No new deps; no Tailwind; game code in existing files (`movePhase.js` already
  exists — extend it). Dev tools stay in `src/dev/`.
- Do not rebuild the Command Board/energy flow — wire into it.
- The card pixel-match ticket is SEPARATE — do it after the bar, not mixed in.
- Typecheck + production build green before every commit. Close out per
  `docs/ai-team/end-here.md` (session file, signed DEVLOG, merge codex → main —
  merge is fine; prod/Vercel push is Eloisa's).
