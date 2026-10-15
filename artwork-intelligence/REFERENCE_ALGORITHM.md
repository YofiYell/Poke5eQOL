# ART-01-R01 — Exact Python color reference and JS parity requirements

**Only authoritative numerical implementation:** `reference/Poke5e_Offline_Color_Scanner_v1.0.0.py` (SHA-256 `f6ac6e346e2e93b2c05110ebe286c8e37d2120b9d035d9ce1766e536d133f1cd`). Byte-for-byte preserved, 12,699 bytes, verified by test. **Do not replace or simplify** the reference algorithm.

## Input / format / source

- Pillow opens the original bytes; supports exactly image formats `PNG`, `JPEG`, `WEBP`, `GIF`, `TIFF`; anything else raises `unsupported_image_format:<format>`. `im.convert('RGBA')` converts image mode; `np.array` yields uint8 channels. For animation, the original code analyzes the Pillow-decoded current/first frame, not a custom average across frames. Browser ART-02 must explicitly verify decoding/frame semantics against Pillow.
- `im.size = (width,height)` remains original source dimensions. `alpha = A / 255` (float64), `rgbfull=RGB.astype(float)` (float64). Use original **normal/main** portrait bytes even if shiny is displayed. Never use a hue-rotated fallback, sprite, thumbnail or Svelte-rendered scale.
- `mask = A >= 128` exactly. This is the **color-analysis mask**, independent of ART's pixel-exact geometry mask (alpha >=1). If retained pixels `<50`, raise `too_few_visible_pixels`.
- For the full manifest tool, `ensure_artworks()` validates optional native Git blob SHA-1, deduplicates by blob hash, downloads `source_artwork_url` with 3 tries, caches metrics by `SHA256(source bytes + JSON(cfg,sort_keys=True))`, and records download/analysis failures. This code belongs to the offline tool, not necessarily to the browser's IndexedDB design. No frozen complete manifest was supplied.

## Opaque / corner consensus behavior (exact)

Applied **only if ALL pixel alpha values are >=128** (not strictly requiring every alpha ==255):

1. Four RGB corners in this order: top-left, top-right, bottom-left, bottom-right.
2. `bg = np.median(corners,axis=0)` componentwise.
3. Proceed only if `max(Euclidean_RGB_distance(corner,bg)) < 8` (strict).
4. `candidate = Euclidean_RGB_distance(pixel,bg) < 10` (strict).
5. Seed candidate pixels on **all four border edges**. `scipy.ndimage.binary_propagation(seed, mask=candidate)` (SciPy default connectivity) finds border-connected candidate background. `background_pixels_removed = int(removed.sum())`.
6. `mask &= ~removed`; interior regions of the same color NOT connected to the border remain. On an entirely uniform opaque canvas this can remove every pixel and yield `too_few_visible_pixels`.

**This operation does not create an exact silhouette for opaque artwork.** Background removal can be sufficient for color metrics and still unreliable for geometry.

## Full-resolution per-pixel color statistics

For source pixels selected by final color mask:

1. `dist = distance_transform_edt(np.pad(mask,1))[1:-1,1:-1][mask]`. The padded zero border is intentional. The Euclidean EDT is not Manhattan distance.
2. `c = rgbfull[mask]`; `al = alpha[mask]`; `labs = lab(c)`; chroma `ch = sqrt(a*²+b*²)` from Lab.
3. `dark = (L < 20) & (ch < 18)`; `white=(L > 94) & (ch < 10)` (all strict).
4. `w = al.copy()`; where `dist <= 2`, multiply `w *= 0.5` (`edge_weight`).
5. `outline = dark & ((dist <= 3) | (np.average(dark, weights=al) < .18))`; multiply selected `w *= 0.25` (`outline_weight`). This can multiply **after** the edge discount, i.e. resulting weight `alpha * 0.5 * 0.25`. When overall dark fraction is below `.18`, *all* dark pixels are discounted; if dark is a large interior surface, only edge-near dark pixels are discounted.
6. If `np.average(white,weights=al) < .12`, multiply `w[white] *= 0.7` (`incidental_white_weight`); else do not discount white.
7. `raw = np.average(c,axis=0,weights=al)` and `avg = np.average(c,axis=0,weights=w)` — both alpha-aware; no downsampling. `raw_alpha_average_color` and `average_color` are rounded `#RRGGBB` per `hexcolor()`.
8. Record `visible_pixels`, `background_pixels_removed`, `outline_pixels_discounted`, `near_black_body_fraction`, `near_white_body_fraction`, original image dimensions/format.

## Weighted Lab clustering (exact order is significant)

