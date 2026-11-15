import { arcadeTokens } from '../arcade-tokens.js';

const facadeColors = [
  ['#c97d62', '#af665b', '#e39b74', '#874f54', '#56716b'],
  ['#dda770', '#bd845e', '#f0be84', '#975f52', '#59716c'],
  ['#b86e5d', '#945461', '#d68c6c', '#774957', '#414e60'],
  ['#dfa17a', '#bc7e67', '#f3bf91', '#98665f', '#667c75'],
  ['#ce8664', '#a7695e', '#e9a576', '#805361', '#475d61']
];
const roofInk = '#584654';
const windowInk = '#443f50';
const stone = '#f1bd8a';
const frameInk = '#293642';
const paintSchemes = {
  cyan: ['#b3eddf', '#60c4cf', '#347ca1'],
  sunset_prism: ['#ffc56c', '#ec7c76', '#9768ae'],
  cyber_neon: ['#64e4e0', '#3fb6cc', '#dc67a6'],
  aurora_borealis: ['#a7efab', '#4abda8', '#7569b5'],
  carbon_matrix: ['#66c4c8', '#56606c', '#343746'],
  volcanic_magma: ['#ffbd70', '#db6352', '#874451'],
  golden_crown: ['#fff1a8', '#eac05f', '#ab743f'],
  quantum_singularity: ['#72dfde', '#a66bca', '#644c97']
};

function box(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function shape(ctx, color, points) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.closePath();
  ctx.fill();
}

function oval(ctx, color, x, y, rx, ry) {
  ctx.fillStyle = color;
  for (let row = -ry; row <= ry; row++) {
    const span = Math.round(rx * Math.sqrt(1 - (row / ry) ** 2));
    ctx.fillRect(Math.round(x - span), Math.round(y + row), span * 2 + 1, 1);
  }
}

// The foreground is a plan view so controls and collisions retain their exact positions.
// Beyond that point all five lanes, their markings, and their occupants share one projection.
function roadScale(y, h) {
  const depth = Math.max(0, Math.min(1, y / (h * 0.54)));
  return 0.23 + 0.77 * Math.sin(depth * Math.PI / 2);
}
function roadY(y, h) {
  const near = h * 0.54;
  return y < near ? h * 0.21 + y * (0.33 / 0.54) : y;
}
function roadX(x, y, w, h) {
  return w / 2 + (x - w / 2) * roadScale(y, h);
}

function shutters(c, x, y, width, height, style, colors) {
  const [wall, shade, light, brick, shutter] = colors;
  box(c, shade, x - 2, y - 2, width + 5, height + 5);
  box(c, light, x - 2, y - 2, width + 3, 2);
  box(c, windowInk, x, y, width, height);
  box(c, '#7e7775', x + 1, y + 1, width - 2, 2);
  box(c, '#646771', x + 1, y + 3, 2, height - 4);
  if (style === 1) {
    box(c, shutter, x - 2, y + 1, 3, height - 1);
    box(c, shutter, x + width - 1, y + 1, 3, height - 1);
    for (let sy = y + 3; sy < y + height - 1; sy += 3) {
      box(c, '#374953', x - 2, sy, 2, 1);
      box(c, '#374953', x + width, sy, 2, 1);
    }
  } else {
    box(c, style === 2 ? '#dca781' : brick, x + (width >> 1), y, 1, height);
    box(c, style === 2 ? '#dca781' : wall, x + 1, y + 4, width - 2, 1);
  }
  box(c, brick, x - 2, y + height + 1, width + 4, 2);
  box(c, light, x - 2, y + height, width + 4, 1);
}

function awning(c, x, y, width, cloth) {
  box(c, roofInk, x - 1, y + 2, width + 2, 6);
  for (let i = 0; i < width; i += 4) {
    const dark = (i / 4) % 2 === 1;
    const length = Math.min(4, width - i);
    box(c, dark ? cloth : '#efd1a0', x + i + 1, y, length, 3);
    box(c, dark ? cloth : '#efd1a0', x + i, y + 3, length, 2);
    box(c, dark ? '#775664' : '#c39579', x + i, y + 5, length, 2);
    box(c, dark ? '#775664' : '#c39579', x + i + 1, y + 7, Math.max(1, length - 2), 1);
  }
}

