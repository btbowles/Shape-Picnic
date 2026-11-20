import { boards } from './boards.mjs?v=suite';
import { newMemory, flip, hideMiss } from './memory.mjs?v=suite';

const games = {
  memory: ['Memory Pairs', 'Turn over two tiles!'],
  count: ['Snack Count', 'Find the same number!'],
  odd: ['Odd One Out', 'Find the different picture!'],
  pattern: ['Picnic Patterns', 'What comes next?'],
  more: ['More Snacks', 'Which bowl has the most?'],
  size: ['Big & Little', 'Pick the smallest!'],
};
const key = new URLSearchParams(location.search).get('game');
const id = Object.hasOwn(games, key) ? key : 'memory';
const [title, instruction] = games[id];
const $ = id => document.getElementById(id);
const board = $('board');
const cue = $('cue');
const feedback = $('feedback');
const replay = $('replay');
let memory;
let pending;
let position;

document.title = `${title} · Shape Picnic`;
$('title').textContent = title;

function picture(name, label = '') {
  const img = document.createElement('img');
  img.src = `./assets/${name}.svg`;
  img.alt = label;
  img.draggable = false;
  return img;
}

function snacks(number) {
  const group = document.createElement('span');
  group.className = 'snack-group';
  for (let i = 0; i < number; i++) group.append(picture('apple'));
  return group;
}

function textCue(text) {
  return Object.assign(document.createElement('span'), { textContent: text });
}

function tile(label, item, select) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'choice';
  button.setAttribute('aria-label', label);
  if (item) button.append(item);
  button.addEventListener('click', select);
  return button;
}

function finish(message) {
  $('play').hidden = true;
  $('finish').hidden = false;
  $('result').textContent = message;
  replay.focus();
}

function shuffle(cards) {
  for (let index = cards.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[swap]] = [cards[swap], cards[index]];
  }
  return cards;
}

function showMemory(index) {
  if (pending) return;
  const previous = memory;
  const next = flip(memory, index);
  if (previous === next) return;

  memory = next;
  if (next.turns === previous.turns) {
    feedback.textContent = '';
    drawMemory();
    return;
  }
  const pair = [previous.open[0], index];
  const matched = next.removed.length > previous.removed.length;
  feedback.textContent = matched ? 'A pair!' : 'Try another pair.';
  drawMemory(pair, previous.removed);
  pending = setTimeout(() => {
    pending = undefined;
    memory = hideMiss(memory);
    if (memory.removed.length === memory.cards.length) {
      finish(`All pairs found in ${memory.turns} turns!`);
    } else {
      drawMemory();
    }
  }, matched ? 650 : 950);
}

function drawMemory(open = memory.open, removed = memory.removed) {
  $('progress').textContent = `Turns: ${memory.turns}`;
  for (const [index, button] of [...board.children].entries()) {
    const faceUp = open.includes(index);
    const gone = removed.includes(index);
    button.disabled = gone;
    button.classList.toggle('removed', gone);
    button.classList.toggle('card-back', !faceUp);
    button.setAttribute('aria-label', faceUp ? `Tile ${index + 1}, ${memory.cards[index]}` : `Tile ${index + 1}, face down`);
    button.replaceChildren(...(faceUp && !gone ? [picture(memory.cards[index])] : []));
  }
}

function playChoice(button, value, answer, event) {
  if (value !== answer) {
    for (const choice of board.children) delete choice.dataset.retry;
    button.dataset.retry = '';
    feedback.textContent = 'Try another tile.';
    return;
  }
  position++;
  if (position === boards[id].length) {
    finish('You solved all three puzzles!');
  } else {
    drawPuzzle();
    feedback.textContent = 'You got it!';
    if (event.detail === 0) board.firstElementChild.focus();
  }
}

function drawPuzzle() {
  const [answer, options, run] = boards[id][position];
  $('prompt').textContent = id === 'size' && answer === 3 ? 'Pick the biggest!' : instruction;
  $('progress').textContent = `Puzzle ${position + 1} of ${boards[id].length}`;
  cue.replaceChildren();
  cue.removeAttribute('aria-label');
  if (id === 'count') {
    cue.append(snacks(answer));
    cue.setAttribute('aria-label', `${answer} snacks to match`);
  } else if (id === 'pattern') {
    cue.append(...run.map(shape => picture(shape, shape)), textCue('?'));
  } else if (id === 'odd') {
    const unique = picture('square');
    unique.className = 'example-picked';
    cue.append(picture('star'), unique, picture('star'));
  } else if (id === 'more') {
    const bigger = snacks(2);
    bigger.classList.add('example-picked');
    cue.append(snacks(1), bigger);
  } else if (id === 'size') {
    const small = picture('star');
    small.className = 'example-small';
    const big = picture('star');
    (answer === 1 ? small : big).classList.add('example-picked');
    cue.append(small, big);
  }

  const optionsUI = options.map((value, index) => {
    let label = `${value}, tile ${index + 1}`;
    let item = typeof value === 'string' ? picture(value) : snacks(value);
    if (id === 'size') {
      item = picture('pear');
      item.className = 'sized';
      item.style.setProperty('--size', ['37%', '62%', '89%'][value - 1]);
      label = ['Small pear', 'Medium pear', 'Big pear'][value - 1];
    } else if (typeof value === 'number') {
      label = `${value} ${value === 1 ? 'snack' : 'snacks'}`;
    }
    const button = tile(label, item, event => playChoice(button, value, answer, event));
    return button;
  });
  board.replaceChildren(...optionsUI);
}

function start() {
  $('play').hidden = false;
  $('finish').hidden = true;
  $('prompt').textContent = instruction;
  feedback.textContent = '';
  board.style.setProperty('--choices', 3);
  if (id === 'memory') {
    memory = newMemory(shuffle(['apple', 'apple', 'pear', 'pear', 'star', 'star']));
    board.replaceChildren(...memory.cards.map((_, index) => tile('', null, () => showMemory(index))));
    drawMemory();
  } else {
    position = 0;
    drawPuzzle();
  }
}

replay.addEventListener('click', () => {
  start();
  board.firstElementChild.focus();
});
start();
