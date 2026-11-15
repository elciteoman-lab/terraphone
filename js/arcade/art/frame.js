// The simulation stays in screen coordinates. Only the illustrated world is rasterized at game-pixel resolution.
function surface(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

class GameArt {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.unit = Math.max(1, Math.round(Math.max(width, height) / 480));
    this.pixelWidth = Math.ceil(width / this.unit);
    this.pixelHeight = Math.ceil(height / this.unit);
    this.surface = surface(this.pixelWidth, this.pixelHeight);
    this.ctx = this.surface.getContext('2d', { alpha: false });
    this.ctx.setTransform(1 / this.unit, 0, 0, 1 / this.unit, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    this.cache = new Map();
    this.finished = false;
    this.reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  stamp(key, width, height, paint) {
    let stamp = this.cache.get(key);
    if (!stamp) {
      stamp = surface(width, height);
      const ctx = stamp.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      paint(ctx, stamp.width, stamp.height);
      this.cache.set(key, stamp);
    }
    return stamp;
  }

  sprite(key, rows, palette) {
    const cached = this.cache.get(key);
    if (cached) return cached;
    return this.stamp(key, Math.max(...rows.map(row => row.length)), rows.length, ctx => {
      rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const color = palette[row[x]];
          if (!color) continue;
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      });
    });
  }
}

// Prepare the large terrain and sky illustrations during free time in the briefing.
export function prepareGameArt(width, height, makeSteps) {
  const art = new GameArt(width, height);
  const steps = makeSteps(art);
  const idle = typeof window.requestIdleCallback === 'function';
  let scheduled;
  const schedule = () => {
    scheduled = idle ? window.requestIdleCallback(draw, { timeout: 100 }) : setTimeout(draw, 12);
  };
  function draw(deadline) {
    const start = performance.now();
    do {
      if (steps.next().done) return;
    } while (performance.now() - start < 4 && (!deadline || deadline.timeRemaining() > 2));
    schedule();
  }
  schedule();
  return {
    art,
    cancel() {
      if (idle) window.cancelIdleCallback(scheduled);
      else clearTimeout(scheduled);
      steps.return();
    }
  };
}

export function renderGame(game, paint, readout) {
  const { width, height } = game.canvas;
  if (!width || !height) return;
  let art = game.art;
  if (!art || art.width !== width || art.height !== height) {
    art = game.art = new GameArt(width, height);
  }
  const finished = Boolean(game.isVictory || game.isGameOver);
  // Keep the final frame on screen while the player chooses what to do.
  if (finished && art.finished) return;
  art.time = performance.now() / 1000;
  art.ctx.save();
  paint(game, art);
  art.ctx.restore();
  const ctx = game.ctx;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art.surface, 0, 0, art.pixelWidth * art.unit, art.pixelHeight * art.unit);
  const damage = game.damageFlash || game.biteFlash;
  if (damage && !art.reduceMotion) {
    ctx.strokeStyle = '#e08770';
    ctx.globalAlpha = damage * .8;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);
    ctx.globalAlpha = 1;
  }
  readout(game, art, ctx);
  ctx.restore();
  if (finished !== art.finished) {
    art.finished = finished;
    game.onResultChange?.(finished);
  }
}
