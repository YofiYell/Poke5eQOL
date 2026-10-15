# ART-01-R02 — Mandatory diagnostics, source phases and passive counters

**ART-01 only specifies this API. These commands will not work until ART-02 creates the fourth userscript.** The blocks labeled *schema example* are illustrative placeholders, not captured user records or measured data.

## Console commands (v1 contract)

```js
// Module presence, version, overall counters; must perform no I/O.
window.__yofiArtworkIntelligence?.diagnostics()

// Current route/normal source identity last observed by the producer.
window.__yofiArtworkIntelligence?.currentContext()

// Sync, memory-only last successful record, or null; no analysis.
window.__yofiArtworkIntelligence?.peek('fakemon', 'EXAMPLE_FAKE_ID')

// Async READ ONLY IndexedDB lookup; no scanning, fetch or revalidation.
await window.__yofiArtworkIntelligence?.lookup('fakemon', 'EXAMPLE_FAKE_ID')

// Sync status; never change a record or initiate a validation.
window.__yofiArtworkIntelligence?.status('fakemon', 'EXAMPLE_FAKE_ID')

// Normal artwork source that analysis is bound to; not displayed shiny src.
window.__yofiArtworkIntelligence?.source('fakemon', 'EXAMPLE_FAKE_ID')

// Full read-only record inspection including timestamps and color statistics.
await window.__yofiArtworkIntelligence?.inspect('fakemon', 'EXAMPLE_FAKE_ID')

// Optional explicit binary read; none of the inspector methods implicitly loads a mask.
const packed = await window.__yofiArtworkIntelligence?.silhouette('fakemon', 'EXAMPLE_FAKE_ID')
const mask = packed ? window.__yofiArtworkIntelligence.decodeSilhouette(packed) : null
mask?.hasPixel(123, 234)
```

## Exact global diagnostic response shape

```ts
type GlobalDiagnostics = Readonly<{
  apiVersion:1;
  moduleVersion:string;
  scannerVersion:string;               // original Python algorithm: "1.0.0"
  scannerReferenceSha256:string;       // original exact code hash
  ready:boolean;
  currentSpecies:{namespace:'fakemon'|'pokemon';speciesId:string}|null;
  currentNormalSourceUrl:string|null;
  currentContentSha256:string|null; // candidate verified SHA, null while unresolved
  sessionStartedAt:string;
  db:{state:'opening'|'ready'|'blocked'|'unavailable'|'quota-error';version:1};
  counters:{
    scansCompleted:number;             // successful full color analyses this session
    cacheHits:number;                  // active presentation reuse only; NOT peek/inspect
    idbHydrations:number;              // IDB -> memory record hydration, NOT reuse
    sourceRevalidations:number;        // attempted normal-source validations
    analysisFailures:number;           // failed scans, decode/parity, integrity
    storageFailures:number;
    updateEventsPublished:number;
  };
}>;
```

Counters refer to this module session, not lifetime totals. No getter increments counters merely because DevTools reads it. `cacheHits` increments **only on an active presentation consumer's accepted reuse of a compatible last-good decision**, while `idbHydrations` counts separate IDB→memory loads. Passive lookup, inspection, source/status and diagnostics never mutate counts. Scanner completion is separate from changed-decision publication. Reset after full page refresh; unavailable storage must be reported explicitly rather than as `persisted`.

## Exact per-record inspector response shape

