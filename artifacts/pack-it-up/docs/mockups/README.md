# Original concept mockups (Jul 5–6 era)

These are the **north-star** screens from early Pack It Up concepting — denser and more “full game” than the current playable build. Keep them as direction, not a rebuild checklist.

| File | Screen | What it promised |
|------|--------|------------------|
| `01-paperwork-desk.png` | Paperwork Desk | Drag cards, ADMIN / APPLICATIONS trays, APPROVED / NEEDS INFO / REJECTED stamps, outbox, calendar, notes, Stretchy asleep on papers |
| `02-hub-dashboard.png` | Hub / departure dashboard | Multi-room strip, boxes packed, cards in hand, body meters, days-left countdown, Stretchy hearts |
| `03-apartment-diorama.png` | Apartment diorama | Side cutaway of all rooms + “Death Closet,” labeled boxes on the roof, packing quests |
| `04-body-board.png` | Body Board | Operation-style zones (brain, heart, joints…), care items, appointment cards, diagnostic notes |

## How this maps to the current build

| Mockup | Now |
|--------|-----|
| Paperwork Desk | `Screens.jsx` Desk — stamp shell + sample papers; no trays/outbox/drag yet |
| Hub dashboard | Mobile apartment HUD + paper fan; no body meters / days-left / hand slots |
| Apartment diorama | Six rooms you pan through (not a single cutaway); Death Closet not a room |
| Body Board | `Screens.jsx` Health — Operation shell with pulsing zones; no care items / appointments |

**Use these for:** desk finished pile + stamp feel, daily ritual framing, health board v1, Stretchy as emotional companion.  
**Don’t use these for:** rebuilding the apartment as a side-view diorama or photoreal hub — the flat back-wall rooms already shipped and are the production style.
