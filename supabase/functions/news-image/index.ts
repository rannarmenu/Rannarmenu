import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const GOOD_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  "CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};
const EMPTY_CACHE = {
  "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
  "CDN-Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
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

function safeHttpsUrl(value: unknown, base?: string): string {
  try {
    const parsed = base ? new URL(String(value || ""), base) : new URL(String(value || ""));
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return "";
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

function decodeHtml(value = ""): string {
  return String(value)
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function attribute(tagText: string, name: string): string {
  const pattern = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  for (const match of tagText.matchAll(pattern)) {
    if (match[1].toLowerCase() === name.toLowerCase()) {
      return decodeHtml(match[2] ?? match[3] ?? "");
    }
  }
  return "";
}

function imageCandidate(value: string, baseUrl: string): string {
  const url = safeHttpsUrl(decodeHtml(value), baseUrl);
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (/(?:logo|favicon|avatar|profile|placeholder|default-cover|site-icon)/i.test(parsed.pathname)) return "";
    return parsed.href;
  } catch {
    return "";
  }
}

function extractMetaImage(html: string, pageUrl: string): string {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const node = match[0];
    const key = (attribute(node, "property") || attribute(node, "name") || "").toLowerCase();
    if (!["og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"].includes(key)) continue;
    const candidate = imageCandidate(attribute(node, "content"), pageUrl);
    if (candidate) return candidate;
  }

  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const node = match[0];
    if (/\bimage_src\b/i.test(attribute(node, "rel"))) {
      const candidate = imageCandidate(attribute(node, "href"), pageUrl);
      if (candidate) return candidate;
    }
  }

  const patterns = [
    /["']image["']\s*:\s*["']([^"']+)["']/gi,
    /["']image["']\s*:\s*\[\s*["']([^"']+)["']/gi,
    /["']image["']\s*:\s*\{\s*[^}]*["']url["']\s*:\s*["']([^"']+)["']/gi,
  ];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const candidate = imageCandidate(match[1] || "", pageUrl);
      if (candidate) return candidate;
    }
  }
  return "";
}

function safeArticleUrl(value: unknown): string {
  const url = safeHttpsUrl(value);
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "news.google.com" || (parsed.pathname === "/" && !parsed.search)) return "";
    return parsed.href;
  } catch {
    return "";
  }
}

async function fetchPublicHttps(
  url: string,
  init: RequestInit = {},
  timeoutMs = 2500,
  maxRedirects = 3,
): Promise<{ response: Response; url: string } | null> {
  let current = safeHttpsUrl(url);
  if (!current) return null;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    let response: Response;
    try {
      response = await fetch(current, {
        ...init,
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      return null;
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      const next = location ? safeHttpsUrl(location, current) : "";
      if (!next || hop === maxRedirects) return null;
      current = next;
      continue;
    }
    return { response, url: current };
  }
  return null;
}

async function fetchArticleMetadata(articleUrl: string) {
  const url = safeArticleUrl(articleUrl);
  if (!url) return { articleUrl: "", image: "" };

  const fetched = await fetchPublicHttps(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/129.0.0.0 Safari/537.36",
      "Accept-Language": "bn-BD,bn;q=0.9,en;q=0.8",
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
    },
  }, 2600, 3);

  if (!fetched) return { articleUrl: url, image: "" };
  const { response, url: finalUrl } = fetched;
  const normalizedArticleUrl = safeArticleUrl(finalUrl) || url;
  if (!response.ok || !String(response.headers.get("content-type") || "").toLowerCase().includes("text/html")) {
    return { articleUrl: normalizedArticleUrl, image: "" };
  }

  try {
    const html = (await response.text()).slice(0, 1_500_000);
    return { articleUrl: normalizedArticleUrl, image: extractMetaImage(html, normalizedArticleUrl) };
  } catch {
    return { articleUrl: normalizedArticleUrl, image: "" };
  }
}

