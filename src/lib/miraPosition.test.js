import test from 'node:test';
import assert from 'node:assert/strict';
import { clampMiraAnchor, getMiraWidgetOrigin } from './miraPosition.js';

test('clamps Mira inside every viewport edge', () => {
  assert.deepEqual(
    clampMiraAnchor({left:-80,top:-20},{width:390,height:844},{width:51,height:51}),
    {left:0,top:0}
  );
  assert.deepEqual(
    clampMiraAnchor({left:900,top:1900},{width:390,height:844},{width:51,height:51}),
    {left:339,top:793}
  );
});

test('keeps Mira reachable when the screen is narrower than the chat panel', () => {
  assert.deepEqual(
    clampMiraAnchor({left:40,top:20},{width:320,height:620},{width:47,height:47}),
    {left:40,top:20}
  );
});

test('places the widget container toward the centre without shifting the launcher anchor', () => {
  assert.deepEqual(getMiraWidgetOrigin(30,390,368,51),{left:30,side:'left'});
  assert.deepEqual(getMiraWidgetOrigin(329,390,368,51),{left:22,side:'right'});
});

test('clamps panel container origin on very narrow or irregular viewport input', () => {
  assert.deepEqual(getMiraWidgetOrigin(300,320,370,47),{left:0,side:'right'});
  assert.deepEqual(getMiraWidgetOrigin(-10,0,370,51),{left:0,side:'right'});
});
