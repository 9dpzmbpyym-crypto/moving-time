# Storage glow unify + Shirley landline — session summary
**Date:** 2026-07-10
**Harness / model:** [Cursor / Grok + Composer]
**Branch:** `cursor/storage-glow-7a01` (merged to main: yes — during the Jul 10 branch consolidation)

*(Migrated from the pre-archive `HANDOFF.md` of this date.)*

### Done
- Unified storage container glow onto bar-cabinet **face** style (`.drawerGlow`):
  - Closet / fridge / pantry: `faceGlowRegions` → `glowRegions`
  - Edge-only halo (removed green fill wash that made white appliances neon)
  - Storage no longer falls back to silhouette `.portal` (mirror keeps portal as health doorway)
- Restarted Vite after sleep kill
- Documented outstanding glow tuning + refreshed Open next in `FINISH_PLAN.md`
- Branch includes earlier Shirley landline pass (`8d8f6e5`) + glow unify (`c2b0903`+)

### Still broken / unfinished (do next)
1. **Storage glow visual mismatch** — same CSS path, but fridge/pantry/closet `glowRegions` cover most of the sprite so they still *look* like full-object auras vs bar/vanity door halos. **Fix:** shrink those rects toward bar/vanity proportions; compare side-by-side in dining vs kitchen vs bathroom.
2. Shirley ChatGPT **style/ruleset prompt** not landed yet (don't paste example convos into banks).
3. Replace room-switch + cabinet SFX (user dislikes current).
4. Vercel deploy + phone smoke test.

### Do not
- Split `BedroomSlice.jsx`
- Touch files outside `artifacts/pack-it-up/` unless asked (except plan/handoff docs)
- Commit `artifacts/pack-it-up/src/assets/audio/` (duplicate of `public/assets/audio/`)
- Force-push

### Quick verify
Open `http://localhost:8091/` — check dining bar cabinet, kitchen fridge/pantry, bath vanity, bedroom dresser/closet: all should use `.drawerGlow` children (not `.portal`), except bathroom `mirror_cabinet`.

### Suggested next-session order
1. Tune `glowRegions` on fridge / pantry / closet (and any other full-coverage faces)
2. Shirley prompt → rebuild system prompt / thin bank
3. SFX swaps (room switch, cabinet)
4. Vercel + phone test
