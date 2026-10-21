Poké5e — Development Workboard

Purpose: Track approved, planned and exploratory development work. This is not a complete app specification.

Status vocabulary: Discussing · Planned · Ready · In Progress · Implemented · Testing · Accepted

These are working development candidates. Presence in GitHub does not establish browser acceptance.


Selector reconstruction checkpoint — 2026-10-20

Status: **Planned** for selector replacement; current v0.2.22 is a **Working / experimental checkpoint**, not a browser-accepted layout release. The existing script is retained intact for comparison and testing. Do not reinterpret these planned requirements as implemented features.

* **Development-branch versions:** QoL v0.13.6 (shiny/sparkle button internal-padding adjustment); Species Card v0.2.22 (current combined subject-area artwork guide and contour-coverage data); Theme Overlay remains v0.3.50. Keep repository filenames `Poke5e QOL.js`, `Poke5e Species Card Adapter.js`, and `Poke5e Theme Overlay.js` stable; update their internal title/version fields as appropriate. Modify GitHub only on explicit user instruction. Approved `main` remains separate.
* **Selector replacement rather than more patches:** Retire the present expensive generate/rank/verify selector once replacement behavior is demonstrated. Preserve native DOM ownership, shared component rendering, bottom-edge alignment constraints, independently runnable scripts, and the useful compositions of v0.1.28.5. No new developer-reporting UI, debug machinery, timers, compensating observers, or discarded-code accumulation.
* **Construction order:** (1) establish artwork's preferred and allowable pixel dimensions using actual normal-artwork geometry and **panel width**; (2) construct the description/artwork region, including viable narrow wrapping with description continuing below the artwork; (3) promote eligible Ability Scores, Vitals and Abilities based on fit; (4) place Gender and Egg Group last, respecting shared height, size caps and established ordering; (5) perform a small physical measurement/reconciliation pass and commit once. The layout must not determine artwork size by selecting a convenient shrunken candidate.
* **Artwork reference contract:** At approximately 424px panel width, use the v0.2.22 combined geometric-mean contour/bounding-box area target **9.5–10.5% (10% center)**, subject to the **18.5% bounding-box area cap** and a **60% compact panel-width subject-width cap**. These are calibration references, not guarantees that every species and width can physically meet all bounds. Where impossible, use the closest physically feasible size and report the conflict in offline tests, not production overlays.
* **Image behavior next:** Convert sizing from live **panel area/height** to a width-based reference calculation so vertical resizing at unchanged card width does **not** resize the Pokémon. Above 424px, allow only subtle, bounded growth; do not settle the proposed wide-screen growth percentage before testing the reconstructed composition system. Preserve sensible caps and prevent oversized wide-screen portraits. Normal operation must not show the temporary red subject-bounding-box outline. Contour-aware text wrapping remains for useful sub-550px compact compositions; it must not generate overlap, clipping or icon regressions.
* **Known selector failure:** In the native-data Chromium fixture, Gardevoir at panel widths 359/374/424px had approximately **105/183/194px subject heights** at fixed 850px viewport height. At 359px the chosen wrapping/biology arrangement reduced combined subject area to approximately **2.3%**, substantially below the target. This is a current v0.2.22 candidate-selection limitation; the width-only model and replacement selector have **not** fixed it. Avoid special-casing Gardevoir or repairing an obsolete fallback before replacement.
* **Promotion and geometry:** Below 550px, eligible promotion is Ability Scores **or** Vitals (at most one); Ability Scores otherwise remain naturally below the hero until promoted. From 550–799px Scores, Vitals and Abilities are eligible if they fit; at 800–1099px favor useful Abilities promotion; at 1100px+ ordinarily promote all three, relaxing Scores first when necessary. These are eligibility/preferences, **not fixed layout templates**. Balance content intrinsic widths, visible subject prominence, minimal internal empty regions, physically aligned column bottoms, and meaningful information. Do not gate candidate selection by visible Move/TM item or row counts. Use measured total scroll height as an important comparative metric, never an automatic exclusion threshold.
* **Biology:** Gender/Egg widths must be justified by content. A modest leftover horizontal gap may be distributed via space-between; large vacant bar regions are invalid compositions, not permission to stretch tiny components. Shared bar height, readable text, pairing/ordering and established maximum useful size must survive.
* **Test plan:** Preserve the 27 real Pokémon classified by artwork ratio × description length × Abilities length, plus extreme regression species. Start with Gardevoir at 359/374/424px, Grotle at 424px, Crobat at 424px, and repeated equal-width/different-height resizes. Then test the 27 across representative panel widths (359, 424, 540, 800, 1100px), navigation, themes, scroll height, real font wrapping, subject bounds and physical bottom alignment. Compare to positive v0.1.28.5 layouts. Inspect actual Chromium renders rather than using image-difference scores as a proxy for quality. Report violations in chat; don't add unapproved runtime diagnostic controls.
* **Separate typography investigation:** Move, Egg Move and TM sizes can diverge. Theme Overlay v0.3.50 uses relative sizing for ordinary move links but a cached pixel-sized `--p5ov-tm-font-size` pseudo-label for TMs. Inspect computed values across resize/navigation and themes before making a separate localized correction. Do not conflate with the hero selector.
* **Remaining verification:** The native-data Chromium fixture showed the Gardevoir behavior; full Safari/iPad regression, all-species fixture coverage, width-invariance, wide-panel scale tuning and new selector behavior remain unverified and pending. These are planned follow-up work, not completed implementation.


Current baseline and next development sweep — 2026-10-17

* **Approved `main` baseline:** QoL v0.13.4; Species Card Adapter v0.1.27 (hero description measurement correction); Theme Overlay v0.3.50 with the approved original-Pokémon color assignments. A source commit, installation, and browser acceptance remain distinct facts.
* **Active development branch:** `dev/artwork-geometry-2026-10-17`, originally branched from synchronized `main`; `dev/hero-restoration-2026-10-14` is a preserved experimental/history archive. Do not merge archived Artwork Intelligence code wholesale.
* **Current design direction:** One content-driven layout grammar for compact/mobile and wide cards; artwork subject bounds available to every layout; final detail/icon components measured before final hero optimization; no mandatory promotion ladder.
* **New invariant:** At a fixed usable panel height, species data, font scale and other rendering conditions, increasing panel width must not *reduce meaningful information visible without scrolling*. Compare actual visible semantic content, not merely section count or image size. Better artwork prominence may not replace content with empty space; account for unavoidable rendering and source changes separately.
* **Hero height:** approximately 25–40% of **usable panel height** is an exploratory preferred range, not a fixed height and not a mandatory clipping bound. Long descriptions and data may require more; short descriptions must not be padded to a minimum. Artwork has its own independent min/preferred/max size. Prefer aligned populated-column bottoms and reasonable negative space over an oversized portrait.
* **Biology:** Gender and Egg bars must share a measured outer **height** across selected arrangements. Equal widths remain the **initial/default** treatment, not a perpetual constraint: later layout candidates may give the Gender bar less horizontal space when its real contents fit and that space supports another useful cell (for example a square movement-speed tile). Never sacrifice readability, clipped content or boundary safety.
* **Near-term delivery order:** (1) unify compact/wide layout calculation and subject-bound sizing, protecting current accepted behavior; (2) restore and implement STATS-01 with reusable vital icon/value cells; (3) finish movement, senses and effectiveness treatments; (4) tune global image-size/negative-space/bottom-edge decisions against final component dimensions; (5) add exact contour-aware clearances/overlap after basic composition is stable. Continue offline original-artwork geometry and Fakémon save-time analysis as separate source pipelines.
* **Verification:** Safari user A/B screenshots show that experimental subject bounding rectangles change promoted artwork placement and expose layout quality issues; the test does not affect native compact/mobile rendering and is **not** deployed to production. Nosepass/Croconaw oscillation correction in v0.1.27 still requires device regression.


⸻

ART — Artwork Intelligence

Current agreed scope (supersedes the earlier ART-02-R01 runtime color-selection plan)

* Analyze **normal/main portrait** artwork for both original Pokémon and Fakémon subject geometry, including monotypes; never scan shiny artwork. Original-Pokémon geometry is precomputed offline from the authoritative Poké5e artwork catalog. Fakémon artwork is analyzed when a new normal portrait is selected/replaced in the native editor (as soon as its pixels are available), with authoritative cache publication only after successful save/upload.
* **Do not scan artwork to determine Fakémon theme colors.** A Fakémon creator selects its background type in the native create/edit workflow; persistence and exact editor integration still need implementation and verification.
* The 613 reviewed original dual-type Pokémon/form backgroundType assignments are accepted in Theme Overlay v0.3.50 on `main`. Original Pokémon require neither runtime color scanning nor routine runtime geometry scanning; verify artwork/form revision coverage of the offline geometry manifest.
* Separate species color assignment from type-palette mixing and from the actual presentation surfaces. Theme Overlay owns presentation; Artwork Intelligence owns normal-portrait geometry/acquisition/analysis metadata; QoL owns canonical type colors.
* The aim for geometry-dependent UI is correct **initial** presentation, not visible late corrections. ART-02-R01 remains a working geometry implementation candidate, not authority to retain obsolete color-processing, masks, or workers.
* Keep monotype presentation and the existing functionality of all three established scripts intact until a replacement is separately implemented and verified.

ART-COLOR — Offline color decisions and retirement of runtime scanning

Status: Requirements revised; runtime Fakémon color scanner retired from the target design. No production migration or editor integration yet.

Requirements

* Treat the full original-Pokémon offline analysis as a **one-time seed**, not a runtime dependency. The selected baseline is Hue/Saturation + Neutral Lightness, covering 613 dual-type original Pokémon/forms. Preserve its exact result set for review rather than rerunning or silently changing its choices.
* Manual review may override that seed for visual composition, contrast or form identity. Preserve the user's current local selections and exported corrections when migrating.
* The earlier `matchedType` and temporary review-script `visualType` describe the history of the data. **`backgroundType` is the proposed durable name** for the final meaning: which of a species' types supplies its card background; confirm/export-migrate that name before deploying permanent consumers.
* Default intended presentation: **backgroundType supplies the tint, the other type supplies the section banners**. Keep assignment and placement separately modeled; the temporary reviewer allows a global tint/banner inversion for comparison without mutating stored assignments.
* A Fakémon's background type is **creator-selected**, limited to its actual typing, via Fakémon create/edit. Determine and test native persistence, cross-device behavior, missing/changed types, and preservation of existing notes. Monotypes require no choice.
* Remove or disable color-only image analysis, per-pixel scoring, workers, caches, prefetch jobs, APIs and tests as part of a verified ART cleanup; do not retain them as unnecessary parallel systems. Keep reproducible historical datasets and comparisons when useful, without executing color scans in production.
* **No per-type-pair mixing or corrections**: Fire's presentation is identical whether paired with Flying, Dark, Dragon or anything else. A Pokémon-specific backgroundType selection is allowed; a pair-specific color formula is not.

Remaining: Fakémon editor backgroundType persistence; geometry-source validation/integration; retirement of obsolete *experimental* ART runtime color processing. Approved original-Pokémon assignments and per-type palette are already on `main` in Theme Overlay v0.3.50. Do not redo color assignment work.

ART-GEO — Subject geometry

Status: **Offline geometry baseline generated and bounding-box A/B tested**; complete contour fidelity and integration not yet accepted. Archived ART-02-R01 full-canvas mask candidate is obsolete.

