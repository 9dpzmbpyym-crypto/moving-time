# Scheduler engine — adopted with amendments

> **⚠️ Status (Jul 13, 2026): IMPLEMENTED, then partly REWORKED.** This ruling
> is historical. Codex shipped the engine, then replaced the daily-deal model and
> rewrote `urgencyScore`; Claude then re-fixed `taskPressure` (it read the old
> 0–100 scale) and restored the self-imposed-deadline cap. **The live behavior is
> `schedule.js` + `tests/schedule.test.mjs`, not this doc.** Keep for the design
> rationale (Ledger=deck / Board=hand, effort ⊥ criticality, "optional never
> outranks crit-3"), but do not treat the scoring details here as current.

**Owner:** [Claude / Fable 5] · ruling on `docs/inbox/chatgpt-productivity-structure-for-claude-7-11.md` (the implementation spec) and `docs/inbox/chatgpt-pressure-calls-overdue-ui-suggestions-7-11.md`.

## Verdict

**Adopt.** It's our design grown an engine: Ledger = deck, Board = today's hand, energy budgets, "optional work never outranks criticality-3." The backward scheduler ("minimum today so nothing becomes impossible") is the executive-function relief this app exists for. Target/Latest date windows, effort ⊥ criticality, bound cards, and compression-based pressure are all correct.

## Ship bar (Eloisa: usable tonight/tomorrow)

The **engine on the existing board** is the bar — not the pretty card-draft presentation:

- **Usable = spec commits 1–3** (schema + migration + real dated data → urgency/status/dependencies → backward scheduler + persisted daily deal) **minimally wired into the current Command Board**: bound cards preselected + un-discardable, "minimum today: N points" line, correct OVERDUE badges.
- **Commit 4** (card-draft presentation, graduated pressure visuals) and **commit 5** (object/card sync, furniture state machine) follow after the bar is met.
- **Fallback if slipping:** ship commits 1–2 alone — the real dated task data (furniture windows, landlord chain, vet chain, packing windows) is half the value on its own.

## Binding amendments (Fable)

1. **Editable reality.** The simulation rots the day real life slips and the dates can't follow. A ledger editor already exists (`Screens.jsx` ~1107: `due`/`dueDate` inputs + archive) — **extend it to `targetDate`/`latestDate`** (and `estimatedLatest` display). Re-dating stays ≤2 taps + typing. Do not build a second editor.
2. **Explainable bindings.** Every bound card answers "why?" in one line — "Latest is Jul 14 and tomorrow is full." · "Exact-date event today." If the player can't see why the math bound a card, they learn to distrust the one screen built to be trusted. (Spec already shows blocker reasons; bindings get the same.)
3. **Tone guard.** The math may be strict; the voice never is. "fixed day. these cards are already spoken for." ✓ — "you must complete 10 points" ✗. On fumes days the *atmosphere* gets quieter even when the fumes floor is honestly high. In-world stamps (BOUND, FINAL CALL), never productivity-app scolding.
4. **Save protection is absolute** — spec §1/§17/§21 rules (never wipe, backup key before migration, report before prod) are adopted verbatim. Branch-only until Eloisa closes the session; the phone URL is canon.

## Companion note (pressure / calls / overdue UI)

Adopted as design: graduated atmosphere (amber → red-brown → FINAL CALL pulse) replaces the constant red vignette; ≤2 live calls/day, ≤1 per NPC, voicemail overflow; call-state persisted so refreshes don't reroll; Stretchy signals stay restrained (restless idle, rare meow — fire alarm, not wallpaper). **Sequencing:** pressure *visuals* ride commit 4; the *call* system is the Sal/Vivian trigger layer — after the scheduler lands, per the implementation manifest. Caller lanes in the note match our NPC casting exactly.

## What I checked before ruling

- Date-editing exists today (edit + archive in Ledger) but only for the old single-date model — hence amendment 1.
- The spec preserves everything Grok shipped (board, ledger, quick-add, energy, housing lane, 10+5 meter) and says "implement the delta" — correct posture.
