/**
 * Automated Verification Suite for Earth Arcade
 * NASA Space Apps Challenge — Terraphone
 */

import assert from 'assert';

// -------------------------------------------------------------
// SETUP MOCK DOM AND WEB AUDIO GLOBALS BEFORE DYNAMIC IMPORTS
// -------------------------------------------------------------
let storageData = {};
let storageWrites = 0;
global.localStorage = {
  getItem: (k) => storageData[k] || null,
  setItem: (k, v) => { storageData[k] = String(v); storageWrites++; },
  removeItem: (k) => { delete storageData[k]; },
  clear: () => { storageData = {}; }
};

class MockCanvasContext {
  constructor() {
    this.fillStyle = '#000';
    this.strokeStyle = '#fff';
    this.lineWidth = 1;
    this.font = '12px sans-serif';
    this.textAlign = 'left';
    this.globalAlpha = 1;
  }
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  arcTo() {}
  ellipse() {}
  rect() {}
  roundRect() {}
  fill() {}
  stroke() {}
  fillRect() {}
  strokeRect() {}
  clearRect() {}
  fillText() {}
  measureText(text) { return { width: text.length * 7 }; }
  bezierCurveTo() {}
  quadraticCurveTo() {}
  setLineDash() {}
  drawImage() { this.imagesDrawn = (this.imagesDrawn || 0) + 1; }
  setTransform() {}
  clip() {}
  createImageData(width, height) { return { data: new Uint8ClampedArray(width * height * 4) }; }
  putImageData() {}
  save() {}
  restore() {}
  translate() {}
  rotate() {}
  scale() {}
  createLinearGradient() {
    return { addColorStop() {} };
  }
  createRadialGradient() {
    return { addColorStop() {} };
  }
}

class MockCanvas {
  constructor(width = 1280, height = 720) {
    this.width = width;
    this.height = height;
    this._ctx = new MockCanvasContext();
  }
  addEventListener() {}
  removeEventListener() {}
  focus() {}
  getContext(type) {
    return this._ctx;
  }
}

class MockAudioParam {
  constructor(val = 0) {
    this.value = val;
  }
  setValueAtTime(v) { this.value = v; }
  linearRampToValueAtTime(v) { this.value = v; }
  exponentialRampToValueAtTime(v) { this.value = v; }
  setTargetAtTime(v) { this.value = v; }
  cancelScheduledValues() {}
}

class MockAudioNode {
  constructor() {
    this.gain = new MockAudioParam(1);
    this.frequency = new MockAudioParam(440);
    this.Q = new MockAudioParam(1);
  }
  connect() { return this; }
  disconnect() {}
  start() {}
  stop() {}
}

class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
  }
  createGain() { return new MockAudioNode(); }
  createOscillator() { return new MockAudioNode(); }
  createBiquadFilter() { return new MockAudioNode(); }
  createBufferSource() { return new MockAudioNode(); }
  createBuffer(channels, length, sampleRate) {
    return {
      getChannelData() { return new Float32Array(length); }
    };
  }
}

global.window = {
  innerWidth: 1280,
  innerHeight: 720,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true
};

global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') return new MockCanvas();
    const el = {
      tagName: tag.toUpperCase(),
      classList: {
        _list: new Set(),
        add(c) { this._list.add(c); },
        remove(c) { this._list.delete(c); },
        contains(c) { return this._list.has(c); },
        toggle(c) { if (this.contains(c)) { this.remove(c); return false; } else { this.add(c); return true; } }
      },
      style: {},
      innerHTML: '',
      textContent: '',
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
      setAttribute: () => {},
      getAttribute: () => null,
      closest: () => null,
      prepend: () => {}
    };
    return el;
  },
  getElementById: (id) => {
    if (id === 'arcade-canvas') {
      return new MockCanvas();
    }
    return {
      id,
      style: {},
      innerHTML: '',
      textContent: '',
      classList: {
        add() {},
        remove() {},
        toggle() {},
        contains() { return false; }
      },
      addEventListener() {},
      removeEventListener() {},
      focus() {},
      querySelector() { return null; },
      querySelectorAll() { return []; }
    };
  }
};

global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