Requirements

* Cover original-Pokémon normal portraits offline and all Fakémon normal portraits (including monotypes) via local/edit-time analysis; keep per-species/form identity and artwork revisions unambiguous. Verify archive coverage against the current live original-Pokémon catalog before claiming exhaustive current coverage.
* Determine whether transparent alpha provides a usable subject/background separation; expose a simple usable-transparency Boolean and appropriate diagnostics.
* Compute actual visible subject bounds rather than fitting the usually-square natural canvas. Validate which alpha threshold represents visible artwork without losing meaningful fine details.
* Trace and retain faithful **exterior** subject outline paths, including narrow extensions and detached pieces. Do not simplify away details needed to protect other card content.
* **Interior holes are not required** for overlap decisions or stored contour data; do not compute/persist them merely to satisfy the old ART-02 mask contract.
* Do not require a permanent full-canvas bitmask or pixel-by-pixel affine collision engine when exterior contours meet the production needs. A temporary pixel mask used during accurate outline extraction is acceptable.
* Map outline coordinates to the actual rendered scale and position for lightweight contour/rectangle clearance tests; do not repeatedly inspect individual source pixels when placing the shiny control.
* If subject isolation is unreliable (for example an opaque background), retain dependable existing fitting/placement behavior without speculative segmentation. Do not fall back to runtime color scanning.

Retire obsolete packed-mask, interior-hole and per-pixel collision runtime paths and tests when a verified replacement makes them unnecessary. Preserve tests that validate the retained exact exterior-outline behavior.

Experimental record (2026-10-17): The user-provided native-Poké5e artwork archive yielded an offline baseline of 1,139 475×475 PNGs, 1,433 exterior contours and zero extraction failures in that archived snapshot. The manifest and extractor are local experimental artifacts, not an integrated current-live-catalog coverage guarantee. A separate reversible Species Card v0.1.27-bbox.1 test embedded 1,139 alpha-derived subject *rectangles* (not contours). User Safari ON/OFF captures for Sentret, Noctowl, Ledian, Charmander, Venusaur and Makuhita confirm useful subject positioning on promoted layouts but expose excessive image growth, lost component promotion and negative space; compact/mobile was unchanged because its rendering bypassed the experimental transform. Do not describe these screenshots as full contour/collision verification.

ART-PREFETCH — Geometry availability before presentation

Status: Requirements revised; prior three-priority *runtime scan queue* is not the default architecture. Implement only measured, necessary Fakémon cache warming.

Requirements

* **Original Pokémon:** package and index precomputed authoritative normal-artwork subject geometry. Ordinary navigation uses a manifest lookup, not a runtime scan queue. Validate species/form identity, artwork revision and current-catalog coverage.
* **Fakémon editor:** when the user selects or replaces a normal portrait, start analysis as soon as the locally selected artwork can be decoded—even before Save. Keep results provisional until successful native media persistence; cancel/discard them on edit cancellation, failed save, source replacement or stale identity.
* **Fakémon cards:** prefer already saved analysis, edit-session results or previous successful records. If an uncached portrait requires analysis, prioritize that specific card, with bounded execution and a predictable failure fallback.
* Optional hover/focus, adjacent-species and idle cache warming is permitted only if testing shows meaningful first-reveal benefit beyond edit-time analysis; do not install a site-wide background scanner by default.
* Deduplicate inflight work; avoid repeated image decoding, unwanted network traffic or scanning on theme/shiny/resize. Coordinate with the established list-to-card handoff rather than creating a second readiness system.
* Verify actual native editor media selection and upload lifecycle, data identifiers, browser decoding/CORS, and Safari memory/timing before relying on this design.

The earlier hover/adjacent/idle three-tier queue is an archived exploration, not an accepted requirement to implement.

ART-CACHE — Persistent geometry analysis records

Status: Initial IndexedDB/snapshot candidate implemented; streamline to geometry-only records and verify in a real browser.

Requirements

* Use species/form identity within its Pokémon/Fakémon namespace as the lookup key; source URL/hash, saved artwork revision and geometry-analysis version are record metadata, not silent alternative identities.
* Store precomputed original-Pokémon normal-artwork geometry as a versioned read-only manifest; cache successful Fakémon normal-artwork geometry (including monotypes) by saved source revision. Do not cache or compute runtime artwork-derived type-color choices.
* Coordinate one stable initial geometry presentation from validated results already available; no late repositioning flashes.
* Reuse successful geometry without rescanning; revalidate authoritative normal artwork as needed while preserving last-good results on failures, interruptions or storage denial.
* Avoid recomputation from shiny toggles, viewport resizing, theme changes or same-session navigation. Respond to size changes using previously extracted geometry.
* Migrate obsolete color and full-canvas mask records, diagnostics and tests only when the replacement geometry format and compatibility path have been verified. Keep synchronous snapshots small and canonical records in IndexedDB.
* Creator-selected backgroundType persistence belongs to species/editing data, **not** to the artwork-analysis cache.
* Provisional Fakémon edit-time geometry must not replace the last-good species record before native save succeeds. Restore/use last-good geometry on failed/cancelled edits, and invalidate or reanalyze when the authoritative normal artwork changes.

ART-MODULE — Standalone Artwork Intelligence userscript

Status: Archived ART-02-R01 experimental fourth userscript exists only on `dev/hero-restoration-2026-10-14`; production geometry-only replacement not implemented or accepted.

Requirements

* Keep Artwork Intelligence independent of QoL, Species Card and Theme Overlay.
* Own normal-artwork acquisition, geometry analysis, geometry records and layout recommendations; not color selection.
* Expose a versioned, read-only public API for consumers.
* Do not independently modify cards, shiny controls, theme styles or navigation.
* Permit existing scripts to initialize and operate without Artwork Intelligence.
* Support consumers starting before or after Artwork Intelligence.
* Avoid competing image decoders, full-page observers and duplicate analysis machinery.
* Preserve an independently buildable and testable module.

Historical implementation: ART-02-R01 introduced a fourth userscript and public API on the archived branch. The approved `main` baseline has three standalone userscripts; do not merge the experimental ART implementation without removing obsolete runtime color/mask machinery and checking consumers.

ART-SOURCE — Authoritative normal-artwork acquisition

Status: Archived source coordinator implemented experimentally; new offline-original/editor-driven acquisition not yet verified on target browsers.

Requirements

* For original Pokémon, validate authoritative normal portrait URLs and hashes while generating the offline manifest. For Fakémon, obtain selected normal portrait bytes from the native editor as early as practical and confirm the successful saved source/revision; use read-only `get_fakemon` when verifying already-saved media.
* Never infer the analysis source from the currently displayed portrait, which may be shiny or another variant.
* Keep acquisition read-only and independent of QoL’s private portrait functions.
* Deduplicate Artwork Intelligence’s own metadata requests and in-flight analysis.
* Measure any duplicated network work shared with QoL before attempting cross-script optimization.
* Reject mismatched species identities and stale navigation results.
* Coordinate *first visible presentation* with the existing card-readiness system: a newly requested card may await compatible geometry/layout selection for a bounded period, but an already visible card must not disappear or reflow due to late artwork processing. Fall back safely if geometry fails.

Current implementation: ART-02-R01 includes an independent acquisition coordinator.

ART-INTEGRATION — Shared analysis consumers

Status: Planned; ART geometry consumer integration not yet committed.

Requirements

* Theme Overlay consumes **static original-Pokémon backgroundType assignments** and separately persisted, creator-selected Fakémon backgroundType; neither color source depends on an ART image scan.
* Species Card consumes reliable visible bounds, exterior outlines and effective composition bounds for hero scaling/positioning and decorative overlap.
* QoL consumes optional shiny-icon corner recommendations without relinquishing the button or manual preferences.
* Geometry may load or finish independently of native type/theme data. A failed or missing ART result must not prevent theme styling, navigation or shiny operation.
* The card's **geometry presentation** must be coherent: use compatible completed geometry results before first reveal where available, and avoid a visible second-pass jump while the card remains onscreen.
* Reject outgoing-species, stale artwork, mismatched identities and incompatible analysis revisions; keep last-good geometry while revalidating in the background.
* Existing script owners retain all display, interaction and styling responsibilities. Consumers do not independently fetch or reanalyze source pixels.
* Preserve normal standalone behavior when Artwork Intelligence is absent, incomplete or unsuccessful, without hiding loading defects behind replacement cards or corrective flashes.

Cold-first-reveal policy: prefer precomputed/cached geometry; for a genuinely uncached Fakémon, briefly hold the not-yet-visible card within the existing readiness/handoff lifecycle until analysis and layout are ready. Bound failure/unavailable handling and preserve the currently visible list/card until replacement is ready. Never replace an already visible card or block indefinitely. Exact Safari wait/fallback budgets remain to be measured.

ART-QOL — Optional shiny-control enhancement

Status: Planned; design requirements settled, integration awaits exterior-contour geometry.

Requirements

* QoL remains the sole owner of the shiny button, toggle, manual positions and saved preferences.
* Artwork Intelligence enhances the shiny button but must never become a dependency of it.
* Without Artwork Intelligence, preserve all existing shiny functionality.
* Apply preference precedence: explicit manual corner → valid automatic recommendation → existing top-right fallback.
* Distinguish an absent manual preference from the default returned by savedPortraitCorner().
* Evaluate four candidate corners using the normal artwork's visible-content box, actual icon dimensions, clearance and the **exterior contour**, not repeated pixel-level collision tests.
* If any original corner is valid, do **not** expand. If none is valid, expand equally on all four sides by exactly one rendered icon width and reevaluate; supply the effective composition bounds to Species Card.
* Never override or constrain any of the four explicit manual corner choices, including intentionally inconvenient choices.
* Recalculate placement cheaply when real rendered dimensions/position change, without artwork rescans or unnecessary repositioning loops.
* A missing, late or failed recommendation must not interrupt interaction, card loading or existing shiny behavior. Never analyze shiny artwork.

ART-RUNTIME — Worker and browser performance

Status: Discussing optimization; ART-02-R01 worker and full-scan fallback exist.

Requirements

* Separate and profile native metadata retrieval, image transfer, decoding, geometry extraction, hashing, worker transfer and storage writes. Retired color scoring is not part of the runtime performance budget.
* Keep expensive analysis off the UI thread wherever supported; verify Blob-worker behavior in the actual userscript extension/iPad Safari environment.
* A worker-denied main-thread fallback must not cause an uninterrupted large UI stall. Measure any fallback and implement safe scheduling without delaying native card presentation.
* Avoid decoding twice, competing scanners, excessive RGBA copies or retaining per-species temporary buffers after analysis.
* Remove retired runtime color-scoring costs and dependencies from ART rather than optimizing a feature no longer required. Retain offline source datasets and results independently of the production geometry runtime.
* Preserve pixel-faithful exterior contours at whatever representation is chosen; do not claim approximate geometry is exact.
* Report unsupported formats, decoding and color-management differences. Distinguish actual Safari measurements from desktop/Node or calculated memory proxies.
* Remove retired production algorithms, masks, caches, worker code and tests rather than keeping them running or maintained for hypothetical reuse.

Current implementation: ART-02-R01 includes a Blob worker and same-bundle fallback; actual Safari timing/persistence is unverified.

ART-ORIGINAL — Original-Pokémon background type assignment migration

