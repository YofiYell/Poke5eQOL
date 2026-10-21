// ==UserScript==
// @name         Species Card [v0.2.22 Combined Artwork Area]
// @namespace    yofi.poke5e.species.card
// @version      0.2.22
// @description  Compact 9.5-10.5% combined subject-area bounds with 18.5% bbox cap; preserves selector and image containment.
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
  const registration = modules.register('Species Card','0.2.22');
  modules.requireQol(registration,runSpeciesCard);
  function runSpeciesCard() {
  // Standalone companion. Disable earlier Hero Layout Lab builds, not the QOL script.
  // Older editions used a shared boolean lock. Silently returning was the
  // reason a stale adapter could suppress an updated one with no indication.
  // Do not run two DOM-manipulating adapters concurrently: they compete for
  // the same nodes and both install recurring timers.
  if (window.__yofiHeroLayoutLab) {
    const active = window.__yofiHeroLayoutLab;
    console.error('[Species Card v0.2.22] Conflicting adapter is already active:',
      active, 'Disable ALL earlier Hero Layout Lab / Adapter userscripts and reload.');
    modules.notice('yofi-userscript-version-conflict','Species Card conflict: disable extra Hero Layout Adapters / Species Card userscripts and reload.');
    return false;
  }
  window.__yofiHeroLayoutLab = '0.2.22';
  window.__yofiSpeciesCard = '0.2.22';

  const VERSION = '0.2.22';
  const STYLE_ID = 'yofi-species-card-hero-css';
  const PREPARE_EVENT = 'yofi:species-card-prepare-before-reveal';
  const PRE_REVEAL_EVENT = 'yofi:species-card-before-reveal';
  const LIVE_CARD_SELECTOR = '.page > main article';
  const processedSpeciesIdentities = new WeakMap();
  const portraitSources = new WeakMap();
  const portraitLayoutRatios = new WeakMap();
  const portraitLoadHandlers = new WeakMap();
  const MAX_ENCOUNTER_LEVEL = 20; // Current level-range display assumption.
  // Precomputed subject rectangles: archived normal portraits. Form/source identity
  // is checked before any art-size changes. Contour collision is not used.
  // BBox records are from the archived Poke5e normal PNG catalog
  // (475x475 source canvases, alpha>=1 extents). Contours are intentionally
  // not used here; this is an occupied-rectangle-only visual A/B test.
  const BBOX_TEST_SOURCE = 'Poke5e archive / upstream 881f3cae / alpha>=1';
  const BBOX_TEST_TABLE = Object.freeze({"abomasnow":[22,22,453,453],"abra":[22,86,453,389],"absol":[93,22,381,453],"accelgor":[22,42,453,432],"aegislash":[58,22,416,453],"aerodactyl":[22,103,453,371],"aggron":[22,22,452,453],"aipom":[22,54,453,421],"alakazam":[22,46,453,429],"alcremie":[91,41,382,424],"alolan-diglett":[82,58,389,415],"alolan-dugtrio":[31,53,453,423],"alolan-exeggutor":[135,21,360,454],"alolan-geodude":[18,101,440,366],"alolan-golem":[64,41,390,437],"alolan-graveler":[20,102,460,422],"alolan-grimer":[26,60,446,418],"alolan-marowak":[105,19,380,435],"alolan-meowth":[98,47,345,426],"alolan-muk":[10,116,461,351],"alolan-ninetales":[21,79,455,411],"alolan-persian":[48,79,428,418],"alolan-raichu":[62,45,405,427],"alolan-raticate":[48,99,428,397],"alolan-rattata":[47,88,425,368],"alolan-sandshrew":[33,75,414,418],"alolan-sandslash":[54,34,418,438],"alolan-vulpix":[74,38,437,418],"alomomola":[122,22,353,453],"altaria":[43,22,432,453],"amaura":[77,22,398,453],"ambipom":[22,62,453,413],"amoonguss":[22,44,453,431],"ampharos":[79,22,396,453],"annihilape":[43,23,411,427],"anorith":[27,22,448,453],"appletun":[36,71,432,414],"applin":[132,95,358,369],"araquanid":[34,60,441,418],"arbok":[44,22,430,453],"arboliva":[13,68,466,426],"arcanine":[22,34,453,440],"arcanine-hisui":[9,62,466,424],"arceus":[76,22,398,453],"archaludon":[52,13,422,462],"archen":[22,93,453,381],"archeops":[81,22,394,453],"arctibax":[40,83,461,437],"arctovish":[100,80,403,399],"arctozolt":[59,54,378,440],"ariados":[22,42,453,432],"armaldo":[22,47,453,427],"armarouge":[100,13,374,462],"aromatisse":[84,22,390,453],"aron":[22,32,453,443],"arrokuda":[26,111,443,322],"articuno":[46,22,428,453],"articuno-galar":[39,32,434,465],"audino":[59,22,415,453],"aurorus":[41,22,433,453],"avalugg":[50,22,432,438],"avalugg-hisui":[51,69,427,399],"axew":[76,22,398,453],"azelf":[86,22,388,453],"azumarill":[29,22,446,453],"azurill":[51,22,424,453],"bagon":[97,22,378,453],"baltoy":[22,22,453,453],"banette":[22,34,453,440],"barbaracle":[22,41,453,425],"barboach":[22,123,453,352],"barraskewda":[17,142,462,326],"basculegion-f":[20,120,463,384],"basculegion-m":[21,103,469,355],"basculin":[22,51,453,424],"basculin-blue-striped":[22,58,453,416],"basculin-white-striped":[60,79,416,396],"bastiodon":[22,45,453,429],"baxcalibur":[96,23,390,456],"bayleef":[110,22,364,453],"beartic":[22,38,453,437],"beautifly":[22,30,453,445],"beedrill":[59,22,416,453],"beheeyem":[96,22,379,453],"beldum":[22,124,453,350],"bellibolt":[56,80,364,391],"bellossom":[42,22,432,453],"bellsprout":[52,22,422,453],"bergmite":[43,22,432,453],"bewear":[63,46,428,428],"bibarel":[22,51,453,424],"bidoof":[22,47,453,428],"binacle":[42,22,432,453],"bisharp":[121,22,354,453],"blacephalon":[43,0,432,475],"black-kyurem":[22,58,453,417],"blastoise":[38,22,436,453],"blaziken":[75,22,400,453],"blipbug":[133,67,328,390],"blissey":[32,22,442,453],"blitzle":[109,22,365,453],"boldore":[22,53,453,421],"boltund":[24,75,461,404],"bombirdier":[49,49,457,442],"bonsly":[100,22,375,453],"bouffalant":[22,56,453,419],"bounsweet":[46,47,430,413],"braixen":[95,22,379,453],"brambleghast":[15,33,453,432],"bramblin":[33,49,458,434],"braviary":[22,41,453,433],"braviary-hisui":[18,35,444,426],"breloom":[60,22,415,453],"brionne":[35,84,439,387],"bronzong":[22,119,453,356],"bronzor":[65,22,410,453],"brute-bonnet":[50,99,424,425],"bruxish":[34,87,439,344],"budew":[106,22,369,453],"buizel":[22,108,453,367],"bulbasaur":[22,36,453,438],"buneary":[128,22,346,453],"bunnelby":[98,22,376,453],"burmy":[119,22,355,453],"butterfree":[22,41,453,434],"buzzwole":[67,46,412,435],"cacnea":[22,91,453,384],"cacturne":[31,22,444,453],"calyrex":[68,4,402,475],"calyrex-ice":[88,30,399,445],"calyrex-shadow":[56,30,447,470],"camerupt":[22,63,453,412],"capsakid":[92,25,382,450],"carbink":[22,31,453,443],"carkol":[88,70,392,425],"carnivine":[22,61,453,414],"carracosta":[22,61,453,414],"carvanha":[71,22,404,453],"cascoon":[22,64,453,411],"castform":[104,22,371,453],"caterpie":[22,22,453,453],"celebi":[22,50,453,425],"celesteela":[18,45,462,433],"centiskorch":[23,50,445,387],"ceruledge":[33,8,438,463],"cetitan":[17,112,458,364],"cetoddle":[32,82,463,389],"chandelure":[47,22,428,453],"chansey":[22,48,453,427],"charcadet":[109,13,343,466],"charizard":[22,68,453,406],"charjabug":[47,99,426,379],"charmander":[46,22,428,453],"charmeleon":[53,22,421,453],"chatot":[41,22,434,453],"cherrim":[62,22,412,453],"cherubi":[46,22,429,453],"chesnaught":[22,58,453,417],"chespin":[87,22,387,453],"chewtle":[111,51,331,402],"chi-yu":[36,71,452,388],"chien-pao":[14,68,469,406],"chikorita":[72,22,402,453],"chimchar":[109,22,366,453],"chimecho":[136,22,339,453],"chinchou":[22,68,453,406],"chingling":[22,49,453,426],"cinccino":[22,27,453,448],"cinderace":[124,15,364,463],"clamperl":[43,22,431,453],"clauncher":[22,93,453,382],"clawitzer":[22,125,453,349],"claydol":[34,22,440,453],"clefable":[22,24,453,450],"clefairy":[22,22,452,453],"cleffa":[22,38,453,437],"clobbopus":[50,96,429,354],"clodsire":[19,146,463,368],"cloyster":[22,31,453,444],"coalossal":[72,33,417,451],"cobalion":[98,22,376,453],"cofagrigus":[22,65,453,410],"combee":[22,116,453,358],"combusken":[22,29,453,445],"comfey":[73,45,401,427],"conkeldurr":[22,59,453,415],"copperajah":[60,61,414,399],"corphish":[22,27,453,447],"corsola":[22,34,453,440],"corviknight":[44,44,366,447],"corvisquire":[84,49,425,433],"cosmoem":[55,68,420,391],"cosmog":[47,60,428,417],"cottonee":[22,109,453,365],"crabominable":[18,95,457,362],"crabrawler":[48,69,428,408],"cradily":[61,22,413,453],"cramorant":[74,42,390,445],"cranidos":[59,22,416,453],"crawdaunt":[22,40,453,435],"cresselia":[36,22,438,453],"croagunk":[61,22,414,453],"crobat":[22,110,453,365],"crocalor":[75,78,405,423],"croconaw":[40,22,434,453],"crustle":[22,64,453,410],"cryogonal":[25,22,450,453],"cubchoo":[72,22,403,453],"cubone":[56,22,419,453],"cufant":[62,76,420,405],"cursola":[38,63,421,445],"cutiefly":[50,39,425,419],"cyclizar":[41,45,424,459],"cyndaquil":[22,73,453,402],"dachsbun":[9,49,461,421],"darkrai":[31,22,443,453],"darmanitan":[43,22,432,453],"dartrix":[47,70,428,408],"darumaka":[22,33,453,442],"dawn-wings-necrozma":[0,60,475,416],"decidueye":[47,67,427,406],"decidueye-hisui":[53,19,445,454],"dedenne":[22,49,453,425],"deerling":[103,22,372,453],"deino":[77,22,397,453],"delcatty":[71,22,403,453],"delibird":[74,22,400,453],"delphox":[22,64,453,410],"deoxys":[22,56,453,418],"dewgong":[22,23,453,452],"dewott":[96,22,378,453],"dewpider":[109,55,370,425],"dhelmise":[117,24,407,436],"dialga":[41,22,434,453],"dialga-origin":[65,16,406,458],"diancie":[53,13,422,463],"diggersby":[22,61,453,413],"diglett":[22,38,453,437],"dipplin":[114,8,360,467],"ditto":[22,55,453,420],"dodrio":[61,22,414,453],"doduo":[107,22,368,453],"dolliv":[93,32,368,449],"dondozo":[22,99,453,376],"donphan":[22,115,453,360],"dottler":[63,109,423,391],"doublade":[22,75,453,399],"dracovish":[61,70,363,428],"dracozolt":[41,91,462,391],"dragalge":[22,50,453,424],"dragapult":[30,44,450,443],"dragonair":[39,22,436,453],"dragonite":[70,22,405,453],"drakloak":[27,58,446,418],"drampa":[25,96,449,361],"drapion":[22,116,453,358],"dratini":[22,28,453,447],"drednaw":[31,111,461,369],"dreepy":[39,122,443,371],"drifblim":[22,22,452,453],"drifloon":[105,22,369,453],"drilbur":[22,22,453,453],"drizzile":[15,8,455,462],"drowzee":[76,22,399,453],"druddigon":[22,53,453,421],"dubwool":[78,53,403,434],"ducklett":[71,22,403,453],"dudunsparce":[60,132,408,395],"dugtrio":[22,29,453,445],"dunsparce":[48,22,426,453],"duosion":[40,22,435,453],"duraludon":[71,47,387,429],"durant":[22,115,453,359],"dusclops":[22,50,453,424],"dusk-mane-necrozma":[0,18,475,457],"dusknoir":[22,77,453,397],"duskull":[53,22,421,453],"dustox":[22,101,453,374],"dwebble":[22,41,453,434],"eelektrik":[71,22,404,453],"eelektross":[22,122,453,352],"eevee":[62,22,413,453],"eiscue":[103,47,356,432],"ekans":[22,24,453,451],"eldegoss":[66,52,395,442],"electabuzz":[22,26,453,448],"electivire":[22,71,453,403],"electrike":[22,93,453,382],"electrode":[23,22,452,453],"electrode-hisui":[0,0,475,474],"elekid":[22,92,453,383],"elgyem":[97,22,377,453],"emboar":[22,22,453,453],"emolga":[22,90,453,385],"empoleon":[64,22,411,453],"enamorus":[98,34,337,436],"enamorus-therian":[26,107,428,411],"entei":[39,22,436,453],"escavalier":[60,22,414,453],"espathra":[50,21,430,462],"espeon":[22,31,453,444],"espurr":[70,22,404,453],"eternatus":[12,78,463,433],"eternatus-eternamax":[10,76,466,400],"excadrill":[22,65,453,409],"exeggcute":[22,68,453,406],"exeggutor":[22,26,453,448],"exploud":[22,24,453,451],"falinks":[20,68,439,434],"farfetchd":[57,22,418,453],"farigiraf":[148,18,347,441],"fearow":[22,37,453,437],"feebas":[79,22,396,453],"fennekin":[91,22,383,453],"feraligatr":[48,22,426,453],"ferroseed":[51,22,423,453],"ferrothorn":[22,80,453,395],"fezandipiti":[0,0,474,475],"fidough":[52,109,414,402],"finizen":[60,106,436,334],"finneon":[22,46,453,428],"flaaffy":[66,22,408,453],"flabebe":[31,22,444,453],"flamigo":[146,18,328,457],"flapple":[68,74,432,399],"flareon":[22,45,453,429],"fletchinder":[22,35,453,440],"fletchling":[22,54,453,420],"flittle":[59,44,416,445],"floatzel":[68,22,406,453],"floette":[59,22,415,453],"floette-eternal":[45,9,410,462],"floragato":[107,40,379,446],"florges":[60,24,414,436],"flutter-mane":[26,61,449,414],"flygon":[22,75,453,400],"fomantis":[104,47,365,427],"foongus":[37,22,438,453],"forretress":[22,68,453,407],"fraxure":[22,30,453,444],"frigibax":[37,95,381,434],"frillish":[22,27,453,448],"froakie":[32,22,443,453],"frogadier":[22,68,453,407],"froslass":[131,22,344,453],"frosmoth":[20,84,464,388],"fuecoco":[53,16,419,459],"furfrou":[83,22,391,453],"furret":[58,22,417,453],"gabite":[23,22,452,453],"galarian-corsola":[71,94,375,388],"galarian-darmanitan":[92,36,399,435],"galarian-darumaka":[93,89,395,398],"galarian-farfetchd":[33,117,428,358],"galarian-linoone":[33,64,447,351],"galarian-meowth":[47,82,413,406],"galarian-mr-mime":[33,45,427,465],"galarian-ponyta":[92,87,402,373],"galarian-rapidash":[73,43,421,421],"galarian-slowbro":[44,76,449,431],"galarian-slowking":[69,0,406,475],"galarian-slowpoke":[42,221,444,378],"galarian-stunfisk":[40,127,423,367],"galarian-weezing":[64,30,431,434],"galarian-yamask":[39,74,429,402],"galarian-zigzagoon":[35,76,427,373],"gallade":[61,22,414,453],"galvantula":[22,72,453,403],"garbodor":[22,49,453,425],"garchomp":[31,22,444,453],"gardevoir":[22,24,453,450],"garganacl":[42,26,372,434],"gastly":[22,23,453,452],"gastrodon":[63,22,411,453],"genesect":[58,22,416,453],"gengar":[26,22,448,453],"geodude":[22,156,453,319],"gholdengo":[84,25,323,446],"gible":[22,26,453,449],"gigalith":[36,22,439,453],"gimmighoul":[115,37,378,458],"gimmighoul-roaming":[11,19,466,455],"girafarig":[102,22,373,453],"giratina-altered-forme":[0,46,475,429],"giratina-origin-forme":[0,18,475,457],"glaceon":[22,59,453,416],"glalie":[22,40,453,434],"glameow":[36,22,438,453],"glastrier":[90,10,406,469],"gligar":[22,22,452,453],"glimmet":[143,37,321,431],"glimmora":[25,89,470,398],"gliscor":[42,22,432,453],"gloom":[22,61,453,413],"gogoat":[49,22,425,453],"golbat":[22,52,453,422],"goldeen":[22,117,453,358],"golduck":[22,25,453,450],"golem":[22,35,453,440],"golett":[28,22,447,453],"golisopod":[31,30,428,428],"golurk":[37,22,438,453],"goodra":[41,42,434,453],"goodra-hisui":[28,69,431,428],"goomy":[22,22,453,453],"gorebyss":[22,75,453,399],"gossifleur":[64,61,433,411],"gothita":[89,22,385,453],"gothitelle":[88,22,386,453],"gothorita":[92,22,383,453],"gouging-fire":[13,30,462,445],"gourgeist":[51,22,424,446],"grafaiai":[36,82,433,433],"granbull":[70,22,404,453],"grapploct":[52,49,404,426],"graveler":[22,130,453,344],"great-tusk":[16,107,460,368],"greavard":[72,24,401,447],"greedent":[46,55,364,406],"greninja":[22,110,453,365],"grimer":[22,89,453,386],"grimmsnarl":[16,49,460,445],"grookey":[82,32,392,443],"grotle":[22,22,452,453],"groudon":[22,90,453,385],"groudon-primal":[5,92,469,383],"grovyle":[22,51,453,424],"growlithe":[86,22,388,453],"growlithe-hisui":[42,39,432,424],"grubbin":[47,142,425,336],"grumpig":[22,27,453,447],"gulpin":[22,58,453,417],"gumshoos":[47,70,424,407],"gurdurr":[22,35,453,439],"guzzlord":[25,81,455,394],"gyarados":[60,22,414,453],"hakamo-o":[94,35,419,439],"happiny":[96,22,379,453],"hariyama":[22,28,453,447],"hatenna":[70,86,389,380],"hatterene":[92,7,354,453],"hattrem":[21,61,464,409],"haunter":[22,50,453,425],"hawlucha":[22,80,451,395],"haxorus":[67,22,407,453],"heatmor":[22,74,453,400],"heatran":[22,107,453,367],"heliolisk":[22,72,453,403],"helioptile":[22,77,453,398],"heracross":[24,22,450,453],"herdier":[35,22,439,453],"hippopotas":[22,79,453,395],"hippowdon":[22,85,453,390],"hitmonchan":[75,22,400,453],"hitmonlee":[22,51,453,424],"hitmontop":[22,28,453,447],"ho-oh":[42,22,433,453],"honchkrow":[22,90,453,385],"honedge":[100,22,374,453],"hoopa-confined":[31,20,461,462],"hoopa-unbound":[8,46,463,431],"hoothoot":[25,22,450,453],"hoppip":[22,62,453,412],"horsea":[41,22,434,453],"houndoom":[32,22,443,453],"houndour":[61,22,414,453],"houndstone":[29,72,456,408],"huntail":[22,62,453,413],"hydrapple":[118,12,357,463],"hydreigon":[22,25,453,450],"hypno":[35,22,439,453],"igglybuff":[71,22,404,453],"illumise":[69,22,405,453],"impidimp":[52,91,423,419],"incineroar":[136,34,360,440],"indeedee-f":[99,73,369,436],"indeedee-m":[121,40,354,430],"infernape":[22,55,453,419],"inkay":[34,22,440,453],"inteleon":[136,14,348,460],"iron-boulder":[12,32,462,443],"iron-bundle":[26,104,383,441],"iron-crown":[133,12,342,462],"iron-hands":[5,81,470,393],"iron-jugulis":[25,64,456,448],"iron-leaves":[124,17,374,458],"iron-moth":[16,72,468,472],"iron-thorns":[81,50,409,451],"iron-treads":[11,100,460,415],"iron-valiant":[32,13,451,466],"ivysaur":[22,36,453,438],"jangmo-o":[46,48,426,424],"jellicent":[22,41,453,434],"jigglypuff":[22,33,453,441],"jirachi":[22,75,453,400],"jolteon":[47,22,428,453],"joltik":[22,70,453,404],"jumpluff":[101,22,374,453],"jynx":[22,62,453,412],"kabuto":[22,79,453,396],"kabutops":[46,22,428,453],"kadabra":[53,22,421,453],"kakuna":[121,22,354,453],"kangaskhan":[26,22,448,453],"karrablast":[98,22,376,453],"kartana":[29,35,445,439],"kecleon":[41,22,434,453],"keldeo":[22,31,453,443],"kilowattrel":[8,32,459,377],"kingambit":[102,11,410,451],"kingdra":[43,22,432,453],"kingler":[22,104,453,371],"kirlia":[108,22,366,453],"klang":[22,58,453,417],"klawf":[42,88,447,408],"kleavor":[42,34,456,443],"klefki":[22,83,439,386],"klink":[22,55,453,419],"klinklang":[22,108,453,366],"koffing":[22,57,453,418],"komala":[48,67,428,407],"kommo-o":[28,68,447,408],"koraidon":[47,38,420,434],"krabby":[22,106,453,369],"kricketot":[110,22,365,453],"kricketune":[93,22,381,453],"krokorok":[39,22,435,453],"krookodile":[30,22,444,453],"kubfu":[114,25,375,433],"kyogre":[22,139,453,336],"kyogre-primal":[5,59,469,417],"kyurem":[22,41,453,433],"lairon":[22,58,453,417],"lampent":[67,22,407,453],"landorus":[58,22,416,453],"landorus-therian":[61,22,414,453],"lanturn":[22,110,453,364],"lapras":[22,30,453,445],"larvesta":[24,22,451,453],"larvitar":[112,22,362,453],"latias":[22,55,453,419],"latios":[22,93,453,382],"leafeon":[53,22,422,453],"leavanny":[130,22,345,453],"lechonk":[53,112,387,391],"ledian":[95,22,380,453],"ledyba":[51,22,424,453],"lickilicky":[34,22,441,453],"lickitung":[22,38,453,437],"liepard":[22,51,453,424],"lileep":[41,22,433,453],"lilligant":[77,22,398,453],"lilligant-hisui":[97,55,380,458],"lillipup":[73,22,401,453],"linoone":[22,148,453,327],"litleo":[22,28,453,446],"litten":[98,47,377,428],"litwick":[103,22,371,453],"lokix":[126,9,399,457],"lombre":[51,22,424,453],"lopunny":[55,22,419,453],"lotad":[22,54,453,420],"loudred":[33,22,441,453],"lucario":[97,22,377,453],"ludicolo":[59,22,415,453],"lugia":[22,70,453,405],"lumineon":[49,22,426,453],"lunala":[45,28,422,443],"lunatone":[38,22,437,453],"lurantis":[124,33,371,437],"luvdisc":[124,22,351,453],"luxio":[22,43,453,432],"luxray":[22,38,453,437],"lycanroc-dusk-form":[14,100,466,374],"lycanroc-midday-form":[47,94,426,383],"lycanroc-midnight-form":[91,47,384,427],"mabosstiff":[67,79,443,422],"machamp":[48,22,427,453],"machoke":[57,22,418,453],"machop":[58,22,416,453],"magby":[83,22,391,453],"magcargo":[54,22,420,453],"magearna":[95,46,380,428],"magikarp":[44,22,430,453],"magmar":[22,27,453,447],"magmortar":[35,22,440,453],"magnemite":[22,120,453,355],"magneton":[22,41,453,434],"magnezone":[22,86,453,389],"makuhita":[62,22,413,453],"malamar":[54,22,420,453],"mamoswine":[22,71,453,403],"manaphy":[22,110,453,365],"mandibuzz":[102,22,373,453],"manectric":[82,22,392,453],"mankey":[22,85,453,390],"mantine":[22,120,453,354],"mantyke":[22,81,453,394],"maractus":[73,22,401,453],"mareanie":[57,44,433,398],"mareep":[59,22,415,453],"marill":[22,69,453,406],"marowak":[59,22,416,453],"marshadow":[84,0,390,475],"marshtomp":[50,22,424,453],"maschiff":[81,144,426,354],"masquerain":[22,73,453,401],"maushold":[25,140,443,378],"mawile":[22,70,453,405],"medicham":[119,22,356,453],"meditite":[30,22,445,453],"meganium":[117,22,357,453],"melmetal":[18,110,459,379],"meloetta---aria":[98,22,376,453],"meloetta---pirouette":[108,22,366,453],"meltan":[101,63,351,414],"meowscarada":[65,10,425,465],"meowstic-f":[58,22,417,453],"meowstic-m":[42,22,433,453],"meowth":[73,22,401,453],"mesprit":[84,22,391,453],"metagross":[22,97,453,377],"metang":[22,70,453,405],"metapod":[48,22,427,453],"mew":[25,22,450,453],"mewtwo":[61,22,414,453],"mienfoo":[34,22,441,453],"mienshao":[22,31,453,444],"mightyena":[26,22,449,453],"milcery":[49,112,410,355],"milotic":[30,22,445,453],"miltank":[54,22,421,453],"mime-jr":[89,22,386,453],"mimikyu":[96,47,399,428],"minccino":[22,51,453,424],"minior-core-form":[73,65,400,414],"minior-meteor-form":[73,65,400,414],"minun":[71,22,403,453],"miraidon":[90,21,365,453],"misdreavus":[22,40,453,435],"mismagius":[95,22,380,453],"moltres":[22,136,453,339],"moltres-galar":[20,38,460,434],"monferno":[22,55,453,419],"morelull":[146,48,311,425],"morgrem":[68,56,391,412],"morpeko":[116,82,350,399],"mothim":[22,120,453,354],"mr-mime":[22,32,453,443],"mr-rime":[44,35,437,424],"mudbray":[89,47,386,426],"mudkip":[32,22,443,453],"mudsdale":[48,53,428,426],"muk":[22,128,453,346],"munchlax":[79,22,395,453],"munkidori":[114,7,360,467],"munna":[22,24,453,451],"murkrow":[43,22,431,453],"musharna":[31,22,444,453],"nacli":[74,102,380,411],"naclstack":[40,95,444,413],"naganadel":[0,114,475,361],"natu":[22,22,452,453],"necrozma":[14,64,444,395],"nickit":[20,27,450,441],"nidoking":[22,71,453,403],"nidoqueen":[28,22,446,453],"nidoran-f":[22,31,453,444],"nidoran-m":[42,22,432,453],"nidorina":[47,22,428,453],"nidorino":[43,22,431,453],"nihilego":[112,37,354,437],"nincada":[22,129,453,346],"ninetales":[22,30,453,445],"ninjask":[22,82,453,392],"noctowl":[113,22,361,453],"noibat":[22,47,453,427],"noivern":[22,80,453,395],"nosepass":[22,39,453,436],"numel":[24,22,450,453],"nuzleaf":[34,22,440,453],"nymble":[99,92,381,426],"obstagoon":[93,40,389,459],"octillery":[22,53,453,421],"oddish":[42,22,432,453],"ogerpon":[29,12,446,463],"ogerpon-cornerstone-mask":[36,12,438,463],"ogerpon-heartflame-mask":[26,12,449,462],"ogerpon-wellspring-mask":[33,12,441,462],"oinkologne-female":[41,34,388,430],"oinkologne-male":[31,35,425,424],"okidogi":[0,30,475,444],"omanyte":[48,22,426,453],"omastar":[22,48,453,427],"onix":[32,22,443,453],"oranguru":[20,85,450,408],"orbeetle":[80,43,395,448],"oricorio-baile-style":[72,47,403,428],"oricorio-pau-style":[47,65,425,413],"oricorio-pom-pom-style":[37,128,438,388],"oricorio-sensu-style":[47,94,426,399],"orthworm":[14,48,462,427],"oshawott":[70,22,405,453],"overqwil":[64,31,420,450],"pachirisu":[62,22,412,453],"palafin":[60,106,436,334],"palkia":[22,36,453,439],"palkia-origin":[74,15,400,460],"palossand":[27,77,449,378],"palpitoad":[60,22,415,453],"pancham":[92,22,383,453],"pangoro":[22,57,453,417],"panpour":[45,22,429,453],"pansage":[56,22,418,453],"pansear":[56,22,418,453],"paras":[22,60,453,414],"parasect":[22,34,453,440],"passimian":[74,50,448,437],"patrat":[33,22,441,453],"pawmi":[8,56,454,448],"pawmo":[58,10,426,461],"pawmot":[30,14,429,468],"pawniard":[22,70,453,405],"pecharunt":[12,67,463,408],"pelipper":[27,22,447,453],"perrserker":[37,49,400,429],"persian":[22,44,453,430],"petilil":[113,22,361,453],"phanpy":[22,31,453,444],"phantump":[29,28,453,443],"pheromosa":[83,29,392,449],"phione":[22,83,453,391],"pichu":[49,22,426,453],"pidgeot":[31,22,444,453],"pidgeotto":[51,22,424,453],"pidgey":[36,22,438,453],"pidove":[23,22,452,453],"pignite":[44,22,431,453],"pikachu":[22,35,453,440],"pikipek":[47,61,425,399],"piloswine":[42,22,432,453],"pincurchin":[30,67,429,371],"pineco":[52,22,423,453],"pinsir":[30,22,444,453],"piplup":[93,22,381,453],"plusle":[90,22,385,453],"poipole":[122,0,353,475],"politoed":[90,22,385,453],"poliwag":[22,68,453,406],"poliwhirl":[22,49,453,426],"poliwrath":[22,91,453,384],"poltchageist":[27,73,447,402],"polteageist":[39,41,449,424],"ponyta":[70,22,405,453],"poochyena":[22,46,453,428],"popplio":[47,84,426,410],"porygon":[32,22,443,453],"porygon-z":[67,22,408,453],"porygon2":[22,27,453,448],"primarina":[37,54,437,428],"primeape":[30,22,444,453],"prinplup":[41,22,433,453],"probopass":[41,22,434,453],"psyduck":[71,22,404,453],"pumpkaboo":[36,22,438,453],"pupitar":[66,22,408,453],"purrloin":[75,22,399,453],"purugly":[41,22,434,453],"pyroar":[38,22,437,453],"pyukumuku":[47,86,428,361],"quagsire":[55,22,419,453],"quaquaval":[114,30,378,461],"quaxly":[105,40,359,439],"quaxwell":[110,23,365,459],"quilava":[107,22,368,453],"quilladin":[22,30,453,445],"qwilfish":[25,22,449,453],"qwilfish-hisui":[65,95,435,366],"raboot":[52,19,413,433],"rabsca":[90,7,413,467],"raging-bolt":[71,10,405,461],"raichu":[22,46,453,429],"raikou":[22,61,453,414],"rainy-castform":[103,3,442,475],"ralts":[106,22,368,453],"rampardos":[22,69,453,406],"rapidash":[51,22,423,453],"raticate":[22,26,453,449],"rattata":[22,47,453,427],"rayquaza":[22,42,453,433],"regice":[22,25,453,450],"regidrago":[59,50,446,416],"regieleki":[26,152,471,366],"regigigas":[22,92,453,383],"regirock":[22,25,453,450],"registeel":[22,79,453,396],"relicanth":[22,89,453,386],"rellor":[70,172,415,401],"remoraid":[61,22,414,453],"reshiram":[41,22,434,453],"reuniclus":[22,134,453,340],"revavroom":[30,71,436,423],"rhydon":[22,59,453,415],"rhyhorn":[39,22,436,453],"rhyperior":[22,92,453,382],"ribombee":[94,47,428,428],"rillaboom":[51,65,422,429],"riolu":[36,22,438,453],"roaring-moon":[24,16,430,464],"rockruff":[81,50,394,428],"roggenrola":[105,22,369,453],"rolycoly":[90,128,375,366],"rookidee":[41,104,412,389],"roselia":[22,40,453,434],"roserade":[85,22,389,453],"rotom":[22,30,453,445],"rotom-fan":[22,67,453,408],"rotom-frost":[22,80,453,394],"rotom-heat":[61,22,414,453],"rotom-mow":[61,22,413,453],"rotom-wash":[22,69,453,406],"rowlet":[78,47,397,424],"rufflet":[101,22,374,453],"runerigus":[8,91,465,384],"sableye":[22,32,453,442],"salamence":[22,63,453,412],"salandit":[68,48,401,425],"salazzle":[70,38,384,428],"samurott":[22,32,453,443],"samurott-hisui":[76,21,415,454],"sandaconda":[46,111,425,373],"sandile":[22,89,453,385],"sandshrew":[41,22,434,453],"sandslash":[22,31,453,444],"sandy-shocks":[47,48,367,448],"sandygast":[47,66,427,384],"sawk":[59,22,415,453],"sawsbuck":[56,0,419,475],"scatterbug":[112,22,362,453],"sceptile":[36,22,439,453],"scizor":[63,22,412,453],"scolipede":[22,34,453,440],"scorbunny":[132,21,343,454],"scovillain":[56,44,425,454],"scrafty":[94,22,381,453],"scraggy":[73,22,401,453],"scream-tail":[38,94,438,406],"scyther":[46,22,428,453],"seadra":[22,51,453,424],"seaking":[22,36,453,438],"sealeo":[22,75,453,400],"seedot":[76,22,399,453],"seel":[22,40,453,434],"seismitoad":[22,45,453,430],"sentret":[143,22,332,453],"serperior":[64,22,411,453],"servine":[43,22,432,453],"seviper":[22,31,453,443],"sewaddle":[68,22,407,453],"sharpedo":[61,22,414,453],"shaymin-land":[22,54,453,420],"shaymin-sky":[22,36,453,438],"shedinja":[22,34,453,440],"shelgon":[43,22,431,453],"shellder":[22,27,453,447],"shellos":[75,22,400,453],"shelmet":[22,36,453,438],"shieldon":[28,22,446,453],"shiftry":[22,38,453,437],"shiinotic":[35,57,439,428],"shinx":[22,41,453,434],"shroodle":[72,98,383,367],"shroomish":[22,70,453,405],"shuckle":[22,44,453,431],"shuppet":[55,22,420,453],"sigilyph":[67,22,408,453],"silcoon":[22,43,453,431],"silicobra":[75,97,380,389],"silvally":[83,46,413,427],"simipour":[37,22,438,453],"simisage":[58,22,417,453],"simisear":[25,22,450,453],"sinistcha":[81,13,394,462],"sinistea":[29,113,427,378],"sirfetchd":[127,15,355,456],"sizzlipede":[28,182,437,328],"skarmory":[22,85,453,389],"skeledirge":[22,128,454,348],"skiddo":[25,22,449,453],"skiploom":[22,70,453,405],"skitty":[22,56,453,419],"skorupi":[22,47,453,428],"skrelp":[70,22,405,453],"skuntank":[22,82,453,393],"skwovet":[92,33,359,418],"slaking":[22,86,453,389],"slakoth":[22,119,453,356],"sliggoo":[107,22,368,453],"sliggoo-hisui":[33,55,442,421],"slither-wing":[87,38,388,437],"slowbro":[42,22,433,453],"slowking":[108,22,366,453],"slowpoke":[22,64,453,411],"slugma":[55,22,419,453],"slurpuff":[44,22,431,453],"smeargle":[52,22,422,453],"smoliv":[118,66,385,431],"smoochum":[105,22,370,453],"sneasel":[23,22,452,453],"sneasel-hisui":[76,58,399,417],"sneasler":[53,31,357,456],"snivy":[49,22,425,453],"snom":[90,127,399,344],"snorlax":[22,65,453,409],"snorunt":[66,22,408,453],"snover":[22,80,453,395],"snowy-castform":[23,7,422,475],"snubbull":[61,22,414,453],"sobble":[99,29,375,445],"solgaleo":[56,43,418,429],"solosis":[22,27,453,447],"solrock":[22,24,453,450],"spearow":[27,22,447,453],"spectrier":[18,62,442,406],"spewpa":[22,48,453,427],"spheal":[22,62,453,412],"spidops":[44,92,455,421],"spinarak":[22,107,453,368],"spinda":[64,22,411,453],"spiritomb":[22,34,453,440],"spoink":[110,22,365,453],"sprigatito":[76,39,398,436],"spritzee":[49,22,426,453],"squawkabilly":[5,55,467,402],"squirtle":[29,22,446,453],"stakataka":[0,4,475,471],"stantler":[72,22,403,453],"staraptor":[60,22,415,453],"staravia":[92,22,382,453],"starly":[58,22,417,453],"starmie":[22,31,453,443],"staryu":[34,22,440,453],"steelix":[22,51,453,424],"steenee":[62,49,408,425],"stonjourner":[59,41,386,437],"stoutland":[22,81,453,393],"stufful":[50,47,426,426],"stunfisk":[22,110,453,365],"stunky":[22,51,453,424],"sudowoodo":[51,22,424,453],"suicune":[22,30,453,444],"sunflora":[41,22,434,453],"sunkern":[61,22,414,453],"sunny-castform":[51,14,439,466],"surskit":[22,63,453,412],"swablu":[22,108,453,366],"swadloon":[22,64,453,411],"swalot":[22,22,453,453],"swampert":[22,82,453,392],"swanna":[51,22,423,453],"swellow":[22,68,453,407],"swinub":[22,100,453,375],"swirlix":[86,22,389,453],"swoobat":[43,22,432,453],"sylveon":[79,22,395,453],"tadbulb":[151,73,339,393],"taillow":[22,71,453,404],"talonflame":[22,79,453,395],"tandemaus":[36,136,439,363],"tangela":[22,42,453,432],"tangrowth":[55,22,419,453],"tapu-bulu":[69,28,413,446],"tapu-fini":[89,35,398,435],"tapu-koko":[98,35,393,439],"tapu-lele":[100,30,362,439],"tarountula":[95,62,393,420],"tatsugiri":[113,92,386,389],"tauros":[22,39,453,435],"tauros-paldea-aqua-breed":[2,103,475,385],"tauros-paldea-blaze-breed":[81,43,467,429],"tauros-paldea-combat-breed":[31,82,475,411],"teddiursa":[94,22,381,453],"tentacool":[22,61,453,414],"tentacruel":[22,71,453,404],"tepig":[51,22,424,453],"terapagos":[32,67,422,435],"terapagos-stellar-form":[42,17,420,459],"terapagos-terastal-form":[13,87,462,388],"terrakion":[22,54,453,421],"thievul":[37,27,448,447],"throh":[22,53,453,422],"thundurus":[75,22,400,453],"thundurus-therian":[22,48,453,426],"thwackey":[135,27,343,395],"timburr":[22,63,453,412],"ting-lu":[32,24,449,428],"tinkatink":[29,76,471,410],"tinkaton":[18,43,472,436],"tinkatuff":[2,53,465,432],"tirtouga":[22,121,453,354],"toedscool":[97,83,371,369],"toedscruel":[63,42,389,445],"togedemaru":[67,46,420,429],"togekiss":[22,122,453,353],"togepi":[37,22,437,453],"togetic":[96,22,378,453],"torchic":[107,22,368,453],"torkoal":[22,28,453,446],"tornadus":[88,22,386,453],"tornadus-therian":[22,44,453,430],"torracat":[66,47,410,426],"torterra":[22,41,453,434],"totodile":[101,22,374,453],"toucannon":[62,67,418,418],"toxapex":[21,67,454,396],"toxel":[60,78,431,384],"toxicroak":[22,43,453,432],"toxtricity-amped":[133,64,339,411],"toxtricity-low-key":[142,46,333,428],"tranquill":[22,31,453,444],"trapinch":[58,22,416,453],"treecko":[32,22,443,453],"trevenant":[22,39,453,435],"tropius":[22,27,453,447],"trubbish":[22,38,453,437],"trumbeak":[40,103,428,399],"tsareena":[66,35,396,438],"turtonator":[59,63,440,428],"turtwig":[83,22,391,453],"tympole":[57,22,418,453],"tynamo":[22,81,453,394],"type-null":[80,47,393,427],"typhlosion":[92,22,383,453],"typhlosion-hisui":[57,20,385,450],"tyranitar":[39,22,435,453],"tyrantrum":[22,56,453,418],"tyrogue":[22,22,453,453],"tyrunt":[22,69,453,405],"ultra-necrozma":[4,70,471,415],"umbreon":[58,22,416,453],"unfezant":[76,22,399,453],"unown":[47,22,428,453],"ursaluna":[20,68,449,397],"ursaluna-bloodmoon":[40,12,434,462],"ursaring":[89,22,385,453],"urshifu-rapid":[113,35,379,438],"urshifu-single":[97,15,377,441],"uxie":[48,22,426,453],"vanillish":[87,22,388,453],"vanillite":[80,22,394,453],"vanilluxe":[34,22,441,453],"vaporeon":[41,22,434,453],"varoom":[79,120,418,380],"veluza":[22,87,444,407],"venipede":[22,68,453,407],"venomoth":[22,97,453,378],"venonat":[53,22,421,453],"venusaur":[22,70,453,405],"vespiquen":[54,22,421,453],"vibrava":[22,83,453,392],"victini":[64,22,411,453],"victreebel":[22,54,453,420],"vigoroth":[97,22,377,453],"vikavolt":[48,57,428,421],"vileplume":[22,41,453,433],"virizion":[84,22,391,453],"vivillon":[36,22,438,453],"volbeat":[88,22,386,453],"volcanion":[48,0,426,475],"volcarona":[22,51,453,424],"voltorb":[22,27,453,448],"voltorb-hisui":[0,9,475,465],"vullaby":[36,22,438,453],"vulpix":[22,46,453,428],"wailmer":[22,103,453,371],"wailord":[22,118,453,357],"walking-wake":[14,80,460,412],"walrein":[22,40,453,434],"wartortle":[25,22,450,453],"watchog":[141,22,334,453],"wattrel":[101,71,436,429],"weavile":[28,22,446,453],"weedle":[68,22,407,453],"weepinbell":[22,71,453,404],"weezing":[22,54,453,420],"whimsicott":[22,43,453,432],"whirlipede":[22,73,453,402],"whiscash":[22,73,453,402],"whismur":[22,28,453,446],"white-kyurem":[22,68,453,406],"wigglytuff":[60,22,415,453],"wiglett":[138,112,325,402],"wimpod":[16,95,419,365],"wingull":[22,86,453,388],"wishiwashi-school-form":[33,109,442,370],"wishiwashi-solo-form":[45,150,427,352],"wo-chien":[50,48,436,420],"wobbuffet":[97,22,377,453],"woobat":[22,103,453,372],"wooloo":[72,86,432,409],"wooper":[22,47,453,427],"wooper-paldea":[67,97,397,390],"wormadam-plant-cloak":[62,22,412,453],"wormadam-sand-cloak":[67,22,407,453],"wormadam-trash-cloak":[77,22,398,453],"wugtrio":[69,70,389,418],"wurmple":[61,22,413,453],"wynaut":[22,62,453,413],"wyrdeer":[105,11,405,466],"xatu":[88,22,387,453],"xerneas":[75,22,399,453],"xurkitree":[59,21,417,458],"yamask":[22,66,453,409],"yamper":[80,45,386,419],"yanma":[22,119,453,356],"yanmega":[22,73,453,401],"yungoos":[43,133,436,338],"yveltal":[22,41,453,434],"zacian":[10,70,462,410],"zacian-crowned":[11,15,462,450],"zamazenta":[36,24,447,467],"zamazenta-crowned":[44,12,431,459],"zangoose":[45,22,429,453],"zapdos":[22,88,453,386],"zapdos-galar":[35,61,418,428],"zarude":[61,17,413,440],"zebstrika":[59,22,415,453],"zekrom":[74,22,401,453],"zeraora":[15,48,464,439],"zigzagoon":[22,100,453,374],"zoroark":[22,34,453,441],"zoroark-hisui":[56,39,377,445],"zorua":[69,22,405,453],"zorua-hisui":[99,45,391,436],"zubat":[22,33,453,441],"zweilous":[22,22,453,453],"zygarde-10-forme":[47,79,428,397],"zygarde-50-forme":[23,23,447,453],"zygarde-complete-forme":[19,48,457,428]});
  const bboxTestEnabled = true;

  // Source-pinned conservative alpha silhouette profiles, 32 vertical bands.
  // The pixel paths come from the user's geometry manifest revision 881f3cae.
  // Each byte is the minimum occupied X in its band relative to the verified
  // subject bounding rectangle, quantized to 0..255. Data is inert unless
  // subjectBBoxFor() confirms the *same* archived normal portrait identity.
  const CONTOUR_PROFILE_SOURCE = 'poke5e_geometry/exterior-alpha-v1 / 881f3cae';
  const CONTOUR_LEFT_PROFILES = Object.freeze({"abomasnow":"MCUcFA0IBAIAAAAAAgYRKiUlKjIvLSwsLTExKCIiLEY=","abra":"WFVVVVZYWVxdXV1dYGhlY2McGhoeBQEAABcbHiIjHBw=","absol":"n48AAw0VGx4gHh4xOjApJycTEg8ODQwLDISHh4ein58=","accelgor":"nZeVlJSUCQkREhsgAAUVHipDaJWZnqSttbW1q6uwsLs=","aegislash":"fHh1cm9ta0xMTEQ5LiYjIykAAAEECQ4UGiErU1dYZWc=","aerodactyl":"qRsSEREPCQUCAAAoLDEzMjIzOFdYWFhYVlZXW15eZYw=","aggron":"RDAQFBIEBB4YEw8PMD4lHxsbGxsfHBMKBAAAR0E8OkA=","aipom":"qaZ1b2tpMjAIBAICBAkbGwcBAAABBV9hZGhxhoaGiY0=","alakazam":"WltdYCAgHhUVEhgRCwAAAQoPPTs5NzERDAwcJSotNDk=","alcremie":"NC4uR0M6Mx4XFRUPDAsMEAsFBAMAAAEFEzw6OjATERE=","alolan-diglett":"VVNabHVbS0E5NDAvLSwsKyoqKioqKyERDAQCAAACH04=","alolan-dugtrio":"bmZhXFlIKicZFhUVCwsLDAMDCx0eHyAhEwwGAgABAjg=","alolan-exeggutor":"JywLCyEXCAAAGRlmZmZmZ2ZmZmZmZWRgV1JPT01MR0M=","alolan-geodude":"vrWysrKyHhsVDQUBAAAAAQEDBQgKDxIUFhgZHB8iJy0=","alolan-golem":"RDgsKSgnJiYlJSYjIB0cFgwEAAAgIyctKSgoKiIeHsU=","alolan-graveler":"eE9IRkRAPDIxMDAxMDAwHhcTEQcHAAAECQoKCgoKCw4=","alolan-grimer":"mppkU0tEQD08PBgAAAAFBQUeIENGSUlJS0xFQD8/Qm8=","alolan-marowak":"MjMrGgoEAwMHCQkOTxAODg8PCQkJBwUCAAAEOTk1NbY=","alolan-meowth":"W100Ly0sLCwTExUbEhIcQRcRERMHAAAABxZ9eXRxcXE=","alolan-muk":"CwcDAQAAAAACCR8fHx8gLS0tLSwsLC4+Ozc2NjY5R1A=","alolan-ninetales":"Y2MxJxwbHDYcFhUVFQwMDigUBgUFAwAABAQZHCtERX4=","alolan-persian":"cmkaExEREhUZBQUAAAICBAsdJDA3ODo8P0BBQj48PD4=","alolan-raichu":"UlFRU1VZW15nb25ucFdQUFNea2oyEwoDAAAAAwgTJG0=","alolan-raticate":"IyMjHgAAAQcLCxAQDw8RExkbGRkaIC4xNDkyLCsrMj0=","alolan-rattata":"zsQ9NzQqKistLS0tLy0pHBoNBwUFHBQAAAMDRVFOTlA=","alolan-sandshrew":"o5iDdGhfWFRQTEpIRkUAAAEDBQkNEhkhLDpPVVZWWF8=","alolan-sandslash":"kpFdXFxdXiorLTAyNg0NEhgUFBcgIiAAAQ0iKVVWXmw=","alolan-vulpix":"LigRERESDw8QAwAAAAQJER0rMC4uLi4uLzEzNTg4Nzc=","alomomola":"h3dqQh0RDQkEAgAAAAAECA4UGBYVFRUWFxodI0JIUVw=","altaria":"eWZbV1dWTEdGRSshGhYNBgMDAwQDAAAABgMEByJ1fX8=","amaura":"X1xZVwAAAgYNFh8oKSw1bmlkX1tXVVRUVU8+MDA3i4k=","ambipom":"wbsWFRUVGBwCAAAFHCIvMT1ERUZHSUxPU1ljbWVcXFw=","amoonguss":"ZVZLQjkzLCcjIR8fICY8XRYOCAQCAAAAAAIFCRFFTFg=","ampharos":"X19fYFlXVVVWhoqJhoICAAAICgwPExkfJzJAQzgvLCw=","annihilape":"YmNocXZ2Cw0PDxQPEBUVLi4xLScmHBMNCAMAAAIIM50=","anorith":"cnJzdHZ5fHM3IB8ICA8GAAIVGhobITg2NDMzMzY3O0M=","appletun":"g4ODg4VoY1dPSUdHRkREQ0NDRUcjFw8MCgcAAAACCnY=","applin":"NjIvLi4uLjEzNzwsHRQMBwMBAAAAAAIDBwoOFBojLDo=","araquanid":"kY0SDAUDAwMECAsJCAYDAAABAQAAAAAAAAABAhocHR8=","arbok":"ZlpQRD05NzY2Njg8QUVNVFsQEBMWDwcCAAAABxIlY28=","arboliva":"dnFsaGVlZWdkZWdrBwcHAAACAwMEBwcHCBEyYFhNSko=","arcanine-hisui":"GhkYDQwHAwMEBAUICxMSDgwHAwQGAQAfHyEnQ0NFSnw=","arcanine":"NSQiGBYAAAQKCgcHFRsZEhITHR0dICIjJSYlIx0bG0k=","arceus":"e3FsODg3MS4uNjc6MzMyLRsaDQAABAoMCQcHRHFtaWk=","archaludon":"mXJuajc0Mi8tKiclIh4bFxIMBgAACx4pOzk2MzAvMJM=","archen":"U0hAOTUzMzM1OD5hGxISFBEPCQQAAAAFBARLSUl2p60=","archeops":"shoDAwAAAwMDCwsFAwMHH0k9OTpAWmRpgI5nY1lZbGw=","arctibax":"npqWax8TDgcDAQAAAQQIDRU3OjcyLiomIyEfHh4eP0A=","arctovish":"Kx8XDwgHBwUDAwIBAAAAAAECAwQHCAgICAgICAoMaGg=","arctozolt":"emhmZV5cXFNTVk5COjY1LywsLkJECQAAGig/enFiXV0=","ariados":"cG5tbGxsbGxtbnBJQz88NCwmIRsXEg4LBwQBAAAAX9Y=","armaldo":"IiIjJi8jIiMbGx8aGiguGA8JBQQBAAAAAAACHhYWKYI=","armarouge":"a2ZMNzMzHw4FAAAAAgcHBwUFBlpWT0c+OTQwLywrKys=","aromatisse":"GxwdGxYWFhgeJSYmICAlCQkJCwoICAgJAwAFITZPZmc=","aron":"RTMrJhYRDAkFAwEAAAEEBQUEAwQFCRIUGSJJSUpMmp8=","arrokuda":"1M/Lx8TCm5WSjouIZEY8My0pJSAYEQwHAgAABB1IS2w=","articuno-galar":"cnBwQjs0LyomIh8cGRYTDwAABTk0MjEyNDpGYHiDhoU=","articuno":"CQkHBwAAAAAEBAMFCBMbHS8vMDI3OUFGQzErKio1PkE=","audino":"OS4mIAEAARUZFBQVHjQpHREDAAAIKignJyksMTU2OTs=","aurorus":"FBQMAwICBgEAAAkICAoKDg8ODg4QEhUZIB0UERAQEyk=","avalugg-hisui":"tpWCdWRgW0I9OjYyJR8eGxQQDgYFAwMBAQAAAAAAAAE=","avalugg":"mYNmFkQcAAAFBwsJCQkICAsLCgcHBQEBAQcUM4qKjzU=","axew":"npiTjIZ/d25RPzEoIBwYFhUVFQIAAiIiICBdW1pcYmQ=","azelf":"VFNTU1RUTUU+ODMxMTwpJgAAAAMJEyMjJiUkJCUoKzI=","azumarill":"wDIjHR1JTFJXVEpDPTczMAcAAAInJycoKy4zOkAwLi4=","azurill":"LiUgHRsbGx4aFxUBAAABAwgOGSQbFREPDg4OEBQbJDM=","bagon":"OikTCgUFBQkPDQQAAAAFDyNHOzk8REBAQERLQEBHxMk=","baltoy":"dnJtamZYTEQ+OTU1MzIyNDg+LR8VCwQAAAMJEmdrcHQ=","banette":"bWdiXlZLMDAwMTIzMzQ1OTEeEQgBAAYGFx4YGCIiRkg=","barbaracle":"UCMiIictLjA1PkU0REVIS0IAGRILBwcHRERERDkzM6I=","barboach":"HxsYFhQSEA8ODg4ODg8PDg4OBAAABwgnKn5+fn9/goU=","barraskewda":"cGtnSkVBPTk2NDAuLCklIBYVDQYBAAAPPT09cXN1eMo=","basculegion-f":"cG9ta2loZmVkUD8MCgkHBwMAAAABAwUICgoMDQ4RbHE=","basculegion-m":"eXd1c3EYEw8NBQMDBQYICgkJCQYCAQAABgcSDw0LCgk=","basculin-blue-striped":"UE5MPT0+OC8oIh0aFxUTDggEAQAABA4YJ0d8gYeNlZ0=","basculin-white-striped":"bmtnVlZWVjk1MywiGxMOCQUBAAAEBg4LCQoOExkjM6E=","basculin":"kn9+fl5SSUM/GBgcCgABGRkiIicxPFKNjY6PkZOWmp8=","bastiodon":"ODIsKCYmKCkpKCYlIyIgAAAJFBMQDw8SFBAMCw1PbIk=","baxcalibur":"T0xMREdRUlJZV09FPSgUBAQAADk2MzAwMTQwJCQnrrE=","bayleef":"dF5LPC8kGxMMBwIAGBkiRhQUGxMCAAQWFBQwMDEwLy8=","beartic":"b2hlXFxdYxIJBQEAAAACDCNFQj89Ojg2NDMzMzU1NZo=","beautifly":"a2ZgWg4IBQIBAgQLDAwOExMUGRQOCgYDAQAAAAIIu8U=","beedrill":"p0pFQkAxKSksR0pFPCIcGBMPCwcEAABCRkEsKCjg4OU=","beheeyem":"TkI7ODc2NjY2ODg4MisiHh4pSGkQAAACBwxbUE5PWXM=","beldum":"PTMjEgIAAAACFQ8MCwoJBwcHCAgJDA4REhUYHy2ZnKE=","bellibolt":"fV9YVVRUQysjIiIjJyQfGhcVEwcBAAACBAcMGEVWcas=","bellossom":"Pjg0HxkVExMUDw4ODxMaQDAlHhgUEQ8NDAkGAAAdM0s=","bellsprout":"WE9JRUI/PDgoJSUnHhQMBwMDGiljY2NjMyYcDwYAABE=","bergmite":"JYuDfXZvai4uLy8xMTI1OTIpGBELBQAAAgcPFiQpK1k=","bewear":"EwgDAAAAAAADBQgNERYcIikwLy8uJyMiIiMnMjQ2OT0=","bibarel":"eHRsa2ZhYGAeDwkFAgEAAAAAAgQHCxAWHCMsNUFPU1s=","bidoof":"r5WSkm8oIiAfHyIhHBkJAwEBAQQAAAACCQwOEiInKDA=","binacle":"npaSkRoaHR8AAgkQFBISExYZHSMqNTIqIh0dISUpMDk=","bisharp":"WyMiIyYsMzEwGhMMCQcHBAAAAAAFJDI8NTAnGQsFCq8=","blacephalon":"XVVPTScSDwMAAAACBwcPX2BldXV4gZOJgoKEko54eH8=","black-kyurem":"YFlZYF9aWlxqenx+gYFiVSgPAAASFRUuNz5FVWJeXV0=","blastoise":"eXl6fX0fFhYWHB8bFRAPERETEQ4IBQMCAgICBAAAAQA=","blaziken":"dmhZTD0wIxcMBgMCAAACFGFbVU5HQDozLSYVDwoNFBQ=","blipbug":"SUlLTVFVWRISFAAAEgoHBAMDAwQHDBYYGQ4OPz9DVlg=","blissey":"NzEsKiMdGwoKBAQGDgsLCwAABhgTEyUqLzdBTVRUVVg=","blitzle":"yMjIjIhpaGpsYmVrcXAKCQkKBgMCAgIDBQEAAAADBws=","boldore":"d3NxVVJQIyEgISMlKjAuDQoGAwAAAAIEBQcJDhQZHCA=","boltund":"MCIaDwsJBQAAAQYJEisrLi4vMDI1NjUzMS8tDQsLDxY=","bombirdier":"Rz07MRgVFTs2LikiHBoaGhwdHyImKi4wMC0qJhUDAAA=","bonsly":"c2tmZUs4MC0tLS84T0o5LCIaDwQAAAAECgYGBgltbXE=","bouffalant":"Yk9MREI4Nzc1NQAAAAEECBEjP0ZPVlZWV1lkZ2qLiok=","bounsweet":"R0RCQkNGXTwsIRkRDQgFAwAAAAMzMjIzNDY5PklOWnQ=","braixen":"fTk5OQADDRgdJCQrPzY3OkNBFBQWGSElNz5FSEI4Ly8=","brambleghast":"cXJFREIlJSUiHwAAAwgMDAwMDg8RERELCxYYMTY+X4Q=","bramblin":"XVhLPC4iHRgAAQIGBwMAAAECBAUHCAgOGB0gJSsyPFQ=","braviary-hisui":"xsPAvREDAAYSGR0gKCAgICMlJikpKjtHPjw8PUxSgH8=","braviary":"AAABAwcKDhIWHCI5OCchHhwcHBwcGhYWGDQzM0lJf38=","breloom":"HRcVFRYbIigoKUVHJhsZHRcPDQ0OGBgcKisSBgAABG8=","brionne":"t7V8d3Q3BAEAAAABAwcNFSYwMjQ4Oz9ER0dHR0dJTVU=","bronzong":"bWllZWVlYlwKBwUDAQAAAQkWVlVTUVBOTEtJSUpNVWA=","bronzor":"cm1rYk9DHRIPDg4RFRMSEBAQEA0EAAAABAwuOUpKS08=","brute-bonnet":"Hx0dHRULBQEAAAAAAAEBAgMDBQUGCAkLDhRERERERYw=","bruxish":"WlZUU1JRT01LSEVBPjk0LyojHAIAAAAEBAMDAwYjNks=","budew":"iXtwaWRgXV1dXWBNOS0fFhAKBgMAAAAAAwYMFCAsMDY=","buizel":"n05HQz87Ny0mIh4bFxQSEhMXFBEPDgYBAAAAhoqwsrQ=","bulbasaur":"xLd4aGAhHBkWFREMCQYEAgEAAAAEDBceHx8hIyYpKS0=","buneary":"NSwiIiIpKCcoKSsvHA0EAAAABA0WDg4USUlOUFpsbG8=","bunnelby":"uCIFBAAAAAMJERomNEhfbGllU1NVVWttdHRsampuZ2c=","burmy":"joOAdnBwamliOi0nJSUkDQUAAAACCwUEHyEjJzQwKCg=","butterfree":"NjYTCQYDAQAAAAECBAYICw4RFRcaHSElKjVDQ0RGS1E=","buzzwole":"LzI6QkhQUSMhIBAQDQwMCAQAAAACCA0NDWZ9jKOmqas=","cacnea":"aGdnaGlKSUlJS0FAQD4yJx4WAgIEAQAAAAEECBJJk5o=","cacturne":"b29sZVtSQDs/U1ZaJCEKBgAAAAEKPT06NjY4MzM5PYA=","calyrex-ice":"SEI+Ozk1Lh0eJSQiIiM0PA8LCw4AAQMHElxeUktLS0s=","calyrex-shadow":"Ny4hISEjJiw0Q0M+FxQUIBAQDgoKCwMAADIEBBInPaA=","calyrex":"RTImHhgCAAECBgsPFR0nPFlZUUM9PT9PT25vb29vb3M=","camerupt":"bm1samhdOzYiIiIiHgsCAAAREBAQERMPDg4PFB4wY2g=","capsakid":"TQcHBwoNCQUCAAAABAcKEBIUGR9NRTc3UklHNDQ2O0Q=","carbink":"IQAACBQiNDQtJSIZFhQRERQWHCEhICIoNDdCRk9eYmw=","carkol":"Li4yQRgXFzYwKSYmGBQUEg0BAAABBQ8TDQsJCAgNR0g=","carnivine":"akdHMzIiGxcTDwAAAAACBAcLEh5jY2NjZV9dV1VVVmk=","carracosta":"TEVAOzg4ODs7MioiGxQOCQUCAQAAAAEEBQcLFB0vPpY=","carvanha":"Dg4ODg4PDxASEhAKBQQEAwIAAAIIEh8vQ0VHSk1RVVk=","cascoon":"qaYRExsjKzI5NTEuLCsrKyssIhYKAABAOzUvL4mGg4I=","castform":"YVBDPDY1NTcqHxQNCAMAAAAAAwcMFB8sNS0qKisuN2M=","caterpie":"CQEAAAQVExISEhMWGhscICcvLCoqKi47Ozs7PlhfaXg=","celebi":"mJc2LSciHhwZGBgYGBkcBwYAAAUOFhwfJCoyP1tmi40=","celesteela":"dnZlYl5aV1NPPz8+Ozs5NDIsHxMICAcDAQABCg0eY2c=","centiskorch":"JBYQDQ0MDA8SFgIAAAACBCgoKiMfHh4mJiQjIyM8PHw=","ceruledge":"dnh3d2hhWVldYmdkSkNDQTsyIBcQCgUBAEpKSklHR0c=","cetitan":"QkIfHyAiJCcqLC4tLS0lGxQLBAAAAjk9Pj08NjQ0l50=","cetoddle":"w7m2tLOwQEBAQEFCPzs4NjUAAAABAwUMFBsoNTU2OT8=","chandelure":"gn9+foCDhYF8IBoUDgkFAQAAAAQNDhASFhsgIycvP3Y=","chansey":"ZVkXFgAAAAIEBhYjIR8eHBwcHB0eICImKi8zKyUlJq8=","charcadet":"hHloY2M0IhYMBwIAAAEEChMhP1gvLC00PTk5Oz5AQok=","charizard":"WktFKSMaEA4KBwMBAAAAAAECPkVTLyciHhwcHSIpPT0=","charjabug":"YzsuJiIgHRsZGBYVFBMTEhEREAsGAwAABRUiLDZDUWA=","charmander":"LSQdGhkXFxcVExMVHSwfBwAACws0NCsjHRsbGxYNDRM=","charmeleon":"a1s/ODAvMC4pKSozSj0lGhIIBQAAAQ8lISEhJRcREh8=","chatot":"kIyGgXxjKyAOBgIAAAEFCwoIBwgQERMYIigwKCMjLzg=","cherrim":"LyUfHBsbHCEfFxEPEB8dHBwcHiAiJSciGgoAAAocPEY=","cherubi":"RjkwKSMfH0NNW4N+dUMrHxUOCQUDAQAAAAEDBQoQGCI=","chesnaught":"Pz9CREZJS0ZCPz44KBYJCAUCAgEAAAAMTk5PT0ZBQZo=","chespin":"e3RKSwAAAwkPGCIpJyYmKCwJBgcPJGJfXl5eUEI4NjY=","chewtle":"mZCFfGlGLiAWDwwGAQAAAggWIzJEUldTS0tJQ0A/P0M=","chi-yu":"sq2qp6V7bGlnY1lQS0Y6MBoVEgsFAwMDAgEAAAIdHSA=","chien-pao":"rqmlpJiQjqOhoJ9zaA0GAgEAAAECAwQNFSEgID5CkJM=","chikorita":"7M6QeWhcUkxJRkI8LicjISAgFBAPCAQCAAAAAwcNIiY=","chimchar":"h3lcWFhDLiIaBAAAAAADCRAcHihEX1tYVE5IPTArKzw=","chimecho":"HRUVGR8PBAAAAAASQVlJQEBAREhKTU5SVVldYWZjXl4=","chinchou":"OCwkHhgUEA4LCQYEAgAAAAABAwcOVV1oirzRz8/P0dU=","chingling":"c29vb3FvamhlY2JiYWE9KSAAAAAEDg4DAQECBQsiLD0=","cinccino":"LiklIyIhISEiIyUoLDAzNy0hGA8JBAEAAAABByotNWM=","cinderace":"IR4dHR4fISQqMgAAMktLU1JUX2JjbHVzc3ZzcGhnZ2c=","clamperl":"PTk5IQ4JBQIAAAcLBgYHCBojIw4HBAMFCQkKDxgkO0g=","clauncher":"dG9qZmNgXlxbWVg1KCEbFREMCQcEAgEAAAAAAAJZWaY=","clawitzer":"lZKObGFYUkxGQj45LyonGQwHAwEAAAAcIxoWFh5lZm0=","claydol":"op6VaTw0Ly4uLCokIyMnIhcTEQsAAAEnMjM3Oz4/Q3M=","clefable":"GxwfIicMDBEWAAAHERwKChcuLCwsLCwsLi8xMzU5PEA=","clefairy":"FxcXFxcYDg0AAAAEBQgKDRAUFBQVFRYXGBocHyImKi8=","cleffa":"gnlwaUw4JhkNBQAAAQUKERkiLCkhHBkYGBgYGyAnN0Q=","clobbopus":"dGtkXhUNCQUDAQAAAAABAwcPEhYcIiYrOkxfWlFRUVg=","clodsire":"LCIcFhENCgcFAwIBAQAAAAAAAQIDBQcKCQkJCQsRPok=","cloyster":"28y8r04AAAILExskMjIvLi4yMyEcHB82Pj9ARk5JSUk=","coalossal":"dXFqZGFZUy8sKywnJiciEQwCAAAMIyMjIyYpIxIQESw=","cobalion":"bVxMOzAfDgwPGBYHAQAAAgojIyYlIRwYGBkdJCgbFhc=","cofagrigus":"xMTGuLi4hA8PEAEAAAUEBBIUTE1lMzExLBsVFRYgICw=","combee":"MzM0NjY2AgAAAAABAgQHCg8VJy43PDw8PDw8PD5FTFQ=","combusken":"o4WEhBwWAAAADiIiJhsWFiYrLi4vMzk4REROVVBOTlA=","comfey":"PTYoGBgaHiUkHhoVBAAAAAACAgQMEw8PEBMhK0NHS2Q=","conkeldurr":"fiYfBAICAgIBAQECAgICAgICAgICAQEBAQAAAAALsbY=","copperajah":"KyEaEw4KBgQBAAAAAAEDBgoOFjc1NDIyMj19fHp6eoA=","corphish":"S0ssLC8QBQEAAAAECQsPExkhMT4/QEU0MSklJCMjJSg=","corsola":"19S/KCYmKzE4EhEBAAAEFB8jPEdMTE5QUVFSYmx4fH8=","corviknight":"mJaPfn6DYV1dYV1WUUxJRkVEQDguIRMAACArTlZXV1s=","corvisquire":"uamcQy0dGBUNBwEBCwcEAQEBAQQIDxkNBgYBACwrP1I=","cosmoem":"d3FsaRwcHSEmIBYPCgQBAAAAAQUKEBkjJCIiI2drbnQ=","cosmog":"AAAAAwsZFRUWGiMlJycnXU9KSUlKR0ZGSExbYGJnZ2g=","cottonee":"YFlCOTQxLy4uLzMvLCgmAQAAAAABAwUJDhQlNTg7QV4=","crabominable":"1Lu6urq6kYyMlpuQTkc+KhwKCQgAAAEEBAYMDw8YHR8=","crabrawler":"q6R+e3l3d3d3d3d5fYCAgHt4RzkcEQoFAwAAAAABBQs=","cradily":"HBwcLT5LCAAAAScjGRYWHCgwNz5PlI+Fe3RtWFJSU1k=","cramorant":"OzxEVGhkYF9fYWZvSD00LSciHxwaGgYAAAIRKkVRVlc=","cranidos":"d3d3dikkIB0aGBcRCgYEBAQEBgMBAAAIMTM1NDMzOkI=","crawdaunt":"V1I2Njg7P0FCQkVFRUVCQkJGJBQLBgIBAAACGRkiREU=","cresselia":"wbewq6imCgEAAAADCA4UHSczQVA5IQ0MPzcxKiYiICA=","croagunk":"JyEZFBERERESFh4tPkA+PTkrHREJBQIAAAEQKCYmK78=","crobat":"AAALFBshJSgrLC5faHB2e3BbTkM8NjIuLCypqbzCxso=","crocalor":"XD0oEA8PDxAVEwcFBQgLExMTExcAAAAJNTUxMTI1Pb0=","croconaw":"ODIuKxAQEBMWGw0KCQgIDBACAAAEPDw6NzY2NjolJSY=","crustle":"e2lOLygjHhsZGRobHB0eICIjJSgVDgoHBAIBAAAAAWI=","cryogonal":"Ukg+OykgFhYWFwYAAAABAh0hIAYGBwgIFiIiIyU0U1o=","cubchoo":"MiQdGhkZGRoPCgoLDBIaHx0dGxkZFxcXBgAAAAMIEow=","cubone":"ODg7QkhISEhHQToyLS0wMjI2QTwzKyAZGRseFQQAAAI=","cufant":"yMJzZF5EMSQdBAAAAQ4NDAwNDQ4PEBMVEQsICAkNFlM=","cursola":"OTc3OCoqLRsZGRsbAgAABRgSCwsLZ3NzcW1fXl5faHI=","cutiefly":"ODc3Nzc4Ojs+QEMmJBoSDg0AAw8UGiQpNjg6Oz1BREU=","cyclizar":"j4+Tm5iTkIqCdA8FAQAAKS0wMzc9RVBOSkdBPTo5OVM=","cyndaquil":"bW1tYGBgRkYAAAYPFhgYICYmIxEMDC8uKk1OT1BTVVg=","dachsbun":"6OPMIRgRCwcCAAABBQcICw8QEhEQEBERJjo8ODc4P18=","darkrai":"lYloYlwbFA8LBwQCAAAAFRcYGTMtJBsUDwoICiA1RkY=","darmanitan":"d3VybWxsbGxsbWpeEQwDAAADFCwmHxgSEhQUGyqIjJY=","dartrix":"DQcEAgICAwYHBwcEAgEAAAAAAAEDBQYJCw8SFxYJBQU=","darumaka":"jXAgICEiJiwbFgICAQAAFhwjJSYnKSwwNTxDSE5WVVY=","dawn-wings-necrozma":"IRwYBwAAAwYKDAsLCwsLDAsGAgIGFBYYGx8iJis1Mi8=","decidueye-hisui":"VEpKTFFLPDMrJiQuIhgAAAsFAwMKF0I+OyQkFQoICAk=","decidueye":"DQ0OBgUFCg0FAAABBwcJEA8QHx8iMjNISU1ma393dnY=","dedenne":"PDYzMTExMTM4Pi0ZGR8dHBw5JyM+PAsKCgAABQwdJks=","deerling":"fGBbRUVBJx0XAAACCBIhQkdDQUBAQUVJTlJWVlNOSEg=","deino":"g3pwZ0ghFg4GAAABBAkJEiZNVEJFOj0+QDs7TE5QTks=","delcatty":"BQcLCAACICMmKy8tIiI9NTAXFhYgHR1GSEpNUFNUU1Q=","delibird":"PTs4JiYtMwAAAAADBQoQFyEwLiooJiMjIyMlKSYaGiY=","delphox":"Mh4cGBIMDAIAAAACCAgJDxMYGBwjJihOT09RVFJJSUw=","deoxys":"WkZFRUVTU0tGQzs2NC4oJSMeFxIPDg4OCwQAAAASHh4=","dewgong":"l42Hhk0uIRsVCQgICgsVCAcFAAABCg4fLjM6Qk5diZM=","dewott":"iIF/flw6OjogICUwNSoqZ2VjXldHDgIAAA0VGyEjFRM=","dewpider":"WEE1KiMcFhQRCwYFBg8WHCMrOCcNAAAABAQEBAUGBwo=","dhelmise":"PDs7JCQpLSohCgUEAwAAAAAAAAQGCwUEBAc4OUBBYGA=","dialga-origin":"JSsTFis0NzQwLzA3AAIPEBMXHCIoKiglIBwXFBQWGR0=","dialga":"lZqboKSpsUxMMzM4QCgoNUIAAAMKEh43Ojg3MzMzNXY=","diancie":"ZmVkQUFDR0tPQCwXDgkEAAA/NjAvLCwuNjU2Oz8/Qkk=","diggersby":"UDUqIRkUDgkHBAIBAAAAAAEECUtISEhJTlBTW1NQUFQ=","diglett":"WU9GQDs3NDIwMC8vLy8vLi4uLi4uEw0KCQQBAAADHCs=","dipplin":"cXN1eHuAgoWHiYuNj2JhYWVtU0ZBAgIDDAIACCk7O1M=","ditto":"Zl0rJSIiIiIlJykrKSglIh0YEgwIBAEAAAACBQ45TFs=","dodrio":"PkRMUVZSBgANHygoJiMjZmdnaWxyfIWCfHZsTk1NYZA=","doduo":"6+Td1rGlXgIAGS5JUm5xcGppZ2hpaneQlpGKin5vZmY=","dolliv":"VFQZBgEAAAEGEjw8P0pOU1xfYHhsXEc+OTxgWkkhICU=","dondozo":"b0ZDMS0tIB8fHyEjHxwbEQkEAQAABC8vLy8vMTU7SFg=","donphan":"dW1iVlBMQCwWEg4MDDcAAAACBQkQGTMzNDU4PkBDREg=","dottler":"XEw8LyIeHBkXFRIQDgwKCAYEAgAAAAEGCxEXHiY0Tk4=","doublade":"GRMTExQVFBIQDgwKCAYEAgEAAAAAAAECBQcJCwwODxA=","dracovish":"OiINBwMAAAACCBcXFxobGhobIEBFa2xveGtpaWylpa0=","dracozolt":"XldSTzcbFQ8NAgAACAcKGBYTEhISExUZHiMbFxcaTEw=","dragalge":"OzULCAsPEh8XCAgOQkdLTEAJAAAdaWNjgIBzWlpibGg=","dragapult":"UxoaHiUuNDRHNzIyMjUuIhcNBwIBAAAAAQQIDRMbJjU=","dragonair":"nVlZXmFjY2Rqa2xtd3dyFQwHAAABAwMEBwsRGzBSWWI=","dragonite":"kwsICAs2Njg0DAACBgsWLSkmHhkWFRUYGyQRCQkYg4s=","drakloak":"gnwxKyUVCAAAAgsVICkvNjxWPz4+P0FEXWBeXV1dXpY=","drampa":"aWNeWlhWVFRSUiQhHA4HBQUBAAAAAw4UFBdfYF1dXXU=","drapion":"TklGQ0EvLyMiIiIRERIUEQcBAAAAAQQZGWNiYmJiZLQ=","dratini":"ycl1dHZ7f4CAgoyRk5SrsLS5vMDDGAIAIjtMWmdyf48=","drednaw":"aAIBAQEDBAUICQkFAQAABREaHR4eHh4fISIhHx4eHls=","dreepy":"NjIvFBANCwsKBgIAAAtQUlNVTEpKSkpKS0xPUVRYXWw=","drifblim":"dXV4fWVaUEpFQT49PT09P0FFPzQqIBcOBwAACgkflJc=","drifloon":"Fw8OBwAAAAkKCAgICQ0SHzJqZ2NjY2NjZGdscnuFkJA=","drilbur":"CAYEAgEAAAAAAAECBAcLERceKTZHREFAQEBCRkVCQkI=","drizzile":"UE1MTE5MQDgxLSooKCgJAQAAA359d2RZU1JSW05ISM4=","drowzee":"BwQCAAAAAAABAwYJDREVFRUTEQ4LCQYDAgICAwYJCQk=","druddigon":"ZF9MTFBLMSwbGhocIS8vLzAwLxQRBQAAAAISFkdOWqQ=","dubwool":"n1FRalZDKiEcEAkFAwMEAgAAAgICBQ0ZHiYlIyQoMIU=","ducklett":"ODMcFhUUFBQCAAAAAwcMFB8sMDlYWFFNTU5TV3teWVo=","dudunsparce":"RkY0JRoTDgoHBAIBAAAAAAIECQ8TGBoZGTU3VW+KkJk=","dugtrio":"f3ZwbWppaT0yKyYjIiEhISEiIiIjIyQkGAsFAwAAGEA=","dunsparce":"5+Lc19DMyGJZVVFQTk1NMh4TCwUCAAAAAgULBwUqOTs=","duosion":"hnlxXUo8MCceGBMPCwgGBQQDAwQFBQEAAAACBg8eQ1U=","duraludon":"eXNkXVZSUlNWW1xaWVcoBgYKAAAOFxkoIh4aFhUVnJ0=","durant":"aGJgMColIREQEBARFS4qJiMhHhsYFhMEAgEAAAAYGSY=","dusclops":"bV1ZWVpTTkhEQkA8NjAsGxYLBQAAAAEWFjQ0OGhnZ2k=","dusk-mane-necrozma":"DAoJBwUFBQUFBQUFBQUDAwoJBxAQFRkZFxMEAAA5ODg=","dusknoir":"Y2NlRTo6Ojs8PTs0KiIbFg4GAgAAAAABBAMBAQECBQs=","duskull":"Pjg3OT0zJh8cHBgRCwgGCBEQEAYFBgQAAAoTX2JhYmk=","dustox":"lZOSkQQCAQAAAAAAAQECBAUJCQsNEBQYIiMoLztBS2I=","dwebble":"kIllVUo/KSUiIiIiIB4cGQwGAgAAAAABAAAAAAABAwY=","eelektrik":"NjAtLCwuMjcmFQoFAAAAAgUIERxNTVBfVk5KRkZGSVA=","eelektross":"WU9HQDs2Mi4rKScmJSUlJSUlBQIBAAAAAAEDBwkLDoU=","eevee":"BAIAAAAAAgQHDBIbHh0cFwoBAQAAAAsVHiUnKi4sKy4=","eiscue":"op6bazYNAgAAAAAAAAAAAAABAQcgUEpBMC4wVVpRUFM=","ekans":"JRoTCgQAAAIJIR0dHiU0KiIcGRkZFAkDAAAAAQUMFSU=","eldegoss":"VEAzKB4YEwoHBQIAAAAAAQIFBQsOExkgKDdHSDs8RWs=","electabuzz":"T0dAOTMvLCkoLzA/RUtLRUA9Ozk5OTYtKCUVBQAADZc=","electivire":"BAEAAAAAAQIFCxMeFRQUDwsIBgUFBAICBAQvKiklJCQ=","electrike":"6nVfTD4yKB8YFBQVFxEJAgAAAgkVIiIjJyUeHBwdJYI=","electrode-hisui":"UUAzKiIbFREMCQYDAgEAAAAAAQIEBgkMERUbIio0QFE=","electrode":"UUI1KyMdFhIOCgcFAwIBAAABAgMEBwoMERUbIiozQE8=","elekid":"Z2FgYGBgYGFiYmNfW1hWVSgcFA4JBQEAAAIFC2tscIY=","elgyem":"c2VZT0ZBOzg1MzMzNDU4Oz9ETFVXT0cuFQoFAAADGkU=","emboar":"WFVRSUVEQ0MVEQ4NCwcEAgAAAAACBQsrKysrLicmK6k=","emolga":"LSgjIR8fHx8gHBgWFRQUFAEBAAAFBgcJDA8TFx4kLlQ=","empoleon":"kYyBfn52dnZ2d3BbMi0pIhoTDgkEAQAAWmBoVUxLUl8=","enamorus-therian":"JyQjIyMkJyIZAAABCB8mOUZDQ0NKR0M6NTMzM3V1d3k=","enamorus":"TkxMTlVeXl5ia1dVTEtLRDcgEgcCAAAAAw0PFBsXBgY=","entei":"LSIYFRQRDg8QExYXGBoWEw0NDRkfICEWFhYWDAIAAAQ=","escavalier":"ZFRGPTcyMTEyOHtzbWlnXlBHQz0yJRoNAgB2dXV1g4A=","espathra":"DQcFBQEAERUUFBQWGhwmNDRGYXB5Z1lVVFJPT1JnYWE=","espeon":"Hx4eHh8hIiQKAAAPGC4yO0VEQ0NCQkJDRUhJSUhGQ0I=","espurr":"ZUgfFAsHBQMDAwAAAggICQ81QkRGRT41MDAyMjZMUVY=","eternatus-eternamax":"PDs7PDg4Q0hNHRYKAAAGCkdAQTIkGRMMCAiQlJ+mqqo=","eternatus":"7OIXOTImIR0ZEg8OCQgFAwEAAggIFwYGDAxoZFlXZ2I=","excadrill":"trd5bWVfWlhWUk1JRT8gHhwZEgUEAwIBAQAAAAAAAAE=","exeggcute":"pklGLysoJiUlJR8VDgoGAwEAAAAAAAIECQ4VInh9g4o=","exeggutor":"jjc3O0BFSRIFAAA7Gw4GBRkUERART1VgYEM0NTs+Qkk=","exploud":"RzMuLCkWERESFBMRERAQDw8MCQcEAQAABSQkHxkZGpA=","falinks":"ppw1NDQ0NTY2Njc3ODIrHRYRBAABBQoMDRAVICAhJi8=","farfetchd":"iUMDAAAECA4UGyIoKy8wMCwrKis1NjtKTVBSVFRVZaI=","farigiraf":"hX5+g5aOiopzbW1jXlZWTkM4NiYfGhcVDg4MBAAAASY=","fearow":"U0tFRURERERFRkhJS0xOPzUzKysrKyshFggCAACKiYo=","feebas":"bm5ub3BwcHFvUkM5MSsnIyIhIiIhHx4fHx8iEQQAAQg=","fennekin":"qqGZko2IBwcIDQwAAAYMFiIlJiYmJiYmKC03TVpaXKc=","feraligatr":"aGVjUlFRUU5BNCYYFAsIBAEAAANBPTs7PEE9OT1Dxc0=","ferroseed":"ioSARUVHSkM8GBgbISQhHxkJAAAKGiAiJiEdHD1laWw=","ferrothorn":"2s3MycnJyQ8GAQAAAQICFBYZIkA/QUZEQkJDSEdHY2U=","fezandipiti":"UUJCQkJCOi4uLjEmHhYRDAgEAgIBAAABAnt6b2VeXmQ=","fidough":"IBgSDQgGAwEAAAAAAQQGDhMXISUlJScqLTMzMzh2dng=","finizen":"aF5YUzksIxoWEQ4KBwYFAwMDAwMDAwUGAwEAAAABJMM=","finneon":"rqikoZ6cmpiXMy4pJiQiIiIiHhgSDgoHBAIBAAAABRI=","flaaffy":"GBENDAsEAwYOGBEQEA0NCAAACSonIyEgICIlKjQ9MzA=","flabebe":"ICAeHiAuVFVaYUlISBMRERQKAgAABBFFRU1manF6hZY=","flamigo":"IA8GAAAAB3poVEU+OTc4P0NVaJNHQ0NJlZaWlpaXbWk=","flapple":"WU9HHx4dHR0UEhERDAcEAQAAFBQWPzokHR0eICQpMDk=","flareon":"SUE7NCkoJiMhHhYRDw8ODQwMDAwRFxkbHBUJAAAAWFg=","fletchinder":"yb+5sqyoVUA1KyQfGxgWEgkCACIiIiQpMkkzLy85X18=","fletchling":"083IxMG/vEI2LyomEgAAAiMlJyouMzhASVo8PEA5PFY=","flittle":"HxgVEw8EAAAHEygxNzMxLy4uBgYGBAQECA4VHylQV1g=","floatzel":"YVpRRTYxKSAgIygmJhkREQ8LBwMCAggFBQUIDgIAAYI=","floette-eternal":"tK2qpaCbkYN8UFAAAQc9RE4+HREPDxw+OjYyMDAyTlg=","floette":"aGFgYFpXV1dZW19lYFErEQUAAAMPOjYxLisoJydLTlk=","floragato":"JycoKi0xNDgnJy8yMjU9CgcBAAACBxslJiklGw4ICA8=","florges":"nkAAACspKCUrLBAPDwcHCRgbHSAjJiouMjg/R1QXF1U=","flutter-mane":"KiorGBgYGBcXFxUKBQMCAgEAAAABBA8ZHyUnLCwsLTY=","flygon":"NiESBwAABAkPFRwiPFdgQz46OTMvLSsrKyssLjE1O0U=","fomantis":"b19TTDIuLi4yISAgIykzMC8vMDQ7QRAGAQAAAAQKFWE=","foongus":"Tz4wJx0WEAsGAwAAAAAEChIfM0pFPjkwJSAgMjQ2PEY=","forretress":"cEtCPz89ODQvJSMiIiMRAgAAAAkTExUvMDE1PUBGTHM=","fraxure":"VlRSOS8oJSMjIxYMBQAAIhkZJVdaVU1GPzw7OjIrKaY=","frigibax":"RkA9Ozk4ODgyLy0sLCwvMgQAAAEGDRk4NTU2T0pKTKo=","frillish":"i4lzZV1YVVVVVVdQUBIAAAACCSIxQDUuKigoKCksMpc=","froakie":"R0E7ODU0MzIkHQwGAgAAAAIGDhwjHx4eHyMoLRoTExU=","frogadier":"IRkXFhYMCQcHDBYlMjI0QEJFQkA/PTsvLCw3JwAAAww=","froslass":"ZQcGAgIFCAYFBQcMFCUqHRIIAgAABQ0QExkoMzg/SFM=","frosmoth":"Y2MiEQkDAAABBQwUHSYwOUFHTlJXWl5fX15bWVdUUlI=","fuecoco":"U01LS1RdWj4zFgYBAAACChgaFxYUEA8QFCQjHx0cHHw=","furfrou":"PA4NDQUFCA0HAwADGBYUExISExQWGi8yMzQzLikfHh8=","furret":"l4h9dXBtbW1vdA8AAAYNFxweHh0dHR0fISQpMDlFWWs=","gabite":"LSQfGxshKio9Vk01Kh4VDAQAABw7OTk7Q0M7OkFKnKw=","galarian-corsola":"0MzKJiIiIiQsFRADAAABBBEgJC5ES0xOUVNWZnN6fYs=","galarian-darmanitan":"PC8kHhkWFRUVFRcbIB0WEQ0LCQIAAAIGDAoDAwUGBws=","galarian-darumaka":"OTk6Oz4HBQUAAAUQExgYEgkFAwMDBAgQHi83QlJtd3w=","galarian-farfetchd":"AwEAAAABBQgOERYaICQmKCsuMTI5OTs/Q0ZIPTk5Q1s=","galarian-linoone":"BAMCAgICAAABAgUHChEfGhQOBQULjJKXnJ2dnqCrtrs=","galarian-meowth":"WU87Ojo6Ojs9Ly8xDAgKBgAACgpEUFZednt7fpeam5s=","galarian-mr-mime":"QTYjHBsbGyMrLzNQT05OTxAIBAAAAgkUGyJ4dXNzeIw=","galarian-ponyta":"GhUUEBAOCwsLCQIAAAAFBgQEBAcIAAABAAAEIiIjIzQ=","galarian-rapidash":"gzwwKCUeFxIPDAsLDAwPEQ4KBgQDAwQGAQAAAg4ZHi8=","galarian-slowbro":"Qj08PD1ARUVFRUI9AQAAAAEDBAgLDxQaHBweIyEhISE=","galarian-slowking":"SjYzMy4nJCAKAwMFChMWJRcKAgAAAyUpJSQkJSsrK5o=","galarian-slowpoke":"UkpEPjo1Mg8KCAcHBwcICgkIBwYFAwEAAAABBAgLDxQ=","galarian-stunfisk":"pISEhGtra21ub3Fzc2dWQxYPCwUCAAABGyAhIycrND8=","galarian-weezing":"aEIvLzEzMzMzMzMzMzIyFgQAAAEWCwoKEhQTFhEODQ0=","galarian-yamask":"hYWDZ19aVlRSUgoCAAAAAQcRgYGCZWBcV1VVV1pcX3U=","galarian-zigzagoon":"LCkiIiIiHxsZGBUSEhIQEBYVFQ4HAgABBTc/Q1ZcdX8=","gallade":"gYGCg2hQOysbEAYAAGludXFkYmJjV01COC4mHhgTDw8=","galvantula":"fHp5eHBwblxSTz44Mi4pJSEaEQ0LCAQAAAYGDA9mZm4=","garbodor":"XldWVlYlAAABAgAAAwICBA8JBgUFBQgMFRslJSYuM0I=","garchomp":"V1M6Oj1JY2ZiUkU9HBQQDgwMFgQEBgkCBAYEAAAfHh4=","gardevoir":"nZWQj46Oj5GWn52ViHloVVBUpJqKYzYfEwkCAABuhIo=","garganacl":"gH9/XVhYWD8/PyokJCQkJD84Jw8IAwIBAQAABhFIU40=","gastly":"X11dPTovLi8CAAAIBAICCQsODg8JCQkLFRscHjw8PUk=","gastrodon":"zcaIekRDQ0VHTl5iZ42QZGA4MDAvJyEXFRMMAwAABTg=","genesect":"HhoaGhw5MSwjGRALCw0jHBAIAwEAAAEzND46NC4jI+A=","gengar":"MDAwMTEyCwABAwkRFRkaGBcXFxcUEA8PEBIYISdTXHs=","geodude":"2RcUCwkEAgAAAAAAAAIDBAYICg0PEBESFBUWGBodIik=","gholdengo":"g316d3d5U0dBPz9NfH+CejQBAAALCw9rYlxcYGdpa24=","gible":"lXplVEY6CAAAAAQKEhMiLjE1KxwcGBg6Oz1FUlxcaJQ=","gigalith":"c29saGViUU9OTU1MTVJUGxkXGBsdIAMDAQAAAAAAEJ0=","gimmighoul-roaming":"l0xMODIsJiAaFAYAAAMwMzpCQ0JCSk1QT0pHRkZGS8A=","gimmighoul":"pnkSBgEAAAECBAUGCCQSEhoUDg4QExcdIywzIw4KDBs=","girafarig":"JCQJAAAABhcYNjg4ODg1MS0oIRgPAwIECxAWGCEoPTo=","giratina-altered-forme":"MSAcGA0IAgARHx8gODhBSE5NSkZCPz45OTw/PDc1NYE=","giratina-origin-forme":"bF43Mi0mJSMSDAcEAQABAQQMEhUUFR4KBw8vIyM7Q1A=","glaceon":"pqampqanqKwBAAAAAQIEBwkQHCxOTExKRkI/Pz9AQkM=","glalie":"AAEEBQgLDRATFhkVFRUWFRQQEBESFBofHyAjJi03SVM=","glameow":"0n5zbmcODQwMDQ4QFBgUBgAAOjo8PDs6NTU1OD08OTk=","glastrier":"NjAsKCQGBgcMCgQAAAEqLCwoHQoEBAYLAAEFCxciISE=","gligar":"ZRQUFhseIQEAAAIHEB8oLSggFAsICCgREhMSEhcfKSk=","glimmet":"Z2ZmAAAGFSUkHhEKCjs+Pz8/OzYyMTExMjU+TGSesLk=","glimmora":"W0o/NCwlHxoVEQ4LCQcFAwAAAwMGCQ4VGx4kKjI7RVE=","gliscor":"Fg4KCAcHAAAFDBATFRQSEBApMjk9dnZ6homSkIuHhoc=","gloom":"c1tQS0ApHxgRDAgEAgEAAAAAAgcuMTYzMTE1XUo/Pj8=","gogoat":"MiIYEg4NDQ0FAAADCRQbHBwhISsvOkJASVJhXldNR0Q=","golbat":"BQkNERQWGRsbGhgWEg8IAQADExsgIyYfHyMoKisrLG0=","goldeen":"XFtYSkhGRislHBoZGBIODQoFAQAACjk/OjY1NT5DRUc=","golduck":"Yk5NTExMS0szJxkJBwEAAAFfWFFLSEhIPjMvLy9An6I=","golem":"gl9WTkdCQD8ICA4MBAAALC0sLD8/QEJBNC4sKzK0tMM=","golett":"JBQNCQQDAgAAAAcJDiorKysrLC8xMTc2My4sKyopKS4=","golisopod":"f1pRUVE+PTw7ODUoHBoXCwcDAAAWFj9AREJCm7bEysw=","golurk":"eHgfHyAlIiEhIiYWDwoHBAMAAAEBBE1FQTc0NDEhHyA=","goodra-hisui":"in93cWw0GQ8LCQkAAAMQEBIUGSosTUhFRERGcXd0dbI=","goodra":"eXJxbW1wb29ze2JVbHIuCxIMCQAGBgYICg4SGSU6Gxs=","goomy":"IBwYFhUUFAEAAAACBQsIBQIBAAAAAQMHDRQdGxoaQHk=","gorebyss":"oo11YVRLRD44NCsrKSQfGBEJAgAAW2Jna22Klpmdoqk=","gossifleur":"ZlxPRT88HhQBAAABBQYGBgYHAwMPFh4oPToyFRUaJDo=","gothita":"b2oVDAgFBAQEBgkJAwAAAAADCRAcISEjKTI9P0FGTlo=","gothitelle":"fBsbIxMTJRUVMisrGhUIAABISEg5NDMzNjItKyssMTM=","gothorita":"BQIAAAICAAAABQwbGhkZHiQzS1tRUVRub3J1dXNubm4=","gouging-fire":"WVctCQYSJTE5GhsmAwMGCQwRGCcrLDAqIxQGAQAAFnQ=","gourgeist":"OzEsKioALDM1NDQzLSMbGBgYGRINCgkJCg8VH0BHT1Y=","grafaiai":"ZmM3NzknJygqDgAAAgQHCg8VHixBQURITFJcV05MTHI=","granbull":"PDQvLCwsUlRgYCUTBgAAAws8JyYnLCwsLCwtKCEbGxs=","grapploct":"aVxTTEdDQD49Ozs8PUFESRIHAgAAAQ0ND3FlSD46Ojo=","graveler":"XVtYTklGRUVFOTQxLyMfHBsWExISEQcFAwMEBAIAAAA=","great-tusk":"bWdcWE5LEw0JBQMCAQAAAAABAgMGCQ0SGigsLS8wMzY=","greavard":"dHBrY19fX1VRUVJaOTAcEQoFBQUFCgUCAAAAAgkUIio=","greedent":"Pzg3NzcwJSAeHRoYFhYVFQEAAAIMDicuJyYnMD9ve4I=","greninja":"mkxMGRQSERIWNz9GUWBiXFxPSkhGQT04MigZAQAAJEA=","grimer":"XVVPS0hGRUVGS1hSRD43DwgFBQYBAAABA0I8OTk5PFQ=","grimmsnarl":"gYJJSUpKODUsLC0zMyURBwYAAAYbHERERklMSTc1Nac=","grookey":"kkxMTlNIQ0NGU0xINR8eHiMpMj4XCgMBAAACBQ4jQEM=","grotle":"Vzg3OCoqHh4jIiIiJBwZFxQREA8OCgoPCwYBAAJMS0s=","groudon-primal":"29q4qKCakiUBAQEBAAACAAAFDBQbICYtMztEUGlnZmY=","groudon":"kIV5c25sZmNgDggEAgICAwUGBAAACw4WHSYzMjM2Nzk=","grovyle":"tYxCKh8fHyQxO1FYWxoOCQkLDAgFAgAAABg2mpqbn78=","growlithe-hisui":"uLW1SUU3LCUaGhgXFxkXFhYaJSUIAQAAAQMMHRgLCxU=","growlithe":"n5CFfXptYFtYWFdXWGI5GBAGBQAACAMDKS4uLzI1Ojs=","grubbin":"e3FrZWBcWFZKNSggGRIMBwIAAAApHx4eICk3SGtsb5U=","grumpig":"SUlFQTMuLi41OSQWDQYBAAAEKSYiHx0dHR4hJi8+OTk=","gulpin":"vq+km5ONh4NmSz4zKyUfGxYTEA4MDAQAAAACFx4nMT8=","gumshoos":"t6+oop6alpOSkZGKhH98fHx8eGpRUVMDAwMAAA4zdnk=","gurdurr":"DggEAAAAAAAoMjMzMzU5Ojw/SE1QUll9cWxlX19gYFw=","guzzlord":"urWzCAIAAAEHBwcEAgICAwceHyInLTc/Pz08PD08OTk=","gyarados":"a2gyLSkEBAAABAAACQkODw4ODQgIR0lTVVtns6+vw9c=","hakamo-o":"ZF1ZWVkpHxsaGhQQDQoJCAgICAkNEBQbEAkFAgAAAAA=","happiny":"sqWclpGOcmtpRDk3MCgiGQ8JBQIAAAACBQoQGCMlJy4=","hariyama":"KygYDAcHCBEYGx4jBgMBAAAAAAEICAkLDxIREhp4jaI=","hatenna":"trOysrO0ta+ppJ2Yk41kVk5IRAYAAAACBgwWJVxhYWE=","hatterene":"3Mi3p3lmXFZUVFNNR0I/Ozk4ODUwLygLAAAjIyR+UlY=","hattrem":"raFqV01EPzo3NTMyMTExMjM0Njk9QhQUBAABBAoTIjM=","haunter":"Z2ViYV9dW1lHR0lFRRcPCAgBAAAFJWp2b21tbW1vgIM=","hawlucha":"AEk8NC8rKSgoOEBDQTozJwkIAAAACAgIAwgIHTg4Ojw=","haxorus":"HhYOCQUCAAAAAAIECBBEOi4jICAgJi4sLC43KCEhLaw=","heatmor":"UEY/ODMvLCkoJiYmJigoKCYkIQgEBAQFAgAAAAEHTMw=","heatran":"VU9KPzEvLy86PTkpJiEeGBMQDw0FAAACAwEBA4qQk5M=","heliolisk":"MyUfHyAjKCYmKDIqHx4fGxQAAAAILCsqKiorLC9DPj4=","helioptile":"hnx1bWllY2FeWlhWVVUAAAUOFBkeIiYqLjEuLi8zNjU=","heracross":"Tk1MSUZGWVxKSkpWWldVVVFLRjYmDAgEAQAABDw7wM4=","herdier":"MS0pJyAfCwwPEhIaExMLCAQCAAAlIyUpKSpJTENCQmw=","hippopotas":"ZGBeXV1YWFhJMighGxcKBQMBAAAAAQQICg0RFh4oOJw=","hippowdon":"NTIyLy0sLC0vM0JDSUlLSykHAgIAAAESIR4MAgIcHEE=","hitmonchan":"nxUHAgAAAw0/XWxzfH9oaGZmbXZ0dHd/iYyNh3pycnM=","hitmonlee":"My0pKCYmIQsCAAADLC8zNzs9Pj9AQEBAQEJDRkhIRUU=","hitmontop":"MiMcGBEMCQkjIztETjEYEQ8PBwIAAAACBw8YJDM+QEU=","ho-oh":"FAoJBwcHBwgKCw0QExgbJCoyPEVQTiMLAAADBQgMFRY=","honchkrow":"BgYHAgAABAEBAgwbFRMTLCxDQ15ed3+KkI55c3N3lZU=","honedge":"amdmXFdYV1ZIMhYJCA0aISUkIiIfHBgUDwgDAAAOExk=","hoopa-confined":"JR4VDwsJBwcAAAgLDxQbJzY4PjRIT15hd3JydHRzc3Q=","hoopa-unbound":"jIB4cTgwLCwtREdWAgAAAAIGSz84HRwcH1NTVlxUVJY=","hoothoot":"NTc6PkJGUUhBPTg0MjAvGwoAAAU1OkBIU1paaVZSUlQ=","hoppip":"yMTBqyYHAAAJEhs/Pzw8Ozs8PT49PDw8PkBERUhfYGI=","horsea":"V0xFQDwBAAAAAgULR1RpbmZaUElEIxUOCwoKCgwQFiA=","houndoom":"IRcSERERFBs3ODYyMTEzODk3NjQyMC0nHBcUEQUAAF8=","houndour":"MycbFAkAAAEEDxkrLS4wMDExMzY4Oz0+PzU1KykqMlo=","houndstone":"TkhEREVGTU5OJh4ZFRUVFioMCAUEBAIAAAEIE1RQUFM=","huntail":"zc7SlpApHBYVFRoiKCgcFQ8LCAgIDA8LAgAAAgIBAUU=","hydrapple":"VEAcFhcjKScnf2lWST86OTk5HwoCAQAABwkMEBkRBQU=","hydreigon":"xLMeIR4eHgICBg4AAg4YFhYVCgkJCwshJWNofH1/g4s=","hypno":"UwsGAwAAARYXFxgYGR81OTxGTEc9MykkIyIjJywkGxs=","igglybuff":"gn1uY2BgUkE1KyIdFxQREA8PAwACDBofJi45RlJQUFA=","illumise":"KiwuNDEnIR0ZGBgZAAADCRETEhMXHkhIR0dISkpKSkw=","impidimp":"KyMdGBUTERERERMVFgMAAAUOHRoZGjo7PUFHU6KipKg=","incineroar":"j4mJgoKGdD02IBAFBgYJBwcICAEAAxERBgMDB0pKzs4=","indeedee-f":"PB4UDw0NCAAAAQhCTWVYGxgWGk5MSkpLTVFYY2xwb28=","indeedee-m":"JhsTCAIAAAAFDBYuMDtTPCckJCssKiosMDY+Sk9SVVs=","infernape":"dmhHQkA8KysrLC4xNTYqJhkTDwwGAQAAAAMFPj5ioaE=","inkay":"YVVLQTgwKCQkKSwnIh8cGhgYGRwjLSceFQkEAwIAAGE=","inteleon":"j3xvZS8uLhMTFyQoPD1SUVFRSEE7NTEvLz9PTEY7BAA=","iron-boulder":"WFVTUVBOTEtIQTIwGhohHRwbDQ0OEQ4JAwICAgAAADE=","iron-bundle":"dHV3bGxwd35+fX1URT4zIxoUDwYCAQAAAQQKFBokM28=","iron-crown":"PmJ1fIeHjIyHhIE9GxshJSIYFhYVEQ8NCwAAAgICC1U=","iron-hands":"GxYWFhYWBQIAAAABBAwZNS8oJSUlJyovMTI1ODo0MzQ=","iron-jugulis":"NTUTExYZHAMDBQ0EAwQSIyoTEwQEAQABBwdhZGmPj48=","iron-leaves":"AAEJERgdHBwcIzUzMCsbFRUWHicoKDg+P0VJS0VGUEw=","iron-moth":"whcYGx0gIyYpKy4xOCsdDgEABhktKiUgHBcSDQgHCLg=","iron-thorns":"RTIvLi0tMC8tLCwrBAICBh8iHBMQDw8PEBUMAACUlJY=","iron-treads":"UEE7NjEZFhcjIBwAAAABAgMHChAQEBESExUaHCAiKDM=","iron-valiant":"R0VDQjwzJycmHQAABAoTHSEkHhoWExAOCwoKCgoMDRE=","ivysaur":"aVdVUU5LSQ4JAgEBAAIGDRckLiEYGBkbJTw7OTk6O0A=","jangmo-o":"MCQeGBQRDw0IAwAAAAMGCxIbK0Y/Pj49PUZDPjcqKDo=","jellicent":"b3FoUEM8KyIcGRcXFxcZHB8lKzMbFgkCAAAABAwtNWI=","jigglypuff":"OTUzMS8uLSwrJiEdGxkXFhYKAAACCRUhJSslHBsbHJA=","jirachi":"dnBrZmJfXFVCMygfGBYSEhEREREREREREg4HAQAKEWY=","jolteon":"aVdHPTYwKhYPBAAAAwkSDw8XFxcUEhIuMDI0MjApKSo=","joltik":"fVxZVkw/Ozk3MismGRQRCwkICAAAAgAABQcIC1u2t8g=","jumpluff":"RT81LyooJycpKjE4SlZBMCMaFREPDwAAAAUCAgMHDxk=","jynx":"Zl9ZVFBMSkhGRENCFQUEBgAABAQuQDYwMCUWERAQMz8=","kabuto":"UkE1KiMcFhIOCQcDAgEAAAAAAAMIERIPDw8PEBEUGSI=","kabutops":"T0dBPDg2NTU1Gg8NCQMBAAAAAAACBQwUITEvMDu4trY=","kadabra":"RUU2NkpKSktOUExLSjMlHBYRDw4ODgMAAAAFDDYzMjI=","kakuna":"RTAhFQwFAAAAAw0aFxUVFA8PExsbHB4hJSw1OD1DSlQ=","kangaskhan":"cGtnV0Q/Ozg1MjIyNkxWUwkICAAABAgNFSwbEA4PH5g=","karrablast":"hICAgIiCdmdTRDgwJyEcBAAAAQYQEBARFBkdJigsMjw=","kartana":"SkI8NjEtKgMAAw8aJScoLTM9XV1STEpHREI/PTo3NDI=","kecleon":"OSIiIyUmJiAaFhMODA0dLEMyBQAAGk5QUFBQUlhhXFw=","keldeo":"VxsVERAJCAgFAAADCA4VHSIiJT87Ozw8PkRAPDg1MzM=","kilowattrel":"2MOypZqPhXx0bm5ucHJyc3NzcnEgGRURDgoHBQMBAAA=","kingambit":"VVNQT05OTk5OT1BTBwcJDBIdAAEMHRkRESkpKjQ4MzM=","kingdra":"d3VWVldYT0c/FgAAAypXdn1/f4CBg4aMl7SysrKzt70=","kingler":"op6al5WTkpGRHBcSDwwLCw0PDxAQEBIXHiIcFg8BAAA=","kirlia":"ICAkKjE0MSslHxkUDw8eHh8RAAAKHGJlaGpsbXBzeH0=","klang":"GBERExUSDgAAAAAEFhkYGBgjRktNRj8/QUVKT3J6enw=","klawf":"sbCwsLJ5HhkVEhAOCgkCAgICBAQMEA4OCAQDAQAADQ8=","kleavor":"JSQjAAACBggJCw0PExYZIigwOTcxMTU6Pj45LSoqMaY=","klefki":"pqGhoaYnI4B5dG9rZ15ePTgyHw8LCw5pW1JSAFFRUak=","klink":"IRkVFRcbGRYRAAAAAAEGHSIhHh4gLWxsbnB0kJeXl5k=","klinklang":"JSEhIiMhHRQUFBUWJCcmJSYuBQIAAAAABBUsTGVsbG0=","koffing":"DQoFAgEBAAABBhMRERIXLikoKCktMzU4GxUUFBISFBk=","komala":"NCokIB4dHR0gKCw5OSMVDAYCAAAAAAMGCg4TFx0iKC8=","kommo-o":"OjQwIyEhIiczMC8uLCgmJSQkJiUYEwoEAQAAAQMGEy8=","koraidon":"joV+end1c3Bta2dhOTlAT09USkdKU0VFEAUAAEBKRkQ=","krabby":"pCwpJiMfHBkXFRQUFRUWFhYVFRUWGRsbGxsYFAMAAAA=","kricketot":"FgoEAgIEJicsIRgTERERExAKBwAAAAUIDRMeFhERGJU=","kricketune":"Ix8cGhgXFxcSDgoGBAIAAAACMyojHRkVExISQTs6Ojw=","krokorok":"OTEqJyQjJCo6PDIpIyAgICkkHhgTEA4ODhMcEwAAC3E=","krookodile":"WFZVUUkeGBINCQYDAQAAAAABAgUIDBIYHx8fIBwTEh4=","kubfu":"a2FYUhQODg8SFhAGAAAVFBMTExUZLzw1MCwoJCEPERc=","kyogre-primal":"nZePNB0ODAQAAAEKEBkiNTAtKikoKCo7d3h7fYGFiIo=","kyogre":"HRALCwIAAAEHCQ4UICglIiEfHhwcHB4jLEZ4f4aNmp8=","kyurem":"zbm0r6ypTEQ7PEQ5MAwJBgUEBAQDAAAAKytjV0lIS6M=","lairon":"dT82LyomIh0WCwYEAgEAAAAAAAECBAcJDg8PDy5zc3Q=","lampent":"QD8/P0FEQDctJh4WEAoEAAAEWF5QQzoyLCcjISAgIic=","landorus-therian":"ZF1YVlJPT08RBwEAAAEJDgoJCQsWHB4eHh8lMDs7Pj4=","landorus":"aTAYEg4LCAcGBgEAAAIMEBQYHCEkJCkqMDNHT2p/dnY=","lanturn":"VlJKRjEiGxYIAwAAAAABBAsvLi4uLzM4P05WU1NTVXg=","lapras":"YFVUVVBMS0tMYWtoZGBcV1JOSUVDQUAsGRAJBAEAAFM=","larvesta":"bWloaGpkXl1dCwwQERALCAYFBAMCAAAODQsAABQUJ0Y=","larvitar":"TklFQkA9OzksIRYPCQUEBAQGBQAAHRUMCAcIDgsLq60=","latias":"Lh8RCQUFBw0TGR8lKS4yLw4CAAAxMjU6ODhFc3NzdHU=","latios":"YF9fX15eXl1dXV1dXFxbHxsWEg4LBgQBAAAACH14eHo=","leafeon":"4DAhFgwGAgAAAAABAwcMEhwfLTkuICAmQUAsLDk1Li4=","leavanny":"SkVEREE+Pi4mJiYuPEgnFQkEAAAAAgYLWF9kbHSAhIE=","lechonk":"bl9SS0U/OxUMBwQCAAAAAh8eHRwcHR0eHyIrPzw8PIA=","ledian":"ekE0KyIbFRUVGA4KBgUFCA4fFQMAAAAGGxsjb3Jyc3c=","ledyba":"a2ReWFVVVVZKOTIOBAAAAAMNJCw3GhYVFRgmNTU1PJE=","lickilicky":"W1lZWlpST0c6MCchHRoaGg0CAAAOHh4fIiYrMzw/QkQ=","lickitung":"TEM+OTYyMjIiFA0KCQkMHBcRDAgFAgEAAAABAgcOJSg=","liepard":"BgMBAAAAAAAAAiEhICAbGxwfIyszNz05MislHhoZGRw=","lileep":"PykmJhsNBQAAIBUPCggICTg4ODtkdHdvY0pGRkdAP0A=","lilligant-hisui":"BQIAAAABBQ0XKUtTSDIlHh5DRUlOVFdWUVFDQkNOXmA=","lilligant":"nERERUlQV1FPTkIIAAAABA0dRDctIRkRDQoJCQoMTFQ=","lillipup":"JyIeHBsaGhcIBgcNFR4dHAAABQwJCSEhOk5RVFZWVl4=","linoone":"8ezmVUY6MR4YFhUUEQ4LCAUEAwICBAIAAAAEHBsZGRk=","litleo":"Ih4bGhobHCAmKykmJSUlJikuMzw5BwAAAAEFDBlOUVg=","litten":"3M/PzM/o3su5hiIhIB8fHx8fHx8gIiUOAAAAARh7c3M=","litwick":"dm1kXFVPSkhISElBKhwRCwYDAAAAAAMGChEZGBgkJCc=","lokix":"QDw4NTMzPj46NzUzMi0pHhUHAAEOESIeHiAkKS0xMC8=","lombre":"ZFNDNzY3HRkUEA0LCQgICAkOG1FGOzIoHhUNAgABCkM=","lopunny":"TkxLSkZAOzczLichGxcTDw0JBwYBAAAIFGhqdn2BgoE=","lotad":"dV1PQjYtJR0WEAwIBAIBAAAAAQIFCQ4WIjY4ODg6QZM=","loudred":"oiANBgEAAAACBxA4HBYQDg4QFRwmNklGR0RDQzs0NDY=","lucario":"aDY2OD5ETExDQ0ZGSUAxFhYUDw8aIyMkKSkkHhAAAAM=","ludicolo":"l5hVMS0rKiosOSAQBAAAAQQIDxYVCgMBAQMJElRic3U=","lugia":"yLu2tlRJQDgyMTE7P0QjBQEBAQAAAAADCg0feoWSk5U=","lumineon":"GhYUEhAQEBARExUZHiIeFhALBwUEAAABCBAcHi0sLC0=","lunala":"wL29vSwhGhQQCwgFAwEAAAAAAAEDBgkNERYcIis0P00=","lunatone":"QC4fFhAMDBA/SlFXUzshGxsbKkFDOAAAAQQJDxYfLD0=","lurantis":"g3k9ODMvLzI3JCMbCgoSLiohHxoXDggDAAAVFVZdXmI=","luvdisc":"hXRnXVROR0I9ODMtJR0SBAAADBYfJy40OD1BRkxVY3Q=","luxio":"Pz4ZFRIRERESFBccGRIAAAccNTU0MzMzNDQ1NTAuLjQ=","luxray":"GxcVEwEAAAAAAQMEBQcHCQ4PMzU4O0A9OTUxLCEWFhY=","lycanroc-dusk-form":"UjExKiUhHh0bGQAAAAABAwgQQ0FAPz07OTk5O0GRlJs=","lycanroc-midday-form":"wrq2cG5qOzkUFBUWGBocGhQRERIPDQsMJDUsIgwFAAA=","lycanroc-midnight-form":"joJnX1pOSUhIRTw5OTk5NxIRDw8REQYFBQQDAQAAAAg=","mabosstiff":"JR8ZGBEDAAAAAQMFBwsLCwwOEBIVHSYtMzg3Nzc8Rkc=","machamp":"HBANDQ8SFBYZGyAvFwkGBggKERtGOzQwKCAfHhoPAQA=","machoke":"XlhHRUVMQjQfFAYFAwAAAAMEBAsgHRwbGBgZHBQBAAE=","machop":"kIuHgns8IREKAgAAAAgdPUJSQT84MzMzMzQ/bmlnZmY=","magby":"IhYQDQ0ODQ0QAAIQFhgaJGJeWFJPT1BUW1FJRj8+VFU=","magcargo":"7OXi3to0KSQhHxgTDg0NERISFBQYKychFRELBQAAAAg=","magearna":"LCQkN0xRUEhHR1BORQAAFUE3MColIiAgICAiJis0XF8=","magikarp":"fndPT09RTz8kFw8JAAAGCwgDAwMDAwYLEBQYGhsYF1w=","magmar":"fHp1cHBuaWhaWlxOBQQEAAAACQkJCx0hJSsyPz8+Ozs=","magmortar":"CgMDAwQIFBQWHBwfHBkZFQ8KBgEAAAMEHhcMAgAMiZM=","magnemite":"bGVeW1paW2BrZWBcWFZTBAEAAAEEBwoWHxsXFxgbHiE=","magneton":"NjMlGxgYGyIqMQwKCAgYAgAABBUuLzMuLCwvW1tbXF0=","magnezone":"hoaGioqJh3FDQUFDNzEsKSgeHhQLCAcGBQcCAQAAAAg=","makuhita":"bmksGxIMBwQDAwMEBgkMEQsGAwEAAAACBgwUFxcXIZU=","malamar":"hIRnaXJWV1RUVE5FQUFBQkdNVFdOPSodEwwHAwEAAAE=","mamoswine":"e2tmYFlUUlJPS0lIEQsIBQIBAAAAAAEEBwsSHU9OUlo=","manaphy":"enBnYFNFOzQuKiclIyIiIiIjJSgsAQAAAAIGCxUyMjM=","mandibuzz":"Kg8AAhUkJjQoIBoZGBgFBgsLISIjIxgLBAMKCgoYGUE=","manectric":"TUlFQTk0LigjHRcXBwAABSckHRsbJiY6PT4/PzoxLTE=","mankey":"CwUAAAAEGBkbGxwfKzMyMzM2Li0tLjUiHx8fMpCPj5E=","mantine":"SEhISSYlJSUmJyosMTY4NzEeEAgEAAAAAQlOZK+0uL0=","mantyke":"Ozg1MzIxMDAwMDEyAgAAAAEEBgkNEhgeJi87RElQWWY=","maractus":"joeHiop/GxELAgAAAAAABB5VXDUzKiQkMDxaQz1CU1I=","mareanie":"c1paW11KFRYaISknJSMFBQYeHBsZFxQQDAYCAQEBAAA=","mareep":"KBoVFRUXEg4KCAcHBwYBAAAABAIBAQYLCw8ZGhwgKls=","marill":"ZV9bDwgEAQAAAAECBgsUFRcXHx4dHR0xMzg8WFZVVVY=","marowak":"NSMhISRFUV4TExMTEw4LCwsLCAUCAAABCTk4ODg0NbU=","marshadow":"TEdGRhwWDQYBAAACBAEBAQIIFCQbGx0RCwsMDhIwMTQ=","marshtomp":"gXZtZ2JdWQ8FAQAAAwoTHyoODg0ODxIUGx8oMklOhYk=","maschiff":"EgsIAwEAAAQEBAQGBAQDAgICAgIEBAYHCxUSEhIVI1c=","masquerain":"NjQyMS0mIh4bGRgXFxcYGRwfJi85GQAABwQEChxMeH8=","maushold":"YyEbFxUTEhEQEBAREhQWGSAiBwMBAAAAAQIGFBISEh0=","mawile":"cmtmY2FfXFtZV1VST0xIREA7NS8oIBgNBgMBAAACCQk=","medicham":"k4+Oj3dpYks/Pj8NAAAGO0xgWEk+NS4qKCgpLDZEY30=","meditite":"dnFoXU1BNzEsKikeFhEREREUGScNCgEAAAEJLztUWV8=","meganium":"WFNOS0pKS09UV1xwjXdtTzg4PAEAAAMDAAAAAAIFDUY=","melmetal":"PTk1Mi8uLSsgHBsbGAgHBQIBAAAAAQMGBwkKFklISUs=","meloetta---aria":"KyoqKy8zLCkpKioiISIrPUBJAgIGCxMTDQcCAAB/f4E=","meloetta---pirouette":"GRkHAQAAAAMNMTU8QkZITjw8RCwOCAgLHVFRWGd6eHY=","meltan":"YjYmIh4bFRIOCwgFAgAACBMfKjZBQD9BSSIVDgwJE08=","meowscarada":"XFlYVlZWVlNTT08LCQoPEgEAAAgHBwcLZm1ubGpeV1c=","meowstic-f":"BwQBAAAAAAEECA0UGhweJCsrKygYFRcrJycsPUJITU0=","meowstic-m":"U1NTU1VXWl9kaioYDggEAQAAAAEFDhAUFhYZGx8lLnk=","meowth":"XFw8OzoUFBolNBQfP0ZSOyYVCQAAAjYnFhAQFWBcW1s=","mesprit":"W0c1JxsRCAMAAAAbREJBQUIkIyQlKjM1N0FCREdKT1Y=","metagross":"YFlBPDg0LysoJiMeFhIRDgwKCAcHBwgCAAAAAAEHCxI=","metang":"YFgvLjE6OjIuLCwsJyMfGRQPDAkIAgEAAAAABg4PERQ=","metapod":"LigkIh4aFhENCQcFAwIBAAAAAQMJEiAkKzI9R1V0jaM=","mew":"U0c9NCskHBYQCwcDAAAABBZ2c3FxcXFxcnN2eHyCwMI=","mewtwo":"hYaAfHpLSEhMNAwFAQAAAAIECAwRFhwjLTlaVlBKQ0I=","mienfoo":"gn92bmllZGRkXV1BJhsVEhERFywQAAEIEykvKSAXFBQ=","mienshao":"SENAQDs7PEJNQD42LigjIR4cGRYSDgkEAAAOPz9Gk5M=","mightyena":"CwkIAgABBAQFAAACGBYcKCgoKCotLzM2NDMtIh0dMVQ=","milcery":"dwQBAAABBSQkJSktKSgoKSsxP0dJSyYjIyMlKC03WV8=","milotic":"a0caEA0NDQ8VHycwNjxCRyweFA0HBAEAAAABAwcMFiI=","miltank":"Dg4RGiotDwAABAkPFBsjJicoKSstMTQ2OAUEBAgYICw=","mime-jr":"IiEhIi0xIyIjKSceGRcXGBUQDw8PEhxMAAADaGhwfI0=","mimikyu":"dnZwZ2NiXVlWU0g6LygoKCgsLzU6NjEtKSYjIQUFAAA=","minccino":"DQgFAwEAAAAAAAECBAYJDhUeKCgpLi4lJCQ1MzIzLy8=","minior-core-form":"UlBMQj49NzAqJh8TDwIAAAYJChAXGBodISYtNz1ASFA=","minior-meteor-form":"UlBMQj49NzAqJh8TDwIAAAYJChAXGBodISYtNz1ASFA=","minun":"GRMPDAkICAcHCAkMDhIZGhYSEhMKCQoPAgACBQcKDQ8=","miraidon":"dnRycnJycnV5fGxhXVtbXF8AAAYRJ2Rnc3lrZmRkZm8=","misdreavus":"UVBQUFBSUE0oHhsZGQAAAAMFDiIiJUI/ODMzNVRcXV4=","mismagius":"cnJlWxkZHSUbDAIAAAYVKy9samRdVE1NUVBRVmBqa3g=","moltres-galar":"s5uTJQgCAgIBAAEFCAgRFBwcHSQgHBwcNUk/PT0/Zmg=","moltres":"9j49PDwSEhIFAAACCw0OHCkpLzNAQ01SZmVlYl9dXWQ=","monferno":"AgAABAsDAQEeJSssLC4wMztDSFlcWDMWDAgHBwkKI3E=","morelull":"jXxuYVpSTEkPBgAAAAACBg4aQT4+Ozk5OUFVcm5kNTU=","morgrem":"rVVVVickJCQkJScsNkktFQcAAgoNGmEkIikCCCc+MDA=","morpeko":"BQMDAwQHAAAFGRYUExMTExUWFxMQEBATGBgYGRsiJSU=","mothim":"DgQBAAAAAAEBAxMVGBseIiguNkVFQkBAQDc3Nzg7Q4k=","mr-mime":"EQ0BAAALEhQYFhUUFBsvMTVFRkE/OS4iICAjHhsbHCM=","mr-rime":"FwsDAAAdHQkFBQgYN0BAOTUzMjIzNTo5OTolIB8fHyA=","mudbray":"BwUFBQYICxAJBw0QCAEAAAMKOjo8QEVLUlhUSklBQEA=","mudkip":"TEVBPz09PT0+P0E8LycgHRkAAAMHBQICFho+QEJDQ3M=","mudsdale":"p52RioR8eHh6QzAtJSUeFQ0HAwAAAAIMGRoXFxgXFhc=","muk":"YltWUk5LSEQ+OTQuLCopIxoSDw4MCwgEAQAAAAIJCww=","munchlax":"U05LSEVEQj40LywqKisuND0oFwYBAgYJDwoAAAYKH1U=","munkidori":"UU8xKh4TDQIAAAYPExgdIigmIiAdHR0dHiUtKiojGBg=","munna":"XUw/NCwlHxgUEAwJBwQCAAAAAAACBAYKDhQbIisuMTg=","murkrow":"ajczMC0rAAAGEiAYEhAQEhU2NS4rKSkpLDE8UFE1Kyk=","musharna":"nFxORkVBNi4nIh4dHR4oHBMLBgMBAAAAAAECBigpLjU=","nacli":"f3p4dHBWUUQ8NCAXEg4LCAQCAAAAAAACAwUIEBsmJic=","naclstack":"JyYmJiYmISEhISAgICAhIQsAAAAAAAAAAQEBDBJZWFk=","naganadel":"pJGPgICBgYB+fXBwbmRgXFhUUlBNTEI3LiMZDgYCAAA=","natu":"yLito5pZSDw0LiohBwAAAQgUIiQoLDM6RVRYPi8tNVI=","necrozma":"ent+bmdoVk9LSyUkJCQjIyIdFxcXEgsFAAAAAgQGHWo=","nickit":"zcqOjYyMjY6PkJKUl5qZmTcoIBsWFBMTExAQBwAAIiQ=","nidoking":"KysfISYpKy0jIxgLBgQBAAABEUM/PDs7Ozw4MTE2m6Y=","nidoqueen":"aWhcVlRUV2JtcWVXTzwdFxUVFxobMwAAAgYMFCEdGho=","nidoran-f":"WBwZFxMRERESDAYBAA8PJikoJiUlJSYmKCkrKSYma2w=","nidoran-m":"VE1FPSUlIyMjIhoUFBUYGx0dCgAADAwMDxIQBwQEPz8=","nidorina":"blRTU1NJSUpPVVxbJSUmKSEhAAAAAgUJDxUXGBodHx8=","nidorino":"DQsKCQcFAwEAAAEDAwQFBQcTHBsaGhgOCAgUDwsLM6U=","nihilego":"UD00LCopKS0rEBAQFjs4AAABFBQOCAUDAwQIVlZWVlk=","nincada":"Yl9dXElCPjs5OTg4IxkSDQkFAwEAAAAAAwULFhdNTno=","ninetales":"WUo+LCMeGhgOCAUDAwMEBQgNFAcCAAAAAgcQJCs5T6c=","ninjask":"AgEAAAAAAAEBAgQFBggLEQ8PERQaHCMREBAQERIVG1Y=","noctowl":"GQUCAAAAAAMEBQUGChQQCQUEBAUIDRciMkNTIhYVHE0=","noibat":"k2xfVlBNTExMRD45NjY2NzgAAAACBAgPGCQ5ZWhoaWw=","noivern":"WFASDwwJCAUEAgEAAAAAAAECBAcKDhIWGxwcHBxItLQ=","nosepass":"HBQJBgUEBAMCAQEAAAAAAAAAAAAAAQECAggOFhcYHCg=","numel":"OjAiFAoFAgAAAAIECBEdPkVISUpLS0tKSklKSk1RWI0=","nuzleaf":"jCoqKy4wLBEGAQAAAgQHEBMUGDItKSgoKCsuGRQSE2s=","nymble":"KCAaFxUVFRYYGwUBAAACAwMDAwUGCQ4XHx4dHA8PbGs=","obstagoon":"W1laUUooHxwcHBwcHCAlLCsoKCglHhgOCQkIAgAABww=","octillery":"Y2BfX19fW1hYWFhZW11fYmYeFg8HAQAAAgQFBgcLGy0=","oddish":"HhwaGRgXFhYWGBofJh0RCQQBAAAAAwgOFxMQDw8QFEI=","ogerpon-cornerstone-mask":"LyUgHQ0LCgEBAQAAAgIHLzo/QRwXFxcZH4KAenBra2w=","ogerpon-heartflame-mask":"RCcgHBkYGA4AAAIQEBATHEVKTCokJCQnK4mGgnlzc3Q=","ogerpon-wellspring-mask":"fUYWDQgEAQAAAAEECA4UFz9ARBoXFxgaIoKAenBra2w=","ogerpon":"TzgzIB8fDAoKCgsEAAAMCz1JSzUjIyMmKomHgnhycnQ=","oinkologne-female":"mp4UCQQBAQAAGhkZGRofIygtMjlAR01SV11jaGVgYGE=","oinkologne-male":"qJeIfhkZGRAFAgAABiIhISIjJSgsMS0tLTA0Ojo7QXw=","okidogi":"0HVUU1NUUzMvLi4FAQAAAgIEChEhQ0FBREdLTUlFRUY=","omanyte":"NCcdFhALCAUDAgEAAAAAAQIDBggMEBceJCQZGSEtNU4=","omastar":"cHBwb2RcTk9MSUZFQwAABAUFBAQEBQYIDRYlAAABBi4=","onix":"Hh4eHR0dHBsTDAYEAgEAAAIAAAMLFIeHf3t4eHp/j5o=","oranguru":"Rj85NTErJSEbFBIMCAcHBgAAAAIHJSEeHh4eISQuNzw=","orbeetle":"V0I0KB4XEQwKBwYAAAsSGw0DAgQ+QUNFRUZIRkI8Ork=","oricorio-baile-style":"raalj4R+fnRraDkrJxUJBAAAAAcJDx4sTXCBiIJ9XFw=","oricorio-pau-style":"e2tgXV1fZREQAAACAwM9R1xpZF5YU05GPjY2OU6Ae3s=","oricorio-pom-pom-style":"HxIPCAMCAgEAAAAEBQYLFh1MTVFbdn2Ff3Z0dHRva2s=","oricorio-sensu-style":"IBgWBQEAAAYDBAksLCwsLCwtLi8xMzY5PEE5NDIyMjQ=","orthworm":"HhMNBwQCAAABBQYIDRMzNzxCSk9PUFFTVlpfYmZrcn0=","oshawott":"US0iIB4eHhwbGxscHyUrLS0YAAACDC0sLC0xNTsuKys=","overqwil":"dHNxcG5tJSUqLzQ5Ojo5IgAANC0mHRYQEGRlZmdoaWo=","pachirisu":"vrq1kpCNhntzIx0aFhQSCgUBAAABBg8cJCQlJCMeHlc=","palafin":"aF5YUzksIxoWEQ4KBwYFAwMDAwMDAwUGAwEAAAABJMM=","palkia-origin":"X1tYVlZYWFlcYWdtBgYAAAIGDQ4dWFhWUlBQUVSYmJo=","palkia":"AwcAAAAFCzAuLCsUDwwMDAweIRwZGRshKh8YDw6EhIM=","palossand":"e3l3d3dybWdkX14ZFAkFBAEBAgUKEBUZHB8fEgQAABY=","palpitoad":"VUpCPTktHhUOCwsLDRAWGxYIAQAAAQkLDA8UGiMeHiI=","pancham":"WTw8HgwGBAQEBwsLCwsAABAoKygoVUZBNTAwNouYmJs=","pangoro":"i3hZRUEYGBkaGDgFAwICAgACAhJGPzkzMzMzNCwoKKk=","panpour":"alhUUkE8OjYrJyYlJigqLjQ8SXtWMBwbBgAAAQwPR1w=","pansage":"V1I8NjU1OUgLBgMBAQECBAgNFwUAAAINNldMREFBPz8=","pansear":"e3Fsa0IVDQcEAQAAAAADBgsSHiw2SD0zLSkmJSUnLFs=","paras":"Qz46ODY2Njc8TzglGhQOCQcEAgEAAAAAAQIFCQwUjIw=","parasect":"hHp0bmhhW1JFNywlIiIfFhEMCAUCAQAAAAABAgQHDIM=","passimian":"v6+knDAwMDEgDg4EBAoMDg4ODg8PDxUhDgQBAAAAAQY=","patrat":"cCgmJgoCAAAAAQIFCQ4UHCc0QkRFR0Q+Ozo6Ozg2ObU=","pawmi":"qQ4JBgMCAQAAAAECBQgMEhgTDwsJBwYFBQUGCAsPFhc=","pawmo":"bWRdWVYbGRMREBAQERQYHCElHBMMBgMBAAACBwomWVs=","pawmot":"e3JtaGZmYmJiYV1ZWFhYHQ4HAAABBQ1YWFhZW19mb28=","pawniard":"mI0AAAUMFR4nMjxDT2F0hIOBgH9/fnlzb2xpZl9cXFw=","pecharunt":"39fSw7SsFhQUEw8KBgMBAAAAAAEDBgoPFyQ5Oj5Gf38=","pelipper":"bGdnaRcKCiMBAAABAgMFBwoOExggJy4pIx0YFhYawMU=","perrserker":"UFJbWVdXAQABBAgMEhceJykxOzw1NTs7O01ST0lAQEE=","persian":"kJCQkpaZl4eGhpCQhQ4HAgAAAAABBAkQLi4wMjQ1Oj4=","petilil":"Qz88OwQEBgoQGSMxOigZDwgDAAAAAQYOHhMQEBogJUM=","phanpy":"GA4JBQUFDBIFAQAAAAIHFDw5LyUWFRYXGR0pb3Bwdng=","phantump":"RhoOCgkJAwAAHBwbGxwgKUJIS1NnZ3dyW1dXV1leaXQ=","pheromosa":"S0E5MiwnIh0ZFhMQDQsIBwUDAgAAAAAAAAIDBQUGC2U=","phione":"KCIWDwwLCw4RDQkHBAIBAAAAAAEEBwwVIxsUDAUCAgI=","pichu":"AAAAAAABAQECAgMDFyAdHBwcHyMYExQeMzU1NTgtKSk=","pidgeot":"twAABAkMExgeKDEuKipVYWt2gISCf359fGdUQzQxM0Q=","pidgeotto":"Dg4FBQUEBQYICAwVFR0gJzM7OjIOAwAAAx0dWlpaXG0=","pidgey":"PSEdGRcIAAAKEA4PEw8MCQYEBAQECBAeKDUpFhAQJTU=","pidove":"CwsLDQ8AAAEEAAABBQcHCxISGzg7P0RLVmd4WVJSWmg=","pignite":"XlxaWlpcGQ8JBQIAAAACBQoQFRQTExQYGRYUFBYbISg=","pikachu":"MCsoJSMiIiEhHRcUERERExcVBAAAAh8zNTY3ODpATlE=","pikipek":"uVZTUlBQUFBIQDk1MTAvIRQFAABcb21tSko7P1dnamw=","piloswine":"cmVeV0E2LigjHx4bGhkYGBgWEg0KBQIAAAkMCgoKDRY=","pincurchin":"goB/fn17NjY5OwAAAwkPFBshKC00OC0hFhQkPUJKSUk=","pineco":"cm8vHA4ODg8KBAAAAAoTDAgICxoUFBUxKyYlJytMbG8=","pinsir":"h4qMPjc0EQ8AAAIHERMYHiInLTdJU1ddV1NSSUFBSm4=","piplup":"UEAyKiIeGhgXFxkbICgBAAAEBw0KCgwjJCcuOT9DTlo=","plusle":"OSsgFg0HAgAAAAIFChETEA4ODhEXEhIaKT09PUBDS1Q=","poipole":"lpGMg2ZPQTQAAAIBAQIECxMfMVlXU0pJSUxVZnLl6/A=","politoed":"dnNzdoBxUkpFQwoBAAAOFBojU1BBNCsnJygiGBgisLA=","poliwag":"KB0WEQ0KCAUEAgEAAAAAAAEDBQgNEhkiMTIzNTc6PkU=","poliwhirl":"CwIAAAABCA8dIy0tKysqKisrLS8yNz1ETldAODc3OY8=","poliwrath":"YFlWU1FLRUA9FAkFBAQBAAAAAglYVlNQTDoyLy8wOKw=","poltchageist":"hj42MjIzLSsrKCMgHx8fICAhIyUnKRwbGxsIAQAAAg4=","polteageist":"bGxaUkxFREZODAAABxEYGx0dHR8jKC88RUNDRVFhaKE=","ponyta":"eDMgGBIREBEIAAAABTAwLi4tLCssMDM1ODk5NjMuKys=","poochyena":"ISAgICEhHBcGAQAAAQQRFRwmNjUzMS8pIhsPDg4SYWE=","popplio":"dm5oZGBeOjQzMzQLAgAAAQULER1gYF9eXhwUExQYLLU=","porygon-z":"kYyGWkwxHx8nOUxWGwYAAAQQcXN3fYibq6iloqCfn6E=","porygon":"zcpMPzItKCMeGBMOCggGBAMAAAMdMC8vLz1wgaOjqLo=","porygon2":"gRkXFhYWFxkaHR8jJywyODs4MwwCAAAAAQIHDBMhZ50=","primarina":"gHVsYVxAQENNV1ZWJCQiFg4IBAEAAAACBhAfKSYmJis=","primeape":"SURAPT0+RBILBwQEAAAAAgcJCg0TQEZGMS4uLjs+Q0c=","prinplup":"TUtLS0tKSEdHRkVCNy8mHxkTDwsHBQMAAAAgICokIig=","probopass":"XVs+PDw8PT0+QFhPRikkGxMKBQUICAsIBgAAAAkOEh4=","psyduck":"enl6fjw3KyIcGBUVFRYPDQ4QGSosKgAABg4YIzNBPDw=","pumpkaboo":"aWJeXFtbVlBMS0tNAwAAAAEAAAMKGB8eHiAiJSoxOkc=","pupitar":"VVVZXGBjBAABDRklMDszKiIaEwsEAyopKB8VEBAoKy4=","purrloin":"0cKzppgpLjQ8QkhOUldRAAANFhscHR4fHyMnLjtZXWY=","purugly":"ICAgHR0fISEkKC0zCAMAABoGCBAwLi0tLS0vMTQ3NDU=","pyroar":"jQ4MDAUAAAADECBLTVJCQkJERUZIRkNBQUFCQ0RFRpQ=","pyukumuku":"ODc2NjY2Nzg4AAAAAAMFBwkODQwKCgoKCw0RFhwlMEI=","quagsire":"XFFJREFAQEFFSlBUVVNQTElFQT48DQYDAAAABAkSJDU=","quaquaval":"XC8pKCowMTwQEBEEAAAOHx8gJCUpNUNGQ0FAQD8+QT4=","quaxly":"VEI1LSYhHRoTCAgNGD09PT0+RVZHMwEAAgsjam5KMDA=","quaxwell":"XA8MCggCAAAAAwMDBh8lNzgmJig4WWJjUE1NT1FWbGw=","quilava":"OztETVZYY2JXTkVAOjQvKyckIR4cGRYTDwsJCAkHAAA=","quilladin":"NTU2ODs/CQcAAQUPFiMxMTM0GxsbHSEoZXR4e3+FjJQ=","qwilfish-hisui":"SEU9MQQEBggLDg4MCggICAgICAIAAQ8TFRMTEzE6PFg=","qwilfish":"YGFjZmNbVU9LSCwrMURERUU8NDQUCgUCAAAAAQMFChA=","raboot":"onV1d2RiZWxNOCYYDQQAAAQ2NjZCPz9Aa5SZn6Onqq4=","rabsca":"LCEgGREFAgECAwEAAAIHEh4oOTo/QEI2MS8oKCoqKzg=","raging-bolt":"Pj46NjYkGAkBAABRTUlFREJCQkJEPz09QTAwMC8hH1w=","raichu":"ERQWGAgICxsfHx8gBAAABBEdHBwcHR0ZFhUVFRYbLCw=","raikou":"LiEREREAAQUHBQULDQ8jNTU1NjY4ODEpIh8fHyIrKio=","rainy-castform":"bmZgWFFKQzs1LykjHxoWExISExYZHhUIAQAAAwgMLjs=","ralts":"FhUVFRcaEg0HBAIAAAADGCgyQjMpIyIkPjQqIRoUFCI=","rampardos":"eGhdAAAAAQIEBQgLDxIWGh4jKC41PD1mbGdnaGhoaGg=","rapidash":"oZ6KimpjJA4MDBFaKCgODQQDAAAMS0wkHRkZOD1QVFQ=","raticate":"Pjw3AAIICAgOBQUaHB4eFAwLDA4PKysuJB4cHCljY2s=","rattata":"lpWUlZedPzs4NjYXFx4gHx8gIhYAAAIBRkZHUmRdXWA=","rayquaza":"FBUXGRseICIQDAcCAgQYGB8bEQsFAgAAAAADCBIXFxk=","regice":"ax8ZGRweGxgYGR0gHBgSDgoJCQUAAAEGDzg5Sk9TWF0=","regidrago":"LSsqKSgmJAcFBQYGBQMBAAAAAwoDAwMFCAoNDxIUFyI=","regieleki":"hUlISEZFRC0rKysjIiIbFhQPCwkIBgYFAwMBAAAATk8=","regigigas":"bVtIQ0A/Pj4+Pj88ODYsJgsFAgEBAQEBAAAAAQI4NTU=","regirock":"nz87NjErJiQjIyUoJSUlJSEeGRQOBwAAAAAEBwx7en0=","registeel":"XVVPS0czLCgmJiYmKS4sKSIZEgwIBgQCAgAAAAFJSUo=","relicanth":"0MZrYVlTTjgwKSMeGBURDgsJBwAAAQQHCyIlOzs8QEs=","rellor":"NCkiGxYSDQoHBQQCAQEAAAAAAQECBAUHCg0RFRshKTM=","remoraid":"5NfMxL23sq0tJiIeHBYNBwIAAAAGDiA4WFxkb8DGz9s=","reshiram":"QzAhFQgAAA4dWlY1NTk4LSgiIBUSFR8tMTFkZVZQTEw=","reuniclus":"VlVUEhAQEBAPDAsHAgAAAAEOERUbJzhQUlRYW19lZmk=","revavroom":"endyb2tQSz0wLS0tLSYeFxMPDQAAAggNDxIXIC1fY3o=","rhydon":"ISIcHA0AAAAABwsQGCgrLi4uLiYhHBoZGRsWERAVh4k=","rhyhorn":"X1lXWFlVPzUnHxoYFBMSExUPCgoJAwAAAgkNDxIVF38=","rhyperior":"UFBQTEk/NzEuJhILBgEAAAEFBQc1MTAwMTMtKCgoNZ4=","ribombee":"HhwcHBwdHh8hAwIAAAgICAoPGB8aGiMbFxc+PDw8PD8=","rillaboom":"W1lKSkc6OjExMTE0MzExMC0mHxoVExAPBQAADhUREBA=","riolu":"NjMxDQgFBQgfHBoZGRkcIRYDAAABDoWHiIiIjI+NjY0=","roaring-moon":"iIiKixoZDQ0NBQYBAQAAAQAEBAoKFh4kKzlPWlpxcpA=","rockruff":"KiEaGRkZGRoPDwAABxMTISEqLCw1Pzs7O0VPUVFLSUk=","roggenrola":"T0xIR0dITFFWRTUsIxoQCQIAAAAAAAAGEBogDQUEBaM=","rolycoly":"WVRNTUA/LywdFRALBQEBAAAAAAAIDxIfLDg7SE1SWmQ=","rookidee":"e3t8fX94cm09PT8/QEFDAAABBw4WImZtdnZ3fXx4d3c=","roselia":"hIB8Q0NIS09TVFRUDgkHAgAAAAACBgwiW1xfY2hqbG0=","roserade":"VzckIygmJCQmLAgCAAADDSUrMDQ5VFRVWV9mbnV2dnY=","rotom-fan":"AQAAAAEDBQkOEhgfJi87QUNHS1FaUk1LSUlJS09VXWg=","rotom-frost":"aGdlZGNiYFtTAAABAgQGCAoMDhAYIy45OTk5QmRobHA=","rotom-heat":"dnNwb2lfVUxHQ0FAQEAuLCceHBwZDQcCAAAAAASko6U=","rotom-mow":"X11dZXKFhYUnBQAAAAMEBwkLDRATFho8h5x+gIiQmKI=","rotom-wash":"YmBfXVxKSEY8NjQzMzMzLCYhGxYQDw8QEREJAgAAAAI=","rotom":"SktLTExOT1BQS0dFRUVGSUI5MSghGBMTIRsWEQwHAgA=","rowlet":"TTosIhwWEAwJBgQCAAAAAAAAAgUICw8UGiItMy4sLC0=","rufflet":"QikjHBgIBwMDAAAEBAsNFxEEBAcHBwgRKjkXCAYGEVo=","runerigus":"TUdBNykgGRMNBwEAAAEBBAQGY2Njc3doVlYyMC4uLjM=","sableye":"aWZkYmBfXFtYIQ8HAgAAXGJqdZqKgH19f4SEhYW2s7M=","salamence":"eXl/JwcHCg8MCAQECREMC0NIRT8AAAQLFSEpHx8gk5U=","salandit":"jpSbl5KPj4+Tm6uyraBoY2FhVTcrJSIhISEeBwIAAAM=","salazzle":"ioaFhYeMkZeekXZnQUFNWA0GBjguKiorMDoAAAAGFiY=","samurott-hisui":"KCUjFhoqLCwYAAACBBALCwwnPzItKSUjIiAgISMUFDM=","samurott":"YwAABBAcICAmJipGS1NSX1tRTD87My8rJiQaFRWcpKY=","sandaconda":"i4B4cWRbVVBMSEVAOTQxLiwrKCQhIB4bEQQAAAssRVc=","sandile":"8O3q5N7UNCwoJSQjIyMgHx8hCAIAAAACBgwTH0uVlZ0=","sandshrew":"Dg4PEBIQDg0NDhIKBgMDAgMFCQ8MCgoKDA8GAACVmqA=","sandslash":"eVxGRkk5OS4uDw8SGhQUEgsLIhYLAgACPj4/QEJFSEs=","sandy-shocks":"hHh4eHs8MTEkJDYuLkBOTlhGOQcHAAANERspZnydmZk=","sandygast":"kI6LiIVyb25tbW1hWVNNSERAPTo2HBYUExEJAAABMDM=","sawk":"fXVxEBAQBgYDAQAAAAABBgsQGCA5LyYhHhsYFRAMDAw=","sawsbuck":"fXx/hYKCj4+Sk4iIkZZ/LhkRER8lJB0SEA4LCAQAAAc=","scatterbug":"dHFubW1tb2M2JBUMBQEAAAAECxMjGhovRUddWlpzhIs=","sceptile":"RUE+OztBTFhUUQ0NDxAUGAAAExESLzA1OicWExmCkJA=","scizor":"v2BOUDs8QUgkFAwJBAMDBEJAPC4iHRsaFhIPCQMAAMY=","scolipede":"GR4jKAACEx0lLEBAQEVTTExGQD45OT8/P0BCR01IQ0M=","scorbunny":"ZFlRTElGRUVHSk88MBYWAAAHHzIfHh91hpGbnJ6hoaM=","scovillain":"Fw8GAQEAAAIOExUVHFJEQkJCNSMjIBsWEQkJCxQofIM=","scrafty":"VEM7NTEvLy4lIB8fIScwKysdFxEEBAwUCwIAAgAABxw=","scraggy":"Z2Q8JhkQCAQAAAAABAkTIzpELyEbFxcXGhsaHh8gHBw=","scream-tail":"YTAtKigVFRUWGB4aGBUUEhISAAABBQ0aHSEdExERHHU=","scyther":"MjxGTE9OTU1gZWdpZ2dJR0VEQ0NEOTEpIRsVEAcAAAk=","seadra":"WUoIBAEAAAELIy80OkZOTU1NTU9PUFhfYGBgYGJlaXM=","seaking":"SUpLFBQVFhgaGBQODAwNDxESEggCAAACIltZWVlfnqE=","sealeo":"mZGMd3d4eHl5dGxjWVBJQz87Hh4SCAIAAEJJU2RxdHk=","seedot":"enp6elZCMyccCQEAAAIGBAMDAwQGCQsQFRwaGBgYIIg=","seel":"c25oZGNjZWZnlI+Jf3VrYlxYVkxFQDwcDggCAAACP0s=","seismitoad":"SURCQUEvKigmJicoKCkfDwkGBgYHBQEAAAE5LywsLqY=","sentret":"SUlKVGBkShwNDQ8QFiQoMj9UVFVdZVZBKBMHAAAABA0=","serperior":"BAQHDgoICBYWFRIPCgUDAAAAAAMHDRgnQZOSbm5zc3M=","servine":"lJibnZ+fn6CMhoafpq20hoaHZGQAAAkVFhMogpOQkJU=","seviper":"paessTciFg8JBQIAAAACBAYICw8UIyAeHBsbGxwdHyU=","sewaddle":"JCEeGhcUERAQGiAkJCAQEBEFAAAAAggRIXBwcYeKj7I=","sharpedo":"raSbk4yGgHsJBgYGBwoOEBkhDgAAHh4hITNiY2dqbnM=","shaymin-land":"WFgxMSsWFBQWEQ8PDxQTDwEAAAEFChEbKDo8PD4/Pz8=","shaymin-sky":"XkNDDQ4BAAQLDCAsM0hOSEdMQyspMTQyMC4sKygmJSo=","shedinja":"LyUiIiMoAQAAAAwUAQEBAw8cIxYUFRcmKCwySUtPYm4=","shelgon":"cF9BMyYgEwsFAgAAAQMDAwEAAAEDBQoPDgwKBgYRg4c=","shellder":"kIgIBQUHCxEWFhENCQUDAQAAAAUdGBUVGB45OTk5PEI=","shellos":"JBsYFxcXGRgNCAUEAgAAAwsaOEBEQTw3NTQ0Nzg4OWQ=","shelmet":"mI2GgHwJCAgJDA8VGQoCAAAAAgEBAQYrKyEbGx0xX5E=","shieldon":"UkQ4LicgGhYTEA0MBQEAAAEFBQYHCQkMFBomKCwva2w=","shiftry":"KycjIQAAAgUKESEvLzEoIRoXISEhIyMhISMzbXFxcnk=","shiinotic":"Z1NFOS8mHhcSDwEAAAQJDShrbXR2cWtkXVRJRkZJSWE=","shinx":"qqikoJpSS0hGRUUjBQAABQwRERJMT0lKVVVUVFRUVnM=","shroodle":"f3l0c3JyY1VMRUA8OTY0MzIyMhAIAwEAAAABAwcEAwM=","shroomish":"hXFxcWpcT0Y+NzEsJyUiIiAfHxYOBwIAAAElJSpVWF0=","shuckle":"hoB9e3p6e31/g4eKjVtOSERDPjk2NQUAAAADDjMwMDE=","shuppet":"NDQ0NDQ0NDQrIBgRCgYDAAAAAAIGCxQiNTZCRkVFRko=","sigilyph":"5dfMwrkAAAcPGwQFFhMTMzJKQEBERUl4f317enl5eXo=","silcoon":"goB/fnwKCg4UGBwfIRwYFRQUFBUXGxYQCgQAAFBRUVE=","silicobra":"Sz0hEg4NCAMAAAABBQ0WKzxBSFJeaD03NjY2ODAoKJo=","silvally":"WVBIQDEsJiAbFhIPDxcgHiAqNTU2NS4tLS8xKg8CAAA=","simipour":"TUM9OTc2GhYWFhkfJjc1NTlGDQIAAAIHHSQuPkc+PT4=","simisage":"NzQyMjAvLy8wMTMMAwMECBAbBwcAAAkJEiskFBQJBgY=","simisear":"dE1NT0cYDw4ODxEXIDNCFw4AAAAIGklJRkREREA2NTY=","sinistcha":"BAAABAkNEREWHRAODwwLCwMCAgYODw8bHiMpMz5Ob5Q=","sinistea":"gGZTPzUwLxEIBAIBAAAAAQMFCg4TGyUfHBwfeHZ2d3o=","sirfetchd":"NS8qKCYmJiYmJiYmJiYmJiYmJiYmJgkBAAADHhwcERE=","sizzlipede":"sRAMBwQCAAAABwgJDA4QExcaHR0eHjs7UFNUU1JSUns=","skarmory":"JycnJSIfGRELBwMAAAASEzg5PD0/QEFDRUhLT1ZYYH8=","skeledirge":"MC0tIiAgFhYWFhYMCQcCAQEAAAIEAwMEBggJHB0fITA=","skiddo":"AgMFAAAABgQCAgIAAAEHCAgKChYWJTE6P0NAOzc0MzM=","skiploom":"TD84MS4uIxQKBAAAAAACBQkQFBQUFBIMCgoNNEJSWmM=","skitty":"UFAWAQAACw4SEg8ODAwMDA0OEBIVGyEmMjc9R1tcX2M=","skorupi":"pJuVkpKSk5emr7fApiMBAAIPExMVGSEwMDE3QDw7Ozw=","skrelp":"Z11RQTIsCgICCA4gHR0BAAAGlJR2dHR6YVtbYGZlaGs=","skuntank":"ynl6e2VZUUpCOjk7MikiFgAABAoUIiInL1VMSEhOTlI=","skwovet":"QSwqKh0SCwYCAAAAAgQJDwsJCxQ0NTk/SVZYV1dZXWY=","slaking":"U01GQj05NTIjIiAVDw0MDAwMDAsMAwEAAAAAAQUZOaQ=","slakoth":"IBgSDQkHBAIBAAAAAAABAgMFBwkMERUbHiAiJiwyPU8=","sliggoo-hisui":"qJ2UjnFxcXN2cW5tbW5wdCkZDgcDAQAAAAEDBwwTHi0=","sliggoo":"f38eCwkLGhg3eXRzcnN0dnl9STw3NDQ1AAALEBUeLkY=","slither-wing":"aF5WUEpFQD06ODY2NTUxMTIxLSQWEQsCAAMEAgAAV4U=","slowbro":"HhkZGRwjISEgICAfGRcWFRUWEgwIBAIBAQMGCQAAEoI=","slowking":"ZlNTUAYBAAAABQwbJSEhCwUFCBYRCwgGBgYGCRAVFRE=","slowpoke":"bWNeXV+lrbO5vcEYFBISExYTEg4LCwsJAwAAAAEECzk=","slugma":"TEc8Ojo9LhcSBQQEBQUGBgcOCwkJDB8WEwwGAAAACDw=","slurpuff":"eXJubW1uU0hAOzcNBQEAAAEFDQ4OFB8eHh4fIigwPEE=","smeargle":"d3JPQjs5MCciIiU1NTYLAAAAAwgQGipDZFVQTElHR0g=","smoliv":"bmNdWFVUCwsPFyM1KiEaEw4KBwMCAQAAAQQJEBERQXM=","smoochum":"o1MRExsnOzQlGRAKBAAADA0LCgoSJCQlKzA4OTQxMDA=","sneasel-hisui":"v7u4trW0tF9fYGJhMjI0KSkrBwAAAQIKCxRFRUVHSU0=","sneasel":"opMXBwYGGycwODs+RE1WUU9NS0sICAEADh0tbHF2fYY=","sneasler":"q51jY2RhYWFldnp8dVg2IhQIAAACBk5UWV5PSkqTkpI=","snivy":"AAACBQkPFRwlMkJPSUdHRT43MSsnJiw6PEFJUUw8PGQ=","snom":"e3Q/OTYzMi8tLQoICAgJCgwDAAABAwcKEA8NDAwOGzQ=","snorlax":"WVdWVVNQQjcvJyAbFxQREREUJiUlDgwAAAEEBQgLEh0=","snorunt":"Zl9ZU01IQj04My0oJSAcGRQQDQoHAwAAAQoWIjMzNDk=","snover":"a2hjX1tWUkxIQkFBSUM6MSsjHhkIAAAECQkJCSI+PkM=","snowy-castform":"YUY0JRgPCAMAAAEFFR0cHB4kKysrLzY6OTk6P0htqZc=","snubbull":"LRYMBgIAAAAAAwwtFhQUGB4lLzQwKxwWFh0eHjAwMTg=","sobble":"kYN5cWlkX11cXFxGLh4TCwYCAAAAAgYPHjlHRERGPDw=","solgaleo":"aGpxVkpKAQAAAQUMCAQAAAABGRkUEg0NDQgHBwgPSUk=","solosis":"VkM2LSYeGBQOCwcFAgEAAAAAAAEDBQcKDhQYICkzQFM=","solrock":"lIuCfTo2Nz5CRkhJQyEAAA0iPkAyKiMhIltbW1xjaGk=","spearow":"joyKiYKBDAwNEREUGB4hAAAEChEYFxtWVlZZV089Ojo=","spectrier":"FxcZFBQUFBMTEyMeFBERCgYGBAAAABcbQkE8OjptbW4=","spewpa":"LiEYEQsHBAIAAAAAAQQGBgkBAQIECwwNDxEUFhoWFBQ=","spheal":"NjMpIhMLCQkKBwUDAQAAAAAAAQIEBQgLDwoHBwk4TI8=","spidops":"2dVXTEhFRUZCNzMeCwAAAQIEBgcJDBASDwwJBgQBAQE=","spinarak":"b2VdVlEkGxgYGB8ZFA8LCQkJHhgSDgkFAQAAAkBCRUk=","spinda":"HRkYFxgYGyAlLjAoJCIhIgMAAAEJFRoWExIRERITFx0=","spiritomb":"gk8+LiUiHhkVAgEBAAAAAgQFCQ8UGR8oGxwsPEdITFc=","spoink":"jIF8enpyaV1LPzMqCAAACRwcHiIoMT8/P0JAQEd3bl0=","sprigatito":"JCAdHBoaGhocEAYCAAACBgICFRYdQ0ZKTldYWlxfYmU=","spritzee":"z8+MhYFqU0QsIBYQCwgHBwEAAAABBQwWIkZOTE1jZGo=","squawkabilly":"amZmZ2hoEhITFRgaHiMAAAMKFSUbFRVObGxtb3Jxb38=","squirtle":"Rjw2NTEwLCoqLDE5IxcCAgEAAS0tLCcjIB8fGhcYJ4A=","stakataka":"cl5NODIzNDU1PT0/PDw8PDgbGBcZFxMIBgMAAAIFEBM=","stantler":"FQEBCQkAABYPDyonJCQqNj9BQUFBQ0lRVFhZVlNNRkU=","staraptor":"LSAWDgkFAQAAAAABBR0aGRkZGx0lLDU/QEAvGBEQFXI=","staravia":"U01MTlhZPjApKCALBgcZFA8JBgUFBgkPGjA4CgIACxg=","starly":"foWGfk06LSYfGhcWFRIGAAAFBQYGBwoPFx8pKSgoNGY=","starmie":"eXQiIiIjJigrLi8zNTMpHxcPCwsVFhAJAwAABzg4Nzc=","staryu":"cm1oZF9cV1MAAAADBwsQFRkdIyYjIR4cGxgXFRQTExM=","steelix":"WD4zKRwWEAsICAgCAAAGFCdVg4OH0dHT0MzIuqacj4w=","steenee":"W1taQTQoHxgSDQgFAwEAAAAAAgUKEURIT1ltcnR3en8=","stonjourner":"uKwfHBoXFx8fIi8lIR4dGhgWEgwJBwUEAgIAAAACBgk=","stoutland":"Mh8bCgoLDREQEBIQDg4ODhEVGhkVERITDwsKCQIAAAA=","stufful":"HRoZGRkZGx0fIyAaGhwwDQUBAAAAAQUObW1tb3BwcHU=","stunfisk":"hX14c3BubGxsbGxtaWVeU0YAAAEFCw4OExgfJSgtMz4=","stunky":"t6yknJaSjopsbGpnThwbGxsbHBkXFhMHAAATMjQ0NFU=","sudowoodo":"fElISEwMCAgIBQAAAAU1RFdaVlNPTElCPjszLi4fGho=","suicune":"Sj82LykjHxkUDw8MDAgGBxgTEQ4ODg8PEhYYEg4BAAA=","sunflora":"cl5IRUI6OTIrKzMxNzQyPUZPKBwVDwoCABdlaz4yLy8=","sunkern":"BwAAAgkVJ1suLg4MDBQbISIgHhwbGxsbHR8jJy41QFA=","sunny-castform":"WVBLSUgiGhYUFBQXEggDAAAAAwoXFBQUGB9QTDglJTE=","surskit":"ko2KhoSBbGBbV1ZJQTo1MSwkHhcSDgkFAgAAAc7Q0tQ=","swablu":"S1BZFAoHBQUFBAIAAAAAAQQKDw8QEhcoLUhOUFFYhow=","swadloon":"WVVSUFBQUFFVS0Q/Ozc0MjAvLi4uLzAyHhsFAAABGXk=","swalot":"YldPSUVBPjw6OTY1MzIxLy0rKCUiHhsWEAcBAAABBxo=","swampert":"ODMyMTExMjM0NjErKyMhPTo1LCMeGRQKBAAAAx9Ig9s=","swanna":"LC0iIiEfFw4FAABSTjowKiYkIyMkJigoKigqPGFMRUs=","swellow":"HBIPDQICDBMRDggDAQAAAAEEBwwSGB4mMkUvKCUlKEg=","swinub":"UEU9NS4oIx4ZFhIPDAkHBQQCAQAAAAABAQMFCQ0UHio=","swirlix":"OTImGhUVEAoICAgHAgAAAgYPDg4QGDY/bW50dnd5fYM=","swoobat":"49bMxAAAChIWGRYWIScmJCQ8QkQ/P0RGS01fYmuQjo4=","sylveon":"JB8VEwwGAQAAAgwQEBMREBAXGRkUDw4ODxQnHR0XFx0=","tadbulb":"QS4hFxAJBQMAAAABBQkQGyk6S1NcbVVCMiYbFhQUFBo=","taillow":"KB8ZFhQSEgcHDAgFAgEAAAABAwUKEBYcISkyNDMzOlU=","talonflame":"AAIGCQwPERMVFhYbIigtMC4rKCgoKDEvISEhIydGR00=","tandemaus":"S0hGRRALBwQDAQAAAAABAgMGCA0VKCwwLisqKisvP0E=","tangela":"WS8sKysbFRMQCwcFBQMBAAABAgcLDBEWFxgcIiUoLjU=","tangrowth":"X05ANSsiGRMNCAUDAQAAAAACBAgNEhoeICAgHR0jNT0=","tapu-bulu":"WFNNSkpMLBMEAAAAFThdVVJMRT48PD1FVmR3d3Z3d3w=","tapu-fini":"7SMjIzI4PzkwKCMfGxkYGBgYGBoXCAsAABMyNz9HU2Q=","tapu-koko":"HBEMCwwXAAQJBQMAAAAABwcHBwhMS01KSUhISElzeYA=","tapu-lele":"f21dT0M3JB0dEAwMDwwIBQIAAAAABAwzNTc7QklUX3Y=","tarountula":"mZSJgHtKPDIrJSEdGxUIAQAAHiIkIR0ZFBQZGRobJXY=","tatsugiri":"LyglIyMjHxQMBwQCAAAAAAEDBgcLEhoUEA8PERUXHCo=","tauros-paldea-aqua-breed":"Rj03BQIBAAACBAkWFxcWFBQUGSEgICAeHiElLzQ4Oz0=","tauros-paldea-blaze-breed":"DQsGBAMBAAABAgUJDREXHCckIR8eGxUTEQ4ODAwdGho=","tauros-paldea-combat-breed":"UEk/NS0oIyAdHBcQAAABCRUYHCIlJiYqLCwsMFJQTU0=","tauros":"9PF2dnh6ub1LPAsEAQAAAgkSEg8PDzc2Mi4uLzEyMzY=","teddiursa":"EggDAAAAAwkTDQkHBgcJDRUfHRwdHyZER0pNVFxSREQ=","tentacool":"bWNcU01IRkRDQ0RFSEpNTk1OUFBQTk5QIA8HAwAAAAA=","tentacruel":"eGVcVlJQT09MQDw8PD5EVUsWDAYCAQAAAAMbHDVfYYQ=","tepig":"gjQ0NDY6PkVNWWl4BQEAAAUKCxEZGhoaFA4KCQgJCxE=","terapagos-stellar-form":"e29xcmVfX2BeYGhXTzk1LQcFAwkJBgYLAQAEKi8zP1c=","terapagos-terastal-form":"NDAFAgEAAAABAgYaGx4hKC4vLy8vMC4uLzQ8Pz9KW1w=","terapagos":"BQAACjY4Mi0qGhYUFCsuMTU6P0ZDPjkpJiYmKiosOHw=","terrakion":"XjU1NS4uDwcAAAABAgUIDBEWMDAwMDAxLCgmHhYLCAk=","thievul":"DgwMDAAAAAECAgMECRYTExMUGR8rPDMzMzIwLRkWFow=","throh":"Hx8HAAAABQ4ODxEUGBwhLkNDQDs2MzM1Mi4sLCsqKi0=","thundurus-therian":"eV9eUFBQT09SWEhCQkJDSEg/PhcXGBYAAAMHDA0MFiU=","thundurus":"dG5dEAkJCQcAABsjJCMwQkNDSzozMjIzMzQ8SFpdXmg=","thwackey":"1IBlEhESGxUKAAAECxohGhQSEhIZS05CLyUkJB0LCxk=","timburr":"b2JdW1ZRS0ojIiMnLjc8Ni4SAAAAAAECAgMvLi4vKyk=","ting-lu":"gYGCgoWOjoeEhIWIWUlGPigXDQwSEREBAAACAgICAwQ=","tinkatink":"SURCQkJLPzk0LCgkIiEgICEiJCgtKh4WEAIAAAEFCBQ=","tinkaton":"hIJPRUE+PT09QUhUVVc0Ly0tKCgdFQ0KCAcBAAADAyE=","tinkatuff":"amRKOTAqKCYmJygCAAACBBcVExMTFBgqMjY6i42RnLc=","tirtouga":"ZV9bWVlZVVBNSUYRDAkHBQQBAAAAAQMIDBUxMzU4PKI=","toedscool":"ppqUjouIhoWEgHt6enZrZWWCiIWAe3VwBwEAAAADCRE=","toedscruel":"Z1tVU1JRSDQwCQIAAAItNEFgYGBgYWFgYF9UR0dUUlM=","togedemaru":"0b+HfmlNJyAdHBgRDAcEAwEAAAAAAQMGChAWICw0MzM=","togekiss":"XFNLPjgGAAAAAgcLDxEVGB0jLjAzNjk+QkhPWGpqbG4=","togepi":"hzk2NDMyMAMAAAACAwYKDg0NDQ0NDxIVGiAoHRUUFBo=","togetic":"IxwVCQUCAAAAAQMHESdOUAwMEBknOjg4ODoCAgMGER4=","torchic":"sqOXbWpoZ2c7IxULBQAAAAQKFRISEx0oLDNDMSMjIz4=","torkoal":"bWdXS0U/Pj49Mi0sKyciFBEJAgAAAAUIDA4PFCkmJok=","tornadus-therian":"hwsFBQYAAAIBAQIHBwgZGzM4P0dTVlhYWFhbVT81Mzs=","tornadus":"fnl4aGhpNyASCgQCAAAAAAMHCxIaHx0dJycyQ1B/z+M=","torracat":"28XFx10sKioqKistLCknJgAABAQULDE/Ozg2LB0YGBs=","torterra":"hnBqWFhZW2BdXDo5ODAlFhQUFBkNAAAHExcWFRERE2o=","totodile":"FhAPEBYWICMqCAAAAAcTFxsqLicgGRUUFBUaJEYwLC0=","toucannon":"SjkrIBgRCwcEAQAAAAAEaGhpam5zeYOOkZeelm9paW8=","toxapex":"mi8vMDEyMRESFRkdIictMzk+KSouMCwWDxAXDAAAC44=","toxel":"PBQQDw8PDxARExULAQAAAwoRGxwgKTo9Q0U/PDw8PD4=","toxicroak":"T09PLRAEAAAAEBNLSEhISUxRW1FKR0dHS1ZTPz4/qak=","toxtricity-amped":"Dg4QFBYbAAIOGRkZKkNUT0k/NjMvKxobHBsbHCEpMzM=","toxtricity-low-key":"f3coLAAFGyMdHTBFRVlXW1tYUUlEQ0M3NzgzLy0tMEc=","tranquill":"BAQEAAAAAAAFCAkOFxkpMEZPT1JWXGVzf4mKdW5udI4=","trapinch":"LR4UDQcEAgAAAAEBAwYJDBIYICo4Tk1KQz47OTg4uLk=","treecko":"NzMwMDAwLy8wCwMAAAwQHlNQTk5PUFRUUk9CJiYnM2Y=","trevenant":"OTMzMzNAQEBCMjIYEgsBAAIEAQAAAgk8GSwmJgUFJEo=","tropius":"oZKSkpWRhw8GBQcHBw4WLEJcfoNtUDUYDwYAAAtZW14=","trubbish":"bWpoaGdnZ2hpbWheV0I5My8rKSUhHg4JBAAAAApDR0k=","trumbeak":"IyY2RVcPDw8QEhUYHgMAAAcSHxYTEzY2l5yZk3Vwb3M=","tsareena":"PzMuKiorM0FBQUFBQkE/OzUuJBsPBAAAAgcRIWh6fIA=","turtonator":"lYE+GBgbHyMeDQwPGhwfGxMLBAAAHykuMTcgHR0dHR4=","turtwig":"QkFBQkRHTFZsTzcpGxEHAgAAAAIDAwUJEh86PDw8P0U=","tympole":"U0QcDwgCAAAAAQULEx4oLjQ7RlRkY2NjZGZqbXN6hJI=","tynamo":"EQsHBAIAAAABAgQIDBEWHCMrMztBR05UW2RsdYKwtb0=","type-null":"d3RzcnJyclBQVAIGCw4KBwcICw0AABoWDw8PDg0OElc=","typhlosion-hisui":"UklJWDxBR1Nwd3x1bmZfWVJPT1xYVFBLRkAsIAcAHUQ=","typhlosion":"LikpLgQEChAWITMuIBMIAgIELCgiGhILCQkJDAAAv8o=","tyranitar":"HhkZISkrKzI5NzIpGggAAwMxMDAwLi0tLTI0OklFRVQ=","tyrantrum":"gnsbFhUVFBQRCwIAAAEECx0fJTg8PD1WVltjbWxsdoM=","tyrogue":"LCssLi8bFBISGBUUFBQVFx0mM1AnJCMCAAAHGxoaG0U=","tyrunt":"GQkJCQsNEBIWGBsZFxYWFhYWFhYXGRscHBkTDQgCAAA=","ultra-necrozma":"fl4HBxoQBgYzIRoUDgoGAwEAAD4/KystKCIfHBoaGhs=","umbreon":"iY2TmqKstgAAAgUICw8TGiIvSU5NSUZAPT0+QEFBQ18=","unfezant":"LickISAgIBwaEQoGAgAAAAIGDSAoNUBLXFpXOC4tMFw=","unown":"NCgfGRMPCwkJCQkJDREWHSUyOjk3NTMwLSgaAwAAAkY=","ursaluna-bloodmoon":"VVVEQD0wLy8uJycmJSAeHiQUDAMBAAAIUFBQRD09TL8=","ursaluna":"Y1pYTUlAPTs3NDMzNzMmIB4gICImIyAaFg8KBAEAAAk=","ursaring":"XVhYUlFSWFNEMygnGxYQCgcDAQAAAQULGRUUFBQPBAQ=","urshifu-rapid":"X1lSTEZFRkdBPjw6OjonHBUSEhIjJjI0KwAFDVdVUVE=","urshifu-single":"iIF6entbVDo7HhELBgQBAAEKFAwKCgsOFBwfISQTCAU=","uxie":"IhcRDgoFAgAAAAEFCxQeL0I+OTESEhIUFhoiPkhOWGU=","vanillish":"nExAPDw/RUlBHRwcGBIRERgdJQ8CAAAAAzQ1OkZHSUs=","vanillite":"jIN9e2leWFZWWEc9NS8sKiorLTEaAwAAAgYLamx3tr8=","vanilluxe":"OC4bFRUXDQ0OEAYAABwcHB4hJSkpFxc4OE5OTk5OTk8=","vaporeon":"YWFjZWdcUggIDhQfKjM4O01GOScXDAUDAAACAwMDCBI=","varoom":"hX16dnNwbBAJBQMDAwICBRcUCwUEAgEAAAECBQgLFB8=","veluza":"eHZ0cnBvbWtpEAAABQwUFiQqJCEcGx49QERtb3BydHY=","venipede":"KCMgHRsYEw8MDAsLCwsIBQQEBAQDAQAAAQIHDxETFWc=","venomoth":"1sm/BQEAAAABAgUIDBEVGRwfISMmLDQ+OTk6Pj4+QnQ=","venonat":"WVpigG0MAAADKkU/Pz4+NjYxLSw8Oz49QkdVWE5HRkc=","venusaur":"TUAxJyQiIiIuNioYCwYBAAAAGxkYGBkbHx4eLj4+TI4=","vespiquen":"JiYoLDM0P1I5GBUValE/MigfGRMPCgkFAQABBg0pLUM=","vibrava":"fHVwaWRfWlVQT0xMTU5PUT05JiMhHhwHAAIHBwceHHw=","victini":"MS8uLCsrKikoKCgoKCgaEw8ODg8TGhgBAQABFR0dGxs=","victreebel":"Uk43LCMeGBUSERE/PRYRDQwMJCUjAAAAAAEDBgwnOlk=","vigoroth":"jY2UnaOjop+dIhkPBwQBAAADEA8MCwsLDA4QFBohKjU=","vikavolt":"TEhGRENCPiYXCwMARkZDMTE7Ojk/SEhHRkZFREREREQ=","vileplume":"lYZoUkY8NS8rJBsSDAcEAQAAAAEFDjJDPj5CaWRWVlY=","virizion":"TVBle2dncnyIODg5NRoGACwqKCUlFRUVFhYXGRocHiA=","vivillon":"zMO7tK6pBAAAAAsLFxQTEhITFRcdJC9DQkJDRUhNVF8=","volbeat":"TUQfHyQvQEQ0Jx8aGBgaEgwKCwgDAAAAAAMHDRcjJiU=","volcanion":"W0VANzEsKCIgICQkJhwcISYsLTEgGxkZFhMIAACOkKc=","volcarona":"rB8fIyksLi8uLi4uLi8iFgwAAAoTGCEvLSwsLCsbHCc=","voltorb-hisui":"TD0xKCAaFBALCAUDAgEAAAAAAQIDBQgLEBQaICgxPUw=","voltorb":"TT4xKCAaFA8LCAUDAQAAAAAAAQIEBgkMERUbIikzP04=","vullaby":"kY2KiId6Z19bUEtLMxwNBAAAFCoqKi0wNjpASEg8Ojo=","vulpix":"LwkJCQkKCw0PBQAAAQUKEBYmKysrLC4xMzY5Ozg1NTs=","wailmer":"TEI5My8eDgQAAAACBQwUHB4eHh8gISMmKS4yOD5FT1s=","wailord":"HxcQDAgFAwIBAAAAAAAAAQIDBQgLDxQZIis5RlVld4k=","walking-wake":"FRIPDQsLAgAAAwMFCgoKDxwcHiElKSQjIyUoPS0pKTI=","walrein":"EQUFAAAJBQQCAgIMDxkZGRgXFxgYFREPDQwMDGZsdYM=","wartortle":"KyklJCQlIiIiJiwsLiwRBgAACBQ+PkE8NzIxMS4sNzo=","watchog":"wa4oHRYJAAAAEDEtIREIAwAACwcDAAAABQsVIioUEBU=","wattrel":"Fg0HBAICAgMGAgEBCQcEAgIAAAABDyIyUVElIiEoKVw=","weavile":"XFBFPjcyLi4zP0E7IhsbJEM0JhcLAwAABwlMSUhHSqs=","weedle":"aF9VOCQaEQQAAAIHCg0RGBELCw4XHiQiIiY7Oz1RWms=","weepinbell":"qZMIAAACCAwQEhUWGBkbHiIpJycnKCouMjU3ODk5PEA=","weezing":"cGojHBgWFhYbKQYCAAACHR8iIiIlJygsMzc3KCIhISM=","whimsicott":"XFZUNykhGxcVFBQUFRELBwQBAAAAAAEECA4ZHB0tMTk=","whirlipede":"e3VnQgAAAQMFCAsOERQYHSImJygrLjEwKigoMkdVYGA=","whiscash":"MygfGBIOCgcEAgEAAAAAAgQGCw4ODxIMBwYGCBhdX2M=","whismur":"jIeFgiYZEAsFAgEAAAABAwcOFhUUFBUWGBwgJiorLjY=","white-kyurem":"HhoYFBISEhISEgIAAAABAgQFBAIBAAEVFRgYFBEMDBg=","wigglytuff":"AAAAAwcMExwnNkE+Ozk3NTQyMS8uLCwtMDY+S01LS0w=","wiglett":"GhAKAAAACxMjUGZze3+DhoiKi4uKiIeEgn1sTzAdHR8=","wimpod":"pUgAAQkTGyQrIiIqPk1XV1dXWVlaXElJTVBWW2NqdYA=","wingull":"DgAAAgULERgfJi42P0dFNi0pKSkphoyTmaCnr7fAytQ=","wishiwashi-school-form":"TSAfGxgOBwQBAAAABQAAAAEECAwVHRsTExsjw8TIzM4=","wishiwashi-solo-form":"IRgRDAkGBAMBAAAAAAABAwUHCQsPFBsnMi0qKCcnJyk=","wo-chien":"DQ0XDQ0OFRobGBgZIiEeHR0eHBoaHh4dGhQPDwUAARE=","wobbuffet":"IQsHBQUEBAUFBQYHBAIAAAACBAUKDhIYHCMnBwAAAAQ=","woobat":"uLg2JxwTDAUBAAAbGxkZGklIRUVGTU1OTk5YWFhlbW0=","wooloo":"QTcnIRoSEAkFBAQCAgEAAAEDBQYJDRAWGh0cHBwfcXI=","wooper-paldea":"Y1kaGhcSEhMyNiwYFhYiIxMFAQAAAAIHDhhXVVRUVFU=","wooper":"aCYmKSsZGRweExMcGxsvLi4IAgAAAAIIERw9VVRUVFU=","wormadam-plant-cloak":"b2tqamZmbW1sVVJSIRUOCgcGAwARGxs1NkhMUlNSWlo=","wormadam-sand-cloak":"gnx7e3Z2d318VVNSTj4bFRQEAAAAAAcnKjhMT1NVYGY=","wormadam-trash-cloak":"aWJhYF0GAAMLEBUaITMqHRYQDQ0ODhEdPUBES09LTlM=","wugtrio":"k4+NjIyNjgoEAgEAAAABAgIEBggLDhIWHCIsLS05SE0=","wurmple":"x8K8t7GshoaGgXVya2UhAAAEBwkNEBQTFA4OGRkiQV0=","wynaut":"RkJCQkNGS1JTT0tJRkNAPTo4NR4BAAAECQ9cW1tbZWo=","wyrdeer":"QkJHICAsN0ZITE5dXWkMBgMAAAADDBMREBAODxEUFVc=","xatu":"RDozFxEQEDI4Q0M9NzMuKiYjIB4bGhgXFhUVFiAKAAA=","xerneas":"GgAACBchKDM8Y20qJxoaHyQlLUxLSkZEQkFBQEBBkpc=","xurkitree":"Y2JERExIODhSSh0KCgAAEQ4OUDIyNklISEdHRzIyKyo=","yamask":"aWlraltSTkpIRkZGR0hOEQQBAAABBAxSUVFSU1VYXF0=","yamper":"mpqam5yeKicoLjQ6AQABAgQIDCAcGhkZGRseJScoMoA=","yanma":"eHY2AQAAAQUMEhwmKCYlJSUlJScpLi4vKSUlJSVWVlY=","yanmega":"g4OGIR4BAAABBAgNExgfJjE7PzsyLioiIiIjJScpSW0=","yungoos":"FwoEAQAAAAABBAgICQoMEBMZHR4gIiQmJygqKy0oKCg=","yveltal":"ziwsLhEKBAAACggICBN2hH9/gEdHLCwvNDAyOUJNUFY=","zacian-crowned":"HB8kKjM1OkJDQxscISQoJx8YEAoFAQAAAQMHDC41NUI=","zacian":"2tXSzseOh0Y+MSwnHxkTDgoGBAIBAAAAAQMHDDAxMTI=","zamazenta-crowned":"TkxIMysaEhANCwsLDQ8QCwcDAQAADTs4NTU1NS0qKoI=","zamazenta":"MCgkIiIfEQYEBAAAAQIEEBMYHSIQDAoKCg0TExQYXVw=","zangoose":"U05KR0RCPTo5NjY4MScnKCIcFxELBAAABwcJDh0VFRc=","zapdos-galar":"gIA+PjExCwsPGwAAAAYGBQUIAwMREQsKCgsZIZaWlpY=","zapdos":"PAAAAwoREhIWIBcUGCk7R0I8OTg9OTk5VlZXX2RjYmI=","zarude":"CgEAAAMCAgICBAgNEBgfVmNhYF4fGxQRERETGCAZGUY=","zebstrika":"FhMPBgYHBw8NCwMAAAAkJSUkHA8GBAQIEBggKDhIQ0E=","zekrom":"2L+snpJFMCwrLTEjHB0qNioTCAAACRwYGBwbFxeGhIQ=","zeraora":"JyIeHBkZGRQUGCojGhMMBwIAAAEQM0VbW1tbXZqYmJk=","zigzagoon":"xL25WRUSBwcHBwcHCAkIBgUFBAAAAAECCxIYGBkdNjY=","zoroark-hisui":"2Il0b29ANxoUFAoJChEmJigqHBgYAAYILDFlVUM7O94=","zoroark":"UExFKiooJSIfHh4eHRw7MiARBgAABTw8Qk5BOztDsLA=","zorua-hisui":"XVZSUlNYaWZPMSEYEQICAgQJDhYAAAsQICAhJjBUVmM=","zorua":"eXUJBwUFBQUGBwgLDhEUAAAFCQkSIyguR0tTWWN4eHk=","zubat":"TDwxJh4VDwkFAQAALltmaWlnYl5bVlJNSUQ/Ozt+fXw=","zweilous":"ISEiJR8SDAgFBQcLERkEBAAEHTExLCQjJh8aFhILCCQ=","zygarde-10-forme":"RCIhISM1OTMwMFRWVlNRUExIQz86KBwUDQcDAAACjY4=","zygarde-50-forme":"FldWJSIiJSYFBQcODxMVBgcSExkWAAAsNDEvLi4wNj8=","zygarde-complete-forme":"Ny0qKCUiIR4dGxoYFxEGAQAFBRYWExMUFBUHAgECBXQ="});
  const contourProfileCache=new Map();
  function contourLeftProfile(b) {
    if(!b?.slug || !CONTOUR_LEFT_PROFILES[b.slug])return null;
    if(contourProfileCache.has(b.slug))return contourProfileCache.get(b.slug);
    let values=null;
    try {
      const binary=atob(CONTOUR_LEFT_PROFILES[b.slug]);
      if(binary.length===32)values=Array.from(binary,c=>c.charCodeAt(0)/255);
    } catch(_){/* Unknown art: rectangular float remains authoritative. */}
    if(contourProfileCache.size>=72)
      contourProfileCache.delete(contourProfileCache.keys().next().value);
    contourProfileCache.set(b.slug,values);
    return values;
  }
  // Outline the RIGHT floated content exclusion, conservatively hugging
  // the subject's leftmost pixel in each band. No image is recropped or moved.
  // Floated element remains the native section and keeps QoL's sparkle control.
  function contourShapeFor(article,hero,layout) {
    if(!layout?.flow || !layout.contourWrap || article.getBoundingClientRect().width>=550)return null;
    const image=hero.querySelector('.yofi-hero-art-lane .square-image img');
    const b=subjectBBoxFor(article,image);
    const profile=contourLeftProfile(b);
    if(!profile)return null;
    const offset=Math.max(0,(layout.laneWidth-layout.imageWidth)*(layout.artAlign??.5));
    const inset=6; // text-to-alpha gap, independent of the column gap
    const points=[];
    // Use 32 conservative strips (min across each original 1/32-height band)
    // rather than a giant polygon for every raw contour pixel.
    for(let i=0;i<32;i++){
      const x=Math.max(0,offset+profile[i]*layout.imageWidth-inset);
      const start=layout.artTopGap+i*layout.imageHeight/32;
      const end=layout.artTopGap+(i+1)*layout.imageHeight/32;
      points.push(`${x.toFixed(2)}px ${start.toFixed(2)}px`,
        `${x.toFixed(2)}px ${end.toFixed(2)}px`);
    }
    const right=Math.max(0,layout.laneWidth);
    return `polygon(${points[0]}, ${points.slice(1).join(', ')}, `+
      `${right.toFixed(2)}px ${(layout.artTopGap+layout.imageHeight).toFixed(2)}px, `+
      `${right.toFixed(2)}px 0px)`;
  }
  function updateContourShape(article,hero,layout) {
    const shape=contourShapeFor(article,hero,layout);
    hero.style.removeProperty('--lab3-contour-shape');
    if(shape)hero.style.setProperty('--lab3-contour-shape',shape);
    article.classList.toggle('lab3-contour-flow',!!shape);
  }

  // v0.2.14 Working diagnostic: outline actual subject pixels, NOT expanded icon frame.
  let bboxOutlineEnabled = true;
  window.__yofiSubjectBoundsDebug = enabled => {
    bboxOutlineEnabled = enabled === undefined ? !bboxOutlineEnabled : !!enabled;
    document.querySelectorAll('.page > main article:not([data-yofi-layout-probe])').forEach(article =>
      article.classList.toggle('yofi-subject-outline-debug',
        bboxOutlineEnabled && article.classList.contains('yofi-subject-bounds-active')));
    return bboxOutlineEnabled;
  };
  // Subject framing is the ONLY integration surface for QoL's existing
  // four-corner draggable control. Do not change the control's selected
  // corner, inline positioning, event handlers, or persistence here.
  const SUBJECT_STYLE_VARS = ['--bbox-canvas-w','--bbox-canvas-h','--bbox-canvas-x',
    '--bbox-canvas-y','--bbox-clip-top','--bbox-clip-right','--bbox-clip-bottom','--bbox-clip-left',
    '--bbox-subject-width','--bbox-subject-height',
    '--bbox-figure-x','--bbox-figure-y','--bbox-subject-offset-x','--bbox-subject-offset-y'];
  function subjectBBoxFor(article,image) {
    if (!bboxTestEnabled || !currentSpeciesRouteKey().startsWith('pokemon:')) return null;
    const source = image?.getAttribute('src') || image?.currentSrc || '';
    if (!source) return null;
    let url;
    try { url = new URL(source, location.href); } catch (_) { return null; }
    // Look up geometry from the normal portrait for normal or shiny display.
    // No shiny pixels are scanned; never substitute a Fakemon, avatar, or
    // unrecognized form into this archive.
    if (url.origin !== location.origin) return null;
    const match = url.pathname.match(/\/assets\/pokemon\/([^/]+)\/main(?:-shiny)?\.png$/i);
    if (!match) return null;
    let slug;
    try { slug = decodeURIComponent(match[1]).toLowerCase(); } catch (_) { return null; }
    const b = BBOX_TEST_TABLE[slug];
    if (!b) return null;
    if (image.naturalWidth && (image.naturalWidth !== 475 || image.naturalHeight !== 475)) return null;
    const [left,top,right,bottom] = b;
    if (!(right>left && bottom>top)) return null;
    return {slug,left,top,right,bottom,canvasWidth:475,canvasHeight:475,
      width:right-left,height:bottom-top,ratio:(right-left)/(bottom-top)};
  }
  function clearBBoxRendering(article,hero) {
    article?.classList.remove('yofi-subject-bounds-active','yofi-subject-outline-debug');
    hero?.classList.remove('lab3-sparkle-expanded','lab3-sparkle-infeasible');
    if (hero) for (const prop of SUBJECT_STYLE_VARS) hero.style.removeProperty(prop);
  }
  // QoL owns the sparkle element, its click/drag handlers and remembered corner.
  // Species Card ONLY sets the permitted figure rectangle. A free-track extension
  // cannot steal the gap between this image and a neighboring content column.
  const sparkleSilhouettes = new Map();
  const sparkleLoadWatch = new WeakMap();
  function sparkleSilhouette(image,b) {
    if(!image?.complete||!(image.naturalWidth>0)||!b)return null;
    const source=image.currentSrc||image.getAttribute('src')||'';
    if(!/\/main\.png(?:[?#]|$)/i.test(source))return sparkleSilhouettes.get(b.slug)||null;
    if(sparkleSilhouettes.has(b.slug))return sparkleSilhouettes.get(b.slug);
    try {
      const canvas=document.createElement('canvas');
      canvas.width=96;canvas.height=96;
      const context=canvas.getContext('2d',{willReadFrequently:true});
      if(!context)return null;
      context.drawImage(image,0,0,96,96);
      const raw=context.getImageData(0,0,96,96).data;
      const alpha=new Uint8Array(96*96);
      for(let i=0;i<alpha.length;i++)alpha[i]=raw[i*4+3];
      const record={alpha};
      if(sparkleSilhouettes.size>=24)
        sparkleSilhouettes.delete(sparkleSilhouettes.keys().next().value);
      sparkleSilhouettes.set(b.slug,record);
      return record;
    }catch(_){return null;}
  }
  function sparkleOccupancy(record,b,subjectW,subjectH,iconW,iconH,corner) {
    if(!record)return null;
    // The current *image subject* corner, with no hidden QoL 4px inset.
    const localX=corner.endsWith('r')?subjectW-iconW:0;
    const localY=corner.startsWith('b')?subjectH-iconH:0;
    const scaleX=b.width/subjectW,scaleY=b.height/subjectH;
    const x1=b.left+localX*scaleX,y1=b.top+localY*scaleY;
    const x2=x1+iconW*scaleX,y2=y1+iconH*scaleY;
    const xStart=Math.max(0,Math.floor(x1*96/b.canvasWidth));
    const xEnd=Math.min(96,Math.ceil(x2*96/b.canvasWidth));
    const yStart=Math.max(0,Math.floor(y1*96/b.canvasHeight));
    const yEnd=Math.min(96,Math.ceil(y2*96/b.canvasHeight));
    let filled=0,total=0;
    for(let y=yStart;y<yEnd;y++)for(let x=xStart;x<xEnd;x++){
      if(record.alpha[y*96+x]>=90)filled++;
      total++;
    }
    return total?filled/total:0;
  }
  function subjectFrame(hero,image,b,layout) {
    const lane=hero.querySelector('.yofi-hero-art-lane');
    const figure=lane?.querySelector('.square-image > figure');
    const button=figure?.querySelector(':scope > .yofi-portrait-sparkle');
    const iconWidth=button?.offsetWidth||30;
    const iconHeight=button?.offsetHeight||iconWidth;
    const record=button?sparkleSilhouette(image,b):null;
    const blocked=!!record&&['tr','tl','br','bl'].every(corner=>{
      const occupancy=sparkleOccupancy(record,b,layout.imageWidth,layout.imageHeight,
        iconWidth,iconHeight,corner);
      return occupancy!==null&&occupancy>.04;
    });
    // Artwork is aligned inside *its own track*. Neither the inter-column gap
    // nor any biology/statistics row is available to sparkle placement.
    const availableLeft=Math.max(0,(layout.laneWidth-layout.imageWidth)*(layout.artAlign??.5));
    const availableRight=Math.max(0,layout.laneWidth-layout.imageWidth-availableLeft);
    const left=availableLeft>=.5?availableLeft:0;
    const right=availableRight>=.5?availableRight:0;
    // Only the actual artwork-lane bottom, after the subject, may be used.
    // Three-column artwork is normally bottom-aligned, leaving no such space.
    const laneHeight=Math.max(0,lane?.getBoundingClientRect().height||0);
    const artBottom=(layout.artTopGap||0)+layout.imageHeight;
    const freeBottom=Math.max(0,laneHeight-artBottom);
    const bottom=freeBottom>=.5?freeBottom:0;
    // If every original corner intersects the subject, grow the allowed
    // frame by one icon width; keep the expansion inside the artwork track.
    const hasClearTrack=availableLeft>=iconWidth-.5||
      availableRight>=iconWidth-.5||freeBottom>=iconHeight-.5;
    // No corner can be housed within this track without covering artwork:
    // veto the proposed composition instead of stealing column spacing.
    return {left,right,bottom,expanded:blocked,
      infeasible:blocked&&!hasClearTrack,iconWidth,iconHeight};
  }
  function renderSubjectBBox(article,hero,layout) {
    const image=hero.querySelector('.yofi-hero-art-lane .square-image img');
    const b=subjectBBoxFor(article,image);
    if(!b||!layout){clearBBoxRendering(article,hero);return;}
    const scale=layout.imageHeight/b.height;
    const topGap=layout.artTopGap??0;
    if(!(scale>0&&Number.isFinite(scale))){clearBBoxRendering(article,hero);return;}
    const frame=subjectFrame(hero,image,b,layout);
    const px=n=>n.toFixed(3)+'px';
    const leftInTrack=(layout.laneWidth-layout.imageWidth)*(layout.artAlign??.5);
    const vars={
      '--bbox-canvas-w':px(b.canvasWidth*scale),
      '--bbox-canvas-h':px(b.canvasHeight*scale),
      '--bbox-canvas-x':px(frame.left-b.left*scale),
      '--bbox-canvas-y':px(-b.top*scale),
      '--bbox-figure-x':px(leftInTrack-frame.left),
      '--bbox-figure-y':px(topGap),
      '--bbox-subject-width':px(layout.imageWidth+frame.left+frame.right),
      '--bbox-subject-height':px(layout.imageHeight+frame.bottom),
      '--bbox-subject-offset-x':px(frame.left),
      '--bbox-subject-offset-y':'0px',
      '--bbox-clip-top':(100*b.top/b.canvasHeight).toFixed(4)+'%',
      '--bbox-clip-right':(100*(b.canvasWidth-b.right)/b.canvasWidth).toFixed(4)+'%',
      '--bbox-clip-bottom':(100*(b.canvasHeight-b.bottom)/b.canvasHeight).toFixed(4)+'%',
      '--bbox-clip-left':(100*b.left/b.canvasWidth).toFixed(4)+'%'
    };
    for(const [k,v] of Object.entries(vars))
      if(hero.style.getPropertyValue(k)!==v)hero.style.setProperty(k,v);
    hero.classList.toggle('lab3-sparkle-expanded',frame.expanded);
    hero.classList.toggle('lab3-sparkle-infeasible',frame.infeasible);
    article.classList.add('yofi-subject-bounds-active');
    article.classList.toggle('yofi-subject-outline-debug',
      bboxOutlineEnabled&&!article.hasAttribute('data-yofi-layout-probe'));
    if(image&&!image.complete&&!sparkleLoadWatch.has(image)&&
       !article.hasAttribute('data-yofi-layout-probe')){
      const onLoad=()=>{sparkleLoadWatch.delete(image);requestHeroTick();};
      sparkleLoadWatch.set(image,onLoad);
      image.addEventListener('load',onLoad,{once:true});
    }
  }
  function bboxTestStatus() {
    const article=document.querySelector('.page > main article.lab3-active:not([data-yofi-layout-probe])')||
      document.querySelector('.page > main article:not([data-yofi-layout-probe])');
    const hero=article?.querySelector('.yofi-species-hero');
    const image=hero?.querySelector('.yofi-hero-art-lane .square-image img');
    const b=subjectBBoxFor(article,image);
    return {version:'0.2.22',enabled:bboxTestEnabled,route:currentSpeciesRouteKey(),
      source:image?.getAttribute('src')||null,matched:b?.slug||null,
      bounds:b?[b.left,b.top,b.right,b.bottom]:null,
      subjectRatio:b?.ratio||null,canvasRatio:image?.naturalWidth&&image?.naturalHeight?
        image.naturalWidth/image.naturalHeight:null,
      promoted:!!article?.classList.contains('lab3-active'),
      applied:!!article?.classList.contains('yofi-subject-bounds-active'),
      debugOutline:bboxOutlineEnabled,
      frameExpansion:{left:hero?.style.getPropertyValue('--bbox-subject-offset-x')||null,
        width:hero?.style.getPropertyValue('--bbox-subject-width')||null,
        height:hero?.style.getPropertyValue('--bbox-subject-height')||null},
      stage:hero?.dataset.lab3Stage||'native',
      artWidth:hero?.style.getPropertyValue('--lab3-art-width')||null,
      artHeight:hero?.style.getPropertyValue('--lab3-art-height')||null,
      sourceRevision:BBOX_TEST_SOURCE};
  }
  window.__yofiSubjectBoundsStatus = bboxTestStatus;

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
      color: var(--skin-bg-text);
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
      color: var(--skin-bg-text) !important;
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

/* AbilityPoolInfo owns <p class="no-margin"><Tag>Hidden</Tag></p>
       followed by <div class="ability">text</div>. Preserve these exact
       Svelte-owned siblings and make BOTH true inline content so the tag
       shares the text line/baseline and text wraps naturally after it.
       Each ordinary Ability remains its own block with regular item spacing.
       No wrappers, floats, positioning, translation or offset compensation. */

article section.abilities > .ability {
      display:block!important;
      margin:0 0 var(--yofi-card-text-gap,.42em)!important;
    }
article section.abilities > .ability:last-child { margin-bottom:0!important; }

article section.abilities > p.no-margin {
      display:inline!important;
      float:none!important;
      margin:0!important;
      padding:0!important;
    }
article section.abilities > p.no-margin + .ability {
      display:inline!important;
      margin:0!important;
      padding:0!important;
    }
/* When native data contains consecutive Hidden abilities, terminate the
       previous inline entry before the next badge without adding a wrapper. */
article section.abilities > p.no-margin + .ability:has(+ p.no-margin)::after {
      content:"\A";
      white-space:pre;
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

article.yofi-scores-layout > .scrollable > section:is(.evolution,.evolutions,.moves,.tms,.tm) > :not(h2) {
      margin-block:0!important;
    }

article.yofi-scores-layout > .scrollable > section:is(.evolution,.evolutions,.moves,.tms,.tm) > :not(h2) + :not(h2) {
      margin-block-start:var(--yofi-card-text-gap)!important;
    }

/* Abilities spacing is owned by the ordinary block entries above. Hidden
       badges are part of the following inline Ability, not separate rows. */

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
    /* Native metadata and Art remain the live read-only sources. Layout
       decisions are made by one solver for compact and promoted cards. */
    article .yofi-species-hero {
      --yofi-hero-gap: clamp(10px, 2.5%, 18px);
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
      /* A real gutter is required even when both biology fields consume
         their entire assigned half; zero gap made Mawile's bars touch. */
      column-gap: var(--yofi-compact-bio-gap, 8px);
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
    /* One actual icon/value field in compact and promoted hero modes. The
       native metadata remains the source; the field itself moves between bars. */
    .yofi-hero-facts > dl.yofi-hero-facts-right {
      container-type: inline-size;
    }
    .yofi-hero-facts .yofi-hero-field-egg {
      display: grid !important;
      grid-template-columns: 1.4em minmax(0, 1fr);
      font-size: clamp(12px, 4.2cqi, 16px) !important;
      align-items: center !important;
      column-gap: .42em !important;
      width: 100%; min-width: 0;
      box-sizing: border-box;
      padding-inline: 6px !important;
    }
    .yofi-hero-field-egg > dt { display: none !important; }
    .yofi-hero-field-egg > .lab3-egg-icon {
      display: grid; place-items: center;
      width: 1.4em; height: 1.4em; min-width: 0;
    }
    .yofi-hero-field-egg > .lab3-egg-icon svg {
      display: block; width: 100%; height: 100%;
      fill: none; stroke: currentColor; stroke-width: 2.1;
    }
    .yofi-hero-facts .yofi-hero-egg-value {
      display: block; min-width: 0;
      font-size: inherit !important;
      text-align: center;
      text-transform: capitalize;
      white-space: nowrap !important;
      overflow-wrap: normal !important;
      word-break: normal !important;
    }
    /* Native gender display, restored from the metadata source. The outer
       three-track toolbar places its center at the same x-coordinate as the
       type pill. Each colored segment uses the native --percent flex basis. */
    .yofi-hero-facts > .yofi-hero-gender {
      min-height: var(--yofi-compact-bio-height, 22px);
      width:100% !important;
      display: inline-flex !important;
      align-items: center;
      justify-content: flex-start;
      min-width: 0;
    }
    .yofi-hero-facts .yofi-hero-gender .gender-ratio-display {
      height:var(--yofi-compact-bio-height, 22px) !important;
      box-sizing:border-box !important;
      display: inline-flex !important;
      /* Between the previous 6.8em compact badge and native 10em badge.
         Same intended size in both hero modes, subject only to space. */
      width: 100% !important;
      max-width: 100% !important;
      flex-shrink: 1;
      height: var(--yofi-compact-bio-height, 22px) !important;
      /* Same radius as the shared promoted biology bar: presentation must
         not depend on whether the native-like layout wins. */
      border-radius: clamp(4px, calc(var(--yofi-compact-bio-height, 22px) * .22), 8px) !important;
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
      /* The All-sex SVG is nested in a .9em ratio label. Compensate
         for the inherited scale so it matches the 1.12em fixed icon slots. */
      width: 1.2444em;
      height: 1.2444em;
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
    return [...document.querySelectorAll(LIVE_CARD_SELECTOR+':not([data-yofi-layout-probe])')].filter(article =>
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
    eggLabel.textContent = "Egg Group:";
    eggField.setAttribute("role", "group");
    eggField.setAttribute("aria-label", "Egg group");
    const eggIcon = document.createElement("span");
    eggIcon.className = "lab3-egg-icon";
    eggIcon.setAttribute("aria-hidden", "true");
    eggIcon.innerHTML = ICON.egg;
    const eggValue = document.createElement("dd");
    eggValue.className = "yofi-hero-egg-value";
    eggField.append(eggIcon, eggLabel, eggValue);
    right.appendChild(eggField);
    const values = { egg: eggValue };
    facts.append(gender, right);
    info.parentElement.insertBefore(hero, info);
    info.classList.add("yofi-hero-art-lane");
    metadata.parentElement.classList.add("yofi-hero-native-metadata");
    description.classList.add("yofi-hero-copy");
    flow.append(info, description);
    hero.append(flow, facts);
    const initialImage = info.querySelector(".square-image img");
    if (initialImage instanceof HTMLImageElement && !initialImage.complete)
      info.classList.add("yofi-hero-art-pending");
    state = { hero, article, info, metadata, description, flow,
      facts, right, gender, values, geometryKey: "", factsKey: "",
      observer: null, resizeObserver: null, width: -1 };
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
    // Semantic normalization is owned by QOL; this renderer only consumes it.
    const forcedSex = ['female','male'].includes(state.article.dataset.yofiForcedSex)
      ? state.article.dataset.yofiForcedSex : null;
    renderHeroGender(gender, state.gender, forcedSex);
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
    // The single geometry solver selects actual occupied-subject dimensions.
    // Do not independently resize the portrait here.
  }

  function updateNativeHero(article) {
    if (!(article instanceof HTMLElement) || !article.querySelector('section.stats')) return;
    if (activeSpeciesHeroState && !activeSpeciesHeroState.hero.isConnected) disconnectSpeciesHero();
    const state = ensureSpeciesHero(article);
    if (!state) return;
    syncHeroFacts(state);
    sizeHeroArt(state);
    // Compact and promoted candidates use the same reusable biology nodes,
    // typography, artwork transform, and geometry selector.
    fitHeroFacts(state);
  }


  const CSS = `
    /* No width/media breakpoints: JS chooses an eligible composition from measured fit. */
    article.lab3-active .yofi-species-hero {
      --lab3-gap: 16px;
      --lab3-tile-gap: 8px;
      --lab3-art-width: 210px;
      --lab3-art-height: 210px;
      --lab3-hero-height: 210px;
      --lab3-row-height: 210px;
      --lab3-lane-width: 210px;
      --lab3-score-row-height: 58px;
      --lab3-score-font-size: 16px;
      --lab3-tile-size: 88px;
      --lab3-side-width: 184px;
      --lab3-copy-width: 240px;
      display: grid !important;
      box-sizing: border-box !important;
      grid-template-columns: var(--lab3-copy-width) minmax(0, var(--lab3-lane-width)) var(--lab3-side-width) !important;
      grid-template-rows: var(--lab3-row-height) !important;
      column-gap: var(--lab3-gap) !important;
      row-gap: 0 !important;
      align-items: start !important;
      width: 100% !important;
      padding-inline: 1em !important;
      margin: 0 !important;
      position: relative;
    }
    article.lab3-active.lab3-bio-full-inline .yofi-species-hero {
      grid-template-rows: var(--lab3-row-height) auto !important;
      row-gap: var(--lab3-tile-gap) !important;
    }
    article.lab3-active.lab3-bio-full-inline .yofi-species-hero > .lab3-biologies {
      grid-column: 1 / -1 !important;
      grid-row: 2 !important;
      display: grid !important;
      grid-template-columns: var(--lab3-bio-gender-width) var(--lab3-bio-egg-width) !important;
      align-items: stretch !important;
      column-gap: var(--lab3-tile-gap) !important;
      width: var(--lab3-bio-total-width) !important;
      margin: 0 !important;
      padding: 0 !important;
      height: var(--lab3-bio-height) !important;
    }
    article.lab3-active.lab3-bio-full-inline .yofi-species-hero > .lab3-biologies > .lab3-biology {
      width: 100% !important;
    }
    /* Two-column candidates still use the same measured grid solver. */
    article.lab3-active:not(.lab3-has-right) .yofi-species-hero {
      grid-template-columns: var(--lab3-copy-width) minmax(0, var(--lab3-lane-width)) !important;
    }
    article.lab3-active:not(.lab3-has-right) .yofi-species-hero > .lab3-right {
      display: none !important;
    }
    article.lab3-active .yofi-species-hero > .yofi-hero-flow,
    article.lab3-active .yofi-species-hero .yofi-hero-short-column {
      display: contents !important; margin: 0 !important; padding: 0 !important;
    }
    article.lab3-active .yofi-species-hero .yofi-hero-copy {
      display: block !important;
      align-self: start !important;
      float: none !important;
      min-width: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    article.lab3-active .yofi-species-hero .yofi-hero-copy p {
      margin: 0 !important;
    }
    article.lab3-active .yofi-species-hero .yofi-hero-copy p + p {
      margin-top: .48em !important;
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
      padding: 0 !important;
      margin: 0 !important;
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
      container-type: inline-size;
      display: flex !important; flex-direction: column;
      align-self: start !important;
      gap: 8px !important;
      /* Exactly one owner for intercomponent spacing: this stack. */
      box-sizing: border-box !important;
      height: var(--lab3-row-height, var(--lab3-art-height)) !important;
      padding: 0 !important;
      margin: 0 !important;
      justify-content: flex-start !important;
    }
    /* Every child's physical bottom is validated; no flex shrink or distributed gaps. */
    article.lab3-active.lab3-distribute-left .yofi-species-hero > .lab3-left-extra {
      justify-content: space-between !important;
    }
    article.lab3-active.lab3-distribute-right .yofi-species-hero > .lab3-right {
      justify-content: space-between !important;
    }
    article.lab3-active .yofi-species-hero > .lab3-left-extra > *,
    article.lab3-active .yofi-species-hero > .lab3-right > * {
      flex-shrink: 0 !important;
      min-height: max-content;
    }
    /* Biology placement is selected with scores, artwork and column slack:
       inline/stacked left, stacked right, or one native bar on each side. */
    article.lab3-active .lab3-biologies.lab3-bio-inline {
      display: grid !important;
      grid-template-columns: var(--lab3-bio-gender-width) var(--lab3-bio-egg-width) !important;
      width: var(--lab3-bio-total-width) !important;
      height: var(--lab3-bio-height) !important;
      align-items: stretch !important;
      gap: var(--lab3-tile-gap) !important;
    }
    article.lab3-active .lab3-biologies.lab3-bio-inline > .lab3-biology {
      width: 100% !important;
      height: var(--lab3-bio-height) !important;
      min-height: var(--lab3-bio-height) !important;
    }
    /* Inline and stacked biology share the SAME scalable icon/text system.
       No compact-specific downscaling can make a truncated inline Egg valid. */
    article.lab3-active .lab3-biologies.lab3-bio-inline .lab3-copy-facts {
      font-size: var(--yofi-hero-facts-font, .75rem) !important;
    }

    article.lab3-active .yofi-species-hero > .lab3-right {
      grid-column: 3 !important; grid-row: 1 !important;
      align-self: start; justify-self: stretch;
      display: flex; flex-direction: column;
      width: var(--lab3-side-width) !important;
      height: var(--lab3-row-height, var(--lab3-art-height)) !important;
      box-sizing: border-box !important;
      min-width: 0; max-width: none;
      gap: var(--lab3-tile-gap);
      justify-content: flex-start;
    }
    article:not(.lab3-active) .lab3-right,
    article:not(.lab3-active) .lab3-left-extra { display: none !important; }
    article.lab3-active.lab3-tiles section.stats > .yofi-vitals-row {
      visibility: hidden !important; position: absolute !important;
      left: 0; top: 0; width: 100% !important; height: auto !important;
      overflow: hidden !important; pointer-events: none !important;
      margin: 0 !important; padding: 0 !important;
    }
    /* One owner for the separation BELOW the entire hero. No hero child
       carries trailing space into Speed/Senses/Skills/Effectiveness. */
    article.lab3-active .yofi-species-hero { margin-bottom: 14px !important; }
    article.lab3-active section.stats { margin-top: 0 !important; }
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
    .lab3-biologies { display:flex; flex-direction:column; gap:var(--lab3-tile-gap); min-width:0; width:var(--lab3-bio-total-width); max-width:var(--lab3-bio-total-width); margin:0!important; }
    /* No stage-dependent biology sizing: the chosen bar height is shared by
       the measurement path and the final inline, stacked, or split bars. */
    article.lab3-active .lab3-biologies:not(.lab3-bio-inline) > .lab3-biology {
      flex: 0 0 var(--lab3-bio-height, 50px) !important;
    }
    .lab3-biology {
      display: flex; align-items: center; justify-content: center;
      box-sizing: border-box; height: var(--lab3-bio-height, 50px);
      min-height: var(--lab3-bio-height, 50px);
      width: 100%; min-width: 0;
      overflow: hidden;
      border-radius: clamp(4px, calc(var(--lab3-bio-height, 22px) * .22), 8px);
      background: rgba(255,255,255,.49);
      padding: 0 9px;
    }
    /* One resolved physical height for BOTH biology bars, in every host.
       Split Egg lives directly in .lab3-right, outside .lab3-biologies,
       so the old group-only no-shrink rule was insufficient. */
    article.lab3-active .yofi-species-hero .lab3-biology {
      max-width:var(--lab3-bio-bar-max, 212px) !important;
      box-sizing: border-box !important;
      height: var(--lab3-bio-height, 50px) !important;
      min-height: var(--lab3-bio-height, 50px) !important;
      max-height: var(--lab3-bio-height, 50px) !important;
      flex-grow: 0 !important;
      flex-shrink: 0 !important;
    }
    .lab3-biology.lab3-gender { padding: 0 !important; background: transparent !important; }
    /* The promoted bar alone is a width-query container. Keep native SVG
       slots and centered text on one proportional font scale, bounded by
       both the real column width and allotted bar height. Unrelated gender
       displays keep their original sizing. */
    article.lab3-active .yofi-species-hero .lab3-biology.lab3-gender {
      container-type: inline-size;
    }
    article.lab3-active .yofi-species-hero .lab3-gender .gender-ratio-display {
      font-size: clamp(12px, min(6.2cqi, calc(var(--lab3-bio-height, 22px) * .46)), 18px) !important;
    }
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
      border-radius: clamp(4px, calc(var(--lab3-bio-height, 22px) * .22), 8px) !important;
      overflow: hidden !important;
    }
    /* Keep the actual gender-segment probability proportions in every
       placement. The compact short-mode fork has been retired. */
    article.lab3-active .yofi-species-hero .lab3-gender .yofi-hero-gender
      .gender-ratio-display > .bar.yofi-gender-segment {
      flex: 0 0 var(--percent) !important;
      min-width: 0 !important;
      padding: 0 !important;
    }
    /* All other segment colors, centered odds and icon slots are inherited
       directly from the extracted native gender selectors. */
    .lab3-egg {
      display: flex; align-items: center; justify-content: stretch;
      container-type: inline-size;
    }
    .lab3-egg .yofi-hero-facts-right {
      display: block !important;
      flex: 1 1 auto; width: 100%; min-width: 0 !important;
      margin: 0 !important; font-size: inherit !important;
    }
    /* A fluid icon track and one no-wrap text track. Font size depends only
       on this bar's measured inline-size (cqi), not inherited em scaling or
       alternate inline/stack overrides. Both modes render identically at the
       same bar width; narrow, overfull modes are rejected by eggFit(). */
    .lab3-egg .yofi-hero-field-egg {
      display: grid !important;
      font-size: clamp(12px, min(6.2cqi, calc(var(--lab3-bio-height, 22px) * .46)), 18px) !important;
      grid-template-columns: 1.12em minmax(0, 1fr) !important;
      column-gap: .30em !important;
      width: 100%; min-width: 0 !important;
      align-items: center !important; margin: 0 !important;
      padding: 0 !important;
    }
    .lab3-egg .yofi-hero-field-egg > .lab3-egg-icon {
      width: 1.12em !important; height: 1.12em !important;
    }
    .lab3-egg .yofi-hero-egg-value {
      display: block !important; min-width: 0 !important;
      margin: 0 !important;
      overflow-wrap: normal !important; word-break: normal !important;
      white-space: nowrap !important;
      font-size: .9em !important;
      font-weight: 400 !important;
      line-height: 1.0 !important;
      text-align: center !important; text-transform: capitalize !important;
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
    /* Keep the native Abilities h2 and Card.svelte skewed ::before banner.
       The same spacing applies to layout probes, so measured height matches
       the promoted section; all banner colors remain theme-owned. */
    article .yofi-species-hero section.abilities:is(.lab3-measure-abilities,.lab3-promoted-abilities) > h2,
    article.lab3-stage3 .lab3-right > section.abilities > h2 {
      display:block;position:relative;box-sizing:border-box;
      margin:0 0 .5em !important;padding:.25em 1em !important;
      width:100%;overflow:hidden;background:transparent !important;
      font-size:var(--lab3-native-ability-heading-font,1.05em) !important;
      line-height:var(--lab3-native-ability-heading-line,1.22) !important;
      font-weight:700;
    }
    /* Native Card.svelte extends the ::before backdrop past the card's left
       edge, where the card clips it straight. Clip at this heading's own left
       edge instead; retain its native skew and the theme's pseudo-element fill.
       The upper-right tip still lands at the available column boundary. */
    article .yofi-species-hero section.abilities:is(.lab3-measure-abilities,.lab3-promoted-abilities) > h2::before,
    article.lab3-stage3 .lab3-right > section.abilities > h2::before {
      inset:0 0 0 -4em !important;
      transform-origin:right top !important;
    }
    /* The same native inline Hidden + Ability flow is used when the entire
       section is promoted. No separate first-line or badge spacing rules. */
    /* Keep the actual QOL definition list and all DT/DD children. Arrange it
       as two three-score bands by placement only; no new score tags exist. */
    article.lab3-scores .yofi-species-hero > :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip {
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
      align-self: start !important;
      text-align: center !important;
      font-size: var(--lab3-score-font-size, clamp(13px,4.8cqi,19px)) !important;
      line-height: 1.2 !important;
      color:var(--skin-bg-text) !important;
      background: linear-gradient(to bottom,
        var(--lab3-score-bg,var(--skin-bg,#71A9D5)) 0,
        var(--lab3-score-bg,var(--skin-bg,#71A9D5)) var(--lab3-score-row-height,58px),
        transparent var(--lab3-score-row-height,58px),
        transparent calc(var(--lab3-score-row-height,58px) + var(--lab3-tile-gap,8px)),
        var(--lab3-score-bg,var(--skin-bg,#71A9D5)) calc(var(--lab3-score-row-height,58px) + var(--lab3-tile-gap,8px)),
        var(--lab3-score-bg,var(--skin-bg,#71A9D5)) 100%) !important;
    }
    article.lab3-scores :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :is(dt,dd) {
      display: block !important;
      position:relative !important;z-index:1 !important;
      grid-area: auto !important;
      min-width:0; margin:0 !important; padding:0 !important;
      width: 100%; align-self:center !important;
      font-size:inherit !important;
      line-height: 1.15 !important;
      white-space:nowrap !important;
      text-align:center !important;
      color:var(--skin-bg-text) !important;
      background:none !important;
    }
    article.lab3-scores :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > dt {
      font-weight:700 !important; text-transform:uppercase !important;
      text-decoration:underline dotted;
      text-underline-offset:.12em;
    }
    article.lab3-scores :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(1) {grid-row:1 !important;grid-column:1 !important;}
    article.lab3-scores :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(2) {grid-row:2 !important;grid-column:1 !important;}
    article.lab3-scores :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(3) {grid-row:1 !important;grid-column:2 !important;}
    article.lab3-scores :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(4) {grid-row:2 !important;grid-column:2 !important;}
    article.lab3-scores :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(5) {grid-row:1 !important;grid-column:3 !important;}
    article.lab3-scores :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(6) {grid-row:2 !important;grid-column:3 !important;}
    article.lab3-scores :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(7) {grid-row:4 !important;grid-column:1 !important;}
    article.lab3-scores :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(8) {grid-row:5 !important;grid-column:1 !important;}
    article.lab3-scores :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(9) {grid-row:4 !important;grid-column:2 !important;}
    article.lab3-scores :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(10){grid-row:5 !important;grid-column:2 !important;}
    article.lab3-scores :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(11){grid-row:4 !important;grid-column:3 !important;}
    article.lab3-scores :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(12){grid-row:5 !important;grid-column:3 !important;}

    /* One-row scores reuse the SAME six DT/DD pairs as the native strip.
       This is an intrinsic measured geometry, not a species exception. */
    article.lab3-scores.lab3-score-single .yofi-species-hero > :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip {
      grid-template-columns: repeat(6,minmax(0,1fr)) !important;
      grid-template-rows: repeat(2,calc(var(--lab3-score-row-height,58px)/2)) !important;
      min-height: var(--lab3-score-row-height,58px) !important;
      background: var(--lab3-score-bg,var(--skin-bg,#71A9D5)) !important;
    }
    article.lab3-scores.lab3-score-single :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(1) { grid-row:1 !important;grid-column:1 !important;}
    article.lab3-scores.lab3-score-single :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(2) { grid-row:2 !important;grid-column:1 !important;}
    article.lab3-scores.lab3-score-single :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(3) { grid-row:1 !important;grid-column:2 !important;}
    article.lab3-scores.lab3-score-single :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(4) { grid-row:2 !important;grid-column:2 !important;}
    article.lab3-scores.lab3-score-single :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(5) { grid-row:1 !important;grid-column:3 !important;}
    article.lab3-scores.lab3-score-single :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(6) { grid-row:2 !important;grid-column:3 !important;}
    article.lab3-scores.lab3-score-single :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(7) { grid-row:1 !important;grid-column:4 !important;}
    article.lab3-scores.lab3-score-single :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(8) { grid-row:2 !important;grid-column:4 !important;}
    article.lab3-scores.lab3-score-single :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(9) { grid-row:1 !important;grid-column:5 !important;}
    article.lab3-scores.lab3-score-single :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(10) { grid-row:2 !important;grid-column:5 !important;}
    article.lab3-scores.lab3-score-single :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(11) { grid-row:1 !important;grid-column:6 !important;}
    article.lab3-scores.lab3-score-single :is(.lab3-left-extra,.lab3-right) > dl.yofi-scores-strip > :nth-child(12) { grid-row:2 !important;grid-column:6 !important;}

    /* The native-like and expanded arrangements move the SAME two complete
       lab3-biology components; the root facts grid merely hosts them. */
    article:not(.lab3-active) .yofi-species-hero {
      --lab3-bio-height: var(--yofi-compact-bio-height, 22px);
    }
    article .yofi-species-hero .yofi-hero-facts:not(.lab3-copy-facts) > .lab3-biology {
      box-sizing:border-box !important;
      width:100% !important;
      min-width:0 !important;
      height:var(--lab3-bio-height) !important;
      min-height:var(--lab3-bio-height) !important;
      margin:0 !important;
      align-self:stretch !important;
    }
    article .yofi-species-hero .lab3-biology.lab3-gender {
      container-type:inline-size;
    }
    article .yofi-species-hero .lab3-biology > .lab3-copy-facts {
      display:flex !important;
      align-items:stretch !important;
      justify-content:stretch !important;
      box-sizing:border-box !important;
      width:100% !important;
      height:100% !important;
      margin:0 !important;
      padding:0 !important;
    }
    article .yofi-species-hero .lab3-biology .lab3-copy-facts > .yofi-hero-gender {
      width:100% !important;
      height:100% !important;
      min-height:0 !important;
      margin:0 !important;
      padding:0 !important;
      display:flex !important;
      align-items:stretch !important;
    }
    article .yofi-species-hero .lab3-biology.lab3-gender .gender-ratio-display {
      display:flex !important;
      width:100% !important;
      max-width:none !important;
      height:100% !important;
      min-height:0 !important;
      font-size:clamp(12px, min(6.2cqi, calc(var(--lab3-bio-height) * .46)), 18px) !important;
      border-radius:clamp(4px, calc(var(--lab3-bio-height, 22px) * .22), 8px) !important;
      box-sizing:border-box !important;
    }
    /* Readable 1:1 proportions must remain fixed in both hosts. */
    article .yofi-species-hero .lab3-gender .gender-ratio-display > .bar.yofi-gender-segment {
      flex:0 0 var(--percent) !important;
      min-width:0 !important;
      padding:0 !important;
    }
  `;

  const SUBJECT_BOUNDS_CSS = `
    article.lab3-scores.lab3-flow-score .yofi-species-hero > .yofi-hero-flow > dl.yofi-scores-strip {
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
      align-self: start !important;
      text-align: center !important;
      font-size: var(--lab3-score-font-size, clamp(13px,4.8cqi,19px)) !important;
      line-height: 1.2 !important;
      color:var(--skin-bg-text) !important;
      background: linear-gradient(to bottom,
        var(--lab3-score-bg,var(--skin-bg,#71A9D5)) 0,
        var(--lab3-score-bg,var(--skin-bg,#71A9D5)) var(--lab3-score-row-height,58px),
        transparent var(--lab3-score-row-height,58px),
        transparent calc(var(--lab3-score-row-height,58px) + var(--lab3-tile-gap,8px)),
        var(--lab3-score-bg,var(--skin-bg,#71A9D5)) calc(var(--lab3-score-row-height,58px) + var(--lab3-tile-gap,8px)),
        var(--lab3-score-bg,var(--skin-bg,#71A9D5)) 100%) !important;
    }
    article.lab3-scores.lab3-flow-score .yofi-hero-flow > dl.yofi-scores-strip > :is(dt,dd) {
      display: block !important;
      position:relative !important;z-index:1 !important;
      grid-area: auto !important;
      min-width:0; margin:0 !important; padding:0 !important;
      width: 100%; align-self:center !important;
      font-size:inherit !important;
      line-height: 1.15 !important;
      white-space:nowrap !important;
      text-align:center !important;
      color:var(--skin-bg-text) !important;
      background:none !important;
    }
    article.lab3-scores.lab3-flow-score .yofi-hero-flow > dl.yofi-scores-strip > dt {
      font-weight:700 !important; text-transform:uppercase !important;
      text-decoration:underline dotted;
      text-underline-offset:.12em;
    }
    article.lab3-scores.lab3-flow-score .yofi-hero-flow > dl.yofi-scores-strip > :nth-child(1) {grid-row:1 !important;grid-column:1 !important;}
    article.lab3-scores.lab3-flow-score .yofi-hero-flow > dl.yofi-scores-strip > :nth-child(2) {grid-row:2 !important;grid-column:1 !important;}
    article.lab3-scores.lab3-flow-score .yofi-hero-flow > dl.yofi-scores-strip > :nth-child(3) {grid-row:1 !important;grid-column:2 !important;}
    article.lab3-scores.lab3-flow-score .yofi-hero-flow > dl.yofi-scores-strip > :nth-child(4) {grid-row:2 !important;grid-column:2 !important;}
    article.lab3-scores.lab3-flow-score .yofi-hero-flow > dl.yofi-scores-strip > :nth-child(5) {grid-row:1 !important;grid-column:3 !important;}
    article.lab3-scores.lab3-flow-score .yofi-hero-flow > dl.yofi-scores-strip > :nth-child(6) {grid-row:2 !important;grid-column:3 !important;}
    article.lab3-scores.lab3-flow-score .yofi-hero-flow > dl.yofi-scores-strip > :nth-child(7) {grid-row:4 !important;grid-column:1 !important;}
    article.lab3-scores.lab3-flow-score .yofi-hero-flow > dl.yofi-scores-strip > :nth-child(8) {grid-row:5 !important;grid-column:1 !important;}
    article.lab3-scores.lab3-flow-score .yofi-hero-flow > dl.yofi-scores-strip > :nth-child(9) {grid-row:4 !important;grid-column:2 !important;}
    article.lab3-scores.lab3-flow-score .yofi-hero-flow > dl.yofi-scores-strip > :nth-child(10){grid-row:5 !important;grid-column:2 !important;}
    article.lab3-scores.lab3-flow-score .yofi-hero-flow > dl.yofi-scores-strip > :nth-child(11){grid-row:4 !important;grid-column:3 !important;}
    article.lab3-scores.lab3-flow-score .yofi-hero-flow > dl.yofi-scores-strip > :nth-child(12){grid-row:5 !important;grid-column:3 !important;}

    /* The native right float can optionally exclude its opaque contour,
       rather than its rectangular lane. The art remains top-aligned and
       the sparkle button keeps its own position and collision checks. */
    article.lab3-active.lab3-flow.lab3-contour-flow
      .yofi-hero-flow > section.info.yofi-hero-art-lane {
      shape-outside: var(--lab3-contour-shape, none) !important;
      -webkit-shape-outside: var(--lab3-contour-shape, none) !important;
      shape-margin: 0 !important;
    }
    /* Place the *full, unchanged source image* so its visible alpha
       bounds occupy the candidate's image box in compact and expanded cards.
       These selectors must tie or outrank the !important lab3 image sizes
       above. A weaker selector makes the full-canvas crop run on the already
       subject-sized image, shrinking the artwork a second time.
       No contour collision yet. */
    /* The figure itself IS the visible subject frame. QoL already anchors
       its draggable button at the four figure corners, so do not style or
       move that button from Species Card. The bounding frame may grow by
       one icon width per side only when every corner intersects the subject. */
    article.yofi-subject-bounds-active .yofi-species-hero .yofi-hero-art-lane .square-image > figure {
      position:relative!important;
      box-sizing:border-box!important;
      display:block!important;
      width:var(--bbox-subject-width)!important;
      max-width:none!important;
      height:var(--bbox-subject-height)!important;
      min-height:var(--bbox-subject-height)!important;
      padding:0!important;
      margin:var(--bbox-figure-y) 0 0 var(--bbox-figure-x)!important;
      overflow:visible!important;
    }
    article.yofi-subject-bounds-active .yofi-species-hero .yofi-hero-art-lane .square-image {
      overflow:visible!important;
    }
    article.yofi-subject-bounds-active .yofi-species-hero .yofi-hero-art-lane figcaption {
      position:absolute!important;
      top:calc(100% + 4px)!important;
      left:0!important;
      width:100%!important;
    }
    article.yofi-subject-bounds-active .yofi-species-hero .yofi-hero-art-lane .square-image img-zoom {
      position:absolute!important;
      top:var(--bbox-canvas-y)!important;
      left:var(--bbox-canvas-x)!important;
      width:var(--bbox-canvas-w)!important;
      height:var(--bbox-canvas-h)!important;
      max-width:none!important;
      max-height:none!important;
      margin:0!important;
      padding:0!important;
      aspect-ratio:auto!important;
      clip-path:inset(var(--bbox-clip-top) var(--bbox-clip-right) var(--bbox-clip-bottom) var(--bbox-clip-left));
    }
    article.yofi-subject-bounds-active .yofi-species-hero .yofi-hero-art-lane .square-image img-zoom > img {
      width:100%!important;height:100%!important;
      max-width:none!important;max-height:none!important;
      aspect-ratio:auto!important;object-fit:fill!important;
      -webkit-user-drag:none!important;user-select:none!important;
      margin:0!important;padding:0!important;
    }
    /* Working diagnostic: subject rectangle, not the expanded icon frame. */
    article.yofi-subject-bounds-active.yofi-subject-outline-debug
      .yofi-species-hero .yofi-hero-art-lane .square-image > figure::after {
      content:'' !important;
      position:absolute !important;
      z-index:45 !important;
      pointer-events:none !important;
      box-sizing:border-box !important;
      left:var(--bbox-subject-offset-x) !important;
      top:var(--bbox-subject-offset-y) !important;
      width:var(--lab3-art-width) !important;
      height:var(--lab3-art-height) !important;
      border:1px solid #f00 !important;
      background:transparent !important;
    }
    /* Clip the image itself, never its containing figure: the QoL drag
       control must remain visible at any of the four bounding-box corners. */
    article.yofi-subject-bounds-active .yofi-species-hero
      .yofi-hero-art-lane .square-image > figure {
      overflow: visible !important;
    }
    /* Keep the full source PNG inside its visible subject frame instead of
       leaving a clipped but scrollable full-canvas box outside the card.
       The figure and its separate QoL sparkle control remain untouched. */
    article.yofi-subject-bounds-active .yofi-species-hero .yofi-hero-art-lane .square-image img-zoom {
      top:0!important;left:0!important;
      width:var(--bbox-subject-width)!important;
      height:var(--bbox-subject-height)!important;
      max-width:none!important;max-height:none!important;
      clip-path:none!important;
      overflow:clip!important;
    }
    article.yofi-subject-bounds-active .yofi-species-hero .yofi-hero-art-lane .square-image img-zoom > img {
      position:absolute!important;
      top:var(--bbox-canvas-y)!important;
      left:var(--bbox-canvas-x)!important;
      width:var(--bbox-canvas-w)!important;
      height:var(--bbox-canvas-h)!important;
      max-width:none!important;max-height:none!important;
      clip-path:inset(var(--bbox-clip-top) var(--bbox-clip-right) var(--bbox-clip-bottom) var(--bbox-clip-left))!important;
    }
    /* No Species Card icon positioning selectors. QoL's original four-corner
       CSS, pointer handling and saved data-yofi-corner remain authoritative. */

    article.lab3-active.lab3-flow .yofi-species-hero {
      display: block !important;
      grid-template-columns: none !important;
      grid-template-rows: none !important;
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 0 1em !important;
      margin-bottom: 14px !important;
    }
    article.lab3-active.lab3-flow .yofi-species-hero > .yofi-hero-flow {
      display: flow-root !important;
      width: 100% !important;
      min-width: 0 !important;
      height: auto !important;
    }
    article.lab3-active.lab3-flow .yofi-species-hero .yofi-hero-flow > section.info.yofi-hero-art-lane {
      display: block !important;
      float: right !important;
      clear: none !important;
      position: static !important;
      width: var(--lab3-lane-width) !important;
      margin: 0 0 0 var(--lab3-gap) !important;
      padding: 0 !important;
    }
    article.lab3-active.lab3-flow .yofi-species-hero .yofi-hero-copy {
      display: block !important;
      float: none !important;
      width: auto !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow-wrap: anywhere;
    }
    article.lab3-active.lab3-flow .yofi-species-hero > :is(.lab3-left-extra,.lab3-right) {
      display: none !important;
    }
    /* Compact flow may host both native bars as a real-height stack next
       to the portrait, below the copy. No duplicate biology DOM is created. */
    article.lab3-active.lab3-flow.lab3-bio-flow-stack .yofi-species-hero .yofi-hero-flow > .lab3-biologies {
      display: flex !important;
      flex-direction: column !important;
      width: var(--lab3-bio-total-width) !important;
      max-width: var(--lab3-bio-total-width) !important;
      height: calc(2*var(--lab3-bio-height) + var(--lab3-tile-gap)) !important;
      gap: var(--lab3-tile-gap) !important;
      margin: var(--lab3-tile-gap) 0 0 !important;
      padding: 0 !important;
      clear: none !important;
    }
    article.lab3-active.lab3-flow.lab3-bio-flow-stack .yofi-hero-flow > .lab3-biologies > .lab3-biology {
      width: 100% !important;
      height: var(--lab3-bio-height) !important;
    }
    article.lab3-active.lab3-flow.lab3-flow-score.lab3-bio-flow-inline
      .yofi-species-hero > .yofi-hero-flow {
      grid-template-rows: max-content max-content max-content !important;
    }
    article.lab3-active.lab3-flow.lab3-flow-score.lab3-bio-flow-inline
      .yofi-hero-flow > dl.yofi-scores-strip {
      grid-column: 1 !important;
      grid-row: 2 !important;
      width: var(--lab3-copy-width) !important;
      min-width: 0 !important;
      margin: 0 !important;
    }
    article.lab3-active.lab3-flow.lab3-flow-score.lab3-bio-flow-inline
      .yofi-hero-flow > .lab3-biologies {
      grid-row: 3 !important;
    }
    article.lab3-active.lab3-flow.lab3-flow-score.lab3-bio-flow-inline
      .yofi-hero-flow > section.info.yofi-hero-art-lane {
      grid-row: 1 / 4 !important;
    }
    article.lab3-active.lab3-flow.lab3-bio-flow-inline
      .yofi-species-hero > .yofi-hero-flow {
      display: grid !important;
      grid-template-columns: var(--lab3-copy-width) minmax(0, var(--lab3-lane-width)) !important;
      grid-template-rows: max-content max-content !important;
      column-gap: var(--lab3-gap) !important;
      row-gap: var(--lab3-tile-gap) !important;
      width: 100% !important;
      height: auto !important;
      min-height: var(--lab3-row-height) !important;
      min-width: 0 !important;
      align-items: start !important;
      align-content: start !important;
    }
    article.lab3-active.lab3-flow.lab3-bio-flow-inline
      .yofi-hero-flow > .yofi-hero-copy {
      float: none !important;
      grid-column: 1 !important;
      grid-row: 1 !important;
      width: var(--lab3-copy-width) !important;
      min-width: 0 !important;
    }
    article.lab3-active.lab3-flow.lab3-bio-flow-inline
      .yofi-hero-flow > section.info.yofi-hero-art-lane {
      float: none !important;
      grid-column: 2 !important;
      grid-row: 1 / 3 !important;
      width: var(--lab3-lane-width) !important;
      margin: 0 !important;
    }
    article.lab3-active.lab3-flow.lab3-bio-flow-inline
      .yofi-hero-flow > .lab3-biologies {
      grid-column: 1 !important;
      grid-row: 2 !important;
      margin: 0 !important;
    }
    /* Wide subjects and long descriptions: house a compact native biology
       stack directly BELOW the artwork track, without a wasted card-wide
       biology row. The description remains beside the art. */
    article.lab3-active.lab3-flow.lab3-bio-flow-right-stack
      .yofi-species-hero > .yofi-hero-flow {
      display: grid !important;
      grid-template-columns: var(--lab3-copy-width) minmax(0, var(--lab3-lane-width)) !important;
      grid-template-rows: max-content max-content !important;
      column-gap: var(--lab3-gap) !important;
      row-gap: var(--lab3-tile-gap) !important;
      width: 100% !important;
      height: auto !important;
      min-height: var(--lab3-row-height) !important;
      min-width: 0 !important;
      align-content: start !important;
    }
    article.lab3-active.lab3-flow.lab3-bio-flow-right-stack
      .yofi-hero-flow > .yofi-hero-copy {
      grid-column: 1 !important;
      grid-row: 1 / 3 !important;
      float: none !important;
      width: var(--lab3-copy-width) !important;
      min-width: 0 !important;
    }
    article.lab3-active.lab3-flow.lab3-bio-flow-right-stack
      .yofi-hero-flow > section.info.yofi-hero-art-lane {
      grid-column: 2 !important;
      grid-row: 1 !important;
      float: none !important;
      width: var(--lab3-lane-width) !important;
      min-height: calc(var(--lab3-art-height) + var(--lab3-art-top-gap, 8px)) !important;
      margin: 0 !important;
    }
    article.lab3-active.lab3-flow.lab3-bio-flow-right-stack
      .yofi-hero-flow > .lab3-biologies {
      display: flex !important;
      flex-direction: column !important;
      grid-column: 2 !important;
      grid-row: 2 !important;
      width: var(--lab3-bio-total-width) !important;
      max-width: var(--lab3-bio-total-width) !important;
      height: calc(2 * var(--lab3-bio-height) + var(--lab3-tile-gap)) !important;
      gap: var(--lab3-tile-gap) !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    article.lab3-active.lab3-flow.lab3-bio-flow-right-stack
      .yofi-hero-flow > .lab3-biologies > .lab3-biology {
      width: 100% !important;
      height: var(--lab3-bio-height) !important;
    }
    /* Compact Scores + stacked biology in the shorter COPY column.
       It is a grid composition, not contour text flow; source nodes remain
       unchanged and the subject stays in its separate right lane. */
    article.lab3-active.lab3-flow.lab3-flow-score.lab3-bio-flow-stack
      .yofi-species-hero > .yofi-hero-flow {
      display:grid !important;
      grid-template-columns:var(--lab3-copy-width) minmax(0,var(--lab3-lane-width)) !important;
      grid-template-rows:max-content max-content max-content !important;
      column-gap:var(--lab3-gap) !important;
      row-gap:var(--lab3-tile-gap) !important;
      align-content:start !important;
      align-items:start !important;
      min-height:var(--lab3-row-height) !important;
    }
    article.lab3-active.lab3-flow.lab3-flow-score.lab3-bio-flow-stack
      .yofi-hero-flow > .yofi-hero-copy {
      grid-column:1 !important;grid-row:1 !important;
      float:none !important;width:var(--lab3-copy-width) !important;
    }
    article.lab3-active.lab3-flow.lab3-flow-score.lab3-bio-flow-stack
      .yofi-hero-flow > dl.yofi-scores-strip {
      grid-column:1 !important;grid-row:2 !important;
      width:var(--lab3-copy-width) !important;
    }
    article.lab3-active.lab3-flow.lab3-flow-score.lab3-bio-flow-stack
      .yofi-hero-flow > .lab3-biologies {
      grid-column:1 !important;grid-row:3 !important;
      margin:0 !important;
    }
    article.lab3-active.lab3-flow.lab3-flow-score.lab3-bio-flow-stack
      .yofi-hero-flow > section.info.yofi-hero-art-lane {
      float:none !important;grid-column:2 !important;
      grid-row:1 / 4 !important;width:var(--lab3-lane-width) !important;
      margin:0 !important;
    }
    /* Narrow layout: when real Egg ink fits, the two short biology bars
       share a single row immediately BELOW the description, next to artwork.
       The native elements are moved, not recreated. */
    article.lab3-active.lab3-flow.lab3-bio-flow-inline
      .yofi-species-hero .yofi-hero-flow > .lab3-biologies {
      display: grid !important;
      grid-template-columns: var(--lab3-bio-gender-width) var(--lab3-bio-egg-width) !important;
      width: var(--lab3-bio-total-width) !important;
      max-width: var(--lab3-bio-total-width) !important;
      height: var(--lab3-bio-height) !important;
      gap: var(--lab3-tile-gap) !important;
      margin: var(--lab3-tile-gap) 0 0 !important;
      padding: 0 !important;
      clear: none !important;
    }
    article.lab3-active.lab3-flow.lab3-bio-flow-inline
      .yofi-hero-flow > .lab3-biologies > .lab3-biology {
      height: var(--lab3-bio-height) !important;
      width: 100% !important;
    }
    article.lab3-active.lab3-flow .yofi-species-hero > .lab3-biologies {
      display: grid !important;
      grid-template-columns: var(--lab3-bio-gender-width) var(--lab3-bio-egg-width) !important;
      align-items: stretch !important;
      column-gap: var(--lab3-tile-gap) !important;
      width: var(--lab3-bio-total-width) !important;
      height: var(--lab3-bio-height) !important;
      margin: var(--lab3-tile-gap) 0 0 !important;
      padding: 0 !important;
    }
    article.lab3-active.lab3-flow .yofi-species-hero > .lab3-biologies > .lab3-biology {
      width: 100% !important;
      height: var(--lab3-bio-height) !important;
      min-height: var(--lab3-bio-height) !important;
    }
  `;

  function installCSS() {
    let node = document.getElementById(STYLE_ID);
    if (!node) {
      node = document.createElement('style');
      node.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(node);
    }
    if (node.textContent !== CSS + SUBJECT_BOUNDS_CSS) node.textContent = CSS + SUBJECT_BOUNDS_CSS;
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
    const match = data.lvl.value.match(/^([1-9]\d*)$/);
    if (match) {
      const level = Number(match[1]);
      if (level >= 1 && level < MAX_ENCOUNTER_LEVEL)
        data.lvl.value = `${level}+`;
    }
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
    return {hero,left,biologies,gender,genderBody,egg,side,vitals,
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
  /* GEO-01-R02: independent promotions are capabilities, not mandatory
     sequential layouts. Selection uses actual content bounds, page footprint
     and artwork occupancy; the original nodes and styles remain authoritative. */
  const TILE_GAP = 8;
  const SCORE_ROW = 58;
  const MIN_SCORE_ROW = 40;
  const MIN_TILE = 82;
  const MAX_TILE = 112;
  // Preserve the 2x2 Vitals comparison as a preference for wide heroes,
  // not as a 172px minimum imposed on every compact subject.
  const ALIGN_TOLERANCE = 3;
  const MAX_SCORE_ROW = 68;
  const ART_WIDTH_PROGRESS = Object.freeze({
    ceiling: 435, shrinkTolerance: .045
  });
  // Exterior alpha-contour enclosure within the existing subject bounding box.
  // All 1,139 native NORMAL main.png images. Threshold alpha>=90/255;
  // external contours are filled, including holes, without bridging gaps.
  // Computed offline only; no canvas sampling or per-navigation pixel work.
  const SUBJECT_CONTOUR_COVERAGE_10000 = Object.freeze({"abomasnow":6050,"abra":4562,"absol":4305,"accelgor":4101,"aegislash":4401,"aerodactyl":3202,"aggron":6268,"aipom":3839,"alakazam":4239,"alcremie":6556,"alolan-diglett":5777,"alolan-dugtrio":6499,"alolan-exeggutor":2467,"alolan-geodude":5720,"alolan-golem":6694,"alolan-graveler":4542,"alolan-grimer":5138,"alolan-marowak":4313,"alolan-meowth":4686,"alolan-muk":5319,"alolan-ninetales":4399,"alolan-persian":4469,"alolan-raichu":5045,"alolan-raticate":5520,"alolan-rattata":4417,"alolan-sandshrew":5770,"alolan-sandslash":4770,"alolan-vulpix":5666,"alomomola":5879,"altaria":4647,"amaura":3551,"ambipom":3840,"amoonguss":6648,"ampharos":3665,"annihilape":4629,"anorith":4170,"appletun":5918,"applin":6202,"araquanid":5109,"arbok":6112,"arboliva":2818,"arcanine":5835,"arcanine-hisui":5594,"arceus":3283,"archaludon":5335,"archen":4367,"archeops":4153,"arctibax":4548,"arctovish":6075,"arctozolt":4497,"ariados":4080,"armaldo":4696,"armarouge":4909,"aromatisse":6504,"aron":6740,"arrokuda":3625,"articuno":4456,"articuno-galar":3899,"audino":6090,"aurorus":4521,"avalugg":5891,"avalugg-hisui":6230,"axew":4486,"azelf":5377,"azumarill":4645,"azurill":6085,"bagon":5525,"baltoy":4114,"banette":4579,"barbaracle":3526,"barboach":4325,"barraskewda":3877,"basculegion-f":4478,"basculegion-m":4665,"basculin":3908,"basculin-blue-striped":5272,"basculin-white-striped":5472,"bastiodon":6037,"baxcalibur":4908,"bayleef":4377,"beartic":4519,"beautifly":4560,"beedrill":4273,"beheeyem":5008,"beldum":6450,"bellibolt":7081,"bellossom":5789,"bellsprout":3632,"bergmite":5294,"bewear":5375,"bibarel":6284,"bidoof":6866,"binacle":4971,"bisharp":4958,"blacephalon":3171,"black-kyurem":4149,"blastoise":6436,"blaziken":4225,"blipbug":4751,"blissey":6474,"blitzle":4510,"boldore":5587,"boltund":3312,"bombirdier":3046,"bonsly":5115,"bouffalant":5239,"bounsweet":5535,"braixen":4527,"brambleghast":5812,"bramblin":5191,"braviary":4227,"braviary-hisui":3841,"breloom":4137,"brionne":5113,"bronzong":4215,"bronzor":6621,"brute-bonnet":7124,"bruxish":5014,"budew":6863,"buizel":3888,"bulbasaur":7157,"buneary":4985,"bunnelby":4382,"burmy":5583,"butterfree":6153,"buzzwole":4655,"cacnea":4975,"cacturne":3794,"calyrex":4644,"calyrex-ice":4653,"calyrex-shadow":4510,"camerupt":6553,"capsakid":6224,"carbink":5647,"carkol":6061,"carnivine":3923,"carracosta":6294,"carvanha":4324,"cascoon":3601,"castform":6042,"caterpie":5443,"celebi":4275,"celesteela":3815,"centiskorch":3482,"ceruledge":2726,"cetitan":4882,"cetoddle":4536,"chandelure":4039,"chansey":6473,"charcadet":4973,"charizard":5263,"charjabug":7585,"charmander":4755,"charmeleon":4255,"chatot":4348,"cherrim":6180,"cherubi":5855,"chesnaught":4255,"chespin":4832,"chewtle":5821,"chi-yu":3529,"chien-pao":4270,"chikorita":4253,"chimchar":5247,"chimecho":3796,"chinchou":3360,"chingling":4034,"cinccino":6560,"cinderace":3485,"clamperl":7793,"clauncher":4004,"clawitzer":3574,"claydol":6043,"clefable":6191,"clefairy":7247,"cleffa":6483,"clobbopus":6611,"clodsire":7559,"cloyster":5172,"coalossal":5522,"cobalion":4523,"cofagrigus":3720,"combee":4579,"combusken":3378,"comfey":7371,"conkeldurr":6583,"copperajah":6037,"corphish":5786,"corsola":4575,"corviknight":4690,"corvisquire":4455,"cosmoem":5983,"cosmog":3997,"cottonee":6143,"crabominable":4524,"crabrawler":4464,"cradily":4891,"cramorant":3964,"cranidos":4732,"crawdaunt":5244,"cresselia":4212,"croagunk":5900,"crobat":2695,"crocalor":5795,"croconaw":4479,"crustle":6741,"cryogonal":6587,"cubchoo":6922,"cubone":6067,"cufant":5265,"cursola":3307,"cutiefly":3613,"cyclizar":3911,"cyndaquil":4687,"dachsbun":6119,"darkrai":4264,"darmanitan":4364,"dartrix":5349,"darumaka":5624,"dawn-wings-necrozma":4342,"decidueye":4942,"decidueye-hisui":5009,"dedenne":6030,"deerling":4466,"deino":4482,"delcatty":4674,"delibird":5617,"delphox":3813,"deoxys":2744,"dewgong":5296,"dewott":4510,"dewpider":6290,"dhelmise":5329,"dialga":3722,"dialga-origin":4327,"diancie":4480,"diggersby":5092,"diglett":6536,"dipplin":3809,"ditto":7058,"dodrio":3094,"doduo":2701,"dolliv":4900,"dondozo":6037,"donphan":6141,"dottler":6952,"doublade":4932,"dracovish":6066,"dracozolt":3740,"dragalge":2296,"dragapult":4238,"dragonair":3034,"dragonite":4567,"drakloak":3851,"drampa":5442,"drapion":4506,"dratini":3025,"drednaw":5822,"dreepy":3289,"drifblim":4203,"drifloon":3117,"drilbur":5490,"drizzile":3435,"drowzee":6562,"druddigon":4896,"dubwool":6205,"ducklett":5529,"dudunsparce":5750,"dugtrio":6314,"dunsparce":4252,"duosion":7673,"duraludon":4994,"durant":5285,"dusclops":3905,"dusk-mane-necrozma":3949,"dusknoir":4760,"duskull":5978,"dustox":5502,"dwebble":6668,"eelektrik":4613,"eelektross":5627,"eevee":5205,"eiscue":5914,"ekans":6248,"eldegoss":7094,"electabuzz":3433,"electivire":4838,"electrike":6290,"electrode":7778,"electrode-hisui":7859,"elekid":3504,"elgyem":5911,"emboar":5967,"emolga":5019,"empoleon":4151,"enamorus":5365,"enamorus-therian":4094,"entei":5281,"escavalier":4532,"espathra":4115,"espeon":3256,"espurr":6033,"eternatus":2852,"eternatus-eternamax":3577,"excadrill":5401,"exeggcute":6365,"exeggutor":4034,"exploud":5724,"falinks":5753,"farfetchd":5168,"farigiraf":3154,"fearow":3746,"feebas":5492,"fennekin":5390,"feraligatr":4632,"ferroseed":5520,"ferrothorn":3475,"fezandipiti":3647,"fidough":7263,"finizen":5188,"finneon":5207,"flaaffy":5043,"flabebe":4669,"flamigo":2851,"flapple":4621,"flareon":5402,"fletchinder":3720,"fletchling":3856,"flittle":6248,"floatzel":4247,"floette":4087,"floette-eternal":2796,"floragato":4629,"florges":4294,"flutter-mane":3974,"flygon":3825,"fomantis":6595,"foongus":6199,"forretress":6218,"fraxure":4870,"frigibax":5487,"frillish":3815,"froakie":6149,"frogadier":3723,"froslass":6516,"frosmoth":3791,"fuecoco":5121,"furfrou":5715,"furret":5367,"gabite":4095,"galarian-corsola":4160,"galarian-darmanitan":6397,"galarian-darumaka":6380,"galarian-farfetchd":3229,"galarian-linoone":3715,"galarian-meowth":4780,"galarian-mr-mime":3583,"galarian-ponyta":6316,"galarian-rapidash":5810,"galarian-slowbro":5527,"galarian-slowking":5785,"galarian-slowpoke":5849,"galarian-stunfisk":5246,"galarian-weezing":3402,"galarian-yamask":3279,"galarian-zigzagoon":5439,"gallade":2673,"galvantula":4934,"garbodor":6299,"garchomp":4366,"gardevoir":3272,"garganacl":6374,"gastly":6100,"gastrodon":5181,"genesect":4780,"gengar":5366,"geodude":4948,"gholdengo":4009,"gible":5812,"gigalith":4508,"gimmighoul":6203,"gimmighoul-roaming":3845,"girafarig":3987,"giratina-altered-forme":4705,"giratina-origin-forme":6438,"glaceon":2772,"glalie":6428,"glameow":4764,"glastrier":4608,"gligar":5474,"glimmet":5145,"glimmora":6217,"gliscor":4808,"gloom":5501,"gogoat":5474,"golbat":3795,"goldeen":5146,"golduck":3552,"golem":5918,"golett":5849,"golisopod":4515,"golurk":6104,"goodra":3656,"goodra-hisui":5796,"goomy":5055,"gorebyss":2910,"gossifleur":6117,"gothita":5765,"gothitelle":4686,"gothorita":4585,"gouging-fire":4625,"gourgeist":4197,"grafaiai":5319,"granbull":5014,"grapploct":5446,"graveler":5307,"great-tusk":6002,"greavard":5039,"greedent":7143,"greninja":2854,"grimer":5426,"grimmsnarl":3829,"grookey":5526,"grotle":6174,"groudon":5257,"groudon-primal":4936,"grovyle":3706,"growlithe":6155,"growlithe-hisui":5322,"grubbin":6274,"grumpig":5121,"gulpin":5549,"gumshoos":3890,"gurdurr":4848,"guzzlord":5556,"gyarados":3968,"hakamo-o":4018,"happiny":5869,"hariyama":6267,"hatenna":3548,"hatterene":4323,"hattrem":5282,"haunter":3841,"hawlucha":4507,"haxorus":4362,"heatmor":5034,"heatran":5051,"heliolisk":2361,"helioptile":4189,"heracross":3495,"herdier":4951,"hippopotas":6059,"hippowdon":5309,"hitmonchan":3436,"hitmonlee":2920,"hitmontop":4316,"ho-oh":3467,"honchkrow":4661,"honedge":4630,"hoopa-confined":4429,"hoopa-unbound":3650,"hoothoot":4106,"hoppip":3486,"horsea":5091,"houndoom":3508,"houndour":5451,"houndstone":5559,"huntail":4769,"hydrapple":4549,"hydreigon":3656,"hypno":4718,"igglybuff":6125,"illumise":6286,"impidimp":4187,"incineroar":4441,"indeedee-f":5267,"indeedee-m":5587,"infernape":4412,"inkay":5452,"inteleon":3616,"iron-boulder":5715,"iron-bundle":5665,"iron-crown":4745,"iron-hands":5175,"iron-jugulis":3582,"iron-leaves":4215,"iron-moth":3903,"iron-thorns":4790,"iron-treads":5931,"iron-valiant":2760,"ivysaur":6323,"jangmo-o":4075,"jellicent":6025,"jigglypuff":5841,"jirachi":5080,"jolteon":4633,"joltik":5747,"jumpluff":5846,"jynx":5465,"kabuto":7657,"kabutops":4135,"kadabra":4475,"kakuna":7037,"kangaskhan":5986,"karrablast":5786,"kartana":2157,"kecleon":4661,"keldeo":4214,"kilowattrel":2665,"kingambit":3276,"kingdra":3463,"kingler":4607,"kirlia":5390,"klang":6064,"klawf":5123,"kleavor":3404,"klefki":3612,"klink":4906,"klinklang":5346,"koffing":5186,"komala":6016,"kommo-o":4532,"koraidon":3991,"krabby":5121,"kricketot":6751,"kricketune":5257,"krokorok":3927,"krookodile":6055,"kubfu":5599,"kyogre":4817,"kyogre-primal":3676,"kyurem":4162,"lairon":6579,"lampent":3660,"landorus":6825,"landorus-therian":5369,"lanturn":4829,"lapras":3907,"larvesta":5260,"larvitar":5302,"latias":2839,"latios":2874,"leafeon":4478,"leavanny":3770,"lechonk":6652,"ledian":4835,"ledyba":5434,"lickilicky":5230,"lickitung":7207,"liepard":3449,"lileep":4863,"lilligant":6196,"lilligant-hisui":2993,"lillipup":6125,"linoone":4663,"litleo":6015,"litten":3800,"litwick":6341,"lokix":3895,"lombre":5173,"lopunny":5053,"lotad":6642,"loudred":5729,"lucario":4132,"ludicolo":5982,"lugia":3756,"lumineon":4347,"lunala":4644,"lunatone":6919,"lurantis":5310,"luvdisc":6781,"luxio":4282,"luxray":4326,"lycanroc-dusk-form":4035,"lycanroc-midday-form":5259,"lycanroc-midnight-form":5109,"mabosstiff":5887,"machamp":4372,"machoke":5491,"machop":4373,"magby":4730,"magcargo":6246,"magearna":4666,"magikarp":4412,"magmar":4013,"magmortar":5555,"magnemite":4921,"magneton":4682,"magnezone":4581,"makuhita":6425,"malamar":4343,"mamoswine":6320,"manaphy":3571,"mandibuzz":6487,"manectric":4575,"mankey":3711,"mantine":3978,"mantyke":4560,"maractus":4392,"mareanie":6112,"mareep":7062,"marill":5580,"marowak":4690,"marshadow":5756,"marshtomp":4879,"maschiff":6370,"masquerain":3684,"maushold":6970,"mawile":4831,"medicham":4273,"meditite":5334,"meganium":5138,"melmetal":6411,"meloetta---aria":5011,"meloetta---pirouette":4266,"meltan":7257,"meowscarada":3641,"meowstic-f":5225,"meowstic-m":5773,"meowth":3996,"mesprit":4827,"metagross":4885,"metang":5709,"metapod":4539,"mew":3819,"mewtwo":3599,"mienfoo":4592,"mienshao":2489,"mightyena":4502,"milcery":5295,"milotic":4751,"miltank":5201,"mime-jr":4134,"mimikyu":3876,"minccino":5649,"minior-core-form":6790,"minior-meteor-form":6790,"minun":3946,"miraidon":2907,"misdreavus":5854,"mismagius":4494,"moltres":3665,"moltres-galar":4653,"monferno":4624,"morelull":5459,"morgrem":3890,"morpeko":6381,"mothim":4343,"mr-mime":4723,"mr-rime":4902,"mudbray":4416,"mudkip":4508,"mudsdale":5355,"muk":5400,"munchlax":5898,"munkidori":5825,"munna":7671,"murkrow":4003,"musharna":5586,"nacli":7376,"naclstack":6824,"naganadel":3805,"natu":5249,"necrozma":3708,"nickit":4297,"nidoking":5357,"nidoqueen":5724,"nidoran-f":6198,"nidoran-m":6509,"nidorina":4991,"nidorino":5360,"nihilego":5849,"nincada":4477,"ninetales":6410,"ninjask":4915,"noctowl":5385,"noibat":4268,"noivern":4855,"nosepass":6498,"numel":5897,"nuzleaf":4866,"nymble":5520,"obstagoon":5427,"octillery":5036,"oddish":5016,"ogerpon":4684,"ogerpon-cornerstone-mask":4987,"ogerpon-heartflame-mask":4712,"ogerpon-wellspring-mask":4956,"oinkologne-female":5628,"oinkologne-male":5628,"okidogi":5181,"omanyte":7070,"omastar":5571,"onix":4764,"oranguru":6360,"orbeetle":5529,"oricorio-baile-style":3212,"oricorio-pau-style":4333,"oricorio-pom-pom-style":4268,"oricorio-sensu-style":4126,"orthworm":4260,"oshawott":6271,"overqwil":2488,"pachirisu":5020,"palafin":5188,"palkia":5305,"palkia-origin":3602,"palossand":5233,"palpitoad":6862,"pancham":6355,"pangoro":4856,"panpour":5574,"pansage":6097,"pansear":5764,"paras":5092,"parasect":5340,"passimian":3281,"patrat":5532,"pawmi":7513,"pawmo":5173,"pawmot":5023,"pawniard":3231,"pecharunt":5131,"pelipper":5501,"perrserker":5422,"persian":3683,"petilil":5595,"phanpy":6908,"phantump":3667,"pheromosa":3892,"phione":4178,"pichu":4629,"pidgeot":3996,"pidgeotto":4258,"pidgey":4648,"pidove":4947,"pignite":5810,"pikachu":4468,"pikipek":4304,"piloswine":6926,"pincurchin":4111,"pineco":6536,"pinsir":4102,"piplup":6592,"plusle":4973,"poipole":4267,"politoed":4954,"poliwag":5173,"poliwhirl":5132,"poliwrath":4811,"poltchageist":4071,"polteageist":4848,"ponyta":4346,"poochyena":4741,"popplio":5220,"porygon":5401,"porygon-z":3382,"porygon2":5220,"primarina":3894,"primeape":5265,"prinplup":4118,"probopass":6634,"psyduck":6381,"pumpkaboo":5273,"pupitar":6246,"purrloin":3916,"purugly":5669,"pyroar":4956,"pyukumuku":6277,"quagsire":6098,"quaquaval":4162,"quaxly":6699,"quaxwell":5214,"quilava":5129,"quilladin":4553,"qwilfish":4852,"qwilfish-hisui":5731,"raboot":4671,"rabsca":5273,"raging-bolt":3615,"raichu":3222,"raikou":4881,"rainy-castform":4361,"ralts":5746,"rampardos":4873,"rapidash":4628,"raticate":4876,"rattata":4371,"rayquaza":3657,"regice":5594,"regidrago":4834,"regieleki":4350,"regigigas":5469,"regirock":5876,"registeel":4999,"relicanth":6222,"rellor":6554,"remoraid":4195,"reshiram":4752,"reuniclus":4834,"revavroom":5698,"rhydon":4510,"rhyhorn":6573,"rhyperior":5737,"ribombee":4571,"rillaboom":5774,"riolu":3887,"roaring-moon":4322,"rockruff":5822,"roggenrola":6159,"rolycoly":6571,"rookidee":4546,"roselia":3727,"roserade":4859,"rotom":2049,"rotom-fan":4209,"rotom-frost":4814,"rotom-heat":4736,"rotom-mow":4662,"rotom-wash":4605,"rowlet":7544,"rufflet":6969,"runerigus":5145,"sableye":3390,"salamence":6028,"salandit":2875,"salazzle":3395,"samurott":4263,"samurott-hisui":3924,"sandaconda":6696,"sandile":5317,"sandshrew":5783,"sandslash":4692,"sandy-shocks":3867,"sandygast":3943,"sawk":5306,"sawsbuck":3196,"scatterbug":4454,"sceptile":3769,"scizor":3960,"scolipede":3337,"scorbunny":4299,"scovillain":5173,"scrafty":5241,"scraggy":4765,"scream-tail":6119,"scyther":3489,"seadra":4139,"seaking":5886,"sealeo":4813,"seedot":6614,"seel":4837,"seismitoad":6411,"sentret":4862,"serperior":3738,"servine":2840,"seviper":6104,"sewaddle":6315,"sharpedo":3772,"shaymin-land":6764,"shaymin-sky":3948,"shedinja":5225,"shelgon":7162,"shellder":6340,"shellos":5467,"shelmet":6448,"shieldon":5997,"shiftry":4369,"shiinotic":4285,"shinx":4459,"shroodle":5485,"shroomish":5551,"shuckle":3605,"shuppet":5412,"sigilyph":2702,"silcoon":3650,"silicobra":5625,"silvally":3399,"simipour":5303,"simisage":4868,"simisear":5735,"sinistcha":5847,"sinistea":6994,"sirfetchd":3330,"sizzlipede":4120,"skarmory":4220,"skeledirge":6073,"skiddo":5019,"skiploom":6502,"skitty":4345,"skorupi":4518,"skrelp":4292,"skuntank":5226,"skwovet":5397,"slaking":6976,"slakoth":6180,"sliggoo":4207,"sliggoo-hisui":3692,"slither-wing":4690,"slowbro":6510,"slowking":6002,"slowpoke":5937,"slugma":5545,"slurpuff":6367,"smeargle":4419,"smoliv":6081,"smoochum":6304,"sneasel":3238,"sneasel-hisui":3991,"sneasler":4191,"snivy":5069,"snom":6748,"snorlax":6720,"snorunt":5900,"snover":4686,"snowy-castform":5974,"snubbull":5554,"sobble":5211,"solgaleo":5081,"solosis":7840,"solrock":3205,"spearow":4400,"spectrier":3488,"spewpa":6483,"spheal":6778,"spidops":4694,"spinarak":5580,"spinda":5266,"spiritomb":6618,"spoink":5310,"sprigatito":6171,"spritzee":5819,"squawkabilly":3674,"squirtle":5275,"stakataka":4983,"stantler":3561,"staraptor":4425,"staravia":4844,"starly":5871,"starmie":6056,"staryu":5126,"steelix":3878,"steenee":4680,"stonjourner":6328,"stoutland":5370,"stufful":5982,"stunfisk":4974,"stunky":4259,"sudowoodo":3193,"suicune":5111,"sunflora":4372,"sunkern":6415,"sunny-castform":6649,"surskit":1563,"swablu":4649,"swadloon":4509,"swalot":7050,"swampert":4979,"swanna":3857,"swellow":4241,"swinub":7158,"swirlix":6280,"swoobat":3586,"sylveon":5017,"tadbulb":5867,"taillow":5246,"talonflame":2489,"tandemaus":6224,"tangela":7369,"tangrowth":4603,"tapu-bulu":3612,"tapu-fini":4841,"tapu-koko":5147,"tapu-lele":6516,"tarountula":4571,"tatsugiri":5174,"tauros":3583,"tauros-paldea-aqua-breed":4779,"tauros-paldea-blaze-breed":3947,"tauros-paldea-combat-breed":3936,"teddiursa":6165,"tentacool":3998,"tentacruel":4792,"tepig":5215,"terapagos":3522,"terapagos-stellar-form":4922,"terapagos-terastal-form":5541,"terrakion":5888,"thievul":4556,"throh":4871,"thundurus":5282,"thundurus-therian":3669,"thwackey":5802,"timburr":5250,"ting-lu":3965,"tinkatink":4717,"tinkaton":5299,"tinkatuff":5616,"tirtouga":4921,"toedscool":3234,"toedscruel":3721,"togedemaru":6655,"togekiss":4448,"togepi":6964,"togetic":5155,"torchic":4803,"torkoal":6606,"tornadus":6042,"tornadus-therian":4885,"torracat":4286,"torterra":6050,"totodile":5569,"toucannon":4106,"toxapex":4499,"toxel":4821,"toxicroak":3500,"toxtricity-amped":4780,"toxtricity-low-key":4900,"tranquill":3898,"trapinch":6365,"treecko":3979,"trevenant":3895,"tropius":5759,"trubbish":4085,"trumbeak":4142,"tsareena":5364,"turtonator":5077,"turtwig":5293,"tympole":5733,"tynamo":5213,"type-null":4468,"typhlosion":5633,"typhlosion-hisui":3719,"tyranitar":4595,"tyrantrum":4294,"tyrogue":4293,"tyrunt":6277,"ultra-necrozma":3088,"umbreon":3998,"unfezant":4379,"unown":4248,"ursaluna":5909,"ursaluna-bloodmoon":5867,"ursaring":6167,"urshifu-rapid":4694,"urshifu-single":4959,"uxie":5002,"vanillish":5176,"vanillite":5290,"vanilluxe":5085,"vaporeon":4898,"varoom":5516,"veluza":3190,"venipede":6272,"venomoth":4790,"venonat":4722,"venusaur":6239,"vespiquen":5415,"vibrava":3861,"victini":3570,"victreebel":5676,"vigoroth":4623,"vikavolt":3260,"vileplume":5896,"virizion":3581,"vivillon":5109,"volbeat":5776,"volcanion":5687,"volcarona":5101,"voltorb":7566,"voltorb-hisui":7596,"vullaby":3984,"vulpix":5982,"wailmer":6376,"wailord":5815,"walking-wake":3860,"walrein":5244,"wartortle":5579,"watchog":5379,"wattrel":4139,"weavile":4279,"weedle":4221,"weepinbell":5247,"weezing":4818,"whimsicott":7482,"whirlipede":5553,"whiscash":4712,"whismur":6197,"white-kyurem":4178,"wigglytuff":5554,"wiglett":4408,"wimpod":4461,"wingull":2176,"wishiwashi-school-form":3755,"wishiwashi-solo-form":6199,"wo-chien":5325,"wobbuffet":7008,"woobat":3917,"wooloo":6650,"wooper":4658,"wooper-paldea":4668,"wormadam-plant-cloak":3405,"wormadam-sand-cloak":4098,"wormadam-trash-cloak":3690,"wugtrio":5179,"wurmple":5299,"wynaut":4361,"wyrdeer":3541,"xatu":5042,"xerneas":2275,"xurkitree":2929,"yamask":3385,"yamper":5831,"yanma":3609,"yanmega":3991,"yungoos":4407,"yveltal":3669,"zacian":4595,"zacian-crowned":5110,"zamazenta":5029,"zamazenta-crowned":5454,"zangoose":4037,"zapdos":3666,"zapdos-galar":4914,"zarude":3996,"zebstrika":3798,"zekrom":4687,"zeraora":3547,"zigzagoon":5844,"zoroark":4571,"zoroark-hisui":4243,"zorua":5883,"zorua-hisui":3809,"zubat":3166,"zweilous":4845,"zygarde-10-forme":3067,"zygarde-50-forme":3977,"zygarde-complete-forme":5503});
  const COMBINED_AREA_MIN_FRACTION = .095;
  const COMBINED_AREA_TARGET_FRACTION = .10;
  const COMBINED_AREA_MAX_FRACTION = .105;
  const BBOX_AREA_MAX_FRACTION = .185;
  function contourCoverage(slug) {
    const tenThousand = SUBJECT_CONTOUR_COVERAGE_10000[slug];
    return tenThousand > 0 ? tenThousand / 10000 : null;
  }

  // Determine one subject scale from the geometric mean of bbox and exterior
  // contour area. Intersect its 9.5-10.5% band with the 18.5% bbox cap,
  // 40% panel-height cap and physical available width. No density multiplier.
  function artLimits(panelHeight, available, ratio, slug = null, panelWidth = available) {
    const usable=Math.max(1,panelHeight || 750);
    const r=Math.max(.05,ratio);
    const compact=panelWidth<550;
    if(compact){
      const ceiling=usable*.40;
      const panelArea=Math.max(1,panelWidth)*usable;
      const physicalMax=Math.min(520,ceiling,available/r);
      const fill=contourCoverage(slug);
      if(fill!==null){
        // The combined-area percentage at subject height h equals
        // r*h*h*sqrt(fill)/panelArea. Width/height are always scaled together.
        const weight=Math.sqrt(fill);
        const combinedMin=Math.sqrt(panelArea*COMBINED_AREA_MIN_FRACTION/(r*weight));
        const combinedMax=Math.sqrt(panelArea*COMBINED_AREA_MAX_FRACTION/(r*weight));
        const combinedTarget=Math.sqrt(panelArea*COMBINED_AREA_TARGET_FRACTION/(r*weight));
        const bboxMax=Math.sqrt(panelArea*BBOX_AREA_MAX_FRACTION/r);
        const max=Math.min(physicalMax,bboxMax,combinedMax);
        // If the area floor cannot be reached, use the nearest feasible size;
        // constraint checks and the test harness—not production debug code—
        // identify the conflict.
        const min=Math.min(combinedMin,max);
        return {min,preferred:clampGeometry(combinedTarget,min,max),max,
          ceiling,requestedFloor:combinedMin,anchor:combinedTarget,compact,
          widthCap:available,areaWeight:0,contourCoverage:fill};
      }
      // Unindexed/Fakemon imagery retains dimensional guidance, with no
      // fabricated contour or bbox area measurements.
      const requestedFloor=Math.max(usable*.20,available*.30/r);
      const min=Math.min(physicalMax,requestedFloor);
      return {min,preferred:clampGeometry(Math.min(usable*.25,available*.50/r),min,physicalMax),
        max:physicalMax,ceiling,requestedFloor,anchor:min,compact,
        widthCap:available,areaWeight:0,contourCoverage:null};
    }
    // Preserve the existing >=550px artwork guidance in this isolated trial.
    const ceiling=usable*.37;
    const referenceSide=Math.min(available*.50,usable*.25);
    const targetArea=referenceSide*referenceSide;
    const areaHeight=Math.sqrt(targetArea/r);
    const formerWidthFraction=Math.min(.65,.55+.10*Math.max(0,available-550)/650);
    const widthBlend=clampGeometry((available-550)/230,0,1);
    const widthFraction=.68*(1-widthBlend)+formerWidthFraction*widthBlend;
    const widthCap=Math.min(650,available*widthFraction);
    const max=Math.min(ceiling,520,widthCap/r);
    const largeTarget=Math.max(Math.min(usable*.25,max),Math.min(max,usable*.35));
    const blend=clampGeometry((available-550)/230,0,1);
    const preferred=Math.min(max,areaHeight*(1-blend)+largeTarget*blend);
    const floorBlend=clampGeometry((available-520)/280,0,1);
    const min=Math.min(max,preferred*.80*(1-floorBlend)+usable*.25*floorBlend);
    const areaWeight=1-clampGeometry((available-525)/125,0,1);
    return {min,preferred,max,ceiling,requestedFloor:usable*.25,
      anchor:areaHeight,compact,widthCap,targetArea,areaWeight};
  }
  function artAreaDeviation(subjectArea, guide) {
    // Compact contour bounds are enforced in geometry and final eligibility.
    // No soft area/density preference inside or outside the feasible band.
    if(guide.compact)return 0;
    return Math.abs(Math.log(Math.max(1,subjectArea)/Math.max(1,guide.targetArea)));
  }

  // This is part of the measured artwork footprint, not an after-paint
  // offset: the visible subject must not touch/underlap the header.
  function artworkTopClearance(available) {
    // The artwork subject is top-aligned with the description; don't create
    // a blanket 8-16px internal gap. Sparkle clearance is validated against
    // the actual subject and frame separately.
    return 0;
  }
  function artFloor(available, ratio, panelHeight) {
    return artLimits(panelHeight,available,ratio).min;
  }
  function usablePanelHeight(article) {
    // Compact sizing is relative to the actual PANEL height (including header).
    // Leave the >=550px viewport guide untouched in this isolated experiment.
    const bounds=article?.getBoundingClientRect();
    if(bounds?.width>0&&bounds.width<550)
      return Math.round(Math.max(1,bounds.height||article.clientHeight||750));
    const viewport=window.visualViewport?.height||window.innerHeight||750;
    return Math.round(Math.max(1,Math.min(1300,viewport)));
  }

  // This is a compact tuple of independent promotion decisions, not a list
  // of pre-rendered layout templates. Biology host/width is solved separately.
  function promotionKey(p) { return `${+p.scores}${+p.tiles}${+p.abilities}`; }
  function promotionStage(p) {
    return p.abilities ? 3 : p.tiles ? (p.scores ? 2 : 1) : (p.scores ? 0 : -1);
  }

    function createMeasurer(hero) {
    const cache = new Map();
    const probes = new Map();
    return {
      height(source, width, kind, copyPromoted = false) {
        if (!source || !(width > 0)) return 0;
        // Quantization and within-pass caching avoids measuring every 1px
        // variation of a word wrapping boundary across 100 candidates.
        const w = Math.max(1, Math.round(width / 2) * 2);
        const key = kind + ':' + w + (kind === 'copy' ? ':' + (copyPromoted ? 'promoted' : 'native') : '');
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
            // The live description has zero box padding in native and promoted
            // layouts. The detached clone lacks its normal parent CSS selector,
            // so make its measured content box identical in either state.
            clone.style.setProperty('padding', '0', 'important');
            clone.style.setProperty('margin', '0', 'important');
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
        if (kind === 'copy') {
          // Wrapping belongs to the candidate, not the layout currently
          // applied: native copy allows anywhere, promoted copy uses normal.
          const inner = probe.clone.querySelector('.small-text') || probe.clone;
          inner.style.setProperty('overflow-wrap', copyPromoted ? 'normal' : 'anywhere', 'important');
        }
        const h = Math.ceil(probe.clone.getBoundingClientRect().height);
        cache.set(key,h);
        return h;
      },
      eggFit(view, width, inline) {
        if (width < BIO_MIN_BAR_WIDTH) return null;
        const w = Math.round(width / 2) * 2;
        // Final Egg typography is independent of promotion stage; reuse the
        // SAME rendered fit across every eligible component arrangement.
        const key = `egg:${inline ? 'inline' : 'stack'}:${w}`;
        if (cache.has(key)) return cache.get(key);
        let probe = probes.get('egg');
        if (!probe) {
          // One reusable rendered-content probe, never one per candidate and
          // never an observer. It reproduces the same icon/value DOM and CSS.
          const outer = document.createElement('article');
          outer.className = 'lab3-active';
          outer.style.cssText = 'position:absolute!important;visibility:hidden!important;' +
            'pointer-events:none!important;left:-100000px!important;top:0!important;' +
            'height:auto!important;width:auto!important;max-width:none!important;' +
            'overflow:visible!important;';
          const host = document.createElement('div');
          host.className = 'yofi-species-hero';
          const group = document.createElement('div');
          group.className = 'lab3-biologies';
          const bar = document.createElement('div');
          bar.className = 'lab3-biology lab3-egg';
          const nativeField = view.hero.querySelector('.yofi-hero-field-egg');
          if (!nativeField) return null;
          const right = document.createElement('dl');
          right.className = 'yofi-hero-facts-right';
          right.append(cloneWithoutIds(nativeField));
          bar.append(right); group.append(bar); host.append(group); outer.append(host);
          document.body.append(outer);
          probe = {outer,group,bar,field:right.querySelector('.yofi-hero-field-egg'),
            value:right.querySelector('.yofi-hero-egg-value'),
            icon:right.querySelector('.lab3-egg-icon')};
          probe.textRange = document.createRange();
          probe.textRange.selectNodeContents(probe.value);
          probes.set('egg',probe);
        }
        probe.group.classList.toggle('lab3-bio-inline',inline);
        // The container width is the candidate's final width. Set the bar's
        // height to auto for natural content measurement before fitting it.
        probe.group.style.setProperty('width',`${w}px`,'important');
        probe.bar.style.setProperty('width',`${w}px`,'important');
        probe.bar.style.setProperty('height','auto','important');
        probe.bar.style.setProperty('min-height','0','important');
        probe.bar.style.setProperty('max-height','none','important');
        probe.bar.style.setProperty('overflow','visible','important');
        const rect = probe.value.getBoundingClientRect();
        const css = getComputedStyle(probe.value);
        const line = parseFloat(css.lineHeight) || parseFloat(css.fontSize)*1.16 || 12;
        const singleLine = rect.height <= line + 1;
        // Check actual rendered ink, not scrollWidth alone (a block with
        // nearly touching text still reports scrollWidth == clientWidth).
        // Small breathing room at both text-track edges prevents a cramped
        // side-by-side candidate beating a comfortably readable stack.
        const inkWidth = probe.textRange.getBoundingClientRect().width;
        const textWidth = probe.value.clientWidth;
        // Content decides eligibility, never layout preference. Its actual
        // font is determined by the candidate width's final CSS clamp.
        // A small font-relative clearance is enough; visual comfort is
        // compared across candidates by geometryFor, not vetoed here.
        const fontSize = parseFloat(css.fontSize) || 13;
        const clearance = Math.max(6,fontSize*.46);
        const fits = singleLine && inkWidth + clearance <= textWidth + .5 &&
          probe.value.scrollWidth <= textWidth + .5 &&
          probe.field.scrollWidth <= probe.field.clientWidth + .5;
        const result = fits ? {height: Math.ceil(Math.max(rect.height,
          probe.icon.getBoundingClientRect().height) + 8),lines:1,
          fontSize,inkWidth,textWidth} : null;
        cache.set(key,result);
        return result;
      },
      nativeFootprints(article,view) {
        // Compare the total page footprint with or without native sections.
        // One temporary source-faithful probe per layout pass, never a watcher.
        // It also works after Svelte's canonical nodes have been promoted.
        const scrollable = article.querySelector('.scrollable');
        const width = scrollable?.clientWidth || article.clientWidth;
        if (!(width>0)) return {scores:0,vitals:0,abilities:0};
        const shell=document.createElement('div');
        shell.dataset.yofiLayoutProbe='true';
        shell.style.cssText='position:absolute!important;left:-100000px!important;' +
          'top:0!important;visibility:hidden!important;pointer-events:none!important;' +
          'height:auto!important;max-width:none!important;box-sizing:border-box!important;';
        shell.style.width=`${width}px`;
        const stats=document.createElement('section');
        stats.className='stats';
        const banner=cloneWithoutIds(view.scoreBanner);
        const strip=cloneWithoutIds(view.scoreStrip);
        const nativeVitals=article.querySelector('section.stats > .yofi-vitals-row');
        const vitals=nativeVitals ? cloneWithoutIds(nativeVitals) : null;
        if(vitals) {
          vitals.style.setProperty('display','flex','important');
          vitals.style.setProperty('visibility','visible','important');
          vitals.style.setProperty('position','static','important');
          vitals.style.setProperty('height','auto','important');
          vitals.style.setProperty('width','100%','important');
        }
        banner.querySelector('dl.yofi-scores-strip')?.remove();
        banner.append(strip);
        // On promoted cards the real banner is display:none. Override ONLY
        // this detached measuring clone; the live tree stays untouched.
        banner.style.setProperty('display','grid','important');
        if(vitals) stats.append(vitals);
        stats.append(banner);
        const abilities=view.abilities ? cloneWithoutIds(view.abilities) : null;
        shell.append(stats);
        if(abilities) shell.append(abilities);
        scrollable.append(shell);
        const footprint = node => {
          if(!node) return 0;
          const css=getComputedStyle(node);
          const px=v=>parseFloat(v)||0;
          return Math.ceil(node.getBoundingClientRect().height +
            px(css.marginTop)+px(css.marginBottom));
        };
        try {
          return {scores:Math.max(0,footprint(banner)),
            vitals:footprint(vitals), abilities:footprint(abilities)};
        } finally {shell.remove();}
      },
      close() { for (const {outer} of probes.values()) outer.remove(); }
    };
  }
  /* v0.2.14 layout grammar: independently measured placements, bounded
     distribution, and coordinated scaling. Populated
     columns approach one physically measured bottom with top-aligned artwork.
     Component order, score side, and biology host are independent choices. */
  const HERO_STACK_GAP = 8;
  const BOTTOM_EPSILON = 9;
  // The native gender bar is a short, single-line component, not a tile.
  // Egg adopts the same icon and text scale and stays regular weight.
  const BIO_DEFAULT_HEIGHT = 22;
  // The requested 22px floor is for compact bars, not a compulsory 22px
  // height on a 1100px card. Grow continuously toward the previous 29px
  // preferred size when useful column space is available.
  function biologyHeightFloor(available) {
    return BIO_DEFAULT_HEIGHT+7*clampGeometry((available-520)/400,0,1);
  }
  // Panel bands are readability bounds, not layout breakpoints: a width
  // transition changes only the available score scale, never its host/order.
  function scoreScaleBounds(panelWidth,scoreWidth) {
    const compact=panelWidth<680,medium=panelWidth<920,large=panelWidth<1160;
    const fontMin=compact?13:medium?13.5:large?14:14.5;
    const fontMax=compact?18:medium?19.5:large?21:22;
    const rowMin=compact?39:medium?40:large?42:44;
    const rowCap=compact?61:medium?66:large?72:76;
    // Do not grow a score cell without growing its type. Intrinsic content
    // width determines the tallest useful cell in this column.
    const usableFont=Math.max(fontMin,Math.min(fontMax,scoreWidth*.088));
    return {fontMin,fontMax,rowMin,rowMax:Math.max(rowMin,
      Math.min(rowCap,Math.floor(usableFont*3.15+5)))};
  }
  function clampGeometry(x,lo,hi) { return Math.min(hi,Math.max(lo,x)); }
  function scoreDimensions(width,rowHeight,panelWidth=width,bands=2) {
    const bounds=scoreScaleBounds(panelWidth,width);
    const h=clampGeometry(rowHeight,bounds.rowMin,bounds.rowMax);
    const font=clampGeometry(Math.min(width*.09,h*.31),
      bounds.fontMin,bounds.fontMax);
    return {rowHeight:h,fontSize:font,height:h*bands+(bands===2?TILE_GAP:0)};
  }
  function candidateIdentity(x) {
    return [x.promotion,x.bioMode,x.scoreSide,x.cols,x.tile,
      Math.round(x.copyWidth/4),Math.round(x.imageHeight/5),
      x.scoreBands||2,Math.round(x.scoreRowHeight/3),Math.round(x.bioGenderWidth/8),
      Math.round(x.bioEggWidth/8),x.copyHeight,x.abilitiesHeight||0,
      x.artAlign??.5,x.contourWrap?1:0].join(':');
  }
  function orderedGeometry(candidates) {
    return candidates.sort((a,b)=>
      a.totalFootprint-b.totalFootprint || a.internalUnusedArea-b.internalUnusedArea ||
      a.visualCost-b.visualCost || b.imageHeight-a.imageHeight ||
      a.copyWidth-b.copyWidth || a.bioMode.localeCompare(b.bioMode) ||
      a.scoreSide.localeCompare(b.scoreSide) || a.promotion.localeCompare(b.promotion));
  }
  // Bar width is a content constraint. A Gender/Egg pair cannot fill an
  // arbitrarily wide track merely because that track has spare pixels.
  const BIO_MAX_BAR_WIDTH=212;
  const BIO_MIN_BAR_WIDTH=72;
  function biologyGeometry(mode,copyWidth,rightWidth,available,measurer,view) {
    const full=mode==='full-inline';
    const right=mode==='right-inline'||mode==='right-stack';
    const inline=full||mode==='left-inline'||mode==='right-inline';
    const region=full?available:(right?rightWidth:copyWidth);
    const candidateWidth=inline?Math.min(BIO_MAX_BAR_WIDTH,(region-TILE_GAP)/2):
      Math.min(BIO_MAX_BAR_WIDTH,region);
    if(candidateWidth<BIO_MIN_BAR_WIDTH)return null;
    // One shared height and equal widths wherever physically possible.
    // Disallow a wider Egg bar unless equal-width text fit truly fails.
    let genderWidth=candidateWidth,eggWidth=candidateWidth;
    let eggFit=measurer.eggFit(view,eggWidth,inline);
    if(!eggFit&&inline){
      for(const extra of [12,24,36]){
        const rightCandidate=Math.min(BIO_MAX_BAR_WIDTH,candidateWidth+extra);
        if(candidateWidth+rightCandidate+TILE_GAP>region+.1)break;
        const fit=measurer.eggFit(view,rightCandidate,true);
        if(fit){eggWidth=rightCandidate;eggFit=fit;break;}
      }
    }
    if(!eggFit)return null;
    const height=Math.max(biologyHeightFloor(available),eggFit.height);
    if(height>49)return null;
    const pairHeight=inline?height:2*height+TILE_GAP;
    return {genderWidth,eggWidth,totalWidth:inline?
      genderWidth+eggWidth+TILE_GAP:Math.max(genderWidth,eggWidth),
      height,pairHeight,inline,full,right,eggFit};
  }
  function proposalFor(p,mode,scoreSide,cols,tile,sideWidth,copyWidth,hero,view,ratio,
                       available,minArt,measurer,art,displaced) {
    const hasRight=p.tiles||p.abilities;
    const gap=Math.max(14,Math.min(22,Math.round(available*.015)+3));
    const rightWidth=hasRight?(p.tiles?cols*tile+(cols-1)*TILE_GAP:sideWidth):0;
    const laneWidth=available-copyWidth-rightWidth-gap*(hasRight?2:1);
    if(laneWidth<Math.max(100,minArt*ratio)-.01)return [];
    const maxArt=Math.min(art.max,laneWidth/ratio);
    if(maxArt<minArt-.2)return [];
    const copy=hero.querySelector('.yofi-hero-copy');
    const copyHeight=measurer.height(copy,copyWidth,'copy',true);
    const bio=biologyGeometry(mode,copyWidth,rightWidth,available,measurer,view);
    if(!bio)return [];
    // Right-column biology may lead Abilities only under a 1x4 Vitals row.
    // All alternatives use exactly one logical biology pair.
    const bioLeft=bio.full||bio.right?0:bio.pairHeight;
    const bioRightHeight=bio.right?bio.pairHeight:0;
    const hasAbilities=!!view.abilities?.querySelector('.ability');
    if(p.abilities&&hasAbilities&&rightWidth<174)return [];
    const abilitiesHeight=p.abilities&&hasAbilities?
      measurer.height(view.abilities,rightWidth,'abilities'):0;
    const caption=hero.querySelector('.yofi-hero-art-lane figure figcaption');
    const creditHeight=caption?.textContent?.trim()?
      measurer.height(caption,laneWidth,'credit')+
      Math.max(0,parseFloat(getComputedStyle(caption).marginTop)||0):0;
    const topGap=artworkTopClearance(available);
    const tileHeight=p.tiles?(cols===4?tile:2*tile+TILE_GAP):0;
    const scoreWidth=scoreSide==='right'?rightWidth:copyWidth;
    const bounds=scoreScaleBounds(available,scoreWidth);
    const baseScore=p.scores?clampGeometry(scoreWidth*.165,bounds.rowMin,bounds.rowMax):0;
    const result=[];
    const bandsOptions=p.scores?(scoreWidth>=344?[1,2]:[2]):[2];
    for(const bands of bandsOptions){
      const rows=p.scores?[Math.round(baseScore),bounds.rowMin,bounds.rowMax]:[0];
      for(const startingRow of [...new Set(rows)]){
        let score=p.scores?scoreDimensions(scoreWidth,startingRow,available,bands):
          {rowHeight:0,fontSize:0,height:0};
        const leftN=1+(p.scores&&scoreSide==='left'?1:0)+(bioLeft?1:0);
        const rightN=(p.tiles?1:0)+(p.scores&&scoreSide==='right'?1:0)+
          (bioRightHeight?1:0)+(abilitiesHeight?1:0);
        let leftH=copyHeight+bioLeft+(p.scores&&scoreSide==='left'?score.height:0)+
          (leftN-1)*HERO_STACK_GAP;
        let rightH=tileHeight+bioRightHeight+abilitiesHeight+
          (p.scores&&scoreSide==='right'?score.height:0)+
          Math.max(0,rightN-1)*HERO_STACK_GAP;
        // Adjust a score row toward a shared bottom; unlike v0.2.9 this
        // is not a hard 3px feasibility gate before final measurement.
        if(hasRight&&Math.abs(leftH-rightH)>BOTTOM_EPSILON&&p.scores){
          const change=(scoreSide==='left'?rightH-leftH:leftH-rightH)/bands;
          const corrected=clampGeometry(score.rowHeight+change,bounds.rowMin,bounds.rowMax);
          const revised=scoreDimensions(scoreWidth,corrected,available,bands);
          const diff=revised.height-score.height;
          score=revised;
          if(scoreSide==='left')leftH+=diff;
          else rightH+=diff;
        }
        // Determine one shared target, then scale the subject and/or distribute
        // stacked native elements. Short columns are not mistaken for empty
        // if they can anchor their last element at that shared target.
        const rowHeight=Math.max(leftH,hasRight?rightH:0,minArt+topGap+creditHeight);
        const imageHeight=Math.min(maxArt,Math.max(0,rowHeight-topGap-creditHeight));
        if(imageHeight<Math.min(minArt,maxArt)-.6)continue;
        const imageWidth=ratio*imageHeight;
        const artUnderfill=Math.max(0,rowHeight-topGap-creditHeight-imageHeight);
        const leftSlack=Math.max(0,rowHeight-leftH);
        const rightSlack=hasRight?Math.max(0,rowHeight-rightH):0;
        const distributeLeft=leftN>1&&leftSlack>.5;
        const distributeRight=hasRight&&rightN>1&&rightSlack>.5;
        const leftTail=distributeLeft?0:leftSlack;
        const rightTail=distributeRight?0:rightSlack;
        const bottomError=Math.max(leftTail,rightTail,artUnderfill);
        const internalUnusedArea=(leftSlack*copyWidth+
          (hasRight?rightSlack*rightWidth:0)+artUnderfill*laneWidth)/Math.max(1,available);
        const heroHeight=rowHeight+(bio.full?TILE_GAP+bio.height:0);
        const genderFont=Math.max(12,Math.min(18,bio.genderWidth*.062));
        const readability=Math.max(0,15-bio.eggFit.fontSize)*1.1+
          Math.max(0,15-genderFont)*.45;
        const preferredPenalty=Math.max(0,art.preferred-imageHeight)*.14;
        const excessBiologyWidth=Math.max(0,bio.totalWidth-(bio.inline?320:194))*.1;
        const freeArtworkWidth=Math.max(0,laneWidth-imageWidth);
        const cornerReserve=Math.min(58,Math.max(38,available*.046));
        const excessArtworkWidth=Math.max(0,freeArtworkWidth-cornerReserve);
        const trackWasteCost=excessArtworkWidth*(ratio<.8?.34:ratio<1.22?.25:.17);
        const visualCost=readability+preferredPenalty+excessBiologyWidth+
          internalUnusedArea*.58+trackWasteCost+bottomError*3.1+
          (leftSlack+rightSlack)*.09;
        const totalFootprint=heroHeight+
          (p.scores?0:displaced.scores)+
          (p.tiles?0:displaced.vitals)+
          (p.abilities?0:displaced.abilities);
        result.push({stage:promotionStage(p),scores:p.scores,tiles:p.tiles,
          abilities:p.abilities,promotion:promotionKey(p),bioMode:mode,
          scoreSide,scoreBands:bands,cols,tile,gap,tileGap:TILE_GAP,rightWidth,
          copyWidth,laneWidth,imageWidth,imageHeight,rowHeight,heroHeight,
          artTopGap:topGap,creditHeight,copyHeight,abilitiesHeight,
          bioHeight:bio.height,bioGenderWidth:bio.genderWidth,
          bioEggWidth:bio.eggWidth,bioTotalWidth:bio.totalWidth,
          bioEggInk:bio.eggFit.inkWidth||0,
          scoreRowHeight:score.rowHeight,scoreFontSize:score.fontSize,
          scoreTopGap:HERO_STACK_GAP,leftHeight:leftH,rightHeight:rightH,
          leftBottom:distributeLeft?rowHeight:leftH,
          rightBottom:hasRight?(distributeRight?rowHeight:rightH):null,
          subjectBottom:topGap+creditHeight+imageHeight,
          bottomError,internalUnusedArea,visualCost,totalFootprint,
          freeArtworkWidth,excessArtworkWidth,trackWasteCost,
          leftSlack,rightSlack,artUnderfill,
          distributeLeft,distributeRight});
      }
    }
    return result;
  }

  // Adaptive *content* breakpoints, not preset column patterns. Candidate
  // geometries on the same text-wrap plateau are equivalent unless the art,
  // score scale or biology fit changes at a meaningful boundary.
  function contentWidths(node,lower,upper,kind,measurer,referenceRatio=1) {
    if(upper<=lower+1)return [lower];
    const values=new Set([Math.round(lower),Math.round(upper)]);
    const sampleCount=kind==='abilities'?10:12;
    if(kind==='copy'&&referenceRatio<1.2){
      for(const distance of [12,28,48,76]){
        const x=Math.round(upper-distance);
        if(x>lower+1)values.add(x);
      }
    }
    const sample=[];
    for(let i=0;i<=sampleCount;i++){
      const x=lower+(upper-lower)*i/sampleCount;
      sample.push([x,measurer.height(node,x,kind,kind==='copy')]);
    }
    for(let i=1;i<sample.length;i++){
      const [x,h]=sample[i], [prev,pH]=sample[i-1];
      if(h===pH)continue;
      let lo=prev,hi=x;
      for(let j=0;j<7&&hi-lo>1;j++){
        const mid=(hi+lo)/2;
        if(measurer.height(node,mid,kind,kind==='copy')===pH)lo=mid;
        else hi=mid;
      }
      values.add(Math.round(Math.max(lower,hi-2)));
      values.add(Math.round(Math.min(upper,hi+2)));
      values.add(Math.round((prev+x)/2));
    }
    // Wide portraits benefit from artwork width; tall portraits benefit
    // when their text can wrap in a narrower neighboring copy column.
    const ideal=kind==='copy'?(referenceRatio>1.32?.27:.34):.37;
    values.add(Math.round(Math.min(upper,Math.max(lower,availableWidthHint(lower,upper,ideal)))));
    return [...values].filter(x=>x>=lower-1&&x<=upper+1).sort((a,b)=>a-b);
  }
  function availableWidthHint(lower,upper,fraction){
    return lower+(upper-lower)*fraction;
  }
  function selectGeometry(p,hero,view,ratio,available,imageFloor,measurer,art,displaced) {
    const hasRight=p.tiles||p.abilities;
    const copy=hero.querySelector('.yofi-hero-copy');
    const font=parseFloat(getComputedStyle(copy.querySelector('.small-text')||copy).fontSize)||16;
    const tileMin=p.tiles?Math.max(MIN_TILE,Math.ceil(
      cleanText(view.vitals.querySelector('[data-key="hp"] .lab3-number')).length*8+12)):0;
    if(tileMin>MAX_TILE)return [];
    const minCopy=p.scores?Math.max(162,font*8.4):Math.max(124,font*7.3);
    const modes=hasRight?['left-inline','left-stack','right-inline','right-stack','full-inline']:
      ['left-inline','left-stack','full-inline'];
    const scoreSides=p.scores&&hasRight?['left','right']:['left'];
    const tiles=p.tiles?[...new Set([tileMin,94,MAX_TILE]
      .map(t=>clampGeometry(t,tileMin,MAX_TILE)))]:[0];
    const results=[];
    for(const tile of tiles){
      for(const cols of (p.tiles?[2,4]:[0])){
        const gap=Math.max(14,Math.min(22,Math.round(available*.015)+3));
        // Without promoted vitals, right-side widths are chosen by Abilities
        // wrapping and the minimum usable artwork lane. No 230/310-only fork.
        const maxRight=Math.min(520,available-minCopy-imageFloor*ratio-2*gap);
        const minRight=Math.min(maxRight,Math.max(168,font*9.8));
        const sides=hasRight&&!p.tiles&&maxRight>=minRight?
          contentWidths(view.abilities,minRight,maxRight,'abilities',measurer,ratio):[0];
        for(const sideWidth of sides){
          const rightWidth=hasRight?(p.tiles?cols*tile+(cols-1)*TILE_GAP:sideWidth):0;
          const maxCopy=available-rightWidth-gap*(hasRight?2:1)-ratio*imageFloor;
          if(maxCopy<minCopy)continue;
          const widths=contentWidths(copy,minCopy,maxCopy,'copy',measurer,ratio);
          const seen=new Set();
          for(const w of widths){
            const copyWidth=Math.round(clampGeometry(w,minCopy,maxCopy)*2)/2;
            if(seen.has(copyWidth))continue;
            seen.add(copyWidth);
            for(const scoreSide of scoreSides){
              for(const mode of modes){
                // These decisions remain independent. Invalid order is
                // excluded in apply(), not patched by reordering a paint.
                results.push(...proposalFor(p,mode,scoreSide,cols,tile,sideWidth,
                  copyWidth,hero,view,ratio,available,imageFloor,measurer,art,displaced));
              }
            }
          }
        }
      }
    }
    const plateau=new Map();
    for(const c of results){
      const key=[c.bioMode,c.scoreSide,c.scoreBands||2,c.cols,c.tile,c.copyHeight,c.abilitiesHeight].join(':');
      plateau.set(key,Math.min(c.copyWidth,plateau.get(key)??Infinity));
    }
    for(const c of results){
      const key=[c.bioMode,c.scoreSide,c.scoreBands||2,c.cols,c.tile,c.copyHeight,c.abilitiesHeight].join(':');
      c.copyPlateauWaste=Math.max(0,c.copyWidth-plateau.get(key));
      // Same-wrap widths are still distinct when they improve artwork-track
      // occupancy; avoid penalizing that productive reallocation.
      c.visualCost+=c.copyPlateauWaste*.02;
    }
    // Content-aware permutation exemption, in priority order:
    // 1. subject aspect ratio / useful artwork track;
    // 2. description wrapping; 3. Abilities wrapping; 4. Egg-group fit.
    // A candidate survives if it offers a different meaningful result in
    // any earlier dimension; do not enforce a global N-candidate beam.
    const families=new Map();
    for(const c of results){
      const key=[c.promotion,c.bioMode,c.scoreSide,c.scoreBands||2,c.cols,
        Math.round(ratio*8)/8].join(':');
      if(!families.has(key))families.set(key,[]);
      families.get(key).push(c);
    }
    const diverse=[];
    for(const group of families.values()){
      const signatures=new Map();
      for(const c of group){
        const key=[Math.round(c.imageHeight/18),Math.round(c.laneWidth/22),
          c.copyHeight,c.abilitiesHeight,Math.round(c.bioEggWidth/16),
          Math.round(c.scoreFontSize*2),c.scoreBands||2,Math.round(c.tile/12)].join(':');
        const prior=signatures.get(key);
        if(!prior||c.totalFootprint<prior.totalFootprint-.5||
           (Math.abs(c.totalFootprint-prior.totalFootprint)<=.5&&
            c.visualCost<prior.visualCost))signatures.set(key,c);
      }
      const variants=[...signatures.values()];
      for(const c of variants){
        const dominated=variants.some(other=>other!==c&&
          other.copyHeight<=c.copyHeight+.5&&
          other.abilitiesHeight<=c.abilitiesHeight+.5&&
          other.totalFootprint<=c.totalFootprint+.5&&
          other.visualCost<=c.visualCost+.25&&
          other.imageHeight>=c.imageHeight-1.5&&
          other.scoreFontSize>=c.scoreFontSize-.5&&
          other.bioEggWidth>=c.bioEggWidth-.5&&
          (other.totalFootprint<c.totalFootprint-.5||
           other.visualCost<c.visualCost-.25||
           other.imageHeight>c.imageHeight+1.5));
        if(!dominated)diverse.push(c);
      }
    }
    return orderedGeometry(diverse);
  }

  function chooseFootprintLayout(candidates,displaced,panelHeight=750,artGuide=null) {
    if(!candidates.length)return {choice:null,ranked:[],alternatives:[]};
    const ranked=orderedGeometry(candidates.slice());
    const floor=ranked[0].totalFootprint;
    // No global beam. Every useful composition surviving content/geometry
    // dominance reaches synchronous hidden-DOM verification, including right Scores
    // or its biology orientation is rare. Equivalent geometries were already
    // removed using actual measured text and component dimensions.
    const quality=c=>c.totalFootprint+c.visualCost*.65+
      c.internalUnusedArea*.33+c.bottomError*1.8;
    const semantic=new Map();
    for(const c of ranked){
      const k=c.promotion+':'+(c.scoreBands||2);
      if(!semantic.has(k))semantic.set(k,[]);
      semantic.get(k).push(c);
    }
    const alternatives=[];
    for(const group of semantic.values()){
      const best=Math.min(...group.map(quality));
      const threshold=Math.max(22,Math.min(42,panelHeight*.045));
      const plausible=group.filter(c=>quality(c)<=best+threshold);
      const shapeBins=new Map();
      for(const c of plausible){
        const k=[c.bioMode,c.scoreSide,c.cols,
          Math.round(c.imageHeight/45),c.copyHeight,c.abilitiesHeight].join(':');
        const old=shapeBins.get(k);
        if(!old||quality(c)<quality(old))shapeBins.set(k,c);
      }
      alternatives.push(...shapeBins.values());
    }
    // Flow widths are sampled at wrapping/scale plateaus. Keep distinct
    // content measurements and subject-size regimes, but avoid verifying
    // dozens of geometrically equivalent float variants in the hidden DOM.
    const flowShapes=new Map();
    for(const candidate of ranked){
      if(!candidate.flow)continue;
      const k=[candidate.promotion,candidate.bioMode,candidate.contourWrap?1:0,
        candidate.artAlign,Math.round(candidate.imageHeight/22),
        candidate.copyHeight,Math.round(candidate.bioEggWidth/24),
        Math.round(candidate.scoreFontSize||0),
        Math.round(candidate.bottomError/12)].join(':');
      const previous=flowShapes.get(k);
      const cost=c=>quality(c)+
        (artGuide?.areaWeight||0)*artAreaDeviation(c.imageWidth*c.imageHeight,artGuide)*18;
      if(!previous||cost(candidate)<cost(previous))flowShapes.set(k,candidate);
    }
    for(const candidate of flowShapes.values()){
      if(!alternatives.includes(candidate))alternatives.push(candidate);
    }
    orderedGeometry(alternatives);
    const summary=alternatives.slice(0,36).map(c=>({
      promotion:c.promotion,bioMode:c.bioMode,scoreSide:c.scoreSide,cols:c.cols,
      copyWidth:c.copyWidth,copyHeight:c.copyHeight,copyPlateauWaste:c.copyPlateauWaste,
      rightWidth:c.rightWidth,laneWidth:c.laneWidth,
      freeArtworkWidth:c.freeArtworkWidth,excessArtworkWidth:c.excessArtworkWidth,
      scoreBands:c.scoreBands||2,scoreRowHeight:c.scoreRowHeight,scoreFontSize:c.scoreFontSize,
      imageHeight:c.imageHeight,imageWidth:c.imageWidth,
      bioHeight:c.bioHeight,bioGenderWidth:c.bioGenderWidth,
      leftBottom:c.leftBottom,rightBottom:c.rightBottom,
      subjectBottom:c.subjectBottom,bottomError:c.bottomError,
      internalUnusedArea:c.internalUnusedArea,rowHeight:c.rowHeight,
      heroHeight:c.heroHeight,footprint:c.totalFootprint,
      visualCost:c.visualCost,footprintBudget:floor+15
    }));
    return {choice:alternatives[0],ranked:summary,alternatives,footprintFloor:floor};
  }

  // A wrapping flow is another topology of this SAME composition grammar.
  // At widths where side-by-side columns cannot physically align, description
  // text can flow below the top-aligned artwork instead of leaving an empty
  // column or invoking an unrelated compact-layout selector.
  function wrappingGeometry(hero,view,ratio,available,measurer,art,displaced) {
    const copy=hero.querySelector('.yofi-hero-copy');
    const gap=Math.max(14,Math.min(22,Math.round(available*.015)+3));
    const topGap=artworkTopClearance(available);
    const results=[];
    const panelWidth=hero.closest('article')?.getBoundingClientRect().width||available;
    // Scale candidate widths toward the opaque art's actual shape.
    // Samples straddle meaningful text wrapping and subject width regimes.
    const anchorFraction=art.preferred*ratio/available;
    const familiar=ratio>1.4?[.44,.50,.57,.63]:
      ratio<.84?[.30,.36,.43,.50]:[.35,.41,.47,.54];
    // Sample useful lane widths around the area anchor, plus prior wrapping
    // plateaus. This does not encode a layout by species or image identity.
    const laneFractions=[...new Set([...familiar,
      anchorFraction*.88,anchorFraction,anchorFraction*1.10]
      .map(x=>Math.round(clampGeometry(x,.26,.70)*1000)/1000))];
    for(const frac of laneFractions) {
      const lane=available*frac;
      const copyWidth=available-lane-gap;
      if(copyWidth<112)continue;
      const expected=measurer.height(copy,copyWidth,'copy',false);
      const cap=Math.min(art.max,lane/ratio);
      // 25% is the requested target, not a magic 172px constraint. Very
      // wide art at a narrow viewport may physically fit only a shorter
      // visible subject; still evaluate that geometry instead of returning
      // no layout, which suppresses even the bounding-box renderer.
      const minUsable=Math.min(96,Math.max(74,art.min*.40));
      if(cap<minUsable-.5)continue;
      const target=Math.min(cap,Math.max(art.min,expected-topGap,112));
      const areaTarget=Math.min(cap,art.preferred);
      const heights=[target,cap,areaTarget,Math.min(cap,areaTarget*1.07),
        Math.max(minUsable,areaTarget*.93),Math.max(minUsable,target-14),
        Math.max(minUsable,cap-18/Math.max(ratio,.4))];
      for(const height of [...new Set(heights.map(x=>{
        const rounded=Math.round(x*2)/2;
        // Preserve a feasible hard contour-area floor when sampling rounds
        // just below it; no late paint offset or per-species exception.
        return art.compact && !art.contourConflict &&
          rounded<art.min && art.min-rounded<=.75 ? art.min : rounded;
      }))]){
        if(height<minUsable-.5||height>cap+.5)continue;
        const width=height*ratio;
        for(const mode of (panelWidth>=550?['flow-left-inline','flow-right-stack']:
          ratio>1.18?['flow-right-stack','flow-left-inline','flow-left-stack','full-inline']:
          ['flow-left-inline','flow-left-stack','full-inline'])){
          const bio=biologyGeometry(mode==='flow-left-inline'?'left-inline':
            mode==='flow-left-stack'?'left-stack':
            mode==='flow-right-stack'?'right-stack':'full-inline',
            copyWidth,lane,available,measurer,view);
          if(!bio)continue;
          const full=mode==='full-inline';
          const rightBio=mode==='flow-right-stack';
          // 1.28.5 demonstrates two rows of three scores can use space
          // under a compact description without making artwork tiny.
          const scoredDimensions=scoreDimensions(copyWidth,
            scoreScaleBounds(available,copyWidth).rowMin,available,2);
          // Scores can independently promote with either compact biology
          // arrangement underneath the copy. A free-flowing description
          // followed by FULL-WIDTH biology is deliberately a distinct
          // topology: there is no 'shorter column' to insert scores into.
          const scoreOptions=panelWidth<550 &&
            (mode==='flow-left-inline'||mode==='flow-left-stack') &&
            copyWidth>=146 && !!view.scoreStrip?[false,true]:[false];
          for(const promoteScores of scoreOptions){
          const scoreFootprint=promoteScores?
            TILE_GAP+scoredDimensions.height:0;
          const copyEnd=expected+scoreFootprint+
            (full||rightBio?0:TILE_GAP+bio.pairHeight);
          const rightEnd=height+topGap+(rightBio?TILE_GAP+bio.pairHeight:0);
          // Do not reject promotion merely because the artwork cannot grow
          // to the left column's bottom. Compare the real occupied geometry.
          const rowHeight=Math.max(copyEnd,rightEnd);
          const heroHeight=rowHeight+(full?TILE_GAP+bio.height:0);
          const subject=subjectBBoxFor(hero.closest('article'),hero.querySelector('.yofi-hero-art-lane img'));
          const profile=contourLeftProfile(subject);
          // Only introduce contour alternatives when description lines reach
          // the image vertically, and there is meaningful transparent inset.
          // Otherwise the rectangular float is faster and geometrically clearer.
          const contourGain=profile?profile.slice(0,24).reduce((sum,n)=>sum+n,0)/24:0;
          const touches=expected>Math.min(height*.60,140)&&copyWidth<available*.63;
          const contourPossible=panelWidth<550 && !!profile && touches &&
            contourGain>.11 && mode==='full-inline';
          for(const artAlign of [.5,.25]){
            const unfilledArt=Math.max(0,(rightBio?rightEnd:copyEnd)-height-topGap-(rightBio?TILE_GAP+bio.pairHeight:0));
            const shortfall=Math.max(0,art.min-height);
            const areaCost=art.areaWeight*artAreaDeviation(ratio*height*height,art)*15;
            const visualCost=Math.max(0,height-expected+topGap)*.12+
              shortfall*.30+Math.abs(artAlign-.5)*4+
              unfilledArt*.20+areaCost+
              Math.max(0,bio.totalWidth-(bio.inline?320:194))*.08;
            for(const contourWrap of (contourPossible?[false,true]:[false])){
            results.push({flow:true,artAlign,contourWrap,stage:promoteScores?0:-1,
              scores:promoteScores,tiles:false,
              abilities:false,promotion:promoteScores?'100':'000',bioMode:mode,
              scoreSide:'left',scoreBands:2,cols:0,tile:0,gap,tileGap:TILE_GAP,
              rightWidth:0,copyWidth,laneWidth:lane,
              imageWidth:width,imageHeight:height,artTopGap:topGap,
              rowHeight,heroHeight,
              copyHeight:expected,bioHeight:bio.height,
              bioGenderWidth:bio.genderWidth,bioEggWidth:bio.eggWidth,
              bioTotalWidth:bio.totalWidth,
              abilitiesHeight:0,
              scoreRowHeight:promoteScores?scoredDimensions.rowHeight:0,
              scoreFontSize:promoteScores?scoredDimensions.fontSize:0,
              scoreTopGap:HERO_STACK_GAP,
              leftHeight:copyEnd,rightHeight:rightBio?rightEnd:0,
              leftBottom:copyEnd,rightBottom:rightBio?rightEnd:null,
              subjectBottom:topGap+height,
              bottomError:Math.abs(copyEnd-rightEnd),
              internalUnusedArea:(Math.max(0,rowHeight-copyEnd)*copyWidth+
                (rightBio?Math.max(0,rowHeight-rightEnd)*lane:0))/available,
              visualCost,totalFootprint:heroHeight+
                (promoteScores?0:displaced.scores)+
                displaced.vitals+displaced.abilities,
              leftSlack:0,rightSlack:0,artUnderfill:Math.max(0,rowHeight-height-topGap),
              distributeLeft:false,distributeRight:false});
            }
          }
          }
        }
      }
    }
    return results;
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
    // `apply()` detaches the actual Vitals group for layouts without tiles.
    // Keep the same live node in its canonical side host before cloning or
    // measuring; otherwise a visit after a no-Vitals layout has no Vitals to
    // promote and different widths select different candidates.
    if(view.vitals && view.side && view.vitals.parentNode!==view.side)
      view.side.prepend(view.vitals);
    if(view.scoreStrip && view.scoreBanner && view.scoreStrip.parentNode!==view.scoreBanner)
      view.scoreBanner.append(view.scoreStrip);
    const foundation=speciesHeroStates.get(view.hero);
    if(!foundation)return;
    // The *complete* native Gender and Egg bars, including the same outer
    // component boxes, must move between layouts. Do not render a separate
    // compact bar with stage-specific padding, corners or segment geometry.
    if(foundation.gender.parentNode!==view.genderBody)
      view.genderBody.append(foundation.gender);
    if(foundation.right.parentNode!==view.egg)
      view.egg.append(foundation.right);
    if(view.gender.parentNode!==foundation.facts || view.egg.parentNode!==foundation.facts ||
       foundation.facts.children.length!==2){
      foundation.facts.replaceChildren(view.gender,view.egg);
      // Restoring a different *outer* component changes measured facts fit,
      // even if its text has not changed. Recheck short/long placement once.
      foundation.modeSignature='';
    }
  }
  function restore(article, view) {
    const hero=article.querySelector('.yofi-species-hero');
    restoreOriginalDisplays(view || (hero && views.get(hero)));

    clearBBoxRendering(article,hero);
    article.classList.remove('lab3-contour-flow');
    hero?.removeAttribute('data-lab3-contour-wrap');
    hero?.style.removeProperty('--lab3-contour-shape');
    article.classList.remove('lab3-active','lab3-has-right','lab3-tiles','lab3-abilities','lab3-scores','lab3-score-single',
      'lab3-stage0','lab3-stage1','lab3-stage2','lab3-stage3','lab3-bio-full-inline','lab3-flow','lab3-bio-flow-stack','lab3-bio-flow-inline','lab3-bio-flow-right-stack','lab3-contour-flow','lab3-flow-score','lab3-distribute-left','lab3-distribute-right');
    if (hero) {
      if(view?.biologies?.parentNode!==hero)hero.append(view.biologies);
      const foundation = speciesHeroStates.get(hero);
      if (foundation && foundation.description.parentElement !== foundation.flow)
        foundation.flow.append(foundation.description);
      delete hero.dataset.lab3Stage;
      delete hero.dataset.lab3Biology;
      delete hero.dataset.lab3Promotion;
      delete hero.dataset.lab3ScoreHost;
      delete hero.dataset.lab3Priority;
      delete hero.dataset.lab3ImageFloor;
      for (const prop of ['--lab3-gap','--lab3-tile-gap','--lab3-art-width','--lab3-art-height','--lab3-hero-height','--lab3-row-height','--lab3-art-top-gap','--lab3-lane-width','--lab3-score-row-height','--lab3-score-font-size','--lab3-tile-size','--lab3-side-width','--lab3-copy-width','--lab3-bio-gender-width','--lab3-bio-egg-width','--lab3-bio-total-width','--lab3-bio-bar-max','--lab3-bio-height','--lab3-tile-cols','--lab3-bio-inline','--lab3-contour-shape'])
        hero.style.removeProperty(prop);
      // A native restoration occurs only when measured geometry is genuinely
      // infeasible. The same unified solver handles small and large cards.
    }
  }

  const geometryMemo = new WeakMap();
  const MEASUREMENT_CLASSES = Object.freeze([
    'lab3-active','lab3-has-right','lab3-tiles','lab3-abilities','lab3-scores','lab3-score-single',
    'lab3-stage0','lab3-stage1','lab3-stage2','lab3-stage3','lab3-bio-full-inline','lab3-flow','lab3-bio-flow-stack','lab3-bio-flow-inline','lab3-bio-flow-right-stack','lab3-contour-flow','lab3-flow-score','lab3-distribute-left','lab3-distribute-right'
  ]);
  function chooseStage(article,hero,view) {
    const geometryStart=performance.now();
    const raw=hero.getBoundingClientRect().width;
    const style=getComputedStyle(hero);
    const available=raw-parseFloat(style.paddingLeft||'0')-
      parseFloat(style.paddingRight||'0');
    if(!(available>0))return null;
    const image=hero.querySelector('.yofi-hero-art-lane img');
    if(!image)return null;
    const subject=subjectBBoxFor(article,image);
    const ratio=subject?.ratio || portraitRatio(article,image);
    if(!Number.isFinite(ratio)||ratio<=0)return null;
    const height=usablePanelHeight(article);
    const desc=hero.querySelector('.yofi-hero-copy');
    const art=artLimits(height,raw,ratio,subject?.slug,article.getBoundingClientRect().width);
    const hasAbilities=!!view.abilities?.querySelector('.ability');
    const hasScores=!!view.scoreStrip&&
      view.scoreStrip.querySelectorAll(':scope > dt').length===6&&
      view.scoreStrip.querySelectorAll(':scope > dd').length===6;
    const promotions=[];
    for(const tiles of [false,true])for(const scores of [false,true])
      for(const abilities of [false,true]){
        if(scores&&!hasScores||abilities&&!hasAbilities)continue;
        const p={scores,tiles,abilities};
        // Even the narrowest widths go through this same grammar. The
        // unpromoted combination can use a smaller artwork where the text
        // and real available width demand it. There is no compact mode.
        const gap=Math.max(14,Math.min(22,Math.round(available*.015)+3));
        const minCopy=Math.max(124,(parseFloat(getComputedStyle(
          desc?.querySelector('.small-text')||desc).fontSize)||16)*7.3);
        const maximum=(available-gap-minCopy)/ratio;
        // Geometric lane eligibility must not assume the eventual portrait
        // is already at 25% height. A shorter provisional footprint can
        // grow toward the shared content bottom after real widths are solved.
        // Final verification/selection still applies the 25% art floor when
        // there is a physically valid solution satisfying it.
        const minimum=!tiles&&!scores&&!abilities?
          Math.min(art.min,Math.max(90,maximum*.75)):
          Math.min(art.min,2*MIN_TILE+TILE_GAP);
        promotions.push({p,minimum});
      }
    const restoreClasses=MEASUREMENT_CLASSES.filter(c=>article.classList.contains(c));
    if(restoreClasses.length)article.classList.remove(...restoreClasses);
    try {
      const descStyle=getComputedStyle(desc?.querySelector('.small-text')||desc);
      const identity=[currentSpeciesRouteKey(),subject?.slug||'canvas',
        subject?subject.width+':'+subject.height:'',desc?.innerHTML||'',
        view.abilities?.innerHTML||'',cleanText(view.scoreStrip),
        cleanText(view.vitals),cleanText(view.egg),descStyle.fontSize,
        hero.style.getPropertyValue('--lab3-native-ability-font'),height].join('|');
      const tm=article.querySelector('section.moves dd ul[data-yofi-species-tm-columns]');
      const tmFirst=tm?.querySelector(':scope > li > a');
      const tmState=tm?[tm.dataset.yofiSpeciesTmColumns,
        tm.style.getPropertyValue('--yofi-species-tm-rows'),
        Math.round(tm.getBoundingClientRect().width),
        // Theme Overlay can replace anchor text with a generated label after
        // the first card pass. The downstream row height changes even if TM
        // *column count* stays unchanged, so include the actual text geometry.
        tmFirst?.getAttribute('data-p5ov-display')||'',
        tmFirst?getComputedStyle(tmFirst).fontSize:'',
        tmFirst?Math.round(tmFirst.closest('li').getBoundingClientRect().height*10):0
      ].join(':'):'unfitted';
      const key=[available.toFixed(2),ratio.toFixed(4),identity,'tm='+tmState,
        descStyle.fontFamily,descStyle.lineHeight,
        hero.style.getPropertyValue('--lab3-native-ability-line'),
        ...promotions.map(x=>promotionKey(x.p)+':'+x.minimum.toFixed(1))].join('|');
      const prior=geometryMemo.get(hero);
      if(prior?.key===key && prior.layout)return {cached:true,layout:prior.layout};
      const measurer=createMeasurer(hero);
      let proposals=[],displaced;
      try {
        displaced=measurer.nativeFootprints(article,view);
        for(const {p,minimum} of promotions){
          proposals.push(...selectGeometry(p,hero,view,ratio,available,
            minimum,measurer,art,displaced));
        }
        proposals.push(...wrappingGeometry(hero,view,ratio,available,
          measurer,art,displaced));
      } finally {measurer.close();}
      const chosen=chooseFootprintLayout(proposals,displaced,height,art);
      geometryMemo.set(hero,{geometryMs:performance.now()-geometryStart,key,identity,available,layout:null,
        alternatives:chosen.alternatives,candidateCount:proposals.length,
        ranked:chosen.ranked,footprintFloor:chosen.footprintFloor});
      return {cached:false,choice:chosen.choice,
        alternatives:chosen.alternatives,footprintFloor:chosen.footprintFloor};
    } finally {
      if(restoreClasses.length)article.classList.add(...restoreClasses);
    }
  }

  function apply(article,view,layout) {
    const {hero,left,biologies,side,vitals,scoreStrip,abilities}=view;
    const hasRight=layout.tiles||layout.abilities;
    article.classList.add('lab3-active');
    article.classList.toggle('lab3-flow',!!layout.flow);
    article.classList.toggle('lab3-has-right',hasRight);
    article.classList.toggle('lab3-bio-full-inline',layout.bioMode==='full-inline');
    article.classList.toggle('lab3-distribute-left',!!layout.distributeLeft);
    article.classList.toggle('lab3-distribute-right',!!layout.distributeRight);
    article.classList.toggle('lab3-tiles',layout.tiles);
    article.classList.toggle('lab3-abilities',layout.abilities);
    article.classList.toggle('lab3-scores',layout.scores);
    article.classList.toggle('lab3-bio-flow-stack',layout.bioMode==='flow-left-stack');
    article.classList.toggle('lab3-bio-flow-inline',layout.bioMode==='flow-left-inline');
    article.classList.toggle('lab3-bio-flow-right-stack',layout.bioMode==='flow-right-stack');
    article.classList.toggle('lab3-flow-score',!!layout.flow&&!!layout.scores);
    article.classList.toggle('lab3-score-single',layout.scores&&layout.scoreBands===1);
    for(const n of [0,1,2,3])
      article.classList.toggle(`lab3-stage${n}`,layout.stage===n);
    const px=v=>(+v).toFixed(2)+'px';
    const vars={
      '--lab3-gap':px(layout.gap),'--lab3-tile-gap':px(layout.tileGap),
      '--lab3-art-width':px(layout.imageWidth),'--lab3-art-height':px(layout.imageHeight),
      '--lab3-hero-height':px(layout.heroHeight),'--lab3-row-height':px(layout.rowHeight),
      '--lab3-art-top-gap':px(layout.artTopGap||0),
      '--lab3-lane-width':px(layout.laneWidth),
      '--lab3-score-row-height':px(layout.scoreRowHeight),
      '--lab3-score-font-size':px(layout.scoreFontSize||16),
      '--lab3-tile-size':px(layout.tile),'--lab3-side-width':px(layout.rightWidth),
      '--lab3-copy-width':px(layout.copyWidth),'--lab3-bio-height':px(layout.bioHeight),
      '--lab3-bio-gender-width':px(layout.bioGenderWidth),
      '--lab3-bio-egg-width':px(layout.bioEggWidth),
      '--lab3-bio-total-width':px(layout.bioTotalWidth),
      '--lab3-bio-bar-max':'212px',
      '--lab3-tile-cols':String(layout.cols)
    };
    for(const [name,value] of Object.entries(vars))
      if(hero.style.getPropertyValue(name)!==value)hero.style.setProperty(name,value);
    updateContourShape(article,hero,layout);
    if(layout.flow){
      // The native copy/art objects remain the same. Their wrapping
      // relationship, not a second compact selector, is the candidate.
      const foundation=speciesHeroStates.get(hero);
      if(foundation){
        const flow=foundation.flow;
        if(foundation.info.parentNode!==flow||foundation.description.parentNode!==flow||
           flow.lastElementChild!==foundation.description)
          flow.replaceChildren(foundation.info,foundation.description);
        if(foundation.gender.parentNode!==view.genderBody)
          view.genderBody.append(foundation.gender);
        if(foundation.right.parentNode!==view.egg)
          view.egg.append(foundation.right);
      }
      restoreAbilities(view);
      if(layout.scores){
        if(scoreStrip?.parentNode!==foundation?.flow)
          foundation?.flow.append(scoreStrip);
      }else if(scoreStrip?.parentNode!==view.scoreBanner)
        view.scoreBanner.append(scoreStrip);
      if(view.gender.parentNode!==biologies||view.egg.parentNode!==biologies)
        biologies.append(view.gender,view.egg);
      biologies.classList.toggle('lab3-bio-inline',!['flow-left-stack','flow-right-stack'].includes(layout.bioMode));
      const bioParent=['flow-left-stack','flow-left-inline','flow-right-stack'].includes(layout.bioMode)?foundation?.flow:hero;
      if(bioParent&&biologies.parentNode!==bioParent)bioParent.append(biologies);
      if(left.children.length)left.replaceChildren();
      if(side.children.length)side.replaceChildren();
      hero.dataset.lab3Stage='flow';
      hero.dataset.lab3Biology=layout.bioMode;
      hero.dataset.lab3Promotion=layout.promotion;
      hero.dataset.lab3ScoreHost=layout.scores?'left':'native';
      hero.dataset.lab3ContourWrap=article.classList.contains('lab3-contour-flow')?'true':'false';
      hero.dataset.lab3Priority='measured wrapping grammar; native content fit';
      return;
    }
    const full=layout.bioMode==='full-inline';
    const toRight=layout.bioMode==='right-inline'||layout.bioMode==='right-stack';
    const inline=layout.bioMode==='left-inline'||
      layout.bioMode==='right-inline'||full;
    if(view.gender.parentNode!==biologies||view.egg.parentNode!==biologies)
      biologies.append(view.gender,view.egg);
    biologies.classList.toggle('lab3-bio-inline',inline);
    const foundation=speciesHeroStates.get(hero);
    if(foundation){
      if(foundation.gender.parentNode!==view.genderBody)view.genderBody.append(foundation.gender);
      if(foundation.right.parentNode!==view.egg)view.egg.append(foundation.right);
    }
    if(layout.abilities&&abilities&&abilities.parentNode!==side){
      if(!view.abilitiesHome?.isConnected){
        view.abilitiesHome=document.createComment('hero: restore native abilities here');
        abilities.before(view.abilitiesHome);
      }
    }
    if(!layout.abilities)restoreAbilities(view);
    if(!layout.scores&&scoreStrip.parentNode!==view.scoreBanner)
      view.scoreBanner.append(scoreStrip);
    const copy=foundation?.description||hero.querySelector('.yofi-hero-copy');
    const leftNodes=[copy];
    const rightNodes=[];
    if(layout.tiles)rightNodes.push(vitals);
    if(layout.scores&&layout.scoreSide==='left')leftNodes.push(scoreStrip);
    if(toRight){
      // Only a preceding 1x4 vital row permits biology before Abilities.
      if(layout.tiles&&layout.cols===4)rightNodes.push(biologies);
    }
    else if(!full)leftNodes.push(biologies);
    if(layout.abilities)rightNodes.push(abilities);
    // STATS-01 ordering invariant: promoted scores follow Abilities if both
    // share the right column; they never appear above that section.
    if(layout.scores&&layout.scoreSide==='right')rightNodes.push(scoreStrip);
    if(toRight&&!(layout.tiles&&layout.cols===4))rightNodes.push(biologies);
    if(left.children.length!==leftNodes.length||leftNodes.some((n,i)=>left.children[i]!==n))
      left.replaceChildren(...leftNodes);
    if(side.children.length!==rightNodes.length||rightNodes.some((n,i)=>side.children[i]!==n))
      side.replaceChildren(...rightNodes);
    if(full&&biologies.parentNode!==hero)hero.append(biologies);
    else if(!full&&biologies.parentNode===hero)biologies.remove();
    hero.dataset.lab3Stage=String(layout.stage);
    hero.dataset.lab3Biology=layout.bioMode;
    hero.dataset.lab3Promotion=layout.promotion;
    hero.dataset.lab3ScoreHost=layout.scoreSide;
    hero.dataset.lab3Priority='measured grammar; content promotion before bounded distribution';
    hero.dataset.lab3ImageFloor=String(Math.round(artFloor(hero.getBoundingClientRect().width,
      layout.imageWidth/layout.imageHeight,usablePanelHeight(article))));
  }

  function physicalEndpoints(hero,view,layout) {
    const root=hero.getBoundingClientRect();
    const last=container=>{
      if(!container)return null;
      const nodes=[...container.children].filter(e=>{
        const css=getComputedStyle(e);
        return css.display!=='none'&&css.position!=='absolute';
      });
      return nodes.length?nodes[nodes.length-1].getBoundingClientRect().bottom-root.top:null;
    };
    const lane=hero.querySelector('.yofi-hero-art-lane');
    const artTop=lane?.getBoundingClientRect().top-root.top||0;
    const left=last(view.left),right=(layout.tiles||layout.abilities)?last(view.side):null;
    const subject=artTop+layout.artTopGap+layout.imageHeight;
    const boxes=[left,right,subject].filter(Number.isFinite);
    const spread=boxes.length?Math.max(...boxes)-Math.min(...boxes):Infinity;
    return {left,right,subject,spread,artTop};
  }
  function sparkleExpansionFits(article,hero,layout) {
    if(hero.classList.contains('lab3-sparkle-infeasible'))return false;
    if(!hero.classList.contains('lab3-sparkle-expanded'))return true;
    const figure=hero.querySelector('.yofi-hero-art-lane .square-image > figure');
    if(!figure)return true;
    const bounds=figure.getBoundingClientRect(),card=article.getBoundingClientRect();
    // The entire subject frame, including all four QoL corners, must fit.
    return bounds.left>=card.left+2 && bounds.right<=card.right-2;
  }
  function scoreTextFits(view,layout) {
    if(!layout.scores||!view.scoreStrip)return true;
    const strip=view.scoreStrip;
    const ink=document.createRange();
    for(const cell of strip.children){
      if(cell.tagName!=='DT'&&cell.tagName!=='DD')continue;
      const box=cell.getBoundingClientRect();
      ink.selectNodeContents(cell);
      const content=ink.getBoundingClientRect();
      const verticalAllowance=Math.max(1,(layout.scoreRowHeight/2-box.height)/2+.75);
      if(content.width&&(
        content.left<box.left-.75||content.right>box.right+.75||
        content.top<box.top-verticalAllowance||
        content.bottom>box.bottom+verticalAllowance))return false;
    }
    return true;
  }
  function verifyPaintedCandidate(article,view,proposal) {
    const hero=view.hero;
    clearBBoxRendering(article,hero);
    const layout={...proposal};
    apply(article,view,layout);
    if(layout.flow){
      const heroBox=hero.getBoundingClientRect();
      const lane=hero.querySelector('.yofi-hero-art-lane').getBoundingClientRect();
      const description=hero.querySelector('.yofi-hero-copy').getBoundingClientRect();
      const figure=hero.querySelector('.yofi-hero-art-lane .square-image > figure').getBoundingClientRect();
      const subject=lane.top+layout.artTopGap+layout.imageHeight;
      if(!heroBox.width||lane.right>heroBox.right+1||
         (hero.scrollWidth-hero.clientWidth)>2 ||
         subject>heroBox.bottom+2 || !scoreTextFits(view,layout))return null;
      renderSubjectBBox(article,hero,layout);
      if(!sparkleExpansionFits(article,hero,layout)){
        clearBBoxRendering(article,hero);
        return null;
      }
      const biologyOnLeft=layout.bioMode==='flow-left-inline'||
        layout.bioMode==='flow-left-stack';
      layout.leftBottom=(biologyOnLeft?
        view.biologies.getBoundingClientRect().bottom:
        description.bottom)-heroBox.top;
      layout.subjectBottom=subject-heroBox.top;
      const biologyBottom=layout.bioMode==='flow-right-stack'?
        view.biologies.getBoundingClientRect().bottom-heroBox.top:null;
      if(biologyBottom!==null && biologyBottom>heroBox.height+2)return null;
      layout.rightBottom=biologyBottom;
      // Once description text continues below a right float, there is NO
      // independent shorter column. Measure the single flow's actual bottom
      // instead of penalizing the natural full-width continuation.
      layout.wrapsBelowArt=layout.bioMode==='full-inline' &&
        description.bottom>subject+2;
      layout.bottomError=layout.wrapsBelowArt?0:
        Math.abs(layout.leftBottom-(biologyBottom??layout.subjectBottom));
      layout.artUnderfill=layout.wrapsBelowArt||biologyBottom!==null?0:
        Math.max(0,layout.leftBottom-layout.subjectBottom);
      layout.internalUnusedArea=layout.wrapsBelowArt?0:biologyBottom!==null?
        Math.max(0,heroBox.height-Math.max(layout.leftBottom,biologyBottom))*layout.copyWidth/
          Math.max(1,heroBox.width):
        Math.max(0,subject-description.bottom)*layout.copyWidth/
          Math.max(1,heroBox.width);
      layout.totalFootprint=heroBox.height+proposal.totalFootprint-proposal.heroHeight;
      layout.physicalAdjustment=0;
      return layout;
    }
    const px=x=>x.toFixed(2)+'px';
    const hasRight=layout.tiles||layout.abilities;
    // Reconcile measured native text only by changing *component dimensions*.
    // No offset, justify-content:space-between, or margin may conceal a gap.
    for(let attempt=0;attempt<3;attempt++){
      let endpoints=physicalEndpoints(hero,view,layout);
      if(hasRight&&endpoints.right!==null&&
         Math.abs(endpoints.left-endpoints.right)>BOTTOM_EPSILON&&layout.scores){
        const delta=layout.scoreSide==='left'?
          endpoints.right-endpoints.left:endpoints.left-endpoints.right;
        const scoreWidth=layout.scoreSide==='right'?layout.rightWidth:layout.copyWidth;
        const range=scoreScaleBounds(hero.getBoundingClientRect().width,scoreWidth);
        const corrected=clampGeometry(layout.scoreRowHeight+delta/(layout.scoreBands||2),
          range.rowMin,range.rowMax);
        if(Math.abs(corrected-layout.scoreRowHeight)>.25){
          layout.scoreRowHeight=corrected;
          layout.scoreFontSize=scoreDimensions(scoreWidth,corrected,
            hero.getBoundingClientRect().width,layout.scoreBands||2).fontSize;
          hero.style.setProperty('--lab3-score-row-height',px(corrected));
          hero.style.setProperty('--lab3-score-font-size',px(layout.scoreFontSize));
          endpoints=physicalEndpoints(hero,view,layout);
        }
      }
      // Measured flex distribution may correct the shorter stacked side;
      // do not treat an intrinsic-content height difference as automatic
      // failure while its last component can still reach the common bottom.
      if(hasRight&&Math.abs(endpoints.left-endpoints.right)>BOTTOM_EPSILON&&
         !layout.distributeLeft&&!layout.distributeRight)break;
      const target=hasRight?Math.max(endpoints.left,endpoints.right):endpoints.left;
      const wanted=target-endpoints.artTop-layout.artTopGap;
      const subjectSlug=subjectBBoxFor(article,hero.querySelector('.yofi-hero-art-lane img'))?.slug;
      const artBound=artLimits(usablePanelHeight(article),
        hero.getBoundingClientRect().width,
        layout.imageWidth/layout.imageHeight,subjectSlug,article.getBoundingClientRect().width);
      const upper=Math.min(artBound.max,
        layout.laneWidth/(layout.imageWidth/layout.imageHeight));
      const min=proposal.promotion==='000'?Math.min(90,proposal.imageHeight):artBound.min;
      if(wanted<min-.75)break;
      const capped=Math.min(wanted,upper);
      layout.imageHeight=capped;
      layout.imageWidth=capped*(proposal.imageWidth/proposal.imageHeight);
      layout.rowHeight=target;
      layout.heroHeight=target+(layout.bioMode==='full-inline'?TILE_GAP+layout.bioHeight:0);
      hero.style.setProperty('--lab3-art-height',px(capped));
      hero.style.setProperty('--lab3-art-width',px(layout.imageWidth));
      hero.style.setProperty('--lab3-row-height',px(layout.rowHeight));
      hero.style.setProperty('--lab3-hero-height',px(layout.heroHeight));
      endpoints=physicalEndpoints(hero,view,layout);
      const columnError=hasRight&&endpoints.right!=null?
        Math.abs(endpoints.left-endpoints.right):0;
      const artUnderfill=Math.max(0,target-(endpoints.artTop+layout.artTopGap+layout.imageHeight));
      if(columnError<=BOTTOM_EPSILON &&
         (artUnderfill<=BOTTOM_EPSILON||layout.imageHeight>=upper-.75)){
        const top=hero.getBoundingClientRect().top;
        const rightNode=view.side.getBoundingClientRect();
        const artLane=hero.querySelector('.yofi-hero-art-lane').getBoundingClientRect();
        // A visible overflow is not fixed by clipping or reducing text size.
        if(artLane.right>hero.getBoundingClientRect().right+1 ||
           rightNode.right>hero.getBoundingClientRect().right+1)break;
        renderSubjectBBox(article,hero,layout);
        if(!sparkleExpansionFits(article,hero,layout))break;
        const painted=physicalEndpoints(hero,view,layout);
        const sideErr=hasRight&&painted.right!=null?
          Math.abs(painted.left-painted.right):0;
        const paintedArtGap=Math.max(0,target-painted.subject);
        if(sideErr>BOTTOM_EPSILON||
           (paintedArtGap>BOTTOM_EPSILON&&layout.imageHeight<upper-.75)||
           !scoreTextFits(view,layout))break;
        layout.leftBottom=painted.left;
        layout.rightBottom=painted.right;
        layout.subjectBottom=painted.subject;
        layout.bottomError=painted.spread;
        layout.artUnderfill=Math.max(0,target-painted.subject);
        // Retain measured unused area; zero was incorrectly treating
        // physical bottom alignment as complete useful-space occupancy.
        layout.internalUnusedArea=proposal.internalUnusedArea;
        layout.leftSlack=proposal.leftSlack;
        layout.rightSlack=proposal.rightSlack;
        layout.totalFootprint=proposal.totalFootprint+
          layout.heroHeight-proposal.heroHeight;
        layout.physicalAdjustment=Math.max(
          Math.abs(layout.imageHeight-proposal.imageHeight),
          Math.abs(layout.scoreRowHeight-proposal.scoreRowHeight));
        return layout;
      }
    }
    clearBBoxRendering(article,hero);
    return null;
  }
  function informationVisibility(article) {
    const scrollable=article.querySelector(':scope > .scrollable');
    if(!scrollable)return {moveRows:0,otherRows:0,scrollHeight:Infinity};
    const root=scrollable.getBoundingClientRect();
    const limit=scrollable.clientHeight;
    const offset=scrollable.scrollTop;
    const contentPos=node=>{
      const r=node.getBoundingClientRect();
      return {top:r.top-root.top+offset,bottom:r.bottom-root.top+offset};
    };
    const rows=new Set();let moveItems=0;
    for(const item of scrollable.querySelectorAll('section.moves li')){
      const r=contentPos(item);
      if(r.top>=-.5&&r.bottom<=limit+.5){
        rows.add(Math.round(r.top/3)*3);
        moveItems++;
      }
    }
    let other=0;
    for(const node of scrollable.querySelectorAll(
        'section.abilities .ability, section.evolution p, section.evolution h3,'+
        'section.moves h2, section.notes p')){
      const r=contentPos(node);
      if(r.top>=-.5&&r.bottom<=limit+.5)other++;
    }
    return {moveRows:rows.size,moveItems,otherRows:other,
      scrollHeight:scrollable.scrollHeight};
  }
  // Clone the *render-ready* native card once, into a hidden nonflow sibling.
  // This preserves original CSS inheritance and actual text wrap, while
  // avoiding 50-150 live-card mutations/reflows during every navigation.
  // All candidate DOM measurements happen before any visible candidate is
  // committed. Reading getBoundingClientRect forces layout, NOT a GUI paint.
  function candidateMeasurementStage(article,view) {
    const main=article.parentNode;
    const realScroll=article.querySelector(':scope > .scrollable');
    if(!main||!realScroll)return null;
    const cardRect=article.getBoundingClientRect();
    if(!(cardRect.width>0))return null;
    const shadow=article.cloneNode(true);
    shadow.setAttribute('data-yofi-layout-probe','');
    shadow.removeAttribute('id');
    shadow.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    shadow.style.cssText='position:fixed!important;left:-100000px!important;top:0!important;'+
      `width:${cardRect.width}px!important;height:${cardRect.height}px!important;`+
      'max-width:none!important;max-height:none!important;visibility:hidden!important;'+
      'pointer-events:none!important;overflow:hidden!important;contain:layout style paint!important;';
    const shadowScroll=shadow.querySelector(':scope > .scrollable');
    if(shadowScroll){
      shadowScroll.style.setProperty('height',realScroll.clientHeight+'px','important');
      shadowScroll.style.setProperty('max-height',realScroll.clientHeight+'px','important');
    }
    main.append(shadow);
    try {
      const hero=shadow.querySelector('.yofi-species-hero');
      const q=selector=>hero?.querySelector(selector);
      const v={hero,left:q(':scope > .lab3-left-extra'),
        biologies:q('.lab3-biologies'),gender:q('.lab3-gender'),
        genderBody:q('.lab3-gender > .lab3-copy-facts'),egg:q('.lab3-egg'),
        side:q(':scope > .lab3-right'),vitals:q('.lab3-vitals'),
        scoreStrip:shadow.querySelector('dl.yofi-scores-strip'),
        scoreBanner:shadow.querySelector('.yofi-scores-banner'),
        abilities:shadow.querySelector('section.abilities'),abilitiesHome:null};
      const flow=q('.yofi-hero-flow');
      const description=q('.yofi-hero-copy');
      const info=q('.yofi-hero-art-lane');
      const gender=q('.lab3-gender .yofi-hero-gender');
      const right=q('.lab3-egg .yofi-hero-facts-right');
      if(!hero||!v.left||!v.side||!v.biologies||!v.gender||!v.egg||
         !v.vitals||!v.scoreStrip||!v.scoreBanner||!flow||!description||!info||
         !gender||!right){shadow.remove();return null;}
      const foundation={hero,flow,description,info,gender,right,
        facts:q('.yofi-hero-facts:not(.lab3-copy-facts)'),modeSignature:''};
      speciesHeroStates.set(hero,foundation);
      views.set(hero,v);
      if(v.abilities?.closest('.lab3-right')) {
        const home=document.createComment('measure: restore abilities');
        const next=shadowScroll?.querySelector('section.evolution, section.moves');
        if(next)next.before(home);
        else shadowScroll?.append(home);
        v.abilitiesHome=home;
      }
      // The shadow starts as a clone of the *currently selected* card. Strip
      // every previous hero placement so its verification outcome depends only
      // on source content and the current panel, not resize history.
      restore(shadow,v);
      // TM row count participates in page scroll-height comparison. A cloned
      // grid can carry a previous width's explicit track/row settings; fit
      // it synchronously to this shadow's current content width before any
      // candidate can inherit that stale downstream height.
      if(!document.documentElement.classList.contains('yofi-type-theme')){
        for(const ul of shadow.querySelectorAll('section.moves dd ul'))
          if(isSpeciesTMList(ul))fitSpeciesTMColumns(ul,false);
      }
      return {article:shadow,view:v,close:()=>shadow.remove()};
    }catch(error){shadow.remove();throw error;}
  }
  function acceptStage(article,view,selection) {
    const hero=view.hero;
    if(selection.cached){
      apply(article,view,selection.layout);
      renderSubjectBBox(article,hero,selection.layout);
      return selection.layout;
    }
    const memo=geometryMemo.get(hero);
    const verified=[];
    const verificationStart=performance.now();
    let measured=0;
    const stage=candidateMeasurementStage(article,view);
    if(!stage){
      // A missing temporary measurement environment is a failure to verify,
      // not permission to repaint every candidate on the live page.
      restore(article,view);
      if(memo){memo.layout=null;memo.failure='candidate measurement stage unavailable';}
      return null;
    }
    try{
      for(const proposal of selection.alternatives||[]){
        const result=verifyPaintedCandidate(stage.article,stage.view,proposal);
        measured++;
        if(!result)continue;
        verified.push({layout:result,visibility:{
          scrollHeight:stage.article.querySelector(':scope > .scrollable')?.scrollHeight||Infinity
        }});
      }
    }finally{stage.close();}
    if(memo){memo.verifiedPromotions=verified.reduce((count,v)=>{const k=v.layout.promotion;count[k]=(count[k]||0)+1;return count;},{});
      memo.verifiedBands={single:verified.filter(v=>v.layout.scores&&v.layout.scoreBands===1).length,double:verified.filter(v=>v.layout.scores&&v.layout.scoreBands===2).length};
      memo.verificationMs=performance.now()-verificationStart;
      memo.measuredCandidates=measured;
      memo.physicallyValidCandidates=verified.length;
      memo.liveCandidateCommits=0;}
    if(!verified.length){
      restore(article,view);
      if(memo){memo.layout=null;memo.failure='no physically aligned composition';}
      return null;
    }
    // Make selection after exact layout verification, not Move-row counting.
    // First drop layouts Pareto-dominated in promotion, artwork, measured
    // unused area and real scroll height. Scroll is comparative only.
    const imageRatio=(verified[0]?.layout?.imageWidth||1)/
      (verified[0]?.layout?.imageHeight||1);
    const artFloor=artLimits(usablePanelHeight(article),
      hero.getBoundingClientRect().width,imageRatio,
      subjectBBoxFor(article,hero.querySelector('.yofi-hero-art-lane img'))?.slug,article.getBoundingClientRect().width).min;
    const artCompliant=verified.filter(v=>v.layout.imageHeight>=artFloor-.75);
    const initiallyEligible=artCompliant.length?artCompliant:verified;
    const guideForChosen=artLimits(usablePanelHeight(article),
      hero.getBoundingClientRect().width,imageRatio,
      subjectBBoxFor(article,hero.querySelector('.yofi-hero-art-lane img'))?.slug,article.getBoundingClientRect().width);
    const areaEligible=guideForChosen.compact&&guideForChosen.contourCoverage!==null?
      initiallyEligible.filter(v=>{
        const h=v.layout.imageHeight;
        return h>=guideForChosen.min-.75&&h<=guideForChosen.max+.75;
      }):initiallyEligible;
    const eligible=areaEligible.length?areaEligible:initiallyEligible;
    const scored=eligible.map(item=>{
      const g=item.layout;
      const promoted=(g.tiles?1:0)+(g.scores?1:0)+(g.abilities?1:0);
      const areaWaste=(g.internalUnusedArea||0)+(g.excessArtworkWidth||0)*.45;
      return {...item,promoted,areaWaste};
    });
    const pareto=scored.filter(a=>!scored.some(b=>b!==a&&
      b.promoted>=a.promoted &&
      b.layout.bottomError<=a.layout.bottomError+1 &&
      b.areaWaste<=a.areaWaste+3 &&
      b.visibility.scrollHeight<=a.visibility.scrollHeight+8 &&
      b.layout.imageHeight>=a.layout.imageHeight-7 &&
      (b.promoted>a.promoted||b.areaWaste<a.areaWaste-3||
        b.visibility.scrollHeight<a.visibility.scrollHeight-8||
        b.layout.imageHeight>a.layout.imageHeight+7)));
    const available=geometryMemo.get(hero)?.available||hero.clientWidth;
    // A 3-component promotion is strongly preferred when the wider card
    // really accommodates it without excessive waste, but is never forced.
    const subjectSlug=subjectBBoxFor(article,hero.querySelector('.yofi-hero-art-lane img'))?.slug;
    const promotionWeight=available>=1010?105:available>=770?72:available<550?125:55;
    const compared=(pareto.length?pareto:scored).sort((a,b)=>{
      const rank=x=>{
        const g=x.layout;
        const anchor=artLimits(usablePanelHeight(article),available,
          g.imageWidth/Math.max(1,g.imageHeight),subjectSlug,article.getBoundingClientRect().width);
        // Anchor actual bbox AREA. A broad butterfly and a tall bear need
        // not have equal heights; their rectangles should be comparable.
        const actualArea=Math.max(1,g.imageWidth*g.imageHeight);
        const artPenalty=anchor.areaWeight*
          artAreaDeviation(actualArea,anchor)*54+
          (1-anchor.areaWeight)*Math.max(0,190-g.imageHeight)*.28;
        const wastePenalty=x.areaWaste*.44+
          (g.leftSlack+g.rightSlack)*.08+
          (g.artUnderfill||0)*2.8;
        return -x.promoted*promotionWeight+g.visualCost*.4+
          wastePenalty+g.bottomError*2.5+
          x.visibility.scrollHeight*.14+artPenalty;
      };
      return rank(a)-rank(b)||
        b.promoted-a.promoted||
        a.layout.totalFootprint-b.layout.totalFootprint||
        candidateIdentity(a.layout).localeCompare(candidateIdentity(b.layout));
    });
    // Exactly ONE attempted live commit in the common case. If its physical
    // measurements disagree with the source-faithful sandbox, try the next
    // independently verified candidate synchronously before display.
    for(const candidate of compared){
      const committed=verifyPaintedCandidate(article,view,candidate.layout);
      if(memo)memo.liveCandidateCommits++;
      if(!committed)continue;
      renderSubjectBBox(article,hero,committed);
      if(memo){
        memo.layout=committed;memo.failure=null;
        memo.actualFootprint=article.querySelector('.scrollable')?.scrollHeight||null;
        const visible=informationVisibility(article);
        memo.visibleMoves=visible.moveRows;
        memo.visibleMoveItems=visible.moveItems;
        memo.visibleOther=visible.otherRows;
      }
      return committed;
    }
    restore(article,view);
    if(memo){memo.layout=null;memo.failure='sandbox/live geometry disagreed';}
    return null;
  }

    const SPECIES_TM_CSS = `
    /* Light/Dark: permit the existing TM grid to shrink with the card. */
    html:not(.yofi-type-theme) .page > main article > .scrollable section.moves > dl > dd {
      min-width: 0 !important;
    }
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
  function fitSpeciesTMColumns(ul, observe=true) {
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
    if(observe&&tmResizeObserver&&!tmGridSeen.has(ul)){tmGridSeen.add(ul);tmResizeObserver.observe(ul);}
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
        // The real fit/wrap decision uses synchronous rendered-element geometry.
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
      // No allocation is certified until the DOM geometry passes hard fit.
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
      installSpeciesTMColumns();

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
        // Restore the untransformed zoom only while the native fitting pass
        // measures it; the selected transform returns in this same tick.
        const previousHero=article.querySelector('.yofi-species-hero');
        if(previousHero)clearBBoxRendering(article,previousHero);
        installSpeciesPresentation(article);
        updateNativeHero(article);
        const hero = article.querySelector('.yofi-species-hero');
        const required = article.querySelector('section.stats > .yofi-scores-banner') &&
          hero?.querySelector('.yofi-hero-copy') && hero.querySelector('.yofi-hero-art-lane');
        if (!required || !vitalData(article)) { restore(article); continue; }
        const data = vitalData(article);
        const view = viewFor(hero);
        if (!locateCanonical(view, article)) { restore(article, view); continue; }
        // Restore native ownership BEFORE capturing its typography. Otherwise
        // the previous promoted width's computed Abilities font is reused as
        // the next panel's native baseline, making the solver history-dependent.
        restore(article,view);
        syncView(view, article, data);
        const selection = chooseStage(article,hero,view);
        if (selection) {
          acceptStage(article,view,selection);
        } else {
          restore(article,view);
          clearBBoxRendering(article,hero);
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
    const article = visibleSpeciesArticles()[0];
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
      projectedAffectedHeight: +(geometryMemo.get(hero)?.layout?.totalFootprint || 0).toFixed(1),
      scoreBands: geometryMemo.get(hero)?.layout?.scoreBands || null,
      biologyHeight: geometryMemo.get(hero)?.layout?.bioHeight || 0,
      geometryMs: +(geometryMemo.get(hero)?.geometryMs || 0).toFixed(1),
      verificationMs: +(geometryMemo.get(hero)?.verificationMs || 0).toFixed(1),
      scoreRowHeight: +(geometryMemo.get(hero)?.layout?.scoreRowHeight || 0).toFixed(1),
      scoreFontSize: +(geometryMemo.get(hero)?.layout?.scoreFontSize || 0).toFixed(1),
      scoreTopGap: +(geometryMemo.get(hero)?.layout?.scoreTopGap || 0).toFixed(1),
      scoreHost: geometryMemo.get(hero)?.layout?.scoreSide || null,
      evaluatedCandidates:geometryMemo.get(hero)?.candidateCount || 0,
      measuredCandidates:geometryMemo.get(hero)?.measuredCandidates ?? null,
      liveCandidateCommits:geometryMemo.get(hero)?.liveCandidateCommits ?? null,
      physicallyValidCandidates:geometryMemo.get(hero)?.physicallyValidCandidates ?? null,
      verifiedScoreBands:geometryMemo.get(hero)?.verifiedBands || null,
      verifiedPromotions:geometryMemo.get(hero)?.verifiedPromotions || null,
      selectionFailure:geometryMemo.get(hero)?.failure || null,
      visibleMoveRows:geometryMemo.get(hero)?.visibleMoves ?? null,
      visibleMoveItems:geometryMemo.get(hero)?.visibleMoveItems ?? null,
      visibleOtherRows:geometryMemo.get(hero)?.visibleOther ?? null,
      actualScrollHeight:geometryMemo.get(hero)?.actualFootprint ?? null,
      leadingCandidates:geometryMemo.get(hero)?.ranked?.slice(0,5) || [],
      rightWidth: +(parseFloat(hero?.style.getPropertyValue('--lab3-side-width')) || 0).toFixed(1),
      chosenGeometry:geometryMemo.get(hero)?.layout?{
        leftBottom:geometryMemo.get(hero).layout.leftBottom,
        rightBottom:geometryMemo.get(hero).layout.rightBottom,
        subjectBottom:geometryMemo.get(hero).layout.subjectBottom,
        bottomError:geometryMemo.get(hero).layout.bottomError,
        internalUnusedArea:geometryMemo.get(hero).layout.internalUnusedArea,
        leftDistribution:geometryMemo.get(hero).layout.distributeLeft,
        rightDistribution:geometryMemo.get(hero).layout.distributeRight,
        imageSlack:geometryMemo.get(hero).layout.artUnderfill,
        copyPlateauWaste:geometryMemo.get(hero).layout.copyPlateauWaste,
        rightSlack:geometryMemo.get(hero).layout.rightSlack,
        physicalAdjustment:geometryMemo.get(hero).layout.physicalAdjustment || 0
      }:null,
      renderedBottoms:(() => {
        if(!hero || !article?.classList.contains('lab3-active'))return null;
        const root=hero.getBoundingClientRect();
        const last=(selector)=>{
          const container=hero.querySelector(selector);
          return container?.lastElementChild?.getBoundingClientRect().bottom-root.top;
        };
        const art=hero.querySelector('.yofi-hero-art-lane .square-image figure');
        const left=last(':scope > .lab3-left-extra');
        const right=article.classList.contains('lab3-has-right')?
          last(':scope > .lab3-right'):null;
        const figure=art?.getBoundingClientRect();
        const candidate=geometryMemo.get(hero)?.layout;
        // The figure can include a credit. The visible subject ends at the
        // top-anchored, measured painted rectangle, not the PNG canvas.
        const lane=hero.querySelector('.yofi-hero-art-lane')?.getBoundingClientRect();
        const subject=lane&&candidate?
          lane.top-root.top+candidate.artTopGap+candidate.imageHeight:null;
        const rowHeight=candidate?.rowHeight??root.height;
        const measured=[left,right,subject].filter(Number.isFinite);
        return {left,right,subject,rowHeight,hero:root.height,
          spread:measured.length?Math.max(...measured)-Math.min(...measured):null,
          leftOverhang:typeof left==='number'?left-rowHeight:null,
          rightOverhang:typeof right==='number'?right-rowHeight:null,
          imageUnderfill:typeof subject==='number'?rowHeight-subject:null};
      })(),
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
  window.__yofiHeroLayoutCandidates = () => {
    const article=visibleSpeciesArticles()[0];
    const hero=article?.querySelector('.yofi-species-hero');
    return geometryMemo.get(hero)?.ranked?.slice() || [];
  };
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
      if(target?.closest?.('[data-yofi-layout-probe]'))return false;
      if(mutation.addedNodes?.length && [...mutation.addedNodes].every(n=>
          n.nodeType!==1||n.matches?.('[data-yofi-layout-probe]')))return false;
      if(mutation.removedNodes?.length && [...mutation.removedNodes].every(n=>
          n.nodeType!==1||n.matches?.('[data-yofi-layout-probe]')))return false;
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
        return ['data-p5ov-display','data-p5ov-kind','data-yofi-forced-sex','data-yofi-corner'].includes(m.attributeName) &&
          !!target?.closest?.(LIVE_CARD_SELECTOR)?.getClientRects().length;
      })) requestHeroTick();
    });
    tmWatch.observe(root, { subtree:true, attributes:true,
      attributeFilter:['data-p5ov-display','data-p5ov-kind','data-yofi-forced-sex','data-yofi-corner','class'] });
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
