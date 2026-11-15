// Full-resolution instruments keep small type legible over the pixel artwork.
const ink = '#15201e';
const paper = '#f4f1de';
const muted = '#c2ccc1';
const accent = '#8ed3bc';
const warm = '#f2ac78';

function instrument(ctx, x, y, width, label, value, level, ghost) {
  ctx.fillStyle = ink;
  ctx.fillRect(x, y, width, 45);
  ctx.fillStyle = muted;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(label, x + 10, y + 14, width - 20);
  ctx.fillStyle = paper;
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText(value, x + 10, y + 34, width - 20);
  if (level == null) return;
  const bar = width - 2;
  ctx.fillStyle = '#455850';
  ctx.fillRect(x + 1, y + 42, bar, 3);
  if (ghost > level) {
    ctx.fillStyle = '#c2846e';
    ctx.fillRect(x + 1, y + 42, bar * Math.min(1, ghost), 3);
  }
  ctx.fillStyle = level < .28 ? warm : accent;
  ctx.fillRect(x + 1, y + 42, bar * Math.max(0, Math.min(1, level)), 3);
}

function readouts(game, art, ctx, leftLabel, leftValue, rightLabel, rightValue, level, ghost) {
  const margin = art.width < 500 ? 12 : 20;
  const width = Math.min(169, Math.floor((art.width - margin * 3) / 2));
  const y = art.height - margin - 45;
  instrument(ctx, margin, y, width, leftLabel, leftValue);
  instrument(ctx, art.width - margin - width, y, width, rightLabel, rightValue, level, ghost);
  if (game.milestoneBannerTimer > 0 && !game.isGameOver) {
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const labelWidth = Math.ceil(ctx.measureText(game.milestoneBannerText).width) + 24;
    ctx.fillStyle = ink;
    ctx.fillRect((art.width - labelWidth) / 2, y - 38, labelWidth, 27);
    ctx.fillStyle = paper;
    ctx.fillText(game.milestoneBannerText, art.width / 2, y - 20);
  }
}

export function woodlandReadout(g, a, ctx) {
  const p = g.player;
  readouts(g, a, ctx, p.isFirefly ? 'Firefly · ' + Math.ceil(p.fireflyTimer) + ' s' : 'Seed pouch',
    p.seedsCarried + ' carried', 'Springs restored', g.forestsRestored + ' / ' + g.springs.length,
    g.forestsRestored / g.springs.length);
}
export function avenueReadout(g, a, ctx) {
  const p = g.player;
  readouts(g, a, ctx, (g.currentKmh || 40) + ' km/h · ' + Math.round(g.lastLST ?? 48) + ' °C',
    Math.floor(p.distance) + ' m', p.cryoTimer > 0 ? 'Cryo · ' + Math.ceil(p.cryoTimer) + ' s' : 'Hydration',
    Math.round(p.hydration) + '% · ' + p.dropletsCollected + ' drops', p.hydration / 100);
}
export function cloudReadout(g, a, ctx) {
  readouts(g, a, ctx, 'Gates cleared', String(g.cloud.gatesCleared), 'Cloud purity',
    Math.round(g.cloud.purity) + '%', g.cloud.purity / 100, g.ghostPurity / 100);
}
export function orbitReadout(g, a, ctx) {
  readouts(g, a, ctx, 'Probe', g.keys.thrust ? 'Thrust' : 'Coasting', 'Ozone samples',
    g.canistersCollected + ' / ' + g.targetCanisters, g.canistersCollected / g.targetCanisters);
}
export function reefReadout(g, a, ctx) {
  const t = g.turtle;
  readouts(g, a, ctx, g.coralsRevived + ' coral revived', Math.floor(g.distance) + ' m',
    'Dash ' + (t.stamina < 30 ? 'charging' : 'ready') + ' · ' + Math.round(t.stamina) + '%',
    'Health ' + Math.round(t.hp) + '%', t.hp / 100, g.ghostHp / 100);
}
export function canopyReadout(g, a, ctx) {
  readouts(g, a, ctx, 'Seeds planted', g.seed.seedsPlanted + ' / ' + g.seed.targetSeeds, 'Altitude',
    Math.round(g.seed.altitude) + '%', g.seed.altitude / 100);
}
