import * as THREE from 'three';
import { beam, box, cylinder, framedWindow, group, lantern, mesh, palette as p, planter, random, sign, sphere } from './components.js';

function gable(parent, width, depth, y, color) {
  for (const side of [-1, 1]) {
    const pitch = group(parent, 0, y - 0.36, side * depth / 4);
    pitch.rotation.x = side * 0.34;
    const slope = depth / 2 / Math.cos(0.34) + 0.13;
    box(pitch, 0, 0, 0, width + 0.36, 0.14, slope, color, 0.035);
    for (let x = -width / 2; x <= width / 2 + 0.07; x += 0.19) {
      box(pitch, x, 0.08, 0, 0.056, 0.070, slope - 0.03, color, 0.018);
    }
    for (const z of [-0.36, 0.28]) box(pitch, 0, 0.072, z * slope, width + 0.32, 0.025, 0.045, '#554742');
  }
  box(parent, 0, y + 0.032, 0, width + 0.39, 0.16, 0.18, color, 0.043);
}

function house(parent, lights, { x, z, color, roof, ramen = false }) {
  const building = group(parent, x, 0, z);
  const width = ramen ? 4.5 : 3.0;
  const depth = ramen ? 3.1 : 2.6;
  const height = ramen ? 2.75 : 2.6;
  const front = depth / 2;
  box(building, 0, 0.10, 0, width + 0.20, 0.20, depth + 0.14, '#b0a38b', 0.04);
  box(building, 0, height / 2 + 0.13, 0, width, height, depth, color, 0.038);
  box(building, 0, height + 0.09, 0, width + 0.17, 0.17, depth + 0.17, p.trim);
  gable(building, width, depth, height + 0.91, roof);
  const glass = new THREE.MeshStandardMaterial({ color: '#d8b782', emissive: '#ec973c' });
  lights.push({ glow: glass });
  framedWindow(building, -width * 0.23, 1.50, front + 0.016, width * 0.39, 1.07, { pane: glass, rows: 5 });
  framedWindow(building, width / 2 + 0.015, 1.55, 0.15, depth * 0.53, 1.02, { rotation: Math.PI / 2, pane: glass, rows: 5 });
  box(building, width * 0.24, 1.14, front + 0.044, 0.84, 1.93, 0.12, p.dark, 0.025);
  box(building, width * 0.24, 1.43, front + 0.11, 0.61, 1.20, 0.015, glass);
  box(building, width * 0.24, 0.11, front + 0.18, 1.08, 0.17, 0.49, '#a38d70', 0.032);
  planter(building, width * 0.42, 0.01, front + 0.42, 0.65, 35);
  lantern(building, lights, width * 0.40, 1.9, front + 0.17, 0.58, 8);
  if (!ramen) {
    for (let i = 0; i < 8; i++) box(building, -1.36 + 0.39 * i, 0.44, front + 0.025, 0.056, 0.59, 0.06, p.trim);
    return;
  }
  sign(building, -0.36, 2.49, front + 0.095, 2.20, 0.44, 'ラーメン · RAMEN', '#983f33', '#fce6b8');
  const curtain = group(building, 0.93, 2.13, front + 0.39);
  beam(curtain, [-0.72, 0, 0], [0.72, 0, 0], 0.044, p.dark);
  for (let i = 0; i < 5; i++) {
    box(curtain, (i - 2) * 0.26, -0.28, 0, 0.246, 0.55, 0.035, i % 2 ? '#a34e40' : '#b25847', 0.011);
  }
  box(building, -1.01, 0.90, front + 0.24, 1.93, 0.095, 0.44, p.trim, 0.026);
  for (const x of [-1.66, -1.03, -0.4]) {
    cylinder(building, x, 0.46, front + 0.72, 0.19, 0.19, 0.11, '#a94f3e');
    cylinder(building, x, 0.22, front + 0.72, 0.045, 0.075, 0.43, p.dark);
  }
}

