import { oneShot, toggle, transition } from './animation.js';
import * as THREE from 'three';
import { artwork, beam, box, cylinder, framedWindow, group, lantern, mesh, palette as p, planter, random, sphere, table } from './components.js';

function room(parent, { wall, trim, floor, opening = false }) {
  const root = group(parent);
  box(root, 0, -0.24, 0, 7.6, 0.48, 7.6, trim, 0.045);
  const rng = random(19);
  for (let row = 0; row < 23; row++) {
    const z = -3.64 + row * 0.326;
    let edge = -3.75;
    while (edge < 3.74) {
      const length = Math.min(3.75 - edge, 0.85 + rng() * 2.2);
      box(root, edge + length / 2, 0.01, z, length - 0.014, 0.05, 0.31, floor[Math.floor(rng() * floor.length)]);
      edge += length;
    }
  }

  box(root, -3.7, 2.00, 0, 0.20, 4, 7.6, wall, 0.038);
  if (opening) {
    box(root, -2.9, 2, -3.7, 1.62, 4, 0.20, wall);
    box(root, 3.12, 2, -3.7, 1.16, 4, 0.20, wall);
    box(root, 0.23, 3.75, -3.7, 4.64, 0.50, 0.20, wall);
    box(root, 0.23, 0.15, -3.7, 4.64, 0.30, 0.20, wall);
  } else {
    box(root, 0, 2.00, -3.7, 7.6, 4, 0.20, wall, 0.038);
  }
  for (const y of [0.12, 4.0]) {
    box(root, -3.68, y, 0, 0.25, 0.13, 7.64, trim, 0.02);
    box(root, 0, y, -3.68, 7.64, 0.13, 0.25, trim, 0.02);
  }
  return root;
}

function print(parent, x, y, z, w, h, rotation, colors, seed) {
  const frame = group(parent, x, y, z, rotation);
  box(frame, 0, 0, 0, w + 0.09, h + 0.09, 0.06, p.trim, 0.012);
  artwork(frame, 0, 0, 0.034, w, h, ctx => {
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, 1, 1);
    ctx.beginPath();
    ctx.arc(0.69, 0.27, 0.123, 0, Math.PI * 2);
    ctx.fillStyle = colors[1];
    ctx.fill();
    const rng = random(seed);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = colors[i + 2];
      ctx.beginPath();
      ctx.moveTo(0, 0.61 + 0.07 * i);
      for (let j = 0; j <= 10; j++) {
        ctx.lineTo(j / 10, 0.50 + 0.136 * i + Math.sin(j * 0.74 + i) * 0.14 + rng() * 0.11);
      }
      ctx.lineTo(1, 1);
      ctx.lineTo(0, 1);
      ctx.fill();
    }
    ctx.fillStyle = '#a04e3a';
    ctx.fillRect(0.83, 0.08, 0.070, 0.13);
    ctx.fillStyle = '#f4ddad';
    ctx.fillRect(0.854, 0.098, 0.024, 0.095);
  });
}
const rug = (root, x, z, w, d, color, edge) => {
  box(root, x, 0.055, z, w, 0.045, d, edge, 0.014);
  box(root, x, 0.078, z, w - 0.15, 0.012, d - 0.17, color, 0.005);
  for (const dz of [-1, 1]) {
    for (let i = 0; i < 22; i++) box(root, x + (i - 10.5) * (w / 23), 0.058, z + dz * (d / 2 + 0.024), 0.023, 0.022, 0.062, edge);
  }
};
function cushion(root, x, z, color) {
  box(root, x, 0.155, z, 0.93, 0.17, 0.83, color, 0.081);
  box(root, x, 0.124, z, 0.97, 0.028, 0.87, '#887355', 0.013);
}

