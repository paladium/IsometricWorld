import './style.css';
import { createWorld } from './world.js';

const icons = {
  mark: '<path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19"/><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5m-11 11L5 19"/>',
  moon: '<path d="M20.9 13.3A9 9 0 0 1 10.7 3.1 9 9 0 1 0 20.9 13.3Z"/>',
  play: '<path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M9 5v14m6-14v14" stroke-width="2.5"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  cursor: '<path d="m5 3 14 10-7 1-3 6-4-17Z"/>',
  reset: '<path d="M4 11a8 8 0 1 1 2 7M4 5v6h6"/>',
  street: '<path d="m3 10 9-6 9 6v10H3Zm6 10v-6h6v6"/>',
  study: '<path d="M3 18V6m0 8h18v6m-18-2h18M7 14V9h8a4 4 0 0 1 4 4v1"/>',
  ramen: '<path d="M3 12h18a9 9 0 0 1-18 0Zm5 8h8M7 9l11-6M10 9l9-4"/>',
  tea: '<path d="M4 9h13v3a6.5 6.5 0 0 1-13 0Zm13 1h2a2 2 0 1 1 0 4h-2M3 20h17M8 3v3m5-3v3"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const places = {
  street: { jp: '通り', name: 'Corner Street', title: 'A little corner <br>of <em>Japan.</em>', copy: 'Follow the bike lane past the ramen shop, or find the bamboo fountain behind the houses.' },
  study: { jp: '書斎', name: 'The Study', title: 'The <em>Study.</em>', copy: 'Settle in, save a coin, or switch on the retro computer.' },
  ramen: { jp: '食堂', name: 'Ramen Shop', title: 'The <em>Ramen Shop.</em>', copy: 'Take a seat at the counter for a bowl of ramen or a plate of sushi.' },
  tea: { jp: '茶室', name: 'The Tea Room', title: 'The <em>Tea Room.</em>', copy: 'Slide the shōji blinds open and pour a cup of tea.' },
};
const app = document.querySelector('#app');
app.innerHTML = `
  <header class="header">
    <div class="brand"><span class="brand-mark">${icon('mark')}</span><span>komorebi<span class="brand-jp" lang="ja">木漏れ日</span></span></div>
    <span class="header-caption">A JAPANESE DIORAMA</span>
  </header>
  <main class="experience">
    <section class="stage" aria-label="Isometric world">
      <div class="intro">
        <div class="eyebrow"><span></span><b id="place-jp" lang="ja"></b><i></i><span id="place-name"></span></div>
        <h1 id="title"></h1>
        <p id="description"></p>
      </div>
      <div class="viewport">
        <div id="world"></div>
        <div class="hotspots" id="hotspots">
          <button class="hotspot" data-place="study"><span class="pin-dot"></span><span>The Study<small>UPSTAIRS</small></span>${icon('arrow')}</button>
          <button class="hotspot" data-place="ramen"><span class="pin-dot"></span><span>Ramen Shop<small>ENTER</small></span>${icon('arrow')}</button>
          <button class="hotspot" data-place="tea"><span class="pin-dot"></span><span>Open tea room door<small>GROUND FLOOR</small></span>${icon('arrow')}</button>
        </div>
        <div id="fallback" class="fallback" hidden>3D rendering is unavailable in this browser. Open Komorebi in a WebGL 2 capable browser to explore the diorama.</div>
      </div>
      <div class="stage-tools">
        <span class="mouse-help">${icon('cursor')} Drag to rotate · Scroll to zoom</span>
        <span class="touch-help">Swipe to rotate · Pinch to zoom</span>
        <button id="reset" aria-label="Reset camera" title="Reset camera">${icon('reset')}</button>
      </div>
    </section>
    <div class="scene-actions" id="scene-actions" hidden>
      <span class="control-label">INTERACT</span>
      <div id="action-buttons" role="group" aria-label="Scene interactions"></div>
      <div id="action-status" class="sr-only" role="status"></div>
    </div>
    <section class="controls" aria-label="World controls">
      <div class="places">
        <span class="control-label">EXPLORE</span>
        <nav aria-label="Places">
        ${Object.entries(places).map(([id, location]) => `<button data-place="${id}">${icon(id)}<span>${location.name}</span></button>`).join('')}
        </nav>
      </div>
      <div class="time">
        <div class="clock">
          <div class="clock-icon" id="phase-icon">${icon('sun')}</div>
          <div><output id="clock" for="time"></output><span class="control-label" id="phase"></span></div>
        </div>
        <div class="timeline">
          <label class="sr-only" for="time">Local time</label>
          <input id="time" type="range" min="0" max="1439" step="1" value="975">
          <div class="ticks" aria-hidden="true"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
        </div>
        <div class="playback">
          <button id="play" aria-label="Play time" title="Play time"></button>
          <label class="sr-only" for="speed">Time speed</label>
          <select id="speed" title="Time speed"><option value="1">1×</option><option value="10">10×</option><option value="30">30×</option><option value="60">60×</option></select>
        </div>
      </div>
    </section>
  </main>
  <footer><span>KOMOREBI <span lang="ja">木漏れ日</span></span><span>LOCAL TIME · JST</span></footer>
`;

