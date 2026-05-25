'use client';

import { useState, useEffect, useRef } from 'react';

const AFFILIATE_URL = 'https://villiers.ai/?id=PGKKD7';

// ─── SVG Icons ──────────────────────────────────────────
const PlaneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const RouteArrow = () => (
  <svg width="28" height="12" viewBox="0 0 28 12" fill="none" className="deal-route-icon">
    <line x1="0" y1="6" x2="22" y2="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4"/>
    <path d="M20 2l6 4-6 4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
  </svg>
);

// ─── Destination images (Unsplash) ──────────────────────
const CITY_IMAGES = {
  // Real Villiers destinations
  'Austin':           'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=400&h=250&fit=crop',
  'Boise':            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop',
  'Columbus':         'https://images.unsplash.com/photo-1572202836989-9bea40614b24?w=400&h=250&fit=crop',
  'Dallas':           'https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=400&h=250&fit=crop',
  'Fort Lauderdale':  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop',
  'Henderson':        'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=400&h=250&fit=crop',
  'Houston':          'https://images.unsplash.com/photo-1572262611032-e3a6ab650f95?w=400&h=250&fit=crop',
  'Indianapolis':     'https://images.unsplash.com/photo-1565017228-6521a14e3ddb?w=400&h=250&fit=crop',
  'Kerrville':        'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=400&h=250&fit=crop',
  'Long Island':      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=250&fit=crop',
  'Los Angeles':      'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=400&h=250&fit=crop',
  'Lubbock':          'https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=400&h=250&fit=crop',
  'Miami':            'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=400&h=250&fit=crop',
  'Mobile':           'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop',
  'Monterey':         'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=250&fit=crop',
  'New Orleans':      'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&h=250&fit=crop',
  'New York':         'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=250&fit=crop',
  'North Eleuthera':  'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=250&fit=crop',
  'Palermo':          'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=400&h=250&fit=crop',
  'Porto':            'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&h=250&fit=crop',
  'Providenciales':   'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=250&fit=crop',
  'Rogers':           'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=250&fit=crop',
  'Sacramento':       'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=250&fit=crop',
  'Santa Barbara':    'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=400&h=250&fit=crop',
  'Toronto':          'https://images.unsplash.com/photo-1517090186835-e348b621c9ca?w=400&h=250&fit=crop',
  // Legacy / possible future destinations
  'Las Vegas':        'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=400&h=250&fit=crop',
  'Nice':             'https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=400&h=250&fit=crop',
  'Geneva':           'https://images.unsplash.com/photo-1573108037329-37aa135a142e?w=400&h=250&fit=crop',
  'Riyadh':           'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=400&h=250&fit=crop',
  'San Francisco':    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=250&fit=crop',
  'Ibiza':            'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&h=250&fit=crop',
  'Nashville':        'https://images.unsplash.com/photo-1587162146766-e06b1189b907?w=400&h=250&fit=crop',
  'Nassau':           'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=250&fit=crop',
  'London':           'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=250&fit=crop',
  'Paris':            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=250&fit=crop',
  'Dubai':            'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=250&fit=crop',
  'Chicago':          'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=400&h=250&fit=crop',
  'default':          'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=250&fit=crop',
};

function getCityImage(city) {
  return CITY_IMAGES[city] || CITY_IMAGES['default'];
}

