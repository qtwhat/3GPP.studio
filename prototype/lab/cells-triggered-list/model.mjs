// cellsTriggeredList teaching model: one measId, event A3, reportType eventTriggered, no numberOfTriggeringCells.
// TS 38.331 V19.3.0 §5.5.4.1 (entry, leave, numberOfReportsSent reset, reportOnLeave, empty list),
// §5.5.4.4 (A3 inequalities), §5.5.5.1 (payload up to maxReportCells, count, periodical reporting timer), §5.5.5.3 (sorting).
// Teaching conventions, not normative: inputs are already L3 filtered and arrive every 40 ms with none missing;
// the SpCell is fixed at -90 dBm; all offsets except Off are zero; a timer expiry at a sample instant is handled
// before that sample; on one sample, entries are handled before leaves; equal RSRP in a payload lists A before B.

export const STEP=40,HORIZON=2000,MP=-90;
export const TIMES=Array.from({length:HORIZON/STEP+1},(_,i)=>i*STEP); // 0..2000 ms, 51 samples
export const LEVEL_MIN=-93,LEVEL_MAX=-81;                            // range the page lets you paint (dBm)
export const CELLS=['A','B'];
// TimeToTrigger values that are whole multiples of the 40 ms sample period, so a cell is added or removed exactly
// timeToTrigger after its first qualifying sample. ms64, ms100, ms128, ms256 and ms512 are left out on purpose.
export const TTT=[0,40,80,160,320,480,640];
export const INTERVAL=[120,240,480,640,1024];                       // subset of ReportInterval (ms)
export const AMOUNT=[1,2,4,8,Infinity];                             // subset of reportAmount (r1..r8, infinity)
export const MAXCELLS=[1,2];                                        // maxReportCells, limited by two neighbours

// Builds a 51-sample level array from [fromMs, dBm] steps.
export function levels(steps){
  return TIMES.map(t=>{let v=steps[0][1];for(const [from,l] of steps)if(t>=from)v=l;return v;});
}

export const defaults={
  levels:{A:levels([[0,-91],[200,-84],[840,-89],[1600,-84]]),B:levels([[0,-92],[400,-83],[1200,-89]])},
  off:3,hys:1,ttt:160,interval:240,amount:2,maxCells:1,onLeave:true,
};

export const thresholds=({off,hys})=>({enter:MP+off+hys,leave:MP+off-hys});
// A3-1 and A3-2 with Ofn=Ocn=Ofp=Ocp=0. Both are strict, so a level exactly on a line changes nothing.
export const entering=(mn,{off,hys})=>mn-hys>MP+off;
export const leaving=(mn,{off,hys})=>mn+hys<MP+off;
export const levelAt=(lv,t)=>lv[Math.min(TIMES.length-1,Math.floor(t/STEP))];
export const amountName=a=>a===Infinity?'infinity':`r${a}`;