export function buildStudy(parent, lights) {
  const root = room(parent, { wall: '#dad8b5', trim: '#afaa8e', floor: ['#8e9074', '#989a80', '#929478'] });
  rug(root, 0.57, 1.23, 3.22, 2.37, '#aeb28d', '#ddd0a6');
  const tones = ['#e2dcb2', '#d7a356', '#b5bd87', '#88976e', '#617963'];
  print(root, -3.56, 2.65, 0.44, 1.15, 1.49, Math.PI / 2, tones, 3);
  framedWindow(root, 1.92, 2.83, -3.58, 1.60, 1.09, { columns: 3, rows: 5, frame: '#a29972', pane: '#f4dd9a' });
  box(root, -0.76, 2.93, -3.42, 2.92, 0.13, 0.49, '#e8dbb5', 0.033);
  const pig = group(root, -1.64, 3.03, -3.37);
  sphere(pig, 0, 0.16, 0, 0.22, 0.17, 0.16, '#dba18f', 2);
  sphere(pig, 0.19, 0.16, 0, 0.075, 0.076, 0.096, '#d39480', 2);
  for (const z of [-0.09, 0.09]) {
    sphere(pig, 0.09, 0.29, z, 0.04, 0.07, 0.044, '#d39480');
    sphere(pig, 0.175, 0.21, z, 0.013, 0.013, 0.013, '#655447');
  }
  box(pig, 0, 0.32, 0, 0.092, 0.012, 0.021, '#664033');
  const coin = cylinder(root, pig.position.x, 4.33, pig.position.z, 0.092, 0.092, 0.031, '#efbf54', 20);
  coin.visible = false;
  let savings = 0;
  const deposit = oneShot(0.72, t => {
    coin.visible = t < 1;
    coin.position.y = 3.36 + (1 - t * t) * 0.92;
    coin.rotation.x = Math.PI / 2 * (1 - t);
    coin.rotation.z = t * 8;
    pig.rotation.z = t > 0.7 ? Math.sin((t - 0.7) * Math.PI / 0.3) * 0.15 : 0;
  });
  for (let i = 0; i < 8; i++) box(root, -0.71 + i * 0.16, 3.18, -3.43, 0.13, 0.36 - i % 3 * 0.044, 0.23, ['#a2a873', '#c3a977', '#809783', '#d5c295'][i % 4], 0.015);

  const bed = group(root, 0.20, 0, -2.27);
  box(bed, 0, 0.27, 0, 3.47, 0.39, 1.68, '#c7bc94', 0.09);
  box(bed, 0, 0.52, 0, 3.37, 0.29, 1.60, '#eee2bb', 0.13);
  box(bed, 0.48, 0.63, 0.05, 2.39, 0.25, 1.57, '#7d906d', 0.12);
  box(bed, 0.43, 0.76, 0.05, 2.20, 0.027, 1.41, '#8b9d77', 0.012);
  box(bed, -1.06, 0.75, 0, 0.73, 0.24, 1.11, '#a8ad82', 0.11);
  for (const x of [-1.48, 1.48]) for (const z of [-0.61, 0.61]) box(bed, x, 0.09, z, 0.14, 0.16, 0.14, '#857758');
  const desk = table(root, -2.85, 0.03, 0.72, 2.46, 1.24, 1.31, '#d7cba6');
  desk.rotation.y = Math.PI / 2;
  box(desk, -0.67, 1.07, 0.38, 0.73, 0.22, 0.45, '#a6b178', 0.027);
  const pc = group(desk, 0.24, 1.31, -0.18);
  box(pc, 0, 0.35, 0, 0.78, 0.69, 0.51, '#c6c5a1', 0.075);
  box(pc, 0, 0.37, 0.259, 0.59, 0.47, 0.038, '#667559', 0.015);
  const glow = new THREE.MeshStandardMaterial({ color: '#c9dc70', emissive: '#aabd4d', emissiveIntensity: 0.55 });
  box(pc, 0, 0.39, 0.281, 0.49, 0.34, 0.025, glow, 0.011);
  glow.emissiveIntensity = 0.65;
  const screen = artwork(pc, 0, 0.40, 0.297, 0.44, 0.27, ctx => {
    ctx.fillStyle = '#cedd80';
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = '#678454';
    ctx.font = 'bold 0.15px monospace';
    ctx.fillText('KOMOREBI OS', 0.06, 0.32);
    ctx.fillText('> hello_', 0.06, 0.61);
  });
  box(pc, 0, 0.042, 0.42, 0.68, 0.067, 0.27, '#d4ceaa', 0.022);
  for (let row = 0; row < 3; row++) for (let k = 0; k < 9; k++) box(pc, (k - 4) * 0.062, 0.082, 0.37 + row * 0.047, 0.046, 0.018, 0.032, '#999c73');
  planter(desk, -0.76, 1.31, -0.15, 0.53, 13);
  const chair = group(root, -1.24, 0, 0.81, -Math.PI / 2 + 0.24);
  box(chair, 0, 0.65, 0, 0.78, 0.15, 0.72, '#515a48', 0.069);
  box(chair, 0, 1.04, -0.34, 0.73, 0.64, 0.16, '#606a55', 0.076);
  cylinder(chair, 0, 0.32, 0, 0.065, 0.065, 0.63, '#535748');
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 0.4;
    const end = [Math.sin(angle) * 0.42, 0.10, Math.cos(angle) * 0.42];
    beam(chair, [0, 0.15, 0], end, 0.025, '#535748');
    sphere(chair, ...end, 0.05, 0.067, 0.05, '#42483e');
  }
  const stand = table(root, 2.65, 0, -2.35, 0.80, 0.63, 0.67, '#c6bea0');
  const lamp = lantern(stand, lights, 0.06, 0.71, -0.08, 0.72, 13);
  const lampLight = lights.at(-1);
  const computerLight = new THREE.PointLight('#ccd96f', 1.1, 1.7, 2);
  computerLight.position.set(0, 0.39, 0.50);
  pc.add(computerLight);
  planter(root, 2.46, 0.035, 1.80, 1.15, 25);
  return {
    root,
    actions: [
      { target: pig, label: () => `Save ¥100 · ¥${savings} saved`, run() {
        if (!deposit.start()) return;
        savings += 100;
        return `¥${savings} saved in the piggy bank.`;
      } },
      toggle(lamp, 'Study lights', true, on => { lampLight.enabled = on; }),
      toggle(pc, 'Computer power', true, on => {
        screen.visible = on;
        computerLight.visible = on;
        glow.color.set(on ? '#c9dc70' : '#29332a');
        glow.emissiveIntensity = on ? 0.65 : 0;
      }),
    ],
    update: (delta, reduced) => deposit.step(delta, reduced),
  };
}

