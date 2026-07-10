# Art brief — Desk landline + Shirley

## Purpose
Diegetic door to Shirley (medical receptionist NPC). Lives on the Paperwork Desk surface — **not** the center inspect mat. Center mat stays empty for paper inspection.

## Landline (desk prop)
- Pixel-art office landline, top-down / 3/4 view, ~14×11 sprite cells (scaled ×4 like other furniture UI chrome).
- Colors from palette: wood base `#3A2410` / `#2A1709`, gold trim `#C9942E`, handset `#5A381F`.
- States:
  1. **Idle** — handset cradled
  2. **Pickup** — handset lifts slightly
  3. **Ringing** — subtle pulse / gold flash (UI can add CSS ringPulse)
  4. **In call** — handset “to ear” (can be a simple raised frame in the call overlay)

## Call overlay chrome
- Nameplate: **Shirley** · “medical desk · tick tock”
- Thread bubbles: Shirley on cream paper `#EFE7D2`, player on dark wood `#3A2410`
- Quick-reply chips under the thread; Hang up button top-right

## Optional plaque
Tiny desk plaque near phone: `SHIRLEY — EXT. 1` (not required for v1)

## Audio (implemented procedurally in `gameAudio.js`)
- Pickup click
- Double-ring cadence (~2 loops)
- Hangup clunk  
Replace with real `sfx/ui/phone_*.mp3` later if desired; keep the same export names.

## Do not
- Put the phone in the center inspect mat
- Make Shirley a full-body character sprite for v1 (voice + phone is enough)
