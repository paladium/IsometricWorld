import { catalog, cellKey, directions } from './model.js';

export function isWalkable(piece) {
  return piece && (catalog[piece.type].kind === 'route' || catalog[piece.type].kind === 'park');
}

// Match the front (+Z) used by the building renderer after rotating the lot.
export function approach(city, piece) {
  if (isWalkable(piece)) return piece;
  const [dx, dz] = [[0, 1], [1, 0], [0, -1], [-1, 0]][piece.rotation];
  const front = city.at(piece.x + dx, piece.z + dz);
  return isWalkable(front) ? front : null;
}

export function doorway(piece) {
  const angle = piece.rotation * Math.PI / 2;
  return {
    x: piece.x + (0.63 * Math.cos(angle) + 1.6 * Math.sin(angle)) / 4,
    z: piece.z + (1.6 * Math.cos(angle) - 0.63 * Math.sin(angle)) / 4,
  };
}

export function walkRoute(city, from, to) {
  const start = cellKey(from.x, from.z);
  const end = cellKey(to.x, to.z);
  const visited = new Map([[start, null]]);
  const queue = [from];
  for (let index = 0; index < queue.length; index++) {
    const { x, z } = queue[index];
    const key = cellKey(x, z);
    if (key === end) {
      const path = [];
      for (let at = key; at !== start; at = visited.get(at)) {
        const [x, z] = at.split(',').map(Number);
        path.push({ x, z });
      }
      return path.reverse();
    }
    for (const [dx, dz] of directions) {
      const neighbor = cellKey(x + dx, z + dz);
      if (visited.has(neighbor) || !isWalkable(city.at(x + dx, z + dz))) continue;
      visited.set(neighbor, key);
      queue.push({ x: x + dx, z: z + dz });
    }
  }
  return null;
}

export function duskBlock() {
  const pieces = [];
  function put(type, x, z, rotation = 0) {
    pieces.push({ id: pieces.length + 1, type, x, z, rotation, variant: 0 });
  }
  for (let x = -5; x <= 5; x++) {
    put('road', x, 0);
    put('bike', x, 1);
  }
  for (const [type, x] of [['house', -4], ['lantern', -3], ['garden', -2], ['bench', -1], ['ramen', 0], ['vending', 1], ['lantern', 2], ['tea', 3], ['machiya', 4]]) {
    put(type, x, -1);
  }
  for (const [type, x] of [['trees', -3], ['fountain', -1], ['plaza', 1], ['apartment', 3]]) put(type, x, 2, 2);
  return { name: 'Lantern Lane', pieces };
}
