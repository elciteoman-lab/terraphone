/**
 * Terraphone — The Sound of Change Engine
 * NASA Space Apps Challenge 2026
 * 
 * Centralized Simulation State, Logarithmic Acoustic Model,
 * Layered city audio & real-time FFT spectrum
 */

import {
  INTERVENTION_CATEGORIES,
  INTERVENTIONS,
  BASELINE_MANHATTAN
} from './interventions-data.js';

export class SoundOfChangeEngine {
  constructor(sharedAudioCtx = null) {
    this.audioCtx = sharedAudioCtx;
    this.city = BASELINE_MANHATTAN;

    // Simulation State
    this.activeInterventions = new Set(); // Set of active intervention ids
    this.perspective = 'outdoor'; // 'outdoor' | 'indoor'
    this.isBeforeMode = false; // When true, forces baseline state for comparison

    // Audio State
    this.isPlaying = false;
    this.isMuted = false;
    this.masterVolume = 0.85;
    this.channelVolumes = {
      traffic: 0.85,
      horns: 0.80,
      construction: 0.75,
      industry: 0.70,
      crowd: 0.75,
      nature: 0.65
    };

    // Web Audio Nodes
    this.masterGain = null;
    this.indoorFilter = null;
    this.channelGains = {};
    this.audioSources = {};
    this.audioElements = {};
    this.proceduralSources = {};
    this.hornTimer = null;

    // DOM Elements Cache
    this.container = null;
    this.indexNumberEl = null;
    this.indexBadgeEl = null;
    this.indexDiffEl = null;
    this.activeCountEl = null;
    this.perspectiveLabelEl = null;

    // CAVA Audio Spectrum Visualizer
    this.analyser = null;
    this.cavaCanvas = null;
    this.cavaCtx = null;
    this.cavaBars = 64;
    this.cavaBarValues = new Float32Array(64);
    this.cavaPeakValues = new Float32Array(64);
    this.cavaPeakHolds = new Int32Array(64);
    this.cavaPeakVels = new Float32Array(64);
    this.cavaDataArray = null;
    this.cavaRafId = null;
    this.cavaResizeObserver = null;
    this.cavaStatusEl = null;

    this.spectrumVisible = true;
  }

  /**
   * Mount the Sound of Change experience into the container element
   */
  mount(containerEl, audioContext) {
    this.container = containerEl;
    if (audioContext) this.audioCtx = audioContext;

    this.renderLayout();
    this.cacheDomElements();
    this.bindEvents();
    this.initVisualizer();
    this.enter();
    this.updateSimulation();
  }

