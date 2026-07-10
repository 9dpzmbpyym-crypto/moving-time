# Claude harness playbook — sub-agents

**Owner:** Fable 5 (Claude team lead). Opus 4.8 may propose edits; Eloisa approves.
**Scope:** how sub-agents work when Claude (Fable/Opus) runs in Claude Code — web, desktop, or CLI. Plain claude.ai chat has no sub-agents; there, "delegation" means writing a handoff prompt for another harness.

## What exists here

Claude Code has an `Agent` tool that spawns sub-agents with their own context window. The types that matter for Pack It Up:

| Type | What it's for | Can edit files? |
|---|---|---|
| `Explore` | Fan-out read-only search: "find every place X happens in BedroomSlice.jsx" | No |
| `Plan` | Drafting an implementation plan for a bounded task | No |
| `general-purpose` | Multi-step work that needs tools end-to-end | Yes |

Sub-agents start cold — they haven't read this conversation. Every spawn pays a context re-derivation cost.

## Model choice per sub-agent

Sub-agents can run a cheaper model than the lead — this is the Claude team's intern bench, and it should be used when relevant:

| Sub-agent model | Use for |
|---|---|
| **Opus 4.8** | Second-opinion taste review, prose polish — judgment work that isn't final authority |
| **Sonnet 5** | The workhorse intern: routine multi-step work, searches, doc/graph QA |
| **Haiku 4.5** | Trivial mechanical checks and transforms |

Default spawns inherit the lead's model (Fable) — expensive. Override down unless the delegation genuinely needs Fable-level judgment, in which case reconsider delegating it at all. This bench fills the org chart's "Connect / light worker" slot: it exists whenever Claude runs in Claude Code.

## House rules

1. **Default is no sub-agent.** BedroomSlice.jsx is one file; most questions are a `Grep` away. Spawn only when the task genuinely fans out (many files, many search angles) or when Eloisa asks.
2. **Explore before general-purpose.** Read-only search answers most delegations. An editing sub-agent is a last resort in this harness, because per the commit ladder Claude does not lead repo-code commits — anything a sub-agent edits still has to land through Grok/Codex Sol or an explicit instruction from Eloisa.
3. **Delegation brief is a handoff**: scope, risk, edits allowed (usually "no"), and a done-condition. Sub-agents that drift get their findings taken, not their diffs.
4. **Never spawn a sub-agent to make a taste decision.** Taste is why the Claude team exists; delegating it defeats the roster.
5. Playbook edits: propose in-session, Eloisa approves, commit message says what changed.

## Known failure modes

- Sub-agent results return to the lead, not to Eloisa — the lead must relay conclusions, not just say "done."
- A sub-agent asked to "review" will find *something*; give it a falsifiable question instead.
- Long chats + spawned agents burn Claude credits fast. If a delegation is bigger than one focused task, it probably belongs in Codex or Cursor, not in a Claude sub-agent.
