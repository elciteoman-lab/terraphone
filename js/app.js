/**
 * Terraphone - Main Application Controller
 * NASA Space Apps Challenge · NASA SVS 5650 & GPM IMERG
 * Centered Bumpy Globe with Elevation Colormap · Bilinear Data Interpolation
 * Hovering Atmospheric Cloud Deck · Convective Thunder & Lightning · Location Ambience
 */

import {
  IMERG_PALETTE,
  RAIN_TYPES,
  getRainType,
  PRESET_HOTSPOTS,
  CITIES_DATABASE,
  QUIZ_QUESTIONS,
  isCoordinateLand,
  getCityNoiseData
} from './data.js';
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

    // 3D Terrain Relief Toggle State (starts ON with calibrated exaggeration 2.6)
    this.isTerrainEnabled = true;
    this.bumpLevel = 2.6;

    // Current city noise pollution profile
    this.currentNoiseData = null;

    // Listening & Target state
    this.isListening = false;
    this.listeningTarget = null;
    this.crosshairMarker = null;
    this.crosshairEl = null;
    this.currentEnv = 'rural';
    this.activeRainLayerId = 'IMERG_Precipitation_Rate_30min';
    this.convectiveThunderTimer = null;

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

    // Quiz state
    this.quizIndex = 0;
    this.quizScore = 0;
    this.quizAnswered = false;

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
    this.initQuiz();
    this.initInfocardHover();
    this.loadGlobalPrecipitationBuffer();
  }

  // ==========================================
  // THEME MANAGEMENT (Auto / Dark / Light)
  // ==========================================

  initTheme() {
    const saved = localStorage.getItem('terraphone_theme') || localStorage.getItem('raintensity_theme') || 'auto';
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
      localStorage.setItem('terraphone_theme', mode);
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
  // 3D BUMPY GLOBE WITH HOVERING CLOUD DECK
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
          // 1. Elevation-Colored Physical Geography Basemap
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
          // 1. Ground Cloud Shadow Layer (Casts dark diffuse cloud shadows on 3D terrain)
          {
            id: 'cloud-shadow-layer',
            type: 'raster',
            source: 'rain-source',
            paint: {
              'raster-opacity': 0.38,
              'raster-fade-duration': 200,
              'raster-brightness-max': 0.10,
              'raster-contrast': 0.55,
              'raster-saturation': -1.0,
              'raster-resampling': 'linear'
            }
          },
          // 2. Hovering Atmospheric Storm Cloud Deck
          {
            id: 'cloud-deck-layer',
            type: 'raster',
            source: 'rain-source',
            paint: {
              'raster-opacity': 0.90,
              'raster-fade-duration': 200,
              'raster-brightness-max': 1.0,
              'raster-contrast': 0.35,
              'raster-saturation': 0.12,
              'raster-resampling': 'linear'
            }
          }
        ],
        terrain: {
          source: 'terrain-source',
          exaggeration: this.bumpLevel
        },
        sky: {
          'sky-color': isDark ? '#05070d' : '#cfe2fe',
          'horizon-color': isDark ? '#0a1628' : '#e0f2fe',
          'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.90, 4, 0.65, 7, 0.15]
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

      if (this.isZenMode) {
        this.handleZenUserActivity();
      }
    });

    this.map.on('mouseout', () => this.hideCursorTracker());

    // Globe Click listener: start listening at click point
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

    // Thunder strike callback for visual lightning flash
    this.sound.onThunder(({ duration }) => {
      const overlay = document.getElementById('lightning-overlay');
      if (overlay) {
        overlay.classList.add('flashing');
        setTimeout(() => overlay.classList.remove('flashing'), duration || 250);
      }

      try {
        if (this.map && this.map.getLayer('cloud-deck-layer')) {
          this.map.setPaintProperty('cloud-deck-layer', 'raster-contrast', 0.85);
          setTimeout(() => {
            try {
              if (this.map && this.map.getLayer('cloud-deck-layer')) {
                this.map.setPaintProperty('cloud-deck-layer', 'raster-contrast', 0.35);
              }
            } catch (e) {}
          }, 200);
        }
      } catch (e) {}
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
  // BUMPY GLOBE RELIEF CONTROLS (ON / OFF TOGGLE)
  // ==========================================

  toggleTerrainRelief() {
    this.isTerrainEnabled = !this.isTerrainEnabled;
    this.applyTerrainBumpiness();

    const btn = document.getElementById('btn-relief-toggle');
    const label = document.getElementById('relief-toggle-label');
    if (btn) {
      btn.classList.toggle('active', this.isTerrainEnabled);
      btn.setAttribute('aria-pressed', this.isTerrainEnabled ? 'true' : 'false');
    }
    if (label) {
      label.textContent = this.isTerrainEnabled ? 'ON' : 'OFF';
    }
  }

  applyTerrainBumpiness() {
    if (!this.map) return;
    try {
      if (!this.isTerrainEnabled) {
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

    const x0 = Math.floor(fx);
    const x1 = Math.min(511, x0 + 1);
    const y0 = Math.floor(fy);
    const y1 = Math.min(511, y0 + 1);

    const wx = fx - x0;
    const wy = fy - y0;

    const r00 = this.getPixelRainRate(x0, y0);
    const r10 = this.getPixelRainRate(x1, y0);
    const r01 = this.getPixelRainRate(x0, y1);
    const r11 = this.getPixelRainRate(x1, y1);

    if (r00 === 0 && r10 === 0 && r01 === 0 && r11 === 0) return 0;

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
  // LOCATION HABITAT CLASSIFIER
  // Urban / Rural / Jungle / Ocean
  // ==========================================

  classifyLocationEnvironment(lng, lat) {
    // 1. Exact 1-degree global land/ocean bitmask lookup (Natural Earth 110m)
    // Instantaneous O(1) determination: oceans worldwide are 100% accurately detected
    if (!isCoordinateLand(lng, lat)) {
      return 'ocean';
    }

    // 2. Equatorial / tropical rainforests (Jungle wildlife)
    // Amazon Basin
    if (lat >= -12 && lat <= 6 && lng >= -76 && lng <= -48) return 'jungle';
    // Congo Basin
    if (lat >= -7 && lat <= 6 && lng >= 12 && lng <= 30) return 'jungle';
    // Southeast Asia / Borneo / Sumatra / Papua
    if (lat >= -10 && lat <= 10 && lng >= 96 && lng <= 150) return 'jungle';
    // Chocó Rainforest (Colombia)
    if (lat >= 2 && lat <= 9 && lng >= -78 && lng <= -75) return 'jungle';

    // 3. Urban proximity (Metropolises from CITIES_DATABASE)
    for (const city of CITIES_DATABASE) {
      const dLng = lng - city.lng;
      const dLat = lat - city.lat;
      const distSq = dLng * dLng + dLat * dLat;
      if (distSq < 0.30) {
        return 'urban';
      }
    }

    // 4. Land default: Countryside / Rural woodland
    return 'rural';
  }

  updateEnvironmentBadge(envType) {
    const badgeIcon = document.getElementById('hud-env-icon');
    const badgeLabel = document.getElementById('hud-env-label');
    if (!badgeIcon || !badgeLabel) return;

    const map = {
      urban: { icon: '🏙️', label: 'Urban Ambience' },
      rural: { icon: '🦗', label: 'Rural Ambience' },
      jungle: { icon: '🦜', label: 'Rainforest Wildlife' },
      ocean: { icon: '🌊', label: 'Ocean Swell' }
    };
    const info = map[envType] || map.rural;
    badgeIcon.textContent = info.icon;
    badgeLabel.textContent = info.label;
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
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        toast.textContent = isTouch
          ? 'Zen Mode · Auto-rotating (Tap "Exit Zen Mode" to restore UI)'
          : 'Zen Mode · Auto-rotating (Press H or click Exit to restore UI)';
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 3600);
      }
      this.startZenAutoRotation();
    } else {
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

    // Update persistent target crosshair indicator on the globe
    this.updateListeningCrosshair(lng, lat);

    // Detect environment (urban, rural, jungle, ocean)
    const envType = this.classifyLocationEnvironment(lng, lat);
    this.currentEnv = envType;
    this.updateEnvironmentBadge(envType);

    // City-specific noise pollution ranking & acoustic signature
    const noiseData = getCityNoiseData(locationName, lng, lat);
    this.currentNoiseData = noiseData;
    this.updateNoiseBadge(noiseData);

    if (noiseData) {
      this.sound.setCityAcoustics(noiseData.key, true);
    } else {
      this.sound.setCityAcoustics(null, false);
    }

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
    this.sound.updateAmbience(envType, true);

    // Convective storm lightning strike trigger
    if (rate >= 18.0) {
      this.sound.triggerThunderStrike(1.0);
    }
  }

  updateNoiseBadge(noiseData) {
    const badge = document.getElementById('hud-noise-badge');
    const textEl = document.getElementById('hud-noise-text');
    if (!badge) return;

    if (!noiseData) {
      badge.style.display = 'none';
      return;
    }

    badge.style.display = 'inline-flex';
    badge.className = 'hud-noise-badge';
    if (noiseData.dBA <= 76) {
      badge.classList.add('low');
    } else if (noiseData.dBA <= 89) {
      badge.classList.add('moderate');
    } else {
      badge.classList.add('hazardous');
    }

    if (textEl) {
      textEl.textContent = `🔊 #${noiseData.rank} ${noiseData.name} · ${noiseData.dBA} dB`;
    }
  }

  openNoiseModal(noiseData) {
    if (!noiseData) return;
    const modal = document.getElementById('noise-modal');
    if (!modal) return;

    const badgeEl = document.getElementById('modal-noise-badge');
    const cityEl = document.getElementById('modal-noise-city');
    const dbEl = document.getElementById('modal-noise-db');
    const levelEl = document.getElementById('modal-noise-level');
    const barEl = document.getElementById('modal-noise-bar');
    const whoEl = document.getElementById('modal-noise-who');
    const sourcesEl = document.getElementById('modal-noise-sources');
    const natureEl = document.getElementById('modal-noise-nature');
    const solutionsEl = document.getElementById('modal-noise-solutions');

    if (badgeEl) badgeEl.textContent = `🔊 Noise Rank #${noiseData.rank}`;
    if (cityEl) cityEl.textContent = noiseData.name;
    if (dbEl) dbEl.textContent = noiseData.dBA;

    if (levelEl) {
      levelEl.textContent = noiseData.level;
      levelEl.className = 'meter-level-tag';
      if (noiseData.dBA <= 76) {
        levelEl.classList.add('low');
      } else if (noiseData.dBA <= 89) {
        levelEl.classList.add('moderate');
      } else {
        levelEl.classList.add('hazardous');
      }
    }

    if (barEl) {
      const pct = Math.min(100, Math.max(15, (noiseData.dBA / 125) * 100));
      barEl.style.width = `${pct}%`;
      if (noiseData.dBA <= 76) {
        barEl.style.background = 'linear-gradient(90deg, #10b981, #06b6d4)';
      } else if (noiseData.dBA <= 89) {
        barEl.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
      } else {
        barEl.style.background = 'linear-gradient(90deg, #ef4444, #b91c1c)';
      }
    }

    if (whoEl) {
      const diff = noiseData.dBA - 53;
      whoEl.textContent = diff > 0
        ? `+${diff} dB above WHO Environmental Noise guideline (53 dB Lden)`
        : `${Math.abs(diff)} dB below WHO Environmental Noise guideline (53 dB Lden)`;
    }

    if (sourcesEl) sourcesEl.textContent = noiseData.sources;
    if (natureEl) natureEl.textContent = noiseData.natureImpact;

    if (solutionsEl && Array.isArray(noiseData.solutions)) {
      solutionsEl.innerHTML = noiseData.solutions.map((s) => `<li>${s}</li>`).join('');
    }

    modal.classList.add('open');
  }

  updateAudioForCurrentTarget() {
    if (!this.isListening || !this.listeningTarget) return;
    const zoom = this.map ? this.map.getZoom() : 2.5;
    const rate = this.sampleRateAt(this.listeningTarget.lng, this.listeningTarget.lat);
    this.listeningTarget.rate = rate;
    const rainType = getRainType(rate);

    this.updateHud(rate, rainType, this.listeningTarget.label);
    this.sound.updateRain(rate, zoom, true);
    this.sound.updateAmbience(this.currentEnv, true);

    // Periodic thunder timer for severe convective cells
    if (rate >= 16.0 && this.isListening) {
      if (!this.convectiveThunderTimer) {
        this.convectiveThunderTimer = setInterval(() => {
          if (this.isListening && this.listeningTarget && this.listeningTarget.rate >= 16.0) {
            this.sound.triggerThunderStrike(0.85);
          }
        }, 18000);
      }
    } else if (this.convectiveThunderTimer) {
      clearInterval(this.convectiveThunderTimer);
      this.convectiveThunderTimer = null;
    }
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

  updateListeningCrosshair(lng, lat) {
    if (!this.map) return;

    if (!this.crosshairMarker) {
      const el = document.createElement('div');
      el.className = 'listening-crosshair';
      el.innerHTML = `
        <div class="crosshair-ring"></div>
        <div class="crosshair-center"></div>
        <div class="crosshair-tick tick-top"></div>
        <div class="crosshair-tick tick-bottom"></div>
        <div class="crosshair-tick tick-left"></div>
        <div class="crosshair-tick tick-right"></div>
      `;
      this.crosshairEl = el;
      this.crosshairMarker = new maplibregl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat([lng, lat])
        .addTo(this.map);
    } else {
      this.crosshairMarker.setLngLat([lng, lat]);
    }

    if (this.crosshairEl) {
      const ping = document.createElement('div');
      ping.className = 'crosshair-ping';
      this.crosshairEl.appendChild(ping);
      setTimeout(() => ping.remove(), 1100);
    }
  }

  // ==========================================
  // RAIN TYPE HOVER INFOCARDS WITH FLASHCARD WEBP
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

    const imgHtml = rainType.image ? `
      <div class="infocard-img-wrap">
        <img src="${rainType.image}" alt="${rainType.name}" class="infocard-img" loading="lazy">
        <div class="infocard-img-overlay">
          <span class="infocard-img-caption">${rainType.imageCaption || ''}</span>
        </div>
      </div>
    ` : '';

    this.infocardContainer.innerHTML = `
      <div class="infocard-header">
        <div class="infocard-badge">${rainType.icon} ${rainType.name}</div>
        <div class="infocard-range">${rainType.rateMin} – ${rainType.rateMax} mm/hr</div>
      </div>

      ${imgHtml}

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
  // INTERACTIVE RAIN & GEO QUIZ CONTROLLER
  // ==========================================

  initQuiz() {
    const quizBtn = document.getElementById('btn-quiz');
    const quizPanel = document.getElementById('quiz-panel');
    const closeBtn = document.getElementById('close-quiz-btn');
    const nextBtn = document.getElementById('btn-quiz-next');
    const restartBtn = document.getElementById('btn-quiz-restart');
    const exploreBtn = document.getElementById('btn-quiz-explore');

    if (quizBtn && quizPanel) {
      quizBtn.addEventListener('click', () => {
        const isOpen = quizPanel.classList.toggle('open');
        quizBtn.classList.toggle('active', isOpen);
        if (isOpen) {
          this.renderQuizQuestion(this.quizIndex);
        }
      });
    }

    if (closeBtn && quizPanel) {
      closeBtn.addEventListener('click', () => {
        quizPanel.classList.remove('open');
        quizBtn?.classList.remove('active');
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.quizIndex + 1 < QUIZ_QUESTIONS.length) {
          this.quizIndex++;
          this.renderQuizQuestion(this.quizIndex);
        } else {
          this.showQuizCompletion();
        }
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.quizIndex = 0;
        this.quizScore = 0;
        this.renderQuizQuestion(0);
      });
    }

    if (exploreBtn) {
      exploreBtn.addEventListener('click', () => {
        quizPanel?.classList.remove('open');
        quizBtn?.classList.remove('active');
      });
    }
  }

  renderQuizQuestion(index) {
    this.quizAnswered = false;
    const q = QUIZ_QUESTIONS[index];
    if (!q) return;

    const catEl = document.getElementById('quiz-category');
    const counterEl = document.getElementById('quiz-counter');
    const scoreEl = document.getElementById('quiz-score');
    const questionTextEl = document.getElementById('quiz-question-text');
    const optionsContainer = document.getElementById('quiz-options-container');
    const feedbackCard = document.getElementById('quiz-feedback');
    const completionCard = document.getElementById('quiz-completion');

    if (catEl) catEl.textContent = q.category;
    if (counterEl) counterEl.textContent = `Q ${index + 1}/${QUIZ_QUESTIONS.length}`;
    if (scoreEl) scoreEl.textContent = `Score: ${this.quizScore}`;
    if (questionTextEl) {
      questionTextEl.textContent = q.question;
      questionTextEl.style.display = '';
    }

    if (feedbackCard) feedbackCard.classList.remove('visible');
    if (completionCard) completionCard.style.display = 'none';

    if (optionsContainer) {
      optionsContainer.style.display = '';
      optionsContainer.innerHTML = '';
      const letters = ['A', 'B', 'C', 'D'];

      q.options.forEach((opt, optIdx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.innerHTML = `
          <span class="quiz-opt-letter">${letters[optIdx]}</span>
          <span class="quiz-opt-text">${opt.text}</span>
        `;
        btn.addEventListener('click', () => this.handleQuizAnswer(optIdx, opt, q));
        optionsContainer.appendChild(btn);
      });
    }
  }

  handleQuizAnswer(selectedIdx, opt, q) {
    if (this.quizAnswered) return;
    this.quizAnswered = true;

    const optionsContainer = document.getElementById('quiz-options-container');
    const btns = optionsContainer ? optionsContainer.querySelectorAll('.quiz-option-btn') : [];
    btns.forEach((b) => (b.disabled = true));

    const selectedBtn = btns[selectedIdx];
    const isCorrect = opt.isCorrect;

    if (isCorrect) {
      this.quizScore++;
      if (selectedBtn) selectedBtn.classList.add('correct');
    } else {
      if (selectedBtn) selectedBtn.classList.add('wrong');
      // Highlight the correct answer
      q.options.forEach((o, idx) => {
        if (o.isCorrect && btns[idx]) {
          btns[idx].classList.add('correct');
        }
      });
    }

    const scoreEl = document.getElementById('quiz-score');
    if (scoreEl) scoreEl.textContent = `Score: ${this.quizScore}`;

    // Populate and show feedback card
    const feedbackCard = document.getElementById('quiz-feedback');
    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackVerdict = document.getElementById('feedback-verdict');
    const feedbackDest = document.getElementById('feedback-dest');
    const feedbackExp = document.getElementById('feedback-explanation');
    const feedbackFact = document.getElementById('feedback-funfact');

    if (feedbackIcon) feedbackIcon.textContent = isCorrect ? '✅' : '❌';
    if (feedbackVerdict) feedbackVerdict.textContent = isCorrect ? 'Correct! Flying to location...' : 'Incorrect! Flying to location...';
    if (feedbackDest) feedbackDest.textContent = opt.locationName || opt.text;
    if (feedbackExp) feedbackExp.textContent = q.explanation;
    if (feedbackFact) feedbackFact.innerHTML = `💡 <strong>Atmospheric Fact:</strong> ${q.funFact}`;

    if (feedbackCard) feedbackCard.classList.add('visible');

    // Fly camera to the answered location and begin playing live rain acoustics
    this.lockToLocation(opt.lng, opt.lat, opt.zoom || 6.5, opt.locationName);
  }

  showQuizCompletion() {
    const questionTextEl = document.getElementById('quiz-question-text');
    const optionsContainer = document.getElementById('quiz-options-container');
    const feedbackCard = document.getElementById('quiz-feedback');
    const completionCard = document.getElementById('quiz-completion');
    const completionSummary = document.getElementById('completion-summary');
    const completionRank = document.getElementById('completion-rank');
    const completionDesc = document.getElementById('completion-desc');

    if (questionTextEl) questionTextEl.style.display = 'none';
    if (optionsContainer) optionsContainer.style.display = 'none';
    if (feedbackCard) feedbackCard.classList.remove('visible');

    const total = QUIZ_QUESTIONS.length;
    const pct = Math.round((this.quizScore / total) * 100);

    if (completionSummary) {
      completionSummary.textContent = `You scored ${this.quizScore} out of ${total} (${pct}%)`;
    }

    if (completionRank && completionDesc) {
      if (this.quizScore === total) {
        completionRank.textContent = '🏆 Master Meteorologist';
        completionDesc.textContent = 'Exceptional understanding! You have mastered Earth\'s extreme precipitation zones, monsoon mechanics, and satellite meteorology.';
      } else if (this.quizScore >= 4) {
        completionRank.textContent = '⚡ Atmospheric Explorer';
        completionDesc.textContent = 'Great intuition for global climates and orographic rainfall patterns across continents!';
      } else if (this.quizScore >= 2) {
        completionRank.textContent = '🌧️ Storm Chaser Apprentice';
        completionDesc.textContent = 'Good start! Explore more regions with Terraphone to discover how mountains and oceans shape Earth\'s storms.';
      } else {
        completionRank.textContent = '🌤️ Weather Enthusiast';
        completionDesc.textContent = 'Keep exploring! Listen to the rain in Cherrapunji, Quibdó, and Bergen to feel the difference.';
      }
    }

    if (completionCard) completionCard.style.display = 'flex';
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

    if (this.isRasterReady && this.pixelData) {
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
      targetLng = (bestPixel.px / 512) * 360 - 180;
      const mercN = (0.5 - bestPixel.py / 512) * (2 * Math.PI);
      const latRad = 2 * (Math.atan(Math.exp(mercN)) - Math.PI / 4);
      targetLat = (latRad * 180) / Math.PI;

      const latStr = `${Math.abs(targetLat).toFixed(1)}°${targetLat >= 0 ? 'N' : 'S'}`;
      const lngStr = `${Math.abs(targetLng).toFixed(1)}°${targetLng >= 0 ? 'E' : 'W'}`;
      locationLabel = `Storm Epicenter (${maxRate.toFixed(1)} mm/hr · ${latStr}, ${lngStr})`;
    } else {
      let highestObserved = 0;
      let topSpot = PRESET_HOTSPOTS[0];

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

    const btn = document.getElementById('btn-heaviest');
    if (btn) {
      btn.classList.add('active');
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<span>⚡ Epicenter (${maxRate.toFixed(1)} mm/hr)</span>`;
      setTimeout(() => {
        btn.classList.remove('active');
        btn.innerHTML = originalHtml;
      }, 3500);
    }

    if (this.isZenMode) {
      this.handleZenUserActivity();
    }

    this.map.flyTo({
      center: [targetLng, targetLat],
      zoom: 5.2,
      pitch: 0,
      bearing: 0,
      speed: 1.15,
      curve: 1.35,
      essential: true
    });

    setTimeout(() => {
      this.sound.startAudio();
      this.setListeningPoint(targetLng, targetLat, locationLabel, true);
    }, 400);
  }

  // ==========================================
  // AUDIO MIXER & 4 SLIDERS
  // ==========================================

  initAudioMixer() {
    const rainSlider = document.getElementById('slider-rain-vol');
    const thunderSlider = document.getElementById('slider-thunder-vol');
    const ambienceSlider = document.getElementById('slider-ambience-vol');
    const lofiSlider = document.getElementById('slider-lofi-vol');

    if (rainSlider) {
      rainSlider.addEventListener('input', (e) => {
        this.sound.setRainVolume(parseFloat(e.target.value));
      });
    }

    if (thunderSlider) {
      thunderSlider.addEventListener('input', (e) => {
        this.sound.setThunderVolume(parseFloat(e.target.value));
      });
    }

    if (ambienceSlider) {
      ambienceSlider.addEventListener('input', (e) => {
        this.sound.setAmbienceVolume(parseFloat(e.target.value));
      });
    }

    if (lofiSlider) {
      lofiSlider.addEventListener('input', (e) => {
        this.sound.setLoFiVolume(parseFloat(e.target.value));
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

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn('Exit fullscreen failed:', err);
        });
      }
    }
  }

  updateFullscreenVisual(isFs) {
    const expandIcon = document.getElementById('fullscreen-icon-expand');
    const compressIcon = document.getElementById('fullscreen-icon-compress');
    const btnFs = document.getElementById('btn-fullscreen');
    if (expandIcon && compressIcon) {
      expandIcon.style.display = isFs ? 'none' : 'block';
      compressIcon.style.display = isFs ? 'block' : 'none';
    }
    if (btnFs) {
      btnFs.classList.toggle('active', isFs);
      btnFs.setAttribute('title', isFs ? 'Exit Fullscreen' : 'Toggle Fullscreen (F11)');
    }
  }

  // ==========================================
  // CONTROLS & MODALS
  // ==========================================

  initControls() {
    document.getElementById('btn-heaviest')?.addEventListener('click', () => this.flyToHeaviestRainArea());
    document.getElementById('btn-theme')?.addEventListener('click', () => this.cycleTheme());
    document.getElementById('btn-lofi')?.addEventListener('click', () => this.toggleLoFi());
    document.getElementById('btn-listen')?.addEventListener('click', () => this.togglePlayback());
    document.getElementById('btn-hide-ui')?.addEventListener('click', () => this.toggleUiVisibility());
    document.getElementById('btn-fullscreen')?.addEventListener('click', () => this.toggleFullscreen());
    document.getElementById('btn-exit-zen')?.addEventListener('click', () => this.toggleUiVisibility());

    document.addEventListener('fullscreenchange', () => {
      this.updateFullscreenVisual(!!document.fullscreenElement);
    });

    // 3D Terrain Relief Toggle
    document.getElementById('btn-relief-toggle')?.addEventListener('click', () => {
      this.toggleTerrainRelief();
    });

    // Info Modal
    const infoModal = document.getElementById('info-modal');
    document.getElementById('btn-info')?.addEventListener('click', () => {
      infoModal?.classList.add('open');
    });
    document.getElementById('close-info-modal')?.addEventListener('click', () => {
      infoModal?.classList.remove('open');
    });
    infoModal?.addEventListener('click', (e) => {
      if (e.target === infoModal) infoModal.classList.remove('open');
    });

    // Noise Pollution Modal
    const noiseModal = document.getElementById('noise-modal');
    document.getElementById('hud-noise-badge')?.addEventListener('click', () => {
      if (this.currentNoiseData) {
        this.openNoiseModal(this.currentNoiseData);
      }
    });
    document.getElementById('close-noise-modal')?.addEventListener('click', () => {
      noiseModal?.classList.remove('open');
    });
    noiseModal?.addEventListener('click', (e) => {
      if (e.target === noiseModal) noiseModal.classList.remove('open');
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

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
  });
} else {
  window.app = new App();
}
