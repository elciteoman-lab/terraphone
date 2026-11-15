/**
 * Terraphone — Earth Arcade: Six Specialized Environmental Games
 * NASA Space Apps Challenge
 * 
 * 03. HEAT ESCAPE (NASA ECOSTRESS Land Surface Temperature)
 * 04. WATER KEEPER (NASA SMAP Soil Moisture)
 * 05. CLOUD COURIER (NASA OMI SO2/NO2 & GPM Atmospheric Lift)
 * 06. OZONE DRIFT (NASA Ozone Watch / Aura OMI Stratospheric Samples)
 * 07. CORAL CURRENT (NOAA Coral Reef Watch Bleaching Stress & Thermal Upwellings)
 * 08. LAST FOREST (NASA/USGS Landsat Forest Canopy & Aerodynamic Glider)
 */

import { arcadeTokens } from './arcade-tokens.js';

// ==========================================
// 03. HEAT ESCAPE (NASA ECOSTRESS LST)
// ==========================================
export class HeatEscapeGame {
  constructor(canvas, audioCtx, onExit) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audioCtx = audioCtx;
    this.onExit = onExit;

    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.rafId = null;
    this.lastTime = 0;

    // Player Scooter
    this.player = {
      x: canvas.width / 2,
      y: canvas.height * 0.75,
      speed: 260,
      hydration: 100, // 0 - 100%
      distance: 0,
      targetDistance: 1000 // Reach Central Park at 1,000m
    };

    this.keys = { left: false, right: false, up: false, down: false };
    this.cityAvenues = [];
    this.coolingOases = [];
    this.particles = [];

