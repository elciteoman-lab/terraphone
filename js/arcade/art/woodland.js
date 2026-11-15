import { arcadeTokens } from '../arcade-tokens.js';

// Ground coordinates use the same isometric plane as the moving objects.
const ISO_X = Math.sqrt(3) / 2;
const TILE = 112;
const GROUND_SCALE = 2.5;
const TILE_SPAN = TILE * GROUND_SCALE;
const scenery = new WeakMap();

const westTrail = [
  [-1780, -145], [-1450, -71], [-1206, -24], [-990, 44], [-812, 78], [-676, 25],
  [-520, 18], [-391, -38], [-245, -10], [-112, -23], [0, 0], [166, -7],
  [371, 47], [533, 27], [733, 97], [937, 69], [1081, 48], [1490, 13], [1840, 60]
];
const springTrail = [[-430, 242], [-360, 219], [-283, 203], [-207, 157], [-145, 96], [-68, 65], [4, 0]];
const stream = [
  [-1930, -104], [-1600, -67], [-1440, -81], [-1206, -24], [-1040, -106],
  [-913, -83], [-752, -151], [-615, -128], [-507, -172], [-372, -137],
  [-260, -170], [-128, -175], [-48, -209], [80, -187], [183, -227], [280, -205],
  [368, -193], [456, -144], [573, -119], [674, -148], [820, -94], [930, -40],
  [1081, 48], [1220, 30], [1410, 122], [1620, 118], [1930, 203]
];
const springRun = [[-1910, 702], [-1430, 537], [-1080, 567], [-929, 451], [-773, 412], [-686, 318], [-563, 355], [-493, 292], [-416, 240]];

function profile(points, x) {
  if (x < points[0][0] || x > points[points.length - 1][0]) return -100000;
  let i = 1;
  while (i < points.length - 1 && x > points[i][0]) i++;
  const a = points[i - 1];
  const b = points[i];
  const t = (x - a[0]) / (b[0] - a[0]);
  return a[1] + (b[1] - a[1]) * t * t * (3 - 2 * t);
}

function hash(x, y) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}

function valueNoise(x, y, grid) {
  const gx = Math.floor(x / grid);
  const gy = Math.floor(y / grid);
  const fx = x / grid - gx;
  const fy = y / grid - gy;
  const a = hash(gx, gy) & 255;
  const b = hash(gx + 1, gy) & 255;
  const c = hash(gx, gy + 1) & 255;
  const d = hash(gx + 1, gy + 1) & 255;
  return a + (b - a) * fx + (c - a + (a - b - c + d) * fx) * fy;
}

// Scan conversion at sprite resolution preserves the cut edges of each bough.
function shape(ctx, color, points) {
  let top = Infinity;
  let bottom = -Infinity;
  for (const [, y] of points) {
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  ctx.fillStyle = color;
  for (let y = Math.floor(top); y < bottom; y++) {
    const scan = y + 0.5;
    const crossings = [];
    let a = points[points.length - 1];
    for (const b of points) {
      if ((a[1] > scan) !== (b[1] > scan)) crossings.push(a[0] + (scan - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      a = b;
    }
    crossings.sort((left, right) => left - right);
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const x = Math.ceil(crossings[i] - 0.5);
      ctx.fillRect(x, y, Math.ceil(crossings[i + 1] - 0.5) - x, 1);
    }
  }
}

function stroke(ctx, color, x0, y0, x1, y1) {
  x0 = Math.round(x0); y0 = Math.round(y0);
  x1 = Math.round(x1); y1 = Math.round(y1);
  const length = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  ctx.fillStyle = color;
  for (let i = 0; i <= length; i++) ctx.fillRect(Math.round(x0 + (x1 - x0) * i / length), Math.round(y0 + (y1 - y0) * i / length), 1, 1);
}

function oval(ctx, color, x, y, rx, ry) {
  ctx.fillStyle = color;
  for (let dy = -ry; dy <= ry; dy++) {
    const dx = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy / (ry * ry + 0.2))));
    ctx.fillRect(x - dx, y + dy, dx * 2 + 1, 1);
  }
}

