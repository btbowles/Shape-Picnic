import { choose, createRound, puzzles } from './rules.mjs';
import { notesFor } from './sounds.mjs';

const byId = id => document.getElementById(id);
const target = byId('target');
const choices = byId('choices');
const progress = byId('progress');
const feedback = byId('feedback');
const finish = byId('finish');
const sound = byId('sound');
const replay = byId('replay');
const nameOf = id => id[0].toUpperCase() + id.slice(1);

let state = createRound();
let enabled = false;
let audio;

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

function select(button, event) {
  state = choose(state, button.dataset.choice);
  if (state.feedback === 'try') {
    for (const option of choices.children) delete option.dataset.retry;
    button.dataset.retry = '';
    feedback.textContent = 'Try another picture.';
    play('try');
    return;
  }
  play(state.completed ? 'complete' : 'yes');
  render();
  if (state.completed) replay.focus();
  else if (event.detail === 0) choices.firstElementChild.focus();
}

function render() {
  byId('game').hidden = state.completed;
  finish.hidden = !state.completed;
  if (state.completed) return;

  target.replaceChildren(picture(state.target, `Find the ${state.target}`));
  choices.style.setProperty('--choices', state.choices.length);
  choices.replaceChildren(...state.choices.map(id => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.dataset.choice = id;
    button.setAttribute('aria-label', nameOf(id));
    button.append(picture(id, ''));
    button.addEventListener('click', event => select(button, event));
    return button;
  }));
  progress.setAttribute('aria-label', `${state.index} of ${puzzles.length} matches`);
  progress.replaceChildren(...puzzles.map((_, index) => {
    const dot = document.createElement('span');
    dot.setAttribute('aria-hidden', 'true');
    if (index < state.index) dot.className = 'filled';
    return dot;
  }));
  feedback.textContent = state.feedback === 'yes' ? 'You found it!' : '';
}

sound.addEventListener('click', () => {
  enabled = !enabled;
  sound.setAttribute('aria-pressed', String(enabled));
  sound.querySelector('span').textContent = enabled ? 'Sound on' : 'Sound off';
  play('yes');
});
replay.addEventListener('click', () => {
  state = createRound();
  render();
  choices.firstElementChild.focus();
});
render();
