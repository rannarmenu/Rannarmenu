import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import './sponsor-ticker.css';

const SPONSORS = [
  {
    name: 'Somoy TV',
    label: 'সময় টিভি',
    href: 'https://www.somoynews.tv/',
    logo: 'https://thefe-bd.sgp1.cdn.digitaloceanspaces.com/posts/53385/somoy.jpg',
    className: 'sponsor-logo-somoy',
  },
  {
    name: 'NTV',
    label: 'NTV',
    href: 'https://www.ntvbd.com/',
    logo: `${import.meta.env.BASE_URL}ntv-bangladesh-logo.svg`,
    className: 'sponsor-logo-ntv',
  },
  {
    name: 'Boishakhi TV',
    label: 'বৈশাখী টিভি',
    href: 'https://boishakhi.tv/',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Boishakhi_Tv_Logo.png',
    className: 'sponsor-logo-boishakhi',
  },
  {
    name: 'Jamuna TV',
    label: 'যমুনা টিভি',
    href: 'https://jamuna.tv/',
    logo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Jamuna_TV_logo.svg',
    className: 'sponsor-logo-jamuna',
  },
  {
    name: 'Maasranga TV',
    label: 'মাছরাঙা টিভি',
    href: 'https://maasranga.tv/',
    logo: 'https://beyondtechbd.com/wp-content/uploads/2023/04/16.maasranga.png',
    className: 'sponsor-logo-maasranga',
  },
  {
    name: 'Channel 24',
    label: 'চ্যানেল ২৪',
    href: 'https://www.channel24bd.tv/',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Channel24logo.svg/1280px-Channel24logo.svg.png',
    className: 'sponsor-logo-channel24',
  },
  {
    name: 'SYLAÉ Group Ltd',
    label: 'SYLAÉ',
    href: 'https://sylaebd.shop/',
    wordmark: true,
    className: 'sponsor-logo-sylae',
  },
];

function SponsorGroup({ duplicate = false }) {
  return (
    <div className="sponsor-ticker-group" aria-hidden={duplicate ? 'true' : undefined}>
      {SPONSORS.map((sponsor) => (
        <a
          key={sponsor.name}
          className="sponsor-ticker-item"
          href={sponsor.href}
          target="_blank"
          rel="noopener noreferrer"
          title={sponsor.name}
          aria-label={sponsor.name + ' ওয়েবসাইট খুলুন'}
          tabIndex={duplicate ? -1 : undefined}
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
        </a>
      ))}
    </div>
  );
}

export default function SponsorTicker() {
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
          <SponsorGroup />
          <SponsorGroup duplicate />
        </div>
      </div>
      <div className="sponsor-ticker-footer">
        <span>আমাদের স্পনসর ও পার্টনারদের ওয়েবসাইট দেখতে লোগোতে চাপ দিন</span>
        <ArrowUpRight size={14} aria-hidden="true" />
      </div>
    </section>
  );
}
