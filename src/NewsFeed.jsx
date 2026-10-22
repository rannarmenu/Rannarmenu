import React, { useEffect, useState } from 'react';
import { ArrowUpRight, BadgeCheck, Clock3, Globe2, LoaderCircle, Newspaper, RefreshCw, Utensils, Building2, MapPin } from 'lucide-react';
import './news-feed.css';

const RSS_JSON_ENDPOINT = 'https://api.rss2json.com/v1/api.json';
const REFRESH_INTERVAL = 15 * 60 * 1000;
const CACHE_TTL = 12 * 60 * 1000;
const memoryCache = new Map();

const NEWS_CATEGORIES = [
  {
    id: 'food',
    label: 'খাবার ও রান্না',
    query: 'রান্না OR খাবার OR রেসিপি OR খাদ্য OR recipe OR cooking',
    Icon: Utensils,
  },
  {
    id: 'bangladesh',
    label: 'বাংলাদেশ',
    query: 'বাংলাদেশ OR Bangladesh news',
    Icon: MapPin,
  },
  {
    id: 'international',
    label: 'আন্তর্জাতিক',
    query: 'আন্তর্জাতিক OR বিশ্ব সংবাদ OR international news OR world news',
    Icon: Globe2,
  },
];

function googleNewsRss(query) {
  return 'https://news.google.com/rss/search?q=' + encodeURIComponent(query) + '&hl=bn&gl=BD&ceid=BD:bn';
}

