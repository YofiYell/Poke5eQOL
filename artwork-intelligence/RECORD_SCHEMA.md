# ART-01-R01 — Namespaced storage and failure-safe validation schema

**Schema contract:** `schemaVersion=1`, proposed database `yofi-artwork-intelligence` with IndexedDB version `1`. ART-01 creates no live DB. All schema examples below are design contracts, not measured persisted user records.

## Logical identity

Each record is identified **only by native species ID within a namespace**. Separate stores for `fakemon` and `pokemon` prevent same ID collisions without compound storage keys:

| IndexedDB objectStore | keyPath | Responsibility |
|---|---|---|
| `fakemonRecords` | `speciesId` | Last complete successful Fakémon analysis record |
| `pokemonRecords` | `speciesId` | Reserved for future offline official metadata; **not populated in ART-02 Fakémon scanner** |
| `fakemonMasks` | `speciesId` | Exact binary silhouette Blob/Uint8Array for last successful record |
| `pokemonMasks` | `speciesId` | Reserved for future official metadata |
| `fakemonStatus` | `speciesId` | Mutable latest validation/analysis failure and attempt diagnostics |
| `pokemonStatus` | `speciesId` | Reserved |

No extra composite key involving URL, shiny variant, viewport, edition or artwork content. The `SpeciesIdentifier` convention `F.<readKey>` should be normalized **once** at the resolver boundary to the site's existing Fakémon ID; the record stores `nativeSpeciesId` separately when needed. Do not create two logical records for `F.<id>` versus `<id>`. Official record ID canonicalization must be verified before future migration: QOL route `pokemon:<edition>:<id>` and Theme's native ID mapping differ; neither should be blindly repurposed as the stored species ID.

## Proposed record v1

```json
{
  "schemaVersion": 1,
  "speciesId": "EXAMPLE_FAKE_ID",
  "namespace": "fakemon",
  "nativeSpeciesId": "F.EXAMPLE_FAKE_ID",
  "analysisRevision": 3,
  "normalSource": {
    "href": "https://example.invalid/normal-main.png",
    "sourceRecordRevision": null,
    "contentSha256": "<64 hex characters>",
    "mediaField": "normalPortrait",
    "imageFormat": "PNG",
    "width": 722,
    "height": 722,
    "decodedRgbaSha256": "<64 hex characters>"
  },
  "types": {"primary": "ghost", "secondary": "psychic", "signature": "ghost/psychic"},
  "scanner": {"version": "1.0.0", "configSha256": "<64 hex characters>", "referenceSha256": "f6ac6e346e2e93b2c05110ebe286c8e37d2120b9d035d9ce1766e536d133f1cd"},
  "color": {
    "state": "ready", "stats": "<complete Python colors() output, no omissions>",
    "decision": "<complete Python decide() output, no omissions>"
  },
  "geometry": {
    "state": "ready", "reliable": true, "alphaThreshold": 1,
    "width": 722, "height": 722,
    "bounds": {"left": 0, "top": 0, "right": 722, "bottom": 722},
    "occupiedPixels": "<measured integer>",
    "components": "<measured integer>", "holes": "<measured integer>",
    "maskFormat": "packed-msb-row-v1", "maskStrideBytes": 91,
    "maskLength": 65702, "maskSha256": "<64 hex characters>",
    "maskStore": "fakemonMasks"
  },
  "lastSuccessfulAnalysisAt": "<ISO-8601 UTC>",
  "lastSuccessfulValidationAt": "<ISO-8601 UTC>"
}
```

All nonliteral angle-bracket values above are **schema placeholders**, not computed data for the 722×722 Fakémon fixture. If color is successful but opaque geometry is unreliable, save `color.state='ready'`, `geometry.state='unavailable_opaque'`, `geometry.reliable=false`, `maskStore=null`. Preserve separate statuses; geometry failure does not imply color failure.

The separate status-store entry holds `{speciesId,attemptId,sourceHref,state:'cached'|'validating'|'analyzing'|'ready'|'unavailable'|'error',startedAt,endedAt,validationError,analysisError,storageError,lastFailedAt,attemptCount}` and must **never replace** `lastSuccessfulAnalysisAt` or clear the last successful decision. Record schema migration and scanner version changes are independent of stored data.

