// The Earth is sampled through an orthographic projection. The same small atlas
// supplies coastlines, shallow water and the night-side lights at every aspect ratio.
const continents = [
  [[-168,66],[-151,71],[-140,69],[-128,70],[-120,74],[-100,75],[-93,70],[-88,69],[-86,64],[-94,62],[-91,57],[-84,55],[-80,59],[-80,64],[-74,63],[-70,59],[-64,61],[-58,55],[-55,52],[-61,50],[-66,50],[-69,47],[-65,45],[-60,47],[-61,44],[-65,43],[-71,42],[-74,40],[-76,35],[-80,32],[-81,25],[-83,27],[-83,30],[-88,30],[-90,29],[-94,30],[-97,26],[-97,22],[-94,19],[-91,19],[-90,22],[-87,22],[-88,18],[-86,16],[-84,16],[-83,12],[-81,9],[-78,9],[-77,8],[-80,7],[-84,9],[-86,12],[-89,14],[-92,15],[-97,16],[-103,18],[-106,22],[-109,25],[-112,31],[-114,31],[-110,24],[-111,23],[-115,28],[-117,33],[-122,37],[-124,42],[-124,48],[-128,51],[-133,55],[-137,59],[-144,60],[-148,60],[-153,58],[-161,55],[-165,55],[-160,59],[-164,60],[-166,64]],
  [[-73,83],[-48,83],[-26,82],[-17,79],[-19,76],[-23,74],[-22,70],[-31,68],[-37,65],[-44,60],[-47,61],[-51,65],[-54,69],[-51,70],[-55,72],[-60,76],[-68,77],[-71,80]],
  [[-83,73],[-76,74],[-71,72],[-67,69],[-64,66],[-67,63],[-74,67],[-78,67],[-80,71]],
  [[-62,51],[-56,51],[-53,47],[-56,47],[-58,49],[-59,48]],
  [[-85,22],[-80,23],[-75,21],[-74,20],[-78,20],[-80,22]], [[-74,20],[-70,20],[-68,19],[-70,18],[-74,18]],
  [[-81,12],[-76,12],[-72,11],[-70,13],[-62,11],[-60,9],[-56,6],[-52,4],[-50,1],[-44,-2],[-41,-3],[-36,-5],[-35,-8],[-38,-13],[-39,-17],[-40,-20],[-43,-23],[-46,-24],[-48,-26],[-51,-32],[-54,-35],[-57,-36],[-58,-39],[-63,-41],[-65,-43],[-64,-46],[-66,-48],[-68,-50],[-66,-54],[-70,-55],[-74,-52],[-75,-46],[-73,-42],[-73,-37],[-71,-33],[-70,-27],[-70,-18],[-75,-15],[-78,-10],[-80,-6],[-81,-3],[-80,0],[-78,3],[-77,7]],
  [[-17,15],[-16,20],[-13,25],[-10,29],[-8,32],[-6,35],[-1,35],[3,37],[9,37],[12,33],[15,32],[19,31],[21,33],[25,31],[32,31],[34,28],[34,25],[37,20],[40,16],[43,12],[48,12],[51,12],[50,8],[45,2],[42,-1],[40,-5],[40,-10],[40,-14],[36,-18],[35,-23],[33,-26],[32,-29],[29,-32],[25,-34],[19,-35],[17,-32],[15,-28],[13,-22],[12,-17],[12,-12],[13,-6],[10,-3],[9,1],[9,4],[6,4],[4,6],[1,6],[-2,5],[-5,5],[-9,4],[-12,7],[-14,9]],
  [[-10,37],[-9,43],[-4,44],[-2,44],[-2,47],[-5,48],[-4,49],[-1,49],[2,51],[4,52],[6,54],[9,55],[8,57],[10,58],[12,55],[14,55],[16,58],[18,60],[22,63],[24,65],[24,60],[28,60],[30,61],[29,66],[26,69],[23,69],[20,68],[17,66],[14,65],[12,63],[7,62],[5,60],[5,57],[8,59],[10,63],[13,65],[16,67],[20,70],[27,71],[35,69],[42,67],[49,69],[58,70],[68,73],[78,75],[95,77],[113,73],[133,71],[150,71],[161,68],[174,67],[179,64],[177,52],[160,56],[145,49],[142,45],[136,42],[130,42],[128,39],[129,35],[126,35],[124,39],[121,38],[122,32],[120,29],[118,25],[112,21],[108,21],[107,17],[109,12],[105,9],[102,13],[100,13],[99,9],[98,16],[94,16],[90,22],[87,22],[81,16],[78,8],[76,10],[73,16],[72,20],[69,22],[68,24],[63,25],[58,25],[54,27],[51,30],[48,30],[49,27],[52,25],[55,24],[56,26],[60,23],[57,17],[52,16],[48,13],[44,12],[42,16],[40,20],[37,24],[35,29],[33,31],[35,34],[36,36],[33,36],[29,37],[26,39],[26,41],[23,40],[24,37],[22,36],[20,39],[18,40],[15,43],[13,45],[12,44],[14,42],[16,40],[15,38],[12,40],[10,43],[7,44],[5,43],[3,43],[2,41],[0,39],[-1,37],[-5,36]],
  [[-6,50],[-4,52],[-5,53],[-3,54],[-5,55],[-6,58],[-4,59],[-2,58],[-3,56],[-1,54],[2,52],[1,51]], [[-11,52],[-10,54],[-8,55],[-6,55],[-6,52],[-8,51]],
  [[-25,65],[-23,66],[-17,67],[-13,65],[-16,64],[-21,64]], [[8,41],[9,41],[10,39],[8,39]], [[12,38],[16,38],[15,37]],
  [[48,-13],[50,-16],[47,-24],[45,-26],[44,-23],[44,-18]], [[80,10],[82,8],[81,6],[80,7]]
];