    this.initCity();
    this.initInput();
  }

  initCity() {
    this.cityAvenues = [];
    this.coolingOases = [];

    // Generate 60 city blocks stretching 2,000 meters forward
    const numLanes = 5;
    const laneWidth = this.canvas.width / numLanes;

    for (let i = 0; i < 70; i++) {
      const lane = i % numLanes;
      const isPark = (i % 6 === 2) || (i % 8 === 5);
      const isMistingStation = (i % 11 === 3);

      // NASA ECOSTRESS LST: Asphalt vs Canopy vs Mist
      let tempLST = isPark ? 24.2 : (isMistingStation ? 21.0 : (46.5 + (Math.sin(i * 1.7) * 5.5)));

      const block = {
        x: lane * laneWidth + 12,
        y: -i * 160,
        w: laneWidth - 24,
        h: 130,
        isPark,
        isMistingStation,
        tempLST,
        label: isPark ? 'Urban Park Shade' : (isMistingStation ? 'Hydration Oasis' : 'Asphalt Heat Island')
      };
      this.cityAvenues.push(block);

      if (isPark || isMistingStation) {
        this.coolingOases.push({
          x: block.x + block.w / 2,
          y: block.y + block.h / 2,
          radius: 36,
          collected: false
        });
      }
    }
  }

  initInput() {
    this.onKeyDown = (e) => {
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.keys.left = true;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.keys.right = true;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.keys.up = true;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.keys.down = true;
      if (e.key === 'r' || e.key === 'R') {
        if (this.isGameOver || this.isVictory) this.restart();
      }
      if (e.key === 'Escape') { this.stop(); this.onExit?.(); }
    };
    this.onKeyUp = (e) => {
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.keys.left = false;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.keys.right = false;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.keys.up = false;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.keys.down = false;
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  restart() {
    this.isGameOver = false;
    this.isVictory = false;
    this.player.hydration = 100;
    this.player.distance = 0;
    this.player.x = this.canvas.width / 2;
    this.player.y = this.canvas.height * 0.75;
    this.initCity();
  }

  update(dt) {
    if (this.isGameOver || this.isVictory) return;

    let dx = 0, dy = 0;
    if (this.keys.left) dx -= 1;
    if (this.keys.right) dx += 1;
    if (this.keys.up) dy -= 1;
    if (this.keys.down) dy += 1;

    // Scooter movement
    this.player.x += dx * this.player.speed * dt;
    this.player.y += dy * (this.player.speed * 0.7) * dt;

    // Boundaries
    this.player.x = Math.max(30, Math.min(this.canvas.width - 30, this.player.x));
    this.player.y = Math.max(this.canvas.height * 0.3, Math.min(this.canvas.height - 40, this.player.y));

    // Continuous forward progress
    const forwardSpeed = this.keys.up ? 65 : 42;
    this.player.distance += dt * forwardSpeed;

    // Scroll city avenues downward relative to progress
    const scrollY = this.player.distance * 14;

    // Check current temperature zone player is standing in
    let inCoolZone = false;
    let currentTemp = 48.0;

    this.cityAvenues.forEach(b => {
      const renderY = b.y + scrollY;
      if (this.player.x >= b.x && this.player.x <= b.x + b.w &&
          this.player.y >= renderY && this.player.y <= renderY + b.h) {
        currentTemp = b.tempLST;
        if (b.isPark || b.isMistingStation) inCoolZone = true;
      }
    });

    // Hydration physics
    if (inCoolZone) {
      this.player.hydration = Math.min(100, this.player.hydration + 24 * dt);
    } else {
      // Hot asphalt heat island drains hydration
      const heatIntensity = Math.max(0.6, (currentTemp - 32) / 16);
      this.player.hydration = Math.max(0, this.player.hydration - 14 * heatIntensity * dt);
    }

    // Check Game Over condition
    if (this.player.hydration <= 0) {
      this.isGameOver = true;
      return;
    }

    // Check Victory condition (reached 1,000m Central Park Botanical Oasis)
    if (this.player.distance >= this.player.targetDistance) {
      this.isVictory = true;
      arcadeTokens.addTokens(20, 'Escaped Urban Heat Island');
      arcadeTokens.recordHighScore('heat_escape', Math.floor(this.player.distance), 'meters');
    }

    arcadeTokens.recordHighScore('heat_escape', Math.floor(this.player.distance), 'meters');
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const scrollY = this.player.distance * 14;

    // Base background: Hot shimmering asphalt
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, w, h);

    // City lane markings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    for (let l = 1; l < 5; l++) {
      const lx = (w / 5) * l;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, h);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Render City Blocks / ECOSTRESS Heat Zones
    this.cityAvenues.forEach(b => {
      const by = b.y + scrollY;
      if (by < -150 || by > h + 150) return;

      // Color variation driven by NASA ECOSTRESS Surface Temp
      if (b.isMistingStation) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.strokeStyle = '#38bdf8';
      } else if (b.isPark) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.24)';
        ctx.strokeStyle = '#10b981';
      } else if (b.tempLST > 48) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)'; // Extreme Heat Island
        ctx.strokeStyle = '#ef4444';
      } else {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.18)'; // Moderate Urban Heat
        ctx.strokeStyle = '#f59e0b';
      }

      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(b.x, by, b.w, b.h, 10);
      ctx.fill();
      ctx.stroke();

      // Zone Label & LST Reading
      ctx.fillStyle = b.isPark ? '#34d399' : (b.isMistingStation ? '#38bdf8' : '#fb923c');
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(`${b.isMistingStation ? '💧' : (b.isPark ? '🌳' : '🔥')} ${b.tempLST.toFixed(1)}°C LST`, b.x + 10, by + 22);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px system-ui';
      ctx.fillText(b.label, b.x + 10, by + 38);
    });

    // Player Scooter
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    // Hydration aura
    const hydraColor = this.player.hydration > 50 ? '#38bdf8' : (this.player.hydration > 25 ? '#f59e0b' : '#ef4444');
    ctx.shadowColor = hydraColor;
    ctx.shadowBlur = 16;
    ctx.fillStyle = hydraColor;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // Scooter Body
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-4, -14, 8, 28);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-2, -18, 4, 8); // Headlight
    ctx.restore();

    // Bottom Telemetry HUD (Non-blocking)
    const hudY = h - 96;
    ctx.fillStyle = 'rgba(10, 15, 26, 0.9)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(24, hudY, 340, 72, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('🛰️ NASA ECOSTRESS LAND SURFACE TEMPERATURE', 38, hudY + 22);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13.5px system-ui';
    ctx.fillText(`Goal: Reach Central Botanical Oasis (${Math.floor(this.player.distance)} / ${this.player.targetDistance}m)`, 38, hudY + 43);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10.5px system-ui';
    ctx.fillText('Chain shaded parks & mist stations to survive heat fatigue', 38, hudY + 60);

    // Right: Hydration Bar
    ctx.beginPath();
    ctx.roundRect(w - 220, hudY, 196, 72, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = hydraColor;
    ctx.font = '800 18px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`💧 ${Math.round(this.player.hydration)}%`, w - 42, hudY + 34);

    // Hydration progress bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.roundRect(w - 200, hudY + 44, 158, 10, 5);
    ctx.fill();
    ctx.fillStyle = hydraColor;
    ctx.roundRect(w - 200, hudY + 44, 158 * (this.player.hydration / 100), 10, 5);
    ctx.fill();

    // Game Over Overlay
    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ef4444';
      ctx.font = '800 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🔥 HEAT STROKE FATIGUE', w / 2, h / 2 - 30);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 14px system-ui';
      ctx.fillText(`Hydration depleted at ${Math.floor(this.player.distance)} meters under extreme pavement heat.`, w / 2, h / 2 + 5);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 13px system-ui';
      ctx.fillText('Press R to Try Again', w / 2, h / 2 + 45);
    }

    // Victory Overlay
    if (this.isVictory) {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#10b981';
      ctx.font = '800 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🌳 CENTRAL PARK OASIS REACHED! 🌳', w / 2, h / 2 - 35);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 14px system-ui';
      ctx.fillText('You navigated 1,000 meters of urban heat islands into cool canopy shade.', w / 2, h / 2);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText('🪙 +20 Zen Tokens Awarded', w / 2, h / 2 + 35);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px system-ui';
      ctx.fillText('Press Esc or Exit Game to return to the Arcade Hub', w / 2, h / 2 + 68);
    }
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    const loop = (t) => {
      if (!this.isRunning) return;
      if (!this.isPaused) {
        this.update(Math.min(0.05, (t - this.lastTime) / 1000));
        this.render();
      }
      this.lastTime = t;
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }
  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; this.lastTime = performance.now(); }
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}

// ==========================================
// 04. WATER KEEPER (NASA SMAP Soil Moisture)
// ==========================================
export class WaterKeeperGame {
  constructor(canvas, audioCtx, onExit) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audioCtx = audioCtx;
    this.onExit = onExit;

    this.isRunning = false;
    this.isPaused = false;
    this.isVictory = false;
    this.rafId = null;
    this.lastTime = 0;

    // Droplet physics
    this.drop = {
      x: 140,
      y: 200,
      vy: 0,
      size: 16,
      grounded: false,
      squash: 1
    };

    this.scrollX = 0;
    this.patchesRestored = 0;
    this.targetPatches = 20;
    this.dropletsCollected = 0;
    this.particles = [];

