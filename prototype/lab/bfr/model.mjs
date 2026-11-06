// Beam failure detection and SpCell recovery teaching model.
// TS 38.321 V19.3.0 §5.17 (detection counter/timer), §5.1.1, §5.1.2 (BFR CFRA selection), §5.1.4 (recoverySearchSpace response).
// TS 38.213 V19.3.0 §6 (lower-layer BFI), TS 38.331 V19.3.0 (RadioLinkMonitoringConfig, BeamFailureRecoveryConfig).
// All timings are constructed teaching inputs, not normative latencies.

export const PERIOD=20;                                   // illustrative Qout,LR indication period (ms)
export const SLOTS=Array.from({length:15},(_,i)=>(i+1)*PERIOD); // 20..300 ms
export const HORIZON=320;
export const PBFD=[1,2,3,4,5,6,8,10];                     // beamFailureDetectionTimer, in indication periods
export const MAXCOUNT=[1,2,3,4,5,6,8,10];                 // beamFailureInstanceMaxCount
export const THRESHOLD=-100;                              // illustrative rsrp-ThresholdSSB (dBm)
// Illustrative recovery timing relative to detection (ms).
export const RA={preamble:6,windowStart:10,windowEnd:30,pdcch:18};

export const defaults={bfi:[20,40,80,100],pbfd:4,maxCount:4,rsrp:-94,cfra:true,recTimer:'running',response:true};

// Detection: each BFI (re)starts the timer and increments the counter; timer expiry resets it.
// Convention for a BFI exactly at the timer deadline: the BFI is processed first and restarts the timer,
// so pbfdN tolerates up to N-1 quiet periods. Labelled as a tie in the UI; the spec text does not order these.
export function detect({bfi,pbfd,maxCount}){
  const T=pbfd*PERIOD,times=[...new Set(bfi)].filter(t=>t>0&&t<HORIZON).sort((a,b)=>a-b);
  const events=[],timers=[],counter=[{t:0,v:0}],ignored=[];
  let count=0,started=null,deadline=null,detectAt=null;
  const expire=at=>{timers.push({start:started,end:at,how:'expired'});events.push({t:at,type:'expire',from:count});count=0;counter.push({t:at,v:0});started=deadline=null;};
  for(const t of times){
    if(detectAt!==null){ignored.push(t);continue;}
    const tie=deadline===t;
    if(deadline!==null&&deadline<t)expire(deadline);
    if(started!==null)timers.push({start:started,end:t,how:'restarted'});
    started=t;deadline=t+T;count++;counter.push({t,v:count});
    events.push({t,type:'bfi',count,deadline,tie,restart:timers.length>0&&timers.at(-1).end===t&&timers.at(-1).how==='restarted'});
    if(count>=maxCount){detectAt=t;events.push({t,type:'detect',count});}
  }
  if(detectAt===null&&deadline!==null){if(deadline<=HORIZON)expire(deadline);else timers.push({start:started,end:HORIZON,how:'running'});}
  if(detectAt!==null)timers.push({start:started,end:Math.min(deadline,HORIZON),how:'afterDetect'});
  return{T,events,timers,counter,detectAt,ignored,finalCount:count,maxCount};
}

// Recovery: only the dedicated CFRA branch for SpCell BFR is modelled; other branches are named, not simulated.
export function recover({rsrp,cfra,recTimer,response},detectAt){
  if(detectAt===null)return{started:false,gates:[],outcome:'none'};
  const timerOk=recTimer!=='expired',candOk=rsrp>THRESHOLD; // MAC text: "above" the threshold
  const eligible=cfra&&timerOk&&candOk;
  const gates=[
    {id:'ra',ok:true,t:detectAt},
    {id:'eligible',ok:eligible,checks:{cfra,timerOk,candOk}},
  ];
  if(!eligible)return{started:true,gates,outcome:'notEligible'};
  gates.push({id:'preamble',ok:true,t:detectAt+RA.preamble});
  gates.push({id:'monitor',ok:true,t:detectAt+RA.windowStart,end:detectAt+RA.windowEnd});
  gates.push({id:'pdcch',ok:response,t:response?detectAt+RA.pdcch:detectAt+RA.windowEnd});
  return{started:true,gates,outcome:response?'recovered':'noResponse',recoveredAt:response?detectAt+RA.pdcch:null};
}

export function run(input=defaults){
  const p={...defaults,...input},d=detect(p),r=recover(p,d.detectAt);
  const counter=[...d.counter];
  if(r.outcome==='recovered'&&r.recoveredAt<=HORIZON)counter.push({t:r.recoveredAt,v:0,recovered:true});
  return{p,...d,counter,recovery:r};
}
