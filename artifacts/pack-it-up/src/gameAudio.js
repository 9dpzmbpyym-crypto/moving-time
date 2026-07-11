// Pack It Up audio — module singleton so React StrictMode / HMR remounts
// don't kill the AudioContext, stop the music, or re-decode everything.
// Assets load from /assets/audio/ (public/) as real audio/mpeg.

const root = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
const AUDIO_BASE = `${root}assets/audio/`;
const SETTINGS_KEY = "pack-it-up-audio";
const MUSIC_VOL_MAX = 0.0875; // was 0.175 — another −50% (Jul 9)
const RADIO_VOL_MAX = 0.07;   // was 0.14 — stay slightly quieter than main
const SFX_VOL_MAX = 0.25;     // SFX master (another −50%)
/** While on the landline, keep BGM/radio at this fraction (duck, don't stop). */
const PHONE_MUSIC_DUCK = 0.4;
/** Soft ramp when ducking / restoring music during a call. */
const PHONE_DUCK_FADE = 0.2;
/** ~3× time-constant — music duck is effectively settled. */
export const PHONE_DUCK_SETTLE_MS = Math.ceil(PHONE_DUCK_FADE * 3 * 1000);
/** Quiet beat after duck settles, before ceremony SFX (pickup / rotary / ring). */
export const PHONE_DUCK_LEAD_MS = 600;
/** Total delay from duck-on → first outbound phone SFX. */
export const PHONE_SFX_AFTER_DUCK_MS = PHONE_DUCK_SETTLE_MS + PHONE_DUCK_LEAD_MS;
/** Hard rule: never overlap songs. Stop previous → silence → start next. */
const SONG_GAP_MS = 1000;

/** Living-room radio stations (paths under public/assets/audio/). */
export const RADIO_STATIONS = [
  {
    id: "pop",
    label: "Pop Station",
    track: "music/radio_pop_some_kind_of_beautiful.mp3",
    display: "POP 101",
    description: "romantic, dreamy pop",
  },
  {
    id: "oldies",
    label: "Oldies",
    track: "music/radio_oldies_a_wink_behind_the_curtain.mp3",
    display: "OLD 96",
    description: "funny vaudeville oldies",
  },
  {
    id: "jazz",
    label: "Jazz",
    track: "music/radio_jazz_the_nightingale_is_singing_our_song.mp3",
    display: "JAZZ 78",
    description: "laid-back big band jazz",
  },
  {
    id: "synthwave",
    label: "Synthwave",
    track: "music/radio_synthwave_a_heart_made_of_pixels.mp3",
    display: "SYN 100",
    description: "dreamy synthwave",
  },
  {
    id: "eight_bit",
    label: "8-Bit",
    track: "music/radio_eight_bit_guru_meditation.mp3",
    display: "BIT 90",
    description: "relaxing bit music",
  },
  {
    id: "rnb",
    label: "R&B",
    track: "music/radio_rnb_no_hero_of_mine.mp3",
    display: "RNB 77",
    description: "happy relaxing R&B",
  },
];

function loadPrefs() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { musicVol: 1, sfxVol: 1 };
    const p = JSON.parse(raw);
    // migrate old boolean toggles → volumes
    let musicVol = typeof p.musicVol === "number" ? p.musicVol : (p.music === false ? 0 : 1);
    let sfxVol = typeof p.sfxVol === "number" ? p.sfxVol : (p.sfx === false || p.sound === false ? 0 : 1);
    musicVol = Math.max(0, Math.min(1, musicVol));
    sfxVol = Math.max(0, Math.min(1, sfxVol));
    return { musicVol, sfxVol };
  } catch {
    return { musicVol: 1, sfxVol: 1 };
  }
}

function savePrefs() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      musicVol: state.musicVol,
      sfxVol: state.sfxVol,
    }));
  } catch {}
}

const prefs = loadPrefs();

const state = {
  ctx: null,
  primed: false,
  ready: false,
  loading: null,
  musicStarted: false,
  musicVol: prefs.musicVol,
  sfxVol: prefs.sfxVol,
  mainSrc: null,
  mainGain: null,
  keepAliveStarted: false,
  keepAliveBuf: null,
  sell: null,
  pack: null,
  stamp: null,
  roomSwitch: null,
  mainTheme: null,
  stations: {}, // id → AudioBuffer
  stationMiss: {}, // id → true if load failed
  radioOn: false,
  radioStationId: "pop",
  radioSrc: null,
  radioGain: null,
  musicBusy: false, // true while stop→gap→start is in flight
  musicGen: 0, // bumps on each switch so stale gaps don't start old songs
  fading: false, // alias of musicBusy for UI (getRadioState)
  catHappy: [],
  catStressed: [],
  catDesperate: [],
  containerOpen: {},
  containerClose: {},
  lastMeowAt: 0,
  // landline ceremony clips (sliced from public/assets/audio/sfx/ui/phone_*.mp3)
  phoneReceiver: null,
  phoneRotary: null,
  phoneRingBurst: null,
  phoneAnswer: null,
  phoneReceiverSrc: null,
  phoneReceiverGain: null,
  phoneMusicDuck: false,
  phoneIncomingRingtone: null,
  phoneIncomingSrc: null,
  phoneIncomingGain: null,
  phoneIncomingStartedAt: 0,
  phoneIncomingLoopDur: 0,
  phoneIncomingPulseTimer: null,
  phoneIncomingPulseOn: false,
};

