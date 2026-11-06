// Shared helpers for explainer labs: catalog return link and tiny DOM utilities.
const TOPICS=['measurement','scheduling','power','security','beam'];
export function wireBackLink(a){
  const from=new URLSearchParams(new URLSearchParams(location.search).get('from')||''),back=new URLSearchParams();
  const q=(from.get('q')||'').slice(0,300);if(q)back.set('q',q);
  const topics=(from.get('topic')||'').split(',').filter(t=>TOPICS.includes(t));if(topics.length)back.set('topic',topics.join(','));
  if(from.get('live')==='1')back.set('live','1');
  a.href='../../index.html'+(back.size?'?'+back:'');
}
export const $=(s,root=document)=>root.querySelector(s);
export const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const fmt=n=>n===Infinity?'∞':Number(n).toLocaleString('en-US');
