import * as THREE from 'three';
import { buildStreet } from './street.js';
import { buildStudy, buildTea } from './rooms.js';

const skies = [
  [0, '#222f45', '#121d31'],
  [4.6, '#343b55', '#283548'],
  [6.1, '#f1ceb1', '#c5a9aa'],
  [8, '#f2efdf', '#d8e5dc'],
  [12, '#f7f3e3', '#d9e7df'],
  [16.25, '#f5edd8', '#e3e6d7'],
  [18, '#efc397', '#cbb1a4'],
  [19.3, '#9b858d', '#6e7a82'],
  [21, '#283953', '#182736'],
  [24, '#222f45', '#121d31'],
].map(([hour, center, edge]) => [hour, new THREE.Color(center), new THREE.Color(edge)]);

const tileDefinitions = {
  street: { make: buildStreet, ground: -0.854, focus: 1.57, size: 14.7, width: 23.0, x: 3.4, z: -0.9, shadow: 16 },
  study: { make: buildStudy, ground: -0.485, focus: 1.60, size: 10.1, width: 11.8, x: 0, z: 0, shadow: 9 },
  tea: { make: buildTea, ground: -0.485, focus: 1.60, size: 10.1, width: 11.8, x: 0, z: 0, shadow: 9 },
};

export function createWorld(host, hotspots, onAction) {
  const stage = host.closest('.stage');
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  const compactLayout = matchMedia('(max-width: 750px)');
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.14;
  renderer.setClearColor(0, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const hemisphere = new THREE.HemisphereLight('#f3e7ca', '#a49473', 1.7);
  scene.add(hemisphere);
  const sun = new THREE.DirectionalLight('#ffe0a7', 2.8);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 0.5, far: 48 });
  sun.shadow.bias = -0.00024;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 2;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#b8d1ff', 0.36);
  fill.position.set(1, 4, 7);
  scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), new THREE.ShadowMaterial({ opacity: 0.20, color: '#464932' }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const tiles = Object.fromEntries(Object.entries(tileDefinitions).map(([key, settings]) => {
    const lamps = [];
    const tile = { ...settings, lamps, ...settings.make(scene, lamps) };
    tile.root.visible = false;
    return [key, tile];
  }));
  host.appendChild(renderer.domElement);
  const pins = Array.from(hotspots.querySelectorAll('button'), button => ({ button, point: new THREE.Vector3(...tiles.street.anchors[button.dataset.place]) }));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active;
  let width = 1, height = 1;
  let yaw = Math.PI / 4, pitch = 0.49, zoom = 1;
  let goalYaw = yaw, goalPitch = pitch, goalZoom = zoom;
  let gardenMix = 0, goalGarden = 0;
  let previousHour = -1;
  let dirty = true;
  let shadowElapsed = 0;
  let shadowPending = false;
  let motionPending = false;
  let renderElapsed = 0;
  let shadowSize;
  const pointers = new Map();
  const direction = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const center = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const hitPoint = new THREE.Vector2();
  const skyCenter = new THREE.Color();
  const skyEdge = new THREE.Color();
  const daylight = new THREE.Color();
  const dawn = new THREE.Color('#ffd39b');
  const noon = new THREE.Color('#fff2d4');
  const night = new THREE.Color('#97b8ec');
  const daySky = new THREE.Color('#f7ead2');
  const nightSky = new THREE.Color('#91a7d8');

  function resize() {
    width = host.clientWidth || 1;
    height = host.clientHeight || 1;
    const compact = compactLayout.matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.4 : 1.75));
    renderer.setSize(width, height, false);
    const nextShadowSize = compact ? 1024 : 2048;
    if (nextShadowSize !== shadowSize) {
      shadowSize = nextShadowSize;
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
      sun.shadow.mapSize.setScalar(shadowSize);
      renderer.shadowMap.needsUpdate = true;
    }
    dirty = true;
  }

  function reset() {
    goalYaw = Math.PI / 4;
    goalPitch = 0.49;
    goalZoom = 1;
    goalGarden = 0;
    dirty = true;
  }

  function select(key) {
    if (tiles[key] === active) return;
    if (active) {
      active.leave?.();
      active.root.visible = false;
    }
    active = tiles[key];
    active.root.visible = true;
    floor.position.y = active.ground;
    const range = active.shadow;
    Object.assign(sun.shadow.camera, { left: -range, right: range, top: range, bottom: -range });
    sun.shadow.camera.updateProjectionMatrix();
    sun.target.position.set(active.x, 0, active.z);
    previousHour = -1;
    reset();
    yaw = goalYaw;
    pitch = goalPitch;
    zoom = goalZoom;
    gardenMix = 0;
    if (!reducedMotion) {
      host.getAnimations().forEach(animation => animation.cancel());
      host.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
    }
  }

  function updateCamera() {
    const aspect = width / height;
    const compact = compactLayout.matches;
    const minWidth = compact ? active.width : active === tiles.street ? 26 : 14.5;
    const overview = Math.max(active.size, minWidth / aspect);
    const vertical = THREE.MathUtils.lerp(overview, Math.max(5.1, 7.8 / aspect), gardenMix) / zoom;
    const horizontal = vertical * aspect;
    camera.left = -horizontal / 2;
    camera.right = horizontal / 2;
    camera.top = vertical / 2;
    camera.bottom = -vertical / 2;
    camera.updateProjectionMatrix();
    direction.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));
    up.crossVectors(direction, right);
    center.set(
      THREE.MathUtils.lerp(active.x, 4.2, gardenMix),
      THREE.MathUtils.lerp(active.focus, 0.88, gardenMix),
      THREE.MathUtils.lerp(active.z, -5.58, gardenMix),
    );
    center.addScaledVector(right, compact ? 0 : -horizontal * (active === tiles.street ? 0.10 : 0.136) * (1 - 0.25 * gardenMix));
    center.addScaledVector(up, vertical * 0.005);
    camera.position.copy(center).addScaledVector(direction, 27);
    camera.lookAt(center);
    camera.updateMatrixWorld();

    if (active !== tiles.street) return;
    for (const { button, point } of pins) {
      projected.copy(point).project(camera);
      const anchorX = (projected.x + 1) * 0.5 * width;
      const y = (1 - projected.y) * 0.5 * height;
      button.hidden = gardenMix > 0.12 || anchorX < 0 || anchorX > width || y < 0 || y > height;
      if (button.hidden) continue;
      const study = button.dataset.place === 'study';
      const offsetX = study ? (compact ? 12 : 33) : -button.offsetWidth - (compact ? 9 : 17);
      const bottomMargin = compact ? 8 : 43;
      button.style.left = THREE.MathUtils.clamp(anchorX + offsetX, 8, width - button.offsetWidth - 8) + 'px';
      button.style.top = THREE.MathUtils.clamp(y - button.offsetHeight / 2, 8, height - button.offsetHeight - bottomMargin) + 'px';
    }
  }

  function updateSky(hour) {
    const solarAngle = (hour - 5.5) / 13 * Math.PI;
    const altitude = Math.sin(solarAngle);
    const day = THREE.MathUtils.smoothstep(altitude, -0.16, 0.37);
    const gold = THREE.MathUtils.smoothstep(altitude, 0.03, 0.81);
    sun.position.set(active.x - Math.cos(solarAngle) * 15, 2.6 + Math.max(0, altitude) * 13, active.z + 5.5 - Math.cos(solarAngle) * 6.5);
    sun.color.copy(daylight.copy(dawn).lerp(noon, gold).lerp(night, 1 - day));
    sun.intensity = (0.19 + 2.8 * day * (0.6 + 0.4 * gold)) * (active === tiles.tea ? 0.80 : 1);
    hemisphere.color.copy(nightSky).lerp(daySky, day);
    hemisphere.intensity = 0.63 + 0.90 * day;
    fill.intensity = 0.29 + 0.25 * day;
    floor.material.opacity = 0.035 + 0.22 * day;

    const rightIndex = skies.findIndex(([time]) => time > hour);
    const [fromHour, fromCenter, fromEdge] = skies[rightIndex - 1];
    const [toHour, toCenter, toEdge] = skies[rightIndex];
    const blend = (hour - fromHour) / (toHour - fromHour);
    stage.style.setProperty('--sky', skyCenter.copy(fromCenter).lerp(toCenter, blend).getStyle());
    stage.style.setProperty('--sky-edge', skyEdge.copy(fromEdge).lerp(toEdge, blend).getStyle());
    stage.classList.toggle('dark-sky', hour < 5.4 || hour > 19.25);

    const lamplight = (1 - day) * 0.88 + 0.28;
    for (const { light, glow, strength, enabled = true } of active.lamps) {
      if (light) light.intensity = enabled ? strength * lamplight : 0;
      glow.emissiveIntensity = enabled ? lamplight * 0.73 : 0;
    }
    renderer.shadowMap.needsUpdate = true;
  }

  function render(hour, delta) {
    if (!active) return;
    const lightChanged = hour !== previousHour;
    if (lightChanged) {
      updateSky(hour);
      previousHour = hour;
    }
    let moved = false;
    if (Math.abs(goalYaw - yaw) + Math.abs(goalPitch - pitch) + Math.abs(goalZoom - zoom) + Math.abs(goalGarden - gardenMix) > 0.0001) {
      const blend = reducedMotion ? 1 : 1 - Math.exp(-delta * 13);
      yaw += (goalYaw - yaw) * blend;
      pitch += (goalPitch - pitch) * blend;
      zoom += (goalZoom - zoom) * blend;
      gardenMix += (goalGarden - gardenMix) * blend;
      moved = true;
    }
    const animated = active.update(delta, reducedMotion);
    shadowElapsed += delta;
    renderElapsed += delta;
    motionPending ||= animated;
    shadowPending ||= animated;
    if (shadowPending && shadowElapsed >= (compactLayout.matches ? 0.14 : 0.075)) {
      renderer.shadowMap.needsUpdate = true;
      shadowPending = false;
      shadowElapsed = 0;
    }
    if (dirty || moved) updateCamera();
    if (dirty || moved || lightChanged || (motionPending && renderElapsed >= 1 / 32)) {
      renderer.render(scene, camera);
      renderElapsed = 0;
      motionPending = false;
    }
    dirty = false;
  }

  const canvas = renderer.domElement;
  function zoomBy(ratio) {
    goalZoom = THREE.MathUtils.clamp(goalZoom * ratio, 0.68, 1.86);
  }

  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointers.size >= 2) return;
    if (pointers.size && event.pointerType !== 'touch') return;
    for (const pointer of pointers.values()) pointer.travel = Infinity;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, travel: pointers.size ? Infinity : 0 });
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const next = {
      x: event.clientX,
      y: event.clientY,
      travel: previous.travel + Math.hypot(event.clientX - previous.x, event.clientY - previous.y),
    };
    if (pointers.size === 2) {
      const other = [...pointers].find(([id]) => id !== event.pointerId)[1];
      const before = Math.hypot(other.x - previous.x, other.y - previous.y);
      const after = Math.hypot(other.x - next.x, other.y - next.y);
      if (before > 4 && after > 4) zoomBy(after / before);
    } else {
      goalYaw -= (next.x - previous.x) * 0.008;
      goalPitch = THREE.MathUtils.clamp(goalPitch + (next.y - previous.y) * 0.005, 0.25, 1.08);
    }
    pointers.set(event.pointerId, next);
  });
  canvas.addEventListener('pointerup', event => {
    const pointer = pointers.get(event.pointerId);
    if (!pointer || pointer.travel > 7 || !active) return;
    const bounds = canvas.getBoundingClientRect();
    hitPoint.set((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2);
    raycaster.setFromCamera(hitPoint, camera);
    const hit = raycaster.intersectObject(active.root, true).find(({ object }) => object.visible);
    for (let object = hit?.object; object && object !== active.root; object = object.parent) {
      if (object === active.door) {
        onAction('door');
        return;
      }
      const action = active.actions.findIndex(candidate => candidate.target === object);
      if (action !== -1) {
        onAction(action);
        return;
      }
    }
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, event => pointers.delete(event.pointerId));
  }
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    zoomBy(Math.exp(-event.deltaY * 0.0011));
  }, { passive: false });
  compactLayout.addEventListener('change', resize);
  new ResizeObserver(resize).observe(host);
  resize();
  return {
    select, reset, render,
    actions: () => active.actions,
    showGarden(show) {
      reset();
      if (!show) return;
      goalGarden = 1;
      goalYaw = 2.65;
      goalPitch = 0.81;
    },
    enterTea(go) { active.openDoor?.(place => queueMicrotask(() => go(place))); },
    perform(index) {
      const message = active.actions[index].run();
      previousHour = -1;
      dirty = true;
      return message;
    },
  };
}
