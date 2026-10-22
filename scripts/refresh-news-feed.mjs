import { mkdir, readFile, writeFile } from 'node:fs/promises';

const sponsors = [
  { id: 'somoy', label: 'সময় টিভি', query: 'site:somoynews.tv' },
  { id: 'ntv', label: 'NTV', query: 'site:ntvbd.com' },
  { id: 'jamuna', label: 'Jamuna TV', query: 'site:jamuna.tv' },
  { id: 'maasranga', label: 'Maasranga TV', query: 'site:maasranga.tv' },
  { id: 'channel24', label: 'News24 / Channel 24', query: 'site:channel24bd.tv' },
];
const categories = [
  { id: 'food', query: 'রান্না OR খাবার OR রেসিপি OR খাদ্য OR recipe OR cooking' },
  { id: 'bangladesh', query: 'বাংলাদেশ OR Bangladesh news' },
  { id: 'international', query: 'আন্তর্জাতিক OR বিশ্ব সংবাদ OR international news OR world news' },
];

function decodeXml(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
function rawTag(xml, name) {
  const match = xml.match(new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + name + '>', 'i'));
  return match ? decodeXml(match[1].trim()) : '';
}
function tag(xml, name) {
  return rawTag(xml, name).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function cleanUrl(value, base) {
  try {
    const url = base ? new URL(value, base) : new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
function attribute(tagText, name) {
  const attrs = tagText.matchAll(/\b([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g);
  for (const match of attrs) {
    if (match[1].toLowerCase() === name.toLowerCase()) return decodeXml(match[2] ?? match[3] ?? '');
  }
  return '';
}
function extractRssImage(block, descriptionRaw) {
  const candidates = [];
  for (const match of block.matchAll(/<(?:media:content|media:thumbnail|enclosure)\b[^>]*>/gi)) {
    candidates.push(attribute(match[0], 'url'), attribute(match[0], 'href'));
  }
  for (const match of descriptionRaw.matchAll(/<(?:img|source)\b[^>]*>/gi)) {
    candidates.push(attribute(match[0], 'src'), attribute(match[0], 'data-src'));
  }
  return candidates.map((value) => cleanUrl(value)).find(Boolean) || '';
}
function decodeHtml(value = '') {
  return String(value)
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
function parseMetaImage(html, pageUrl) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const node = match[0];
    const key = (attribute(node, 'property') || attribute(node, 'name') || '').toLowerCase();
    if (!['og:image', 'og:image:secure_url', 'twitter:image', 'twitter:image:src'].includes(key)) continue;
    const candidate = cleanUrl(decodeHtml(attribute(node, 'content')), pageUrl);
    if (candidate) return candidate;
  }
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const node = match[0];
    if (/\bimage_src\b/i.test(attribute(node, 'rel'))) {
      const candidate = cleanUrl(decodeHtml(attribute(node, 'href')), pageUrl);
      if (candidate) return candidate;
    }
  }
  const jsonImage = html.match(/["']image["']\s*:\s*["'](https?:[^"'\s]+)["']/i);
  return jsonImage ? cleanUrl(decodeHtml(jsonImage[1]), pageUrl) : '';
}
const NEWS_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
function newsHeaders(extra = {}) {
  return {
    'User-Agent': NEWS_USER_AGENT,
    'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    ...extra,
  };
}
async function resolveGoogleNewsArticleUrl(articleUrl) {
  const url = cleanUrl(articleUrl);
  if (!url) return '';
  if (!url.includes('news.google.com/')) return url;
  const id = url.match(/\/(?:rss\/)?articles\/([^/?]+)/i)?.[1];
  if (!id) return '';
  const pageUrls = [
    'https://news.google.com/articles/' + id + '?hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/articles/' + id + '?hl=en-US&gl=US&ceid=US:en',
  ];
  for (const pageUrl of pageUrls) {
    try {
      const response = await fetch(pageUrl, {
        redirect: 'follow',
        headers: newsHeaders({
          Cookie: 'CONSENT=PENDING+987',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1',
        }),
        signal: AbortSignal.timeout(9000),
      });
      if (!response.ok) continue;
      const html = await response.text();
      const signature = html.match(/data-n-a-sg=["']([^"']+)["']/i)?.[1];
      const timestamp = html.match(/data-n-a-ts=["'](\d+)["']/i)?.[1];
      if (!signature || !timestamp) continue;
      const innerPayload = JSON.stringify([
        'garturlreq',
        [['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1],
          'X', 'X', 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0],
        id, Number(timestamp), signature,
      ]);
      const outerPayload = JSON.stringify([[['Fbv4je', innerPayload]]]);
      const rpcResponse = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je', {
        method: 'POST',
        headers: newsHeaders({
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Origin: 'https://news.google.com',
          Referer: 'https://news.google.com/',
          'X-Same-Domain': '1',
          Cookie: 'CONSENT=PENDING+987',
        }),
        body: 'f.req=' + encodeURIComponent(outerPayload),
        signal: AbortSignal.timeout(9000),
      });
      if (!rpcResponse.ok) continue;
      const rpcText = await rpcResponse.text();
      const separator = rpcText.indexOf('\n\n');
      if (separator < 0) continue;
      let frames;
      try { frames = JSON.parse(rpcText.slice(separator + 2)); } catch { continue; }
      const frame = frames.find((entry) => Array.isArray(entry) && entry[0] === 'wrb.fr' && entry[1] === 'Fbv4je');
      if (!frame?.[2]) continue;
      let resolved;
      try { resolved = JSON.parse(frame[2])?.[1]; } catch { continue; }
      const realUrl = cleanUrl(resolved);
      if (realUrl && !realUrl.includes('news.google.com/')) return realUrl;
    } catch {
      // Try the alternate Google News path for a signature.
    }
  }
  return '';
}
async function fetchArticleImage(articleUrl) {
  const url = cleanUrl(articleUrl);
  if (!url) return '';
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: newsHeaders({ Referer: new URL(url).origin + '/' }),
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok || !response.headers.get('content-type')?.toLowerCase().includes('text/html')) return '';
    const html = (await response.text()).slice(0, 1_500_000);
    const finalUrl = response.url || url;
    if (finalUrl.includes('news.google.com/')) return '';
    return parseMetaImage(html, finalUrl);
  } catch {
    return '';
  }
}
async function mapLimit(items, concurrency, callback) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try { await callback(items[index], index); } catch { /* One article must not block the feed. */ }
    }
  }));
}
async function fetchFeed(query, source) {
  const url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(query) + '&hl=bn&gl=BD&ceid=BD:bn';
  const response = await fetch(url, {
    headers: { 'User-Agent': 'RannarMenu-NewsFeed/1.0', Accept: 'application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(source + ': HTTP ' + response.status);
  const xml = await response.text();
  if (!/<rss[\s>]/i.test(xml)) throw new Error(source + ': invalid RSS response');
  const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map((match) => {
    const block = match[1];
    const rawTitle = tag(block, 'title');
    const separator = rawTitle.lastIndexOf(' - ');
    const hasPublisher = separator > 18 && separator < rawTitle.length - 4;
    const title = hasPublisher ? rawTitle.slice(0, separator).trim() : rawTitle;
    const publisher = hasPublisher ? rawTitle.slice(separator + 3).trim() : source;
    const link = cleanUrl(tag(block, 'link'));
    const descriptionRaw = rawTag(block, 'description');
    const description = descriptionRaw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const sourceNode = block.match(/<source\\b[^>]*>/i)?.[0] || '';
    const publisherUrl = cleanUrl(attribute(sourceNode, 'url'));
    return {
      id: link, title, link, source: source === 'Google News' ? (tag(block, 'source') || publisher) : source,
      publisherUrl,
      publishedAt: tag(block, 'pubDate'),
      summary: description.length > 190 ? description.slice(0, 187) + '…' : description,
      image: extractRssImage(block, descriptionRaw),
    };
  }).filter((item) => item.title && item.link);
  const seen = new Set();
  return items.filter((item) => !seen.has(item.link) && seen.add(item.link)).slice(0, 10);
}

const result = { schemaVersion: 2, generatedAt: new Date().toISOString(), sponsors: {}, categories: {}, sourceErrors: [], imageStats: {} };
const tasks = [
  ...sponsors.map(async (source) => {
    try { result.sponsors[source.id] = await fetchFeed(source.query, source.label); }
    catch (error) { result.sponsors[source.id] = []; result.sourceErrors.push(source.id + ': ' + error.message); }
  }),
  ...categories.map(async (category) => {
    try { result.categories[category.id] = await fetchFeed(category.query, 'Google News'); }
    catch (error) { result.categories[category.id] = []; result.sourceErrors.push(category.id + ': ' + error.message); }
  }),
];
await Promise.all(tasks);

const allItems = [...Object.values(result.sponsors), ...Object.values(result.categories)].flat();
let previousByLink = new Map();
try {
  const previous = JSON.parse(await readFile('public/data/news-feed.json', 'utf8'));
  const previousItems = [...Object.values(previous.sponsors || {}), ...Object.values(previous.categories || {})].flat();
  const imageFrequency = new Map();
  for (const item of previousItems) {
    if (item.image) imageFrequency.set(item.image, (imageFrequency.get(item.image) || 0) + 1);
  }
  for (const item of previousItems) {
    const fallbackImage = String(item.image || '').startsWith('news-fallbacks/');
    const attemptedAt = Date.parse(item.imageAttemptedAt || '');
    const recentFallback = fallbackImage && Number.isFinite(attemptedAt) && Date.now() - attemptedAt < 24 * 60 * 60 * 1000;
    if (item.link && item.image && ((!fallbackImage && (imageFrequency.get(item.image) || 0) <= 3) || recentFallback)) {
      previousByLink.set(item.link, item);
    }
  }
} catch { /* First run or no prior snapshot. */ }

const rssImages = allItems.filter((item) => item.image).length;
const uniqueItems = new Map();
for (const item of allItems) {
  if (!item.image) {
    const previous = previousByLink.get(item.link);
    if (previous?.image) {
      item.image = previous.image;
      item.articleUrl = previous.articleUrl || item.articleUrl || '';
      item.imageAttemptedAt = previous.imageAttemptedAt || '';
    }
  }
  if (!item.image && !uniqueItems.has(item.link)) uniqueItems.set(item.link, item);
}
await mapLimit([...uniqueItems.values()], 3, async (item) => {
  const articleUrl = item.articleUrl || await resolveGoogleNewsArticleUrl(item.link);
  if (articleUrl) {
    item.articleUrl = articleUrl;
    item.image = await fetchArticleImage(articleUrl);
  }
});
const enrichedByLink = new Map([...uniqueItems.entries()]);
for (const item of allItems) {
  const enriched = enrichedByLink.get(item.link);
  if (enriched) {
    if (!item.image) item.image = enriched.image || '';
    if (!item.articleUrl) item.articleUrl = enriched.articleUrl || '';
    if (!item.imageAttemptedAt) item.imageAttemptedAt = enriched.imageAttemptedAt || '';
  }
}
const total = allItems.length;
if (!total) {
  console.error('No RSS items were fetched; refusing to overwrite the existing news snapshot.');
  process.exit(1);
}
const attemptedAt = new Date().toISOString();
for (const item of uniqueItems.values()) {
  if (!item.image) item.imageAttemptedAt = attemptedAt;
}
const fallbackBySponsor = 'news-fallbacks/newsroom.svg';
const fallbackByCategory = {
  food: 'news-fallbacks/food.svg',
  bangladesh: 'news-fallbacks/bangladesh.svg',
  international: 'news-fallbacks/world.svg',
};
for (const items of Object.values(result.sponsors)) {
  for (const item of items) {
    item.imageFallback = fallbackBySponsor;
    if (!item.image) item.image = fallbackBySponsor;
  }
}
for (const [categoryId, items] of Object.entries(result.categories)) {
  const fallback = fallbackByCategory[categoryId] || fallbackBySponsor;
  for (const item of items) {
    item.imageFallback = fallback;
    if (!item.image) item.image = fallback;
  }
}
const isFallbackImage = (item) => String(item?.image || '').startsWith('news-fallbacks/');
result.imageStats = {
  total,
  fromRss: rssImages,
  fromArticleMetadata: allItems.filter((item) => item.image && !isFallbackImage(item)).length - rssImages,
  reusedCached: allItems.filter((item) => previousByLink.has(item.link) && item.image && !isFallbackImage(item)).length,
  actualPhotos: allItems.filter((item) => item.image && !isFallbackImage(item)).length,
  fallbackIllustrations: allItems.filter(isFallbackImage).length,
  withImage: allItems.filter((item) => item.image).length,
  withoutImage: allItems.filter((item) => !item.image).length,
};
await mkdir('public/data', { recursive: true });
await writeFile('public/data/news-feed.json', JSON.stringify(result, null, 2) + '\n');
console.log('Saved ' + total + ' news items; images: ' + result.imageStats.withImage + '/' + total +
  ' (RSS: ' + result.imageStats.fromRss + ', article metadata: ' + result.imageStats.fromArticleMetadata +
  ', missing: ' + result.imageStats.withoutImage + '). Feed errors: ' + result.sourceErrors.length);
