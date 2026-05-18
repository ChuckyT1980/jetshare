// ═══════════════════════════════════════════════════════
// AIRPORT DATA + UTILITIES
// Shared reference for both scrapers and the matcher
// ═══════════════════════════════════════════════════════

const AIRPORTS = {
  // ─── US HUBS (high disruption targets) ───
  JFK: { city: 'New York', name: 'John F. Kennedy', lat: 40.64, lon: -73.78 },
  EWR: { city: 'Newark', name: 'Newark Liberty', lat: 40.69, lon: -74.17 },
  LGA: { city: 'New York', name: 'LaGuardia', lat: 40.77, lon: -73.87 },
  TEB: { city: 'Teterboro', name: 'Teterboro', lat: 40.85, lon: -74.06 },
  HPN: { city: 'White Plains', name: 'Westchester County', lat: 41.07, lon: -73.71 },
  LAX: { city: 'Los Angeles', name: 'Los Angeles Intl', lat: 33.94, lon: -118.41 },
  VNY: { city: 'Van Nuys', name: 'Van Nuys', lat: 34.21, lon: -118.49 },
  SNA: { city: 'Orange County', name: 'John Wayne', lat: 33.68, lon: -117.87 },
  SFO: { city: 'San Francisco', name: 'San Francisco Intl', lat: 37.62, lon: -122.38 },
  OAK: { city: 'Oakland', name: 'Oakland Intl', lat: 37.72, lon: -122.22 },
  SJC: { city: 'San Jose', name: 'San Jose Intl', lat: 37.36, lon: -121.93 },
  ORD: { city: 'Chicago', name: "O'Hare Intl", lat: 41.98, lon: -87.90 },
  MDW: { city: 'Chicago', name: 'Midway', lat: 41.79, lon: -87.75 },
  MIA: { city: 'Miami', name: 'Miami Intl', lat: 25.79, lon: -80.29 },
  OPF: { city: 'Miami', name: 'Opa-Locka Executive', lat: 25.91, lon: -80.28 },
  FLL: { city: 'Fort Lauderdale', name: 'Fort Lauderdale-Hollywood', lat: 26.07, lon: -80.15 },
  PBI: { city: 'Palm Beach', name: 'Palm Beach Intl', lat: 26.68, lon: -80.10 },
  DFW: { city: 'Dallas', name: 'Dallas/Fort Worth', lat: 32.90, lon: -97.04 },
  DAL: { city: 'Dallas', name: 'Love Field', lat: 32.85, lon: -96.85 },
  ATL: { city: 'Atlanta', name: 'Hartsfield-Jackson', lat: 33.64, lon: -84.43 },
  PDK: { city: 'Atlanta', name: 'DeKalb-Peachtree', lat: 33.88, lon: -84.30 },
  DEN: { city: 'Denver', name: 'Denver Intl', lat: 39.86, lon: -104.67 },
  APA: { city: 'Denver', name: 'Centennial', lat: 39.57, lon: -104.85 },
  SEA: { city: 'Seattle', name: 'Seattle-Tacoma', lat: 47.45, lon: -122.31 },
  BOS: { city: 'Boston', name: 'Logan Intl', lat: 42.37, lon: -71.02 },
  IAD: { city: 'Washington', name: 'Dulles Intl', lat: 38.95, lon: -77.46 },
  DCA: { city: 'Washington', name: 'Reagan National', lat: 38.85, lon: -77.04 },
  PHX: { city: 'Phoenix', name: 'Sky Harbor', lat: 33.43, lon: -112.01 },
  SCF: { city: 'Scottsdale', name: 'Scottsdale', lat: 33.63, lon: -111.91 },
  LAS: { city: 'Las Vegas', name: 'Harry Reid', lat: 36.08, lon: -115.15 },
  VGT: { city: 'Las Vegas', name: 'North Las Vegas', lat: 36.21, lon: -115.19 },
  MSP: { city: 'Minneapolis', name: 'Minneapolis-St Paul', lat: 44.88, lon: -93.22 },
  MCO: { city: 'Orlando', name: 'Orlando Intl', lat: 28.43, lon: -81.31 },
  TPA: { city: 'Tampa', name: 'Tampa Intl', lat: 27.98, lon: -82.53 },
  BNA: { city: 'Nashville', name: 'Nashville Intl', lat: 36.12, lon: -86.68 },
  AUS: { city: 'Austin', name: 'Austin-Bergstrom', lat: 30.19, lon: -97.67 },
  HOU: { city: 'Houston', name: 'Hobby', lat: 29.65, lon: -95.28 },
  IAH: { city: 'Houston', name: 'George Bush', lat: 29.98, lon: -95.34 },
  SMF: { city: 'Sacramento', name: 'Sacramento Intl', lat: 38.70, lon: -121.59 },
  SAN: { city: 'San Diego', name: 'San Diego Intl', lat: 32.73, lon: -117.19 },
  PDX: { city: 'Portland', name: 'Portland Intl', lat: 45.59, lon: -122.60 },
  RDU: { city: 'Raleigh', name: 'Raleigh-Durham', lat: 35.88, lon: -78.79 },
  CLT: { city: 'Charlotte', name: 'Charlotte Douglas', lat: 35.21, lon: -80.94 },
  PHL: { city: 'Philadelphia', name: 'Philadelphia Intl', lat: 39.87, lon: -75.24 },
  DTW: { city: 'Detroit', name: 'Detroit Metro', lat: 42.21, lon: -83.35 },
  STL: { city: 'St Louis', name: 'St Louis Lambert', lat: 38.75, lon: -90.37 },
  CLE: { city: 'Cleveland', name: 'Cleveland Hopkins', lat: 41.41, lon: -81.85 },
  PIT: { city: 'Pittsburgh', name: 'Pittsburgh Intl', lat: 40.49, lon: -80.23 },
  BWI: { city: 'Baltimore', name: 'Baltimore-Washington', lat: 39.18, lon: -76.67 },
  JAX: { city: 'Jacksonville', name: 'Jacksonville Intl', lat: 30.49, lon: -81.69 },
  RNO: { city: 'Reno', name: 'Reno-Tahoe', lat: 39.50, lon: -119.77 },
  BOI: { city: 'Boise', name: 'Boise Airport', lat: 43.56, lon: -116.22 },
  ABQ: { city: 'Albuquerque', name: 'Albuquerque Intl', lat: 35.04, lon: -106.61 },
  IND: { city: 'Indianapolis', name: 'Indianapolis Intl', lat: 39.72, lon: -86.29 },
  CVG: { city: 'Cincinnati', name: 'Cincinnati/Northern Kentucky', lat: 39.05, lon: -84.66 },
  MKE: { city: 'Milwaukee', name: 'Mitchell Intl', lat: 42.95, lon: -87.90 },
  CUN: { city: 'Cancun', name: 'Cancún Intl', lat: 21.04, lon: -86.87 },
  SJD: { city: 'Cabo San Lucas', name: 'Los Cabos Intl', lat: 23.15, lon: -109.72 },
  MBJ: { city: 'Montego Bay', name: 'Sangster Intl', lat: 18.50, lon: -77.91 },
  NAS: { city: 'Nassau', name: 'Nassau Intl', lat: 25.04, lon: -77.47 },

  // ─── EUROPEAN HUBS ───
  LHR: { city: 'London', name: 'Heathrow', lat: 51.47, lon: -0.46 },
  LTN: { city: 'London', name: 'Luton', lat: 51.87, lon: -0.37 },
  STN: { city: 'London', name: 'Stansted', lat: 51.89, lon: 0.26 },
  LCY: { city: 'London', name: 'City Airport', lat: 51.51, lon: 0.05 },
  CDG: { city: 'Paris', name: 'Charles de Gaulle', lat: 49.01, lon: 2.55 },
  LBG: { city: 'Paris', name: 'Le Bourget', lat: 48.97, lon: 2.44 },
  FCO: { city: 'Rome', name: 'Fiumicino', lat: 41.80, lon: 12.25 },
  MXP: { city: 'Milan', name: 'Malpensa', lat: 45.63, lon: 8.72 },
  LIN: { city: 'Milan', name: 'Linate', lat: 45.45, lon: 9.28 },
  BCN: { city: 'Barcelona', name: 'El Prat', lat: 41.30, lon: 2.08 },
  AMS: { city: 'Amsterdam', name: 'Schiphol', lat: 52.31, lon: 4.77 },
  FRA: { city: 'Frankfurt', name: 'Frankfurt', lat: 50.03, lon: 8.57 },
  ZRH: { city: 'Zurich', name: 'Zurich Airport', lat: 47.46, lon: 8.56 },
  GVA: { city: 'Geneva', name: 'Geneva Airport', lat: 46.24, lon: 6.11 },
  NCE: { city: 'Nice', name: 'Nice Côte d\'Azur', lat: 43.66, lon: 7.22 },
  IBZ: { city: 'Ibiza', name: 'Ibiza Airport', lat: 38.87, lon: 1.37 },
  PMI: { city: 'Palma', name: 'Palma de Mallorca', lat: 39.55, lon: 2.74 },
  AGP: { city: 'Malaga', name: 'Málaga-Costa del Sol', lat: 36.68, lon: -4.50 },
  VIE: { city: 'Vienna', name: 'Vienna Intl', lat: 48.11, lon: 16.57 },
  MUC: { city: 'Munich', name: 'Munich', lat: 48.35, lon: 11.79 },

  // ─── MIDDLE EAST ───
  DXB: { city: 'Dubai', name: 'Dubai Intl', lat: 25.25, lon: 55.36 },
  DOH: { city: 'Doha', name: 'Hamad Intl', lat: 25.27, lon: 51.61 },
  RUH: { city: 'Riyadh', name: 'King Khalid Intl', lat: 24.96, lon: 46.70 },
  JED: { city: 'Jeddah', name: 'King Abdulaziz Intl', lat: 21.68, lon: 39.16 },

  // ─── CANADA ───
  YYZ: { city: 'Toronto', name: 'Pearson Intl', lat: 43.68, lon: -79.63 },
  YVR: { city: 'Vancouver', name: 'Vancouver Intl', lat: 49.19, lon: -123.18 },
  YUL: { city: 'Montreal', name: 'Trudeau Intl', lat: 45.47, lon: -73.74 },
};

