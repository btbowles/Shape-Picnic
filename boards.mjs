import { pattern } from './pattern.mjs?v=suite';

export const boards = {
  count: [
    [1, [1, 2, 3]], [2, [3, 2, 1]], [3, [1, 2, 3]],
  ],
  odd: [
    ['star', ['star', 'pear', 'pear']],
    ['pear', ['apple', 'pear', 'apple']],
    ['triangle', ['circle', 'circle', 'triangle']],
  ],
  pattern,
  more: [
    [2, [2, 0, 1]], [3, [1, 3, 2]], [4, [2, 3, 4]],
  ],
  size: [
    [1, [1, 2, 3]], [3, [2, 3, 1]], [1, [3, 2, 1]],
  ],
};
