# Fable design review — Grok's Jul 10–11 game work + Eloisa's notes
**Reviewer:** [Claude / Fable 5] · verified against code (contents.js, gameAudio.js, BedroomSlice.jsx, Screens.jsx) + live-build screenshots of all six rooms.

## Verdicts by area

**Sound design: strong. Keep the approach.** Runtime slicing of multi-take files (one `*_es.mp3`, several peaks) is clever and cheap; close-louder-than-open is the right completion feedback; duck-leads-phone is correct stagecraft. One listen-check: the incoming Shirley ringtone does **not** duck the radio — if they fight on phone speakers, duck to ~0.6 during ring. Note: `cabinet/fridge/drawer_open_close_es.mp3` and all four `phone_*.mp3` are **referenced by code** — the audio-cleanup ticket applies only to the 7 original-named Epidemic drops.

**Env props: good instincts, two placement bugs.** Radio on the TV hutch reads great; amp on the rug sells the room. Bugs: (1) the kitchen cat bowls float mid-tile with no anchor/shadow — pin them against the counter or fridge base; (2) the **guitar doesn't render at all** in the live build (PNG blitted whole to 28×59, no crop logic — a bad source PNG shows directly, or fails silently).

**Storage fills: right homes, three fixes.** Kitchen counter's 8 drawn faces with only 2 tap zones is the mismatch Eloisa felt — see ticket. One real duplicate: the green canned-food sprite doubles as fridge "Leftovers" (Plate ×2 / Mug ×2 are fine — real kitchens repeat). Dresser is thin (3 items vs nightstand 7, vanity 10, closet 14).

**Glow (from screenshots):** counter/hutch/bar faces look right — edge halos on doors. Fridge/pantry still read heavier than the bar-cabinet reference. Proportions ruling stands: shrink toward door-face rects; I'll judge against side-by-side screenshots when Grok does the pass.

## Rulings on Eloisa's notes

1. **Kitchen zones → 4, not 2.** Data layer already supports it (`zone` strings are free). Grouping: **Utensil drawer / Junk drawer** (upper row split L/R) · **Cookware / Under-sink** (lower row split L/R). Maps 1:1 onto existing items. Three code touchpoints: `kitchenTapZone` (quadrant geometry), `containerKind` (SFX), `storageTitle` (panel names).
2. **Guitar: replace with a hard case leaning by the amp.** It's a moving game — a cased instrument tells the story better than a displayed acoustic, and case geometry pixels cleanly at 28px wide. Tight-crop the PNG (pipeline blits the whole image).
3. **Nightstand crops / thin dresser:** crop weirdness is the thumbnail pipeline blind-trusting `manifest.json` center-crop values — off-center normalized PNGs clip. Code guard (clamp crop rect) + regenerate bad assets. Pulling more dresser items from the source stack is a ChatGPT/Eloisa asset job — correct instinct.
4. **Medicine cabinet: no conflict — the code already implements the right answer.** Mirror = portal only (Health doorway); meds live in `bath_vanity` (there's even a comment saying so). One object, one verb. Ruling: keep, stop re-litigating.
5. **Toiletry Collection + Storage Tote become containers.** Both exist as decor objects with no contents. Toiletries gets toiletries + the vanity `perfume` item; Tote gets the sewing items currently parked in `office:side_cabinet`.
6. **Hallway room (death closet + coat closet): parked in P2.** Rooms are additive data entries, so it's feasible — but it's room-scale art + contents work, not weekend scope. Stretchy travel/toys are already being held for it.
7. **UI overhaul: agreed, clipboard is the direction.** Full brief in `docs/design/ui-direction.md`. Short version: the current wood-frame/gold-plate chrome funnels through 4 shared style constants, so Phase 1 (reskin those to the clipboard/tactile-prop language) is a small diff with a big visual payoff; hardcoded hexes at call sites make the full sweep Phase 2; bespoke plate art per screen (Body Board pattern) is Phase 3.

All accepted findings are ticketed in `FINISH_PLAN.md` → Open next, tagged by team.
