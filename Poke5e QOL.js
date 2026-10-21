// ==UserScript==
// @name         QOL [v0.13.6]
// @namespace    yofi.poke5e.qol.v01239
// @version      0.13.6
// @description  Core navigation and controls; canonical universal Scarlet/Violet type palette; neighbor data warmup and decoded pre-paint portrait synchronization.
// @match        https://poke5e.app/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  "use strict";
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
  const previous = window.__yofiQolBootstrapStatus;
  if (previous && previous.version !== '0.13.4' && previous.phase !== 'failed') {
    modules.register('QoL',previous.version || 'unknown legacy version');
  } else if (!previous && window.__yofiPoke5eQol01020) {
    modules.register('QoL','unknown legacy version');
  }
  const registration = modules.register('QoL','0.13.4');
  if ((previous && previous.version !== '0.13.4' && previous.phase !== 'failed') ||
      (!previous && window.__yofiPoke5eQol01020)) {
    modules.status(registration,'blocked: another QoL copy is active');
    return;
  }

  if (previous?.version === '0.13.4' && previous.phase !== 'failed') {
    previous.reinjections = (previous.reinjections || 0) + 1;
    modules.status(registration,previous.phase);
    const repair = () => {
      if (!document.head || !document.body ||
          typeof window.__yofiQolRecover !== 'function') return false;
      try { window.__yofiQolRecover(); }
      catch (error) {
        previous.lastRecoveryError = String(error?.stack || error);
        console.error('[Poké5e QOL v0.13.4] Same-tab recovery failed:',error);
      }
      return true;
    };
    if (!repair()) {
      const watcher = new MutationObserver(() => {
        if (repair()) watcher.disconnect();
      });
      watcher.observe(document,{childList:true,subtree:true});
      document.addEventListener('DOMContentLoaded', () => {
        if (repair()) watcher.disconnect();
      }, {once:true});
    }
    return;
  }
  const bootstrap = window.__yofiQolBootstrapStatus = {
    version: '0.13.4', phase: 'waiting-for-head', attempts: 0,
    error: null, startedAt: Date.now()
  };

  // Share only short-lived neighbor data responses with the site's own fetch.
  // This lets a warmed Fakémon row satisfy the route's normal RPC request,
  // without constructing a hidden card or retaining a second DOM tree.
  const NEIGHBOR_RESPONSE_CACHE_KEY = '__yofiNeighborResponseCacheV1';
  const neighborResponseCache = (() => {
    const existing = window[NEIGHBOR_RESPONSE_CACHE_KEY];
    if (existing?.installed && existing.originalFetch && existing.prefetch) return existing;

    const originalFetch = window.fetch.bind(window);
    const records = new Map();
    const maxEntries = 12;
    const lifetime = 30000;

    const fakemonKey = value => {
      const key = String(value || '').replace(/^F\./i, '').trim();
      return key ? `fakemon:${key}` : null;
    };

    const cleanExpired = () => {
      const now = Date.now();
      for (const [key, record] of records) {
        if (record.expiresAt <= now) records.delete(key);
      }
    };

    const trim = () => {
      cleanExpired();
      while (records.size > maxEntries) records.delete(records.keys().next().value);
    };

    const getRequestKey = (input, init) => {
      let url;
      try {
        const raw = input instanceof Request ? input.url
          : input instanceof URL ? input.href : String(input);
        url = new URL(raw, location.href);
      } catch (_) { return null; }

      const request = input instanceof Request ? input : null;
      const method = String(init?.method || request?.method || 'GET').toUpperCase();
      if (url.href === 'https://api.poke5e.app/rest/v1/rpc/get_fakemon') {
        if (method !== 'POST') return null;
        const fromBody = body => {
          if (typeof body === 'string') {
            try { return fakemonKey(JSON.parse(body)?._read_key); } catch (_) { return null; }
          }
          if (body instanceof URLSearchParams) return fakemonKey(body.get('_read_key'));
          return null;
        };
        if (init && Object.prototype.hasOwnProperty.call(init, 'body')) {
          return fromBody(init.body);
        }
        return request ? request.clone().text().then(fromBody) : null;
      }

      if (method === 'GET' && /\/srd\/v1\/(?:2018|2024)\/pokemon\/[^/]+\.json$/i.test(url.pathname)) {
        return `pokemon-json:${url.href}`;
      }
      return null;
    };

    const withCallerSignal = (promise, input, init) => {
      const signal = init?.signal ?? (input instanceof Request ? input.signal : null);
      if (!signal) return promise;
      const abortReason = () => signal.reason !== undefined ? signal.reason
        : new DOMException('The operation was aborted.', 'AbortError');
      if (signal.aborted) {
        promise.catch(() => {});
        return Promise.reject(abortReason());
      }
      return new Promise((resolve, reject) => {
        const abort = () => { signal.removeEventListener('abort', abort); reject(abortReason()); };
        signal.addEventListener('abort', abort, { once:true });
        promise.then(value => {
          signal.removeEventListener('abort', abort);
          resolve(value);
        }, error => {
          signal.removeEventListener('abort', abort);
          reject(error);
        });
      });
    };

    const useWarmedResponse = (key, input, init) => {
      if (!key) return originalFetch(input, init);
      cleanExpired();
      const record = records.get(key);
      if (record) {
        records.delete(key);
        records.set(key, record);
        const response = record.promise.then(response => response.clone()).catch(() => {
          if (records.get(key) === record) records.delete(key);
          return useWarmedResponse(key, input, init);
        });
        return withCallerSignal(response, input, init);
      }

      // The Fakémon list fetches complete records before a row is selected.
      // Keep a short, capped response copy so a later detail-route get() can
      // reuse that exact native request instead of repeating the RPC.
      const responsePromise = originalFetch(input, init);
      const captured = { expiresAt: Date.now() + lifetime, promise: null };
      captured.promise = responsePromise.then(response => {
        if (!response.ok) throw new Error(`Neighbor data request returned HTTP ${response.status}.`);
        return response.clone();
      }).catch(error => {
        if (records.get(key) === captured) records.delete(key);
        throw error;
      });
      // The native caller owns responsePromise. The separate cache copy can
      // fail independently (including a non-OK response), so observe its
      // rejection even when nobody subsequently consumes that cached copy.
      captured.promise.catch(() => {});
      records.set(key, captured);
      trim();
      return responsePromise;
    };

    const state = {
      installed: false,
      originalFetch,
      prefetch(key, input, init) {
        cleanExpired();
        const old = records.get(key);
        if (old) {
          records.delete(key);
          records.set(key, old);
          return old.promise;
        }
        const record = { expiresAt: Date.now() + lifetime, promise: null };
        record.promise = originalFetch(input, init).then(response => {
          if (!response.ok) throw new Error(`Neighbor data request returned HTTP ${response.status}.`);
          return response;
        }).catch(error => {
          if (records.get(key) === record) records.delete(key);
          throw error;
        });
        records.set(key, record);
        trim();
        return record.promise;
      },
      clearFakemon() {
        for (const key of records.keys()) {
          if (key.startsWith('fakemon:')) records.delete(key);
        }
      },
    };

    try {
      const wrappedFetch = function(input, init) {
        const key = getRequestKey(input, init);
        if (key && typeof key.then === 'function') {
          return key.then(value => useWarmedResponse(value, input, init),
            () => originalFetch(input, init));
        }
        return useWarmedResponse(key, input, init);
      };
      window.fetch = wrappedFetch;
      state.installed = window.fetch === wrappedFetch;
    } catch (_) { /* Portrait warmup still works without sharing app responses. */ }

    try {
      Object.defineProperty(window, NEIGHBOR_RESPONSE_CACHE_KEY, {
        configurable: true, value: state,
      });
    } catch (_) { window[NEIGHBOR_RESPONSE_CACHE_KEY] = state; }
    return state;
  })();

  let invoked = false;
  let headWatcher = null;
  function invokeWithHead() {
    if (invoked || !document.head) return;
    invoked = true;
    headWatcher?.disconnect();
    bootstrap.attempts++;
    bootstrap.phase = 'initializing';
    try {
      const otherQolAlreadyRunning = !!window.__yofiPoke5eQol01020;
      runQol();
      if (otherQolAlreadyRunning) {
        bootstrap.phase = 'blocked-by-existing-qol';
        bootstrap.error = 'An earlier QOL version has already installed its shared guard. Disable older QOL versions and reopen this tab.';
        modules.status(registration,'blocked: another QoL copy is active');
        console.error('[Poké5e QOL v0.13.4]',bootstrap.error);
        modules.notice('yofi-userscript-version-conflict',bootstrap.error);
      } else if (bootstrap.phase === 'initializing') bootstrap.phase = 'waiting-for-body';
    } catch (error) {
      bootstrap.phase = 'failed';
      modules.status(registration,'failed');
      bootstrap.error = String(error?.stack || error);
      // A failed partial boot must not permanently suppress a later retry.
      // Do not delete the guard of an unrelated, already running QOL instance.
      if (window.__yofiPoke5eQol01020 === true)
        delete window.__yofiPoke5eQol01020;
      console.error('[Poké5e QOL v0.13.4] Startup failed:', error);
    }
  }
  if (document.head) invokeWithHead();
  else {
    headWatcher = new MutationObserver(invokeWithHead);
    headWatcher.observe(document, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', invokeWithHead, {once:true});
    if (document.head) invokeWithHead();
  }
  function runQol() {

  const VERSION = "0.13.4";
  // The browser controls site/navigation layout; the detail card controls
  // all entry-specific presentation. Do not confuse these two arenas.
  const RESPONSIVE_WIDTHS = Object.freeze({ compact: 600, wide: 800 });
  const RESPONSIVE_TIERS = Object.freeze(["compact", "intermediate", "wide"]);
  function responsiveTier(width) {
    return width < RESPONSIVE_WIDTHS.compact ? "compact"
      : width < RESPONSIVE_WIDTHS.wide ? "intermediate" : "wide";
  }
  function browserTier() {
    return responsiveTier(window.innerWidth || document.documentElement.clientWidth || 0);
  }
  function syncBrowserTier() {
    const tier = browserTier();
    const html = document.documentElement;
    for (const name of RESPONSIVE_TIERS) {
      html.classList.toggle(`yofi-browser-${name}`, name === tier);
    }
    return tier;
  }
  function syncEntryTier(article) {
    if (!(article instanceof HTMLElement)) return null;
    const width = article.getBoundingClientRect().width;
    if (!(width > 0)) return null;
    const tier = responsiveTier(width);
    const cardUnit = `${(width / 100).toFixed(2)}px`;
    if (article.style.getPropertyValue('--yofi-title-card-unit') !== cardUnit)
      article.style.setProperty('--yofi-title-card-unit', cardUnit);
    for (const name of RESPONSIVE_TIERS) {
      article.classList.toggle(`yofi-entry-${name}`, name === tier);
    }
    // An extra CARD-width breakpoint; independent of the iPad viewport.
    // At about 325px the name and chevrons need more room than equal thirds.
    article.classList.toggle("yofi-entry-subcompact", width <= 365);
      if (article.dataset.yofiEntryTier !== tier) article.dataset.yofiEntryTier = tier;
    return tier;
  }

  const PAGE_SELECTOR = ".page";
  const EXCLUDED_ROOTS = new Set(["resources"]);
  const GLOBAL_COLLAPSED_CLASS = "yofi-side-collapsed-global";
  let pendingSelectionExpiresAt = 0;
  let pendingListSelection = null;
  const NAV_COLLAPSE_KEY = "yofi-poke5e-qol-collapse-next-url";
  const FULLSCREEN_VIEW_KEY = "yofi-poke5e-qol-v069-fullscreen-view";
  const FULLSCREEN_DEFAULT_KEY = "yofi-poke5e-qol-fullscreen-default";
  const NATIVE_MENU_KEY = "yofi-poke5e-qol-native-site-menu";
  // Keep existing non-theme preferences; only Type theme state migrates.
  function storedBoolean(key, fallback) {
    try { const value = localStorage.getItem(key); return value === null ? fallback : value === "true"; }
    catch (_) { return fallback; }
  }
  let fullscreenDefault = storedBoolean(FULLSCREEN_DEFAULT_KEY, true);
  let nativeSiteMenu = storedBoolean(NATIVE_MENU_KEY, true);
  // QOL owns ONLY the native Light/Dark site toggle. Type mode and all
  // other theme presentation belong exclusively to the Theme Overlay.
  function nativeDayNightMode() {
    const radio = document.querySelector('#dark-mode-fieldset input:checked');
    if (radio?.value === 'day' || radio?.value === 'night') return radio.value;
    try {
      const stored = localStorage.getItem('daynight');
      if (stored === 'day' || stored === 'night') return stored;
    } catch (_) {}
    return document.body?.classList.contains('dark-mode') ? 'night' : 'day';
  }
  function setNativeDayNightMode(next) {
    if (next !== 'day' && next !== 'night') return;
    const nativeRadio = document.querySelector(`#dark-mode-fieldset input[value="${next}"]`);
    // Native Svelte owns its Light/Dark store; click the existing input when
    // present instead of manufacturing a competing theme state manager.
    if (nativeRadio instanceof HTMLInputElement && !nativeRadio.checked) nativeRadio.click();
    else document.body?.classList.toggle('dark-mode', next === 'night');
    storePreference('daynight', next);
    syncSettingsPreferences();
  }
  function storePreference(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (_) {}
  }
  function setFullscreenDefault(value) {
    fullscreenDefault = !!value;
    storePreference(FULLSCREEN_DEFAULT_KEY, fullscreenDefault);
    if (!fullscreenDefault) { clearFullscreenView(); clearCollapsedDestination(); }
    syncSettingsPreferences();
  }
  function setNativeSiteMenu(value) {
    nativeSiteMenu = !!value;
    storePreference(NATIVE_MENU_KEY, nativeSiteMenu);
    closeQuickMenu();
    syncSettingsPreferences();
  }


  let collapsed = false;
  let installQueued = false;
  let observerStarted = false;
  let runtimeObserver = null;
  let observedRuntimeBody = null;
  let observedFakemonTitle = null;
  let fakemonTitleTextObserver = null;

  // Portrait selection and shimmer are retained; the hero layout is rebuilt in v0.8.5.
  const portraitRecords = new Map();
  const portraitPreloads = new Map();
  const decodedPortraitUrls = new Set();
  const portraitHostStates = new WeakMap();
  let openPortraitMenu = null;
  let portraitMenuSequence = 0;
  const PORTRAIT_CORNER_PREFIX = "yofi-poke5e-qol-portrait-corner-v1:";
  const PORTRAIT_CORNERS = new Set(["tr", "tl", "br", "bl"]);
  const PORTRAIT_PREFERENCE_KEY = "yofi-poke5e-qol-universal-shiny-v1";
  let globalShinyPreference = false;
  try { globalShinyPreference = localStorage.getItem(PORTRAIT_PREFERENCE_KEY) === "shiny"; }
  catch (_) { /* In-memory preference still works. */ }
  // Never copy the PREVIOUS species' art into the incoming native IMG.
  // A same-source Svelte replacement should load the DESTINATION shiny once,
  // just as a normal->normal route loads its destination once. Preserve the
  // genuine normal source only for unsupported art/error fallback.
  const earlyOfficialShinySources = new WeakMap(); // IMG -> {key,normal,shiny}
  const failedOfficialShinyCandidates = new Set(); // per-session, per-species
  const officialShinyErrorWatched = new WeakSet();

  function setGlobalShinyPreference(enabled) {
    globalShinyPreference = !!enabled;
    try { localStorage.setItem(PORTRAIT_PREFERENCE_KEY, enabled ? "shiny" : "normal"); }
    catch (_) { /* In-memory fallback. */ }
  }


  function savedPortraitCorner(key) {
    try {
      const corner = localStorage.getItem(PORTRAIT_CORNER_PREFIX + key);
      return PORTRAIT_CORNERS.has(corner) ? corner : "tr";
    } catch (_) { return "tr"; }
  }

  function rememberPortraitCorner(key, corner) {
    if (!PORTRAIT_CORNERS.has(corner)) return;
    try { localStorage.setItem(PORTRAIT_CORNER_PREFIX + key, corner); }
    catch (_) { /* Storage disabled: keep this session's position. */ }
  }

  function setPortraitCorner(button, corner) {
    button.dataset.yofiCorner = PORTRAIT_CORNERS.has(corner) ? corner : "tr";
    for (const name of ["left", "right", "top", "bottom"]) {
      button.style.removeProperty(name);
    }
  }

  // The four corners are relative to the *art viewport*, excluding any
  // attribution caption. Swiping horizontally/vertically flips the relevant
  // corner axis; diagonal flicks can reach the opposite corner in one motion.
  function attachPortraitFlick(button, host, state) {
    let drag = null;
    button.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
      const viewport = portraitControlSlot(host);
      const rect = viewport.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY,
        rect, moved: false, from: button.dataset.yofiCorner || "tr" };
      // Retain native click synthesis so a tap still toggles/selects normally.
      try { button.setPointerCapture(event.pointerId); } catch (_) {}
      event.stopPropagation();
    });
    button.addEventListener("pointermove", (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 11) return;
      drag.moved = true;
      const w = button.offsetWidth || 28;
      const h = button.offsetHeight || 28;
      const x = Math.max(0, Math.min(drag.rect.width - w,
        event.clientX - drag.rect.left - w / 2));
      const y = Math.max(0, Math.min(drag.rect.height - h,
        event.clientY - drag.rect.top - h / 2));
      button.dataset.yofiDragging = "true";
      button.style.left = `${x}px`;
      button.style.top = `${y}px`;
      button.style.right = "auto";
      button.style.bottom = "auto";
      event.preventDefault();
      event.stopPropagation();
    });
    const finish = (event, cancel = false) => {
      if (!drag || drag.id !== event.pointerId) return;
      const original = drag.from;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      const moved = drag.moved;
      const vertical = !cancel && moved && Math.abs(dy) > 13
        ? (dy > 0 ? "b" : "t") : original[0];
      const horizontal = !cancel && moved && Math.abs(dx) > 13
        ? (dx > 0 ? "r" : "l") : original[1];
      const corner = vertical + horizontal;
      drag = null;
      button.removeAttribute("data-yofi-dragging");
      setPortraitCorner(button, corner);
      if (moved) {
        state.suppressClick = true;
        // Some Safari gesture cancellations do not dispatch a synthetic click.
        // In that case the next deliberate tap must not be discarded.
        setTimeout(() => { state.suppressClick = false; }, 600);
        state.corner = corner;
        if (!cancel && corner !== original) rememberPortraitCorner(state.key, corner);
      }
      event.stopPropagation();
    };
    button.addEventListener("pointerup", (event) => finish(event));
    button.addEventListener("pointercancel", (event) => finish(event, true));
    button.addEventListener("lostpointercapture", () => {
      if (!drag) return;
      drag = null;
      button.removeAttribute("data-yofi-dragging");
      setPortraitCorner(button, state.corner || "tr");
    });
  }

  /* Public client configuration from the deployed Pokemon 5e frontend:
   * gh-pages/_app/immutable/chunks/Hhb6feIC.js, 2026-10-08.
   * This is the site's public ANON key, not a personal or administrative key.
   * Only get_fakemon is called. No saves, uploads, edits, or deletes.
   */
  const PORTRAIT_SOURCE = Object.freeze({
    endpoint: "https://api.poke5e.app/rest/v1/rpc/get_fakemon",
    assetBase: "https://poke5e.auroratide.cloud/",
    publicKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZ25jYmpqZm1udmJmcmpkeG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk1ODY2MzEsImV4cCI6MTk4NTE2MjYzMX0.RXw9pfN-4qOR2AbqPoM6GMzjDGRwYnClF9LEiI2VE5k",
    timeout: 12000,
  });

  function portraitContext() {
    const segments = location.pathname.split("/").filter(Boolean);
    const root = currentRoot();
    const rootIndex = segments.indexOf(root);
    if (rootIndex < 0 || !["pokemon", "fakemon"].includes(root)) return null;
    const prefix = rootIndex ? "/" + segments.slice(0, rootIndex).join("/") : "";
    if (root === "fakemon") {
      const url = new URL(location.href);
      const action = url.searchParams.get("action");
      if (action && action !== "info") return null;
      const id = (url.searchParams.get("id") || "").replace(/^F\./, "");
      return id ? { kind: root, id, key: `fakemon:${id}`, prefix } : null;
    }
    const rawId = segments[rootIndex + 1];
    if (!rawId) return null;
    let id;
    try { id = decodeURIComponent(rawId); } catch (_) { return null; }
    const edition = document.documentElement.dataset.edition === "2024" ? "2024" : "2018";
    return { kind: root, id, edition, prefix, key: `pokemon:${edition}:${id}` };
  }

  function portraitContextFromHref(href) {
    let url;
    try { url = new URL(href, location.href); } catch (_) { return null; }
    if (url.origin !== location.origin) return null;
    const segments = url.pathname.split('/').filter(Boolean);
    const rootIndex = segments.findIndex(part => part === 'pokemon' || part === 'fakemon');
    if (rootIndex < 0) return null;
    const root = segments[rootIndex];
    const prefix = rootIndex ? '/' + segments.slice(0, rootIndex).join('/') : '';
    if (root === 'fakemon') {
      if (segments.length !== rootIndex + 1) return null;
      const action = url.searchParams.get('action');
      if (action && action !== 'info') return null;
      const id = (url.searchParams.get('id') || '').replace(/^F\./i, '').trim();
      return id ? { kind: 'fakemon', id, prefix, key: `fakemon:${id}` } : null;
    }
    if (segments.length !== rootIndex + 2) return null;
    let id;
    try { id = decodeURIComponent(segments[rootIndex + 1]); } catch (_) { return null; }
    const edition = document.documentElement.dataset.edition === '2024' ? '2024' : '2018';
    return { kind: 'pokemon', id, edition, prefix, key: `pokemon:${edition}:${id}` };
  }

  function touchPortraitRecord(key) {
    const record = portraitRecords.get(key);
    if (!record) return;
    portraitRecords.delete(key);
    portraitRecords.set(key, record);
  }

  function trimPortraitRecords() {
    const currentKey = portraitContext()?.key;
    const protectedKeys = new Set([currentKey, openPortraitMenu?.key].filter(Boolean));
    while (portraitRecords.size > 8) {
      const candidate = Array.from(portraitRecords.keys()).find(key => !protectedKeys.has(key));
      if (!candidate) break;
      portraitRecords.delete(candidate);
    }
  }

  function clearFakemonPortraitRecords() {
    for (const key of portraitRecords.keys()) {
      if (key.startsWith('fakemon:')) portraitRecords.delete(key);
    }
  }

  function portraitUrl(raw, base = location.origin + "/") {
    if (typeof raw !== "string" || !raw.trim()) return null;
    try {
      const url = new URL(raw, base);
      return ["https:", "http:"].includes(url.protocol) ? url.href : null;
    } catch (_) { return null; }
  }

  function portraitEntriesFromFields(fields, base) {
    // Only explicit PORTRAIT files count. Sprites and hue filters do not.
    const spec = [
      ["normal", "Normal"], ["shiny", "Shiny"],
      ["female", "Female"], ["shinyFemale", "Shiny Female"],
    ];
    const seen = new Set();
    return spec.flatMap(([key, label]) => {
      const src = portraitUrl(fields[key], base);
      if (!src || seen.has(src)) return [];
      seen.add(src);
      return [{ key, label, src }];
    });
  }

  async function readPortraitJson(url, init = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PORTRAIT_SOURCE.timeout);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (!response.ok) throw new Error(`Artwork lookup: HTTP ${response.status}.`);
      try { return await response.json(); }
      catch (_) { throw new Error("Artwork lookup returned invalid JSON."); }
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("Artwork lookup timed out.");
      if (error instanceof TypeError) throw new Error("Artwork request blocked or network unavailable.");
      throw error;
    } finally { clearTimeout(timer); }
  }

  async function loadPortraitEntries(context) {
    if (context.kind === "fakemon") {
      const json = await readPortraitJson(PORTRAIT_SOURCE.endpoint, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        headers: {
          apikey: PORTRAIT_SOURCE.publicKey,
          Authorization: `Bearer ${PORTRAIT_SOURCE.publicKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ _read_key: context.id }),
      });
      const rows = Array.isArray(json) ? json : [json];
      const row = rows.find((value) => value && value.read_key === context.id);
      if (!row) throw new Error("Artwork lookup returned no matching Fakemon record.");
      if (!row.normal_portrait_filename) throw new Error("The record has no normal portrait filename.");
      return portraitEntriesFromFields({
        normal: row.normal_portrait_filename,
        shiny: row.shiny_portrait_filename,
      }, PORTRAIT_SOURCE.assetBase);
    }
    const url = `${context.prefix}/srd/v1/${context.edition}/pokemon/${encodeURIComponent(context.id)}.json`;
    const json = await readPortraitJson(url, { credentials: "same-origin" });
    if (!json?.media?.main) throw new Error("Species data has no normal portrait reference.");
    return portraitEntriesFromFields({
      normal: json.media.main,
      shiny: json.media.mainShiny,
      female: json.media.mainF,
      shinyFemale: json.media.mainShinyF,
    });
  }

  function requestPortraitEntries(context, retry = false) {
    const old = portraitRecords.get(context.key);
    if (old?.status === "loading" || (!retry && old)) {
      touchPortraitRecord(context.key);
      return old?.promise || Promise.resolve(old?.entries || []);
    }
    const record = { status: "loading", entries: [], error: "" };
    portraitRecords.set(context.key, record);
    trimPortraitRecords();
    record.promise = loadPortraitEntries(context).then((entries) => {
      if (!entries.some((entry) => entry.key === "normal")) {
        throw new Error("No usable normal portrait URL was returned.");
      }
      record.status = "ready";
      record.entries = entries;
      touchPortraitRecord(context.key);
      trimPortraitRecords();
      queueInstall();
      return entries;
    }).catch((error) => {
      // Failure is NOT cached as a successful 'no alternate artwork' result.
      record.status = "error";
      record.error = error?.message || "Artwork lookup failed.";
      touchPortraitRecord(context.key);
      trimPortraitRecords();
      console.warn("[Pokemon 5e QOL portraits]", record.error);
      queueInstall();
      return [];
    });
    return record.promise;
  }

  function closeVariantMenu(returnFocus = false) {
    if (!openPortraitMenu) return;
    const { menu, button } = openPortraitMenu;
    openPortraitMenu = null;
    menu.remove();
    button.setAttribute("aria-expanded", "false");
    if (returnFocus && button.isConnected) button.focus({ preventScroll: true });
  }

  function clearPortraitNotice(host) {
    host.querySelector(":scope > .yofi-portrait-notice")?.remove();
  }

  function showPortraitNotice(host, text, retry) {
    const prior = host.querySelector(":scope > .yofi-portrait-notice");
    if (prior?.dataset.message === text) return;
    clearPortraitNotice(host);
    host.classList.add("yofi-portrait-control-host");
    const notice = document.createElement("div");
    notice.className = "yofi-portrait-notice";
    notice.dataset.message = text;
    notice.setAttribute("role", "status");
    const label = document.createElement("span");
    label.textContent = text;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Retry";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      clearPortraitNotice(host);
      retry();
    });
    notice.append(label, button);
    host.appendChild(notice);
  }

  function portraitControlSlot(host) {
    // The native img-zoom component expects a single slotted image child.
    // Never inject buttons or transition layers into that custom element:
    // position our controls in its surrounding artwork figure instead.
    return host.querySelector(":scope > figure") || host;
  }

  function removeVariantButton(host) {
    if (openPortraitMenu?.host === host) closeVariantMenu();
    host.querySelectorAll(".yofi-portrait-sparkle").forEach((button) => button.remove());
  }

  function preloadPortrait(src) {
    const cached = portraitPreloads.get(src);
    if (cached) {
      portraitPreloads.delete(src);
      portraitPreloads.set(src, cached);
      return cached;
    }
    const promise = new Promise((resolve, reject) => {
      const probe = new Image();
      probe.decoding = 'async';
      let settled = false;
      let decodeStarted = false;
      const timer = setTimeout(() => finish(false), PORTRAIT_SOURCE.timeout);
      function finish(ok) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        probe.onload = probe.onerror = null;
        if (ok) {
          decodedPortraitUrls.add(src);
          while (decodedPortraitUrls.size > 32)
            decodedPortraitUrls.delete(decodedPortraitUrls.values().next().value);
          resolve();
        } else reject(new Error("The selected portrait could not be loaded."));
      }
      const loaded = () => {
        if (settled || decodeStarted) return;
        if (!(probe.naturalWidth > 0)) { finish(false); return; }
        decodeStarted = true;
        if (typeof probe.decode === 'function') {
          probe.decode().then(() => finish(true), () => finish(probe.naturalWidth > 0));
        } else finish(true);
      };
      probe.onload = loaded;
      probe.onerror = () => finish(false);
      probe.src = src;
      if (probe.complete) loaded();
    });
    portraitPreloads.set(src, promise);
    while (portraitPreloads.size > 8) portraitPreloads.delete(portraitPreloads.keys().next().value);
    promise.catch(() => {
      if (portraitPreloads.get(src) === promise) portraitPreloads.delete(src);
    });
    return promise;
  }

  function neighborDataRequest(context, priority = 'low') {
    if (context.kind === 'fakemon') {
      return {
        key: `fakemon:${context.id}`,
        input: PORTRAIT_SOURCE.endpoint,
        init: {
          method: 'POST', mode: 'cors', credentials: 'omit', priority,
          headers: {
            apikey: PORTRAIT_SOURCE.publicKey,
            Authorization: `Bearer ${PORTRAIT_SOURCE.publicKey}`,
            'Content-Type': 'application/json', Accept: 'application/vnd.pgrst.object+json',
          },
          body: JSON.stringify({ _read_key: context.id }),
        },
      };
    }
    const url = `${context.prefix}/srd/v1/${context.edition}/pokemon/${encodeURIComponent(context.id)}.json`;
    return { key: `pokemon-json:${new URL(url, location.origin).href}`, input: url,
      init: { credentials: 'same-origin', priority } };
  }

  function warmNeighborPortrait(anchor, priority = 'low') {
    if (!(anchor instanceof HTMLAnchorElement)) return;
    const context = portraitContextFromHref(anchor.href);
    if (!context) return;
    const editions = context.kind === 'pokemon' ? ['2018','2024'] : [context.edition];
    if (neighborResponseCache.installed) {
      for (const edition of editions) {
        const request = neighborDataRequest({...context,edition},priority);
        void neighborResponseCache.prefetch(request.key, request.input, request.init).catch(() => {});
      }
    }
    void requestPortraitEntries(context).then(entries => {
      const preferredKey = globalShinyPreference ? 'shiny' : 'normal';
      const preferred = entries.find(entry => entry.key === preferredKey)
        || entries.find(entry => entry.key === 'normal');
      if (preferred) void preloadPortrait(preferred.src).then(() => {
        if (portraitContext()?.key === context.key) queueInstall();
      }).catch(() => {});
    });
  }

  const warmedNeighborhoods = new Map();
  function warmResultNeighbors(previous, next, signature) {
    const old = warmedNeighborhoods.get(signature);
    if (old && old > Date.now()) return;
    warmedNeighborhoods.set(signature, Date.now() + 30000);
    while (warmedNeighborhoods.size > 16)
      warmedNeighborhoods.delete(warmedNeighborhoods.keys().next().value);
    const currentKey = portraitContext()?.key;
    for (const anchor of [previous, next]) {
      const context = anchor && portraitContextFromHref(anchor.href);
      if (!context || context.key === currentKey) continue;
      warmNeighborPortrait(anchor);
    }
  }

  // Mirror the native Art shimmer on manually switched shiny portraits.
  // Class-only DOM edits aren't enough: Art's scoped animation CSS does not
  // apply to a new class added by an isolated userscript.
  const portraitShimmerTimers = new WeakMap();
  const pendingPortraitShimmer = new WeakMap();
  // One observer for all portraits, only while a shiny's entrance animation
  // is pending. The animation starts when the image enters the viewport.
  const portraitShimmerObserver = typeof IntersectionObserver === "function"
    ? new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const image = entry.target;
        if (!pendingPortraitShimmer.has(image)) continue;
        pendingPortraitShimmer.delete(image);
        portraitShimmerObserver.unobserve(image);
        startPortraitShimmerNow(image);
      }
    }, { threshold: .01 }) : null;

  function startPortraitShimmerNow(img) {
    if (!img.isConnected) return;
    // Restart even after switching back and forth quickly.
    void img.offsetWidth;
    img.classList.add("yofi-portrait-shimmer");
    const timer = setTimeout(() => {
      img.classList.remove("yofi-portrait-shimmer");
      portraitShimmerTimers.delete(img);
    }, 1700);
    portraitShimmerTimers.set(img, timer);
  }

  function playPortraitShimmer(img, variantKey) {
    const prior = portraitShimmerTimers.get(img);
    if (prior) clearTimeout(prior);
    portraitShimmerTimers.delete(img);
    pendingPortraitShimmer.delete(img);
    portraitShimmerObserver?.unobserve(img);
    img.classList.remove("yofi-portrait-shimmer");
    if (variantKey !== "shiny" && variantKey !== "shinyFemale") return;
    if (portraitShimmerObserver) {
      pendingPortraitShimmer.set(img, true);
      portraitShimmerObserver.observe(img);
    } else startPortraitShimmerNow(img);
  }

  function updateVariantButton(host, state) {
    const button = portraitControlSlot(host).querySelector(":scope > .yofi-portrait-sparkle");
    if (!button) return;
    const selected = state.entries.find((entry) => entry.key === state.selected) || state.entries[0];
    const toggle = state.entries.length === 2;
    const next = toggle ? state.entries.find((entry) => entry.key !== selected.key) : null;
    button.disabled = state.loading;
    button.classList.toggle("yofi-portrait-shiny-active", ["shiny", "shinyFemale"].includes(selected.key));
    button.setAttribute("aria-label", toggle ? `Show ${next.label} portrait` : "Choose portrait");
    button.title = toggle ? `Show ${next.label}` : `Portrait: ${selected.label}`;
    if (toggle) {
      button.setAttribute("aria-pressed", String(selected.key !== "normal"));
      button.removeAttribute("aria-haspopup");
    } else {
      button.removeAttribute("aria-pressed");
      button.setAttribute("aria-haspopup", "menu");
    }
  }

  async function choosePortrait(host, entry, inherited = false) {
    const state = portraitHostStates.get(host);
    if (!state || state.loading || portraitContext()?.key !== state.key) return;
    const token = ++state.token;
    state.loading = true;
    clearPortraitNotice(host);
    closeVariantMenu();
    updateVariantButton(host, state);
    try {
      await preloadPortrait(entry.src);
      if (!host.isConnected || token !== state.token || portraitContext()?.key !== state.key) return;
      const img = host.querySelector("img");
      if (!(img instanceof HTMLImageElement)) return;
      // Set only the existing portrait source, never the record or its metadata.
      img.removeAttribute("srcset");
      if (portraitUrl(img.getAttribute('src')) !== entry.src) img.src = entry.src;
      playPortraitShimmer(img, entry.key);
      state.img = img;
      state.selected = entry.key;
      state.failedPreferred = false;
      host.dataset.yofiPortraitVariant = entry.key;
      if (entry.key === 'shiny' || entry.key === 'shinyFemale') {
        failedOfficialShinyCandidates.delete(state.key);
        state.shimmerFor = img; // playPortraitShimmer already ran above.
      }
      if (!inherited) setGlobalShinyPreference(entry.key === "shiny" || entry.key === "shinyFemale");
    } catch (error) {
      if (host.isConnected && portraitContext()?.key === state.key) {
        if (inherited) state.failedPreferred = true;
        showPortraitNotice(host, error.message, () => choosePortrait(host, entry));
      }
    } finally {
      state.loading = false;
      if (portraitHostStates.get(host) === state) updateVariantButton(host, state);
    }
  }

  function showVariantMenu(host, state, button) {
    if (openPortraitMenu?.host === host) { closeVariantMenu(); return; }
    closeVariantMenu();
    const menu = document.createElement("div");
    menu.id = `yofi-portrait-menu-${++portraitMenuSequence}`;
    menu.className = "yofi-portrait-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Portrait variants");
    const style = getComputedStyle(host);
    for (const name of ["--skin-bg", "--skin-bg-text", "--font-sz-venus"]) {
      const value = style.getPropertyValue(name);
      if (value) menu.style.setProperty(name, value);
    }
    state.entries.forEach((entry) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "yofi-portrait-option";
      option.textContent = entry.label;
      option.setAttribute("role", "menuitemradio");
      option.setAttribute("aria-checked", String(entry.key === state.selected));
      option.classList.toggle("yofi-active", entry.key === state.selected);
      option.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void choosePortrait(host, entry);
      });
      menu.appendChild(option);
    });
    menu.addEventListener("keydown", (event) => {
      const choices = Array.from(menu.querySelectorAll("button"));
      const index = choices.indexOf(document.activeElement);
      if (event.key === "Escape") {
        event.preventDefault(); closeVariantMenu(true);
      } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? choices.length - 1 :
          (index + (event.key === "ArrowUp" ? -1 : 1) + choices.length) % choices.length;
        choices[next].focus();
      } else if (event.key === "Tab") closeVariantMenu();
    });
    // Body-level positioning avoids the card's overflow clipping the picker.
    document.body.appendChild(menu);
    const anchor = button.getBoundingClientRect();
    const box = menu.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    menu.style.left = `${Math.max(8, Math.min(anchor.right - box.width, vw - box.width - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(anchor.bottom + 5, vh - box.height - 8))}px`;
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("aria-controls", menu.id);
    openPortraitMenu = { host, menu, button, key: state.key };
    (menu.querySelector('[aria-checked="true"]') || menu.firstElementChild)?.focus({ preventScroll: true });
  }

  function buildVariantControl(host, state) {
    const slot = portraitControlSlot(host);
    const existing = slot.querySelector(":scope > .yofi-portrait-sparkle");
    if (existing) {
      if (existing.dataset.yofiCorner !== state.corner) setPortraitCorner(existing, state.corner);
      updateVariantButton(host, state);
      return;
    }
    host.classList.add("yofi-portrait-control-host");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "yofi-portrait-sparkle";
    // The sparkle itself fills the former circle's footprint.
    // A real button retains its existing tap target and accessible label.
    const sparkle = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sparkle.setAttribute("viewBox", "0 0 24 24");
    sparkle.setAttribute("aria-hidden", "true");
    sparkle.setAttribute("focusable", "false");
    const shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
    shape.setAttribute("d", "M12 0C13.5 7.5 16.5 10.5 24 12C16.5 13.5 13.5 16.5 12 24C10.5 16.5 7.5 13.5 0 12C7.5 10.5 10.5 7.5 12 0Z");
    shape.setAttribute("fill", "currentColor");
    sparkle.appendChild(shape);
    button.appendChild(sparkle);
    attachPortraitFlick(button, host, state);
    setPortraitCorner(button, state.corner || "tr");
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const current = portraitHostStates.get(host);
      if (current?.suppressClick) {
        current.suppressClick = false;
        return; // Drag ended: do not also activate the shiny picker.
      }
      if (!current || current.loading) return;
      if (current.entries.length === 2) {
        const next = current.entries.find((entry) => entry.key !== current.selected);
        void choosePortrait(host, next || current.entries[0]);
      } else showVariantMenu(host, current, button);
    });
    portraitControlSlot(host).appendChild(button);
    updateVariantButton(host, state);
  }

  function currentPortraitImage(article) {
    return article?.querySelector('section.info .square-image img');
  }
  function portraitMatchesRecord(article, context, record) {
    const img = currentPortraitImage(article);
    return !!img && record?.status === 'ready' &&
      record.entries.some(entry => entry.src === portraitUrl(img.getAttribute('src')));
  }
  function applyPreferredPortrait(article, context, record) {
    if (!portraitMatchesRecord(article, context, record)) return;
    const img = currentPortraitImage(article);
    const host = img.closest('.square-image');
    const state = portraitHostStates.get(host);
    const failed = failedOfficialShinyCandidates.has(context.key) ||
      (state?.key === context.key && state.failedPreferred);
    const preferred = globalShinyPreference && !failed &&
      record.entries.find(entry => entry.key === 'shiny');
    if (!preferred || !decodedPortraitUrls.has(preferred.src)) return;
    const actual = portraitUrl(img.getAttribute('src'));
    if (actual === preferred.src) return;
    // One source writer for inherited shiny preference, for both categories.
    // The surrounding native Art/IMG-ZOOM nodes are retained.
    earlyOfficialShinySources.set(img, { key: context.key, normal: actual, shiny: preferred.src });
    img.removeAttribute('srcset');
    img.src = preferred.src;
    if (!officialShinyErrorWatched.has(img)) {
      officialShinyErrorWatched.add(img);
      img.addEventListener('error', () => {
        const saved = earlyOfficialShinySources.get(img);
        if (!saved || portraitContext()?.key !== saved.key ||
            portraitUrl(img.getAttribute('src')) !== saved.shiny) return;
        failedOfficialShinyCandidates.add(saved.key);
        img.src = saved.normal;
        queueInstall();
      }, { passive: true });
    }
  }
  function syncPreferredPortraitBeforePaint() {
    const context = portraitContext();
    if (!context) return;
    const article = detailArticle(activeRoutePage()) || visibleDetailArticle();
    applyPreferredPortrait(article, context, portraitRecords.get(context.key));
  }

  // Shared species identity check for the pre-paint header and theme passes.
  // Exact metadata URLs prevent an outgoing image identifying a new route.
  window.__yofiPortraitReadiness = {
    matches(article, routeKey) {
      const context = portraitContext();
      return !!context && routeKey === `${context.kind}:${context.id}` &&
        portraitMatchesRecord(article, context, portraitRecords.get(context.key));
    }
  };

  function installPortraitControl(page) {
    syncPreferredPortraitBeforePaint();
    const context = portraitContext();
    if (!context) return;
    if (openPortraitMenu && (!openPortraitMenu.host.isConnected || openPortraitMenu.key !== context.key)) {
      closeVariantMenu();
    }
    const main = page.querySelector(":scope > main");
    // Restrict to the species detail card, not its editing form or other cards.
    if (!main?.querySelector("article section.stats")) return;
    const host = main.querySelector("article .square-image");
    const img = host?.querySelector("img");
    if (!(host instanceof HTMLElement) || !(img instanceof HTMLImageElement)) return;
    let state = portraitHostStates.get(host);
    if (!state || state.key !== context.key) {
      if (state) state.token++;
      removeVariantButton(host);
      clearPortraitNotice(host);
      state = { key: context.key, img, entries: [], selected: "normal", loading: false,
        token: 0, corner: savedPortraitCorner(context.key), suppressClick: false,
        failedPreferred: false };
      portraitHostStates.set(host, state);
    }
    const record = portraitRecords.get(context.key);
    const actualImageUrl = portraitUrl(img.getAttribute('src'));
    const earlyShiny = earlyOfficialShinySources.get(img);
    const chosenShiny = record?.status === 'ready'
      ? record.entries.find(e => e.key === 'shiny')?.src : null;
    if (globalShinyPreference &&
        !failedOfficialShinyCandidates.has(context.key) &&
        (actualImageUrl === chosenShiny ||
          (earlyShiny?.key === context.key && actualImageUrl === earlyShiny.shiny)) &&
        state.shimmerFor !== img) {
      state.shimmerFor = img;
      const shinySource = actualImageUrl;
      const shimmerWhenReady = () => {
        if (!img.isConnected || portraitContext()?.key !== context.key ||
            portraitHostStates.get(host)?.shimmerFor !== img ||
            portraitUrl(img.getAttribute('src')) !== shinySource ||
            !img.complete || !(img.naturalWidth > 0)) return;
        playPortraitShimmer(img, 'shiny');
      };
      if (img.complete && img.naturalWidth > 0) shimmerWhenReady();
      else img.addEventListener('load', shimmerWhenReady, { once: true, passive: true });
    }
    if (!record) { requestPortraitEntries(context); return; }
    if (record.status === "loading") return;
    host.dataset.yofiPortraitStatus = record.status;
    if (record.status === "error") {
      removeVariantButton(host);
      showPortraitNotice(host, record.error, () => {
        requestPortraitEntries(context, true);
      });
      return;
    }
    if (!portraitMatchesRecord(img.closest('article'), context, record)) return;
    state.entries = record.entries;
    // Reflect Svelte replacing the image rather than retaining stale handlers.
    const actual = portraitUrl(img.getAttribute("src"));
    const currentEntry = record.entries.find((entry) => entry.src === actual);
    if (currentEntry) state.selected = currentEntry.key;
    state.img = img;
    host.dataset.yofiPortraitVariant = state.selected;
    if (record.entries.length < 2) {
      removeVariantButton(host);
      return;
    }
    buildVariantControl(host, state);
    // The native Svelte image may be replaced after our preferred variant
    // was displayed. Apply the preference again if the actual source differs,
    // without retrying while a preload is active or after a failed preload.
    const preferred = state.entries.find((entry) => entry.key === "shiny");
    if (globalShinyPreference && preferred && state.selected !== preferred.key &&
        !state.loading && !state.failedPreferred &&
        !failedOfficialShinyCandidates.has(context.key)) {
      void choosePortrait(host, preferred, true);
    }
  }

  function startPortraitEvents() {
    document.addEventListener("click", (event) => {
      if (!openPortraitMenu) return;
      const { menu, button } = openPortraitMenu;
      if (!menu.contains(event.target) && !button.contains(event.target)) closeVariantMenu();
    }, true);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeVariantMenu(true);
    });
    window.addEventListener("resize", () => closeVariantMenu(), { passive: true });
    document.addEventListener("scroll", (event) => {
      if (openPortraitMenu && !openPortraitMenu.menu.contains(event.target)) closeVariantMenu();
    }, true);
  }


  /*
   * True only during the synchronous .click() we send to one of Pokémon 5e's
   * ORIGINAL side-list links from our prev/next buttons. This lets that click
   * navigate normally without being mistaken for a user's direct list click.
   */
  let preservingSyntheticNavigation = false;

  const guardKey = "__yofiPoke5eQol01020";
  if (window[guardKey]) return;
  window[guardKey] = true;
  // QOL owns species-sex icon geometry for titles, lists and gender bars.
  window.__yofiQolSexSymbols = Object.freeze({
    createSvg: makeNativeSexSvg,
    decorate: setDecoratedSexSymbol
  });

  function normalizeUrl(raw) {
    const url = new URL(raw, location.href);
    url.searchParams.delete("action");
    url.searchParams.delete("access_key");
    url.hash = "";

    let path = url.pathname;
    if (path.length > 1) path = path.replace(/\/+$/, "");

    const search = url.searchParams.toString();
    return `${path}${search ? `?${search}` : ""}`;
  }

  /* Distinguish an entry's identity from a category landing. In particular,
   * do NOT strip ?action=add or ?action=find: both are real detail panels.
   * The only persistent value is a route string scoped to this browser tab.
   */
  function fullscreenRouteKey(rawUrl) {
    try {
      const url = new URL(rawUrl, location.href);
      url.hash = "";
      url.searchParams.delete("access_key");
      const pathname = url.pathname.replace(/\/+$/, "") || "/";
      const query = url.searchParams.toString();
      return pathname + (query ? "?" + query : "");
    } catch (_) { return ""; }
  }

  function isDetailRoute(rawUrl = location.href) {
    let url;
    try { url = new URL(rawUrl, location.href); }
    catch (_) { return false; }
    if (url.origin !== location.origin) return false;
    const parts = url.pathname.split("/").filter(Boolean);
    const root = parts.find((part) => ["pokemon", "fakemon", "moves", "tms", "items", "trainers", "rules"].includes(part));
    if (!root) return false;
    const index = parts.indexOf(root);
    if (root === "fakemon" && ["add", "find"].includes(url.searchParams.get("action"))) return true;
    if (root === "fakemon" || root === "trainers") return !!url.searchParams.get("id");
    return parts.length > index + 1;
  }

  function rememberFullscreenView(rawUrl = location.href) {
    if (!isDetailRoute(rawUrl)) return;
    try { sessionStorage.setItem(FULLSCREEN_VIEW_KEY, fullscreenRouteKey(rawUrl)); }
    catch (_) {}
  }

  function clearFullscreenView() {
    try { sessionStorage.removeItem(FULLSCREEN_VIEW_KEY); }
    catch (_) {}
  }

  function rememberedFullscreenHere() {
    if (!isDetailRoute()) return false;
    try { return sessionStorage.getItem(FULLSCREEN_VIEW_KEY) === fullscreenRouteKey(location.href); }
    catch (_) { return false; }
  }

  function fakemonUtilityPanelHere() {
    if (currentRoot() !== "fakemon") return false;
    return ["add", "find"].includes(new URL(location.href).searchParams.get("action"));
  }

  function rememberCollapsedDestination(rawUrl) {
    try { sessionStorage.setItem(NAV_COLLAPSE_KEY, normalizeUrl(rawUrl)); }
    catch (_) {}
    if (fullscreenDefault) rememberFullscreenView(rawUrl);
  }

  function clearCollapsedDestination() {
    if (pendingListSelection) {
      pendingListSelection.article?.removeAttribute('data-yofi-fullscreen-handoff');
      const restoreSplit = !!pendingListSelection.article;
      pendingListSelection = null;
      document.documentElement.classList.remove('yofi-list-selection-pending');
      if (restoreSplit) setCollapsed(false);
    }
    try {
      sessionStorage.removeItem(NAV_COLLAPSE_KEY);
    } catch (_) {}
  }

  function pendingCollapseMatchesCurrentUrl() {
    try {
      return sessionStorage.getItem(NAV_COLLAPSE_KEY) === normalizeUrl(location.href);
    } catch (_) {
      return false;
    }
  }

  /*
   * Fallback for the unusual case where Pokémon 5e's own original link causes
   * a full navigation instead of Svelte client-side navigation.
   */
  if (pendingCollapseMatchesCurrentUrl() || rememberedFullscreenHere() || fakemonUtilityPanelHere()) {
    collapsed = true;
    document.documentElement.classList.add(GLOBAL_COLLAPSED_CLASS);
  }

  // Canonical Scarlet/Violet type colors for the entire site, regardless of
  // Light, Dark, or optional Type theme. Consumers should use the CSS custom
  // properties --skin-<type>-bg, not maintain independent color tables.
  const SV_TYPE_COLORS = Object.freeze({"normal": "#A1A1A1", "fire": "#D43A30", "fighting": "#F08833", "water": "#4C79BC", "flying": "#8FB8E4", "grass": "#5D9D3C", "poison": "#6D4B97", "electric": "#F2C341", "ground": "#895229", "psychic": "#DC4D79", "rock": "#ADA984", "ice": "#78CCF0", "bug": "#95A135", "dragon": "#4C60A9", "ghost": "#6B426E", "dark": "#4E403F", "steel": "#74A2B9", "fairy": "#BA7FB5"});
  // Reuse ONE source map for both CSS scopes: Poké5e defines Dark palette
  // variables directly on body.dark-mode, which otherwise override :root.
  const universalTypePaletteCSS = Object.entries(SV_TYPE_COLORS)
    .map(([type, hex]) => `--skin-${type}-bg: ${hex} !important;`).join('\n');
  const style = document.createElement("style");
  style.id = `yofi-poke5e-qol-${VERSION.replaceAll(".", "-")}-style`;
  style.textContent = `
    /* Universal S/V palette. Both declarations are generated from the same
       table above; none is conditional on Theme Overlay or Species Card. */
    html:root { ${universalTypePaletteCSS} }
    html body.dark-mode { ${universalTypePaletteCSS} }
    /* Settings preferences: work with native Svelte-owned sections rather
       than reimplementing language, rules edition, or beta controls. */
    /* QOL's original site-menu Theme control, present without Theme Overlay. */
    .yofi-native-theme-item button {
      cursor: pointer; border: 0; font: inherit; background: transparent;
      color: var(--skin-bg-text); display: flex; flex-direction: column;
      align-items: center; gap: .5em; width: 100%; padding: 0;
      text-transform: uppercase;
    }
    .yofi-native-theme-item button .bubble {
      width: var(--yofi-native-theme-diameter, 100%) !important;
      height: var(--yofi-native-theme-diameter, auto) !important;
      inline-size: var(--yofi-native-theme-diameter, 100%) !important;
      block-size: var(--yofi-native-theme-diameter, auto) !important;
      aspect-ratio: 1 / 1 !important; box-sizing: border-box !important;
      flex: 0 0 auto !important; border-radius: 50% !important;
    }
    .yofi-native-theme-item button .bubble svg {
      display: block; width: 100%; height: 100%; aspect-ratio: 1;
    }
    /* The header ID replaces the first native metadata pair visually, but
       neither node is deleted: Header and Species Card still read its value. */
    html.yofi-species-page .page > main article section.info > div:first-child > dl > dt:first-child,
    html.yofi-species-page .page > main article section.info > div:first-child > dl > dt:first-child + dd {
      display: none !important;
    }
    .yofi-settings-hidden { display: none !important; }
    .yofi-settings-index { display: flex; flex-wrap: wrap; align-items: center;
      gap: .5em 1.3em; margin: .5em 1em 1.5em; padding: 0;
      line-height: 1.5; }
    .yofi-settings-index a { color: inherit; text-decoration: underline;
      text-underline-offset: .18em; }
    .yofi-settings-preferences { display: grid; gap: .7em; margin: 1.25em 1em 1.75em; }
    .yofi-settings-pref { display: flex; align-items: center; justify-content: space-between;
      gap: .8em; flex-wrap: wrap; }
    .yofi-settings-pref > .yofi-pref-label { font-weight: 650; min-width: 9em; }
    .yofi-settings-choice { display: inline-flex; align-items: stretch;
      font-size: .70em; /* Shrink all pill dimensions proportionally. */
      background: var(--skin-none-bg, #e3e3e3); border-radius: 999px;
      overflow: hidden; max-width: 100%; padding: .15em; gap: .08em; }
    .yofi-settings-choice > button { border: 0; border-radius: 999px;
      color: var(--skin-bg-text, #333); background: transparent; font: inherit;
      min-width: 3.3em; min-height: 2.2em; padding: .3em .7em;
      cursor: pointer; text-align: center; }
    .yofi-settings-choice > button[aria-pressed="true"] {
      background: var(--skin-content, #fff); color: var(--skin-content-text, #333);
      font-weight: 700; box-shadow: 0 1px 6px #0002; }
    .yofi-settings-choice > button:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
    .yofi-quick-menu button.yofi-pokedex-option { border: none; cursor: pointer;
      background: transparent; text-align: start; }
    .yofi-quick-menu button.yofi-pokedex-option:hover { background: rgba(255,255,255,.12); }
    .yofi-official-backdrop { position: fixed; inset: 0; z-index: 2147483600;
      display: grid; place-items: center; padding: 1em;
      background: rgba(0,0,0,.45); }
    .yofi-official-panel { position: relative; width: min(34rem,100%); max-height: min(85dvh,700px);
      overflow: auto; box-sizing: border-box; border-radius: 1.5rem;
      background: var(--skin-content,white); color: var(--skin-content-text,#242424);
      box-shadow: 0 12px 35px #0005; padding: 1.3em 1.5em; }
    .yofi-official-panel h2 { margin: 0 2em .7em 0; }
    .yofi-official-panel p { line-height: 1.5; }
    .yofi-official-panel button.yofi-official-readd { border: 0; border-radius: 999px;
      background: var(--skin-bg,#333); color: var(--skin-bg-text,white);
      padding: .6em 1.2em; font: inherit; font-weight: 700; cursor: pointer; }
    .yofi-official-panel button.yofi-official-close { position: absolute; top: .7em; right: .8em;
      border: 0; background: transparent; font: inherit; font-size: 1.5em;
      color: inherit; cursor: pointer; }
    /* v0.11.16: reproduce the measured working console test, on the
       actual native .page > .side box. v0.11.15 required a JS-assigned class
       AND a :not(.side-empty) state; either can fail to reflect the live panel
       during SvelteKit route transitions. Match its native SearchField in CSS
       instead. The class remains as a legacy/older-browser fallback, but is
       no longer required. Apply in desktop split AND fullscreen; mobile uses
       its original stacked layout. Keep every row fully rendered, unlike the
       late-populating content-visibility:auto experiment. */
    @media screen and (min-width: 37.5rem) {
      .page > .side.yofi-search-list-contained,
      .page > .side:has(input[type="search"]) {
        contain: strict !important;
      }
      .page > .side.yofi-search-list-contained tbody tr,
      .page > .side:has(input[type="search"]) tbody tr {
        content-visibility: visible !important;
      }
    }

    html.${GLOBAL_COLLAPSED_CLASS} .page > .side {
      display: none !important;
    }

    @media screen and (max-width: 37.499rem) {
      html.${GLOBAL_COLLAPSED_CLASS} .page > main {
        height: calc(100% - 1em) !important;
      }
    }

    @media screen and (min-width: 37.5rem) {
      html.${GLOBAL_COLLAPSED_CLASS} .page > main {
        width: 100% !important;
        max-inline-size: none !important;
        flex: 1 1 100% !important;
        height: 100% !important;
      }
    }

    html.${GLOBAL_COLLAPSED_CLASS}.yofi-list-selection-pending .page > .side,
    html.${GLOBAL_COLLAPSED_CLASS}.yofi-list-selection-pending .page.yofi-search-list-page:not(.side-empty) > .side {
      display: block !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }

    /* Fakemon shares the native SortableTable/BubbleRow markup and CSS.
       Only the missing columns are added; grid ratios, capsules, header
       buttons, breakpoints and hover treatment match PokemonSpeciesList.
       Prevent a type string from ever introducing a second physical row. */
    .page > .side table.yofi-fakemon-native-columns td {
      min-width: 0;
      white-space: nowrap;
    }
    .page > .side table.yofi-fakemon-native-columns td[data-yofi-fakemon-column] {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .page > .side table.yofi-fakemon-native-columns th {
      min-width: 0;
      white-space: nowrap;
    }
    .page > .side table.yofi-fakemon-native-columns th > button {
      white-space: nowrap;
    }
    .page > .side table.yofi-fakemon-native-columns .sort-arrow {
      font-size: .75em;
    }
    @media screen and (max-width: 50rem) {
      .page > .side table.yofi-fakemon-native-columns .large-screen-only {
        display: none !important;
      }
    }

    /* Keep every searchable desktop list warm in split AND fullscreen.
       Its 50%-wide box remains mounted, positioned outside main's flex flow.
       Fullscreen hides it via visibility (NOT display:none), so the native
       table does not lose its layout on Search / restore. This generalizes
       the established species-list strategy without creating new DOM nodes. */
    @media screen and (min-width: 37.5rem) {
      .page.yofi-search-list-page:not(.side-empty) {
        position: relative;
      }
      .page.yofi-search-list-page:not(.side-empty) > .side {
        position: absolute !important;
        inset: 0 auto 0 0 !important;
        box-sizing: border-box;
        display: block !important;
        width: 50% !important;
        height: 100% !important;
        flex: none !important;
        z-index: 2;
      }
      .page.yofi-search-list-page:not(.side-empty) > main {
        box-sizing: border-box;
        flex: 0 0 50% !important;
        width: 50% !important;
        max-inline-size: none !important;
        margin-left: 50% !important;
      }
      html.${GLOBAL_COLLAPSED_CLASS} .page.yofi-search-list-page:not(.side-empty) > .side {
        visibility: hidden !important;
        pointer-events: none !important;
      }
      html.${GLOBAL_COLLAPSED_CLASS} .page.yofi-search-list-page:not(.side-empty) > main {
        flex: 0 0 100% !important;
        width: 100% !important;
        margin-left: 0 !important;
      }
    }
    /* Only the TM result list prints raw lowercase type names. Preserve
       its native filtering/sorting and capitalize the displayed second cell. */
    .theme-purple .page > .side tbody tr > td:nth-child(2) {
      text-transform: capitalize;
    }

    /* The native SearchField.svelte .search-bar is already a flex row.
       Insert an always-visible, unskewed, chromeless X as a sibling *after*
       its input. No absolute coordinates or padding hacks on Svelte input. */
    .page > .side .search-bar > .yofi-search-clear {
      position:static!important;
      display:grid!important;
      place-items:center!important;
      flex:0 0 24px!important;
      align-self:center!important;
      box-sizing:border-box!important;
      width:24px!important;
      height:24px!important;
      margin:0 .1em 0 0!important;
      padding:0!important;
      appearance:none!important;
      -webkit-appearance:none!important;
      background:transparent!important;
      color:var(--skin-bg-text,#fff)!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
      font:400 22px/1 system-ui,sans-serif!important;
      opacity:.92!important;
      cursor:pointer;
      touch-action:manipulation;
    }
    .page > .side .yofi-search-clear[hidden] {display:none!important}
    .page > .side input[type="search"].yofi-search-clear-space::-webkit-search-cancel-button {
      display:none!important;-webkit-appearance:none!important;
    }


    /* One measured rhythm for both the probe and visible stage. No trailing
       phantom 1.5-row space after a badge field's final badge row. The row
       scheduler adjusts label starts rather than pushing entire columns. */


    .yofi-portrait-control-host {
      position: relative !important;
      overflow: visible !important;
    }
    .yofi-portrait-sparkle {
      position: absolute;
      z-index: 50;
      top: 0.35em;
      right: 0.35em;
      display: grid;
      place-items: center;
      width: 1.9em;
      height: 1.9em;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: rgba(100,100,100,.6);
      box-shadow: none;
      -webkit-appearance: none;
      appearance: none;
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
      font: inherit;
      font-size: 0.9rem;
      line-height: 1;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .yofi-portrait-sparkle > svg {
      display: block;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .yofi-portrait-sparkle:active { color: rgba(100,100,100,.85); }
    .yofi-portrait-sparkle:disabled { cursor: wait; opacity: .6; }
    .yofi-portrait-sparkle:focus-visible,
    .yofi-portrait-option:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
    
    .yofi-portrait-control-host img.yofi-portrait-shimmer {
      -webkit-mask-image: linear-gradient(-60deg, #000 30%, rgba(0,0,0,.5) 50%, #000 70%);
      mask-image: linear-gradient(-60deg, #000 30%, rgba(0,0,0,.5) 50%, #000 70%);
      -webkit-mask-size: 350% 100%;
      mask-size: 350% 100%;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-position: right;
      mask-position: right;
      animation: yofi-portrait-shimmer 1s .5s forwards;
    }
    @keyframes yofi-portrait-shimmer {
      to {
        -webkit-mask-position: left;
        mask-position: left;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .yofi-portrait-control-host img.yofi-portrait-shimmer {
        -webkit-mask: none;
        mask: none;
        animation: none;
      }
    }

    .yofi-portrait-menu {
      position: fixed;
      z-index: 2147483000;
      display: grid;
      gap: .15em;
      min-width: 9.5em;
      max-width: calc(100vw - 16px);
      box-sizing: border-box;
      padding: .3em;
      border-radius: .75em;
      background: var(--skin-bg, #333);
      color: var(--skin-bg-text, #fff);
      box-shadow: 0 4px 14px rgba(0,0,0,.32);
      font: inherit;
    }
    .yofi-portrait-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .75em;
      width: 100%;
      padding: .45em .65em;
      border: 0;
      border-radius: .5em;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: var(--font-sz-venus, .9rem);
      text-align: left;
      white-space: nowrap;
      cursor: pointer;
      touch-action: manipulation;
    }
    .yofi-portrait-option:hover,
    .yofi-portrait-option.yofi-active { background: rgba(255,255,255,.13); }
    .yofi-portrait-option.yofi-active::after { content: "\\2713"; font-weight: 700; }
    .yofi-portrait-notice {
      position: absolute;
      z-index: 51;
      bottom: 0;
      left: 0;
      right: 0;
      display: grid;
      justify-items: start;
      gap: .3em;
      padding: .5em;
      border-radius: .5em;
      color: #fff;
      background: rgba(35,35,35,.9);
      font: 12px/1.35 system-ui, sans-serif;
      overflow-wrap: anywhere;
    }
    .yofi-portrait-notice button {
      width: auto;
      margin: 0;
      padding: .2em .6em;
      border: 1px solid currentColor;
      border-radius: 1em;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }

    article.yofi-fakemon-actions-active > header {
      column-gap: 0.3em;
      row-gap: 0.2em;
    }

    article.yofi-fakemon-typed-header > header > .title.yofi-title-nav-host {
      flex: 0 1 auto !important;
      min-width: 0;
    }

    article.yofi-fakemon-typed-header > header .yofi-fakemon-title-text {
      flex: 0 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    article.yofi-fakemon-typed-header > header > .type-tag {
      margin-inline-start: auto;
    }

    article > header > .yofi-fakemon-header-actions {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.12em;
      flex: 0 0 auto;
      margin-inline-start: 0.35em;
      order: 0;
    }

    article > header .yofi-fakemon-action-icon {
      box-sizing: border-box;
      display: inline-grid;
      place-items: center;
      width: 1.9em;
      height: 1.9em;
      min-width: 1.9em;
      padding: 0;
      border: 0;
      border-radius: 0.35em;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 1rem;
      line-height: 1;
      cursor: pointer;
      -webkit-appearance: none;
      appearance: none;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }

    article > header .yofi-fakemon-action-icon > svg {
      width: 1.1em;
      height: 1.1em;
      display: block;
      pointer-events: none;
    }

    article > header .yofi-fakemon-action-icon:hover,
    article > header .yofi-fakemon-action-icon:active {
      background: rgba(255,255,255,0.16);
    }

    article > header .yofi-fakemon-action-icon:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 1px;
    }

    article > header .yofi-fakemon-action-icon.yofi-fakemon-action-remove:hover,
    article > header .yofi-fakemon-action-icon.yofi-fakemon-action-remove:active {
      color: #ffaaaa;
    }

    article > header .yofi-fakemon-action-icon:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    article.yofi-fakemon-actions-active .action-area.yofi-fakemon-actions-promoted {
      display: none !important;
    }

    /* Card-width rule: compact even in a desktop split pane. */
    article.yofi-entry-compact.yofi-fakemon-actions-active:not(.yofi-fakemon-form-header) > header {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        flex-wrap: nowrap !important;
        gap: var(--yofi-fakemon-space, 2px) !important;
        padding-inline: 0.45em 0.7em !important;
      }
      
      article.yofi-entry-compact.yofi-fakemon-actions-active.yofi-fakemon-typed-header > header {
        display: grid !important;
        grid-template-columns: minmax(0, auto) minmax(max-content, 1fr) max-content max-content;
        justify-content: stretch !important;
      }
      article.yofi-entry-compact.yofi-fakemon-actions-active.yofi-fakemon-typed-header
        > header > .title.yofi-title-nav-host {
        grid-column: 1;
        justify-self: start;
        max-width: 100%;
      }
      article.yofi-entry-compact.yofi-fakemon-actions-active.yofi-fakemon-typed-header
        > header > .type-tag {
        grid-column: 2;
        justify-self: center;
        margin-inline: 0 !important;
      }
      article.yofi-entry-compact.yofi-fakemon-actions-active.yofi-fakemon-typed-header
        > header > .yofi-fakemon-header-actions {
        grid-column: 3;
      }
      article.yofi-entry-compact.yofi-fakemon-actions-active.yofi-fakemon-typed-header
        > header > .dismiss {
        grid-column: 4;
      }
      article.yofi-entry-compact.yofi-fakemon-actions-active > header > .title.yofi-title-nav-host {
        flex: 0 1 auto !important;
        min-width: 0 !important;
        gap: 0.06em !important;
        overflow: hidden;
        white-space: nowrap;
      }
      article.yofi-entry-compact.yofi-fakemon-actions-active > header .yofi-fakemon-title-text {
        flex: 0 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      article.yofi-entry-compact.yofi-fakemon-actions-active > header .yofi-result-nav {
        flex: 0 0 1.22em;
        width: 1.22em;
        height: 1.5em;
        margin: 0;
      }
      article.yofi-entry-compact.yofi-fakemon-actions-active > header > .type-tag {
        order: 1;
        flex: 0 0 auto;
        margin-inline-start: auto !important;
        font-size: 0.9em;
        white-space: nowrap;
      }
      article.yofi-entry-compact.yofi-fakemon-actions-active > header > .type-tag > .type {
        padding-inline: 0.72em;
      }
      article.yofi-entry-compact.yofi-fakemon-actions-active > header > .type-tag > .type.left {
        margin-inline-start: -0.72em;
        padding-inline-start: 1.44em;
      }
      article.yofi-entry-compact.yofi-fakemon-actions-active > header > .type-tag > .type.right {
        margin-inline-end: -0.72em;
        padding-inline-end: 1.44em;
      }
      article.yofi-entry-compact.yofi-fakemon-actions-active > header > .yofi-fakemon-header-actions {
        order: 2;
        flex: 0 0 auto;
        margin: 0 !important;
        gap: var(--yofi-fakemon-space, 2px) !important;
      }
      article.yofi-entry-compact.yofi-fakemon-actions-active > header .yofi-fakemon-action-icon {
        /* Vary only the hitbox width: the 1.1em SVG never scales down. */
        width: var(--yofi-fakemon-action-hit, 1.68em);
        min-width: var(--yofi-fakemon-action-hit, 1.68em);
        height: 1.9em;
      }
      article.yofi-entry-compact.yofi-fakemon-actions-active > header > .dismiss {
        order: 3;
        flex: 0 0 auto;
        display: inline-grid;
        place-items: center;
        box-sizing: border-box;
        width: var(--yofi-fakemon-dismiss-hit, 1.45em);
        min-width: var(--yofi-fakemon-dismiss-hit, 1.45em);
        height: 1.9em;
        margin: 0 !important;
        padding: 0;
      }
      article.yofi-entry-compact.yofi-fakemon-actions-active > header > .dismiss svg {
        max-width: 1.125em;
        max-height: 1.125em;
      }
      
      article.yofi-entry-compact.yofi-fakemon-actions-active:not(.yofi-fakemon-typed-header)
        > header > .yofi-fakemon-header-actions {
        margin-inline-start: auto !important;
      }

    article > header .title.yofi-title-nav-host {
      display: inline-flex !important;
      align-items: center;
      gap: 0.35em;
      position: relative;
      cursor: default;
    }

    .yofi-result-nav {
      position: relative;
      z-index: 20;
      flex: 0 0 auto;
      display: inline-grid;
      place-items: center;
      width: 1.55em;
      height: 1.55em;
      padding: 0;
      margin: -0.2em 0;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: currentColor !important;
      font: inherit;
      cursor: pointer;
      pointer-events: auto;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }

    .yofi-result-nav:hover,
    .yofi-result-nav:active {
      background: rgba(255,255,255,.14);
    }

    .yofi-result-nav:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 1px;
    }

    .yofi-result-nav .yofi-chevron {
      width: 0.47em;
      height: 0.47em;
      border-right: 0.13em solid currentColor;
      border-bottom: 0.13em solid currentColor;
      pointer-events: none;
    }

    .yofi-result-nav.yofi-prev .yofi-chevron {
      transform: rotate(135deg);
    }

    .yofi-result-nav.yofi-next .yofi-chevron {
      transform: rotate(-45deg);
    }
    
    article.yofi-species-titlebar > header {
      display: grid !important;
      grid-template-columns: minmax(0, auto) minmax(max-content, 1fr) max-content max-content !important;
      align-items: center;
      justify-content: stretch !important;
      column-gap: var(--yofi-fakemon-space, .35em);
    }
    article.yofi-species-titlebar > header > .title {
      grid-column: 1; grid-row: 1; justify-self: start;
      flex: 0 1 auto !important; min-width: 0; max-width: 100%;
      display: inline-flex; align-items: center;
    }
    article.yofi-species-titlebar > header .yofi-fakemon-title-text {
      flex: 0 1 auto; min-width: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    article.yofi-species-titlebar > header > .type-tag {
      grid-column: 2; grid-row: 1; justify-self: center;
      margin-inline: 0 !important;
    }
    article.yofi-species-titlebar > header > .yofi-fakemon-header-actions {
      grid-column: 3; grid-row: 1;
      margin-inline: 0 !important;
    }
    article.yofi-species-titlebar > header > .dismiss { grid-column: 4; grid-row: 1; }
    article.yofi-species-titlebar > header > #additional-types-expansion { grid-column: 1 / -1; grid-row: 2; }

    .yofi-pokedex-option:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }

    .yofi-pokedex-menu {
      position: fixed; z-index: 2147483100; margin: 0;
      min-width: 11em; max-width: calc(100vw - 16px);
      padding: .35em; border: 1px solid rgba(255,255,255,.15);
      border-radius: .75em;
      background: var(--skin-bg, #333); color: var(--skin-bg-text, white);
      box-shadow: 0 5px 18px rgba(0,0,0,.3);
      font-size: var(--font-sz-venus, .9rem);
    }
    .yofi-pokedex-option {
      display: flex !important; align-items: center; gap: .6em;
      width: 100%; min-height: 2.75em;
      padding: .5em .7em; border-radius: .45em;
      color: inherit !important; text-decoration: none !important;
      font: inherit; white-space: nowrap;
    }
    .yofi-pokedex-option:hover { background: rgba(255,255,255,.12); }
    .yofi-pokedex-option > svg { width: 1.2em; height: 1.2em; flex: 0 0 1.2em; }

    article.yofi-tight-titlebar > header {
      padding-inline: .45em .7em !important;
      gap: var(--yofi-fakemon-space, 2px) !important;
    }
    article.yofi-tight-titlebar > header > .title.yofi-title-nav-host {
      gap: .06em !important; overflow: hidden; white-space: nowrap;
    }
    article.yofi-tight-titlebar > header .yofi-result-nav {
      flex: 0 0 1.22em; width: 1.22em; height: 1.5em; margin: 0;
    }
    article.yofi-tight-titlebar > header > .type-tag { font-size: .9em; white-space: nowrap; }
    article.yofi-tight-titlebar > header > .type-tag > .type { padding-inline: .72em; }
    article.yofi-tight-titlebar > header > .type-tag > .type.left { margin-inline-start: -.72em; padding-inline-start: 1.44em; }
    article.yofi-tight-titlebar > header > .type-tag > .type.right { margin-inline-end: -.72em; padding-inline-end: 1.44em; }
    article.yofi-tight-titlebar > header > .yofi-fakemon-header-actions { gap: var(--yofi-fakemon-space, 2px) !important; }
    article.yofi-tight-titlebar > header .yofi-fakemon-action-icon {
      width: var(--yofi-fakemon-action-hit, 1.68em);
      min-width: var(--yofi-fakemon-action-hit, 1.68em);
    }

    article > header .title.yofi-title-nav-host .yofi-result-nav {
      cursor: pointer;
    }

    .page > .side .yofi-fakemon-native-actions-hidden { display: none !important; }

    nav[aria-label="Fakémon List"] .flex-column.space-bottom:has(a[href*="action=add"]),
    nav[aria-label="Fakémon List"] .yofi-fakemon-native-heading-hidden,
    .page > .side .yofi-fakemon-native-heading-hidden {
      display: none !important;
    }

    .page > main article > header > a.dismiss {
      display: inline-flex !important;
      align-items: center; justify-content: center;
      flex: 0 0 1.125em;
    }
    .page > main article > header > a.dismiss > svg {
      width: 100%; height: auto;
    }

    .yofi-quick-menu {
      position: fixed; z-index: 2147483500;
      min-width: 12em; max-width: min(21em, calc(100vw - 16px));
      max-height: min(75vh, 35em); overflow-y: auto;
    }
    .yofi-quick-menu .yofi-pokedex-option > svg {
      transform: none !important;
      width: 1.25em !important; height: 1.25em !important;
      flex: 0 0 1.25em;
    }

    @supports (-webkit-touch-callout: none) {
      @media (pointer: coarse) {
        input:not([type="checkbox"]):not([type="radio"]), select, textarea {
          font-size: max(16px, 1em) !important;
        }
      }
    }
    @media (pointer: coarse) {
      html, body { touch-action: pan-x pan-y; }
    }

    .page > main article > header > a.yofi-find-cancel {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex: 0 0 1.125em !important;
      min-width: 1.125em;
      margin-inline-start: auto;
      padding: 0;
      color: inherit;
      text-decoration: none;
      cursor: pointer;
    }
    .page > main article > header > a.yofi-find-cancel > svg {
      display: block;
      width: 1.125em;
      height: 1.125em;
    }
    .page > main article > header > a.yofi-find-cancel:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    article.yofi-fixed-chevron-header > header.yofi-centered-titlebar {
      display: grid !important;
      grid-template-columns: var(--yofi-fixed-title-size, 11rem) minmax(0, 1fr) max-content max-content !important;
      justify-content: stretch !important;
      align-items: center !important;
    }
    article.yofi-fixed-chevron-header > header > .title.yofi-title-nav-host {
      display: grid !important;
      grid-template-columns: var(--yofi-chevron-slot-size, 1.45rem) minmax(0, 1fr) var(--yofi-chevron-slot-size, 1.45rem) !important;
      align-items: center !important;
      column-gap: 0 !important;
      width: var(--yofi-fixed-title-size, 11rem) !important;
      min-width: 0 !important;
      max-width: 100% !important;
      overflow: visible !important;
      justify-self: start;
      white-space: nowrap;
    }
    article.yofi-fixed-chevron-header > header .title > .yofi-result-nav.yofi-prev,
    article.yofi-fixed-chevron-header > header .title > .yofi-result-nav-placeholder.yofi-prev {
      grid-column: 1; grid-row: 1;
    }
    article.yofi-fixed-chevron-header > header .title > .yofi-result-nav.yofi-next,
    article.yofi-fixed-chevron-header > header .title > .yofi-result-nav-placeholder.yofi-next {
      grid-column: 3; grid-row: 1;
    }
    article.yofi-fixed-chevron-header > header .title > .yofi-fakemon-title-text {
      grid-column: 2; grid-row: 1;
      justify-self: stretch;
      min-width: 0;
      width: 100%;
      font-size: var(--yofi-adaptive-name-size, 1em) !important;
      line-height: 1.15;
      text-align: center;
      overflow: hidden !important;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    article.yofi-fixed-chevron-header > header .title > .yofi-result-nav,
    article.yofi-fixed-chevron-header > header .title > .yofi-result-nav-placeholder {
      box-sizing: border-box;
      display: inline-grid;
      place-items: center;
      margin: 0 !important;
      padding: 0 !important;
      width: var(--yofi-chevron-slot-size, 1.45rem) !important;
      min-width: var(--yofi-chevron-slot-size, 1.45rem) !important;
      height: 1.75rem !important;
      min-height: 1.75rem !important;
      font-size: 1rem !important;
      justify-self: stretch;
    }
    article.yofi-fixed-chevron-header > header .yofi-result-nav-placeholder {
      pointer-events: none;
      visibility: hidden;
    }
    article.yofi-entry-compact.yofi-fixed-chevron-header > header {
        --yofi-fakemon-space: 2px;
        --yofi-fakemon-action-hit: 1.50em;
        --yofi-fakemon-dismiss-hit: 1.30em;
      }

    article.yofi-three-zone-header > header.yofi-centered-titlebar {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      grid-template-rows: auto auto;
      align-items: center !important;
      justify-content: stretch !important;
      column-gap: clamp(4px, 0.65%, 12px) !important;
      box-sizing: border-box;
    }
    article.yofi-three-zone-header > header.yofi-centered-titlebar > .title {
      grid-column: 1 !important;
      grid-row: 1 !important;
      justify-self: stretch !important;
      align-self: center !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      margin: 0 !important;
    }
    article.yofi-three-zone-header > header.yofi-centered-titlebar > .type-tag {
      grid-column: 2 !important;
      grid-row: 1 !important;
      justify-self: center !important;
      align-self: center !important;
      margin: 0 !important;
      white-space: nowrap !important;
      max-width: none;
    }
    article.yofi-three-zone-header > header.yofi-centered-titlebar > .yofi-entry-action-zone {
      grid-column: 3 !important;
      grid-row: 1 !important;
      display: grid !important;
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      justify-items: center;
      align-items: center;
      width: 100%;
      min-width: 0;
      max-width: 100%;
      margin: 0 !important;
      padding: 0 !important;
      gap: 0 !important;
    }
    
    article.yofi-three-zone-header > header .yofi-entry-action-zone > .yofi-fakemon-header-actions {
      display: contents !important;
    }
    article.yofi-three-zone-header > header .yofi-entry-action-zone > :is(.dismiss, .yofi-fakemon-header-actions) {
      margin: 0 !important;
    }
    article.yofi-three-zone-header > header .yofi-entry-action-zone > .dismiss {
      display: inline-grid !important;
      grid-column: 4 !important;
      grid-row: 1;
      place-items: center !important;
      justify-self: center !important;
      width: clamp(18px, 1.6em, 28px) !important;
      min-width: 0 !important;
      height: 1.9em !important;
      flex: none !important;
      padding: 0 !important;
    }
    article.yofi-three-zone-header > header .yofi-entry-action-zone .yofi-fakemon-action-icon {
      grid-column: var(--yofi-action-slot, auto) !important;
      grid-row: 1;
      justify-self: center;
      width: clamp(19px, 1.75em, 30px) !important;
      min-width: 0 !important;
      max-width: 100% !important;
      margin: 0 !important;
    }
    /* Native dismiss anchor remains functional on ALL entry cards; replace
       only the double-down glyph with an X, not the Svelte-owned link. */
    .page > main article > header a.dismiss:not(.yofi-find-cancel) {
      position: relative !important;
      transform: none !important;
      color: inherit !important;
    }
    .page > main article > header a.dismiss:not(.yofi-find-cancel) > svg {
      display: none !important;
    }
    .page > main article:not(.yofi-three-zone-header) > header a.dismiss:not(.yofi-find-cancel) {
      margin-inline-start: auto !important;
    }
    .page > main article > header a.dismiss:not(.yofi-find-cancel)::before,
    .page > main article > header a.dismiss:not(.yofi-find-cancel)::after {
      content: "";
      position: absolute;
      left: 50%;
      top: 50%;
      width: 1.05em;
      height: 2px;
      border-radius: 2px;
      background: currentColor;
      transform-origin: center;
      pointer-events: none;
    }
    .page > main article > header a.dismiss:not(.yofi-find-cancel)::before {
      transform: translate(-50%, -50%) rotate(45deg);
    }
    .page > main article > header a.dismiss:not(.yofi-find-cancel)::after {
      transform: translate(-50%, -50%) rotate(-45deg);
    }

    article.yofi-three-zone-header > header > #additional-types-expansion {
      grid-column: 1 / -1 !important;
      grid-row: 2 !important;
    }
    article.yofi-fixed-chevron-header.yofi-three-zone-header > header > .title.yofi-title-nav-host {
      grid-template-columns: var(--yofi-chevron-slot-size, 1.45rem) minmax(0, 1fr) var(--yofi-chevron-slot-size, 1.45rem) !important;
      width: 100% !important;
      column-gap: 0 !important;
    }
    
    article.yofi-entry-compact.yofi-three-zone-header > header.yofi-centered-titlebar {
        padding-inline: .42em !important;
        column-gap: 3px !important;
      }
      article.yofi-entry-compact.yofi-three-zone-header > header > .type-tag {
        margin: 0 !important;
      }
      article.yofi-entry-compact.yofi-three-zone-header > header .yofi-entry-action-zone .yofi-fakemon-action-icon {
        width: clamp(18px, 1.6em, 26px) !important;
      }

    /* v0.8.2: one native navigation list, one native Menu button.
       The original UL/LI/A elements remain Svelte-owned. No mobile copies,
       display:contents, intrinsic grids, measured offsets or proxy Menu. */
    nav.yofi-site-navigation {
      display: flex !important;
      flex-flow: row wrap !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 0 !important;
      min-width: 0 !important;
    }
    nav.yofi-site-navigation > .site-title {
      flex: 0 0 auto !important;
      margin: 0 !important;
      white-space: nowrap;
    }
    nav.yofi-site-navigation > .site-title > a {
      pointer-events: none !important;
      cursor: default !important;
      text-decoration: none !important;
    }
    nav.yofi-site-navigation > .nav-bar {
      --yofi-nav-gap: 6px;
      display: flex !important;
      flex: 0 0 auto !important;
      flex-flow: row nowrap !important;
      align-items: center !important;
      justify-content: flex-start !important;
      width: auto !important;
      min-width: 0 !important;
      max-width: 100% !important;
      gap: var(--yofi-nav-gap) !important;
      margin-inline: auto 0 !important;
      padding: .375em 10px .375em 14px !important;
      font-size: inherit !important;
      position: relative !important;
      isolation: isolate;
      box-sizing: border-box;
    }
    /* The native skewed background must be BEHIND every control, including
       Rules. Previously Rules occupied a gap but was painted underneath it. */
    nav.yofi-site-navigation > .nav-bar::before {
      z-index: -1 !important;
      pointer-events: none !important;
    }
    nav.yofi-site-navigation > .nav-bar > .nav-list {
      display: flex !important;
      flex: 0 1 auto !important;
      flex-flow: row wrap !important;
      align-items: center !important;
      justify-content: flex-start !important;
      gap: var(--yofi-nav-gap) !important;
      width: auto !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      list-style: none !important;
      position: relative;
      z-index: 1;
    }
    nav.yofi-site-navigation > .nav-bar > .nav-list > li {
      display: flex !important;
      flex: 0 0 auto !important;
      align-items: center !important;
      width: auto !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      list-style: none !important;
    }
    nav.yofi-site-navigation > .nav-bar .yofi-nav-control,
    nav.yofi-site-navigation > .nav-bar > .menu-button {
      box-sizing: border-box !important;
      display: inline-flex !important;
      flex: 0 0 auto !important;
      flex-flow: row nowrap !important;
      align-items: center !important;
      justify-content: flex-start !important;
      gap: .22em !important;
      width: auto !important;
      min-width: 0 !important;
      max-width: none !important;
      min-height: 1.75em;
      margin: 0 !important;
      padding: 2px 3px !important;
      border: 0;
      background: transparent;
      color: var(--skin-bg-text, #fff);
      font: inherit !important;
      line-height: 1.2 !important;
      text-decoration: none !important;
      white-space: nowrap !important;
      cursor: pointer;
      touch-action: manipulation;
      position: relative;
      z-index: 1;
    }
    /* An icon is NOT a caption. Keep its 1em box, including the native Menu
       icon. The old '* { width:fit-content }' made that box 300px wide. */
    nav.yofi-site-navigation > .nav-bar .yofi-nav-control > .icon,
    nav.yofi-site-navigation > .nav-bar > .menu-button > .icon {
      box-sizing: border-box !important;
      display: inline-flex !important;
      flex: 0 0 1em !important;
      align-items: center !important;
      justify-content: center !important;
      width: 1em !important;
      height: 1em !important;
      min-width: 1em !important;
      max-width: 1em !important;
      margin: 0 !important;
      padding: 0 !important;
      position: static !important;
      transform: none !important;
      line-height: 1 !important;
    }
    nav.yofi-site-navigation > .nav-bar .yofi-nav-control > .icon > svg,
    nav.yofi-site-navigation > .nav-bar > .menu-button > .icon > svg {
      display: block !important;
      flex: 0 0 100%;
      width: 100% !important;
      height: 100% !important;
      margin: 0 !important;
    }
    nav.yofi-site-navigation .yofi-nav-caption,
    nav.yofi-site-navigation > .nav-bar > .menu-button > span:not(.icon) {
      flex: 0 0 auto;
      margin: 0 !important;
      padding: 0 !important;
    }
    nav.yofi-site-navigation > .nav-bar > .nav-list > li[hidden],
    nav.yofi-site-navigation > .nav-bar .yofi-nav-control[hidden] {
      display: none !important;
    }
    /* Search takes NO visible space when absent. Optional links retain a
       virtual width allowance in the JS fit budget so none jump into it. */
    nav.yofi-site-navigation .yofi-top-search.yofi-search-idle {
      pointer-events: none !important;
    }
    nav.yofi-site-navigation .yofi-nav-control:hover,
    nav.yofi-site-navigation > .nav-bar > .menu-button:hover {
      color: var(--red-light, #ffd1dc);
    }
    nav.yofi-site-navigation .yofi-nav-control:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
    /* Site controls use BROWSER width, never the entry panel tier. */
    html:is(.yofi-browser-compact, .yofi-browser-intermediate) nav.yofi-site-navigation > .site-title {
      padding-inline: 1em .5em !important;
    }
    html:is(.yofi-browser-compact, .yofi-browser-intermediate) nav.yofi-site-navigation > .nav-bar > .menu-button > .lg\\:hide {
      display: inline !important;
    }
    html:is(.yofi-browser-compact, .yofi-browser-intermediate) nav.yofi-site-navigation > .nav-bar > .menu-button > .lg\\:show {
      display: none !important;
    }
    html.yofi-browser-wide nav.yofi-site-navigation > .nav-bar > .menu-button > .lg\\:hide {
      display: none !important;
    }
    html.yofi-browser-wide nav.yofi-site-navigation > .nav-bar > .menu-button > .lg\\:show {
      display: inline !important;
    }
    /* All progressive links share the same single-line native nav scale.
       The two fixed groups never shrink to admit optional destinations. */
    nav.yofi-site-navigation > .nav-bar > .nav-list { flex-wrap: nowrap !important; }
    nav.yofi-site-navigation > .nav-bar > .nav-list > li.yofi-nav-measure {
      position: absolute !important;
      visibility: hidden !important;
      pointer-events: none !important;
      left: -10000px !important;
      top: 0 !important;
      width: max-content !important;
    }
    /* v0.8.9: one native mobile nav scale on EVERY category. Fakemon no
       longer changes font size, title padding or inter-control spacing. */
    html:is(.yofi-browser-compact, .yofi-browser-intermediate) nav.yofi-site-navigation > .nav-bar > .menu-button > span:not(.icon) {
        display: none !important;
      }
      html:is(.yofi-browser-compact, .yofi-browser-intermediate) nav.yofi-site-navigation > .nav-bar > .menu-button {
        justify-content: center !important;
        min-width: 1.85em !important;
        min-height: 1.85em !important;
      }
      html:is(.yofi-browser-compact, .yofi-browser-intermediate) nav.yofi-site-navigation > .nav-bar > .nav-list {
        flex-wrap: nowrap !important;
      }
    @media (max-width: 430px) {
      nav.yofi-site-navigation .yofi-top-search .yofi-nav-caption { display: none !important; }
      nav.yofi-site-navigation[data-yofi-search-visible="true"] .yofi-top-add .yofi-nav-caption {
        display: none !important;
      }
    }

    /* v0.9.0: sparkle overlays the actual art viewport, including on Fakemon
       with attribution captions. Four discrete, touch-draggable corners. */
    article .square-image.yofi-portrait-control-host > figure,
    article .square-image.yofi-portrait-control-host {
      position: relative !important;
    }
    article .square-image.yofi-portrait-control-host > figure > .yofi-portrait-sparkle,
    article .square-image.yofi-portrait-control-host > .yofi-portrait-sparkle {
      position: absolute !important;
      z-index: 51;
      box-sizing: border-box;
      width: 1.9em;
      height: 1.9em;
      /* SVG fills the existing touch target; no inward icon padding. */
      margin: 0;
      color: rgba(128,128,128,.62);
      background: transparent;
      border: none;
      border-radius: 0;
      box-shadow: none;
      cursor: grab;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
      transition: left .14s ease, right .14s ease, top .14s ease, bottom .14s ease;
    }
    article .square-image.yofi-portrait-control-host .yofi-portrait-sparkle.yofi-portrait-shiny-active,
    article .square-image.yofi-portrait-control-host .yofi-portrait-sparkle.yofi-portrait-shiny-active:active {
      color: #111 !important;
    }
    article .square-image.yofi-portrait-control-host .yofi-portrait-sparkle[data-yofi-corner="tr"] {
      top: 0; right: 0; bottom: auto; left: auto;
    }
    article .square-image.yofi-portrait-control-host .yofi-portrait-sparkle[data-yofi-corner="tl"] {
      top: 0; left: 0; bottom: auto; right: auto;
    }
    article .square-image.yofi-portrait-control-host .yofi-portrait-sparkle[data-yofi-corner="br"] {
      bottom: 0; right: 0; top: auto; left: auto;
    }
    article .square-image.yofi-portrait-control-host .yofi-portrait-sparkle[data-yofi-corner="bl"] {
      bottom: 0; left: 0; top: auto; right: auto;
    }
    article .square-image.yofi-portrait-control-host .yofi-portrait-sparkle[data-yofi-dragging] {
      cursor: grabbing;
      transition: none !important;
    }

    /* Pokemon: match name typography, place #0000 between type and X. */
    article.yofi-three-zone-header > header.yofi-centered-titlebar { position: relative !important; }
    article.yofi-three-zone-header > header > .yofi-entry-action-zone > .yofi-header-dex-id {
      position: absolute !important;
      left: var(--yofi-dex-center, 82%);
      top: 50%;
      transform: translate(-50%, -50%);
      display: block;
      margin: 0;
      padding: 0;
      min-width: 0;
      max-width: 100%;
      color: inherit;
      font: inherit;
      font-size: var(--font-sz-neptune, 1em);
      font-weight: 700;
      line-height: 1.1;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
      cursor: text;
      -webkit-user-select: text;
      user-select: text;
    }
    /* Keep the existing chevron/name row centered. The Fakemon watermark is
       absolutely positioned below the name, without creating a second grid
       row or moving the name/chevrons on EITHER species type. */
    article.yofi-three-zone-header > header > .title.yofi-fakemon-id-host {
      position: relative !important;
      overflow: visible !important;
    }
    article.yofi-fixed-chevron-header > header > .title.yofi-title-nav-host {
      grid-template-rows: 1fr !important;
      position: relative !important;
    }
    article.yofi-fixed-chevron-header > header > .title > .yofi-fakemon-title-text {
      grid-column: 2 !important;
      grid-row: 1 !important;
      align-self: center !important;
    }
    article.yofi-three-zone-header > header > .title.yofi-fakemon-id-host > .yofi-header-fakemon-id {
      position: absolute !important;
      left: 50%;
      right: auto;
      transform: translateX(-50%);
      width: max-content;
      max-width: 100%;
      bottom: -1.3em;
      z-index: 2;
      display: block;
      box-sizing: border-box;
      min-height: 18px;
      padding: 2px 0;
      margin: 0;
      color: rgba(128,128,128,.62);
      font-size: .52em;
      line-height: 1.15;
      font-weight: 400;
      letter-spacing: .01em;
      white-space: nowrap;
      text-align: center;
      cursor: text;
      -webkit-user-select: text !important;
      user-select: text !important;
      -webkit-touch-callout: default;
      touch-action: manipulation;
    }
    article.yofi-fixed-chevron-header > header > .title > :is(.yofi-result-nav, .yofi-result-nav-placeholder) {
      grid-row: 1 !important;
      align-self: center;
    }

    /* All species with trailing female/male characters share the same
       native-sized SVG icon in card titles, list rows, and inline links. */
    .yofi-species-sex-symbol {
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
    }

    /* SVG geometry matches the native 50/50 gender-bar icons. Preserve an
       accessible character without displaying the thinner fallback glyph. */
    .yofi-sex-character {
      position: absolute !important;
      overflow: hidden !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      clip-path: inset(50%) !important;
      white-space: nowrap !important;
    }
    .yofi-species-sex-symbol > .yofi-sex-svg,
    .yofi-gender-all-symbol > .yofi-sex-svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
    }

    /* v0.10.6: three-zone species header. Only type and the name/nav group
       exchange positions. The action group still owns the right third, with
       Edit, Key, Remove, X in their original four fixed slots. */
    article.yofi-three-zone-header > header.yofi-centered-titlebar {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr) minmax(0, 1fr) !important;
    }
    article.yofi-three-zone-header > header.yofi-centered-titlebar > .type-tag {
      grid-column: 1 !important;
      grid-row: 1 !important;
      justify-self: center !important;
      margin: 0 !important;
      transform: translateX(calc((var(--yofi-fullscreen-hit) + var(--yofi-fullscreen-inset)) / 2)) !important;
      transform-origin: center center !important;
    }
    article.yofi-three-zone-header > header.yofi-centered-titlebar > .title {
      grid-column: 2 !important;
      justify-self: stretch !important;
      text-align: center !important;
    }
    article.yofi-three-zone-header > header.yofi-centered-titlebar > .yofi-entry-action-zone {
      grid-column: 3 !important;
    }
    /* Fullscreen control uses the first track already reserved for the type.
       No extra header column: title/chevrons and the four right-hand action
       slots keep their existing widths, even at the subcompact breakpoint.
       The inset brings the button to the description's 1em content edge. */
    article.yofi-fullscreen-entry > header {
      --yofi-fullscreen-hit: 1.7rem;
      --yofi-fullscreen-inset: 0rem;
    }
    article.yofi-entry-compact.yofi-fullscreen-entry > header {
      --yofi-fullscreen-inset: .58rem;
    }
    article.yofi-entry-subcompact.yofi-fullscreen-entry > header {
      --yofi-fullscreen-hit: 1.3rem;
    }
    article.yofi-fullscreen-entry:is(.yofi-three-zone-header, .yofi-universal-header)
      > header > .yofi-fullscreen-toggle {
      grid-column: 1 !important;
      grid-row: 1 !important;
      justify-self: start !important;
      align-self: center !important;
    }
    article.yofi-fullscreen-entry > header > .yofi-fullscreen-toggle {
      display: inline-grid;
      place-items: center;
      position: relative;
      z-index: 5;
      flex: 0 0 auto;
      box-sizing: border-box;
      width: var(--yofi-fullscreen-hit);
      height: 1.9em;
      min-width: 0;
      padding: 0;
      margin: 0 0 0 var(--yofi-fullscreen-inset);
      border: 0;
      border-radius: .35em;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 1rem;
      line-height: 1;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    article.yofi-fullscreen-entry > header > .yofi-fullscreen-toggle > svg {
      display: block;
      width: 1.04em;
      height: 1.04em;
      pointer-events: none;
    }
    article.yofi-fullscreen-entry > header > .yofi-fullscreen-toggle:hover,
    article.yofi-fullscreen-entry > header > .yofi-fullscreen-toggle:active {
      background: rgba(255,255,255,.16);
    }
    article.yofi-fullscreen-entry > header > .yofi-fullscreen-toggle:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 1px;
    }
    article.yofi-fullscreen-entry.yofi-universal-header
      > header > .type-tag {
      grid-column: 1 !important;
      grid-row: 1 !important;
      justify-self: center !important;
      margin: 0 !important;
      transform: translateX(calc((var(--yofi-fullscreen-hit) + var(--yofi-fullscreen-inset)) / 2)) !important;
      transform-origin: center center !important;
    }
    /* Rules has a native edition selector rather than a type pill. It stays
       in the same left track, positioned after the fullscreen button. */
    article.yofi-fullscreen-entry.yofi-rules-header
      > header > #rules-version-fieldset {
      justify-self: end !important;
      margin-inline-start: var(--yofi-fullscreen-hit) !important;
    }

    /* Pokémon's dex number stays in the RIGHT group instead of falling
       between the relocated type pill and the centered species name. */
    article.yofi-three-zone-header > header > .yofi-entry-action-zone > .yofi-header-dex-id {
      left: var(--yofi-dex-center, 80%) !important;
    }

    /* Shared centering for non-species card headers. Controls stay as their
       native Svelte elements: type left on moves/TMs; edition fieldset
       (including help ?) left on Rules; dismiss X right. */
    article.yofi-universal-header > header {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr) minmax(0, 1fr) !important;
      align-items: center !important;
      justify-content: stretch !important;
      column-gap: .25em !important;
    }
    article.yofi-universal-header > header > .title {
      grid-column: 2 !important;
      grid-row: 1 !important;
      flex: none !important;
      min-width: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      text-align: center !important;
      justify-self: center !important;
    }
    article.yofi-universal-header > header > .title:not(.yofi-title-nav-host) {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    article.yofi-universal-header > header > .title.yofi-title-nav-host {
      display: grid !important;
      grid-template-columns: 1.35em minmax(0, 1fr) 1.35em !important;
      align-items: center !important;
      column-gap: 0 !important;
    }
    article.yofi-universal-header > header > .title.yofi-title-nav-host > .yofi-result-nav.yofi-prev,
    article.yofi-universal-header > header > .title.yofi-title-nav-host > .yofi-result-nav-placeholder.yofi-prev {
      grid-column: 1; grid-row: 1;
    }
    article.yofi-universal-header > header > .title.yofi-title-nav-host > .yofi-result-nav.yofi-next,
    article.yofi-universal-header > header > .title.yofi-title-nav-host > .yofi-result-nav-placeholder.yofi-next {
      grid-column: 3; grid-row: 1;
    }
    article.yofi-universal-header > header > .title.yofi-title-nav-host > .yofi-universal-title-text {
      grid-column: 2; grid-row: 1;
      text-align: center; min-width: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    article.yofi-universal-header > header > #rules-version-fieldset,
    article.yofi-universal-header:not(.yofi-fullscreen-entry) > header > .type-tag {
      grid-column: 1 !important;
      grid-row: 1 !important;
      justify-self: start !important;
      min-width: 0;
      margin: 0 !important;
    }
    article.yofi-universal-header > header > a.dismiss:not(.yofi-find-cancel) {
      grid-column: 3 !important;
      grid-row: 1 !important;
      justify-self: end !important;
      margin-inline: 0 !important;
    }
    article.yofi-universal-header > header > #additional-types-expansion {
      grid-column: 1 / -1 !important;
      grid-row: 2 !important;
    }
    article.yofi-universal-header.yofi-rules-header > header > #rules-version-fieldset {
      display: inline-flex !important;
      align-items: center !important;
      white-space: nowrap;
      font-size: .85em;
    }

    /* Moves / TMs / Items: the title is genuinely panel-centered. A larger
       central track at small panel sizes pushes the chevrons outward, but
       symmetric side tracks reserve room for the type pill and fullscreen
       button. Never truncate a title: clamp the font, then wrap as needed. */
    article.yofi-wide-title-header.yofi-universal-header > header {
      grid-template-columns:
        minmax(0, 1fr)
        minmax(0, min(58%, calc(100% - 8.4rem), 30rem))
        minmax(0, 1fr) !important;
    }
    article.yofi-wide-title-header.yofi-universal-header > header > .title {
      position: relative !important;
      font-size: clamp(1rem, calc(.85rem + var(--yofi-title-card-unit, 5px)), 1.36rem) !important;
      line-height: 1.14 !important;
      overflow: visible !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      text-overflow: clip !important;
      min-width: 0 !important;
    }
    article.yofi-wide-title-header.yofi-universal-header > header > .title.yofi-title-nav-host {
      grid-template-columns: minmax(1.1rem, 1.5rem) minmax(0, 1fr) minmax(1.1rem, 1.5rem) !important;
      gap: 0 !important;
    }
    article.yofi-wide-title-header.yofi-universal-header > header > .title > .yofi-universal-title-text {
      min-width: 0 !important;
      text-align: center !important;
      white-space: normal !important;
      overflow: visible !important;
      text-overflow: clip !important;
      overflow-wrap: anywhere !important;
      hyphens: auto;
    }
    article.yofi-wide-title-header.yofi-universal-header > header > .title .yofi-result-nav,
    article.yofi-wide-title-header.yofi-universal-header > header > .title .yofi-result-nav-placeholder {
      width: 100% !important;
      min-width: 0 !important;
      height: 1.65rem !important;
      font-size: 1rem !important;
      margin: 0 !important;
    }
    /* The native dismiss icon's SVG is hidden and its visible X consists of
       absolutely positioned strokes. In a grid, those strokes have no
       intrinsic size: give the Svelte-owned anchor a REAL tap target.
       Keep its original href and click/navigation behavior. */
    article.yofi-wide-title-header.yofi-universal-header > header > a.dismiss:not(.yofi-find-cancel) {
      display: inline-grid !important;
      place-items: center !important;
      inline-size: 1.9em !important;
      block-size: 1.9em !important;
      min-inline-size: 1.9em !important;
      justify-self: end !important;
      align-self: center !important;
      cursor: pointer;
      z-index: 2;
      touch-action: manipulation;
    }
    /* TM identification belongs beside the dismiss X, as for Pokemon.
       The native Svelte TM number and name remain intact in hidden text. */
    article.yofi-wide-title-header .yofi-tm-native-title { display: none !important; }
    article.yofi-wide-title-header .yofi-tm-title-label { display: block; }
    article.yofi-tm-title-card.yofi-universal-header > header {
      position: relative !important;
    }
    article.yofi-tm-title-card > header > .yofi-tm-header-id {
      position: absolute !important;
      left: var(--yofi-tm-id-center, 85%) !important;
      top: 50% !important;
      transform: translate(-50%, -50%) !important;
      max-width: var(--yofi-tm-id-space, 14%);
      min-width: 0;
      margin: 0;
      padding: 0;
      color: inherit;
      font: inherit;
      font-weight: 700;
      font-size: min(clamp(.8rem, calc(.83rem + var(--yofi-title-card-unit, 5px)), 1.2rem), var(--yofi-tm-id-fit, 1.2rem)) !important;
      pointer-events: none;
      line-height: 1.1;
      white-space: nowrap;
      text-align: center;
      font-variant-numeric: tabular-nums;
      cursor: text;
      -webkit-user-select: text;
      user-select: text;
    }

    /* The Add, Edit and Find forms use the same native card header. Give the
       title the FULL panel width for its centering reference instead of
       confining it to a narrow middle track. Keep native cancel/save links
       in the independent right slot. No carousel navigation on forms. */
    article.yofi-fakemon-form-header > header {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) !important;
      align-items: center !important;
      column-gap: 0 !important;
    }
    /* Form headers also own a fullscreen toggle. Assign its track
       explicitly so grid auto-placement cannot create a second row.
       The title remains centered across the ENTIRE card. */
    article.yofi-fakemon-form-header.yofi-fullscreen-entry
      > header > .yofi-fullscreen-toggle {
      grid-column: 1 !important;
      grid-row: 1 !important;
      justify-self: start !important;
      align-self: center !important;
    }
    article.yofi-fakemon-form-header > header > .title {
      grid-column: 1 / -1 !important;
      grid-row: 1 !important;
      justify-self: center !important;
      text-align: center !important;
      flex: none !important;
      width: max-content !important;
      max-width: calc(100% - 8rem) !important;
      min-width: 0 !important;
      margin: 0 !important;
      white-space: nowrap !important;
      overflow-wrap: normal !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      line-height: 1.15 !important;
      font-size: clamp(.875rem, calc(-.5rem + 6.9 * var(--yofi-title-card-unit, 4px)), 1.375rem) !important;
    }
    article.yofi-fakemon-form-header.yofi-fakemon-find-header > header > .title {
      max-width: calc(100% - 4.5rem) !important;
    }
    article.yofi-fakemon-form-header > header > :is(.yofi-fakemon-header-actions, .yofi-entry-action-zone, .dismiss) {
      grid-column: 3 !important;
      grid-row: 1 !important;
      justify-self: end !important;
      align-self: center !important;
      margin: 0 !important;
      position: relative !important;
      z-index: 2;
    }

    /* Preserve the site's type pill padding, color, radius, skew and size.
       Hide the *native text node* in a clipped span without deleting it:
       Svelte retains that original node and can update it on navigation. */
    article > header > .type-tag.yofi-header-icon-pill .yofi-type-original {
      position: absolute !important;
      display: block !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      border: 0 !important;
      overflow: hidden !important;
      white-space: nowrap !important;
      clip: rect(0, 0, 0, 0) !important;
      clip-path: inset(50%) !important;
    }
    article > header > .type-tag.yofi-header-icon-pill svg.yofi-type-glyph {
      display: inline-block !important;
      vertical-align: middle !important;
      width: 1.2rem !important;
      height: 1.2rem !important;
      fill: currentColor !important;
      overflow: visible;
      pointer-events: none;
    }
    article > header > .type-tag.yofi-header-icon-pill svg.yofi-type-glyph :is(path, circle) {
      fill: currentColor !important;
      fill-rule: evenodd;
    }

    /* v0.10.7: the type badge is content-sized. On compact headers the
       header itself uses a .42em inset; the description begins at 1em.
       Move only the pill by the difference, keeping all other slots intact. */
    article.yofi-entry-compact.yofi-universal-header:not(.yofi-fullscreen-entry)
      > header > .type-tag {
      margin-inline-start: .58em !important;
    }
    article > header > .type-tag.yofi-header-icon-pill svg.yofi-type-glyph {
      width: 1.44rem !important; /* 20% larger than the previous 1.2rem */
      height: 1.44rem !important;
    }
    /* A single type gets a round, snug pill; dual types retain the site's
       original split pill/angled separator and existing padding behavior. */
    article > header > .type-tag.yofi-header-icon-single {
      display: inline-flex !important;
      width: 2.15rem !important;
      height: 2.15rem !important;
      border-radius: 50% !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
      flex: 0 0 auto;
    }
    article > header > .type-tag.yofi-header-icon-single > .type {
      display: flex !important;
      width: 100% !important;
      height: 100% !important;
      padding: 0 !important;
      border-radius: 50% !important;
      margin: 0 !important;
      box-sizing: border-box !important;
      align-items: center !important;
      justify-content: center !important;
    }

    /* Dual types must match the explicit height of the single-type circle.
       Stretch the two original native skewed segments without changing their
       widths, separator, colors or horizontal overlap. */
    article > header > .type-tag.yofi-header-icon-pill:not(.yofi-header-icon-single) {
      border-radius: 999px !important;
      overflow: hidden !important;
      display: inline-flex !important;
      align-items: stretch !important;
      height: 2.15rem !important;
      min-height: 2.15rem !important;
      box-sizing: border-box !important;
      flex: 0 0 auto;
    }
    article > header > .type-tag.yofi-header-icon-pill:not(.yofi-header-icon-single) > .type {
      display: inline-flex !important;
      box-sizing: border-box !important;
      align-items: center !important;
      justify-content: center !important;
      height: 100% !important;
      min-height: 0 !important;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
      padding-left: .38em !important;
      padding-right: .38em !important;
      line-height: 1 !important;
    }
    article > header > .type-tag.yofi-header-icon-pill:not(.yofi-header-icon-single) > .type.left {
      margin-left: -.40em !important;
      padding-left: .78em !important;
    }
    article > header > .type-tag.yofi-header-icon-pill:not(.yofi-header-icon-single) > .type.right {
      margin-right: -.40em !important;
      padding-right: .78em !important;
    }
  
    /* v0.10.12: the 325px split-pane is its own card-width density tier.
       Widen the chevron/name track without moving the right-side controls. */
    article.yofi-entry-subcompact.yofi-three-zone-header > header.yofi-centered-titlebar {
      grid-template-columns: minmax(0, .82fr) minmax(0, 1.26fr) minmax(0, .92fr) !important;
    }
    article.yofi-entry-subcompact > header > .type-tag.yofi-header-icon-pill svg.yofi-type-glyph {
      width: 1.2rem !important;
      height: 1.2rem !important;
    }
    article.yofi-entry-subcompact > header > .type-tag.yofi-header-icon-single {
      width: 1.85rem !important;
      height: 1.85rem !important;
    }
    article.yofi-entry-subcompact > header > .type-tag.yofi-header-icon-pill:not(.yofi-header-icon-single) {
      height: 1.85rem !important;
      min-height: 1.85rem !important;
    }
    article.yofi-entry-subcompact.yofi-three-zone-header > header .yofi-header-dex-id {
      font-size: .85em !important;
    }
    article.yofi-entry-subcompact.yofi-three-zone-header > header .yofi-header-fakemon-id {
      font-size: .48em !important;
    }

`;

  // v0.13.2: restore direct activation of the site-owned navigation link.
  // Use a legitimate HEAD child; appending a STYLE directly to <html> at
  // document-start could throw before <html> exists, or get reparsed away.
  document.head.appendChild(style);

  /* v0.6.8: stable mobile viewport. Never inject a meta element directly into
   * <html> at document-start; it can coexist with Svelte's real <head> meta
   * after parsing, leaving competing viewport directives after a reload.
   * Do not attempt programmatic scale hacks or alter the document font size.
   */
  function installZoomGuard() {
    let syncing = false;
    function syncViewport() {
      const head = document.head;
      if (!head || syncing) return;
      syncing = true;
      try {
        const existing = Array.from(document.querySelectorAll('meta[name="viewport"]'));
        const primary = existing.find((node) => node.parentElement === head)
          || existing[0] || document.createElement("meta");
        if (primary.getAttribute("name") !== "viewport") primary.setAttribute("name", "viewport");
        if (primary.parentElement !== head) head.appendChild(primary);
        // Keep special application settings such as viewport-fit, but use only
        // one authoritative copy of scale and viewport width parameters.
        const keep = (primary.content || "").split(",")
          .map((part) => part.trim())
          .filter((part) => part && !/^(?:width|initial-scale|minimum-scale|maximum-scale|user-scalable)\s*=/i.test(part));
        const value = ["width=device-width", "initial-scale=1", "minimum-scale=1",
          "maximum-scale=1", "user-scalable=no", ...keep].join(", ");
        if (primary.content !== value) primary.content = value;
        for (const meta of existing) if (meta !== primary) meta.remove();
      } finally {
        syncing = false;
      }
    }
    if (document.head) syncViewport();
    document.addEventListener("DOMContentLoaded", syncViewport, { once: true });
    window.addEventListener("pageshow", syncViewport);
    window.addEventListener("orientationchange", syncViewport, { passive: true });
    // Native iOS gesture events may ignore viewport maximum-scale, especially
    // on iPad. This only blocks website pinch, not OS accessibility magnifier.
    for (const name of ["gesturestart", "gesturechange", "gestureend"]) {
      document.addEventListener(name, (event) => event.preventDefault(), { passive: false });
    }
    document.addEventListener("dblclick", (event) => {
      if (event.target instanceof Element && event.target.closest("input, textarea, select")) return;
      event.preventDefault();
    }, { passive: false });
    // Reconcile a late head rewrite without observing the entire changing app.
    const beginObservation = () => {
      if (!document.head) return;
      const watcher = new MutationObserver((changes) => {
        if (changes.some((change) => change.type === "childList" ||
          (change.type === "attributes" && change.target.getAttribute("name") === "viewport"))) {
          syncViewport();
        }
      });
      watcher.observe(document.head, { childList: true, subtree: true,
        attributes: true, attributeFilter: ["content", "name"] });
      syncViewport();
    };
    if (document.head) beginObservation();
    else document.addEventListener("DOMContentLoaded", beginObservation, { once: true });
  }
  installZoomGuard();

  function setCollapsed(value) {
    collapsed = Boolean(value);
    document.documentElement.classList.toggle(GLOBAL_COLLAPSED_CLASS, collapsed);
    if (collapsed) rememberFullscreenView();
    else clearFullscreenView();
  }

  function openFakemonUtilityFullscreen(destination) {
    // Apply before native Svelte navigation so the list never flashes.
    setCollapsed(true);
    rememberCollapsedDestination(destination);
    rememberFullscreenView(destination);
    queueInstall();
  }

  function nativeSelectionLabel(node) {
    if (!node) return '';
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let text = '';
    while (walker.nextNode()) {
      const current = walker.currentNode;
      if (!current.parentElement?.closest('svg,button,.yofi-header-id,.yofi-result-nav-placeholder'))
        text += current.nodeValue;
    }
    return text.replace(/\s+/g,' ').trim();
  }

  function pendingListCardMatches(article) {
    const pending = pendingListSelection;
    if (!pending || !article?.isConnected || !article.querySelector('section.stats') ||
        normalizeUrl(location.href) !== pending.url) return false;
    if (pending.context.kind === 'fakemon') {
      const metadata = article.querySelector('section.info > div:first-child > dl');
      const id = [...(metadata?.children || [])].find(node => node.tagName === 'DD')
        ?.textContent?.trim().replace(/^F\./i,'');
      return id === pending.context.id;
    }
    const title = article.querySelector(':scope > header > .title, :scope > header > h1');
    return nativeSelectionLabel(title) === pending.label;
  }

  function preparePendingListCard(article) {
    if (!pendingListCardMatches(article)) return false;
    if (pendingListSelection.article === article) return true;
    pendingListSelection.article = article;
    // Final card width first; retain the original list until presentation ends.
    document.documentElement.classList.add('yofi-list-selection-pending');
    article.setAttribute('data-yofi-fullscreen-handoff',pendingListSelection.url);
    setCollapsed(true);
    return true;
  }

  function completePendingListCard(article) {
    if (!pendingListCardMatches(article) || pendingListSelection.article !== article) return;
    pendingListSelection.article.removeAttribute('data-yofi-fullscreen-handoff');
    pendingListSelection = null;
    document.documentElement.classList.remove('yofi-list-selection-pending');
    pendingSelectionExpiresAt = 0;
    clearCollapsedDestination();
    queueInstall();
  }
  document.addEventListener('yofi:species-card-presentation-ready',event => {
    completePendingListCard(event.detail?.article);
  });

  function consumeCollapsedDestinationIfHere() {
    if (pendingListSelection || !pendingCollapseMatchesCurrentUrl()) return;
    setCollapsed(true);
    pendingSelectionExpiresAt = 0;
    clearCollapsedDestination();
  }

  function pathSegments() {
    return location.pathname.split("/").filter(Boolean);
  }

  function currentRoot() {
    const segments = pathSegments();
    const known = [
      "pokemon", "moves", "fakemon", "items", "tms",
      "rules", "trainers", "resources", "settings", "backups",
      "encounter-tool", "beta-testing"
    ];
    // The site prefixes translated routes with /es/, /fr/, etc. Never
    // mistake the locale for the section (particularly Settings).
    const localized = /^[a-z]{2}(?:-[a-z]{2})?$/i.test(segments[0] || "")
      ? segments.slice(1) : segments;
    return segments.find((segment) => known.includes(segment))
      ?? localized[0]
      ?? "";
  }

  function excludedHere() {
    return EXCLUDED_ROOTS.has(currentRoot());
  }

  function isVisibleCandidate(anchor) {
    if (!(anchor instanceof HTMLAnchorElement)) return false;
    if (anchor.closest("[hidden]")) return false;

    const url = new URL(anchor.href, location.href);
    return url.origin === location.origin;
  }

  // List rows can number in the thousands. Opening Search changes panel
  // geometry, not the list data. Preserve the parsed anchors across those
  // layout passes, and invalidate only when the native list itself changes.
  const sideListScans = new WeakMap();
  function sideListScan(side) {
    let state = sideListScans.get(side);
    if (state) return state;
    state = { anchors: null, urlToIndex: new Map(), dirty: true,
      generation: 0, sexNameGeneration: -1 };
    // The anchor index changes only when native links enter/leave or change
    // their target/visibility. Our sex-symbol decoration and text changes
    // must NOT cause a full thousand-row reparse on every frame.
    const containsLinks = (node) => node instanceof Element &&
      (node.matches('a[href]') || !!node.querySelector('a[href]'));
    state.observer = new MutationObserver((changes) => {
      let changed = false;
      let attributeChanged = false;
      for (const mutation of changes) {
        if (mutation.type === 'childList') {
          if (Array.from(mutation.addedNodes).some(containsLinks) ||
              Array.from(mutation.removedNodes).some(containsLinks)) changed = true;
        } else if (mutation.type === 'attributes') {
          const el = mutation.target;
          if (el instanceof Element && (el.matches('a[href]') ||
              (mutation.attributeName === 'hidden' &&
                (el.matches('tr, li, tbody') || !!el.querySelector('a[href]'))))) {
            changed = true;
            attributeChanged = true;
          }
        } else if (mutation.type === 'characterData') {
          const label = mutation.target.parentElement?.closest('td.primary > a, td.primary > button');
          if (label) decorateSpeciesSexName(label);
        }
      }
      if (changed) {
        state.dirty = true;
        if (attributeChanged) queueInstall();
      }
    });
    state.observer.observe(side, { childList: true, characterData: true,
      subtree: true, attributes: true, attributeFilter: ["href", "hidden"] });
    sideListScans.set(side, state);
    return state;
  }

  const normalizedAnchorKeys = new WeakMap();
  function normalizedAnchorKey(anchor) {
    const href = anchor.href;
    const stored = normalizedAnchorKeys.get(anchor);
    if (stored?.href === href) return stored.key;
    const key = normalizeUrl(href);
    normalizedAnchorKeys.set(anchor, { href, key });
    return key;
  }

  function getCandidateAnchors(page) {
    const side = page.querySelector(":scope > .side");
    if (!(side instanceof HTMLElement)) return [];
    const scan = sideListScan(side);
    if (!scan.dirty && scan.anchors) return scan.anchors;

    const selectors = [
      "tbody a[href]",
      ".lists-container a[href]",
      ".trainer-list a[href]",
      "reorder-list a[href]",
      "li a[href]",
      "reorder-item a[href]"
    ].join(",");

    const anchors = Array.from(side.querySelectorAll(selectors))
      .filter(isVisibleCandidate);
    // Fakemon sorting uses visual CSS order (Svelte keeps its DOM nodes).
    // Make result-chevron and swipe navigation follow that same order.
    if (currentRoot() === 'fakemon' && fakemonTableSort.key) {
      anchors.sort((a, b) => {
        const aOrder = Number(a.closest('tbody tr')?.style.order ?? 0);
        const bOrder = Number(b.closest('tbody tr')?.style.order ?? 0);
        return aOrder - bOrder;
      });
    }

    const seen = new Set();

    const result = [];
    const urlToIndex = new Map();
    for (const anchor of anchors) {
      const key = normalizedAnchorKey(anchor);
      if (seen.has(key)) continue;
      seen.add(key);
      urlToIndex.set(key, result.length);
      result.push(anchor);
    }
    scan.anchors = result;
    scan.urlToIndex = urlToIndex;
    scan.dirty = false;
    scan.generation++;
    return scan.anchors;
  }

  function isSpeciesRoot() {
    const root = currentRoot();
    return root === "pokemon" || root === "fakemon";
  }

  function syncSpeciesRouteClass() {
    const species = isSpeciesRoot();

    document.documentElement.classList.toggle(
      "yofi-species-page",
      species
    );

    if (!species) {
      document.documentElement.classList.remove("yofi-species-full-desktop");
      document.documentElement.classList.remove("yofi-species-inline-skills");
    }
  }

  // Header IDs and navigation stay in QOL; species content lives in Species Card.
  function syncSpeciesHeaderId(article) {
    if (!isSpeciesRoot() || !(article instanceof HTMLElement)) return;
    const header = article.querySelector(':scope > header');
    const dl = article.querySelector('section.info > div:first-child > dl');
    const idSource = dl && Array.from(dl.children).find(el => el.tagName === 'DD');
    const rawId = idSource?.textContent?.replace(/\s+/g,' ').trim();
    if (!header || !rawId) return;
    const fakemon = currentRoot() === 'fakemon';
    const target = fakemon ? header.querySelector(':scope > .title')
      : header.querySelector(':scope > .yofi-entry-action-zone');
    if (!(target instanceof HTMLElement)) return;
    let identity = header.querySelector('.yofi-header-fakemon-id, .yofi-header-dex-id');
    if (!identity) {
      identity = document.createElement('span');
      identity.className = 'yofi-header-id';
      identity.addEventListener('click', e => e.stopPropagation());
      identity.addEventListener('pointerdown', e => e.stopPropagation());
    }
    const numeric = rawId.replace(/^#/, '');
    const value = fakemon ? (rawId.startsWith('F.') ? rawId : 'F.' + rawId)
      : (/^\d+$/.test(numeric) ? '#' + numeric.padStart(4, '0')
        : (rawId.startsWith('#') ? rawId : '#' + rawId));
    if (identity.textContent !== value) identity.textContent = value;
    identity.title = fakemon ? 'Fakemon ID' : 'Dex number';
    identity.classList.toggle('yofi-header-fakemon-id', fakemon);
    identity.classList.toggle('yofi-header-dex-id', !fakemon);
    if (fakemon) target.classList.add('yofi-fakemon-id-host');
    if (identity.parentElement !== target) target.appendChild(identity);
  }

  /* Browse/navigation changes are read-only. All action links remain native. */
  const BROWSE_ROOTS = new Set(["pokemon", "fakemon", "moves", "items", "tms", "rules", "trainers"]);
  let navUI = null;
  let openPokedex = null;
  let observedDetailCard = null;
  let observedDetailWidth = -1;
  const detailWidthObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (Math.abs(width - observedDetailWidth) > .5) {
        observedDetailWidth = width;
        queueInstall();
      }
    }) : null;

  function categoryIndexKey(url) {
    if (url.origin !== location.origin || url.searchParams.has("action")) return null;
    const segments = url.pathname.split("/").filter(Boolean);
    const root = segments.find((segment) => BROWSE_ROOTS.has(segment));
    if (!root || segments.indexOf(root) !== segments.length - 1) return null;
    if (url.searchParams.has("id") || url.searchParams.has("pokemon")) return null;
    return url.pathname.replace(/\/$/, "") || "/";
  }

  function categoryOfLink(anchor) {
    try {
      const url = new URL(anchor.href, location.href);
      return categoryIndexKey(url) ? url.pathname.split("/").filter(Boolean).pop() : null;
    } catch (_) { return null; }
  }

  function searchableCategory(_page) {
    // These sections have searchable side lists. Do not inspect the sidebar
    // to decide button visibility: Svelte may unmount or delay its content
    // during client-side navigation, including while the list is collapsed.
    return BROWSE_ROOTS.has(currentRoot());
  }

  function svgIcon(kind) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = kind === "new" ? '<path d="M12 4v16M4 12h16"/>'
      : kind === "search" ? '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>'
      : '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M3 12h6m6 0h6"/>';
    return svg;
  }

  function nativeNavIcon(anchor) {
    const icon = anchor?.querySelector("svg");
    if (!icon) return svgIcon("dex");
    const clone = icon.cloneNode(true);
    clone.removeAttribute("id");
    clone.removeAttribute("style");
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("title,desc").forEach((node) => node.remove());
    return clone;
  }

  function closePokedex(returnFocus = false) {
    if (!openPokedex) return;
    const { menu, trigger } = openPokedex;
    openPokedex = null;
    menu.remove();
    trigger.setAttribute("aria-expanded", "false");
    if (returnFocus && trigger.isConnected) trigger.focus({ preventScroll: true });
  }

  function showPokedex(trigger, ui) {
    if (openPokedex?.trigger === trigger) { closePokedex(); return; }
    closePokedex();
    const menu = document.createElement("div");
    menu.className = "yofi-pokedex-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Pok\u00e9dex categories");
    for (const [source, label] of [[ui.pokemon, "Pok\u00e9mon"], [ui.fakemon, "Fak\u00e9mon"]]) {
      if (!source?.href) continue;
      const option = document.createElement("a");
      option.className = "yofi-pokedex-option";
      option.href = source.href;
      option.setAttribute("role", "menuitem");
      const text = document.createElement("span");
      text.textContent = label;
      option.append(nativeNavIcon(source), text);
      option.addEventListener("click", (event) => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); event.stopPropagation();
        closePokedex();
        if (source.isConnected) source.click();
        else location.assign(source.href); // Retain access if Svelte replaces dialog.
      });
      menu.appendChild(option);
    }
    const modal = trigger.closest("dialog[open]");
    (modal || document.body).appendChild(menu);
    const rect = trigger.getBoundingClientRect();
    const box = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - box.width - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(rect.bottom + 6, innerHeight - box.height - 8))}px`;
    openPokedex = { menu, trigger };
    trigger.setAttribute("aria-expanded", "true");
    menu.querySelector("a")?.focus({ preventScroll: true });
  }

  let openQuickMenu = null;
  function closeQuickMenu(returnFocus = false) {
    if (!openQuickMenu) return;
    const { menu, trigger } = openQuickMenu;
    openQuickMenu = null;
    menu.remove();
    trigger?.setAttribute("aria-expanded", "false");
    if (returnFocus && trigger?.isConnected) trigger.focus({ preventScroll: true });
  }

  function showQuickMenu(trigger, name, options) {
    if (openQuickMenu?.trigger === trigger) { closeQuickMenu(true); return; }
    closeQuickMenu();
    closePokedex();
    const menu = document.createElement("div");
    menu.className = "yofi-pokedex-menu yofi-quick-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", name);
    for (const { href, label, icon, fullscreen = false, action } of options) {
      if (!href && typeof action !== "function") continue;
      const a = document.createElement(typeof action === "function" ? "button" : "a");
      if (href) a.href = href;
      else a.type = "button";
      a.className = "yofi-pokedex-option";
      a.setAttribute("role", "menuitem");
      if (icon instanceof SVGElement) a.appendChild(icon.cloneNode(true));
      const text = document.createElement("span");
      text.textContent = label;
      a.appendChild(text);
      a.addEventListener("click", (event) => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        if (typeof action === "function") { event.preventDefault(); action(); }
        else if (fullscreen) openFakemonUtilityFullscreen(href);
        closeQuickMenu();
      });
      menu.appendChild(a);
    }
    if (!menu.children.length) return;
    document.body.appendChild(menu);
    const rect = trigger.getBoundingClientRect();
    const box = menu.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.right - box.width, innerWidth - box.width - 8));
    const top = rect.bottom + box.height + 8 <= innerHeight
      ? rect.bottom + 6
      : Math.max(8, rect.top - box.height - 6);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    trigger.setAttribute("aria-expanded", "true");
    openQuickMenu = { menu, trigger };
  }

  /* The dialog uses canonical category links, while the responsive top bar
   * can use a native link, a mirrored link, or the two-category Pokédex picker.
   * Compare logical destinations instead of exact URLs or CSS client rects.
   */
  function navigationGroup(raw) {
    try {
      const url = new URL(raw, location.href);
      if (url.origin !== location.origin) return null;
      const segments = url.pathname.split("/").filter(Boolean);
      const categories = new Set(["pokemon", "fakemon", "moves", "tms", "items",
        "trainers", "rules", "resources", "encounter-tool", "encounters", "backups", "settings"]);
      return segments.find((segment) => categories.has(segment)) || segments[0] || "/";
    } catch (_) { return null; }
  }

  /* Never filter away a route merely because JS *intends* to show it.
     This checks the final rendered control, including hidden ancestors,
     CSS and the viewport. Off-screen / missing controls are not usable. */
  function visibleTopNavControl(element) {
    if (!(element instanceof HTMLElement) || !element.isConnected ||
        element.closest('[hidden], [inert]')) return false;
    for (let el = element; el && el !== document.body; el = el.parentElement) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' ||
          style.visibility === 'collapse' || Number(style.opacity) === 0) return false;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1 && rect.left >= -1 &&
      rect.right <= document.documentElement.clientWidth + 1;
  }

  function visibleSiteNavigationGroups() {
    const present = new Set();
    const root = currentRoot();
    if (root) present.add(root);
    if (!navUI?.list) return present;
    for (const li of navUI.list.children) {
      const control = li.querySelector(':scope > a, :scope > button');
      if (!visibleTopNavControl(control)) continue;
      if (control === navUI.dex) {
        present.add('pokemon'); present.add('fakemon');
      } else if (control instanceof HTMLAnchorElement) {
        const url = new URL(control.href, location.href);
        if (!url.searchParams.has('action')) {
          const group = navigationGroup(control.href);
          if (group) present.add(group);
        }
      }
    }
    return present;
  }

  // The site's Svelte navigation dialog may be unmounted or replaced during
  // client-side navigation. Its original element reference then stops being a
  // reliable source of menu items. Keep an independent, read-only snapshot of
  // canonical destinations from the last *connected* navigation dialog.
  function snapshotSiteMenuLinks(dialog) {
    if (!(dialog instanceof HTMLElement)) return [];
    return Array.from(dialog.querySelectorAll("li > a[href]"))
      .filter((anchor) => anchor instanceof HTMLAnchorElement)
      .map((anchor) => ({
        href: anchor.href,
        label: anchor.querySelector(".bubble-title")?.textContent?.trim() ||
          anchor.textContent.trim(),
        icon: nativeNavIcon(anchor),
      }));
  }

  function siteMenuInventory() {
    if (!navUI) return [];
    // Prefer the current site's actual dialog, never a detached old dialog.
    const liveDialog = Array.from(document.querySelectorAll("dialog")).find((dialog) =>
      Array.from(dialog.querySelectorAll("a[href]")).some((anchor) =>
        navigationGroup(anchor.href) === "fakemon"));
    // Avoid cloning every SVG on each MutationObserver pass; inspect the
    // lightweight href/text signature, and only refresh on genuine changes.
    const links = Array.from(liveDialog?.querySelectorAll("li > a[href]") || []);
    if (links.length >= 3) {
      navUI.dialog = liveDialog;
      const signature = links.map((a) => `${a.href}|${a.textContent.trim()}`).join("\u001f");
      if (signature !== navUI.siteMenuSignature &&
          links.length >= (navUI.siteMenuSnapshot?.length || 0)) {
        navUI.siteMenuSnapshot = snapshotSiteMenuLinks(liveDialog);
        navUI.siteMenuSignature = signature;
      }
    }
    // The original desktop nav list remains usable even when the dialog is
    // being rebuilt. Merge it with our snapshot rather than showing no Menu.
    const sources = navUI.siteMenuSnapshot?.length
      ? [...navUI.siteMenuSnapshot] : snapshotSiteMenuLinks(navUI.dialog);
    const known = new Set(sources.map((item) => navigationGroup(item.href) || item.href));
    // The mobile Rules item may be detached from the top bar. Keep its
    // original destination in Menu even while the native dialog is rebuilding.
    const nativeLinks = Array.from(navUI.list?.querySelectorAll(
      ":scope > li:not([data-yofi-created]) > a[href]") || []);
    const rulesLink = navUI.rulesSlot?.item.querySelector(':scope > a[href]');
    if (rulesLink && !nativeLinks.includes(rulesLink)) nativeLinks.push(rulesLink);
    for (const anchor of nativeLinks) {
      const key = navigationGroup(anchor.href) || anchor.href;
      if (known.has(key)) continue;
      known.add(key);
      sources.push({
        href: anchor.href,
        label: nativeNavCaption(anchor)?.textContent.trim() || anchor.textContent.trim(),
        icon: nativeNavIcon(anchor),
      });
    }
    if (!known.has("fakemon") && navUI.fakemon?.href) {
      sources.push({ href: navUI.fakemon.href, label: "Fakémon",
        icon: nativeNavIcon(navUI.fakemon) });
    }
    return sources;
  }

  // Keep the native site's ordering, moving Encounters directly after
  // Trainers. Use the same order for both the progressive bar and the Menu.
  function prioritizedSiteMenuInventory() {
    const inventory = siteMenuInventory();
    const encounters = inventory.filter((item) =>
      ["encounter-tool", "encounters"].includes(navigationGroup(item.href)));
    if (!encounters.length) return inventory;
    const others = inventory.filter((item) =>
      !["encounter-tool", "encounters"].includes(navigationGroup(item.href)));
    const trainerIndex = others.findIndex((item) => navigationGroup(item.href) === "trainers");
    const resourceIndex = others.findIndex((item) => navigationGroup(item.href) === "resources");
    const insertAt = trainerIndex >= 0 ? trainerIndex + 1
      : resourceIndex >= 0 ? resourceIndex : others.length;
    others.splice(insertAt, 0, ...encounters);
    return others;
  }

  function siteMenuOptions() {
    const present = visibleSiteNavigationGroups();
    const seen = new Set();
    return prioritizedSiteMenuInventory().filter((item) => {
      const key = navigationGroup(item.href) || item.href;
      if (present.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // QOL supplies the baseline Light/Dark menu action. The optional Theme
  // Overlay replaces this option's state, icon, and cycle with Type/Light/Dark.
  function qolThemeIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    if (nativeDayNightMode() === 'night') {
      svg.setAttribute('fill', 'currentColor');
      svg.setAttribute('stroke', 'none');
      svg.innerHTML = '<path d="M18.8 18.3A9.5 9.5 0 1 1 18.8 5.7a7 7 0 1 0 0 12.6Z"/>';
    } else {
      svg.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>';
    }
    return svg;
  }
  function qolThemeMenuOption() {
    const extension = window.__yofiQolThemeExtension;
    const extended = extension?.quickMenuOption?.();
    if (extended && typeof extended.action === 'function') return extended;
    return {
      label: `${localized('theme')}: ${localized(nativeDayNightMode())}`,
      icon: qolThemeIcon(),
      action: () => setNativeDayNightMode(nativeDayNightMode() === 'day' ? 'night' : 'day')
    };
  }
  function syncNativeThemeMenu() {
    // Native Pokédex-style dialog is Svelte-owned; QOL adds exactly one LI,
    // cloned from the Settings LI. It is not owned by the Theme Overlay.
    const dialog = liveNavDialog();
    const anchor = Array.from(dialog?.querySelectorAll('li > a[href]') || [])
      .find(a => navigationGroup(a.href) === 'settings');
    const settingsItem = anchor?.closest('li');
    const list = settingsItem?.parentElement;
    if (!settingsItem || !list) return;
    let item = list.querySelector(':scope > li.yofi-native-theme-item');
    if (!item || item.dataset.yofiQolOwned !== 'true') {
      // If an older overlay inserted an item first, recreate it: its click
      // listener was permanently bound to the overlay closure.
      item?.remove();
      item = settingsItem.cloneNode(true);
      item.classList.remove('active');
      item.classList.add('yofi-native-theme-item');
      item.dataset.yofiQolOwned = 'true';
      const original = item.querySelector(':scope > a');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = original?.className || 'center-column uppercase-link';
      if (original) button.append(...Array.from(original.childNodes));
      original?.replaceWith(button);
      button.addEventListener('click', () => {
        const {action} = qolThemeMenuOption();
        action();
        syncNativeThemeMenu();
      });
    }
    if (item.nextElementSibling !== settingsItem) list.insertBefore(item, settingsItem);
    const button = item.querySelector('button');
    const bubble = button?.querySelector('.bubble');
    const title = button?.querySelector('.bubble-title');
    if (!button || !bubble) return;
    const nativeBubble = settingsItem.querySelector('.bubble');
    const diameter = nativeBubble?.getBoundingClientRect().width || 0;
    if (diameter > 0) bubble.style.setProperty('--yofi-native-theme-diameter', `${diameter}px`);
    const choice = qolThemeMenuOption();
    const mode = window.__yofiQolThemeExtension?.mode?.() || nativeDayNightMode();
    if (bubble.dataset.yofiTheme !== mode) {
      bubble.replaceChildren(choice.icon);
      bubble.dataset.yofiTheme = mode;
    }
    if (title && title.textContent !== choice.label) title.textContent = choice.label;
    button.setAttribute('aria-label', choice.label);
  }
  function showSiteMenu(trigger) {
    const options = siteMenuOptions();
    const option = qolThemeMenuOption();
    const insertAt = options.findIndex(item => navigationGroup(item.href) === 'settings');
    options.splice(insertAt < 0 ? options.length : insertAt, 0, option);
    showQuickMenu(trigger, 'Site navigation', options);
  }

  // The native Menu button must never be hidden based on filtered contents.
  // Filtering remains in showSiteMenu() when the original button is clicked.

  function makePokedexTrigger(source, ui) {
    const trigger = cloneNativeNavControl(source, 'Pok\u00e9dex', true);
    trigger.classList.add('yofi-pokedex-trigger');
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', (event) => {
      event.preventDefault(); event.stopPropagation(); showPokedex(trigger, ui);
    });
    return trigger;
  }

  function installSidebarAddById(page) {
    if (currentRoot() !== "fakemon") return;
    const side = page?.querySelector(":scope > .side");
    if (!(side instanceof HTMLElement)) return;
    // Hide the complete ListHeading block, not only the flex action row.
    // Keep the links in the DOM for native navigation source lookup.
    for (const anchor of side.querySelectorAll('a[href*="action=add"]')) {
      let url;
      try { url = new URL(anchor.href, location.href); }
      catch (_) { continue; }
      if (url.searchParams.get("action") !== "add" || !url.pathname.includes("fakemon")) continue;
      const heading = anchor.closest(".flex-column.space-bottom") ||
        anchor.closest(".flex-row.space-between")?.parentElement ||
        anchor.closest(".side-top")?.previousElementSibling;
      if (heading instanceof HTMLElement) {
        heading.classList.add("yofi-fakemon-native-heading-hidden");
      }
    }
    // Do not remove native anchors: New and By ID continue to resolve from them.
  }

  function newFakemonSource(page) {
    const side = page?.querySelector(":scope > .side");
    return Array.from(side?.querySelectorAll('a[href*="action=add"]') || []).find((anchor) => {
      const url = new URL(anchor.href, location.href);
      return url.origin === location.origin && url.pathname.split("/").includes("fakemon")
        && url.searchParams.get("action") === "add";
    });
  }

  function destinationForFindFakemon(fakemonSource) {
    const url = new URL(destinationForNewFakemon(fakemonSource));
    url.searchParams.set("action", "find");
    return url.href;
  }

  function destinationForNewFakemon(fakemonSource) {
    const url = new URL(fakemonSource?.href || location.href, location.href);
    const segments = url.pathname.split("/").filter(Boolean);
    const index = segments.indexOf("fakemon");
    if (index >= 0) {
      url.pathname = "/" + segments.slice(0, index + 1).join("/");
    } else {
      url.pathname = "/fakemon";
    }
    url.search = "";
    url.searchParams.set("action", "add");
    url.hash = "";
    return url.href;
  }

  // Keep the native Pokemon and Rules links in their original LI elements.
  // Fakemon is a deep clone of that Pokemon link, with its URL/name and
  // native Fakemon SVG substituted. Menu is never cloned, moved or hidden.
  function nativeNavCaption(control) {
    return control?.querySelector(':scope > span:not(.icon)');
  }

  function markNavControl(control) {
    if (!control) return;
    control.classList.add('yofi-nav-control');
    const caption = nativeNavCaption(control);
    if (caption) {
      caption.classList.add('yofi-nav-caption');
      if (!control.getAttribute('aria-label')) {
        control.setAttribute('aria-label', caption.textContent.trim());
      }
    }
  }

  function cloneNativeNavControl(template, label, button = false) {
    const clone = template.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    let control = clone;
    if (button) {
      control = document.createElement('button');
      // Retain the native scoped classes and children, not a recreated icon.
      control.className = clone.className;
      control.type = 'button';
      control.append(...Array.from(clone.childNodes));
    }
    const caption = nativeNavCaption(control);
    if (caption) caption.textContent = label;
    control.setAttribute('aria-label', label);
    control.title = label;
    markNavControl(control);
    return control;
  }

  function liveNavDialog() {
    return Array.from(document.querySelectorAll('dialog')).find((el) =>
      Array.from(el.querySelectorAll('a[href]')).some((a) =>
        categoryOfLink(a) === 'fakemon')) || null;
  }

  function sameHiddenState(element, hidden) {
    if (element && element.hidden !== hidden) element.hidden = hidden;
  }

  // v0.8.5: reuse the actual Rules LI, but mount it in the top bar only
  // when it belongs there. A detached node has no width, hidden element,
  // tab stop or accessibility-tree entry in the bar. Its menu source remains.
  function syncRulesNavigationSlot(ui, inTopBar) {
    const current = Array.from(ui.list.querySelectorAll(
      ':scope > li:not([data-yofi-created])')).find((li) =>
        categoryOfLink(li.querySelector(':scope > a[href]')) === 'rules');
    let slot = ui.rulesSlot;
    if (current && slot?.item !== current) {
      slot?.marker?.remove();
      slot = ui.rulesSlot = { item: current, marker: null };
    }
    if (!slot) return;
    // Do not resurrect a stale native item after Svelte replaces the list.
    if (slot.item.parentNode !== ui.list && slot.marker?.parentNode !== ui.list) {
      ui.rulesSlot = null;
      return;
    }
    if (inTopBar) {
      if (slot.item.parentNode !== ui.list) {
        ui.list.replaceChild(slot.item, slot.marker);
        slot.marker = null;
      }
    } else {
      sameHiddenState(slot.item, false);
      if (slot.item.parentNode === ui.list) {
        // A comment preserves DOM order without creating a layout slot.
        slot.marker = document.createComment('yofi: native Rules return position');
        ui.list.replaceChild(slot.marker, slot.item);
      }
    }
  }

  /* One owner for the navigation LI visibility. The rest of the app sets
   * only the fixed left controls and the native Rules slot. Native links are
   * reused in place for Moves/TMs/Items/Trainers; a mirrored link is made
   * ONLY if a destination does not exist in the site's own top nav.
   * The native Menu button, Add behavior and Pokédex picker are untouched.
   */
  const NAV_PROGRESSIVE_ORDER = Object.freeze([
    "moves", "tms", "items", "trainers", "encounters"
  ]);

  function progressiveControl(ui, group, source) {
    if (!ui.progressive) ui.progressive = new Map();
    let entry = ui.progressive.get(group);
    if (!entry) {
      const li = document.createElement('li');
      li.dataset.yofiCreated = 'priority-' + group;
      li.hidden = true;
      const link = cloneNativeNavControl(ui.pokemon, source.label || group);
      li.appendChild(link);
      ui.list.appendChild(li);
      ui.created.push(li);
      ui.progressive.set(group, entry = { li, link, signature: '', iconSource: '' });
    }
    const signature = `${source.href}|${source.label}`;
    if (entry.signature !== signature) {
      entry.link.href = source.href;
      const caption = nativeNavCaption(entry.link);
      if (caption) caption.textContent = source.label || group;
      entry.link.setAttribute('aria-label', source.label || group);
      entry.link.title = source.label || group;
      entry.signature = signature;
      ui.progressiveLayoutKey = null;
    }
    // Do not clone SVGs on every page mutation.
    if (source.icon instanceof SVGElement && !entry.iconSource) {
      entry.link.querySelector(':scope > .icon')?.replaceChildren(source.icon.cloneNode(true));
      entry.iconSource = 'ready';
    }
    return entry.li;
  }

  function measureNavLi(ui, li) {
    const control = li?.querySelector(':scope > a, :scope > button');
    if (!(control instanceof HTMLElement)) return 0;
    if (!ui.navMeasure) {
      const probe = document.createElement('li');
      probe.dataset.yofiCreated = 'measure';
      probe.className = 'yofi-nav-measure';
      probe.setAttribute('aria-hidden', 'true');
      ui.list.appendChild(probe);
      ui.navMeasure = probe;
    }
    // The probe is absolute-positioned, does not take up bar space and uses
    // the exact same CSS as its live counterpart (including small captions).
    ui.navMeasure.className = 'yofi-nav-measure ' + li.className;
    ui.navMeasure.replaceChildren(control.cloneNode(true));
    return ui.navMeasure.getBoundingClientRect().width;
  }

  function arrangeNavItems(ui, preferred) {
    const ordered = [...new Set(preferred)].filter((li) => li?.parentElement === ui.list);
    const remaining = Array.from(ui.list.children).filter((li) =>
      !ordered.includes(li) && li !== ui.navMeasure);
    ordered.push(...remaining);
    let next = ui.navMeasure || null;
    for (let i = ordered.length - 1; i >= 0; --i) {
      const li = ordered[i];
      if (li.nextElementSibling !== next) ui.list.insertBefore(li, next);
      next = li;
    }
  }

  function applyProgressiveNavigation(ui, page, root) {
    // Inventory is derived from the native links and the site's own menu;
    // nothing is invented for Encounters if it isn't in that inventory.
    const inventory = prioritizedSiteMenuInventory();
    const sources = new Map();
    for (const item of inventory) {
      const group = navigationGroup(item.href);
      const canonical = group === 'encounter-tool' ? 'encounters' : group;
      if (NAV_PROGRESSIVE_ORDER.includes(canonical) && !sources.has(canonical)) {
        sources.set(canonical, item);
      }
    }
    const native = new Map();
    for (const li of ui.list.querySelectorAll(':scope > li:not([data-yofi-created])')) {
      const anchor = li.querySelector(':scope > a[href]');
      const group = anchor && categoryOfLink(anchor);
      if (group) {
        native.set(group, li);
        markNavControl(anchor);
      }
    }
    const pokemon = ui.pokemon.closest('li');
    const rules = ui.rulesSlot?.item?.parentElement === ui.list ? ui.rulesSlot.item : null;
    const candidates = [];
    for (const group of NAV_PROGRESSIVE_ORDER) {
      const original = native.get(group)
        || (group === 'encounters' ? native.get('encounter-tool') : null);
      const source = sources.get(group);
      if (group === root || (group === 'encounters' && root === 'encounter-tool')) {
        if (original) sameHiddenState(original, true); // Active page is the site title.
        continue;
      }
      if (original || source) {
        candidates.push({ group, li: original || progressiveControl(ui, group, source) });
      }
    }
    // Search, Add, category switch, priority links, Rules. Menu is outside
    // this native UL and never moves or disappears.
    arrangeNavItems(ui, [ui.slots.search, ui.slots.add,
      ui.slots.fakemon, ui.slots.pokedex, pokemon,
      ...candidates.map(item => item.li), rules]);

    const navWidth = ui.nav.getBoundingClientRect().width;
    const titleWidth = ui.nav.querySelector(':scope > .site-title')?.getBoundingClientRect().width || 0;
    if (navWidth <= 0) return; // Retry when the header finishes mounting.
    const navCss = getComputedStyle(ui.bar);
    const listGap = parseFloat(getComputedStyle(ui.list).gap) || 6;
    const navGap = 6;
    const padding = (parseFloat(navCss.paddingLeft) || 0) + (parseFloat(navCss.paddingRight) || 0);
    const menuWidth = ui.bar.querySelector(':scope > .menu-button')?.getBoundingClientRect().width || 0;
    const menuGap = parseFloat(navCss.gap) || 6;
    const layoutKey = [root, window.innerWidth, navWidth.toFixed(1), titleWidth.toFixed(1),
      navCss.fontSize, menuWidth.toFixed(1), ui.siteMenuSignature || '',
      candidates.map(item => `${item.group}:${item.li.querySelector('a')?.href || ''}:${item.li.textContent}`).join(','),
      rules ? 'rules' : 'no-rules',
      ui.slots.add.hidden ? 'no-add' : 'add',
      ui.slots.search.hidden ? 'no-search' : 'search'].join('|');
    const sameNodes = ui.progressiveNodes?.length === candidates.length &&
      candidates.every((item, index) => ui.progressiveNodes[index] === item.li);
    if (ui.progressiveLayoutKey === layoutKey && sameNodes) return;

    // The hidden Search LI occupies no physical space. Reserve its WIDTH
    // only in this virtual fit calculation while the route supports Search:
    // the same optional links remain present before and after expansion.
    const fixed = [ui.slots.add, ui.slots.fakemon,
      ui.slots.pokedex, pokemon, rules].filter(li => li && !li.hidden);
    const reserveSearch = searchableCategory(page);
    let budget = navWidth - titleWidth - navGap - padding - menuWidth - menuGap - 3;
    for (const li of fixed) budget -= measureNavLi(ui, li);
    if (reserveSearch) budget -= measureNavLi(ui, ui.slots.search);
    const fixedCount = fixed.length + Number(reserveSearch);
    budget -= Math.max(0, fixedCount - 1) * listGap;
    let count = 0;
    let fit = true;
    for (const item of candidates) {
      // Encounters is the fifth and final addition, desktop only.
      const allowed = item.group !== 'encounters' || browserTier() === 'wide';
      const required = measureNavLi(ui, item.li) + (fixedCount + count ? listGap : 0);
      const visible = fit && allowed && budget >= required;
      sameHiddenState(item.li, !visible);
      if (visible) {
        budget -= required;
        count++;
      } else fit = false; // Lower priorities may never leapfrog a missing slot.
    }
    for (const [group, entry] of ui.progressive || []) {
      if (!candidates.some(item => item.group === group && item.li === entry.li)) {
        sameHiddenState(entry.li, true);
      }
    }
    ui.nav.dataset.yofiProgressiveCount = String(count);
    ui.progressiveLayoutKey = layoutKey;
  }

  function installBrowseNavigation(page) {
    const nav = document.querySelector('nav[aria-label="Site"]');
    const bar = nav?.querySelector(':scope > .nav-bar');
    const list = bar?.querySelector(':scope > .nav-list');
    if (!nav || !bar || !list) return;
    const nativePokemon = Array.from(list.querySelectorAll(':scope > li:not([data-yofi-created]) > a[href]'))
      .find((a) => categoryOfLink(a) === 'pokemon');
    if (!nativePokemon) return; // The original Menu remains available meanwhile.

    const rebuild = !navUI || navUI.nav !== nav || navUI.list !== list ||
      navUI.pokemon !== nativePokemon ||
      navUI.created.some((li) => !li.isConnected || li.parentElement !== list);
    if (rebuild) {
      closePokedex();
      closeQuickMenu();
      // Preserve a temporarily detached Rules LI if only our injected
      // controls need rebuilding. A new native list gets its own Rules LI.
      const rulesSlot = navUI?.list === list ? navUI.rulesSlot : null;
      // Cleanup removes only our injected controls, never native controls.
      list.querySelectorAll(':scope > li[data-yofi-created]').forEach((li) => li.remove());
      const dialog = liveNavDialog();
      const fakemon = Array.from(dialog?.querySelectorAll('a[href]') || [])
        .find((a) => categoryOfLink(a) === 'fakemon');
      const fallback = new URL(nativePokemon.href);
      fallback.pathname = fallback.pathname.replace(/\/pokemon\/?$/, '/fakemon');
      const fallbackLink = document.createElement('a');
      fallbackLink.href = fallback.href;
      navUI = { nav, bar, list, pokemon: nativePokemon, fakemon: fakemon || fallbackLink,
        dialog, created: [], slots: {}, rulesSlot,
        siteMenuSnapshot: snapshotSiteMenuLinks(dialog) };
      const ui = navUI;
      const firstNativeItem = nativePokemon.closest('li');
      const addSlot = (key, control) => {
        const li = document.createElement('li');
        li.dataset.yofiCreated = key;
        li.hidden = true;
        li.appendChild(control);
        list.insertBefore(li, firstNativeItem);
        ui.created.push(li);
        ui.slots[key] = li;
        return control;
      };
      const action = (kind, label, asLink = false) => {
        const control = cloneNativeNavControl(nativePokemon, label, !asLink);
        if (asLink) control.removeAttribute('href');
        control.classList.add('yofi-top-' + kind);
        const icon = control.querySelector(':scope > .icon');
        if (icon) icon.replaceChildren(svgIcon(kind === 'by-id' ? 'search' : kind === 'add' ? 'new' : kind));
        return control;
      };
      ui.byId = action('by-id', 'By ID', true);
      ui.newButton = action('new', 'New', true);
      ui.mobileAdd = addSlot('add', action('add', 'Add'));
      ui.search = addSlot('search', action('search', 'Search'));
      ui.alternate = addSlot('fakemon', cloneNativeNavControl(nativePokemon, 'Fak\u00e9mon'));
      ui.alternate.classList.add('yofi-category-alternate');
      ui.dex = addSlot('pokedex', makePokedexTrigger(nativePokemon, ui));
      ui.mobileAdd.setAttribute('aria-haspopup', 'menu');
      ui.mobileAdd.setAttribute('aria-expanded', 'false');
      ui.mobileAdd.addEventListener('click', (event) => {
        event.preventDefault(); event.stopPropagation();
        const options = [
          { label: 'New', href: ui.newButton.href, icon: svgIcon('new'), fullscreen: true },
          ...(!allOldOfficialFakemonPresent
            ? [{ label: '‘Official’', icon: svgIcon('new'), action: showOfficialFakemonPanel }]
            : []),
          { label: 'By ID', href: ui.byId.href, icon: svgIcon('search'), fullscreen: true },
        ];
        showQuickMenu(ui.mobileAdd, 'Add Fak\u00e9mon', options);
      });
      for (const control of [ui.newButton, ui.byId]) {
        control.addEventListener('click', (event) => {
          if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          openFakemonUtilityFullscreen(control.href);
          const native = control === ui.newButton
            ? newFakemonSource(document.querySelector(PAGE_SELECTOR))
            : document.querySelector('.page > .side a[href*="action=find"]');
          if (native instanceof HTMLAnchorElement && native.isConnected) {
            event.preventDefault(); event.stopPropagation(); native.click();
          }
        });
      }
      ui.search.addEventListener('click', () => {
        setCollapsed(false);
        clearCollapsedDestination();
        queueInstall();
      });
      nav.classList.add('yofi-site-navigation');
      nav.dataset.yofiQolVersion = VERSION;
    }

    const ui = navUI;
    const nativeMenu = bar.querySelector(":scope > .menu-button");
    if (nativeMenu && nativeMenu.getAttribute("aria-label") !== "Menu") {
      nativeMenu.setAttribute("aria-label", "Menu");
    }
    const root = currentRoot();
    if (nav.dataset.yofiSection !== root) nav.dataset.yofiSection = root;
    const inFakemon = root === 'fakemon';
    const inPokemon = root === 'pokemon';
    const showDex = !inFakemon && !inPokemon;
    const showSearch = searchableCategory(page) && !definitelyListOnlyUrl() &&
      (collapsed || document.documentElement.classList.contains(GLOBAL_COLLAPSED_CLASS));

    // One stable left group at every width: Search, Add, category switch.
    // Desktop Fakemon utilities remain available through Add's native-style
    // menu instead of occupying two separate top-bar slots.
    sameHiddenState(ui.slots.add, !inFakemon);
    sameHiddenState(ui.slots.search, !showSearch);
    ui.search.classList.toggle('yofi-search-idle', !showSearch);
    ui.search.tabIndex = showSearch ? 0 : -1;
    ui.search.setAttribute('aria-hidden', String(!showSearch));
    sameHiddenState(ui.slots.fakemon, !inPokemon);
    sameHiddenState(ui.slots.pokedex, !showDex);
    const searchFlag = String(showSearch);
    if (nav.dataset.yofiSearchVisible !== searchFlag) nav.dataset.yofiSearchVisible = searchFlag;
    ui.search.title = 'Show search and entry list';
    ui.search.setAttribute('aria-expanded', String(!collapsed));
    const side = page?.querySelector(':scope > .side');
    if (side) {
      if (!side.id) side.id = 'yofi-entry-list';
      ui.search.setAttribute('aria-controls', side.id);
    }

    // Refresh a late/replaced native dialog without relying on it for the
    // visibility or width of any top-bar control.
    const dialog = liveNavDialog();
    if (dialog) {
      ui.dialog = dialog;
      const liveFakemon = Array.from(dialog.querySelectorAll('a[href]'))
        .find((a) => categoryOfLink(a) === 'fakemon');
      if (liveFakemon) ui.fakemon = liveFakemon;
    }
    const newHref = destinationForNewFakemon(ui.fakemon);
    const findHref = destinationForFindFakemon(ui.fakemon);
    if (ui.newButton.href !== newHref) ui.newButton.href = newHref;
    if (ui.byId.href !== findHref) ui.byId.href = findHref;
    if (ui.alternate.href !== ui.fakemon.href) ui.alternate.href = ui.fakemon.href;
    const fakemonSvg = ui.fakemon.querySelector('svg');
    if (fakemonSvg && ui.alternate.dataset.yofiIconSource !== fakemonSvg.outerHTML) {
      ui.alternate.querySelector(':scope > .icon')?.replaceChildren(nativeNavIcon(ui.fakemon));
      ui.alternate.dataset.yofiIconSource = fakemonSvg.outerHTML;
    }

    // Rules accompanies Search except on the Rules page and the Fakemon page.
    syncRulesNavigationSlot(ui, root !== 'rules' && root !== 'fakemon');

    // No blanket native-link hiding. Fixed links retain their established
    // appearance conditions; the single progressive pass owns middle items.
    const nativePokemonLi = ui.pokemon.closest('li');
    markNavControl(ui.pokemon);
    sameHiddenState(nativePokemonLi, !inFakemon);
    const pageTitles = { pokemon: 'Pok\u00e9mon', fakemon: 'Fak\u00e9mon', moves: 'Moves',
      tms: 'TMs', items: 'Items', trainers: 'Trainers', rules: 'Rules', resources: 'Resources',
      'encounter-tool': 'Encounters' };
    const title = nav.querySelector(':scope > .site-title > a');
    if (title) {
      const value = pageTitles[root] || (location.pathname === '/' ? 'Home' : root.replace(/-/g, ' '));
      if (title.textContent !== value) title.textContent = value;
      if (title.tabIndex !== -1) title.tabIndex = -1;
      if (title.getAttribute('aria-disabled') !== 'true') title.setAttribute('aria-disabled', 'true');
    }
    siteMenuInventory();
    applyProgressiveNavigation(ui, page, root);
    if (openPokedex && (!showDex || openPokedex.trigger !== ui.dex)) closePokedex();
  }

  /* "Find by ID" is a utility form, not a browse result. The site does not
   * supply a native Card dismiss there. Add the same X used elsewhere, only
   * while this form is mounted. Link to the canonical Fakémon list so normal
   * browser / Svelte navigation remains responsible for leaving the form.
   */
  function installFindByIdCancel(page) {
    if (currentRoot() !== "fakemon" ||
        new URL(location.href).searchParams.get("action") !== "find") {
      page?.querySelectorAll(".yofi-find-cancel").forEach((el) => el.remove());
      return;
    }
    const header = detailArticle(page)?.querySelector(":scope > header");
    if (!(header instanceof HTMLElement)) return;
    // If the app begins providing its own functional X, defer to the native UI.
    const nativeX = header.querySelector(":scope > .dismiss:not(.yofi-find-cancel)");
    if (nativeX) {
      header.querySelector(":scope > .yofi-find-cancel")?.remove();
      return;
    }
    if (header.querySelector(":scope > .yofi-find-cancel")) return;

    const cancel = document.createElement("a");
    cancel.className = "dismiss yofi-find-cancel";
    cancel.href = destinationForNewFakemon(navUI?.fakemon || null)
      .replace(/[?]action=add$/, "");
    cancel.title = "Cancel Find by ID";
    cancel.setAttribute("aria-label", "Cancel Find by ID");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = '<path d="M18 6 6 18M6 6l12 12"/>';
    cancel.appendChild(svg);
    cancel.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      // The form is read-only until confirmed, so no data is discarded.
      // Do not prevent default; SvelteKit may intercept this same-origin link.
      setCollapsed(false);
      clearFullscreenView();
      clearCollapsedDestination();
    });
    header.appendChild(cancel);
  }

  const nameMeasureCanvas = document.createElement("canvas");
  const nameMeasureContext = nameMeasureCanvas.getContext("2d");

  function syncSpeciesActionZone(header) {
    const article = header?.closest("article");
    if (!(article instanceof HTMLElement)) return;
    let zone = header.querySelector(":scope > .yofi-entry-action-zone");
    if (!zone) {
      zone = document.createElement("div");
      zone.className = "yofi-entry-action-zone";
    }
    const actions = header.querySelector(".yofi-fakemon-header-actions");
    const dismiss = header.querySelector(".dismiss");
    const nodes = [actions, dismiss].filter((node) => node && node.closest("article") === article);
    if (!nodes.length) {
      zone.remove();
      return;
    }
    if (zone.parentElement !== header) {
      header.insertBefore(zone, nodes[0].parentElement === header ? nodes[0] : null);
    }
    // The Pokemon Dex number also lives in this zone. Ignore it when
    // verifying the Svelte-owned action order, avoiding a mutation loop.
    const currentActions = Array.from(zone.children).filter((node) =>
      !node.classList.contains("yofi-header-dex-id"));
    if (nodes.some((node, index) => currentActions[index] !== node) ||
        currentActions.length !== nodes.length) {
      zone.append(...nodes);
    }
    // Four fixed positions, left to right. Every action keeps its identity's
    // slot even if another action disappears. The native dismiss/X is slot 4.
    // No auto-stretching or packing actions into new positions.
    const actionSlots = { "access-key": 2, edit: 1, remove: 3, cancel: 2, finish: 3 };
    const icons = actions ? Array.from(actions.querySelectorAll(":scope > .yofi-fakemon-action-icon")) : [];
    icons.slice(0, 3).forEach((icon, index) => {
      const slot = String(actionSlots[icon.dataset.yofiFakemonAction] || index + 1);
      if (icon.style.getPropertyValue("--yofi-action-slot") !== slot) {
        icon.style.setProperty("--yofi-action-slot", slot);
      }
    });
  }

  function centerPokemonDexId(header) {
    if (currentRoot() !== "pokemon") return;
    const zone = header?.querySelector(":scope > .yofi-entry-action-zone");
    const id = zone?.querySelector(":scope > .yofi-header-dex-id");
    if (!(zone instanceof HTMLElement) || !id) return;
    const head = header.getBoundingClientRect();
    const right = zone.getBoundingClientRect();
    if (!head.width || !right.width) return;
    // First three of the four original right-action slots are unused for
    // regular Pokemon; reserve their center for its existing #0000 label.
    const center = (right.left + right.width * .375 - head.left).toFixed(2) + "px";
    if (header.style.getPropertyValue("--yofi-dex-center") !== center) {
      header.style.setProperty("--yofi-dex-center", center);
    }
  }

  function installFixedSpeciesChevronSlots(header) {
    const article = header?.closest("article");
    const title = header?.querySelector(":scope > .title.yofi-title-nav-host");
    if (!(article instanceof HTMLElement) || !(title instanceof HTMLElement) ||
        !title.querySelector(":scope > .yofi-result-nav, :scope > .yofi-result-nav-placeholder")) {
      article?.classList.remove("yofi-fixed-chevron-header");
      return;
    }
    const width = Math.round(header.getBoundingClientRect().width);
    if (width <= 0) return;
    const mobile = article.classList.contains("yofi-entry-compact");
    // The left zone is one of three equal CSS tracks. Measure its actual
    // inline size (not a fixed 150px cap), leaving the badge and actions alone.
    article.classList.add("yofi-fixed-chevron-header");
    const track = Math.round(title.getBoundingClientRect().width);
    if (track <= 0) return;
    const name = title.querySelector(":scope > .yofi-fakemon-title-text");
    if (!(name instanceof HTMLElement)) return;
    const content = name.textContent?.trim() || "";
    const key = `${track}|${content}|${mobile}`;
    if (title.dataset.yofiAdaptiveKey === key) return;
    const computed = getComputedStyle(title);
    const base = parseFloat(getComputedStyle(header).fontSize) || parseFloat(computed.fontSize) || 16;
    const slot = Math.max(18, (parseFloat(getComputedStyle(header).fontSize) || 16) * 1.45);
    const room = Math.max(20, track - 2 * slot - 3);
    let fraction = 1;
    if (nameMeasureContext && content) {
      const style = getComputedStyle(name);
      nameMeasureContext.font = `${style.fontStyle} ${style.fontWeight} ${base}px ${style.fontFamily}`;
      const naturalWidth = nameMeasureContext.measureText(content).width;
      if (naturalWidth > 0) fraction = Math.max(.68, Math.min(1.08, room / (naturalWidth + 2)));
    }
    const font = `${(base * fraction).toFixed(2)}px`;
    if (header.style.getPropertyValue("--yofi-adaptive-name-size") !== font) {
      header.style.setProperty("--yofi-adaptive-name-size", font);
    }
    title.dataset.yofiAdaptiveKey = key;
  }

  function installSpeciesTitlebar(page) {
    if (!isSpeciesRoot()) return;
    const header = detailArticle(page)?.querySelector(":scope > header");
    if (!header?.querySelector(":scope > .type-tag")) return;
    header.parentElement.classList.add("yofi-species-titlebar");
    header.parentElement.classList.toggle("yofi-tight-titlebar", header.parentElement.classList.contains("yofi-entry-compact"));
    header.classList.add("yofi-centered-titlebar");
    header.parentElement.classList.add("yofi-three-zone-header");
    syncSpeciesActionZone(header);
    ensureFakemonTitleTextSpan(header);
    decorateSpeciesTitleName(header);
    watchFakemonTitleText(header);
    installFixedSpeciesChevronSlots(header);
    fitFakemonHeaderSpacing(header);
  }

  function startBrowseEvents() {
    // Block pointer- and keyboard-generated clicks before native handlers.
    // The page title is still a real anchor in Svelte's DOM, so CSS alone
    // would not suppress synthetic or keyboard navigation.
    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element) ||
          !event.target.closest('nav.yofi-site-navigation > .site-title > a')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    document.addEventListener("click", (event) => {
      const menuButton = event.target instanceof Element
        ? event.target.closest('nav.yofi-site-navigation .nav-bar button.menu-button') : null;
      if (!menuButton || nativeSiteMenu) return;
      // If our dynamic navigation is not ready (or all its sources vanish),
      // DO NOT intercept the site's original working Menu button.  Falling
      // through gives Svelte a chance to open its own navigation dialog.
      if (!navUI?.nav?.isConnected) return;
      let options;
      try { options = siteMenuOptions(); }
      catch (error) {
        console.warn("[Pokemon 5e QOL] Falling back to native Menu:", error);
        return;
      }
      if (!options.length) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      showSiteMenu(menuButton);
    }, true);
    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      if (openPokedex && !openPokedex.menu.contains(event.target) && !openPokedex.trigger.contains(event.target)) closePokedex();
      if (openQuickMenu && !openQuickMenu.menu.contains(event.target) && !openQuickMenu.trigger.contains(event.target)) closeQuickMenu();
      const anchor = event.target.closest("a[href]");
      if (!anchor || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      // Preserve the native dismiss/card actions and modified-link behavior.
      if (anchor.closest(".page > main")) return;
      const key = categoryIndexKey(new URL(anchor.href, location.href));
      if (key) {
        setCollapsed(false); clearCollapsedDestination(); queueInstall();
      }
    }, true);
    document.addEventListener("keydown", (event) => {
      if (openQuickMenu) {
        if (event.key === "Escape") { event.preventDefault(); closeQuickMenu(true); return; }
        const options = Array.from(openQuickMenu.menu.querySelectorAll("a,button"));
        const index = options.indexOf(document.activeElement);
        const next = event.key === "ArrowDown" ? (index + 1) % options.length
          : event.key === "ArrowUp" ? (index - 1 + options.length) % options.length : null;
        if (next !== null) { event.preventDefault(); options[next]?.focus(); return; }
      }
      if (!openPokedex) return;
      if (event.key === "Escape") { event.preventDefault(); closePokedex(true); return; }
      const options = Array.from(openPokedex.menu.querySelectorAll("a"));
      const index = options.indexOf(document.activeElement);
      let next;
      if (event.key === "ArrowDown") next = (index + 1) % options.length;
      else if (event.key === "ArrowUp") next = (index - 1 + options.length) % options.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = options.length - 1;
      if (next !== undefined) { event.preventDefault(); options[next]?.focus(); }
    });
    window.addEventListener("resize", () => { closePokedex(); closeQuickMenu(); }, { passive: true });
    window.addEventListener("popstate", () => {
      const landing = categoryIndexKey(new URL(location.href));
      if (landing && !fakemonUtilityPanelHere()) {
        setCollapsed(false); clearCollapsedDestination();
      }
      closePokedex();
      closeQuickMenu();
      queueInstall();
    });
  }

  function getDetailParts(page) {
    const main = page.querySelector(":scope > main");
    if (!(main instanceof HTMLElement)) return null;

    const header = main.querySelector("article > header");
    const title = header?.querySelector(".title");

    if (!(header instanceof HTMLElement) || !(title instanceof HTMLElement)) {
      return null;
    }

    return { main, header, title };
  }

  /*
   * A Fakémon's footer ActionArea contains the canonical SvelteKit links.
   * Keep those nodes in place and forward the new header buttons to the same
   * actual anchors (same approach as the working result-nav buttons).
   *
   * We discover actions by their URLs, not English UI text. This preserves
   * the app's conditional Edit/Access Key availability and localization.
   */
  const FAKEMON_HEADER_ACTIONS = [
    {
      id: "access-key",
      fallbackLabel: "Access Key",
      icon: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
    },
    {
      id: "edit",
      fallbackLabel: "Edit",
      icon: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    },
    {
      id: "remove",
      fallbackLabel: "Remove",
      icon: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 15H6L5 6"/><path d="M10 11v6M14 11v6"/>',
    },
  ];

  const FAKEMON_EDIT_HEADER_ACTIONS = [
    {
      id: "cancel",
      fallbackLabel: "Cancel",
      icon: '<path d="M18 6 6 18M6 6l12 12"/>',
    },
    {
      id: "finish",
      fallbackLabel: "Finish",
      icon: '<path d="m20 6-11 11-5-5"/>',
    },
  ];

  function fakemonHeaderActionContext() {
    if (currentRoot() !== "fakemon") return null;
    const url = new URL(location.href);
    const rawId = url.searchParams.get("id") || "";
    const id = rawId.replace(/^F\./, "");
    const action = url.searchParams.get("action") || "info";
    // The native New Fakémon form has Cancel/Finish but intentionally no ID yet.
    if (action === "add" && !id) return { id: null, action };
    if (!id || (action !== "info" && action !== "edit")) return null;
    return { id, action };
  }

  function collectNativeFakemonActions(article, readKey) {
    const content = article.querySelector(":scope > .scrollable");
    if (!(content instanceof HTMLElement)) return null;

    const pathname = location.pathname.replace(/\/+$/, "");
    const supported = new Set(FAKEMON_HEADER_ACTIONS.map((item) => item.id));

    for (const area of content.querySelectorAll(".action-area")) {
      if (!(area instanceof HTMLElement)) continue;

      const links = new Map();
      for (const anchor of area.querySelectorAll("a[href]")) {
        if (!(anchor instanceof HTMLAnchorElement)) continue;

        let target;
        try {
          target = new URL(anchor.href, location.href);
        } catch (_) { continue; }

        if (
          target.origin !== location.origin ||
          target.pathname.replace(/\/+$/, "") !== pathname ||
          target.searchParams.get("id") !== readKey
        ) continue;

        const action = target.searchParams.get("action");
        if (supported.has(action)) links.set(action, anchor);
      }

      if (!links.size) continue;

      const interactiveItems = Array.from(
        area.querySelectorAll("a[href], button, input, select")
      );
      const entirelyMirrored = interactiveItems.length === links.size &&
        interactiveItems.every((item) => [...links.values()].includes(item)) &&
        !area.querySelector(".error");

      return { area, links, entirelyMirrored };
    }

    return null;
  }

  function collectNativeFakemonEditActions(article) {
    const content = article.querySelector(":scope > .scrollable");
    if (!(content instanceof HTMLElement)) return null;

    for (const area of content.querySelectorAll("form .action-area")) {
      if (!(area instanceof HTMLElement)) continue;
      const form = area.closest("form");
      if (!(form instanceof HTMLFormElement)) continue;
      const buttons = Array.from(area.querySelectorAll("button"));

      // Identify by form semantics, not translated button captions.
      const cancel = buttons.find((button) =>
        button.type === "button" && button.classList.contains("subtle")
      );
      const finish = buttons.find((button) =>
        button.type === "submit" && button.form === form
      );
      if (!cancel || !finish) continue;

      const originals = new Map([["cancel", cancel], ["finish", finish]]);
      const controls = Array.from(area.querySelectorAll("a[href], button, input, select"));
      const entirelyMirrored = controls.length === 2 &&
        controls.every((control) => control === cancel || control === finish) &&
        !area.querySelector(".error");

      return { area, links: originals, entirelyMirrored };
    }
    return null;
  }

  function sourceEditButtonDisabled(button) {
    return !button || !button.isConnected || button.disabled ||
      button.matches("[aria-disabled='true']") || !!button.closest("[inert]");
  }

  function fakemonEditIconButton(action, original, article) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `yofi-fakemon-action-icon yofi-fakemon-action-${action.id}`;
    button.dataset.yofiFakemonAction = action.id;
    const label = original.textContent?.trim() || action.fallbackLabel;
    button.setAttribute("aria-label", label);
    button.title = label;
    button.disabled = sourceEditButtonDisabled(original);
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + action.icon + '</svg>';

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      // Always consult live Svelte buttons. In particular, native submit.click()
      // preserves HTML validation and the site's own saving/upload workflow.
      const native = collectNativeFakemonEditActions(article)?.links.get(action.id);
      if (sourceEditButtonDisabled(native)) return;
      native.click();
    });

    return button;
  }

  function fakemonIconButton(action, original, article, readKey) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `yofi-fakemon-action-icon yofi-fakemon-action-${action.id}`;
    button.dataset.yofiFakemonAction = action.id;

    const label = original.textContent?.trim() || action.fallbackLabel;
    button.setAttribute("aria-label", label);
    button.title = label;
    button.disabled = original.matches(".disabled, [aria-disabled='true']");
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + action.icon + '</svg>';

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      // Svelte can replace the original link after the icon is installed.
      // Resolve the live original on every click rather than using a stale ref.
      const nativeLink = collectNativeFakemonActions(article, readKey)?.links.get(action.id);
      if (!nativeLink || !nativeLink.isConnected) return;
      if (nativeLink.matches(".disabled, [aria-disabled='true']")) return;
      nativeLink.click();
    });

    return button;
  }

  function removeFakemonHeaderActions(article) {
    const host = article.querySelector(":scope > header .yofi-fakemon-header-actions");
    host?.remove();
    article.classList.remove("yofi-fakemon-actions-active");
    article.classList.remove("yofi-fakemon-typed-header");
    article.querySelectorAll(".yofi-fakemon-actions-promoted")
      .forEach((area) => area.classList.remove("yofi-fakemon-actions-promoted"));
  }

  function ensureFakemonTitleTextSpan(header) {
    const title = header.querySelector(":scope > .title");
    if (!(title instanceof HTMLElement)) return;
    if (title.querySelector(":scope > .yofi-fakemon-title-text")) return;
    const nameNode = Array.from(title.childNodes).find((node) =>
      node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
    );
    if (!nameNode) return;
    const span = document.createElement("span");
    span.className = "yofi-fakemon-title-text";
    title.insertBefore(span, nameNode);
    span.appendChild(nameNode);
  }

  // Species whose names actually END in a sex symbol (Nidoran,
  // Meowstic, Indeedee, Basculegion, Oinkologne, etc.) share one handler.
  // Leave the Svelte-owned text node intact: Svelte can reuse that node to
  // navigate to a different species. An independent SVG sibling reproduces
  // the existing Nidoran baseline fix without modifying a name's identity.
  function speciesSexSuffix(raw) {
    const match = raw.match(/^([^\u2640\u2642]*?)([\u2640\u2642])(\s*)$/u);
    return match && match[1].trim() ? { prefix: match[1], symbol: match[2] } : null;
  }

  // Pre-split v0.12.18 helpers restored locally. Species list/title glyphs
  // belong to QOL; the independent Hero Adapter has its own private helpers.
  // Use the exact visual geometry of the site's GenderIcon: font-weight
  // cannot thicken the fallback Unicode symbol on iPadOS Safari.
  function makeNativeSexSvg(symbol) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 12 12");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.classList.add("yofi-sex-svg");
    const part = (tag, attrs) => {
      const el = document.createElementNS(ns, tag);
      el.classList.add("yofi-sex-stroke");
      for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
      svg.appendChild(el);
    };
    if (symbol === "♂") {
      part("circle", { r: 2.25, cx: 4.5, cy: 7.5 });
      part("line", { x1: 6, y1: 6, x2: 9.25, y2: 2.75 });
      part("line", { x1: 9, y1: 2.75, x2: 6, y2: 2.75 });
      part("line", { x1: 9.25, y1: 2, x2: 9.25, y2: 6 });
    } else {
      part("circle", { r: 2.25, cx: 6, cy: 4 });
      part("line", { x1: 6, y1: 5.5, x2: 6, y2: 10.5 });
      part("line", { x1: 3.75, y1: 8.25, x2: 8.25, y2: 8.25 });
    }
    return svg;
  }

  function setDecoratedSexSymbol(target, symbol) {
    const hidden = document.createElement("span");
    hidden.className = "yofi-sex-character";
    hidden.textContent = symbol; // Also preserves the existing textContent checks.
    target.replaceChildren(hidden, makeNativeSexSvg(symbol));
  }

  function decorateSpeciesSexName(label) {
    if (!(label instanceof HTMLElement)) return;
    const nativeText = Array.from(label.childNodes).find(node =>
      node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim());
    if (!nativeText) return;
    const raw = nativeText.nodeValue || '';
    const current = label.querySelector(':scope > .yofi-species-sex-symbol');
    const match = speciesSexSuffix(raw);
    if (!match) {
      // Our earlier pass shortened the native text to its prefix. Distinguish
      // that case from a genuine native rename before removing the SVG.
      if (current?.dataset.yofiNamePrefix === raw) return;
      current?.remove();
      return;
    }
    if (current?.dataset.yofiNamePrefix === match.prefix &&
        current.dataset.yofiNameSymbol === match.symbol) {
      if (raw !== match.prefix) nativeText.nodeValue = match.prefix;
      return;
    }
    if (raw !== match.prefix) nativeText.nodeValue = match.prefix;
    current?.remove();
    const icon = document.createElement('span');
    icon.className = 'yofi-species-sex-symbol';
    icon.dataset.yofiNamePrefix = match.prefix;
    icon.dataset.yofiNameSymbol = match.symbol;
    setDecoratedSexSymbol(icon, match.symbol);
    label.appendChild(icon);
  }

  // EvolutionInfo.svelte renders both linked names and literal sentence
  // fragments via ResolveAsyncText. decorateSpeciesSexName() already handles
  // an anchor that is JUST a species name; it cannot detect an embedded
  // "Nidoran♀ evolves into ..." mention. Decorate only name-suffix symbols
  // in Evolution content, reusing the exact title/list SVG and baseline.
  // Keep the original Svelte-owned Text node mounted so a route's text update
  // can be observed; own only the additional siblings we create.
  const evolutionSexNativeText = new WeakMap();
  const evolutionSexObservers = new WeakMap();
  function evolutionSexSuffixPositions(raw) {
    const result = [];
    for (let i = 1; i < raw.length; i++) {
      const char = raw[i];
      if (char !== '♀' && char !== '♂') continue;
      if (!/[\p{L}\p{N}]/u.test(raw[i - 1])) continue;
      if (i + 1 < raw.length && /[\p{L}\p{N}]/u.test(raw[i + 1])) continue;
      result.push(i);
    }
    return result;
  }

  function decorateEvolutionSexNames(article) {
    const evolution = article?.querySelector(':scope > .scrollable section.evolution');
    if (!(evolution instanceof HTMLElement)) return;
    // The same element may survive species navigation while its Svelte text
    // nodes receive new values without structural DOM changes.
    if (!evolutionSexObservers.has(evolution)) {
      const observer = new MutationObserver(changes => {
        if (changes.some(change => change.type === 'characterData')) queueInstall();
      });
      observer.observe(evolution, {characterData:true,subtree:true});
      evolutionSexObservers.set(evolution, observer);
    }
    const walker = document.createTreeWalker(evolution, NodeFilter.SHOW_TEXT);
    const candidates = [];
    for (let node; (node = walker.nextNode());) {
      const parent = node.parentElement;
      if (!parent || parent.closest('.yofi-species-sex-symbol, .yofi-sex-character, script, style, textarea')) continue;
      if (!parent.closest('.evolution-section')) continue;
      if (evolutionSexNativeText.has(node) || /[♀♂]/u.test(node.nodeValue || ''))
        candidates.push(node);
    }
    for (const node of candidates) {
      const previous = evolutionSexNativeText.get(node);
      if (previous && node.nodeValue === previous.prefix &&
          previous.nodes.every(extra => extra.parentNode === node.parentNode)) continue;
      // Remove exclusively our previous siblings if Svelte changed the native
      // Text node. Preserve any unrelated descendants, including links.
      if (previous) {
        for (const extra of previous.nodes) extra.remove();
        evolutionSexNativeText.delete(node);
      }
      const raw = node.nodeValue || '';
      const positions = evolutionSexSuffixPositions(raw);
      if (!positions.length) continue;
      const nodes = [];
      const fragment = document.createDocumentFragment();
      let from = 0;
      for (const pos of positions) {
        if (pos > from) {
          if (from === 0) node.nodeValue = raw.slice(0, pos);
          else {
            const between = document.createTextNode(raw.slice(from, pos));
            fragment.appendChild(between);
            nodes.push(between);
          }
        }
        const icon = document.createElement('span');
        icon.className = 'yofi-species-sex-symbol yofi-evolution-sex-symbol';
        setDecoratedSexSymbol(icon, raw[pos]);
        fragment.appendChild(icon);
        nodes.push(icon);
        from = pos + 1;
      }
      if (from < raw.length) {
        const after = document.createTextNode(raw.slice(from));
        fragment.appendChild(after);
        nodes.push(after);
      }
      // No font or color overrides: SVG uses the host's existing text color.
      node.after(fragment);
      evolutionSexNativeText.set(node, {prefix:node.nodeValue, nodes});
    }
  }

  function decorateSpeciesTitleName(header) {
    const name = header.querySelector(':scope > .title > .yofi-fakemon-title-text');
    if (name instanceof HTMLElement) decorateSpeciesSexName(name);
  }

  // The native Pokemon list has 1,139 rows. Decorating the very few
  // names with female/male symbols must not force a full URL/index parse.
  // Visit each fresh sidebar once; handle future native Svelte row additions
  // incrementally instead of re-walking the whole table on each selection.
  const pokemonSexSideObservers = new WeakMap();
  function decoratePokemonSideSexNames(side) {
    if (pokemonSexSideObservers.has(side)) return;
    const selector = 'tbody td.primary > a[href], tbody td.primary > button';
    const decorate = (node) => {
      if (!(node instanceof Element)) return;
      const candidates = node.matches(selector)
        ? [node, ...node.querySelectorAll(selector)]
        : node.querySelectorAll(selector);
      for (const element of candidates) {
        if (/[\u2640\u2642]/u.test(element.textContent || ''))
          decorateSpeciesSexName(element);
      }
    };
    decorate(side);
    const observer = new MutationObserver((changes) => {
      for (const mutation of changes) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) decorate(node);
        } else if (mutation.type === 'characterData') {
          const label = mutation.target.parentElement?.closest(selector);
          if (label && /[\u2640\u2642]/u.test(label.textContent || ''))
            decorateSpeciesSexName(label);
        }
      }
    });
    observer.observe(side, { childList: true, characterData: true, subtree: true });
    pokemonSexSideObservers.set(side, observer);
  }

  function decorateSpeciesListSexNames(page) {
    if (!(page instanceof HTMLElement) || !isSpeciesRoot()) return;
    const side = page.querySelector(':scope > .side');
    if (!(side instanceof HTMLElement)) return;
    if (currentRoot() === 'pokemon') {
      decoratePokemonSideSexNames(side);
      return;
    }
    // The Fakemon list is small; retain its established cached navigation
    // scan and decorate only when the native list generation changes.
    const scan = sideListScan(side);
    if (scan.dirty) getCandidateAnchors(page);
    if (scan.sexNameGeneration === scan.generation) return;
    for (const anchor of scan.anchors || []) {
      if (anchor.matches('td.primary > a') && /[\u2640\u2642]/u.test(anchor.textContent || ''))
        decorateSpeciesSexName(anchor);
    }
    for (const button of side.querySelectorAll('table tbody td.primary > button')) {
      if (/[\u2640\u2642]/u.test(button.textContent || ''))
        decorateSpeciesSexName(button);
    }
    scan.sexNameGeneration = scan.generation;
  }

  function watchFakemonTitleText(header) {
    const title = header.querySelector(":scope > .title");
    if (observedFakemonTitle === title) return;
    fakemonTitleTextObserver?.disconnect();
    observedFakemonTitle = title;
    if (!(title instanceof HTMLElement)) return;

    // Svelte can update a name in an existing text node without adding or
    // removing DOM children. The regular page-wide observer misses that case.
    fakemonTitleTextObserver = new MutationObserver(queueInstall);
    fakemonTitleTextObserver.observe(title, {
      characterData: true,
      subtree: true,
    });
  }

  function fitFakemonHeaderSpacing(header) {
    if (!(header instanceof HTMLElement)) return;
    if (header.closest("article.yofi-fixed-chevron-header")) return;

    const properties = [
      "--yofi-fakemon-space",
      "--yofi-fakemon-action-hit",
      "--yofi-fakemon-dismiss-hit",
    ];
    if (!header.parentElement.classList.contains("yofi-entry-compact")) {
      properties.forEach((name) => header.style.removeProperty(name));
      return;
    }

    watchFakemonTitleText(header);
    const title = header.querySelector(":scope > .title");
    const actions = header.querySelector(":scope > .yofi-fakemon-header-actions");
    if (!(title instanceof HTMLElement) || !(actions instanceof HTMLElement)) return;

    // scrollWidth remembers the full name even after text-overflow: ellipsis.
    const text = title.querySelector(":scope > .yofi-fakemon-title-text");
    const navs = Array.from(title.querySelectorAll(":scope > .yofi-result-nav"));
    const fontSize = parseFloat(getComputedStyle(header).fontSize) || 16;
    const titleFontSize = parseFloat(getComputedStyle(title).fontSize) || fontSize;
    const nameWidth = text instanceof HTMLElement ? text.scrollWidth : title.scrollWidth;
    const navWidth = navs.reduce((sum, el) => sum + el.getBoundingClientRect().width, 0);
    const titleGap = 0.06 * titleFontSize * Math.max(0, navs.length);
    const naturalTitle = nameWidth + navWidth + titleGap + 1;

    const tag = header.querySelector(":scope > .type-tag");
    const tagWidth = tag instanceof HTMLElement ? tag.getBoundingClientRect().width : 0;
    const dismiss = header.querySelector(":scope > .dismiss");
    const hasDismiss = dismiss instanceof HTMLElement && getComputedStyle(dismiss).display !== "none";
    const actionCount = actions.querySelectorAll(":scope > .yofi-fakemon-action-icon").length;
    if (!actionCount) return;

    const style = getComputedStyle(header);
    const insets = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    const groupGaps = (tag ? 1 : 0) + 1 + (hasDismiss ? 1 : 0);
    const gapCount = groupGaps + Math.max(0, actionCount - 1);
    const width = header.getBoundingClientRect().width;

    // Three density levels; all retain the original-size SVG glyphs.
    // Very long names may use the old hitbox size, never anything smaller.
    const emergency = { icon: 1.52 * fontSize, dismiss: 1.125 * fontSize, gap: 0 };
    const compact = { icon: 1.66 * fontSize, dismiss: 1.42 * fontSize, gap: 1.2 };
    const spacious = { icon: 1.96 * fontSize, dismiss: 1.85 * fontSize, gap: 5.5 };
    const required = (setting) => insets + naturalTitle + tagWidth
      + actionCount * setting.icon + (hasDismiss ? setting.dismiss : 0)
      + gapCount * setting.gap;
    const tight = required(compact);
    const full = required(spacious);

    let lower, upper, progress;
    if (width < tight) {
      lower = emergency;
      upper = compact;
      progress = Math.max(0, Math.min(1, (width - required(emergency)) / (tight - required(emergency))));
    } else {
      lower = compact;
      upper = spacious;
      progress = Math.max(0, Math.min(1, (width - tight) / (full - tight)));
    }
    const interpolate = (key) => lower[key] + (upper[key] - lower[key]) * progress;
    const values = [
      `${interpolate("gap").toFixed(2)}px`,
      `${interpolate("icon").toFixed(2)}px`,
      `${interpolate("dismiss").toFixed(2)}px`,
    ];
    properties.forEach((name, index) => {
      if (header.style.getPropertyValue(name) !== values[index]) {
        header.style.setProperty(name, values[index]);
      }
    });
  }

  function installFakemonHeaderActions(page) {
    const main = page.querySelector(":scope > main");
    if (!(main instanceof HTMLElement)) return;
    const article = main.querySelector("article");
    if (!(article instanceof HTMLElement)) return;

    const context = fakemonHeaderActionContext();
    if (!context) {
      if (article.classList.contains("yofi-fakemon-actions-active")) {
        removeFakemonHeaderActions(article);
      }
      return;
    }

    const header = article.querySelector(":scope > header");
    if (!(header instanceof HTMLElement)) return;
    const editing = context.action === "edit" || context.action === "add";
    const native = editing
      ? collectNativeFakemonEditActions(article)
      : collectNativeFakemonActions(article, context.id);

    if (!native) {
      if (article.classList.contains("yofi-fakemon-actions-active")) {
        removeFakemonHeaderActions(article);
      }
      return;
    }

    // If the app adds another native control, retain its original action row.
    article.querySelectorAll(".yofi-fakemon-actions-promoted")
      .forEach((area) => {
        if (area !== native.area || !native.entirelyMirrored) {
          area.classList.remove("yofi-fakemon-actions-promoted");
        }
      });
    if (native.entirelyMirrored) {
      native.area.classList.add("yofi-fakemon-actions-promoted");
    }

    const actions = editing ? FAKEMON_EDIT_HEADER_ACTIONS : FAKEMON_HEADER_ACTIONS;
    const available = actions.filter((item) => native.links.has(item.id));
    const signature = `${context.action}|` + available
      .map((item) => `${item.id}:${editing ? native.links.get(item.id).type : native.links.get(item.id).href}:${native.links.get(item.id).textContent?.trim()}`)
      .join("|");

    let host = header.querySelector(".yofi-fakemon-header-actions");
    if (host?.dataset.yofiSignature === signature) {
      const hasTypeTag = !!header.querySelector(":scope > .type-tag");
      article.classList.toggle("yofi-fakemon-typed-header", hasTypeTag);
      if (!editing) {
        ensureFakemonTitleTextSpan(header);
        fitFakemonHeaderSpacing(header);
      }
      // Editor saving state changes disabled/inert without altering its labels.
      if (editing) {
        for (const item of available) {
          const icon = host.querySelector(`[data-yofi-fakemon-action="${item.id}"]`);
          if (icon instanceof HTMLButtonElement) {
            const disabled = sourceEditButtonDisabled(native.links.get(item.id));
            if (icon.disabled !== disabled) icon.disabled = disabled;
          }
        }
      }
      return;
    }

    if (!host) {
      host = document.createElement("div");
      host.className = "yofi-fakemon-header-actions";
      host.setAttribute("role", "group");
      host.setAttribute("aria-label", "Fakémon actions");
      const zone = header.querySelector(":scope > .yofi-entry-action-zone");
      if (zone) zone.insertBefore(host, zone.firstChild);
      else header.insertBefore(host, header.querySelector(":scope > .dismiss"));
    }
    host.replaceChildren(...available.map((item) => editing
      ? fakemonEditIconButton(item, native.links.get(item.id), article)
      : fakemonIconButton(item, native.links.get(item.id), article, context.id)));
    host.dataset.yofiSignature = signature;
    article.classList.add("yofi-fakemon-actions-active");
    article.classList.toggle("yofi-fakemon-typed-header",
      !!header.querySelector(":scope > .type-tag"));
    if (!editing) {
      ensureFakemonTitleTextSpan(header);
      fitFakemonHeaderSpacing(header);
    }
  }

  function definitelyListOnlyUrl() {
    const root = currentRoot();
    const url = new URL(location.href);

    if (root === "fakemon" && ["add", "find"].includes(url.searchParams.get("action"))) {
      return false;
    }
    if (root === "fakemon" || root === "trainers") {
      return !url.searchParams.has("id");
    }

    const segments = pathSegments();
    const rootIndex = segments.indexOf(root);

    return rootIndex >= 0 && rootIndex === segments.length - 1;
  }

  let detailDismissTimer = null;
  // A fresh reload can take longer than 160ms to render its detail card.
  // Remember if THIS route actually showed a card before treating a missing
  // card as a user-dismissed panel; do not erase the stored fullscreen state
  // while the application is still hydrating.
  let lastRenderedDetailRoute = null;
  function applyStateForCurrentUrl(page) {
    if (pendingListSelection) {
      const current = normalizeUrl(location.href);
      if (current !== pendingListSelection.url && current !== pendingListSelection.from) {
        clearCollapsedDestination();
      } else return; // Keep the real list visible throughout this navigation.
    }
    // Add and Find are valid full-screen forms even though their URLs lack ID.
    // Crucially, do not reset them during the brief Svelte unmount/remount.
    if (fakemonUtilityPanelHere()) {
      if (detailDismissTimer !== null) clearTimeout(detailDismissTimer);
      detailDismissTimer = null;
      setCollapsed(true);
      return;
    }
    const detail = getDetailParts(page);

    if (detail) {
      lastRenderedDetailRoute = fullscreenRouteKey(location.href);
      if (detailDismissTimer !== null) clearTimeout(detailDismissTimer);
      detailDismissTimer = null;
      document.documentElement.classList.toggle(
        GLOBAL_COLLAPSED_CLASS,
        collapsed
      );
      return;
    }

    /*
     * During Svelte navigation the detail card can disappear briefly.
     * Only an actual list-only URL resets our state.
     */
    if (definitelyListOnlyUrl()) {
      // Do not reset fullscreen while Svelte is still leaving the list route.
      if (collapsed && Date.now() < pendingSelectionExpiresAt) return;
      if (detailDismissTimer !== null) clearTimeout(detailDismissTimer);
      detailDismissTimer = null;
      setCollapsed(false);
      clearCollapsedDestination();
    } else if (collapsed && detailDismissTimer === null) {
      // If a detail has never rendered at this URL, this is probably initial
      // hydration or a Svelte route transition. Don't lose fullscreen on
      // refresh merely because its component hasn't mounted after 160ms.
      if (lastRenderedDetailRoute !== fullscreenRouteKey(location.href) &&
          (rememberedFullscreenHere() || pendingCollapseMatchesCurrentUrl())) {
        return;
      }
      // A card that was visible and has since disappeared is truly dismissed.
      detailDismissTimer = setTimeout(() => {
        detailDismissTimer = null;
        const current = document.querySelector(PAGE_SELECTOR);
        if (!current || getDetailParts(current)) return;
        setCollapsed(false);
        clearCollapsedDestination();
        queueInstall();
      }, 160);
    }
  }

  function navigateViaOriginalListLink(anchor) {
    // The site-owned anchor is the authoritative route action. Requiring a
    // particular list wrapper or a second live-neighbor lookup can reject
    // valid links during Svelte/Safari updates and leave the chevron inert.
    if (!(anchor instanceof HTMLAnchorElement) || !anchor.isConnected) {
      queueInstall();
      return false;
    }
    const keepCollapsed = collapsed;

    /*
     * Only the hidden state needs a full-navigation fallback marker.
     * If visible, absence of a marker naturally preserves visible state.
     */
    if (keepCollapsed) {
      rememberCollapsedDestination(anchor.href);
    } else {
      clearCollapsedDestination();
    }

    preservingSyntheticNavigation = true;

    try {
      /*
       * Critical v0.3.8 retained behavior:
       * activate Pokémon 5e's OWN already-rendered list link instead of
       * navigating with a new injected <a>. This gives SvelteKit the exact
       * same navigation event it receives from a normal list selection.
       */
      anchor.click();
    } finally {
      preservingSyntheticNavigation = false;
    }

    /*
     * Client-side navigation keeps this script instance alive, so explicitly
     * retain exactly the state we had before the prev/next click.
     */
    setCollapsed(keepCollapsed);
    return true;
  }

  function makeNavButton(kind, anchor) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `yofi-result-nav yofi-${kind}`;

    const itemName = anchor.textContent?.trim() || kind;
    const label = kind === "prev"
      ? `Previous result: ${itemName}`
      : `Next result: ${itemName}`;

    button.setAttribute("aria-label", label);
    button.title = label;
    button.innerHTML = '<span class="yofi-chevron" aria-hidden="true"></span>';

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      // Use the exact native link this button represents while it is live.
      // If Svelte replaced the list, resolve the same direction from the new
      // list instead of attempting to activate a detached anchor.
      const target = anchor?.isConnected
        ? anchor
        : liveNeighborForPage(button.closest(PAGE_SELECTOR), kind);
      navigateViaOriginalListLink(target);
    });

    return button;
  }

  function livePokemonNeighbors(page) {
    if (currentRoot() !== 'pokemon') return null;
    const side = page.querySelector(':scope > .side');
    const tbody = side?.querySelector('table > tbody');
    if (!(tbody instanceof HTMLElement)) return null;

    // Native sorted/filtered rows are already in the correct visible order.
    // Find only the current entry, then inspect its immediate siblings.
    // This avoids normalizing + indexing 1,139 hrefs on first entry and
    // whenever the list remounts after visiting Moves, TMs or Items.
    const pathname = location.pathname.replace(/\/+$/, '');
    const selected = tbody.querySelector(
      `tr td.primary > a[href$=${JSON.stringify(pathname)}]`
    );
    if (!(selected instanceof HTMLAnchorElement) ||
        !isVisibleCandidate(selected) ||
        normalizeUrl(selected.href) !== normalizeUrl(location.href)) {
      return { previous: null, next: null, found: false };
    }
    return listNeighborsForAnchor(selected);
  }

  function listNeighborsForAnchor(selected) {
    const row = selected.closest('tr');
    const tbody = row?.parentElement;
    if (!row || tbody?.tagName !== 'TBODY') return null;
    const neighbor = (direction) => {
      let sibling = row[direction];
      while (sibling) {
        const anchor = sibling.querySelector('td.primary > a[href]');
        if (isVisibleCandidate(anchor) && isDetailRoute(anchor.href)) return anchor;
        sibling = sibling[direction];
      }
      return null;
    };
    return {previous:neighbor('previousElementSibling'),next:neighbor('nextElementSibling'),found:true};
  }

  function liveNeighborForPage(page, kind) {
    if (!(page instanceof HTMLElement)) return null;
    if (currentRoot() === 'pokemon') {
      // Pokémon's native SortableTable can be between mounts during a route
      // update. Never fall back to its prior cached anchors in that interval.
      const direct = livePokemonNeighbors(page);
      return direct?.[kind] || null;
    }
    const items = getCandidateAnchors(page);
    if (!items.length) return null;
    const side = page.querySelector(':scope > .side');
    const scan = side && sideListScans.get(side);
    const index = scan?.urlToIndex.get(normalizeUrl(location.href)) ?? -1;
    if (index < 0) return null;
    return kind === 'prev'
      ? (index > 0 ? items[index - 1] : null)
      : (index + 1 < items.length ? items[index + 1] : null);
  }

  function navigationHrefKey(anchor) {
    try {
      const url = new URL(anchor.href, location.href);
      url.hash = '';
      const path = url.pathname.replace(/\/+$/, '') || '/';
      return `${url.origin}${path}${url.search}`;
    } catch (_) { return ''; }
  }

  function syncResultChevronButtons(title, previous, next) {
    const current = normalizeUrl(location.href);
    const signature = `${current}|${previous ? navigationHrefKey(previous) : ''}`
      + `|${next ? navigationHrefKey(next) : ''}`;
    warmResultNeighbors(previous, next, signature);
    if (title.dataset.yofiNavSignature === signature) return;
    title.querySelectorAll(':scope > .yofi-result-nav, :scope > .yofi-result-nav-placeholder')
      .forEach(node => node.remove());
    title.classList.add('yofi-title-nav-host');
    const placeholder = (kind) => {
      const slot = document.createElement('span');
      slot.className = `yofi-result-nav-placeholder yofi-${kind}`;
      slot.setAttribute('aria-hidden', 'true');
      return slot;
    };
    title.prepend(previous ? makeNavButton('prev', previous) : placeholder('prev'));
    title.append(next ? makeNavButton('next', next) : placeholder('next'));
    title.dataset.yofiNavSignature = signature;
  }

  function refreshTitleNavigation(page) {
    // Never navigate between species while Add/Edit is open.
    const form = fakemonHeaderActionContext();
    if (form && (form.action === 'add' || form.action === 'edit')) {
      const title = detailArticle(page)?.querySelector(':scope > header > .title');
      if (title instanceof HTMLElement) {
        title.querySelectorAll(':scope > .yofi-result-nav, :scope > .yofi-result-nav-placeholder')
          .forEach(node => node.remove());
        title.classList.remove('yofi-title-nav-host');
        delete title.dataset.yofiNavSignature;
      }
      return;
    }
    const detail = getDetailParts(page);
    if (!detail) return;
    const { title } = detail;

    const direct = livePokemonNeighbors(page);
    if (direct) {
      // A current entry may genuinely be absent from filtered native rows;
      // an empty navigator is then preferable to stale adjacent links.
      syncResultChevronButtons(title, direct.previous, direct.next);
      return;
    }
    if (currentRoot() === 'pokemon') {
      // A missing native tbody means the list is remounting. Clear any prior
      // Pokémon links now; cached anchors are not safe destinations here.
      syncResultChevronButtons(title, null, null);
      return;
    }
    // Preserve the established shared index for Moves, TMs, Fakemon and
    // other list shapes that do not use Pokemon's native SortableTable.
    const items = getCandidateAnchors(page);
    if (!items.length) {
      syncResultChevronButtons(title, null, null);
      return;
    }
    const side = page.querySelector(':scope > .side');
    const scan = side && sideListScans.get(side);
    const index = scan?.urlToIndex.get(normalizeUrl(location.href)) ?? -1;
    if (index < 0) {
      syncResultChevronButtons(title, null, null);
      return;
    }
    syncResultChevronButtons(title,
      index > 0 ? items[index - 1] : null,
      index + 1 < items.length ? items[index + 1] : null);
  }


  /* Swipe any non-interactive part of a selected entry card to travel between
   * results. Navigation is delegated to the existing clickable chevrons,
   * which preserve current list/fullscreen state and Svelte routing.
   * The portrait sparkle is explicitly excluded so its corner-flick wins. */
  const entrySwipeControllers = new WeakMap();
  function installEntrySwipe(page) {
    if (!isDetailRoute()) return;
    const article = detailArticle(page);
    if (!(article instanceof HTMLElement) || entrySwipeControllers.has(article)) return;
    const state = { touchId: null, startX: 0, startY: 0,
      horizontal: false, abandoned: false, startAt: 0 };
    const inExcludedControl = (target) => target instanceof Element && !!target.closest(
      '.yofi-portrait-sparkle, .yofi-portrait-variant-menu, '
      + '.yofi-header-fakemon-id, .yofi-header-dex-id, '
      + 'button, a[href], input, textarea, select, dialog, '
      + '[contenteditable="true"], [role="button"], [role="slider"]'
    );
    const reset = () => {
      state.touchId = null;
      state.horizontal = false;
      state.abandoned = false;
    };
    const findTouch = (list) => {
      for (const touch of list) if (touch.identifier === state.touchId) return touch;
      return null;
    };
    article.addEventListener("touchstart", (event) => {
      reset();
      if (event.touches.length !== 1 || inExcludedControl(event.target)) return;
      const touch = event.touches[0];
      state.touchId = touch.identifier;
      state.startX = touch.clientX;
      state.startY = touch.clientY;
      state.startAt = Date.now();
    }, { passive: true });
    article.addEventListener("touchmove", (event) => {
      if (state.touchId === null || state.abandoned) return;
      if (event.touches.length !== 1) { state.abandoned = true; return; }
      const touch = findTouch(event.touches);
      if (!touch) return;
      const dx = touch.clientX - state.startX;
      const dy = touch.clientY - state.startY;
      if (!state.horizontal && Math.abs(dy) >= 12 && Math.abs(dy) > Math.abs(dx)) {
        state.abandoned = true; // Native vertical scroll wins.
        return;
      }
      if (!state.horizontal && Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        state.horizontal = true;
      }
      if (state.horizontal && event.cancelable) event.preventDefault();
    }, { passive: false });
    article.addEventListener("touchend", (event) => {
      if (state.touchId === null) return;
      const touch = findTouch(event.changedTouches);
      if (!touch) return;
      const dx = touch.clientX - state.startX;
      const dy = touch.clientY - state.startY;
      const navigate = !state.abandoned && Math.abs(dx) >= 52
        && Math.abs(dx) > Math.abs(dy) * 1.35
        && Date.now() - state.startAt < 1300;
      reset();
      if (!navigate) return;
      const kind = dx < 0 ? "next" : "prev";
      const button = article.querySelector(`:scope > header .yofi-result-nav.yofi-${kind}`);
      if (!(button instanceof HTMLButtonElement) || !button.isConnected) return;
      // Suppress the trailing synthesized tap when Safari produces one.
      if (event.cancelable) event.preventDefault();
      button.click();
    }, { passive: false });
    article.addEventListener("touchcancel", reset, { passive: true });
    entrySwipeControllers.set(article, state);
  }


  // The icons originate from the site's src/lib/pokemon/types/icons
  // components; draw inline so Safari needs no external icon request.
  // Full geometry from all 18 native pokemon/types/icons/*.svelte SVGs.
  // Keep these self-contained: no abbreviated paths or follow-up patches.
  const HEADER_TYPE_PATHS = Object.freeze({
    normal: "<path d=\"M129.76 204.09c-52.17.13-86.62-49.01-69.05-96.43 1.58-4.26 2.06-8.18.3-12.54-4.35-10.76-2.11-20.35 6.4-28.13 8.6-7.86 18.65-8.56 28.73-3.56 4.11 2.04 7.65 1.76 11.48.67 13.45-3.84 26.89-3.86 40.31-.09 5.01 1.41 9.29.9 14.31-1.24 9.79-4.16 19.59-3.35 27.74 4.64 8.34 8.17 9.92 17.82 5.48 28.33-1.7 4.02-1.86 7.6-.29 11.52 13.45 33.52-1.47 71.64-33.35 88.74-10.47 5.62-21.72 8.21-32.05 8.08ZM77.28 133.16c-1.34-26.26 21.93-51.19 50.24-51.09 28.36.09 50.55 22.02 51.35 50.13.68 24.05-19.28 50.72-50.39 51.16-27.94.4-51.07-22.27-51.2-50.2Z\"/>",
    fire: "<path d=\"M101.14 196.71c-18.04-4.97-32.15-33.23-26.12-56.44 2.47-9.5 6.73-18.04 13.15-25.42 5.67-6.52 11.56-12.86 17.44-19.19 16.45-17.72 16.84-21.84 3.67-40.92 16.66-6.33 35.79 6.81 36.26 24.87.23 8.92-3.12 16.84-6.55 24.78-2.86 6.61-3.94 13.22 1.46 21.46.78-7.78.25-13.98 5.16-19.12 5.44-5.7 9.99-7.61 18.26-5.74-8 6.58-6.97 10.9 6.52 29.92 12.34 17.41 15.7 32.35 6.6 48.54-9.75 17.35-30.86 27.88-50.31 24.97 1.32-2.15 5-3.89 7.7-5.48 12.95-7.61 14.91-19.54 4.94-30.71-3.31-3.71-7.06-7.04-10.68-10.47-14.71-13.95-16.33-16.83-20.12-36.25-20.01 10.96-23.87 46.75-7.38 75.23Z\"/>",
    water: "<path d=\"M128.35 206.24c-34.24.13-56.14-32.39-43.8-64.78 4.18-10.98 10.78-20.6 16.8-30.49 9.43-15.5 15.71-32.11 19.91-49.63.54-2.25.94-4.58 1.88-6.66.93-2.07 2.13-4.29 5.02-4.17 2.83.12 3.84 2.41 4.87 4.44.74 1.45 1.09 3.12 1.41 4.73 4.46 22.12 13.91 42.06 26.04 60.93 7.77 12.08 14.46 24.58 14.13 39.75-.57 26.48-19.82 45.79-46.27 45.89Z M129.16,193.51c-13.8-1.05-25.57-4.53-32.92-16.53-1.35-2.2-3.13-5.02-1.71-7.44,1.88-3.21,4.73-.71,7.03,.08,17.88,6.19,35.7,6.17,53.52-.27,2.06-.75,4.33-2.73,6.36-.43,1.92,2.18,.05,4.41-.92,6.39-6.52,13.39-18.86,16.49-31.35,18.19Z\"/>",
    electric: "<path d=\"M112.94 205.87c-4.35-1.07-3.09-4.21-2.41-6.43 3.08-10.15 6.21-20.3 9.82-30.28 2.33-6.45 1.96-10.95-4.46-15.2-10.8-7.15-20.8-15.48-31.36-23-6.61-4.71-7.92-10.03-3.8-17.02 11.64-19.74 23.22-39.49 36.68-58.1 5.15-7.12 10.27-8.11 17.65-3.53 11.82 7.34 23.91 14.25 36.04 21.07 7.09 3.99 7.59 8.15 2.06 14.06-8.19 8.74-15.62 18.2-24.02 26.73-5.23 5.31-4.13 8.76.94 12.93 6.41 5.28 12.52 10.94 18.74 16.46 3.68 3.27 4.04 6.56.24 10.13-17.7 16.64-35.35 33.33-53.04 49.98-.94.89-2.12 1.53-3.08 2.21Z\"/>",
    grass: "<path d=\"M194.3 86.12c2.2-2.13 1.76 4.2 1.52 6.15-4.07 32.61-8.97 65.08-16.15 97.16-1.92 8.61-3.33 9.71-12.1 9.84-9.68.14-19.35.06-28.95.04-1.7 0-2.85-1.73-2.2-3.3 15.94-38.11 37.34-90.03 57.88-109.89Z\"/><path d=\"M121.47 180.64c-.83-23.74 2.05-37.16 5.01-68.66.12-1.32.59-2.57 1.15-3.77 3.53-7.48 17.34-36.24 25.36-46.17 1.68-2.08 5.01-.95 5.18 1.71.11 1.78.04 3.44-.03 5.22-.89 20.31-3.29 40.49-6.19 60.6-.56 3.86-2.22 7.68-3.97 11.23-5.73 11.62 1.08-2.28-17.76 34.57-1.19 2.34-2.12 5.3-4.33 6.98-1.8 1.37-4.34.55-4.42-1.7Z\"/><path d=\"M116.82 86.12c2.2-2.13 1.76 4.2 1.52 6.15-4.07 32.61-8.97 65.08-16.15 97.16-1.92 8.61-3.33 9.71-12.1 9.84-9.68.14-19.35.06-28.95.04-1.7 0-2.85-1.73-2.2-3.3 15.94-38.11 37.34-90.03 57.88-109.89Z\"/>",
    ice: "<path d=\"M110.36 60.61c6.05-5.88 11.4-11.09 17.77-17.29 5.97 6.13 11.17 11.47 17.14 17.59-4.92 5.79-9.31 10.96-14.74 17.36 12.8 7.44 26.4 16.32 40.07 24.27v-23.26h24.01c0 7.81.09 16.68.09 25.33-21.7 0-5.65.26-22.24.26 0 15.36.44 31.53.44 47.51h21.79v24.18h-23.94v-21.88c-13.22 7.56-27.06 15.34-40.38 22.95 5.13 5.9 9.4 10.79 14.9 17.11-5.37 5.66-10.66 11.23-17.36 18.29-5.96-6.39-11.21-12.02-17.12-18.36 4.98-5.7 9.44-10.8 14.84-16.97-13.25-7.61-27-15.35-40.37-23.03v22.22h-24.05v-24.46h22.03c0-15.56-.08-32.89-.08-48.86l-22.05-.08v-24.22h24.22c0 21.72 0 2.88 0 21.24 13.09-7.41 26.69-14.32 40.16-21.95-5.03-5.96-9.38-11.12-15.15-17.95Z M96.46,140.79v-32.06c12.55-7.16,12.55-6.81,27.27-15.03l6.03,7.93c-22.64,12.82,.71-.29-22.64,12.82v26.34h-10.66Z\"/>",
    fighting: "<path d=\"M187.37 155.46c.55.18.95.71 1.01 1.29 1.74 16.71-.12 19.56-15.05 25.28-18.32 7.01-37.09 12.47-56.28 16.61-6.49 1.4-12.82 1.23-18.55-1.56-9.55-4.66-18.43-10.58-26.79-17.18-2.9-2.29-4.35-5.25-4.45-8.92-.16-5.96.32-11.94 0-17.9-.29-5.3 1.7-8.26 7.01-8.25 13.98.02 27.96 0 41.94.07 2.73.01 5.69.39 6.17 3.76.85 6.07 5.16 6 9.64 6 14.98-.02 29.96-.02 44.94.04 3.34.01 6.74-.4 10.4.77Z\"/><path d=\"M66.79 97c0-7.65-.17-15.31.05-22.96.23-8.25 1.29-9.16 9.29-9.49 12.35-.52 13.55.62 13.57 13.24.03 14.31.11 28.62-.05 42.92-.1 8.6-2.14 10.41-10.71 10.59-9.27.18-11.82-1.83-12.08-10.34-.24-7.98-.05-15.97-.05-23.96 0 0-.01 0-.02 0Z\"/><path d=\"M162.9 146.55c-6.65 0-13.31-.04-19.96.01-6.12.05-9.28-2.95-9.44-9.04-.09-3.32-.23-6.66 0-9.97.36-5.39 3.15-8.73 8.81-8.76 13.64-.08 27.28.01 40.91-.04 4.22-.02 5.58 2.08 6.03 6.1 2.32 20.72 1.48 21.77-19.36 21.77-2.33 0-4.66 0-6.99 0 0-.02 0-.05 0-.07Z\"/><path d=\"M122.79 98.15c0 7.98.25 15.96-.07 23.93-.3 7.37-2.74 9.14-11.13 9.21-8.7.07-11.35-1.5-11.5-8.78-.36-16.61-.09-33.23-.15-49.85-.02-5.98 3.01-8.41 8.72-8.11 1.33.07 2.66-.04 3.99 0 8.85.21 9.91 1.08 10.13 9.67.2 7.97.04 15.95.04 23.93 0 0-.02 0-.03 0Z\"/><path d=\"M189.2 87.77c0 5.64 0 11.27 0 16.91 0 4.05-1.9 6.18-6.11 5.93-.66-.04-1.33 0-1.99.03q-14.85.61-14.86-14.08c0-7.3-.1-14.6.04-21.89.17-9.07 1.26-10.04 10.57-10.2 1.66-.03 3.32.07 4.97.05 4.94-.05 7.33 2.49 7.37 7.32.04 5.31 0 10.61 0 15.92Z\"/><path d=\"M156.1 88.09c0 5.33-.1 10.66.03 15.99.12 4.68-2.05 6.48-6.64 6.51-19.31.12-16.06.62-16.34-14.77-.14-7.66.11-15.33.03-22.99-.06-5.9 2.76-8.56 8.59-8.29 2.33.11 4.66.06 6.99.05 5.03-.01 7.23 2.72 7.26 7.5.03 5.33 0 10.66 0 15.99h.06Z\"/>",
    poison: "<circle cx=\"159.37\" cy=\"123.2\" r=\"16.8\"/><circle cx=\"102.45\" cy=\"86.6\" r=\"28.2\"/><path d=\"M197.45,191.55c2.36-1.5,3.12-3.08,3.28-4.91,.05-.38,.08-.77,.08-1.18,0-.27-.03-.52-.06-.76-.16-2.7-1.26-4.54-8.23-6.81-1.21-.39-2.54-.78-3.97-1.17-7.9-2.37-15.56-3.78-24.24-4.53-3.43-.44-6.99-.84-10.63-1.18-1.71-.52-2.31-1.28-2.72-2.44-.55-2.95-1.65-5.7-3.19-8.15-3.79-6.49-9.84-10.25-17.82-10.82-.49-.04-.98-.07-1.48-.08-.04,0-.08,0-.12,0-.03,0-.05,0-.08,0-.09,0-.18,0-.27,0-.27,0-.53,.01-.8,.02-9.24,.17-16.18,4.64-19.99,12.7-.62,1.22-1.15,2.49-1.55,3.82-.93,2.47-1.59,3.97-3.63,4.86-4.92,.42-9.65,.95-14.1,1.57-4.28,.46-8.51,1.21-12.7,2.17-5.5,1.14-10.17,2.43-13.73,3.8-.53,.19-1.04,.4-1.54,.63-4.26,1.9-4.63,3.67-4.66,5.88-.02,.26-.05,.52-.04,.8,0,.16,.03,.31,.04,.47,.06,2.53,.72,4.56,5.71,6.64,.94,.41,1.93,.76,2.94,1.08,1.65,.55,3.48,1.08,5.48,1.59,8.46,2.29,17.02,3.57,25.62,4.37,10.22,1.13,21.52,1.79,32.87,1.8,0,0,0,0,.01,0,0,0,0,0,0,0,.03,0,.06,0,.09,0,10.47,0,20.99-.59,30.65-1.59,10.15-.84,20.2-2.3,30.08-5.18,.46-.13,.91-.26,1.35-.39,.09-.03,.17-.05,.26-.08,2.29-.71,4.79-1.49,6.76-2.73,.08-.05,.16-.1,.25-.15,.02-.02,.05-.03,.07-.05Z\"/>",
    ground: "<path d=\"M126.23 184.84c-2.52-.77-6.4-1.66-10.06-3.12-16.93-6.77-33.8-13.68-50.68-20.59-1.52-.62-2.94-1.54-4.37-2.37-7.42-4.3-7.7-9.21-.2-12.86 20.58-10.01 41.94-18.12 63.61-25.43 2.66-.9 5.15-.6 7.77.29 21.03 7.14 41.73 15.08 61.78 24.65.9.43 1.91.68 2.71 1.23 4.81 3.35 4.98 8.12-.08 11.12-4.54 2.69-9.52 4.66-14.4 6.73-16.16 6.86-32.34 13.7-49 19.3-1.91.64-3.72 1.37-7.09 1.04Z\"/><path d=\"M127.56 209.93c-4.2 0-16.12-4.16-23.83-7.01-14.62-5.41-29.03-11.48-43.23-17.96-.67-.3-3.56-1.99-5.19-2.94-5.04-2.9-5.41-3.74-2.57-9.25 1.9-3.68 2.7-3.31 7.75-.99 16.01 7.32 32.38 13.67 48.71 20.15s21.09 6.87 37.52.04c15.91-6.61 31.68-13.54 47.8-19.73 4.87-1.87 6.88-3.86 9.14 1.33 1.81 4.15 3.83 5.53-3.76 8.84-16.74 7.31-33.07 15.45-50.36 21.36-7.2 2.46-17.23 6.15-21.98 6.15Z\"/><path d=\"M93.59,71.19q0,14.24-14.1,14.23c-1.33,0-2.65,.02-3.98-.02-8.78-.28-9.26-.78-9.52-9.97q-.51-18.04,17.68-17.63c9.44,.22,9.76,.54,9.92,10.4,.02,.99,0,1.99,0,2.98Z\"/><path d=\"M185.3,87.72c-.14,10.17-.34,10.34-11.99,10.25-10-.08-10.24-.37-10.14-12.06,.09-10.18,.35-10.41,11.95-10.24,10.14,.15,10.34,.38,10.18,12.05Z\"/><path d=\"M119.38,99.54c.04,8.09-1.04,9.17-9.13,9.18-8.19,0-9.46-1.21-9.42-8.99,.04-7.6,.99-8.41,9.78-8.36,8.16,.05,8.74,.59,8.78,8.16Z\"/>",
    flying: "<path d=\"M151.78 148.43c-15.72 18.66-36.72 18.54-56.82 20.49-.88.09-1.72.46-2.36 1.09-10.27 10.09-15.84 24.13-28 33.64-.55.43-1.39.2-1.63-.45-2.25-6.09-1.57-11.4-.81-16.39 4.26-28.02 11.13-55.4 21.88-81.66 5.83-14.23 15.13-24.51 31.59-27.2 24.36-3.98 47.33-13.03 70.58-20.97 2.96-1.01 6.05-1.96 9.13-.76.97.38 1.74 1.18 2.02 2.18.91 3.25-.92 5.89-2.54 8.68-13.5 23.36-34.25 37.51-58.92 46.81-3.54 1.33-7.9 2.81-10.91 5.61-.32.3-.08.86.35.88 17.48.74 32.76-5.7 48.82-9.24.55-.12 1.04.45.84.98-7.05 17.94-23.79 26.99-39.9 32.15-6.3 2.02-9.35 2.46-20.33 3.46-.37.03-.41.49-.11.57 15.87 4 21.78-.55 36.34-1.55.83-.06 1.3 1.02.77 1.66Z\"/>",
    psychic: "<path d=\"M197.45 99.74c.29 5.25-2.01 9.75-4.39 14.13-5 9.21-4.92 18.19-.37 27.66 10.23 21.3 3.62 33.41-19.59 35.57-11.16 1.04-19.22 5.65-25.41 15.11-11.71 17.9-27.71 17.77-39.56-.25-5.98-9.09-13.76-13.73-24.55-14.79-24.07-2.36-30.54-13.99-20.14-35.92 4.32-9.12 4.22-17.7-.14-26.79-10.21-21.31-3.62-33.41 19.59-35.57 11.15-1.04 19.23-5.65 25.41-15.11 11.49-17.58 27.83-17.94 38.95-.54 7.09 11.09 16.73 15.07 29.13 16.03 13.9 1.08 21.17 8.75 21.06 20.48Z M174.57,154.66c-20.78,1.82-35.45,9.96-46.37,26.9-11.55-16.67-26-25.21-45.7-26.81,6.99-17.87,8.75-34.96-.85-53,19.9-2.33,34.97-10.36,46.4-26.96,11.3,16.3,25.74,24.84,45.44,26.44-6.94,17.88-8.77,34.96,1.08,53.42Z\"/>",
    bug: "<path d=\"M57.84 144.71c-.01-17.4 1.6-28.85 6.39-39.68 3.81-8.63 8.14-10.12 15.18-4.54 9.56 7.57 20.13 12.71 32 15.35 6.4 1.43 8.85 5.18 6.73 11.74-7.23 22.39-14.49 44.78-21.4 67.27-2.38 7.73-5.96 7.47-11.48 3.27-19.56-14.89-27.26-35.22-27.42-53.41Z\"/><path d=\"M198.18 140.28c-.2 22.43-7.79 41.62-25.21 56.25-8.51 7.14-11.15 6.33-14.39-3.8-6.75-21.15-13.17-42.41-20.18-63.48-2.61-7.83-.79-11.92 7.38-13.71 11.17-2.45 21.18-7.45 30.21-14.58 7.71-6.09 11.86-4.82 15.86 4.29 4.91 11.17 6.33 22.98 6.33 35.02Z\"/><path d=\"M127.91 105.03c-15.42.42-28.7-4.76-40.56-14.1-6.17-4.85-7.07-9.34-1.07-15.53 23.76-24.54 59.04-24.66 83.13-.34 6.45 6.51 5.42 11.16-1.15 16.22-11.96 9.2-25.27 14.31-40.34 13.75Z\"/><path d=\"M128.4,179.08c4.03-.22,7.65-.37,11.27-.64,4.75-.35,6.18,2.6,7.01,6.54,.84,3.97-.53,6.29-4.39,7.43-9.41,2.78-18.79,2.72-28.22,.13-4.4-1.21-5.59-3.84-4.63-8.17,.94-4.23,3.05-6.32,7.53-5.92,3.94,.35,7.89,.44,11.44,.63Z\"/><path d=\"M127.89,170.73c-4.86-.9-12.01,1.45-11.66-7,.31-7.45,5.28-9.23,12.43-9.21,7.21,.02,11.05,3,11.1,9.52,.07,8.37-7.16,5.71-11.86,6.69Z\"/>",
    rock: "<path d=\"M199.67 98.23l-19.62-19.62 3.55 23.38c.03.19-.2.31-.34.17l-29.18-29.18c-.14-.14-.02-.37.17-.34l23.38 3.55-19.87-19.87s-.09-.06-.14-.06h-59.26c-.05 0-.1.02-.14.06l-41.9 41.9s-.06.09-.06.14v59.26c0 .05.02.1.06.14l19.53 19.53-9.71-45.05c-.04-.19.2-.32.34-.18l57.77 57.77c.14.14.01.38-.18.34l-45.05-9.71 19.21 19.21s.09.06.14.06h59.26c.05 0 .1-.02.14-.06l19.24-19.24-45.14 9.75c-.19.04-.32-.2-.18-.34l57.76-57.76c.14-.14.38-.01.34.18l-9.75 45.14 19.64-19.64s.06-.09.06-.14v-59.26c0-.05-.02-.1-.06-.14Z\"/>",
    ghost: "<path d=\"M181.32 129.18c17.5-2.25 26.94 4.31 29.63 19.92.35 2.02.89 4.09-.95 5.51-1.82 1.4-3.97.9-5.49-.53-3.43-3.21-6.15-2.85-9.23.65-11.43 13.03-11.49 12.97-25.61 3.67-7.23 9.3-13.4 19.53-22.16 27.76-15.24 14.32-23.93 14.36-39.14-.12-8.5-8.1-14.85-17.81-21.86-27.6-1.34.61-2.63.92-3.57 1.67-11.08 8.95-12.51 8.86-20.73-3.02-3.01-4.34-5.61-7.7-10.89-2.9-1.55 1.41-3.7 1.79-5.46.27-1.77-1.53-1.11-3.56-.73-5.56 2.91-15.53 11.6-21.56 29.88-19.95-1.56-21.61 3.65-40.79 21.04-55.13 10.2-8.4 21.88-12.33 35.08-11.62 30.09 1.6 48.84 26.36 50.2 66.98Z M97.2,100.05c-.05-3.76,.1-7.72,4.2-9.25,4.1-1.54,6.94,1.39,9.36,4.16,5.03,5.76,7.53,12.61,6.59,20.2-.85,6.86-5.98,8.61-11.33,4.15-5.97-4.98-8.66-11.56-8.82-19.25Z M158.77,100.6c-.26,7.31-2.96,13.47-8.42,18.46-2.1,1.92-4.32,3.3-7.12,2.5-3.33-.96-4.53-3.86-4.71-6.94-.42-7.24,1.69-13.82,6.43-19.33,2.59-3.02,5.62-6.37,10.14-4.27,3.89,1.81,3.8,5.86,3.69,9.59Z\"/>",
    dragon: "<path d=\"M170.93 124.41c.8 15.21-5.05 28.07-14.96 38.95-4.86 5.34-7.13 10.82-7.01 17.85.07 4.3-.64 8.63-1.21 12.91-1.48 11.17-7.97 16.55-19.79 16.53-11.81-.02-18.2-5.38-19.75-16.59-.18-1.32-.43-2.65-.42-3.97.07-12.31-3.37-22.68-11.93-32.43-14.25-16.22-14.56-45.3-2.66-60.49 5.82-7.42 4.65-17.14 7.55-25.58 2.37-6.9 4.02-14.05 6.07-21.06.48-1.65 1.51-3.06 3.48-3 2.02.06 2.71 1.6 3.11 3.3 1.8 7.77 4.05 15.47 5.23 23.33.95 6.31 4.94 5.95 9.39 5.97 4.5.02 8.42.25 9.35-6.03 1.11-7.53 3.32-14.9 5.03-22.34.45-1.96.74-4.19 3.34-4.19 2.43 0 3.15 1.99 3.71 4 1.88 6.72 3.88 13.4 5.7 20.14 3.01 11.13 4.22 22.74 11.59 32.51 4.31 5.71 3.98 13.22 4.18 20.21Z M91.9 116.2c.6 15.3 2.1 24 9.5 28.2l15.4 8.5-23.3-42.2Z M164.1 116.2c-.6 15.3-2.1 24-9.5 28.2l-15.4 8.5 23.3-42.2Z\"/><path d=\"M194.2,95.93c16.78,17.37,18.87,64.53-8.22,85.49-5.83-6.35-8.44-14.77-13.52-21.58-.65-.87-.74-2.88-.18-3.82,5.41-9,4.95-20.46,12.96-28.54,7.84-7.92,9.39-18.61,8.97-31.55Z\"/><path d=\"M61.68,95.93c-16.78,17.37-18.87,64.53,8.22,85.49,5.83-6.35,8.44-14.77,13.52-21.58,.65-.87,.74-2.88,.18-3.82-5.41-9-4.95-20.46-12.96-28.54-7.84-7.92-9.39-18.61-8.97-31.55Z\"/>",
    dark: "<path d=\"M74.46 84.24c7.49 7.56 17.75 14.95 27.04 16.93-1.38 2.84-1.88 5.07-2.37 8.23-2.78 17.82-1.19 34.63 12.15 48.3 10.06 10.31 23.45 10.28 33.51-.09 13.29-13.71 14.91-30.51 12.01-48.33-.43-2.62-1.93-9.15-1.88-9.24.1-.18 0-.08 1-.38 6.48-1.51 18.62-7.99 26.05-15.5 15.36 11.88 23.65 36.91 14.18 56.85-12.94 27.24-43.16 51.76-81.43 43.96-29.15-5.94-49.04-24.49-57.95-53.21-4.14-13.33 1.67-35.98 17.7-47.52Z\"/><path d=\"M139.92,124.38c-.27,5.3-.79,12.61-6.05,18.45-4.12,4.57-7.96,4.83-11.66-.03-7.43-9.75-7.46-20.89-4.48-32.19,1.96-7.42,2.86-7.9,10.26-7.9,7.41,0,7.97,.58,10.38,7.85,1.28,3.88,1.58,7.78,1.56,13.83Z\"/>",
    steel: "<path d=\"M117.24 93.22c2.6 13.41 4.78 24.66 7.26 37.43-22.73 6.49-44.68 12.75-69.68 19.88 9.84-30.35 18.66-57.52 27.59-85.05h89.4c.95 2.01 2.13 4.49 3.84 8.09-19.64 6.61-38.27 12.88-58.41 19.65Z M89.41,80.81a7.64,7.64 0 1,0 15.28,0a7.64,7.64 0 1,0 -15.28,0\"/><path d=\"M200.8 150.53c-14.91 10.77-28.49 20.58-44.8 32.36-7.75-27.52-14.82-52.63-22.38-79.5 16.5-5.26 30.78-9.82 46.8-14.93 6.96 21.21 13.5 41.12 20.38 62.07Z M151.26,116.95a10.41,10.41 0 1,0 20.82,0a10.41,10.41 0 1,0 -20.82,0\"/><path d=\"M143.47 191.59c-5.22 3.98-10.06 7.68-15.77 12.03-19.71-14.37-38.84-28.32-61.19-44.61 22.17-6.41 40.89-11.82 61.12-17.66 5.46 17.32 10.48 33.22 15.85 50.24Z\"/>",
    fairy: "<path d=\"M168.54 132.61c3.77 6.74 7.72 12.55 9.17 19.5 2.22 10.62-1.21 14.8-11.95 15.74-7.15.63-10.23.58-23.99-6.3-.72 12.68 10.42 26.54 7.56 40.13-.3 1.42-2.11 1.88-3.1.81-10.72-11.57-11.42-26.96-18.23-40.53-6.59 13.45-7.73 28.65-17.98 40.71-.94 1.1-2.77.71-3.11-.7-3.31-13.62 7.93-26.82 7.68-39.39-4.82 3.96-16 5.77-22.74 5.34-12.59-.8-15.97-5-13.2-17.17 1.5-6.62 5.97-11.71 8.57-18.3-7.97-5.14-16.04-9.4-21.66-17.39-10.4-14.76-10.88-31.08-9.17-47.77.67-6.56 6.56-8.82 12.68-9 22.43-.65 42.31 4.56 55.63 24.61q.69 1.04 3.11 5.35 2.46-3.75 3.18-4.86c13.12-20.16 32.89-25.76 55.37-25.1 9.84.29 13.27 4.35 13.86 14.36.99 16.72-1.38 32.29-12.39 45.93-5.05 6.25-12.22 8.98-19.28 14.02Z M128.01,97.38c3.43,10.49,11.99,18.83,23.75,18.89-4.1,10.72-12.19,14.1-21.2,14.91-10.89,.98-20.09-2.8-26.74-14.02,11.02-1.56,20.04-8.95,24.18-19.79Z\"/>",
  });

  function renderHeaderTypePictograms(header) {
    const tag = header?.querySelector(':scope > .type-tag');
    if (!(tag instanceof HTMLElement)) return;
    const segments = Array.from(tag.querySelectorAll(':scope > span.type'));
    if (!segments.length) return;
    const sources = segments.map(segment => {
      const host = segment.querySelector(':scope > .unskew') || segment;
      const native = host.querySelector(':scope > .yofi-type-original');
      // Site revisions and Svelte transitions may nest the type label in a
      // child span rather than a direct Text node. The former implementation
      // detected only some monotypes, leaving the others as text.
      const text = native?.textContent?.trim() || Array.from(host.childNodes)
        .filter(node => !(node instanceof Element &&
          node.matches('.yofi-type-glyph, svg')))
        .map(node => node.textContent || '').join(' ').trim();
      const label = value => (value || '').toLowerCase().replace(/[^a-z]/g, '');
      const candidates = [text, host.getAttribute('aria-label'), host.getAttribute('title'),
        segment.getAttribute('aria-label'), segment.getAttribute('title'),
        segment.getAttribute('data-type'), segment.dataset.type,
        ...Array.from(segment.classList)];
      const type = candidates.map(label).find(value => HEADER_TYPE_PATHS[value]) || '';
      return { segment, host, type, markup: HEADER_TYPE_PATHS[type] };
    });
    if (!sources.every(source => !!source.markup)) {
      tag.classList.remove('yofi-header-icon-pill', 'yofi-header-icon-single');
      tag.querySelectorAll('.yofi-type-glyph').forEach(svg => svg.remove());
      return;
    }
    for (const {segment, host, type, markup} of sources) {
      let native = host.querySelector('.yofi-type-original');
      if (!native) {
        // Preserve the actual Svelte-owned Text nodes, including nested ones.
        // A blank top-level wrapper would leave nested native text visible next
        // to the SVG. Wrapping the real Text node allows Svelte to update it.
        const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (node.textContent.trim() && !node.parentElement?.closest('.yofi-type-glyph'))
            textNodes.push(node);
        }
        for (const node of textNodes) {
          const wrapper = document.createElement('span');
          wrapper.className = 'yofi-type-original';
          node.parentNode.insertBefore(wrapper, node);
          wrapper.appendChild(node);
          if (!native) native = wrapper;
        }
      }
      if (segment.dataset.yofiHeaderType !== type ||
          !host.querySelector(':scope > .yofi-type-glyph')) {
        segment.querySelectorAll('.yofi-type-glyph').forEach(svg => svg.remove());
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 256 256');
        svg.setAttribute('class', 'yofi-type-glyph');
        svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML = markup;
        host.appendChild(svg);
        segment.dataset.yofiHeaderType = type;
      }
    }
    tag.classList.add('yofi-header-icon-pill');
    tag.classList.toggle('yofi-header-icon-single', segments.length === 1);
  }

  function installUniversalEntryTitlebar(page) {
    const root = currentRoot();
    if (isSpeciesRoot()) return;
    if (!['moves', 'tms', 'items', 'trainers', 'rules', 'encounter-tool', 'backups'].includes(root)) return;
    const article = detailArticle(page);
    const header = article?.querySelector(':scope > header');
    const title = header?.querySelector(':scope > .title');
    if (!(article instanceof HTMLElement) || !(header instanceof HTMLElement) ||
        !(title instanceof HTMLElement)) return;
    article.classList.add('yofi-universal-header');
    article.classList.toggle('yofi-rules-header', root === 'rules');
    article.classList.toggle('yofi-wide-title-header', ['moves','tms','items'].includes(root));
    article.classList.toggle('yofi-tm-title-card', root === 'tms');
    if (root === 'moves' || root === 'tms') renderHeaderTypePictograms(header);

    // The title may contain the native text node plus our prev/next buttons.
    // Keep that original node alive so Svelte continues updating it normally.
    let name = title.querySelector(':scope > .yofi-universal-title-text');
    if (!name && (title.classList.contains('yofi-title-nav-host') || root === 'tms')) {
      const textNodes = Array.from(title.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
      if (textNodes.length) {
        name = document.createElement('span');
        name.className = 'yofi-universal-title-text';
        for (const node of textNodes) name.appendChild(node);
        title.insertBefore(name, title.querySelector('.yofi-result-nav.yofi-next, .yofi-result-nav-placeholder.yofi-next'));
      }
    }
    if (root !== 'tms' || !(name instanceof HTMLElement)) return;

    let native = name.querySelector(':scope > .yofi-tm-native-title');
    if (!native) {
      native = document.createElement('span');
      native.className = 'yofi-tm-native-title';
      for (const node of Array.from(name.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE) native.appendChild(node);
      }
      name.prepend(native);
    }
    const raw = native.textContent?.trim() || '';
    // Source Move.tmName(): `${tm.id} - ${move.name}`. Match only that prefix.
    const prefix = raw.match(/^(\d+)\s*[-–—]\s*(.+)$/s);
    const moveName = prefix ? prefix[2].trim() : raw;
    const id = pathSegments()[pathSegments().indexOf('tms') + 1] || prefix?.[1] || '';
    const number = /^\d+$/.test(id) ? String(Number(id)) : (prefix?.[1] || '');
    let label = name.querySelector(':scope > .yofi-tm-title-label');
    if (!label) {
      label = document.createElement('span');
      label.className = 'yofi-tm-title-label';
      name.appendChild(label);
    }
    if (label.textContent !== moveName) label.textContent = moveName;
    let subtitle = header.querySelector(':scope > .yofi-tm-header-id');
    if (!subtitle) {
      subtitle = document.createElement('span');
      subtitle.className = 'yofi-tm-header-id';
      header.appendChild(subtitle);
    }
    const caption = number ? `#${number}` : '';
    if (subtitle.textContent !== caption) subtitle.textContent = caption;
    subtitle.setAttribute('aria-label', number ? `Technical Machine number ${number}` : '');
    positionTmNumber(header, caption);
  }

  function positionTmNumber(header, caption) {
    // The next-arrow and native X may move as the center track changes.
    // Calculate the CENTER of the usable gap, not a fixed percent of the
    // header. This also keeps the TM number out of the X's tap target.
    const next = header.querySelector('.title > .yofi-result-nav.yofi-next, .title > .yofi-result-nav-placeholder.yofi-next');
    const dismiss = header.querySelector(':scope > a.dismiss:not(.yofi-find-cancel)');
    if (!(next instanceof HTMLElement) || !(dismiss instanceof HTMLElement)) return;
    const heading = header.getBoundingClientRect();
    const arrow = next.getBoundingClientRect();
    const close = dismiss.getBoundingClientRect();
    if (!heading.width || !arrow.width || !close.width) return;
    const gapStart = arrow.right + 3;
    const gapEnd = close.left - 3;
    const space = Math.max(0, gapEnd - gapStart);
    if (space <= 0) return;
    const center = `${((gapStart + gapEnd)/2 - heading.left).toFixed(2)}px`;
    const usable = `${space.toFixed(2)}px`;
    // A digit is at most about .7em at the header's bold weight; limit the
    // font only when a long number has unusually little room.
    const fit = `${Math.max(10, Math.min(24, (space - 2) / (Math.max(1, caption.length) * .7))).toFixed(2)}px`;
    for (const [prop, value] of [
      ['--yofi-tm-id-center', center],
      ['--yofi-tm-id-space', usable],
      ['--yofi-tm-id-fit', fit],
    ]) {
      if (header.style.getPropertyValue(prop) !== value) header.style.setProperty(prop, value);
    }
  }

  /* Two opposing corner chevrons show the AVAILABLE action. Native X
   * dismisses the entry independently of the fullscreen preference. */
  const FULLSCREEN_GLYPHS = Object.freeze({
    expand: '<path d="M10 3H3V10 M14 21H21V14"/>',
    reduce: '<path d="M3 10H10V3 M21 14H14V21"/>',
  });

  function installFullscreenToggle(page) {
    const header = detailArticle(page)?.querySelector(':scope > header');
    const article = header?.closest('article');
    if (!(header instanceof HTMLElement) || !(article instanceof HTMLElement)) return;
    const eligible = isDetailRoute() && !fakemonUtilityPanelHere();
    article.classList.toggle('yofi-fullscreen-entry', eligible);
    let button = header.querySelector(':scope > .yofi-fullscreen-toggle');
    if (!eligible) { button?.remove(); return; }
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'yofi-fullscreen-toggle';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2.25');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      button.appendChild(svg);
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDetailRoute() || fakemonUtilityPanelHere()) return;
        setCollapsed(!collapsed);
        clearCollapsedDestination();
        queueInstall();
      });
      header.prepend(button);
    }
    const action = collapsed ? 'reduce' : 'expand';
    if (button.dataset.yofiFullscreenAction !== action) {
      button.querySelector('svg').innerHTML = FULLSCREEN_GLYPHS[action];
      button.dataset.yofiFullscreenAction = action;
      const label = collapsed ? 'Restore split view' : 'Expand entry to fullscreen';
      button.setAttribute('aria-label', label);
      button.title = label;
      button.setAttribute('aria-expanded', String(collapsed));
    }
  }

  function installFakemonFormHeading(page) {
    const article = detailArticle(page);
    if (!(article instanceof HTMLElement)) return;
    const context = fakemonHeaderActionContext();
    const editing = !!context && (context.action === 'add' || context.action === 'edit');
    const finding = currentRoot() === 'fakemon' &&
      new URL(location.href).searchParams.get('action') === 'find';
    const form = editing || finding;
    article.classList.toggle('yofi-fakemon-form-header', form);
    article.classList.toggle('yofi-fakemon-find-header', finding);
    if (form) {
      // A reused card must not carry a species/detail header grid into a
      // utility form. Leave the native buttons and Svelte title in place.
      article.classList.remove('yofi-fixed-chevron-header', 'yofi-three-zone-header', 'yofi-species-titlebar');
      article.querySelector(':scope > header')?.classList.remove('yofi-centered-titlebar');
    }
    if (!editing || context.action !== 'edit') return;
    const title = article.querySelector(':scope > header > .title');
    if (!(title instanceof HTMLElement)) return;
    // Keep the Svelte-owned text node so future route updates still work.
    const label = title.querySelector(':scope > .yofi-fakemon-title-text') || title;
    const text = Array.from(label.childNodes)
      .find(node => node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim());
    if (text) {
      const shorter = text.nodeValue.replace(/^(\s*)Edit\s+(?=\S)/i, '$1');
      if (shorter !== text.nodeValue) text.nodeValue = shorter;
    }
  }

  /* The native SearchField always contains input[type=search].  Detect
     actual searchable sidebars instead of hard-coding the section name;
     this also covers any future category using the native component.
     Toggling a class avoids a broad :has() selector over 1,000+ live rows. */
  function installNativeSearchControls(side){
    if(!(side instanceof HTMLElement))return;
    for(const input of side.querySelectorAll('input[type="search"], input[placeholder*="Search" i]')){
      if(!(input instanceof HTMLInputElement))continue;
      input.setAttribute('autocorrect','off');
      input.setAttribute('autocapitalize','none');
      input.setAttribute('autocomplete','off');
      input.spellcheck=false;
      // Keep the native Svelte input exactly where it is. A wrapping element
      // would disrupt SearchField styles or Svelte's DOM reconciliation.
      const host=input.parentElement;
      if(!(host instanceof HTMLElement))continue;
      let clear=[...host.children].find(e=>e.classList?.contains('yofi-search-clear'));
      if(!(clear instanceof HTMLButtonElement)){
        clear=document.createElement('button');clear.type='button';
        clear.className='yofi-search-clear';clear.textContent='×';
        clear.setAttribute('aria-label','Clear search');clear.title='Clear search';
        clear.addEventListener('pointerdown',ev=>{ev.preventDefault();});
        clear.addEventListener('click',ev=>{
          ev.preventDefault();ev.stopPropagation();
          if(input.value){
            input.value='';
            input.dispatchEvent(new Event('input',{bubbles:true}));
            input.dispatchEvent(new Event('change',{bubbles:true}));
          }
          try{input.focus({preventScroll:true});}catch(_){input.focus();}
        });
      }
      input.classList.add('yofi-search-clear-space');
      clear.hidden=false;
      // Insert directly after Svelte's search input, BEFORE its result count.
      // The flex row does the positioning even while search results change.
      if(clear.previousElementSibling!==input)input.after(clear);
      clear.style.removeProperty('left');
      clear.style.removeProperty('top');
    }
  }

  function syncSearchListContainment(side) {
    if (!(side instanceof HTMLElement)) return;
    const searchable = !!side.querySelector('input[type="search"], input[placeholder*="Search" i]');
    side.classList.toggle('yofi-search-list-contained', searchable);
    // Keep the existing warm desktop species list while its SearchField loads.
    // Every other searchable category gets the SAME warm/fullscreen geometry.
    side.parentElement?.classList.toggle('yofi-search-list-page', searchable || isSpeciesRoot());
  }

  function normalizeSpeciesGenderData(article) {
    if (!article?.querySelector('section.stats')) return;
    const metadata = article.querySelector('section.info > div:first-child > dl');
    const id = metadata && [...metadata.children].find(el => el.tagName === 'DD');
    // The live site can show 1:1 for Nidoran; leave its original metadata alone.
    // Only QOL decides the semantic override; hero consumes this read-only hint.
    const number = Number((id?.textContent || '').replace(/^\s*#/, '').trim());
    const override = currentRoot() === 'pokemon' && number === 29 ? 'female'
      : currentRoot() === 'pokemon' && number === 32 ? 'male' : '';
    if (override) article.dataset.yofiForcedSex = override;
    else delete article.dataset.yofiForcedSex;
  }

  function installOnPage(page) {
    if (!(page instanceof HTMLElement)) return;
    syncBrowserTier();

    if (excludedHere()) {
      setCollapsed(false);
      return;
    }

    const side = page.querySelector(":scope > .side");
    const main = page.querySelector(":scope > main");

    if (!(side instanceof HTMLElement) || !(main instanceof HTMLElement)) {
      return;
    }
    syncSearchListContainment(side);
    installNativeSearchControls(side);
    if (currentRoot() === 'pokemon') {
      const table = side.querySelector('table');
      if (table && table.getAttribute('data-sveltekit-preload-data') !== 'hover')
        table.setAttribute('data-sveltekit-preload-data','hover');
    }

    // Card.svelte nests the article inside main > .container. A direct-child
    // selector silently skipped ALL card-width tiers, including the scores edge.
    preparePendingListCard(detailArticle(page));
    syncEntryTier(main.querySelector(":scope > .container > article")
      ?? main.querySelector("article"));
    consumeCollapsedDestinationIfHere();
    applyStateForCurrentUrl(page);
    // Other entry routes restore their last focus state during full reload.
    if (!pendingListSelection && isDetailRoute() && rememberedFullscreenHere() && !collapsed) setCollapsed(true);
    decorateSpeciesListSexNames(page);
    refreshTitleNavigation(page);
    installEntrySwipe(page);
    normalizeSpeciesGenderData(main.querySelector("article"));
    installPortraitControl(page);
    installFakemonHeaderActions(page);
    installFakemonFormHeading(page);
    installFindByIdCancel(page);
    installSpeciesTitlebar(page);
    if (isSpeciesRoot()) renderHeaderTypePictograms(detailArticle(page)?.querySelector(":scope > header"));
    else installUniversalEntryTitlebar(page);
    installFullscreenToggle(page);
    // The native metadata supplies the card ID directly; no hero dependency.
    const speciesArticle = main.querySelector('article');
    syncSpeciesHeaderId(speciesArticle);
    centerPokemonDexId(speciesArticle?.querySelector(':scope > header'));
    const detailCard = main.querySelector("article");
    if (pendingListCardMatches(detailCard) && pendingListSelection.article === detailCard) {
      const presentation = window.__yofiSpeciesCardPresentation;
      if (typeof presentation?.prepare === 'function') presentation.prepare();
      else {
        document.dispatchEvent(new CustomEvent('yofi:species-card-before-reveal', {
          detail: {article:detailCard,routeKey:`${pendingListSelection.context.kind}:${pendingListSelection.context.id}`}
        }));
        completePendingListCard(detailCard);
      }
    }
    if (detailWidthObserver && observedDetailCard !== detailCard) {
      detailWidthObserver.disconnect();
      observedDetailCard = detailCard;
      if (detailCard) detailWidthObserver.observe(detailCard);
    }
  }

  /* The site's native mobile footer starts collapsed, but its expanded state
   * persists across Svelte client-side navigation. When opening a fullscreen
   * entry, return the vertical space to the entry card by closing the native
   * footer through its own button. Do it only ONCE per entry/element: repeated
   * installs must not fight a deliberate user tap on "More". */
  let compactFooterRoute = null;
  let compactFooterToggle = null;
  function restoreCompactFooterOnEntry() {
    if (!collapsed || !isDetailRoute()) {
      compactFooterRoute = null;
      compactFooterToggle = null;
      return;
    }
    const toggle = document.querySelector(
      'footer .small-screen button[aria-controls="site-footer-more"]'
    );
    if (!(toggle instanceof HTMLButtonElement)) return;
    const route = fullscreenRouteKey(location.href);
    if (compactFooterRoute === route && compactFooterToggle === toggle) return;
    compactFooterRoute = route;
    compactFooterToggle = toggle;
    if (toggle.getAttribute("aria-expanded") === "true") toggle.click();
  }

  /* Settings and preferences (v0.10.16). State is shared by Settings,
   * the native site dialog, and the compact site dropdown. None of this
   * controls the separately preserved Pokémon/Fakémon/Pokédex switch. */
  const VALID_POKEMON_TYPES = new Set(
    'normal fire fighting water flying grass poison electric ground psychic rock ice bug dragon ghost dark steel fairy'.split(' '));

  function siteLocale() {
    let raw;
    try { raw = localStorage.getItem('language-preference'); } catch (_) {}
    const urlLang = pathSegments()[0];
    if (['en','es','fr','de','pt'].includes(urlLang)) raw = urlLang;
    raw ||= document.documentElement.lang || 'en';
    const code = raw.toLowerCase().slice(0,2);
    return ['en','es','fr','de','pt'].includes(code) ? code : 'en';
  }

  const SETTINGS_LABELS = Object.freeze({
    en: { theme:'Theme',day:'Light',night:'Dark',pokedex:'Pokédex Style Menu',
      fullscreen:'Full Screen Default',rules:'Rules Version',beta:'Beta Testing',
      on:'On',off:'Off',language:'Language',settings:'Settings',official:'“Official” Fakémon' },
    es: { theme:'Tema',day:'Claro',night:'Oscuro',pokedex:'Menú estilo Pokédex',
      fullscreen:'Pantalla completa predeterminada',rules:'Versión de las reglas',beta:'Pruebas beta',
      on:'Sí',off:'No',language:'Idioma',settings:'Ajustes',official:'Fakémon «oficiales»' },
    fr: { theme:'Thème',day:'Clair',night:'Sombre',pokedex:'Menu style Pokédex',
      fullscreen:'Plein écran par défaut',rules:'Version des règles',beta:'Tests bêta',
      on:'Oui',off:'Non',language:'Langue',settings:'Paramètres',official:'Fakémon « officiels »' },
    de: { theme:'Design',day:'Hell',night:'Dunkel',pokedex:'Pokédex-Menüstil',
      fullscreen:'Standardmäßig Vollbild',rules:'Regelversion',beta:'Beta-Tests',
      on:'Ein',off:'Aus',language:'Sprache',settings:'Einstellungen',official:'„Offizielle“ Fakémon' },
    pt: { theme:'Tema',day:'Claro',night:'Escuro',pokedex:'Menu no estilo Pokédex',
      fullscreen:'Tela cheia por padrão',rules:'Versão das regras',beta:'Testes beta',
      on:'Ligado',off:'Desligado',language:'Idioma',settings:'Configurações',official:'Fakémon “oficiais”' }
  });
  function localized(key) { return (SETTINGS_LABELS[siteLocale()] || SETTINGS_LABELS.en)[key] || key; }

  let officialPanel = null;
  const OLD_OFFICIAL_FAKEMON = Object.freeze([
    ['M0VQPQMCKB5BZ','f5d3c413-13ab-46b4-baac-cb6a9456569d'],
    ['VCDM1WSWKX3XC','12627782-bfd0-417a-a5c2-d50a3de4e55e'],
    ['XDRJZRS1PKK7V','ae965fd8-b4a9-4eac-b10f-ffe3644cf4c8'],
    ['BWMC6BSH0WZDR','9c6112af-c5f0-495c-8c4f-9c95497805e1'],
    ['4EXG4UUMEBV5S','e7c00151-a545-43ec-aadb-ade06569db62'],
    ['CER1BHMJSG4J9','86d8122a-fd96-48ec-b91a-bd3ad97268f2'],
    ['S67VFHXFN9MF7','dbbfd85c-78f5-4c2b-858a-b220e062c544'],
    ['7SBDF1PSXS533','43e41160-23e9-4b13-b59f-8b28e0651d88'],
    ['MTBTQKX47K09J','b5a1c8a2-4fbd-44a2-93a5-b10bedb91acf'],
    ['8544V64Y4WZH7','202df03e-35e4-4e9b-885e-7d196e268ea8'],
    ['6WD99HM090QTG','a75de62b-6cfb-43db-9074-34c484b2d829'],
    ['JPMYYCBZBD19G','7c8522c4-a3f1-4111-b5c1-a7c30bb3d159']
  ]);
  // Only saved Fakemon record identities count here; displayed names, sorting,
  // filters, and decorative DOM rewrites cannot change this answer.
  let officialPresenceActive = false;
  let officialPresenceKey = null;
  let allOldOfficialFakemonPresent = false;
  function savedFakemonFingerprint() {
    const entries = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith('fakemon::')) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        let entry;
        try { entry = JSON.parse(raw); } catch (_) { continue; }
        if (entry?.id) entries.push(`${key.slice(9)}:${entry.id}`);
      }
    } catch (_) { /* Storage disabled; retain an available recovery option. */ }
    entries.sort();
    return entries;
  }
  function refreshOfficialAvailability(force = false) {
    const ids = savedFakemonFingerprint();
    const fingerprint = ids.join('|');
    if (!force && fingerprint === officialPresenceKey) return;
    officialPresenceKey = fingerprint;
    const present = new Set(ids.map(entry => entry.slice(entry.indexOf(':') + 1).toLowerCase()));
    allOldOfficialFakemonPresent = OLD_OFFICIAL_FAKEMON.every(([, id]) => present.has(id.toLowerCase()));
  }
  function syncOfficialAvailabilityForRoute() {
    const isFakemon = currentRoot() === 'fakemon';
    if (!isFakemon) { officialPresenceActive = false; return; }
    if (!officialPresenceActive) {
      officialPresenceActive = true;
      refreshOfficialAvailability(true); // Once per entry into the Fakemon section.
    }
  }

  function readdOldOfficialFakemon() {
    // Mirrors the published FakemonLocalStorage.add and
    // OfficialFakemonRemovedBanner.readdOfficialFakemon implementations.
    for (const [readKey,id] of OLD_OFFICIAL_FAKEMON) {
      const key='fakemon::'+readKey;
      let previous={};
      try { previous=JSON.parse(localStorage.getItem(key)||'{}')||{}; } catch (_) {}
      localStorage.setItem(key,JSON.stringify({id,writeKey:previous.writeKey}));
    }
    localStorage.setItem('OfficialFakemonRemovedBanner','true');
    officialPanel?.remove(); officialPanel=null;
    setCollapsed(false);clearCollapsedDestination();
    location.assign(navUI?.fakemon?.href || new URL('/fakemon',location.origin).href);
  }
  function closeOfficialFakemonPanel() {
    const focus = officialPanel?.returnFocus;
    officialPanel?.remove();officialPanel=null;
    if (focus?.isConnected) focus.focus({preventScroll:true});
  }
  function showOfficialFakemonPanel() {
    closeOfficialFakemonPanel();
    const focus = document.activeElement;
    const backdrop=document.createElement('div');
    backdrop.className='yofi-official-backdrop';
    const panel=document.createElement('section');
    panel.className='yofi-official-panel';
    panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
    panel.setAttribute('aria-labelledby','yofi-official-title');
    const close=document.createElement('button');
    close.type='button';close.className='yofi-official-close';
    close.setAttribute('aria-label','Close');close.textContent='×';
    close.addEventListener('click',closeOfficialFakemonPanel);
    const heading=document.createElement('h2');heading.id='yofi-official-title';
    heading.textContent='"Official" Fakémon';
    const summary=document.createElement('p');
    summary.textContent='Previously, this site had some unofficial fakémon listed under the official pokémon list. They have been removed to keep the official list official. These fakémon included Brawleon, Minereon, Droideon, Terreon, Specteon, Eeveon, Pesteon, Aereon, Drakeon, Toxeon, Rookite, and Belseraph.';
    const explanation=document.createElement('p');
    explanation.append('For backward compatibility, you may re-add these fakémon to your ');
    const library=document.createElement('a');
    library.href=navUI?.fakemon?.href || '/fakemon'; library.textContent='Fakémon Library';
    explanation.append(library,' using the button below.');
    library.addEventListener('click', closeOfficialFakemonPanel);
    const actions=document.createElement('p'); actions.style.textAlign='center';
    const add=document.createElement('button');
    add.type='button'; add.className='yofi-official-readd';
    add.textContent='Re-add Old Fakémon';
    add.addEventListener('click',readdOldOfficialFakemon);
    actions.appendChild(add);
    panel.append(close,heading,summary,explanation,actions);
    backdrop.appendChild(panel);
    backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeOfficialFakemonPanel();});
    backdrop.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();closeOfficialFakemonPanel();}
      if(e.key==='Tab'){
        const buttons=Array.from(panel.querySelectorAll('button,a[href]'));
        const i=buttons.indexOf(document.activeElement);
        if(e.shiftKey&&i===0){e.preventDefault();buttons[buttons.length-1].focus();}
        else if(!e.shiftKey&&i===buttons.length-1){e.preventDefault();buttons[0].focus();}
      }
    });
    backdrop.returnFocus=focus;
    document.body.appendChild(backdrop);officialPanel=backdrop;
    close.focus({preventScroll:true});
  }

  function createChoiceRow(key, values, selected, callback, labeler = localized) {
    const row=document.createElement('div');row.className='yofi-settings-pref';
    row.id='yofi-preference-'+key;
    const label=document.createElement('span');label.className='yofi-pref-label';
    label.textContent=localized(key)+':';
    const group=document.createElement('div');group.className='yofi-settings-choice';
    group.setAttribute('role','group');group.setAttribute('aria-label',localized(key));
    for(const val of values){
      const button=document.createElement('button');button.type='button';
      button.dataset.value=String(val);
      button.textContent=typeof val==='boolean' ? localized(val?'on':'off') : labeler(val).toUpperCase();
      button.setAttribute('aria-pressed',String(val===selected));
      button.addEventListener('click',()=>callback(val));
      group.appendChild(button);
    }
    row.append(label,group);return row;
  }
  function syncSettingsPreferences(){
    const host=document.querySelector('.yofi-settings-preferences');
    if(!host)return;
    const extension=window.__yofiQolThemeExtension;
    const extValid=extension && Array.isArray(extension.options) &&
      typeof extension.mode === 'function' && typeof extension.set === 'function';
    const options=extValid ? extension.options : ['day','night'];
    const selected=extValid ? extension.mode() : nativeDayNightMode();
    const state=`${siteLocale()}|${selected}|${options.join(',')}|${nativeSiteMenu}|${fullscreenDefault}`;
    if(host.dataset.yofiState===state)return;
    host.replaceChildren(
      createChoiceRow('theme', options, selected, value => {
        const active=window.__yofiQolThemeExtension;
        if(active && typeof active.set==='function' && active.options?.includes(value)) active.set(value);
        else setNativeDayNightMode(value);
      }, extValid && typeof extension.label === 'function' ? extension.label : localized),
      createChoiceRow('pokedex',[true,false],nativeSiteMenu,setNativeSiteMenu),
      createChoiceRow('fullscreen',[true,false],fullscreenDefault,setFullscreenDefault));
    host.dataset.yofiState=state;
  }
  // Small presentation-extension contract; when no overlay is running, QOL
  // has only two native site theme choices and remains fully functional.
  window.__yofiQolThemeBridge = Object.freeze({
    mode: nativeDayNightMode,
    setNative: setNativeDayNightMode,
    syncSettings: syncSettingsPreferences,
    syncMenu: syncNativeThemeMenu,
    locale: siteLocale,
    label: localized
  });

  /* Keep the page's native interactive Language, Edition and Beta elements.
   * Static English prose in Edition/Beta is localized using its original
   * text nodes, leaving anchors and the Svelte edition selector intact. */
  const settingTextOriginal=new WeakMap();
  const SETTING_TEXT={
    es:{
      'Edition':'Versión de las reglas',
      'There are two editions of Pokémon 5e:':'Hay dos ediciones de Pokémon 5e:',
      'The original edition maintained in 2018 that was eventually discontinued.':'La edición original, mantenida en 2018, que finalmente se dejó de publicar.',
      'The current edition, updated to follow D&D 2024 and include newer Pokémon content and mechanics. This edition receives incremental updates based on player feedback.':'La edición actual, adaptada a D&D 2024 y ampliada con contenido y mecánicas de Pokémon. Esta edición recibe actualizaciones graduales basadas en los comentarios de los jugadores.',
      'You may change edition using the toggle below. Refer to the':'Puedes cambiar de edición mediante el selector de abajo. Consulta las',
      'Rules':'reglas', 'for more details.':'para obtener más información.',
      'Change Edition':'Cambiar de edición',
      'Beta Testing':'Pruebas beta',
      'The':'La página de', 'page lets you help with testing upcoming features. There you will see toggles for things I am actively working on and ensuring work bug-free (fingers crossed!).':'te permite colaborar en las pruebas de próximas funciones. Allí encontrarás opciones para probar funciones en desarrollo y ayudar a detectar errores.',
      'Caution!':'¡Atención!',
      'Features in Beta Testing are considered incomplete and may not work properly all of the time. If you find something that behaves unexpectedly or have opinions on how something should work, you can let me know by providing':'Las funciones en fase beta están incompletas y pueden fallar. Si encuentras un comportamiento inesperado o tienes sugerencias, puedes comunicármelo mediante la opción',
      'Feedback':'Comentarios',
      'Select your preferred language:':'Selecciona tu idioma preferido:',
      'Languages other than English may not have everything translated. If you would like to help translate Pokémon 5th Edition, let us know on our Discord server!':'Es posible que algunos contenidos no estén traducidos a otros idiomas. Si quieres ayudar a traducir Pokémon 5.ª edición, escríbenos en nuestro servidor de Discord.',
      'Language':'Idioma'
    },
    fr:{
      'Edition':'Version des règles',
      'There are two editions of Pokémon 5e:':'Il existe deux éditions de Pokémon 5e :',
      'The original edition maintained in 2018 that was eventually discontinued.':'La version originale, maintenue en 2018, puis abandonnée.',
      'The current edition, updated to follow D&D 2024 and include newer Pokémon content and mechanics. This edition receives incremental updates based on player feedback.':'La version actuelle, adaptée à D&D 2024 et enrichie de nouveaux contenus et mécaniques Pokémon. Elle reçoit régulièrement des mises à jour fondées sur les retours des joueurs.',
      'You may change edition using the toggle below. Refer to the':'Vous pouvez changer de version à l’aide du sélecteur ci-dessous. Consultez les',
      'Rules':'règles','for more details.':'pour en savoir plus.',
      'Change Edition':'Changer de version',
      'Beta Testing':'Tests bêta',
      'The':'La page de','page lets you help with testing upcoming features. There you will see toggles for things I am actively working on and ensuring work bug-free (fingers crossed!).':'permet de participer aux essais des prochaines fonctionnalités. Vous y trouverez des options pour tester les fonctionnalités en cours de développement et signaler les anomalies.',
      'Caution!':'Attention !',
      'Features in Beta Testing are considered incomplete and may not work properly all of the time. If you find something that behaves unexpectedly or have opinions on how something should work, you can let me know by providing':'Les fonctionnalités bêta sont inachevées et peuvent présenter des dysfonctionnements. Si vous remarquez un problème ou avez des suggestions, faites-le-moi savoir grâce aux',
      'Feedback':'commentaires',
      'Select your preferred language:':'Choisissez votre langue :',
      'Languages other than English may not have everything translated. If you would like to help translate Pokémon 5th Edition, let us know on our Discord server!':'Certaines traductions peuvent être incomplètes. Si vous souhaitez contribuer à la traduction de Pokémon 5e édition, rejoignez-nous sur notre serveur Discord.',
      'Language':'Langue'
    },
    de:{
      'Edition':'Regelversion',
      'There are two editions of Pokémon 5e:':'Es gibt zwei Editionen von Pokémon 5e:',
      'The original edition maintained in 2018 that was eventually discontinued.':'Die ursprüngliche Fassung von 2018, deren Entwicklung später eingestellt wurde.',
      'The current edition, updated to follow D&D 2024 and include newer Pokémon content and mechanics. This edition receives incremental updates based on player feedback.':'Die aktuelle Edition, angepasst an D&D 2024 und mit neuen Pokémon-Inhalten und -Mechaniken. Sie wird anhand von Rückmeldungen der Spielenden laufend verbessert.',
      'You may change edition using the toggle below. Refer to the':'Du kannst die Edition mit der Auswahl unten ändern. Weitere Informationen findest du in den',
      'Rules':'Regeln','for more details.':'.',
      'Change Edition':'Edition ändern',
      'Beta Testing':'Beta-Tests',
      'The':'Auf der Seite','page lets you help with testing upcoming features. There you will see toggles for things I am actively working on and ensuring work bug-free (fingers crossed!).':'kannst du kommende Funktionen testen. Dort findest du Schalter für Funktionen, die noch entwickelt und auf Fehler geprüft werden.',
      'Caution!':'Achtung!',
      'Features in Beta Testing are considered incomplete and may not work properly all of the time. If you find something that behaves unexpectedly or have opinions on how something should work, you can let me know by providing':'Beta-Funktionen sind noch unvollständig und funktionieren möglicherweise nicht immer zuverlässig. Wenn du Fehler bemerkst oder Vorschläge hast, sende mir bitte',
      'Feedback':'Feedback',
      'Select your preferred language:':'Wähle deine bevorzugte Sprache:',
      'Languages other than English may not have everything translated. If you would like to help translate Pokémon 5th Edition, let us know on our Discord server!':'Nicht alle Inhalte sind in jeder Sprache übersetzt. Wenn du bei der Übersetzung von Pokémon 5e helfen möchtest, melde dich auf unserem Discord-Server.',
      'Language':'Sprache'
    },
    pt:{
      'Edition':'Versão das regras',
      'There are two editions of Pokémon 5e:':'Existem duas edições de Pokémon 5e:',
      'The original edition maintained in 2018 that was eventually discontinued.':'A edição original, mantida em 2018, que acabou por ser descontinuada.',
      'The current edition, updated to follow D&D 2024 and include newer Pokémon content and mechanics. This edition receives incremental updates based on player feedback.':'A edição atual, adaptada a D&D 2024 e com novos conteúdos e mecânicas de Pokémon. Recebe atualizações graduais com base nas opiniões dos jogadores.',
      'You may change edition using the toggle below. Refer to the':'Podes alterar a edição com o seletor abaixo. Consulta as',
      'Rules':'regras','for more details.':'para mais informações.',
      'Change Edition':'Alterar edição',
      'Beta Testing':'Testes beta',
      'The':'A página de','page lets you help with testing upcoming features. There you will see toggles for things I am actively working on and ensuring work bug-free (fingers crossed!).':'permite-te ajudar a testar novas funcionalidades. Aqui encontrarás opções para experimentar funcionalidades em desenvolvimento e comunicar problemas.',
      'Caution!':'Atenção!',
      'Features in Beta Testing are considered incomplete and may not work properly all of the time. If you find something that behaves unexpectedly or have opinions on how something should work, you can let me know by providing':'As funcionalidades beta ainda estão incompletas e podem não funcionar corretamente. Se encontrares algum problema ou tiveres sugestões, envia-nos',
      'Feedback':'comentários',
      'Select your preferred language:':'Seleciona o teu idioma preferido:',
      'Languages other than English may not have everything translated. If you would like to help translate Pokémon 5th Edition, let us know on our Discord server!':'Nem todo o conteúdo está traduzido para todos os idiomas. Se quiseres ajudar a traduzir Pokémon 5.ª edição, fala connosco no nosso servidor Discord.',
      'Language':'Idioma'
    }
  };
  function translateSettingsSection(section, locale) {
    const walker=document.createTreeWalker(section,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(node.parentElement?.closest('.yofi-settings-preferences'))continue;
      if(node.parentElement?.closest('.language-setting button'))continue;
      if(!settingTextOriginal.has(node))settingTextOriginal.set(node,node.nodeValue);
      const original=settingTextOriginal.get(node);
      const trimmed=original.trim();
      // Preserve the punctuation between the edition year and its prose.
      const prefix=trimmed.match(/^:\s*/)?.[0]||'';
      const translated=(SETTING_TEXT[locale] || {})[trimmed.slice(prefix.length)];
      if(translated === undefined) continue;
      const lead=original.match(/^\s*/)?.[0]||'';
      const tail=original.match(/\s*$/)?.[0]||'';
      const next=lead+prefix+translated+tail;
      if(node.nodeValue!==next)node.nodeValue=next;
    }
  }
  function translateLanguageNames(section){
    // Use the native locale options, not a cloned or disconnected selector.
    const ul=section.querySelector('.language-setting ul[role="listbox"]');
    if(!ul)return;
    const codes=['en','es','fr','de','pt'];
    const names=['English','Español','Français','Deutsch','Português'];
    Array.from(ul.querySelectorAll('li[role="option"]')).forEach((li,i)=>{
      const code=(li.id||'').split('-').pop();
      const index=codes.indexOf(code);
      const value=names[index>=0?index:i];
      const button=li.querySelector('a,button');
      if(button&&value&&button.textContent.trim()!==value)button.textContent=value;
    });
  }
  /* Settings are identified by the EXISTING native section anchors. The
   * Svelte Card/slot nesting can differ between routes and revisions; do not
   * require a precise `.page > main article > .scrollable > section` tree.
   * Reuse native language/edition/beta components without cloning them. */
  function installSettingsPage(_page) {
    if (currentRoot() !== 'settings') return;
    const languageHeading = document.getElementById('language');
    const rulesHeading = document.getElementById('rules-version');
    const betaHeading = document.getElementById('beta-testing');
    if (!languageHeading || !rulesHeading || !betaHeading) return;
    const language = languageHeading.closest('section');
    const rules = rulesHeading.closest('section');
    const beta = betaHeading.closest('section');
    const article = languageHeading.closest('article');
    const scroll = languageHeading.closest('.scrollable');
    if (!language || !rules || !beta || !article || !scroll ||
        rules.closest('article') !== article || beta.closest('article') !== article) return;

    // Remove the original bulleted table of contents AND explanatory text;
    // retain native language, edition and beta sections with their controls.
    for (const section of Array.from(scroll.querySelectorAll('section'))) {
      if (section === language || section === rules || section === beta) continue;
      if (section.parentElement?.closest('section')) continue; // nested sections
      if (section.closest('article') !== article) continue;
      section.classList.add('yofi-settings-hidden');
      section.setAttribute('aria-hidden', 'true');
    }

    // Native heading text is Svelte-owned and may be recreated after a route
    // transition. Keep the original headings and their IDs intact.
    const locale = siteLocale();
    for (const section of [language, rules, beta]) translateSettingsSection(section, locale);
    translateLanguageNames(language);
    if (rulesHeading.textContent.trim() !== localized('rules'))
      rulesHeading.textContent = localized('rules');
    const title = article.querySelector('header > .title');
    if (title && title.textContent.trim() !== localized('settings'))
      title.textContent = localized('settings');

    // New unbulleted Settings navigation: a set of native-looking jump links.
    let index = scroll.querySelector('.yofi-settings-index');
    if (!index) {
      index = document.createElement('nav');
      index.className = 'yofi-settings-index';
      index.setAttribute('aria-label', 'Settings sections');
    }
    const entries = [
      ['language','language'], ['theme','yofi-preference-theme'],
      ['pokedex','yofi-preference-pokedex'],
      ['fullscreen','yofi-preference-fullscreen'],
      ['rules','rules-version'], ['beta','beta-testing']
    ];
    const sig = locale;
    if (index.dataset.yofiLocale !== sig || index.childElementCount !== entries.length) {
      index.replaceChildren(...entries.map(([key,id]) => {
        const link=document.createElement('a');
        link.href='#'+id;
        link.textContent=localized(key);
        return link;
      }));
      index.dataset.yofiLocale=sig;
    }
    if (index.nextElementSibling !== language) language.before(index);

    let prefs = scroll.querySelector('.yofi-settings-preferences');
    if (!prefs) {
      prefs = document.createElement('div');
      prefs.className='yofi-settings-preferences';
    }
    if (prefs.previousElementSibling !== language) language.after(prefs);
    syncSettingsPreferences();
  }

  /* Native InlineMoveLinks/InlineTmLinks and evolution name links contain
   * only text and hrefs. Canonical types come from cached SRD lists; Fakemon
   * targets use individually deduplicated read-key lookups. Never scan the
   * large side list or replace native links. SRD requests are cached and
   * failed Fakemon lookups are rate-limited to avoid install loops. */
  const typedLinkLists = new Map(); // edition:kind -> { value: Map | null }
  const visitedFakemonTypes = new Map(); // read key -> verified primary type (visited or fetched)
  const knownFakemonTypeLists = new Map(); // read key -> verified [primary, secondary?]
  const knownFakemonRatings = new Map(); // read key -> numeric species rating
  function formatFakemonRating(value) {
    if (!Number.isFinite(value)) return '';
    // Exact SpeciesRating.toString() behavior from poke5e source.
    return value <= .125 ? '⅛' : value <= .25 ? '¼'
      : value <= .5 ? '½' : String(Math.round(value));
  }
  let savedFakemonTypesHydrated = false;
  function normalizeFakemonTypeList(rawTypes) {
    const source = Array.isArray(rawTypes) ? rawTypes : typeof rawTypes === 'string' ? [rawTypes] : [];
    const result = [];
    for (const value of source) {
      if (typeof value !== 'string') continue;
      const type = value.trim().toLowerCase();
      if (!VALID_POKEMON_TYPES.has(type) || result.includes(type)) continue;
      result.push(type);
    }
    return result;
  }
  function rememberFakemonTypes(readKey, rawTypes, rawSr) {
    if (readKey && rawSr != null && rawSr !== '') {
      const sr = Number(rawSr);
      if (Number.isFinite(sr)) knownFakemonRatings.set(readKey, sr);
    }
    if (!readKey) return null;
    const types = normalizeFakemonTypeList(rawTypes);
    if (!types.length) return null;
    const previous = knownFakemonTypeLists.get(readKey);
    if (!previous || previous.length !== types.length || previous.some((value, index) => value !== types[index])) {
      knownFakemonTypeLists.set(readKey, types);
    }
    visitedFakemonTypes.set(readKey, types[0]);
    return types;
  }
  function fakemonTypesFor(readKey) {
    return readKey ? (knownFakemonTypeLists.get(readKey) || null) : null;
  }
  function hasCompleteFakemonTableData(readKey) {
    return knownFakemonTypeLists.has(readKey) && knownFakemonRatings.has(readKey);
  }
  function hydrateSavedFakemonTypes() {
    if (savedFakemonTypesHydrated) return;
    savedFakemonTypesHydrated = true;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith('fakemon::')) continue;
        let entry = null;
        try { entry = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { entry = null; }
        rememberFakemonTypes(key.slice(9), entry?.type, entry?.sr);
      }
    } catch (_) { /* Storage disabled; live fetch fallback remains available. */ }
  }
  function displayFakemonTypes(types) {
    return Array.isArray(types) ? types.map((type) => type ? type.charAt(0).toUpperCase() + type.slice(1) : '')
      .filter(Boolean).join('/') : '';
  }
  // The native Fakemon list renders only names despite having full species
  // objects internally. Cache both types and SR for the injected native cells.
  // The native Fakemon side list has names/URLs, not type metadata. For links
  // pointing at an unvisited Fakemon, read only that target's type from the
  // site's existing public read-only RPC. One request per UNIQUE read key;
  // do not fetch the entire Fakemon list or query one time per anchor.
  const pendingFakemonLinkTypes = new Set();
  const fakemonLinkTypeQueue = [];
  const fakemonLinkTypeRetryAfter = new Map();
  const FAKEMON_LINK_TYPE_MAX_CONCURRENT = 3;
  let fakemonLinkTypeInFlight = 0;
  const typedLinkRoots = new Set(['moves','tms','pokemon','fakemon']);
  function currentTypeLinkEdition() {
    try { return localStorage.getItem('rules-version') === '2018' ? '2018' : '2024'; }
    catch (_) { return '2024'; }
  }
  function typedLinkDataPath(edition, kind) {
    const locale = (location.pathname.match(/^\/(es|fr|de|pt)(?=\/)/) || [])[0] || '';
    return `${locale}/srd/v1/${edition}/${kind}.json`;
  }
  function typedLinkList(edition, kind) {
    const key = `${edition}:${kind}`;
    let state = typedLinkLists.get(key);
    if (!state) {
      state = { value: null };
      typedLinkLists.set(key, state);
      void fetch(typedLinkDataPath(edition, kind), { credentials: 'same-origin' })
        .then(response => {
          if (!response.ok) throw new Error(`SRD ${kind}: ${response.status}`);
          return response.json();
        }).then(data => {
          const result = new Map();
          if (Array.isArray(data?.values)) {
            for (const item of data.values) {
              if (kind === 'tms') {
                if (item?.id != null && typeof item.move === 'string')
                  result.set(String(item.id), item.move);
              } else if (item?.id != null) {
                const type = Array.isArray(item.type) ? item.type[0] : item.type;
                if (typeof type === 'string' && VALID_POKEMON_TYPES.has(type))
                  result.set(String(item.id), type);
              }
            }
          }
          state.value = result;
          queueInstall(); // Color visible links without remounting any list.
        }).catch(() => { state.value = new Map(); });
    }
    return state.value;
  }
  function queueFakemonLinkType(readKey) {
    if (!readKey || hasCompleteFakemonTableData(readKey) ||
        pendingFakemonLinkTypes.has(readKey) ||
        (fakemonLinkTypeRetryAfter.get(readKey) || 0) > Date.now()) return;
    pendingFakemonLinkTypes.add(readKey);
    fakemonLinkTypeQueue.push(readKey);
    pumpFakemonLinkTypes();
  }

  function pumpFakemonLinkTypes() {
    while (fakemonLinkTypeInFlight < FAKEMON_LINK_TYPE_MAX_CONCURRENT &&
        fakemonLinkTypeQueue.length) {
      const readKey = fakemonLinkTypeQueue.shift();
      // The user might have opened the card while this request was queued.
      if (hasCompleteFakemonTableData(readKey)) {
        pendingFakemonLinkTypes.delete(readKey);
        continue;
      }
      fakemonLinkTypeInFlight++;
      void fetch(`${PORTRAIT_SOURCE.endpoint}?select=read_key,type,sr`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          apikey: PORTRAIT_SOURCE.publicKey,
          Authorization: `Bearer ${PORTRAIT_SOURCE.publicKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ _read_key: readKey }),
      }).then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      }).then(data => {
        const rows = Array.isArray(data) ? data : [data];
        const row = rows.find(item => item?.read_key === readKey);
        const types = rememberFakemonTypes(readKey, row?.type, row?.sr);
        if (!types?.length) {
          // Missing/unknown type is never guessed; back off before retrying.
          fakemonLinkTypeRetryAfter.set(readKey, Date.now() + 300000);
          return;
        }
        // A valid type without a valid rating must not trigger repeated
        // RPC fetches every install frame. Keep the type; retry SR later.
        if (hasCompleteFakemonTableData(readKey)) fakemonLinkTypeRetryAfter.delete(readKey);
        else fakemonLinkTypeRetryAfter.set(readKey, Date.now() + 300000);
        queueInstall(); // Recolor native links and fill visible Fakemon list rows.
      }).catch(error => {
        // Temporary network/API failures must not cause an install/request loop.
        fakemonLinkTypeRetryAfter.set(readKey, Date.now() + 60000);
        console.warn('[Pokemon 5e QOL link type]', readKey, error);
      }).finally(() => {
        pendingFakemonLinkTypes.delete(readKey);
        fakemonLinkTypeInFlight--;
        pumpFakemonLinkTypes();
      });
    }
  }

  function typeLinkTarget(anchor) {
    let url;
    try { url = new URL(anchor.href, location.href); }
    catch (_) { return null; }
    if (url.origin !== location.origin) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    const index = parts.findIndex(item => typedLinkRoots.has(item));
    if (index < 0) return null;
    const kind = parts[index];
    // Unlike canonical species, Fakemon links use /fakemon?id=READ_KEY.
    if (kind === 'fakemon') {
      const id = url.searchParams.get('id');
      return id ? { kind, id: id.replace(/^F\./, '') } : null;
    }
    if (index + 1 >= parts.length) return null;
    return { kind, id: decodeURIComponent(parts[index + 1]) };
  }
  function installTypedLowerLinks(page) {
    const article = detailArticle(page);
    if (!(article instanceof HTMLElement) || !article.querySelector(':scope > .scrollable')) return;
    // A viewed Fakemon remains an authoritative local source; other targets
    // are resolved asynchronously by read key without opening their cards.
    if (currentRoot() === 'fakemon' && fakemonHeaderActionContext()?.action === 'info') {
      const key = fakemonHeaderActionContext()?.id;
      const types = allTypesForArticle(article);
      if (key && types.length) rememberFakemonTypes(key, types);
    }
    const edition = currentTypeLinkEdition();
    // Scan only detail content, never the 1,100+ native side-list rows.
    const links = article.querySelectorAll(':scope > .scrollable a[href]');
    for (const link of links) {
      if (!(link instanceof HTMLAnchorElement)) continue;
      const target = typeLinkTarget(link);
      if (!target) continue;
      if (target.kind === 'pokemon') decorateSpeciesSexName(link);
      link.classList.add('yofi-typed-detail-link');
      const kind = target.kind;
      let type = null;
      if (kind === 'tms') {
        const tmId = target.id.replace(/^0+(?=\d)/, '');
        const moveId = typedLinkList(edition, 'tms')?.get(tmId);
        if (moveId) type = typedLinkList(edition, 'moves')?.get(moveId);
        else typedLinkList(edition, 'moves');
      } else if (kind === 'fakemon') {
        type = fakemonTypesFor(target.id)?.[0] || visitedFakemonTypes.get(target.id) || null;
        if (!type) queueFakemonLinkType(target.id);
      } else {
        type = typedLinkList(edition, kind)?.get(target.id);
      }
      if (type && VALID_POKEMON_TYPES.has(type)) {
        if (link.dataset.yofiTargetType !== type) link.dataset.yofiTargetType = type;
      } else if (link.hasAttribute('data-yofi-target-type')) {
        link.removeAttribute('data-yofi-target-type');
      }
    }

  }

  /* PokemonSpeciesList uses headers with ratio 3:3:1, with SR
   * largeScreenOnly at 50rem. FakemonList uses the SAME SortableTable and
   * BubbleRow components but supplies only its Name header/cell.
   * Clone those already-rendered native elements so their Svelte-scoped
   * component CSS, row shadows, primary color and hover styling match
   * Pokemon exactly. Do not replace the table or move Svelte-owned rows. */
  const fakemonTableState = new WeakMap();
  const FAKEMON_NATIVE_COLUMNS = ['name', 'type', 'sr'];
  let fakemonTableSort = { key: null, reversed: false };

  function sortFakemonTableColumn(key) {
    if (!FAKEMON_NATIVE_COLUMNS.includes(key)) return;
    if (fakemonTableSort.key === key && !fakemonTableSort.reversed) {
      fakemonTableSort = { key, reversed: true };
    } else if (fakemonTableSort.key === key) {
      fakemonTableSort = { key: null, reversed: false };
    } else {
      fakemonTableSort = { key, reversed: false };
    }
  }

  function cloneNativeFakemonColumn(nativeCell, key) {
    const clone = nativeCell.cloneNode(false);
    clone.classList.remove('primary', 'last-visible-cell', 'large-screen-only');
    if (key === 'type') clone.classList.add('last-visible-cell');
    if (key === 'sr') clone.classList.add('last-visible-cell', 'large-screen-only');
    clone.dataset.yofiFakemonColumn = key;
    // BubbleRow.Cell supplies the original scoped Svelte classes via clone.
    return clone;
  }

  function nativeFakemonSortHeader(nameHeader, key) {
    const header = nameHeader.cloneNode(true);
    header.classList.remove('large-screen-only');
    if (key === 'sr') header.classList.add('large-screen-only');
    header.dataset.yofiFakemonColumn = key;
    header.style.setProperty('--alignment', `var(--${key}-alignment)`);
    const button = header.querySelector(':scope > button');
    if (button) {
      button.replaceChildren();
      const text = document.createElement('span');
      text.textContent = key === 'type' ? localized('type') : 'SR';
      button.appendChild(text);
      button.type = 'button';
    }
    return header;
  }

  function ensureFakemonHeader(table, state) {
    const headerRow = table.querySelector(':scope > thead > tr');
    if (!(headerRow instanceof HTMLTableRowElement)) return false;
    const nativeHeader = headerRow.cells[0];
    const nameButton = nativeHeader?.querySelector(':scope > button');
    if (!(nativeHeader instanceof HTMLTableCellElement) ||
        !(nameButton instanceof HTMLButtonElement)) return false;
    if (headerRow.cells.length > 1 &&
        !headerRow.querySelector('[data-yofi-fakemon-column="type"]')) return false;

    // The native Name th/button remains Svelte-owned. Its original handler
    // is intercepted in the table's capture phase to use the SAME three-
    // state sort cycle as the new Type and SR buttons.
    nativeHeader.dataset.yofiFakemonColumn = 'name';
    for (const key of ['type', 'sr']) {
      let cell = headerRow.querySelector(`[data-yofi-fakemon-column="${key}"]`);
      if (!cell) {
        cell = nativeFakemonSortHeader(nativeHeader, key);
        headerRow.appendChild(cell);
      }
      const button = cell.querySelector(':scope > button');
      const span = button?.querySelector(':scope > span');
      const label = key === 'type' ? localized('type') : 'SR';
      if (span && span.textContent !== label) span.textContent = label;
    }

    for (const th of headerRow.cells) {
      const key = th.dataset.yofiFakemonColumn;
      if (!FAKEMON_NATIVE_COLUMNS.includes(key)) continue;
      const button = th.querySelector(':scope > button');
      if (!button) continue;
      const active = fakemonTableSort.key === key;
      const existing = button.querySelector(':scope > .sort-arrow');
      if (!active) {
        existing?.remove();
      } else {
        let arrow = existing;
        if (!arrow) {
          arrow = document.createElement('span');
          const scope = Array.from(button.classList).find((cls) => cls.startsWith('svelte-'));
          arrow.className = `sort-arrow${scope ? ' ' + scope : ''}`;
          button.appendChild(arrow);
        }
        const glyph = fakemonTableSort.reversed ? '▲' : '▼';
        if (arrow.textContent !== glyph) arrow.textContent = glyph;
      }
    }

    if (!state.handlerInstalled) {
      // Delegating from TABLE during capture runs before Svelte's button
      // listener, preventing dueling independent sort states.
      table.addEventListener('click', (event) => {
        const button = event.target instanceof Element
          ? event.target.closest('th > button') : null;
        if (!button || !table.querySelector(':scope > thead')?.contains(button)) return;
        const th = button.closest('th');
        const key = th?.dataset.yofiFakemonColumn;
        if (!FAKEMON_NATIVE_COLUMNS.includes(key)) return;
        event.stopPropagation();
        event.stopImmediatePropagation();
        sortFakemonTableColumn(key);
        // DOM order and row identity remain Svelte-owned; update only CSS
        // flex order, header glyphs, and the script's supplemental cells.
        installFakemonListTypes(activeRoutePage());
      }, true);
      state.handlerInstalled = true;
    }
    return true;
  }

  function applyFakemonTableSort(rows) {
    const { key, reversed } = fakemonTableSort;
    if (!key) {
      for (const item of rows) if (item.row.style.order) item.row.style.removeProperty('order');
      return;
    }
    const ordered = rows.slice().sort((a, b) => {
      let value = 0;
      if (key === 'name') value = a.name.localeCompare(b.name);
      else if (key === 'type') value = a.type.localeCompare(b.type);
      else if (key === 'sr') value = a.sr - b.sr;
      if (!Number.isFinite(value)) value = 0;
      return (reversed ? -1 : 1) * value || a.index - b.index;
    });
    ordered.forEach((item, index) => {
      const value = String(index);
      if (item.row.style.order !== value) item.row.style.order = value;
    });
  }

  function installFakemonListTypes(page) {
    if (currentRoot() !== 'fakemon') return;
    const side = page?.querySelector(':scope > .side');
    if (!(side instanceof HTMLElement)) return;
    const table = side.querySelector('table');
    const body = table?.querySelector(':scope > tbody');
    if (!(table instanceof HTMLTableElement) ||
        !(body instanceof HTMLTableSectionElement)) return;
    const nativeRows = Array.from(body.rows);
    if (!nativeRows.length) return;

    const state = fakemonTableState.get(table) || { handlerInstalled: false };
    if (!ensureFakemonHeader(table, state)) return;
    fakemonTableState.set(table, state);
    if (!table.classList.contains('yofi-fakemon-native-columns'))
      table.classList.add('yofi-fakemon-native-columns');
    // Match SortableTable.svelte's actual ratio declarations, not 50/50.
    if (table.style.getPropertyValue('--large-table-columns') !== '3fr 3fr 1fr')
      table.style.setProperty('--large-table-columns', '3fr 3fr 1fr');
    if (table.style.getPropertyValue('--small-table-columns') !== '3fr 3fr')
      table.style.setProperty('--small-table-columns', '3fr 3fr');

    const items = [];
    for (const row of nativeRows) {
      const nameCell = row.cells[0];
      const anchor = nameCell?.querySelector('a[href]');
      const target = anchor ? typeLinkTarget(anchor) : null;
      if (!(nameCell instanceof HTMLTableCellElement) || target?.kind !== 'fakemon') continue;
      // The native Name cell originally was also the last visible cell.
      // Removing only that modifier gives the same native primary cell as
      // PokemonSpeciesList, including its Svelte-generated CSS scope.
      nameCell.classList.remove('last-visible-cell');
      let typeCell = row.querySelector(':scope > td[data-yofi-fakemon-column="type"]');
      let srCell = row.querySelector(':scope > td[data-yofi-fakemon-column="sr"]');
      if (!typeCell && row.cells.length === 1) {
        typeCell = cloneNativeFakemonColumn(nameCell, 'type');
        row.appendChild(typeCell);
      }
      if (!srCell && row.cells.length === 2) {
        srCell = cloneNativeFakemonColumn(nameCell, 'sr');
        row.appendChild(srCell);
      }
      if (!typeCell || !srCell) continue;
      const types = fakemonTypesFor(target.id);
      const sr = knownFakemonRatings.get(target.id);
      const typeLabel = displayFakemonTypes(types);
      const srLabel = formatFakemonRating(sr);
      if (typeCell.textContent !== typeLabel) typeCell.textContent = typeLabel;
      if (srCell.textContent !== srLabel) srCell.textContent = srLabel;
      if (!hasCompleteFakemonTableData(target.id)) queueFakemonLinkType(target.id);
      if (types?.length) {
        const local = `var(--skin-${types[0]}-bg)`;
        if (row.style.getPropertyValue('--skin-local-bg') !== local)
          row.style.setProperty('--skin-local-bg', local);
      }
      items.push({row, name: anchor.textContent.trim(), type: types?.join(', ') || '',
        sr: sr ?? 0, index: items.length });
    }
    applyFakemonTableSort(items);
    // Refresh the cached native-link index when the visible row order
    // changes; changing the CSS order does not otherwise mark it dirty.
    const orderSignature = `${fakemonTableSort.key || ''}/${fakemonTableSort.reversed}:` +
      items.map((item) => `${item.name}=${item.row.style.order || ''}`).join('|');
    if (state.navOrderSignature !== orderSignature) {
      state.navOrderSignature = orderSignature;
      const scan = sideListScans.get(side);
      if (scan) scan.dirty = true;
      if (isDetailRoute()) refreshTitleNavigation(page);
    }
  }

  function headerTypeName(segment) {
    if (!(segment instanceof Element)) return null;
    const recorded = segment.dataset.yofiHeaderType;
    if (recorded && VALID_POKEMON_TYPES.has(recorded)) return recorded;
    const ownStyle = segment.style.getPropertyValue('--skin-local-bg');
    const cssType = ownStyle.match(/--skin-([a-z]+)-bg/i)?.[1];
    if (cssType && VALID_POKEMON_TYPES.has(cssType)) return cssType;
    const original = segment.querySelector('.yofi-type-original')?.textContent ||
      segment.querySelector('.unskew')?.textContent || segment.textContent || '';
    const clean = original.toLowerCase().replace(/[^a-z]/g, '');
    return VALID_POKEMON_TYPES.has(clean) ? clean : null;
  }

  function allTypesForArticle(article) {
    const result = [];
    for (const segment of Array.from(article.querySelectorAll('.type-tag > .type'))) {
      const type = headerTypeName(segment);
      if (type && !result.includes(type)) result.push(type);
    }
    return result;
  }

  function activeRoutePage() {
    const pages = Array.from(document.querySelectorAll(PAGE_SELECTOR));
    if (!pages.length) return null;
    // During SvelteKit cross-section transitions, the old layout can remain
    // in the DOM. Its list is NOT the current category's navigation source.
    const routeTheme = { pokemon: 'red', fakemon: 'pink',
      moves: 'blue', tms: 'purple' }[currentRoot()];
    if (routeTheme) {
      const matches = pages.filter((page) =>
        !!page.closest(`.theme-${routeTheme}`));
      // Svelte may update the URL before the destination layout mounts.
      // Do not process the previous category's list against the new URL.
      return matches.length ? matches[matches.length - 1] : null;
    }
    return pages[pages.length - 1];
  }

  function detailArticle(page) {
    const articles = Array.from(page?.querySelectorAll?.(':scope > main article') || []);
    return articles.find(article => article.getClientRects().length > 0) || articles[0] || null;
  }
  function visibleDetailArticle() {
    return Array.from(document.querySelectorAll('.page > main article'))
      .find(article => article.getClientRects().length > 0) || null;
  }

  function install() {
    syncBrowserTier();
    syncSpeciesRouteClass();
    if (currentRoot() === 'fakemon') {
      const action = new URL(location.href).searchParams.get('action');
      if (action && action !== 'info') {
        neighborResponseCache.clearFakemon();
        clearFakemonPortraitRecords();
      }
    }
    const page = activeRoutePage();
    syncPreferredPortraitBeforePaint();
    syncOfficialAvailabilityForRoute();
    installSidebarAddById(page);
    if (page) installOnPage(page);
    installBrowseNavigation(page);
    syncNativeThemeMenu();
    installSettingsPage(page);
    if (currentRoot() === 'fakemon') hydrateSavedFakemonTypes();
    if (page) installTypedLowerLinks(page);
    if (page) decorateEvolutionSexNames(detailArticle(page));
    if (page) installFakemonListTypes(page);
    restoreCompactFooterOnEntry();
  }

  function safeInstall(reason) {
    const state = window.__yofiQolBootstrapStatus;
    if (state?.version === VERSION) state.installAttempts = (state.installAttempts || 0) + 1;
    try {
      install();
      if (state?.version === VERSION) state.lastInstallError = null;
      return true;
    } catch (error) {
      console.error(`[Poké5e QOL ${VERSION}] ${reason} install failed; awaiting a retry:`, error);
      if (state?.version === VERSION) {
        state.installFailures = (state.installFailures || 0) + 1;
        state.lastInstallError = String(error?.stack || error);
      }
      return false;
    }
  }

  function queueInstall() {
    if (installQueued) return;

    installQueued = true;

    requestAnimationFrame(() => {
      installQueued = false;
      safeInstall('queued');
    });
  }

  function startRuntime() {
    if (observerStarted || !document.body) return;
    observerStarted = true;
    const bootstrap = window.__yofiQolBootstrapStatus;
    if (bootstrap?.version === VERSION) bootstrap.phase = 'running';
    startPortraitEvents();
    startBrowseEvents();

    let listWarmIntentTimer = null;
    let listWarmIntentAnchor = null;
    const cancelListWarmIntent = () => {
      clearTimeout(listWarmIntentTimer);
      listWarmIntentTimer = null;
      listWarmIntentAnchor = null;
    };
    const warmListIntent = event => {
      const anchor = event.target instanceof Element ? event.target.closest('td.primary > a[href]') : null;
      if (!anchor?.closest('.page > .side') || currentRoot() !== 'pokemon') return;
      const context = portraitContextFromHref(anchor.href);
      if (!context || navigator.connection?.saveData) return;
      if (event.type === 'pointerover' && anchor.contains(event.relatedTarget)) return;
      anchor.setAttribute('data-sveltekit-preload-data','hover');
      cancelListWarmIntent();
      if (event.type === 'pointerover') {
        listWarmIntentAnchor = anchor;
        listWarmIntentTimer = setTimeout(() => {
          cancelListWarmIntent();
          if (anchor.isConnected && currentRoot() === 'pokemon') warmNeighborPortrait(anchor,'auto');
        },100);
      } else warmNeighborPortrait(anchor,'auto');
    };
    document.addEventListener('pointerout',event => {
      if (listWarmIntentAnchor?.contains(event.target) && !listWarmIntentAnchor.contains(event.relatedTarget))
        cancelListWarmIntent();
    },{capture:true,passive:true});
    for (const type of ['pointerover','focusin','touchstart','mousedown'])
      document.addEventListener(type,warmListIntent,{capture:true,passive:true});

    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const page = anchor.closest(PAGE_SELECTOR);
      if (!(page instanceof HTMLElement)) return;
      if (excludedHere()) return;

      const side = page.querySelector(":scope > .side");

      if (!(side instanceof HTMLElement) || !side.contains(anchor)) {
        return;
      }

      // Check the clicked native anchor directly. Do not scan the entire
      // Pokemon list merely to confirm that the clicked entry was in it.
      if (!anchor.matches('tbody a[href], .lists-container a[href], '
        + '.trainer-list a[href], reorder-list a[href], li a[href], reorder-item a[href]') ||
        !isVisibleCandidate(anchor) || !isDetailRoute(anchor.href)) return;

      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey ||
          event.shiftKey || event.altKey) return;
      if (!preservingSyntheticNavigation) {
        cancelListWarmIntent();
        const context = portraitContextFromHref(anchor.href);
        if (context && !navigator.connection?.saveData) {
          warmNeighborPortrait(anchor,'auto'); // Selected requests start first.
          const neighbors = listNeighborsForAnchor(anchor);
          if (neighbors) queueMicrotask(() => warmResultNeighbors(neighbors.previous,neighbors.next,
            `${normalizeUrl(anchor.href)}|${neighbors.previous ? navigationHrefKey(neighbors.previous) : ''}|${neighbors.next ? navigationHrefKey(neighbors.next) : ''}`));
        }
        clearCollapsedDestination();
        if (fullscreenDefault && context && !collapsed) {
          pendingSelectionExpiresAt = 0;
          pendingListSelection = {url:normalizeUrl(anchor.href),from:normalizeUrl(location.href),
            context,label:nativeSelectionLabel(anchor),article:null};
          rememberCollapsedDestination(anchor.href);
          if (pendingListSelection.url === normalizeUrl(location.href)) queueInstall();
        } else if (fullscreenDefault) {
          pendingSelectionExpiresAt = Date.now() + 2500;
          rememberCollapsedDestination(anchor.href);
          setCollapsed(true);
        } else {
          pendingSelectionExpiresAt = 0;
          setCollapsed(false);
        }
      }
    }, true);

    consumeCollapsedDestinationIfHere();
    safeInstall('initial');

    // A filtered observer replaces the former page-wide unconditional
    // re-install. Svelte adds/removes hundreds of Move/Pokemon list rows;
    // those row mutations do not change the header/hero/settings layout.
    // Side-list indices are already invalidated by sideListScan().
    let sideSettleTimer = null;
    const listMutation = (mutation) => {
      const target = mutation.target instanceof Element ? mutation.target
        : mutation.target.parentElement;
      return !!target?.closest('.page > .side') &&
        !!target.closest('tbody, table, .lists-container, reorder-list, '
          + 'reorder-item, .trainer-list');
    };
    const observer = new MutationObserver((changes) => {
      const detailHrefOnly = changes.length > 0 && changes.every(change => {
        if (change.type !== 'attributes' || change.attributeName !== 'href') return false;
        const target = change.target instanceof Element ? change.target : change.target.parentElement;
        return !!target?.closest('.page > main article');
      });
      if (detailHrefOnly) {
        const page = activeRoutePage();
        if (page) installTypedLowerLinks(page);
        return;
      }
      let sideRowsChanged = false;
      let otherChange = false;
      for (const change of changes) {
        if (listMutation(change)) sideRowsChanged = true;
        else { otherChange = true; break; }
      }
      if (otherChange) {
        // Native new card/image insertions must be corrected BEFORE paint;
        // the expensive hero layout still happens in the ordinary rAF.
        syncPreferredPortraitBeforePaint();
        queueInstall();
      } else if (sideRowsChanged) {
        // Debounce only native row churn, never the native list itself.
        if (sideSettleTimer !== null) clearTimeout(sideSettleTimer);
        sideSettleTimer = setTimeout(() => {
          sideSettleTimer = null;
          if (officialPresenceActive) refreshOfficialAvailability();
          queueInstall();
        }, 75);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href']
    });
    runtimeObserver = observer;
    observedRuntimeBody = document.body;

    if (document.fonts) {
      const fontsChanged = () => {
        queueInstall();
      };
      document.fonts.ready.then(fontsChanged);
      document.fonts.addEventListener?.("loadingdone", fontsChanged);
    }
    window.addEventListener('storage', (event) => {
      if (!officialPresenceActive || (event.key && !event.key.startsWith('fakemon::'))) return;
      refreshOfficialAvailability();
    });
    window.addEventListener("popstate", queueInstall);
    window.addEventListener("resize", queueInstall, { passive: true });
    modules.status(registration,'running');
    modules.ready();
  }

  function reconcileAfterPageShow() {
    // Safari may restore an existing document from its back/forward cache.
    // No reinstallation is needed if observers are already running, but an
    // existing stylesheet can have been detached by parser/head replacement.
    if (document.head && style.parentElement !== document.head) {
      document.head.appendChild(style);
    }
    if (observerStarted && runtimeObserver && document.body &&
        observedRuntimeBody !== document.body) {
      runtimeObserver.disconnect();
      runtimeObserver.observe(document.body, {childList:true,subtree:true,attributes:true,attributeFilter:['href']});
      observedRuntimeBody = document.body;
    }
    if (!observerStarted && document.body) startRuntime();
    else if (observerStarted) queueInstall();
  }
  window.__yofiQolRecover = reconcileAfterPageShow;
  window.addEventListener('pageshow', reconcileAfterPageShow);
  // Species Card asks for a synchronous QOL pass immediately before reveal.
  // Normalize the native species ID and type tags first so Theme Overlay can
  // paint the incoming card from current metadata in the same task.
  document.addEventListener('yofi:species-card-prepare-before-reveal', (event) => {
    const article = event.detail?.article;
    if (!(article instanceof HTMLElement) || !article.querySelector('section.stats')) return;
    if (preparePendingListCard(article)) syncEntryTier(article);
    syncSpeciesHeaderId(article);
    renderHeaderTypePictograms(article.querySelector(':scope > header'));
    // Publish ready portrait controls alongside the current species header.
    if (window.__yofiPortraitReadiness.matches(article, event.detail?.routeKey)) {
      const page = activeRoutePage();
      if (detailArticle(page) === article) installPortraitControl(page);
    }
  });

  if (document.body) {
    startRuntime();
  } else {
    document.addEventListener("DOMContentLoaded", startRuntime, { once: true });
  }
  } // runQol
})();