function rasterPolygon(points, row) {
  let top = Infinity;
  let bottom = -Infinity;
  for (const [, y] of points) {
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  const cuts = [];
  for (let y = Math.floor(top); y < bottom; y++) {
    cuts.length = 0;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [ax, ay] = points[j], [bx, by] = points[i];
      if ((ay > y + 0.5) !== (by > y + 0.5)) cuts.push(ax + (y + 0.5 - ay) * (bx - ax) / (by - ay));
    }
    cuts.sort((a, b) => a - b);
    for (let i = 0; i < cuts.length; i += 2) row(y, Math.round(cuts[i]), Math.round(cuts[i + 1]));
  }
}

let landAtlas;
function landAt(lon, lat) {
  if (!landAtlas) {
    landAtlas = new Uint8Array(720 * 360);
    for (const outline of continents) {
      const xy = outline.map(([x, y]) => [(x + 180) * 2, (90 - y) * 2]);
      rasterPolygon(xy, (y, a, b) => landAtlas.fill(1, y * 720 + a, y * 720 + b));
    }
  }
  const x = (Math.floor((lon + 180) * 2) + 720) % 720;
  const y = Math.max(0, Math.min(359, Math.floor((90 - lat) * 2)));
  return landAtlas[y * 720 + x];
}

function hash(x, y) {
  let z = Math.imul(x, 1597334677) ^ Math.imul(y, 3812015801);
  z = Math.imul(z ^ z >>> 16, 2246822519);
  return ((z ^ z >>> 13) >>> 0) / 4294967296;
}

