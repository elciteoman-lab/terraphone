import assert from 'node:assert/strict';
// Minimal browser environment simulation for full integration test
class MockClassList {
  constructor() { this.classes = new Set(); }
  add(...c) { c.forEach(x => this.classes.add(x)); }
  remove(...c) { c.forEach(x => this.classes.delete(x)); }
  toggle(c, force) {
    if (force !== undefined) {
      if (force) this.classes.add(c); else this.classes.delete(c);
      return force;
    }
    if (this.classes.has(c)) { this.classes.delete(c); return false; }
    this.classes.add(c); return true;
  }
  contains(c) { return this.classes.has(c); }
}

class MockElement {
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.dataset = {};
    this.classList = new MockClassList();
    this.attributes = {};
    this.style = {};
    this.width = 512;
    this.height = 80;
    this.children = [];
    this.listeners = {};
    this.innerHTML = '';
    this.textContent = '';
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k]; }
  addEventListener(evt, fn) {
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(fn);
  }
  dispatchEvent(evt) {
    const list = this.listeners[evt.type] || [];
    list.forEach(fn => fn(evt));
  }
  click() {
    this.dispatchEvent({ type: 'click', target: this, stopPropagation: () => {} });
  }
  querySelector(sel) { return getOrCreate(sel); }
  focus() {}
  getContext() { return { clearRect() {}, fillRect() {} }; }
  querySelectorAll(sel) { return []; }
  appendChild(child) { this.children.push(child); return child; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 1000, height: 600 }; }
  play() { return Promise.resolve(); }
  pause() {}
}

const elements = new Map();
function getOrCreate(id, tag = 'div') {
  if (!elements.has(id)) {
    elements.set(id, new MockElement(tag, id));
  }
  return elements.get(id);
}

global.document = {
  getElementById: (id) => getOrCreate(id),
  createElement: (tag) => new MockElement(tag),
  addEventListener: () => {},
  removeEventListener: () => {},
  hidden: false,
  querySelectorAll: () => [],
  activeElement: { tagName: 'BODY' }
};

global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: () => {},
  history: { replaceState: () => {} },
  location: { hash: '' },
  localStorage: { getItem: () => null, setItem: () => {} },
  matchMedia: () => ({ addEventListener: () => {} })
};

class MockAudioNode {
  connect() {}
  disconnect() {}
}
class MockGainNode extends MockAudioNode {
  constructor() {
    super();
    this.gain = {
      value: 1,
      setValueAtTime: (v) => {},
      setTargetAtTime: (v) => {},
      linearRampToValueAtTime: (v) => {},
      exponentialRampToValueAtTime: (v) => {},
      cancelScheduledValues: (t) => {}
    };
  }
}
class MockBiquadFilterNode extends MockAudioNode {
  constructor() {
    super();
    this.type = 'lowpass';
    this.frequency = { setValueAtTime: () => {}, setTargetAtTime: () => {} };
    this.Q = { setValueAtTime: () => {} };
    this.gain = { setValueAtTime: () => {} };
  }
}
class MockOscillatorNode extends MockAudioNode {
  constructor() {
    super();
    this.frequency = { setValueAtTime: () => {} };
  }
  start() {}
  stop() {}
}

global.AudioContext = class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = new MockAudioNode();
    this.state = 'running';
  }
  createGain() { return new MockGainNode(); }
  createAnalyser() { return { frequencyBinCount: 256, getByteFrequencyData(data) { data.fill(36); } }; }
  createBiquadFilter() { return new MockBiquadFilterNode(); }
  createOscillator() { return new MockOscillatorNode(); }
  createBuffer(channels, length, rate) {
    return { getChannelData: () => new Float32Array(length) };
  }
  createBufferSource() {
    return { buffer: null, loop: false, connect: () => {}, start: () => {}, stop: () => {} };
  }
  createMediaElementSource() { return new MockAudioNode(); }
  resume() { return Promise.resolve(); }
};

const frames = new Map();
let frameId = 0;
global.requestAnimationFrame = fn => { frames.set(++frameId, fn); return frameId; };
global.cancelAnimationFrame = id => frames.delete(id);
global.Audio = class MockAudio {
  constructor() {
    this.src = '';
    this.loop = false;
  }
  play() { return Promise.resolve(); }
  pause() {}
};

console.log('Testing App import and initialization in simulated DOM...');
import('../js/interventions-data.js').then(({ INTERVENTIONS, INTERVENTION_CATEGORIES }) => {
  console.log('Interventions data loaded:', INTERVENTIONS.length, 'items');
  return import('../js/sound-of-change.js').then(({ SoundOfChangeEngine }) => {
    const container = new MockElement('div', 'sound-of-change-view');
    const engine = new SoundOfChangeEngine(new global.AudioContext());
    engine.mount(container);
    assert.equal(frames.size, 0, 'Mounting a silent scene must not start an animation loop');
    
    // Test toggles
    console.log('Toggling electric_public_transport...');
    engine.toggleIntervention('electric_public_transport');
    assert.ok(engine.activeInterventions.has('electric_public_transport'), 'Must be active');
    
    console.log('Testing audio start...');
    engine.startAudio();
    assert.ok(engine.isPlaying === true, 'Audio must be playing');

    assert.equal(frames.size, 1);
    engine.enter();
    assert.equal(frames.size, 1, 'Re-entering must not duplicate a loop');
    engine.renderCavaFrame(1 / 60);
    assert.ok(engine.cavaBarValues.some(value => value > 0), 'FFT data must feed the displayed bars');
    document.hidden = true;
    engine.onVisibility();
    assert.equal(frames.size, 0);
    document.hidden = false;
    engine.onVisibility();
    assert.equal(frames.size, 1);
    console.log('Testing perspective switch...');
    engine.perspective = 'indoor';
    engine.updateSimulation();
    const indState = engine.calculateAcousticState();
    console.log('Indoor State with Electric Transport:', indState.index);
    assert.ok(indState.index <= 72, 'Indoor state should be lower than baseline');

    console.log('Testing audio stop...');
    engine.leave();
    assert.equal(frames.size, 0);
    engine.enter();
    assert.equal(frames.size, 0, 'Returning should stay silent until requested');
    engine.stop();
    assert.ok(engine.isPlaying === false, 'Audio must be stopped');

    console.log('✅ Mock DOM Integration Test Passed 100%!');
  });
}).catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
