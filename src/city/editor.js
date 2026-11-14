import './editor.css';
import { benchmarkCity, block, catalog, createCity, emptyStreet, variants, withinMap } from './model.js';
import { exportCity, importCity, readDraft, readShared, saveDraft, shareLink } from './storage.js';
import { createCityView } from './view.js';

export async function createEditor(root, enter) {
  const sharedLink = location.hash.startsWith('#city=');
  let shared;
  let restored;
  let warning;
  try {
    shared = await readShared(location.hash);
    if (!shared) restored = await readDraft();
  } catch (error) {
    warning = true;
  }

  root.innerHTML = `
    <div class="city-toolbar">
      <div><div class="control-label">CITY BUILDER</div><h1 id="city-heading">Build a city.</h1></div>
      <div class="city-toolbar-buttons">
        <button id="city-new">Empty street</button>
        <button id="city-benchmark">10,000-building map</button>
        <button id="city-load">Open draft</button>
      </div>
    </div>
    <div class="city-layout">
      <section class="city-stage" aria-label="City map">
        <div id="city-canvas"></div>
        <div class="city-map-tools">
          <div class="city-buttons" aria-label="Map scale">
            <button data-scale="420">City</button><button data-scale="145">District</button><button data-scale="48">Street</button>
            <button id="city-in" aria-label="Zoom in">+</button><button id="city-out" aria-label="Zoom out">−</button>
          </div>
          <label class="city-time">Time <input type="range" id="city-time" min="0" max="1439" value="975"><output id="city-clock">16:15</output></label>
        </div>
        <div class="city-map-caption"><span>Drag to pan · Pinch or scroll to zoom</span><span id="city-count"></span></div>
      </section>
      <aside class="city-panel" aria-label="City controls">
        <div class="city-panel-section">
          <label for="city-name" class="control-label">CITY NAME</label>
          <input id="city-name" maxlength="60">
          <div class="city-buttons">
            <button id="city-save">Save draft</button><button id="city-share">Share</button>
            <button id="city-export">Export</button><button id="city-import">Import</button>
            <input id="city-file" type="file" accept=".json,application/json" hidden>
          </div>
          <div id="city-share-box" hidden>
            <label for="city-link" class="control-label">SHARE LINK</label>
            <input id="city-link" readonly>
            <button id="city-copy-link">Copy link</button>
          </div>
        </div>
        <div class="city-panel-section">
          <div class="city-buttons">
            <button id="city-build" aria-pressed="true">Build</button><button id="city-explore" aria-pressed="false">Explore</button>
            <button id="city-copy-draft" hidden>Make an editable copy</button>
            <button id="city-undo" aria-label="Undo edit">Undo</button><button id="city-redo" aria-label="Redo edit">Redo</button>
          </div>
          <div id="city-palette">
            <label for="city-asset" class="control-label">PLACE ON AN EMPTY LOT</label>
            <select id="city-asset"></select>
            <label for="city-style" class="control-label">ROOF STYLE</label>
            <select id="city-style"></select>
            <div class="city-buttons">
              <button id="city-homes">Residential block</button><button id="city-downtown">Downtown block</button>
            </div>
          </div>
        </div>
        <div class="city-panel-section">
          <div id="city-selection" class="city-selection">Select an existing lot to inspect it.</div>
          <div class="city-buttons">
            <button id="city-enter">Enter</button>
            <button id="city-rotate">Rotate</button><button id="city-move">Move</button>
            <button id="city-remove">Remove</button><button id="city-duplicate">Duplicate block</button>
          </div>
        </div>
        <p id="city-status" role="status"></p>
        <details id="city-perf"><summary>Rendering metrics</summary><output id="city-metrics"></output></details>
      </aside>
    </div>
  `;

  const el = id => root.querySelector('#city-' + id);
  const asset = el('asset');
  const style = el('style');
  asset.add(new Option('Select lots', ''));
  for (const [key, item] of Object.entries(catalog)) asset.add(new Option(item.name, key));
  variants.forEach((name, index) => style.add(new Option(name, index)));

  let city;
  let locked = false;
  let building = true;
  let selection;
  let placement;
  let edited = false;
  let session = 0;
  let saving = false;
  const reportStatus = note => { el('status').textContent = note; };
  const view = createCityView(el('canvas'), handlePick, updateScale);

  function updateScale(span) {
    root.querySelectorAll('[data-scale]').forEach(button => {
      const scale = Number(button.dataset.scale);
      button.setAttribute('aria-pressed', String(scale === (span >= 240 ? 420 : span >= 118 ? 145 : 48)));
    });
  }

  function refresh() {
    const selected = selection && city.at(selection.x, selection.z);
    const type = selected && catalog[selected.type];
    const editable = !locked && building;
    el('count').textContent = city.buildings.toLocaleString() + ' buildings & spaces';
    el('name').readOnly = locked;
    el('build').disabled = locked;
    el('build').setAttribute('aria-pressed', String(editable));
    el('explore').setAttribute('aria-pressed', String(!building));
    el('copy-draft').hidden = !locked;
    el('save').disabled = locked || saving;
    el('undo').disabled = !editable || !city.canUndo;
    el('redo').disabled = !editable || !city.canRedo;
    el('palette').hidden = !editable;
    el('selection').textContent = type ? catalog[selected.type].name + ' · Lot ' + selected.x + ', ' + selected.z : 'Select an existing lot to inspect it.';
    el('enter').disabled = !type?.interior;
    for (const name of ['rotate', 'move', 'remove', 'duplicate']) el(name).disabled = !editable || !selected;
    view.select(selection);
    view.refresh();
  }

  function setCity(data, { readOnly = false, overview = false } = {}) {
    city = createCity(data);
    session++;
    locked = readOnly;
    building = !locked;
    selection = placement = undefined;
    edited = false;
    asset.value = '';
    style.value = '0';
    el('name').value = city.name;
    el('heading').textContent = city.name === 'Untitled city' ? 'Build a city.' : city.name;
    el('share-box').hidden = true;
    view.setCity(city);
    if (overview) {
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const { x, z } of city.cells.values()) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z);
      }
      view.focus({ x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 },
        Math.max(280, Math.max(maxX - minX, maxZ - minZ) * 5.2));
    }
    if (city.cells.size && !city.at(0, 0) && !overview) {
      const piece = city.cells.values().next().value;
      view.focus(piece, 61);
    }
    refresh();
  }

  function replaceCity(data, options) {
    if (edited && !confirm('Replace the current city and its unsaved edits?')) return false;
    if (location.hash.startsWith('#city=')) history.replaceState(null, '', location.pathname + location.search);
    setCity(data, options);
    return true;
  }

  function change(lots, note) {
    city.edit(lots);
    edited = true;
    el('share-box').hidden = true;
    reportStatus(note);
    refresh();
  }

  function handlePick(x, z, hit) {
    if (!withinMap(x, z)) return;
    const placing = building && (placement || asset.value);
    const hitId = placing ? undefined : hit();
    const hitPiece = hitId && city.byId(hitId);
    if (hitPiece) ({ x, z } = hitPiece);
    const target = city.at(x, z);
    if (view.span >= 240) {
      view.focus({ x, z }, 145);
      selection = target;
      refresh();
      return;
    }
    if (placement) {
      const targetLots = placement.pieces.map(piece => ({ x: x + piece.x, z: z + piece.z, piece }));
      if (targetLots.some(lot => !withinMap(lot.x, lot.z) || city.at(lot.x, lot.z))) {
        reportStatus('Choose an empty area for these lots.');
        return;
      }
      if (placement.origin) {
        const origin = city.at(placement.origin.x, placement.origin.z);
        if (origin?.id !== placement.origin.id) {
          placement = undefined;
          reportStatus('The original lot changed. Select it again.');
          return;
        }
        targetLots.push({ x: origin.x, z: origin.z, piece: null });
      }
      placement = undefined;
      selection = { x, z };
      change(targetLots, 'Placed.');
      return;
    }
    if (target) {
      selection = { x, z };
      style.value = String(target.variant);
      refresh();
      if (!building && catalog[target.type].interior) openInterior();
    } else if (building && asset.value) {
      selection = { x, z };
      change([{ x, z, piece: { type: asset.value, rotation: 0, variant: Number(style.value) } }], catalog[asset.value].name + ' placed.');
    } else {
      selection = undefined;
      refresh();
    }
  }

  function openInterior() {
    const piece = selection && city.at(selection.x, selection.z);
    if (!piece || !catalog[piece.type].interior) return;
    enter(catalog[piece.type].interior, `${session}:${piece.id}`, catalog[piece.type].name, Number(el('time').value));
  }

  function selectedEdit(edit) {
    const piece = selection && city.at(selection.x, selection.z);
    if (piece) edit(piece);
  }

  function arm(pieces, note, origin) {
    asset.value = '';
    placement = { pieces, origin };
    reportStatus(note);
  }

  function mode(value) {
    building = value;
    placement = undefined;
    asset.value = '';
    refresh();
  }

  function setTime(minutes) {
    el('time').value = minutes;
    el('clock').value = [Math.floor(minutes / 60), minutes % 60].map(value => String(value).padStart(2, '0')).join(':');
    view.light(minutes / 60);
  }

  asset.addEventListener('change', () => {
    placement = undefined;
    if (asset.value) reportStatus('Tap an empty lot to place ' + catalog[asset.value].name.toLowerCase() + '.');
    else reportStatus('Selection mode.');
  });
  style.addEventListener('change', () => {
    const variant = Number(style.value);
    if (building && !asset.value && !placement) selectedEdit(piece => {
      change([{ ...piece, piece: { ...piece, variant } }], 'Style updated.');
    });
  });
  el('build').onclick = () => mode(true);
  el('explore').onclick = () => mode(false);
  el('copy-draft').onclick = () => {
    setCity({ name: city.name, pieces: [...city.cells.values()] });
    history.replaceState(null, '', location.pathname + location.search);
    edited = true;
    reportStatus('Editable copy created. Save it as a draft when ready.');
  };
  el('enter').onclick = openInterior;
  el('in').onclick = () => view.zoom(view.span / 1.4);
  el('out').onclick = () => view.zoom(view.span * 1.4);
  root.querySelectorAll('[data-scale]').forEach(button => {
    button.onclick = () => view.zoom(Number(button.dataset.scale));
  });
  el('time').oninput = () => setTime(Number(el('time').value));
  el('rotate').onclick = () => selectedEdit(piece => change([{ ...piece, piece: { ...piece, rotation: (piece.rotation + 1) % 4 } }], 'Lot rotated.'));
  el('move').onclick = () => selectedEdit(piece => arm([{ ...piece, x: 0, z: 0 }], 'Tap an empty lot to move this piece.', piece));
  el('remove').onclick = () => selectedEdit(piece => {
    selection = undefined;
    placement = undefined;
    change([{ ...piece, piece: null }], 'Lot removed.');
  });
  el('homes').onclick = () => arm(block('homes'), 'Tap the corner of an empty 4 × 5 area.');
  el('downtown').onclick = () => arm(block('downtown'), 'Tap the corner of an empty 4 × 5 area.');
  el('duplicate').onclick = () => selectedEdit(piece => {
    const x = Math.floor(piece.x / 4) * 4;
    const z = Math.floor(piece.z / 4) * 4;
    const pieces = [];
    for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 4; dz++) {
      const source = city.at(x + dx, z + dz);
      if (source) pieces.push({ type: source.type, x: dx, z: dz, rotation: source.rotation, variant: source.variant });
    }
    arm(pieces, 'Tap the corner of an empty area to duplicate this 4 × 4 block.');
  });
  for (const key of ['undo', 'redo']) el(key).onclick = () => {
    city[key]();
    placement = undefined;
    edited = true;
    el('share-box').hidden = true;
    reportStatus(key === 'undo' ? 'Edit undone.' : 'Edit redone.');
    refresh();
  };
  el('name').oninput = () => {
    city.name = el('name').value;
    el('heading').textContent = city.name || 'Build a city.';
    el('share-box').hidden = true;
    edited = true;
  };
  el('new').onclick = () => {
    if (replaceCity(emptyStreet())) reportStatus('Choose a piece and tap an empty lot.');
  };
  el('benchmark').onclick = () => {
    if (replaceCity(benchmarkCity(), { overview: true })) {
      reportStatus('10,000 buildings loaded. Tap a district to zoom in.');
      el('perf').open = true;
    }
  };
  el('load').onclick = async () => {
    try {
      const draft = await readDraft();
      if (!draft) reportStatus('There is no saved draft on this browser yet.');
      else if (replaceCity(draft, { overview: draft.pieces.length > 2000 })) reportStatus('Saved draft loaded.');
    } catch (error) { reportStatus(error.message); }
  };
  el('save').onclick = async () => {
    const savingCity = city;
    const revision = city.revision;
    const name = city.name;
    saving = true;
    refresh();
    try {
      await saveDraft(city);
      if (city === savingCity) {
        if (city.revision === revision && city.name === name) edited = false;
        reportStatus('Draft saved in this browser.');
      }
    } catch {
      reportStatus('The browser could not save this draft. Export it to keep a copy.');
    } finally {
      saving = false;
      refresh();
    }
  };
  el('share').onclick = async () => {
    const sharing = city;
    const revision = city.revision;
    const name = city.name;
    try {
      const url = await shareLink(city);
      if (city !== sharing || city.revision !== revision || city.name !== name) return;
      if (!url) {
        reportStatus('This city is too large for a link. Export the city file to share it.');
        return;
      }
      el('link').value = url;
      el('share-box').hidden = false;
      el('link').focus();
      el('link').select();
      reportStatus('This link opens a snapshot in Explore mode.');
    } catch {
      reportStatus('A share link could not be created. Export the city file to share it.');
    }
  };
  el('copy-link').onclick = async () => {
    try {
      await navigator.clipboard.writeText(el('link').value);
      reportStatus('Share link copied.');
    } catch {
      el('link').focus();
      el('link').select();
      reportStatus('The link is selected. Copy it to share.');
    }
  };
  el('export').onclick = () => exportCity(city);
  el('import').onclick = () => el('file').click();
  el('file').onchange = async () => {
    const [file] = el('file').files;
    el('file').value = '';
    if (!file) return;
    try {
      const data = await importCity(file);
      if (replaceCity(data, { overview: data.pieces.length > 2000 })) {
        edited = true;
        reportStatus('City file imported.');
      }
    } catch (error) { reportStatus(error.message); }
  };

  setInterval(() => {
    if (root.hidden || !el('perf').open) return;
    const { calls, triangles, chunks, loadMs, frameMs } = view.metrics();
    el('metrics').textContent = `${chunks} chunks · ${calls} draw calls · ${triangles.toLocaleString()} triangles · ${loadMs.toFixed(1)} ms last chunk update · ${frameMs.toFixed(1)} ms render submit`;
  }, 500);
  setCity(shared || restored || emptyStreet(), { readOnly: Boolean(shared), overview: (shared || restored)?.pieces.length > 2000 });
  setTime(975);
  if (warning) reportStatus(sharedLink ? 'This city link could not be opened.' : 'The saved draft could not be read.');
  else if (shared) reportStatus('Shared city. Explore it or make your own editable copy.');
  return {
    resume(active) { view.resume(active); },
    time: () => Number(el('time').value),
    setTime,
  };
}
