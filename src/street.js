import { toggle, transition } from './animation.js';
import { extendStreet } from './neighborhood.js';
import * as THREE from 'three';
import { beam, box, cylinder, framedWindow, group, lantern, material, mesh, palette as p, planter, random, sign, sphere } from './components.js';

function awning(parent, x, y, z, width, rotation = 0) {
  const mount = group(parent, x, y, z, rotation);
  const canopy = group(mount, 0, 0, 0.38);
  canopy.rotation.x = 0.24;
  box(canopy, 0, 0, 0, width, 0.085, 0.83, p.teal, 0.02);
  const sections = Math.round(width / 0.13);
  for (let i = 0; i < sections; i++) {
    const x = ((i + 0.5) / sections - 0.5) * width;
    const shade = ['#468477', '#4a897d', '#3d786e', '#50897e'][i % 4];
    box(canopy, x, 0.046, 0, width / sections - 0.014, 0.032, 0.82, shade, 0.01);
    box(canopy, x, -0.065, 0.419, width / sections - 0.012, 0.15, 0.055, shade, 0.016);
  }
}

const leafGeometry = new THREE.IcosahedronGeometry(1, 1);

function tree(parent, x, z, scale, seed, colors = ['#547444', '#63834a', '#748e50', '#8da15b', '#a0ae65', '#6b8a51']) {
  const node = group(parent, x, 0.02, z);
  node.scale.setScalar(scale);
  cylinder(node, 0, 0.12, 0, 0.68, 0.57, 0.24, '#a39477', 9);
  cylinder(node, 0, 0.248, 0, 0.61, 0.61, 0.028, '#6d5c42', 9);
  const bark = '#79573c';
  beam(node, [-0.10, 0.22, 0], [0.13, 1.58, -0.11], 0.16, bark);
  beam(node, [0.13, 1.53, -0.11], [0.43, 2.52, -0.25], 0.11, bark);
  beam(node, [0.07, 1.29, -0.08], [-0.62, 2.16, 0.08], 0.095, bark);
  beam(node, [0.20, 1.72, -0.13], [0.36, 2.25, 0.53], 0.076, bark);
  const rng = random(seed);
  const clusters = [[0.15, 2.82, -0.15, 1.03], [-0.61, 2.48, 0.11, 0.71], [0.67, 2.58, 0.22, 0.82], [0.03, 2.66, -0.68, 0.80], [0.13, 2.42, 0.63, 0.69]];
  const transforms = colors.map(() => []);
  const leaf = new THREE.Object3D();
  for (const [cx, cy, cz, size] of clusters) {
    sphere(node, cx, cy, cz, size, size * 0.75, size, colors[1], 2);
    for (let i = 0; i < 19; i++) {
      const angle = rng() * Math.PI * 2;
      const v = rng() * 1.75 - 0.68;
      const r = size * Math.sqrt(Math.max(0, 1 - v * v)) * (0.77 + rng() * 0.23);
      const s = size * (0.16 + rng() * 0.22);
      leaf.position.set(cx + Math.cos(angle) * r, cy + v * size * 0.76, cz + Math.sin(angle) * r);
      leaf.scale.set(s, s * 0.80, s);
      leaf.rotation.y = angle;
      leaf.updateMatrix();
      transforms[Math.floor(rng() * colors.length)].push(leaf.matrix.clone());
    }
  }
  transforms.forEach((matrices, i) => {
    if (!matrices.length) return;
    const leaves = new THREE.InstancedMesh(leafGeometry, material(colors[i]), matrices.length);
    matrices.forEach((matrix, index) => leaves.setMatrixAt(index, matrix));
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    node.add(leaves);
  });
}

