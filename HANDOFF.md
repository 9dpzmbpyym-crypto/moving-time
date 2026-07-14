# Latest handoff

→ **`docs/sessions/2026-07-13-claude-opus-recovery-priority-cleanup.md`** (Claude/Opus — save recovery, priority fixes, cleanup)

**Shipped to `main` (all pushed, build + tests green):**
- **Save recovery**: Settings → **"Import / restore save…"** now works — paste a
  "Copy canonical mobile save" blob → Restore → reloads with everything back.
  Eloisa's full export is in the chat transcript; she pastes it after the next
  Vercel deploy. Her data is **not lost**.
- **Priority fixes**: pressure/Stretchy meter un-pinned (`taskPressure` was on the
  old 0–100 scale); self-imposed job deadlines no longer outrank real move work;
  removed dead `urgencyScore` code.
- **Criticality editable** in the ledger + **"Priority" sort**.
- **Binding uniqueness**: no item bound to two tasks (`p_death_cords` + 5 legacy
  coarse cards unbound); new `tests/binding-uniqueness.test.mjs`.
- **Cleanup**: −119 lines dead scheduler code; save flag-map pruned (~400 → few).

---
*Session reports live in `docs/sessions/`; see `docs/ai-team/end-here.md`.*

## Open / next

**✅ Desk real-cards — SHIPPED Jul 14** (`3912fd8`): INCOMING = six per-category
stacks faced by the actual `VerticalTaskCard`, FILED = real stamped cards, tap →
card lands in the **inspection tray** (no modal), stamp animation intact. The old
"desk-real-cards-wip" stash was superseded and dropped. **Standing guard: Desk
cards are the shared `VerticalTaskCard` — never a bespoke drawn card.**

**Tech-debt (next session / Codex):**
- `buildMinimumSchedule` is now test-only after the dead-chain removal.
- Legacy coarse tasks (`m_pack_kitchen/living`, `p_bedroom_capsule`,
  `p_bathroom_kit`, `p_close_office`) still in `INITIAL_TASKS`, unbound — candidate
  seed removal (her save keeps them as archived saved-only, so it's safe).
- Proper unused-export audit needs a `.mjs`-aware tool (grep missed test imports).

**Notes for Codex (priority lane):** all scheduler tests pass after the fixes +
cleanup. `urgencyScore` is now a criticality-weighted sort key (self-target
damped); `taskPressure` reads the deadline state machine, not the numeric score.
Criticality edits persist via `criticalityOverride` (honoured first in
`normalizeTask`).
