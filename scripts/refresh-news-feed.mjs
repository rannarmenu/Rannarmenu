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
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
function tag(xml, name) {
  const match = xml.match(new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + name + '>', 'i'));
  return match ? decodeXml(match[1].replace(/<[^>]+>/g, ' ').trim()).replace(/\s+/g, ' ') : '';
}
function cleanUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
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
    const title = separator > 18 ? rawTitle.slice(0, separator).trim() : rawTitle;
    const link = cleanUrl(tag(block, 'link'));
    const descriptionRaw = tag(block, 'description');
    const description = descriptionRaw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const imageMatch = descriptionRaw.match(/<img[^>]+src=["']([^"']+)["']/i);
    return {
      id: link, title, link, source,
      publishedAt: tag(block, 'pubDate'),
      summary: description.length > 190 ? description.slice(0, 187) + '…' : description,
      image: cleanUrl(imageMatch?.[1] || ''),
    };
  }).filter((item) => item.title && item.link);
  const seen = new Set();
  return items.filter((item) => !seen.has(item.link) && seen.add(item.link)).slice(0, 10);
}

const result = { schemaVersion: 1, generatedAt: new Date().toISOString(), sponsors: {}, categories: {}, sourceErrors: [] };
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
const total = [...Object.values(result.sponsors), ...Object.values(result.categories)].reduce((sum, items) => sum + items.length, 0);
if (!total) {
  console.error('No RSS items were fetched; refusing to overwrite the existing news snapshot.');
  process.exit(1);
}
await mkdir('public/data', { recursive: true });
await writeFile('public/data/news-feed.json', JSON.stringify(result, null, 2) + '\n');
console.log('Saved ' + total + ' news items. Feed errors: ' + result.sourceErrors.length);
