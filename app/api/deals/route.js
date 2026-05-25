import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Dynamically read JSON so updates don't require server restarts
const getRealFlights = () => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib/real-flights.json'), 'utf8'));
const getRealDisruptions = () => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib/real-disruptions.json'), 'utf8'));

const EMPTY_LEGS_CACHE = '/tmp/empty-legs.json';
const CANCELLATIONS_CACHE = '/tmp/cancellations.json';

function getMatcher() {
  return require('../../../lib/matcher').matchDeals;
}

function getScraper() {
  return require('../../../lib/scraper-villiers').scrapeVilliers;
}

function getCancellationScraper() {
  return require('../../../lib/scraper-cancellations').scrapeCancellations;
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  try {
    const matchDeals = getMatcher();

    // Load cached empty legs
    let emptyLegs = null;
    try {
      if (fs.existsSync(EMPTY_LEGS_CACHE)) {
        emptyLegs = JSON.parse(fs.readFileSync(EMPTY_LEGS_CACHE, 'utf8'));
        const age = Date.now() - new Date(emptyLegs.scrapedAt).getTime();
        if (age > 24 * 60 * 60 * 1000) emptyLegs = null;
      }
    } catch (e) { emptyLegs = null; }

    // No live cache — try scraper, fall back to real static data
    if (!emptyLegs || !emptyLegs.flights?.length) {
      console.log('[Deals] No cached flights — running live scrape...');
      try {
        const scrapeVilliers = getScraper();
        const scraped = await scrapeVilliers();
        if (scraped?.flights?.length > 0) {
          fs.writeFileSync(EMPTY_LEGS_CACHE, JSON.stringify(scraped, null, 2));
          emptyLegs = scraped;
        }
      } catch (e) {
        console.error('[Deals] Live scrape failed:', e.message);
      }
    }

    // Always include our manually verified real Villiers data (which includes the uploaded images)
    if (!emptyLegs || !emptyLegs.flights?.length) {
      emptyLegs = getRealFlights();
    } else {
      // Prepend our image-based flights so they appear first!
      emptyLegs.flights = [...getRealFlights().flights, ...emptyLegs.flights];
      emptyLegs.totalFound = emptyLegs.flights.length;
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

    // No cancellation cache — run that scraper too
    if (!cancellations) {
      console.log('[Deals] No cached cancellations — running live scrape now...');
      try {
        const scrapeCancellations = getCancellationScraper();
        const scraped = await scrapeCancellations();
        // Only use live data if it actually found disruptions
        if (scraped?.totalDisruptions > 0 || scraped?.totalCancellations > 0) {
          try { fs.writeFileSync(CANCELLATIONS_CACHE, JSON.stringify(scraped, null, 2)); } catch (e) {}
          cancellations = scraped;
        }
      } catch (e) {
        console.error('[Deals] Cancellation scrape failed:', e.message);
      }
    }

    // Final fallback — use static real disruption data so red ticker always runs
    if (!cancellations || (cancellations.totalDisruptions === 0 && cancellations.totalCancellations === 0)) {
      cancellations = getRealDisruptions();
    }

    const flights = emptyLegs?.flights || [];
    const rescueDeals = cancellations ? matchDeals(emptyLegs || { flights }, cancellations) : [];

    return NextResponse.json({
      emptyLegs: flights,
      rescueDeals,
      disruptions: cancellations?.disruptions || [],
      affectedAirports: cancellations?.affectedAirports || [],
      cancellations: cancellations?.cancellations || [],
      meta: {
        emptyLegSource: emptyLegs?.source || 'none',
        emptyLegCount: flights.length,
        rescueDealCount: rescueDeals.length,
        disruptionCount: (cancellations?.disruptions || []).length,
        lastFlightScrape: emptyLegs?.scrapedAt || null,
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
      cancellations: [],
      meta: { error: error.message },
    });
  }
}