  /**
   * Render the HTML structure for Sound of Change
   */
  renderLayout() {
    const tabNames = { transport: 'Transport', architecture: 'Buildings', urban_planning: 'City planning', public_awareness: 'Public health' };
    const channels = { master: 'Master output', traffic: 'Traffic', horns: 'Horns', construction: 'Construction', industry: 'Industry', crowd: 'Crowds', nature: 'Nature' };
    this.container.innerHTML = `
      <div class="soc-scroll">
        <header class="soc-scene">
          <div class="soc-backdrop" aria-hidden="true">
            <div id="soc-overlay-calm"></div>
            <div id="soc-overlay-green"></div>
            <div id="soc-overlay-barrier"></div>
          </div>
          <div class="soc-scene-content">
            <div class="soc-caption"><i></i> Manhattan, New York</div>
            <h2 class="soc-title">Sound of<br>Change</h2>
            <div class="soc-actions">
              <button id="soc-btn-sound" class="soc-btn soc-btn-primary" aria-pressed="false">
                <span id="soc-sound-icon" aria-hidden="true"><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="m4 2 9 6-9 6z"/></svg></span>
                <span id="soc-sound-label">Listen</span>
              </button>
              <button id="soc-btn-perspective" class="soc-btn" aria-pressed="false" title="Switch listening perspective"><span id="soc-persp-label">Outdoors</span></button>
              <button id="soc-btn-compare" class="soc-btn" aria-pressed="false" title="Compare with the original street">Baseline</button>
              <button id="soc-btn-mixer-toggle" class="soc-btn soc-mix-button" aria-label="Sound mixer" aria-controls="soc-mixer-drawer" aria-expanded="false" title="Sound mixer">
                <svg width="17" height="17" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.5" aria-hidden="true"><path d="M3 8h4m4 0h10M3 16h11m4 0h3"/><circle cx="9" cy="8" r="2"/><circle cx="16" cy="16" r="2"/></svg>
              </button>
            </div>
          </div>
          <section class="soc-meter" aria-label="Simulated noise index and audio spectrum">
            <div class="soc-meter-heading"><span>Simulated noise index</span><span id="soc-index-badge"></span></div>
            <div class="soc-reading"><div><strong id="soc-index-num">${this.city.initialIndex}</strong><span class="soc-scale">/ 100</span></div>
              <div class="soc-delta"><span id="soc-metric-db"></span><span id="soc-metric-diff"></span></div>
            </div>
            <div class="soc-spectrum"><canvas id="soc-cava-canvas" aria-label="64-band frequency spectrum of the soundscape"></canvas></div>
            <div class="soc-frequencies"><span id="soc-cava-status">Spectrum · Paused</span><span>Low → High</span></div>
          </section>
        </header>
        <main class="soc-workbench" aria-labelledby="soc-interventions-title">
          <div class="soc-tools">
            <h3 id="soc-interventions-title">Interventions</h3>
            <div class="soc-batch"><span id="soc-counter-badge"></span><button id="soc-btn-apply-all">Apply all</button><button id="soc-btn-reset">Reset</button></div>
          </div>
          <nav class="soc-tabs" role="tablist" aria-label="Intervention categories">
            ${INTERVENTION_CATEGORIES.map((cat, i) => `
              <button class="soc-tab ${i === 0 ? 'active' : ''}" role="tab" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-tab="${cat.id}" id="soc-tab-${cat.id}" aria-controls="soc-panel-${cat.id}">
                ${tabNames[cat.id]} <span class="soc-tab-badge" id="soc-tab-count-${cat.id}"></span>
              </button>`).join('')}
          </nav>
          ${INTERVENTION_CATEGORIES.map((cat, i) => `
            <section class="soc-panel ${i === 0 ? 'active' : ''}" id="soc-panel-${cat.id}" role="tabpanel" aria-labelledby="soc-tab-${cat.id}">
              ${INTERVENTIONS.filter(item => item.category === cat.id).map(item => `
                <div class="soc-card" id="soc-card-${item.id}" data-id="${item.id}">
                  <div><h4 id="soc-title-${item.id}">${item.title}</h4><p id="soc-desc-${item.id}">${item.shortDesc}</p></div>
                  <button class="soc-toggle-switch" role="switch" aria-checked="false" aria-labelledby="soc-title-${item.id}" aria-describedby="soc-desc-${item.id}" id="soc-toggle-${item.id}" data-id="${item.id}"><span></span></button>
                </div>`).join('')}
            </section>`).join('')}
          <p id="soc-health-badge" hidden>Hearing protection is active.</p>
        </main>
      </div>
      <aside class="soc-mixer-drawer" id="soc-mixer-drawer" aria-label="Sound mixer" inert>
        <div class="soc-mixer-heading"><h3>Sound mixer</h3><button id="soc-btn-close-mixer" aria-label="Close mixer">×</button></div>
        ${Object.entries(channels).map(([id, name]) => {
          const value = id === 'master' ? this.masterVolume : this.channelVolumes[id];
          return `<div class="soc-mixer-channel"><label for="soc-slider-${id}">${name}</label><output id="soc-val-${id}" for="soc-slider-${id}">${Math.round(value * 100)}%</output>
            <input type="range" id="soc-slider-${id}" min="0" max="1" step="0.01" value="${value}"></div>`;
        }).join('')}
      </aside>`;
  }

  cacheDomElements() {
    this.indexNumberEl = document.getElementById('soc-index-num');
    this.indexBadgeEl = document.getElementById('soc-index-badge');
    this.indexMetricDb = document.getElementById('soc-metric-db');
    this.indexDiffEl = document.getElementById('soc-metric-diff');
    this.activeCountEl = document.getElementById('soc-counter-badge');
    this.healthBadgeEl = document.getElementById('soc-health-badge');
    this.overlayGreen = document.getElementById('soc-overlay-green');
    this.overlayBarrier = document.getElementById('soc-overlay-barrier');
    this.overlayCalm = document.getElementById('soc-overlay-calm');
    this.mixerDrawer = document.getElementById('soc-mixer-drawer');
    this.cavaCanvas = document.getElementById('soc-cava-canvas');
    this.cavaCtx = this.cavaCanvas ? this.cavaCanvas.getContext('2d') : null;
    this.cavaStatusEl = document.getElementById('soc-cava-status');
  }

