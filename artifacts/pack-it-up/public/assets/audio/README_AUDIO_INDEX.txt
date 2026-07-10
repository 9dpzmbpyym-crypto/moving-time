PACK IT UP AUDIO ASSET PACK

Drop this folder into your project as: assets/audio
(Live path: artifacts/pack-it-up/public/assets/audio/)

Included audio files:
- Music files: 10
- Cat SFX files: 16
- Container/object SFX files: 11
- UI SFX files: 3
- Total included audio files: 40

Main music:
- Cherry Blossom = default apartment/packing loop

Radio stations:
- POP 101: Pop Station (Some Kind of Beautiful) — available
- OLD 96: Oldies — available
- JAZZ 78: Jazz — available
- SYN 100: Synthwave — available
- BIT 90: 8-Bit (Guru Meditation) — available
- RNB 77: R&B — available

Manifest updates (vs original pack):
- Guru Meditation and Some Kind of Beautiful are now available.
- Dry (Instrumental) added to the music library.
- Sweet Dreams removed from the music library.

Important files:
- audio_index.csv: spreadsheet-style index with durations and source filenames
- code/audioManifest.js: importable JS manifest
- code/AudioManager.js: starter browser audio manager
- docs/RADIO_IMPLEMENTATION_PROMPT.txt: implementation prompt for the game agent

Notes:
- Duplicate uploads of A Heart Made of Pixels and A Wink behind the Curtain were omitted; one copy each is included.
- Stretchy Content Meow Stretch and Stretchy Happy Meow Set had matched audio in the earlier split pass, so their shared cuts are included once as happy_content clips.
- Packing Nouse.mp3 was normalized to sfx/ui/packing_noise_01.mp3.
- sell_chime.mp3 lives at sfx/ui/sell_chime.mp3 (copied from src/sell.mp3).

How to use Stretchy meows (from this pack):
- happy_content → calm / content moments (idle, sit, stretch, soft look-at-you)
- stressed → mild task pressure / guilt glow starting
- desperate → high task pressure / red "!" guilt state
- Game rule of thumb: pick a random clip from the matching folder; keep volume low;
  do not spam. Prefer happy_content for ambient presence; reserve stressed/desperate
  for clear pressure beats so they don't feel like jump-scares.

Full index:
- library_spaghetti_on_the_island: music/library_spaghetti_on_the_island.mp3 (221.969s)
- library_dry: music/library_dry.mp3 (186.744s)
- library_the_night_train: music/library_the_night_train.mp3 (114.001s)
- main_cherry_blossom: music/main_cherry_blossom.mp3 (156.625s)
- radio_jazz_nightingale: music/radio_jazz_the_nightingale_is_singing_our_song.mp3 (205.923s)
- radio_oldies_a_wink_behind_the_curtain: music/radio_oldies_a_wink_behind_the_curtain.mp3 (125.875s)
- radio_rnb_no_hero_of_mine: music/radio_rnb_no_hero_of_mine.mp3 (218.546s)
- radio_synthwave_heart_made_of_pixels: music/radio_synthwave_a_heart_made_of_pixels.mp3 (213.733s)
- radio_eight_bit_guru_meditation: music/radio_eight_bit_guru_meditation.mp3 (149.064s)
- radio_pop_some_kind_of_beautiful: music/radio_pop_some_kind_of_beautiful.mp3 (199.104s)
- stretchy_desperate_meow_01: sfx/cat/stretchy_desperate_meow_01.mp3 (1.185s)
- stretchy_desperate_meow_02: sfx/cat/stretchy_desperate_meow_02.mp3 (1.31s)
- stretchy_desperate_meow_03: sfx/cat/stretchy_desperate_meow_03.mp3 (1.35s)
- stretchy_desperate_meow_04: sfx/cat/stretchy_desperate_meow_04.mp3 (1.305s)
- stretchy_desperate_meow_05: sfx/cat/stretchy_desperate_meow_05.mp3 (1.04s)
- stretchy_desperate_meow_06: sfx/cat/stretchy_desperate_meow_06.mp3 (1.32s)
- stretchy_desperate_meow_07: sfx/cat/stretchy_desperate_meow_07.mp3 (1.195s)
- stretchy_happy_content_meow_01: sfx/cat/stretchy_happy_content_meow_01.mp3 (2.81s)
- stretchy_happy_content_meow_02: sfx/cat/stretchy_happy_content_meow_02.mp3 (2.11s)
- stretchy_happy_content_meow_03: sfx/cat/stretchy_happy_content_meow_03.mp3 (0.755s)
- stretchy_happy_content_stretch_04: sfx/cat/stretchy_happy_content_stretch_04.mp3 (2.479s)
- stretchy_stressed_meow_01: sfx/cat/stretchy_stressed_meow_01.mp3 (0.915s)
- stretchy_stressed_meow_02: sfx/cat/stretchy_stressed_meow_02.mp3 (0.995s)
- stretchy_stressed_meow_03: sfx/cat/stretchy_stressed_meow_03.mp3 (1.305s)
- stretchy_stressed_meow_04: sfx/cat/stretchy_stressed_meow_04.mp3 (1.375s)
- stretchy_stressed_meow_05: sfx/cat/stretchy_stressed_meow_05.mp3 (1.087s)
- cabinet_close_01: sfx/containers/cabinet_close_01.mp3 (0.5s)
- cabinet_open_01: sfx/containers/cabinet_open_01.mp3 (0.4s)
- closet_door_close_01: sfx/containers/closet_door_close_01.mp3 (0.64s)
- closet_door_open_01: sfx/containers/closet_door_open_01.mp3 (2.428s)
- kitchen_drawer_close_01: sfx/containers/kitchen_drawer_close_01.mp3 (1.0s)
- kitchen_drawer_open_01: sfx/containers/kitchen_drawer_open_01.mp3 (1.3s)
- medicine_cabinet_close_01: sfx/containers/medicine_cabinet_close_01.mp3 (0.95s)
- medicine_cabinet_close_02: sfx/containers/medicine_cabinet_close_02.mp3 (0.99s)
- medicine_cabinet_open_01: sfx/containers/medicine_cabinet_open_01.mp3 (0.74s)
- office_drawer_close_01: sfx/containers/office_drawer_close_01.mp3 (1.342s)
- office_drawer_open_01: sfx/containers/office_drawer_open_01.mp3 (1.8s)
- packing_noise_01: sfx/ui/packing_noise_01.mp3 (1.492s)
- room_switch_01: sfx/ui/room_switch_01.mp3 (0.75s)
- stamp_01: sfx/ui/stamp_01.mp3 (0.867s)
