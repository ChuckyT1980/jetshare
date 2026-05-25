// ═══════════════════════════════════════════════════════
// FLIGHT CANCELLATION SCRAPER
// Scrapes public airport status boards for cancelled flights
// Uses lightweight Cheerio — no Puppeteer needed
// Targets: FAA, FlightStats, airport .com status pages
// ═══════════════════════════════════════════════════════

const cheerio = require('cheerio');
const { CANCELLATION_HUBS, getCity, getAirportName, extractIATA, normalizeFlightNo } = require('./airports');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// ─── SOURCE 1: FAA Airport Status ───
// The FAA provides real-time airport delay/status data as XML/JSON
async function scrapeFAAStatus() {
  const cancellations = [];
  
  try {
    const url = 'https://nasstatus.faa.gov/api/airport-status-information';
    const res = await fetch(url, {
      headers: { 'Accept': 'application/xml, text/xml' },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const xml = await res.text();
      const $ = cheerio.load(xml, { xmlMode: true });

      // Parse Ground Stops
      $('Ground_Stop_List Program').each((i, el) => {
        const hub = $(el).find('ARPT').text();
        const reason = $(el).find('Reason').text();
        if (CANCELLATION_HUBS.includes(hub)) {
          cancellations.push({
            type: 'airport_disruption',
            airport: hub,
            airportName: getAirportName(hub),
            city: getCity(hub),
            status: 'Ground Stop',
            reason: reason,
            delay: '',
            severity: 'critical',
            source: 'faa',
            scrapedAt: new Date().toISOString(),
          });
        }
      });

      // Parse Ground Delays
      $('Ground_Delay_List Ground_Delay').each((i, el) => {
        const hub = $(el).find('ARPT').text();
        const reason = $(el).find('Reason').text();
        const avg = $(el).find('Avg').text();
        if (CANCELLATION_HUBS.includes(hub)) {
          cancellations.push({
            type: 'airport_disruption',
            airport: hub,
            airportName: getAirportName(hub),
            city: getCity(hub),
            status: `Ground Delay (${avg})`,
            reason: reason,
            delay: avg,
            severity: 'high',
            source: 'faa',
            scrapedAt: new Date().toISOString(),
          });
        }
      });

      // Parse General Delays
      $('Arrival_Departure_Delay_List Delay').each((i, el) => {
        const hub = $(el).find('ARPT').text();
        const reason = $(el).find('Reason').text();
        const min = $(el).find('Min').text();
        if (CANCELLATION_HUBS.includes(hub)) {
          if (!cancellations.find(c => c.airport === hub)) {
            cancellations.push({
              type: 'airport_disruption',
              airport: hub,
              airportName: getAirportName(hub),
              city: getCity(hub),
              status: `Delay (Min: ${min})`,
              reason: reason,
              delay: min,
              severity: 'medium',
              source: 'faa',
              scrapedAt: new Date().toISOString(),
            });
          }
        }
      });
      
      // Parse Airport Closures
      $('Airport_Closure_List Airport').each((i, el) => {
        const hub = $(el).find('ARPT').text();
        const reason = $(el).find('Reason').text();
        if (CANCELLATION_HUBS.includes(hub)) {
          if (!cancellations.find(c => c.airport === hub)) {
            cancellations.push({
              type: 'airport_disruption',
              airport: hub,
              airportName: getAirportName(hub),
              city: getCity(hub),
              status: 'Airport Closed',
              reason: reason,
              delay: '',
              severity: 'critical',
              source: 'faa',
              scrapedAt: new Date().toISOString(),
            });
          }
        }
      });
    }
  } catch (err) {
    console.log(`[FAA] Error fetching NAS status: ${err.message}`);
  }

  return cancellations;
}

// ─── SOURCE 2: Airport site flight boards ───
// Scrape public departure boards from airport info sites
async function scrapeAirportBoards() {
  const cancellations = [];

  // Airport site URL patterns — these are public info pages
  const urlPatterns = [
    { template: (code) => `https://www.airport-${code.toLowerCase()}.com/${code.toLowerCase()}-departures`, name: 'airport-site' },
    { template: (code) => `https://www.flightstats.com/v2/flight-tracker/departures/${code}`, name: 'flightstats' },
  ];

  for (const hub of CANCELLATION_HUBS.slice(0, 5)) { // Top 5 hubs to stay within rate limits
    for (const pattern of urlPatterns) {
      try {
        const url = pattern.template(hub);
        const res = await fetch(url, {
          headers: HEADERS,
          signal: AbortSignal.timeout(12000),
          redirect: 'follow',
        });

        if (!res.ok) continue;
        const html = await res.text();
        const $ = cheerio.load(html);

        // Look for table rows or flight items with "cancelled" status
        const rows = $('tr, .flight-row, [class*="flight"], [class*="row"]');

        rows.each((i, el) => {
          const text = $(el).text();
          const textLower = text.toLowerCase();

          if (textLower.includes('cancel') || textLower.includes('cancelled') || textLower.includes('canceled')) {
            // Extract flight details from the row
            const flightNo = normalizeFlightNo(
              $(el).find('.flight-no, .flight, td:first-child').text() ||
              (text.match(/\b([A-Z]{2}\d{1,4})\b/) || [])[1] || ''
            );

            const destText = $(el).find('.destination, .to, td:nth-child(2), td:nth-child(3)').text();
            const destination = extractIATA(destText) || extractIATA(text);

            const timeText = $(el).find('.time, .scheduled, td:nth-child(4), td:nth-child(5)').text();
            const time = timeText.match(/\d{1,2}:\d{2}/) ? timeText.match(/\d{1,2}:\d{2}/)[0] : '';

            // Extract airline from flight number
            const airlineCode = flightNo ? flightNo.substring(0, 2) : '';
            const airline = getAirlineName(airlineCode);

            if (destination || flightNo) {
              cancellations.push({
                type: 'flight_cancellation',
                origin: hub,
                originCity: getCity(hub),
                destination: destination || 'Unknown',
                destinationCity: destination ? getCity(destination) : 'Unknown',
                flightNumber: flightNo,
                airline: airline,
                scheduledTime: time,
                status: 'CANCELLED',
                source: pattern.name,
                scrapedAt: new Date().toISOString(),
              });
            }
          }
        });

        // If we found cancellations from this source, don't try others for this hub
        if (cancellations.filter(c => c.origin === hub).length > 0) break;

      } catch (err) {
        // Try next source
      }
    }
  }

  return cancellations;
}

// ─── SOURCE 3: FlightAware Misery Map data ───
// FlightAware publishes aggregate delay/cancellation stats
async function scrapeFlightAwareStats() {
  const cancellations = [];

  try {
    const res = await fetch('https://flightaware.com/miserymap/', {
      headers: HEADERS,
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return cancellations;
    const html = await res.text();
    const $ = cheerio.load(html);

    // Parse the misery map data — they embed stats in the page
    $('script').each((i, el) => {
      const content = $(el).html() || '';
      // Look for airport statistics JSON
      const dataMatch = content.match(/airportData\s*=\s*({.*?});/s) ||
                        content.match(/"airports"\s*:\s*(\[.*?\])/s);
      if (dataMatch) {
        try {
          const data = JSON.parse(dataMatch[1]);
          const airports = Array.isArray(data) ? data : Object.values(data);
          
          airports.forEach(apt => {
            const code = apt.code || apt.iata || apt.airport || '';
            const cancelCount = apt.cancellations || apt.cancelled || apt.cancelCount || 0;
            const delayCount = apt.delays || apt.delayed || apt.delayCount || 0;
            
            if (CANCELLATION_HUBS.includes(code) && cancelCount > 10) {
              cancellations.push({
                type: 'airport_stats',
                airport: code,
                airportName: getAirportName(code),
                city: getCity(code),
                cancellationCount: cancelCount,
                delayCount: delayCount,
                severity: cancelCount > 50 ? 'critical' : cancelCount > 20 ? 'high' : 'medium',
                source: 'flightaware',
                scrapedAt: new Date().toISOString(),
              });
            }
          });
        } catch (e) { /* parse error */ }
      }
    });
  } catch (err) {
    console.log(`[FlightAware] Error: ${err.message}`);
  }

  return cancellations;
}

// ─── MAIN SCRAPER ───
async function scrapeCancellations() {
  console.log('[Cancellations] Starting scrape of all sources...');

  // Run all sources in parallel
  const [faa, boards, stats] = await Promise.allSettled([
    scrapeFAAStatus(),
    scrapeAirportBoards(),
    scrapeFlightAwareStats(),
  ]);

  const disruptions = [
    ...(faa.status === 'fulfilled' ? faa.value : []),
  ];

  const flightCancellations = [
    ...(boards.status === 'fulfilled' ? boards.value : []),
  ];

  const airportStats = [
    ...(stats.status === 'fulfilled' ? stats.value : []),
  ];

  // Build affected airports list (airports with known disruptions)
  const affectedAirports = new Set();
  disruptions.forEach(d => affectedAirports.add(d.airport));
  airportStats.filter(s => s.severity === 'critical' || s.severity === 'high').forEach(s => affectedAirports.add(s.airport));
  flightCancellations.forEach(c => affectedAirports.add(c.origin));

  const result = {
    disruptions,
    cancellations: flightCancellations,
    airportStats,
    affectedAirports: Array.from(affectedAirports),
    scrapedAt: new Date().toISOString(),
    totalCancellations: flightCancellations.length,
    totalDisruptions: disruptions.length,
    sourcesChecked: {
      faa: faa.status === 'fulfilled',
      airportBoards: boards.status === 'fulfilled',
      flightAware: stats.status === 'fulfilled',
    },
  };

  console.log(`[Cancellations] Done: ${result.totalCancellations} cancellations, ${result.totalDisruptions} disruptions, ${result.affectedAirports.length} affected airports`);
  return result;
}

// ─── Airline lookup ───
function getAirlineName(code) {
  const airlines = {
    AA: 'American Airlines', UA: 'United Airlines', DL: 'Delta Air Lines',
    WN: 'Southwest Airlines', B6: 'JetBlue Airways', AS: 'Alaska Airlines',
    NK: 'Spirit Airlines', F9: 'Frontier Airlines', HA: 'Hawaiian Airlines',
    SY: 'Sun Country', G4: 'Allegiant Air', BA: 'British Airways',
    LH: 'Lufthansa', AF: 'Air France', EK: 'Emirates', QR: 'Qatar Airways',
    AC: 'Air Canada', WS: 'WestJet', AM: 'Aeromexico',
  };
  return airlines[code] || code;
}

module.exports = { scrapeCancellations };
