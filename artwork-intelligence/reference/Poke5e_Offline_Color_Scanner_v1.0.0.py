#!/usr/bin/env python3
"""Offline full-resolution color scanner. Stable input manifest; no DOM/canvas access."""
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS','1');os.environ.setdefault('OMP_NUM_THREADS','1')
import argparse,csv,json,pathlib,hashlib,urllib.request,time,collections,concurrent.futures
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt,binary_propagation
ROOT=pathlib.Path(__file__).resolve().parent
TYPE_COLORS={'normal':'#A1A1A1','fire':'#D43A30','fighting':'#F08833','water':'#4C79BC','flying':'#8FB8E4','grass':'#5D9D3C','poison':'#6D4B97','electric':'#F2C341','ground':'#895229','psychic':'#DC4D79','rock':'#ADA984','ice':'#78CCF0','bug':'#95A135','dragon':'#4C60A9','ghost':'#6B426E','dark':'#4E403F','steel':'#74A2B9','fairy':'#BA7FB5'}
CONFIG={'average_weight':.5,'dominant_weight':.5,'alpha_threshold':128,'clusters':8,'outline_weight':.25,'edge_weight':.5,'incidental_white_weight':.7,'delta_e':'CIE76','version':'1.0.0'}
def rgb(h):return np.array([int(h[i:i+2],16) for i in (1,3,5)],float)
def hexcolor(c):return '#'+''.join(f'{int(v):02X}' for v in np.clip(np.rint(c),0,255))
def lab(c):
 v=np.asarray(c,float)/255;v=np.where(v>.04045,((v+.055)/1.055)**2.4,v/12.92)
 xyz=v@np.array([[.4124564,.2126729,.0193339],[.3575761,.7151522,.1191920],[.1804375,.0721750,.9503041]])/np.array([.95047,1,1.08883]);f=np.where(xyz>216/24389,np.cbrt(xyz),(24389/27*xyz+16)/116)
 return np.stack([116*f[...,1]-16,500*(f[...,0]-f[...,1]),200*(f[...,1]-f[...,2])],-1)
