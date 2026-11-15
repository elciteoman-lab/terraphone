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
    this.lofiVolume = 0.0; // Lo-Fi starts at 0 (controlled by bottom-right slider)

    // Granular Ambience Sub-layer Volumes (Traffic, Honking, Animals, Birds, Voices)
    this.granularVolumes = {
      traffic: 0.60,
      horns: 0.40,
      animals: 0.50,
      birds: 0.50,
      voices: 0.40
    };
    this.granularGains = {};

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

    // City-Specific Acoustic Signature Engine
    this.currentCityKey = null;
    this.citySoundTimer = null;
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

    // Granular Ambience sub-nodes
    const layers = ['traffic', 'horns', 'animals', 'birds', 'voices'];
    layers.forEach(layer => {
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(this.granularVolumes[layer], this.ctx.currentTime);
      g.connect(this.ambienceMaster);
      this.granularGains[layer] = g;
    });

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

    // Load Granular Ambience Tracks into their dedicated gain nodes
    this.loadAudioTrack('granular_traffic', 'audio/traffic.ogg', this.granularGains['traffic']);
    this.loadAudioTrack('granular_horns', 'audio/horns.ogg', this.granularGains['horns']);
    this.loadAudioTrack('granular_animals', 'audio/nature.ogg', this.granularGains['animals']);
    this.loadAudioTrack('granular_birds', 'audio/ambience_jungle.ogg', this.granularGains['birds']);
    this.loadAudioTrack('granular_voices', 'audio/crowd.ogg', this.granularGains['voices']);

    // Load Lo-Fi Chillhop Track (Clean chillhop beat with zero rain baked in)
    this.loadAudioTrack('lofi_beat', 'audio/lofi_cloud_watching.ogg', this.lofiMaster);

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

    // Play/Pause and crossfade granular ambience sub-tracks
    const granularTrackKeys = ['granular_traffic', 'granular_horns', 'granular_animals', 'granular_birds', 'granular_voices'];
    granularTrackKeys.forEach(k => {
      const el = this.audioElements[k];
      const gainNode = this.gains[k];
      if (audible) {
        if (el && el.paused) el.play().catch(() => {});
        if (gainNode) gainNode.gain.setTargetAtTime(1.0, now, 0.4);
      } else {
        if (gainNode) gainNode.gain.setTargetAtTime(0, now, 0.2);
        if (el && !el.paused) el.pause();
      }
    });
  }

  // ==========================================
  // CITY-SPECIFIC URBAN ACOUSTICS
  // Horns, Metro Chimes, Bike Bells & Steamers
  // ==========================================

  setCityAcoustics(cityKey, isListening) {
    if (this.currentCityKey === cityKey && this.citySoundTimer) return;
    this.currentCityKey = cityKey;

    if (this.citySoundTimer) {
      clearInterval(this.citySoundTimer);
      this.citySoundTimer = null;
    }

    if (!cityKey || !isListening || this.isMuted) return;

    // Trigger initial acoustic signature promptly after 600ms
    setTimeout(() => {
      if (this.currentCityKey === cityKey && this.isPlaying && !this.isMuted) {
        this.triggerCitySignature(cityKey);
      }
    }, 600);

    // Schedule periodic authentic cultural soundscapes every 5.5 seconds
    this.citySoundTimer = setInterval(() => {
      if (this.currentCityKey === cityKey && this.isPlaying && !this.isMuted) {
        this.triggerCitySignature(cityKey);
      }
    }, 5500);
  }

  triggerCitySignature(cityKey) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const createOsc = (freq, type = 'sine') => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(gain);
      gain.connect(this.ambienceMaster);
      return { osc, gain };
    };

    switch (cityKey) {
      // 1. London: Big Ben Westminster Quarters Chime & Double-Decker Air Brake Hiss
      case 'london': {
        const chime = (tOffset, freq) => {
          const t = now + tOffset;
          const { osc: o, gain: g } = createOsc(freq, 'sine');
          const { osc: o2 } = createOsc(freq * 2.0, 'sine');
          o2.disconnect();
          o2.connect(g);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.18, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
          o.start(t);
          o2.start(t);
          o.stop(t + 1.3);
          o2.stop(t + 1.3);
        };
        // 4 notes of Westminster Quarters: E4, G#4, F#4, B3
        chime(0.0, 329.63);
        chime(0.35, 415.30);
        chime(0.70, 369.99);
        chime(1.05, 246.94);

        // Pneumatic air brake release hiss at +1.5s
        setTimeout(() => {
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const bufferSize = this.ctx.sampleRate * 0.4;
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(2400, t);
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.14, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ambienceMaster);
          noise.start(t);
          noise.stop(t + 0.4);
        }, 1500);
        break;
      }

      // 2. Madrid: Historic Puerta del Sol clock chime, Tapas Plaza Chatter & Flamenco Guitar Flourish
      case 'madrid': {
        // Bell chime D5 (587.33Hz)
        const { osc: o1, gain: g1 } = createOsc(587.33, 'sine');
        const { osc: o2 } = createOsc(1174.66, 'sine');
        o2.disconnect();
        o2.connect(g1);
        g1.gain.setValueAtTime(0, now);
        g1.gain.linearRampToValueAtTime(0.20, now + 0.02);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
        o1.start(now);
        o2.start(now);
        o1.stop(now + 1.5);
        o2.stop(now + 1.5);

        // Classical Spanish Flamenco Guitar Arpeggio Flourish (A3, D4, F4, A4, D5)
        const notes = [220.0, 293.66, 349.23, 440.0, 587.33];
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            const { osc: og, gain: gg } = createOsc(freq, 'triangle');
            const { osc: og2 } = createOsc(freq * 2, 'sine');
            og2.disconnect();
            og2.connect(gg);
            gg.gain.setValueAtTime(0, t);
            gg.gain.linearRampToValueAtTime(0.12, t + 0.015);
            gg.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
            og.start(t);
            og2.start(t);
            og.stop(t + 0.48);
            og2.stop(t + 0.48);
          }, 320 + idx * 75);
        });

        // Lively moped beep at +0.85s
        setTimeout(() => {
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const { osc: o3, gain: g3 } = createOsc(740, 'triangle');
          g3.gain.setValueAtTime(0, t);
          g3.gain.linearRampToValueAtTime(0.14, t + 0.02);
          g3.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          o3.start(t);
          o3.stop(t + 0.20);
        }, 850);
        break;
      }

      // 3. Tokyo: Yamanote Line Departure Chime, Shinkansen Traction Whirr & Shibuya Pedestrian Crossing
      case 'tokyo': {
        // Authentic 5-note JR East Yamanote Line station departure jingle: G4, C5, D5, G5, E5
        const jingle = [
          { f: 392.00, dur: 0.18 }, // G4
          { f: 523.25, dur: 0.18 }, // C5
          { f: 587.33, dur: 0.18 }, // D5
          { f: 783.99, dur: 0.28 }, // G5
          { f: 659.25, dur: 0.45 }, // E5
        ];
        let offset = 0;
        jingle.forEach((note) => {
          const t = now + offset;
          const { osc: o, gain: g } = createOsc(note.f, 'sine');
          const { osc: o2 } = createOsc(note.f * 2, 'sine');
          o2.disconnect();
          o2.connect(g);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.14, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + note.dur);
          o.start(t);
          o2.start(t);
          o.stop(t + note.dur + 0.05);
          o2.stop(t + note.dur + 0.05);
          offset += note.dur * 0.85;
        });

        // Shibuya "Piyo-Piyo" pedestrian crossing signal at +1.3s
        setTimeout(() => {
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const { osc: o1, gain: g1 } = createOsc(2093, 'sine'); // C7
          g1.gain.setValueAtTime(0, t);
          g1.gain.linearRampToValueAtTime(0.08, t + 0.02);
          g1.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          o1.start(t);
          o1.stop(t + 0.20);
          setTimeout(() => {
            if (!this.ctx) return;
            const t2 = this.ctx.currentTime;
            const { osc: o2, gain: g2 } = createOsc(1046, 'sine'); // C6
            g2.gain.setValueAtTime(0, t2);
            g2.gain.linearRampToValueAtTime(0.06, t2 + 0.02);
            g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.20);
            o2.start(t2);
            o2.stop(t2 + 0.22);
          }, 110);
        }, 1300);
        break;
      }

      // 4. Paris: Musette Accordion Motif, Bistro Terrace Murmur & Two-Stroke Moped
      case 'paris': {
        // French musette accordion motif (A minor chord waltz: A4, C5, E5 with accordion detuning tremolo)
        const accordion = (freq, tOffset) => {
          const t = now + tOffset;
          const { osc: o1, gain: g } = createOsc(freq, 'sawtooth');
          const { osc: o2 } = createOsc(freq * 1.008, 'sawtooth'); // Musette detune chorus
          o2.disconnect();
          o2.connect(g);
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1400, t);
          o1.disconnect();
          o2.disconnect();
          o1.connect(filter);
          o2.connect(filter);
          filter.connect(g);

          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.12, t + 0.03);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
          o1.start(t);
          o2.start(t);
          o1.stop(t + 0.58);
          o2.stop(t + 0.58);
        };
        accordion(440.0, 0.0);  // A4
        accordion(523.25, 0.18); // C5
        accordion(659.25, 0.36); // E5

        // Two-stroke delivery moped pass
        setTimeout(() => {
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const { osc: o1, gain: g1 } = createOsc(145, 'sawtooth');
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(420, t);
          filter.Q.setValueAtTime(3.0, t);
          o1.disconnect();
          o1.connect(filter);
          filter.connect(g1);
          g1.gain.setValueAtTime(0, t);
          g1.gain.linearRampToValueAtTime(0.14, t + 0.35);
          g1.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
          o1.start(t);
          o1.stop(t + 1.2);
        }, 550);
        break;
      }

      // 5. New York City: Iconic Yellow Cab Dual-Tone Horn, FDNY Siren & Subway Rail Screech
      case 'new_york': {
        const { osc: o1, gain: g1 } = createOsc(370, 'sawtooth');
        const { osc: o2 } = createOsc(440, 'sawtooth');
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, now);
        filter.Q.setValueAtTime(1.8, now);

        o1.disconnect();
        o2.disconnect();
        o1.connect(filter);
        o2.connect(filter);
        filter.connect(g1);

        g1.gain.setValueAtTime(0, now);
        g1.gain.linearRampToValueAtTime(0.24, now + 0.03);
        g1.gain.setValueAtTime(0.24, now + 0.18);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        o1.start(now);
        o2.start(now);
        o1.stop(now + 0.30);
        o2.stop(now + 0.30);

        // Subway rail screech (resonant high metallic squeal 2.6 kHz) at +0.35s
        setTimeout(() => {
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const { osc: os, gain: gs } = createOsc(2640, 'sawtooth');
          const sf = this.ctx.createBiquadFilter();
          sf.type = 'bandpass';
          sf.frequency.setValueAtTime(2600, t);
          sf.Q.setValueAtTime(6.0, t);
          os.disconnect();
          os.connect(sf);
          sf.connect(gs);
          gs.gain.setValueAtTime(0, t);
          gs.gain.linearRampToValueAtTime(0.09, t + 0.08);
          gs.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
          os.start(t);
          os.stop(t + 0.70);
        }, 350);
        break;
      }

      // 6. Rome: Vespa High-Pitch Double-Toot & Cobblestone Tire Vibration
      case 'rome': {
        const toot = (tOffset) => {
          const t = now + tOffset;
          const { osc: o, gain: g } = createOsc(660, 'sawtooth');
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1400, t);
          o.disconnect();
          o.connect(filter);
          filter.connect(g);

          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.18, t + 0.02);
          g.gain.linearRampToValueAtTime(0.18, t + 0.10);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          o.start(t);
          o.stop(t + 0.20);
        };
        toot(0);
        toot(0.14);
        break;
      }

      // 7. Istanbul: Bosphorus Maritime Steamer Horn, Harbor Gulls & Tulip Tea Glass Clink
      case 'istanbul': {
        const { osc: o1, gain: g1 } = createOsc(165, 'triangle');
        const { osc: o2 } = createOsc(168, 'sine');
        o2.disconnect();
        o2.connect(g1);

        g1.gain.setValueAtTime(0, now);
        g1.gain.linearRampToValueAtTime(0.26, now + 0.35);
        g1.gain.setValueAtTime(0.26, now + 1.2);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

        o1.start(now);
        o2.start(now);
        o1.stop(now + 2.3);
        o2.stop(now + 2.3);

        // Turkish tulip tea glass clink (İnce belli çay bardağı) at +1.4s
        setTimeout(() => {
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const { osc: oc, gain: gc } = createOsc(3450, 'sine');
          gc.gain.setValueAtTime(0, t);
          gc.gain.linearRampToValueAtTime(0.12, t + 0.01);
          gc.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          oc.start(t);
          oc.stop(t + 0.24);
        }, 1400);
        break;
      }

      // 8. Amsterdam: Dutch Bicycle Double-Bell & Electric Tram Bell
      case 'amsterdam': {
        const ringBell = (timeOffset) => {
          const t = now + timeOffset;
          const { osc: o1, gain: g1 } = createOsc(2480, 'sine');
          const { osc: o2 } = createOsc(4960, 'sine');
          o2.disconnect();
          o2.connect(g1);

          g1.gain.setValueAtTime(0, t);
          g1.gain.linearRampToValueAtTime(0.14, t + 0.01);
          g1.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

          o1.start(t);
          o2.start(t);
          o1.stop(t + 0.18);
          o2.stop(t + 0.18);
        };
        ringBell(0);
        ringBell(0.12);
        break;
      }

      // 9. Berlin: U-Bahn / S-Bahn Door Warning Chime & Street Tram Gong
      case 'berlin': {
        const ring = (offset, freq) => {
          const t = now + offset;
          const { osc: o, gain: g } = createOsc(freq, 'sine');
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.15, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          o.start(t);
          o.stop(t + 0.20);
        };
        ring(0, 1760);
        ring(0.12, 2200);
        break;
      }

      // 10. Mumbai & Delhi: Auto-Rickshaw Rhythmic Brass Horns & Bazaar Hubbub
      case 'mumbai':
      case 'delhi': {
        const honk = (tOffset, pitch) => {
          const t = now + tOffset;
          const { osc: o, gain: g } = createOsc(pitch, 'sawtooth');
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(980, t);
          filter.Q.setValueAtTime(2.2, t);
          o.disconnect();
          o.connect(filter);
          filter.connect(g);

          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.20, t + 0.03);
          g.gain.linearRampToValueAtTime(0.20, t + 0.14);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          o.start(t);
          o.stop(t + 0.24);
        };
        honk(0, 480);
        honk(0.16, 520);
        break;
      }

      // 11. Cairo: Reverberant Street Automotive Horn Chorus
      case 'cairo': {
        const { osc: o1, gain: g1 } = createOsc(415, 'sawtooth');
        const { osc: o2 } = createOsc(495, 'sawtooth');
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, now);

        o1.disconnect();
        o2.disconnect();
        o1.connect(filter);
        o2.connect(filter);
        filter.connect(g1);

        g1.gain.setValueAtTime(0, now);
        g1.gain.linearRampToValueAtTime(0.20, now + 0.05);
        g1.gain.setValueAtTime(0.20, now + 0.32);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

        o1.start(now);
        o2.start(now);
        o1.stop(now + 0.55);
        o2.stop(now + 0.55);
        break;
      }

      // 12. Dhaka: High-Frequency Dual-Tone Rickshaw Horns
      case 'dhaka': {
        const { osc: o1, gain: g1 } = createOsc(520, 'sawtooth');
        const { osc: o2 } = createOsc(580, 'sawtooth');
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.Q.setValueAtTime(2.0, now);

        o1.disconnect();
        o2.disconnect();
        o1.connect(filter);
        o2.connect(filter);
        filter.connect(g1);

        g1.gain.setValueAtTime(0, now);
        g1.gain.linearRampToValueAtTime(0.20, now + 0.04);
        g1.gain.setValueAtTime(0.20, now + 0.16);
        g1.gain.linearRampToValueAtTime(0, now + 0.22);
        g1.gain.setValueAtTime(0, now + 0.28);
        g1.gain.linearRampToValueAtTime(0.22, now + 0.32);
        g1.gain.linearRampToValueAtTime(0, now + 0.48);

        o1.start(now);
        o2.start(now);
        o1.stop(now + 0.55);
        o2.stop(now + 0.55);
        break;
      }

      default:
        break;
    }
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

  setTrafficVolume(v) {
    this.granularVolumes.traffic = Math.max(0, Math.min(1, v));
    if (this.ctx && this.granularGains.traffic) {
      this.granularGains.traffic.gain.setTargetAtTime(this.granularVolumes.traffic, this.ctx.currentTime, 0.05);
    }
  }

  setHornsVolume(v) {
    this.granularVolumes.horns = Math.max(0, Math.min(1, v));
    if (this.ctx && this.granularGains.horns) {
      this.granularGains.horns.gain.setTargetAtTime(this.granularVolumes.horns, this.ctx.currentTime, 0.05);
    }
  }

  setAnimalsVolume(v) {
    this.granularVolumes.animals = Math.max(0, Math.min(1, v));
    if (this.ctx && this.granularGains.animals) {
      this.granularGains.animals.gain.setTargetAtTime(this.granularVolumes.animals, this.ctx.currentTime, 0.05);
    }
  }

  setBirdsVolume(v) {
    this.granularVolumes.birds = Math.max(0, Math.min(1, v));
    if (this.ctx && this.granularGains.birds) {
      this.granularGains.birds.gain.setTargetAtTime(this.granularVolumes.birds, this.ctx.currentTime, 0.05);
    }
  }

  setVoicesVolume(v) {
    this.granularVolumes.voices = Math.max(0, Math.min(1, v));
    if (this.ctx && this.granularGains.voices) {
      this.granularGains.voices.gain.setTargetAtTime(this.granularVolumes.voices, this.ctx.currentTime, 0.05);
    }
  }

  setLoFiVolume(v) {
    this.lofiVolume = Math.max(0, Math.min(1, v));
    this.lofiEnabled = this.lofiVolume > 0.001;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const lofiEl = this.audioElements['lofi_beat'];
    const gainNode = this.gains['lofi_beat'];

    if (this.lofiEnabled && !this.isMuted) {
      if (lofiEl && lofiEl.paused) {
        lofiEl.play().catch(() => {});
      }
      this.lofiMaster.gain.setTargetAtTime(this.lofiVolume, now, 0.08);
      if (gainNode) gainNode.gain.setTargetAtTime(1.0, now, 0.08);
    } else {
      this.lofiMaster.gain.setTargetAtTime(0, now, 0.08);
      if (this.lofiVolume <= 0.001 && lofiEl && !lofiEl.paused) {
        setTimeout(() => {
          if (this.lofiVolume <= 0.001 && lofiEl) lofiEl.pause();
        }, 300);
      }
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
