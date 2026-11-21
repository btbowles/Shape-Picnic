import test from 'node:test';
import assert from 'node:assert/strict';
import {boards} from '../ricochet/levels.mjs';
import {allShotsExit, solve, trace} from '../ricochet/engine.mjs';

test('identical launches leave a turning gate in opposite directions', () => {
  const board = {size: 3, ports: [[0,1],[3,1]], finish: [1,1], pieces: [[1,1,0,0]]};
  const one = trace(board, 0, 0);
  const two = trace(board, one.mask, 0);
  assert.equal(one.status, 'exit');
  assert.equal(two.status, 'finish');
  assert.equal(one.mask, 1);
  assert.equal(two.mask, 0);
  assert.deepEqual(one.steps.at(-1).point, [0,1.5]);
  assert.deepEqual(two.steps.at(-1).point, [3,1.5]);
});

test('fixed mirrors and bumpers never flip', () => {
  const board = {size: 3, ports: [[0,1],[3,1]], finish: [1,1], pieces: [[1,1,0]]};
  assert.equal(trace(board, 0, 0).slot, 1);
  assert.equal(trace(board, 1, 0).slot, 1);
  board.pieces = [[1,1,2]];
  const shot = trace(board, 3, 0);
  assert.equal(shot.slot, 0);
  assert.equal(shot.mask, 3);
});

test('ten levels have one solution using the full budget and no trapped shots', () => {
  assert.equal(boards.length, 10);
  let previous = 0;
  for (const [index,board] of boards.entries()) {
    assert.ok(board.balls >= previous && board.balls <= 4);
    previous = board.balls;
    assert.equal(allShotsExit(board), true, `Level ${index+1}`);
    const result = solve(board, board.balls);
    assert.equal(result.count, 1, `Level ${index+1}`);
    assert.equal(result.depth, board.balls);
    let mask = 0;
    for (const [i, launch] of result.solution.entries()) {
      const shot = trace(board, mask, launch);
      assert.equal(shot.status, i === board.balls-1 ? 'finish' : 'exit');
      mask = shot.mask;
      for (const [j, step] of shot.steps.entries()) {
        if (!j) continue;
        const [x,y] = step.point;
        const [px,py] = shot.steps[j-1].point;
        assert.ok((x === px) !== (y === py), `Shot segment is not axis-aligned: ${px},${py} → ${x},${y}`);
      }
    }
  }
});