function teaSet(root, x, y, z) {
  box(root, x, y + 0.022, z, 0.88, 0.055, 0.50, '#8a5139', 0.025);
  const ceramic = new THREE.MeshStandardMaterial({ color: '#a9644c', roughness: 0.42 });
  const pot = group(root, x - 0.16, y + 0.16, z);
  sphere(pot, 0, 0, 0, 0.20, 0.115, 0.17, ceramic, 2);
  cylinder(pot, 0, 0.105, 0, 0.106, 0.120, 0.037, ceramic);
  sphere(pot, 0, 0.14, 0, 0.036, 0.032, 0.036, ceramic);
  const spout = [-0.27, 0.09, 0.03];
  beam(pot, [-0.14, -0.03, 0], spout, 0.038, ceramic);
  mesh(pot, new THREE.TorusGeometry(0.084, 0.018, 8, 20), ceramic, 0.18, 0.02, 0);

  const cups = [];
  for (const dz of [-0.14, 0.13]) {
    const cup = group(root, x + 0.26, y + 0.05, z + dz);
    cylinder(cup, 0, 0.053, 0, 0.084, 0.056, 0.09, '#bd8062');
    cylinder(cup, 0, 0.099, 0, 0.068, 0.068, 0.013, '#654638');
    const liquid = cylinder(cup, 0, 0.108, 0, 0.063, 0.063, 0.012, '#b5762e');
    liquid.visible = false;
    cups.push(liquid);
  }
  return { pot, spout: new THREE.Vector3(...spout), cup: cups[1] };
}

