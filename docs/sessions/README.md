# Session archive

One file per session, **append-only**: never edit or overwrite a past session's file. Root `HANDOFF.md` always points at the newest one.

**Naming:** `YYYY-MM-DD-<harness>-<topic>.md` — e.g. `2026-07-10-cursor-storage-glow.md`. Two sessions same day, same harness? Add `-2`.

## Template

```markdown
# <Topic> — session summary
**Date:** YYYY-MM-DD
**Harness / model:** [Cursor / Grok 4.5]
**Branch:** <branch> (merged to main: yes/no — if no, why)

### Done
### Still broken / unfinished (do next)
### Do not
### Quick verify   ← how to see the work working, in one step
### Suggested next-session order
```

Close-out ritual (what to update, in what order): `docs/ai-team/end-here.md`.
