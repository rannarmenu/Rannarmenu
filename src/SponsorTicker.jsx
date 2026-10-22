import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import './sponsor-ticker.css';
import { SPONSORS } from './lib/sponsorPartners.js';

function SponsorGroup({ duplicate = false, onSelectSponsor, selectedSponsor }) {
  return (
    <div className="sponsor-ticker-group" aria-hidden={duplicate ? 'true' : undefined}>
      {SPONSORS.map((sponsor) => (
        <button
          key={sponsor.name}
          type="button"
          className="sponsor-ticker-item"
          onClick={() => onSelectSponsor?.(sponsor)}
          title={sponsor.name + ' এর খবর দেখুন'}
          aria-label={sponsor.name + ' এর খবর দেখুন'}
          aria-pressed={duplicate ? undefined : selectedSponsor?.name === sponsor.name}
          tabIndex={duplicate ? -1 : 0}
        >
          <span className={'sponsor-ticker-logo ' + sponsor.className}>
            {sponsor.wordmark ? (
              <span className="sponsor-ticker-wordmark">
                <strong>SYLAÉ</strong>
                <small>GROUP LTD</small>
              </span>
            ) : (
              <img
                src={sponsor.logo}
                alt={sponsor.label}
                loading="eager"
                decoding="async"
                draggable="false"
                onError={(event) => {
                  event.currentTarget.hidden = true;
                  const fallback = event.currentTarget.nextElementSibling;
                  if (fallback) fallback.hidden = false;
                }}
              />
            )}
            {!sponsor.wordmark && <span className="sponsor-ticker-fallback" hidden>{sponsor.label}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function SponsorTicker({ onSelectSponsor, selectedSponsor = null }) {
  return (
    <section className="sponsor-ticker-section" aria-labelledby="sponsor-ticker-heading">
      <div className="sponsor-ticker-heading">
        <div>
          <span className="sponsor-ticker-kicker">OUR SPONSORS &amp; PARTNERS</span>
          <h2 id="sponsor-ticker-heading">আমাদের পাশে যারা</h2>
        </div>

      </div>
      <div className="sponsor-ticker-viewport" aria-label="চলমান স্পনসর লোগো">
        <div className="sponsor-ticker-track">
          <SponsorGroup onSelectSponsor={onSelectSponsor} selectedSponsor={selectedSponsor} />
          <SponsorGroup duplicate onSelectSponsor={onSelectSponsor} selectedSponsor={selectedSponsor} />
        </div>
      </div>
      <div className="sponsor-ticker-footer">
        <span>যে স্পনসরের খবর দেখতে চান, চলমান লোগোতে চাপ দিন</span>
        <ArrowUpRight size={14} aria-hidden="true" />
      </div>
    </section>
  );
}
