/**
 * Terraphone - Data & Meteorological Profiles
 * NASA Space Apps Challenge · GPM IMERG & NASA SVS 5650
 */

// Official NASA GIBS GPM IMERG Palette (Precipitation Rate in mm/hr from GPM_Precipitation_Rate.xml)
export const IMERG_PALETTE = [
  { v: 0.10, rgb: [0, 118, 78] },
  { v: 0.11, rgb: [0, 123, 72] },
  { v: 0.13, rgb: [0, 129, 66] },
  { v: 0.14, rgb: [0, 134, 58] },
  { v: 0.16, rgb: [0, 140, 50] },
  { v: 0.18, rgb: [0, 145, 41] },
  { v: 0.20, rgb: [0, 151, 31] },
  { v: 0.22, rgb: [0, 156, 20] },
  { v: 0.25, rgb: [0, 162, 9] },
  { v: 0.28, rgb: [3, 167, 0] },
  { v: 0.32, rgb: [16, 173, 0] },
  { v: 0.35, rgb: [30, 178, 0] },
  { v: 0.40, rgb: [45, 184, 0] },
  { v: 0.45, rgb: [61, 189, 0] },
  { v: 0.50, rgb: [78, 195, 0] },
  { v: 0.56, rgb: [95, 200, 0] },
  { v: 0.63, rgb: [114, 206, 0] },
  { v: 0.71, rgb: [133, 212, 0] },
  { v: 0.79, rgb: [153, 217, 0] },
  { v: 0.89, rgb: [174, 223, 0] },
  { v: 1.00, rgb: [195, 228, 0] },
  { v: 1.12, rgb: [218, 234, 0] },
  { v: 1.26, rgb: [239, 237, 0] },
  { v: 1.41, rgb: [245, 224, 0] },
  { v: 1.58, rgb: [250, 210, 0] },
  { v: 1.78, rgb: [255, 194, 1] },
  { v: 2.00, rgb: [255, 176, 6] },
  { v: 2.24, rgb: [255, 160, 12] },
  { v: 2.51, rgb: [255, 144, 17] },
  { v: 2.82, rgb: [255, 129, 23] },
  { v: 3.16, rgb: [255, 115, 28] },
  { v: 3.55, rgb: [255, 101, 34] },
  { v: 3.98, rgb: [255, 89, 39] },
  { v: 4.47, rgb: [255, 77, 45] },
  { v: 5.01, rgb: [255, 66, 51] },
  { v: 5.62, rgb: [255, 38, 38] },
  { v: 6.31, rgb: [255, 26, 26] },
  { v: 7.08, rgb: [255, 13, 13] },
  { v: 7.94, rgb: [255, 1, 1] },
  { v: 8.91, rgb: [243, 0, 0] },
  { v: 10.00, rgb: [231, 0, 0] },
  { v: 11.22, rgb: [218, 0, 0] },
  { v: 12.59, rgb: [206, 0, 0] },
  { v: 14.13, rgb: [194, 0, 0] },
  { v: 15.85, rgb: [181, 0, 0] },
  { v: 17.78, rgb: [169, 0, 0] },
  { v: 19.95, rgb: [156, 0, 0] },
  { v: 22.39, rgb: [144, 0, 0] },
  { v: 25.12, rgb: [131, 0, 0] },
  { v: 28.18, rgb: [119, 0, 0] },
  { v: 31.62, rgb: [106, 0, 0] },
  { v: 35.48, rgb: [94, 0, 0] },
  { v: 39.81, rgb: [82, 0, 0] },
  { v: 44.67, rgb: [69, 0, 0] },
  { v: 50.12, rgb: [57, 0, 0] },
  { v: 53.08, rgb: [63, 3, 54] }
];

// Deep Scientific Rain Type Profiles & Infocard Content with Visual WebP Imagery
export const RAIN_TYPES = {
  clear: {
    id: 'clear',
    name: 'Clear Sky / Trace',
    tag: 'Clear Sky',
    icon: '☀️',
    rateMin: 0.0,
    rateMax: 0.05,
    image: 'img/raintypes/clear.webp',
    imageCaption: 'Cirrus fibratus & cloudless troposphere',
    scientificClass: 'Negligible Precipitation / Sub-saturated Air',
    cloudGenus: 'Cirrus fibratus / Altocumulus / Clear Sky',
    dropDiameter: '< 0.1 mm (Atmospheric Aerosol / Virga)',
    terminalVelocity: '< 0.5 m/s',
    kineticEnergy: '0.00 J / m² · hr',
    acousticSignature: 'Zero droplet impact sound. High altitude wind shear and tranquil silence.',
    nasaGpmDetection: 'DPR Ku/Ka bands report radar reflectivity < 12 dBZ. GMI radiometer observes clear brightness temperatures across 10-183 GHz.',
    synopticDynamics: 'Subsidence inversion or dry continental polar/tropical air mass. Updrafts < 0.1 m/s, relative humidity < 60%.'
  },
  drizzle: {
    id: 'drizzle',
    name: 'Mist & Light Drizzle',
    tag: 'Misty Drizzle',
    icon: '🌫️',
    rateMin: 0.05,
    rateMax: 1.0,
    image: 'img/raintypes/drizzle.webp',
    imageCaption: 'Stratocumulus mist & low-hanging stratus sheet',
    scientificClass: 'Stratiform Micro-droplet Precipitation',
    cloudGenus: 'Stratus fractus / Stratocumulus opacus',
    dropDiameter: '0.2 – 0.5 mm (Micro-droplets)',
    terminalVelocity: '1.5 – 2.8 m/s',
    kineticEnergy: '0.02 – 0.15 J / m² · hr',
    acousticSignature: 'Soft, airy high-frequency white hiss (3.5 kHz – 9.0 kHz) with delicate microscopic surface taps.',
    nasaGpmDetection: 'Primarily sensed via high-frequency GMI microwave channels (89 & 166 GHz) tracking cloud liquid water attenuation; DPR reflectivity 12-18 dBZ.',
    synopticDynamics: 'Stable boundary layer with gentle orographic or warm-advection ascent. Minimal updraft (< 0.5 m/s) with shallow cloud tops below 2,000 m.'
  },
  light: {
    id: 'light',
    name: 'Light Continuous Rain',
    tag: 'Light Rain',
    icon: '🌦️',
    rateMin: 1.0,
    rateMax: 3.5,
    image: 'img/raintypes/light.webp',
    imageCaption: 'Uniform nimbostratus with continuous gentle droplets',
    scientificClass: 'Warm-Front Stratiform Rainfall',
    cloudGenus: 'Nimbostratus / Altostratus translucidus',
    dropDiameter: '0.6 – 1.4 mm',
    terminalVelocity: '3.0 – 5.2 m/s',
    kineticEnergy: '0.4 – 1.8 J / m² · hr',
    acousticSignature: 'Soothing rhythmic patter with moderate highpass presence (1.8 kHz – 5.5 kHz); gentle roof pitter-patter.',
    nasaGpmDetection: 'DPR dual-frequency radar detects bright band near the 0°C melting level (~3.5 km altitude) with reflectivity 18-28 dBZ.',
    synopticDynamics: 'Broad synoptic isentropic lift ahead of warm front. Moderate moisture advection with uniform stratiform precipitation fields.'
  },
  moderate: {
    id: 'moderate',
    name: 'Steady Moderate Rain',
    tag: 'Steady Rain',
    icon: '🌧️',
    rateMin: 3.5,
    rateMax: 10.0,
    image: 'img/raintypes/moderate.webp',
    imageCaption: 'Deep nimbostratus praecipitatio rain sheet',
    scientificClass: 'Deep Stratiform / Moderate Frontal System',
    cloudGenus: 'Nimbostratus praecipitatio',
    dropDiameter: '1.5 – 2.8 mm',
    terminalVelocity: '5.5 – 7.2 m/s',
    kineticEnergy: '2.5 – 8.0 J / m² · hr',
    acousticSignature: 'Rich, immersive acoustic wash combining low-mid surface resonance (300 Hz – 1.2 kHz) with constant droplet splatter.',
    nasaGpmDetection: 'Strong Ku/Ka radar backscatter (28-36 dBZ). GMI channels at 19 & 37 GHz reveal dense liquid water columns across the troposphere.',
    synopticDynamics: 'Baroclinic wave cyclone with organized low-level jet. Modest CAPE (200-800 J/kg) with steady vertical ascent of 1-3 m/s.'
  },
  heavy: {
    id: 'heavy',
    name: 'Heavy Downpour',
    tag: 'Heavy Rain',
    icon: '🌧️',
    rateMin: 10.0,
    rateMax: 30.0,
    image: 'img/raintypes/heavy.webp',
    imageCaption: 'Cumulonimbus shelf cloud with heavy precipitation shaft',
    scientificClass: 'Convective Rainband / Orographic Downpour',
    cloudGenus: 'Cumulonimbus calvus / Embedded Convection',
    dropDiameter: '2.5 – 4.0 mm',
    terminalVelocity: '7.5 – 8.8 m/s',
    kineticEnergy: '12 – 45 J / m² · hr',
    acousticSignature: 'Pounding acoustic roar with deep brownian bass rumble (80 Hz – 250 Hz), rapid chaotic droplet impacts, and water runoff.',
    nasaGpmDetection: 'DPR cross-track scans reveal vertical storm cores extending above 8 km; radar reflectivity exceeds 40 dBZ with ice-phase scattering aloft.',
    synopticDynamics: 'Vigorous conditional instability (CAPE 1,000–2,500 J/kg), strong moisture convergence, and vertical updrafts up to 10 m/s.'
  },
  torrential: {
    id: 'torrential',
    name: 'Torrential Tropical Downpour',
    tag: 'Tropical Storm',
    icon: '⛈️',
    rateMin: 30.0,
    rateMax: 70.0,
    image: 'img/raintypes/torrential.webp',
    imageCaption: 'Cumulonimbus incus anvil with extreme convective deluge',
    scientificClass: 'Deep Convective Mesoscale Storm Core',
    cloudGenus: 'Cumulonimbus capillatus incus (Anvil Cloud)',
    dropDiameter: '3.5 – 5.5 mm (Large Breakup Droplets)',
    terminalVelocity: '8.8 – 9.6 m/s',
    kineticEnergy: '60 – 180 J / m² · hr',
    acousticSignature: 'Deafening acoustic deluge; saturated white/pink noise roar punctuated by deep sub-bass thunder rolls (35 Hz – 120 Hz).',
    nasaGpmDetection: 'IMERG multi-satellite radiometer constellation registers extreme 85 GHz polarization brightness depression (< 180 K) indicative of massive graupel/hail lofting.',
    synopticDynamics: 'Deep tropospheric buoyancy (CAPE > 3,000 J/kg), precipitable water > 55 mm, updrafts exceeding 20 m/s with localized microbursts.'
  },
  extreme: {
    id: 'extreme',
    name: 'Extreme Monsoonal Cloudburst',
    tag: 'Extreme Deluge',
    icon: '🌪️',
    rateMin: 70.0,
    rateMax: 350.0,
    image: 'img/raintypes/extreme.webp',
    imageCaption: 'Severe supercell mesocyclone & extreme cloudburst',
    scientificClass: 'Monsoonal Squall Line / Tropical Cyclone Eyewall',
    cloudGenus: 'Cumulonimbus incus mammatus (Severe Supercell)',
    dropDiameter: '4.5 – 6.5 mm (Near Aerodynamic Stability Limit)',
    terminalVelocity: '> 9.5 m/s',
    kineticEnergy: '> 250 J / m² · hr',
    acousticSignature: 'Overwhelming seismic acoustic pressure; sustained sub-100 Hz rumble, violent surface cavitation, and echoing close-range thunder strikes.',
    nasaGpmDetection: 'DPR Dual-frequency radar records extreme attenuation, requiring DPR-GMI synergistic Bayesian inversion. Reflectivity > 52 dBZ.',
    synopticDynamics: 'Mesoscale convective vortex or intense tropical cyclone eyewall. Orographic barrier blocking (e.g. Western Ghats, Meghalaya plateau) with rapid flooding.'
  }
};

