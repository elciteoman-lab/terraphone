# Terraphone 🌍🌧️🏙️⚡

> **NASA Space Apps Challenge 2026** · Global Rain & The Sound of Change  
> Powered by **NASA Scientific Visualization Studio (SVS Entry 5650)**, **NASA GPM IMERG**, **NASA Soundscapes to Landscapes (S2L)**, **UNEP Frontiers**, and **WHO Environmental Guidelines**  
> 🔗 **Live Demo**: [https://vylt-gh.github.io/terraphone/](https://vylt-gh.github.io/terraphone/)

**Terraphone** explores how our planet sounds. Earth is constantly making music — our mission is to allow people to explore it, listen to it, and understand how human decisions and urban planning policies transform its acoustic soundscape.

The project connects two interactive scientific experiences:
1. **🌧️ Global Rain**: Explore worldwide precipitation data from NASA satellites and listen to its live sonification across a 3D bumpy globe.
2. **🏙️ The Sound of Change**: Explore urban noise pollution in New York City (Manhattan) through cinematic **Google Flow 1080p footage**, and simulate how 20 urban policies and environmental interventions can transform a chaotic, high-noise city into a quiet, healthy sanctuary.

---

## ✨ Key Experiences

### 1. 🏙️ The Sound of Change (Urban Acoustic Simulation)
- 🎬 **Cinematic Google Flow 1080p Video Integration**:
  - Live urban video background utilizing high-definition Google Flow footage of Manhattan streetscapes.
  - Smooth dynamic crossfade between high-density chaotic traffic (`noisy-city.mp4`) and calm pedestrianized boulevards (`quiet-city.mp4`).
  - Interactive **Before / After Split Slider**: Drag across the screen in real-time to compare the baseline noisy city against the quieted city.
- 🎛️ **Layered 5-Channel Web Audio Engine**:
  - Replaces monolithic audio with 5 independent real-time channels:
    1. **Traffic**: Engine rumble, tire-pavement friction, and passing cars.
    2. **Horns**: Periodic NYC taxi and delivery horn honks.
    3. **Construction**: Pneumatic jackhammer pulses, drilling, and metallic impacts.
    4. **Industry**: Deep 60Hz/120Hz transformer hum and commercial HVAC chiller fans.
    5. **Crowd & Entertainment**: Pedestrian footsteps, cafe chatter, and street murmur.
    6. **Nature**: Melodic birdsong and wind through trees (emerges as urban noise subsides).
- 📐 **Scientifically Responsible Logarithmic Noise Index**:
  - Displays a **Simulated Noise Index (0–100)** with dBA equivalent acoustic pressure:
    $$L_{\text{total}} = 10 \cdot \log_{10}\left( \sum 10^{L_i / 10} \right)$$
  - Calibrated from baseline Manhattan (**Index 88**, ~85 dBA) down to a calm urban park (**Index 48**, ~72 dBA).
  - WHO Environmental Noise Guideline marker (53 dBA daytime threshold).
- 🚶🏠 **Indoor vs. Outdoor Listening Perspectives**:
  - **Outdoor Sidewalk**: Direct acoustic exposure to street canyons and traffic.
  - **Indoor Apartment**: Realistic acoustic transmission loss. Mandatory building insulation provides +26 dB attenuation through an acoustic lowpass biquad filter (corner frequency 260 Hz), demonstrating that facade insulation primarily creates an indoor sanctuary rather than reducing outdoor street noise.
- 📢 **4 Comprehensive Intervention Categories (20 Policies)**:
  - **Transportation & Traffic**: Electric public transit, low-noise asphalt, 30 km/h speed management, vehicle routing, and smart acoustic camera horn enforcement.
  - **Architecture & Sound Insulation**: Mandatory STC-45 building insulation, sound-scattering facade architecture, transparent noise barriers, and green building standards.
  - **Urban Planning & Source Control**: Heavy industry zoning relocation, continuous vegetative green belts, entertainment venue sound locks, commercial HVAC inspections, construction hour curfews, and quiet delivery logistics.
  - **Public Awareness & Health**: Community quiet hours, anti-honking campaigns, and responsible headphone habits (WHO 60/60 rule protecting personal hearing health without artificially skewing ambient outdoor metrics).

---

### 2. 🌧️ Global Rain (3D Planetary Sonification)
- ☁️ **Hovering Atmospheric Storm Cloud Deck & Ground Shadows**:
  - Live NASA GPM IMERG rainfall draped as volumetric clouds with terrain shadows over an elevation colormap globe.
- ⚡ **NASA Convective Thunder & Lightning Integration**:
  - Real-time thunder synthesis triggered by convective storm cores (>12 mm/hr), synchronized with atmospheric lightning illumination.
- 🏙️🦗🦜🌊 **Location-Dependent Habitat Ambience**:
  - Seamless crossfading between 4 distinct acoustic habitats:
    - 🏙️ **Urban Ambience**: Wet city streets, passing tire hiss, and metropolitan hum.
    - 🦗 **Rural Ambience**: Countryside night insects, chorus frogs, and gentle breezes.
    - 🦜 **Rainforest Canopy Wildlife**: Amazon & Congo basin biodiversity and canopy birds.
    - 🌊 **Ocean Swells & Surf**: Pelagic oceanic tidal swells and coastal surf.
- 🏆 **Global Urban Noise Leaderboard (UNEP & WHO)**:
  - Ranked acoustic profiles for ~50 major global cities, with direct links into The Sound of Change simulator.
- 🧠 **Interactive Rain & Geo Quiz**:
  - Flight camera (`flyTo`) transports users across extreme precipitation hotspots on Earth.
- ⚡ **Fly to Heaviest Rain Area on Earth (Hotkey `S`)**:
  - Scans active NASA GPM 512×512 precipitation grid for the planet's highest storm rate.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `C` | Switch between **Global Rain** and **The Sound of Change** |
| `Space` | Play / Pause audio soundscape in active experience |
| `/` | Focus global searchbar |
| `S` | Find & Fly to Heaviest Rain Area on Earth |
| `L` | Toggle procedural Lo-Fi chillhop mode |
| `H` | Toggle Zen View (hide/show all HUD capsules) |
| `Right-Click + Drag` | Tilt and rotate 3D bumpy globe |
| `Scroll Wheel` | Zoom in / out (adjusts acoustic distance) |

---

## 🚀 Running Locally

The project uses modern native web standards (ES Modules, Web Audio API, HTML5 Video, CSS Grid) with zero build steps or bundlers required:

```bash
# Start a local HTTP server
python3 -m http.server 8080

# Open in your browser
http://localhost:8080
```

To jump directly into an experience via URL hash:
- **Global Rain**: `http://localhost:8080/#rain`
- **The Sound of Change**: `http://localhost:8080/#sound-of-change`

---

## 🛰️ Scientific Attribution & References

- **NASA Scientific Visualization Studio (SVS)**: Entry 5650 *"Near Real-Time Global Precipitation from the GPM Constellation"* (Alex Kekesi & Dr. George Huffman).
- **NASA Earthdata / GIBS**: Global Precipitation Measurement (GPM) IMERG 30-Minute Precipitation Rate.
- **NASA TRMM / ISS LIS**: Lightning Imaging Sensor Flash Density & Convective Storm Core Dynamics.
- **United Nations Environment Programme (UNEP)**: Frontiers 2022 Report *"Noise, Blazes and Mismatches: Emerging Issues of Environmental Concern"*.
- **World Health Organization (WHO)**: *Environmental Noise Guidelines for the European Region* (53 dBA $L_{den}$ traffic guideline).
- **Google Flow**: Cinematic high-definition urban footage of Manhattan, New York.
- **AWS Open Data & Esri**: Mapzen Terrarium Global Elevation DEM & World Physical Topography.

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