function facade(c, variant) {
  const colors = facadeColors[variant];
  const [wall, shade, light, brick, shutter] = colors;
  const top = [22, 22, 20, 27, 23][variant];
  box(c, roofInk, 2, top, 66, 82 - top);
  box(c, wall, 3, top + 2, 59, 77 - top);
  box(c, shade, 58, top + 1, 9, 81 - top);
  box(c, brick, 64, top + 12, 3, 67 - top);
  box(c, light, 4, top + 5, 2, 75 - top);
  box(c, shade, 2, 77, 64, 4);
  box(c, '#8d6a65', 0, 80, 70, 2);
  box(c, stone, 2, 79, 61, 1);

  // Small chips, uneven plaster and exposed brick at the corners.
  for (let i = 0; i < 25; i++) {
    const x = 5 + ((i * 29 + variant * 5) % 55);
    const y = top + 6 + ((i * 13) % (73 - top));
    box(c, i % 4 === 0 ? light : shade, x, y, 2 + i % 3, 1);
    if (i % 5 === 0) box(c, shade, x + 3, y + 1, 2, 1);
  }

  if (variant === 0 || variant === 2) {
    const tx = variant === 0 ? 45 : 13;
    box(c, roofInk, tx + 1, 6, 2, top - 4);
    box(c, roofInk, tx + 11, 6, 2, top - 4);
    shape(c, brick, [tx + 1, top, tx + 11, 12, tx + 13, 12, tx + 4, top]);
    box(c, roofInk, tx - 1, 6, 16, 9);
    box(c, '#ad785d', tx, 6, 12, 8);
    box(c, '#dcaa77', tx + 2, 6, 3, 8);
    box(c, '#7d5755', tx - 1, 8, 16, 1);
    box(c, '#7d5755', tx - 1, 13, 16, 1);
    shape(c, roofInk, [tx - 3, 6, tx + 4, 2, tx + 8, 2, tx + 17, 6]);
    box(c, '#e4a278', tx + 1, 4, 7, 1);
  } else if (variant === 3) {
    shape(c, roofInk, [1, top + 1, 12, 13, 52, 13, 69, top + 1]);
    shape(c, '#b86357', [5, top, 15, 15, 51, 15, 65, top]);
    for (let row = 0; row < 3; row++) {
      const inset = (2 - row) * 3;
      box(c, '#de8b65', 11 + inset, 18 + row * 3, 44 - inset * 2, 1);
      for (let x = 15 + inset + row % 2; x < 52 - inset; x += 6) box(c, '#874e54', x, 19 + row * 3, 1, 2);
    }
    box(c, brick, 48, 9, 5, 10);
    box(c, roofInk, 47, 8, 7, 2);
  } else if (variant === 4) {
    for (let i = 0; i < 3; i++) {
      const x = 4 + i * 19;
      shape(c, roofInk, [x, top + 1, x + 15, top - 9, x + 18, top - 9, x + 18, top + 1]);
      shape(c, '#74908a', [x + 5, top - 1, x + 15, top - 7, x + 15, top - 1]);
    }
  } else {
    box(c, '+', 0, 0, 0, 0);
    box(c, brick, 14, top - 8, 15, 8);
    box(c, '#d49a72', 15, top - 7, 11, 5);
    box(c, roofInk, 13, top - 9, 17, 2);
    box(c, roofInk, 47, top - 14, 1, 14);
    box(c, roofInk, 41, top - 12, 11, 1);
    box(c, roofInk, 44, top - 14, 6, 1);
  }
  box(c, roofInk, 0, top, 69, 4);
  box(c, light, 2, top, 63, 2);
  box(c, brick, 3, top + 4, 62, 2);
  const firstRow = top + 9;
  for (let i = 0; i < 3; i++) {
    shutters(c, 10 + i * 17, firstRow, 8, 9, (variant + i) % 3, colors);
    shutters(c, 10 + i * 17, firstRow + 17, 8, 9, variant === 4 ? 0 : 1, colors);
  }
  if (variant === 0 || variant === 2) {
    box(c, roofInk, 6, firstRow + 26, 49, 2);
    box(c, roofInk, 7, firstRow + 21, 47, 1);
    for (let x = 8; x < 54; x += 4) box(c, roofInk, x, firstRow + 22, 1, 4);
    box(c, light, 7, firstRow + 28, 44, 1);
  }
  if (variant === 4) {
    box(c, roofInk, 10, 61, 31, 17);
    box(c, '#6d7b78', 12, 63, 27, 14);
    for (let y = 64; y < 77; y += 3) box(c, '#495e64', 12, y, 27, 1);
    box(c, '#ebba75', 8, 61, 34, 2);
    box(c, shutter, 47, 64, 8, 14);
  } else {
    box(c, brick, 7, 62, 49, 17);
    box(c, windowInk, 9, 64, 30, 14);
    box(c, '#7f837b', 11, 67, 12, 8);
    box(c, '#d49c6e', 11, 71, 8, 2);
    box(c, '#a8a18a', 26, 67, 10, 7);
    box(c, '#4c5057', 26, 71, 10, 3);
    box(c, windowInk, 44, 63, 9, 16);
    box(c, shutter, 45, 65, 6, 10);
    box(c, stone, 50, 71, 1, 2);
    awning(c, 7, 58, variant === 2 ? 46 : 33, variant % 2 ? '#5f8980' : '#b76a62');
  }
  // Rain leader and wall brackets.
  box(c, brick, 62, top + 6, 2, 71 - top);
  box(c, light, 62, top + 8, 1, 64 - top);
  box(c, roofInk, 61, 49, 3, 1);
  box(c, roofInk, 61, 71, 3, 1);
}

