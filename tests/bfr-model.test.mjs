// Node checks for prototype/lab/bfr/model.mjs. Run: node tests/bfr-model.test.mjs
import assert from 'node:assert/strict';
import {run,detect,recover,PBFD,MAXCOUNT,SLOTS,THRESHOLD} from '../prototype/lab/bfr/model.mjs';
let n=0;const t=(name,fn)=>{fn();n++;console.log('ok',name);};
const counts=r=>r.events.filter(e=>e.type==='bfi').map(e=>[e.t,e.count]);

t('walkthrough: BFI 20,40,80,100 with pbfd4 (80 ms), max 4 -> counts 1..4, detect at 100; quiet 60 ms does not reset',()=>{
  const r=run({bfi:[20,40,80,100],pbfd:4,maxCount:4});
  assert.equal(r.T,80);assert.deepEqual(counts(r),[[20,1],[40,2],[80,3],[100,4]]);
  assert.equal(r.detectAt,100);assert.equal(r.events.filter(e=>e.type==='expire').length,0);
});
t('counterexample: BFI 20,40 then expiry at 120 resets; BFI 160 counts 1',()=>{
  const r=run({bfi:[20,40,160],pbfd:4,maxCount:4});
  assert.deepEqual(r.events.filter(e=>e.type==='expire').map(e=>[e.t,e.from]),[[120,2],[240,1]]);
  assert.deepEqual(counts(r),[[20,1],[40,2],[160,1]]);assert.equal(r.detectAt,null);
  assert.equal(r.recovery.outcome,'none');
});
t('sparse failures with pbfd1: counter never exceeds 1',()=>{
  const r=run({bfi:[20,60,100,140,180],pbfd:1,maxCount:3});
  assert.ok(counts(r).every(([,c])=>c===1));assert.equal(r.detectAt,null);
});
t('pbfd1: only strictly consecutive BFIs accumulate',()=>{
  assert.equal(run({bfi:[20,40,60,80],pbfd:1,maxCount:4}).detectAt,80); // pbfd1: ties at each deadline, BFI first
  assert.equal(run({bfi:[20,40,80,100],pbfd:1,maxCount:4}).detectAt,null); // one quiet period breaks pbfd1
});
t('tie convention is labelled: BFI exactly at deadline is counted first and restarts the timer',()=>{
  const r=detect({bfi:[20,60],pbfd:2,maxCount:4});
  const b=r.events.find(e=>e.type==='bfi'&&e.t===60);assert.equal(b.tie,true);assert.equal(b.count,2);
  assert.equal(r.events.filter(e=>e.type==='expire'&&e.t===60).length,0);
});
t('BFIs after detection are not modelled',()=>{
  const r=run({bfi:[20,40,60,80,100],pbfd:4,maxCount:2});assert.equal(r.detectAt,40);assert.deepEqual(r.ignored,[60,80,100]);
});
t('recovery success: eligible candidate, preamble, recoverySearchSpace C-RNTI PDCCH -> counter 0',()=>{
  const r=run({});assert.equal(r.recovery.outcome,'recovered');assert.equal(r.recovery.recoveredAt,118);
  assert.deepEqual(r.counter.at(-1),{t:118,v:0,recovered:true});
});
t('candidate -105 below -100: not eligible for dedicated CFRA; equality also not "above"',()=>{
  assert.equal(run({rsrp:-105}).recovery.outcome,'notEligible');
  assert.equal(run({rsrp:THRESHOLD}).recovery.outcome,'notEligible');
  assert.equal(run({rsrp:THRESHOLD+1}).recovery.outcome,'recovered');
});
t('no CFRA resources or expired recovery timer: not eligible; timer not configured is eligible',()=>{
  assert.equal(run({cfra:false}).recovery.outcome,'notEligible');
  assert.equal(run({recTimer:'expired'}).recovery.outcome,'notEligible');
  assert.equal(run({recTimer:'none'}).recovery.outcome,'recovered');
});
t('preamble sent but no qualifying PDCCH: not recovered, counter not reset',()=>{
  const r=run({response:false});assert.equal(r.recovery.outcome,'noResponse');
  assert.ok(r.recovery.gates.some(g=>g.id==='preamble'));assert.ok(!r.counter.some(c=>c.recovered));
});
t('sweep: counter never exceeds max, detection iff a count reaches max, timer bars ordered',()=>{
  let c=0;
  for(let mask=0;mask<1<<10;mask+=7)for(const pbfd of PBFD)for(const maxCount of MAXCOUNT){
    const bfi=SLOTS.slice(0,10).filter((_,i)=>mask>>i&1),r=detect({bfi,pbfd,maxCount});
    const cs=r.events.filter(e=>e.type==='bfi').map(e=>e.count);
    assert.ok(cs.every(x=>x<=maxCount));assert.equal(r.detectAt!==null,cs.includes(maxCount));
    for(const tm of r.timers)assert.ok(tm.end>=tm.start&&tm.end-tm.start<=r.T);
    c++;
  }
  console.log('   ',c,'combinations');
});
console.log(`${n} BFR checks passed`);
