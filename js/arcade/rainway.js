/**
 * Terraphone — RAINWAY: The Endless Rain Journey
 * NASA Space Apps Challenge
 * 
 * Procedural scenic driving game inspired by Slow Roads.
 * Features:
 * - Endless undulating curves and elevation hills
 * - NASA GPM IMERG precipitation-driven weather & wet road reflections
 * - Cloud Glider secret flight transformation mode
 * - VYLT × TERRAPHONE scenic landmark Easter egg
 * - Relaxing Autopilot cruise mode
 * - Shared Web Audio procedural engine
 */

import { arcadeTokens } from './arcade-tokens.js';

export class RainwayGame {
  constructor(canvas, audioCtx, onExit) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audioCtx = audioCtx;
    this.onExit = onExit;

    // Game loop state
    this.isRunning = false;
    this.isPaused = false;
    this.rafId = null;
    this.lastTime = 0;

    // Player & vehicle physics
    this.position = 0; // distance traveled along road in meters
    this.speed = 0; // m/s
    this.maxSpeed = 65; // ~234 km/h top speed
    this.accel = 24;
    this.braking = 38;
    this.decel = 8;
    this.playerX = 0; // -1 (left edge) to 1 (right edge)
    this.steerAngle = 0;
    this.cameraMode = 'chase'; // 'chase' | 'hood' | 'glider'
    this.isAutopilot = false;

    // Cloud Glider Easter Egg Flight Mode
    this.isGliderMode = false;
    this.gliderAltitude = 0; // 0 (ground) to 100 (high flight)
    this.gliderPitch = 0;
    this.gliderRoll = 0;
    this.cloudRings = []; // collectible rings in sky

    // Road procedural geometry
    this.segments = [];
    this.segmentLength = 20; // meters per segment
    this.totalSegments = 1600; // loop length
    this.roadWidth = 1200;
    this.cameraHeight = 850;
    this.cameraDepth = 0.84; // field of view factor
    this.drawDistance = 180; // visible segments ahead

