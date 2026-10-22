function safeHttpsUrl(value, base) {
  try {
    const parsed = base ? new URL(String(value || ''), base) : new URL(String(value || ''));
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return '';
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

function decodeHtml(value = '') {
  return String(value)
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function attribute(tagText, name) {
  const pattern = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  for (const match of String(tagText || '').matchAll(pattern)) {
    if (match[1].toLowerCase() === String(name).toLowerCase()) return decodeHtml(match[2] ?? match[3] ?? '');
  }
  return '';
}

function imageCandidate(value, baseUrl) {
  const url = safeHttpsUrl(decodeHtml(value), baseUrl);
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (/(?:logo|favicon|avatar|profile|placeholder|default-cover|site-icon)/i.test(parsed.pathname)) return '';
    return parsed.href;
  } catch {
    return '';
  }
}

function extractMetaImage(html, pageUrl) {
  for (const match of String(html || '').matchAll(/<meta\b[^>]*>/gi)) {
    const node = match[0];
    const key = (attribute(node, 'property') || attribute(node, 'name') || '').toLowerCase();
    if (!['og:image', 'og:image:secure_url', 'twitter:image', 'twitter:image:src'].includes(key)) continue;
    const candidate = imageCandidate(attribute(node, 'content'), pageUrl);
    if (candidate) return candidate;
  }

  for (const match of String(html || '').matchAll(/<link\b[^>]*>/gi)) {
    const node = match[0];
    if (/\bimage_src\b/i.test(attribute(node, 'rel'))) {
      const candidate = imageCandidate(attribute(node, 'href'), pageUrl);
      if (candidate) return candidate;
    }
    if (/\bcanonical\b/i.test(attribute(node, 'rel'))) {
      const candidate = safeHttpsUrl(attribute(node, 'href'), pageUrl);
      if (candidate && !new URL(candidate).hostname.endsWith('google.com')) {
        // The canonical URL is used by the caller as an article URL, not an image.
      }
    }
  }

  for (const match of String(html || '').matchAll(/["']image["']\s*:\s*(?:"([^"']+)"|\[\s*["']([^"']+)["']|\{\s*[^}]*["']url["']\s*:\s*["']([^"']+)["'])/gi)) {
    const candidate = imageCandidate(match[1] || match[2] || match[3] || '', pageUrl);
    if (candidate) return candidate;
  }
  return '';
}

function safeArticleUrl(value) {
  const url = safeHttpsUrl(value);
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'news.google.com' || parsed.pathname === '/' && !parsed.search) return '';
    return parsed.href;
  } catch {
    return '';
  }
}

async function fetchArticleMetadata(articleUrl) {
  const url = safeArticleUrl(articleUrl);
  if (!url) return { articleUrl: '', image: '' };

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/129.0.0.0 Safari/537.36',
        'Accept-Language': 'bn-BD,bn;q=0.9,en;q=0.8',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      },
      signal: AbortSignal.timeout(2600),
    });
    if (!response.ok || !String(response.headers.get('content-type') || '').toLowerCase().includes('text/html')) {
      return { articleUrl: safeArticleUrl(response.url) || url, image: '' };
    }
    const finalUrl = safeArticleUrl(response.url) || url;
    const html = (await response.text()).slice(0, 1_500_000);
    return { articleUrl: finalUrl, image: extractMetaImage(html, finalUrl) };
  } catch {
    return { articleUrl: url, image: '' };
  }
}

async function resolveGoogleNewsArticleUrl(articleUrl) {
  const original = safeHttpsUrl(articleUrl);
  if (!original) return '';
  const originalUrl = new URL(original);
  if (originalUrl.hostname !== 'news.google.com') return safeArticleUrl(original);

  const idMatch = originalUrl.pathname.match(/\/(?:rss\/)?articles\/([^/?]+)/i);
  if (!idMatch) return '';

  const articleId = idMatch[1];
  const pageUrls = [
    'https://news.google.com/articles/' + articleId + '?hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/articles/' + articleId + '?hl=en-US&gl=US&ceid=US:en',
  ];

  for (const pageUrl of pageUrls) {
    try {
      const response = await fetch(pageUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/129.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
        },
        signal: AbortSignal.timeout(1500),
      });
      if (!response.ok) continue;

      const finalUrl = safeHttpsUrl(response.url);
      if (finalUrl && new URL(finalUrl).hostname !== 'news.google.com') {
        const resolvedDirect = safeArticleUrl(finalUrl);
        if (resolvedDirect) return resolvedDirect;
      }

      const html = (await response.text()).slice(0, 1_000_000);
      for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
        const node = match[0];
        const key = (attribute(node, 'property') || attribute(node, 'name') || '').toLowerCase();
        if (key === 'og:url') {
          const direct = safeArticleUrl(attribute(node, 'content'));
          if (direct) return direct;
        }
      }

      const signature = html.match(/data-n-a-sg=["']([^"']+)["']/i)?.[1];
      const timestamp = html.match(/data-n-a-ts=["'](\d+)["']/i)?.[1];
      if (!signature || !timestamp) continue;

      const innerPayload = JSON.stringify([
        'garturlreq',
        [['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1],
          'X', 'X', 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0],
        articleId, Number(timestamp), signature,
      ]);
      const outerPayload = JSON.stringify([[['Fbv4je', innerPayload]]]);
      const rpcResponse = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/129.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Origin: 'https://news.google.com',
          Referer: 'https://news.google.com/',
          'X-Same-Domain': '1',
        },
        body: 'f.req=' + encodeURIComponent(outerPayload),
        signal: AbortSignal.timeout(2300),
      });
      if (!rpcResponse.ok) continue;

      const rpcText = await rpcResponse.text();
      const separator = rpcText.indexOf('\n\n');
      if (separator < 0) continue;
      let frames;
      try {
        frames = JSON.parse(rpcText.slice(separator + 2).trim());
      } catch {
        continue;
      }
      const frame = frames.find((entry) => Array.isArray(entry) && entry[0] === 'wrb.fr' && entry[1] === 'Fbv4je');
      if (!frame?.[2]) continue;
      let resolvedUrl = '';
      try {
        resolvedUrl = safeArticleUrl(JSON.parse(frame[2])?.[1]);
      } catch {
        resolvedUrl = '';
      }
      if (resolvedUrl) return resolvedUrl;
    } catch {
      // Try the alternate Google News URL variant.
    }
  }
  return '';
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
  const articleUrl = String(req.query?.url || requestUrl.searchParams.get('url') || '');
  const parsed = safeHttpsUrl(articleUrl);
  if (!parsed || new URL(parsed).hostname !== 'news.google.com' || !/\/(?:rss\/)?articles\/[^/]+/i.test(new URL(parsed).pathname)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'Invalid news article link' });
  }

  try {
    const resolvedUrl = await resolveGoogleNewsArticleUrl(parsed);
    const metadata = resolvedUrl ? await fetchArticleMetadata(resolvedUrl) : { articleUrl: '', image: '' };
    const payload = {
      articleUrl: metadata.articleUrl || resolvedUrl || parsed,
      image: metadata.image || null,
    };
    res.setHeader('Cache-Control', payload.image
      ? 'public, s-maxage=86400, stale-while-revalidate=604800'
      : 'public, s-maxage=1800, stale-while-revalidate=3600');
    res.setHeader('CDN-Cache-Control', payload.image
      ? 'public, s-maxage=86400, stale-while-revalidate=604800'
      : 'public, s-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json(payload);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'Article image is temporarily unavailable' });
  }
}
