export const chunkSize = 16;
export const limit = 2048;
export const catalog = {
  road: { name: 'Street', kind: 'route', color: '#77796e' },
  bike: { name: 'Bike path', kind: 'route', color: '#668377' },
  house: { name: 'Small house', kind: 'gable', height: 1.45, color: '#dcc4a1', roof: '#697b72', interior: 'study' },
  machiya: { name: 'Machiya townhouse', kind: 'gable', height: 2.4, color: '#c39169', roof: '#645451', interior: 'study' },
  ramen: { name: 'Ramen shop', kind: 'shop', height: 1.6, color: '#dbab82', roof: '#a45242', interior: 'ramen' },
  tea: { name: 'Tea room', kind: 'shop', height: 1.4, color: '#d8c3a1', roof: '#578178', interior: 'tea' },
  apartment: { name: 'Apartments', kind: 'tower', height: 3.8, color: '#a8b8ad', roof: '#607365' },
  skyscraper: { name: 'Skyscraper', kind: 'tower', height: 8.3, color: '#829eaa', roof: '#5a7683' },
  garden: { name: 'Pocket garden', kind: 'park', color: '#adad7e' },
  fountain: { name: 'Bamboo fountain', kind: 'park', color: '#a1aa78' },
  trees: { name: 'Cherry grove', kind: 'park', color: '#a0a875' },
  plaza: { name: 'Stone plaza', kind: 'park', color: '#c9bea6' },
};

export const variants = ['Classic', 'Indigo', 'Terracotta', 'Sage'];
export const cellKey = (x, z) => `${x},${z}`;
export const chunkKey = (x, z) => cellKey(Math.floor(x / chunkSize), Math.floor(z / chunkSize));
export const withinMap = (x, z) => Number.isInteger(x) && Number.isInteger(z) && Math.abs(x) < limit && Math.abs(z) < limit;
export const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function block(kind) {
  const urban = kind === 'downtown';
  const rows = urban
    ? ['apartment skyscraper apartment plaza', 'ramen tea apartment skyscraper', 'apartment garden machiya apartment']
    : ['machiya house trees machiya', 'ramen garden tea house', 'house fountain machiya house'];
  const pieces = rows.flatMap((row, z) => row.split(' ').map((type, x) => ({ type, x, z, rotation: z === 0 ? 2 : 0 })));
  for (let x = 0; x < 4; x++) {
    pieces.push({ type: 'road', x, z: 3 }, { type: 'bike', x, z: 4 });
  }
  return pieces.map(piece => ({ rotation: 0, variant: 0, ...piece }));
}

export function emptyStreet() {
  return {
    name: 'Untitled city',
    pieces: Array.from({ length: 10 }, (_, x) => ({ id: x + 1, x: x - 5, z: 0, type: 'road', rotation: 0, variant: 0 })),
  };
}

export function benchmarkCity() {
  const pieces = [];
  const residential = ['house', 'machiya', 'ramen', 'house', 'house', 'tea', 'machiya'];
  const mixed = ['machiya', 'house', 'apartment', 'ramen', 'house', 'apartment', 'tea'];
  const towers = ['apartment', 'skyscraper', 'apartment', 'ramen', 'skyscraper', 'tea', 'apartment'];
  let id = 1;
  for (let row = 0; row < 100; row++) for (let column = 0; column < 100; column++) {
    const x = column + Math.floor(column / 10) - 55;
    const z = row + Math.floor(row / 5) - 60;
    const pattern = column * 13 + row * 17;
    const distance = Math.hypot(column - 55, row - 46);
    const types = distance < 20 ? towers : distance < 36 ? mixed : residential;
    pieces.push({ id: id++, x, z, type: types[pattern % types.length], rotation: row % 2 * 2, variant: pattern % variants.length });
    if (row % 5 === 4) pieces.push({ id: id++, x, z: z + 1, type: row % 10 === 4 ? 'road' : 'bike', rotation: 0, variant: 0 });
    if (column % 10 === 9) {
      pieces.push({ id: id++, x: x + 1, z, type: 'road', rotation: 0, variant: 0 });
      if (row % 5 === 4) pieces.push({ id: id++, x: x + 1, z: z + 1, type: 'road', rotation: 0, variant: 0 });
    }
  }
  return { name: 'Higashi · 10,000 buildings', pieces };
}

export function createCity({ name, pieces }) {
  const cells = new Map();
  const chunks = new Map();
  const ids = new Map();
  const chunkVersions = new Map();
  const undo = [];
  const redo = [];
  let nextId = 1;
  let revision = 0;
  let cityName = name;
  let buildings = 0;
  const changed = new Set();

  function write(key, piece) {
    const before = cells.get(key);
    const { x, z } = piece ?? before;
    const section = chunkKey(x, z);
    const existing = chunks.get(section);
    if (before) {
      if (ids.get(before.id) === before) ids.delete(before.id);
      if (catalog[before.type].kind !== 'route') buildings--;
    }
    if (piece) {
      cells.set(key, piece);
      ids.set(piece.id, piece);
      if (existing) existing.set(key, piece);
      else chunks.set(section, new Map([[key, piece]]));
      if (catalog[piece.type].kind !== 'route') buildings++;
      nextId = Math.max(nextId, piece.id + 1);
    } else {
      cells.delete(key);
      existing.delete(key);
      if (!existing.size) chunks.delete(section);
    }
    if (chunks.has(section)) chunkVersions.set(section, revision);
    else chunkVersions.delete(section);
    changed.add(section);
    for (const [dx, dz] of directions) changed.add(chunkKey(x + dx, z + dz));
  }

  for (const piece of pieces) write(cellKey(piece.x, piece.z), piece);
  changed.clear();

  function apply(patch, side) {
    revision++;
    for (const change of patch) write(change.key, change[side]);
  }

  return {
    chunks, cells, changed, chunkVersions,
    byId: id => ids.get(id),
    get revision() { return revision; },
    get buildings() { return buildings; },
    get name() { return cityName; },
    set name(value) { cityName = value; },
    get canUndo() { return undo.length > 0; },
    get canRedo() { return redo.length > 0; },
    at: (x, z) => cells.get(cellKey(x, z)),
    edit(changes) {
      const patch = changes.map(({ x, z, piece }) => {
        const key = cellKey(x, z);
        return { key, before: cells.get(key), after: piece && { ...piece, x, z, id: piece.id ?? nextId++ } };
      }).filter(change => change.before || change.after);
      if (!patch.length) return;
      apply(patch, 'after');
      undo.push(patch);
      if (undo.length > 100) undo.shift();
      redo.length = 0;
    },
    undo() {
      const patch = undo.pop();
      if (!patch) return;
      apply(patch, 'before');
      redo.push(patch);
    },
    redo() {
      const patch = redo.pop();
      if (!patch) return;
      apply(patch, 'after');
      undo.push(patch);
    },
  };
}
