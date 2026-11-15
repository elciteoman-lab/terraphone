// Orthographic fallback for devices without WebGL. Only imported when MapLibre cannot start.
const radians = Math.PI / 180;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const wrap = (lng) => ((lng + 180) % 360 + 360) % 360 - 180;

export class CanvasGlobe extends EventTarget {
  constructor(container) {
    super();
    this.center = { lng: 0, lat: 18 };
    this.zoom = 2.15;
    this.frame = 0;
    this.canvas = document.createElement('canvas');
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('aria-label', 'Earth globe. Drag or use arrow keys to rotate, scroll to zoom, press Enter to listen.');
    this.context = this.canvas.getContext('2d');
    const disc = document.createElement('div');
    disc.className = 'atlas-disc';
    disc.append(this.canvas);
    container.className = 'atlas-map';
    container.replaceChildren(disc);
    this.bindControls();
    new ResizeObserver(() => this.scheduleDraw()).observe(disc);

    const image = new Image();
    image.onload = () => {
      const surface = document.createElement('canvas');
      surface.width = image.naturalWidth;
      surface.height = image.naturalHeight;
      const ctx = surface.getContext('2d');
      ctx.drawImage(image, 0, 0);
      this.texture = ctx.getImageData(0, 0, surface.width, surface.height);
      this.setRain(this.rain);
    };
    image.src = new URL('../img/earth-reference.webp', import.meta.url).href;
  }