function fountain(root, lights, tree) {
  const garden = group(root, 4.20, 0, -5.58);
  box(garden, 0, 0.035, 0, 5.6, 0.11, 3.05, '#9a9d6e', 0.04);
  const rng = random(52);
  for (let i = 0; i < 23; i++) {
    const x = (rng() - 0.5) * 5.4;
    const z = (rng() - 0.5) * 2.7;
    if (Math.abs(x) > 0.95 || Math.abs(z) > 0.78) {
      sphere(garden, x, 0.10, z, 0.19 + rng() * 0.26, 0.09 + rng() * 0.16, 0.19 + rng() * 0.20, i % 3 ? '#7b8c57' : '#a49777');
    }
  }
  for (let i = 0; i < 5; i++) cylinder(garden, -2.2 + i * 0.38, 0.13, 0.97 - 0.075 * i, 0.24, 0.26, 0.10, '#b8ad94', 7);
  tree(garden, -1.98, -0.59, 0.64, 912, ['#a15a57', '#b56f6c', '#cb8880', '#df9a89', '#e5a791', '#ad6563']);
  tree(garden, 2.14, -0.77, 0.62, 309);
  lantern(garden, lights, 1.40, 0.16, 0.63, 0.85, 9);
  const basin = group(garden, 0.17, 0, 0);
  cylinder(basin, 0, 0.18, 0, 0.88, 0.74, 0.27, '#88867a', 16);
  const rim = mesh(basin, new THREE.TorusGeometry(0.81, 0.092, 8, 32), '#aba993', 0, 0.31, 0);
  rim.rotation.x = -Math.PI / 2;
  cylinder(basin, 0, 0.276, 0, 0.79, 0.78, 0.042, new THREE.MeshStandardMaterial({ color: '#598b80', roughness: 0.26, metalness: 0.12 }));
  beam(basin, [-0.60, 0.25, -0.32], [-0.60, 0.92, -0.32], 0.075, '#84935a');
  beam(basin, [-0.69, 0.88, -0.37], [-0.14, 0.72, -0.11], 0.062, '#a2a46b');
  const drops = Array.from({ length: 7 }, () => sphere(basin, 0, 0, 0, 0.028, 0.053, 0.028, '#bde1d5'));
  const ripples = Array.from({ length: 3 }, () => {
    const ring = mesh(basin, new THREE.TorusGeometry(0.43, 0.014, 6, 24),
      new THREE.MeshBasicMaterial({ color: '#d2ede1', transparent: true, opacity: 0.55, depthWrite: false }), 0.04, 0.30, -0.04);
    ring.rotation.x = -Math.PI / 2;
    ring.castShadow = false;
    return ring;
  });
  function flow(time) {
    drops.forEach((drop, i) => {
      const t = (time * 2.6 + i / drops.length) % 1;
      drop.position.set(-0.14 + t * 0.18, 0.715 - t * t * 0.42, -0.11 + t * 0.07);
    });
    ripples.forEach((ripple, i) => {
      const t = (time * 0.72 + i / ripples.length) % 1;
      ripple.scale.setScalar(0.09 + t);
      ripple.material.opacity = (1 - t) * 0.75;
    });
  }
  flow(0);
  return flow;
}

export function extendStreet(root, lights, tree, bicycle) {
  box(root, 3.42, -0.552, -0.90, 16.35, 0.60, 12.80, '#656457', 0.06);
  box(root, 7.88, -0.15, -1.58, 7.40, 0.29, 11.08, '#b8ad96', 0.046);
  box(root, 1.25, -0.15, -5.66, 12.1, 0.29, 3.32, '#b8ad96', 0.046);
  box(root, 3.43, -0.17, 4.48, 16.27, 0.27, 1.85, '#707971', 0.04);
  for (let i = 0; i < 25; i++) {
    const x = -4.45 + i * 0.655;
    box(root, x, -0.031, 3.67, 0.64, 0.07, 0.11, '#d6c6a9', 0.012);
    box(root, x, -0.031, 5.34, 0.64, 0.07, 0.11, '#cfbfa5', 0.012);
    if (i % 2 === 0) box(root, x, -0.031, 4.50, 0.45, 0.009, 0.028, '#d2c49b');
  }
  for (const x of [-3.8, 10.2]) {
    const signpost = sign(root, x, 0.02, 3.38, 0.64, 0.28, 'BIKES', '#526e6b', '#f4e8c9');
    signpost.position.y = 0.69;
    cylinder(root, x, 0.33, 3.38, 0.032, 0.042, 0.66, '#52544a');
  }
  house(root, lights, { x: 8.25, z: 0.40, color: '#d5a77e', roof: '#745348', ramen: true });
  house(root, lights, { x: 8.73, z: -4.50, color: '#a8b3a2', roof: '#616f6e' });
  house(root, lights, { x: -2.65, z: -5.57, color: '#d5c09c', roof: '#7b6758' });
  const flow = fountain(root, lights, tree);
  for (const x of [5.25, 10.85]) planter(root, x, 0, 2.9, 0.75, 73);
  const bikes = [bicycle(root, -3, 4.08, 0, '#b26a4f', true), bicycle(root, 10.5, 4.92, Math.PI, '#609b92', true)];
  bikes.forEach(({ node }) => node.scale.setScalar(0.73));
  return (time, reduced) => {
    if (reduced) return false;
    flow(time);
    bikes.forEach(({ node, wheels }, i) => {
      const distance = time * (1.68 + 0.31 * i);
      node.position.x = i === 0 ? -5.5 + ((distance + 3.2) % 18) : 12.35 - ((distance + 2.5) % 18);
      node.visible = node.position.x > -4.07 && node.position.x < 10.87;
      wheels.forEach(wheel => { wheel.rotation.z = -distance / (0.395 * 0.73); });
    });
    return true;
  };
}
