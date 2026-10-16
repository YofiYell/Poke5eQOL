/* Standalone ART producer. No writes to existing QOL/Theme/Species Card globals or DOM. */
const ART_API_VERSION=1,ART_MODULE_VERSION='0.1.0',ART_DB_NAME='yofi-artwork-intelligence',ART_DB_VERSION=1;
const ART_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZ25jYmpqZm1udmJmcmpkeG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk1ODY2MzEsImV4cCI6MTk4NTE2MjYzMX0.RXw9pfN-4qOR2AbqPoM6GMzjDGRwYnClF9LEiI2VE5k';
const ART_RPC='https://api.poke5e.app/rest/v1/rpc/get_fakemon',ART_ASSETS='https://poke5e.auroratide.cloud/';
const ART_FAST_KEY='yofi-artwork-intelligence-lastgood-v1';
const ART_STORES={fakemon:['fakemonRecords','fakemonMasks','fakemonStatus'],pokemon:['pokemonRecords','pokemonMasks','pokemonStatus']};
const artSafeCopy=x=>x==null?x:structuredClone(x);
function artSha256Sync(bytes){
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  const n=bytes.length,L=((n+9+63)>>6)<<6,msg=new Uint8Array(L);msg.set(bytes);msg[n]=128;
  const hi=Math.floor(n/0x20000000),lo=(n*8)>>>0;
  for(let i=0;i<4;i++){msg[L-8+i]=(hi>>>(24-8*i))&255;msg[L-4+i]=(lo>>>(24-8*i))&255;}
  const w=new Uint32Array(64),rot=(x,b)=>(x>>>b)|(x<<(32-b));
  for(let off=0;off<L;off+=64){for(let i=0;i<16;i++){const p=off+i*4;w[i]=((msg[p]<<24)|(msg[p+1]<<16)|(msg[p+2]<<8)|msg[p+3])>>>0;}
    for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2];w[i]=(w[i-16]+(rot(a,7)^rot(a,18)^(a>>>3))+w[i-7]+(rot(b,17)^rot(b,19)^(b>>>10)))>>>0;}
    let [a,b,c,d,e,f,g,q]=h;
    for(let i=0;i<64;i++){const t1=(q+(rot(e,6)^rot(e,11)^rot(e,25))+((e&f)^(~e&g))+K[i]+w[i])>>>0;
      const t2=((rot(a,2)^rot(a,13)^rot(a,22))+((a&b)^(a&c)^(b&c)))>>>0;
      q=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
    for(let i=0;i<8;i++)h[i]=(h[i]+[a,b,c,d,e,f,g,q][i])>>>0;
  }
  return Array.from(h,x=>x.toString(16).padStart(8,'0')).join('');
}
async function artDigest(bytes){if(globalThis.crypto?.subtle){const buffer=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)),x=>x.toString(16).padStart(2,'0')).join('');}return artSha256Sync(bytes);}
function artFormat(bytes){const b=bytes;if(b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71)return 'PNG';if(b[0]===255&&b[1]===216)return 'JPEG';if(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')return 'WEBP';if(String.fromCharCode(...b.slice(0,3))==='GIF')return 'GIF';if((b[0]===73&&b[1]===73&&b[2]===42)||(b[0]===77&&b[1]===77&&b[3]===42))return 'TIFF';throw Error('unsupported_image_format');}
async function artDecodeBytes(bytes,format){
  if(format==='PNG'){const exact=await artDecodePngLossless(bytes);if(exact)return exact;}
  const MIME={PNG:'image/png',JPEG:'image/jpeg',WEBP:'image/webp',GIF:'image/gif',TIFF:'image/tiff'};
  const blob=new Blob([bytes],{type:MIME[format]});let image,src=null,decodeMode='';
  try{
    if(typeof createImageBitmap==='function'){
      try{image=await createImageBitmap(blob,{premultiplyAlpha:'none',colorSpaceConversion:'none',imageOrientation:'none'});decodeMode='bitmap-explicit';}
      catch(_){image=await createImageBitmap(blob);decodeMode='bitmap-default';}
    }else{
      src=URL.createObjectURL(blob);const el=new Image();el.decoding='async';el.src=src;
      if(el.decode)await el.decode();else await new Promise((ok,fail)=>{el.onload=ok;el.onerror=fail;});
      image=el;decodeMode='image-element';
    }
    const w=image.width||image.naturalWidth,h=image.height||image.naturalHeight;
    if(!w||!h||w*h>16000000)throw Error('image_dimensions_unsupported');
    const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):Object.assign(document.createElement('canvas'),{width:w,height:h});
    let context;try{context=canvas.getContext('2d',{willReadFrequently:true,colorSpace:'srgb'});}catch(_){context=canvas.getContext('2d',{willReadFrequently:true});}
    if(!context)throw Error('canvas_context_unavailable');context.clearRect(0,0,w,h);context.drawImage(image,0,0);
    const data=context.getImageData(0,0,w,h);
    return {rgba:new Uint8Array(data.data.buffer.slice(0)),width:w,height:h,decodeMode};
  }finally{if(image?.close)image.close();if(src)URL.revokeObjectURL(src);}
}
function artResolveRow(row,readKey){
  if(!row||row.read_key!==readKey)throw Error('fakemon_read_key_mismatch');
  const name=String(row.normal_portrait_filename??'').trim();if(!name)throw Error('normal_portrait_missing');
  if(!Array.isArray(row.type)||!row.type.length||row.type.length>2||row.type.some(t=>!ART_TYPES[t]))throw Error('invalid_native_types');
  let href;try{const u=new URL(name,ART_ASSETS);if(!['https:','http:'].includes(u.protocol)||u.username||u.password||name.split('/').includes('..'))throw Error('unsafe_source');href=u.href;}catch(_){throw Error('invalid_normal_source');}
  return {href,mediaField:'normalPortrait',types:{primary:row.type[0],secondary:row.type[1]??null,signature:row.type.join('/')}};
}
function artRoute(){
  const segments=location.pathname.split('/').filter(Boolean),i=segments.indexOf('fakemon');
  if(i<0||i!==segments.length-1)return null;const action=new URL(location.href).searchParams.get('action');
  if(action&&action!=='info')return null;
  const id=(new URL(location.href).searchParams.get('id')||'').replace(/^F\./i,'').trim();
  return /^[A-Za-z0-9_-]{4,40}$/.test(id)?{namespace:'fakemon',speciesId:id,routeToken:location.pathname+location.search}:null;
}
function artIdentity(namespace,id){if(!ART_STORES[namespace]||typeof id!=='string'||!id.trim())throw Error('invalid_artwork_identity');return namespace+':'+id.replace(/^F\./i,'');}
function artSnapshot(record,cacheSource){if(!record)return null;const {nativeSpeciesId,scanner,...rest}=record;return artSafeCopy({...rest,scannerVersion:scanner.version,cacheSource});}
function artMeaningful(record){if(!record)return null;return JSON.stringify({normalSource:record.normalSource,types:record.types,scanner:record.scanner,color:record.color,geometry:record.geometry});}
function artStatusDefault(){return {state:'missing',previousAvailable:false,latestFailure:null,attemptId:null,lastAttemptAt:null,sourceState:'unresolved'};}
function artSourceDefault(){return {state:'unresolved',candidate:null,lastVerified:null,lastSuccessful:null,latestFailure:null};}
function artCreateRuntime(){
  if(typeof window==='undefined'||typeof document==='undefined')return null;
  if(window.__yofiArtworkIntelligence?.apiVersion===1)return window.__yofiArtworkIntelligence;
  const records=new Map(),maskCache=new Map(),sources=new Map(),statuses=new Map(),failures=new Map(),visited=new Set(),jobs=new Map(),latestTokens=new Map(),cornerCache=new Map();
  const stats={scansCompleted:0,cacheHits:0,idbHydrations:0,sourceRevalidations:0,analysisFailures:0,storageFailures:0,updateEventsPublished:0};
  const startedAt=new Date().toISOString(),dbStatus={state:'opening',version:1};let db=null,ready=false,route=null,jobSerial=0,routeScheduled=false,worker=null,workerFailed=false,workerSeq=0;
  const workerRequests=new Map(),fast=new Map();
  const maskTouch=(key,entry)=>{maskCache.delete(key);maskCache.set(key,entry);while(maskCache.size>5)maskCache.delete(maskCache.keys().next().value);};
  const recordTouch=(key,entry)=>{records.delete(key);records.set(key,entry);while(records.size>50)records.delete(records.keys().next().value);};
  const dispatch=(name,detail)=>document.dispatchEvent(new CustomEvent('yofi:artwork-intelligence:'+name,{detail:artSafeCopy(detail)}));
  const localGet=()=>{try{const saved=JSON.parse(localStorage.getItem(ART_FAST_KEY)||'[]');for(const x of saved){if(x?.schemaVersion===1&&x?.namespace==='fakemon'&&x?.speciesId&&x?.scannerVersion==='1.0.0')fast.set(artIdentity(x.namespace,x.speciesId),x);}}catch(_){}};
  const localPut=(record)=>{const key=artIdentity(record.namespace,record.speciesId);
    fast.delete(key);fast.set(key,{schemaVersion:1,namespace:record.namespace,speciesId:record.speciesId,
      normalSourceHref:record.normalSource.href,contentSha256:record.normalSource.contentSha256,
      typesSignature:record.types.signature,scannerVersion:record.scanner.version,analysisRevision:record.analysisRevision,
      selectedBannerType:record.color.decision.selected_banner_type,selectedTintType:record.color.decision.selected_tint_type});
    while(fast.size>50)fast.delete(fast.keys().next().value);
    try{localStorage.setItem(ART_FAST_KEY,JSON.stringify([...fast.values()]));}catch(_){stats.storageFailures++;}
  };
  localGet();
  const openDB=()=>new Promise(resolve=>{
    if(!globalThis.indexedDB){dbStatus.state='unavailable';stats.storageFailures++;return resolve(null);}
    try{const req=indexedDB.open(ART_DB_NAME,ART_DB_VERSION);
      req.onupgradeneeded=()=>{const target=req.result;for(const types of Object.values(ART_STORES))for(const store of types)if(!target.objectStoreNames.contains(store))target.createObjectStore(store,{keyPath:'speciesId'});};
      req.onblocked=()=>{dbStatus.state='blocked';stats.storageFailures++;resolve(null);};
      req.onerror=()=>{dbStatus.state='unavailable';stats.storageFailures++;resolve(null);};
      req.onsuccess=()=>{db=req.result;dbStatus.state='ready';db.onversionchange=()=>{db.close();db=null;dbStatus.state='unavailable';};resolve(db);};
    }catch(_){dbStatus.state='unavailable';stats.storageFailures++;resolve(null);}
  });
  const readyPromise=openDB().then(()=>{ready=true;dispatch('ready',{apiVersion:1,moduleVersion:ART_MODULE_VERSION,scannerVersion:ART_CONFIG.version});});
  const dbGet=(store,id)=>new Promise(resolve=>{if(!db)return resolve(null);try{const req=db.transaction([store],'readonly').objectStore(store).get(id);req.onsuccess=()=>resolve(req.result??null);req.onerror=()=>resolve(null);}catch(_){resolve(null);}});
  async function hydrate(ns,id,countHydration=false){const key=artIdentity(ns,id);if(records.has(key))return records.get(key).record;
    await readyPromise;const r=await dbGet(ART_STORES[ns][0],id);if(r?.schemaVersion===1&&r.namespace===ns&&r.speciesId===id&&r.scanner?.version==='1.0.0'){
      if(!records.has(key)){recordTouch(key,{record:r,cacheSource:'persisted'});if(countHydration)stats.idbHydrations++;}return records.get(key).record;
    }return null;
  }
  const saveStatus=async(ns,id,status)=>{if(!db)return false;try{return await new Promise(resolve=>{const tx=db.transaction([ART_STORES[ns][2]],'readwrite');tx.objectStore(ART_STORES[ns][2]).put({...status,speciesId:id});tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false);tx.onabort=()=>resolve(false);});}catch(_){return false;}};
  const clearStatus=async(ns,id)=>{if(!db)return false;try{return await new Promise(resolve=>{const tx=db.transaction([ART_STORES[ns][2]],'readwrite');tx.objectStore(ART_STORES[ns][2]).delete(id);tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false);tx.onabort=()=>resolve(false);});}catch(_){return false;}};
  const activeStatus=(key,state,extra={})=>{const st={...artStatusDefault(),...(statuses.get(key)||{}),state,...extra};statuses.set(key,st);return st;};
  async function persist(ns,id,record,mask){
    if(!db)return 'unavailable';
    const [rs,ms]=ART_STORES[ns];
    return new Promise(resolve=>{
      let finished=false,stale=false;const finish=ok=>{if(!finished){finished=true;resolve(ok);}};
      try{
        const tx=db.transaction([rs,ms],'readwrite'),store=tx.objectStore(rs),maskStore=tx.objectStore(ms);
        const prior=store.get(id);
        prior.onsuccess=()=>{
          const old=prior.result;if(old&&old.analysisRevision>=record.analysisRevision){stale=true;tx.abort();return;}
          store.put(record);
          if(mask&&record.geometry.reliable)maskStore.put({speciesId:id,format:'packed-msb-row-v1',width:record.geometry.width,height:record.geometry.height,
            strideBytes:record.geometry.maskStrideBytes,alphaThreshold:1,maskSha256:record.geometry.maskSha256,bytes:mask});
          else maskStore.delete(id);
        };
        prior.onerror=()=>tx.abort();
        tx.oncomplete=()=>finish('persisted');tx.onabort=()=>finish(stale?'stale':'unavailable');tx.onerror=()=>finish('unavailable');
      }catch(_){finish('unavailable');}
    });
  }
  function sourceUpdate(key,mutate){const prev=sources.get(key)||artSourceDefault();const next=artSafeCopy(prev);mutate(next);sources.set(key,next);return next;}
  const markFailure=(ns,id,phase,err,attemptId)=>{
    const key=artIdentity(ns,id),code=String(err?.message||err||'unknown').slice(0,180),item={phase,code,message:code,at:new Date().toISOString()};
    failures.set(key,item);void saveStatus(ns,id,{state:'error',lastFailure:item,attemptId});sourceUpdate(key,s=>{s.state='source_validation_failed';s.latestFailure={phase,code,at:item.at};});
    activeStatus(key,'error',{previousAvailable:records.has(key),latestFailure:code,attemptId,sourceState:'source_validation_failed'});
    if(phase!=='storage')stats.analysisFailures++;else stats.storageFailures++;
    dispatch('status',{apiVersion:1,namespace:ns,speciesId:id,state:'error',attemptId,errorCode:code});
  };
  const fetchTimeout=async(url,opts={})=>{const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),20000);
    try{return await fetch(url,{...opts,signal:ctl.signal});}finally{clearTimeout(timeout);}};
  async function resolveNative(id){
    const response=await fetchTimeout(ART_RPC,{method:'POST',mode:'cors',credentials:'omit',headers:{apikey:ART_ANON_KEY,Authorization:'Bearer '+ART_ANON_KEY,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({_read_key:id})});
    if(!response.ok)throw Error('get_fakemon_http_'+response.status);
    const json=await response.json(),row=(Array.isArray(json)?json:[json]).find(x=>x?.read_key===id);
    return artResolveRow(row,id);
  }
  function createWorker(){if(worker||workerFailed)return worker;
    try{
      const blob=new Blob([ART_WORKER_SOURCE],{type:'text/javascript'});workerBlobUrl=URL.createObjectURL(blob);
      try{worker=new Worker(workerBlobUrl);worker.onmessage=e=>{if(workerBlobUrl){URL.revokeObjectURL(workerBlobUrl);workerBlobUrl=null;}const m=e.data,p=workerRequests.get(m.id);if(!p)return;workerRequests.delete(m.id);clearTimeout(p.timeout);m.ok?p.resolve(m):p.reject(Error(m.error||'worker_scan_failed'));};
        worker.onerror=()=>{if(workerBlobUrl){URL.revokeObjectURL(workerBlobUrl);workerBlobUrl=null;}workerFailed=true;worker?.terminate();worker=null;for(const p of workerRequests.values()){clearTimeout(p.timeout);p.reject(Error('worker_failed'));}workerRequests.clear();};
      }catch(error){if(workerBlobUrl){URL.revokeObjectURL(workerBlobUrl);workerBlobUrl=null;}throw error;}
    }catch(_){workerFailed=true;worker=null;}
    return worker;
  }
  const runAnalysis=async(rgba,width,height,format)=>{
    const engine=createWorker();if(engine){try{const result=await new Promise((resolve,reject)=>{const id=++workerSeq;const timeout=setTimeout(()=>{workerRequests.delete(id);reject(Error('worker_timeout'));},30000);workerRequests.set(id,{resolve,reject,timeout});
      try{const transferable=rgba.slice();engine.postMessage({id,rgba:transferable.buffer,width,height,format},[transferable.buffer]);}catch(e){workerRequests.delete(id);clearTimeout(timeout);reject(e);}});return result;
    }catch(_){if(workerBlobUrl){URL.revokeObjectURL(workerBlobUrl);workerBlobUrl=null;}workerFailed=true;worker?.terminate();worker=null;}}
    // If a CSP disallows blob workers, yield before and between non-DOM phases;
    // exact scanner work is still blocking and this is reported in diagnostics.
    await new Promise(resolve=>setTimeout(resolve,0));const colorAt=performance.now(),colors=artColors(rgba,width,height,format),colorMs=performance.now()-colorAt;
    await new Promise(resolve=>setTimeout(resolve,0));const geomAt=performance.now(),geometry=artGeometry(rgba,width,height),geometryMs=performance.now()-geomAt;
    return {ok:true,colors,geometry,colorMs,geometryMs};
  };
  async function visit(ns,id,routeToken){
    const key=artIdentity(ns,id);if(visited.has(key)&&statuses.get(key)?.state!=='error')return jobs.get(key)||null;visited.add(key);
    const generation=(latestTokens.get(key)||0)+1;latestTokens.set(key,generation);
    const attemptId=String(++jobSerial),at=new Date().toISOString(),attemptStarted=performance.now();stats.sourceRevalidations++;
    activeStatus(key,'validating',{attemptId,lastAttemptAt:at,previousAvailable:records.has(key),sourceState:'unresolved'});
    const job=(async()=>{
      let phase='source';try{
        const previous=await hydrate(ns,id,true),native=await resolveNative(id);
        if(latestTokens.get(key)!==generation)return;
        sourceUpdate(key,s=>{s.state='source_resolved';s.candidate={href:native.href,mediaField:'normalPortrait',typesSignature:native.types.signature,
          routeToken,contentSha256:null,decodedRgbaSha256:null,width:null,height:null,imageFormat:null};s.lastSuccessful=previous?.normalSource??null;s.latestFailure=null;});
        activeStatus(key,'validating',{sourceState:'source_resolved',previousAvailable:!!previous});
        phase='source';const resp=await fetchTimeout(native.href,{mode:'cors',credentials:'omit',cache:'no-cache'});
        if(!resp.ok)throw Error('normal_art_http_'+resp.status);
        const bytes=new Uint8Array(await resp.arrayBuffer()),fmt=artFormat(bytes),sha=await artDigest(bytes);
        if(latestTokens.get(key)!==generation)return;
        sourceUpdate(key,s=>{s.state='source_bytes_verified';s.candidate.contentSha256=sha;s.candidate.imageFormat=fmt;s.lastVerified={href:native.href,contentSha256:sha};});
        activeStatus(key,'validating',{sourceState:'source_bytes_verified'});
        const same=previous&&previous.normalSource?.contentSha256===sha&&previous.scanner?.version==='1.0.0'&&previous.scanner?.configSha256===ART_CONFIG_SHA;
        if(same&&(!previous.geometry.reliable||await maskStored(ns,id))){
          let next=artSafeCopy(previous);
          sourceUpdate(key,s=>{s.candidate.decodedRgbaSha256=previous.normalSource.decodedRgbaSha256;s.candidate.width=previous.normalSource.width;s.candidate.height=previous.normalSource.height;});
          next.normalSource.href=native.href;next.types=native.types;
          if(previous.types.signature!==native.types.signature)next.color.decision=artDecide(next.color.stats,native.types.primary,native.types.secondary);
          next.lastSuccessfulValidationAt=new Date().toISOString();
          const changed=artMeaningful(next)!==artMeaningful(previous);
          if(changed)next.analysisRevision=(previous.analysisRevision||0)+1;
          if(changed){const oldMask=next.geometry.reliable?await maskStored(ns,id):null;
            if(!await commitResult(ns,id,next,oldMask,previous,key,attemptId,routeToken))return;}
          else{
            // Updating a validation timestamp is not an update event; preserve IDB record.
            const stored=await persistValidationTime(ns,id,next);if(db&&!stored)stats.storageFailures++;recordTouch(key,{record:next,cacheSource:stored?'persisted':'memory'});
          }
          sourceUpdate(key,s=>{s.state='analysis_complete';s.lastSuccessful=next.normalSource;});
          activeStatus(key,'ready',{sourceState:'analysis_complete',latestFailure:null});failures.delete(key);return;
        }
        phase='decode';const decodeAt=performance.now(),decoded=await artDecodeBytes(bytes,fmt);const decodeMs=performance.now()-decodeAt;
        const rgbaSha=await artDigest(decoded.rgba);
        if(latestTokens.get(key)!==generation)return;
        sourceUpdate(key,s=>{s.state='decoded_image_verified';s.candidate.decodedRgbaSha256=rgbaSha;
          s.candidate.width=decoded.width;s.candidate.height=decoded.height;s.candidate.imageFormat=fmt;});
        activeStatus(key,'analyzing',{sourceState:'decoded_image_verified'});
        phase='analysis';const scanAt=performance.now(),analysis=await runAnalysis(decoded.rgba,decoded.width,decoded.height,fmt),scanMs=performance.now()-scanAt;
        if(latestTokens.get(key)!==generation)return;
        const color=analysis.colors,geo=analysis.geometry;
        const mask=geo.reliable?geo.packedMask:null,maskSha=mask?await artDigest(mask):null;
        if(maskSha)geo.maskSha256=maskSha;
        const geometryRecord={state:geo.state,reliable:geo.reliable,alphaThreshold:1,reliabilityReason:geo.reliabilityReason,width:decoded.width,height:decoded.height,
          bounds:geo.bounds,occupiedPixels:geo.occupiedPixels,observedOccupancy:geo.observedOccupancy,visualBoundsAlpha128:geo.visualBoundsAlpha128,
          components:geo.components,holes:geo.holes,maskFormat:geo.reliable?'packed-msb-row-v1':null,
          maskStrideBytes:geo.maskStrideBytes,maskLength:geo.reliable?mask.length:null,maskSha256:maskSha,
          transparency:geo.transparency};
        const now=new Date().toISOString(),next={schemaVersion:1,namespace:ns,speciesId:id,nativeSpeciesId:'F.'+id,
          analysisRevision:(previous?.analysisRevision||0)+1,
          normalSource:{href:native.href,mediaField:'normalPortrait',contentSha256:sha,decodedRgbaSha256:rgbaSha,
            width:decoded.width,height:decoded.height,imageFormat:fmt,decodeMode:decoded.decodeMode},
          types:native.types,scanner:{version:'1.0.0',configSha256:ART_CONFIG_SHA,referenceSha256:ART_REFERENCE_SHA},
          color:{state:'ready',stats:color,decision:artDecide(color,native.types.primary,native.types.secondary)},geometry:geometryRecord,
          lastSuccessfulAnalysisAt:now,lastSuccessfulValidationAt:now};
        stats.scansCompleted++;
        if(!await commitResult(ns,id,next,mask,previous,key,attemptId,routeToken))return;
        sourceUpdate(key,s=>{s.state='analysis_complete';s.lastSuccessful=next.normalSource;});
        activeStatus(key,'ready',{sourceState:'analysis_complete',latestFailure:null});failures.delete(key);
        // Last scan timings are diagnostic-only and never part of the color decision.
        timing.set(key,{...timing.get(key),decodeMs,colorScanMs:analysis.colorMs,geometryMs:analysis.geometryMs,
          analysisAndGeometryMs:scanMs,totalAcquisitionToRecordMs:performance.now()-attemptStarted,
          sourceBytes:bytes.length,decodeMode:decoded.decodeMode,
          memoryProxyBytes:decoded.width*decoded.height*(4+1+8+24+1+1)+(Math.ceil(decoded.width/8)*decoded.height),
          memoryProxyNote:'Conservative known typed-array allocation proxy, not measured peak process memory.'});
      }catch(err){markFailure(ns,id,phase,err,attemptId);}
    })().finally(()=>jobs.delete(key));jobs.set(key,job);return job;
  }
  const timing=new Map();
  async function maskStored(ns,id){const key=artIdentity(ns,id),cached=maskCache.get(key);if(cached)return cached.bytes.slice();
    const r=await dbGet(ART_STORES[ns][1],id);if(!r)return null;return new Uint8Array(r.bytes).slice();}
  async function persistValidationTime(ns,id,next){if(!db)return false;try{return await new Promise(resolve=>{
    const tx=db.transaction([ART_STORES[ns][0]],'readwrite');tx.objectStore(ART_STORES[ns][0]).put(next);tx.oncomplete=()=>resolve(true);tx.onabort=()=>resolve(false);tx.onerror=()=>resolve(false);});}catch(_){return false;}}
  async function commitResult(ns,id,next,mask,previous,key,attemptId,requestRouteToken){
    const storageStarted=performance.now(),outcome=await persist(ns,id,next,mask);
    timing.set(key,{...timing.get(key),storageWriteMs:performance.now()-storageStarted});
    if(outcome==='stale')return false;
    const persistent=outcome==='persisted';if(!persistent)stats.storageFailures++;
    else void clearStatus(ns,id);
    recordTouch(key,{record:next,cacheSource:persistent?'persisted':'memory'});
    if(next.geometry.reliable&&mask){maskTouch(key,{bytes:mask.slice(),recordRevision:next.analysisRevision});}
    else maskCache.delete(key);
    localPut(next);
    if(artMeaningful(previous)!==artMeaningful(next)){
      stats.updateEventsPublished++;
      dispatch('updated',{apiVersion:1,namespace:ns,speciesId:id,analysisRevision:next.analysisRevision,normalSource:next.normalSource.href,
        contentSha256:next.normalSource.contentSha256,typesSignature:next.types.signature,scannerVersion:'1.0.0',
        recordSchemaVersion:1,requestRouteToken});
    }
    return true;
  }
  async function lookup(ns,id){const key=artIdentity(ns,id);const entry=records.get(key);if(entry)return artSnapshot(entry.record,entry.cacheSource);
    const r=await hydrate(ns,id);return artSnapshot(r,records.get(key)?.cacheSource||'persisted');}
  async function silhouette(ns,id){const key=artIdentity(ns,id);const record=await hydrate(ns,id);
    if(!record?.geometry?.reliable)return null;
    let bytes=maskCache.get(key)?.bytes;if(!bytes){const stored=await dbGet(ART_STORES[ns][1],id);
      if(!stored||stored.maskSha256!==record.geometry.maskSha256)return null;bytes=new Uint8Array(stored.bytes);maskTouch(key,{bytes:bytes.slice(),recordRevision:record.analysisRevision});}
    if(artSha256Sync(bytes)!==record.geometry.maskSha256)return null;
    return {format:'packed-msb-row-v1',width:record.geometry.width,height:record.geometry.height,
      strideBytes:record.geometry.maskStrideBytes,alphaThreshold:1,maskSha256:record.geometry.maskSha256,
      bounds:artSafeCopy(record.geometry.bounds),occupiedPixels:record.geometry.occupiedPixels,bytes:bytes.slice()};
  }
  function decodeSilhouette(enc){if(!enc||typeof enc.maskSha256!=='string'||artSha256Sync(enc.bytes)!==enc.maskSha256)throw Error('mask_hash_mismatch');return artDecodeSilhouette(enc);}
  function recommendCorner(ns,id,render){const key=artIdentity(ns,id),entry=records.get(key),mask=maskCache.get(key);
    if(!entry?.record.geometry.reliable||!mask||mask.recordRevision!==entry.record.analysisRevision||
      render?.normalSource!==entry.record.normalSource.href||render?.normalSourceSha256!==entry.record.normalSource.contentSha256)return null;
    const m=artDecodeSilhouette({format:'packed-msb-row-v1',alphaThreshold:1,width:entry.record.geometry.width,height:entry.record.geometry.height,
      strideBytes:entry.record.geometry.maskStrideBytes,bytes:mask.bytes});
    const result=artRecommend(m,entry.record.geometry.bounds,render,entry.record.geometry.maskSha256);
    cornerCache.set(key,result);return artSafeCopy(result);
  }
  async function inspect(ns,id){const s=await lookup(ns,id),persistedFailure=await dbGet(ART_STORES[ns][2],id);
    const key=artIdentity(ns,id),src=sources.get(key)||artSourceDefault(),status=statusFor(ns,id),r=s||null,
      g=r?.geometry??null,c=r?.color??null,d=c?.decision??{},v=c?.stats??{},t=g?.transparency??null;
    return {apiVersion:1,schemaVersion:1,namespace:ns,speciesId:id,moduleVersion:ART_MODULE_VERSION,scannerVersion:'1.0.0',
      recordState:status.state,cacheSource:s?.cacheSource??null,normalArtworkUrl:src.candidate?.href??null,
      normalSourceState:src.state,candidateNormalSourceSha256:src.candidate?.contentSha256??null,
      candidateDecodedRgbaSha256:src.candidate?.decodedRgbaSha256??null,
      lastSuccessfulArtworkUrl:r?.normalSource?.href??null,normalSourceSha256:r?.normalSource?.contentSha256??null,
      decodedRgbaSha256:r?.normalSource?.decodedRgbaSha256??null,imageFormat:r?.normalSource?.imageFormat??null,
      sourceDimensions:r?{width:r.normalSource.width,height:r.normalSource.height}:null,analyzerResultVersion:r?.scannerVersion??null,
      analysisRevision:r?.analysisRevision??null,lastSuccessfulAnalysisAt:r?.lastSuccessfulAnalysisAt??null,
      lastSuccessfulValidationAt:r?.lastSuccessfulValidationAt??null,lastValidationAttemptAt:status.lastAttemptAt,
      lastFailure:artSafeCopy(failures.get(key)??persistedFailure?.lastFailure??null),primaryType:r?.types.primary??null,secondaryType:r?.types.secondary??null,
      selectedBannerType:d.selected_banner_type??null,selectedTintType:d.selected_tint_type??null,
      averageColor:v.average_color??null,rawAlphaAverageColor:v.raw_alpha_average_color??null,
      dominantColor:v.dominant_color??null,dominantCoverage:v.dominant_coverage??null,clusters:v.clusters??null,
      colorVisiblePixels:v.visible_pixels??null,backgroundPixelsRemoved:v.background_pixels_removed??null,
      outlinePixelsDiscounted:v.outline_pixels_discounted??null,nearBlackBodyFraction:v.near_black_body_fraction??null,
      nearWhiteBodyFraction:v.near_white_body_fraction??null,
      cie76:{averagePrimary:d.delta_e_average_primary??null,dominantPrimary:d.delta_e_dominant_primary??null,
        combinedPrimary:d.combined_score_primary??null,averageSecondary:d.delta_e_average_secondary??null,
        dominantSecondary:d.delta_e_dominant_secondary??null,combinedSecondary:d.combined_score_secondary??null,confidenceMargin:d.confidence_margin??null},
      transparency:t?{...t,scannerAlphaThreshold:128,geometryAlphaThreshold:1}:null,
      geometry:{state:g?.state??null,reliable:g?.reliable??false,maskFormat:g?.maskFormat??null,
        width:g?.width??null,height:g?.height??null,strideBytes:g?.maskStrideBytes??null,maskSha256:g?.maskSha256??null,
        maskByteLength:g?.maskLength??null,bounds:g?.bounds??null,observedOccupancyBounds:g?.observedOccupancy?.bounds??null,
        visualBoundsAlpha128:g?.visualBoundsAlpha128??null,occupiedPixels:g?.occupiedPixels??null,
        disconnectedComponents:g?.components??null,interiorHoles:g?.holes??null},
      automaticCorner:artSafeCopy(cornerCache.get(key)??null),timing:artSafeCopy(timing.get(key)??null)};
  }
  function statusFor(ns,id){const key=artIdentity(ns,id),s=statuses.get(key),rec=records.get(key);
    return artSafeCopy(s||{...artStatusDefault(),state:rec?'cached':'missing',previousAvailable:!!rec,sourceState:sources.get(key)?.state??'unresolved'});
  }
  function currentContext(){return artSafeCopy(route?{...route,normalSource:sources.get(artIdentity('fakemon',route.speciesId))?.candidate?.href??null,
    typesSignature:sources.get(artIdentity('fakemon',route.speciesId))?.candidate?.typesSignature??null}:null);}
  function diagnostics(){const src=route?sources.get(artIdentity('fakemon',route.speciesId)):null;
    return artSafeCopy({apiVersion:1,moduleVersion:ART_MODULE_VERSION,scannerVersion:'1.0.0',scannerReferenceSha256:ART_REFERENCE_SHA,
      ready,currentSpecies:route?{namespace:'fakemon',speciesId:route.speciesId}:null,
      currentNormalSourceUrl:src?.candidate?.href??null,currentContentSha256:src?.candidate?.contentSha256??null,
      sessionStartedAt:startedAt,db:dbStatus,counters:stats,worker:{mode:worker?'blob-worker':workerFailed?'main-thread-fallback':'not-started'}});
  }
  function lastGoodDecision(ns,id){const key=artIdentity(ns,id),saved=fast.get(key),candidate=sources.get(key)?.candidate;
    if(!saved||!candidate||candidate.href!==saved.normalSourceHref||candidate.typesSignature!==saved.typesSignature||saved.scannerVersion!=='1.0.0')return null;
    return artSafeCopy({...saved,cacheSource:'localStorage',validatedFresh:false});
  }
  const api={apiVersion:1,moduleVersion:ART_MODULE_VERSION,scannerVersion:'1.0.0',
    get ready(){return ready;},whenReady:()=>readyPromise,
    currentContext,lastGoodDecision,peek:(ns,id)=>{const e=records.get(artIdentity(ns,id));return e?artSnapshot(e.record,e.cacheSource):null;},
    lookup,status:statusFor,source:(ns,id)=>artSafeCopy(sources.get(artIdentity(ns,id))||artSourceDefault()),
    silhouette,decodeSilhouette,recommendCorner,inspect,diagnostics};
  Object.freeze(api);Object.defineProperty(window,'__yofiArtworkIntelligence',{value:api,writable:false,configurable:false});
  function updateRoute(){const next=artRoute();if(next&&route&&next.routeToken===route.routeToken)return;route=next;if(!route)return;const {namespace,speciesId,routeToken}=route;
    void visit(namespace,speciesId,routeToken);}
  function scheduleRoute(){if(routeScheduled)return;routeScheduled=true;queueMicrotask(()=>{routeScheduled=false;updateRoute();});}
  for(const event of ['popstate','hashchange','pageshow'])window.addEventListener(event,scheduleRoute,{passive:true});
  for(const event of ['yofi:species-card-prepare-before-reveal','yofi:species-card-presentation-ready'])document.addEventListener(event,scheduleRoute,{passive:true});
  if(window.navigation?.addEventListener)window.navigation.addEventListener('navigate',()=>setTimeout(scheduleRoute,0));
  // Native SvelteKit can route without popstate. Instrument only History methods,
  // once, and do not observe or scan the DOM. No other userscript is required.
  for(const name of ['pushState','replaceState']){
    const previous=history[name];if(previous.__artRouteWrapped)continue;
    const wrap=function(...args){const result=Reflect.apply(previous,this,args);scheduleRoute();return result;};
    wrap.__artRouteWrapped=true;history[name]=wrap;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleRoute,{once:true});else scheduleRoute();
  return api;
}
