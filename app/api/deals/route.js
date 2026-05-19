import { NextResponse } from 'next/server';
import fs from 'fs';
import realFlights from '../../../lib/real-flights.json';

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

    // Final fallback — use manually verified real Villiers data
    if (!emptyLegs || !emptyLegs.flights?.length) {
      emptyLegs = realFlights;
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
        fs.writeFileSync(CANCELLATIONS_CACHE, JSON.stringify(scraped, null, 2));
        cancellations = scraped;
      } catch (e) {
        console.error('[Deals] Cancellation scrape failed:', e.message);
      }
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
