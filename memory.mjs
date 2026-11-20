export function newMemory(cards) {
  return { cards: [...cards], open: [], removed: [], turns: 0 };
}

export function flip(state, index) {
  const { cards, open, removed, turns } = state;
  if (!Number.isInteger(index) || index < 0 || index >= cards.length ||
      open.length === 2 || open.includes(index) || removed.includes(index)) {
    return state;
  }
  if (!open.length) return { ...state, open: [index] };

  const pair = [...open, index];
  if (cards[open[0]] === cards[index]) {
    return { ...state, open: [], removed: [...removed, ...pair], turns: turns + 1 };
  }
  return { ...state, open: pair, turns: turns + 1 };
}

export function hideMiss(state) {
  return state.open.length === 2 ? { ...state, open: [] } : state;
}
