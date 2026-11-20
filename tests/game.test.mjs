import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { choose, createRound } from '../rules.mjs';
import { notesFor } from '../sounds.mjs';

test('a wrong choice leaves the same target and choices through unlimited retries', () => {
  const start = createRound();
  let state = start;
  for (let attempt = 0; attempt < 25; attempt++) state = choose(state, 'triangle');
  assert.deepEqual(state, { ...start, feedback: 'try' });
  assert.equal(start.feedback, '');
  assert.equal(choose(state, 'circle').target, 'square');
});

test('a round has six different targets and introduces a third choice after three matches', async () => {
  const targets = ['circle', 'square', 'triangle', 'apple', 'pear', 'star'];
  let state = createRound();
  for (const [index, target] of targets.entries()) {
    assert.equal(state.index, index);
    assert.equal(state.target, target);
    assert.equal(state.choices.length, index < 3 ? 2 : 3);
    assert.equal(new Set(state.choices).size, state.choices.length);
    assert.ok(state.choices.includes(target));
    for (const id of state.choices) {
      const art = await readFile(new URL(`../assets/${id}.svg`, import.meta.url), 'utf8');
      assert.match(art, /<svg\b/);
    }
    state = choose(Object.freeze(state), target);
  }
  assert.deepEqual(state, { index: 6, target: null, choices: [], completed: true, feedback: 'yes' });
  assert.equal(choose(state, 'star'), state);
  assert.deepEqual(createRound(), { index: 0, target: 'circle', choices: ['triangle', 'circle'], completed: false, feedback: '' });
});

test('sound is silent when off and uses local tones when enabled', () => {
  for (const event of ['try', 'yes', 'complete']) assert.deepEqual(notesFor(event, false), []);
  assert.deepEqual(notesFor('try', true), [392]);
  assert.deepEqual(notesFor('yes', true), [523, 659]);
  assert.deepEqual(notesFor('complete', true), [523, 659, 784]);
  assert.deepEqual(notesFor('unknown', true), []);
});
