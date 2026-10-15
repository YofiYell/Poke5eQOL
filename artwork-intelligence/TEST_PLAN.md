# ART-01-R02 — Executed regression tests, source evidence and ART-02 gates

## Provenance of execution

Reference code: `reference/Poke5e_Offline_Color_Scanner_v1.0.0.py` **identical to supplied SHA-256**, 12,699 B. Synthetic fixture generator `tests/generate_fixtures.py`, metric snapshooter `tests/make_expected.py`. Executed locally with Python / Pillow / NumPy / SciPy and Node (record exact environment with the final test log). Browser runtime here is **not an authenticated iPad Safari session**. R01's original Canvas evidence is preserved as historical in `fixtures/real/availability.json`; R02 **received and analyzed the real PNG bytes supplied by the user**, independently verifying the original scanner and frozen fixture hashes. The user's native species ID and type pairing remain observations rather than a live retrieved RPC record.

## Executed ART-01 commands

```bash
sha256sum reference/Poke5e_Offline_Color_Scanner_v1.0.0.py
python -m py_compile reference/Poke5e_Offline_Color_Scanner_v1.0.0.py
python -m unittest discover -s tests -p 'test_*.py' -v
node --test tests/test_*.mjs
```

Historical ART-01-R01 results (these are preserved for provenance; **current R02 results follow below**):

| Tests | Actual result | Meaning |
|---|---|---|
| Scanner-byte SHA256 | **match** `f6ac6e…f133f1cd` | Source unchanged, compilable |
| Python unittest | **18/18 pass** | Full original `colors()` and `decide()` on snapshots, accepted image format behavior, tie/near-tie and exact geometry/corner reference, plus byte-checks of all three existing userscripts |
| Synthetic PNGs | **16 generated and SHA-verified**; total 3,849 B | Labeled synthetic only; not Poké5e artworks |
| Python full color scans | **13 complete**, **3 intentional `too_few_visible_pixels` errors** | Deterministic metrics and categories in expected JSON |
| Exact alpha geometry | **12 reliable**, **3 fully opaque/unreliable**, **1 empty** | Separate mask status; exact 64×64 packed-mask bytes |
| Existing userscripts | **3/3 `node --check` pass; exact Git blob hashes for all three** | No ART API dependency was added; static proof only, not browser startup |
| Node test runner | **12/12 pass** | JS Lab/CIE76/decision math, independent keying, pure cache contract, preferences, stale-route guards |
| JS final-decision math on Python fixtures | **13/13 agreement** | Only final Lab/type-choice function parity; NOT full browser scanner parity |
| Real Fakémon PNG fetch at R01 | **blocked** | Historical execution before the R02 user-uploaded source bytes |

### Fixture coverage (synthetic only)

- Alpha and geometry: transparent margins, alpha 1 and intermediate-alpha boundaries, holes, disconnected components, 1px extensions, opaque/no-alpha segmentation failures.
- Color scanner: corner-consensus border-connected removal, mismatched opaque corners, incidental white, dark outline vs dark interior, bins/clusters, near tie and exact tie, unsupported/few-pixel rejection.
- Transform reference: box-vs-pixel-cell overlap, `object-fit:contain` scale, translation and 90° affine rotation.
- Corner sequence: original bbox all four tested first; expanded exactly one icon width per side only after all four original fail; deterministic top-right tie order; manual `tr` preference distinct from default `tr`.
- 722×722 storage calculations: 65,702 B for 1-bpp packed mask; 2,085,136 B for decoded RGBA (not runtime measurements).

## ART-01-R02 — Real normal-artwork fixture status (current)

