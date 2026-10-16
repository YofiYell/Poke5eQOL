"""Actual Chromium test of the exact userscript API in an opaque origin.
IndexedDB is unavailable on about:blank; this is NOT an IDB persistence test.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
r=Path(__file__).resolve().parents[2]
script=(r/'Poke5e Artwork Intelligence.js').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page();page.set_content('<html><body><img src="https://example.test/shiny-do-not-use.png"></body></html>')
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_script_tag(content=script)
 state=page.evaluate('''async()=>{const a=window.__yofiArtworkIntelligence;await a.whenReady();return {diag:a.diagnostics(),methods:['peek','lookup','status','source','silhouette','decodeSilhouette','recommendCorner','inspect','diagnostics','whenReady'].map(k=>typeof a[k]),context:a.currentContext()};}''')
 assert not errors,errors
 assert state['diag']['apiVersion']==1
 assert state['diag']['db']['state']=='unavailable'
 assert all(k=='function' for k in state['methods'])
 assert state['diag']['counters']['sourceRevalidations']==0
 page.add_script_tag(content=script)
 assert page.evaluate('window.__yofiArtworkIntelligence.diagnostics().counters.sourceRevalidations')==0
 assert not errors,errors
 print('Chromium standalone bootstrap & duplicate-init protection: PASS; IDB opaque-origin unavailable as expected')
 browser.close()
