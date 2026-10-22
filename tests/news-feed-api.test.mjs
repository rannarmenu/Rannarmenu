import test from 'node:test';
import assert from 'node:assert/strict';
import { isFreshNews, parseRssItems } from '../api/news.js';

test('parses a news headline, publisher, publication date, summary, and thumbnail', () => {
  const publishedAt = new Date(Date.now() - 60 * 1000).toUTCString();
  const xml = '<rss><channel><item>' +
    '<title><![CDATA[Breaking Bangladesh news today - Jamuna TV]]></title>' +
    '<link>https://news.google.com/rss/articles/example-story?oc=5</link>' +
    '<pubDate>' + publishedAt + '</pubDate>' +
    '<description><![CDATA[<p>বিস্তারিত খবর এখানে</p>]]></description>' +
    '<source url="https://jamuna.tv/">Jamuna TV</source>' +
    '<media:content url="https://cdn.example.com/images/story.jpg" medium="image"/>' +
    '</item></channel></rss>';

  const items = parseRssItems(xml, 'Google News', 'news-fallbacks/world.svg');
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Breaking Bangladesh news today');
  assert.equal(items[0].source, 'Jamuna TV');
  assert.equal(items[0].summary, 'বিস্তারিত খবর এখানে');
  assert.equal(items[0].image, 'https://cdn.example.com/images/story.jpg');
  assert.equal(items[0].imageFallback, 'news-fallbacks/world.svg');
});

test('filters articles older than the freshness window', () => {
  const now = Date.parse('2026-10-22T12:00:00.000Z');
  assert.equal(isFreshNews({ publishedAt: 'Mon, 21 Sep 2026 12:00:00 GMT' }, now, 30), false);
  assert.equal(isFreshNews({ publishedAt: 'Thu, 22 Oct 2026 11:30:00 GMT' }, now, 30), true);
});

test('allows undated items but rejects implausibly future-dated items', () => {
  const now = Date.parse('2026-10-22T12:00:00.000Z');
  assert.equal(isFreshNews({ title: 'A headline without a date' }, now, 30), true);
  assert.equal(isFreshNews({ publishedAt: 'Sun, 25 Oct 2026 12:00:00 GMT' }, now, 30), false);
});
