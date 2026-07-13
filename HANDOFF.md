# Latest handoff

→ **`docs/sessions/2026-07-12-codex-body-board-apartment-text-2.md`** (Codex — second screenshot pass for Body Board, Overview, and apartment text)

**Eloisa's editor layout is now canonical:** the final exported Body Board, apartment HUD, and Overview values are production defaults (`dateY: 0` from the final repeated copy). The selected-paper plus badge is gone, `N DAYS LEFT` sits under the date/time, and `/?ui=1` remains available for future tuning. Full build passes.

**Next up:** review the GitHub-triggered Vercel deploy, then continue the remaining UI reskins.

---
*Session reports live in `docs/sessions/`; see `docs/ai-team/end-here.md`.*

## Open punch list (Eloisa, Jul 12 — next sessions)
**UI redesign still needed:** **Stretchy screen · Ledger · Inventory · Desk/Admin · Settings** — plus any other screen not yet reskinned.
**Ledger:** add **sort-by-urgency**, calculated with `urgencyScore`/`taskStatus` in `schedule.js`.
**Part 7 — task↔gameplay wiring:** link tasks to packing/selling, Shirley appointments, and health state. Spec: `docs/inbox/chat-gpt-connecting-tasks-to-gameplay-suggestions.md`; start fresh rather than relying on the incomplete stash.

## Notes for Codex (Jul 13, Fable)
Three UI polish nits from live review are in FINISH_PLAN → Open next → "UI polish nits — [codex]": segmented apartment top HUD bar · Command Board "draws" copy should say effort · Command Board empty pre-pick void.

### ⚠️ Codex — pull `main` before you merge (Claude landed on main, Jul 13)
- **Splash screen** added: `main.tsx` (1 line) + new `SplashScreen.jsx`, `GameWithSplash.jsx`, `assets/splash.png`. No overlap with your locked files (Screens.jsx/BedroomSlice/ui_mockups/ui_screen_chrome) — but `git pull main` into `codex` before merging so main.tsx stays consistent.
- **Onboarding change:** claiming the ledger (`update-agent-ledger.js <you> --status ACTIVE …`) is now an explicit step in your start-here checklist + AGENTS.md. Keep doing it — it's why we could finally see your work.
- Your 3 UI polish nits are in FINISH_PLAN → Open next ("UI polish nits — [codex]").
