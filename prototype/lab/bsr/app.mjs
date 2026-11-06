import {defaults,scenario,tableBounds,STEPS} from './model.mjs';
import {wireBackLink,$,fmt} from '../../assets/explain/shell.mjs';

wireBackLink($('#back'));

const LABELS=['Data arrives','PDU built','gNB receives BSR','More data arrives','Next BSR'];
const PRESETS=[
  {name:'Baseline',p:{a:1200,b:800,served:600,extra:500,grouping:'shared'},step:3},
  {name:'Separate groups',p:{a:1200,b:800,served:600,extra:500,grouping:'separate'},step:2},
  {name:'Drain one group',p:{a:600,b:800,served:600,extra:500,grouping:'separate'},step:1},
  {name:'Change within one range',p:{a:1200,b:800,served:600,extra:40,grouping:'shared'},step:3},
  {name:'Everything sent',p:{a:600,b:0,served:600,extra:500,grouping:'shared'},step:3},
  {name:'Big buffer, coarse range',p:{a:4000,b:4000,served:0,extra:2000,grouping:'shared'},step:2},
];
let p={...defaults},step=0;

// Byte bars share one linear scale; the gNB ruler is logarithmic.
const BAR_MAX=6000,LOG_MIN=5,LOG_MAX=16000;
const logPos=v=>Math.max(0,Math.min(100,100*Math.log(v/LOG_MIN)/Math.log(LOG_MAX/LOG_MIN)));
const B=n=>`${fmt(n)} B`;

function renderSteps(){
  $('#steps').innerHTML=LABELS.map((l,i)=>`<li><button data-i="${i}" aria-current="${i===step?'step':'false'}" class="${i<step?'done':''}"><span class="n">${i+1}</span><span>${l}</span></button></li>`).join('');
}

function story(s,sc){
  const g=p.grouping==='shared';
  switch(step){
    case 0:return `${B(p.a)} arrive on A${p.b?` and ${B(p.b)} on B`:''}, into empty buffers. That triggers a <b>Regular BSR</b>. With no uplink grant yet, the UE sends an <b>SR</b>, which asks for an opportunity but carries <b>no byte count</b>. The gNB knows nothing about the size yet.`;
    case 1:{const r=sc.first;return `A grant arrives and <b>${B(sc.served)}</b> of payload leave in this PDU. The BSR travels in the same PDU. Its <b>format</b> was decided from the groups that had data <i>before</i> building (${r.activeBefore.length?r.activeBefore.map(i=>'LCG '+i).join(', '):'none'}), so it is a <b>${r.format} BSR</b>. Its <b>values</b> are what is left <i>after</i> building.`+(r.format==='Long'&&r.fields.some(f=>f.index===0)?' One group was emptied by this PDU, so it is still listed but reports index 0.':'');}
    case 2:return `The gNB decodes the BSR. It now knows a <b>range</b> for ${g?'the single group':'each group'}, not exact bytes${g&&p.b?'. It cannot tell how much of the total belongs to A and how much to B':''}. The UE's real bytes sit inside the band.`;
    case 3:return p.extra?`<b>${B(p.extra)}</b> more arrive on A. The UE's queue changes immediately, but the gNB still holds the report from moment 3. `+(s.outside?'The real value is now <b>outside</b> the reported range.':'The report is <b>out of date</b>, but the real value happens to still lie inside the old range, so the gNB cannot tell anything changed.')+(sc.retrigger?' The relevant buffers were empty, so this arrival triggers a new Regular BSR (SR and grant not drawn).':''):'No new data arrives, so the last report still describes the buffer.';
    case 4:return `At a later reporting opportunity (assumed here, e.g. a periodic BSR, with no further service) a fresh ${sc.second.format} BSR replaces the old one, and the band moves to cover the current bytes.`;
  }
}

