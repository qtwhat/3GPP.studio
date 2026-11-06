// Node checks for prototype/lab/bsr/model.mjs. Run: node tests/bsr-model.test.mjs
import assert from 'node:assert/strict';
import {scenario,quantize,buildReport} from '../prototype/lab/bsr/model.mjs';
let n=0;const t=(name,fn)=>{fn();n++;console.log('ok',name);};

t('baseline shared: Short index 16 (1038,1446] holds 1400',()=>{
  const s=scenario({a:1200,b:800,served:600,extra:500,grouping:'shared'});
  assert.deepEqual(s.remaining,[600,800]);
  assert.equal(s.first.format,'Short');assert.equal(s.first.octets,1);
  assert.deepEqual(s.first.fields.map(f=>[f.lcg,f.index,f.lower,f.upper]),[[0,16,1038,1446]]);
  assert.equal(s.steps[2].outside,false);
  assert.equal(s.steps[3].fields[0].actual,1900);assert.equal(s.steps[3].outside,true);
  assert.deepEqual(s.second.fields.map(f=>[f.index,f.lower,f.upper]),[[17,1446,2014]]);
  assert.equal(s.steps[4].outside,false);assert.equal(s.retrigger,false);
});
t('baseline separate: Long 66 (597,635] and 70 (767,817], 3 octets',()=>{
  const s=scenario({a:1200,b:800,served:600,extra:500,grouping:'separate'});
  assert.equal(s.first.format,'Long');assert.equal(s.first.octets,3);
  assert.deepEqual(s.first.fields.map(f=>[f.lcg,f.index,f.lower,f.upper]),[[0,66,597,635],[1,70,767,817]]);
  assert.equal(s.steps[3].fields[0].actual,1100);assert.equal(s.steps[3].fields[0].inside,false);
  assert.equal(s.steps[3].fields[1].inside,true);
});
t('format before, values after: drained LCG listed in Long with index 0',()=>{
  const s=scenario({a:600,b:800,served:600,extra:0,grouping:'separate'});
  assert.equal(s.first.format,'Long');
  assert.deepEqual(s.first.fields.map(f=>[f.lcg,f.index]),[[0,0],[1,70]]);
  // with no extra the refresh only has LCG1 active -> Short
  assert.equal(s.second.format,'Short');assert.deepEqual(s.second.fields.map(f=>[f.lcg,f.index]),[[1,15]]); // Short (745,1038]
});
t('out of date is not the same as out of range: +40 B stays in (1038,1446]',()=>{
  const s=scenario({a:1200,b:800,served:600,extra:40,grouping:'shared'}),f=s.steps[3].fields[0];
  assert.equal(f.actual,1440);assert.equal(f.changed,true);assert.equal(f.inside,true);
  assert.equal(s.steps[3].outdated,true);assert.equal(s.steps[3].outside,false);
  assert.equal(s.steps[2].outdated,false);assert.equal(s.steps[4].outdated,false);
  assert.equal(s.second.fields[0].index,16); // refresh reports the same index
});
t('everything sent: Short LCG0 index 0, later arrival retriggers Regular BSR',()=>{
  const s=scenario({a:600,b:0,served:600,extra:500,grouping:'shared'});
  assert.deepEqual(s.first.fields.map(f=>[f.lcg,f.index]),[[0,0]]);
  assert.equal(s.steps[2].outside,false);assert.equal(s.steps[3].outside,true);assert.equal(s.retrigger,true);
});
t('all-empty Short report is drawn as LCG 0 index 0',()=>{
  const r=buildReport([0,0],[0,0],'separate');assert.equal(r.format,'Short');assert.deepEqual(r.fields.map(f=>[f.lcg,f.index]),[[0,0]]);
});
t('table boundaries: index i means lower < BS <= upper',()=>{
  assert.equal(quantize(10,'Short').index,1);assert.equal(quantize(11,'Short').index,2);
  assert.equal(quantize(1446,'Short').index,16);assert.equal(quantize(1447,'Short').index,17);
  assert.equal(quantize(635,'Long').index,66);assert.equal(quantize(636,'Long').index,67);
  assert.equal(quantize(150001,'Short').upper,Infinity);
});
t('sweep: every report range contains its value; Long only when two groups active before',()=>{
  let c=0;
  for(const a of [100,600,1200,4000])for(const b of [0,50,800,4000])for(const served of [0,600,1500])for(const extra of [0,500,2000])for(const grouping of ['shared','separate']){
    const s=scenario({a,b,served,extra,grouping});
    for(const st of s.steps)if(st.i===2||st.i===4)assert.ok(st.fields.every(f=>f.inside),JSON.stringify({a,b,served,extra,grouping,i:st.i}));
    assert.equal(s.first.format,grouping==='separate'&&a>0&&b>0?'Long':'Short');
    assert.ok(s.served<=a+b&&s.served<=served);
    for(const f of [...s.first.fields,...s.second.fields])assert.ok(f.upper<=10570||f.bytes===0||f.upper>=f.bytes);
    c++;
  }
  console.log('   ',c,'combinations');
});
console.log(`${n} BSR checks passed`);
