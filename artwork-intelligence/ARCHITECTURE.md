# ART-01-R02 — Architecture and inspected ownership

## Actual repository baseline

Checked `YofiYell/Poke5eQOL` branch `dev/hero-restoration-2026-10-14` at `f79be54ca2c67ce75f74faef0882329470f3cbe8`. Current installed script headers:

| Repo file | Extension-visible name | `@version` | Runtime owner |
|---|---|---|---|
| `Poke5e QOL.js` | `QOL [v0.13.4]` | `0.13.4` | navigation, native card normalization, shiny portrait controls, prepaint readiness |
| `Poke5e Species Card Adapter.js` | `Species Card [v0.1.26]` | `0.1.26` | hero geometry and canonical section promotion |
| `Poke5e Theme Overlay.js` | `Theme Overlay [v0.3.49]` | `0.3.49` | all tint/color rendering and existing official artwork index |

Do **not** use older BIO-01-R02 versions listed in the initial packet; the branch has subsequent GEO-01 revisions and META-01 version updates. The current root repository has these three scripts and README; a separate `artwork-intelligence/` directory does not conflict with existing naming conventions.

Native source inspected at [`Auroratide/poke5e`](https://github.com/Auroratide/poke5e/tree/881f3caeb899dd36a0325feef3f4e7004b0035af) main SHA `881f3caeb899dd36a0325feef3f4e7004b0035af`: `PokemonSpecies.ts`, `PokemonSpeciesCard.svelte`, `SpeciesIdentifier.ts`, `SpeciesMedia.ts`, `SpeciesPortrait.svelte`, `Art.svelte`, `SideArtCardSection.svelte`, `SpeciesMedia.test.ts`, Fakémon stores.

### Native identity and image lifecycle

- `PokemonSpecies` exposes `id`, `type`, `media`; its data has `media.values.normalPortrait`, `normalPortraitF`, `shinyPortrait`, `shinyPortraitF`, sprite counterparts. Official JSON maps `media.main` to `normalPortrait`. Native Fakémon IDs use `F.` prefix (`SpeciesIdentifier.isFakemon()`), distinct from a Fakémon read key.
- `SpeciesMedia.portrait({shiny,gender})` chooses gender-specific portrait where available; shiny may instead use the normal portrait with `customization.shinyHue` applied. **Displayed `img.src` is not an authoritative normal/main source**. `SpeciesMedia.setByGender()` falls back to nonfemale media if a female-specific source is absent.
- `SpeciesPortrait.svelte` resolves external `http` versus app asset URLs, chooses the media variant and renders `Art`. An avatar override is a separate source and must not be used for species analysis.
- `Art.svelte` keys `<img-zoom><img ...></img-zoom>` by `src`, can apply a `hue-rotate` filter, shiny shimmer mask and `smaller` 90% width for attribution. Its `object-fit:contain`, `img-zoom`, caption, and ancestor transformations affect source-pixel-to-screen mapping.
- `PokemonSpeciesCard.svelte` owns canonical description, info, stats, Abilities, moves and SpeciesPortrait. The card is mounted/updated by Svelte. Replacing native image nodes or adding image observers risks disrupting handoff and shiny state.

### Current userscript ownership and integration seams

**QOL (`Poke5e QOL.js`):**

- `portraitContext()` and `portraitContextFromHref()` read route, namespace and (for official Pokémon) edition; Fakémon route uses `?id=` read key and a `fakemon:<readKey>` internal key.
- `loadPortraitEntries()` reads Fakémon's `get_fakemon` RPC (`normal_portrait_filename` and shiny fields), or official `/srd/v1/<edition>/pokemon/<id>.json`; `portraitEntriesFromFields()` selects explicit portrait sources, not sprites. `requestPortraitEntries()` memoizes and handles errors. These methods are **private inside the userscript**, not a public normal-source getter.
- `preloadPortrait()` independently decodes an image for QOL's ready-card handoff; it must continue without ART. The existing warmup/readiness cache can potentially be reused through a narrowly approved read-only handoff, not by calling private code from a second script.
- `savedPortraitCorner()` returns `'tr'` both when explicitly saved and when no preference exists; `rememberPortraitCorner()` stores explicit corners; `installPortraitControl()` owns the actual button and drag/swipe behavior. ART cannot infer manual-state presence from this fallback.
- `window.__yofiPortraitReadiness.matches(article,routeKey)` is public only for prepaint readiness, **not** a media source resolver. It must not depend on ART.
- QOL listens for `yofi:species-card-prepare-before-reveal` from Species Card. Its navigation/list preservation/ready-card flow remains untouched.

**Species Card (`Poke5e Species Card Adapter.js`):**

- Emits `yofi:species-card-prepare-before-reveal` and `yofi:species-card-before-reveal`; exposes `window.__yofiSpeciesCardPresentation.prepare()`; emits `yofi:species-card-presentation-ready` during fullscreen list handoff.
- `portraitRatio()` uses existing `<img>` natural dimensions and records source/route; `watchPortraitImage()` observes individual image load completion; no global scanning of image pixels.
- `createMeasurer()`, `geometryFor()`, `selectGeometry()`, `chooseStage()` determine placements and `apply()` reparents the actual score and Abilities nodes. The existing DOM lifecycle, measurement caching and stage/width hysteresis must remain authoritative.
- ART geometry may later be *read as optional input*, never directly mutate cards, resize the portrait, force a stage or introduce its own layout observer.

**Theme Overlay (`Poke5e Theme Overlay.js`):**

- `ARTWORK_TYPE_CHOICES` and `ARTWORK_IDS_BY_NATIVE_RECORD` are the **current authoritative official Pokémon index**, not a Fakémon scanner cache. `speciesIdentity()` reads native ID/type/title; `syncArtworkChoice()` chooses colors and writes CSS variables; `clearArtworkChoice()` removes them.
- Fakémon without an index currently fall back to header primary/secondary type ordering. In ART-02 only a completed, matching Fakémon analysis may offer a better decision; Theme Overlay remains the only writer of colors and retains fallback when data missing.
- Existing per-type tint strengths `ARTWORK_TINT_ALPHA_BY_TYPE`, banner blend, body ink, type choice and monotype behavior remain owned by Theme Overlay. The Python scanner's strength fields are **not license to override the existing per-type UI treatment**.
- Theme Overlay already has one root observer for native updates. Do not add an artwork-specific duplicate observer here.

### Event/lifecycle hazards to handle

1. **Stale card:** URL can change before Svelte publishes new metadata. Match `(namespace, speciesId, normal source, type signature, route token)` before applying an update; never identify an image solely from the visible `<img>`.
2. **Source variants:** Shiny or female-specific image may be displayed while ART stores only a default *normal/main* result. When displayed source does not match analyzed geometry, consumer must use normal geometry only for source-independent metrics, never collision coordinates.
3. **Network duplication:** QOL's normal-source resolver is private. ART-02 requires a single source-coordinator seam or an explicitly accepted one-per-species redundant lookup, not separate fetches by three consumers.
4. **Image decode:** QOL preloading and Svelte rendering already exist. Reuse readable image bytes/decoded representation if ownership and CORS permit; no second display image or replacement renderer.
5. **Late startup:** `@run-at` differs (QOL/Species Card document-start, Theme document-end). ART registration cannot block the current startup mechanism or hold card readiness. API readiness/update events are supplementary.
6. **Shiny control:** Manual corner including explicit `'tr'` wins; auto results only when no saved manual preference. ART never creates/hides/reconstructs the button.
7. **Records:** Last-successful snapshots may be stale during validation; publish changed UI decisions only after full successful atomic commit. Network error must not erase old results.
8. **Safari:** Earlier single-image canvas probe establishes only that exact image readable in one test. Browser CORS, IndexedDB capacity and eviction guarantees cannot be inferred from it.

### Selected ART-owned acquisition and narrow module architecture

```
ART-owned read-only get_fakemon(_read_key) normal portrait/type lookup
                |
   ART-02 acquisition + SHA-256 + validity checks
                |
  original Python-compatible color path  +  separate alpha silhouette path
                |                                       |
        complete coherent record + full-resolution mask Blob
                |
   IndexedDB atomic commit -> read-only memory snapshot -> one update event
                |
       QOL (optional corner) / Theme (optional Fakémon color) /
       Species Card (optional geometry, future work)
```

**Current target:** Fakémon's `values.normalPortrait` only. Official Pokémon keep their existing index until separate offline-artwork migration approval. ART-01 modifies no runtime scripts and creates no runtime observer. ART-01-R02 now includes one user-provided, source-byte-verified normal portrait fixture with user-observed read key/type pairing; independent per-record RPC access remains blocked in this execution environment.

## ART-01-R02 — Source-code-confirmed acquisition decision

Upstream `SupabaseFakemonDataProvider.getByReadKey()` calls `rpc('get_fakemon',{_read_key:readKey})`, and `rowToFakemon` maps `row.read_key` to `SpeciesIdentifier.fromFakemonReadKey()` (`F.<readKey>`), `row.type` to the species' primary/secondary type, and `row.normal_portrait_filename` into `media.values.normalPortrait`. The current 2026 native migration defines these fields in the same read-only RPC; `SpeciesPortrait` renders `media.portrait({shiny,gender})` and therefore can display shiny, female, hue-shifted or avatar images distinct from `normalPortrait`. QOL's own `loadPortraitEntries()` already calls that read-only RPC with the public anon key and resolves `normal_portrait_filename` against `https://poke5e.auroratide.cloud/`, but does **not** expose its privately memoized response through a public API.

**Least intrusive ART-02 pathway:** ART independently resolves the Fakémon route read key, executes one deduplicated `get_fakemon` request (which may reuse QOL's fetch-warmup cache opportunistically), verifies `read_key`, consumes `type` and **only** `normal_portrait_filename`, builds a validated HTTP(S) URL, then owns one image fetch/decode/hash/full scanner job. QOL's existing navigation, shiny button and ready-card handoff remain completely independent, and Theme/Species Card never fetch pixels themselves. A parallel QOL metadata RPC is a known possible redundancy; benchmark rather than prematurely add a QOL export API or additional observers. The precise SPA route initiation signal needs live-browser checking; existing Species Card prepare/ready events are useful but not a complete independent route source when Species Card is absent.

### New real user-supplied fixture

`fixtures/real/manifest.json` documents Fakémon read key `BWMC6BSH0WZDR`, `rock`/`steel`, normal source URL `https://poke5e.auroratide.cloud/a79eff8c-4872-4b75-9b45-c7cb73cf4f55.png`, original 458,051-byte PNG with verified SHA-256 `0749aa41cc2250c67884ad4a33082566f379756530ce1724798a6c035d470bc6`, frozen Python metrics and mask. **The species ID/types are from the user's browser observations**, not an independently retrieved live `get_fakemon` row. The bytes were supplied by the user and rerun through the unchanged scanner. They are not proxy artwork and do not establish any general corpus coverage.

### Cache and lifecycle corrections

Separate (a) source candidate with unknown SHA, (b) verified fetched bytes, (c) verified decoded image, and (d) last-successful persisted record. A failed candidate never erases the last-good source. The `source()` API's exact nullable stages are in `INTEGRATION_CONTRACT.md`; `RECORD_SCHEMA.md` fixes source/hash/storage semantics. Passive diagnostics do not count cache hits; only active, matching presentation reuse counts as one. A bounded, optional, localStorage last-good **decision-only** sync snapshot improves initial-visit continuity when available and early, but no script waits on ART or promises no first-paint change. This remains a proposal: all live lifecycle, Safari, IndexedDB and routing behavior is unverified until ART-02.