export function getRainType(rate) {
  if (rate == null || rate < 0.05) return RAIN_TYPES.clear;
  if (rate < 1.0) return RAIN_TYPES.drizzle;
  if (rate < 3.5) return RAIN_TYPES.light;
  if (rate < 10.0) return RAIN_TYPES.moderate;
  if (rate < 30.0) return RAIN_TYPES.heavy;
  if (rate < 70.0) return RAIN_TYPES.torrential;
  return RAIN_TYPES.extreme;
}

// Famous Global Rain Hotspots for bottom pill shortcuts
export const PRESET_HOTSPOTS = [
  { name: 'Amazon Basin', lat: -3.46, lng: -62.21, zoom: 5.5, label: 'Amazon Rainforest', tag: 'Rainforest' },
  { name: 'Cherrapunji', lat: 25.27, lng: 91.73, zoom: 7.0, label: 'Cherrapunji, India', tag: 'Monsoon Capital' },
  { name: 'Quibdó', lat: 5.69, lng: -76.65, zoom: 6.8, label: 'Quibdó, Colombia', tag: 'Rainiest Lowland' },
  { name: 'Mt. Waialeale', lat: 22.07, lng: -159.50, zoom: 7.5, label: 'Kauai, Hawaii', tag: 'Orographic Peak' },
  { name: 'Singapore', lat: 1.35, lng: 103.82, zoom: 7.0, label: 'Singapore', tag: 'Equatorial Squall' },
  { name: 'Bergen', lat: 60.39, lng: 5.32, zoom: 6.5, label: 'Bergen, Norway', tag: 'Nordic Rain' },
  { name: 'Cascadia', lat: 47.60, lng: -122.33, zoom: 6.0, label: 'Seattle & Pacific NW', tag: 'Pacific Front' },
  { name: 'Kinshasa', lat: -4.44, lng: 15.26, zoom: 6.2, label: 'Congo Basin', tag: 'Tropical Thunder' }
];

