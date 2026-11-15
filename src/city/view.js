import * as THREE from 'three';
import { box, sphere, group } from '../components.js';
import { bicycle } from '../street.js';
import { catalog, cellKey, chunkKey, chunkSize, directions, limit } from './model.js';

const cellSize = 4;
const geometries = {
  box: new THREE.BoxGeometry(),
  roof: new THREE.CylinderGeometry(0.71, 0.71, 1, 3, 1).rotateY(Math.PI / 6).rotateX(Math.PI / 2),
  crown: new THREE.IcosahedronGeometry(0.5, 1),
  round: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
};
const material = new THREE.MeshStandardMaterial({ roughness: 0.87 });
const lanternMaterial = new THREE.MeshStandardMaterial({ roughness: 0.57, emissive: '#ffac44' });
const roofColors = [null, '#526478', '#aa5f49', '#648774'];

function drawPiece(piece, detail, add, city) {
  const { type, x, z, variant, rotation } = piece;
  const style = catalog[type];
  const angle = rotation * Math.PI / 2;
  function part(color, px, py, pz, w, h, d, shape = 'box', twist = 0) {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    add(shape, color, x * cellSize + px * c + pz * s, py, z * cellSize + pz * c - px * s, w, h, d, angle + twist);
  }
  if (style.kind === 'route') {
    const centerX = x * cellSize;
    const centerZ = z * cellSize;
    const width = type === 'bike' ? 1.2 : 2.8;
    add('box', style.color, centerX, 0.016, centerZ, width, 0.035, width, 0);
    for (const [dx, dz] of directions) {
      const adjacent = city.at(x + dx, z + dz);
      if (!adjacent || catalog[adjacent.type].kind !== 'route') continue;
      const length = (cellSize - width) / 2;
      const offset = width / 2 + length / 2;
      add('box', style.color, centerX + dx * offset, 0.016, centerZ + dz * offset, dx ? length : width, 0.035, dz ? length : width, 0);
      if (detail) add('box', '#dcd0ab', centerX + dx * offset, 0.038, centerZ + dz * offset, dx ? length * 0.65 : 0.055, 0.009, dz ? length * 0.65 : 0.055, 0);
    }
    return;
  }

  const roof = roofColors[variant] ?? style.roof ?? '#738769';
  part(style.kind === 'park' ? style.color : '#b7ab92', 0, 0.055, 0, 3.82, 0.11, 3.82);
  if (style.kind === 'fixture') {
    if (type === 'bench') {
      part(style.color, 0, 0.48, 0, 1.48, 0.12, 0.52);
      part(style.color, 0, 0.73, -0.22, 1.48, 0.29, 0.09);
      for (const x of [-0.55, 0.55]) part('#554c3e', x, 0.30, 0, 0.09, 0.32, 0.4);
    } else if (type === 'vending') {
      part(style.color, 0, 0.91, 0, 0.95, 1.6, 0.62);
      part('#eddfb1', 0, 1.16, 0.32, 0.72, 0.58, 0.06, 'glow');
      for (const x of [-0.22, 0, 0.22]) part('#738e79', x, 1.13, 0.36, 0.11, 0.26, 0.025);
      part('#503e35', 0, 0.48, 0.32, 0.48, 0.13, 0.045);
    } else {
      part('#655444', 0, 0.78, 0, 0.12, 1.35, 0.12);
      part('#ffe2a0', 0, 1.61, 0, 0.42, 0.4, 0.42, 'glow');
      part(style.color, 0, 1.85, 0, 0.56, 0.12, 0.56);
    }
    return;
  }
  if (style.kind === 'park') {
    if (type === 'plaza') {
      for (const offset of [-1.08, 0, 1.08]) part('#e3d7ba', offset, 0.114, 0, 0.92, 0.025, 3.45);
    } else {
      const blossom = type === 'trees' ? '#d3898d' : '#778e60';
      for (const offset of [-0.92, 0.96]) {
        part('#856249', offset, 0.44, -0.58, 0.18, 0.7, 0.18);
        part(blossom, offset, 1.02, -0.58, 1.46, 1.24, 1.35, 'crown');
      }
      for (const offset of [-1.05, -0.42, 0.28, 1.00]) part('#cec2a6', offset, 0.14, 1.0, 0.45, 0.08, 0.39, 'round');
      if (type === 'fountain') {
        part('#817e71', 0, 0.21, 0.13, 1.2, 0.28, 1.2, 'round');
        part('#568c86', 0, 0.36, 0.13, 1.0, 0.035, 1.0, 'round');
        part('#a0a568', -0.35, 0.57, 0.15, 0.105, 0.61, 0.105);
        part('#a0a568', -0.10, 0.86, 0.15, 0.62, 0.105, 0.105);
      }
    }
    return;
  }
  const h = style.height;
  const tall = style.kind === 'tower';
  const w = tall ? 2.43 : 3.02;
  part(style.color, 0, h / 2 + 0.10, -0.15, w, h, 2.48);
  if (style.kind === 'gable') {
    part(roof, 0, h + 0.30, -0.15, w + 0.24, 0.86, 2.35, 'roof', Math.PI / 2);
  } else {
    part(roof, 0, h + 0.13, -0.15, w + 0.24, 0.22, 2.67);
    if (tall) part(roof, 0, h + 0.36, -0.15, w * 0.59, 0.38, 1.47);
  }
  if (!detail) return;
  if (style.kind === 'shop') {
    part(roof, 0, 1.27, 1.27, 2.94, 0.12, 0.48);
    part('#edcd9a', -0.52, 1.48, 1.115, 1.45, 0.20, 0.08);
    for (const offset of [0.36, 0.65, 0.94]) part(roof, offset, 1.08, 1.47, 0.25, 0.37, 0.055);
  }
  if (!tall) part('#5f4b40', 0.63, 0.55, 1.105, 0.64, 0.89, 0.085);
  const floors = tall ? Math.floor(h / 0.69) : Math.floor(h / 0.93);
  for (let floor = 0; floor < floors; floor++) {
    const y = 0.72 + floor * (tall ? 0.65 : 0.90);
    part('#574f43', tall ? 0 : -0.53, y, 1.115, tall ? w - 0.4 : 1.24, 0.38, 0.085);
    part('#e2c69c', tall ? 0 : -0.53, y, 1.167, tall ? w - 0.6 : 1.05, 0.25, 0.014);
    part('#574f43', w / 2 + 0.024, y, -0.15, 0.06, 0.36, 1.44);
    part('#d2b58b', w / 2 + 0.059, y, -0.15, 0.015, 0.24, 1.27);
  }
}

