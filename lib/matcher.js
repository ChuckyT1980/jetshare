// ═══════════════════════════════════════════════════════
// RESCUE DEAL MATCHER
// Matches cancelled flights with available empty legs
// If your flight from JFK→MIA got cancelled and there's
// an empty leg TEB→MIA, that's a rescue deal.
// ═══════════════════════════════════════════════════════

const { NEARBY_AIRPORTS, distanceBetween, getCity } = require('./airports');

// Match radius: how far away an empty leg departure can be from the cancellation airport
const MAX_ORIGIN_DISTANCE_MILES = 100;

// Match tolerance: how far the empty leg destination can be from the cancelled flight destination
const MAX_DEST_DISTANCE_MILES = 150;

function matchDeals(emptyLegs, cancellationData) {
  const deals = [];

  if (!emptyLegs?.flights?.length || !cancellationData) return deals;

  const { cancellations, disruptions, affectedAirports } = cancellationData;

  // ─── Strategy 1: Match individual cancelled flights to empty legs ───
  if (cancellations && cancellations.length > 0) {
    for (const cancel of cancellations) {
      if (!cancel.origin || !cancel.destination || cancel.destination === 'Unknown') continue;

      // Get nearby airports to the cancellation origin
      const originOptions = [cancel.origin, ...(NEARBY_AIRPORTS[cancel.origin] || [])];

      for (const leg of emptyLegs.flights) {
        // Check if the empty leg departs from near the cancellation
        const originMatch = originOptions.includes(leg.from) ||
                           distanceBetween(cancel.origin, leg.from) <= MAX_ORIGIN_DISTANCE_MILES;

        if (!originMatch) continue;

        // Check if the empty leg goes to near the cancelled destination
        const destNearby = [cancel.destination, ...(NEARBY_AIRPORTS[cancel.destination] || [])];
        const destMatch = destNearby.includes(leg.to) ||
                         distanceBetween(cancel.destination, leg.to) <= MAX_DEST_DISTANCE_MILES;

        if (!destMatch) continue;

        // We have a match!
        const originDist = distanceBetween(cancel.origin, leg.from);
        const destDist = distanceBetween(cancel.destination, leg.to);

        deals.push({
          type: 'rescue',
          priority: 'high',
          cancelledFlight: {
            flightNumber: cancel.flightNumber,
            airline: cancel.airline,
            from: cancel.origin,
            fromCity: cancel.originCity,
            to: cancel.destination,
            toCity: cancel.destinationCity,
          },
          emptyLeg: {
            ...leg,
          },
          match: {
            originDistance: originDist,
            destDistance: destDist,
            exactOrigin: cancel.origin === leg.from,
            exactDest: cancel.destination === leg.to,
            score: calculateMatchScore(originDist, destDist, cancel, leg),
          },
          headline: buildHeadline(cancel, leg),
          id: `rescue-${cancel.origin}-${cancel.destination}-${leg.id}`,
        });
      }
    }
  }

  // ─── Strategy 2: Match disrupted airports to empty legs ───
  // Even without specific flight cancellations, if an airport is disrupted,
  // show empty legs departing from nearby as "escape routes"
  if (affectedAirports && affectedAirports.length > 0) {
    for (const airport of affectedAirports) {
      const originOptions = [airport, ...(NEARBY_AIRPORTS[airport] || [])];

      for (const leg of emptyLegs.flights) {
        if (!originOptions.includes(leg.from) && distanceBetween(airport, leg.from) > MAX_ORIGIN_DISTANCE_MILES) continue;

        // Don't duplicate if we already have a specific rescue match for this leg
        const alreadyMatched = deals.some(d => d.emptyLeg.id === leg.id);
        if (alreadyMatched) continue;

        const disruption = [...(disruptions || []), ...(cancellationData.airportStats || [])]
          .find(d => d.airport === airport);

        deals.push({
          type: 'disruption_escape',
          priority: disruption?.severity === 'critical' ? 'high' : 'medium',
          disruptedAirport: {
            code: airport,
            city: getCity(airport),
            status: disruption?.status || 'Disrupted',
            reason: disruption?.reason || '',
            cancellationCount: disruption?.cancellationCount || null,
          },
          emptyLeg: { ...leg },
          match: {
            originDistance: distanceBetween(airport, leg.from),
            score: 50, // Lower score than direct rescue matches
          },
          headline: `${getCity(airport)} disrupted — fly ${leg.fromCity} → ${leg.toCity} instead`,
          id: `escape-${airport}-${leg.id}`,
        });
      }
    }
  }

  // Sort by match score (best matches first)
  deals.sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0));

  return deals;
}

function calculateMatchScore(originDist, destDist, cancel, leg) {
  let score = 100;

  // Penalize for distance from cancelled airport
  if (originDist > 0) score -= Math.min(originDist / 2, 30);

  // Penalize for destination mismatch
  if (destDist > 0) score -= Math.min(destDist / 3, 25);

  // Bonus for exact matches
  if (originDist === 0) score += 10;
  if (destDist === 0) score += 10;

  // Bonus if price is available (more useful to the user)
  if (leg.price) score += 5;

  // Bonus for more seats
  if (leg.seats && leg.seats >= 6) score += 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildHeadline(cancel, leg) {
  const flightInfo = cancel.flightNumber ? `${cancel.airline || ''} ${cancel.flightNumber}` : `Your flight`;
  const routeMatch = cancel.origin === leg.from && cancel.destination === leg.to;

  if (routeMatch) {
    return `${flightInfo.trim()} cancelled — same route available by private jet`;
  }

  if (cancel.origin === leg.from) {
    return `${flightInfo.trim()} cancelled — fly ${leg.fromCity} → ${leg.toCity} by private jet`;
  }

  return `${flightInfo.trim()} cancelled — nearby empty leg: ${leg.fromCity} → ${leg.toCity}`;
}

module.exports = { matchDeals };
