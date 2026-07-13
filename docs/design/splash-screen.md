# Splash / loading screen — design note
**Owner:** [Claude / Fable 5] (taste). **Build:** game code → Cursor/Codex when assigned (Claude doesn't lead repo code).
**Art source:** Eloisa's mockup — "PACK IT UP" cream pixel wordmark + walnut shadow, Stretchy perched on top, cardboard box, on black; loader line beneath.

## Purpose (why it earns its place)
Not a fake loader — the app has ~no load time. Its real job is the **iOS Web Audio unlock**: audio can't start until a user gesture, so the splash *is* the tap that primes sound. Charming + functional.

## Behavior
- **Cold boot ONLY** — fresh page load. Do NOT show on every screen return or app resume. (Charming once/day; friction the 40th time during a move.)
- Appears immediately on black with the wordmark + Stretchy + box.
- **Loader copy is honest:** show **"packing…"** while the app is still hydrating / priming assets, then flip to **"tap anywhere to start"** the instant it's actually ready — so there are no dead taps on a half-loaded app, and it invites the tap the moment it works.
- **Whole screen is the tap target** ("tap anywhere"). The tap: (1) dismisses the splash, (2) **primes the AudioContext** (the first-gesture unlock).
- On tap → quick fade into the apartment (~200–300ms). **No forced minimum dwell** — user can tap a millisecond after "ready."

## Craft notes
- Two loaders is one too many — keep **"packing…"**, drop the `• • •` dots (or animate the dots as the only indicator).
- Optional: a harder 1px pixel shadow on the wordmark matches the in-game crisp-outline art better than the soft blur — nice-to-have, not a blocker.
- Respect `prefers-reduced-motion` for the fade.

## Acceptance
Cold boot shows splash → "packing…" → "tap anywhere to start" when ready → tap anywhere fades in the apartment AND audio is primed (sound works on first in-game action, iOS included). Never reappears on in-session navigation.
