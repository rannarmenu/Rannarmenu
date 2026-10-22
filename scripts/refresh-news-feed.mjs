import { mkdir, writeFile } from 'node:fs/promises';

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
function hostMatches(host, expectedHost) {
  const hostName = String(host || '').toLowerCase().replace(/^www\./, '');
  const expected = String(expectedHost || '').toLowerCase().replace(/^www\./, '');
  return Boolean(expected && (hostName === expected || hostName.endsWith('.' + expected)));
}
function findPublisherArticleLink(html, pageUrl, publisherUrl) {
  let expectedHost = '';
  try { expectedHost = new URL(publisherUrl).hostname; } catch { /* infer from page links */ }
  const matches = [];
  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = cleanUrl(decodeHtml(attribute(match[0], 'href')), pageUrl);
    if (!href) continue;
    let parsed;
    try { parsed = new URL(href); } catch { continue; }
    const host = parsed.hostname.toLowerCase();
    if (/\b(google|gstatic|googleapis|youtube|facebook|instagram|twitter|x)\./i.test(host)) continue;
    if (parsed.pathname === '/' || /\.(css|js|png|jpe?g|gif|svg|webp|ico|pdf)$/i.test(parsed.pathname)) continue;
    const preferred = hostMatches(host, expectedHost) ? 1 : 0;
    matches.push({ href, preferred, pathLength: parsed.pathname.length });
  }
  matches.sort((a, b) => b.preferred - a.preferred || b.pathLength - a.pathLength);
  return matches[0]?.href || '';
}
async function fetchArticlePage(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; RannarMenuNewsBot/1.0; +https://rannarmenu.github.io/Rannarmenu/)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(9000),
  });
  if (!response.ok || !response.headers.get('content-type')?.toLowerCase().includes('text/html')) return null;
  const html = (await response.text()).slice(0, 1_500_000);
  let hostname = '';
  try { hostname = new URL(response.url || url).hostname.toLowerCase(); } catch { /* retain empty hostname */ }
  return { html, url: response.url || url, hostname };
}
async function fetchArticleImage(articleUrl, publisherUrl = '') {
  const url = cleanUrl(articleUrl);
  if (!url) return '';
  try {
    let page = await fetchArticlePage(url);
    if (!page) return '';
    if (url.includes('CBMiVEFVX3lxTE03cURZ')) {
      console.log('IMAGE_DEBUG ' + JSON.stringify({
        requestedUrl: url,
        finalUrl: page.url,
        finalHost: page.hostname,
        publisherUrl,
        htmlStart: page.html.slice(0, 1800),
        articleCandidate: findPublisherArticleLink(page.html, page.url, publisherUrl),
      }));
    }
    if (page.hostname === 'news.google.com' || page.hostname.endsWith('.news.google.com')) {
      const article = findPublisherArticleLink(page.html, page.url, publisherUrl);
      if (!article) return '';
      page = await fetchArticlePage(article);
      if (!page) return '';
    }
    if (page.hostname === 'news.google.com' || page.hostname.endsWith('.news.google.com')) return '';
    const image = parseMetaImage(page.html, page.url);
    if (!image) return '';
    let imageHost = '';
    try { imageHost = new URL(image).hostname.toLowerCase(); } catch { return ''; }
    if (imageHost === 'news.google.com') return '';
    return image;
  } catch {
    // Some publishers block automated metadata reads. Keep processing other news.
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
const rssImages = allItems.filter((item) => item.image).length;
await mapLimit(allItems.filter((item) => !item.image), 8, async (item) => {
  item.image = await fetchArticleImage(item.link, item.publisherUrl);
});
const total = allItems.length;
if (!total) {
  console.error('No RSS items were fetched; refusing to overwrite the existing news snapshot.');
  process.exit(1);
}
result.imageStats = {
  total,
  fromRss: rssImages,
  fromArticleMetadata: allItems.filter((item) => item.image).length - rssImages,
  withImage: allItems.filter((item) => item.image).length,
  withoutImage: allItems.filter((item) => !item.image).length,
};
await mkdir('public/data', { recursive: true });
await writeFile('public/data/news-feed.json', JSON.stringify(result, null, 2) + '\n');
console.log('Saved ' + total + ' news items; images: ' + result.imageStats.withImage + '/' + total +
  ' (RSS: ' + result.imageStats.fromRss + ', article metadata: ' + result.imageStats.fromArticleMetadata +
  ', missing: ' + result.imageStats.withoutImage + '). Feed errors: ' + result.sourceErrors.length);
