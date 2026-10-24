import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, BadgeCheck, Clock3, Globe2, LoaderCircle, Newspaper, RefreshCw, Utensils, MapPin } from 'lucide-react';
import './news-feed.css';
import { AUTO_NEWS_SPONSORS } from './lib/sponsorPartners.js';

const REFRESH_INTERVAL = 3 * 60 * 1000;
const CACHE_TTL = 2 * 60 * 1000;
const VERCEL_NEWS_API_AVAILABLE = import.meta.env.BASE_URL === '/';
const SUPABASE_NEWS_BASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_NEWS_PUBLISHABLE_KEY = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '');
const SUPABASE_NEWS_API_AVAILABLE = Boolean(SUPABASE_NEWS_BASE_URL && SUPABASE_NEWS_PUBLISHABLE_KEY);
const LIVE_NEWS_API_AVAILABLE = VERCEL_NEWS_API_AVAILABLE || SUPABASE_NEWS_API_AVAILABLE;

function getNewsEndpoint(type, query) {
  if (SUPABASE_NEWS_API_AVAILABLE) {
    const name = type === 'image' ? 'news-image' : 'news-feed';
    return SUPABASE_NEWS_BASE_URL + '/functions/v1/' + name + '?' + query;
  }
  if (VERCEL_NEWS_API_AVAILABLE) {
    const name = type === 'image' ? '/api/news-image' : '/api/news';
    return name + '?' + query;
  }
  return '';
}

function newsApiHeaders() {
  const headers = { Accept: 'application/json' };
  if (SUPABASE_NEWS_API_AVAILABLE) headers.apikey = SUPABASE_NEWS_PUBLISHABLE_KEY;
  return headers;
}
const MAX_CACHED_NEWS_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function isFreshNewsItem(item) {
  const timestamp = Date.parse(item?.publishedAt || '');
  return !Number.isFinite(timestamp) || (timestamp <= Date.now() + 24 * 60 * 60 * 1000 && Date.now() - timestamp <= MAX_CACHED_NEWS_AGE_MS);
}
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
  const normalized = (Array.isArray(items) ? items : []).map((item) => normalizeNewsItem(item, item.source || 'সংবাদমাধ্যম')).filter(Boolean).filter(isFreshNewsItem);
  const parsedTimestamp = Date.parse(generatedAt || '');
  const updatedAt = Number.isFinite(parsedTimestamp) ? parsedTimestamp : Date.now();
  return normalized.length ? { items: normalized.slice(0, 10), updatedAt, fromCache: true, staticFallback: true } : null;
}

function staticAllCategoriesResult(snapshot) {
  const unique = new Map();
  Object.values(snapshot?.categories || {}).forEach((entries) => {
    (Array.isArray(entries) ? entries : []).forEach((entry) => {
      const item = normalizeNewsItem(entry, entry?.source || 'সংবাদমাধ্যম');
      if (item && isFreshNewsItem(item) && !unique.has(item.link)) unique.set(item.link, item);
    });
  });
  const dateValue = (item) => {
    const timestamp = Date.parse(item.publishedAt || '');
    return Number.isFinite(timestamp) ? timestamp : 0;
  };
  const items = [...unique.values()].sort((a, b) => dateValue(b) - dateValue(a)).slice(0, 24);
  const parsedTimestamp = Date.parse(snapshot?.generatedAt || '');
  const updatedAt = Number.isFinite(parsedTimestamp) ? parsedTimestamp : Date.now();
  return items.length ? { items, updatedAt, fromCache: true, staticFallback: true } : null;
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
  const path = String(value || '');
  if (['news-fallbacks/newsroom.svg', 'news-fallbacks/food.svg', 'news-fallbacks/bangladesh.svg', 'news-fallbacks/world.svg'].includes(path)) {
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
  const description = plainText(item?.summary || item?.description || item?.contentSnippet || '');
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
    publishedAt: item?.pubDate || item?.published || item?.publishedAt || '',
    summary: description.length > 190 ? description.slice(0, 187) + '…' : description,
    image,
    imageFallback,
    imageIsFallback: String(item?.image || '').startsWith('news-fallbacks/'),
  };
}

function getLiveFeedKey(query) {
  if (query === 'all') return 'all';
  const category = NEWS_CATEGORIES.find((entry) => entry.query === query);
  if (category) return category.id;
  const sponsor = AUTO_NEWS_SPONSORS.find((entry) => entry.newsQuery === query);
  return sponsor?.id || '';
}

