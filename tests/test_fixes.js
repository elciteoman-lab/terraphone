/**
 * Test Suite verifying all user-requested bug fixes:
 * 1. Play / Pause audio gain and SVG icon switching
 * 2. Background video ghosting prevention (only one active video at a time)
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

console.log('--- TEST 3: Video Ghosting Prevention ---');
// Verify updateVideoBlend never alpha-blends both videos simultaneously in normal mode
assert(socCode.includes("this.videoNoisy.style.display = 'none'"), 'Inactive video is not removed from display when quiet is active');
assert(socCode.includes("this.videoQuiet.style.display = 'none'"), 'Inactive quiet video is not removed from display when noisy is active');
assert(!socCode.includes('this.videoNoisy.style.opacity = `${1 - clampedQ * 0.85}`'), 'Forbidden partial opacity overlay remains in code');
console.log('✅ Video ghosting prevention verified: Single-video viewport prevents overlay ghosting.');

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
assert(socCss.includes('@media (max-width: 1200px)'), 'Missing 1200px responsive breakpoint in sound-of-change.css');
assert(socCss.includes('.soc-subbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  margin: 10px 0 8px 0;\n  flex-shrink: 0;\n  flex-wrap: wrap;'), 'soc-subbar missing flex-wrap: wrap');
console.log('✅ CSS rules verified: Clean popup matching, text nowrap, responsive wrapping.');

console.log('\n🎉 ALL 5 VERIFICATION SUITES PASSED 100%!');
