// ==UserScript==
// @name         Artwork Intelligence [v0.1.0]
// @namespace    https://poke5e.app/yofi/artwork-intelligence
// @version      0.1.0
// @description  Independent normal Fakemon artwork analysis, exact silhouettes, persistent metadata and diagnostics.
// @match        https://poke5e.app/*
// @match        https://www.poke5e.app/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

;(function(){
"use strict";
/* ART-02-R01 core: standalone, dependency-free browser/Node image mathematics.
 * Python oracle SHA256 f6ac6e346e2e93b2c05110ebe286c8e37d2120b9d035d9ce1766e536d133f1cd
 * No image downsampling. Coordinates are full source-resolution pixels. */
const ART_TYPES=Object.freeze({normal:'#A1A1A1',fire:'#D43A30',fighting:'#F08833',water:'#4C79BC',flying:'#8FB8E4',grass:'#5D9D3C',poison:'#6D4B97',electric:'#F2C341',ground:'#895229',psychic:'#DC4D79',rock:'#ADA984',ice:'#78CCF0',bug:'#95A135',dragon:'#4C60A9',ghost:'#6B426E',dark:'#4E403F',steel:'#74A2B9',fairy:'#BA7FB5'});
const ART_CONFIG=Object.freeze({average_weight:.5,dominant_weight:.5,alpha_threshold:128,clusters:8,outline_weight:.25,edge_weight:.5,incidental_white_weight:.7,delta_e:'CIE76',version:'1.0.0'});
const ART_REFERENCE_SHA='f6ac6e346e2e93b2c05110ebe286c8e37d2120b9d035d9ce1766e536d133f1cd';
function artRound(value,places=0){const multiplier=10**places;const n=value*multiplier;const a=Math.floor(n);const fraction=n-a;return (fraction<.5?a:fraction>.5?a+1:a%2===0?a:a+1)/multiplier;}
function artHex(vals){return '#'+Array.from(vals,x=>Math.max(0,Math.min(255,artRound(x))).toString(16).padStart(2,'0')).join('').toUpperCase();}
function artRgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
function artLab(rgb){
  const [R,G,B]=rgb.map(x=>{const v=x/255;return v>.04045?((v+.055)/1.055)**2.4:v/12.92;});
  const xyz=[(R*.4124564+G*.3575761+B*.1804375)/.95047,
    R*.2126729+G*.7151522+B*.0721750,
    (R*.0193339+G*.1191920+B*.9503041)/1.08883];
  const f=xyz.map(v=>v>216/24389?Math.cbrt(v):(24389/27*v+16)/116);
  return [116*f[1]-16,500*(f[0]-f[1]),200*(f[1]-f[2])];
}
function artDelta(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
function artDecide(stats,primary,secondary=null,config=ART_CONFIG){
  const ts=[primary,...(secondary?[secondary]:[])];if(ts.some(t=>!ART_TYPES[t]))throw Error('unsupported_type');
  const aLab=artLab(artRgb(stats.average_color)),dLab=artLab(artRgb(stats.dominant_color));
  const refs=ts.map(t=>artLab(artRgb(ART_TYPES[t])));
  const a=refs.map(t=>artDelta(t,aLab)),d=refs.map(t=>artDelta(t,dLab));
  const scores=ts.map((_,i)=>(config.average_weight*a[i]+config.dominant_weight*d[i])/(config.average_weight+config.dominant_weight));
  const winner=scores.length===1||scores[0]<=scores[1]?0:1;
  const aWinner=a.length===1||a[0]<=a[1]?0:1,dWinner=d.length===1||d[0]<=d[1]?0:1;
  const out={primary_type_color:ART_TYPES[primary],secondary_type_color:secondary?ART_TYPES[secondary]:'',
    delta_e_average_primary:artRound(a[0],6),delta_e_dominant_primary:artRound(d[0],6),combined_score_primary:artRound(scores[0],6),
    selected_banner_type:ts[winner],selected_tint_type:ts.length===2?ts[1-winner]:'',
    average_match:ts[aWinner],dominant_match:ts[dWinner],metrics_disagree:aWinner!==dWinner,
    confidence_margin:ts.length===2?artRound(Math.abs(scores[0]-scores[1]),6):null,
    tint_strength:.36,banner_type_strength:.85,banner_black_strength:.15,
    top_header_types:ts,description_type:ts[0]};
  if(ts.length===2)Object.assign(out,{delta_e_average_secondary:artRound(a[1],6),delta_e_dominant_secondary:artRound(d[1],6),combined_score_secondary:artRound(scores[1],6)});
  return out;
}
// Felzenszwalb-Huttenlocher exact squared Euclidean distance transform.
// Input zero-distance sites include a one-pixel zero border around the artwork.
function artDistanceToBackground(visible,w,h){
  const W=w+2,H=h+2,N=W*H,huge=1e16;
  const temp=new Float64Array(N),out=new Float64Array(w*h);
  const f=new Float64Array(Math.max(W,H)),g=new Float64Array(f.length),v=new Int32Array(f.length),z=new Float64Array(f.length+1);
  const transform=(length)=>{
    let k=0;v[0]=0;z[0]=-Infinity;z[1]=Infinity;
    for(let q=1;q<length;q++){
      let s;
      do{const vk=v[k];s=((f[q]+q*q)-(f[vk]+vk*vk))/(2*(q-vk));if(s<=z[k])k--;else break;}while(k>=0);
      k++;v[k]=q;z[k]=s;z[k+1]=Infinity;
    }
    k=0;for(let q=0;q<length;q++){while(z[k+1]<q)k++;const dx=q-v[k];g[q]=dx*dx+f[v[k]];}
  };
  // Horizontal: rows of padded mask, false outside the padded subject.
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++)f[x]=(x===0||x===W-1||y===0||y===H-1||!visible[(y-1)*w+x-1])?0:huge;
    transform(W);for(let x=0;x<W;x++)temp[y*W+x]=g[x];
  }
  for(let x=1;x<=w;x++){
    for(let y=0;y<H;y++)f[y]=temp[y*W+x];
    transform(H);for(let y=1;y<=h;y++)out[(y-1)*w+x-1]=g[y];
  }
  return out;
}
// SciPy binary_propagation uses default 4-connected cross structuring element.
function artRemoveOpaqueBackground(rgba,w,h,visible){
  const n=w*h,rs=[0,0,w-1,w-1],cs=[0,h-1,0,h-1],corners=[];
  for(let k=0;k<4;k++){const p=(cs[k]*w+rs[k])*4;corners.push([rgba[p],rgba[p+1],rgba[p+2]]);}
  const median=k=>{const v=corners.map(c=>c[k]).sort((a,b)=>a-b);return (v[1]+v[2])/2;};
  const bg=[median(0),median(1),median(2)];
  if(corners.some(c=>Math.hypot(c[0]-bg[0],c[1]-bg[1],c[2]-bg[2])>=8))return 0;
  const can=new Uint8Array(n);for(let p=0;p<n;p++){
    const j=p*4;const dr=rgba[j]-bg[0],dg=rgba[j+1]-bg[1],db=rgba[j+2]-bg[2];
    if(Math.hypot(dr,dg,db)<10)can[p]=1;
  }
  const queue=new Int32Array(n);let head=0,tail=0;
  const add=p=>{if(can[p]){can[p]=0;queue[tail++]=p;visible[p]=0;}};
  for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
  while(head<tail){const p=queue[head++],x=p%w,y=(p/w)|0;
    if(x>0)add(p-1);if(x+1<w)add(p+1);if(y>0)add(p-w);if(y+1<h)add(p+w);
  }
  return tail;
}
function artColors(rgba,w,h,format='PNG',config=ART_CONFIG){
  if(!['PNG','JPEG','WEBP','GIF','TIFF'].includes(format))throw Error('unsupported_image_format:'+format);
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||rgba.length!==w*h*4)throw Error('invalid_rgba');
  const n=w*h,visible=new Uint8Array(n);let opaque=true;
  for(let p=0;p<n;p++){const alpha=rgba[4*p+3];visible[p]=alpha>=config.alpha_threshold?1:0;if(alpha<config.alpha_threshold)opaque=false;}
  let background=0;if(opaque)background=artRemoveOpaqueBackground(rgba,w,h,visible);
  let count=0;for(let p=0;p<n;p++)count+=visible[p];if(count<50)throw Error('too_few_visible_pixels');
  const dist=artDistanceToBackground(visible,w,h);
  const binsMass=new Float64Array(4096),binsR=new Float64Array(4096),binsG=new Float64Array(4096),binsB=new Float64Array(4096);
  const labs=new Float64Array(n*3);let alphaSum=0,darkSum=0,whiteSum=0;
  for(let p=0;p<n;p++)if(visible[p]){
    const j=p*4,a=rgba[j+3]/255,c=artLab([rgba[j],rgba[j+1],rgba[j+2]]),L=c[0],ch=Math.hypot(c[1],c[2]);
    labs[3*p]=L;labs[3*p+1]=c[1];labs[3*p+2]=c[2];alphaSum+=a;
    if(L<20&&ch<18)darkSum+=a;if(L>94&&ch<10)whiteSum+=a;
  }
  const darkFraction=darkSum/alphaSum,whiteFraction=whiteSum/alphaSum;
  let rawR=0,rawG=0,rawB,adjR=0,adjG=0,adjB=0,adjustedMass=0,outlineCount=0;
  rawB=0;
  for(let p=0;p<n;p++)if(visible[p]){
    const j=p*4,r=rgba[j],g=rgba[j+1],b=rgba[j+2],a=rgba[j+3]/255;
    const L=labs[3*p],ch=Math.hypot(labs[3*p+1],labs[3*p+2]);
    const dark=L<20&&ch<18,white=L>94&&ch<10;
    let weight=a;if(dist[p]<=4)weight*=config.edge_weight;
    const outline=dark&&(dist[p]<=9||darkFraction<.18);
    if(outline){weight*=config.outline_weight;outlineCount++;}
    if(white&&whiteFraction<.12)weight*=config.incidental_white_weight;
    rawR+=a*r;rawG+=a*g;rawB+=a*b;adjR+=weight*r;adjG+=weight*g;adjB+=weight*b;adjustedMass+=weight;
    const code=(r>>4)*256+(g>>4)*16+(b>>4);
    binsMass[code]+=weight;binsR[code]+=weight*r;binsG[code]+=weight*g;binsB[code]+=weight*b;
  }
  const ids=[],mass=[],means=[],points=[];
  for(let i=0;i<4096;i++)if(binsMass[i]>0){ids.push(i);mass.push(binsMass[i]);const m=[binsR[i]/binsMass[i],binsG[i]/binsMass[i],binsB[i]/binsMass[i]];means.push(m);points.push(artLab(m));}
  const k=Math.min(config.clusters,ids.length),centers=[];let largest=0;
  for(let i=1;i<mass.length;i++)if(mass[i]>mass[largest])largest=i;
  centers.push(points[largest].slice());
  for(let z=1;z<k;z++){
    let chosen=0,best=-Infinity;
    for(let i=0;i<points.length;i++){
      let d=Infinity;for(const ctr of centers){const dx=points[i][0]-ctr[0],dy=points[i][1]-ctr[1],dz=points[i][2]-ctr[2];const v=dx*dx+dy*dy+dz*dz;if(v<d)d=v;}
      const v=d*Math.sqrt(mass[i]);if(v>best){best=v;chosen=i;}
    }centers.push(points[chosen].slice());
  }
  let labels=new Int8Array(points.length);
  for(let iteration=0;iteration<35;iteration++){
    const sum=new Float64Array(k*3),sizes=new Float64Array(k);
    for(let i=0;i<points.length;i++){
      let closest=0,best=Infinity;
      for(let j=0;j<k;j++){
        const dx=points[i][0]-centers[j][0],dy=points[i][1]-centers[j][1],dz=points[i][2]-centers[j][2];const d=dx*dx+dy*dy+dz*dz;
        if(d<best){best=d;closest=j;}
      }
      labels[i]=closest;sizes[closest]+=mass[i];for(let c=0;c<3;c++)sum[closest*3+c]+=mass[i]*points[i][c];
    }
    const next=centers.map(x=>x.slice());let delta=0;
    for(let j=0;j<k;j++)if(sizes[j])for(let c=0;c<3;c++){next[j][c]=sum[j*3+c]/sizes[j];delta=Math.max(delta,Math.abs(next[j][c]-centers[j][c]));}
    if(delta<.02)break;for(let j=0;j<k;j++)centers[j]=next[j];
  }
  const clusterData=Array.from({length:k},()=>({r:0,g:0,b:0,m:0}));
  for(let i=0;i<labels.length;i++){const j=labels[i],v=clusterData[j],m=mass[i];v.m+=m;v.r+=m*means[i][0];v.g+=m*means[i][1];v.b+=m*means[i][2];}
  const clusters=clusterData.filter(v=>v.m>0).map(v=>({hex:artHex([v.r/v.m,v.g/v.m,v.b/v.m]),coverage:artRound(v.m/adjustedMass,6)}));
  // Python sort is stable; JS Array.sort is specified stable since ES2019.
  clusters.sort((a,b)=>b.coverage-a.coverage);
  return {average_color:artHex([adjR/adjustedMass,adjG/adjustedMass,adjB/adjustedMass]),
    raw_alpha_average_color:artHex([rawR/alphaSum,rawG/alphaSum,rawB/alphaSum]),dominant_color:clusters[0].hex,
    dominant_coverage:clusters[0].coverage,clusters,visible_pixels:count,
    background_pixels_removed:background,outline_pixels_discounted:outlineCount,
    near_black_body_fraction:artRound(darkFraction,6),near_white_body_fraction:artRound(whiteFraction,6),
    image_width:w,image_height:h,image_format:format};
}

