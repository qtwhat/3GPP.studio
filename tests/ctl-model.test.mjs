// Checks for the cellsTriggeredList teaching model against TS 38.331 V19.3.0 §5.5.4.1, §5.5.4.4 and §5.5.5.1.
// Run from the project folder: node tests/ctl-model.test.mjs
import assert from 'node:assert/strict';
import {run,stateAt,levels,defaults,TIMES,STEP,CELLS,TTT,INTERVAL,AMOUNT,MAXCELLS,entering,leaving} from '../prototype/lab/cells-triggered-list/model.mjs';

const ok=m=>console.log('ok',m);
const sent=r=>r.reports.map(x=>x.sent.map(s=>s.cell).join('')||'-');
const at=r=>r.reports.map(x=>x.t);
const counts=r=>r.reports.map(x=>x.count);
const none=levels([[0,-92]]);

// 1. Baseline walkthrough from the technical baseline.
{
  const r=run();
  assert.deepEqual(at(r),[360,560,800,1000,1360,1760,2000]);
  assert.deepEqual(sent(r),['A','B','B','B','-','A','A']);
  assert.deepEqual(counts(r),[1,1,2,3,4,1,2]);
  assert.deepEqual(r.reports[1].omitted.map(s=>s.cell),['A']);        // in the list, not in the report
  assert.deepEqual(r.reports[1].list.sort(),['A','B']);
  assert.equal(r.timers[0].end,560);assert.equal(r.timers[0].how,'replaced'); // 600 never fires
  assert.ok(!r.log.some(l=>l.t===600));
  assert.deepEqual(stateAt(r,900).list.sort(),['A','B']);assert.equal(stateAt(r,900).count,2);assert.equal(stateAt(r,900).timerDue,null);
  assert.deepEqual(r.member.map(m=>[m.cell,m.start,m.end]),[['A',360,1000],['B',560,1360],['A',1760,2000]]);
  const s=stateAt(r,1500);assert.equal(s.entry,false);assert.deepEqual(s.list,[]);
  ok('baseline: reports 360/560/800/1000/1360/1760/2000, B-only payload at 560, timer replaced, A re-enters as a first cell');
}
// 2. reportOnLeave false: leaving is silent and does not touch the count.
{
  const r=run({onLeave:false});
  assert.deepEqual(at(r),[360,560,800,1760,2000]);
  assert.equal(stateAt(r,1100).count,2);assert.deepEqual(stateAt(r,1100).list,['B']);
  assert.equal(stateAt(r,1400).entry,false);
  ok('reportOnLeave false: no reports at 1000 or 1360, count stays 2, entry still removed when empty');
}
// 3. Between the lines nothing changes; reaching reportAmount keeps membership.
{
  const r=run({levels:{A:levels([[0,-91],[200,-84],[600,-87]]),B:none}});
  assert.deepEqual(at(r),[360,600]);assert.deepEqual(stateAt(r,2000).list,['A']);assert.equal(stateAt(r,2000).count,2);
  assert.ok(!r.ttt.some(x=>x.kind==='leave'));
  ok('-87 dBm between leave -88 and enter -86: A stays; after r2 reports stop and A is still listed');
}
// 4. A dip shorter than timeToTrigger is cancelled; a longer one removes the cell.
{
  const r=run({levels:{A:levels([[0,-91],[200,-84],[760,-89],[840,-84],[1400,-89]]),B:none}});
  const c=r.ttt.find(x=>x.how==='cancelled');assert.deepEqual([c.kind,c.start,c.end],['leave',760,840]);
  assert.deepEqual(r.member.map(m=>[m.start,m.end]),[[360,1560]]);
  ok('80 ms dip cancelled at 840 ms; the dip from 1400 ms removes A at 1560 ms');
}
// 5. Strict inequalities: exactly on either line changes nothing.
{
  const r=run({levels:{A:levels([[0,-91],[200,-86],[1000,-85]]),B:levels([[0,-92],[200,-84],[600,-88]])}});
  assert.ok(!entering(-86,defaults)&&!leaving(-88,defaults)&&entering(-85.5,defaults));
  assert.deepEqual(r.member.map(m=>[m.cell,m.start,m.end]),[['B',360,2000],['A',1160,2000]]);
  ok('-86 dBm never enters, -88 dBm never leaves (Off 3, Hys 1)');
}
// 6. A subsequent cell resets numberOfReportsSent and restarts reporting after reportAmount was reached.
{
  const r=run({levels:{A:levels([[0,-91],[200,-84]]),B:levels([[0,-92],[1000,-83]])}});
  assert.deepEqual(at(r),[360,600,1160,1400]);assert.deepEqual(counts(r),[1,2,1,2]);assert.deepEqual(sent(r),['A','A','B','B']);
  assert.ok(r.counter.some(c=>c.t===1160&&c.v===0&&c.reset));
  ok('B entering at 1160 ms resets the count from 2 to 0 and periodic reports resume');
}
// 7. Payload ordering with maxReportCells 2.
{
  const r=run({maxCells:2});
  assert.deepEqual(r.reports[1].sent.map(s=>[s.cell,s.rsrp]),[['B',-83],['A',-84]]);
  const t=run({maxCells:2,levels:{A:levels([[0,-84]]),B:levels([[0,-84]])}});
  assert.deepEqual(t.reports[0].sent.map(s=>s.cell),['A','B']);
  ok('payload strongest first; equal RSRP listed A then B (page convention)');
}
// 8. timeToTrigger boundaries: offered values are whole sample multiples; one sample short does not trigger.
{
  assert.ok(TTT.every(v=>v%STEP===0));
  const long={A:levels([[0,-91],[200,-84],[1200,-89]]),B:none};
  for(const ttt of TTT){const r=run({ttt,levels:long});assert.deepEqual([r.member[0].start,r.member[0].end],[200+ttt,1200+ttt]);}
  // One sample short of timeToTrigger is not enough: 120 ms above the line with ttt 160 never adds the cell.
  assert.equal(run({levels:{A:levels([[0,-91],[200,-84],[360,-91]]),B:none}}).member.length,0);
  assert.equal(run({levels:{A:levels([[0,-91],[200,-84],[400,-91]]),B:none}}).member[0].start,360);
  ok('every offered timeToTrigger is a multiple of 40 ms and acts exactly ttt after the first sample; 120 ms of 160 is not enough');
}
// 9. Two cells meeting entry on the same sample are added together with one report.
{
  const r=run({maxCells:2,levels:{A:levels([[0,-91],[200,-84]]),B:levels([[0,-91],[200,-83]])}});
  assert.equal(r.reports[0].t,360);assert.deepEqual(sent(r)[0],'BA');assert.equal(r.reports[0].cause,'first');
  assert.equal(r.reports.filter(x=>x.t===360).length,1);
  ok('A and B added together at 360 ms in one report');
}
// 10. Tie convention: a timer expiry on a sample instant is handled before that sample.
{
  const r=run({interval:120,amount:Infinity,levels:{A:levels([[0,-91],[200,-84]]),B:levels([[0,-92],[320,-83]])}});
  const t480=r.reports.filter(x=>x.t===480);
  assert.deepEqual(t480.map(x=>[x.cause,x.count]),[['periodic',2],['subsequent',1]]);
  ok('at 480 ms the periodic report (count 2) comes first, then B enters and resets to 1');
}
// 11. Invariant sweep over parameters and random level traces.
{
  let seed=7;const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;
  let n=0;
  for(const ttt of TTT)for(const interval of INTERVAL)for(const amount of AMOUNT)for(const maxCells of MAXCELLS)for(const onLeave of [true,false])for(const [off,hys] of [[3,1],[0,0],[2.5,0.5],[1,3]]){
    const walk=()=>{let v=-90+Math.round(rnd()*8-4);return TIMES.map(()=>{if(rnd()<.15)v=Math.max(-93,Math.min(-81,v+Math.round(rnd()*8-4)));return v;});};
    const p={ttt,interval,amount,maxCells,onLeave,off,hys,levels:{A:walk(),B:walk()}},r=run(p);n++;
    let prev=0;
    for(const x of r.reports){
      assert.ok(x.sent.length<=maxCells);
      assert.ok(x.sent.every(s=>x.list.includes(s.cell)));
      assert.equal(x.sent.length,Math.min(maxCells,x.list.length));
      for(let i=1;i<x.sent.length;i++)assert.ok(x.sent[i-1].rsrp>=x.sent[i].rsrp);
      if(x.cause==='first'||x.cause==='subsequent')assert.equal(x.count,1);else assert.equal(x.count,prev+1);
      if(x.cause==='periodic')assert.ok(prev<amount);
      prev=x.count;
    }
    // Every add/remove is preceded by a qualifying run of at least timeToTrigger.
    for(const m of r.member){
      const ok=(t0,t1,f)=>TIMES.filter(t=>t>=t0&&t<=t1).every(t=>f(p.levels[m.cell][t/STEP],p));
      const add=r.ttt.find(x=>x.cell===m.cell&&x.kind==='enter'&&x.how==='done'&&x.end===m.start);
      assert.ok(add&&m.start-add.start>=ttt&&ok(add.start,m.start,entering));
      if(!m.open){const rm=r.ttt.find(x=>x.cell===m.cell&&x.kind==='leave'&&x.how==='done'&&x.end===m.end);
        assert.ok(rm&&m.end-rm.start>=ttt&&ok(rm.start,m.end,leaving));}
    }
    for(const s of r.snaps){assert.equal(s.entry,s.list.length>0);if(!s.entry)assert.equal(s.timerDue,null);}
    // Leaving never lowers the count (a same-sample entry may reset it, so those samples are skipped).
    for(const l of r.log.filter(l=>l.kind==='leave'&&!r.log.some(e=>e.kind==='enter'&&e.t===l.t))){const before=stateAt(r,l.t-1).count;assert.ok(stateAt(r,l.t).count>=before||!stateAt(r,l.t).entry);}
  }
  ok(`${n.toLocaleString('en-US')} random parameter/trace combinations keep the invariants`);
}
