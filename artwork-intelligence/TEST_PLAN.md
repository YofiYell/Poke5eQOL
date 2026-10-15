# ART-01-R01 — Executed tests, blocked validation and ART-02 gates

## Provenance of execution

Reference code: `reference/Poke5e_Offline_Color_Scanner_v1.0.0.py` **identical to supplied SHA-256**, 12,699 B. Synthetic fixture generator `tests/generate_fixtures.py`, metric snapshooter `tests/make_expected.py`. Executed in Linux container with **Python 3 / Pillow 12.3.0 / NumPy 2.3.5 / SciPy 1.17.0 / Node 22.16.0**. Browser runtime here is **not an authenticated iPad Safari session**. The user's original 722×722 Canvas result is retained in `fixtures/real/availability.json` as user-provided evidence, not remeasured data.

## Executed ART-01 commands

```bash
sha256sum reference/Poke5e_Offline_Color_Scanner_v1.0.0.py
python -m py_compile reference/Poke5e_Offline_Color_Scanner_v1.0.0.py
python -m unittest discover -s tests -p 'test_*.py' -v
node --test tests/test_*.mjs
```

Executed results:

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
| Real Fakémon PNG fetch | **blocked** | No source SHA, no verified identity/type, no scan |

### Fixture coverage (synthetic only)

- Alpha and geometry: transparent margins, alpha 1 and intermediate-alpha boundaries, holes, disconnected components, 1px extensions, opaque/no-alpha segmentation failures.
- Color scanner: corner-consensus border-connected removal, mismatched opaque corners, incidental white, dark outline vs dark interior, bins/clusters, near tie and exact tie, unsupported/few-pixel rejection.
- Transform reference: box-vs-pixel-cell overlap, `object-fit:contain` scale, translation and 90° affine rotation.
- Corner sequence: original bbox all four tested first; expanded exactly one icon width per side only after all four original fail; deterministic top-right tie order; manual `tr` preference distinct from default `tr`.
- 722×722 storage calculations: 65,702 B for 1-bpp packed mask; 2,085,136 B for decoded RGBA (not runtime measurements).

## Actual real-world fixture status

URL: `https://poke5e.auroratide.cloud/a79eff8c-4872-4b75-9b45-c7cb73cf4f55.png`.

- User-reported Safari Canvas probe: readable, `722×722`, first pixel `(0,0,0,0)`; **valid evidence for that earlier session only**.
- This execution: direct container HTTP failed DNS resolution; specialized download failed; web fetch yielded cache miss. Full bytes were not retrieved. Its SHA-256, native Fakémon species identity/type pair, palette results, geometry and silhouette counts are **not measured**.
- The corpus/manifest of all historical official artwork is also missing, so no complete-scan counts or unverified proxy-artwork examples are committed.

## Cross-language parity release criteria (ART-02)

1. Full browser implementation must match original Python **on identical source bytes AND canonically decoded RGBA pixels**. Compare source/decoded SHA-256, dimensions, alpha mask integer count, border-connected background removal count, edge/outline counts, RGB averages, up to eight cluster centroids and coverages, CIE76 distances and banner/tint.
2. Exact categorical equality, palette strings, cluster order and tie winner. Six-place numeric quantities `abs(JS-Python)<=1e-6`; if a near-tie changes winner, parity fails despite small numeric deltas.
3. Browser image decoding must test PNG, JPEG, WEBP, GIF and TIFF support/limitations. Browser unsupported formats remain explicit, never silently reprocessed as thumbnail or shiny. Explicitly test ICC/sRGB, EXIF orientation, browser canvas unpremultiplication and one-pixel alpha differences.
4. Geometry bitmaps and bbox exact for the same RGBA data; test corner original pass, symmetric +icon-width expansion, alternative corners, UI collision, rotated/scaled transforms and `object-fit` positioning.
5. Verify the supplied real Fakémon PNG in a browser that can access bytes: collect authoritative species ID and type metadata first, then SHA the bytes and run Python scanner on that exact file. Do not infer from visual appearance.

## Reproducible integration/cache tests required in ART-02

| Scenario | Expected observable assertion | ART-01 state |
|---|---|---|
| Two namespaces same ID | Independent records, no collisions | **Pure model executed** |
| Successful color + geometry IDB tx | Both stores atomically updated; exactly one update event | **Pure model executed; actual IDB blocked** |
| Failed validation | Last successful record and mask retained | **Pure model executed; actual IDB blocked** |
| First relevant visit after refresh | Once per species per session, stale result readable pending revalidation | **Pure model executed; actual browser blocked** |
| Same-session revisit | No additional download/scan | **Pure model executed** |
| Normal source/content SHA changes | Reanalyze from new normal bytes, never from current shiny | **Pure model version check only** |
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

1. Obtain a reproducibly downloadable **real normal Fakémon fixture with authoritative native ID/type pair**, including the user's URL if accessible, and save exact bytes/SHA. Verify Canvas CORS again on actual target browsers; no anonymous proxy art.
2. Decide the normal-source seam: approved optional read-only QOL export or exactly one native `get_fakemon` resolver in ART. Do not alter QOL's readiness semantics or require ART for the shiny button.
3. Implement full browser scanner from the **unchanged Python source**: RGBA parity, α>=128 mask, corner consensus, 4-connected fill, EDT, dark/white weighting, RGB bins, weighted Lab clustering/centroids, CIE76 and tie rules. Pass reference fixtures before integrating with cards.
4. Implement exact alpha>=1 geometry mask, reliability restrictions and `packed-msb-row-v1` decoder, with full-resolution collision and corner two-pass tests.
5. Implement namespaced IndexedDB v1 and atomic record/mask commits with failure retention, new session revalidation, generation guards and quota/blocked fallback. Benchmark real memory and elapsed time on iPad Safari.
6. Expose the exact `INTEGRATION_CONTRACT.md` v1 read-only API, diagnostics and once-per-complete-result event. No production UI manipulation in the producer.
7. Demonstrate QOL/Theme/Species Card independent operation and existing official Pokémon color choices unchanged, including all load orders, shiny and list-to-card transitions.
8. Only then propose optional consumer integration as separate approved work, with no migration of the official artwork-choice index until independently validated.

**ART-01 stops at artifacts and reference tests. ART-02 is not authorized by this document.**