const skyRows = ['#9497bc', '#b6a1b6', '#d1a8ae', '#e5ada5', '#efb39a', '#f5bd9c', '#f8c99e'];
const roadColors = ['#a19090', '#97858a', '#8d7b82', '#83737b', '#786a74', '#6f636e', '#665b68', '#605765', '#5c5361'];
function cityScene(art, geom) {
  const blocks = facadeColors.map((_, i) => art.stamp('avenue:facade:' + i, 71, 83, c => facade(c, i)));
  const key = 'avenue:city:' + art.pixelWidth + 'x' + art.pixelHeight + ':' + Math.round(geom.roadW);
  return art.stamp(key, art.pixelWidth, art.pixelHeight, (c, w, h) => {
    const horizon = Math.round(h * 0.21);
    const road = geom.roadW * w / art.width;
    const center = w / 2;
    box(c, '#b17c70', 0, 0, w, h);
    for (let i = 0; i < skyRows.length; i++) {
      const y = Math.round(horizon * i / skyRows.length);
      const bottom = Math.round(horizon * (i + 1) / skyRows.length);
      box(c, skyRows[i], 0, y, w, bottom - y);
      if (i > 0) for (let x = i * 3; x < w; x += 5) box(c, skyRows[i - 1], x, y, 2, 1);
    }
    const sunX = Math.round(w * 0.66);
    const sunY = Math.round(horizon * 0.63);
    const sunR = Math.max(4, Math.round(horizon * 0.24));
    oval(c, '#f8c99d', sunX, sunY, sunR + 2, sunR + 2);
    oval(c, '#ffdb9d', sunX, sunY, sunR, sunR);
    oval(c, '#ffe8ae', sunX - 1, sunY - 1, Math.max(2, sunR - 2), Math.max(2, sunR - 2));
    for (let i = 0; i < 11; i++) {
      const x = (i * 103 + 13) % w;
      const y = 2 + (i * 17 % Math.max(3, horizon - 5));
      box(c, i % 2 ? '#e3b2ad' : '#eed0bc', x, y, 5 + i % 4 * 4, 1);
      if (i % 3 === 0) box(c, '#f1c4b0', x + 6, y + 2, 6, 1);
    }
    for (let x = 0; x < w; x++) {
      const hills = Math.floor(3 + 2.4 * Math.sin(x * 0.050) + 1.4 * Math.sin(x * 0.12));
      box(c, '#c296a0', x, horizon - 4 - hills, 1, hills + 7);
    }

    for (let i = -1, x = -7; x < w + 3; i++) {
      const width = 6 + ((i + 15) * 7 % 12);
      const height = 3 + ((i + 15) * 11 % 8);
      box(c, '#aa858b', x, horizon - height, width, height + 2);
      box(c, '#c7928a', x + 1, horizon - height + 1, width - 3, height - 1);
      if (i % 3 === 0) box(c, '#a17e88', x + 3, horizon - height - 3, 2, 4);
      for (let wx = x + 2; wx < x + width - 1; wx += 4) box(c, '#9b7780', wx, horizon - height + 3, 2, 2);
      x += width + 2;
    }
    const bellX = Math.round(center - road * 0.11);
    const bellH = Math.max(7, Math.round(h * 0.060));
    const bellW = Math.max(4, Math.round(bellH * 0.40));
    box(c, '#9f747b', bellX, horizon - bellH, bellW, bellH);
    box(c, '#d29580', bellX + 1, horizon - bellH + 1, bellW - 2, bellH - 1);
    box(c, '#966d75', bellX + 2, horizon - bellH + 3, 1, 3);
    box(c, '#9c737b', bellX - 1, horizon - bellH, bellW + 2, 2);
    shape(c, '#92727e', [bellX - 1, horizon - bellH, bellX + bellW / 2, horizon - bellH - 4, bellX + bellW + 1, horizon - bellH]);

    const depths = [0.018, 0.088, 0.185, 0.32, 0.49, 0.67, 0.89, 1.12];
    const baseW = Math.max(41, Math.min(104, h * 0.33));
    for (let row = 0; row < depths.length; row++) {
      const wy = depths[row] * h;
      const s = roadScale(wy, h);
      const py = roadY(wy, h);
      for (let side = -1; side <= 1; side += 2) {
        const edge = center + side * (road / 2 + baseW * (0.13 + (row % 3) * 0.035)) * s;
        const blockW = Math.max(10, Math.round(baseW * s * (side === -1 ? 1 : 0.92)));
        const count = Math.ceil((w / 2 - Math.abs(edge - center)) / blockW) + 1;
        for (let j = count - 1; j >= 0; j--) {
          const variant = (row * 3 + j * 2 + (side === 1 ? 1 : 0)) % blocks.length;
          const x = side === -1 ? edge - (j + 1) * blockW : edge + j * blockW;
          const bh = Math.round(blockW * (0.90 + variant * 0.08));
          const foot = Math.round(py - (j % 3) * 2 * s);
          box(c, '#936c6a', x, foot - 1, blockW, 5 * s + 1);
          box(c, '#c99679', x + 1, foot + 1, blockW - 2, 2 * s + 1);
          c.drawImage(blocks[variant], Math.round(x), foot - bh, blockW, bh);
        }
      }
    }
    // Stone sidewalk, narrow gutters, and warm grey macadam at the foot of the facades.
    const curbWidth = Math.max(1.2, 7 * w / art.width);
    for (let y = horizon; y < h; y++) {
      const wy = y < h * 0.54 ? (y - h * 0.21) * (0.54 / 0.33) : y;
      const s = roadScale(wy, h);
      const left = Math.round(center - road * s / 2);
      const right = Math.round(center + road * s / 2);
      const walk = Math.max(2, Math.round(baseW * 0.15 * s));
      const curb = Math.max(1, Math.round(curbWidth * s));
      box(c, '#936e6b', left - walk - 2, y, right - left + 2 * walk + 4, 1);
      box(c, '#cc9c7d', left - walk, y, right - left + 2 * walk, 1);
      box(c, '#e9bd91', left - curb - 1, y, right - left + 2 * curb + 2, 1);
      box(c, '#554d5c', left, y, right - left, 1);
      const tone = Math.min(8, Math.floor(Math.max(0, wy / h) * 12));
      box(c, roadColors[tone], left + curb, y, right - left - 2 * curb, 1);
    }
    for (let i = 0; i < Math.floor(w * h / 90); i++) {
      const y = horizon + (i * 263 % Math.max(1, h - horizon));
      const wy = y < h * 0.54 ? (y - h * 0.21) * (0.54 / 0.33) : y;
      const sw = road * roadScale(wy, h);
      const x = (i * 197 + Math.floor(i / 13) * 21) % w;
      if (x <= center - sw / 2 + 4 || x >= center + sw / 2 - 5) continue;
      c.globalAlpha = i % 4 ? 0.16 : 0.22;
      box(c, i % 3 ? '#c8a494' : '#373641', x, y, i % 13 === 0 ? 3 : 1, 1);
    }
    c.globalAlpha = 1;
  });
}