```ts
type RecordDiagnostics = Readonly<{
  apiVersion:1; schemaVersion:1;
  namespace:'fakemon'|'pokemon';speciesId:string;
  moduleVersion:string;scannerVersion:string;
  recordState:'missing'|'cached'|'validating'|'analyzing'|'ready'|'unavailable'|'error';
  cacheSource:'persisted'|'memory'|'fresh'|null;
  normalArtworkUrl:string|null; // current candidate URL, if resolved
  normalSourceState:'unresolved'|'source_resolved'|'source_bytes_verified'|
    'decoded_image_verified'|'analysis_complete'|'source_validation_failed';
  candidateNormalSourceSha256:string|null; // null until candidate bytes verified
  candidateDecodedRgbaSha256:string|null; // null until candidate decoded
  lastSuccessfulArtworkUrl:string|null;
  normalSourceSha256:string|null; // last successful record, NOT provisional candidate
  decodedRgbaSha256:string|null; // last successful decoded artifact
  imageFormat:string|null;
  sourceDimensions:{width:number;height:number}|null;
  analyzerResultVersion:string|null;
  analysisRevision:number|null;
  lastSuccessfulAnalysisAt:string|null;
  lastSuccessfulValidationAt:string|null;
  lastValidationAttemptAt:string|null;
  lastFailure:{phase:'source'|'decode'|'analysis'|'geometry'|'storage';
               code:string;message:string;at:string}|null;
  primaryType:string|null;
  secondaryType:string|null;
  selectedBannerType:string|null;
  selectedTintType:string|null;
  averageColor:string|null;
  rawAlphaAverageColor:string|null;
  dominantColor:string|null;
  dominantCoverage:number|null;
  clusters:Array<{hex:string;coverage:number}>|null;
  colorVisiblePixels:number|null;
  backgroundPixelsRemoved:number|null;
  outlinePixelsDiscounted:number|null;
  nearBlackBodyFraction:number|null;
  nearWhiteBodyFraction:number|null;
  cie76:{averagePrimary:number;dominantPrimary:number;combinedPrimary:number;
         averageSecondary:number|null;dominantSecondary:number|null;
         combinedSecondary:number|null;confidenceMargin:number|null}|null;
  transparency:{class:'meaningful-exterior'|'ambiguous-alpha'|'opaque-or-no-alpha'|'unknown';
                scannerAlphaThreshold:128;geometryAlphaThreshold:1;
                alphaZeroPixels:number|null;exteriorZeroPixels:number|null;
                exteriorBorderSides:('top'|'right'|'bottom'|'left')[];
                transparentEdgePixelCounts:{top:number;right:number;bottom:number;left:number}|null;
                reliabilityReason:string|null}|null;
  geometry:{state:'ready'|'unavailable_opaque'|'unavailable_empty'|'unavailable_alpha_ambiguous'|'error'|null;
    reliable:boolean;maskFormat:'packed-msb-row-v1'|null;
    width:number|null;height:number|null;strideBytes:number|null;
    maskSha256:string|null;maskByteLength:number|null;
    bounds:{left:number;top:number;right:number;bottom:number}|null;
    observedOccupancyBounds:{left:number;top:number;right:number;bottom:number}|null;
    visualBoundsAlpha128:{left:number;top:number;right:number;bottom:number}|null; // diagnostic only
    occupiedPixels:number|null;disconnectedComponents:number|null;
    interiorHoles:number|null;} ;
  automaticCorner:{corner:'tr'|'tl'|'bl'|'br'|null;
    pass:'original'|'expanded'|'unavailable'|null;
    originalBox:{left:number;top:number;right:number;bottom:number}|null;
    effectiveBox:{left:number;top:number;right:number;bottom:number}|null;
    expansionPerSideSourcePixels:number|null;
    renderContextToken:string|null;} ;
}>;
```

`automaticCorner` is **last computed from a real supplied render context**, not a permanent corner stored inside the species analysis record. It may be `null` until a consumer requests it. Missing geometry is not secretly replaced with a guessed mask.

## Schema example — NOT observed (values are illustrative)

