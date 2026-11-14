/**
 * Automated Verification Suite for Earth Arcade
 * NASA Space Apps Challenge — Terraphone
 */

import assert from 'assert';

// -------------------------------------------------------------
// SETUP MOCK DOM AND WEB AUDIO GLOBALS BEFORE DYNAMIC IMPORTS
// -------------------------------------------------------------
let storageData = {};
global.localStorage = {
  getItem: (k) => storageData[k] || null,
  setItem: (k, v) => { storageData[k] = String(v); },
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
  const { RainwayGame } = await import('../js/arcade/rainway.js');
  const { FirelineGame } = await import('../js/arcade/fireline.js');
  const {
    HeatEscapeGame,
    WaterKeeperGame,
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

  // Unlock Obsidian paint (cost 10)
  const unlockOk = arcadeTokens.unlockCosmetic('carPaints', 'obsidian', 10);
  assert.strictEqual(unlockOk, true, 'Unlocking obsidian paint should succeed');
  assert.strictEqual(arcadeTokens.profile.tokens, 10, 'Tokens should decrease from 20 to 10');
  arcadeTokens.equipCosmetic('carPaint', 'obsidian');
  assert.strictEqual(arcadeTokens.getEquippedSkin('carPaint'), '#0f172a', 'Equipped paint should now be Obsidian Midnight');

  // Test High Score Recording
  const result = arcadeTokens.recordHighScore('rainway', 1420, 'km');
  assert.strictEqual(result.isNewBest, true, 'First high score record should be true');
  assert.strictEqual(arcadeTokens.profile.highScores.rainway.score, 1420);

  console.log('✅ Token Economy & Cosmetics Catalog verified!\n');

  // -------------------------------------------------------------
  // TEST 2: Rainway (Endless 3D Driving Game)
  // -------------------------------------------------------------
  console.log('--- TEST 2: Rainway (Procedural 3D Driving Engine) ---');
  const mockCanvas = new MockCanvas();
  const mockAudio = new MockAudioContext();
  let exitedRainway = false;

  const rainway = new RainwayGame(mockCanvas, mockAudio, () => { exitedRainway = true; });
  assert.strictEqual(rainway.segments.length > 500, true, 'Rainway should generate procedural road segments');
  assert.strictEqual(rainway.cloudRings.length > 5, true, 'Rainway should place secret cloud glider rings');

  rainway.start();
  assert.strictEqual(rainway.isRunning, true, 'Rainway should be running');

  // Simulate Driving Physics
  rainway.keys.up = true;
  rainway.update(0.1);
  assert.strictEqual(rainway.speed > 0, true, 'Vehicle should accelerate forward');

  // Test Autopilot
  rainway.toggleAutopilot();
  assert.strictEqual(rainway.isAutopilot, true, 'Autopilot should toggle on');
  for (let s = 0; s < 15; s++) {
    rainway.update(0.1);
  }
  assert.strictEqual(rainway.speed > 20, true, 'Autopilot should maintain cruising speed');

  // Test Cloud Glider Transformation
  rainway.triggerGliderMode();
  assert.strictEqual(rainway.isGliderMode, true, 'Cloud Glider flight mode should activate');
  assert.strictEqual(rainway.cameraMode, 'glider', 'Camera should switch to glider view');

  rainway.pause();
  assert.strictEqual(rainway.isPaused, true, 'Rainway should pause');
  rainway.resume();
  assert.strictEqual(rainway.isPaused, false, 'Rainway should resume');

  rainway.stop();
  assert.strictEqual(rainway.isRunning, false, 'Rainway should stop cleanly');
  console.log('✅ Rainway 3D driving & Cloud Glider verified!\n');

  // -------------------------------------------------------------
  // TEST 3: Fireline (2.5D Isometric Forest Exploration)
  // -------------------------------------------------------------
  console.log('--- TEST 3: Fireline (2.5D Isometric Forest Engine) ---');
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
  // TEST 4: Six Environmental Mini Games
  // -------------------------------------------------------------
  console.log('--- TEST 4: Six Environmental Exploration Mini-Games ---');

  // 03. Heat Escape
  const heat = new HeatEscapeGame(mockCanvas, mockAudio, () => {});
  heat.start();
  heat.keys.up = true;
  heat.update(0.1);
  assert.strictEqual(heat.cityBlocks.length > 20, true, 'Heat Escape should have ECOSTRESS city blocks');
  heat.pause();
  assert.strictEqual(heat.isPaused, true, 'Heat Escape should pause');
  heat.stop();
  console.log('  ✓ 03. Heat Escape (NASA ECOSTRESS LST) verified');

  // 04. Water Keeper
  const water = new WaterKeeperGame(mockCanvas, mockAudio, () => {});
  water.start();
  water.update(0.1);
  assert.strictEqual(water.terrain.length > 10, true, 'Water Keeper should have SMAP soil moisture terrain');
  water.pause();
  assert.strictEqual(water.isPaused, true, 'Water Keeper should pause');
  water.stop();
  console.log('  ✓ 04. Water Keeper (NASA SMAP Soil Moisture) verified');

  // 05. Cloud Courier
  const cloud = new CloudCourierGame(mockCanvas, mockAudio, () => {});
  cloud.start();
  cloud.update(0.016);
  assert.strictEqual(cloud.pollutionPlumes.length > 10, true, 'Cloud Courier should have OMI SO2/NO2 plumes');
  cloud.pause();
  assert.strictEqual(cloud.isPaused, true, 'Cloud Courier should pause');
  cloud.stop();
  console.log('  ✓ 05. Cloud Courier (NASA OMI & GPM) verified');

  // 06. Ozone Drift
  const ozone = new OzoneDriftGame(mockCanvas, mockAudio, () => {});
  ozone.start();
  ozone.update(0.016);
  assert.strictEqual(ozone.gasCanisters.length > 10, true, 'Ozone Drift should have stratospheric canisters');
  ozone.pause();
  assert.strictEqual(ozone.isPaused, true, 'Ozone Drift should pause');
  ozone.stop();
  console.log('  ✓ 06. Ozone Drift (NASA Ozone Watch / Aura OMI) verified');

  // 07. Coral Current
  const coral = new CoralCurrentGame(mockCanvas, mockAudio, () => {});
  coral.start();
  coral.update(0.016);
  assert.strictEqual(coral.corals.length > 20, true, 'Coral Current should have NOAA CRW barrier reef sections');
  coral.pause();
  assert.strictEqual(coral.isPaused, true, 'Coral Current should pause');
  coral.stop();
  console.log('  ✓ 07. Coral Current (NOAA Coral Reef Watch) verified');

  // 08. Last Forest
  const forest = new LastForestGame(mockCanvas, mockAudio, () => {});
  forest.start();
  forest.update(0.016);
  assert.strictEqual(forest.trees.length > 20, true, 'Last Forest should have Landsat canopy trees');
  forest.pause();
  assert.strictEqual(forest.isPaused, true, 'Last Forest should pause');
  forest.stop();
  console.log('  ✓ 08. Last Forest (NASA / USGS Landsat Canopy) verified');

  // -------------------------------------------------------------
  // TEST 5: ArcadeHub Coordination & Game Launching
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: ArcadeHub Lifecycle & Game Orchestration ---');
  assert.strictEqual(ARCADE_GAMES.length, 8, 'Earth Arcade must feature all 8 games');

  const mockContainer = {
    innerHTML: '',
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const hub = new ArcadeHub(mockContainer, mockAudio);
  assert.strictEqual(hub.activeGameInstance, null, 'Hub should start with no active game');

  // Test launching a mini-game
  hub.launchGame('rainway');
  assert.notStrictEqual(hub.activeGameInstance, null, 'Active game instance should be running Rainway');
  assert.strictEqual(hub.activeGameId, 'rainway');

  hub.closeActiveGame();
  assert.strictEqual(hub.activeGameInstance, null, 'Active game should be cleaned up on close');
  assert.strictEqual(hub.activeGameId, null);

  console.log('✅ ArcadeHub coordination verified!\n');

  console.log('🎉 ALL EARTH ARCADE TESTS PASSED 100%! 🌟');
  process.exit(0);
}

runArcadeTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