    this.initInput();
  }

  // Pure procedural height & moisture function (guarantees infinite rendering without missing segments)
  getTerrainAt(worldX) {
    const baseH = this.canvas.height ? this.canvas.height * 0.65 : 450;
    const wave1 = Math.sin(worldX * 0.0035) * 65;
    const wave2 = Math.sin(worldX * 0.009) * 25;
    const y = baseH + wave1 + wave2;

    // NASA SMAP volumetric soil moisture (0.05 to 0.42 cm3/cm3)
    const moistNoise = Math.sin(worldX * 0.002) * 0.5 + 0.5;
    const moisture = 0.08 + moistNoise * 0.32;
    return { y, moisture };
  }

  initInput() {
    this.onKeyDown = (e) => {
      if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && this.drop.grounded) {
        this.drop.vy = -460;
        this.drop.grounded = false;
        this.drop.squash = 1.35;
      }
      if (e.key === 'Escape') { this.stop(); this.onExit?.(); }
    };
    window.addEventListener('keydown', this.onKeyDown);
  }

  update(dt) {
    if (this.isVictory) return;

    // Horizontal speed
    this.scrollX += 160 * dt;

    // Gravity & Jump Physics
    this.drop.vy += 980 * dt;
    this.drop.y += this.drop.vy * dt;

    // Floor collision against continuous terrain
    const playerWorldX = this.scrollX + this.drop.x;
    const ground = this.getTerrainAt(playerWorldX);

    if (this.drop.y >= ground.y - this.drop.size) {
      this.drop.y = ground.y - this.drop.size;
      this.drop.vy = 0;
      this.drop.grounded = true;
      this.drop.squash = 0.85;

      // Restoring moisture
      if (ground.moisture < 0.22 && Math.random() < 0.08) {
        this.patchesRestored += 1;
        arcadeTokens.addTokens(1, 'Moisture Restored to Arid Soil');
        if (this.patchesRestored >= this.targetPatches && !this.isVictory) {
          this.isVictory = true;
          arcadeTokens.addTokens(20, 'Watershed Soil Restored');
        }
      }
    } else {
      this.drop.grounded = false;
      this.drop.squash += (1.0 - this.drop.squash) * 0.15;
    }

    arcadeTokens.recordHighScore('water_keeper', this.patchesRestored, 'patches');
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#020617');
    sky.addColorStop(1, '#0f172a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Continuous Terrain Rendering across screen width
    ctx.beginPath();
    ctx.moveTo(0, h);

    const step = 16;
    for (let screenX = 0; screenX <= w + step; screenX += step) {
      const worldX = this.scrollX + screenX;
      const t = this.getTerrainAt(worldX);
      ctx.lineTo(screenX, t.y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();

    // Soil gradient based on SMAP moisture
    const groundMoist = this.getTerrainAt(this.scrollX + this.drop.x).moisture;
    const soilGrad = ctx.createLinearGradient(0, h * 0.5, 0, h);
    soilGrad.addColorStop(0, groundMoist > 0.25 ? '#064e3b' : '#78350f');
    soilGrad.addColorStop(1, '#1c1917');
    ctx.fillStyle = soilGrad;
    ctx.fill();

    // Terrain Surface Lip
    ctx.strokeStyle = groundMoist > 0.25 ? '#10b981' : '#b45309';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Water Droplet Player
    ctx.save();
    ctx.translate(this.drop.x, this.drop.y);
    ctx.scale(1 / this.drop.squash, this.drop.squash);

    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, this.drop.size, 0, Math.PI * 2);
    ctx.fill();

    // Droplet highlight shine
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(-4, -5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bottom Telemetry Card
    const hudY = h - 96;
    ctx.fillStyle = 'rgba(10, 15, 26, 0.9)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(24, hudY, 340, 72, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('🛰️ NASA SMAP SOIL MOISTURE RADIOMETER', 38, hudY + 22);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13.5px system-ui';
    ctx.fillText(`Volumetric Moisture: ${(groundMoist * 100).toFixed(1)}% (${groundMoist > 0.25 ? 'Moist Silt' : 'Arid Loam'})`, 38, hudY + 43);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10.5px system-ui';
    ctx.fillText('Press Space / Up to leap over parched clay gullies', 38, hudY + 60);

    // Right: Restored Patches Progress
    ctx.beginPath();
    ctx.roundRect(w - 220, hudY, 196, 72, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 15px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`🌱 Patches: ${this.patchesRestored} / ${this.targetPatches}`, w - 42, hudY + 34);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 11.5px system-ui';
    ctx.fillText(`Distance: ${Math.floor(this.scrollX / 10)}m`, w - 42, hudY + 56);

    // Victory Screen
    if (this.isVictory) {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#10b981';
      ctx.font = '800 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('💧 ARID WATERSHED RESTORED! 💧', w / 2, h / 2 - 35);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 14px system-ui';
      ctx.fillText('You nourished 20 arid soil tracts back into fertile, blooming meadows.', w / 2, h / 2);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText('🪙 +20 Zen Tokens Awarded', w / 2, h / 2 + 35);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px system-ui';
      ctx.fillText('Press Esc or Exit Game to return to the Arcade Hub', w / 2, h / 2 + 68);
    }
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    const loop = (t) => {
      if (!this.isRunning) return;
      if (!this.isPaused) {
        this.update(Math.min(0.05, (t - this.lastTime) / 1000));
        this.render();
      }
      this.lastTime = t;
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }
  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; this.lastTime = performance.now(); }
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.onKeyDown);
  }
}

// ==========================================
// 05. CLOUD COURIER (NASA OMI & GPM)
// ==========================================
export class CloudCourierGame {
  constructor(canvas, audioCtx, onExit) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audioCtx = audioCtx;
    this.onExit = onExit;

    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.rafId = null;

    // Flappy Bird-inspired atmospheric cloud physics
    this.cloud = {
      x: 160,
      y: canvas.height * 0.45,
      vy: 0,
      gravity: 580,
      liftStrength: -260,
      purity: 100, // 0 - 100%
      distance: 0,
      targetGates: 15,
      gatesCleared: 0
    };