function streetLamp(c) {
  box(c, '#55515d', 4, 8, 2, 23);
  box(c, '#aa8670', 4, 9, 1, 21);
  box(c, '#484655', 3, 29, 4, 4);
  box(c, '#cd9f77', 2, 32, 6, 1);
  box(c, '#4d4958', 2, 4, 7, 5);
  box(c, '#e7ae73', 3, 4, 5, 4);
  box(c, '#ffe1a3', 4, 4, 3, 3);
  box(c, '#57505a', 1, 3, 9, 2);
  box(c, '#655364', 3, 1, 5, 2);
  box(c, '#655364', 5, 0, 1, 1);
  box(c, '#755c62', 3, 9, 5, 1);
}

function markings(game, art, geom) {
  const {ctx: c, width: w, height: h} = art;
  const offset = game.player.distance * 14;
  const geometry = (x, y) => roadX(x, y, w, h);
  function stripe(x, y, width, length, color) {
    const y2 = Math.min(h + 1, y + length);
    const from = Math.max(0, y);
    if (y2 <= from) return;
    shape(c, color, [geometry(x, from), roadY(from, h), geometry(x + width, from), roadY(from, h),
      geometry(x + width, y2), roadY(y2, h), geometry(x, y2), roadY(y2, h)]);
  }
  for (let y = offset % 83 - 83; y < h; y += 83) {
    for (let i = 1; i < game.numLanes; i++) {
      const x = geom.roadLeft + i * geom.laneW - 1.5;
      stripe(x, y, 3.2, 28, '#baa897');
      stripe(x + 0.6, y, 2, 5, '#d0bb9d');
    }
  }
  for (let y = offset % 62 - 62; y < h; y += 62) {
    stripe(geom.roadLeft - 4.5, y, 4.5, 27, '#af7162');
    stripe(geom.roadLeft + geom.roadW, y, 4.5, 27, '#af7162');
  }
  const lamp = art.stamp('avenue:lamp', 11, 34, streetLamp);
  for (let side = -1; side <= 1; side += 2) {
    const sideOffset = side < 0 ? 42 : 238;
    for (let y = (offset + sideOffset) % 477; y < h + 85; y += 477) {
      const s = roadScale(y, h);
      const x = geometry(w / 2 + side * (geom.roadW / 2 + 21), y);
      const oy = roadY(y, h);
      c.drawImage(lamp, Math.round(x - 7 * s), Math.round(oy - 55 * s), 16 * s, 56 * s);
    }
  }
}

function leafCluster(c) {
  const outline = '#355750';
  shape(c, outline, [0,7, 3,7, 3,3, 7,3, 7,1, 14,1, 15,3, 20,3, 20,6, 24,7, 24,14, 22,16, 17,16, 16,19, 10,19, 8,16, 3,16, 3,14, 0,13]);
  shape(c, '#548067', [1,7, 5,6, 5,3, 12,2, 15,5, 18,4, 21,7, 22,12, 17,12, 16,15, 11,15, 7,12, 3,13]);
  for (const [x,y] of [[3,8],[8,5],[12,4],[16,7],[7,10],[17,11],[12,13]]) {
    box(c, '#82a773', x, y, 4, 2);
    box(c, '#acc58a', x + 1, y - 1, 2, 1);
  }
  box(c, '#627759', 4, 15, 4, 2);
  box(c, '#627759', 17, 14, 4, 2);
}