function renderUE(s,sc){
  const served=step===1?[sc.takeA,sc.takeB]:[0,0];
  const lc=(name,i)=>{
    const v=s.queues[i],w=100*v/BAR_MAX,sw=100*served[i]/BAR_MAX;
    const added=step>=3&&i===0&&p.extra?100*p.extra/BAR_MAX:0;
    return `<div class="lc"><span class="lc-name lc-${name}">LC ${name}</span><div class="bar" role="img" aria-label="LC ${name}: ${B(v)}"><i class="fill lc-${name}" style="width:${w-added}%"></i>${added?`<i class="fill lc-${name} new" style="width:${added}%"></i>`:''}${sw?`<i class="gone" style="width:${sw}%"></i>`:''}</div><span class="v">${B(v)}</span></div>`;
  };
  const group=(id,rows)=>{
    const total=s.groups[id];
    return `<div class="lcg ${total?'active':''}"><div class="lcg-h"><b>LCG ${id}</b><span>${total?B(total)+' total':'empty'}</span></div>${rows}</div>`;
  };
  $('#ue').innerHTML=(p.grouping==='shared'?group(0,lc('A',0)+lc('B',1)):group(0,lc('A',0))+group(1,lc('B',1)))
    +`<p class="legend">${step===1?'<span class="k gone"></span>sent in this PDU · ':''}${step>=3&&p.extra?'<span class="k new"></span>arrived after the report · ':''}bars share one scale (0–6,000 B)</p>`;
}

const bits=(v,n)=>v.toString(2).padStart(n,'0').split('');
function renderAir(s,sc){
  const r=s.onAir;
  $('#air-h').textContent=step===0?'On the air · Scheduling request':s.onAir?'On the air · BSR MAC CE':'On the air · nothing new';
  if(step===0){$('#air').innerHTML=`<div class="sr"><span class="sr-pulse">SR</span><p>A scheduling request: “please give me an uplink opportunity”. <b>No byte count.</b></p></div>`;return;}
  if(!r){$('#air').innerHTML=`<p class="idle">${step===2?'Received. The gNB keeps this report until another one arrives.':'Nothing new on the air. The gNB still uses the BSR received at moment 3.'}</p>`;return;}
  let html='';
  if(r.format==='Short'){
    const f=r.fields[0];
    html=`<div class="oct"><span class="oct-n">Oct 1</span>${bits(f.lcg,3).map(b=>`<i class="id">${b}</i>`).join('')}${bits(f.index,5).map(b=>`<i class="bs">${b}</i>`).join('')}</div>
    <p class="oct-key"><span class="id">LCG ID = ${f.lcg}</span> <span class="bs">Buffer Size index = ${f.index}</span></p>`;
  }else{
    const set=new Set(r.fields.map(f=>f.lcg));
    html=`<div class="oct"><span class="oct-n">Oct 1</span>${[7,6,5,4,3,2,1,0].map(i=>`<i class="${set.has(i)?'id':''}" title="LCG${i}">${set.has(i)?1:0}</i>`).join('')}</div>`
      +r.fields.map((f,k)=>`<div class="oct"><span class="oct-n">Oct ${k+2}</span>${bits(f.index,8).map(b=>`<i class="bs">${b}</i>`).join('')}</div>`).join('')
      +`<p class="oct-key"><span class="id">Bitmap: LCG ${[...set].join(', ')} present</span> ${r.fields.map(f=>`<span class="bs">LCG ${f.lcg}: index ${f.index}</span>`).join(' ')}</p>`;
  }
  const t=step===1?`<p class="when"><b>Format</b>: ${r.activeBefore.length} group${r.activeBefore.length===1?'':'s'} with data before building → ${r.format}.<br><b>Values</b>: bytes left after building.</p>`:'';
  $('#air').innerHTML=`<p class="fmt"><b>${r.format} BSR</b> · ${r.octets} octet${r.octets>1?'s':''} <span class="muted">(excluding subheader)</span></p>${html}${t}`;
}

