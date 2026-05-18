import { NextResponse } from 'next/server';
import fs from 'fs';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { scrapeVilliers } = require('../../../lib/scraper-villiers');
  const { scrapeCancellations } = require('../../../lib/scraper-cancellations');

  const [flightsResult, cancellationsResult] = await Promise.allSettled([
    scrapeVilliers(),
    scrapeCancellations(),
  ]);

  let flightsStatus = {};
  if (flightsResult.status === 'fulfilled') {
    const data = flightsResult.value;
    if (data?.flights?.length > 0) {
      fs.writeFileSync('/tmp/empty-legs.json', JSON.stringify(data, null, 2));
      flightsStatus = { success: true, count: data.flights.length };
    } else {
      flightsStatus = { success: false, message: 'No flights found — fallback data will serve' };
    }
  } else {
    flightsStatus = { success: false, error: flightsResult.reason?.message };
  }

  let cancellationsStatus = {};
  if (cancellationsResult.status === 'fulfilled') {
    const data = cancellationsResult.value;
    fs.writeFileSync('/tmp/cancellations.json', JSON.stringify(data, null, 2));
    cancellationsStatus = {
      success: true,
      cancellations: data.totalCancellations,
      disruptions: data.totalDisruptions,
      affectedAirports: data.affectedAirports?.length || 0,
    };
  } else {
    cancellationsStatus = { success: false, error: cancellationsResult.reason?.message };
  }

  return NextResponse.json({
    scrapedAt: new Date().toISOString(),
    flights: flightsStatus,
    cancellations: cancellationsStatus,
  });
}
