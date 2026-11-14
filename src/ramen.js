import * as THREE from 'three';
import { oneShot } from './animation.js';
import { beam, box, cylinder, framedWindow, group, lantern, mesh, palette as p, sign, sphere, table } from './components.js';
import { room } from './rooms.js';

function ramenBowl(parent) {
  const bowl = group(parent);
  const profile = [[0, 0.025], [0.22, 0.025], [0.38, 0.14], [0.46, 0.30], [0.45, 0.335], [0.42, 0.32], [0.38, 0.19], [0.18, 0.075], [0, 0.075]];
  mesh(bowl, new THREE.LatheGeometry(profile.map(point => new THREE.Vector2(...point)), 32), '#ad4937', 0, 0, 0);
  const rim = mesh(bowl, new THREE.TorusGeometry(0.446, 0.017, 8, 32), '#f3dfb6', 0, 0.325, 0);
  rim.rotation.x = -Math.PI / 2;
  const broth = cylinder(bowl, 0, 0.27, 0, 0.407, 0.38, 0.030, '#ae7338', 32);
  const portions = [];
  for (let i = 0; i < 3; i++) {
    const topping = group(bowl, 0, 0, 0, i * 2.09);
    sphere(topping, 0, 0.292, 0.145, 0.16, 0.025, 0.094, '#ecc57f');
    for (let j = 0; j < 4; j++) {
      const noodle = mesh(topping, new THREE.TorusGeometry(0.058, 0.009, 5, 12, 4.5), '#f2d295', (j - 1.5) * 0.049, 0.32, 0.14);
      noodle.rotation.set(-Math.PI / 2, 0, j);
    }
    portions.push(topping);
  }
  const egg = sphere(portions[0], -0.11, 0.333, 0.23, 0.10, 0.046, 0.076, '#f9e8ce', 2);
  sphere(portions[0], egg.position.x, 0.367, egg.position.z, 0.054, 0.022, 0.045, '#eb9a3f', 2);
  sphere(portions[1], 0.10, 0.328, 0.24, 0.10, 0.024, 0.070, '#a55844', 2);
  box(portions[2], -0.14, 0.345, 0.24, 0.12, 0.145, 0.026, '#385348', 0.007).rotation.x = -0.37;
  return { dish: bowl, portions, broth };
}

function sushiPlate(parent) {
  const dish = group(parent);
  box(dish, 0, 0.040, 0, 1.18, 0.08, 0.59, '#cbd3bd', 0.035);
  const portions = [];
  for (const [i, color] of ['#e59974', '#a75759', '#e3ae61'].entries()) {
    const piece = group(dish, (i - 1) * 0.33, 0.08, 0, (i - 1) * 0.16);
    box(piece, 0, 0.061, 0, 0.23, 0.12, 0.29, '#f6e6c9', 0.048);
    box(piece, 0, 0.136, 0, 0.252, 0.060, 0.32, color, 0.026);
    for (const x of [-0.062, 0, 0.062]) {
      box(piece, x, 0.165, 0, 0.013, 0.009, 0.22, '#edc4a6', 0.004).rotation.y = 0.31;
    }
    portions.push(piece);
  }
  sphere(dish, -0.49, 0.094, 0.16, 0.042, 0.023, 0.05, '#8c9b67');
  return { dish, portions };
}

function serving(counter, x, food) {
  const tray = group(counter, x, 1.26, 0.14);
  box(tray, 0, 0.025, 0, 1.55, 0.05, 0.93, '#59392e', 0.037);
  const { dish, portions, broth } = food(tray);
  dish.position.y = 0.065;
  dish.visible = false;
  const chopsticks = group(tray, 0, 0.085, 0.34);
  for (const z of [-0.035, 0.035]) beam(chopsticks, [-0.56, 0, z], [0.56, 0, z], 0.018, '#d9b17a');
  const serve = oneShot(0.42, t => {
    dish.position.z = (1 - THREE.MathUtils.smoothstep(t, 0, 1)) * -0.48;
    dish.scale.setScalar(0.85 + t * 0.15);
  });
  let remaining = 0;
  let served = false;
  let bite;
  const eat = oneShot(0.52, t => {
    const lift = Math.sin(t * Math.PI);
    bite.position.y = bite.startY + lift * 0.56;
    bite.position.z = bite.startZ + t * 0.33;
    bite.visible = t < 0.8;
    chopsticks.position.y = 0.085 + lift * 0.46;
    chopsticks.rotation.z = -lift * 0.31;
    if (broth) {
      const amount = (remaining + (1 - t)) / portions.length;
      broth.scale.set(0.52 + amount * 0.48, 1, 0.52 + amount * 0.48);
      broth.position.y = 0.11 + amount * 0.16;
      broth.visible = amount > 0;
    }
  });
  return {
    tray,
    order() {
      eat.end();
      serve.end();
      portions.forEach(part => {
        if (part.startY !== undefined) part.position.setY(part.startY).setZ(part.startZ);
        part.visible = true;
      });
      if (broth) {
        broth.visible = true;
        broth.position.y = 0.27;
        broth.scale.setScalar(1);
      }
      remaining = portions.length;
      served = true;
      dish.visible = true;
      serve.start();
    },
    eat() {
      if (!remaining) return;
      serve.end();
      eat.end();
      bite = portions[portions.length - remaining];
      bite.startY ??= bite.position.y;
      bite.startZ ??= bite.position.z;
      remaining--;
      return eat.start();
    },
    remaining: () => remaining,
    served: () => served,
    step(delta, reduced) {
      const arriving = serve.step(delta, reduced);
      return eat.step(delta, reduced) || arriving;
    },
    leave() {
      serve.end();
      eat.end();
    },
  };
}