function noise(x, y) {
  const i = Math.floor(x), j = Math.floor(y);
  let fx = x - i, fy = y - j;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

const ink = [
  '#101524','#171b30','#202338','#292b44','#36334e','#494159', // space 0–5
  '#293450','#394665','#485b77','#5e8296','#78a7b4','#acd0c8','#f2d9aa', // air 6–12
  '#172941','#1e374e','#264960','#2d6175','#397a83','#59949a', // water 13–18
  '#263b49','#354d54','#45675f','#6a826b','#9d9979','#c2b18a', // land 19–24
  '#35475e','#4d6478','#728697','#8fa4a7','#b9c8b9','#ece2c5', // clouds 25–30
  '#7a7a8a','#a69ba4','#e0d2c5','#f6e6be','#b68b73','#eee1aa' // stars and lights
];
const dither = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const radians = Math.PI / 180;
const sinLatitude = Math.sin(-29 * radians), cosLatitude = Math.cos(-29 * radians);

function surfaceColor(nx, ny, nz, x, y) {
  const lat = Math.asin(clamp(-ny * cosLatitude + nz * sinLatitude, -1, 1)) / radians;
  const lon = Math.atan2(nx, nz * cosLatitude + ny * sinLatitude) / radians - 19;
  const broad = noise(lon * 0.075 + 27, lat * 0.11 + 12);
  const detail = noise(lon * 0.47, lat * 0.56);
  const land = landAt(lon + (detail - 0.5) * 1.5, lat + (broad - 0.5) * 1.2);
  const sun = clamp(0.61 - nx * 0.89 - nz * 0.39 - ny * 0.07, 0, 1);
  const grain = (dither[(x & 3) + (y & 3) * 4] / 15 - 0.5) * 0.25;
  let color;
  if (land) {
    const dry = lat > 13 && lat < 34 && lon > -18 && lon < 56;
    const mountains = Math.abs(broad - detail * 0.7) < 0.14;
    color = 19 + clamp(Math.floor(sun * 4.2 + broad * 0.9 + grain + (dry ? 1.25 : 0) - (mountains ? 0.55 : 0)), 0, 5);
    if (sun < 0.41 && hash(x, y) > (detail > 0.62 ? 0.94 : 0.989)) color = sun > 0.32 ? 35 : 36;
  } else {
    const shelf = landAt(lon + 0.95, lat) || landAt(lon, lat - 0.8);
    color = 13 + clamp(Math.floor(sun * 3.65 + broad * 0.75 + grain + (shelf ? 1.55 : 0)), 0, 5);
  }

  // Two fronts over the Atlantic share their cloud shadows with the surface.
  const warp = noise(lon * 0.053 + 65, lat * 0.09 + 54);
  const band = noise(lon * 0.080 + warp * 2.7, lat * 0.27 + broad * 3.7);
  const vapour = band * 0.69 + noise(lon * 0.28 + warp, lat * 0.61 + band) * 0.31;
  const ex = (lon + 53) * 0.77, ey = lat - 35;
  const radius = Math.sqrt(ex * ex + ey * ey);
  let cloud = vapour;
  if (radius < 11) {
    const arm = (Math.cos(radius * 1.35 - Math.atan2(ey, ex) * 2 - 1.5) + 1) * 0.5;
    cloud += Math.max(0, 1 - radius / 11) * (arm * 0.65 + 0.12);
    if (radius < 1.55) cloud -= 0.57;
  }
  if (cloud > 0.60) {
    const layer = Math.min(1.6, (cloud - 0.60) * 6);
    color = 25 + clamp(Math.floor(sun * 3.95 + layer + grain), 0, 5);
  } else if (cloud > 0.558 && color < 25 && !land) {
    color = Math.max(13, color - 1);
  }
  return color;
}

function paintGlobeRows(ctx, w, h, first, end) {
  const r = Math.max(w * 1.02, h * 0.85), cx = w * 0.72, cy = h * 0.42 + r;
  const air = Math.max(4, Math.min(13, h * 0.034));
  for (let y = first; y < end; y++) {
    let start = 0, last = -1;
    const ny = (y - cy) / r;
    for (let x = 0; x <= w; x++) {
      let color = -1;
      if (x < w) {
        const nx = (x - cx) / r;
        const d = nx * nx + ny * ny;
        if (d < 1) {
          color = surfaceColor(nx, ny, Math.sqrt(1 - d), x, y);
        } else {
          const height = (Math.sqrt(d) - 1) * r;
          if (height < air) {
            const f = height / air;
            if (f < 0.13) color = x / w < 0.58 ? 12 : 11;
            else if (f < 0.28) color = 10;
            else if (f < 0.52) color = 9;
            else if (f < 0.73) color = 8;
            else color = f < 0.86 ? 7 : 6;
          } else {
            const v = y / h, u = x / w;
            const cloud = noise(x * 0.025 + 9, y * 0.050 + 37);
            const lane = Math.max(0, 1 - Math.abs(v - 0.48 + 0.53 * u + (cloud - 0.5) * 0.20) * 5.7);
            const haze = clamp(1 - height / (h * 0.28), 0, 1);
            const tone = 0.26 + 0.95 * v + haze * 1.55 + lane * (0.64 + cloud * 1.8);
            color = clamp(Math.floor(tone + (dither[(x & 3) + (y & 3) * 4] / 15) * 0.27), 0, 5);
            const star = hash(x + 220, y - 65);
            if (star > 0.9969 - lane * 0.0020) color = star > 0.99965 ? 33 : star > 0.9988 ? 32 : 31;
          }
        }
      }
      if (color !== last) {
        if (last >= 0) {
          ctx.fillStyle = ink[last];
          ctx.fillRect(start, y, x - start, 1);
        }
        start = x;
        last = color;
      }
    }
  }
}

function paintMoon(ctx, w, h) {
  // A small cratered moon lies behind the playable sample field.
  const moonR = Math.max(4, Math.min(13, Math.round(Math.min(w, h) * 0.045)));
  const mx = Math.floor(w * 0.79), my = Math.floor(h * 0.185);
  for (let y = -moonR; y <= moonR; y++) {
    for (let x = -moonR; x <= moonR; x++) {
      const xx = x / moonR, yy = y / moonR, d = xx * xx + yy * yy;
      if (d > 1) continue;
      const lit = -xx * 0.80 - yy * 0.30 - Math.sqrt(1 - d) * 0.20;
      let shade = lit > 0.52 ? 33 : lit > 0.28 ? 32 : lit > 0.015 ? 31 : 2;
      if (lit > 0.04 && noise(xx * 5 + 60, yy * 6 + 12) > 0.68) shade = Math.max(31, shade - 1);
      ctx.fillStyle = ink[shade];
      ctx.fillRect(mx + x, my + y, 1, 1);
    }
  }
}

function polygon(ctx, color, points) {
  ctx.fillStyle = color;
  rasterPolygon(points, (y, a, b) => ctx.fillRect(a, y, b - a, 1));
}

function satellite(ctx) {
  const outline = '#192231', silver = '#aab9bb', white = '#ecdfc4', brass = '#d79953';
  // Sun-facing rib, indigo photovoltaic cells and individual electrical bus bars.
  const array = y => {
    ctx.fillStyle = outline; ctx.fillRect(5, y, 17, 13);
    ctx.fillStyle = '#718b9c'; ctx.fillRect(6, y + 1, 15, 11);
    ctx.fillStyle = '#283b5e'; ctx.fillRect(7, y + 2, 13, 9);
    for (let col = 0; col < 3; col++) for (let row = 0; row < 2; row++) {
      const x = 7 + col * 5, yy = y + 2 + row * 5;
      ctx.fillStyle = (row + col) % 2 ? '#42618a' : '#536f9a'; ctx.fillRect(x, yy, 3, 4);
      ctx.fillStyle = '#8299aa'; ctx.fillRect(x, yy, 3, 1);
    }
    ctx.fillStyle = brass; ctx.fillRect(7, y, 12, 1);
  };
  ctx.fillStyle = outline; ctx.fillRect(12, 10, 5, 21);
  ctx.fillStyle = silver; ctx.fillRect(13, 10, 2, 21);
  array(0); array(28);
  polygon(ctx, outline, [[5,15],[17,13],[24,14],[29,17],[29,23],[23,27],[10,26],[5,23]]);
  polygon(ctx, '#81717b', [[9,21],[22,20],[28,17],[28,23],[23,26],[10,25]]);
  polygon(ctx, '#b97844', [[8,16],[18,14],[25,16],[23,22],[10,23]]);
  polygon(ctx, '#e5aa5a', [[8,17],[16,15],[20,17],[17,21],[10,21]]);
  polygon(ctx, '#f3ce82', [[12,16],[17,15],[19,16],[15,17],[13,20],[11,20]]);
  polygon(ctx, silver, [[18,15],[24,15],[28,17],[25,20],[21,21],[20,18]]);
  polygon(ctx, white, [[19,15],[24,15],[27,17],[22,18]]);
  ctx.fillStyle = '#374857'; ctx.fillRect(23, 20, 4, 4); ctx.fillRect(10, 22, 7, 1);
  ctx.fillStyle = silver; ctx.fillRect(12, 23, 4, 1);
  ctx.fillStyle = outline; ctx.fillRect(2, 17, 6, 8);
  ctx.fillStyle = '#9a9ba0'; ctx.fillRect(3, 18, 4, 2); ctx.fillRect(3, 22, 4, 2);
  ctx.fillStyle = '#3a526c'; ctx.fillRect(2, 19, 2, 4);
  // The forward instrument barrel and narrow boom point along the real thrust vector.
  polygon(ctx, outline, [[26,17],[30,16],[33,17],[33,21],[29,23],[26,22]]);
  ctx.fillStyle = silver; ctx.fillRect(27, 18, 4, 3);
  ctx.fillStyle = '#8ed3cb'; ctx.fillRect(30, 17, 2, 3);
  ctx.fillStyle = white; ctx.fillRect(30, 17, 2, 1); ctx.fillRect(32, 19, 5, 1);
  ctx.fillStyle = '#d49b70'; ctx.fillRect(36, 18, 2, 2);
  ctx.fillStyle = white; ctx.fillRect(9, 16, 2, 1);
}

const sampleRows = [
  '   ooooo   ','  oswwss0  ','   osso0   ','  oawwaa0  ',' oawaaapp0 ',
  ' oawbmmgp0 ',' oawbllgp0 ',' oawblggp0 ',' oawbgmgp0 ',' oawbgggp0 ',
  ' 0awaaapp0 ','  0shhss0  ','  oswwss0  ','   00000   '
];
const samplePalette = {o:'#141e31','0':'#2e3546',s:'#87949e',w:'#f4e5bf',a:'#dfa35e',p:'#9a6045',b:'#3d667b',m:'#d3f4d8',l:'#8bd1b7',g:'#60a69d',h:'#b8c8bf'};
const digits = {
  '0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111',
  '4':'101101111001001','5':'111100111001111','6':'111100111101111','7':'111001010010010',
  '8':'111101111101111','9':'111101111001111','D':'110101101101110','U':'101101101101111'
};
function drawLabel(art, c) {
  const value = c.dobsonUnits;
  const label = art.stamp('ozone-du-' + value, 27, 9, ctx => {
    ctx.fillStyle = '#192735'; ctx.fillRect(1, 0, 25, 9); ctx.fillRect(0, 1, 27, 7);
    ctx.fillStyle = '#a4b7b4'; ctx.fillRect(2, 8, 23, 1);
    ctx.fillStyle = '#efe6c7';
    let x = 2;
    for (const char of String(value) + ' DU') {
      if (char === ' ') { x += 2; continue; }
      const grid = digits[char];
      for (let j = 0; j < 15; j++) if (grid[j] === '1') ctx.fillRect(x + j % 3, 2 + Math.floor(j / 3), 1, 1);
      x += 4;
    }
  });
  const k = 1.65;
  art.ctx.drawImage(label, Math.round(c.x - 27 * k / 2), Math.round(c.y + 13), 27 * k, 9 * k);
}

export function* prepareOrbit(art) {
  const { pixelWidth: w, pixelHeight: h } = art;
  const sky = art.stamp('ozone-globe', w, h, () => {});
  const ctx = sky.getContext('2d');
  let row = art.skyRow || 0;
  while (row < h) {
    const end = Math.min(row + 10, h);
    paintGlobeRows(ctx, w, h, row, end);
    art.skyRow = row = end;
    yield;
  }
  paintMoon(ctx, w, h);
  art.finishedSky = sky;
}

const collectionTimes = new WeakMap();
export function paintOrbit(game, art) {
  const { ctx, width, height, time } = art;
  if (!art.finishedSky) {
    const steps = prepareOrbit(art);
    while (!steps.next().done) { /* Finish any rows left by a quick launch. */ }
  }
  ctx.drawImage(art.finishedSky, 0, 0, width, height);
  const vial = art.sprite('ozone-sample', sampleRows, samplePalette);
  let nearest, nearDistance = 115 * 115;
  for (let i = 0; i < game.gasCanisters.length; i++) {
    const c = game.gasCanisters[i];
    if (c.collected) {
      if (!collectionTimes.has(c)) collectionTimes.set(c, time);
      const age = time - collectionTimes.get(c);
      if (age < 0.40) {
        ctx.fillStyle = age < 0.19 ? '#f7df9d' : '#a5c5ac';
        for (let ray = 0; ray < 8; ray++) {
          const a = ray * Math.PI / 4, r = 8 + age * 64;
          ctx.fillRect(Math.round(c.x + Math.cos(a) * r), Math.round(c.y + Math.sin(a) * r), 3, 3);
        }
      }
      continue;
    }
    if (c.x < -15 || c.x > width + 15 || c.y < -20 || c.y > height + 20) continue;
    const y = Math.round(c.y + Math.sin(time * 2.3 + i * 1.9) * 1.5);
    ctx.drawImage(vial, Math.round(c.x - 9), y - 12, 18, 24);
    if ((Math.floor(time * 2) + i * 3) % 11 === 0) {
      ctx.fillStyle = '#fff0c6'; ctx.fillRect(Math.round(c.x - 5), y - 6, 3, 3);
    }
    const d = (game.probe.x - c.x) ** 2 + (game.probe.y - c.y) ** 2;
    if (d < nearDistance) { nearest = c; nearDistance = d; }
  }
  if (nearest) drawLabel(art, nearest);
  const ship = art.stamp('ozone-satellite', 38, 41, satellite);
  const frame = Math.floor(time * 12) % 3;
  const k = 1.43;
  ctx.save();
  ctx.translate(Math.round(game.probe.x), Math.round(game.probe.y));
  ctx.rotate(game.probe.angle);
  if (game.keys.thrust) {
    const tail = 17 + frame * 4;
    polygon(ctx, '#9a5b64', [[-18,-5],[-28,-4],[-24-tail,0],[-30,3],[-18,5]]);
    polygon(ctx, '#eca060', [[-18,-4],[-28,-2],[-19-tail,0],[-28,2],[-18,3]]);
    ctx.fillStyle = '#fce2aa'; ctx.fillRect(-32, -1, 15, 3);
    ctx.fillStyle = '#c6e3cf'; ctx.fillRect(-24, -2, 7, 4);
  }
  if (game.keys.left || game.keys.right) {
    const side = game.keys.left ? 1 : -1;
    ctx.fillStyle = frame === 1 ? '#f5d595' : '#c08e74';
    ctx.fillRect(-10, side * 14 - 2, 3, 5);
  }
  ctx.drawImage(ship, -16 * k, -20 * k, 38 * k, 41 * k);
  ctx.restore();
}
