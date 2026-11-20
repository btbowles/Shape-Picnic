export const levels = [
  { name: 'First bites', mode: 'match', puzzles: [
    ['circle', ['triangle','circle']], ['square', ['square','circle']], ['triangle', ['circle','triangle']],
  ] },
  { name: 'Fill the basket', mode: 'match', puzzles: [
    ['apple',['square','apple','triangle']], ['pear',['pear','apple','circle']], ['star',['pear','triangle','star']],
  ] },
  { name: 'One of a kind', mode: 'odd', puzzles: [
    ['pear',['apple','apple','pear']], ['star',['star','triangle','triangle']], ['square',['circle','square','circle']],
  ] },
  { name: 'Count the snacks', mode: 'count', puzzles: [
    [1,[2,1,3]], [2,[1,3,2]], [3,[3,2,1]],
  ] },
  { name: 'Picnic patterns', mode: 'pattern', puzzles: [
    ['apple',['pear','apple','star'],['apple','pear','apple','pear']],
    ['circle',['circle','star','square'],['circle','star','circle','star']],
    ['triangle',['square','circle','triangle'],['square','triangle','square']],
  ] },
  { name: 'Peek and pick', mode: 'memory', puzzles: [
    ['pear',['apple','pear','star'],['pear']], ['triangle',['triangle','square','circle'],['triangle']], ['apple',['pear','star','apple'],['apple']],
  ] },
  { name: 'Which has more?', mode: 'more', puzzles: [
    [3,[2,3,1]], [4,[4,2,3]], [5,[4,3,5]],
  ] },
  { name: 'Double patterns', mode: 'pattern', puzzles: [
    ['pear',['apple','pear','star'],['apple','apple','pear','apple','apple']],
    ['star',['triangle','circle','star'],['star','circle','circle','star','circle','circle']],
    ['circle',['circle','triangle','square'],['triangle','triangle','square','triangle','triangle','square','triangle','triangle']],
  ] },
  { name: 'Pack in order', mode: 'sequence', puzzles: [
    ['apple',['star','apple','pear'],['apple','pear']], ['square',['triangle','circle','square'],['square','circle']], ['pear',['apple','pear','star'],['pear','star','apple']],
  ] },
  { name: 'Picnic memory', mode: 'recall', puzzles: [
    ['pear',['apple','star','pear'],['pear','apple']], ['triangle',['circle','triangle','square'],['triangle','square','circle']], ['star',['star','pear','apple'],['star','pear','star']],
  ] },
];

export function createRound() {
  return { level: 0, index: 0, step: 0, phase: 'play', feedback: '' };
}

export function current(state) {
  const { name, mode, puzzles } = levels[state.level];
  const [answer, choices, cue = []] = puzzles[Math.min(state.index, puzzles.length - 1)];
  return { name, mode, answer, choices, cue, total: puzzles.length };
}

export function choose(state, choiceIndex) {
  if (state.phase !== 'play') return state;
  const { mode, answer, choices, cue, total } = current(state);
  const ordered = mode === 'sequence' || mode === 'recall';
  if (!Object.hasOwn(choices, choiceIndex) || choices[choiceIndex] !== (ordered ? cue[state.step] : answer)) {
    return { ...state, feedback: 'try' };
  }
  if (ordered && state.step + 1 < cue.length) {
    return { ...state, step: state.step + 1, feedback: 'yes' };
  }

  const index = state.index + 1;
  const phase = index < total ? 'play' : state.level + 1 < levels.length ? 'ready' : 'complete';
  return { ...state, index, step: 0, phase, feedback: 'yes' };
}

export function nextLevel(state) {
  if (state.phase !== 'ready') return state;
  return { ...createRound(), level: state.level + 1 };
}
