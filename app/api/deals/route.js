import { NextResponse } from 'next/server';
import fs from 'fs';

const EMPTY_LEGS_CACHE = '/tmp/empty-legs.json';
const CANCELLATIONS_CACHE = '/tmp/cancellations.json';

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
      if (fs.existsSync(EMPTY_LEGS_CACHE)) {
        emptyLegs = JSON.parse(fs.readFileSync(EMPTY_LEGS_CACHE, 'utf8'));
        // Check freshness (24h)
        const age = Date.now() - new Date(emptyLegs.scrapedAt).getTime();
        if (age > 24 * 60 * 60 * 1000) emptyLegs = null;
      }
    } catch (e) { emptyLegs = null; }

    // No real data yet — return empty
    if (!emptyLegs || !emptyLegs.flights?.length) {
      emptyLegs = { flights: [], source: 'none' };
    }

    // Load cached cancellations
    let cancellations = null;
    try {
      if (fs.existsSync(CANCELLATIONS_CACHE)) {
        cancellations = JSON.parse(fs.readFileSync(CANCELLATIONS_CACHE, 'utf8'));
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
      emptyLegs: [],
      rescueDeals: [],
      disruptions: [],
      affectedAirports: [],
      meta: { error: error.message },
    });
  }
}