export function buildRamen(parent, lights) {
  const root = room(parent, {
    wall: '#d1a37e', trim: '#654437', floor: ['#aa7b58', '#b3815d', '#a57353', '#b98a64'],
  });
  const counter = table(root, 0.16, 0.035, 0.1, 5.54, 1.20, 1.27, '#8d5240');
  box(counter, 0, 0.58, 0.02, 5.25, 1.10, 0.98, '#9f604a', 0.032);
  for (let i = 0; i < 17; i++) box(counter, (i - 8) * 0.30, 0.60, 0.524, 0.056, 1.08, 0.048, '#bc7857', 0.01);
  const ramen = serving(counter, -0.92, ramenBowl);
  const sushi = serving(counter, 0.99, sushiPlate);
  for (const x of [-2.04, -0.73, 0.67, 2.0]) {
    cylinder(root, x, 0.41, 1.58, 0.055, 0.107, 0.75, '#634235');
    cylinder(root, x, 0.79, 1.58, 0.36, 0.33, 0.15, '#a4483a', 22);
    cylinder(root, x, 0.17, 1.58, 0.26, 0.26, 0.055, '#634235');
  }

  table(root, 0, 0.035, -2.86, 6.15, 1.00, 0.98, p.trim);
  box(root, 0, 1.77, -3.38, 5.89, 0.11, 0.44, '#855741', 0.016);
  for (let i = 0; i < 9; i++) {
    cylinder(root, -2.66 + i * 0.68, 1.92, -3.32, 0.16, 0.11, 0.19, ['#e9ccaa', '#aa5d48', '#748678'][i % 3]);
  }
  for (const x of [-2, -1.18]) {
    cylinder(root, x, 1.20, -2.87, 0.33, 0.28, 0.31, '#777d78', 20);
    cylinder(root, x, 1.37, -2.87, 0.34, 0.34, 0.06, '#9c9e8d', 20);
    sphere(root, x, 1.44, -2.87, 0.07, 0.05, 0.07, p.dark);
    for (const side of [-1, 1]) box(root, x + 0.37 * side, 1.27, -2.87, 0.16, 0.06, 0.21, p.dark, 0.02);
  }
  for (const x of [1.05, 1.66, 2.17]) {
    cylinder(root, x, 1.28, -2.87, 0.12, 0.14, 0.42, '#a77b51');
    cylinder(root, x, 1.53, -2.87, 0.079, 0.11, 0.1, '#603c30');
  }
  const menu = group(root, 0, 2.88, -3.54);
  sign(menu, -1.08, 0, 0, 1.85, 0.68, 'ラーメン · RAMEN', '#963d33', '#f8e3ba');
  sign(menu, 1.08, 0, 0, 1.85, 0.68, '寿司 · SUSHI', '#526859', '#f8e3ba');
  framedWindow(root, -3.55, 2.50, 0.29, 2.35, 1.37, { rotation: Math.PI / 2, rows: 5, columns: 3 });
  lantern(root, lights, -2.74, 1.09, -2.85, 0.91, 17);
  lantern(root, lights, 2.73, 1.09, -2.85, 0.91, 17);
  lantern(counter, lights, 2.37, 1.27, -0.10, 0.68, 9);
  sign(counter, -0.92, 1.56, -0.51, 1.16, 0.27, 'RAMEN', '#963d33', '#f8e3ba');
  sign(counter, 0.99, 1.56, -0.51, 1.16, 0.27, 'SUSHI', '#526859', '#f8e3ba');

  function menuActions(serving, name, orderLabel, biteLabel) {
    return [
      {
        label: () => serving.served() && !serving.remaining() ? `Order another ${orderLabel}` : `Order ${orderLabel}`,
        disabled: () => serving.remaining() > 0,
        run() { serving.order(); return `${name} served.`; },
      },
      {
        target: serving.tray, label: () => biteLabel, disabled: () => !serving.remaining(),
        run() {
          if (!serving.eat()) return;
          const left = serving.remaining();
          return left ? `${name}: ${left} left.` : `${name} finished. Order another whenever you like.`;
        },
      },
    ];
  }

  return {
    root,
    actions: [...menuActions(ramen, 'Ramen', 'bowl of ramen', 'Eat ramen'), ...menuActions(sushi, 'Sushi', 'plate of sushi', 'Eat sushi')],
    update(delta, reduced) {
      const ramenMoved = ramen.step(delta, reduced);
      return sushi.step(delta, reduced) || ramenMoved;
    },
    leave() {
      ramen.leave();
      sushi.leave();
    },
  };
}
