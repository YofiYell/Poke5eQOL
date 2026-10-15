# ART-01-R02 — Versioned module API, source states and consumers

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
  source(namespace: 'fakemon'|'pokemon', speciesId: string): NormalSourceState;
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
type ValidatedNormalSource = {
  href:string; mediaField:'normalPortrait'; contentSha256:string; // 64 verified hex
  decodedRgbaSha256:string; width:number;height:number;imageFormat:string;
};
type SourceState = 'unresolved'|'source_resolved'|'source_bytes_verified'|
 'decoded_image_verified'|'analysis_complete'|'source_validation_failed';
type NormalSourceCandidate = {
  href:string;mediaField:'normalPortrait';typesSignature:string;
  routeToken:string|null;contentSha256:string|null;decodedRgbaSha256:string|null;
  width:number|null;height:number|null;imageFormat:string|null;
};
type NormalSourceState = Readonly<{
  state:SourceState;candidate:NormalSourceCandidate|null;
  lastVerified:{href:string;contentSha256:string}|null; // even if not analyzed
  lastSuccessful:ValidatedNormalSource|null;
  latestFailure:{phase:string;code:string;at:string}|null;
}>;
type Snapshot = Readonly<{
  schemaVersion:1; namespace:Identity['namespace'];speciesId:string;
  analysisRevision:number; normalSource:ValidatedNormalSource;
  types:{primary:string;secondary:string|null;signature:string};
  scannerVersion:string;cacheSource:'persisted'|'memory'|'fresh';
  color:{state:'ready';stats:PythonColorOutput;decision:PythonDecisionOutput};
  geometry:{state:'ready'|'unavailable_opaque'|'unavailable_empty'|'unavailable_alpha_ambiguous'|'error';
    reliable:boolean;alphaThreshold:1;bounds:PixelRect|null;
    occupiedPixels:number|null;components:number|null;holes:number|null;
    maskFormat:'packed-msb-row-v1'|null;maskSha256:string|null;
    width:number;height:number;} ;
  lastSuccessfulAnalysisAt:string;lastSuccessfulValidationAt:string;
}>;
type AnalysisStatus = Readonly<{
  state:'missing'|'cached'|'validating'|'analyzing'|'ready'|'unavailable'|'error';
  previousAvailable:boolean;latestFailure:string|null;attemptId:string|null;
  lastAttemptAt:string|null;sourceState:SourceState;
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
- `yofi:artwork-intelligence:updated` — exactly once **after complete successful record commit** (or coherent memory-only fallback) when the decision, validated source or geometry has **meaningfully changed**, detail `{apiVersion:1,namespace,speciesId,analysisRevision,normalSource,contentSha256,typesSignature,scannerVersion,recordSchemaVersion:1,requestRouteToken:string|null}`. Rehydrating an unchanged last-good record or successfully revalidating unchanged bytes does **not** emit `updated`. No staged `colors-updated` then `mask-updated` events. No update event on failed fetch, invalid result, or unchanged validation.
- `yofi:artwork-intelligence:status` — optional diagnostic-only status event after validation failures; **consumers may not treat it as a new analysis**. Detail `{apiVersion:1,namespace,speciesId,state,attemptId,errorCode}` without payload artwork data.

All dispatches use `CustomEvent` on `document`; event details are immutable serializable data (no DOM references, Blob or mutable mask). Readers relookup by identity and revision, then compare with their **currently rendered** card identity/source/types. A slow outgoing species scan must never recolor or reposition an incoming card; route token and current type/source validation are mandatory. Network updates are not coupled to `yofi:species-card-presentation-ready`—that event remains under Species Card control.

## Selected authoritative acquisition — ART-owned read-only RPC

**Decision for ART-02:** one ART-owned, deduplicated **read-only `get_fakemon` request** per relevant Fakémon read key, using the site's existing public anonymous API configuration (no write keys). Parse only a record whose `read_key` matches the normalized route ID; read `normal_portrait_filename` and the authoritative `type` array; resolve the normal asset filename against `https://poke5e.auroratide.cloud/` with validated HTTP(S) URL handling. Native `rowToFakemon()` maps that exact field to `species.media.values.normalPortrait`; the normal source remains correct with shiny, female, sprite or hue-rotation selected onscreen. No UI-owned `<img>.src` is ever the source of truth.

This intentionally **does not modify or depend on QOL**. `requestPortraitEntries()` is private; exporting it would modify QOL and its startup contract. When QOL's existing short-lived fetch response cache happens to handle an identical RPC request, an ordinary browser fetch may reuse that response; otherwise a separate metadata RPC can occur. ART must have exactly one coordinator and deduplicate its own in-flight/same-session work; network duplication relative to QOL remains a **measurable ART-02 tradeoff**, not a reason to add cross-script dependencies now. No extra pixel-decode work by consumers.

Initiation should combine navigation lifecycle and existing optional species-card prepare events (`yofi:species-card-prepare-before-reveal`, `yofi:species-card-presentation-ready`) where available, with a native route event fallback when Species Card is absent; never another full-page MutationObserver. The exact native SPA route trigger and timing need live-browser verification before claiming no missed `pushState` transitions. ART must not block the native Svelte card or QOL ready-card handoff. Missing row/normal source, unsupported host scheme, mismatched read key, RPC denial and byte CORS failures produce source-validation status errors while preserving the last successful record.

A missing normal source yields `status='unavailable'` with prior successful record retained. A network/CORS failure yields `sourceStatus='unreadable'` and can still serve last-successful cached metadata. No blocking on ART readiness, no duplicated per-consumer decodes, no artwork scanning on resize/shiny/theme/fullscreen.

## Consumers — permitted behaviors only

**QOL:** If ART absent, `peek()` returns null, module throws or geometry unreliable, **exact original behavior**. QOL button, normal/shiny switching, swipe/tap, loading handoff and four manual corners stay authoritative. For future optional corner integration, first inspect whether the `PORTRAIT_CORNER_PREFIX + context.key` exists (a separate presence flag); do not use `savedPortraitCorner()`'s fallback `'tr'` as manual proof. Precedence `explicit saved corner > ART valid auto > QOL default tr`.

**Theme Overlay:** Official Pokémon maintain `ARTWORK_TYPE_CHOICES` as authoritative and never use ART's Fakémon scanner result for official color changes. Type theme for Fakémon may use a **verified matching** completed dual-type decision from ART while retaining existing type-choice, banner blends and `ARTWORK_TINT_ALPHA_BY_TYPE`; monotypes and Light/Dark unchanged. Only Theme writes color CSS vars. Missing ART result -> existing native fallback.

**Species Card:** Reads optional exact geometry when normal displayed artwork identity matches; alone owns hero measurements, scaling and collision avoidance, never receives direct DOM modifications from ART. No new layout family or ART-owned image node. On missing/unreliable geometry, existing GEO-01 solver remains functional and unchanged. Future collision implementation belongs to a separate approved package, not ART-01.

**Independent startup:** QOL/Species Card/Theme can all start without ART, in any prior working order; ART readiness can occur before or after any one of them. ART must not register with the existing strict QOL dependency gate in a way that makes another script depend on ART. ART may use a separate global module namespace/read-only API and native events.

## R02 source readiness, counter semantics and hydration protocol

`source(namespace,id)` is an **observational** `NormalSourceState`, even before a hash is known. `candidate.contentSha256=null` until byte SHA verification; `candidate.decodedRgbaSha256=null` until decode. `lastSuccessful` is a separately retained complete record and `lastVerified` can reflect a source fingerprint that has not yet produced a new published analysis. A stored `Snapshot.normalSource` is **always** fully validated; a partial candidate cannot masquerade as a stored success.

- API/DB `ready` resolves when the module has established its storage mode and hydrated the current relevant record when available; it need not wait for any scan. If IDB is blocked, `ready` still resolves with an explicit storage-unavailable state. Other userscripts always start normally, even if ART never loads.
- ART may synchronously expose a **small versioned and source/type-matching last-good decision snapshot** from localStorage on initial load; it is noncanonical, bounded, and cannot claim current byte freshness. On successful asynchronous IDB hydration, reconcile; do not emit `updated` for an unchanged record merely because it arrived in memory. Consumers may use `whenReady()`/`lookup()` but must not delay native rendering.
- Missing sync snapshot, blocked localStorage or late ART load may produce an eventual color change in an optional future consumer; **perfect first-paint continuity is not guaranteed**. Do not disguise it with waits, replacement cards or flash-suppression overlays. No current Theme integration is changed.
- `peek`, `lookup`, `inspect`, `source`, `status`, `diagnostics`, `currentContext` and `whenReady` are passive; `cacheHits` increments only if a consumer explicitly **applies/reuses** a validated compatible last-good decision during a relevant active card presentation. `idbHydrations` counts successful IDB→memory hydrations; `sourceRevalidations` counts attempted source checks; `scansCompleted` counts finished image analysis, including unchanged outcomes; `updateEventsPublished` counts coherent meaningful changed updates. These are independent counters, not synonyms.
- For every event, a consumer takes a **fresh** current route/card snapshot, compares `(namespace,speciesId,typesSignature,normal source,requestRouteToken when non-null)` and checks the current card's identity/generation again before painting. An old route's async result can remain cached for its own species, but cannot mutate the new card. Manual QOL `tr` selection remains explicit preference over automatic corners.