function fern(ctx, x, y, glade) {
  const deep = glade ? '#465e43' : '#294e41';
  const leaf = glade ? '#799059' : '#627f54';
  const tip = glade ? '#a0a36b' : '#859663';
  for (const [dx, dy] of [[-6,-2],[-4,-5],[-1,-7],[3,-6],[6,-3],[5,0]]) {
    stroke(ctx, deep, x, y + 1, x + dx, y + dy);
    stroke(ctx, leaf, x, y, x + dx, y + dy);
    const mx = x + Math.round(dx * 0.63);
    const my = y + Math.round(dy * 0.63);
    ctx.fillStyle = tip;
    ctx.fillRect(mx - 1, my - 1, 2, 1);
    ctx.fillStyle = leaf;
    ctx.fillRect(mx + 1, my + 1, 2, 1);
  }
}

function rock(ctx, x, y, size) {
  shape(ctx, '#2e453b', [[x-size-1,y],[x-2,y-size+1],[x+2,y-size+1],[x+size+2,y],[x+size,y+2],[x-2,y+3]]);
  shape(ctx, '#788275', [[x-size,y],[x-2,y-size],[x+2,y-size],[x+size,y],[x+1,y+1]]);
  shape(ctx, '#a3a38a', [[x-size,y],[x-2,y-size],[x+1,y-size],[x,y-1]]);
}

// The trail forks and stream are fixed in the playable map. Outside the generated
// forest, sixteen repeating forest-floor tiles keep the cache bounded.
const soil = [
  '#29473e','#304d40','#375441','#405c45','#496448','#536a49','#606f4e',
  '#686d4d','#777856','#84805c','#8b8766','#55654c','#344f48',
  '#244f52','#2d6264','#3b7472','#558884','#719891','#95afa1'
].map(color => [1,3,5].map(start => parseInt(color.slice(start, start + 2), 16)));

function groundTile(art, tx, ty) {
  const inMap = Math.abs(tx) <= 7 && Math.abs(ty) <= 5;
  const col = inMap ? tx : 12 + ((tx % 4 + 4) % 4);
  const row = inMap ? ty : 8 + ((ty % 4 + 4) % 4);
  return art.stamp(`wood-ground-${col}-${row}`, TILE, TILE, ctx => {
    const pixels = ctx.createImageData(TILE, TILE);
    const zone = new Uint8Array(TILE * TILE);
    for (let x = 0; x < TILE; x++) {
      const ix = col * TILE + x;
      const wx = ix * GROUND_SCALE;
      const main = profile(westTrail, wx);
      const fork = profile(springTrail, wx);
      const brook = profile(stream, wx);
      const run = profile(springRun, wx);
      const bridgePath = wx < 112 && wx > 12 ? -2.13 * (wx - 12) : -100000;
      const waterWidth = 12 + 2.1 * Math.sin(wx / 78);
      for (let y = 0; y < TILE; y++) {
        const iy = row * TILE + y;
        const wy = iy * GROUND_SCALE;
        const spot = hash(ix, iy);
        const broad = valueNoise(ix, iy, 43);
        const patch = valueNoise(ix + 211, iy - 64, 13);
        const relief = broad * 0.65 + patch * 0.35;
        const edge = (patch - 128) * 0.031;
        const water = Math.min(Math.abs(wy - brook), Math.abs(wy - run)) - waterWidth - edge;
        const trail = Math.min(Math.abs(wy - main), Math.abs(wy - fork), Math.abs(wy - bridgePath) * 0.58) - 10 + edge;
        const opening = Math.max(0, 1 - (wx * wx / 11100 + wy * wy / 4050));
        let shade = Math.max(0, Math.min(6, Math.floor((relief + opening * 66) / 38)));
        const cell = y * TILE + x;
        if (water < 5) {
          zone[cell] = 1;
          if (water >= 1) shade = (spot & 7) < 3 ? 8 : 11;
          else if (water >= -2) shade = wy < (Math.abs(wy - brook) < Math.abs(wy - run) ? brook : run) ? 12 : 17;
          else {
            shade = water > -6 ? 15 : relief > 133 ? 14 : 13;
            if (((iy + Math.floor(ix / 13)) % 7 + 7) % 7 === 2 && (hash(Math.floor(ix / 4), iy) & 15) < 5) shade = water > -7 ? 18 : 16;
          }
        } else if (trail < 3 || (opening > .48 && relief < 118)) {
          zone[cell] = 2;
          shade = trail > -1 ? 6 : relief > 146 ? 9 : relief > 96 ? 8 : 7;
          if ((spot & 63) === 3) shade = 10;
        } else if ((spot & 127) < 3 && shade < 6) shade++;
        const rgb = soil[shade];
        const k = cell * 4;
        pixels.data[k] = rgb[0]; pixels.data[k + 1] = rgb[1]; pixels.data[k + 2] = rgb[2]; pixels.data[k + 3] = 255;
      }
    }
    ctx.putImageData(pixels, 0, 0);
    for (let n = 0; n < 31; n++) {
      const s = hash(col * 73 + n, row * 31 - n);
      const x = 7 + (s & 255) % (TILE - 14);
      const y = 8 + ((s >>> 9) & 255) % (TILE - 16);
      const terrain = zone[y * TILE + x];
      if (terrain === 1) continue;
      if (n % 8 === 0 && terrain === 0) fern(ctx, x, y, (s & 2048) !== 0);
      else if (n % 11 === 0) rock(ctx, x, y, 2 + s % 3);
      else if (n % 9 === 2 && terrain === 0) {
        ctx.fillStyle = '#acaa80'; ctx.fillRect(x,y-1,1,3); ctx.fillRect(x+3,y+1,1,2);
        ctx.fillStyle = '#a47354'; ctx.fillRect(x-1,y-2,3,2); ctx.fillRect(x+2,y,3,1);
      } else {
        ctx.fillStyle = terrain === 2 ? '#9b9370' : '#6c8157';
        ctx.fillRect(x,y,2,1); ctx.fillRect(x+3,y-1,1,1);
        ctx.fillStyle = terrain === 2 ? '#6c7051' : '#4a6c4b';
        ctx.fillRect(x-2,y+1,2,1);
      }
    }
  });
}

