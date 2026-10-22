import React, { useEffect, useState } from 'react';
import { ArrowUpRight, BadgeCheck, Clock3, Globe2, LoaderCircle, Newspaper, RefreshCw, Utensils, MapPin } from 'lucide-react';
import './news-feed.css';
import { AUTO_NEWS_SPONSORS } from './lib/sponsorPartners.js';

const REFRESH_INTERVAL = 15 * 60 * 1000;
const CACHE_TTL = 12 * 60 * 1000;
const memoryCache = new Map();
let staticNewsPromise = null;
let staticNewsFetchedAt = 0;
let staticNewsLoading = false;

async function readStaticNews(force = false) {
  const snapshotIsStale = Date.now() - staticNewsFetchedAt >= CACHE_TTL;
  if ((!staticNewsPromise || (force && snapshotIsStale)) && !staticNewsLoading) {
    staticNewsLoading = true;
    const version = Math.floor(Date.now() / CACHE_TTL);
    staticNewsPromise = fetch(import.meta.env.BASE_URL + 'data/news-feed.json?v=' + version, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    }).then(async (response) => {
      if (!response.ok) throw new Error('Google News snapshot unavailable');
      const data = await response.json();
      staticNewsFetchedAt = Date.now();
      return data;
    }).catch((error) => {
      staticNewsPromise = null;
      throw error;
    }).finally(() => {
      staticNewsLoading = false;
    });
  }
  if (!staticNewsPromise) throw new Error('Google News snapshot unavailable');
  return staticNewsPromise;
}

function staticFeedResult(items, generatedAt) {
  const normalized = (Array.isArray(items) ? items : []).map((item) => normalizeNewsItem(item, item.source || 'সংবাদমাধ্যম')).filter(Boolean);
  const parsedTimestamp = Date.parse(generatedAt || '');
  const updatedAt = Number.isFinite(parsedTimestamp) ? parsedTimestamp : Date.now();
  return normalized.length ? { items: normalized.slice(0, 10), updatedAt, fromCache: true, staticFallback: true } : null;
}

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

