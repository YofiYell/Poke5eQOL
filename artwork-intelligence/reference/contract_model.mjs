/** ART-01 pure, in-memory DATA CONTRACT MODEL, not a browser service.
 * Tests model versioning, cache/validation transitions, manual preference
 * precedence, stale routes and atomic publish semantics without IndexedDB.
 */
const validNS=new Set(['fakemon','pokemon']);
const validCorners=new Set(['tl','tr','bl','br']);
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
    event.typesSignature===current.typesSignature &&
    event.routeToken===current.routeToken;
}
export function validateRecord(record,namespace,id){
  return record?.namespace===namespace && record?.speciesId===id &&
    record?.schemaVersion===1 && record?.color?.state==='ready' &&
    typeof record?.normalSource?.contentSha256==='string' && record.normalSource.contentSha256.length===64 &&
    typeof record?.types?.signature==='string' &&
    record?.scannerVersion==='1.0.0';
}
export class ReferenceCache {
  constructor(initial=new Map()){
    this.persisted=new Map(initial);
    this.sessionVisited=new Set();
    this.failed=new Map();
    this.stats={cacheHits:0,sourceRevalidations:0,scansCompleted:0,analysisFailures:0};
    this.events=[];
  }
  beginSession(){this.sessionVisited.clear();}
  peek(identity){const k=keyOf(identity);const value=this.persisted.get(k)||null;if(value)this.stats.cacheHits++;return value;}
  enter(identity){
    const k=keyOf(identity),previous=this.peek(identity);
    const first=!this.sessionVisited.has(k);this.sessionVisited.add(k);
    if(first)this.stats.sourceRevalidations++;
    return {previous,shouldRevalidate:first};
  }
  validateInputs(identity,{sha256,normalSource,typesSignature,scannerVersion}){
    const old=this.peek(identity);
    if(!old)return {action:'scan'};
    if(old.scannerVersion!==scannerVersion || old.normalSource.contentSha256!==sha256)
      return {action:'scan'};
    if(old.normalSource.href!==normalSource)return {action:'source-metadata-review'};
    if(old.types.signature!==typesSignature)return {action:'rescore'};
    return {action:'reuse'};
  }
  success(record,{maskWriteOk=true}={}){
    const k=keyOf(record),previous=this.persisted.get(k);
    if(!maskWriteOk){
      this.fail(record,'atomic-mask-write-failed');
      return {changed:false,previous};
    }
    if(!validateRecord(record,record.namespace,record.speciesId)){
      this.fail(record,'invalid-complete-record');return {changed:false,previous};
    }
    // Identical revisions cannot publish a second completed-update event.
    if(previous?.analysisRevision===record.analysisRevision &&
       previous?.normalSource?.contentSha256===record.normalSource.contentSha256 &&
       previous?.types?.signature===record.types.signature)
      return {changed:false,previous};
    // Models a single IDB readwrite TX touching both record and mask stores.
    this.persisted.set(k,structuredClone(record));this.failed.delete(k);
    this.stats.scansCompleted++;
    // One coherent successful publication, no partial/failed event.
    const event={namespace:record.namespace,speciesId:record.speciesId,
      normalSource:record.normalSource.href,typesSignature:record.types.signature,
      version:record.analysisRevision,contentSha256:record.normalSource.contentSha256};
    this.events.push(event);
    return {changed:true,previous};
  }
  fail(identity,reason){const k=keyOf(identity);this.failed.set(k,reason);this.stats.analysisFailures++;}
  refresh(){this.beginSession();}
}
