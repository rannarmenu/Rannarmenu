import test from 'node:test';
import assert from 'node:assert/strict';
import { isDishSpecificPhotoTitle } from './recipeImages.js';

const photo = (title, source, category = 'মাংস') => ({
  title,
  category,
  image_url: 'https://example.com/food.jpg',
  image_source_url: source,
  image_credit: 'Test photographer',
  image_license: 'CC BY-SA 4.0',
});

test('accepts a source filename that specifically identifies chicken kosha', () => {
  assert.equal(
    isDishSpecificPhotoTitle(photo(
      'চিকেন কষা',
      'https://commons.wikimedia.org/wiki/File%3AIndian_Kosha_chicken_with_steamed_rice.jpg'
    )),
    true
  );
});

test('accepts a source filename that specifically identifies Rohu fish curry', () => {
  assert.equal(
    isDishSpecificPhotoTitle(photo(
      'বাংলা স্টাইলে মাছের ঝোল',
      'https://commons.wikimedia.org/wiki/File%3ARohu_fish_curry.jpg',
      'মাছ'
    )),
    true
  );
});

test('rejects a khichuri photo whose source title identifies chicken for a vegetarian recipe', () => {
  assert.equal(
    isDishSpecificPhotoTitle(photo(
      'সবজি খিচুড়ি',
      'https://commons.wikimedia.org/wiki/File%3ABhuna_Khichuri_with_Chicken%2C_Vegetables.jpg',
      'নিরামিষ'
    )),
    false
  );
});

test('rejects a general vegetarian lunch photo for raw mango dal', () => {
  assert.equal(
    isDishSpecificPhotoTitle(photo(
      'কাঁচা আমের ডাল',
      'https://commons.wikimedia.org/wiki/File%3AComplete_traditional_Odia_vegetarian_lunch.jpg',
      'নিরামিষ'
    )),
    false
  );
});

test('rejects photo records without source attribution or license metadata', () => {
  assert.equal(isDishSpecificPhotoTitle({ title: 'চিকেন কষা', image_url: 'https://example.com/a.jpg' }), false);
});
