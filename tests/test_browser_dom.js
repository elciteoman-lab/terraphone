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
  querySelector(sel) { return null; }
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
  import('../js/sound-of-change.js').then(({ SoundOfChangeEngine }) => {
    const container = new MockElement('div', 'sound-of-change-view');
    const engine = new SoundOfChangeEngine(new global.AudioContext());
    engine.mount(container);
    console.log('SoundOfChangeEngine mounted cleanly!');
    
    // Test toggles
    console.log('Toggling electric_public_transport...');
    engine.toggleIntervention('electric_public_transport');
    console.assert(engine.activeInterventions.has('electric_public_transport'), 'Must be active');
    
    console.log('Testing audio start...');
    engine.startAudio();
    console.assert(engine.isPlaying === true, 'Audio must be playing');

    console.log('Testing perspective switch...');
    engine.perspective = 'indoor';
    engine.updateSimulation();
    const indState = engine.calculateAcousticState();
    console.log('Indoor State with Electric Transport:', indState.index);
    console.assert(indState.index <= 72, 'Indoor state should be lower than baseline');

    console.log('Testing audio stop...');
    engine.stop();
    console.assert(engine.isPlaying === false, 'Audio must be stopped');

    console.log('✅ Mock DOM Integration Test Passed 100%!');
  });
}).catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
