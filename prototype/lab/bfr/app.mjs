import {run,defaults,SLOTS,HORIZON,PBFD,MAXCOUNT,PERIOD,THRESHOLD} from './model.mjs';
import {wireBackLink,$} from '../../assets/explain/shell.mjs';

wireBackLink($('#back'));

const PRESETS=[
  {name:'Detected despite a gap',p:{...defaults}},
  {name:'Counter reset',p:{...defaults,bfi:[20,40,160]}},
  {name:'Sparse failures',p:{...defaults,bfi:[20,60,100,140,180],pbfd:1,maxCount:3}},
  {name:'Candidate too weak',p:{...defaults,rsrp:-105}},
  {name:'Preamble sent, no answer',p:{...defaults,response:false}},
];
let p={...defaults},current=PRESETS[0].name;

const pos=t=>100*t/HORIZON;
const ms=t=>`${t} ms`;

function verdict(r){
  const peak=Math.max(0,...r.events.filter(e=>e.type==='bfi').map(e=>e.count));
  const exp=r.events.filter(e=>e.type==='expire');
  if(r.detectAt===null)return `<b>Not detected.</b> BFI_COUNTER peaked at ${peak} of ${r.maxCount}.`+(exp.length?` The timer expired at ${exp.map(e=>ms(e.t)).join(', ')} and reset it each time.`:' Add more BFIs, closer together.');
  const head=`<b>Detected at ${ms(r.detectAt)}</b>: the counter reached ${r.maxCount}`+(exp.length?` (after ${exp.length} reset${exp.length>1?'s':''})`:'')+'. ';
  const o=r.recovery.outcome;
  if(o==='recovered')return head+`<b>Recovered at ${ms(r.recovery.recoveredAt)}</b>, when the C-RNTI PDCCH arrived on recoverySearchSpace.`;
  if(o==='notEligible')return head+'<b>Not recovered by the dedicated path:</b> its resources are not eligible (gate 2).';
  return head+'<b>Not recovered:</b> the preamble was sent, but no qualifying response came in the window.';
}

function renderTimeline(r){
  const bfi=new Set(r.p.bfi),ev=Object.fromEntries(r.events.filter(e=>e.type==='bfi').map(e=>[e.t,e]));
  $('#slots').innerHTML=SLOTS.map(t=>{
    const on=bfi.has(t),frozen=r.detectAt!==null&&t>r.detectAt,e=ev[t];
    const cls=[on?'on':'',frozen?'frozen':'',t===r.detectAt?'det':'',e?.tie?'tie':''].join(' ');
    const label=`${ms(t)}: ${on?'BFI':'no BFI'}${frozen?' (after detection, not modelled)':''}${e?.tie?', exactly at timer deadline':''}`;
    return `<button class="slot ${cls}" style="left:${pos(t)}%" data-t="${t}" aria-pressed="${on}" aria-label="${label}" title="${label}">${on?'✕':''}${e?.tie?'<small>tie</small>':''}</button>`;
  }).join('')+(r.detectAt!==null?`<div class="frozen-band" style="left:${pos(r.detectAt+PERIOD/2)}%"><span>not modelled after detection</span></div>`:'');

  $('#t-len').textContent=`pbfd${r.p.pbfd} = ${r.T} ms`;
  $('#timers').innerHTML=r.timers.map(tm=>{
    const w=pos(tm.end-tm.start),tag=tm.how==='expired'?`<span class="cap">expired</span>`:'';
    return `<div class="tbar ${tm.how}" style="left:${pos(tm.start)}%;width:${w}%">${tag}</div>`;
  }).join('');

  const max=r.maxCount,y=v=>92-v/max*76;
  let d='';
  for(const c of r.counter)d+=d?`H${c.t}V${y(c.v)}`:`M0 ${y(c.v)}`;
  d+=`H${r.detectAt!==null&&r.recovery.outcome!=='recovered'?r.detectAt:HORIZON}`;
  const labels=r.counter.slice(1).map(c=>`<span class="cv ${c.v===max?'hit':''} ${c.recovered?'rec':''}" style="left:${pos(c.t)}%;top:${y(c.v)}%">${c.recovered?'0 · recovered':c.v===0?'0 · reset':c.v}</span>`).join('');
  $('#counter').innerHTML=`<svg viewBox="0 0 ${HORIZON} 100" preserveAspectRatio="none" aria-hidden="true"><line x1="0" x2="${HORIZON}" y1="${y(max)}" y2="${y(max)}" class="maxl"/><path d="${d}" class="step"/></svg><span class="maxlab" style="top:${y(max)}%">max ${max}</span>${labels}`;

  let axis='';for(let t=0;t<=HORIZON;t+=PERIOD)axis+=`<i style="left:${pos(t)}%"></i>`+(t%40===0?`<span class="${t===0?'first':t===HORIZON?'last':''}" style="left:${pos(t)}%">${t===HORIZON?t+' ms':t}</span>`:'');
  $('#axis').innerHTML=axis;
  let marks='';
  // Labels live in a reserved strip above the lanes: detection on row 1, recovery on row 2, flipped near the right edge.
  const side=t=>pos(t)>70?'end':'';
  if(r.detectAt!==null){
    marks+=`<div class="vmark det" style="left:${pos(r.detectAt)}%"><span class="${side(r.detectAt)}">detected → RA</span></div>`;
    if(r.recovery.outcome==='recovered')marks+=`<div class="vmark rec" style="left:${pos(r.recovery.recoveredAt)}%"><span class="${side(r.recovery.recoveredAt)}">recovered</span></div>`;
  }
  $('#marks').innerHTML=marks;
}