// ─── Empty Legs Ticker ──────────────────────────────────
function EmptyLegsTicker({ flights }) {
  // ONLY show real scraped data — never fallback placeholders
  const realFlights = (flights || []).filter(f => f.source === 'villiers' || f.source === 'villiers-api');

  if (realFlights.length === 0) return null;

  const items = realFlights.length < 6
    ? [...realFlights, ...realFlights, ...realFlights]
    : [...realFlights, ...realFlights]; // duplicate for seamless infinite scroll

  return (
    <div className="ticker-strip ticker-strip-empty-legs">
      <div className="ticker-label ticker-label-empty-legs">
        <span className="ticker-label-dot" />
        ✈ LIVE EMPTY LEGS
      </div>
      <div className="ticker-track-wrap">
        <div className="ticker-track">
          {items.map((flight, i) => (
            <a
              key={`el-${i}`}
              href={AFFILIATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ticker-item ticker-item-empty-legs"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <span className="ticker-item-route">
                <span className="ticker-item-from">{flight.fromCity || flight.from}</span>
                <span className="ticker-item-arrow">→</span>
                <span className="ticker-item-to">{flight.toCity || flight.to}</span>
              </span>
              {flight.aircraft && (
                <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>· {flight.aircraft}</span>
              )}
              {flight.price ? (
                <span className="ticker-item-price">
                  · ${flight.price.toLocaleString()}
                </span>
              ) : (
                <span className="ticker-item-price">· Request Quote</span>
              )}
              {flight.date && (
                <span style={{ opacity: 0.55, fontSize: '0.65rem' }}>· {flight.date}</span>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Cancellations Ticker ────────────────────────────────
function CancellationsTicker({ disruptions, cancellations }) {
  const allItems = [
    ...(disruptions || []).map(d => ({
      key: `d-${d.airport}`,
      label: `⚠ ${d.city || d.airport}`,
      detail: `${d.status}${d.reason ? ` — ${d.reason}` : ''}`,
      severity: d.severity,
    })),
    ...(cancellations || []).map((c, i) => ({
      key: `c-${i}`,
      label: `✕ ${c.flightNumber || c.airline || 'Flight'} ${c.originCity || c.origin} → ${c.destinationCity || c.destination}`,
      detail: `CANCELLED${c.scheduledTime ? ` · ${c.scheduledTime}` : ''}`,
      severity: 'critical',
    })),
  ];

  if (allItems.length === 0) return null;

  const items = allItems.length < 6
    ? [...allItems, ...allItems, ...allItems]
    : [...allItems, ...allItems];

  return (
    <div className="ticker-strip ticker-strip-cancellations">
      <div className="ticker-label ticker-label-cancellations">
        <span className="ticker-label-dot" />
        ⚡ DISRUPTIONS
      </div>
      <div className="ticker-track-wrap">
        <div className="ticker-track ticker-track-cancellations">
          {items.map((item, i) => (
            <span
              key={`${item.key}-${i}`}
              className={`ticker-item ticker-item-severity-${item.severity || 'high'}`}
            >
              <span className="ticker-item-status">
                <strong>{item.label}</strong>
                <span style={{ opacity: 0.7 }}>· {item.detail}</span>
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────
export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');

  useEffect(() => {
    fetch(`/api/deals?t=${Date.now()}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const emptyLegs = data?.emptyLegs || [];
  const rescueDeals = data?.rescueDeals || [];
  const disruptions = data?.disruptions || [];
  const cancellations = data?.cancellations || [];
  const meta = data?.meta || {};

  // Compute how many ticker strips are visible
  const tickerCount = (emptyLegs.length > 0 ? 1 : 0) + ((disruptions.length > 0 || cancellations.length > 0) ? 1 : 0);
  const tickerOffset = tickerCount * 34; // 34px per ticker

  // Filter flights based on search
  const filteredLegs = emptyLegs.filter(f => {
    if (searchFrom && !f.fromCity?.toLowerCase().includes(searchFrom.toLowerCase()) && !f.from?.toLowerCase().includes(searchFrom.toLowerCase())) return false;
    if (searchTo && !f.toCity?.toLowerCase().includes(searchTo.toLowerCase()) && !f.to?.toLowerCase().includes(searchTo.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      {/* ═══ TICKER: VILLIERS EMPTY LEGS ═══ */}
      <EmptyLegsTicker flights={emptyLegs} />

      {/* ═══ TICKER: CANCELLATIONS / DISRUPTIONS ═══ */}
      <CancellationsTicker
        disruptions={disruptions}
        cancellations={cancellations}
      />

      {/* ═══ NAVIGATION ═══ */}
      <nav className="nav" style={{ top: `${tickerOffset}px` }}>
        <a href="/" className="nav-logo">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="#D4A843" strokeWidth="2"/>
            <path d="M24 14l-3 8-5-3-6 1 2-3 5-1 3-5 4 3z" fill="#D4A843"/>
          </svg>
          <span>Jet<span className="gold">Share</span></span>
        </a>
        <ul className="nav-links">
          <li><a href="#deals">Deals</a></li>
          <li><a href="#social">Social Booking</a></li>
          <li><a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer">Book a Flight</a></li>
        </ul>
        <div className="nav-actions">
          <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className="btn-outline">Log In</a>
          <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
            <UsersIcon /> Sign Up Free
          </a>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="hero" style={{ paddingTop: `${tickerOffset + 80 + 32}px` }}>
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-badge">
              <span className="dot" />
              {meta.emptyLegCount || 85} NEW DEALS THIS HOUR
            </div>
            <h1 className="font-display">
              Unrivaled<br/>Deals on<br/><em>Empty Leg</em><br/>Flights.
            </h1>
            <p className="hero-sub">
              Luxury travel, redefined. Access exclusive private jet empty leg inventory at up to 80% off commercial prices.
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-avatars">
                  <div className="avatar">👤</div>
                  <div className="avatar">👤</div>
                  <div className="avatar">👤</div>
                </div>
                <div className="hero-stat-text">
                  <strong>1,200+ Members</strong>
                  <span>Flying private today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Card */}
          <div className="search-card">
            <h2><SearchIcon /> Find Your Route</h2>
            <div className="search-field-wrap">
              <MapPinIcon />
              <input
                type="text"
                className="search-field"
                placeholder="From (Departure)"
                value={searchFrom}
                onChange={e => setSearchFrom(e.target.value)}
              />
            </div>
            <div className="search-field-wrap">
              <MapPinIcon />
              <input
                type="text"
                className="search-field"
                placeholder="To (Destination)"
                value={searchTo}
                onChange={e => setSearchTo(e.target.value)}
              />
            </div>
            <div className="search-row">
              <div className="search-field-wrap">
                <CalendarIcon />
                <input type="text" className="search-field" placeholder="Date" />
              </div>
              <div className="search-field-wrap">
                <UsersIcon />
                <input type="text" className="search-field" placeholder="Passengers" />
              </div>
            </div>
            <button className="search-btn" onClick={() => {
              window.open(AFFILIATE_URL, '_blank', 'noopener,noreferrer');
            }}>
              ✈ Search Luxury Deals
            </button>
            <p className="search-partner">OFFICIAL VILLIERS AFFILIATE PARTNER</p>
          </div>
        </div>
      </section>

      {/* ═══ RESCUE DEALS (if any) ═══ */}
      {rescueDeals.length > 0 && (
        <section className="section" style={{ paddingBottom: '2rem' }}>
          <div className="section-header">
            <div>
              <h2 className="font-display">
                <AlertIcon /> <em>Emergency</em> Rescue Deals
              </h2>
              <p>Flight cancelled? We matched available private jets to get you there.</p>
            </div>
          </div>
          <div className="deals-grid">
            {rescueDeals.slice(0, 4).map((deal) => (
              <div key={deal.id} className="deal-card" style={{ borderColor: 'rgba(197, 48, 48, 0.4)' }}>
                <div className="deal-card-image" style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fca5a5', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', padding: '0 1rem' }}>
                    {deal.headline}
                  </span>
                </div>
                <div className="deal-card-body">
                  <div className="deal-route">
                    <div className="deal-route-from">
                      <div className="deal-route-label">FROM</div>
                      <div className="deal-route-city">{deal.emptyLeg.fromCity}</div>
                    </div>
                    <RouteArrow />
                    <div className="deal-route-to">
                      <div className="deal-route-label">TO</div>
                      <div className="deal-route-city">{deal.emptyLeg.toCity}</div>
                    </div>
                  </div>
                  <div className="deal-meta">
                    {deal.emptyLeg.date && <span className="deal-date">⚡ {deal.emptyLeg.date}</span>}
                    <span style={{ fontSize: '0.78rem', color: '#48BB78' }}>Match: {deal.match.score}%</span>
                  </div>
                  <div className="deal-footer">
                    <div>
                      {deal.emptyLeg.price && (
                        <span className="deal-price">${deal.emptyLeg.price.toLocaleString()}</span>
                      )}
                      <span className="deal-price-label">TOTAL PRICE</span>
                    </div>
                    <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className="deal-book-btn">Rescue Me ✈</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ DISRUPTION ALERTS ═══ */}
      {disruptions.length > 0 && (
        <section style={{ padding: '0 2rem 2rem', maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {disruptions.map((d, i) => (
              <div key={i} style={{
                padding: '0.8rem 1.2rem',
                background: d.severity === 'critical' ? 'rgba(197, 48, 48, 0.15)' : 'rgba(212, 168, 67, 0.1)',
                border: `1px solid ${d.severity === 'critical' ? 'rgba(197, 48, 48, 0.3)' : 'rgba(212, 168, 67, 0.2)'}`,
                borderRadius: '10px',
                whiteSpace: 'nowrap',
                fontSize: '0.85rem',
              }}>
                <strong>{d.airport}</strong> — {d.status} {d.reason && `(${d.reason})`}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ EMPTY LEG DEALS ═══ */}
      <section id="deals" className="section">
        <div className="section-header">
          <div>
            <h2 className="font-display">
              Exclusive <em>Empty Leg</em> Deals
            </h2>
            <p>Unmatched prices on one-way flights. Act fast — these deals typically book within minutes.</p>
          </div>
          <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className="view-all">
            View All Deals <ArrowRightIcon />
          </a>
        </div>

        {loading ? (
          <div className="deals-grid">
            {[1,2,3,4].map(i => (
              <div key={i} className="deal-card">
                <div className="skeleton" style={{ height: '180px' }} />
                <div style={{ padding: '1.3rem' }}>
                  <div className="skeleton" style={{ height: '20px', width: '80%', marginBottom: '0.8rem' }} />
                  <div className="skeleton" style={{ height: '16px', width: '60%', marginBottom: '0.8rem' }} />
                  <div className="skeleton" style={{ height: '32px', width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="deals-grid">
            {(searchFrom || searchTo ? filteredLegs : emptyLegs).map((flight, i) => {
              const originalPrice = flight.price ? Math.round(flight.price * 5) : null;
              const discount = originalPrice ? Math.round((1 - flight.price / originalPrice) * 100) : 80;

              return (
                <div key={flight.id || i} className="deal-card">
                  <div className="deal-card-image">
                    <img
                      src={getCityImage(flight.toCity)}
                      alt={flight.toCity}
                      loading="lazy"
                      onError={e => { e.target.src = CITY_IMAGES['default']; }}
                    />
                    <span className="deal-badge">{discount}% OFF</span>
                    <div className="deal-aircraft">
                      <span className="deal-aircraft-type">{flight.aircraft}</span>
                      <span className="deal-aircraft-seats">{flight.seats} Seats Available</span>
                    </div>
                  </div>
                  <div className="deal-card-body">
                    <div className="deal-route">
                      <div className="deal-route-from">
                        <div className="deal-route-label">FROM</div>
                        <div className="deal-route-city">{flight.fromCity}</div>
                      </div>
                      <RouteArrow />
                      <div className="deal-route-to">
                        <div className="deal-route-label">TO</div>
                        <div className="deal-route-city">{flight.toCity}</div>
                      </div>
                    </div>
                    <div className="deal-meta">
                      {flight.date && <span className="deal-date">⚡ {flight.date}</span>}
                      {originalPrice && <span className="deal-original-price">${originalPrice.toLocaleString()}</span>}
                    </div>
                    <div className="deal-footer">
                      <div>
                        {flight.price ? (
                          <span className="deal-price">${flight.price.toLocaleString()}</span>
                        ) : (
                          <span className="deal-price" style={{ fontSize: '1.2rem' }}>Request Quote</span>
                        )}
                        <span className="deal-price-label">TOTAL PRICE</span>
                      </div>
                      <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className="deal-book-btn">Book Now ✈</a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}


      </section>

      {/* ═══ SOCIAL BOOKING ═══ */}
      <section id="social" className="social-section">
        <div className="social-inner">
          <div className="social-left">
            <span className="social-badge">SOCIAL BOOKING PLATFORM</span>
            <h2 className="font-display">
              Don&apos;t Fly<br/>Alone.<br/>Join <em>Stranded<br/>Flyers</em>.
            </h2>
            <p>
              Unlock private jet travel for a fraction of the cost by grouping with other elite travelers. Our &ldquo;Stranded Flyers&rdquo; platform matches users on similar routes to share empty leg costs.
            </p>
            <div className="social-features">
              <div className="social-feature">
                <div className="social-feature-icon"><UsersIcon /></div>
                <div>
                  <h4>Group Booking</h4>
                  <p>Fill the cabin, split the bill. Save up to 90% per person.</p>
                </div>
              </div>
              <div className="social-feature">
                <div className="social-feature-icon"><ShieldIcon /></div>
                <div>
                  <h4>Verified Flyers</h4>
                  <p>Every member is vetted for a premium social experience.</p>
                </div>
              </div>
            </div>
            <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className="btn-red">Create a New Group</a>
          </div>

          <div className="social-right">
            <div className="trending-header">
              <h3 className="font-display">Start a Group</h3>
            </div>

            <div className="group-card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Be the first on your route.</p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Post your route on Villiers and invite others to split the cost of an empty leg with you.
              </p>
              <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className="group-join-btn" style={{ padding: '0.7rem 1.5rem', fontSize: '0.9rem' }}>
                Find a Flight to Share ✈
              </a>
            </div>

            <div className="group-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.3rem' }}>Already flying private?</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>List your empty seats and split the charter cost with verified flyers.</p>
              <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className="group-join-btn">
                List My Seats
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ═══ TRUST BAR ═══ */}
      <section className="trust-bar">
        <h3 className="font-display">Trusted by Global High-Net-Worth Individuals</h3>
        <div className="trust-logos">
          <span className="trust-logo">FORBES</span>
          <span className="trust-logo">BLOOMBERG</span>
          <span className="trust-logo">VOGUE</span>
          <span className="trust-logo">MONOCLE</span>
          <span className="trust-logo">ROBB REPORT</span>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="cta-section">
        <div className="cta-card">
          <h2 className="font-display">
            Ready to elevate your<br/><em>travel experience?</em>
          </h2>
          <p>Join JetShare today and get instant access to our private network of empty leg deals and social booking groups.</p>
          <div className="cta-buttons">
            <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className="btn-red">Get Started Free</a>
            <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className="btn-gold">Browse All Deals</a>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="footer">
        <p>
          © 2026 JetShare. Built by <a href="https://logicflowsystems.io" target="_blank" rel="noopener">Logic Flow Systems</a>. 
          Data sourced from Villiers Jets & public aviation feeds.
          {meta.lastFlightScrape && (
            <span> · Last updated: {new Date(meta.lastFlightScrape).toLocaleString()}</span>
          )}
        </p>
      </footer>
    </>
  );
}
