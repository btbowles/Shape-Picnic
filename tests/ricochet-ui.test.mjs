import test from 'node:test';
import assert from 'node:assert/strict';
import {boards} from '../ricochet/levels.mjs';
import {solve} from '../ricochet/engine.mjs';

class Node {
  children = [];
  attributes = new Map();
  events = new Map();
  classList = {toggle() {}};
  style = {setProperty() {}};

  append(node) { this.children.push(node); node.parent = this; }
  replaceChildren(...nodes) { this.children = []; nodes.forEach(node => this.append(node)); }
  setAttribute(key, value) { this.attributes.set(key, String(value)); }
  getAttribute(key) { return this.attributes.get(key); }
  addEventListener(name, fn) { this.events.set(name, fn); }
  querySelector(selector) { return this.children.find(node => '#' + node.getAttribute('id') === selector); }
  remove() { this.parent.children = this.parent.children.filter(node => node !== this); }
}

test('animation tuning, auto-advance, stale callbacks, and final win', async t => {
  const elements = new Map(), frames = [], timers = new Map();
  const lookup = id => {
    if (!elements.has(id)) elements.set(id, new Node());
    return elements.get(id);
  };
  let nextTimer = 0;
  t.mock.method(globalThis, 'setTimeout', (fn, ms) => {
    timers.set(++nextTimer, {fn, ms});
    return nextTimer;
  });
  t.mock.method(globalThis, 'clearTimeout', id => { timers.delete(id); });
  globalThis.document = {
    getElementById: lookup, documentElement: new Node(), createElement: () => new Node(),
    createElementNS: () => new Node(), addEventListener() {}
  };
  globalThis.Option = Node;
  globalThis.requestAnimationFrame = fn => frames.push(fn);
  try {
    await import('../ricochet/play.mjs');
    const launch = index => lookup('launches').children[index].events.get('click')();
    const board = lookup('board');
    const gold = board.children.find(n => n.getAttribute('stroke') === '#ffc577');
    assert.ok(Math.abs(Number(gold.getAttribute('x2'))-Number(gold.getAttribute('x1'))-.52)<1e-9);

    launch(0);
    assert.ok(lookup('launches').children.every(button => button.disabled));
    frames.shift()(0);
    frames.shift()(100);
    const ball = board.querySelector('#ball');
    assert.equal(Number(ball.getAttribute('r')), boards[0].size * .017);
    assert.ok(Math.abs(Number(ball.getAttribute('cy'))-boards[0].size*1.26*.1)<1e-9);
    frames.shift()(20000);
    assert.match(lookup('message').textContent, /Level complete/i);

    const [advance] = timers.values();
    assert.equal(advance.ms, 1200);
    lookup('undo').onclick();
    assert.equal(timers.size, 0);
    advance.fn();
    assert.equal(lookup('level').value, '0');

    const finish = index => {
      launch(index);
      frames.shift()(0);
      frames.shift()(30000);
    };
    finish(0);
    const [id, next] = [...timers.entries()][0];
    timers.delete(id);
    next.fn();
    assert.equal(lookup('level').value, '1');

    const level = boards.length - 1;
    lookup('level').onchange({target:{value:String(level)}});
    for (const shot of solve(boards[level], boards[level].balls).solution) finish(shot);
    assert.match(lookup('message').textContent, /Circuit complete/i);
    assert.equal(timers.size, 0);
  } finally {
    delete globalThis.document;
    delete globalThis.Option;
    delete globalThis.requestAnimationFrame;
  }
});
