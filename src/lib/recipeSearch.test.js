import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRecipeSearchGroups,
  normalizeSearchText,
  recipeMatchesSearch
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
  assert.equal(normalizeSearchText('বিরিয়ানি'), 'বিরিয়ানি');
});

test('expands romanized Bangla and international food aliases', () => {
  const groups = buildRecipeSearchGroups('pollo biryani');
  assert.equal(groups.length, 2);
  assert.ok(groups[0].includes('মুরগি'));
  assert.ok(groups[1].includes('বিরিয়ানি'));
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