const firPalettes = [
  ['#163636','#20463d','#2c5949','#397059','#538267','#709173','#9fa881'],
  ['#203b39','#274a40','#375b45','#4b7050','#6c8559','#8c9967','#b1ae7b'],
  ['#1b383c','#24474a','#2c5956','#396a61','#547e70','#71917c','#9aa78a']
];

function fir(art, variant) {
  return art.stamp(`wood-fir-${variant}`, 45, 58, ctx => {
    const p = firPalettes[variant];
    shape(ctx, '#322f29', [[20,26],[24,24],[26,51],[31,55],[25,54],[23,57],[20,55],[15,57],[19,52]]);
    shape(ctx, '#785e43', [[21,36],[23,35],[23,52],[21,54],[19,54],[21,50]]);
    stroke(ctx, '#a48459', 22,47,21,52);
    const tiers = [[19,46,22],[18,39,19],[19,32,17],[19,25,14],[20,19,11],[20,13,8],[20,8,5]];
    for (let i = 0; i < tiers.length; i++) {
      const [cx,b,half] = tiers[i];
      const lift = Math.max(8, Math.round(half * .81));
      shape(ctx, p[0], [[cx+1,b-lift-5],[cx+5,b-lift+1],[cx+half-3,b-6],[cx+half,b-8],[cx+half-1,b-3],[cx+half+2,b-4],[cx+half-1,b],[cx+half-8,b+1],[cx+half-8,b+3],[cx+4,b+1],[cx+2,b+5],[cx-2,b+3],[cx-7,b+4],[cx-7,b+2],[cx-half+5,b+3],[cx-half+6,b+1],[cx-half+1,b+1],[cx-half+2,b-1],[cx-half,b-2],[cx-half+4,b-4]]);
      shape(ctx, p[2], [[cx+1,b-lift-4],[cx+5,b-lift+1],[cx+half-3,b-4],[cx+half-1,b-5],[cx+half-2,b-2],[cx+half-8,b-1],[cx+half-7,b-3],[cx+4,b],[cx+3,b-2],[cx-1,b+2],[cx-2,b],[cx-7,b+2],[cx-6,b-1],[cx-half+4,b+1],[cx-half+1,b-1],[cx-half+6,b-4]]);
      shape(ctx, p[3], [[cx,b-lift-3],[cx+2,b-lift+2],[cx-1,b-4],[cx-6,b-2],[cx-4,b-4],[cx-half+5,b-1],[cx-half+7,b-5]]);
      shape(ctx, p[4], [[cx,b-lift-3],[cx,b-lift+1],[cx-4,b-6],[cx-4,b-4],[cx-8,b-4],[cx-half+5,b-2],[cx-half+8,b-5]]);
      stroke(ctx, p[5], cx-5, b-5, cx-2, b-7);
      if (i < 5) {
        stroke(ctx, p[1], cx+3,b-3,cx+half-5,b-2);
        stroke(ctx, p[3], cx+5,b-6,cx+half-5,b-4);
        ctx.fillStyle = p[5]; ctx.fillRect(cx-half+4,b-3,3,1);
      }
    }
    shape(ctx, p[3], [[20,0],[22,5],[24,7],[22,7],[24,11],[19,9],[17,10],[18,7],[15,8],[19,4]]);
    stroke(ctx,p[6],20,1,19,5);
  });
}

