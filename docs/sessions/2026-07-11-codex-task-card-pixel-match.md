# Task-card overlay pixel match — session summary
**Date:** 2026-07-11
**Harness / model:** [Codex / GPT-5.6 Sol]
**Branch:** `codex` (merged to main: yes)

### Done
- Folded pip centers/sizes into exported `CARD_OVERLAY`; the designer derives defaults from that single canonical source.
- Removed hidden 2px editor borders/selection tint, exact-matched pip sizes, date anchoring, title fitting, line-height, and letter-spacing.
- Reset native button appearance without changing equal width/minWidth/maxWidth guards.
- Kept the Command Board hand at 120px and apartment fan at 56px; no PNG art or footer pixels changed.
- Used Luna for mechanical renderer diff and Terra for integration/visual-weight review; both identified the same concrete drift sources.

### Still broken / unfinished (do next)
- Eloisa should do the final eye check side-by-side in her local browser; no Vercel deployment was requested.

### Do not
- Do not reintroduce designer-only pip clamps, transparent borders, fixed title padding, or whole-card CSS scaling.

### Quick verify
Open `/?cards=1`, hide outlines, then compare the flat thin/full samples with Board draw and 120px hand cards; confirm apartment fan remains 56px.

### Suggested next-session order
1. Eloisa visual acceptance.
2. Resume product work only after any exact micro-nudges she identifies.