export function run(input=defaults){
  const p={...defaults,...input},lv=p.levels;
  const list=new Set();
  let entry=false,count=0,timer=null;          // timer = {start,due}
  const pending={A:null,B:null};               // {kind:'enter'|'leave',start}
  const log=[],reports=[],ttt=[],member=[],timers=[],counter=[{t:0,v:null}],entries=[],snaps=[];
  const since={A:null,B:null};let entrySince=null;
  const say=(t,kind,text,clause,cell=null)=>log.push({t,kind,text,clause,cell});
  const fmtCells=a=>a.length?a.join(', '):'none',dbm=v=>`${String(v).replace('-','−')} dBm`;

  const stopTimer=(t,how)=>{if(timer){timers.push({start:timer.start,end:t,how});timer=null;}};
  function report(t,cause){
    const members=[...list];
    const ranked=members.map(c=>({cell:c,rsrp:levelAt(lv[c],t)})).sort((a,b)=>b.rsrp-a.rsrp||a.cell.localeCompare(b.cell));
    const sent=ranked.slice(0,p.maxCells),omitted=ranked.slice(p.maxCells);
    count++;counter.push({t,v:count});
    stopTimer(t,'replaced');
    if(count<p.amount)timer={start:t,due:t+p.interval};
    const r={n:reports.length+1,t,cause,sent,omitted,list:members,count,timerDue:timer?.due??null};
    reports.push(r);
    const what=sent.length?sent.map(s=>`${s.cell} (${dbm(s.rsrp)})`).join(', '):'no neighbour cells, serving result only';
    const tail=timer?`Periodical reporting timer runs until ${timer.due} ms.`:`numberOfReportsSent ${count} is not below ${amountName(p.amount)}, so the periodical reporting timer is not restarted.`;
    say(t,'report',`MeasurementReport #${r.n}: ${what}${omitted.length?`. Left out: ${omitted.map(s=>s.cell).join(', ')} (maxReportCells ${p.maxCells})`:''}. numberOfReportsSent = ${count}. ${tail}`,'§5.5.5.1');
    return r;
  }
  function snap(t){snaps.push({t,list:[...list],entry,count,timerDue:timer?.due??null,pending:{A:pending.A&&{...pending.A},B:pending.B&&{...pending.B}}});}

  function expire(t){
    timers.push({start:timer.start,end:t,how:'expired'});timer=null;
    say(t,'timer','Periodical reporting timer expires.','§5.5.4.1');
    report(t,'periodic');
    snap(t);
  }

  function sample(t,i){
    // Track timeToTrigger for each cell: entry while not in the list, leave while in it.
    const doneEnter=[],doneLeave=[];
    for(const c of CELLS){
      const mn=lv[c][i],inList=list.has(c),kind=inList?'leave':'enter';
      const holds=inList?leaving(mn,p):entering(mn,p);
      const pd=pending[c];
      if(holds){
        if(!pd){pending[c]={kind,start:t};
          if(p.ttt>0)say(t,'ttt',`${c} at ${dbm(mn)} meets the ${kind==='enter'?`entry condition (above ${dbm(thresholds(p).enter)})`:`leaving condition (below ${dbm(thresholds(p).leave)})`}. timeToTrigger ${p.ttt} ms starts.`,'§5.5.4.4',c);}
        if(t-pending[c].start>=p.ttt)(kind==='enter'?doneEnter:doneLeave).push(c);
      }else if(pd){
        ttt.push({cell:c,kind:pd.kind,start:pd.start,end:t,how:'cancelled'});
        say(t,'cancel',`${c} at ${dbm(mn)} no longer meets the ${pd.kind==='enter'?'entry':'leaving'} condition. Its timeToTrigger is cancelled after ${t-pd.start} ms.`,'§5.5.4.1',c);
        pending[c]=null;
      }
    }
    if(doneEnter.length){
      for(const c of doneEnter){ttt.push({cell:c,kind:'enter',start:pending[c].start,end:t,how:'done'});pending[c]=null;list.add(c);since[c]=t;}
      const first=!entry;
      if(first){entry=true;entrySince=t;}
      const was=count;count=0;counter.push({t,v:0,reset:!first&&was>0});
      say(t,'enter',first
        ?`${fmtCells(doneEnter)} met the entry condition on every sample for ${p.ttt} ms: first cell for this measId. New reporting entry, numberOfReportsSent = 0, ${fmtCells(doneEnter)} added to cellsTriggeredList.`
        :`${fmtCells(doneEnter)} met the entry condition for ${p.ttt} ms while not in the list: a subsequent cell. Added to cellsTriggeredList, and numberOfReportsSent is reset from ${was} to 0.`,'§5.5.4.1',doneEnter.join(''));
      report(t,first?'first':'subsequent');
    }
    if(doneLeave.length){
      for(const c of doneLeave){ttt.push({cell:c,kind:'leave',start:pending[c].start,end:t,how:'done'});pending[c]=null;list.delete(c);member.push({cell:c,start:since[c],end:t});since[c]=null;}
      say(t,'leave',`${fmtCells(doneLeave)} met the leaving condition on every sample for ${p.ttt} ms and is removed from cellsTriggeredList. numberOfReportsSent stays ${count}.${p.onLeave?'':' reportOnLeave is false, so no report.'}`,'§5.5.4.1',doneLeave.join(''));
      if(p.onLeave)report(t,'leave');
      if(!list.size){
        stopTimer(t,'stopped');entry=false;entries.push({start:entrySince,end:t});entrySince=null;counter.push({t,v:null}); // no entry, no count
        say(t,'empty','cellsTriggeredList is empty: the reporting entry for this measId is removed and the periodical reporting timer is stopped.','§5.5.4.1');
      }
    }
    snap(t);
  }

  TIMES.forEach((t,i)=>{
    while(timer&&timer.due<=t)expire(timer.due);
    sample(t,i);
  });
  // Close open spans at the horizon.
  for(const c of CELLS){if(since[c]!==null)member.push({cell:c,start:since[c],end:HORIZON,open:true});
    if(pending[c])ttt.push({cell:c,kind:pending[c].kind,start:pending[c].start,end:HORIZON,how:'open'});}
  if(entry)entries.push({start:entrySince,end:HORIZON,open:true});
  if(timer)timers.push({start:timer.start,end:Math.min(timer.due,HORIZON),how:'running',due:timer.due});
  member.sort((a,b)=>a.start-b.start);
  return{p,th:thresholds(p),log,reports,ttt,member,timers,counter,entries,snaps};
}

// State after everything that happened at or before t.
export function stateAt(r,t){
  let s={t:0,list:[],entry:false,count:0,timerDue:null,pending:{A:null,B:null}};
  for(const x of r.snaps){if(x.t<=t)s=x;else break;}
  const last=[...r.reports].reverse().find(x=>x.t<=t)||null;
  return{...s,last};
}
