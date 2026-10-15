import test from 'node:test';import assert from 'node:assert/strict';
import {ReferenceCache,ReferenceSourceLifecycle,cornerWithManualPreference,
        currentRouteMatches,keyOf,resolveNormalFromFakemonRow} from '../reference/contract_model.mjs';
const id={namespace:'fakemon',speciesId:'G.ABC123'};
const sample=(revision=1,sha='a'.repeat(64))=>({...id,schemaVersion:1,scannerVersion:'1.0.0',analysisRevision:revision,
 types:{primary:'ghost',secondary:'psychic',signature:'ghost/psychic'},
 normalSource:{href:'https://example.invalid/normal.png',contentSha256:sha},
 color:{state:'ready',banner:'ghost',tint:'psychic'},geometry:{state:'ready',maskSha256:'c'.repeat(64)},
 lastSuccessfulValidationAt:'2026-10-14T12:00:00Z'});
const context={normalSourceHref:sample().normalSource.href,typesSignature:sample().types.signature};
test('namespaces cannot collide; normal artwork is not part of key',()=>{
 assert.notEqual(keyOf(id),keyOf({namespace:'pokemon',speciesId:id.speciesId}));
 assert.equal(keyOf(id),keyOf({...id,normalSource:'other',variant:'shiny',width:999}));
});
test('passive inspection is counter-stable, even with available persisted data',()=>{
 const cache=new ReferenceCache(new Map([[keyOf(id),sample()]]));
 assert.equal(cache.peek(id),null); // IDB is async: not yet hydrated
 const baseline=cache.diagnostics();
 for(let i=0;i<20;i++){
   assert.equal(cache.peek(id),null);
   assert.equal(cache.lookup(id).analysisRevision,1);
   assert.equal(cache.inspect(id).record,null);
   assert.deepEqual(cache.diagnostics(),baseline);
 }
 assert.deepEqual(cache.diagnostics(),baseline);
});
test('hydration alone never counts a presentation reuse',()=>{
 const cache=new ReferenceCache(new Map([[keyOf(id),sample()]]));
 assert.equal(cache.hydrate(id).analysisRevision,1);
 assert.equal(cache.stats.cacheHits,0);
 assert.equal(cache.stats.idbHydrations,1);
 assert.equal(cache.reuseForPresentation(id,context).analysisRevision,1);
 assert.equal(cache.stats.cacheHits,1);
 assert.equal(cache.peek(id).analysisRevision,1);
 assert.equal(cache.stats.cacheHits,1);
});
test('failed source/type match does not count reuse',()=>{
 const cache=new ReferenceCache(new Map([[keyOf(id),sample()]]),{preHydrated:true});
 assert.equal(cache.reuseForPresentation(id,{...context,typesSignature:'ghost/fairy'}),null);
 assert.equal(cache.reuseForPresentation(id,{...context,normalSourceHref:'https://example.invalid/new.png'}),null);
 assert.equal(cache.stats.cacheHits,0);
});
test('first relevant visit each refresh initiates one revalidation; revisit only reuses',()=>{
 const cache=new ReferenceCache(new Map([[keyOf(id),sample()]]));
 cache.hydrate(id);
 assert.equal(cache.enter(id).shouldRevalidate,true);
 assert.equal(cache.enter(id).shouldRevalidate,false);
 assert.equal(cache.reuseForPresentation(id,context).analysisRevision,1);
 assert.equal(cache.stats.cacheHits,1);
 cache.refresh();assert.equal(cache.peek(id),null);
 cache.hydrate(id);assert.equal(cache.enter(id).shouldRevalidate,true);
 assert.equal(cache.stats.sourceRevalidations,2);
});
test('missing source hash does NOT imply unchanged even with same URL',()=>{
 const cache=new ReferenceCache(new Map([[keyOf(id),sample()]]),{preHydrated:true});
 const input={sha256:'a'.repeat(64),normalSource:sample().normalSource.href,
   typesSignature:'ghost/psychic',scannerVersion:'1.0.0'};
 assert.equal(cache.validateInputs(id,{...input,sha256:null}).action,'verify-bytes');
 assert.equal(cache.validateInputs(id,input).action,'reuse');
 assert.equal(cache.validateInputs(id,{...input,typesSignature:'ghost/fairy'}).action,'rescore');
 assert.equal(cache.validateInputs(id,{...input,scannerVersion:'1.1.0'}).action,'scan');
 assert.equal(cache.validateInputs(id,{...input,sha256:'b'.repeat(64)}).action,'scan');
 assert.equal(cache.validateInputs(id,{...input,normalSource:'https://example.invalid/new.png'}).action,'source-metadata-review');
});
test('failed analysis or atomic mask write never clobbers last success',()=>{
 const cache=new ReferenceCache(new Map([[keyOf(id),sample()]]),{preHydrated:true});
 cache.fail(id,'cors');assert.equal(cache.peek(id).analysisRevision,1);
 assert.equal(cache.success(sample(2,'b'.repeat(64)),{maskWriteOk:false}).changed,false);
 assert.equal(cache.peek(id).analysisRevision,1);assert.equal(cache.events.length,0);
 assert.equal(cache.success(sample(2,'b'.repeat(64))).changed,true);
 assert.equal(cache.peek(id).analysisRevision,2);assert.equal(cache.events.length,1);
 assert.equal(cache.success(sample(2,'b'.repeat(64))).changed,false);
 assert.equal(cache.events.length,1);
});
test('successful unchanged validation refreshes metadata but publishes no event',()=>{
 const cache=new ReferenceCache(new Map([[keyOf(id),sample()]]),{preHydrated:true});
 const renewed={...sample(2),lastSuccessfulValidationAt:'2026-10-15T00:00:00Z'};
 assert.equal(cache.success(renewed).changed,false);
 assert.equal(cache.peek(id).analysisRevision,1);
 assert.equal(cache.peek(id).lastSuccessfulValidationAt,'2026-10-15T00:00:00Z');
 assert.equal(cache.stats.updateEventsPublished,0);
});
test('scan counts full pixel processing only, never hydration or re-scoring',()=>{
 const cache=new ReferenceCache(new Map([[keyOf(id),sample()]]),{preHydrated:true});
 cache.validateInputs(id,{sha256:'a'.repeat(64),normalSource:context.normalSourceHref,
   typesSignature:'ghost/psychic',scannerVersion:'1.0.0'});
 assert.equal(cache.stats.scansCompleted,0);
 cache.completedFullImageScan();assert.equal(cache.stats.scansCompleted,1);
});
test('shiny toggle, resize and theme change produce no new scan/validation',()=>{
 const c=new ReferenceCache();c.enter(id);const prev={...c.stats};
 for(const behavior of ['shiny','resize','theme','fullscreen','same-route'])c.peek(id);
 assert.equal(c.stats.sourceRevalidations,prev.sourceRevalidations);
 assert.equal(c.stats.scansCompleted,0);
});
test('manual saved top-right is distinct from implicit default top-right',()=>{
 const f=cornerWithManualPreference;
 assert.deepEqual(f({hasSaved:true,manualCorner:'tr',automaticCorner:'bl'}),{corner:'tr',source:'manual'});
 assert.deepEqual(f({hasSaved:false,automaticCorner:'bl'}),{corner:'bl',source:'automatic'});
 assert.deepEqual(f({hasSaved:false,automaticCorner:null}),{corner:'tr',source:'qol-default'});
});
test('late result cannot affect a different species or stale route token',()=>{
 const incoming={...id,normalSource:'n2',typesSignature:'ghost/psychic',routeToken:9};
 assert.equal(currentRouteMatches({...incoming,speciesId:'other'},incoming),false);
 assert.equal(currentRouteMatches({...incoming,routeToken:8},incoming),false);
 assert.equal(currentRouteMatches({...incoming,normalSource:'old'},incoming),false);
 assert.equal(currentRouteMatches(incoming,incoming),true);
});
test('candidate source starts null-hash, progresses only through verified states',()=>{
 const lifecycle=new ReferenceSourceLifecycle(sample().normalSource);
 assert.equal(lifecycle.snapshot().state,'unresolved');
 let s=lifecycle.resolve({href:context.normalSourceHref,typesSignature:context.typesSignature,routeToken:'r1'});
 assert.equal(s.state,'source_resolved');assert.equal(s.candidate.contentSha256,null);
 assert.equal(s.lastSuccessful.contentSha256,'a'.repeat(64));
 assert.equal(lifecycle.bytesVerified({generation:s.generation,href:s.candidate.href,sha256:'a'.repeat(64)}),true);
 assert.equal(lifecycle.snapshot().state,'source_bytes_verified');
 assert.equal(lifecycle.decodedVerified({generation:s.generation,decodedRgbaSha256:'b'.repeat(64),width:722,height:722,imageFormat:'PNG'}),true);
 assert.equal(lifecycle.snapshot().state,'decoded_image_verified');
 assert.equal(lifecycle.complete({generation:s.generation}),true);
 assert.equal(lifecycle.snapshot().state,'analysis_complete');
});
test('stale completion and failure preserve last-successful record and correct source',()=>{
 const lifecycle=new ReferenceSourceLifecycle(sample().normalSource);
 const first=lifecycle.resolve({href:'https://example.invalid/first.png',typesSignature:'ghost/fairy',routeToken:'old'});
 const second=lifecycle.resolve({href:'https://example.invalid/second.png',typesSignature:'ghost/psychic',routeToken:'new'});
 assert.equal(lifecycle.bytesVerified({generation:first.generation,href:first.candidate.href,sha256:'f'.repeat(64)}),false);
 assert.equal(lifecycle.fail({generation:first.generation,code:'late'}),false);
 assert.equal(lifecycle.fail({generation:second.generation,code:'cors'}),true);
 const out=lifecycle.snapshot();
 assert.equal(out.state,'source_validation_failed');
 assert.equal(out.candidate.contentSha256,null);
 assert.equal(out.lastSuccessful.contentSha256,'a'.repeat(64));
 assert.equal(out.latestFailure,'cors');
});