function shadeZones(game, art, geom) {
  const {ctx: c, width: w, height: h} = art;
  const leaf = art.stamp('avenue:plane-tree', 25, 20, leafCluster);
  for (const canopy of game.canopies) {
    if (canopy.y > h || canopy.y + canopy.h < 0) continue;
    const center = geom.getLaneX(canopy.lane);
    const left = center - geom.laneW * 0.49;
    const right = center + geom.laneW * 0.49;
    const end = Math.min(h + 1, canopy.y + canopy.h);
    for (let y = Math.max(0, canopy.y); y < end; y += 18) {
      const next = Math.min(end, y + 18);
      shape(c, 'rgba(59, 115, 100, 0.56)', [roadX(left,y,w,h),roadY(y,h),roadX(right,y,w,h),roadY(y,h),
        roadX(right,next,w,h),roadY(next,h) + 1,roadX(left,next,w,h),roadY(next,h) + 1]);
    }
    for (let n = 0; n < Math.ceil(canopy.h / 48); n++) {
      const y = canopy.y + n * 48 + 12;
      if (y < 0 || y > h + 20) continue;
      const scale = roadScale(y,h);
      const size = Math.min(35, geom.laneW * 0.29) * scale;
      for (let side = -1; side <= 1; side += 2) {
        const x = roadX(center + side * geom.laneW * 0.38, y, w, h);
        const py = roadY(y,h) + (n % 2 ? side * 3 : 0);
        c.drawImage(leaf, x - size / 2, py - size * 0.45, size, size * 0.76);
      }
    }
  }
}

function taxi(c, light) {
  shape(c, '#493e51', [1,12, 3,12, 3,6, 7,3, 15,2, 17,0, 29,0, 31,2, 38,2, 43,6, 43,12, 46,12, 46,17, 44,18, 44,30, 42,32, 41,34, 34,34, 33,32, 12,32, 11,34, 5,34, 4,31, 3,28, 3,18, 1,17]);
  box(c, '#b86f42', 5, 6, 37, 23);
  box(c, '#edab53', 8, 4, 31, 24);
  box(c, '#f6c46a', 10, 3, 26, 4);
  box(c, '#83514c', 17, 1, 13, 3);
  box(c, '#ffe7a5', 18, 1, 11, 2);
  for (let x = 19; x < 28; x += 3) box(c, '#966248', x, 2, 1, 1);
  shape(c, '#48505e', [7,8, 10,6, 36,6, 40,9, 40,17, 6,17]);
  shape(c, '#72929a', [8,9, 11,7, 35,7, 38,10, 38,14, 8,14]);
  shape(c, '#b7c3ad', [10,8, 18,8, 11,12, 9,12]);
  box(c, '#465361', 22, 7, 2, 10);
  box(c, '#515360', 28, 10, 5, 5);
  box(c, '#d0a080', 29, 11, 3, 2);
  box(c, '#394351', 26, 14, 10, 2);
  box(c, '#b2b6a4', 8, 15, 12, 1);
  box(c, '#f5c86e', 5, 18, 36, 4);
  box(c, '#d58749', 5, 22, 36, 5);
  box(c, '#ffe192', 8, 18, 27, 1);
  for (let x = 6; x < 42; x += 4) {
    box(c, '#7d6558', x, 21, 2, 1);
    box(c, '#7d6558', x + 2, 22, 2, 1);
  }
  box(c, '#634e51', 14, 25, 18, 4);
  box(c, '#b9a78d', 16, 26, 14, 1);
  box(c, '#e0b991', 5, 29, 37, 2);
  box(c, '#fff0b4', 6, 24, 6, 3);
  box(c, '#fff0b4', 34, 24, 6, 3);
  box(c, light ? '#ef935a' : '#aa6654', 5, 26, 3, 2);
  box(c, light ? '#ef935a' : '#aa6654', 38, 26, 3, 2);
  box(c, '#f4d190', 19, 29, 9, 2);
  box(c, '#6d625d', 21, 30, 5, 1);
}

function rift(c, frame) {
  shape(c, '#a77b72', [0,8, 8,4, 14,4, 18,1, 21,2, 21,4, 28,7, 33,5, 37,7, 44,3, 42,9, 36,11, 31,11, 26,15, 21,12, 18,9, 12,9, 6,12, 2,12]);
  shape(c, '#342d40', [0,9, 7,5, 12,6, 17,2, 22,5, 23,8, 28,8, 31,6, 37,8, 44,4, 42,8, 36,10, 32,10, 28,14, 24,15, 20,10, 15,9, 11,10, 6,12, 2,11]);
  shape(c, '#bb554a', [2,9, 9,6, 14,7, 18,4, 22,7, 23,10, 27,11, 31,7, 36,9, 41,7, 36,10, 32,9, 28,13, 24,14, 20,9, 15,8, 11,9, 6,11]);
  shape(c, frame ? '#f6995d' : '#ed8955', [4,9, 9,7, 14,8, 18,5, 21,7, 23,10, 26,12, 31,8, 34,9, 31,9, 27,13, 24,13, 20,8, 18,6, 15,9, 10,8]);
  shape(c, '#484051', [6,6, 5,3, 7,3, 8,5, 10,6]);
  shape(c, '#463b4b', [19,10, 18,14, 13,17, 16,13, 17,10]);
  box(c, '#ffd17a', frame ? 9 : 18, frame ? 7 : 5, 3, 1);
  box(c, '#ffd17a', 25, 12, frame ? 2 : 1, 1);
  box(c, '#a7867c', 1, 13, 4, 1);
  box(c, '#9a7d76', 33, 3, 3, 1);
}

