# ART-01-R02 — Exact silhouette, confidence, transforms and corner specification

## Independence of geometry and color

The unchanged Python scanner's color mask uses `alpha >=128` and (when its global corner-consensus rule holds) removes border-connected background. **Do not reuse that mask as the silhouette.** Geometry uses source-image alpha independently: in ART-01 reference, `alpha >= 1` includes every pixel with nonzero 8-bit alpha (even antialiasing, wisps, single-pixel extensions and disconnected islands). This is a deliberate provisional threshold for exact *visible-byte* occupancy; ART-02 may expose secondary thresholds as metadata but must not silently discard alpha 1 subject pixels.

**Raw occupancy and subject reliability are independent.** Always measure the exact alpha >=1 occupied pixels and retain a lossless observed occupancy mask in the reference model. A mask is safe for visual subject collision only if alpha supplies meaningful exterior background evidence. An image with alpha >=1 everywhere is `unavailable_opaque` even if its alpha values are partly below 255. An all-clear image is `unavailable_empty`; a mostly opaque image with isolated transparent specks, interior holes only or a thin transparent border is `unavailable_alpha_ambiguous`. These unreliable sources still retain observed occupancy statistics, but must never expose that mask as a reliable subject silhouette. No invented polygon segmentation for opaque art.

## Coordinates and packed-mask v1

- Native RGBA: `width=W`, `height=H` in decoded, orientation-corrected source pixels. Origin at upper left; integer pixel `(x,y)` occupies half-open unit square `[x,x+1) × [y,y+1)`. x grows right, y down.
- **Exact occupied-pixel bounding rectangle:** `{left,top,right,bottom}` with right and bottom exclusive, calculated from all alpha >=1 pixels, including faint pixels, horns and detached regions. Source offset is `(left,top)` and content size `(right-left,bottom-top)`. Empty has no bbox. In R02 the reference's `observedOccupancy.bounds` remains available even for ambiguous alpha; its `geometry.bounds` is usable for UI collision only when `geometry.reliable=true`.
- Geometry mask stores **the full canvas** (not cropped to bbox), 1 bit/pixel, row-major, rows padded individually to `strideBytes=ceil(W/8)`, bit 7 first for x=0. Byte at `(y*stride + (x>>3))` bit `(7-(x&7))`. Every padding bit after W in each row must be zero. This is `packed-msb-row-v1`.
- Decoding must validate `maskByteLength===ceil(W/8)*H`, mask SHA-256 (when present), last-byte padding and metadata occupancy sum. Packed mask remains lossless; no coarse occupancy grids, contour simplification or downsampling.
- Report connected-component count with **8-connected** occupied pixels, and interior hole count with **4-connected** transparent pixels whose components do not touch the image border. The complement dual-connectivity avoids diagonal-connectivity ambiguity.
- Normal/main source only. A displayed female, shiny or hue-rotated image with different source bytes invalidates collision mapping to the analyzed normal silhouette; the display falls back gracefully without altering the stored record.

**Calculated, uncompressed 722×722 sizes:** original RGBA `722×722×4 = 2,085,136 B`; mask `ceil(722/8)×722=65,702 B` (64.16 KiB), excluding record/index/Blob overhead. On the 64×64 test PNGs, each packed mask is exactly `512 B`. These are calculated storage sizes, not Safari quota measurements.

## Mapping pixels to the rendered card

For untransformed `object-fit:contain`, image content box `{left=L,top=T,width=CW,height=CH}` in CSS pixels, natural decoded canvas `(W,H)`:

```
s = min(CW/W, CH/H)
visibleW = W*s, visibleH = H*s
offsetX = L + (CW-visibleW)*objectPositionFractionX
offsetY = T + (CH-visibleH)*objectPositionFractionY
clientX = offsetX + x*s
clientY = offsetY + y*s
```

