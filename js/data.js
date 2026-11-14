/**
 * Terraphone - Data & Meteorological Profiles
 * NASA Space Apps Challenge · GPM IMERG & NASA SVS 5650
 */

// Canonical NASA GPM IMERG Palette (Precipitation Rate in mm/hr)
export const IMERG_PALETTE = [
  { v: 0.01, rgb: [185, 242, 245] },
  { v: 0.03, rgb: [147, 224, 236] },
  { v: 0.08, rgb: [112, 198, 230] },
  { v: 0.20, rgb: [87, 169, 219] },
  { v: 0.50, rgb: [75, 137, 201] },
  { v: 1.00, rgb: [74, 106, 179] },
  { v: 2.00, rgb: [95, 155, 79] },
  { v: 5.00, rgb: [143, 192, 74] },
  { v: 10.0, rgb: [232, 217, 74] },
  { v: 20.0, rgb: [232, 162, 60] },
  { v: 40.0, rgb: [217, 98, 47] },
  { v: 80.0, rgb: [184, 58, 38] },
  { v: 150.0, rgb: [143, 36, 64] },
  { v: 300.0, rgb: [109, 31, 94] }
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

// Rich Local World Cities Database (300+ locations for zero-latency instant search)
export const CITIES_DATABASE = [
  // Rainiest and extreme weather capitals
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

  // Global Metropolises & Capitals
  { name: 'Tokyo', country: 'Japan', lat: 35.68, lng: 139.76, cat: 'Megacity', pop: '37M' },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.21, lng: 106.84, cat: 'Tropical Megacity', pop: '33M' },
  { name: 'Delhi', country: 'India', lat: 28.61, lng: 77.21, cat: 'Megacity', pop: '32M' },
  { name: 'Mumbai', country: 'India', lat: 19.08, lng: 72.88, cat: 'Monsoon Megacity', pop: '21M' },
  { name: 'São Paulo', country: 'Brazil', lat: -23.55, lng: -46.63, cat: 'Megacity', pop: '22M' },
  { name: 'Mexico City', country: 'Mexico', lat: 19.43, lng: -99.13, cat: 'Megacity', pop: '22M' },
  { name: 'New York City', country: 'United States', lat: 40.71, lng: -74.01, cat: 'Major City', pop: '8.8M' },
  { name: 'London', country: 'United Kingdom', lat: 51.51, lng: -0.13, cat: 'Major City', pop: '9M' },
  { name: 'Paris', country: 'France', lat: 48.86, lng: 2.35, cat: 'Major City', pop: '2.1M' },
  { name: 'Singapore', country: 'Singapore', lat: 1.35, lng: 103.82, cat: 'Equatorial City', pop: '5.9M' },
  { name: 'Seoul', country: 'South Korea', lat: 37.57, lng: 126.98, cat: 'Major City', pop: '9.7M' },
  { name: 'Bangkok', country: 'Thailand', lat: 13.76, lng: 100.50, cat: 'Monsoon City', pop: '10.5M' },
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.14, lng: 101.69, cat: 'Tropical City', pop: '1.8M' },
  { name: 'Manila', country: 'Philippines', lat: 14.60, lng: 120.98, cat: 'Typhoon Zone', pop: '14M' },
  { name: 'Taipei', country: 'Taiwan', lat: 25.03, lng: 121.56, cat: 'Subtropical City', pop: '2.6M' },
  { name: 'Hong Kong', country: 'China', lat: 22.32, lng: 114.17, cat: 'Subtropical Megacity', pop: '7.5M' },
  { name: 'Shanghai', country: 'China', lat: 31.23, lng: 121.47, cat: 'Megacity', pop: '28M' },
  { name: 'Beijing', country: 'China', lat: 39.90, lng: 116.40, cat: 'Capital', pop: '21M' },
  { name: 'Guangzhou', country: 'China', lat: 23.13, lng: 113.26, cat: 'Pearl River Delta', pop: '18M' },
  { name: 'Sydney', country: 'Australia', lat: -33.87, lng: 151.21, cat: 'Major City', pop: '5.3M' },
  { name: 'Melbourne', country: 'Australia', lat: -37.81, lng: 144.96, cat: 'Major City', pop: '5.1M' },
  { name: 'Auckland', country: 'New Zealand', lat: -36.85, lng: 174.76, cat: 'Major City', pop: '1.6M' },
  { name: 'Wellington', country: 'New Zealand', lat: -41.29, lng: 174.78, cat: 'Windy Capital', pop: '0.4M' },
  { name: 'Cairo', country: 'Egypt', lat: 30.04, lng: 31.24, cat: 'Arid Megacity', pop: '20M' },
  { name: 'Lagos', country: 'Nigeria', lat: 6.52, lng: 3.38, cat: 'Atlantic Tropical', pop: '15M' },
  { name: 'Kinshasa', country: 'DR Congo', lat: -4.44, lng: 15.26, cat: 'Congo Basin', pop: '16M' },
  { name: 'Nairobi', country: 'Kenya', lat: -1.29, lng: 36.82, cat: 'Highland Capital', pop: '4.4M' },
  { name: 'Johannesburg', country: 'South Africa', lat: -26.20, lng: 28.04, cat: 'Major City', pop: '5.6M' },
  { name: 'Cape Town', country: 'South Africa', lat: -33.92, lng: 18.42, cat: 'Coastal City', pop: '4.6M' },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.60, lng: -58.38, cat: 'Major City', pop: '15M' },
  { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.91, lng: -43.17, cat: 'Coastal Atlantic', pop: '6.7M' },
  { name: 'Manaus', country: 'Brazil', lat: -3.12, lng: -60.02, cat: 'Amazon Capital', pop: '2.2M' },
  { name: 'Belém', country: 'Brazil', lat: -1.45, lng: -48.50, cat: 'Amazon Estuary', pop: '1.5M' },
  { name: 'Bogotá', country: 'Colombia', lat: 4.71, lng: -74.07, cat: 'Andean Capital', pop: '7.9M' },
  { name: 'Medellín', country: 'Colombia', lat: 6.25, lng: -75.56, cat: 'Valley of Eternal Spring', pop: '2.5M' },
  { name: 'Lima', country: 'Peru', lat: -12.05, lng: -77.04, cat: 'Pacific Coast', pop: '9.7M' },
  { name: 'Santiago', country: 'Chile', lat: -33.45, lng: -70.67, cat: 'Andean Capital', pop: '6.2M' },
  { name: 'Atacama Desert', country: 'Chile', lat: -23.86, lng: -69.13, cat: 'Hyper-Arid', pop: 'Driest desert on Earth' },
  { name: 'Los Angeles', country: 'United States', lat: 34.05, lng: -118.24, cat: 'Major City', pop: '3.9M' },
  { name: 'San Francisco', country: 'United States', lat: 37.77, lng: -122.42, cat: 'Bay Area', pop: '0.8M' },
  { name: 'Seattle', country: 'United States', lat: 47.61, lng: -122.33, cat: 'Pacific NW', pop: '0.7M' },
  { name: 'Portland', country: 'United States', lat: 45.52, lng: -122.68, cat: 'Pacific NW', pop: '0.6M' },
  { name: 'Vancouver', country: 'Canada', lat: 49.28, lng: -123.12, cat: 'Pacific Coast', pop: '0.7M' },
  { name: 'Toronto', country: 'Canada', lat: 43.65, lng: -79.38, cat: 'Major City', pop: '2.8M' },
  { name: 'Montreal', country: 'Canada', lat: 45.50, lng: -73.57, cat: 'Major City', pop: '1.8M' },
  { name: 'Chicago', country: 'United States', lat: 41.88, lng: -87.63, cat: 'Great Lakes', pop: '2.7M' },
  { name: 'Miami', country: 'United States', lat: 25.76, lng: -80.19, cat: 'Subtropical', pop: '0.4M' },
  { name: 'New Orleans', country: 'United States', lat: 29.95, lng: -90.07, cat: 'Gulf Coast', pop: '0.4M' },
  { name: 'Houston', country: 'United States', lat: 29.76, lng: -95.37, cat: 'Gulf Coast', pop: '2.3M' },
  { name: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.40, cat: 'Capital', pop: '3.7M' },
  { name: 'Munich', country: 'Germany', lat: 48.14, lng: 11.58, cat: 'Bavaria', pop: '1.5M' },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.37, lng: 4.89, cat: 'Capital', pop: '0.9M' },
  { name: 'Brussels', country: 'Belgium', lat: 50.85, lng: 4.35, cat: 'Capital', pop: '1.2M' },
  { name: 'Rome', country: 'Italy', lat: 41.90, lng: 12.50, cat: 'Capital', pop: '2.8M' },
  { name: 'Madrid', country: 'Spain', lat: 40.42, lng: -3.70, cat: 'Capital', pop: '3.3M' },
  { name: 'Barcelona', country: 'Spain', lat: 41.39, lng: 2.17, cat: 'Mediterranean', pop: '1.6M' },
  { name: 'Lisbon', country: 'Portugal', lat: 38.72, lng: -9.14, cat: 'Atlantic Coast', pop: '0.5M' },
  { name: 'Dublin', country: 'Ireland', lat: 53.35, lng: -6.26, cat: 'Emerald Isle', pop: '0.6M' },
  { name: 'Edinburgh', country: 'United Kingdom', lat: 55.95, lng: -3.19, cat: 'Scotland', pop: '0.5M' },
  { name: 'Stockholm', country: 'Sweden', lat: 59.33, lng: 18.07, cat: 'Capital', pop: '1.0M' },
  { name: 'Oslo', country: 'Norway', lat: 59.91, lng: 10.75, cat: 'Capital', pop: '0.7M' },
  { name: 'Helsinki', country: 'Finland', lat: 60.17, lng: 24.94, cat: 'Capital', pop: '0.7M' },
  { name: 'Reykjavík', country: 'Iceland', lat: 64.15, lng: -21.94, cat: 'Subpolar Capital', pop: '0.1M' },
  { name: 'Athens', country: 'Greece', lat: 37.98, lng: 23.73, cat: 'Capital', pop: '3.1M' },
  { name: 'Istanbul', country: 'Turkey', lat: 41.01, lng: 28.98, cat: 'Bosphorus Metropolis', pop: '16M' },
  { name: 'Ankara', country: 'Turkey', lat: 39.93, lng: 32.86, cat: 'Capital', pop: '5.8M' },
  { name: 'Izmir', country: 'Turkey', lat: 38.42, lng: 27.14, cat: 'Aegean Coast', pop: '4.4M' },
  { name: 'Rize', country: 'Turkey', lat: 41.02, lng: 40.52, cat: 'Black Sea Rain', pop: 'Rainiest province in Turkey (2,300mm/yr)' },
  { name: 'Dubai', country: 'United Arab Emirates', lat: 25.20, lng: 55.27, cat: 'Desert Metropolis', pop: '3.5M' },
  { name: 'Riyadh', country: 'Saudi Arabia', lat: 24.71, lng: 46.68, cat: 'Arid Capital', pop: '7.6M' },
  { name: 'Doha', country: 'Qatar', lat: 25.29, lng: 51.53, cat: 'Gulf Coast', pop: '2.4M' },
  { name: 'Bangalore', country: 'India', lat: 12.97, lng: 77.59, cat: 'Tech Capital', pop: '12M' },
  { name: 'Kolkata', country: 'India', lat: 22.57, lng: 88.36, cat: 'Bengal Delta', pop: '15M' },
  { name: 'Chennai', country: 'India', lat: 13.08, lng: 80.27, cat: 'Coromandel Coast', pop: '11M' },
  { name: 'Kochi', country: 'India', lat: 9.93, lng: 76.27, cat: 'Malabar Monsoon', pop: '3.2M' },
  { name: 'Colombo', country: 'Sri Lanka', lat: 6.93, lng: 79.86, cat: 'Monsoon Coast', pop: '0.8M' },
  { name: 'Dhaka', country: 'Bangladesh', lat: 23.81, lng: 90.41, cat: 'Monsoon Megacity', pop: '22M' },
  { name: 'Yangon', country: 'Myanmar', lat: 16.87, lng: 96.20, cat: 'Monsoon Delta', pop: '5.4M' },
  { name: 'Hanoi', country: 'Vietnam', lat: 21.03, lng: 105.83, cat: 'Subtropical Capital', pop: '8.4M' },
  { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.82, lng: 106.63, cat: 'Tropical Delta', pop: '9.3M' }
];