const foliage = [
  ['#344c3f','#4d6244','#697a4d','#84945c','#a1a366','#c3ba7c'],
  ['#394f42','#516b4e','#74885b','#909c66','#a7ac74','#c6c18b'],
  ['#3d4d3d','#586748','#738151','#92915a','#aaa367','#c8b47a']
];

function birch(art, variant) {
  return art.stamp(`wood-birch-${variant}`, 48, 59, ctx => {
    shape(ctx, '#384640', [[19,58],[20,50],[19,43],[14,37],[13,28],[15,27],[16,35],[20,39],[21,32],[19,21],[22,19],[25,38],[31,33],[33,23],[35,23],[33,35],[25,42],[23,52],[26,56],[22,55]]);
    shape(ctx, '#c1bba0', [[19,56],[21,49],[20,41],[21,37],[20,27],[22,25],[24,39],[31,33],[32,33],[24,42],[23,50],[24,53],[21,54]]);
    stroke(ctx, '#e3d5aa', 22,44,21,51);
    for (const [x,y,l] of [[20,49,2],[22,45,2],[21,41,1],[21,35,2],[20,31,1],[27,36,2],[15,33,1]]) {
      ctx.fillStyle = '#5e6659'; ctx.fillRect(x,y,l,1);
    }
    const palette = foliage[variant];
    const clumps = [[13,35,8,5],[31,33,10,6],[11,28,10,7],[33,24,11,9],[24,19,13,10],[13,19,9,8],[29,11,9,8],[20,9,10,9],[20,25,11,8]];
    for (let k = 0; k < clumps.length; k++) {
      const [x,y,rx,ry] = clumps[k];
      shape(ctx, palette[0], [[x-rx,y-2],[x-rx+3,y-ry+2],[x-3,y-ry],[x+1,y-ry+1],[x+5,y-ry],[x+rx-1,y-ry+4],[x+rx-1,y-1],[x+rx+1,y+1],[x+rx-1,y+4],[x+4,y+ry],[x,y+ry-1],[x-3,y+ry+1],[x-rx+3,y+ry-1],[x-rx+3,y+3],[x-rx,y+2]]);
      shape(ctx,palette[2],[[x-rx,y-2],[x-rx+3,y-ry+2],[x-3,y-ry],[x,y-ry+1],[x+5,y-ry],[x+rx-2,y-ry+3],[x+rx-3,y],[x+rx-1,y+1],[x+4,y+3],[x+3,y+5],[x-1,y+4],[x-3,y+6],[x-6,y+4],[x-rx+1,y+4]]);
      shape(ctx,palette[3],[[x-rx,y-2],[x-rx+4,y-ry+1],[x-3,y-ry],[x+1,y-ry+1],[x+3,y-ry],[x+6,y-ry+2],[x+4,y-3],[x+1,y-3],[x,y],[x-4,y-1],[x-5,y+1],[x-rx+1,y+2]]);
      ctx.fillStyle = palette[4]; ctx.fillRect(x-rx+2,y-4,3,2); ctx.fillRect(x-5,y-ry+1,4,2); ctx.fillRect(x-2,y-3,3,1);
      ctx.fillStyle = palette[1]; ctx.fillRect(x+2,y+2,3,1); ctx.fillRect(x+rx-4,y+1,2,2);
      if (k % 2 === 1) { ctx.fillStyle = palette[5]; ctx.fillRect(x-rx+3,y-4,2,1); ctx.fillRect(x-4,y-ry+1,3,1); }
    }
  });
}

