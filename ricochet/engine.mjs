const dx = [0, 1, 0, -1];
const dy = [-1, 0, 1, 0];

export function portPoint(size, [side, lane]) {
  return [[lane + .5, 0], [size, lane + .5], [lane + .5, size], [0, lane + .5]][side];
}

export function trace(board, mask, launch, record = true) {
  const { size, ports, finish, pieces } = board;
  const [side, lane] = ports[launch];
  const entry = portPoint(size, ports[launch]);
  let x = Math.floor(entry[0]), y = Math.floor(entry[1]);
  let d = side ^ 2;
  if (side === 0) y = -1;
  if (side === 3) x = -1;
  const steps = record ? [{ point: entry, mask }] : [];
  const visits = new Set();
  const tiles = new Map(pieces.map(([a,b,type,gate]) => [b * size + a, [type,gate]]));

  while (true) {
    const key = `${x},${y},${d},${mask}`;
    if (visits.has(key)) return { status: 'loop', mask, steps };
    visits.add(key);
    x += dx[d];
    y += dy[d];
    if (x < 0 || y < 0 || x >= size || y >= size) {
      const exit = [d, d % 2 === 0 ? x : y];
      if (record) steps.push({ point: portPoint(size, exit), mask });
      if (finish[0] === exit[0] && finish[1] === exit[1]) return { status: 'finish', mask, steps };
      const slot = ports.findIndex(p => p[0] === exit[0] && p[1] === exit[1]);
      if (slot >= 0) return { status: 'exit', slot, mask, steps };
      d ^= 2;
      continue;
    }
    const tile = tiles.get(y * size + x);
    if (!tile) continue;
    const [type, gate] = tile;
    const flip = gate === undefined ? 0 : (mask >> gate) & 1;
    d ^= type === 2 ? 2 : (type ^ flip) === 0 ? 1 : 3;
    if (gate !== undefined) mask ^= 1 << gate;
    if (record) steps.push({ point: [x + .5, y + .5], mask, type, gate });
  }
}

export function solve(board, limit) {
  let paths = new Map([[0, { count: 1, path: [] }]]);
  for (let depth = 1; depth <= limit; depth++) {
    const next = new Map();
    let count = 0, solution;
    for (const [mask, state] of paths) {
      for (let launch = 0; launch < board.ports.length; launch++) {
        const shot = trace(board, mask, launch, false);
        if (shot.status === 'loop') return { loop: true };
        const path = [...state.path, launch];
        if (shot.status === 'finish') {
          count += state.count;
          solution = path;
        } else {
          const prior = next.get(shot.mask);
          next.set(shot.mask, { count: state.count + (prior?.count ?? 0), path });
        }
      }
    }
    if (count) return { count, depth, solution };
    paths = next;
  }
  return { count: 0 };
}

export function allShotsExit(board) {
  const pending = new Set([0]), visited = new Set();
  for (const mask of pending) {
    visited.add(mask);
    for (let launch = 0; launch < board.ports.length; launch++) {
      const shot = trace(board, mask, launch, false);
      if (shot.status === 'loop') return false;
      if (shot.status === 'exit' && !visited.has(shot.mask)) pending.add(shot.mask);
    }
  }
  return true;
}
