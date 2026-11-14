/**
 * raIn.tensity - Search Engine
 * Instant Local Fuzzy Search + Live OSM Nominatim Geocoding
 */

import { CITIES_DATABASE } from './data.js';

export class SearchController {
  constructor(inputEl, suggestionsEl, onSelect) {
    this.input = inputEl;
    this.suggestions = suggestionsEl;
    this.onSelect = onSelect;

    this.debounceTimer = null;
    this.selectedIndex = -1;
    this.currentItems = [];
    this.abortController = null;

    this.init();
  }

  init() {
    this.input.addEventListener('input', (e) => this.handleInput(e.target.value.trim()));
    this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    this.input.addEventListener('focus', () => {
      if (this.input.value.trim().length > 0) {
        this.renderSuggestions(this.currentItems);
      }
    });

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
      if (!this.input.contains(e.target) && !this.suggestions.contains(e.target)) {
        this.close();
      }
    });
  }

  handleInput(query) {
    if (!query) {
      this.close();
      return;
    }

    // 1. Instant local search from bundled database (0ms latency)
    const localMatches = this.searchLocal(query);
    this.currentItems = localMatches;
    this.renderSuggestions(this.currentItems);

    // 2. Debounced remote search via Nominatim for universal coverage
    clearTimeout(this.debounceTimer);
    if (this.abortController) {
      this.abortController.abort();
    }

    this.debounceTimer = setTimeout(() => {
      this.searchRemote(query);
    }, 280);
  }

  searchLocal(query) {
    const q = query.toLowerCase();
    const results = [];

    // Trigger special action if user types storm / heavy / peak / max
    if (q.includes('heavy') || q.includes('storm') || q.includes('peak') || q.includes('max') || q.includes('rainiest')) {
      results.push({
        score: 9999,
        name: '⚡ Fly to Heaviest Rain Area on Earth',
        subtitle: 'Live NASA GPM IMERG 30-min Storm Epicenter',
        isHeaviestAction: true,
        tag: 'Live Epicenter',
        source: 'action'
      });
    }

    for (const city of CITIES_DATABASE) {
      const name = city.name.toLowerCase();
      const country = city.country.toLowerCase();
      const cat = (city.cat || '').toLowerCase();

      let score = 0;
      if (name.startsWith(q)) score += 100;
      else if (name.includes(q)) score += 50;
      if (country.startsWith(q)) score += 40;
      else if (country.includes(q)) score += 20;
      if (cat.includes(q)) score += 15;

      if (score > 0) {
        results.push({
          score,
          name: city.name,
          subtitle: `${city.country}${city.pop ? ' · ' + city.pop : ''}`,
          lat: city.lat,
          lng: city.lng,
          zoom: city.cat && city.cat.includes('Peak') ? 7.5 : 6.5,
          tag: city.cat || 'City',
          source: 'local'
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 7);
  }

  async searchRemote(query) {
    this.abortController = new AbortController();
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;

    try {
      const resp = await fetch(url, {
        signal: this.abortController.signal,
        headers: { 'Accept-Language': 'en' }
      });
      if (!resp.ok) return;

      const data = await resp.json();
      const remoteMatches = data.map((item) => {
        const parts = item.display_name.split(',');
        const mainTitle = parts[0].trim();
        const subtitle = parts.slice(1, 3).join(',').trim();

        return {
          name: mainTitle,
          subtitle: subtitle || parts.slice(1).join(',').trim(),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          zoom: 6.8,
          tag: item.type ? item.type.replace('_', ' ') : 'Global Location',
          source: 'nominatim'
        };
      });

      // Merge local and remote without duplicates
      const seen = new Set(this.currentItems.map((i) => `${i.lat.toFixed(2)},${i.lng.toFixed(2)}`));
      const combined = [...this.currentItems];

      for (const rm of remoteMatches) {
        const key = `${rm.lat.toFixed(2)},${rm.lng.toFixed(2)}`;
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(rm);
        }
      }

      this.currentItems = combined.slice(0, 8);
      this.renderSuggestions(this.currentItems);
    } catch (e) {
      // Aborted or network error
    }
  }

  renderSuggestions(items) {
    this.suggestions.innerHTML = '';
    this.selectedIndex = -1;

    if (!items || items.length === 0) {
      this.suggestions.classList.remove('open');
      return;
    }

    items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'suggestion-item';
      row.dataset.index = index;

      row.innerHTML = `
        <div class="sugg-left">
          <span class="sugg-icon">📍</span>
          <div class="sugg-info">
            <span class="sugg-name">${this.escapeHtml(item.name)}</span>
            <span class="sugg-sub">${this.escapeHtml(item.subtitle)}</span>
          </div>
        </div>
        <div class="sugg-right">
          <span class="sugg-tag">${this.escapeHtml(item.tag)}</span>
        </div>
      `;

      row.addEventListener('click', () => this.selectItem(item));
      this.suggestions.appendChild(row);
    });

    this.suggestions.classList.add('open');
  }

  handleKeydown(e) {
    if (!this.currentItems.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = Math.min(this.selectedIndex + 1, this.currentItems.length - 1);
      this.updateSelectionVisuals();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      this.updateSelectionVisuals();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.selectedIndex >= 0 && this.selectedIndex < this.currentItems.length) {
        this.selectItem(this.currentItems[this.selectedIndex]);
      } else if (this.currentItems.length > 0) {
        this.selectItem(this.currentItems[0]);
      }
    } else if (e.key === 'Escape') {
      this.close();
      this.input.blur();
    }
  }

  updateSelectionVisuals() {
    const children = this.suggestions.querySelectorAll('.suggestion-item');
    children.forEach((child, i) => {
      child.classList.toggle('active', i === this.selectedIndex);
      if (i === this.selectedIndex) {
        child.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  selectItem(item) {
    this.input.value = item.name;
    this.close();
    if (this.onSelect) {
      this.onSelect(item);
    }
  }

  close() {
    this.suggestions.classList.remove('open');
    this.suggestions.innerHTML = '';
    this.selectedIndex = -1;
  }

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
