/**
 * Terraphone — FIRELINE: Into the Forest
 * NASA Space Apps Challenge
 * 
 * Endless 2.5D isometric forest exploration game.
 * Features:
 * - Procedural isometric forest with pines, birch, rivers, and clearings
 * - NASA FIRMS thermal anomaly detection risk bands
 * - Glowing woodland spirit character with customizable spirit glow
 * - Forest seed collection & river spring restoration
 * - Golden Firefly Flight Easter egg transformation
 * - Shared procedural Web Audio soundscape
 */

import { arcadeTokens } from './arcade-tokens.js';

export class FirelineGame {
  constructor(canvas, audioCtx, onExit) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audioCtx = audioCtx;
    this.onExit = onExit;

    this.isRunning = false;
    this.isPaused = false;
    this.rafId = null;
    this.lastTime = 0;

    // World & Camera
    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      speed: 180, // px/s
      size: 14,
      trail: [],
      seedsCarried: 0,
      isFirefly: false,
      fireflyTimer: 0
    };

    this.camera = { x: 0, y: 0 };

    // Procedural grid & chunks
    this.tileSize = 48;
    this.seeds = [];
    this.springs = [];
    this.trees = [];
    this.firmsAnomalies = []; // NASA FIRMS heat risk zones

    // Stats
    this.seedsSaved = 0;
    this.distanceTraveled = 0;
    this.forestsRestored = 0;

    // Inputs
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false
    };

    this.audioNodes = null;

    this.initWorld();
    this.initInput();
    this.initAudio();
  }

  initWorld() {
    // Generate initial procedural forest features around origin
    this.trees = [];
    this.seeds = [];
    this.springs = [];
    this.firmsAnomalies = [];

    for (let x = -30; x <= 30; x++) {
      for (let y = -30; y <= 30; y++) {
        const dist = Math.hypot(x, y);
        if (dist < 3) continue; // Clear clearing at spawn

        const rand = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const fract = rand - Math.floor(rand);

        // Trees
        if (fract < 0.22) {
          this.trees.push({
            x: x * this.tileSize + (fract * 20 - 10),
            y: y * this.tileSize + (fract * 20 - 10),
            type: fract > 0.11 ? 'pine' : 'birch',
            size: 28 + Math.floor(fract * 24)
          });
        }

        // NASA FIRMS Thermal Anomaly Zones (warm satellite thermal hotspots)
        if (fract > 0.94 && dist > 8) {
          this.firmsAnomalies.push({
            x: x * this.tileSize,
            y: y * this.tileSize,
            radius: 80 + Math.floor(fract * 60),
            riskLevel: 'Moderate Anomaly (MODIS/VIIRS)',
            tempKelvin: Math.floor(315 + fract * 30)
          });
        }

        // Luminous seeds
        if (fract > 0.88 && fract <= 0.94) {
          const isGolden = (fract > 0.935);
          this.seeds.push({
            x: x * this.tileSize,
            y: y * this.tileSize,
            isGolden,
            collected: false
          });
        }

        // Sacred River Spring at intervals (3 ancient springs to restore)
        if ((x === 0 && y === 12) || (x === 18 && y === -15) || (x === -20 && y === 20)) {
          this.springs.push({
            x: x * this.tileSize,
            y: y * this.tileSize,
            active: true,
            restored: false,
            seedsNeeded: 4,
            seedsDeposited: 0
          });
        }
      }
    }
    this.isVictory = false;
  }

  initInput() {
    this.onKeyDown = (e) => {
      if (e.repeat) return;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.keys.up = true;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.keys.down = true;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.keys.left = true;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.keys.right = true;
      if (e.key === 'Escape') {
        this.stop();
        if (this.onExit) this.onExit();
      }
    };

    this.onKeyUp = (e) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.keys.up = false;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.keys.down = false;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.keys.left = false;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.keys.right = false;
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  triggerFireflyMode(duration = 10) {
    this.player.isFirefly = true;
    this.player.fireflyTimer = duration;
    arcadeTokens.unlockEasterEgg('Golden Firefly Flight', 10);
    this.playChime(880);
  }

  getSpeed() {
    return this.player.isFirefly ? this.player.speed * 1.5 : this.player.speed;
  }

  initAudio() {
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const master = this.audioCtx.createGain();
      master.gain.setValueAtTime(0.7, now);
      master.connect(this.audioCtx.destination);

      // Forest Wind Ambience
      const bufferSize = this.audioCtx.sampleRate * 2;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const windSource = this.audioCtx.createBufferSource();
      windSource.buffer = noiseBuffer;
      windSource.loop = true;

      const windFilter = this.audioCtx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(450, now);
      windFilter.Q.setValueAtTime(1.2, now);

      const windGain = this.audioCtx.createGain();
      windGain.gain.setValueAtTime(0.08, now);

      windSource.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(master);
      windSource.start();

      this.audioNodes = { master, windGain, windFilter };
    } catch (e) {}
  }

  playChime(freq = 640) {
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const g = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.6, now + 0.35);

      g.gain.setValueAtTime(0.14, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(g);
      g.connect(this.audioNodes ? this.audioNodes.master : this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }

  update(dt) {
    if (this.isVictory) return;

    // Movement: Convert screen intent (WASD / Arrows) to isometric world direction
    let sx = 0;
    let sy = 0;
    if (this.keys.up) sy -= 1;
    if (this.keys.down) sy += 1;
    if (this.keys.left) sx -= 1;
    if (this.keys.right) sx += 1;

    const curSpeed = this.player.isFirefly ? this.player.speed * 1.5 : this.player.speed;

    if (sx !== 0 || sy !== 0) {
      const sLen = Math.hypot(sx, sy);
      const nSx = sx / sLen;
      const nSy = sy / sLen;
      const cos30 = Math.cos(Math.PI / 6);
      const sin30 = Math.sin(Math.PI / 6);
      const wx = (nSx / cos30 + nSy / sin30) / 2;
      const wy = (nSy / sin30 - nSx / cos30) / 2;
      const wLen = Math.hypot(wx, wy);
      this.player.vx = (wx / wLen) * curSpeed;
      this.player.vy = (wy / wLen) * curSpeed;
    } else {
      this.player.vx *= 0.8;
      this.player.vy *= 0.8;
    }

    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Particle light trail
    this.player.trail.unshift({ x: this.player.x, y: this.player.y, alpha: 1.0 });
    if (this.player.trail.length > 18) this.player.trail.pop();
    this.player.trail.forEach(t => t.alpha -= dt * 2.2);

    // Camera smoothly follows player
    this.camera.x += (this.player.x - this.camera.x) * 0.1;
    this.camera.y += (this.player.y - this.camera.y) * 0.1;

    // Track distance
    this.distanceTraveled = Math.floor(Math.hypot(this.player.x, this.player.y) / 10);

    // Firefly mode timer
    if (this.player.isFirefly) {
      this.player.fireflyTimer -= dt;
      if (this.player.fireflyTimer <= 0) {
        this.player.isFirefly = false;
      }
    }

    // Seed collection
    this.seeds.forEach(s => {
      if (!s.collected && Math.hypot(this.player.x - s.x, this.player.y - s.y) < 28) {
        s.collected = true;
        this.player.seedsCarried += 1;
        this.playChime(s.isGolden ? 880 : 580);

        if (s.isGolden) {
          // Transform into soaring firefly
          this.player.isFirefly = true;
          this.player.fireflyTimer = 10;
          arcadeTokens.unlockEasterEgg('Golden Firefly Flight', 10);
        }
      }
    });

    // Sacred Spring restoration deposit
    this.springs.forEach(sp => {
      if (!sp.restored && this.player.seedsCarried > 0 && Math.hypot(this.player.x - sp.x, this.player.y - sp.y) < 55) {
        const deposit = Math.min(this.player.seedsCarried, sp.seedsNeeded - sp.seedsDeposited);
        sp.seedsDeposited += deposit;
        this.player.seedsCarried -= deposit;
        this.seedsSaved += deposit;
        arcadeTokens.addTokens(deposit * 2, 'Restored Forest Spring');

        if (sp.seedsDeposited >= sp.seedsNeeded) {
          sp.restored = true;
          this.forestsRestored += 1;
          this.playChime(1040);
        } else {
          this.playChime(780);
        }

        // Check overall victory condition (all 3 springs restored)
        if (this.springs.every(s => s.restored) && !this.isVictory) {
          this.isVictory = true;
          arcadeTokens.addTokens(25, 'Forest Watershed Fully Restored');
          this.playChime(1200);
        }
      }
    });

    arcadeTokens.recordHighScore('fireline', this.seedsSaved, 'seeds');
  }

  // Convert 2D world coords to 2.5D Isometric screen coords
  worldToIso(wx, wy) {
    const cx = wx - this.camera.x;
    const cy = wy - this.camera.y;
    return {
      x: (cx - cy) * Math.cos(Math.PI / 6) + this.canvas.width / 2,
      y: (cx + cy) * Math.sin(Math.PI / 6) + this.canvas.height / 2
    };
  }

  render() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    // Forest floor background
    ctx.fillStyle = '#0a120c';
    ctx.fillRect(0, 0, width, height);

    // Subtle isometric ground grid lines
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.04)';
    ctx.lineWidth = 1;
    const step = 64;
    for (let x = -width; x < width * 2; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height * 1.5, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - height * 1.5, height);
      ctx.stroke();
    }

    // 1. Render NASA FIRMS Anomaly Zones (warm ground halos)
    this.firmsAnomalies.forEach(fa => {
      const p = this.worldToIso(fa.x, fa.y);
      const rad = fa.radius * 0.8;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
      grad.addColorStop(0.6, 'rgba(239, 68, 68, 0.12)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, rad * 1.4, rad * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Render Springs
    this.springs.forEach(sp => {
      const p = this.worldToIso(sp.x, sp.y);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 36, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 3. Render Seeds
    this.seeds.forEach(s => {
      if (s.collected) return;
      const p = this.worldToIso(s.x, s.y);
      ctx.fillStyle = s.isGolden ? '#facc15' : '#34d399';
      ctx.shadowColor = s.isGolden ? '#facc15' : '#34d399';
      ctx.shadowBlur = s.isGolden ? 16 : 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 6, s.isGolden ? 7 : 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 4. Render Trees (Sorted by Y for depth)
    const visibleTrees = this.trees.slice().sort((a, b) => a.y - b.y);
    visibleTrees.forEach(t => {
      const p = this.worldToIso(t.x, t.y);
      if (p.x < -60 || p.x > width + 60 || p.y < -60 || p.y > height + 60) return;

      // Tree trunk
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(p.x - 3, p.y - 12, 6, 12);

      // Layered canopy
      ctx.fillStyle = t.type === 'pine' ? '#064e3b' : '#047857';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - t.size - 10);
      ctx.lineTo(p.x - t.size * 0.5, p.y - 10);
      ctx.lineTo(p.x + t.size * 0.5, p.y - 10);
      ctx.closePath();
      ctx.fill();
    });

    // 5. Render Player Spirit & Light Trail
    const spiritColor = arcadeTokens.getEquippedHex('spiritGlow');
    this.player.trail.forEach(t => {
      if (t.alpha <= 0) return;
      const tp = this.worldToIso(t.x, t.y);
      ctx.fillStyle = spiritColor;
      ctx.globalAlpha = t.alpha * 0.45;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y - 8, this.player.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    const pp = this.worldToIso(this.player.x, this.player.y);
    ctx.save();
    ctx.shadowColor = spiritColor;
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pp.x, pp.y - 10, this.player.size * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Firefly wings if transformed
    if (this.player.isFirefly) {
      ctx.fillStyle = 'rgba(250, 204, 21, 0.7)';
      ctx.beginPath();
      ctx.ellipse(pp.x - 12, pp.y - 16, 10, 4, -0.4, 0, Math.PI * 2);
      ctx.ellipse(pp.x + 12, pp.y - 16, 10, 4, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 5. Nearest Sacred Spring Compass Indicator
    const unrestored = this.springs.filter(s => !s.restored);
    if (unrestored.length > 0) {
      unrestored.sort((a, b) => Math.hypot(this.player.x - a.x, this.player.y - a.y) - Math.hypot(this.player.x - b.x, this.player.y - b.y));
      const target = unrestored[0];
      const targetIso = this.worldToIso(target.x, target.y);
      const angle = Math.atan2(targetIso.y - pp.y, targetIso.x - pp.x);

      ctx.save();
      ctx.translate(pp.x, pp.y);
      ctx.rotate(angle);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(34, 0);
      ctx.lineTo(24, -6);
      ctx.lineTo(26, 0);
      ctx.lineTo(24, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 6. On-screen NASA FIRMS HUD (Bottom-anchored to never collide with top buttons)
    this.renderHud(ctx, width, height);

    // 7. Victory Screen
    if (this.isVictory) {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#10b981';
      ctx.font = '800 28px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✨ ANCIENT WATERSHED RESTORED! ✨', width / 2, height / 2 - 40);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 14px system-ui, sans-serif';
      ctx.fillText('All 3 Sacred River Springs are flowing again with clean alpine runoff.', width / 2, height / 2 - 6);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('🪙 +25 Zen Tokens Awarded', width / 2, height / 2 + 30);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('Press Esc or Exit Game to claim rewards and explore other games', width / 2, height / 2 + 65);
    }
  }

  renderHud(ctx, width, height) {
    const hudY = height - 96;

    // NASA FIRMS Badge (Bottom Left)
    ctx.fillStyle = 'rgba(10, 15, 26, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(24, hudY, 320, 72, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🛰️ NASA FIRMS THERMAL SATELLITE DATA', 38, hudY + 22);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13.5px system-ui, sans-serif';
    ctx.fillText(`MODIS / VIIRS Active Fire Alerts`, 38, hudY + 43);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10.5px system-ui, sans-serif';
    ctx.fillText('Follow blue compass arrow to restore River Springs', 38, hudY + 60);

    // Objective & Seeds (Bottom Right)
    ctx.beginPath();
    ctx.roundRect(width - 240, hudY, 216, 72, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 13.5px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`🌱 Seeds Carried: ${this.player.seedsCarried}`, width - 42, hudY + 30);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.fillText(`💧 Springs Restored: ${this.forestsRestored} / 3`, width - 42, hudY + 54);
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();

    const loop = (time) => {
      if (!this.isRunning) return;
      const dt = Math.min(0.05, (time - this.lastTime) / 1000);
      this.lastTime = time;

      if (!this.isPaused) {
        this.update(dt);
        this.render();
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; this.lastTime = performance.now(); }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    if (this.audioNodes && this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        this.audioNodes.master.gain.setTargetAtTime(0, now, 0.1);
      } catch (e) {}
    }
  }
}
