# Komorebi city builder

**Status** · Proposal for the next feature.

Keep Corner Street as a playable example and add **Start an empty street**. Give players a road, a few open lots, and a catalog of Japanese buildings and outdoor spaces. They can place, rotate, move, and remove pieces, undo edits, and extend the street as the city grows.

Start with roughly a dozen pieces, including a ramen shop, a small house, a traditional machiya townhouse, apartments, a skyscraper, a tea room, a pocket garden, a bamboo fountain, and bike lanes. Offer variants through roof styles, façades, signs, awnings, and colors. Expand the catalog after the first set works together. The first version is a free-build sandbox. Budgets, zoning, and traffic management can wait.

The city should be worth exploring once it is built. A placed ramen shop should let visitors go inside and order. Connected bike lanes should carry cyclists, and a garden should give visitors somewhere to watch the light change. Later, pedestrians visiting shops and windows lighting up at dusk could make different layouts feel distinct.

## Save and share

Use one versioned city snapshot for both saving and sharing. Store the city name, map size, streets and connections, and each placed piece's catalog ID, grid position, rotation, and selected variant. Keep catalog IDs stable and resolve them to reusable Three.js assets when loading a city.

1. **Save drafts.** Start with local browser storage so a player can reload and keep building on the same device.
2. **Share a snapshot.** Start with a copyable link that encodes a compact snapshot in the URL fragment. A recipient opens the city in Explore mode and can copy it into their own editable draft. This approach can work with the existing static GitHub Pages site.
3. **Publish larger cities.** If city snapshots outgrow practical share links, store published snapshots behind short IDs and use a link such as `?city=<id>`. A public gallery can build on that storage if players want to discover cities beyond direct links. Keep private drafts local until the player chooses to share.

The first milestone is a small city that can be built from an empty street, reopened after a reload, and shared to another browser with its layout and interactive destinations intact.
