import { catalog } from './model.js';

const art = {
  select: '<path fill="#eee4c7" d="m7 6 18 13-9 1-4 8z"/>',
  house: '<path fill="#e4c7a3" d="M6 14h20v13H6z"/><path fill="#779387" d="m3 15 13-10 13 10z"/><path fill="#926c55" d="M18 19h5v8h-5z"/><path fill="#f7dfa4" d="M9 18h5v5H9z"/>',
  machiya: '<path fill="#c9956d" d="M6 13h20v14H6z"/><path fill="#7f777b" d="m2 14 5-6h18l5 6zM4 20l3-4h18l3 4z"/><path fill="#f0ce94" d="M9 21h14v6H9z"/><path d="M13 21v6m6-6v6"/>',
  ramen: '<path fill="#e1ab87" d="M5 11h22v16H5z"/><path fill="#a95748" d="M4 8h24v7H4z"/><path fill="#f6d9ab" d="M10 17h12a6 6 0 0 1-12 0z"/><path d="M13 25h6m-6-14h6"/>',
  tea: '<path fill="#d9c5a4" d="M5 11h22v16H5z"/><path fill="#6a9385" d="m4 8 24 0 1 6H3z"/><path fill="#f7dda5" d="M11 17h9v3a4.5 4.5 0 0 1-9 0z"/><path d="M20 18h2a1.5 1.5 0 0 1 0 3h-2"/>',
  apartment: '<path fill="#a9b8a5" d="M7 7h18v20H7z"/><path fill="#7f9382" d="M6 5h20v4H6z"/><path stroke="#f9e3a7" stroke-width="2" d="M11 13h3m4 0h3m-10 5h3m4 0h3m-10 5h3m4 0h3"/>',
  skyscraper: '<path fill="#8caab5" d="m9 7 9-4 6 3v21H9z"/><path fill="#648797" d="M18 3v24h6V6z"/><path stroke="#ecdfb0" d="M12 10h3m-3 4h3m-3 4h3m-3 4h3m6-12v2m0 3v2m0 3v2"/>',
  garden: '<path fill="#a8b780" d="M3 22c3-7 23-7 26 0l-4 5H7z"/><path fill="#789969" d="M5 16a5 5 0 1 1 10 0z"/><path fill="#91ac78" d="M16 17a5 5 0 1 1 10 0z"/><path stroke="#f3dfad" stroke-width="2" d="m10 25 6-3 6-1"/>',
  fountain: '<ellipse fill="#929f92" cx="16" cy="23" rx="12" ry="5"/><ellipse fill="#8ec2c0" cx="16" cy="21" rx="10" ry="3"/><path fill="#a6aa6d" d="m7 19 2-12 3 1-1 3 10-2 1 3-12 3-1 4z"/><path stroke="#6b9ea6" d="m21 14-2 4"/>',
  trees: '<path stroke="#86684f" stroke-width="2" d="M11 17v10m11-15v15"/><circle fill="#dda3a7" cx="11" cy="15" r="6"/><circle fill="#cb8791" cx="22" cy="11" r="6"/><path stroke="#fff1dc" d="m9 13 2-1m9-3 2-1"/>',
  plaza: '<path fill="#c9b8a0" d="m16 6 13 8v6l-13 8-13-8v-6z"/><path fill="#e1d4bf" d="m3 14 13-8 13 8-13 8z"/><path d="m10 10 13 8m-13 0 13-8m-7 12v6"/>',
  road: '<path fill="#828880" d="M4 22 22 5l6 6L10 28z"/><path stroke="#fff0c0" d="m9 23 3-3m3-3 3-3m3-3 3-3"/>',
  bike: '<path fill="#a4bea5" d="M3 9h26v15H3z"/><circle fill="none" cx="10" cy="19" r="3.5"/><circle fill="none" cx="22" cy="19" r="3.5"/><path d="m10 19 4-7 4 7h-8m8 0 2-7 2 7m-3-7h3m-10 0h3"/>',
  bench: '<path fill="#b68c61" d="M5 10h22v8H5zm-2 9h26v4H3z"/><path d="M7 23v5m18-5v5"/>',
  vending: '<rect fill="#b95749" x="7" y="4" width="18" height="24" rx="2"/><path fill="#fff0c8" d="M10 7h12v10H10z"/><path d="M11 22h7m2-3h2"/>',
  lantern: '<path fill="#9e7854" d="m9 12 7-6 7 6zM14 21h4v7h-4z"/><path fill="#fbd186" d="M11 12h10v9H11z"/><path d="M16 12v9"/>',
  homes: '<path fill="#dcb895" d="M5 17h10v10H5zm12-5h10v15H17z"/><path fill="#6f8d7b" d="m3 18 7-7 7 7zm12-5 7-7 7 7z"/><path d="M9 22v5m13-10v3"/>',
  downtown: '<path fill="#a4b39f" d="M4 15h9v12H4z"/><path fill="#91aeb8" d="M13 5h9v22h-9z"/><path fill="#c59478" d="M22 12h6v15h-6z"/><path stroke="#f7e2ae" d="M16 10h3m-3 5h3m-3 5h3M7 19h3m-3 4h3"/>',
};

export function paletteButton(key, label, attributes) {
  return `<button type="button" class="city-piece" ${attributes}><svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" fill="none" stroke="#514d40" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">${art[key]}</svg><span>${label}</span></button>`;
}

const groups = [
  ['Buildings', ['house', 'machiya', 'ramen', 'tea', 'apartment', 'skyscraper']],
  ['Outdoors', ['garden', 'fountain', 'trees', 'plaza']],
  ['Routes', ['road', 'bike']],
  ['Street details', ['bench', 'vending', 'lantern']],
];

export const catalogButtons = groups.map(([label, keys]) => `
  <div role="group" aria-label="${label}">
    <div class="control-label">${label}</div>
    <div class="city-piece-grid">${keys.map(key => paletteButton(key, catalog[key].name, `data-piece="${key}" aria-pressed="false"`)).join('')}</div>
  </div>
`).join('');
