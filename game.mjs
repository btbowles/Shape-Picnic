import { choose, createRound, current, nextLevel } from './rules.mjs?v=matching';
import { notesFor } from './sounds.mjs';

const byId = id => document.getElementById(id);
const target = byId('target');
const choices = byId('choices');
const progress = byId('progress');
const feedback = byId('feedback');
const finish = byId('finish');
const sound = byId('sound');
const replay = byId('replay');
let state = createRound();
let enabled = false;
let audio;

function tileName(tile, coloured) {
  if (!coloured) return tile.shape;
  return tile.colour === 'original' ? `Original-colour ${tile.shape}` : `${tile.colour} ${tile.shape}`;
}

function picture(tile, alt) {
  const img = document.createElement('img');
  img.src = `./assets/${tile.shape}.svg`;
  img.alt = alt;
  img.draggable = false;
  img.dataset.colour = tile.colour;
  img.style.rotate = `${tile.rotation}deg`;
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

function select(button, event) {
  state = choose(state, Number(button.dataset.choice));
  if (state.feedback === 'try') {
    for (const option of choices.children) delete option.dataset.retry;
    button.dataset.retry = '';
    feedback.textContent = 'Try another picture.';
    play('try');
    return;
  }
  play(state.phase === 'play' ? 'yes' : 'complete');
  render();
  if (state.phase !== 'play') replay.focus();
  else if (event.detail === 0) choices.firstElementChild.focus();
}

function render() {
  const playing = state.phase === 'play';
  byId('game').hidden = !playing;
  finish.hidden = playing;
  if (!playing) {
    const done = state.phase === 'complete';
    byId('finish-title').textContent = done ? 'Picnic complete!' : `Level ${state.level + 1} complete!`;
    replay.classList.toggle('next', !done);
    replay.querySelector('span').textContent = done ? 'Play again' : `Next level ${state.level + 2}`;
    return;
  }

  const puzzle = current(state);
  byId('level').textContent = `Level ${state.level + 1}`;
  target.replaceChildren(picture(puzzle.target, `Find the ${tileName(puzzle.target, puzzle.coloured)}`));
  choices.style.setProperty('--choices', Math.min(3, puzzle.choices.length));
  choices.replaceChildren(...puzzle.choices.map((tile, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.dataset.choice = index;
    button.setAttribute('aria-label', tileName(tile, puzzle.coloured));
    button.append(picture(tile, ''));
    button.addEventListener('click', event => select(button, event));
    return button;
  }));

  progress.setAttribute('aria-label', `${state.index} of ${puzzle.total} puzzles`);
  progress.replaceChildren();
  for (let i = 0; i < puzzle.total; i++) {
    const dot = document.createElement('span');
    dot.setAttribute('aria-hidden', 'true');
    if (i < state.index) dot.className = 'filled';
    progress.append(dot);
  }
  feedback.textContent = state.feedback === 'yes' ? 'You found it!' : '';
}

sound.addEventListener('click', () => {
  enabled = !enabled;
  sound.setAttribute('aria-pressed', String(enabled));
  sound.querySelector('span').textContent = enabled ? 'Sound on' : 'Sound off';
  play('yes');
});
replay.addEventListener('click', () => {
  state = state.phase === 'complete' ? createRound() : nextLevel(state);
  render();
  choices.firstElementChild.focus();
});
render();