test('native Fakemon RPC row resolves only normal/main portrait despite shiny display',()=>{
 const row={read_key:'BWMC6BSH0WZDR',type:['rock','steel'],
   normal_portrait_filename:'a79eff8c-4872-4b75-9b45-c7cb73cf4f55.png',
   shiny_portrait_filename:'never-scan-shiny.png',normal_sprite_filename:'never-scan-sprite.png'};
 const resolved=resolveNormalFromFakemonRow(row,'BWMC6BSH0WZDR');
 assert.equal(resolved.nativeSpeciesId,'F.BWMC6BSH0WZDR');
 assert.equal(resolved.types.signature,'rock/steel');
 assert.equal(resolved.candidate.href,'https://poke5e.auroratide.cloud/a79eff8c-4872-4b75-9b45-c7cb73cf4f55.png');
 assert.equal(resolved.candidate.mediaField,'normalPortrait');
 assert.equal(resolved.candidate.contentSha256,null);
 assert.equal(resolved.candidate.href.includes('shiny'),false);
});
test('native read-key validation refuses foreign, absent or invalid source fields',()=>{
 const row={read_key:'ABC',type:['rock'],normal_portrait_filename:'normal.png'};
 assert.throws(()=>resolveNormalFromFakemonRow(row,'not-ABC'),/read_key_mismatch/);
 assert.throws(()=>resolveNormalFromFakemonRow({...row,normal_portrait_filename:null},'ABC'),/normal_portrait_missing/);
 assert.throws(()=>resolveNormalFromFakemonRow({...row,normal_portrait_filename:'javascript:alert(1)'},'ABC'),/invalid_normal_source/);
 assert.throws(()=>resolveNormalFromFakemonRow({...row,type:[]},'ABC'),/invalid_native_types/);
});

test('late older revision cannot roll back a newly committed source',()=>{
 const cache=new ReferenceCache(new Map([[keyOf(id),sample(4,'d'.repeat(64))]]),{preHydrated:true});
 const result=cache.success(sample(3,'a'.repeat(64)));
 assert.equal(result.changed,false);
 assert.equal(result.rejected,'stale-or-conflicting-revision');
 assert.equal(cache.peek(id).normalSource.contentSha256,'d'.repeat(64));
 assert.equal(cache.stats.updateEventsPublished,0);
});

test('new normal URL with verified identical source hash updates metadata, not decision',()=>{
 const cache=new ReferenceCache(new Map([[keyOf(id),sample()]]),{preHydrated:true});
 const newer={...sample(2),normalSource:{...sample().normalSource,href:'https://example.invalid/new-host.png'}};
 assert.equal(cache.success(newer).changed,false);
 assert.equal(cache.peek(id).normalSource.href,'https://example.invalid/new-host.png');
 assert.equal(cache.peek(id).analysisRevision,1);
 assert.equal(cache.stats.updateEventsPublished,0);
});