/** Bell clusters in the trimmed incoming ringtone (seconds into the loop). */
const INCOMING_RING_WINDOWS = [
  [0.12, 1.15],
  [2.95, 4.15],
  [5.95, 7.15],
  [8.95, 10.15],
  [11.75, 13.1],
];
const incomingPulseListeners = new Set();

function emitIncomingPulse(on) {
  if (state.phoneIncomingPulseOn === on) return;
  state.phoneIncomingPulseOn = on;
  incomingPulseListeners.forEach((fn) => {
    try { fn(on); } catch {}
  });
}

/** Subscribe to Shirley ringtone on/off pulses (for phone rattle / arcs). */
export function onIncomingRingPulse(fn) {
  if (typeof fn !== "function") return () => {};
  incomingPulseListeners.add(fn);
  try { fn(state.phoneIncomingPulseOn); } catch {}
  return () => incomingPulseListeners.delete(fn);
}

function stopIncomingPulseClock() {
  if (state.phoneIncomingPulseTimer) {
    clearInterval(state.phoneIncomingPulseTimer);
    state.phoneIncomingPulseTimer = null;
  }
  emitIncomingPulse(false);
}

function startIncomingPulseClock() {
  stopIncomingPulseClock();
  const ctx = state.ctx;
  const dur = state.phoneIncomingLoopDur;
  if (!ctx || !(dur > 0.2)) return;
  const startedAt = state.phoneIncomingStartedAt;
  const tick = () => {
    if (!state.phoneIncomingSrc) {
      emitIncomingPulse(false);
      return;
    }
    const t = (ctx.currentTime - startedAt) % dur;
    const on = INCOMING_RING_WINDOWS.some(([a, b]) => t >= a && t < b);
    emitIncomingPulse(on);
  };
  tick();
  state.phoneIncomingPulseTimer = setInterval(tick, 40);
}

function ensureCtx() {
  if (state.ctx && state.ctx.state !== "closed") return state.ctx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  state.ctx = new Ctx();
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch {}
  try {
    const sr = state.ctx.sampleRate;
    const keep = state.ctx.createBuffer(1, Math.floor(sr * 1.0), sr);
    keep.getChannelData(0).fill(0);
    state.keepAliveBuf = keep;
  } catch {}
  return state.ctx;
}

/** Drop the first `frac` of a buffer (e.g. 0.25 = cut first quarter). */
function trimStartFraction(buf, frac = 0.25) {
  const ctx = state.ctx;
  if (!ctx || !buf || frac <= 0) return buf;
  try {
    const start = Math.floor(buf.length * Math.min(0.9, frac));
    const len = buf.length - start;
    if (len < buf.sampleRate * 0.05) return buf;
    const out = ctx.createBuffer(buf.numberOfChannels, len, buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const src = buf.getChannelData(c).subarray(start);
      out.getChannelData(c).set(src);
    }
    return out;
  } catch {
    return buf;
  }
}

/** Slice [startSec, endSec) from a buffer. endSec null = through end. */
function sliceBuffer(buf, startSec = 0, endSec = null) {
  const ctx = state.ctx;
  if (!ctx || !buf) return buf;
  try {
    const sr = buf.sampleRate;
    const start = Math.max(0, Math.floor(startSec * sr));
    const end = Math.min(buf.length, Math.floor((endSec == null ? buf.duration : endSec) * sr));
    const len = end - start;
    if (len < sr * 0.04) return buf;
    const out = ctx.createBuffer(buf.numberOfChannels, len, sr);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      out.getChannelData(c).set(buf.getChannelData(c).subarray(start, end));
    }
    return out;
  } catch {
    return buf;
  }
}

/** Cut leading near-silence so delayed clips fire on tap. */
function trimLeadingSilence(buf, threshold = 0.012) {
  const ctx = state.ctx;
  if (!ctx || !buf) return buf;
  try {
    const ch0 = buf.getChannelData(0);
    let i = 0;
    while (i < ch0.length && Math.abs(ch0[i]) < threshold) i++;
    // keep a tiny pre-roll so the attack isn't clipped
    const start = Math.max(0, i - Math.floor(buf.sampleRate * 0.008));
    if (start < 200) return buf;
    const len = ch0.length - start;
    if (len < buf.sampleRate * 0.05) return buf;
    const out = ctx.createBuffer(buf.numberOfChannels, len, buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const src = buf.getChannelData(c).subarray(start);
      const dst = out.getChannelData(c);
      dst.set(src);
    }
    return out;
  } catch {
    return buf;
  }
}

/** Match a clip's peak to `targetPeak` (boost or attenuate; in-memory only). */
function normalizePeak(buf, targetPeak = 0.72) {
  if (!buf) return buf;
  try {
    let peak = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i++) {
        const a = Math.abs(d[i]);
        if (a > peak) peak = a;
      }
    }
    if (peak < 0.001) return buf;
    const mul = targetPeak / peak;
    if (Math.abs(mul - 1) < 0.02) return buf;
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i++) d[i] *= mul;
    }
    return buf;
  } catch {
    return buf;
  }
}

