/* Offline real-bundle startup with mocked network and unavailable IndexedDB.
 * NOT a browser IndexedDB persistence test; verifies the actual installable script
 * without QOL/Theme/Species Card and without a source from displayed artwork. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');const script=fs.readFileSync(path.join(root,'Poke5e Artwork Intelligence.js'),'utf8');
const png=fs.readFileSync(path.join(root,'artwork-intelligence/fixtures/real/BWMC6BSH0WZDR_normal.png'));
const species='BWMC6BSH0WZDR',image='https://poke5e.auroratide.cloud/a79eff8c-4872-4b75-9b45-c7cb73cf4f55.png';
function create(){const eventLog=[],fetchLog=[],listeners={};
  const win={addEventListener(name,fn){(listeners[name]??=[]).push(fn);}};
  const document={readyState:'complete',addEventListener(){},dispatchEvent(event){eventLog.push({type:event.type,detail:event.detail});return true;}};
  const location={pathname:'/fakemon',search:'?id='+species,href:'https://poke5e.app/fakemon?id='+species};
  const history={pushState(){},replaceState(){}};
  const response={read_key:species,type:['rock','steel'],normal_portrait_filename:'a79eff8c-4872-4b75-9b45-c7cb73cf4f55.png',shiny_portrait_filename:'NEVER_SCAN_SHINY.png'};
  const fetch=async(url,opts)=>{fetchLog.push(String(url));if(String(url).includes('get_fakemon'))return new Response(JSON.stringify(response),{status:200,headers:{'content-type':'application/json'}});
    if(String(url)===image)return new Response(png,{status:200,headers:{'content-type':'image/png'}});throw Error('unexpected_network_target');};
  const storage=new Map();const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
  class CE{constructor(type,options){this.type=type;this.detail=options.detail;}}
  const scope={window:win,document,history,location,fetch,localStorage,CustomEvent:CE,Blob,URL,Response,TextEncoder,TextDecoder,DecompressionStream,
    Uint8Array,Int8Array,Int32Array,Float64Array,Uint32Array,ArrayBuffer,AbortController,Math,Number,Array,Object,Set,Map,Promise,Error,
    performance,structuredClone,crypto:crypto.webcrypto,setTimeout,clearTimeout,queueMicrotask,console};
  scope.globalThis=scope;vm.createContext(scope);return {scope,win,fetchLog,eventLog,storage};
}
async function until(predicate,max=10000){const end=Date.now()+max;while(Date.now()<end){if(await predicate())return;await new Promise(r=>setTimeout(r,30));}throw Error('timeout');}
test('standalone userscript, source bytes, normal-only acquisition, no duplicate scan on same route',async()=>{
  const host=create();vm.runInContext(script,host.scope,{timeout:4000});const api=host.win.__yofiArtworkIntelligence;
  assert.equal(api.apiVersion,1);assert.equal(api.moduleVersion,'0.1.0');
  await api.whenReady();assert.equal(api.diagnostics().db.state,'unavailable');
  try{await until(()=>api.status('fakemon',species).state==='ready',5000);}catch(e){console.log('FAILED_DIAG',JSON.stringify(api.diagnostics()),JSON.stringify(await api.inspect('fakemon',species)),host.fetchLog);throw e;}
  const output=await api.inspect('fakemon',species),snapshot=await api.lookup('fakemon',species);
  assert.equal(output.selectedBannerType,'rock');assert.equal(output.selectedTintType,'steel');
  assert.equal(output.normalSourceSha256,'0749aa41cc2250c67884ad4a33082566f379756530ce1724798a6c035d470bc6');
  assert.equal(output.geometry.maskSha256,'3a2a9bc555888d03caa2044f23ae9685c44dff349ae300bca22c62e5ff244ee1');
  assert.equal(snapshot.cacheSource,'memory');assert.equal(host.fetchLog.filter(x=>x===image).length,1);
  assert.equal(host.fetchLog.length,2);assert.equal(api.diagnostics().counters.scansCompleted,1);
  const mask=await api.silhouette('fakemon',species);assert.equal(mask.bytes.length,65702);
  assert.equal(api.decodeSilhouette(mask).hasPixel(360,360),true);
  const startCounters=api.diagnostics().counters;
  for(let i=0;i<5;i++){api.peek('fakemon',species);await api.lookup('fakemon',species);await api.inspect('fakemon',species);api.diagnostics();}
  assert.deepEqual(api.diagnostics().counters,startCounters);
  assert.equal(host.eventLog.filter(x=>x.type==='yofi:artwork-intelligence:updated').length,1);
  const copy=await api.lookup('fakemon',species);copy.color.stats.average_color='#000000';
  assert.equal((await api.lookup('fakemon',species)).color.stats.average_color,'#8A6A66');
  host.scope.location.pathname='/pokemon';host.scope.location.href='https://poke5e.app/pokemon/ekans';host.scope.history.pushState({});
  await new Promise(resolve=>setTimeout(resolve,0));assert.equal(api.currentContext(),null);
  host.scope.location.pathname='/fakemon';host.scope.location.href='https://poke5e.app/fakemon?id='+species;host.scope.history.pushState({});
  await new Promise(resolve=>setTimeout(resolve,10));assert.equal(host.fetchLog.length,2,'Revisiting unchanged species cannot fetch again');
  assert.equal(api.diagnostics().counters.cacheHits,0,'No active UI consumer: no synthetic cache hits');
  // repeated installation cannot create second coordinator or re-fetch
  vm.runInContext(script,host.scope,{timeout:4000});assert.equal(host.win.__yofiArtworkIntelligence,api);
  assert.equal(host.fetchLog.length,2);
  assert.equal(api.lastGoodDecision('fakemon',species).validatedFresh,false);
});
