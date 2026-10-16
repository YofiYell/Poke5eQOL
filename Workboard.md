Poké5e — Development Workboard

Purpose: Track approved, planned and exploratory development work. This is not a complete app specification.

Status vocabulary: Discussing · Planned · Ready · In Progress · Implemented · Testing · Accepted

These are working development candidates. Presence in GitHub does not establish browser acceptance.

⸻

ART — Artwork Intelligence

Agreed scope for the present Fakémon phase

* Analyze normal/main portrait artwork only. Never analyze shiny artwork for either color or geometry.
* Produce useful subject geometry for **all Fakémon**; perform theme color selection **only for dual-type Fakémon**. Monotypes retain their existing styling.
* The aim is correct **initial** presentation, not mid-view corrections. Keep color and geometry computations independently useful, while reusing source acquisition and decoding when possible.
* ART-02-R01 is a working implementation candidate, **not** authority to retain unnecessary algorithms, masks, or tests. The requirements below take precedence when the candidate differs from them.
* Keep original Pokémon artwork decisions unchanged. The desired future original-Pokémon equivalent is offline-derived and deferred.

ART-COLOR — Dual-type color selection

Status: Discussing scoring optimization; existing Python-parity JavaScript candidate available.

Requirements

* Analyze only the normal/main artwork of dual-type Fakémon for **one purpose**: select which of the two established Scarlet/Violet type colors best matches the actual character's predominant/average color.
* The selected closer type supplies the banner; the other supplies the tint. Retain the existing tint/banner styling strengths until separately reviewed.
* Preserve existing monotype styling and all original Pokémon assignments.
* Substantially reduce the user-observed ~569 ms full-color scan cost, with measured attribution to decoding, weighting, distance transform, clustering, worker overhead and other stages; do not assume every stage is necessary.
* Compare inexpensive alternatives such as direct two-type comparison using a sampled perceptual mean or sampled majority of subject colors against the existing Python v1.0.0 decisions and representative **real** Fakémon artwork. A histogram is an option, not a decided prerequisite.
* Test actual decision quality and speed, especially mixed hues, large neutral regions, outlines, transparent backgrounds and near ties. Do not silently change established selections or claim numerical parity for a replacement algorithm.
* The current Python-equivalent scanner remains a comparison baseline until a production scoring algorithm and acceptable differences have been expressly selected; it need not remain runtime work if a simpler method is approved.

Unresolved: Final color scorer, sampling/weighting choices, accepted differences from Python selections, and measured performance target.

ART-GEO — Subject geometry

Status: Existing full-canvas mask candidate implemented; required exterior-contour implementation **not yet complete**.

Requirements

* Analyze normal/main artwork for **all Fakémon**, including monotypes, independently of whether a color decision is needed.
* Determine whether transparent alpha provides a usable subject/background separation; expose a simple usable-transparency Boolean and appropriate diagnostics.
* Compute actual visible subject bounds rather than fitting the usually-square natural canvas. Validate which alpha threshold represents visible artwork without losing meaningful fine details.
* Trace and retain faithful **exterior** subject outline paths, including narrow extensions and detached pieces. Do not simplify away details needed to protect other card content.
* **Interior holes are not required** for overlap decisions or stored contour data; do not compute/persist them merely to satisfy the old ART-02 mask contract.
* Do not require a permanent full-canvas bitmask or pixel-by-pixel affine collision engine when exterior contours meet the production needs. A temporary pixel mask used during accurate outline extraction is acceptable.
* Map outline coordinates to the actual rendered scale and position for lightweight contour/rectangle clearance tests; do not repeatedly inspect individual source pixels when placing the shiny control.
* If subject isolation is unreliable (for example an opaque background), retain dependable existing fitting/placement behavior without speculative segmentation. Color selection may still work for dual types.

Retire obsolete packed-mask, interior-hole and per-pixel collision runtime paths and tests when a verified replacement makes them unnecessary. Preserve tests that validate the retained exact exterior-outline behavior.

