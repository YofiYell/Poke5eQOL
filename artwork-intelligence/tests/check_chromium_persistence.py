#!/usr/bin/env python3
"""ART-02-R01 browser acceptance: real IndexedDB and mocked native network.
This must be run in an unrestricted desktop Chromium browser context with
localhost navigation permitted. Not executed in the ChatGPT container, whose
browser policy blocks navigating to localhost or the live Poké5e application.
Run: python3 artwork-intelligence/tests/check_chromium_persistence.py
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
import json
r=Path(__file__).resolve().parents[2]
js=(r/'Poke5e Artwork Intelligence.js').read_text()
png=(r/'artwork-intelligence/fixtures/real/BWMC6BSH0WZDR_normal.png').read_bytes()
key='BWMC6BSH0WZDR'
source='https://poke5e.auroratide.cloud/a79eff8c-4872-4b75-9b45-c7cb73cf4f55.png'
row={'read_key':key,'type':['rock','steel'],'normal_portrait_filename':'a79eff8c-4872-4b75-9b45-c7cb73cf4f55.png','shiny_portrait_filename':'NEVER_SCAN_SHINY.png'}
class Handler(BaseHTTPRequestHandler):
 def do_GET(self):
  b=b'<html><body><h1>Offline Fakemon fixture</h1><p>Rendered shiny can never drive analysis.</p></body></html>'
  self.send_response(200);self.send_header('Content-Type','text/html');self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b)
 def log_message(self,*_):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
thread=Thread(target=server.serve_forever,daemon=True);thread.start()
base=f'http://127.0.0.1:{server.server_port}'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  context=browser.new_context();page=context.new_page();errors=[];requests=[];fail_image=False
  page.on('pageerror',lambda e:errors.append(str(e)))
  def rpc(route):
   requests.append(route.request.url)
   route.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*','access-control-allow-headers':'*'},body=json.dumps(row))
  def image(route):
   requests.append(route.request.url)
   if fail_image:route.abort('failed')
   else:route.fulfill(status=200,content_type='image/png',headers={'access-control-allow-origin':'*'},body=png)
  page.route('https://api.poke5e.app/rest/v1/rpc/get_fakemon',rpc)
  page.route(source,image)
  url=base+'/fakemon?id='+key
  def load():
   page.goto(url);page.add_script_tag(content=js)
   page.wait_for_function("window.__yofiArtworkIntelligence?.status('fakemon','BWMC6BSH0WZDR').state in ['ready','error']",timeout=90000)
   return page.evaluate("async()=>{const a=window.__yofiArtworkIntelligence;return {diag:a.diagnostics(),record:await a.inspect('fakemon','BWMC6BSH0WZDR'),mask:await a.silhouette('fakemon','BWMC6BSH0WZDR')}}")
  first=load()
  assert first['record']['recordState']=='ready',first['record'].get('lastFailure')
  assert first['diag']['db']['state']=='ready',first['diag']
  assert first['record']['selectedBannerType']=='rock'
  assert first['record']['geometry']['maskSha256']=='3a2a9bc555888d03caa2044f23ae9685c44dff349ae300bca22c62e5ff244ee1'
  assert first['record']['cacheSource']=='persisted',first['record']
  assert not any('shiny' in x.lower() for x in requests),requests
  assert not errors,errors
  second=load()
  assert second['record']['recordState']=='ready'
  assert second['diag']['counters']['scansCompleted']==0,second['diag']
  assert second['diag']['counters']['idbHydrations']>=1,second['diag']
  assert second['diag']['counters']['sourceRevalidations']==1
  assert second['diag']['counters']['updateEventsPublished']==0
  fail_image=True
  third=load()
  assert third['record']['recordState']=='error'
  assert third['record']['normalSourceSha256']==first['record']['normalSourceSha256']
  assert third['mask']['maskSha256']==first['mask']['maskSha256']
  assert third['diag']['counters']['updateEventsPublished']==0
  assert not errors,errors
  print('PASS: native-style acquisition, worker/Canvas parity, real IndexedDB hydration/revalidation, last-good retention, source exclusivity and no spurious events')
  browser.close()
finally:server.shutdown();server.server_close()
