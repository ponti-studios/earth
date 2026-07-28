# Earth Intelligence App

A global monitoring dashboard built with Svelte 5, TypeScript, and CesiumJS.

## Features

### 🛰️ Live Satellite Tracking

- Real-time ISS position via "Where the ISS at" API
- Track multiple satellites including Tiangong space station and Hubble
- Visual orbit paths with glowing polylines
- Auto-updates every 5 seconds
- Click "Fly To" to zoom to any satellite
- Toggle orbit visibility per satellite

## Architecture

### Cesium State Management

Cesium state is kept **imperative** and **not mirrored** in Svelte framework state. The `CesiumViewer` custom element wraps Cesium and exposes a minimal imperative API:

```typescript
// Available methods on the viewer
viewer.flyTo(longitude, latitude, height, duration);
viewer.addPoint(id, longitude, latitude, color, size);
viewer.removePoint(id);
viewer.clearEntities();
viewer.getCameraPosition(); // Call when needed, not stored in state

// Satellite methods
viewer.addSatellite(satellite);
viewer.updateSatellitePosition(id, longitude, latitude, altitude);
viewer.removeSatellite(id);
viewer.showSatelliteOrbit(id);
viewer.hideSatelliteOrbit(id);
viewer.toggleSatelliteOrbit(id);
viewer.clearSatellites();
```

### Key Files

- `src/lib/cesium/CesiumViewer.ts` - Custom element wrapping Cesium (imperative state)
- `src/lib/components/CesiumViewer.svelte` - Svelte wrapper component
- `src/lib/components/Controls.svelte` - Main controls with tabs
- `src/lib/components/SatelliteTracker.svelte` - Satellite tracking UI
- `src/lib/services/satelliteService.ts` - Satellite data fetching
- `src/App.svelte` - Main app with full-screen viewer + floating controls

### Svelte State

Only minimal UI state is reactive:

- `viewer` - reference to the Cesium custom element
- `selectedLocation` - which location button is active
- `isFlying` - whether camera is currently animating
- `isTracking` - whether satellite tracking is active
- `activeTab` - which controls tab is open

## Development

```bash
# Run dev server
pnpm dev

# Build for production
pnpm build

# Type check
pnpm typecheck
```

## Stack

- Vite 6 + TypeScript
- Svelte 5 (runes mode with `$state`, `$props`)
- CesiumJS for 3D globe visualization

## Cesium Assets

Cesium assets (Workers, Assets, Widgets, ThirdParty) are copied from `node_modules/cesium/Build/Cesium/` to `public/cesium/` for serving at runtime.

To update assets after installing/upgrading Cesium:

```bash
cp -r node_modules/cesium/Build/Cesium/Workers apps/earth/public/cesium/
cp -r node_modules/cesium/Build/Cesium/ThirdParty apps/earth/public/cesium/
cp -r node_modules/cesium/Build/Cesium/Assets apps/earth/public/cesium/
cp -r node_modules/cesium/Build/Cesium/Widgets apps/earth/public/cesium/
```

## Migration from React

This app was migrated from React to Svelte 5. Key changes:

- Removed React, React-DOM, and all React-related dependencies
- Replaced JSX components with Svelte `.svelte` files
- Replaced React state with Svelte 5 runes (`$state`, `$props`)
- Kept Cesium integration but wrapped it in a custom element for clean imperative API