function plainText(value) {
  return String(value || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeHttpUrl(value) {
  try {
    const parsed = new URL(String(value || ''));
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '';
  } catch {
    return '';
  }
}

function normalizeNewsItem(item, fallbackSource) {
  const rawTitle = plainText(item?.title);
  if (!rawTitle) return null;

  // Google News commonly appends the publisher after the final " - ".
  const separator = rawTitle.lastIndexOf(' - ');
  const hasPublisherSuffix = separator > 18 && separator < rawTitle.length - 4;
  const title = hasPublisherSuffix ? rawTitle.slice(0, separator).trim() : rawTitle;
  const inferredSource = hasPublisherSuffix ? rawTitle.slice(separator + 3).trim() : '';
  const description = plainText(item?.description || item?.contentSnippet || '');
  const imageFromDescription = String(item?.description || '').match(/<img[^>]+src=["']([^"']+)["']/i);
  const image = safeHttpUrl(item?.thumbnail || item?.enclosure?.link || imageFromDescription?.[1] || '');
  const link = safeHttpUrl(item?.link || item?.guid || '');
  if (!link) return null;

  return {
    id: link,
    title,
    link,
    source: plainText(item?.author || inferredSource || fallbackSource || 'সংবাদমাধ্যম'),
    publishedAt: item?.pubDate || item?.published || '',
    summary: description.length > 190 ? description.slice(0, 187) + '…' : description,
    image,
  };
}

async function loadFeed(query, signal, force = false) {
  const rssUrl = googleNewsRss(query);
  const cacheKey = rssUrl;
  const cached = memoryCache.get(cacheKey);
  if (!force && cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return { items: cached.items, updatedAt: cached.cachedAt, fromCache: true };
  }

  const url = RSS_JSON_ENDPOINT + '?rss_url=' + encodeURIComponent(rssUrl);
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('নিউজ সার্ভিস থেকে উত্তর পাওয়া যায়নি (HTTP ' + response.status + ')');

  const payload = await response.json();
  if (payload?.status !== 'ok') {
    throw new Error(plainText(payload?.message) || 'এই মুহূর্তে খবর আনা যাচ্ছে না।');
  }

  const items = [];
  const seen = new Set();
  for (const raw of Array.isArray(payload.items) ? payload.items : []) {
    const item = normalizeNewsItem(raw, payload.feed?.title);
    if (!item || seen.has(item.link)) continue;
    seen.add(item.link);
    items.push(item);
    if (items.length >= 10) break;
  }

  const result = { items, cachedAt: Date.now() };
  memoryCache.set(cacheKey, result);
  return { items, updatedAt: result.cachedAt, fromCache: false };
}

function formatNewsTime(value) {
  if (!value) return 'সময় উল্লেখ নেই';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'সময় উল্লেখ নেই';

  const diff = Math.max(0, Date.now() - parsed.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'এইমাত্র';
  if (minutes < 60) return minutes.toLocaleString('bn-BD') + ' মিনিট আগে';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours.toLocaleString('bn-BD') + ' ঘণ্টা আগে';
  const days = Math.floor(hours / 24);
  if (days < 7) return days.toLocaleString('bn-BD') + ' দিন আগে';

  return new Intl.DateTimeFormat('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: parsed.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  }).format(parsed);
}

function useNewsFeed(query, refreshKey = 0) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(query));
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(0);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    let active = true;
    let controller = new AbortController();
    let hasItems = false;

    if (!query) {
      setItems([]);
      setLoading(false);
      setError('');
      setUpdatedAt(0);
      setFromCache(false);
      return undefined;
    }

    setItems([]);
    setLoading(true);
    setError('');
    setUpdatedAt(0);
    setFromCache(false);

    const refresh = async (force = false) => {
      if (!active) return;
      if (!hasItems || force) setLoading(true);

      try {
        const result = await loadFeed(query, controller.signal, force);
        if (!active) return;
        setItems(result.items);
        hasItems = result.items.length > 0;
        setUpdatedAt(result.updatedAt || Date.now());
        setFromCache(Boolean(result.fromCache));
        setError(result.items.length ? '' : 'এই ক্যাটাগরিতে এখন কোনো খবর পাওয়া যায়নি।');
      } catch (caught) {
        if (!active || caught?.name === 'AbortError') return;
        setError(caught?.message || 'সংবাদ লোড করা যায়নি।');
        if (!hasItems) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void refresh(false);
    const interval = window.setInterval(() => {
      void refresh(true);
    }, REFRESH_INTERVAL);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, [query, refreshKey]);

  return { items, loading, error, updatedAt, fromCache };
}

function NewsItems({ items, Icon, compact = false }) {
  if (!items.length) return null;

  return (
    <div className={compact ? 'news-items news-items-compact' : 'news-items'}>
      {items.map((item) => (
        <article className="news-item" key={item.id}>
          <a className="news-item-media" href={item.link} target="_blank" rel="noopener noreferrer" aria-label={item.title + ' পড়ুন'}>
            {item.image ? (
              <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.hidden = true; }} />
            ) : null}
            <span className="news-item-media-fallback" aria-hidden="true"><Icon size={compact ? 25 : 29} strokeWidth={1.6} /></span>
          </a>
          <div className="news-item-content">
            <div className="news-item-meta">
              <span className="news-item-source">{item.source}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={item.publishedAt || undefined}><Clock3 size={12} aria-hidden="true" />{formatNewsTime(item.publishedAt)}</time>
            </div>
            <h3><a href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</a></h3>
            {!compact && item.summary && <p>{item.summary}</p>}
            <a className="news-item-read" href={item.link} target="_blank" rel="noopener noreferrer">খবর পড়ুন <ArrowUpRight size={14} aria-hidden="true" /></a>
          </div>
        </article>
      ))}
    </div>
  );
}

function FeedStatus({ loading, error, updatedAt, fromCache, onRefresh }) {
  return (
    <div className="news-feed-status">
      <span className="news-feed-status-copy" role={error ? 'status' : undefined}>
        {loading ? <><LoaderCircle className="news-spin" size={14} /> খবর আনা হচ্ছে…</> :
          error ? error :
          updatedAt ? <>সর্বশেষ আপডেট {new Intl.DateTimeFormat('bn-BD', { hour: 'numeric', minute: '2-digit' }).format(new Date(updatedAt))}{fromCache ? ' · ক্যাশ থেকে' : ''}</> :
          'স্বয়ংক্রিয় আপডেট চালু'}
      </span>
      <button className="news-refresh-button" type="button" onClick={onRefresh} disabled={loading} aria-label="খবর নতুন করে লোড করুন">
        <RefreshCw size={14} aria-hidden="true" /> রিফ্রেশ
      </button>
    </div>
  );
}

export default function NewsFeed({ selectedSponsor = null }) {
  const [activeCategory, setActiveCategory] = useState('food');
  const [sponsorRefreshKey, setSponsorRefreshKey] = useState(0);
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);
  const active = NEWS_CATEGORIES.find((category) => category.id === activeCategory) || NEWS_CATEGORIES[0];
  const sponsorFeed = useNewsFeed(selectedSponsor?.newsQuery || '', sponsorRefreshKey);
  const categoryFeed = useNewsFeed(active.query, categoryRefreshKey);
  const SponsorIcon = selectedSponsor?.wordmark ? Building2 : Newspaper;
  const ActiveIcon = active.Icon;

  useEffect(() => {
    if (selectedSponsor) {
      window.requestAnimationFrame(() => {
        document.getElementById('sponsor-news')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [selectedSponsor?.name]);

  return (
    <div className="homepage-news-wrap">
      <section className="homepage-news-panel sponsor-news-panel" id="sponsor-news" aria-labelledby="sponsor-news-heading">
        <div className="homepage-news-heading">
          <div className="homepage-news-heading-copy">
            <span className="homepage-news-kicker"><BadgeCheck size={13} /> PARTNER UPDATES</span>
            <h2 id="sponsor-news-heading"><Newspaper size={23} aria-hidden="true" /> স্পনসরদের খবর <span className="news-auto-badge">AUTO UPDATE</span></h2>
            <p>চলমান লোগোতে চাপ দিলে নির্বাচিত স্পনসর বা পার্টনারের প্রকাশিত খবর এখানে দেখাবে।</p>
          </div>
          {selectedSponsor && (
            <a className="news-source-site-link" href={selectedSponsor.href} target="_blank" rel="noopener noreferrer">
              অফিসিয়াল সাইট <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          )}
        </div>

        {selectedSponsor ? (
          <>
            <div className="selected-sponsor-banner">
              <span className={'selected-sponsor-logo ' + selectedSponsor.className}>
                {selectedSponsor.wordmark ? <strong>SYLAÉ</strong> : selectedSponsor.label}
              </span>
              <div className="selected-sponsor-copy">
                <strong>{selectedSponsor.name}</strong>
                <span>এই উৎসের নিউজ-ইনডেক্সে পাওয়া প্রকাশনা</span>
              </div>
              <span className="selected-sponsor-check"><BadgeCheck size={16} /> নির্বাচিত</span>
            </div>
            <FeedStatus loading={sponsorFeed.loading} error={sponsorFeed.items.length ? '' : sponsorFeed.error} updatedAt={sponsorFeed.updatedAt} fromCache={sponsorFeed.fromCache} onRefresh={() => setSponsorRefreshKey((value) => value + 1)} />
            {sponsorFeed.loading && !sponsorFeed.items.length ? (
              <div className="news-empty-state"><LoaderCircle className="news-spin" size={24} /><strong>খবর খোঁজা হচ্ছে…</strong><span>যাচাইযোগ্য শিরোনাম পাওয়া গেলে এখানে দেখাবে।</span></div>
            ) : sponsorFeed.items.length ? (
              <NewsItems items={sponsorFeed.items.slice(0, 5)} Icon={SponsorIcon} />
            ) : (
              <div className="news-empty-state">
                <SponsorIcon size={27} />
                <strong>{sponsorFeed.error ? 'এই মুহূর্তে খবর আনা যাচ্ছে না' : 'এখন কোনো প্রকাশনা পাওয়া যায়নি'}</strong>
                <span>এটি স্পনসরটির কোনো সংবাদ নেই—এমন নিশ্চয়তা নয়। নিউজ ইনডেক্সে ফল না পেলে অফিসিয়াল সাইটে দেখুন।</span>
                <a href={selectedSponsor.href} target="_blank" rel="noopener noreferrer">অফিসিয়াল সাইট খুলুন <ArrowUpRight size={14} /></a>
              </div>
            )}
          </>
        ) : (
          <button className="sponsor-news-prompt" type="button" onClick={() => document.querySelector('.sponsor-ticker-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            <span className="sponsor-news-prompt-icon"><Newspaper size={22} /></span>
            <span><strong>কোন স্পনসরের খবর দেখবেন?</strong><small>উপরের চলমান লোগোর যেকোনোটিতে চাপ দিন। স্পনসর স্লাইডার চলতে থাকবে।</small></span>
            <ArrowUpRight size={18} />
          </button>
        )}
        <p className="news-attribution-note">খবরের শিরোনাম ও লিংক Google News-এর সার্চ ফিড থেকে আসে; মূল প্রকাশকের পাতায় সম্পূর্ণ খবর পড়ুন।</p>
      </section>

      <section className="homepage-news-panel latest-news-panel" id="latest-news" aria-labelledby="latest-news-heading">
        <div className="homepage-news-heading">
          <div className="homepage-news-heading-copy">
            <span className="homepage-news-kicker"><Newspaper size={13} /> LATEST HEADLINES</span>
            <h2 id="latest-news-heading"><Newspaper size={23} aria-hidden="true" /> সর্বশেষ সংবাদ</h2>
            <p>খাবার, বাংলাদেশ এবং আন্তর্জাতিক খবর—একটার পর একটা। নতুন খবর পেলে ফিড স্বয়ংক্রিয়ভাবে আপডেট হবে।</p>
          </div>
          <span className="news-auto-label"><span /> অটো আপডেট</span>
        </div>

        <div className="news-category-tabs" role="tablist" aria-label="সংবাদের বিভাগ">
          {NEWS_CATEGORIES.map((category) => {
            const Icon = category.Icon;
            const selected = activeCategory === category.id;
            return (
              <button key={category.id} id={'news-tab-' + category.id} type="button" role="tab" aria-selected={selected} aria-controls="latest-news-list" className={selected ? 'news-category-tab active' : 'news-category-tab'} onClick={() => setActiveCategory(category.id)}>
                <Icon size={15} aria-hidden="true" />{category.label}
              </button>
            );
          })}
        </div>

        <div className="latest-news-content" id="latest-news-list" role="tabpanel" aria-labelledby={'news-tab-' + active.id}>
          <FeedStatus loading={categoryFeed.loading} error={categoryFeed.items.length ? '' : categoryFeed.error} updatedAt={categoryFeed.updatedAt} fromCache={categoryFeed.fromCache} onRefresh={() => setCategoryRefreshKey((value) => value + 1)} />
          {categoryFeed.loading && !categoryFeed.items.length ? (
            <div className="news-empty-state"><LoaderCircle className="news-spin" size={24} /><strong>{active.label} খোঁজা হচ্ছে…</strong><span>সর্বশেষ খবর সংগ্রহ করা হচ্ছে।</span></div>
          ) : categoryFeed.items.length ? (
            <NewsItems items={categoryFeed.items} Icon={ActiveIcon} compact={false} />
          ) : (
            <div className="news-empty-state">
              <ActiveIcon size={27} />
              <strong>খবর লোড করা যায়নি</strong>
              <span>{categoryFeed.error || 'সংযোগ ঠিক থাকলে কিছুক্ষণ পর আবার চেষ্টা করুন।'}</span>
              <button className="news-retry-button" type="button" onClick={() => setCategoryRefreshKey((value) => value + 1)}>আবার চেষ্টা করুন <RefreshCw size={14} /></button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
