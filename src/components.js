import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const palette = {
  cream: '#e5d5b7', trim: '#7b6048', dark: '#40372f', wood: '#976042',
  teal: '#3b786e', sage: '#82905d', stone: '#b6ac95', road: '#5b5c53',
  glass: '#c3ad7c', paper: '#f0d7a5', tile: '#7d8580',
};

const materials = new Map();
const cube = new THREE.BoxGeometry();
const spheres = new Map();
export function material(color) {
  if (typeof color !== 'string') return color;
  if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
  return materials.get(color);
}

export function disposeModel(root) {
  const sharedMaterials = new Set(materials.values());
  const sharedGeometries = new Set([cube, ...spheres.values()]);
  root.traverse(node => {
    if (!node.isMesh) return;
    if (!sharedGeometries.has(node.geometry)) node.geometry.dispose();
    if (!sharedMaterials.has(node.material)) {
      node.material.map?.dispose();
      node.material.dispose();
    }
  });
  root.removeFromParent();
}

export function group(parent, x = 0, y = 0, z = 0, rotation = 0) {
  const node = new THREE.Group();
  node.position.set(x, y, z);
  node.rotation.y = rotation;
  parent.add(node);
  return node;
}

export function mesh(parent, geometry, color, x, y, z) {
  const node = new THREE.Mesh(geometry, material(color));
  node.position.set(x, y, z);
  node.castShadow = true;
  node.receiveShadow = true;
  parent.add(node);
  return node;
}

export function box(parent, x, y, z, w, h, d, color, radius = 0) {
  if (radius) return mesh(parent, new RoundedBoxGeometry(w, h, d, 2, radius), color, x, y, z);
  const node = mesh(parent, cube, color, x, y, z);
  node.scale.set(w, h, d);
  return node;
}

export function cylinder(parent, x, y, z, top, bottom, height, color, sides = 14) {
  return mesh(parent, new THREE.CylinderGeometry(top, bottom, height, sides), color, x, y, z);
}

export function sphere(parent, x, y, z, w, h, d, color, detail = 1) {
  if (!spheres.has(detail)) spheres.set(detail, new THREE.IcosahedronGeometry(1, detail));
  const node = mesh(parent, spheres.get(detail), color, x, y, z);
  node.scale.set(w, h, d);
  return node;
}

export function beam(parent, a, b, radius, color) {
  const start = new THREE.Vector3(...a);
  const direction = new THREE.Vector3(...b).sub(start);
  const length = direction.length();
  const mid = start.addScaledVector(direction, 0.5);
  const node = cylinder(parent, mid.x, mid.y, mid.z, radius, radius, length, color, 8);
  node.quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, direction.normalize());
  return node;
}

export function random(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function artwork(parent, x, y, z, width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = Math.max(48, Math.round(384 * height / width));
  const context = canvas.getContext('2d');
  context.scale(canvas.width, canvas.height);
  draw(context);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  const node = mesh(parent, new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map, roughness: 1 }), x, y, z);
  node.castShadow = false;
  return node;
}

export function sign(parent, x, y, z, width, height, label, bg, ink, rotation = 0) {
  const node = group(parent, x, y, z, rotation);
  box(node, 0, 0, 0, width + 0.055, height + 0.055, 0.055, palette.dark, 0.018);
  artwork(node, 0, 0, 0.03, width, height, ctx => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1, 1);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.012;
    ctx.strokeRect(0.035, 0.08, 0.93, 0.84);
    ctx.fillStyle = ink;
    ctx.font = 'bold 0.55px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0.5, 0.54, 0.86);
  });
  return node;
}

export function framedWindow(parent, x, y, z, w, h, {
  rotation = 0, frame = palette.dark, pane = palette.glass, columns = 2, rows = 8,
} = {}) {
  const node = group(parent, x, y, z, rotation);
  box(node, 0, 0, 0, w + 0.15, h + 0.14, 0.10, frame, 0.018);
  box(node, 0, 0, 0.057, w, h, 0.018, pane);
  for (let i = 0; i <= columns; i++) box(node, (i / columns - 0.5) * w, 0, 0.082, 0.038, h, 0.038, frame);
  for (let i = 0; i <= rows; i++) box(node, 0, (i / rows - 0.5) * h, 0.082, w, 0.026, 0.035, frame);
  box(node, 0, -h / 2 - 0.06, 0.058, w + 0.24, 0.065, 0.22, frame, 0.013);
  return node;
}

export function planter(parent, x, y, z, scale = 1, seed = 4) {
  const node = group(parent, x, y, z);
  node.scale.setScalar(scale);
  cylinder(node, 0, 0.17, 0, 0.23, 0.17, 0.34, '#ad6c50');
  cylinder(node, 0, 0.333, 0, 0.25, 0.25, 0.075, '#bd7e60');
  cylinder(node, 0, 0.377, 0, 0.206, 0.206, 0.018, '#543727');
  const rng = random(seed);
  const colors = ['#587747', '#759458', '#96a468', '#47705a'];
  for (let i = 0; i < 13; i++) {
    const angle = i * 2.4;
    const reach = 0.08 + rng() * 0.22;
    const point = [Math.cos(angle) * reach, 0.45 + rng() * 0.48, Math.sin(angle) * reach];
    beam(node, [0, 0.36, 0], point, 0.012, '#4c6745');
    const leaf = sphere(node, ...point, 0.105, 0.055, 0.17, colors[i % colors.length]);
    leaf.rotation.set(0.4, angle, 0.4);
  }
  return node;
}

export function lantern(parent, lights, x, y, z, scale = 1, strength = 13) {
  const node = group(parent, x, y, z);
  node.scale.setScalar(scale);
  const glow = new THREE.MeshStandardMaterial({ color: '#ffd18e', emissive: '#ff982d', emissiveIntensity: 0.4 });
  const paper = box(node, 0, 0.27, 0, 0.32, 0.49, 0.32, glow, 0.024);
  paper.castShadow = false;
  for (const y of [0.015, 0.53]) box(node, 0, y, 0, 0.39, 0.06, 0.39, palette.dark, 0.01);
  for (const x of [-0.17, 0.17]) for (const z of [-0.17, 0.17]) box(node, x, 0.27, z, 0.027, 0.52, 0.027, palette.dark);
  const light = new THREE.PointLight('#ffad56', strength, 6, 2);
  light.position.set(0.14, 0.49, 0.22);
  node.add(light);
  lights.push({ light, glow, strength });
  return node;
}

export function table(parent, x, y, z, w, h, d, color = palette.wood) {
  const node = group(parent, x, y, z);
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
    box(node, dx * (w / 2 - 0.17), h / 2, dz * (d / 2 - 0.14), 0.12, h, 0.12, color, 0.015);
  }
  box(node, 0, h, 0, w, 0.13, d, color, 0.035);
  return node;
}