/* Exact alpha >=1 geometry. No contour simplification, mask downsampling or foreground inference. */
function artGeometry(rgba,w,h){
  const n=w*h,stride=Math.ceil(w/8),mask=new Uint8Array(stride*h),alphaZero=new Uint8Array(n),occupied=new Uint8Array(n);
  let occupiedCount=0,zeros=0,part=0,visualMinX=w,visualMinY=h,visualMaxX=-1,visualMaxY=-1,minX=w,minY=h,maxX=-1,maxY=-1;
  const edge={top:0,right:0,bottom:0,left:0};
  for(let p=0;p<n;p++){
    const x=p%w,y=(p/w)|0,a=rgba[4*p+3];
    if(a===0){zeros++;alphaZero[p]=1;if(y===0)edge.top++;if(x===w-1)edge.right++;if(y===h-1)edge.bottom++;if(x===0)edge.left++;}
    if(a>0&&a<255)part++;
    if(a>=1){occupied[p]=1;mask[y*stride+(x>>3)]|=0x80>>(x&7);occupiedCount++;
      minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
    }
    if(a>=128){visualMinX=Math.min(visualMinX,x);visualMinY=Math.min(visualMinY,y);visualMaxX=Math.max(visualMaxX,x);visualMaxY=Math.max(visualMaxY,y);}
  }
  const bounds=occupiedCount?{left:minX,top:minY,right:maxX+1,bottom:maxY+1}:null;
  const visualBounds=visualMaxX>=0?{left:visualMinX,top:visualMinY,right:visualMaxX+1,bottom:visualMaxY+1}:null;
  // A four-connected exterior alpha-zero component must spread to >=3 sides
  // and exceed one complete image perimeter (not a universal alpha percentage).
  const seen=new Uint8Array(n),queue=new Int32Array(n);let biggest=0,biggestSides=[];
  const flood=(start,grid,useEight)=>{
    let head=0,tail=0,touched=0;queue[tail++]=start;seen[start]=1;
    while(head<tail){const p=queue[head++],x=p%w,y=(p/w)|0;
      if(y===0)touched|=1;if(x===w-1)touched|=2;if(y===h-1)touched|=4;if(x===0)touched|=8;
      const add=q=>{if(grid[q]&&!seen[q]){seen[q]=1;queue[tail++]=q;}};
      if(x>0)add(p-1);if(x+1<w)add(p+1);if(y>0)add(p-w);if(y+1<h)add(p+w);
      if(useEight){if(x>0&&y>0)add(p-w-1);if(x+1<w&&y>0)add(p-w+1);if(x>0&&y+1<h)add(p+w-1);if(x+1<w&&y+1<h)add(p+w+1);}
    }return {size:tail,touched};
  };
  for(let i=0;i<n;i++)if(alphaZero[i]&&!seen[i]&&(i<w||i>=n-w||i%w===0||i%w===w-1)){
    const v=flood(i,alphaZero,false);if(v.size>biggest){biggest=v.size;biggestSides=['top','right','bottom','left'].filter((_,j)=>v.touched&(1<<j));}
  }
  const perimeter=w===1?h:h===1?w:2*(w+h)-4;
  const reliable=occupiedCount>0&&biggestSides.length>=3&&biggest>perimeter;
  const reason= !zeros?'no_border_connected_transparency':!biggest?'no_border_connected_transparency':
    biggestSides.length<3?'exterior_transparency_insufficient_spread':biggest<=perimeter?'exterior_transparency_only_perimeter_scale':'meaningful_border_connected_transparency';
  let components=null,holes=null;
  if(reliable){seen.fill(0);components=0;for(let i=0;i<n;i++)if(occupied[i]&&!seen[i]){flood(i,occupied,true);components++;}
    seen.fill(0);holes=0;for(let i=0;i<n;i++)if(alphaZero[i]&&!seen[i]){const c=flood(i,alphaZero,false);if(!c.touched)holes++;}
  }
  return {state:!occupiedCount?'unavailable_empty':!zeros?'unavailable_opaque':!reliable?'unavailable_alpha_ambiguous':'ready',
    reliable,alphaThreshold:1,width:w,height:h,occupiedPixels:reliable?occupiedCount:null,
    observedOccupancy:{occupiedPixels:occupiedCount,bounds,maskFormat:'packed-msb-row-v1',maskBytes:mask.length},
    bounds:reliable?bounds:null,visualBoundsAlpha128:visualBounds,components,holes,
    maskFormat:reliable?'packed-msb-row-v1':null,maskStrideBytes:stride,maskLength:reliable?mask.length:null,
    reliabilityReason:reason,transparency:{class:reliable?'meaningful-exterior':zeros?'ambiguous-alpha':'opaque-or-no-alpha',
      alphaZeroPixels:zeros,alphaPartialPixels:part,exteriorZeroPixels:biggest,exteriorBorderSides:biggestSides,
      transparentEdgePixelCounts:edge,reliabilityReason:reason},
    packedMask:reliable?mask:null,observedPackedMask:mask};
}
function artDecodeSilhouette(encoded){
  const {width:w,height:h,strideBytes:stride,bytes}=encoded;
  if(encoded.format!=='packed-msb-row-v1'||encoded.alphaThreshold!==1||!Number.isInteger(w)||w<1||
    !Number.isInteger(h)||h<1||stride!==Math.ceil(w/8)||!(bytes instanceof Uint8Array)||bytes.length!==stride*h)throw Error('invalid_mask');
  if(w%8){const pad=(1<<(8-w%8))-1;for(let y=0;y<h;y++)if(bytes[(y+1)*stride-1]&pad)throw Error('nonzero_mask_padding');}
  const pixel=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<w&&y>=0&&y<h&&!!(bytes[y*stride+(x>>3)]&(0x80>>(x&7)));
  const hits=rect=>{const l=Math.max(0,Math.floor(rect.left)),t=Math.max(0,Math.floor(rect.top)),r=Math.min(w,Math.ceil(rect.right)),b=Math.min(h,Math.ceil(rect.bottom));
    for(let y=t;y<b;y++)for(let x=l;x<r;x++)if(pixel(x,y))return true;return false;};
  return Object.freeze({width:w,height:h,hasPixel:pixel,intersectsSourceRect:hits,
    bounds:encoded.bounds??null,occupiedPixels:encoded.occupiedPixels??null});
}
function artIntersectRect(a,b){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}
function artPolygonClippedArea(vertices,rect){
  let poly=vertices;
  const edges=[[0,rect.left,true],[0,rect.right,false],[1,rect.top,true],[1,rect.bottom,false]];
  for(const [axis,bound,lower] of edges){if(!poly.length)return 0;const out=[];
    for(let i=0;i<poly.length;i++){
      const A=poly[i],B=poly[(i+1)%poly.length],av=A[axis],bv=B[axis],insideA=lower?av>=bound:av<=bound,insideB=lower?bv>=bound:bv<=bound;
      if(insideA!==insideB){const t=(bound-av)/(bv-av);out.push([A[0]+t*(B[0]-A[0]),A[1]+t*(B[1]-A[1])]);}
      if(insideB)out.push(B);
    }poly=out;
  }
  let area=0;for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length];area+=p[0]*q[1]-q[0]*p[1];}
  return Math.abs(area)/2;
}
function artAffineCollision(mask,rect,matrix){
  const [a,b,c,d,e,f]=matrix,det=a*d-b*c;
  if(!Number.isFinite(det)||Math.abs(det)<1e-12)throw Error('unsupported_transform');
  const inverse=(X,Y)=>[(d*(X-e)-c*(Y-f))/det,(-b*(X-e)+a*(Y-f))/det];
  const pts=[[rect.left,rect.top],[rect.right,rect.top],[rect.right,rect.bottom],[rect.left,rect.bottom]].map(p=>inverse(...p));
  const l=Math.max(0,Math.floor(Math.min(...pts.map(p=>p[0])))),r=Math.min(mask.width,Math.ceil(Math.max(...pts.map(p=>p[0]))));
  const t=Math.max(0,Math.floor(Math.min(...pts.map(p=>p[1])))),bottom=Math.min(mask.height,Math.ceil(Math.max(...pts.map(p=>p[1]))));
  for(let y=t;y<bottom;y++)for(let x=l;x<r;x++){
    if(!mask.hasPixel(x,y))continue;
    const corners=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]].map(p=>[a*p[0]+c*p[1]+e,b*p[0]+d*p[1]+f]);
    if(artPolygonClippedArea(corners,rect)>1e-10)return true;
  }return false;
}
function artRecommend(mask,bounds,render,sourceHash){
  const missing={corner:null,pass:'unavailable',originalBounds:bounds??null,effectiveBounds:bounds??null,
    iconClientRect:null,expansionPerSideSourcePixels:0,sourceMaskSha256:sourceHash,renderContextToken:render?.renderContextToken??null};
  if(!mask||!bounds||!render||!Array.isArray(render.sourceToClient)||render.sourceToClient.length!==6||
    !render.iconClientRect||!Number.isFinite(render.clearanceClientPx)||render.clearanceClientPx<0)return missing;
  const [a,b,c,d,e,f]=render.sourceToClient,det=a*d-b*c;
  if(![a,b,c,d,e,f].every(Number.isFinite)||Math.abs(det)<1e-12)return missing;
  const iw=render.iconClientRect.right-render.iconClientRect.left,ih=render.iconClientRect.bottom-render.iconClientRect.top;
  if(!(iw>0&&ih>0)||!Array.isArray(render.obstacleClientRects))return missing;
  // Source-space width of one horizontal icon-width CSS vector via inverse transform.
  const wx=Math.hypot(d*iw/det,-b*iw/det),wy=Math.hypot(-c*ih/det,a*ih/det);
  // Source-space axis-aligned effective bounds; project corner anchors to viewport.
  const expansion=wx;
  const map=(x,y)=>[a*x+c*y+e,b*x+d*y+f];
  const test=(box,pass)=>{
    for(const corner of ['tr','tl','br','bl']){
      const right=corner.endsWith('r'),bottom=corner.startsWith('b');
      // Place screen-axis-aligned footprint anchored at the corresponding source box corner.
      const p=map(right?box.right:box.left,bottom?box.bottom:box.top);
      const rect={left:right?p[0]-iw:p[0],right:right?p[0]:p[0]+iw,
        top:bottom?p[1]-ih:p[1],bottom:bottom?p[1]:p[1]+ih};
      const pad=render.clearanceClientPx;
      const dilated={left:rect.left-pad,right:rect.right+pad,top:rect.top-pad,bottom:rect.bottom+pad};
      if(pass==='original'){
        // Entire icon must be within original source bounds under inverse transform.
        const inv=(X,Y)=>[(d*(X-e)-c*(Y-f))/det,(-b*(X-e)+a*(Y-f))/det];
        const corners=[[rect.left,rect.top],[rect.right,rect.top],[rect.right,rect.bottom],[rect.left,rect.bottom]];
        if(corners.some(([X,Y])=>{const [sx,sy]=inv(X,Y);return sx<box.left-1e-7||sx>box.right+1e-7||sy<box.top-1e-7||sy>box.bottom+1e-7;}))continue;
      }
      if(render.obstacleClientRects.some(ob=>artIntersectRect(dilated,ob)))continue;
      if(artAffineCollision(mask,dilated,render.sourceToClient))continue;
      return {corner,pass,originalBounds:bounds,effectiveBounds:box,iconClientRect:rect,
        expansionPerSideSourcePixels:pass==='expanded'?expansion:0,sourceMaskSha256:sourceHash,renderContextToken:render.renderContextToken};
    }return null;
  };
  return test(bounds,'original')||test({left:bounds.left-expansion,top:bounds.top-expansion,right:bounds.right+expansion,bottom:bounds.bottom+expansion},'expanded')||missing;
}