- **Original user-supplied ZIP** `ART-01-R02_Real_Fakemon_Fixture.zip`, SHA-256 `4c7093404d33483ed85941b928a821214c1a88df32d62690bb09ba5a598be45f`. The exact supplied PNG is committed at `fixtures/real/BWMC6BSH0WZDR_normal.png` (458,051 B, SHA-256 `0749aa41cc2250c67884ad4a33082566f379756530ce1724798a6c035d470bc6`). **Not fetched from the image host by this container.**
- Normal-artwork source URL: `https://poke5e.auroratide.cloud/a79eff8c-4872-4b75-9b45-c7cb73cf4f55.png`; user-observed Fakémon read key `BWMC6BSH0WZDR`, primary `rock`, secondary `steel`. Upstream `get_fakemon` schema and row mapping independently confirm these native *fields and their roles*, but the **specific record** was not independently retrieved due DNS/browser restrictions.
- Complete frozen Python `colors()` matches the original scanner exactly: weighted `#8A6A66`, raw `#856763`, dominant `#9F4C4E` (`0.23948`), 285,199 color pixels, 17,825 discounted outline pixels, 0 connected background pixels removed. Decision banner `rock`, tint `steel`, scores `38.407839` and `47.388701`, margin `8.980862`. Full clusters/CIE76 in `fixtures/real/BWMC6BSH0WZDR_python_reference.json`.
- Full-resolution alpha>=1 geometry: 306,042 occupied, 215,242 alpha zero, 2 occupied components, 1 hole, bounds `(3,0,722,690)`. Mask 65,702 B with SHA-256 `3a2a9bc555888d03caa2044f23ae9685c44dff349ae300bca22c62e5ff244ee1`; independent diagnostic alpha>=128 bounds `(8,0,718,685)`. Connected exterior transparent region 214,900 pixels touching all four borders -> `ready` geometry confidence. Exact alpha >=1 bounds continue to govern first-pass corner placement.
- R02's separate `fixtures/real/manifest.json` and updated `availability.json` record verified bytes, current availability and the earlier R01 host-access failure separately. The historical full official-artwork manifest/corpus remain unavailable; **one real fixture is not general database coverage**.

### R02 reliability / data-state regressions

The test-only geometry source now distinguishes exact raw alpha occupancy from confidence that alpha is actually subject/background separation. A transparent corner dot, small interior hole or only one transparent border ring **must not** pass the reliable silhouette gate; meaningful 4-connected exterior transparent margins must pass. Its perimeter-derived gate is conservative and still requires testing on diverse real artworks in ART-02. Faint alpha 1 extensions remain in the authoritative mask regardless of diagnostic alpha>=128 bounds.

The cache model's `peek()`, `lookup()`, `inspect()` and `diagnostics()` are passive. Only accepted **active presentation reuse** increments `cacheHits`; asynchronous IDB hydration counts separately; first relevant source validation, full-image scan completion and changed-decision publication each have independent counters. The source-state model tests `source_resolved` with null SHA, verified byte SHA, decoded verification, complete analysis, and source-failure retention of last-good data. Additional synthetic source-resolver tests reject wrong read key, missing normal portrait, non-HTTP(S) source and invalid types; shiny metadata never substitutes for normal artwork.

## R02 executed regression summary (measured, not projected)

| Verification | Observed outcome |
|---|---|
| Provided ZIP SHA-256 | `4c7093404d33483ed85941b928a821214c1a88df32d62690bb09ba5a598be45f` — exact match |
| Original unchanged scanner bytes | 12,699 B, SHA-256 `f6ac6e346e2e93b2c05110ebe286c8e37d2120b9d035d9ce1766e536d133f1cd` |
| Real PNG source bytes | 458,051 B, SHA-256 `0749aa41cc2250c67884ad4a33082566f379756530ce1724798a6c035d470bc6` |
| Real exact packed mask | 65,702 B, SHA-256 `3a2a9bc555888d03caa2044f23ae9685c44dff349ae300bca22c62e5ff244ee1` |
| Python `unittest` (original + real + alpha pathologies) | **29 passed, 0 failures** |
| Node `--test` (original + source state/cache/decision) | **24 passed, 0 failures** |
| Original synthetic manifest and 16 fixture hashes | Unchanged, all original hashes and expected Python outputs verified |
| Original three userscripts | Unmodified; byte/Git-SHA and version-header integrity checks passed |
| Real scanner result and frozen JSON | Entire `colors()` + `decide()` dictionaries identical |
| Real silhouette geometry/reliability | `ready`; exact alpha>=1 mask and alpha>=128 diagnostic bounds reproduced |
| Browser end-to-end / Safari / IDB | **Not executed** — requires ART-02 and real target-browser session |