const id = value => document.getElementById(value);
const slider = id('time');
const play = id('play');
const speed = id('speed');
let minutes = Number(slider.value);
let isPlaying = false;
let world;
let lastPhase;
let lastMinute;
let currentPlace;
let gardenFocused = false;

function refreshActions() {
  const container = id('action-buttons');
  world.actions().forEach((action, index) => {
    const button = container.children[index];
    button.textContent = action.label();
    button.disabled = action.disabled?.() ?? false;
    if (!action.pressed) return;
    const pressed = action.pressed();
    const state = document.createElement('span');
    state.textContent = currentPlace === 'tea' ? (pressed ? 'Open' : 'Closed') : (pressed ? 'On' : 'Off');
    state.setAttribute('aria-hidden', 'true');
    button.append(state);
    button.setAttribute('aria-pressed', String(pressed));
  });
}

function interact(action) {
  if (action === 'ramen') {
    selectPlace('ramen');
    document.querySelector('nav [data-place="ramen"]').focus({ preventScroll: true });
    return;
  }
  if (action === 'door') {
    world.enterTea(place => {
      selectPlace(place);
      document.querySelector('nav [data-place="tea"]').focus({ preventScroll: true });
    });
    return;
  }
  const message = world.perform(action);
  refreshActions();
  if (message) id('action-status').textContent = message;
}

function selectPlace(key) {
  if (key === currentPlace) {
    resetCamera();
    return;
  }
  currentPlace = key;
  gardenFocused = false;
  const place = places[key];
  document.querySelectorAll('nav [data-place]').forEach(button => {
    if (button.dataset.place === key) button.setAttribute('aria-current', 'location');
    else button.removeAttribute('aria-current');
  });
  id('place-jp').textContent = place.jp;
  id('place-name').textContent = place.name;
  id('title').innerHTML = place.title;
  id('description').textContent = place.copy;
  id('hotspots').hidden = key !== 'street' || !world;
  if (!world) return;
  world.select(key);
  const status = id('action-status');
  status.textContent = '';
  status.className = key === 'ramen' ? 'meal-status' : 'sr-only';
  const row = id('scene-actions');
  const container = id('action-buttons');
  container.replaceChildren(...world.actions().map((_, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.addEventListener('click', () => interact(index));
    return button;
  }));
  refreshActions();
  if (key === 'street') {
    const garden = document.createElement('button');
    garden.type = 'button';
    garden.id = 'garden-view';
    garden.textContent = 'View garden';
    garden.setAttribute('aria-pressed', 'false');
    garden.addEventListener('click', () => {
      gardenFocused = !gardenFocused;
      garden.setAttribute('aria-pressed', String(gardenFocused));
      world.showGarden(gardenFocused);
    });
    container.append(garden);
  }
  row.hidden = !container.childElementCount;
}

function updateClock() {
  const minute = Math.floor(minutes);
  if (minute === lastMinute) return;
  lastMinute = minute;
  const hour = minute / 60;
  const timeText = `${String(Math.floor(hour)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
  const phase = hour < 5 || hour >= 20 ? 'Night' : hour < 7 ? 'Dawn' : hour < 12 ? 'Morning' : hour < 16 ? 'Daylight' : hour < 18.5 ? 'Golden hour' : 'Dusk';
  id('clock').value = timeText;
  slider.value = minute;
  slider.setAttribute('aria-valuetext', timeText + ' ' + phase);
  if (lastPhase !== phase) {
    id('phase').textContent = phase;
    id('phase-icon').innerHTML = icon(phase === 'Night' || phase === 'Dusk' ? 'moon' : 'sun');
    lastPhase = phase;
  }
}
function setPlaying(value) {
  isPlaying = value;
  const action = value ? 'Pause time' : 'Play time';
  play.innerHTML = icon(value ? 'pause' : 'play');
  play.title = action;
  play.setAttribute('aria-label', action);
}

document.querySelectorAll('[data-place]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.place === 'tea' && currentPlace === 'street' && world) {
      interact('door');
      return;
    }
    selectPlace(button.dataset.place);
    if (button.classList.contains('hotspot')) {
      document.querySelector(`nav [data-place="${button.dataset.place}"]`).focus();
    }
  });
});
slider.addEventListener('input', () => {
  setPlaying(false);
  minutes = Number(slider.value);
  updateClock();
});
play.addEventListener('click', () => setPlaying(!isPlaying));
function resetCamera() {
  gardenFocused = false;
  id('garden-view')?.setAttribute('aria-pressed', 'false');
  world?.reset();
}
id('reset').addEventListener('click', resetCamera);
try {
  world = createWorld(id('world'), id('hotspots'), interact);
} catch (error) {
  console.error('Unable to start the diorama', error);
  id('fallback').hidden = false;
  document.querySelector('.stage-tools').hidden = true;
}

selectPlace('street');
setPlaying(false);
updateClock();
let lastFrame = performance.now();
function frame(now) {
  const delta = Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;
  if (isPlaying) {
    minutes = (minutes + delta * Number(speed.value) * 2) % 1440;
    updateClock();
  }
  world?.render(minutes / 60, delta);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
