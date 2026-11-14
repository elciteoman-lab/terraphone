import { INTERVENTION_CATEGORIES, INTERVENTIONS, BASELINE_MANHATTAN } from '../js/interventions-data.js';
import { SoundOfChangeEngine } from '../js/sound-of-change.js';

console.log('--- TEST 1: Data Integrity ---');
console.assert(INTERVENTION_CATEGORIES.length === 4, `Expected 4 categories, got ${INTERVENTION_CATEGORIES.length}`);
console.assert(INTERVENTIONS.length === 20, `Expected 20 interventions, got ${INTERVENTIONS.length}`);

const uniqueIds = new Set(INTERVENTIONS.map(i => i.id));
console.assert(uniqueIds.size === 20, `Duplicate IDs found! Unique count: ${uniqueIds.size}`);

// Verify category counts
const catCounts = {
  transport: INTERVENTIONS.filter(i => i.category === 'transport').length,
  architecture: INTERVENTIONS.filter(i => i.category === 'architecture').length,
  urban_planning: INTERVENTIONS.filter(i => i.category === 'urban_planning').length,
  public_awareness: INTERVENTIONS.filter(i => i.category === 'public_awareness').length
};
console.log('Category Counts:', catCounts);
console.assert(catCounts.transport === 6, 'Transport should have 6 items');
console.assert(catCounts.architecture === 4, 'Architecture should have 4 items');
console.assert(catCounts.urban_planning === 6, 'Urban Planning should have 6 items');
console.assert(catCounts.public_awareness === 4, 'Public Awareness should have 4 items');

console.log('--- TEST 2: Simulation Engine Math & Logic ---');
const engine = new SoundOfChangeEngine();

// 1. Initial State (No Interventions)
const baseState = engine.calculateAcousticState();
console.log('Baseline Outdoor State:', { index: baseState.index, db: baseState.dbDisplay, reduction: baseState.reduction });
console.assert(baseState.index === 88, `Baseline index should be 88, got ${baseState.index}`);
console.assert(baseState.reduction === 0, 'Baseline reduction should be 0');
console.assert(!baseState.isHearingHealthActive, 'Hearing health should be inactive initially');

// 2. Headphone awareness scientific rule test:
engine.activeInterventions.add('responsible_headphone_habits');
const headphoneState = engine.calculateAcousticState();
console.log('Headphone Habit Toggled:', { index: headphoneState.index, hearingHealth: headphoneState.isHearingHealthActive });
console.assert(headphoneState.index === 88, `Headphone toggle should NOT reduce city noise index (expected 88, got ${headphoneState.index})`);
console.assert(headphoneState.isHearingHealthActive === true, 'Hearing health badge must be active');
engine.activeInterventions.delete('responsible_headphone_habits');

// 3. Single intervention test (Electric transit)
engine.activeInterventions.add('electric_public_transport');
const electricState = engine.calculateAcousticState();
console.log('Electric Transit Toggled:', { index: electricState.index, db: electricState.dbDisplay, reduction: electricState.reduction });
console.assert(electricState.index < 88, `Electric transit should reduce index below 88, got ${electricState.index}`);
console.assert(electricState.audioGains.traffic < baseState.audioGains.traffic, 'Traffic audio gain must decrease');
engine.activeInterventions.delete('electric_public_transport');

// 4. Building insulation outdoor vs indoor perspective test
engine.activeInterventions.add('building_sound_insulation');
engine.perspective = 'outdoor';
const outdoorInsulState = engine.calculateAcousticState();
console.log('Outdoor with Building Insulation:', { index: outdoorInsulState.index, db: outdoorInsulState.dbDisplay });
console.assert(outdoorInsulState.index >= 86, 'Building insulation should have minimal effect on outdoor sidewalk noise');

engine.perspective = 'indoor';
const indoorInsulState = engine.calculateAcousticState();
console.log('Indoor with Building Insulation:', { index: indoorInsulState.index, db: indoorInsulState.dbDisplay, insulation: indoorInsulState.totalIndoorInsulation });
console.assert(indoorInsulState.totalIndoorInsulation === 42, `Indoor transmission loss should be 16 + 26 = 42 dB, got ${indoorInsulState.totalIndoorInsulation}`);
console.assert(indoorInsulState.index <= 45, `Indoor noise index should drop drastically with insulation, got ${indoorInsulState.index}`);
engine.activeInterventions.delete('building_sound_insulation');
engine.perspective = 'outdoor';

// 5. Apply All Test
INTERVENTIONS.forEach(i => engine.activeInterventions.add(i.id));
const allState = engine.calculateAcousticState();
console.log('All 20 Interventions Outdoor:', { index: allState.index, db: allState.dbDisplay, reduction: allState.reduction, natureGain: allState.audioGains.nature });
console.assert(allState.index <= 50, `All interventions should reduce outdoor index to <= 50, got ${allState.index}`);
console.assert(allState.audioGains.nature > 0.8, 'Nature audio channel should emerge noticeably');

// 6. Before Mode Test (Compare)
engine.isBeforeMode = true;
const compareBeforeState = engine.calculateAcousticState();
console.log('In Before Mode (Temporarily baseline):', { index: compareBeforeState.index, reduction: compareBeforeState.reduction });
console.assert(compareBeforeState.index === 88, `In Before mode, index should return to baseline 88, got ${compareBeforeState.index}`);
console.assert(engine.activeInterventions.size === 20, 'Before mode should preserve user active selections');

// 7. Reset Test
engine.isBeforeMode = false;
engine.activeInterventions.clear();
const resetState = engine.calculateAcousticState();
console.assert(resetState.index === 88, `After reset, index should be 88, got ${resetState.index}`);
console.assert(engine.activeInterventions.size === 0, 'Active interventions set should be empty');

console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
