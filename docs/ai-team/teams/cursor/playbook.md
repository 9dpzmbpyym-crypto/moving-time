# Cursor harness playbook — sub-agents

**Owner:** Grok 4.5 (Cursor team lead). Composer 2.5 is the intern; Eloisa approves playbook edits.
**Scope:** how delegation works when Grok (or Composer) runs inside Cursor IDE / Cursor Agent. This describes mechanisms that exist today — do not invent Task types or models.

## What exists here

Cursor Agent can spawn **Task** sub-agents (separate context windows) and can also hand work to **Composer** by recommending a model switch (Composer does not inherit Grok’s commit authority).

### Task sub-agent types (actual roster)

| Type | What it’s for | Can edit files? |
|---|---|---|
| `explore` | Fast read-only codebase search / “where does X live?” | No |
| `generalPurpose` | Multi-step research or edits when fan-out is real | Yes (if not `readonly`) |
| `shell` | Command-heavy work (git, builds, scripts) | Via shell only |
| `cursor-guide` | Questions about Cursor product itself | No |
| `ci-investigator` | One failing PR check → short root-cause | No |
| `bugbot` | Bugbot-style review of local diffs — **only if Eloisa asks** | No |
| `security-review` | Security review of local diffs — **only if Eloisa asks** | No |
| `best-of-n-runner` | Isolated worktree experiments | Yes (own worktree) |

Sub-agents start cold. Every spawn re-derives project context — pay that cost only when Grep/Read in the lead chat is genuinely worse.

### Composer vs Task

| Path | Use when | Edits? | Commits? |
|---|---|---|---|
| **Grok does it** | Structural / debugging / multi-system / anything in BedroomSlice that needs judgment | Yes | Grok leads |
| **Task `explore`** | Fan-out search across many angles or large files | No | N/A |
| **Task `generalPurpose` / `shell`** | Bounded multi-step grunt the lead will review | Sometimes | Still Grok’s commit |
| **Switch chat to Composer 2.5** | Tiny isolated patch (one obvious edit, clear done-condition) | Yes | **Never** — Grok or Eloisa reviews + commits |
| **Paid API model in Cursor** (GLM / Luna via OpenRouter) | Overflow only | Yes | Ask Eloisa first — API budget is often maxed / out-of-pocket |

## Model choice per Task spawn

If Eloisa names a model for a Task, use only roster slugs Cursor exposes. Prefer cheaper workers for furniture-moving:

| Sub-agent model (when choosing) | Use for |
|---|---|
| **Composer 2.5** | Tiny delegated edits inside a Task, or recommend switching the main chat to Composer |
| **Grok (default)** | Lead work; don’t spawn Grok-tier Tasks for searches |
| **Sonnet / other listed workers** | Only when Eloisa asks or the Task truly needs that bench |

Default: inherit the lead model only when the Task needs lead-level judgment — which usually means **don’t delegate it**.

## When Grok does it vs delegates (FINISH_PLAN examples)

1. **Do it yourself (Grok)**  
   - Tune `glowRegions` on fridge/pantry/closet until they match bar-cabinet door halos — visual judgment + BedroomSlice edits.  
   - Wire Shirley FSM / call UI / save fields — structural game state.  
   - Debug “audio died after sleep” / wrong Vite root on 8090 vs 8091.

2. **Delegate to Composer (or a tiny Task)**  
   - Rename a field, add one CONTENTS entry, tweak a copy string Eloisa already approved.  
   - Insert an SFX path into an existing play map after Grok chose the wiring.  
   - Done-condition must be one sentence; Grok reviews the diff before commit.

3. **Hand off out of Cursor (don’t force it here)**  
   - Shirley **voice bible / taste** → Claude Fable (prompt + review); Grok implements approved lines only.  
   - Long test/fix loops or multi-harness CI grind → Codex Sol.  
   - Pure diagnosis with no repo access needed → ChatGPT Sol for a paste-ready ticket.

## House rules

1. **Default is no Task.** BedroomSlice is one file; most answers are a Grep away. Spawn only for real fan-out, parallel explores, or when Eloisa asks.
2. **Explore before editing Tasks.** Read-only first. An editing sub-agent is a last resort; its diff is still Grok’s responsibility.
3. **Delegation brief = handoff:** scope, risk (`tiny` / `routine` / `structural` / …), edits allowed, done-condition. If it drifts, take findings — not unsupervised commits.
4. **Never delegate taste, voice, or “does this glow look right?”** That’s lead + Eloisa (and Fable for voice/pixels).
5. **Composer never leads commits.** Grok reviews, then commits on the team branch.
6. **Paid API confirm-spend rule:** before any OpenRouter / non-native Cursor API model, ask Eloisa. Native Grok/Composer credits first. If API budget is maxed, do not silently burn out-of-pocket.
7. Playbook edits: propose in-session; Eloisa approves; commit message says what changed.

## Budget / usage checks

At session start (and mid-long sessions), know the meter:

1. If Cursor shows usage/credits, read it.  
2. If not visible, ask: *“Where is Cursor usage at right now? Is the monthly API budget still maxed?”*  
3. Route paid overflow only after a clear yes. Prefer Codex credits for Luna-shaped work when Cursor API is maxed.

## Known failure modes

- **Sub-agent “done” ≠ Eloisa-visible answer** — relay conclusions; don’t just say the Task finished.  
- **Review Tasks invent issues** — ask falsifiable questions (“does fridge use `.portal`?”), not “review the glow.”  
- **Composer redesigns the house** — if the brief is vague, Composer will “improve” architecture. Keep briefs tiny and file-scoped.  
- **Wrong Vite root / stale server** — Projects repo on `8091`; ignore Downloads copies on `8090`. Confirm before debugging “missing” audio.  
- **Parallel BedroomSlice editors** — one FINISH_PLAN lane at a time; small frequent merges to `main`.  
- **Standing branch drift** — first act: pull `main` into `cursor` (or current Cursor team branch). Don’t pile session branches.  
- **Duplicate audio tree** — never commit `artifacts/pack-it-up/src/assets/audio/`; `public/assets/audio/` is home.

## Commit & close reminder

Grok leads commits for Cursor work. Close per `docs/ai-team/end-here.md`: update `FINISH_PLAN.md`, new `docs/sessions/` file, signed `DEVLOG.md` entry, merge team branch → `main`.
