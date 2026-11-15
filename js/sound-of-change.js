/**
 * Terraphone — The Sound of Change Engine
 * NASA Space Apps Challenge 2026
 * 
 * Centralized Simulation State, Logarithmic Acoustic Model,
 * Layered 5-Channel Web Audio System & Video Crossfader
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
    this.splitSliderPosition = 0.5; // For interactive split before/after view
    this.isSplitModeActive = false;

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
    this.videoNoisy = null;
    this.videoQuiet = null;
    this.indexNumberEl = null;
    this.indexBadgeEl = null;
    this.indexDiffEl = null;
    this.activeCountEl = null;
    this.perspectiveLabelEl = null;

    // Animation / RAF
    this.rafId = null;
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
    this.initVideo();
    this.updateSimulation();
  }

  /**
   * Render the HTML structure for Sound of Change
   */
  renderLayout() {
    this.container.innerHTML = `
      <!-- Google Flow Video Background Viewport -->
      <div class="soc-video-viewport" id="soc-video-viewport">
        <video id="soc-video-noisy" class="soc-video soc-video-noisy" autoplay loop muted playsinline preload="auto" poster="img/busy_street_preview.jpg">
          <source src="videos/noisy-city.mp4" type="video/mp4">
          <source src="People_walking_on_busy_street_e5d487d8_1080p.mp4" type="video/mp4">
        </video>
        <video id="soc-video-quiet" class="soc-video soc-video-quiet" autoplay loop muted playsinline preload="auto" poster="img/manhattan_street_preview.jpg">
          <source src="videos/quiet-city.mp4" type="video/mp4">
          <source src="People_walking_on_Manhattan_street_3a44dd46_1080p.mp4" type="video/mp4">
        </video>
        
        <!-- Environmental Overlays -->
        <div class="soc-overlay soc-overlay-vignette"></div>
        <div class="soc-overlay soc-overlay-green" id="soc-overlay-green"></div>
        <div class="soc-overlay soc-overlay-barrier" id="soc-overlay-barrier"></div>
        <div class="soc-overlay soc-overlay-calm" id="soc-overlay-calm"></div>

        <!-- Before/After Split Line (Interactive Slider) -->
        <div class="soc-split-container" id="soc-split-container" style="display: none;">
          <div class="soc-split-line" id="soc-split-line">
            <div class="soc-split-handle" title="Drag to compare Noisy vs Quiet">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
          <div class="soc-split-badge left">BASELINE NOISY</div>
          <div class="soc-split-badge right">AFTER INTERVENTIONS</div>
        </div>
      </div>

      <!-- Main Interactive Interface Layer -->
      <div class="soc-ui-layer">
        
        <!-- Hero Header -->
        <header class="soc-header">
          <div class="soc-header-left">
            <button id="soc-btn-return-globe" class="soc-btn" style="padding: 4px 10px; font-size: 11px; margin-bottom: 6px;" title="Return to Global Rain 3D Globe (Hotkey C or Esc)">
              <span style="font-size: 13px;">←</span> <span>Global Rain Globe</span>
            </button>
            <div class="soc-location-tag">
              <span class="soc-live-dot"></span>
              <span class="soc-city-name">${this.city.name}</span>
              <span class="soc-coords">${this.city.coords}</span>
              <span class="soc-nasa-badge" title="NASA Soundscapes to Landscapes bioacoustic remote sensing model">🛰️ NASA S2L Model</span>
            </div>
            <p class="soc-city-desc">${this.city.description}</p>
          </div>

          <!-- Prominent Simulated Noise Index Capsule -->
          <div class="soc-index-capsule" id="soc-index-capsule">
            <div class="soc-index-top">
              <span class="soc-index-title">SIMULATED NOISE INDEX</span>
              <span class="soc-index-badge" id="soc-index-badge">HIGH NOISE</span>
            </div>
            <div class="soc-index-main">
              <span class="soc-index-num" id="soc-index-num">${this.city.initialIndex}</span>
              <span class="soc-index-scale">/ 100</span>
              <div class="soc-index-metrics">
                <span class="soc-metric-db" id="soc-metric-db">~85 dBA equiv</span>
                <span class="soc-metric-diff" id="soc-metric-diff">Baseline Level</span>
              </div>
            </div>
            <div class="soc-index-bar">
              <div class="soc-index-bar-fill" id="soc-index-bar-fill" style="width: 88%;"></div>
              <div class="soc-who-target" title="WHO Recommended Daytime Guideline: 53 dBA">
                <span>WHO 53 dB</span>
              </div>
            </div>
          </div>

          <!-- Primary Sound & View Controls -->
          <div class="soc-header-actions">
            <button id="soc-btn-sound" class="soc-btn soc-btn-primary" title="Start / Pause Soundscape (Spacebar)">
              <span id="soc-sound-icon" class="soc-btn-icon-svg">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </span>
              <span id="soc-sound-label">Start Soundscape</span>
            </button>

            <button id="soc-btn-perspective" class="soc-btn" title="Toggle Indoor / Outdoor Perspective">
              <span id="soc-persp-icon">🚶</span>
              <span id="soc-persp-label">Outdoor Sidewalk</span>
            </button>

            <button id="soc-btn-compare" class="soc-btn" title="Compare Baseline vs Interventions">
              <span id="soc-compare-icon">⚖️</span>
              <span id="soc-compare-label">Compare (Before)</span>
            </button>

            <button id="soc-btn-mixer-toggle" class="soc-btn soc-btn-icon" title="Open 5-Channel Audio Mixer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
            </button>
          </div>
        </header>

        <!-- Subheader Quick Actions & Status -->
        <div class="soc-subbar">
          <div class="soc-subbar-left">
            <span class="soc-counter-badge" id="soc-counter-badge">0 of ${INTERVENTIONS.length} Active</span>
            <span class="soc-health-badge" id="soc-health-badge" style="display: none;">
              <span>🛡️</span> Personal Hearing Health Protected
            </span>
          </div>

          <div class="soc-subbar-right">
            <button id="soc-btn-apply-all" class="soc-chip-btn" title="Activate all 20 interventions">⚡ Apply All</button>
            <button id="soc-btn-reset" class="soc-chip-btn" title="Reset all to initial noisy city">🔄 Reset All</button>
            <button id="soc-btn-split-toggle" class="soc-chip-btn" title="Toggle interactive split slider view">✂️ Split View</button>
          </div>
        </div>

        <!-- 4 Intervention Category Tabs & Grid -->
        <main class="soc-main">
          <!-- Category Tabs Navigation -->
          <nav class="soc-tabs" role="tablist" aria-label="Intervention Categories">
            ${INTERVENTION_CATEGORIES.map((cat, idx) => `
              <button 
                class="soc-tab ${idx === 0 ? 'active' : ''}" 
                role="tab" 
                aria-selected="${idx === 0}" 
                data-tab="${cat.id}"
                id="soc-tab-${cat.id}"
              >
                <span class="soc-tab-icon">${cat.icon}</span>
                <span class="soc-tab-name">${cat.name}</span>
                <span class="soc-tab-badge" id="soc-tab-count-${cat.id}">0</span>
              </button>
            `).join('')}
          </nav>

          <!-- Category Panels -->
          <div class="soc-panels">
            ${INTERVENTION_CATEGORIES.map((cat, idx) => `
              <div 
                class="soc-panel ${idx === 0 ? 'active' : ''}" 
                id="soc-panel-${cat.id}" 
                role="tabpanel" 
                aria-labelledby="soc-tab-${cat.id}"
              >
                <div class="soc-panel-intro">
                  <p>${cat.description}</p>
                </div>
                
                <div class="soc-cards-grid">
                  ${INTERVENTIONS.filter(item => item.category === cat.id).map(item => `
                    <div class="soc-card" id="soc-card-${item.id}" data-id="${item.id}">
                      <div class="soc-card-header">
                        <div class="soc-card-title-row">
                          <span class="soc-card-icon">${item.icon}</span>
                          <h4 class="soc-card-title">${item.title}</h4>
                        </div>
                        <!-- Accessible Toggle Switch -->
                        <button 
                          class="soc-toggle-switch" 
                          role="switch" 
                          aria-checked="false" 
                          id="soc-toggle-${item.id}"
                          data-id="${item.id}"
                          title="Toggle ${item.title}"
                        >
                          <span class="soc-toggle-knob"></span>
                        </button>
                      </div>

                      <p class="soc-card-desc">${item.shortDesc}</p>

                      <div class="soc-card-footer">
                        <span class="soc-impact-tag">${item.impactBadge}</span>
                        <span class="soc-channel-tag" title="Target Channel: ${item.soundChannel}">
                          ${this.getChannelIcon(item.soundChannel)} ${item.soundChannel.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </main>

        <!-- Slide-Out 5-Channel Audio Mixer Drawer -->
        <aside class="soc-mixer-drawer" id="soc-mixer-drawer">
          <div class="soc-mixer-header">
            <div class="soc-mixer-title-row">
              <span class="soc-mixer-icon">🎛️</span>
              <h3>Layered Audio Engine</h3>
            </div>
            <button id="soc-btn-close-mixer" class="soc-close-btn" aria-label="Close mixer">✕</button>
          </div>

          <div class="soc-mixer-content">
            <div class="soc-mixer-info-card">
              <p>Each channel has its own dedicated Web Audio GainNode. Interventions physically attenuate individual acoustic sources in real-time.</p>
            </div>

            <!-- Master Volume -->
            <div class="soc-mixer-channel master">
              <div class="soc-channel-info">
                <span class="soc-ch-label">🔊 Master Output</span>
                <span class="soc-ch-val" id="soc-val-master">85%</span>
              </div>
              <input type="range" id="soc-slider-master" min="0" max="1" step="0.01" value="0.85" class="soc-range-slider">
            </div>

            <!-- Channel 1: Traffic -->
            <div class="soc-mixer-channel">
              <div class="soc-channel-info">
                <span class="soc-ch-label">🚗 Traffic (Engines & Tires)</span>
                <span class="soc-ch-val" id="soc-val-traffic">85%</span>
              </div>
              <input type="range" id="soc-slider-traffic" min="0" max="1" step="0.01" value="0.85" class="soc-range-slider">
            </div>

            <!-- Channel: Horns -->
            <div class="soc-mixer-channel">
              <div class="soc-channel-info">
                <span class="soc-ch-label">📢 City Horns & Alarms</span>
                <span class="soc-ch-val" id="soc-val-horns">80%</span>
              </div>
              <input type="range" id="soc-slider-horns" min="0" max="1" step="0.01" value="0.80" class="soc-range-slider">
            </div>

            <!-- Channel 2: Construction -->
            <div class="soc-mixer-channel">
              <div class="soc-channel-info">
                <span class="soc-ch-label">🏗️ Construction & Jackhammers</span>
                <span class="soc-ch-val" id="soc-val-construction">75%</span>
              </div>
              <input type="range" id="soc-slider-construction" min="0" max="1" step="0.01" value="0.75" class="soc-range-slider">
            </div>

            <!-- Channel 3: Industry -->
            <div class="soc-mixer-channel">
              <div class="soc-channel-info">
                <span class="soc-ch-label">🏭 Industry & HVAC Chillers</span>
                <span class="soc-ch-val" id="soc-val-industry">70%</span>
              </div>
              <input type="range" id="soc-slider-industry" min="0" max="1" step="0.01" value="0.70" class="soc-range-slider">
            </div>

            <!-- Channel 4: Crowd & Entertainment -->
            <div class="soc-mixer-channel">
              <div class="soc-channel-info">
                <span class="soc-ch-label">👥 Pedestrians & Venues</span>
                <span class="soc-ch-val" id="soc-val-crowd">75%</span>
              </div>
              <input type="range" id="soc-slider-crowd" min="0" max="1" step="0.01" value="0.75" class="soc-range-slider">
            </div>

            <!-- Channel 5: Nature (Emerges as noise subsides) -->
            <div class="soc-mixer-channel nature">
              <div class="soc-channel-info">
                <span class="soc-ch-label">🌿 Nature (Birds & Wind)</span>
                <span class="soc-ch-val" id="soc-val-nature">65%</span>
              </div>
              <input type="range" id="soc-slider-nature" min="0" max="1" step="0.01" value="0.65" class="soc-range-slider">
            </div>

            <!-- Scientific Acoustic Modeling Formula Card -->
            <div class="soc-science-card">
              <span class="soc-science-title">📐 Logarithmic Acoustic Physics</span>
              <p>Sound levels combine logarithmically via acoustic pressure:</p>
              <code>L_total = 10 · log10( Σ 10^(Li / 10) )</code>
              <p class="soc-science-sub">Linear addition is physically incorrect. A 3 dB decrease represents a 50% cut in acoustic sound energy.</p>
            </div>
          </div>
        </aside>

      </div>
    `;
  }

  getChannelIcon(ch) {
    const icons = {
      traffic: '🚗',
      horns: '📢',
      indoor: '🪟',
      nature: '🌿',
      industry: '🏭',
      construction: '🏗️',
      crowd: '👥',
      health: '🎧'
    };
    return icons[ch] || '🔊';
  }

  cacheDomElements() {
    this.videoNoisy = document.getElementById('soc-video-noisy');
    this.videoQuiet = document.getElementById('soc-video-quiet');
    this.indexNumberEl = document.getElementById('soc-index-num');
    this.indexBadgeEl = document.getElementById('soc-index-badge');
    this.indexBarFillEl = document.getElementById('soc-index-bar-fill');
    this.indexMetricDb = document.getElementById('soc-metric-db');
    this.indexDiffEl = document.getElementById('soc-metric-diff');
    this.activeCountEl = document.getElementById('soc-counter-badge');
    this.healthBadgeEl = document.getElementById('soc-health-badge');
    this.overlayGreen = document.getElementById('soc-overlay-green');
    this.overlayBarrier = document.getElementById('soc-overlay-barrier');
    this.overlayCalm = document.getElementById('soc-overlay-calm');
    this.mixerDrawer = document.getElementById('soc-mixer-drawer');
    this.splitContainer = document.getElementById('soc-split-container');
    this.splitLine = document.getElementById('soc-split-line');
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
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        const panels = this.container.querySelectorAll('.soc-panel');
        panels.forEach(p => p.classList.remove('active'));
        const activePanel = document.getElementById(`soc-panel-${targetId}`);
        if (activePanel) activePanel.classList.add('active');
      });
    });

    // 2. Intervention Toggle Switches
    const toggles = this.container.querySelectorAll('.soc-toggle-switch');
    toggles.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.toggleIntervention(id);
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const id = btn.dataset.id;
          this.toggleIntervention(id);
        }
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

    // Return to Globe button
    const btnReturn = document.getElementById('soc-btn-return-globe');
    if (btnReturn) {
      btnReturn.addEventListener('click', () => {
        window.app?.switchExperience('rain');
      });
    }

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
        const iconEl = document.getElementById('soc-persp-icon');
        const labelEl = document.getElementById('soc-persp-label');
        if (this.perspective === 'indoor') {
          if (iconEl) iconEl.textContent = '🏠';
          if (labelEl) labelEl.textContent = 'Indoor Apartment';
          btnPersp.classList.add('active');
        } else {
          if (iconEl) iconEl.textContent = '🚶';
          if (labelEl) labelEl.textContent = 'Outdoor Sidewalk';
          btnPersp.classList.remove('active');
        }
        this.updateSimulation();
      });
    }

    // 5. Compare (Before / After) Button
    const btnCompare = document.getElementById('soc-btn-compare');
    if (btnCompare) {
      btnCompare.addEventListener('click', () => {
        this.isBeforeMode = !this.isBeforeMode;
        const labelEl = document.getElementById('soc-compare-label');
        if (this.isBeforeMode) {
          btnCompare.classList.add('active');
          if (labelEl) labelEl.textContent = 'Viewing: Baseline (Noisy)';
        } else {
          btnCompare.classList.remove('active');
          if (labelEl) labelEl.textContent = 'Compare (Before)';
        }
        this.updateSimulation();
      });
    }

    // 6. Apply All & Reset
    const btnApplyAll = document.getElementById('soc-btn-apply-all');
    if (btnApplyAll) {
      btnApplyAll.addEventListener('click', () => {
        INTERVENTIONS.forEach(item => this.activeInterventions.add(item.id));
        this.isBeforeMode = false;
        if (btnCompare) btnCompare.classList.remove('active');
        this.updateSimulation();
      });
    }

    const btnReset = document.getElementById('soc-btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.activeInterventions.clear();
        this.isBeforeMode = false;
        if (btnCompare) btnCompare.classList.remove('active');
        this.updateSimulation();
      });
    }

    // 7. Split View Toggle
    const btnSplit = document.getElementById('soc-btn-split-toggle');
    if (btnSplit) {
      btnSplit.addEventListener('click', () => {
        this.isSplitModeActive = !this.isSplitModeActive;
        if (this.splitContainer) {
          this.splitContainer.style.display = this.isSplitModeActive ? 'block' : 'none';
        }
        btnSplit.classList.toggle('active', this.isSplitModeActive);
        this.updateVideoBlend();
      });
    }

    // Interactive Split Slider dragging
    if (this.splitContainer) {
      let isDragging = false;
      const updateSplitFromX = (clientX) => {
        const rect = this.splitContainer.getBoundingClientRect();
        const pos = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
        this.splitSliderPosition = pos;
        if (this.splitLine) this.splitLine.style.left = `${pos * 100}%`;
        this.updateVideoBlend();
      };

      this.splitContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateSplitFromX(e.clientX);
      });
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        updateSplitFromX(e.clientX);
      });
      window.addEventListener('mouseup', () => {
        isDragging = false;
      });
      // Touch support
      this.splitContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          isDragging = true;
          updateSplitFromX(e.touches[0].clientX);
        }
      }, { passive: true });
      window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length === 0) return;
        updateSplitFromX(e.touches[0].clientX);
      }, { passive: true });
      window.addEventListener('touchend', () => {
        isDragging = false;
      });
    }

    // 8. Mixer Drawer Toggle & Close
    const btnMixerToggle = document.getElementById('soc-btn-mixer-toggle');
    const btnCloseMixer = document.getElementById('soc-btn-close-mixer');
    if (btnMixerToggle && this.mixerDrawer) {
      btnMixerToggle.addEventListener('click', () => {
        this.mixerDrawer.classList.toggle('open');
      });
    }
    if (btnCloseMixer && this.mixerDrawer) {
      btnCloseMixer.addEventListener('click', () => {
        this.mixerDrawer.classList.remove('open');
      });
    }

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
      this.activeCountEl.textContent = `${count} of ${INTERVENTIONS.length} Active`;
      this.activeCountEl.classList.toggle('active', count > 0);
    }

    // 4. Update Personal Hearing Health Badge
    if (this.healthBadgeEl) {
      this.healthBadgeEl.style.display = state.isHearingHealthActive ? 'inline-flex' : 'none';
    }

    // 5. Update Simulated Noise Index Gauge
    if (this.indexNumberEl) {
      this.indexNumberEl.textContent = state.index;
    }
    if (this.indexBarFillEl) {
      this.indexBarFillEl.style.width = `${Math.min(100, state.index)}%`;
      // Dynamic color depending on noise index
      if (state.index >= 75) {
        this.indexBarFillEl.style.background = 'linear-gradient(90deg, #f97316, #ef4444)';
      } else if (state.index >= 55) {
        this.indexBarFillEl.style.background = 'linear-gradient(90deg, #eab308, #f59e0b)';
      } else {
        this.indexBarFillEl.style.background = 'linear-gradient(90deg, #10b981, #38bdf8)';
      }
    }

    if (this.indexBadgeEl) {
      if (state.index >= 75) {
        this.indexBadgeEl.textContent = 'HIGH NOISE';
        this.indexBadgeEl.className = 'soc-index-badge high';
      } else if (state.index >= 55) {
        this.indexBadgeEl.textContent = 'MODERATE NOISE';
        this.indexBadgeEl.className = 'soc-index-badge moderate';
      } else if (state.index >= 40) {
        this.indexBadgeEl.textContent = 'CALM & LIVABLE';
        this.indexBadgeEl.className = 'soc-index-badge good';
      } else {
        this.indexBadgeEl.textContent = 'ACOUSTIC SANCTUARY';
        this.indexBadgeEl.className = 'soc-index-badge tranquil';
      }
    }

    if (this.indexMetricDb) {
      this.indexMetricDb.textContent = `~${state.dbDisplay} dBA equiv`;
    }

    if (this.indexDiffEl) {
      if (state.reduction > 0) {
        this.indexDiffEl.textContent = `↓ -${state.reduction} pts (${state.reduction > 15 ? 'Significant Relief' : 'Noticeable Improvement'})`;
        this.indexDiffEl.style.color = '#34d399';
      } else {
        this.indexDiffEl.textContent = 'Baseline Level';
        this.indexDiffEl.style.color = 'var(--text-sub)';
      }
    }

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

    // 7. Update Video Blend
    this.updateVideoBlend(state.quietFactor);

    // 8. Update Web Audio Engine
    this.applyAudioState(state);
  }

  /**
   * Video crossfade coordination between Noisy and Quiet Google Flow footage
   */
  initVideo() {
    if (this.videoNoisy) {
      this.videoNoisy.play().catch(e => console.log('[SOC] Video play prevented:', e));
    }
    if (this.videoQuiet) {
      this.videoQuiet.play().catch(e => console.log('[SOC] Video play prevented:', e));
    }
    this.updateVideoBlend(this.calculateAcousticState().quietFactor);
  }

  leave() {
    this.pauseAudio();
    this.videoNoisy?.pause();
    this.videoQuiet?.pause();
  }

  updateVideoBlend(quietFactor = 0) {
    if (!this.videoNoisy || !this.videoQuiet) return;

    if (this.isSplitModeActive) {
      // Split view mode: both videos visible side-by-side cleanly clipped
      this.videoNoisy.style.display = 'block';
      this.videoQuiet.style.display = 'block';
      this.videoNoisy.style.visibility = 'visible';
      this.videoQuiet.style.visibility = 'visible';
      const pct = this.splitSliderPosition * 100;
      this.videoNoisy.style.clipPath = `polygon(0% 0%, ${pct}% 0%, ${pct}% 100%, 0% 100%)`;
      this.videoQuiet.style.clipPath = `polygon(${pct}% 0%, 100% 0%, 100% 100%, ${pct}% 100%)`;
      this.videoNoisy.style.opacity = '1';
      this.videoQuiet.style.opacity = '1';
    } else {
      // Normal single-viewport mode: NEVER alpha-blend two live pedestrian clips!
      this.videoNoisy.style.clipPath = 'none';
      this.videoQuiet.style.clipPath = 'none';

      // If quietFactor >= 0.40 and not in baseline before-mode, show Quiet city; otherwise show Noisy city
      const showQuiet = !this.isBeforeMode && quietFactor >= 0.40;

      if (showQuiet) {
        this.videoQuiet.style.display = 'block';
        this.videoQuiet.style.visibility = 'visible';
        this.videoQuiet.style.opacity = '1';

        this.videoNoisy.style.opacity = '0';
        this.videoNoisy.style.visibility = 'hidden';
        this.videoNoisy.style.display = 'none';
      } else {
        this.videoNoisy.style.display = 'block';
        this.videoNoisy.style.visibility = 'visible';
        this.videoNoisy.style.opacity = '1';

        this.videoQuiet.style.opacity = '0';
        this.videoQuiet.style.visibility = 'hidden';
        this.videoQuiet.style.display = 'none';
      }
    }
  }

  // ==========================================
  // WEB AUDIO API SYSTEM
  // ==========================================

  initAudio() {
    if (this.masterGain) return; // already initialized

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!this.audioCtx) {
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;

    // Master Gain
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, now);
    this.masterGain.connect(this.audioCtx.destination);

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
    if (btnSound) btnSound.classList.add('playing');
    if (labelEl) labelEl.textContent = 'Pause Soundscape';
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
    if (btnSound) btnSound.classList.remove('playing');
    if (labelEl) labelEl.textContent = 'Start Soundscape';
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
    this.pauseAudio();
    if (this.hornTimer) {
      clearInterval(this.hornTimer);
      this.hornTimer = null;
    }
  }
}
