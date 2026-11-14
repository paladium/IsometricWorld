# Komorebi city builder

**Status** · The first city builder and 10,000-building test map are implemented. Hosted publication and physical device performance testing are future work.

Keep Corner Street as a playable example and add **Start an empty street**. Give players a road, a few open lots, and a catalog of Japanese buildings and outdoor spaces. They can place, rotate, move, and remove pieces, undo edits, and extend the street as the city grows.

Start with roughly a dozen pieces, including a ramen shop, a small house, a traditional machiya townhouse, apartments, a skyscraper, a tea room, a pocket garden, a bamboo fountain, and bike lanes. Offer variants through roof styles, façades, signs, awnings, and colors. Expand the catalog after the first set works together. The first version is a free-build sandbox. Budgets, zoning, and traffic management can wait.

The city should be worth exploring once it is built. A placed ramen shop should let visitors go inside and order. Connected bike lanes should carry cyclists, and a garden should give visitors somewhere to watch the light change. Later, pedestrians visiting shops and windows lighting up at dusk could make different layouts feel distinct.

## Save and share

Use one versioned city snapshot for both saving and sharing. Store the city name, map size, streets and connections, and each placed piece's catalog ID, grid position, rotation, and selected variant. Keep catalog IDs stable and resolve them to reusable Three.js assets when loading a city.

1. **Save drafts.** Start with local browser storage so a player can reload and keep building on the same device.
2. **Share a snapshot.** Start with a copyable link that encodes a compact snapshot in the URL fragment. A recipient opens the city in Explore mode and can copy it into their own editable draft. This approach can work with the existing static GitHub Pages site.
3. **Publish larger cities.** If city snapshots outgrow practical share links, store published snapshots behind short IDs and use a link such as `?city=<id>`. A public gallery can build on that storage if players want to discover cities beyond direct links. Keep private drafts local until the player chooses to share.

The first milestone is a small city that can be built from an empty street, reopened after a reload, and shared to another browser with its layout and interactive destinations intact.

## Growing to Tokyo scale

Aim for a fictional metropolis that can stretch across many districts. At city zoom, show the routes, districts, and skyline. Zoom into a neighborhood to lay out blocks and streets, then into a lot to place and customize an individual house. District templates and block duplication can speed up building a large city. Each placed building should still be selectable and editable on its own.

- **Keep one authoritative city model.** Store persistent building IDs, catalog IDs, footprints, and transforms in spatial chunks. Give streets and bike lanes a connected graph that crosses chunk boundaries. Resolve a selected building to the same ID at every zoom level. Interior controls belong to the individual building, so two ramen shops can keep separate state.
- **Load and render only the detail the view can show.** Keep a lightweight hierarchy of district and block summaries for the overview. Near the camera, stream visible chunks plus a small margin for panning. Batch repeated meshes by geometry and material within each chunk. Use simplified buildings at neighborhood zoom and skyline silhouettes at city zoom. Load cutaway interiors on entry. A change to one house should rebuild its chunk and the affected summaries.
- **Concentrate activity where players can see it.** Run detailed cyclists, pedestrians, lighting, and shop interactions near the camera. Represent distant activity with a coarse update or derive it from the shared clock when the player returns. Keep detailed shadows local and update moving casters and their shadows on the same rendered frame. Use simpler lighting in the overview.
- **Save and publish by chunk.** Move large local drafts to IndexedDB and save edited chunks independently. A published city can use a short URL that loads a versioned manifest and fetches chunks as needed. Keep self-contained URL snapshots for small builds. A share link to a published revision should reopen that layout even if its creator keeps editing the draft.

The current Three.js diorama already batches tree foliage and lowers shadow resolution on compact screens. Keep Three.js for the first scale test. Benchmark a hand-built neighborhood and a generated map with 10,000 individually editable buildings before expanding the catalog. Test overview zoom, rapid panning, lot selection, live street interactions, and save/reopen on a physical phone and a desktop. Track frame time, draw calls, memory, and chunk load time. Use 30 fps on the test phone as an initial target. The generated map is a step toward establishing the limit of the renderer. Repeat the benchmark at larger counts before committing to a city size.