// Rich Local World Cities Database (130+ locations for zero-latency instant search)
export const CITIES_DATABASE = [
  // Rainiest and extreme weather hotspots
  { name: 'Cherrapunji', country: 'India', lat: 25.27, lng: 91.73, cat: 'Monsoon Capital', pop: 'Historic rain capital' },
  { name: 'Mawsynram', country: 'India', lat: 25.30, lng: 91.58, cat: 'Monsoon Capital', pop: 'Wettest place on Earth (11,872mm/yr)' },
  { name: 'Tutunendo', country: 'Colombia', lat: 5.75, lng: -76.53, cat: 'Tropical Rain', pop: 'Extreme rainfall zone' },
  { name: 'Quibdó', country: 'Colombia', lat: 5.69, lng: -76.65, cat: 'Tropical Rain', pop: 'Rainiest city in South America' },
  { name: 'Mount Waialeale', country: 'United States', lat: 22.07, lng: -159.50, cat: 'Orographic Peak', pop: 'Kauai summit (9,763mm/yr)' },
  { name: 'Big Bog', country: 'United States', lat: 20.78, lng: -156.12, cat: 'Orographic Peak', pop: 'Maui summit (10,272mm/yr)' },
  { name: 'Debundscha', country: 'Cameroon', lat: 4.10, lng: 8.98, cat: 'Atlantic Monsoon', pop: '10,299mm/yr coastal rain' },
  { name: 'Bioko Island', country: 'Equatorial Guinea', lat: 3.56, lng: 8.70, cat: 'Atlantic Monsoon', pop: '10,450mm/yr equatorial' },
  { name: 'Bellenden Ker', country: 'Australia', lat: -17.26, lng: 145.85, cat: 'Tropical Ridge', pop: 'Wettest location in Australia' },
  { name: 'Milford Sound', country: 'New Zealand', lat: -44.67, lng: 167.92, cat: 'Fjordland Rain', pop: '6,813mm/yr fjord deluge' },
  { name: 'Yakushima', country: 'Japan', lat: 30.34, lng: 130.52, cat: 'Ancient Cedar Rainforest', pop: '4,500mm/yr island rains' },
  { name: 'Ketchikan', country: 'United States', lat: 55.34, lng: -131.64, cat: 'Temperate Rainforest', pop: 'Rain capital of Alaska' },
  { name: 'Bergen', country: 'Norway', lat: 60.39, lng: 5.32, cat: 'Nordic Rain', pop: 'Rainiest city in Europe' },
  { name: 'Hilo', country: 'United States', lat: 19.72, lng: -155.08, cat: 'Pacific Rain', pop: '3,200mm/yr' },
  { name: 'Rize', country: 'Turkey', lat: 41.02, lng: 40.52, cat: 'Black Sea Rain', pop: 'Rainiest province in Turkey (2,300mm/yr)' },
  { name: 'Atacama Desert', country: 'Chile', lat: -23.86, lng: -69.13, cat: 'Hyper-Arid', pop: 'Driest non-polar desert on Earth' },

  // Europe & Mediterranean
  { name: 'Madrid', country: 'Spain', lat: 40.42, lng: -3.70, cat: 'Capital', pop: '3.3M' },
  { name: 'Barcelona', country: 'Spain', lat: 41.39, lng: 2.17, cat: 'Mediterranean', pop: '1.6M' },
  { name: 'Valencia', country: 'Spain', lat: 39.47, lng: -0.38, cat: 'Mediterranean', pop: '0.8M' },
  { name: 'Seville', country: 'Spain', lat: 37.39, lng: -5.98, cat: 'Andalusia', pop: '0.7M' },
  { name: 'Lisbon', country: 'Portugal', lat: 38.72, lng: -9.14, cat: 'Atlantic Coast', pop: '0.5M' },
  { name: 'Porto', country: 'Portugal', lat: 41.16, lng: -8.63, cat: 'Atlantic Coast', pop: '0.3M' },
  { name: 'London', country: 'United Kingdom', lat: 51.51, lng: -0.13, cat: 'Major City', pop: '9M' },
  { name: 'Manchester', country: 'United Kingdom', lat: 53.48, lng: -2.24, cat: 'Major City', pop: '0.6M' },
  { name: 'Edinburgh', country: 'United Kingdom', lat: 55.95, lng: -3.19, cat: 'Scotland', pop: '0.5M' },
  { name: 'Glasgow', country: 'United Kingdom', lat: 55.86, lng: -4.25, cat: 'Scotland', pop: '0.6M' },
  { name: 'Dublin', country: 'Ireland', lat: 53.35, lng: -6.26, cat: 'Emerald Isle', pop: '0.6M' },
  { name: 'Paris', country: 'France', lat: 48.86, lng: 2.35, cat: 'Major City', pop: '2.1M' },
  { name: 'Marseille', country: 'France', lat: 43.30, lng: 5.37, cat: 'Mediterranean', pop: '0.9M' },
  { name: 'Lyon', country: 'France', lat: 45.76, lng: 4.84, cat: 'Major City', pop: '0.5M' },
  { name: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.40, cat: 'Capital', pop: '3.7M' },
  { name: 'Munich', country: 'Germany', lat: 48.14, lng: 11.58, cat: 'Bavaria', pop: '1.5M' },
  { name: 'Frankfurt', country: 'Germany', lat: 50.11, lng: 8.68, cat: 'Financial Hub', pop: '0.8M' },
  { name: 'Hamburg', country: 'Germany', lat: 53.55, lng: 9.99, cat: 'Port City', pop: '1.9M' },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.37, lng: 4.89, cat: 'Capital', pop: '0.9M' },
  { name: 'Rotterdam', country: 'Netherlands', lat: 51.92, lng: 4.48, cat: 'Port City', pop: '0.7M' },
  { name: 'Brussels', country: 'Belgium', lat: 50.85, lng: 4.35, cat: 'Capital', pop: '1.2M' },
  { name: 'Rome', country: 'Italy', lat: 41.90, lng: 12.50, cat: 'Capital', pop: '2.8M' },
  { name: 'Milan', country: 'Italy', lat: 45.46, lng: 9.19, cat: 'Fashion Capital', pop: '1.4M' },
  { name: 'Naples', country: 'Italy', lat: 40.85, lng: 14.27, cat: 'Coastal City', pop: '1.0M' },
  { name: 'Florence', country: 'Italy', lat: 43.77, lng: 11.25, cat: 'Tuscany', pop: '0.4M' },
  { name: 'Vienna', country: 'Austria', lat: 48.21, lng: 16.37, cat: 'Capital', pop: '1.9M' },
  { name: 'Zurich', country: 'Switzerland', lat: 47.38, lng: 8.54, cat: 'Major City', pop: '0.4M' },
  { name: 'Geneva', country: 'Switzerland', lat: 46.20, lng: 6.14, cat: 'Alpine City', pop: '0.2M' },
  { name: 'Prague', country: 'Czech Republic', lat: 50.08, lng: 14.44, cat: 'Capital', pop: '1.3M' },
  { name: 'Warsaw', country: 'Poland', lat: 52.23, lng: 21.01, cat: 'Capital', pop: '1.8M' },
  { name: 'Budapest', country: 'Hungary', lat: 47.50, lng: 19.04, cat: 'Capital', pop: '1.8M' },
  { name: 'Stockholm', country: 'Sweden', lat: 59.33, lng: 18.07, cat: 'Capital', pop: '1.0M' },
  { name: 'Oslo', country: 'Norway', lat: 59.91, lng: 10.75, cat: 'Capital', pop: '0.7M' },
  { name: 'Helsinki', country: 'Finland', lat: 60.17, lng: 24.94, cat: 'Capital', pop: '0.7M' },
  { name: 'Copenhagen', country: 'Denmark', lat: 55.68, lng: 12.57, cat: 'Capital', pop: '0.6M' },
  { name: 'Reykjavík', country: 'Iceland', lat: 64.15, lng: -21.94, cat: 'Subpolar Capital', pop: '0.1M' },
  { name: 'Athens', country: 'Greece', lat: 37.98, lng: 23.73, cat: 'Capital', pop: '3.1M' },
  { name: 'Istanbul', country: 'Turkey', lat: 41.01, lng: 28.98, cat: 'Bosphorus Metropolis', pop: '16M' },
  { name: 'Ankara', country: 'Turkey', lat: 39.93, lng: 32.86, cat: 'Capital', pop: '5.8M' },
  { name: 'Izmir', country: 'Turkey', lat: 38.42, lng: 27.14, cat: 'Aegean Coast', pop: '4.4M' },
  { name: 'Antalya', country: 'Turkey', lat: 36.89, lng: 30.71, cat: 'Mediterranean Coast', pop: '2.5M' },

  // North America
  { name: 'New York City', country: 'United States', lat: 40.71, lng: -74.01, cat: 'Major City', pop: '8.8M' },
  { name: 'Los Angeles', country: 'United States', lat: 34.05, lng: -118.24, cat: 'Major City', pop: '3.9M' },
  { name: 'Chicago', country: 'United States', lat: 41.88, lng: -87.63, cat: 'Great Lakes', pop: '2.7M' },
  { name: 'Houston', country: 'United States', lat: 29.76, lng: -95.37, cat: 'Gulf Coast', pop: '2.3M' },
  { name: 'Phoenix', country: 'United States', lat: 33.45, lng: -112.07, cat: 'Desert Valley', pop: '1.6M' },
  { name: 'Philadelphia', country: 'United States', lat: 39.95, lng: -75.17, cat: 'Major City', pop: '1.6M' },
  { name: 'San Antonio', country: 'United States', lat: 29.42, lng: -98.49, cat: 'Major City', pop: '1.5M' },
  { name: 'San Diego', country: 'United States', lat: 32.72, lng: -117.16, cat: 'Pacific Coast', pop: '1.4M' },
  { name: 'Dallas', country: 'United States', lat: 32.78, lng: -96.80, cat: 'Major City', pop: '1.3M' },
  { name: 'San Francisco', country: 'United States', lat: 37.77, lng: -122.42, cat: 'Bay Area', pop: '0.8M' },
  { name: 'Seattle', country: 'United States', lat: 47.61, lng: -122.33, cat: 'Pacific NW', pop: '0.7M' },
  { name: 'Portland', country: 'United States', lat: 45.52, lng: -122.68, cat: 'Pacific NW', pop: '0.6M' },
  { name: 'Austin', country: 'United States', lat: 30.27, lng: -97.74, cat: 'Major City', pop: '1.0M' },
  { name: 'Denver', country: 'United States', lat: 39.74, lng: -104.99, cat: 'Mile High City', pop: '0.7M' },
  { name: 'Boston', country: 'United States', lat: 42.36, lng: -71.06, cat: 'Major City', pop: '0.7M' },
  { name: 'Washington D.C.', country: 'United States', lat: 38.91, lng: -77.04, cat: 'Capital', pop: '0.7M' },
  { name: 'Miami', country: 'United States', lat: 25.76, lng: -80.19, cat: 'Subtropical', pop: '0.4M' },
  { name: 'Atlanta', country: 'United States', lat: 33.75, lng: -84.39, cat: 'Major City', pop: '0.5M' },
  { name: 'New Orleans', country: 'United States', lat: 29.95, lng: -90.07, cat: 'Gulf Coast', pop: '0.4M' },
  { name: 'Honolulu', country: 'United States', lat: 21.31, lng: -157.86, cat: 'Pacific Island', pop: '0.4M' },
  { name: 'Toronto', country: 'Canada', lat: 43.65, lng: -79.38, cat: 'Major City', pop: '2.8M' },
  { name: 'Montreal', country: 'Canada', lat: 45.50, lng: -73.57, cat: 'Major City', pop: '1.8M' },
  { name: 'Vancouver', country: 'Canada', lat: 49.28, lng: -123.12, cat: 'Pacific Coast', pop: '0.7M' },
  { name: 'Calgary', country: 'Canada', lat: 51.05, lng: -114.07, cat: 'Major City', pop: '1.3M' },
  { name: 'Mexico City', country: 'Mexico', lat: 19.43, lng: -99.13, cat: 'Megacity', pop: '22M' },
  { name: 'Guadalajara', country: 'Mexico', lat: 20.68, lng: -103.35, cat: 'Major City', pop: '5.2M' },
  { name: 'Monterrey', country: 'Mexico', lat: 25.69, lng: -100.32, cat: 'Major City', pop: '5.3M' },
  { name: 'Havana', country: 'Cuba', lat: 23.11, lng: -82.37, cat: 'Caribbean Capital', pop: '2.1M' },
  { name: 'Panama City', country: 'Panama', lat: 8.98, lng: -79.52, cat: 'Tropical Capital', pop: '1.5M' },

  // South America
  { name: 'São Paulo', country: 'Brazil', lat: -23.55, lng: -46.63, cat: 'Megacity', pop: '22M' },
  { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.91, lng: -43.17, cat: 'Coastal Atlantic', pop: '6.7M' },
  { name: 'Brasília', country: 'Brazil', lat: -15.79, lng: -47.88, cat: 'Capital', pop: '3.1M' },
  { name: 'Salvador', country: 'Brazil', lat: -12.97, lng: -38.51, cat: 'Coastal Atlantic', pop: '2.9M' },
  { name: 'Manaus', country: 'Brazil', lat: -3.12, lng: -60.02, cat: 'Amazon Capital', pop: '2.2M' },
  { name: 'Belém', country: 'Brazil', lat: -1.45, lng: -48.50, cat: 'Amazon Estuary', pop: '1.5M' },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.60, lng: -58.38, cat: 'Major City', pop: '15M' },
  { name: 'Santiago', country: 'Chile', lat: -33.45, lng: -70.67, cat: 'Andean Capital', pop: '6.2M' },
  { name: 'Bogotá', country: 'Colombia', lat: 4.71, lng: -74.07, cat: 'Andean Capital', pop: '7.9M' },
  { name: 'Medellín', country: 'Colombia', lat: 6.25, lng: -75.56, cat: 'Valley of Eternal Spring', pop: '2.5M' },
  { name: 'Lima', country: 'Peru', lat: -12.05, lng: -77.04, cat: 'Pacific Coast', pop: '9.7M' },
  { name: 'Cusco', country: 'Peru', lat: -13.53, lng: -71.97, cat: 'Andean City', pop: '0.4M' },
  { name: 'Quito', country: 'Ecuador', lat: -0.18, lng: -78.47, cat: 'Equatorial Capital', pop: '2.8M' },
  { name: 'Caracas', country: 'Venezuela', lat: 10.49, lng: -66.88, cat: 'Capital', pop: '2.9M' },
  { name: 'Montevideo', country: 'Uruguay', lat: -34.90, lng: -56.16, cat: 'Capital', pop: '1.4M' },

  // Asia & Middle East
  { name: 'Tokyo', country: 'Japan', lat: 35.68, lng: 139.76, cat: 'Megacity', pop: '37M' },
  { name: 'Osaka', country: 'Japan', lat: 34.69, lng: 135.50, cat: 'Major City', pop: '2.7M' },
  { name: 'Kyoto', country: 'Japan', lat: 35.01, lng: 135.77, cat: 'Historic City', pop: '1.5M' },
  { name: 'Seoul', country: 'South Korea', lat: 37.57, lng: 126.98, cat: 'Major City', pop: '9.7M' },
  { name: 'Busan', country: 'South Korea', lat: 35.18, lng: 129.08, cat: 'Coastal City', pop: '3.4M' },
  { name: 'Beijing', country: 'China', lat: 39.90, lng: 116.40, cat: 'Capital', pop: '21M' },
  { name: 'Shanghai', country: 'China', lat: 31.23, lng: 121.47, cat: 'Megacity', pop: '28M' },
  { name: 'Guangzhou', country: 'China', lat: 23.13, lng: 113.26, cat: 'Pearl River Delta', pop: '18M' },
  { name: 'Shenzhen', country: 'China', lat: 22.54, lng: 114.06, cat: 'Tech Megacity', pop: '17M' },
  { name: 'Chengdu', country: 'China', lat: 30.57, lng: 104.07, cat: 'Sichuan Basin', pop: '16M' },
  { name: 'Chongqing', country: 'China', lat: 29.56, lng: 106.55, cat: 'Mountain Megacity', pop: '32M' },
  { name: 'Hong Kong', country: 'China', lat: 22.32, lng: 114.17, cat: 'Subtropical Megacity', pop: '7.5M' },
  { name: 'Taipei', country: 'Taiwan', lat: 25.03, lng: 121.56, cat: 'Subtropical City', pop: '2.6M' },
  { name: 'Singapore', country: 'Singapore', lat: 1.35, lng: 103.82, cat: 'Equatorial City', pop: '5.9M' },
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.14, lng: 101.69, cat: 'Tropical City', pop: '1.8M' },
  { name: 'Bangkok', country: 'Thailand', lat: 13.76, lng: 100.50, cat: 'Monsoon City', pop: '10.5M' },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.21, lng: 106.84, cat: 'Tropical Megacity', pop: '33M' },
  { name: 'Surabaya', country: 'Indonesia', lat: -7.25, lng: 112.75, cat: 'Port City', pop: '3.0M' },
  { name: 'Manila', country: 'Philippines', lat: 14.60, lng: 120.98, cat: 'Typhoon Zone', pop: '14M' },
  { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.82, lng: 106.63, cat: 'Tropical Delta', pop: '9.3M' },
  { name: 'Hanoi', country: 'Vietnam', lat: 21.03, lng: 105.83, cat: 'Subtropical Capital', pop: '8.4M' },
  { name: 'Yangon', country: 'Myanmar', lat: 16.87, lng: 96.20, cat: 'Monsoon Delta', pop: '5.4M' },
  { name: 'Phnom Penh', country: 'Cambodia', lat: 11.56, lng: 104.92, cat: 'Mekong Capital', pop: '2.2M' },
  { name: 'Delhi', country: 'India', lat: 28.61, lng: 77.21, cat: 'Megacity', pop: '32M' },
  { name: 'Mumbai', country: 'India', lat: 19.08, lng: 72.88, cat: 'Monsoon Megacity', pop: '21M' },
  { name: 'Bangalore', country: 'India', lat: 12.97, lng: 77.59, cat: 'Tech Capital', pop: '12M' },
  { name: 'Kolkata', country: 'India', lat: 22.57, lng: 88.36, cat: 'Bengal Delta', pop: '15M' },
  { name: 'Chennai', country: 'India', lat: 13.08, lng: 80.27, cat: 'Coromandel Coast', pop: '11M' },
  { name: 'Hyderabad', country: 'India', lat: 17.39, lng: 78.49, cat: 'Major City', pop: '10M' },
  { name: 'Kochi', country: 'India', lat: 9.93, lng: 76.27, cat: 'Malabar Monsoon', pop: '3.2M' },
  { name: 'Moradabad', country: 'India', lat: 28.84, lng: 78.78, cat: 'Industrial City', pop: '0.9M' },
  { name: 'Dhaka', country: 'Bangladesh', lat: 23.81, lng: 90.41, cat: 'Monsoon Megacity', pop: '22M' },
  { name: 'Karachi', country: 'Pakistan', lat: 24.86, lng: 67.01, cat: 'Arabian Sea Megacity', pop: '16M' },
  { name: 'Lahore', country: 'Pakistan', lat: 31.55, lng: 74.36, cat: 'Major City', pop: '13M' },
  { name: 'Islamabad', country: 'Pakistan', lat: 33.68, lng: 73.04, cat: 'Capital', pop: '1.2M' },
  { name: 'Colombo', country: 'Sri Lanka', lat: 6.93, lng: 79.86, cat: 'Monsoon Coast', pop: '0.8M' },
  { name: 'Kathmandu', country: 'Nepal', lat: 27.72, lng: 85.32, cat: 'Himalayan Capital', pop: '1.5M' },
  { name: 'Dubai', country: 'United Arab Emirates', lat: 25.20, lng: 55.27, cat: 'Desert Metropolis', pop: '3.5M' },
  { name: 'Abu Dhabi', country: 'United Arab Emirates', lat: 24.45, lng: 54.38, cat: 'Capital', pop: '1.5M' },
  { name: 'Doha', country: 'Qatar', lat: 25.29, lng: 51.53, cat: 'Gulf Coast', pop: '2.4M' },
  { name: 'Riyadh', country: 'Saudi Arabia', lat: 24.71, lng: 46.68, cat: 'Arid Capital', pop: '7.6M' },
  { name: 'Kuwait City', country: 'Kuwait', lat: 29.38, lng: 47.98, cat: 'Capital', pop: '3.0M' },
  { name: 'Muscat', country: 'Oman', lat: 23.59, lng: 58.41, cat: 'Gulf Coast', pop: '1.6M' },
  { name: 'Beirut', country: 'Lebanon', lat: 33.89, lng: 35.50, cat: 'Mediterranean', pop: '2.2M' },
  { name: 'Tel Aviv', country: 'Israel', lat: 32.08, lng: 34.78, cat: 'Mediterranean', pop: '0.5M' },

  // Africa
  { name: 'Cairo', country: 'Egypt', lat: 30.04, lng: 31.24, cat: 'Arid Megacity', pop: '20M' },
  { name: 'Alexandria', country: 'Egypt', lat: 31.20, lng: 29.92, cat: 'Mediterranean Coast', pop: '5.2M' },
  { name: 'Lagos', country: 'Nigeria', lat: 6.52, lng: 3.38, cat: 'Atlantic Tropical', pop: '15M' },
  { name: 'Kinshasa', country: 'DR Congo', lat: -4.44, lng: 15.26, cat: 'Congo Basin', pop: '16M' },
  { name: 'Nairobi', country: 'Kenya', lat: -1.29, lng: 36.82, cat: 'Highland Capital', pop: '4.4M' },
  { name: 'Johannesburg', country: 'South Africa', lat: -26.20, lng: 28.04, cat: 'Major City', pop: '5.6M' },
  { name: 'Cape Town', country: 'South Africa', lat: -33.92, lng: 18.42, cat: 'Coastal City', pop: '4.6M' },
  { name: 'Addis Ababa', country: 'Ethiopia', lat: 9.03, lng: 38.74, cat: 'Highland Capital', pop: '5.0M' },
  { name: 'Casablanca', country: 'Morocco', lat: 33.57, lng: -7.59, cat: 'Atlantic Coast', pop: '3.7M' },
  { name: 'Algiers', country: 'Algeria', lat: 36.75, lng: 3.06, cat: 'Mediterranean', pop: '3.0M' },
  { name: 'Accra', country: 'Ghana', lat: 5.60, lng: -0.19, cat: 'Atlantic Coast', pop: '2.5M' },
  { name: 'Dakar', country: 'Senegal', lat: 14.72, lng: -17.47, cat: 'Atlantic Coast', pop: '3.9M' },
  { name: 'Dar es Salaam', country: 'Tanzania', lat: -6.79, lng: 39.28, cat: 'Indian Ocean', pop: '6.4M' },

  // Oceania
  { name: 'Sydney', country: 'Australia', lat: -33.87, lng: 151.21, cat: 'Major City', pop: '5.3M' },
  { name: 'Melbourne', country: 'Australia', lat: -37.81, lng: 144.96, cat: 'Major City', pop: '5.1M' },
  { name: 'Brisbane', country: 'Australia', lat: -27.47, lng: 153.03, cat: 'Pacific Coast', pop: '2.6M' },
  { name: 'Perth', country: 'Australia', lat: -31.95, lng: 115.86, cat: 'Indian Ocean', pop: '2.1M' },
  { name: 'Auckland', country: 'New Zealand', lat: -36.85, lng: 174.76, cat: 'Major City', pop: '1.6M' },
  { name: 'Wellington', country: 'New Zealand', lat: -41.29, lng: 174.78, cat: 'Windy Capital', pop: '0.4M' }
];

