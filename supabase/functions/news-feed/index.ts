import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const NEWS_CATEGORIES = [
  { id: "food", label: "খাবার ও রান্না", query: "রান্না OR খাবার OR রেসিপি OR খাদ্য OR recipe OR cooking" },
  { id: "bangladesh", label: "বাংলাদেশ", query: "বাংলাদেশ OR Bangladesh news" },
  { id: "international", label: "আন্তর্জাতিক", query: "আন্তর্জাতিক OR বিশ্ব সংবাদ OR international news OR world news" },
];

const NEWS_SOURCES = [
  { id: "somoy", label: "সময় টিভি", query: "site:somoynews.tv" },
  { id: "ntv", label: "NTV", query: "site:ntvbd.com" },
  { id: "jamuna", label: "Jamuna TV", query: "site:jamuna.tv" },
  { id: "maasranga", label: "Maasranga TV", query: "site:maasranga.tv" },
  { id: "channel24", label: "News24 / Channel 24", query: "site:channel24bd.tv" },
];

const FALLBACKS: Record<string, string> = {
  food: "news-fallbacks/food.svg",
  bangladesh: "news-fallbacks/bangladesh.svg",
  international: "news-fallbacks/world.svg",
};
const MAX_AGE_DAYS = 30;
const RSS_TIMEOUT_MS = 6500;
const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
  "CDN-Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
};

function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

function decodeXml(value = ""): string {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function rawTag(xml: string, name: string): string {
  const safeName = name.replace(/[^a-zA-Z0-9:_-]/g, "");
  const pattern = new RegExp("<" + safeName + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + safeName + ">", "i");
  const match = xml.match(pattern);
  return match ? decodeXml(match[1].trim()) : "";
}

function attribute(tagText: string, name: string): string {
  const pattern = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  for (const match of tagText.matchAll(pattern)) {
    if (match[1].toLowerCase() === name.toLowerCase()) return decodeXml(match[2] ?? match[3] ?? "");
  }
  return "";
}

function stripHtml(value = ""): string {
  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeHttpUrl(value: unknown, base?: string): string {
  try {
    const parsed = base ? new URL(String(value || ""), base) : new URL(String(value || ""));
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) return "";
    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (
      !hostname ||
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".test") ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) ||
      hostname.includes(":")
    ) return "";
    return parsed.href;
  } catch {
    return "";
  }
}

function extractFeedImage(block: string, descriptionRaw: string, baseUrl: string): string {
  const candidates: string[] = [];
  for (const match of block.matchAll(/<(?:media:content|media:thumbnail|enclosure)\b[^>]*>/gi)) {
    candidates.push(attribute(match[0], "url"), attribute(match[0], "href"));
  }
  for (const match of descriptionRaw.matchAll(/<(?:img|source)\b[^>]*>/gi)) {
    candidates.push(attribute(match[0], "src"), attribute(match[0], "data-src"), attribute(match[0], "content"));
  }
  for (const value of candidates) {
    const url = safeHttpUrl(value, baseUrl);
    if (
      url?.startsWith("https://") &&
      !/(?:logo|favicon|avatar|profile|placeholder|default-cover|site-icon)/i.test(new URL(url).pathname)
    ) return url;
  }
  return "";
}

function isFresh(publishedAt: string): boolean {
  const time = Date.parse(publishedAt || "");
  if (!Number.isFinite(time)) return true;
  const age = Date.now() - time;
  return age >= -24 * 60 * 60 * 1000 && age <= MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
}

