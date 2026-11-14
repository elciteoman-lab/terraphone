# Terraphone 🌍🌧️⚡

> **NASA Space Apps Challenge** · Live Global Rain, Thunder & Atmospheric Sound Simulator  
> Powered by **NASA Scientific Visualization Studio (SVS) Entry 5650** & **NASA GPM IMERG**  
> 🔗 **Live Demo**: [https://vylt-gh.github.io/raIn.tensity/](https://vylt-gh.github.io/raIn.tensity/)

`Terraphone` is an immersive global rain, thunder, and atmospheric sound simulator designed with a sleek, minimalist, out-of-your-way UI inspired by **slowroads.io**. Explore the Earth as a tactile 3D bumpy globe, discover near-real-time global storm systems, and listen to authentic multi-layered soundscapes combining live rain droplet physics, convective NASA thunder rolls, and location-dependent habitat ambience (urban traffic, rural insects, jungle wildlife, and ocean swells).

---

## ✨ Key Features

- ☁️ **Hovering Atmospheric Storm Cloud Deck & Ground Shadows**:
  - Live rainfall is rendered as volumetric storm clouds hovering over Earth's 3D terrain.
  - **Ground Cloud Shadows**: A darkened, blurred shadow layer (`cloud-shadow-layer`) casts realistic ground shadows into valleys and mountain contours.
  - **Atmospheric Storm Deck**: A high-contrast cloud deck (`cloud-deck-layer`) sits elevated above the topography with bilinear texture filtering.
  - **Intra-Cloud Lightning Illumination**: Severe convective thunder strikes briefly illuminate the cloud deck with a realistic intra-cloud lightning flash.

- ⚡ **NASA Convective Thunder & Lightning Integration**:
  - Powered by NASA Lightning Imaging Sensor (LIS) convective storm dynamics and GPM precipitation thresholds.
  - Convective storm cores (>12 mm/hr) generate deep rolling sub-bass thunder rumbles (`rain_thunder.ogg`).
  - Severe convective storm cells trigger dynamic thunder strikes and synchronized atmospheric lightning flashes.

- 🏙️🦗🦜🌊 **Location-Dependent Habitat Ambience**:
  - Terraphone automatically classifies the coordinates you click or visit into 4 distinct acoustic habitats with seamless cross-fading:
    - 🏙️ **Urban Ambience (`ambience_urban.ogg`)**: Wet city streets, passing tire hiss, distant metropolitan traffic, and urban hum.
    - 🦗 **Rural Ambience (`ambience_rural.ogg`)**: Countryside night insects, chorus frogs, and gentle woodland breezes.
    - 🦜 **Rainforest Canopy Wildlife (`ambience_jungle.ogg`)**: Amazon & Congo basin exotic canopy birds, cicadas, and tropical biodiversity.
    - 🌊 **Ocean Swells & Surf (`ambience_ocean.ogg`)**: Deep oceanic tidal swells and coastal breaking surf.

- 🎛️ **4-Channel Precision Audio Mixer**:
  - Bottom-right HUD capsule features 4 independent volume sliders:
    - 🌧️ **Rain Volume**: Droplet impacts, window patter, and heavy downpours.
    - ⚡ **Thunder Volume**: Deep convective thunder rolls and lightning strikes.
    - 🐾 **Ambience Volume**: Habitat acoustics (Urban, Rural, Jungle, Ocean).
    - ☕ **Lo-Fi Volume**: Chillhop beats with animated equalizer bars.

- 🧠 **Interactive Rain & Geo Quiz ("Answer & Fly to Location")**:
  - Test your knowledge of extreme planetary rainfall and NASA precipitation science across 6 challenging questions.
  - Selecting any answer **instantly flies the 3D globe camera (`flyTo`) directly to that chosen location**!
  - Samples live NASA GPM rainfall at the destination and starts playing its authentic rain and ambient soundscape.
  - Instant score tracking, educational explanations, fun facts, and final meteorologist rank screen.

- 📸 **Rain Type Flashcards with Visual Imagery**:
  - Hovering over the Rain Type badge in the bottom-left reveals deep meteorological flashcards with real atmospheric cloud photography (WebP):
    - *Clear Sky (Cirrus fibratus)*
    - *Mist & Light Drizzle (Stratocumulus mist)*
    - *Light Continuous Rain (Nimbostratus sheet)*
    - *Steady Moderate Rain (Nimbostratus praecipitatio)*
    - *Heavy Downpour (Cumulonimbus shelf cloud)*
    - *Torrential Tropical Downpour (Cumulonimbus incus anvil)*
    - *Extreme Monsoonal Cloudburst (Supercell mesocyclone)*
  - Includes drop diameter, terminal velocity (m/s), kinetic impact energy (J/m²·hr), and NASA GPM DPR Ku/Ka radar signatures.

- ⚡ **Fly to Heaviest Rain Area on Earth (Hotkey `S`)**:
  - Click the **⚡ Heaviest** button in the top capsule (or press `S`).
  - Scans the active live NASA GPM IMERG 512×512 global precipitation grid to locate the highest rain rate epicenter on the planet.
  - Flies the camera directly to the storm eye and starts playing the intense tempest acoustics immediately.

- 🌍 **Tactile 3D Bumpy Globe & Elevation Colormap**:
  - Rendered with **MapLibre GL JS v5** using true spherical globe projection.
  - Symmetrically centered camera (`pitch: 0`) for wobble-free, buttery-smooth orbital rotation.
  - Styled with **Esri World Physical Topography** hypsometric elevation colormap:
    - 🌊 Ocean depths: Bathymetric azure to navy
    - 🌿 Lowlands (0–300m): Lush verdant green
    - 🌾 Foothills & Plateaus (300–1200m): Warm golden ochre & amber
    - ⛰️ High Cordilleras (1200–3500m): Terracotta, sienna, and rust
    - 🏔️ Alpine Summits (3500m+): Glacial snow-capped white peaks
  - Calibrated 3D DEM relief displacement (**2.6x** default, with `1.2x`, `2.6x`, and `4.0x` presets) + hillshade lighting.

- ☕ **Real Lo-Fi Chillhop Mode (Purrple Cat)**:
  - Toggle button with an **animated frequency-reactive audio visualizer**.
  - Plays *"Cold & Rainy"* by **Purrple Cat** (CC-BY).
  - Real-time Web Audio AnalyserNode frequency bins drive the dancing equalizer bars.

- 🧘 **Slow Roads Zen View with Inactivity Auto-Rotation**:
  - Press `H` or the eye toggle to enter Zen Mode.
  - Seamless auto-rotation starts immediately on first open.
  - Interacting temporarily pauses rotation; resumes automatically after 3.2 seconds of inactivity.

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

The project is pure web technology with zero build steps:

```bash
# Start a local HTTP server
python3 -m http.server 8080

# Open in your browser
http://localhost:8080
```

---

## 🛰️ Data Sources & Attribution

- **NASA Scientific Visualization Studio (SVS)**: Entry 5650 *"Near Real-Time Global Precipitation from the GPM Constellation"*
- **NASA Earthdata / GIBS**: Global Precipitation Measurement (GPM) IMERG 30-Minute Precipitation Rate (`IMERG_Precipitation_Rate_30min`)
- **NASA TRMM / ISS LIS**: Lightning Imaging Sensor Flash Density & Convective Storm Core Dynamics
- **AWS Open Data**: Mapzen Terrarium Global Elevation DEM
- **Esri / USGS / NOAA**: World Physical Topographic Hypsometry
- **Purrple Cat**: *"Cold & Rainy"* Lo-Fi Chillhop (CC-BY 4.0)
- **MapLibre GL JS v5**: Open-source WebGL/WebGPU mapping engine
