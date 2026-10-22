const NEWS_CATEGORIES = [
  { id: 'food', label: 'খাবার ও রান্না', query: 'রান্না OR খাবার OR রেসিপি OR খাদ্য OR recipe OR cooking' },
  { id: 'bangladesh', label: 'বাংলাদেশ', query: 'বাংলাদেশ OR Bangladesh news' },
  { id: 'international', label: 'আন্তর্জাতিক', query: 'আন্তর্জাতিক OR বিশ্ব সংবাদ OR international news OR world news' },
];

const NEWS_SOURCES = [
  { id: 'somoy', label: 'সময় টিভি', query: 'site:somoynews.tv' },
  { id: 'ntv', label: 'NTV', query: 'site:ntvbd.com' },
  { id: 'jamuna', label: 'Jamuna TV', query: 'site:jamuna.tv' },
  { id: 'maasranga', label: 'Maasranga TV', query: 'site:maasranga.tv' },
  { id: 'channel24', label: 'News24 / Channel 24', query: 'site:channel24bd.tv' },
];

const CATEGORY_FALLBACKS = {
  food: 'news-fallbacks/food.svg',
  bangladesh: 'news-fallbacks/bangladesh.svg',
  international: 'news-fallbacks/world.svg',
};
const MAX_AGE_DAYS = 30;
const RSS_TIMEOUT_MS = 6500;

function decodeXml(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function safeHttpUrl(value, base) {
  try {
    const parsed = base ? new URL(String(value || ''), base) : new URL(String(value || ''));
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return '';
    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (
      !hostname ||
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) ||
      hostname.includes(':')
    ) return '';
    return parsed.href;
  } catch {
    return '';
  }
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function rawTag(xml, name) {
  const safeName = String(name).replace(/[^a-zA-Z0-9:_-]/g, '');
  const pattern = new RegExp('<' + safeName + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + safeName + '>', 'i');
  const match = String(xml || '').match(pattern);
  return match ? decodeXml(match[1].trim()) : '';
}

function attribute(tagText, name) {
  const pattern = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  for (const match of String(tagText || '').matchAll(pattern)) {
    if (match[1].toLowerCase() === String(name).toLowerCase()) {
      return decodeXml(match[2] ?? match[3] ?? '');
    }
  }
  return '';
}

function extractFeedImage(block, descriptionRaw, baseUrl) {
  const candidates = [];
  for (const match of String(block || '').matchAll(/<(?:media:content|media:thumbnail|enclosure)\b[^>]*>/gi)) {
    candidates.push(attribute(match[0], 'url'), attribute(match[0], 'href'));
  }
  for (const match of String(descriptionRaw || '').matchAll(/<(?:img|source)\b[^>]*>/gi)) {
    candidates.push(attribute(match[0], 'src'), attribute(match[0], 'data-src'), attribute(match[0], 'content'));
  }
  for (const value of candidates) {
    const url = safeHttpUrl(value, baseUrl);
    if (url && !/(?:logo|favicon|avatar|profile|placeholder|default-cover|site-icon)/i.test(new URL(url).pathname)) {
      return url;
    }
  }
  return '';
}

export function isFreshNews(item, now = Date.now(), maxAgeDays = MAX_AGE_DAYS) {
  const publishedAt = Date.parse(item?.publishedAt || '');
  if (!Number.isFinite(publishedAt)) return true;
  const age = now - publishedAt;
  return age >= -24 * 60 * 60 * 1000 && age <= maxAgeDays * 24 * 60 * 60 * 1000;
}

export function parseRssItems(xml, defaultSource = 'সংবাদমাধ্যম', imageFallback = 'news-fallbacks/newsroom.svg') {
  const entries = [...String(xml || '').matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)];
  const unique = new Map();

  for (const match of entries) {
    const block = match[1];
    const rawTitle = stripHtml(rawTag(block, 'title'));
    if (!rawTitle) continue;

    const separator = rawTitle.lastIndexOf(' - ');
    const hasPublisher = separator > 18 && separator < rawTitle.length - 4;
    const title = hasPublisher ? rawTitle.slice(0, separator).trim() : rawTitle;
    const inferredSource = hasPublisher ? rawTitle.slice(separator + 3).trim() : '';
    const link = safeHttpUrl(stripHtml(rawTag(block, 'link')));
    if (!link || !title) continue;

    const descriptionRaw = rawTag(block, 'description');
    const summaryText = stripHtml(descriptionRaw);
    const publishedAt = stripHtml(rawTag(block, 'pubDate'));
    const source = stripHtml(rawTag(block, 'source')) || inferredSource || defaultSource;
    const image = extractFeedImage(block, descriptionRaw, link);
    if (!unique.has(link)) {
      unique.set(link, {
        id: link,
        title,
        link,
        articleUrl: link,
        source,
        publishedAt,
        summary: summaryText.length > 190 ? summaryText.slice(0, 187) + '…' : summaryText,
        image,
        imageFallback,
      });
    }
  }

  return [...unique.values()].filter((item) => isFreshNews(item)).sort((a, b) => {
    const left = Date.parse(a.publishedAt || '') || 0;
    const right = Date.parse(b.publishedAt || '') || 0;
    return right - left;
  });
}

