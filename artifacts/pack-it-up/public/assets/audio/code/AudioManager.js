// Minimal browser audio manager for Pack It Up.
// Paths assume this folder is served as /assets/audio/.

import { AUDIO_ASSETS } from "./audioManifest.js";

export class AudioManager {
  constructor({ root = "/assets/audio/", mainVolume = 0.55, radioVolume = 0.45, sfxVolume = 0.8 } = {}) {
    this.root = root;
    this.mainVolume = mainVolume;
    this.radioVolume = radioVolume;
    this.sfxVolume = sfxVolume;
    this.main = null;
    this.radio = null;
    this.currentStationId = null;
  }

  makeAudio(path, { loop = false, volume = 1 } = {}) {
    const audio = new Audio(this.root + path);
    audio.loop = loop;
    audio.volume = volume;
    audio.preload = "auto";
    return audio;
  }

  async playMainTheme() {
    if (!this.main) {
      this.main = this.makeAudio(AUDIO_ASSETS.music.main.path, {
        loop: true,
        volume: this.mainVolume
      });
    }
    await this.main.play();
  }

  stopMainTheme() {
    if (!this.main) return;
    this.main.pause();
    this.main.currentTime = 0;
  }

  setMainThemeVolume(volume) {
    this.mainVolume = volume;
    if (this.main) this.main.volume = volume;
  }

  getStation(stationId) {
    return AUDIO_ASSETS.music.stations.find((station) => station.id === stationId);
  }

  async playStation(stationId) {
    const station = this.getStation(stationId);
    if (!station || !station.available || !station.path) {
      console.warn(`Station unavailable: ${stationId}`);
      return false;
    }

    this.currentStationId = stationId;

    if (this.main && !this.main.paused) {
      await this.crossfade(this.main, null, 900);
      this.main.pause();
    }

    if (this.radio) {
      this.radio.pause();
      this.radio.currentTime = 0;
    }

    this.radio = this.makeAudio(station.path, {
      loop: true,
      volume: 0
    });
    await this.radio.play();
    await this.crossfade(null, this.radio, 900, this.radioVolume);
    return true;
  }

  async stopRadio() {
    if (this.radio) {
      await this.crossfade(this.radio, null, 900);
      this.radio.pause();
      this.radio.currentTime = 0;
      this.radio = null;
    }
    this.currentStationId = null;
    await this.playMainTheme();
  }

  async toggleRadio(stationId = "oldies") {
    if (this.radio && !this.radio.paused) {
      await this.stopRadio();
    } else {
      await this.playStation(stationId);
    }
  }

  setRadioVolume(volume) {
    this.radioVolume = volume;
    if (this.radio) this.radio.volume = volume;
  }

  playSfx(pathOrId) {
    const asset = AUDIO_ASSETS.assets.find((item) => item.id === pathOrId);
    const path = asset ? asset.path : pathOrId;
    const sfx = this.makeAudio(path, { loop: false, volume: this.sfxVolume });
    sfx.play().catch(() => {});
    return sfx;
  }

  crossfade(fromTrack, toTrack, durationMs = 1000, toVolume = 1) {
    return new Promise((resolve) => {
      const start = performance.now();
      const fromStartVolume = fromTrack ? fromTrack.volume : 0;
      if (toTrack) toTrack.volume = 0;

      const tick = (now) => {
        const t = Math.min(1, (now - start) / durationMs);
        if (fromTrack) fromTrack.volume = fromStartVolume * (1 - t);
        if (toTrack) toTrack.volume = toVolume * t;
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };

      requestAnimationFrame(tick);
    });
  }
}