function resolveNewsImage(value) {
  const remote = safeHttpUrl(value);
  if (remote) return remote;
  const path = String(value || '').replace(/^\\.\\//, '');
  if (/^news-fallbacks\\/(?:newsroom|food|bangladesh|world)\\.svg$/i.test(path)) {
    return import.meta.env.BASE_URL + path;
  }
  return '';
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
  const image = resolveNewsImage(item?.image || item?.thumbnail || item?.enclosure?.link || imageFromDescription?.[1] || '');
  const imageFallback = resolveNewsImage(item?.imageFallback || 'news-fallbacks/newsroom.svg');
  const link = safeHttpUrl(item?.link || item?.guid || '');
  if (!link) return null;

  return {
    id: link,
    title,
    link,
    articleUrl: safeHttpUrl(item?.articleUrl || link),
    source: plainText(item?.author || inferredSource || fallbackSource || 'সংবাদমাধ্যম'),
    publishedAt: item?.pubDate || item?.published || '',
    summary: description.length > 190 ? description.slice(0, 187) + '…' : description,
    image,
    imageFallback,
  };
}

async function loadFeed(query, signal, force = false) {
  if (signal?.aborted) {
    const abortError = new Error('News request was cancelled.');
    abortError.name = 'AbortError';
    throw abortError;
  }

  const cacheKey = query;
  const cached = memoryCache.get(cacheKey);
  if (!force && cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return { items: cached.items, updatedAt: cached.cachedAt, fromCache: true };
  }

  // Google News RSS is fetched by the scheduled GitHub Actions job and served
  // from our own static JSON file. The browser no longer depends on adapters
  // or public CORS proxy services.
  let snapshot;
  try {
    snapshot = await readStaticNews(force);
  } catch {
    throw new Error('Google News-এর সংরক্ষিত খবর এখন পাওয়া যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।');
  }

  const category = NEWS_CATEGORIES.find((entry) => entry.query === query);
  const sponsor = AUTO_NEWS_SPONSORS.find((entry) => entry.newsQuery === query);
  const snapshotItems = category
    ? snapshot.categories?.[category.id]
    : sponsor
      ? snapshot.sponsors?.[sponsor.id]
      : null;
  const normalized = staticFeedResult(snapshotItems, snapshot.generatedAt);
  if (!normalized) {
    throw new Error('Google News থেকে এই বিভাগে আপাতত খবর পাওয়া যায়নি। পরবর্তী আপডেটের জন্য অপেক্ষা করুন।');
  }

  memoryCache.set(cacheKey, { items: normalized.items, cachedAt: normalized.updatedAt });
  return normalized;
}

function getSelectedAutoNewsSponsor(selectedSponsor) {
  if (!selectedSponsor) return null;
  return AUTO_NEWS_SPONSORS.find((source) =>
    source.id === selectedSponsor.id ||
    source.newsQuery === selectedSponsor.newsQuery ||
    source.href === selectedSponsor.href
  ) || null;
}

async function loadSponsorNews(signal, force = false, selectedSponsor = null) {
  const selectedSource = getSelectedAutoNewsSponsor(selectedSponsor);
  const sources = selectedSource ? [selectedSource] : AUTO_NEWS_SPONSORS;
  const settled = await Promise.all(sources.map(async (source) => {
    try {
      const result = await loadFeed(source.newsQuery, signal, force);
      return { source, result, error: null };
    } catch (error) {
      if (signal.aborted) return { source, result: null, error };
      try {
        const snapshot = await readStaticNews();
        const fallback = staticFeedResult(snapshot.sponsors?.[source.id]);
        if (fallback) return { source, result: fallback, error: null };
      } catch { /* Report the live-feed error if the static snapshot is unavailable. */ }
      return { source, result: null, error };
    }
  }));

  if (signal.aborted) {
    const abortError = new Error('News request was cancelled.');
    abortError.name = 'AbortError';
    throw abortError;
  }

  const successful = settled.filter((entry) => entry.result);
  const failedSources = settled.filter((entry) => entry.error).map((entry) => entry.source);
  if (!successful.length) {
    throw new Error('স্পনসরদের নিউজ-ফিড এখন পাওয়া যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।');
  }

  const maximumPerSource = selectedSource ? 10 : 3;
  const seen = new Set();
  const items = successful.flatMap(({ source, result }) =>
    result.items.slice(0, maximumPerSource).map((item) => ({
      ...item,
      sponsorId: source.id,
      sponsorLabel: source.newsLabel || source.label || source.name,
      source: source.newsLabel || source.label || source.name,
    }))
  ).filter((item) => {
    if (!item.link || seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  const dateValue = (item) => {
    const timestamp = Date.parse(item.publishedAt || '');
    return Number.isFinite(timestamp) ? timestamp : 0;
  };
  items.sort((a, b) => dateValue(b) - dateValue(a));

  const timestamps = successful.map((entry) => entry.result.updatedAt || 0);
  const updatedAt = Math.max(...timestamps) || Date.now();
  return {
    items: items.slice(0, selectedSource ? 10 : 15),
    updatedAt,
    fromCache: successful.every((entry) => Boolean(entry.result.fromCache)),
    failedSources,
    selectedSource,
    loadedSourceCount: successful.length,
    totalSourceCount: sources.length,
  };
}

function useSponsorNewsFeed(selectedSponsor, refreshKey = 0) {
  const selectedSource = getSelectedAutoNewsSponsor(selectedSponsor);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(0);
  const [fromCache, setFromCache] = useState(false);
  const [failedSources, setFailedSources] = useState([]);

  useEffect(() => {
    let active = true;
    let hasItems = false;
    const controller = new AbortController();

    setItems([]);
    setLoading(true);
    setError('');
    setUpdatedAt(0);
    setFromCache(false);
    setFailedSources([]);

    const refresh = async (force = false) => {
      if (!active) return;
      if (!hasItems || force) setLoading(true);

      try {
        const result = await loadSponsorNews(controller.signal, force, selectedSource);
        if (!active) return;
        setItems(result.items);
        hasItems = result.items.length > 0;
        setUpdatedAt(result.updatedAt || Date.now());
        setFromCache(Boolean(result.fromCache));
        setFailedSources(result.failedSources);
        if (!result.items.length) {
          setError(result.failedSources.length
            ? 'কিছু স্পনসর উৎস থেকে খবর আনা যায়নি।'
            : 'এই মুহূর্তে নির্বাচিত সংবাদ-উৎসে নতুন খবর পাওয়া যায়নি।');
        } else {
          setError('');
        }
      } catch (caught) {
        if (!active || caught?.name === 'AbortError') return;
        setError(caught?.message || 'স্পনসরদের খবর লোড করা যায়নি।');
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
  }, [selectedSource?.id, refreshKey]);

  return { items, loading, error, updatedAt, fromCache, failedSources, selectedSource };
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
        try {
          const snapshot = await readStaticNews();
          const category = NEWS_CATEGORIES.find((entry) => entry.query === query);
          const fallback = staticFeedResult(category ? snapshot.categories?.[category.id] : []);
          if (fallback) {
            setItems(fallback.items);
            hasItems = true;
            setUpdatedAt(Date.parse(snapshot.generatedAt || '') || Date.now());
            setFromCache(true);
            setError('');
            return;
          }
        } catch { /* Show the live-feed error when no generated snapshot exists. */ }
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
          <a className="news-item-media" href={item.articleUrl || item.link} target="_blank" rel="noopener noreferrer" aria-label={item.title + ' পড়ুন'}>
            {item.image ? (
              <img
                src={item.image}
                alt=""
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  const imageElement = event.currentTarget;
                  if (item.imageFallback && imageElement.dataset.fallbackApplied !== 'true') {
                    imageElement.dataset.fallbackApplied = 'true';
                    imageElement.src = item.imageFallback;
                  } else {
                    imageElement.hidden = true;
                  }
                }}
              />
            ) : null}
            <span className="news-item-media-fallback" aria-hidden="true"><Icon size={compact ? 25 : 29} strokeWidth={1.6} /></span>
          </a>
          <div className="news-item-content">
            <div className="news-item-meta">
              <span className={item.sponsorLabel ? "news-item-source news-item-sponsor-source" : "news-item-source"}>{item.sponsorLabel || item.source}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={item.publishedAt || undefined}><Clock3 size={12} aria-hidden="true" />{formatNewsTime(item.publishedAt)}</time>
            </div>
            <h3><a href={item.articleUrl || item.link} target="_blank" rel="noopener noreferrer">{item.title}</a></h3>
            {!compact && item.summary && <p>{item.summary}</p>}
            <a className="news-item-read" href={item.articleUrl || item.link} target="_blank" rel="noopener noreferrer">খবর পড়ুন <ArrowUpRight size={14} aria-hidden="true" /></a>
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

export default function NewsFeed({ selectedSponsor = null, onSelectSponsor }) {
  const [activeCategory, setActiveCategory] = useState('food');
  const [sponsorRefreshKey, setSponsorRefreshKey] = useState(0);
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);
  const active = NEWS_CATEGORIES.find((category) => category.id === activeCategory) || NEWS_CATEGORIES[0];
  const sponsorFeed = useSponsorNewsFeed(selectedSponsor, sponsorRefreshKey);
  const categoryFeed = useNewsFeed(active.query, categoryRefreshKey);
  const ActiveIcon = active.Icon;

  useEffect(() => {
    if (selectedSponsor) {
      window.requestAnimationFrame(() => {
        document.getElementById('sponsor-news')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [selectedSponsor?.id, selectedSponsor?.name]);

  const showAllSponsorNews = () => onSelectSponsor?.(null);

  return (
    <div className="homepage-news-wrap">
      <section className="homepage-news-panel sponsor-news-panel" id="sponsor-news" aria-labelledby="sponsor-news-heading">
        <div className="homepage-news-heading">
          <div className="homepage-news-heading-copy">
            <span className="homepage-news-kicker"><BadgeCheck size={13} /> PARTNER UPDATES</span>
            <h2 id="sponsor-news-heading"><Newspaper size={23} aria-hidden="true" /> স্পনসরদের সর্বশেষ খবর <span className="news-auto-badge">AUTO UPDATE</span></h2>
            <p>
              সময় টিভি, NTV, News24 / Channel 24, Jamuna TV ও Maasranga TV-এর সংবাদ একসঙ্গে স্বয়ংক্রিয়ভাবে এখানে আসবে।
              লোগো বা নিচের উৎসে চাপ দিলে নির্দিষ্ট চ্যানেলের খবর দেখা যাবে।
            </p>
          </div>
          {sponsorFeed.selectedSource && (
            <a className="news-source-site-link" href={sponsorFeed.selectedSource.href} target="_blank" rel="noopener noreferrer">
              অফিসিয়াল সাইট <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          )}
        </div>

        <div className="sponsor-feed-source-list" role="group" aria-label="স্পনসরের সংবাদ বেছে নিন">
          <button
            className={sponsorFeed.selectedSource ? 'sponsor-feed-source-button' : 'sponsor-feed-source-button active'}
            type="button"
            onClick={showAllSponsorNews}
            aria-pressed={!sponsorFeed.selectedSource}
          >
            <Newspaper size={13} aria-hidden="true" /> সব স্পনসরের খবর
          </button>
          {AUTO_NEWS_SPONSORS.map((source) => {
            const selected = sponsorFeed.selectedSource?.id === source.id;
            return (
              <button
                key={source.id}
                className={selected ? 'sponsor-feed-source-button active' : 'sponsor-feed-source-button'}
                type="button"
                onClick={() => onSelectSponsor?.(selected ? null : source)}
                aria-pressed={selected}
              >
                {source.newsLabel || source.label}
              </button>
            );
          })}
        </div>

        {sponsorFeed.selectedSource && selectedSponsor && (
          <div className="selected-sponsor-banner">
            <span className={'selected-sponsor-logo ' + (sponsorFeed.selectedSource.className || '')}>
              {sponsorFeed.selectedSource.wordmark ? <strong>SYLAÉ</strong> : sponsorFeed.selectedSource.label}
            </span>
            <div className="selected-sponsor-copy">
              <strong>{sponsorFeed.selectedSource.name}</strong>
              <span>এই মিডিয়া স্পনসরের নিউজ-ইনডেক্স থেকে পাওয়া শিরোনাম</span>
            </div>
            <span className="selected-sponsor-check"><BadgeCheck size={16} /> নির্বাচিত</span>
          </div>
        )}

        <FeedStatus
          loading={sponsorFeed.loading}
          error={sponsorFeed.items.length ? '' : sponsorFeed.error}
          updatedAt={sponsorFeed.updatedAt}
          fromCache={sponsorFeed.fromCache}
          onRefresh={() => setSponsorRefreshKey((value) => value + 1)}
        />

        {sponsorFeed.failedSources.length > 0 && sponsorFeed.items.length > 0 && (
          <p className="news-source-warning" role="status">
            {sponsorFeed.failedSources.map((source) => source.newsLabel || source.label).join(', ')}-এর ফিড এখন পাওয়া যায়নি; অন্য উৎসের খবর দেখানো হচ্ছে।
          </p>
        )}

        {sponsorFeed.loading && !sponsorFeed.items.length ? (
          <div className="news-empty-state">
            <LoaderCircle className="news-spin" size={24} />
            <strong>স্পনসরদের খবর আনা হচ্ছে…</strong>
            <span>পাঁচটি সংবাদমাধ্যমের সাম্প্রতিক শিরোনাম সংগ্রহ করা হচ্ছে।</span>
          </div>
        ) : sponsorFeed.items.length ? (
          <NewsItems items={sponsorFeed.items} Icon={Newspaper} compact={false} />
        ) : (
          <div className="news-empty-state">
            <Newspaper size={27} />
            <strong>{sponsorFeed.error ? 'এই মুহূর্তে খবর আনা যাচ্ছে না' : 'এখন নতুন খবর পাওয়া যায়নি'}</strong>
            <span>
              সংবাদ-সূচকে খবর না পাওয়া মানেই ওই চ্যানেলে নতুন খবর নেই—এমন নয়। আবার চেষ্টা করুন অথবা উৎসের অফিসিয়াল সাইট খুলুন।
            </span>
            {sponsorFeed.selectedSource ? (
              <a href={sponsorFeed.selectedSource.href} target="_blank" rel="noopener noreferrer">অফিসিয়াল সাইট খুলুন <ArrowUpRight size={14} /></a>
            ) : (
              <button className="news-retry-button" type="button" onClick={() => setSponsorRefreshKey((value) => value + 1)}>আবার চেষ্টা করুন <RefreshCw size={14} /></button>
            )}
          </div>
        )}

        <p className="news-attribution-note">
          শিরোনাম, সময় ও লিংক Google News-এর RSS সার্চ ফিড থেকে আনা হয়। প্রতিটি শিরোনামে চাপ দিলে মূল প্রকাশনার পাতায় যাবেন; ফিড নির্ভর করে সংশ্লিষ্ট সংবাদ ওয়েবসাইটের ইনডেক্স ও বাইরের RSS সার্ভিসের ওপর।
        </p>
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
