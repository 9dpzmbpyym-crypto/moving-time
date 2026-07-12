# Latest handoff

→ **`docs/sessions/2026-07-12-claude-ui-redesign-overnight.md`** (Claude — full UI redesign from mockups + fix passes; all merged to main)

**main = live-ready.** Four screens rebuilt from mockups (Overview, Command Board chrome, Apartment HUD, Body Board) + all reported fixes (white boxes, text overflow, body-board proportions, centered room names). Stretchy + task cards intentionally untouched. Deploy is Eloisa's (`npx vercel --prod` / dashboard).

**Next up:** **Part 7 — task↔gameplay wiring** (packing/selling auto-completes the bound task; health tasks drive the Health screen + share Shirley's flow). Spec: `docs/inbox/chat-gpt-connecting-tasks-to-gameplay-suggestions.md`. A partial attempt sits in `git stash` ("part7-wip-incomplete") — recommend a FRESH run. Plus any small Body-Board fine-tuning from a screenshot.

---
*Session reports live in `docs/sessions/`; see `docs/ai-team/end-here.md`.*

## Open punch list (Eloisa, Jul 12 — next sessions)
**UI redesign still needed** (not yet touched, apply the mockup/tactile-prop language): **Stretchy screen · Ledger · Inventory · Desk/Admin · Settings** — plus any other screen not yet reskinned.
**Ledger:** add **sort-by-urgency**, calculated with our urgency algorithm (`urgencyScore`/`taskStatus` in `schedule.js`).
**Part 7 — task↔gameplay wiring (big):** link tasks to the rest of the game — packing/selling an item auto-checks its task, Shirley checks off appointments, health tasks drive the Health screen, etc. Spec: `docs/inbox/chat-gpt-connecting-tasks-to-gameplay-suggestions.md`; partial attempt in `git stash` (recommend fresh run).
**Still-broken text (revisit):** Overview + apartment HUD text still **skewed / oddly placed** — the earlier pass improved but did not fully resolve it; needs another careful placement pass (fit-to-box, vertical centering within the wood panels, no skew).
