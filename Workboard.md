Poké5e — Development Workboard

Purpose: Track feature/fix decisions, implementation, verification and remaining work. This is not a complete app specification. Acceptance attaches to a feature or fix in its tested circumstances; versions and hashes identify the artifact carrying that behavior, not an all-or-nothing approval of every feature in a file.

Status vocabulary: Discussing · Planned · Ready · In Progress · Implemented · Testing · Accepted. Record observations separately, including user-reported fixed/no recurrence and historical regression cases. Missing fresh verification in an audit does not make a behavior an active defect.

These are working development candidates. Presence in GitHub, a higher version number, or successful syntax checks does not establish feature acceptance. Record design agreement, implementation evidence and user/device verification separately.

Execution Queue — 2026-10-25

This is the **current proposed order**, maintained at project checkpoints; it is not a requirement to finish every task in a stage before unrelated work. Each development outcome is investigated, implemented, tested and reviewed in a focused conversation. Feature acceptance remains specific to evidence and user feedback. Update this queue when prerequisites or priorities materially change rather than adding another dated execution plan.

| Order | Outcome | Status | Completion / checkpoint gate |
| --- | --- | --- | --- |
| **1 — Next** | **Reusable Poké5e Chromium fixture** (`OPS-TEST-FIDELITY`) | Ready for reconstruction and validation | Rebuild from identified native/data/artwork and supplied fixture archives; prove native-only and overlay modes from clean extraction; report real coverage and mode limitations; package reproducible inputs, runner and evidence in a verified ZIP saved to Library. |
| **2** | **Authored Vitals SVG fidelity and compact/promoted cells** (`HERO-ICON-FIDELITY`, `HERO-VITALS-CELLS`) | Planned; depends on trustworthy visual checks | Use the supplied SVGs (especially correct SR crop and uniform Level color); inspect readable rendered component studies; validate actual icon/value cells in compact and promoted forms without changing native data. |
| **3** | **Movement, Senses and effectiveness icon/value consumers** (`STATS-01` and related icon entries) | Planned; reuse measured components | Establish compact cell dimensions, exact supplied glyph mappings, field semantics and real consumers; test relevant native values and responsive fit. |
| **4** | **Constructive Species Card/Stats composition** (selector reconstruction and `STATS-01`) | Experimental work exists; replacement incomplete | Integrate measured components with artwork and text geometry, eligible promotions, biology last and populated-bottom alignment; targeted real-data navigation/resize checks, preserving accepted improvements. |
| **5** | **Independent refinements and broader backlog** (Move/TM typography, theme, Fakémon metadata/custom moves, etc.) | Sequencing to be decided per dependency | Choose independently scoped outcomes from the workboard; investigate actual consumers, test affected behavior and record individual acceptance. |

At a meaningful checkpoint, compare the user-confirmed working files with committed branch contents, review tested/untested behavior, update the relevant workboard IDs and this queue, and identify the next outcome. Do not equate a delivered version or GitHub commit with feature acceptance.


Current reconciliation — 2026-10-24

Stability: **Working, reconciled documentation committed on the development branch.** The reconciliation of three supplied chat exports, their artifacts and the user's October 24 corrections was uploaded to `dev/artwork-geometry-2026-10-17` on October 25 (initial documentation commit `f8bebcf7`). Its requirements and evidence remain open to correction; publication of this workboard does not authorize code changes or establish whole-file feature acceptance. The implementation records below retain their original dates and scopes.

* **Remote checkpoint inspected:** `YofiYell/Poke5eQOL`, `dev/artwork-geometry-2026-10-17`, commit `7d67409aad63f300325bc03f16dc058b2200c01c`. Remote Species Card is v0.2.22; the supplied v0.2.29 is a later local experiment. Supplied QoL v0.13.6 and Theme Overlay v0.3.50 match the remote development files. None of these facts establishes what is currently installed on the user's devices.
* **Feature-level progress:** Preserve the user-observed bottom-alignment improvements, useful Crobat composition, larger sparkle after padding removal, Abilities-spacing improvement and Hidden-badge inline/gap refinements. The user now reports no recurrence of the vertical bounce or shiny-triggered layout switching after later deliveries. Preserve these observations, the historical oscillation correction, and the reviewed original-Pokémon backgroundType assignments/palette. Outstanding selector quality or icon work does not reopen unrelated fixes or imply file-wide acceptance.
* **Current order:** Build and validate one reusable Chromium fixture package from the supplied materials, with an honest mode/coverage report and a corrected representative manifest. Then establish faithful authored icons and flexible Vitals in a focused HTML component study, followed by compact movement/senses/effectiveness cells and their actual consumers. Continue constructive hero/Stats composition using the resulting dimensions, actual artwork/description geometry, eligible promotion and biology last. Preserve user-reported fixes through relevant regression checks; they are not a separate speculative repair phase. Wider badge presentation, wide artwork weight and selective contour placement remain scoped follow-ups. The broader backlog remains in place.
* **Active work versus retained regressions:** Active source/design work includes the supplied SR crop and appropriate icon track, faithful monochrome Level rendering, incomplete compact/detail icon consumers, QoL header/runtime identity, the dormant flight helper's type-versus-egg-group error, current description/Scores spacing and Move/Egg Move/TM typography. Vertical bounce and shiny layout switching are user-reported no longer occurring after later deliveries; historical oscillation and resize cases remain regression references. Do not promote a proposed test scenario into a newly reported defect.
* **Evidence boundary:** This audit syntax-checked the three supplied scripts and verified fixture integrity; it did not run new browser renders. Historical SSR results do not prove Svelte navigation, first paint, userscript-manager timing or Safari behavior. The latest rejected HTML mockup and historical screenshot/video pixels were not supplied here; their recorded user corrections remain authoritative, but this audit did not visually re-inspect them.
* **Supersession:** Operative feature requirements below incorporate the latest user corrections. Dated baseline/checkpoint paragraphs and investigation leads are history when explicitly labelled. In particular, strict visible-information/move-row gates, the 424px wide-growth anchor, fixed old Vitals ceilings, split biology and speculative icon mappings must not silently become current requirements again.


Selector reconstruction checkpoint — 2026-10-20; requirements reconciled 2026-10-24

Status: **Replacement in progress, verification incomplete.** v0.2.22 remains the remote comparison checkpoint. Supplied v0.2.29 contains experimental constructive routines, hidden verification and a single live commit, plus inherited proposal sampling/validation machinery; this is not proof the replacement contract is complete. Feature acceptance is recorded separately.