  bindEvents() {
    // 1. Tab Navigation
    const tabs = this.container.querySelectorAll('.soc-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab;
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
          t.tabIndex = -1;
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        tab.tabIndex = 0;

        const panels = this.container.querySelectorAll('.soc-panel');
        panels.forEach(p => p.classList.remove('active'));
        const activePanel = document.getElementById(`soc-panel-${targetId}`);
        if (activePanel) activePanel.classList.add('active');
      });
    });

    this.container.querySelector('.soc-tabs').addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const index = Array.from(tabs).indexOf(document.activeElement);
      if (index < 0) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      tabs[next].click();
    });

    // 2. Intervention Toggle Switches
    const toggles = this.container.querySelectorAll('.soc-toggle-switch');
    toggles.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.toggleIntervention(id);
      });
    });

    // Also clicking anywhere on the card toggles it
    const cards = this.container.querySelectorAll('.soc-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        // If clicking a link or button, let it handle
        if (e.target.closest('button')) return;
        const id = card.dataset.id;
        this.toggleIntervention(id);
      });
    });

    // 3. Audio Play / Pause Button
    const btnSound = document.getElementById('soc-btn-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => this.toggleAudio());
    }

    // 4. Perspective Toggle (Outdoor vs Indoor)
    const btnPersp = document.getElementById('soc-btn-perspective');
    if (btnPersp) {
      btnPersp.addEventListener('click', () => {
        this.perspective = this.perspective === 'outdoor' ? 'indoor' : 'outdoor';
        const indoor = this.perspective === 'indoor';
        btnPersp.setAttribute('aria-pressed', String(indoor));
        document.getElementById('soc-persp-label').textContent = indoor ? 'Indoors' : 'Outdoors';
        this.updateSimulation();
      });
    }

    // 5. Compare (Before / After) Button
    const btnCompare = document.getElementById('soc-btn-compare');
    if (btnCompare) {
      btnCompare.addEventListener('click', () => {
        this.isBeforeMode = !this.isBeforeMode;
        this.updateSimulation();
      });
    }

    // 6. Apply All & Reset
    const btnApplyAll = document.getElementById('soc-btn-apply-all');
    if (btnApplyAll) {
      btnApplyAll.addEventListener('click', () => {
        INTERVENTIONS.forEach(item => this.activeInterventions.add(item.id));
        this.isBeforeMode = false;
        this.updateSimulation();
      });
    }

    const btnReset = document.getElementById('soc-btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.activeInterventions.clear();
        this.isBeforeMode = false;
        this.updateSimulation();
      });
    }

    // 7. Mixer Drawer Toggle & Close
    const btnMixerToggle = document.getElementById('soc-btn-mixer-toggle');
    const btnCloseMixer = document.getElementById('soc-btn-close-mixer');
    const showMixer = open => {
      this.mixerDrawer.inert = !open;
      this.mixerDrawer.classList.toggle('open', open);
      btnMixerToggle.setAttribute('aria-expanded', String(open));
      (open ? btnCloseMixer : btnMixerToggle).focus();
    };
    btnMixerToggle.addEventListener('click', () => showMixer(this.mixerDrawer.inert));
    btnCloseMixer.addEventListener('click', () => showMixer(false));
    this.mixerDrawer.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        showMixer(false);
      }
    });

    // 9. Mixer Sliders
    this.bindMixerSliders();
  }

  bindMixerSliders() {
    const bindSlider = (id, key, isMaster = false) => {
      const slider = document.getElementById(`soc-slider-${id}`);
      const valEl = document.getElementById(`soc-val-${id}`);
      if (!slider) return;
      slider.addEventListener('input', () => {
        const v = parseFloat(slider.value);
        if (valEl) valEl.textContent = `${Math.round(v * 100)}%`;
        if (isMaster) {
          this.masterVolume = v;
          if (this.masterGain && this.audioCtx) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : v, this.audioCtx.currentTime, 0.05);
          }
        } else {
          this.channelVolumes[key] = v;
          this.applyChannelGains();
        }
      });
    };

    bindSlider('master', 'master', true);
    bindSlider('traffic', 'traffic');
    bindSlider('horns', 'horns');
    bindSlider('construction', 'construction');
    bindSlider('industry', 'industry');
    bindSlider('crowd', 'crowd');
    bindSlider('nature', 'nature');
  }

  toggleIntervention(id) {
    if (this.activeInterventions.has(id)) {
      this.activeInterventions.delete(id);
    } else {
      this.activeInterventions.add(id);
    }

    // If audio isn't initialized yet, start it on first user toggle
    if (!this.isPlaying) {
      this.startAudio();
    }

    this.updateSimulation();
  }

  /**
   * Logarithmic Acoustic Simulation Calculation
   */
  calculateAcousticState() {
    const base = this.city.sources;
    const isBaseline = this.isBeforeMode;

    // Effective reduction fractions per channel [0.0 - 0.95]
    let rTraffic = 0;
    let rHorns = 0;
    let rConstruction = 0;
    let rIndustry = 0;
    let rCrowd = 0;
    let natureBoost = 0;
    let isHearingHealthActive = false;
    let totalIndoorInsulation = 16; // Baseline single-pane window STC transmission loss

    if (!isBaseline) {
      INTERVENTIONS.forEach(item => {
        if (!this.activeInterventions.has(item.id)) return;

        if (item.isHealthOnly) {
          isHearingHealthActive = true;
          return;
        }

        // Add indoor transmission loss
        if (item.indoorEffect) {
          totalIndoorInsulation += item.indoorEffect;
        }

        // Compound source reduction
        const eff = item.sourceEffect;
        if (eff.traffic) rTraffic += Math.abs(eff.traffic);
        if (eff.horns) rHorns += Math.abs(eff.horns);
        if (eff.construction) rConstruction += Math.abs(eff.construction);
        if (eff.industry) rIndustry += Math.abs(eff.industry);
        if (eff.crowd) rCrowd += Math.abs(eff.crowd);
        if (eff.nature_boost) natureBoost += eff.nature_boost;
      });
    }

    // Clamp reduction rates so source cannot be negative
    // Using physical diminishing returns: 1 - product(1 - ri)
    const factorTraffic = Math.max(0.12, 1 - Math.min(0.85, rTraffic));
    const factorHorns = Math.max(0.05, 1 - Math.min(0.95, rHorns));
    const factorConstruction = Math.max(0.08, 1 - Math.min(0.90, rConstruction));
    const factorIndustry = Math.max(0.08, 1 - Math.min(0.92, rIndustry));
    const factorCrowd = Math.max(0.20, 1 - Math.min(0.75, rCrowd));

    // Acoustic source powers in linear mW/m² equivalent: P = 10^(L / 10)
    const pTraffic = Math.pow(10, base.traffic / 10) * factorTraffic;
    const pHorns = Math.pow(10, base.horns / 10) * factorHorns;
    const pConstruction = Math.pow(10, base.construction / 10) * factorConstruction;
    const pIndustry = Math.pow(10, base.industry / 10) * factorIndustry;
    const pCrowd = Math.pow(10, base.crowd / 10) * factorCrowd;
    const pAmbientBase = Math.pow(10, base.ambient_base / 10);

    // Total outdoor acoustic energy (Logarithmic addition)
    const pTotalOutdoor = pTraffic + pHorns + pConstruction + pIndustry + pCrowd + pAmbientBase;
    const lTotalOutdoor = 10 * Math.log10(pTotalOutdoor);

    // Indoor calculations
    const lTotalIndoor = Math.max(24.0, lTotalOutdoor - totalIndoorInsulation);

    // Simulated Noise Index Mapping (0 - 100)
    // Baseline outdoor: ~85.3 dBA -> Index 88
    // Quietest outdoor with all interventions: ~68.5 dBA -> Index 48
    // Baseline indoor: ~69 dBA -> Index 72
    // Heavily insulated indoor: ~32 dBA -> Index 26
    let computedIndex = 88;
    let dbDisplay = 85;

    if (this.perspective === 'outdoor') {
      const baselineTotal = 10 * Math.log10(
        Math.pow(10, base.traffic / 10) +
        Math.pow(10, base.horns / 10) +
        Math.pow(10, base.construction / 10) +
        Math.pow(10, base.industry / 10) +
        Math.pow(10, base.crowd / 10) +
        pAmbientBase
      );
      const deltaDb = lTotalOutdoor - baselineTotal;
      // 10 dB reduction represents 90% acoustic energy reduction; maps from 88 down to ~48
      computedIndex = Math.round(Math.max(35, Math.min(98, 88 + deltaDb * 4.0)));
      dbDisplay = lTotalOutdoor;
    } else {
      // Indoor perspective: baseline ~72, with STC-45 building insulation drops down to ~26
      const deltaIndoor = lTotalIndoor - 72;
      computedIndex = Math.round(Math.max(22, Math.min(85, 72 + deltaIndoor * 1.6)));
      dbDisplay = lTotalIndoor;
    }

    // Relative channel gain multipliers for Web Audio [0.0 - 1.0]
    const audioGains = {
      traffic: Math.sqrt(factorTraffic),
      horns: Math.sqrt(factorHorns),
      construction: Math.sqrt(factorConstruction),
      industry: Math.sqrt(factorIndustry),
      crowd: Math.sqrt(factorCrowd),
      // Nature emerges naturally as city background noise subsides!
      nature: Math.min(1.0, 0.15 + (1 - factorTraffic) * 0.45 + natureBoost * 0.5)
    };

    return {
      index: computedIndex,
      dbDisplay: Math.round(dbDisplay * 10) / 10,
      initialIndex: this.perspective === 'outdoor' ? this.city.initialIndex : this.city.initialIndoorIndex,
      reduction: (this.perspective === 'outdoor' ? this.city.initialIndex : this.city.initialIndoorIndex) - computedIndex,
      isHearingHealthActive,
      audioGains,
      totalIndoorInsulation,
      hasGreenOverlay: !isBaseline && (this.activeInterventions.has('green_belts_vegetation') || this.activeInterventions.has('green_building_standards')),
      hasBarrierOverlay: !isBaseline && this.activeInterventions.has('noise_barriers'),
      quietFactor: (88 - computedIndex) / 50 // 0.0 (noisy) to 1.0 (quiet)
    };
  }

  /**
   * Update the simulation UI, noise index, audio gains, and visual overlays
   */
  updateSimulation() {
    const state = this.calculateAcousticState();

    document.getElementById('soc-btn-compare')?.setAttribute('aria-pressed', String(this.isBeforeMode));

    // 1. Update Switches & Cards UI
    INTERVENTIONS.forEach(item => {
      const toggle = document.getElementById(`soc-toggle-${item.id}`);
      const card = document.getElementById(`soc-card-${item.id}`);
      const isActive = this.activeInterventions.has(item.id) && !this.isBeforeMode;
      if (toggle) {
        toggle.setAttribute('aria-checked', isActive ? 'true' : 'false');
        toggle.classList.toggle('active', isActive);
      }
      if (card) {
        card.classList.toggle('active', isActive);
      }
    });

    // 2. Update Category Tab Badges
    INTERVENTION_CATEGORIES.forEach(cat => {
      const countEl = document.getElementById(`soc-tab-count-${cat.id}`);
      if (countEl) {
        const catActiveCount = INTERVENTIONS
          .filter(i => i.category === cat.id && this.activeInterventions.has(i.id))
          .length;
        countEl.textContent = catActiveCount;
        countEl.classList.toggle('has-active', catActiveCount > 0);
      }
    });

    // 3. Update Active Counter Badge
    if (this.activeCountEl) {
      const count = this.activeInterventions.size;
      this.activeCountEl.textContent = `${count} / ${INTERVENTIONS.length} active`;
      this.activeCountEl.classList.toggle('active', count > 0);
    }

    // 4. Update Personal Hearing Health Badge
    if (this.healthBadgeEl) {
      this.healthBadgeEl.hidden = !state.isHearingHealthActive;
    }

    // 5. Update Simulated Noise Index Gauge
    if (this.indexNumberEl) {
      this.indexNumberEl.textContent = state.index;
    }
    if (this.indexBadgeEl) {
      this.indexBadgeEl.textContent = state.index >= 75 ? 'High' : state.index >= 55 ? 'Moderate' : 'Low';
    }
    if (this.indexMetricDb) this.indexMetricDb.textContent = `≈ ${state.dbDisplay} dBA`;
    if (this.indexDiffEl) this.indexDiffEl.textContent = state.reduction > 0 ? `−${state.reduction} from baseline` : 'Baseline';

    // 6. Update Environmental Overlays
    if (this.overlayGreen) {
      this.overlayGreen.classList.toggle('active', state.hasGreenOverlay);
    }
    if (this.overlayBarrier) {
      this.overlayBarrier.classList.toggle('active', state.hasBarrierOverlay);
    }
    if (this.overlayCalm) {
      const calmAlpha = Math.max(0, Math.min(0.65, state.quietFactor * 0.65));
      this.overlayCalm.style.opacity = calmAlpha;
    }

    // 7. Update Web Audio Engine
    this.applyAudioState(state);
  }

  // ==========================================
  // CAVA AUDIO SPECTRUM VISUALIZER ENGINE
  // ==========================================

  initVisualizer() {
    this.cavaCanvas = document.getElementById('soc-cava-canvas');
    if (!this.cavaCanvas) return;
    this.cavaCtx = this.cavaCanvas.getContext('2d');

    const updateSize = () => {
      if (!this.cavaCanvas) return;
      const wrap = this.cavaCanvas.parentElement;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.max(1, Math.floor(rect.width * dpr));
      const targetH = Math.max(1, Math.floor(rect.height * dpr));

      if (this.cavaCanvas.width !== targetW || this.cavaCanvas.height !== targetH) {
        this.cavaCanvas.width = targetW;
        this.cavaCanvas.height = targetH;
      }
    };

    updateSize();

    if (window.ResizeObserver) {
      if (this.cavaResizeObserver) this.cavaResizeObserver.disconnect();
      this.cavaResizeObserver = new ResizeObserver(() => updateSize());
      const wrap = this.cavaCanvas.parentElement;
      if (wrap) this.cavaResizeObserver.observe(wrap);
    }

    if ('IntersectionObserver' in window) {
      this.spectrumObserver = new IntersectionObserver(([entry]) => {
        this.spectrumVisible = entry.isIntersecting;
        this.syncSpectrum();
      });
      this.spectrumObserver.observe(this.cavaCanvas);
    }
    this.onVisibility = () => this.syncSpectrum();
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  enter() {
    this.inView = true;
    this.syncSpectrum();
  }

  leave() {
    this.inView = false;
    this.pauseAudio();
    if (this.mixerDrawer) {
      this.mixerDrawer.classList.remove('open');
      this.mixerDrawer.inert = true;
      document.getElementById('soc-btn-mixer-toggle')?.setAttribute('aria-expanded', 'false');
    }
  }

  syncSpectrum() {
    const active = this.inView && this.isPlaying && this.spectrumVisible && !document.hidden;
    if (this.cavaStatusEl) this.cavaStatusEl.textContent = this.isPlaying ? 'Live spectrum' : 'Spectrum · Paused';
    if (!active) {
      if (this.cavaRafId != null) cancelAnimationFrame(this.cavaRafId);
      this.cavaRafId = null;
      if (!this.isPlaying && this.cavaCtx) {
        this.cavaCtx.clearRect(0, 0, this.cavaCanvas.width, this.cavaCanvas.height);
        this.cavaBarValues.fill(0);
        this.cavaPeakValues.fill(0);
      }
      return;
    }
    if (this.cavaRafId != null) return;
    let last = performance.now();
    const frame = time => {
      this.renderCavaFrame(Math.min(.08, (time - last) / 1000));
      last = time;
      this.cavaRafId = requestAnimationFrame(frame);
    };
    this.cavaRafId = requestAnimationFrame(frame);
  }

  renderCavaFrame(dt) {
    if (!this.cavaCanvas || !this.cavaCtx) return;
    const ctx = this.cavaCtx;
    const w = this.cavaCanvas.width;
    const h = this.cavaCanvas.height;
    if (w <= 0 || h <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Clear frame
    ctx.clearRect(0, 0, w, h);

    if (!this.analyser || !this.cavaDataArray) return;
    this.analyser.getByteFrequencyData(this.cavaDataArray);
    const barCount = this.cavaBars;
    for (let i = 0; i < barCount; i++) {
      const start = this.cavaBinEdges[i];
      const end = Math.max(start + 1, this.cavaBinEdges[i + 1]);
      let energy = 0;
      for (let bin = start; bin < end; bin++) energy += this.cavaDataArray[bin];
      const rawVal = energy / ((end - start) * 255);

      // Fast explosive attack on transients (snappy, jumpy, real audio)
      if (rawVal > this.cavaBarValues[i]) {
        this.cavaBarValues[i] = this.cavaBarValues[i] * 0.12 + rawVal * 0.88;
      } else {
        // Fast gravity falloff (3.2 per second)
        this.cavaBarValues[i] = Math.max(0.01, this.cavaBarValues[i] - 3.2 * dt);
      }

      // Floating Peak Cap Physics (Signature CAVA terminal feature)
      if (this.cavaBarValues[i] >= this.cavaPeakValues[i]) {
        this.cavaPeakValues[i] = this.cavaBarValues[i];
        this.cavaPeakHolds[i] = 7; // Hold frames at peak
        this.cavaPeakVels[i] = 0;
      } else {
        if (this.cavaPeakHolds[i] > 0) {
          this.cavaPeakHolds[i]--;
        } else {
          this.cavaPeakVels[i] += 5.5 * dt; // Gravity acceleration
          this.cavaPeakValues[i] = Math.max(0.01, this.cavaPeakValues[i] - this.cavaPeakVels[i] * dt);
        }
      }
    }

    // Geometry calculations
    const gap = Math.max(2 * dpr, Math.floor(w / (barCount * 10)));
    const totalGap = gap * (barCount - 1);
    const barWidth = Math.max(2 * dpr, (w - totalGap) / barCount);
    const usableHeight = h - 10 * dpr;

    ctx.fillStyle = '#bbd6ca';
    for (let i = 0; i < barCount; i++) {
      const height = Math.max(dpr, this.cavaBarValues[i] * usableHeight);
      ctx.fillRect(i * (barWidth + gap), h - height, barWidth, height);
    }
    ctx.fillStyle = '#f0b27e';
    for (let i = 0; i < barCount; i++) {
      const peak = this.cavaPeakValues[i];
      if (peak > .02) ctx.fillRect(i * (barWidth + gap), Math.max(0, h - peak * usableHeight - 3 * dpr), barWidth, 2 * dpr);
    }
  }

  // WEB AUDIO API SYSTEM
  // ==========================================

  initAudio() {
    if (this.masterGain) return; // already initialized

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!this.audioCtx) {
      this.audioCtx = window.app?.sound?.getSharedContext() ?? new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;

    // Master Gain
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, now);
    this.masterGain.connect(this.audioCtx.destination);

    // CAVA Spectrum Analyser (Real-time FFT audio stream)
    if (!this.analyser) {
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.40;
      this.analyser.minDecibels = -85;
      this.analyser.maxDecibels = -8;
      this.masterGain.connect(this.analyser);
      this.cavaDataArray = new Uint8Array(this.analyser.frequencyBinCount);
      // Precompute perceptual bands once for the actual device sample rate.
      const binHz = this.audioCtx.sampleRate / this.analyser.fftSize;
      const maxHz = Math.min(16000, this.audioCtx.sampleRate / 2);
      this.cavaBinEdges = Uint16Array.from({ length: this.cavaBars + 1 }, (_, i) =>
        Math.min(this.cavaDataArray.length - 1, Math.floor(700 * Math.expm1(i / this.cavaBars * Math.log1p(maxHz / 700)) / binHz)));
    }

    // Indoor/Outdoor Acoustic Biquad Filter (Simulates building facade sound transmission)
    this.indoorFilter = this.audioCtx.createBiquadFilter();
    this.indoorFilter.type = 'lowpass';
    this.indoorFilter.frequency.setValueAtTime(20000, now); // default wide open
    this.indoorFilter.Q.setValueAtTime(0.707, now);
    this.indoorFilter.connect(this.masterGain);

    // Create 6 Channel Gain Nodes connecting into indoorFilter
    const channels = ['traffic', 'horns', 'construction', 'industry', 'crowd', 'nature'];
    channels.forEach(ch => {
      const g = this.audioCtx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.connect(this.indoorFilter);
      this.channelGains[ch] = g;
    });

    // Load actual audio files & start procedural sound generators
    this.loadAudioTracks();
    this.startProceduralAudio();
    this.startHornLoop();
  }

  loadAudioTracks() {
    // Connect audio elements for realistic sampled ambience
    const trackDefs = [
      { id: 'traffic', src: 'audio/traffic.ogg', dest: this.channelGains.traffic },
      { id: 'horns', src: 'audio/horns.ogg', dest: this.channelGains.horns },
      { id: 'construction', src: 'audio/construction.ogg', dest: this.channelGains.construction },
      { id: 'industry', src: 'audio/industry.ogg', dest: this.channelGains.industry },
      { id: 'crowd', src: 'audio/crowd.ogg', dest: this.channelGains.crowd },
      { id: 'nature', src: 'audio/nature.ogg', dest: this.channelGains.nature }
    ];

    trackDefs.forEach(t => {
      try {
        const audio = new Audio();
        audio.src = t.src;
        audio.loop = true;
        audio.crossOrigin = 'anonymous';
        audio.preload = 'auto';

        const source = this.audioCtx.createMediaElementSource(audio);
        source.connect(t.dest);
        this.audioSources[t.id] = source;
        this.audioElements[t.id] = audio;

        if (this.isPlaying) {
          audio.play().catch(e => console.log(`[SOC Audio] Autoplay deferred for ${t.id}:`, e));
        }
      } catch (err) {
        console.warn(`[SOC Audio] MediaElementSource creation fallback for ${t.id}:`, err);
      }
    });
  }

  /**
   * Procedural Audio Synthesis (Guarantees zero-latency, rich sound even before audio tracks finish loading)
   */
  startProceduralAudio() {
    if (!this.audioCtx) return;

    // 1. Procedural Traffic Drone (Filtered pink noise + sub engine)
    const trafficNoiseNode = this.createNoiseNode('pink');
    const trafficFilter = this.audioCtx.createBiquadFilter();
    trafficFilter.type = 'bandpass';
    trafficFilter.frequency.setValueAtTime(420, this.audioCtx.currentTime);
    trafficFilter.Q.setValueAtTime(1.2, this.audioCtx.currentTime);

    const trafficSubOsc = this.audioCtx.createOscillator();
    trafficSubOsc.type = 'sawtooth';
    trafficSubOsc.frequency.setValueAtTime(56, this.audioCtx.currentTime);
    const trafficSubGain = this.audioCtx.createGain();
    trafficSubGain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);

    trafficNoiseNode.connect(trafficFilter);
    trafficFilter.connect(this.channelGains.traffic);
    trafficSubOsc.connect(trafficSubGain);
    trafficSubGain.connect(this.channelGains.traffic);
    trafficSubOsc.start();

    // 2. Procedural Industry Hum (60Hz / 120Hz harmonics)
    const indOsc1 = this.audioCtx.createOscillator();
    indOsc1.type = 'sawtooth';
    indOsc1.frequency.setValueAtTime(60, this.audioCtx.currentTime);
    const indOsc2 = this.audioCtx.createOscillator();
    indOsc2.type = 'sine';
    indOsc2.frequency.setValueAtTime(120, this.audioCtx.currentTime);
    const indGain = this.audioCtx.createGain();
    indGain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);

    indOsc1.connect(indGain);
    indOsc2.connect(indGain);
    indGain.connect(this.channelGains.industry);
    indOsc1.start();
    indOsc2.start();

    // 3. Procedural Nature Wind (Lowpass wind sweep)
    const windNoise = this.createNoiseNode('pink');
    const windFilter = this.audioCtx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(1200, this.audioCtx.currentTime);
    windFilter.Q.setValueAtTime(0.8, this.audioCtx.currentTime);
    const windGain = this.audioCtx.createGain();
    windGain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);

    windNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.channelGains.nature);
  }

  createNoiseNode(type = 'pink') {
    const bufferSize = this.audioCtx.sampleRate * 2;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.12;
      }
    } else {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    noise.start();
    return noise;
  }

  /**
   * Periodic procedural horn blare (frequency controlled by active anti-honking interventions)
   */
  startHornLoop() {
    if (this.hornTimer) clearInterval(this.hornTimer);

    const checkAndTrigger = () => {
      if (!this.isPlaying || this.isMuted || !this.audioCtx) return;

      const isAntiHonking = this.activeInterventions.has('reduce_horn_usage') ||
                            this.activeInterventions.has('anti_honking_campaigns');
      
      // If anti-honking is enabled, horns are 90% eliminated!
      if (isAntiHonking && Math.random() > 0.08) return;

      this.triggerProceduralHorn();
    };

    this.hornTimer = setInterval(checkAndTrigger, 4200);
  }

  triggerProceduralHorn() {
    if (!this.audioCtx || this.isMuted || !this.isPlaying) return;
    const now = this.audioCtx.currentTime;

    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const hornGain = this.audioCtx.createGain();

    // Classic Dual-Tone NYC Taxi Horn (F4 349Hz + A4 440Hz)
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(349.23, now);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(440.00, now);

    const dur = 0.28 + Math.random() * 0.22;
    hornGain.gain.setValueAtTime(0, now);
    hornGain.gain.linearRampToValueAtTime(0.18 * this.channelVolumes.horns, now + 0.03);
    hornGain.gain.setValueAtTime(0.18 * this.channelVolumes.horns, now + dur - 0.05);
    hornGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc1.connect(hornGain);
    osc2.connect(hornGain);
    hornGain.connect(this.channelGains.horns || this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur + 0.1);
    osc2.stop(now + dur + 0.1);
  }

  /**
   * Apply calculated gain levels to each channel and update indoor filter
   */
  applyAudioState(state) {
    if (!this.audioCtx || !this.isPlaying) return;
    const now = this.audioCtx.currentTime;

    // Indoor / Outdoor perspective filter
    if (this.indoorFilter) {
      if (this.perspective === 'indoor') {
        // High frequency cutoff drops to simulate sound traveling through building envelope
        // If building insulation is active, drops down to 280 Hz (muffled quiet sanctuary)
        const hasInsulation = this.activeInterventions.has('building_sound_insulation');
        const cutoff = hasInsulation ? 260 : 420;
        this.indoorFilter.frequency.setTargetAtTime(cutoff, now, 0.15);
      } else {
        // Outdoor: wide open
        this.indoorFilter.frequency.setTargetAtTime(20000, now, 0.15);
      }
    }

    // Apply gains per channel (multiplied by user slider volume and intervention gain)
    const targetGains = state.audioGains;
    const channels = ['traffic', 'horns', 'construction', 'industry', 'crowd', 'nature'];

    channels.forEach(ch => {
      const gNode = this.channelGains[ch];
      if (gNode) {
        const userVol = this.channelVolumes[ch] ?? 0.75;
        const simVol = targetGains[ch] ?? 1.0;
        const finalVol = Math.max(0.0001, userVol * simVol);
        gNode.gain.setTargetAtTime(finalVol, now, 0.12);
      }
    });
  }

  applyChannelGains() {
    const state = this.calculateAcousticState();
    this.applyAudioState(state);
  }

  startAudio() {
    this.initAudio();
    this.isPlaying = true;

    // Resume context if suspended
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    // Restore master volume gain
    if (this.masterGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      if (this.masterGain.gain.cancelScheduledValues) {
        this.masterGain.gain.cancelScheduledValues(now);
      }
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, now, 0.05);
    }

    // Play all media elements
    Object.values(this.audioElements).forEach(audio => {
      audio.play().catch(e => console.log('[SOC Audio] Play prevented:', e));
    });

    // Restart horn loop
    this.startHornLoop();

    const btnSound = document.getElementById('soc-btn-sound');
    const labelEl = document.getElementById('soc-sound-label');
    const iconEl = document.getElementById('soc-sound-icon');
    btnSound?.setAttribute('aria-pressed', 'true');
    this.syncSpectrum();
    if (labelEl) labelEl.textContent = 'Pause';
    if (iconEl) {
      iconEl.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1"></rect>
          <rect x="14" y="4" width="4" height="16" rx="1"></rect>
        </svg>
      `;
    }

    this.updateSimulation();
  }

  pauseAudio() {
    this.isPlaying = false;
    if (this.masterGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      if (this.masterGain.gain.cancelScheduledValues) {
        this.masterGain.gain.cancelScheduledValues(now);
      }
      this.masterGain.gain.setTargetAtTime(0, now, 0.05);
    }
    Object.values(this.audioElements).forEach(audio => {
      audio.pause();
    });
    this.stopHornLoop();

    const btnSound = document.getElementById('soc-btn-sound');
    const labelEl = document.getElementById('soc-sound-label');
    const iconEl = document.getElementById('soc-sound-icon');
    btnSound?.setAttribute('aria-pressed', 'false');
    this.syncSpectrum();
    if (labelEl) labelEl.textContent = 'Listen';
    if (iconEl) {
      iconEl.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      `;
    }
  }

  stopHornLoop() {
    if (this.hornTimer) {
      clearInterval(this.hornTimer);
      this.hornTimer = null;
    }
  }

  toggleAudio() {
    if (this.isPlaying) {
      this.pauseAudio();
    } else {
      this.startAudio();
    }
  }

  stop() {
    this.leave();
    this.spectrumObserver?.disconnect();
    if (this.onVisibility) document.removeEventListener('visibilitychange', this.onVisibility);
    if (this.hornTimer) {
      clearInterval(this.hornTimer);
      this.hornTimer = null;
    }
    if (this.cavaRafId) {
      cancelAnimationFrame(this.cavaRafId);
      this.cavaRafId = null;
    }
    if (this.cavaResizeObserver) {
      this.cavaResizeObserver.disconnect();
      this.cavaResizeObserver = null;
    }
  }
}
