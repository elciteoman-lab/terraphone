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
    { id: 'cyan', name: 'Skyline Cyan', type: 'solid', hex: '#38bdf8', cost: 0, unlocked: true },
    { id: 'sunset_prism', name: '🌅 Sunset Prism Gradient', type: 'gradient', colors: ['#8b5cf6', '#f43f5e', '#fbbf24'], hex: '#f43f5e', cost: 2500, unlocked: false },
    { id: 'cyber_neon', name: '⚡ Cyberpunk Neon Gradient', type: 'gradient', colors: ['#ec4899', '#06b6d4'], hex: '#06b6d4', cost: 5000, unlocked: false },
    { id: 'aurora_borealis', name: '🌌 Cosmic Aurora Gradient', type: 'gradient', colors: ['#10b981', '#3b82f6', '#8b5cf6'], hex: '#10b981', cost: 8500, unlocked: false },
    { id: 'carbon_matrix', name: '🏁 Carbon Fiber Matrix', type: 'textured', pattern: 'carbon', hex: '#1e293b', cost: 12000, unlocked: false },
    { id: 'volcanic_magma', name: '🌋 Volcanic Magma Crust', type: 'textured', pattern: 'magma', hex: '#dc2626', cost: 16000, unlocked: false },
    { id: 'golden_crown', name: '👑 24K Imperial Golden Sovereign', type: 'crown', hasCrown: true, hex: '#ffd700', cost: 20000, unlocked: false },
    { id: 'quantum_singularity', name: '🌀 Quantum Singularity Warp', type: 'gradient', colors: ['#4f46e5', '#9333ea', '#06b6d4', '#e11d48'], hex: '#9333ea', cost: 20000, unlocked: false }
  ],
  crowns: [
    { id: 'none', name: 'Standard Visor', type: 'none', hex: '#64748b', cost: 0, unlocked: true },
    { id: 'cyber_halo', name: '😇 Cyber Neon Halo', type: 'halo', hex: '#38bdf8', cost: 5000, unlocked: false },
    { id: 'phoenix_crest', name: '🔥 Phoenix Solar Crest', type: 'crest', hex: '#f97316', cost: 10000, unlocked: false },
    { id: 'golden_crown', name: '👑 Royal Sovereign Crown', type: 'crown', hex: '#ffd700', cost: 20000, unlocked: false },
    { id: 'celestial_diadem', name: '✨ Celestial Starlight Diadem', type: 'diadem', hex: '#e0f2fe', cost: 20000, unlocked: false }
  ],
  gliderSkins: [
    { id: 'white', name: 'Aero Nimbus', type: 'solid', hex: '#f8fafc', cost: 0, unlocked: true },
    { id: 'aurora', name: 'Prismatic Aurora', type: 'gradient', colors: ['#a855f7', '#38bdf8'], hex: '#a855f7', cost: 5000, unlocked: false },
    { id: 'nebula', name: 'Nebula Void', type: 'gradient', colors: ['#6366f1', '#ec4899'], hex: '#6366f1', cost: 10000, unlocked: false },
    { id: 'golden_cloud', name: '👑 Golden Cloud Monarch', type: 'crown', hex: '#ffd700', cost: 20000, unlocked: false },
    { id: 'stellar_supernova', name: '🌌 Starlight Supernova', type: 'gradient', colors: ['#fbbf24', '#f43f5e', '#8b5cf6'], hex: '#fbbf24', cost: 20000, unlocked: false }
  ],
  spiritGlows: [
    { id: 'verdant', name: 'Verdant Wisp', type: 'solid', hex: '#10b981', cost: 0, unlocked: true },
    { id: 'celestial', name: 'Starlight Blue', type: 'solid', hex: '#0ea5e9', cost: 4000, unlocked: false },
    { id: 'firefly', name: 'Golden Firefly', type: 'solid', hex: '#eab308', cost: 8000, unlocked: false },
    { id: 'amethyst_void', name: 'Amethyst Void', type: 'gradient', colors: ['#a855f7', '#6366f1'], hex: '#a855f7', cost: 14000, unlocked: false },
    { id: 'sovereign_gold', name: '👑 24K Sovereign Halo', type: 'solid', hex: '#ffd700', cost: 20000, unlocked: false },
    { id: 'cosmic_pulsar', name: '💠 Quantum Pulsar Core', type: 'gradient', colors: ['#06b6d4', '#ec4899', '#facc15'], hex: '#06b6d4', cost: 20000, unlocked: false }
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
          if (!parsed.unlocked) parsed.unlocked = {};
          if (!parsed.unlocked.carPaints) parsed.unlocked.carPaints = ['cyan'];
          if (!parsed.unlocked.crowns) parsed.unlocked.crowns = ['none'];
          if (!parsed.unlocked.gliderSkins) parsed.unlocked.gliderSkins = ['white'];
          if (!parsed.unlocked.spiritGlows) parsed.unlocked.spiritGlows = ['verdant'];

          if (!parsed.equipped) parsed.equipped = {};
          if (!parsed.equipped.carPaint) parsed.equipped.carPaint = 'cyan';
          if (!parsed.equipped.crown) parsed.equipped.crown = 'none';
          if (!parsed.equipped.gliderSkin) parsed.equipped.gliderSkin = 'white';
          if (!parsed.equipped.spiritGlow) parsed.equipped.spiritGlow = 'verdant';

          if (!parsed.highScores) parsed.highScores = {};
          const defaultGames = {
            fireline: { score: 0, metric: 'seeds' },
            heat_escape: { score: 0, metric: 'meters' },
            cloud_courier: { score: 0, metric: 'gates' },
            ozone_drift: { score: 0, metric: 'canisters' },
            coral_current: { score: 0, metric: 'meters' },
            last_forest: { score: 0, metric: 'meters' }
          };
          Object.keys(defaultGames).forEach(gid => {
            if (!parsed.highScores[gid]) parsed.highScores[gid] = defaultGames[gid];
          });

          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load arcade profile:', e);
    }

    return {
      username: 'EcoExplorer_' + Math.floor(1000 + Math.random() * 9000),
      tokens: 15, // Starter tokens to test new skins
      zenMinutes: 0,
      zenDate: new Date().toISOString().slice(0, 10),
      todayZenTokens: 0,
      highScores: {
        fireline: { score: 0, metric: 'seeds' },
        heat_escape: { score: 0, metric: 'meters' },
        cloud_courier: { score: 0, metric: 'gates' },
        ozone_drift: { score: 0, metric: 'canisters' },
        coral_current: { score: 0, metric: 'meters' },
        last_forest: { score: 0, metric: 'meters' }
      },
      unlocked: {
        carPaints: ['cyan'],
        crowns: ['none'],
        gliderSkins: ['white'],
        spiritGlows: ['verdant']
      },
      equipped: {
        carPaint: 'cyan',
        crown: 'none',
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
    if (!(score > current.score)) return { isNewBest: false, best: current.score };
    this.profile.highScores[gameId] = { score, metric };
    // addTokens persists the updated record and wallet together.
    this.addTokens(2, `New Personal Best in ${gameId}`);
    return { isNewBest: true, best: score };
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
    if (categoryKey === 'crown') catalogKey = 'crowns';
    if (categoryKey === 'gliderSkin') catalogKey = 'gliderSkins';
    if (categoryKey === 'spiritGlow') catalogKey = 'spiritGlows';

    const list = COSMETICS_CATALOG[catalogKey] || [];
    const found = list.find(item => item.id === id);
    return found ? found.hex : '#38bdf8';
  }

  getEquippedItem(categoryKey) {
    let catalogKey = categoryKey;
    if (categoryKey === 'carPaint' || categoryKey === 'scooterPaint') catalogKey = 'carPaints';
    if (categoryKey === 'crown') catalogKey = 'crowns';
    if (categoryKey === 'gliderSkin') catalogKey = 'gliderSkins';
    if (categoryKey === 'spiritGlow') catalogKey = 'spiritGlows';

    const id = this.profile.equipped[categoryKey] || (categoryKey === 'crown' ? 'none' : 'cyan');
    const list = COSMETICS_CATALOG[catalogKey] || [];
    return list.find(item => item.id === id) || list[0] || null;
  }

  getEquippedSkin(categoryKey) {
    return this.getEquippedHex(categoryKey);
  }

  dispatchChangeEvent(detail) {
    window.dispatchEvent(new CustomEvent('terraphone_arcade_token_event', { detail }));
  }
}

export const arcadeTokens = new ArcadeTokensManager();
