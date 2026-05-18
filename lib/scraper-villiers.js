// ═══════════════════════════════════════════════════════
// VILLIERS EMPTY LEG SCRAPER
// Scrapes villiers.com/empty-legs for available flights
// Falls back to their search API if HTML scraping fails
// ═══════════════════════════════════════════════════════

const cheerio = require('cheerio');
const { getCity, extractIATA, AIRPORTS } = require('./airports');

const VILLIERS_URLS = [
  'https://www.villiers.com/empty-legs',
  'https://www.villiers.com/en/empty-legs',
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

function getAircraftCategory(type) {
  const t = (type || '').toLowerCase();
  if (/global|gulfstream|g650|g550|g500|falcon 7|falcon 8|falcon 900/.test(t)) return 'Heavy';
  if (/challenger|legacy|citation x|falcon 2|citation sovereign|praetor 600/.test(t)) return 'Super Mid';
  if (/citation|learjet|hawker|phenom 300|praetor 500/.test(t)) return 'Midsize';
  if (/phenom 100|mustang|honda|eclipse|very light/.test(t)) return 'Light';
  if (/king air|pilatus|pc-12|turboprop|beech/.test(t)) return 'Turboprop';
  return 'Jet';
}

// Strategy 1: Parse the HTML page directly
async function scrapeHTML(url) {
  const flights = [];

  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      console.log(`[Villiers HTML] ${url} returned ${res.status}`);
      return flights;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Try all known selector patterns Villiers has used
    const selectorSets = [
      // Card-based layout
      { card: '.empty-leg-card, .flight-card, [class*="EmptyLeg"], [class*="empty-leg"]', from: '.from, .departure, [class*="from"], [class*="departure"]', to: '.to, .arrival, [class*="to"], [class*="arrival"]', price: '.price, [class*="price"]', date: '.date, [class*="date"]', aircraft: '.aircraft, [class*="aircraft"], [class*="plane"]', seats: '[class*="seat"], [class*="pax"]' },
      // Table-based layout
      { card: 'tr[class*="flight"], tr[class*="leg"], tbody tr', from: 'td:nth-child(1)', to: 'td:nth-child(2)', price: 'td:nth-child(3), td:nth-child(4)', date: 'td:nth-child(5), td:nth-child(3)', aircraft: 'td:nth-child(6), td:nth-child(4)', seats: 'td:nth-child(7)' },
      // Generic divs
      { card: '[class*="card"], article, .item, .listing', from: null, to: null, price: null, date: null, aircraft: null, seats: null },
    ];

    for (const sel of selectorSets) {
      const cards = $(sel.card);
      if (cards.length === 0) continue;

      cards.each((i, el) => {
        const card = $(el);
        const text = card.text();

        // Skip if too short to be a flight card
        if (text.length < 20) return;

        let from = null, to = null, price = null, date = null, aircraft = null, seats = null;

        // Try specific selectors first
        if (sel.from) from = extractIATA(card.find(sel.from).text());
        if (sel.to) to = extractIATA(card.find(sel.to).text());
        if (sel.price) {
          const priceText = card.find(sel.price).text();
          const priceMatch = priceText.match(/[\$€£]\s*([\d,]+)/);
          if (priceMatch) price = parseInt(priceMatch[1].replace(/,/g, ''));
        }
        if (sel.date) date = card.find(sel.date).text().trim();
        if (sel.aircraft) aircraft = card.find(sel.aircraft).text().trim();
        if (sel.seats) {
          const seatMatch = card.find(sel.seats).text().match(/(\d+)/);
          if (seatMatch) seats = parseInt(seatMatch[1]);
        }

        // Fallback: parse from full card text
        if (!from || !to) {
          const codes = text.match(/\b([A-Z]{3})\b/g) || [];
          const validCodes = codes.filter(c => AIRPORTS[c]);
          if (validCodes.length >= 2) {
            from = from || validCodes[0];
            to = to || validCodes[1];
          }
        }

        if (!price) {
          const pm = text.match(/[\$€£]\s*([\d,]+)/);
          if (pm) price = parseInt(pm[1].replace(/,/g, ''));
        }

        if (!date) {
          const dm = text.match(/(\w{3,}\s+\d{1,2},?\s*\d{4})|(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})|(\d{1,2}\s+\w{3,}\s+\d{4})/);
          if (dm) date = dm[0];
        }

        if (!aircraft) {
          const acPatterns = ['Phenom\\s*\\d+', 'Citation\\s*\\w+', 'Challenger\\s*\\d+', 'Global\\s*\\d+', 'Gulfstream\\s*G?\\d+', 'Falcon\\s*\\d+', 'Learjet\\s*\\d+', 'Hawker\\s*\\d+', 'Legacy\\s*\\d+', 'King Air\\s*\\d+', 'Pilatus', 'PC-?12', 'Honda\\s*Jet', 'G[56]\\d{2}', 'CL-?\\d{3}', 'Praetor\\s*\\d+'];
          for (const p of acPatterns) {
            const m = text.match(new RegExp(p, 'i'));
            if (m) { aircraft = m[0]; break; }
          }
        }

        if (!seats) {
          const sm = text.match(/(\d+)\s*(?:seat|pax|passenger)/i);
          if (sm) seats = parseInt(sm[1]);
        }

        if (from && to) {
          flights.push({
            id: `v-${from}-${to}-${i}`,
            from,
            to,
            fromCity: getCity(from),
            toCity: getCity(to),
            date: cleanDate(date),
            aircraft: aircraft || 'Private Jet',
            category: getAircraftCategory(aircraft),
            price,
            seats: seats || estimateSeats(aircraft),
            source: 'villiers',
            scrapedAt: new Date().toISOString(),
          });
        }
      });

      if (flights.length > 0) break; // Got results, stop trying selectors
    }

    // Strategy 1b: check for JSON embedded in page (Next.js / React hydration data)
    if (flights.length === 0) {
      const scripts = $('script');
      scripts.each((i, el) => {
        const content = $(el).html() || '';
        // Look for __NEXT_DATA__ or similar hydration payloads
        const nextDataMatch = content.match(/__NEXT_DATA__\s*=\s*({.*?});?\s*<\/script/s) ||
                              content.match(/"props"\s*:\s*({.*?"flights".*?})/s) ||
                              content.match(/"emptyLegs"\s*:\s*(\[.*?\])/s);
        if (nextDataMatch) {
          try {
            const data = JSON.parse(nextDataMatch[1]);
            const extractFlights = findFlightsInObject(data);
            extractFlights.forEach((f, idx) => {
              flights.push({
                id: `v-json-${idx}`,
                from: f.from || extractIATA(f.departureAirport || f.origin || ''),
                to: f.to || extractIATA(f.arrivalAirport || f.destination || ''),
                fromCity: getCity(f.from || ''),
                toCity: getCity(f.to || ''),
                date: cleanDate(f.date || f.departureDate || ''),
                aircraft: f.aircraft || f.aircraftType || 'Private Jet',
                category: getAircraftCategory(f.aircraft || f.aircraftType || ''),
                price: f.price || f.totalPrice || null,
                seats: f.seats || f.maxPassengers || null,
                source: 'villiers',
                scrapedAt: new Date().toISOString(),
              });
            });
          } catch (e) { /* JSON parse failed, move on */ }
        }
      });
    }

    console.log(`[Villiers HTML] Found ${flights.length} flights from ${url}`);
    return flights;

  } catch (err) {
    console.error(`[Villiers HTML] Error scraping ${url}:`, err.message);
    return flights;
  }
}

