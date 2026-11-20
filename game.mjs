import { choose, createRound, current, nextLevel } from './rules.mjs';
import { notesFor } from './sounds.mjs';

const byId = id => document.getElementById(id);
const target = byId('target');
const choices = byId('choices');
const progress = byId('progress');
const feedback = byId('feedback');
const finish = byId('finish');
const sound = byId('sound');
const replay = byId('replay');
const peek = byId('peek');
const prompts = {
  match: 'Tap the match!', odd: 'Find the different one!', count: 'Find the same number!',
  pattern: 'What comes next?', memory: 'Remember the picture!', more: 'Which has the most?',
  sequence: 'Tap them in order!', recall: 'Remember the order!',
};
const nameOf = id => id[0].toUpperCase() + id.slice(1);

let state = createRound();
let enabled = false;
let audio;
let showing = true;

function picture(id, alt) {
  const img = document.createElement('img');
  img.src = `./assets/${id}.svg`;
  img.alt = alt;
  img.draggable = false;
  return img;
}

function play(event) {
  const notes = notesFor(event, enabled);
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!notes.length || !Audio) return;

  try {
    audio ??= new Audio();
    void audio.resume().catch(() => {});
    notes.forEach((frequency, index) => {
      const start = audio.currentTime + 0.025 + index * 0.12;
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      tone.type = 'sine';
      tone.frequency.value = frequency;
      volume.gain.setValueAtTime(0, start);
      volume.gain.linearRampToValueAtTime(0.045, start + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      tone.connect(volume).connect(audio.destination);
      tone.start(start);
      tone.stop(start + 0.16);
    });
  } catch {
    // Audio support is optional.
  }
}

function snackGroup(count, id) {
  const group = document.createElement('span');
  group.className = 'snacks';
  for (let i = 0; i < count; i++) group.append(picture(id, ''));
  return group;
}

function select(button, event) {
  const previous = state;
  state = choose(state, Number(button.dataset.choice));
  if (state.feedback === 'try') {
    for (const option of choices.children) delete option.dataset.retry;
    button.dataset.retry = '';
    feedback.textContent = 'Try another picture.';
    play('try');
    return;
  }
  if (state.index !== previous.index) showing = true;
  play(state.phase === 'play' ? 'yes' : 'complete');
  render();
  if (state.phase !== 'play') replay.focus();
  else if (event.detail === 0) (choices.firstElementChild ?? peek).focus();
}

function renderCue({ mode, answer, cue }) {
  const memory = mode === 'memory' || mode === 'recall';
  const pattern = mode === 'pattern';
  const sequence = mode === 'sequence' || mode === 'recall';
  target.className = 'target';
  target.removeAttribute('aria-label');
  if (mode === 'match') {
    target.replaceChildren(picture(answer, `Find the ${answer}`));
  } else if (mode === 'count') {
    target.replaceChildren(snackGroup(answer, 'apple'));
    target.setAttribute('aria-label', `${answer} apples`);
  } else if (mode === 'odd' || mode === 'more') {
    target.classList.add('strip', 'example');
    if (mode === 'odd') {
      target.replaceChildren(picture('flower', ''), picture('flower', ''), picture('star', 'One different picture'));
    } else {
      target.replaceChildren(snackGroup(1, 'apple'), snackGroup(3, 'apple'));
      target.setAttribute('aria-label', 'Three apples are more than one');
    }
  } else if (memory && !showing) {
    target.replaceChildren(Object.assign(document.createElement('span'), { textContent: '?' }));
    target.setAttribute('aria-label', 'Picture hidden');
  } else {
    target.classList.toggle('strip', pattern || sequence);
    target.replaceChildren(...cue.map((id, i) => {
      const img = picture(id, nameOf(id));
      if (sequence && i < state.step) img.className = 'packed';
      return img;
    }));
    if (pattern) target.append(Object.assign(document.createElement('span'), { textContent: '?' }));
  }
  peek.hidden = !memory;
  peek.textContent = showing ? '✓ Ready' : '↶ Look again';
  return memory && showing;
}

function render() {
  const playing = state.phase === 'play';
  byId('game').hidden = !playing;
  finish.hidden = playing;
  if (!playing) {
    const done = state.phase === 'complete';
    byId('finish-title').textContent = done ? 'Picnic complete!' : `Level ${state.level + 1} complete!`;
    replay.querySelector('span').textContent = done ? 'Play again' : `Next level ${state.level + 2}`;
    return;
  }

  const puzzle = current(state);
  const { mode, total } = puzzle;
  byId('level').textContent = `Level ${state.level + 1} · ${puzzle.name}`;
  byId('prompt').textContent = prompts[mode];
  const studying = renderCue(puzzle);
  choices.hidden = studying;
  choices.style.setProperty('--choices', puzzle.choices.length);
  choices.replaceChildren(...(studying ? [] : puzzle.choices.map((id, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.dataset.choice = index;
    const visual = typeof id === 'number' ? snackGroup(id, 'pear') : picture(id, '');
    const label = typeof id === 'number' ? `${id} ${id === 1 ? 'pear' : 'pears'}` : nameOf(id);
    if (typeof id !== 'number' && puzzle.choices.indexOf(id) !== puzzle.choices.lastIndexOf(id)) {
      button.setAttribute('aria-label', `${label}, choice ${index + 1}`);
    } else button.setAttribute('aria-label', label);
    button.append(visual);
    button.addEventListener('click', event => select(button, event));
    return button;
  })));
  progress.setAttribute('aria-label', `${state.index} of ${total} puzzles`);
  progress.replaceChildren();
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('span');
    dot.setAttribute('aria-hidden', 'true');
    if (i < state.index) dot.className = 'filled';
    progress.append(dot);
  }
  feedback.textContent = state.feedback === 'yes' ? 'You found it!' : '';
}

peek.addEventListener('click', () => {
  showing = !showing;
  render();
  if (!showing) choices.firstElementChild.focus();
});

sound.addEventListener('click', () => {
  enabled = !enabled;
  sound.setAttribute('aria-pressed', String(enabled));
  sound.querySelector('span').textContent = enabled ? 'Sound on' : 'Sound off';
  play('yes');
});
replay.addEventListener('click', () => {
  state = state.phase === 'complete' ? createRound() : nextLevel(state);
  showing = true;
  render();
  (choices.firstElementChild ?? peek).focus();
});
render();
