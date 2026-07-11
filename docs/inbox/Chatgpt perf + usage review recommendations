# ChatGPT perf + usage review — July 11

Source: ChatGPT review of repo after Windows BSOD concerns and usage-overrun concerns.

## Summary

No obvious runaway loop or egregious infinite usage pattern was found. The app does not appear to be melting the machine by itself. However, several areas could create unnecessary local load, dev noise, or paid/free API churn, especially on a managed work laptop that already showed CLOCK_WATCHDOG_TIMEOUT and HYPERVISOR_ERROR.

Treat this as a small perf/usage safety review. Do not turn it into a broad architecture pass.

## Highest priority red flags

### 1. Shirley OpenRouter fallback behavior may burn API attempts

`receptionistCall.js` currently:
- defaults to `deepseek/deepseek-chat-v3.1:free`
- can auto-enable improv if an API key exists unless explicitly opted out
- tries configured model plus multiple fallback free models
- gives each attempt a 25s timeout
- uses `max_tokens: 320`
- uses `temperature: 0.95`

This conflicts with the newer cheap runtime strategy, which wants:
- cheap model calls only for short variation
- strict small context
- strict JSON output if possible
- fallback banks as the reliable path
- around 120 max tokens
- lower/moderate temperature
- no long histories
- no multi-model fallback burn by default

Recommended fix:
- make live Shirley API truly opt-in
- cap to configured model plus at most one fallback
- reduce max tokens to around 120
- reduce temperature to around 0.6
- consider JSON response mode if supported
- if model fails once, fall back to bank quickly
- never send the full move-spine docs into runtime calls

### 2. Remove July 10 test-call path

`BedroomSlice.jsx` still has a July 10 test path that schedules a Shirley call about 5 seconds after refresh.

This is not catastrophic, but during HMR/dev reloads it can repeatedly trigger ringtone/call behavior and create noise.

Recommended fix:
- remove the July 10 test-call code now
- keep only real nudge behavior from `getNudge`

### 3. Two separate one-second clocks

`BedroomSlice.jsx` updates `now` every second.
`DeskScreen` updates `deskNow` every second.

Because the app is monolithic and canvas-heavy, this may cause unnecessary rerender churn.

Recommended fix:
- tick once per minute unless seconds are truly needed
- or isolate clocks into tiny memoized components
- do not let clock ticks rerender the whole apartment/game tree if avoidable

### 4. Audio loading/decoding is front-loaded

`ensureAudioLoaded()` loads and decodes many audio files at once:
- main theme
- UI SFX
- cat happy/stressed/desperate clips
- container clips
- phone clips
- multi-take source files

Radio preload can also decode all six radio stations.

Recommended fix:
- leave if stable, but consider lazy loading nonessential groups later
- avoid preloading all radio stations unless the radio panel is open and user intent is clear
- keep audio singleton behavior, which is good

### 5. Incoming phone pulse timer is high frequency

Incoming phone pulse checks ring windows every 40ms while ringtone is active.

This appears to stop correctly, so it is not an obvious leak. But it is a candidate for lightening later.

Recommended fix:
- not urgent
- consider CSS-only pulse or lower-frequency check if phone effects feel heavy

### 6. Many infinite CSS animations

The app has several infinite CSS animations:
- fan nudge
- portal glow
- drawer glow
- red pulse
- guilt bubble
- pressure vignette
- phone rattle
- ring arcs

These are acceptable for game feel, but on a weak/managed laptop they may keep the compositor busy.

Recommended fix:
- not urgent
- eventually add low-motion/perf mode
- do not remove all juice unless needed

## Things that looked good

- Radio polling interval only runs while radio panel is open and clears itself.
- Animation timeout registry clears timers on unmount.
- Audio module is a singleton, which helps avoid duplicate AudioContexts and repeated decoding under HMR.
- `startMainTheme()` guards against stacking multiple main loops.
- FINISH_PLAN/HANDOFF/session system is conceptually correct.

## Admin process usage note

The admin process is not wrong. It is useful because multiple agents are touching the repo.

Correct version:
- `FINISH_PLAN.md` remains the only active task queue.
- `HANDOFF.md` stays a short pointer.
- session files are append-only summaries.
- ledger is a coordination whiteboard, not a parallel plan.

Bad version:
- every tiny edit causes updates to FINISH_PLAN, HANDOFF, DEVLOG, session file, ledger, plus another review pass.

Recommended usage rule:
- one closeout per meaningful session
- no full ritual for a one-line fix
- no Sol for routine closeout
- no paid API unless Eloisa explicitly approves
- Composer/Grok can handle tiny perf cleanup
- Sol/Luna only if scope becomes structural

## Recommended tiny perf ticket

Scope:
- remove July 10 Shirley test-call path
- tighten Shirley API settings and fallback behavior
- reduce one-second clock churn if cheap
- do not change UI design
- do not start Sal, Vivian, Command Board, hallway, or broader architecture

Suggested acceptance:
- Shirley script bank still works with no API key
- live Shirley remains opt-in
- one failed model call falls back quickly
- no July 10 auto-call test remains
- app still runs locally
- no broad refactor
