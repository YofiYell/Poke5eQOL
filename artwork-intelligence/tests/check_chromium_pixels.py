#!/usr/bin/env python3
"""Browser decode and worker algorithm parity in an offline about:blank Chromium page.
Navigation/IndexedDB are not exercised because this environment blocks document navigations.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import base64,hashlib,json,time
r=Path(__file__).resolve().parents[2]
png=(r/'artwork-intelligence/fixtures/real/BWMC6BSH0WZDR_normal.png').read_bytes()
py_rgba=(r/'tmp-real-rgba.bin').read_bytes()
core=(r/'artwork-intelligence/src/core.js').read_text()
geom=(r/'artwork-intelligence/src/geometry.js').read_text()
png_src=(r/'artwork-intelligence/src/png.js').read_text()
service=(r/'artwork-intelligence/src/service.js').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page();page.set_content('<html></html>')
 page.add_script_tag(content=core+'\n'+geom+'\n'+png_src+'\n'+service)
 stats=page.evaluate('''async (encoded) => {
    const start=performance.now(),bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
    const decode=await artDecodeBytes(bytes,'PNG');const decodeMs=performance.now()-start;
    const pixelSha=artSha256Sync(decode.rgba);
    const scanAt=performance.now(),color=artColors(decode.rgba,decode.width,decode.height,'PNG');
    const colorMs=performance.now()-scanAt;
    const geoAt=performance.now(),geo=artGeometry(decode.rgba,decode.width,decode.height);
    const geometryMs=performance.now()-geoAt;
    const maskSha=artSha256Sync(geo.packedMask);
    return {decodeMs,colorMs,geometryMs,decodeMode:decode.decodeMode,
       pixelSha,rgbaSample:[...decode.rgba.slice(0,24)],stats:color,maskSha};
  }''',base64.b64encode(png).decode('ascii'))
 ref=json.loads((r/'artwork-intelligence/fixtures/real/BWMC6BSH0WZDR_python_reference.json').read_text())
 expected_hash=hashlib.sha256(py_rgba).hexdigest()
 print(json.dumps({k:v for k,v in stats.items() if k!='stats'},indent=2))
 print('Pillow decoded RGBA SHA',expected_hash,'Chromium decoded SHA',stats['pixelSha'])
 print('color dict exact',stats['stats']==ref['colors'])
 assert stats['maskSha']==ref['geometry']['maskSha256']
 assert stats['pixelSha']==expected_hash, 'Browser decoded RGBA differs from Python'
 assert stats['stats']==ref['colors'], 'Browser scanner differs from Python'
 # Standalone Blob worker runs the exact deployed scanner source.
 worker_source=core+'\n'+geom+'''\nself.onmessage=e=>{const {rgba}=e.data;const a=performance.now(),color=artColors(new Uint8Array(rgba),722,722,'PNG');const g=artGeometry(new Uint8Array(rgba),722,722);self.postMessage({color,maskSha:null,geom:{state:g.state,occupied:g.occupiedPixels}});};'''
 worker=page.evaluate('''async ([workerSource,encoded])=>{
   const blob=new Blob([workerSource],{type:'text/javascript'}),url=URL.createObjectURL(blob),worker=new Worker(url);
   const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));const decoded=await artDecodeBytes(bytes,'PNG');
   const result=await new Promise((resolve,reject)=>{worker.onmessage=e=>resolve(e.data);worker.onerror=e=>reject(e.message);worker.postMessage({rgba:decoded.rgba.buffer},[decoded.rgba.buffer]);});
   worker.terminate();URL.revokeObjectURL(url);return result;
 }''',[worker_source,base64.b64encode(png).decode('ascii')])
 print('Worker produced',worker['geom'],'color parity:',worker['color']==ref['colors'])
 assert worker['color']==ref['colors'], 'Worker scanner parity differs'
 # Confirm browser-native lossless PNG RGBA hashes on all original 16 fixture files.
 from PIL import Image
 manifest=json.loads((r/'artwork-intelligence/fixtures/synthetic_manifest.json').read_text())
 for item in manifest['fixtures']:
  name=item['name'];filename=r/'artwork-intelligence/fixtures'/item['file'];png_data=filename.read_bytes()
  expected=hashlib.sha256(Image.open(filename).convert('RGBA').tobytes()).hexdigest()
  actual=page.evaluate('''async (encoded)=>{const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));const out=await artDecodeBytes(bytes,'PNG');return artSha256Sync(out.rgba);}''',base64.b64encode(png_data).decode('ascii'))
  assert actual==expected,f'Canvas-independent RGBA hash mismatch: {name}'
 print('Synthetic browser RGBA parity: 16/16 exact')
 browser.close()