Status: **Accepted and integrated on `main` — 613 user-curated original-Pokémon backgroundType assignments in Theme Overlay v0.3.50** (accepted file originally committed on dev as 41179f9a, later promoted in clean main snapshot).

Requirements

* The chosen offline seed is the **Hue/Saturation + Neutral Lightness** full set of 613 original dual-type Pokémon/forms (not the later 50/50 hybrid). No original-Pokémon runtime scanner is needed.
* The temporary VisualType reviewer lets the user invert an individual assignment, globally preview **assignment → tint versus banner**, and export the entire corrected set. Its review script and local edits are not a committed permanent Theme Overlay migration.
* Keep the exact reviewed/approved assignments, including form-specific identity, separate from visual mixing. Preserve user edits on import; check species ID/form mapping and that the selected type is one of the actual types.
* Migrate legacy four-tuples `[primary,secondary,banner,tint]` and provisional `visualType` toward a single proposed `backgroundType` decision per original dual-type identity. The other color and its surface roles are resolved separately, not permanently baked into the assignment data.
* Prefer **backgroundType → tint** for original dual types, with the other type used as banner. Monotypes retain their established single-type styling. The review toggle is a comparison control, not a requirement for a permanent user-facing global toggle.
* Decide whether the static original-Pokémon data belongs in a small dedicated source file or remains embedded in Theme Overlay, based on maintainability, installation simplicity, startup cost and single source of truth. Do not create duplicate authorities.
* Original-Pokémon geometry, if later supported, is independent of this frozen color assignment set.
* Regress across form variants, Pokémon/Fakémon separation, local review export/import, all themes, shiny transitions and native navigation before deployment.

⸻

HERO — Hero Layout

HERO-FOUNDATION — One content-driven layout engine, information retention and balanced height

Status: Ready for phased implementation; principles established from user Safari bounding-box A/B feedback, not yet implemented as one engine.

Requirements

* A layout is a layout: use one geometry/measurement/selection system for mobile/compact, split-panel and wide cards. Native DOM/state can be retained, but `lab3-active` or equivalent “promoted-versus-native” branches must not exempt compact layouts from subject bounds, component icons or sizing rules. Retire opaque structural stage distinctions when their consumers are replaced.
* Treat *placement*, *presentation/scale* and *semantic content* independently. A component can remain compact or become prominent without requiring that it move into another column; no mandatory promotion order and no reward merely for the number of promotions. Measure the final visual form *before* selection.
* **Monotonic useful information with width:** for the same Pokémon/form, usable panel height, font/text scale, source data and UI state, widening the panel must not cause less *meaningful semantic information* to be visible above the scroll boundary. Evaluate actual visible data, not only sections/headings; reject larger-artwork/decorative-whitespace trades that reduce information. Record legitimate exceptions from simultaneous height/font/source changes rather than misattributing them to width.
* **Preferred hero height:** begin evaluation around 25–40% of *usable* panel height as a soft band, not a mandatory fixed minimum/maximum or clipping constraint. The content and selected arrangement can exceed it; a sparse hero need not be padded up to 25%. Re-evaluate from real viewport/card geometry in desktop, mobile and split panes before tuning percentages.
* **Art size:** independent subject-based minimum, preferred and maximum dimensions; allow the chosen image size to decrease even as width increases when a different arrangement better preserves information, footprint or balance. Never demand growth simply because space became available; constrain tall narrow subjects without over-shrinking wide ones.
* **Alignment:** seek a clean common lower edge among populated left/art/right regions with modest residual negative space. Consider rearranging data, adjusting art size and scaling eligible components in that order. Never manufacture alignment through oversized images, arbitrary blank padding, excessive control stretching or hidden/omitted data.
* **Clearance:** before contour overlap is approved, measure final artwork bounding rectangles and actual nearby element rectangles with a nonzero minimum horizontal clearance when vertical spans overlap. Once verified, replace conservative rectangle clearance with true exterior-contour tests. Keep interaction and HP/text safe.
* Prefer measured, bounded candidate generation with a common, current-state-independent basis and caching. No giant collection of static layouts, unbounded combinatorial searches, browser-after-paint rescues or observer feedback loops.

Acceptance/representative checks: iPhone compact Makuhita; iPad/desktop Sentret, Noctowl, Ledian, Charmander and Venusaur under subject-box A/B; long versus short descriptions; text and icon wrapping; incremental widening at fixed panel height; no loss of visible semantic information, clipped controls, state-dependent oscillation or diminished native behavior.


HERO-IMAGE — Subject-aware artwork fitting

Status: Reversible Safari subject-bounding-box experiment validated for several *promoted* layouts; no production subject-aware integration yet, and compact/mobile remains unaffected by the experiment.

Requirements

* Fit, center and scale artwork using actual visible subject bounds instead of transparent canvas margins, while retaining the complete original artwork source.
* Use accurately extracted normal-artwork exterior contours to allow suitable decorative extension into empty neighboring hero space.
* Protect HP values, labels, controls, hit targets and stacking from subject-outline overlap.
* Use the uniformly **expanded effective composition bounds** when automatic shiny placement has required expansion; otherwise use the original content bounds.
* Work with the actual rendered artwork transform and existing content-driven hero grammar, not a new catalog of fixed layout permutations.
* Maintain a dependable fallback for opaque or unavailable geometry, preserving existing hero behavior.
* Avoid layout jumps, transient oversized artwork, unnecessary DOM reconstruction and repeated post-paint corrections.
* Select subject-image height as a genuine decision variable within minimum/preferred/maximum bounds, subject to the final shared layout constraints. Treat a 25–40% preferred *hero* range separately from artwork-size limits. Vertical subjects must not fill otherwise wasteful space simply because more image height is feasible.
* A/B examples: Sentret exposed excessive central image height and lost below-hero visibility; Noctowl was borderline; Ledian/Charmander/Venusaur showed artwork growth sometimes making composition worse; Makuhita revealed the existing compact-path omission. These are general regression cases, not species-specific special rules.

HERO-SHINY — Automatic shiny-icon placement

Status: Planned.

Requirements

* Preserve all four unrestricted manual placements and the established manual-over-auto precedence.
* Score four corners **within** the normal-artwork subject box using the icon's real rendered width/height and stored exterior contours; no interior-hole fitting or pixel-by-pixel source collision engine.
* Prefer a valid original corner with stable clearance. If any original corner is usable, do not expand.
* Only if all four original corners fail, expand equally on all four sides by **exactly one current rendered icon width** and reevaluate four corners.
* Pass any expanded composition bounds into hero fitting; do not clip artwork to this rectangle or draw a visible outline.
* Use normal artwork metadata only, even if shiny artwork is currently displayed, subject to safe source/geometry compatibility checks.
* Keep manual position controls and interaction unchanged, without layout rescue for intentionally inconvenient manual choices.

HERO-GRAMMAR — Content-driven adaptive composition

Status: Implemented candidate through Species Card v0.1.27; diagnosed oscillation correction committed on `main`, live iOS Safari regression and unified-layout refactor outstanding.

Requirements

* Choose hero arrangements from actual card content, available width, rendered height and overall page footprint.
* Evaluate Score, Vitals and Abilities placement/presentation independently when compatible, preserving room for individual detail icon/value cells; final state need not correspond to an ordered promotion stage.
* Avoid treating promotions as a mandatory linear progression.
* Permit horizontal, stacked and split biology arrangements where they fit.
* Compare promoted compositions against the space occupied by their unpromoted native sections.
* Avoid unnecessary portrait shrinkage, excessive blank space and oversized hero heights.
* Preserve natural native content, controls and event handlers.
* Avoid returning to a large catalog of hardcoded layout permutations.
* Keep layout decisions stable during resize, navigation and asynchronous rendering.

Current implementation: GEO-01-R01/R02 grammar retained in Species Card v0.1.27; the v0.1.27 copy-measurement correction is committed. Current native/compact fallback still lies outside full layout selection. Browser acceptance and broader grammar consolidation pending.

HERO-OSCILLATION — Repeated or width-sensitive hero promotion/demotion

Status: **Correction committed; Safari verification pending.** Root cause reproduced in Work-mode Chromium diagnostics (2026-10-17); Species Card v0.1.27 on `main` normalizes measurement geometry. Earlier investigation notes below remain historical leads, not claims of unresolved initial diagnosis.

Observed behavior (2026-10-16 to 2026-10-17)

Confirmed diagnosis and corrective record (later evidence supersedes preliminary identifications below):

* Work-mode browser reproduction: Nosepass at ~475px card width switched between native and scores-promoted arrangements; Croconaw at **622px** card width switched repeatedly, while 624px was stable in the recorded run. Neighboring species provided controls. This clarifies the earlier unnamed ~624px report; it is not a universal threshold.
* Cause: a detached description measurement clone lacked the normal hero-child CSS relation and inherited 16px side padding in one layout state, while a promoted-state selector zeroed that padding; different wrapping heights changed candidate ranking after the observer reran layout.
* Species Card **v0.1.27** makes the clone's content box match live zero padding, measures candidate-specific text wrapping and separates measurement cache keys for native/promoted candidates. It does **not** change scoring, thresholds or the observer. The padding-only in-memory diagnostic stopped the captured oscillations; the exact published v0.1.27 build still needs live target-device regression, so do not mark Accepted.
* Historical 0.1.26 code-inspection hypotheses and the earlier “second species unknown” notes below describe the investigation *before* these results; they should not drive speculative additional patches.


