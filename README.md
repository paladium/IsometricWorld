# Komorebi

A Three.js diorama inspired by a Japanese corner shop. Open the upstairs Study or the ground-floor Tea Room from the street markers or the Explore bar. Drag or swipe to orbit, scroll or pinch to zoom, and use the reset button to restore the opening view.

Use the Interact buttons or click the objects in the scene. The tea room door swings open before you enter. Inside, slide the shōji and pour tea. The Study has a piggy bank, a lamp, and a computer you can switch off and on. On the street, toggle the air conditioner or select **View garden** for a close-up of the bamboo fountain.

Scrub the clock or press play to watch the shared day-night cycle. The playback multiplier runs relative to the base rate of two simulated minutes per real second. The clock continues across scene changes and wraps at midnight.

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