async function loadLiveFeed(query, signal) {
  if (!LIVE_NEWS_API_AVAILABLE) return null;
  const feed = getLiveFeedKey(query);
  if (!feed) return null;

  const endpoint = getNewsEndpoint('feed', 'feed=' + encodeURIComponent(feed));
  if (!endpoint) return null;
  const response = await fetch(endpoint, {
    headers: newsApiHeaders(),
    signal,
  });
  if (!response.ok) return null;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) return null;
  const payload = await response.json();
  const items = (Array.isArray(payload.items) ? payload.items : [])
    .map((item) => normalizeNewsItem(item, item.source || 'সংবাদমাধ্যম'))
    .filter(Boolean)
    .filter(isFreshNewsItem);
  if (!items.length) return null;

  return {
    items,
    updatedAt: Date.parse(payload.generatedAt || '') || Date.now(),
    fromCache: false,
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

  // Prefer Vercel's same-origin RSS endpoint for live headlines. GitHub Pages
  // and temporary API outages fall back to the scheduled JSON snapshot below.
  try {
    const liveResult = await loadLiveFeed(query, signal);
    if (signal?.aborted) {
      const abortError = new Error('News request was cancelled.');
      abortError.name = 'AbortError';
      throw abortError;
    }
    if (liveResult?.items?.length) {
      memoryCache.set(cacheKey, { items: liveResult.items, cachedAt: Date.now() });
      return liveResult;
    }
  } catch (error) {
    if (signal?.aborted || error?.name === 'AbortError') throw error;
    // Continue with the static snapshot when the live endpoint cannot be reached.
  }

  let snapshot;
  try {
    snapshot = await readStaticNews(force);
  } catch {
    throw new Error('সরাসরি নিউজ ফিড ও সংরক্ষিত খবর—দুটিই এখন পাওয়া যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।');
  }

  const category = NEWS_CATEGORIES.find((entry) => entry.query === query);
  const sponsor = AUTO_NEWS_SPONSORS.find((entry) => entry.newsQuery === query);
  const snapshotItems = category
    ? snapshot.categories?.[category.id]
    : sponsor
      ? snapshot.sponsors?.[sponsor.id]
      : null;
  const normalized = query === 'all'
    ? staticAllCategoriesResult(snapshot)
    : staticFeedResult(snapshotItems, snapshot.generatedAt);
  if (!normalized) {
    throw new Error('এই বিভাগে সাম্প্রতিক খবর পাওয়া যায়নি। লাইভ ফিড বা ক্যাশ পরে আবার চেষ্টা করুন।');
  }

  memoryCache.set(cacheKey, { items: normalized.items, cachedAt: Date.now() });
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
          const fallback = query === 'all'
            ? staticAllCategoriesResult(snapshot)
            : staticFeedResult(category ? snapshot.categories?.[category.id] : []);
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

function NewsItemCard({ item, Icon, compact = false }) {
  const mediaRef = useRef(null);
  const resolutionAttempted = useRef(false);
  const [imageUrl, setImageUrl] = useState(() => item.imageIsFallback ? '' : item.image || '');
  const [imageResolving, setImageResolving] = useState(false);
  const [articleUrl, setArticleUrl] = useState(item.articleUrl || item.link);

  useEffect(() => {
    setImageUrl(item.imageIsFallback ? '' : item.image || '');
    setArticleUrl(item.articleUrl || item.link);
    setImageResolving(false);
    resolutionAttempted.current = false;
  }, [item.id, item.image, item.imageIsFallback, item.articleUrl, item.link]);

  useEffect(() => {
    if (imageUrl || resolutionAttempted.current || !item.link) return;
    if (!LIVE_NEWS_API_AVAILABLE) {
      resolutionAttempted.current = true;
      return;
    }

    const target = mediaRef.current;
    if (!target) return;
    let active = true;
    const controller = new AbortController();
    let observer;

    const resolveArticleImage = async () => {
      if (resolutionAttempted.current) return;
      resolutionAttempted.current = true;
      setImageResolving(true);
      try {
        const endpoint = getNewsEndpoint('image', 'url=' + encodeURIComponent(item.link));
        if (!endpoint) return;
        const response = await fetch(endpoint, {
          headers: newsApiHeaders(),
          signal: controller.signal,
        });
        if (!response.ok || !(response.headers.get('content-type') || '').toLowerCase().includes('application/json')) return;
        const payload = await response.json();
        if (!active) return;
        if (payload.image && safeHttpUrl(payload.image)) setImageUrl(payload.image);
        if (payload.articleUrl && safeHttpUrl(payload.articleUrl)) setArticleUrl(payload.articleUrl);
      } catch {
        // Keep the editorial placeholder if a publisher blocks thumbnail retrieval.
      } finally {
        if (active) setImageResolving(false);
      }
    };

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void resolveArticleImage();
        }
      }, { rootMargin: '350px 0px' });
      observer.observe(target);
    } else {
      void resolveArticleImage();
    }

    return () => {
      active = false;
      controller.abort();
      observer?.disconnect();
    };
  }, [item.id, item.link, imageUrl]);

  const staticPlaceholder = LIVE_NEWS_API_AVAILABLE ? '' : item.imageFallback || '';
  const displayedImage = imageUrl || staticPlaceholder;
  const isIllustration = !imageUrl || item.imageIsFallback;

  return (
    <article className="news-item" key={item.id}>
      <a
        ref={mediaRef}
        className={isIllustration ? 'news-item-media has-image-illustration' : 'news-item-media'}
        href={articleUrl || item.link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={item.title + ' পড়ুন'}
      >
        {displayedImage ? (
          <img
            src={displayedImage}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.hidden = true;
              if (imageUrl) setImageUrl('');
            }}
          />
        ) : null}
        <span className="news-item-media-fallback" aria-hidden="true"><Icon size={compact ? 25 : 29} strokeWidth={1.6} /></span>
        <span className="news-item-image-note" aria-hidden="true">{imageResolving ? 'ছবি খোঁজা হচ্ছে…' : 'প্রতীকী ছবি'}</span>
      </a>
      <div className="news-item-content">
        <div className="news-item-meta">
          <span className={item.sponsorLabel ? 'news-item-source news-item-sponsor-source' : 'news-item-source'}>{item.sponsorLabel || item.source}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={item.publishedAt || undefined}><Clock3 size={12} aria-hidden="true" />{formatNewsTime(item.publishedAt)}</time>
        </div>
        <h3><a href={articleUrl || item.link} target="_blank" rel="noopener noreferrer">{item.title}</a></h3>
        {!compact && item.summary && <p>{item.summary}</p>}
        <a className="news-item-read" href={articleUrl || item.link} target="_blank" rel="noopener noreferrer">খবর পড়ুন <ArrowUpRight size={14} aria-hidden="true" /></a>
      </div>
    </article>
  );
}

