/**
 * Terraphone — Earth Arcade Hub & Lifecycle Manager
 * NASA Space Apps Challenge
 * 
 * Orchestrates the 8 Earth Arcade environmental exploration games,
 * shared Web Audio engine, token wallet, and cosmetic shop.
 */

import { arcadeTokens, COSMETICS_CATALOG } from './arcade-tokens.js';
import { RainwayGame } from './rainway.js';
import { FirelineGame } from './fireline.js';
import {
  HeatEscapeGame,
  WaterKeeperGame,
  CloudCourierGame,
  OzoneDriftGame,
  CoralCurrentGame,
  LastForestGame
} from './mini-games.js';

export const ARCADE_GAMES = [
  {
    id: 'rainway',
    title: 'Rainway',
    subtitle: 'The Endless Rain Journey',
    tag: 'Main Game · 3D Driving',
    icon: '🌧️',
    nasaData: 'NASA GPM IMERG Precipitation',
    desc: 'Slow Roads-inspired scenic driving. Procedural hills, curves, wet asphalt, and the secret Cloud Glider flight mode.',
    accent: '#38bdf8'
  },
  {
    id: 'fireline',
    title: 'Fireline',
    subtitle: 'Into the Forest',
    tag: 'Main Game · 2.5D Isometric',
    icon: '🌲',
    nasaData: 'NASA FIRMS Active Fire Satellite Data',
    desc: 'Guide a luminous forest wanderer through ancient trees. Collect seeds, avoid thermal anomalies, and discover Golden Firefly flight.',
    accent: '#10b981'
  },
  {
    id: 'heat_escape',
    title: 'Heat Escape',
    subtitle: 'Find the Cool Route',
    tag: 'Urban Arcade',
    icon: '🏙️',
    nasaData: 'NASA ECOSTRESS Land Surface Temp',
    desc: 'Navigate city heat islands on a scooter. Chain cool shaded park corridors to prevent heat fatigue.',
    accent: '#f97316'
  },
  {
    id: 'water_keeper',
    title: 'Water Keeper',
    subtitle: 'Flow Through the Landscape',
    tag: 'Side-Scroller',
    icon: '💧',
    nasaData: 'NASA SMAP Soil Moisture Radiometer',
    desc: 'Guide an agile water droplet across varied soil strata to nourish blooming natural vegetation.',
    accent: '#06b6d4'
  },
  {
    id: 'cloud_courier',
    title: 'Cloud Courier',
    subtitle: 'Atmospheric Air Currents',
    tag: 'Atmospheric Arcade',
    icon: '☁️',
    nasaData: 'NASA OMI SO₂/NO₂ & GPM',
    desc: 'Fly as a nimblest cloud through clean air channels while avoiding industrial trace gas pollution plumes.',
    accent: '#818cf8'
  },
  {
    id: 'ozone_drift',
    title: 'Ozone Drift',
    subtitle: 'Stratospheric Research',
    tag: 'Orbital Probe',
    icon: '🛰️',
    nasaData: 'NASA Ozone Watch & Aura OMI',
    desc: 'Drift through the upper atmosphere in a research probe collecting stratospheric ozone samples.',
    accent: '#a855f7'
  },
  {
    id: 'coral_current',
    title: 'Coral Current',
    subtitle: 'Barrier Reef Exploration',
    tag: 'Underwater Side-Scroller',
    icon: '🪸',
    nasaData: 'NOAA Coral Reef Watch Bleaching Stress',
    desc: 'Swim as a resilient sea turtle navigating vibrant barrier reefs and seeking cooling ocean upwellings.',
    accent: '#f43f5e'
  },
  {
    id: 'last_forest',
    title: 'Last Forest',
    subtitle: 'A World of Endless Trees',
    tag: 'Canopy Gliding',
    icon: '🍃',
    nasaData: 'NASA / USGS Landsat Forest Canopy Cover',
    desc: 'Glide as a winged sycamore seed riding thermal updrafts above lush, continuous forest canopies.',
    accent: '#34d399'
  }
];