Reference test-only JS decision math confirms Rock vs Steel output within the documented CIE76 tolerance; it does **not** implement or test a browser full-resolution scanner. The Python R02 reliability classifier is a **conservative contract reference**, not a validated universal classifier on diverse live Fakémon artwork.

## Cross-language parity release criteria (ART-02)

1. Full browser implementation must match original Python **on identical source bytes AND canonically decoded RGBA pixels**. Compare source/decoded SHA-256, dimensions, alpha mask integer count, border-connected background removal count, edge/outline counts, RGB averages, up to eight cluster centroids and coverages, CIE76 distances and banner/tint.
2. Exact categorical equality, palette strings, cluster order and tie winner. Six-place numeric quantities `abs(JS-Python)<=1e-6`; if a near-tie changes winner, parity fails despite small numeric deltas.
3. Browser image decoding must test PNG, JPEG, WEBP, GIF and TIFF support/limitations. Browser unsupported formats remain explicit, never silently reprocessed as thumbnail or shiny. Explicitly test ICC/sRGB, EXIF orientation, browser canvas unpremultiplication and one-pixel alpha differences.
4. Geometry bitmaps and bbox exact for the same RGBA data; test corner original pass, symmetric +icon-width expansion, alternative corners, UI collision, rotated/scaled transforms and `object-fit` positioning.
5. Verify the **already SHA-verified uploaded real PNG** in the actual target browser against the authoritative live `get_fakemon` read key, normal portrait URL, type pairing and decoded RGBA checksum. ART-01 Python results are established; cross-browser scan/decoding parity remains ART-02.

## Reproducible integration/cache tests required in ART-02

| Scenario | Expected observable assertion | ART-01 state |
|---|---|---|
| Two namespaces same ID | Independent records, no collisions | **Pure model executed** |
| Successful color + geometry IDB tx | Both stores atomically updated; exactly one update event | **Pure model executed; actual IDB blocked** |
| Failed validation | Last successful record and mask retained | **Pure model executed; actual IDB blocked** |
| First relevant visit after refresh | Once per species per session; IDB hydrates asynchronously; only real reuse counts hit | **Pure R02 model executed; actual browser blocked** |
| Same-session revisit | No additional download/scan, explicit application counts a cache hit | **Pure R02 model executed** |
| Normal source/content SHA changes | Null SHA requires fetching; new verified bytes trigger scan; only authoritative normal portrait | **Pure R02 resolver/state model executed; no browser fetch** |
| Type pair changes | Recompute `decide()` on valid saved colors, no wrong old type | **Pure model type branch only** |
| Scanner version/config changes | Recompute/revalidate according to version | **Pure model version branch only** |
| Shiny toggle / viewport resize / theme change | No full scan; only cheap render-corner computation on resize | **Pure no-scan test executed** |
| Manual saved `tr` versus missing preference | Saved `tr` wins, missing may use auto, then existing `tr` fallback | **Pure test executed** |
| QOL without ART | Existing button and navigation unchanged | **Not runtime-tested here** |
| Three existing scripts without ART | Current approved behavior unchanged | **Existing files unmodified; no live startup run here** |
| Four scripts, independent startup order | No missing-module blocking or duplicate observers | **Requires ART-02 fourth script** |
| ART failure + recovery | Prior result still visible; one atomic changed-result event on recovery | **Pure model only** |
| Official Pokémon with ART installed | Official tint/banner index byte-for-byte unchanged | **Requires live ART-02 integration** |
| Route change while scan pending | Event never paints outgoing record onto incoming card | **Pure stale-route test executed** |
| iPad Safari / storage evictions / quotas | Correct statuses, graceful memory fallback and no false persistence claim | **Blocked; no iPad session** |
| Real Fakémon full corpus | Actual coverage manifest, forms and source hashes; no invented counts | **Not in ART-01** |

