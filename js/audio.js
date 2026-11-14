/**
 * Terraphone - Real Acoustic Rain, Atmospheric Wind, NASA Convective Thunder & Location Ambience Engine
 * Multi-layer Web Audio architecture with 4-channel mixer: Rain, Thunder, Ambience, Lo-Fi
 */

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isPlaying = false;
    this.lofiEnabled = false;

    // 4 Independent Channel Volumes
    this.rainVolume = 0.85;
    this.thunderVolume = 0.80;
    this.ambienceVolume = 0.70;
    this.lofiVolume = 0.55;

    // Audio Elements, Web Audio Sources & Gains
    this.audioElements = {};
    this.audioSources = {};
    this.gains = {};

    // Current environment & state
    this.currentEnv = 'rural'; // 'urban' | 'rural' | 'jungle' | 'ocean'
    this.currentRainRate = 0;
    this.currentZoom = 2.5;
    this.lastState = { rate: 0, zoom: 2.5, active: false };

    // Analyser node for Lo-Fi dancing bars
    this.analyser = null;
    this.analyserData = null;
    this.visualizerCallback = null;

    // Thunder strike callback (for visual lightning flash)
    this.thunderCallback = null;
    this.lastThunderTime = 0;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master Destination Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Altitude Distance Lowpass Filter (simulates sound propagation through atmosphere)
    this.distanceFilter = this.ctx.createBiquadFilter();
    this.distanceFilter.type = 'lowpass';
    this.distanceFilter.frequency.setValueAtTime(3500, this.ctx.currentTime);

    // Heavy Rain Low-End Body Booster (Resonant 110Hz Sub Bass)
    this.subBassBoost = this.ctx.createBiquadFilter();
    this.subBassBoost.type = 'lowshelf';
    this.subBassBoost.frequency.setValueAtTime(110, this.ctx.currentTime);
    this.subBassBoost.gain.setValueAtTime(3.5, this.ctx.currentTime);

    // 1. RAIN MASTER BUS
    this.rainMaster = this.ctx.createGain();
    this.rainMaster.gain.setValueAtTime(0, this.ctx.currentTime);
    this.rainMaster.connect(this.subBassBoost);
    this.subBassBoost.connect(this.distanceFilter);
    this.distanceFilter.connect(this.masterGain);

    // Atmospheric Wind & Breeze Filter (620Hz Butterworth lowpass)
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.setValueAtTime(620, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(0.707, this.ctx.currentTime);

    this.windMaster = this.ctx.createGain();
    this.windMaster.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.windMaster.connect(this.windFilter);
    this.windFilter.connect(this.rainMaster);

    // 2. THUNDER MASTER BUS (NASA Convective Storms)
    this.thunderMaster = this.ctx.createGain();
    this.thunderMaster.gain.setValueAtTime(this.thunderVolume, this.ctx.currentTime);
    // Connect thunder to distance filter for atmospheric perspective
    this.thunderMaster.connect(this.distanceFilter);

    // 3. AMBIENCE MASTER BUS (Location-dependent: Urban / Rural / Jungle / Ocean)
    this.ambienceMaster = this.ctx.createGain();
    this.ambienceMaster.gain.setValueAtTime(0, this.ctx.currentTime);
    this.ambienceMaster.connect(this.masterGain);

    // 4. LO-FI MASTER BUS
    this.lofiMaster = this.ctx.createGain();
    this.lofiMaster.gain.setValueAtTime(0, this.ctx.currentTime);

    // Real-time frequency analyser for Lo-Fi visualizer
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);
    this.lofiMaster.connect(this.analyser);
    this.analyser.connect(this.masterGain);

    // Load Rain & Wind Audio Tracks
    this.loadAudioTrack('rain_light', 'audio/rain_light.ogg', this.rainMaster);
    this.loadAudioTrack('rain_window', 'audio/rain_window.ogg', this.rainMaster);
    this.loadAudioTrack('rain_heavy', 'audio/rain_heavy.ogg', this.rainMaster);
    this.loadAudioTrack('storm_heavy', 'audio/storm_heavy.ogg', this.rainMaster);
    this.loadAudioTrack('wind_breeze', 'audio/wind_breeze.ogg', this.windMaster);

    // Load NASA Thunder Convective Track
    this.loadAudioTrack('rain_thunder', 'audio/rain_thunder.ogg', this.thunderMaster);

    // Load Location Environment Ambience Tracks
    this.loadAudioTrack('ambience_urban', 'audio/ambience_urban.ogg', this.ambienceMaster);
    this.loadAudioTrack('ambience_rural', 'audio/ambience_rural.ogg', this.ambienceMaster);
    this.loadAudioTrack('ambience_jungle', 'audio/ambience_jungle.ogg', this.ambienceMaster);
    this.loadAudioTrack('ambience_ocean', 'audio/ambience_ocean.ogg', this.ambienceMaster);

    // Load Lo-Fi Chillhop Track
    this.loadAudioTrack('lofi_beat', 'audio/lofi_cold_rainy.ogg', this.lofiMaster);

    this.startVisualizerTicker();
  }

  loadAudioTrack(id, src, destinationNode) {
    const audio = new Audio();
    audio.src = src;
    audio.loop = true;
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';

    const source = this.ctx.createMediaElementSource(audio);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);

    source.connect(gain);
    gain.connect(destinationNode);

    this.audioElements[id] = audio;
    this.audioSources[id] = source;
    this.gains[id] = gain;
  }

  // Cross-fade real rain tracks & storm wind based on observed IMERG mm/hr precipitation rate
  updateRain(rate, zoom, isListening) {
    this.currentRainRate = Math.max(0, rate || 0);
    this.currentZoom = zoom || 2.5;
    this.lastState = { rate: this.currentRainRate, zoom: this.currentZoom, active: isListening };

    if (!this.ctx) return;
    const c = this.ctx;
    const now = c.currentTime;

    const r = this.currentRainRate;
    const hasRain = r > 0.05;
    const audible = isListening && hasRain && !this.isMuted;

    // Altitude Distance Acoustics: Orbit (zoom < 3) filtered to 1100Hz; Surface (zoom > 5) opens up to 20kHz
    const zoomFactor = Math.min(1.0, Math.max(0.22, (this.currentZoom - 1.4) / 4.2));
    const filterCutoff = 1100 + zoomFactor * 18900;
    this.distanceFilter.frequency.setTargetAtTime(filterCutoff, now, 0.2);

    // Rain Master Gain
    const targetRainVol = audible ? this.rainVolume : 0;
    this.rainMaster.gain.setTargetAtTime(targetRainVol, now, 0.15);

    // Thunder Master Gain
    const targetThunderVol = (isListening && !this.isMuted) ? this.thunderVolume : 0;
    this.thunderMaster.gain.setTargetAtTime(targetThunderVol, now, 0.2);

    if (!audible) {
      ['rain_light', 'rain_window', 'rain_heavy', 'storm_heavy', 'wind_breeze', 'rain_thunder'].forEach((k) => {
        if (this.gains[k]) {
          this.gains[k].gain.setTargetAtTime(0, now, 0.2);
        }
      });
      return;
    }

    // Play underlying HTML5 audio elements if paused
    ['rain_light', 'rain_window', 'rain_heavy', 'storm_heavy', 'wind_breeze', 'rain_thunder'].forEach((id) => {
      const el = this.audioElements[id];
      if (el && el.paused) {
        el.play().catch(() => {});
      }
    });

    // 1. Light Rain layer (Dominant at 0.1 – 4.0 mm/hr)
    let lightVol = 0;
    if (r < 6.0) {
      lightVol = Math.min(1.0, Math.max(0, r / 1.5));
    } else {
      lightVol = Math.max(0, 1.0 - (r - 6.0) / 10.0);
    }

    // 2. Tactile Droplets / Window Patter layer (Crisp droplet impacts)
    let windowVol = 0;
    if (r >= 0.5) {
      windowVol = Math.min(1.0, Math.max(0, (r - 0.5) / 3.0));
      if (r > 12.0) {
        windowVol = Math.max(0.40, 1.0 - (r - 12.0) / 18.0);
      }
    }

    // 3. Heavy Rain Downpour layer (Pounding deluge, kicks in strong from 3.5 mm/hr)
    let heavyVol = 0;
    if (r >= 3.5) {
      heavyVol = Math.min(1.0, Math.max(0, (r - 3.5) / 10.0));
    }

    // 4. Storm Heavy Tempest layer (Massive downpour body, dominates for heavy downpours > 10 mm/hr)
    let stormVol = 0;
    if (r >= 10.0) {
      stormVol = Math.min(1.0, Math.max(0, (r - 10.0) / 16.0));
    }

    // 5. Atmospheric Forest Breeze
    let breezeVol = 0;
    if (r >= 2.0) {
      breezeVol = Math.min(0.72, Math.max(0, (r - 2.0) / 16.0));
    }

    // 6. Rolling Convective Thunder (NASA convective storm threshold: r > 12 mm/hr)
    let thunderVol = 0;
    if (r >= 12.0) {
      thunderVol = Math.min(1.0, Math.max(0.15, (r - 12.0) / 22.0));
    }

    // Apply smooth crossfades
    if (this.gains['rain_light']) this.gains['rain_light'].gain.setTargetAtTime(lightVol * 0.9, now, 0.2);
    if (this.gains['rain_window']) this.gains['rain_window'].gain.setTargetAtTime(windowVol * 0.95, now, 0.2);
    if (this.gains['rain_heavy']) this.gains['rain_heavy'].gain.setTargetAtTime(heavyVol * 1.0, now, 0.2);
    if (this.gains['storm_heavy']) this.gains['storm_heavy'].gain.setTargetAtTime(stormVol * 1.0, now, 0.2);
    if (this.gains['wind_breeze']) this.gains['wind_breeze'].gain.setTargetAtTime(breezeVol * 0.70, now, 0.25);
    if (this.gains['rain_thunder']) this.gains['rain_thunder'].gain.setTargetAtTime(thunderVol * 0.95, now, 0.3);
  }

  // ==========================================
  // LOCATION-DEPENDENT AMBIENCE
  // Urban / Rural / Jungle / Ocean
  // ==========================================

  updateAmbience(envType, isListening) {
    this.currentEnv = envType || 'rural';
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const audible = isListening && !this.isMuted;

    // Ambience Master Gain
    const targetAmbienceVol = audible ? this.ambienceVolume : 0;
    this.ambienceMaster.gain.setTargetAtTime(targetAmbienceVol, now, 0.35);

    const envMap = {
      urban: 'ambience_urban',
      rural: 'ambience_rural',
      jungle: 'ambience_jungle',
      ocean: 'ambience_ocean'
    };

    const activeTrackKey = envMap[this.currentEnv] || 'ambience_rural';

    // Play active ambience audio track
    if (audible) {
      const activeEl = this.audioElements[activeTrackKey];
      if (activeEl && activeEl.paused) {
        activeEl.play().catch(() => {});
      }
    }

    // Smoothly cross-fade all 4 ambience tracks
    Object.entries(envMap).forEach(([type, trackKey]) => {
      const gainNode = this.gains[trackKey];
      if (!gainNode) return;
      const targetGain = (audible && type === this.currentEnv) ? 1.0 : 0.0;
      gainNode.gain.setTargetAtTime(targetGain, now, 0.6); // 600ms organic crossfade
    });
  }

  // ==========================================
  // NASA THUNDER & LIGHTNING STRIKE
  // ==========================================

  triggerThunderStrike(intensity = 1.0) {
    if (!this.ctx || this.isMuted) return;
    const now = Date.now();
    // Debounce to at most once every 3.5s
    if (now - this.lastThunderTime < 3500) return;
    this.lastThunderTime = now;

    const thunderEl = this.audioElements['rain_thunder'];
    if (thunderEl) {
      if (thunderEl.paused) {
        thunderEl.play().catch(() => {});
      }
      // Temporarily bump thunder gain for lightning strike impact
      const audioNow = this.ctx.currentTime;
      const originalGain = this.gains['rain_thunder'] ? this.gains['rain_thunder'].gain.value : 0.5;
      if (this.gains['rain_thunder']) {
        this.gains['rain_thunder'].gain.setValueAtTime(Math.min(1.3, originalGain + 0.6 * intensity), audioNow);
        this.gains['rain_thunder'].gain.exponentialRampToValueAtTime(Math.max(0.1, originalGain), audioNow + 4.0);
      }
    }

    // Trigger visual lightning flash callback
    if (this.thunderCallback) {
      this.thunderCallback({ intensity, duration: 450 });
    }
  }

  onThunder(cb) {
    this.thunderCallback = cb;
  }

  // ==========================================
  // REAL LO-FI CHILLHOP BEATS
  // ==========================================

  setLoFi(enabled) {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.lofiEnabled = enabled;
    const now = this.ctx.currentTime;
    const lofiEl = this.audioElements['lofi_beat'];

    if (enabled && !this.isMuted) {
      if (lofiEl && lofiEl.paused) {
        lofiEl.play().catch(() => {});
      }
      this.lofiMaster.gain.setTargetAtTime(this.lofiVolume, now, 0.2);
      if (this.gains['lofi_beat']) {
        this.gains['lofi_beat'].gain.setTargetAtTime(1.0, now, 0.2);
      }
    } else {
      this.lofiMaster.gain.setTargetAtTime(0, now, 0.2);
      if (this.gains['lofi_beat']) {
        this.gains['lofi_beat'].gain.setTargetAtTime(0, now, 0.2);
      }
    }
  }

  startVisualizerTicker() {
    setInterval(() => {
      if (!this.visualizerCallback || !this.analyser || !this.lofiEnabled || this.isMuted) return;
      this.analyser.getByteFrequencyData(this.analyserData);
      const b1 = this.analyserData[2] / 255;
      const b2 = this.analyserData[6] / 255;
      const b3 = this.analyserData[12] / 255;
      this.visualizerCallback([b1, b2, b3]);
    }, 60);
  }

  // ==========================================
  // 4-CHANNEL VOLUME CONTROLS
  // ==========================================

  setRainVolume(v) {
    this.rainVolume = Math.max(0, Math.min(1, v));
    if (this.ctx && this.isPlaying && !this.isMuted) {
      this.updateRain(this.lastState.rate, this.lastState.zoom, this.lastState.active);
    }
  }

  setThunderVolume(v) {
    this.thunderVolume = Math.max(0, Math.min(1, v));
    if (this.ctx && this.thunderMaster && !this.isMuted) {
      this.thunderMaster.gain.setTargetAtTime(this.thunderVolume, this.ctx.currentTime, 0.1);
    }
  }

  setAmbienceVolume(v) {
    this.ambienceVolume = Math.max(0, Math.min(1, v));
    if (this.ctx && this.ambienceMaster && !this.isMuted) {
      this.ambienceMaster.gain.setTargetAtTime(this.ambienceVolume, this.ctx.currentTime, 0.1);
    }
  }

  setLoFiVolume(v) {
    this.lofiVolume = Math.max(0, Math.min(1, v));
    if (this.ctx && this.lofiEnabled && !this.isMuted) {
      this.lofiMaster.gain.setTargetAtTime(this.lofiVolume, this.ctx.currentTime, 0.08);
    }
  }

  // ==========================================
  // PLAYBACK & MUTE
  // ==========================================

  startAudio() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPlaying = true;
    this.isMuted = false;
    this.updateRain(this.lastState.rate, this.lastState.zoom, true);
    this.updateAmbience(this.currentEnv, true);
    if (this.lofiEnabled) {
      this.setLoFi(true);
    }
  }

  toggleMute() {
    if (!this.ctx) {
      this.startAudio();
      return false;
    }

    this.isMuted = !this.isMuted;
    const now = this.ctx.currentTime;

    if (this.isMuted) {
      this.masterGain.gain.setTargetAtTime(0, now, 0.08);
    } else {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.masterGain.gain.setTargetAtTime(1.0, now, 0.08);
      this.updateRain(this.lastState.rate, this.lastState.zoom, this.lastState.active);
      this.updateAmbience(this.currentEnv, this.lastState.active);
      if (this.lofiEnabled) {
        this.setLoFi(true);
      }
    }
    return this.isMuted;
  }

  onVisualizer(cb) {
    this.visualizerCallback = cb;
  }
}