async function fetchRssFeed(query, source, fallback) {
  const url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(query) + '&hl=bn&gl=BD&ceid=BD:bn';
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'RannarMenu-NewsFeed/2.0',
      'Accept-Language': 'bn-BD,bn;q=0.9,en;q=0.8',
      Accept: 'application/rss+xml, application/xml, text/xml;q=0.9,*/*;q=0.5',
    },
    signal: AbortSignal.timeout(RSS_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error('RSS request failed with HTTP ' + response.status);
  const xml = await response.text();
  if (!/<rss[\s>]/i.test(xml)) throw new Error('RSS response format was invalid');
  return parseRssItems(xml, source, fallback).slice(0, 10);
}

function feedRequests(feed) {
  const category = NEWS_CATEGORIES.find((item) => item.id === feed);
  if (category) return [{ ...category, fallback: CATEGORY_FALLBACKS[category.id] }];

  const source = NEWS_SOURCES.find((item) => item.id === feed);
  if (source) return [{ ...source, fallback: 'news-fallbacks/newsroom.svg' }];

  if (feed === 'all') {
    return NEWS_CATEGORIES.map((item) => ({ ...item, fallback: CATEGORY_FALLBACKS[item.id] }));
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestUrl = new URL(req.url || '/', 'https://' + (req.headers?.host || 'localhost'));
  const feed = String(req.query?.feed || requestUrl.searchParams.get('feed') || '').toLowerCase();
  const requests = feedRequests(feed);
  if (!requests) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'Unknown news feed' });
  }

  const sourceErrors = [];
  const results = await Promise.all(requests.map(async (entry) => {
    try {
      return await fetchRssFeed(entry.query, entry.label, entry.fallback);
    } catch (error) {
      sourceErrors.push(entry.id + ': ' + (error?.message || 'feed unavailable'));
      return [];
    }
  }));

  const unique = new Map();
  for (const items of results) {
    for (const item of items) {
      if (!unique.has(item.link)) unique.set(item.link, item);
    }
  }
  const items = [...unique.values()].sort((a, b) => {
    const left = Date.parse(a.publishedAt || '') || 0;
    const right = Date.parse(b.publishedAt || '') || 0;
    return right - left;
  }).slice(0, feed === 'all' ? 24 : 10);

  if (!items.length) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({
      error: 'Live news feed is temporarily unavailable',
      sourceErrors,
      generatedAt: new Date().toISOString(),
      items: [],
    });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
  res.setHeader('CDN-Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
  return res.status(200).json({
    apiVersion: 1,
    feed,
    generatedAt: new Date().toISOString(),
    items,
    sourceErrors,
  });
}