    // Input state
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      brake: false
    };

    // NASA Weather Simulation Sectors (driven by GPM IMERG)
    this.weatherSectors = [
      { name: 'Valley Clearing', rainRate: 0.0, desc: 'Dry asphalt, gentle sun breaks', skyColor: '#1e293b' },
      { name: 'Coastal Mist', rainRate: 2.5, desc: 'Light drizzle, slick tarmac', skyColor: '#0f172a' },
      { name: 'Mountain Downpour', rainRate: 15.0, desc: 'Subtropical downpour, tire spray', skyColor: '#090d16' },
      { name: 'Convective Storm', rainRate: 42.0, desc: 'Convective cell, lightning rumbles', skyColor: '#030712' }
    ];
    this.currentSectorIdx = 0;
    this.rainParticles = [];
    this.rainDropsOnScreen = [];

    // Milestone tracking
    this.distanceTraveled = 0;
    this.motesCollected = 0;
    this.vyltSignFound = false;

    // Audio nodes
    this.audioNodes = null;

    this.initRoad();
    this.initInput();
    this.initAudio();
    this.initWeatherParticles();
  }

  // ==========================================
  // PROCEDURAL ROAD GENERATION
  // ==========================================

  initRoad() {
    this.segments = [];
    let curCurve = 0;

    // Continuous elevation function — eliminates stair-stepping
    const getY = (idx) => {
      return Math.sin(idx / 35) * 1100 + Math.sin(idx / 14) * 450 + Math.cos(idx / 80) * 800;
    };

    for (let i = 0; i < this.totalSegments; i++) {
      const y1 = getY(i);
      const y2 = getY(i + 1);

      // Curves
      if (i > 80 && i < 220) curCurve = 2.4;
      else if (i > 260 && i < 400) curCurve = -3.1;
      else if (i > 450 && i < 620) curCurve = 3.8;
      else if (i > 700 && i < 900) curCurve = -2.6;
      else if (i > 1000 && i < 1250) curCurve = 4.2;
      else if (i > 1320 && i < 1500) curCurve = -3.5;
      else curCurve = 0;

      const hasTree = Math.random() < 0.28;
      const treeSide = Math.random() < 0.5 ? -1 : 1;
      const treeOffset = 1.4 + Math.random() * 1.6;

      // Scenic VYLT × TERRAPHONE Easter Egg Sign at scenic mountain overlook (segment 1150 ~5.7km)
      const hasSign = (i === 1150);

      // Secret airborne Cloud Rings at hill crests
      const hasRing = (i === 450 || i === 850 || i === 1350);
      if (hasRing) {
        this.cloudRings.push({
          segmentIndex: i,
          z: i * this.segmentLength,
          collected: false
        });
      }

      this.segments.push({
        index: i,
        p1: { world: { y: y1, z: i * this.segmentLength }, screen: {} },
        p2: { world: { y: y2, z: (i + 1) * this.segmentLength }, screen: {} },
        curve: curCurve,
        color: Math.floor(i / 3) % 2 ? {
          road: '#1a1f2e',
          grass: '#0f172a',
          rumble: '#38bdf8',
          lane: '#f8fafc'
        } : {
          road: '#151926',
          grass: '#0a0f1d',
          rumble: '#1e293b',
          lane: 'transparent'
        },
        hasTree,
        treeSide,
        treeOffset,
        hasSign,
        hasRing,
        ringCollected: false
      });
    }
  }

  initWeatherParticles() {
    this.rainParticles = [];
    for (let i = 0; i < 220; i++) {
      this.rainParticles.push({
        x: Math.random(),
        y: Math.random(),
        length: 12 + Math.random() * 20,
        speed: 1.2 + Math.random() * 1.8,
        alpha: 0.2 + Math.random() * 0.4
      });
    }

    this.rainDropsOnScreen = [];
    for (let i = 0; i < 40; i++) {
      this.rainDropsOnScreen.push({
        x: Math.random(),
        y: Math.random(),
        r: 1 + Math.random() * 3,
        alpha: Math.random() * 0.5
      });
    }
  }

  // ==========================================
  // INPUT HANDLING
  // ==========================================

  initInput() {
    this.onKeyDown = (e) => {
      if (e.repeat) return;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.keys.up = true;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.keys.down = true;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.keys.left = true;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.keys.right = true;
      if (e.key === ' ') {
        e.preventDefault();
        this.keys.brake = true;
      }
      if (e.key === 'c' || e.key === 'C') {
        this.cameraMode = this.cameraMode === 'chase' ? 'hood' : 'chase';
      }
      if (e.key === 'p' || e.key === 'P') {
        this.toggleAutopilot();
      }
      if (e.key === 'g' || e.key === 'G') {
        this.triggerCloudGlider(!this.isGliderMode);
      }
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
      if (e.key === ' ') this.keys.brake = false;
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  toggleAutopilot() {
    this.isAutopilot = !this.isAutopilot;
    const toast = document.getElementById('rainway-autopilot-indicator');
    if (toast) {
      toast.textContent = this.isAutopilot ? '🤖 AUTOPILOT ACTIVE' : '';
      toast.style.display = this.isAutopilot ? 'block' : 'none';
    }
  }

  triggerCloudGlider(activate = true) {
    this.isGliderMode = activate;
    if (activate) {
      this.gliderAltitude = 45;
      this.cameraMode = 'glider';
      arcadeTokens.unlockEasterEgg('Cloud Glider Wings', 5);
      this.playChimeSound(660, 0.4);
    } else {
      this.gliderAltitude = 0;
      this.cameraMode = 'chase';
    }
  }

  triggerGliderMode(activate = true) {
    this.triggerCloudGlider(activate);
  }

  // ==========================================
  // PROCEDURAL WEB AUDIO SYNTHESIS
  // ==========================================

  initAudio() {
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;

      // Master gain for Rainway
      const master = this.audioCtx.createGain();
      master.gain.setValueAtTime(0.75, now);
      master.connect(this.audioCtx.destination);

      // 1. Engine Drone (Synthesized sawtooth through lowpass filter)
      const engineOsc = this.audioCtx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.setValueAtTime(45, now);

      const engineFilter = this.audioCtx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.setValueAtTime(280, now);
      engineFilter.Q.setValueAtTime(1.8, now);

      const engineGain = this.audioCtx.createGain();
      engineGain.gain.setValueAtTime(0.001, now);

      engineOsc.connect(engineFilter);
      engineFilter.connect(engineGain);
      engineGain.connect(master);
      engineOsc.start();

      // 2. Wet Road Tire Hiss (Filtered noise)
      const bufferSize = this.audioCtx.sampleRate * 2;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const tireNoise = this.audioCtx.createBufferSource();
      tireNoise.buffer = noiseBuffer;
      tireNoise.loop = true;

      const tireFilter = this.audioCtx.createBiquadFilter();
      tireFilter.type = 'bandpass';
      tireFilter.frequency.setValueAtTime(800, now);
      tireFilter.Q.setValueAtTime(0.8, now);

      const tireGain = this.audioCtx.createGain();
      tireGain.gain.setValueAtTime(0.001, now);

      tireNoise.connect(tireFilter);
      tireFilter.connect(tireGain);
      tireGain.connect(master);
      tireNoise.start();

      // 3. Rain Patter (Filtered pinkish noise)
      const rainSource = this.audioCtx.createBufferSource();
      rainSource.buffer = noiseBuffer;
      rainSource.loop = true;

      const rainFilter = this.audioCtx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.setValueAtTime(2200, now);

      const rainGain = this.audioCtx.createGain();
      rainGain.gain.setValueAtTime(0.02, now);

      rainSource.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(master);
      rainSource.start();

      this.audioNodes = {
        master,
        engineOsc,
        engineFilter,
        engineGain,
        tireGain,
        tireFilter,
        rainGain
      };
    } catch (e) {
      console.warn('Rainway audio initialization deferred:', e);
    }
  }

  updateAudioPhysics() {
    if (!this.audioNodes || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const speedRatio = Math.min(1.0, this.speed / this.maxSpeed);

    // Engine pitch scales with speed
    const baseFreq = this.isGliderMode ? 75 : 42;
    const targetFreq = baseFreq + speedRatio * 160;
    this.audioNodes.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);

    // Engine volume
    const engVol = this.isGliderMode ? 0.04 : (0.06 + speedRatio * 0.12);
    this.audioNodes.engineGain.gain.setTargetAtTime(engVol, now, 0.08);

    // Tire road hiss scales with speed and rain wetness
    const sector = this.weatherSectors[this.currentSectorIdx];
    const wetFactor = Math.min(1.0, sector.rainRate / 20);
    const tireVol = speedRatio * (0.04 + wetFactor * 0.08);
    this.audioNodes.tireGain.gain.setTargetAtTime(tireVol, now, 0.08);

    // Rain volume matches NASA rain rate
    const rainVol = Math.min(0.24, (sector.rainRate / 45) * 0.22);
    this.audioNodes.rainGain.gain.setTargetAtTime(rainVol, now, 0.15);
  }

  playChimeSound(freq = 520, duration = 0.3) {
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const g = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + duration);

      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(g);
      g.connect(this.audioNodes ? this.audioNodes.master : this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  // ==========================================
  // GAME UPDATE & PHYSICS
  // ==========================================

  update(dt) {
    // Autopilot steering and throttle
    if (this.isAutopilot) {
      this.keys.up = true;
      const curSeg = this.findSegment(this.position);
      // Steer to compensate for road curve
      const targetX = -curSeg.curve * 0.12;
      this.playerX += (targetX - this.playerX) * 0.08;
    }

    // Throttle & braking
    if (this.keys.up) {
      this.speed = Math.min(this.maxSpeed, this.speed + this.accel * dt);
    } else if (this.keys.down) {
      this.speed = Math.max(-12, this.speed - this.braking * dt);
    } else {
      // Natural deceleration
      if (this.speed > 0) this.speed = Math.max(0, this.speed - this.decel * dt);
      else if (this.speed < 0) this.speed = Math.min(0, this.speed + this.decel * dt);
    }

    if (this.keys.brake) {
      this.speed = Math.max(0, this.speed - this.braking * 1.8 * dt);
    }

    // Steering: responsive at low and high speeds
    const speedFactor = Math.abs(this.speed) / this.maxSpeed;
    const steerRate = (this.speed === 0 ? 0 : Math.max(0.65, speedFactor)) * 2.5;

    if (this.keys.left) {
      this.playerX -= steerRate * dt;
      this.steerAngle = Math.max(-0.28, this.steerAngle - 1.2 * dt);
    } else if (this.keys.right) {
      this.playerX += steerRate * dt;
      this.steerAngle = Math.min(0.28, this.steerAngle + 1.2 * dt);
    } else {
      this.steerAngle *= 0.82;
    }

    // Centrifugal curve push (balanced so turning easily overcomes it)
    const currentSegment = this.findSegment(this.position);
    this.playerX -= (currentSegment.curve * speedFactor * 0.14) * dt;

    // Road friction boundary
    if (Math.abs(this.playerX) > 1.0) {
      // Offroad grass deceleration
      this.speed = Math.max(0, this.speed - 30 * dt);
      this.playerX = Math.max(-1.85, Math.min(1.85, this.playerX));
    }

    // Advance position
    this.position += this.speed * dt * 8.0;
    this.distanceTraveled = Math.floor(this.position);

    // Weather Sector progression based on distance (every 600 meters)
    const sectorIdx = Math.floor(this.distanceTraveled / 600) % this.weatherSectors.length;
    if (sectorIdx !== this.currentSectorIdx) {
      this.currentSectorIdx = sectorIdx;
      this.updateHudSector();
    }

    // Check Cloud Ring Easter Egg gate (high speed airborne jump or active glider)
    if (currentSegment.hasRing && !currentSegment.ringCollected) {
      if (this.isGliderMode || this.speed > 48) {
        currentSegment.ringCollected = true;
        this.triggerCloudGlider(!this.isGliderMode);
      }
    }

    // Check VYLT sign milestone: on the scenic turnout shoulder on right side (playerX >= 1.15 && playerX <= 1.85)
    if (currentSegment.hasSign && !this.vyltSignFound) {
      if (this.playerX >= 1.15 && this.playerX <= 1.85) {
        this.vyltSignFound = true;
        arcadeTokens.unlockEasterEgg('VYLT × TERRAPHONE Landmark', 10);
        this.playChimeSound(880, 0.5);
        const signToast = document.getElementById('rainway-sign-toast');
        if (signToast) {
          signToast.classList.add('visible');
          setTimeout(() => signToast.classList.remove('visible'), 4500);
        }
      }
    }

    // Record high score
    arcadeTokens.recordHighScore('rainway', this.distanceTraveled, 'meters');

    this.updateAudioPhysics();
  }

  findSegment(z) {
    return this.segments[Math.floor(z / this.segmentLength) % this.totalSegments];
  }

  // ==========================================
  // 3D PSEUDO-PROJECTION & RENDERING
  // ==========================================

  project(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth) {
    p.camera = {
      x: (p.world.x || 0) - cameraX,
      y: (p.world.y || 0) - cameraY,
      z: (p.world.z || 0) - cameraZ
    };
    p.screen.scale = cameraDepth / p.camera.z;
    p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x * width / 2));
    p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y * height / 2));
    p.screen.w = Math.round((p.screen.scale * roadWidth * width / 2));
  }

  render() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    const sector = this.weatherSectors[this.currentSectorIdx];

    // 1. Sky & Atmospheric Mountains
    this.renderSkyAndMountains(ctx, width, height, sector);

    // 2. Road Projection
    const baseSegment = this.findSegment(this.position);
    const baseIndex = baseSegment.index;
    const cameraX = this.playerX * this.roadWidth;
    const cameraY = this.cameraHeight + baseSegment.p1.world.y + (this.isGliderMode ? this.gliderAltitude * 22 : 0);
    const cameraZ = this.position;

    let maxy = height;
    let x = 0;
    let dx = -(baseSegment.curve * (this.position % this.segmentLength) / this.segmentLength);

    for (let n = 0; n < this.drawDistance; n++) {
      const segment = this.segments[(baseIndex + n) % this.totalSegments];
      const looped = segment.index < baseIndex;
      const zOffset = looped ? this.totalSegments * this.segmentLength : 0;

      segment.p1.world.z = segment.index * this.segmentLength + zOffset;
      segment.p2.world.z = (segment.index + 1) * this.segmentLength + zOffset;
      segment.p1.world.x = x;
      segment.p2.world.x = x + dx;

      this.project(segment.p1, cameraX, cameraY, cameraZ, this.cameraDepth, width, height, this.roadWidth);
      this.project(segment.p2, cameraX, cameraY, cameraZ, this.cameraDepth, width, height, this.roadWidth);

      x += dx;
      dx += segment.curve;

      if (segment.p1.camera.z <= this.cameraDepth || segment.p2.screen.y >= maxy) continue;

      this.renderSegment(ctx, width, segment.p1.screen, segment.p2.screen, segment.color, sector.rainRate);
      maxy = segment.p2.screen.y;
    }

    // 3. Render Roadside Scenery (Trees, Signs, Cloud Rings)
    for (let n = this.drawDistance - 1; n > 0; n--) {
      const segment = this.segments[(baseIndex + n) % this.totalSegments];
      if (segment.hasSign) {
        this.renderSign(ctx, segment.p1.screen);
      }
      if (segment.hasRing && !segment.ringCollected) {
        this.renderCloudRing(ctx, segment.p1.screen);
      }
      if (segment.hasTree) {
        this.renderTree(ctx, segment.p1.screen, segment.treeSide * segment.treeOffset);
      }
    }

    // 4. Render Vehicle / Cloud Glider
    this.renderPlayerVehicle(ctx, width, height);

    // 5. Weather Particles (Rain streaks, splashes, windshield mist)
    this.renderRainWeather(ctx, width, height, sector.rainRate);

    // 6. On-Screen HUD Overlay
    this.renderGameHud(ctx, width, height, sector);
  }

  renderSkyAndMountains(ctx, width, height, sector) {
    const horizon = height * 0.48;

    // Atmospheric sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
    skyGrad.addColorStop(0, sector.skyColor);
    skyGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, horizon);

    // Distant mountain ranges (parallax with steering/curve)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    for (let i = 0; i <= width; i += 60) {
      const mH = Math.sin((i + this.position * 0.05) / 140) * 45 + Math.cos(i / 80) * 35;
      ctx.lineTo(i, horizon - 50 - mH);
    }
    ctx.lineTo(width, horizon);
    ctx.closePath();
    ctx.fill();

    // Mid-ground misty hills
    ctx.fillStyle = '#141d2e';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    for (let i = 0; i <= width; i += 40) {
      const hH = Math.sin((i - this.position * 0.12) / 90) * 30 + 20;
      ctx.lineTo(i, horizon - 10 - hH);
    }
    ctx.lineTo(width, horizon);
    ctx.closePath();
    ctx.fill();
  }

  renderSegment(ctx, width, p1, p2, color, rainRate) {
    const r1 = p1.w / 6;
    const r2 = p2.w / 6;

    // Grass: continuous polygon slopes on left and right sides
    ctx.fillStyle = color.grass;
    this.drawPolygon(ctx, 0, p1.y, p1.x - p1.w - r1, p1.y, p2.x - p2.w - r2, p2.y, 0, p2.y);
    this.drawPolygon(ctx, p1.x + p1.w + r1, p1.y, width, p1.y, width, p2.y, p2.x + p2.w + r2, p2.y);

    // Rumble strips (curbs)
    ctx.fillStyle = color.rumble;
    this.drawPolygon(ctx, p1.x - p1.w - r1, p1.y, p1.x - p1.w, p1.y, p2.x - p2.w, p2.y, p2.x - p2.w - r2, p2.y);
    this.drawPolygon(ctx, p1.x + p1.w, p1.y, p1.x + p1.w + r1, p1.y, p2.x + p2.w + r2, p2.y, p2.x + p2.w, p2.y);

    // Road asphalt
    ctx.fillStyle = color.road;
    this.drawPolygon(ctx, p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y);

    // Wet road specular reflection (brighter when rainRate > 0)
    if (rainRate > 0.5) {
      ctx.fillStyle = `rgba(56, 189, 248, ${Math.min(0.22, rainRate * 0.01)})`;
      this.drawPolygon(ctx, p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y);
    }

    // Center dashed white lines
    if (color.lane !== 'transparent') {
      const lw1 = p1.w / 32;
      const lw2 = p2.w / 32;
      ctx.fillStyle = color.lane;
      this.drawPolygon(ctx, p1.x - lw1, p1.y, p1.x + lw1, p1.y, p2.x + lw2, p2.y, p2.x - lw2, p2.y);
    }
  }

  drawPolygon(ctx, x1, y1, x2, y2, x3, y3, x4, y4) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }

  renderTree(ctx, p, offset) {
    const scale = p.scale;
    const treeX = p.x + scale * offset * this.roadWidth * 0.5;
    const treeY = p.y;
    const size = Math.max(8, scale * 340);

    // Pine silhouette
    ctx.fillStyle = '#06281e';
    ctx.beginPath();
    ctx.moveTo(treeX, treeY - size);
    ctx.lineTo(treeX - size * 0.35, treeY);
    ctx.lineTo(treeX + size * 0.35, treeY);
    ctx.closePath();
    ctx.fill();
  }

  renderSign(ctx, p) {
    const scale = p.scale;
    const signX = p.x + scale * 1.5 * this.roadWidth * 0.5;
    const signY = p.y;
    const sW = scale * 260;
    const sH = scale * 110;

    // Wooden post
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(signX - sW * 0.08, signY - sH * 1.4, sW * 0.16, sH * 1.4);

    // Signboard
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = Math.max(1, scale * 6);
    ctx.beginPath();
    ctx.roundRect(signX - sW / 2, signY - sH * 1.4 - sH, sW, sH, Math.max(2, scale * 8));
    ctx.fill();
    ctx.stroke();

    // Text
    if (scale > 0.003) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = `bold ${Math.max(9, Math.round(scale * 28))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('VYLT × TERRAPHONE', signX, signY - sH * 1.7);
      ctx.fillStyle = '#94a3b8';
      ctx.font = `${Math.max(7, Math.round(scale * 18))}px system-ui, sans-serif`;
      ctx.fillText('Scenic Overlook', signX, signY - sH * 1.25);
    }
  }

  renderCloudRing(ctx, p) {
    const scale = p.scale;
    const ringX = p.x;
    const ringY = p.y - Math.max(40, scale * 600);
    const radius = Math.max(15, scale * 300);

    // Luminous glowing gate
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = Math.max(3, scale * 14);
    ctx.beginPath();
    ctx.arc(ringX, ringY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner sparkle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(ringX, ringY, Math.max(4, radius * 0.25), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  renderPlayerVehicle(ctx, width, height) {
    if (this.cameraMode === 'hood') return; // First-person view hides exterior

    const carColor = arcadeTokens.getEquippedHex('carPaint');
    const carX = width / 2;
    const carY = height * 0.82 - (this.isGliderMode ? 60 : 0);
    const carW = 120;
    const carH = 50;

    ctx.save();
    ctx.translate(carX, carY);
    ctx.rotate(this.steerAngle * 0.6);

    if (this.isGliderMode) {
      // ----------------------------------------
      // CLOUD GLIDER AIRBORNE FORM
      // ----------------------------------------
      const gliderColor = arcadeTokens.getEquippedHex('gliderSkin');

      // Wings
      ctx.fillStyle = gliderColor;
      ctx.beginPath();
      ctx.moveTo(-110, 0);
      ctx.lineTo(0, -25);
      ctx.lineTo(110, 0);
      ctx.lineTo(0, 18);
      ctx.closePath();
      ctx.fill();

      // Wingtip lights
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(-110, 0, 5, 0, Math.PI * 2);
      ctx.arc(110, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      // Sleek fuselage
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 40, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing thruster
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 36, 7, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // ----------------------------------------
      // ROAD VEHICLE FORM
      // ----------------------------------------
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, carH * 0.5, carW * 0.6, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Car body
      ctx.fillStyle = carColor;
      ctx.beginPath();
      ctx.roundRect(-carW / 2, -carH / 2, carW, carH, 12);
      ctx.fill();

      // Cabin / Roof
      ctx.fillStyle = '#0b0f19';
      ctx.beginPath();
      ctx.roundRect(-carW * 0.35, -carH * 0.45, carW * 0.7, carH * 0.55, 6);
      ctx.fill();

      // Windshield & Rear glass
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.fillRect(-carW * 0.28, -carH * 0.38, carW * 0.56, carH * 0.4);

      // Tail lights
      ctx.fillStyle = this.keys.brake ? '#ff2222' : '#cc0000';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = this.keys.brake ? 18 : 6;
      ctx.fillRect(-carW * 0.45, carH * 0.32, 22, 9);
      ctx.fillRect(carW * 0.45 - 22, carH * 0.32, 22, 9);

      // Exhaust glow
      if (this.speed > 10) {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.fillRect(-carW * 0.15, carH * 0.42, 6, 8);
        ctx.fillRect(carW * 0.15 - 6, carH * 0.42, 6, 8);
      }
    }

    ctx.restore();
  }

  renderRainWeather(ctx, width, height, rainRate) {
    if (rainRate <= 0.2) return;

    // Streaking rain drops
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();

    const count = Math.min(this.rainParticles.length, Math.floor(rainRate * 6));
    for (let i = 0; i < count; i++) {
      const p = this.rainParticles[i];
      p.y += p.speed * 0.035;
      p.x += this.steerAngle * 0.015;
      if (p.y > 1) p.y = 0;
      if (p.x < 0) p.x = 1;
      if (p.x > 1) p.x = 0;

      const px = p.x * width;
      const py = p.y * height;
      ctx.moveTo(px, py);
      ctx.lineTo(px - this.steerAngle * 10, py + p.length);
    }
    ctx.stroke();

    // Windshield mist drops in heavy rain
    if (rainRate > 10) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      this.rainDropsOnScreen.forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x * width, d.y * height, d.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  renderGameHud(ctx, width, height, sector) {
    // Bottom-left Sector & NASA GPM IMERG Info Card
    ctx.fillStyle = 'rgba(10, 15, 26, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;

    const pillW = 320;
    const pillH = 72;
    const hudY = height - 96;

    ctx.beginPath();
    ctx.roundRect(24, hudY, pillW, pillH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🛰️ NASA GPM IMERG REGIONAL PRECIP', 38, hudY + 22);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(`${sector.name} · ${sector.rainRate.toFixed(1)} mm/h`, 38, hudY + 43);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10.5px system-ui, sans-serif';
    ctx.fillText(sector.desc, 38, hudY + 60);

    // Bottom-right Speedometer & Distance
    const speedKmh = Math.round(Math.abs(this.speed) * 3.6);
    ctx.beginPath();
    ctx.roundRect(width - 200, hudY, 176, pillH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 24px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${speedKmh} `, width - 80, hudY + 36);
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('KM/H', width - 42, hudY + 36);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(`📍 ${this.distanceTraveled} m explored`, width - 42, hudY + 58);
  }

  updateHudSector() {
    // Optional DOM sync if needed
  }

  // ==========================================
  // LIFECYCLE MANAGEMENT
  // ==========================================

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

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    // Stop audio
    if (this.audioNodes && this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        this.audioNodes.master.gain.setTargetAtTime(0, now, 0.1);
        setTimeout(() => {
          try {
            this.audioNodes.engineOsc.stop();
          } catch (e) {}
        }, 150);
      } catch (e) {}
    }
  }
}
