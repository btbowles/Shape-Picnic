const rounds = [
  ['apple', 'pear'], ['pear', 'apple'], ['star', 'apple', 'pear'],
  ['apple', 'star', 'pear'], ['pear', 'star', 'apple'],
];
const $ = id => document.getElementById(id);
const field = $('catch-field');
const basket = $('basket');
const motion = $('motion');
const replay = $('replay');
const collected = [];
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;

function picture(id, alt = '') {
  return Object.assign(document.createElement('img'), {
    src: `./assets/${id}.svg`, alt, draggable: false,
  });
}

function setMotion() {
  field.classList.toggle('still', paused);
  motion.setAttribute('aria-pressed', String(paused));
  motion.textContent = paused ? 'Resume motion' : 'Pause motion';
}

function render() {
  const complete = collected.length === rounds.length;
  $('play').hidden = complete;
  $('finish').hidden = !complete;
  motion.hidden = complete;
  if (complete) {
    replay.focus();
    return;
  }

  const [target, ...other] = rounds[collected.length];
  other.splice((collected.length + 1) % (other.length + 1), 0, target);
  $('catch-target').replaceChildren(picture(target, `Catch the ${target}`));
  field.replaceChildren(...other.map(id => {
    const button = Object.assign(document.createElement('button'), { type: 'button', className: 'choice floater' });
    button.setAttribute('aria-label', id);
    button.append(picture(id));
    button.addEventListener('click', event => {
      if (id !== target) {
        $('feedback').textContent = 'Try another snack.';
        return;
      }
      collected.push(id);
      $('feedback').textContent = 'Into the basket!';
      render();
      if (event.detail === 0 && collected.length < rounds.length) field.firstElementChild.focus();
    });
    return button;
  }));

  basket.setAttribute('aria-label', `Basket: ${collected.length} of ${rounds.length} snacks`);
  basket.replaceChildren(...rounds.map((_, i) => {
    const slot = document.createElement('span');
    if (collected[i]) slot.append(picture(collected[i]));
    return slot;
  }));
}

motion.addEventListener('click', () => {
  paused = !paused;
  setMotion();
});
replay.addEventListener('click', () => {
  collected.length = 0;
  $('feedback').textContent = '';
  render();
  field.firstElementChild.focus();
});
setMotion();
render();