* Nosepass (#0299) repeatedly alternates between native and promoted hero arrangements while the selected species and browser-panel width remain unchanged. The animation visibly relocates ability scores, gender/egg bars and artwork, rather than showing a normal one-time load transition.
* The recording shows the problem in desktop-style Safari with a narrow split browser panel. Other species shown after navigation do not establish that the defect is unique to Nosepass.
* The recording proves repeated layout changes, but does not include live layout-state or computed-style telemetry. The full causal chain is not yet confirmed.
* Additional user report (2026-10-17): another, as-yet-unidentified Pokémon exhibited Nosepass-like flicker at an approximately 624 px panel width. After resizing the window away from that width and back, the flicker stopped in that session. The width is approximate; no live state/geometry trace was supplied for this case. This is a second reported affected species, not evidence of a confirmed root cause or permanent resolution.
* Nosepass is the first identified species; at least one additional, unnamed species is now reported. Compare shared width/selection-history behavior and species-specific content rather than assuming the issue is unique to Nosepass or universal at every width.
* The clip visibly alternates between native scores and a scores-promoted arrangement; confirm the exact promotion flags by instrumenting the real layout selector. A near-tie between candidates is a hypothesis, not a measured finding.

Cross-species and reproduction investigation

* Historical investigation item now resolved as **Croconaw, card width ~622px** in measured Chromium; retain distinction between viewport, article and panel widths for subsequent Safari verification.
* Reproduce a direct entry at the affected width, resizing across the boundary, returning to the same width, refreshing there, and changing species/theme. Compare initial and subsequent candidate decisions to test whether prior selections or remembered geometry affect stability.

* Record Nosepass's actual description text and rendered line count, gender/egg field values (including the short Mineral label), normal portrait intrinsic dimensions/aspect ratio and displayed size, Abilities content, card inner width, font state and layout measurements. Compare against representative species that stay stable at the same width and theme.
* Capture the entire candidate table before and after each flip: promotion tuple (especially native versus scores-only), biology arrangement, track widths, content/section heights, displaced native-footprint measurements, feasibility constraints, image minimums, quality score and chosen winner.
* Test whether content geometry places Nosepass near a legitimate decision boundary. Quantify any score/height difference and show precisely which input changes between passes; do not assume that a short Egg label, long description or image aspect ratio is causal without comparing measurements.
* Check the intrinsic portrait ratio at first render versus after decode, and remeasure under an unchanged ratio to separate image readiness from selector-induced oscillation.
* Reproduce at the recording's narrow desktop split-card geometry, then compare a range of widths immediately above and below the boundary, including stable neighboring Pokémon.

Source inspection leads (Species Card 0.1.26 on `dev/hero-restoration-2026-10-14`)

* `chooseStage()` uses measured native-versus-promoted footprint, stored previous promotion and retained-image constraints. Confirm that each candidate is measured under an invariant canonical style/state independent of the currently applied promotion.
* `createMeasurer().nativeFootprints()` attaches measurement clones inside the presently styled article. In particular, `article.lab3-active` changes stats/banner margins; test whether this makes the displaced/native footprint depend on the previous selection and produces an alternating winner.
* `rememberNativeHero()` retains `old.promotion` and `old.layout` when identity/width are unchanged, even after the actual DOM was restored to native. Correct the stale recorded identity when verifying the root cause, without sacrificing legitimate resize hysteresis.
* The Hero `ResizeObserver` schedules a subsequent layout pass when the artwork/info height changes. Determine whether the script's own promotion/demotion initiates the next pass; an observer-triggered pass must not create an endless feedback cycle.
* Inspect `geometryMemo` keys and `resizeMemory` for selection-dependent inputs, cached geometries or retained minimum image heights that change merely because an arrangement was applied.

Requirements and acceptance

* With unchanged route, card width, source data and font metrics, repeat evaluations must select the same stable arrangement. Do not rely on a delay, arbitrary cooldown, animation, hidden card or frozen layout to mask instability.
* Distinguish genuine changes (viewport, text, portrait intrinsic dimensions, font readiness, theme) from self-generated layout changes. Ensure one coherent measurement basis for competing candidates.
* Capture per-pass chosen promotion, biology mode, source identity, card/content widths, projected footprints, candidate costs, image height and reason for recalculation on live Safari.
* Regression-test Nosepass near the recorded narrow split-pane width and the second reported case near approximately 624 px panel width, including a resize away and back. Also cover shorter/taller descriptions, different abilities, theme modes, refresh, next/previous navigation and manual resizing across thresholds.
* Preserve adaptive promotions when actually beneficial; fix the input/state inconsistency rather than disabling a legitimate layout mode.
* After tracing the actual cause, correct the offending geometry measurement, native-state restoration, memory invalidation or observer dependency at its owner; remove obsolete logic superseded by the correction. Do not add delays, a cooldown, arbitrary threshold hysteresis or a Nosepass-specific exemption.
* Confirm that the chosen native or promoted scores layout is stable across repeated evaluations while inputs are unchanged, and changes appropriately when text, fonts, dimensions or portrait data genuinely change. Validate with the actual Nosepass content, not only synthetic test fixtures.
* The scoped v0.1.27 measurement correction was explicitly authorized on `main` and inherited by the active dev branch; further work remains on dev until separately approved. Do not claim the published build passed live Safari tests.

HERO-BANNERS — Promoted Abilities heading

Status: Implemented; visual acceptance outstanding.

Requirements

* Reuse the existing native Abilities heading.
* Match the established section banners below the hero.
* Preserve the text’s left inset and native angled right decoration.
* Align the upper-right decorative point with the container’s right boundary.
* Preserve matching appearance across Light, Dark and Type themes.
* Apply the same geometry to measurement clones.
* Remove obsolete rectangular-heading styling rather than layering competing decoration.

Current implementation: Initial restoration followed by a native-heading correction.

HERO-SCORES — Promoted ability-score appearance

Status: Implemented; visual acceptance outstanding.

Requirements

* Apply established theme styling when the original score elements move into the hero.
* Target the current promoted DOM structure rather than retired layout classes.
* Preserve native score labels, values and semantics.
* Allow score typography to scale with the actual available column width.
* Keep color ownership with Theme Overlay and geometry ownership with Species Card.
* Avoid hardcoded white lettering that conflicts with Type-theme ink.

HERO-VITALS-CELLS — Reuse existing vitals SVGs in compact and promoted presentations

Status: Ready for a first implementation candidate; geometry and compact visual baseline agreed, not yet built or accepted.

Goal

* Begin icon-based information presentation with the existing four vitals (SR, AC, HP, MinLvl), because their icons and promoted hero treatment already exist. Preserve the existing SR silhouette, HP heart, AC shield and minimum-level graphic; do not replace the approved SVGs with generic approximations.
* In compact presentation, replace visible text labels with the corresponding small icon followed by the native value: SR, AC, HP including hit die, and MinLvl including the established level suffix/range rules. Preserve semantic/accessibility names.
* **Initial compact treatment: unboxed.** No individual fill, border or decorative framing; use spacing and alignment alone. Only after browser review explore optional low-opacity frames, subtle outlines or a shared understated container. None of those are approved initial requirements.
* Compact icons initially inherit the actual species/card body-text color in Light, Dark and Type modes. Existing separately colored icons remain available for sufficiently roomy promoted tiles. Choose monochrome versus semantic color according to final cell size/visual density, not a fixed viewport breakpoint.
* Every icon/value pair remains an independent content cell in all layouts, including native-like compact arrangements. Placement, dimensions and visual presentation are separable decisions; cells may appear inline, arranged across multiple rows, or enlarged as existing hero tiles when that improves total composition. Promotion must not force a particular icon/value presentation.
* Aim to keep all four compact cells in one row when their measured final content fits. Permit unequal width allocations (HP/hit dice often require more width); evaluate alternatives only when necessary. Never allow collisions, truncation or panel overflow.
* Reuse the native value nodes/data and one canonical SVG definition/mapping wherever feasible; do not add a second independently maintained vitals icon set or duplicate native state. Preserve existing tile behavior and navigation until a replacement is verified.

Implementation/acceptance notes

* First investigate how `.yofi-vitals-row` native fields and `.lab3-vital` promoted tiles consume their data, and consolidate the common presentation without breaking existing native ownership or the layout selector's measured geometry.
* Measure and validate the final icon/value cells before layout choice, not by swapping labels after the chosen geometry has been scored. No extra late paint or compensating observer.
* Test narrow iPhone cards, iPad split panels and wide cards; native versus promoted; long HP values, varying MinLvl text, Light/Dark/Type, transitions and browser refresh. Inspect optical alignment of the four existing SVGs at compact sizes.
* This is the **first icon implementation task**, ahead of movement/effectiveness/senses. A compact unboxed cell row is the baseline for user visual testing, not blanket authorization to replace all existing vitals arrangements.

HERO-BIOLOGY — Adaptive gender/egg arrangement

Status: Implemented candidate; paired-size and column-boundary regressions reported, browser acceptance outstanding.

Requirements

* Consider horizontal versus stacked gender/egg placement using real text fit and available dimensions.
* Allow biology arrangement decisions independently of other hero promotions where feasible.
* Support left-stacked and split arrangements.
* Prefer stacked bars when this improves readability without unnecessarily increasing page height.
* Retain the same underlying native biology information.
* Avoid sacrificing available egg-text width merely to preserve an inline arrangement.
* Preserve continuity while layout selection changes.
* Treat Gender and Egg as a coordinated pair in every selected orientation: **equal measured outer heights are mandatory** with consistent corner geometry and coordinated typography/icon scaling. **Equal widths are the current/default first design**, not a permanent invariant; later arrangements may give Gender less horizontal space if the actual ratio/icons still fit, freeing usable track width for an additional semantic cell such as a square speed-value tile.
* Fill assigned tracks according to the chosen measured layout. Initially use equal allocated widths where the pair shares a row/column; permit independent track allocations in a later candidate if content fit and overall information density improve. Never leave avoidable width stranded inside a bar or allow either bar to cross its track boundary. A smaller Gender width must not force the Egg label to compress unnecessarily.
* A compact stacked arrangement may use a smaller shared bar height and coordinated text/icon scale than a horizontal arrangement. Evaluate each bar's actual fit at its *own assigned width*, select one common outer height, and reject clipped or illegible choices; never shrink one bar's height independently.
* Bound both bars to their assigned column boxes at every layout stage. Reject arrangements that intrude into an adjacent column or the artwork lane rather than masking overflow with clipping or arbitrary CSS corrections.
* Measure the final text and icon geometry when comparing orientations, accounting for font readiness and wrapping, and keep the accepted layout stable through navigation and resize.

Reported Safari regression cases (2026-10-16; exact installed script commit not independently verified):
* Gummibo: side-by-side Gender bar does not stretch to match the Egg bar's allocated width.
* Gummigills: stacked bars differ in width and can be unnecessarily large for the available space.
* Mawile: Egg bar extends past the left text column into the adjacent artwork lane.

Acceptance: the two bars have equal measured **outer heights** in every chosen layout; widths are equal in the current default arrangement but are allowed to differ in a measured future compression candidate. Each remains inside its assigned track, uses legible icon/text scaling, avoids unnecessary space, and stays consistent across compact/wide rendering, refresh, navigation and all themes. Verify any compressed-Gender-plus-speed-tile candidate as a separate presentation variant.

Current implementation: BIO-01 and GEO-01 introduced measured fitting and additional arrangements; acceptance of shared geometry remains outstanding.

⸻

BIO — Species Biology Presentation

BIO-EGG — Unified egg-group bar

Status: Implemented candidate; paired sizing and Egg overflow require correction, styling acceptance outstanding.

Requirements

* Use the same recognizable egg-bar presentation in compact and promoted species layouts.
* Place the egg icon consistently at the left.
* Center the remaining text within its available content region.
* Scale the icon and text proportionally at different sizes; the egg SVG's visible height should match its adjacent text's visible height (using font-relative dimensions and optical adjustment if needed).
* Always match the Gender bar's measured **outer height**. Initially match width where both bars share equal allocated tracks; do not force equal widths in a future explicitly measured asymmetric placement. Egg width must fit its complete group-name content.
* Prefer a readable single line where it fits. Otherwise allow natural whole-word wrapping within the Egg bar's assigned width and increase the **shared height** of BOTH bars as needed; reject layouts that cannot fit legibly. A separately compressed Gender width must not silently constrain Egg wrapping.
* Avoid breaking words, clipping group names, or overlapping an adjacent layout column.
* Remove visible Egg: and Egg Group: labels and obsolete display alternatives.
* Preserve accessible meaning and native egg-group data.
* Reuse the same icon/value construction instead of duplicating components.

Visual question: The originally requested white egg bar and the current 15%-grey Light-theme implementation are not identical. Confirm the desired final surface treatment before treating this item as accepted.

BIO-GENDER — Responsive gender bars

Status: Implemented; browser acceptance outstanding.

Requirements

* Scale gender symbols and ratio typography according to available bar width and height.
* Preserve relative icon/text proportions and centering; make gender symbols' visible SVG height match the text height at the selected shared scale.
* Fill the **chosen Gender track width** and match the Egg bar's **outer height**, not necessarily its width. Equal widths are the current default; later test safe horizontal Gender compression when that reclaimed space can fit another useful element, without clipping symbols or changing the ratio semantics.
* Accommodate genderless, single-gender and mixed ratios.
* Preserve the native gender segments and their behavior.
* Prevent clipped icons, oversized labels and narrow-width collisions.
* Coordinate gender scaling with biology layout measurement.

BIO-LEVEL — Minimum encounter-level notation

Status: Implemented; regression testing outstanding.

Requirements

* Display numeric minimum levels below 20 as N+, such as 15+.
* Display level 20 without a plus sign.
* Preserve unexpected or noncanonical source values instead of inventing replacements.
* Limit the transformation to presentation, leaving source data unchanged.

Current implementation: BIO-01-R01 and its subsequent correction.

⸻

THEME — Visual Styling

THEME-PALETTE — Canonical type palette and per-type derived treatments

Status: **Accepted and integrated on `main` — Theme Overlay v0.3.50** (user-approved 2026-10-17; accepted source originally committed as 41179f9a, then promoted in clean main snapshot). Browser deployment/installation remains independent from the GitHub commit.

Requirements

* QoL remains the **single source of truth for the canonical 18 Scarlet/Violet type colors** (`--skin-<type>-bg` currently). Do not duplicate or silently replace base colors in Theme Overlay or ART.
* Define a **per-type presentation palette** derived from each canonical color using CSS variables and configurable mix parameters: `Type` (base), `TypeBg` (background tint), `TypeLight` (lightened treatment), and `TypeDark` (dark ink/outlines/allowed accents). `TypeRgb` is derived on demand only where an actual consumer needs RGB channels; never maintain a second manually edited RGB value.
* Initially let `TypeBanner` and `TypeMove` both consume `TypeLight`; split them into **independent per-type treatments only if visual review justifies it**, without changing the underlying base color or altering move-type semantics.
* Calibrate **each of the 18 types independently** for background strength, light strength, dark strength and, only where needed, separated banner/move strengths. Keep common formulas and shared defaults with explicit individual-type overrides. Derived values should update when a canonical color changes.
* **Absolute constraint: no pairing-specific mixing, lookups, transforms, overrides or corrections.** A Fire banner/background/move/ink treatment must be the same regardless of the Pokémon's secondary type. No automatic pairwise contrast adjustment.
* Type relationships affect **which two per-type treatments are chosen for a species**, not how either of those treatments is calculated. A manually chosen species backgroundType is a data decision, not a per-pair palette rule.
* Preserve the original header gradient's canonical type identities and type badges. Maintain readable body text, banner text, icons, hidden ability indicators and move/TM pills while reusing actual native/site components.
* **A new game's type palette requires visual recalibration.** Regenerating derivatives from 18 new base values is automatic, but existing mixing percentages are *not* assumed to remain aesthetically correct. Keep the parameters discoverable and reviewable for future game updates.
* Avoid storing independent hard-coded derivative hex colors when CSS `color-mix()` from canonical base colors suffices. Record exact generated values only when a technical consumer demonstrably needs a resolved color.
* Keep palette rules in the established Theme/QoL ownership boundary; do not add a new artwork scanner, per-species formula or per-pair special case as a workaround.

Acceptance

* Inspect representative monotype, dual-type and form cards, including Charizard (Fire/Flying), Cloyster/Dewgong (Water/Ice) and Hisuian Samurott (Water/Dark). Those are review examples, **not exceptions**.
* Verify banner prominence, background harmony, text contrast, move-pill consistency, all three theme modes and dynamic palette replacement independently of Pokémon backgroundType selection.
* Measure/verify theme transitions and absence of transient wrong-colored panels on iOS Safari and desktop before accepting.

THEME-ASSIGNMENT — Separate backgroundType from palette mixing

Status: **Accepted and integrated on `main` — original-Pokémon backgroundType assignments in Theme Overlay v0.3.50** (historical dev commit 41179f9a). Fakémon creator-selection persistence remains planned.

Requirements

* For each dual-type original Pokémon/form, persist one chosen background type from its actual ordered type set; creator-selected Fakémon follow the same semantic model after native create/edit persistence is implemented.
* The currently favored placement is **backgroundType as tint; the other type as banners**, with assignment independent of any global presentation swap for comparison.
* Keep original Pokémon and Fakémon data sources distinct; changing the original assignment set must never assign colors to Fakémon.
* Use type-scoped treatments from THEME-PALETTE, not a precomputed per-Pokémon background or banner hex code. Preserve existing monotype behavior.
* Migrate temporary `visualType` exports and current Theme Overlay four-tuples without losing reviewed human choices. Do not silently change names, semantics, or placement during import.
* Review any proposed cross-device persistence mechanism for Fakémon with the native editor/source before code changes. Avoid exposing structured technical metadata in visible notes or corrupting existing notes.

THEME-PROMOTION — Theme continuity for moved elements

Status: Implemented; visual acceptance outstanding.

Requirements

* Preserve theme styling when scores and abilities move out of their native sections.
* Target the actual surviving native elements and current hero containers.
* Apply banner, text, ability and score styling consistently in all three themes.
* Remove obsolete selectors associated with retired structural workflows.
* Prevent layout movement from accidentally changing which theme rules apply.
* Preserve independent operation of QoL and Theme Overlay.

THEME-VITALS — Light-theme hero tile contrast

Status: Implemented candidate; target discrepancy requires review. Compact monochrome vitals treatment is specified separately under HERO-VITALS-CELLS.

Requirements

* Provide visibly distinct neutral tile backgrounds against the white Light-theme backdrop.
* The original requested target was 25% grey.
* Preserve Dark-theme and Type-theme tile styling.
* Apply consistently to single-row and multi-row vital layouts.
* Maintain readable HP, AC, SR and level icons and values.

Known discrepancy: Commit 73938645 introduced 25% grey. Commit 27dc4078 subsequently changed the Light-theme vital and egg surfaces to 15%. Current source retains the 15% treatment. The change has not been explicitly reconciled with the original requirement.

THEME-TM — Type-theme TM ordering

Status: Implemented; regression testing outstanding.

Requirements

* Present Type-theme TM pills in row-major order.
* Preserve established Type-theme pill styling.
* Keep Light/Dark measured-column behavior independent of Type-theme wrapping.
* Do not reintroduce conflicting TM column calculators in Theme Overlay.

⸻

FAKEMON-EDITOR — Native Fakémon Editor Extensions

FAKEMON-EDITOR-METADATA — Versioned species metadata through native Notes

Status: Discussing; architecture candidate only. No editor modification, live save/round-trip test or persistence implementation. Cross-reference THEME-ASSIGNMENT for backgroundType, CM-WORKFLOW for editor continuity, and CM-LIBRARY for the distinct reusable move registry.

Source-grounded constraints

* Native `FakemonEditor.svelte` submits fixed species fields; `SupabaseFakemonDataProvider.ts` explicitly maps fields into `new_fakemon`/`update_fakemon` RPC arguments. There is no demonstrated arbitrary metadata field.
* The species Notes field is server-persisted and read back with the normal Fakémon record. Notes display uses Markdown and DOMPurify, so a namespaced HTML-comment marker is plausible, but exact Markdown-editor round-trip and display behavior require verification.
* Save/edit permissions still require the native write key. Cross-device loading through the existing read-key path is a goal, not a tested feature.

Candidate requirements and approach

* Begin with creator-selected `backgroundType`, restricted to the Fakémon's actual type(s), without runtime portrait color-scanning. Allow future supplementary editor controls to reuse one versioned per-species metadata contract rather than independent ad hoc storage.
* Investigate a single namespaced metadata block in Notes (for example a versioned HTML comment), with centralized parse, validate, merge, migrate and serialize operations. Preserve all user-authored Notes and unrelated data verbatim; do not expose metadata in the rendered species card.
* Prefer synchronizing supplemental controls with the **native Svelte-bound Notes state and save lifecycle**. Blindly injecting metadata into only the outgoing RPC can cause a subsequent native save to overwrite it; avoid unverified synthetic event assumptions.
* Handle missing/malformed/duplicated blocks, outdated formats, typing changes, cancel/reopen, refresh, bare Poké5e editing, stale cross-device edits and conflict recovery. Back up the complete species record before high-risk experiments.
* Keep the reusable custom-move definition library separate from per-species metadata. Storing metadata in Notes does not, by itself, register move IDs in native Pokémon move resolution.

Verification before implementation/acceptance

* Inspect the actual Notes textarea/textarea-markdown event-to-Svelte binding, native create/edit submit and post-save store behavior on the current site, including iOS Safari.
* Prove markup survival and correct invisibility in display/preview, user Notes preservation, write-key behavior, refresh and second-device read, type changes, repeated native saves and failure/cancellation recovery.
* Check server text-size constraints and stale/concurrent-edit behavior. Do not claim cross-device persistence or a working custom move editor without an executed round trip.

⸻

TM — Technical Machines

TM-FIT — Responsive TM pill column geometry

Status: Ready.

Requirements

* Eliminate right-edge clipping at intermediate widths and column-count transitions.
* Select Light/Dark columns using actual rendered widths and available content space.
* Account for labels, generated content, padding, gaps, font metrics and fractional browser layout dimensions.
* Verify candidate tracks against final rendered bounds.
* Avoid arbitrary safety padding and overflow:hidden as substitutes for correct geometry.
* Reuse stable measurements rather than repeatedly remeasuring every pill.
* Preserve the different Type-theme row-major behavior.
* Remove obsolete calculations when replacing the fitting implementation.

Known implementation: Species Card currently owns fitSpeciesTMColumns(); its estimated track calculations require investigation.

TM-TABLE — Native TM list Power column

Status: Ready.

Requirements

* Add Power between Type and Cost in the native TM listing.
* Obtain actual Power values from authoritative move/TM data.
* Reuse existing QoL metadata access where practical rather than creating a second independent fetch system.
* Display power abbreviations in uppercase.
* Render NONE in lighter grey.
* Preserve native links, filtering, ordering and sorting.
* Support responsive table widths without horizontal clipping.
* Extend native rows rather than rebuilding the Svelte table.

TM-NUMBER — TM name notation

Status: Ready.

Requirements

* Replace the displayed 15 - Move Name format with 15. Move Name.
* Match the established numbered TM-pill presentation.
* Preserve actual TM identifiers, names, links and sorting data.
* Avoid altering the underlying native records.

⸻

LIST — Pokémon and Fakémon List Presentation

LIST-SPRITES — Real normal-sprite thumbnails within native list rows

Status: Discussing; source-backed design candidate, no prototype, code changes or Safari performance results.

Source-grounded integration

* The canonical Pokémon SSR listing projects away media/sprites, but the complete client Pokémon dataset includes sprite references. QoL already requests that full canonical dataset for type information; gather sprite metadata from the **existing** response instead of per-row detail fetches.
* Native Fakémon list DOM currently exposes only Name, while Fakémon records have optional uploaded media. QoL 0.13.4 already augments Fakémon list rows with Type/SR and deduplicated read-key lookups; extend that existing ownership/data path to obtain `normal_sprite_filename` where available.
* Native `SpeciesMedia.sprite()` can fall back to portrait artwork. Do not use that fallback when deciding whether a list thumbnail exists: only real sprites qualify.

First presentation candidate

* Place the small normal sprite **after the species name, aligned at the existing black-to-white color transition of the list bar** (the boundary between its dark name region and light region), not before the name or merely adjacent to the final letter. Keep the name's current placement and the native row/link click behavior; inspect the actual row structure and styling to anchor the sprite without changing sorting, searching, navigation, responsive columns or row geometry on Pokémon and Fakémon lists.
* Resolve actual canonical and uploaded sprite URLs from native metadata and established asset origins; never invent asset filenames, hue-shift synthetic sprites or show miniature full portraits for sprite-less species.
* Start by evaluating normal-only thumbnails. Provisional 28–32 px artwork treatment is a prototype size for visual review, not an approved fixed specification. Shiny/female variant behavior, any sprite preference control, and use beyond the two native lists remain open.
* For sprite-less rows, preserve the normal name position and bar transition. Compare reserving a visually empty sprite location at that transition against omitting the sprite element entirely; resolve alignment, overlap and responsive behavior through mobile/desktop review.
* Reuse the current QoL row-decorating lifecycle with a bounded metadata cache, incremental row updates and lazy/near-viewport image loading. Avoid an independent list observer or 1,139 detail requests; evaluate decode/memory and the transient transition as sprite metadata becomes available.

Verification and acceptance

* Test sprites present, sprites absent, missing/broken URLs, original 2018/2024 data, uploaded Fakémon sprites, resort/filter/search and navigation after list updates.
* Measure first list paint, scrolling, network/image memory and row-height shifts on iOS Safari and desktop/narrow panels. Preserve continuous list/card rendering during navigation and check Light, Dark and Type themes.
* Keep implementation and real-device acceptance separate. No scripts or lists have yet been modified.

⸻

MOVES — Moves List Presentation

MOVES-POWER — Power typography

Status: Ready.

Requirements

* Display Power values in uppercase, including STR, DEX, CON, INT, WIS and CHA.
* Preserve combinations such as STR, DEX.
* Display NONE in uppercase with lighter-grey typography.
* Keep the native Power values unchanged.
* Preserve table layout, filtering, sorting and links.
* Share the resulting visual convention with the TM list.
* Scope the styling to the intended Power cells rather than every occurrence of None.


⸻

CUSTOM-MOVES — Custom Move Creation and Integration

Scope: User-authored move definitions usable by multiple Fakémon and trainer Pokémon. Requirements describe desired behavior; Implementation recommendations are provisional engineering guidance, not approved architecture or authorization to change code.

CM-DEFINITIONS — Reusable custom move definitions and editing

Status: Planned; native editor preview inspected, no complete authoring implementation.

Requirements

* Create and edit reusable custom moves from the Moves view and from Fakémon create/edit.
* Support the native mechanical fields needed for correct display and calculations: stable ID, name, type, move power, PP, timing, duration/concentration, range, area shape, attack/save properties, damage/healing dice, description and higher-level effects.
* Allow the user to reuse an authored move across any number of Fakémon without duplicating its authoritative definition.
* Present authored moves in the normal Moves list, details and relevant selectors, consistent with native type, stat and description presentation.
* Support editing an existing move without unexpectedly invalidating its existing learnset references.
* Validate required fields and mechanically unsupported choices rather than silently creating incomplete definitions.
* Preserve distinctions between standard moves, shared custom moves, and per-Pokémon customizations.

Implementation recommendations

* Represent authored definitions using Poké5e's current MoveJson schema and stable namespaced IDs; validate against both supported edition formats.
* Reuse the native move display and calculation code wherever available; build only the missing authorship UI and persistence layer in the userscript.
* Treat src/lib/moves/custom/CustomMoveEditor.svelte as a UI reference, not a working API: its preview page has an empty submit handler and no complete save/load workflow.
* Do not confuse native MoveCustomization (changes to a particular trainer Pokémon's learned move) with globally reusable CustomMoves.
* Start with the fields supported by native rendering, then explicitly handle remaining fields such as area shapes, saving throws, dice tiers and higher-level progression before declaring feature completion.

CM-LIBRARY — Persistent, independent custom-move registry

Status: Discussing; hidden-library-Fakémon approach preferred for investigation, not yet implemented.

Requirements

* Keep shared move definitions independent of any individual Fakémon that learns them.
* Do not delete a definition merely because all learners unlearn it or are deleted.
* Persist definitions across refreshes and browser restarts; support access from the user's other devices.
* Keep the library out of normal userscript Fakémon views without requiring it to disappear from bare Poké5e.
* Preserve ordinary Fakémon notes and any existing authored content; userscript editing must expose clean move fields even if raw JSON/comments remain visible in bare Poké5e.
* Support backups, versioned formats, explicit deletion, and safe handling of duplicate IDs or conflicting edits.
* Clearly explain how a newly linked device gains access to the shared library and how stale local copies reconcile.

Implementation recommendations

* Evaluate one dedicated hidden library Fakémon with versioned JSON in its Notes field as the server-backed source of truth, rather than scattering definitions across learners' notes.
* Keep a locally persisted last-good mirror for early page startup; load and refresh the authoritative library through the existing Fakémon read-key path.
* Preserve the library's access keys and prevent accidental hiding from becoming accidental deletion; make recovery/export possible.
* Make registry synchronization explicit and conflict-aware. Do not silently overwrite newer remote data with stale notes or a browser cache.
* Resolve startup sequencing before shipping: the library must be discoverable without depending on the very custom-move resolution it supplies.
* Avoid requiring users to add duplicate definition payloads to every learner. Their saved learnsets should reference stable custom move IDs.

CM-NATIVE — Native move lookup, injection and lifecycle

Status: Ready for targeted diagnosis; initial injection probe worked, saved-reference regression observed.

Requirements

* Make custom move definitions resolvable wherever Poké5e expects move objects: Moves list, move detail, Fakémon selectors, species move links, trainer Pokémon learned moves, and relevant stat calculations.
* Support both 2018 and 2024 editions and preserve native filtering, sorting, navigation and links.
* Keep definitions available on fresh loads, direct deep links, client-side navigation, editor entry, refresh, and post-save rendering.
* Prevent late initialization or changes to the fetch interceptor from removing definitions that are already referenced by saved Pokémon.
* Integrate with native move-store caching without redundant requests, competing interception layers, or repeated DOM reconstruction.
* Preserve behavior of canonical Pokémon and ordinary moves when the custom registry is unavailable.

Implementation recommendations

* Trace actual native dependency paths before altering code: MovesSrdClient / MovesStore (including srdStore edition caching), server-provided Moves listings, per-ID detail loading, and species/trainer move consumers.
* First instrument whether the definition is present at each native lookup point. Compare direct entry, refresh, and same-page navigation, and determine why the prior probe reported fetchPatchActive: false.
* Investigate whether early, reliable SRD response injection can populate the cached MovesStore for all consumers; verify rather than assume late response interception updates an already-settled store.
* Account separately for the server-rendered Moves-list fallback and the per-move detail route; successful insertion into one list does not prove complete registration.
* Keep one shared registry and one coordinated injection mechanism, rather than maintaining multiple shadow catalogs or late compensating observers.

CM-WORKFLOW — In-place authoring and Fakémon editor continuity

Status: Planned.

Requirements

* Allow creating a custom move while editing a Fakémon without discarding its unsaved changes, losing its active identity, or closing its editor.
* Saving or cancelling the move editor must return to the same active Fakémon editing context; newly saved moves should be immediately selectable.
* Support opening the custom move editor from the Moves view independently of a Fakémon.
* Improve new Fakémon creation by transitioning from successful initial creation directly to the full edit view.
* Preserve established navigation, native controls, and mobile/desktop interaction conventions.

Implementation recommendations

* Use a script-managed in-page dialog/panel attached to the current view rather than navigating to /moves/custom while a Fakémon form is open.
* Keep the existing Fakémon editor and its state mounted; preserve unsaved fields, active selection and scroll position.
* Commit the new move to the registry before adding its ID to the current learnset. On cancel, do not mutate the learnset.
* Hook the successful native create result for the create-then-edit transition; do not fabricate a new Fakémon or preemptively navigate before its real read key exists.
* Test dialog return, validation errors, save failures and mobile keyboard/viewport behavior.

CM-SAFETY — Missing move recovery and data integrity

Status: Ready for investigation; destructive regression reproduced and Gummiglo restored.

Requirements

* A missing or invalid custom move definition must not make a Fakémon or trainer Pokémon inaccessible or uneditable.
* Preserve the saved move ID visibly as a recoverable unresolved reference when its definition cannot be loaded.
* Allow safe removal or repair of an unresolved reference without discarding the species' other moves, abilities, notes, artwork or stats.
* Never write a custom move ID into a production Fakémon until the corresponding definition can be resolved in the relevant native consumers.
* Provide a verified backup/rollback path for library edits and learner changes; no broad localStorage deletion or partial database RPC update.
* Diagnose root causes and remove failed experimental interception code rather than stacking timers, redraws or shadow replacement cards.

Implementation recommendations

* Specifically audit src/lib/pokemon/move-pool/MovePoolGroupFields.svelte: it can pass undefined after moves.find(); MoveOption.svelte immediately reads value.id. This source-supported failure mechanism matches the observed undefined-id crash, but production stack attribution is not yet proven.
* Design an unresolved-move display/removal state for both information and editing views; block destructive saves until all other data can be preserved.
* Keep a record-level backup and verify the complete payload before invoking native update_fakemon, which expects a full record rather than a partial move-array patch.
* Run all persistence experiments on disposable Fakémon; preserve an exact targeted recovery procedure and verify successful reload after rollback.

CM-ACCEPTANCE — End-to-end custom move verification

Status: Planned; partial exploratory browser evidence only.

Requirements

* Prove create → save → list → detail → assign → save Fakémon → refresh → reopen → edit → unlearn works without crashes.
* Verify the move remains in the global library after every learner unlearns it or is removed.
* Verify a second browser/device can discover the library and consistently render the move after refresh.
* Test fresh deep links, both rules editions, native list filtering, per-move routes, Fakémon creation, existing Fakémon editing and trainer Pokémon move presentation/calculations.
* Verify failure and recovery when the library is unavailable, the cache is stale or the move definition is missing.
* Regression-test mobile Safari and desktop, with and without unrelated QoL/Species Card/Theme/Artwork Intelligence scripts where relevant.
* Keep implementation, testing and user browser acceptance distinct; do not mark Accepted solely because an injector displays a move once.

Implementation recommendations

* Sequence development as: (1) instrument lookup and failure timing, (2) prove safe native definition availability, (3) add recoverable missing-ID handling, (4) implement versioned library and synchronization, (5) build in-place editor/workflow, (6) test saved references and cross-device operation.
* Keep an independently removable proof-of-concept injector and maintain a disposable test Fakémon until the end-to-end test passes.
* Capture reproducible console evidence, native request paths, supported/unsupported move fields, and exact tested userscript versions.

Exploratory evidence (not an accepted implementation)

* A temporary yofi-injection-probe definition appeared with native styling in the Moves detail interface and Fakémon move selector. The probe logged two list injections, two detail requests, and zero injection failures across 2018/2024 data requests.
* Saving that move ID to Gummiglo's learnset made Gummiglo inaccessible. Removing only yofi-injection-probe from its stored move arrays restored it.
* The saved ID was accepted by the Fakémon persistence pipeline; the failure occurred on subsequent client use/rendering. Source inspection identifies a possible undefined lookup dereference in MovePoolGroupFields → MoveOption. The precise production lookup/timing failure has not yet been instrumented.
* Native CustomMoves is currently an incomplete editor preview. Native MoveCustomization persists per-trainer-Pokémon overrides and is not a global definition store.
* No production custom-move userscript or shared custom-move library has been implemented or accepted.


⸻

EVOLUTION — Species Names and Evolution Sections

EVO-GENDER — Gender symbols in plain-text names

Status: Ready; existing decorator requires verification and correction.

Requirements

* Apply established gender-symbol alignment to plain-text species names in evolution sections.
* Cover headings and descriptive text, not only links, search results and navigation titles.
* Preserve matching SVG geometry, size, baseline and spacing.
* Use the existing QoL gender decoration infrastructure wherever possible.
* Survive asynchronous native text replacement without duplicating symbols.
* Preserve the native text content and accessibility.
* Avoid unnecessary observers or repeated decoration work.

Existing implementation: QoL contains decorateEvolutionSexNames(). Its actual execution and coverage remain to be verified.

⸻

DETAIL — Species Information Region

STATS-01 — Content-driven layout grammar for Speed, Senses, Skills, Saves and type effectiveness

Status: **Restored requirements; Ready for a new implementation candidate.** Earlier v0.12.19/12B.19 exploration yielded useful compact/fit behaviors, but the precise 12B.19 source is not the current implementation and must be compared if recovered. Current v0.1.27 Species Card still measures and scores **18 predefined `adaptiveLayouts` trees**, with occasional special cases, and keeps visible `None` placeholders. Preserve useful measured/visual outcomes, not that fixed catalog.

Requirements

* Cover **Speed, Senses, Skills, Saves, Weak To, Resists and Immune** as real semantic fields, with type-badge groups and each movement mode/sense eventually represented by independently measurable icon/value cells. Preserve native source records and meaningful accessibility labels.
* **Suppress semantically absent/`None` Stats fields as visible rows and layout footprint**, not merely dim their text; do not hide meaningful zeroes, a real value, or a field for which data is not yet loaded. The prior 18-layout catalog's “show smaller `None`” behavior is historical and superseded by this design direction. Preserve the underlying data for editing/accessibility as appropriate.
* Missing Senses must consume no track height or reserved space. Permit presence/absence of fields to shape the grammar directly; never manufacture a blank field to force a chosen layout template.
* Generate legal row/column/group arrangements from **content and measured geometry** rather than maintaining a lengthy enumerated A–S/T catalog. Use bounded grammar operations and prune invalid groups early; do not blindly enumerate every permutation or replace the old catalog with more static templates.
* Allocate intrinsic label/icon/value requirements first; distribute remaining width purposefully. Consider single-line Speed/Senses and effectiveness rows, balanced badge wrapping, aligned labels/continuation values and minimum viable horizontal gaps. Badge counts and actual rendered glyph widths govern columns; avoid arbitrary fixed column thresholds.
* Score actual rendered section height, unused space, row wraps, visual cohesion (especially effectiveness groups), overflow safety and useful information visible in the **whole card**. Favor meaningful compactness, not density that sacrifices readability. At fixed usable height/state, wider-panel choices must not expose less semantic information above the fold.
* Permit details to remain below the hero by default or move *selected semantic groups* into legitimately unused hero space when the global calculator finds an improvement. Such relocation is not a prerequisite or reward; avoid duplication, missing entries and state ownership changes.
* Build/evaluate icon and text variants using the final intended font, SVG size and cell spacing **before** selecting their arrangement. The same semantic components and grammar must work on iPhone compact cards and larger screens without feature-specific native/promoted forks.
* Keep icon design/selection under DETAIL-CELLS, DETAIL-SPEED, DETAIL-SENSES and DETAIL-EFFECTIVENESS; coordinate STATS-01 with HERO-VITALS-CELLS and HERO-FOUNDATION. Final whole-hero scoring comes after the components have stable measured sizes.
* Preserve v0.12.x successes where verified: no unnecessary blank Senses, accurate type glyph sizing, sensible badge columns, comfortable Speed/Skills/Saves wrapping, and good use of width. Do not canonize old catalog letter names as permanent layouts.

Acceptance: short and long movements; multiple/single/no senses; zero versus None versus populated effectiveness; extensive badge lists; compact/mobile, iPad split and desktop; widths swept monotonically at fixed panel height; Light/Dark/Type; native list/card navigation; no overflow, missing fields, excessive sections, oscillation or regressions when the icon variants become available.


DETAIL-CELLS — Reusable icon/value-cell grammar

Status: Design direction agreed; build and final artwork selection pending.

Requirements

* Treat each speed mode and, if individual-sense icons are adopted, each sense as an independently measurable **icon + numeric value cell**. This remains true in compact rows, wider multi-column placements, promoted regions or a shared/background bar. Promotion changes cell arrangement, not what constitutes a cell.
* Permit cell tracks, row/column gaps, shared containers and wrapping to respond to actual content and available component dimensions rather than fixed viewport thresholds. Avoid artificial mandatory stages.
* Keep the visible numeric values exact. Preserve full descriptive names, measurement units and meaning in accessible text and appropriate title/tooltip/expanded labels even when visible labels disappear.
* Establish common sizing, SVG optical alignment, spacing and density conventions after candidate icon artwork is selected; do not pre-approve uncertain icons solely because a generic glyph exists.
* Reuse existing native semantic data and DOM where feasible. The layout fitter must evaluate final icon/cell geometry before committing to placement; do not replace measured text with icons in a later pass.
* Start implementation with HERO-VITALS-CELLS alongside STATS-01 so final cell geometry and Stats placement are measured coherently before extending to movement or senses.

DETAIL-SCALE — Wide-card information readability

Status: Discussing; shared icon/value-cell architecture agreed.

Requirements

* Scale Speed, Senses, Skills, Saves and effectiveness information as card space increases.
* Scale typography, icons, spacing and type badges coherently, including the final icon-based presentation rather than obsolete text-label measurements.
* Preserve readable proportions and alignment at narrow widths.
* Make the layout fitter evaluate the content at its final intended scale and cell geometry.
* Prefer card/content geometry over arbitrary viewport breakpoints.
* Avoid leaving unusually small detail typography beneath a large hero.
* Honor the nondecreasing visible-semantic-information requirement of HERO-FOUNDATION as card width grows at constant usable height, rather than trading visible detail rows for larger art or whitespace.
* Explore alternative tracks/wrapping and possible conditional promotion into genuinely free hero space only after component content and measurements are stable; never mandate a specific promotion solely because icons are present.

DETAIL-SPEED — Movement icons

Status: Cell semantics and visible-unit rule agreed; SVG choice and visual acceptance pending.

Requirements

* Represent each existing movement speed as its own icon/value cell rather than a single Speed category icon. Cover walking, swimming, flying, climbing, burrowing and hovering without altering native semantics.
* Prospective visual metaphors (not approved final SVGs): shoe for walk; ripples/water/fish for swim; wing for fly; vine/hand for climb; shovel for burrow; UFO for hover.
* Show each mode's numeric movement distance with **no visible “ft” suffix**; feet are currently implicit under Poké5e's D&D movement rules. Retain exact distances, full mode names and feet units in accessible metadata. No mechanics/data conversion.
* Remove redundant visible individual mode words once the final icons are chosen and visually verified; choose legible fallback labels for any mode whose artwork remains ambiguous.
* Movement icon/value cells can flow side by side, wrap, use grid tracks or share a subtle container regardless of whether they are in native details or a promoted region. Keep icon and its value together.
* Select and inspect actual SVG shapes, stroke weight, optical height and consistency before committing to label-free visual presentation.

DETAIL-SENSES — Sense identification

Status: Discussing; individual icon artwork and label removal not approved.

Requirements

* Consider darkvision, blindsight, tremorsense and truesight individually. A generic eye icon for the entire Senses category was an earlier fallback, not a settled final solution.
* Desired direction is potentially label-free **sense icon/value cells**, but the symbols are harder to distinguish; inspect previously explored SVG candidates or create a comparable set, then test at intended small sizes before hiding the sense names.
* If individual icons prove recognizable, each sense/distance remains its own independent measurable cell and uses DETAIL-CELLS layout rules. Otherwise keep meaningful text labels alongside a generic category marker; do not trade mechanical clarity for visual density.
* Preserve full sense labels, exact distances and accessibility in either treatment.
* Preserve the existing rule that missing Senses must not reserve blank layout space; do not invent a sense icon for absent data.

DETAIL-EFFECTIVENESS — Weakness, resistance and immunity presentation

Status: Discussing; candidate symbols and responsive badge concept identified, final SVGs and behavior pending.

Requirements

* Explore a compact visual relationship marker for each of Weak To, Resists and Immune using the proposed **target, triangle and X** symbols. The earlier workboard candidate associates target with Weak To, triangle with Resists and X with Immune; verify that mapping explicitly during actual icon review rather than treating the icon order as final approval.
* Preserve accessible descriptions and the true effectiveness relationship independently of visual badge treatment.
* Explore scaling the **existing native type glyph badges** up at certain measured card/panel widths, keeping their canonical type colors. Consider removing the small letter/name cell only when a larger SVG remains identifiable; do not unconditionally delete that information in compact layouts.
* Compare compact icon/badge rows, larger symbol-dominant treatments and potentially a shared effectiveness strip; decide placement through actual available geometry rather than a fixed breakpoint.
* Explore conditional promotion into unused hero space only after component fit and the hero-selection lifecycle are reliable. Do not duplicate native type badges or preempt other higher-value hero content.
* Preserve a consistent icon scale, optical alignment and visual hierarchy between the relationship marker and nearby type badges, without assuming they must be the same physical size.

⸻

PRESENTATION — Loading and Continuity

PRES-FIRST — Correct first presentation

Status: Readiness policy selected in principle: offline original-portrait geometry plus Fakémon edit-time analysis, with bounded first-reveal waiting for truly uncached portraits; target Safari lifecycle and fallback timing unverified.

Requirements

* Show established type-theme colors (no artwork color scan) and subject-aware composition **on the first visible card frame** wherever compatible original offline geometry or Fakémon cached/edit-time analysis is ready.
* No mid-view color changes, layout shifts or geometry corrections after the user sees the card.
* Preserve the existing real-list-to-ready-card handoff. Never show an empty interval or substitute card merely to conceal loading.
* Prefer manifest lookups for original Pokémon and editor-triggered analysis on Fakémon portrait selection. Use bounded specific-card waiting, cached results and optional measured prefetch only when needed; do not introduce a general original-Pokémon scanner during navigation.
* Revalidation changes discovered while viewing a card apply to its next presentation, not as an immediate visible repaint.
* Color assignment is static or creator-selected and does not depend on geometry; coordinate available compatible geometry and final layout decisions before first reveal.

**Selected direction, not yet tested:** brief bounded delay of the incoming, not-yet-visible card when Fakémon geometry is truly uncached, retaining the current list/card until a valid layout or safe fallback is ready. Original Pokémon use versioned precomputed geometry. Determine actual Safari timeout/error policy before implementation; never block indefinitely or hide a visible card.

PRES-ATOMIC — Analysis and presentation synchronization

Status: Planned; not integrated.

Requirements

* Publish each complete, successful color or geometry product coherently; do not require their calculations to finish together.
* Assemble one compatible presentation snapshot for the selected species before the card becomes visible, including compact layouts and final icon/value component dimensions. Preserve existing card readiness and live DOM continuity.
* Prevent late results for an outgoing species or a subsequent source revision from affecting the current card.
* Retain last-good presentation during refresh validation and transient analysis failures.
* Do not cause a second visible theme or hero-layout pass merely because a background analysis finishes.
* Coordinate the initial application of color/geometry/auto-corner metadata with existing card readiness, honoring source identity and current layout measurements.
* Avoid competing lifecycle observers, card-reconstruction machinery and compensating redraw loops.

PRES-REGRESSION — Card and shiny-transition continuity

Status: Ready for regression testing.

Requirements

* Preserve the existing ready-card list handoff and adjacent-card preparation behavior.
* Avoid empty gaps between a list result and its detail card.
* Avoid collapsing panel heights, disappearing sections and mismatched bottom edges.
* Prevent momentary oversized artwork, black image outlines and shiny-transition flashes.
* Preserve native navigation and normal/shiny interaction.
* Investigate lifecycle and geometry causes rather than conceal symptoms with placeholders, delays or redraw loops.

PRES-ABILITY-SPACING — Intermittent excess vertical space within or after Abilities

Status: Ready for investigation and corrective work; multiple Safari screenshots supplied, underlying cause(s) unconfirmed.

Observed behavior and corrected scope (2026-10-16)

* Mawile: with identical userscripts before/after refresh, one capture shows a large gap between the regular ability Intimidate and the final Hidden ability Sheer Force; the other shows natural spacing. This proves an intermittent excess gap in one inter-ability position.
* Aegislash (#0681): a separate Safari screenshot shows a conspicuous gap AFTER its ordinary Stance Change ability and BEFORE the Evolution heading. No Hidden ability appears. The report broadens the defect beyond Hidden labels and beyond a gap before the last ability.
* Treat the general defect as abnormal spacing around Abilities entries and section boundaries. The screenshots do not yet establish whether the Mawile and Aegislash cases share the same underlying cause; do not force one diagnosis onto both.
* The six STR/DEX/CON/INT/WIS/CHA ability scores are not the affected text entries. The defect concerns the Pokémon ability descriptions/section and their surrounding layout.

Investigation and corrective requirements

* Capture live DOM rectangles, computed margins/padding/height, display/flow/flex/grid properties, pseudo-elements, surrounding section heights and sibling positions in both normal and oversized states. Check the actual gap location, not just the last ability element's own margin.
* Compare all relevant paths: native `AbilityPoolInfo.svelte` output, Species Card's reparenting/promotion/restoration, QoL's grouping of Hidden paragraphs (when present), Theme's appearance rules, native Svelte content updates and measurement clones. The Hidden wrapper is one possible contributor to the Mawile case, not a universal explanation.
* Specifically check the final regular `.ability` element, `section.abilities` height and margins, next `section.evolution` or other section heading, any fixed/min-height or space distribution, stale layout styles, and browser margin collapsing. Measure whether apparent whitespace is internal to Abilities or belongs to the following section.
* Determine whether layout-selection state, route transitions, promoted/native ability placement, font/image readiness, or extra preserved dimensions cause the discrepancy; distinguish multiple causes if evidence requires it.
* Correct verified source behavior only: retain original ability descriptions, their natural wrap and intended entry spacing; remove stale/obsolete CSS or geometry machinery where responsible. No arbitrary fixed spacers, masking, late corrective repaint, delay or compensating observer.

Acceptance and regression

* Mawile: consistent normal Intimidate-to-Sheer Force spacing before and after refresh and across navigation.
* Aegislash: natural Stance Change-to-Evolution spacing with no Hidden ability; compare its behavior across narrow split-pane, fullscreen and refresh.
* Include species with one normal ability, several normal abilities, a Hidden ability, and no Hidden ability. Validate the Abilities-to-next-section boundary and internal spacing in Light, Dark and Type, promoted and unpromoted layouts, first load, back/forward and resize.
* No missing/duplicated ability text, displaced sections, layout flicker or new excessive whitespace. Do not mark resolved until browser acceptance.

⸻

OPS — Development and Acceptance

OPS-OWNERSHIP — Cross-script responsibility boundaries

Status: Ready; ongoing engineering constraint.

Requirements

* QoL owns navigation, shiny controls, relevant native enhancements and application-level interactions.
* Species Card owns hero composition, responsive card geometry and placement.
* Theme Overlay owns theme-dependent presentation.
* Artwork Intelligence owns normal-artwork geometry metadata and analysis, not visual type-color choices.
* Preserve all established standalone behavior; Artwork Intelligence enhancements must degrade safely when absent.
* Prefer using existing native site elements and state.
* Remove dead selectors, observers, caches, functions and compatibility machinery when a feature is replaced.
* Avoid duplicate calculations, repeated DOM reconstruction and competing state owners.

OPS-VERIFICATION — Development branch and regression discipline

Status: Ready; ongoing engineering constraint.

Requirements

* Inspect the latest branch files and relevant native Poké5e source before each code change.
* Trace reported defects to their actual cause before designing a correction.
* Keep main as the approved baseline.
* Make focused changes on authorized development branches.
* Commit logically separable implementation work with traceable messages.
* Syntax-check and run targeted regressions.
* Regression tests must verify retained production behavior; retire tests and reference gates that exclusively serve removed subsystems, while preserving frozen historical data needed for explicit algorithm comparisons.
* Test all three themes, Pokémon/Fakémon, mobile and desktop layouts, loading transitions, and independent script operation where relevant.
* Explicitly separate automated tests, headless browser results and user-device verification.
* Deliver the exact commit/build selected for installation and browser testing.
* Do not mark an item Accepted merely because code was committed.

⸻

Implementation record

Current experimental branch: `dev/artwork-geometry-2026-10-17` (created from `main` after the restored Workboard snapshot). Archived restoration branch: `dev/hero-restoration-2026-10-14`. `main` contains the approved three-script baseline. Branch/commit status must be verified before any future write.

ART-02-R01 implementation baseline: 3c82480ec9ef8bf4d547c3df40228800362bfcd7

Prior workboard alignment referenced dev HEAD 236b6095fa9d99c1dadb4959b268b11d95d9ec77. This palette/assignment planning revision was prepared against dev HEAD e4eb9249daef3fc29f65b429db982fb41f717740. Branch comparison and current HEAD must be checked live before any code edit; historical counts are not treated as current.

Existing restoration commits

* 73938645 — Restore promoted Abilities banner geometry and 25%-grey Light-theme vital contrast.
* 27dc4078 — Correct native promoted styling targets; subsequently change Light-theme vital and egg surfaces to 15%.
* 68a38892 — BIO-01-R01: Responsive biology bars, shared egg presentation and minimum-level notation.
* 5f50ab51 — BIO-01-R01 follow-up: Preserve noncanonical minimum-level values.
* 68995ef4 — BIO-01-R02: Single-line Egg fitting and coordinated gender scaling.
* 7687f361 — GEO-01-R01: Page-footprint layout selection, added biology arrangements and promoted score sizing.
* f79be54c — GEO-01-R02: Independent hero promotions and compact Egg styling.

These are committed implementation candidates; their presence does not establish final browser acceptance.

Artwork Intelligence implementation

ART-01-R01: Architecture and reference test foundation established.

ART-01-R02: Foundation implementation and validation reported complete.

ART-02-R01: JavaScript analyzer candidate committed at 3c82480. Not yet accepted as the final production implementation.

The ART-02 report records successful Python/JavaScript parity tests, synthetic and real-image validation, and local Chromium checks. Live Poké5e acquisition, real-origin persistence, Safari behavior and consumer integration remain unverified.

Current approved implementation/pilot record — 2026-10-17

* `main` and active dev inherited QoL v0.13.4, Species Card v0.1.27 and Theme Overlay v0.3.50 from approved snapshot/oscillation-fix history. The first restoration branch remains an archive rather than an integration base.
* Species Card v0.1.27 corrected detached copy-measurement padding and candidate wrapping based on Work-mode Nosepass (~475px) and Croconaw (~622px) Chromium traces. Exact post-correction Safari regression remains outstanding.
* Offline subject-geometry baseline: 1,139 archived Poké5e normal PNGs, 1,433 exterior contours; archive revision/current live coverage and contour collision fidelity not fully validated. These local analysis artifacts are not deployed source data in `main`.
* Temporary v0.1.27-bbox.1 Safari A/B test is **not the active repository baseline**. Screenshots support promoted-layout subject-bound fitting and reveal negative-space/scroll regressions; unchanged narrow Makuhita indicates missing compact-path integration.
* The historical Stats system still has an 18-layout catalog and visible `None` handling. Recovered STATS-01 expresses intended next outcomes, not completion or proof that the precise older 12B.19 source has been restored.

Accepted Theme Overlay milestone — 2026-10-17

* **Theme Overlay v0.3.50 BackgroundType + Type Palette is explicitly user-accepted and committed on dev.** Commit 41179f9a contains exactly the accepted v0.3.50 file, verified by matching Git blob SHA 2f482191b94a525d42ef0644c09e703ae5a93481.
* Includes the user's authoritative 613 original dual-type species/form `backgroundType` selections, with backgroundType → tint, the other type → banner, and no pairing-specific transformations.
* The CSS groups all 18 types' mixing percentages together **above** the 18 individual derived-type color blocks. Previous percentage values were not retuned; banner and move treatments share the light mix initially.
* Reported local candidate verification: JavaScript syntax, 613 IDs and valid typings, and Chromium fixtures for representative species, themes, and dynamic canonical-color changes. Live iPad Safari verification was **not independently recorded**; do not imply it was.
* **GitHub `main` now contains the exact user-approved Theme Overlay v0.3.50** after the separately authorized clean three-script snapshot promotion. The original dev commit 41179f9a documents the accepted source's history. Fakémon creator-selected backgroundType persistence and ART geometry integration remain incomplete.

Current integration state

* Artwork Intelligence ART-02-R01 exists as an **archived experimental** fourth userscript on the original restoration branch, not among the three supported standalone `main` scripts.
* Current QoL, Species Card and Theme Overlay do not yet consume its geometry results. Runtime ART color scanning is now obsolete by design.
* GitHub `main` contains the **user-accepted Theme Overlay v0.3.50** and its 613 reviewed `backgroundType` choices and derived type palette. Version promotion to `main` is documented; do not infer iPad installation or acceptance of unrelated geometry code.
* Theme/biology restoration and historical ART experiments remain traceable on the archived restoration branch. Current `main` and the new active dev branch intentionally exclude the unfinished ART userscript; the subject-bound A/B experiment was delivered separately as an optional temporary Species Card replacement.
* The current branch is not equivalent to an accepted production release.

Next work: (1) unify compact/native-like and wide layout geometry, including the already-tested subject rectangles and shared-height biology; (2) restore STATS-01's content-driven grammar and establish reusable vital icon/value cells; (3) select and implement movement/senses/effectiveness variants; (4) tune whole-hero artwork sizes, balanced lower edges, negative space and **nondecreasing visible information with width** using final measured components; (5) integrate validated exterior contours for clearance and optional overlap. In parallel, verify offline normal-artwork geometry coverage and design Fakémon select-time analysis/save-time publication. Keep unfinished code off `main` until explicitly approved. Fakémon creator-selected backgroundType editor persistence remains a separate pending task. No new original-Pokémon color algorithm or pair-specific mixing is authorized.

⸻

Completion rule

A work item is marked Accepted upon explicit user acceptance of the implemented feature with relevant verification documented. Distinguish accepted standalone builds from code committed or deployed to GitHub; do not claim browser tests that were not actually witnessed.

Items may be reopened if subsequent testing reveals defects or regressions.

Working artifact: This workboard is a living development tracker, not an authorization to edit code, merge branches or deploy changes.