async function resolveGoogleNewsArticleUrl(articleUrl: string): Promise<string> {
  const original = safeHttpsUrl(articleUrl);
  if (!original) return "";
  const originalUrl = new URL(original);
  if (originalUrl.hostname !== "news.google.com") return safeArticleUrl(original);

  const idMatch = originalUrl.pathname.match(/\/(?:rss\/)?articles\/([^/?]+)/i);
  if (!idMatch) return "";
  const articleId = idMatch[1];

  const headers = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/129.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9,bn;q=0.8",
    Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
  };
  const pages = [
    "https://news.google.com/articles/" + articleId + "?hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/articles/" + articleId + "?hl=en-US&gl=US&ceid=US:en",
  ];

  for (const pageUrl of pages) {
    const fetched = await fetchPublicHttps(pageUrl, { headers }, 1700, 3);
    if (!fetched) continue;
    const { response, url } = fetched;
    if (!response.ok) continue;
    if (new URL(url).hostname !== "news.google.com") {
      const directUrl = safeArticleUrl(url);
      if (directUrl) return directUrl;
    }

    let html = "";
    try {
      html = (await response.text()).slice(0, 1_000_000);
    } catch {
      continue;
    }

    for (const meta of html.matchAll(/<meta\b[^>]*>/gi)) {
      const node = meta[0];
      const key = (attribute(node, "property") || attribute(node, "name") || "").toLowerCase();
      if (key === "og:url") {
        const directUrl = safeArticleUrl(attribute(node, "content"));
        if (directUrl) return directUrl;
      }
    }

    const signature = html.match(/data-n-a-sg=["']([^"']+)["']/i)?.[1];
    const timestamp = html.match(/data-n-a-ts=["'](\d+)["']/i)?.[1];
    if (!signature || !timestamp) continue;

    const innerPayload = JSON.stringify([
      "garturlreq",
      [["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1],
        "X", "X", 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0],
      articleId, Number(timestamp), signature,
    ]);
    const outerPayload = JSON.stringify([[["Fbv4je", innerPayload]]]);
    try {
      const rpcResponse = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Origin: "https://news.google.com",
          Referer: "https://news.google.com/",
          "X-Same-Domain": "1",
        },
        body: "f.req=" + encodeURIComponent(outerPayload),
        redirect: "error",
        signal: AbortSignal.timeout(2500),
      });
      if (!rpcResponse.ok) continue;
      const rpcText = await rpcResponse.text();
      const separator = rpcText.indexOf("\n\n");
      if (separator < 0) continue;
      let frames: unknown;
      try {
        frames = JSON.parse(rpcText.slice(separator + 2).trim());
      } catch {
        continue;
      }
      if (!Array.isArray(frames)) continue;
      const frame = frames.find((entry) => Array.isArray(entry) && entry[0] === "wrb.fr" && entry[1] === "Fbv4je");
      if (!Array.isArray(frame) || !frame[2]) continue;
      let resolved = "";
      try {
        resolved = safeArticleUrl(JSON.parse(String(frame[2]))?.[1]);
      } catch {
        resolved = "";
      }
      if (resolved) return resolved;
    } catch {
      // Try the alternate Google News page variant.
    }
  }
  return "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405, { Allow: "GET, OPTIONS", "Cache-Control": "no-store" });

  const rawUrl = new URL(req.url).searchParams.get("url") || "";
  const parsed = safeHttpsUrl(rawUrl);
  if (!parsed || new URL(parsed).hostname !== "news.google.com" || !/^\/(?:rss\/)?articles\/[^/]+\/?$/i.test(new URL(parsed).pathname)) {
    return json({ error: "Invalid news article link" }, 400, { "Cache-Control": "no-store" });
  }

  const resolvedUrl = await resolveGoogleNewsArticleUrl(parsed);
  const metadata = resolvedUrl ? await fetchArticleMetadata(resolvedUrl) : { articleUrl: "", image: "" };
  const payload = {
    articleUrl: metadata.articleUrl || resolvedUrl || parsed,
    image: metadata.image || null,
  };
  return json(payload, 200, payload.image ? GOOD_CACHE : EMPTY_CACHE);
});
