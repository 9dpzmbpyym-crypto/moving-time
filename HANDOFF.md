# Latest handoff

→ **Task cards — one component, one scale** (Codex when credits return, or Cursor Grok)

Claude’s root-cause note (2026-07-11): designer `/？cards=1` previews thin@420 / full@220, but live hand is ~120px with fonts scaled separately. % positions survive; font size + wrap do not — so careful placement in the designer still looks “off” on the Board. Clipped bottoms / giant cards came from scaling some things and not others.

**One principle:** everything on the card (text position, font size, pip size) is relative to card width; the whole card scales as a single unit. Designer and Board must render the **same** `HorizontalTaskCard` / `VerticalTaskCard` and only change the outer width. No independent per-element px fonts. Correct by construction — stop chasing micro-nudges across two paths.

**Latest Eloisa overlay nudge** (applied to `CARD_OVERLAY` in `Screens.jsx`):
- thin title `3.3% / 2.3% / 28.3% / 26.5%`; target `18.5% / 70% / 12.2%`; latest `47.5% / 70.4% / 12.3%`
- full dates nudged: target `36.1% / 41.7%`; latest `36.7% / 47.1%` (title/bound unchanged)

→ `docs/sessions/2026-07-11-codex-task-card-pixel-match.md`
→ `docs/sessions/2026-07-11-cursor-task-card-overlays.md`

**Nag:** sublet lock Jul 15 · Hunter Jul 14. No Vercel until Eloisa says so.

---
*Session reports live in `docs/sessions/`; see `docs/ai-team/end-here.md`.*
