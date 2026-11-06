import {run,stateAt,levels,defaults,TIMES,STEP,HORIZON,MP,LEVEL_MIN,LEVEL_MAX,CELLS,TTT,INTERVAL,AMOUNT,levelAt,amountName} from './model.mjs';
import {wireBackLink,$} from '../../assets/explain/shell.mjs';

wireBackLink($('#back'));

const none=levels([[0,-92]]);
const PRESETS=[
  {name:'Walkthrough',cur:560,p:{}},
  {name:'Between the lines',cur:1200,p:{levels:{A:levels([[0,-91],[200,-84],[600,-87]]),B:none}}},
  {name:'Short dip',cur:840,p:{levels:{A:levels([[0,-91],[200,-84],[760,-89],[840,-84],[1400,-89]]),B:none}}},
  {name:'Exactly on the line',cur:960,p:{levels:{A:levels([[0,-91],[200,-86],[1000,-85]]),B:levels([[0,-92],[200,-84],[600,-88]])}}},
  {name:'New cell restarts reports',cur:1160,p:{levels:{A:levels([[0,-91],[200,-84]]),B:levels([[0,-92],[1000,-83]])}}},
];
const copy=x=>({...defaults,...x,levels:{A:[...(x.levels||defaults.levels).A],B:[...(x.levels||defaults.levels).B]}});
let p=copy(PRESETS[0].p),cur=PRESETS[0].cur,paint='A',current=PRESETS[0].name,r=null;

// Figure geometry in CSS pixels; the SVG is redrawn at the container width.
// The figure is five stacked stage panels on one shared time axis. Panel 1 is the input the reader draws;
// panels 2-5 are what the UE derives from it, in causal order. A numbered rail in the left gutter joins them.
const GL=78,GR=18,HEAD=30,GAP=22,DB=17,PH=(LEVEL_MAX-LEVEL_MIN+1)*DB,PLOT_TOP=8+HEAD+8;
let W=900;
const X=t=>GL+(W-GL-GR)*t/HORIZON;
const Y=v=>PLOT_TOP+(LEVEL_MAX+0.5-v)*DB;
const T=x=>Math.max(0,Math.min(HORIZON,(x-GL)/(W-GL-GR)*HORIZON));
const ms=t=>`${Math.round(t)} ms`;
const neg=v=>String(v).replace('-','−'),dbm=v=>`${neg(v)} dBm`;
const MARK={A:(x,y,s=4)=>`<circle cx="${x}" cy="${y}" r="${s}"/>`,B:(x,y,s=4)=>`<rect x="${x-s}" y="${y-s}" width="${2*s}" height="${2*s}"/>`};
const RAIL=20;

