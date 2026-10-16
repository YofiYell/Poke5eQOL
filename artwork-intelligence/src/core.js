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