export function createCityView(host, onPick, onZoom, onStep) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.07;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  host.append(renderer.domElement);
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'City map. Use arrows to pan, plus or minus to zoom, and Enter to select or build on the center lot.');
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 5200);
  const sun = new THREE.DirectionalLight('#ffe0ad', 2.4);
  const fill = new THREE.HemisphereLight('#fff3db', '#978875', 1.5);
  scene.add(sun, fill);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(16800, 16800), new THREE.MeshStandardMaterial({ color: '#c8c9ae' }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.015;
  scene.add(ground);
  const grid = new THREE.GridHelper(128, 32, '#8e947e', '#9fa38c');
  grid.position.y = 0.005;
  scene.add(grid);
  const hover = new THREE.Mesh(new THREE.BoxGeometry(3.96, 0.04, 3.96),
    new THREE.MeshBasicMaterial({ color: '#f4f1cb', transparent: true, opacity: 0.3, depthWrite: false }));
  hover.visible = false;
  scene.add(hover);
  const marker = new THREE.Mesh(new THREE.BoxGeometry(3.96, 0.07, 3.96),
    new THREE.MeshBasicMaterial({ color: '#eff0ad', transparent: true, opacity: 0.47, depthWrite: false }));
  marker.visible = false;
  scene.add(marker);

  const center = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const worldPoint = new THREE.Vector3();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
  const transform = new THREE.Object3D();
  const tint = new THREE.Color();
  const visible = new Map();
  const queued = [];
  const frustum = new THREE.Frustum();
  const projectionView = new THREE.Matrix4();
  const bounds = new THREE.Box3();
  const traffic = [];
  const avatar = group(scene);
  avatar.visible = false;
  const body = group(avatar);
  const legs = [-0.12, 0.12].map(x => {
    const leg = group(body, x, 0.32);
    box(leg, 0, -0.12, 0, 0.14, 0.27, 0.14, '#555b65');
    return leg;
  });
  box(body, 0, 0.51, 0, 0.38, 0.42, 0.27, '#bc6558', 0.04);
  box(body, 0, 0.50, -0.19, 0.29, 0.30, 0.12, '#ead2a1', 0.03);
  sphere(body, 0, 0.86, 0, 0.19, 0.21, 0.18, '#edbd8e', 2);
  sphere(body, 0, 0.96, -0.02, 0.195, 0.13, 0.182, '#4f4038', 2);
  for (const x of [-0.055, 0.055]) sphere(body, x, 0.87, 0.17, 0.018, 0.019, 0.015, '#4f4038');
  const drink = box(body, 0.27, 0.56, 0.14, 0.10, 0.17, 0.10, '#85ad7f', 0.02);
  drink.visible = false;
  const walkTarget = new THREE.Vector3();
  let route = [];
  let onArrival;
  let stride = 0;

  function updateWalker(delta) {
    if (!avatar.visible || !route.length) return;
    if (reducedMotion && route.length > 1) route = route.slice(-1);
    const step = route[0];
    walkTarget.set(step.x * cellSize, step.y ?? 0.12, step.z * cellSize);
    const distance = avatar.position.distanceTo(walkTarget);
    if (distance > 0.01) avatar.rotation.y = Math.atan2(walkTarget.x - avatar.position.x, walkTarget.z - avatar.position.z);
    if (reducedMotion || distance <= delta * 5) {
      avatar.position.copy(walkTarget);
      route.shift();
      if (!route.length) {
        legs.forEach(leg => { leg.rotation.x = 0; });
        const arrive = onArrival;
        onArrival = undefined;
        queueMicrotask(() => arrive?.());
      }
    } else {
      avatar.position.lerp(walkTarget, delta * 5 / distance);
      stride += delta * 13;
      legs.forEach((leg, index) => { leg.rotation.x = Math.sin(stride) * (index ? 0.65 : -0.65); });
    }
    center.set(avatar.position.x, 0.5, avatar.position.z);
    dirty = true;
  }
  const contactGeometry = new THREE.CircleGeometry(0.55, 14);
  const contactMaterial = new THREE.MeshBasicMaterial({ color: '#334438', transparent: true, opacity: 0.24, depthWrite: false });
  let city, lastRevision = -1, lastView = '', frame, lastTime = 0, dirty = true;
  let span = 61, width = 1, height = 1, streetTick = 0;
  let loadMs = 0, frameMs = 0;
  let currentLevel;
  let rendering = true;
  let selected;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointers = new Map();
  const streetLights = Array.from({ length: 4 }, () => {
    const light = new THREE.PointLight('#ffbd75', 0, 6.5, 2);
    scene.add(light);
    return light;
  });
  let dusk = 0;
  let lampCenter;

  function updateStreetLights() {
    const x = Math.round(center.x / cellSize);
    const z = Math.round(center.z / cellSize);
    const key = city.revision + ':' + x + ',' + z;
    const active = dusk > 0.15 && span < 90;
    if (!active) {
      streetLights.forEach(light => { light.intensity = 0; });
      lampCenter = undefined;
      return;
    }
    if (key !== lampCenter) {
      const nearest = [];
      for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) {
        if (city.at(x + dx, z + dz)?.type === 'lantern') {
          nearest.push({ x: x + dx, z: z + dz, distance: dx * dx + dz * dz });
        }
      }
      nearest.sort((a, b) => a.distance - b.distance);
      streetLights.forEach((light, index) => {
        const lantern = nearest[index];
        light.visible = Boolean(lantern);
        if (lantern) light.position.set(lantern.x * cellSize, 1.49, lantern.z * cellSize);
      });
      lampCenter = key;
    }
    streetLights.forEach(light => { light.intensity = dusk * 11; });
  }

  function disposeChunk(group) {
    group.traverse(object => { if (object.isInstancedMesh) object.dispose(); });
    group.removeFromParent();
  }

  function syncCamera() {
    const aspect = width / height;
    const vertical = span * Math.max(1, 0.84 / aspect);
    camera.left = -vertical * aspect / 2;
    camera.right = vertical * aspect / 2;
    camera.top = vertical / 2;
    camera.bottom = -vertical / 2;
    const reach = Math.max(100, span * 1.65);
    camera.position.copy(center).addScaledVector(new THREE.Vector3(0.62, 0.65, 0.62), reach);
    camera.far = reach * 2.3 + 90;
    camera.lookAt(center);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    frustum.setFromProjectionMatrix(projectionView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    grid.position.x = Math.round(center.x / cellSize) * cellSize - cellSize / 2;
    grid.position.z = Math.round(center.z / cellSize) * cellSize - cellSize / 2;
    grid.visible = !avatar.visible && span < 107;
    marker.scale.x = marker.scale.z = Math.max(1, span / 490);
  }

  function bake(key, overview) {
    const batches = new Map();
    const add = (shape, color, x, y, z, w, h, d, angle, id) => {
      if (!batches.has(shape)) batches.set(shape, []);
      batches.get(shape).push({ color, x, y, z, w, h, d, angle, id });
    };
    const pieces = city.chunks.get(key);
    if (overview) {
      const blocks = new Map();
      for (const piece of pieces.values()) {
        const { x, z, type } = piece;
        if (catalog[type].kind === 'route') {
          drawPiece(piece, false, add, city);
          continue;
        }
        const blockX = Math.floor(x / 4);
        const blockZ = Math.floor(z / 4);
        const key = cellKey(blockX, blockZ);
        const previous = blocks.get(key);
        const buildingHeight = catalog[type].height ?? 0.3;
        if (previous) {
          previous.height = Math.max(previous.height, buildingHeight);
          previous.count++;
        } else {
          blocks.set(key, { x: blockX, z: blockZ, height: buildingHeight, count: 1 });
        }
      }
      for (const block of blocks.values()) {
        const width = block.count > 9 ? 10.5 : block.count > 4 ? 8.8 : 5.5;
        const color = block.height > 5 ? '#829aa4' : block.height > 3 ? '#a1a894' : '#b7a28a';
        add('box', color, (block.x * 4 + 1.5) * cellSize, block.height / 2, (block.z * 4 + 1.5) * cellSize, width, block.height, width, 0);
      }
    } else {
      const detail = span < 118;
      for (const piece of pieces.values()) {
        drawPiece(piece, detail, (...args) => add(...args, piece.id), city);
      }
    }
    const group = new THREE.Group();
    for (const [shape, rows] of batches) {
      const mesh = new THREE.InstancedMesh(geometries[shape] ?? geometries.box, shape === 'glow' ? lanternMaterial : material, rows.length);
      mesh.userData.cells = rows.map(row => row.id);
      rows.forEach((row, i) => {
        transform.position.set(row.x, row.y, row.z);
        transform.rotation.set(0, row.angle, 0);
        transform.scale.set(row.w, row.h, row.d);
        transform.updateMatrix();
        mesh.setMatrixAt(i, transform.matrix);
        mesh.setColorAt(i, tint.set(row.color));
      });
      mesh.computeBoundingSphere();
      group.add(mesh);
    }
    scene.add(group);
    visible.set(key, group);
  }

  function syncChunks() {
    const start = performance.now();
    const size = cellSize * chunkSize;
    const radius = span * Math.max(width / height, 1.15) * 0.87 + size;
    const minX = Math.floor((center.x - radius) / size);
    const maxX = Math.floor((center.x + radius) / size);
    const minZ = Math.floor((center.z - radius) / size);
    const maxZ = Math.floor((center.z + radius) / size);
    const overview = span >= 240;
    const level = overview ? 'city' : span < 118 ? 'street' : 'district';
    const signature = [minX, maxX, minZ, maxZ, Math.floor(center.x / 16), Math.floor(center.z / 16), Math.floor(span / 10), level].join(',');
    if (lastView === signature && lastRevision === city.revision) return;
    const previousLevel = lastView.split(',').at(-1);
    for (const [key, group] of visible) {
      const [x, z] = key.split(',').map(Number);
      if (level !== previousLevel || city.changed.has(key) || x < minX || x > maxX || z < minZ || z > maxZ) {
        disposeChunk(group);
        visible.delete(key);
      }
    }
    queued.length = 0;
    currentLevel = level;
    for (const key of city.chunks.keys()) {
      if (visible.has(key)) continue;
      const [x, z] = key.split(',').map(Number);
      if (x < minX || x > maxX || z < minZ || z > maxZ) continue;
      bounds.min.set(x * size - size * 0.28, -0.1, z * size - size * 0.28);
      bounds.max.set((x + 1.28) * size, 11, (z + 1.28) * size);
      if (!frustum.intersectsBox(bounds)) continue;
      queued.push({ key, distance: Math.hypot((x + 0.5) * size - center.x, (z + 0.5) * size - center.z) });
    }
    queued.sort((a, b) => b.distance - a.distance);
    city.changed.clear();
    lastView = signature;
    lastRevision = city.revision;
    loadMs = performance.now() - start;
    if (!reducedMotion) seedTraffic();
  }

  function loadVisible() {
    if (!queued.length) return false;
    const start = performance.now();
    do {
      bake(queued.pop().key, currentLevel === 'city');
    } while (queued.length && performance.now() - start < 5);
    loadMs = Math.max(loadMs, performance.now() - start);
    if (!queued.length && !reducedMotion) seedTraffic();
    return true;
  }

  function seedTraffic() {
    for (const rider of traffic) {
      rider.node.visible = false;
      rider.contact.visible = false;
    }
    if (span >= 118) return;
    const centerX = center.x / cellSize;
    const centerZ = center.z / cellSize;
    const nearby = [];
    for (const key of visible.keys()) for (const piece of city.chunks.get(key).values()) {
      if (piece.type !== 'bike') continue;
      const { x, z } = piece;
      const neighbor = directions.find(([dx, dz]) => city.at(x + dx, z + dz)?.type === 'bike');
      if (neighbor) nearby.push({ x, z, neighbor, distance: Math.hypot(x - centerX, z - centerZ) });
    }
    nearby.sort((a, b) => a.distance - b.distance);
    const seeds = nearby.filter((start, index) => index % 3 === 0).slice(0, 7);
    seeds.forEach(({ x, z, neighbor: [dx, dz] }, i) => {
      if (!traffic[i]) {
        const bike = bicycle(scene, 0, 0, 0, i % 2 ? '#bc7159' : '#578a83', true);
        const contact = new THREE.Mesh(contactGeometry, contactMaterial);
        contact.rotation.x = -Math.PI / 2;
        contact.scale.set(1.26, 0.44, 1);
        scene.add(contact);
        traffic.push({ ...bike, contact });
      }
      Object.assign(traffic[i], { x, z, toX: x + dx, toZ: z + dz, t: i * 0.12 });
      traffic[i].node.visible = true;
      traffic[i].contact.visible = true;
    });
  }

  function animateTraffic(delta) {
    for (const rider of traffic) {
      if (!rider.node.visible) continue;
      rider.t += delta * 0.52;
      if (rider.t >= 1) {
        const previous = cellKey(rider.x, rider.z);
        rider.x = rider.toX;
        rider.z = rider.toZ;
        const choices = directions.filter(([dx, dz]) => city.at(rider.x + dx, rider.z + dz)?.type === 'bike');
        const next = choices.find(([dx, dz]) => cellKey(rider.x + dx, rider.z + dz) !== previous) ?? choices[0];
        if (!next) {
          rider.node.visible = rider.contact.visible = false;
          continue;
        }
        rider.toX = rider.x + next[0];
        rider.toZ = rider.z + next[1];
        rider.t -= 1;
      }
      const angle = Math.atan2(rider.z - rider.toZ, rider.toX - rider.x);
      const x = THREE.MathUtils.lerp(rider.x, rider.toX, rider.t) * cellSize;
      const z = THREE.MathUtils.lerp(rider.z, rider.toZ, rider.t) * cellSize;
      rider.node.position.set(x, 0.045, z);
      rider.node.rotation.y = angle;
      rider.contact.position.set(x, 0.052, z);
      rider.contact.rotation.z = angle;
      rider.wheels.forEach(wheel => { wheel.rotation.z -= delta * 5; });
    }
  }

  function loop(now) {
    frame = requestAnimationFrame(loop);
    const delta = Math.min((now - (lastTime || now)) / 1000, 0.05);
    lastTime = now;
    if (!rendering || !city || !host.clientWidth) return;
    updateWalker(delta);
    if (dirty) {
      syncCamera();
      syncChunks();
      updateStreetLights();
    }
    const loading = loadVisible();
    const animated = traffic.some(rider => rider.node.visible) && !reducedMotion;
    streetTick += delta;
    if (dirty || loading || (animated && streetTick >= 1 / 30)) {
      if (animated) animateTraffic(streetTick);
      const start = performance.now();
      renderer.render(scene, camera);
      frameMs = performance.now() - start;
      streetTick = 0;
    }
    dirty = false;
  }
  frame = requestAnimationFrame(loop);

  function resize() {
    width = host.clientWidth || 1;
    height = host.clientHeight || 1;
    renderer.setSize(width, height, false);
    dirty = true;
  }
  new ResizeObserver(resize).observe(host);

  function groundAt(clientX, clientY, target) {
    const bounds = canvas.getBoundingClientRect();
    mouse.set((clientX - bounds.left) / bounds.width * 2 - 1, 1 - (clientY - bounds.top) / bounds.height * 2);
    raycaster.setFromCamera(mouse, camera);
    return raycaster.ray.intersectPlane(groundPlane, target);
  }

  function pan(dx, dz) {
    center.x = THREE.MathUtils.clamp(center.x + dx, -limit * cellSize, limit * cellSize);
    center.z = THREE.MathUtils.clamp(center.z + dz, -limit * cellSize, limit * cellSize);
    dirty = true;
  }

  function zoom(value) {
    span = THREE.MathUtils.clamp(value, 14, 1280);
    hover.visible = false;
    onZoom(span);
    dirty = true;
  }

  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointers.size >= 2) return;
    for (const point of pointers.values()) point.moved = true;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: pointers.size > 0 });
    canvas.setPointerCapture(event.pointerId);
  });
  const before = new THREE.Vector3();
  const after = new THREE.Vector3();
  canvas.addEventListener('pointermove', event => {
    const point = pointers.get(event.pointerId);
    if (!point) {
      if (event.pointerType === 'mouse' && span < 240 && groundAt(event.clientX, event.clientY, worldPoint)) {
        hover.position.set(Math.round(worldPoint.x / cellSize) * cellSize, 0.065, Math.round(worldPoint.z / cellSize) * cellSize);
        hover.visible = true;
        dirty = true;
      }
      return;
    }
    if (hover.visible) {
      hover.visible = false;
      dirty = true;
    }
    if (pointers.size === 2) {
      const other = [...pointers.values()].find(value => value !== point);
      const first = Math.hypot(point.x - other.x, point.y - other.y);
      const second = Math.hypot(event.clientX - other.x, event.clientY - other.y);
      if (first > 8 && second > 8) zoom(span * first / second);
    } else {
      const distance = Math.hypot(event.clientX - point.startX, event.clientY - point.startY);
      if (point.moved || distance > 5) {
        if (groundAt(point.x, point.y, before) && groundAt(event.clientX, event.clientY, after)) pan(before.x - after.x, before.z - after.z);
        point.moved = true;
      }
    }
    point.x = event.clientX;
    point.y = event.clientY;
  });
  canvas.addEventListener('pointerup', event => {
    const point = pointers.get(event.pointerId);
    if (point && !point.moved && groundAt(event.clientX, event.clientY, worldPoint)) {
      onPick(Math.round(worldPoint.x / cellSize), Math.round(worldPoint.z / cellSize), () => {
        if (span >= 240) return undefined;
        const key = chunkKey(Math.round(worldPoint.x / cellSize), Math.round(worldPoint.z / cellSize));
        const [cx, cz] = key.split(',').map(Number);
        const nearby = [];
        for (let x = cx - 1; x <= cx + 1; x++) for (let z = cz - 1; z <= cz + 1; z++) {
          const group = visible.get(cellKey(x, z));
          if (group) nearby.push(group);
        }
        const hit = raycaster.intersectObjects(nearby, true)[0];
        return hit?.object.userData.cells[hit.instanceId];
      });
    }
    pointers.delete(event.pointerId);
  });
  for (const name of ['pointercancel', 'lostpointercapture']) canvas.addEventListener(name, event => pointers.delete(event.pointerId));
  canvas.addEventListener('pointerleave', () => {
    hover.visible = false;
    dirty = true;
  });
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    zoom(span * Math.exp(event.deltaY * 0.0012));
  }, { passive: false });
  canvas.addEventListener('keydown', event => {
    const steps = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    if (avatar.visible && steps[event.key]) {
      event.preventDefault();
      onStep(...steps[event.key]);
      return;
    }
    const movement = span / 14;
    const arrows = { ArrowUp: [-1, -1], ArrowDown: [1, 1], ArrowLeft: [-1, 1], ArrowRight: [1, -1] };
    if (arrows[event.key]) {
      event.preventDefault();
      pan(arrows[event.key][0] * movement, arrows[event.key][1] * movement);
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPick(Math.round(center.x / cellSize), Math.round(center.z / cellSize), () => undefined);
    }
    if (event.key === '+' || event.key === '=') zoom(span * 0.77);
    if (event.key === '-') zoom(span * 1.30);
  });

  return {
    setCity(value) {
      for (const group of visible.values()) disposeChunk(group);
      visible.clear();
      city = value;
      lampCenter = undefined;
      lastView = '';
      queued.length = 0;
      lastRevision = -1;
      center.set(0, 0, 0);
      zoom(61);
    },
    refresh() { dirty = true; },
    select(cell) {
      selected = cell;
      marker.visible = Boolean(selected);
      if (selected) marker.position.set(selected.x * cellSize, 0.09, selected.z * cellSize);
      dirty = true;
    },
    focus(cell, value) {
      center.set(cell.x * cellSize, 0, cell.z * cellSize);
      zoom(value);
    },
    zoom,
    startWalk(cell) {
      avatar.visible = true;
      avatar.rotation.y = 0;
      avatar.position.set(cell.x * cellSize, 0.12, cell.z * cellSize);
      drink.visible = false;
      canvas.setAttribute('aria-label', 'City walk. Tap a destination or use the arrow keys to follow connected streets.');
      this.centerWalker();
    },
    stopWalk() {
      avatar.visible = false;
      canvas.setAttribute('aria-label', 'City map. Use arrows to pan, plus or minus to zoom, and Enter to select or build on the center lot.');
      route = [];
      onArrival = undefined;
      body.position.y = 0;
      legs.forEach(leg => { leg.rotation.x = 0; });
      dirty = true;
    },
    walk(path, arrive) {
      body.position.y = 0;
      route = path;
      onArrival = arrive;
      if (!route.length) {
        onArrival = undefined;
        arrive();
      }
      dirty = true;
    },
    centerWalker() {
      center.set(avatar.position.x, 0.5, avatar.position.z);
      zoom(22);
    },
    rest(sitting, bench) {
      const angle = bench.rotation * Math.PI / 2;
      avatar.position.set(bench.x * cellSize + Math.sin(angle) * (sitting ? 0.24 : 1.55),
        sitting ? 0.29 : 0.12, bench.z * cellSize + Math.cos(angle) * (sitting ? 0.24 : 1.55));
      avatar.rotation.y = angle;
      this.centerWalker();
      body.position.y = 0;
      legs.forEach(leg => { leg.rotation.x = sitting ? -1.2 : 0; });
      dirty = true;
    },
    holdDrink() {
      drink.visible = true;
      dirty = true;
    },
    get span() { return span; },
    resume(value) {
      rendering = value;
      lastTime = 0;
      if (value) resize();
    },
    light(hour) {
      const angle = (hour - 6) * Math.PI / 12;
      const day = THREE.MathUtils.smoothstep(Math.sin(angle), -0.24, 0.42);
      scene.background = new THREE.Color('#28384a').lerp(new THREE.Color('#eae8d6'), day);
      sun.position.set(-Math.cos(angle) * 9, 2 + Math.max(0, Math.sin(angle)) * 12, 6);
      sun.intensity = 0.19 + day * 2.16;
      fill.intensity = 0.64 + day * 0.93;
      dusk = 1 - day;
      lanternMaterial.emissiveIntensity = dusk * 1.7;
      dirty = true;
    },
    metrics() {
      return { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, chunks: visible.size, loadMs, frameMs };
    },
  };
}