/* Browser-native lossless PNG RGBA decode, avoiding Canvas premultiplication.
 * Eight-bit RGB/RGBA, noninterlaced PNG: exactly matches Pillow's RGBA bytes.
 * Other PNG encodings use the labeled browser decoder fallback until separately
 * parity-verified. DecompressionStream is platform-native; no external library. */
async function artDecodePngLossless(bytes){
  if(typeof DecompressionStream!=='function')return null;
  const data=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
  if(data.length<33||data.slice(0,8).some((v,i)=>v!==[137,80,78,71,13,10,26,10][i]))throw Error('invalid_png_header');
  const u32=p=>((data[p]*0x1000000)+(data[p+1]<<16)+(data[p+2]<<8)+data[p+3])>>>0;
  let cursor=8,w=0,h=0,depth=0,type=0,interlace=0,foundIHDR=false,foundEnd=false,parts=[],total=0;
  while(cursor+12<=data.length){const len=u32(cursor),name=String.fromCharCode(...data.slice(cursor+4,cursor+8)),start=cursor+8,end=start+len;
    if(end+4>data.length||len>200000000)throw Error('truncated_png_chunk');
    if(name==='IHDR'){
      if(foundIHDR||len!==13)throw Error('invalid_png_ihdr');foundIHDR=true;
      w=u32(start);h=u32(start+4);depth=data[start+8];type=data[start+9];interlace=data[start+12];
      if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>16000000)throw Error('image_dimensions_unsupported');
    }else if(name==='IDAT'){parts.push(data.subarray(start,end));total+=len;}
    else if(name==='IEND'){foundEnd=true;break;}
    cursor=end+4;
  }
  if(!foundIHDR||!foundEnd||!parts.length)throw Error('incomplete_png');
  if(depth!==8||(type!==2&&type!==6)||interlace!==0)return null;
  const channels=type===6?4:3,rowBytes=w*channels,expect=(rowBytes+1)*h;
  if(total>100000000||expect>100000000)throw Error('image_too_large');
  const zlib=new Uint8Array(total);let offset=0;
  for(const part of parts){zlib.set(part,offset);offset+=part.length;}
  let inflated;
  try{const stream=new Blob([zlib]).stream().pipeThrough(new DecompressionStream('deflate'));
    inflated=new Uint8Array(await new Response(stream).arrayBuffer());}
  catch(error){throw Error('png_deflate_decode_failed:'+String(error?.message||error));}
  if(inflated.length!==expect)throw Error('png_inflate_length_mismatch');
  const rgba=new Uint8Array(w*h*4),previous=new Uint8Array(rowBytes),current=new Uint8Array(rowBytes);
  let source=0,target=0;
  for(let y=0;y<h;y++){
    const filter=inflated[source++];if(filter>4)throw Error('invalid_png_filter');
    for(let i=0;i<rowBytes;i++){
      const orig=inflated[source++],left=i>=channels?current[i-channels]:0,up=previous[i],upLeft=i>=channels?previous[i-channels]:0;
      let predictor=0;
      if(filter===1)predictor=left;else if(filter===2)predictor=up;
      else if(filter===3)predictor=(left+up)>>1;
      else if(filter===4){const p=left+up-upLeft,dl=Math.abs(p-left),du=Math.abs(p-up),dc=Math.abs(p-upLeft);
        predictor=dl<=du&&dl<=dc?left:du<=dc?up:upLeft;}
      current[i]=(orig+predictor)&255;
    }
    for(let x=0;x<w;x++){
      const i=x*channels;rgba[target++]=current[i];rgba[target++]=current[i+1];rgba[target++]=current[i+2];rgba[target++]=channels===4?current[i+3]:255;
    }
    previous.set(current);
  }
  return {rgba,width:w,height:h,decodeMode:'png-native-exact'};
}

