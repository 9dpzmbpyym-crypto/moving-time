# End here — session close-out (every harness)

A session is not done when the code works. It's done when the next agent — probably a different model in a different harness — can pick up from `main` without asking Eloisa what happened. Run this checklist before you stop.

## 1. Update the plan of record

- Check off completed items in `FINISH_PLAN.md`; add genuinely new work to **Open next**, tagged with your team: `- [ ] [cursor] Tune glowRegions…`
- Do **not** start a todo list anywhere else. One plan file, forever.

## 2. Write the session summary — a NEW file, never overwrite

Create `docs/sessions/YYYY-MM-DD-<harness>-<topic>.md` using the template in `docs/sessions/README.md`. Past session files are never edited. Then point root `HANDOFF.md` at it:

```markdown
# Latest handoff
→ docs/sessions/YYYY-MM-DD-<harness>-<topic>.md
Next up: <one line>
```

## 3. Append the dev log — signed

Add today's entry near the top of `DEVLOG.md`, header signed with your harness and model:

```markdown
## 2026-07-11 — [Cursor / Grok 4.5]
- <what shipped, one line per commit>
```

```bash
git log --since=midnight --pretty=format:"- %s" -- artifacts/pack-it-up/
```

Note uncommitted work separately until it's committed.

## 4. Update your playbook (if you learned something)

If delegation failed in a new way, or a sub-agent pattern worked well, record it in `docs/ai-team/teams/<harness>/playbook.md`. Playbooks stay alive or they rot.

## 5. Merge to main

- Commit on your team branch (`cursor` / `codex`) or Claude session branch; clear messages; **never force-push**.
- **Leads merge their own branch into `main`** — that merge *is* the approval step, and it must contain your signed DEVLOG entry. Eloisa reviews after the fact.
- Claude sessions: merge the auto-created `claude/...` branch to main, then delete it.
- A session ends **merged to main, or with a HANDOFF line saying why not** (e.g. work-in-progress too risky to land — say what's unfinished).

## 6. Report to Eloisa

Three sentences: what shipped, what's broken, where usage stands for your harness. Not a wall of text — she has a move to pack for.