function bicycle(parent, x, z, rotation, color = '#cb9342', rider = false) {
  const node = group(parent, x, 0.017, z, rotation);
  const tire = '#363833', chrome = '#c7b994';
  const wheels = [];
  const left = [-0.64, 0.41, 0], right = [0.64, 0.41, 0];
  for (const center of [left, right]) {
    const wheel = group(node, ...center);
    wheels.push(wheel);
    mesh(wheel, new THREE.TorusGeometry(0.395, 0.034, 8, 30), tire, 0, 0, 0);
    mesh(wheel, new THREE.TorusGeometry(0.373, 0.014, 6, 30), chrome, 0, 0, 0);
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      beam(wheel, [0, 0, 0], [Math.sin(a) * 0.368, Math.cos(a) * 0.368, 0], 0.006, chrome);
    }
    sphere(node, ...center, 0.039, 0.039, 0.04, chrome);
  }
  const seat = [-0.24, 0.97, 0], pedal = [-0.09, 0.41, 0], stem = [0.43, 0.91, 0];
  for (const [a, b] of [[left, seat], [left, pedal], [seat, pedal], [seat, stem], [pedal, stem], [stem, right]]) beam(node, a, b, 0.024, color);
  beam(node, stem, [0.42, 1.13, 0], 0.024, chrome);
  beam(node, [0.42, 1.13, -0.19], [0.42, 1.13, 0.19], 0.022, tire);
  box(node, -0.27, 0.995, 0, 0.22, 0.065, 0.14, tire, 0.025);
  box(node, 0.57, 0.99, 0, 0.31, 0.18, 0.37, '#887058', 0.04);
  if (rider) {
    beam(node, [-0.25, 1.02, 0], [-0.08, 1.49, 0], 0.13, color);
    sphere(node, 0.01, 1.65, 0, 0.115, 0.135, 0.115, '#cc9773', 2);
    sphere(node, -0.009, 1.72, 0, 0.13, 0.09, 0.125, '#dfc693');
    for (const z of [-0.12, 0.12]) {
      beam(node, [-0.07, 1.43, z * 0.8], [0.42, 1.13, z], 0.048, color);
      beam(node, [-0.24, 1.06, z], [0.05, 0.81, z], 0.058, '#515b59');
      beam(node, [0.05, 0.81, z], [-0.08, 0.49, z], 0.05, '#515b59');
    }
  }
  return { node, wheels };
}

function condenser(parent, x, y, z, rotation = 0) {
  const node = group(parent, x, y, z, rotation);
  box(node, 0, 0, 0, 0.7, 0.42, 0.29, '#ceccba', 0.03);
  const fan = cylinder(node, -0.12, 0, 0.151, 0.14, 0.14, 0.023, '#675f51', 18);
  fan.rotation.x = Math.PI / 2;
  const grille = mesh(node, new THREE.TorusGeometry(0.114, 0.011, 6, 16), '#a5a294', -0.12, 0, 0.174);
  grille.castShadow = false;
  const rotor = group(node, -0.12, 0, 0.169);
  for (let i = 0; i < 4; i++) {
    const blade = group(rotor);
    blade.rotation.z = i * Math.PI / 2;
    box(blade, 0, 0.065, 0, 0.058, 0.116, 0.011, '#bcbba8', 0.005).rotation.z = -0.23;
  }
  const led = new THREE.MeshStandardMaterial({ color: '#87b875', emissive: '#83cf69', emissiveIntensity: 1 });
  sphere(node, 0.25, 0.13, 0.161, 0.022, 0.022, 0.01, led);
  for (let i = 0; i < 5; i++) box(node, 0.19, (i - 2) * 0.043, 0.158, 0.18, 0.014, 0.017, '#888676');
  return { node, rotor, led };
}