### Storage-size calculation

For the user-reported 722×722 example, one full-canvas bitmask is `ceil(722/8)×722 = 65,702 B` (not including IndexedDB object/Blob overhead). Unpacked RGBA would use `2,085,136 B`. The 16 synthetic PNGs total **3,849 B on disk**, but each 64×64 full mask uses `512 B`, so the masks would total at most `8,192 B` if all stored (only 12 have reliable geometries in the executed tests). IndexedDB overhead, compression, retention and Safari quota have **not been measured**.

## Atomicity / race behavior

1. Prepare a complete new record and **complete immutable mask payload in memory**. Verify source SHA-256, canonical decoded pixels, type signature, scanner config, alpha/geometry and all expected fields before write.
2. Start a single `readwrite` IDB transaction including the matching `<namespace>Records` and `<namespace>Masks` stores. Compare the record's current `analysisRevision`/validation generation to the job's input generation. Replace both records in the same transaction. For opaque/unavailable geometry, delete an obsolete mask *within the same transaction* and commit metadata that says geometry is unavailable.
3. Only on transaction `complete`, replace the memory snapshot and dispatch **one** `yofi:artwork-intelligence:updated` event for the entire new decision. On transaction `abort`, leave both stores unchanged; record failure separately and retain the last successful memory decision. When storage is unavailable, a successful analyzed result may be marked `memory-only` and published coherently, **never represented as persisted**.
4. A fresh scan for an older content/type/scanner generation must not overwrite a newer committed generation. Use a per-species job token and compare current canonical source/type/signature before commit. Aborted stale-route computation may be cached for its *own* ID only if still matching its normal source; it must not update a different live card.
5. On module/version schema changes, migrate records in versioned `onupgradeneeded`, not by deleting all user records. If migration cannot validate a binary mask decoder or source fingerprint, mark that geometry unavailable pending reanalysis but preserve color until safely superseded.

## Cache/validation lifecycle

- On module initialization, open IndexedDB asynchronously. `peek()` reads only the memory cache; `lookup()` may read IDB but does not start validation or a fetch. Keep last successful results available immediately **once hydrated**, then revalidate in the background (without delaying the native card).
- A session `Set(namespace,speciesId)` marks which IDs have received the first *relevant visit after each browser refresh*. Revisit within the same session does not refetch unchanged art. No rescan on theme toggle, shiny toggle, resize or fullscreen.
- First relevant Fakémon visit starts **one** normal-source revalidation. Prefer conditional HTTP validation where server supports trustworthy ETag/Last-Modified; otherwise fetch normal bytes once and hash SHA-256. A verified 304 may count as successful source validation; an ambiguous/opaque response is not source validation.
- If content SHA, scanner algorithm/config or canonical decoded RGBA differ: reanalyze. If source bytes match and relevant type pairing changes: recompute `decide()` from saved color metrics after verifying scanner/config/source; only rescan pixels if those prerequisites differ. If URL changes but fingerprint matches, review source identity and update metadata safely; URL alone must not be used as a primary key.
- While validation runs, readers see the last successful decision plus a `validating` status. A failed request or unreadable CORS image sets `validationError`, leaves successful record and mask untouched. Only a new **complete successful** analysis updates the published decision.
- If IndexedDB is denied/quota-restricted/evicted, use bounded in-memory snapshots with a documented `cacheSource='memory'`; do not assert durable persistence and do not duplicate binary mask data into localStorage.

## Synchronous fast snapshot — optional, not default

A tiny last-successful `{speciesId,namespace,sourceSha256,typeSignature,scannerVersion,banner,tint,revision}` summary (hundreds of bytes) *may* be used in localStorage only if measured benefit exceeds synchronous read/write cost and if it can be validated against a matching source identity. **Never put full masks or image blobs in localStorage.** The canonical record stays in IDB. Prefer in-memory hydration and consumers' existing fallbacks to speculative stale first-frame colors. No immediate browser update is implemented in ART-01.
