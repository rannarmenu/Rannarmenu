import test from 'node:test';
import assert from 'node:assert/strict';
import { getPhotoFallbackUrls } from '../src/lib/recipeImages.js';

test('thumbnail failure retries through the legacy Wikimedia upload hostname', () => {
  const imageUrl = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/Chicken_biryani_3.jpg/1280px-Chicken_biryani_3.jpg?utm_source=commons.wikimedia.org';
  const sourceUrl = 'https://commons.wikimedia.org/wiki/File%3AChicken_biryani_3.jpg';
  const fallbacks = getPhotoFallbackUrls(imageUrl, sourceUrl);

  assert.equal(fallbacks[0], imageUrl.replace('thumb.wikimedia.org', 'upload.wikimedia.org'));
  assert.ok(fallbacks[1].startsWith('https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/'));
  assert.ok(fallbacks[1].includes('Chicken_biryani_3.jpg&width=1200'));
});

test('a Commons File page can provide a redirect fallback for older FilePath URLs', () => {
  const imageUrl = 'https://commons.wikimedia.org/wiki/Special:FilePath/Rohu_fish_curry.jpg?width=1024';
  const sourceUrl = 'https://commons.wikimedia.org/wiki/File:Rohu_fish_curry.jpg';
  const fallbacks = getPhotoFallbackUrls(imageUrl, sourceUrl);

  assert.equal(fallbacks.length, 1);
  assert.ok(fallbacks[0].includes('Special:Redirect/file/Rohu_fish_curry.jpg&width=1200'));
});

test('untrusted image/source hosts do not produce fallback URLs', () => {
  assert.deepEqual(
    getPhotoFallbackUrls('https://images.example.com/recipe.jpg', 'https://images.example.com/File:recipe.jpg'),
    []
  );
});

test('a non-Commons source does not get a Commons redirect fallback', () => {
  const fallbacks = getPhotoFallbackUrls(
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/Chicken_biryani_3.jpg/1280px-Chicken_biryani_3.jpg',
    'https://attacker.example/recipe.jpg'
  );
  assert.equal(fallbacks.length, 1);
  assert.ok(fallbacks[0].startsWith('https://upload.wikimedia.org/'));
});
