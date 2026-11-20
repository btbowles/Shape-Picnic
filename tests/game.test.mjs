import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { choose, createRound, current, levels, nextLevel } from '../rules.mjs';
import { notesFor } from '../sounds.mjs';

test('wrong choices never spend a turn or change the original state', () => {
  const start = Object.freeze(createRound());
  let state = start;
  for (let attempt = 0; attempt < 25; attempt++) state = choose(state, 0);
  assert.deepEqual(state, { ...start, feedback: 'try' });
  assert.equal(choose(state, 1).index, 1);
  assert.equal(nextLevel(start), start);
});

test('all ten levels are playable and progress only after each puzzle is solved', () => {
  const solutions = [
    [[1],[0],[1]], [[1],[0],[2]], [[2],[0],[1]], [[1],[2],[0]], [[1],[0],[2]],
    [[1],[0],[2]], [[1],[0],[2]], [[1],[2],[0]], [[1,2],[2,1],[1,2,0]], [[2,0],[1,2,0],[0,1,0]],
  ];
  assert.equal(levels.length, solutions.length);
  let state = createRound();
  for (const [level, puzzles] of solutions.entries()) {
    assert.equal(state.level, level);
    for (const [index, taps] of puzzles.entries()) {
      assert.equal(state.index, index);
      assert.equal(current(state).choices.length, level === 0 ? 2 : 3);
      for (const [step, tap] of taps.entries()) {
        const wrong = choose(state, -1);
        assert.deepEqual(wrong, { ...state, feedback: 'try' });
        state = choose(Object.freeze(state), tap);
        assert.equal(state.index, index + Number(step === taps.length - 1));
      }
    }
    assert.equal(state.phase, level === 9 ? 'complete' : 'ready');
    assert.equal(choose(state, 0), state);
    state = nextLevel(state);
  }
  assert.deepEqual(createRound(), { level:0, index:0, step:0, phase:'play', feedback:'' });
});

test('all referenced illustration files exist', async () => {
  const ids = new Set(['flower','apple','pear']);
  for (const level of levels) {
    for (const [answer, choices, cue = []] of level.puzzles) {
      for (const id of [answer, ...choices, ...cue]) if (typeof id === 'string') ids.add(id);
    }
  }
  for (const id of ids) assert.match(await readFile(new URL(`../assets/${id}.svg`, import.meta.url), 'utf8'), /<svg\b/);
});

test('sound is silent when off and uses local tones when enabled', () => {
  for (const event of ['try', 'yes', 'complete']) assert.deepEqual(notesFor(event, false), []);
  assert.deepEqual(notesFor('try', true), [392]);
  assert.deepEqual(notesFor('yes', true), [523, 659]);
  assert.deepEqual(notesFor('complete', true), [523, 659, 784]);
  assert.deepEqual(notesFor('unknown', true), []);
});
