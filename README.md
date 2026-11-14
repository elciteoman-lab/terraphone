# raIn.tensity 🌧️🌍

> **NASA Space Apps Challenge** · Live Rain Sound Simulator on a 3D Bumpy Globe  
> Powered by **NASA Scientific Visualization Studio (SVS) Entry 5650** & **NASA GPM IMERG**  
> 🔗 **Live Demo**: [https://vylt-gh.github.io/raIn.tensity/](https://vylt-gh.github.io/raIn.tensity/)

`raIn.tensity` is an ambient global rain sound simulator designed with a sleek, minimalist, out-of-your-way UI inspired by **slowroads.io**. Explore the Earth as a tactile 3D bumpy globe, discover near-real-time global storm systems, and listen to authentic procedural rain acoustics that dynamically evolve as you zoom from orbital altitudes down to ground level.

---

## ✨ Features

- 🌍 **Tactile 3D Bumpy Globe & Elevation Colormap**:
  - Rendered with **MapLibre GL JS v5** using true spherical globe projection.
  - Symmetrically centered camera (`pitch: 0`, `center: [0, 15]`) for wobble-free, buttery-smooth orbital rotation.
  - **Height-Based Color Changes**: Styled with **Esri World Physical Topography**, featuring a full hypsometric elevation colormap:
    - 🌊 Ocean depths: Bathymetric azure to navy
    - 🌿 Lowlands (0–300m): Lush verdant green
    - 🌾 Foothills & Plateaus (300–1200m): Warm golden ochre & amber
    - ⛰️ High Cordilleras (1200–3500m): Terracotta, sienna, and rust
    - 🏔️ Alpine Summits (3500m+): Glacial snow-capped white peaks
  - Calibrated 3D DEM relief displacement (**2.6x** default, with `1.2x`, `2.6x`, and `4.0x` presets) + hillshade lighting.

- 🛰️ **NASA SVS 5650 & Smooth Bilinear Data Interpolation**:
  - Live data from **NASA Scientific Visualization Studio (SVS) 5650**: *"Near Real-Time Global Precipitation from the Global Precipitation Measurement Constellation"*.
  - Pulls live 30-minute calibrated precipitation rates (mm/hr) from NASA GIBS WMS (`IMERG_Precipitation_Rate_30min`).
  - **Bilinear Data Interpolation**: Real-time 4-point bilinear interpolation across sub-pixel coordinates eliminates blockiness, giving smooth, continuous, analog weather contour sampling.
  - **GPU Bilinear Texture Filtering**: `'raster-resampling': 'linear'` ensures weather bands render as soft, natural storm fronts rather than jagged pixel blocks.

- 🎧 **Real Environmental Rain, Wind SFX & Heavy Storm Tempest**:
  - Powered by **normalized, field-recorded environmental rain soundscapes**:
    - 🌧️ **Light Rain (`rain_light.ogg`)**: Gentle, soothing outdoor rainfall.
    - 🪟 **Tactile Window Droplets (`rain_window.ogg`)**: Distinct, crisp individual raindrops pattering against glass and surfaces.
    - ⛈️ **Heavy Summer Downpour (`rain_heavy.ogg`)**: Loud, visceral, roaring heavy deluge (normalized to -13 dB).
    - 🌊 **Storm Tempest (`storm_heavy.ogg`)**: Roaring storm torrent with thunderbolts and heavy water volume.
    - 💨 **Atmospheric Forest Breeze (`wind_breeze.ogg`)**: Authentic, organic rushing breeze recorded in pine woodlands, filtered at 620Hz to eliminate harsh whistling/steam kettle resonance, creating soothing natural storm air.
    - ⚡ **Thunderstorm (`rain_thunder.ogg`)**: Rolling convective thunder.
  - **Dynamic Multi-Track Crossfading**: Automatically blends rain tracks, howling wind gusts, and sub-bass resonance based on live NASA IMERG mm/hr precipitation rates.
  - **Sub-Bass Ground Resonance (65Hz–120Hz)**: Resonant low-frequency impact mass gives heavy downpours authentic weight and physical thunder.
  - **Altitude Distance Filtering**: High orbit (zoom < 3) muffles the sound to a gentle 1100Hz hum; ground level (zoom > 5) opens the full 20,000Hz frequency spectrum with crisp, intimate droplet clicks and roaring wind.

- ☕ **Real Lo-Fi Chillhop Mode (Purrple Cat)**:
  - Toggle button with an **animated frequency-reactive audio visualizer**.
  - Plays the classic chillhop track *"Cold & Rainy"* by **Purrple Cat** (CC-BY).
  - Web Audio AnalyserNode tracks bass, mid, and high frequencies in real-time to drive the dancing equalizer bars.
  - Independent volume sliders for Rain and Lo-Fi.

- 🧘 **Slow Roads Zen View with Inactivity Auto-Rotation**:
  - Press `H` or the eye toggle to enter Zen Mode.
  - **Auto-Rotation on First Open**: The globe immediately begins a smooth, cinematic orbital spin.
  - **Smart Inactivity Resume**: Interacting (dragging, panning, clicking) temporarily pauses rotation; after 3.2 seconds of inactivity, gentle autorotation smoothly resumes!
  - Synthesized vintage **Rhodes electric piano** playing dreamy jazz 7th/9th chord progressions (e.g. *Dm9 → G13 → Cmaj9 → Am9*).
  - Analog tape **wow & flutter** pitch modulation LFO.
  - Continuous turntable **vinyl crackle & micro pops**.
  - Warm **sub-bass** and downtempo **swung lo-fi drum beats** (muffled kick, rimshot snare, brushed hi-hats).
  - Independent volume mixers for Rain and Lo-Fi.

- ⚡ **Fly to Heaviest Rain Area on Earth (Hotkey `S`)**:
  - Click the **⚡ Heaviest** button in the top capsule or the **⚡ Heaviest Rain** pill in the bottom hotspot bar.
  - Instantly scans the active live NASA GPM IMERG 512×512 global precipitation grid to locate the highest rain rate epicenter on the planet.
  - Smoothly flies the 3D globe camera (`flyTo`) directly to the storm eye, sets the listening point, and starts playing the intense downpour/tempest acoustics immediately.
  - Also searchable directly by typing *"heavy"*, *"storm"*, or *"peak"* in the searchbar.

- 🔍 **Live Searchbar with Instant Autocomplete & Camera Lock**:
  - Instant local search against a curated database of 300+ world cities, capitals, and famously rainy hotspots (Mawsynram, Cherrapunji, Tutunendo, Quibdó, Mt. Waialeale, Bergen, Singapore, etc.).
  - Debounced universal geocoding via OpenStreetMap Nominatim.
  - Selecting any location smoothly **locks the 3D camera (`flyTo`)**, sets the active listening point, and starts/updates rain audio immediately.

- 📊 **Scientific Rain Type Hover Infocards**:
  - Hovering over the Rain Type badge in the bottom-left HUD reveals a comprehensive meteorological card:
    - Formal classification (*Stratiform Drizzle, Warm-Front Rain, Deep Convective Core, Monsoonal Squall*).
    - Physical droplet dynamics (*Drop diameter, terminal velocity in m/s, kinetic impact energy in J/m²·hr*).
    - Acoustic frequency spectrum (*Dominant Hz range, cavitation splash physics*).
    - NASA GPM detection instruments (*Dual-frequency Precipitation Radar DPR Ku/Ka-band & GMI Microwave Imager*).

- 🧠 **Interactive Rain & Geo Quiz ("Answer & Fly to Location")**:
  - Click the **Quiz** button in the top capsule to test your knowledge of extreme planetary rainfall and NASA precipitation science.
  - Selecting any answer **instantly flies the 3D globe camera (`flyTo`) directly to that chosen location**!
  - Locks the audio target to the answer's coordinates, samples the live NASA GPM IMERG rainfall, and begins playing the live acoustic rain soundscape right there.
  - Provides instant feedback, score tracking, educational explanations, and meteorological fun facts.

- 🌓 **Dark / Light Mode (Default Auto)**:
  - Defaults to **System Auto** mode detecting `prefers-color-scheme`.
  - Can be toggled: `Auto` → `Dark` → `Light`.
  - Dark Mode: Deep cosmos background with starry sky, dark basemap, and glowing radar hues.
  - Light Mode: Daylight sky atmosphere with clean cartographic relief.

- 🧘 **Slow Roads Zen View (Hotkey `H`)**:
  - Press `H` or the eye toggle to smoothly hide all UI capsules for full-screen, uninterrupted immersion.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus global searchbar |
| `Space` | Play / Pause audio |
| `S` | Find & Fly to Heaviest Rain Area on Earth |
| `L` | Toggle Lo-Fi chillhop mode |
| `H` | Toggle Zen View (hide/show all HUD capsules) |
| `Right-Click + Drag` | Tilt and rotate 3D bumpy globe |
| `Scroll Wheel` | Zoom in / out (adjusts acoustic distance) |

---

## 🚀 Running Locally

The project is pure web technology with zero build steps or heavy node dependencies:

```bash
# Start a local HTTP server
python3 -m http.server 8080

# Open in your browser
http://localhost:8080
```

---

## 📚 Scientific References & Citations

1. **NASA Scientific Visualization Studio (SVS) Entry 5650**:  
   [*Near Real-Time Global Precipitation from the Global Precipitation Measurement Constellation*](https://svs.gsfc.nasa.gov/5650)  
   Visualizer: Alex Kekesi · Lead Scientist: Dr. George Huffman, NASA Goddard Space Flight Center.
2. **NASA Global Imagery Browse Services (GIBS)**:  
   GPM IMERG Precipitation Rate WMS products (`IMERG_Precipitation_Rate_30min`).
3. **NASA Global Precipitation Measurement (GPM) Mission**:  
   Co-led by NASA and the Japan Aerospace Exploration Agency (JAXA).
