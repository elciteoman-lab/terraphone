import { arcadeTokens } from './arcade-tokens.js';
import { prepareGameArt, renderGame } from './art/frame.js';
import { paintOrbit, prepareOrbit } from './art/orbit.js';
import { orbitReadout } from './game-readout.js';

export class OzoneDriftGame {
  static prepareArtwork(width, height) {
    return prepareGameArt(width, height, prepareOrbit);
  }

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
    renderGame(this, paintOrbit, orbitReadout);
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
