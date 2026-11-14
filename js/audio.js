/**
 * raIn.tensity - Real Acoustic Rain, Atmospheric Wind & Lo-Fi Engine
 * Powered by Normalized Field Audio Recordings, Howling Wind SFX & CC-BY Purrple Cat Beats
 */

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isPlaying = false;
    this.lofiEnabled = false;

    this.rainVolume = 0.90;
    this.lofiVolume = 0.60;

    // Real Audio Elements & Web Audio Nodes
    this.audioElements = {};
    this.audioSources = {};
    this.gains = {};

    // Current state
    this.currentRainRate = 0;
    this.currentZoom = 2.5;
    this.lastState = { rate: 0, zoom: 2.5, active: false };

    // Analyser node for Lo-Fi dancing bars
    this.analyser = null;
    this.analyserData = null;
    this.visualizerCallback = null;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master gains
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Altitude Distance Lowpass Filter
    this.distanceFilter = this.ctx.createBiquadFilter();
    this.distanceFilter.type = 'lowpass';
    this.distanceFilter.frequency.setValueAtTime(3500, this.ctx.currentTime);

    // Heavy Rain Low-End Body Booster (Resonant 80Hz Sub Bass)
    this.subBassBoost = this.ctx.createBiquadFilter();
    this.subBassBoost.type = 'lowshelf';
    this.subBassBoost.frequency.setValueAtTime(110, this.ctx.currentTime);
    this.subBassBoost.gain.setValueAtTime(3.5, this.ctx.currentTime); // +3.5dB warm weight

    this.rainMaster = this.ctx.createGain();
    this.rainMaster.gain.setValueAtTime(0, this.ctx.currentTime);
    this.rainMaster.connect(this.subBassBoost);
    this.subBassBoost.connect(this.distanceFilter);
    this.distanceFilter.connect(this.masterGain);

    // Atmospheric Wind & Breeze Gentle Lowpass (eliminates any harsh whistling/steam train resonance)
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.setValueAtTime(620, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(0.707, this.ctx.currentTime); // Butterworth smooth roll-off

    this.windMaster = this.ctx.createGain();
    this.windMaster.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.windMaster.connect(this.windFilter);
    this.windFilter.connect(this.rainMaster);

    this.lofiMaster = this.ctx.createGain();
    this.lofiMaster.gain.setValueAtTime(0, this.ctx.currentTime);

    // Analyser for real-time visualizer
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);
    this.lofiMaster.connect(this.analyser);
    this.analyser.connect(this.masterGain);

    // Load Real Environmental Audio Tracks (Normalized Broadcast Loudness)
    this.loadAudioTrack('rain_light', 'audio/rain_light.ogg', this.rainMaster);
    this.loadAudioTrack('rain_window', 'audio/rain_window.ogg', this.rainMaster);
    this.loadAudioTrack('rain_heavy', 'audio/rain_heavy.ogg', this.rainMaster);
    this.loadAudioTrack('storm_heavy', 'audio/storm_heavy.ogg', this.rainMaster);
    this.loadAudioTrack('rain_thunder', 'audio/rain_thunder.ogg', this.rainMaster);
    this.loadAudioTrack('wind_breeze', 'audio/wind_breeze.ogg', this.windMaster);
    this.loadAudioTrack('wind_howl', 'audio/wind_breeze.ogg', this.windMaster); // alias fallback

    // Load Real Lo-Fi Chillhop Track
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

    // Altitude Distance Acoustics: High orbit (zoom < 3) is filtered to 1100Hz; Ground level (zoom > 5) opens to 20,000Hz!
    const zoomFactor = Math.min(1.0, Math.max(0.22, (this.currentZoom - 1.4) / 4.2));
    const filterCutoff = 1100 + zoomFactor * 18900;
    this.distanceFilter.frequency.setTargetAtTime(filterCutoff, now, 0.2);

    // Master rain gain
    const targetRainVol = audible ? this.rainVolume : 0;
    this.rainMaster.gain.setTargetAtTime(targetRainVol, now, 0.15);

    if (!audible) {
      Object.keys(this.gains).forEach((k) => {
        if (k !== 'lofi_beat' && this.gains[k]) {
          this.gains[k].gain.setTargetAtTime(0, now, 0.18);
        }
      });
      return;
    }

    // Play underlying HTML5 audio elements if paused
    ['rain_light', 'rain_window', 'rain_heavy', 'storm_heavy', 'rain_thunder', 'wind_breeze', 'wind_howl'].forEach((id) => {
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

    // 2. Tactile Droplets / Window Patter layer (Crisp individual droplet taps)
    let windowVol = 0;
    if (r >= 0.5) {
      windowVol = Math.min(1.0, Math.max(0, (r - 0.5) / 3.0));
      if (r > 12.0) {
        windowVol = Math.max(0.45, 1.0 - (r - 12.0) / 18.0);
      }
    }

    // 3. Heavy Rain Downpour layer (Pounding summer deluge, kicks in strong from 4.0 mm/hr)
    let heavyVol = 0;
    if (r >= 3.5) {
      heavyVol = Math.min(1.0, Math.max(0, (r - 3.5) / 10.0));
    }

    // 4. Storm Heavy Tempest layer (Massive downpour body, dominates for heavy downpours > 12 mm/hr)
    let stormVol = 0;
    if (r >= 10.0) {
      stormVol = Math.min(1.0, Math.max(0, (r - 10.0) / 16.0));
    }

    // 5. Atmospheric Forest Breeze (Natural soft rushing air, filtered to eliminate any steam whistling)
    let breezeVol = 0;
    if (r >= 2.5) {
      breezeVol = Math.min(0.72, Math.max(0, (r - 2.5) / 16.0));
    }

    // 6. Thunderstorm layer (Convective thunderstorms > 18 mm/hr)
    let thunderVol = 0;
    if (r >= 18.0) {
      thunderVol = Math.min(1.0, Math.max(0, (r - 18.0) / 20.0));
    }

    // Apply calculated exponential cross-fades smoothly
    if (this.gains['rain_light']) this.gains['rain_light'].gain.setTargetAtTime(lightVol * 0.9, now, 0.2);
    if (this.gains['rain_window']) this.gains['rain_window'].gain.setTargetAtTime(windowVol * 0.95, now, 0.2);
    if (this.gains['rain_heavy']) this.gains['rain_heavy'].gain.setTargetAtTime(heavyVol * 1.0, now, 0.2);
    if (this.gains['storm_heavy']) this.gains['storm_heavy'].gain.setTargetAtTime(stormVol * 1.0, now, 0.2);
    if (this.gains['wind_breeze']) this.gains['wind_breeze'].gain.setTargetAtTime(breezeVol * 0.70, now, 0.25);
    if (this.gains['rain_thunder']) this.gains['rain_thunder'].gain.setTargetAtTime(thunderVol * 0.9, now, 0.25);
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
  // MASTER CONTROLS
  // ==========================================

  startAudio() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPlaying = true;
    this.isMuted = false;
    this.updateRain(this.lastState.rate, this.lastState.zoom, true);
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
      if (this.lofiEnabled) {
        this.setLoFi(true);
      }
    }
    return this.isMuted;
  }

  setRainVolume(v) {
    this.rainVolume = Math.max(0, Math.min(1, v));
    if (this.ctx && this.isPlaying && !this.isMuted) {
      this.updateRain(this.lastState.rate, this.lastState.zoom, this.lastState.active);
    }
  }

  setLoFiVolume(v) {
    this.lofiVolume = Math.max(0, Math.min(1, v));
    if (this.ctx && this.lofiEnabled && !this.isMuted) {
      this.lofiMaster.gain.setTargetAtTime(this.lofiVolume, this.ctx.currentTime, 0.08);
    }
  }

  onVisualizer(cb) {
    this.visualizerCallback = cb;
  }
}