    this.smokestackGates = [];
    this.vaporDrops = [];
    this.initAtmosphere();
    this.initInput();
  }

  initAtmosphere() {
    this.smokestackGates = [];
    this.vaporDrops = [];
    const gateGap = 200; // Vertical flight corridor

    for (let i = 0; i < 35; i++) {
      const topHeight = 60 + Math.random() * (this.canvas.height - gateGap - 140);
      this.smokestackGates.push({
        x: 600 + i * 340,
        w: 58,
        topH: topHeight,
        bottomY: topHeight + gateGap,
        passed: false,
        pollutant: i % 2 === 0 ? 'SO₂ (Sulfur Dioxide)' : 'NO₂ (Nitrogen Dioxide)'
      });

      this.vaporDrops.push({
        x: 600 + i * 340 + 170,
        y: topHeight + gateGap / 2 + (Math.random() * 40 - 20),
        collected: false
      });
    }
  }

  initInput() {
    this.flap = () => {
      if (this.isGameOver || this.isVictory) {
        this.restart();
        return;
      }
      this.cloud.vy = this.cloud.liftStrength;
    };

    this.onKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.flap();
      }
      if (e.key === 'r' || e.key === 'R') {
        if (this.isGameOver || this.isVictory) this.restart();
      }
      if (e.key === 'Escape') { this.stop(); this.onExit?.(); }
    };

    this.onPointerDown = () => this.flap();

    window.addEventListener('keydown', this.onKeyDown);
    this.canvas?.addEventListener?.('pointerdown', this.onPointerDown);
  }

  restart() {
    this.isGameOver = false;
    this.isVictory = false;
    this.cloud.y = this.canvas.height * 0.45;
    this.cloud.vy = 0;
    this.cloud.purity = 100;
    this.cloud.gatesCleared = 0;
    this.cloud.distance = 0;
    this.initAtmosphere();
  }

  update(dt) {
    if (this.isGameOver || this.isVictory) return;

    // Aerodynamic gravity and lift
    this.cloud.vy += this.cloud.gravity * dt;
    this.cloud.y += this.cloud.vy * dt;
    this.cloud.distance += dt * 40;

    // Screen ceiling & floor collision
    if (this.cloud.y < 20 || this.cloud.y > this.canvas.height - 30) {
      this.isGameOver = true;
      return;
    }

    // Scroll Smokestack Obstacles
    const scrollSpeed = 160;
    this.smokestackGates.forEach(g => {
      g.x -= scrollSpeed * dt;

      // Passing gate
      if (!g.passed && g.x + g.w < this.cloud.x) {
        g.passed = true;
        this.cloud.gatesCleared += 1;
        arcadeTokens.addTokens(1, 'Navigated Clean Air Channel');

        if (this.cloud.gatesCleared >= this.cloud.targetGates && !this.isVictory) {
          this.isVictory = true;
          arcadeTokens.addTokens(20, 'Delivered Pure Rain to Valley');
        }
      }

      // Collision with pollution plumes / smokestack towers
      if (this.cloud.x + 18 >= g.x && this.cloud.x - 18 <= g.x + g.w) {
        if (this.cloud.y - 14 <= g.topH || this.cloud.y + 14 >= g.bottomY) {
          this.cloud.purity = Math.max(0, this.cloud.purity - 55 * dt);
          if (this.cloud.purity <= 0) {
            this.isGameOver = true;
          }
        }
      }
    });

    // Collect clean vapor motes
    this.vaporDrops.forEach(v => {
      v.x -= scrollSpeed * dt;
      if (!v.collected && Math.hypot(this.cloud.x - v.x, this.cloud.y - v.y) < 32) {
        v.collected = true;
        this.cloud.purity = Math.min(100, this.cloud.purity + 18);
      }
    });

    arcadeTokens.recordHighScore('cloud_courier', this.cloud.gatesCleared, 'gates');
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Atmospheric Dusk Sky
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#090d16');
    sky.addColorStop(0.5, '#1e1b4b');
    sky.addColorStop(1, '#0f172a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Smokestack pollution gates (NASA OMI plumes)
    this.smokestackGates.forEach(g => {
      // Top smokestack & plume
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(g.x, 0, g.w, g.topH, [0, 0, 8, 8]);
      ctx.fill();
      ctx.stroke();

      // Bottom smokestack & plume
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.beginPath();
      ctx.roundRect(g.x, g.bottomY, g.w, h - g.bottomY, [8, 8, 0, 0]);
      ctx.fill();
      ctx.stroke();

      // Pollutant label
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 9.5px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(g.pollutant, g.x + g.w / 2, g.topH - 12);
    });

    // Pure Vapor Pickups
    this.vaporDrops.forEach(v => {
      if (v.collected) return;
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(v.x, v.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Cloud Player
    ctx.save();
    ctx.translate(this.cloud.x, this.cloud.y);
    const tilt = Math.max(-0.4, Math.min(0.4, this.cloud.vy * 0.0015));
    ctx.rotate(tilt);

    ctx.fillStyle = this.cloud.purity > 45 ? '#f8fafc' : '#94a3b8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.arc(14, -4, 14, 0, Math.PI * 2);
    ctx.arc(-14, 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Bottom Telemetry Card
    const hudY = h - 96;
    ctx.fillStyle = 'rgba(10, 15, 26, 0.9)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(24, hudY, 340, 72, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('🛰️ NASA OMI ATMOSPHERIC GAS SENSING', 38, hudY + 22);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13.5px system-ui';
    ctx.fillText(`Deliver Pure Rain: ${this.cloud.gatesCleared} / ${this.cloud.targetGates} Gates Cleared`, 38, hudY + 43);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10.5px system-ui';
    ctx.fillText('Tap Space / Up to flap and glide through clean air channels', 38, hudY + 60);

    // Right: Cloud Purity Bar
    ctx.beginPath();
    ctx.roundRect(w - 220, hudY, 196, 72, 14);
    ctx.fill();
    ctx.stroke();

    const purityColor = this.cloud.purity > 50 ? '#38bdf8' : (this.cloud.purity > 25 ? '#f59e0b' : '#ef4444');
    ctx.fillStyle = purityColor;
    ctx.font = '800 18px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`☁️ ${Math.round(this.cloud.purity)}%`, w - 42, hudY + 34);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.roundRect(w - 200, hudY + 44, 158, 10, 5);
    ctx.fill();
    ctx.fillStyle = purityColor;
    ctx.roundRect(w - 200, hudY + 44, 158 * (this.cloud.purity / 100), 10, 5);
    ctx.fill();

    // Game Over Overlay
    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ef4444';
      ctx.font = '800 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('☁️ CLOUD POLLUTED BY SO₂/NO₂', w / 2, h / 2 - 30);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 14px system-ui';
      ctx.fillText(`Moisture purity collapsed into acid precipitation after ${this.cloud.gatesCleared} gates.`, w / 2, h / 2 + 5);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 13px system-ui';
      ctx.fillText('Press Space or R to Try Again', w / 2, h / 2 + 45);
    }

    // Victory Overlay
    if (this.isVictory) {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#10b981';
      ctx.font = '800 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🌧️ PURE RAIN DELIVERED! 🌧️', w / 2, h / 2 - 35);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 14px system-ui';
      ctx.fillText('You navigated through 15 smokestack corridors to shower clean rain on the valley.', w / 2, h / 2);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText('🪙 +20 Zen Tokens Awarded', w / 2, h / 2 + 35);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px system-ui';
      ctx.fillText('Press Esc or Exit Game to return to the Arcade Hub', w / 2, h / 2 + 68);
    }
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    const loop = () => {
      if (!this.isRunning) return;
      if (!this.isPaused) {
        this.update(0.016);
        this.render();
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }
  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; }
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.onKeyDown);
    this.canvas?.removeEventListener?.('pointerdown', this.onPointerDown);
  }
}

// ==========================================
// 06. OZONE DRIFT (NASA Ozone Watch / Aura OMI)
// ==========================================
export class OzoneDriftGame {
  constructor(canvas, audioCtx, onExit) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onExit = onExit;

    this.isRunning = false;
    this.isPaused = false;
    this.isVictory = false;
    this.rafId = null;

    this.probe = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      angle: 0,
      speed: 130
    };

    this.keys = { left: false, right: false, thrust: false };
    this.gasCanisters = [];
    this.canistersCollected = 0;
    this.targetCanisters = 15;

    this.initSky();
    this.initInput();
  }

  initSky() {
    this.gasCanisters = [];
    for (let i = 0; i < 28; i++) {
      this.gasCanisters.push({
        x: 40 + Math.random() * (this.canvas.width - 80),
        y: 40 + Math.random() * (this.canvas.height - 180),
        dobsonUnits: Math.floor(220 + Math.random() * 120),
        collected: false
      });
    }
  }

  initInput() {
    this.onKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.thrust = true;
      if (e.key === 'Escape') { this.stop(); this.onExit?.(); }
    };
    this.onKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.thrust = false;
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  update(dt) {
    if (this.isVictory) return;

    if (this.keys.left) this.probe.angle -= 2.8 * dt;
    if (this.keys.right) this.probe.angle += 2.8 * dt;

    if (this.keys.thrust) {
      this.probe.x += Math.cos(this.probe.angle) * this.probe.speed * dt;
      this.probe.y += Math.sin(this.probe.angle) * this.probe.speed * dt;
    } else {
      // Natural gentle orbital drift
      this.probe.x += Math.cos(this.probe.angle) * 35 * dt;
      this.probe.y += Math.sin(this.probe.angle) * 35 * dt;
    }

    // Screen wrapping in stratospheric orbit
    if (this.probe.x < 0) this.probe.x = this.canvas.width;
    if (this.probe.x > this.canvas.width) this.probe.x = 0;
    if (this.probe.y < 0) this.probe.y = this.canvas.height - 120;
    if (this.probe.y > this.canvas.height - 120) this.probe.y = 0;

    // Collect Canisters
    this.gasCanisters.forEach(c => {
      if (!c.collected && Math.hypot(this.probe.x - c.x, this.probe.y - c.y) < 24) {
        c.collected = true;
        this.canistersCollected += 1;
        arcadeTokens.addTokens(2, 'Stratospheric Ozone Sample');

        if (this.canistersCollected >= this.targetCanisters && !this.isVictory) {
          this.isVictory = true;
          arcadeTokens.addTokens(25, 'NASA Aura Research Mission Complete');
        }
      }
    });

    arcadeTokens.recordHighScore('ozone_drift', this.canistersCollected, 'canisters');
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Deep stratosphere space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#2e1065');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Ozone Canisters (Dobson Units)
    this.gasCanisters.forEach(c => {
      if (c.collected) return;
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(c.x - 7, c.y - 12, 14, 24, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#f8fafc';
      ctx.font = '9px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${c.dobsonUnits} DU`, c.x, c.y + 24);
    });

    // Research Probe Vessel
    ctx.save();
    ctx.translate(this.probe.x, this.probe.y);
    ctx.rotate(this.probe.angle);

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();

    // Solar panels
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-8, -18, 5, 10);
    ctx.fillRect(-8, 8, 5, 10);
    ctx.restore();

    // Bottom Telemetry HUD
    const hudY = h - 96;
    ctx.fillStyle = 'rgba(10, 15, 26, 0.9)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(24, hudY, 340, 72, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('🛰️ NASA OZONE WATCH & AURA SATELLITE', 38, hudY + 22);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13.5px system-ui';
    ctx.fillText(`Mission: Collect Stratospheric Samples (${this.canistersCollected} / ${this.targetCanisters})`, 38, hudY + 43);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10.5px system-ui';
    ctx.fillText('Steer: A/D or Arrows · Thrust: W or Up', 38, hudY + 60);

    // Right: Dobson Units Gauge
    ctx.beginPath();
    ctx.roundRect(w - 220, hudY, 196, 72, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 16px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`🧪 ${this.canistersCollected} / ${this.targetCanisters} Canisters`, w - 42, hudY + 34);

    ctx.fillStyle = '#34d399';
    ctx.font = '600 11.5px system-ui';
    ctx.fillText('Target: Antarctic Recovery', w - 42, hudY + 56);

    // Victory Screen
    if (this.isVictory) {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#a855f7';
      ctx.font = '800 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🛰️ NASA AURA MISSION COMPLETE! 🛰️', w / 2, h / 2 - 35);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 14px system-ui';
      ctx.fillText('15 stratospheric ozone samples gathered! The Montreal Protocol recovery verified.', w / 2, h / 2);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText('🪙 +25 Zen Tokens Awarded', w / 2, h / 2 + 35);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px system-ui';
      ctx.fillText('Press Esc or Exit Game to return to the Arcade Hub', w / 2, h / 2 + 68);
    }
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    const loop = () => {
      if (!this.isRunning) return;
      if (!this.isPaused) {
        this.update(0.016);
        this.render();
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }
  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; }
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}

