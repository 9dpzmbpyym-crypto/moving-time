# Latest handoff

→ **`docs/sessions/2026-07-12-codex-body-board-apartment-text.md`** (Codex — screenshot-driven Body Board geometry + apartment text correction)

**Body Board correction is ready:** anatomical zone placement now matches the enlarged figure, OB/GYN stays above the paper and is selectable, and selected content is inset correctly on the raised sheet. Apartment changes are text-only: HUD values and room labels were repositioned inside existing chrome. No Vercel deploy was requested.

**Next up:** phone-check this correction after the next deploy, then continue Part 7 task↔gameplay wiring or the remaining UI reskins.

---
*Session reports live in `docs/sessions/`; see `docs/ai-team/end-here.md`.*

## Open punch list (Eloisa, Jul 12 — next sessions)
**UI redesign still needed:** **Stretchy screen · Ledger · Inventory · Desk/Admin · Settings** — plus any other screen not yet reskinned.
**Ledger:** add **sort-by-urgency**, calculated with `urgencyScore`/`taskStatus` in `schedule.js`.
**Part 7 — task↔gameplay wiring:** link tasks to packing/selling, Shirley appointments, and health state. Spec: `docs/inbox/chat-gpt-connecting-tasks-to-gameplay-suggestions.md`; start fresh rather than relying on the incomplete stash.
**Apartment HUD text:** screenshot correction pass completed Jul 12; re-check on the deployed phone build after the next deploy.