function draw(){
  const {p:pp,th}=r;let s='',y=8;
  const panels=[];
  // One stage: panel background, numbered badge, title, plain question and role tag. Returns the content top.
  const stage=(n,cls,title,question,tag,h)=>{
    const top=y;panels.push({n,top,bottom:top+HEAD+h});
    s+=`<rect class="pnl ${cls}" x="4" y="${top}" width="${W-8}" height="${HEAD+h}" rx="6"/>`;
    s+=`<circle class="badge ${cls}" cx="${RAIL}" cy="${top+15}" r="10"/><text class="badgen ${cls}" x="${RAIL}" y="${top+19}" text-anchor="middle">${n}</text>`;
    s+=`<text class="st" x="${RAIL+16}" y="${top+20}">${title}<tspan class="sq" dx="10">${question}</tspan></text>`;
    s+=`<text class="tag ${cls}" x="${W-GR}" y="${top+19}" text-anchor="end">${tag}</text>`;
    y=top+HEAD+h+GAP;return top+HEAD;
  };
  const link=(i,txt)=>{const a=panels[i].bottom,b=a+GAP;s+=`<line class="rail" x1="${RAIL}" x2="${RAIL}" y1="${a}" y2="${b-3}"/><path class="railhead" d="M${RAIL-4} ${b-7}L${RAIL} ${b-2}L${RAIL+4} ${b-7}"/><text class="cap" x="${RAIL+14}" y="${a+15}">${txt}</text>`;};
  const row=(c,base,h)=>base+(c==='A'?0:h);

  // 1. Measured input.
  stage(1,'input','Measured input',`Neighbour RSRP after L3 filtering. Drag to draw cell ${paint}.`,'INPUT · YOU DRAW',PH+30);
  s+=`<g class="mk a">${MARK.A(W-GR-250,PLOT_TOP-7,4.5)}<text x="${W-GR-241}" y="${PLOT_TOP-3}">A solid</text></g><g class="mk b">${MARK.B(W-GR-170,PLOT_TOP-7,4.5)}<text x="${W-GR-161}" y="${PLOT_TOP-3}">B dashed</text></g>`;
  for(let v=LEVEL_MIN;v<=LEVEL_MAX;v++)s+=`<line class="grid" x1="${GL}" x2="${W-GR}" y1="${Y(v)}" y2="${Y(v)}"/>`+(v%2===0||v===MP?'':`<text class="yt" x="${GL-8}" y="${Y(v)+4}" text-anchor="end">${neg(v)}</text>`);
  s+=`<rect class="band" x="${GL}" width="${W-GL-GR}" y="${Y(th.enter)}" height="${Y(th.leave)-Y(th.enter)}"/>`;
  s+=`<line class="spcell" x1="${GL}" x2="${W-GR}" y1="${Y(MP)}" y2="${Y(MP)}"/><text class="yt strong" x="${GL-8}" y="${Y(MP)+4}" text-anchor="end">Mp ${neg(MP)}</text>`;
  s+=`<line class="th enter" x1="${GL}" x2="${W-GR}" y1="${Y(th.enter)}" y2="${Y(th.enter)}"/><line class="th leave" x1="${GL}" x2="${W-GR}" y1="${Y(th.leave)}" y2="${Y(th.leave)}"/>`;
  const tl=(cls,v,txt,dy)=>`<text class="thl ${cls}" x="${W-GR-4}" y="${Y(v)+dy}" text-anchor="end">${txt}</text>`;
  s+=tl('enter',th.enter,`enter: above ${neg(th.enter)} dBm (Mp + Off + Hys)`,-5)+tl('leave',th.leave,`leave: below ${neg(th.leave)} dBm (Mp + Off − Hys)`,13);
  if(th.enter-th.leave>=1.5)s+=`<text class="thl band-l" x="${W-GR-4}" y="${(Y(th.enter)+Y(th.leave))/2+4}" text-anchor="end">no change between the lines</text>`;
  for(const c of CELLS){
    const lv=pp.levels[c];let d=`M${X(0)} ${Y(lv[0])}`;
    lv.forEach((v,i)=>{if(i)d+=`V${Y(v)}`;d+=`H${X(Math.min(HORIZON,TIMES[i]+STEP))}`;});
    s+=`<path class="trace ${c.toLowerCase()}" d="${d}"/>`;
  }
  s+=`<rect class="hit" x="${GL}" y="${PLOT_TOP}" width="${W-GL-GR}" height="${PH}"/>`;
  s+=`<text class="yt" x="${GL-8}" y="${PLOT_TOP+PH+16}" text-anchor="end">dBm</text>`;
  s+=`<text class="ro" id="readout" x="${W-GR}" y="${PLOT_TOP+PH+18}" text-anchor="end"></text>`; // hover readout, filled on pointer move
  link(0,'Every 40 ms the UE tests each sample against the lines.');

  // 2. timeToTrigger.
  let top=stage(2,'ue','timeToTrigger',`Has the condition held on every sample for ${pp.ttt} ms?`,'UE CHECK',60);
  for(const c of CELLS)s+=`<text class="rl" x="${GL-8}" y="${row(c,top+14,20)}" text-anchor="end">${c}</text>`;
  for(const b of r.ttt){
    const x0=X(b.start),x1=X(b.end),yy=row(b.cell,top+3,20),w=Math.max(2,x1-x0);
    s+=`<rect class="tb ${b.cell.toLowerCase()} ${b.kind} ${b.how}" x="${x0}" y="${yy}" width="${w}" height="14" rx="2"/>`;
    if(w>58)s+=`<text class="tbl" x="${x0+4}" y="${yy+11}">${b.kind}${b.how==='done'?' ✓':''}</text>`;
    if(b.how==='cancelled')s+=`<text class="cx" x="${x1}" y="${yy+12}" text-anchor="middle">✕</text>`;
  }
  s+=`<text class="key" x="${W-GR}" y="${top+54}" text-anchor="end">✓ held long enough · ✕ broke first, nothing changes</text>`;
  link(1,'A completed check adds the cell to the list, or removes it.');

  // 3. cellsTriggeredList.
  top=stage(3,'ue','cellsTriggeredList','Which neighbour cells the UE has listed for measId 1','UE STATE',68);
  s+=`<text class="rl" x="${GL-8}" y="${top+13}" text-anchor="end">entry</text>`;
  for(const e of r.entries)s+=`<rect class="entry" x="${X(e.start)}" y="${top+5}" width="${X(e.end)-X(e.start)}" height="8" rx="2"/>`;
  if(!r.entries.length)s+=`<text class="key" x="${GL}" y="${top+13}">no reporting entry yet</text>`;
  for(const c of CELLS)s+=`<text class="rl" x="${GL-8}" y="${row(c,top+37,24)}" text-anchor="end">${c}</text><line class="rowl" x1="${GL}" x2="${W-GR}" y1="${row(c,top+42,24)}" y2="${row(c,top+42,24)}"/>`;
  for(const m of r.member){
    const x0=X(m.start),x1=X(m.end),yy=row(m.cell,top+22,24);
    s+=`<rect class="mem ${m.cell.toLowerCase()}" x="${x0}" y="${yy}" width="${Math.max(2,x1-x0)}" height="19" rx="3"/>`;
    const lab=`${m.cell} in list · ${m.open?`from ${m.start} ms`:`${m.start}–${m.end} ms`}`;
    if(x1-x0>12)s+=`<text class="meml" x="${x0+5}" y="${yy+14}">${x1-x0>lab.length*6.8+10?lab:m.cell}</text>`;
  }
  link(2,`Each report carries listed cells, strongest first, up to maxReportCells = ${pp.maxCells}.`);

  // 4. MeasurementReport: each report is a box with maxReportCells slots. Listed cells that did not fit sit below it.
  const SW=18,SH=16,slots=pp.maxCells,boxH=slots*SH+4;
  top=stage(4,'out','MeasurementReport',`Cells carried in each report: up to maxReportCells = ${pp.maxCells}`,'SENT TO THE NETWORK',boxH+SH+54);
  s+=`<text class="rl" x="${GL-8}" y="${top+boxH/2+8}" text-anchor="end">report</text>`;
  let lastX=-99,shift=0;
  for(const x of r.reports){
    let xx=X(x.t)-SW/2-2;
    if(xx<lastX+SW+6){shift++;xx=lastX+SW+6;}else shift=0;lastX=xx;
    s+=`<line class="rept" x1="${X(x.t)}" x2="${X(x.t)}" y1="${top+2}" y2="${top+6}"/>`;
    s+=`<rect class="rbox ${x.sent.length?'':'empty'}" x="${xx}" y="${top+6}" width="${SW+4}" height="${boxH}" rx="3"/>`;
    for(let k=0;k<slots;k++){const c=x.sent[k],sy=top+8+k*SH;
      s+=c?`<rect class="slot ${c.cell.toLowerCase()}" x="${xx+2}" y="${sy}" width="${SW}" height="${SH-2}" rx="2"/><text class="slotl" x="${xx+2+SW/2}" y="${sy+11}" text-anchor="middle">${c.cell}</text>`
          :`<text class="slote" x="${xx+2+SW/2}" y="${sy+11}" text-anchor="middle">–</text>`;}
    x.omitted.forEach((o,k)=>{const oy=top+boxH+10+k*SH;
      s+=`<rect class="omitb" x="${xx+2}" y="${oy}" width="${SW}" height="${SH-2}" rx="2"/><text class="omitl" x="${xx+2+SW/2}" y="${oy+11}" text-anchor="middle">${o.cell}</text>`;});
  }
  const ty=top+boxH+SH+14;
  s+=`<text class="rl" x="${GL-8}" y="${ty+8}" text-anchor="end">timer</text>`;
  for(const tm of r.timers.filter(tm=>tm.end>tm.start)){ // a timer started and stopped at the same instant is not drawn
    const x0=X(tm.start),x1=X(tm.end);
    s+=`<rect class="tmr ${tm.how}" x="${x0}" y="${ty}" width="${Math.max(2,x1-x0)}" height="9"/>`;
    if(tm.how==='replaced')s+=`<text class="tmx" x="${x1}" y="${ty+21}" text-anchor="middle">restarted</text>`;
    if(tm.how==='stopped')s+=`<text class="cx" x="${x1}" y="${ty+9}" text-anchor="middle">✕</text>`;
  }
  s+=`<text class="key" x="${W-GR}" y="${ty+36}" text-anchor="end">filled = carried · dashed = listed, no room · bar = periodical reporting timer</text>`;
  link(3,'Every report adds 1 to the count. A newly listed cell sets it back to 0 first.');

  // 5. numberOfReportsSent.
  const fin=pp.amount!==Infinity;
  top=stage(5,'ue','numberOfReportsSent',fin?`Reports since the last reset; periodic reports stop at reportAmount = ${amountName(pp.amount)}`:'Reports since the last reset; reportAmount infinity, periodic reports never stop','UE COUNTER',88);
  const maxV=Math.max(fin?pp.amount:0,...r.counter.map(c=>c.v??0),2),cy=v=>top+64-v/maxV*50;
  if(fin)s+=`<text class="key" x="${W-GR}" y="${top+84}" text-anchor="end">dashed = ${amountName(pp.amount)}: periodic reports stop here; entry and reportOnLeave reports still go out</text>`;
  if(fin)s+=`<line class="amt" x1="${GL}" x2="${W-GR}" y1="${cy(pp.amount)}" y2="${cy(pp.amount)}"/><text class="amtl" x="${GL-8}" y="${cy(pp.amount)+4}" text-anchor="end">${amountName(pp.amount)}</text>`;
  s+=`<line class="base" x1="${GL}" x2="${W-GR}" y1="${cy(0)}" y2="${cy(0)}"/><text class="rl" x="${GL-8}" y="${cy(0)+4}" text-anchor="end">0</text>`;
  const pts=r.counter;let d='';
  for(let i=0;i<pts.length;i++){
    const c=pts[i],end=i+1<pts.length?pts[i+1].t:HORIZON;
    if(c.v===null){continue;}
    const prev=pts[i-1];
    d+=(prev&&prev.v!==null&&prev.t<=c.t?`V${cy(c.v)}`:`M${X(c.t)} ${cy(c.v)}`)+`H${X(end)}`;
  }
  s+=`<path class="step" d="${d}"/>`;
  for(let i=1;i<pts.length;i++){const c=pts[i];if(c.v===null)continue;const nx=pts[i+1];
    if(c.v===0&&c.reset)s+=`<text class="rst" x="${X(c.t)-4}" y="${cy(0)-4}" text-anchor="end">reset to 0</text>`;
    else if(c.v>0&&!(nx&&nx.t===c.t&&nx.v!==null))s+=`<text class="cv" x="${X(c.t)+4}" y="${cy(c.v)-4}">${c.v}</text>`;}

  // Shared time axis and cursor across all stages.
  top=y-GAP+8;
  s+=`<line class="axl" x1="${GL}" x2="${W-GR}" y1="${top}" y2="${top}"/>`;
  for(const t of TIMES)s+=`<line class="tick" x1="${X(t)}" x2="${X(t)}" y1="${top}" y2="${top+(t%200?3:6)}"/>`+(t%200?'':`<text class="ax" x="${X(t)}" y="${top+18}" text-anchor="${t===0?'start':t===HORIZON?'end':'middle'}">${t===HORIZON?t+' ms':t}</text>`);
  const H=top+46;
  const cx=X(cur);
  const lw=ms(cur).length*7.4+12,lx=Math.max(GL-6,Math.min(W-GR-lw+6,cx-lw/2));
  // The cursor runs through each panel's content and the axis, not through headings or captions.
  s+=panels.map((q,i)=>`<line class="cursor" x1="${cx}" x2="${cx}" y1="${i?q.top+HEAD:PLOT_TOP}" y2="${q.bottom-2}"/>`).join('')+`<line class="cursor" x1="${cx}" x2="${cx}" y1="${top}" y2="${H-20}"/><rect class="curb" x="${lx}" y="${H-20}" width="${lw}" height="18" rx="3"/><text class="curl" x="${lx+lw/2}" y="${H-7}" text-anchor="middle">${ms(cur)}</text>`;
  const ci=Math.min(TIMES.length-1,Math.round(cur/STEP)),pv=pp.levels[paint][ci];
  s+=`<g class="caret ${paint.toLowerCase()}">${MARK[paint](X(TIMES[ci]),Y(pv),5)}</g>`;
  $('#fig').innerHTML=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${s}</svg>`;
}

function verdict(){
  const n=r.reports.length,span=c=>r.member.filter(m=>m.cell===c).map(m=>m.open?`from ${m.start} ms`:`${m.start}–${m.end} ms`).join(' and ');
  const parts=CELLS.map(c=>span(c)?`${c} listed ${span(c)}`:`${c} never listed`);
  return `<b>${n} MeasurementReport${n===1?'':'s'}.</b> ${parts.join('; ')}.`;
}

function renderState(){
  const st=stateAt(r,cur),pp=r.p;
  $('#now-t').textContent=ms(cur);$('#cur').value=cur;
  const chip=c=>`<span class="chipc ${c.toLowerCase()}"><i class="sw ${c.toLowerCase()}" aria-hidden="true"></i>${c}</span>`;
  const pend=CELLS.filter(c=>st.pending[c]).map(c=>`${c}: ${st.pending[c].kind==='enter'?'entry':'leaving'} condition held since ${ms(st.pending[c].start)}`);
  const lv=CELLS.map(c=>`${c} ${dbm(levelAt(pp.levels[c],cur))}`).join(' · ');
  $('#state').innerHTML=
    `<dt>cellsTriggeredList</dt><dd>${st.list.length?st.list.map(chip).join(' '):'<span class="muted">empty</span>'}</dd>`+
    `<dt>Reporting entry for measId 1</dt><dd>${st.entry?'exists':'<span class="muted">none</span>'}</dd>`+
    `<dt>numberOfReportsSent</dt><dd>${st.entry?`${st.count} <span class="muted">(${pp.amount===Infinity?'reportAmount infinity: periodic reports never stop':`periodic reports stop at reportAmount ${amountName(pp.amount)}`})</span>`:'<span class="muted">none, no reporting entry</span>'}</dd>`+
    `<dt>Periodical reporting timer</dt><dd>${st.timerDue!==null?`running, expires at ${ms(st.timerDue)}`:'<span class="muted">not running</span>'}</dd>`+
    `<dt>timeToTrigger running</dt><dd>${pend.length?pend.join('<br>'):'<span class="muted">none</span>'}</dd>`+
    `<dt>RSRP at this time</dt><dd>${lv} <span class="muted">· SpCell ${MP} dBm</span></dd>`;
  const x=st.last;
  if(!x){$('#report').innerHTML='<p class="muted">No MeasurementReport has been sent yet at this time.</p>';return;}
  const why={first:'a first cell entered the list, so a new reporting entry was made',subsequent:'a subsequent cell entered the list, which reset numberOfReportsSent to 0',periodic:'the periodical reporting timer expired',leave:'a cell left the list and reportOnLeave is true'}[x.cause];
  const neigh=x.sent.length?x.sent.map(c=>`<span class="cellv ${c.cell.toLowerCase()}">${c.cell}</span> ${dbm(c.rsrp)}`).join(', '):'<span class="muted">absent: no cell was left in the list</span>';
  const om=x.omitted.length?`<p class="omit">Not in this report: ${x.omitted.map(c=>`<b>${c.cell}</b> (${dbm(c.rsrp)})`).join(', ')}. ${x.omitted.length>1?'They are':'It is'} in cellsTriggeredList, but maxReportCells = ${pp.maxCells} and ${x.sent.map(c=>c.cell).join(', ')} ${x.sent.length>1?'are':'is'} stronger${x.sent.some(s=>x.omitted.some(o=>o.rsrp===s.rsrp))?' or ordered first on a tie':''}.</p>`:'';
  $('#report').innerHTML=`<p class="rep-h"><b>#${x.n} at ${ms(x.t)}</b>: sent because ${why}.</p>
<dl class="msg"><dt>measId</dt><dd>1</dd><dt>measResultServingMOList</dt><dd>SpCell ${dbm(MP)}</dd><dt>measResultNeighCells</dt><dd>${neigh}</dd></dl><p class="x-hint">Room in this report: maxReportCells = ${pp.maxCells}. Cells listed when it was built: ${x.list.length?x.list.join(', '):'none'}.</p>${om}
<p class="x-hint">After this report: numberOfReportsSent = ${x.count}; ${x.timerDue!==null?`timer runs until ${ms(x.timerDue)}`:'the periodical reporting timer is not running'}. Neighbours are listed strongest first. The real message carries an RSRP-Range index rather than dBm.</p>`;
}

function renderLog(){
  const tag=c=>c?c.split('').map(x=>`<i class="sw ${x.toLowerCase()}" aria-hidden="true"></i>`).join(''):'';
  $('#log').innerHTML=r.log.map((l,i)=>`<li class="${l.kind} ${l.t>cur?'later':''} ${l.t===cur?'now':''}"><button data-t="${l.t}"><span class="lt-t">${ms(l.t)}</span><span class="lt-x">${tag(l.cell)}${l.text}</span><span class="lt-c">${l.clause}</span></button></li>`).join('');
}

function syncControls(){
  const pp=r.p;
  // Each value is shown twice: on its button in the settings bar (-o) and next to its control in the popover (-v).
  const show=(id,txt)=>{$(`#${id}-o`).textContent=txt;$(`#${id}-v`).textContent=txt;};
  $('#off').value=pp.off;show('off',`${pp.off} dB`);
  $('#hys').value=pp.hys;show('hys',`${pp.hys} dB`);
  $('#ttt').value=TTT.indexOf(pp.ttt);show('ttt',`ms${pp.ttt}`);
  $('#int').value=INTERVAL.indexOf(pp.interval);show('int',`ms${pp.interval}`);
  $('#amt').value=AMOUNT.indexOf(pp.amount);show('amt',amountName(pp.amount));
  $('#maxc-o').textContent=pp.maxCells;$('#onleave-o').textContent=pp.onLeave?'true':'false';
  const seg=(id,v)=>document.querySelectorAll(`#${id} button`).forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===String(v)));
  seg('paint',paint);seg('maxc',pp.maxCells);seg('onleave',pp.onLeave?1:0);
  document.querySelectorAll('#presets button').forEach(b=>b.setAttribute('aria-pressed',PRESETS[b.dataset.i].name===current));
}