/**
 * Match average loudness (RMS) so radio stations feel even.
 * Target ≈ Jazz's old quiet level (−15.9 dB), then a touch quieter (−17.5 dB).
 * Soft-clips if boost would push samples past 1.0. In-memory only.
 */
const RADIO_RMS_TARGET = Math.pow(10, -17.5 / 20); // −17.5 dB ≈ 0.133
function normalizeRms(buf, targetRms = RADIO_RMS_TARGET) {
  if (!buf) return buf;
  try {
    let sumSq = 0;
    let n = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i += 64) {
        sumSq += d[i] * d[i];
        n++;
      }
    }
    const rms = Math.sqrt(sumSq / Math.max(1, n));
    if (rms < 0.001) return buf;
    const mul = targetRms / rms;
    if (Math.abs(mul - 1) < 0.03) return buf;
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i++) {
        const v = d[i] * mul;
        d[i] = v > 1 ? 1 : v < -1 ? -1 : v;
      }
    }
    return buf;
  } catch {
    return buf;
  }
}

async function loadBuf(rel) {
  const ctx = ensureCtx();
  if (!ctx) return null;
  try {
    const res = await fetch(`${AUDIO_BASE}${rel}`);
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return await ctx.decodeAudioData(ab.slice(0));
  } catch {
    return null;
  }
}

async function loadMany(rels) {
  const out = [];
  for (const rel of rels) {
    const buf = await loadBuf(rel);
    if (buf) out.push(buf);
  }
  return out;
}

