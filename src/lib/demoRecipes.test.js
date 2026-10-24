import test from 'node:test';
import assert from 'node:assert/strict';
import { demoRecipes } from '../src/lib/demoRecipes.js';

test('fallback recipes have usable detail content', () => {
  assert.ok(demoRecipes.length >= 6, 'expected the six fallback recipes to remain available');
  for (const recipe of demoRecipes) {
    assert.ok(recipe.id && recipe.slug && recipe.title, 'each recipe must have stable identity and a title');
    assert.ok(Array.isArray(recipe.ingredients) && recipe.ingredients.length >= 4, `${recipe.title} must include ingredients`);
    assert.ok(Array.isArray(recipe.steps) && recipe.steps.length >= 4, `${recipe.title} must include cooking steps`);
  }
});

test('fallback recipe identifiers and slugs are unique', () => {
  assert.equal(new Set(demoRecipes.map((recipe) => recipe.id)).size, demoRecipes.length);
  assert.equal(new Set(demoRecipes.map((recipe) => recipe.slug)).size, demoRecipes.length);
});

test('fallback recipes have valid positive cooking times and servings', () => {
  for (const recipe of demoRecipes) {
    assert.ok(Number.isFinite(recipe.time) && recipe.time > 0, `${recipe.title} must have a positive time`);
    assert.ok(Number.isFinite(recipe.servings) && recipe.servings > 0, `${recipe.title} must have positive servings`);
  }
});

test('demo recipes resolve from both direct slugs and fallback IDs', async () => {
  const { findDemoRecipe } = await import('../src/lib/demoRecipes.js');
  assert.equal(findDemoRecipe('ghoroya-chicken-biryani'), demoRecipes[0]);
  assert.equal(findDemoRecipe('demo-biryani'), demoRecipes[0]);
  assert.equal(findDemoRecipe('not-a-real-recipe'), null);
});