  on(type, listener) { this.addEventListener(type, event => listener(event.detail)); }
  emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }
  getZoom() { return this.zoom; }
  getCenter() { return this.center; }

  setCenter([lng, lat]) {
    this.center = { lng: wrap(lng), lat: clamp(lat, -89.5, 89.5) };
    this.scheduleDraw();
  }

  setZoom(value) {
    this.zoom = clamp(value, 2.15, 7);
    this.emit('zoom');
    this.scheduleDraw();
  }

  flyTo({ center, zoom }) { this.setCenter(center); this.setZoom(zoom); }
  mark(lng, lat) { this.selection = { lng, lat }; this.scheduleDraw(); }

  // The NASA rain buffer uses the Mercator tile grid; the base image uses latitude/longitude.
  setRain(rain) {
    this.rain = rain;
    if (!this.texture) return;
    const { data, width, height } = this.texture;
    const pixels = new Uint8ClampedArray(data);
    if (rain) {
      for (let v = 0; v < height; v++) {
        const lat = clamp(90 - (v + .5) * 180 / height, -85.0511, 85.0511) * radians;
        const row = clamp(Math.floor((.5 - Math.asinh(Math.tan(lat)) / (2 * Math.PI)) * 512), 0, 511);
        for (let u = 0; u < width; u++) {
          const src = 4 * (row * 512 + Math.floor(u * 512 / width));
          const alpha = rain[src + 3] / 255 * .88;
          if (alpha === 0) continue;
          const dst = 4 * (v * width + u);
          for (let c = 0; c < 3; c++) pixels[dst + c] += (rain[src + c] - pixels[dst + c]) * alpha;
        }
      }
    }
    this.surface = new Uint32Array(pixels.buffer);
    this.scheduleDraw();
  }

  scheduleDraw() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => { this.frame = 0; this.draw(); });
  }

  get scale() { return 2 ** ((this.zoom - 2.15) / 1.8); }

  coordinates(x, y) {
    const z = Math.sqrt(1 - x * x - y * y);
    if (!Number.isFinite(z)) return null;
    const tilt = this.center.lat * radians;
    return {
      lng: wrap(this.center.lng + Math.atan2(x, z * Math.cos(tilt) - y * Math.sin(tilt)) / radians),
      lat: Math.asin(clamp(y * Math.cos(tilt) + z * Math.sin(tilt), -1, 1)) / radians
    };
  }

  // Reuse texture coordinates while rotating east/west (including Zen rotation).
  buildProjection(size) {
    const { width, height } = this.texture;
    const radius = size * this.scale / 2;
    const tilt = this.center.lat * radians;
    const cos = Math.cos(tilt), sin = Math.sin(tilt);
    this.rows = new Int32Array(size * size).fill(-1);
    this.cols = new Uint16Array(size * size);
    this.output = this.context.createImageData(size, size);
    this.outputPixels = new Uint32Array(this.output.data.buffer);
    for (let j = 0; j < size; j++) {
      const y = (size / 2 - j - .5) / radius;
      for (let i = 0; i < size; i++) {
        const x = (i + .5 - size / 2) / radius;
        const z2 = 1 - x * x - y * y;
        if (z2 < 0) continue;
        const z = Math.sqrt(z2), n = j * size + i;
        const lat = Math.asin(clamp(y * cos + z * sin, -1, 1));
        this.cols[n] = Math.floor(width * (.5 + Math.atan2(x, z * cos - y * sin) / (2 * Math.PI))) % width;
        this.rows[n] = clamp(Math.floor(height * (.5 - lat / Math.PI)), 0, height - 1) * width;
      }
    }
  }

  draw() {
    if (!this.surface) return;
    const size = Math.min(640, Math.round(this.canvas.clientWidth * (devicePixelRatio || 1)));
    if (!size) return;
    if (this.canvas.width !== size || this.canvas.height !== size) this.canvas.width = this.canvas.height = size;
    const key = [size, this.zoom, this.center.lat].join('/');
    if (this.projectionKey !== key) {
      this.buildProjection(size);
      this.projectionKey = key;
    }
    const width = this.texture.width;
    const shift = Math.round(this.center.lng / 360 * width) + width;
    for (let n = 0; n < this.rows.length; n++) {
      if (this.rows[n] >= 0) this.outputPixels[n] = this.surface[this.rows[n] + (this.cols[n] + shift) % width];
    }
    this.context.putImageData(this.output, 0, 0);
    if (!this.selection) return;
    const d = (this.selection.lng - this.center.lng) * radians;
    const lat = this.selection.lat * radians, tilt = this.center.lat * radians;
    if (Math.sin(lat)*Math.sin(tilt) + Math.cos(lat)*Math.cos(d)*Math.cos(tilt) <= 0) return;
    const r = size * this.scale / 2;
    const x = size / 2 + r * Math.cos(lat) * Math.sin(d);
    const y = size / 2 - r * (Math.sin(lat)*Math.cos(tilt) - Math.cos(lat)*Math.cos(d)*Math.sin(tilt));
    this.context.beginPath();
    this.context.arc(x, y, 4, 0, 2 * Math.PI);
    this.context.fillStyle = 'white';
    this.context.strokeStyle = '#17282a';
    this.context.fill();
    this.context.stroke();
  }

  bindControls() {
    const canvas = this.canvas;
    let drag = null;
    const position = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = 2 * (e.clientX - rect.left) / rect.width - 1;
      const y = 1 - 2 * (e.clientY - rect.top) / rect.height;
      if (x*x + y*y > 1) return null;
      const lngLat = this.coordinates(x / this.scale, y / this.scale);
      return { lngLat, point: { x: e.clientX, y: e.clientY } };
    };
    canvas.addEventListener('pointerdown', e => {
      if (drag || e.button !== 0 || !position(e)) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, ...this.center, moved: false };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (drag && e.pointerId === drag.id) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) < 4) return;
        if (!drag.moved) this.emit('dragstart');
        drag.moved = true;
        const speed = 125 / (canvas.clientWidth * this.scale);
        this.setCenter([drag.lng - dx * speed, drag.lat + dy * speed]);
      } else if (!drag) {
        const point = position(e);
        if (point) this.emit('mousemove', point);
      }
    });
    canvas.addEventListener('pointerup', e => {
      if (drag?.id !== e.pointerId) return;
      const point = position(e);
      if (!drag.moved && point) this.emit('click', point);
      drag = null;
    });
    canvas.addEventListener('lostpointercapture', () => { drag = null; });
    canvas.addEventListener('pointerleave', () => this.emit('mouseout'));
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      this.setZoom(this.zoom - Math.sign(e.deltaY) * .22);
    }, { passive: false });
    canvas.addEventListener('keydown', e => {
      const { lng, lat } = this.center;
      const step = 12 / this.scale;
      const moves = { ArrowLeft: [lng-step, lat], ArrowRight: [lng+step, lat], ArrowUp: [lng, lat+step], ArrowDown: [lng, lat-step] };
      if (moves[e.key]) this.setCenter(moves[e.key]);
      else if (e.key === '+' || e.key === '=') this.setZoom(this.zoom + .5);
      else if (e.key === '-') this.setZoom(this.zoom - .5);
      else if (e.key === 'Enter') this.emit('click', { lngLat: this.center });
      else return;
      e.preventDefault();
    });
  }
}