// High-disruption US hubs to scan for cancellations
const CANCELLATION_HUBS = ['JFK', 'ORD', 'DFW', 'MIA', 'LAX', 'ATL', 'DEN', 'SFO', 'EWR', 'BOS'];

// Nearby airport groups — if someone's cancelled at JFK, they could use TEB or HPN empty leg
const NEARBY_AIRPORTS = {
  JFK: ['EWR', 'LGA', 'TEB', 'HPN'],
  EWR: ['JFK', 'LGA', 'TEB', 'HPN'],
  LGA: ['JFK', 'EWR', 'TEB', 'HPN'],
  TEB: ['JFK', 'EWR', 'LGA', 'HPN'],
  LAX: ['VNY', 'SNA', 'SFO', 'OAK', 'SJC'],
  SFO: ['OAK', 'SJC', 'LAX', 'VNY'],
  ORD: ['MDW'],
  MDW: ['ORD'],
  MIA: ['OPF', 'FLL', 'PBI'],
  FLL: ['MIA', 'OPF', 'PBI'],
  OPF: ['MIA', 'FLL', 'PBI'],
  ATL: ['PDK'],
  DFW: ['DAL'],
  DEN: ['APA'],
  IAD: ['DCA', 'BWI'],
  DCA: ['IAD', 'BWI'],
  PHX: ['SCF'],
  LAS: ['VGT'],
  IAH: ['HOU'],
  HOU: ['IAH'],
  LHR: ['LTN', 'STN', 'LCY'],
  CDG: ['LBG'],
  MXP: ['LIN'],
};

