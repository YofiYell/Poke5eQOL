# ART-01-R02 — Artwork Intelligence validation foundation

**Stability:** Working specification and executable reference tests, now with one real user-supplied Fakémon PNG. **Not a production userscript.**

- **Branch:** `dev/hero-restoration-2026-10-14`
- **Baseline for R02 corrections:** `0bf9f2b12fd511d5705ac935af89996621cc016a` (ART-01-R01); GEO-01-R02 remains the unchanged userscript baseline `f79be54ca2c67ce75f74faef0882329470f3cbe8`
- **Native Poké5e inspection:** `Auroratide/poke5e` main at `881f3caeb899dd36a0325feef3f4e7004b0035af` (2026-10-13)
- **Scanner SHA-256:** `f6ac6e346e2e93b2c05110ebe286c8e37d2120b9d035d9ce1766e536d133f1cd`

This folder contains **the unchanged original Python scanner**, actual synthetic PNGs and their computed Python results, lossless-geometry reference code, test-only JavaScript color math, a cache contract model, and the proposed ART-02 contracts. Nothing scans Pokémon or Fakémon in the browser and none of the three installed userscripts are modified.

## Files

| Path | Role |
|---|---|
| `ARCHITECTURE.md` | Current owners, sources, lifecycle, module boundaries and failure isolation |
| `REFERENCE_ALGORITHM.md` | Executable Python v1.0.0 algorithm without heuristic substitutions |
| `GEOMETRY_SPEC.md` | Full-resolution mask, transforms, collision and mandatory corner passes |
| `RECORD_SCHEMA.md` | Namespaced IndexedDB record/mask stores and atomic validation rules |
| `INTEGRATION_CONTRACT.md` | Exact proposed v1 API, events, consumer behavior and route protection |
| `DIAGNOSTICS.md` | Console API, exact field names and explicitly illustrative examples |
| `TEST_PLAN.md` | Executed test evidence, parity criteria, blocked runtime tests and ART-02 gates |
| `reference/Poke5e_Offline_Color_Scanner_v1.0.0.py` | **Byte-identical provided scanner; do not edit** |
| `reference/geometry_reference.py` | New non-production pixel-exact geometry reference |
| `reference/color_math_reference.mjs` | New test-only JS Lab/CIE76/decision math (NOT full scanner) |
| `reference/contract_model.mjs` | New pure cache/preference/route contract model (NOT IndexedDB) |
| `tests/` | Python `unittest` and Node `--test`, deterministic fixture generator |
| `fixtures/synthetic/` | 16 labeled synthetic images, not native Poké5e artwork |
| `fixtures/expected/python_reference_results.json` | Actual output from original Python scanner |
| `fixtures/real/availability.json` | Current local source availability plus historical R01 access blocker |
| `fixtures/real/manifest.json` | Real PNG, native user-observed identity, hash/provenance/verification status |
| `fixtures/real/BWMC6BSH0WZDR_normal.png` | Source-byte-verified user-uploaded original normal portrait (458,051 B) |
| `fixtures/real/BWMC6BSH0WZDR_python_reference.json` | Frozen unmodified-Python scanner colors/decision and geometry metadata |
| `fixtures/real/BWMC6BSH0WZDR_mask_packed_msb_row_v1.bin` | Verified exact 65,702-byte alpha-occupancy mask |
| `tests/test_real_fixture.py`, `tests/test_reliability.py` | Real reference and pathological alpha regression tests |

## Reproduce tests

Requires Python 3, `numpy`, `Pillow`, `scipy` and Node.js 22+. No web/network required.

```bash
cd artwork-intelligence
sha256sum reference/Poke5e_Offline_Color_Scanner_v1.0.0.py
python -m py_compile reference/Poke5e_Offline_Color_Scanner_v1.0.0.py
python -m unittest discover -s tests -p 'test_*.py' -v
node --test tests/test_*.mjs
```

Do **not** rerun fixture generation as part of ordinary tests: generator output depends on Pillow encoding versions. Fixture *bytes* and SHA256 values are committed. To regenerate intentionally, run `python tests/generate_fixtures.py` followed by `python tests/make_expected.py`, review the entire diff and revalidate the hashes.

## Verification counts for R02

The expanded reference foundation passes **29 Python tests and 24 Node tests** (original R01 cases retained). This includes 3 supplied real-image tests, separate geometry-confidence pathologies, native normal-source selection, passive diagnostics, explicit IDB hydration versus consumer reuse and source-state progress with null prehash. Test results are recorded in `TEST_PLAN.md`; this is not a Safari execution record.

## Nonclaims and migration boundary

- No complete historical offline corpus or manifest was supplied, so no all-species coverage numbers are asserted.
- The 722×722 real Fakémon PNG **is now provided locally by the user**. Its bytes, SHA, unmodified Python scan, exact source alpha mask and geometry hashes were verified. The named species ID/type pair remain user-observed and not independently fetched from the native RPC. The environment cannot query that live record or test Safari persistence.
- Python numeric fixture output **is not** full JavaScript/browser scanner parity. JS tests cover only final Lab/CIE76 decision math for synthetic and real Python metrics.
- Original Pokémon type-color choices and the official artwork index remain untouched.
- The fourth module, IndexedDB implementation, normal-artwork ingestion, event publication and UI integration belong to ART-02 or later approvals.

## R02 correction summary and reproducibility

- One actual Rock/Steel normal artwork fixture, immutable Python result JSON and packed exact mask; the original 16 synthetic PNGs, their frozen metrics and original scanner remain unchanged.
- Alpha reliability no longer treats one clear pixel as a reliable silhouette. The full alpha >=1 occupancy evidence stays exact; only meaningful 4-connected border-transparent regions can authorize collision use. `visualBoundsAlpha128` is diagnostic and **not** used to change mandatory corner passes.
- The pure cache model separates passive inspection, actual consumer reuse, IDB hydration, source revalidation, full scan completion and changed-publication counters. A candidate source can be resolved with `contentSha256=null` before byte verification.
- ART-owned `get_fakemon` read-only lookup is the selected normal source path; a bounded last-good decision-only localStorage snapshot is the nonblocking startup fast path. Both are **specifications** until ART-02.

From the `artwork-intelligence/` directory, run `python -m unittest discover -s tests -p 'test_*.py' -v` and `node --test tests/test_*.mjs`. Never run `tests/make_expected.py` to cure a failing real fixture test: the supplied JSON and PNG are frozen provenance and the scanner must remain byte-identical. Check `fixtures/real/manifest.json` for the exact archive/image/mask SHA-256 values.