export function ensureAudioLoaded() {
  if (state.ready) return state.loading || Promise.resolve();
  if (state.loading) return state.loading;
  ensureCtx();
  state.loading = (async () => {
    const [
      sell, pack, stamp, roomSw, mainTheme,
      happy, stressed, desperate,
      cabComboRaw, closetOpen, closetClose,
      kitOpenRaw, kitClose, medOpen, medClose1, medClose2,
      offOpenRaw, offClose,
      fridgeComboRaw, drawerComboRaw,
      phoneReceiverRaw, phoneRotaryRaw, phoneRingRaw, phoneIncomingRaw,
    ] = await Promise.all([
      loadBuf("sfx/ui/sell_chime.mp3"),
      loadBuf("sfx/ui/packing_noise_01.mp3"),
      loadBuf("sfx/ui/stamp_01.mp3"),
      loadBuf("sfx/ui/room_switch_01.mp3"),
      loadBuf("music/main_cherry_blossom.mp3"),
      loadMany([
        "sfx/cat/stretchy_happy_content_meow_01.mp3",
        "sfx/cat/stretchy_happy_content_meow_02.mp3",
        "sfx/cat/stretchy_happy_content_meow_03.mp3",
        "sfx/cat/stretchy_happy_content_stretch_04.mp3",
      ]),
      loadMany([
        "sfx/cat/stretchy_stressed_meow_01.mp3",
        "sfx/cat/stretchy_stressed_meow_02.mp3",
        "sfx/cat/stretchy_stressed_meow_03.mp3",
        "sfx/cat/stretchy_stressed_meow_04.mp3",
        "sfx/cat/stretchy_stressed_meow_05.mp3",
      ]),
      loadMany([
        "sfx/cat/stretchy_desperate_meow_01.mp3",
        "sfx/cat/stretchy_desperate_meow_02.mp3",
        "sfx/cat/stretchy_desperate_meow_03.mp3",
        "sfx/cat/stretchy_desperate_meow_04.mp3",
        "sfx/cat/stretchy_desperate_meow_05.mp3",
        "sfx/cat/stretchy_desperate_meow_06.mp3",
        "sfx/cat/stretchy_desperate_meow_07.mp3",
      ]),
      // multi-take cupboard: ~6 peaks — use 4th=open, 6th=close (replaces old cabinet_*.mp3)
      loadBuf("sfx/containers/cabinet_open_close_es.mp3"),
      loadBuf("sfx/containers/closet_door_open_01.mp3"),
      loadBuf("sfx/containers/closet_door_close_01.mp3"),
      loadBuf("sfx/containers/kitchen_drawer_open_01.mp3"),
      loadBuf("sfx/containers/kitchen_drawer_close_01.mp3"),
      loadBuf("sfx/containers/medicine_cabinet_open_01.mp3"),
      loadBuf("sfx/containers/medicine_cabinet_close_01.mp3"),
      loadBuf("sfx/containers/medicine_cabinet_close_02.mp3"),
      loadBuf("sfx/containers/office_drawer_open_01.mp3"),
      loadBuf("sfx/containers/office_drawer_close_01.mp3"),
      loadBuf("sfx/containers/fridge_open_close_es.mp3"),
      loadBuf("sfx/containers/drawer_open_close_es.mp3"),
      loadBuf("sfx/ui/phone_receiver_tone.mp3"),
      loadBuf("sfx/ui/phone_rotary_dial.mp3"),
      loadBuf("sfx/ui/phone_ring_and_pickup.mp3"),
      loadBuf("sfx/ui/phone_incoming_ringtone.mp3"),
    ]);
    // kitchen drawer: open a touch under close (closes read louder in real life)
    const kitOpen = kitOpenRaw
      ? normalizePeak(trimStartFraction(kitOpenRaw, 0.25), 0.36)
      : null;
    const kitCloseNorm = kitClose ? normalizePeak(kitClose, 0.48) : null;
    // office drawers — close sits above open
    const offOpen = offOpenRaw
      ? normalizePeak(trimLeadingSilence(offOpenRaw, 0.015), 0.62)
      : null;
    const offCloseNorm = offClose ? normalizePeak(offClose, 0.78) : null;
    // Opens sit under closes — equal peaks made opens read louder (brighter attack).
    const OPEN_PEAK = 0.58;
    const CLOSE_PEAK = 0.78;
    // Cabinet combo: peak 4 open, peak 6 close (close bumped a tad more — was quiet).
    const cabOpen = cabComboRaw
      ? normalizePeak(trimLeadingSilence(sliceBuffer(cabComboRaw, 3.12, 3.9), 0.01), 0.464)
      : null;
    const cabClose = cabComboRaw
      ? normalizePeak(trimLeadingSilence(sliceBuffer(cabComboRaw, 5.52, 6.5), 0.01), 0.672)
      : null;
    // Fridge open+close combo → fridge only (close raised a little).
    const fridgeOpen = fridgeComboRaw
      ? normalizePeak(trimLeadingSilence(sliceBuffer(fridgeComboRaw, 0.15, 0.85), 0.01), OPEN_PEAK)
      : null;
    const fridgeClose = fridgeComboRaw
      ? normalizePeak(trimLeadingSilence(sliceBuffer(fridgeComboRaw, 2.4, 3.05), 0.01), 0.984)
      : null;
    // Wooden drawer open (scrape) + close (slam) → bedroom dresser/nightstand/vanity.
    const woodDrawerOpen = drawerComboRaw
      ? normalizePeak(trimLeadingSilence(sliceBuffer(drawerComboRaw, 0.18, 1.05), 0.008), 0.42)
      : null;
    const woodDrawerClose = drawerComboRaw
      ? normalizePeak(trimLeadingSilence(sliceBuffer(drawerComboRaw, 1.55, 2.55), 0.01), 0.94)
      : null;
    // Closet doors — same open-under-close bias.
    const closetOpenNorm = closetOpen ? normalizePeak(closetOpen, OPEN_PEAK) : null;
    const closetCloseNorm = closetClose ? normalizePeak(closetClose, CLOSE_PEAK) : null;
    state.sell = sell;
    state.pack = pack;
    state.stamp = stamp;
    state.roomSwitch = roomSw;
    state.mainTheme = mainTheme;
    state.catHappy = happy;
    state.catStressed = stressed;
    state.catDesperate = desperate;
    // medicine: open under close
    const medOpenClips = medOpen ? [normalizePeak(medOpen, OPEN_PEAK)] : [];
    const medCloseClips = [medClose1, medClose2].filter(Boolean).map((b) => normalizePeak(b, CLOSE_PEAK));
    state.containerOpen = {
      cabinet: cabOpen ? [cabOpen] : [],
      closet: closetOpenNorm ? [closetOpenNorm] : [],
      // pantry: bedroom closet-door open for both open + close
      pantry: closetOpenNorm ? [closetOpenNorm] : [],
      kitchen_drawer: kitOpen ? [kitOpen] : [],
      medicine: medOpenClips,
      office: offOpen ? [offOpen] : [],
      fridge: fridgeOpen ? [fridgeOpen] : [],
      drawer: woodDrawerOpen ? [woodDrawerOpen] : [],
    };
    state.containerClose = {
      cabinet: cabClose ? [cabClose] : [],
      closet: closetCloseNorm ? [closetCloseNorm] : [],
      // pantry close: medicine cabinet close (leveled)
      pantry: medCloseClips.length ? medCloseClips : (closetOpenNorm ? [closetOpenNorm] : []),
      kitchen_drawer: kitCloseNorm ? [kitCloseNorm] : [],
      medicine: medCloseClips,
      office: offCloseNorm ? [offCloseNorm] : [],
      fridge: fridgeClose ? [fridgeClose] : [],
      drawer: woodDrawerClose ? [woodDrawerClose] : [],
    };
    // Landline: isolate usable slices from the titled source clips.
    // Receiver is already a clean ~1.7s tone → loop whole thing.
    // Peak targets sit under one-shot UI SFX so the line doesn't dominate.
    state.phoneReceiver = phoneReceiverRaw
      ? normalizePeak(trimLeadingSilence(phoneReceiverRaw, 0.01), 0.38)
      : null;
    // Rotary: first click cluster only (~1s), not the second half of the take.
    state.phoneRotary = phoneRotaryRaw
      ? normalizePeak(sliceBuffer(phoneRotaryRaw, 0.1, 1.15), 0.52)
      : null;
    // Ring file: two ~2s dial-tone bursts with a long gap, then a short pickup.
    // Filename says decrease gap 50% → we play bursts on a 2s/2s cadence in UI.
    state.phoneRingBurst = phoneRingRaw
      ? normalizePeak(sliceBuffer(phoneRingRaw, 0.16, 2.2), 0.4)
      : null;
    state.phoneAnswer = phoneRingRaw
      ? normalizePeak(sliceBuffer(phoneRingRaw, 8.85, 9.5), 0.55)
      : null;
    // Shirley calling you — trim long silent tail so the loop restarts after the
    // last bell cluster; sit under short UI one-shots (looped bells read louder).
    state.phoneIncomingRingtone = phoneIncomingRaw
      ? normalizePeak(trimLeadingSilence(sliceBuffer(phoneIncomingRaw, 0, 13.15), 0.01), 0.34)
      : null;
    state.phoneIncomingLoopDur = state.phoneIncomingRingtone?.duration || 0;
    state.ready = true;
    if (state.primed) startMainTheme();
  })();
  return state.loading;
}