// Haversine distance in miles between two airports
function distanceBetween(code1, code2) {
  const a = AIRPORTS[code1];
  const b = AIRPORTS[code2];
  if (!a || !b) return Infinity;

  const R = 3959; // Earth radius in miles
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;

  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return Math.round(R * c);
}

// Get city name from IATA code
function getCity(code) {
  return AIRPORTS[code]?.city || code;
}

// Get airport name from IATA code
function getAirportName(code) {
  return AIRPORTS[code]?.name || code;
}

// Check if code is a known US airport
function isUS(code) {
  const usAirports = Object.keys(AIRPORTS).filter(k => {
    const a = AIRPORTS[k];
    return a.lat > 24 && a.lat < 50 && a.lon > -130 && a.lon < -65;
  });
  return usAirports.includes(code);
}

// Clean raw text into IATA code
function extractIATA(text) {
  if (!text) return null;
  // Direct 3-letter code
  const direct = text.match(/\b([A-Z]{3})\b/);
  if (direct && AIRPORTS[direct[1]]) return direct[1];

  // Try matching city name
  const clean = text.trim().toLowerCase();
  for (const [code, data] of Object.entries(AIRPORTS)) {
    if (clean.includes(data.city.toLowerCase()) || clean.includes(data.name.toLowerCase())) {
      return code;
    }
  }
  return null;
}

// Normalize airline flight number — "AA 2104" → "AA2104"
function normalizeFlightNo(raw) {
  if (!raw) return '';
  return raw.replace(/\s+/g, '').toUpperCase();
}

module.exports = {
  AIRPORTS,
  CANCELLATION_HUBS,
  NEARBY_AIRPORTS,
  distanceBetween,
  getCity,
  getAirportName,
  isUS,
  extractIATA,
  normalizeFlightNo,
};
