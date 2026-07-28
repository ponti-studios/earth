# Earth App - Advanced Cesium Features Guide

This guide shows you how to use all the new 3D terrain, camera navigation, and visual effects features.

## Quick Start

### 1. Using the Visual Effects Control Panel

The easiest way to try everything is using the included control panel:

```svelte
<script>
  import VisualEffectsControl from './lib/components/VisualEffectsControl.svelte';

  let viewerElement: HTMLElement;
</script>

<!-- Your Cesium viewer -->
<cesium-viewer bind:this={viewerElement} />

<!-- Add the control panel -->
<VisualEffectsControl viewer={viewerElement} />
```

The panel gives you buttons to:

- Switch between 3D/2D/Columbus view modes
- Start camera tours (Global Overview, Conflict Zones, etc.)
- Apply post-processing presets (Cinematic, Neon, Scientific)
- Add demo effects (pulse rings, radar scans, particles, flow lines)

---

## Manual Usage (Programmatic API)

### Getting the Viewer Reference

```typescript
// In your Svelte component
let cesiumViewer: HTMLElement;

// After the viewer is ready, you can call methods on it
function onViewerReady() {
  // All methods are available on the custom element
  cesiumViewer.applyPostProcessingPreset("NEON");
}
```

---

## 1. 3D Terrain

Terrain is **automatically enabled** when the viewer initializes. You'll see:

- Real mountain ranges and valleys
- Water effects on oceans
- Better depth perception when zoomed in

To verify it's working, fly close to the Alps or Rockies - you'll see actual elevation instead of a flat surface.

---

## 2. Scene Modes (3D/2D/Columbus)

### Switch Between Modes

```typescript
// Switch to specific mode
viewer.switchSceneMode("2D"); // Flat map
viewer.switchSceneMode("3D"); // Globe (default)
viewer.switchSceneMode("Columbus"); // 3D on a flat plane

// Toggle between 3D and 2D
viewer.toggle3D2D();

// Cycle through all three modes
const newMode = viewer.cycleSceneMode(); // Returns '3D', '2D', or 'Columbus'

// Check current mode
console.log(viewer.getSceneMode()); // '3D'
```

### Use Cases

- **3D**: Best for satellite visualization, terrain-aware data
- **2D**: Good for comparing regions side-by-side, traditional map view
- **Columbus**: Compromise between 3D depth and 2D readability

---

## 3. Camera Tours

### Start a Preset Tour

```typescript
// Global overview - rotates around the Earth
await viewer.startPresetTour("global-overview");

// Conflict zones - visits Ukraine, Gaza, Sudan, Myanmar, DRC
await viewer.startPresetTour("conflict-tour");

// Satellite orbit - follows orbital path around equator
await viewer.startPresetTour("satellite-orbit");

// Data comparison - Americas → Europe → Asia
await viewer.startPresetTour("data-comparison");
```

### Custom Tour

```typescript
import { CameraTourManager } from "./lib/cesium";

// Define stops
const tourConfig = {
  stops: [
    {
      longitude: -74.006, // NYC
      latitude: 40.7128,
      height: 100000, // 100km altitude
      duration: 2, // 2 seconds to fly here
      holdTime: 3, // Stay for 3 seconds
    },
    {
      longitude: 139.6917, // Tokyo
      latitude: 35.6895,
      height: 100000,
      duration: 3,
      holdTime: 3,
    },
    {
      longitude: -0.1276, // London
      latitude: 51.5074,
      height: 100000,
      duration: 3,
    },
  ],
  loop: true, // Loop forever
  onStart: () => console.log("Tour started!"),
  onStopReached: (index, stop) => console.log(`At stop ${index}`),
  onComplete: () => console.log("Tour finished!"),
};

await viewer.startCameraTour(tourConfig);
```

### Control Tours

```typescript
// Cancel current tour
viewer.cancelCameraTour();

// Check if tour is playing
if (viewer.isTourPlaying()) {
  console.log("Tour in progress...");
}
```

---

## 4. Post-Processing Effects

### Apply Presets

```typescript
// Cinematic documentary style
viewer.applyPostProcessingPreset("CINEMATIC");

// Neon/cyberpunk for data viz
viewer.applyPostProcessingPreset("NEON");

// Clean scientific look
viewer.applyPostProcessingPreset("SCIENTIFIC");

// Minimal effects for performance
viewer.applyPostProcessingPreset("PERFORMANCE");
```

### Custom Configuration

```typescript
import type { PostProcessConfig } from "./lib/cesium";

const config: PostProcessConfig = {
  bloom: {
    enabled: true,
    intensity: 2.5,
    threshold: 0.3,
    radius: 1.0,
  },
  fxaa: {
    enabled: true,
  },
  silhouette: {
    enabled: true,
    color: "#00ffff",
    length: 0.5,
  },
};

viewer.applyPostProcessing(config);
```

### Clear Effects

```typescript
viewer.clearPostProcessing();
```

---

## 5. Particle Systems

### Conflict Event Visualization

Perfect for showing conflict data, explosions, fires:

```typescript
// Create fire and smoke at a location
// Intensity: 'low' | 'medium' | 'high' | 'extreme'

viewer.createConflictParticles(
  "ukraine-conflict", // Unique ID
  37.0, // Longitude
  49.0, // Latitude
  50000, // Altitude (50km above ground)
  "extreme", // Intensity level
);

// Remove it later
viewer.removeParticleSystem("ukraine-conflict");
```

### Explosion Effect