function render(){
  r=run(p);
  W=Math.max(760,$('#fig').clientWidth||900);
  draw();$('#verdict').innerHTML=verdict();renderState();renderLog();syncControls();
}
const renderCursor=()=>{draw();renderState();renderLog();};
const edit=fn=>{fn();current='';render();};
const setCur=t=>{cur=Math.max(0,Math.min(HORIZON,Math.round(t)));renderCursor();};

// Presets and parameters.
$('#presets').insertAdjacentHTML('beforeend',PRESETS.map((x,i)=>`<button class="x-chip" data-i="${i}">${x.name}</button>`).join(''));
$('#presets').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const x=PRESETS[b.dataset.i];p=copy(x.p);cur=x.cur;current=x.name;render();});
$('#off').addEventListener('input',e=>edit(()=>p.off=+e.target.value));
$('#hys').addEventListener('input',e=>edit(()=>p.hys=+e.target.value));
$('#ttt').addEventListener('input',e=>edit(()=>p.ttt=TTT[+e.target.value]));
$('#int').addEventListener('input',e=>edit(()=>p.interval=INTERVAL[+e.target.value]));
$('#amt').addEventListener('input',e=>edit(()=>p.amount=AMOUNT[+e.target.value]));
$('#maxc').addEventListener('click',e=>{const b=e.target.closest('button');if(b)edit(()=>p.maxCells=+b.dataset.v);});
$('#onleave').addEventListener('click',e=>{const b=e.target.closest('button');if(b)edit(()=>p.onLeave=b.dataset.v==='1');});
$('#paint').addEventListener('click',e=>{const b=e.target.closest('button');if(b){paint=b.dataset.v;renderCursor();syncControls();}});

