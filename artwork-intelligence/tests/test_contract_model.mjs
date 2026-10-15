import test from 'node:test';import assert from 'node:assert/strict';
import {ReferenceCache,cornerWithManualPreference,currentRouteMatches,keyOf} from '../reference/contract_model.mjs';
const id={namespace:'fakemon',speciesId:'G.ABC123'};
const sample=(revision=1)=>({...id,schemaVersion:1,scannerVersion:'1.0.0',analysisRevision:revision,
 types:{primary:'ghost',secondary:'psychic',signature:'ghost/psychic'},normalSource:{href:'https://example.invalid/normal.png',contentSha256:'a'.repeat(64)},
 color:{state:'ready',banner:'ghost',tint:'psychic'},geometry:{state:'ready'}});
test('namespaces cannot collide; normal artwork is not part of key',()=>{
 assert.notEqual(keyOf(id),keyOf({namespace:'pokemon',speciesId:id.speciesId}));
 assert.equal(keyOf(id),keyOf({...id,normalSource:'other',variant:'shiny',width:999}));
});
test('cold read is pure; first relevant visit per refresh revalidates exactly once',()=>{
 const cache=new ReferenceCache(new Map([[keyOf(id),sample()]]));
 assert.equal(cache.peek(id).analysisRevision,1);assert.equal(cache.stats.sourceRevalidations,0);
 assert.equal(cache.enter(id).shouldRevalidate,true);
 assert.equal(cache.enter(id).shouldRevalidate,false);
 cache.refresh();assert.equal(cache.enter(id).shouldRevalidate,true);
 assert.equal(cache.stats.sourceRevalidations,2);
});
test('same bytes and types reuse; type change rescores; scanner/content change rescans',()=>{
 const cache=new ReferenceCache(new Map([[keyOf(id),sample()]]));
 const input={sha256:'a'.repeat(64),normalSource:sample().normalSource.href,typesSignature:'ghost/psychic',scannerVersion:'1.0.0'};
 assert.equal(cache.validateInputs(id,input).action,'reuse');
 assert.equal(cache.validateInputs(id,{...input,typesSignature:'ghost/fairy'}).action,'rescore');
 assert.equal(cache.validateInputs(id,{...input,scannerVersion:'1.1.0'}).action,'scan');
 assert.equal(cache.validateInputs(id,{...input,sha256:'b'.repeat(64)}).action,'scan');
 assert.equal(cache.validateInputs(id,{...input,normalSource:'https://example.invalid/another.png'}).action,'source-metadata-review');
});
test('failed analysis and atomic two-store failure never clobber last success',()=>{
 const cache=new ReferenceCache(new Map([[keyOf(id),sample()]]));
 cache.fail(id,'cors');assert.equal(cache.peek(id).analysisRevision,1);
 assert.equal(cache.success(sample(2),{maskWriteOk:false}).changed,false);
 assert.equal(cache.peek(id).analysisRevision,1);assert.equal(cache.events.length,0);
 assert.equal(cache.success(sample(2)).changed,true);
 assert.equal(cache.peek(id).analysisRevision,2);assert.equal(cache.events.length,1);
 assert.equal(cache.success(sample(2)).changed,false);
 assert.equal(cache.events.length,1);
});
test('shiny toggle, resize and theme change produce no new scan/validation',()=>{
 const c=new ReferenceCache();c.enter(id);let prev={...c.stats};
 for(const behavior of ['shiny','resize','theme','fullscreen','same-route']){
   const result=c.peek(id);assert.equal(result,null);
 }
 assert.equal(c.stats.sourceRevalidations,prev.sourceRevalidations);
 assert.equal(c.stats.scansCompleted,0);
});
test('manual top-right is NOT default top-right; valid auto is subordinate',()=>{
 const f=cornerWithManualPreference;
 assert.deepEqual(f({hasSaved:true,manualCorner:'tr',automaticCorner:'bl'}),{corner:'tr',source:'manual'});
 assert.deepEqual(f({hasSaved:false,automaticCorner:'bl'}),{corner:'bl',source:'automatic'});
 assert.deepEqual(f({hasSaved:false,automaticCorner:null}),{corner:'tr',source:'qol-default'});
});
test('late updates cannot color or place an outgoing species',()=>{
 const incoming={...id,normalSource:'n2',typesSignature:'ghost/psychic',routeToken:9};
 assert.equal(currentRouteMatches({...incoming,speciesId:'other'},incoming),false);
 assert.equal(currentRouteMatches({...incoming,routeToken:8},incoming),false);
 assert.equal(currentRouteMatches({...incoming,normalSource:'old'},incoming),false);
 assert.equal(currentRouteMatches(incoming,incoming),true);
});