ART-PREFETCH — Anticipatory analysis

Status: Planned; three-priority scheduling approach agreed in principle, not yet implemented.

Requirements

* Produce artwork metadata **before a card is clicked whenever possible**, so its initial colors and geometry are ready on first reveal.
* Access species read keys directly from the native Fakémon list without opening each detail card; resolve normal portrait URLs and ordered types through the existing read-only `get_fakemon` pathway.
* Use **one bounded, deduplicating priority queue**: (1) pointer hover/dwell, keyboard focus and feasible touch intent; (2) previous and next entries in the actual list order while a card is open; (3) idle warming of uncached Fakémon from the list.
* Promote an already queued job rather than creating a duplicate. Keep scan and fetch concurrency conservative, prioritize interaction, and suspend/defer low-priority work during active loading or resource pressure.
* Avoid repeatedly validating or scanning unchanged artwork in one session. Prefer reusing existing native/QoL response work where safely available, without making ART depend on QoL.
* Preserve normal card/list responsiveness and avoid eager site-wide bulk scanning when no relevant Fakémon list/context has been entered.
* Confirm real list lifecycle, read-key extraction, network/CORS behavior and queue effectiveness in a target browser; no native detail-card opening is required for artwork retrieval.

Open implementation details: exact event attachment to the list, idle budget, concurrency limit and touch behavior. These are to be measured rather than guessed.

ART-CACHE — Persistent analysis records

Status: Initial IndexedDB/snapshot candidate implemented; real-browser acceptance and streamlined schema outstanding.

Requirements

* Use the existing species ID alone as the lookup identity within its namespace; source URL, source hash, ordered types and analysis versions remain record metadata.
* Cache successful normal-artwork geometry for every Fakémon; cache color decisions only for dual types.
* Keep color and geometry independently ready and reusable, but coordinate **one stable card presentation** from whatever validated outputs are available at reveal time.
* Reuse previous successful results without unnecessary rescans. Revalidate authoritative normal artwork on the first relevant visit after refresh while keeping last-good data.
* Recompute only an invalidated/changed analysis product; preserve last-good metadata on failure, interrupted requests and storage denial.
* A changed successful analysis should not recolor or reposition a card already being viewed; apply new decisions at a subsequent coordinated presentation.
* Avoid recomputation from shiny toggles, viewport resizing, theme changes or routine same-session navigation.
* Migrate away from obsolete mask records/diagnostics and tests only when the new contour format and compatibility path are verified. Keep synchronous snapshots small and canonical persistent records in IndexedDB.

ART-MODULE — Standalone Artwork Intelligence userscript

Status: Implemented; integration and browser acceptance outstanding.

Requirements

* Keep Artwork Intelligence independent of QoL, Species Card and Theme Overlay.
* Own artwork acquisition, analysis, records, geometry data and recommendations.
* Expose a versioned, read-only public API for consumers.
* Do not independently modify cards, shiny controls, theme styles or navigation.
* Permit existing scripts to initialize and operate without Artwork Intelligence.
* Support consumers starting before or after Artwork Intelligence.
* Avoid competing image decoders, full-page observers and duplicate analysis machinery.
* Preserve an independently buildable and testable module.

Current implementation: ART-02-R01 introduced the fourth userscript and its public API.

ART-SOURCE — Authoritative normal-artwork acquisition

Status: Implemented; live-browser verification outstanding.

Requirements

* Resolve Fakémon normal portrait metadata from the native get_fakemon source.
* Never infer the analysis source from the currently displayed portrait, which may be shiny or another variant.
* Keep acquisition read-only and independent of QoL’s private portrait functions.
* Deduplicate Artwork Intelligence’s own metadata requests and in-flight analysis.
* Measure any duplicated network work shared with QoL before attempting cross-script optimization.
* Reject mismatched species identities and stale navigation results.
* Do not block native card rendering while acquiring artwork.

