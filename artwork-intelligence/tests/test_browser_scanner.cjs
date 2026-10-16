const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),art=require(path.join(root,'Poke5e Artwork Intelligence.js'));
const expected=JSON.parse(fs.readFileSync(path.join(root,'artwork-intelligence/fixtures/expected/python_reference_results.json')));const manifest=JSON.parse(fs.readFileSync(path.join(root,'artwork-intelligence/fixtures/synthetic_manifest.json')));
function rgbaFor(file){const p=spawnSync('python3',['-c',`from PIL import Image;import sys;im=Image.open(sys.argv[1]).convert('RGBA');sys.stdout.buffer.write(im.tobytes())`,file],{maxBuffer:20000000});if(p.status!==0)throw Error(p.stderr.toString());return new Uint8Array(p.stdout);}
function compare(actual,reference,prefix=''){for(const [key,value] of Object.entries(reference)){if(typeof value==='number'){assert.ok(Math.abs(actual[key]-value)<=1.01e-6,prefix+key+' '+actual[key]+' vs '+value);}else if(Array.isArray(value)){assert.deepEqual(actual[key],value,prefix+key);}else assert.deepEqual(actual[key],value,prefix+key);}}
const realDir=path.join(root,'artwork-intelligence/fixtures/real');
test('real rock/steel FULL Python colors() and decide()',()=>{const ref=JSON.parse(fs.readFileSync(path.join(realDir,'BWMC6BSH0WZDR_python_reference.json')));const png=fs.readFileSync(path.join(realDir,'BWMC6BSH0WZDR_normal.png'));assert.equal(crypto.createHash('sha256').update(png).digest('hex'),ref.fixture.sha256);
  const rgba=rgbaFor(path.join(realDir,'BWMC6BSH0WZDR_normal.png'));const colors=art.artColors(rgba,722,722,'PNG');const dec=art.artDecide(colors,'rock','steel');compare(colors,ref.colors,'colors.');compare(dec,ref.decision,'decision.');
  const geo=art.artGeometry(rgba,722,722);assert.equal(geo.state,'ready');assert.equal(geo.occupiedPixels,306042);assert.equal(geo.components,2);assert.equal(geo.holes,1);assert.deepEqual(geo.bounds,{left:3,top:0,right:722,bottom:690});assert.deepEqual(geo.visualBoundsAlpha128,{left:8,top:0,right:718,bottom:685});assert.equal(crypto.createHash('sha256').update(geo.packedMask).digest('hex'),'3a2a9bc555888d03caa2044f23ae9685c44dff349ae300bca22c62e5ff244ee1');
  const saved=fs.readFileSync(path.join(realDir,'BWMC6BSH0WZDR_mask_packed_msb_row_v1.bin'));assert.deepEqual(Buffer.from(geo.packedMask),saved);});
for(const fixture of expected.results){test('synthetic Python scanner parity: '+fixture.name,()=>{
  const filename=path.join(root,'artwork-intelligence/fixtures/synthetic/'+fixture.name+'.png');const rgba=rgbaFor(filename),w=fixture.dimensions[0],h=fixture.dimensions[1];
  if(fixture.scan.status!=='ok') {assert.throws(()=>art.artColors(rgba,w,h,'PNG'),/too_few_visible_pixels/);return;}
  const stats=art.artColors(rgba,w,h,'PNG'),decision=art.artDecide(stats,fixture.primary_type||expected.results.find(x=>x.name===fixture.name)?.primary_type||'normal',fixture.secondary_type||null);
  compare(stats,fixture.scan.colors,fixture.name+'.');
  const m=manifest.fixtures.find(x=>x.name===fixture.name);compare(art.artDecide(stats,m.primary_type,m.secondary_type),fixture.scan.decision,fixture.name+'.decision.');
});}