function bridge(art) {
  return art.stamp('wood-footbridge', 43, 38, ctx => {
    shape(ctx,'#294744',[[1,8],[21,1],[42,29],[24,37]]);
    shape(ctx,'#443f32',[[2,7],[20,1],[40,26],[23,33]]);
    for (let n = 0; n < 10; n++) {
      const x = 3 + Math.round(n * 2.1), y = 6 + Math.round(n * 2.5);
      shape(ctx,n%3===0?'#9a8258':'#8b7954',[[x,y],[x+16,y-5],[x+18,y-3],[x+2,y+2]]);
      stroke(ctx,'#b1986a', x+1,y,x+12,y-4);
    }
    stroke(ctx,'#b6a072',4,3,24,27); stroke(ctx,'#8a7856',19,0,38,23);
    for (const [x,y] of [[3,9],[13,22],[24,35],[20,4],[39,28]]) {
      ctx.fillStyle = '#514d38'; ctx.fillRect(x,y-9,2,10);
      ctx.fillStyle = '#ad986a'; ctx.fillRect(x,y-9,2,2);
    }
  });
}

function fallenLog(art) {
  return art.stamp('wood-windfall', 36, 18, ctx => {
    shape(ctx,'#31483c',[[1,11],[7,7],[25,2],[32,4],[35,9],[27,11],[8,17],[3,16]]);
    shape(ctx,'#574e3a',[[2,9],[26,1],[31,2],[34,6],[33,9],[7,16],[3,14]]);
    shape(ctx,'#7f7052',[[3,9],[27,1],[30,2],[32,4],[7,12]]);
    shape(ctx,'#6d8150',[[3,9],[10,6],[14,6],[16,4],[24,3],[26,1],[29,2],[26,4],[22,4],[20,6],[15,6],[12,9],[7,10]]);
    stroke(ctx,'#a19462',9,8,18,5); stroke(ctx,'#453f32',8,14,27,8);
    oval(ctx,'#403f34',5,12,4,4); oval(ctx,'#af9063',5,11,3,3); oval(ctx,'#725d42',5,11,1,1);
    stroke(ctx,'#635b44',23,5,22,0); stroke(ctx,'#9e895e',22,2,22,0);
  });
}

const seedRows = [
  '......d...','.....dmd..','..dd.dlm..','.dmmdlmd..','..dlmmd...',
  '...ddmd...','...dhd....','..dahad...','.dahhad...', '.dahbad...',
  '..dabd....','...dd.....'
];

function seedSprite(art, gold) {
  return art.sprite(`wood-seed-${gold}`, seedRows, gold
    ? {d:'#483d31',m:'#b79750',l:'#f3dd91',h:'#fff0ab',a:'#e4aa51',b:'#b76f3d'}
    : {d:'#25463f',m:'#76ae7a',l:'#d1e7a8',h:'#e1f6b4',a:'#9cdba1',b:'#56aa89'});
}

function spring(art, restored) {
  return art.stamp(`wood-spring-${restored}`, 59, 38, ctx => {
    oval(ctx,'#364c40',29,26,28,10);
    oval(ctx,'#52694d',29,24,28,10);
    oval(ctx,'#394f48',29,23,25,9);
    oval(ctx,restored?'#316e71':'#31585b',30,23,23,7);
    oval(ctx,restored?'#4c9690':'#3a696a',29,22,19,5);
    for (const [x,y,s] of [[8,27,3],[5,22,3],[10,17,4],[16,15,3],[48,16,3],[53,20,4],[54,25,2],[48,29,3],[41,32,2],[24,32,2],[17,30,3]]) rock(ctx,x,y,s);
    for (const [x,y,h] of [[16,15,8],[23,13,11],[34,14,9],[42,16,6]]) {
      shape(ctx,'#40584e',[[x-3,y],[x-3,y-h+2],[x-1,y-h],[x+3,y-h],[x+4,y-1],[x,y+1]]);
      shape(ctx,'#77867b',[[x-2,y],[x-2,y-h+1],[x+1,y-h],[x+2,y-h+1],[x+1,y]]);
      ctx.fillStyle='#a8aa8f';ctx.fillRect(x-2,y-h+1,3,1);
    }
    ctx.fillStyle=restored?'#a2d3b1':'#729d91'; ctx.fillRect(12,23,8,1);ctx.fillRect(35,26,9,1);ctx.fillRect(27,18,6,1);
    fern(ctx,8,29,false); fern(ctx,50,16,true);
    if (restored) {
      shape(ctx,'#c8d49c',[[26,20],[22,15],[26,15],[29,18],[30,12],[32,15],[32,18],[36,15],[38,16],[33,21]]);
      ctx.fillStyle='#e4b482';ctx.fillRect(28,17,3,3);
    }
  });
}

