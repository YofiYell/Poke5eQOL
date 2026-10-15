# ART-01-R01 — Versioned module API and consumers

The following specifies the proposed v1 read-only public API. **No `window.__yofiArtworkIntelligence` exists yet**; implementation is ART-02. All method names, shapes and event names below are fixed for ART-02 planning. Avoid version-dependent coupling to QOL / Species Card / Theme Overlay module versions.

## Global API

```ts
window.__yofiArtworkIntelligence: Readonly<{
  apiVersion: 1;
  moduleVersion: string;              // first implementation proposed "0.1.0"
  scannerVersion: "1.0.0";
  ready: boolean;                     // DB initialized; false until known
  whenReady(): Promise<void>;         // no network/scan side effects
  currentContext(): CurrentContext | null; // passive last observed species
  peek(namespace: 'fakemon'|'pokemon', speciesId: string): Snapshot|null;
  lookup(namespace: 'fakemon'|'pokemon', speciesId: string): Promise<Snapshot|null>;
  status(namespace: 'fakemon'|'pokemon', speciesId: string): AnalysisStatus;
  source(namespace: 'fakemon'|'pokemon', speciesId: string): NormalSource|null;
  silhouette(namespace: 'fakemon'|'pokemon', speciesId: string): Promise<EncodedSilhouette|null>;
  decodeSilhouette(value: EncodedSilhouette): DecodedSilhouette;
  recommendCorner(namespace: 'fakemon'|'pokemon', speciesId: string,
      render: RenderContext): CornerResult|null;  // returns null if mask not hydrated
  inspect(namespace: 'fakemon'|'pokemon', speciesId: string): Promise<RecordDiagnostics>;
  diagnostics(): GlobalDiagnostics;
}>;
```

All callers use `(namespace,speciesId)` with the **existing species ID**. `lookup`, `inspect`, and `silhouette` can perform **storage reads only**. `peek`, `status`, `source`, `currentContext`, `recommendCorner`, and `diagnostics` are synchronous and purely observational; none may fetch, decode artwork or trigger a scan. `decodeSilhouette` is a pure decoder, not a storage read. Return immutable metadata snapshots and copies of binary buffers (not a mutable shared cache object). `ready` means API/IDB initialization, not every species analyzed.

### `Snapshot` and result fields

```ts
type Identity = {namespace:'fakemon'|'pokemon';speciesId:string};
type NormalSource = {
  href:string; mediaField:'normalPortrait'; contentSha256:string;
  decodedRgbaSha256:string; width:number;height:number;imageFormat:string;
};
type Snapshot = Readonly<{
  schemaVersion:1; namespace:Identity['namespace'];speciesId:string;
  analysisRevision:number; normalSource:NormalSource;
  types:{primary:string;secondary:string|null;signature:string};
  scannerVersion:string;cacheSource:'persisted'|'memory'|'fresh';
  color:{state:'ready';stats:PythonColorOutput;decision:PythonDecisionOutput};
  geometry:{state:'ready'|'unavailable_opaque'|'unavailable_empty'|'error';
    reliable:boolean;alphaThreshold:1;bounds:PixelRect|null;
    occupiedPixels:number|null;components:number|null;holes:number|null;
    maskFormat:'packed-msb-row-v1'|null;maskSha256:string|null;
    width:number;height:number;} ;
  lastSuccessfulAnalysisAt:string;lastSuccessfulValidationAt:string;
}>;
type AnalysisStatus = Readonly<{
  state:'missing'|'cached'|'validating'|'analyzing'|'ready'|'unavailable'|'error';
  previousAvailable:boolean; latestFailure:string|null; attemptId:string|null;
  lastAttemptAt:string|null;sourceStatus:'unknown'|'unchanged'|'changed'|'unreadable';
}>;
type CurrentContext = Readonly<Identity & {
  routeToken:string;normalSource:string|null;typesSignature:string|null;
}>;
type EncodedSilhouette = Readonly<{
  format:'packed-msb-row-v1';width:number;height:number;strideBytes:number;
  alphaThreshold:1;maskSha256:string;bytes:Uint8Array; // copied buffer
}>;
type DecodedSilhouette = Readonly<{
  width:number;height:number;hasPixel(x:number,y:number):boolean;
  bounds:PixelRect|null;occupiedPixels:number;
  intersectsSourceRect(rect:PixelRect):boolean;
}>;
type PixelRect = {left:number;top:number;right:number;bottom:number};
```

`PythonColorOutput` / `PythonDecisionOutput` mean **all fields produced by the unchanged reference functions**, including clusters and CIE76 scores; do not invent a reduced/renamed algorithm output that prevents reference parity. `lastSuccessful*` fields are the successful-record timestamps and must not be overwritten by failures. `cacheSource` is per lookup/snapshot and may vary within a session without altering the stored analysis.

### Corner geometry: `RenderContext` / `CornerResult`

