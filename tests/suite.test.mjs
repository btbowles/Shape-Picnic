import test from 'node:test';
import assert from 'node:assert/strict';
import { flip, hideMiss, newMemory } from '../memory.mjs';
import { boards } from '../boards.mjs';

test('memory counts pairs of flips, ignores repeats, and locks a miss until hidden', () => {
  const initial = newMemory(['apple', 'pear', 'apple', 'pear']);
  assert.equal(flip(initial, 1.5), initial);
  const one = flip(initial, 0);
  assert.equal(one.turns, 0);
  assert.equal(flip(one, 0), one);
  const miss = flip(one, 1);
  assert.equal(miss.turns, 1);
  assert.equal(flip(miss, 2), miss);
  assert.deepEqual(hideMiss(miss).open, []);
  assert.equal(hideMiss(miss).turns, 1);

  const pair = flip(flip(hideMiss(miss), 0), 2);
  assert.deepEqual(pair.removed, [0, 2]);
  assert.equal(flip(pair, 2), pair);
  const done = flip(flip(pair, 1), 3);
  assert.equal(done.removed.length, 4);
  assert.equal(done.turns, 3);
  assert.deepEqual(initial, { cards: ['apple', 'pear', 'apple', 'pear'], open: [], removed: [], turns: 0 });
});

for (const id of ['count', 'odd', 'pattern', 'more', 'size']) {
  test(`${id} offers three puzzles with one solution each`, () => {
    assert.equal(boards[id].length, 3);
    const positions = new Set();
    for (const [i, [answer, choices, cue]] of boards[id].entries()) {
      assert.equal(choices.length, 3);
      assert.equal(choices.filter(value => value === answer).length, 1);
      positions.add(choices.indexOf(answer));
      if (id === 'count') assert.equal(answer, i + 1);
      if (id === 'odd') assert.equal(new Set(choices).size, 2);
      if (id === 'pattern') {
        assert.deepEqual(cue, [answer, cue[1], answer, cue[1]]);
        assert.notEqual(answer, cue[1]);
      }
      if (id === 'more') assert.equal(answer, Math.max(...choices));
      if (id === 'size') assert.equal(answer, [1, 3, 1][i]);
    }
    assert.equal(positions.size, 3);
  });
}
