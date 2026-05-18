import { NextResponse } from 'next/server';
import fs from 'fs';

// Dynamic import for commonjs module
async function getScraper() {
  const mod = require('../../../lib/scraper-villiers');
  return mod.scrapeVilliers;
}

export const maxDuration = 30; // Vercel serverless timeout
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const scrapeVilliers = await getScraper();
    console.log('[API] Starting Villiers empty leg scrape...');

    const data = await scrapeVilliers();

    if (data && data.flights.length > 0) {
      // Cache to /tmp (persists within warm lambda invocations)
      fs.writeFileSync('/tmp/empty-legs.json', JSON.stringify(data, null, 2));

      return NextResponse.json({
        success: true,
        message: `Scraped ${data.flights.length} empty legs`,
        scrapedAt: data.scrapedAt,
        flightCount: data.flights.length,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No flights found from Villiers. Page structure may have changed or site is blocking.',
        scrapedAt: new Date().toISOString(),
        tip: 'Check /api/deals — it will serve fallback data.',
      });
    }
  } catch (error) {
    console.error('[API] Scrape flights error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