### Performance and compatibility risks (quantification required later)

- 722×722 decoded RGBA is **2,085,136 bytes** per uncompressed buffer before Lab arrays/EDT/cluster buffers; Python and JS worker allocations may require multiple buffers. **No ART-01 measurement** of full-image scan time or Safari peak memory.
- Distance transform must be exact Euclidean EDT. A naive JS pixel² neighbor algorithm or repeated browser screenshot/canvas sampling is unacceptable. Implement an O(W×H) EDT or matching tested algorithm with worker/bounded chunks; match SciPy values at boundary cases.
- `Canvas getImageData` cross-origin taint errors, network/fetch CORS and Safari color-management differences must be handled without erasing cached valid metadata.
- Structured-clone Blob behavior and IndexedDB atomicity should be verified under simulated abort/quota and genuine Safari storage restrictions. No Safari persistence guarantee is asserted.
- Native portrait source may update while route key stays unchanged. Fresh normal source hash/type signature validation and generation tokens must prevent stale publication.
- Avoid any worker/decoder use from Theme/QOL/Species Card. Producer is single owner; consumers only read and receive coherent updates.

## Precise ART-02 prerequisites / exit gates

1. **Satisfied locally:** original real normal Fakémon PNG, source SHA, exact mask and frozen Python results are in the repo. **Outstanding browser acceptance:** independently query the live `get_fakemon` row for this read key/source/type pair; verify browser-side CORS, decoded RGBA parity and hash in the target Safari/browser. No proxy art.
2. **Architecture selected:** use one independent ART-owned, in-flight-deduplicated read-only `get_fakemon` resolver. No QOL export/API edit. Test source resolution and event-driven route initiation, including Species Card absent and shiny displayed; measure any redundant QOL metadata RPC.
3. Implement full browser scanner from the **unchanged Python source**: RGBA parity, α>=128 mask, corner consensus, 4-connected fill, EDT, dark/white weighting, RGB bins, weighted Lab clustering/centroids, CIE76 and tie rules. Pass reference fixtures before integrating with cards.
4. Implement full-resolution alpha>=1 exact geometry, the R02 confidence classifier, collision-ready `packed-msb-row-v1` decoding, independent alpha>=128 diagnostic bounds and the unchanged two-pass corner rule. Test pathologies plus the real mask byte-for-byte.
5. Implement namespaced IndexedDB v1 and atomic record/mask commits with failure retention, nullable source candidate state machine, new-session revalidation, bounded localStorage decision-only snapshot, generation guards and quota/blocked fallback. Benchmark real memory and elapsed time on iPad Safari; verify no forced card delay or misleading persisted-state report.
6. Expose the reconciled `INTEGRATION_CONTRACT.md` v1 read-only API, passive diagnostics with independent counters and **one event per meaningfully changed complete** result. Ensure hydration/unchanged validation does not publish changed-decision events. No production UI manipulation in producer.
7. Demonstrate QOL/Theme/Species Card independent operation and existing official Pokémon color choices unchanged, including all load orders, shiny and list-to-card transitions.
8. Only then propose optional consumer integration as separate approved work, with no migration of the official artwork-choice index until independently validated.

**ART-01-R02 readiness assessment:** READY FOR ART-02 **implementation to begin** with the documented Python real fixture, source acquisition, mask confidence, cache and public API contracts. This is **not** a claim that browser scanner parity, live species-record verification, Safari persistence or independent four-script runtime is already passing. Those are ART-02 acceptance gates. No consumer integration or official Pokémon index migration is authorized by this document.