// ==========================================
// 07. CORAL CURRENT (NOAA Coral Reef Watch)
// ==========================================
export class CoralCurrentGame {
  constructor(canvas, audioCtx, onExit) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onExit = onExit;

    this.isRunning = false;
    this.isPaused = false;
    this.isVictory = false;
    this.rafId = null;

    // Sea Turtle Physics
    this.turtle = {
      x: 140,
      y: canvas.height * 0.45,
      vy: 0,
      swimStrength: -180,
      gravity: 240,
      flipperAngle: 0
    };

    this.distance = 0;
    this.targetDistance = 800; // 800m to Coral Atoll Sanctuary
    this.corals = [];
    this.thermalUpwellings = [];

    this.initReef();
    this.initInput();
  }

  initReef() {
    this.corals = [];
    this.thermalUpwellings = [];

    // Organic branching coral formations & cool thermal upwellings
    for (let i = 0; i < 45; i++) {
      const isBleached = (i % 4 === 1); // NOAA Bleaching Alert Level
      const coralType = i % 3; // 0: Staghorn, 1: Brain Coral, 2: Sea Fan

      this.corals.push({
        x: 350 + i * 190,
        y: this.canvas.height - 40,
        height: 70 + Math.random() * 80,
        width: 48 + Math.random() * 30,
        type: coralType,
        bleached: isBleached,
        revived: false
      });

      // Cool ocean thermal upwellings every ~4 corals
      if (i % 4 === 2) {
        this.thermalUpwellings.push({
          x: 350 + i * 190 + 90,
          y: this.canvas.height * 0.5,
          w: 42,
          h: this.canvas.height * 0.7
        });
      }
    }
  }

  initInput() {
    this.swim = () => {
      this.turtle.vy = this.turtle.swimStrength;
      this.turtle.flipperAngle = 0.5;
    };

    this.onKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.swim();
      }
      if (e.key === 'Escape') { this.stop(); this.onExit?.(); }
    };

    this.onPointerDown = () => this.swim();

    window.addEventListener('keydown', this.onKeyDown);
    this.canvas?.addEventListener?.('pointerdown', this.onPointerDown);
  }

  update(dt) {
    if (this.isVictory) return;

    // Buoyancy and gravity physics
    this.turtle.vy += this.turtle.gravity * dt;
    this.turtle.y += this.turtle.vy * dt;
    this.turtle.y = Math.max(40, Math.min(this.canvas.height - 70, this.turtle.y));
    this.turtle.flipperAngle *= 0.92;

    this.distance += dt * 48;

    // Scroll corals and upwellings
    const scrollSpeed = 150;
    this.corals.forEach(c => {
      c.x -= scrollSpeed * dt;
      if (c.x < -100) c.x += 45 * 190;

      // Revive bleached corals if turtle swims close
      if (c.bleached && !c.revived && Math.hypot(this.turtle.x - c.x, this.turtle.y - (this.canvas.height - c.height / 2)) < 70) {
        c.revived = true;
        c.bleached = false;
        arcadeTokens.addTokens(1, 'Revived Barrier Reef Coral');
      }
    });

    // Check cool upwelling boost
    this.thermalUpwellings.forEach(u => {
      u.x -= scrollSpeed * dt;
      if (u.x < -100) u.x += 45 * 190;
      if (Math.abs(this.turtle.x - u.x) < 30) {
        this.turtle.vy = -160; // Upwelling lift
        this.distance += dt * 80;
      }
    });

    // Check Victory
    if (this.distance >= this.targetDistance && !this.isVictory) {
      this.isVictory = true;
      arcadeTokens.addTokens(20, 'Reached Coral Atoll Marine Sanctuary');
    }

    arcadeTokens.recordHighScore('coral_current', Math.floor(this.distance), 'meters');
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Luminous Tropical Turquoise Ocean Gradient
    const ocean = ctx.createLinearGradient(0, 0, 0, h);
    ocean.addColorStop(0, '#0284c7');
    ocean.addColorStop(0.4, '#0369a1');
    ocean.addColorStop(1, '#082f49');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, w, h);

    // Refracted sunbeams
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let s = 0; s < 4; s++) {
      ctx.beginPath();
      ctx.moveTo(s * 320 + 40, 0);
      ctx.lineTo(s * 320 + 160, h);
      ctx.lineTo(s * 320 + 220, h);
      ctx.lineTo(s * 320 + 80, 0);
      ctx.closePath();
      ctx.fill();
    }

    // Sandy seafloor
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(0, h - 35, w, 35);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, h - 40, w, 6);

    // Cool Thermal Upwellings (flowing cyan columns)
    this.thermalUpwellings.forEach(u => {
      const grad = ctx.createLinearGradient(u.x, 0, u.x, h);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.04)');
      grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.22)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.15)');
      ctx.fillStyle = grad;
      ctx.fillRect(u.x - u.w / 2, 0, u.w, h);
    });

    // Procedural Branching Corals (Staghorn, Brain Coral, Sea Fans)
    this.corals.forEach(c => {
      const coralY = h - 40;
      const coralColor = c.bleached ? '#cbd5e1' : (c.type === 0 ? '#f43f5e' : (c.type === 1 ? '#a855f7' : '#fb923c'));
      ctx.fillStyle = coralColor;
      ctx.strokeStyle = coralColor;

      if (c.type === 0) {
        // Staghorn Branching Coral
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(c.x, coralY);
        ctx.lineTo(c.x, coralY - c.height);
        ctx.lineTo(c.x - 18, coralY - c.height - 24);
        ctx.moveTo(c.x, coralY - c.height * 0.6);
        ctx.lineTo(c.x + 20, coralY - c.height - 18);
        ctx.stroke();
      } else if (c.type === 1) {
        // Brain Coral Mound
        ctx.beginPath();
        ctx.ellipse(c.x, coralY - c.height * 0.4, c.width / 2, c.height * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Sea Fan Coral
        ctx.beginPath();
        ctx.arc(c.x, coralY, c.height * 0.8, Math.PI, Math.PI * 2);
        ctx.fill();
      }
    });

    // Luminous Sea Turtle (Golden Amber Carapace Shell, Paddling Flippers, High Visibility)
    ctx.save();
    ctx.translate(this.turtle.x, this.turtle.y);
    const tilt = Math.max(-0.35, Math.min(0.35, this.turtle.vy * 0.002));
    ctx.rotate(tilt);

    // Bioluminescent water wake
    ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-26, 0, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flippers
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.ellipse(4, -14 - this.turtle.flipperAngle * 8, 12, 6, -0.6, 0, Math.PI * 2);
    ctx.ellipse(4, 14 + this.turtle.flipperAngle * 8, 12, 6, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Golden Carapace Shell
    ctx.fillStyle = '#d97706';
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Scute shell plates
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(-2, 0, 6, 0, Math.PI * 2);
    ctx.arc(6, -3, 4, 0, Math.PI * 2);
    ctx.arc(6, 3, 4, 0, Math.PI * 2);
    ctx.fill();

    // Turtle Head & Eye
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.ellipse(22, 0, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(24, -2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bottom Telemetry HUD
    const hudY = h - 96;
    ctx.fillStyle = 'rgba(10, 15, 26, 0.9)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(24, hudY, 340, 72, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('🌊 NOAA CORAL REEF WATCH (CRW)', 38, hudY + 22);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13.5px system-ui';
    ctx.fillText(`Sanctuary Journey: ${Math.floor(this.distance)} / ${this.targetDistance}m`, 38, hudY + 43);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10.5px system-ui';
    ctx.fillText('Ride blue thermal upwellings to rejuvenate bleached reefs', 38, hudY + 60);

    // Right: Status Card
    ctx.beginPath();
    ctx.roundRect(w - 220, hudY, 196, 72, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = '800 16px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText('🐢 Resilient Green', w - 42, hudY + 34);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 11.5px system-ui';
    ctx.fillText('Upwelling Speed Active', w - 42, hudY + 56);

    // Victory Screen
    if (this.isVictory) {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#10b981';
      ctx.font = '800 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🪸 CORAL REEF SANCTUARY REACHED! 🪸', w / 2, h / 2 - 35);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 14px system-ui';
      ctx.fillText('You navigated through 800m of barrier reefs into the deep protected atoll.', w / 2, h / 2);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText('🪙 +20 Zen Tokens Awarded', w / 2, h / 2 + 35);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px system-ui';
      ctx.fillText('Press Esc or Exit Game to return to the Arcade Hub', w / 2, h / 2 + 68);
    }
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    const loop = () => {
      if (!this.isRunning) return;
      if (!this.isPaused) {
        this.update(0.016);
        this.render();
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }
  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; }
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.onKeyDown);
    this.canvas?.removeEventListener?.('pointerdown', this.onPointerDown);
  }
}

// ==========================================
// 08. LAST FOREST (NASA/USGS Landsat Canopy)
// ==========================================
export class LastForestGame {
  constructor(canvas, audioCtx, onExit) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onExit = onExit;

    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.rafId = null;

    // Winged Sycamore Seed Flight Physics (Full 2D Aerodynamic Banking)
    this.seed = {
      x: canvas.width / 2,
      y: canvas.height * 0.45,
      vx: 0,
      vy: 0,
      tilt: 0,
      altitude: 100, // 0 - 100%
      seedsPlanted: 0,
      targetSeeds: 10
    };

    this.keys = { left: false, right: false, up: false, down: false };
    this.distance = 0;
    this.canopyLayers = [];
    this.thermalUpdrafts = [];
    this.wildfireSmokePlumes = []; // NASA FIRMS Obstacles

    this.initForest();
    this.initInput();
  }

  initForest() {
    this.canopyLayers = [];
    this.thermalUpdrafts = [];
    this.wildfireSmokePlumes = [];

    // Layered forest canopy
    for (let i = 0; i < 60; i++) {
      this.canopyLayers.push({
        x: Math.random() * this.canvas.width,
        y: -i * 120,
        r: 32 + Math.random() * 45,
        type: i % 2 === 0 ? 'redwood' : 'ancient_oak'
      });

      // Warm thermal updrafts (rise higher)
      if (i % 5 === 2) {
        this.thermalUpdrafts.push({
          x: 60 + Math.random() * (this.canvas.width - 120),
          y: -i * 120,
          r: 42
        });
      }

      // Wildfire smoke vortex obstacles (FIRMS)
      if (i % 7 === 4) {
        this.wildfireSmokePlumes.push({
          x: 60 + Math.random() * (this.canvas.width - 120),
          y: -i * 120,
          r: 48,
          hazard: '🔥 FIRMS Thermal Plume'
        });
      }
    }
  }

  initInput() {
    this.onKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = true;
      if (e.key === 'Escape') { this.stop(); this.onExit?.(); }
    };
    this.onKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = false;
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  update(dt) {
    if (this.isVictory || this.isGameOver) return;

    // Full 2D Aerodynamic Banking Flight
    if (this.keys.left) {
      this.seed.vx -= 420 * dt;
      this.seed.tilt = Math.max(-0.45, this.seed.tilt - 2.5 * dt);
    } else if (this.keys.right) {
      this.seed.vx += 420 * dt;
      this.seed.tilt = Math.min(0.45, this.seed.tilt + 2.5 * dt);
    } else {
      this.seed.vx *= 0.85;
      this.seed.tilt *= 0.82;
    }

    if (this.keys.up) {
      this.seed.vy -= 260 * dt;
    } else if (this.keys.down) {
      this.seed.vy += 260 * dt;
    } else {
      this.seed.vy *= 0.85;
    }

    this.seed.x += this.seed.vx * dt;
    this.seed.y += this.seed.vy * dt;

    // Keep seed in screen
    this.seed.x = Math.max(30, Math.min(this.canvas.width - 30, this.seed.x));
    this.seed.y = Math.max(50, Math.min(this.canvas.height - 120, this.seed.y));

    this.distance += dt * 42;

    // Scroll canopy downward
    const scrollY = 120 * dt;
    this.canopyLayers.forEach(c => {
      c.y += scrollY;
      if (c.y > this.canvas.height + 60) {
        c.y = -60;
        c.x = Math.random() * this.canvas.width;
      }
    });

    // Check thermal updrafts (replenish altitude & seeds)
    this.thermalUpdrafts.forEach(t => {
      t.y += scrollY;
      if (t.y > this.canvas.height + 60) {
        t.y = -60;
        t.x = Math.random() * this.canvas.width;
      }
      if (Math.hypot(this.seed.x - t.x, this.seed.y - t.y) < t.r + 20) {
        this.seed.altitude = Math.min(100, this.seed.altitude + 15 * dt);
        if (Math.random() < 0.04) {
          this.seed.seedsPlanted += 1;
          arcadeTokens.addTokens(2, 'Dispersed Forest Sycamore Seed');
          if (this.seed.seedsPlanted >= this.seed.targetSeeds && !this.isVictory) {
            this.isVictory = true;
            arcadeTokens.addTokens(25, 'Ancient Forest Reforested');
          }
        }
      }
    });

    // Check wildfire smoke hazards (FIRMS)
    this.wildfireSmokePlumes.forEach(p => {
      p.y += scrollY;
      if (p.y > this.canvas.height + 60) {
        p.y = -60;
        p.x = Math.random() * this.canvas.width;
      }
      if (Math.hypot(this.seed.x - p.x, this.seed.y - p.y) < p.r + 15) {
        this.seed.altitude = Math.max(0, this.seed.altitude - 35 * dt);
        if (this.seed.altitude <= 0) {
          this.isGameOver = true;
        }
      }
    });

    arcadeTokens.recordHighScore('last_forest', this.seed.seedsPlanted, 'seeds');
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Lush deep forest canopy floor
    ctx.fillStyle = '#051b11';
    ctx.fillRect(0, 0, w, h);

    // Landsat Forest Canopy Circles with multi-shade green depth
    this.canopyLayers.forEach(c => {
      ctx.fillStyle = c.type === 'redwood' ? 'rgba(5, 150, 105, 0.45)' : 'rgba(16, 185, 129, 0.35)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Thermal Updraft Rings (Warm rising thermals)
    this.thermalUpdrafts.forEach(t => {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Wildfire Smoke Plumes (FIRMS Hazards)
    this.wildfireSmokePlumes.forEach(p => {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 9.5px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(p.hazard, p.x, p.y + 4);
    });

    // Aerodynamic Winged Sycamore Seed (Gliding & Banking)
    ctx.save();
    ctx.translate(this.seed.x, this.seed.y);
    ctx.rotate(this.seed.tilt);

    // Winged blade
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 22, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Seed nucleus
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(2, 14, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bottom Telemetry HUD
    const hudY = h - 96;
    ctx.fillStyle = 'rgba(10, 15, 26, 0.9)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(24, hudY, 340, 72, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('🛰️ NASA/USGS LANDSAT FOREST CANOPY COVER', 38, hudY + 22);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13.5px system-ui';
    ctx.fillText(`Mission: Disperse Seeds (${this.seed.seedsPlanted} / ${this.seed.targetSeeds} Planted)`, 38, hudY + 43);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10.5px system-ui';
    ctx.fillText('A/D or Arrows: Bank left & right · Dodge red smoke plumes', 38, hudY + 60);

    // Right: Seed Altitude Bar
    ctx.beginPath();
    ctx.roundRect(w - 220, hudY, 196, 72, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = '800 16px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`🍃 ${this.seed.seedsPlanted} / ${this.seed.targetSeeds} Planted`, w - 42, hudY + 34);

    ctx.fillStyle = '#34d399';
    ctx.font = '600 11.5px system-ui';
    ctx.fillText(`Altitude: ${Math.round(this.seed.altitude)}%`, w - 42, hudY + 56);

    // Victory Screen
    if (this.isVictory) {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#10b981';
      ctx.font = '800 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🍃 ANCIENT CANOPY REFORESTED! 🍃', w / 2, h / 2 - 35);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 14px system-ui';
      ctx.fillText('You dispersed 10 sycamore seeds across virgin forest clearings.', w / 2, h / 2);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText('🪙 +25 Zen Tokens Awarded', w / 2, h / 2 + 35);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px system-ui';
      ctx.fillText('Press Esc or Exit Game to return to the Arcade Hub', w / 2, h / 2 + 68);
    }
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    const loop = () => {
      if (!this.isRunning) return;
      if (!this.isPaused) {
        this.update(0.016);
        this.render();
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }
  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; }
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
