/** ART-01 test-only JS translation of Python rgb(), hexcolor(), lab(), decide().
 * NOT a production artwork scanner: no image decode, masking or clustering.
 * Exact palette copied from SHA-verified Python v1.0.0 for parity assertions.
 */
export const TYPE_COLORS = Object.freeze({normal:'#A1A1A1',fire:'#D43A30',fighting:'#F08833',water:'#4C79BC',flying:'#8FB8E4',grass:'#5D9D3C',poison:'#6D4B97',electric:'#F2C341',ground:'#895229',psychic:'#DC4D79',rock:'#ADA984',ice:'#78CCF0',bug:'#95A135',dragon:'#4C60A9',ghost:'#6B426E',dark:'#4E403F',steel:'#74A2B9',fairy:'#BA7FB5'});
export const CONFIG = Object.freeze({average_weight:.5,dominant_weight:.5,delta_e:'CIE76',version:'1.0.0'});
export function rgb(hex){if(!/^#[0-9a-f]{6}$/i.test(hex))throw Error('invalid RGB hex');return [1,3,5].map(i=>Number.parseInt(hex.slice(i,i+2),16));}
export function rint(v){const low=Math.floor(v),frac=v-low;return frac<.5?low:frac>.5?low+1:(low%2===0?low:low+1);}
export function hexcolor(v){return '#'+v.map(x=>Math.min(255,Math.max(0,rint(x))).toString(16).padStart(2,'0')).join('').toUpperCase();}
export function lab(c){
  const v=c.map(x=>{let u=x/255;return u>.04045?((u+.055)/1.055)**2.4:u/12.92;});
  const [R,G,B]=v;
  const xyz=[(R*.4124564+G*.3575761+B*.1804375)/.95047,
             (R*.2126729+G*.7151522+B*.0721750),
             (R*.0193339+G*.1191920+B*.9503041)/1.08883];
  const f=xyz.map(x=>x>216/24389?Math.cbrt(x):(24389/27*x+16)/116);
  return [116*f[1]-16,500*(f[0]-f[1]),200*(f[1]-f[2])];
}
export function cie76(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
export function decide(reference,config=CONFIG){
  const ts=[reference.primary_type,...(reference.secondary_type?[reference.secondary_type]:[])];
  const refs=ts.map(t=>lab(rgb(TYPE_COLORS[t])));
  const averages=refs.map(r=>cie76(r,lab(rgb(reference.average_color))));
  const dominants=refs.map(r=>cie76(r,lab(rgb(reference.dominant_color))));
  const scores=refs.map((_,i)=>(config.average_weight*averages[i]+config.dominant_weight*dominants[i])/(config.average_weight+config.dominant_weight));
  const winner=scores.length===1||scores[0]<=scores[1]?0:1; // np.argmin => first on ties
  return {averages,dominants,scores,selected_banner_type:ts[winner],
    selected_tint_type:ts.length===2?ts[1-winner]:'',
    metrics_disagree:averages.indexOf(Math.min(...averages))!==dominants.indexOf(Math.min(...dominants)),
    confidence_margin:ts.length===2?Math.abs(scores[0]-scores[1]):null};
}