1. RGB bins: `bins=(c.astype(int)//16)`; `code = red_bin*256 + green_bin*16 + blue_bin` (16 bins per channel, up to 4096). `np.unique(code,return_inverse=True)` yields ascending bin codes. Important for stable ties.
2. `mass = np.bincount(inv,weights=w)`; for each channel `means_j=np.bincount(inv,weights=w*c[:,j])/mass`. These are weighted **RGB** centroids of each bin; convert them to `points=lab(means)`.
3. `k=min(8,len(points))`. Initialize first Lab center from index `np.argmax(mass)` (first in order on exact ties). For each remaining center, compute squared Lab distance to nearest existing center; choose `np.argmax(d * sqrt(mass))` (first on ties).
4. Iterate **at most 35** times. Assign labels by `np.argmin` of squared Lab distance (first center wins ties). For each nonempty cluster set new Lab center to mass-weighted average of its assigned `points`; empty center retains old location. If `max(abs(new_centers-old_centers)) < .02`, exit after storing new centers. **Do not rerun label assignment at this point:** Python's final grouping uses `labels` computed before that iteration's center update.
5. For each final nonempty cluster in center order, compute `hexcolor(weighted_mean_RGB_bin_centroids)`; coverage = `round(float(cluster_mass/total_mass),6)` using Python `round` behavior. Sort clusters by coverage descending, **stable on exact ties**; first entry is `dominant_color` with `dominant_coverage`. Keep all listed clusters (up to eight).
6. This is not k-means over every pixel. Bin aggregation, initialization, convergence, RGB color reconstruction, and tie order must match precisely.

## sRGB / Lab conversion and numerical precision

- Input `RGB/255` as float64.
- If channel `> 0.04045`, linearize `((v+0.055)/1.055)**2.4`, otherwise `v/12.92`.
- Matrix multiplication with rows for R,G,B: `[[.4124564,.2126729,.0193339],[.3575761,.7151522,.1191920],[.1804375,.0721750,.9503041]]`; divide XYZ by `[.95047,1,1.08883]`.
- If normalized XYZ `>216/24389`, `f=cbrt(x)`, else `f=(24389/27*x+16)/116`.
- Lab = `[116*f(Y)-16, 500*(f(X)-f(Y)), 200*(f(Y)-f(Z))]`.
- `hexcolor` uses `np.rint` **ties-to-even**, then clamps to `[0,255]`, then `int` and uppercase two-digit hex. JS `Math.round` does **not** match at half values without explicit handling.
- RGB and Lab accumulation uses Python NumPy/SciPy float64; clustering uses stable ordered arrays and no stochastic initialization. JS/browser must preserve ordering and tie behavior despite floating-point and decoder differences.

## Type selection and established presentation fields

Exact palette: `TYPE_COLORS` constant in the untouched Python file (18 Scarlet/Violet `#RRGGBB` values); a test-only duplicate lives in `reference/color_math_reference.mjs`. Python is authoritative if they differ.

Types are ordered `[primary_type, secondary_type]` with optional secondary. For type index `i`:

```
A_i = sqrt((Lab(type_i) - Lab(average_color))^2 summed over L,a,b)
D_i = sqrt((Lab(type_i) - Lab(dominant_color))^2 summed over L,a,b)
S_i = (0.5*A_i + 0.5*D_i)/(0.5 + 0.5)
```

- `selected_banner_type = types[np.argmin(S)]` (**primary wins exact combined tie**); for dual types `selected_tint_type = types[1-winner]`. Monotype tint is `''`. Independently `average_match=types[argmin(A)]`, `dominant_match=types[argmin(D)]`, `metrics_disagree = argmin(A)!=argmin(D)`.
- Preserve `primary_type_color`, `secondary_type_color`, each `delta_e_*` and `combined_score_*` to **six Python decimal places**, and `confidence_margin=round(abs(S0-S1),6)` for dual types, `None` for mono.
- Preserve `tint_strength=.36`, `banner_type_strength=.85`, `banner_black_strength=.15`, `top_header_types=types`, `description_type=primary` in the stored scanner decision. These do **not** supersede the existing Theme Overlay `ARTWORK_TINT_ALPHA_BY_TYPE` interface styling without explicit approval.

## Parity definition and risks

| Comparison | ART-02 threshold |
|---|---|
| Source bytes and content SHA-256 | Exact equality |
| Dimensions, mask count and background-connected removal count | Exact integer equality |
| Color HEX outputs and cluster order | Exact strings/order |
| `coverage`, near-black/white fractions, CIE76 scores | `abs(JS-Python) <= 0.000001` after Python-compatible six-place rounding |
| Selected banner/tint and all categorical flags | Exact equality |
| Near ties | Preserve original tie order; no epsilon winner flip accepted |
| Geometry bitmask and occupied pixel count | Exact bytes/count for same RGBA decoded input |

**Executed:** Python scanner analyses of 16 synthetic PNGs, plus JS Lab/CIE76/final-decision parity for 13 successful outputs (read-only math). **NOT executed:** browser image pipeline, alpha masking, EDT, clustering, end-to-end scanner parity. A byte-identical image can still decode to different RGBA values across browsers because of color profiles, premultiplied alpha, GIF/APNG frame choices, EXIF orientation or browser color management. ART-02 must record raw source SHA256 **and** a canonical decoded RGBA checksum, compare decoded pixels against Pillow and reject parity claims on mismatch. Use unpremultiplied 8-bit RGBA as the canonical analysis input; if Canvas differs, investigate rather than silently accepting a color deviation.
