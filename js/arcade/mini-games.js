/**
 * Terraphone — Earth Arcade: Specialized Environmental Games
 * NASA Space Apps Challenge
 * 
 * 03. HEAT ESCAPE (NASA ECOSTRESS 5-Lane Subway Runner)
 * 05. CLOUD COURIER (NASA OMI SO2/NO2 & GPM Atmospheric Lift)
 * 06. OZONE DRIFT (NASA Ozone Watch / Aura OMI Stratospheric Samples)
 * 07. CORAL CURRENT (NOAA Coral Reef Watch Bleaching Stress & Thermal Upwellings)
 * 08. LAST FOREST (NASA/USGS Landsat Forest Canopy & Aerodynamic Glider)
 */

import { arcadeTokens, COSMETICS_CATALOG } from './arcade-tokens.js';

import { drawReadout } from './game-readout.js';

// Safe universal polyfill for CanvasRenderingContext2D.prototype.roundRect
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii = 0) {
    const r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? (radii[0] || 0) : 0);
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
    return this;
  };
}

// ==========================================
// 03. HEAT ESCAPE (NASA ECOSTRESS 5-LANE SUBWAY RUNNER)
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

    // 5 Discrete Subway-Style Lanes (0: Far Left, 1: Mid Left, 2: Center, 3: Mid Right, 4: Far Right)
    this.numLanes = 5;
    this.currentLane = 2;
    this.targetLane = 2;

    // Player Scooter State
    this.player = {
      x: canvas.width / 2,
      y: canvas.height * 0.72,
      tilt: 0,
      jumpY: 0,
      jumpVel: 0,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      invulnerableTimer: 0,
      hydration: 100, // 0 - 100%
      distance: 0,
      dropletsCollected: 0,
      cryoTimer: 0
    };

    // Endless Runner & Milestone State
    this.milestonesPassed = 0;
    this.milestoneBannerTimer = 0;
    this.milestoneBannerText = '';

    // World & Spawner State
    this.obstacles = [];
    this.pickups = [];
    this.canopies = [];
    this.particles = [];
    this.nextSpawnDistance = 25;
    this.touchStartX = 0;
    this.touchStartY = 0;

    this.initInput();
  }

  getRoadGeometry() {
    const w = this.canvas.width;
    const roadW = Math.min(w * 0.94, 620);
    const roadLeft = (w - roadW) / 2;
    const laneW = roadW / this.numLanes;
    return {
      roadW,
      roadLeft,
      laneW,
      getLaneX: (l) => roadLeft + (l + 0.5) * laneW
    };
  }

  initInput() {
    this.onKeyDown = (e) => {
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        this.changeLane(-1);
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        this.changeLane(1);
      } else if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp' || e.key === ' ') {
        this.jump();
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        this.slide();
      } else if (e.key === 'r' || e.key === 'R') {
        if (this.isGameOver || this.isVictory) this.restart();
      } else if (e.key === 'Escape') {
        this.stop();
        this.onExit?.();
      }
    };

    // Mobile Swipe Gesture Support (Subway Surfers feel)
    this.onTouchStart = (e) => {
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    };

    this.onTouchEnd = (e) => {
      if (e.changedTouches.length > 0) {
        const dx = e.changedTouches[0].clientX - this.touchStartX;
        const dy = e.changedTouches[0].clientY - this.touchStartY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (Math.max(absX, absY) > 28) {
          if (absX > absY) {
            dx < 0 ? this.changeLane(-1) : this.changeLane(1);
          } else {
            dy < 0 ? this.jump() : this.slide();
          }
        }
      }
    };

    window.addEventListener('keydown', this.onKeyDown);
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.canvas.addEventListener('touchend', this.onTouchEnd, { passive: true });
  }

  changeLane(dir) {
    if (this.isGameOver || this.isVictory) return;
    const next = Math.max(0, Math.min(4, this.targetLane + dir));
    if (next !== this.targetLane) {
      this.targetLane = next;
      this.playSfx('lane');
      this.spawnLaneShiftParticles();
    }
  }

  jump() {
    if (this.isGameOver || this.isVictory) return;
    if (!this.player.isJumping) {
      this.player.isJumping = true;
      this.player.jumpVel = -680;
      this.player.isSliding = false;
      this.player.slideTimer = 0;
      this.playSfx('jump');
    }
  }

  slide() {
    if (this.isGameOver || this.isVictory) return;
    if (this.player.isJumping) {
      // Subway Surfers fast-fall slam down!
      this.player.jumpVel = 950;
    }
    this.player.isSliding = true;
    this.player.slideTimer = 0.65;
    this.playSfx('slide');
  }

  restart() {
    this.isGameOver = false;
    this.isVictory = false;
    this.currentLane = 2;
    this.targetLane = 2;
    this.player.x = this.canvas.width / 2;
    this.player.y = this.canvas.height * 0.72;
    this.player.tilt = 0;
    this.player.jumpY = 0;
    this.player.jumpVel = 0;
    this.player.isJumping = false;
    this.player.isSliding = false;
    this.player.slideTimer = 0;
    this.player.invulnerableTimer = 0;
    this.player.hydration = 100;
    this.player.distance = 0;
    this.player.dropletsCollected = 0;
    this.player.cryoTimer = 0;

    this.obstacles = [];
    this.pickups = [];
    this.canopies = [];
    this.particles = [];
    this.nextSpawnDistance = 25;
  }

  spawnLaneShiftParticles() {
    const geom = this.getRoadGeometry();
    const x = geom.getLaneX(this.targetLane);
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: this.player.y + 12,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 50 + 20,
        life: 0.35,
        maxLife: 0.35,
        color: '#38bdf8',
        size: 3
      });
    }
  }

  spawnDustParticles() {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 26,
        y: this.player.y + 14,
        vx: (Math.random() - 0.5) * 110,
        vy: (Math.random() - 0.5) * 40 - 20,
        life: 0.4,
        maxLife: 0.4,
        color: '#f97316',
        size: 3.5
      });
    }
  }

  spawnHitParticles() {
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 20,
        y: this.player.y + this.player.jumpY,
        vx: (Math.random() - 0.5) * 220,
        vy: (Math.random() - 0.5) * 220,
        life: 0.5,
        maxLife: 0.5,
        color: '#ef4444',
        size: 4
      });
    }
  }

  spawnSplashParticles() {
    for (let i = 0; i < 18; i++) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 35,
        y: this.player.y + this.player.jumpY,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 160 - 40,
        life: 0.6,
        maxLife: 0.6,
        color: '#38bdf8',
        size: 4
      });
    }
  }

  spawnDropletParticles(x, y) {
    for (let i = 0; i < 7; i++) {
      this.particles.push({
        x: x || this.player.x,
        y: y || (this.player.y + this.player.jumpY),
        vx: (Math.random() - 0.5) * 120,
        vy: (Math.random() - 0.5) * 120 - 40,
        life: 0.45,
        maxLife: 0.45,
        color: '#06b6d4',
        size: 3.5
      });
    }
  }

  spawnObstacles(geom) {
    const d = this.player.distance;
    const laneW = geom.laneW;
    const spawnY = -120;
    const pattern = Math.floor(Math.random() * 6);

    if (pattern === 0) {
      // Ground hazard: Boiling asphalt rifts (Jump challenge!)
      const lane1 = Math.floor(Math.random() * 5);
      const lane2 = (lane1 + 2) % 5;
      this.obstacles.push({
        type: 'thermal_rift',
        lane: lane1,
        y: spawnY,
        w: laneW * 0.88,
        h: 30,
        tempLST: 52.8
      });
      this.obstacles.push({
        type: 'thermal_rift',
        lane: lane2,
        y: spawnY,
        w: laneW * 0.88,
        h: 30,
        tempLST: 51.5
      });
      // Floating coin in air over the rift to reward jumping
      this.pickups.push({
        type: 'water',
        lane: lane1,
        y: spawnY,
        inAir: true
      });
    } else if (pattern === 1) {
      // Overhead hazard: Scorching steam pipes (Slide challenge!)
      const lane = Math.floor(Math.random() * 4);
      this.obstacles.push({
        type: 'steam_pipe',
        lane: lane,
        y: spawnY,
        w: laneW * 0.9,
        h: 36,
        tempLST: 49.2
      });
      this.obstacles.push({
        type: 'steam_pipe',
        lane: lane + 1,
        y: spawnY,
        w: laneW * 0.9,
        h: 36,
        tempLST: 49.2
      });
    } else if (pattern === 2) {
      // Tall barrier / delivery van (Lane switch challenge!)
      const blockedLane = Math.floor(Math.random() * 5);
      this.obstacles.push({
        type: 'van',
        lane: blockedLane,
        y: spawnY,
        w: laneW * 0.84,
        h: 68,
        tempLST: 47.4
      });
      // Clear lane next to it with mist archway or water coin
      const freeLane = (blockedLane + 1) % 5;
      if (Math.random() < 0.4) {
        this.obstacles.push({
          type: 'mist_arch',
          lane: freeLane,
          y: spawnY,
          w: laneW * 0.95,
          h: 40,
          tempLST: 21.0
        });
      }
    } else if (pattern === 3) {
      // Shaded Tree Canopy corridor over a lane (Green sanctuary!)
      const canopyLane = Math.floor(Math.random() * 5);
      this.canopies.push({
        lane: canopyLane,
        y: spawnY,
        h: 320,
        tempLST: 22.1
      });
      // Line of hydration droplets under the trees
      for (let k = 0; k < 4; k++) {
        this.pickups.push({
          type: 'water',
          lane: canopyLane,
          y: spawnY + k * 65,
          inAir: false
        });
      }
    } else if (pattern === 4) {
      // Coin trail: 5 water droplets in a single lane
      const coinLane = Math.floor(Math.random() * 5);
      for (let k = 0; k < 5; k++) {
        this.pickups.push({
          type: 'water',
          lane: coinLane,
          y: spawnY + k * 48,
          inAir: false
        });
      }
      // Rare Cryo-Boost ice crystal power-up
      if (Math.random() < 0.25 && this.player.cryoTimer <= 0) {
        const cLane = (coinLane + 2) % 5;
        this.pickups.push({
          type: 'cryo',
          lane: cLane,
          y: spawnY + 70,
          inAir: false
        });
      }
    } else {
      // Mist archway + van combo
      const archLane = Math.floor(Math.random() * 5);
      this.obstacles.push({
        type: 'mist_arch',
        lane: archLane,
        y: spawnY,
        w: laneW * 0.95,
        h: 40,
        tempLST: 20.8
      });
      const vanLane = (archLane + 2) % 5;
      this.obstacles.push({
        type: 'van',
        lane: vanLane,
        y: spawnY - 30,
        w: laneW * 0.84,
        h: 68,
        tempLST: 48.0
      });
    }

    // Schedule next spawn distance
    const baseGap = Math.max(42, 70 - (d / 1000) * 25);
    this.nextSpawnDistance = d + baseGap;
  }

  update(dt) {
    if (this.isGameOver || this.isVictory) return;

    const geom = this.getRoadGeometry();

    // Speed progression: accelerates smoothly and endlessly as distance grows!
    const baseSpeed = 380 + this.player.distance * 0.42;
    const scrollSpeed = baseSpeed * (this.player.cryoTimer > 0 ? 1.25 : 1.0);
    this.currentKmh = Math.round(scrollSpeed / 9.5);

    // Distance progression
    this.player.distance += (scrollSpeed / 14) * dt;

    // Endless milestone check every 500m
    const currentMilestone = Math.floor(this.player.distance / 500);
    if (currentMilestone > this.milestonesPassed) {
      this.milestonesPassed = currentMilestone;
      arcadeTokens.addTokens(5, `Subway Heat Escape: ${currentMilestone * 500}m Milestone!`);
      this.milestoneBannerTimer = 3.5;
      this.milestoneBannerText = `🎉 ${currentMilestone * 500}m MILESTONE! (+5 ZEN TOKENS)`;
      this.playSfx('mist');
    }
    if (this.milestoneBannerTimer > 0) this.milestoneBannerTimer -= dt;

    // Smooth snappy Subway Surfers lane snapping
    const targetX = geom.getLaneX(this.targetLane);
    this.player.x += (targetX - this.player.x) * Math.min(1.0, 22.0 * dt);
    this.player.tilt = Math.max(-0.35, Math.min(0.35, (targetX - this.player.x) * 0.0024));

    // Jump physics with gravity
    if (this.player.isJumping) {
      this.player.jumpVel += 1850 * dt;
      this.player.jumpY += this.player.jumpVel * dt;
      if (this.player.jumpY >= 0) {
        this.player.jumpY = 0;
        this.player.jumpVel = 0;
        this.player.isJumping = false;
        this.spawnDustParticles();
      }
    }

    // Slide timer
    if (this.player.isSliding) {
      this.player.slideTimer -= dt;
      if (this.player.slideTimer <= 0) {
        this.player.isSliding = false;
      }
    }

    // Powerup / Invulnerability timers
    if (this.player.invulnerableTimer > 0) this.player.invulnerableTimer -= dt;
    if (this.player.cryoTimer > 0) this.player.cryoTimer -= dt;

    // Spawn obstacles
    if (this.player.distance >= this.nextSpawnDistance) {
      this.spawnObstacles(geom);
    }

    // Scroll canopies downward
    this.canopies.forEach(c => {
      c.y += scrollSpeed * dt;
    });
    this.canopies = this.canopies.filter(c => c.y < this.canvas.height + 150);

    // Check if player is currently under canopy shade or mist
    let inCoolZone = false;
    let currentTemp = 48.5 + Math.sin(this.player.distance * 0.08) * 3.5;

    this.canopies.forEach(c => {
      if (c.lane === this.targetLane) {
        if (this.player.y >= c.y && this.player.y <= c.y + c.h) {
          inCoolZone = true;
          currentTemp = c.tempLST;
        }
      }
    });

    // Hydration physics driven by NASA ECOSTRESS Surface Temp
    if (this.player.cryoTimer > 0) {
      // Cryo-boost ice shield: zero heat drain + cooling
      this.player.hydration = Math.min(100, this.player.hydration + 18 * dt);
      currentTemp = 18.0;
    } else if (inCoolZone) {
      // Shaded tree canopy: rapid hydration recovery
      this.player.hydration = Math.min(100, this.player.hydration + 40 * dt);
    } else {
      // Hot asphalt heat island: steady heat fatigue
      const heatFactor = Math.max(0.6, (currentTemp - 30) / 18);
      this.player.hydration = Math.max(0, this.player.hydration - 6.2 * heatFactor * dt);
    }

    // Update obstacles & collisions
    this.obstacles.forEach(o => {
      o.y += scrollSpeed * dt;

      // Check collision
      const laneX = geom.getLaneX(o.lane);
      const isPlayerInLane = Math.abs(this.player.x - laneX) < geom.laneW * 0.44;
      const isYInRange = Math.abs(this.player.y - (o.y + o.h / 2)) < (o.h / 2 + 18);

      if (isPlayerInLane && isYInRange) {
        if (o.type === 'thermal_rift') {
          // Can be jumped over!
          if (this.player.jumpY < -28) {
            // Jumped safely over the crack!
          } else if (this.player.invulnerableTimer <= 0 && this.player.cryoTimer <= 0) {
            this.player.hydration = Math.max(0, this.player.hydration - 18);
            this.player.invulnerableTimer = 1.0;
            this.playSfx('hit');
            this.spawnHitParticles();
          }
        } else if (o.type === 'steam_pipe') {
          // Can be slid under!
          if (this.player.isSliding) {
            // Slid safely under the pipe!
          } else if (this.player.invulnerableTimer <= 0 && this.player.cryoTimer <= 0) {
            this.player.hydration = Math.max(0, this.player.hydration - 18);
            this.player.invulnerableTimer = 1.0;
            this.playSfx('hit');
            this.spawnHitParticles();
          }
        } else if (o.type === 'van') {
          // Tall barrier: cannot jump or slide; must dodge!
          if (this.player.invulnerableTimer <= 0 && this.player.cryoTimer <= 0) {
            this.player.hydration = Math.max(0, this.player.hydration - 25);
            this.player.invulnerableTimer = 1.2;
            this.playSfx('hit');
            this.spawnHitParticles();
          }
        } else if (o.type === 'mist_arch') {
          // Hydration mist gateway
          if (!o.collected) {
            o.collected = true;
            this.player.hydration = Math.min(100, this.player.hydration + 25);
            this.playSfx('mist');
            this.spawnSplashParticles();
          }
        }
      }
    });
    this.obstacles = this.obstacles.filter(o => o.y < this.canvas.height + 150);

    // Update pickups (Water droplets & Cryo crystals)
    this.pickups.forEach(p => {
      p.y += scrollSpeed * dt;

      // Magnet effect when Cryo-Boost is active
      if (this.player.cryoTimer > 0 && p.type === 'water') {
        const pLaneX = geom.getLaneX(p.lane);
        p.x = p.x !== undefined ? p.x : pLaneX;
        p.x += (this.player.x - p.x) * Math.min(1.0, 14.0 * dt);
      }

      const pX = p.x !== undefined ? p.x : geom.getLaneX(p.lane);
      const isPlayerNear = Math.hypot(this.player.x - pX, (this.player.y + this.player.jumpY) - p.y) < 38;

      if (isPlayerNear && !p.collected) {
        p.collected = true;
        if (p.type === 'water') {
          this.player.hydration = Math.min(100, this.player.hydration + 2.5);
          this.player.dropletsCollected++;
          this.playSfx('coin');
          this.spawnDropletParticles(pX, p.y);
        } else if (p.type === 'cryo') {
          this.player.cryoTimer = 6.0;
          this.playSfx('mist');
          this.spawnSplashParticles();
        }
      }
    });
    this.pickups = this.pickups.filter(p => !p.collected && p.y < this.canvas.height + 120);

    // Update particles
    this.particles.forEach(pt => {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
    });
    this.particles = this.particles.filter(pt => pt.life > 0);

    // Game Over condition (Heat exhaustion)
    if (this.player.hydration <= 0) {
      this.isGameOver = true;
      arcadeTokens.recordHighScore('heat_escape', Math.floor(this.player.distance), 'meters');
      return;
    }

    arcadeTokens.recordHighScore('heat_escape', Math.floor(this.player.distance), 'meters');
    this.lastLST = currentTemp;
  }

  playSfx(type) {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const now = this.audioCtx.currentTime;

      if (type === 'lane') {
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);
        g.gain.setValueAtTime(0.08, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(g);
        g.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'jump') {
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(740, now + 0.16);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(g);
        g.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.17);
      } else if (type === 'slide') {
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);
        g.gain.setValueAtTime(0.09, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(g);
        g.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'coin') {
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(988, now);
        osc2.frequency.setValueAtTime(1318, now + 0.04);
        g.gain.setValueAtTime(0.10, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc1.connect(g);
        osc2.connect(g);
        g.connect(this.audioCtx.destination);
        osc1.start(now);
        osc2.start(now + 0.04);
        osc1.stop(now + 0.19);
        osc2.stop(now + 0.19);
      } else if (type === 'mist') {
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
        g.gain.setValueAtTime(0.14, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(g);
        g.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.23);
      } else if (type === 'hit') {
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.18);
        g.gain.setValueAtTime(0.20, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(g);
        g.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
      }
    } catch (e) {
      // AudioContext fallback
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const geom = this.getRoadGeometry();

    // 1. Urban Background (Deep night city with ambient heat haze)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0c0e18');
    bgGrad.addColorStop(0.6, '#18121a');
    bgGrad.addColorStop(1, '#1f1315');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Sidewalk borders on left and right of the 5 lanes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(geom.roadLeft - 40, 0, 40, h);
    ctx.fillRect(geom.roadLeft + geom.roadW, 0, 40, h);

    // 3. 5-Lane Subway Asphalt Surface
    ctx.fillStyle = '#171720';
    ctx.fillRect(geom.roadLeft, 0, geom.roadW, h);

    // Road Edge Curbs (Glowing neon borders)
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(geom.roadLeft, 0);
    ctx.lineTo(geom.roadLeft, h);
    ctx.moveTo(geom.roadLeft + geom.roadW, 0);
    ctx.lineTo(geom.roadLeft + geom.roadW, h);
    ctx.stroke();

    // 4. Moving Lane Dividers (Dashed stripes zooming down at high velocity)
    const stripeOffset = (this.player.distance * 22) % 40;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -stripeOffset;

    for (let l = 1; l < this.numLanes; l++) {
      const lx = geom.roadLeft + l * geom.laneW;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, h);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 5. Render Shaded Tree Canopies (Green cooling zones)
    this.canopies.forEach(c => {
      const cx = geom.roadLeft + c.lane * geom.laneW;
      const cy = c.y;

      // Leafy green shade overlay over the lane
      const canopyGrad = ctx.createLinearGradient(cx, cy, cx, cy + c.h);
      canopyGrad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
      canopyGrad.addColorStop(0.5, 'rgba(5, 150, 105, 0.45)');
      canopyGrad.addColorStop(1, 'rgba(16, 185, 129, 0.35)');

      ctx.fillStyle = canopyGrad;
      ctx.fillRect(cx, cy, geom.laneW, c.h);

      // Trellis borders
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx + 2, cy, geom.laneW - 4, c.h);

      // Canopy header label
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🌳 22°C CANOPY SHADE', cx + geom.laneW / 2, cy + 20);
    });

    // 6. Render Obstacles
    this.obstacles.forEach(o => {
      const ox = geom.roadLeft + o.lane * geom.laneW + (geom.laneW - o.w) / 2;
      const oy = o.y;

      if (o.type === 'thermal_rift') {
        // Ground asphalt boiling crack (Jump over!)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
        ctx.beginPath();
        ctx.roundRect(ox, oy, o.w, o.h, 6);
        ctx.fill();

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ox + 4, oy + o.h / 2);
        ctx.lineTo(ox + o.w * 0.3, oy + 4);
        ctx.lineTo(ox + o.w * 0.65, oy + o.h - 4);
        ctx.lineTo(ox + o.w - 4, oy + o.h / 2);
        ctx.stroke();

        ctx.fillStyle = '#fb923c';
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('🔥 JUMP!', ox + o.w / 2, oy + o.h / 2 + 3);
      } else if (o.type === 'steam_pipe') {
        // Overhead steam conduit (Slide under!)
        ctx.fillStyle = '#475569';
        ctx.fillRect(ox, oy, o.w, 14);

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(ox + o.w * 0.45, oy + 14, o.w * 0.1, 12); // nozzle

        // Billowing white steam jetting down
        const steamGrad = ctx.createLinearGradient(ox, oy + 14, ox, oy + o.h);
        steamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
        steamGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = steamGrad;
        ctx.fillRect(ox + o.w * 0.2, oy + 14, o.w * 0.6, o.h - 14);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('💨 SLIDE!', ox + o.w / 2, oy - 4);
      } else if (o.type === 'van') {
        // Tall delivery van / barrier (Lane switch!)
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(ox, oy, o.w, o.h, 8);
        ctx.fill();

        // Van roof
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(ox + 4, oy + 6, o.w - 8, o.h - 16, 6);
        ctx.fill();

        // Hazard flashers
        const blink = Math.sin(this.player.distance * 0.4) > 0;
        ctx.fillStyle = blink ? '#fbbf24' : '#78350f';
        ctx.fillRect(ox + 6, oy + o.h - 8, 8, 4);
        ctx.fillRect(ox + o.w - 14, oy + o.h - 8, 8, 4);

        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ BLOCKED', ox + o.w / 2, oy + o.h / 2);
      } else if (o.type === 'mist_arch') {
        // High-tech urban misting archway
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 3;
        ctx.strokeRect(ox, oy, o.w, o.h);

        const mistGlow = ctx.createLinearGradient(ox, oy, ox, oy + o.h);
        mistGlow.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        mistGlow.addColorStop(1, 'rgba(56, 189, 248, 0.05)');
        ctx.fillStyle = mistGlow;
        ctx.fillRect(ox, oy, o.w, o.h);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '800 10.5px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('💧 MIST STATION', ox + o.w / 2, oy + o.h / 2 + 4);
      }
    });

    // 7. Render Pickups (Water droplets & Cryo crystals)
    this.pickups.forEach(p => {
      const px = p.x !== undefined ? p.x : geom.getLaneX(p.lane);
      const py = p.y;

      if (p.type === 'water') {
        // Sparkling water droplet (coin)
        ctx.save();
        ctx.translate(px, py);
        const floatY = Math.sin(this.player.distance * 0.2 + p.lane) * 4;

        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, floatY, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(-3, floatY - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'cryo') {
        // Rare Cryo-Ice crystal power-up
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(this.player.distance * 0.05);

        ctx.fillStyle = '#a5f3fc';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(10, 0);
        ctx.lineTo(0, 12);
        ctx.lineTo(-10, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    });

    // 8. Render Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // 9. Render Player Electric Scooter (Subway Surfers perspective)
    ctx.save();
    const renderX = this.player.x;
    const renderY = this.player.y + this.player.jumpY;

    // Ground Shadow (stays on the ground when jumping, scales down with height)
    const shadowScale = Math.max(0.4, 1.0 + this.player.jumpY * 0.003);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(renderX, this.player.y + 16, 18 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Scooter Body with lean angle
    ctx.translate(renderX, renderY);
    ctx.rotate(this.player.tilt);

    // Invulnerability flashing
    const isFlashing = this.player.invulnerableTimer > 0 && Math.floor(this.player.invulnerableTimer * 12) % 2 === 0;

    if (!isFlashing) {
      // Cryo-boost ice shield bubble
      if (this.player.cryoTimer > 0) {
        ctx.strokeStyle = '#38bdf8';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, -4, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Scooter deck
      const isSliding = this.player.isSliding;
      const equippedSkin = arcadeTokens?.getEquippedItem?.('carPaint');
      const equippedCrown = arcadeTokens?.getEquippedItem?.('crown');
      const isGold = (equippedSkin?.id === 'golden_crown' || equippedCrown?.id === 'golden_crown');

      let deckFill = this.player.hydration > 50 ? '#38bdf8' : (this.player.hydration > 25 ? '#f59e0b' : '#ef4444');
      const gradColors = equippedSkin?.colors || equippedSkin?.gradient;
      if (isGold) {
        const goldGrad = ctx.createLinearGradient(0, -16, 0, 16);
        goldGrad.addColorStop(0, '#fef08a');
        goldGrad.addColorStop(0.3, '#ffd700');
        goldGrad.addColorStop(0.7, '#d97706');
        goldGrad.addColorStop(1, '#92400e');
        deckFill = goldGrad;
      } else if (gradColors && gradColors.length) {
        const grad = ctx.createLinearGradient(0, -16, 0, 16);
        gradColors.forEach((color, idx) => {
          grad.addColorStop(idx / (gradColors.length - 1), color);
        });
        deckFill = grad;
      } else if (equippedSkin?.hex) {
        deckFill = equippedSkin.hex;
      }

      // Headlight beam projecting forward
      const beamGrad = ctx.createLinearGradient(0, -18, 0, -120);
      beamGrad.addColorStop(0, isGold ? 'rgba(254, 240, 138, 0.55)' : 'rgba(231, 244, 52, 0.4)');
      beamGrad.addColorStop(1, 'rgba(231, 244, 52, 0.0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(-6, -18);
      ctx.lineTo(-24, -120);
      ctx.lineTo(24, -120);
      ctx.lineTo(6, -18);
      ctx.closePath();
      ctx.fill();

      // Scooter frame
      const isCarbon = equippedSkin?.texture === 'carbon_matrix' || equippedSkin?.id === 'carbon_matrix' || equippedSkin?.pattern === 'carbon';
      const isMagma = equippedSkin?.texture === 'volcanic_magma' || equippedSkin?.id === 'volcanic_magma' || equippedSkin?.pattern === 'magma';
      ctx.fillStyle = isGold ? '#78350f' : (isCarbon ? '#090d16' : (isMagma ? '#450a0a' : '#0f172a'));
      ctx.fillRect(-5, isSliding ? -6 : -16, 10, isSliding ? 20 : 32);

      // Carbon matrix cyan pinstripe or Magma flame pinstripe
      if (isCarbon) {
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(-1, isSliding ? -6 : -16, 2, isSliding ? 20 : 32);
      } else if (isMagma) {
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-1.5, isSliding ? -6 : -16, 3, isSliding ? 20 : 32);
      }

      // Rider helmet & silhouette
      ctx.fillStyle = deckFill;
      ctx.shadowColor = isGold ? '#ffd700' : (typeof deckFill === 'string' ? deckFill : '#38bdf8');
      ctx.shadowBlur = isGold ? 16 : 12;
      ctx.beginPath();
      ctx.arc(0, isSliding ? -4 : -16, isSliding ? 8 : 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Neon or Solid Gold Wheels
      ctx.fillStyle = isGold ? '#fbbf24' : '#E7F434'; // 24K Gold or Space Apps Neon Yellow
      ctx.fillRect(-4, isSliding ? 10 : 14, 8, 4);

      // Floating Headwear: 24K Golden Sovereign Crown or Halos
      if (isGold || equippedCrown?.id === 'golden_crown') {
        const crownY = isSliding ? -16 : -30;
        ctx.save();
        ctx.translate(0, crownY);

        // Golden Stardust Particles emitted in wake
        if (Math.random() < 0.35) {
          this.particles.push({
            x: renderX + (Math.random() * 14 - 7),
            y: renderY + crownY + (Math.random() * 6 - 3),
            vx: (Math.random() - 0.5) * 16,
            vy: 24 + Math.random() * 16,
            size: 2.2 + Math.random() * 1.6,
            color: Math.random() < 0.5 ? '#fef08a' : '#ffd700',
            life: 0.5,
            maxLife: 0.5
          });
        }

        // Crown Base Band
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 10;
        ctx.fillRect(-10, 2, 20, 3.5);

        // 5 Crown Spires
        ctx.beginPath();
        ctx.moveTo(-10, 2);
        ctx.lineTo(-8, -7);
        ctx.lineTo(-4, 0);
        ctx.lineTo(0, -10); // Center tallest peak
        ctx.lineTo(4, 0);
        ctx.lineTo(8, -7);
        ctx.lineTo(10, 2);
        ctx.closePath();
        ctx.fill();

        // Jewels on spires
        ctx.shadowBlur = 6;
        // Center Ruby
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -9, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Flanking Emeralds
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(-8, -6.5, 1.7, 0, Math.PI * 2);
        ctx.arc(8, -6.5, 1.7, 0, Math.PI * 2);
        ctx.fill();

        // Sapphires on base
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(-5, 3.8, 1.3, 0, Math.PI * 2);
        ctx.arc(5, 3.8, 1.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (equippedCrown?.id === 'cyber_halo') {
        const haloY = isSliding ? -16 : -28;
        ctx.save();
        ctx.translate(0, haloY);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.4;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(0, 0, 13, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (equippedCrown?.id === 'phoenix_crest') {
        const crestY = isSliding ? -16 : -28;
        ctx.save();
        ctx.translate(0, crestY);
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(-8, 2);
        ctx.lineTo(-4, -9);
        ctx.lineTo(0, -12);
        ctx.lineTo(4, -9);
        ctx.lineTo(8, 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (equippedCrown?.id === 'celestial_diadem') {
        const diademY = isSliding ? -16 : -28;
        ctx.save();
        ctx.translate(0, diademY);
        ctx.fillStyle = '#e0f2fe';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(-9, 1);
        ctx.lineTo(-5, -5);
        ctx.lineTo(0, -9);
        ctx.lineTo(5, -5);
        ctx.lineTo(9, 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, -6, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();

    // 10. Top HUD: 5-Lane Track Indicator & Telemetry
    // Top-Center: 5-Lane Position Snap Tracker
    const trackW = 190;
    const trackH = 34;
    const trackX = (w - trackW) / 2;
    const trackY = 16;

    ctx.fillStyle = 'rgba(12, 14, 24, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(trackX, trackY, trackW, trackH, 17);
    ctx.fill();
    ctx.stroke();

    for (let l = 0; l < 5; l++) {
      const segX = trackX + 10 + l * 34;
      const isCurrent = l === this.targetLane;
      ctx.fillStyle = isCurrent ? '#E7F434' : 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.roundRect(segX, trackY + 6, 28, 22, 6);
      ctx.fill();

      ctx.fillStyle = isCurrent ? '#0c0e18' : '#94a3b8';
      ctx.font = isCurrent ? 'bold 11.5px system-ui' : '10.5px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`L${l + 1}`, segX + 14, trackY + 21);
    }

    // Top-Left: Distance to Central Park
    ctx.beginPath();
    ctx.roundRect(20, trackY, 230, trackH, 17);
    ctx.fillStyle = 'rgba(12, 14, 24, 0.88)';
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`🏃 ${Math.floor(this.player.distance)}m · ⚡ ${this.currentKmh || 40} km/h`, 32, trackY + 21);

    // Top-Right: Hydration & Droplets Count
    const rightHudW = 190;
    ctx.beginPath();
    ctx.roundRect(w - rightHudW - 20, trackY, rightHudW, trackH, 17);
    ctx.fillStyle = 'rgba(12, 14, 24, 0.88)';
    ctx.fill();
    ctx.stroke();

    const hydraColor = this.player.hydration > 50 ? '#38bdf8' : (this.player.hydration > 25 ? '#f59e0b' : '#ef4444');
    ctx.fillStyle = hydraColor;
    ctx.font = '800 12.5px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`💧 ${Math.round(this.player.hydration)}%`, w - rightHudW - 8, trackY + 21);

    ctx.fillStyle = '#E7F434';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`🪙 ${this.player.dropletsCollected}`, w - 32, trackY + 21);

    // 10.5 Milestone Celebration Banner
    if (this.milestoneBannerTimer > 0) {
      const bannerW = Math.min(w - 40, 480);
      const bannerH = 44;
      const bannerX = (w - bannerW) / 2;
      const bannerY = 62;

      ctx.fillStyle = 'rgba(12, 14, 24, 0.94)';
      ctx.strokeStyle = '#E7F434';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#E7F434';
      ctx.font = '800 13.5px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(this.milestoneBannerText, w / 2, bannerY + 27);
    }

    drawReadout(ctx, w, h, `Surface ${(this.lastLST ?? 48).toFixed(1)} °C  ·  Lane ${this.targetLane + 1} / 5`);

    // Game Over Overlay
    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.92)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ef4444';
      ctx.font = '800 30px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🔥 HEAT STROKE FATIGUE', w / 2, h / 2 - 42);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 15px system-ui';
      ctx.fillText(`Surviving Run: ${Math.floor(this.player.distance)}m at ${this.currentKmh || 40} km/h`, w / 2, h / 2 - 8);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 13.5px system-ui';
      ctx.fillText(`💧 ${this.player.dropletsCollected} Droplets · 🪙 ${this.milestonesPassed * 5} Milestone Tokens Earned`, w / 2, h / 2 + 20);
      ctx.fillStyle = '#E7F434';
      ctx.font = 'bold 14px system-ui';
      ctx.fillText('Press R to Dash Again · Press Esc to Exit', w / 2, h / 2 + 54);
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
    if (this.canvas) {
      this.canvas.removeEventListener('touchstart', this.onTouchStart);
      this.canvas.removeEventListener('touchend', this.onTouchEnd);
    }
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
      gatesCleared: 0
    };

    this.ghostPurity = 100;
    this.damageFlash = 0;
    this.screenShake = 0;
    this.damagePopups = [];
    this.particles = [];
    this.lastDamageSfxTime = 0;
    this.milestonesPassed = 0;
    this.milestoneBannerTimer = 0;
    this.milestoneBannerText = '';

    this.smokestackGates = [];
    this.vaporDrops = [];
    this.initAtmosphere();
    this.initInput();
  }

  initAtmosphere() {
    this.smokestackGates = [];
    this.vaporDrops = [];
    const gateGap = 205; // Initial vertical flight corridor

    // Initialize initial conveyor of 8 gates
    for (let i = 0; i < 8; i++) {
      const topHeight = 60 + Math.random() * (this.canvas.height - gateGap - 140);
      this.smokestackGates.push({
        x: 550 + i * 360,
        w: 64,
        topH: topHeight,
        bottomY: topHeight + gateGap,
        passed: false,
        pollutant: i % 2 === 0 ? 'SO₂ (Sulfur Dioxide)' : 'NO₂ (Nitrogen Dioxide)'
      });

      this.vaporDrops.push({
        x: 550 + i * 360 + 180,
        y: topHeight + gateGap / 2 + (Math.random() * 40 - 20),
        collected: false
      });
    }
  }

  playSfx(type) {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const now = this.audioCtx.currentTime;

      if (type === 'flap') {
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.12);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(g);
        g.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'acid') {
        // Harsh sizzling alarm buzz
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(140, now + 0.08);
        g.gain.setValueAtTime(0.22, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(g);
        g.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
      } else if (type === 'pickup') {
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        g.gain.setValueAtTime(0.14, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(g);
        g.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
      } else if (type === 'milestone') {
        const chord = [523.25, 659.25, 783.99, 1046.50];
        chord.forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const g = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);
          g.gain.setValueAtTime(0.10, now + idx * 0.04);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);
          osc.connect(g);
          g.connect(this.audioCtx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.36);
        });
      }
    } catch (e) {
      // Audio fallback
    }
  }

  initInput() {
    this.flap = () => {
      if (this.isGameOver) {
        this.restart();
        return;
      }
      this.cloud.vy = this.cloud.liftStrength;
      this.playSfx('flap');
    };

    this.onKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.flap();
      }
      if (e.key === 'r' || e.key === 'R') {
        if (this.isGameOver) this.restart();
      }
      if (e.key === 'Escape') { this.stop(); this.onExit?.(); }
    };

    this.onPointerDown = () => this.flap();

    window.addEventListener('keydown', this.onKeyDown);
    this.canvas?.addEventListener?.('pointerdown', this.onPointerDown);
  }

  restart() {
    this.isGameOver = false;
    this.cloud.y = this.canvas.height * 0.45;
    this.cloud.vy = 0;
    this.cloud.purity = 100;
    this.ghostPurity = 100;
    this.damageFlash = 0;
    this.screenShake = 0;
    this.damagePopups = [];
    this.particles = [];
    this.cloud.gatesCleared = 0;
    this.cloud.distance = 0;
    this.milestonesPassed = 0;
    this.milestoneBannerTimer = 0;
    this.initAtmosphere();
  }

  update(dt) {
    if (this.isGameOver) return;

    // Aerodynamic gravity and lift
    this.cloud.vy += this.cloud.gravity * dt;
    this.cloud.y += this.cloud.vy * dt;
    this.cloud.distance += dt * 40;

    // Screen ceiling & floor collision (Crashing into mountain ridge or stratopause)
    if (this.cloud.y < 20 || this.cloud.y > this.canvas.height - 30) {
      this.cloud.purity = 0;
      this.damageFlash = 1.0;
      this.screenShake = 12;
      this.isGameOver = true;
      arcadeTokens.recordHighScore('cloud_courier', this.cloud.gatesCleared, 'gates');
      return;
    }

    // Smooth lagging ghost purity bar
    if (this.ghostPurity > this.cloud.purity) {
      this.ghostPurity = Math.max(this.cloud.purity, this.ghostPurity - 26 * dt);
    } else {
      this.ghostPurity = this.cloud.purity;
    }

    // Accelerating infinite wind speed
    const scrollSpeed = 165 + Math.min(240, this.cloud.gatesCleared * 3.8);

    // Update smokestack obstacles
    this.smokestackGates.forEach(g => {
      g.x -= scrollSpeed * dt;

      // Passing gate successfully
      if (!g.passed && g.x + g.w < this.cloud.x) {
        g.passed = true;
        this.cloud.gatesCleared += 1;
        arcadeTokens.addTokens(1, 'Navigated Clean Air Channel');

        // Endless milestone check every 10 gates
        const milestone = Math.floor(this.cloud.gatesCleared / 10);
        if (milestone > this.milestonesPassed) {
          this.milestonesPassed = milestone;
          arcadeTokens.addTokens(5, `Cloud Courier: ${milestone * 10} Gates Milestone!`);
          this.milestoneBannerTimer = 3.5;
          this.milestoneBannerText = `🎉 ${milestone * 10} GATES CLEARED! (+5 ZEN TOKENS)`;
          this.playSfx('milestone');
        }
      }

      // Collision with pollution plumes / smokestack towers
      if (this.cloud.x + 20 >= g.x && this.cloud.x - 20 <= g.x + g.w) {
        if (this.cloud.y - 16 <= g.topH || this.cloud.y + 16 >= g.bottomY) {
          // Take acid pollution damage
          this.cloud.purity = Math.max(0, this.cloud.purity - 46 * dt);
          this.damageFlash = Math.min(0.65, this.damageFlash + 0.22);
          this.screenShake = 3.5;

          // Sizzling soot and acid particles (lightweight)
          if (this.particles.length < 20) {
            this.particles.push({
              x: this.cloud.x + (Math.random() * 16 - 8),
              y: this.cloud.y + (Math.random() * 12 - 6),
              vx: -scrollSpeed * 0.4 + (Math.random() - 0.5) * 40,
              vy: (Math.random() - 0.5) * 50,
              size: 3 + Math.random() * 4,
              color: Math.random() < 0.5 ? '#ef4444' : '#475569',
              life: 0.35,
              maxLife: 0.35
            });
          }

          // Damage SFX and rising red damage popup
          const now = performance.now();
          if (now - this.lastDamageSfxTime > 320) {
            this.lastDamageSfxTime = now;
            this.playSfx('acid');
            this.damagePopups.push({
              x: this.cloud.x + 24,
              y: this.cloud.y - 14,
              vy: -35,
              text: `-15% ${g.pollutant.split(' ')[0]}!`,
              color: '#ef4444',
              life: 0.85,
              maxLife: 0.85
            });
          }

          if (this.cloud.purity <= 0) {
            this.isGameOver = true;
          }
        }
      }
    });

    // Infinite gate generator: recycle passed gates
    this.smokestackGates = this.smokestackGates.filter(g => g.x + g.w > -140);
    while (this.smokestackGates.length < 8) {
      const lastX = this.smokestackGates.reduce((m, g) => Math.max(m, g.x), this.cloud.x + 300);
      const gateSpacing = Math.max(260, 360 - this.cloud.gatesCleared * 1.5);
      const gateGap = Math.max(145, 205 - this.cloud.gatesCleared * 0.9);
      const topHeight = 60 + Math.random() * (this.canvas.height - gateGap - 140);
      const nextGateIdx = this.cloud.gatesCleared + this.smokestackGates.length;

      this.smokestackGates.push({
        x: lastX + gateSpacing,
        w: 64,
        topH: topHeight,
        bottomY: topHeight + gateGap,
        passed: false,
        pollutant: nextGateIdx % 2 === 0 ? 'SO₂ (Sulfur Dioxide)' : 'NO₂ (Nitrogen Dioxide)'
      });

      this.vaporDrops.push({
        x: lastX + gateSpacing + gateSpacing / 2,
        y: topHeight + gateGap / 2 + (Math.random() * 40 - 20),
        collected: false
      });
    }

    // Collect clean vapor motes
    this.vaporDrops.forEach(v => {
      v.x -= scrollSpeed * dt;
      if (!v.collected && Math.hypot(this.cloud.x - v.x, this.cloud.y - v.y) < 34) {
        v.collected = true;
        this.cloud.purity = Math.min(100, this.cloud.purity + 18);
        this.playSfx('pickup');
      }
    });
    this.vaporDrops = this.vaporDrops.filter(v => !v.collected && v.x > -80);

    // Update particles
    this.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    this.particles = this.particles.filter(p => p.life > 0);

    // Update damage popups
    this.damagePopups.forEach(pop => {
      pop.y += pop.vy * dt;
      pop.life -= dt;
    });
    this.damagePopups = this.damagePopups.filter(pop => pop.life > 0);

    // Timers
    if (this.milestoneBannerTimer > 0) this.milestoneBannerTimer -= dt;

    arcadeTokens.recordHighScore('cloud_courier', this.cloud.gatesCleared, 'gates');
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();

    // Screen Shake on damage impact
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
      this.screenShake = Math.max(0, this.screenShake - 20 * 0.016);
    }

    // 1. Atmospheric Dusk Sky
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#090d16');
    sky.addColorStop(0.5, '#1e1b4b');
    sky.addColorStop(1, '#0f172a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // 2. Smokestack pollution gates (NASA OMI plumes)
    this.smokestackGates.forEach(g => {
      // Top smokestack & plume
      const topPlumeGrad = ctx.createLinearGradient(g.x, g.topH, g.x, 0);
      topPlumeGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      topPlumeGrad.addColorStop(1, 'rgba(153, 27, 27, 0.65)');
      ctx.fillStyle = topPlumeGrad;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(g.x, 0, g.w, g.topH, [0, 0, 10, 10]);
      ctx.fill();
      ctx.stroke();

      // Industrial stack hazard rings
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(g.x + 4, g.topH - 12, g.w - 8, 4);

      // Bottom smokestack & plume
      const botPlumeGrad = ctx.createLinearGradient(g.x, g.bottomY, g.x, h);
      botPlumeGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      botPlumeGrad.addColorStop(1, 'rgba(153, 27, 27, 0.65)');
      ctx.fillStyle = botPlumeGrad;
      ctx.beginPath();
      ctx.roundRect(g.x, g.bottomY, g.w, h - g.bottomY, [10, 10, 0, 0]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(g.x + 4, g.bottomY + 8, g.w - 8, 4);

      // Pollutant warning label
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 9.5px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(g.pollutant, g.x + g.w / 2, g.topH - 18);
    });

    // 3. Pure Vapor Pickups
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

    // 4. Particles (Acid fumes & pure droplets)
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // 5. Cloud Player with Skin & Crown
    ctx.save();
    ctx.translate(this.cloud.x, this.cloud.y);
    const tilt = Math.max(-0.4, Math.min(0.4, this.cloud.vy * 0.0015));
    ctx.rotate(tilt);

    const equippedGlider = arcadeTokens?.getEquippedItem?.('gliderSkin');
    const equippedCrown = arcadeTokens?.getEquippedItem?.('crown');

    // Cloud Body Base Color
    let cloudColor = '#f8fafc';
    let cloudGlow = '#38bdf8';

    if (this.cloud.purity < 40) {
      cloudColor = '#64748b'; // Acid soot stain
      cloudGlow = '#ef4444';
    } else if (equippedGlider?.id === 'golden_cloud') {
      cloudColor = '#fef08a';
      cloudGlow = '#fbbf24';
    } else if (equippedGlider?.id === 'stellar_supernova') {
      cloudColor = '#fed7aa';
      cloudGlow = '#f59e0b';
    } else if (equippedGlider?.id === 'aurora') {
      cloudColor = '#a7f3d0';
      cloudGlow = '#10b981';
    } else if (equippedGlider?.id === 'nebula') {
      cloudColor = '#fbcfe8';
      cloudGlow = '#ec4899';
    }

    ctx.fillStyle = cloudColor;
    ctx.shadowColor = cloudGlow;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.arc(14, -4, 14, 0, Math.PI * 2);
    ctx.arc(-14, 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Equipped Floating Crown on Cloud
    if (equippedCrown?.id === 'golden_crown') {
      ctx.save();
      ctx.translate(0, -22);

      // Golden Stardust
      if (Math.random() < 0.3) {
        this.particles.push({
          x: this.cloud.x + (Math.random() * 12 - 6),
          y: this.cloud.y - 22,
          vx: -40,
          vy: (Math.random() - 0.5) * 15,
          size: 2,
          color: '#fef08a',
          life: 0.4,
          maxLife: 0.4
        });
      }

      // 24K Sovereign Crown
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 8;
      ctx.fillRect(-9, 2, 18, 3);

      ctx.beginPath();
      ctx.moveTo(-9, 2);
      ctx.lineTo(-7, -6);
      ctx.lineTo(-3, 0);
      ctx.lineTo(0, -9);
      ctx.lineTo(3, 0);
      ctx.lineTo(7, -6);
      ctx.lineTo(9, 2);
      ctx.closePath();
      ctx.fill();

      // Ruby & Emerald jewels
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -8, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(-7, -5.5, 1.5, 0, Math.PI * 2);
      ctx.arc(7, -5.5, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else if (equippedCrown?.id === 'cyber_halo') {
      ctx.save();
      ctx.translate(0, -20);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 3.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (equippedCrown?.id === 'phoenix_crest') {
      ctx.save();
      ctx.translate(0, -20);
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-7, 2);
      ctx.lineTo(-3, -8);
      ctx.lineTo(0, -11);
      ctx.lineTo(3, -8);
      ctx.lineTo(7, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (equippedCrown?.id === 'celestial_diadem') {
      ctx.save();
      ctx.translate(0, -20);
      ctx.fillStyle = '#e0f2fe';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-8, 1);
      ctx.lineTo(-4, -5);
      ctx.lineTo(0, -8);
      ctx.lineTo(4, -5);
      ctx.lineTo(8, 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, -5.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // 6. Floating Damage Popups (-15% ACID SO₂!)
    this.damagePopups.forEach(pop => {
      ctx.fillStyle = pop.color;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 8;
      ctx.font = '800 13px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.shadowBlur = 0;
    });

    // 7. Damage Flash Overlay (Lightweight, zero-lag performance)
    if (this.damageFlash > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${this.damageFlash * 0.20})`;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = `rgba(239, 68, 68, ${this.damageFlash * 0.70})`;
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, w, h);

      this.damageFlash = Math.max(0, this.damageFlash - 3.8 * 0.016);
    }

    // 8. Milestone Celebration Banner
    if (this.milestoneBannerTimer > 0) {
      const bannerW = Math.min(w - 40, 480);
      const bannerH = 44;
      const bannerX = (w - bannerW) / 2;
      const bannerY = 24;

      ctx.fillStyle = 'rgba(12, 14, 24, 0.94)';
      ctx.strokeStyle = '#E7F434';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#E7F434';
      ctx.font = '800 13.5px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(this.milestoneBannerText, w / 2, bannerY + 27);
    }

    const hudY = h - 96;
    drawReadout(ctx, w, h, `Gates cleared · ${this.cloud.gatesCleared}`, 224);
    ctx.fillStyle = 'rgba(14, 27, 26, .90)';
    ctx.strokeStyle = 'rgba(255, 255, 255, .14)';

    // 10. Right: Cloud Purity Bar with Red Lagging Ghost Health Bar
    const barBoxW = 210;
    ctx.beginPath();
    ctx.roundRect(w - barBoxW - 24, hudY, barBoxW, 72, 14);
    ctx.fill();
    ctx.stroke();

    const purityColor = this.cloud.purity > 50 ? '#38bdf8' : (this.cloud.purity > 25 ? '#f59e0b' : '#ef4444');
    ctx.fillStyle = purityColor;
    ctx.font = '800 17px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`☁️ ${Math.round(this.cloud.purity)}%`, w - 42, hudY + 34);

    if (this.cloud.purity < 35) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 10px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText('⚠️ ACID DEGRADATION', w - barBoxW - 10, hudY + 34);
    }

    const barX = w - barBoxW - 6;
    const barW = barBoxW - 36;
    const barY = hudY + 44;
    const barH = 10;

    // Health bar container
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 5);
    ctx.fill();

    // Red Ghost Bar (Slowly catching up to show exact chunk of health lost!)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * (this.ghostPurity / 100), barH, 5);
    ctx.fill();

    // Active Purity Bar
    ctx.fillStyle = purityColor;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * (this.cloud.purity / 100), barH, 5);
    ctx.fill();

    // 11. Game Over Overlay
    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.92)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ef4444';
      ctx.font = '800 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('☁️ CLOUD POLLUTED BY SO₂/NO₂', w / 2, h / 2 - 40);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 14.5px system-ui';
      ctx.fillText(`Moisture purity collapsed into acid precipitation after ${this.cloud.gatesCleared} gates.`, w / 2, h / 2 - 5);
      ctx.fillStyle = '#E7F434';
      ctx.font = '600 13px system-ui';
      ctx.fillText(`🪙 ${this.milestonesPassed * 5} Milestone Tokens Earned`, w / 2, h / 2 + 22);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px system-ui';
      ctx.fillText('Press Space or R to Try Again · Press Esc to Exit', w / 2, h / 2 + 55);
    }

    ctx.restore();
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    const loop = (t) => {
      if (!this.isRunning) return;
      if (!this.isPaused) {
        const dt = Math.min(0.05, Math.max(0.001, (t - (this.lastTime || t)) / 1000 || 0.016));
        this.lastTime = t;
        this.update(dt);
        this.render();
      } else {
        this.lastTime = t;
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
          arcadeTokens.addTokens(5, 'NASA Aura Research Mission Complete');
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

    drawReadout(ctx, w, h, `Canisters · ${this.canistersCollected} / ${this.targetCanisters}`);

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
      ctx.fillText('All 15 ozone samples collected.', w / 2, h / 2);
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
    this.lastTime = performance.now();
    const loop = (t) => {
      if (!this.isRunning) return;
      if (!this.isPaused) {
        const dt = Math.min(0.05, Math.max(0.001, (t - (this.lastTime || t)) / 1000 || 0.016));
        this.lastTime = t;
        this.update(dt);
        this.render();
      } else {
        this.lastTime = t;
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
    this.audioCtx = audioCtx;
    this.onExit = onExit;

    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.rafId = null;

    // Active Sea Turtle Physics & Health
    this.turtle = {
      x: 140,
      y: canvas.height * 0.45,
      vy: 0,
      swimStrength: -210,
      diveStrength: 340,
      gravity: 280,
      flipperAngle: 0,
      hp: 100,
      stamina: 100,
      isDashing: false,
      dashTimer: 0,
      invulnTimer: 0,
      isBraking: false
    };

    this.ghostHp = 100;
    this.distance = 0;
    this.milestonesPassed = 0;
    this.milestoneBannerTimer = 0;
    this.milestoneBannerText = '';

    // Damage & Screen effects
    this.biteFlash = 0;
    this.screenShake = 0;
    this.damagePopups = [];
    this.particles = [];
    this.bubbles = [];

    // Entities
    this.corals = [];
    this.predators = [];
    this.seaSponges = [];

    this.nextPredatorDist = 300;
    this.coralsRevived = 0;
    this.predatorsEvaded = 0;

    this.initReef();
    this.initInput();
  }

  initReef() {
    this.corals = [];
    this.predators = [];
    this.seaSponges = [];

    // Generate initial undulating reef cavern (Floor AND Ceiling corals across entire screen)
    for (let i = 0; i < 16; i++) {
      const cx = 350 + i * 160;
      this.spawnCoralPair(cx, i);
    }

    // Ambient floating bubbles
    for (let b = 0; b < 24; b++) {
      this.bubbles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vy: -20 - Math.random() * 40,
        r: 2 + Math.random() * 4
      });
    }
  }

  spawnCoralPair(x, index) {
    const h = this.canvas.height;
    const isBleached = (index % 4 === 1);
    const coralType = index % 3; // 0: Staghorn, 1: Brain Coral, 2: Sea Fan

    // Floor Coral (grows upward from sand)
    const floorH = 90 + Math.random() * 140;
    this.corals.push({
      x,
      y: h - 35,
      height: floorH,
      width: 48 + Math.random() * 26,
      type: coralType,
      isCeiling: false,
      bleached: isBleached,
      revived: false
    });

    // Ceiling Coral (hangs downward like stalactite reef)
    const ceilingH = 80 + Math.random() * 130;
    this.corals.push({
      x: x + 70,
      y: 0,
      height: ceilingH,
      width: 44 + Math.random() * 24,
      type: (coralType + 1) % 3,
      isCeiling: true,
      bleached: false,
      revived: false
    });

    // Spawn healing sea sponge periodically
    if (index % 3 === 0) {
      this.seaSponges.push({
        x: x + 80,
        y: h * 0.45 + (Math.random() * 140 - 70),
        collected: false
      });
    }
  }

  playSfx(type) {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const now = this.audioCtx.currentTime;

      if (type === 'paddle') {
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.14);
        g.gain.setValueAtTime(0.14, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(g);
        g.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'dive') {
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);
        g.gain.setValueAtTime(0.16, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(g);
        g.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
      } else if (type === 'dash') {
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.22);
        g.gain.setValueAtTime(0.20, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(g);
        g.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.23);
      } else if (type === 'bite') {
        // Terrifying predatory crunch
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(120, now);
        osc1.frequency.exponentialRampToValueAtTime(40, now + 0.22);
        osc2.frequency.setValueAtTime(280, now);
        osc2.frequency.exponentialRampToValueAtTime(80, now + 0.16);
        g.gain.setValueAtTime(0.30, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc1.connect(g);
        osc2.connect(g);
        g.connect(this.audioCtx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.23);
        osc2.stop(now + 0.23);
      } else if (type === 'scrape') {
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(95, now + 0.14);
        g.gain.setValueAtTime(0.18, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(g);
        g.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'upwelling') {
        const chord = [392.00, 523.25, 659.25];
        chord.forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const g = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.03);
          g.gain.setValueAtTime(0.12, now + idx * 0.03);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.28);
          osc.connect(g);
          g.connect(this.audioCtx.destination);
          osc.start(now + idx * 0.03);
          osc.stop(now + idx * 0.03 + 0.29);
        });
      } else if (type === 'milestone') {
        const chord = [440, 554.37, 659.25, 880];
        chord.forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const g = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          g.gain.setValueAtTime(0.12, now + idx * 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.4);
          osc.connect(g);
          g.connect(this.audioCtx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.42);
        });
      }
    } catch (e) {
      // Audio fallback
    }
  }

  initInput() {
    this.paddle = () => {
      if (this.isGameOver) {
        this.restart();
        return;
      }
      this.turtle.vy = this.turtle.swimStrength;
      this.turtle.flipperAngle = 0.55;
      this.playSfx('paddle');
    };

    this.diveBomb = () => {
      if (this.isGameOver) return;
      this.turtle.vy = this.turtle.diveStrength;
      this.turtle.flipperAngle = -0.55;
      this.playSfx('dive');
    };

    this.dash = () => {
      if (this.isGameOver) return;
      if (this.turtle.stamina >= 30 && !this.turtle.isDashing) {
        this.turtle.stamina -= 30;
        this.turtle.isDashing = true;
        this.turtle.dashTimer = 0.38;
        this.turtle.invulnTimer = 0.45;
        this.playSfx('dash');

        // Hydro jet bubble blast
        for (let b = 0; b < 14; b++) {
          this.bubbles.push({
            x: this.turtle.x - 20,
            y: this.turtle.y + (Math.random() * 16 - 8),
            vy: (Math.random() - 0.5) * 60,
            r: 3 + Math.random() * 5
          });
        }
      }
    };

    this.onKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.paddle();
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.diveBomb();
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'Shift') {
        e.preventDefault();
        this.dash();
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.turtle.isBraking = true;
      }
      if (e.key === 'r' || e.key === 'R') {
        if (this.isGameOver) this.restart();
      }
      if (e.key === 'Escape') { this.stop(); this.onExit?.(); }
    };

    this.onKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.turtle.isBraking = false;
      }
    };

    this.onPointerDown = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const clickX = e.clientX - rect.left;

      if (this.isGameOver) {
        this.restart();
        return;
      }

      if (clickX > this.canvas.width * 0.7) {
        // Right side: Hydro Dash
        this.dash();
      } else if (clickY > this.canvas.height * 0.6) {
        // Bottom half: Dive-Bomb
        this.diveBomb();
      } else {
        // Top half: Paddle Up
        this.paddle();
      }
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.canvas?.addEventListener?.('pointerdown', this.onPointerDown);
  }

  restart() {
    this.isGameOver = false;
    this.turtle.y = this.canvas.height * 0.45;
    this.turtle.vy = 0;
    this.turtle.hp = 100;
    this.ghostHp = 100;
    this.turtle.stamina = 100;
    this.turtle.isDashing = false;
    this.turtle.dashTimer = 0;
    this.turtle.invulnTimer = 0;
    this.turtle.isBraking = false;
    this.distance = 0;
    this.milestonesPassed = 0;
    this.milestoneBannerTimer = 0;
    this.biteFlash = 0;
    this.screenShake = 0;
    this.damagePopups = [];
    this.particles = [];
    this.nextPredatorDist = 280;
    this.coralsRevived = 0;
    this.predatorsEvaded = 0;
    this.initReef();
  }

  spawnPredator() {
    const isShark = Math.random() < 0.65;
    const spawnY = 80 + Math.random() * (this.canvas.height - 180);

    this.predators.push({
      x: this.canvas.width + 100,
      y: spawnY,
      type: isShark ? 'shark' : 'barracuda',
      w: isShark ? 68 : 52,
      h: isShark ? 28 : 18,
      speed: isShark ? (190 + Math.random() * 50) : (270 + Math.random() * 80),
      state: 'patrolling', // 'patrolling', 'hunting', 'lunging', 'evaded'
      lungeTimer: 0,
      jawOpen: 0,
      passed: false
    });
  }

  update(dt) {
    if (this.isGameOver) return;

    // Stamina regeneration
    this.turtle.stamina = Math.min(100, this.turtle.stamina + 22 * dt);

    // Dash timer
    if (this.turtle.isDashing) {
      this.turtle.dashTimer -= dt;
      if (this.turtle.dashTimer <= 0) {
        this.turtle.isDashing = false;
      }
    }
    if (this.turtle.invulnTimer > 0) this.turtle.invulnTimer -= dt;

    // Buoyancy and gravity physics
    this.turtle.vy += this.turtle.gravity * dt;
    this.turtle.y += this.turtle.vy * dt;

    // Bounds checking
    this.turtle.y = Math.max(30, Math.min(this.canvas.height - 65, this.turtle.y));
    this.turtle.flipperAngle *= 0.92;

    // Scrolling speed: adjusted by braking, hydro-dash, and distance acceleration
    let scrollSpeed = 155 + Math.min(160, this.distance * 0.09);
    if (this.turtle.isDashing) scrollSpeed *= 1.85;
    if (this.turtle.isBraking) scrollSpeed *= 0.45;

    this.distance += (scrollSpeed / 12) * dt;

    // Milestone check every 500m
    const milestone = Math.floor(this.distance / 500);
    if (milestone > this.milestonesPassed) {
      this.milestonesPassed = milestone;
      arcadeTokens.addTokens(5, `Coral Current: ${milestone * 500}m Milestone!`);
      this.milestoneBannerTimer = 3.5;
      this.milestoneBannerText = `🎉 ${milestone * 500}m REEF SURVIVED! (+5 ZEN TOKENS)`;
      this.playSfx('milestone');
    }
    if (this.milestoneBannerTimer > 0) this.milestoneBannerTimer -= dt;

    // Lagging ghost HP drain
    if (this.ghostHp > this.turtle.hp) {
      this.ghostHp = Math.max(this.turtle.hp, this.ghostHp - 26 * dt);
    } else {
      this.ghostHp = this.turtle.hp;
    }

    // Spawn predators periodically
    if (this.distance >= this.nextPredatorDist) {
      this.spawnPredator();
      this.nextPredatorDist = this.distance + Math.max(160, 320 - (this.distance * 0.05));
    }

    // Update Predators (Reef Sharks & Great Barracudas)
    this.predators.forEach(p => {
      // Relative movement towards turtle
      p.x -= (scrollSpeed + p.speed) * dt;

      // Predator AI targeting
      const distToTurtle = p.x - this.turtle.x;
      if (distToTurtle > 0 && distToTurtle < 420 && p.state === 'patrolling') {
        p.state = 'hunting'; // Alert! Locked on
      }

      if (p.state === 'hunting') {
        // Track turtle's Y position aggressively
        const dy = (this.turtle.y - p.y);
        p.y += dy * Math.min(1.0, (p.type === 'shark' ? 3.8 : 5.2) * dt);

        if (distToTurtle < 180) {
          p.state = 'lunging';
          p.jawOpen = 1.0; // Open razor jaws!
        }
      }

      // Check evasion
      if (!p.passed && p.x + p.w < this.turtle.x) {
        p.passed = true;
        this.predatorsEvaded++;
      }

      // Check collision / predatory bite attack!
      const isNearX = Math.abs((this.turtle.x) - (p.x + p.w * 0.2)) < (p.w * 0.45);
      const isNearY = Math.abs(this.turtle.y - p.y) < (p.h * 0.75 + 12);

      if (isNearX && isNearY) {
        if (this.turtle.invulnTimer <= 0 && !this.turtle.isDashing) {
          // CHOMP! Devastating shark bite
          this.turtle.hp = Math.max(0, this.turtle.hp - 25);
          this.turtle.invulnTimer = 1.0;
          this.biteFlash = 0.55;
          this.screenShake = 3.5;
          this.playSfx('bite');

          // Blood / bubble splash particles (lightweight)
          if (this.particles.length < 16) {
            for (let i = 0; i < 4; i++) {
              this.particles.push({
                x: this.turtle.x,
                y: this.turtle.y,
                vx: (Math.random() - 0.5) * 80,
                vy: (Math.random() - 0.5) * 80,
                size: 2.5 + Math.random() * 3,
                color: Math.random() < 0.6 ? '#ef4444' : '#bae6fd',
                life: 0.4,
                maxLife: 0.4
              });
            }
          }

          // Floating damage popup
          this.damagePopups.push({
            x: this.turtle.x + 20,
            y: this.turtle.y - 18,
            vy: -40,
            text: `-25 HP ${p.type.toUpperCase()} CHOMP!`,
            color: '#ef4444',
            life: 0.9,
            maxLife: 0.9
          });

          if (this.turtle.hp <= 0) {
            this.isGameOver = true;
            arcadeTokens.recordHighScore('coral_current', Math.floor(this.distance), 'meters');
          }
        }
      }
    });
    this.predators = this.predators.filter(p => p.x > -160);

    // Update Full-Screen Cavern Corals
    this.corals.forEach(c => {
      c.x -= scrollSpeed * dt;

      // Revive bleached corals when close
      if (c.bleached && !c.revived && !c.isCeiling) {
        if (Math.hypot(this.turtle.x - c.x, this.turtle.y - (this.canvas.height - c.height / 2)) < 75) {
          c.revived = true;
          c.bleached = false;
          this.coralsRevived++;
          this.turtle.hp = Math.min(100, this.turtle.hp + 6);
          arcadeTokens.addTokens(1, 'Revived Stressed Barrier Coral');
          this.playSfx('upwelling');

          // Healing sparkles
          for (let sp = 0; sp < 8; sp++) {
            this.particles.push({
              x: c.x,
              y: this.canvas.height - c.height / 2,
              vx: (Math.random() - 0.5) * 70,
              vy: -40 - Math.random() * 40,
              size: 3,
              color: '#34d399',
              life: 0.5,
              maxLife: 0.5
            });
          }
        }
      }

      // Coral scrape collision
      const inX = (this.turtle.x + 18 >= c.x - c.width / 2 && this.turtle.x - 18 <= c.x + c.width / 2);
      if (inX) {
        let isScraping = false;
        if (!c.isCeiling && (this.turtle.y + 14 >= this.canvas.height - 35 - c.height)) {
          isScraping = true;
        } else if (c.isCeiling && (this.turtle.y - 14 <= c.height)) {
          isScraping = true;
        }

        if (isScraping && this.turtle.invulnTimer <= 0 && !this.turtle.isDashing) {
          this.turtle.hp = Math.max(0, this.turtle.hp - 10);
          this.turtle.invulnTimer = 0.8;
          this.screenShake = 2.5;
          this.playSfx('scrape');

          this.damagePopups.push({
            x: this.turtle.x + 16,
            y: this.turtle.y - 14,
            vy: -30,
            text: '-10 HP CORAL SCRAPE!',
            color: '#f97316',
            life: 0.75,
            maxLife: 0.75
          });

          if (this.turtle.hp <= 0) {
            this.isGameOver = true;
            arcadeTokens.recordHighScore('coral_current', Math.floor(this.distance), 'meters');
          }
        }
      }
    });

    // Recycle corals across infinite horizon
    this.corals = this.corals.filter(c => c.x > -140);
    while (this.corals.length < 32) {
      const maxX = this.corals.reduce((m, c) => Math.max(m, c.x), this.canvas.width);
      this.spawnCoralPair(maxX + 160, Math.floor(this.distance / 10) + this.corals.length);
    }

    // Update Sea Sponges
    this.seaSponges.forEach(s => {
      s.x -= scrollSpeed * dt;
      if (!s.collected && Math.hypot(this.turtle.x - s.x, this.turtle.y - s.y) < 28) {
        s.collected = true;
        this.turtle.hp = Math.min(100, this.turtle.hp + 15);
        this.playSfx('upwelling');
      }
    });
    this.seaSponges = this.seaSponges.filter(s => !s.collected && s.x > -60);

    // Update Ambient bubbles
    this.bubbles.forEach(b => {
      b.y += b.vy * dt;
      b.x -= scrollSpeed * 0.3 * dt;
      if (b.y < -10) {
        b.y = this.canvas.height + 10;
        b.x = Math.random() * this.canvas.width;
      }
    });

    // Update particles & popups
    this.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    this.particles = this.particles.filter(p => p.life > 0);

    this.damagePopups.forEach(pop => {
      pop.y += pop.vy * dt;
      pop.life -= dt;
    });
    this.damagePopups = this.damagePopups.filter(pop => pop.life > 0);
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();

    // Screen Shake on damage impact
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
      this.screenShake = Math.max(0, this.screenShake - 22 * 0.016);
    }

    // 1. Luminous Deep Tropical Ocean Gradient
    const ocean = ctx.createLinearGradient(0, 0, 0, h);
    ocean.addColorStop(0, '#0369a1');
    ocean.addColorStop(0.35, '#0284c7');
    ocean.addColorStop(0.7, '#075985');
    ocean.addColorStop(1, '#082f49');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, w, h);

    // 2. Refracted Sunbeams through surface water
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let s = 0; s < 4; s++) {
      ctx.beginPath();
      ctx.moveTo(s * 320 + 40, 0);
      ctx.lineTo(s * 320 + 160, h);
      ctx.lineTo(s * 320 + 220, h);
      ctx.lineTo(s * 320 + 80, 0);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Ambient Floating Bioluminescent Bubbles
    ctx.fillStyle = 'rgba(224, 242, 254, 0.35)';
    this.bubbles.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Sandy Seafloor
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(0, h - 35, w, 35);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, h - 40, w, 6);

    // 5. Sea Sponges (HP Recovery motes)
    this.seaSponges.forEach(s => {
      if (s.collected) return;
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#fb7185';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('+HP', s.x, s.y + 3);
    });

    // 7. Full-Screen Corals (Floor Spires AND Ceiling Stalactites)
    this.corals.forEach(c => {
      const coralColor = c.bleached ? '#cbd5e1' : (c.type === 0 ? '#f43f5e' : (c.type === 1 ? '#a855f7' : '#fb923c'));
      ctx.fillStyle = coralColor;
      ctx.strokeStyle = coralColor;

      if (!c.isCeiling) {
        // Floor coral growing UPWARD
        const base = h - 35;
        if (c.type === 0) {
          // Jagged Staghorn Branching Coral
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(c.x, base);
          ctx.lineTo(c.x, base - c.height);
          ctx.lineTo(c.x - 20, base - c.height - 24);
          ctx.moveTo(c.x, base - c.height * 0.55);
          ctx.lineTo(c.x + 22, base - c.height - 18);
          ctx.stroke();
        } else if (c.type === 1) {
          // Brain Coral Mound
          ctx.beginPath();
          ctx.ellipse(c.x, base - c.height * 0.45, c.width / 2, c.height * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Sea Fan Coral
          ctx.beginPath();
          ctx.arc(c.x, base, c.height * 0.85, Math.PI, Math.PI * 2);
          ctx.fill();
        }

        if (c.bleached) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 9px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('⚠️ BLEACHED', c.x, base - c.height - 8);
        }
      } else {
        // Ceiling coral hanging DOWNWARD (Stalactite formations)
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(c.x, 0);
        ctx.lineTo(c.x, c.height);
        ctx.lineTo(c.x - 16, c.height + 18);
        ctx.moveTo(c.x, c.height * 0.55);
        ctx.lineTo(c.x + 18, c.height + 14);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(c.x, c.height, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 8. Predatory Fish (Reef Sharks & Great Barracudas)
    this.predators.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);

      // Facing left towards turtle
      if (p.type === 'shark') {
        // Reef Shark Body
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // White underbelly
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.ellipse(0, 4, p.w * 0.45, p.h * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dorsal fin (Top triangular fin)
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(-4, -p.h / 2);
        ctx.lineTo(8, -p.h / 2 - 16);
        ctx.lineTo(16, -p.h / 2);
        ctx.closePath();
        ctx.fill();

        // Pectoral fin
        ctx.beginPath();
        ctx.moveTo(-6, 2);
        ctx.lineTo(4, 16);
        ctx.lineTo(14, 4);
        ctx.closePath();
        ctx.fill();

        // Tail Fin
        ctx.beginPath();
        ctx.moveTo(p.w / 2 - 4, 0);
        ctx.lineTo(p.w / 2 + 16, -14);
        ctx.lineTo(p.w / 2 + 8, 0);
        ctx.lineTo(p.w / 2 + 16, 14);
        ctx.closePath();
        ctx.fill();

        // Predatory eye & teeth
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(-p.w / 2 + 14, -4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-p.w / 2 + 13, -4, 1.4, 0, Math.PI * 2);
        ctx.fill();

        // Snapping jaws with razor teeth!
        if (p.jawOpen > 0) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(-p.w / 2 + 4, -2);
          ctx.lineTo(-p.w / 2 + 16, 8);
          ctx.lineTo(-p.w / 2 + 8, -2);
          ctx.closePath();
          ctx.fill();

          // White teeth
          ctx.fillStyle = '#ffffff';
          for (let t = 0; t < 3; t++) {
            ctx.fillRect(-p.w / 2 + 6 + t * 3, -1, 2, 3);
          }
        }
      } else {
        // Great Barracuda (Torpedo-like predator)
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Silver belly
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.ellipse(0, 3, p.w * 0.45, p.h * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pointed snout & sharp teeth
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.moveTo(-p.w / 2, 0);
        ctx.lineTo(-p.w / 2 + 10, -5);
        ctx.lineTo(-p.w / 2 + 10, 5);
        ctx.closePath();
        ctx.fill();
      }

      // Hunting Alert Exclamation Mark
      if (p.state === 'hunting' || p.state === 'lunging') {
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.font = '800 16px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('❗', 0, -p.h / 2 - 18);
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    });

    // 9. Sea Turtle Player with Cosmetics (Shell, Crown, Spirit Glow)
    ctx.save();
    ctx.translate(this.turtle.x, this.turtle.y);
    const tilt = Math.max(-0.4, Math.min(0.4, this.turtle.vy * 0.002));
    ctx.rotate(tilt);

    const isFlashing = this.turtle.invulnTimer > 0 && Math.floor(this.turtle.invulnTimer * 12) % 2 === 0;
    if (!isFlashing) {
      const equippedCrown = arcadeTokens?.getEquippedItem?.('crown');
      const equippedGlow = arcadeTokens?.getEquippedItem?.('spiritGlow');

      // Spirit Glow Aura & Trailing Motes
      if (equippedGlow && equippedGlow.id !== 'verdant') {
        ctx.strokeStyle = equippedGlow.hex || '#38bdf8';
        ctx.shadowColor = equippedGlow.hex || '#38bdf8';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 18, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Hydro-Dash Jet Bubble Shell Shield
      if (this.turtle.isDashing) {
        ctx.strokeStyle = '#38bdf8';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 20;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 32, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Bioluminescent water wake
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.ellipse(-26, 0, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flippers
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.ellipse(4, -14 - this.turtle.flipperAngle * 10, 13, 6, -0.6, 0, Math.PI * 2);
      ctx.ellipse(4, 14 + this.turtle.flipperAngle * 10, 13, 6, 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Golden Amber Carapace Shell
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

      // Equipped Floating Crown on Turtle Carapace
      if (equippedCrown?.id === 'golden_crown') {
        ctx.save();
        ctx.translate(0, -18);

        // 24K Sovereign Crown
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 10;
        ctx.fillRect(-9, 2, 18, 3.5);

        ctx.beginPath();
        ctx.moveTo(-9, 2);
        ctx.lineTo(-7, -6);
        ctx.lineTo(-3, 0);
        ctx.lineTo(0, -9);
        ctx.lineTo(3, 0);
        ctx.lineTo(7, -6);
        ctx.lineTo(9, 2);
        ctx.closePath();
        ctx.fill();

        // Ruby & Emerald jewels
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -8, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(-7, -5.5, 1.5, 0, Math.PI * 2);
        ctx.arc(7, -5.5, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (equippedCrown?.id === 'cyber_halo') {
        ctx.save();
        ctx.translate(0, -16);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 3.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (equippedCrown?.id === 'phoenix_crest') {
        ctx.save();
        ctx.translate(0, -16);
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(-7, 2);
        ctx.lineTo(-3, -8);
        ctx.lineTo(0, -11);
        ctx.lineTo(3, -8);
        ctx.lineTo(7, 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (equippedCrown?.id === 'celestial_diadem') {
        ctx.save();
        ctx.translate(0, -16);
        ctx.fillStyle = '#e0f2fe';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(-8, 1);
        ctx.lineTo(-4, -5);
        ctx.lineTo(0, -8);
        ctx.lineTo(4, -5);
        ctx.lineTo(8, 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, -5.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();

    // 10. Floating Damage Popups
    this.damagePopups.forEach(pop => {
      ctx.fillStyle = pop.color;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 8;
      ctx.font = '800 13px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.shadowBlur = 0;
    });

    // 11. Red Bite Screen Flash Overlay (Lightweight zero-lag border flash)
    if (this.biteFlash > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${this.biteFlash * 0.18})`;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = `rgba(239, 68, 68, ${this.biteFlash * 0.65})`;
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, w, h);
      this.biteFlash = Math.max(0, this.biteFlash - 3.5 * 0.016);
    }

    // 12. Milestone Celebration Banner
    if (this.milestoneBannerTimer > 0) {
      const bannerW = Math.min(w - 40, 500);
      const bannerH = 44;
      const bannerX = (w - bannerW) / 2;
      const bannerY = 24;

      ctx.fillStyle = 'rgba(12, 14, 24, 0.94)';
      ctx.strokeStyle = '#E7F434';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#E7F434';
      ctx.font = '800 13.5px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(this.milestoneBannerText, w / 2, bannerY + 27);
    }

    const hudY = h - 96;
    drawReadout(ctx, w, h, `${Math.floor(this.distance)} m  ·  ${this.coralsRevived} coral revived`, 244);
    ctx.fillStyle = 'rgba(14, 27, 26, .90)';
    ctx.strokeStyle = 'rgba(255, 255, 255, .14)';

    // 14. Right Status Card: Health & Stamina Bars with Red Lagging Ghost Health Bar
    const statusBoxW = 220;
    ctx.beginPath();
    ctx.roundRect(w - statusBoxW - 24, hudY, statusBoxW, 72, 14);
    ctx.fill();
    ctx.stroke();

    // HP Bar
    const hpColor = this.turtle.hp > 50 ? '#34d399' : (this.turtle.hp > 25 ? '#f59e0b' : '#ef4444');
    ctx.fillStyle = hpColor;
    ctx.font = '800 13.5px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`🐢 HP ${Math.round(this.turtle.hp)}%`, w - statusBoxW - 10, hudY + 24);

    const barW = 120;
    const barX = w - barW - 38;

    // HP Container
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(barX, hudY + 14, barW, 9);
    // Red Ghost HP Bar
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(barX, hudY + 14, barW * (this.ghostHp / 100), 9);
    // Active HP
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, hudY + 14, barW * (this.turtle.hp / 100), 9);

    // Stamina Bar
    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 12px system-ui';
    ctx.fillText(`⚡ JET ${Math.round(this.turtle.stamina)}%`, w - statusBoxW - 10, hudY + 46);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(barX, hudY + 36, barW, 8);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(barX, hudY + 36, barW * (this.turtle.stamina / 100), 8);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9.5px system-ui';
    ctx.fillText(this.turtle.stamina >= 30 ? 'Dash Ready (30%)' : 'Recharging...', barX, hudY + 58);

    // 15. Game Over Screen
    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.92)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ef4444';
      ctx.font = '800 30px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🌊 REEF ECOSYSTEM COLLAPSE', w / 2, h / 2 - 40);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 15px system-ui';
      ctx.fillText(`You survived ${Math.floor(this.distance)} meters and revived ${this.coralsRevived} barrier reef corals.`, w / 2, h / 2 - 5);
      ctx.fillStyle = '#E7F434';
      ctx.font = '600 13px system-ui';
      ctx.fillText(`🪙 ${this.milestonesPassed * 5 + this.coralsRevived} Tokens Earned · 🦈 ${this.predatorsEvaded} Predators Evaded`, w / 2, h / 2 + 22);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px system-ui';
      ctx.fillText('Press Space or R to Dive Again · Press Esc to Exit', w / 2, h / 2 + 55);
    }

    ctx.restore();
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    const loop = (t) => {
      if (!this.isRunning) return;
      if (!this.isPaused) {
        const dt = Math.min(0.05, Math.max(0.001, (t - (this.lastTime || t)) / 1000 || 0.016));
        this.lastTime = t;
        this.update(dt);
        this.render();
      } else {
        this.lastTime = t;
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
            arcadeTokens.addTokens(5, 'Ancient Forest Reforested');
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

    drawReadout(ctx, w, h, `Seeds · ${this.seed.seedsPlanted} / ${this.seed.targetSeeds}   ·   Altitude ${Math.round(this.seed.altitude)}%`);

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
    this.lastTime = performance.now();
    const loop = (t) => {
      if (!this.isRunning) return;
      if (!this.isPaused) {
        const dt = Math.min(0.05, Math.max(0.001, (t - (this.lastTime || t)) / 1000 || 0.016));
        this.lastTime = t;
        this.update(dt);
        this.render();
      } else {
        this.lastTime = t;
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