const ART_WORKER_SOURCE="/* ART-02-R01 core: standalone, dependency-free browser/Node image mathematics.\n * Python oracle SHA256 f6ac6e346e2e93b2c05110ebe286c8e37d2120b9d035d9ce1766e536d133f1cd\n * No image downsampling. Coordinates are full source-resolution pixels. */\nconst ART_TYPES=Object.freeze({normal:'#A1A1A1',fire:'#D43A30',fighting:'#F08833',water:'#4C79BC',flying:'#8FB8E4',grass:'#5D9D3C',poison:'#6D4B97',electric:'#F2C341',ground:'#895229',psychic:'#DC4D79',rock:'#ADA984',ice:'#78CCF0',bug:'#95A135',dragon:'#4C60A9',ghost:'#6B426E',dark:'#4E403F',steel:'#74A2B9',fairy:'#BA7FB5'});\nconst ART_CONFIG=Object.freeze({average_weight:.5,dominant_weight:.5,alpha_threshold:128,clusters:8,outline_weight:.25,edge_weight:.5,incidental_white_weight:.7,delta_e:'CIE76',version:'1.0.0'});\nconst ART_REFERENCE_SHA='f6ac6e346e2e93b2c05110ebe286c8e37d2120b9d035d9ce1766e536d133f1cd';\nfunction artRound(value,places=0){const multiplier=10**places;const n=value*multiplier;const a=Math.floor(n);const fraction=n-a;return (fraction<.5?a:fraction>.5?a+1:a%2===0?a:a+1)/multiplier;}\nfunction artHex(vals){return '#'+Array.from(vals,x=>Math.max(0,Math.min(255,artRound(x))).toString(16).padStart(2,'0')).join('').toUpperCase();}\nfunction artRgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}\nfunction artLab(rgb){\n  const [R,G,B]=rgb.map(x=>{const v=x/255;return v>.04045?((v+.055)/1.055)**2.4:v/12.92;});\n  const xyz=[(R*.4124564+G*.3575761+B*.1804375)/.95047,\n    R*.2126729+G*.7151522+B*.0721750,\n    (R*.0193339+G*.1191920+B*.9503041)/1.08883];\n  const f=xyz.map(v=>v>216/24389?Math.cbrt(v):(24389/27*v+16)/116);\n  return [116*f[1]-16,500*(f[0]-f[1]),200*(f[1]-f[2])];\n}\nfunction artDelta(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}\nfunction artDecide(stats,primary,secondary=null,config=ART_CONFIG){\n  const ts=[primary,...(secondary?[secondary]:[])];if(ts.some(t=>!ART_TYPES[t]))throw Error('unsupported_type');\n  const aLab=artLab(artRgb(stats.average_color)),dLab=artLab(artRgb(stats.dominant_color));\n  const refs=ts.map(t=>artLab(artRgb(ART_TYPES[t])));\n  const a=refs.map(t=>artDelta(t,aLab)),d=refs.map(t=>artDelta(t,dLab));\n  const scores=ts.map((_,i)=>(config.average_weight*a[i]+config.dominant_weight*d[i])/(config.average_weight+config.dominant_weight));\n  const winner=scores.length===1||scores[0]<=scores[1]?0:1;\n  const aWinner=a.length===1||a[0]<=a[1]?0:1,dWinner=d.length===1||d[0]<=d[1]?0:1;\n  const out={primary_type_color:ART_TYPES[primary],secondary_type_color:secondary?ART_TYPES[secondary]:'',\n    delta_e_average_primary:artRound(a[0],6),delta_e_dominant_primary:artRound(d[0],6),combined_score_primary:artRound(scores[0],6),\n    selected_banner_type:ts[winner],selected_tint_type:ts.length===2?ts[1-winner]:'',\n    average_match:ts[aWinner],dominant_match:ts[dWinner],metrics_disagree:aWinner!==dWinner,\n    confidence_margin:ts.length===2?artRound(Math.abs(scores[0]-scores[1]),6):null,\n    tint_strength:.36,banner_type_strength:.85,banner_black_strength:.15,\n    top_header_types:ts,description_type:ts[0]};\n  if(ts.length===2)Object.assign(out,{delta_e_average_secondary:artRound(a[1],6),delta_e_dominant_secondary:artRound(d[1],6),combined_score_secondary:artRound(scores[1],6)});\n  return out;\n}\n// Felzenszwalb-Huttenlocher exact squared Euclidean distance transform.\n// Input zero-distance sites include a one-pixel zero border around the artwork.\nfunction artDistanceToBackground(visible,w,h){\n  const W=w+2,H=h+2,N=W*H,huge=1e16;\n  const temp=new Float64Array(N),out=new Float64Array(w*h);\n  const f=new Float64Array(Math.max(W,H)),g=new Float64Array(f.length),v=new Int32Array(f.length),z=new Float64Array(f.length+1);\n  const transform=(length)=>{\n    let k=0;v[0]=0;z[0]=-Infinity;z[1]=Infinity;\n    for(let q=1;q<length;q++){\n      let s;\n      do{const vk=v[k];s=((f[q]+q*q)-(f[vk]+vk*vk))/(2*(q-vk));if(s<=z[k])k--;else break;}while(k>=0);\n      k++;v[k]=q;z[k]=s;z[k+1]=Infinity;\n    }\n    k=0;for(let q=0;q<length;q++){while(z[k+1]<q)k++;const dx=q-v[k];g[q]=dx*dx+f[v[k]];}\n  };\n  // Horizontal: rows of padded mask, false outside the padded subject.\n  for(let y=0;y<H;y++){\n    for(let x=0;x<W;x++)f[x]=(x===0||x===W-1||y===0||y===H-1||!visible[(y-1)*w+x-1])?0:huge;\n    transform(W);for(let x=0;x<W;x++)temp[y*W+x]=g[x];\n  }\n  for(let x=1;x<=w;x++){\n    for(let y=0;y<H;y++)f[y]=temp[y*W+x];\n    transform(H);for(let y=1;y<=h;y++)out[(y-1)*w+x-1]=g[y];\n  }\n  return out;\n}\n// SciPy binary_propagation uses default 4-connected cross structuring element.\nfunction artRemoveOpaqueBackground(rgba,w,h,visible){\n  const n=w*h,rs=[0,0,w-1,w-1],cs=[0,h-1,0,h-1],corners=[];\n  for(let k=0;k<4;k++){const p=(cs[k]*w+rs[k])*4;corners.push([rgba[p],rgba[p+1],rgba[p+2]]);}\n  const median=k=>{const v=corners.map(c=>c[k]).sort((a,b)=>a-b);return (v[1]+v[2])/2;};\n  const bg=[median(0),median(1),median(2)];\n  if(corners.some(c=>Math.hypot(c[0]-bg[0],c[1]-bg[1],c[2]-bg[2])>=8))return 0;\n  const can=new Uint8Array(n);for(let p=0;p<n;p++){\n    const j=p*4;const dr=rgba[j]-bg[0],dg=rgba[j+1]-bg[1],db=rgba[j+2]-bg[2];\n    if(Math.hypot(dr,dg,db)<10)can[p]=1;\n  }\n  const queue=new Int32Array(n);let head=0,tail=0;\n  const add=p=>{if(can[p]){can[p]=0;queue[tail++]=p;visible[p]=0;}};\n  for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}\n  while(head<tail){const p=queue[head++],x=p%w,y=(p/w)|0;\n    if(x>0)add(p-1);if(x+1<w)add(p+1);if(y>0)add(p-w);if(y+1<h)add(p+w);\n  }\n  return tail;\n}\nfunction artColors(rgba,w,h,format='PNG',config=ART_CONFIG){\n  if(!['PNG','JPEG','WEBP','GIF','TIFF'].includes(format))throw Error('unsupported_image_format:'+format);\n  if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||rgba.length!==w*h*4)throw Error('invalid_rgba');\n  const n=w*h,visible=new Uint8Array(n);let opaque=true;\n  for(let p=0;p<n;p++){const alpha=rgba[4*p+3];visible[p]=alpha>=config.alpha_threshold?1:0;if(alpha<config.alpha_threshold)opaque=false;}\n  let background=0;if(opaque)background=artRemoveOpaqueBackground(rgba,w,h,visible);\n  let count=0;for(let p=0;p<n;p++)count+=visible[p];if(count<50)throw Error('too_few_visible_pixels');\n  const dist=artDistanceToBackground(visible,w,h);\n  const binsMass=new Float64Array(4096),binsR=new Float64Array(4096),binsG=new Float64Array(4096),binsB=new Float64Array(4096);\n  const labs=new Float64Array(n*3);let alphaSum=0,darkSum=0,whiteSum=0;\n  for(let p=0;p<n;p++)if(visible[p]){\n    const j=p*4,a=rgba[j+3]/255,c=artLab([rgba[j],rgba[j+1],rgba[j+2]]),L=c[0],ch=Math.hypot(c[1],c[2]);\n    labs[3*p]=L;labs[3*p+1]=c[1];labs[3*p+2]=c[2];alphaSum+=a;\n    if(L<20&&ch<18)darkSum+=a;if(L>94&&ch<10)whiteSum+=a;\n  }\n  const darkFraction=darkSum/alphaSum,whiteFraction=whiteSum/alphaSum;\n  let rawR=0,rawG=0,rawB,adjR=0,adjG=0,adjB=0,adjustedMass=0,outlineCount=0;\n  rawB=0;\n  for(let p=0;p<n;p++)if(visible[p]){\n    const j=p*4,r=rgba[j],g=rgba[j+1],b=rgba[j+2],a=rgba[j+3]/255;\n    const L=labs[3*p],ch=Math.hypot(labs[3*p+1],labs[3*p+2]);\n    const dark=L<20&&ch<18,white=L>94&&ch<10;\n    let weight=a;if(dist[p]<=4)weight*=config.edge_weight;\n    const outline=dark&&(dist[p]<=9||darkFraction<.18);\n    if(outline){weight*=config.outline_weight;outlineCount++;}\n    if(white&&whiteFraction<.12)weight*=config.incidental_white_weight;\n    rawR+=a*r;rawG+=a*g;rawB+=a*b;adjR+=weight*r;adjG+=weight*g;adjB+=weight*b;adjustedMass+=weight;\n    const code=(r>>4)*256+(g>>4)*16+(b>>4);\n    binsMass[code]+=weight;binsR[code]+=weight*r;binsG[code]+=weight*g;binsB[code]+=weight*b;\n  }\n  const ids=[],mass=[],means=[],points=[];\n  for(let i=0;i<4096;i++)if(binsMass[i]>0){ids.push(i);mass.push(binsMass[i]);const m=[binsR[i]/binsMass[i],binsG[i]/binsMass[i],binsB[i]/binsMass[i]];means.push(m);points.push(artLab(m));}\n  const k=Math.min(config.clusters,ids.length),centers=[];let largest=0;\n  for(let i=1;i<mass.length;i++)if(mass[i]>mass[largest])largest=i;\n  centers.push(points[largest].slice());\n  for(let z=1;z<k;z++){\n    let chosen=0,best=-Infinity;\n    for(let i=0;i<points.length;i++){\n      let d=Infinity;for(const ctr of centers){const dx=points[i][0]-ctr[0],dy=points[i][1]-ctr[1],dz=points[i][2]-ctr[2];const v=dx*dx+dy*dy+dz*dz;if(v<d)d=v;}\n      const v=d*Math.sqrt(mass[i]);if(v>best){best=v;chosen=i;}\n    }centers.push(points[chosen].slice());\n  }\n  let labels=new Int8Array(points.length);\n  for(let iteration=0;iteration<35;iteration++){\n    const sum=new Float64Array(k*3),sizes=new Float64Array(k);\n    for(let i=0;i<points.length;i++){\n      let closest=0,best=Infinity;\n      for(let j=0;j<k;j++){\n        const dx=points[i][0]-centers[j][0],dy=points[i][1]-centers[j][1],dz=points[i][2]-centers[j][2];const d=dx*dx+dy*dy+dz*dz;\n        if(d<best){best=d;closest=j;}\n      }\n      labels[i]=closest;sizes[closest]+=mass[i];for(let c=0;c<3;c++)sum[closest*3+c]+=mass[i]*points[i][c];\n    }\n    const next=centers.map(x=>x.slice());let delta=0;\n    for(let j=0;j<k;j++)if(sizes[j])for(let c=0;c<3;c++){next[j][c]=sum[j*3+c]/sizes[j];delta=Math.max(delta,Math.abs(next[j][c]-centers[j][c]));}\n    if(delta<.02)break;for(let j=0;j<k;j++)centers[j]=next[j];\n  }\n  const clusterData=Array.from({length:k},()=>({r:0,g:0,b:0,m:0}));\n  for(let i=0;i<labels.length;i++){const j=labels[i],v=clusterData[j],m=mass[i];v.m+=m;v.r+=m*means[i][0];v.g+=m*means[i][1];v.b+=m*means[i][2];}\n  const clusters=clusterData.filter(v=>v.m>0).map(v=>({hex:artHex([v.r/v.m,v.g/v.m,v.b/v.m]),coverage:artRound(v.m/adjustedMass,6)}));\n  // Python sort is stable; JS Array.sort is specified stable since ES2019.\n  clusters.sort((a,b)=>b.coverage-a.coverage);\n  return {average_color:artHex([adjR/adjustedMass,adjG/adjustedMass,adjB/adjustedMass]),\n    raw_alpha_average_color:artHex([rawR/alphaSum,rawG/alphaSum,rawB/alphaSum]),dominant_color:clusters[0].hex,\n    dominant_coverage:clusters[0].coverage,clusters,visible_pixels:count,\n    background_pixels_removed:background,outline_pixels_discounted:outlineCount,\n    near_black_body_fraction:artRound(darkFraction,6),near_white_body_fraction:artRound(whiteFraction,6),\n    image_width:w,image_height:h,image_format:format};\n}\n\n/* Exact alpha >=1 geometry. No contour simplification, mask downsampling or foreground inference. */\nfunction artGeometry(rgba,w,h){\n  const n=w*h,stride=Math.ceil(w/8),mask=new Uint8Array(stride*h),alphaZero=new Uint8Array(n),occupied=new Uint8Array(n);\n  let occupiedCount=0,zeros=0,part=0,visualMinX=w,visualMinY=h,visualMaxX=-1,visualMaxY=-1,minX=w,minY=h,maxX=-1,maxY=-1;\n  const edge={top:0,right:0,bottom:0,left:0};\n  for(let p=0;p<n;p++){\n    const x=p%w,y=(p/w)|0,a=rgba[4*p+3];\n    if(a===0){zeros++;alphaZero[p]=1;if(y===0)edge.top++;if(x===w-1)edge.right++;if(y===h-1)edge.bottom++;if(x===0)edge.left++;}\n    if(a>0&&a<255)part++;\n    if(a>=1){occupied[p]=1;mask[y*stride+(x>>3)]|=0x80>>(x&7);occupiedCount++;\n      minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);\n    }\n    if(a>=128){visualMinX=Math.min(visualMinX,x);visualMinY=Math.min(visualMinY,y);visualMaxX=Math.max(visualMaxX,x);visualMaxY=Math.max(visualMaxY,y);}\n  }\n  const bounds=occupiedCount?{left:minX,top:minY,right:maxX+1,bottom:maxY+1}:null;\n  const visualBounds=visualMaxX>=0?{left:visualMinX,top:visualMinY,right:visualMaxX+1,bottom:visualMaxY+1}:null;\n  // A four-connected exterior alpha-zero component must spread to >=3 sides\n  // and exceed one complete image perimeter (not a universal alpha percentage).\n  const seen=new Uint8Array(n),queue=new Int32Array(n);let biggest=0,biggestSides=[];\n  const flood=(start,grid,useEight)=>{\n    let head=0,tail=0,touched=0;queue[tail++]=start;seen[start]=1;\n    while(head<tail){const p=queue[head++],x=p%w,y=(p/w)|0;\n      if(y===0)touched|=1;if(x===w-1)touched|=2;if(y===h-1)touched|=4;if(x===0)touched|=8;\n      const add=q=>{if(grid[q]&&!seen[q]){seen[q]=1;queue[tail++]=q;}};\n      if(x>0)add(p-1);if(x+1<w)add(p+1);if(y>0)add(p-w);if(y+1<h)add(p+w);\n      if(useEight){if(x>0&&y>0)add(p-w-1);if(x+1<w&&y>0)add(p-w+1);if(x>0&&y+1<h)add(p+w-1);if(x+1<w&&y+1<h)add(p+w+1);}\n    }return {size:tail,touched};\n  };\n  for(let i=0;i<n;i++)if(alphaZero[i]&&!seen[i]&&(i<w||i>=n-w||i%w===0||i%w===w-1)){\n    const v=flood(i,alphaZero,false);if(v.size>biggest){biggest=v.size;biggestSides=['top','right','bottom','left'].filter((_,j)=>v.touched&(1<<j));}\n  }\n  const perimeter=w===1?h:h===1?w:2*(w+h)-4;\n  const reliable=occupiedCount>0&&biggestSides.length>=3&&biggest>perimeter;\n  const reason= !zeros?'no_border_connected_transparency':!biggest?'no_border_connected_transparency':\n    biggestSides.length<3?'exterior_transparency_insufficient_spread':biggest<=perimeter?'exterior_transparency_only_perimeter_scale':'meaningful_border_connected_transparency';\n  let components=null,holes=null;\n  if(reliable){seen.fill(0);components=0;for(let i=0;i<n;i++)if(occupied[i]&&!seen[i]){flood(i,occupied,true);components++;}\n    seen.fill(0);holes=0;for(let i=0;i<n;i++)if(alphaZero[i]&&!seen[i]){const c=flood(i,alphaZero,false);if(!c.touched)holes++;}\n  }\n  return {state:!occupiedCount?'unavailable_empty':!zeros?'unavailable_opaque':!reliable?'unavailable_alpha_ambiguous':'ready',\n    reliable,alphaThreshold:1,width:w,height:h,occupiedPixels:reliable?occupiedCount:null,\n    observedOccupancy:{occupiedPixels:occupiedCount,bounds,maskFormat:'packed-msb-row-v1',maskBytes:mask.length},\n    bounds:reliable?bounds:null,visualBoundsAlpha128:visualBounds,components,holes,\n    maskFormat:reliable?'packed-msb-row-v1':null,maskStrideBytes:stride,maskLength:reliable?mask.length:null,\n    reliabilityReason:reason,transparency:{class:reliable?'meaningful-exterior':zeros?'ambiguous-alpha':'opaque-or-no-alpha',\n      alphaZeroPixels:zeros,alphaPartialPixels:part,exteriorZeroPixels:biggest,exteriorBorderSides:biggestSides,\n      transparentEdgePixelCounts:edge,reliabilityReason:reason},\n    packedMask:reliable?mask:null,observedPackedMask:mask};\n}\nfunction artDecodeSilhouette(encoded){\n  const {width:w,height:h,strideBytes:stride,bytes}=encoded;\n  if(encoded.format!=='packed-msb-row-v1'||encoded.alphaThreshold!==1||!Number.isInteger(w)||w<1||\n    !Number.isInteger(h)||h<1||stride!==Math.ceil(w/8)||!(bytes instanceof Uint8Array)||bytes.length!==stride*h)throw Error('invalid_mask');\n  if(w%8){const pad=(1<<(8-w%8))-1;for(let y=0;y<h;y++)if(bytes[(y+1)*stride-1]&pad)throw Error('nonzero_mask_padding');}\n  const pixel=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<w&&y>=0&&y<h&&!!(bytes[y*stride+(x>>3)]&(0x80>>(x&7)));\n  const hits=rect=>{const l=Math.max(0,Math.floor(rect.left)),t=Math.max(0,Math.floor(rect.top)),r=Math.min(w,Math.ceil(rect.right)),b=Math.min(h,Math.ceil(rect.bottom));\n    for(let y=t;y<b;y++)for(let x=l;x<r;x++)if(pixel(x,y))return true;return false;};\n  return Object.freeze({width:w,height:h,hasPixel:pixel,intersectsSourceRect:hits,\n    bounds:encoded.bounds??null,occupiedPixels:encoded.occupiedPixels??null});\n}\nfunction artIntersectRect(a,b){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}\nfunction artPolygonClippedArea(vertices,rect){\n  let poly=vertices;\n  const edges=[[0,rect.left,true],[0,rect.right,false],[1,rect.top,true],[1,rect.bottom,false]];\n  for(const [axis,bound,lower] of edges){if(!poly.length)return 0;const out=[];\n    for(let i=0;i<poly.length;i++){\n      const A=poly[i],B=poly[(i+1)%poly.length],av=A[axis],bv=B[axis],insideA=lower?av>=bound:av<=bound,insideB=lower?bv>=bound:bv<=bound;\n      if(insideA!==insideB){const t=(bound-av)/(bv-av);out.push([A[0]+t*(B[0]-A[0]),A[1]+t*(B[1]-A[1])]);}\n      if(insideB)out.push(B);\n    }poly=out;\n  }\n  let area=0;for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length];area+=p[0]*q[1]-q[0]*p[1];}\n  return Math.abs(area)/2;\n}\nfunction artAffineCollision(mask,rect,matrix){\n  const [a,b,c,d,e,f]=matrix,det=a*d-b*c;\n  if(!Number.isFinite(det)||Math.abs(det)<1e-12)throw Error('unsupported_transform');\n  const inverse=(X,Y)=>[(d*(X-e)-c*(Y-f))/det,(-b*(X-e)+a*(Y-f))/det];\n  const pts=[[rect.left,rect.top],[rect.right,rect.top],[rect.right,rect.bottom],[rect.left,rect.bottom]].map(p=>inverse(...p));\n  const l=Math.max(0,Math.floor(Math.min(...pts.map(p=>p[0])))),r=Math.min(mask.width,Math.ceil(Math.max(...pts.map(p=>p[0]))));\n  const t=Math.max(0,Math.floor(Math.min(...pts.map(p=>p[1])))),bottom=Math.min(mask.height,Math.ceil(Math.max(...pts.map(p=>p[1]))));\n  for(let y=t;y<bottom;y++)for(let x=l;x<r;x++){\n    if(!mask.hasPixel(x,y))continue;\n    const corners=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]].map(p=>[a*p[0]+c*p[1]+e,b*p[0]+d*p[1]+f]);\n    if(artPolygonClippedArea(corners,rect)>1e-10)return true;\n  }return false;\n}\nfunction artRecommend(mask,bounds,render,sourceHash){\n  const missing={corner:null,pass:'unavailable',originalBounds:bounds??null,effectiveBounds:bounds??null,\n    iconClientRect:null,expansionPerSideSourcePixels:0,sourceMaskSha256:sourceHash,renderContextToken:render?.renderContextToken??null};\n  if(!mask||!bounds||!render||!Array.isArray(render.sourceToClient)||render.sourceToClient.length!==6||\n    !render.iconClientRect||!Number.isFinite(render.clearanceClientPx)||render.clearanceClientPx<0)return missing;\n  const [a,b,c,d,e,f]=render.sourceToClient,det=a*d-b*c;\n  if(![a,b,c,d,e,f].every(Number.isFinite)||Math.abs(det)<1e-12)return missing;\n  const iw=render.iconClientRect.right-render.iconClientRect.left,ih=render.iconClientRect.bottom-render.iconClientRect.top;\n  if(!(iw>0&&ih>0)||!Array.isArray(render.obstacleClientRects))return missing;\n  // Source-space width of one horizontal icon-width CSS vector via inverse transform.\n  const wx=Math.hypot(d*iw/det,-b*iw/det),wy=Math.hypot(-c*ih/det,a*ih/det);\n  // Source-space axis-aligned effective bounds; project corner anchors to viewport.\n  const expansion=wx;\n  const map=(x,y)=>[a*x+c*y+e,b*x+d*y+f];\n  const test=(box,pass)=>{\n    for(const corner of ['tr','tl','br','bl']){\n      const right=corner.endsWith('r'),bottom=corner.startsWith('b');\n      // Place screen-axis-aligned footprint anchored at the corresponding source box corner.\n      const p=map(right?box.right:box.left,bottom?box.bottom:box.top);\n      const rect={left:right?p[0]-iw:p[0],right:right?p[0]:p[0]+iw,\n        top:bottom?p[1]-ih:p[1],bottom:bottom?p[1]:p[1]+ih};\n      const pad=render.clearanceClientPx;\n      const dilated={left:rect.left-pad,right:rect.right+pad,top:rect.top-pad,bottom:rect.bottom+pad};\n      if(pass==='original'){\n        // Entire icon must be within original source bounds under inverse transform.\n        const inv=(X,Y)=>[(d*(X-e)-c*(Y-f))/det,(-b*(X-e)+a*(Y-f))/det];\n        const corners=[[rect.left,rect.top],[rect.right,rect.top],[rect.right,rect.bottom],[rect.left,rect.bottom]];\n        if(corners.some(([X,Y])=>{const [sx,sy]=inv(X,Y);return sx<box.left-1e-7||sx>box.right+1e-7||sy<box.top-1e-7||sy>box.bottom+1e-7;}))continue;\n      }\n      if(render.obstacleClientRects.some(ob=>artIntersectRect(dilated,ob)))continue;\n      if(artAffineCollision(mask,dilated,render.sourceToClient))continue;\n      return {corner,pass,originalBounds:bounds,effectiveBounds:box,iconClientRect:rect,\n        expansionPerSideSourcePixels:pass==='expanded'?expansion:0,sourceMaskSha256:sourceHash,renderContextToken:render.renderContextToken};\n    }return null;\n  };\n  return test(bounds,'original')||test({left:bounds.left-expansion,top:bounds.top-expansion,right:bounds.right+expansion,bottom:bounds.bottom+expansion},'expanded')||missing;\n}\n\nself.onmessage=e=>{const {id,rgba,width,height,format}=e.data;try{const colorAt=performance.now();const colors=artColors(new Uint8Array(rgba),width,height,format);const colorMs=performance.now()-colorAt;const geomAt=performance.now();const geometry=artGeometry(new Uint8Array(rgba),width,height);const geometryMs=performance.now()-geomAt;self.postMessage({id,ok:true,colors,geometry,colorMs,geometryMs},geometry.packedMask?[geometry.packedMask.buffer]:[]);}catch(error){self.postMessage({id,ok:false,error:String(error?.message||error)});}};\n";
/* Standalone ART producer. No writes to existing QOL/Theme/Species Card globals or DOM. */
const ART_API_VERSION=1,ART_MODULE_VERSION='0.1.0',ART_DB_NAME='yofi-artwork-intelligence',ART_DB_VERSION=1;
const ART_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZ25jYmpqZm1udmJmcmpkeG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk1ODY2MzEsImV4cCI6MTk4NTE2MjYzMX0.RXw9pfN-4qOR2AbqPoM6GMzjDGRwYnClF9LEiI2VE5k';
const ART_RPC='https://api.poke5e.app/rest/v1/rpc/get_fakemon',ART_ASSETS='https://poke5e.auroratide.cloud/';
const ART_FAST_KEY='yofi-artwork-intelligence-lastgood-v1';
const ART_STORES={fakemon:['fakemonRecords','fakemonMasks','fakemonStatus'],pokemon:['pokemonRecords','pokemonMasks','pokemonStatus']};
const artSafeCopy=x=>x==null?x:structuredClone(x);
function artSha256Sync(bytes){
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  const n=bytes.length,L=((n+9+63)>>6)<<6,msg=new Uint8Array(L);msg.set(bytes);msg[n]=128;
  const hi=Math.floor(n/0x20000000),lo=(n*8)>>>0;
  for(let i=0;i<4;i++){msg[L-8+i]=(hi>>>(24-8*i))&255;msg[L-4+i]=(lo>>>(24-8*i))&255;}
  const w=new Uint32Array(64),rot=(x,b)=>(x>>>b)|(x<<(32-b));
  for(let off=0;off<L;off+=64){for(let i=0;i<16;i++){const p=off+i*4;w[i]=((msg[p]<<24)|(msg[p+1]<<16)|(msg[p+2]<<8)|msg[p+3])>>>0;}
    for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2];w[i]=(w[i-16]+(rot(a,7)^rot(a,18)^(a>>>3))+w[i-7]+(rot(b,17)^rot(b,19)^(b>>>10)))>>>0;}
    let [a,b,c,d,e,f,g,q]=h;
    for(let i=0;i<64;i++){const t1=(q+(rot(e,6)^rot(e,11)^rot(e,25))+((e&f)^(~e&g))+K[i]+w[i])>>>0;
      const t2=((rot(a,2)^rot(a,13)^rot(a,22))+((a&b)^(a&c)^(b&c)))>>>0;
      q=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
    for(let i=0;i<8;i++)h[i]=(h[i]+[a,b,c,d,e,f,g,q][i])>>>0;
  }
  return Array.from(h,x=>x.toString(16).padStart(8,'0')).join('');
}
async function artDigest(bytes){if(globalThis.crypto?.subtle){const buffer=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)),x=>x.toString(16).padStart(2,'0')).join('');}return artSha256Sync(bytes);}
function artFormat(bytes){const b=bytes;if(b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71)return 'PNG';if(b[0]===255&&b[1]===216)return 'JPEG';if(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')return 'WEBP';if(String.fromCharCode(...b.slice(0,3))==='GIF')return 'GIF';if((b[0]===73&&b[1]===73&&b[2]===42)||(b[0]===77&&b[1]===77&&b[3]===42))return 'TIFF';throw Error('unsupported_image_format');}
async function artDecodeBytes(bytes,format){
  if(format==='PNG'){const exact=await artDecodePngLossless(bytes);if(exact)return exact;}
  const MIME={PNG:'image/png',JPEG:'image/jpeg',WEBP:'image/webp',GIF:'image/gif',TIFF:'image/tiff'};
  const blob=new Blob([bytes],{type:MIME[format]});let image,src=null,decodeMode='';
  try{
    if(typeof createImageBitmap==='function'){
      try{image=await createImageBitmap(blob,{premultiplyAlpha:'none',colorSpaceConversion:'none',imageOrientation:'none'});decodeMode='bitmap-explicit';}
      catch(_){image=await createImageBitmap(blob);decodeMode='bitmap-default';}
    }else{
      src=URL.createObjectURL(blob);const el=new Image();el.decoding='async';el.src=src;
      if(el.decode)await el.decode();else await new Promise((ok,fail)=>{el.onload=ok;el.onerror=fail;});
      image=el;decodeMode='image-element';
    }
    const w=image.width||image.naturalWidth,h=image.height||image.naturalHeight;
    if(!w||!h||w*h>16000000)throw Error('image_dimensions_unsupported');
    const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):Object.assign(document.createElement('canvas'),{width:w,height:h});
    let context;try{context=canvas.getContext('2d',{willReadFrequently:true,colorSpace:'srgb'});}catch(_){context=canvas.getContext('2d',{willReadFrequently:true});}
    if(!context)throw Error('canvas_context_unavailable');context.clearRect(0,0,w,h);context.drawImage(image,0,0);
    const data=context.getImageData(0,0,w,h);
    return {rgba:new Uint8Array(data.data.buffer.slice(0)),width:w,height:h,decodeMode};
  }finally{if(image?.close)image.close();if(src)URL.revokeObjectURL(src);}
}
function artResolveRow(row,readKey){
  if(!row||row.read_key!==readKey)throw Error('fakemon_read_key_mismatch');
  const name=String(row.normal_portrait_filename??'').trim();if(!name)throw Error('normal_portrait_missing');
  if(!Array.isArray(row.type)||!row.type.length||row.type.length>2||row.type.some(t=>!ART_TYPES[t]))throw Error('invalid_native_types');
  let href;try{const u=new URL(name,ART_ASSETS);if(!['https:','http:'].includes(u.protocol)||u.username||u.password||name.split('/').includes('..'))throw Error('unsafe_source');href=u.href;}catch(_){throw Error('invalid_normal_source');}
  return {href,mediaField:'normalPortrait',types:{primary:row.type[0],secondary:row.type[1]??null,signature:row.type.join('/')}};
}
function artRoute(){
  const segments=location.pathname.split('/').filter(Boolean),i=segments.indexOf('fakemon');
  if(i<0||i!==segments.length-1)return null;const action=new URL(location.href).searchParams.get('action');
  if(action&&action!=='info')return null;
  const id=(new URL(location.href).searchParams.get('id')||'').replace(/^F\./i,'').trim();
  return /^[A-Za-z0-9_-]{4,40}$/.test(id)?{namespace:'fakemon',speciesId:id,routeToken:location.pathname+location.search}:null;
}
function artIdentity(namespace,id){if(!ART_STORES[namespace]||typeof id!=='string'||!id.trim())throw Error('invalid_artwork_identity');return namespace+':'+id.replace(/^F\./i,'');}
function artSnapshot(record,cacheSource){if(!record)return null;const {nativeSpeciesId,scanner,...rest}=record;return artSafeCopy({...rest,scannerVersion:scanner.version,cacheSource});}
function artMeaningful(record){if(!record)return null;return JSON.stringify({normalSource:record.normalSource,types:record.types,scanner:record.scanner,color:record.color,geometry:record.geometry});}
function artStatusDefault(){return {state:'missing',previousAvailable:false,latestFailure:null,attemptId:null,lastAttemptAt:null,sourceState:'unresolved'};}
function artSourceDefault(){return {state:'unresolved',candidate:null,lastVerified:null,lastSuccessful:null,latestFailure:null};}
function artCreateRuntime(){
  if(typeof window==='undefined'||typeof document==='undefined')return null;
  if(window.__yofiArtworkIntelligence?.apiVersion===1)return window.__yofiArtworkIntelligence;
  const records=new Map(),maskCache=new Map(),sources=new Map(),statuses=new Map(),failures=new Map(),visited=new Set(),jobs=new Map(),latestTokens=new Map(),cornerCache=new Map();
  const stats={scansCompleted:0,cacheHits:0,idbHydrations:0,sourceRevalidations:0,analysisFailures:0,storageFailures:0,updateEventsPublished:0};
  const startedAt=new Date().toISOString(),dbStatus={state:'opening',version:1};let db=null,ready=false,route=null,jobSerial=0,routeScheduled=false,worker=null,workerFailed=false,workerSeq=0;
  const workerRequests=new Map(),fast=new Map();
  const maskTouch=(key,entry)=>{maskCache.delete(key);maskCache.set(key,entry);while(maskCache.size>5)maskCache.delete(maskCache.keys().next().value);};
  const recordTouch=(key,entry)=>{records.delete(key);records.set(key,entry);while(records.size>50)records.delete(records.keys().next().value);};
  const dispatch=(name,detail)=>document.dispatchEvent(new CustomEvent('yofi:artwork-intelligence:'+name,{detail:artSafeCopy(detail)}));
  const localGet=()=>{try{const saved=JSON.parse(localStorage.getItem(ART_FAST_KEY)||'[]');for(const x of saved){if(x?.schemaVersion===1&&x?.namespace==='fakemon'&&x?.speciesId&&x?.scannerVersion==='1.0.0')fast.set(artIdentity(x.namespace,x.speciesId),x);}}catch(_){}};
  const localPut=(record)=>{const key=artIdentity(record.namespace,record.speciesId);
    fast.delete(key);fast.set(key,{schemaVersion:1,namespace:record.namespace,speciesId:record.speciesId,
      normalSourceHref:record.normalSource.href,contentSha256:record.normalSource.contentSha256,
      typesSignature:record.types.signature,scannerVersion:record.scanner.version,analysisRevision:record.analysisRevision,
      selectedBannerType:record.color.decision.selected_banner_type,selectedTintType:record.color.decision.selected_tint_type});
    while(fast.size>50)fast.delete(fast.keys().next().value);
    try{localStorage.setItem(ART_FAST_KEY,JSON.stringify([...fast.values()]));}catch(_){stats.storageFailures++;}
  };
  localGet();
  const openDB=()=>new Promise(resolve=>{
    if(!globalThis.indexedDB){dbStatus.state='unavailable';stats.storageFailures++;return resolve(null);}
    try{const req=indexedDB.open(ART_DB_NAME,ART_DB_VERSION);
      req.onupgradeneeded=()=>{const target=req.result;for(const types of Object.values(ART_STORES))for(const store of types)if(!target.objectStoreNames.contains(store))target.createObjectStore(store,{keyPath:'speciesId'});};
      req.onblocked=()=>{dbStatus.state='blocked';stats.storageFailures++;resolve(null);};
      req.onerror=()=>{dbStatus.state='unavailable';stats.storageFailures++;resolve(null);};
      req.onsuccess=()=>{db=req.result;dbStatus.state='ready';db.onversionchange=()=>{db.close();db=null;dbStatus.state='unavailable';};resolve(db);};
    }catch(_){dbStatus.state='unavailable';stats.storageFailures++;resolve(null);}
  });
  const readyPromise=openDB().then(()=>{ready=true;dispatch('ready',{apiVersion:1,moduleVersion:ART_MODULE_VERSION,scannerVersion:ART_CONFIG.version});});
  const dbGet=(store,id)=>new Promise(resolve=>{if(!db)return resolve(null);try{const req=db.transaction([store],'readonly').objectStore(store).get(id);req.onsuccess=()=>resolve(req.result??null);req.onerror=()=>resolve(null);}catch(_){resolve(null);}});
  async function hydrate(ns,id,countHydration=false){const key=artIdentity(ns,id);if(records.has(key))return records.get(key).record;
    await readyPromise;const r=await dbGet(ART_STORES[ns][0],id);if(r?.schemaVersion===1&&r.namespace===ns&&r.speciesId===id&&r.scanner?.version==='1.0.0'){
      if(!records.has(key)){recordTouch(key,{record:r,cacheSource:'persisted'});if(countHydration)stats.idbHydrations++;}return records.get(key).record;
    }return null;
  }
  const saveStatus=async(ns,id,status)=>{if(!db)return false;try{return await new Promise(resolve=>{const tx=db.transaction([ART_STORES[ns][2]],'readwrite');tx.objectStore(ART_STORES[ns][2]).put({...status,speciesId:id});tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false);tx.onabort=()=>resolve(false);});}catch(_){return false;}};
  const clearStatus=async(ns,id)=>{if(!db)return false;try{return await new Promise(resolve=>{const tx=db.transaction([ART_STORES[ns][2]],'readwrite');tx.objectStore(ART_STORES[ns][2]).delete(id);tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false);tx.onabort=()=>resolve(false);});}catch(_){return false;}};
  const activeStatus=(key,state,extra={})=>{const st={...artStatusDefault(),...(statuses.get(key)||{}),state,...extra};statuses.set(key,st);return st;};
  async function persist(ns,id,record,mask){
    if(!db)return 'unavailable';
    const [rs,ms]=ART_STORES[ns];
    return new Promise(resolve=>{
      let finished=false,stale=false;const finish=ok=>{if(!finished){finished=true;resolve(ok);}};
      try{
        const tx=db.transaction([rs,ms],'readwrite'),store=tx.objectStore(rs),maskStore=tx.objectStore(ms);
        const prior=store.get(id);
        prior.onsuccess=()=>{
          const old=prior.result;if(old&&old.analysisRevision>=record.analysisRevision){stale=true;tx.abort();return;}
          store.put(record);
          if(mask&&record.geometry.reliable)maskStore.put({speciesId:id,format:'packed-msb-row-v1',width:record.geometry.width,height:record.geometry.height,
            strideBytes:record.geometry.maskStrideBytes,alphaThreshold:1,maskSha256:record.geometry.maskSha256,bytes:mask});
          else maskStore.delete(id);
        };
        prior.onerror=()=>tx.abort();
        tx.oncomplete=()=>finish('persisted');tx.onabort=()=>finish(stale?'stale':'unavailable');tx.onerror=()=>finish('unavailable');
      }catch(_){finish('unavailable');}
    });
  }
  function sourceUpdate(key,mutate){const prev=sources.get(key)||artSourceDefault();const next=artSafeCopy(prev);mutate(next);sources.set(key,next);return next;}
  const markFailure=(ns,id,phase,err,attemptId)=>{
    const key=artIdentity(ns,id),code=String(err?.message||err||'unknown').slice(0,180),item={phase,code,message:code,at:new Date().toISOString()};
    failures.set(key,item);void saveStatus(ns,id,{state:'error',lastFailure:item,attemptId});sourceUpdate(key,s=>{s.state='source_validation_failed';s.latestFailure={phase,code,at:item.at};});
    activeStatus(key,'error',{previousAvailable:records.has(key),latestFailure:code,attemptId,sourceState:'source_validation_failed'});
    if(phase!=='storage')stats.analysisFailures++;else stats.storageFailures++;
    dispatch('status',{apiVersion:1,namespace:ns,speciesId:id,state:'error',attemptId,errorCode:code});
  };
  const fetchTimeout=async(url,opts={})=>{const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),20000);
    try{return await fetch(url,{...opts,signal:ctl.signal});}finally{clearTimeout(timeout);}};
  async function resolveNative(id){
    const response=await fetchTimeout(ART_RPC,{method:'POST',mode:'cors',credentials:'omit',headers:{apikey:ART_ANON_KEY,Authorization:'Bearer '+ART_ANON_KEY,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({_read_key:id})});
    if(!response.ok)throw Error('get_fakemon_http_'+response.status);
    const json=await response.json(),row=(Array.isArray(json)?json:[json]).find(x=>x?.read_key===id);
    return artResolveRow(row,id);
  }
  function createWorker(){if(worker||workerFailed)return worker;
    try{
      const blob=new Blob([ART_WORKER_SOURCE],{type:'text/javascript'});workerBlobUrl=URL.createObjectURL(blob);
      try{worker=new Worker(workerBlobUrl);worker.onmessage=e=>{if(workerBlobUrl){URL.revokeObjectURL(workerBlobUrl);workerBlobUrl=null;}const m=e.data,p=workerRequests.get(m.id);if(!p)return;workerRequests.delete(m.id);clearTimeout(p.timeout);m.ok?p.resolve(m):p.reject(Error(m.error||'worker_scan_failed'));};
        worker.onerror=()=>{if(workerBlobUrl){URL.revokeObjectURL(workerBlobUrl);workerBlobUrl=null;}workerFailed=true;worker?.terminate();worker=null;for(const p of workerRequests.values()){clearTimeout(p.timeout);p.reject(Error('worker_failed'));}workerRequests.clear();};
      }catch(error){if(workerBlobUrl){URL.revokeObjectURL(workerBlobUrl);workerBlobUrl=null;}throw error;}
    }catch(_){workerFailed=true;worker=null;}
    return worker;
  }
  const runAnalysis=async(rgba,width,height,format)=>{
    const engine=createWorker();if(engine){try{const result=await new Promise((resolve,reject)=>{const id=++workerSeq;const timeout=setTimeout(()=>{workerRequests.delete(id);reject(Error('worker_timeout'));},30000);workerRequests.set(id,{resolve,reject,timeout});
      try{const transferable=rgba.slice();engine.postMessage({id,rgba:transferable.buffer,width,height,format},[transferable.buffer]);}catch(e){workerRequests.delete(id);clearTimeout(timeout);reject(e);}});return result;
    }catch(_){if(workerBlobUrl){URL.revokeObjectURL(workerBlobUrl);workerBlobUrl=null;}workerFailed=true;worker?.terminate();worker=null;}}
    // If a CSP disallows blob workers, yield before and between non-DOM phases;
    // exact scanner work is still blocking and this is reported in diagnostics.
    await new Promise(resolve=>setTimeout(resolve,0));const colorAt=performance.now(),colors=artColors(rgba,width,height,format),colorMs=performance.now()-colorAt;
    await new Promise(resolve=>setTimeout(resolve,0));const geomAt=performance.now(),geometry=artGeometry(rgba,width,height),geometryMs=performance.now()-geomAt;
    return {ok:true,colors,geometry,colorMs,geometryMs};
  };
  async function visit(ns,id,routeToken){
    const key=artIdentity(ns,id);if(visited.has(key)&&statuses.get(key)?.state!=='error')return jobs.get(key)||null;visited.add(key);
    const generation=(latestTokens.get(key)||0)+1;latestTokens.set(key,generation);
    const attemptId=String(++jobSerial),at=new Date().toISOString(),attemptStarted=performance.now();stats.sourceRevalidations++;
    activeStatus(key,'validating',{attemptId,lastAttemptAt:at,previousAvailable:records.has(key),sourceState:'unresolved'});
    const job=(async()=>{
      let phase='source';try{
        const previous=await hydrate(ns,id,true),native=await resolveNative(id);
        if(latestTokens.get(key)!==generation)return;
        sourceUpdate(key,s=>{s.state='source_resolved';s.candidate={href:native.href,mediaField:'normalPortrait',typesSignature:native.types.signature,
          routeToken,contentSha256:null,decodedRgbaSha256:null,width:null,height:null,imageFormat:null};s.lastSuccessful=previous?.normalSource??null;s.latestFailure=null;});
        activeStatus(key,'validating',{sourceState:'source_resolved',previousAvailable:!!previous});
        phase='source';const resp=await fetchTimeout(native.href,{mode:'cors',credentials:'omit',cache:'no-cache'});
        if(!resp.ok)throw Error('normal_art_http_'+resp.status);
        const bytes=new Uint8Array(await resp.arrayBuffer()),fmt=artFormat(bytes),sha=await artDigest(bytes);
        if(latestTokens.get(key)!==generation)return;
        sourceUpdate(key,s=>{s.state='source_bytes_verified';s.candidate.contentSha256=sha;s.candidate.imageFormat=fmt;s.lastVerified={href:native.href,contentSha256:sha};});
        activeStatus(key,'validating',{sourceState:'source_bytes_verified'});
        const same=previous&&previous.normalSource?.contentSha256===sha&&previous.scanner?.version==='1.0.0'&&previous.scanner?.configSha256===ART_CONFIG_SHA;
        if(same&&(!previous.geometry.reliable||await maskStored(ns,id))){
          let next=artSafeCopy(previous);
          sourceUpdate(key,s=>{s.candidate.decodedRgbaSha256=previous.normalSource.decodedRgbaSha256;s.candidate.width=previous.normalSource.width;s.candidate.height=previous.normalSource.height;});
          next.normalSource.href=native.href;next.types=native.types;
          if(previous.types.signature!==native.types.signature)next.color.decision=artDecide(next.color.stats,native.types.primary,native.types.secondary);
          next.lastSuccessfulValidationAt=new Date().toISOString();
          const changed=artMeaningful(next)!==artMeaningful(previous);
          if(changed)next.analysisRevision=(previous.analysisRevision||0)+1;
          if(changed){const oldMask=next.geometry.reliable?await maskStored(ns,id):null;
            if(!await commitResult(ns,id,next,oldMask,previous,key,attemptId,routeToken))return;}
          else{
            // Updating a validation timestamp is not an update event; preserve IDB record.
            const stored=await persistValidationTime(ns,id,next);if(db&&!stored)stats.storageFailures++;recordTouch(key,{record:next,cacheSource:stored?'persisted':'memory'});
          }
          sourceUpdate(key,s=>{s.state='analysis_complete';s.lastSuccessful=next.normalSource;});
          activeStatus(key,'ready',{sourceState:'analysis_complete',latestFailure:null});failures.delete(key);return;
        }
        phase='decode';const decodeAt=performance.now(),decoded=await artDecodeBytes(bytes,fmt);const decodeMs=performance.now()-decodeAt;
        const rgbaSha=await artDigest(decoded.rgba);
        if(latestTokens.get(key)!==generation)return;
        sourceUpdate(key,s=>{s.state='decoded_image_verified';s.candidate.decodedRgbaSha256=rgbaSha;
          s.candidate.width=decoded.width;s.candidate.height=decoded.height;s.candidate.imageFormat=fmt;});
        activeStatus(key,'analyzing',{sourceState:'decoded_image_verified'});
        phase='analysis';const scanAt=performance.now(),analysis=await runAnalysis(decoded.rgba,decoded.width,decoded.height,fmt),scanMs=performance.now()-scanAt;
        if(latestTokens.get(key)!==generation)return;
        const color=analysis.colors,geo=analysis.geometry;
        const mask=geo.reliable?geo.packedMask:null,maskSha=mask?await artDigest(mask):null;
        if(maskSha)geo.maskSha256=maskSha;
        const geometryRecord={state:geo.state,reliable:geo.reliable,alphaThreshold:1,reliabilityReason:geo.reliabilityReason,width:decoded.width,height:decoded.height,
          bounds:geo.bounds,occupiedPixels:geo.occupiedPixels,observedOccupancy:geo.observedOccupancy,visualBoundsAlpha128:geo.visualBoundsAlpha128,
          components:geo.components,holes:geo.holes,maskFormat:geo.reliable?'packed-msb-row-v1':null,
          maskStrideBytes:geo.maskStrideBytes,maskLength:geo.reliable?mask.length:null,maskSha256:maskSha,
          transparency:geo.transparency};
        const now=new Date().toISOString(),next={schemaVersion:1,namespace:ns,speciesId:id,nativeSpeciesId:'F.'+id,
          analysisRevision:(previous?.analysisRevision||0)+1,
          normalSource:{href:native.href,mediaField:'normalPortrait',contentSha256:sha,decodedRgbaSha256:rgbaSha,
            width:decoded.width,height:decoded.height,imageFormat:fmt,decodeMode:decoded.decodeMode},
          types:native.types,scanner:{version:'1.0.0',configSha256:ART_CONFIG_SHA,referenceSha256:ART_REFERENCE_SHA},
          color:{state:'ready',stats:color,decision:artDecide(color,native.types.primary,native.types.secondary)},geometry:geometryRecord,
          lastSuccessfulAnalysisAt:now,lastSuccessfulValidationAt:now};
        stats.scansCompleted++;
        if(!await commitResult(ns,id,next,mask,previous,key,attemptId,routeToken))return;
        sourceUpdate(key,s=>{s.state='analysis_complete';s.lastSuccessful=next.normalSource;});
        activeStatus(key,'ready',{sourceState:'analysis_complete',latestFailure:null});failures.delete(key);
        // Last scan timings are diagnostic-only and never part of the color decision.
        timing.set(key,{...timing.get(key),decodeMs,colorScanMs:analysis.colorMs,geometryMs:analysis.geometryMs,
          analysisAndGeometryMs:scanMs,totalAcquisitionToRecordMs:performance.now()-attemptStarted,
          sourceBytes:bytes.length,decodeMode:decoded.decodeMode,
          memoryProxyBytes:decoded.width*decoded.height*(4+1+8+24+1+1)+(Math.ceil(decoded.width/8)*decoded.height),
          memoryProxyNote:'Conservative known typed-array allocation proxy, not measured peak process memory.'});
      }catch(err){markFailure(ns,id,phase,err,attemptId);}
    })().finally(()=>jobs.delete(key));jobs.set(key,job);return job;
  }
  const timing=new Map();
  async function maskStored(ns,id){const key=artIdentity(ns,id),cached=maskCache.get(key);if(cached)return cached.bytes.slice();
    const r=await dbGet(ART_STORES[ns][1],id);if(!r)return null;return new Uint8Array(r.bytes).slice();}
  async function persistValidationTime(ns,id,next){if(!db)return false;try{return await new Promise(resolve=>{
    const tx=db.transaction([ART_STORES[ns][0]],'readwrite');tx.objectStore(ART_STORES[ns][0]).put(next);tx.oncomplete=()=>resolve(true);tx.onabort=()=>resolve(false);tx.onerror=()=>resolve(false);});}catch(_){return false;}}
  async function commitResult(ns,id,next,mask,previous,key,attemptId,requestRouteToken){
    const storageStarted=performance.now(),outcome=await persist(ns,id,next,mask);
    timing.set(key,{...timing.get(key),storageWriteMs:performance.now()-storageStarted});
    if(outcome==='stale')return false;
    const persistent=outcome==='persisted';if(!persistent)stats.storageFailures++;
    else void clearStatus(ns,id);
    recordTouch(key,{record:next,cacheSource:persistent?'persisted':'memory'});
    if(next.geometry.reliable&&mask){maskTouch(key,{bytes:mask.slice(),recordRevision:next.analysisRevision});}
    else maskCache.delete(key);
    localPut(next);
    if(artMeaningful(previous)!==artMeaningful(next)){
      stats.updateEventsPublished++;
      dispatch('updated',{apiVersion:1,namespace:ns,speciesId:id,analysisRevision:next.analysisRevision,normalSource:next.normalSource.href,
        contentSha256:next.normalSource.contentSha256,typesSignature:next.types.signature,scannerVersion:'1.0.0',
        recordSchemaVersion:1,requestRouteToken});
    }
    return true;
  }
  async function lookup(ns,id){const key=artIdentity(ns,id);const entry=records.get(key);if(entry)return artSnapshot(entry.record,entry.cacheSource);
    const r=await hydrate(ns,id);return artSnapshot(r,records.get(key)?.cacheSource||'persisted');}
  async function silhouette(ns,id){const key=artIdentity(ns,id);const record=await hydrate(ns,id);
    if(!record?.geometry?.reliable)return null;
    let bytes=maskCache.get(key)?.bytes;if(!bytes){const stored=await dbGet(ART_STORES[ns][1],id);
      if(!stored||stored.maskSha256!==record.geometry.maskSha256)return null;bytes=new Uint8Array(stored.bytes);maskTouch(key,{bytes:bytes.slice(),recordRevision:record.analysisRevision});}
    if(artSha256Sync(bytes)!==record.geometry.maskSha256)return null;
    return {format:'packed-msb-row-v1',width:record.geometry.width,height:record.geometry.height,
      strideBytes:record.geometry.maskStrideBytes,alphaThreshold:1,maskSha256:record.geometry.maskSha256,
      bounds:artSafeCopy(record.geometry.bounds),occupiedPixels:record.geometry.occupiedPixels,bytes:bytes.slice()};
  }
  function decodeSilhouette(enc){if(!enc||typeof enc.maskSha256!=='string'||artSha256Sync(enc.bytes)!==enc.maskSha256)throw Error('mask_hash_mismatch');return artDecodeSilhouette(enc);}
  function recommendCorner(ns,id,render){const key=artIdentity(ns,id),entry=records.get(key),mask=maskCache.get(key);
    if(!entry?.record.geometry.reliable||!mask||mask.recordRevision!==entry.record.analysisRevision||
      render?.normalSource!==entry.record.normalSource.href||render?.normalSourceSha256!==entry.record.normalSource.contentSha256)return null;
    const m=artDecodeSilhouette({format:'packed-msb-row-v1',alphaThreshold:1,width:entry.record.geometry.width,height:entry.record.geometry.height,
      strideBytes:entry.record.geometry.maskStrideBytes,bytes:mask.bytes});
    const result=artRecommend(m,entry.record.geometry.bounds,render,entry.record.geometry.maskSha256);
    cornerCache.set(key,result);return artSafeCopy(result);
  }
  async function inspect(ns,id){const s=await lookup(ns,id),persistedFailure=await dbGet(ART_STORES[ns][2],id);
    const key=artIdentity(ns,id),src=sources.get(key)||artSourceDefault(),status=statusFor(ns,id),r=s||null,
      g=r?.geometry??null,c=r?.color??null,d=c?.decision??{},v=c?.stats??{},t=g?.transparency??null;
    return {apiVersion:1,schemaVersion:1,namespace:ns,speciesId:id,moduleVersion:ART_MODULE_VERSION,scannerVersion:'1.0.0',
      recordState:status.state,cacheSource:s?.cacheSource??null,normalArtworkUrl:src.candidate?.href??null,
      normalSourceState:src.state,candidateNormalSourceSha256:src.candidate?.contentSha256??null,
      candidateDecodedRgbaSha256:src.candidate?.decodedRgbaSha256??null,
      lastSuccessfulArtworkUrl:r?.normalSource?.href??null,normalSourceSha256:r?.normalSource?.contentSha256??null,
      decodedRgbaSha256:r?.normalSource?.decodedRgbaSha256??null,imageFormat:r?.normalSource?.imageFormat??null,
      sourceDimensions:r?{width:r.normalSource.width,height:r.normalSource.height}:null,analyzerResultVersion:r?.scannerVersion??null,
      analysisRevision:r?.analysisRevision??null,lastSuccessfulAnalysisAt:r?.lastSuccessfulAnalysisAt??null,
      lastSuccessfulValidationAt:r?.lastSuccessfulValidationAt??null,lastValidationAttemptAt:status.lastAttemptAt,
      lastFailure:artSafeCopy(failures.get(key)??persistedFailure?.lastFailure??null),primaryType:r?.types.primary??null,secondaryType:r?.types.secondary??null,
      selectedBannerType:d.selected_banner_type??null,selectedTintType:d.selected_tint_type??null,
      averageColor:v.average_color??null,rawAlphaAverageColor:v.raw_alpha_average_color??null,
      dominantColor:v.dominant_color??null,dominantCoverage:v.dominant_coverage??null,clusters:v.clusters??null,
      colorVisiblePixels:v.visible_pixels??null,backgroundPixelsRemoved:v.background_pixels_removed??null,
      outlinePixelsDiscounted:v.outline_pixels_discounted??null,nearBlackBodyFraction:v.near_black_body_fraction??null,
      nearWhiteBodyFraction:v.near_white_body_fraction??null,
      cie76:{averagePrimary:d.delta_e_average_primary??null,dominantPrimary:d.delta_e_dominant_primary??null,
        combinedPrimary:d.combined_score_primary??null,averageSecondary:d.delta_e_average_secondary??null,
        dominantSecondary:d.delta_e_dominant_secondary??null,combinedSecondary:d.combined_score_secondary??null,confidenceMargin:d.confidence_margin??null},
      transparency:t?{...t,scannerAlphaThreshold:128,geometryAlphaThreshold:1}:null,
      geometry:{state:g?.state??null,reliable:g?.reliable??false,maskFormat:g?.maskFormat??null,
        width:g?.width??null,height:g?.height??null,strideBytes:g?.maskStrideBytes??null,maskSha256:g?.maskSha256??null,
        maskByteLength:g?.maskLength??null,bounds:g?.bounds??null,observedOccupancyBounds:g?.observedOccupancy?.bounds??null,
        visualBoundsAlpha128:g?.visualBoundsAlpha128??null,occupiedPixels:g?.occupiedPixels??null,
        disconnectedComponents:g?.components??null,interiorHoles:g?.holes??null},
      automaticCorner:artSafeCopy(cornerCache.get(key)??null),timing:artSafeCopy(timing.get(key)??null)};
  }
  function statusFor(ns,id){const key=artIdentity(ns,id),s=statuses.get(key),rec=records.get(key);
    return artSafeCopy(s||{...artStatusDefault(),state:rec?'cached':'missing',previousAvailable:!!rec,sourceState:sources.get(key)?.state??'unresolved'});
  }
  function currentContext(){return artSafeCopy(route?{...route,normalSource:sources.get(artIdentity('fakemon',route.speciesId))?.candidate?.href??null,
    typesSignature:sources.get(artIdentity('fakemon',route.speciesId))?.candidate?.typesSignature??null}:null);}
  function diagnostics(){const src=route?sources.get(artIdentity('fakemon',route.speciesId)):null;
    return artSafeCopy({apiVersion:1,moduleVersion:ART_MODULE_VERSION,scannerVersion:'1.0.0',scannerReferenceSha256:ART_REFERENCE_SHA,
      ready,currentSpecies:route?{namespace:'fakemon',speciesId:route.speciesId}:null,
      currentNormalSourceUrl:src?.candidate?.href??null,currentContentSha256:src?.candidate?.contentSha256??null,
      sessionStartedAt:startedAt,db:dbStatus,counters:stats,worker:{mode:worker?'blob-worker':workerFailed?'main-thread-fallback':'not-started'}});
  }
  function lastGoodDecision(ns,id){const key=artIdentity(ns,id),saved=fast.get(key),candidate=sources.get(key)?.candidate;
    if(!saved||!candidate||candidate.href!==saved.normalSourceHref||candidate.typesSignature!==saved.typesSignature||saved.scannerVersion!=='1.0.0')return null;
    return artSafeCopy({...saved,cacheSource:'localStorage',validatedFresh:false});
  }
  const api={apiVersion:1,moduleVersion:ART_MODULE_VERSION,scannerVersion:'1.0.0',
    get ready(){return ready;},whenReady:()=>readyPromise,
    currentContext,lastGoodDecision,peek:(ns,id)=>{const e=records.get(artIdentity(ns,id));return e?artSnapshot(e.record,e.cacheSource):null;},
    lookup,status:statusFor,source:(ns,id)=>artSafeCopy(sources.get(artIdentity(ns,id))||artSourceDefault()),
    silhouette,decodeSilhouette,recommendCorner,inspect,diagnostics};
  Object.freeze(api);Object.defineProperty(window,'__yofiArtworkIntelligence',{value:api,writable:false,configurable:false});
  function updateRoute(){const next=artRoute();if(next&&route&&next.routeToken===route.routeToken)return;route=next;if(!route)return;const {namespace,speciesId,routeToken}=route;
    void visit(namespace,speciesId,routeToken);}
  function scheduleRoute(){if(routeScheduled)return;routeScheduled=true;queueMicrotask(()=>{routeScheduled=false;updateRoute();});}
  for(const event of ['popstate','hashchange','pageshow'])window.addEventListener(event,scheduleRoute,{passive:true});
  for(const event of ['yofi:species-card-prepare-before-reveal','yofi:species-card-presentation-ready'])document.addEventListener(event,scheduleRoute,{passive:true});
  if(window.navigation?.addEventListener)window.navigation.addEventListener('navigate',()=>setTimeout(scheduleRoute,0));
  // Native SvelteKit can route without popstate. Instrument only History methods,
  // once, and do not observe or scan the DOM. No other userscript is required.
  for(const name of ['pushState','replaceState']){
    const previous=history[name];if(previous.__artRouteWrapped)continue;
    const wrap=function(...args){const result=Reflect.apply(previous,this,args);scheduleRoute();return result;};
    wrap.__artRouteWrapped=true;history[name]=wrap;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleRoute,{once:true});else scheduleRoute();
  return api;
}

const ART_CONFIG_SHA=artSha256Sync(new TextEncoder().encode(JSON.stringify(ART_CONFIG)));
if(typeof module!=="undefined"&&module.exports)module.exports={artRound,artHex,artLab,artDecide,artColors,artGeometry,artDistanceToBackground,artSha256Sync,artDecodeSilhouette,artAffineCollision,artRecommend,artResolveRow,artCreateRuntime,artFormat,artDecodeBytes,artConfig:ART_CONFIG};
if(typeof window!=="undefined"&&typeof document!=="undefined")artCreateRuntime();
})();
