import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMiraConversation, normalizeMiraAIResult } from './miraAI.js';

test('builds a short context window and adds the current user message once', () => {
  const history = [
    {role:'assistant',text:'Welcome',recipes:[{title:'hidden UI data'}]},
    {role:'user',text:'I want dinner'},
    {role:'assistant',text:'Any preference?'},
  ];
  assert.deepEqual(buildMiraConversation(history,'chicken biryani'),[
    {role:'assistant',content:'Welcome'},
    {role:'user',content:'I want dinner'},
    {role:'assistant',content:'Any preference?'},
    {role:'user',content:'chicken biryani'}
  ]);
});

test('caps history and message size before sending to the server', () => {
  const history = Array.from({length:20},(_,i)=>({role:i%2?'assistant':'user',text:'m'.repeat(1800)}));
  const result = buildMiraConversation(history,'current'.repeat(300));
  assert.equal(result.length,12);
  assert.ok(result.every(message=>message.content.length<=1400));
  assert.equal(result.at(-1).role,'user');
});

test('validates normal text replies from AI', () => {
  assert.deepEqual(normalizeMiraAIResult({
    ok:true,action:'chat',reply:'Hello there!',search_query:''
  }),{action:'chat',reply:'Hello there!',search_query:''});
});

test('only permits database-backed recipe searches with a real query', () => {
  assert.deepEqual(normalizeMiraAIResult({
    ok:true,action:'recipe_search',reply:'Let me find that.',search_query:'chicken biryani'
  }),{action:'recipe_search',reply:'Let me find that.',search_query:'chicken biryani'});
  assert.equal(normalizeMiraAIResult({
    ok:true,action:'recipe_search',reply:'Here you go.',search_query:''
  }),null);
});

test('rejects invalid actions, errors, unexpected search queries and malformed data', () => {
  assert.equal(normalizeMiraAIResult({ok:false,code:'AI_NOT_CONFIGURED'}),null);
  assert.equal(normalizeMiraAIResult({ok:true,action:'open_any_url',reply:'ok',search_query:''}),null);
  assert.equal(normalizeMiraAIResult({ok:true,action:'chat',reply:'ok',search_query:'wrong'}),null);
  assert.equal(normalizeMiraAIResult(null),null);
});

test('trims long model output before rendering in the chat panel', () => {
  const result = normalizeMiraAIResult({
    ok:true,action:'chat',reply:'x'.repeat(7000),search_query:''
  });
  assert.equal(result.reply.length,5000);
});
