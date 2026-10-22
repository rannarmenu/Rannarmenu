import test from 'node:test';
import assert from 'node:assert/strict';
import { clampMiraAnchor, getMiraPanelPlacement, getMiraWidgetOrigin } from './miraPosition.js';

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
  assert.deepEqual(getMiraWidgetOrigin(30,390,360,51),{left:30,side:'left'});
  assert.deepEqual(getMiraWidgetOrigin(329,390,368,51),{left:12,side:'right'});
});

test('clamps panel container origin on very narrow or irregular viewport input', () => {
  assert.deepEqual(getMiraWidgetOrigin(300,320,370,47),{left:0,side:'right'});
  assert.deepEqual(getMiraWidgetOrigin(-10,0,370,51),{left:0,side:'right'});
});


test('opens the chat above Mira when she is near the bottom edge', () => {
  const placement = getMiraPanelPlacement(
    {left:320,top:760,width:51,height:51},
    {width:390,height:844},
    {width:368,height:560}
  );
  assert.equal(placement.vertical, 'above');
  assert.ok(placement.top >= 12);
  assert.ok(placement.top + placement.height <= 832);
  assert.ok(placement.left >= 12);
  assert.ok(placement.left + placement.width <= 378);
});

test('opens below Mira when there is room and flips when there is not', () => {
  const below = getMiraPanelPlacement(
    {left:20,top:12,width:56,height:56},
    {width:1024,height:900},
    {width:370,height:590}
  );
  assert.equal(below.vertical, 'below');
  assert.equal(below.top, 80);

  const flipped = getMiraPanelPlacement(
    {left:20,top:500,width:56,height:56},
    {width:390,height:700},
    {width:368,height:560}
  );
  assert.equal(flipped.vertical, 'above');
  assert.ok(flipped.top >= 12);
  assert.ok(flipped.top + flipped.height <= 688);
});

test('keeps the panel usable in a very short mobile viewport', () => {
  const placement = getMiraPanelPlacement(
    {left:0,top:0,width:47,height:47},
    {width:320,height:360},
    {width:370,height:560}
  );
  assert.ok(placement.left >= 12);
  assert.ok(placement.top >= 12);
  assert.ok(placement.width <= 296);
  assert.ok(placement.height <= 336);
});