```ts
type RenderContext = Readonly<{
  normalSource:string;normalSourceSha256:string;
  sourceToClient:[number,number,number,number,number,number]; // DOMMatrix 2D
  iconClientRect:PixelRect;clearanceClientPx:number;
  obstacleClientRects:PixelRect[];
  renderContextToken:string; // changes on resize/scroll/object-fit/transform
}>;
type CornerResult = Readonly<{
  corner:'tl'|'tr'|'bl'|'br'|null;
  pass:'original'|'expanded'|'unavailable';
  originalBounds:PixelRect;effectiveBounds:PixelRect;
  iconClientRect:PixelRect|null;expansionPerSideSourcePixels:number;
  sourceMaskSha256:string;renderContextToken:string;
}>;
```

The `RenderContext` is supplied by the UI owner after reading the **real** icon footprint and computed image transform. `recommendCorner` consults an already-resident exact normal silhouette, performs no image scan, and **never applies any CSS or writes corner preferences**. On a shiny/female/avatar displayed image that does not match the normal source, the consumer ignores the recommendation and uses QOL fallback. `RenderContext` change recalculates only this cheap geometry, not source analysis.

## Lifecycle events

- `yofi:artwork-intelligence:ready` — one event at API initialization, detail `{apiVersion:1,moduleVersion,scannerVersion}`, no species payload. A late consumer reads the global API directly and optionally invokes `whenReady()`, so missing the event causes no loss.
- `yofi:artwork-intelligence:updated` — exactly once **after successful complete record commit** (or coherent memory-only fallback) for a changed analysis revision, detail `{apiVersion:1,namespace,speciesId,analysisRevision,normalSource,contentSha256,typesSignature,scannerVersion,recordSchemaVersion:1}`. No staged `colors-updated` then `mask-updated` events. No update event on failed fetch, invalid result, or unchanged validation.
- `yofi:artwork-intelligence:status` — optional diagnostic-only status event after validation failures; **consumers may not treat it as a new analysis**. Detail `{apiVersion:1,namespace,speciesId,state,attemptId,errorCode}` without payload artwork data.

All dispatches use `CustomEvent` on `document`; event details are immutable serializable data (no DOM references, Blob or mutable mask). Readers relookup by identity and revision, then compare with their **currently rendered** card identity/source/types. A slow outgoing species scan must never recolor or reposition an incoming card; route token and current type/source validation are mandatory. Network updates are not coupled to `yofi:species-card-presentation-ready`—that event remains under Species Card control.

## Acquisition owner / no scanner duplication

ART owns a **single** coordinator keyed by `(namespace,speciesId)` with one active in-flight job per normal source. It should listen to the existing card preparation notifications and route lifecycle without adding another whole-page `MutationObserver`. Because QOL's `requestPortraitEntries()` is **private**, ART-02 must verify and choose **one** integration mechanism before implementation:

1. **Preferred:** obtain a narrowly scoped read-only normal-source snapshot from QOL when available (future opt-in QOL API, without making QOL depend on ART); ART remains responsible for pixel acquisition/revalidation; QOL source fetch can be shared if its response cache is accessible safely.
2. **Fallback:** use the native Fakémon record's `media.values.normalPortrait` or the same read-only `get_fakemon` RPC in one deduplicated ART request on first relevant visit. Only ART fetches image bytes; the other three consumers never fetch them. Do not use `img.src` when shiny selected.

A missing normal source yields `status='unavailable'` with prior successful record retained. A network/CORS failure yields `sourceStatus='unreadable'` and can still serve last-successful cached metadata. No blocking on ART readiness, no duplicated per-consumer decodes, no artwork scanning on resize/shiny/theme/fullscreen.

## Consumers — permitted behaviors only

**QOL:** If ART absent, `peek()` returns null, module throws or geometry unreliable, **exact original behavior**. QOL button, normal/shiny switching, swipe/tap, loading handoff and four manual corners stay authoritative. For future optional corner integration, first inspect whether the `PORTRAIT_CORNER_PREFIX + context.key` exists (a separate presence flag); do not use `savedPortraitCorner()`'s fallback `'tr'` as manual proof. Precedence `explicit saved corner > ART valid auto > QOL default tr`.

**Theme Overlay:** Official Pokémon maintain `ARTWORK_TYPE_CHOICES` as authoritative and never use ART's Fakémon scanner result for official color changes. Type theme for Fakémon may use a **verified matching** completed dual-type decision from ART while retaining existing type-choice, banner blends and `ARTWORK_TINT_ALPHA_BY_TYPE`; monotypes and Light/Dark unchanged. Only Theme writes color CSS vars. Missing ART result -> existing native fallback.

**Species Card:** Reads optional exact geometry when normal displayed artwork identity matches; alone owns hero measurements, scaling and collision avoidance, never receives direct DOM modifications from ART. No new layout family or ART-owned image node. On missing/unreliable geometry, existing GEO-01 solver remains functional and unchanged. Future collision implementation belongs to a separate approved package, not ART-01.

**Independent startup:** QOL/Species Card/Theme can all start without ART, in any prior working order; ART readiness can occur before or after any one of them. ART must not register with the existing strict QOL dependency gate in a way that makes another script depend on ART. ART may use a separate global module namespace/read-only API and native events.