```typescript
// One-time explosion
viewer.createExplosion(
  "explosion-1",
  34.0, // Gaza
  31.0,
  30000,
  "#ff4400", // Orange color
);
```

### Custom Particle System

```typescript
import type { ParticleSystemConfig } from "./lib/cesium";
import * as Cesium from "cesium";

const config: ParticleSystemConfig = {
  position: Cesium.Cartesian3.fromDegrees(0, 0, 10000),
  type: "energy", // 'fire' | 'smoke' | 'explosion' | 'energy'
  emissionRate: 200, // Particles per second
  particleSize: 25,
  color: "#00ffff",
  endColor: "#0000ff",
  speed: 10,
  duration: 5, // Auto-remove after 5 seconds
};

// Access the particle manager directly if needed
// (This requires importing from the module)
```

### Clear All Particles

```typescript
viewer.clearParticleSystems();
```

---

## 6. Shader Effects (Pulse Rings, Radar, Flow Lines)

### Pulse Rings

Great for highlighting locations, alerts, or data points:

```typescript
// Create a pulsing ring at a location
viewer.createPulseRing(
  "alert-nyc", // Unique ID
  -74.006, // Longitude (NYC)
  40.7128, // Latitude
  {
    radius: 50000, // 50km radius
    color: "#ff0000", // Red
    speed: 2, // Pulse speed
    thickness: 0.1, // Ring thickness
  },
);

// Remove it
viewer.removeShaderEffect("alert-nyc");
```

### Radar Scan

Good for showing surveillance, monitoring areas:

```typescript
viewer.createRadarScan(
  "radar-main",
  -95.0, // Kansas (center of US)
  37.0,
  {
    radius: 200000, // 200km range
    color: "#00ff00", // Green radar color
    speed: 1, // Rotation speed
  },
);
```

### Flow Lines

Perfect for showing trade routes, migration, data flow:

```typescript
viewer.createFlowLines(
  "trade-routes",
  [
    {
      start: { longitude: 121.4737, latitude: 31.2304 }, // Shanghai
      end: { longitude: -122.4194, latitude: 37.7749 }, // San Francisco
    },
    {
      start: { longitude: -0.1276, latitude: 51.5074 }, // London
      end: { longitude: 139.6917, latitude: 35.6895 }, // Tokyo
    },
  ],
  {
    color: "#00ffff",
    speed: 0.5,
    width: 3,
  },
);
```

### Clear All Shader Effects

```typescript
viewer.clearShaderEffects();
```

---

## 7. Complete Example: Conflict Data Visualization

Here's a complete example showing how to visualize ACLED conflict data with all the new features:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  let viewer: HTMLElement;
  let showEffects = false;

  onMount(() => {
    // Wait for viewer to be ready
    viewer.addEventListener('viewer-ready', () => {
      console.log('Viewer ready!');
    });
  });

  async function visualizeConflicts() {
    // 1. Apply neon styling for dramatic effect
    viewer.applyPostProcessingPreset('NEON');

    // 2. Switch to 3D mode for best terrain view
    viewer.switchSceneMode('3D');

    // 3. Add particle effects at conflict zones
    viewer.createConflictParticles('ukraine', 37, 49, 50000, 'extreme');
    viewer.createConflictParticles('gaza', 34, 31, 30000, 'extreme');
    viewer.createConflictParticles('sudan', 30, 15, 50000, 'high');

    // 4. Add radar scans at monitoring locations
    viewer.createRadarScan('monitor-us', -95, 37, { radius: 1000000, color: '#00ff00' });

    // 5. Start the conflict tour to show each location
    await viewer.startPresetTour('conflict-tour');
  }

  function clearAll() {
    viewer.clearPostProcessing();
    viewer.clearParticleSystems();
    viewer.clearShaderEffects();
    viewer.cancelCameraTour();
  }
</script>

<cesium-viewer bind:this={viewer} />

<div class="controls">
  <button on:click={visualizeConflicts}>
    Visualize Conflicts
  </button>
  <button on:click={clearAll}>
    Clear All Effects
  </button>
</div>
```

---

## 8. Tips & Best Practices

### Performance

- Use `PERFORMANCE` preset on low-end devices
- Limit particle systems to 5-10 active at once
- Clear effects when switching data layers

### Scene Modes

- **3D** is best for terrain-aware data and satellite views
- **2D** works better for dense data overlays (avoids perspective distortion)
- **Columbus** offers a good balance for presentations

### Camera Tours

- Tours are async - use `await` if you need to wait for completion
- Tours can be cancelled at any time with `cancelCameraTour()`
- Use `loop: true` for continuous monitoring displays

### Combining Effects

- Post-processing affects the entire scene (expensive)
- Particles are GPU-accelerated but have limits
- Shader effects are efficient for many objects

---

## Import Reference

```typescript
// All managers and types
import {
  PostProcessingManager,
  ParticleSystemManager,
  ShaderMaterialManager,
  CameraTourManager,
  SceneModeManager,
} from "./lib/cesium";

// Types
import type {
  PostProcessConfig,
  ParticleSystemConfig,
  CameraTourConfig,
  TourStop,
  ShaderMaterialConfig,
} from "./lib/cesium";
```

---

## Troubleshooting

**Effects not showing?**

- Make sure viewer is ready: check `viewer.ready` property
- Verify the camera position - you might be zoomed too far out/in

**Performance issues?**

- Use `applyPostProcessingPreset('PERFORMANCE')`
- Reduce particle emission rates
- Clear unused effects with `clearAll()` methods

**Tours not working?**

- Ensure you're using `await` or `.then()` - tours are async
- Check that viewer is initialized before starting tours
