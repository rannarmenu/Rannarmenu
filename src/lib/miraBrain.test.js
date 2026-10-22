import test from 'node:test';
import assert from 'node:assert/strict';
import { getMiraFallbackReply, getMiraKnowledgeReply, getMiraLocalRecipeGuide } from './miraBrain.js';

test('answers common cooking trouble locally in Bengali and Banglish', () => {
  assert.match(getMiraKnowledgeReply('jhol patla'), /ঝোল পাতলা/u);
  assert.match(getMiraKnowledgeReply('lobon beshi'), /লবণহীন|নুন-লবণ/u);
  assert.match(getMiraKnowledgeReply('chicken kacha'), /সম্পূর্ণ সেদ্ধ/u);
});

test('answers useful measurement and food-safety questions without a model API', () => {
  assert.match(getMiraKnowledgeReply('1 cup koto ml'), /২৪০ মিলিলিটার/u);
  assert.match(getMiraKnowledgeReply('chicken safe to eat koto khon'), /৭৪°C/u);
  assert.match(getMiraKnowledgeReply('cooked food fridge e koto din'), /৩–৪ দিনের/u);
  assert.match(getMiraKnowledgeReply('cake boshe geche'), /ওভেন আগে খুলে ফেলা/u);
  assert.match(getMiraKnowledgeReply('mach bhenga geche'), /মাছ ভেঙে গেলে/u);
});

test('provides locally stored starter recipes when the catalog has no match', () => {
  assert.match(getMiraLocalRecipeGuide('egg curry recipe'), /সহজ ডিমের ঝোল/u);
  assert.match(getMiraLocalRecipeGuide('masoor dal'), /মসুর ডাল/u);
  assert.match(getMiraLocalRecipeGuide('chicken curry'), /৭৪°C/u);
  assert.match(getMiraLocalRecipeGuide('chicken biryani recipe'), /চিকেন বিরিয়ানি|চিকেন বিরিয়ানি/u);
  assert.match(getMiraLocalRecipeGuide('alu bhorta'), /আলু ভর্তা/u);
  assert.equal(getMiraLocalRecipeGuide('unlisted rare dish'), null);
});

test('uses an honest, useful fallback for unknown questions', () => {
  const reply = getMiraFallbackReply('something unrelated');
  assert.match(reply, /নিজস্ব রান্নাঘর-সহকারী/u);
  assert.match(reply, /নির্দিষ্ট করে বলো/u);
});