Current implementation: ART-02-R01 includes an independent acquisition coordinator.

ART-INTEGRATION — Shared analysis consumers

Status: Planned; no consumer integration committed in ART-02-R01.

Requirements

* Theme Overlay consumes validated dual-type Fakémon color decisions; monotypes and original Pokémon keep their existing styling.
* Species Card consumes reliable visible bounds, exterior outlines and effective composition bounds for hero scaling/positioning and decorative overlap.
* QoL consumes optional shiny-icon corner recommendations without relinquishing the button or manual preferences.
* Color and geometry may analyze, finish and persist **independently**; neither analysis product must wait for the other merely to become available.
* The **card presentation** is nevertheless coherent: select compatible completed results before first reveal, use them without a visible second-pass color or layout change, and freeze that presentation while the card remains on screen.
* Reject outgoing-species, stale source, mismatched types and incompatible analysis revisions. Keep last-good results during background revalidation; apply newly changed decisions on a future presentation.
* Existing script owners retain all display, interaction and styling responsibilities. Consumers do not fetch or reanalyze source pixels separately.
* Preserve normal standalone behavior when Artwork Intelligence is absent, incomplete or unsuccessful, without hiding loading defects with replacement cards or corrective flashes.

The cold direct-link / immediate uncached-click policy is **unresolved**, because instant correct first paint cannot be guaranteed before the required information exists.

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

* Separate and profile native metadata retrieval, image transfer, decoding, geometry extraction, color scoring, hashing, worker transfer and storage writes.
* Keep expensive analysis off the UI thread wherever supported; verify Blob-worker behavior in the actual userscript extension/iPad Safari environment.
* A worker-denied main-thread fallback must not cause an uninterrupted large UI stall. Measure any fallback and implement safe scheduling without delaying native card presentation.
* Avoid decoding twice, competing scanners, excessive RGBA copies or retaining per-species temporary buffers after analysis.
* Test inexpensive **candidate** color scorers against real-image quality, speed and the original Python reference; full-resolution Python parity is the existing candidate's baseline, not automatic authorization to retain unneeded production work after a scoring change is approved.
* Preserve pixel-faithful exterior contours at whatever representation is chosen; do not claim approximate geometry is exact.
* Report unsupported formats, decoding and color-management differences. Distinguish actual Safari measurements from desktop/Node or calculated memory proxies.
* Remove retired production algorithms, masks, caches, worker code and tests rather than keeping them running or maintained for hypothetical reuse.

Current implementation: ART-02-R01 includes a Blob worker and same-bundle fallback; actual Safari timing/persistence is unverified.

ART-ORIGINAL — Future original-Pokémon metadata migration

Status: Discussing; deferred.

Requirements

* Eventually provide offline-generated artwork metadata for original Pokémon.
* Preserve the existing 613 dual-type artwork assignments until an approved migration is verified.
* Do not browser-scan original Pokémon as part of the current Fakémon implementation.
* Support compatible geometry, color and icon metadata without changing existing original-Pokémon styling.
* Consolidate redundant metadata and lookup machinery only after the replacement is validated.
* Do not retain permanent duplicate authorities for the same artwork decisions.

⸻

HERO — Hero Layout

HERO-IMAGE — Subject-aware artwork fitting

Status: Planned.

Requirements

* Fit, center and scale artwork using actual visible subject bounds instead of transparent canvas margins, while retaining the complete original artwork source.
* Use accurately extracted normal-artwork exterior contours to allow suitable decorative extension into empty neighboring hero space.
* Protect HP values, labels, controls, hit targets and stacking from subject-outline overlap.
* Use the uniformly **expanded effective composition bounds** when automatic shiny placement has required expansion; otherwise use the original content bounds.
* Work with the actual rendered artwork transform and existing content-driven hero grammar, not a new catalog of fixed layout permutations.
* Maintain a dependable fallback for opaque or unavailable geometry, preserving existing hero behavior.
* Avoid layout jumps, transient oversized artwork, unnecessary DOM reconstruction and repeated post-paint corrections.

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

