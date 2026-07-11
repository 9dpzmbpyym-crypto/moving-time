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
| **API-pool model in Cursor** (Claude/GPT/Gemini, Max Mode, BYOK) | Overflow only — burns **API** quota | Yes | Ask Eloisa first. Jul 10: API was **100%**; stay on Grok/Composer |

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

1. Open **Cursor Settings** (`Ctrl+Shift+J`) → **Plan & Usage**, or [cursor.com/dashboard/usage](https://cursor.com/dashboard/usage).
2. Read **both** Pro pools:
   - **Auto + Composer** (first-party: Auto, Composer, Grok) — preferred for Pack It Up.
   - **API** — Claude/GPT/Gemini/Max Mode / third-party; burns the included API $ then on-demand.
3. If Usage Summary isn’t visible in-chat: Settings → **Agents** → **Usage Summary** → **Always** (`cursor.composer.usageSummaryDisplay`: `"always"`).
4. Route paid / API-pool work only after Eloisa confirms. Prefer Codex credits for Luna-shaped work when Cursor **API** is maxed.

**Observed Jul 10, 2026 (Eloisa’s Pro):** Total ~55% · Auto+Composer **41%** · API **100%**. Until API resets or she approves on-demand: stay on **Grok / Composer / Auto**; do not pick frontier API models or Max Mode casually.

## Cursor IDE settings (team defaults)

Exact paths Eloisa should keep for this harness. GUI-only items have no reliable `settings.json` key unless noted.

| What | Path | Setting label | Value |
|---|---|---|---|
| Usage bar | Settings → **Agents** | **Usage Summary** | **Always** |
| Terminal autonomy | Settings → **Agents** → **Approvals & Execution** | run mode | **Auto-review** (not **Run Everything**) |
| Privacy | Settings → **General** | **Privacy Mode** | **On** |
| Lead chat model | Agent panel **model picker** (top of chat); also try Settings → **Models** | model | **Grok 4.5** for lead sessions; **Composer** only for tiny intern patches |
| Max context | Same model picker | **Max Mode** | **Off** unless a huge-context task is explicit |
| Explore worker | Settings → **Agents** → **Subagents** | **Explore subagent model** (may show as “automatic subagent”) | **Composer** / Cursor first-party — **not** the main chat brain |

### Default model vs Explore subagent (don’t confuse them)

- **Chat model picker = parent Agent** for this conversation. Selection **persists across new chats** until changed — that *is* the practical default. There may also be a default under Settings → **Models**; if the UI doesn’t show one, the sticky picker is enough.
- **Explore subagent model** only affects the built-in **Explore** Task when the lead auto-delegates search. It does **not** set the chat to Composer.
- Correct combo when API is maxed: chat = **Grok**, Explore subagent = **Composer/cursor**. Optional: Explore = **Inherit from parent** if you want Explore on Grok too (same first-party pool).

## Known failure modes

- **Sub-agent “done” ≠ Eloisa-visible answer** — relay conclusions; don’t just say the Task finished.  
- **Review Tasks invent issues** — ask falsifiable questions (“does fridge use `.portal`?”), not “review the glow.”  
- **Composer redesigns the house** — if the brief is vague, Composer will “improve” architecture. Keep briefs tiny and file-scoped.  
- **Wrong Vite root / stale server** — Projects repo on `8091`; ignore Downloads copies on `8090`. Confirm before debugging “missing” audio.  
- **Parallel BedroomSlice editors** — one FINISH_PLAN lane at a time; small frequent merges to `main`.  
- **Standing branch drift** — first act: pull `main` into `cursor` (or current Cursor team branch). Don’t pile session branches.  
- **Duplicate audio tree** — never commit `artifacts/pack-it-up/src/assets/audio/`; `public/assets/audio/` is home.
- **Confusing Explore setting with chat default** — “automatic subagent = cursor” is fine; it is not “I am Composer now.”

## Commit & close reminder

Grok leads commits for Cursor work. Close per `docs/ai-team/end-here.md`: update `FINISH_PLAN.md`, new `docs/sessions/` file, signed `DEVLOG.md` entry, merge team branch → `main`.

## Fable review answers (Jul 11) — folded in

Claude reviewed this playbook on `claude/say-hi-b1ijhk` and answered the five notes below. Treat these as locked ops:

1. **API maxed** — confirmed: stay first-party (Grok / Composer / Auto). Luna-shaped overflow → **Codex credits**, not Cursor on-demand API, unless Eloisa explicitly approves spend.
2. **Explore = Composer, chat = Grok** — confirmed intentional. Cheap search worker; lead stays Grok.
3. **Standing branch smell** — real. Close-out sequence (in `FINISH_PLAN.md`): merge `cursor/storage-glow-7a01` → `main`, delete the old branch (Eloisa UI if agents get 403), then create standing `cursor` from `main`.
4. **Glow / voice / pixels** — Fable judges screenshots and sets proportions; Grok edits `glowRegions` rects only. Shirley voice + pixel taste stay Claude.
5. **Codex stub note** — stale. Sol delivered `teams/codex/playbook.md`; remove any “Codex still a stub” language.

## Plain-English roster (who’s who)

**Boss:** Eloisa — product, taste, final yes/no.

**Cursor — main floor (this playbook)**  
- **Grok 4.5** ★ — team lead / repair tech. Builds and fixes the game in Cursor. Commits.  
- **Composer 2.5** — intern. Tiny patches only; never leads a commit.  
- Paid overflow (GLM / API Luna) — only if Eloisa says spend is OK.

**Codex — heavy machinery**  
- **GPT-5.6 Sol** ★ — senior engineer / team lead. Opens the hard stuff: multi-file work, stubborn bugs, test/fix loops. Commits.  
- **GPT-5.6 Luna** — implementation engineer. Builds from clear tickets; may commit only when the ticket is narrow and pre-approved.  
- **GPT-5.6 Terra** (if available) — mid-tier helper between Sol and Luna; same caution as Luna.

**Claude — design studio**  
- **Fable 5** ★ — creative director / principal. What “good” looks like; docs/design commits; voice & pixel standards.  
- **Opus 4.8** — senior taste reviewer.  
- Sonnet/Haiku — Claude Code interns for grunt search/QA.

**ChatGPT — front office**  
- **GPT-5.6 Sol** (chat) — exec assistant. Thinks and writes prompts/tickets; **cannot** edit the repo. (Same “Sol” name as Codex lead, different room.)

One-liner: Fable decides good · ChatGPT Sol writes orders · Codex Sol opens the machine · Grok runs the floor · Luna builds tickets · Composer moves the furniture.
