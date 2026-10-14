// ==UserScript==
// @name         Poke5e Theme Overlay v0.3.39 - Stable Card Handoff
// @namespace    yofi.poke5e.theme-presentation-companion
// @version      0.3.39
// @description  Optional theme treatments for QOL v0.12.29 + Species Card v0.1.2; synchronizes incoming card colors before reveal.
// @match        https://poke5e.app/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  const KEY = '__p5ThemeOverlay0339';
  const STYLE_ID = 'p5-theme-overlay-v0339-styles';
  const PRE_REVEAL_EVENT = 'yofi:species-card-before-reveal';
  for (const old of ['__p5ThemeOverlay021', '__p5ThemeOverlay020', '__p5ThemeOverlay022', '__p5ThemeOverlay023', '__p5ThemeOverlay024', '__p5ThemeOverlay025', '__p5ThemeOverlay026', '__p5ThemeOverlay027', '__p5ThemeOverlay028', '__p5ThemeOverlay029', '__p5ThemeOverlay030', '__p5ThemeOverlay031', '__p5ThemeOverlay032', '__p5ThemeOverlay033', '__p5ThemeOverlay034', '__p5ThemeOverlay035', '__p5ThemeOverlay036', '__p5ThemeOverlay037', '__p5ThemeOverlay038', '__p5ThemeOverlay039', '__p5ThemeOverlay0310', '__p5ThemeOverlay0311', '__p5ThemeOverlay0312', '__p5ThemeOverlay0313', '__p5ThemeOverlay0314', '__p5ThemeOverlay0315', '__p5ThemeOverlay0316', '__p5ThemeOverlay0317', '__p5ThemeOverlay0318', '__p5ThemeOverlay0319', '__p5ThemeOverlay0320', '__p5ThemeOverlay0321', '__p5ThemeOverlay0322', '__p5ThemeOverlay0323', '__p5ThemeOverlay0324', '__p5ThemeOverlay0325', '__p5ThemeOverlay0326', '__p5ThemeOverlay0327', '__p5ThemeOverlay0328', '__p5ThemeOverlay0329', '__p5ThemeOverlay0330', '__p5ThemeOverlay0331', '__p5ThemeOverlay0332', '__p5ThemeOverlay0333', '__p5ThemeOverlay0334', '__p5ThemeOverlay0335', '__p5ThemeOverlay0336', '__p5ThemeOverlay0337', '__p5ThemeOverlay0338']) {
    try { window[old]?.stop?.(); } catch (error) { console.warn('[P5 Theme] Previous overlay stop failed:', error); }
  }
  document.getElementById(STYLE_ID)?.remove();
  document.getElementById('p5-theme-overlay-v0338-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0337-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0335-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0336-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0334-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0332-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0333-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0328-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0329-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0330-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0331-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0326-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0327-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0313-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0314-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0315-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0316-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0317-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0318-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0319-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0320-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0321-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0322-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0323-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0324-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0325-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0311-styles')?.remove();
  document.getElementById('p5-theme-overlay-v0312-styles')?.remove();


  // QOL v0.12.21 leaves only the native Light/Dark controls. This module
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

  // Offline scan: 613 native Poké5e dual-type portraits from the supplied
  // 1,139-image normal-artwork analysis. Values are [primary, secondary, banner, tint].
  // This overlay never fetches or samples image pixels, alters portrait nodes,
  // changes move-color metadata, or modifies the original type header gradient.
  const ARTWORK_TYPE_CHOICES = {"bulbasaur":["grass","poison","grass","poison"],"ivysaur":["grass","poison","grass","poison"],"venusaur":["grass","poison","grass","poison"],"charizard":["fire","flying","fire","flying"],"butterfree":["bug","flying","flying","bug"],"weedle":["bug","poison","bug","poison"],"kakuna":["bug","poison","bug","poison"],"beedrill":["bug","poison","bug","poison"],"pidgey":["normal","flying","normal","flying"],"pidgeotto":["normal","flying","normal","flying"],"pidgeot":["normal","flying","normal","flying"],"spearow":["normal","flying","normal","flying"],"fearow":["normal","flying","normal","flying"],"nidoqueen":["poison","ground","poison","ground"],"nidoking":["poison","ground","poison","ground"],"jigglypuff":["normal","fairy","normal","fairy"],"wigglytuff":["normal","fairy","normal","fairy"],"zubat":["poison","flying","poison","flying"],"golbat":["poison","flying","poison","flying"],"oddish":["grass","poison","grass","poison"],"gloom":["grass","poison","poison","grass"],"vileplume":["grass","poison","poison","grass"],"paras":["bug","grass","bug","grass"],"parasect":["bug","grass","bug","grass"],"venonat":["bug","poison","poison","bug"],"venomoth":["bug","poison","poison","bug"],"poliwrath":["water","fighting","water","fighting"],"bellsprout":["grass","poison","grass","poison"],"weepinbell":["grass","poison","grass","poison"],"victreebel":["grass","poison","grass","poison"],"tentacool":["water","poison","water","poison"],"tentacruel":["water","poison","water","poison"],"geodude":["rock","ground","rock","ground"],"graveler":["rock","ground","rock","ground"],"golem":["rock","ground","rock","ground"],"slowpoke":["water","psychic","psychic","water"],"slowbro":["water","psychic","psychic","water"],"magnemite":["electric","steel","steel","electric"],"magneton":["electric","steel","steel","electric"],"farfetchd":["normal","flying","normal","flying"],"doduo":["normal","flying","normal","flying"],"dodrio":["normal","flying","normal","flying"],"dewgong":["water","ice","ice","water"],"cloyster":["water","ice","water","ice"],"gastly":["ghost","poison","ghost","poison"],"haunter":["ghost","poison","ghost","poison"],"gengar":["ghost","poison","ghost","poison"],"onix":["rock","ground","rock","ground"],"exeggcute":["grass","psychic","psychic","grass"],"exeggutor":["grass","psychic","grass","psychic"],"rhyhorn":["ground","rock","rock","ground"],"rhydon":["ground","rock","rock","ground"],"starmie":["water","psychic","water","psychic"],"mr-mime":["psychic","fairy","fairy","psychic"],"scyther":["bug","flying","bug","flying"],"jynx":["ice","psychic","ice","psychic"],"gyarados":["water","flying","flying","water"],"lapras":["water","ice","ice","water"],"omanyte":["rock","water","rock","water"],"omastar":["rock","water","rock","water"],"kabuto":["rock","water","rock","water"],"kabutops":["rock","water","rock","water"],"aerodactyl":["rock","flying","flying","rock"],"articuno":["ice","flying","flying","ice"],"zapdos":["electric","flying","electric","flying"],"moltres":["fire","flying","fire","flying"],"dragonite":["dragon","flying","flying","dragon"],"hoothoot":["normal","flying","normal","flying"],"noctowl":["normal","flying","normal","flying"],"ledyba":["bug","flying","bug","flying"],"ledian":["bug","flying","flying","bug"],"spinarak":["bug","poison","bug","poison"],"ariados":["bug","poison","poison","bug"],"crobat":["poison","flying","flying","poison"],"chinchou":["water","electric","water","electric"],"lanturn":["water","electric","water","electric"],"igglybuff":["normal","fairy","normal","fairy"],"togetic":["fairy","flying","flying","fairy"],"natu":["psychic","flying","flying","psychic"],"xatu":["psychic","flying","flying","psychic"],"marill":["water","fairy","water","fairy"],"azumarill":["water","fairy","water","fairy"],"hoppip":["grass","flying","flying","grass"],"skiploom":["grass","flying","grass","flying"],"jumpluff":["grass","flying","flying","grass"],"yanma":["bug","flying","bug","flying"],"wooper":["water","ground","water","ground"],"quagsire":["water","ground","water","ground"],"murkrow":["dark","flying","dark","flying"],"slowking":["water","psychic","psychic","water"],"girafarig":["normal","psychic","normal","psychic"],"forretress":["bug","steel","steel","bug"],"gligar":["ground","flying","flying","ground"],"steelix":["steel","ground","steel","ground"],"qwilfish":["water","poison","water","poison"],"scizor":["bug","steel","steel","bug"],"shuckle":["bug","rock","bug","rock"],"heracross":["bug","fighting","bug","fighting"],"sneasel":["dark","ice","ice","dark"],"magcargo":["fire","rock","fire","rock"],"swinub":["ice","ground","ground","ice"],"piloswine":["ice","ground","ground","ice"],"corsola":["water","rock","rock","water"],"delibird":["ice","flying","flying","ice"],"mantine":["water","flying","flying","water"],"skarmory":["steel","flying","flying","steel"],"houndour":["dark","fire","dark","fire"],"houndoom":["dark","fire","dark","fire"],"kingdra":["water","dragon","water","dragon"],"smoochum":["ice","psychic","ice","psychic"],"larvitar":["rock","ground","rock","ground"],"pupitar":["rock","ground","rock","ground"],"tyranitar":["rock","dark","rock","dark"],"lugia":["psychic","flying","flying","psychic"],"ho-oh":["fire","flying","fire","flying"],"celebi":["grass","psychic","grass","psychic"],"combusken":["fire","fighting","fighting","fire"],"blaziken":["fire","fighting","fighting","fire"],"marshtomp":["water","ground","water","ground"],"swampert":["water","ground","water","ground"],"beautifly":["bug","flying","flying","bug"],"dustox":["bug","poison","bug","poison"],"lotad":["water","grass","grass","water"],"lombre":["water","grass","grass","water"],"ludicolo":["water","grass","grass","water"],"nuzleaf":["grass","dark","dark","grass"],"shiftry":["grass","dark","dark","grass"],"taillow":["normal","flying","normal","flying"],"swellow":["normal","flying","normal","flying"],"wingull":["water","flying","flying","water"],"pelipper":["water","flying","flying","water"],"ralts":["psychic","fairy","fairy","psychic"],"kirlia":["psychic","fairy","fairy","psychic"],"gardevoir":["psychic","fairy","fairy","psychic"],"surskit":["bug","water","water","bug"],"masquerain":["bug","flying","flying","bug"],"breloom":["grass","fighting","grass","fighting"],"nincada":["bug","ground","bug","ground"],"ninjask":["bug","flying","flying","bug"],"shedinja":["bug","ghost","bug","ghost"],"azurill":["normal","fairy","normal","fairy"],"sableye":["dark","ghost","ghost","dark"],"mawile":["steel","fairy","steel","fairy"],"aron":["steel","rock","steel","rock"],"lairon":["steel","rock","rock","steel"],"aggron":["steel","rock","steel","rock"],"meditite":["fighting","psychic","psychic","fighting"],"medicham":["fighting","psychic","psychic","fighting"],"roselia":["grass","poison","grass","poison"],"carvanha":["water","dark","dark","water"],"sharpedo":["water","dark","water","dark"],"numel":["fire","ground","ground","fire"],"camerupt":["fire","ground","ground","fire"],"vibrava":["ground","dragon","ground","dragon"],"flygon":["ground","dragon","ground","dragon"],"cacturne":["grass","dark","grass","dark"],"swablu":["normal","flying","normal","flying"],"altaria":["dragon","flying","flying","dragon"],"lunatone":["rock","psychic","rock","psychic"],"solrock":["rock","psychic","rock","psychic"],"barboach":["water","ground","water","ground"],"whiscash":["water","ground","water","ground"],"crawdaunt":["water","dark","dark","water"],"baltoy":["ground","psychic","ground","psychic"],"claydol":["ground","psychic","ground","psychic"],"lileep":["rock","grass","rock","grass"],"cradily":["rock","grass","rock","grass"],"anorith":["rock","bug","rock","bug"],"armaldo":["rock","bug","rock","bug"],"tropius":["grass","flying","grass","flying"],"spheal":["ice","water","ice","water"],"sealeo":["ice","water","ice","water"],"walrein":["ice","water","ice","water"],"relicanth":["water","rock","rock","water"],"salamence":["dragon","flying","flying","dragon"],"beldum":["steel","psychic","steel","psychic"],"metang":["steel","psychic","steel","psychic"],"metagross":["steel","psychic","steel","psychic"],"latias":["dragon","psychic","dragon","psychic"],"latios":["dragon","psychic","dragon","psychic"],"groudon-primal":["ground","fire","ground","fire"],"rayquaza":["dragon","flying","flying","dragon"],"jirachi":["steel","psychic","steel","psychic"],"torterra":["grass","ground","grass","ground"],"monferno":["fire","fighting","fighting","fire"],"infernape":["fire","fighting","fighting","fire"],"empoleon":["water","steel","steel","water"],"starly":["normal","flying","normal","flying"],"staravia":["normal","flying","normal","flying"],"staraptor":["normal","flying","normal","flying"],"bibarel":["normal","water","normal","water"],"budew":["grass","poison","grass","poison"],"roserade":["grass","poison","grass","poison"],"shieldon":["rock","steel","rock","steel"],"bastiodon":["rock","steel","steel","rock"],"wormadam-plant-cloak":["bug","grass","grass","bug"],"wormadam-sand-cloak":["bug","ground","ground","bug"],"wormadam-trash-cloak":["bug","steel","steel","bug"],"mothim":["bug","flying","bug","flying"],"combee":["bug","flying","bug","flying"],"vespiquen":["bug","flying","bug","flying"],"gastrodon":["water","ground","ground","water"],"drifloon":["ghost","flying","flying","ghost"],"drifblim":["ghost","flying","ghost","flying"],"honchkrow":["dark","flying","dark","flying"],"stunky":["poison","dark","dark","poison"],"skuntank":["poison","dark","dark","poison"],"bronzor":["steel","psychic","steel","psychic"],"bronzong":["steel","psychic","steel","psychic"],"mime-jr":["psychic","fairy","fairy","psychic"],"chatot":["normal","flying","normal","flying"],"spiritomb":["ghost","dark","dark","ghost"],"gible":["dragon","ground","dragon","ground"],"gabite":["dragon","ground","dragon","ground"],"garchomp":["dragon","ground","dragon","ground"],"lucario":["fighting","steel","steel","fighting"],"skorupi":["poison","bug","poison","bug"],"drapion":["poison","dark","poison","dark"],"croagunk":["poison","fighting","poison","fighting"],"toxicroak":["poison","fighting","poison","fighting"],"mantyke":["water","flying","water","flying"],"snover":["grass","ice","ice","grass"],"abomasnow":["grass","ice","ice","grass"],"weavile":["dark","ice","dark","ice"],"magnezone":["electric","steel","steel","electric"],"rhyperior":["ground","rock","rock","ground"],"togekiss":["fairy","flying","flying","fairy"],"yanmega":["bug","flying","bug","flying"],"gliscor":["ground","flying","flying","ground"],"mamoswine":["ice","ground","ground","ice"],"gallade":["psychic","fighting","fighting","psychic"],"probopass":["rock","steel","rock","steel"],"froslass":["ice","ghost","ice","ghost"],"rotom":["electric","ghost","ghost","electric"],"rotom-heat":["electric","fire","fire","electric"],"rotom-wash":["electric","water","water","electric"],"rotom-frost":["electric","ice","ice","electric"],"rotom-fan":["electric","flying","electric","flying"],"rotom-mow":["electric","grass","electric","grass"],"dialga":["steel","dragon","steel","dragon"],"dialga-origin":["steel","dragon","dragon","steel"],"palkia":["water","dragon","water","dragon"],"palkia-origin":["water","dragon","water","dragon"],"heatran":["fire","steel","steel","fire"],"giratina-altered-forme":["ghost","dragon","ghost","dragon"],"giratina-origin-forme":["ghost","dragon","ghost","dragon"],"shaymin-sky":["grass","flying","flying","grass"],"victini":["psychic","fire","psychic","fire"],"pignite":["fire","fighting","fighting","fire"],"emboar":["fire","fighting","fire","fighting"],"pidove":["normal","flying","normal","flying"],"tranquill":["normal","flying","normal","flying"],"unfezant":["normal","flying","normal","flying"],"woobat":["psychic","flying","flying","psychic"],"swoobat":["psychic","flying","flying","psychic"],"excadrill":["steel","ground","steel","ground"],"palpitoad":["water","ground","water","ground"],"seismitoad":["water","ground","water","ground"],"sewaddle":["bug","grass","bug","grass"],"swadloon":["bug","grass","bug","grass"],"leavanny":["bug","grass","grass","bug"],"venipede":["bug","poison","poison","bug"],"whirlipede":["bug","poison","poison","bug"],"scolipede":["bug","poison","poison","bug"],"cottonee":["grass","fairy","grass","fairy"],"whimsicott":["grass","fairy","grass","fairy"],"sandile":["ground","dark","ground","dark"],"krokorok":["ground","dark","ground","dark"],"krookodile":["ground","dark","dark","ground"],"dwebble":["bug","rock","rock","bug"],"crustle":["bug","rock","rock","bug"],"scraggy":["dark","fighting","fighting","dark"],"scrafty":["dark","fighting","fighting","dark"],"sigilyph":["psychic","flying","flying","psychic"],"tirtouga":["water","rock","water","rock"],"carracosta":["water","rock","water","rock"],"archen":["rock","flying","rock","flying"],"archeops":["rock","flying","flying","rock"],"ducklett":["water","flying","flying","water"],"swanna":["water","flying","flying","water"],"deerling":["normal","grass","normal","grass"],"sawsbuck":["normal","grass","normal","grass"],"emolga":["electric","flying","flying","electric"],"escavalier":["bug","steel","steel","bug"],"foongus":["grass","poison","grass","poison"],"amoonguss":["grass","poison","poison","grass"],"frillish":["water","ghost","water","ghost"],"jellicent":["water","ghost","water","ghost"],"joltik":["bug","electric","electric","bug"],"galvantula":["bug","electric","electric","bug"],"ferroseed":["grass","steel","steel","grass"],"ferrothorn":["grass","steel","steel","grass"],"litwick":["ghost","fire","ghost","fire"],"lampent":["ghost","fire","ghost","fire"],"chandelure":["ghost","fire","ghost","fire"],"stunfisk":["ground","electric","ground","electric"],"golett":["ground","ghost","ghost","ground"],"golurk":["ground","ghost","ghost","ground"],"pawniard":["dark","steel","dark","steel"],"bisharp":["dark","steel","steel","dark"],"rufflet":["normal","flying","normal","flying"],"braviary":["normal","flying","normal","flying"],"vullaby":["dark","flying","dark","flying"],"mandibuzz":["dark","flying","dark","flying"],"durant":["bug","steel","steel","bug"],"deino":["dark","dragon","dark","dragon"],"zweilous":["dark","dragon","dark","dragon"],"hydreigon":["dark","dragon","dark","dragon"],"larvesta":["bug","fire","bug","fire"],"volcarona":["bug","fire","fire","bug"],"cobalion":["steel","fighting","steel","fighting"],"terrakion":["rock","fighting","rock","fighting"],"virizion":["grass","fighting","grass","fighting"],"thundurus":["electric","flying","flying","electric"],"thundurus-therian":["electric","flying","flying","electric"],"reshiram":["dragon","fire","dragon","fire"],"zekrom":["dragon","electric","dragon","electric"],"landorus":["ground","flying","ground","flying"],"landorus-therian":["ground","flying","flying","ground"],"kyurem":["dragon","ice","ice","dragon"],"white-kyurem":["dragon","ice","ice","dragon"],"black-kyurem":["dragon","ice","dragon","ice"],"keldeo":["water","fighting","water","fighting"],"meloetta---aria":["normal","psychic","normal","psychic"],"meloetta---pirouette":["normal","fighting","normal","fighting"],"genesect":["bug","steel","steel","bug"],"chesnaught":["grass","fighting","grass","fighting"],"delphox":["fire","psychic","fire","psychic"],"greninja":["water","dark","water","dark"],"diggersby":["normal","ground","normal","ground"],"fletchling":["normal","flying","normal","flying"],"fletchinder":["fire","flying","flying","fire"],"talonflame":["fire","flying","flying","fire"],"vivillon":["bug","flying","flying","bug"],"litleo":["fire","normal","normal","fire"],"pyroar":["fire","normal","fire","normal"],"pangoro":["fighting","dark","dark","fighting"],"honedge":["steel","ghost","steel","ghost"],"doublade":["steel","ghost","ghost","steel"],"aegislash":["steel","ghost","steel","ghost"],"inkay":["dark","psychic","dark","psychic"],"malamar":["dark","psychic","dark","psychic"],"binacle":["rock","water","rock","water"],"barbaracle":["rock","water","rock","water"],"skrelp":["poison","water","water","poison"],"dragalge":["poison","dragon","poison","dragon"],"helioptile":["electric","normal","electric","normal"],"heliolisk":["electric","normal","electric","normal"],"tyrunt":["rock","dragon","rock","dragon"],"tyrantrum":["rock","dragon","rock","dragon"],"amaura":["rock","ice","ice","rock"],"aurorus":["rock","ice","ice","rock"],"hawlucha":["fighting","flying","flying","fighting"],"dedenne":["electric","fairy","electric","fairy"],"carbink":["rock","fairy","rock","fairy"],"klefki":["steel","fairy","steel","fairy"],"phantump":["ghost","grass","ghost","grass"],"trevenant":["ghost","grass","grass","ghost"],"pumpkaboo":["ghost","grass","ghost","grass"],"gourgeist":["ghost","grass","ghost","grass"],"noibat":["flying","dragon","flying","dragon"],"noivern":["flying","dragon","dragon","flying"],"yveltal":["dark","flying","dark","flying"],"zygarde-10-forme":["dragon","ground","ground","dragon"],"zygarde-50-forme":["dragon","ground","ground","dragon"],"zygarde-complete-forme":["dragon","ground","ground","dragon"],"diancie":["rock","fairy","rock","fairy"],"hoopa-confined":["psychic","ghost","ghost","psychic"],"hoopa-unbound":["psychic","dark","dark","psychic"],"volcanion":["fire","water","fire","water"],"alolan-rattata":["dark","normal","dark","normal"],"alolan-raticate":["dark","normal","dark","normal"],"alolan-raichu":["electric","psychic","electric","psychic"],"alolan-sandshrew":["ice","steel","ice","steel"],"alolan-sandslash":["ice","steel","steel","ice"],"alolan-ninetales":["ice","fairy","ice","fairy"],"alolan-diglett":["ground","steel","ground","steel"],"alolan-dugtrio":["ground","steel","ground","steel"],"alolan-geodude":["rock","electric","rock","electric"],"alolan-graveler":["rock","electric","rock","electric"],"alolan-golem":["rock","electric","rock","electric"],"alolan-grimer":["poison","dark","dark","poison"],"alolan-muk":["poison","dark","dark","poison"],"alolan-exeggutor":["grass","dragon","grass","dragon"],"alolan-marowak":["fire","ghost","ghost","fire"],"rowlet":["grass","flying","flying","grass"],"dartrix":["grass","flying","flying","grass"],"decidueye":["grass","ghost","ghost","grass"],"incineroar":["fire","dark","fire","dark"],"primarina":["water","fairy","fairy","water"],"pikipek":["normal","flying","normal","flying"],"trumbeak":["normal","flying","normal","flying"],"toucannon":["normal","flying","normal","flying"],"charjabug":["bug","electric","bug","electric"],"vikavolt":["bug","electric","bug","electric"],"crabominable":["fighting","ice","ice","fighting"],"oricorio-baile-style":["fire","flying","fire","flying"],"oricorio-pom-pom-style":["electric","flying","electric","flying"],"oricorio-pau-style":["psychic","flying","flying","psychic"],"oricorio-sensu-style":["ghost","flying","flying","ghost"],"cutiefly":["bug","fairy","fairy","bug"],"ribombee":["bug","fairy","fairy","bug"],"mareanie":["poison","water","water","poison"],"toxapex":["poison","water","water","poison"],"dewpider":["water","bug","water","bug"],"araquanid":["water","bug","water","bug"],"morelull":["grass","fairy","fairy","grass"],"shiinotic":["grass","fairy","fairy","grass"],"salandit":["poison","fire","poison","fire"],"salazzle":["poison","fire","poison","fire"],"stufful":["normal","fighting","normal","fighting"],"bewear":["normal","fighting","normal","fighting"],"oranguru":["normal","psychic","normal","psychic"],"wimpod":["bug","water","water","bug"],"golisopod":["bug","water","water","bug"],"sandygast":["ghost","ground","ground","ghost"],"palossand":["ghost","ground","ground","ghost"],"minior-meteor-form":["rock","flying","rock","flying"],"minior-core-form":["rock","flying","rock","flying"],"turtonator":["fire","dragon","fire","dragon"],"togedemaru":["electric","steel","steel","electric"],"mimikyu":["ghost","fairy","fairy","ghost"],"bruxish":["water","psychic","psychic","water"],"drampa":["normal","dragon","normal","dragon"],"dhelmise":["ghost","grass","ghost","grass"],"hakamo-o":["dragon","fighting","fighting","dragon"],"kommo-o":["dragon","fighting","fighting","dragon"],"tapu-koko":["electric","fairy","fairy","electric"],"tapu-lele":["psychic","fairy","psychic","fairy"],"tapu-bulu":["grass","fairy","fairy","grass"],"tapu-fini":["water","fairy","water","fairy"],"solgaleo":["psychic","steel","steel","psychic"],"lunala":["psychic","ghost","ghost","psychic"],"nihilego":["rock","poison","rock","poison"],"buzzwole":["bug","fighting","fighting","bug"],"pheromosa":["bug","fighting","bug","fighting"],"celesteela":["steel","flying","steel","flying"],"kartana":["grass","steel","steel","grass"],"guzzlord":["dark","dragon","dark","dragon"],"dusk-mane-necrozma":["psychic","steel","steel","psychic"],"dawn-wings-necrozma":["psychic","ghost","ghost","psychic"],"ultra-necrozma":["psychic","dragon","psychic","dragon"],"magearna":["steel","fairy","steel","fairy"],"marshadow":["fighting","ghost","ghost","fighting"],"naganadel":["poison","dragon","poison","dragon"],"stakataka":["rock","steel","steel","rock"],"blacephalon":["fire","ghost","ghost","fire"],"galarian-rapidash":["psychic","fairy","fairy","psychic"],"galarian-slowbro":["poison","psychic","psychic","poison"],"galarian-weezing":["poison","fairy","fairy","poison"],"galarian-mr-mime":["ice","psychic","ice","psychic"],"articuno-galar":["psychic","flying","flying","psychic"],"zapdos-galar":["fighting","flying","flying","fighting"],"moltres-galar":["dark","flying","dark","flying"],"galarian-slowking":["poison","psychic","poison","psychic"],"galarian-zigzagoon":["dark","normal","dark","normal"],"galarian-linoone":["dark","normal","normal","dark"],"galarian-yamask":["ground","ghost","ghost","ground"],"galarian-stunfisk":["ground","steel","steel","ground"],"corviknight":["flying","steel","steel","flying"],"dottler":["bug","psychic","bug","psychic"],"orbeetle":["bug","psychic","psychic","bug"],"drednaw":["water","rock","rock","water"],"carkol":["rock","fire","rock","fire"],"coalossal":["rock","fire","rock","fire"],"applin":["grass","dragon","dragon","grass"],"flapple":["grass","dragon","grass","dragon"],"appletun":["grass","dragon","grass","dragon"],"cramorant":["flying","water","water","flying"],"toxel":["electric","poison","poison","electric"],"toxtricity-amped":["electric","poison","poison","electric"],"toxtricity-low-key":["electric","poison","poison","electric"],"sizzlipede":["fire","bug","fire","bug"],"centiskorch":["fire","bug","fire","bug"],"hatterene":["psychic","fairy","fairy","psychic"],"impidimp":["dark","fairy","fairy","dark"],"morgrem":["dark","fairy","fairy","dark"],"grimmsnarl":["dark","fairy","dark","fairy"],"obstagoon":["dark","normal","normal","dark"],"mr-rime":["ice","psychic","ice","psychic"],"runerigus":["ground","ghost","ghost","ground"],"snom":["ice","bug","ice","bug"],"frosmoth":["ice","bug","ice","bug"],"indeedee-m":["psychic","normal","normal","psychic"],"indeedee-f":["psychic","normal","normal","psychic"],"morpeko":["electric","dark","electric","dark"],"dracozolt":["electric","dragon","dragon","electric"],"arctozolt":["electric","ice","ice","electric"],"dracovish":["water","dragon","water","dragon"],"arctovish":["water","ice","ice","water"],"duraludon":["steel","dragon","steel","dragon"],"dreepy":["dragon","ghost","ghost","dragon"],"drakloak":["dragon","ghost","ghost","dragon"],"dragapult":["dragon","ghost","dragon","ghost"],"zacian-crowned":["fairy","steel","steel","fairy"],"zamazenta-crowned":["fighting","steel","steel","fighting"],"eternatus":["poison","dragon","poison","dragon"],"eternatus-eternamax":["poison","dragon","poison","dragon"],"urshifu-single":["fighting","dark","dark","fighting"],"urshifu-rapid":["fighting","water","water","fighting"],"zarude":["dark","grass","dark","grass"],"calyrex":["psychic","grass","grass","psychic"],"calyrex-ice":["psychic","ice","ice","psychic"],"calyrex-shadow":["psychic","ghost","ghost","psychic"],"growlithe-hisui":["fire","rock","rock","fire"],"arcanine-hisui":["fire","rock","rock","fire"],"voltorb-hisui":["electric","grass","electric","grass"],"electrode-hisui":["electric","grass","electric","grass"],"typhlosion-hisui":["fire","ghost","ghost","fire"],"qwilfish-hisui":["dark","poison","dark","poison"],"sneasel-hisui":["fighting","poison","poison","fighting"],"samurott-hisui":["water","dark","dark","water"],"lilligant-hisui":["grass","fighting","grass","fighting"],"zorua-hisui":["normal","ghost","normal","ghost"],"zoroark-hisui":["normal","ghost","normal","ghost"],"braviary-hisui":["psychic","flying","flying","psychic"],"sliggoo-hisui":["steel","dragon","steel","dragon"],"goodra-hisui":["steel","dragon","steel","dragon"],"avalugg-hisui":["ice","rock","ice","rock"],"decidueye-hisui":["grass","fighting","fighting","grass"],"wyrdeer":["normal","psychic","normal","psychic"],"kleavor":["bug","rock","rock","bug"],"ursaluna":["ground","normal","normal","ground"],"ursaluna-bloodmoon":["ground","normal","normal","ground"],"basculegion-m":["water","ghost","ghost","water"],"basculegion-f":["water","ghost","water","ghost"],"sneasler":["fighting","poison","poison","fighting"],"overqwil":["dark","poison","dark","poison"],"enamorus":["fairy","flying","flying","fairy"],"enamorus-therian":["fairy","flying","fairy","flying"],"tauros-paldea-blaze-breed":["fighting","fire","fire","fighting"],"tauros-paldea-aqua-breed":["fighting","water","water","fighting"],"wooper-paldea":["poison","ground","ground","poison"],"meowscarada":["grass","dark","grass","dark"],"skeledirge":["fire","ghost","fire","ghost"],"quaquaval":["water","fighting","water","fighting"],"lokix":["bug","dark","dark","bug"],"pawmo":["electric","fighting","electric","fighting"],"pawmot":["electric","fighting","electric","fighting"],"smoliv":["grass","normal","grass","normal"],"dolliv":["grass","normal","grass","normal"],"arboliva":["grass","normal","grass","normal"],"squawkabilly":["normal","flying","normal","flying"],"armarouge":["fire","psychic","fire","psychic"],"ceruledge":["fire","ghost","ghost","fire"],"wattrel":["electric","flying","flying","electric"],"kilowattrel":["electric","flying","electric","flying"],"shroodle":["poison","normal","normal","poison"],"grafaiai":["poison","normal","normal","poison"],"bramblin":["grass","ghost","grass","ghost"],"brambleghast":["grass","ghost","grass","ghost"],"toedscool":["ground","grass","ground","grass"],"toedscruel":["ground","grass","ground","grass"],"scovillain":["grass","fire","grass","fire"],"rabsca":["bug","psychic","psychic","bug"],"tinkatink":["fairy","steel","fairy","steel"],"tinkatuff":["fairy","steel","fairy","steel"],"tinkaton":["fairy","steel","fairy","steel"],"bombirdier":["flying","dark","flying","dark"],"varoom":["steel","poison","steel","poison"],"revavroom":["steel","poison","steel","poison"],"cyclizar":["dragon","normal","normal","dragon"],"glimmet":["rock","poison","poison","rock"],"glimmora":["rock","poison","poison","rock"],"flamigo":["flying","fighting","flying","fighting"],"veluza":["water","psychic","psychic","water"],"tatsugiri":["dragon","water","water","dragon"],"annihilape":["fighting","ghost","ghost","fighting"],"clodsire":["poison","ground","ground","poison"],"farigiraf":["normal","psychic","normal","psychic"],"kingambit":["dark","steel","dark","steel"],"great-tusk":["ground","fighting","ground","fighting"],"scream-tail":["fairy","psychic","fairy","psychic"],"brute-bonnet":["grass","dark","dark","grass"],"flutter-mane":["ghost","fairy","ghost","fairy"],"slither-wing":["bug","fighting","fighting","bug"],"sandy-shocks":["electric","ground","ground","electric"],"iron-treads":["ground","steel","ground","steel"],"iron-bundle":["ice","water","ice","water"],"iron-hands":["fighting","electric","electric","fighting"],"iron-jugulis":["dark","flying","dark","flying"],"iron-moth":["fire","poison","fire","poison"],"iron-thorns":["rock","electric","rock","electric"],"frigibax":["dragon","ice","ice","dragon"],"arctibax":["dragon","ice","ice","dragon"],"baxcalibur":["dragon","ice","dragon","ice"],"gholdengo":["steel","ghost","steel","ghost"],"wo-chien":["dark","grass","dark","grass"],"chien-pao":["dark","ice","ice","dark"],"ting-lu":["dark","ground","dark","ground"],"chi-yu":["dark","fire","fire","dark"],"roaring-moon":["dragon","dark","dark","dragon"],"iron-valiant":["fairy","fighting","fairy","fighting"],"koraidon":["fighting","dragon","fighting","dragon"],"miraidon":["electric","dragon","dragon","electric"],"walking-wake":["water","dragon","water","dragon"],"iron-leaves":["grass","psychic","grass","psychic"],"dipplin":["grass","dragon","grass","dragon"],"poltchageist":["grass","ghost","grass","ghost"],"sinistcha":["grass","ghost","ghost","grass"],"okidogi":["poison","fighting","poison","fighting"],"munkidori":["poison","psychic","poison","psychic"],"fezandipiti":["poison","fairy","fairy","poison"],"ogerpon-wellspring-mask":["grass","water","water","grass"],"ogerpon-heartflame-mask":["grass","fire","grass","fire"],"ogerpon-cornerstone-mask":["grass","rock","rock","grass"],"archaludon":["steel","dragon","steel","dragon"],"hydrapple":["grass","dragon","dragon","grass"],"gouging-fire":["fire","dragon","fire","dragon"],"raging-bolt":["electric","dragon","electric","dragon"],"iron-boulder":["rock","psychic","rock","psychic"],"iron-crown":["steel","psychic","steel","psychic"],"pecharunt":["poison","ghost","ghost","poison"]};
  const ARTWORK_TINT_ALPHA_BY_TYPE = {
    "normal": 0.34,
    "fire": 0.40,
    "water": 0.38,
    "electric": 0.40,
    "grass": 0.32,
    "ice": 0.40,
    "dark": 0.45,
    "ghost": 0.42,
    "fairy": 0.40,
    "psychic": 0.32,
    "rock": 0.42,
    "steel": 0.40,
    "bug": 0.38,
    "poison": 0.38,
    "flying": 0.30,
    "ground": 0.40,
    "dragon": 0.36,
    "fighting": 0.34
}; // Per-type artwork tint strengths.
  // Universal S/V colors are defined by QOL as --skin-<type>-bg.
  // The optional Theme Overlay NEVER declares or overrides that base palette.
  const svTypeColor = type => `var(--skin-${type}-bg)`;
  const tintWash = (type, alpha) =>
    `color-mix(in srgb, ${svTypeColor(type)} ${(alpha * 100).toFixed(3)}%, transparent)`;
  // Editable backgrounds shared by section banners and move/TM pills.
  // 60 = 60% type + 40% white; 70 = 70% type + 30% white.
  // Missing types use DEFAULT_TYPE_LIGHT_MIX. Text colors stay 60% type/40% black.
  const DEFAULT_TYPE_LIGHT_MIX = 60;
  const TYPE_LIGHT_MIX = {
    electric: 70, // Edit this value to tune Electric independently.
  };
  const lightPct = type => Math.max(0, Math.min(100, TYPE_LIGHT_MIX[type] ?? DEFAULT_TYPE_LIGHT_MIX));
  const typeFill = type => `color-mix(in srgb, var(--skin-${type}-bg) ${lightPct(type)}%, white ${100-lightPct(type)}%)`;
  let artworkApplied = 0;
  let artworkLastError = null;
  const artworkCss = typeFill;

  const TYPES = 'normal fire fighting water flying grass poison electric ground psychic rock ice bug dragon ghost dark steel fairy'.split(' ');
  const THEME_ARTICLE = 'html.yofi-type-theme .page > main article.yofi-type-tinted';
  const CSS_ROOT = `${THEME_ARTICLE}:has(section.moves)`;
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
    ${CSS_ROOT}[data-yofi-tint-type="${type}"],
    ${THEME_ARTICLE}:not(:has(section.moves))[data-yofi-tint-type="${type}"] {
      --p5ov-primary: var(--skin-${type}-bg);
      --p5ov-top-primary: var(--skin-${type}-bg);
      --p5ov-body-ink: color-mix(in srgb, var(--skin-${type}-bg) 60%, black 40%);
      --p5ov-banner-ink: color-mix(in srgb, var(--skin-${type}-bg) 60%, black 40%);
      --p5ov-tint-native-color: var(--skin-${type}-bg);
      --p5ov-surface: color-mix(in srgb, var(--skin-${type}-bg) ${(ARTWORK_TINT_ALPHA_BY_TYPE[type] ?? .34) * 100}%, var(--skin-content) ${(1 - (ARTWORK_TINT_ALPHA_BY_TYPE[type] ?? .34)) * 100}%);
      /* Monotypes use the same per-type tint strength as indexed dual types.
         This separate wash is intentionally not --yofi-entry-type-wash:
         the QoL script continually resets that variable to 23%. */
      --p5ov-mono-tint-wash: ${tintWash(type, ARTWORK_TINT_ALPHA_BY_TYPE[type] ?? .34)};
    }
    /* The base script reads the type badge background to decorate the lead.
       Our transparent badge obscures that read, so restore the ORIGINAL
       unmixed type color without altering the native white text halo. */
    ${THEME_ARTICLE}[data-yofi-tint-type="${type}"] .yofi-hero-copy .yofi-type-description-lead {
      --yofi-lead-type-color: var(--skin-${type}-bg) !important;
    }
    ${THEME_ARTICLE}:has(header .type-tag .type.right[data-yofi-header-type="${type}"]) {
      --p5ov-secondary: ${typeFill(type)};
      --p5ov-banner-ink: color-mix(in srgb, var(--skin-${type}-bg) 60%, black 40%);
      --p5ov-top-secondary: var(--skin-${type}-bg);

    }
  `).join('\n');
  const moveFillRules = TYPES.map(type => `
    ${CSS_ROOT} > .scrollable section.moves dd ul > li > a[data-yofi-target-type="${type}"] {
      --p5ov-move-fill: ${typeFill(type)};
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
    ${CSS_ROOT} {
      --p5ov-primary: var(--skin-normal-bg, #A1A1A1);
      --p5ov-secondary: color-mix(in srgb, var(--p5ov-primary) 60%, white 40%);
      --p5ov-top-primary: var(--skin-normal-bg, #A1A1A1);
      --p5ov-body-ink: color-mix(in srgb, var(--skin-normal-bg, #A1A1A1) 60%, black 40%);
      --p5ov-banner-ink: var(--p5ov-body-ink);
      --p5ov-surface: var(--skin-content);
      --p5ov-tint-native-color: var(--skin-normal-bg, #A1A1A1);
      --p5ov-top-secondary: var(--p5ov-top-primary);
      --p5ov-band: var(--p5ov-secondary);
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
    ${CSS_ROOT} > .scrollable .yofi-scores-banner dl.yofi-scores-strip > :is(dt,dd) {
      /* Same type/black mix used for move-pill lettering; banner type, not tint type. */
      text-shadow: none !important;
      color: var(--p5ov-art-banner-ink, var(--p5ov-banner-ink)) !important;
    }

    /* Type ink applies to card prose and standard information labels only.
       Monotypes use their own type; indexed dual types use the artwork-selected BACKGROUND TINT type.
       Do not alter move pills, effectiveness badges, native header or lead. */
    ${CSS_ROOT} > .scrollable {
      color: var(--p5ov-body-ink) !important;
    }
    ${CSS_ROOT} > .scrollable :is(.yofi-hero-copy p, section.abilities p, section.abilities h3,
      section.evolution p, section.evolution h3, section.evolutions p,
      section.evolutions h3, section.moves dt, section.moves > dl > dt,
      section.other-info p, section.other-info dt, section.other-info dd) {
      color: var(--p5ov-body-ink) !important;
    }

    /* Hero Adapter v0.4.0 copies ability content and reconstructs Scores as
       .lab3-score-row. These new elements are NOT nested in the native
       section.abilities/section.stats and otherwise evade section h2 styles.
       Theme owns all their colors; Hero owns placement and dimensions. */
    ${CSS_ROOT}.lab3-active > .scrollable .yofi-species-hero {
      --lab3-score-bg: var(--p5ov-art-banner-color, var(--p5ov-secondary)) !important;
      color: var(--p5ov-body-ink) !important;
    }
    ${CSS_ROOT}.lab3-active > .scrollable .yofi-species-hero .lab3-abilities-view,
    ${CSS_ROOT}.lab3-active > .scrollable .yofi-species-hero .lab3-abilities-view :is(.ability,p,h3,dt,dd,strong,b),
    ${CSS_ROOT}.lab3-active > .scrollable .yofi-species-hero .lab3-vital,
    ${CSS_ROOT}.lab3-active > .scrollable .yofi-species-hero .lab3-biologies {
      color: var(--p5ov-body-ink) !important;
    }
    ${CSS_ROOT}.lab3-active > .scrollable .yofi-species-hero .lab3-abilities-view > h2 {
      background: var(--p5ov-art-banner-color, var(--p5ov-secondary)) !important;
      color: var(--p5ov-art-banner-ink, var(--p5ov-banner-ink)) !important;
      box-shadow: 0 1px 2px #0003, inset 0 1px #fffa !important;
      text-shadow: none !important;
    }
    ${CSS_ROOT}.lab3-scores > .scrollable .yofi-species-hero .lab3-score-row {
      background: var(--p5ov-art-banner-color, var(--p5ov-secondary)) !important;
      color: var(--p5ov-art-banner-ink, var(--p5ov-banner-ink)) !important;
      box-shadow: 0 1px 2px #0003, inset 0 1px #fffa !important;
      text-shadow: none !important;
    }
    ${CSS_ROOT}.lab3-scores > .scrollable .yofi-species-hero .lab3-score-row :is(.lab3-score-cell,.lab3-score-name,.lab3-score-value) {
      color: inherit !important;
    }
    ${CSS_ROOT}.lab3-active > .scrollable .yofi-species-hero .lab3-abilities-view .yofi-native-hidden-pair .tag > .name,
    ${CSS_ROOT}.lab3-active > .scrollable .yofi-species-hero .lab3-abilities-view p.no-margin > .tag > .name {
      background: var(--p5ov-body-ink) !important;
      background-color: var(--p5ov-body-ink) !important;
      color: var(--p5ov-surface) !important;
      box-shadow: none !important;
      text-shadow: none !important;
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

    /* All species WITHOUT an indexed portrait use their first/native type
       and exactly its configured wash. The previous :not(:has(.right)) gate
       accidentally left every unindexed DUAL Fakemon on the QoL 23% wash:
       Rock/Steel Rookite differed from Rock Minereon, and Normal/Rock
       Rocking differed from Normal Veeveon. Artwork-indexed Pokemon retain
       their own (potentially opposite-type) wash below. */
    ${CSS_ROOT}:not([data-p5ov-artwork-choice]),
    ${CSS_ROOT}:not([data-p5ov-artwork-choice]) > .scrollable {
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

    /* Native Poké5e artwork choice: only the section banners + card surface.
       The header keeps --p5ov-primary/secondary in ORIGINAL type order.
       Monotypes and unindexed Fakémon retain all v0.3.12 presentation. */
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
      color: color-mix(in srgb, var(--p5ov-move-color) 60%, black 40%) !important;
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
      white-space: nowrap !important;
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

    /* Light/Dark: original underlined links and measured TM columns. */
    html:not(.yofi-type-theme) .page > main article > .scrollable section.moves dd ul[data-p5ov-kind="tm"] {
      display: block !important;
      box-sizing: border-box !important;
      width: 100% !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      list-style: none !important;
      column-count: var(--p5ov-columns,1) !important;
      column-width: auto !important;
      column-gap: 12px !important;
    }
    html:not(.yofi-type-theme) .page > main article > .scrollable section.moves dd ul[data-p5ov-kind="tm"] > li {
      display: block !important;
      break-inside: avoid !important;
      white-space: nowrap !important;
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

  const previousMeasurements = new WeakMap();
  const canvas = document.createElement('canvas').getContext('2d');
  let stopped = false;
  let scheduled = false;
  let frameId = 0;
  let observer;
  let resizeObserver;
  let lastError = null;
  const watched = new WeakSet();
  // The QOL v0.12.18 script already knows authoritative move types. Its
  // installTypedLowerLinks() resolves each CURRENT href and writes
  // --yofi-target-type-color. It observes childList, not href attributes.
  // When Svelte reuses an anchor and changes just its href, nudge that
  // existing updater with one inert childList mutation. No color lookup here.
  const knownMoveHrefs = new WeakMap();
  let baseRefreshes = 0;
  function detectReusedMoveLinks(card) {
    let reused = false;
    for (const a of card.querySelectorAll('section.moves dd ul li > a[href]')) {
      const href = a.getAttribute('href') || '';
      if (knownMoveHrefs.has(a) && knownMoveHrefs.get(a) !== href) reused = true;
      knownMoveHrefs.set(a, href);
    }
    if (!reused) return;
    // Main QOL install() sees this childList event and reapplies the native
    // move type variables from their current hrefs. An inert comment cannot
    // disturb Svelte's node ownership or the visual layout.
    const marker = document.createComment('p5-native-move-color-refresh');
    card.appendChild(marker);
    marker.remove();
    baseRefreshes++;
  }

  const cards = () => [...document.querySelectorAll('.page > main article:not(.yofi-species-transition-snapshot)')]
    .filter(article => article.querySelector('section.moves, :scope > header .type-tag > .type'));
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
    if(!eligible) clearArtworkChoice(card);
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

  // Light/Dark TM columns: measure the ACTUAL pseudo-label and its padding.
  // Previously we measured only text+6px, even though each TM anchor carries
  // roughly 19px of horizontal padding. The cache also watched only first/
  // last labels, overlooking edits to the longest middle entry when Svelte
  // recycled links. Both made 3 columns appear/disappear unpredictably.
  const tmColumnState = new WeakMap();
  let tmFontRevision = 0;
  function setColumns(ul) {
    const links = [...ul.querySelectorAll(':scope > li > a[href]')];
    const width = ul.getBoundingClientRect().width;
    if (!links.length || !(width > 0) || !canvas) return;
    const ulStyle = getComputedStyle(ul);
    const gap = parseFloat(ulStyle.columnGap) || 12;
    // Fast, content-complete fingerprint. Even middle links can be recycled
    // during navigation; skip font/style/layout measurements when unchanged.
    const firstStyle = getComputedStyle(links[0]);
    const signature = [width.toFixed(2), gap.toFixed(2), tmFontRevision,
      ulStyle.fontFamily, ulStyle.fontSize, ulStyle.fontWeight,
      firstStyle.paddingLeft, firstStyle.paddingRight,
      ...links.map(a => `${a.getAttribute('data-p5ov-display') || a.textContent.trim()}~${a.style.getPropertyValue('--p5ov-tm-font-size')}`)].join('|');
    if (previousMeasurements.get(ul) === signature) return;
    const measurements = links.map(a => {
      const s = getComputedStyle(a);
      const pseudo = getComputedStyle(a, '::before');
      const shown = a.getAttribute('data-p5ov-display') || a.textContent.trim();
      const size = parseFloat(a.style.getPropertyValue('--p5ov-tm-font-size')) ||
        parseFloat(pseudo?.fontSize) || parseFloat(ulStyle.fontSize) || 14;
      const weight = pseudo?.fontWeight || s.fontWeight || '400';
      const family = pseudo?.fontFamily || s.fontFamily || 'system-ui';
      const style = pseudo?.fontStyle || s.fontStyle || 'normal';
      const spacing = parseFloat(pseudo?.letterSpacing) || 0;
      const font = `${style} ${weight} ${size}px ${family}`;
      canvas.font = font;
      const textWidth = canvas.measureText(shown).width +
        Math.max(0, shown.length - 1) * spacing;
      const chrome = (parseFloat(s.paddingLeft) || 0) +
        (parseFloat(s.paddingRight) || 0) +
        (parseFloat(s.borderLeftWidth) || 0) +
        (parseFloat(s.borderRightWidth) || 0);
      return {shown, font, spacing, width:textWidth + chrome};
    });
    const widest = Math.max(...measurements.map(m => m.width)) + 2; // round-off safety
    const n = Math.max(1, Math.min(8, Math.floor((width + gap) / (widest + gap))));
    if (ul.style.getPropertyValue('--p5ov-columns') !== String(n))
      ul.style.setProperty('--p5ov-columns', String(n));
    tmColumnState.set(ul,{width:+width.toFixed(2),gap:+gap.toFixed(2),
      widest:+widest.toFixed(2),columns:n,fontReady:document.fonts?.status || 'unknown',
      longest:[...measurements].sort((a,b) => b.width-a.width).slice(0,3).map(m=>
        ({label:m.shown,width:+m.width.toFixed(2)}))});
    previousMeasurements.set(ul, signature);
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
  // Artwork identity is read from the native portrait URL, not display text,
  // Dex number, page title or external PokeAPI ID. When Svelte reuses a card,
  // a new src resolves to a new artwork entry without editing Svelte-owned DOM.
  const artworkIdFromPortrait = card => {
    const images = card.querySelectorAll('.yofi-hero-art-lane .square-image img:not(.yofi-portrait-shimmer)');
    for (const img of images) {
      const raw = img.getAttribute('src') || img.currentSrc || '';
      let pathname;
      try { pathname = new URL(raw,location.href).pathname; } catch { continue; }
      const match = pathname.match(/\/assets\/pokemon\/([^/]+)\/main(?:-shiny)?\.(?:png|webp)$/i);
      if (match) return decodeURIComponent(match[1]).toLowerCase();
    }
    return null;
  };
  function clearArtworkChoice(card) {
    if (!card.hasAttribute('data-p5ov-artwork-choice')) return;
    card.removeAttribute('data-p5ov-artwork-choice');
    card.style.removeProperty('--p5ov-art-banner-color');
    card.style.removeProperty('--p5ov-art-banner-ink');
    card.style.removeProperty('--p5ov-body-ink');
    card.style.removeProperty('--p5ov-surface');
    card.style.removeProperty('--p5ov-tint-native-color');
    card.style.removeProperty('--p5ov-art-tint-wash');
  }
  function syncArtworkChoice(card, current) {
    if (current !== 'type' || !card.classList.contains('yofi-type-tinted')) {
      clearArtworkChoice(card);
      return;
    }
    const id = artworkIdFromPortrait(card);
    const selection = id && ARTWORK_TYPE_CHOICES[id];
    if (!selection) { clearArtworkChoice(card); return; }
    const [primary,secondary,banner,tint] = selection;
    const actual = [...card.querySelectorAll(':scope > header .type-tag > .type')]
      .map(badge => badge.dataset.yofiHeaderType).filter(Boolean);
    // Require the CURRENT card's dual-type header to match the catalog.
    // This avoids applying a prior species' colors during SPA transitions.
    if (actual.length !== 2 || actual[0] !== primary || actual[1] !== secondary) {
      clearArtworkChoice(card);
      return;
    }
    if (card.dataset.p5ovArtworkChoice === id) return;
    if (!TYPES.includes(banner) || !TYPES.includes(tint)) { clearArtworkChoice(card); return; }
    const alpha = ARTWORK_TINT_ALPHA_BY_TYPE[tint] ?? .34;
    card.style.setProperty('--p5ov-art-banner-color', artworkCss(banner));
    card.style.setProperty('--p5ov-art-banner-ink', `color-mix(in srgb, ${svTypeColor(banner)} 60%, black 40%)`);
    card.style.setProperty('--p5ov-body-ink', `color-mix(in srgb, ${svTypeColor(tint)} 60%, black 40%)`);
    card.style.setProperty('--p5ov-tint-native-color', svTypeColor(tint));
    card.style.setProperty('--p5ov-surface', `color-mix(in srgb, ${svTypeColor(tint)} ${alpha * 100}%, var(--skin-content) ${100 - alpha * 100}%)`);
    card.style.setProperty('--p5ov-art-tint-wash', tintWash(tint, alpha));
    card.dataset.p5ovArtworkChoice = id;
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
    detectReusedMoveLinks(card);
    for (const ul of card.querySelectorAll('section.moves dd ul')) {
      const classification = kind(ul);
      if (!classification) continue;
      if (ul.dataset.p5ovKind !== classification) ul.dataset.p5ovKind = classification;
      if (classification !== 'tm') continue;
      for (const link of ul.querySelectorAll('li > a[href]')) formatTm(link, current);
      if (current !== 'type') setColumns(ul);
      if (resizeObserver && !watched.has(ul)) {
        resizeObserver.observe(ul);
        watched.add(ul);
      }
    }
  }
  function prepareSpeciesCardBeforeReveal(event) {
    const card = event.detail?.article;
    if (!(card instanceof HTMLElement)) return;
    try {
      // Color only: TM measurement remains in the normal scheduled pass.
      processCardColors(card, mode());
    } catch (error) {
      console.warn('[P5 Theme Overlay v0.3.39] Incoming-card color sync failed:', error);
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
      console.error('[P5 Theme Overlay v0.3.39]', error);
    }
  }
  function schedule() {
    if (stopped || scheduled) return;
    scheduled = true;
    frameId = requestAnimationFrame(apply);
  }
  function stop() {
    stopped = true;
    cancelAnimationFrame(frameId);
    observer?.disconnect();
    resizeObserver?.disconnect();
    clearInterval(heartbeat);
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
        ul.style.removeProperty('--p5ov-columns');
        for (const a of ul.querySelectorAll('a[href]')) {
          a.removeAttribute('data-p5ov-display');
          a.style.removeProperty('--p5ov-tm-font-size');
          a.style.removeProperty('--p5ov-tm-min-height');
        }
      }
    }
    for (const card of document.querySelectorAll('article[data-p5ov-artwork-choice]')) clearArtworkChoice(card);
    style.remove();
    if (window[KEY]?.stop === stop) delete window[KEY];
  }
  resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
  observer = new MutationObserver(changes => {
    if (changes.some(change => {
      const target = change.target.nodeType === 1 ? change.target : change.target.parentElement;
      return target?.closest?.('.page > main') || target?.matches?.('html,body,.page,main');
    })) schedule();
  });
  observer.observe(document.documentElement, {subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','href','src','data-yofi-header-type','data-yofi-target-type']});
  // Low-frequency safety net for iOS Userscripts injection / late Svelte updates.
  const heartbeat = setInterval(schedule, 1600);
  const whenFontsChange = () => { tmFontRevision++; schedule(); };
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('load', schedule, {once:true});
  document.fonts?.ready?.then(() => { if (!stopped) whenFontsChange(); });
  document.fonts?.addEventListener?.('loadingdone', whenFontsChange);
  window[KEY] = {
    stop, refresh:apply,
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
        version:'0.3.39', themeMode, nativeMode:window.__yofiQolThemeBridge?.mode?.(), heroActive:!!a?.classList.contains('lab3-active'), heroScoresVisible:!!a?.classList.contains('lab3-scores'), heroAbilitiesVisible:!!a?.classList.contains('lab3-abilities'), nativeRefreshes:baseRefreshes, artworkApplied, artworkIndexed:Object.keys(ARTWORK_TYPE_CHOICES).length, artworkPortraitId:a && artworkIdFromPortrait(a), artworkChoice:a?.dataset.p5ovArtworkChoice || null, artworkSelected:a?.dataset.p5ovArtworkChoice && ARTWORK_TYPE_CHOICES[a.dataset.p5ovArtworkChoice] || null, artworkError:artworkLastError, cardCount:all.length, theme:mode(),
        tinted:!!a?.classList.contains('yofi-type-tinted'),
        computedBodyInk:a?.querySelector(':scope > .scrollable') && getComputedStyle(a.querySelector(':scope > .scrollable')).color,
        computedBannerInk:h && getComputedStyle(h).color,
        heroAbilityInk:a?.querySelector('.lab3-abilities-view .ability') && getComputedStyle(a.querySelector('.lab3-abilities-view .ability')).color,
        heroAbilityBanner:a?.querySelector('.lab3-abilities-view > h2') && {
          background:getComputedStyle(a.querySelector('.lab3-abilities-view > h2')).backgroundColor,
          text:getComputedStyle(a.querySelector('.lab3-abilities-view > h2')).color
        },
        heroScoreRow:a?.querySelector('.lab3-score-row') && {
          background:getComputedStyle(a.querySelector('.lab3-score-row')).backgroundColor,
          text:getComputedStyle(a.querySelector('.lab3-score-row')).color
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
        columnCount:tm?.style.getPropertyValue('--p5ov-columns') || null,
        tmColumns:tm && tmColumnState.get(tm) || null,
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
  console.info('[P5 Theme Overlay v0.3.39 - Stable Card Handoff] installed');
})();
