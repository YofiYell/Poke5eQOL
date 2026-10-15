import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import path from 'node:path';
import {TYPE_COLORS,lab,rgb,hexcolor,decide} from '../reference/color_math_reference.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fixtures=JSON.parse(readFileSync(path.join(root,'fixtures/expected/python_reference_results.json'),'utf8')).results;
const manifest=JSON.parse(readFileSync(path.join(root,'fixtures/synthetic_manifest.json'),'utf8')).fixtures;
test('18 exact Scarlet/Violet reference colors',()=>{assert.equal(Object.keys(TYPE_COLORS).length,18);assert.equal(TYPE_COLORS.fairy,'#BA7FB5');});
test('NumPy half-to-even rounding in hexcolor',()=>assert.equal(hexcolor([.5,1.5,2.5]),'#000202'));
test('CIE Lab white reference',()=>{const white=lab(rgb('#FFFFFF'));assert.ok(Math.abs(white[0]-100)<.001);assert.ok(Math.abs(white[1])<.001);});
test('Python vs JS decision math on 13 executed synthetic color outputs',()=>{
  let matches=0;
  for(const f of fixtures){if(f.scan.status!=='ok')continue;
    const meta=manifest.find(x=>x.name===f.name);const source=f.scan.colors;
    const js=decide({...source,primary_type:meta.primary_type,secondary_type:meta.secondary_type});
    const py=f.scan.decision;
    assert.equal(js.selected_banner_type,py.selected_banner_type,f.name);
    assert.equal(js.selected_tint_type,py.selected_tint_type,f.name);
    assert.equal(js.metrics_disagree,py.metrics_disagree,f.name);
    assert.ok(Math.abs(js.averages[0]-py.delta_e_average_primary)<.000002,f.name);
    assert.ok(Math.abs(js.dominants[0]-py.delta_e_dominant_primary)<.000002,f.name);
    assert.ok(Math.abs(js.scores[0]-py.combined_score_primary)<.000002,f.name);
    assert.ok(Math.abs(js.scores[1]-py.combined_score_secondary)<.000002,f.name);
    matches++;
  }
  assert.equal(matches,13);
});
test('argmin tie chooses first and near tie remains deterministic',()=>{
  let tie=decide({primary_type:'water',secondary_type:'water',average_color:'#4C79BC',dominant_color:'#4C79BC'});
  assert.equal(tie.selected_banner_type,'water');assert.equal(tie.confidence_margin,0);
  let near=decide({primary_type:'ghost',secondary_type:'psychic',average_color:'#AA7364',dominant_color:'#AA7364'});
  assert.ok(near.confidence_margin<.01);
});
