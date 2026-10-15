/** ART-01-R02 pure reference CONTRACT MODEL, never a runtime userscript.
 * The real ART-02 service must test IndexedDB transaction atomicity separately.
 * Passive record inspection cannot initiate I/O or increment reuse counters.
 */
const validNS=new Set(['fakemon','pokemon']);
const validCorners=new Set(['tl','tr','bl','br']);
const shaPattern=/^[a-f0-9]{64}$/i;
export function keyOf({namespace,speciesId}){
  if(!validNS.has(namespace)||typeof speciesId!=='string'||!speciesId.length)throw Error('invalid identity');
  return `${namespace}\u0000${speciesId}`;
}
export function cornerWithManualPreference({hasSaved,manualCorner,automaticCorner}){
  if(hasSaved && validCorners.has(manualCorner))return {corner:manualCorner,source:'manual'};
  if(validCorners.has(automaticCorner))return {corner:automaticCorner,source:'automatic'};
  return {corner:'tr',source:'qol-default'};
}
export function currentRouteMatches(event,current){
  return !!event && !!current && event.namespace===current.namespace &&
    event.speciesId===current.speciesId && event.normalSource===current.normalSource &&
    event.typesSignature===current.typesSignature && event.routeToken===current.routeToken;
}
/** Source-only resolver modeled directly on native get_fakemon and
 * SupabaseFakemonDataProvider.rowToFakemon. This is a pure TEST HELPER, not
 * a production network request. It must never inspect a displayed img.src.
 */
export function resolveNormalFromFakemonRow(row,routeReadKey,assetBase='https://poke5e.auroratide.cloud/'){
  const key=String(routeReadKey??'').replace(/^F\./,'');
  if(!key||!row||row.read_key!==key)throw Error('fakemon_read_key_mismatch');
  const normal=String(row.normal_portrait_filename??'').trim();
  if(!normal)throw Error('normal_portrait_missing');
  if(!Array.isArray(row.type)||row.type.length<1||row.type.length>2||
     row.type.some(t=>typeof t!=='string'||!/^[a-z]+$/.test(t)))throw Error('invalid_native_types');
  let href;
  try{
    const base=new URL(assetBase),src=new URL(normal,base);
    if(!['https:','http:'].includes(src.protocol)||src.username||src.password||
      normal.split('/').includes('..'))throw Error('invalid_normal_source');
    href=src.href;
  }catch(_){throw Error('invalid_normal_source');}
  return Object.freeze({namespace:'fakemon',speciesId:key,nativeSpeciesId:`F.${key}`,
    types:{primary:row.type[0],secondary:row.type[1]??null,
      signature:row.type.join('/')},
    candidate:{href,mediaField:'normalPortrait',contentSha256:null,
      decodedRgbaSha256:null}});
}

export function validateRecord(record,namespace,id){
  return record?.namespace===namespace && record?.speciesId===id &&
    record?.schemaVersion===1 && record?.color?.state==='ready' &&
    shaPattern.test(record?.normalSource?.contentSha256 ?? '') &&
    typeof record?.types?.signature==='string' &&
    record?.scannerVersion==='1.0.0';
}

/** These are candidate-source states, separate from the last-good record.
 * No provisional source hash is ever filled with a fake or empty-string hash.
 */