// Cursor controls.
const eventTimes=()=>[...new Set(r.log.map(l=>l.t))].sort((a,b)=>a-b);
$('#cur').addEventListener('input',e=>setCur(+e.target.value));
$('#prev').addEventListener('click',()=>{const t=eventTimes().filter(t=>t<cur).pop();if(t!==undefined)setCur(t);});
$('#next').addEventListener('click',()=>{const t=eventTimes().find(t=>t>cur);if(t!==undefined)setCur(t);});
$('#log').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setCur(+b.dataset.t);});

// Drawing on the plot; clicking a lower lane moves the cursor.
const fig=$('#fig');let drag=null;
const local=e=>{const b=fig.getBoundingClientRect();return{x:e.clientX-b.left,y:e.clientY-b.top};};
const sampleAt=x=>Math.round(T(x)/STEP);
const levelOf=y=>Math.max(LEVEL_MIN,Math.min(LEVEL_MAX,Math.round(LEVEL_MAX+0.5-(y-PLOT_TOP)/DB)));
const inPlot=({x,y})=>x>=GL-6&&x<=W-GR+6&&y>=PLOT_TOP-4&&y<=PLOT_TOP+PH+4;
function setLevel(i0,i1,v){const [a,b]=i0<i1?[i0,i1]:[i1,i0];for(let i=a;i<=b;i++)p.levels[paint][i]=v;cur=TIMES[i1];current='';render();}
// Mouse and pen draw while dragging. Touch acts on a tap only, so a swipe still scrolls the timeline.
let tap=null;
function press(pt,e){
  if(inPlot(pt)){const i=sampleAt(pt.x);if(e){drag={i};fig.setPointerCapture?.(e.pointerId);}setLevel(i,i,levelOf(pt.y));}
  else{const near=eventTimes().find(et=>Math.abs(X(et)-pt.x)<7);setCur(near??Math.round(T(pt.x)/STEP)*STEP);}
}
fig.addEventListener('pointerdown',e=>{
  const pt=local(e);
  if(e.pointerType==='touch'){tap=pt;return;}
  if(inPlot(pt))e.preventDefault();
  press(pt,e);
});
fig.addEventListener('pointerup',e=>{if(!tap)return;const pt=local(e);if(Math.hypot(pt.x-tap.x,pt.y-tap.y)<10)press(pt,null);tap=null;});
fig.addEventListener('pointermove',e=>{
  const pt=local(e);
  if(drag){const i=sampleAt(pt.x);setLevel(drag.i,i,levelOf(pt.y));drag.i=i;return;}
  const ro=$('#readout');if(!ro)return;
  if(inPlot(pt)){const t=TIMES[sampleAt(pt.x)];ro.textContent=`${t} ms · `+CELLS.map(c=>`${c} ${neg(levelAt(p.levels[c],t))}`).join(' · ')+` · click sets ${paint} to ${dbm(levelOf(pt.y))}`;}
  else ro.textContent='';
});
const endDrag=()=>{drag=null;};
fig.addEventListener('pointercancel',()=>{tap=null;});
fig.addEventListener('pointerup',endDrag);fig.addEventListener('pointercancel',endDrag);
fig.addEventListener('keydown',e=>{
  const i=Math.min(TIMES.length-1,Math.round(cur/STEP));
  const k=e.key;
  if(k==='ArrowLeft'||k==='ArrowRight'){e.preventDefault();setCur(TIMES[Math.max(0,Math.min(TIMES.length-1,i+(k==='ArrowRight'?1:-1)))]);}
  else if(k==='ArrowUp'||k==='ArrowDown'){e.preventDefault();const v=Math.max(LEVEL_MIN,Math.min(LEVEL_MAX,p.levels[paint][i]+(k==='ArrowUp'?1:-1)));setLevel(i,i,v);}
  else if(k==='Home'||k==='End'){e.preventDefault();setCur(k==='Home'?0:HORIZON);}
  else if(k==='a'||k==='A'||k==='b'||k==='B'){paint=k.toUpperCase();renderCursor();syncControls();}
});
// Settings popovers. The bar is sticky above the figure, so a popover can be opened with the affected panel in view.
// One popover is open at a time; Escape, the close button or a click outside closes it and returns focus to its button.
let openPop=null,opener=null;
function closePop(){if(!openPop)return;openPop.hidden=true;document.querySelectorAll('#bar .pill').forEach(b=>b.setAttribute('aria-expanded','false'));opener?.focus?.();openPop=opener=null;}
function showPop(id,btn){
  const pop=$(`#pop-${id}`);if(openPop===pop){closePop();return;}
  closePop();openPop=pop;opener=btn;pop.hidden=false;
  document.querySelectorAll(`#bar .pill[data-pop="${id}"]`).forEach(b=>b.setAttribute('aria-expanded','true'));
  const wrap=$('#barwrap');
  if(btn?.getBoundingClientRect&&wrap.getBoundingClientRect){const w=wrap.getBoundingClientRect(),b=btn.getBoundingClientRect();
    pop.style.left=`${Math.max(0,Math.min(b.left-w.left,w.width-pop.offsetWidth))}px`;}
  fitPop();
  pop.querySelector?.('input,button:not(.pop-x)')?.focus?.({preventScroll:true});
}
// Keep the whole popover reachable: cap its height to the viewport space below its top edge; its body scrolls.
function fitPop(){
  if(!openPop?.getBoundingClientRect||!openPop.style||typeof innerHeight==='undefined')return;
  openPop.style.maxHeight=`${Math.max(160,innerHeight-openPop.getBoundingClientRect().top-12)}px`;
}
if(typeof addEventListener!=='undefined'){addEventListener('scroll',fitPop,{passive:true});addEventListener('resize',fitPop);}
$('#bar').addEventListener('click',e=>{const b=e.target.closest('.pill');if(b)showPop(b.dataset.pop,b);});
for(const id of ['list','content','count']){const pop=$(`#pop-${id}`);
  pop.addEventListener('click',e=>{if(e.target.closest('[data-close]'))closePop();});
  pop.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closePop();}});}
document.addEventListener?.('pointerdown',e=>{if(openPop&&!e.target.closest?.('#barwrap'))closePop();});
if(typeof ResizeObserver!=='undefined'){let lastW=0;new ResizeObserver(()=>{const w=fig.clientWidth;if(w!==lastW){lastW=w;render();}}).observe(fig);}
render();
