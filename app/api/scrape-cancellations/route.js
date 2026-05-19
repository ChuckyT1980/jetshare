import { NextResponse } from 'next/server';
import fs from 'fs';

async function getScraper() {
  const mod = require('../../../lib/scraper-cancellations');
  return mod.scrapeCancellations;
}

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const scrapeCancellations = await getScraper();
    console.log('[API] Starting cancellation scrape...');

    const data = await scrapeCancellations();

    // Cache to /tmp (works on Vercel; silently skipped on Windows dev)
    try {
      fs.writeFileSync('/tmp/cancellations.json', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('[API] Cache write skipped (no /tmp locally):', e.code);
    }

    return NextResponse.json({
      success: true,
      message: `Found ${data.totalCancellations} cancellations, ${data.totalDisruptions} disruptions at ${data.affectedAirports.length} airports`,
      disruptions: data.disruptions,
      affectedAirports: data.affectedAirports,
      sourcesChecked: data.sourcesChecked,
      scrapedAt: data.scrapedAt,
    });
  } catch (error) {
    console.error('[API] Scrape cancellations error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