async function runArcadeTests() {
  console.log('🎮 --- STARTING EARTH ARCADE AUTOMATED TEST SUITE --- 🎮\n');

  // Dynamic import of modules after mock setup
  const { arcadeTokens, COSMETICS_CATALOG } = await import('../js/arcade/arcade-tokens.js');
  const { FirelineGame } = await import('../js/arcade/fireline.js');
  const {
    HeatEscapeGame,
    CloudCourierGame,
    OzoneDriftGame,
    CoralCurrentGame,
    LastForestGame
  } = await import('../js/arcade/mini-games.js');
  const { ArcadeHub, ARCADE_GAMES } = await import('../js/arcade/arcade-hub.js');

  // -------------------------------------------------------------
  // TEST 1: Token Economy, Zen Minute Accrual & Cosmetics
  // -------------------------------------------------------------
  console.log('--- TEST 1: Zen Mode Token Economy & Cosmetics ---');
  global.localStorage.clear();
  arcadeTokens.load();

  assert.strictEqual(arcadeTokens.profile.tokens, 15, 'Initial onboarding tokens should be 15');
  assert.strictEqual(arcadeTokens.profile.zenMinutes, 0, 'Initial zen minutes should be 0');

  // Record 5 active Zen minutes
  for (let i = 0; i < 5; i++) {
    arcadeTokens.recordZenMinute();
  }
  assert.strictEqual(arcadeTokens.profile.zenMinutes, 5, 'Zen minutes should increment to 5');
  assert.strictEqual(arcadeTokens.profile.tokens, 20, 'Tokens should increment from 15 to 20');

  // Test Cosmetics Catalog and Equipping
  const defaultPaint = arcadeTokens.getEquippedSkin('carPaint');
  assert.strictEqual(defaultPaint, '#38bdf8', 'Default car paint should be Skyline Cyan');

  const crown = COSMETICS_CATALOG.crowns.find(item => item.id === 'golden_crown');
  assert.equal(crown.cost, 20000);
  assert.equal(arcadeTokens.unlockCosmetic('crowns', crown.id, crown.cost), false);
  arcadeTokens.addTokens(20000);
  assert.equal(arcadeTokens.unlockCosmetic('crowns', crown.id, crown.cost), true);
  assert.equal(arcadeTokens.profile.tokens, 20);
  arcadeTokens.equipCosmetic('crown', crown.id);
  assert.equal(arcadeTokens.getEquippedSkin('crown'), crown.hex);

  // Test High Score Recording
  const beforeRecord = storageWrites;
  const result = arcadeTokens.recordHighScore('heat_escape', 1420, 'm');
  assert.strictEqual(result.isNewBest, true, 'First high score record should be true');
  assert.strictEqual(arcadeTokens.profile.highScores.heat_escape.score, 1420);
  assert.equal(storageWrites, beforeRecord + 1, 'Record and wallet should be saved together');
  assert.deepEqual(arcadeTokens.recordHighScore('heat_escape', 1420, 'm'), { isNewBest: false, best: 1420 });
  assert.equal(storageWrites, beforeRecord + 1, 'A repeated score must not write each frame');

  console.log('✅ Token Economy & Cosmetics Catalog verified!\n');

  // -------------------------------------------------------------
  const mockCanvas = new MockCanvas();
  const mockAudio = new MockAudioContext();

  // TEST 2: Fireline (2.5D Isometric Forest Exploration)
  // -------------------------------------------------------------
  console.log('--- TEST 2: Fireline (2.5D Isometric Forest Engine) ---');
  let exitedFireline = false;
  const fireline = new FirelineGame(mockCanvas, mockAudio, () => { exitedFireline = true; });

  assert.strictEqual(fireline.trees.length > 50, true, 'Fireline should populate procedural pines and birch trees');
  assert.strictEqual(fireline.firmsAnomalies.length > 5, true, 'NASA FIRMS thermal risk bands should be present');
  assert.strictEqual(fireline.seeds.length > 10, true, 'Forest seeds should be distributed');

  fireline.start();
  assert.strictEqual(fireline.isRunning, true, 'Fireline should be running');

  // Simulate Player Movement
  fireline.keys.right = true;
  fireline.keys.down = true;
  fireline.update(0.1);
  assert.strictEqual(fireline.player.x !== 0 || fireline.player.y !== 0, true, 'Player should move across isometric plane');

  // Test Golden Firefly Flight Transformation
  fireline.triggerFireflyMode();
  assert.strictEqual(fireline.player.isFirefly, true, 'Golden Firefly mode should be active');
  assert.strictEqual(fireline.getSpeed() > 250, true, 'Firefly should possess soaring flight speed');

  fireline.stop();
  assert.strictEqual(fireline.isRunning, false, 'Fireline should stop cleanly');
  console.log('✅ Fireline isometric forest & Golden Firefly verified!\n');

  // -------------------------------------------------------------
  // TEST 3: Five Environmental Mini Games
  // -------------------------------------------------------------
  console.log('--- TEST 3: Five Environmental Exploration Mini-Games ---');

  // 02. Heat Escape
  const heat = new HeatEscapeGame(mockCanvas, mockAudio, () => {});
  heat.start();
  assert.equal(heat.numLanes, 5);
  heat.changeLane(1);
  assert.equal(heat.targetLane, 3);
  heat.jump();
  heat.update(0.016);
  assert.ok(heat.player.isJumping && heat.player.distance > 0);
  heat.pause();
  assert.strictEqual(heat.isPaused, true, 'Heat Escape should pause');
  heat.stop();
  console.log('  ✓ 02. Heat Escape (NASA ECOSTRESS LST) verified');

  // 03. Cloud Courier
  const cloud = new CloudCourierGame(mockCanvas, mockAudio, () => {});
  cloud.start();
  cloud.update(0.016);
  assert.equal(cloud.smokestackGates.length, 8, 'Cloud Courier should maintain eight gates ahead');
  cloud.pause();
  assert.strictEqual(cloud.isPaused, true, 'Cloud Courier should pause');
  cloud.stop();
  console.log('  ✓ 03. Cloud Courier (NASA OMI & GPM) verified');

  // 04. Ozone Drift
  const ozone = new OzoneDriftGame(mockCanvas, mockAudio, () => {});
  ozone.start();
  ozone.update(0.016);
  assert.strictEqual(ozone.gasCanisters.length > 10, true, 'Ozone Drift should have stratospheric canisters');
  ozone.pause();
  assert.strictEqual(ozone.isPaused, true, 'Ozone Drift should pause');
  ozone.stop();
  console.log('  ✓ 04. Ozone Drift (NASA Ozone Watch / Aura OMI) verified');

  // 05. Coral Current
  const coral = new CoralCurrentGame(mockCanvas, mockAudio, () => {});
  coral.start();
  coral.update(0.016);
  assert.strictEqual(coral.corals.length > 20, true, 'Coral Current should have NOAA CRW barrier reef sections');
  coral.pause();
  assert.strictEqual(coral.isPaused, true, 'Coral Current should pause');
  coral.stop();
  console.log('  ✓ 05. Coral Current (NOAA Coral Reef Watch) verified');

  // 06. Last Forest
  const forest = new LastForestGame(mockCanvas, mockAudio, () => {});
  forest.start();
  forest.update(0.016);
  assert.strictEqual(forest.canopyLayers.length > 20, true, 'Last Forest should have Landsat canopy trees');
  forest.pause();
  assert.strictEqual(forest.isPaused, true, 'Last Forest should pause');
  forest.stop();
  console.log('  ✓ 06. Last Forest (NASA / USGS Landsat Canopy) verified');

  // -------------------------------------------------------------
  // TEST 4: ArcadeHub Coordination & Game Launching
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: ArcadeHub Lifecycle & Game Orchestration ---');
  assert.deepEqual(ARCADE_GAMES.map(game => game.id), ['fireline', 'heat_escape', 'cloud_courier', 'ozone_drift', 'coral_current', 'last_forest']);

  for (const game of [fireline, heat, cloud, ozone, coral, forest]) {
    game.canvas = new MockCanvas(390, 740);
    game.ctx = game.canvas.getContext('2d');
    const before = arcadeTokens.profile.tokens;
    game.render();
    const art = game.art;
    const initialSurfaces = [...art.cache.values()];
    game.render();
    assert.equal(game.art, art);
    assert.ok(initialSurfaces.length > 0 && initialSurfaces.every(surface => [...art.cache.values()].includes(surface)));
    assert.equal(game.ctx.imagesDrawn, 2);
    assert.equal(arcadeTokens.profile.tokens, before);
    const events = [];
    game.onResultChange = ended => events.push(ended);
    game.isGameOver = true;
    game.render();
    game.render();
    assert.equal(game.ctx.imagesDrawn, 3, 'Finished worlds should freeze');
    game.isGameOver = false;
    game.render();
    assert.deepEqual(events, [true, false]);
    game.canvas.width = 500;
    game.render();
    assert.notEqual(game.art, art, 'Resize must rebuild resolution-dependent art');
  }

  const idleQueue = new Map();
  let idleId = 0;
  window.requestIdleCallback = cb => { idleQueue.set(++idleId, cb); return idleId; };
  window.cancelIdleCallback = id => idleQueue.delete(id);
  for (const Game of [FirelineGame, OzoneDriftGame]) {
    const work = Game.prepareArtwork(390, 740);
    const [id, step] = idleQueue.entries().next().value;
    idleQueue.delete(id);
    step({ timeRemaining: () => 0 });
    work.cancel();
    assert.equal(idleQueue.size, 0);
    assert.ok(work.art.cache.size > 0);
    const game = new Game(new MockCanvas(390, 740), null, () => {});
    game.art = work.art;
    game.render();
    assert.equal(game.art, work.art, 'A quick launch must finish its partially prepared artwork');
    game.stop();
  }

  const mockContainer = document.createElement('main');
  mockContainer.querySelector = () => document.createElement('div');
  const hub = new ArcadeHub(mockContainer, mockAudio);
  assert.strictEqual(hub.activeGameInstance, null, 'Hub should start with no active game');

  for (const { id } of ARCADE_GAMES) {
    await hub.launchGame(id);
    assert.equal(hub.activeGameId, id);
    assert.ok(hub.activeGameInstance.isRunning, id + ' should run');
    hub.closeActiveGame();
    assert.equal(hub.activeGameInstance, null);
    assert.equal(hub.activeGameId, null);
  }

  const abandonedLaunch = hub.launchGame('last_forest');
  hub.closeActiveGame();
  await abandonedLaunch;
  assert.equal(hub.activeGameInstance, null, 'Leaving a loading game must cancel its pending launch');
  const firstLaunch = hub.launchGame('cloud_courier');
  const latestLaunch = hub.launchGame('ozone_drift');
  await Promise.all([firstLaunch, latestLaunch]);
  assert.ok(hub.activeGameInstance instanceof OzoneDriftGame);
  hub.closeActiveGame();

  console.log('✅ ArcadeHub coordination verified!\n');

  console.log('🎉 ALL EARTH ARCADE TESTS PASSED 100%! 🌟');
  process.exit(0);
}

runArcadeTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
