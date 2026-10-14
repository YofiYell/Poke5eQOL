// ==UserScript==
// @name         Poke5e Species Card v0.1.18 (Ready Card List Handoff)
// @namespace    yofi.poke5e.species.card
// @version      0.1.18
// @description  Pokemon/Fakemon adaptive card presentation with direct native navigation.
// @match        https://poke5e.app/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  // Shared startup protocol, independent of module release versions. Each
  // userscript carries this small bootstrap; only the first copy installs it.
  const modules = window.__yofiUserscripts || (window.__yofiUserscripts = (() => {
    const records = new Map();
    const waiting = new Map();
    const reportedConflicts = new Set();
    let reportQueued = false;
    let ready = false;
    const readyEvent = 'yofi:qol-ready';
    function notice(id, message) {
      const show = () => {
        let node = document.getElementById(id);
        if (!node) {
          node = document.createElement('div');
          node.id = id;
          node.setAttribute('role','alert');
          node.style.cssText = 'position:fixed;z-index:2147483647;left:50%;top:50%;transform:translate(-50%,-50%);box-sizing:border-box;width:max-content;max-width:calc(100vw - 32px);padding:16px 20px;background:#451c20;color:white;font:600 14px/1.4 system-ui;border:2px solid #ffc0c0;border-radius:9px;box-shadow:0 3px 12px #0006;text-align:center';
          document.body.appendChild(node);
        }
        node.textContent = message;
      };
      if (document.body) show();
      else document.addEventListener('DOMContentLoaded',show,{once:true});
    }
    function report() {
      discover();
      conflicts();
      console.info('[Poké5e userscripts] Versions detected on this page:');
      console.table([...records.values()].map(({module,version,status}) => ({module,version,status})));
    }
    function scheduleReport() {
      if (reportQueued) return;
      reportQueued = true;
      setTimeout(() => { reportQueued = false; report(); },0);
    }
    function discover() {
      const core = window.__yofiQolBootstrapStatus;
      const add = (module,version,status = 'running') => {
        const key = `${module}:${version}`;
        if (!records.has(key)) records.set(key,{module,version,status});
      };
      if (core && core.phase !== 'failed') add('QoL',core.version || 'unknown legacy version',core.phase === 'running' ? 'running' : core.phase);
      else if (window.__yofiPoke5eQol01020) add('QoL','unknown legacy version');
      const species = window.__yofiSpeciesCard || window.__yofiHeroLayoutLab;
      if (typeof species === 'string') add('Species Card',species);
      for (const key of Object.getOwnPropertyNames(window).filter(name => /^__p5ThemeOverlay\d+$/.test(name))) {
        const overlay = window[key];
        let version = overlay?.version;
        if (!version) { try { version = overlay?.diagnose?.().version; } catch (_) {} }
        if (version) add('Theme Overlay',version);
      }
    }
    function conflicts() {
      const groups = new Map();
      for (const {module,version} of records.values()) {
        if (!groups.has(module)) groups.set(module,[]);
        groups.get(module).push(version);
      }
      const duplicates = [...groups].filter(([,versions]) => versions.length > 1);
      if (!duplicates.length) return;
      const details = duplicates.map(([module,versions]) => `${module}: ${versions.join(', ')}`).join('; ');
      if (!reportedConflicts.has(details)) {
        reportedConflicts.add(details);
        const message = `Multiple userscript versions detected. ${details}. Disable the extra copies and reload this page.`;
        console.error('[Poké5e userscripts]',message);
        notice('yofi-userscript-version-conflict',message);
      }
    }
    function register(module, version) {
      discover();
      const key = `${module}:${version}`;
      let record = records.get(key);
      if (!record) {
        record = {module,version,status:'starting'};
        records.set(key,record);
      }
      conflicts();
      scheduleReport();
      return record;
    }
    function status(record, value) { record.status = value; scheduleReport(); }
    function publishReady() {
      ready = true;
      for (const [record,start] of waiting) {
        waiting.delete(record);
        document.getElementById(`yofi-${record.module.replace(/\s+/g,'-').toLowerCase()}-missing-qol`)?.remove();
        queueMicrotask(() => {
          if (record.module === 'Species Card' && window.__yofiSpeciesCard === record.version) {
            status(record,'running'); return;
          }
          const active = [...records.values()].find(row => row.module === record.module && row.version !== record.version && row.status === 'running');
          if (active) { status(record,'blocked: another copy is active'); return; }
          try { status(record,start() === false ? 'blocked' : 'running'); }
          catch (error) { status(record,'failed'); console.error(`[Poké5e ${record.module}] Startup failed:`,error); }
        });
      }
    }
    function detectQol() {
      const core = window.__yofiQolBootstrapStatus;
      // Legacy names are presence signals, not release-version requirements.
      if (core?.phase === 'running' || (!core && window.__yofiPoke5eQol01020 && window.__yofiQolRecover)) {
        const record = register('QoL',core?.version || 'unknown legacy version');
        status(record,'running');
        publishReady();
      }
      return ready;
    }
    function requireQol(record, start) {
      status(record,'waiting for QoL');
      waiting.set(record,start);
      if (ready || detectQol()) { publishReady(); return; }
      const check = () => {
        if (!waiting.has(record) || detectQol()) return;
        if (record.status === 'missing QoL') return;
        status(record,'missing QoL');
        const message = `${record.module} requires QoL. Enable one QoL userscript and reload this page.`;
        console.error(`[Poké5e ${record.module}]`,message);
        notice(`yofi-${record.module.replace(/\s+/g,'-').toLowerCase()}-missing-qol`,message);
      };
      // A task after DOMContentLoaded lets document-end scripts register too.
      if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded',() => setTimeout(check,0),{once:true});
      else setTimeout(check,0);
    }
    document.addEventListener(readyEvent,publishReady);
    window.addEventListener('load',detectQol,{once:true});
    return {register,status,requireQol,report,notice,ready:publishReady};
  })());
  const registration = modules.register('Species Card','0.1.18');
  modules.requireQol(registration,runSpeciesCard);
  function runSpeciesCard() {
  // Standalone companion. Disable earlier Hero Layout Lab builds, not the QOL script.
  // Older editions used a shared boolean lock. Silently returning was the
  // reason a stale adapter could suppress an updated one with no indication.
  // Do not run two DOM-manipulating adapters concurrently: they compete for
  // the same nodes and both install recurring timers.
  if (window.__yofiHeroLayoutLab) {
    const active = window.__yofiHeroLayoutLab;
    console.error('[Species Card v0.1.18] Conflicting adapter is already active:',
      active, 'Disable ALL earlier Hero Layout Lab / Adapter userscripts and reload.');
    modules.notice('yofi-userscript-version-conflict','Species Card conflict: disable extra Hero Layout Adapters / Species Card userscripts and reload.');
    return false;
  }
  window.__yofiHeroLayoutLab = '0.1.18';
  window.__yofiSpeciesCard = '0.1.18';

  const VERSION = '0.1.18';
  const STYLE_ID = 'yofi-species-card-hero-css';
  const PREPARE_EVENT = 'yofi:species-card-prepare-before-reveal';
  const PRE_REVEAL_EVENT = 'yofi:species-card-before-reveal';
  const LIVE_CARD_SELECTOR = '.page > main article';
  const processedSpeciesIdentities = new WeakMap();
  const portraitSources = new WeakMap();
  const portraitLayoutRatios = new WeakMap();
  const portraitLoadHandlers = new WeakMap();
  const MAX_ENCOUNTER_LEVEL = 20; // Current level-range display assumption.
  const ICON = {
    hp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>',
    ac: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>',
    sr: "<svg class=\"lab3-custom\" data-icon=\"sr\" aria-hidden=\"true\" viewBox=\"0 0 2732 2048\" version=\"1.1\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:8.05233;\"><g transform=\"matrix(0.780549,0,0,1.60883,938.241,-435.607)\"><rect x=\"551.876\" y=\"68.465\" width=\"1634.26\" height=\"1677.57\" style=\"fill:none;\"/><clipPath id=\"_clip1\"><rect x=\"551.876\" y=\"68.465\" width=\"1634.26\" height=\"1677.57\"/></clipPath><g clip-path=\"url(#_clip1)\"><g transform=\"matrix(2,0,0,1,-2186.14,0)\"><path d=\"M1307.42,683.317C1307.42,683.317 1383.38,663.042 1466.9,680.691C1550.43,698.341 1627.92,740.317 1627.92,740.317C1627.92,740.317 1733.87,608.846 1826.11,536.455C1922.57,460.751 2046.59,382.669 2075.57,411.736C2090.67,426.882 1976.16,580.864 1889.38,666.801C1799.65,755.666 1745.63,776.613 1692.75,814.177C1692.75,814.177 1731.64,895.555 1720.4,944.53C1694.87,1055.75 1744.57,1095.69 1745.69,1171.25C1748.2,1340.75 1477.43,1423.46 1350,1418.6\" style=\"fill:none;stroke:currentColor;stroke-width:136px;\"/></g></g></g><g transform=\"matrix(-0.780549,0,0,1.60883,1799.77,-435.607)\"><rect x=\"551.876\" y=\"68.465\" width=\"1634.26\" height=\"1677.57\" style=\"fill:none;\"/><clipPath id=\"_clip2\"><rect x=\"551.876\" y=\"68.465\" width=\"1634.26\" height=\"1677.57\"/></clipPath><g clip-path=\"url(#_clip2)\"><g transform=\"matrix(2,0,0,1,-2186.14,0)\"><path d=\"M1307.42,683.317C1307.42,683.317 1383.38,663.042 1466.9,680.691C1550.43,698.341 1627.92,740.317 1627.92,740.317C1627.92,740.317 1733.87,608.846 1826.11,536.455C1922.57,460.751 2046.59,382.669 2075.57,411.736C2090.67,426.882 1976.16,580.864 1889.38,666.801C1799.65,755.666 1745.63,776.613 1692.75,814.177C1692.75,814.177 1731.64,895.555 1720.4,944.53C1694.87,1055.75 1744.57,1095.69 1745.69,1171.25C1748.2,1340.75 1477.43,1423.46 1350,1418.6\" style=\"fill:none;stroke:currentColor;stroke-width:136px;\"/></g></g></g></svg>",
    lvl: "<svg class=\"lab3-custom\" data-icon=\"lvl\" aria-hidden=\"true\" viewBox=\"0 0 2732 2048\" version=\"1.1\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;\"><g transform=\"matrix(1.85848,0,0,1.85848,-348.36,-581.1)\"><g transform=\"matrix(1,0,0,0.577261,-929.306,231.046)\"><path d=\"M1707.67,1033.77L1707.67,1713.39C1707.67,1809.93 1662.42,1888.31 1606.69,1888.31L1404.74,1888.31C1349.01,1888.31 1303.76,1809.93 1303.76,1713.39L1303.76,1033.77C1303.76,937.228 1349.01,858.848 1404.74,858.848L1606.69,858.848C1662.42,858.848 1707.67,937.228 1707.67,1033.77ZM1623.36,1033.77C1623.36,1017.83 1615.89,1004.89 1606.69,1004.89L1404.74,1004.89C1395.54,1004.89 1388.07,1017.83 1388.07,1033.77L1388.07,1713.39C1388.07,1729.33 1395.54,1742.27 1404.74,1742.27L1606.69,1742.27C1615.89,1742.27 1623.36,1729.33 1623.36,1713.39L1623.36,1033.77Z\"/></g><g transform=\"matrix(1,0,0,0.756814,-607.276,-108.005)\"><path d=\"M1707.67,992.27L1707.67,1754.89C1707.67,1828.53 1662.42,1888.31 1606.69,1888.31L1404.74,1888.31C1349.01,1888.31 1303.76,1828.53 1303.76,1754.89L1303.76,992.27C1303.76,918.632 1349.01,858.848 1404.74,858.848L1606.69,858.848C1662.42,858.848 1707.67,918.632 1707.67,992.27ZM1623.36,992.27C1623.36,980.111 1615.89,970.239 1606.69,970.239L1404.74,970.239C1395.54,970.239 1388.07,980.111 1388.07,992.27L1388.07,1754.89C1388.07,1767.05 1395.54,1776.92 1404.74,1776.92L1606.69,1776.92C1615.89,1776.92 1623.36,1767.05 1623.36,1754.89L1623.36,992.27Z\"/></g><g transform=\"matrix(1,0,0,0.943775,-289.828,-461.045)\"><path d=\"M1707.67,965.839L1707.67,1781.32C1707.67,1840.37 1662.42,1888.31 1606.69,1888.31L1404.74,1888.31C1349.01,1888.31 1303.76,1840.37 1303.76,1781.32L1303.76,965.839C1303.76,906.789 1349.01,858.848 1404.74,858.848L1606.69,858.848C1662.42,858.848 1707.67,906.789 1707.67,965.839ZM1623.36,965.839C1623.36,956.089 1615.89,948.172 1606.69,948.172L1404.74,948.172C1395.54,948.172 1388.07,956.089 1388.07,965.839L1388.07,1781.32C1388.07,1791.07 1395.54,1798.99 1404.74,1798.99L1606.69,1798.99C1615.89,1798.99 1623.36,1791.07 1623.36,1781.32L1623.36,965.839Z\"/></g><g transform=\"matrix(1.0973,0,0,1,-121.914,-217.084)\"><path d=\"M1476.98,1473.82L1476.98,1516.73C1476.98,1528.57 1468.22,1538.18 1457.43,1538.18L394.007,1538.18C383.217,1538.18 374.456,1528.57 374.456,1516.73L374.456,1473.82C374.456,1461.98 383.217,1452.37 394.007,1452.37L1457.43,1452.37C1468.22,1452.37 1476.98,1461.98 1476.98,1473.82Z\"/></g></g></svg>",
    egg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22c-5.3 0-8.1-3.2-8.1-7.5C3.9 8.8 7.5 2 12 2s8.1 6.8 8.1 12.5C20.1 18.8 17.3 22 12 22Z"/></svg>'
  };


  // QOL v0.12.25 species presentation CSS, moved verbatim. This stylesheet is
  // independent from the theme overlay; it owns geometry, not theme colors.
  const SPECIES_CONTENT_CSS = String.raw`/* Extracted, unchanged from QOL v0.12.25; card-content geometry only. */

/* Shared score/heading geometry. The original native h2 ::before
       draws the angled background for BOTH Scores and lower section titles.
       At CARD width <550px use a tight compact cut; otherwise retain
       the native 2em inset. Scores and h2 use the same pseudo edge. */

article.yofi-scores-layout section.stats { container-type: inline-size; }

article.yofi-scores-layout .yofi-scores-banner {
      position: relative;
      isolation: isolate;
      display: grid;
      place-items: center;
      box-sizing: border-box;
      width: 100%;
      margin-inline: 0;
      padding: .38em 0;
      margin-block: 1.2em .85em;
      color: #fff;
    }

article.yofi-scores-layout .yofi-scores-banner > h2 {
      position: absolute;
      z-index: 1;
      inset: 0;
      display: flex;
      align-items: center;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      margin: 0 !important;
      padding: 0 !important;
      pointer-events: none;
    }

article.yofi-scores-layout.yofi-score-compact-edge section h2::before {
      right: .42em !important;
    }

article.yofi-scores-layout dl.yofi-scores-strip {
      position: relative;
      z-index: 2;
      display: grid !important;
      grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
      grid-template-rows: auto auto !important;
      grid-auto-flow: column !important;
      column-gap: 0 !important;
      align-items: center;
      justify-self: center;
      box-sizing: border-box;
      width: 85% !important;
      max-width: 44rem !important;
      min-width: 0;
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      font-size: clamp(.58rem, 3.8cqi, 1.04rem) !important;
      line-height: 1.25;
      text-align: center;
    }

/* Compact: size each DT/DD pair as one content-wide column. Position
       STR at the description gutter and CHA at the established safe end;
       distribute the four middle pairs across the intervening space.
       This avoids one narrow first track followed by five oversized ones. */

article.yofi-scores-layout.yofi-score-compact-edge dl.yofi-scores-strip {
      justify-self: start !important;
      justify-content: space-between !important;
      grid-template-columns: repeat(6, max-content) !important;
      width: min(100%, calc(100% - 1.45em), 44rem) !important;
      margin-inline-start: 0 !important;
    }

/* Wider: centered grid, with safe space at the native 2em cutoff. */

article.yofi-scores-layout:not(.yofi-score-compact-edge) dl.yofi-scores-strip {
      width: min(85%, calc(100% - 6em), 44rem) !important;
      font-size: clamp(.58rem, 3.4cqi, 1.04rem) !important;
    }

/* The native saves field uses .upper; its empty value should read None,
       while actual saving throw abbreviations remain uppercase. */

article.yofi-scores-layout :is(section.skills, .yofi-scores-skills) dd.upper.yofi-empty-saves {
      text-transform: none !important;
    }

/* Render ALL, not All, while leaving normal save abbreviations uppercase. */

article.yofi-scores-layout .yofi-scores-skills dd.upper.yofi-all-saves {
      text-transform: uppercase !important;
    }

article.yofi-scores-layout .yofi-scores-heading-label { display: none; }

@container (min-width: 768px) {
      article.yofi-scores-layout .yofi-scores-banner > h2 .yofi-scores-heading-label {
        display: inline;
      }
    }

article.yofi-scores-layout dl.yofi-scores-strip > :is(dt,dd) {
      grid-area: auto !important;
      min-width: 0;
      padding: 0 !important;
      margin: 0 !important;
      color: #fff !important;
      background: transparent !important;
      border: none !important;
      white-space: nowrap !important;
      font-size: inherit !important;
    }

article.yofi-scores-layout dl.yofi-scores-strip > dt { font-weight: 700; text-transform: uppercase; }

article.yofi-scores-layout dl.yofi-scores-strip > dt::after { content: none !important; }

article.yofi-scores-layout .yofi-species-stats-body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: .75em clamp(.65em, 2cqi, 1.5em);
      align-items: start;
      width: 100%;
      min-width: 0;
    }

article.yofi-scores-layout .yofi-species-stats-body > * { min-width: 0; }

article.yofi-scores-layout .yofi-species-stats-body > dl,
    article.yofi-scores-layout .yofi-scores-skills > dl,
    article.yofi-scores-layout .yofi-scores-types > dl {
      display: grid;
      grid-template-columns: max-content minmax(0, 1fr);
      column-gap: .5em;
      row-gap: .12em;
      margin: 0;
      font-size: var(--font-sz-venus, .9rem);
      line-height: 1.3;
      min-width: 0;
    }

article.yofi-scores-layout .yofi-species-stats-body :is(dt,dd) {
      margin: 0;
      white-space: normal;
      overflow-wrap: normal;
      word-break: normal;
      hyphens: none;
      min-width: 0;
    }

article.yofi-scores-layout .yofi-species-stats-body dt { font-weight: 700; }

article.yofi-scores-layout .yofi-species-stats-body dt:not(:empty)::after { content: ":"; }

article.yofi-scores-layout .yofi-species-stats-body .cap > dd { white-space: nowrap; }

article.yofi-scores-layout .yofi-scores-skills > dl { grid-template-columns: minmax(0, 1fr); }

article.yofi-scores-layout .yofi-scores-skills > dl > dd { margin-bottom: .5em; }

article.yofi-scores-layout .yofi-scores-types { display: none; }

article.yofi-scores-layout section.skills { margin-block-start: .9em; }

article.yofi-scores-layout section.skills .yofi-skill-summary-original { display: none !important; }

article.yofi-scores-layout.yofi-scores-wide .yofi-species-stats-body {
      grid-template-columns: minmax(0, .88fr) minmax(0, .97fr) minmax(0, 1.5fr);
    }

/* Conditional mobile 3-column layout. Each track uses its real content
       width, while the last may shrink to allow balanced type-badge rows.
       Distribute unused width as EQUAL gaps, rather than making the type
       column absorb all of the slack (especially visible on Arceus). */

article.yofi-scores-layout.yofi-scores-conditional-wide .yofi-species-stats-body {
      grid-template-columns: max-content max-content minmax(0, max-content);
      justify-content: space-between;
      column-gap: clamp(12px, 2.2cqi, 16px);
    }

article.yofi-scores-layout.yofi-scores-wide .yofi-scores-types { display: block; }

article.yofi-scores-layout.yofi-scores-wide section.skills { display: none !important; }

/* Equal-height colored icon and dark letter halves. The native badge
       determines overall height; its direct children stretch to that same
       cross-axis extent instead of using independent line-box heights. */

article.yofi-scores-layout :is(section.skills, .yofi-scores-types) .inline-type-name {
      display: inline-flex !important;
      align-items: stretch !important;
      vertical-align: baseline;
    }

article.yofi-scores-layout :is(section.skills, .yofi-scores-types) .inline-type-name > * {
      box-sizing: border-box !important;
      align-self: stretch !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-height: 0 !important;
    }

/* The Ice abbreviation I should use the same letter-cell width as the
       other single-letter type abbreviations. Do not resize whole badges. */

article.yofi-scores-layout .inline-type-name .name.yofi-ice-letter-cell {
      width: var(--yofi-type-letter-width, 1em) !important;
      min-width: var(--yofi-type-letter-width, 1em) !important;
      box-sizing: border-box !important;
    }

/* Align effectiveness badges into measured, balanced grid rows. Natural
       icon sizes and native colors remain unchanged; JS sets column count
       only for the currently visible source (native or wide summary). */

article.yofi-scores-layout .yofi-effectiveness-grid {
      display: grid !important;
      grid-template-columns: repeat(var(--yofi-effect-cols, 1), var(--yofi-badge-cell-width, max-content)) !important;
      grid-auto-flow: row !important;
      justify-content: start;
      align-content: start;
      align-items: end;
      gap: var(--yofi-effect-row-gap, .07em) .25em !important;
      box-sizing: border-box;
      min-width: 0;
      width: 100%;
      max-width: 100%;
    }

article.yofi-scores-layout .yofi-effectiveness-grid > dd {
      display: block;
      margin: 0 !important;
      padding: 0 !important;
      white-space: nowrap;
    }

/* Every detail field is a two-cell grid row (DT label, DD value).
       Use the SAME top alignment as Speed/Senses and Skills/Saves. Keep
       vertical spacing between rows on the DL, never as a badge-value
       margin or a baseline offset that shifts the effectiveness labels. */

article.yofi-scores-layout :is(section.skills, .yofi-scores-types) > dl {
      align-items: start;
      row-gap: .6em;
    }

article.yofi-scores-layout :is(section.skills, .yofi-scores-types) > dl > dt,
    article.yofi-scores-layout :is(section.skills, .yofi-scores-types) > dl > div {
      margin: 0;
    }

article.yofi-scores-layout :is(section.skills, .yofi-scores-types) > dl > div {
      line-height: 1.3;
    }

/* Without badges, flatten the native TypeEffectiveness wrapper so its
       DD (None) occupies precisely the same value cell as Skills: All.
       Badged values remain the existing balanced grids. */

article.yofi-scores-layout .yofi-effectiveness-values:not(.yofi-effectiveness-grid) {
      display: contents !important;
    }

@container (min-width: 520px) {
      article.yofi-scores-layout .yofi-scores-skills > dl { grid-template-columns: max-content minmax(0, 1fr); }
      article.yofi-scores-layout .yofi-scores-skills > dl > dd { margin-bottom: 0; }
    }

@container (max-width: 285px) {
      article.yofi-scores-layout .yofi-species-stats-body > dl { grid-template-columns: minmax(0, 1fr); }
      article.yofi-scores-layout .yofi-species-stats-body { column-gap: .65em; }
      article.yofi-scores-layout .yofi-species-stats-body > dl > dd,
      article.yofi-scores-layout .yofi-species-stats-body > dl > div { margin-bottom: .35em; }
    }

/* Universal stat-value rule, independent of adaptive layout and width. */

.page main article section.skills dd.yofi-stat-none-value,
    .page main article .yofi-species-stats-body dd.yofi-stat-none-value {
      font-size: .84em !important;
      line-height: inherit !important;
      text-transform: none !important;
    }

/* v0.12.2: shared half-row anchors; one measured/routed DOM candidate. */

article.yofi-scores-layout .yofi-species-stats-body {display:block!important;position:relative;width:100%;min-width:0}

article.yofi-scores-layout .yofi-species-stats-body > :is(dl,.yofi-scores-skills,.yofi-scores-types) {display:none!important}

/* If no adaptive candidate passes hard fit, retain native information
       instead of displaying an invalid layout or a previous species' data. */

article.yofi-scores-layout .yofi-species-stats-body.yofi12-native-fallback >
      :is(dl,.yofi-scores-skills,.yofi-scores-types) {display:block!important}

article.yofi-scores-layout .yofi-species-stats-body.yofi12-native-fallback >
      .yofi12-visible {display:none!important}

article.yofi-scores-layout .yofi12-stage {--yofi12-line:1.3em;--yofi12-field-gap:.35em;width:100%;min-width:0;font-size:var(--font-sz-venus,.9rem);line-height:1.3}

article.yofi-scores-layout .yofi12-probe {position:absolute!important;top:0;left:0;visibility:hidden!important;pointer-events:none!important}

article.yofi-scores-layout .yofi12-group {box-sizing:border-box;min-width:0;min-height:0}

article.yofi-scores-layout .yofi12-group[data-kind="row"] {display:grid;align-items:start;column-gap:12px}

article.yofi-scores-layout .yofi12-group[data-kind="col"] {display:flex;flex-direction:column;align-items:stretch;gap:0}

article.yofi-scores-layout .yofi12-divider {border-top:1px solid color-mix(in srgb,var(--skin-content-text,#333) 17%,transparent);margin-block:.42em;height:0}

article.yofi-scores-layout .yofi12-field {display:grid;grid-template-columns:var(--yofi12-label-track,max-content) minmax(0,1fr);column-gap:.45em;align-items:start;min-width:0;width:100%;line-height:var(--yofi12-line)}

article.yofi-scores-layout .yofi12-field > dt {font:inherit;font-weight:700;line-height:var(--yofi12-line);white-space:nowrap;margin:0}

article.yofi-scores-layout .yofi12-field > dt:not(:empty)::after {content:':' }

article.yofi-scores-layout .yofi12-value {min-width:0;display:flex;flex-direction:column;gap:0;line-height:var(--yofi12-line)}

article.yofi-scores-layout .yofi12-value > dd {display:block;min-width:0;margin:0!important;padding:0!important;line-height:var(--yofi12-line);word-break:normal;overflow-wrap:normal}

article.yofi-scores-layout .yofi12-field:is([data-key="speed"],[data-key="senses"]) dd {white-space:nowrap}

article.yofi-scores-layout .yofi12-value.yofi12-none > dd {font-size:.84em!important;line-height:inherit!important;text-transform:none!important;position:static!important;transform:none!important}

article.yofi-scores-layout .yofi12-field:has(> .yofi12-none) {align-items:baseline!important}

article.yofi-scores-layout .yofi12-title-above {display:flex;flex-direction:column;gap:.15em}

/* v0.12.6: every field/value line and every badge line shares one row.
       Equal-height badge halves are independent of icon SVG intrinsic height. */

article.yofi-scores-layout .yofi12-value.yofi12-badges {
      display:grid!important;
      grid-template-columns:repeat(var(--yofi12-cols,1),var(--yofi12-badge-width,max-content))!important;
      grid-auto-flow:row;grid-auto-rows:var(--yofi12-line);
      align-content:start;align-items:center;justify-content:start;
      row-gap:0!important;column-gap:.25em!important;min-width:0;width:100%;
    }

article.yofi-scores-layout .yofi12-value.yofi12-badges > dd {
      display:flex;align-items:center;align-self:center;margin:0!important;padding:0!important;
      height:var(--yofi12-line);white-space:nowrap;
    }

/* Consecutive effectiveness fields share the same text-row tracks.
       Their badge ink is shorter than a row, so the free space within each
       track provides visible separation without shifting later field rows. */

article.yofi-scores-layout .yofi12-value .inline-type-name {
      display:inline-flex!important;align-items:stretch!important;vertical-align:middle!important;
      height:1.04em!important;min-height:1.04em!important;max-height:1.04em!important;
      line-height:1!important;white-space:nowrap;overflow:hidden;
    }

article.yofi-scores-layout .yofi12-value .inline-type-name > * {
      box-sizing:border-box!important;display:inline-flex!important;align-self:stretch!important;
      align-items:center!important;justify-content:center!important;
      height:100%!important;min-height:0!important;max-height:100%!important;
      padding-top:0!important;padding-bottom:0!important;
      line-height:1!important;
    }

article.yofi-scores-layout .yofi12-value .inline-type-name > :first-child {
      width:1.04em!important;min-width:1.04em!important;max-width:1.04em!important;
      padding-inline:0!important;
    }

article.yofi-scores-layout .yofi12-value .inline-type-name .name {
      font-size:.81em!important;width:1.25em!important;min-width:1.25em!important;
      padding-left:0!important;padding-right:0!important;
    }

article.yofi-scores-layout .yofi12-value .inline-type-name svg {
      width:.78em!important;height:.78em!important;min-width:.78em!important;
      max-height:.78em!important;max-width:.78em!important;display:block!important;flex:none!important;
    }

article.yofi-scores-layout .yofi12-value .inline-type-name .name.yofi-ice-letter-cell {
      width:1.25em!important;min-width:1.25em!important;
    }

article.yofi-scores-layout .yofi12-narrow-badges .yofi12-stage .inline-type-name {zoom:.96}

/* Preserve the original Tag.svelte node AND its original paragraph.
       The paragraph floats only for its own first line; the next line of
       the native .ability text returns to the full available width. */

article section.abilities > .yofi-native-hidden-pair {
      display:flow-root!important;
      min-width:0;
    }

article section.abilities > .yofi-native-hidden-pair > p.no-margin {
      float:left!important;
      /* Its float exclusion ends after the FIRST line. The native badge
         itself remains its original size and can paint outside this box. */
      height:1em!important;
      overflow:visible!important;
      margin:0 .4em 0 0!important;
      padding:0!important;
    }

article section.abilities > .yofi-native-hidden-pair > .ability {
      display:block!important;
      overflow:visible!important;
      min-width:0;
      margin:0!important;
    }

/* Description lead is a QOL content decoration. Does not rely on the hero adapter. */

article:has(section.stats) .small-text .yofi-type-description-lead {
      font-weight: 700;
      color: var(--yofi-lead-type-color, inherit);
      text-shadow: none !important;
    }

article.yofi-type-tinted:has(section.stats) .small-text .yofi-type-description-lead {
      background: transparent !important;
      box-shadow: none !important;
      -webkit-text-stroke: .075em rgba(255,255,255,.95);
      paint-order: stroke fill;
      text-shadow: 0 0 .12em #fff, 0 0 .27em #fff, 0 0 .39em rgba(255,255,255,.95) !important;
    }

.yofi-species-hero > .yofi-hero-toolbar > .yofi-hero-tools:empty { display: none !important; }

.yofi-species-hero > .yofi-hero-toolbar > .yofi-hero-id { display: none !important; }

/* Four vitals, in the requested order, use the panel content gutters.
       Adapt type size only when needed to avoid wrapping. */

article.yofi-scores-layout .yofi-vitals-row {
      grid-column: 1 / -1;
      display: flex;
      flex-flow: row nowrap;
      align-items: baseline;
      justify-content: space-between;
      gap: clamp(.2em, 1.2cqi, .65em);
      width: 100%;
      min-width: 0;
      font-size: var(--yofi-vitals-font, var(--font-sz-venus, .9rem));
    }

article.yofi-scores-layout .yofi-vital-field {
      display: inline-flex;
      align-items: baseline;
      gap: .4em;
      flex: 0 0 auto;
      white-space: nowrap;
      font-size: inherit;
    }

article.yofi-scores-layout .yofi-vital-field > :is(dt,dd) {
      margin: 0 !important;
      padding: 0 !important;
      white-space: nowrap;
    }

/* The original AC/HP labels were styled by their parent stats-body rules.
       Moving the row into the vitals track put it outside that selector. Restore
       precisely the same bold title and trailing-colon treatment here. */

article.yofi-scores-layout .yofi-vital-field > dt {
      font-weight: 700;
    }

article.yofi-scores-layout .yofi-vital-field > dt:not(:empty)::after {
      content: ":";
    }

article.yofi-scores-layout .yofi-scores-skills > dl {
      grid-template-columns: max-content minmax(0,1fr) !important;
      column-gap: .5em !important;
      align-items: baseline;
    }

article.yofi-scores-layout .yofi-scores-skills > dl > dd {
      margin-bottom: 0 !important;
      overflow-wrap: break-word;
    }

/* The same content inset as the mobile six-score array (not the full
       card width). The hr sits between Speed/Senses and Weak To. */

article.yofi-scores-layout section.skills::before {
      content: "";
      display: block;
      box-sizing: border-box;
      width: 100%;
      height: 1px;
      background: color-mix(in srgb, var(--skin-content-text, #333) 17%, transparent);
      margin: 0 0 .65em;
      pointer-events: none;
    }

article.yofi-scores-layout section.skills { margin-block-start: .7em !important; }

/* The native 2em Abilities title margin and the skills dl bottom margin
       compound into an oversized gap. Match the .65em space below our hr. */

article.yofi-scores-layout section.skills > dl { margin-block-end: 0 !important; }

article.yofi-scores-layout section.abilities > h2 { margin-block-start: .65em !important; }

/* Match the gap after Abilities heading at the next Evolution heading;
       leave ability paragraph spacing untouched. */

article.yofi-scores-layout section.abilities + section > h2,
    article.yofi-scores-layout section.abilities ~ section.evolution > h2,
    article.yofi-scores-layout section.abilities ~ section.evolutions > h2 {
      margin-block-start:.65em!important;
    }

article.yofi-scores-layout section.stats > .yofi-vitals-row {
      margin: var(--yofi-hero-data-gap, .3rem) 0 0 !important;
    }

/* Avoid the banner's old top spacing now that vitals precedes it. */

article.yofi-scores-layout section.stats > .yofi-vitals-row + .yofi-scores-banner {
      margin-block-start: .65em !important;
    }

/* v0.12.10: explicitly target the DOM emitted by PokemonSpeciesCard,
       AbilityPoolInfo, EvolutionInfo, and FlatDl. The previous direct-child
       rule did not reach EvolutionInfo's internal h3/p or Moves' DL rows.
       This is scoped to sections BELOW the hero and never touches the hero. */

article.yofi-scores-layout {
      --yofi-card-heading-gap:.65em;
      --yofi-card-text-gap:.42em;
    }

article.yofi-scores-layout .yofi-scores-banner {
      margin-block-end:var(--yofi-card-heading-gap)!important;
    }

article.yofi-scores-layout .yofi12-divider {
      margin-block:var(--yofi-card-text-gap)!important;
    }

article.yofi-scores-layout > .scrollable > section:is(.abilities,.evolution,.evolutions,.moves,.tms,.tm) > h2 {
      margin-block:var(--yofi-card-heading-gap)!important;
    }

article.yofi-scores-layout > .scrollable > section:is(.abilities,.evolution,.evolutions,.moves,.tms,.tm) > :not(h2) {
      margin-block:0!important;
    }

article.yofi-scores-layout > .scrollable > section:is(.abilities,.evolution,.evolutions,.moves,.tms,.tm) > :not(h2) + :not(h2) {
      margin-block-start:var(--yofi-card-text-gap)!important;
    }

/* AbilityPoolInfo: original .ability blocks are separate text items.
       The native Hidden paragraph and its .ability form ONE item. */

article.yofi-scores-layout section.abilities > .ability {
      margin-block:0!important;
    }

article.yofi-scores-layout section.abilities > .yofi-native-hidden-pair > .ability {
      margin-block:0!important;
    }

article.yofi-scores-layout section.abilities > .yofi-native-hidden-pair + .ability,
    article.yofi-scores-layout section.abilities > .ability + .ability,
    article.yofi-scores-layout section.abilities > .ability + .yofi-native-hidden-pair {
      margin-block-start:var(--yofi-card-text-gap)!important;
    }

/* EvolutionInfo puts the content *inside* .evolution-section. Reset
       its native 1.5em h3 top margin and 1.25em paragraph bottom margin. */

article.yofi-scores-layout section.evolution > .evolution-section {
      margin:0!important;
    }

/* EvolutionInfo.svelte renders one .evolution-section for "from" and
       a second for "into" ONLY if both exist. Give that directional switch
       half an extra text line; never separate equal split-evolution options
       (which are sibling <p> elements inside the same .evolution-section). */

article.yofi-scores-layout section.evolution > .evolution-section + .evolution-section {
      margin-block-start:calc(var(--yofi-card-text-gap) + .65em)!important;
    }

article.yofi-scores-layout section.evolution .evolution-section > h3 {
      margin:0 0 var(--yofi-card-text-gap)!important;
    }

article.yofi-scores-layout section.evolution .evolution-section > p {
      margin:0!important;
    }

article.yofi-scores-layout section.evolution .evolution-section > p + p {
      margin-block-start:var(--yofi-card-text-gap)!important;
    }

/* FlatDl's native row-gap defaults to .0625em. Use the same text-field
       rhythm for separate move and TM records, not paragraph line-height. */

article.yofi-scores-layout section.moves > dl {
      margin-block:0!important;
      row-gap:var(--yofi-card-text-gap)!important;
    }

article.yofi-scores-layout section.moves > dl + dl {
      margin-block-start:var(--yofi-card-text-gap)!important;
    }

/* Speed/Senses: the generic <=285px stats rule stacked label and value.
       There is room for Speed and Walk 30 to share their first row. */

@container (max-width: 380px) {
      article.yofi-scores-layout .yofi-species-stats-body > dl:first-of-type {
        grid-template-columns: max-content minmax(0, 1fr) !important;
        column-gap: .3em !important;
        align-items: start;
      }
      article.yofi-scores-layout .yofi-species-stats-body > dl:first-of-type > :is(div, dd) {
        margin-bottom: 0 !important;
      }
    }
`;
  function installSpeciesContentCSS() {
    const id = 'yofi-species-card-content-css';
    let node = document.getElementById(id);
    if (!node) {
      node = document.createElement('style');
      node.id = id;
      (document.head || document.documentElement).append(node);
    }
    if (node.textContent !== SPECIES_CONTENT_CSS) node.textContent = SPECIES_CONTENT_CSS;
  }

  const BASE_HERO_CSS = `
    /* v0.8.5: a fresh hero. Native metadata remains the live, read-only
       source; description and Art stay native nodes with their handlers. */
    article .yofi-species-hero {
      --yofi-hero-gap: clamp(10px, 2.5%, 18px);
      /* One real gap: artwork/facts to vitals in either layout, and
         artwork/description to the separate facts row in long mode. */
      --yofi-hero-data-gap: .3rem;
      box-sizing: border-box;
      display: block;
      position: relative;
      min-width: 0;
      margin: 0;
      padding: 0 1em;
      width: 100%;
    }
    .yofi-species-hero > .yofi-hero-flow {
      display: flow-root;
      min-width: 0;
      width: 100%;
      margin: 0;
      padding: 0;
    }
    /* The long-mode float can retain blank block height after its artwork
       shrinks. Exclude only that measured surplus from normal document flow;
       the remaining gap is the same as below the facts, before vitals. */
    .yofi-species-hero[data-yofi-facts-mode="long"] > .yofi-hero-flow {
      margin-block-end: var(--yofi-hero-long-flow-adjust, 0px) !important;
    }
    /* Fixed 50% image lane, top-right anchored. A small left margin
       separates it from the description; long copy flows below the lane. */
    article .yofi-hero-flow > section.info.yofi-hero-art-lane {
      float: right !important;
      clear: none !important;
      display: block !important;
      position: static !important;
      width: 50% !important;
      height: auto !important;
      min-width: 0 !important;
      margin: 0 0 0 var(--yofi-hero-gap) !important;
      padding: 0 !important;
      shape-outside: none !important;
      shape-margin: 0 !important;
      overflow: visible !important;
    }
    article .yofi-hero-art-lane > .yofi-hero-native-metadata {
      display: none !important;
    }
    article .yofi-hero-flow > section.info.yofi-hero-no-art {
      display: none !important;
    }
    article .yofi-hero-art-lane > .column:last-child {
      display: block !important;
      float: none !important;
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      min-width: 0 !important;
      margin: 0 0 0 auto !important;
      padding: 0 !important;
      gap: 0 !important;
      shape-outside: none !important;
    }
    article .yofi-hero-art-lane .square-image {
      width: 100% !important;
      height: auto !important;
      min-width: 0 !important;
      max-width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      aspect-ratio: auto !important;
    }
    article .yofi-hero-art-lane .square-image > figure {
      position: relative !important;
      display: block !important;
      width: 100% !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    article .yofi-hero-art-lane .square-image img-zoom {
      display: block !important;
      width: var(--yofi-hero-art-width, 100%) !important;
      max-width: 100% !important;
      height: auto !important;
      aspect-ratio: var(--yofi-hero-art-ratio, 1);
      min-width: 0;
      margin: 0 0 0 auto !important;
      padding: 0;
    }
    article .yofi-hero-art-lane .square-image img {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      aspect-ratio: var(--yofi-hero-art-ratio, 1);
      object-fit: contain !important;
      object-position: right top !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    article .yofi-hero-art-lane .square-image > img,
    article .yofi-hero-art-lane .square-image > figure > img {
      width: var(--yofi-hero-art-width, 100%) !important;
      margin-left: auto !important;
    }
    article .yofi-hero-art-lane figcaption {
      display: block;
      margin: .15em 0 0;
      font-size: .5rem;
      line-height: 1.25;
      text-align: right;
      overflow-wrap: anywhere;
    }
    article .yofi-hero-flow > section.yofi-hero-copy {
      display: block !important;
      float: none !important;
      clear: none !important;
      position: static !important;
      width: auto !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
    }
    article .yofi-hero-copy > .small-text {
      display: block;
      overflow: visible;
      font-size: var(--font-sz-venus, .9rem);
      line-height: 1.5;
      overflow-wrap: anywhere;
    }
    article .yofi-hero-copy p {
      margin-block: 0 .65em !important;
      line-height: 1.5;
    }
    article .yofi-hero-copy > .small-text > :first-child { margin-top: 0 !important; }
    article .yofi-hero-copy > .small-text > :last-child { margin-bottom: 0 !important; }

    /* Equal side tracks keep gender perfectly centered. Each side distributes
       its TWO fields evenly across its whole track; no badge-specific gutter. */
    .yofi-species-hero > .yofi-hero-facts {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: center;
      column-gap: 0;
      min-width: 0;
      width: 100%;
      margin: .85em 0 0;
      font-size: var(--yofi-hero-facts-font, .75rem);
      line-height: 1.3;
    }
    .yofi-hero-facts > dl {
      display: flex;
      justify-content: space-evenly;
      align-items: center;
      column-gap: 0;
      min-width: 0;
      margin: 0;
      padding: 0;
      font-size: inherit;
    }
    .yofi-hero-facts .yofi-hero-field {
      display: inline-flex;
      align-items: baseline;
      column-gap: .12em;
      min-width: 0;
      flex: 0 0 auto;
      margin: 0;
      padding: 0;
      white-space: nowrap;
    }
    .yofi-hero-facts :is(dt,dd) {
      margin: 0 !important;
      padding: 0 !important;
      font-size: inherit !important;
      line-height: inherit;
      white-space: nowrap;
    }
    .yofi-hero-facts dt { font-weight: 700; }
    .yofi-hero-facts dt::after { content: none !important; }
    .yofi-hero-facts .yofi-hero-egg-value {
      text-transform: capitalize;
      white-space: nowrap !important;
      overflow-wrap: normal !important;
      word-break: normal !important;
    }
    /* Native gender display, restored from the metadata source. The outer
       three-track toolbar places its center at the same x-coordinate as the
       type pill. Each colored segment uses the native --percent flex basis. */
    .yofi-hero-facts > .yofi-hero-gender {
      display: inline-flex !important;
      align-items: center;
      justify-content: flex-start;
      min-width: 0;
    }
    .yofi-hero-facts .yofi-hero-gender .gender-ratio-display {
      display: inline-flex !important;
      /* Between the previous 6.8em compact badge and native 10em badge.
         Same intended size in both hero modes, subject only to space. */
      width: 8.5em !important;
      max-width: 100% !important;
      flex-shrink: 1;
      height: 1.35em !important;
      border-radius: .25em;
      overflow: hidden;
      background: gray;
      vertical-align: middle;
    }
    .yofi-hero-facts .yofi-hero-gender .bar {
      display: flex !important;
      height: 100% !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 .2em !important;
      box-sizing: border-box;
      min-width: 0 !important;
      color: #fff;
      line-height: 1;
    }
    /* Exact color proportions; the only label sits within the majority
       segment, so the minority can remain genuinely narrow. */
    .yofi-hero-facts .yofi-hero-gender .bar {
      flex: 0 0 var(--percent) !important;
      box-sizing: border-box;
      min-width: 0 !important;
    }
    .yofi-hero-facts .yofi-hero-gender .bar:empty {
      padding: 0 !important;
    }
    .yofi-hero-facts .yofi-hero-gender .bar .yofi-ratio-label {
      white-space: nowrap;
      font-size: .9em !important;
      line-height: 1;
    }
    .yofi-species-hero[data-yofi-facts-mode="long"] > .yofi-hero-facts > .yofi-hero-gender {
      flex: 0 1 auto; /* Allow tight split panels to yield to long Egg names. */
    }
    .yofi-hero-facts .yofi-hero-gender .female { background: var(--skin-female-bg, #d00025); }
    .yofi-hero-facts .yofi-hero-gender .male { background: var(--skin-male-bg, #1846db); }
    .yofi-hero-facts .yofi-hero-gender .genderless { background: var(--skin-agender-bg, #777); }
    .yofi-hero-facts .yofi-hero-gender .percent { font-size: .9em !important; font-weight: 700 !important; white-space: nowrap; }
    .yofi-hero-facts .yofi-hero-gender .bar.yofi-ratio-major { justify-content: flex-start !important; gap: .08em; }
    .yofi-hero-facts .yofi-hero-gender .icon { display: inline-flex; font-size: 1.07em !important; }

    /* The site's glyph baseline places bare ♀/♂ below the text, as on Nidoran.
       Apply the same localized correction only to the "All" suffix. */
    .yofi-hero-facts .yofi-hero-gender .bar.yofi-gender-all { gap: .2em !important; }
    .yofi-hero-facts .yofi-hero-gender .yofi-gender-all-symbol {
      display: inline-flex;
      position: relative;
      top: 0;
      align-items: center;
      justify-content: center;
      width: .92em;
      height: .92em;
      line-height: 1;
      font-weight: 700 !important;
      vertical-align: -.105em;
      flex: 0 0 auto;
    }

    /* Short description: Gender and Egg are left-aligned and stacked beneath
       the copy within its left column; the artwork stays in its right lane. */
    .yofi-species-hero[data-yofi-facts-mode="short"] > .yofi-hero-flow {
      display: grid !important;
      grid-template-columns: minmax(0, calc(50% - var(--yofi-hero-gap))) 50% !important;
      column-gap: var(--yofi-hero-gap) !important;
      row-gap: 0 !important;
      align-items: stretch !important;
    }
    article .yofi-species-hero[data-yofi-facts-mode="short"] .yofi-hero-flow > section.info.yofi-hero-art-lane {
      float: none !important;
      grid-column: 2;
      grid-row: 1;
      width: 100% !important;
      margin: 0 !important;
    }
    .yofi-species-hero[data-yofi-facts-mode="short"] .yofi-hero-flow > .yofi-hero-short-column {
      grid-column: 1;
      grid-row: 1;
      display: flex;
      flex-direction: column;
      align-self: stretch;
      min-width: 0;
    }
    article .yofi-species-hero[data-yofi-facts-mode="short"] .yofi-hero-short-column > section.yofi-hero-copy {
      min-width: 0;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .yofi-species-hero[data-yofi-facts-mode="short"] .yofi-hero-short-column > .yofi-hero-facts {
      display: flex !important;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      width: 100% !important;
      min-width: 0;
      /* Free height in the artwork column belongs ABOVE Gender/Egg.
         The metadata ends at the image or credit bottom naturally. */
      margin: auto 0 0 !important;
      gap: .25em;
    }
    /* Compare the natural stacked description+metadata height against the
       full-size image BEFORE aligning the final short layout. */
    .yofi-species-hero[data-yofi-facts-pending="true"][data-yofi-facts-mode="short"]
      .yofi-hero-short-column > .yofi-hero-facts {
      margin-top: .25em !important;
    }
    .yofi-species-hero[data-yofi-facts-mode="short"] .yofi-hero-facts > .yofi-hero-gender {
      align-self: flex-start;
      margin: 0;
    }
    .yofi-species-hero[data-yofi-facts-mode="short"] .yofi-hero-gender .gender-ratio-display {
      width: 8.5em !important;
      max-width: 100% !important;
    }
    .yofi-species-hero[data-yofi-facts-mode="short"] .yofi-hero-gender .bar {
      flex: 1 1 var(--percent) !important;
      min-width: max-content !important;
      padding-inline: .08em !important;
    }
    .yofi-species-hero[data-yofi-facts-mode="short"] .yofi-hero-facts > .yofi-hero-facts-right {
      align-self: flex-start;
      justify-content: flex-start !important;
      width: 100%;
      margin: 0;
    }


    /* Gender: slightly deeper baby pink / blue, white foreground, and SVG
       symbols with no icon backgrounds. Three fixed overlay slots are
       independent of the true proportional color split: 25%, 50%, 75%.
       Majority gender always occupies the left color section unless equal. */
    article .yofi-species-hero .yofi-hero-gender .gender-ratio-display {
      position: relative !important;
      isolation: isolate;
    }
    article .yofi-species-hero .yofi-hero-gender .gender-ratio-display .bar.female {
      background: #DE83A4 !important;
    }
    article .yofi-species-hero .yofi-hero-gender .gender-ratio-display .bar.male {
      background: #71A9D5 !important;
    }
    article .yofi-species-hero .yofi-hero-gender .gender-ratio-display .bar:is(.female,.male) {
      color: #fff !important;
    }
    article .yofi-species-hero .yofi-hero-gender .bar.yofi-gender-segment {
      flex: 0 0 var(--percent) !important;
      padding: 0 !important;
      min-width: 0 !important;
      box-sizing: border-box;
    }
    article .yofi-species-hero .yofi-hero-gender .yofi-gender-icon-slot,
    article .yofi-species-hero .yofi-hero-gender .yofi-gender-center-label {
      position: absolute !important;
      z-index: 2;
      top: 50%;
      transform: translate(-50%, -50%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent !important;
      padding: 0 !important;
      border: 0 !important;
      margin: 0 !important;
      line-height: 1;
      pointer-events: none;
      color: #fff !important;
    }
    article .yofi-species-hero .yofi-hero-gender .yofi-gender-icon-left {
      left: 25% !important;
    }
    article .yofi-species-hero .yofi-hero-gender .yofi-gender-icon-right {
      left: 75% !important;
    }
    article .yofi-species-hero .yofi-hero-gender .yofi-gender-icon-slot {
      width: 1.12em;
      height: 1.12em;
    }
    article .yofi-species-hero .yofi-hero-gender .yofi-gender-icon-slot .yofi-sex-svg {
      display: block !important;
      width: 100% !important;
      height: 100% !important;
      fill: none !important;
      stroke: currentColor !important;
      stroke-width: 1.5 !important;
      color: #fff !important;
      background: none !important;
      overflow: visible;
    }
    article .yofi-species-hero .yofi-hero-gender .yofi-gender-icon-slot .yofi-sex-svg :is(circle, line) {
      fill: none !important;
      stroke: currentColor !important;
      stroke-width: 1.5 !important;
    }
    article .yofi-species-hero .yofi-hero-gender .yofi-gender-center-label {
      left: 50% !important;
      font-size: .9em !important;
      font-weight: 700 !important;
      white-space: nowrap;
    }
    /* The "All" label is one centered unit, not a ratio + left icon slot. */
    article .yofi-species-hero .yofi-hero-gender .yofi-gender-all-combined {
      gap: .2em !important;
    }
    article .yofi-species-hero .yofi-hero-gender .yofi-gender-all-combined .yofi-gender-all-symbol {
      display: inline-flex !important;
      position: relative !important;
      top: 0 !important;
      vertical-align: middle !important;
      flex: none;
      width: .92em;
      height: .92em;
      color: #fff !important;
    }
    article .yofi-species-hero .yofi-hero-gender .yofi-gender-all-combined .yofi-sex-svg {
      stroke: #fff !important;
      fill: none !important;
      background: transparent !important;
    }
    /* Keep the native artwork box free of transient borders while a keyed
       replacement image loads in the native artwork box. */
    article .yofi-hero-art-lane.yofi-hero-art-pending .square-image,
    article .yofi-hero-art-lane.yofi-hero-art-pending .square-image > figure,
    article .yofi-hero-art-lane.yofi-hero-art-pending .square-image img-zoom {
      border: 0 !important;
      outline: 0 !important;
      box-shadow: none !important;
    }

  `;
  function installBaseHeroCSS() {
    let node=document.getElementById('yofi-native-hero-split-css');
    if (!node) {
      node=document.createElement('style');
      node.id='yofi-native-hero-split-css';
      (document.head || document.documentElement).appendChild(node);
    }
    if (node.textContent!==BASE_HERO_CSS) node.textContent=BASE_HERO_CSS;
  }

  // Original v0.12.19 hero extracted intact: native metadata, fixed
  // gender-ratio icon slots, 37%-of-CARD artwork floor, and short/long modes.
  // Nothing here changes portrait URLs or the main QOL shiny behavior.
  function currentRoot() {
    const parts = location.pathname.split('/').filter(Boolean);
    return parts.find(part => part === 'pokemon' || part === 'fakemon') || '';
  }
  function isSpeciesRoot() { return currentRoot() !== ''; }
  function speciesRouteKeyFromUrl(value) {
    let url;
    try { url = new URL(value, location.href); } catch (_) { return ''; }
    if (url.origin !== location.origin) return '';
    const parts = url.pathname.split('/').filter(Boolean);
    const rootIndex = parts.findIndex(part => part === 'pokemon' || part === 'fakemon');
    if (rootIndex < 0) return '';
    const root = parts[rootIndex];
    if (root === 'fakemon') {
      const id = (url.searchParams.get('id') || '').replace(/^F\./i, '').trim();
      return id ? `fakemon:${id}` : '';
    }
    let id = parts[rootIndex + 1] || '';
    try { id = decodeURIComponent(id); } catch (_) { return ''; }
    return id ? `pokemon:${id}` : '';
  }
  function currentSpeciesRouteKey() { return speciesRouteKeyFromUrl(location.href); }
  function speciesArticleFrom(root) {
    if (root instanceof HTMLElement && root.matches('article')) return root;
    const articles = [...(root?.querySelectorAll?.('article') || [])]
      .filter(article => article.querySelector('section.stats'));
    return articles.find(article => article.getClientRects().length > 0) || articles[0] || null;
  }
  function pendingImage(article) {
    return article?.querySelector('section.info .square-image img') || null;
  }
  function speciesCardIdentity(article) {
    const header = article?.querySelector(':scope > header');
    const titleHost = header?.querySelector(':scope > .title, :scope > h1');
    const titleNode = titleHost?.querySelector('.yofi-fakemon-title-text, .yofi-universal-title-text')
      || titleHost;
    const title = titleNode?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const image = pendingImage(article);
    const imageSource = image?.getAttribute('src') || image?.getAttribute('srcset') || '';
    const typeSignature = Array.from(article.querySelectorAll(':scope > header .type-tag > .type'))
      .map(segment => segment.dataset.yofiHeaderType ||
        segment.querySelector('.yofi-type-original')?.textContent || segment.textContent || '')
      .map(type => type.replace(/\s+/g, ' ').trim().toLowerCase()).join('/');
    const metadata = article?.querySelector('section.info > div:first-child > dl');
    const recordId = [...(metadata?.children || [])]
      .find(node => node.tagName === 'DD')?.textContent?.replace(/\s+/g, ' ').trim() || '';
    return { title, imageSource, recordId, typeSignature };
  }
  function visibleSpeciesArticles() {
    return [...document.querySelectorAll(LIVE_CARD_SELECTOR)].filter(article =>
      article.querySelector('section.stats') && article.getClientRects().length > 0);
  }
  function visibleSpeciesArticle() {
    return visibleSpeciesArticles()[0] || null;
  }
  function routeIdentityReady(article, routeKey) {
    if (!routeKey.startsWith('fakemon:')) return true;
    const id = routeKey.slice('fakemon:'.length);
    const renderedId = article.querySelector('.yofi-header-fakemon-id')?.textContent?.trim();
    return renderedId === 'F.' + id;
  }
  function sameSpeciesIdentity(a, b) {
    return !!a && !!b && a.title === b.title && a.imageSource === b.imageSource &&
      a.recordId === b.recordId && a.typeSignature === b.typeSignature;
  }
  function prepareIncomingSpecies(article, routeKey) {
    if (!article?.isConnected || !routeKey) return false;
    let identity = speciesCardIdentity(article);
    const previousIdentity = processedSpeciesIdentities.get(article);
    const previousRouteKey = article.dataset.yofiSpeciesRouteKey || '';
    if (previousRouteKey === routeKey) {
      if (sameSpeciesIdentity(previousIdentity, identity)) return false;
      // The URL can change before Svelte publishes the new record. In that
      // case the first pass marks the route while the old card is still live;
      // this same-route identity change is the actual data handoff. Re-run
      // QOL normalization and theme colors here, before the next paint.
      document.dispatchEvent(new CustomEvent(PREPARE_EVENT, { detail: { article, routeKey } }));
      identity = speciesCardIdentity(article);
      document.dispatchEvent(new CustomEvent(PRE_REVEAL_EVENT, { detail: { article, routeKey } }));
      processedSpeciesIdentities.set(article, identity);
      return true;
    }
    // QOL normalizes Fakémon IDs here. That lets us distinguish two records
    // that share both a name and placeholder portrait without guessing.
    document.dispatchEvent(new CustomEvent(PREPARE_EVENT, { detail: { article, routeKey } }));
    // The browser URL can change before Svelte has replaced the previous
    // species data. Wait for it to change, unless QOL confirms the new
    // Fakémon ID even though its display name and artwork are identical.
    if (previousRouteKey && sameSpeciesIdentity(previousIdentity, identity) &&
        !(routeKey.startsWith('fakemon:') && routeIdentityReady(article, routeKey))) return false;
    document.dispatchEvent(new CustomEvent(PRE_REVEAL_EVENT, { detail: { article, routeKey } }));
    article.dataset.yofiSpeciesRouteKey = routeKey;
    processedSpeciesIdentities.set(article, identity);
    return true;
  }
  function portraitUrl(image) {
    const source = image?.getAttribute('src');
    return source ? new URL(source, location.href).href : image?.currentSrc || '';
  }
  function portraitRatio(article, image) {
    const source = image?.getAttribute('src') || image?.currentSrc || '';
    const routeKey = currentSpeciesRouteKey();
    const naturalRatio = image?.naturalWidth > 0 && image?.naturalHeight > 0
      ? image.naturalWidth / image.naturalHeight : 0;
    const layout = portraitLayoutRatios.get(article);
    if (layout?.routeKey === routeKey && layout.source === source) {
      // Keep provisional geometry stable while decoding, then use the
      // destination image's natural ratio for subsequent layout decisions.
      if (layout.decoded || !(naturalRatio > 0)) return layout.ratio;
      layout.ratio = naturalRatio;
      layout.decoded = true;
      return naturalRatio;
    }
    let ratio = naturalRatio;
    const known = portraitSources.get(article);
    if (!(ratio > 0) && known?.ratio > 0 && known.source !== source) ratio = known.ratio;
    if (!(ratio > 0)) ratio = 1;
    if (source) portraitLayoutRatios.set(article, {
      routeKey, source, ratio, decoded: naturalRatio > 0
    });
    return ratio;
  }
  function watchPortraitImage(article, image) {
    if (!(image instanceof HTMLImageElement)) return;
    const source = portraitUrl(image);
    if (!source) return;
    const old = portraitLoadHandlers.get(image);
    if (old?.source === source) return;
    if (old) image.removeEventListener('load', old.onLoad);
    const finish = () => {
      if (!article.isConnected || !image.isConnected || portraitUrl(image) !== source ||
          !image.complete || image.naturalWidth <= 0) return;
      portraitSources.set(article, {
        source,
        ratio: image.naturalWidth / image.naturalHeight
      });
    };
    const handlers = { source, onLoad: finish };
    portraitLoadHandlers.set(image, handlers);
    image.addEventListener('load', handlers.onLoad, { once: true });
    if (image.complete) finish();
  }
  let heroTickQueued = false;
  function requestHeroTick() {
    if (heroTickQueued) return;
    heroTickQueued = true;
    requestAnimationFrame(() => { heroTickQueued = false; tick(); });
  }

  // Hero layout is independent from card-title/nav layout and the shiny
  // loader. Never write species data or recreate the native Art component.
  const speciesHeroStates = new WeakMap();
  let activeSpeciesHeroState = null;

  function disconnectSpeciesHero() {
    activeSpeciesHeroState?.observer?.disconnect();
    activeSpeciesHeroState?.resizeObserver?.disconnect();
    activeSpeciesHeroState = null;
  }

  function setHeroStyle(node, name, value) {
    if (node.style.getPropertyValue(name) !== value) node.style.setProperty(name, value);
  }

  function heroText(node) {
    return node?.textContent?.replace(/\s+/g, " ").trim() || "";
  }

  // Match the existing 37%-of-CARD artwork floor while waiting for image
  // decode. The art lane itself is about half the card, less hero gutters.
  function sizePendingHeroArt(info, hero) {
    const lane = info.getBoundingClientRect().width;
    const card = hero.getBoundingClientRect().width;
    const percent = lane > 0 && card > 0
      ? Math.min(100, 100 * card * .37 / lane) : 74;
    setHeroStyle(info, "--yofi-hero-art-width", `${percent.toFixed(3)}%`);
  }

  function copyHeroValue(source, target) {
    if (!source || !target) return;
    const signature = source.innerHTML;
    if (target.yofiSourceHTML === signature) return;
    const fragment = document.createDocumentFragment();
    for (const node of source.childNodes) fragment.appendChild(node.cloneNode(true));
    fragment.querySelectorAll?.("[id]").forEach((node) => node.removeAttribute("id"));
    target.replaceChildren(fragment);
    target.yofiSourceHTML = signature;
  }

  function ensureSpeciesHero(article) {
    if (!(article instanceof HTMLElement) || !article.matches('article')) return null;
    // Never treat the editor, Find by ID, or a non-species card as a hero.
    if (!article?.querySelector("section.stats")) return null;
    let hero = article.querySelector(".yofi-species-hero");
    let state = hero && speciesHeroStates.get(hero);
    if (state && state.info.isConnected && state.description.isConnected) {
      const liveMetadata = state.info.querySelector(":scope > div:first-child > dl");
      if (liveMetadata instanceof HTMLDListElement) {
        state.metadata = liveMetadata;
        liveMetadata.parentElement.classList.add("yofi-hero-native-metadata");
      }
      return state;
    }

    const info = article.querySelector("section.info");
    const description = info?.nextElementSibling;
    const metadata = info?.querySelector(":scope > div:first-child > dl");
    if (!(info instanceof HTMLElement) || !(description instanceof HTMLElement) ||
        description.tagName !== "SECTION" || !description.querySelector(".small-text") ||
        !(metadata instanceof HTMLDListElement)) return null;

    disconnectSpeciesHero();
    hero = document.createElement("div");
    hero.className = "yofi-species-hero";
    const flow = document.createElement("div");
    flow.className = "yofi-hero-flow";
    const facts = document.createElement("div");
    facts.className = "yofi-hero-facts";
    facts.setAttribute("role", "group");
    facts.setAttribute("aria-label", "Species details");
    const right = document.createElement("dl");
    right.className = "yofi-hero-facts-right";
    const gender = document.createElement("div");
    gender.className = "yofi-hero-gender";
    const eggField = document.createElement("div");
    eggField.className = "yofi-hero-field yofi-hero-field-egg";
    const eggLabel = document.createElement("dt");
    eggLabel.textContent = "Egg:";
    const eggValue = document.createElement("dd");
    eggValue.className = "yofi-hero-egg-value";
    eggField.append(eggLabel, eggValue);
    right.appendChild(eggField);
    const values = { egg: eggValue };
    facts.append(gender, right);
    info.parentElement.insertBefore(hero, info);
    info.classList.add("yofi-hero-art-lane");
    metadata.parentElement.classList.add("yofi-hero-native-metadata");
    description.classList.add("yofi-hero-copy");
    flow.append(info, description);
    hero.append(flow, facts);
    // The initial native image can still be loading when the hero mounts.
    // Do not allow a 50%-wide unmeasured portrait to flash in that interval.
    const initialImage = info.querySelector(".square-image img");
    if (initialImage instanceof HTMLImageElement && !initialImage.complete) {
      sizePendingHeroArt(info, hero);
      info.classList.add("yofi-hero-art-pending");
    }
    state = { hero, article, info, metadata, description, flow, shortColumn: null,
      facts, right, gender, values, geometryKey: "", factsKey: "",
      observer: null, resizeObserver: null, width: -1, factsMode: "long" };
    speciesHeroStates.set(hero, state);
    activeSpeciesHeroState = state;

    // Text-only Svelte updates don't trigger the page's childList observer.
    // Observe native sources, not the output mirrors or their inline sizes.
    state.observer = new MutationObserver((changes) => {
      if (!hero.isConnected) { state.observer.disconnect(); state.resizeObserver?.disconnect(); return; }
      // The same native IMG is corrected synchronously BEFORE any next
      // frame. Re-evaluate dimensions only after the right source is set.
      // Shiny source selection remains owned by the QOL main script.
      if (changes.some(change => change.type === "attributes" &&
          (change.attributeName === "src" || change.attributeName === "srcset") &&
          change.target instanceof HTMLImageElement)) {
        const current = info.querySelector(".square-image img");
        const pending = current instanceof HTMLImageElement && !current.complete;
        watchPortraitImage(article, current);
        info.classList.toggle("yofi-hero-art-pending", pending);
      }
      const portraitOnly = change => {
        const target = change.target.nodeType === 1
          ? change.target : change.target.parentElement;
        if (!target?.closest?.('.square-image') || target.closest('figcaption')) return false;
        if (change.type === 'attributes')
          return target instanceof HTMLImageElement &&
            ['src','srcset'].includes(change.attributeName);
        if (change.type !== 'childList') return false;
        const nodes = [...change.addedNodes, ...change.removedNodes]
          .filter(node => node.nodeType === 1);
        return nodes.length > 0 && nodes.every(node => node.matches?.('img, img-zoom'));
      };
      // The document-level species observer handles native keyed-art swaps
      // synchronously. Avoid a second rAF tick for the same image subtree;
      // image load itself changes pixels, not layout geometry.
      if (changes.some(change => !portraitOnly(change))) requestHeroTick();
    });
    state.observer.observe(info, { childList: true, characterData: true, subtree: true,
      attributes: true, attributeFilter: ["src", "srcset"] });
    state.observer.observe(description, { childList: true, characterData: true, subtree: true });
    if (typeof ResizeObserver === "function") {
      state.resizeObserver = new ResizeObserver((entries) => {
        let needsLayout = false;
        for (const entry of entries) {
          if (entry.target === flow) {
            const width = entry.contentRect.width || 0;
            if (Math.abs(width - state.width) > .25) {
              state.width = width;
              needsLayout = true;
            }
          } else if (entry.target === info) {
            const height = entry.contentRect.height || 0;
            if (Math.abs(height - (state.artHeight ?? -1)) > .5) {
              state.artHeight = height;
              needsLayout = true;
            }
          }
        }
        if (needsLayout) requestHeroTick();
      });
      state.resizeObserver.observe(flow);
      state.resizeObserver.observe(info);
    }
    return state;
  }

  function parseGenderPercent(text) {
    const numeric = Number.parseFloat(String(text || "").replace(/[^\d.]+/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function roundGenderPercent(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  function makeGenderBar(className, widthPercent, innerNodes = []) {
    const bar = document.createElement("span");
    bar.className = `bar ${className}`;
    bar.style.setProperty("--percent", `${widthPercent}%`);
    for (const node of innerNodes) if (node) bar.appendChild(node);
    return bar;
  }

  function sharedSexSvg(symbol) {
    // QOL provides the canonical glyph geometry. Startup fallback stays legible.
    return window.__yofiQolSexSymbols?.createSvg?.(symbol)
      || document.createTextNode(symbol);
  }
  function makeGenderAllSymbol(symbol) {
    const span = document.createElement("span");
    span.className = "yofi-gender-all-symbol";
    if(window.__yofiQolSexSymbols?.decorate)
      window.__yofiQolSexSymbols.decorate(span, symbol);
    else span.textContent=symbol;
    return span;
  }

  function genderRatioText(major, minor) {
    if (Math.abs(major - 87.5) <= 1 && Math.abs(minor - 12.5) <= 1) return "7:1";
    if (Math.abs(major - 75) <= 1 && Math.abs(minor - 25) <= 1) return "3:1";
    return `${roundGenderPercent(major)}:${roundGenderPercent(minor)}`;
  }

  // The bar's color boundaries are probability-proportional. Its *labels*
  // instead use three fixed tracks, matching the former 50/50 design:
  // one icon at 25%, centered odds at 50%, optional second icon at 75%.
  // Build with the original 12x12 outline geometry only (no native disc).
  function genderIconSlot(symbol, side) {
    const slot = document.createElement('span');
    slot.className = `yofi-gender-icon-slot yofi-gender-icon-${side}`;
    slot.appendChild(sharedSexSvg(symbol));
    slot.setAttribute('aria-hidden', 'true');
    return slot;
  }

  function genderCenterLabel(label) {
    const center = document.createElement('span');
    center.className = 'yofi-gender-center-label';
    center.textContent = label;
    center.setAttribute('aria-hidden', 'true');
    return center;
  }

  function renderHeroGender(source, target, forcedSex = null) {
    if (!source || !target) return;
    const display = source.querySelector('.gender-ratio-display');
    if (!display) { copyHeroValue(source, target); return; }

    const femaleBar = display.querySelector('.bar.female');
    const maleBar = display.querySelector('.bar.male');
    const genderlessBar = display.querySelector('.bar.genderless');
    const female = forcedSex === 'female' ? 100 : forcedSex === 'male' ? 0
      : femaleBar ? parseGenderPercent(femaleBar.style.getPropertyValue('--percent') || femaleBar.textContent) : 0;
    const male = forcedSex === 'male' ? 100 : forcedSex === 'female' ? 0
      : maleBar ? parseGenderPercent(maleBar.style.getPropertyValue('--percent') || maleBar.textContent) : 0;
    const signature = source.innerHTML + '|' + (forcedSex || '');
    if (target.yofiSourceHTML === signature && target.querySelector('.gender-ratio-display')) return;

    const shell = document.createElement('span');
    shell.className = 'gender-ratio-display yofi-fixed-gender-slots';
    if (genderlessBar || (!femaleBar && !maleBar)) {
      shell.appendChild(makeGenderBar('genderless', 100));
      shell.appendChild(genderCenterLabel('Genderless'));
      shell.setAttribute('aria-label', 'Genderless');
    } else {
      const fullFemale = female >= 99.5 && male <= .5;
      const fullMale = male >= 99.5 && female <= .5;
      const equal = Math.abs(female - 50) < .5 && Math.abs(male - 50) < .5;
      const femaleMajor = female > male;
      // Keep the site ratio precision (e.g. 87.5/12.5) for width accuracy.
      const major = Math.max(female, male);
      const minor = Math.min(female, male);
      if (fullFemale || fullMale) {
        shell.appendChild(makeGenderBar(`${fullFemale ? 'female' : 'male'} yofi-gender-segment`, 100));
        // A single-gender species is the exception to the fixed icon tracks:
        // center the whole "All ♀" or "All ♂" label as one unit.
        const allLabel = genderCenterLabel('All');
        allLabel.classList.add('yofi-gender-all-combined');
        allLabel.appendChild(makeGenderAllSymbol(fullFemale ? '♀' : '♂'));
        shell.appendChild(allLabel);
      } else if (equal) {
        shell.append(
          makeGenderBar('male yofi-gender-segment', 50),
          makeGenderBar('female yofi-gender-segment', 50),
          genderIconSlot('♂', 'left'),
          genderCenterLabel('1:1'),
          genderIconSlot('♀', 'right')
        );
      } else {
        shell.append(
          makeGenderBar(`${femaleMajor ? 'female' : 'male'} yofi-gender-segment`, major),
          makeGenderBar(`${femaleMajor ? 'male' : 'female'} yofi-gender-segment`, minor),
          genderIconSlot(femaleMajor ? '♀' : '♂', 'left'),
          genderCenterLabel(genderRatioText(major, minor))
        );
      }
      shell.setAttribute('aria-label', fullFemale ? 'All female'
        : fullMale ? 'All male'
        : `Female ${female}%, male ${male}%`);
    }
    target.replaceChildren(shell);
    target.yofiSourceHTML = signature;
  }

  function syncHeroFacts(state) {
    // This is the native PokemonSpeciesCard field order, also used by
    // Fakemon. Values stay in their original nodes; only the display mirrors.
    const dd = Array.from(state.metadata.children).filter((node) => node.tagName === "DD");
    if (dd.length < 6) return;
    const egg = dd[3], gender = dd[5];
    const fullGender = !!gender.querySelector('.gender-ratio-display .bar') ||
      (!!heroText(gender) && !gender.querySelector('.gender-ratio-display'));
    const fullEgg = !!heroText(egg);
    if (!fullGender || !fullEgg) return;
    state.hero.dataset.yofiKind = currentRoot();
    copyHeroValue(egg, state.values.egg);
    // Only single, short standard groups get the fuller label. "Amorphous",
    // "Undiscovered", "Gender Unknown" and "Human-Like" stay concise;
    // all multiple-group combinations also retain "Egg:".
    const eggGroups = heroText(egg).split(/,\s*/).map(value => value.trim()).filter(Boolean);
    const shortSingleEgg = eggGroups.length === 1 && /^(?:bug|field|grass|fairy|ditto|flying|dragon|monster|mineral|water [123])$/i.test(eggGroups[0]);
    const eggLabel = state.right.querySelector('.yofi-hero-field-egg > dt');
    if (eggLabel) {
      const label = shortSingleEgg ? 'Egg Group:' : 'Egg:';
      if (eggLabel.textContent !== label) eggLabel.textContent = label;
    }
    // Semantic normalization is owned by QOL; this renderer only consumes it.
    const forcedSex = ['female','male'].includes(state.article.dataset.yofiForcedSex)
      ? state.article.dataset.yofiForcedSex : null;
    renderHeroGender(gender, state.gender, forcedSex);
  }

  function selectHeroFactsMode(state) {
    const image = state.info.querySelector(".square-image img");
    const artwork = state.info.querySelector(".square-image img-zoom")
      || state.info.querySelector(".square-image");
    const copy = state.description.querySelector(".small-text");
    if (!(copy instanceof HTMLElement)) return;

    // Choose the composition from native content and the reserved image box.
    // Native route changes and warmed artwork supply the current card data;
    // geometry is computed independently of the navigation action.
    const hasImage = image instanceof HTMLImageElement;
    const ready = hasImage && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
    const pending = hasImage && !ready && !image.complete;
    state.info.classList.toggle("yofi-hero-art-pending", pending);
    delete state.hero.dataset.yofiFactsPending;

    const credit = state.info.querySelector(".square-image figure figcaption");
    const hasCredit = credit instanceof HTMLElement && !!credit.textContent.trim();
    const copyStyle = getComputedStyle(copy);
    const signature = [state.flow.getBoundingClientRect().width.toFixed(1),
      currentSpeciesRouteKey(),
      hasCredit ? credit.textContent.trim() : "", copy.innerHTML,
      copyStyle.fontFamily, copyStyle.fontSize, copyStyle.lineHeight,
      state.facts.textContent].join("|");
    if (state.modeSignature === signature && state.hero.dataset.yofiFactsMode === state.factsMode) return;

    // Measure the original short-mode eligibility before resizing or aligning
    // either column. Previous render measurements must not bias this decision.
    setHeroStyle(state.flow, "--yofi-hero-long-flow-adjust", "0px");
    if (!pending) setHeroStyle(state.info, "--yofi-hero-art-width", "100%");

    // Perform the neutral float-layout measurement in the same synchronous
    // pass as the final placement. The facts are concealed only DURING that
    // measurement, so neither placement flashes onscreen between frames.
    state.hero.dataset.yofiFactsPending = "true";
    if (state.description.parentElement !== state.flow) state.flow.appendChild(state.description);
    if (state.facts.parentElement !== state.hero) state.hero.appendChild(state.facts);
    state.shortColumn?.remove();
    state.hero.dataset.yofiFactsMode = "long";

    // One eligibility test: stack description and facts next to FULL-SIZE
    // artwork; raise them only if their complete natural block fits above
    // the image bottom. No independent description-only threshold.
    const artBottom = artwork?.getBoundingClientRect().bottom || 0;
    let next = "short";
    state.hero.dataset.yofiFactsMode = next;
    if (next === "short") {
      if (!state.shortColumn) {
        state.shortColumn = document.createElement("div");
        state.shortColumn.className = "yofi-hero-short-column";
      }
      state.flow.appendChild(state.shortColumn);
      state.shortColumn.append(state.description, state.facts);
      // The left column must fit IN ITS ENTIRETY alongside the artwork.
      // Descriptions alone can fit while the gender bar and egg group run
      // below the portrait. Measure their actual final position before
      // committing the layout; no delayed reveal or repeated animation.
      const factsBottom = state.facts.getBoundingClientRect().bottom;
      if (factsBottom > artBottom - 2) {
        next = "long";
        state.flow.appendChild(state.description);
        state.hero.appendChild(state.facts);
        state.shortColumn.remove();
        state.hero.dataset.yofiFactsMode = next;
      }
    }
    // Resize in BOTH hero modes. In short mode the right-hand portrait (and
    // its optional credit) approaches the bottom of Gender/Egg. In long mode
    // it approaches the description's bottom, without moving Gender/Egg.
    // The minimum and maximum refer to the DETAIL CARD, not the outer
    // Safari window: a 37vw floor can exceed the entire 50%-width art lane
    // when the Pokemon sidebar is open on a wide iPad/desktop viewport.
    // The fit decision above is based on full-size art.
    const zoom = state.info.querySelector(".square-image img-zoom");
    const lane = state.info.getBoundingClientRect();
    const portrait = zoom?.getBoundingClientRect();
    if (hasImage && portrait?.width > 0 && portrait.height > 0 && lane.width > 0) {
      const artEnd = () => hasCredit
        ? credit.getBoundingClientRect().bottom
        : zoom.getBoundingClientRect().bottom;
      const desiredEnd = () => next === "short"
        ? state.facts.getBoundingClientRect().bottom
        : copy.getBoundingClientRect().bottom;
      // Use the actual hero/card width, not the outer browser viewport.
      // The native section may have inner padding, so its measured lane is
      // not always exactly half the hero's outer width.
      const floor = Math.min(portrait.width, state.hero.getBoundingClientRect().width * .37);
      const ratio = portraitRatio(state.article, image);
      // A long-mode description may reflow as the floated portrait shortens.
      // Resolve that reflow synchronously with a bounded, monotonic adjustment.
      for (let pass = 0; pass < 4; pass++) {
        const excess = artEnd() - desiredEnd();
        const currentWidth = zoom.getBoundingClientRect().width;
        if (excess <= .5 || currentWidth <= floor + .25) break;
        const adjusted = Math.max(floor, currentWidth - excess * ratio);
        if (adjusted >= currentWidth - .25) break;
        setHeroStyle(state.info, "--yofi-hero-art-width", `${(100 * adjusted / lane.width).toFixed(3)}%`);
      }

    }
    // In long mode the floated, resized image can leave unused space in its
    // original section box. The facts should follow the last VISIBLE content:
    // the description or the portrait INCLUDING its optional artist credit.
    // Determine the empty tail from actual DOM geometry, not a guessed offset.
    // This is intentionally after artwork resizing and never affects short
    // mode eligibility, image dimensions, or the original 37vw size floor.
    if (next === "long") {
      const contentBottom = Math.max(
        copy.getBoundingClientRect().bottom,
        hasCredit ? credit.getBoundingClientRect().bottom
          : (zoom?.getBoundingClientRect().bottom || 0)
      );
      const flowBottom = state.flow.getBoundingClientRect().bottom;
      const unusedTail = Math.max(0, flowBottom - contentBottom);
      setHeroStyle(state.flow, "--yofi-hero-long-flow-adjust",
        unusedTail > .25 ? `${(-unusedTail).toFixed(2)}px` : "0px");
    }
    state.factsMode = next;
    state.modeSignature = signature;
    state.factsKey = "";
    // The ResizeObserver should not interpret our own deliberate art-size
    // adjustment as an unrelated image change and repeatedly recompute it.
    state.artHeight = state.info.getBoundingClientRect().height;
    delete state.hero.dataset.yofiFactsPending;
  }

  function fitHeroFacts(state) {
    // v0.9.5: SR/MinLvl/Size moved into the vitals row, so there is no
    // longer any reason to shrink the remaining Gender and Egg controls.
    // Restore the original v0.9.3 starting size in BOTH hero modes. The
    // proportional/equal gender bar rules and positions remain untouched.
    const facts = state.facts;
    const heroFont = parseFloat(getComputedStyle(state.hero).fontSize) || 16;
    const font = Math.min(14, heroFont * .81);
    setHeroStyle(facts, "--yofi-hero-facts-font", `${font.toFixed(2)}px`);
  }

  function sizeHeroArt(state) {
    const { info, article } = state;
    const host = info.querySelector(".square-image");
    const img = host?.querySelector("img");
    info.classList.toggle("yofi-hero-no-art", !host);
    if (!host) return;
    // Record the native image ratio for the route's measured layout. The
    // native image source determines the current ratio.
    setHeroStyle(info, "--yofi-hero-art-ratio", String(portraitRatio(article, img)));
    // selectHeroFactsMode owns artwork width. Resetting it here would undo
    // the fitted short-mode size on every unrelated installation pass.
  }

  function updateNativeHero(article) {
    if (!(article instanceof HTMLElement) || !article.querySelector('section.stats')) return;
    if (activeSpeciesHeroState && !activeSpeciesHeroState.hero.isConnected) disconnectSpeciesHero();
    const state = ensureSpeciesHero(article);
    if (!state) return;
    syncHeroFacts(state);
    sizeHeroArt(state);
    // Use final fact typography when measuring whether its complete block
    // fits next to full-size artwork; never decide based on a temporary font.
    if (!article.classList.contains('lab3-active')) fitHeroFacts(state);
    // Recompute original mobile/compact mode on first mount and whenever no
    // promoted layout is active. Avoid measuring the baseline float while a
    // promoted 3-column grid overrides its geometry.
    if (!article.classList.contains('lab3-active') || !state.hero.dataset.yofiFactsMode)
      selectHeroFactsMode(state);
  }


  const CSS = `
    /* No width/media breakpoints: JS chooses an eligible composition from measured fit. */
    article.lab3-active .yofi-species-hero {
      --lab3-gap: 16px;
      --lab3-tile-gap: 8px;
      --lab3-art-width: 210px;
      --lab3-art-height: 210px;
      --lab3-hero-height: 210px;
      --lab3-lane-width: 210px;
      --lab3-score-row-height: 58px;
      --lab3-tile-size: 88px;
      --lab3-side-width: 184px;
      --lab3-copy-width: 240px;
      display: grid !important;
      box-sizing: border-box !important;
      grid-template-columns: var(--lab3-copy-width) minmax(0, var(--lab3-lane-width)) var(--lab3-side-width) !important;
      grid-template-rows: auto !important;
      column-gap: var(--lab3-gap) !important;
      row-gap: 0 !important;
      align-items: start !important;
      width: 100% !important;
      padding-inline: 1em !important;
      margin: 0 !important;
      position: relative;
    }
    article.lab3-active .yofi-species-hero > .yofi-hero-flow,
    article.lab3-active .yofi-species-hero .yofi-hero-short-column {
      display: contents !important; margin: 0 !important; padding: 0 !important;
    }
    article.lab3-active .yofi-species-hero .yofi-hero-copy {
      display: block !important;
      grid-column: 1 !important;
      grid-row: 1 !important;
      align-self: start !important;
      float: none !important;
      min-width: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    article.lab3-active .yofi-species-hero .yofi-hero-copy > .small-text {
      font-size: var(--lab3-copy-font, var(--font-sz-venus, .9rem)) !important;
      line-height: var(--lab3-copy-line, 1.5) !important;
      overflow-wrap: normal;
    }
    article.lab3-active .yofi-species-hero .yofi-hero-flow > section.info.yofi-hero-art-lane {
      grid-column: 2 !important; grid-row: 1 !important;
      display: block !important; float: none !important; clear: none !important;
      align-self: start !important; justify-self: stretch !important;
      box-sizing: border-box !important;
      min-width: 0 !important; min-height: 0 !important;
      width: var(--lab3-lane-width) !important;
      max-width: none !important;
      height: auto !important;
      padding: 0 !important; margin: 0 !important;
    }
    article.lab3-active .yofi-species-hero .yofi-hero-art-lane > .column:last-child,
    article.lab3-active .yofi-species-hero .yofi-hero-art-lane .square-image,
    article.lab3-active .yofi-species-hero .yofi-hero-art-lane .square-image > figure {
      box-sizing: border-box !important;
      min-width: 0 !important;
      width: 100% !important;
      max-width: none !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      aspect-ratio: auto !important;
    }
    article.lab3-active .yofi-species-hero .yofi-hero-art-lane .square-image img-zoom,
    article.lab3-active .yofi-species-hero .yofi-hero-art-lane .square-image img {
      display: block !important;
      box-sizing: border-box !important;
      width: var(--lab3-art-width) !important;
      max-width: none !important;
      height: var(--lab3-art-height) !important;
      max-height: none !important;
      min-height: 0 !important;
      aspect-ratio: auto !important;
      margin: 0 auto !important; padding: 0 !important;
      object-fit: contain !important;
      object-position: center top !important;
    }
    article.lab3-active .yofi-species-hero .yofi-hero-art-lane figcaption {
      text-align: center !important;
    }
    /* Original facts remain mounted and synchronized by the companion foundation. Do not move or destroy them. */
    article.lab3-active .yofi-species-hero > .yofi-hero-facts:not(.lab3-copy-facts) {
      position: absolute !important;
      visibility: hidden !important;
      pointer-events: none !important;
      left: 0 !important; bottom: 0 !important;
      width: 0 !important; height: 0 !important;
      overflow: hidden !important; margin: 0 !important;
    }
    article.lab3-active .yofi-species-hero > .lab3-left-extra {
      grid-column: 1 !important; grid-row: 1 !important;
      width: 100% !important; min-width: 0 !important;
      display: flex !important; flex-direction: column;
      align-self: start !important;
      gap: 8px;
      /* Match the art's physical bottom, without moving the copy itself.
         The description occupies the top; metadata can occupy the bottom. */
      box-sizing: border-box !important;
      height: var(--lab3-hero-height, var(--lab3-art-height)) !important;
      padding: var(--lab3-left-offset, 0px) 0 0 !important;
      margin: 0 !important;
      justify-content: space-between !important;
    }
    article.lab3-stage1 .yofi-species-hero > .lab3-left-extra {
      /* A compact metadata stack anchored to the BOTTOM of the image-height row.
         Native gender and egg each occupy the ENTIRE left column width. */
      padding-top: 0 !important;
      justify-content: flex-end !important;
    }
    article.lab3-stage1 .yofi-species-hero > .lab3-left-extra .lab3-biologies {
      width: 100%;
    }
    /* In the first three-column state, Vitals and the compact biology row
       terminate at the same physical baseline as the portrait. Previously
       the single right child stayed at the top, leaving a dangling lower edge. */
    article.lab3-stage1 .yofi-species-hero > .lab3-right {
      justify-content: flex-end !important;
    }
    /* With only one score-grid child, space-between does not distribute any
       free space; place the bottom score row against the right-hand Egg edge. */
    article.lab3-stage2 .yofi-species-hero[data-lab3-biology="right-stack"] > .lab3-left-extra {
      justify-content: flex-end !important;
    }
    article.lab3-stage2 .yofi-species-hero > .lab3-left-extra,
    article.lab3-stage3 .yofi-species-hero > .lab3-left-extra {
      justify-content: space-between !important;
    }
    /* In the scores-first middle state, native Gender and Egg are competing
       placements: side-by-side beneath scores, or stacked beneath vitals. */
    article.lab3-active .lab3-biologies.lab3-bio-inline {
      flex-direction: row !important;
      height: var(--lab3-bio-height, 46px);
      align-items: stretch;
    }
    article.lab3-active .lab3-biologies.lab3-bio-inline > .lab3-biology {
      flex: 1 1 50% !important;
      width: 0;
      height: var(--lab3-bio-height, 46px) !important;
      min-height: var(--lab3-bio-height, 46px) !important;
    }
    /* A compact but legible option for both the first and score-promoted
       layouts. Only bounding dimensions change; the native gender contents,
       ratio/slots and colors are never replaced. Allow Egg to wrap naturally. */
    article.lab3-active .lab3-biologies.lab3-bio-inline .lab3-egg {
      padding-inline: 4px !important;
      gap: 4px !important;
      font-size: .82em !important;
      line-height: 1.16 !important;
    }
    article.lab3-active .lab3-biologies.lab3-bio-inline .lab3-egg-icon {
      width: 17px !important; height: 17px !important; flex-basis: 17px !important;
    }
    article.lab3-active .lab3-biologies.lab3-bio-inline .lab3-egg-icon svg {
      width: 17px !important; height: 17px !important;
    }
    article.lab3-active .lab3-biologies.lab3-bio-inline .lab3-copy-facts {
      font-size: var(--yofi-hero-facts-font, .75rem) !important;
    }
    article.lab3-stage3 .yofi-species-hero > .lab3-left-extra .lab3-score-grid {
      width: 100%;
    }
    article.lab3-stage3 .yofi-species-hero > .lab3-right > section.abilities {
      width: 100%;
      /* Optical adjustment: the native ability line-box reserves descender
         space, making its last visible line end slightly before the Egg tile. */
      padding-top: 5px !important;
    }
    article.lab3-active .yofi-species-hero > .lab3-right {
      grid-column: 3 !important; grid-row: 1 !important;
      align-self: start; justify-self: stretch;
      display: flex; flex-direction: column;
      width: var(--lab3-side-width) !important;
      height: var(--lab3-hero-height, var(--lab3-art-height)) !important;
      box-sizing: border-box !important;
      min-width: 0; max-width: none;
      gap: var(--lab3-tile-gap);
      justify-content: space-between;
    }
    article:not(.lab3-active) .lab3-right,
    article:not(.lab3-active) .lab3-left-extra { display: none !important; }
    article.lab3-active section.stats > .yofi-vitals-row {
      visibility: hidden !important; position: absolute !important;
      left: 0; top: 0; width: 100% !important; height: auto !important;
      overflow: hidden !important; pointer-events: none !important;
      margin: 0 !important; padding: 0 !important;
    }
    /* Breathing room between the final hero tile and Speed/Skills/Types.
       Preserve the native lower stats organization and headings. */
    article.lab3-active section.stats { margin-top: 14px !important; }
    article.lab3-active section.stats > .yofi-scores-banner { margin-top: .65em !important; }
    article.lab3-scores section.stats > .yofi-scores-banner { display: none !important; }
    /* The underlying stats below the hero (Speed/Senses/Skills/Type) stay intact. */
    .lab3-vitals {
      display: grid;
      grid-template-columns: repeat(var(--lab3-tile-cols, 2), var(--lab3-tile-size));
      gap: var(--lab3-tile-gap);
      width: 100%;
      max-width: 100%;
      justify-content: space-between;
    }
    .lab3-vital {
      box-sizing: border-box;
      width: var(--lab3-tile-size);
      aspect-ratio: 1;
      min-width: 0;
      border-radius: 14px;
      background: rgba(255,255,255,.49);
      color: var(--skin-content-text, #252525);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 5px;
      padding: 5px 3px;
      font-size: var(--font-sz-venus, .9rem);
      text-align: center;
    }
    .lab3-icon {
      display: grid; place-items: center;
      height: 40px; width: 48px;
      flex: 0 0 40px;
    }
    .lab3-icon svg {
      display: block; width: 28px !important; height: 28px !important;
      max-height: none !important; overflow: visible;
      fill: none; stroke: currentColor;
      stroke-width: 2.1; stroke-linejoin: round; stroke-linecap: round;
    }
    .lab3-vital[data-key="hp"] .lab3-icon { color: #D00025; }
    .lab3-vital[data-key="ac"] .lab3-icon { color: #1846DB; }
    .lab3-vital[data-key="sr"] .lab3-icon { color: #E0C027; }
    .lab3-vital[data-key="lvl"] .lab3-icon { color: #2AB969; }
    /* Independent icon scale, without blindly increasing the stroke weight. */
    .lab3-vital[data-key="sr"] .lab3-icon svg { width: 42px !important; height: 42px !important; }
    .lab3-vital[data-key="lvl"] .lab3-icon svg { width: 34px !important; height: 34px !important; }
    /* User-supplied silhouettes: keep their paths, not an invented Pikachu. */
    .lab3-icon svg.lab3-custom { stroke: none; fill: currentColor; }
    .lab3-icon svg.lab3-custom[data-icon="sr"] path {
      fill: none !important; stroke: currentColor !important;
      /* Bigger icon, SAME effective line weight as the previous 28px icon. */
      stroke-width: 91px !important;
      stroke-linecap: round; stroke-linejoin: round;
    }
    .lab3-icon svg.lab3-custom[data-icon="lvl"] path {
      fill: currentColor !important;
      /* Gentle outline expansion on the author's original filled paths. */
      stroke: currentColor !important; stroke-width: 12px !important;
      stroke-linejoin: round !important;
    }
    .lab3-number {
      display: block; font-weight: 500; line-height: 1.12;
      white-space: nowrap; font-variant-numeric: tabular-nums;
      font-size: inherit;
    }
    .lab3-biologies { display: flex; flex-direction: column; gap: var(--lab3-tile-gap); min-width: 0; width:100%; }
    article.lab3-stage1 .lab3-biologies { height: var(--lab3-tile-size); }
    article.lab3-stage1 .lab3-biologies .lab3-biology {
      height: calc((var(--lab3-tile-size) - var(--lab3-tile-gap)) / 2) !important;
      min-height: calc((var(--lab3-tile-size) - var(--lab3-tile-gap)) / 2) !important;
      flex: 0 0 calc((var(--lab3-tile-size) - var(--lab3-tile-gap)) / 2) !important;
    }
    .lab3-biology {
      display: flex; align-items: center; justify-content: center;
      box-sizing: border-box; height: var(--lab3-bio-height, 50px);
      min-height: var(--lab3-bio-height, 50px);
      width: 100%; min-width: 0;
      overflow: hidden;
      border-radius: 13px;
      background: rgba(255,255,255,.49);
      padding: 0 9px;
    }
    .lab3-biology.lab3-gender { padding: 0 !important; background: transparent !important; }
    /* Mirror the COMPLETE native gender node under the original .yofi-hero-facts
       ancestor. Do not rewrite its native segments, ratio, slots, glyphs or colors.
       Only enlarge the native bar's bounding box and round its corners. */
    article.lab3-active .yofi-species-hero .lab3-biology > .lab3-copy-facts {
      box-sizing: border-box !important;
      display: flex !important;
      align-items: stretch !important;
      justify-content: stretch !important;
      width: 100% !important; height: 100% !important;
      min-width: 0 !important;
      padding: 0 !important; margin: 0 !important;
      font-size: calc(var(--yofi-hero-facts-font, .75rem) * 1.2) !important;
    }
    article.lab3-active .yofi-species-hero .lab3-biology .lab3-copy-facts > .yofi-hero-gender {
      box-sizing: border-box !important;
      display: flex !important;
      align-items: stretch !important;
      width: 100% !important; height: 100% !important;
      padding: 0 !important; margin: 0 !important;
    }
    article.lab3-active .yofi-species-hero .lab3-biology .lab3-copy-facts .gender-ratio-display {
      display: inline-flex !important;
      width: 100% !important; max-width: 100% !important;
      height: 100% !important; min-height: 100% !important;
      border-radius: 13px !important;
      overflow: hidden !important;
    }
    /* QOL's SHORT facts-mode switches segment flex to 1 1 var(--percent)
       and min-width:max-content. That is only intended for its compact original
       bar; the enlarged copy must preserve the fixed original proportions. */
    article.lab3-active .yofi-species-hero .lab3-gender .yofi-hero-gender
      .gender-ratio-display > .bar.yofi-gender-segment {
      flex: 0 0 var(--percent) !important;
      min-width: 0 !important;
      padding: 0 !important;
    }
    /* All other segment colors, centered odds and icon slots are inherited
       directly from the extracted native gender selectors. */
    .lab3-egg { display: flex; gap: 8px; align-items: center; justify-content: center; }
    .lab3-egg-icon { display: grid; place-items: center; width: 22px; height: 22px; flex: 0 0 22px; }
    .lab3-egg-icon svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2.1; }
    .lab3-egg .yofi-hero-facts-right {
      display:flex !important;align-items:center !important;justify-content:center !important;
      min-width:0 !important;max-width:100% !important; margin:0 !important;
      font-size:inherit !important;line-height:inherit !important;
    }
    .lab3-egg .yofi-hero-field-egg {
      display:flex !important;align-items:center !important;justify-content:center !important;
      min-width:0 !important;margin:0 !important;
    }
    .lab3-egg .yofi-hero-field-egg > dt {display:none !important;}
    .lab3-egg .yofi-hero-egg-value {
      display:block !important;min-width:0 !important;
      overflow-wrap:anywhere !important;white-space:normal !important;
      font-size:inherit !important;line-height:inherit !important;
      text-align:center !important;text-transform:capitalize !important;
    }
    article.lab3-stage3 .yofi-species-hero > .lab3-right > section.abilities,
    article .yofi-species-hero section.abilities.lab3-measure-abilities {
      display:block !important;
      box-sizing:border-box !important;
      margin:0 !important; padding:0 !important;
      min-width:0 !important; width:100% !important;
      color:var(--skin-content-text,#222);
      font-family:var(--lab3-native-ability-family,inherit) !important;
      font-size:var(--lab3-native-ability-font,inherit) !important;
      line-height:var(--lab3-native-ability-line,normal) !important;
      letter-spacing:var(--lab3-native-ability-tracking,normal) !important;
    }
    article.lab3-stage3 .lab3-right > section.abilities .ability,
    article .yofi-species-hero section.abilities.lab3-measure-abilities .ability {
      font:inherit !important;
      font-size:var(--lab3-native-ability-font,inherit) !important;
      line-height:var(--lab3-native-ability-line,normal) !important;
      letter-spacing:var(--lab3-native-ability-tracking,normal) !important;
    }
    article .yofi-species-hero section.abilities:is(.lab3-measure-abilities,.lab3-promoted-abilities) > h2,
    article.lab3-stage3 .lab3-right > section.abilities > h2 {
      display:block;position:relative;box-sizing:border-box;
      margin:0 0 .5em !important;padding:.25em 0 !important;
      width:100%;background:var(--lab3-score-bg,var(--skin-bg,#71A9D5));
      color:#fff;font-size:var(--lab3-native-ability-heading-font,1.05em) !important;
      line-height:var(--lab3-native-ability-heading-line,1.22) !important;
      font-weight:700;
    }
    article .yofi-species-hero section.abilities:is(.lab3-measure-abilities,.lab3-promoted-abilities) > h2::before,
    article.lab3-stage3 .lab3-right > section.abilities > h2::before {display:none !important;}
    article.lab3-stage3 .lab3-right > section.abilities > :not(h2),
    article .yofi-species-hero section.abilities.lab3-measure-abilities > :not(h2) {
      margin:0 !important;padding-inline:0 !important;
    }
    article.lab3-stage3 .lab3-right > section.abilities > :not(h2) + :not(h2),
    article .yofi-species-hero section.abilities.lab3-measure-abilities > :not(h2)+:not(h2) {
      margin-top:.5em !important;
    }
    /* Keep the actual QOL definition list and all DT/DD children. Arrange it
       as two three-score bands by placement only; no new score tags exist. */
    article.lab3-scores .yofi-species-hero > .lab3-left-extra > dl.yofi-scores-strip {
      display: grid !important;
      position: relative !important;
      isolation: isolate !important;
      grid-template-columns: repeat(3,minmax(0,1fr)) !important;
      grid-template-rows: repeat(2,calc(var(--lab3-score-row-height,58px)/2))
        var(--lab3-tile-gap,8px) repeat(2,calc(var(--lab3-score-row-height,58px)/2)) !important;
      grid-auto-flow: row !important;
      column-gap: 0 !important;
      row-gap: 0 !important;
      width: 100% !important; max-width:none !important;
      min-height: calc(2*var(--lab3-score-row-height,58px) + var(--lab3-tile-gap,8px)) !important;
      margin: 0 !important; padding: 0 !important;
      justify-self: stretch !important;
      align-self: end !important;
      text-align: center !important;
      font-size: clamp(14px,1.4vw,20px) !important;
      line-height: 1.2 !important;
      color:#fff !important;
      background: linear-gradient(to bottom,
        var(--lab3-score-bg,var(--skin-bg,#71A9D5)) 0,
        var(--lab3-score-bg,var(--skin-bg,#71A9D5)) var(--lab3-score-row-height,58px),
        transparent var(--lab3-score-row-height,58px),
        transparent calc(var(--lab3-score-row-height,58px) + var(--lab3-tile-gap,8px)),
        var(--lab3-score-bg,var(--skin-bg,#71A9D5)) calc(var(--lab3-score-row-height,58px) + var(--lab3-tile-gap,8px)),
        var(--lab3-score-bg,var(--skin-bg,#71A9D5)) 100%) !important;
    }
    article.lab3-scores .lab3-left-extra > dl.yofi-scores-strip > :is(dt,dd) {
      display: block !important;
      position:relative !important;z-index:1 !important;
      grid-area: auto !important;
      min-width:0; margin:0 !important; padding:0 !important;
      width: 100%; align-self:center !important;
      font-size:inherit !important;
      line-height: 1.15 !important;
      white-space:nowrap !important;
      text-align:center !important;
      color:#fff !important;
      background:none !important;
    }
    article.lab3-scores .lab3-left-extra > dl.yofi-scores-strip > dt {
      font-weight:700 !important; text-transform:uppercase !important;
      text-decoration:underline dotted;
      text-underline-offset:.12em;
    }
    article.lab3-scores .lab3-left-extra > dl.yofi-scores-strip > :nth-child(1) {grid-row:1 !important;grid-column:1 !important;}
    article.lab3-scores .lab3-left-extra > dl.yofi-scores-strip > :nth-child(2) {grid-row:2 !important;grid-column:1 !important;}
    article.lab3-scores .lab3-left-extra > dl.yofi-scores-strip > :nth-child(3) {grid-row:1 !important;grid-column:2 !important;}
    article.lab3-scores .lab3-left-extra > dl.yofi-scores-strip > :nth-child(4) {grid-row:2 !important;grid-column:2 !important;}
    article.lab3-scores .lab3-left-extra > dl.yofi-scores-strip > :nth-child(5) {grid-row:1 !important;grid-column:3 !important;}
    article.lab3-scores .lab3-left-extra > dl.yofi-scores-strip > :nth-child(6) {grid-row:2 !important;grid-column:3 !important;}
    article.lab3-scores .lab3-left-extra > dl.yofi-scores-strip > :nth-child(7) {grid-row:4 !important;grid-column:1 !important;}
    article.lab3-scores .lab3-left-extra > dl.yofi-scores-strip > :nth-child(8) {grid-row:5 !important;grid-column:1 !important;}
    article.lab3-scores .lab3-left-extra > dl.yofi-scores-strip > :nth-child(9) {grid-row:4 !important;grid-column:2 !important;}
    article.lab3-scores .lab3-left-extra > dl.yofi-scores-strip > :nth-child(10){grid-row:5 !important;grid-column:2 !important;}
    article.lab3-scores .lab3-left-extra > dl.yofi-scores-strip > :nth-child(11){grid-row:4 !important;grid-column:3 !important;}
    article.lab3-scores .lab3-left-extra > dl.yofi-scores-strip > :nth-child(12){grid-row:5 !important;grid-column:3 !important;}
  `;

  function installCSS() {
    let node = document.getElementById(STYLE_ID);
    if (!node) {
      node = document.createElement('style');
      node.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(node);
    }
    if (node.textContent !== CSS) node.textContent = CSS;
  }

  const cleanText = (node) => node?.textContent?.replace(/\s+/g, ' ').trim() || '';
  const rectHeight = (node) => node ? node.getBoundingClientRect().height : 0;
  const cloneWithoutIds = (node) => {
    const clone = node.cloneNode(true);
    clone.removeAttribute?.('id');
    clone.querySelectorAll?.('[id]').forEach(n => n.removeAttribute('id'));
    return clone;
  };
  function vitalData(article) {
    const row = article.querySelector('section.stats > .yofi-vitals-row');
    if (!row) return null;
    const data = {};
    for (const [key, cls] of [
      ['hp','yofi-vital-hp'], ['ac','yofi-vital-ac'],
      ['sr','yofi-vital-sr'], ['lvl','yofi-vital-minlevel']
    ]) {
      const field = row.querySelector('.' + cls);
      if (!field) return null;
      data[key] = { label: cleanText(field.querySelector('dt')), value: cleanText(field.querySelector('dd')) };
    }
    const match = data.lvl.value.match(/^\s*(\d+)\s*$/);
    if (match && Number(match[1]) <= MAX_ENCOUNTER_LEVEL)
      data.lvl.value = `${match[1]}\u2013${MAX_ENCOUNTER_LEVEL}`;
    return data;
  }

  function createView(hero) {
    const left = document.createElement('div');
    left.className = 'lab3-left-extra';
    const biologies = document.createElement('div');
    biologies.className = 'lab3-biologies';
    const gender = document.createElement('div');
    gender.className = 'lab3-biology lab3-gender';
    const genderBody = document.createElement('div');
    genderBody.className = 'yofi-hero-facts lab3-copy-facts';
    gender.append(genderBody);
    const egg = document.createElement('div');
    egg.className = 'lab3-biology lab3-egg';
    egg.innerHTML = '<span class="lab3-egg-icon">' + ICON.egg + '</span>';
    biologies.append(gender, egg);
    left.append(biologies);
    const side = document.createElement('aside');
    side.className = 'lab3-right';
    side.setAttribute('aria-label', 'Species vitals and details');
    const vitals = document.createElement('div');
    vitals.className = 'lab3-vitals';
    for (const key of ['hp','ac','sr','lvl']) {
      const tile = document.createElement('div');
      tile.className = 'lab3-vital';
      tile.dataset.key = key;
      tile.setAttribute('role', 'group');
      tile.innerHTML = `<span class="lab3-icon">${ICON[key]}</span><span class="lab3-number"></span>`;
      vitals.append(tile);
    }
    side.append(vitals);
    hero.append(left, side);
    return {hero,left,biologies,genderBody,egg,side,vitals,
      scoreStrip:null,scoreBanner:null,abilities:null,abilitiesHome:null};
  }
  const views = new WeakMap();
  function viewFor(hero) {
    let view=views.get(hero);
    if (!view || !view.left.isConnected || !view.side.isConnected) {
      hero.querySelectorAll(':scope > .lab3-left-extra, :scope > .lab3-right').forEach(n=>n.remove());
      view=createView(hero);
      views.set(hero,view);
    }
    return view;
  }
  // Live score DL is owned and populated by QOL; native Abilities is Svelte's.
  // Moving these actual nodes retains their native classes, semantics and handlers.
  function locateCanonical(view,article) {
    const banner=article.querySelector('section.stats > .yofi-scores-banner');
    const score=article.querySelector('dl.yofi-scores-strip');
    if (banner && score && score!==view.scoreStrip) {
      view.scoreStrip=score;view.scoreBanner=banner;
    }
    const canonical=article.querySelector('.scrollable > section.abilities');
    const abilities=canonical || (view.abilities?.isConnected ? view.abilities :
      article.querySelector('section.abilities'));
    if (abilities && abilities!==view.abilities) {
      if(view.abilities?.closest('.lab3-right')) view.abilities.remove();
      view.abilitiesHome?.remove();
      view.abilities=abilities;
      view.abilitiesHome=null;
    }
    return !!(view.scoreStrip?.isConnected && view.abilities?.isConnected && view.scoreBanner?.isConnected);
  }
  function syncView(view,article,data) {
    for (const key of ['hp','ac','sr','lvl']) {
      const el=view.vitals.querySelector(`.lab3-vital[data-key="${key}"]`);
      if (!el) continue;
      const value=el.querySelector('.lab3-number');
      if (value.textContent!==data[key].value) value.textContent=data[key].value;
      el.setAttribute('aria-label',`${data[key].label}: ${data[key].value}`);
    }
    // Snapshot only native typography before moving the live Abilities node.
    if (view.abilities && !view.abilities.closest('.lab3-right')) {
      const text=view.abilities.querySelector('.ability')||view.abilities;
      const native=getComputedStyle(text);
      const header=view.abilities.querySelector(':scope > h2');
      const heading=header?getComputedStyle(header):native;
      for(const [key,val] of Object.entries({
        '--lab3-native-ability-family':native.fontFamily,
        '--lab3-native-ability-font':native.fontSize,
        '--lab3-native-ability-line':native.lineHeight,
        '--lab3-native-ability-tracking':native.letterSpacing,
        '--lab3-native-ability-heading-font':heading.fontSize,
        '--lab3-native-ability-heading-line':heading.lineHeight
      })) if(view.hero.style.getPropertyValue(key)!==val) view.hero.style.setProperty(key,val);
    }
    const sourceHeader=view.scoreBanner?.querySelector(':scope > h2');
    if(sourceHeader){
      const color=getComputedStyle(sourceHeader,'::before').backgroundColor;
      if(color&&color!=='transparent'&&color!=='rgba(0, 0, 0, 0)')
        view.hero.style.setProperty('--lab3-score-bg',color);
    }
  }
  /* v0.5.0 — constrained content sizing, not a hard card-width table.
     The order is: preserve current information + mobile artwork floor;
     minimize occupied height; promote scores/abilities when that does not
     cause an unreasonable height penalty; give growing cards progressively
     larger artwork; finally distribute vertical slack to a common bottom.

     For each content arrangement we evaluate a *small* number of practical
     text widths and icon sizes. Measurements are memoized per layout pass.
     A center lane may be wider than the picture: leftover width goes to the
     visual focal area, never into a needlessly wide description column. */
  const TILE_GAP = 8;
  const SCORE_ROW = 58;
  const MIN_TILE = 82;
  const MAX_TILE = 112;
  const ART_WIDTH_PROGRESS = Object.freeze({
    nativeAnchor: 620,    // Original compact art floor stops growing at this card width.
    nativeFraction: .37, // Faithful to the extracted QOL v0.12.19 compact rule.
    wideGrowth: .18,     // Gentle display-height increase; aspect-safe growth.
    ceiling: 435,        // Avoid unbounded hero heights on ultra-wide panels.
    shrinkTolerance: .045, // Ordinary corrective image scaling during widening.
    firstColumnCorrection: .09 // First promotion only: permit a small one-time dip.
  });

  function eggMinWidth(view) {
    const text = cleanText(view.hero.querySelector('.yofi-hero-egg-value'));
    const font = parseFloat(getComputedStyle(view.egg).fontSize) || 16;
    return Math.max(126, Math.min(350, Math.ceil(54 + text.length * font * .52)));
  }
  let inlineMeasureContext = null;
  function inlineBiologyHeight(view, width, stage) {
    // Both Gender and Egg must be truly readable at their final *individual*
    // widths. A two-line Field/Fairy tile fits in little more than 100px;
    // requiring two full-width labels was excluding the useful compact state.
    const half = (width - TILE_GAP) / 2;
    if (half < 91) return null;
    const name = cleanText(view.hero.querySelector('.yofi-hero-egg-value'));
    if (!name) return 36;
    const style = getComputedStyle(view.egg);
    // At a previous inline stage this computed size ALREADY includes .82em.
    // Never apply the compact font reduction twice during consecutive resizes.
    const wasInline = view.biologies.classList.contains('lab3-bio-inline');
    const font = (parseFloat(style.fontSize) || 16) * (wasInline ? 1 : .82);
    const family = style.fontFamily || 'sans-serif';
    const measure = inlineMeasureContext || (inlineMeasureContext = document.createElement('canvas').getContext('2d'));
    measure.font = `${font}px ${family}`;
    // CSS uses a 17px egg, a 4px gap, and 4px padding on either side.
    const lineWidth = half - 29;
    if (lineWidth < 48) return null;
    const words = name.split(/\s+/).filter(Boolean);
    let lines = 1, occupied = 0;
    for (const word of words) {
      const ww = measure.measureText(word).width;
      const space = occupied ? measure.measureText(' ').width : 0;
      if (occupied && occupied + space + ww > lineWidth) { lines++; occupied=0; }
      if (ww > lineWidth) {
        const extra = Math.floor((ww - .01) / lineWidth);
        lines += extra;
        occupied = ww - extra * lineWidth;
      } else occupied += (occupied ? space : 0) + ww;
    }
    const maxLines = stage === 1 ? 2 : 3;
    if (lines > maxLines) return null;
    return Math.max(35, Math.ceil(lines * font * 1.16 + 11));
  }
  function bioTileHeight(egg, trackWidth, tile, stage) {
    if (stage === 1) return (tile - TILE_GAP) / 2;
    const rows = Math.max(1, Math.ceil((egg - 54) / Math.max(55, trackWidth - 55)));
    return Math.max(42, Math.min(72, 26 + rows * 16));
  }
  function artFloor(available, ratio) {
    // Compact's 37%-of-CARD art rule is respected *at its upper anchor*, then
    // smoothly extended with a smaller slope. This is a target for promoted
    // layouts, not a continuing mobile rule that makes them impossible.
    const cardWidth = available; // The actual CARD width, supplied by caller.
    const anchor = ART_WIDTH_PROGRESS.nativeAnchor;
    const inheritedCompactHeight = ART_WIDTH_PROGRESS.nativeFraction * Math.min(cardWidth,anchor) / ratio;
    // From the anchor onward, grow in DISPLAY HEIGHT, not in artwork width.
    // A tall portrait must not get a 900px hero just because it is narrow.
    const gradualHeight = inheritedCompactHeight +
      ART_WIDTH_PROGRESS.wideGrowth * Math.max(0,cardWidth-anchor);
    return Math.max(182,Math.min(gradualHeight,ART_WIDTH_PROGRESS.ceiling / ratio));
  }
  function createMeasurer(hero) {
    const cache = new Map();
    const probes = new Map();
    return {
      height(source, width, kind) {
        if (!source || !(width > 0)) return 0;
        // Quantization and within-pass caching avoids measuring every 1px
        // variation of a word wrapping boundary across 100 candidates.
        const w = Math.max(1, Math.round(width / 2) * 2);
        const key = kind + ':' + w;
        if (cache.has(key)) return cache.get(key);
        let probe = probes.get(kind);
        if (!probe) {
          const outer = document.createElement('div');
          outer.dataset.yofiLayoutProbe = 'true';
          outer.style.cssText = 'position:absolute!important;visibility:hidden!important;' +
            'pointer-events:none!important;left:-100000px!important;top:0!important;' +
            'height:auto!important;max-width:none!important;box-sizing:border-box!important;';
          const clone = cloneWithoutIds(source);
          if (kind === 'copy') {
            const css = getComputedStyle(source.querySelector('.small-text') || source);
            // Native copy styling survives the temporary measurement host.
            const inner = clone.querySelector('.small-text') || clone;
            inner.style.setProperty('font-family',css.fontFamily,'important');
            inner.style.setProperty('font-size',css.fontSize,'important');
            inner.style.setProperty('line-height',css.lineHeight,'important');
          } else if(kind==='abilities') {
            clone.classList.add('lab3-measure-abilities');
            const nativeFont = getComputedStyle(source);
            clone.style.setProperty('font-family',nativeFont.fontFamily,'important');
            clone.style.setProperty('font-size',nativeFont.fontSize,'important');
            clone.style.setProperty('line-height',nativeFont.lineHeight,'important');
          } else {
            const css=getComputedStyle(source);
            clone.style.setProperty('font-family',css.fontFamily,'important');
            clone.style.setProperty('font-size',css.fontSize,'important');
            clone.style.setProperty('line-height',css.lineHeight,'important');
            clone.style.setProperty('overflow-wrap',css.overflowWrap,'important');
            clone.style.setProperty('display','block','important');
          }
          clone.style.setProperty('width','100%','important');
          outer.append(clone);
          hero.append(outer);
          probe = {outer,clone};
          probes.set(kind,probe);
        }
        probe.outer.style.width = w + 'px';
        const h = Math.ceil(probe.clone.getBoundingClientRect().height);
        cache.set(key,h);
        return h;
      },
      close() { for (const {outer} of probes.values()) outer.remove(); }
    };
  }
  function geometryFor(stage, bioMode, tile, copyWidth, hero, view, ratio,
                       available, minImageHeight, measurer, eggWidth) {
    const gap = Math.max(12, Math.min(20, Math.round(available * .014)));
    const cols = stage === 3 ? 4 : 2;
    const rightWidth = cols * tile + (cols - 1) * TILE_GAP;
    const laneWidth = available - copyWidth - rightWidth - gap * 2;
    if (!(laneWidth > 0) || laneWidth < ratio * minImageHeight - 1) return null;
    const nativeDesc = hero.querySelector('.yofi-hero-copy');
    if (!nativeDesc) return null;
    const leftBio = bioMode !== 'right-stack';
    const inline = bioMode === 'left-inline';
    if (stage === 1 && !inline && copyWidth < eggWidth) return null;
    if (!leftBio && rightWidth < eggWidth) return null;
    const bioWidth = leftBio ? (inline ? (copyWidth - TILE_GAP) / 2 : copyWidth) : rightWidth;
    const bioH = inline ? inlineBiologyHeight(view,copyWidth,stage) :
      bioTileHeight(eggWidth,bioWidth,tile,stage);
    if (bioH == null) return null;
    const bioTotal = inline ? bioH : 2 * bioH + TILE_GAP;
    // Neither Gender nor Egg is allowed to disappear or become illegible.
    if (stage === 1 && bioH < 32) return null;
    const hasAbilities = !!view.abilities?.querySelector('.ability,.yofi-native-hidden-pair');
    const scoresHeight = 2 * SCORE_ROW + TILE_GAP;
    const vitalsHeight = (stage === 3 ? 1 : 2) * tile + (stage === 3 ? 0 : TILE_GAP);
    const caption = hero.querySelector('.yofi-hero-art-lane figure figcaption');
    let creditH=0;
    if(caption?.textContent?.trim()) {
      creditH=measurer.height(caption,laneWidth,'credit');
      creditH+=Math.max(0,parseFloat(getComputedStyle(caption).marginTop)||0);
    }
    const copyH = measurer.height(nativeDesc,copyWidth,'copy');
    const abilitiesH = stage === 3 && hasAbilities ?
      measurer.height(view.abilities,rightWidth,'abilities') + 5 : 0;
    const leftH = copyH + (stage === 1 ? 9 + bioTotal :
      11 + scoresHeight + (leftBio ? TILE_GAP + bioTotal : 0));
    const rightH = vitalsHeight + (!leftBio ? TILE_GAP + bioTotal : 0) +
      (stage === 3 && abilitiesH ? TILE_GAP + abilitiesH : 0);
    const minHeight = Math.max(minImageHeight+creditH,leftH,rightH);
    const imageHeight = minHeight-creditH;
    const imageWidth = imageHeight * ratio;
    if (imageWidth > laneWidth + .5) return null;
    const leftSlack = Math.max(0,minHeight-leftH);
    const rightSlack = Math.max(0,minHeight-rightH);
    // Height is PRIMARY. After that prefer the artwork, not inflated tiles or
    // a very wide text column. White space inside the CENTER lane is useful
    // visual breathing room and doesn't lengthen the hero.
    // Shortening the description to a phone-sized strip on a wide card
    // isn't useful compactness: it simply relocates whitespace into the
    // center lane. Prefer a comfortable text measure as width becomes free.
    const preferredCopy = stage === 3
      ? Math.max(285,Math.min(415,available*.275))
      : stage === 2 ? Math.max(250,Math.min(360,available*.30))
      : Math.max(235,Math.min(380,available*.31));
    const narrowPenalty = Math.max(0,preferredCopy-copyWidth)*.18;
    const compactPenalty = narrowPenalty + Math.max(0,copyWidth-420)*.045;
    const tileInflation = Math.max(0,tile-94)*.24;
    // At equal total height, prefer the lower, less fragmented biology row.
    // For unusually long egg labels its fit constraint naturally rejects it.
    const stackPenalty = (stage === 1 && !inline ? 7 : 0) + (stage === 3 && inline ? 15 : 0);
    const balancePenalty = (leftSlack + rightSlack)*.055;
    const lanePenalty = Math.max(0,imageWidth-laneWidth)*10;
    const quality = minHeight + compactPenalty + tileInflation + balancePenalty + lanePenalty + stackPenalty;
    return {stage,bioMode,cols,tile,gap,tileGap:TILE_GAP,rightWidth,copyWidth,
      laneWidth,imageWidth,imageHeight,heroHeight:minHeight,creditHeight:creditH,
      bioHeight:bioH,scoreRowHeight:SCORE_ROW,
      leftHeight:leftH,rightHeight:rightH,leftSlack,rightSlack,quality};
  }
  function selectGeometry(stage, hero, view, ratio, available, imageFloor, measurer, preferredBioMode = null) {
    const desc = hero.querySelector('.yofi-hero-copy');
    if (!desc) return null;
    const descFont = parseFloat(getComputedStyle(desc.querySelector('.small-text') || desc).fontSize)||16;
    const eggWidth = eggMinWidth(view);
    const hpText = cleanText(view.vitals.querySelector('[data-key="hp"] .lab3-number'));
    const vitalFont = parseFloat(getComputedStyle(view.vitals.querySelector('.lab3-number')).fontSize)||16;
    const tileMin = Math.max(MIN_TILE,Math.ceil(hpText.length*vitalFont*.55+12));
    if (tileMin > MAX_TILE) return null;
    // Keep the two-row scores wide enough for readable STR/DEX/... values.
    const minCopy = Math.max(stage===1 ? 202 : 226,
      descFont*(stage===1 ? 11.25 : 12.25));
    const allModes = stage === 1 ? ['left-inline','left-stack'] : stage === 2 ?
      ['left-inline','right-stack'] : ['left-inline','left-stack'];
    const modeOptions = preferredBioMode
      ? allModes.filter(mode => mode === preferredBioMode) : allModes;
    const tiles = [...new Set([tileMin,90,96,103,MAX_TILE].filter(t=>t>=tileMin&&t<=MAX_TILE))];
    const widths = [...new Set([minCopy,minCopy+38,minCopy+78,minCopy+122,minCopy+174]
      .map(n=>Math.round(n/2)*2))];
    let best = null;
    for (const mode of modeOptions) for (const tile of tiles) for (const copyWidth of widths) {
      const candidate = geometryFor(stage,mode,tile,copyWidth,hero,view,ratio,
        available,imageFloor,measurer,eggWidth);
      if (candidate && (!best || candidate.quality < best.quality - .01 ||
        (Math.abs(candidate.quality-best.quality)<=.01 && candidate.imageWidth>best.imageWidth)))
        best = candidate;
    }
    return best;
  }

  function restoreAbilities(view) {
    if (!view?.abilitiesHome?.isConnected || !view.abilities) return;
    if(view.abilities.parentNode!==view.abilitiesHome.parentNode ||
       view.abilities.previousSibling!==view.abilitiesHome)
      view.abilitiesHome.after(view.abilities);
    view.abilitiesHome.remove();view.abilitiesHome=null;
  }
  function restoreOriginalDisplays(view){
    if(!view)return;
    restoreAbilities(view);
    if(view.scoreStrip && view.scoreBanner && view.scoreStrip.parentNode!==view.scoreBanner)
      view.scoreBanner.append(view.scoreStrip);
    const foundation=speciesHeroStates.get(view.hero);
    if(foundation){
      if(foundation.gender.parentNode!==foundation.facts) foundation.facts.prepend(foundation.gender);
      if(foundation.right.parentNode!==foundation.facts) foundation.facts.append(foundation.right);
    }
  }
  function restore(article, view) {
    const hero=article.querySelector('.yofi-species-hero');
    restoreOriginalDisplays(view || (hero && views.get(hero)));

    article.classList.remove('lab3-active','lab3-abilities','lab3-scores',
      'lab3-stage1','lab3-stage2','lab3-stage3');
    if (hero) {
      delete hero.dataset.lab3Stage;
      delete hero.dataset.lab3Biology;
      delete hero.dataset.lab3Priority;
      delete hero.dataset.lab3ImageFloor;
      for (const prop of ['--lab3-gap','--lab3-tile-gap','--lab3-art-width','--lab3-art-height','--lab3-hero-height','--lab3-lane-width','--lab3-score-row-height','--lab3-tile-size','--lab3-side-width','--lab3-copy-width','--lab3-left-offset','--lab3-bio-height','--lab3-tile-cols','--lab3-bio-inline'])
        hero.style.removeProperty(prop);
      // Keep companion nodes mounted but hidden: leaving and re-entering compact
      // must not rebuild the gender/egg presentation or move native abilities.
      // The original QOL hero is still the visible layout at compact widths.
    }
  }

  const geometryMemo = new WeakMap();
  const resizeMemory = new WeakMap();
  function chooseStage(article, hero, view) {
    const raw = hero.getBoundingClientRect().width;
    const style = getComputedStyle(hero);
    const available = raw - parseFloat(style.paddingLeft || '0') - parseFloat(style.paddingRight || '0');
    if (!(available > 0)) return null;
    const image = hero.querySelector('.yofi-hero-art-lane img');
    if (!image) return null;
    // Pick composition from the incoming data and current panel width before
    // paint. Keep one ratio for the route: source swaps and image load events
    // must not trigger a second layout pass or move the card in view.
    const ratio = portraitRatio(article, image);
    if (!Number.isFinite(ratio) || ratio <= 0) return null;
    const desc = hero.querySelector('.yofi-hero-copy');
    const descStyle = getComputedStyle(desc?.querySelector('.small-text') || desc);
    const identity = [currentSpeciesRouteKey(),
      desc?.innerHTML || '',view.abilities?.innerHTML || '',cleanText(view.scoreStrip),
      cleanText(view.vitals),cleanText(view.egg),descStyle.fontSize,
      hero.style.getPropertyValue('--lab3-native-ability-font')].join('|');
    const before = resizeMemory.get(hero);
    const increasing = before && before.identity===identity && available >= before.width-.5;
    // A monotone image target applies even on direct load at a wide viewport.
    // During a continuous enlargement, a running peak protects against the
    // cumulative erosion that independent 4.5%-per-resize corrections permit.
    const baseFloor=artFloor(raw,ratio);
    const requiredFloor = increasing ? Math.max(baseFloor,
      before.peakImageHeight*(1-ART_WIDTH_PROGRESS.shrinkTolerance)) : baseFloor;
    // The first three-column transition can shorten a hero without dropping
    // metadata by making Gender/Egg compact. Allow a bounded one-time artwork
    // correction there; subsequent promotions still protect the 4.5% floor.
    const firstStageFloor = Math.max(182,baseFloor*.94,
      increasing ? before.peakImageHeight*(1-ART_WIDTH_PROGRESS.firstColumnCorrection) : 0);
    const key = [available.toFixed(2),ratio.toFixed(4),identity,
      descStyle.fontFamily,descStyle.lineHeight,
      hero.style.getPropertyValue('--lab3-native-ability-line'),
      requiredFloor.toFixed(2),firstStageFloor.toFixed(2),
      increasing ? before.peakStage : 0].join('|');
    const prior=geometryMemo.get(hero);
    if(prior?.key===key)return prior.layout;
    const hasAbilities=!!view.abilities.querySelector('.ability,.yofi-native-hidden-pair');
    const hasScores=!!view.scoreStrip && view.scoreStrip.querySelectorAll(':scope > dt').length===6 && view.scoreStrip.querySelectorAll(':scope > dd').length===6;
    const measurer=createMeasurer(hero);
    let stage1,stage2,stage3;
    try {
      stage1=selectGeometry(1,hero,view,ratio,available,firstStageFloor,measurer);
      stage2=hasScores ? selectGeometry(2,hero,view,ratio,available,requiredFloor,measurer) : null;
      stage3=hasScores&&hasAbilities ? selectGeometry(3,hero,view,ratio,available,requiredFloor,measurer) : null;
    } finally {measurer.close();}
    // Content promotion is next after compactness, not an unconditional jump
    // to an arbitrarily tall hero. A modest additional section is worthwhile;
    // a doubled-height section is not. Previously promoted content remains
    // promoted on widening while its composition remains feasible.
    let layout=stage1 || stage2 || stage3;
    const permitStage2=stage2 && (!stage1 ||
      stage2.heroHeight<=stage1.heroHeight+Math.max(34,stage1.heroHeight*.18));
    if(permitStage2)layout=stage2;
    const permitStage3=stage3 && (!stage2 ||
      stage3.heroHeight<=stage2.heroHeight+Math.max(52,stage2.heroHeight*.25));
    if(stage3 && (permitStage3 || (increasing && before.peakStage>=3)))
      layout=stage3;
    else if(stage2 && increasing && before.peakStage>=2 &&
      (!layout || layout.stage<2))layout=stage2;
    // No promotion can force a loss of already promoted information merely
    // because the available width increased, nor collapse artwork by >4.5%.
    if(layout && increasing && layout.stage<before.peakStage){
      const hold=before.peakStage===3 ? stage3 : stage2;
      if(hold)layout=hold;
    }
    geometryMemo.set(hero,{key,layout,identity,available});
    return layout;
  }

  function rememberNativeHero(hero) {
    const memo=geometryMemo.get(hero);
    if (!memo?.identity) return;
    const img=hero.querySelector('.yofi-hero-art-lane .square-image img');
    const artH=img?.getBoundingClientRect().height||0;
    if (!(artH>0)) return;
    const box=hero.getBoundingClientRect();
    const css=getComputedStyle(hero);
    const width=box.width-parseFloat(css.paddingLeft||'0')-parseFloat(css.paddingRight||'0');
    const old=resizeMemory.get(hero);
    const same=old && old.identity===memo.identity && width>=old.width-.5;
    resizeMemory.set(hero,{
      identity:memo.identity,width,
      peakImageHeight:same?Math.max(old.peakImageHeight,artH):artH,
      peakStage:same?old.peakStage:0
    });
  }

  function apply(article, view, layout) {
    const {hero, left, biologies, side, vitals, scoreStrip, abilities} = view;
    article.classList.add('lab3-active');
    article.classList.toggle('lab3-abilities', layout.stage === 3);
    article.classList.toggle('lab3-scores', layout.stage >= 2);
    for (const n of [1,2,3]) article.classList.toggle(`lab3-stage${n}`, layout.stage === n);
    const px = (v) => `${(+v).toFixed(2)}px`;
    const vars = {
      '--lab3-gap': px(layout.gap),
      '--lab3-tile-gap': px(layout.tileGap),
      '--lab3-art-width': px(layout.imageWidth),
      '--lab3-art-height': px(layout.imageHeight),
      '--lab3-hero-height': px(layout.heroHeight),
      '--lab3-lane-width': px(layout.laneWidth),
      '--lab3-score-row-height': px(layout.scoreRowHeight),
      '--lab3-tile-size': px(layout.tile),
      '--lab3-side-width': px(layout.rightWidth),
      '--lab3-copy-width': px(layout.copyWidth),
      '--lab3-bio-height': px(layout.bioHeight),
      '--lab3-tile-cols': String(layout.cols)
    };
    for (const [name, value] of Object.entries(vars))
      if (hero.style.getPropertyValue(name) !== value) hero.style.setProperty(name, value);
    // First: inline/stacked compact metadata at bottom-left; right vitals at bottom.
    // Second: scores left; biology competes side-by-side left vs stacked right.
    // Largest: scores + biology left, wide vitals and original-sized Abilities right.
    biologies.classList.toggle('lab3-bio-inline', layout.bioMode==='left-inline');
    const foundation=speciesHeroStates.get(hero);
    if(foundation) {
      if(foundation.gender.parentNode!==view.genderBody) view.genderBody.append(foundation.gender);
      if(foundation.right.parentNode!==view.egg) view.egg.append(foundation.right);
    }
    // A stable comment is a restoration anchor for the Svelte-owned section.
    // Reparent the original only in the widest state, never duplicate its HTML.
    if(layout.stage===3 && abilities && abilities.parentNode!==side) {
      if(!view.abilitiesHome?.isConnected){
        view.abilitiesHome=document.createComment('hero: restore native abilities here');
        abilities.before(view.abilitiesHome);
      }
    }
    if(layout.stage!==3) restoreAbilities(view);

    if (layout.stage === 1) {
      if(scoreStrip.parentNode!==view.scoreBanner) view.scoreBanner.append(scoreStrip);
      if (left.children.length !== 1 || left.firstElementChild !== biologies)
        left.replaceChildren(biologies);
      if (side.children.length !== 1 || side.firstElementChild !== vitals)
        side.replaceChildren(vitals);
    } else if (layout.stage === 2) {
      const leftNodes = layout.bioMode === 'left-inline' ? [scoreStrip, biologies] : [scoreStrip];
      const rightNodes = layout.bioMode === 'right-stack' ? [vitals, biologies] : [vitals];
      if (left.children.length !== leftNodes.length || leftNodes.some((n,i)=>left.children[i]!==n))
        left.replaceChildren(...leftNodes);
      if (side.children.length !== rightNodes.length || rightNodes.some((n,i)=>side.children[i]!==n))
        side.replaceChildren(...rightNodes);
    } else {
      if (left.children.length !== 2 || left.children[0] !== scoreStrip || left.children[1] !== biologies)
        left.replaceChildren(scoreStrip, biologies);
      if (side.children.length !== 2 || side.children[0] !== vitals || side.children[1] !== abilities)
        side.replaceChildren(vitals, abilities);
    }
    const nativeCopy = hero.querySelector('.yofi-hero-copy');
    if (nativeCopy) {
      const leftOffset = layout.stage === 1 ? 0 : rectHeight(nativeCopy) + 11;
      const offsetValue = px(leftOffset);
      if (hero.style.getPropertyValue('--lab3-left-offset') !== offsetValue)
        hero.style.setProperty('--lab3-left-offset', offsetValue);
    }
    hero.dataset.lab3Stage = String(layout.stage);
    hero.dataset.lab3Biology = layout.bioMode;
    hero.dataset.lab3Priority = 'compact > promote > art > bottom-align';
    hero.dataset.lab3ImageFloor = String(Math.round(artFloor(
      hero.getBoundingClientRect().width,
      (layout.imageWidth / layout.imageHeight))));
    // Cache only the last resize trajectory per mounted hero. Species changes
    // and narrowing reset the trajectory; widening preserves its maximum.
    const memo=geometryMemo.get(hero);
    const key=memo?.identity || '';
    const old=resizeMemory.get(hero);
    const width=layout.copyWidth+layout.laneWidth+layout.rightWidth+layout.gap*2;
    const same=old && old.identity===key && width>=old.width-.5;
    resizeMemory.set(hero,{
      identity:key,width,
      peakImageHeight:same?Math.max(old.peakImageHeight,layout.imageHeight):layout.imageHeight,
      peakStage:same?Math.max(old.peakStage,layout.stage):layout.stage
    });
  }

  const SPECIES_TM_CSS = `
    /* Light/Dark column geometry only. Type theme owns its natural-width,
       row-major pill wrapping and does not run this column fitter. */
    html:not(.yofi-type-theme) .page > main article > .scrollable section.moves dd ul[data-yofi-species-tm-columns].yofi-species-tm-grid {
      --yofi-species-tm-white-space: nowrap;
      box-sizing: border-box !important;
      display: grid !important;
      grid-auto-flow: column !important;
      grid-template-columns: var(--yofi-species-tm-tracks, minmax(0, 1fr)) !important;
      grid-template-rows: repeat(var(--yofi-species-tm-rows, 1), max-content) !important;
      column-gap: var(--yofi-species-tm-gap, 12px) !important;
      row-gap: 6px !important;
      justify-content: start !important;
      align-content: start !important;
      width: 100% !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      list-style: none !important;
      column-count: auto !important;
    }
    html:not(.yofi-type-theme) .page > main article > .scrollable section.moves dd ul[data-yofi-species-tm-columns].yofi-species-tm-grid > li {
      min-width: 0 !important;
      max-width: 100% !important;
      grid-column: auto !important;
      break-inside: avoid !important;
    }
    html:not(.yofi-type-theme) .page > main article > .scrollable section.moves dd ul.yofi-species-tm-wrap {
      --yofi-species-tm-white-space: normal;
    }
    /* If an individual TM name exceeds the entire panel, permit that name
       to wrap. This is a last-resort single-column fallback, not column
       squeezing or a change to the theme's default pill styling. */
    html:not(.yofi-type-theme) .page > main article > .scrollable section.moves dd ul.yofi-species-tm-wrap > li > a,
    html:not(.yofi-type-theme) .page > main article > .scrollable section.moves dd ul.yofi-species-tm-wrap > li > a::before {
      max-width: 100% !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }
  `;
  function installTMCSS() {
    const id='yofi-species-card-tm-css';
    let node=document.getElementById(id);
    if(!node){node=document.createElement('style');node.id=id;(document.head||document.documentElement).append(node);}
    if(node.textContent!==SPECIES_TM_CSS)node.textContent=SPECIES_TM_CSS;
  }

  const tmGridMemo = new WeakMap();
  const tmGridSeen = new WeakSet();
  const tmGridCanvas = document.createElement('canvas').getContext('2d');
  let tmFontEpoch = 0;
  const tmResizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(entries => {
      if(entries.some(entry => Math.abs(entry.contentRect.width - (tmGridMemo.get(entry.target)?.width || 0)) > .5))
        requestHeroTick();
    }) : null;

  function isSpeciesTMList(ul) {
    const links=[...ul.querySelectorAll(':scope > li > a[href]')];
    if(!links.length)return false;
    if(ul.dataset.p5ovKind==='tm')return true;
    if(ul.dataset.p5ovKind==='move')return false;
    const dt=ul.closest('dd')?.previousElementSibling;
    if(dt?.tagName==='DT' && /^TM\s*:?$/i.test((dt.textContent||'').trim()))return true;
    return links.some(link => /(?:^|\/)tms?(?:\/|\?|$)/i.test(link.getAttribute('href')||'')) ||
      links.every(link => /^\s*(?:TM\s*)?\d{1,4}\s*[-\u2013\u2014.:)]\s*\S/i.test(link.textContent||''));
  }
  function setTmTrackStyle(node,name,value){
    if(node.style.getPropertyValue(name)!==value)node.style.setProperty(name,value);
  }
  function fitSpeciesTMColumns(ul) {
    const links=[...ul.querySelectorAll(':scope > li > a[href]')];
    if(!links.length || !tmGridCanvas)return;
    const bounds=ul.getBoundingClientRect();
    if(!(bounds.width>0))return;
    const ulStyle=getComputedStyle(ul);
    const contentWidth=bounds.width-(parseFloat(ulStyle.paddingLeft)||0)-(parseFloat(ulStyle.paddingRight)||0);
    if(!(contentWidth>0))return;
    // Minimum necessary *actual* horizontal separation: never compress below 12px.
    const gap=Math.max(12,parseFloat(ulStyle.columnGap)||0);
    const signature=[contentWidth.toFixed(2),gap,tmFontEpoch,
      ...links.map(a=>a.textContent.trim()+'~'+a.getAttribute('data-p5ov-display')+'~'+
        a.style.getPropertyValue('--p5ov-tm-font-size'))].join('|');
    if(tmGridMemo.get(ul)?.signature===signature)return;
    const widths=links.map(link=>{
      const style=getComputedStyle(link);
      const pseudo=getComputedStyle(link,'::before');
      // A display attribute alone does not prove that its pseudo-label is
      // visible. Otherwise measure the original Svelte text and its own font.
      const display=link.getAttribute('data-p5ov-display');
      const generated=display !== null && pseudo?.content &&
        !['none','normal','""',"''"].includes(pseudo.content);
      const textStyle=generated?pseudo:style;
      const value=(generated?display:link.textContent).trim().replace(/\s+/g,' ');
      const size=parseFloat(textStyle.fontSize)||parseFloat(style.fontSize)||14;
      const family=textStyle.fontFamily||style.fontFamily||'system-ui';
      const weight=textStyle.fontWeight||style.fontWeight||'400';
      const fontStyle=textStyle.fontStyle||style.fontStyle||'normal';
      const letterSpacing=parseFloat(textStyle.letterSpacing)||0;
      tmGridCanvas.font=`${fontStyle} ${weight} ${size}px ${family}`;
      const glyphWidth=tmGridCanvas.measureText(value).width+
        Math.max(0,value.length-1)*letterSpacing;
      const chrome=(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0)+
        (parseFloat(style.borderLeftWidth)||0)+(parseFloat(style.borderRightWidth)||0);
      return Math.ceil(glyphWidth+chrome+2.5); // rounding/antialias safety
    });
    // Evaluate column-major balanced fills. Unlike one-size-fits-all columns,
    // each track needs only the largest actual label assigned to THAT column.
    let chosen=null;
    for(let columns=links.length;columns>=1;columns--){
      const rows=Math.ceil(links.length/columns);
      const tracks=[];
      for(let i=0;i<links.length;i++){
        const column=Math.floor(i/rows);
        tracks[column]=Math.max(tracks[column]||0,widths[i]);
      }
      const used=tracks.reduce((sum,w)=>sum+w,0)+Math.max(0,tracks.length-1)*gap;
      if(used<=contentWidth+.5){chosen={columns:tracks.length,rows,tracks,used};break;}
    }
    if(!chosen){chosen={columns:1,rows:links.length,tracks:[Math.min(contentWidth,Math.max(...widths))],used:contentWidth};}
    ul.classList.add('yofi-species-tm-grid');
    ul.classList.toggle('yofi-species-tm-wrap',chosen.columns===1 && widths.some(w=>w>contentWidth));
    ul.dataset.yofiSpeciesTmColumns=String(chosen.columns);
    setTmTrackStyle(ul,'--yofi-species-tm-tracks',chosen.tracks.map(n=>n.toFixed(2)+'px').join(' '));
    setTmTrackStyle(ul,'--yofi-species-tm-rows',String(chosen.rows));
    setTmTrackStyle(ul,'--yofi-species-tm-gap',gap.toFixed(2)+'px');
    tmGridMemo.set(ul,{signature,width:bounds.width,columns:chosen.columns,rows:chosen.rows,
      trackWidths:chosen.tracks,usedWidth:chosen.used});
    if(tmResizeObserver&&!tmGridSeen.has(ul)){tmGridSeen.add(ul);tmResizeObserver.observe(ul);}
  }
  function installSpeciesTMColumns() {
    if(!isSpeciesRoot())return;
    const typeTheme=document.documentElement.classList.contains('yofi-type-theme');
    for(const article of visibleSpeciesArticles()){
      for(const ul of article.querySelectorAll('section.moves dd ul')){
        if(typeTheme){
          if(!ul.hasAttribute('data-yofi-species-tm-columns'))continue;
          ul.classList.remove('yofi-species-tm-grid','yofi-species-tm-wrap');
          ul.removeAttribute('data-yofi-species-tm-columns');
          for(const property of ['--yofi-species-tm-tracks','--yofi-species-tm-rows','--yofi-species-tm-gap'])
            ul.style.removeProperty(property);
          tmGridMemo.delete(ul);
          if(tmGridSeen.has(ul)){tmResizeObserver?.unobserve(ul);tmGridSeen.delete(ul);}
        } else if(isSpeciesTMList(ul))fitSpeciesTMColumns(ul);
      }
    }
  }
  window.__yofiSpeciesTMStatus=()=>{
    const ul=visibleSpeciesArticle()?.querySelector('section.moves ul[data-yofi-species-tm-columns]');
    return ul?tmGridMemo.get(ul)||null:null;
  };

  // Species card presentation: source data stays with Svelte, while all
  // derived content and its measurement are maintained by THIS companion.
  const SPECIES_DRAGON_GLYPH = "<path d=\"M170.93 124.41c.8 15.21-5.05 28.07-14.96 38.95-4.86 5.34-7.13 10.82-7.01 17.85.07 4.3-.64 8.63-1.21 12.91-1.48 11.17-7.97 16.55-19.79 16.53-11.81-.02-18.2-5.38-19.75-16.59-.18-1.32-.43-2.65-.42-3.97.07-12.31-3.37-22.68-11.93-32.43-14.25-16.22-14.56-45.3-2.66-60.49 5.82-7.42 4.65-17.14 7.55-25.58 2.37-6.9 4.02-14.05 6.07-21.06.48-1.65 1.51-3.06 3.48-3 2.02.06 2.71 1.6 3.11 3.3 1.8 7.77 4.05 15.47 5.23 23.33.95 6.31 4.94 5.95 9.39 5.97 4.5.02 8.42.25 9.35-6.03 1.11-7.53 3.32-14.9 5.03-22.34.45-1.96.74-4.19 3.34-4.19 2.43 0 3.15 1.99 3.71 4 1.88 6.72 3.88 13.4 5.7 20.14 3.01 11.13 4.22 22.74 11.59 32.51 4.31 5.71 3.98 13.22 4.18 20.21Z M91.9 116.2c.6 15.3 2.1 24 9.5 28.2l15.4 8.5-23.3-42.2Z M164.1 116.2c-.6 15.3-2.1 24-9.5 28.2l-15.4 8.5 23.3-42.2Z\"/><path d=\"M194.2,95.93c16.78,17.37,18.87,64.53-8.22,85.49-5.83-6.35-8.44-14.77-13.52-21.58-.65-.87-.74-2.88-.18-3.82,5.41-9,4.95-20.46,12.96-28.54,7.84-7.92,9.39-18.61,8.97-31.55Z\"/><path d=\"M61.68,95.93c-16.78,17.37-18.87,64.53,8.22,85.49,5.83-6.35,8.44-14.77,13.52-21.58,.65-.87,.74-2.88,.18-3.82-5.41-9-4.95-20.46-12.96-28.54-7.84-7.92-9.39-18.61-8.97-31.55Z\"/>";

  function copyVitalValue(source, target) {
    if (!source || !target) return;
    const signature = source.innerHTML;
    if (target.yofiVitalSourceHTML === signature) return;
    const fragment = document.createDocumentFragment();
    for (const node of source.childNodes) fragment.appendChild(node.cloneNode(true));
    fragment.querySelectorAll?.('[id]').forEach(node => node.removeAttribute('id'));
    target.replaceChildren(fragment);
    target.yofiVitalSourceHTML = signature;
  }
  function setVitalVar(node, name, value) {
    if (node.style.getPropertyValue(name) !== value) node.style.setProperty(name, value);
  }

  function syncScoreSummary(sourceDl, target, start, end) {
    const source = Array.from(sourceDl.children).slice(start, end);
    const signature = source.map((node) => node.outerHTML).join("");
    if (target.dataset.yofiSummary === signature) return;
    const dl = sourceDl.cloneNode(false);
    dl.removeAttribute("id");
    source.forEach((node) => {
      const clone = node.cloneNode(true);
      clone.removeAttribute("id");
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      dl.appendChild(clone);
    });
    target.replaceChildren(dl);
    target.dataset.yofiSummary = signature;
  }

  function layoutSpeciesStats(page) {
    if (!isSpeciesRoot()) return;
    const article = speciesArticleFrom(page);
    const stats = article?.querySelector("section.stats");
    const skills = article?.querySelector("section.skills");
    const sourceDl = skills?.querySelector(":scope > dl");
    if (!stats || !article || !sourceDl) return;

    let banner = stats.querySelector(":scope > .yofi-scores-banner");
    let body = stats.querySelector(":scope > .yofi-species-stats-body");
    if (!banner) {
      const heading = stats.querySelector(":scope > h2");
      const dls = Array.from(stats.children).filter((el) => el instanceof HTMLDListElement);
      const baseStats = dls[0];
      const attributes = dls[1];
      if (!heading || !baseStats || !attributes || attributes.children.length !== 12) return;
      banner = document.createElement("div");
      banner.className = "yofi-scores-banner";
      stats.insertBefore(banner, heading);
      // Keep and reuse the actual site heading and its native ::before.
      // The label is revealed only when the centered scores leave room.
      heading.replaceChildren();
      const scoreTitle = document.createElement("span");
      scoreTitle.className = "yofi-scores-heading-label";
      scoreTitle.textContent = "Scores";
      heading.append(scoreTitle);
      heading.setAttribute("aria-label", "Ability scores");
      banner.append(heading, attributes);
      attributes.classList.add("yofi-scores-strip");
      attributes.setAttribute("aria-label", "Ability scores");
      body = document.createElement("div");
      body.className = "yofi-species-stats-body";
      stats.insertBefore(body, baseStats);
      body.appendChild(baseStats);
      for (const cls of ["yofi-scores-skills", "yofi-scores-types"]) {
        const summary = document.createElement("div");
        summary.className = cls;
        body.appendChild(summary);
      }
    }
    // Keep the original AC/HP nodes. The vitals row belongs ABOVE the
    // ability scores, and must not be created again on repeated installs.
    const baseDl = body.querySelector(":scope > dl");
    let vitalsRow = stats.querySelector(":scope > .yofi-vitals-row")
      || body.querySelector(":scope > .yofi-vitals-row");
    if (baseDl && !vitalsRow) {
      const first = Array.from(baseDl.children).slice(0, 4);
      if (first.length === 4 && first[0].tagName === "DT" && first[1].tagName === "DD" &&
          first[2].tagName === "DT" && first[3].tagName === "DD") {
        const vitals = document.createElement("div");
        vitals.className = "yofi-vitals-row";
        for (let i = 0; i < 4; i += 2) {
          const field = document.createElement("div");
          field.className = "yofi-vital-field";
          field.append(first[i], first[i + 1]);
          vitals.appendChild(field);
        }
        vitalsRow = vitals;
      }
    }
    // Reuse the same row even when upgrading a card laid out by v0.9.6.
    if (vitalsRow && vitalsRow.parentElement !== stats) {
      stats.insertBefore(vitalsRow, banner);
    } else if (vitalsRow && vitalsRow.nextElementSibling !== banner) {
      stats.insertBefore(vitalsRow, banner);
    }
    Array.from(sourceDl.children).slice(0, 4).forEach((node) =>
      node.classList.add("yofi-skill-summary-original"));
    syncScoreSummary(sourceDl, body.querySelector(".yofi-scores-skills"), 0, 4);
    syncScoreSummary(sourceDl, body.querySelector(".yofi-scores-types"), 4);
    article.classList.add("yofi-scores-layout");
    // Unified content-driven stats layout at every card width.
    article.classList.remove("yofi-scores-conditional-wide");
    article.classList.toggle("yofi-scores-wide", true);
  }


  function syncSpeciesVitals(page) {
    if (!isSpeciesRoot()) return;
    const article = speciesArticleFrom(page);
    const metadata = article?.querySelector('section.info > div:first-child > dl');
    if (!(article instanceof HTMLElement) || !(metadata instanceof HTMLDListElement)) return;
    const stats = article.querySelector("section.stats");
    const row = stats?.querySelector(".yofi-vitals-row");
    if (!(row instanceof HTMLElement)) return;
    const values = Array.from(metadata.children).filter((node) => node.tagName === "DD");
    if (values.length < 6) return;
    const ensureField = (cls, title, source, prepend) => {
      let field = row.querySelector(`:scope > .${cls}`);
      if (!field) {
        field = document.createElement("div");
        field.className = `yofi-vital-field ${cls}`;
        const dt = document.createElement("dt");
        dt.textContent = title;
        const dd = document.createElement("dd");
        field.append(dt, dd);
        if (prepend) row.prepend(field);
        else row.append(field);
      }
      copyVitalValue(source, field.querySelector("dd"));
    };
    ensureField("yofi-vital-sr", "SR", values[2], true);
    ensureField("yofi-vital-minlevel", "MinLvl", values[4], false);

    // The two native AC/HP fields have no dedicated class in older builds;
    // identify them once without replacing their Svelte-owned DT/DD nodes.
    const middle = Array.from(row.querySelectorAll(":scope > .yofi-vital-field"))
      .filter((field) => !field.matches(".yofi-vital-sr, .yofi-vital-minlevel"));
    middle[0]?.classList.add("yofi-vital-ac");
    middle[1]?.classList.add("yofi-vital-hp");
    const specs = [
      ["yofi-vital-sr", "SR", "SR"],
      ["yofi-vital-ac", "Armor Class", "AC"],
      ["yofi-vital-hp", "Hit Points", "HP"],
      ["yofi-vital-minlevel", "Min Level", "MinLvl"],
    ];
    const controls = specs.map(([cls, full, short]) => ({
      label: row.querySelector(`:scope > .${cls} > dt`), full, short,
    }));
    if (controls.some(({label}) => !label)) return;
    const width = row.getBoundingClientRect().width;
    if (width <= 0) return;
    const preferFull = article.getBoundingClientRect().width >= 600;
    // Ignore the rendered DT labels in the signature: a width-constrained
    // fallback must not re-expand and collapse on each observer pass.
    const valueSignature = Array.from(row.querySelectorAll(":scope > .yofi-vital-field > dd"))
      .map((item) => item.textContent).join("|");
    const fitKey = [width.toFixed(1), preferFull ? "full" : "compact", valueSignature].join("|");
    if (row.dataset.yofiVitalsFit === fitKey) return;

    const setLabel = (control, useFull) => {
      const next = useFull ? control.full : control.short;
      if (control.label.textContent !== next) control.label.textContent = next;
    };
    for (const control of controls) setLabel(control, preferFull);
    // Preserve the 14px body font; shorten individual labels BEFORE using
    // the existing emergency font-size fitter on an exceptionally narrow row.
    const natural = 14;
    const required = (font) => {
      setVitalVar(row, "--yofi-vitals-font", `${font.toFixed(2)}px`);
      const children = Array.from(row.children);
      const styles = getComputedStyle(row);
      const gap = parseFloat(styles.columnGap || styles.gap) || 0;
      return children.reduce((sum, child) => sum + child.getBoundingClientRect().width, 0)
        + Math.max(0, children.length - 1) * gap;
    };
    let needed = required(natural);
    if (preferFull && needed > width - .5) {
      // Try the shortest reduction first, maximizing readable full labels.
      for (const index of [3, 2, 1]) {
        setLabel(controls[index], false);
        needed = required(natural);
        if (needed <= width - .5) break;
      }
    }
    if (needed > width - .5) {
      let lo = 9, hi = natural;
      for (let i = 0; i < 13; i++) {
        const mid = (lo + hi) / 2;
        if (required(mid) <= width - .5) lo = mid;
        else hi = mid;
      }
      setVitalVar(row, "--yofi-vitals-font", `${lo.toFixed(2)}px`);
    }
    row.dataset.yofiVitalsFit = fitKey;
  }

  // Preserve the source DOM nodes and their icons, trimming only visible name
  // spans in effectiveness badges. Apply to both source and wide-layout copy.
  function compactEffectivenessBadges(page) {
    if (!isSpeciesRoot()) return;
    const article = speciesArticleFrom(page);
    if (!article?.classList.contains('yofi-scores-layout')) return;
    for (const name of article.querySelectorAll("section.skills .inline-type-name > .name, .yofi-scores-types .inline-type-name > .name")) {
      const full = (name.textContent || "").trim();
      if (!full) continue;
      const initial = full[0].toUpperCase();
      if (full !== initial) {
        name.title = full;
        // Keep a useful accessible full type name on the badge itself.
        name.parentElement?.setAttribute("aria-label", full);
        // Use the *same* verified type glyph path as the header type pill.
        // Never invent or overpaint detail on the native badge icon.
        if (full.toLowerCase() === 'dragon') {
          const svg = name.closest('.inline-type-name')?.querySelector('svg');
          if (svg && svg.dataset.yofiMatchedHeaderGlyph !== 'dragon') {
            svg.setAttribute('viewBox', '0 0 256 256');
            svg.innerHTML = SPECIES_DRAGON_GLYPH;
            svg.dataset.yofiMatchedHeaderGlyph = 'dragon';
          }
        }
        if (name.childNodes.length === 1 && name.firstChild.nodeType === Node.TEXT_NODE) {
          name.firstChild.nodeValue = initial;
        } else name.textContent = initial;
      }
    }
  }

  function compactBaseStatLabels(page) {
    if (!isSpeciesRoot()) return;
    const article = speciesArticleFrom(page);
    if (!article?.classList.contains('yofi-scores-layout')) return;
    const names = {
      "armor class": "AC", "hit points": "HP",
      "proficiencies": "Skills", "saving throws": "Saves",
      "vulnerabilities": "Weak To", "resistances": "Resists", "immunities": "Immune",
    };
    for (const label of article.querySelectorAll(".yofi-species-stats-body dt, section.skills dt")) {
      const old = (label.textContent || "").trim().replace(/:$/, "");
      const replace = names[old.toLowerCase()];
      if (replace && replace !== old) {
        if (label.childNodes.length === 1 && label.firstChild.nodeType === Node.TEXT_NODE) {
          label.firstChild.nodeValue = replace;
        } else label.textContent = replace;
      }
    }
  }

  const SKILL_ABBREVIATIONS = Object.freeze({
    "acrobatics": "Acro", "animal handling": "Anml", "arcana": "Arc",
    "athletics": "Athl", "deception": "Dec", "history": "Hist",
    "insight": "Ins", "intimidation": "Intm", "investigation": "Inv",
    "medicine": "Med", "nature": "Nat", "perception": "Perc",
    "performance": "Perf", "persuasion": "Pers", "religion": "Rel",
    "sleight of hand": "SoH", "stealth": "Stealth", "survival": "Surv",
  });
  const ALL_SKILL_NAMES = new Set(Object.keys(SKILL_ABBREVIATIONS));
  const ALL_SAVE_NAMES = new Set(["str", "dex", "con", "int", "wis", "cha"]);
  function containsAllNamedProficiencies(value, expected) {
    const entries = value.split(",").map(item => item.trim().toLowerCase()).filter(Boolean);
    return entries.length === expected.size &&
      new Set(entries).size === expected.size &&
      entries.every(item => expected.has(item));
  }

  function compactSkillNames(page) {
    if (!isSpeciesRoot()) return;
    const article = speciesArticleFrom(page);
    if (!article?.classList.contains('yofi-scores-layout')) return;
    // The summary is cloned from the native Skills/Saves. Never abbreviate
    // that live source: Svelte may update it when changing species.
    for (const field of article.querySelectorAll(".yofi-scores-skills > dl > dd:first-of-type")) {
      const full = field.dataset.yofiFullSkills || (field.textContent || "").trim();
      if (!full) continue;
      if (!field.dataset.yofiFullSkills) field.dataset.yofiFullSkills = full;
      // A sole skill has room for its entire native name. Abbreviate only
      // multi-skill summaries, preserving the underlying Svelte data.
      const parts = full.split(/,\s*/).map(part => part.trim()).filter(Boolean);
      const isAll = /^all$/i.test(full) || containsAllNamedProficiencies(full, ALL_SKILL_NAMES);
      const display = isAll ? "ALL" : /^none$/i.test(full) ? "None" : parts.length === 1
        ? parts[0].replace(/^\p{L}/u, letter => letter.toUpperCase())
        : parts.map(part => SKILL_ABBREVIATIONS[part.toLowerCase()] || part).join(", ");
      if (field.textContent !== display) field.textContent = display;
      field.classList.toggle("yofi-stat-none-value",display==="None");
      field.title = full;
      field.setAttribute("aria-label", isAll ? "All 18 skills" : full);
    }
    // The source stays intact; the cloned Saves value is display-only.
    for (const field of article.querySelectorAll(".yofi-scores-skills > dl > dd.upper")) {
      const full = field.dataset.yofiFullSaves || (field.textContent || "").trim();
      if (!field.dataset.yofiFullSaves) field.dataset.yofiFullSaves = full;
      const isAll = /^all$/i.test(full) || containsAllNamedProficiencies(full, ALL_SAVE_NAMES);
      if (isAll && field.textContent !== "ALL") field.textContent = "ALL";
      if (/^none$/i.test(full) && field.textContent !== "None") field.textContent = "None";
      field.classList.toggle("yofi-all-saves", isAll);
      if (isAll) {
        field.title = full;
        field.setAttribute("aria-label", "All six saving throws");
      }
    }
    // The native Saves DD has .upper even for the literal value "none".
    // Correct only that empty value, on both original and display summary.
    for (const field of article.querySelectorAll("section.skills dd.upper, .yofi-scores-skills dd.upper")) {
      const isNone=/^none$/i.test((field.textContent||"").trim());
      if(isNone && field.textContent!=="None")field.textContent="None";
      field.classList.toggle("yofi-empty-saves",isNone);
      field.classList.toggle("yofi-stat-none-value",isNone);
    }
  }

  function normalizeStatSentinels(page){
    // Presentation-only sentinel normalization across native stat fields and
    // their wide summary. Avoid mutating badges, prose, labels, or links.
    const article=speciesArticleFrom(page);
    if(!article?.classList.contains('yofi-scores-layout'))return;
    for(const dd of article.querySelectorAll('.yofi-species-stats-body dd, section.skills dd')){
      if(dd.children.length)continue;
      const raw=(dd.textContent||'').trim();
      if(!/^(?:all|none)$/i.test(raw))continue;
      const value=/^none$/i.test(raw)?'None':'ALL';
      if(raw!==value&&dd.childNodes.length===1&&dd.firstChild.nodeType===Node.TEXT_NODE)
        dd.firstChild.nodeValue=value;
      dd.classList.toggle('yofi-stat-none-value',value==='None');
      if(value==='None'&&(dd.style.getPropertyValue('text-transform')!=='none'||
          dd.style.getPropertyPriority('text-transform')!=='important'))
        dd.style.setProperty('text-transform','none','important');
    }
  }

  const COMPACT_SPEED_NAME = Object.freeze({
    walking: "Walk", climbing: "Climb", swimming: "Swim",
    flying: "Fly", hover: "Hover", burrowing: "Burrow",
  });
  const FULL_SPEED_NAME = Object.freeze({
    walking: "Walking", climbing: "Climbing", swimming: "Swimming",
    flying: "Flying", hover: "Hover", burrowing: "Burrowing",
  });
  const SHORT_SENSE_NAME = Object.freeze({
    darkvision: "Dark", blindsight: "Blind", truesight: "True", tremorsense: "Tremor",
  });
  const FULL_SENSE_NAME = Object.freeze({
    darkvision: "Darkvision", blindsight: "Blindsight", truesight: "Truesight", tremorsense: "Tremorsense",
  });
  const SPEED_ALIASES = Object.freeze(Object.fromEntries(
    Object.entries(FULL_SPEED_NAME).flatMap(([key, name]) => [
      [key, key], [COMPACT_SPEED_NAME[key].toLowerCase(), key], [name.toLowerCase(), key],
    ]),
  ));
  const SENSE_ALIASES = Object.freeze(Object.fromEntries(
    Object.entries(FULL_SENSE_NAME).flatMap(([key, name]) => [
      [key, key], [SHORT_SENSE_NAME[key].toLowerCase(), key], [name.toLowerCase(), key],
    ]),
  ));

  function compactSpeciesDistances(page) {
    if (!isSpeciesRoot()) return;
    const article = speciesArticleFrom(page);
    const stats = article?.querySelector("section.stats");
    const basic = stats?.querySelector(":scope > .yofi-species-stats-body > dl:first-of-type")
      ?? stats?.querySelector(":scope > dl:first-of-type");
    if (!(basic instanceof HTMLDListElement)) return;
    // Uniform short forms in Speed and Senses at every card width. Keep the
    // native Svelte records untouched; these are display-only text nodes.
    const fullNames = false;

    const children = Array.from(basic.children);
    for (let i = 0; i < children.length - 1; i += 1) {
      const label = children[i];
      if (!(label instanceof HTMLElement) || label.tagName !== "DT") continue;
      const kind = label.textContent?.trim().replace(/:$/, "").toLowerCase();
      if (kind !== "speed" && kind !== "senses") continue;
      const values = children[i + 1];
      if (!(values instanceof HTMLElement)) continue;
      for (const item of values.querySelectorAll(":scope > dd")) {
        const original = item.textContent?.trim() ?? "";
        const aliases = kind === "speed" ? SPEED_ALIASES : SENSE_ALIASES;
        const full = kind === "speed" ? FULL_SPEED_NAME : FULL_SENSE_NAME;
        const short = kind === "speed" ? COMPACT_SPEED_NAME : SHORT_SENSE_NAME;
        let value = null, type = null;
        // Native speeds: "35ft. swimming"; native senses: "truesight 100ft.".
        // Previously processed entries: "Swim 35" / "True 100".
        const leadingName = original.match(/^([a-z]+)\s+(\d+(?:\.\d+)?)\s*(?:ft\.?)?$/i);
        const trailingName = original.match(/^(\d+(?:\.\d+)?)\s*(?:ft\.?\s*)?([a-z]+)$/i);
        if (leadingName && aliases[leadingName[1].toLowerCase()]) {
          type = aliases[leadingName[1].toLowerCase()];
          value = leadingName[2];
        } else if (trailingName && aliases[trailingName[2].toLowerCase()]) {
          type = aliases[trailingName[2].toLowerCase()];
          value = trailingName[1];
        }
        if (!type) continue;
        const formatted = `${(fullNames ? full : short)[type]} ${value}`;
        if (formatted !== original && item.childNodes.length === 1 &&
            item.firstChild.nodeType === Node.TEXT_NODE) {
          item.firstChild.nodeValue = formatted;
        }
      }
    }
  }

  /* v0.12.1: eighteen active layouts. L and Q retired for detached immunity; R/S restore the original narrow layouts. */
  const af=k=>({t:'field',k}), ac=(...a)=>({t:'col',a}), ar=(...a)=>({t:'row',a}), ad=()=>({t:'divider'});
  const am=ac(af('speed'),af('senses')), ap=ac(af('skills'),af('saves'));
  const ae=ac(af('weak'),af('resist'),af('immune'));
  const adaptiveLayouts=Object.freeze({
    A:ac(ar(am,ap),ad(),ar(af('weak'),af('resist'),af('immune'))),
    B:ar(ac(am,ap),ae),
    C:ac(ar(am,ap),ad(),ar(af('weak'),af('immune')),af('resist')),
    D:ac(ar(am,ap),ad(),af('weak'),ar(af('resist'),af('immune'))),
    E:ac(ar(am,ap),ad(),ae),
    F:ar(am,ap,ac(ar(af('weak'),af('resist')),af('immune'))),
    G:ar(am,ap,ac(af('weak'),ar(af('resist'),af('immune')))),
    H:ar(am,ap,ac(ar(af('weak'),af('immune')),af('resist'))),
    I:ar(am,ap,ae),
    J:ac(ar(af('speed'),af('senses'),ap),ad(),ar(af('weak'),af('resist'),af('immune'))),
    K:ar(af('speed'),ac(af('senses'),ap),ae),
    M:ac(ar(af('speed'),af('senses'),ap),ad(),ar(af('weak'),af('resist')),af('immune')),
    N:ac(ar(af('speed'),af('senses'),ap),ad(),ae),
    O:ar(af('speed'),af('senses'),ap,ae),
    P:ac(ar(af('speed'),af('senses'),af('skills'),af('saves')),ad(),ar(af('weak'),af('resist'),af('immune'))),
    T:ac(ar(af('speed'),af('skills'),af('saves')),ad(),ar(af('weak'),af('resist'),af('immune'))), // True 3-over-3; no Senses field.
    // Original v0.11.33g G/H: these were accidentally omitted in v0.12.0.
    R:ac(ar(am,ap),ad(),ar(ac(af('weak'),af('immune')),af('resist'))),
    S:ac(ar(am,ap),ad(),ar(af('weak'),ac(af('resist'),af('immune')))),
  });
  // A modest two-point score preference ONLY when both natural text pairs
  // occupy their own continuous vertical stacks (Speed/Senses, Skills/Saves).
  // Structural, not species-specific; never changes hard fit eligibility.
  const adaptivePairedFieldBonus=Object.fromEntries(Object.entries(adaptiveLayouts).map(([id,tree])=>{
    const hasPair=(node,a,b)=>node.t==='col' && node.a.some((n,i)=>
      n.t==='field'&&n.k===a&&node.a.slice(i+1).some(m=>m.t==='field'&&m.k===b)) ||
      (node.a||[]).some(n=>hasPair(n,a,b));
    return [id,hasPair(tree,'speed','senses')&&hasPair(tree,'skills','saves')?2:0];
  }));
  const adaptiveNames={speed:'Speed',senses:'Senses',skills:'Skills',saves:'Saves',weak:'Weak To',resist:'Resists',immune:'Immune'};
  const adaptiveEffects=new Set(['weak','resist','immune']);
  const adaptiveCache=new WeakMap();
  let conditionalScoreFontEpoch=0;
  const adaptiveGap=12, adaptiveBadgeGap=3.6, adaptiveLabelGap=7;

  function adaptiveSources(body){
    const dl1=body.querySelector(':scope > dl:first-of-type');
    const dl2=body.querySelector(':scope > .yofi-scores-skills > dl');
    const dl3=body.querySelector(':scope > .yofi-scores-types > dl');
    if(!dl1||!dl2||!dl3)return null;
    const fields={};
    for(const dl of [dl1,dl2,dl3]){
      const nodes=[...dl.children];
      for(let i=0;i<nodes.length-1;i++){
        const dt=nodes[i];if(dt.tagName!=='DT')continue;
        const name=(dt.textContent||'').trim().toLowerCase().replace(/:$/,'');
        const map={'weak to':'weak',weaknesses:'weak',resists:'resist',resistances:'resist',immune:'immune',immunities:'immune',speed:'speed',senses:'senses',skills:'skills',saves:'saves'};
        if(map[name]){fields[map[name]]={dt,val:nodes[i+1]};i++;}
      }
    }
    if(!['speed','skills','saves','weak','resist','immune'].every(k=>fields[k]))return null;
    const count=k=>fields[k]?.val.querySelectorAll('.inline-type-name').length||0;
    const rows=k=>{const x=fields[k];if(!x)return 0;
      const a=[...x.val.querySelectorAll(':scope > dd')];
      return a.length?a.filter(v=>(v.textContent||'').trim()).length:Number(!!x.val.textContent.trim());};
    return {fields,counts:{weak:count('weak'),resist:count('resist'),immune:count('immune')},speedRows:rows('speed'),senseRows:rows('senses')};
  }
  // Eligibility is determined by the SCHEMATIC, not an individual species.
  // A dedicated column holds only one field in the layout definition. The
  // natural Speed/Senses stack remains shared even when a species has no
  // Senses; a missing value must not suddenly disqualify otherwise useful
  // layouts (including the narrow two-column ones).
  const adaptiveSoloMovement=Object.fromEntries(Object.entries(adaptiveLayouts).map(([id,tree])=>{
    const solo=new Set();let paired=false;
    const visit=node=>{
      if(node.t==='row'){
        const rowSolo=node.a.map(part=>{
          // Also recognize an explicit one-field column wrapper, but never
          // collapse a multi-field stack based on absent species data.
          while(part.t==='col'&&part.a.length===1)part=part.a[0];
          return part.t==='field'&&(part.k==='speed'||part.k==='senses')?part.k:null;
        });
        if(rowSolo.includes('speed'))solo.add('speed');
        if(rowSolo.includes('senses'))solo.add('senses');
        if(rowSolo.includes('speed')&&rowSolo.includes('senses'))paired=true;
      }
      for(const child of node.a||[])visit(child);
    };
    visit(tree);
    return [id,{speed:solo.has('speed'),senses:solo.has('senses'),paired}];
  }));
  function adaptiveEligible(id,data){
    // T omits Senses altogether: never hide a real Senses field.
    if(id==='T'&&data.senseRows>0)return false;
    // Preserve existing absent-Senses restrictions for layouts J/M/N/O.
    // Former 2-value thresholds are intentionally removed: the two-solo-
    // column exception must also work for a single Speed and single Sense.
    if(['J','M','N','O'].includes(id)&&!data.senseRows)return false;
    const solo=adaptiveSoloMovement[id];
    // Both movement fields may own separate columns, but only when both
    // actually exist. Otherwise an isolated field needs three true values.
    const together=solo.paired&&data.speedRows>0&&data.senseRows>0;
    // T is a compact three-over-three grid rather than an isolated movement
    // column beside stacked fields. Allow it with one Speed value.
    if(solo.speed&&data.speedRows<3&&!together&&id!=='T')return false;
    // No Senses entry means there is no Senses column to gate.
    if(solo.senses&&data.senseRows>0&&data.senseRows<3&&!together)return false;
    return true;
  }
  function adaptiveField(k,data,id){
    const source=data.fields[k];
    const field=document.createElement('div');field.className='yofi12-field';field.dataset.key=k;
    if(adaptiveEffects.has(k))field.classList.add('yofi12-effect');
    if(!source||(k==='senses'&&!data.senseRows)){field.dataset.absent='true';return field;}
    const label=document.createElement('dt');label.textContent=adaptiveNames[k];
    const val=document.createElement('div');val.className='yofi12-value';
    if(source.val.tagName==='DD')val.append(source.val.cloneNode(true));
    else {const items=[...source.val.querySelectorAll(':scope > dd')];
      if(items.length)items.forEach(dd=>val.append(dd.cloneNode(true)));
      else val.append(source.val.cloneNode(true));}
    val.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    const hasBadge=adaptiveEffects.has(k)&&data.counts[k]>0;
    if(hasBadge)val.classList.add('yofi12-badges');
    if(!hasBadge&&/^none$/i.test(val.textContent.trim())){
      val.classList.add('yofi12-none');val.querySelectorAll('dd').forEach(dd=>{dd.textContent='None';dd.classList.add('yofi-stat-none-value');});}
    if(!hasBadge&&/^all$/i.test(val.textContent.trim())){
      val.querySelectorAll('dd').forEach(dd=>{dd.textContent='ALL';dd.style.textTransform='none';});}
    if((id==='R'||id==='S')&&(k==='weak'||k==='resist'))field.classList.add('yofi12-title-above');
    field.append(label,val);return field;
  }
  function adaptiveActive(tree,data){return tree.a.filter(t=>!(t.t==='field'&&t.k==='senses'&&!data.senseRows));}
  function adaptiveBuild(tree,data,id){
    if(tree.t==='field')return adaptiveField(tree.k,data,id);
    if(tree.t==='divider'){const n=document.createElement('div');n.className='yofi12-divider';return n;}
    const e=document.createElement('div');e.className='yofi12-group';e.dataset.kind=tree.t;
    adaptiveActive(tree,data).forEach(t=>e.append(adaptiveBuild(t,data,id)));return e;
  }
  function adaptiveMeasure(txt,ctx,font){ctx.font=font;return ctx.measureText(txt||'').width;}
  function adaptiveCalibrateFields(probe,data){
    // The badge's actual painted width (including narrow-screen zoom, CSS
    // font rules and the Ice letter cell) is the only valid unit for wrapping.
    // Measure once per layout pass; don't assume a badge has a 30px width or
    // impose any fixed badge-count preference or minimum row length.
    const sample=adaptiveBuild(ac(af('speed'),af('senses'),af('skills'),af('saves'),af('weak'),af('resist'),af('immune')),data,'I');
    probe.replaceChildren(sample);
    adaptiveIceCell(sample);
    data.badgeGeometry=Object.create(null);
    data.labelGeometry=Object.create(null);
    data.textGeometry=Object.create(null);
    for(const field of sample.querySelectorAll('.yofi12-field')){
      const key=field.dataset.key,label=field.querySelector(':scope > dt');
      const value=field.querySelector(':scope > .yofi12-value');
      if(!label||!value)continue;
      data.labelGeometry[key]={width:adaptiveRect(label).width,
        gap:parseFloat(getComputedStyle(field).columnGap)||adaptiveLabelGap};
      const badges=[...value.querySelectorAll('.inline-type-name')];
      if(badges.length){
        data.badgeGeometry[key]={width:Math.max(...badges.map(p=>adaptiveRect(p).width)),
          gap:parseFloat(getComputedStyle(value).columnGap)||adaptiveBadgeGap};
      }else{
        // Canvas guesses using the stage font can miss the actual dd font,
        // especially compressed None values and short movement labels.
        // Measure natural, unwrapped value width using the same rendered DOM.
        let full=0,word=0;
        for(const dd of value.querySelectorAll(':scope > dd')){
          const style=getComputedStyle(dd),canvas=document.createElement('canvas').getContext('2d');
          if(canvas){canvas.font=style.font;
            for(const segment of dd.textContent.trim().split(/[\s,]+/))
              word=Math.max(word,canvas.measureText(segment).width);}
          dd.style.whiteSpace='nowrap';dd.style.width='max-content';
          full=Math.max(full,adaptiveRect(dd).width);
        }
        data.textGeometry[key]={full,word};
      }
    }
    probe.replaceChildren();
  }
  function adaptiveNeeds(tree,data,id,ctx,font,bold,fullEffectRow=false){
    if(tree.t==='divider')return {min:0,pref:0};
    if(tree.t==='field'){
      const src=data.fields[tree.k];if(!src)return {min:0,pref:0};
      const key=tree.k,measure=data.labelGeometry?.[key];
      const label=measure?.width||adaptiveMeasure(adaptiveNames[key]+':',ctx,bold);
      const labelGap=measure?.gap||adaptiveLabelGap;
      const badges=adaptiveEffects.has(key)?data.counts[key]:0;
      if(badges){
        const geometry=data.badgeGeometry?.[key];
        const cell=geometry?.width||30,gap=geometry?.gap??adaptiveBadgeGap;
        const above=(id==='R'||id==='S')&&(key==='weak'||key==='resist');
        // One complete badge fits at minimum. Preferred width accommodates
        // ALL badges on one row, regardless of species or badge count.
        // The real fit/wrap decision is made after the actual grid is painted.
        const one=cell,whole=badges*cell+(badges-1)*gap;
        return {min:above?Math.max(label,one):label+labelGap+one,
          pref:above?Math.max(label,whole):label+labelGap+whole};}
      const texts=[...src.val.querySelectorAll(':scope > dd')];
      const parts=(texts.length?texts:[src.val]).map(x=>x.textContent.trim());
      const measured=data.textGeometry?.[key];
      const full=measured?.full??Math.max(0,...parts.map(x=>adaptiveMeasure(x,ctx,font)));
      const word=measured?.word??Math.max(0,...parts.flatMap(x=>x.split(/[\s,]+/).map(w=>adaptiveMeasure(w,ctx,font))));
      const min=['speed','senses'].includes(key)?full:Math.min(full,Math.max(word,15));
      return {min:label+labelGap+min,pref:label+labelGap+full};
    }
    const parts=adaptiveActive(tree,data);
    const childEffectRow=tree.t==='row'&&parts.filter(t=>t.t==='field'&&adaptiveEffects.has(t.k)).length===3;
    const arr=parts.map(t=>adaptiveNeeds(t,data,id,ctx,font,bold,childEffectRow));
    if(!arr.length)return {min:0,pref:0};
    if(tree.t==='row')return {min:arr.reduce((n,x)=>n+x.min,0)+adaptiveGap*(arr.length-1),
      pref:arr.reduce((n,x)=>n+x.pref,0)+adaptiveGap*(arr.length-1)};
    return {min:Math.max(...arr.map(x=>x.min)),pref:Math.max(...arr.map(x=>x.pref))};
  }
  function adaptiveAllocate(specs,width){
    const room=width-adaptiveGap*Math.max(0,specs.length-1);
    const mins=specs.map(s=>s.min),pref=specs.map(s=>s.pref);
    const minsum=mins.reduce((a,b)=>a+b,0),prefsum=pref.reduce((a,b)=>a+b,0);
    if(room<minsum-.8)return null;
    // Monotone widths: increasing the card must never make a column suddenly
    // narrower when we transition from minimum to preferred content sizes.
    if(room>=prefsum){const extra=(room-prefsum)/Math.max(1,specs.length);return pref.map(v=>v+extra);}
    const available=room-minsum;
    const wanted=pref.map((v,i)=>Math.max(0,v-mins[i]));
    const wantedSum=wanted.reduce((a,b)=>a+b,0);
    if(!wantedSum)return mins.map(v=>v+available/specs.length);
    return mins.map((v,i)=>v+available*wanted[i]/wantedSum);
  }
  function adaptiveRefitBadgeGrids(root){
    // Column-label normalization and nested-row balancing can change value
    // widths AFTER the first arrangement. Re-evaluate each badge grid against
    // its ACTUAL final content rectangle, not a previous guess.
    for(const val of root.querySelectorAll('.yofi12-value.yofi12-badges')){
      const badges=[...val.querySelectorAll('.inline-type-name')];
      if(!badges.length)continue;
      const cell=Math.max(...badges.map(p=>adaptiveRect(p).width));
      const gap=parseFloat(getComputedStyle(val).columnGap)||adaptiveBadgeGap;
      const available=adaptiveRect(val).width;
      const fit=Math.min(badges.length,Math.floor((available+gap+.15)/(cell+gap)));
      if(fit<1)return false;
      const rows=Math.ceil(badges.length/fit);
      const columns=Math.ceil(badges.length/rows);
      val.style.setProperty('--yofi12-cols',String(columns));
      val.style.setProperty('--yofi12-badge-width',cell.toFixed(2)+'px');
    }
    return true;
  }
  function adaptiveNextWrapBreakpoint(node,tree,data,id,ctx,font,bold){
    // Width at which ONE currently wrapped field can shed a visual row.
    // Used only to propose candidate transfers; the DOM must still pass
    // strict fit/overflow checks after the transfer.
    if(tree.t==='field'){
      const val=node.querySelector(':scope > .yofi12-value');
      if(!val)return Infinity;
      const left=adaptiveRect(val).left-adaptiveRect(node).left;
      if(val.classList.contains('yofi12-badges')){
        const badges=[...val.querySelectorAll('.inline-type-name')];
        if(badges.length<2)return Infinity;
        const cols=Number(val.style.getPropertyValue('--yofi12-cols'))||1;
        const rows=Math.ceil(badges.length/cols);
        if(rows<=1)return Infinity;
        const nextCols=Math.ceil(badges.length/(rows-1));
        const cell=Math.max(...badges.map(p=>adaptiveRect(p).width));
        const gap=parseFloat(getComputedStyle(val).columnGap)||adaptiveBadgeGap;
        return left+nextCols*cell+(nextCols-1)*gap+.65;
      }
      const line=parseFloat(getComputedStyle(val).lineHeight)||18;
      const dds=[...val.querySelectorAll(':scope > dd')];
      if(!dds.some(dd=>adaptiveRect(dd).height>line*1.5))return Infinity;
      const required=data.textGeometry?.[tree.k]?.full??
        Math.max(0,...dds.map(dd=>adaptiveMeasure(dd.textContent.trim(),ctx,font)));
      return left+required+.5;
    }
    if(tree.t==='divider')return Infinity;
    const active=adaptiveActive(tree,data);
    const candidates=active.map((part,i)=>{
      const target=adaptiveNextWrapBreakpoint(node.children[i],part,data,id,ctx,font,bold);
      if(!Number.isFinite(target))return Infinity;
      return tree.t==='row'?adaptiveRect(node).width+
        (target-adaptiveRect(node.children[i]).width):target;
    });
    return Math.min(Infinity,...candidates);
  }
  function adaptiveOptimizeRowSpace(row,parts,needs,tracks,data,id,ctx,font,bold,apply){
    // The initial allocation is only a proposed geometry. Negotiate track
    // widths when a CURRENTLY wrapped text/badge field can lose a row.
    // Width occupied by another column is not presumed spare: each proposed
    // transfer is re-rendered and rejected if it increases TOTAL row height,
    // produces a hard fit failure, or worsens the measured combined score.
    if(parts.length<2||parts.length>4||
      !row.querySelector('.yofi12-badges'))return tracks;
    const measure=()=>{
      const height=adaptiveRect(row).height;
      let badgeRows=0,oneRow=0;
      for(const grid of row.querySelectorAll('.yofi12-badges')){
        const count=grid.querySelectorAll('.inline-type-name').length;
        const cols=Number(grid.style.getPropertyValue('--yofi12-cols'))||1;
        const rows=Math.ceil(count/cols);
        badgeRows+=rows;
        if(rows===1)oneRow++;
      }
      // The same effective badge-wrap terms used in candidate scoring.
      return {height,badgeRows,oneRow,cost:height+2*badgeRows-3*oneRow};
    };
    let best=tracks.slice(),base=measure();
    let checked=0;
    // Two steps permit unwrapping a 3-row grid after a 4-row reduction,
    // without multiplying candidate work by every possible pixel width.
    for(let pass=0;pass<2;pass++){
      let improved=false;
      for(let dest=0;dest<parts.length&&checked<6;dest++){
        const next=adaptiveNextWrapBreakpoint(row.children[dest],parts[dest],
          data,id,ctx,font,bold);
        const needed=next-best[dest];
        if(!Number.isFinite(needed)||needed<.2)continue;
        const donors=parts.map((part,i)=>({i,
          headroom:i===dest?0:Math.max(0,best[i]-needs[i].min-.65)}))
          .filter(x=>x.headroom>.5).sort((a,b)=>b.headroom-a.headroom);
        if(donors.reduce((n,d)=>n+d.headroom,0)<needed-.1)continue;
        const proposal=best.slice();let remaining=needed;
        for(const donor of donors){
          if(remaining<=0)break;
          const moved=Math.min(remaining,donor.headroom);
          proposal[donor.i]-=moved;proposal[dest]+=moved;remaining-=moved;
        }
        if(remaining>.1)continue;
        checked++;
        const ok=apply(proposal)&&adaptiveFits(row);
        let accepted=false;
        if(ok){
          const after=measure();
          // A new text wrap is permitted ONLY when it does not increase the
          // section's overall height and makes the overall composition better.
          if(after.height<=base.height+.35&&after.cost<base.cost-.3){
            best=proposal;base=after;improved=true;accepted=true;
          }
        }
        if(!accepted)apply(best);
      }
      if(!improved)break;
    }
    return best;
  }
  function adaptiveArrange(node,tree,data,id,width,ctx,font,bold){
    if(tree.t==='divider')return true;
    if(tree.t==='field'){
      const val=node.querySelector(':scope > .yofi12-value');if(!val)return false;
      const pills=[...val.querySelectorAll('.inline-type-name')];if(!pills.length)return true;
      const badgeWidth=Math.max(...pills.map(x=>x.getBoundingClientRect().width));

      const avail=val.getBoundingClientRect().width;
      if(!(badgeWidth>0))return false;
      const gap=parseFloat(getComputedStyle(val).columnGap)||adaptiveBadgeGap;
      const fit=Math.floor((avail+gap+.3)/(badgeWidth+gap));
      if(fit<1)return false;
      // Fit is the number of physically measured badge cells possible across
      // this track; wrap only when that count is below the actual field count.
      const rows=Math.ceil(pills.length/fit),cols=Math.ceil(pills.length/rows);
      val.style.setProperty('--yofi12-cols',String(cols));
      val.style.setProperty('--yofi12-badge-width',badgeWidth.toFixed(2)+'px');
      return true;
    }
    const active=adaptiveActive(tree,data);
    if(tree.t==='row'){
      const fullEffectRow=active.filter(t=>t.t==='field'&&adaptiveEffects.has(t.k)).length===3;
      const needs=active.map(t=>adaptiveNeeds(t,data,id,ctx,font,bold,fullEffectRow));
      let tracks=adaptiveAllocate(needs,width);
      if(!tracks)return false;
      // A two-field effectiveness row *nested inside* an upper horizontal
      // column may have lots of spare width. Keep each field at its actual
      // preferred footprint and leave the slack at the END; don't split the
      // unused width in half and strand Immune on the far right. This is
      // purely geometric and applies to every species that selects it.
      const parent=node.parentElement;
      const nestedEffectPair=active.length===2&&active.every(t=>t.t==='field'&&adaptiveEffects.has(t.k))&&
        parent?.dataset.kind==='col'&&parent.parentElement?.dataset.kind==='row';
      if(nestedEffectPair){
        const totalPref=needs.reduce((sum,n)=>sum+n.pref,0)+adaptiveGap;
        if(totalPref<=width)tracks=needs.map(n=>n.pref);
      }
      // In a nested pair under a three-track row, the LAST macro column
      // represents TWO visual columns. Use quarter-width starts across all
      // four visible columns where every measured field still fits. This
      // applies equally to F/G/H and all species, never an ID-specific rule.
      if(nestedEffectPair&&parent.dataset.yofiFourTrack==='true'){
        const inner=(width-adaptiveGap)/2;
        const balanced=[inner,inner];
        if(balanced.every((w,i)=>w>=needs[i].min-.5))tracks=balanced;
      }
      // An exclusively three-field effectiveness band uses balanced starts
      // when its *measured* content can fit. Other layouts retain intrinsic
      // distribution; no species or panel-width exceptions.
      if(fullEffectRow && active.length===3){
        const balanced=[width/3-adaptiveGap, width/3-adaptiveGap, width/3];
        if(balanced.every((w,i)=>w>=needs[i].min-.5))tracks=balanced;
      }
      const apply=ts=>{
        node.style.gridTemplateColumns=ts.map(n=>n.toFixed(3)+'px').join(' ');
        const ok=active.every((t,i)=>adaptiveArrange(node.children[i],t,data,id,ts[i],ctx,font,bold));
        if(!ok)return false;
        // Only direct stacked fields share a label track. Flat badge bands
        // have no such shift, so skip costly redundant re-measurement.
        const shared=active.some(t=>t.t==='col'&&
          (t.a||[]).filter(x=>x.t==='field').length>1);
        const sharedEffects=active.some(t=>t.t==='col'&&
          (t.a||[]).filter(x=>x.t==='field'&&adaptiveEffects.has(x.k)).length>1);
        if(shared)adaptiveAlignColumns(node);
        return !sharedEffects||adaptiveRefitBadgeGrids(node);
      };
      if(!apply(tracks))return false;
      // Optimise actual combined visual height, including badge row counts.
      // No allocation is certified until the painted DOM passes hard fit.
      tracks=adaptiveOptimizeRowSpace(node,active,needs,tracks,data,id,ctx,font,bold,apply);
      // A third (outer) track containing an effectiveness pair behaves
      // optically as two columns. Trial the quarter-width four-track plan;
      // preserve the prior plan if it gains badge rows or increases height.
      const last=active[2];
      const nested=last?.t==='col'&&last.a?.find(x=>x.t==='row'&&x.a.length===2&&
        x.a.every(y=>y.t==='field'&&adaptiveEffects.has(y.k)));
      if(active.length===3&&nested&&node.children[2]){
        const q=width/4;
        const plan=[q-adaptiveGap,q-adaptiveGap,width-2*q];
        const minPair=nested.a.map(t=>adaptiveNeeds(t,data,id,ctx,font,bold).min);
        const half=(plan[2]-adaptiveGap)/2;
        if(plan.every((v,i)=>v>=needs[i].min-.5)&&minPair.every(v=>v<=half+.5)){
          const priorHeight=adaptiveRect(node).height;
          const priorRows=[...node.querySelectorAll('.yofi12-badges')].map(g=>{
            const count=g.querySelectorAll('.inline-type-name').length;
            return Math.ceil(count/(Number(g.style.getPropertyValue('--yofi12-cols'))||1));
          });
          const lastCol=node.children[2];
          lastCol.dataset.yofiFourTrack='true';
          const ok=apply(plan);
          const nextRows=[...node.querySelectorAll('.yofi12-badges')].map(g=>{
            const count=g.querySelectorAll('.inline-type-name').length;
            return Math.ceil(count/(Number(g.style.getPropertyValue('--yofi12-cols'))||1));
          });
          if(!ok||adaptiveRect(node).height>priorHeight+.5||
            nextRows.some((n,i)=>n>priorRows[i])||!adaptiveFits(node)){
            delete lastCol.dataset.yofiFourTrack;
            apply(tracks);
          }
        }
      }
      return true;
    }
    return active.every((t,i)=>adaptiveArrange(node.children[i],t,data,id,width,ctx,font,bold));
  }
  function adaptiveUnifyRowTracks(root,tree,data,id,width,ctx,font,bold){
    // Two sibling rows separated by a divider may share column start positions.
    // This is a geometric operation, not a species/layout-specific preference.
    // Try it on the SAME measured candidate; revert if it creates wrapping,
    // changes badge counts per row, increases height or causes overflow.
    const snapshot=(nodes)=>{
      const result=[];
      for(const parent of nodes){
        for(const f of parent.querySelectorAll('.yofi12-field:not([data-absent])')){
          const val=f.querySelector(':scope > .yofi12-value');
          if(!val)continue;
          const badge=val.classList.contains('yofi12-badges');
          if(badge){
            const n=val.querySelectorAll('.inline-type-name').length;
            const cols=Number(val.style.getPropertyValue('--yofi12-cols'))||1;
            result.push(['badge',f.dataset.key,Math.ceil(n/cols)]);
          }else{
            const lines=[...val.querySelectorAll(':scope > dd')].map(dd=>{
              const cs=getComputedStyle(dd),h=adaptiveRect(dd).height;
              const line=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.3;
              return Math.max(1,Math.round(h/Math.max(1,line)));
            });
            result.push(['text',f.dataset.key,...lines]);
          }
        }
      }
      return result;
    };
    const growing=(before,after)=>before.length!==after.length||before.some((a,i)=>
      a.length!==after[i].length||a.slice(2).some((v,j)=>after[i][j+2]>v));
    const visit=(node,shape)=>{
      if(shape.t==='field'||shape.t==='divider')return;
      const parts=adaptiveActive(shape,data);
      if(shape.t==='col'){
        for(let i=0;i<parts.length;i++){
          const left=parts[i],right=parts[i+2];
          if(!right||left.t!=='row'||parts[i+1].t!=='divider'||right.t!=='row')continue;
          const rows=[node.children[i],node.children[i+2]];
          const columns=[adaptiveActive(left,data),adaptiveActive(right,data)];
          if(columns[0].length<2||columns[0].length!==columns[1].length)continue;
          // Both rows span the same parent width and use the same column gap.
          const original=rows.map(row=>({
            columns:row.style.gridTemplateColumns,
            widths:[...row.children].map(child=>adaptiveRect(child).width)
          }));
          const baseHeight=adaptiveRect(root).height;
          const before=snapshot(rows);
          const shared=columns[0].map((part,j)=>{
            const full1=columns[0].filter(t=>t.t==='field'&&adaptiveEffects.has(t.k)).length===3;
            const full2=columns[1].filter(t=>t.t==='field'&&adaptiveEffects.has(t.k)).length===3;
            const n1=adaptiveNeeds(part,data,id,ctx,font,bold,full1);
            const n2=adaptiveNeeds(columns[1][j],data,id,ctx,font,bold,full2);
            return {min:Math.max(n1.min,n2.min),pref:Math.max(n1.pref,n2.pref)};
          });
          const tracks=adaptiveAllocate(shared,adaptiveRect(rows[0]).width);
          if(!tracks)continue;
          if(original.every(row=>row.widths.every((w,j)=>Math.abs(w-tracks[j])<.75)))continue;
          let valid=true;
          for(let k=0;k<2;k++){
            rows[k].style.gridTemplateColumns=tracks.map(w=>w.toFixed(3)+'px').join(' ');
            columns[k].forEach((part,j)=>{
              if(!adaptiveArrange(rows[k].children[j],part,data,id,tracks[j],ctx,font,bold))valid=false;
            });
          }
          if(valid){
            valid=!growing(before,snapshot(rows))&&
              adaptiveRect(root).height<=baseHeight+.5&&adaptiveFits(root);
          }
          if(!valid){
            for(let k=0;k<2;k++){
              rows[k].style.gridTemplateColumns=original[k].columns;
              columns[k].forEach((part,j)=>
                adaptiveArrange(rows[k].children[j],part,data,id,original[k].widths[j],ctx,font,bold));
            }
          }else rows.forEach(row=>row.dataset.yofiSharedTracks='true');
        }
      }
      parts.forEach((part,i)=>visit(node.children[i],part));
    };
    visit(root,tree);
  }
  function adaptiveIceCell(node){
    const names=[...node.querySelectorAll('.inline-type-name > .name')];
    const ref=names.find(x=>x.textContent.trim()==='B')||names.find(x=>x.textContent.trim()!=='I');
    // The reference cell may itself be zoomed below 400px. CSS width is
    // resolved BEFORE the parent's zoom, so undo that scale before assigning.
    const zoom=ref?parseFloat(getComputedStyle(ref.closest('.inline-type-name')).zoom)||1:1;
    const width=ref?.getBoundingClientRect().width/zoom;
    if(!width||width<=0)return;
    for(const x of names){
      if(x.textContent.trim()!=='I')continue;
      x.classList.add('yofi-ice-letter-cell');
      x.style.setProperty('--yofi-type-letter-width',width.toFixed(2)+'px');
    }
  }
  function adaptiveRect(el){return el.getBoundingClientRect();}
  function adaptiveFits(root){
    const limit=adaptiveRect(root);
    for(const f of root.querySelectorAll('.yofi12-field')){
      if(f.dataset.absent==='true')continue;
      const label=f.querySelector(':scope > dt'),v=f.querySelector(':scope > .yofi12-value');
      if(!label||!v)return false;
      const r=adaptiveRect(f),l=adaptiveRect(label),a=adaptiveRect(v);
      if(r.left<limit.left-1||r.right>limit.right+1||r.bottom>limit.bottom+1)return false;
      if(!f.classList.contains('yofi12-title-above')&&l.right>a.left-1)return false;
      if(a.right>r.right+1.5||a.bottom>r.bottom+1.5)return false;
      for(const x of v.querySelectorAll(':scope > dd,.inline-type-name')){
        const q=adaptiveRect(x);if(q.right>a.right+1.5||q.bottom>a.bottom+1.5)return false;
        // A nowrap text value can spill beyond its dd without enlarging
        // the dd's bounding box; DOM box checks alone miss that overflow.
        if(x.tagName==='DD'&&!v.classList.contains('yofi12-badges')&&
          x.scrollWidth>x.clientWidth+1.5)return false;
      }
    }
    return true;
  }

  function adaptiveAlignColumns(root){
    // A stack is a structural column of field records. Text-value starts in
    // that stack share one dt track, irrespective of label lengths, wraps,
    // or whether some other grid row happens to overlap its bounds.
    const all=[...root.querySelectorAll('.yofi12-field:not([data-absent="true"]):not(.yofi12-title-above)')];
    for(const f of all)f.style.removeProperty('--yofi12-label-track');
    const tracks=new Map();
    const unify=fields=>{
      if(fields.length<2)return;
      const width=Math.max(...fields.map(f=>adaptiveRect(f.querySelector(':scope > dt')).width));
      for(const f of fields)tracks.set(f,Math.max(width,tracks.get(f)||0));
    };
    for(const stack of root.querySelectorAll('.yofi12-group[data-kind="col"]')){
      const direct=[...stack.children].filter(n=>n.classList?.contains('yofi12-field')&&
        n.dataset.absent!=='true'&&!n.classList.contains('yofi12-title-above'));
      // Type labels use their own visual track; keep the two kinds separate.
      unify(direct.filter(f=>!f.classList.contains('yofi12-effect')));
      unify(direct.filter(f=>f.classList.contains('yofi12-effect')));
    }
    // Some layouts put equivalent field rows in different nested containers.
    // Allow geometric unification only for non-overlapping vertical peers at
    // effectively the same left start; never match side-by-side row mates.
    for(const effect of [false,true]){
      const fields=all.filter(f=>f.classList.contains('yofi12-effect')===effect);
      const groups=[];
      for(const f of fields){
        const r=adaptiveRect(f);
        let g=groups.find(g=>Math.abs(g.left-r.left)<1.5 &&
          g.fields.every(other=>{
            const o=adaptiveRect(other);
            return r.top>=o.bottom-.5||o.top>=r.bottom-.5;
          }));
        if(!g){g={left:r.left,fields:[]};groups.push(g);}
        g.fields.push(f);
      }
      for(const group of groups)unify(group.fields);
    }
    for(const [field,width] of tracks)field.style.setProperty('--yofi12-label-track',width.toFixed(2)+'px');
  }
  function adaptiveCompactNestedEffectPairs(root){
    // A nested two-effect row must not inherit unused width in its first
    // column, pushing the second field (often Immune) unnecessarily right.
    // Work from actual painted extents AFTER label-track unification; the
    // approximate intrinsic-width formula cannot tell us where the final
    // badge in a wrapped row ends. This is geometry-only, all species.
    for(const pair of root.querySelectorAll('.yofi12-group[data-kind="row"]')){
      const fields=[...pair.children];
      const parent=pair.parentElement;
      if(fields.length!==2||parent?.dataset.kind!=='col'||
        parent.parentElement?.dataset.kind!=='row'||
        parent.dataset.yofiFourTrack==='true'||
        !fields.every(f=>f.classList.contains('yofi12-effect')))continue;
      const paintedWidth=(field)=>{
        const base=adaptiveRect(field);
        const label=field.querySelector(':scope > dt');
        const val=field.querySelector(':scope > .yofi12-value');
        if(!label||!val)return Infinity;
        let right=adaptiveRect(label).right;
        for(const badge of val.querySelectorAll('.inline-type-name'))
          right=Math.max(right,adaptiveRect(badge).right);
        if(!val.querySelector('.inline-type-name')){
          for(const dd of val.querySelectorAll('dd')){
            const range=document.createRange();range.selectNodeContents(dd);
            const ink=range.getBoundingClientRect();
            if(ink.width)right=Math.max(right,ink.right);
          }
        }
        return Math.max(0,right-base.left)+2;
      };
      const minFirst=paintedWidth(fields[0]);
      const minSecond=paintedWidth(fields[1]);
      const room=adaptiveRect(pair).width;
      const oldFirst=adaptiveRect(fields[0]).width;
      if(!Number.isFinite(minFirst)||!Number.isFinite(minSecond)||
        minFirst+adaptiveGap+minSecond>room+.3||
        minFirst>=oldFirst-1.5)continue;
      const original=pair.style.gridTemplateColumns;
      const oldHeight=adaptiveRect(root).height;
      // Fixed pixel tracks deliberately leave residual whitespace at the END
      // rather than between adjacent effectiveness field labels.
      pair.style.gridTemplateColumns=minFirst.toFixed(3)+'px '+minSecond.toFixed(3)+'px';
      if(adaptiveRect(root).height>oldHeight+.5||!adaptiveFits(root))
        pair.style.gridTemplateColumns=original;
    }
  }
  function adaptiveMetrics(root,id,data,width){
    const V=adaptiveRect(root).height;
    let H=0,L=0;
    for(const row of [root,...root.querySelectorAll('.yofi12-group[data-kind="row"]')]){
      if(row.dataset.kind!=='row')continue;
      const parent=adaptiveRect(row);
      for(const item of row.children){const rect=adaptiveRect(item);
        const empty=Math.max(0,parent.bottom-rect.bottom)*rect.width/Math.max(1,width);
        H+=empty;L=Math.max(L,empty);
      }
    }
    let badgeRows=0,unwrappedEffectFields=0;
    for(const grid of root.querySelectorAll('.yofi12-badges')){
      const count=grid.querySelectorAll('.inline-type-name').length;
      const cols=Number(grid.style.getPropertyValue('--yofi12-cols'))||1;
      const rows=Math.ceil(count/cols);
      badgeRows+=rows;
      // +3 reward (subtracted from the cost) PER field whose badges occupy
      // one painted row. Empty/None fields earn nothing. All candidates have
      // already passed adaptiveFits(), so this NEVER relaxes fit eligibility.
      if(count>0&&rows===1)unwrappedEffectFields++;
    }
    const R=Math.max(0,badgeRows-3);
    // Universal compactness preference for all three effectiveness fields
    // collected on one horizontal band or contiguous vertical track.
    // The +7 increase from v0.12.13 is deliberately less than a text row
    // and competes with measured height and negative space for every species.
    const groupFields=['weak','resist','immune'].map(k=>root.querySelector('.yofi12-field[data-key="'+k+'"]'));
    const groupRects=groupFields.map(f=>f?adaptiveRect(f):null);
    const sameBand=groupRects.every(r=>r&&Math.abs(r.top-groupRects[0].top)<2);
    const alignedColumn=groupRects.every(r=>r&&Math.abs(r.left-groupRects[0].left)<2);
    const vertical=[...groupRects].sort((a,b)=>a.top-b.top);
    const gapLimit=parseFloat(getComputedStyle(root).fontSize||'14')*.8;
    const contiguousColumn=alignedColumn&&vertical.slice(1).every((r,i)=>
      r.top-vertical[i].bottom<=gapLimit);
    const bonus=(sameBand||contiguousColumn)?16:0;
    // Actual rendered height already accounts for extra badge lines. Avoid
    // charging nearly a second full row for those same wraps when they fit
    // alongside existing text fields; retain a small visual-complexity cost.
    const score=V+.6*H+2*R+.7*L-bonus-adaptivePairedFieldBonus[id]-3*unwrappedEffectFields;
    const occupied=k=>{
      const f=root.querySelector('.yofi12-field[data-key="'+k+'"]');if(!f)return 0;
      const label=adaptiveRect(f.querySelector('dt')).width;
      const pills=[...f.querySelectorAll('.inline-type-name')];
      return label+adaptiveLabelGap+(pills.length?pills.reduce((n,p)=>n+adaptiveRect(p).width,0)+(pills.length-1)*adaptiveBadgeGap:adaptiveRect(f.querySelector('.yofi12-value')).width);
    };
    const balance=id==='C'?Math.abs(occupied('weak')+occupied('immune')+adaptiveGap-occupied('resist')):
      id==='D'?Math.abs(occupied('weak')-occupied('resist')-occupied('immune')-adaptiveGap):0;
    return {id,score:score+(id==='C'||id==='D'?0.15*balance:0),V,H,L,R,balance,badgeRows,
      unwrappedEffectFields,sameBand,contiguousColumn};
  }
  function adaptiveChoose(all,data,width){
    if(!all.length)return null;
    const sorted=all.slice().sort((a,b)=>a.score-b.score||a.id.localeCompare(b.id));
    let choice=sorted[0];
    // Dense narrow effectiveness: when the compact stacked-label columns
    // are nearly tied with B, prefer balanced Weak/Resists columns over B's
    // concentrated empty block. Content-based, never keyed to species.
    const dense=all.find(x=>x.id==='R');
    if(dense&&width<400&&data.counts.weak>=3&&data.counts.resist>=9&&dense.score<=choice.score+37)
      choice=dense;
    // Dense weaknesses with no immunity badges: prefer the complementary
    // side-by-side title-above arrangement when it remains geometrically valid.
    const broad=all.find(x=>x.id==='S');
    if(broad&&width<400&&data.counts.weak>=6&&data.counts.resist>=3&&
      data.counts.immune===0&&broad.score<=choice.score+82)choice=broad;
    // No layout-letter tie override for the relative placement of Immune.
    // F/G/H compete on measured height, wrapping and empty space only.
    // A horizontal effectiveness band is clearer than splitting Immune off
    // when it costs no height or badge wrapping and stays near the best score.
    // It does not supersede genuinely better/tighter vertical arrangements.
    if(!choice.sameBand){
      const band=all.filter(x=>x.sameBand&&x.V<=choice.V+2&&
        x.badgeRows<=choice.badgeRows&&x.score<=choice.score+18)
        .sort((a,b)=>a.score-b.score)[0];
      if(band)choice=band;
    }
    const C=all.find(x=>x.id==='C'),D=all.find(x=>x.id==='D');
    if((choice.id==='C'||choice.id==='D')&&C&&D&&Math.abs(C.V-D.V)<1&&Math.abs(C.score-D.score)<2)
      choice=C.balance<=D.balance?C:D;
    // No additional F/G/H first-row-fill preference: comparable candidates
    // already compete using height, wrapped rows and distributed whitespace.
    // A filled first row alone is not a reason to move Immune above Resists.
    return choice;
  }
  function chooseConditionalScoreColumns(page){
    if(!isSpeciesRoot())return;
    const article=speciesArticleFrom(page);
    if(!article?.classList.contains('yofi-scores-layout'))return;
    const body=article?.querySelector('.yofi-species-stats-body');
    if(!article||!body||!body.clientWidth)return;
    const data=adaptiveSources(body);if(!data)return;
    const width=body.clientWidth;
    body.classList.toggle('yofi12-narrow-badges',width<400);
    const signature=[width.toFixed(1),conditionalScoreFontEpoch,
      body.querySelector(':scope > dl:first-of-type')?.textContent,
      body.querySelector(':scope > .yofi-scores-skills')?.dataset.yofiSummary,
      body.querySelector(':scope > .yofi-scores-types')?.dataset.yofiSummary].join('|');
    let visible=body.querySelector(':scope > .yofi12-visible');
    const prev=adaptiveCache.get(article);
    if(prev?.signature===signature && (prev.id==='native' || visible?.firstElementChild)){article.dataset.yofiStatsLayout=prev.id;return;}
    if(!visible){visible=document.createElement('div');visible.className='yofi12-stage yofi12-visible';body.append(visible);}
    let probe=body.querySelector(':scope > .yofi12-probe');
    if(!probe){probe=document.createElement('div');probe.className='yofi12-stage yofi12-probe';body.append(probe);}
    const style=getComputedStyle(visible);
    const textFont=style.font||'14.4px system-ui';
    const boldFont='700 '+(style.fontSize||'14.4px')+' '+(style.fontFamily||'system-ui');
    const ctx=document.createElement('canvas').getContext('2d');if(!ctx)return;
    adaptiveCalibrateFields(probe,data);
    const all=[];
    const order=width<500?['R','S','B','E','C','D','A','I','F','G','H','J','K','M','N','O','P','T']:
      width<850?['B','I','F','G','A','J','K','M','N','O','P','C','D','E','H','R','S','T']:
      ['I','F','G','O','P','A','B','J','K','M','N','C','D','E','H','R','S','T'];
    for(const id of order){
      if(!adaptiveEligible(id,data))continue;
      const tree=adaptiveLayouts[id],node=adaptiveBuild(tree,data,id);
      probe.replaceChildren(node);
      adaptiveIceCell(node);
      if(!adaptiveArrange(node,tree,data,id,width,ctx,textFont,boldFont))continue;
      adaptiveUnifyRowTracks(node,tree,data,id,width,ctx,textFont,boldFont);
      adaptiveAlignColumns(node);
      adaptiveCompactNestedEffectPairs(node);
      if(!adaptiveRefitBadgeGrids(node)||!adaptiveFits(node))continue;
      const metric=adaptiveMetrics(node,id,data,width);
      if(Number.isFinite(metric.score))all.push({...metric,node});
    }
    const best=adaptiveChoose(all,data,width);
    const nativeFallback=()=>{
      visible.replaceChildren();probe.replaceChildren();
      body.classList.add('yofi12-native-fallback');
      article.dataset.yofiStatsLayout='native';
      adaptiveCache.set(article,{id:'native',signature});
    };
    if(!best){nativeFallback();return;}
    body.classList.remove('yofi12-native-fallback');
    const id=best.id;
    // Reuse the *already measured* winning DOM, rather than
    // building/measuring another copy. The probe and visible stages have
    // identical widths/typography. Rare fallback handles invalidated geometry.
    if(best?.node){
      visible.replaceChildren(best.node);
      // Only R's cross-column last-row alignment depends on the tighter
      // visible rhythm. Badge ink offsets remain valid when moved.
      // Measured geometry is already final and must not change on promotion.
      if(!adaptiveFits(best.node)){
        const fresh=adaptiveBuild(adaptiveLayouts[id],data,id);
        probe.replaceChildren(fresh);adaptiveIceCell(fresh);
        if(adaptiveArrange(fresh,adaptiveLayouts[id],data,id,width,ctx,textFont,boldFont)){
          adaptiveUnifyRowTracks(fresh,adaptiveLayouts[id],data,id,width,ctx,textFont,boldFont);
          adaptiveAlignColumns(fresh);
          adaptiveCompactNestedEffectPairs(fresh);
          if(adaptiveRefitBadgeGrids(fresh)&&adaptiveFits(fresh))visible.replaceChildren(fresh);
          else {nativeFallback();return;}
        }else {nativeFallback();return;}
      }
    }else{
      const fallback=adaptiveBuild(adaptiveLayouts[id],data,id);
      probe.replaceChildren(fallback);adaptiveIceCell(fallback);
      if(adaptiveArrange(fallback,adaptiveLayouts[id],data,id,width,ctx,textFont,boldFont)){
        adaptiveUnifyRowTracks(fallback,adaptiveLayouts[id],data,id,width,ctx,textFont,boldFont);
        adaptiveAlignColumns(fallback);
        adaptiveCompactNestedEffectPairs(fallback);
        if(adaptiveRefitBadgeGrids(fallback)&&adaptiveFits(fallback))visible.replaceChildren(fallback);
        else {nativeFallback();return;}
      }else {nativeFallback();return;}
    }
    probe.replaceChildren();
    article.dataset.yofiStatsLayout=id;
    adaptiveCache.set(article,{id,signature});
    // No unconditional second species-layout evaluation: font readiness,
    // source DOM mutation and card ResizeObserver already invalidate the view.
  }


  function arrangeHiddenAbilityTags(article){
    // Native source: AbilityPoolInfo.svelte renders
    // <p class="no-margin"><Tag>Hidden</Tag></p><div class="ability">…</div>.
    // The Tag.svelte font is relative to its P parent; moving it inside
    // .ability changes its font size. Only group the TWO ORIGINAL SIBLINGS.
    // Do not alter the original Tag element or its classes/styles.
    for(const section of article.querySelectorAll('section.abilities')){
      for(const item of [...section.children]){
        if(!(item instanceof HTMLParagraphElement)||!item.classList.contains('no-margin'))continue;
        if(item.closest('.yofi-native-hidden-pair'))continue;
        const tag=item.querySelector(':scope > .tag');
        if(!tag||tag.textContent.trim()!=='Hidden')continue;
        const entry=item.nextElementSibling;
        if(!entry||!entry.matches('div.ability')||!entry.querySelector('strong,b'))continue;
        const wrapper=document.createElement('div');
        wrapper.className='yofi-native-hidden-pair';
        item.before(wrapper);
        wrapper.append(item,entry);
      }
    }
  }


  // Content-level description decoration belongs to QOL, never the layout
  // companion. This marks only the native opening phrase and keeps its class
  // stable whether the detail image is mobile, split or fullscreen.
  const DESCRIPTION_LEAD = /^The\s+(?:[\p{L}\p{N}][\p{L}\p{N}'\u2019-]*\s+)+Pok(?:e|\u00e9)mon\./iu;
  function decorateSpeciesDescriptionLead(article) {
    if (!article?.querySelector('section.stats')) return;
    const paragraph = article.querySelector('section .small-text p');
    if (!(paragraph instanceof HTMLElement)) return;
    const original = paragraph.querySelector('.yofi-type-description-lead');
    const badge = article.querySelector(':scope > header > .type-tag .type');
    const color = badge ? getComputedStyle(badge).backgroundColor : '';
    if (original) {
      if (color && color !== 'rgba(0, 0, 0, 0)' &&
          original.style.getPropertyValue('--yofi-lead-type-color') !== color)
        original.style.setProperty('--yofi-lead-type-color', color);
      return;
    }
    const first = Array.from(paragraph.childNodes).find(n =>
      n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (!first) return;
    const raw = first.nodeValue || '';
    const beginning = raw.match(/^\s*/)[0].length;
    const match = raw.slice(beginning).match(DESCRIPTION_LEAD);
    if (!match) return;
    const range = document.createRange();
    range.setStart(first, beginning);
    range.setEnd(first, beginning + match[0].length);
    const strong = document.createElement('strong');
    strong.className = 'yofi-type-description-lead';
    if (color && color !== 'rgba(0, 0, 0, 0)')
      strong.style.setProperty('--yofi-lead-type-color', color);
    range.surroundContents(strong);
  }

  function installSpeciesPresentation(page) {
    const article = speciesArticleFrom(page);
    if (!isSpeciesRoot() || !article?.querySelector('section.stats')) return;
    // QOL's header controls, sex-symbol normalization and portrait control are
    // deliberately not invoked or recreated here.
    layoutSpeciesStats(page);
    arrangeHiddenAbilityTags(article);
    decorateSpeciesDescriptionLead(article);
    syncSpeciesVitals(page);
    compactSpeciesDistances(page);
    compactBaseStatLabels(page);
    compactSkillNames(page);
    normalizeStatSentinels(page);
    compactEffectivenessBadges(page);
    // QOL intentionally no longer writes this card-content sizing class.
    article.classList.toggle('yofi-score-compact-edge', article.getBoundingClientRect().width < 550);
    chooseConditionalScoreColumns(page);
  }

  let running = false;
  function tick() {
    if (window.__yofiHeroLayoutLab !== VERSION || running) return;
    running = true;
    try {
      const routeKey = currentSpeciesRouteKey();
      installBaseHeroCSS();
      installCSS();
      installSpeciesContentCSS();
      installTMCSS();

      const articles = visibleSpeciesArticles();
      for (const article of articles) {
        if (routeKey) {
          prepareIncomingSpecies(article, routeKey);
          // Keep the existing native card untouched if only the URL has
          // changed so far. Svelte will update this same article with the
          // incoming record; its mutation is handled before paint.
          if (article.dataset.yofiSpeciesRouteKey &&
              article.dataset.yofiSpeciesRouteKey !== routeKey) continue;
          watchPortraitImage(article, pendingImage(article));
        }
        installSpeciesPresentation(article);
        updateNativeHero(article);
        const hero = article.querySelector('.yofi-species-hero');
        const required = article.querySelector('section.stats > .yofi-scores-banner') &&
          hero?.querySelector('.yofi-hero-copy') && hero.querySelector('.yofi-hero-art-lane');
        if (!required || !vitalData(article)) { restore(article); continue; }
        const data = vitalData(article);
        const view = viewFor(hero);
        if (!locateCanonical(view, article)) { restore(article, view); continue; }
        syncView(view, article, data);
        const layout = chooseStage(article, hero, view);
        if (layout) apply(article, view, layout);
        else {
          restore(article, view);
          const state = speciesHeroStates.get(hero);
          if (state) selectHeroFactsMode(state);
          rememberNativeHero(hero);
        }
      }
      installSpeciesTMColumns();
      for (const article of articles) {
        if (article.hasAttribute('data-yofi-fullscreen-handoff'))
          document.dispatchEvent(new CustomEvent('yofi:species-card-presentation-ready',{detail:{article}}));
      }
    } catch (error) { console.warn('[Species Card ' + VERSION + ']', error); }
    finally { running = false; }
  }
  // Capability-based handoff: QoL can request this existing synchronous pass
  // without requiring a particular Species Card release number.
  window.__yofiSpeciesCardPresentation = Object.freeze({prepare:tick});
  // DevTools: window.__yofiHeroLayoutStatus() reports the actually installed
  // version, active stage, computed gender segment widths and score labels.
  window.__yofiSpeciesCardStatus = () => {
    const article = visibleSpeciesArticles().find(card => card.classList.contains('lab3-active'));
    const hero = article?.querySelector('.yofi-species-hero');
    const gender = hero?.querySelector('.lab3-gender .gender-ratio-display');
    const box = gender?.getBoundingClientRect();
    const art = hero?.querySelector('.yofi-hero-art-lane img');
    return {
      version: VERSION,
      active: window.__yofiHeroLayoutLab,
      stage: hero?.dataset.lab3Stage || 'native',
      biology: hero?.dataset.lab3Biology || 'native',
      nativeCard:!!article,
      speciesRouteKey:article?.dataset.yofiSpeciesRouteKey || null,
      cardWidth: Math.round(article?.getBoundingClientRect().width || 0),
      imageRatio: art?.naturalHeight ? +(art.naturalWidth / art.naturalHeight).toFixed(3) : null,
      artHeight: +(parseFloat(hero?.style.getPropertyValue('--lab3-art-height')) || 0).toFixed(1),
      imageFloor: +(hero?.dataset.lab3ImageFloor || 0),
      artLaneWidth: +(parseFloat(hero?.style.getPropertyValue('--lab3-lane-width')) || 0).toFixed(1),
      copyWidth: +(parseFloat(hero?.style.getPropertyValue('--lab3-copy-width')) || 0).toFixed(1),
      rightWidth: +(parseFloat(hero?.style.getPropertyValue('--lab3-side-width')) || 0).toFixed(1),
      columnSlack: hero ? ['left','right'].map(side=>{
        const node=hero.querySelector(side==='left'?'.lab3-left-extra':'.lab3-right');
        return node ? Math.max(0,Math.round(node.getBoundingClientRect().height-Array.from(node.children).reduce((a,c)=>a+c.getBoundingClientRect().height,0))) : null;
      }) : null,
      genderWidth: box ? Math.round(box.width) : null,
      genderSegments: gender && box.width ? Array.from(gender.querySelectorAll('.bar'))
        .map(el => Math.round(el.getBoundingClientRect().width / box.width * 100)) : [],
      scoreLabels: Array.from(hero?.querySelectorAll('.lab3-left-extra > dl.yofi-scores-strip > dt') || [])
        .map(el => el.textContent),
      canonical: {scores:!!hero?.querySelector('.lab3-left-extra > dl.yofi-scores-strip'),
        abilities:!!hero?.querySelector('.lab3-right > section.abilities'),
        genderBars:hero?.querySelectorAll('.gender-ratio-display').length||0}
    };
  };
  window.__yofiHeroLayoutStatus = window.__yofiSpeciesCardStatus; // Backward-compatible diagnostics.
  // Native source changes and card navigation invalidate geometry once per frame.
  // Changed species are prepared from native data before its next paint;
  // ordinary content and resize updates remain coalesced into one frame.
  let speciesCardRuntimeStarted = false;
  function startSpeciesCardRuntime() {
    const root = document.documentElement;
    if (speciesCardRuntimeStarted || !root) return false;
    speciesCardRuntimeStarted = true;
    const meaningful = mutation => {
      const target = mutation.target.nodeType === 1
        ? mutation.target : mutation.target.parentElement;
      const article = target?.closest?.(LIVE_CARD_SELECTOR);
      if (mutation.type === 'childList') {
        const nodes = [...mutation.addedNodes, ...mutation.removedNodes].filter(node => node.nodeType === 1);
        if (nodes.length && nodes.every(node => node.matches?.(
            '[data-yofi-layout-probe],.yofi12-stage,.lab3-left-extra,.lab3-right,' +
            '.lab3-biologies,.lab3-biology,.lab3-vital,.lab3-copy-facts'))) return false;
      }
      if (article?.querySelector('section.stats') && article.getClientRects().length) {
        if (target.closest?.('.lab3-left-extra,.lab3-right,.lab3-biologies,.lab3-biology,' +
            '.lab3-vital,.lab3-measure-abilities,.lab3-copy-facts,.lab3-probe,.yofi-hero-facts,' +
            '.yofi12-stage,.yofi-scores-skills,.yofi-scores-types,[data-yofi-layout-probe]'))
          return false;
        return true;
      }
      return [...mutation.addedNodes, ...mutation.removedNodes].some(node => {
        if (node.nodeType !== 1) return false;
        return !!(node.matches?.('article') && node.querySelector('section.stats')) ||
          !!node.querySelector?.('article section.stats');
      });
    };
    const watch = new MutationObserver(changes => {
      if (!changes.some(meaningful)) return;
      const routeKey = currentSpeciesRouteKey();
      let incomingReady = false;
      if (routeKey) {
        for (const article of visibleSpeciesArticles()) {
          if (prepareIncomingSpecies(article, routeKey)) incomingReady = true;
          if (article.dataset.yofiSpeciesRouteKey &&
              article.dataset.yofiSpeciesRouteKey !== routeKey) continue;
          watchPortraitImage(article, pendingImage(article));
        }
      }
      // MutationObserver runs before the browser's next paint. Prepare the
      // native card before its first visible frame, without waiting for art.
      if (incomingReady) tick();
      else requestHeroTick();
    });
    watch.observe(root, { childList: true, subtree: true, characterData: true });
    const tmWatch = new MutationObserver(changes => {
      if (changes.some(m => {
        const target = m.target.nodeType === 1 ? m.target : m.target.parentElement;
        if (m.attributeName === 'class')
          return target === root || target === document.body;
        return ['data-p5ov-display','data-p5ov-kind','data-yofi-forced-sex'].includes(m.attributeName) &&
          !!target?.closest?.(LIVE_CARD_SELECTOR)?.getClientRects().length;
      })) requestHeroTick();
    });
    tmWatch.observe(root, { subtree:true, attributes:true,
      attributeFilter:['data-p5ov-display','data-p5ov-kind','data-yofi-forced-sex','class'] });
    const invalidateSpeciesFonts = () => {
      conditionalScoreFontEpoch++;
      tmFontEpoch++;
      requestHeroTick();
    };
    document.fonts?.ready?.then(invalidateSpeciesFonts);
    document.fonts?.addEventListener?.('loadingdone', invalidateSpeciesFonts);
    window.addEventListener('popstate', tick, true);
    window.addEventListener('hashchange', tick, true);
    window.addEventListener('resize', requestHeroTick, { passive:true });
    window.addEventListener('pageshow', requestHeroTick, { passive:true });
    tick();
    return true;
  }
  if (!startSpeciesCardRuntime()) {
    // `document-start` may run before the parser creates <html>. Start as soon
    // as the root exists so the card observer is armed before Svelte renders.
    const rootObserver = new MutationObserver(() => {
      if (!startSpeciesCardRuntime()) return;
      rootObserver.disconnect();
    });
    rootObserver.observe(document, { childList:true });
  }
  } // runSpeciesCard
})();