function burnScar(art, variant) {
  return art.stamp(`wood-scar-${variant}`, 67, 33, ctx => {
    const mask = [[2,18],[12,12],[9,10],[20,10],[26,5],[31,6],[43,2],[48,5],[58,5],[53,9],[63,10],[59,14],[66,16],[58,20],[60,22],[44,24],[41,29],[32,27],[22,31],[20,27],[10,27],[15,23],[4,22]];
    shape(ctx,'rgba(93,74,49,.36)',mask);
    shape(ctx,'rgba(117,77,48,.43)',[[12,18],[24,13],[33,9],[44,8],[41,12],[53,13],[47,18],[52,19],[38,22],[29,24],[30,21],[17,24],[21,20]]);
    for (let n = 0; n < 20; n++) {
      const s=hash(n + variant*17,61);
      const x=12+s%42,y=10+((s>>>9)%13);
      ctx.fillStyle=n%4===0?'#a26e4d':'#65533e';ctx.fillRect(x,y,2+s%3,1);
    }
    stroke(ctx,'#594839',23,20,31,15);stroke(ctx,'#9e6648',28,18,32,16);
    stroke(ctx,'#bc8558',32,16,39,14);stroke(ctx,'#71523c',38,14,46,14);
    ctx.fillStyle='#c7834e';ctx.fillRect(26,18,2,1);ctx.fillRect(40,12,2,1);
  });
}

const spiritRows = [
  '.......ii........ii......','.....iillli....iilli.....','....ilmmlli...ilmmli.....',
  '....ilvmmli...imvli......','.....ilvvlillilvli.......','.....iilllmmllllii.......',
  '....imllfwwwwfflmmi......','....imlfwwwwwwwflmii.....','...immfwkiwwikwwfmmi.....',
  '....imfwkiwwikwwfmi......','....iimfwwffwwwfmii......','......ilmwwwwwmli........',
  '.....imvvllllvvmi........','....imvvvvlvvvvmmi.......','...immvvlfflvvavmi.......',
  '...imvvvlwwlvaabmi.......','..imvvvvvllvaabammi......','..immvvvvlvabbbmmi.......',
  '..immmvvmmvvaaavmmi......','.imvmvvvmmvvavvmmmi......','..iimvmmmmmvvmmmii.......',
  '....iimmiiimmiimi........','......imi...imi..........','.....iiff...iffi.........'
];
const beetleRows = [
  '.......i.....i.......','......ili...ili......','.......ili.ili.......','....iii.iimi.iii.....',
  '..ilfffikwwkifffli...','.ilfffmlwwwwlmfffli..','ilffmmlivvvvlimmffli.',
  'illmmliivllviilm mlli'.replaceAll(' ',''),'iillli.imllmi.illli..','.iiii..ivllvi..iii...',
  '.......iawwai........','......iawwwwai.......','......iawwwwai.......','.......iagga i.......'.replaceAll(' ',''),
  '........iagi.........','.........ii..........'
];
const spiritSheet=spiritRows.map(row=>row.padEnd(25,'.'));
const beetleSheet=beetleRows.map(row=>row.padEnd(23,'.'));

function spirit(art, item, firefly) {
  const colors=item.colors || [];
  return art.sprite(`wood-spirit-${item.id}-${firefly}`, firefly?beetleSheet:spiritSheet, {
    i:'#233f3e',k:'#203735',m:'#486959',v:item.hex,l:colors[1]||'#a7d9a4',
    f:'#dfdfad',w:'#fff4c8',a:firefly?'#edbf59':'#b98951',b:'#795b40',g:colors[2]||'#d79545'
  });
}