```json
{
  "apiVersion": 1,
  "schemaVersion": 1,
  "namespace": "fakemon",
  "speciesId": "EXAMPLE_FAKE_ID",
  "moduleVersion": "0.1.0",
  "scannerVersion": "1.0.0",
  "recordState": "ready",
  "cacheSource": "persisted",
  "normalArtworkUrl": "https://example.invalid/normal-main.png",
  "normalSourceSha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "sourceDimensions": {"width": 64, "height": 64},
  "primaryType": "ghost",
  "secondaryType": "psychic",
  "selectedBannerType": "ghost",
  "selectedTintType": "psychic",
  "cie76": {"averagePrimary": 12.345678, "dominantPrimary": 11.234567,
             "combinedPrimary": 11.790123, "averageSecondary": 15.111111,
             "dominantSecondary": 15.222222, "combinedSecondary": 15.166667,
             "confidenceMargin": 3.376544},
  "geometry": {
    "state": "ready", "reliable": true,
    "maskFormat": "packed-msb-row-v1", "width": 64, "height": 64,
    "strideBytes": 8, "maskByteLength": 512,
    "bounds": {"left": 10, "top": 8, "right": 55, "bottom": 56},
    "occupiedPixels": 1111, "disconnectedComponents": 2, "interiorHoles": 1
  },
  "automaticCorner": {"corner": null,"pass":null,
                       "originalBox":null,"effectiveBox":null,
                       "expansionPerSideSourcePixels":null,"renderContextToken":null}
}
```

These **fabricated example values are only field-shape documentation**, not a reference fixture, not a scan and not a migration record. For measured values, use `fixtures/expected/python_reference_results.json` and the SHA-verified synthetic source PNGs.

## Diagnostic semantics and privacy

- `inspect()` returns complete color metrics and record/source status but not raw mask bytes by default. `silhouette()` is the explicit binary read-only retrieval; decoder returns source-coordinate query methods only.
- No reads may trigger HTTP traffic, full-resolution analysis, localStorage writes, style changes or event publication.
- A missing or failed current record can still have last successful data. Diagnostics must report both prior successful result and latest failure (separately) without false fresh status.
- The user may copy console diagnostics for bug reports. Do not log authentication tokens, private Fakémon write keys, account identifiers or full user data. Read keys/normal public source URLs and source hashes are sufficient to reproduce scanner issues.

## R02 source identity and example passive console session

The future `source('fakemon', id)` returns `{state,candidate,lastVerified,lastSuccessful,latestFailure}` as specified in `INTEGRATION_CONTRACT.md`. **All values are read-only snapshots**. `candidate` has `href` and nullable SHA fields until the corresponding verification stages. `lastSuccessful` is a complete validated historical source, even during a failed attempt or a new candidate's first revalidation. `lastVerified` is a transient confirmed fingerprint that does **not** automatically represent a published result.

```js
const art = window.__yofiArtworkIntelligence;
const before = art?.diagnostics();
const source = art?.source('fakemon','BWMC6BSH0WZDR');
const record = await art?.inspect('fakemon','BWMC6BSH0WZDR');
const after = art?.diagnostics();
console.log({sameCounters: JSON.stringify(before?.counters) === JSON.stringify(after?.counters),
  sourceState: source?.state, candidateSha: source?.candidate?.contentSha256 ?? null,
  lastGoodSha: source?.lastSuccessful?.contentSha256 ?? null,
  recordState: record?.recordState});
```

**Schema example only (NOT executed in a browser):** `{sameCounters:true,sourceState:'source_resolved',candidateSha:null,lastGoodSha:'…previous verified SHA…',recordState:'validating'}`. With no last-good record `lastGoodSha` is `null`. No fake empty-string SHA or automatic background scan occurs when this diagnostic runs. `decodeSilhouette` must reject malformed byte lengths, nonzero bit padding or inconsistent hash before answering pixel queries.

**Measured test fixture, not a live record:** `fixtures/real/BWMC6BSH0WZDR_python_reference.json` has actual original-Python Rock/Steel color data and a 65,702-byte exact packed mask with corresponding hash; it does **not** establish the presence or content of an ART browser DB. No ART console API exists yet in ART-01.