Status: Implemented; current candidate requires browser acceptance.

Requirements

* Choose hero arrangements from actual card content, available width, rendered height and overall page footprint.
* Evaluate Score, Vitals and Abilities promotion independently when compatible.
* Avoid treating promotions as a mandatory linear progression.
* Permit horizontal, stacked and split biology arrangements where they fit.
* Compare promoted compositions against the space occupied by their unpromoted native sections.
* Avoid unnecessary portrait shrinkage, excessive blank space and oversized hero heights.
* Preserve natural native content, controls and event handlers.
* Avoid returning to a large catalog of hardcoded layout permutations.
* Keep layout decisions stable during resize, navigation and asynchronous rendering.

Current implementation: GEO-01-R01 and GEO-01-R02, through Species Card 0.1.26.

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

HERO-BIOLOGY — Adaptive gender/egg arrangement

Status: Implemented; browser acceptance outstanding.

Requirements

* Consider horizontal versus stacked gender/egg placement using real text fit and available dimensions.
* Allow biology arrangement decisions independently of other hero promotions where feasible.
* Support left-stacked and split arrangements.
* Prefer stacked bars when this improves readability without unnecessarily increasing page height.
* Retain the same underlying native biology information.
* Avoid sacrificing available egg-text width merely to preserve an inline arrangement.
* Preserve continuity while layout selection changes.

Current implementation: BIO-01 and GEO-01 introduced measured fitting and additional arrangements.

⸻

BIO — Species Biology Presentation

BIO-EGG — Unified egg-group bar

Status: Implemented; styling acceptance outstanding.

Requirements

* Use the same recognizable egg-bar presentation in compact and promoted species layouts.
* Place the egg icon consistently at the left.
* Center the remaining text within its available content region.
* Scale the icon and text proportionally at different sizes.
* Prefer a readable single line; reject layouts that cannot accommodate it.
* Avoid breaking words or clipping group names.
* Remove visible Egg: and Egg Group: labels and obsolete display alternatives.
* Preserve accessible meaning and native egg-group data.
* Reuse the same icon/value construction instead of duplicating components.

Visual question: The originally requested white egg bar and the current 15%-grey Light-theme implementation are not identical. Confirm the desired final surface treatment before treating this item as accepted.

BIO-GENDER — Responsive gender bars

Status: Implemented; browser acceptance outstanding.

Requirements

* Scale gender symbols and ratio typography according to available bar width and height.
* Preserve relative icon/text proportions and centering.
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

Status: Implemented candidate; target discrepancy requires review.

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

DETAIL-SCALE — Wide-card information readability

Status: Discussing.

Requirements

* Scale Speed, Senses, Skills, Saves and effectiveness information as card space increases.
* Scale typography, icons, spacing and type badges coherently.
* Preserve readable proportions and alignment at narrow widths.
* Make the layout fitter evaluate the content at its final intended scale.
* Prefer card/content geometry over arbitrary viewport breakpoints.
* Avoid leaving unusually small detail typography beneath a large hero.

DETAIL-SPEED — Movement icons

Status: Discussing.

Requirements

* Evaluate replacing repeated Speed labels with recognizable movement icons.
* Cover native walking, flying, swimming, climbing, burrowing and hovering movement.
* Preserve exact movement values and labels in accessible descriptions.
* Use consistent icon size, stroke weight and alignment.
* Verify whether the icon language remains understandable without visible text labels.

DETAIL-SENSES — Sense identification

Status: Discussing.

Requirements

* Explore one recognizable category icon, potentially an eye, representing Senses.
* Retain the actual sense names and distances where icons alone would be ambiguous.
* Account for darkvision, blindsight, tremorsense and truesight.
* Preserve the existing rule that missing Senses should not reserve blank layout space.

DETAIL-EFFECTIVENESS — Weakness, resistance and immunity presentation

Status: Discussing.