function arch(c, mist, frame) {
  const dark = mist ? '#325562' : '#5b4852';
  const mid = mist ? '#538f92' : '#9c675a';
  const high = mist ? '#a6d6be' : '#e0aa77';
  for (const x of [2, 39]) {
    box(c, dark, x, 6, 4, 14);
    box(c, mid, x + 1, 8, 2, 11);
    box(c, high, x, 9, 1, 6);
    box(c, dark, x - 1, 17, 6, 3);
    box(c, '#a69b87', x, 17, 4, 1);
  }
  box(c, dark, 1, 4, 43, 5);
  box(c, mid, 3, 3, 39, 4);
  box(c, high, 3, 3, 38, 2);
  for (const x of [4, 11, 31, 38]) {
    box(c, dark, x, 2, 2, 8);
    box(c, high, x, 3, 1, 4);
  }
  if (mist) {
    for (let i = 0; i < 6; i++) {
      const x = 8 + i * 5;
      const y = 9 + (i * 3 + frame * 2) % 6;
      box(c, (i + frame) % 2 ? '#a4d6c9' : '#79b5b3', x, y, 1, 2);
      if (i % 2 === 0) box(c, '#6eada8', x + 1, y + 4, 1, 2);
    }
    box(c, dark, 18, 2, 9, 7);
    box(c, '#dcf0d7', 22, 3, 1, 2);
    box(c, '#92e4d6', 20, 5, 5, 2);
    box(c, '#68b7bb', 21, 7, 3, 1);
  } else {
    for (let i = 5; i < 38; i += 6) {
      box(c, '#dca667', i, 6, 4, 2);
      box(c, '#705753', i + 1, 6, 2, 2);
    }
    box(c, dark, 18, 2, 10, 8);
    box(c, '#eec071', 20, 4, 2, 2);
    box(c, '#eec071', 24, 4, 2, 2);
    box(c, '#eec071', 22, 6, 2, 2);
    box(c, '#d8b99e', frame ? 8 : 10, 0, 4, 1);
    box(c, '#ead2af', frame ? 10 : 8, 1, 3, 1);
    box(c, '#d8b99e', frame ? 32 : 34, 0, 3, 2);
  }
}

const water = ['....O....','....OA...','...OWA...','...OWAA..','..OWWAA..','.OWWAACO.','OWWAACCCO','OWWACCCCO','OAACCCBBO','OACCCBBBO','.OCBBBBO.','..OOOOO..'];
const waterPalette = {O:'#314d63',A:'#67cfd1',W:'#e9f6d7',C:'#42adca',B:'#437ba4'};
const ice = ['......O......','.....OWO.....','..O..OWAO....','..OWOOWAO..O.','..OAWOWAAOOWO','.OOAWOWACOWAO','OAWOCWACOWACO','OAACCAACCACCO','.OACCACCACCO.','..OACCBCCCO..','...OBBBCBO...','....OOBBO....','......OO.....'];

function equipmentBadge(c, id) {
  if (id === 'cyber_halo') {
    box(c, '#508898', 2, 3, 11, 4);
    box(c, '#9cf3e0', 3, 2, 9, 1);
    box(c, '#9cf3e0', 1, 3, 3, 2);
    box(c, '#9cf3e0', 11, 3, 3, 2);
    box(c, '#6ed0d7', 3, 5, 9, 1);
    c.clearRect(4, 3, 7, 2);
  } else if (id === 'phoenix_crest') {
    shape(c, '#9d5453', [2,8, 3,4, 5,5, 7,0, 8,4, 11,2, 12,7, 9,10, 5,10]);
    shape(c, '#f49a5e', [4,8, 5,4, 6,6, 8,2, 9,6, 11,5, 9,9]);
    box(c, '#ffdb87', 6, 6, 2, 3);
  } else if (id === 'celestial_diadem') {
    shape(c, '#70869c', [1,5, 5,6, 7,1, 9,6, 13,5, 12,9, 3,9]);
    box(c, '#eaf5dc', 3, 6, 9, 2);
    box(c, '#96d2dd', 6, 3, 3, 5);
    box(c, '#ffffff', 7, 2, 1, 3);
  } else if (id === 'golden_crown') {
    shape(c, '#936149', [1,2, 4,4, 5,6, 7,1, 8,1, 10,6, 13,3, 14,3, 12,10, 3,10]);
    shape(c, '#ecc05f', [2,3, 5,7, 7,2, 8,2, 10,7, 13,4, 12,8, 3,8]);
    box(c, '#ffe5a1', 3, 7, 9, 1);
    box(c, '#bd615f', 7, 7, 2, 2);
    box(c, '#67b4a4', 4, 8, 1, 1);
  }
}