* **Development-branch versions:** QoL v0.13.6 (shiny/sparkle button internal-padding adjustment); Species Card v0.2.22 (current combined subject-area artwork guide and contour-coverage data); Theme Overlay remains v0.3.50. Keep repository filenames `Poke5e QOL.js`, `Poke5e Species Card Adapter.js`, and `Poke5e Theme Overlay.js` stable; update their internal title/version fields as appropriate. Modify GitHub only on explicit user instruction. `main` remains a separate published reference; acceptance of its individual features/fixes is scoped to recorded evidence.
* **Selector replacement rather than more patches:** Retire the present expensive generate/rank/verify selector once replacement behavior is demonstrated. Preserve native DOM ownership, shared component rendering, bottom-edge alignment constraints, independently runnable scripts, and the useful compositions of v0.1.28.5. No new developer-reporting UI, debug machinery, timers, compensating observers, or discarded-code accumulation.
* **Construction order:** (1) establish artwork's preferred and allowable pixel dimensions using actual normal-artwork geometry and **panel width**; (2) construct the description/artwork region, including viable narrow wrapping with description continuing below the artwork; (3) promote eligible Ability Scores, Vitals and Abilities based on fit; (4) place Gender and Egg Group last, respecting shared height, size caps and established ordering; (5) perform a small physical measurement/reconciliation pass and commit once. Start from the artwork preferred size; adjust columns, wrapping and placement first. A modest change within the allowed artwork interval may improve fit, but biology or an arbitrary candidate must not force severe shrinking.
* **Artwork reference contract:** Preserve compact sizing through **450px**, then grow from that same 450px result without a downward step at 451px. The earlier 424px calibration remains a historical comparison. Combined subject-area **9.5–10.5% (10% center)** and **18.5% bounding-box area** are compact calibration constraints, not continuously recomputed wide-panel targets. The current trial retains a **60% maximum visible-subject width at all widths**, a carried **40% height restraint**, and provisional growth to **+18% at 1100px**, constant thereafter. These are ceilings/guidance, not forced enlargement. Report unavoidable constraint conflicts; do not invent a new reference height or quietly abandon width independence.
* **Image behavior next:** Width independence remains open: the supplied v0.2.29 compact/450px-anchor calculation still uses live panel height, with a height-source change at 550px. Resolve the reference-height decision explicitly and verify equal-width/different-height results before marking the goal complete. Keep provisional wide growth unchanged while reviewing surrounding composition, including Crobat around 1000–1360px. Preserve top alignment, normal-operation absence of the debug outline, and useful sub-550px contour-aware description wrapping without clipping or subject collisions.
* **Historical selector case:** The .22 native-data fixture reported Gardevoir at 359/374/424px panel widths with approximately **105/183/194px subject heights** at fixed 850px viewport height; the 359px composition fell to roughly **2.3% combined subject area**. Retain it as a relevant replacement-constructor comparison, not proof the identical failure persists in .29. Avoid species-specific rules or repairing a retired selector merely to satisfy an old snapshot.
* **Promotion and geometry:** Below 550px, promote Ability Scores **or** Vitals (at most one); Scores otherwise remain naturally below the hero. From 550–799px all three groups are eligible. At 800–1099px expect Abilities promotion when it can fit, with Scores/Vitals as useful. At 1100px+ ordinarily promote all three, relaxing Scores first for necessary exceptions. Genuine inability to fit after legitimate adjustments is an acceptable production outcome, not a visible diagnostic or an excuse for arbitrary fallback design. The provisionally permitted nearest feasible artwork size may be used for conflicting bounds, with violations reported in fixture/chat results. These are eligibility/preferences, not fixed templates. Use measured total scroll height comparatively; no visible Move/TM item/row gate.
* **Biology:** Place the paired Gender/Egg group last. Widths may differ side by side with a set gap; outer heights always match. Stacked unequal widths require a justified contour arrangement. Fit the contents/assigned column without large textless-color regions; prefer biology smaller than Vitals. Small residual space-between is allowed, not a substitute for a good composition. Biology follows Abilities unless it is also beneath a promoted 1×4 Vitals row; do not split the pair into unrelated rows/columns.
* **Test plan:** The intended 27-case matrix is wide/square-ish/tall visible artwork × short/medium/long Description × short/medium/long Abilities. The user acknowledges the existing selection did not reliably represent those cells. Keep it as historical data, measure the actual normal-artwork subject and native texts, and reselect misclassified cases with recorded rationale. Additional real-data icon or lifecycle cases are supplemental checks chosen for changed behavior, not extra matrix axes or newly reported bugs. Measure actual card width. Select meaningful widths from 360–1360px and only relevant boundaries/history cases; no mandatory full cross-product per small change. Use readable comparisons and retain useful earlier outcomes. Report failures and completed coverage concisely; stop repeated checks once the stated uncertainty is resolved.
* **Screenshot width units:** Filename fractions such as **7/8** mean a fraction of the roughly 1360px iPad width, not a 7:8 aspect ratio. Measure the actual panel width independently. Source: supplied middle transcript, middle-0001; readable contact sheets comparing specific versions and a few useful widths were preferred after tiny ten-width sheets proved unhelpful (middle-0412/0414).

* **Separate typography investigation:** Move, Egg Move and TM sizes can diverge. Theme Overlay v0.3.50 uses relative sizing for ordinary move links but a cached pixel-sized `--p5ov-tm-font-size` pseudo-label for TMs. Inspect computed values across resize/navigation and themes before making a separate localized correction. Do not conflate with the hero selector.
* **Remaining evidence/work:** Width-independent artwork sizing and constructive composition still need completion and relevant visual checks. The historical Gardevoir .22 case and other earlier symptoms are comparison/regression inputs, not proof of present failures. Run device or broader-catalog checks when the changed behavior warrants them; this checkpoint does not require a full all-species/Safari sweep before every task.


Historical baseline and development sweep — 2026-10-17

* **Historical `main` artifact snapshot:** QoL v0.13.4; Species Card Adapter v0.1.27 (hero description measurement correction); Theme Overlay v0.3.50 carrying the reviewed original-Pokémon color assignments. Individual behavior acceptance, source commit and installation remain distinct facts; this is not blanket acceptance of every feature in these files.
* **Active development branch:** `dev/artwork-geometry-2026-10-17`, originally branched from synchronized `main`; `dev/hero-restoration-2026-10-14` is a preserved experimental/history archive. Do not merge archived Artwork Intelligence code wholesale.
* **Current design direction:** One content-driven layout grammar for compact/mobile and wide cards; artwork subject bounds available to every layout; final detail/icon components measured before final hero optimization; no mandatory promotion ladder.
* **Historical selection rule — superseded October 19:** Earlier work proposed nondecreasing visible information as width increased. The user subsequently required **measured total scroll height only as an important comparison factor**, not a move-row/item metric or automatic candidate-removal rule. Keep all source content intact and legible; useful promotion may legitimately change which content is above the fold.
* **Hero height:** approximately 25–40% of **usable panel height** is an exploratory preferred range, not a fixed height and not a mandatory clipping bound. Long descriptions and data may require more; short descriptions must not be padded to a minimum. Artwork has its own independent min/preferred/max size. Prefer aligned populated-column bottoms and reasonable negative space over an oversized portrait.
* **Biology (updated):** Equal measured outer height remains mandatory. Side-by-side widths may differ now when contents and composition justify it; stacked unequal widths are limited to useful contour arrangements. Maintain one paired logical region, readable content and subject clearance. This is no longer awaiting separate permission merely to use different row widths.
* **Historical delivery order — superseded:** The October 17 sequence began with layout unification and placed all contour work last. Use the current reconciliation order above: faithful component geometry before further selector integration; useful compact description-contour wrapping is already required, while more ambitious component overlap stays carefully scoped. Offline original-artwork geometry and Fakémon save-time analysis remain separate source pipelines.
* **Historical verification at this checkpoint:** Safari user A/B screenshots showed experimental subject rectangles changing promoted artwork placement and exposing composition issues; that particular test left compact rendering unchanged. Separate exact-.1.27 device results were not in the old record. Later implementation/observations above control present status; this historical gap is not a new mandatory regression gate.


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

Status: Original-Pokémon assignment/palette migration is recorded as integrated through Theme Overlay v0.3.50. Runtime Fakémon color scanning is retired from the target design; creator-selected editor persistence and archived experimental cleanup remain incomplete.

Requirements

* Treat the full original-Pokémon offline analysis as a **one-time seed**, not a runtime dependency. The selected baseline is Hue/Saturation + Neutral Lightness, covering 613 dual-type original Pokémon/forms. Preserve its exact result set for review rather than rerunning or silently changing its choices.
* Manual review may override that seed for visual composition, contrast or form identity. Preserve the user's current local selections and exported corrections when migrating.
* Historical matchedType/visualType naming was superseded by the backgroundType assignment integrated for original Pokémon through v0.3.50: the type supplying card tint. Preserve current reviewed data; do not reopen that completed naming/migration decision. Fakémon creator-selected persistence remains separate.
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