Requirements

* Explore icon replacements for Weak To, Resists and Immune.
* Candidate symbols: red double-circle/target, grey triangle and black X.
* Preserve accessible descriptions and mechanical meaning.
* Explore scaling the native type badges with available panel width.
* Consider omitting the badge name cell at larger sizes when the type icon is sufficiently recognizable.
* Explore an effectiveness strip and conditional promotion into unused hero space.
* Do not duplicate native type badges unnecessarily.
* Treat hero promotion as a content-and-space decision, not a rigid breakpoint.

⸻

PRESENTATION — Loading and Continuity

PRES-FIRST — Correct first presentation

Status: Discussing cold-start edge case; pre-analysis strategy selected in principle.

Requirements

* Correct artwork-derived theme colors and subject-aware composition **on the first visible card frame**, including first-ever visits wherever prefetch succeeded.
* No mid-view color changes, layout shifts or geometry corrections after the user sees the card.
* Preserve the existing real-list-to-ready-card handoff. Never show an empty interval or substitute card merely to conceal loading.
* Prioritize proactive list analysis, hover/focus intent and neighboring-species warming instead of making an expensive scanner routine work on click.
* Revalidation changes discovered while viewing a card apply to its next presentation, not as an immediate visible repaint.
* Color and geometry are independently computable; coordinate compatible cached/ready decisions before first reveal.

**Unresolved:** A truly cold direct URL or an immediate click before analysis completes cannot be guaranteed both immediately visible and correctly themed/composed without waiting or precomputed data. Establish and approve a cold-first-reveal policy before consumer integration; do not invent one by default.

PRES-ATOMIC — Analysis and presentation synchronization

Status: Planned; not integrated.

Requirements

* Publish each complete, successful color or geometry product coherently; do not require their calculations to finish together.
* Assemble one compatible presentation snapshot for the selected species before the card becomes visible.
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

⸻

OPS — Development and Acceptance

OPS-OWNERSHIP — Cross-script responsibility boundaries

Status: Ready; ongoing engineering constraint.

Requirements

* QoL owns navigation, shiny controls, relevant native enhancements and application-level interactions.
* Species Card owns hero composition, responsive card geometry and placement.
* Theme Overlay owns theme-dependent presentation.
* Artwork Intelligence owns artwork-derived metadata and analysis.
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

Current experimental branch: dev/hero-restoration-2026-10-14

ART-02-R01 implementation baseline: 3c82480ec9ef8bf4d547c3df40228800362bfcd7

Workboard alignment reviewed against dev HEAD 236b6095fa9d99c1dadb4959b268b11d95d9ec77 (before this documentation change). Branch comparison and current HEAD must be checked live before any code edit; historical counts are not treated as current.

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

Current integration state

* Artwork Intelligence exists as a fourth standalone userscript.
* Current QoL, Species Card and Theme Overlay do not yet consume its analysis results.
* Existing official Pokémon artwork decisions remain in Theme Overlay.
* Theme and biology restoration work precedes the Artwork Intelligence implementation on the same development branch.
* The current branch is not equivalent to an accepted production release.

Next work: (1) baseline and profile ART-02-R01; (2) evaluate/approve a cheaper two-type color decision against real artwork; (3) replace unnecessary full-canvas pixel collision/hole machinery with verified exterior contours for all Fakémon; (4) implement one bounded list/intent/neighbor prefetch queue; (5) streamline cache and independent product readiness; (6) settle the cold-first-reveal policy; (7) integrate Theme Overlay, QoL and Species Card through one stable presentation; (8) run targeted regression and user-browser acceptance. This is planning, not authorization to implement or deploy.

⸻

Completion rule

A work item is marked Accepted only after its defined behavior is implemented and the relevant verification is complete, including user browser testing where required.

Items may be reopened if subsequent testing reveals defects or regressions.

Working artifact: This workboard is a living development tracker, not an authorization to edit code, merge branches or deploy changes.