export class ReferenceSourceLifecycle {
  constructor(lastSuccessful=null){
    this.lastSuccessful=lastSuccessful?structuredClone(lastSuccessful):null;
    this.lastVerified=null;
    this.candidate=null;
    this.state='unresolved';
    this.generation=0;
    this.failure=null;
  }
  resolve({href,mediaField='normalPortrait',typesSignature,routeToken}){
    if(typeof href!=='string'||!/^https?:\/\//.test(href)||mediaField!=='normalPortrait')
      throw Error('missing or invalid authoritative normal portrait');
    this.generation++;
    this.candidate={href,mediaField,typesSignature,routeToken,contentSha256:null,
      decodedRgbaSha256:null,dimensions:null,imageFormat:null};
    this.state='source_resolved';this.lastVerified=null;this.failure=null;
    return this.snapshot();
  }
  bytesVerified({generation,href,sha256}){
    if(this.state!=='source_resolved'||generation!==this.generation||href!==this.candidate?.href)
      return false;
    if(!shaPattern.test(sha256))throw Error('invalid SHA-256');
    this.candidate.contentSha256=sha256.toLowerCase();
    this.lastVerified={href,contentSha256:sha256.toLowerCase()};
    this.state='source_bytes_verified';return true;
  }
  decodedVerified({generation,decodedRgbaSha256,width,height,imageFormat}){
    if(this.state!=='source_bytes_verified'||generation!==this.generation)return false;
    if(!shaPattern.test(decodedRgbaSha256)||!Number.isInteger(width)||width<1||
       !Number.isInteger(height)||height<1||typeof imageFormat!=='string')throw Error('bad decoded image');
    Object.assign(this.candidate,{decodedRgbaSha256:decodedRgbaSha256.toLowerCase(),
      dimensions:{width,height},imageFormat});
    this.state='decoded_image_verified';return true;
  }
  complete({generation}){
    if(this.state!=='decoded_image_verified'||generation!==this.generation)return false;
    this.state='analysis_complete';return true;
  }
  fail({generation,code}){
    if(generation!==this.generation)return false;
    this.state='source_validation_failed';this.failure=String(code||'unknown');return true;
  }
  snapshot(){
    return structuredClone({state:this.state,generation:this.generation,
      candidate:this.candidate,lastVerified:this.lastVerified,
      lastSuccessful:this.lastSuccessful,latestFailure:this.failure});
  }
}

function decisionIdentity(record){
  return JSON.stringify({sha:record.normalSource.contentSha256,
    types:record.types.signature,scanner:record.scannerVersion,
    choice:record.color?.decision ?? record.color?.banner ?? null,
    tint:record.color?.tint ?? null,
    geometryState:record.geometry?.state ?? null,
    geometryMaskSha:record.geometry?.maskSha256 ?? null});
}
export class ReferenceCache {
  constructor(initial=new Map(),{preHydrated=false}={}){
    this.persisted=new Map(initial); // models IDB contents, not sync memory
    this.memory=preHydrated?new Map(initial):new Map();
    this.sessionVisited=new Set();
    this.failed=new Map();
    this.stats={cacheHits:0,idbHydrations:0,sourceRevalidations:0,
      scansCompleted:0,analysisFailures:0,updateEventsPublished:0};
    this.events=[];
  }
  beginSession(){this.sessionVisited.clear();}
  // ALL of these are passive; no counters, network or storage writes.
  peek(identity){const record=this.memory.get(keyOf(identity));return record?structuredClone(record):null;}
  lookup(identity){const record=this.persisted.get(keyOf(identity));return record?structuredClone(record):null;}
  inspect(identity){return structuredClone({record:this.peek(identity),
    persisted:this.lookup(identity),failure:this.failed.get(keyOf(identity))??null});}
  diagnostics(){return structuredClone(this.stats);}
  hydrate(identity){
    const k=keyOf(identity),record=this.persisted.get(k);
    if(record){this.memory.set(k,structuredClone(record));this.stats.idbHydrations++;}
    return this.peek(identity);
  }
  // enter() models a relevant visit that initiates first-session revalidation.
  // Returning previous does NOT prove a consumer actually applied the result.
  enter(identity){
    const k=keyOf(identity),previous=this.peek(identity),first=!this.sessionVisited.has(k);
    this.sessionVisited.add(k);
    if(first)this.stats.sourceRevalidations++;
    return {previous,shouldRevalidate:first};
  }
  // Counts only successful reuse by an active presentation consumer after
  // source/type eligibility checks. Diagnostics, hydration and peek do not count.
  reuseForPresentation(identity,{normalSourceHref,typesSignature}={}){
    const record=this.memory.get(keyOf(identity));
    if(!record||record.normalSource.href!==normalSourceHref||
       record.types.signature!==typesSignature)return null;
    this.stats.cacheHits++;
    return structuredClone(record);
  }
  validateInputs(identity,{sha256,normalSource,typesSignature,scannerVersion}){
    const old=this.peek(identity);
    if(!shaPattern.test(sha256??''))return {action:'verify-bytes'};
    if(!old)return {action:'scan'};
    if(old.scannerVersion!==scannerVersion || old.normalSource.contentSha256!==sha256)
      return {action:'scan'};
    if(old.normalSource.href!==normalSource)return {action:'source-metadata-review'};
    if(old.types.signature!==typesSignature)return {action:'rescore'};
    return {action:'reuse'};
  }
  completedFullImageScan(){this.stats.scansCompleted++;}
  success(record,{maskWriteOk=true}={}){
    const k=keyOf(record),previous=this.persisted.get(k);
    if(!maskWriteOk){this.fail(record,'atomic-mask-write-failed');return {changed:false,previous};}
    if(!validateRecord(record,record.namespace,record.speciesId)){
      this.fail(record,'invalid-complete-record');return {changed:false,previous};}
    // A late stale-source/route generation cannot roll back a newer committed
    // revision, even when it finishes after a successful subsequent visit.
    if(previous && (record.analysisRevision<previous.analysisRevision ||
       (record.analysisRevision===previous.analysisRevision &&
        decisionIdentity(previous)!==decisionIdentity(record))))
      return {changed:false,previous,rejected:'stale-or-conflicting-revision'};
    // Actual two-store TX must complete before memory publication (ART-02).
    const meaningful=!previous||decisionIdentity(previous)!==decisionIdentity(record);
    if(!meaningful){
      // Metadata-only validation may update lastSuccessfulValidationAt without
      // revising the artifact revision or publishing a changed decision.
      const kept={...structuredClone(previous),
        normalSource:{...structuredClone(previous.normalSource),href:record.normalSource.href},
        lastSuccessfulValidationAt:record.lastSuccessfulValidationAt??previous.lastSuccessfulValidationAt};
      this.persisted.set(k,kept);this.memory.set(k,structuredClone(kept));
      return {changed:false,previous};
    }
    this.persisted.set(k,structuredClone(record));this.memory.set(k,structuredClone(record));
    this.failed.delete(k);
    const event={namespace:record.namespace,speciesId:record.speciesId,
      normalSource:record.normalSource.href,typesSignature:record.types.signature,
      version:record.analysisRevision,contentSha256:record.normalSource.contentSha256};
    this.events.push(event);this.stats.updateEventsPublished++;
    return {changed:true,previous};
  }
  fail(identity,reason){this.failed.set(keyOf(identity),reason);this.stats.analysisFailures++;}
  refresh(){this.beginSession();this.memory.clear();}
}
