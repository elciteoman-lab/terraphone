// Small drawing primitives for the hand-inked backgrounds and sprite sheets.
export function rect(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

export function polygon(ctx, color, coords) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(coords[0], coords[1]);
  for (let n = 2; n < coords.length; n += 2) ctx.lineTo(coords[n], coords[n + 1]);
  ctx.closePath();
  ctx.fill();
}

export function ellipse(ctx, color, x, y, rx, ry) {
  ctx.fillStyle = color;
  for (let row = -ry; row <= ry; row++) {
    const span = Math.round(rx * Math.sqrt(1 - (row / ry) ** 2));
    ctx.fillRect(Math.round(x) - span, Math.round(y) + row, span * 2 + 1, 1);
  }
}

export function noise(x, y) {
  let n = Math.imul(x + 137, 374761393) + Math.imul(y + 61, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

// Compact silhouettes keep equipped headwear recognizable at a few pixels high.
const headwear = {
  golden_crown: ['g.....g.....g','gg...ggg...gg','.gg.ggggg.gg.','.ggggggggggg.','..bgggrgggb..','..ddddddddd..'],
  cyber_halo: ['...ccccccc...','.cc.......cc.','cc.........cc','.cc.......cc.','...ccccccc...'],
  phoenix_crest: ['.......r.....','...o..rr...r.','..oorrrroo.r.','...roooorro..','....oyyyoo...','.....yyy.....'],
  celestial_diadem: ['......w......','..c..www..c..','.cc...w...cc.','..ccccwcccc..','....ccwcc....']
};
const jewels = {g:'#f5bd64',b:'#a8e5d5',d:'#975630',r:'#d65b47',o:'#ef8f52',y:'#f8d36c',w:'#fff4d5',c:'#8edcd8'};
export function wear(art, id, x, y, width) {
  const rows = headwear[id];
  if (!rows) return;
  const item = art.sprite('headwear-' + id, rows, jewels);
  art.ctx.drawImage(item, x - width / 2, y - width * item.height / item.width, width, width * item.height / item.width);
}