function parseRss(xml: string, defaultSource: string, fallbackImage: string) {
  const seen = new Set<string>();
  const results = [];
  const entries = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)];
  for (const match of entries) {
    const block = match[1];
    const rawTitle = stripHtml(rawTag(block, "title"));
    if (!rawTitle) continue;
    const separator = rawTitle.lastIndexOf(" - ");
    const hasPublisher = separator > 18 && separator < rawTitle.length - 4;
    const title = hasPublisher ? rawTitle.slice(0, separator).trim() : rawTitle;
    const inferredPublisher = hasPublisher ? rawTitle.slice(separator + 3).trim() : "";
    const link = safeHttpUrl(stripHtml(rawTag(block, "link")));
    if (!link || seen.has(link) || !title) continue;
    const descriptionRaw = rawTag(block, "description");
    const summaryRaw = stripHtml(descriptionRaw);
    const publishedAt = stripHtml(rawTag(block, "pubDate"));
    if (!isFresh(publishedAt)) continue;

    // Some publishers return navigation pages instead of article headlines in RSS search.
    if (/^(home|homepage|সর্বশেষ|latest|most popular television in bangladesh|.+\s*[—–-]\s*রক্ষণাবেক্ষণ)$/i.test(title)) continue;

    const source = stripHtml(rawTag(block, "source")) || inferredPublisher || defaultSource;
    seen.add(link);
    results.push({
      id: link,
      title,
      link,
      articleUrl: link,
      source,
      publishedAt,
      summary: summaryRaw.length > 190 ? summaryRaw.slice(0, 187) + "…" : summaryRaw,
      image: extractFeedImage(block, descriptionRaw, link),
      imageFallback: fallbackImage,
    });
  }
  return results.sort((a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0));
}

async function fetchFeed(query: string, source: string, fallback: string) {
  const feedUrl = "https://news.google.com/rss/search?q=" + encodeURIComponent(query) + "&hl=bn&gl=BD&ceid=BD:bn";
  const response = await fetch(feedUrl, {
    headers: {
      "User-Agent": "RannarMenu-NewsFeed/2.0",
      "Accept-Language": "bn-BD,bn;q=0.9,en;q=0.8",
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9,*/*;q=0.5",
    },
    signal: AbortSignal.timeout(RSS_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error("Google News RSS returned HTTP " + response.status);
  const xml = await response.text();
  if (!/<rss[\s>]/i.test(xml)) throw new Error("Google News RSS response was invalid");
  return parseRss(xml, source, fallback).slice(0, 10);
}

function getFeeds(feed: string) {
  const category = NEWS_CATEGORIES.find((item) => item.id === feed);
  if (category) return [{ ...category, fallback: FALLBACKS[category.id] }];

  const source = NEWS_SOURCES.find((item) => item.id === feed);
  if (source) return [{ ...source, fallback: "news-fallbacks/newsroom.svg" }];

  if (feed === "all") return NEWS_CATEGORIES.map((item) => ({ ...item, fallback: FALLBACKS[item.id] }));
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405, { Allow: "GET, OPTIONS", "Cache-Control": "no-store" });

  const feed = (new URL(req.url).searchParams.get("feed") || "").toLowerCase();
  const requestedFeeds = getFeeds(feed);
  if (!requestedFeeds) return json({ error: "Unknown news feed" }, 400, { "Cache-Control": "no-store" });

  const sourceErrors: string[] = [];
  const settled = await Promise.all(requestedFeeds.map(async (item) => {
    try {
      return await fetchFeed(item.query, item.label, item.fallback);
    } catch (error) {
      sourceErrors.push(item.id + ": " + (error instanceof Error ? error.message : "feed unavailable"));
      return [];
    }
  }));

  const unique = new Map<string, Record<string, unknown>>();
  for (const items of settled) {
    for (const item of items) if (!unique.has(item.link)) unique.set(item.link, item);
  }
  const items = [...unique.values()].sort((a, b) => {
    const left = Date.parse(String(a.publishedAt || "")) || 0;
    const right = Date.parse(String(b.publishedAt || "")) || 0;
    return right - left;
  }).slice(0, feed === "all" ? 24 : 10);

  if (!items.length) {
    return json({
      error: "Live news feed is temporarily unavailable",
      sourceErrors,
      generatedAt: new Date().toISOString(),
      items: [],
    }, 502, { "Cache-Control": "no-store" });
  }

  return json({
    apiVersion: 1,
    feed,
    generatedAt: new Date().toISOString(),
    items,
    sourceErrors,
  }, 200, CACHE_HEADERS);
});