function resumeCtx() {
  const ctx = ensureCtx();
  if (!ctx) return null;
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch {}
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function playBuffer(buf, volume = 1) {
  if (state.sfxVol <= 0.001) return;
  const ctx = resumeCtx();
  if (!ctx || !buf) return;
  try {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = volume * state.sfxVol * SFX_VOL_MAX;
    src.connect(gain).connect(ctx.destination);
    src.start(0);
  } catch {}
}

function pickOne(list) {
  if (!list?.length) return null;
  return list[(Math.random() * list.length) | 0];
}

function mainTargetVol() {
  const duck = state.phoneMusicDuck ? PHONE_MUSIC_DUCK : 1;
  return state.radioOn ? 0 : MUSIC_VOL_MAX * state.musicVol * duck;
}

function radioTargetVol() {
  const duck = state.phoneMusicDuck ? PHONE_MUSIC_DUCK : 1;
  return state.radioOn ? RADIO_VOL_MAX * state.musicVol * duck : 0;
}

function applyMusicGain() {
  try {
    if (state.mainGain) state.mainGain.gain.value = mainTargetVol();
  } catch {}
  try {
    if (state.radioGain) state.radioGain.gain.value = radioTargetVol();
  } catch {}
}

/** Soft-duck (or restore) BGM/radio during the landline ceremony. */
export function setPhoneMusicDuck(on) {
  state.phoneMusicDuck = !!on;
  const ctx = state.ctx;
  const now = ctx?.currentTime ?? 0;
  try {
    if (state.mainGain && ctx) {
      state.mainGain.gain.cancelScheduledValues(now);
      state.mainGain.gain.setTargetAtTime(mainTargetVol(), now, PHONE_DUCK_FADE);
    } else {
      applyMusicGain();
    }
  } catch {
    applyMusicGain();
  }
  try {
    if (state.radioGain && ctx) {
      state.radioGain.gain.cancelScheduledValues(now);
      state.radioGain.gain.setTargetAtTime(radioTargetVol(), now, PHONE_DUCK_FADE);
    }
  } catch {}
}

function silence(ms = SONG_GAP_MS) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Kill every music source immediately — one song at a time, no overlap. */
function stopAllMusicNow() {
  try { state.mainSrc?.stop(); } catch {}
  state.mainSrc = null;
  state.mainGain = null;
  state.musicStarted = false;
  try { state.radioSrc?.stop(); } catch {}
  state.radioSrc = null;
  state.radioGain = null;
}

export function startMainTheme() {
  const ctx = resumeCtx();
  if (!ctx || !state.mainTheme) return;
  // Never layer under radio, never start during a stop→gap→start switch,
  // and never start a second main loop.
  if (state.radioOn || state.musicBusy) return;
  if (state.musicStarted && state.mainSrc) {
    applyMusicGain();
    return;
  }
  try {
    try { state.mainSrc?.stop(); } catch {}
    const src = ctx.createBufferSource();
    src.buffer = state.mainTheme;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = MUSIC_VOL_MAX * state.musicVol;
    src.connect(gain).connect(ctx.destination);
    src.start(0);
    state.mainSrc = src;
    state.mainGain = gain;
    state.musicStarted = true;
  } catch {}
}

export function playMainTheme() {
  startMainTheme();
  applyMusicGain();
}

export function stopMainTheme() {
  try { state.mainSrc?.stop(); } catch {}
  state.mainSrc = null;
  state.mainGain = null;
  state.musicStarted = false;
}

export function setMainThemeVolume(volume) {
  setMusicVolume(volume);
}

async function ensureStationBuf(stationId) {
  // Drop caches leveled to an older target (HMR / prior session).
  if (state._radioRmsTarget !== RADIO_RMS_TARGET) {
    state.stations = {};
    state._radioRmsTarget = RADIO_RMS_TARGET;
  }
  if (state.stations[stationId]) return state.stations[stationId];
  const meta = RADIO_STATIONS.find((s) => s.id === stationId);
  if (!meta) return null;
  const raw = await loadBuf(meta.track);
  if (!raw) return null;
  // Level every station to Jazz-quiet (−17.5 dB RMS) so switches feel even.
  const buf = normalizeRms(raw, RADIO_RMS_TARGET);
  state.stations[stationId] = buf;
  return buf;
}

function stopRadioSource() {
  try { state.radioSrc?.stop(); } catch {}
  state.radioSrc = null;
  state.radioGain = null;
}

function startRadioSource(buf) {
  const ctx = resumeCtx();
  if (!ctx || !buf) return null;
  // Guarantee nothing else is playing when radio starts.
  try { state.mainSrc?.stop(); } catch {}
  state.mainSrc = null;
  state.mainGain = null;
  state.musicStarted = false;
  stopRadioSource();
  try {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = RADIO_VOL_MAX * state.musicVol;
    src.connect(gain).connect(ctx.destination);
    src.start(0);
    state.radioSrc = src;
    state.radioGain = gain;
    return gain;
  } catch {
    return null;
  }
}

/**
 * Hard music switch (no overlap):
 * stop whatever is playing → 1s silence → start the next track.
 * `to`: { kind: "main" } | { kind: "radio", stationId }
 * Bumps musicGen so a newer switch cancels a stale gap.
 */
export async function switchMusic(to) {
  const gen = ++state.musicGen;
  state.musicBusy = true;
  state.fading = true;
  try {
    stopAllMusicNow();
    await silence(SONG_GAP_MS);
    // Superseded — the newer switch owns the restart. Do not touch flags.
    if (gen !== state.musicGen) return false;
    if (state.musicVol <= 0.001) {
      // Volume muted mid-gap: stay silent, but clear radio so we can recover later.
      state.radioOn = false;
      return false;
    }

    if (to?.kind === "radio") {
      const id = to.stationId || state.radioStationId || "pop";
      await ensureAudioLoaded();
      const buf = await ensureStationBuf(id);
      if (gen !== state.musicGen) return false;
      if (!buf) {
        state.stationMiss = state.stationMiss || {};
        state.stationMiss[id] = true;
        state.radioOn = false;
        state.musicBusy = false;
        state.fading = false;
        startMainTheme();
        return false;
      }
      state.radioStationId = id;
      state.radioOn = true;
      startRadioSource(buf);
      return true;
    }

    // back to Cherry Blossom
    state.radioOn = false;
    state.musicBusy = false;
    state.fading = false;
    startMainTheme();
    return true;
  } finally {
    if (gen === state.musicGen) {
      state.musicBusy = false;
      state.fading = false;
    }
  }
}

/** @deprecated name kept for the radio prompt API — now a hard gap, not a blend. */
export async function crossfade(_fromTrack, toTrack) {
  if (toTrack === "radio") return switchMusic({ kind: "radio", stationId: state.radioStationId });
  return switchMusic({ kind: "main" });
}

export async function playStation(stationId) {
  const id = stationId || state.radioStationId || "pop";
  const ctx = resumeCtx();
  if (!ctx || state.musicVol <= 0.001) return false;

  // Same station already playing — no restart / no silence gap.
  if (state.radioOn && state.radioStationId === id && state.radioSrc) {
    applyMusicGain();
    return true;
  }

  state.radioStationId = id;
  // Don't set radioOn until audio actually starts — otherwise a failed/superseded
  // switch leaves radioOn=true with no source and blocks Cherry Blossom forever.
  const ok = await switchMusic({ kind: "radio", stationId: id });
  if (!ok && !state.radioSrc && !state.musicBusy) {
    state.radioOn = false;
    ensureMusicPlaying();
  }
  return ok;
}

export async function stopRadio() {
  if (!state.radioOn && !state.radioSrc) {
    state.radioOn = false;
    ensureMusicPlaying();
    return;
  }
  state.radioOn = false;
  await switchMusic({ kind: "main" });
}

export async function toggleRadio(stationId) {
  if (state.radioOn) {
    await stopRadio();
    return false;
  }
  // Powering on: pick a random available station (ignore last station unless
  // the caller passed an explicit id — panel station buttons use playStation).
  let id = stationId;
  if (!id) {
    const avail = RADIO_STATIONS.filter((s) => !(state.stationMiss && state.stationMiss[s.id]));
    const pool = avail.length ? avail : RADIO_STATIONS;
    id = pool[(Math.random() * pool.length) | 0].id;
  }
  return playStation(id);
}

export function setRadioVolume(volume) {
  const v = Math.max(0, Math.min(1, Number(volume) || 0));
  if (state.radioGain) {
    try {
      state.radioGain.gain.value = state.radioOn ? RADIO_VOL_MAX * state.musicVol * v : 0;
    } catch {}
  }
}

export function getRadioState() {
  return {
    on: state.radioOn,
    stationId: state.radioStationId,
    fading: state.fading || state.musicBusy,
    stations: RADIO_STATIONS.map((s) => ({
      ...s,
      available: !(state.stationMiss && state.stationMiss[s.id]),
    })),
  };
}

/**
 * If music should be audible but nothing is actually playing (HMR, stuck gap,
 * dead BufferSource), restart the right track. Safe to call often.
 */
export function ensureMusicPlaying() {
  if (!state.primed || state.musicBusy || state.musicVol <= 0.001) return;
  resumeCtx();
  const mainAlive = !!(state.mainSrc && state.musicStarted);
  const radioAlive = !!(state.radioSrc && state.radioOn);
  if (state.radioOn) {
    if (radioAlive) return;
    // Flag says on but source is dead — fall back to main rather than stay silent.
    state.radioOn = false;
  }
  if (!mainAlive) startMainTheme();
}

/** Prefetch all station buffers (call when radio panel opens). */
export async function preloadRadioStations() {
  await ensureAudioLoaded();
  await Promise.all(RADIO_STATIONS.map((s) => ensureStationBuf(s.id)));
  return getRadioState();
}

export function getAudioSettings() {
  return { musicVol: state.musicVol, sfxVol: state.sfxVol };
}

export function setMusicVolume(vol) {
  state.musicVol = Math.max(0, Math.min(1, Number(vol) || 0));
  savePrefs();
  if (state.musicVol > 0.001 && state.primed) startMainTheme();
  applyMusicGain();
}

export function setSfxVolume(vol) {
  state.sfxVol = Math.max(0, Math.min(1, Number(vol) || 0));
  savePrefs();
}

/** @deprecated — kept so older Settings toggles don't crash if hot-reloaded mid-edit */
export function setMusicEnabled(on) {
  setMusicVolume(on ? (state.musicVol > 0 ? state.musicVol : 1) : 0);
}
export function setSfxEnabled(on) {
  setSfxVolume(on ? (state.sfxVol > 0 ? state.sfxVol : 1) : 0);
}

export function primeAudio() {
  const ctx = resumeCtx();
  if (!ctx) return;
  state.primed = true;
  if (!state.keepAliveStarted && state.keepAliveBuf) {
    try {
      const src = ctx.createBufferSource();
      src.buffer = state.keepAliveBuf;
      src.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(gain).connect(ctx.destination);
      src.start(0);
      state.keepAliveStarted = true;
    } catch {}
  }
  ensureAudioLoaded().then(() => {
    startMainTheme();
    ensureMusicPlaying();
  });
  startMainTheme();
  ensureMusicPlaying();
}

export function playSellSound() {
  playBuffer(state.sell, 0.7);
}

export function playPackSfx() {
  playBuffer(state.pack, 1);
}

export function playDonateSfx() {
  playBuffer(state.pack, 0.7);
}

export function playStampSfx() {
  playBuffer(state.stamp, 1);
}

export function playRoomSwitchSfx() {
  playBuffer(state.roomSwitch, 0.7);
}

/* ---- Landline / Shirley ceremony (real phone MP3s + cadence) ---- */
let phoneRingTimer = null;

/** Duration of one ring burst (matches phoneRingBurst slice + rattle). */
export const PHONE_RING_ON_MS = 2000;
export const PHONE_RING_GAP_MS = 2000;

function toneBurst(freq, dur, vol = 0.35, type = "square") {
  if (state.sfxVol <= 0.001) return;
  const ctx = resumeCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    const v = vol * state.sfxVol * SFX_VOL_MAX;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(v, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  } catch {}
}

/** Handset up — loop the receiver tone until dial / hangup. */
export function startPhoneReceiverLoop() {
  stopPhoneReceiverLoop();
  const start = () => {
    const ctx = resumeCtx();
    const buf = state.phoneReceiver;
    if (!ctx || !buf || state.sfxVol <= 0.001) return;
    try {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = 0.48 * state.sfxVol * SFX_VOL_MAX;
      src.connect(gain).connect(ctx.destination);
      src.start(0);
      state.phoneReceiverSrc = src;
      state.phoneReceiverGain = gain;
    } catch {}
  };
  const p = ensureAudioLoaded();
  if (p && typeof p.then === "function") p.then(start);
  else start();
}

export function stopPhoneReceiverLoop() {
  try { state.phoneReceiverSrc?.stop(); } catch {}
  state.phoneReceiverSrc = null;
  state.phoneReceiverGain = null;
}

/** Shirley calling — loop bell ringtone as normal UI SFX (does not duck music). */
export function startPhoneIncomingRingtone() {
  stopPhoneIncomingRingtone();
  const start = () => {
    const ctx = resumeCtx();
    const buf = state.phoneIncomingRingtone;
    if (!ctx || !buf || state.sfxVol <= 0.001) return;
    try {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = 0.42 * state.sfxVol * SFX_VOL_MAX;
      src.connect(gain).connect(ctx.destination);
      state.phoneIncomingStartedAt = ctx.currentTime;
      state.phoneIncomingLoopDur = buf.duration;
      src.start(0);
      state.phoneIncomingSrc = src;
      state.phoneIncomingGain = gain;
      startIncomingPulseClock();
    } catch {}
  };
  const p = ensureAudioLoaded();
  if (p && typeof p.then === "function") p.then(start);
  else start();
}

export function stopPhoneIncomingRingtone() {
  stopIncomingPulseClock();
  try { state.phoneIncomingSrc?.stop(); } catch {}
  state.phoneIncomingSrc = null;
  state.phoneIncomingGain = null;
}

/** Soft click fallback (used only if receiver MP3 missing). */
export function playPhonePickupSfx() {
  stopPhoneIncomingRingtone();
  if (state.phoneReceiver) {
    startPhoneReceiverLoop();
    return;
  }
  toneBurst(420, 0.06, 0.22, "triangle");
  setTimeout(() => toneBurst(280, 0.08, 0.18, "triangle"), 40);
}

/** Short rotary click (~1s) when you choose to dial. */
export function playPhoneRotaryDial() {
  stopPhoneReceiverLoop();
  ensureAudioLoaded();
  if (state.phoneRotary) {
    playBuffer(state.phoneRotary, 0.65);
    return;
  }
  // procedural fallback
  toneBurst(900, 0.05, 0.2, "square");
  setTimeout(() => toneBurst(700, 0.08, 0.18, "square"), 80);
  setTimeout(() => toneBurst(1100, 0.06, 0.16, "square"), 200);
}

/** One dial-tone ring burst — sync with phone rattle. */
export function playPhoneRingBurst() {
  ensureAudioLoaded();
  if (state.phoneRingBurst) {
    playBuffer(state.phoneRingBurst, 0.55);
    return;
  }
  if (state.sfxVol <= 0.001) return;
  const pair = () => {
    toneBurst(880, 0.18, 0.28, "square");
    setTimeout(() => toneBurst(740, 0.18, 0.26, "square"), 200);
  };
  pair();
  setTimeout(pair, 450);
}

/** Shirley picks up — short answer click at end of ring file. */
export function playPhoneAnswerSfx() {
  stopPhoneReceiverLoop();
  stopPhoneRingSfx();
  stopPhoneIncomingRingtone();
  ensureAudioLoaded();
  if (state.phoneAnswer) {
    playBuffer(state.phoneAnswer, 0.7);
    return;
  }
  toneBurst(520, 0.05, 0.2, "triangle");
  setTimeout(() => toneBurst(340, 0.07, 0.16, "triangle"), 40);
}

/** Hang up — same pickup/answer click to close the call loop. */
export function playPhoneHangupSfx() {
  stopPhoneReceiverLoop();
  stopPhoneRingSfx();
  stopPhoneIncomingRingtone();
  setPhoneMusicDuck(false);
  playPhoneAnswerSfx();
}

/**
 * Classic cadence: ring on, gap, repeat `bursts` times.
 * Default 2s on / 2s off matches the dial-tone slices (gap halved vs source).
 * `onBurst(i)` fires at the start of each ring; `onDone` after the final gap.
 * Returns a cancel fn.
 */
export function playPhoneRingPattern({
  bursts = 2,
  onMs = PHONE_RING_ON_MS,
  gapMs = PHONE_RING_GAP_MS,
  onBurst,
  onDone,
} = {}) {
  stopPhoneRingSfx();
  const timers = [];
  const later = (ms, fn) => {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  };
  phoneRingTimer = { clear() { timers.forEach(clearTimeout); } };

  let i = 0;
  const run = () => {
    if (i >= bursts) {
      phoneRingTimer = null;
      onDone?.();
      return;
    }
    const idx = i;
    i += 1;
    onBurst?.(idx);
    playPhoneRingBurst();
    later(onMs + gapMs, run);
  };
  run();

  return () => {
    timers.forEach(clearTimeout);
    phoneRingTimer = null;
  };
}

/** @deprecated Prefer playPhoneRingPattern */
export function playPhoneRingSfx(loops = 2) {
  playPhoneRingPattern({ bursts: loops });
}

export function stopPhoneRingSfx() {
  if (phoneRingTimer) {
    if (typeof phoneRingTimer === "object" && phoneRingTimer.clear) {
      phoneRingTimer.clear();
    } else {
      clearInterval(phoneRingTimer);
    }
    phoneRingTimer = null;
  }
}

function containerKind(objectId, zone) {
  if (!objectId) return "cabinet";
  // Kitchen counter only: upper drawers vs lower cabinets
  if (objectId === "counter_sink" && zone === "upper") return "kitchen_drawer";
  if (objectId === "counter_sink" && zone === "lower") return "cabinet";
  if (objectId === "pantry") return "pantry";
  if (objectId.includes("closet")) return "closet";
  if (objectId.includes("medicine") || objectId === "mirror_cabinet") return "medicine";
  if (objectId === "fridge" || objectId.includes("fridge")) return "fridge";
  // bedroom wood drawers — dedicated open-scrape / close-slam combo
  if (
    objectId === "nightstand" ||
    objectId === "dresser" ||
    objectId === "vanity"
  ) return "drawer";
  // office side cabinet is a cabinet door, not a desk drawer
  if (objectId === "side_cabinet") return "cabinet";
  if (
    objectId.includes("desk") ||
    objectId === "desk_hutch" ||
    objectId.includes("office")
  ) return "office";
  if (objectId.includes("drawer") || objectId === "counter_sink") return "kitchen_drawer";
  // bath_vanity / bar / tv / everything else → generic cabinet (peak 4/6)
  return "cabinet";
}

/** Which half of the counter was tapped (sprite-local Y). */
export function kitchenTapZone(objectId, localY) {
  if (objectId === "counter_sink") {
    // upper drawer row (y≈18–26) vs lower cabinet doors (y≈27+)
    return localY < 26.5 ? "upper" : "lower";
  }
  return null;
}

export function playContainerSfx(objectId, which = "open", zone = null) {
  const kind = containerKind(objectId, zone);
  const map = which === "open" ? state.containerOpen : state.containerClose;
  // kitchen open/close are peak-matched at load; use a flat container volume
  playBuffer(pickOne(map[kind] || map.cabinet), 0.85);
}

/** README: happy_content / stressed / desperate. Ambient = happy only, rare. */
export function playCatSfx(kind = "happy") {
  if (!state.musicStarted) return;
  const now = performance.now();
  if (now - state.lastMeowAt < 8000) return;
  const map = {
    happy: state.catHappy,
    stressed: state.catStressed,
    desperate: state.catDesperate,
  };
  const list = kind === "happy" ? state.catHappy : (map[kind] || state.catHappy);
  const buf = pickOne(list);
  if (!buf) return;
  state.lastMeowAt = now;
  playBuffer(buf, 0.2);
}

export function isAudioReady() {
  return state.ready;
}
