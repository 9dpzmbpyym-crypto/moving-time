# UI direction — tactile props, not panels
**Owner:** [Claude / Fable 5]. Style authority for all Pack It Up UI.

## The thesis

Every full-screen UI should feel like a **physical object Eloisa would actually handle during a move** — a clipboard, a manila folder, a legal pad, a shipping label — not a game menu wearing a wood texture. The approved Body Board v2 clipboard (`docs/mockups/body-board-background-v2-codex-review.png`) and the in-game `health-clipboard.png` are the anchors: walnut + brass, wide quiet parchment center, ornament only at the edges.

**Object per screen:** Health = clipboard (done) · Desk = desk blotter + paper trays (papers ARE the UI) · Tasks/Command Board = clipboard sibling · Menu/Settings = index card or luggage tag. Same material family throughout: walnut, brass, parchment, ink.

## Rules

1. Chrome earns its pixels: frame + one title treatment; no double borders, no plate-on-plate.
2. Parchment center stays quiet — content is the ink; UI never competes with it.
3. Buttons read as physical: stamps, tabs, paper clips — not rounded rectangles with emoji.
4. Palette stays in the game's world (the `P` palette + walnut/brass/parchment); no new hues per screen.
5. Corner wear/staining allowed, sparingly — prop, not fantasy scroll.

## Phasing (implementation NOT weekend scope; direction is settled)

- **Phase 1 — reskin the shared chrome.** `Screens.jsx` funnels through `FR`, `GOLD_PLATE`, `Panel`, `Screen` — restyle those four to the clipboard language. Small diff, whole-app payoff. `[cursor or codex]`
- **Phase 2 — theme object sweep.** Hardcoded hexes at call sites (ChecklistCard, RewardToast, appointment buttons…) move into one THEME constant. Mechanical, Composer-sized.
- **Phase 3 — bespoke plates.** Per-screen prop art (Body Board pattern: static plate PNG + overlays). Asset asks go to ChatGPT; Fable reviews each plate before wiring.

Nothing in Phases 1–3 blocks game work; do not start before the weekend ship bar is met.
