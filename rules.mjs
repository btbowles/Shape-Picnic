export const puzzles = [
  ['circle', ['triangle', 'circle']],
  ['square', ['square', 'circle']],
  ['triangle', ['circle', 'triangle']],
  ['apple', ['square', 'apple', 'triangle']],
  ['pear', ['pear', 'apple', 'circle']],
  ['star', ['pear', 'triangle', 'star']],
];

export function createRound() {
  return { index: 0, target: puzzles[0][0], choices: [...puzzles[0][1]], completed: false, feedback: '' };
}

export function choose(state, id) {
  if (state.completed) return state;
  if (id !== state.target) return { ...state, feedback: 'try' };

  const index = state.index + 1;
  if (index === puzzles.length) {
    return { index, target: null, choices: [], completed: true, feedback: 'yes' };
  }
  const [target, choices] = puzzles[index];
  return { index, target, choices: [...choices], completed: false, feedback: 'yes' };
}
