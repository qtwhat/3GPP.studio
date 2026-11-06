(() => {
  'use strict';
  const topics = window.S3_TOPICS;
  const entries = [...window.S3_EXPERIMENTS].sort((a,b)=>(a.status==='live'?0:1)-(b.status==='live'?0:1)||a.order-b.order);
  const $ = id => document.getElementById(id);
  const normalize = value => String(value).normalize('NFKC').toLocaleLowerCase().trim();
  const topicIds = new Set(topics.map(t=>t.id));
  const labels = Object.fromEntries(topics.map(t=>[t.id,t]));
  let selected = new Set(), debounce;
  function element(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
  function readURL(){const p=new URLSearchParams(location.search);$('search').value=(p.get('q')||'').slice(0,300);selected=new Set((p.get('topic')||'').split(',').filter(x=>topicIds.has(x)));$('live').checked=p.get('live')==='1';}
  function query(){const p=new URLSearchParams();const q=$('search').value.trim();if(q)p.set('q',q);const ids=topics.filter(t=>selected.has(t.id)).map(t=>t.id);if(ids.length)p.set('topic',ids.join(','));if($('live').checked)p.set('live','1');return p.toString();}
  function card(entry){const p=new URLSearchParams();if(query())p.set('from',query());return S3_UI.card(entry,entry.href+(p.size?'?'+p.toString():''));}
  const corpus=new Map(entries.map(e=>[e.id,normalize([e.title,e.summary,...e.searchTerms,...e.topics.flatMap(t=>[labels[t].label,...labels[t].searchTerms])].join(' '))]));
  function render(writeURL=true){
    clearTimeout(debounce);
    const words=normalize($('search').value).split(/\s+/).filter(Boolean);
    const matches=entries.filter(e=>words.every(w=>corpus.get(e.id).includes(w))&&(!selected.size||e.topics.some(t=>selected.has(t)))&&(!$('live').checked||e.status==='live'));
    if(writeURL){try{history.replaceState(null,'',location.pathname+(query()?'?'+query():''));}catch{/* file URL histories differ between browsers; local filtering still works. */}}
    $('topics').querySelectorAll('button').forEach(b=>{const t=labels[b.dataset.topic];const on=selected.has(t.id);b.setAttribute('aria-pressed',String(on));});
    const hasFilters=Boolean(query());$('clear').hidden=!hasFilters;$('empty').hidden=matches.length!==0;
    $('result-count').textContent=hasFilters?S3_STRINGS.filtered(matches.length,entries.length):S3_STRINGS.count(entries.length,entries.filter(e=>e.status==='live').length);
    $('experiments').replaceChildren(...matches.map(card));
  }
  function clear(){clearTimeout(debounce);$('search').value='';selected.clear();$('live').checked=false;render();$('search').focus();}
  topics.forEach(t=>{const b=S3_UI.chip(t.label);b.type='button';b.dataset.topic=t.id;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{selected.has(t.id)?selected.delete(t.id):selected.add(t.id);render();});$('topics').append(b);});
  $('search').addEventListener('input',()=>render());
  $('search').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();$('search').value='';render();}});
  $('search-form').addEventListener('submit',e=>{e.preventDefault();render();});
  $('live').addEventListener('change',()=>render());$('clear').addEventListener('click',clear);$('empty-clear').addEventListener('click',clear);
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.activeElement.isContentEditable){e.preventDefault();$('search').focus();}});
  window.addEventListener('popstate',()=>{readURL();render(false);});
  window.addEventListener('pageshow',()=>{readURL();render(false);});
  const media=matchMedia('(max-width:639px)');function placeholder(){ $('search').placeholder=media.matches?'Search, e.g. LCP or PBR':'Search by mechanism or term, e.g. LCP, PBR, measurement gap';}media.addEventListener('change',placeholder);placeholder();document.querySelector('[data-footer]').textContent=S3_STRINGS.footer;
  readURL();render();
})();
