import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecipeRecord, slugify, parseRecipeFile } from '../src/lib/recipeImport.js';

const valid = {
  title: 'সবজি খিচুড়ি',
  category: 'নিরামিষ',
  ingredients: 'চাল ১ কাপ; মুগ ডাল ১/২ কাপ; গাজর ১টি',
  instructions: 'ডাল ধুয়ে নিন|চাল ও সবজি দিয়ে নরম হওয়া পর্যন্ত রান্না করুন',
  difficulty: 'মাঝারি',
  image_url: '',
  source_url: ''
};

test('slugify creates a stable unicode-safe slug', () => {
  assert.equal(slugify('  সবজি   খিচুড়ি! '), 'সবজি-খিচুড়ি');
});

test('recipe normalizer parses separated ingredients and steps', () => {
  const out = normalizeRecipeRecord(valid);
  assert.ok(out.recipe);
  assert.equal(out.recipe.ingredients.length, 3);
  assert.equal(out.recipe.instructions.length, 2);
  assert.equal(out.recipe.difficulty, 'medium');
  assert.equal(out.recipe.category, 'নিরামিষ');
});

test('recipe normalizer rejects missing required content', () => {
  assert.match(normalizeRecipeRecord({ title: 'ডাল' }).error, /ingredients/i);
  assert.match(normalizeRecipeRecord({ ...valid, instructions: '' }).error, /instructions/i);
});

test('recipe normalizer rejects non-HTTPS image/source links', () => {
  assert.match(normalizeRecipeRecord({ ...valid, image_url: 'http://example.com/a.jpg' }).error, /https/i);
  assert.match(normalizeRecipeRecord({ ...valid, source_url: 'http://example.com/recipe' }).error, /https/i);
});

test('CSV parser accepts a UTF-8 recipe file', async () => {
  const csv = 'title,category,ingredients,instructions\n"ডাল","নিরামিষ","মসুর ডাল; লবণ","ডাল ধুয়ে নিন|সেদ্ধ করুন"\n';
  const file = new File([csv], 'recipes.csv', { type: 'text/csv' });
  const rows = await parseRecipeFile(file);
  assert.equal(rows.length, 1);
  assert.equal(normalizeRecipeRecord(rows[0]).recipe.title, 'ডাল');
});

test('JSON parser accepts both array and recipes-wrapper formats', async () => {
  const file = new File([JSON.stringify({ recipes: [valid] })], 'recipes.json', { type: 'application/json' });
  const rows = await parseRecipeFile(file);
  assert.equal(rows.length, 1);
  assert.equal(normalizeRecipeRecord(rows[0]).recipe.slug, slugify(valid.title));
});