Historical implementation: ART-02-R01 introduced a fourth userscript and public API on the archived branch. The published main reference has three userscripts, with actual companion dependencies recorded under OPS; do not merge the experimental ART implementation without removing obsolete runtime color/mask machinery and checking consumers.

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

* QoL remains the sole owner of the shiny button, toggle, drag/manual corner and saved preferences. Species Card supplies allowed bounds only; it must not override the chosen corner or compete for the control.
* Artwork Intelligence enhances the shiny button but must never become a dependency of it.
* Without Artwork Intelligence, preserve all existing shiny functionality.
* Apply preference precedence: explicit manual corner → valid automatic recommendation → existing top-right fallback.
* Distinguish an absent manual preference from the default returned by savedPortraitCorner().
* For automatic placement, evaluate four candidate corners from the normal artwork visible-content box, actual icon dimensions, clearance and exterior contour. Separately, the allowed manual corner frame may extend left/right/down into genuinely unused artwork-track space, excluding gutters and reserved components; this does not enlarge the artwork or hero. Keep subject bounds and allowed control frame distinct.
* For automatic all-corners collision handling, if an original corner is valid, do not expand. Only when none is valid, expand equally on all four sides by one rendered icon width and reevaluate, supplying the relevant control-clearance bounds to Species Card. This automatic fallback is separate from permitted use of an already empty track by the manual corner frame.
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

Status: **The 613 user-curated original-Pokémon backgroundType assignments are accepted and integrated on main through Theme Overlay v0.3.50.** Commit 41179f9a and the later main snapshot identify the carrying artifact; unrelated features in that file are not thereby accepted.

Requirements

* The chosen offline seed is the **Hue/Saturation + Neutral Lightness** full set of 613 original dual-type Pokémon/forms (not the later 50/50 hybrid). No original-Pokémon runtime scanner is needed.
* Historical review workflow: the temporary VisualType reviewer supported individual inversion, global tint/banner preview and corrected-set export. That history precedes the recorded permanent original-Pokémon assignment integration in v0.3.50; preserve its reviewed output rather than repeat the migration.
* Keep the exact reviewed/approved assignments, including form-specific identity, separate from visual mixing. Preserve user edits on import; check species ID/form mapping and that the selected type is one of the actual types.
* Historical migration replaced legacy four-tuples/provisional visualType with a single backgroundType decision per original dual-type identity. Preserve that integrated data contract; keep the other color and surface presentation separately derived.
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
* **Whole-card comparison:** compare measured total scroll height, readable content, sensible component area and negative space. Do not count visible Move/TM rows or items, and do not eliminate candidates for crossing an above-fold or scroll-height threshold. A useful promotion may move a row below the fold; no source content may be omitted or clipped.
* **Preferred hero height:** begin evaluation around 25–40% of *usable* panel height as a soft band, not a mandatory fixed minimum/maximum or clipping constraint. The content and selected arrangement can exceed it; a sparse hero need not be padded up to 25%. Re-evaluate from real viewport/card geometry in desktop, mobile and split panes before tuning percentages.
* **Art size:** use the current preferred/allowed subject-size contract, with continuous bounded growth from 450px and strict width-independence still open. Construct around the preferred size; only modest allowed adjustments with an identifiable composition benefit may follow. Do not inflate art to fill dead space or force severe shrinking to fit biology. Keep live-height 37% and older 172px limits as historical experiments, not current mandatory bounds.
* **Alignment:** keep artwork top-aligned; seek a clean common lower edge from actual populated child endpoints and visible subject bounds, not parent boxes or assumed distribution. Jointly adjust columns, wrapping, permitted image/component scales and small gaps. Do not push art down, add arbitrary padding, over-stretch controls or hide data. The recent plan used an approximately 3px comparison tolerance; treat it as a verification target, not authority to sacrifice readability or restore older numeric limits. After permitted scaling, reject avoidably misaligned compositions; report genuine infeasibility rather than manufacture alignment.
* **Clearance:** maintain consistent nonzero subject-to-content spacing. Useful compact description wrapping and selective component placement inside empty areas of the artwork bounding rectangle are agreed directions; they require actual contour-safe geometry, not blanket contact with the outline. Use conservative rectangle clearance when compatible contour data is unavailable. Keep HP/text, controls and interaction safe.
* Build from current canonical content, with priority to subject aspect, description length/wrapping, Abilities length/wrapping, then egg text. Retain meaningfully distinct feasible choices without an arbitrary global top-N cutoff; do not substitute hundreds of static layouts or renamed old sweeps for construction. Measurements and final geometry must not inherit previous layout; prior state may only avoid an identical commit. No after-paint rescues or observer feedback loops.

Acceptance/representative checks: iPhone compact Makuhita; iPad/desktop Sentret, Noctowl, Ledian, Charmander and Venusaur under subject-box A/B; long versus short descriptions; text and icon wrapping; incremental widening at fixed panel height; compare scroll height and composition without an above-fold hard gate; no missing data, clipped controls, history-dependent geometry, oscillation or diminished native behavior.


HERO-IMAGE — Subject-aware artwork fitting

Status: Subject-bound fitting exists in the remote .22/supplied .29 experiments; the earlier promoted-only A/B is historical evidence. Unified compact/wide behavior, actual contour fidelity and the current sizing contract remain incompletely verified. Do not infer completion from embedded geometry.

Requirements

* Fit and scale artwork from visible subject bounds, preserving top alignment and the complete source. The lane follows subject width plus consistent clearance; extra unused track width needs a geometric reason. Transparent PNG margins do not own layout space.
* Use accurately extracted normal-artwork exterior contours to allow suitable decorative extension into empty neighboring hero space.
* The compact calibration's combined area is the geometric mean of visible subject bounding-box area and enclosed contour area, divided by the reference panel area. Use one combined scale computation, then apply its legitimate bounds. Do not retain a separate superseded alpha-density boost. The old 37% height ceiling, 30%/20% dimension minima, 12.5–17.5% bbox-only band and 6–9% contour-only trial are historical.
* Do not invent lore-based species sizes or introduce a Pokédex height normalization rule. External physical-height data was only a questioned proposal; image geometry and reviewed visual calibration remain the actual basis.
* Protect HP values, labels, controls, hit targets and stacking from subject-outline overlap.
* Keep actual subject bounds distinct from the allowed shiny-control frame. Existing left/right/down extension into unused artwork-track space must not enlarge the artwork or hero. For a future automatic all-corners-fail expansion, account for occupied control clearance without turning free-track extension into new subject size.
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
* Keep manual position controls and interaction unchanged, without layout rescue for intentionally inconvenient manual choices. Preserve removal of the old corner/drag inset and internal button padding as separate fixes; the user positively assessed the larger visible sparkle. Refresh, navigation and resize must use one consistent owner/frame contract.

HERO-GRAMMAR — Content-driven adaptive composition

Status: Constructive replacement remains in progress in supplied v0.2.29; inherited proposal/verification machinery is still present. The old copy-measurement, resize-history, bounce and shiny improvements retain their own evidence; incomplete composition work does not imply those symptoms currently recur.

Requirements