function rider(c, paint, pose, frame) {
  const [shine, body, shadow] = paintSchemes[paint] || paintSchemes.cyan;
  const slide = pose === 'slide';
  const jump = pose === 'jump';
  const headX = slide ? 15 : 13;
  const headY = slide ? 11 : 2;
  const seat = slide ? 22 : 19;
  // Wheels, rear fender, steel stem and deck.
  box(c, frameInk, 12, 5 + (slide ? 6 : 0), 5, 28 - (slide ? 6 : 0));
  box(c, '#70747a', 13, 7, 2, 23);
  box(c, frameInk, 11, 27, 7, 8);
  box(c, '#5b616f', 13, 31, 3, 4);
  box(c, '#a1a5a1', 12, 32 + frame, 1, 1);
  box(c, shadow, 10, 25, 9, 7);
  box(c, body, 11, 24, 7, 5);
  box(c, shine, 11, 25, 2, 4);
  box(c, '#df7767', 12, 30, 5, 2);
  box(c, '#f8cb88', 13, 30, 2, 1);
  // Distinct handlebar, elbows, riding boots and trousers.
  box(c, frameInk, 3, slide ? 17 : 10, 23, 2);
  box(c, '#8fa3a1', 7, slide ? 17 : 10, 14, 1);
  const ly = slide ? 23 : 24;
  shape(c, '#2f3a49', [8,seat, 21,seat, 22,ly, jump ? 24 : 20,ly+3, 18,ly+4, 15,ly, 13,ly, 11,ly+4, 6,ly+3]);
  box(c, '#586478', jump ? 5 : 8, ly, 4, 3);
  box(c, '#364654', slide ? 3 : 7, ly + 3, 6, 3);
  box(c, '#d8b69a', slide ? 2 : 6, ly + 5, 6, 1);
  box(c, '#374454', jump ? 20 : 16, ly + 2, 6, 3);
  box(c, '#e1bb93', jump ? 20 : 16, ly + 4, 6, 1);
  const shoulder = slide ? 16 : 10;
  shape(c, frameInk, [8,shoulder+1, 12,shoulder-1, 18,shoulder, 22,shoulder+2, 24,shoulder+6, 21,shoulder+8, 18,shoulder+6, 18,seat+3, 9,seat+3, 8,shoulder+6, 5,shoulder+7, 3,shoulder+4]);
  box(c, '#b75c50', 8, shoulder + 2, 13, Math.max(5,seat-shoulder));
  box(c, '#e3865d', 7, shoulder + 2, 4, 5);
  box(c, '#f3ad70', 5, shoulder + 3, 4, 2);
  box(c, '#e4ac87', 3, shoulder + 2, 3, 2);
  box(c, '#ae6658', 20, shoulder + 3, 4, 3);
  box(c, '#f1bf91', 23, shoulder + 2, 3, 2);
  box(c, '#79565a', 10, shoulder + 3, 8, slide ? 4 : 9);
  box(c, '#e9b47a', 11, shoulder + 4, 6, slide ? 2 : 6);
  box(c, '#f5d191', 12, shoulder + 4, 4, 2);
  if (!slide) box(c, '#ab715f', 11, shoulder + 8, 6, 1);
  // The scarf changes silhouette from one animation cel to the next.
  shape(c, '#a14e51', [9,headY+7, 12,headY+10, 8,headY+12, 4,headY+12+frame, 2,headY+14-frame, 2,headY+11, 7,headY+9]);
  box(c, '#eb885e', 5, headY + 10 + frame, 4, 1);
  const x = headX - 5, y = headY;
  box(c, frameInk, x + 3, y - 1, 6, 1);
  box(c, frameInk, x + 1, y, 10, 2);
  box(c, frameInk, x, y + 2, 12, 6);
  box(c, frameInk, x + 2, y + 8, 8, 2);
  box(c, shadow, x + 1, y + 3, 10, 5);
  box(c, body, x + 2, y + 1, 8, 5);
  box(c, shine, x + 3, y + 1, 5, 2);
  box(c, shine, x + 2, y + 3, 2, 2);
  box(c, '#eaeac5', x + 4, y + 3, 2, 1);
  box(c, '#e2aa81', x + 9, y + 6, 2, 2);
  box(c, '#435263', x + 2, y + 7, 7, 1);
  if (paint === 'carbon_matrix' || paint === 'volcanic_magma') {
    box(c, shine, x + 6, y + 3, 2, 2);
    box(c, shine, x + 8, y + 4, 2, 1);
  }
}

function objects(game, art, geom) {
  const {ctx: c, width: w, height: h} = art;
  const frame = Math.floor(art.time * 5) % 2;
  for (const item of game.obstacles) {
    if (item.y > h + 3 || item.y + item.h < 0) continue;
    const middle = item.y + item.h / 2;
    const x = roadX(geom.getLaneX(item.lane), middle, w, h);
    const sw = item.w * roadScale(middle,h);
    const top = roadY(item.y,h);
    const sh = roadY(item.y + item.h,h) - top;
    let sprite;
    if (item.type === 'van') sprite = art.stamp('avenue:taxi:' + frame, 47, 35, p => taxi(p, frame));
    else if (item.type === 'thermal_rift') sprite = art.stamp('avenue:rift:' + frame, 45, 18, p => rift(p, frame));
    else {
      const mist = item.type === 'mist_arch';
      sprite = art.stamp('avenue:' + item.type + ':' + frame, 45, 21, p => arch(p, mist, frame));
    }
    if (item.collected) c.globalAlpha = 0.68;
    c.drawImage(sprite, Math.round(x - sw / 2), Math.round(top), sw, sh);
    c.globalAlpha = 1;
  }
  for (const item of game.pickups) {
    if (item.collected || item.y < 0 || item.y > h + 15) continue;
    const sx = roadX(item.x ?? geom.getLaneX(item.lane), item.y, w, h);
    const sy = roadY(item.y,h);
    const s = roadScale(item.y,h);
    const frozen = item.type === 'cryo';
    const sprite = art.sprite(frozen ? 'avenue:ice' : 'avenue:water', frozen ? ice : water, waterPalette);
    const sw = s * (frozen ? 26 : 18);
    const sh = s * (frozen ? 28 : 23);
    const bob = Math.sin(art.time * 4 + item.lane) * 1.6 * s;
    if (item.inAir) {
      box(c, '#615864', sx - 6*s, sy + 13*s, 13*s, 2*s);
      box(c, '#e7dfb7', sx - 13*s, sy + 2*s, 3*s, 2*s);
    }
    c.drawImage(sprite, Math.round(sx - sw / 2), Math.round(sy - sh / 2 + bob), sw, sh);
    if (frozen && frame) {
      box(c, '#ebf8dc', sx + sw * 0.43, sy - sh * 0.41, 5*s, 2*s);
      box(c, '#ebf8dc', sx + sw * 0.47, sy - sh * 0.49, 2*s, 6*s);
    }
  }
}