const tick=ok=>ok?'<b class="ok" aria-label="yes">✓</b>':'<b class="no" aria-label="no">✕</b>';
function renderGates(r){
  const R=r.recovery,g=Object.fromEntries(R.gates.map(x=>[x.id,x])),pp=r.p;
  const li=(state,n,title,body,t)=>`<li class="gate ${state}"><span class="gn">${n}</span><div><p class="gt">${title}${t!=null?` <span class="when">t = ${ms(t)}</span>`:''}</p>${body?`<div class="gb">${body}</div>`:''}</div></li>`;
  const out=[];
  out.push(g.ra?li('pass',1,'Beam failure detected → random access starts on the SpCell','The UE stays on this cell. This is not a handover and not an RLF.',g.ra.t)
    :li('wait',1,'Waiting for detection','BFI_COUNTER has not reached beamFailureInstanceMaxCount, so nothing below happens.'));
  if(!g.eligible){
    out.push(li('idle',2,'Dedicated BFR preamble eligible?',''));
    out.push(li('idle',3,'Preamble sent on the chosen candidate beam',''));
    out.push(li('idle',4,'Listen on recoverySearchSpace during ra-ResponseWindow',''));
    out.push(li('idle',5,'PDCCH to the UE’s C-RNTI received?',''));
  }else{
    const c=g.eligible.checks;
    out.push(li(g.eligible.ok?'pass':'fail',2,'Dedicated BFR preamble eligible?',
      `<ul class="checks"><li>${tick(c.cfra)} Contention-free BFR preambles configured by RRC</li><li>${tick(c.timerOk)} beamFailureRecoveryTimer running or not configured</li><li>${tick(c.candOk)} A candidate SSB above threshold: ${pp.rsrp} dBm ${c.candOk?'>':'≤'} ${THRESHOLD} dBm</li></ul>`
      +(g.eligible.ok?'':'<p class="branch">→ MAC carries on with other random-access resource selection, such as contention-based RA (not simulated). A weak candidate does not mean the connection is lost, and this alone is not RLF.</p>')));
    if(g.preamble){
      out.push(li('pass',3,'Preamble sent on the chosen candidate beam','The gNB can tell the new beam from which dedicated preamble arrives. Sending it is <em>not</em> recovery.',g.preamble.t));
      out.push(li('pass',4,'Listen on recoverySearchSpace during ra-ResponseWindow',`The UE looks for a PDCCH addressed to its C-RNTI, not the RA-RNTI response of ordinary random access. Window: ${ms(g.monitor.t)}–${ms(g.monitor.end)} (illustrative).`,g.monitor.t));
      out.push(g.pdcch.ok
        ?li('pass done',5,'PDCCH to the UE’s C-RNTI received → recovered','Random access complete. BFI_COUNTER = 0 and beamFailureRecoveryTimer stopped.',g.pdcch.t)
        :li('fail',5,'No qualifying PDCCH in the window','<p class="branch">→ Not recovered. Random access continues with its normal retry handling (not simulated). One missed response is not, by itself, RLF.</p>',g.pdcch.t));
    }else{
      out.push(li('idle',3,'Preamble sent on the chosen candidate beam','Skipped: the dedicated path is not eligible.'));
      out.push(li('idle',4,'Listen on recoverySearchSpace during ra-ResponseWindow',''));
      out.push(li('idle',5,'PDCCH to the UE’s C-RNTI received?',''));
    }
  }
  $('#gates').innerHTML=out.join('');
}

function render(){
  const r=run(p);
  $('#verdict').innerHTML=verdict(r);renderTimeline(r);renderGates(r);
  $('#pbfd').value=PBFD.indexOf(p.pbfd);$('#pbfd-o').textContent=`pbfd${p.pbfd} · ${p.pbfd*PERIOD} ms`;
  $('#maxc').value=MAXCOUNT.indexOf(p.maxCount);$('#maxc-o').textContent=`n${p.maxCount}`;
  $('#rsrp').value=p.rsrp;$('#rsrp-o').textContent=`${p.rsrp} dBm`;
  const seg=(id,v)=>document.querySelectorAll(`#${id} button`).forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===String(v)));
  seg('cfra',p.cfra?1:0);seg('rectimer',p.recTimer);seg('resp',p.response?1:0);
  document.querySelectorAll('#presets button').forEach(b=>b.setAttribute('aria-pressed',PRESETS[b.dataset.i].name===current));
}
const edit=fn=>{fn();current='';render();};

$('#presets').insertAdjacentHTML('beforeend',PRESETS.map((x,i)=>`<button class="x-chip" data-i="${i}">${x.name}</button>`).join(''));
$('#presets').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const x=PRESETS[b.dataset.i];p={...x.p,bfi:[...x.p.bfi]};current=x.name;render();});
$('#slots').addEventListener('click',e=>{const b=e.target.closest('.slot');if(!b)return;const t=+b.dataset.t;
  edit(()=>{p.bfi=p.bfi.includes(t)?p.bfi.filter(x=>x!==t):[...p.bfi,t].sort((a,b)=>a-b);});
  $(`.slot[data-t="${t}"]`)?.focus();});
$('#pbfd').addEventListener('input',e=>edit(()=>p.pbfd=PBFD[+e.target.value]));
$('#maxc').addEventListener('input',e=>edit(()=>p.maxCount=MAXCOUNT[+e.target.value]));
$('#rsrp').addEventListener('input',e=>edit(()=>p.rsrp=+e.target.value));
$('#cfra').addEventListener('click',e=>{const b=e.target.closest('button');if(b)edit(()=>p.cfra=b.dataset.v==='1');});
$('#rectimer').addEventListener('click',e=>{const b=e.target.closest('button');if(b)edit(()=>p.recTimer=b.dataset.v);});
$('#resp').addEventListener('click',e=>{const b=e.target.closest('button');if(b)edit(()=>p.response=b.dataset.v==='1');});
render();
