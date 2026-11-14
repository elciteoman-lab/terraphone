/**
 * Terraphone — Earth Arcade: Six Specialized Environmental Games
 * NASA Space Apps Challenge
 * 
 * 03. HEAT ESCAPE (NASA ECOSTRESS Land Surface Temperature)
 * 04. WATER KEEPER (NASA SMAP Soil Moisture)
 * 05. CLOUD COURIER (NASA OMI SO2/NO2 & GPM Precipitation)
 * 06. OZONE DRIFT (NASA Ozone Watch / Aura OMI Stratospheric Data)
 * 07. CORAL CURRENT (NOAA Coral Reef Watch Bleaching Stress & SST)
 * 08. LAST FOREST (NASA/USGS Landsat Forest Canopy Cover)
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
    this.isPaused = false;
    this.rafId = null;
    this.lastTime = 0;

    this.player = {
      x: canvas.width / 2,
      y: canvas.height * 0.75,
      speed: 220,
      hydration: 100, // 0 - 100%
      distance: 0
    };

    this.keys = { left: false, right: false, up: false, down: false };
    this.cityBlocks = [];
    this.coolingOases = []; // Shaded parks and mist stations
    this.initCity();
    this.initInput();
  }

  initCity() {
    this.cityBlocks = [];
    this.coolingOases = [];
    for (let i = 0; i < 40; i++) {
      const isPark = Math.random() < 0.35;
      const block = {
        x: (i % 5) * 160 + 20,
        y: -Math.floor(i / 5) * 220,
        w: 130,
        h: 170,
        isPark,
        tempLST: isPark ? 24.5 : 46.8 // NASA ECOSTRESS Surface Temp
      };
      this.cityBlocks.push(block);
      if (isPark) {
        this.coolingOases.push({ x: block.x + 65, y: block.y + 85, collected: false });
      }
    }
  }

  initInput() {
    this.onKeyDown = (e) => {
      if (e.key === 'a' || e.key === 'ArrowLeft') this.keys.left = true;
      if (e.key === 'd' || e.key === 'ArrowRight') this.keys.right = true;
      if (e.key === 'w' || e.key === 'ArrowUp') this.keys.up = true;
      if (e.key === 's' || e.key === 'ArrowDown') this.keys.down = true;
      if (e.key === 'Escape') { this.stop(); this.onExit?.(); }
    };
    this.onKeyUp = (e) => {
      if (e.key === 'a' || e.key === 'ArrowLeft') this.keys.left = false;
      if (e.key === 'd' || e.key === 'ArrowRight') this.keys.right = false;
      if (e.key === 'w' || e.key === 'ArrowUp') this.keys.up = false;
      if (e.key === 's' || e.key === 'ArrowDown') this.keys.down = false;
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  update(dt) {
    let dx = 0, dy = 0;
    if (this.keys.left) dx -= 1;
    if (this.keys.right) dx += 1;
    if (this.keys.up) dy -= 1;
    if (this.keys.down) dy += 1;

    this.player.x += dx * this.player.speed * dt;
    this.player.y += dy * this.player.speed * dt;
    this.player.x = Math.max(30, Math.min(this.canvas.width - 30, this.player.x));
    this.player.distance += dt * 35;

    // Check if player is on hot asphalt vs cooling shade
    let inShade = false;
    this.cityBlocks.forEach(b => {
      if (b.isPark && this.player.x >= b.x && this.player.x <= b.x + b.w &&
          this.player.y >= b.y && this.player.y <= b.y + b.h) {
        inShade = true;
      }
    });

    if (inShade) {
      this.player.hydration = Math.min(100, this.player.hydration + 15 * dt);
    } else {
      // Hot asphalt drains hydration
      this.player.hydration = Math.max(0, this.player.hydration - 12 * dt);
    }

    arcadeTokens.recordHighScore('heat_escape', Math.floor(this.player.distance), 'meters');
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.fillStyle = '#1e1b18'; // warm dry pavement
    ctx.fillRect(0, 0, w, h);

    // City blocks
    this.cityBlocks.forEach(b => {
      ctx.fillStyle = b.isPark ? 'rgba(52, 211, 153, 0.28)' : 'rgba(239, 68, 68, 0.18)';
      ctx.strokeStyle = b.isPark ? '#10b981' : '#f97316';
      ctx.lineWidth = 2;
      ctx.fillRect(b.x, b.y + (this.player.distance % 220), b.w, b.h);
      ctx.strokeRect(b.x, b.y + (this.player.distance % 220), b.w, b.h);

      ctx.fillStyle = b.isPark ? '#34d399' : '#f97316';
      ctx.font = '11px system-ui';
      ctx.fillText(`${b.tempLST.toFixed(1)}°C LST`, b.x + 8, b.y + (this.player.distance % 220) + 20);
    });

    // Player scooter
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, 10, 0, Math.PI * 2);
    ctx.fill();

    // HUD
    this.renderBanner(ctx, '🛰️ NASA ECOSTRESS LAND SURFACE TEMP', 'Shaded Parks (24°C) vs Pavement Heat Island (47°C)', `💧 Hydration: ${Math.round(this.player.hydration)}% · 📍 ${Math.floor(this.player.distance)}m`);
  }

  renderBanner(ctx, title, sub, stat) {
    ctx.fillStyle = 'rgba(10, 15, 26, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.roundRect(20, 20, 360, 64, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText(title, 32, 40);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10.5px system-ui';
    ctx.fillText(sub, 32, 56);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px system-ui';
    ctx.fillText(stat, 32, 74);
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
    this.isPaused = false;
    this.rafId = null;
    this.lastTime = 0;

    this.drop = { x: 120, y: canvas.height * 0.6, vy: 0, size: 14, grounded: false };
    this.dropletsCollected = 0;
    this.terrain = [];
    this.collectibleDrops = [];
    this.scrollX = 0;

    this.initTerrain();
    this.initInput();
  }

  initTerrain() {
    this.terrain = [];
    this.collectibleDrops = [];
    for (let i = 0; i < 60; i++) {
      const isMoist = Math.random() < 0.6;
      this.terrain.push({
        x: i * 80,
        w: 80,
        moisture: isMoist ? 0.38 : 0.08, // NASA SMAP cm3/cm3
        y: this.canvas.height * 0.65 + Math.sin(i * 0.4) * 35
      });
      if (Math.random() < 0.4) {
        this.collectibleDrops.push({ x: i * 80 + 40, y: this.canvas.height * 0.55, collected: false });
      }
    }
  }

  initInput() {
    this.onKeyDown = (e) => {
      if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && this.drop.grounded) {
        this.drop.vy = -420;
        this.drop.grounded = false;
      }
      if (e.key === 'Escape') { this.stop(); this.onExit?.(); }
    };
    window.addEventListener('keydown', this.onKeyDown);
  }

  update(dt) {
    // Gravity & Jump Physics
    this.drop.vy += 980 * dt;
    this.drop.y += this.drop.vy * dt;
    this.scrollX += 160 * dt;

    // Floor collision
    const curSeg = this.terrain[Math.floor(this.scrollX / 80) % this.terrain.length];
    if (this.drop.y >= curSeg.y - this.drop.size) {
      this.drop.y = curSeg.y - this.drop.size;
      this.drop.vy = 0;
      this.drop.grounded = true;
    }

    // Dewdrop collection
    this.collectibleDrops.forEach(cd => {
      if (!cd.collected && Math.hypot((this.drop.x + this.scrollX) - cd.x, this.drop.y - cd.y) < 32) {
        cd.collected = true;
        this.dropletsCollected += 1;
        arcadeTokens.addTokens(1, 'Collected SMAP Dewdrop');
      }
    });

    arcadeTokens.recordHighScore('water_keeper', this.dropletsCollected, 'droplets');
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // SMAP Soil Strata
    this.terrain.forEach(seg => {
      const sx = seg.x - (this.scrollX % (this.terrain.length * 80));
      if (sx < -100 || sx > w + 100) return;
      ctx.fillStyle = seg.moisture > 0.2 ? '#064e3b' : '#78350f';
      ctx.fillRect(sx, seg.y, seg.w, h - seg.y);
      ctx.strokeStyle = seg.moisture > 0.2 ? '#10b981' : '#b45309';
      ctx.strokeRect(sx, seg.y, seg.w, 4);
    });

    // Dewdrops
    this.collectibleDrops.forEach(cd => {
      if (cd.collected) return;
      const cx = cd.x - (this.scrollX % (this.terrain.length * 80));
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cd.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Water Droplet Player
    ctx.fillStyle = '#60a5fa';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(this.drop.x, this.drop.y, this.drop.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // HUD
    ctx.fillStyle = 'rgba(10, 15, 26, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.roundRect(20, 20, 360, 64, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText('🛰️ NASA SMAP SOIL MOISTURE RADIOMETER', 32, 40);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10.5px system-ui';
    ctx.fillText('Moist Green Silt (38%) vs Parched Loam (8%)', 32, 56);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px system-ui';
    ctx.fillText(`💧 Dewdrops Gathered: ${this.dropletsCollected}`, 32, 74);
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
    this.isPaused = false;
    this.rafId = null;
    this.cloud = { x: 140, y: canvas.height * 0.4, vy: 0, purity: 100 };
    this.pollutionPlumes = []; // OMI SO2/NO2
    this.cleanAirCurrents = [];
    this.points = 0;

    this.initAtmosphere();
    this.initInput();
  }

  initAtmosphere() {
    this.pollutionPlumes = [];
    this.cleanAirCurrents = [];
    for (let i = 0; i < 30; i++) {
      this.pollutionPlumes.push({
        x: 400 + i * 320,
        y: 80 + Math.random() * (this.canvas.height - 240),
        r: 38 + Math.random() * 25,
        pollutant: i % 2 === 0 ? 'SO₂ (Sulfur Dioxide)' : 'NO₂ (Nitrogen Dioxide)'
      });
      this.cleanAirCurrents.push({
        x: 600 + i * 360,
        y: 100 + Math.random() * (this.canvas.height - 240),
        r: 30
      });
    }
  }

  initInput() {
    this.onKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') this.cloud.vy = -180;
      if (e.key === 'ArrowDown' || e.key === 's') this.cloud.vy = 180;
      if (e.key === 'Escape') { this.stop(); this.onExit?.(); }
    };
    this.onKeyUp = (e) => {
      this.cloud.vy = 0;
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  update(dt) {
    this.cloud.y += this.cloud.vy * dt;
    this.cloud.y = Math.max(60, Math.min(this.canvas.height - 80, this.cloud.y));
    this.points += Math.floor(dt * 20);

    // Scroll atmosphere
    this.pollutionPlumes.forEach(p => {
      p.x -= 160 * dt;
      if (p.x < -80) p.x += 30 * 320;
      if (Math.hypot(this.cloud.x - p.x, this.cloud.y - p.y) < p.r + 20) {
        this.cloud.purity = Math.max(0, this.cloud.purity - 22 * dt);
      }
    });

    this.cleanAirCurrents.forEach(c => {
      c.x -= 160 * dt;
      if (c.x < -80) c.x += 30 * 360;
      if (Math.hypot(this.cloud.x - c.x, this.cloud.y - c.y) < c.r + 20) {
        this.cloud.purity = Math.min(100, this.cloud.purity + 30 * dt);
      }
    });

    arcadeTokens.recordHighScore('cloud_courier', this.points, 'points');
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.fillStyle = '#0b132b';
    ctx.fillRect(0, 0, w, h);

    // Pollution Plumes
    this.pollutionPlumes.forEach(p => {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f87171';
      ctx.stroke();
    });

    // Clean Air currents
    this.cleanAirCurrents.forEach(c => {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Cloud Player
    ctx.fillStyle = this.cloud.purity > 40 ? '#f8fafc' : '#94a3b8';
    ctx.beginPath();
    ctx.arc(this.cloud.x, this.cloud.y, 22, 0, Math.PI * 2);
    ctx.arc(this.cloud.x + 18, this.cloud.y - 6, 18, 0, Math.PI * 2);
    ctx.arc(this.cloud.x - 16, this.cloud.y + 4, 16, 0, Math.PI * 2);
    ctx.fill();

    // HUD
    ctx.fillStyle = 'rgba(10, 15, 26, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.roundRect(20, 20, 360, 64, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText('🛰️ NASA OMI ATMOSPHERIC TRACE GAS SENSING', 32, 40);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10.5px system-ui';
    ctx.fillText('Avoid SO₂ / NO₂ plumes to maintain cloud purity', 32, 56);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px system-ui';
    ctx.fillText(`Cloud Purity: ${Math.round(this.cloud.purity)}% · Points: ${this.points}`, 32, 74);
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    const loop = (t) => {
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
    this.isPaused = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
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
    this.probe = { x: canvas.width / 2, y: canvas.height / 2, angle: 0, speed: 120 };
    this.keys = { left: false, right: false, thrust: false };
    this.gasCanisters = [];
    this.canistersCollected = 0;

    this.initSky();
    this.initInput();
  }

  initSky() {
    this.gasCanisters = [];
    for (let i = 0; i < 25; i++) {
      this.gasCanisters.push({
        x: 40 + Math.random() * (this.canvas.width - 80),
        y: 40 + Math.random() * (this.canvas.height - 80),
        dobsonUnits: Math.floor(220 + Math.random() * 120),
        collected: false
      });
    }
  }

  initInput() {
    this.onKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w') this.keys.thrust = true;
      if (e.key === 'Escape') { this.stop(); this.onExit?.(); }
    };
    this.onKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w') this.keys.thrust = false;
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  update(dt) {
    if (this.keys.left) this.probe.angle -= 2.6 * dt;
    if (this.keys.right) this.probe.angle += 2.6 * dt;
    if (this.keys.thrust) {
      this.probe.x += Math.cos(this.probe.angle) * this.probe.speed * dt;
      this.probe.y += Math.sin(this.probe.angle) * this.probe.speed * dt;
    }

    this.gasCanisters.forEach(c => {
      if (!c.collected && Math.hypot(this.probe.x - c.x, this.probe.y - c.y) < 22) {
        c.collected = true;
        this.canistersCollected += 1;
        arcadeTokens.addTokens(1, 'Stratospheric Ozone Sample');
      }
    });

    arcadeTokens.recordHighScore('ozone_drift', this.canistersCollected, 'canisters');
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#050814';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Ozone layer contours
    this.gasCanisters.forEach(c => {
      if (c.collected) return;
      ctx.fillStyle = c.dobsonUnits > 280 ? '#38bdf8' : '#a855f7';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Probe
    ctx.save();
    ctx.translate(this.probe.x, this.probe.y);
    ctx.rotate(this.probe.angle);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(10, 15, 26, 0.88)';
    ctx.roundRect(20, 20, 340, 60, 12);
    ctx.fill();
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText('🛰️ NASA OZONE WATCH & AURA SATELLITE', 32, 40);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px system-ui';
    ctx.fillText(`Stratospheric Samples: ${this.canistersCollected}`, 32, 62);
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
    this.turtle = { x: 120, y: canvas.height / 2, vy: 0 };
    this.distance = 0;
    this.corals = [];

    this.initReef();
    this.initInput();
  }

  initReef() {
    this.corals = [];
    for (let i = 0; i < 40; i++) {
      this.corals.push({
        x: 300 + i * 180,
        y: this.canvas.height - 90,
        height: 60 + Math.random() * 80,
        bleached: Math.random() < 0.3 // Degree Heating Week alert
      });
    }
  }

  initInput() {
    this.onKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') this.turtle.vy = -160;
      if (e.key === 'Escape') { this.stop(); this.onExit?.(); }
    };
    window.addEventListener('keydown', this.onKeyDown);
  }

  update(dt) {
    this.turtle.vy += 320 * dt;
    this.turtle.y += this.turtle.vy * dt;
    this.turtle.y = Math.max(30, Math.min(this.canvas.height - 40, this.turtle.y));
    this.distance += dt * 45;

    this.corals.forEach(c => {
      c.x -= 140 * dt;
      if (c.x < -80) c.x += 40 * 180;
    });

    arcadeTokens.recordHighScore('coral_current', Math.floor(this.distance), 'meters');
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#06202e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Corals
    this.corals.forEach(c => {
      ctx.fillStyle = c.bleached ? '#e2e8f0' : '#f43f5e';
      ctx.beginPath();
      ctx.roundRect(c.x, this.canvas.height - c.height, 28, c.height, 8);
      ctx.fill();
    });

    // Turtle
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.ellipse(this.turtle.x, this.turtle.y, 16, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // HUD
    ctx.fillStyle = 'rgba(10, 15, 26, 0.88)';
    ctx.roundRect(20, 20, 360, 60, 12);
    ctx.fill();
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText('🌊 NOAA CORAL REEF WATCH (CRW)', 32, 40);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px system-ui';
    ctx.fillText(`Healthy Barrier Reef Journey: ${Math.floor(this.distance)} m`, 32, 62);
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
    this.leaf = { x: canvas.width / 2, y: canvas.height * 0.4, vy: 0 };
    this.distance = 0;
    this.trees = [];

    this.initForest();
    this.initInput();
  }

  initForest() {
    this.trees = [];
    for (let i = 0; i < 50; i++) {
      this.trees.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        r: 18 + Math.random() * 24
      });
    }
  }

  initInput() {
    this.onKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') this.leaf.vy = -120;
      if (e.key === 'ArrowDown' || e.key === 's') this.leaf.vy = 120;
      if (e.key === 'Escape') { this.stop(); this.onExit?.(); }
    };
    this.onKeyUp = () => { this.leaf.vy = 0; };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  update(dt) {
    this.leaf.y += this.leaf.vy * dt;
    this.distance += dt * 40;
    this.trees.forEach(t => {
      t.y += 60 * dt;
      if (t.y > this.canvas.height + 40) {
        t.y = -40;
        t.x = Math.random() * this.canvas.width;
      }
    });

    arcadeTokens.recordHighScore('last_forest', Math.floor(this.distance), 'meters');
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#06170d';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Landsat Forest Canopy
    this.trees.forEach(t => {
      ctx.fillStyle = 'rgba(5, 150, 105, 0.4)';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sycamore Winged Seed
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(this.leaf.x, this.leaf.y, 8, 20, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // HUD
    ctx.fillStyle = 'rgba(10, 15, 26, 0.88)';
    ctx.roundRect(20, 20, 360, 60, 12);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText('🛰️ NASA/USGS LANDSAT FOREST CANOPY COVER', 32, 40);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px system-ui';
    ctx.fillText(`Canopy Gliding Distance: ${Math.floor(this.distance)} m`, 32, 62);
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