function drawActor(game, art, point, item) {
  const ctx=art.ctx;
  const player=game.player;
  const speed=Math.hypot(player.vx,player.vy);
  const fly=player.isFirefly;
  const bob=Math.sin(art.time*(speed>15?10:3))*1.5;
  const terrainShadow=art.stamp('wood-spirit-shadow',22,8,c=>oval(c,'rgba(29,51,43,.55)',11,4,10,3));
  ctx.drawImage(terrainShadow,point.x-18,point.y-4,36,11);
  if (speed>10) {
    for (let i=player.trail.length-1;i>1;i-=3) {
      const t=player.trail[i];
      if (t.alpha<=0) continue;
      const q=game.worldToIso(t.x,t.y);
      const size=2+Math.max(0,4-i*.18);
      ctx.globalAlpha=Math.max(0,t.alpha)*.52;
      ctx.fillStyle=i%2?item.hex:'#d6dba0';
      ctx.fillRect(q.x-size*.5,q.y-9-i*.19,size,Math.max(2,size*.65));
    }
    ctx.globalAlpha=1;
  }
  const figure=spirit(art,item,fly);
  const h=fly?38:43,w=h*figure.width/figure.height;
  ctx.save();ctx.translate(point.x,point.y+(fly?-6:0)+bob);
  if (Math.abs(player.vx-player.vy)>8 && player.vx<player.vy) ctx.scale(-1,1);
  ctx.drawImage(figure,-w*.46,-h,w,h);ctx.restore();
}

function guide(game, art, point) {
  let target=null;
  let best=Infinity;
  for (const well of game.springs) {
    if (well.restored) continue;
    const d=(well.x-game.player.x)**2+(well.y-game.player.y)**2;
    if (d<best) { best=d;target=well; }
  }
  if (!target || best<48*48) return;
  const aim=game.worldToIso(target.x,target.y);
  const angle=Math.atan2(aim.y-point.y,aim.x-point.x);
  const arrow=art.sprite('wood-guide', ['....d....','...dsd...','..dslsd..','.dslmlsd.','dslmmmlsd','dmmddd mmd'.replaceAll(' ',''),'dd.....dd'], {d:'#234a4a',s:'#66a69a',l:'#e3e7af',m:'#a9d9bd'});
  const ctx=art.ctx;
  ctx.save();ctx.translate(point.x+Math.cos(angle)*37,point.y-8+Math.sin(angle)*34);ctx.rotate(angle+Math.PI/2);
  ctx.drawImage(arrow,-8,-6,16,13);ctx.restore();
}

function sceneObjects(game) {
  const saved=scenery.get(game);
  if (saved && saved.trees===game.trees && saved.seeds===game.seeds && saved.springs===game.springs) return saved.sorted;
  const sorted=[];
  const add=(kind,objects)=>{
    for (const object of objects) sorted.push({kind,object,x:(object.x-object.y)*ISO_X,y:(object.x+object.y)*.5,variant:hash(Math.round(object.x),Math.round(object.y))%3});
  };
  add('tree',game.trees);add('seed',game.seeds);add('spring',game.springs);
  for (const x of [80,-908,594]) sorted.push({kind:'bridge',x,y:profile(stream,x)});
  for (const [x,y] of [[-119,42],[224,96],[-337,-115],[521,-39],[-571,161]]) sorted.push({kind:'log',x,y});
  sorted.sort((a,b)=>a.y-b.y);
  scenery.set(game,{trees:game.trees,seeds:game.seeds,springs:game.springs,sorted});
  return sorted;
}

export function* prepareWoodland(art) {
  const columns = Math.ceil(art.width / (2 * TILE_SPAN));
  const rows = Math.ceil(art.height / (2 * TILE_SPAN));
  for (let y = -rows; y < rows; y++) {
    for (let x = -columns; x < columns; x++) {
      groundTile(art, x, y);
      yield;
    }
  }
  for (let variant = 0; variant < 3; variant++) {
    fir(art, variant);
    birch(art, variant);
    burnScar(art, variant);
    yield;
  }
}

