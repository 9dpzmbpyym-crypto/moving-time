# Storage fills + env props + audio/phone night — session summary
**Date:** 2026-07-11
**Harness / model:** [Cursor / Grok 4.5]
**Branch:** `cursor/storage-glow-7a01` (merged to main: yes — this close-out; standing `cursor` branch still needs Eloisa to delete the old name first)

### Done
- **Container SFX / phone audio (earlier on this branch):** fridge/drawer/cabinet combo clips sliced in memory; open quieter than close; music duck before outbound landline SFX; Shirley incoming ringtone + rattle/arcs pulsed to bell clusters; drawer/cabinet level passes
- **Kitchen counter zones:** `contents.js` upper/lower; panel titles Upper drawers / Lower cabinets
- **Storage fills:** remaining container homes with a clear place (pantry cat food, desk electronics + tablet, TV hutch picks/tuner/cable, vanity meds, nightstand/closet leftovers, side-cabinet papers/sewing). Held: Stretchy toys/travel kit, extras/task piles → hallway / coat closet / death closet later
- **Env props:** procedural Wi‑Fi router (z above desk so selectable), flattened cat bed on desk, kitchen bowls, living amp; hutch books + coffee-table books split out as packable objects; desk restored after accidental moves
- **Guitar:** temporary acoustic PNG (`src/assets/acoustic-guitar.png`) — crop is imperfect; **replace with electric or hard case** (amp is already in scene)
- **Layout:** Eloisa’s editor positions saved to `layout.json` (router, cat bed, bowls, guitar/amp, books)
- **Vercel:** https://moving-time.vercel.app (phone smoke still on Eloisa)
- **Playbook:** folded Fable’s 5 review answers (API routing, Explore=Composer, standing-branch swap, glow/voice ownership, Codex stub stale)
- **Docs drop:** Eloisa can paste master spine / NPC prompts into `artifacts/pack-it-up/docs/inbox/` — Claude already landed ChatGPT pack at `docs/move-spine/`

### Still broken / unfinished (do next)
1. Replace living guitar art (electric or case)
2. Shirley Pass 1 from `docs/move-spine/` → rebuild `SHIRLEY_SYSTEM_PROMPT` + thin bank
3. Glow rects: Fable judges, Grok shrinks fridge/pantry/closet regions
4. Audio cleanup ticket (raw ES files) after this merge
5. Standing `cursor` branch: Eloisa deletes `cursor/storage-glow-7a01` in GitHub UI, then create `cursor` from main
6. Phone smoke on Vercel; Stretchy stressed meows; room-switch/cabinet SFX swaps

### Do not
- Commit `artifacts/pack-it-up/src/assets/audio/` (duplicate of `public/`)
- Split `BedroomSlice.jsx`
- Start hallway/closet / Sal / Vivian / Command Board before Shirley Pass 1
- Force-push

### Quick verify
```text
https://moving-time.vercel.app
# or local: artifacts/pack-it-up → PORT=8095 BASE_PATH=/ pnpm exec vite …
/?edit=1  → office: grab Wi‑Fi without moving desk; living: guitar+amp; kitchen: bowls
```

### Suggested next-session order
1. Eloisa: delete old Cursor branches in GitHub UI; create standing `cursor`
2. Shirley Pass 1 (`docs/move-spine/systems/IMPLEMENTATION_MANIFEST.md`)
3. Guitar art swap + glow rects (Fable screenshots → Grok edits)
4. Audio cleanup ticket