def colors(path,cfg):
 with Image.open(path) as im:
  if im.format not in ('PNG','JPEG','WEBP','GIF','TIFF'):raise ValueError('unsupported_image_format:'+str(im.format))
  fmt=im.format;a=np.array(im.convert('RGBA'));size=im.size
 alpha=a[:,:,3]/255.;rgbfull=a[:,:,:3].astype(float);mask=a[:,:,3]>=cfg['alpha_threshold'];background=0
 # Only remove a solid corner-consensus color connected to the border. Never remove interior white/black.
 if np.all(a[:,:,3]>=cfg['alpha_threshold']):
  corners=rgbfull[[0,0,-1,-1],[0,-1,0,-1]];bg=np.median(corners,axis=0)
  if np.max(np.linalg.norm(corners-bg,axis=1))<8:
   candidate=np.linalg.norm(rgbfull-bg,axis=2)<10;seed=np.zeros_like(mask);seed[0]=candidate[0];seed[-1]=candidate[-1];seed[:,0]=candidate[:,0];seed[:,-1]=candidate[:,-1]
   removed=binary_propagation(seed,mask=candidate);background=int(removed.sum());mask &= ~removed
 if mask.sum()<50:raise ValueError('too_few_visible_pixels')
 dist=distance_transform_edt(np.pad(mask,1))[1:-1,1:-1][mask];c=rgbfull[mask];al=alpha[mask];labs=lab(c);ch=np.linalg.norm(labs[:,1:],axis=1)
 dark=(labs[:,0]<20)&(ch<18);white=(labs[:,0]>94)&(ch<10)
 w=al.copy();edge=dist<=2;w[edge]*=cfg['edge_weight']
 # Large dark surfaces survive at full interior weight. Incidental dark outlines are downweighted.
 outline=dark & ((dist<=3) | (np.average(dark,weights=al)<.18));w[outline]*=cfg['outline_weight']
 if np.average(white,weights=al)<.12:w[white]*=cfg['incidental_white_weight']
 raw=np.average(c,axis=0,weights=al);avg=np.average(c,axis=0,weights=w)
 # Weighted Lab k-means on aggregated RGB bins, retaining exact RGB centroids and all pixel mass.
 bins=(c.astype(int)//16);code=bins[:,0]*256+bins[:,1]*16+bins[:,2];ids,inv=np.unique(code,return_inverse=True);mass=np.bincount(inv,weights=w);means=np.stack([np.bincount(inv,weights=w*c[:,j])/mass for j in range(3)],1);points=lab(means)
 k=min(cfg['clusters'],len(points));centers=[points[np.argmax(mass)]]
 for _ in range(k-1):
  d=np.min(np.sum((points[:,None]-np.array(centers)[None])**2,axis=2),axis=1);centers.append(points[np.argmax(d*np.sqrt(mass))])
 centers=np.array(centers)
 for _ in range(35):
  labels=np.argmin(np.sum((points[:,None]-centers[None])**2,axis=2),axis=1);new=centers.copy()
  for j in range(k):
   idx=labels==j
   if idx.any():new[j]=np.average(points[idx],axis=0,weights=mass[idx])
  if np.max(np.abs(new-centers))<.02:break
  centers=new
 clusters=[]
 for j in range(k):
  idx=labels==j
  if idx.any():clusters.append({'hex':hexcolor(np.average(means[idx],axis=0,weights=mass[idx])),'coverage':round(float(mass[idx].sum()/mass.sum()),6)})
 clusters.sort(key=lambda x:x['coverage'],reverse=True)
 return dict(average_color=hexcolor(avg),raw_alpha_average_color=hexcolor(raw),dominant_color=clusters[0]['hex'],dominant_coverage=clusters[0]['coverage'],clusters=clusters,visible_pixels=int(mask.sum()),background_pixels_removed=background,outline_pixels_discounted=int(outline.sum()),near_black_body_fraction=round(float(np.average(dark,weights=al)),6),near_white_body_fraction=round(float(np.average(white,weights=al)),6),image_width=size[0],image_height=size[1],image_format=fmt)
def decide(r,cfg):
 ts=[r['primary_type']]+([r['secondary_type']] if r['secondary_type'] else []);refs=np.array([lab(rgb(TYPE_COLORS[t])) for t in ts]);a=np.linalg.norm(refs-lab(rgb(r['average_color'])),axis=1);d=np.linalg.norm(refs-lab(rgb(r['dominant_color'])),axis=1);scores=(cfg['average_weight']*a+cfg['dominant_weight']*d)/(cfg['average_weight']+cfg['dominant_weight']);winner=int(np.argmin(scores))
 out=dict(primary_type_color=TYPE_COLORS[ts[0]],secondary_type_color=TYPE_COLORS[ts[1]] if len(ts)==2 else '',delta_e_average_primary=round(float(a[0]),6),delta_e_dominant_primary=round(float(d[0]),6),combined_score_primary=round(float(scores[0]),6),selected_banner_type=ts[winner],selected_tint_type=ts[1-winner] if len(ts)==2 else '',average_match=ts[int(np.argmin(a))],dominant_match=ts[int(np.argmin(d))],metrics_disagree=bool(np.argmin(a)!=np.argmin(d)),confidence_margin=round(float(abs(scores[0]-scores[1])),6) if len(ts)==2 else None,tint_strength=.36,banner_type_strength=.85,banner_black_strength=.15,top_header_types=ts,description_type=ts[0])
 if len(ts)==2:out.update(delta_e_average_secondary=round(float(a[1]),6),delta_e_dominant_secondary=round(float(d[1]),6),combined_score_secondary=round(float(scores[1]),6))
 return out

def ensure_artworks(rows,refresh=False):
 assets={};existing_hashes={}
 for r in rows:
  p=ROOT/r['artwork_path'] if r.get('artwork_path') else None
  if p and p.exists() and p not in existing_hashes:
   blob=p.read_bytes();h=hashlib.sha1(b'blob '+str(len(blob)).encode()+b'\0'+blob).hexdigest();existing_hashes[p]=h;assets[h]=p
 todo={r['artwork_path']:r for r in rows if r['discovery_status']=='available' and r.get('artwork_path')};results={}
 def get(kv):
  rel,r=kv;p=ROOT/rel;p.parent.mkdir(parents=True,exist_ok=True)
  if p.exists() and not refresh and (not r.get('git_blob_sha') or existing_hashes.get(p)==r['git_blob_sha']):return rel,{'status':'cached'}
  alias=assets.get(r.get('git_blob_sha'))
  if alias and alias.exists() and not refresh:
   if p!=alias:
    if p.exists():p.unlink()
    os.link(alias,p)
   return rel,{'status':'cached_git_blob_alias','alias':str(alias.relative_to(ROOT))}
  for attempt in range(3):
   try:
    req=urllib.request.Request(r['source_artwork_url'],headers={'User-Agent':'Poke5eArtworkScanner/1.0'})
    with urllib.request.urlopen(req,timeout=40) as response:b=response.read()
    expected=r.get('git_blob_sha')
    if expected and hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()!=expected:raise ValueError('git_blob_checksum_mismatch')
    temporary=p.with_suffix('.download.tmp');temporary.write_bytes(b);temporary.replace(p);return rel,{'status':'downloaded'}
   except Exception as e:err=str(e);time.sleep(.3*(attempt+1))
  return rel,{'status':'download_failed','reason':err}
 with concurrent.futures.ThreadPoolExecutor(max_workers=16) as ex:
  for i,(rel,res) in enumerate(ex.map(get,todo.items())):
   results[rel]=res
   if (i+1)%100==0:print('Resolved artwork files',i+1,'/',len(todo),flush=True)
 (ROOT/'cache/resolved_downloads.json').write_text(json.dumps(results,indent=2));return results

def process(args):
 r,cfg,download=args;r=dict(r)
 if r['discovery_status']=='missing_artwork':r.update(status='missing_artwork',failure_reason='No distinct normal official-artwork file in frozen repository inventory');return r
 path=ROOT/r['artwork_path']
 if not path.exists():r.update(status='download_failed',failure_reason=download.get(r['artwork_path'],{}).get('reason','No local artwork'));return r
 b=path.read_bytes();sha=hashlib.sha256(b).hexdigest();r.update(artwork_sha256=sha,artwork_bytes=len(b),download_status=download.get(r['artwork_path'],{}).get('status','cached'))
 expected_blob=r.get('git_blob_sha')
 if expected_blob and hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()!=expected_blob:
  r.update(status='analysis_failed',failure_reason='Cached artwork differs from native source blob; rerun without --offline to refresh changed files');return r
 cachekey=hashlib.sha256((sha+json.dumps(cfg,sort_keys=True)).encode()).hexdigest();cp=ROOT/'cache'/('metrics-'+cachekey+'.json')
 try:
  m=json.loads(cp.read_text()) if cp.exists() else colors(path,cfg)
  if not cp.exists():cp.write_text(json.dumps(m))
  r.update(m)
  if any(t and t not in TYPE_COLORS for t in [r['primary_type'],r['secondary_type']]):raise ValueError('unsupported_type:'+r['primary_type'])
  r.update(decide(r,cfg));r.update(status='ok',failure_reason='')
 except Exception as e:r.update(status='unsupported_image_format' if 'unsupported_image_format' in str(e) else 'analysis_failed',failure_reason=str(e))
 return r

def write_csv(path,rows):
 keys=list(dict.fromkeys(k for r in rows for k in r)) or ['record_key','status','failure_reason']
 with path.open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=keys);w.writeheader();w.writerows({k:json.dumps(v,ensure_ascii=False) if isinstance(v,(dict,list)) else v for k,v in r.items()} for r in rows)

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--manifest',default='input/manifest.json');ap.add_argument('--offline',action='store_true');ap.add_argument('--refresh-artwork',action='store_true');ap.add_argument('--average-weight',type=float,default=.5);ap.add_argument('--dominant-weight',type=float,default=.5);ap.add_argument('--workers',type=int,default=6);args=ap.parse_args();cfg=dict(CONFIG,average_weight=args.average_weight,dominant_weight=args.dominant_weight)
 if min(args.average_weight,args.dominant_weight)<0 or args.average_weight+args.dominant_weight<=0:ap.error('weights must be nonnegative with positive sum')
 rows=json.load((ROOT/args.manifest).open());download={} if args.offline else ensure_artworks(rows,args.refresh_artwork);result=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as ex:
  for i,r in enumerate(ex.map(process,[(r,cfg,download) for r in rows],chunksize=5)):
   result.append(r)
   if (i+1)%100==0:print('Pixel analyzed records',i+1,'/',len(rows),flush=True)
 ok=[r for r in result if r['status']=='ok'];dual=[r for r in ok if r['secondary_type']];combos={tuple(sorted([r['primary_type'],r['secondary_type']])) for r in dual}
 summary={'total_entries_discovered':len(rows),'distinct_species':len({r['species_id'] for r in rows}),'dual_type_entries_discovered':sum(bool(r['secondary_type']) for r in rows),'successful_artwork_records':sum(bool(r.get('artwork_sha256')) for r in result),'successful_artwork_downloads':len({r['artwork_path'] for r in result if r.get('artwork_sha256')}),'unique_artwork_content_hashes':len({r['artwork_sha256'] for r in result if r.get('artwork_sha256')}),'successful_pixel_analyses':sum('average_color' in r for r in result),'successful_decision_records':len(ok),'successful_dual_type_analyses':len(dual),'failed_downloads':sum(r['status']=='download_failed' for r in result),'unsupported_image_formats':sum(r['status']=='unsupported_image_format' for r in result),'missing_artwork':sum(r['status']=='missing_artwork' for r in result),'analysis_failures':sum(r['status']=='analysis_failed' for r in result),'analyzed_dual_type_combinations':len(combos),'excluded_fakemon':12,'shiny_artwork':'excluded by user request','status_counts':dict(collections.Counter(r['status'] for r in result)),'by_source':{s:{'discovered':sum(r['source']==s for r in result),'successful':sum(r['source']==s for r in ok),'dual_discovered':sum(r['source']==s and bool(r['secondary_type']) for r in result),'dual_successful':sum(r['source']==s for r in dual)} for s in sorted({r['source'] for r in result})}}
 (ROOT/'full_analysis.json').write_text(json.dumps({'stability':'Working','config':cfg,'type_colors':TYPE_COLORS,'summary':summary,'records':result},ensure_ascii=False,indent=2));write_csv(ROOT/'full_analysis.csv',result);write_csv(ROOT/'failure_report.csv',[r for r in result if r['status']!='ok']);(ROOT/'coverage.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary,indent=2),flush=True)
if __name__=='__main__':main()