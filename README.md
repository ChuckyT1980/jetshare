# JetShare — Private Jet Empty Leg Deals Platform

Luxury private jet deals aggregator that scrapes real-time empty leg inventory and matches flight cancellations to available private jets. Built on Next.js 14, deployed on Vercel.

## What It Does

- **Villiers Empty Leg Scraper** — Automatically scrapes villiers.com for available empty leg flights using multi-strategy parsing (HTML, embedded JSON, API endpoints)
- **Flight Cancellation Scraper** — Monitors 10 major US hub airports for disruptions via FAA status API, airport flight boards, and FlightAware data
- **Rescue Deal Matcher** — When a commercial flight gets cancelled near an available empty leg, the system auto-generates "rescue deals" matching stranded flyers to private jets
- **Social Booking** — Stranded Flyers platform for group cost-splitting on empty leg flights

## Tech Stack

- Next.js 14 (App Router)
- Cheerio (HTML scraping, no Puppeteer)
- Vercel Cron Jobs (automated scraping every 6 hours)
- FAA Airport Status API

## Deploy

```bash
npm install
vercel
```

## API Routes

- `/api/scrape-flights` — Trigger Villiers empty leg scrape
- `/api/scrape-cancellations` — Trigger cancellation scrape across all sources
- `/api/deals` — Serves merged data: empty legs + rescue deals + disruptions

## Built by [Logic Flow Systems](https://logicflowsystems.io)