function NewsItems({ items, Icon, compact = false }) {
  if (!items.length) return null;
  return (
    <div className={compact ? 'news-items news-items-compact' : 'news-items'}>
      {items.map((item) => <NewsItemCard key={item.id} item={item} Icon={Icon} compact={compact} />)}
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

export default function NewsFeed() {
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);
  const categoryFeed = useNewsFeed('all', categoryRefreshKey);

  return (
    <div className="homepage-news-wrap">
      <section className="homepage-news-panel latest-news-panel" id="latest-news" aria-labelledby="latest-news-heading">
        <div className="homepage-news-heading">
          <div className="homepage-news-heading-copy">
            <span className="homepage-news-kicker"><Newspaper size={13} /> LATEST HEADLINES</span>
            <h2 id="latest-news-heading"><Newspaper size={23} aria-hidden="true" /> সর্বশেষ সংবাদ</h2>
            <p>খাবার, বাংলাদেশ ও আন্তর্জাতিক—সব বিভাগের সর্বশেষ খবর এক জায়গায়, YouTube-এর মতো বড় ছবির কার্ডে।</p>
          </div>
          <span className="news-auto-label"><span /> অটো আপডেট</span>
        </div>

        <div className="latest-news-content" id="latest-news-list" aria-label="সর্বশেষ সব বিভাগের সংবাদ">
          <FeedStatus loading={categoryFeed.loading} error={categoryFeed.items.length ? '' : categoryFeed.error} updatedAt={categoryFeed.updatedAt} fromCache={categoryFeed.fromCache} onRefresh={() => setCategoryRefreshKey((value) => value + 1)} />
          {categoryFeed.loading && !categoryFeed.items.length ? (
            <div className="news-empty-state"><LoaderCircle className="news-spin" size={24} /><strong>সর্বশেষ সংবাদ খোঁজা হচ্ছে…</strong><span>সর্বশেষ খবর সংগ্রহ করা হচ্ছে।</span></div>
          ) : categoryFeed.items.length ? (
            <NewsItems items={categoryFeed.items} Icon={Newspaper} compact={false} />
          ) : (
            <div className="news-empty-state">
              <Newspaper size={27} />
              <strong>সর্বশেষ সংবাদ লোড করা যায়নি</strong>
              <span>{categoryFeed.error || 'সংযোগ ঠিক থাকলে কিছুক্ষণ পর আবার চেষ্টা করুন।'}</span>
              <button className="news-retry-button" type="button" onClick={() => setCategoryRefreshKey((value) => value + 1)}>আবার চেষ্টা করুন <RefreshCw size={14} /></button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