* Choose hero arrangements from actual card content, available width, rendered height and overall page footprint.
* Evaluate Score, Vitals and Abilities placement/presentation independently when compatible, preserving room for individual detail icon/value cells; final state need not correspond to an ordered promotion stage.
* Avoid treating promotions as a mandatory linear progression.
* Permit paired horizontal or stacked biology in one logical region. Do not split Gender and Egg into unrelated rows/columns; independent widths do not authorize independent placement.
* Compare promoted compositions against the space occupied by their unpromoted native sections.
* Avoid unnecessary portrait shrinkage, excessive blank space and oversized hero heights.
* Preserve natural native content, controls and event handlers.
* Avoid returning to a large catalog of hardcoded layout permutations.
* Keep layout decisions stable during resize, navigation and asynchronous rendering.
* Description flow around/below artwork, whether rectangular or contour-shaped, is restricted to panel widths below 550px. This is not a restriction on ordinary text wrapping inside its own column. Avoid large residual gaps and preserve a usable opposing shiny-control corner.
* Size Description and Abilities columns from their actual text together. The user suggested roughly 20–60% of panel width as a column range; retain it as a tentative design range, not a rigid universal gate. Existing native body text is the lower typography reference and the existing larger Description/Abilities text is the upper reference. No new blanket shrink-to-fit font limit is established.

Historical implementation record: GEO-01-R01/R02 grammar was retained in v0.1.27, with copy-measurement correction committed and its native/compact fallback outside full selection. Subsequent .22/.26–.29 work must be assessed against unified current-input measurement and construction; the historical record is not the current implementation specification.

Middle-chat resize record: .12 reported repairs for detached Vitals, stale Abilities typography measured before native restoration, and stale TM measurements. Later .13/.14 retained those corrections; the user then said repeat resize tests were sufficient. Preserve the mechanisms and deterministic-input contract when replacing their consumers, without treating those old defects as automatically active.

HERO-OSCILLATION — Repeated or width-sensitive hero promotion/demotion

Status: **Historical correction and retained regression case; no current recurrence reported.** The v0.1.27 measurement correction was committed. Subsequent .12/.14-era work addressed resize-history behavior, and the user said the repeated resize regressions were sufficient. The October 24 correction explicitly cautions against treating such examples as current defects. Older missing target-device evidence remains a limit of that record, not a reason to reopen this item automatically.

Observed behavior (2026-10-16 to 2026-10-17)

Confirmed diagnosis and corrective record (later evidence supersedes preliminary identifications below):

* Work-mode browser reproduction: Nosepass at ~475px card width switched between native and scores-promoted arrangements; Croconaw at **622px** card width switched repeatedly, while 624px was stable in the recorded run. Neighboring species provided controls. This clarifies the earlier unnamed ~624px report; it is not a universal threshold.
* Cause: a detached description measurement clone lacked the normal hero-child CSS relation and inherited 16px side padding in one layout state, while a promoted-state selector zeroed that padding; different wrapping heights changed candidate ranking after the observer reran layout.
* Historical v0.1.27 correction matched clone content-box padding to the live zero-padding state, measured candidate-specific wrapping and separated native/promoted cache keys without changing scores, thresholds or observer behavior. The in-memory diagnostic stopped the recorded oscillation. Exact-build target-device results were not documented at that point; preserve this provenance limit alongside the newer observations rather than reopen an active defect.
* Historical 0.1.26 code-inspection hypotheses and the earlier “second species unknown” notes below describe the investigation *before* these results; they should not drive speculative additional patches.


