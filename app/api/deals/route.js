import { NextResponse } from 'next/server';
import fs from 'fs';
import fallbackFlights from '../../../lib/fallback-flights.json';

function getMatcher() {
  return require('../../../lib/matcher').matchDeals;
}

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const matchDeals = getMatcher();

    // Load cached empty legs
    let emptyLegs = null;
    try {
      if (fs.existsSync('/tmp/empty-legs.json')) {
        emptyLegs = JSON.parse(fs.readFileSync('/tmp/empty-legs.json', 'utf8'));
        // Check freshness (24h)
        const age = Date.now() - new Date(emptyLegs.scrapedAt).getTime();
        if (age > 24 * 60 * 60 * 1000) emptyLegs = null;
      }
    } catch (e) { emptyLegs = null; }

    // Fallback if no cached data
    if (!emptyLegs || !emptyLegs.flights?.length) {
      emptyLegs = fallbackFlights;
    }

    // Load cached cancellations
    let cancellations = null;
    try {
      if (fs.existsSync('/tmp/cancellations.json')) {
        cancellations = JSON.parse(fs.readFileSync('/tmp/cancellations.json', 'utf8'));
        const age = Date.now() - new Date(cancellations.scrapedAt).getTime();
        if (age > 12 * 60 * 60 * 1000) cancellations = null;
      }
    } catch (e) { cancellations = null; }

    // Run matcher
    const rescueDeals = cancellations ? matchDeals(emptyLegs, cancellations) : [];

    return NextResponse.json({
      emptyLegs: emptyLegs.flights || [],
      rescueDeals,
      disruptions: cancellations?.disruptions || [],
      affectedAirports: cancellations?.affectedAirports || [],
      meta: {
        emptyLegSource: emptyLegs.source || 'unknown',
        emptyLegCount: (emptyLegs.flights || []).length,
        rescueDealCount: rescueDeals.length,
        disruptionCount: (cancellations?.disruptions || []).length,
        lastFlightScrape: emptyLegs.scrapedAt || null,
        lastCancellationScrape: cancellations?.scrapedAt || null,
      },
    });
  } catch (error) {
    console.error('[API] Deals error:', error);
    return NextResponse.json({
      emptyLegs: fallbackFlights.flights || [],
      rescueDeals: [],
      disruptions: [],
      affectedAirports: [],
      meta: { error: error.message },
    });
  }
}