Native `Art.svelte` uses `object-fit: contain`; QOL/Species Card may override `object-position`, image width/height and attribution `smaller` rules. **Read their final computed style**, actual content box, DOM `getBoundingClientRect`, `img-zoom` behavior and CSS matrix. Do not assume centered content (`50% 50%`): `center top` / `right top` affect offsets. CSS transforms from ancestor, scroll position, visual viewport zoom and any image `transform` must be composed into a source→client affine `DOMMatrix` `M=[a,b,c,d,e,f]`; reject noninvertible/perspective transforms unless a separately tested mapping exists.

For UI rectangle `R` in viewport CSS coordinates, invert M to find candidate source-pixel *cells*; test actual transformed unit squares, not only pixel centers or the subject bbox, against `R`. For rotated/skewed transforms, transform all four corners of each candidate cell, clip polygon against R and treat any positive-area overlap as occupied collision. Include button border/padding/shadow in a conservative actual icon footprint and apply separately specified clearance in CSS pixels, transformed consistently. Crop to visible image clipping intersection for screen collisions, but never crop the saved mask. The test-only Python reference implements exact polygon clipping for affine transforms; ART-02 must optimize indexed mask queries without changing results.

### Collision with other UI

`rectIntersectsSubject(uiRect, transform, exactMask)` checks positive-area transformed pixel-cell intersection against actual UI footprint, with optional clearance dilation. Bounding boxes alone only provide coarse candidate rejection; any final collision decision must query the exact mask. If the image's actual CSS transform/source differs from the record, mark geometry unusable and use current Species Card fit / QOL corner fallback (no speculative repositioning).

## Mandatory automatic-corner two-pass algorithm

Inputs: the **original** alpha-subject bbox B, unmodified exact mask, current actual rendered icon width and height, its clearance and any other rendered UI obstacles. Convert icon width/height/clearance to source-space using the final source→client transform. No full image rescan on viewport resize.

1. Determine all four corner *icon rectangles INSIDE ORIGINAL B* only; order for deterministic ties is `tr`, `tl`, `br`, `bl` to preserve the existing top-right default. Each corner rectangle uses the real rendered icon footprint (width AND height), placed flush to the appropriate bounds; margins/clearance are tested against silhouettes/UI, not as a hidden relocation.
2. Check that each rectangle fits in B. Test its footprint plus clearance against the full-resolution occupied-pixel mask and real UI obstacles, not just the bbox. If one or more corners pass, select the first in tie order (or deterministic more-clearance scoring, if its exact ranking is versioned and tested). **Stop; no expansion.**
3. Only if **all four** fail, construct B' = `[left-w,top-w,right+w,bottom+w]` in source coordinates. Here `w` is **exactly one current rendered icon width**, converted to source coordinates. Expand left, right, top and bottom by precisely the same `w`, not by icon height or a species-specific fraction. This box may extend beyond the original canvas and is conceptual; never crop, resample, shift or rescan the artwork.
4. Recheck all four new corner rectangles using the same icon dimensions, clearance and exact mask, select deterministic best allowed corner. If still all blocked by other UI, return `unavailable` and retain QoL's current top-right behavior; do not force an overlapping automatic position.
5. Return `{corner:'tr'|'tl'|'br'|'bl'|null,pass:'original'|'expanded'|'unavailable',originalBounds,effectiveBounds,iconRect,expansionPerSide,maskSha256,renderContextToken}`. `expansionPerSide` is `0` or `w`. This is *viewport-dependent* output, **not stored as one permanent species-wide corner**.
6. QOL precedence: `explicitlySavedManualCorner > validAutomaticCorner > existing top-right default`. Saving manual top-right is still manual; current `savedPortraitCorner()` conflates missing and saved `tr`, so future optional QOL integration must expose/preserve a separate manual-presence check. Never remove any four-corner manual interaction.

### Non-axis-aligned transform caution

For a rotated/sheared image, CSS-axis-aligned button size cannot be naively divided by an arbitrary `scaleX`. Recompute the full inverse-transformed footprint polygon. Define `w` as the image-local horizontal extent of the actual inverse-transformed icon box and expand B equally by that single amount. If that cannot be computed reliably (perspective/object changes), return `unavailable`, not an approximate recommendation. This geometry must remain independent of type-color analysis.

