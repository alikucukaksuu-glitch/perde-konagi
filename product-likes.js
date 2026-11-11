(()=>{'use strict';
const page=location.pathname.split('/').pop()||'';
const q=new URLSearchParams(location.search);
if(['plise-perde.html','tul-perde.html','ahsap-jaluzi.html'].includes(page)&&!q.has('slug'))return;
if(page==='urun.html'&&!q.has('slug'))return;
const slug=q.get('slug')||page.replace(/\.html$/,'');
if(!/^[a-z0-9-]{3,95}$/.test(slug))return;
const endpoint='https://rwylhxrtggsicieuyjrm.supabase.co';
const key='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
let visitor=null,button=null,countEl=null,liked=false,count=0,busy=false;
function getVisitor(){
 try{
  const store=localStorage, storageKey='pk-like-visitor-v1';
  let value=store.getItem(storageKey);
  if(!value||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)){
   value=crypto.randomUUID();store.setItem(storageKey,value);
  }
  return value;
 }catch(e){return null}
}
async function rpc(name){
 const response=await fetch(endpoint+'/rest/v1/rpc/'+name,{
  method:'POST',headers:{apikey:key,'Content-Type':'application/json'},
  body:JSON.stringify({p_slug:slug,p_visitor:visitor}),cache:'no-store'});
 const data=await response.json().catch(()=>null);
 if(!response.ok)throw Error(data?.message||'Beğeni bilgisi alınamadı.');
 return data;
}
function render(){
 if(!button)return;
 button.disabled=busy||!visitor;
 button.setAttribute('aria-pressed',String(liked));
 const label=button.querySelector('.pk-like-label');
 label.textContent=liked?'Beğenildi':'Beğen';
 countEl.textContent=count.toLocaleString('tr-TR')+' beğeni';
}
function mount(){
 if(button)return;
 const anchor=document.getElementById('pk-production-estimate');
 if(!anchor)return;
 visitor=getVisitor();
 const style=document.createElement('style');
 style.textContent='.pk-like-inline{display:flex;align-items:center;flex-wrap:wrap;gap:11px;margin:9px 0 18px;font:12px Arial,Helvetica,sans-serif}.pk-like-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid #d6bca0;background:transparent;color:#765333;border-radius:7px;padding:7px 11px;font:600 12px Arial,sans-serif;cursor:pointer;transition:background .18s,color .18s}.pk-like-btn:hover{background:#fff5e8}.pk-like-btn[aria-pressed="true"]{background:#f4e7d6;color:#744624}.pk-like-btn:disabled{opacity:.6;cursor:wait}.pk-like-btn svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linejoin:round;stroke-linecap:round}.pk-like-btn[aria-pressed="true"] svg{fill:currentColor;stroke:currentColor}.pk-like-count{color:#74695e;font-size:12px}.pk-like-btn:focus-visible{outline:2px solid #a67b46;outline-offset:3px}';
 document.head.append(style);
 const holder=document.createElement('div');holder.className='pk-like-inline';holder.setAttribute('aria-label','Ürün beğenileri');
 button=document.createElement('button');button.type='button';button.className='pk-like-btn';button.setAttribute('aria-pressed','false');
 button.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3Zm0 0 5.1-7.1A2 2 0 0 1 15.7 4l-.5 6H20a2 2 0 0 1 2 2.4l-1.5 7a2 2 0 0 1-2 1.6H7"/></svg><span class="pk-like-label">Beğen</span>';
 countEl=document.createElement('span');countEl.className='pk-like-count';countEl.textContent='— beğeni';
 holder.append(button,countEl);anchor.insertAdjacentElement('afterend',holder);
 button.addEventListener('click',async()=>{
  if(busy||!visitor)return;
  busy=true;
  const before={liked,count};
  // Respond immediately, then reconcile against the saved database result.
  liked=!liked;count=Math.max(0,count+(liked?1:-1));render();
  try{
   const result=await rpc('pk_product_like_toggle');
   liked=!!result.liked;count=Number(result.count)||0;
  }catch(e){
   liked=before.liked;count=before.count;
   countEl.textContent='Beğeni kaydedilemedi';
  }finally{busy=false;render()}
 });
 render();
 if(!visitor){countEl.textContent='Tarayıcı depolaması gerekli';return}
 rpc('pk_product_like_status').then(result=>{
  if(busy)return;
  liked=!!result.liked;count=Number(result.count)||0;render();
 }).catch(()=>{countEl.textContent='Beğeni sayısı yüklenemedi'});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();