import { catalog, cellKey, variants, withinMap } from './model.js';

const version = 1;
const maxPieces = 250_000;
const maxFile = 24_000_000;
const maxLink = 8000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
let database;

function openDatabase() {
  database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('komorebi-builder', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('city');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return database;
}

function pack(piece) {
  return [piece.id, piece.x, piece.z, piece.type, piece.rotation, piece.variant];
}

export function snapshot(city) {
  return { version, name: city.name, pieces: Array.from(city.cells.values(), pack) };
}

export function parseSnapshot(data) {
  if (data?.version !== version || typeof data.name !== 'string' || data.name.length > 60 ||
      !Array.isArray(data.pieces) || data.pieces.length > maxPieces) {
    throw new Error('This is not a supported Komorebi city.');
  }
  const occupied = new Set();
  const ids = new Set();
  const pieces = data.pieces.map(row => {
    if (!Array.isArray(row) || row.length !== 6) throw new Error('A lot in this city is invalid.');
    const [id, x, z, type, rotation, variant] = row;
    if (!Number.isSafeInteger(id) || id < 1 || id > 1e12 || ids.has(id) || !withinMap(x, z) ||
        !Object.hasOwn(catalog, type) || !Number.isInteger(rotation) || rotation < 0 || rotation > 3 ||
        !Number.isInteger(variant) || variant < 0 || variant >= variants.length || occupied.has(cellKey(x, z))) {
      throw new Error('A lot in this city is invalid or duplicated.');
    }
    occupied.add(cellKey(x, z));
    ids.add(id);
    return { id, x, z, type, rotation, variant };
  });
  return { name: data.name, pieces };
}

let savedCity;
let savedChunks = new Map();
let savedStamp;

export async function saveDraft(city) {
  const db = await openDatabase();
  const transaction = db.transaction('city', 'readwrite');
  const store = transaction.objectStore('city');
  const stamp = crypto.randomUUID?.() ?? String(Date.now()) + Math.random();
  let current;
  const manifest = store.get('manifest');
  manifest.onsuccess = () => {
    current = new Map(city.chunkVersions);
    const sameDraft = savedCity === city && manifest.result?.stamp === savedStamp;
    const baseline = sameDraft ? savedChunks : new Map();
    if (!sameDraft) store.clear();
    for (const key of baseline.keys()) if (!current.has(key)) store.delete(key);
    for (const [key, generation] of current) {
      if (baseline.get(key) === generation) continue;
      store.put(JSON.stringify(Array.from(city.chunks.get(key).values(), pack)), key);
    }
    store.put({ version, name: city.name, chunks: [...current.keys()], stamp }, 'manifest');
  };
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onabort = () => reject(transaction.error);
  });
  savedCity = city;
  savedChunks = current;
  savedStamp = stamp;
}

export async function readDraft() {
  const db = await openDatabase();
  const store = db.transaction('city').objectStore('city');
  const read = key => new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const manifest = await read('manifest');
  if (!manifest) return null;
  const chunks = await Promise.all(manifest.chunks.map(read));
  return parseSnapshot({ ...manifest, pieces: chunks.flatMap(chunk => JSON.parse(chunk)) });
}

export async function shareLink(city) {
  if (city.cells.size > 2000) return null;
  const stream = new Blob([JSON.stringify(snapshot(city))]).stream().pipeThrough(new CompressionStream('deflate'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  if (bytes.length > maxLink) return null;
  const url = new URL(location.href);
  url.hash = 'city=' + btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  return url.href.length <= maxLink ? url.href : null;
}

export async function readShared(hash) {
  if (!hash.startsWith('#city=')) return null;
  const encoded = hash.slice(6);
  if (encoded.length > maxLink || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('This city link is invalid.');
  const bytes = Uint8Array.from(atob(encoded.replaceAll('-', '+').replaceAll('_', '/')), character => character.charCodeAt(0));
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
  let text = '';
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 300_000) throw new Error('This city link is too large.');
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel();
  }
  return parseSnapshot(JSON.parse(text + decoder.decode()));
}

export async function importCity(file) {
  if (file.size > maxFile) throw new Error('This city file is too large.');
  return parseSnapshot(JSON.parse(await file.text()));
}

export function exportCity(city) {
  const url = URL.createObjectURL(new Blob([encoder.encode(JSON.stringify(snapshot(city)))], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = (city.name.replace(/[^\p{L}\p{N}-]+/gu, '-').replace(/^-|-$/g, '') || 'komorebi') + '.city.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
