import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyMiraIntent,
  cleanBanglishRecipeQuery,
  detectBanglish,
  getCookingTroubleshootingReply,
  normalizeBanglishText
} from './miraLanguage.js';

test('recognizes common Banglish as Bengali-language input', () => {
  assert.equal(detectBanglish('ami chicken biriyani ranna korte chai'), true);
  assert.equal(detectBanglish('website e save korbo kivabe'), true);
  assert.equal(detectBanglish('hello there'), false);
});

test('cleans conversational filler while preserving the requested dish', () => {
  assert.equal(cleanBanglishRecipeQuery('ami chicken biriyani ranna korte chai'), 'chicken biryani');
  assert.equal(cleanBanglishRecipeQuery('amar jonno ilish macher jhol recipe dao'), 'ilish mach jhol');
  assert.equal(cleanBanglishRecipeQuery('recipe dao'), '');
});

test('classifies specific Banglish recipe requests', () => {
  assert.equal(classifyMiraIntent('ami chicken biriyani ranna korte chai'), 'recipe_search');
  assert.equal(classifyMiraIntent('amar jonno ilish macher recipe dao'), 'recipe_search');
});

test('asks for a dish name when the user only asks for a recipe', () => {
  assert.equal(classifyMiraIntent('recipe dao'), 'generic_recipe_request');
  assert.equal(classifyMiraIntent('amar jonno kichu ranna bolo'), 'generic_recipe_request');
});

test('treats vague preferences as missing recipe names instead of failed searches', () => {
  assert.equal(classifyMiraIntent('ami ekta easy recipe chai'), 'generic_recipe_request');
  assert.equal(cleanBanglishRecipeQuery('ami ekta easy recipe chai'), '');
});

test('recognizes Banglish website help', () => {
  assert.equal(classifyMiraIntent('website e save korbo kivabe'), 'website_help');
  assert.equal(classifyMiraIntent('amar website e search kaj kortese na'), 'website_help');
  assert.equal(classifyMiraIntent('search bar ta kothay pabo'), 'website_help');
});

test('understands cooking trouble descriptions written in Banglish', () => {
  assert.equal(classifyMiraIntent('amar biriyani jhorjhore hocche na, ki korbo'), 'cooking_problem');
  assert.match(getCookingTroubleshootingReply('biryani jhorjhore hocche na'), /চাল ঝরঝরে/u);
  assert.match(getCookingTroubleshootingReply('jhol patla hoye geche'), /ঝোল পাতলা/u);
  assert.match(getCookingTroubleshootingReply('lobon beshi hoye geche'), /নুন-লবণ একটু বেশি/u);
  assert.match(getCookingTroubleshootingReply('murgi kacha'), /ভিতরে কাঁচা/u);
  assert.equal(classifyMiraIntent('murgi kacha'), 'cooking_problem');
  assert.equal(classifyMiraIntent('biryani jhorjhore hocche na'), 'cooking_problem');
});

test('normalizes common romanized food and ingredient spellings', () => {
  assert.equal(normalizeBanglishText('murgir daal ar peyaj'), 'chicken dal ar onion');
});
