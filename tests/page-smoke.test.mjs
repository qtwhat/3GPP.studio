// Runs each page script against a minimal DOM stub to catch runtime errors and check key rendered text.
// Not a browser test: layout, CSS and real events are not exercised. Run: node tests/page-smoke.test.mjs
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const els=new Map();
const el=sel=>{if(!els.has(sel))els.set(sel,{sel,innerHTML:'',textContent:'',value:'',href:'',disabled:false,handlers:{},
  addEventListener(t,f){this.handlers[t]=f;},insertAdjacentHTML(_,h){this.innerHTML+=h;},setAttribute(){},focus(){},querySelectorAll:()=>[]});return els.get(sel);};
globalThis.location={search:'?from='+encodeURIComponent('q=beam&topic=beam,bogus&live=1')};
globalThis.document={querySelector:s=>el(s),querySelectorAll:()=>[]};
const click=(sel,data)=>el(sel).handlers.click({target:{closest:()=>({dataset:data})}});
const input=(sel,value)=>el(sel).handlers.input({target:{value}});

await import(pathToFileURL('prototype/lab/bsr/app.mjs'));
assert.equal(el('#back').href,'../../index.html?q=beam&topic=beam&live=1');
assert.match(el('#story').innerHTML,/SR/);assert.match(el('#gnb').innerHTML,/Nothing/);
assert.equal(el('#air-h').textContent,'On the air · Scheduling request');
el('#next').onclick();assert.match(el('#air').innerHTML,/Short BSR/);assert.equal(el('#air-h').textContent,'On the air · BSR MAC CE');
el('#next').onclick();assert.match(el('#gnb').innerHTML,/index 16/);assert.match(el('#gnb').innerHTML,/1,038 &lt; BS|1,038 < BS/);
el('#next').onclick();assert.match(el('#gnb').innerHTML,/out of date · UE now 1,900 B is outside/);
el('#next').onclick();assert.match(el('#gnb').innerHTML,/index 17/);
click('#presets',{i:2});assert.match(el('#gnb').innerHTML,/Not yet/);
click('#presets',{i:3});assert.match(el('#gnb').innerHTML,/out of date · still inside range/);assert.match(el('#story').innerHTML,/out of date/);
click('#presets',{i:2});assert.match(el('#air').innerHTML,/Long BSR/);assert.match(el('#story').innerHTML,/index 0/);
click('#grouping',{v:'shared'});input('#a','4000');input('#extra','2000');
for(let i=0;i<5;i++)click('#steps',{i});
console.log('ok BSR page renders all five moments and presets');

els.clear();
await import(pathToFileURL('prototype/lab/bfr/app.mjs'));
assert.match(el('#verdict').innerHTML,/Detected at 100 ms/);assert.match(el('#verdict').innerHTML,/Recovered at 118 ms/);
assert.match(el('#gates').innerHTML,/recovered/);assert.match(el('#marks').innerHTML,/detected → RA/);
click('#presets',{i:1});assert.match(el('#verdict').innerHTML,/Not detected/);assert.match(el('#verdict').innerHTML,/120 ms/);
assert.match(el('#counter').innerHTML,/0 · reset/);assert.match(el('#axis').innerHTML,/320 ms/);assert.doesNotMatch(el('#axis').innerHTML,/unit/);
click('#presets',{i:3});assert.match(el('#gates').innerHTML,/-105 dBm ≤ -100 dBm/);assert.match(el('#gates').innerHTML,/contention-based/);
click('#presets',{i:4});assert.match(el('#verdict').innerHTML,/no qualifying response/);
click('#presets',{i:0});el('#slots').handlers.click({target:{closest:()=>({dataset:{t:'60'}})}});
assert.match(el('#verdict').innerHTML,/Detected at 80 ms/);
input('#pbfd','0');input('#maxc','7');click('#rectimer',{v:'expired'});click('#cfra',{v:'0'});click('#resp',{v:'0'});
console.log('ok BFR page renders presets, slot toggles and recovery gates');
