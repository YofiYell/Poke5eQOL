# ART-01-R01 — Exact silhouette, rendered transforms and shiny-corner specification

## Independence of geometry and color

The unchanged Python scanner's color mask uses `alpha >=128` and (when its global corner-consensus rule holds) removes border-connected background. **Do not reuse that mask as the silhouette.** Geometry uses source-image alpha independently: in ART-01 reference, `alpha >= 1` includes every pixel with nonzero 8-bit alpha (even antialiasing, wisps, single-pixel extensions and disconnected islands). This is a deliberate provisional threshold for exact *visible-byte* occupancy; ART-02 may expose secondary thresholds as metadata but must not silently discard alpha 1 subject pixels.

If **no source pixel is fully transparent (all alpha >=1)**, the alpha channel cannot separate subject from background—even if some alpha values are <255. In that case, return `geometry.state='unavailable_opaque'`, `reliable=false`, with no silhouette. If source is transparent but has zero occupied pixels, return `unavailable_empty`. Partial alpha everywhere >=128 is not a reliable segmentation signal; ART-02 should classify visual opacity explicitly and flag reliability uncertainty rather than assuming foreground extraction. No invented polygon segmentation for opaque art.

## Coordinates and packed-mask v1

- Native RGBA: `width=W`, `height=H` in decoded, orientation-corrected source pixels. Origin at upper left; integer pixel `(x,y)` occupies half-open unit square `[x,x+1) × [y,y+1)`. x grows right, y down.
- Bounding rectangle: `{left,top,right,bottom}` with **right and bottom exclusive**, calculated over all occupied pixels; retained even for one-pixel ears and disconnected components. Source offset is `(left,top)` and content size `(right-left,bottom-top)`. Empty has no bbox.
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
