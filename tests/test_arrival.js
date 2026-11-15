// Exercise the two inline scripts in their actual order, including first-paint gating.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].slice(0, 2).map(match => match[1]);
const storage = new Map();

function visit(hash = '', reduced = false) {
  const classes = new Set();
  const input = new EventTarget();
  const arrival = new EventTarget();
  arrival.remove = () => { arrival.removed = true; };
  const context = {
    AbortController, window: input, location: { hash }, matchMedia: () => ({ matches: reduced }),
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    document: { documentElement: { classList: {
      add: name => classes.add(name), contains: name => classes.has(name), remove: name => classes.delete(name)
    } }, querySelector: () => arrival }
  };
  for (const script of scripts) runInNewContext(script, context);
  return { classes, arrival, input };
}
assert.equal(visit('#arcade').classes.size, 0);
assert.equal(visit('', true).classes.size, 0);
assert.equal(storage.size, 0);
for (const event of ['pointerdown', 'keydown', 'wheel', 'animationend', 'animationcancel']) {
  storage.clear();
  const { classes, arrival, input } = visit();
  assert.ok(classes.has('first-arrival'));
  assert.equal(visit().classes.size, 0);
  (event.startsWith('animation') ? arrival : input).dispatchEvent(new Event(event));
  assert.ok(arrival.removed);
  assert.equal(classes.size, 0);
}
console.log('Arrival timing gate, shortcuts, motion preference and dismissal passed.');