export function paintWoodland(game, art) {
  const {ctx,width,height}=art;
  const origin=game.worldToIso(0,0);
  const startX=Math.floor(-origin.x/TILE_SPAN), endX=Math.floor((width-origin.x)/TILE_SPAN);
  const startY=Math.floor(-origin.y/TILE_SPAN), endY=Math.floor((height-origin.y)/TILE_SPAN);
  // One aligned grid eliminates seams when the camera eases between pixels.
  const gridX=Math.round(origin.x/art.unit)*art.unit,gridY=Math.round(origin.y/art.unit)*art.unit;
  for (let ty=startY-1;ty<=endY+1;ty++) for (let tx=startX-1;tx<=endX+1;tx++) {
    const x=gridX+tx*TILE_SPAN,y=gridY+ty*TILE_SPAN;
    if(x>=width||y>=height||x+TILE_SPAN<=0||y+TILE_SPAN<=0)continue;
    ctx.drawImage(groundTile(art,tx,ty),x,y,TILE_SPAN+art.unit*.35,TILE_SPAN+art.unit*.35);
  }
  for(const anomaly of game.firmsAnomalies){
    const x=origin.x+(anomaly.x-anomaly.y)*ISO_X,y=origin.y+(anomaly.x+anomaly.y)*.5;
    const w=anomaly.radius*2.29,h=anomaly.radius*1.17;
    if(x+w/2<0||x-w/2>width||y+h/2<0||y-h/2>height)continue;
    ctx.drawImage(burnScar(art,hash(anomaly.x,anomaly.y)%3),x-w/2,y-h/2,w,h);
  }
  const list=sceneObjects(game);
  const point=game.worldToIso(game.player.x,game.player.y);
  const item=arcadeTokens.getEquippedItem('spiritGlow');
  const shadow=art.stamp('wood-tree-shadow',45,18,c=>{
    shape(c,'rgba(20,47,43,.36)',[[0,7],[8,4],[20,3],[31,7],[41,8],[39,10],[45,13],[34,13],[33,16],[20,13],[13,14],[6,11]]);
  });
  const visible = (obj,x,y) => x > -100 && x < width + 85 && y > -62 && y < height + (obj.kind==='tree'?125:65);
  for(const o of list){
    if(o.kind!=='tree')continue;
    const x=origin.x+o.x,y=origin.y+o.y;
    if(!visible(o,x,y))continue;
    const length=o.object.size*1.8;
    ctx.drawImage(shadow,x-10,y-length*.09,length,length*.35);
  }
  let actorDrawn=false;
  for (const o of list) {
    const x=origin.x+o.x,y=origin.y+o.y;
    if (!visible(o,x,y)) continue;
    if (!actorDrawn && y>point.y) { drawActor(game,art,point,item);actorDrawn=true; }
    if(o.kind==='tree'){
      const pine=o.object.type==='pine';
      const img=pine?fir(art,o.variant):birch(art,o.variant);
      const h=o.object.size*(pine?2.45:2.53)+o.variant*3;
      const w=h*img.width/img.height;
      if(y>point.y&&point.y-18>y-h&&Math.abs(x-point.x)<w*.40)ctx.globalAlpha=.48;
      ctx.drawImage(img,x-w*.48,y-h,w,h);ctx.globalAlpha=1;
    }else if(o.kind==='seed'){
      if(o.object.collected)continue;
      const img=seedSprite(art,o.object.isGolden);
      const bob=Math.sin(art.time*2.8+o.variant*1.8)*2;
      const h=o.object.isGolden?25:21;
      ctx.drawImage(img,x-h*.42,y-h-3+bob,h*.84,h);
      if(Math.sin(art.time*3.4+o.x)>.62){
        ctx.fillStyle=o.object.isGolden?'#fff0ab':'#dcf3bc';ctx.fillRect(x+h*.37,y-h-3+bob,3,3);
      }
    }else if(o.kind==='spring'){
      const well=o.object;
      ctx.drawImage(spring(art,well.restored),x-52,y-41,104,67);
      const step=Math.floor(art.time*3)%4;
      ctx.fillStyle=well.restored?'#c5e3c8':'#82a9a0';
      ctx.fillRect(x-22+step*3,y+1,8,2);ctx.fillRect(x+7-step*2,y+6,5,2);
      for(let n=0;n<well.seedsNeeded;n++){
        ctx.fillStyle=n<well.seedsDeposited?'#c3dea2':'#536d68';
        ctx.fillRect(x-23+n*14,y-21+(n===0||n===3?3:0),4,4);
      }
    }else if(o.kind==='bridge')ctx.drawImage(bridge(art),x-42,y-38,84,73);
    else ctx.drawImage(fallenLog(art),x-29,y-18,58,29);
  }
  if(!actorDrawn)drawActor(game,art,point,item);
  guide(game,art,point);
}
