import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { choose, createRound, current, nextLevel } from '../rules.mjs';
import { notesFor } from '../sounds.mjs';

test('wrong choices neither spend a turn nor mutate the original state', () => {
  const start = Object.freeze(createRound());
  const puzzle = current(start);
  const wrong = puzzle.choices.findIndex(tile => tile.shape !== puzzle.target.shape);
  let state = start;
  for (let attempt = 0; attempt < 25; attempt++) state = choose(state, wrong);
  assert.deepEqual(state, { ...start, feedback: 'try' });
  assert.equal(choose(state, -1).index, 0);
  assert.equal(nextLevel(start), start);
});

test('ten levels ease in extra tiles, colours and rotations with exactly one match', async () => {
  const sizes = [2,3,3,4,4,4,5,5,6,6];
  const rotations = new Set();
  const art = new Set();
  let state = createRound();

  for (const [level, tiles] of sizes.entries()) {
    assert.equal(state.level, level);
    for (let index = 0; index < 3; index++) {
      assert.equal(state.index, index);
      const { target, choices } = current(state);
      assert.equal(choices.length, tiles);
      assert.equal(target.rotation, 0);
      assert.equal(new Set(choices.map(t => `${t.shape}:${t.colour}`)).size, tiles);
      const sameShape = choices.filter(t => t.shape === target.shape);
      assert.equal(sameShape.length, level < 2 ? 1 : level === 9 ? 3 : 2);
      const solution = choices.findIndex(t => t.shape === target.shape && t.colour === target.colour);
      assert.notEqual(solution, -1);
      assert.ok(level < 4 ? choices[solution].rotation === 0 : choices[solution].rotation > 0);
      rotations.add(choices[solution].rotation);

      for (const [position, tile] of choices.entries()) {
        art.add(tile.shape);
        if (position !== solution) assert.deepEqual(choose(state, position), { ...state, feedback: 'try' });
      }
      state = choose(Object.freeze(state), solution);
      assert.equal(state.index, index + 1);
    }
    assert.equal(state.phase, level === 9 ? 'complete' : 'ready');
    assert.equal(choose(state, 0), state);
    state = nextLevel(state);
  }
  assert.deepEqual([...rotations].sort((a,b) => a-b), [0,90,180,270]);
  assert.deepEqual(createRound(), { level:0, index:0, phase:'play', feedback:'' });
  for (const shape of art) assert.match(await readFile(new URL(`../assets/${shape}.svg`, import.meta.url), 'utf8'), /<svg\b/);
});

test('sound starts silent and uses local tones when enabled', () => {
  for (const event of ['try', 'yes', 'complete']) assert.deepEqual(notesFor(event, false), []);
  assert.deepEqual(notesFor('try', true), [392]);
  assert.deepEqual(notesFor('yes', true), [523, 659]);
  assert.deepEqual(notesFor('complete', true), [523, 659, 784]);
});
