# Terraphone 🌍🌧️🏙️🕹️

> **NASA International Space Apps Challenge 2026**  
> *Planetary Sonification, Urban Noise Policy Simulator & Environmental Action Arcade*  
> 🔗 **Live Web Experience**: [https://vylt-gh.github.io/terraphone/](https://vylt-gh.github.io/terraphone/)  
> 🛰️ **NASA SVS Reference**: [SVS Entry 5650 (GPM Constellation)](https://svs.gsfc.nasa.gov/5650)

---

## 🔭 Overview

Earth is constantly producing sound. Precipitation strikes land and oceans, atmospheric storm systems generate convective shockwaves, and human urbanization introduces profound acoustic shifts across habitats.

**Terraphone** translates open NASA Earth observation data into a multi-sensory web experience across three interconnected scientific modules:

1. **🌧️ Global Rain**: Real-time 3D planetary sonification powered by NASA GPM satellite precipitation, convective thunder dynamics, and a 7-channel de-hissed granular habitat submixer.
2. **🏙️ The Sound of Change**: Interactive urban acoustic policy laboratory modeling how 20 municipal interventions alter Manhattan's acoustic pressure according to UNEP and WHO standards, coupled with a real-time CAVA audio spectrum visualizer.
3. **🕹️ Earth Arcade & Token Vault**: Six scientific arcade mini-games translating NASA mission datasets (ECOSTRESS, FIRMS, PACE, CloudSat, OMI, Landsat) into fast-paced gameplay with a balanced cosmetic token economy.

---

## 🌧️ 1. Global Rain & Planetary Sonification

- **Spherical 3D Globe with DEM Relief**:
  - Powered by **MapLibre GL JS v5** with true spherical globe projection.
  - Hypsometric terrain relief elevation mapping (Esri World Physical Topography & Mapzen Terrarium DEM) calibrated with adjustable vertical exaggeration (`1.2x`, `2.6x`, `4.0x`).
- **NASA GPM IMERG Precipitation Grid**:
  - Live 30-minute NASA Global Precipitation Measurement (IMERG) satellite data draped as volumetric clouds with terrain ground shadows.
  - Severe convective storm cells (>12 mm/hr) automatically trigger deep rolling sub-bass thunder synthesis synchronized with intra-cloud atmospheric lightning flashes.
- **7-Layer Granular Ambience Submixer (De-Hissed & Organic)**:
  - An independent audio engine with custom biquad filtering that eliminates legacy background static and tape hiss:
    - 🍃 **Wind & Breeze**: Organic resonant 380 Hz lowpass filter (`Q=1.1`) and 1000 Hz high-shelf attenuator (`-14 dB`).
    - 🌲 **Habitat Atmosphere**: Butterworth 2400 Hz lowpass filter (`Q=0.707`) crossfading between 4 distinct biogeographic zones:
      - 🏙️ *Urban*: Wet pavements, passing tires, metropolitan hum.
      - 🦗 *Rural*: Woodland night insects, chorus frogs, gentle breezes.
      - 🦜 *Jungle*: Amazon & Congo canopy wildlife, exotic birds, cicadas.
      - 🌊 *Ocean*: Deep oceanic swell cycles and breaking shoreline surf.
    - 🚗 **Vehicle Traffic** (low-frequency engine rumbles).
    - 📢 **City Honking** (taxi and delivery horns).
    - 🦗 **Insects & Wildlife** (canopy fauna).
    - 🐦 **Forest Birds** (songbirds and canopy chirps).
    - 👥 **Human Crowd** (street murmur and footsteps).
- **Planetary Discovery Tools**:
  - ⚡ **Heaviest Rain Finder (`S`)**: Instantly scans the active 512×512 global precipitation grid and flies the orbital camera to the highest rain rate epicenter on Earth.
  - 🔍 **Global Searchbar**: Instant geocoding and search autocomplete for global cities, storms, and coordinate pairs.
  - 🧠 **Interactive Rain & Geo Quiz**: 6-part atmospheric trivia that dynamically flies the camera to destination coordinates upon selecting answers.
  - 📸 **Meteorological Flashcards**: Real cloud photography and physical parameters (drop diameter, terminal velocity, kinetic impact energy) for 7 rainfall classifications.
  - ☕ **Procedural Lo-Fi Chillhop (`L`)**: Embedded chillhop stream with responsive frequency-reactive equalizer bars.

---

## 🏙️ 2. The Sound of Change (Urban Acoustic Simulator)

- **Scientifically Rigorous Acoustic Decibel Physics**:
  - Computes simulated acoustic pressure ($L_{\text{total}}$ in dBA equivalent) using standard logarithmic decibel summation:
    $$L_{\text{total}} = 10 \cdot \log_{10}\left( \sum_{i=1}^{n} 10^{L_i / 10} \right)$$
  - Directly compares current city state against the **WHO Environmental Noise Guideline** daytime target of **53 dBA**.
- **20 Real-World Municipal Interventions**:
  - **Transportation**: EV fleet transitions, low-noise porous asphalt, 30 km/h speed management, acoustic camera horn enforcement, heavy freight rerouting.
  - **Architecture & Facades**: STC-45 acoustic insulation mandates, sound-scattering textured facades, transparent acoustic highway barriers, green building sound buffers.
  - **Urban Planning & Source Control**: Industrial zoning relocations, continuous vegetative sound belts, entertainment venue acoustic locks, HVAC silencer inspections, construction hour curfews, electric off-hour logistics.
  - **Public Health & Awareness**: Community quiet hour charters, municipal anti-honking campaigns, WHO 60/60 safe personal listening education.
- **Indoor vs. Outdoor Listening Perspectives**:
  - **Outdoor Sidewalk**: Direct acoustic exposure to urban street canyon acoustics.
  - **Indoor Apartment**: Models realistic structural transmission loss (+26 dB attenuation via a 260 Hz biquad lowpass filter).
- **Real-Time CAVA Audio Spectrum Visualizer**:
  - Replaces simulated graphics with a live 64-band frequency-domain Fast Fourier Transform (FFT) visualizer.
  - Features real physics, falling peak caps, and responsive canvas rendering.
- **Global Urban Noise Pollution Leaderboard**:
  - UNEP Frontiers-calibrated acoustic rankings for ~50 global metropolises with direct jump links into the simulation engine.

---

## 🕹️ 3. Earth Arcade & Cosmic Token Vault

Six action mini-games translating NASA Earth observing satellite instruments into responsive gameplay loops with high score tracking:

| Game | NASA Mission / Sensor | Objective & Mechanics |
|------|------------------------|-----------------------|
| 🚒 **Fireline** | **NASA FIRMS** (MODIS / VIIRS) | Airborne firefighting — drop fire-retardant salvos to contain advancing wildfire perimeters, plant native seed clusters to restore incinerated soil, and defend ground ranger stations. |
| 🏃 **Heat Escape** | **NASA ECOSTRESS** | 5-lane infinite runner — navigate high-density concrete heat traps, weave through cool tree-shaded lanes, collect water cooling pods, and survive rising thermal velocity. |
| ✈️ **Cloud Courier** | **NASA CloudSat & CALIPSO** | Infinite atmospheric soaring — glide through vertical atmospheric cloud decks, navigate particulate aerosol gates, collect pure rainwater spheres, and monitor barometric health. |
| 🌌 **Ozone Drift** | **NASA OMI & Aura** | Stratospheric chemistry interceptor — pilot an agile atmospheric drone to collect catalytic CFC-neutralizing canisters, navigate polar vortex wind streams, and restore the ozone layer. |
| 🪸 **Coral Current** | **NASA PACE** (Ocean Color) | Pelagic reef survival — maneuver a marine explorer through dense living coral reefs across the sea floor, dodge aggressive apex predators (hammerheads, barracudas, morays), and collect bleaching-reversal nutrients. |
| 🌲 **The Last Forest** | **NASA Landsat** (Biomass) | Canopy defense — preserve ancient old-growth biomass, plant resilient saplings, and shield forest perimeters from illegal deforestation machinery. |

### 🪙 Token Economy & Cosmetics Vault
- **Restrained Economy**: Tokens earned exclusively through completing arcade mission milestones or active Zen Mode contemplation (capped daily to prevent inflation).
- **Cosmetics Catalog**:
  - **Car Paints & Glider Skins**: Solid palettes, dynamic multi-stop gradients (*Sunset Prism*, *Cyber Neon*, *Cosmic Aurora*), and textured patterns (*Carbon Fiber Matrix*, *Volcanic Magma*).
  - **20,000-Token Prestige Artifacts**: High-tier achievements including the **24K Imperial Golden Sovereign**, **Royal Sovereign Crown**, **Golden Cloud Monarch**, **24K Sovereign Halo**, and **Quantum Singularity Warp**.

---

## ⌨️ Controls & Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| `C` | Global | Switch between **Global Rain** and **The Sound of Change** |
| `A` | Global | Open / Close **Earth Arcade Hub** |
| `Space` | Global | Play / Pause audio soundscape in current view |
| `/` | Global | Focus location searchbar |
| `S` | Global Rain | Scan & Fly to **Heaviest Rain on Earth** (live NASA GPM) |
| `L` | Global Rain | Toggle procedural **Lo-Fi Chillhop** mode |
| `H` | Global Rain | Toggle **Zen Mode** (hide/show all HUD capsules) |
| `Right-Click + Drag` | Global Rain | Tilt and rotate orbital 3D globe |
| `Scroll Wheel` | Global Rain | Zoom in / out (dynamically adjusts acoustic distance) |
| `A / D` or `← / →` | Earth Arcade | Move left / right (lane snapping in Heat Escape, steer in flyers) |
| `Space / Click` | Earth Arcade | Drop payload (Fireline retardant, Cloud Courier boost) |
| `Esc` | Modals / Arcade | Close current modal, briefing, or active mini-game |

---

## 🚀 Running Locally

Terraphone is built with modern native web standards (**ES Modules**, **Web Audio API**, **WebGL / MapLibre GL v5**, **HTML5 Canvas2D**). It requires no build tools, compilers, or heavy node dependencies:

```bash
# Clone the repository
git clone https://github.com/vylt-gh/terraphone.git
cd terraphone

# Start any standard local HTTP server
python3 -m http.server 8080
# or: npx serve .

# Open in your browser
open http://localhost:8080
```

### Direct Navigation via URL Hash
- **3D Global Rain**: `http://localhost:8080/#rain`
- **The Sound of Change**: `http://localhost:8080/#sound-of-change`
- **Earth Arcade**: `http://localhost:8080/#arcade`

---

## 🛰️ NASA Data Sources & Scientific Citations

- **NASA Scientific Visualization Studio (SVS)**: Entry 5650 *"Near Real-Time Global Precipitation from the GPM Constellation"* (Alex Kekesi, George Huffman).
- **NASA GPM IMERG**: Global Precipitation Measurement 30-Minute Precipitation Calibrated Data (`IMERG_Precipitation_Rate_30min`).
- **NASA ECOSTRESS**: ECOsystem Spaceborne Thermal Radiometer Experiment on Space Station (Urban Heat Island & Land Surface Temperature).
- **NASA FIRMS**: Fire Information for Resource Management System (Near real-time MODIS / VIIRS active fire detections).
- **NASA CloudSat & CALIPSO**: 2B-GEOPROF and Cloud-Aerosol Lidar with Orthogonal Polarization vertical atmospheric profiling.
- **NASA OMI (Aura)**: Ozone Monitoring Instrument total column ozone measurements.
- **NASA PACE**: Plankton, Aerosol, Cloud, ocean Ecosystem ocean color and coastal reflectance.
- **NASA TRMM & ISS LIS**: Tropical Rainfall Measuring Mission and International Space Station Lightning Imaging Sensor flash rates.
- **UNEP Frontiers Report (2022)**: *"Noise, Blazes and Mismatches: Emerging Issues of Environmental Concern"*.
- **World Health Organization (WHO)**: *Environmental Noise Guidelines for the European Region* (53 dBA $L_{den}$ traffic benchmark).
- **MapLibre GL JS**: Open-source WebGL/WebGPU mapping engine.
- **Esri & Mapzen**: World Physical Topographic Hypsometry & Terrarium Global DEM.
- **Purrple Cat**: *"Cold & Rainy"* Lo-Fi music track (CC-BY 4.0).