export function buildTea(parent, lights) {
  const root = room(parent, { wall: '#9e7457', trim: '#4d3c31', floor: ['#926044', '#9a6749', '#85553f', '#a36d4d'], opening: true });
  const paper = new THREE.MeshStandardMaterial({ color: '#e6c599', emissive: '#d9874a', emissiveIntensity: 0.12, roughness: 1 });
  lights.push({ glow: paper });
  const screens = [];
  for (const x of [-0.79, 1.25]) {
    const screen = framedWindow(root, x, 1.9, -3.58, 2.04, 3.13, { columns: 8, rows: 9, frame: '#73513c', pane: paper });
    screen.position.z += screens.length * 0.13;
    screens.push(screen);
  }
  box(root, 0.23, 3.51, -3.60, 4.66, 0.14, 0.27, '#714a33', 0.019);
  for (const [i, z] of [-1.30, 0.04, 1.38].entries()) {
    print(root, -3.56, 2.56, z, 1.22, 1.67, Math.PI / 2, [
      ['#a8a6aa', '#eaa67e', '#84838a', '#687976', '#e2d1b7'],
      ['#e1b896', '#f2d49e', '#9c8c88', '#7b8787', '#d9ceba'],
      ['#ab9c94', '#e7c078', '#867a76', '#9a8578', '#e3cbad'],
    ][i], 122 + i * 6);
  }
  box(root, -3.34, 1.23, 0.04, 0.51, 0.11, 2.92, '#784a35', 0.036);
  for (let i = 0; i < 5; i++) box(root, -3.33, 1.34 + i * 0.074, -0.30 + 0.035 * i, 0.28, 0.066, 0.52, ['#8c775a', '#b79b70', '#6e7560'][i % 3], 0.014);
  const vase = cylinder(root, -3.28, 1.48, 0.69, 0.13, 0.16, 0.36, '#b1805e');
  for (let i = 0; i < 4; i++) beam(root, vase.position.toArray(), [-3.21 - i * 0.026, 1.99 + i * 0.05, 0.50 + 0.12 * i], 0.014, '#8b6f54');
  for (const z of [-2.52, 2.62]) {
    box(root, -3.33, 1.00, z, 0.57, 0.11, 0.59, '#754c38', 0.035);
    lantern(root, lights, -3.24, 1.06, z, 0.92, 19);
  }
  rug(root, 0.74, 0.90, 3.84, 3.40, '#c2a783', '#7e7d6a');
  cushion(root, 0.69, 2.14, '#af7357');
  cushion(root, 0.71, -0.46, '#849074');
  const low = table(root, 0.73, 0.08, 0.86, 2.55, 0.57, 1.21, '#805037');
  box(low, 0, 0.20, 0, 2.27, 0.075, 0.88, '#714835', 0.02);
  const { pot, spout, cup } = teaSet(low, 0.18, 0.64, -0.10);
  const rest = pot.position.clone();
  const cupTop = cup.parent.position.clone().add(cup.position);
  const stream = cylinder(low, 0, 0, 0, 0.022, 0.022, 1, '#d4903d', 8);
  stream.castShadow = false;
  stream.visible = false;
  const tip = new THREE.Vector3();
  const direction = new THREE.Vector3();
  let poured = false;
  const pour = oneShot(2.1, t => {
    const lift = THREE.MathUtils.smoothstep(t, 0, 0.28) * (1 - THREE.MathUtils.smoothstep(t, 0.72, 1));
    pot.position.copy(rest);
    pot.position.x += (cupTop.x + 0.28 - rest.x) * lift;
    pot.position.y += 0.34 * lift;
    pot.position.z += (cupTop.z - 0.03 - rest.z) * lift;
    pot.rotation.z = lift * 0.61;
    stream.visible = t >= 0.31 && t <= 0.71;
    if (stream.visible) {
      tip.copy(spout).applyEuler(pot.rotation).add(pot.position);
      direction.copy(tip).sub(cupTop);
      stream.position.copy(tip).lerp(cupTop, 0.5);
      stream.scale.y = direction.length();
      stream.quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, direction.normalize());
    }
    cup.visible = t >= 0.50;
  });
  const tray = table(root, 0.36, 0.04, -2.51, 2.52, 0.42, 0.79, '#82553b');
  lantern(tray, lights, -0.72, 0.49, -0.03, 0.76, 15);
  teaSet(tray, 0.32, 0.49, 0.05);
  planter(root, 2.84, 0.037, -2.59, 0.99, 15);
  const blinds = transition(0.62, t => { screens[1].position.x = 1.25 - 1.99 * t; });
  return {
    root,
    actions: [
      toggle(screens[1], 'Shōji blinds', false, open => blinds.to(Number(open))),
      { target: pot, label: () => poured ? 'Pour tea again' : 'Pour tea', run() {
        if (!pour.start()) return;
        poured = true;
        return 'Pouring tea into the cup.';
      } },
    ],
    update(delta, reduced) {
      const moved = blinds.step(delta, reduced);
      return pour.step(delta, reduced) || moved;
    },
    leave: () => pour.end(),
  };
}
