import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMiraConversation,
  getMiraAIErrorMessage,
  normalizeMiraAIResult
} from './miraGemini.js';

test('keeps a bounded context window and appends the current user message exactly once', () => {
  const result = buildMiraConversation([
    { role: 'assistant', text: 'Welcome' },
    { role: 'user', text: 'I want dinner' },
    { role: 'assistant', text: 'Any preference?' }
  ], 'chicken biryani');
  assert.deepEqual(result, [
    { role: 'assistant', content: 'Welcome' },
    { role: 'user', content: 'I want dinner' },
    { role: 'assistant', content: 'Any preference?' },
    { role: 'user', content: 'chicken biryani' }
  ]);
});

test('drops malformed history and enforces message and total context budgets', () => {
  const history = Array.from({ length: 22 }, (_, i) => ({
    role: i % 2 ? 'assistant' : 'user',
    text: 'x'.repeat(2000)
  }));
  const result = buildMiraConversation(history, 'latest '.repeat(400));
  assert.ok(result.length <= 12);
  assert.ok(result.every(message => message.content.length <= 1400));
  assert.ok(result.reduce((n, message) => n + message.content.length, 0) <= 8000);
  assert.equal(result.at(-1).role, 'user');
});

test('accepts valid Gemini actions and limits recipe search to a query', () => {
  assert.deepEqual(normalizeMiraAIResult({
    ok: true, action: 'chat', reply: 'Hello!', search_query: ''
  }), { action: 'chat', reply: 'Hello!', search_query: '' });
  assert.equal(normalizeMiraAIResult({
    ok: true, action: 'recipe_search', reply: 'Searching.', search_query: 'ilish bhuna'
  }).search_query, 'ilish bhuna');
  assert.equal(normalizeMiraAIResult({
    ok: true, action: 'recipe_search', reply: 'Searching.', search_query: ''
  }), null);
});

test('rejects unsafe actions and malformed model output', () => {
  for (const value of [
    null,
    { ok: false, code: 'AI_NOT_CONFIGURED' },
    { ok: true, action: 'open_url', reply: 'Open it', search_query: '' },
    { ok: true, action: 'chat', reply: 'Hello', search_query: 'unexpected query' },
    { ok: true, action: 'chat', reply: '', search_query: '' }
  ]) assert.equal(normalizeMiraAIResult(value), null);
});

test('uses localized and safe Gemini diagnostics', () => {
  assert.match(getMiraAIErrorMessage('AI_NOT_CONFIGURED', 'bn'), /GEMINI_API_KEY/u);
  assert.match(getMiraAIErrorMessage('AI_BILLING_REQUIRED', 'banglish'), /quota|billing/u);
  assert.match(getMiraAIErrorMessage('UNKNOWN_INTERNAL_DETAIL', 'en'), /temporarily unavailable/u);
});
