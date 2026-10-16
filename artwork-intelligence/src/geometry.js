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