// ==========================================
// URBAN ACOUSTIC ECOLOGY & NOISE POLLUTION
// UNEP Frontiers Report & WHO Environmental Guidelines
// ==========================================
export const CITY_NOISE_PROFILES = {
  dhaka: {
    key: 'dhaka',
    name: 'Dhaka',
    country: 'Bangladesh',
    lat: 23.81,
    lng: 90.41,
    rank: 1,
    dBA: 119,
    level: 'Hazardous Deluge',
    color: '#ef4444',
    soundType: 'horns_dense',
    audioSignature: 'Dense cacophony of relentless vehicle horns, un-muffled auto-rickshaws, and bazaar roar.',
    whoComparison: '+66 dB over WHO 53 dB safe threshold (4x human auditory pain threshold)',
    primarySources: 'Continuous pneumatic horn blasts, 2-stroke motorized rickshaws, unregulated traffic density, and construction compressors.',
    natureImpact: 'Completely masks avian communication and mating calls across the Buriganga basin. Migratory delta waterbirds abandon traditional stopovers.',
    humanImpact: 'Over 30% of permanent urban residents suffer irreversible hearing loss, severe hypertension, and persistent sleep fragmentation.',
    solutions: [
      'Strict ban on high-decibel multi-tone electric horns with automated acoustic camera enforcement.',
      'Transition of 100,000+ auto-rickshaws to silent electric battery powertrains.',
      'Creation of linear urban tree barriers (bamboo and banyan belts) along arterial roads to attenuate sound by 8–12 dB.',
      'Decentralization of inter-district bus and truck terminals away from residential educational zones.'
    ]
  },
  moradabad: {
    key: 'moradabad',
    name: 'Moradabad',
    country: 'India',
    lat: 28.84,
    lng: 78.78,
    rank: 2,
    dBA: 114,
    level: 'Hazardous',
    color: '#ef4444',
    soundType: 'industrial_traffic',
    audioSignature: 'Heavy metallic brass beating, industrial forging, and highway freight corridors.',
    whoComparison: '+61 dB above WHO guideline',
    primarySources: 'Cottage brassware manufacturing, metal hammering, highway truck freight, and lack of zoning.',
    natureImpact: 'Drives nocturnal birds and pollinators away from urban riverine corridors along the Ramganga.',
    humanImpact: 'Widespread acoustic trauma among artisanal craftworkers and chronic cardiovascular stress.',
    solutions: [
      'Relocating metal forging and brass beating to acoustic-insulated industrial eco-parks outside residential sectors.',
      'Mandatory sound-dampening acoustic curtains and shock-absorption rubber mats for brass workshops.',
      'Vegetative noise buffer strips with neem and peepal trees along Ramganga road corridors.'
    ]
  },
  islamabad: {
    key: 'islamabad',
    name: 'Islamabad',
    country: 'Pakistan',
    lat: 33.68,
    lng: 73.04,
    rank: 3,
    dBA: 105,
    level: 'Hazardous',
    color: '#ef4444',
    soundType: 'highway_trucks',
    audioSignature: 'High-speed truck engine braking, unmuffled exhaust roar, and arterial expressway noise.',
    whoComparison: '+52 dB above WHO guideline',
    primarySources: 'Heavy interprovincial commercial freight corridors dissecting urban sectors, lack of silencers.',
    natureImpact: 'Disrupts Margalla Hills National Park wildlife corridors; leopards and songbirds avoid foothill edges.',
    humanImpact: 'High prevalence of stress-induced insomnia and cognitive impairment in schools along Expressway.',
    solutions: [
      'Construction of soil berms and planted evergreen acoustic sound walls along the Islamabad Expressway.',
      'Rigorous roadside acoustic emissions testing for heavy diesel transport trucks.',
      'Enforcing strict 40 km/h nighttime speed limits with low-noise friction asphalt.'
    ]
  },
  mumbai: {
    key: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    lat: 19.08,
    lng: 72.88,
    rank: 4,
    dBA: 104,
    level: 'Hazardous',
    color: '#ef4444',
    soundType: 'mumbai',
    audioSignature: 'Relentless auto-rickshaw dual-horn bursts, commuter rail clatter, and intense Arabian Sea monsoonal street roar.',
    whoComparison: '+51 dB above WHO guideline',
    primarySources: 'Auto-rickshaw hydraulic horns, congested Western Express Highway, construction of coastal road project.',
    natureImpact: 'Sanjay Gandhi National Park periphery birds and leopards suffer hearing degradation; mangrove wetland bird counts down 35%.',
    humanImpact: 'High risk of tinnitus, chronic stress, and sleep deprivation among millions living in dense residential quarters.',
    solutions: [
      'Enforcing "No-Honking Days" with automatic decibel cameras at major intersections.',
      'Electrifying 200,000+ auto-rickshaw fleets with quiet brushless motors.',
      'Planting dense coastal mangrove and banyan acoustic buffers along suburban rail tracks.'
    ]
  },
  ho_chi_minh_city: {
    key: 'ho_chi_minh_city',
    name: 'Ho Chi Minh City',
    country: 'Vietnam',
    lat: 10.82,
    lng: 106.63,
    rank: 5,
    dBA: 103,
    level: 'Severe',
    color: '#f97316',
    soundType: 'scooters_swarm',
    audioSignature: 'Continuous buzzing swarm of millions of two-stroke and four-stroke motorcycles and horn chirps.',
    whoComparison: '+50 dB above WHO guideline',
    primarySources: 'Over 8 million registered motorbikes, continuous horn beeping at intersections, street commerce.',
    natureImpact: 'Saigon riverbank acoustic masking forces local bulbuls and tailorbirds to sing at unnatural higher pitches.',
    humanImpact: 'Chronic auditory fatigue and elevated cortisol levels among commuter populations.',
    solutions: [
      'Electrification of city motorcycle fleets through subsidies for e-scooters and battery-swapping stations.',
      'Urban green canopy restoration along major boulevards to scatter high-frequency scooter engine noise.',
      'Expansion of pedestrian-only zones in District 1 and automated acoustic radar enforcement.'
    ]
  },
  jakarta: {
    key: 'jakarta',
    name: 'Jakarta',
    country: 'Indonesia',
    lat: -6.21,
    lng: 106.84,
    rank: 6,
    dBA: 98,
    level: 'Severe',
    color: '#f97316',
    soundType: 'traffic_heavy',
    audioSignature: 'Millions of commuter scooters, diesel bus exhaust roars, and dense tropical traffic humidity hum.',
    whoComparison: '+45 dB above WHO guideline',
    primarySources: 'Over 15 million motorbikes, gridlocked arterial tollways, unmuffled exhaust modifications.',
    natureImpact: 'Ciliwung river kingfishers and urban swallows pushed out of traditional nesting trees due to low-frequency engine drone.',
    humanImpact: 'Widespread acoustic fatigue, elevated blood pressure, and impaired cognitive development in roadside primary schools.',
    solutions: [
      'Accelerating EV motorcycle transition with public battery swap cabinets.',
      'Expansion of TransJakarta electric bus rapid transit network.',
      'Creating lush vertical green walls on elevated tollway flyover pillars.'
    ]
  },
  delhi: {
    key: 'delhi',
    name: 'Delhi',
    country: 'India',
    lat: 28.61,
    lng: 77.21,
    rank: 7,
    dBA: 96,
    level: 'Severe',
    color: '#f97316',
    soundType: 'horns_dense',
    audioSignature: 'Dense gridlock rumble, rhythmic car horn bursts, and construction machinery hum.',
    whoComparison: '+43 dB above WHO guideline',
    primarySources: 'Over 12 million registered vehicles, relentless pressure honking, generator sets, and infrastructure expansion.',
    natureImpact: 'Delhi Ridge urban forest birds have experienced a 40% reduction in breeding success due to acoustic masking.',
    humanImpact: 'Heightened risk of ischemic heart disease, cognitive developmental delays in roadside schools.',
    solutions: [
      '"No Honking" automated camera zones with steep penalties at traffic intersections.',
      'Installation of transparent acoustic barriers along elevated Delhi Metro lines and flyovers.',
      'Mandatory living green walls on flyover pillars and expansion of dense urban forest corridors.'
    ]
  },
  cairo: {
    key: 'cairo',
    name: 'Cairo',
    country: 'Egypt',
    lat: 30.04,
    lng: 31.24,
    rank: 8,
    dBA: 95,
    level: 'Severe',
    color: '#f97316',
    soundType: 'cairo_horns',
    audioSignature: 'Melodic automotive horn signaling, continuous taxi honks, and reverberant concrete canyons.',
    whoComparison: '+42 dB above WHO guideline',
    primarySources: 'Vehicular horns used as primary collision avoidance, congested ring roads, and open wedding sound systems.',
    natureImpact: 'Nile river corridor bat colonies exhibit foraging confusion and avoid urban riverfront bridge roosts.',
    humanImpact: 'Widespread sleep disturbance; 65% of downtown Cairo residents report chronic daytime tiredness.',
    solutions: [
      'Replacing horn-based driving culture with modern lane markings, roundabouts, and smart traffic lights.',
      'Low-noise asphalt resurfacing along the Ring Road and 6th of October Bridge.',
      'Planting dense rows of date palms and acacias as natural sound barriers along highway ramps.'
    ]
  },
  mexico_city: {
    key: 'mexico_city',
    name: 'Mexico City',
    country: 'Mexico',
    lat: 19.43,
    lng: -99.13,
    rank: 9,
    dBA: 94,
    level: 'Severe',
    color: '#f97316',
    soundType: 'traffic_heavy',
    audioSignature: 'Periférico expressway roar, pesero minibus horns, gas truck bells, and echoing valley acoustics.',
    whoComparison: '+41 dB above WHO guideline',
    primarySources: 'Valley basin topography trapping sound waves, 6 million older combustion vehicles, metro surface lines.',
    natureImpact: 'Chapultepec Park hummingbirds and warblers experience acoustic stress, shifting foraging away from outer park borders.',
    humanImpact: 'Over 4 million residents exposed to dangerous chronic night noise above 65 dB.',
    solutions: [
      'Paving major avenues with sound-absorbing porous asphalt.',
      'Expanding the Cablebús aerial cable car system which runs silently above traffic.',
      'Enforcing noise limits on delivery trucks and street vendors using megaphone speakers.'
    ]
  },
  new_york: {
    key: 'new_york',
    name: 'New York City',
    country: 'United States',
    lat: 40.71,
    lng: -74.01,
    rank: 10,
    dBA: 93,
    level: 'Severe',
    color: '#f97316',
    soundType: 'nyc_sirens',
    audioSignature: 'Yellow cab horns, emergency siren wails, elevated subway squeals, and wet asphalt rumble.',
    whoComparison: '+40 dB above WHO guideline',
    primarySources: 'Subway track curves (wheel-rail friction exceeding 105 dB), emergency sirens, delivery trucks, HVAC chillers.',
    natureImpact: 'Central Park songbirds (such as American Robins and Song Sparrows) must sing at double volume to be heard.',
    humanImpact: 'NYC 311 receives over 400,000 noise complaints annually; associated with chronic hypertension.',
    solutions: [
      'High-frequency track lubricators and acoustic dampers on sharp subway curves to eliminate wheel squeal.',
      'Adoption of low-frequency "rumbler" sirens and directional broadband sound signals for emergency vehicles.',
      'Open-graded friction course (OGFC) porous asphalt on cross-town avenues to absorb tire noise and storm runoff.',
      'Incentives for green roof installations to absorb acoustic reverberation in high-rise skyscraper street canyons.'
    ]
  },
  bogota: {
    key: 'bogota',
    name: 'Bogotá',
    country: 'Colombia',
    lat: 4.71,
    lng: -74.07,
    rank: 11,
    dBA: 92,
    level: 'Severe',
    color: '#f97316',
    soundType: 'traffic_heavy',
    audioSignature: 'TransMilenio diesel bus acceleration hum, motorcycle swarms, and Andean mountain corridor reflections.',
    whoComparison: '+39 dB above WHO guideline',
    primarySources: 'High-density arterial bus corridors (TransMilenio), delivery motorbikes on steep mountain inclines.',
    natureImpact: 'Eastern Hills (Cerros Orientales) songbirds abandon forest edge habitats bordering the Circunvalar highway.',
    humanImpact: 'High rates of reported sleep disturbances and irritability along Avenida Caracas.',
    solutions: [
      'Phasing in 100% electric TransMilenio articulated buses across all trunk lines.',
      'Expanding the world-famous "Ciclovía" car-free network to permanent weekday quiet corridors.',
      'Reforesting Andean hillside borders with native wax palms and alder trees to absorb highway noise.'
    ]
  },
  los_angeles: {
    key: 'los_angeles',
    name: 'Los Angeles',
    country: 'United States',
    lat: 34.05,
    lng: -118.24,
    rank: 12,
    dBA: 91,
    level: 'Severe',
    color: '#f97316',
    soundType: 'highway_trucks',
    audioSignature: 'Multi-lane freeway concrete rumble, police helicopter rotors, tire whine, and siren echoes.',
    whoComparison: '+38 dB above WHO guideline',
    primarySources: 'Vast freeway network (I-405, I-10, US-101), heavy truck freight from Port of LA, constant helicopter traffic.',
    natureImpact: 'Santa Monica Mountains cougars and migratory birds actively avoid freeway edges by at least 500 meters.',
    humanImpact: 'Significant link between freeway noise pollution and childhood asthma and pediatric learning deficits.',
    solutions: [
      'Diamond grinding of concrete freeway lanes with rubberized asphalt overlays.',
      'Sound barrier walls planted with drought-tolerant native ivy and bougainvillea.',
      'Strict altitude and noise limits on law enforcement and news media helicopter hover zones.'
    ]
  },
  istanbul: {
    key: 'istanbul',
    name: 'Istanbul',
    country: 'Turkey',
    lat: 41.01,
    lng: 28.98,
    rank: 13,
    dBA: 89,
    level: 'High',
    color: '#eab308',
    soundType: 'istanbul',
    audioSignature: 'Bosphorus ferry steam horns, seagulls, hill-climbing automotive revs, and historic street rumble.',
    whoComparison: '+36 dB above WHO guideline',
    primarySources: 'Heavy shipping traffic through Bosphorus strait, bridge approaches, dense hillside street acoustics.',
    natureImpact: 'Underwater engine noise masks echolocation and communication of resident Bosphorus harbor porpoises and dolphins.',
    humanImpact: 'Acoustic fatigue among 16 million residents living near major highway arteries and ferry piers.',
    solutions: [
      'Transitioning urban maritime ferries to electric and hybrid propulsion with quiet underwater propeller design.',
      'Expanding tree-lined green buffers along E-5 and TEM highways.',
      'Pedestrianizing historic peninsula streets in Fatih and Beyoğlu.'
    ]
  },
  sao_paulo: {
    key: 'sao_paulo',
    name: 'São Paulo',
    country: 'Brazil',
    lat: -23.55,
    lng: -46.63,
    rank: 14,
    dBA: 88,
    level: 'High',
    color: '#eab308',
    soundType: 'traffic_heavy',
    audioSignature: 'Avenue gridlock, delivery motorbike buzz, and frequent commercial helicopter rotors overhead.',
    whoComparison: '+35 dB above WHO guideline',
    primarySources: 'Over 7 million automobiles, world largest urban helicopter fleet (over 500 aircraft), arterial expressways.',
    natureImpact: 'Atlantic Forest remnants in Cantareira experience reduced avian dispersal as birds avoid noisy periphery.',
    humanImpact: 'High incidence of cardiovascular hospitalizations linked to chronic expressway exposure.',
    solutions: [
      'Strict altitude and route regulations for urban helicopter corridors away from hospitals and schools.',
      'Dedicated acoustic barriers on Marginal Tietê and Pinheiros expressways.',
      'Expansion of exclusive bus rapid transit (BRT) lanes with quiet electric articulated buses.'
    ]
  },
  rome: {
    key: 'rome',
    name: 'Rome',
    country: 'Italy',
    lat: 41.90,
    lng: 12.50,
    rank: 15,
    dBA: 86,
    level: 'High',
    color: '#eab308',
    soundType: 'rome',
    audioSignature: 'High-pitched Vespa scooter revs, stone alleyway reverberations, ambulance sirens, and lively piazzas.',
    whoComparison: '+33 dB above WHO guideline',
    primarySources: 'Cobblestone (sampietrini) road vibration, dense scooter traffic, narrow Renaissance street canyons.',
    natureImpact: 'Tiber river waterfowl and Villa Borghese blackcaps experience mating call masking during peak commute hours.',
    humanImpact: 'High self-reported annoyance and insomnia in historic central quarters (Trastevere, Centro Storico).',
    solutions: [
      'Replacing loose basalt sampietrini cobblestones with vibration-dampened sound-absorbing stone paving.',
      'Incentivizing electric Vespa and scooter conversions with free central parking.',
      'Expanding low-emission and limited-traffic zones (ZTL) across the entire UNESCO historical perimeter.'
    ]
  },
  barcelona: {
    key: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    lat: 41.39,
    lng: 2.17,
    rank: 16,
    dBA: 85,
    level: 'High',
    color: '#eab308',
    soundType: 'barcelona',
    audioSignature: 'Eixample grid street echo, motorbike acceleration, metro rumblings, and seaside traffic.',
    whoComparison: '+32 dB above WHO guideline',
    primarySources: 'Dense Cerdà grid canyon effect, Ronda Litoral ring road, high motorcycle ownership per capita.',
    natureImpact: 'Montjuïc and Ciutadella park wildlife isolated from urban green corridors due to noisy perimeter roads.',
    humanImpact: 'More than 55% of Barcelona citizens exposed to daytime noise levels exceeding 65 dB.',
    solutions: [
      'Expansion of the revolutionary "Superblocks" (Superilles) prioritizing pedestrians and quiet green spaces.',
      'Automated acoustic noise radars targeting modified motorcycle exhausts.',
      'Speed limits reduced to 30 km/h and 10 km/h within neighborhood interiors.'
    ]
  },
  madrid: {
    key: 'madrid',
    name: 'Madrid',
    country: 'Spain',
    lat: 40.42,
    lng: -3.70,
    rank: 17,
    dBA: 84,
    level: 'Moderate-High',
    color: '#eab308',
    soundType: 'madrid',
    audioSignature: 'Puerta del Sol church bells, Gran Vía traffic roar, delivery mopeds, and bustling nighttime terraces.',
    whoComparison: '+31 dB above WHO guideline',
    primarySources: 'M-30 orbital highway, Gran Vía traffic corridor, dense nightlife terraces in Malasaña and La Latina.',
    natureImpact: 'Retiro Park avian biodiversity thrives inside the park interior but drops sharply within 150m of perimeter avenues.',
    humanImpact: 'Madrid Salud reports chronic sleep disruption in 22% of central district households.',
    solutions: [
      'Undergrounding major highway segments (like Madrid Río transformation along the Manzanares).',
      'Madrid 360 Low Emission Zone prohibiting polluting and noisy vehicles from entering central ring.',
      'Installation of vertical green barriers and acoustic absorbing asphalt on Gran Vía and Paseo del Prado.'
    ]
  },
  paris: {
    key: 'paris',
    name: 'Paris',
    country: 'France',
    lat: 48.86,
    lng: 2.35,
    rank: 18,
    dBA: 83,
    level: 'Moderate',
    color: '#eab308',
    soundType: 'paris',
    audioSignature: 'Stone street tire hum, buzzing delivery scooters, café murmur, and gentle Seine rain.',
    whoComparison: '+30 dB above WHO guideline',
    primarySources: 'Boulevard Périphérique ring road, delivery scooters on cobblestones, dense limestone street reflections.',
    natureImpact: 'Parisian blackbirds shift their daily song timing by 2 hours into the pre-dawn quiet to avoid morning traffic noise.',
    humanImpact: 'Bruitparif sensors document over 80% of residents exposed to levels exceeding European Union thresholds.',
    solutions: [
      'Citywide 30 km/h speed limit and progressive pedestrianization of central arrondissements.',
      'Installation of "Medusa" directional acoustic noise radars that automatically fine excessively loud motorbikes.',
      'Replacement of noisy street surfaces with whisper-quiet rubberized sound-absorbing asphalt.'
    ]
  },
  london: {
    key: 'london',
    name: 'London',
    country: 'United Kingdom',
    lat: 51.51,
    lng: -0.13,
    rank: 19,
    dBA: 82,
    level: 'Moderate',
    color: '#eab308',
    soundType: 'london_cabs',
    audioSignature: 'Diesel black cabs, red double-decker bus hiss, distant Big Ben chimes, and tube vibrations.',
    whoComparison: '+29 dB above WHO guideline',
    primarySources: 'Diesel taxis and buses, underground tube ground-borne vibration, Heathrow arrival flight paths.',
    natureImpact: 'European robins in central London now regularly sing at night under streetlights because day traffic is too loud.',
    humanImpact: 'Estimated loss of 5,000 disability-adjusted life years (DALYs) annually in Greater London due to environmental noise.',
    solutions: [
      'Transition to zero-emission electric black cabs (LEVC) and expanding electric bus fleets.',
      'Designation of London Quiet Areas and acoustic sanctuaries across Royal Parks.',
      'Soundproofing grants for homes beneath primary airport approach funnels.'
    ]
  },
  tokyo: {
    key: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    lat: 35.68,
    lng: 139.76,
    rank: 20,
    dBA: 76,
    level: 'Moderate-Low',
    color: '#10b981',
    soundType: 'tokyo',
    audioSignature: 'Smooth electric commuter trains, gentle Shibuya crossing acoustic chimes, and disciplined traffic.',
    whoComparison: '+23 dB above WHO guideline (Remarkably quiet for world\'s largest megacity)',
    primarySources: 'High-density expressways (Shuto Expressway), elevated commuter rail, construction sites.',
    natureImpact: 'Abundant Japanese white-eyes and brown-eared bulbuls coexist in neighborhood pocket parks and temple groves.',
    humanImpact: 'Low honking culture and widespread double-glazed soundproof glass maintain serene indoor environments.',
    solutions: [
      'Extensive double-decked tunnel infrastructure routing noisy expressways deep underground.',
      'Universal adoption of acoustic crosswalk chimes ("Piyo-Piyo" and "Kakko") designed to minimize neighborhood spillage.',
      'Continuous acoustic vibration absorption pads under Yamanote Line and subway rail tracks.'
    ]
  },
  berlin: {
    key: 'berlin',
    name: 'Berlin',
    country: 'Germany',
    lat: 52.52,
    lng: 13.40,
    rank: 21,
    dBA: 74,
    level: 'Low',
    color: '#10b981',
    soundType: 'berlin',
    audioSignature: 'Broad leafy boulevards, quiet electric trams, bicycle bells, and wet cobblestone patter.',
    whoComparison: '+21 dB above WHO guideline',
    primarySources: 'Stadtbahn rail viaduct, arterial avenues, localized nightlife clusters in Kreuzberg/Mitte.',
    natureImpact: 'Berlin nightingales thrive in urban parks (Tiergarten), successfully defending territories with high acoustic complexity.',
    humanImpact: 'Comprehensive citywide "Lärmaktionsplan" (Noise Action Plan) protecting residential sleep zones.',
    solutions: [
      'Grass-covered tram tracks ("Rasenweiche") that absorb rail rattle and improve urban stormwater infiltration.',
      'Strict 30 km/h nighttime speed limits on over 80% of primary residential roads.',
      'Expansion of protected bike lanes and green corridor buffers connecting city canals.'
    ]
  },
  singapore: {
    key: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    lat: 1.35,
    lng: 103.82,
    rank: 22,
    dBA: 73,
    level: 'Low',
    color: '#10b981',
    soundType: 'singapore_metro',
    audioSignature: 'Whisper-quiet electric MRT trains, tropical garden canopies, and smooth highway flow.',
    whoComparison: '+20 dB above WHO guideline',
    primarySources: 'Expressway transit corridors, construction of high-density housing, tropical air conditioning chillers.',
    natureImpact: 'Smooth integration of urban green corridors allows hornbills and otters to thrive throughout the city.',
    humanImpact: 'Aggressive vehicle quota system (COE) caps automobile growth at 0%, preventing unchecked congestion.',
    solutions: [
      'Extensive semi-enclosed acoustic noise barriers installed along elevated MRT tracks next to housing estates.',
      'Biophilic architectural guidelines requiring vertical sky gardens that diffuse canyon sound reflections.',
      'Subterranean road network (Marina Coastal Expressway) routing heavy freight away from ground level.'
    ]
  },
  oslo: {
    key: 'oslo',
    name: 'Oslo',
    country: 'Norway',
    lat: 59.91,
    lng: 10.75,
    rank: 23,
    dBA: 69,
    level: 'Very Low',
    color: '#10b981',
    soundType: 'oslo_electric',
    audioSignature: 'Silent electric vehicles, gentle fjord breezes, quiet electric ferries, and tranquil streets.',
    whoComparison: '+16 dB above WHO guideline (One of the quietest capitals on Earth)',
    primarySources: 'Ring 3 expressway, winter studded tire friction on pavement.',
    natureImpact: 'City parks and fjord shorelines host diverse migratory waterfowl and forest birds undisturbed by transit noise.',
    humanImpact: 'Exceptionally low cardiovascular and sleep disturbance rates attributed to urban noise.',
    solutions: [
      'Over 85% of all new car sales are fully electric, eliminating combustion engine noise at low city speeds.',
      'Pedestrianized "Car-Free Livability" zone in Oslo city center with removed street parking.',
      'Electric zero-emission passenger ferries operating silently across the Oslofjord.'
    ]
  },
  amsterdam: {
    key: 'amsterdam',
    name: 'Amsterdam',
    country: 'Netherlands',
    lat: 52.37,
    lng: 4.89,
    rank: 24,
    dBA: 67,
    level: 'World Model Benchmark',
    color: '#10b981',
    soundType: 'amsterdam',
    audioSignature: 'Gentle bicycle bell pings, canal water lapping, pedestrian footsteps, and peaceful urban quiet.',
    whoComparison: '+14 dB above WHO guideline (Lowest noise among major European metropolises)',
    primarySources: 'A10 highway ring, Schiphol airport departure lanes, localized tourist center nightlife.',
    natureImpact: 'Urban biodiversity thrives; coots, herons, and song thrushes nest directly along canal walls.',
    humanImpact: 'High self-reported acoustic satisfaction and healthy active lifestyles with low transport-related stress.',
    solutions: [
      'Over 60% of all daily journeys taken by bicycle on dedicated, separated cycling superhighways.',
      'Citywide 30 km/h speed limit implemented in 2023, cutting urban traffic noise in half (-3 dB).',
      'Extensive canal-side tree planting (willows and elms) providing natural acoustic diffusion and carbon capture.'
    ]
  }
};

