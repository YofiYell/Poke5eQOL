"""Snapshot outputs actually computed by the byte-verified scanner (no approximations)."""
from pathlib import Path
from PIL import Image
import sys, json, hashlib, PIL, numpy, scipy, platform
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'reference'))
import importlib.util
spec=importlib.util.spec_from_file_location("scanner_v1",ROOT/"reference"/"Poke5e_Offline_Color_Scanner_v1.0.0.py")
scanner=importlib.util.module_from_spec(spec); spec.loader.exec_module(scanner)
from geometry_reference import inspect_rgba

manifest=json.loads((ROOT/"fixtures/synthetic_manifest.json").read_text())
records=[]
for item in manifest['fixtures']:
    p=ROOT/"fixtures"/item['file']
    assert hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256']
    with Image.open(p) as im:
        geometry=inspect_rgba(im)
    geometry.pop('packedMask',None)
    try:
        cm=scanner.colors(p,scanner.CONFIG)
        result=scanner.decide({**cm,'primary_type':item['primary_type'],'secondary_type':item['secondary_type']},scanner.CONFIG)
        scan={'status':'ok','colors':cm,'decision':result}
    except Exception as e:
        scan={'status':'error','errorType':type(e).__name__,'error':str(e)}
    records.append({'name':item['name'],'sha256':item['sha256'],'imageBytes':item['bytes'],
                    'dimensions':item['dimensions'],'scan':scan,'geometry':geometry})
expected={'kind':'executed-python-reference-not-browser-parity',
          'scannerVersion':scanner.CONFIG['version'],
          'scannerSha256':hashlib.sha256((ROOT/"reference"/"Poke5e_Offline_Color_Scanner_v1.0.0.py").read_bytes()).hexdigest(),
          'runtime':{'python':platform.python_version(),'pillow':PIL.__version__,'numpy':numpy.__version__,'scipy':scipy.__version__},
          'fixtureCount':len(records),'results':records}
output=ROOT/'fixtures/expected/python_reference_results.json'
output.write_text(json.dumps(expected,indent=2,sort_keys=True)+'\n')
print('snapshotted',len(records),'fixtures; successful scans',sum(r['scan']['status']=='ok' for r in records),
      'geometry reliable',sum(r['geometry']['reliable'] for r in records))
for r in records:
 c=r['scan'].get('colors',{})
 print(r['name'],r['scan']['status'], c.get('average_color'),c.get('dominant_color'),r['scan'].get('decision',{}).get('selected_banner_type'),r['geometry']['status'])
