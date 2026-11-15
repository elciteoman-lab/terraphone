// One line of game state. Keep the bottom right clear for health and stamina.
export function drawReadout(ctx, width, height, text, reservedWidth = 0) {
  const compact = width < 500 && reservedWidth > 0;
  const x = 16;
  const y = height - (compact ? 116 : 49);
  const available = Math.min(360, width - x * 2 - (compact ? 0 : reservedWidth));
  ctx.save();
  ctx.font = '500 13px system-ui, sans-serif';
  const boxWidth = Math.min(available, Math.ceil(ctx.measureText(text).width) + 24);
  ctx.fillStyle = 'rgba(14, 27, 26, .9)';
  ctx.beginPath();
  ctx.roundRect(x, y, boxWidth, 32, 9);
  ctx.fill();
  ctx.fillStyle = '#f0f1e7';
  ctx.textAlign = 'left';
  ctx.fillText(text, x + 12, y + 21, boxWidth - 24);
  ctx.restore();
}
