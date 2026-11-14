# Komorebi handoff

The latest application change is `e2bc7a1`. Its [GitHub Pages deployment](https://github.com/paladium/IsometricWorld/actions/runs/43610904649) succeeded and the live page served the new build. [Play Komorebi](https://paladium.github.io/IsometricWorld/).

## Completed work

- Corner Street opens on an isometric neighborhood with an air conditioner you can toggle, cyclists using a dedicated lane, and a garden with a flowing bamboo fountain. **View garden** moves the camera to the fountain.
- The tea room door swings open before entry. Inside, visitors can slide the shōji screens and pour tea. In the upstairs Study, visitors can save ¥100 at a time and switch the lamp and computer on or off.
- The Ramen Shop is accessible from the street entrance and the **Explore** bar. Visitors can order ramen and sushi independently, eat each in three bites, and reorder after finishing.
- The simulated clock carries across scenes and supports scrubbing and playback up to 60×. Cyclist positions and their shadow maps update in the same rendered frame.

## Run and deploy

Use Node.js 22 and a browser with WebGL 2. Run `npm ci` and `npm run dev` for local development. Run `npm run build` to produce `dist/`, then `npm run preview` to serve the build locally.

Pushes to `main` trigger [the Pages workflow](.github/workflows/pages.yml). Vite builds with relative asset paths so the app loads under the `/IsometricWorld/` project path.

## Where to work

- [src/main.js](src/main.js) connects navigation, interaction controls, and the time slider to the scenes.
- [src/world.js](src/world.js) owns the camera, touch and mouse input, lighting, and render loop. Keep moving objects and their shadow map on the same rendered frame.
- [src/street.js](src/street.js) and [src/neighborhood.js](src/neighborhood.js) build the exterior and animate the cyclists and fountain.
- [src/rooms.js](src/rooms.js) builds the Study and Tea Room and provides the shared cutaway room shell. [src/ramen.js](src/ramen.js) builds the Ramen Shop and manages the two independent meal states.
- [src/components.js](src/components.js) contains reusable scene objects. [src/animation.js](src/animation.js) contains the shared transition and one-shot animation helpers.

## Verification and open checks

The production build passed. Desktop and narrow browser previews exercised room entry and interaction controls. The 360 px preview covered the full order, eat, and reorder flow for both dishes. Physical phone testing of pinch zoom and rendering performance is still open.

Room interactions and the clock use in-memory state. Moving between scenes preserves that state, and reloading resets it.

## Next feature

The [city-builder roadmap](ROADMAP.md) records the proposed building tools, starter catalog, and options for saving and sharing cities.