### Executed reference tests

`reference/geometry_reference.py` and `tests/test_geometry.py` validate pixel-exact packed masks, 8-connected components and holes, 1px extensions, axis-aligned and rotated affine overlap, top-right first-pass selection, four-corner failure and exact symmetric expansion. This reference is not an automatic corner handler in the live browser.

## ART-01-R02 — Deterministic alpha reliability classifier

The test-only `inspect_rgba()` first creates **unmodified alpha >=1 occupancy**. Independently, it labels zero-alpha background regions with **4-connectivity** and inspects only transparent components connected to a canvas border. Its largest exterior region qualifies as a reliable alpha background only when BOTH hold:

1. It touches **at least three distinct canvas sides** (`top`, `right`, `bottom`, `left`); a lone corner dot or a large wedge at just one corner is insufficient.
2. Its area strictly **exceeds the number of pixels in a one-pixel outer perimeter** (`2(W+H)-4` for W,H >=2). This is a dimension-derived one-pixel-strip baseline, **not an arbitrary universal percentage of pixels**. A one-pixel transparent border does not suffice.

If there are no occupied pixels, report `unavailable_empty`; if no zero-alpha pixels, `unavailable_opaque`. If zero-alpha exists but fails the connected exterior evidence, report `unavailable_alpha_ambiguous` and `reliable=false`. Otherwise report `ready`. These are conservative **alpha-evidence classifications**, not proof of object recognition: tightly cropped or unusually shaped artwork can be downgraded even when human inspection sees a legitimate transparent background. ART-02 must validate the rule on a varied real-image corpus and may propose a separately approved revised confidence algorithm. No automatic opaque-background segmentation is implied.

Reference fields `backgroundEvidence.{exteriorPixels,exteriorBorderSides,transparentEdgePixelCounts,borderConnectedComponentCount,onePixelPerimeterPixels,reliabilityReason,supportsReliableSubjectMask}`, `alphaZeroPixels`, and `alphaPartialPixels` document the reason. `observedOccupancy` and `observedPackedMask` retain the source-exact alpha >=1 evidence **even when unreliable**, but only `status='ready'` exposes `packedMask` as a collision-eligible silhouette. Production storage may omit the unreliable binary blob to save quota, while still persisting its counts/hash and failure reason. It must never treat unreliable observed occupancy as a credible subject silhouette.

### Exact bounds versus diagnostic visual bounds

R02 additionally measures `visualBoundsAlpha128`, the bounding rectangle of alpha >=128 pixels. It is **informational only** and is not the original bounds for the mandatory corner algorithm, nor an authorization to crop or discard faint alpha. When geometry is ready, **all four first-pass corners use the exact alpha >=1 `bounds`**, including remote faint pixels, and expansion still occurs only if every original corner fails, by exactly one rendered icon width on each side. A later separate approval would be required to use a perceptual composition box instead.

### Measured first real normal-artwork fixture

The user-supplied original 722×722 PNG `fixtures/real/BWMC6BSH0WZDR_normal.png` (SHA-256 `0749aa41cc2250c67884ad4a33082566f379756530ce1724798a6c035d470bc6`) yields **306,042 alpha >=1 occupied pixels**, **215,242 alpha-zero pixels**, two 8-connected occupied components and one 4-connected interior hole. The 4-connected **exterior** alpha-zero component occupies 214,900 pixels and touches all four canvas edges (far exceeding the 2,884-pixel perimeter baseline); classification is `ready`. Exact bounds are `(3,0,722,690)`, while diagnostic alpha >=128 bounds are `(8,0,718,685)`. The original 65,702-byte packed mask SHA-256 is `3a2a9bc555888d03caa2044f23ae9685c44dff349ae300bca22c62e5ff244ee1`. The source PNG was **uploaded by the user**, not retrieved by this container from the image host. These geometry measurements were rerun against that supplied file, not estimated.
