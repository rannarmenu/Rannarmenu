import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyMiraIntent,
  cleanBanglishRecipeQuery,
  detectBanglish,
  getCookingTroubleshootingReply,
  getRecipeSelectionIndex,
  normalizeBanglishText
} from './miraLanguage.js';

test('recognizes common Banglish as Bengali-language input', () => {
  assert.equal(detectBanglish('ami chicken biriyani ranna korte chai'), true);
  assert.equal(detectBanglish('website e save korbo kivabe'), true);
  assert.equal(detectBanglish('hello there'), false);
});

test('understands casual Banglish greetings and small-talk intent', () => {
  assert.equal(classifyMiraIntent('Mira tumi kemon aso'), 'greeting');
  assert.equal(classifyMiraIntent('ki khobor Mira'), 'greeting');
});

test('routes short help and Roman Bangla thank-you messages correctly', () => {
  assert.equal(classifyMiraIntent('Mira ektu help koro'), 'website_help');
  assert.equal(classifyMiraIntent('ami bujhtesi na'), 'website_help');
  assert.equal(classifyMiraIntent('onek dhonnobad'), 'thanks');
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
  assert.equal(classifyMiraIntent('murgi koto khon ranna korte hobe'), 'cooking_problem');
  assert.match(getCookingTroubleshootingReply('murgi koto khon ranna korte hobe'), /৭৪°C/u);
  assert.equal(classifyMiraIntent('doi nei, ki diye replace korbo'), 'cooking_problem');
});

test('normalizes common romanized food and ingredient spellings', () => {
  assert.equal(normalizeBanglishText('murgir daal ar peyaj'), 'chicken dal ar onion');
});


test('uses conversation context to select a recipe by number or ordinal in Banglish', () => {
  assert.equal(getRecipeSelectionIndex('2 number ta dao', 4), 1);
  assert.equal(getRecipeSelectionIndex('second one', 3), 1);
  assert.equal(getRecipeSelectionIndex('prothom ta', 3), 0);
  assert.equal(getRecipeSelectionIndex('শেষটা', 3), 2);
  assert.equal(getRecipeSelectionIndex('3', 2), null);
  assert.equal(getRecipeSelectionIndex('second one', 1), null);
});