export function getLeaderboardCities() {
  return Object.values(CITY_NOISE_PROFILES).sort((a, b) => a.rank - b.rank);
}

export function getCityNoiseData(locationName, lng, lat) {
  if (locationName) {
    const locLower = locationName.toLowerCase();
    for (const [key, profile] of Object.entries(CITY_NOISE_PROFILES)) {
      if (locLower.includes(profile.name.toLowerCase()) || locLower.includes(key.replace(/_/g, ' '))) {
        return profile;
      }
    }
  }

  if (lng != null && lat != null) {
    for (const profile of Object.values(CITY_NOISE_PROFILES)) {
      const dLng = lng - profile.lng;
      const dLat = lat - profile.lat;
      if (dLng * dLng + dLat * dLat < 0.20) {
        return profile;
      }
    }
  }

  return null;
}


// ==========================================
// ACCURATE 1-DEGREE GLOBAL LAND MASK
// Generated from Natural Earth 110m vector dataset
// ==========================================
export const LAND_MASK_B64 = "////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////f///////////////////////////////////////////////////////3x8AAP7///////////////////////////////////////////////////8/AAAA/P///////////////////////////////////////////////////x8AAAAA+P//////////////4f///////////////////////////////////wAAAAAA/v////////////8HAAD4////////////////////////////////HwAAAAAAAP7//////////wf8wD8AwP//////////////////////////////DwAAAAAcgP//////////fwAAAP4BwP//////////////////////////////HwAAAACH////////////PwAAAPgA/////////////////////////////////wcAAADA/////////////wEAAAAA8P///////////////////////////////wAAAAAAAPz//////////z8AAAAAAP///////////////////////////////wAAAAAAAPz///////////8HAAAAAAD+/////////////////////////////wAAAAAAAADwv/MXgP////8fAAAAAADw/////////////////////////////wMAAAAAAAAAYAYA4ON/OPh/AAAAAADw/////////////////////////////x8AAAAAAAAAAAAAAAAAAAB+AAAAAACA/////////////////////////////38AAAAAAAAAAAAAAAAAAP5+AAAAAAAA5v////////////D//////////////38AAAAAAAAAAAAAAAAAAHA/AAAAAAAAAAA8//P//////+D/////////////HwAAAAAAAAAAAAAAAAAAADAfAAAAAAAAAAAAAADw8////wP+////////////AwAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAgP///wH4//////////8DAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAPD/AADA/////////z8AAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAIAfAAAAAAAeeADADwAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4AAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8AAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP4DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHgAAAAAAAAAAAAAAAAAAPwHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAPgHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAMABAAAAAAAAAAAAAAAAAPwfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAIADAAAAAAAAAAAAAAAAAPwHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAALAAAAAAAAAAAAAAAAAPw/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAPg/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAPj/AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGgAAAA4AAAAAAAAAAAAAAAAAPz/BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8DAAAIAAAAAAAAAAAAAAAAAPj/BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8DAAAEAAAAAAAAAAAAAAAAAPj/BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwP8DAAACAAAAAAAAAAAAAAAAAPD/OwAAAAAAAAAAgAEAAAAAAAAAAAAAAAcA6P8HAAAAAAAAAAAAAAAAAAAAAPD/fwAAAAAAAAAAwH8AAAAAAAAAAAAAgP8A2P8HAAAAAAAAAAAAAAAAAAAAAOD//wAAAAAAAAAAwP8BAAAAAAAAAAAAAP8D/P8PAAAAAAAAAAAAAAAAAAAAAPD//wEAAAAAAAAAwP8DAAAAAAAAAAAAAP////8fAAAAAAAAAAAAAAAAAAAAAPD//wMAAAAAAAAA4P8HAAAAAAAAAAAAgP////8fAAAAAAAAAAAAAAAAAAAAAOD//wMAAAAAAAAA4P8HAAAAAAAAAAAAgP////8fAAAAAAAAAAAAAAAAAAAAAOD//wcAAAAAAAAA8P8PAAAAAAAAAAAAgP////8/AAAAAAAAAAAAAAAAAAAAAOD//wcAAAAAAAAA+P8fAAAAAAAAAAAAwP////8fAAAAAAAAAAAAAAAAAAAAAOD//wcAAAAAAAAA+P8fAAAAAAAAAAAA4P////8fAAAAAAAAAAAAAAAAAAAAAOD//w8AAAAAAAAA+P8fAAIAAAAAAAAAwP////8fAAAAAAAAAAAAAAAAAAAAAOD//x8AAAAAAAAA+P9/AAcAAAAAAAAA4P////8PAAAAAAAAAAAAAAAAAAAAAMD//38AAAAAAAAA/P9/AA8AAAAAAAAAwP////8HAAAAAAAAAAAAAAAAAAAAAMD///8DAAAAAAAA/P//gA8AAAAAAAAAwP////8DAAAAAAAAAAAAAAAAAAAAAMD///8HAAAAAAAA/P9/gA8AAAAAAAAAgP////8BAAIAAAAAAAAAAAAAAAAAAMD///8PAAAAAAAA/v9/AB8AAAAAAAAAAPz///8BAAEAAAAAAAAAAAAAAAAAAMD///8PAAAAAAAA/v9/AB8AAAAAAAAAAOD//38AAAAAAAAAAAAAAAAAAAAAAMD///8PAAAAAAAA////AB8AAAAAAAAAAMD//z8AAAAAAAAAAAAAAAAAAAAAAOD///8fAAAAAAAA////Ax8AAAAAAAAAAMD//z4AAABAAAAAAAAAAAAAAAAAAPj///8fAAAAAAAA////Dz8AAAAAAAAAAAD/Pz4AAAiAAAAAAAAAAAAAAAAAAP7///8fAAAAAAAA////DzgAAAAAAAAAAAD/DxwAAAAAAAAAAAAAAAAAAAAAAP////8fAAAAAAAA////HzAAAAAAAAAAAADsDxwAAAAAAAAAAAAAAAAAAAAAAP////8fAAAAAAAA/v//HyAAAAAAAAAAAADADwwAAAAAAAAAAAAAAAAAAAAAgP////8/AAAAAAAA/v//HyAAAAAAAAAAAACAHwQAAAAAAAAAAAAAAAAAAAAAgP////9/AAAAAAAA/P//DwAAAAAAAAAAAAAAAQQAAAAAAAAAAAAAAAAAAAAAwP//////AAAAAAAA/v//DwAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAA4P//////AAAAAAAA/v//DwAAAAAAAAAAAAgBAIABMAAAAAAAAAAAAAAAAAAA4P//////AQAAAAAA/v//BwAAAAAAAAAAQFYEAMcAAAAAAAAAAAAAAAAAAAAA8P//////AQAAAAAA/v//BwAAAAAAAACAHwAAwH8ABAAAAAAAAAAAAAAAAAAA+P//////AQAAAAAA////BwAAAAAAAADAAQAAxP+AAAAAAAAAAAAAAAAAAAAA+P//////AQAAAAAA////BwAAAAAAAAAwAEAAxD8NAAAAAAAAAAAAAAAAAAAA+P////8/AAAAAACA////BwAAAAAAAAA4AEAA8B8AAAAAAAAAAAAAAAAAAAAA8P////8fAAAAAACA////DwAAAAAAAAA8wChE/gcAAAAAAAAAAAAAAAAAAAAA+P///38BAAAAAADA////HwAAAAAAAAA+/DkA8gAAAAAAAAAAAAAAAAAAAAAA+P///38AAAAAAADg////PwAAAAAAAAAO/DmAAwAAAAAAAAAAAAAAAAAAAAAA8P///wcAAAAAAADg////PwAAAAAAAAAP/gMAAQAAAAAAAAAAAAAAAAAAAAAA8P///wMAAAAAAADg////fwAAAAAAAIAH/vMQAAAAAAAAAAAAAAAAAAAAAAAA4P///wMAAAAAAADg/////wEAAAAAAIAL/gMQAAAAAAAAAAAAAAAAAAAAAAAA4P///wEAAAAAAADA/////wMAAAAAAMAM+AMAAAAAAAAAAAAAAAAAAAAAAAAAgP///wEAAAAAAADA/////wcAAAAAAGAG4AEAAAAAAAAAAAAAAAAAAAAAAAAAgP///wAAAAAAEAD8/////w8AAAAAADAGwAcAAAAAAAAAAAAAAAAAAAAAAAAAwP//fwAAAAAA/A/+/////x8AAAAAAAAHAAcAAAAAAAAAAAAAAAAAAAAAAAAAgP//AwAAAAAA/v///////x8AAAAwAAADAAMBAAAAAAAAAAAAAAAAAAAAAAAAyP//AQAAAACA/////////z8AAAAwAIAAAEAHAAAAAAAAAAAAAAAAAAAAAAAAz///AAAAAACA/////////z8AAAASAMAAAIACAAAAAAAAAAAAAAAAAAAAAAAAE+9/AAAAAADA/////////38AAAAXAEAgAAQCAAAAAAAAAAAAAAAAAAAAAADAAe9TAAAAAADg/////////34AAAAPAEBwAAgAAAAAAAAAAAAAAAAAAAAAAADAAAgAAAAAAADw////////f2AAAAAPAID4AUACAAAAAAAAAAAAAAAAAAAAAADgAQAAAAAAAAD4////////fwAAAIAPAMD8AQABAAAAAAAAAAAAAAAAAAAAAAD8AAAAAAAAAAD4////////vwcAAIAPAMD/AcAAAAAAAAAAAAAAAAAAAAAAAAD/AQAAAAAAAAD4////////nx8AAMAPAMD/ATAAAAAAAAAAAAAAAAAAAAAAAID/AAAAAAAAAAD4////////j/8AAMAPAMD/ATAAAAAAAAAAAAAAAAAAAAAAAP4PAAAAAAAAAAD4////////h/8BAOA/APz/ADAAAAAAAAAAAAAAAAAAAAAAgP8PAAAAAAAAAADw////////x/8HAOB/APx/ADAAAAAAAAAAAAAAAAAAAAAA8J8PAPwCAAAAAADw////////4/8fAOD/APw/AgAAAAAAAAAAAAAAAQAAAAAA+A8eADgAAAAAAADw////////4f8/AOD/Afw/BgAAAAAAAAAAAAAAAAAAAAAA/AccgAEAAAAAAADw////////8f9/AOD/B/5/AAAAAAAAAAAAAAAAAAAAAAAA+AcAYAAAAAAAAAD4////////+f9/APz/B///BgAAAAAAAAAAAAAAAAAAAAAA/AMAHQAAAAAAAADw////////+P//APz/f///fxAAAAAAAAAAAAAAAAAAAAAA/gMAAAAAAAAAAADw////////+P9/AP///////xEAAAAAAAAAAAAAAAAAAAAQ/wMAAAAAAAAAAADg//////9//n8cgP///////ycAAAAAAAAAAAAAAAAAAACQ/wcACAAAAAAAAADg//////9//r+A/////////wcAAAAAAAAAAAAAAAAAAACI/wcALAAAAAAAAADA//////8//z/g/////////w8AAAAAAAAAAAAAAAAAAADu/wcADgAAAAAAAACA//////8f/x/+/////////x8AAAAAAAAAAAAAAAAAAAD0/w8ABgAAAAAAAAAA/v////+//4///////////z8AAAAAAAAAAAAAAAAAAADy/x8GBgAAAAAAAAAA/P/////v/8///////////z8AAAAAAAAAAAAAAAAAAAD5////BwAAAAAAAAAA/P//f////////////////x8AAAAAAAAAAAAAAAAAAID9////BwAAAAAAAAAA/P//D3+E/////////////z9AAAAAAAAAAAAAAAAAAID/////DwAAAAAAAAAA+P//BwaA/////////////x/AAAAAAAAAAAAAAAAAAMD/////HwAAAAAAAAAA8P9/AACA/////////////x/AAwAAAAAAAAAAAAAAAPD/////fwAAAAAAAAAA4P8/AAAA/////////////w+EGwAAAAAAAAAAAAAAAPj//////wAAAAAAAAAAQPx/AAAA/////////////w8Y/gEAAAAAAAAAAAAAAPz//////wAAAAAAAAAAQOB/AAQ2/////////////x8c8AEAAAAAAAAAAAAAAP7//////wAAAAAAAAAA+AcABob//////////////zccwAEAAAAAAAAAAAAAAP7//////wEAAAAAAAAA+A8AAI7//////////////wMOAAEAAAAAAAAAAAAAAP///////wMAAAAAAAAA+A8wEMf//////////////0cOAAMAAAAAAAAAAAAAAP///////wMAAAAAAAAA+B8wuE/+/////////////98fAAMAAAAAAAAAAAAAAP///////x8AAAAAAAAA+D8Aj//w4f////////////8/AAAAAAAAAAAAAAAAAP///////x8AAAAAAAAA+H+Aw/8AwP////////////9/AA8AAAAAAAAAAAAAAP///////z8AAAAAAAAAcPzH8/8A8P//////////////Bx4AAAAAAAAAAAAAAP////////8MAAAAAAAAAPj/+P8B/P//////////////DwQAAAAAAAAAAAAAAP////////9/AAAAAAAAAPj//f9j/v//////////////HwAAAAAAAAAAAAAAAP////////+XAAAAAAAAAPz///93/P//////////////PwwAAAAAAAAAAAAAAP3///////8HUAAAAAAAAP7/////////////////////fwQAAAAAAAAAAAAAAP7//////38HfgAAAAAAgP///////////////////////wQAAAAAAAAAAAAAYP////////8xLAAAAAAAAPz//////////////////////wwAAAAAAAAAAAAA0P//////////DAAAAAAAgOH//////////////////////w0AAAAAAAAAAAAA8P//////7///FwAAAAAAAB///////////////////////wUAAgAAAAAAAAAA8P//////4///DwAAAAAAGD///////////////////////wUAAwAAAAAAAACA+P//////4///DwAAAAAAOA74/////////////////////wUADwAAAIAAAAAA/v//////8///BwAAAAAAOAcgcP//////////////////HwAAHwAAAAAGAAAA//////8/wP//AAAAAAAAwAOwA/7/////////////////DwCAPwAAAAAwAAAA//////8PgP8/AAAAAAAAwAFwD/7/////////////////PwAAfwAAAADADgDA/////38AgP8/AAAAAAAAwANAH/T//////////////////wAAfgAAAACAAwD8/////38AwP8eAAAAAAAAgAGcH/D//////////////////wEAOAAAAAD8MwD//////x8AwH8MAAAAAAAAAAD+P2D///////////////////95cAAAAID///z//////z8AwD8AAMABAAAAAAD+P/z///////////////////9/wH8AAMD//////////z8AwA8AAPgBAAAAAAD+H/7/////////////////////Of8BAID///////////8AQ8ABAPwBAAAAAAD8P/7///////////////////////9fAAP4///////////BBPAHAP4HAAAAAADg//z///////////////////////9/QID4///////////Pw/0DAP8HAMAfAACA//F//v////////////////////8//vD///////////9fAPwYgP8PAOA/AAAA/+N/8P//////////////////////34H8////////////Afw/gP//AQAAAAAA/v+fH////+//////////////////DwD////////////vh/kPwP//BwAAAAAA/P//H/P//5//////////////////AeD///////8DB8TPB/4AAP///wAAAAAA8P//AwDjf77/////////////////AAD+///h/4//H+/Bg/8BwP7//w8AAAAAwP8fAAAAj9///////////////88/AAD4HwAAAAD8H/D4/38A4P///xMAAAAAAPAHAAAAgN//////////////DwAAAQAAAAAAAO//B3f8/wsA4P///z8AAAAAAAAAAAAPAG////////8f2f8HAAAAAAAAAAAAgN9/xzf8RwAA4P///z8AAAAAAAAAAAAPAB7g//////8fgB8AAAAAAAAAAAAAAP8Ahvc5OwAA8P///38AAAAAAAAAAAAcAADg////34cHAAcAAAAAAAAAAAAAAAAMAAD8AgAA+P////8AAAAAAAAAAABwAAAA/P//AwAAAAAAAAAAAAAAAAAAAIC/g7PfBwAA/v////8AAAAAAAAAAADgBwAAwP//PwAA4B8AAAAAAAAAAAAAADzAgPP5H8D//////38AAAAAAAAAAAAA4AEAAAD+DwAAAAAAAAAAAAAAAAAAAOAQACDwP4D///////8BAAAAPAQAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAA4+I73//n///////8AAAAAfwAAAAAAAAAAAAAfAAAAAAAAAAAAAAAAAAAAAAAAAOD//wP8//////8BAACAfx4AAAAAAAAAAP4AAAAAAAAAAAAAAAAAAAAAAAAAAPAH/j/+//////8PAAAAgB0AAHgAAAAAAD8AAAAAAAAAAAAAAAAAAAAAAAAAAAD+///D/////5//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADA/v8/AOD//z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADg/wEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const LAND_MASK_BYTES = Uint8Array.from(atob(LAND_MASK_B64), c => c.charCodeAt(0));

export function isCoordinateLand(lng, lat) {
  const normLng = ((lng + 180) % 360 + 360) % 360 - 180;
  const clampedLat = Math.max(-89.9, Math.min(89.9, lat));
  const lngIdx = Math.floor(normLng + 180);
  const latIdx = Math.floor(clampedLat + 90);
  const bitIdx = latIdx * 360 + lngIdx;
  return (LAND_MASK_BYTES[bitIdx >> 3] & (1 << (bitIdx & 7))) !== 0;
}
