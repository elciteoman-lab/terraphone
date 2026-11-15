/**
 * Terraphone — Earth Arcade Token Economy & Profile Manager
 * NASA Space Apps Challenge
 * 
 * Manages Zen Mode active-time token accrual, personal records,
 * and restrained cosmetic unlocks (car paints, glider designs, spirit glows).
 */

const STORAGE_KEY = 'terraphone_arcade_profile';
const ZEN_DAILY_LIMIT = 10; // Max 10 tokens per day from passive Zen sessions (balanced economy)

export const COSMETICS_CATALOG = {
  carPaints: [
    { id: 'cyan', name: 'Skyline Cyan', hex: '#38bdf8', cost: 0, unlocked: true },
    { id: 'obsidian', name: 'Obsidian Midnight', hex: '#0f172a', cost: 60, unlocked: false },
    { id: 'amber', name: 'Solar Amber', hex: '#f59e0b', cost: 120, unlocked: false },
    { id: 'emerald', name: 'British Racing Green', hex: '#059669', cost: 200, unlocked: false }
  ],
  gliderSkins: [
    { id: 'white', name: 'Aero White', hex: '#f8fafc', cost: 0, unlocked: true },
    { id: 'aurora', name: 'Prismatic Aurora', hex: '#a855f7', cost: 140, unlocked: false },
    { id: 'nebula', name: 'Nebula Void', hex: '#6366f1', cost: 250, unlocked: false }
  ],
  spiritGlows: [
    { id: 'verdant', name: 'Verdant Wisp', hex: '#10b981', cost: 0, unlocked: true },
    { id: 'celestial', name: 'Starlight Blue', hex: '#0ea5e9', cost: 75, unlocked: false },
    { id: 'firefly', name: 'Golden Firefly', hex: '#eab308', cost: 160, unlocked: false }
  ]
};

export class ArcadeTokensManager {
  constructor() {
    this.profile = this.loadProfile();
  }

  loadProfile() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Ensure today's Zen accrual resets daily
          const today = new Date().toISOString().slice(0, 10);
          if (parsed.zenDate !== today) {
            parsed.zenDate = today;
            parsed.todayZenTokens = 0;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load arcade profile:', e);
    }

    return {
      username: 'EcoExplorer_' + Math.floor(1000 + Math.random() * 9000),
      tokens: 5, // Modest starter tokens to explore cosmetic shop
      zenMinutes: 0,
      zenDate: new Date().toISOString().slice(0, 10),
      todayZenTokens: 0,
      highScores: {
        rainway: { score: 0, metric: 'meters' },
        fireline: { score: 0, metric: 'seeds' },
        heat_escape: { score: 0, metric: 'meters' },
        water_keeper: { score: 0, metric: 'droplets' },
        cloud_courier: { score: 0, metric: 'points' },
        ozone_drift: { score: 0, metric: 'canisters' },
        coral_current: { score: 0, metric: 'meters' },
        last_forest: { score: 0, metric: 'meters' }
      },
      unlocked: {
        carPaints: ['cyan'],
        gliderSkins: ['white'],
        spiritGlows: ['verdant']
      },
      equipped: {
        carPaint: 'cyan',
        gliderSkin: 'white',
        spiritGlow: 'verdant'
      },
      easterEggsFound: []
    };
  }

  load() {
    this.profile = this.loadProfile();
    return this.profile;
  }

  saveProfile() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      }
    } catch (e) {
      console.warn('Could not save arcade profile:', e);
    }
  }

  addTokens(amount, reason = '') {
    this.profile.tokens += amount;
    this.saveProfile();
    this.dispatchChangeEvent({ type: 'token_added', amount, reason });
    return this.profile.tokens;
  }

  recordZenMinute() {
    this.profile.zenMinutes += 1;
    if (this.profile.todayZenTokens < ZEN_DAILY_LIMIT) {
      this.profile.todayZenTokens += 1;
      this.profile.tokens += 1;
      this.saveProfile();
      this.dispatchChangeEvent({ type: 'zen_token', amount: 1 });
      return true;
    }
    this.saveProfile();
    return false;
  }

  recordHighScore(gameId, score, metric = 'points') {
    const current = this.profile.highScores[gameId] || { score: 0, metric };
    let isNewBest = false;
    if (score > current.score) {
      this.profile.highScores[gameId] = { score, metric };
      isNewBest = true;
      // Bonus tokens for personal record improvement
      this.addTokens(2, `New Personal Best in ${gameId}`);
    }
    this.saveProfile();
    return { isNewBest, best: this.profile.highScores[gameId].score };
  }

  unlockEasterEgg(id, bonusTokens = 5) {
    if (!this.profile.easterEggsFound.includes(id)) {
      this.profile.easterEggsFound.push(id);
      this.addTokens(bonusTokens, `Discovered Easter Egg: ${id}`);
      return true;
    }
    return false;
  }

  unlockCosmetic(category, id, cost) {
    const unlockedList = this.profile.unlocked[category] || [];
    if (unlockedList.includes(id)) return true;
    if (this.profile.tokens < cost) return false;

    this.profile.tokens -= cost;
    unlockedList.push(id);
    this.profile.unlocked[category] = unlockedList;
    this.saveProfile();
    this.dispatchChangeEvent({ type: 'cosmetic_unlocked', category, id });
    return true;
  }

  equipCosmetic(categoryKey, id) {
    this.profile.equipped[categoryKey] = id;
    this.saveProfile();
    this.dispatchChangeEvent({ type: 'cosmetic_equipped', categoryKey, id });
  }

  getEquippedHex(categoryKey) {
    const id = this.profile.equipped[categoryKey];
    let catalogKey = 'carPaints';
    if (categoryKey === 'gliderSkin') catalogKey = 'gliderSkins';
    if (categoryKey === 'spiritGlow') catalogKey = 'spiritGlows';

    const list = COSMETICS_CATALOG[catalogKey] || [];
    const found = list.find(item => item.id === id);
    return found ? found.hex : '#38bdf8';
  }

  getEquippedSkin(categoryKey) {
    return this.getEquippedHex(categoryKey);
  }

  dispatchChangeEvent(detail) {
    window.dispatchEvent(new CustomEvent('terraphone_arcade_token_event', { detail }));
  }
}

export const arcadeTokens = new ArcadeTokensManager();
