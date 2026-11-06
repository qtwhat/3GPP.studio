// BSR teaching model. TS 38.321 V19.3.0 §§5.4.5, 6.1.3.1 (Tables 6.1.3.1-1/-2).
// Pure functions only; the page and the Node tests both import this file.
import {shortBounds,longBounds} from '../../assets/anatomy/bsr-tables.mjs';

export const defaults={a:1200,b:800,served:600,extra:500,grouping:'shared'};
export const STEPS=['arrive','built','received','later','refresh'];

// Index i means bounds[i-1] < BS <= bounds[i]; index 0 means BS = 0.
export function quantize(bytes,format){
  const bounds=format==='Short'?shortBounds:longBounds;
  if(bytes<=0)return{index:0,lower:0,upper:0};
  let index=bounds.findIndex(n=>n>=bytes);
  if(index<0)index=bounds.length; // overflow index: BS > last finite bound
  return{index,lower:bounds[index-1],upper:bounds[index]??Infinity};
}
export const tableBounds=format=>format==='Short'?shortBounds:longBounds;

// LC A and LC B are either both in LCG 0, or A in LCG 0 and B in LCG 1.
export const groupBytes=([a,b],grouping)=>grouping==='shared'?[a+b,0]:[a,b];

// Format is decided from groups with data when the PDU is to be built (before);
// the size fields carry what is left after the PDU is assembled (after).
export function buildReport(before,after,grouping){
  const active=groupBytes(before,grouping).map((v,id)=>({v,id})).filter(g=>g.v>0).map(g=>g.id);
  const format=active.length>1?'Long':'Short';
  const ids=active.length?active:[0];
  const now=groupBytes(after,grouping);
  const fields=ids.map(lcg=>({lcg,bytes:now[lcg],...quantize(now[lcg],format)}));
  return{format,activeBefore:active,fields,octets:format==='Short'?1:1+fields.length};
}

export function serve(p){
  const takeA=Math.min(p.a,p.served),takeB=Math.min(p.b,p.served-takeA);
  return{takeA,takeB,remaining:[p.a-takeA,p.b-takeB]};
}

export function scenario(input=defaults){
  const p={...defaults,...input};
  const initial=[p.a,p.b],{takeA,takeB,remaining}=serve(p),later=[remaining[0]+p.extra,remaining[1]];
  const first=buildReport(initial,remaining,p.grouping);
  const second=buildReport(later,later,p.grouping); // refresh: no further service assumed
  const relevantEmpty=groupBytes(remaining,p.grouping).every(v=>v===0);
  const steps=STEPS.map((id,i)=>{
    const queues=i===0?initial:i<=2?remaining:later;
    const known=i===2||i===3?first:i===4?second:null;
    const groups=groupBytes(queues,p.grouping);
    // inside: the value still lies in the reported range; changed: the queue moved since the report was built.
    const fields=known?known.fields.map(f=>({...f,actual:groups[f.lcg],changed:groups[f.lcg]!==f.bytes,inside:groups[f.lcg]>f.lower&&groups[f.lcg]<=f.upper||(f.index===0&&groups[f.lcg]===0)})):[];
    return{id,i,queues,groups,known,receivedAt:known?(i===4?4:2):null,
      onAir:i===1?first:i===4?second:null,fields,outdated:fields.some(f=>f.changed),outside:fields.some(f=>!f.inside)};
  });
  return{p,initial,remaining,later,served:takeA+takeB,takeA,takeB,first,second,steps,
    retrigger:relevantEmpty&&p.extra>0};
}
