// Runs the cellsTriggeredList page script against a minimal DOM stub to catch runtime errors and check key rendered text.
// Not a browser test: layout, CSS and real pointer events are not exercised. Run: node tests/ctl-page-smoke.test.mjs
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const els=new Map();
const el=sel=>{if(!els.has(sel))els.set(sel,{sel,innerHTML:'',textContent:'',value:'',href:'',clientWidth:1100,handlers:{},
  addEventListener(t,f){this.handlers[t]=f;},insertAdjacentHTML(_,h){this.innerHTML+=h;},setAttribute(){},focus(){},setPointerCapture(){},
  querySelectorAll:()=>[],getBoundingClientRect:()=>({left:0,top:0})});return els.get(sel);};
globalThis.location={search:'?from='+encodeURIComponent('q=A3&topic=measurement,bogus&live=1')};
globalThis.document={querySelector:s=>el(s),querySelectorAll:()=>[]};
const click=(sel,data)=>el(sel).handlers.click({target:{closest:()=>({dataset:data})}});
const input=(sel,value)=>el(sel).handlers.input({target:{value}});
const text=sel=>el(sel).innerHTML.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');

await import(pathToFileURL('prototype/lab/cells-triggered-list/app.mjs'));
assert.equal(el('#back').href,'../../index.html?q=A3&topic=measurement&live=1');
assert.match(el('#verdict').innerHTML,/7 MeasurementReports/);
assert.match(text('#state'),/cellsTriggeredList A B/);
assert.match(text('#report'),/#2 at 560 ms/);assert.match(text('#report'),/Not in this report: A/);
assert.match(el('#fig').innerHTML,/enter: above −86 dBm/);assert.match(el('#fig').innerHTML,/reset to 0/);
ok('walkthrough renders: 7 reports, A listed but not reported at 560 ms');

el('#next').handlers.click();assert.equal(el('#now-t').textContent,'800 ms');assert.match(text('#state'),/not running/);
click('#log',{t:'1360'});assert.match(text('#report'),/absent: no cell was left/);assert.match(text('#state'),/empty/);
click('#maxc',{v:'2'});click('#log',{t:'560'});assert.match(text('#report'),/B −83 dBm, A −84 dBm/);
click('#onleave',{v:'0'});assert.match(el('#verdict').innerHTML,/5 MeasurementReports/);
ok('cursor, log rows, maxReportCells and reportOnLeave update the panels');

for(let i=0;i<5;i++)click('#presets',{i});
click('#presets',{i:1});assert.match(el('#verdict').innerHTML,/2 MeasurementReports/);assert.match(text('#state'),/cellsTriggeredList A/);
click('#presets',{i:3});assert.match(el('#verdict').innerHTML,/A listed from 1160 ms; B listed from 360 ms/);
input('#ttt','0');input('#int','4');input('#amt','4');input('#off','6');input('#hys','3');
ok('all presets and parameter extremes render');

// Drawing: a mouse press in the plot sets cell B at that sample; a press below the plot only moves the cursor.
click('#presets',{i:0});click('#paint',{v:'B'});
const fig=el('#fig');
fig.handlers.pointerdown({clientX:1000,clientY:300+300,pointerType:'mouse',preventDefault(){}});
assert.match(el('#now-t').textContent,/^\d+ ms$/);const moved=el('#fig').innerHTML;assert.match(moved,/class="trace b" d="M78 /);
fig.handlers.pointerdown({clientX:78+(1100-78-18)*0.1,clientY:30+17*1.5,pointerType:'mouse',preventDefault(){},pointerId:1});
fig.handlers.pointerup({});
assert.equal(el('#now-t').textContent,'200 ms');assert.notEqual(el('#fig').innerHTML.match(/class="trace b" d="[^"]+/)[0],moved.match(/class="trace b" d="[^"]+/)[0]);
fig.handlers.keydown({key:'ArrowUp',preventDefault(){}});fig.handlers.keydown({key:'a'});fig.handlers.keydown({key:'ArrowRight',preventDefault(){}});
ok('pointer drawing, lane click and keyboard handlers run');

// Settings bar: buttons show current values; a button opens its group's popover, the close button hides it.
click('#presets',{i:0});
assert.equal(el('#maxc-o').textContent,1);assert.equal(el('#amt-o').textContent,'r2');assert.equal(el('#ttt-o').textContent,'ms160');assert.equal(el('#onleave-o').textContent,'true');
el('#pop-content').hidden=true;click('#bar',{pop:'content'});assert.equal(el('#pop-content').hidden,false);
click('#maxc',{v:'2'});assert.equal(el('#maxc-o').textContent,2);assert.equal(el('#pop-content').hidden,false);
el('#pop-content').handlers.click({target:{closest:s=>s==='[data-close]'?{}:null}});assert.equal(el('#pop-content').hidden,true);
click('#bar',{pop:'count'});assert.equal(el('#pop-count').hidden,false);click('#bar',{pop:'list'});assert.equal(el('#pop-count').hidden,true);assert.equal(el('#pop-list').hidden,false);
globalThis.innerHeight=500;el('#pop-count').style={};el('#pop-count').getBoundingClientRect=()=>({left:0,top:120});
click('#bar',{pop:'list'});click('#bar',{pop:'count'});assert.equal(el('#pop-count').style.maxHeight,'368px'); // 500 - 120 - 12
ok('settings bar shows values; one popover open at a time; controls inside still drive the model; popover height fits the viewport');

function ok(m){console.log('ok',m);}