function ruler(f,s){
  const fmtName=s.known.format,bounds=tableBounds(fmtName).filter(b=>b>=LOG_MIN&&b<=LOG_MAX);
  const zero=f.index===0,lo=zero?0:logPos(Math.max(f.lower,LOG_MIN)),hi=f.upper===Infinity?100:logPos(f.upper);
  const actualPos=f.actual===0?null:logPos(f.actual);
  const range=zero?'BS = 0':`${fmt(f.lower)} < BS ≤ ${fmt(f.upper)}`;
  const tag=!f.changed?(step===2||step===4?'just received':'received at moment 3 · still accurate'):f.inside?'out of date · still inside range':`out of date · UE now ${B(f.actual)} is outside`;
  const p0=actualPos??0,anchor=p0>72?'end':p0<28?'start':'mid';
  const decade=[10,100,1000,10000].map(d=>`<span class="dec" style="left:${logPos(d)}%">${fmt(d)}</span>`).join('');
  return `<div class="ruler-row ${f.inside?'':'outside'} ${f.changed?'changed':''}">
    <div class="ruler-h"><b>LCG ${f.lcg}</b> · index ${f.index} → <span class="x-mono">${range}</span> <span class="tag">${tag}</span></div>
    <div class="ruler" role="img" aria-label="LCG ${f.lcg}: reported ${range}; UE actually holds ${B(f.actual)}${f.inside?'':', outside the reported range'}">
      <div class="zero ${zero?'band-on':''} ${f.actual===0?'act-on':''}">0</div>
      <div class="track">
        ${bounds.map(b=>`<i class="tick" style="left:${logPos(b)}%"></i>`).join('')}
        ${zero?'':`<div class="r-band" style="left:${lo}%;width:${Math.max(hi-lo,.6)}%"></div>`}
        ${actualPos===null?'':`<div class="r-act" style="left:${actualPos}%"><span class="${anchor}">UE now ${B(f.actual)}</span></div>`}
        ${decade}
      </div>
    </div></div>`;
}
function renderGNB(s){
  if(!s.known){$('#gnb').innerHTML=`<p class="idle">${step===0?'Nothing. An SR tells the gNB that there is data, not how much.':'Not yet. The BSR is on its way inside this PDU.'}</p>`;return;}
  $('#gnb').innerHTML=s.fields.map(f=>ruler(f,s)).join('')
    +`<p class="legend"><span class="k band"></span>reported range · <span class="k act"></span>UE's actual bytes (the gNB cannot see this) · ticks = ${s.known.format} table boundaries</p>`;
}

function render(){
  const sc=scenario(p),s=sc.steps[step];
  renderSteps();$('#story').innerHTML=story(s,sc);renderUE(s,sc);renderAir(s,sc);renderGNB(s);
  $('#prev').disabled=step===0;$('#next').disabled=step===STEPS.length-1;
  for(const k of ['a','b','served','extra']){$('#'+k).value=p[k];$('#'+k+'-o').textContent=B(p[k]);}
  for(const b of document.querySelectorAll('#grouping button'))b.setAttribute('aria-pressed',b.dataset.v===p.grouping);
  for(const b of document.querySelectorAll('#presets button'))b.setAttribute('aria-pressed',PRESETS[b.dataset.i].name===current);
}
let current='Baseline';
const go=i=>{step=Math.max(0,Math.min(STEPS.length-1,i));render();};

$('#presets').insertAdjacentHTML('beforeend',PRESETS.map((x,i)=>`<button class="x-chip" data-i="${i}">${x.name}</button>`).join(''));
$('#presets').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const x=PRESETS[b.dataset.i];p={...x.p};current=x.name;go(x.step);});
$('#steps').addEventListener('click',e=>{const b=e.target.closest('button');if(b)go(+b.dataset.i);});
$('#steps').addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(step+(e.key==='ArrowRight'?1:-1));$(`#steps button[data-i="${step}"]`).focus();}});
$('#prev').onclick=()=>go(step-1);$('#next').onclick=()=>go(step+1);
for(const k of ['a','b','served','extra'])$('#'+k).addEventListener('input',e=>{p[k]=+e.target.value;current='';render();});
$('#grouping').addEventListener('click',e=>{const b=e.target.closest('button');if(b){p.grouping=b.dataset.v;current='';render();}});
render();
