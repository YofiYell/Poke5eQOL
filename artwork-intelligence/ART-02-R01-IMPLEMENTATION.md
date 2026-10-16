# ART-02-R01 — Standalone Artwork Intelligence implementation

**Status: Working candidate.** This document describes the actual `Poke5e Artwork Intelligence.js` production candidate. It is a standalone data producer; it neither modifies card DOM/CSS nor consumes/mutates the existing three userscripts.

## Installable script and build

- Root filename: `Poke5e Artwork Intelligence.js` (permanent filename).
- Extension display name: `Artwork Intelligence [v0.1.0]`; `@version 0.1.0`.
- Runtime self-contained JavaScript; Python is used only for offline development tests.
- Exact source at `artwork-intelligence/src/{core,geometry,png,service}.js`.
- Deterministic build: `python3 artwork-intelligence/build.py`, then `node --check 'Poke5e Artwork Intelligence.js'`.
- The builder embeds the complete scanner and exact mask geometry a second time **as a Blob worker source string**. The worker runs off the UI thread where permitted. A same-bundle main-thread fallback exists for browsers blocking Blob workers; it is a potential responsiveness risk and is reported by `diagnostics().worker`.

## Native source/lifecycle

One ART-owned coordinator reads the existing public anonymous `get_fakemon` endpoint (using the same deployed public anon key and request shape inspected in QOL). The explicit native read key is checked before reading ordered `type` and `normal_portrait_filename` fields; the canonical source is resolved against the Poké5e user-asset host, **never** the currently displayed img or shiny/sprite metadata. Native `/fakemon?action=info&id=...` routes and language-prefixed variants are supported. `pushState`, `replaceState`, `popstate`, `hashchange`, `pageshow` and existing optional species-card presentation events provide triggering without a new document-wide MutationObserver or polling. A single first-session validation is scheduled per species, with a retry allowed upon returning to an errored route. The actual live SPA behavior remains an installation-test requirement.

## Full scanner and pixel fidelity

`artColors` reproduces original Python v1.0.0 masking, 4-connected opaque background removal, squared exact Euclidean distance-to-background, alpha and outline weighting, RGB16 bin masses, weighted 8-cluster Lab k-means, stable cluster order and CIE76 scoring. The original type palette, average/dominant weights, tie semantics and strength parameters remain unchanged.

**Important finding:** direct Canvas decoded semi-transparent RGB samples can differ from Pillow. To maintain parity, 8-bit RGB and RGBA noninterlaced PNGs are decoded losslessly from their original IDAT zlib stream using the browser's native `DecompressionStream`. This passes every ART-01 PNG fixture including the 722x722 real Fakémon. When `DecompressionStream` is unavailable, or for other PNG modes/other accepted formats (JPEG/WEBP/GIF/TIFF), the script uses the browser's native image decoder. The `normalSource.decodeMode`, decoded-RGBA checksum and diagnostic timings disclose that path; **Python pixel parity for those fallback modes has not been established**. Unsupported formats generate an explicit failure rather than switching to alternate artwork.

## Geometry and corners

Alpha >=1 full-canvas packed-msb-row-v1 silhouettes preserve faint pixels, detached components and holes, with 8-connected subject components and 4-connected holes. Reliability follows ART-01-R02's conservative exterior-alpha gate. An unreliable silhouette never becomes a collision-eligible mask; its color decisions may still be persisted. The first corner pass uses exact alpha>=1 bounds. Only if all four original corners fail does the box expand uniformly by one icon-width in source coordinates. Real caller-supplied icon footprint, clearance, obstacles and affine transforms are checked against transformed occupied pixel cells. The module **returns data only**, never touches the shiny control or its manual preference.

## Storage, snapshots and API

IndexedDB database `yofi-artwork-intelligence`, version 1, with separate record/mask/status stores for Fakémon and future official Pokémon. Successful record and mask writes use one readwrite transaction; revisions are checked inside it. Failed storage falls back to a bounded memory record identified as `cacheSource:'memory'`; failures never erase last good successes. Memory holds at most 50 hydrated records and 5 masks; no decoded RGBA buffers are retained after scanning. A decision-only last-good localStorage snapshot has at most 50 entries, no images/masks or full records.