* Nosepass (#0299) repeatedly alternates between native and promoted hero arrangements while the selected species and browser-panel width remain unchanged. The animation visibly relocates ability scores, gender/egg bars and artwork, rather than showing a normal one-time load transition.
* The recording shows the problem in desktop-style Safari with a narrow split browser panel. Other species shown after navigation do not establish that the defect is unique to Nosepass.
* The recording proves repeated layout changes, but does not include live layout-state or computed-style telemetry. The full causal chain is not yet confirmed.
* Additional user report (2026-10-17): another, as-yet-unidentified Pokémon exhibited Nosepass-like flicker at an approximately 624 px panel width. After resizing the window away from that width and back, the flicker stopped in that session. The width is approximate; no live state/geometry trace was supplied for this case. This is a second reported affected species, not evidence of a confirmed root cause or permanent resolution.
* Nosepass is the first identified species; at least one additional, unnamed species is now reported. Compare shared width/selection-history behavior and species-specific content rather than assuming the issue is unique to Nosepass or universal at every width.
* The clip visibly alternates between native scores and a scores-promoted arrangement; confirm the exact promotion flags by instrumenting the real layout selector. A near-tie between candidates is a hypothesis, not a measured finding.

Historical investigation procedure — use only if recurrence or a relevant changed dependency warrants it

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

Retained behavior contract and targeted regression reference

* With unchanged route, card width, source data and font metrics, repeat evaluations must select the same stable arrangement. Do not rely on a delay, arbitrary cooldown, animation, hidden card or frozen layout to mask instability.
* Distinguish genuine changes (viewport, text, portrait intrinsic dimensions, font readiness, theme) from self-generated layout changes. Ensure one coherent measurement basis for competing candidates.
* Capture per-pass chosen promotion, biology mode, source identity, card/content widths, projected footprints, candidate costs, image height and reason for recalculation on live Safari.
* Regression-test Nosepass near the recorded narrow split-pane width and the second reported case near approximately 624 px panel width, including a resize away and back. Also cover shorter/taller descriptions, different abilities, theme modes, refresh, next/previous navigation and manual resizing across thresholds.
* Preserve adaptive promotions when actually beneficial; fix the input/state inconsistency rather than disabling a legitimate layout mode.
* After tracing the actual cause, correct the offending geometry measurement, native-state restoration, memory invalidation or observer dependency at its owner; remove obsolete logic superseded by the correction. Do not add delays, a cooldown, arbitrary threshold hysteresis or a Nosepass-specific exemption.
* Confirm that the chosen native or promoted scores layout is stable across repeated evaluations while inputs are unchanged, and changes appropriately when text, fonts, dimensions or portrait data genuinely change. Validate with the actual Nosepass content, not only synthetic test fixtures.
* The scoped v0.1.27 measurement correction was explicitly authorized on `main` and inherited by the active dev branch; further work remains on dev until separately approved. Do not claim the published build passed live Safari tests.

HERO-SCROLL-LIFECYCLE — Uncontrolled vertical scrolling near 457–460px

Status: **User reports no recurrence after a later delivered version.** Retain as a historical regression scenario; no active repair task is inferred. The exact fixing revision/causal change is not established by this audit.

* The original symptom was vertical bounce/slow upward drift without finger control, including with the hero visible. It was not a retained-scroll navigation issue, horizontal swipe symptom or changing-height explanation.
* The console pause was an isolation experiment. The user's October 24 account adds subsequent live experience: the assistant changed a delivered version after the console correction and the symptom has not been seen since. Do not let the earlier diagnostic-only observation override that later report.
* Preserve canonical offscreen measurement, the already visible card, unchanged-input stability and a single necessary commit. Keep the separate QoL gesture experiment independent.
* If the affected lifecycle/scroll geometry changes, select the old 457–460px scenario and suitable controls as relevant regression checks. A reproduced recurrence reopens investigation. No mandatory new Safari certification is imposed merely because this documentation audit did not run a browser.

HERO-GROUP-SPACING — Description/Scores and hero boundary gaps

Status: Repeated user-reported spacing defect; keep separate from Abilities-entry/section spacing below.

* Individual hero components must not carry unrelated trailing space. Define justified gaps within explicit groups; the hero owns separation from Speed/Senses below.
* Trace and remove the CSS/measurement source of description-to-Scores offsets, not a compensating negative gap. Verify actual children and the hero-to-details boundary in compact and promoted arrangements.


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
* Allow score typography and row geometry to scale within measured readable minimum/maximum bounds, using fine adjustments before dropping the section. Exact numeric font bounds remain to be established from actual components. When Scores and Abilities share a stack, Scores follow Abilities; retain useful Crobat composition while correcting its order.
* Keep color ownership with Theme Overlay and geometry ownership with Species Card.
* Avoid hardcoded white lettering that conflicts with Type-theme ink.

HERO-VITALS-CELLS — Reuse existing vitals SVGs in compact and promoted presentations

Status: Partially implemented in the supplied experiment. Promoted flexible geometry and authored path definitions exist; compact unboxed icon/value rendering, consistent shared measurement, SR crop fidelity, monochrome icon rendering and consumer integration remain open. Acceptance is per behavior, not the entire prototype.

Goal

* Begin with the four Vitals (SR, AC, HP, MinLvl), using the latest individual assets in the supplied Icon_SVG pack: Vitals/SR.svg, AC.svg, HP.svg and Level.svg. Preserve authored geometry and intended fill/stroke; do not reconstruct earlier sheet crops or generic substitutes. Historical SR_Icon.svg naming does not override the current supplied source.
* In compact presentation, replace visible text labels with the corresponding small icon followed by the native value: SR, AC, HP including hit die, and MinLvl including the established level suffix/range rules. Preserve semantic/accessibility names.
* **Initial compact treatment: unboxed.** No individual fill, border or decorative framing; use spacing and alignment alone. Only after browser review explore optional low-opacity frames, subtle outlines or a shared understated container. None of those are approved initial requirements.
* Compact icons initially inherit the actual species/card body-text color in Light, Dark and Type modes. Existing separately colored icons remain available for sufficiently roomy promoted tiles. Choose monochrome versus semantic color according to final cell size/visual density, not a fixed viewport breakpoint.
* Every icon/value pair remains an independent content cell in all layouts, including native-like compact arrangements. Placement, dimensions and visual presentation are separable decisions; cells may appear inline, arranged across multiple rows, or enlarged as existing hero tiles when that improves total composition. Promotion must not force a particular icon/value presentation.
* Aim to keep all four compact cells in one row when their measured final content fits. Permit unequal width allocations (HP/hit dice often require more width); evaluate alternatives only when necessary. Never allow collisions, truncation or panel overflow.
* Reuse the native value nodes/data and one canonical SVG definition/mapping wherever feasible; do not add a second independently maintained vitals icon set or duplicate native state. Preserve existing tile behavior and navigation until a replacement is verified.

Implementation/acceptance notes

* First investigate how `.yofi-vitals-row` native fields and `.lab3-vital` promoted tiles consume their data, and consolidate the common presentation without breaking existing native ownership or the layout selector's measured geometry.
* Measure and validate the final icon/value cells before layout choice, not by swapping labels after the chosen geometry has been scored. No extra late paint or compensating observer.
* Review compact and promoted Vitals with actual native SR, AC, HP/hit-die and minimum-level values, using the supplied icons. Choose relevant sizes/themes and native integration checks. HP is receiving an icon; “long HP” is not a separately requested feature or reported defect. Inspect the actual icon crop, optical alignment, remaining value space and readability.
* This is the first component-fidelity task before broader icon integration. Use a small HTML component study while the selector cannot reliably exercise the new forms; preserve both compact and promoted contracts.
* Promoted Vitals may use any fitting rectangular proportion within **44–96px width and 22–96px height**. All four tiles share dimensions, shape and corners. The earlier 44–72/22–36 bounds and rigid square/bar-only distinction are superseded; unboxed compact cells may still allocate widths by actual contents.
* In a horizontal tile, reserve the icon's intrinsic/optical track, then center the value in the remaining padded area. Only HP may shrink its value font; fit alone does not establish readability. Icon proportions/scales must be canonical across square, bar, intermediate and inline forms.
* Historical implementation lesson: v0.2.27 retained square CSS but removed the actual selectable square form; v0.2.28 reported restoring it. Check reachable behavior rather than infer it from retained styling or blame scoring without tracing.

HERO-ICON-FIDELITY — Authored SVG rendering and component study

Status: Open rendering defects; source assets available. General design direction is accepted; the latest HTML mockup was rejected for specific fidelity failures.

* Use the user's supplied Vitals/SR.svg crop exactly. It has a 16×14 viewBox and differs from the current sheet-derived crop/transforms and generic 14×14 wrapper. An appropriate track for this asset still needs implementation/review. Existing SR-specific track/scale multipliers are not evidence that the supplied crop is integrated correctly. References to visual size concern the SR icon, never the SR statistic/value.
* Level.svg is one monochrome opaque silhouette: all filled and stroked pixels must render in one uniform color. Its internal fill-versus-stroke construction is not a separate design requirement. Theme color changes may recolor the whole icon uniformly; do not introduce mixed colors, opacity variation, or reinterpretation of the artwork. No independent Level shape discrepancy has been verified.
* Use one canonical asset/rendering path in the component study and eventual integration. Omit the unwanted unrelated icon gallery. Inspect actual output at realistic sizes before delivery; no-JavaScript-error and path-presence checks are insufficient.
* Matching path strings in the current sprite do not make it an exact copy of the supplied icon set. Crop/viewBox, transforms and styles matter; SR has a verified crop/track mismatch. The Level asset is monochrome and requires uniform coloring, not an assumed source-versus-sprite defect. Integrate individual source assets faithfully. Only promoted Vitals currently use the glyph helper; compact Vitals and Speed/Senses/Effectiveness consumers remain incomplete.


HERO-BIOLOGY — Adaptive gender/egg arrangement

Status: Implemented candidate; paired-size and column-boundary regressions reported, browser acceptance outstanding.

Requirements

* Consider horizontal versus stacked gender/egg placement using real text fit and available dimensions.
* Allow biology arrangement decisions independently of other hero promotions where feasible.
* Support paired horizontal and stacked arrangements in one logical region; remove unrelated split placements. Place biology after higher-value components, usually below Abilities unless it follows a promoted 1×4 Vitals row.
* Prefer stacked bars when this improves readability without unnecessarily increasing page height.
* Retain the same underlying native biology information.
* Avoid sacrificing available egg-text width merely to preserve an inline arrangement.
* Preserve continuity while layout selection changes.
* Treat Gender and Egg as a coordinated pair: **equal measured outer heights are mandatory**, with consistent corners and coordinated typography/icon scaling. Different widths are allowed side by side with a set gap; stacked unequal widths need a justified contour arrangement. Keep biology smaller than Vitals where practical and proportionate to its limited data.
* Fill a meaningful assigned column individually or together, or shrink to content/minimum size where useful. Determine maximum useful biology size before layout selection; do not clamp it afterward and leave stranded space. Small residual horizontal distribution is allowed, large textless-color regions are not. Sentret v0.1.28.5 near 1300px is a historical visual maximum reference, not a fixed 212px law. A smaller Gender width must not unnecessarily compress Egg text.
* A compact stacked arrangement may use a smaller shared bar height and coordinated text/icon scale than a horizontal arrangement. Evaluate each bar's actual fit at its *own assigned width*, select one common outer height, and reject clipped or illegible choices; never shrink one bar's height independently.
* Respect assigned geometry and real neighbors. A deliberately constructed contour-safe slot may enter empty space inside the artwork bounding rectangle; preserve actual subject clearance and controls. Otherwise reject boundary collisions rather than mask them with clipping or arbitrary corrections. Do not make every component hug the contour.
* Measure the final text and icon geometry when comparing orientations, accounting for font readiness and wrapping, and keep the accepted layout stable through navigation and resize.
* Compact biology minimum outer height is 22px. Reduce corner radii overall and further at small heights. Match the real visible Egg icon/text sizes to Gender icon/text sizes while keeping gender ratios bold and Egg Group names normal weight. Single-gender symbols should not be optically smaller than the same symbols in mixed ratios. These are component requirements from the middle chat, not a request for synthetic longer Egg Group names.

Reported Safari regression cases (2026-10-16; exact installed script commit not independently verified):
* Gummibo: side-by-side Gender bar does not stretch to match the Egg bar's allocated width.
* Gummigills: stacked bars differ in width and can be unnecessarily large for the available space.
* Mawile: Egg bar extends past the left text column into the adjacent artwork lane.

Acceptance: equal measured outer heights, readable complete content, appropriate area and one coordinated pair. Side-by-side widths may differ; stacked unequal widths need useful contour justification. Verify compact/wide rendering, refresh, navigation, themes and each actual assigned width. Historical Gummigills unequal-width evidence below/above does not by itself invalidate a newly permitted asymmetric arrangement; assess its fit and wasted space.

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
* Always match the Gender bar measured outer height. Side-by-side widths may differ now; Egg width must fit its complete group-name content. Stacked unequal widths need the contour justification specified under HERO-BIOLOGY.
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
* Fill the chosen Gender track width and match the Egg bar outer height. Unequal side-by-side widths are permitted when content and composition benefit, without clipped symbols or changed ratio semantics; do not strand oversized solid-color regions.
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

Status: **Canonical/per-type derived palette behavior is accepted and integrated through Theme Overlay v0.3.50**, recorded October 17 with source commit 41179f9a and later main promotion. This does not accept every unrelated feature in the artifact or prove device installation.

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

THEME-MOVE-FONTS — Inconsistent Move, Egg Move and TM sizing

Status: User-reported defect; source-level mechanism identified, actual trigger/computed-style behavior not verified.

* Compare the three rendered font sizes across resize, navigation and Light/Dark/Type before changing code. Theme uses relative ordinary-move sizing and a cached pixel-sized TM pseudo-label variable; this is an investigation lead, not a proven universal cause.
* Keep the correction separate from selector reconstruction. Inspect Species Card Light/Dark TM fitting and Theme's existing Type-mode row-major/natural-width path; preserve ownership and native links/data.
* The user clarified that inconsistent Move/Egg Move/TM font and pill sizing, especially in Type theme, was the visible report. The assistant's .10 TM parent min-width/overflow cleanup was separate and was not generally a defect the user had seen. Preserve that cleanup record without claiming it solved the typography issue.
* Verify stable intended proportions and consistent recalculation, without another late paint or compensating observer.


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

Status: **Restored requirements; Ready for a new implementation candidate.** Earlier v0.12.19/12B.19 exploration yielded useful compact/fit behaviors, but the precise 12B.19 source is not the current implementation and must be compared if recovered. Historical v0.1.27 measured/scored 18 predefined `adaptiveLayouts` trees and retained visible `None` placeholders; those choices are not the target grammar. Inspect the supplied candidate consumers before declaring them retired. Preserve useful measured/visual outcomes, not that fixed catalog.

Requirements

* Cover **Speed, Senses, Skills, Saves, Weak To, Resists and Immune** as real semantic fields, with type-badge groups and each movement mode/sense eventually represented by independently measurable icon/value cells. Preserve native source records and meaningful accessibility labels.
* **Suppress semantically absent/`None` Stats fields as visible rows and layout footprint**, not merely dim their text; do not hide meaningful zeroes, a real value, or a field for which data is not yet loaded. The prior 18-layout catalog's “show smaller `None`” behavior is historical and superseded by this design direction. Preserve the underlying data for editing/accessibility as appropriate.
* Missing Senses must consume no track height or reserved space. Permit presence/absence of fields to shape the grammar directly; never manufacture a blank field to force a chosen layout template.
* Generate legal row/column/group arrangements from **content and measured geometry** rather than maintaining a lengthy enumerated A–S/T catalog. Use bounded grammar operations and prune invalid groups early; do not blindly enumerate every permutation or replace the old catalog with more static templates.
* Allocate intrinsic label/icon/value requirements first; distribute remaining width purposefully. Consider single-line Speed/Senses and effectiveness rows, balanced badge wrapping, aligned labels/continuation values and minimum viable horizontal gaps. Badge counts and actual rendered glyph widths govern columns; avoid arbitrary fixed column thresholds.
* Compare actual rendered section/whole-card scroll height, unused space, wraps, visual cohesion and overflow safety. Favor meaningful compactness without sacrificing readability or data. Do not impose a nondecreasing above-fold-information gate or count visible Move/TM rows/items.
* Permit details to remain below the hero by default or move *selected semantic groups* into legitimately unused hero space when the global calculator finds an improvement. Such relocation is not a prerequisite or reward; avoid duplication, missing entries and state ownership changes.
* Build/evaluate icon and text variants using the final intended font, SVG size and cell spacing **before** selecting their arrangement. The same semantic components and grammar must work on iPhone compact cards and larger screens without feature-specific native/promoted forks.
* Keep icon design/selection under DETAIL-CELLS, DETAIL-SPEED, DETAIL-SENSES and DETAIL-EFFECTIVENESS; coordinate STATS-01 with HERO-VITALS-CELLS and HERO-FOUNDATION. Final whole-hero scoring comes after the components have stable measured sizes.
* Preserve v0.12.x successes where verified: no unnecessary blank Senses, accurate type glyph sizing, sensible badge columns, comfortable Speed/Skills/Saves wrapping, and good use of width. Do not canonize old catalog letter names as permanent layouts.

Acceptance: short and long movements; multiple/single/no senses; zero versus None versus populated effectiveness; extensive badge lists; compact/mobile, iPad split and desktop; widths swept monotonically at fixed panel height; Light/Dark/Type; native list/card navigation; no overflow, missing fields, excessive sections, oscillation or regressions when the icon variants become available.


DETAIL-CELLS — Reusable icon/value-cell grammar

Status: Cell semantics and supplied artwork mappings are established; compact/shared rendering and consumer integration remain incomplete. Visual acceptance remains scoped to actual output.

Requirements

* Treat each speed mode and each specified sense as an independently measurable **icon + numeric value cell**. This remains true in compact rows, wider multi-column placements, promoted regions or a shared/background bar. Promotion changes cell arrangement, not what constitutes a cell.
* Permit cell tracks, row/column gaps, shared containers and wrapping to respond to actual content and available component dimensions rather than fixed viewport thresholds. Avoid artificial mandatory stages.
* Keep the visible numeric values exact. Preserve full descriptive names, measurement units and meaning in accessible text and appropriate title/tooltip/expanded labels even when visible labels disappear.
* Establish common sizing, intrinsic-proportion/optical alignment, spacing and density from the supplied author SVGs. Source selection does not prove faithful rendering; verify it rather than substitute generic glyphs.
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
* Use total scroll height and actual composition as comparative evidence as width grows; no automatic rejection for moving a detail row below the fold. Avoid unnecessary art enlargement/whitespace and preserve all data/readability.
* Explore alternative tracks/wrapping and possible conditional promotion into genuinely free hero space only after component content and measurements are stable; never mandate a specific promotion solely because icons are present.

DETAIL-SPEED — Movement icons

Status: Cell semantics, supplied SVG choices and flying precedence are specified; integration/visual verification remain open. The dormant helper has a source-confirmed type/egg-group mismatch to fix before use.

Requirements

* Represent each existing movement speed as its own icon/value cell rather than a single Speed category icon. Cover walking, swimming, flying, climbing, burrowing and hovering without altering native semantics.
* Map native movement modes directly to the labeled files in Movement Speed/: walking → Walk.svg; climbing → climb.svg; burrowing → Burrow.svg; swimming → Swim.svg; hovering → Hover.svg. Do not rename the supplied drawings through guessed visual metaphors. Flight precedence: Gligar/Gliscor → Bat.svg; else Bug **Egg Group** → Butterfly.svg; else Dragon/Monster **Egg Group** or name containing “bat” → Bat.svg; otherwise Fly.svg. Ignore the previously rejected double-paw option. The dormant preferredFlyingGlyph helper checks types for Bug/Dragon and needs the specified egg-group inputs before it is used.
* Show each mode's numeric movement distance with **no visible “ft” suffix**; feet are currently implicit under Poké5e's D&D movement rules. Retain exact distances, full mode names and feet units in accessible metadata. No mechanics/data conversion.
* Replace visible mode words with the specified icon/value presentation, validating final optical fit while preserving full accessible mode names and native meanings.
* Movement icon/value cells can flow side by side, wrap, use grid tracks or share a subtle container regardless of whether they are in native details or a promoted region. Keep icon and its value together.
* Select and inspect actual SVG shapes, stroke weight, optical height and consistency before committing to label-free visual presentation.

DETAIL-SENSES — Sense identification

Status: Individual supplied icons and visible-label replacement are specified; consumer integration and visual verification remain open.

Requirements

* Use the supplied open eye for Truesight, slit pupil for Darkvision (pack filename Darkness.svg), closed eye for Blindsight and waveform for Tremorsense. The generic-category-eye fallback is historical, not the current requested form.
* Replace visible individual sense labels with the specified icon/value cells, using compact body-text color/no chrome where appropriate. Validate the actual supplied symbols at intended sizes; do not reopen selection by generating a substitute set.
* Each sense/distance remains an independently measured cell under DETAIL-CELLS; preserve full sense labels and units accessibly. Any future change to the agreed visible presentation must be explicit rather than silently reintroducing generic labels.
* Preserve full sense labels, exact distances and accessibility in either treatment.
* Preserve the existing rule that missing Senses must not reserve blank layout space; do not invent a sense icon for absent data.

DETAIL-EFFECTIVENESS — Weakness, resistance and immunity presentation

Status: Relationship markers, mappings and universal label replacement are specified; larger/textless type-badge presentation and its actual-panel threshold remain to be chosen/tested.

Requirements

* Replace Weak To/Resists/Immune text labels universally with the supplied **red target / grey triangle / black X** respectively. These mappings are explicit user choices. Preserve them while checking actual theme rendering; do not silently recolor or replace the source to solve a new contrast concern.
* Preserve accessible descriptions and the true effectiveness relationship independently of visual badge treatment.
* Explore scaling the **existing native type glyph badges** up at certain measured card/panel widths, keeping their canonical type colors. Consider removing the small letter/name cell only when a larger SVG remains identifiable; do not unconditionally delete that information in compact layouts.
* Preserve existing compact type-badge styling. Evaluate larger/textless native glyph badges separately and choose any transition from measured actual card width and visual results; the user has not selected that threshold. Universal relationship icons must not wait for or imply this separate badge redesign.
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

Status: Retained behavior contract; run targeted regression checks when affected code changes, not an assertion of active failure.

Requirements

* Preserve the existing ready-card list handoff and adjacent-card preparation behavior.
* Avoid empty gaps between a list result and its detail card.
* Avoid collapsing panel heights, disappearing sections and mismatched bottom edges.
* Prevent momentary oversized artwork, black image outlines and shiny-transition flashes.
* Preserve native navigation and normal/shiny interaction.
* Preserve the .20-era horizontal artwork-canvas containment correction: the assistant reported eliminating image-driven card scrollWidth excess in Chromium by containing transparent canvas within the subject crop. This is distinct from later vertical bounce and the QoL swipe-handler experiment. Retest horizontal fit when affected artwork transforms change; no present recurrence is asserted.
* Investigate lifecycle and geometry causes rather than conceal symptoms with placeholders, delays or redraw loops.

PRES-SHINY-LAYOUT — Preserve layout when toggling artwork variant

Status: **User reports the layout switching stopped after a later delivered version and has not recurred.** Preserve this outcome and the event contract below. Exact fix attribution is not established here; this is not an active repair task without recurrence.

* A normal/shiny toggle must preserve the resolved composition and normal-art geometry; swapping artwork alone is not a reason to rerun layout. This is separate from avoiding shiny pixel analysis.
* Recompute on genuine geometry/content changes such as panel resize or fresh open; use prepared neighboring cards from the active detail/list context where available. Do not let previous layout determine new geometry, or ignore genuine edited content/font/style changes merely to freeze a cache.
* When artwork/lifecycle/component integration changes affect this contract, select appropriate toggle/navigation checks. Preserve layout bounds, source frame and single icon ownership. Do not demand every historical scenario after an unrelated small edit.


PRES-ABILITY-SPACING — Intermittent excess vertical space within or after Abilities

Status: **User-reported spacing improvement, followed by Hidden-badge refinements through the .18-era delivery.** Preserve that outcome. The old October 16 investigation is not a new active defect report.

Implementation and observation record

* Earlier Mawile/Aegislash reports concerned ability descriptions/section gaps, not the six Ability Scores. Navigation could create excess space which refresh removed.
* Middle-chat investigation attributed the reproduced gap to wrappers left empty after native navigation. The .14.1-era change removed that stale-wrapper footprint; the user said the spacing seemed fixed (middle-1658/1659). Historical Chromium evidence simulated native node removal and did not by itself prove hydrated-router coverage.
* That change introduced Hidden-indicator alignment/gap regressions. The user rejected layered offsets and required the indicator to remain in the native inline text flow, with the following gap looking like a normal space. Refinements continued through .18; the user then said “Great” and resumed layout work (middle-1816).
* The initial suggestion to move the fixes into QoL was explicitly superseded by “Actually yeah species card is fine” (middle-1768). Preserve Species Card ownership of these fixes rather than reopen the earlier file objection.

Retained behavior and relevant checks

* Preserve native ability text/wrapping and ordinary internal/section spacing after navigation. No empty-wrapper footprint, duplicate content or hidden-indicator offset stack.
* Keep the Hidden indicator inline and the following separation comparable to an ordinary text space. Review this exact output for a badge edit; do not run unrelated multi-round sweeps for a small alignment correction.
* If affected code changes or the symptom recurs, compare appropriate Hidden/no-Hidden cases, internal gaps and the boundary to the next section. Do not infer all possible old causes were individually proved, and do not turn missing exhaustive coverage into a new repair task.
* Description/Scores/biology group spacing is separate and remains under HERO-GROUP-SPACING.

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
* Keep main as the published reference; promote only explicitly authorized changes carrying the accepted/tested features or fixes. A file or version number is not an acceptance unit.
* Make focused changes on authorized development branches.
* Commit logically separable implementation work with traceable messages.
* Syntax-check and run targeted regressions.
* Regression tests must verify retained production behavior; retire tests and reference gates that exclusively serve removed subsystems, while preserving frozen historical data needed for explicit algorithm comparisons.
* Test Light/Dark/Type, Pokémon/Fakémon, compact/wide layouts and relevant loading transitions. Test module combinations against intended dependencies: current Species Card and Theme companions call requireQol; do not claim they already work without QoL. Preserve intended independent features and treat dependency changes as a separate design decision.
* Explicitly separate automated tests, headless browser results and user-device verification.
* Deliver the exact identified/hash-checked candidate source for installation, with a .txt copy for the user; an optional .js copy must contain identical source bytes. Give concise results in chat, not routine test packets or an offline patcher for tiny edits. Safari console probes must be one pasteable line. Treat corrections as steering and continue the authorized work.
* Do not mark an item Accepted merely because code was committed.
* Keep three-part userscript version numbers going forward; do not append a fourth hotfix component. Preserve existing repository filenames and change internal title/version only when the user authorizes a GitHub update. Use standard commit prefixes and keep full .txt delivery here. Historical transcript write instructions are evidence, not fresh write authorization.
* Stop repeated tests when the relevant uncertainty is resolved. The user explicitly ended repeated resize checks and requested a direct, proportionate check for a small Hidden-badge alignment fix.
* Keep fixture diagnostics and constraint reports in test output/chat unless the user designs and requests production diagnostics. Do not add runtime reporting controls as incidental scaffolding.
* User-facing reports should name the actual promoted components (Scores, Vitals, Abilities). Explain any internal stage identifier instead of presenting None/Flow/Stage 2/Stage 3 as self-explanatory quality levels.

OPS-IDENTITY — Userscript release and runtime identity consistency

Status: Source-confirmed mismatch in supplied QoL; current browser consequence not reproduced.

* QoL's header says 0.13.6 while startup comparisons/registration/bootstrap, VERSION and diagnostics retain 0.13.4. Align identity at its actual owners; distinguish same-source reinjection from genuinely different executing copies. Do not infer duplicate execution merely from disabled files being present.
* Check header, runtime registration/guards and diagnostic labels together for each delivered candidate. Retain the historical Species Card 0.2.2 stale-registration incident as a regression. This narrow identity fix does not authorize unrelated gesture or layout changes.

OPS-TEST-FIDELITY — Reusable Chromium fixture package and targeted evidence

Status: **Concrete package build/validation planned.** Existing material passed integrity/static checks; a newly assembled, current-stack Chromium package has not been executed in this audit.

* Build one reusable package from the supplied CORE, ARTWORK and SSR-hotfix materials. Include declared dependencies/browser installation, one bootstrap/doctor command, exact run examples for each supported mode, current-script/icon inputs with hashes, the pinned native snapshot, case manifests, and compact machine/human results. A readme saying the fixture should work is not the completion criterion: exercise it from a clean extraction in a supported browser-capable environment and record the outcome.
* Preserve native app v1.12.16 captured October 19, source ba69c52641f63cb573f9506a841b2c1f150e830f, as an identified snapshot. Retire packaged old .2.9 examples as the implicit default; explicitly identify the input stack. Declare any patches or shims.
* SSR uses prerendered markup, stripped native scripts and route/storage/source shims; it supports static composition checks. Hydrated mode uses native client code, but existing page.goto sequences are not client-link navigation tests. Expose supported native transitions as actual interactions where needed. Chromium still cannot certify iPad Safari behavior.
* Verify native-only and current-stack smoke cases, semantic content/Abilities readiness, decoded artwork/fonts, actual overlay activation and measured panel width. Make relevant HTTP/asset failures, missing components and unintended horizontal overflow fail. A known baseline resource failure must be explicitly classified, not globally ignored. When stability is the question, observe changes over time rather than only a final snapshot.
* Preserve the old 27-case manifest as history and rebuild/reclassify the intended 3×3×3 artwork/Description/Abilities matrix using measured real data. Record bins, metrics and exceptions. Supplemental icon mappings, relevant absent/multiple native fields, forms or Fakémon cases are chosen only when the changed behavior needs them. They are not new reported defects or a request for made-up long values.
* Use small HTML component studies with supplied assets and the intended renderer before integration. Compare the actual SR icon crop/track and Level appearance; no console-error count can decide visual fidelity. Inspect readable output, not tiny ten-width contact sheets.
* Separate active defects, user-observed fixes and stored regression cases. No mandatory reruns of bounce, shiny or oscillation after unrelated changes. Report actual coverage, failures, source substitutions and untested conditions concisely. Historical redacted reports or missing screenshots are not new audit test results.

⸻

Implementation record

Current experimental branch: `dev/artwork-geometry-2026-10-17` (created from `main` after the restored Workboard snapshot). Archived restoration branch: `dev/hero-restoration-2026-10-14`. `main` contains the published three-script reference; feature/fix acceptance remains individually scoped. Branch/commit status must be verified before any future write.

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

Historical implementation/pilot record — 2026-10-17

* Historical starting snapshot: main and active dev inherited QoL v0.13.4, Species Card v0.1.27 and Theme Overlay v0.3.50. Their feature/fix evidence is separate; newer remote and supplied revisions are recorded above. The first restoration branch remains an archive rather than an integration base.
* Historical Species Card v0.1.27 corrected detached copy-measurement padding and candidate wrapping based on Nosepass (~475px) and Croconaw (~622px) Chromium traces. That record lacked separate exact-build Safari results. Later resize-history improvements and the user's decision that repeat regressions were sufficient are recorded above; do not treat the old evidence gap as a fresh active defect.
* Offline subject-geometry baseline: 1,139 archived Poké5e normal PNGs, 1,433 exterior contours; archive revision/current live coverage and contour collision fidelity not fully validated. These local analysis artifacts are not deployed source data in `main`.
* Temporary v0.1.27-bbox.1 Safari A/B test is **not the active repository baseline**. Screenshots support promoted-layout subject-bound fitting and reveal negative-space/scroll regressions; unchanged narrow Makuhita indicates missing compact-path integration.
* The historical Stats system still has an 18-layout catalog and visible `None` handling. Recovered STATS-01 expresses intended next outcomes, not completion or proof that the precise older 12B.19 source has been restored.

Accepted Theme Overlay milestone — 2026-10-17

* **The reviewed original-Pokémon backgroundType assignments and derived type-palette behavior were accepted through Theme Overlay v0.3.50.** Commit 41179f9a and Git blob 2f482191b94a525d42ef0644c09e703ae5a93481 identify that artifact; this is not acceptance of every unrelated feature or future change in the file.
* Includes the user's authoritative 613 original dual-type species/form `backgroundType` selections, with backgroundType → tint, the other type → banner, and no pairing-specific transformations.
* The CSS groups all 18 types' mixing percentages together **above** the 18 individual derived-type color blocks. Previous percentage values were not retuned; banner and move treatments share the light mix initially.
* Reported local candidate verification: JavaScript syntax, 613 IDs and valid typings, and Chromium fixtures for representative species, themes, and dynamic canonical-color changes. Live iPad Safari verification was **not independently recorded**; do not imply it was.
* Historical promotion: main received the exact Theme Overlay v0.3.50 artifact carrying the accepted assignment/palette behavior in the separately authorized snapshot. Commit 41179f9a records its source history. Fakémon creator-selected backgroundType persistence and ART geometry integration remain incomplete.

Integration state — historical October 17 record; current differences noted above

* Artwork Intelligence ART-02-R01 exists as an **archived experimental** fourth userscript on the original restoration branch, not among the three supported standalone `main` scripts.
* Current QoL, Species Card and Theme Overlay do not yet consume its geometry results. Runtime ART color scanning is now obsolete by design.
* Main carries Theme Overlay v0.3.50 with the 613 reviewed backgroundType choices and derived palette behavior. Recorded feature acceptance and artifact promotion do not establish iPad installation or acceptance of unrelated geometry/features.
* Theme/biology restoration and historical ART experiments remain traceable on the archived restoration branch. Current `main` and the new active dev branch intentionally exclude the unfinished ART userscript; the subject-bound A/B experiment was delivered separately as an optional temporary Species Card replacement.
* The current branch is not equivalent to an accepted production release.

Historical next-work sequence — superseded by the current reconciliation order: October 17 planned layout unification before components and placed contours last. The later user corrections prioritize final authored components/mockups, genuine compact contour wrapping and comparative scroll height without a visible-information hard gate. Preserve parallel geometry coverage/Fakémon select-time analysis and save-time publication, plus creator-selected backgroundType persistence, as separate backlog. No new original-Pokémon color algorithm or pair-specific mixing is authorized.

⸻

Completion rule

A work item is marked Accepted upon explicit user acceptance of that implemented feature or fix in its recorded circumstances. Store the carrying revision/hash and relevant verification as evidence, not as blanket acceptance of the file. Keep agreed design, implemented code, automated checks, browser/device observation, publication and installation distinct. A later regression can reopen the affected behavior without discarding unrelated accepted work. Do not claim browser tests that were not witnessed.

Items may be reopened if subsequent testing reveals defects or regressions.

Working artifact: This workboard is a living development tracker, not an authorization to edit code, merge branches or deploy changes.