// Strategy 2: Try Villiers search/API endpoints if HTML fails
async function scrapeAPI() {
  const flights = [];
  const apiUrls = [
    'https://www.villiers.com/api/empty-legs',
    'https://www.villiers.com/api/v1/empty-legs',
    'https://api.villiers.com/empty-legs',
    'https://www.villiers.com/empty-legs.json',
  ];

  for (const url of apiUrls) {
    try {
      const res = await fetch(url, {
        headers: { ...HEADERS, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('json')) continue;

      const data = await res.json();
      const flightList = Array.isArray(data) ? data : (data.flights || data.data || data.results || data.emptyLegs || []);

      flightList.forEach((f, i) => {
        const from = f.from || f.departureAirport || f.departure_airport || f.origin || '';
        const to = f.to || f.arrivalAirport || f.arrival_airport || f.destination || '';
        const fromCode = extractIATA(from) || from;
        const toCode = extractIATA(to) || to;

        if (fromCode && toCode) {
          flights.push({
            id: `v-api-${i}`,
            from: fromCode,
            to: toCode,
            fromCity: getCity(fromCode),
            toCity: getCity(toCode),
            date: cleanDate(f.date || f.departureDate || f.departure_date || ''),
            aircraft: f.aircraft || f.aircraftType || f.aircraft_type || 'Private Jet',
            category: getAircraftCategory(f.aircraft || f.aircraftType || ''),
            price: f.price || f.totalPrice || f.total_price || null,
            seats: f.seats || f.maxPassengers || f.max_passengers || null,
            source: 'villiers-api',
            scrapedAt: new Date().toISOString(),
          });
        }
      });

      if (flights.length > 0) {
        console.log(`[Villiers API] Found ${flights.length} flights from ${url}`);
        break;
      }
    } catch (err) {
      // Try next URL
    }
  }

  return flights;
}

// Main scraper — tries HTML first, then API
async function scrapeVilliers() {
  let allFlights = [];

  // Try each URL
  for (const url of VILLIERS_URLS) {
    const flights = await scrapeHTML(url);
    if (flights.length > 0) {
      allFlights = flights;
      break;
    }
  }

  // Fallback to API
  if (allFlights.length === 0) {
    console.log('[Villiers] HTML scraping returned 0 results, trying API...');
    allFlights = await scrapeAPI();
  }

  // Deduplicate by route+date
  const seen = new Set();
  const deduped = allFlights.filter(f => {
    const key = `${f.from}-${f.to}-${f.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    flights: deduped,
    scrapedAt: new Date().toISOString(),
    totalFound: deduped.length,
    source: 'villiers',
  };
}

// ─── Helpers ───────────────────────────────────────────

function cleanDate(raw) {
  if (!raw) return '';
  return raw.replace(/\s+/g, ' ').trim();
}

function estimateSeats(aircraft) {
  const t = (aircraft || '').toLowerCase();
  if (/global|g650|g550|falcon 7|falcon 8|falcon 900/.test(t)) return 12;
  if (/challenger|legacy|citation x|praetor 600/.test(t)) return 9;
  if (/citation|learjet|hawker|phenom 300|praetor 500/.test(t)) return 7;
  if (/phenom 100|mustang|honda|eclipse/.test(t)) return 4;
  if (/king air|pilatus|pc-12/.test(t)) return 6;
  return 6;
}

// Recursively search an object for arrays that look like flight data
function findFlightsInObject(obj, depth = 0) {
  if (depth > 8 || !obj) return [];
  if (Array.isArray(obj)) {
    // Check if items look like flights
    const isFlightArray = obj.length > 0 && obj[0] &&
      (obj[0].departureAirport || obj[0].from || obj[0].origin || obj[0].departure_airport);
    if (isFlightArray) return obj;
    // Search deeper
    for (const item of obj) {
      const found = findFlightsInObject(item, depth + 1);
      if (found.length > 0) return found;
    }
    return [];
  }
  if (typeof obj === 'object') {
    for (const val of Object.values(obj)) {
      const found = findFlightsInObject(val, depth + 1);
      if (found.length > 0) return found;
    }
  }
  return [];
}

module.exports = { scrapeVilliers };
