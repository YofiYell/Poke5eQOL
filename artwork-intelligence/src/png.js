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
