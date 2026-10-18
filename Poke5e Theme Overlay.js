// ==UserScript==
// @name         Theme Overlay [v0.3.50]
// @namespace    yofi.poke5e.theme-presentation-companion
// @version      0.3.50
// @description  Type theme with curated backgroundType choices and derived 18-type presentation palette.
// @match        https://poke5e.app/*
// @run-at       document-end
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
  const registration = modules.register('Theme Overlay','0.3.50');
  modules.requireQol(registration,runThemeOverlay);
  function runThemeOverlay() {
  const KEY = '__p5ThemeOverlay0350';
  const STYLE_ID = 'p5-theme-overlay-v0350-styles';
  const PRE_REVEAL_EVENT = 'yofi:species-card-before-reveal';
  // Stop prior instances, including reinjection of this same version.
  // One namespace check replaces an ever-growing historical version list.
  for (const old of Object.getOwnPropertyNames(window).filter(key => /^__p5ThemeOverlay\d+$/.test(key))) {
    try { window[old]?.stop?.(); } catch (error) { console.warn('[P5 Theme] Previous overlay stop failed:', error); }
  }
  for (const oldStyle of document.querySelectorAll('style[id^="p5-theme-overlay-v"][id$="-styles"]')) oldStyle.remove();

  // QOL owns the native Light/Dark controls. This module
  // owns the additional Type mode, its Settings/quick-menu/native-dialog UI,
  // persisted mode, and all rendering/palette decisions.
  const THEME_KEY = 'yofi-poke5e-qol-theme';
  const THEME_ORDER = Object.freeze(['type','day','night']);
  let themeMode = (() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (THEME_ORDER.includes(stored)) return stored;
      return localStorage.getItem('daynight') === 'night' ? 'night' : 'day';
    } catch (_) { return 'day'; }
  })();
  let settingNative = false;
  let dialogBubbleObserver = null;
  let dialogBubblePair = null;
  const TYPE_THEME_ICON = "<path d=\"M170.93 124.41c.8 15.21-5.05 28.07-14.96 38.95-4.86 5.34-7.13 10.82-7.01 17.85.07 4.3-.64 8.63-1.21 12.91-1.48 11.17-7.97 16.55-19.79 16.53-11.81-.02-18.2-5.38-19.75-16.59-.18-1.32-.43-2.65-.42-3.97.07-12.31-3.37-22.68-11.93-32.43-14.25-16.22-14.56-45.3-2.66-60.49 5.82-7.42 4.65-17.14 7.55-25.58 2.37-6.9 4.02-14.05 6.07-21.06.48-1.65 1.51-3.06 3.48-3 2.02.06 2.71 1.6 3.11 3.3 1.8 7.77 4.05 15.47 5.23 23.33.95 6.31 4.94 5.95 9.39 5.97 4.5.02 8.42.25 9.35-6.03 1.11-7.53 3.32-14.9 5.03-22.34.45-1.96.74-4.19 3.34-4.19 2.43 0 3.15 1.99 3.71 4 1.88 6.72 3.88 13.4 5.7 20.14 3.01 11.13 4.22 22.74 11.59 32.51 4.31 5.71 3.98 13.22 4.18 20.21Z M91.9 116.2c.6 15.3 2.1 24 9.5 28.2l15.4 8.5-23.3-42.2Z M164.1 116.2c-.6 15.3-2.1 24-9.5 28.2l-15.4 8.5 23.3-42.2Z\"/><path d=\"M194.2,95.93c16.78,17.37,18.87,64.53-8.22,85.49-5.83-6.35-8.44-14.77-13.52-21.58-.65-.87-.74-2.88-.18-3.82,5.41-9,4.95-20.46,12.96-28.54,7.84-7.92,9.39-18.61,8.97-31.55Z\"/><path d=\"M61.68,95.93c-16.78,17.37-18.87,64.53,8.22,85.49,5.83-6.35,8.44-14.77,13.52-21.58,.65-.87,.74-2.88,.18-3.82-5.41-9-4.95-20.46-12.96-28.54-7.84-7.92-9.39-18.61-8.97-31.55Z\"/>";
  const TYPE_CAPTION = {en:'Type',es:'Tipo',fr:'Type',de:'Typ',pt:'Tipo'};
  function labelTheme(key) {
    const bridge = window.__yofiQolThemeBridge;
    if (key === 'type') return TYPE_CAPTION[bridge?.locale?.() || 'en'] || 'Type';
    return bridge?.label?.(key) || ({theme:'Theme',day:'Light',night:'Dark'}[key] || key);
  }
  function themeIcon(colored = false) {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox',themeMode === 'type' ? '0 0 256 256' : '0 0 24 24');
    svg.setAttribute('aria-hidden','true');
    if(themeMode === 'type') {
      svg.setAttribute('fill','currentColor');
      svg.setAttribute('fill-rule','evenodd');
      svg.innerHTML=TYPE_THEME_ICON;
      if(colored)svg.style.color='var(--skin-dragon-bg, #4C60A9)';
    } else {
      svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');
      svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');
      svg.setAttribute('stroke-linejoin','round');
      if(themeMode === 'night') {
        svg.setAttribute('fill','currentColor');svg.setAttribute('stroke','none');
        svg.innerHTML='<path d="M18.8 18.3A9.5 9.5 0 1 1 18.8 5.7a7 7 0 1 0 0 12.6Z"/>';
      } else {
        svg.innerHTML='<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>';
      }
    }
    return svg;
  }
  function setThemeMode(next) {
    if(!THEME_ORDER.includes(next))return;
    themeMode=next;
    try { localStorage.setItem(THEME_KEY,next); } catch (_) {}
    const nativeMode=next === 'night' ? 'night' : 'day';
    // Let the existing Svelte radio/store manage native Light/Dark. Guard
    // the click's change event so entering Type doesn't immediately exit Type.
    settingNative=true;
    try {
      const bridge=window.__yofiQolThemeBridge;
      if(bridge?.setNative)bridge.setNative(nativeMode);
      else {
        try {localStorage.setItem('daynight',nativeMode);}catch(_){}
        const radio=document.querySelector(`#dark-mode-fieldset input[value="${nativeMode}"]`);
        if(radio instanceof HTMLInputElement&&!radio.checked)radio.click();
        else document.body?.classList.toggle('dark-mode',nativeMode === 'night');
      }
    } finally {settingNative=false;}
    document.documentElement.classList.toggle('yofi-type-theme',next==='type');
    if(next==='type')document.body?.classList.remove('dark-mode');
    else document.body?.classList.toggle('dark-mode',next==='night');
    window.__yofiQolThemeBridge?.syncSettings?.();
    installThemeDialog();
    schedule();
  }
  const cycleTheme = () => setThemeMode(THEME_ORDER[(THEME_ORDER.indexOf(themeMode)+1)%THEME_ORDER.length]);
  function onNativeThemeChange(event) {
    if(settingNative)return;
    const target=event.target;
    if(!(target instanceof HTMLInputElement)||!target.matches('#dark-mode-fieldset input[value="day"], #dark-mode-fieldset input[value="night"]'))return;
    // Native radio was toggled outside the overlay; adopt that choice.
    setThemeMode(target.value);
  }
  function quickMenuOption(){return {label:`${labelTheme('theme')}: ${labelTheme(themeMode)}`,icon:themeIcon(),action:cycleTheme};}
  function installThemeDialog() {
    // On updated QOL, its native dialog item is canonical. We extend its
    // state through the extension API instead of owning a duplicate node.
    const qolItem = document.querySelector('li.yofi-native-theme-item[data-yofi-qol-owned="true"]');
    if (qolItem && window.__yofiQolThemeBridge?.syncMenu) {
      window.__yofiQolThemeBridge.syncMenu();
      return;
    }
    const dialog=[...document.querySelectorAll('dialog')].find(d=>
      [...d.querySelectorAll('li > a[href]')].some(a=>{
        try{return new URL(a.href,location.href).pathname.split('/').includes('fakemon');}catch(_){return false;}
      }));
    if(!dialog)return;
    const anchor=[...dialog.querySelectorAll('li > a[href]')].find(a=>{
      try{return new URL(a.href,location.href).pathname.split('/').includes('settings');}catch(_){return false;}
    });
    const parent=anchor?.closest('li'),list=parent?.parentElement;
    if(!parent||!list)return;
    let item=list.querySelector(':scope > li.yofi-native-theme-item');
    if(!item){
      item=parent.cloneNode(true);
      item.classList.remove('active');item.classList.add('yofi-native-theme-item');
      const original=item.querySelector(':scope > a');
      const button=document.createElement('button');button.type='button';
      button.className=original?.className||'center-column uppercase-link';
      if(original)button.append(...Array.from(original.childNodes));
      button.addEventListener('click',cycleTheme);
      original?.replaceWith(button);
    }
    if(item.nextElementSibling!==parent)list.insertBefore(item,parent);
    const button=item.querySelector('button'),bubble=button?.querySelector('.bubble');
    const nativeBubble=parent.querySelector('.bubble');
    if(!button||!bubble)return;
    const resize=()=>{
      if(!bubble.isConnected||!nativeBubble?.isConnected)return;
      const size=nativeBubble.offsetWidth;
      if(size>0){const v=`${size}px`;if(bubble.style.getPropertyValue('--yofi-native-theme-diameter')!==v)
        bubble.style.setProperty('--yofi-native-theme-diameter',v);}
    };
    if(nativeBubble && (!dialogBubblePair||dialogBubblePair[0]!==bubble||dialogBubblePair[1]!==nativeBubble)){
      dialogBubbleObserver?.disconnect();dialogBubblePair=[bubble,nativeBubble];
      if(typeof ResizeObserver==='function'){
        dialogBubbleObserver=new ResizeObserver(resize);dialogBubbleObserver.observe(nativeBubble);
      }
    }
    resize();
    if(bubble.dataset.yofiTheme!==themeMode){bubble.replaceChildren(themeIcon(true));bubble.dataset.yofiTheme=themeMode;}
    const title=`${labelTheme('theme')}: ${labelTheme(themeMode)}`;
    const caption=button.querySelector('.bubble-title');
    if(caption && caption.textContent!==title)caption.textContent=title;
    button.setAttribute('aria-label',title);
  }

  // User-reviewed original Pokemon backgroundType choices (613 dual types/forms).
  // Seeded offline from Hue/Saturation + Neutral Lightness, then manually edited.
  // backgroundType selects the card tint; the other type supplies section banners.
  // Never confuse this data with palette mix values or the native header gradient.
  // This overlay never fetches or samples image pixels.
  const ORIGINAL_POKEMON_BACKGROUND_TYPES = Object.freeze({"bulbasaur":"grass","ivysaur":"grass","venusaur":"grass","charizard":"fire","butterfree":"bug","weedle":"bug","kakuna":"bug","beedrill":"bug","pidgey":"normal","pidgeotto":"normal","pidgeot":"normal","spearow":"normal","fearow":"normal","nidoqueen":"poison","nidoking":"poison","jigglypuff":"fairy","wigglytuff":"fairy","zubat":"poison","golbat":"poison","oddish":"poison","gloom":"poison","vileplume":"poison","paras":"bug","parasect":"bug","venonat":"poison","venomoth":"poison","poliwrath":"water","bellsprout":"grass","weepinbell":"grass","victreebel":"grass","tentacool":"water","tentacruel":"water","geodude":"rock","graveler":"rock","golem":"rock","slowpoke":"psychic","slowbro":"psychic","magnemite":"steel","magneton":"steel","farfetchd":"normal","doduo":"normal","dodrio":"normal","dewgong":"water","cloyster":"water","gastly":"ghost","haunter":"ghost","gengar":"ghost","onix":"ground","exeggcute":"psychic","exeggutor":"psychic","rhyhorn":"rock","rhydon":"rock","starmie":"water","mr-mime":"fairy","scyther":"bug","jynx":"psychic","gyarados":"flying","lapras":"ice","omanyte":"water","omastar":"water","kabuto":"rock","kabutops":"rock","aerodactyl":"rock","articuno":"flying","zapdos":"flying","moltres":"flying","dragonite":"flying","hoothoot":"normal","noctowl":"normal","ledyba":"bug","ledian":"bug","spinarak":"bug","ariados":"bug","crobat":"poison","chinchou":"water","lanturn":"water","igglybuff":"fairy","togetic":"fairy","natu":"psychic","xatu":"psychic","marill":"fairy","azumarill":"fairy","hoppip":"flying","skiploom":"flying","jumpluff":"flying","yanma":"bug","wooper":"water","quagsire":"water","murkrow":"flying","slowking":"psychic","girafarig":"normal","forretress":"steel","gligar":"flying","steelix":"ground","qwilfish":"water","scizor":"bug","shuckle":"rock","heracross":"fighting","sneasel":"ice","magcargo":"fire","swinub":"ground","piloswine":"ground","corsola":"rock","delibird":"flying","mantine":"flying","skarmory":"flying","houndour":"dark","houndoom":"dark","kingdra":"water","smoochum":"psychic","larvitar":"rock","pupitar":"rock","tyranitar":"rock","lugia":"flying","ho-oh":"flying","celebi":"psychic","combusken":"fighting","blaziken":"fighting","marshtomp":"water","swampert":"water","beautifly":"bug","dustox":"bug","lotad":"grass","lombre":"grass","ludicolo":"grass","nuzleaf":"dark","shiftry":"dark","taillow":"flying","swellow":"flying","wingull":"flying","pelipper":"flying","ralts":"psychic","kirlia":"psychic","gardevoir":"psychic","surskit":"water","masquerain":"flying","breloom":"grass","nincada":"bug","ninjask":"bug","shedinja":"bug","azurill":"normal","sableye":"dark","mawile":"fairy","aron":"rock","lairon":"rock","aggron":"rock","meditite":"fighting","medicham":"fighting","roselia":"grass","carvanha":"dark","sharpedo":"dark","numel":"ground","camerupt":"ground","vibrava":"ground","flygon":"ground","cacturne":"grass","swablu":"normal","altaria":"flying","lunatone":"rock","solrock":"rock","barboach":"water","whiscash":"water","crawdaunt":"dark","baltoy":"ground","claydol":"ground","lileep":"rock","cradily":"rock","anorith":"rock","armaldo":"rock","tropius":"grass","spheal":"ice","sealeo":"ice","walrein":"ice","relicanth":"rock","salamence":"flying","beldum":"steel","metang":"steel","metagross":"steel","latias":"psychic","latios":"dragon","groudon-primal":"fire","rayquaza":"flying","jirachi":"steel","torterra":"grass","monferno":"fighting","infernape":"fighting","empoleon":"steel","starly":"normal","staravia":"normal","staraptor":"normal","bibarel":"normal","budew":"grass","roserade":"grass","shieldon":"rock","bastiodon":"rock","wormadam-plant-cloak":"grass","wormadam-sand-cloak":"ground","wormadam-trash-cloak":"steel","mothim":"flying","combee":"bug","vespiquen":"bug","gastrodon":"ground","drifloon":"ghost","drifblim":"ghost","honchkrow":"flying","stunky":"poison","skuntank":"poison","bronzor":"steel","bronzong":"steel","mime-jr":"fairy","chatot":"normal","spiritomb":"dark","gible":"dragon","gabite":"dragon","garchomp":"dragon","lucario":"steel","skorupi":"poison","drapion":"poison","croagunk":"poison","toxicroak":"poison","mantyke":"flying","snover":"ice","abomasnow":"ice","weavile":"dark","magnezone":"steel","rhyperior":"ground","togekiss":"flying","yanmega":"bug","gliscor":"flying","mamoswine":"ground","gallade":"psychic","probopass":"rock","froslass":"ice","rotom":"electric","rotom-heat":"electric","rotom-wash":"electric","rotom-frost":"electric","rotom-fan":"electric","rotom-mow":"electric","dialga":"steel","dialga-origin":"steel","palkia":"dragon","palkia-origin":"dragon","heatran":"fire","giratina-altered-forme":"ghost","giratina-origin-forme":"ghost","shaymin-sky":"grass","victini":"psychic","pignite":"fighting","emboar":"fighting","pidove":"normal","tranquill":"normal","unfezant":"normal","woobat":"flying","swoobat":"flying","excadrill":"ground","palpitoad":"water","seismitoad":"water","sewaddle":"bug","swadloon":"bug","leavanny":"bug","venipede":"poison","whirlipede":"poison","scolipede":"poison","cottonee":"grass","whimsicott":"grass","sandile":"dark","krokorok":"dark","krookodile":"dark","dwebble":"rock","crustle":"rock","scraggy":"fighting","scrafty":"fighting","sigilyph":"flying","tirtouga":"rock","carracosta":"rock","archen":"flying","archeops":"flying","ducklett":"flying","swanna":"flying","deerling":"grass","sawsbuck":"grass","emolga":"flying","escavalier":"steel","foongus":"grass","amoonguss":"grass","frillish":"water","jellicent":"water","joltik":"electric","galvantula":"electric","ferroseed":"steel","ferrothorn":"steel","litwick":"ghost","lampent":"ghost","chandelure":"ghost","stunfisk":"ground","golett":"ground","golurk":"ground","pawniard":"dark","bisharp":"dark","rufflet":"normal","braviary":"normal","vullaby":"dark","mandibuzz":"dark","durant":"steel","deino":"dragon","zweilous":"dragon","hydreigon":"dragon","larvesta":"fire","volcarona":"fire","cobalion":"steel","terrakion":"rock","virizion":"grass","thundurus":"flying","thundurus-therian":"flying","reshiram":"dragon","zekrom":"dragon","landorus":"ground","landorus-therian":"ground","kyurem":"ice","white-kyurem":"ice","black-kyurem":"ice","keldeo":"water","meloetta---aria":"normal","meloetta---pirouette":"normal","genesect":"steel","chesnaught":"grass","delphox":"fire","greninja":"water","diggersby":"normal","fletchling":"normal","fletchinder":"fire","talonflame":"fire","vivillon":"flying","litleo":"normal","pyroar":"normal","pangoro":"fighting","honedge":"ghost","doublade":"ghost","aegislash":"ghost","inkay":"dark","malamar":"dark","binacle":"rock","barbaracle":"rock","skrelp":"water","dragalge":"poison","helioptile":"electric","heliolisk":"electric","tyrunt":"rock","tyrantrum":"rock","amaura":"ice","aurorus":"ice","hawlucha":"fighting","dedenne":"electric","carbink":"rock","klefki":"steel","phantump":"grass","trevenant":"grass","pumpkaboo":"ghost","gourgeist":"ghost","noibat":"dragon","noivern":"dragon","yveltal":"dark","zygarde-10-forme":"dragon","zygarde-50-forme":"dragon","zygarde-complete-forme":"dragon","diancie":"rock","hoopa-confined":"ghost","hoopa-unbound":"dark","volcanion":"water","alolan-rattata":"normal","alolan-raticate":"normal","alolan-raichu":"psychic","alolan-sandshrew":"steel","alolan-sandslash":"steel","alolan-ninetales":"fairy","alolan-diglett":"ground","alolan-dugtrio":"ground","alolan-geodude":"rock","alolan-graveler":"rock","alolan-golem":"rock","alolan-grimer":"dark","alolan-muk":"dark","alolan-exeggutor":"grass","alolan-marowak":"ghost","rowlet":"grass","dartrix":"grass","decidueye":"grass","incineroar":"fire","primarina":"water","pikipek":"normal","trumbeak":"normal","toucannon":"normal","charjabug":"bug","vikavolt":"bug","crabominable":"ice","oricorio-baile-style":"flying","oricorio-pom-pom-style":"flying","oricorio-pau-style":"flying","oricorio-sensu-style":"flying","cutiefly":"bug","ribombee":"bug","mareanie":"water","toxapex":"water","dewpider":"water","araquanid":"water","morelull":"fairy","shiinotic":"fairy","salandit":"poison","salazzle":"poison","stufful":"normal","bewear":"normal","oranguru":"normal","wimpod":"water","golisopod":"water","sandygast":"ground","palossand":"ground","minior-meteor-form":"rock","minior-core-form":"rock","turtonator":"fire","togedemaru":"steel","mimikyu":"fairy","bruxish":"psychic","drampa":"normal","dhelmise":"ghost","hakamo-o":"fighting","kommo-o":"fighting","tapu-koko":"electric","tapu-lele":"psychic","tapu-bulu":"grass","tapu-fini":"water","solgaleo":"steel","lunala":"ghost","nihilego":"poison","buzzwole":"fighting","pheromosa":"fighting","celesteela":"flying","kartana":"steel","guzzlord":"dark","dusk-mane-necrozma":"psychic","dawn-wings-necrozma":"psychic","ultra-necrozma":"dragon","magearna":"fairy","marshadow":"ghost","naganadel":"poison","stakataka":"rock","blacephalon":"ghost","galarian-rapidash":"fairy","galarian-slowbro":"poison","galarian-weezing":"fairy","galarian-mr-mime":"ice","articuno-galar":"flying","zapdos-galar":"flying","moltres-galar":"flying","galarian-slowking":"poison","galarian-zigzagoon":"normal","galarian-linoone":"normal","galarian-yamask":"ghost","galarian-stunfisk":"ground","corviknight":"flying","dottler":"bug","orbeetle":"psychic","drednaw":"rock","carkol":"rock","coalossal":"rock","applin":"grass","flapple":"grass","appletun":"grass","cramorant":"flying","toxel":"electric","toxtricity-amped":"electric","toxtricity-low-key":"electric","sizzlipede":"fire","centiskorch":"fire","hatterene":"psychic","impidimp":"fairy","morgrem":"fairy","grimmsnarl":"fairy","obstagoon":"normal","mr-rime":"ice","runerigus":"ghost","snom":"ice","frosmoth":"ice","indeedee-m":"normal","indeedee-f":"normal","morpeko":"electric","dracozolt":"electric","arctozolt":"electric","dracovish":"water","arctovish":"water","duraludon":"steel","dreepy":"dragon","drakloak":"dragon","dragapult":"dragon","zacian-crowned":"steel","zamazenta-crowned":"steel","eternatus":"dragon","eternatus-eternamax":"dragon","urshifu-single":"fighting","urshifu-rapid":"fighting","zarude":"dark","calyrex":"grass","calyrex-ice":"ice","calyrex-shadow":"ghost","growlithe-hisui":"rock","arcanine-hisui":"rock","voltorb-hisui":"electric","electrode-hisui":"electric","typhlosion-hisui":"fire","qwilfish-hisui":"dark","sneasel-hisui":"poison","samurott-hisui":"water","lilligant-hisui":"grass","zorua-hisui":"normal","zoroark-hisui":"normal","braviary-hisui":"flying","sliggoo-hisui":"steel","goodra-hisui":"steel","avalugg-hisui":"ice","decidueye-hisui":"fighting","wyrdeer":"normal","kleavor":"rock","ursaluna":"ground","ursaluna-bloodmoon":"ground","basculegion-m":"ghost","basculegion-f":"ghost","sneasler":"poison","overqwil":"dark","enamorus":"fairy","enamorus-therian":"fairy","tauros-paldea-blaze-breed":"fire","tauros-paldea-aqua-breed":"water","wooper-paldea":"ground","meowscarada":"grass","skeledirge":"fire","quaquaval":"water","lokix":"dark","pawmo":"electric","pawmot":"electric","smoliv":"grass","dolliv":"grass","arboliva":"grass","squawkabilly":"normal","armarouge":"psychic","ceruledge":"ghost","wattrel":"electric","kilowattrel":"electric","shroodle":"normal","grafaiai":"normal","bramblin":"grass","brambleghast":"grass","toedscool":"ground","toedscruel":"ground","scovillain":"grass","rabsca":"psychic","tinkatink":"fairy","tinkatuff":"fairy","tinkaton":"fairy","bombirdier":"dark","varoom":"poison","revavroom":"poison","cyclizar":"dragon","glimmet":"poison","glimmora":"poison","flamigo":"fighting","veluza":"water","tatsugiri":"water","annihilape":"ghost","clodsire":"ground","farigiraf":"normal","kingambit":"dark","great-tusk":"ground","scream-tail":"fairy","brute-bonnet":"dark","flutter-mane":"ghost","slither-wing":"fighting","sandy-shocks":"ground","iron-treads":"ground","iron-bundle":"ice","iron-hands":"fighting","iron-jugulis":"dark","iron-moth":"fire","iron-thorns":"rock","frigibax":"ice","arctibax":"ice","baxcalibur":"ice","gholdengo":"ghost","wo-chien":"dark","chien-pao":"dark","ting-lu":"dark","chi-yu":"dark","roaring-moon":"dark","iron-valiant":"fairy","koraidon":"fighting","miraidon":"dragon","walking-wake":"water","iron-leaves":"grass","dipplin":"grass","poltchageist":"ghost","sinistcha":"ghost","okidogi":"poison","munkidori":"poison","fezandipiti":"poison","ogerpon-wellspring-mask":"grass","ogerpon-heartflame-mask":"grass","ogerpon-cornerstone-mask":"grass","archaludon":"dragon","hydrapple":"grass","gouging-fire":"fire","raging-bolt":"dragon","iron-boulder":"rock","iron-crown":"steel","pecharunt":"ghost"});
  // Native cards expose the Dex number, not the route slug. Regional forms
  // share that number, so pair it with their native name to resolve the exact
  // existing choice-table ID. Only indexed dual types need this lookup.
  const ARTWORK_IDS_BY_NATIVE_RECORD = {"1:bulbasaur":"bulbasaur","2:ivysaur":"ivysaur","3:venusaur":"venusaur","6:charizard":"charizard","12:butterfree":"butterfree","13:weedle":"weedle","14:kakuna":"kakuna","15:beedrill":"beedrill","16:pidgey":"pidgey","17:pidgeotto":"pidgeotto","18:pidgeot":"pidgeot","21:spearow":"spearow","22:fearow":"fearow","31:nidoqueen":"nidoqueen","34:nidoking":"nidoking","39:jigglypuff":"jigglypuff","40:wigglytuff":"wigglytuff","41:zubat":"zubat","42:golbat":"golbat","43:oddish":"oddish","44:gloom":"gloom","45:vileplume":"vileplume","46:paras":"paras","47:parasect":"parasect","48:venonat":"venonat","49:venomoth":"venomoth","62:poliwrath":"poliwrath","69:bellsprout":"bellsprout","70:weepinbell":"weepinbell","71:victreebel":"victreebel","72:tentacool":"tentacool","73:tentacruel":"tentacruel","74:geodude":"geodude","75:graveler":"graveler","76:golem":"golem","79:slowpoke":"slowpoke","80:slowbro":"slowbro","81:magnemite":"magnemite","82:magneton":"magneton","83:farfetch'd":"farfetchd","84:doduo":"doduo","85:dodrio":"dodrio","87:dewgong":"dewgong","91:cloyster":"cloyster","92:gastly":"gastly","93:haunter":"haunter","94:gengar":"gengar","95:onix":"onix","102:exeggcute":"exeggcute","103:exeggutor":"exeggutor","111:rhyhorn":"rhyhorn","112:rhydon":"rhydon","121:starmie":"starmie","122:mr. mime":"mr-mime","123:scyther":"scyther","124:jynx":"jynx","130:gyarados":"gyarados","131:lapras":"lapras","138:omanyte":"omanyte","139:omastar":"omastar","140:kabuto":"kabuto","141:kabutops":"kabutops","142:aerodactyl":"aerodactyl","144:articuno":"articuno","145:zapdos":"zapdos","146:moltres":"moltres","149:dragonite":"dragonite","163:hoothoot":"hoothoot","164:noctowl":"noctowl","165:ledyba":"ledyba","166:ledian":"ledian","167:spinarak":"spinarak","168:ariados":"ariados","169:crobat":"crobat","170:chinchou":"chinchou","171:lanturn":"lanturn","174:igglybuff":"igglybuff","176:togetic":"togetic","177:natu":"natu","178:xatu":"xatu","183:marill":"marill","184:azumarill":"azumarill","187:hoppip":"hoppip","188:skiploom":"skiploom","189:jumpluff":"jumpluff","193:yanma":"yanma","194:wooper":"wooper","195:quagsire":"quagsire","198:murkrow":"murkrow","199:slowking":"slowking","203:girafarig":"girafarig","205:forretress":"forretress","207:gligar":"gligar","208:steelix":"steelix","211:qwilfish":"qwilfish","212:scizor":"scizor","213:shuckle":"shuckle","214:heracross":"heracross","215:sneasel":"sneasel","219:magcargo":"magcargo","220:swinub":"swinub","221:piloswine":"piloswine","222:corsola":"corsola","225:delibird":"delibird","226:mantine":"mantine","227:skarmory":"skarmory","228:houndour":"houndour","229:houndoom":"houndoom","230:kingdra":"kingdra","238:smoochum":"smoochum","246:larvitar":"larvitar","247:pupitar":"pupitar","248:tyranitar":"tyranitar","249:lugia":"lugia","250:ho-oh":"ho-oh","251:celebi":"celebi","256:combusken":"combusken","257:blaziken":"blaziken","259:marshtomp":"marshtomp","260:swampert":"swampert","267:beautifly":"beautifly","269:dustox":"dustox","270:lotad":"lotad","271:lombre":"lombre","272:ludicolo":"ludicolo","274:nuzleaf":"nuzleaf","275:shiftry":"shiftry","276:taillow":"taillow","277:swellow":"swellow","278:wingull":"wingull","279:pelipper":"pelipper","280:ralts":"ralts","281:kirlia":"kirlia","282:gardevoir":"gardevoir","283:surskit":"surskit","284:masquerain":"masquerain","286:breloom":"breloom","290:nincada":"nincada","291:ninjask":"ninjask","292:shedinja":"shedinja","298:azurill":"azurill","302:sableye":"sableye","303:mawile":"mawile","304:aron":"aron","305:lairon":"lairon","306:aggron":"aggron","307:meditite":"meditite","308:medicham":"medicham","315:roselia":"roselia","318:carvanha":"carvanha","319:sharpedo":"sharpedo","322:numel":"numel","323:camerupt":"camerupt","329:vibrava":"vibrava","330:flygon":"flygon","332:cacturne":"cacturne","333:swablu":"swablu","334:altaria":"altaria","337:lunatone":"lunatone","338:solrock":"solrock","339:barboach":"barboach","340:whiscash":"whiscash","342:crawdaunt":"crawdaunt","343:baltoy":"baltoy","344:claydol":"claydol","345:lileep":"lileep","346:cradily":"cradily","347:anorith":"anorith","348:armaldo":"armaldo","357:tropius":"tropius","363:spheal":"spheal","364:sealeo":"sealeo","365:walrein":"walrein","369:relicanth":"relicanth","373:salamence":"salamence","374:beldum":"beldum","375:metang":"metang","376:metagross":"metagross","380:latias":"latias","381:latios":"latios","383:groudon (primal)":"groudon-primal","384:rayquaza":"rayquaza","385:jirachi":"jirachi","389:torterra":"torterra","391:monferno":"monferno","392:infernape":"infernape","395:empoleon":"empoleon","396:starly":"starly","397:staravia":"staravia","398:staraptor":"staraptor","400:bibarel":"bibarel","406:budew":"budew","407:roserade":"roserade","410:shieldon":"shieldon","411:bastiodon":"bastiodon","413:wormadam plant cloak":"wormadam-plant-cloak","413:wormadam sand cloak":"wormadam-sand-cloak","413:wormadam trash cloak":"wormadam-trash-cloak","414:mothim":"mothim","415:combee":"combee","416:vespiquen":"vespiquen","423:gastrodon":"gastrodon","425:drifloon":"drifloon","426:drifblim":"drifblim","430:honchkrow":"honchkrow","434:stunky":"stunky","435:skuntank":"skuntank","436:bronzor":"bronzor","437:bronzong":"bronzong","439:mime jr.":"mime-jr","441:chatot":"chatot","442:spiritomb":"spiritomb","443:gible":"gible","444:gabite":"gabite","445:garchomp":"garchomp","448:lucario":"lucario","451:skorupi":"skorupi","452:drapion":"drapion","453:croagunk":"croagunk","454:toxicroak":"toxicroak","458:mantyke":"mantyke","459:snover":"snover","460:abomasnow":"abomasnow","461:weavile":"weavile","462:magnezone":"magnezone","464:rhyperior":"rhyperior","468:togekiss":"togekiss","469:yanmega":"yanmega","472:gliscor":"gliscor","473:mamoswine":"mamoswine","475:gallade":"gallade","476:probopass":"probopass","478:froslass":"froslass","479:rotom":"rotom","479:rotom heat":"rotom-heat","479:rotom wash":"rotom-wash","479:rotom frost":"rotom-frost","479:rotom fan":"rotom-fan","479:rotom mow":"rotom-mow","483:dialga":"dialga","483:dialga (origin forme)":"dialga-origin","484:palkia":"palkia","484:palkia (origin forme)":"palkia-origin","485:heatran":"heatran","487:giratina altered forme":"giratina-altered-forme","487:giratina origin forme":"giratina-origin-forme","492:shaymin sky":"shaymin-sky","494:victini":"victini","499:pignite":"pignite","500:emboar":"emboar","519:pidove":"pidove","520:tranquill":"tranquill","521:unfezant":"unfezant","527:woobat":"woobat","528:swoobat":"swoobat","530:excadrill":"excadrill","536:palpitoad":"palpitoad","537:seismitoad":"seismitoad","540:sewaddle":"sewaddle","541:swadloon":"swadloon","542:leavanny":"leavanny","543:venipede":"venipede","544:whirlipede":"whirlipede","545:scolipede":"scolipede","546:cottonee":"cottonee","547:whimsicott":"whimsicott","551:sandile":"sandile","552:krokorok":"krokorok","553:krookodile":"krookodile","557:dwebble":"dwebble","558:crustle":"crustle","559:scraggy":"scraggy","560:scrafty":"scrafty","561:sigilyph":"sigilyph","564:tirtouga":"tirtouga","565:carracosta":"carracosta","566:archen":"archen","567:archeops":"archeops","580:ducklett":"ducklett","581:swanna":"swanna","585:deerling":"deerling","586:sawsbuck":"sawsbuck","587:emolga":"emolga","589:escavalier":"escavalier","590:foongus":"foongus","591:amoonguss":"amoonguss","592:frillish":"frillish","593:jellicent":"jellicent","595:joltik":"joltik","596:galvantula":"galvantula","597:ferroseed":"ferroseed","598:ferrothorn":"ferrothorn","607:litwick":"litwick","608:lampent":"lampent","609:chandelure":"chandelure","618:stunfisk":"stunfisk","622:golett":"golett","623:golurk":"golurk","624:pawniard":"pawniard","625:bisharp":"bisharp","627:rufflet":"rufflet","628:braviary":"braviary","629:vullaby":"vullaby","630:mandibuzz":"mandibuzz","632:durant":"durant","633:deino":"deino","634:zweilous":"zweilous","635:hydreigon":"hydreigon","636:larvesta":"larvesta","637:volcarona":"volcarona","638:cobalion":"cobalion","639:terrakion":"terrakion","640:virizion":"virizion","642:thundurus (incarnate)":"thundurus","642:thundurus (therian)":"thundurus-therian","643:reshiram":"reshiram","644:zekrom":"zekrom","645:landorus (incarnate)":"landorus","645:landorus (therian)":"landorus-therian","646:kyurem":"kyurem","646:white kyurem":"white-kyurem","646:black kyurem":"black-kyurem","647:keldeo":"keldeo","648:meloetta - aria":"meloetta---aria","648:meloetta - pirouette":"meloetta---pirouette","649:genesect":"genesect","652:chesnaught":"chesnaught","655:delphox":"delphox","658:greninja":"greninja","660:diggersby":"diggersby","661:fletchling":"fletchling","662:fletchinder":"fletchinder","663:talonflame":"talonflame","666:vivillon":"vivillon","667:litleo":"litleo","668:pyroar":"pyroar","675:pangoro":"pangoro","679:honedge":"honedge","680:doublade":"doublade","681:aegislash":"aegislash","686:inkay":"inkay","687:malamar":"malamar","688:binacle":"binacle","689:barbaracle":"barbaracle","690:skrelp":"skrelp","691:dragalge":"dragalge","694:helioptile":"helioptile","695:heliolisk":"heliolisk","696:tyrunt":"tyrunt","697:tyrantrum":"tyrantrum","698:amaura":"amaura","699:aurorus":"aurorus","701:hawlucha":"hawlucha","702:dedenne":"dedenne","703:carbink":"carbink","707:klefki":"klefki","708:phantump":"phantump","709:trevenant":"trevenant","710:pumpkaboo":"pumpkaboo","711:gourgeist":"gourgeist","714:noibat":"noibat","715:noivern":"noivern","717:yveltal":"yveltal","718:zygarde 10% forme":"zygarde-10-forme","718:zygarde 50% forme":"zygarde-50-forme","718:zygarde complete forme":"zygarde-complete-forme","719:diancie":"diancie","720:hoopa confined":"hoopa-confined","720:hoopa unbound":"hoopa-unbound","721:volcanion":"volcanion","19:alolan rattata":"alolan-rattata","20:alolan raticate":"alolan-raticate","26:alolan raichu":"alolan-raichu","27:alolan sandshrew":"alolan-sandshrew","28:alolan sandslash":"alolan-sandslash","38:alolan ninetales":"alolan-ninetales","50:alolan diglett":"alolan-diglett","51:alolan dugtrio":"alolan-dugtrio","74:alolan geodude":"alolan-geodude","75:alolan graveler":"alolan-graveler","76:alolan golem":"alolan-golem","88:alolan grimer":"alolan-grimer","89:alolan muk":"alolan-muk","103:alolan exeggutor":"alolan-exeggutor","105:alolan marowak":"alolan-marowak","722:rowlet":"rowlet","723:dartrix":"dartrix","724:decidueye":"decidueye","727:incineroar":"incineroar","730:primarina":"primarina","731:pikipek":"pikipek","732:trumbeak":"trumbeak","733:toucannon":"toucannon","737:charjabug":"charjabug","738:vikavolt":"vikavolt","740:crabominable":"crabominable","741:oricorio baile style":"oricorio-baile-style","741:oricorio pom-pom style":"oricorio-pom-pom-style","741:oricorio pa'u style":"oricorio-pau-style","741:oricorio sensu style":"oricorio-sensu-style","742:cutiefly":"cutiefly","743:ribombee":"ribombee","747:mareanie":"mareanie","748:toxapex":"toxapex","751:dewpider":"dewpider","752:araquanid":"araquanid","755:morelull":"morelull","756:shiinotic":"shiinotic","757:salandit":"salandit","758:salazzle":"salazzle","759:stufful":"stufful","760:bewear":"bewear","765:oranguru":"oranguru","767:wimpod":"wimpod","768:golisopod":"golisopod","769:sandygast":"sandygast","770:palossand":"palossand","774:minior meteor form":"minior-meteor-form","774:minior core form":"minior-core-form","776:turtonator":"turtonator","777:togedemaru":"togedemaru","778:mimikyu":"mimikyu","779:bruxish":"bruxish","780:drampa":"drampa","781:dhelmise":"dhelmise","783:hakamo-o":"hakamo-o","784:kommo-o":"kommo-o","785:tapu koko":"tapu-koko","786:tapu lele":"tapu-lele","787:tapu bulu":"tapu-bulu","788:tapu fini":"tapu-fini","791:solgaleo":"solgaleo","792:lunala":"lunala","793:nihilego":"nihilego","794:buzzwole":"buzzwole","795:pheromosa":"pheromosa","797:celesteela":"celesteela","798:kartana":"kartana","799:guzzlord":"guzzlord","800:dusk mane necrozma":"dusk-mane-necrozma","800:dawn wings necrozma":"dawn-wings-necrozma","800:ultra necrozma":"ultra-necrozma","801:magearna":"magearna","802:marshadow":"marshadow","804:naganadel":"naganadel","805:stakataka":"stakataka","806:blacephalon":"blacephalon","78:galarian rapidash":"galarian-rapidash","80:galarian slowbro":"galarian-slowbro","110:galarian weezing":"galarian-weezing","122:galarian mr. mime":"galarian-mr-mime","144:galarian articuno":"articuno-galar","145:galarian zapdos":"zapdos-galar","146:galarian moltres":"moltres-galar","199:galarian slowking":"galarian-slowking","263:galarian zigzagoon":"galarian-zigzagoon","264:galarian linoone":"galarian-linoone","562:galarian yamask":"galarian-yamask","618:galarian stunfisk":"galarian-stunfisk","823:corviknight":"corviknight","825:dottler":"dottler","826:orbeetle":"orbeetle","834:drednaw":"drednaw","838:carkol":"carkol","839:coalossal":"coalossal","840:applin":"applin","841:flapple":"flapple","842:appletun":"appletun","845:cramorant":"cramorant","848:toxel":"toxel","849:toxtricity (amped)":"toxtricity-amped","849:toxtricity (low key)":"toxtricity-low-key","850:sizzlipede":"sizzlipede","851:centiskorch":"centiskorch","858:hatterene":"hatterene","859:impidimp":"impidimp","860:morgrem":"morgrem","861:grimmsnarl":"grimmsnarl","862:obstagoon":"obstagoon","866:mr. rime":"mr-rime","867:runerigus":"runerigus","872:snom":"snom","873:frosmoth":"frosmoth","876:indeedee ♂":"indeedee-m","876:indeedee ♀":"indeedee-f","877:morpeko":"morpeko","880:dracozolt":"dracozolt","881:arctozolt":"arctozolt","882:dracovish":"dracovish","883:arctovish":"arctovish","884:duraludon":"duraludon","885:dreepy":"dreepy","886:drakloak":"drakloak","887:dragapult":"dragapult","888:zacian (crowned)":"zacian-crowned","889:zamazenta (crowned)":"zamazenta-crowned","890:eternatus":"eternatus","890:eternatus (eternamax)":"eternatus-eternamax","892:urshifu (single strike)":"urshifu-single","892:urshifu (rapid strike)":"urshifu-rapid","893:zarude":"zarude","898:calyrex":"calyrex","898:calyrex (ice rider)":"calyrex-ice","898:calyrex (shadow rider)":"calyrex-shadow","58:hisuian growlithe":"growlithe-hisui","59:hisuian arcanine":"arcanine-hisui","100:hisuian voltorb":"voltorb-hisui","101:hisuian electrode":"electrode-hisui","157:hisuian typhlosion":"typhlosion-hisui","211:hisuian qwilfish":"qwilfish-hisui","215:hisuian sneasel":"sneasel-hisui","503:hisuian samurott":"samurott-hisui","549:hisuian lilligant":"lilligant-hisui","570:hisuian zorua":"zorua-hisui","571:hisuian zoroark":"zoroark-hisui","628:hisuian braviary":"braviary-hisui","705:hisuian sliggoo":"sliggoo-hisui","706:hisuian goodra":"goodra-hisui","713:hisuian avalugg":"avalugg-hisui","724:hisuian decidueye":"decidueye-hisui","899:wyrdeer":"wyrdeer","900:kleavor":"kleavor","901:ursaluna":"ursaluna","901:bloodmoon ursaluna":"ursaluna-bloodmoon","902:basculegion ♂":"basculegion-m","902:basculegion ♀":"basculegion-f","903:sneasler":"sneasler","904:overqwil":"overqwil","905:enamorus (incarnate)":"enamorus","905:enamorus (therian)":"enamorus-therian","128:paldean tauros (blaze breed)":"tauros-paldea-blaze-breed","128:paldean tauros (aqua breed)":"tauros-paldea-aqua-breed","194:paldean wooper":"wooper-paldea","908:meowscarada":"meowscarada","911:skeledirge":"skeledirge","914:quaquaval":"quaquaval","920:lokix":"lokix","922:pawmo":"pawmo","923:pawmot":"pawmot","928:smoliv":"smoliv","929:dolliv":"dolliv","930:arboliva":"arboliva","931:squawkabilly":"squawkabilly","936:armarouge":"armarouge","937:ceruledge":"ceruledge","940:wattrel":"wattrel","941:kilowattrel":"kilowattrel","944:shroodle":"shroodle","945:grafaiai":"grafaiai","946:bramblin":"bramblin","947:brambleghast":"brambleghast","948:toedscool":"toedscool","949:toedscruel":"toedscruel","952:scovillain":"scovillain","954:rabsca":"rabsca","957:tinkatink":"tinkatink","958:tinkatuff":"tinkatuff","959:tinkaton":"tinkaton","962:bombirdier":"bombirdier","965:varoom":"varoom","966:revavroom":"revavroom","967:cyclizar":"cyclizar","969:glimmet":"glimmet","970:glimmora":"glimmora","973:flamigo":"flamigo","976:veluza":"veluza","978:tatsugiri":"tatsugiri","979:annihilape":"annihilape","980:clodsire":"clodsire","981:farigiraf":"farigiraf","983:kingambit":"kingambit","984:great tusk":"great-tusk","985:scream tail":"scream-tail","986:brute bonnet":"brute-bonnet","987:flutter mane":"flutter-mane","988:slither wing":"slither-wing","989:sandy shocks":"sandy-shocks","990:iron treads":"iron-treads","991:iron bundle":"iron-bundle","992:iron hands":"iron-hands","993:iron jugulis":"iron-jugulis","994:iron moth":"iron-moth","995:iron thorns":"iron-thorns","996:frigibax":"frigibax","997:arctibax":"arctibax","998:baxcalibur":"baxcalibur","1000:gholdengo":"gholdengo","1001:wo-chien":"wo-chien","1002:chien-pao":"chien-pao","1003:ting-lu":"ting-lu","1004:chi-yu":"chi-yu","1005:roaring moon":"roaring-moon","1006:iron valiant":"iron-valiant","1007:koraidon":"koraidon","1008:miraidon":"miraidon","1009:walking wake":"walking-wake","1010:iron leaves":"iron-leaves","1011:dipplin":"dipplin","1012:poltchageist":"poltchageist","1013:sinistcha":"sinistcha","1014:okidogi":"okidogi","1015:munkidori":"munkidori","1016:fezandipiti":"fezandipiti","1017:ogerpon (wellspring mask)":"ogerpon-wellspring-mask","1017:ogerpon (heartflame mask)":"ogerpon-heartflame-mask","1017:ogerpon (cornerstone mask)":"ogerpon-cornerstone-mask","1018:archaludon":"archaludon","1019:hydrapple":"hydrapple","1020:gouging fire":"gouging-fire","1021:raging bolt":"raging-bolt","1022:iron boulder":"iron-boulder","1023:iron crown":"iron-crown","1025:pecharunt":"pecharunt"};
  // Canonical Scarlet/Violet type values remain QoL-owned --skin-<type>-bg.
  // Each type has independently adjustable presentation strengths in the CSS
  // block below. No mixing depends on the OTHER type in a species pairing.
  const svTypeColor = type => `var(--skin-${type}-bg)`;
  const typeVar = (type, role) => `var(--p5ov-${type}-${role})`;
  const TYPES = 'normal fire fighting water flying grass poison electric ground psychic rock ice bug dragon ghost dark steel fairy'.split(' ');
  let artworkApplied = 0;
  let artworkLastError = null;

  const THEME_ARTICLE = 'html.yofi-type-theme .page > main article.yofi-type-tinted';
  const CSS_ROOT = `${THEME_ARTICLE}:has(section.moves):is([data-p5ov-artwork-choice],[data-p5ov-fakemon-fallback])`;
  // ===== TYPE PALETTE: ALL MIX PERCENTAGES TOGETHER =====
  // These preserve the current Type-theme mixing, without recalibration.
  // Edit ONLY this one CSS block to tune any type in future.
  // Percentages refer to the CANONICAL type fraction in each mix.
  const typePalettePercentCss = `
    .page > main article {
      --p5ov-normal-bg-pct: 34%; --p5ov-normal-light-pct: 60%; --p5ov-normal-dark-pct: 60%;
      --p5ov-fire-bg-pct: 40%; --p5ov-fire-light-pct: 60%; --p5ov-fire-dark-pct: 60%;
      --p5ov-fighting-bg-pct: 34%; --p5ov-fighting-light-pct: 60%; --p5ov-fighting-dark-pct: 60%;
      --p5ov-water-bg-pct: 38%; --p5ov-water-light-pct: 60%; --p5ov-water-dark-pct: 60%;
      --p5ov-flying-bg-pct: 30%; --p5ov-flying-light-pct: 60%; --p5ov-flying-dark-pct: 60%;
      --p5ov-grass-bg-pct: 32%; --p5ov-grass-light-pct: 60%; --p5ov-grass-dark-pct: 60%;
      --p5ov-poison-bg-pct: 38%; --p5ov-poison-light-pct: 60%; --p5ov-poison-dark-pct: 60%;
      --p5ov-electric-bg-pct: 40%; --p5ov-electric-light-pct: 70%; --p5ov-electric-dark-pct: 60%;
      --p5ov-ground-bg-pct: 40%; --p5ov-ground-light-pct: 60%; --p5ov-ground-dark-pct: 60%;
      --p5ov-psychic-bg-pct: 32%; --p5ov-psychic-light-pct: 60%; --p5ov-psychic-dark-pct: 60%;
      --p5ov-rock-bg-pct: 42%; --p5ov-rock-light-pct: 60%; --p5ov-rock-dark-pct: 60%;
      --p5ov-ice-bg-pct: 40%; --p5ov-ice-light-pct: 60%; --p5ov-ice-dark-pct: 60%;
      --p5ov-bug-bg-pct: 38%; --p5ov-bug-light-pct: 60%; --p5ov-bug-dark-pct: 60%;
      --p5ov-dragon-bg-pct: 36%; --p5ov-dragon-light-pct: 60%; --p5ov-dragon-dark-pct: 60%;
      --p5ov-ghost-bg-pct: 42%; --p5ov-ghost-light-pct: 60%; --p5ov-ghost-dark-pct: 60%;
      --p5ov-dark-bg-pct: 45%; --p5ov-dark-light-pct: 60%; --p5ov-dark-dark-pct: 60%;
      --p5ov-steel-bg-pct: 40%; --p5ov-steel-light-pct: 60%; --p5ov-steel-dark-pct: 60%;
      --p5ov-fairy-bg-pct: 40%; --p5ov-fairy-light-pct: 60%; --p5ov-fairy-dark-pct: 60%;
    }
  `;
  // ===== DERIVED COLORS: EXPLICIT BLOCKS PER TYPE, AFTER PARAMETERS =====
  // Same formula for each type. Banner/Move alias Light for now; each
  // alias can receive its own mix formula later without a pair-based rule.
  // Declared on article so --skin-content resolves in the card theme.
  const typePaletteMixCss = `
    /* Normal */
    .page > main article {
      --p5ov-normal-base: var(--skin-normal-bg);
      --p5ov-normal-bg: color-mix(in srgb, var(--p5ov-normal-base) var(--p5ov-normal-bg-pct), var(--skin-content));
      --p5ov-normal-wash: color-mix(in srgb, var(--p5ov-normal-base) var(--p5ov-normal-bg-pct), transparent);
      --p5ov-normal-light: color-mix(in srgb, var(--p5ov-normal-base) var(--p5ov-normal-light-pct), white);
      --p5ov-normal-banner: var(--p5ov-normal-light);
      --p5ov-normal-move: var(--p5ov-normal-light);
      --p5ov-normal-dark: color-mix(in srgb, var(--p5ov-normal-base) var(--p5ov-normal-dark-pct), black);
    }

    /* Fire */
    .page > main article {
      --p5ov-fire-base: var(--skin-fire-bg);
      --p5ov-fire-bg: color-mix(in srgb, var(--p5ov-fire-base) var(--p5ov-fire-bg-pct), var(--skin-content));
      --p5ov-fire-wash: color-mix(in srgb, var(--p5ov-fire-base) var(--p5ov-fire-bg-pct), transparent);
      --p5ov-fire-light: color-mix(in srgb, var(--p5ov-fire-base) var(--p5ov-fire-light-pct), white);
      --p5ov-fire-banner: var(--p5ov-fire-light);
      --p5ov-fire-move: var(--p5ov-fire-light);
      --p5ov-fire-dark: color-mix(in srgb, var(--p5ov-fire-base) var(--p5ov-fire-dark-pct), black);
    }

    /* Fighting */
    .page > main article {
      --p5ov-fighting-base: var(--skin-fighting-bg);
      --p5ov-fighting-bg: color-mix(in srgb, var(--p5ov-fighting-base) var(--p5ov-fighting-bg-pct), var(--skin-content));
      --p5ov-fighting-wash: color-mix(in srgb, var(--p5ov-fighting-base) var(--p5ov-fighting-bg-pct), transparent);
      --p5ov-fighting-light: color-mix(in srgb, var(--p5ov-fighting-base) var(--p5ov-fighting-light-pct), white);
      --p5ov-fighting-banner: var(--p5ov-fighting-light);
      --p5ov-fighting-move: var(--p5ov-fighting-light);
      --p5ov-fighting-dark: color-mix(in srgb, var(--p5ov-fighting-base) var(--p5ov-fighting-dark-pct), black);
    }

    /* Water */
    .page > main article {
      --p5ov-water-base: var(--skin-water-bg);
      --p5ov-water-bg: color-mix(in srgb, var(--p5ov-water-base) var(--p5ov-water-bg-pct), var(--skin-content));
      --p5ov-water-wash: color-mix(in srgb, var(--p5ov-water-base) var(--p5ov-water-bg-pct), transparent);
      --p5ov-water-light: color-mix(in srgb, var(--p5ov-water-base) var(--p5ov-water-light-pct), white);
      --p5ov-water-banner: var(--p5ov-water-light);
      --p5ov-water-move: var(--p5ov-water-light);
      --p5ov-water-dark: color-mix(in srgb, var(--p5ov-water-base) var(--p5ov-water-dark-pct), black);
    }

    /* Flying */
    .page > main article {
      --p5ov-flying-base: var(--skin-flying-bg);
      --p5ov-flying-bg: color-mix(in srgb, var(--p5ov-flying-base) var(--p5ov-flying-bg-pct), var(--skin-content));
      --p5ov-flying-wash: color-mix(in srgb, var(--p5ov-flying-base) var(--p5ov-flying-bg-pct), transparent);
      --p5ov-flying-light: color-mix(in srgb, var(--p5ov-flying-base) var(--p5ov-flying-light-pct), white);
      --p5ov-flying-banner: var(--p5ov-flying-light);
      --p5ov-flying-move: var(--p5ov-flying-light);
      --p5ov-flying-dark: color-mix(in srgb, var(--p5ov-flying-base) var(--p5ov-flying-dark-pct), black);
    }

    /* Grass */
    .page > main article {
      --p5ov-grass-base: var(--skin-grass-bg);
      --p5ov-grass-bg: color-mix(in srgb, var(--p5ov-grass-base) var(--p5ov-grass-bg-pct), var(--skin-content));
      --p5ov-grass-wash: color-mix(in srgb, var(--p5ov-grass-base) var(--p5ov-grass-bg-pct), transparent);
      --p5ov-grass-light: color-mix(in srgb, var(--p5ov-grass-base) var(--p5ov-grass-light-pct), white);
      --p5ov-grass-banner: var(--p5ov-grass-light);
      --p5ov-grass-move: var(--p5ov-grass-light);
      --p5ov-grass-dark: color-mix(in srgb, var(--p5ov-grass-base) var(--p5ov-grass-dark-pct), black);
    }

    /* Poison */
    .page > main article {
      --p5ov-poison-base: var(--skin-poison-bg);
      --p5ov-poison-bg: color-mix(in srgb, var(--p5ov-poison-base) var(--p5ov-poison-bg-pct), var(--skin-content));
      --p5ov-poison-wash: color-mix(in srgb, var(--p5ov-poison-base) var(--p5ov-poison-bg-pct), transparent);
      --p5ov-poison-light: color-mix(in srgb, var(--p5ov-poison-base) var(--p5ov-poison-light-pct), white);
      --p5ov-poison-banner: var(--p5ov-poison-light);
      --p5ov-poison-move: var(--p5ov-poison-light);
      --p5ov-poison-dark: color-mix(in srgb, var(--p5ov-poison-base) var(--p5ov-poison-dark-pct), black);
    }

    /* Electric */
    .page > main article {
      --p5ov-electric-base: var(--skin-electric-bg);
      --p5ov-electric-bg: color-mix(in srgb, var(--p5ov-electric-base) var(--p5ov-electric-bg-pct), var(--skin-content));
      --p5ov-electric-wash: color-mix(in srgb, var(--p5ov-electric-base) var(--p5ov-electric-bg-pct), transparent);
      --p5ov-electric-light: color-mix(in srgb, var(--p5ov-electric-base) var(--p5ov-electric-light-pct), white);
      --p5ov-electric-banner: var(--p5ov-electric-light);
      --p5ov-electric-move: var(--p5ov-electric-light);
      --p5ov-electric-dark: color-mix(in srgb, var(--p5ov-electric-base) var(--p5ov-electric-dark-pct), black);
    }

    /* Ground */
    .page > main article {
      --p5ov-ground-base: var(--skin-ground-bg);
      --p5ov-ground-bg: color-mix(in srgb, var(--p5ov-ground-base) var(--p5ov-ground-bg-pct), var(--skin-content));
      --p5ov-ground-wash: color-mix(in srgb, var(--p5ov-ground-base) var(--p5ov-ground-bg-pct), transparent);
      --p5ov-ground-light: color-mix(in srgb, var(--p5ov-ground-base) var(--p5ov-ground-light-pct), white);
      --p5ov-ground-banner: var(--p5ov-ground-light);
      --p5ov-ground-move: var(--p5ov-ground-light);
      --p5ov-ground-dark: color-mix(in srgb, var(--p5ov-ground-base) var(--p5ov-ground-dark-pct), black);
    }

    /* Psychic */
    .page > main article {
      --p5ov-psychic-base: var(--skin-psychic-bg);
      --p5ov-psychic-bg: color-mix(in srgb, var(--p5ov-psychic-base) var(--p5ov-psychic-bg-pct), var(--skin-content));
      --p5ov-psychic-wash: color-mix(in srgb, var(--p5ov-psychic-base) var(--p5ov-psychic-bg-pct), transparent);
      --p5ov-psychic-light: color-mix(in srgb, var(--p5ov-psychic-base) var(--p5ov-psychic-light-pct), white);
      --p5ov-psychic-banner: var(--p5ov-psychic-light);
      --p5ov-psychic-move: var(--p5ov-psychic-light);
      --p5ov-psychic-dark: color-mix(in srgb, var(--p5ov-psychic-base) var(--p5ov-psychic-dark-pct), black);
    }

    /* Rock */
    .page > main article {
      --p5ov-rock-base: var(--skin-rock-bg);
      --p5ov-rock-bg: color-mix(in srgb, var(--p5ov-rock-base) var(--p5ov-rock-bg-pct), var(--skin-content));
      --p5ov-rock-wash: color-mix(in srgb, var(--p5ov-rock-base) var(--p5ov-rock-bg-pct), transparent);
      --p5ov-rock-light: color-mix(in srgb, var(--p5ov-rock-base) var(--p5ov-rock-light-pct), white);
      --p5ov-rock-banner: var(--p5ov-rock-light);
      --p5ov-rock-move: var(--p5ov-rock-light);
      --p5ov-rock-dark: color-mix(in srgb, var(--p5ov-rock-base) var(--p5ov-rock-dark-pct), black);
    }

    /* Ice */
    .page > main article {
      --p5ov-ice-base: var(--skin-ice-bg);
      --p5ov-ice-bg: color-mix(in srgb, var(--p5ov-ice-base) var(--p5ov-ice-bg-pct), var(--skin-content));
      --p5ov-ice-wash: color-mix(in srgb, var(--p5ov-ice-base) var(--p5ov-ice-bg-pct), transparent);
      --p5ov-ice-light: color-mix(in srgb, var(--p5ov-ice-base) var(--p5ov-ice-light-pct), white);
      --p5ov-ice-banner: var(--p5ov-ice-light);
      --p5ov-ice-move: var(--p5ov-ice-light);
      --p5ov-ice-dark: color-mix(in srgb, var(--p5ov-ice-base) var(--p5ov-ice-dark-pct), black);
    }

    /* Bug */
    .page > main article {
      --p5ov-bug-base: var(--skin-bug-bg);
      --p5ov-bug-bg: color-mix(in srgb, var(--p5ov-bug-base) var(--p5ov-bug-bg-pct), var(--skin-content));
      --p5ov-bug-wash: color-mix(in srgb, var(--p5ov-bug-base) var(--p5ov-bug-bg-pct), transparent);
      --p5ov-bug-light: color-mix(in srgb, var(--p5ov-bug-base) var(--p5ov-bug-light-pct), white);
      --p5ov-bug-banner: var(--p5ov-bug-light);
      --p5ov-bug-move: var(--p5ov-bug-light);
      --p5ov-bug-dark: color-mix(in srgb, var(--p5ov-bug-base) var(--p5ov-bug-dark-pct), black);
    }

    /* Dragon */
    .page > main article {
      --p5ov-dragon-base: var(--skin-dragon-bg);
      --p5ov-dragon-bg: color-mix(in srgb, var(--p5ov-dragon-base) var(--p5ov-dragon-bg-pct), var(--skin-content));
      --p5ov-dragon-wash: color-mix(in srgb, var(--p5ov-dragon-base) var(--p5ov-dragon-bg-pct), transparent);
      --p5ov-dragon-light: color-mix(in srgb, var(--p5ov-dragon-base) var(--p5ov-dragon-light-pct), white);
      --p5ov-dragon-banner: var(--p5ov-dragon-light);
      --p5ov-dragon-move: var(--p5ov-dragon-light);
      --p5ov-dragon-dark: color-mix(in srgb, var(--p5ov-dragon-base) var(--p5ov-dragon-dark-pct), black);
    }

    /* Ghost */
    .page > main article {
      --p5ov-ghost-base: var(--skin-ghost-bg);
      --p5ov-ghost-bg: color-mix(in srgb, var(--p5ov-ghost-base) var(--p5ov-ghost-bg-pct), var(--skin-content));
      --p5ov-ghost-wash: color-mix(in srgb, var(--p5ov-ghost-base) var(--p5ov-ghost-bg-pct), transparent);
      --p5ov-ghost-light: color-mix(in srgb, var(--p5ov-ghost-base) var(--p5ov-ghost-light-pct), white);
      --p5ov-ghost-banner: var(--p5ov-ghost-light);
      --p5ov-ghost-move: var(--p5ov-ghost-light);
      --p5ov-ghost-dark: color-mix(in srgb, var(--p5ov-ghost-base) var(--p5ov-ghost-dark-pct), black);
    }

    /* Dark */
    .page > main article {
      --p5ov-dark-base: var(--skin-dark-bg);
      --p5ov-dark-bg: color-mix(in srgb, var(--p5ov-dark-base) var(--p5ov-dark-bg-pct), var(--skin-content));
      --p5ov-dark-wash: color-mix(in srgb, var(--p5ov-dark-base) var(--p5ov-dark-bg-pct), transparent);
      --p5ov-dark-light: color-mix(in srgb, var(--p5ov-dark-base) var(--p5ov-dark-light-pct), white);
      --p5ov-dark-banner: var(--p5ov-dark-light);
      --p5ov-dark-move: var(--p5ov-dark-light);
      --p5ov-dark-dark: color-mix(in srgb, var(--p5ov-dark-base) var(--p5ov-dark-dark-pct), black);
    }

    /* Steel */
    .page > main article {
      --p5ov-steel-base: var(--skin-steel-bg);
      --p5ov-steel-bg: color-mix(in srgb, var(--p5ov-steel-base) var(--p5ov-steel-bg-pct), var(--skin-content));
      --p5ov-steel-wash: color-mix(in srgb, var(--p5ov-steel-base) var(--p5ov-steel-bg-pct), transparent);
      --p5ov-steel-light: color-mix(in srgb, var(--p5ov-steel-base) var(--p5ov-steel-light-pct), white);
      --p5ov-steel-banner: var(--p5ov-steel-light);
      --p5ov-steel-move: var(--p5ov-steel-light);
      --p5ov-steel-dark: color-mix(in srgb, var(--p5ov-steel-base) var(--p5ov-steel-dark-pct), black);
    }

    /* Fairy */
    .page > main article {
      --p5ov-fairy-base: var(--skin-fairy-bg);
      --p5ov-fairy-bg: color-mix(in srgb, var(--p5ov-fairy-base) var(--p5ov-fairy-bg-pct), var(--skin-content));
      --p5ov-fairy-wash: color-mix(in srgb, var(--p5ov-fairy-base) var(--p5ov-fairy-bg-pct), transparent);
      --p5ov-fairy-light: color-mix(in srgb, var(--p5ov-fairy-base) var(--p5ov-fairy-light-pct), white);
      --p5ov-fairy-banner: var(--p5ov-fairy-light);
      --p5ov-fairy-move: var(--p5ov-fairy-light);
      --p5ov-fairy-dark: color-mix(in srgb, var(--p5ov-fairy-base) var(--p5ov-fairy-dark-pct), black);
    }

  `;
  const style = document.createElement('style');
  const typeLinkRules = TYPES.map(type => `
    .page > main article > .scrollable a.yofi-typed-detail-link[data-yofi-target-type="${type}"] {
      --yofi-target-type-color: var(--skin-${type}-bg);
    }
  `).join('\n');
  style.id = STYLE_ID;

  // Banner colors are CSS-driven, keyed to the base userscript's existing
  // data-yofi-tint-type and data-yofi-header-type attributes. They work even
  // if a user script runs before/after the base's card mutation observer.
  // No JavaScript banner-color readiness class or per-heading style writes.
  const colorRules = TYPES.map(type => `
    ${THEME_ARTICLE}:not(:has(section.moves))[data-yofi-tint-type="${type}"] {
      --p5ov-primary: var(--skin-${type}-bg);
      --p5ov-top-primary: var(--skin-${type}-bg);
      --p5ov-body-ink: ${typeVar(type,'dark')};
      --p5ov-banner-ink: ${typeVar(type,'dark')};
      --p5ov-tint-native-color: ${svTypeColor(type)};
      --p5ov-surface: ${typeVar(type,'bg')};
      /* Monotypes use the same per-type tint strength as indexed dual types.
         This separate wash is intentionally not --yofi-entry-type-wash:
         the QoL script continually resets that variable to 23%. */
      --p5ov-mono-tint-wash: ${typeVar(type,'wash')};
    }
    /* The base script reads the type badge background to decorate the lead.
       Our transparent badge obscures that read, so restore the ORIGINAL
       unmixed type color without altering the native white text halo. */
    ${THEME_ARTICLE}[data-yofi-tint-type="${type}"] .yofi-hero-copy .yofi-type-description-lead {
      --yofi-lead-type-color: var(--skin-${type}-bg) !important;
    }
    ${THEME_ARTICLE}:has(header .type-tag .type.right[data-yofi-header-type="${type}"]) {
      --p5ov-top-secondary: var(--skin-${type}-bg);

    }
  `).join('\n');
  const moveFillRules = TYPES.map(type => `
    ${CSS_ROOT} > .scrollable section.moves dd ul > li > a[data-yofi-target-type="${type}"] {
      --p5ov-move-fill: ${typeVar(type,'move')};
      --p5ov-move-ink: ${typeVar(type,'dark')};
    }
  `).join('\n');
  const darkPaletteRules = TYPES.map(type => `
    html:not(.yofi-type-theme) body.dark-mode .page > main article > header .type-tag > .type[data-yofi-header-type="${type}"],
    html:not(.yofi-type-theme) body.dark-mode .page > main article .inline-type-name[data-p5ov-exact-type="${type}"] {
      --p5ov-exact-type-color: var(--skin-${type}-bg);
    }
  `).join('\n');
  style.textContent = `
    /* QOL defines the universal S/V type palette, including Dark mode. */
    ${typePalettePercentCss}
    ${typePaletteMixCss}
    .yofi-native-theme-item button { cursor: pointer; border: 0;
      font: inherit; background: transparent; color: var(--skin-bg-text);
      display: flex; flex-direction: column; align-items: center; gap: .5em;
      width: 100%; padding: 0; text-transform: uppercase; }
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

    ${typeLinkRules}
    /* Independent Theme module owns all link-color styling. QoL contributes
       only data-yofi-target-type semantic metadata, never a color value. */
    .page > main article > .scrollable a.yofi-typed-detail-link {
      color: color-mix(in srgb, var(--yofi-target-type-color, var(--skin-content-text, #333)) 72%, var(--skin-content-text, #333) 28%) !important;
      text-decoration-color: currentColor !important;
    }
    ${colorRules}
    ${moveFillRules}
    ${darkPaletteRules}
    ${CSS_ROOT}:has(header .type-tag .type.right) {
      --p5ov-band: linear-gradient(90deg,
        var(--p5ov-primary) 0%, var(--p5ov-primary) 47%,
        var(--p5ov-secondary) 53%, var(--p5ov-secondary) 100%);
    }
    /* The top header's type transition leans diagonally; lower banners
       use the solid secondary type treatment in this variant. */
    ${CSS_ROOT}:has(header .type-tag .type.right) {
      --p5ov-top-band: linear-gradient(105deg,
        var(--p5ov-top-primary) 0%, var(--p5ov-top-primary) 47%,
        var(--p5ov-top-secondary) 53%, var(--p5ov-top-secondary) 100%);
    }
    ${CSS_ROOT} > header {
      background: var(--p5ov-top-band, var(--p5ov-top-primary)) !important;
      color: #fff !important;
    }
    ${CSS_ROOT} > header :is(a,button,.title,.yofi-header-dex-id,.yofi-entry-action-zone) {
      color: #fff !important;
    }
    /* Header legibility, matching the understated shadow around the hollow
       white type capsule. Text only: preserve the existing header geometry. */
    ${CSS_ROOT} > header .title,
    ${CSS_ROOT} > header .title .yofi-fakemon-title-text,
    ${CSS_ROOT} > header .yofi-header-dex-id {
      text-shadow: 0 1px 2px rgba(0,0,0,.30), 0 0 1px rgba(0,0,0,.16) !important;
    }
    ${CSS_ROOT} > header .yofi-result-nav,
    ${CSS_ROOT} > header .yofi-result-nav-placeholder {
      text-shadow: none !important;
    }
    /* EXPERIMENT: Shadow outside the entire species detail card, including the rounded
       header and bottom corners. Restrict to Pokemon/Fakemon detail cards. */
    .page > main article:has(section.moves):has(> header .type-tag) {
      box-shadow: 0 8px 22px rgba(28,23,30,.25), 0 2px 7px rgba(28,23,30,.14) !important;
    }

    /* Lower banners use the SAME fill and shadow recipe as move pills.
       Native slanted banner geometry remains unchanged. The outer shadow
       is clipped at the card's flush left edge by the existing card clipping. */
    ${CSS_ROOT} > .scrollable section h2::before {
      background: var(--p5ov-secondary) !important;
      box-shadow: 0 1px 2px #0003, inset 0 1px #fffa !important;
    }
    ${CSS_ROOT} > .scrollable section h2,
    ${CSS_ROOT} > .scrollable .yofi-scores-banner,
    ${CSS_ROOT} > .scrollable .yofi-scores-banner h2,
    ${CSS_ROOT} > .scrollable dl.yofi-scores-strip > :is(dt,dd) {
      /* Same type/black mix used for move-pill lettering; banner type, not tint type. */
      text-shadow: none !important;
      color: var(--p5ov-art-banner-ink, var(--p5ov-banner-ink)) !important;
    }

    /* Type ink applies to card prose and standard information labels only.
       Monotypes use their own type; indexed dual types use the reviewed backgroundType.
       Do not alter move pills, effectiveness badges, native header or lead. */
    ${CSS_ROOT} > .scrollable {
      color: var(--p5ov-body-ink) !important;
    }
    ${CSS_ROOT} > .scrollable :is(.yofi-hero-copy p, section.abilities p, section.abilities h3,
      section.abilities .ability,
      section.evolution p, section.evolution h3, section.evolutions p,
      section.evolutions h3, section.moves dt, section.moves > dl > dt,
      section.other-info p, section.other-info dt, section.other-info dd) {
      color: var(--p5ov-body-ink) !important;
    }

    /* Promoted scores and abilities retain their native nodes and classes.
       Theme supplies color variables; Species Card controls geometry. */
    ${CSS_ROOT}.lab3-active > .scrollable .yofi-species-hero {
      --lab3-score-bg: var(--p5ov-art-banner-color, var(--p5ov-secondary)) !important;
      color: var(--p5ov-body-ink) !important;
    }
    ${CSS_ROOT}.lab3-active > .scrollable .yofi-species-hero .lab3-vital,
    ${CSS_ROOT}.lab3-active > .scrollable .yofi-species-hero .lab3-biologies {
      color: var(--p5ov-body-ink) !important;
    }
    /* Light only: one consistent 15% neutral-grey surface for the vital
       tiles and Egg bar. Gender retains its native segments and background;
       Dark and Type keep their existing translucent tile treatments. */
    html:not(.yofi-type-theme) body:not(.dark-mode)
      .page > main article.lab3-active > .scrollable .yofi-species-hero :is(.lab3-vital,.lab3-egg),
    html:not(.yofi-type-theme) body:not(.dark-mode)
      .page > main article:not(.lab3-active) > .scrollable
      .yofi-species-hero .yofi-hero-facts:not(.lab3-copy-facts) .yofi-hero-field-egg {
      background: rgba(0,0,0,.15) !important;
    }
    /* Native Genderless bar: retain the main QoL script's geometry,
       gray --skin-agender-bg segment, and white center label.
       No theme recoloring, pill styling, or shadow on this gender bar. */
    /* ACTUAL VISIBLE FILL: the site's Tag.svelte puts background:var(--color)
       on span.name, not on span.tag. The native --color resolves to charcoal,
       so styling the outer tag alone never changes the visible badge. */
    ${CSS_ROOT} > .scrollable section.abilities p.no-margin > .tag > .name {
      background: var(--p5ov-body-ink) !important;
      background-color: var(--p5ov-body-ink) !important;
      color: var(--p5ov-surface) !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }

    /* Evolution species names must read their OWN target type, unmixed.
       The main QOL script already supplies --yofi-target-type-color reliably. */
    ${CSS_ROOT} > .scrollable section:is(.evolution,.evolutions) a.yofi-typed-detail-link {
      color: var(--yofi-target-type-color, var(--p5ov-body-ink)) !important;
      text-decoration-color: currentColor !important;
    }

    /* Fakémon temporarily retain primary banners and secondary background tint
       and exactly its configured wash. The previous :not(:has(.right)) gate
       accidentally left every unindexed DUAL Fakemon on the QoL 23% wash:
       Rock/Steel Rookite differed from Rock Minereon, and Normal/Rock
       Rocking differed from Normal Veeveon. Original Pokemon now use
       the reviewed backgroundType wash below. */
    ${CSS_ROOT}[data-p5ov-fakemon-fallback],
    ${CSS_ROOT}[data-p5ov-fakemon-fallback] > .scrollable {
      background: linear-gradient(var(--p5ov-mono-tint-wash), var(--p5ov-mono-tint-wash)), var(--skin-content) !important;
    }

    /* Type-theme fallback on move/TM detail pages without a species Moves
       section. QoL previously handled these pages; keep equivalent behavior. */
    ${THEME_ARTICLE}:not(:has(section.moves)),
    ${THEME_ARTICLE}:not(:has(section.moves)) > .scrollable {
      background: linear-gradient(var(--p5ov-mono-tint-wash),var(--p5ov-mono-tint-wash)),var(--skin-content) !important;
    }
    ${THEME_ARTICLE}:not(:has(section.moves)) > header {
      background: var(--p5ov-top-primary) !important;
      color: #fff !important;
    }

    /* Original Pokemon backgroundType determines card tint, with the other
       type on banners; native header keeps its ORIGINAL type order.
       Monotypes stay single-type, Fakemon keep their existing fallback. */
    ${CSS_ROOT}[data-p5ov-artwork-choice] > .scrollable section h2::before {
      background: var(--p5ov-art-banner-color) !important;
    }
    ${CSS_ROOT}[data-p5ov-artwork-choice],
    ${CSS_ROOT}[data-p5ov-artwork-choice] > .scrollable {
      background: linear-gradient(var(--p5ov-art-tint-wash),var(--p5ov-art-tint-wash)), var(--skin-content) !important;
    }

    /* Fakemon's small identity watermark belongs beneath its name.
       The base userscript gives it a muted grey color; on a colored Type
       header it must be white. Only the header watermark is affected. */
    ${CSS_ROOT} > header .yofi-header-fakemon-id {
      color: #fff !important;
    }

    /* Original white SVGs inside a transparent white-outline badge. */
    ${CSS_ROOT} > header > .type-tag.yofi-header-icon-pill {
      box-sizing: border-box !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex: 0 0 auto !important;
      width: max-content !important;
      min-width: 2.15rem !important;
      height: 2.25rem !important;
      min-height: 2.25rem !important;
      padding: 0 .54em !important;
      margin-block: 0 !important;
      gap: 0 !important;
      overflow: visible !important;
      border: 1px solid #fff !important;
      border-radius: 999px !important;
      background: transparent !important;
      box-shadow: none !important;
      white-space: nowrap !important;
    }
    ${CSS_ROOT} > header > .type-tag.yofi-header-icon-pill > .type {
      position: relative !important;
      box-sizing: border-box !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex: 0 0 auto !important;
      width: auto !important;
      min-width: 0 !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      color: #fff !important;
      transform: none !important;
    }
    ${CSS_ROOT} > header > .type-tag.yofi-header-icon-pill .unskew {
      color: #fff !important;
      transform: none !important;
    }
    ${CSS_ROOT} > header > .type-tag.yofi-header-icon-pill > .type + .type::before {
      content: '/' !important;
      display: inline-block !important;
      position: static !important;
      margin: 0 .42em !important;
      color: #fff !important;
      font: 700 1.2em/1 system-ui,sans-serif !important;
      transform: none !important;
    }
    ${CSS_ROOT} > header > .type-tag.yofi-header-icon-pill svg.yofi-type-glyph,
    ${CSS_ROOT} > header > .type-tag.yofi-header-icon-pill svg.yofi-type-glyph :is(path,circle) {
      color: #fff !important;
      fill: currentColor !important;
    }

    /* Type theme: compact, natural-width, row-major, left-packed pills. */
    ${CSS_ROOT} > .scrollable section.moves dd ul {
      display: flex !important;
      flex-flow: row wrap !important;
      align-items: flex-start !important;
      align-content: flex-start !important;
      justify-content: flex-start !important;
      box-sizing: border-box !important;
      width: 100% !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      gap: 6px !important;
      column-count: auto !important;
      column-width: auto !important;
      list-style: none !important;
    }
    ${CSS_ROOT} > .scrollable section.moves dd ul > li {
      display: block !important;
      flex: 0 0 auto !important;
      max-width: 100% !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      line-height: 1 !important;
      break-inside: avoid !important;
    }
    ${CSS_ROOT} > .scrollable section.moves dd ul > li::after {
      content: none !important;
      display: none !important;
    }
    ${CSS_ROOT} > .scrollable section.moves dd ul > li > a {
      --p5ov-move-color: var(--yofi-target-type-color, var(--skin-normal-bg, #888));
      box-sizing: border-box !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: flex-start !important;
      flex: 0 0 auto !important;
      gap: .35em !important;
      width: max-content !important;
      min-width: 0 !important;
      max-width: 100% !important;
      min-height: 1.75em !important;
      margin: 0 !important;
      padding: .26em .67em !important;
      border: 0 !important;
      border-radius: 999px !important;
      background: var(--p5ov-move-fill, color-mix(in srgb, var(--p5ov-move-color) 60%, white 40%)) !important;
      color: var(--p5ov-move-ink, color-mix(in srgb, var(--p5ov-move-color) 60%, black 40%)) !important;
      font-size: .91em !important;
      font-weight: 600 !important;
      line-height: 1.12 !important;
      text-decoration: none !important;
      white-space: nowrap !important;
      box-shadow: 0 1px 2px #0003, inset 0 1px #fffa !important;
    }
    ${CSS_ROOT} > .scrollable section.moves dd ul[data-p5ov-kind="tm"] a {
      gap: 0 !important;
    }
    ${CSS_ROOT} > .scrollable section.moves dd .p5ov-tm-number {
      white-space: pre !important;
    }
    ${CSS_ROOT} > .scrollable section.moves dd a > :is(.p5ov-tm-number,.p5ov-tm-name) {
      display: inline !important;
      flex: 0 0 auto !important;
      width: auto !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    ${CSS_ROOT} > .scrollable section.moves > dl {
      row-gap: 6px !important;
    }
    /* Important: the TM subsection separation is LARGER than row spacing. */
    ${CSS_ROOT} > .scrollable section.moves > dl + dl {
      margin-block-start: 1.85em !important;
    }


    /* IMPORTANT: do not replaceChildren() or set textContent on links owned by
       Svelte. Keep its original text node attached so keyed-list recycling can
       update the visible label and href together. A generated pseudo-label
       supplies our compact TM punctuation without touching its DOM children. */
    ${CSS_ROOT} > .scrollable section.moves dd ul[data-p5ov-kind="tm"] > li > a[data-p5ov-display],
    html:not(.yofi-type-theme) .page > main article > .scrollable section.moves dd ul[data-p5ov-kind="tm"] > li > a[data-p5ov-display] {
      font-size: 0 !important;
      /* With font-size:0 hiding the native Svelte text, em-based padding
         collapses to zero. Restore exactly the move-pill proportions with
         the original measured font size, without touching text nodes. */
      padding: calc(var(--p5ov-tm-font-size, 14px) * .26)
               calc(var(--p5ov-tm-font-size, 14px) * .67) !important;
      min-height: var(--p5ov-tm-min-height, 1.75rem) !important;
    }
    ${CSS_ROOT} > .scrollable section.moves dd ul[data-p5ov-kind="tm"] > li > a[data-p5ov-display]::before,
    html:not(.yofi-type-theme) .page > main article > .scrollable section.moves dd ul[data-p5ov-kind="tm"] > li > a[data-p5ov-display]::before {
      content: attr(data-p5ov-display) !important;
      font-size: var(--p5ov-tm-font-size, 1rem) !important;
      font-weight: inherit !important;
      line-height: 1.12 !important;
      white-space: var(--yofi-species-tm-white-space, nowrap) !important;
      color: inherit !important;
    }
    html:not(.yofi-type-theme) .page > main article > .scrollable section.moves dd ul[data-p5ov-kind="tm"] > li > a[data-p5ov-display]::before {
      text-decoration: underline !important;
      text-decoration-color: currentColor !important;
    }

    /* Dark: use the BASE SCRIPT'S exact Scarlet/Violet palette, not
       dark-theme adjustments or brightness/contrast workarounds. The
       badge letter half stays its native dark/grey neutral. */
    html:not(.yofi-type-theme) body.dark-mode .page > main article > header .type-tag,
    html:not(.yofi-type-theme) body.dark-mode .page > main article > header .type-tag > .type,
    html:not(.yofi-type-theme) body.dark-mode .page > main article .inline-type-name,
    html:not(.yofi-type-theme) body.dark-mode .page > main article .inline-type-name > * {
      filter: none !important;
      -webkit-filter: none !important;
    }
    html:not(.yofi-type-theme) body.dark-mode .page > main article > header .type-tag > .type[data-yofi-header-type] {
      background: var(--p5ov-exact-type-color) !important;
      background-color: var(--p5ov-exact-type-color) !important;
    }
    html:not(.yofi-type-theme) body.dark-mode .page > main article .inline-type-name[data-p5ov-exact-type] > :first-child {
      background: var(--p5ov-exact-type-color) !important;
      background-color: var(--p5ov-exact-type-color) !important;
    }

    /* Light/Dark: link styling. Species Card owns adaptive TM geometry. */
    html:not(.yofi-type-theme) .page > main article > .scrollable section.moves dd ul[data-p5ov-kind="tm"]:not([data-yofi-species-tm-columns]) {
      display: block !important;
      box-sizing: border-box !important;
      width: 100% !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      list-style: none !important;
      column-count: 1 !important;
      column-width: auto !important;
      column-gap: 12px !important;
    }
    html:not(.yofi-type-theme) .page > main article > .scrollable section.moves dd ul[data-p5ov-kind="tm"] > li {
      display: block !important;
      break-inside: avoid !important;
      white-space: var(--yofi-species-tm-white-space, nowrap) !important;
      line-height: 1.3 !important;
      margin: 0 0 .24em !important;
    }
    html:not(.yofi-type-theme) .page > main article > .scrollable section.moves dd a {
      text-decoration: underline !important;
      text-decoration-color: currentColor !important;
    }
    html:not(.yofi-type-theme) body.dark-mode .page > main article > .scrollable section.moves dd a,
    html:not(.yofi-type-theme) body.dark-mode .page > main article > .scrollable section.moves dd a.yofi-typed-detail-link {
      color: var(--skin-content-text, #ddd) !important;
      text-decoration-color: currentColor !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  let stopped = false;
  let scheduled = false;
  let frameId = 0;
  let observer;
  let lastError = null;
  const cards = () => [...document.querySelectorAll('.page > main article')]
    .filter(article => article.getClientRects().length > 0 &&
      article.querySelector('section.moves, :scope > header .type-tag > .type'));
  function routeGroup() {
    const parts=location.pathname.split('/').filter(Boolean);
    if(['en','es','fr','de','pt'].includes(parts[0]))parts.shift();
    return parts[0] || '';
  }
  function headerTypeName(segment) {
    const recorded=segment.dataset.yofiHeaderType;
    if(recorded && TYPES.includes(recorded))return recorded;
    const local=segment.style.getPropertyValue('--skin-local-bg');
    const typed=local.match(/--skin-([a-z]+)-bg/i)?.[1];
    if(typed && TYPES.includes(typed))return typed;
    const content=segment.querySelector('.yofi-type-original')?.textContent ||
      segment.querySelector('.unskew')?.textContent || segment.textContent || '';
    const clean=content.trim().toLowerCase().replace(/[^a-z]/g,'');
    return TYPES.includes(clean)?clean:null;
  }
  function syncCardType(card, current) {
    const segments=[...card.querySelectorAll(':scope > header .type-tag > .type')];
    const primary=headerTypeName(segments[0]);
    const eligible=current==='type' && primary &&
      ['pokemon','fakemon','moves','tms'].includes(routeGroup());
    card.classList.toggle('yofi-type-tinted',!!eligible);
    if(eligible){
      if(card.dataset.yofiTintType!==primary)card.dataset.yofiTintType=primary;
    } else if(card.hasAttribute('data-yofi-tint-type')) card.removeAttribute('data-yofi-tint-type');
  }
  const mode = () => document.documentElement.classList.contains('yofi-type-theme')
    ? 'type' : document.body?.classList.contains('dark-mode') ? 'night' : 'day';
  const tmLabel = ul => {
    const parent = ul.closest('dd');
    const dt = parent?.previousElementSibling;
    return dt?.tagName === 'DT' ? dt.textContent.trim() : '';
  };
  function isTm(ul) {
    const links = [...ul.querySelectorAll('li > a[href]')];
    if (!links.length) return false;
    if (/^TM\s*:?$/i.test(tmLabel(ul))) return true;
    if (links.some(a => /(?:^|\/)tms?(?:\/|\?|$)/i.test(a.getAttribute('href') || ''))) return true;
    return links.every(a => /^\s*(?:TM\s*)?\d{1,4}\s*[-\u2013\u2014.:)]\s*\S/i.test(a.textContent) ||
      !!a.querySelector('.p5ov-tm-number'));
  }
  function kind(ul) {
    if (isTm(ul)) return 'tm';
    const label = tmLabel(ul);
    if (/^(starting|egg|level\s*\d+)/i.test(label)) return 'move';
    return [...ul.querySelectorAll('li > a[href]')].some(a => /(?:^|\/)moves?(?:\/|\?|$)/i.test(a.getAttribute('href') || '')) ? 'move' : null;
  }

  // Svelte owns each anchor's original text node and often reuses it after a
  // species change. NEVER replaceChildren(), .innerHTML, or .textContent here.
  // Only an attribute used by ::before may change. The site remains the sole
  // authority on both the visible link text and its target ID.
  function formatTm(link, current) {
    const raw = link.textContent.trim();
    const match = raw.match(/^\s*(?:TM\s*)?(\d{1,4})\s*[-\u2013\u2014.:)]\s*(.+)$/i);
    if (!match) {
      if (link.hasAttribute('data-p5ov-display')) link.removeAttribute('data-p5ov-display');
      return;
    }
    if (!link.style.getPropertyValue('--p5ov-tm-font-size')) {
      // Measure once before our zero-font hide rule is active.
      const px = parseFloat(getComputedStyle(link).fontSize) || 14;
      link.style.setProperty('--p5ov-tm-font-size', `${px}px`);
      link.style.setProperty('--p5ov-tm-min-height', `${(px * 1.75).toFixed(2)}px`);
    }
    const display = current === 'type'
      ? `${match[1]} ${match[2]}` : `${match[1]}. ${match[2]}`;
    if (link.getAttribute('data-p5ov-display') !== display)
      link.setAttribute('data-p5ov-display', display);
  }

  // Native type components often encode their real type only in
  // --skin-local-bg (including on a nested child), not in their visible
  // one-letter abbreviation. Never infer Fire/Flying/Fairy from "F".
  function exactBadgeType(badge) {
    const nodes = [badge, ...badge.querySelectorAll('*')];
    for (const node of nodes) {
      const own = node.style?.getPropertyValue('--skin-local-bg') || '';
      const css = own.match(/--skin-([a-z]+)-bg/i)?.[1];
      if (TYPES.includes(css)) return css;
      const cls = [...node.classList || []].join(' ');
      const match = cls.match(/(?:^|\s)(?:type-|skin-)(normal|fire|fighting|water|flying|grass|poison|electric|ground|psychic|rock|ice|bug|dragon|ghost|dark|steel|fairy)(?:\s|$)/i);
      if (match) return match[1].toLowerCase();
    }
    const computed = getComputedStyle(badge).getPropertyValue('--skin-local-bg');
    const css = computed.match(/--skin-([a-z]+)-bg/i)?.[1];
    return TYPES.includes(css) ? css : null;
  }
  function syncDarkBadgeColors(card, current) {
    if (current !== 'night') return;
    for (const badge of card.querySelectorAll('.inline-type-name')) {
      const type = exactBadgeType(badge);
      if (type && badge.dataset.p5ovExactType !== type) badge.dataset.p5ovExactType = type;
      // A badge with no verifiable type stays native, not guessed.
    }
  }
  function speciesIdentity(card) {
    if (!card.querySelector('section.stats')) return null;
    const metadata = card.querySelector('section.info > div:first-child > dl');
    const rawId = [...(metadata?.children || [])]
      .find(node => node.tagName === 'DD')?.textContent?.trim() || '';
    if (!rawId) return null;
    const numeric = rawId.replace(/^#/, '');
    if (routeGroup() === 'fakemon' || !/^\d+$/.test(numeric)) {
      const id = rawId.replace(/^F\./i, '');
      return { group:'fakemon', id, key:`fakemon:${id}` };
    }
    // Read only the native title's text and preserved sex character. Header
    // navigation, copied IDs and decorative SVG labels are not species names.
    const title = card.querySelector(':scope > header > .title, :scope > header > h1');
    if (!title) return null;
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    let name = '';
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.parentElement?.closest('button, svg, .yofi-header-id, .yofi-result-nav-placeholder'))
        name += node.nodeValue;
    }
    const nativeId = `${Number(numeric)}:${name.replace(/\s+/g,' ').trim().toLowerCase()}`;
    const id = ARTWORK_IDS_BY_NATIVE_RECORD[nativeId] || nativeId;
    return { group:'pokemon', id, key:`pokemon:${id}` };
  }
  const PALETTE_PROPERTIES = ['--p5ov-primary','--p5ov-secondary','--p5ov-top-primary',
    '--p5ov-top-secondary','--p5ov-art-banner-color','--p5ov-art-banner-ink',
    '--p5ov-banner-ink','--p5ov-body-ink','--p5ov-surface','--p5ov-tint-native-color',
    '--p5ov-art-tint-wash','--p5ov-mono-tint-wash'];
  function clearArtworkChoice(card) {
    card.removeAttribute('data-p5ov-artwork-choice');
    card.removeAttribute('data-p5ov-fakemon-fallback');
    for (const property of PALETTE_PROPERTIES) card.style.removeProperty(property);
  }
  const reportedMissingChoices = new Set();
  function syncArtworkChoice(card, current) {
    if (current !== 'type' || !card.classList.contains('yofi-type-tinted')) {
      clearArtworkChoice(card);
      return;
    }
    const identity = speciesIdentity(card);
    if (!identity) return;
    const actual = [...card.querySelectorAll(':scope > header .type-tag > .type')]
      .map(headerTypeName).filter(Boolean);
    if (!actual.length) return;
    let primary = actual[0];
    let secondary = actual[1] || null;
    let backgroundType;
    let banner;
    if (identity.group === 'pokemon') {
      backgroundType = secondary ? ORIGINAL_POKEMON_BACKGROUND_TYPES[identity.id] : primary;
      if (!backgroundType || !actual.includes(backgroundType)) {
        artworkLastError = `Invalid/missing original backgroundType: ${identity.id}`;
        if (!reportedMissingChoices.has(identity.id)) {
          reportedMissingChoices.add(identity.id);
          console.error('[P5 Theme Overlay]', artworkLastError);
        }
        clearArtworkChoice(card);
        return;
      }
      banner = secondary ? actual.find(type => type !== backgroundType) : primary;
    } else {
      // Fakemon: unchanged primary banner/secondary tint until creator choice
      // and native cross-device persistence are implemented separately.
      banner = primary;
      backgroundType = secondary || primary;
    }
    const tint = backgroundType;
    const choiceKey = `${identity.key}:${primary}/${secondary || ''}:${banner}/${tint}`;
    if (card.dataset.p5ovArtworkChoice === choiceKey ||
        card.dataset.p5ovFakemonFallback === choiceKey) return;
    // Commit a complete palette once, independent of image load/src mutations.
    card.style.setProperty('--p5ov-primary', svTypeColor(primary));
    card.style.setProperty('--p5ov-top-primary', svTypeColor(primary));
    card.style.setProperty('--p5ov-top-secondary', svTypeColor(secondary || primary));
    const bannerFill = typeVar(banner,'banner');
    card.style.setProperty('--p5ov-secondary', bannerFill);
    card.style.setProperty('--p5ov-art-banner-color', bannerFill);
    const bannerInk = typeVar(banner,'dark');
    card.style.setProperty('--p5ov-art-banner-ink', bannerInk);
    card.style.setProperty('--p5ov-banner-ink', bannerInk);
    card.style.setProperty('--p5ov-body-ink', typeVar(tint,'dark'));
    card.style.setProperty('--p5ov-tint-native-color', svTypeColor(tint));
    card.style.setProperty('--p5ov-surface', typeVar(tint,'bg'));
    const wash = typeVar(tint,'wash');
    card.style.setProperty('--p5ov-art-tint-wash', wash);
    card.style.setProperty('--p5ov-mono-tint-wash', wash);
    card.removeAttribute(identity.group === 'fakemon' ? 'data-p5ov-artwork-choice' : 'data-p5ov-fakemon-fallback');
    card.dataset[identity.group === 'fakemon' ? 'p5ovFakemonFallback' : 'p5ovArtworkChoice'] = choiceKey;
    artworkApplied++;
  }

  function processCardColors(card, current) {
    card.dataset.p5ovMode = current;
    syncCardType(card, current);
    syncDarkBadgeColors(card, current);
    syncArtworkChoice(card, current);
  }
  function processCard(card, current) {
    processCardColors(card, current);
    for (const ul of card.querySelectorAll('section.moves dd ul')) {
      const classification = kind(ul);
      if (!classification) continue;
      if (ul.dataset.p5ovKind !== classification) ul.dataset.p5ovKind = classification;
      if (classification !== 'tm') continue;
      for (const link of ul.querySelectorAll('li > a[href]')) formatTm(link, current);
    }
  }
  function prepareSpeciesCardBeforeReveal(event) {
    const card = event.detail?.article;
    if (!(card instanceof HTMLElement)) return;
    try {
      // Color only: TM measurement remains in the normal scheduled pass.
      processCardColors(card, mode());
    } catch (error) {
      console.warn('[P5 Theme Overlay v0.3.50] Incoming-card color sync failed:', error);
    }
  }
  document.addEventListener(PRE_REVEAL_EVENT, prepareSpeciesCardBeforeReveal);
  function apply() {
    scheduled = false;
    if (stopped) return;
    try {
      const current = mode();
      // Svelte may retain an outgoing card during route transitions.
      // Processing only .at(-1) left the *visible* card's TMs untouched.
      for (const card of cards()) processCard(card, current);
      installThemeDialog();
      lastError = null;
    } catch (error) {
      lastError = String(error?.stack || error);
      console.error('[P5 Theme Overlay v0.3.50]', error);
    }
  }
  function schedule() {
    if (stopped || scheduled) return;
    scheduled = true;
    frameId = requestAnimationFrame(apply);
  }
  function stop() {
    stopped = true;
    modules.status(registration,'stopped');
    cancelAnimationFrame(frameId);
    observer?.disconnect();
    window.removeEventListener('resize', schedule);
    window.removeEventListener('load', schedule);
    document.fonts?.removeEventListener?.('loadingdone', whenFontsChange);
    document.removeEventListener('change', onNativeThemeChange, true);
    document.removeEventListener(PRE_REVEAL_EVENT, prepareSpeciesCardBeforeReveal);
    dialogBubbleObserver?.disconnect();
    // Only legacy overlay-owned dialog entries are ours to remove.
    // QOL-owned Light/Dark controls must survive uninstalling the overlay.
    document.querySelectorAll('.yofi-native-theme-item:not([data-yofi-qol-owned="true"])').forEach(el => el.remove());
    if(window.__yofiQolThemeExtension?.set===setThemeMode) delete window.__yofiQolThemeExtension;
    document.documentElement.classList.remove('yofi-type-theme');
    window.__yofiQolThemeBridge?.syncSettings?.();
    window.__yofiQolThemeBridge?.syncMenu?.();
    for (const card of document.querySelectorAll('article[data-p5ov-mode]')) {
      card.classList.remove('yofi-type-tinted');
      card.removeAttribute('data-yofi-tint-type');
      card.removeAttribute('data-p5ov-mode');
      for (const ul of card.querySelectorAll('section.moves ul[data-p5ov-kind]')) {
        ul.removeAttribute('data-p5ov-kind');
        for (const a of ul.querySelectorAll('a[href]')) {
          a.removeAttribute('data-p5ov-display');
          a.style.removeProperty('--p5ov-tm-font-size');
          a.style.removeProperty('--p5ov-tm-min-height');
        }
      }
    }
    for (const card of document.querySelectorAll('article:is([data-p5ov-artwork-choice],[data-p5ov-fakemon-fallback])')) clearArtworkChoice(card);
    style.remove();
    if (window[KEY]?.stop === stop) delete window[KEY];
  }
  observer = new MutationObserver(changes => {
    if (changes.some(change => {
      const target = change.target.nodeType === 1 ? change.target : change.target.parentElement;
      return target?.closest?.('.page > main') || target?.matches?.('html,body,.page,main');
    })) schedule();
  });
  observer.observe(document.documentElement, {subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','href','src','data-edition','data-yofi-header-type','data-yofi-target-type']});
  // Low-frequency safety net for iOS Userscripts injection / late Svelte updates.
  const whenFontsChange = () => schedule();
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('load', schedule, {once:true});
  document.fonts?.ready?.then(() => { if (!stopped) whenFontsChange(); });
  document.fonts?.addEventListener?.('loadingdone', whenFontsChange);
  window[KEY] = {
    version:'0.3.50', stop, refresh:apply,
    diagnose() {
      const all = cards();
      const a = all.find(card => card.getClientRects().length && card.getBoundingClientRect().width > 0) || all[0];
      const h = a?.querySelector('.scrollable section h2');
      const tm = a?.querySelector('section.moves ul[data-p5ov-kind="tm"]');
      const header = a?.querySelector(':scope > header');
      const hidden = [...(a?.querySelectorAll('section.abilities p.no-margin > .tag') || [])]
        .find(el => el.textContent.trim() === 'Hidden');
      const genderless = a?.querySelector('.yofi-hero-gender .gender-ratio-display:has(> .bar.genderless)');
      const genderlessLabel = genderless?.querySelector('.yofi-gender-center-label');
      return {
        version:'0.3.50', themeMode, nativeMode:window.__yofiQolThemeBridge?.mode?.(), heroActive:!!a?.classList.contains('lab3-active'), heroScoresVisible:!!a?.classList.contains('lab3-scores'), heroAbilitiesVisible:!!a?.classList.contains('lab3-abilities'), artworkApplied, artworkIndexed:Object.keys(ORIGINAL_POKEMON_BACKGROUND_TYPES).length, artworkSpeciesId:a && speciesIdentity(a)?.id, artworkChoice:a?.dataset.p5ovArtworkChoice || null, artworkSelected:a?.dataset.p5ovArtworkChoice && ORIGINAL_POKEMON_BACKGROUND_TYPES[speciesIdentity(a)?.id] || null, backgroundType:a && speciesIdentity(a)?.group === 'pokemon' && (ORIGINAL_POKEMON_BACKGROUND_TYPES[speciesIdentity(a)?.id] || null), artworkError:artworkLastError, cardCount:all.length, theme:mode(),
        tinted:!!a?.classList.contains('yofi-type-tinted'),
        computedBodyInk:a?.querySelector(':scope > .scrollable') && getComputedStyle(a.querySelector(':scope > .scrollable')).color,
        computedBannerInk:h && getComputedStyle(h).color,
        heroAbilityInk:a?.querySelector('.lab3-right > section.abilities .ability') && getComputedStyle(a.querySelector('.lab3-right > section.abilities .ability')).color,
        heroAbilityBanner:a?.querySelector('.lab3-right > section.abilities > h2') && {
          background:getComputedStyle(a.querySelector('.lab3-right > section.abilities > h2')).backgroundColor,
          text:getComputedStyle(a.querySelector('.lab3-right > section.abilities > h2')).color
        },
        heroScoreRow:a?.querySelector('.lab3-left-extra > dl.yofi-scores-strip') && {
          background:getComputedStyle(a.querySelector('.lab3-left-extra > dl.yofi-scores-strip')).backgroundColor,
          text:getComputedStyle(a.querySelector('.lab3-left-extra > dl.yofi-scores-strip')).color
        },
        hiddenTag: hidden ? {
          insideNativeWrapper: !!hidden.closest('.yofi-native-hidden-pair'),
          inlineBackground:hidden.style.background,
          background:getComputedStyle(hidden).backgroundColor,
          foreground:getComputedStyle(hidden).color,
          innerBackground:hidden.querySelector(':scope > .name') && getComputedStyle(hidden.querySelector(':scope > .name')).backgroundColor,
          innerForeground:hidden.querySelector(':scope > .name') && getComputedStyle(hidden.querySelector(':scope > .name')).color
        } : null,
        genderless:genderless ? {
          background:getComputedStyle(genderless).backgroundColor,
          text:genderlessLabel && getComputedStyle(genderlessLabel).color
        } : null,
        primary:a?.dataset.yofiTintType || null,
        types:[...a?.querySelectorAll(':scope > header .type-tag > .type') || []].map(e => e.dataset.yofiHeaderType || null),
        bannerVariable:a && getComputedStyle(a).getPropertyValue('--p5ov-band').trim(),
        headingBackground:h && { color:getComputedStyle(h,'::before').backgroundColor, image:getComputedStyle(h,'::before').backgroundImage },
        headerBackground:header && { color:getComputedStyle(header).backgroundColor, image:getComputedStyle(header).backgroundImage },
        tmFound:!!tm, firstTM:tm?.querySelector('li>a')?.textContent || null, firstTMPreview:tm?.querySelector('li>a')?.getAttribute('data-p5ov-display') || null,
        moveColors:[...a?.querySelectorAll('section.moves dd ul li>a[href]') || []].slice(0,60).map(link=>({
          text:link.textContent.trim(), href:link.getAttribute('href'),
          color:link.style.getPropertyValue('--yofi-target-type-color'),
          computed:getComputedStyle(link).getPropertyValue('--yofi-target-type-color').trim()
        })),
        tmGeometryOwner:themeMode === 'type' ? 'Theme Overlay' : 'Species Card',
        lastError
      };
    }
  };
  window.__yofiQolThemeExtension = {
    options: [...THEME_ORDER], mode: () => themeMode,
    set: setThemeMode, quickMenuOption,
    label: labelTheme
  };
  setThemeMode(themeMode);
  document.addEventListener('change', onNativeThemeChange, true);
  apply();
  console.info('[P5 Theme Overlay v0.3.50 - Native Theme Targets] installed');
  } // runThemeOverlay
})();