export function buildStreet(parent, lights) {
  const root = group(parent);
  const ambientMotion = extendStreet(root, lights, tree, bicycle);
  box(root, -0.15, -0.152, -0.18, 8.65, 0.25, 7.88, '#a49c84', 0.055);
  const rng = random(255);
  const tiles = ['#bdb29b', '#b5ac97', '#b3a993', '#c0b79e', '#b6af9c'];
  for (let row = 0; row < 12; row++) for (let col = 0; col < 13; col++) {
    box(root, (col - 6) * 0.657 - 0.15, -0.047, (row - 5.5) * 0.648 - 0.18, 0.641, 0.096, 0.631, tiles[Math.floor(rng() * tiles.length)]);
  }
  for (let i = 0; i < 13; i++) {
    box(root, (i - 6) * 0.664 - 0.15, -0.095, 3.79, 0.657, 0.23, 0.19, '#ccc1a7', 0.018);
    box(root, 4.18, -0.095, (i - 6) * 0.596 - 0.16, 0.19, 0.23, 0.588, '#c7bba0', 0.016);
  }
  box(root, 2.96, -0.206, 4.04, 0.62, 0.04, 0.28, '#716d5c');
  for (let i = 0; i < 10; i++) box(root, 2.70 + i * 0.057, -0.18, 4.04, 0.02, 0.016, 0.23, '#474842');

  const shop = group(root, -0.35, 0, -0.54);
  box(shop, 0, 0.15, 0, 4.35, 0.30, 3.91, '#968772', 0.045);
  box(shop, 0, 1.40, -0.47, 4.21, 2.54, 2.81, '#ccbea0', 0.035);
  box(shop, -0.61, 1.40, 1.38, 2.99, 2.54, 0.99, '#ccbea0');
  box(shop, 1.91, 1.40, 1.38, 0.40, 2.54, 0.99, '#ccbea0');
  box(shop, 1.29, 2.36, 1.38, 0.82, 0.62, 0.99, '#ccbea0');
  box(shop, 1.30, 1.14, 0.96, 0.82, 1.87, 0.04, '#4e4133');
  box(shop, 0, 3.80, 0, 4.21, 2.39, 3.75, '#e8d8b9', 0.035);
  for (const y of [2.67, 4.97]) box(shop, 0, y, 0, 4.38, 0.16, 3.93, p.trim, 0.025);
  box(shop, 0, 5.02, 0, 4.19, 0.095, 3.72, '#91928b', 0.025);
  for (const x of [-2.08, 2.08]) box(shop, x, 5.13, 0, 0.19, 0.27, 3.88, '#b19872', 0.02);
  for (const z of [-1.88, 1.88]) box(shop, 0, 5.13, z, 4.32, 0.27, 0.17, '#b19872', 0.02);
  for (const x of [-0.78, 0.03]) {
    const unit = group(shop, x, 5.11, -1.29);
    box(unit, 0, 0.145, 0, 0.72, 0.29, 0.53, '#a5a8a2', 0.035);
    cylinder(unit, 0, 0.30, 0, 0.194, 0.194, 0.025, '#4f544e', 18);
    for (let j = 0; j < 5; j++) box(unit, (j - 2) * 0.064, 0.32, 0, 0.010, 0.018, 0.28, '#8c9186').rotation.y = 0.24;
  }
  for (const x of [1.30, 1.63]) {
    cylinder(shop, x, 5.18, -0.44, 0.103, 0.103, 0.32, '#d0c2a8', 10);
    cylinder(shop, x, 5.35, -0.44, 0.137, 0.137, 0.055, '#b7aa90', 10);
  }
  const windowGlow = new THREE.MeshStandardMaterial({ color: '#d6c5a0', emissive: '#ff9f45', emissiveIntensity: 0.15, roughness: 0.85 });
  lights.push({ glow: windowGlow });
  framedWindow(shop, -0.27, 3.81, 1.896, 2.72, 1.55, { pane: windowGlow, rows: 12 });
  framedWindow(shop, 2.126, 3.80, 0.01, 2.63, 1.51, { rotation: Math.PI / 2, pane: windowGlow, columns: 3, rows: 11 });
  framedWindow(shop, -0.77, 1.32, 1.899, 1.88, 1.18, { pane: windowGlow, rows: 4 });
  framedWindow(shop, 2.13, 1.33, 0.65, 1.67, 1.20, { rotation: Math.PI / 2, pane: windowGlow, rows: 8 });
  framedWindow(shop, 2.13, 1.33, -0.91, 0.74, 1.20, { rotation: Math.PI / 2, pane: windowGlow, rows: 7 });
  const ac = condenser(shop, 2.151, 4.30, -1.46, Math.PI / 2);
  for (const x of [0.89, 1.69]) box(shop, x, 1.15, 1.95, 0.07, 1.85, 0.14, p.dark, 0.02);
  box(shop, 1.29, 2.06, 1.95, 0.88, 0.087, 0.14, p.dark, 0.01);
  const door = group(shop, 0.93, 0.22, 1.99);
  box(door, 0.36, 0.90, 0, 0.72, 1.78, 0.065, '#906c4c', 0.025);
  box(door, 0.36, 1.18, 0.04, 0.49, 1.04, 0.02, windowGlow);
  for (const y of [0.84, 1.18, 1.51]) box(door, 0.36, y, 0.059, 0.50, 0.024, 0.025, p.trim);
  sphere(door, 0.61, 0.80, 0.07, 0.042, 0.042, 0.042, '#dab176');
  box(shop, 1.28, 0.11, 2.16, 1.12, 0.22, 0.47, '#938675', 0.026);
  sign(shop, 1.28, 2.29, 2.008, 0.95, 0.29, '喫茶 木漏れ日', '#885345', '#f2dfb5');
  awning(shop, -0.78, 2.57, 1.97, 2.47);
  awning(shop, 2.16, 2.57, 0.0, 3.48, Math.PI / 2);

  const balcony = group(shop, 2.31, 3.01, 0.27, Math.PI / 2);
  box(balcony, 0, 0, 0, 2.60, 0.13, 0.53, p.trim, 0.022);
  for (let i = 0; i < 14; i++) box(balcony, (i - 6.5) * 0.184, 0.24, 0.26, 0.052, 0.43, 0.06, '#a88961', 0.011);
  box(balcony, 0, 0.46, 0.26, 2.65, 0.075, 0.08, p.trim, 0.017);
  planter(balcony, -0.97, 0.08, 0.09, 0.66, 11);
  planter(balcony, 0.85, 0.08, 0.10, 0.61, 90);
  planter(shop, -1.86, 0, 2.48, 1.08, 16);
  planter(shop, -0.72, 0, 2.88, 0.91, 65);
  planter(shop, -1.45, 0.42, 2.55, 0.68, 44);
  box(shop, -1.28, 0.22, 2.56, 0.87, 0.42, 0.37, p.trim, 0.04);
  lantern(shop, lights, 0.62, 1.67, 2.07, 0.57, 9);

  const bench = group(shop, 2.91, 0, 0.42, Math.PI / 2);
  for (let i = 0; i < 4; i++) box(bench, 0, 0.37, (i - 1.5) * 0.103, 1.42, 0.065, 0.093, '#b38756', 0.018);
  for (let i = 0; i < 3; i++) box(bench, 0, 0.54 + i * 0.115, -0.23, 1.42, 0.085, 0.055, '#b38756', 0.016);
  for (const x of [-0.51, 0.51]) {
    box(bench, x, 0.18, 0.13, 0.08, 0.36, 0.08, p.dark);
    box(bench, x, 0.38, -0.23, 0.08, 0.76, 0.08, p.dark);
  }
  const board = group(root, 0.83, 0.03, 3.25, -0.16);
  beam(board, [0, 0.82, 0], [0, 0.02, -0.30], 0.035, p.trim);
  sign(board, 0, 0.46, 0, 0.48, 0.68, 'MENU', '#78835e', '#f1e3be');
  const pole = group(root, -3.54, 0, 2.02);
  cylinder(pole, 0, 1.63, 0, 0.043, 0.053, 3.26, '#464b40');
  for (const [y, label, c, w] of [[3.03, '珈琲', '#d7a552', 0.49], [2.38, '🚲', '#587589', 0.58], [1.07, '木漏れ日', '#d6cdb8', 0.56]]) {
    sign(pole, 0, y, 0.052, w, 0.36, label, c, c === '#587589' ? '#fff0d3' : '#433d30');
  }

  tree(root, 3.41, -1.85, 1.03, 55);
  tree(root, -3.03, -1.93, 1.04, 57);
  tree(root, -0.96, -3.32, 1.25, 61);
  tree(root, 0.78, -3.33, 1.13, 62);
  bicycle(root, 3.29, 1.60, Math.PI / 2 - 0.12);
  planter(root, 3.27, 0.01, -0.68, 0.78, 17);
  planter(root, -2.69, 0.01, 0.48, 0.88, 17);

  for (let i = 0; i < 40; i++) {
    const x = 3.3 + (rng() - 0.5) * 1.5;
    const z = -1.80 + (rng() - 0.5) * 2.1;
    box(root, x, 0.011, z, 0.038 + rng() * 0.046, 0.012, 0.032, i % 2 ? '#9a824d' : '#7d8757').rotation.y = rng() * 6;
  }
  let running = true;
  let elapsed = 0;
  let enter;
  const swing = transition(0.56, t => {
    door.rotation.y = -t * 1.28;
    if (t === 1 && enter) {
      const go = enter;
      enter = undefined;
      go('tea');
    }
  });
  return {
    root, door,
    anchors: { study: [1.92, 3.65, 0.41], tea: [0.94, 1.40, 1.69] },
    actions: [toggle(ac.node, 'Air conditioning', true, on => {
      running = on;
      ac.led.emissiveIntensity = on ? 1 : 0;
      ac.led.color.set(on ? '#87b875' : '#4f5646');
    })],
    openDoor(go) {
      enter = go;
      swing.to(1);
    },
    leave() {
      enter = undefined;
      swing.to(0);
      swing.step(0, true);
    },
    update(delta, reduced) {
      const doorMoved = swing.step(delta, reduced);
      elapsed += delta;
      if (running && !reduced) ac.rotor.rotation.z -= delta * 13;
      return ambientMotion(elapsed, reduced) || doorMoved;
    },
  };
}
