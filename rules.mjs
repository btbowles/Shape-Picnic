const shapes = ['triangle', 'apple', 'pear', 'star', 'square', 'circle'];
const palette = ['original', 'blue', 'green'];

export const levels = [
  { tiles: 2, colours: 1, turns: [0] },
  { tiles: 3, colours: 1, turns: [0] },
  { tiles: 3, colours: 2, turns: [0] },
  { tiles: 4, colours: 2, turns: [0] },
  { tiles: 4, colours: 2, turns: [90] },
  { tiles: 4, colours: 2, turns: [90, 180] },
  { tiles: 5, colours: 2, turns: [90, 180] },
  { tiles: 5, colours: 2, turns: [90, 180, 270] },
  { tiles: 6, colours: 2, turns: [90, 180, 270] },
  { tiles: 6, colours: 3, turns: [90, 180, 270] },
];
const total = 3;

export function createRound() {
  return { level: 0, index: 0, phase: 'play', feedback: '' };
}

export function current({ level, index }) {
  const { tiles, colours, turns } = levels[level];
  const turn = Math.min(index, total - 1);
  const rotation = turns[turn % turns.length];
  const shapeIndex = (level + turn) % shapes.length;
  const shape = shapes[shapeIndex];
  const colour = turn % colours;
  const target = { shape, colour: palette[colour], rotation: 0 };
  const choices = [];
  for (let i = 1; i < colours; i++) {
    choices.push({ shape, colour: palette[(colour + i) % colours], rotation });
  }
  for (let i = 1; choices.length < tiles - 1; i++) {
    choices.push({ shape: shapes[(shapeIndex + i) % shapes.length], colour: target.colour, rotation: turns[(turn + i) % turns.length] });
  }
  choices.splice((level + 1 + turn) % tiles, 0, { ...target, rotation });
  return { target, choices, total, coloured: colours > 1 };
}

export function choose(state, choiceIndex) {
  if (state.phase !== 'play') return state;
  const { target, choices, total } = current(state);
  const tile = choices[choiceIndex];
  if (tile?.shape !== target.shape || tile.colour !== target.colour) {
    return { ...state, feedback: 'try' };
  }
  const index = state.index + 1;
  const phase = index < total ? 'play' : state.level + 1 < levels.length ? 'ready' : 'complete';
  return { ...state, index, phase, feedback: 'yes' };
}

export function nextLevel(state) {
  if (state.phase !== 'ready') return state;
  return { ...createRound(), level: state.level + 1 };
}
