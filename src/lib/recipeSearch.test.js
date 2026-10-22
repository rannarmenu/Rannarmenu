import test from 'node:test';
import { toBangla } from './banglishTransliteration.js';
import assert from 'node:assert/strict';
import {
  buildRecipeSearchGroups,
  normalizeSearchText,
  parseGoogleTranslationResponse,
  recipeMatchesSearch,
  translateSearchQuery,
  translateChatText
} from './recipeSearch.js';

const biryaniRecipe = {
  title: 'ঘরোয়া চিকেন বিরিয়ানি',
  category: 'মাংস',
  desc: 'সুগন্ধি চাল ও মুরগি দিয়ে তৈরি একটি বিশেষ আয়োজন।',
  ingredients: ['বাসমতি চাল', 'মুরগি', 'পেঁয়াজ', 'বিরিয়ানি মসলা'],
  steps: ['চাল ও মুরগি স্তরে স্তরে সাজিয়ে দমে রাখুন।']
};

test('folds Latin accents without stripping Bengali vowel signs', () => {
  assert.equal(normalizeSearchText('Crème Brûlée'), 'creme brulee');
  assert.equal(normalizeSearchText('বিরিয়ানি'), normalizeSearchText('বিরিয়ানি'));
});

test('expands romanized Bangla and international food aliases', () => {
  const groups = buildRecipeSearchGroups('pollo biryani');
  assert.equal(groups.length, 2);
  assert.ok(groups[0].includes('মুরগি'));
  assert.ok(groups[1].includes(normalizeSearchText('বিরিয়ানি')));
});

test('finds Bengali recipes using English and romanized Bangla', () => {
  assert.equal(recipeMatchesSearch(biryaniRecipe, 'chicken biryani'), true);
  assert.equal(recipeMatchesSearch(biryaniRecipe, 'murgi biriyani'), true);
});

test('finds Bengali recipes using common Hindi and Arabic terms', () => {
  assert.equal(recipeMatchesSearch(biryaniRecipe, 'चिकन बिरयानी'), true);
  assert.equal(recipeMatchesSearch(biryaniRecipe, 'دجاج بریانی'), true);
});

test('keeps unknown-language input searchable as entered', () => {
  const recipe = { title: '鸡肉咖喱', summary: '家常菜' };
  assert.equal(recipeMatchesSearch(recipe, '鸡肉 咖喱'), true);
  assert.equal(recipeMatchesSearch(recipe, 'سمك'), false);
});

test('requires every meaningful query term to avoid overly broad matching', () => {
  assert.equal(recipeMatchesSearch(biryaniRecipe, 'chicken biryani'), true);
  assert.equal(recipeMatchesSearch(biryaniRecipe, 'chicken noodles'), false);
});

test('ignores common filler words but preserves a query made only of filler words', () => {
  assert.equal(buildRecipeSearchGroups('best chicken recipe').length, 1);
  assert.equal(buildRecipeSearchGroups('recipe').length, 1);
});

test('parses segmented translation responses safely', () => {
  assert.equal(
    parseGoogleTranslationResponse([[['curry', '咖喱'], [' rice ', '米饭']], null, 'zh-CN']),
    'curry rice'
  );
  assert.equal(parseGoogleTranslationResponse({translatedText:'not the expected provider shape'}), '');
});

test('translates an unfamiliar-language search to Bengali and English', async () => {
  const fakeFetch = async url => {
    const parsed = new URL(url);
    const target = parsed.searchParams.get('tl');
    assert.equal(parsed.searchParams.get('sl'), 'auto');
    return {
      ok: true,
      json: async () => [[ [target === 'bn' ? 'মুরগি' : 'chicken', 'pollo'] ], null, 'es']
    };
  };
  const translations = await translateSearchQuery('dragonfruit-unlisted-test', {fetchImpl: fakeFetch});
  assert.ok(translations.includes('মুরগি'));
  assert.ok(translations.includes('chicken'));
});

test('translation errors fail gracefully without breaking the search helper', async () => {
  const translations = await translateSearchQuery('unknown-food-network-test', {
    fetchImpl: async () => { throw new Error('network unavailable'); }
  });
  assert.deepEqual(translations, []);
});


test('chat translation detects the source language and returns translated text', async () => {
  const fakeFetch = async url => {
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get('sl'), 'auto');
    assert.equal(parsed.searchParams.get('tl'), 'bn');
    return {
      ok: true,
      json: async () => [[['আমি মুরগির রেসিপি চাই', 'Quiero una receta de pollo']], null, 'es']
    };
  };
  const result = await translateChatText('Quiero una receta de pollo', {target:'bn',fetchImpl:fakeFetch});
  assert.equal(result.text, 'আমি মুরগির রেসিপি চাই');
  assert.equal(result.sourceLanguage, 'es');
});

test('chat reply localization translates Bengali replies to the detected user language', async () => {
  const fakeFetch = async url => {
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get('sl'), 'bn');
    assert.equal(parsed.searchParams.get('tl'), 'es');
    return {
      ok: true,
      json: async () => [[['¿Qué receta quieres?', 'কোন রেসিপি চাই?']], null, 'bn']
    };
  };
  const result = await translateChatText('কোন রেসিপি চাই?', {source:'bn',target:'es',fetchImpl:fakeFetch});
  assert.equal(result.text, '¿Qué receta quieres?');
  assert.equal(result.sourceLanguage, 'bn');
});

test('chat translation returns a safe empty result on service failure', async () => {
  const result = await translateChatText('unknown language message', {
    target:'bn',
    fetchImpl: async () => { throw new Error('service unavailable'); }
  });
  assert.deepEqual(result, {text:'',sourceLanguage:'und'});
});


test('normalizes punctuation and inconsistent search spacing', () => {
  assert.equal(normalizeSearchText('Ilish.Mach   '), 'ilish mach');
});

test('transliterates common Banglish dish words locally', () => {
  assert.equal(toBangla('ilish'), 'ইলিশ');
  assert.equal(toBangla('kacchi'), 'কাচ্চি');
});

test('search groups include Bengali matches for Banglish terms', () => {
  const groups = buildRecipeSearchGroups('ilish mach');
  assert.ok(groups[0].includes('ইলিশ'));
  assert.ok(groups[1].includes('মাছ'));
});

test('tolerates a common one-character spelling mistake', () => {
  const groups = buildRecipeSearchGroups('chiken');
  assert.ok(groups[0].includes('chicken'));
  assert.ok(groups[0].includes('মুরগি'));
});

test('matches Banglish searches against Bengali recipe titles and ingredients', () => {
  const fishRecipe = {
    title: 'ইলিশ মাছের ঝোল', category: 'মাছ',
    ingredients: ['ইলিশ মাছ', 'সরিষার তেল'], steps: ['মসলা দিয়ে রান্না করুন']
  };
  assert.equal(recipeMatchesSearch(fishRecipe, 'ilish mach'), true);
});

test('preserves multi-word intent for kacchi biryani', () => {
  assert.equal(recipeMatchesSearch(biryaniRecipe, 'kacchi biryani'), false);
  const kacchiRecipe = { title: 'কাচ্চি বিরিয়ানি', category: 'মাংস', ingredients: ['চাল', 'মাংস'] };
  assert.equal(recipeMatchesSearch(kacchiRecipe, 'kacchi biryani'), true);
});
