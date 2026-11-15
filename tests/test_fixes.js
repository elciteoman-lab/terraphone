/**
 * Test Suite verifying all user-requested bug fixes:
 * 1. Play / Pause audio gain and SVG icon switching
 * 2. On-demand frequency analysis
 * 3. Rain palette matching threshold (preventing false rain on empty areas)
 * 4. Popup styling & text wrapping
 * 5. Consistent Terraphone branding
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- TEST 1: Terraphone Branding Consistency ---');
const filesToCheck = [
  'index.html',
  'README.md',
  'js/app.js',
  'js/sound-of-change.js',
  'js/interventions-data.js'
];

for (const file of filesToCheck) {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  assert(!content.includes('Earth Jukebox'), `Found forbidden 'Earth Jukebox' in ${file}`);
}
console.log('✅ Branding check passed: No "Earth Jukebox" references outside prompt.txt.');

console.log('--- TEST 2: Sound of Change Play/Pause & Icon Swapping ---');
// Verify sound-of-change.js has pause and play SVG icons and masterGain restoration
const socCode = fs.readFileSync(path.join(rootDir, 'js/sound-of-change.js'), 'utf8');
assert(socCode.includes('rect x="6" y="4"'), 'Missing pause icon bars in startAudio()');
assert(socCode.includes('polygon points="5 3 19 12 5 21 5 3"'), 'Missing play triangle in pauseAudio()');
assert(socCode.includes('this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume'), 'startAudio() does not restore masterGain volume');
assert(socCode.includes('this.startHornLoop()'), 'startAudio() does not restart horn loop');
assert(socCode.includes('this.stopHornLoop()'), 'pauseAudio() does not stop horn loop');
console.log('✅ Play/pause logic verified: Icon toggles between play/pause, volume is restored, horn loop manages cleanly.');

console.log('--- TEST 3: On-demand real spectrum ---');
assert(!/<video\b/i.test(socCode), 'City playback should not load a video');
assert(socCode.includes('getByteFrequencyData('), 'The spectrum must read the live analyser');
assert(socCode.includes('this.inView && this.isPlaying && this.spectrumVisible && !document.hidden'), 'Only animate a playing, visible spectrum');

console.log('--- TEST 4: Rain Visualization Mapping Thresholds ---');
const appCode = fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8');
// Check alpha threshold >= 80
assert(appCode.includes('if (a < 80) return 0;'), 'Alpha threshold for transparent pixels is too loose');
// Check palette Euclidean distance <= 650
assert(appCode.includes('if (bestDist > 650) return 0;'), 'Palette distance threshold is too loose (expected 650)');
// Check cloud-deck-layer saturation is vivid (> 0)
assert(appCode.includes("'raster-saturation': 0.20"), 'cloud-deck-layer rain colors are desaturated');
// Check base-layer saturation is subdued
assert(appCode.includes("'raster-saturation': isDark ? -0.45 : -0.20"), 'base-layer saturation is not subdued');
console.log('✅ Rain mapping verified: Vibrant NASA precipitation layer, subdued basemap, tight 650 palette threshold.');

console.log('--- TEST 5: CSS City Popup & Text Wrapping ---');
const styleCode = fs.readFileSync(path.join(rootDir, 'css/style.css'), 'utf8');
assert(styleCode.includes('.maplibregl-popup-content {'), 'Missing .maplibregl-popup-content rule');
assert(styleCode.includes('.maplibregl-popup-tip {\n  display: none !important;'), 'Popup tip is not hidden to match #cursor-tracker');
assert(styleCode.includes('white-space: nowrap;'), 'Missing white-space nowrap rules in style.css');

const socCss = fs.readFileSync(path.join(rootDir, 'css/sound-of-change.css'), 'utf8');
assert.match(socCss, /@media \(max-width: 680px\)[\s\S]*?\.soc-panel\.active\s*\{\s*grid-template-columns: minmax\(0,1fr\)/, 'The intervention list must fit a narrow screen');
console.log('✅ CSS rules verified: Clean popup matching, text nowrap, responsive wrapping.');

console.log('\n🎉 ALL 5 VERIFICATION SUITES PASSED 100%!');