// Interactive Meteorological & NASA GPM Rain Quiz (Challenging & Non-Obvious)
export const QUIZ_QUESTIONS = [
  {
    id: 'wettest-place',
    category: 'Global Extremes',
    difficulty: 'Challenging',
    question: 'Which location holds the verified meteorological world record for the highest annual average rainfall on Earth (~11,872 mm)?',
    options: [
      { text: 'Mawsynram, India', lat: 25.30, lng: 91.58, zoom: 6.8, locationName: 'Mawsynram, Meghalaya, India', isCorrect: true },
      { text: 'Cherrapunji, India', lat: 25.27, lng: 91.73, zoom: 7.0, locationName: 'Cherrapunji, Meghalaya, India', isCorrect: false },
      { text: 'Tutunendo, Colombia', lat: 5.75, lng: -76.53, zoom: 6.8, locationName: 'Tutunendo, Chocó, Colombia', isCorrect: false },
      { text: 'Mount Waialeale, Hawaii', lat: 22.07, lng: -159.50, zoom: 7.5, locationName: 'Mount Waialeale, Kauai, Hawaii', isCorrect: false }
    ],
    explanation: 'Mawsynram in Meghalaya, India, sits on a funnel-shaped plateau that traps warm, moisture-laden Bay of Bengal summer monsoon winds, edging out nearby Cherrapunji for the #1 global title.',
    funFact: 'Locals in Mawsynram weave traditional full-body umbrella shells called "knups" out of bamboo and reeds to endure the non-stop downpours.'
  },
  {
    id: 'rainiest-lowland',
    category: 'Equatorial Climatology',
    difficulty: 'Advanced',
    question: 'Which populated lowland city is scientifically recognized as the wettest city on Earth, averaging nearly 9,000 mm of rain and raining on over 300 days a year?',
    options: [
      { text: 'Quibdó, Colombia', lat: 5.69, lng: -76.65, zoom: 6.8, locationName: 'Quibdó, Chocó, Colombia', isCorrect: true },
      { text: 'Manaus, Brazil', lat: -3.12, lng: -60.02, zoom: 6.5, locationName: 'Manaus, Amazonas, Brazil', isCorrect: false },
      { text: 'Monrovia, Liberia', lat: 6.31, lng: -10.80, zoom: 6.5, locationName: 'Monrovia, Liberia', isCorrect: false },
      { text: 'Padang, Indonesia', lat: -0.95, lng: 100.35, zoom: 6.5, locationName: 'Padang, Sumatra, Indonesia', isCorrect: false }
    ],
    explanation: 'Quibdó sits in the Chocó lowlands between the tropical Pacific and the Andes, where moist onshore winds trigger nearly perpetual afternoon convective downpours.',
    funFact: 'Rain falls in Quibdó on over 300 days a year, predominantly in heavy tropical convective cloudbursts.'
  },
  {
    id: 'pacific-peak',
    category: 'Orographic Precipitation',
    difficulty: 'Island Weather',
    question: 'Which oceanic volcanic peak captures extreme orographic rainfall (~9,760 mm/year) as prevailing trade winds are forced up sheer 1,500-meter cliffs?',
    options: [
      { text: 'Mount Waialeale, Kauai', lat: 22.07, lng: -159.50, zoom: 7.5, locationName: 'Mount Waialeale, Kauai, Hawaii', isCorrect: true },
      { text: 'Mount Pelée, Martinique', lat: 14.81, lng: -61.16, zoom: 7.0, locationName: 'Mount Pelée, Martinique', isCorrect: false },
      { text: 'Pico da Neblina, Brazil', lat: 0.80, lng: -66.00, zoom: 7.0, locationName: 'Pico da Neblina, Brazil', isCorrect: false },
      { text: 'Pico de Orizaba, Mexico', lat: 19.03, lng: -97.27, zoom: 7.0, locationName: 'Pico de Orizaba, Mexico', isCorrect: false }
    ],
    explanation: 'Mount Waialeale’s caldera is perfectly oriented to face the moisture-laden northeast Pacific trade winds, forcing rapid condensation as marine clouds climb its sheer walls.',
    funFact: 'In Hawaiian, Waialeale translates to "rippling water" or "overflowing water", describing the perpetual shroud of rain-bearing clouds encircling its summit.'
  },
  {
    id: 'atlantic-monsoon',
    category: 'African Weather Systems',
    difficulty: 'Tropical Meteorology',
    question: 'Which coastal location experiences the heaviest annual rainfall in Africa (>10,200 mm/year) due to equatorial oceanic monsoons trapped against a 4,000-meter volcanic wall?',
    options: [
      { text: 'Debundscha, Cameroon', lat: 4.10, lng: 8.98, zoom: 7.2, locationName: 'Debundscha, Cameroon', isCorrect: true },
      { text: 'Bioko Island, Equatorial Guinea', lat: 3.56, lng: 8.70, zoom: 7.0, locationName: 'Bioko Island, Equatorial Guinea', isCorrect: false },
      { text: 'Freetown, Sierra Leone', lat: 8.48, lng: -13.23, zoom: 6.8, locationName: 'Freetown, Sierra Leone', isCorrect: false },
      { text: 'Libreville, Gabon', lat: 0.41, lng: 9.45, zoom: 6.8, locationName: 'Libreville, Gabon', isCorrect: false }
    ],
    explanation: 'Debundscha faces the South Atlantic Ocean directly beneath the massive 4,095-meter volcanic barrier of Mount Cameroon, which traps the moist equatorial monsoon air mass.',
    funFact: 'Most of Debundscha’s annual rainfall arrives during a relentless five-month summer monsoon season between May and October.'
  },
  {
    id: 'european-deluge',
    category: 'Mid-Latitude Fronts',
    difficulty: 'European Weather',
    question: 'Which coastal European metropolis is famously nicknamed the "City of Rain" due to Atlantic frontal systems yielding over 2,250 mm of rain across more than 200 wet days a year?',
    options: [
      { text: 'Bergen, Norway', lat: 60.39, lng: 5.32, zoom: 6.8, locationName: 'Bergen, Norway', isCorrect: true },
      { text: 'Glasgow, Scotland', lat: 55.86, lng: -4.25, zoom: 6.8, locationName: 'Glasgow, Scotland', isCorrect: false },
      { text: 'Galway, Ireland', lat: 53.27, lng: -9.05, zoom: 6.8, locationName: 'Galway, Ireland', isCorrect: false },
      { text: 'Vigo, Spain', lat: 42.24, lng: -8.72, zoom: 6.8, locationName: 'Vigo, Galicia, Spain', isCorrect: false }
    ],
    explanation: 'Bergen sits on Norway’s western coast where moist North Atlantic low-pressure systems are intercepted by seven surrounding mountain peaks, causing heavy orographic rain.',
    funFact: 'Bergen once set a European record with 85 consecutive days of continuous rainfall!'
  },
  {
    id: 'hyper-arid',
    category: 'Rain Shadow & Deserts',
    difficulty: 'Global Contrasts',
    question: 'Where on Earth is the driest non-polar region, where a double mountain rain shadow produces extreme moisture scarcity used by NASA astrobiologists to test Mars rovers?',
    options: [
      { text: 'Atacama Desert, Chile', lat: -23.86, lng: -69.13, zoom: 6.5, locationName: 'Atacama Desert, Antofagasta, Chile', isCorrect: true },
      { text: 'Danakil Depression, Ethiopia', lat: 14.24, lng: 40.30, zoom: 6.5, locationName: 'Danakil Depression, Ethiopia', isCorrect: false },
      { text: 'Rub\' al Khali, Arabian Peninsula', lat: 21.00, lng: 51.00, zoom: 6.0, locationName: 'Rub\' al Khali, Saudi Arabia', isCorrect: false },
      { text: 'Death Valley, USA', lat: 36.53, lng: -116.93, zoom: 6.5, locationName: 'Death Valley, California, USA', isCorrect: false }
    ],
    explanation: 'The Atacama Desert is blocked on both sides by the Chilean Coast Range and the high Andes, creating a double rain shadow reinforced by the cold Humboldt ocean current.',
    funFact: 'Some weather stations in the Yungay sector of the Atacama have never recorded a single drop of rain in their entire operational history.'
  }
];
