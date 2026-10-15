# ART-01-R01 — Artwork Intelligence validation foundation

**Stability:** Working specification and executable reference tests. **Not a production userscript.**

- **Branch:** `dev/hero-restoration-2026-10-14`
- **Verified baseline:** `f79be54ca2c67ce75f74faef0882329470f3cbe8` (GEO-01-R02)
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
| `fixtures/real/availability.json` | Known browser probe and explicitly blocked real-fixture analysis |

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

## Nonclaims and migration boundary

- No complete historical offline corpus or manifest was supplied, so no all-species coverage numbers are asserted.
- The 722×722 Fakémon PNG was previously canvas-readable in the user's Safari probe, **not** fetched and analyzed in this ART-01 environment. Species identity, types, source SHA and metrics remain unverified.
- Python numeric fixture output **is not** full JavaScript/browser scanner parity. JS tests cover only final Lab/CIE76 decision math.
- Original Pokémon type-color choices and the official artwork index remain untouched.
- The fourth module, IndexedDB implementation, normal-artwork ingestion, event publication and UI integration belong to ART-02 or later approvals.