`window.__yofiArtworkIntelligence` implements the ART-01 public v1 API: `whenReady`, `currentContext`, `peek`, `lookup`, `source`, `status`, `silhouette`, `decodeSilhouette`, `recommendCorner`, `inspect` and `diagnostics`. It adds one non-breaking `lastGoodDecision(namespace,speciesId)` read-only accessor for the bounded synchronous decision snapshot after authoritative source/type identity becomes known. This is **not** a complete or current validated Snapshot and is clearly marked `validatedFresh:false`. Canonical `peek` continues to return complete in-memory records only. Passive diagnostics do not scan or increment cache hits.

`yofi:artwork-intelligence:ready`, `:updated`, and optional diagnostic-only `:status` events are dispatched on `document`. Changed complete success is published only after the atomic IDB transaction completes, or coherently as memory-only fallback. Request route tokens prevent an outgoing source from being mistaken for an incoming card; ART never paints either one.

## Tests and limitations

- Offline real full JavaScript scanner matched the entire frozen Python color+decision dictionaries (17 full fixture results: 13 successful scans plus 3 expected errors and one real scan).
- Full real exact geometry: 306,042 occupied pixels, 2 components, 1 hole, bounds (3,0,722,690), mask 65,702 B SHA-256 `3a2a9bc555888d03caa2044f23ae9685c44dff349ae300bca22c62e5ff244ee1`.
- Headless local Chromium (opaque-origin page): exact PNG RGBA checksum parity across 17 fixtures, full real color parity, worker execution, self-contained singleton API and duplicate-startup prevention.
- Full Python ART-01 regression: 29 tests. Existing Node ART-01 regression: 24 tests. Additional JS tests are in this directory.
- **Not verified**: authenticated/native SPA page rendering, live CORS/acquisition, browser storage under a normal web origin, iPad Safari performance/persistence, browser JPEG/WEBP/GIF/TIFF pixel parity, image orientation/color-profile corner cases, and user-facing consumer styling (intentionally unchanged).
- Known fallback risk: browsers disallowing Blob workers may run an exact ~full-resolution scan on the main thread. No downsampling or fake results are introduced to hide this risk. A single copied RGBA buffer is transferred to the worker to permit failure fallback; peak allocation is a calculated proxy, not a measured Safari heap maximum.

## Browser acceptance commands

On a Fakémon detail page with the fourth userscript installed (other three may be disabled):

```js
const ai = window.__yofiArtworkIntelligence;
await ai.whenReady();
ai.diagnostics();
const id = ai.currentContext()?.speciesId;
const record = id && await ai.inspect('fakemon', id);
console.log({id, record, source: id && ai.source('fakemon', id)});
const mask = id && await ai.silhouette('fakemon', id);
console.log(mask && {bytes:mask.bytes.length, sha:mask.maskSha256});
```

For the verified Rock/Steel normal PNG, expect `record.selectedBannerType='rock'`, `record.selectedTintType='steel'`, decoded SHA-256 `388b6192739a22f771ce8f6591f2b57c9266e868af309464ecfaf2679d42a952`, reliable mask SHA-256 `3a2a9bc555888d03caa2044f23ae9685c44dff349ae300bca22c62e5ff244ee1`, and source bytes SHA-256 `0749aa41cc2250c67884ad4a33082566f379756530ce1724798a6c035d470bc6`.

Check a refresh: `idbHydrations >= 1`, `scansCompleted = 0`, `sourceRevalidations = 1` if unchanged artwork; reloading with network unavailable should retain the previous successful result and mask while reporting the failure. Verify the native shiny button, card handoff, type banners and heroes do not change because ART-02 has no consumers. Disable ART and verify all three scripts still work.

The Chromium acceptance test `tests/check_chromium_persistence.py` exercises real IndexedDB on a localhost origin and is provided for execution in a browser environment without the current container's navigation restriction.
