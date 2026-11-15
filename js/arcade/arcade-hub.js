/**
 * Terraphone — Earth Arcade Hub & Lifecycle Manager
 * NASA Space Apps Challenge
 * 
 * Orchestrates the 8 Earth Arcade environmental exploration games,
 * shared Web Audio engine, token wallet, and cosmetic shop.
 */

import { arcadeTokens, COSMETICS_CATALOG } from './arcade-tokens.js';
import { FirelineGame } from './fireline.js';
import {
  HeatEscapeGame,
  CloudCourierGame,
  OzoneDriftGame,
  CoralCurrentGame,
  LastForestGame
} from './mini-games.js';

export const ARCADE_GAMES = [
  {
    id: 'fireline',
    title: 'Fireline',
    subtitle: 'Into the Forest',
    tag: 'Main Game · 2.5D Isometric',
    icon: '🌲',
    nasaData: 'NASA FIRMS Active Fire Satellite Data',
    desc: 'Guide a luminous forest wanderer through ancient trees. Collect seeds, avoid thermal anomalies, and discover Golden Firefly flight.',
    accent: '#10b981',
    objective: 'Explore a tranquil isometric woodland, gather luminous forest seeds, and avoid high-temperature thermal anomalies. Deposit 4 seeds into each of the 3 ancient Sacred Springs to restore the watershed balance.',
    controls: [
      { key: 'W / A / S / D or Arrows', desc: 'Move Spirit Wanderer' },
      { key: 'Spring Proximity', desc: 'Automatically deposits seeds' },
      { key: 'Golden Seed', desc: 'Golden Firefly high-speed flight boost' }
    ],
    environmentalImpact: 'Thermal hotspots correspond to NASA FIRMS (MODIS/VIIRS) satellite thermal detections. Protecting pristine headwater streams and re-seeding fire-prone forests preserves critical wildlife corridors and natural firebreaks.'
  },
  {
    id: 'heat_escape',
    title: 'Heat Escape',
    subtitle: '5-Lane Subway Heat Runner',
    tag: '5-Lane Runner · Subway Surfers Style',
    icon: '🏙️',
    nasaData: 'NASA ECOSTRESS Land Surface Temp',
    desc: 'Infinite 5-lane subway runner accelerating relentlessly. Snap lanes, jump heat rifts, slide under steam vents, and equip high-tier cosmetics & 24K Golden Crown!',
    accent: '#f97316',
    objective: 'Survive endlessly across 5 subway-style urban traffic lanes. As speed accelerates infinitely, snap between lanes to dodge scorching heat rifts and stalled vans, jump boiling asphalt cracks, slide under steam vents, chain shaded canopies, and reach 500m milestones!',
    controls: [
      { key: 'A / D or ← / →', desc: 'Snap Between 5 Lanes' },
      { key: 'W / ↑ / Space', desc: 'Jump Over Road Hazards' },
      { key: 'S / ↓', desc: 'Slide Under Steam Vents / Fast Fall' },
      { key: 'Swipe (Touch)', desc: 'Left / Right / Jump / Slide' }
    ],
    environmentalImpact: 'Driven by NASA ECOSTRESS thermal measurements aboard the ISS. Unshaded asphalt surfaces can exceed 50°C (122°F), whereas tree-shaded parks lower ambient temperatures by up to 12°C, demonstrating the lifesaving power of urban greening.'
  },
  {
    id: 'cloud_courier',
    title: 'Cloud Courier',
    subtitle: 'Atmospheric Air Currents',
    tag: 'Atmospheric Arcade',
    icon: '☁️',
    nasaData: 'NASA OMI SO₂/NO₂ & GPM',
    desc: 'Endless atmospheric flight through industrial corridors. Dodge toxic SO₂ & NO₂ plumes, withstand acid degradation, and deliver clean rain.',
    accent: '#818cf8',
    objective: 'Fly endlessly as an atmospheric cloud through high-altitude clean air corridors while dodging toxic sulfur dioxide (SO₂) and nitrogen dioxide (NO₂) plumes. As wind accelerates, clear endless smokestack gates and collect pure vapor drops to maintain purity!',
    controls: [
      { key: 'Space / W / ↑', desc: 'Ascend & Flap' },
      { key: 'Gravity', desc: 'Natural Aerodynamic Glide' }
    ],
    environmentalImpact: 'Incorporates NASA Aura OMI tropospheric air quality satellite measurements. Clean air corridors demonstrate how reducing factory emissions and vehicular pollutants prevents acid rain and protects human respiratory health.'
  },
  {
    id: 'ozone_drift',
    title: 'Ozone Drift',
    subtitle: 'Stratospheric Research',
    tag: 'Orbital Probe',
    icon: '🛰️',
    nasaData: 'NASA Ozone Watch & Aura OMI',
    desc: 'Drift through the upper atmosphere in a research probe collecting stratospheric ozone samples.',
    accent: '#a855f7',
    objective: 'Pilot a high-altitude atmospheric research probe across the stratosphere. Collect 8 pure ozone research canisters while avoiding harmful ultraviolet solar radiation pockets and space debris.',
    controls: [
      { key: 'W / A / S / D or Arrows', desc: 'Thruster Direction' },
      { key: 'Space', desc: 'Inertial Stabilizer' }
    ],
    environmentalImpact: 'Reflects NASA Ozone Watch daily satellite observations. The stratospheric ozone layer absorbs harmful ultraviolet-B radiation, safeguarding terrestrial ecosystems, marine phytoplankton, and human skin health.'
  },
  {
    id: 'coral_current',
    title: 'Coral Current',
    subtitle: 'Barrier Reef Exploration',
    tag: 'Underwater Side-Scroller',
    icon: '🪸',
    nasaData: 'NOAA Coral Reef Watch Bleaching Stress',
    desc: 'High-octane underwater survival runner. Dodge full-screen jagged corals, evade lunging reef sharks and barracudas, hydro-dash, and revive bleached reefs.',
    accent: '#f43f5e',
    objective: 'Survive an intense, endless barrier reef packed with jagged seafloor and ceiling corals, hungry reef sharks, and aggressive barracudas. Dash, dive-bomb, and brake to evade lunging predators while seeking cold-water upwellings to revive bleached corals and heal your turtle!',
    controls: [
      { key: 'Space / ↑ / W', desc: 'Paddle Upward' },
      { key: 'S / ↓', desc: 'Fast Dive-Bomb (Evade Predators & Ceiling Corals)' },
      { key: 'D / Shift / →', desc: 'Hydro-Dash Jet (Invulnerable Burst)' },
      { key: 'A / ←', desc: 'Brake & Hover (Time Gaps)' }
    ],
    environmentalImpact: 'Incorporates NOAA Coral Reef Watch 5km satellite sea surface temperature anomaly metrics. Deep cold-water upwellings provide critical thermal refugia that rescue fragile reef ecosystems from devastating marine heatwaves.'
  },
  {
    id: 'last_forest',
    title: 'Last Forest',
    subtitle: 'A World of Endless Trees',
    tag: 'Canopy Gliding',
    icon: '🍃',
    nasaData: 'NASA / USGS Landsat Forest Canopy Cover',
    desc: 'Glide as a winged sycamore seed riding thermal updrafts above lush, continuous forest canopies.',
    accent: '#34d399',
    objective: 'Glide as an aerodynamic sycamore seed riding thermal updrafts. Disperse 10 seeds across clearings to establish contiguous forest cover before losing altitude.',
    controls: [
      { key: 'A / D or ← / →', desc: 'Bank & Steer' },
      { key: 'W / S or ↑ / ↓', desc: 'Pitch Up / Dive for Speed' }
    ],
    environmentalImpact: 'Based on NASA/USGS Landsat global tree canopy cover monitoring. Expanding contiguous forest corridors prevents habitat fragmentation, restores biodiversity highways, and bolsters planetary carbon sinks.'
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

          <!-- Zen Token Vault & Customization Garage Banner -->
          <div class="arcade-vault-hero-card" id="arcade-vault-hero">
            <div class="vault-hero-left">
              <div class="vault-coin-badge">🪙</div>
              <div>
                <h3 class="vault-hero-title">Zen Token Vault & Customization Garage</h3>
                <p class="vault-hero-subtitle">
                  Balance: <strong id="hero-vault-tokens">${profile.tokens} Tokens</strong> · 
                  Active Zen: <strong>${profile.zenMinutes} mins</strong> · 
                  Daily Cap: <strong>${profile.todayZenTokens || 0} / 30 🪙</strong>
                </p>
              </div>
            </div>
            <button id="arcade-btn-open-garage" class="arcade-vault-action-btn">
              <span>🚗 Open Cosmetic Garage & Skins →</span>
            </button>
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
              <span id="arcade-game-banner-icon">🌲</span>
              <span id="arcade-game-banner-title">Earth Arcade</span>
            </div>
            <button id="arcade-btn-pause-game" class="arcade-hud-btn" title="Pause / Resume">
              <span>⏸️ Pause</span>
            </button>
          </div>

          <canvas id="arcade-canvas" class="arcade-canvas"></canvas>
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

              <!-- Scooter Paint & Gradient Customization -->
              <div class="shop-category">
                <h4>🛴 Heat Escape Scooter Finishes &amp; Holographic Skins</h4>
                <div class="shop-items-row">
                  ${COSMETICS_CATALOG.carPaints.map(item => {
                    const isUnlocked = (profile.unlocked.carPaints || []).includes(item.id);
                    const isEquipped = profile.equipped.carPaint === item.id;
                    let swatchStyle = `background: ${item.hex};`;
                    if (item.type === 'gradient' && item.colors) {
                      swatchStyle = `background: linear-gradient(135deg, ${item.colors.join(', ')});`;
                      if (item.id === 'quantum_singularity') swatchStyle += ' box-shadow: 0 0 10px rgba(147, 51, 234, 0.85);';
                    } else if (item.type === 'crown' || item.hasCrown) {
                      swatchStyle = `background: linear-gradient(135deg, #ffd700, #b45309); box-shadow: 0 0 12px rgba(255, 215, 0, 0.85);`;
                    } else if (item.type === 'textured') {
                      if (item.pattern === 'carbon') {
                        swatchStyle = `background: repeating-linear-gradient(45deg, #1e293b, #1e293b 3px, #0f172a 3px, #0f172a 6px); border: 1px solid #38bdf8;`;
                      } else {
                        swatchStyle = `background: repeating-linear-gradient(45deg, #7f1d1d, #7f1d1d 3px, #dc2626 3px, #f97316 6px); border: 1px solid #f97316;`;
                      }
                    }
                    return `
                      <div class="shop-item ${isUnlocked ? 'unlocked' : ''} ${isEquipped ? 'equipped' : ''}" data-cat="carPaints" data-id="${item.id}" data-cost="${item.cost}">
                        <div class="color-swatch" style="${swatchStyle}"></div>
                        <span class="shop-item-name">${item.name}</span>
                        <span class="shop-item-cost">${isUnlocked ? (isEquipped ? 'Equipped' : 'Equip') : `${item.cost.toLocaleString()} 🪙`}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Royal Crowns & Headgear Customization -->
              <div class="shop-category">
                <h4>👑 Royal Crowns &amp; Headgear Accessories</h4>
                <div class="shop-items-row">
                  ${(COSMETICS_CATALOG.crowns || []).map(item => {
                    const isUnlocked = (profile.unlocked.crowns || ['none']).includes(item.id);
                    const isEquipped = (profile.equipped.crown || 'none') === item.id;
                    let swatchStyle = `background: ${item.hex};`;
                    if (item.id === 'golden_crown') {
                      swatchStyle = `background: linear-gradient(135deg, #ffd700, #b45309); box-shadow: 0 0 12px rgba(255, 215, 0, 0.85);`;
                    } else if (item.id === 'cyber_halo') {
                      swatchStyle = `background: radial-gradient(circle, #0c0e18 40%, #38bdf8 70%); box-shadow: 0 0 10px rgba(56, 189, 248, 0.8);`;
                    } else if (item.id === 'phoenix_crest') {
                      swatchStyle = `background: linear-gradient(135deg, #f97316, #ef4444); box-shadow: 0 0 10px rgba(249, 115, 22, 0.8);`;
                    } else if (item.id === 'celestial_diadem') {
                      swatchStyle = `background: linear-gradient(135deg, #e0f2fe, #38bdf8); box-shadow: 0 0 12px rgba(56, 189, 248, 0.9);`;
                    }
                    return `
                      <div class="shop-item ${isUnlocked ? 'unlocked' : ''} ${isEquipped ? 'equipped' : ''}" data-cat="crowns" data-id="${item.id}" data-cost="${item.cost}">
                        <div class="color-swatch" style="${swatchStyle}"></div>
                        <span class="shop-item-name">${item.name}</span>
                        <span class="shop-item-cost">${isUnlocked ? (isEquipped ? 'Equipped' : 'Equip') : `${item.cost.toLocaleString()} 🪙`}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Cloud Glider & Atmospheric Skins -->
              <div class="shop-category">
                <h4>☁️ Cloud Courier &amp; Atmospheric Skins</h4>
                <div class="shop-items-row">
                  ${COSMETICS_CATALOG.gliderSkins.map(item => {
                    const isUnlocked = (profile.unlocked.gliderSkins || []).includes(item.id);
                    const isEquipped = profile.equipped.gliderSkin === item.id;
                    let swatchStyle = `background: ${item.hex};`;
                    if (item.type === 'gradient' && item.colors) {
                      swatchStyle = `background: linear-gradient(135deg, ${item.colors.join(', ')});`;
                      if (item.id === 'stellar_supernova') swatchStyle += ' box-shadow: 0 0 10px rgba(251, 191, 36, 0.8);';
                    } else if (item.id === 'golden_cloud') {
                      swatchStyle = `background: linear-gradient(135deg, #ffd700, #b45309); box-shadow: 0 0 12px rgba(255, 215, 0, 0.85);`;
                    }
                    return `
                      <div class="shop-item ${isUnlocked ? 'unlocked' : ''} ${isEquipped ? 'equipped' : ''}" data-cat="gliderSkins" data-id="${item.id}" data-cost="${item.cost}">
                        <div class="color-swatch" style="${swatchStyle}"></div>
                        <span class="shop-item-name">${item.name}</span>
                        <span class="shop-item-cost">${isUnlocked ? (isEquipped ? 'Equipped' : 'Equip') : `${item.cost.toLocaleString()} 🪙`}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Fireline Spirit Glow Customization -->
              <div class="shop-category">
                <h4>✨ Spirit Glow &amp; Auras</h4>
                <div class="shop-items-row">
                  ${COSMETICS_CATALOG.spiritGlows.map(item => {
                    const isUnlocked = (profile.unlocked.spiritGlows || []).includes(item.id);
                    const isEquipped = profile.equipped.spiritGlow === item.id;
                    let swatchStyle = `background: ${item.hex};`;
                    if (item.type === 'gradient' && item.colors) {
                      swatchStyle = `background: linear-gradient(135deg, ${item.colors.join(', ')});`;
                      if (item.id === 'cosmic_pulsar') swatchStyle += ' box-shadow: 0 0 10px rgba(6, 182, 212, 0.85);';
                    } else if (item.id === 'sovereign_gold') {
                      swatchStyle = `background: linear-gradient(135deg, #ffd700, #b45309); box-shadow: 0 0 12px rgba(255, 215, 0, 0.85);`;
                    }
                    return `
                      <div class="shop-item ${isUnlocked ? 'unlocked' : ''} ${isEquipped ? 'equipped' : ''}" data-cat="spiritGlows" data-id="${item.id}" data-cost="${item.cost}">
                        <div class="color-swatch" style="${swatchStyle}"></div>
                        <span class="shop-item-name">${item.name}</span>
                        <span class="shop-item-cost">${isUnlocked ? (isEquipped ? 'Equipped' : 'Equip') : `${item.cost.toLocaleString()} 🪙`}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Game Briefing & Environmental Science Modal -->
        <div id="arcade-briefing-modal" class="modal-backdrop" style="display: none;">
          <div class="modal-dialog arcade-briefing-dialog">
            <div class="modal-header briefing-header">
              <div class="briefing-header-left">
                <span id="briefing-icon" class="briefing-icon">🎮</span>
                <div>
                  <h2 id="briefing-title" class="modal-title">Mission Briefing</h2>
                  <span id="briefing-tag" class="sugg-tag">NASA Earth Science</span>
                </div>
              </div>
              <button id="arcade-btn-close-briefing" class="modal-close" aria-label="Close briefing">✕</button>
            </div>
            <div class="modal-content briefing-content">
              <div class="briefing-section">
                <h4 class="briefing-section-title">🎯 What You Need To Do</h4>
                <p id="briefing-objective" class="briefing-text"></p>
              </div>
              <div class="briefing-section">
                <h4 class="briefing-section-title">🕹️ Controls & Navigation</h4>
                <div id="briefing-controls" class="briefing-controls-grid"></div>
              </div>
              <div class="briefing-section briefing-section-science">
                <h4 class="briefing-section-title">🌍 Environmental Impact & NASA Science</h4>
                <p id="briefing-impact" class="briefing-text"></p>
              </div>
              <div class="briefing-action-row">
                <button id="btn-cancel-briefing" class="briefing-btn briefing-btn-secondary" type="button">Back to Arcade</button>
                <button id="btn-start-briefing-mission" class="briefing-btn briefing-btn-primary" type="button">🚀 Start Mission</button>
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

    // Launch game buttons on cards -> open mission briefing card
    this.container.querySelectorAll('.arcade-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const gameId = card.getAttribute('data-game');
        if (gameId) this.openGameBriefing(gameId);
      });
    });

    // Briefing modal handlers
    const briefingModal = document.getElementById('arcade-briefing-modal');
    document.getElementById('arcade-btn-close-briefing')?.addEventListener('click', () => {
      this.closeGameBriefing();
    });
    document.getElementById('btn-cancel-briefing')?.addEventListener('click', () => {
      this.closeGameBriefing();
    });
    document.getElementById('btn-start-briefing-mission')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const gid = this.pendingBriefingGameId;
      this.closeGameBriefing();
      if (gid) this.launchGame(gid);
    });
    briefingModal?.addEventListener('click', (e) => {
      if (e.target === briefingModal) this.closeGameBriefing();
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

    // Shop modal triggers
    const shopModal = document.getElementById('arcade-shop-modal');
    const openShop = () => {
      this.updateShopModal();
      if (shopModal) shopModal.style.display = 'flex';
    };

    document.getElementById('arcade-btn-shop')?.addEventListener('click', openShop);
    document.getElementById('arcade-btn-open-garage')?.addEventListener('click', openShop);
    document.getElementById('btn-token-shop')?.addEventListener('click', openShop);

    document.getElementById('arcade-btn-close-shop')?.addEventListener('click', () => {
      if (shopModal) shopModal.style.display = 'none';
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
        const hudCount = document.getElementById('hud-token-count');
        const heroTokens = document.getElementById('hero-vault-tokens');
        const modalBal = document.getElementById('modal-token-balance');
        const tokensText = `${arcadeTokens.profile.tokens} Tokens`;
        if (countEl) countEl.textContent = tokensText;
        if (hudCount) hudCount.textContent = tokensText;
        if (heroTokens) heroTokens.textContent = tokensText;
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
      if (cat === 'crowns') catKey = 'crown';
      if (cat === 'gliderSkins') catKey = 'gliderSkin';
      if (cat === 'spiritGlows') catKey = 'spiritGlow';

      const unlockedList = arcadeTokens.profile.unlocked[cat] || (cat === 'crowns' ? ['none'] : ['cyan']);
      if (unlockedList.includes(id)) {
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
    if (bal) bal.textContent = `${p.tokens.toLocaleString()} 🪙`;

    // Re-render categories
    modal.querySelectorAll('.shop-item').forEach(itemEl => {
      const cat = itemEl.getAttribute('data-cat');
      const id = itemEl.getAttribute('data-id');
      const unlockedList = p.unlocked[cat] || (cat === 'crowns' ? ['none'] : ['cyan']);
      const isUnlocked = unlockedList.includes(id);

      let catKey = 'carPaint';
      if (cat === 'crowns') catKey = 'crown';
      if (cat === 'gliderSkins') catKey = 'gliderSkin';
      if (cat === 'spiritGlows') catKey = 'spiritGlow';
      const isEquipped = (p.equipped[catKey] || (catKey === 'crown' ? 'none' : 'cyan')) === id;

      itemEl.classList.toggle('unlocked', isUnlocked);
      itemEl.classList.toggle('equipped', isEquipped);
      const costEl = itemEl.querySelector('.shop-item-cost');
      if (costEl) {
        costEl.textContent = isUnlocked ? (isEquipped ? 'Equipped' : 'Equip') : `${parseInt(itemEl.getAttribute('data-cost'), 10).toLocaleString()} 🪙`;
      }
    });
  }

  openGameBriefing(gameId) {
    const game = ARCADE_GAMES.find(g => g.id === gameId);
    if (!game) {
      this.launchGame(gameId);
      return;
    }
    this.pendingBriefingGameId = gameId;

    const modal = document.getElementById('arcade-briefing-modal');
    const iconEl = document.getElementById('briefing-icon');
    const titleEl = document.getElementById('briefing-title');
    const tagEl = document.getElementById('briefing-tag');
    const objEl = document.getElementById('briefing-objective');
    const controlsEl = document.getElementById('briefing-controls');
    const impactEl = document.getElementById('briefing-impact');

    if (iconEl) iconEl.textContent = game.icon;
    if (titleEl) titleEl.textContent = `${game.title} — ${game.subtitle}`;
    if (tagEl) tagEl.textContent = game.nasaData;
    if (objEl) objEl.textContent = game.objective || game.desc;
    if (impactEl) impactEl.textContent = game.environmentalImpact || 'Explores real NASA and NOAA satellite observations.';

    if (controlsEl) {
      controlsEl.innerHTML = (game.controls || []).map(c => `
        <div class="briefing-control-item">
          <kbd class="briefing-kbd">${c.key}</kbd>
          <span class="briefing-control-desc">${c.desc}</span>
        </div>
      `).join('');
    }

    if (modal) modal.style.display = 'flex';
  }

  closeGameBriefing() {
    const modal = document.getElementById('arcade-briefing-modal');
    if (modal) modal.style.display = 'none';
    this.pendingBriefingGameId = null;
  }

  launchGame(gameId) {
    this.closeActiveGame();
    this.activeGameId = gameId;

    if (!this.audioCtx && window.app?.sound?.ctx) {
      this.audioCtx = window.app.sound.ctx;
    }

    // Hide global HUD capsules during gameplay to avoid any overlap
    const hudLeft = document.getElementById('hud-top-left');
    const hudRight = document.getElementById('hud-top-right');
    if (hudLeft) hudLeft.style.display = 'none';
    if (hudRight) hudRight.style.display = 'none';

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

    // Instantiate and start game
    try {
      switch (gameId) {
        case 'fireline':
          this.activeGameInstance = new FirelineGame(canvas, this.audioCtx, onExit);
          break;
        case 'heat_escape':
          this.activeGameInstance = new HeatEscapeGame(canvas, this.audioCtx, onExit);
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
    } catch (err) {
      console.error(`Failed to launch arcade game [${gameId}]:`, err);
    }
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

    // Restore global HUD capsules
    const hudLeft = document.getElementById('hud-top-left');
    const hudRight = document.getElementById('hud-top-right');
    if (hudLeft) hudLeft.style.display = '';
    if (hudRight) hudRight.style.display = '';

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
