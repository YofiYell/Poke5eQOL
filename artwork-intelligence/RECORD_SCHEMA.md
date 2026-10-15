# ART-01-R02 — Namespaced storage, source states and failure-safe validation

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
    "state": "ready", "reliable": true, "alphaThreshold": 1, "reliabilityReason": "meaningful_border_connected_transparency",
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

All nonliteral angle-bracket values above are **schema placeholders**, not computed data for the 722×722 Fakémon fixture. If color analysis succeeds but geometry is opaque **or ambiguous**, save `color.state='ready'`, `geometry.state='unavailable_opaque'|'unavailable_alpha_ambiguous'`, `geometry.reliable=false`, and `maskStore=null`; retain informational observed-occupancy counts/hash/bounds and confidence evidence without publishing a collision-eligible silhouette. Geometry unavailable is independent of color readiness. The example numeric bounds above are schematic, not the measured real fixture.

The separate status-store entry holds `{speciesId,attemptId,sourceState,candidateSourceHref,candidateContentSha256:null|string,candidateDecodedSha256:null|string,state:'missing'|'cached'|'validating'|'analyzing'|'ready'|'unavailable'|'error',startedAt,endedAt,validationError,analysisError,storageError,lastFailedAt,attemptCount}`. Candidate hash fields are **nullable**, never fake `''`/all-zero SHA values. This store must **never replace** the complete last successful record or clear its timestamps. Record schema migration and scanner version changes are independent of stored data.

### Storage-size calculation

For the user-reported 722×722 example, one full-canvas bitmask is `ceil(722/8)×722 = 65,702 B` (not including IndexedDB object/Blob overhead). Unpacked RGBA would use `2,085,136 B`. The 16 synthetic PNGs total **3,849 B on disk**, but each 64×64 full mask uses `512 B`, so the masks would total at most `8,192 B` if all stored (only 12 have reliable geometries in the executed tests). IndexedDB overhead, compression, retention and Safari quota have **not been measured**.

## Atomicity / race behavior

1. Prepare a complete new record and **complete immutable mask payload in memory**. Verify source SHA-256, canonical decoded pixels, type signature, scanner config, alpha/geometry and all expected fields before write.
2. Start a single `readwrite` IDB transaction including the matching `<namespace>Records` and `<namespace>Masks` stores. Compare the record's current `analysisRevision`/validation generation to the job's input generation. Replace both records in the same transaction. For opaque/unavailable geometry, delete an obsolete mask *within the same transaction* and commit metadata that says geometry is unavailable.
3. Only on transaction `complete`, replace the memory snapshot and dispatch **one** `yofi:artwork-intelligence:updated` event for the entire new decision. On transaction `abort`, leave both stores unchanged; record failure separately and retain the last successful memory decision. When storage is unavailable, a successful analyzed result may be marked `memory-only` and published coherently, **never represented as persisted**.
4. A fresh scan for an older content/type/scanner generation must not overwrite a newer committed generation. Use a per-species job token and compare current canonical source/type/signature before commit. Aborted stale-route computation may be cached for its *own* ID only if still matching its normal source; it must not update a different live card.
5. On module/version schema changes, migrate records in versioned `onupgradeneeded`, not by deleting all user records. If migration cannot validate a binary mask decoder or source fingerprint, mark that geometry unavailable pending reanalysis but preserve color until safely superseded.

## Cache/validation lifecycle

- On module initialization, optionally read one **bounded minimal last-good decision snapshot** synchronously from localStorage for the *current relevant* species, then asynchronously open/hydrate IndexedDB. `peek()` reads memory only; `lookup()`/`inspect()` may read IDB but remain passive. Neither an IDB hydration nor a DevTools inspection counts as a cache hit. A cache hit is counted **only when an active presentation consumer successfully reuses a compatible last-good record**. New session relevant visits initiate background normal-source revalidation; native card rendering never waits.
- A session `Set(namespace,speciesId)` marks which IDs have received the first *relevant visit after each browser refresh*. Revisit within the same session does not refetch unchanged art. No rescan on theme toggle, shiny toggle, resize or fullscreen.
- First relevant Fakémon visit starts **one** normal-source revalidation. Prefer conditional HTTP validation where server supports trustworthy ETag/Last-Modified; otherwise fetch normal bytes once and hash SHA-256. A verified 304 may count as successful source validation; an ambiguous/opaque response is not source validation.
- If content SHA, scanner algorithm/config or canonical decoded RGBA differ: reanalyze. If source bytes match and relevant type pairing changes: recompute `decide()` from saved color metrics after verifying scanner/config/source; only rescan pixels if those prerequisites differ. If URL changes but fingerprint matches, review source identity and update metadata safely; URL alone must not be used as a primary key.
- While validation runs, readers see the last successful decision plus a `validating` status. A failed request or unreadable CORS image sets `validationError`, leaves successful record and mask untouched. Only a new **complete successful** analysis updates the published decision.
- If IndexedDB is denied/quota-restricted/evicted, use bounded in-memory snapshots with a documented `cacheSource='memory'`; do not assert durable persistence and do not duplicate binary mask data into localStorage.

