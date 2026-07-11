# Latest handoff

→ **`docs/sessions/2026-07-11-codex-productivity-core.md`** (Codex — real task data, calendar spine, Pressure v2 core, safe save migration)

→ `docs/sessions/2026-07-11-claude-design-sprint.md` (Claude — move-spine design and sequencing)
→ `docs/sessions/2026-07-11-cursor-storage-env-props.md` (Cursor — storage fills, environment props, audio/phone)

**Next up:** Cursor finishes its active shared-file queue; Codex then reconciles `BedroomSlice.jsx` / `Screens.jsx`, wires Stretchy + housing consumers, and adds ledger/quick-add. Shirley Pass 1 still waits.

**Coordination:** Codex locks only `tasks.js`, `movePhase.js`, and `save.js`. Cursor must publish its own active ledger claim. Standing `cursor` branch still needs creation from current `main`.

**Vercel:** https://moving-time.vercel.app — phone smoke remains required. Phone saves must migrate, never wipe.

---
*Session reports live in `docs/sessions/`; see `docs/ai-team/end-here.md`.*
