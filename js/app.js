/**
 * raIn.tensity - Main Application Controller
 * NASA Space Apps Challenge · NASA SVS 5650 & GPM IMERG
 * Centered Bumpy Globe with Elevation Colormap · Bilinear Data Interpolation · Zen Auto-Rotation
 */

import { IMERG_PALETTE, RAIN_TYPES, getRainType, PRESET_HOTSPOTS } from './data.js';
import { SoundEngine } from './audio.js';
import { SearchController } from './search.js';

// Free Public Basemaps: Physical Elevation-Colored Topography (No API Keys)
const BASEMAP_TILES = {
  // World Physical Map: Intrinsic hypsometric elevation coloring (green valleys -> amber hills -> sienna cordilleras -> white snow peaks)
  physical: ['https://services.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}'],
  darkSlate: ['https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
  lightSlate: ['https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}']
};

class App {
  constructor() {
    window.app = this;
    this.sound = new SoundEngine();
    this.map = null;

    // Theme state ('auto', 'dark', 'light')
    this.themeMode = 'auto';

    // Bumpy terrain level: Calibrated for dramatic tactile relief
    this.bumpLevel = 2.6;

    // Listening & Target state
    this.isListening = false;
    this.listeningTarget = null;
    this.activeRainLayerId = 'IMERG_Precipitation_Rate_30min';

    // High-performance CPU-cached precipitation buffer (zero GPU readbacks)
    this.samplingCanvas = document.createElement('canvas');
    this.samplingCanvas.width = 512;
    this.samplingCanvas.height = 512;
    this.samplingCtx = this.samplingCanvas.getContext('2d', { willReadFrequently: true });
    this.pixelData = null; // Uint8ClampedArray cached in RAM
    this.isRasterReady = false;

    // RAF throttle for mousemove
    this.mouseRafPending = false;
    this.lastMouseEvt = null;

    // Zen Mode Auto-Rotation State
    this.isZenMode = false;
    this.isAutoRotating = false;
    this.autoRotateRaf = null;
    this.autoRotateSpeed = 0.055; // Smooth degrees per frame
    this.zenInactivityTimer = null;

    // UI elements
    this.cursorTracker = document.getElementById('cursor-tracker');
    this.trackerRate = document.getElementById('tracker-rate');
    this.trackerTag = document.getElementById('tracker-tag');
    this.trackerCoords = document.getElementById('tracker-coords');
    this.trackerHint = document.getElementById('tracker-hint');

    this.rainGaugeFill = document.getElementById('rain-gauge-fill');
    this.hudRate = document.getElementById('hud-rate');
    this.hudRainType = document.getElementById('hud-rain-type');
    this.hudLocation = document.getElementById('hud-location');
    this.hudStatus = document.getElementById('hud-status');
    this.infocardContainer = document.getElementById('rain-infocard');

    this.initTheme();
    this.initMap();
    this.initAudioMixer();
    this.initControls();
    this.initSearch();
    this.initPresetPills();
    this.initInfocardHover();
    this.loadGlobalPrecipitationBuffer();
  }

  // ==========================================
  // THEME MANAGEMENT (Auto / Dark / Light)
  // ==========================================

  initTheme() {
    const saved = localStorage.getItem('raintensity_theme') || 'auto';
    this.setTheme(saved, false);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.themeMode === 'auto') {
        this.applyEffectiveTheme();
      }
    });
  }

  setTheme(mode, persist = true) {
    this.themeMode = mode;
    if (persist) {
      localStorage.setItem('raintensity_theme', mode);
    }
    this.applyEffectiveTheme();
    this.updateThemeButtonVisual();
  }

  applyEffectiveTheme() {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effective = this.themeMode === 'auto' ? (isSystemDark ? 'dark' : 'light') : this.themeMode;

    document.documentElement.setAttribute('data-theme', effective);
    document.documentElement.setAttribute('data-theme-setting', this.themeMode);

    if (this.map && this.map.isStyleLoaded()) {
      this.updateMapThemeStyles(effective);
    }
  }

  updateThemeButtonVisual() {
    const btn = document.getElementById('btn-theme');
    const label = document.getElementById('theme-label');
    if (!btn || !label) return;

    if (this.themeMode === 'auto') {
      label.textContent = 'Auto';
      btn.title = 'Theme: System Auto (Click for Dark)';
    } else if (this.themeMode === 'dark') {
      label.textContent = 'Dark';
      btn.title = 'Theme: Dark Mode (Click for Light)';
    } else {
      label.textContent = 'Light';
      btn.title = 'Theme: Light Mode (Click for Auto)';
    }
  }

  cycleTheme() {
    if (this.themeMode === 'auto') this.setTheme('dark');
    else if (this.themeMode === 'dark') this.setTheme('light');
    else this.setTheme('auto');
  }

  // ==========================================
  // 3D BUMPY GLOBE WITH ELEVATION COLORMAP
  // ==========================================

  initMap() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const rainWms = this.buildWmsUrl(this.activeRainLayerId);

    // Globe starts centered symmetrically at pitch 0 for wobble-free rotation
    this.map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        projection: { type: 'globe' },
        sources: {
          // 1. Elevation-Colored Physical Geography Basemap (Green valleys -> Amber plateaus -> Sienna peaks -> Snow summits)
          'base-source': {
            type: 'raster',
            tiles: BASEMAP_TILES.physical,
            tileSize: 256,
            attribution: 'Esri, USGS, NOAA Physical Topography'
          },
          // 2. AWS Open Data 3D Digital Elevation Model (DEM)
          'terrain-source': {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            tileSize: 256,
            encoding: 'terrarium',
            maxzoom: 12,
            attribution: 'AWS Open Data Elevation'
          },
          // 3. NASA GIBS Live GPM IMERG Precipitation Overlay
          'rain-source': {
            type: 'raster',
            tiles: [rainWms],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': isDark ? '#05070d' : '#dbeafe' }
          },
          // Base Physical Topographic Layer
          {
            id: 'base-layer',
            type: 'raster',
            source: 'base-source',
            paint: {
              'raster-fade-duration': 250,
              'raster-brightness-max': isDark ? 0.88 : 1.0,
              'raster-contrast': isDark ? 0.22 : 0.05,
              'raster-saturation': isDark ? -0.1 : 0.05
            }
          },
          // Shaded Relief / Hillshade Layer to accentuate the 3D bumpy peaks
          {
            id: 'hillshade-layer',
            type: 'hillshade',
            source: 'terrain-source',
            paint: {
              'hillshade-exaggeration': 0.88,
              'hillshade-shadow-color': isDark ? '#02050e' : '#475569',
              'hillshade-highlight-color': '#ffffff',
              'hillshade-accent-color': isDark ? '#38bdf8' : '#cbd5e1',
              'hillshade-illumination-direction': 315
            }
          },
          // Bilinear Interpolated Rain Layer (Smooth, non-blocky contours)
          {
            id: 'rain-layer',
            type: 'raster',
            source: 'rain-source',
            paint: {
              'raster-opacity': 0.88,
              'raster-fade-duration': 200,
              'raster-resampling': 'linear' // Bilinear hardware interpolation on GPU!
            }
          }
        ],
        terrain: {
          source: 'terrain-source',
          exaggeration: this.bumpLevel
        },
        sky: {
          'sky-color': isDark ? '#05070d' : '#dbeafe',
          'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.85, 4, 0.65, 7, 0]
        }
      },
      center: [0, 15],
      zoom: 2.15,
      minZoom: 1.2,
      maxZoom: 11,
      pitch: 0,
      bearing: 0,
      renderWorldCopies: false,
      attributionControl: false
    });

    this.map.on('style.load', () => {
      this.applyTerrainBumpiness();
      this.applyEffectiveTheme();
    });

    // Zoom listener for altitude-dependent acoustics
    this.map.on('zoom', () => {
      this.updateAudioForCurrentTarget();
      this.updateZoomDisplay();
    });

    // Mousemove listener with RAF throttle
    this.map.on('mousemove', (e) => {
      this.lastMouseEvt = e;
      if (!this.mouseRafPending) {
        this.mouseRafPending = true;
        requestAnimationFrame(() => {
          this.mouseRafPending = false;
          if (this.lastMouseEvt) {
            this.handleMouseMove(this.lastMouseEvt);
          }
        });
      }

      // If user moves mouse during Zen mode, pause autorotation
      if (this.isZenMode) {
        this.handleZenUserActivity();
      }
    });

    this.map.on('mouseout', () => this.hideCursorTracker());

    // Globe Click listener: ONLY START PLAYING WHEN CLICKED
    this.map.on('click', (e) => {
      if (this.isZenMode) {
        this.handleZenUserActivity();
      }
      this.handleGlobeClick(e);
    });

    // Drag / Pan interaction in Zen Mode
    this.map.on('dragstart', () => {
      if (this.isZenMode) this.handleZenUserActivity();
    });

    // Refresh NASA IMERG rain layer every 10 minutes
    setInterval(() => this.refreshRainLayer(), 10 * 60 * 1000);
  }

  buildWmsUrl(layerId) {
    return `https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${encodeURIComponent(
      layerId
    )}&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=512&HEIGHT=512&FORMAT=image/png&TRANSPARENT=TRUE`;
  }

  updateMapThemeStyles(theme) {
    const isDark = theme === 'dark';
    try {
      if (this.map.getLayer('background')) {
        this.map.setPaintProperty('background', 'background-color', isDark ? '#05070d' : '#dbeafe');
      }
      if (this.map.getLayer('base-layer')) {
        this.map.setPaintProperty('base-layer', 'raster-brightness-max', isDark ? 0.88 : 1.0);
        this.map.setPaintProperty('base-layer', 'raster-contrast', isDark ? 0.22 : 0.05);
      }
      if (this.map.getLayer('hillshade-layer')) {
        this.map.setPaintProperty('hillshade-layer', 'hillshade-shadow-color', isDark ? '#02050e' : '#475569');
      }
    } catch (e) {
      console.warn('Map styling update deferred:', e);
    }
  }

  // ==========================================
  // BUMPY GLOBE RELIEF CONTROLS
  // ==========================================

  setBumpLevel(level) {
    this.bumpLevel = level;
    this.applyTerrainBumpiness();

    document.querySelectorAll('.bump-pill').forEach((el) => {
      el.classList.toggle('active', parseFloat(el.dataset.level) === level);
    });
  }

  applyTerrainBumpiness() {
    if (!this.map) return;
    try {
      if (this.bumpLevel <= 0.05) {
        this.map.setTerrain(null);
      } else {
        this.map.setTerrain({
          source: 'terrain-source',
          exaggeration: this.bumpLevel
        });
      }
    } catch (e) {
      console.warn('SetTerrain notice:', e);
    }
  }

  // ==========================================
  // BILINEAR DATA INTERPOLATION (NO BLOCKINESS)
  // ==========================================

  async loadGlobalPrecipitationBuffer() {
    const url = `https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${encodeURIComponent(
      this.activeRainLayerId
    )}&CRS=EPSG:3857&BBOX=-20037508,-20037508,20037508,20037508&WIDTH=512&HEIGHT=512&FORMAT=image/png&TRANSPARENT=TRUE`;

    try {
      const resp = await fetch(url, { cache: 'no-store' });
      if (!resp.ok) throw new Error('WMS status ' + resp.status);
      const blob = await resp.blob();

      const img = new Image();
      img.src = URL.createObjectURL(blob);
      await img.decode();

      this.samplingCtx.clearRect(0, 0, 512, 512);
      this.samplingCtx.drawImage(img, 0, 0, 512, 512);

      this.pixelData = this.samplingCtx.getImageData(0, 0, 512, 512).data;
      this.isRasterReady = true;

      const dot = document.getElementById('connection-dot');
      if (dot) dot.className = 'dot ok';

      if (this.listeningTarget) {
        this.setListeningPoint(this.listeningTarget.lng, this.listeningTarget.lat, this.listeningTarget.label, false);
      }
    } catch (err) {
      console.warn('Global precipitation buffer fetch failed:', err);
      if (this.activeRainLayerId === 'IMERG_Precipitation_Rate_30min') {
        this.activeRainLayerId = 'IMERG_Precipitation_Rate';
        this.loadGlobalPrecipitationBuffer();
      }
    }
  }

  // True Bilinear Interpolation over floating coordinates
  sampleRateAt(lng, lat) {
    if (!this.isRasterReady || !this.pixelData) return 0;

    const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
    const normLng = ((lng + 180) % 360 + 360) % 360 - 180;

    const fx = ((normLng + 180) / 360) * 512;
    const latRad = (clampedLat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const fy = (0.5 - mercN / (2 * Math.PI)) * 512;

    if (fx < 0 || fx >= 512 || fy < 0 || fy >= 512) return 0;

    // Four bounding integer coordinates
    const x0 = Math.floor(fx);
    const x1 = Math.min(511, x0 + 1);
    const y0 = Math.floor(fy);
    const y1 = Math.min(511, y0 + 1);

    // Fractional interpolation weights
    const wx = fx - x0;
    const wy = fy - y0;

    // Sample discrete corner pixel rates
    const r00 = this.getPixelRainRate(x0, y0);
    const r10 = this.getPixelRainRate(x1, y0);
    const r01 = this.getPixelRainRate(x0, y1);
    const r11 = this.getPixelRainRate(x1, y1);

    // If completely clear
    if (r00 === 0 && r10 === 0 && r01 === 0 && r11 === 0) return 0;

    // Smooth continuous bilinear interpolation
    const top = (1 - wx) * r00 + wx * r10;
    const bottom = (1 - wx) * r01 + wx * r11;
    const interpolated = (1 - wy) * top + wy * bottom;

    return Math.max(0, interpolated);
  }

  getPixelRainRate(px, py) {
    const idx = (py * 512 + px) * 4;
    if (this.pixelData[idx + 3] < 15) return 0;
    return this.matchPixelToPalette(
      this.pixelData[idx],
      this.pixelData[idx + 1],
      this.pixelData[idx + 2]
    );
  }

  matchPixelToPalette(r, g, b) {
    let bestDist = Infinity;
    let bestVal = 0;

    for (const p of IMERG_PALETTE) {
      const dr = r - p.rgb[0];
      const dg = g - p.rgb[1];
      const db = b - p.rgb[2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestVal = p.v;
        if (dist === 0) break;
      }
    }
    return bestVal;
  }

  // ==========================================
  // ZEN MODE CINEMATIC AUTO-ROTATION
  // ==========================================

  startZenAutoRotation() {
    if (this.isAutoRotating) return;
    this.isAutoRotating = true;

    const rotateStep = () => {
      if (!this.isAutoRotating || !this.map || !this.isZenMode) return;
      const center = this.map.getCenter();
      let newLng = center.lng + this.autoRotateSpeed;
      if (newLng > 180) newLng -= 360;

      this.map.setCenter([newLng, center.lat]);
      this.autoRotateRaf = requestAnimationFrame(rotateStep);
    };

    this.autoRotateRaf = requestAnimationFrame(rotateStep);
  }

  pauseZenAutoRotation() {
    this.isAutoRotating = false;
    if (this.autoRotateRaf) {
      cancelAnimationFrame(this.autoRotateRaf);
      this.autoRotateRaf = null;
    }
  }

  handleZenUserActivity() {
    this.pauseZenAutoRotation();
    clearTimeout(this.zenInactivityTimer);
    // Smoothly resume autorotation after 3.2 seconds of inactivity
    this.zenInactivityTimer = setTimeout(() => {
      if (this.isZenMode) {
        this.startZenAutoRotation();
      }
    }, 3200);
  }

  toggleUiVisibility() {
    this.isZenMode = document.body.classList.toggle('zen-mode');
    const toast = document.getElementById('zen-toast');

    if (this.isZenMode) {
      if (toast) {
        toast.textContent = 'Zen Mode · Auto-rotating (Press H to restore UI)';
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 3200);
      }
      // Immediately begin auto-rotation on first open of Zen mode!
      this.startZenAutoRotation();
    } else {
      // Cleanly exit Zen mode & stop rotation
      this.pauseZenAutoRotation();
      clearTimeout(this.zenInactivityTimer);
      if (toast) toast.classList.remove('visible');
    }
  }

  // ==========================================
  // MOUSE FOLLOWER FOR RAIN HEAVINESS INFO
  // ==========================================

  handleMouseMove(e) {
    if (!this.map) return;
    const { lng, lat } = e.lngLat;
    const rate = this.sampleRateAt(lng, lat);
    const rainType = getRainType(rate);

    const latStr = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}`;
    const lngStr = `${Math.abs(lng).toFixed(1)}°${lng >= 0 ? 'E' : 'W'}`;

    this.trackerRate.textContent = rate < 0.05 ? '0.0 mm/h' : `${rate.toFixed(1)} mm/h`;
    this.trackerTag.textContent = `${rainType.icon} ${rainType.tag}`;
    this.trackerCoords.textContent = `${latStr}, ${lngStr}`;

    const isCurrentTarget =
      this.listeningTarget &&
      Math.abs(this.listeningTarget.lng - lng) < 0.4 &&
      Math.abs(this.listeningTarget.lat - lat) < 0.4;

    this.trackerHint.textContent = isCurrentTarget
      ? 'Currently listening here'
      : this.isListening
      ? 'Click to listen here'
      : 'Click anywhere to play live rain';

    const x = Math.min(window.innerWidth - 230, Math.max(16, e.point.x + 18));
    const y = Math.min(window.innerHeight - 110, Math.max(70, e.point.y + 18));
    this.cursorTracker.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    this.cursorTracker.classList.add('visible');
  }

  hideCursorTracker() {
    this.cursorTracker.classList.remove('visible');
  }

  // ==========================================
  // CLICK-TO-PLAY INTERACTION
  // ==========================================

  handleGlobeClick(e) {
    const { lng, lat } = e.lngLat;
    this.setListeningPoint(lng, lat, null, true);
  }

  setListeningPoint(lng, lat, customLabel = null, triggerRipple = true) {
    const rate = this.sampleRateAt(lng, lat);
    const rainType = getRainType(rate);

    const latStr = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}`;
    const lngStr = `${Math.abs(lng).toFixed(1)}°${lng >= 0 ? 'E' : 'W'}`;
    const locationName = customLabel || `${latStr}, ${lngStr}`;

    this.listeningTarget = { lng, lat, rate, label: locationName };

    if (triggerRipple) {
      this.triggerSonarPing(lng, lat);
    }

    if (!this.isListening) {
      this.sound.startAudio();
      this.isListening = true;
      this.updatePlayButtonVisual(true);
    }

    this.updateHud(rate, rainType, locationName);

    const zoom = this.map ? this.map.getZoom() : 2.5;
    this.sound.updateRain(rate, zoom, true);
  }

  updateAudioForCurrentTarget() {
    if (!this.isListening || !this.listeningTarget) return;
    const zoom = this.map ? this.map.getZoom() : 2.5;
    const rate = this.sampleRateAt(this.listeningTarget.lng, this.listeningTarget.lat);
    this.listeningTarget.rate = rate;
    const rainType = getRainType(rate);

    this.updateHud(rate, rainType, this.listeningTarget.label);
    this.sound.updateRain(rate, zoom, true);
  }

  updateHud(rate, rainType, locationName) {
    this.hudRate.textContent = rate < 0.05 ? '0.0' : rate.toFixed(1);
    this.hudRainType.innerHTML = `${rainType.icon} <span>${rainType.tag}</span>`;
    this.hudLocation.textContent = locationName;
    this.hudStatus.textContent = this.isListening ? 'LIVE AUDIO ACTIVE' : 'CLICK TO LISTEN';

    const logNorm = Math.min(1.0, Math.max(0, Math.log10(Math.max(0.01, rate) + 0.1) / 2.2));
    this.rainGaugeFill.style.width = `${Math.round(logNorm * 100)}%`;

    this.populateInfocard(rainType, rate);
  }

  triggerSonarPing(lng, lat) {
    const pingEl = document.createElement('div');
    pingEl.className = 'map-sonar-ping';

    const marker = new maplibregl.Marker({
      element: pingEl,
      anchor: 'center'
    })
      .setLngLat([lng, lat])
      .addTo(this.map);

    setTimeout(() => {
      marker.remove();
    }, 1800);
  }

  // ==========================================
  // RAIN TYPE HOVER INFOCARDS
  // ==========================================

  initInfocardHover() {
    const indicator = document.getElementById('hud-rain-indicator');
    if (!indicator || !this.infocardContainer) return;

    let hoverTimeout = null;

    indicator.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      this.infocardContainer.classList.add('visible');
    });

    indicator.addEventListener('mouseleave', () => {
      hoverTimeout = setTimeout(() => {
        this.infocardContainer.classList.remove('visible');
      }, 300);
    });

    this.infocardContainer.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
    });

    this.infocardContainer.addEventListener('mouseleave', () => {
      this.infocardContainer.classList.remove('visible');
    });
  }

  populateInfocard(rainType, currentRate) {
    if (!this.infocardContainer) return;

    this.infocardContainer.innerHTML = `
      <div class="infocard-header">
        <div class="infocard-badge">${rainType.icon} ${rainType.name}</div>
        <div class="infocard-range">${rainType.rateMin} – ${rainType.rateMax} mm/hr</div>
      </div>

      <div class="infocard-row">
        <span class="info-label">Scientific Class:</span>
        <span class="info-value">${rainType.scientificClass}</span>
      </div>

      <div class="infocard-row">
        <span class="info-label">Cloud Genus:</span>
        <span class="info-value">${rainType.cloudGenus}</span>
      </div>

      <div class="infocard-metrics">
        <div class="metric-box">
          <span class="metric-title">Drop Diameter</span>
          <span class="metric-num">${rainType.dropDiameter}</span>
        </div>
        <div class="metric-box">
          <span class="metric-title">Velocity</span>
          <span class="metric-num">${rainType.terminalVelocity}</span>
        </div>
        <div class="metric-box">
          <span class="metric-title">Kinetic Energy</span>
          <span class="metric-num">${rainType.kineticEnergy}</span>
        </div>
      </div>

      <div class="infocard-section">
        <span class="info-label">Acoustic Signature:</span>
        <p class="info-desc">${rainType.acousticSignature}</p>
      </div>

      <div class="infocard-section">
        <span class="info-label">NASA GPM IMERG Detection:</span>
        <p class="info-desc">${rainType.nasaGpmDetection}</p>
      </div>

      <div class="infocard-footer">
        <span>GPM DPR & GMI Algorithm V07B</span>
        <span>Observed: ${(currentRate || 0).toFixed(1)} mm/hr</span>
      </div>
    `;
  }

  // ==========================================
  // SEARCHBAR WITH CAMERA LOCK & LIVE AUTOCOMPLETE
  // ==========================================

  initSearch() {
    const searchInput = document.getElementById('search-input');
    const suggestionsBox = document.getElementById('search-suggestions');

    new SearchController(searchInput, suggestionsBox, (item) => {
      if (item.isHeaviestAction) {
        this.flyToHeaviestRainArea();
        return;
      }
      this.lockToLocation(item.lng, item.lat, item.zoom || 5.5, item.name);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      } else if (e.key === 'h' || e.key === 'H') {
        if (document.activeElement !== searchInput) {
          this.toggleUiVisibility();
        }
      } else if (e.key === 'l' || e.key === 'L') {
        if (document.activeElement !== searchInput) {
          this.toggleLoFi();
        }
      } else if (e.key === ' ' && document.activeElement !== searchInput) {
        e.preventDefault();
        this.togglePlayback();
      } else if ((e.key === 's' || e.key === 'S') && document.activeElement !== searchInput) {
        this.flyToHeaviestRainArea();
      }
    });
  }

  lockToLocation(lng, lat, zoom = 5.5, locationName = null) {
    if (!this.map) return;

    if (this.isZenMode) {
      this.handleZenUserActivity();
    }

    this.map.flyTo({
      center: [lng, lat],
      zoom: Math.max(4.0, Math.min(zoom, 7.0)),
      pitch: 0,
      bearing: 0,
      speed: 1.15,
      curve: 1.35,
      essential: true
    });

    setTimeout(() => {
      this.setListeningPoint(lng, lat, locationName, true);
    }, 500);
  }

  // ==========================================
  // FLY TO HEAVIEST RAIN AREA (LIVE NASA GPM)
  // ==========================================

  flyToHeaviestRainArea() {
    let maxRate = 0;
    let bestPixel = null;

    // Scan global raster buffer if ready
    if (this.isRasterReady && this.pixelData) {
      // Step through with stride 2 for instantaneous scan across ~65k points
      for (let py = 12; py < 500; py += 2) {
        for (let px = 0; px < 512; px += 2) {
          const idx = (py * 512 + px) * 4;
          if (this.pixelData[idx + 3] < 20) continue;

          const rate = this.matchPixelToPalette(
            this.pixelData[idx],
            this.pixelData[idx + 1],
            this.pixelData[idx + 2]
          );

          if (rate > maxRate) {
            maxRate = rate;
            bestPixel = { px, py };
          }
        }
      }

      // Fine-grained refinement in 5x5 window around peak
      if (bestPixel) {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const px = Math.max(0, Math.min(511, bestPixel.px + dx));
            const py = Math.max(0, Math.min(511, bestPixel.py + dy));
            const idx = (py * 512 + px) * 4;
            if (this.pixelData[idx + 3] < 20) continue;
            const rate = this.matchPixelToPalette(
              this.pixelData[idx],
              this.pixelData[idx + 1],
              this.pixelData[idx + 2]
            );
            if (rate > maxRate) {
              maxRate = rate;
              bestPixel = { px, py };
            }
          }
        }
      }
    }

    let targetLng, targetLat, locationLabel;

    if (bestPixel && maxRate >= 0.5) {
      // Invert Web Mercator pixel coords back to WGS84 lng/lat
      targetLng = (bestPixel.px / 512) * 360 - 180;
      const mercN = (0.5 - bestPixel.py / 512) * (2 * Math.PI);
      const latRad = 2 * (Math.atan(Math.exp(mercN)) - Math.PI / 4);
      targetLat = (latRad * 180) / Math.PI;

      const latStr = `${Math.abs(targetLat).toFixed(1)}°${targetLat >= 0 ? 'N' : 'S'}`;
      const lngStr = `${Math.abs(targetLng).toFixed(1)}°${targetLng >= 0 ? 'E' : 'W'}`;
      locationLabel = `Storm Epicenter (${maxRate.toFixed(1)} mm/hr · ${latStr}, ${lngStr})`;
    } else {
      // Fallback: Check known global rain hotspots and sample current live rainfall
      let highestObserved = 0;
      let topSpot = PRESET_HOTSPOTS[0]; // Amazon Basin

      for (const spot of PRESET_HOTSPOTS) {
        const rate = this.sampleRateAt(spot.lng, spot.lat);
        if (rate > highestObserved) {
          highestObserved = rate;
          topSpot = spot;
        }
      }

      targetLng = topSpot.lng;
      targetLat = topSpot.lat;
      maxRate = highestObserved > 0 ? highestObserved : 12.8;
      locationLabel = `${topSpot.label} (${maxRate.toFixed(1)} mm/hr)`;
    }

    // Button visual feedback on both top button & bottom pill
    const btns = [
      document.getElementById('btn-heaviest'),
      document.getElementById('btn-heaviest-pill')
    ];
    btns.forEach((btn) => {
      if (!btn) return;
      btn.classList.add('active');
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<span>⚡ Epicenter (${maxRate.toFixed(1)} mm/hr)</span>`;
      setTimeout(() => {
        btn.classList.remove('active');
        btn.innerHTML = originalHtml;
      }, 3500);
    });

    if (this.isZenMode) {
      this.handleZenUserActivity();
    }

    // Smooth orbital camera flyTo to peak rainfall
    this.map.flyTo({
      center: [targetLng, targetLat],
      zoom: 5.2,
      pitch: 0,
      bearing: 0,
      speed: 1.15,
      curve: 1.35,
      essential: true
    });

    // Start playing audio immediately at the epicenter
    setTimeout(() => {
      this.sound.startAudio();
      this.setListeningPoint(targetLng, targetLat, locationLabel, true);
    }, 400);
  }

  // ==========================================
  // PRESET HOTSPOT PILLS
  // ==========================================

  initPresetPills() {
    const container = document.getElementById('hotspot-pills');
    if (!container) return;

    PRESET_HOTSPOTS.forEach((spot) => {
      const pill = document.createElement('button');
      pill.className = 'hotspot-pill';
      pill.innerHTML = `<span>${spot.name}</span> <small>${spot.tag}</small>`;
      pill.addEventListener('click', () => {
        this.lockToLocation(spot.lng, spot.lat, spot.zoom, spot.label);
      });
      container.appendChild(pill);
    });
  }

  // ==========================================
  // AUDIO MIXER & SLIDERS
  // ==========================================

  initAudioMixer() {
    const rainSlider = document.getElementById('slider-rain-vol');
    const lofiSlider = document.getElementById('slider-lofi-vol');

    if (rainSlider) {
      rainSlider.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        this.sound.setRainVolume(v);
      });
    }

    if (lofiSlider) {
      lofiSlider.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        this.sound.setLoFiVolume(v);
      });
    }

    const visualizerEl = document.getElementById('lofi-visualizer');
    if (visualizerEl) {
      this.sound.onVisualizer((bands) => {
        const bars = visualizerEl.querySelectorAll('.lofi-bar');
        bars.forEach((bar, i) => {
          const val = Array.isArray(bands) ? (bands[i] || 0.1) : 0.2;
          const height = Math.max(3, Math.round(val * 13));
          bar.style.height = `${height}px`;
        });
      });
    }
  }

  toggleLoFi() {
    const nextState = !this.sound.lofiEnabled;
    this.sound.setLoFi(nextState);

    const btn = document.getElementById('btn-lofi');
    if (btn) {
      btn.classList.toggle('active', nextState);
    }
  }

  togglePlayback() {
    if (!this.isListening) {
      const center = this.map ? this.map.getCenter() : { lng: -60, lat: -3 };
      this.setListeningPoint(center.lng, center.lat, null, true);
    } else {
      const isMuted = this.sound.toggleMute();
      this.updatePlayButtonVisual(!isMuted);
    }
  }

  updatePlayButtonVisual(isPlaying) {
    const btn = document.getElementById('btn-listen');
    if (!btn) return;
    btn.innerHTML = isPlaying
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg><span>Pause</span>`
      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Listen</span>`;
    btn.classList.toggle('active', isPlaying);
  }

  // ==========================================
  // CONTROLS & MODALS
  // ==========================================

  initControls() {
    // Initialize controls
    document.getElementById('btn-heaviest')?.addEventListener('click', () => this.flyToHeaviestRainArea());
    document.getElementById('btn-heaviest-pill')?.addEventListener('click', () => this.flyToHeaviestRainArea());
    document.getElementById('btn-theme')?.addEventListener('click', () => this.cycleTheme());
    document.getElementById('btn-lofi')?.addEventListener('click', () => this.toggleLoFi());
    document.getElementById('btn-listen')?.addEventListener('click', () => this.togglePlayback());
    document.getElementById('btn-hide-ui')?.addEventListener('click', () => this.toggleUiVisibility());

    document.querySelectorAll('.bump-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const level = parseFloat(btn.dataset.level);
        this.setBumpLevel(level);
      });
    });

    const infoModal = document.getElementById('info-modal');
    document.getElementById('btn-info')?.addEventListener('click', () => {
      infoModal.classList.add('open');
    });
    document.getElementById('close-info-modal')?.addEventListener('click', () => {
      infoModal.classList.remove('open');
    });
    infoModal?.addEventListener('click', (e) => {
      if (e.target === infoModal) infoModal.classList.remove('open');
    });
  }

  updateZoomDisplay() {
    const el = document.getElementById('zoom-display');
    if (el && this.map) {
      const z = this.map.getZoom();
      el.textContent = `Zoom ${z.toFixed(1)}`;
    }
  }

  refreshRainLayer() {
    if (!this.map || !this.map.getSource('rain-source')) return;
    try {
      const newUrl = this.buildWmsUrl(this.activeRainLayerId) + `&_t=${Date.now()}`;
      this.map.getSource('rain-source').setTiles([newUrl]);
      this.loadGlobalPrecipitationBuffer();
    } catch (e) {
      console.warn('Rain layer refresh error:', e);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
