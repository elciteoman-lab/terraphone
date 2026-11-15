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

import { arcadeTokens } from './arcade-tokens.js';

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
      targetDistance: 1000, // Reach Central Park Oasis at 1,000m
      dropletsCollected: 0,
      cryoTimer: 0
    };

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

    // Speed progression: increases smoothly with distance
    const baseSpeed = 380 + Math.min(260, this.player.distance * 0.28);
    const scrollSpeed = baseSpeed * (this.player.cryoTimer > 0 ? 1.25 : 1.0);

    // Distance progression
    this.player.distance += (scrollSpeed / 14) * dt;

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

    // Game Over condition
    if (this.player.hydration <= 0) {
      this.isGameOver = true;
      arcadeTokens.recordHighScore('heat_escape', Math.floor(this.player.distance), 'meters');
      return;
    }

    // Victory condition (1,000 meters reached!)
    if (this.player.distance >= this.player.targetDistance) {
      this.isVictory = true;
      arcadeTokens.addTokens(5, 'Subway Heat Island Escaped');
      arcadeTokens.recordHighScore('heat_escape', Math.floor(this.player.distance), 'meters');
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
      const scooterColor = this.player.hydration > 50 ? '#38bdf8' : (this.player.hydration > 25 ? '#f59e0b' : '#ef4444');

      // Headlight beam projecting forward
      const beamGrad = ctx.createLinearGradient(0, -18, 0, -120);
      beamGrad.addColorStop(0, 'rgba(231, 244, 52, 0.4)');
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
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-5, isSliding ? -6 : -16, 10, isSliding ? 20 : 32);

      // Rider helmet & silhouette
      ctx.fillStyle = scooterColor;
      ctx.shadowColor = scooterColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, isSliding ? -4 : -16, isSliding ? 8 : 10, 0, Math.PI * 2);
      ctx.fill();

      // Neon wheels
      ctx.fillStyle = '#E7F434'; // Space Apps Neon Yellow
      ctx.fillRect(-4, isSliding ? 10 : 14, 8, 4);
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
    ctx.roundRect(20, trackY, 210, trackH, 17);
    ctx.fillStyle = 'rgba(12, 14, 24, 0.88)';
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`🌳 Goal: ${Math.floor(this.player.distance)} / ${this.player.targetDistance}m`, 32, trackY + 21);

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

    // 11. Bottom Card: NASA ECOSTRESS Land Surface Temp Readout
    const botH = 68;
    const botY = h - botH - 16;
    ctx.fillStyle = 'rgba(12, 14, 24, 0.92)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(24, botY, Math.min(w - 48, 540), botH, 14);
    ctx.fill();
    ctx.stroke();

    const isCool = (this.lastLST || 48) < 30;
    ctx.fillStyle = isCool ? '#34d399' : '#f97316';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('🛰️ NASA ECOSTRESS THERMAL SATELLITE TELEMETRY', 38, botY + 20);

    ctx.fillStyle = isCool ? '#10b981' : '#f87171';
    ctx.font = '800 13px system-ui';
    ctx.fillText(`${isCool ? '🌳 COOL CANOPY OASIS' : '🔥 ASPHALT HEAT ISLAND'}: ${(this.lastLST || 48).toFixed(1)}°C LST (Lane ${this.targetLane + 1})`, 38, botY + 39);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px system-ui';
    ctx.fillText('A/D / ←/→: Snap 5 Lanes | W/↑/Space: Jump | S/↓: Slide | Swipe on Touch', 38, botY + 55);

    // Game Over Overlay
    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.90)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ef4444';
      ctx.font = '800 30px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🔥 HEAT STROKE FATIGUE', w / 2, h / 2 - 30);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 14px system-ui';
      ctx.fillText(`Hydration depleted at ${Math.floor(this.player.distance)}m in the urban heat island.`, w / 2, h / 2 + 5);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px system-ui';
      ctx.fillText('Press R to Try Again', w / 2, h / 2 + 45);
    }

    // Victory Overlay
    if (this.isVictory) {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.90)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#10b981';
      ctx.font = '800 30px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🌳 CENTRAL PARK OASIS REACHED! 🌳', w / 2, h / 2 - 35);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 14px system-ui';
      ctx.fillText(`You dashed 1,000 meters across 5 lanes and collected ${this.player.dropletsCollected} hydration droplets!`, w / 2, h / 2);
      ctx.fillStyle = '#E7F434';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText('🪙 +5 Zen Tokens Awarded', w / 2, h / 2 + 35);
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
          arcadeTokens.addTokens(5, 'Delivered Pure Rain to Valley');
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
      arcadeTokens.addTokens(5, 'Reached Coral Atoll Marine Sanctuary');
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