export class ArcadeHub {
  constructor(containerEl, audioCtx) {
    this.container = containerEl;
    this.audioCtx = audioCtx;
    this.activeGameInstance = null;
    this.activeGameId = null;

    this.renderLayout();
    this.bindEvents();
  }

  renderLayout() {
    const profile = arcadeTokens.profile;

    this.container.innerHTML = `
      <!-- Arcade Viewport Container -->
      <div class="arcade-shell" id="arcade-shell">

        <!-- Top Header Navigation Capsule -->
        <header class="arcade-topbar">
          <div class="arcade-brand">
            <button id="arcade-btn-return-globe" class="arcade-back-btn" title="Return to 3D Globe (Hotkey C or Esc)">
              <span>←</span> <span>Global Rain Globe</span>
            </button>
            <div class="arcade-title-group">
              <span class="arcade-badge">NASA Space Apps</span>
              <h2 class="arcade-title">Earth Arcade</h2>
            </div>
          </div>

          <!-- Tokens & Cosmetic Shop Button -->
          <div class="arcade-top-actions">
            <button id="arcade-btn-shop" class="arcade-pill-btn" title="Zen Tokens & Cosmetic Shop">
              <span class="arcade-token-icon">🪙</span>
              <span id="arcade-token-count" class="arcade-token-count">${profile.tokens} Tokens</span>
            </button>
            <button id="arcade-btn-zen-info" class="arcade-pill-btn" title="Zen Mode Information">
              <span>🧘 Zen Mode</span>
            </button>
          </div>
        </header>

        <!-- Main Hub Grid View -->
        <div class="arcade-hub-content" id="arcade-hub-content">
          <div class="arcade-hero-banner">
            <div>
              <h3>Explore 8 Environmental Arcades Powered by NASA Satellite Data</h3>
              <p>Procedurally generated scenic journeys, atmospheric flights, and woodland explorations where real Earth science shapes the world.</p>
            </div>
            <div class="arcade-hero-pills">
              <span class="arcade-chip">🛰️ NASA GPM</span>
              <span class="arcade-chip">🛰️ NASA FIRMS</span>
              <span class="arcade-chip">🛰️ ECOSTRESS</span>
              <span class="arcade-chip">🛰️ SMAP</span>
              <span class="arcade-chip">🛰️ Aura OMI</span>
            </div>
          </div>

          <!-- Games Cards Grid -->
          <div class="arcade-cards-grid">
            ${ARCADE_GAMES.map(game => {
              const best = profile.highScores[game.id] ? profile.highScores[game.id].score : 0;
              const metric = profile.highScores[game.id] ? profile.highScores[game.id].metric : '';
              return `
                <div class="arcade-card" data-game="${game.id}" id="arcade-card-${game.id}">
                  <div class="arcade-card-top">
                    <span class="arcade-card-icon">${game.icon}</span>
                    <span class="arcade-card-tag" style="color: ${game.accent}; border-color: ${game.accent}44; background: ${game.accent}18;">${game.tag}</span>
                  </div>
                  <h4 class="arcade-card-title">${game.title}</h4>
                  <div class="arcade-card-sub">${game.subtitle}</div>
                  <p class="arcade-card-desc">${game.desc}</p>
                  
                  <div class="arcade-card-footer">
                    <span class="arcade-nasa-tag">${game.nasaData}</span>
                    <div class="arcade-card-action">
                      ${best > 0 ? `<span class="arcade-best">Best: ${best} ${metric}</span>` : ''}
                      <button class="arcade-play-btn" data-game="${game.id}">Play →</button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Active Game Canvas Viewport Layer -->
        <div class="arcade-game-viewport" id="arcade-game-viewport" style="display: none;">
          <div class="arcade-hud-controls">
            <button id="arcade-btn-leave-game" class="arcade-hud-btn" title="Exit to Arcade Menu (Esc)">
              <span>✕ Exit Game</span>
            </button>
            <div class="arcade-game-banner" id="arcade-game-banner">
              <span id="arcade-game-banner-icon">🌧️</span>
              <span id="arcade-game-banner-title">Rainway</span>
            </div>
            <button id="arcade-btn-pause-game" class="arcade-hud-btn" title="Pause / Resume">
              <span>⏸️ Pause</span>
            </button>
          </div>

          <canvas id="arcade-canvas" class="arcade-canvas"></canvas>

          <!-- Autopilot & Easter Egg Toasts -->
          <div id="rainway-autopilot-indicator" class="arcade-toast autopilot" style="display: none;">🤖 AUTOPILOT ACTIVE</div>
          <div id="rainway-sign-toast" class="arcade-toast vylt">
            <span>✨ Easter Egg Discovered!</span>
            <strong>VYLT × TERRAPHONE Scenic Landmark (+10 Tokens)</strong>
          </div>
        </div>

        <!-- Cosmetic Shop Modal -->
        <div id="arcade-shop-modal" class="arcade-modal-backdrop" style="display: none;">
          <div class="arcade-modal-dialog">
            <div class="arcade-modal-header">
              <h3>🪙 Cosmetic Shop & Zen Token Vault</h3>
              <button id="arcade-btn-close-shop" class="arcade-close-btn">✕</button>
            </div>
            <div class="arcade-modal-body">
              <div class="arcade-vault-summary">
                <div>
                  <span class="vault-label">Your Token Balance</span>
                  <div class="vault-amount" id="modal-token-balance">${profile.tokens} 🪙</div>
                </div>
                <div>
                  <span class="vault-label">Zen Active Time</span>
                  <div class="vault-stat">${profile.zenMinutes} minutes</div>
                </div>
              </div>

              <!-- Car Paint Customization -->
              <div class="shop-category">
                <h4>🚗 Rainway Car Paint Colors</h4>
                <div class="shop-items-row">
                  ${COSMETICS_CATALOG.carPaints.map(item => `
                    <div class="shop-item ${profile.unlocked.carPaints.includes(item.id) ? 'unlocked' : ''} ${profile.equipped.carPaint === item.id ? 'equipped' : ''}" data-cat="carPaints" data-id="${item.id}" data-cost="${item.cost}">
                      <div class="color-swatch" style="background: ${item.hex};"></div>
                      <span class="shop-item-name">${item.name}</span>
                      <span class="shop-item-cost">${profile.unlocked.carPaints.includes(item.id) ? (profile.equipped.carPaint === item.id ? 'Equipped' : 'Equip') : `${item.cost} 🪙`}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Cloud Glider Customization -->
              <div class="shop-category">
                <h4>🕊️ Cloud Glider Wings</h4>
                <div class="shop-items-row">
                  ${COSMETICS_CATALOG.gliderSkins.map(item => `
                    <div class="shop-item ${profile.unlocked.gliderSkins.includes(item.id) ? 'unlocked' : ''} ${profile.equipped.gliderSkin === item.id ? 'equipped' : ''}" data-cat="gliderSkins" data-id="${item.id}" data-cost="${item.cost}">
                      <div class="color-swatch" style="background: ${item.hex};"></div>
                      <span class="shop-item-name">${item.name}</span>
                      <span class="shop-item-cost">${profile.unlocked.gliderSkins.includes(item.id) ? (profile.equipped.gliderSkin === item.id ? 'Equipped' : 'Equip') : `${item.cost} 🪙`}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Fireline Spirit Glow Customization -->
              <div class="shop-category">
                <h4>✨ Fireline Spirit Glow</h4>
                <div class="shop-items-row">
                  ${COSMETICS_CATALOG.spiritGlows.map(item => `
                    <div class="shop-item ${profile.unlocked.spiritGlows.includes(item.id) ? 'unlocked' : ''} ${profile.equipped.spiritGlow === item.id ? 'equipped' : ''}" data-cat="spiritGlows" data-id="${item.id}" data-cost="${item.cost}">
                      <div class="color-swatch" style="background: ${item.hex};"></div>
                      <span class="shop-item-name">${item.name}</span>
                      <span class="shop-item-cost">${profile.unlocked.spiritGlows.includes(item.id) ? (profile.equipped.spiritGlow === item.id ? 'Equipped' : 'Equip') : `${item.cost} 🪙`}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    `;
  }

  bindEvents() {
    // Return to globe button
    document.getElementById('arcade-btn-return-globe')?.addEventListener('click', () => {
      this.exitToGlobe();
    });

    // Launch game buttons on cards
    this.container.querySelectorAll('.arcade-card, .arcade-play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const gameId = btn.getAttribute('data-game');
        if (gameId) this.launchGame(gameId);
      });
    });

    // Leave active game button
    document.getElementById('arcade-btn-leave-game')?.addEventListener('click', () => {
      this.closeActiveGame();
    });

    // Pause button
    document.getElementById('arcade-btn-pause-game')?.addEventListener('click', () => {
      if (this.activeGameInstance) {
        if (this.activeGameInstance.isPaused) {
          this.activeGameInstance.resume();
          document.getElementById('arcade-btn-pause-game').innerHTML = '<span>⏸️ Pause</span>';
        } else {
          this.activeGameInstance.pause();
          document.getElementById('arcade-btn-pause-game').innerHTML = '<span>▶️ Resume</span>';
        }
      }
    });

    // Shop modal
    const shopModal = document.getElementById('arcade-shop-modal');
    document.getElementById('arcade-btn-shop')?.addEventListener('click', () => {
      this.updateShopModal();
      shopModal.style.display = 'flex';
    });
    document.getElementById('arcade-btn-close-shop')?.addEventListener('click', () => {
      shopModal.style.display = 'none';
    });
    shopModal?.addEventListener('click', (e) => {
      if (e.target === shopModal) shopModal.style.display = 'none';
    });

    // Zen info modal trigger
    document.getElementById('arcade-btn-zen-info')?.addEventListener('click', () => {
      window.app?.switchExperience('rain');
      window.app?.toggleZenMode();
    });

    // Token update listener
    if (!this._tokenListenerAttached) {
      window.addEventListener('terraphone_arcade_token_event', () => {
        const countEl = document.getElementById('arcade-token-count');
        const modalBal = document.getElementById('modal-token-balance');
        if (countEl) countEl.textContent = `${arcadeTokens.profile.tokens} Tokens`;
        if (modalBal) modalBal.textContent = `${arcadeTokens.profile.tokens} 🪙`;
      });
      this._tokenListenerAttached = true;
    }

    // Shop item click delegation
    this.container.addEventListener('click', (e) => {
      const itemEl = e.target.closest('.shop-item');
      if (!itemEl) return;
      const cat = itemEl.getAttribute('data-cat');
      const id = itemEl.getAttribute('data-id');
      const cost = parseInt(itemEl.getAttribute('data-cost'), 10);

      let catKey = 'carPaint';
      if (cat === 'gliderSkins') catKey = 'gliderSkin';
      if (cat === 'spiritGlows') catKey = 'spiritGlow';

      if (arcadeTokens.profile.unlocked[cat].includes(id)) {
        arcadeTokens.equipCosmetic(catKey, id);
        this.updateShopModal();
      } else {
        const ok = arcadeTokens.unlockCosmetic(cat, id, cost);
        if (ok) {
          arcadeTokens.equipCosmetic(catKey, id);
          this.updateShopModal();
        } else {
          alert("Not enough tokens! Spend more active minutes in Zen mode or explore games to earn tokens.");
        }
      }
    });
  }

  updateShopModal() {
    const p = arcadeTokens.profile;
    const modal = document.getElementById('arcade-shop-modal');
    if (!modal) return;
    const bal = document.getElementById('modal-token-balance');
    if (bal) bal.textContent = `${p.tokens} 🪙`;

    // Re-render categories
    modal.querySelectorAll('.shop-item').forEach(itemEl => {
      const cat = itemEl.getAttribute('data-cat');
      const id = itemEl.getAttribute('data-id');
      const isUnlocked = p.unlocked[cat].includes(id);

      let catKey = 'carPaint';
      if (cat === 'gliderSkins') catKey = 'gliderSkin';
      if (cat === 'spiritGlows') catKey = 'spiritGlow';
      const isEquipped = p.equipped[catKey] === id;

      itemEl.classList.toggle('unlocked', isUnlocked);
      itemEl.classList.toggle('equipped', isEquipped);
      const costEl = itemEl.querySelector('.shop-item-cost');
      if (costEl) {
        costEl.textContent = isUnlocked ? (isEquipped ? 'Equipped' : 'Equip') : `${itemEl.getAttribute('data-cost')} 🪙`;
      }
    });
  }

  launchGame(gameId) {
    this.closeActiveGame();
    this.activeGameId = gameId;

    if (!this.audioCtx && window.app?.sound?.ctx) {
      this.audioCtx = window.app.sound.ctx;
    }

    const hubEl = document.getElementById('arcade-hub-content');
    const viewportEl = document.getElementById('arcade-game-viewport');
    const canvas = document.getElementById('arcade-canvas');
    const bannerTitle = document.getElementById('arcade-game-banner-title');
    const bannerIcon = document.getElementById('arcade-game-banner-icon');
    const pauseBtn = document.getElementById('arcade-btn-pause-game');
    if (pauseBtn) pauseBtn.innerHTML = '<span>⏸️ Pause</span>';

    const gameDef = ARCADE_GAMES.find(g => g.id === gameId);
    if (gameDef) {
      if (bannerTitle) bannerTitle.textContent = `${gameDef.title} — ${gameDef.subtitle}`;
      if (bannerIcon) bannerIcon.textContent = gameDef.icon;
    }

    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    hubEl.style.display = 'none';
    viewportEl.style.display = 'block';

    const onExit = () => this.closeActiveGame();

    // Instantiate game
    switch (gameId) {
      case 'rainway':
        this.activeGameInstance = new RainwayGame(canvas, this.audioCtx, onExit);
        break;
      case 'fireline':
        this.activeGameInstance = new FirelineGame(canvas, this.audioCtx, onExit);
        break;
      case 'heat_escape':
        this.activeGameInstance = new HeatEscapeGame(canvas, this.audioCtx, onExit);
        break;
      case 'water_keeper':
        this.activeGameInstance = new WaterKeeperGame(canvas, this.audioCtx, onExit);
        break;
      case 'cloud_courier':
        this.activeGameInstance = new CloudCourierGame(canvas, this.audioCtx, onExit);
        break;
      case 'ozone_drift':
        this.activeGameInstance = new OzoneDriftGame(canvas, this.audioCtx, onExit);
        break;
      case 'coral_current':
        this.activeGameInstance = new CoralCurrentGame(canvas, this.audioCtx, onExit);
        break;
      case 'last_forest':
        this.activeGameInstance = new LastForestGame(canvas, this.audioCtx, onExit);
        break;
      default:
        console.warn('Unknown game:', gameId);
        return;
    }

    this.activeGameInstance.start();
  }

  closeActiveGame() {
    if (this.activeGameInstance) {
      this.activeGameInstance.stop();
      this.activeGameInstance = null;
    }
    this.activeGameId = null;

    const hubEl = document.getElementById('arcade-hub-content');
    const viewportEl = document.getElementById('arcade-game-viewport');
    const pauseBtn = document.getElementById('arcade-btn-pause-game');
    if (pauseBtn) pauseBtn.innerHTML = '<span>⏸️ Pause</span>';

    if (hubEl) hubEl.style.display = 'block';
    if (viewportEl) viewportEl.style.display = 'none';

    // Refresh best scores on cards
    this.updateCardScores();
  }

  updateCardScores() {
    const profile = arcadeTokens.profile;
    ARCADE_GAMES.forEach(game => {
      const card = this.container.querySelector(`.arcade-card[data-game="${game.id}"]`);
      if (!card) return;
      const bestData = profile.highScores[game.id];
      const best = bestData ? bestData.score : 0;
      const metric = bestData ? bestData.metric : '';
      let bestEl = card.querySelector('.arcade-best');
      if (best > 0) {
        if (!bestEl) {
          bestEl = document.createElement('span');
          bestEl.className = 'arcade-best';
          card.querySelector('.arcade-card-action')?.prepend(bestEl);
        }
        bestEl.textContent = `Best: ${best} ${metric}`;
      }
    });
  }

  exitToGlobe() {
    this.closeActiveGame();
    window.app?.switchExperience('rain');
  }

  destroy() {
    this.closeActiveGame();
  }
}
