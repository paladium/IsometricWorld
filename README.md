# Komorebi

A Three.js diorama inspired by a Japanese corner shop. Open the upstairs Study or the ground-floor Tea Room from the street markers or the Explore bar. Drag or swipe to orbit, scroll or pinch to zoom, and use the reset button to restore the opening view.

See the [handoff notes](HANDOFF.md) for current progress, source locations, and remaining verification.

Use the Interact buttons or click the objects in the scene. The tea room door swings open before you enter. Inside, slide the shōji and pour tea. The Study has a piggy bank, a lamp, and a computer you can switch off and on. At the ramen shop, order ramen or sushi, eat it one bite at a time, and reorder from the counter. On the street, toggle the air conditioner or select **View garden** for a close-up of the bamboo fountain.

Scrub the clock or press play to watch the shared day-night cycle. The playback multiplier runs relative to the base rate of two simulated minutes per real second. The clock continues across scene changes and wraps at midnight.

## Build and share a city

Choose **Build a city** to start with an empty street. Pick a catalog piece and tap an empty lot, or use a template to place an entire block. Select an existing lot to rotate, move, remove, or duplicate it. Switch to **Explore** to enter shops and homes.

Use **Save draft** to reopen the layout in the same browser. **Share** provides a link to small cities. Large cities can be shared as files using **Export** and **Import**. Shared links open in Explore mode with an option to make an editable copy.

Choose **10,000-building map** to try the large city. City, District, and Street change the map detail. **Rendering metrics** shows loaded chunks, draw calls, triangles, and CPU timings.

## Walk through a city

Choose **Walk Lantern Lane** for a ready-made dusk route, or choose **Walk** in your own city. Tap a street, park, or storefront to walk there. **Nearby stops** offers destinations you can choose from the controls. Connect each storefront's front to a street, bike path, or park, and rotate the building where needed.

Sit at a bench, buy green tea from a vending machine with the walk's ¥300 allowance, or enter a shop and use **Back to city** to return to its doorway. Street lanterns light up as the city clock moves toward night. Use **Share** during a walk to include its starting lot and time in the link.

## Run locally

```sh
npm ci
npm run dev
```

The terminal prints the local preview address. Build deployable static files with `npm run build`. The 3D view requires WebGL 2.

## Source

- `src/components.js` contains reusable materials, geometry helpers, framed windows, signs, lanterns, planters, and furniture.
- `src/street.js` builds the corner shop, sidewalks, awnings, trees, and bicycle.
- `src/neighborhood.js` builds the ramen shop, nearby homes, bike lane, and garden.
- `src/rooms.js` builds the two cutaway interiors from a shared room shell.
- `src/world.js` owns the orthographic camera, projected room markers, and shared sky and lighting.

## GitHub Pages

In the GitHub repository, open **Settings → Pages** and choose **GitHub Actions** as the source. Push to `main` or run **Deploy to GitHub Pages** from the Actions tab. The workflow builds the site and publishes `dist`. The deployment job provides the site URL.