## Startup display continuity — R02 chosen bounded sync snapshot

**Decision:** use a tiny, bounded last-successful **color decision** snapshot in localStorage as an optional fast path, keyed by namespace/species ID; canonical analysis/masks remain in IndexedDB. Store only `{schemaVersion,speciesId,namespace,normalSourceHref,contentSha256,typesSignature,scannerVersion,selectedBannerType,selectedTintType,analysisRevision}` plus integrity/version metadata. Cap to **50 species** with LRU/oldest eviction, and permit storage denial without blocking anything. There is never a large mask, decoded RGBA, full analysis record, PII/write key or repeated full response in localStorage.

ART reads a matching snapshot at module initialization / relevant first route so a future **opt-in Theme Overlay** may use it during its own initial color application when load order permits. A snapshot is last successful, **not proof that today's source bytes match**: it must match known candidate normal URL, types and scanner version; an unknown hash is expressly still `source_resolved`. The successful IDB record confirms/corrects it after asynchronous hydration. Publish only a *meaningfully changed* completed decision after verification. If localStorage is missing/blocked or ART loads too late, a late paint change can still occur; **we do not promise flash-free first paint**, delay native cards, or insert placeholders to mask the transition. Theme Overlay integration is not part of ART-01-R02.

Only write the snapshot after a complete successful publication/atomic IDB transaction, or label transient memory-only results explicitly when IDB is denied. If a prior snapshot is inconsistent with IDB, invalidate that fast snapshot; do not overwrite an already reliable live decision with speculative data. Measure synchronous read cost, quota and Safari behavior during ART-02; no persistence guarantee is claimed.

## Candidate normal-source lifecycle versus last successful record

A **stored successful `normalSource` is immutable validated history** and must contain `href`, `contentSha256` (64 verified hexadecimal characters), `decodedRgbaSha256`, format and dimensions. By contrast, the mutable status-store `candidateSource` and the public `source()` response have these stages:

| Source state | Candidate URL | Byte SHA | Decoded SHA | Last success |
|---|---|---|---|---|
| `unresolved` | `null` | `null` | `null` | May exist independently |
| `source_resolved` | authoritative `normalPortrait` URL | `null` | `null` | Retained |
| `source_bytes_verified` | verified candidate URL | 64-hex SHA | `null` | Retained |
| `decoded_image_verified` | same | verified | verified | Retained |
| `analysis_complete` | same | verified | verified | Atomically published if meaningful |
| `source_validation_failed` | attempted URL or `null` | verified only if verification reached | decoded if reached | **Unchanged** |

Record the **candidate** from the trusted Fakémon read-only `get_fakemon` row; never derive it from displayed shiny/sprite/current `img.src`. A same-URL candidate with null hash is *not* a content match. Its first relevant visit after refresh verifies bytes/ETag and then reruns scan or reuses appropriately. Failed fetch/decoding writes only attempt status; a stale route or older generation may not replace newer results. The `lastVerified` transient fingerprint is distinct from `lastSuccessful` record and does not itself authorize a published decision.

**Counts:** `idbHydrations` records successful memory hydrations from IDB, `cacheHits` records active presentation reuse only, `sourceRevalidations` attempted first-session normal-source validations, `scansCompleted` finished full-resolution analyses, `updateEventsPublished` meaningful coherent changes, and `analysisFailures` errors. None of `peek`, `lookup`, `inspect`, `status`, `source` or `diagnostics` increments usage counters. The reference model simulates these transitions; actual transaction and persistence behavior remain ART-02 tests.