function drawRider(game, art) {
  const {ctx: c, width: w, height: h} = art;
  const p = game.player;
  const y = p.y + p.jumpY;
  const x = roadX(p.x, y, w, h);
  const sy = roadY(y, h);
  const shadowScale = Math.max(0.40, 1 + p.jumpY * 0.0038);
  const shadow = art.stamp('avenue:rider-shadow', 25, 8, a => {
    oval(a, 'rgba(45,40,52,.38)',12,4,12,3);
    oval(a, 'rgba(43,36,47,.35)',12,4,8,2);
  });
  c.drawImage(shadow, p.x - 22*shadowScale, p.y + 15, 44*shadowScale, 11*shadowScale);
  const equipped = arcadeTokens.getEquippedItem('carPaint')?.id || 'cyan';
  let crown = arcadeTokens.getEquippedItem('crown')?.id || 'none';
  if (equipped === 'golden_crown') crown = 'golden_crown';
  const paint = crown === 'golden_crown' ? 'golden_crown' : equipped;
  const pose = p.isSliding ? 'slide' : p.isJumping ? 'jump' : 'ride';
  const frame = Math.floor(art.time * 8) % 2;
  const sprite = art.stamp('avenue:rider:' + paint + ':' + pose + ':' + frame, 29, 36,
    a => rider(a, paint, pose, frame));
  if (p.cryoTimer > 0) {
    const shell = art.stamp('avenue:cryo:' + frame, 36, 44, a => {
      shape(a, 'rgba(113,198,213,.18)', [12,1,24,1,32,9,35,21,32,34,26,40,10,40,3,32,1,19,5,8]);
      shape(a, '#9de3de', [3,13,7,5,13,2,16,2,10,5,6,10,4,16]);
      shape(a, '#63bac8', [34,18,35,24,32,33,26,39,24,39,30,32,33,23]);
      box(a, '#e8f6da', frame ? 28 : 4, frame ? 5 : 28, 2, 5);
      box(a, '#e8f6da', frame ? 27 : 3, frame ? 7 : 30, 4, 1);
    });
    c.drawImage(shell,x-33,sy-39,66,83);
    for (let i = 0; i < 3; i++) {
      const dy = (art.time * 58 + i * 14) % 42;
      box(c, i % 2 ? '#78cbd1' : '#c0e6d4', x - 5 + i * 4, sy + 27 + dy, 2, 7 - dy / 9);
    }
  }
  c.save();
  c.translate(Math.round(x), Math.round(sy));
  c.rotate(p.tilt || 0);
  if (p.invulnerableTimer > 0 && Math.floor(p.invulnerableTimer * 12) % 2 === 0) c.globalAlpha = 0.55;
  c.drawImage(sprite, -24, -31, 48, 58);
  if (crown !== 'none') {
    const badge = art.stamp('avenue:headwear:' + crown, 15, 11, a => equipmentBadge(a,crown));
    c.drawImage(badge, p.isSliding ? -10 : -13, p.isSliding ? -24 : -39, 24, 17);
  }
  c.restore();
}

const particleColors = {'#ef4444':'#ed8b73', '#f97316':'#dca778', '#38bdf8':'#9ad8d5', '#06b6d4':'#a3e0d6'};
export function paintAvenue(game, art) {
  const {ctx: c, width: w, height: h} = art;
  const geom = game.getRoadGeometry();
  c.drawImage(cityScene(art,geom),0,0,w,h);
  c.save();
  c.beginPath();
  c.rect(0, Math.round(h * 0.21), w, h);
  c.clip();
  markings(game,art,geom);
  shadeZones(game,art,geom);
  objects(game,art,geom);
  for (const p of game.particles) {
    if (p.y < 0 || p.y > h) continue;
    c.globalAlpha = Math.min(1, Math.max(0, p.life / p.maxLife));
    const size = Math.max(2, p.size * 1.2);
    box(c, particleColors[p.color] || p.color, roadX(p.x,p.y,w,h) - size/2, roadY(p.y,h) - size/2, size,size);
  }
  c.globalAlpha = 1;
  drawRider(game,art);
  c.restore();
}
