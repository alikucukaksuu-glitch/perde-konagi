/* Unified per-product preparation and handover estimate (all storefront categories). */
(function(){
 'use strict';
 const path=location.pathname.split('/').pop()||'';
 const query=new URLSearchParams(location.search);
 if(['plise-perde.html','ahsap-jaluzi.html','tul-perde.html'].includes(path)&&!query.has('slug'))return;
 if(path==='urun.html'&&!query.has('slug'))return;
 const slug=query.get('slug')||path.replace(/\.html$/,'');
 if(!slug||slug==='index')return;
 const anchors=[
  '.pp-product-intro .pp-price-explain',
  '.pp-product-intro .pp-price-live',
  '.customizer .unit'
 ];
 const anchor=anchors.map(s=>document.querySelector(s)).find(Boolean);
 if(!anchor||document.getElementById('pk-production-estimate'))return;
 const style=document.createElement('style');
 style.textContent='#pk-production-estimate{display:flex;align-items:center;gap:13px;margin:16px 0;padding:13px 15px;background:#fff9ef;border:1px solid #cc9d5c;border-radius:9px;color:#3b2d23;font-family:Arial,Helvetica,sans-serif;box-shadow:0 2px 9px rgba(86,59,29,.05)}#pk-production-estimate .pk-production-clock{font-size:24px;line-height:1;flex-shrink:0;color:#956a32}#pk-production-estimate .pk-production-title{display:block;font-size:13px;font-weight:700;margin-bottom:5px}#pk-production-estimate .pk-production-body{display:block;font-size:12px;line-height:1.5;color:#655545}';
 document.head.append(style);
 const box=document.createElement('div');box.id='pk-production-estimate';box.setAttribute('role','status');
 const clock=document.createElement('span');clock.className='pk-production-clock';clock.setAttribute('aria-hidden','true');clock.textContent='◷';
 const content=document.createElement('span');
 const title=document.createElement('strong');title.className='pk-production-title';title.textContent='Tahmini Üretim Süresi';
 const body=document.createElement('span');body.className='pk-production-body';body.textContent='Hazırlanma ve kargoya verilme süresi sipariş öncesinde teyit edilir.';
 content.append(title,body);box.append(clock,content);
 anchor.insertAdjacentElement('afterend',box);
 async function load(){
  try{
   const base='https://rwylhxrtggsicieuyjrm.supabase.co';
   const key='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
   const url=base+'/rest/v1/shop_product_details?select=production_min_days,production_max_days&slug=eq.'+encodeURIComponent(slug)+'&limit=1';
   const response=await fetch(url,{headers:{apikey:key},cache:'no-store'});
   if(!response.ok)return;
   const records=await response.json();const record=records[0];if(!record)return;
   const a=record.production_min_days,b=record.production_max_days;
   if(Number.isInteger(a)&&Number.isInteger(b)&&a>=1&&b>=a&&b<=90){
    const days=a===b?a+' iş günü':a+'–'+b+' iş günü';
    body.textContent='Siparişiniz '+days+' içinde hazırlanarak kargoya verilir.';
   }
  }catch(_){/* Default noncommittal estimate remains visible. */}
 }
 load();
})();

(()=>{'use strict';
if(document.getElementById('pk-product-tab-system'))return;
const path=location.pathname.split('/').pop()||'';
const query=new URLSearchParams(location.search);
if(['plise-perde.html','ahsap-jaluzi.html','tul-perde.html'].includes(path)&&!query.has('slug'))return;
if(path==='urun.html'&&!query.has('slug'))return;
let slug=query.get('slug')||path.replace(/\.html$/,'');
if(!slug||slug==='index')return;
const section=document.querySelector('#tc-description-section,#pp-description-section,#wb-description-section,main section.article,main .article');
if(!section)return;
const cat=path.includes('tul')||slug.includes('tul')?'tul':path.includes('plise')||slug.includes('plise')?'plise':path.includes('jaluzi')||slug.includes('jaluzi')?'wood':path.includes('mat-stor')||slug.includes('stor')?'stor':'zebra';
const fallbacks={
 tul:{measure:'Perdenin bitmiş enini ve boyunu santimetre olarak ölçün.\nEn: Perdenin kaplayacağı alanı soldan sağa ölçün.\nBoy: Kornişten istediğiniz bitiş noktasına kadar ölçün.\nÖlçüleri tam santimetre olarak girin.',install:'Pile sıklığını seçin ve korniş düğmeli ya da rustik/halkalı dikim tercihinizi belirleyin.\nSipariş öncesi ölçüleri ve dikim seçiminizi kontrol edin.',care:'Ürünün kumaş bakım etiketini kontrol edin.\nHassas yıkama ve uygun sıcaklık talimatlarına uyun.\nAğartıcı kullanmayın.'},
 plise:{measure:'Uygulanacak camın enini ve boyunu ölçün.\nMontaj şekline göre gerekli payları kontrol edin.\nÖlçüleri ürün sayfasındaki hassasiyette girin.',install:'Montaj yüzeyine uygun vidalı veya askılı sistemi seçin.\nCam balkon ve PVC uygulamalarında doğru bağlantı aparatını kullanın.',care:'Tozu yumuşak fırça veya kuru mikrofiber bezle alın.\nKumaşı zorlamadan ve ıslatmadan temizleyin.'},
 wood:{measure:'Montaj alanının enini ve boyunu ölçün.\nÖlçüleri 0,5 cm adımlarla girin.\nMontaj için gerekli payı dikkate alın.',install:'Kurdelalı veya ipli mekanizma tercihinizi kontrol edin.\nTaşıyıcı ayakları zemine uygun sabitleyin.',care:'Tozu kuru, yumuşak bezle temizleyin.\nAhşabı yoğun suya ve aşındırıcı maddelere maruz bırakmayın.'},
 stor:{measure:'Perdenin kaplayacağı alanı soldan sağa ölçün.\nMontaj noktasından istediğiniz bitişe kadar boyu ölçün.\nKasa için uygun boşluğu bırakın.',install:'Duvar, tavan veya korniş montajına uygun ayakları seçin.\nZinciri çocuk güvenliği için sabitleyin.',care:'Tozu yumuşak bir fırça veya kuru mikrofiber bezle temizleyin.\nKumaşı makinede yıkamayın.'},
 zebra:{measure:'Perdenin kaplayacağı alanı soldan sağa ölçün.\nMontaj noktasından bitiş noktasına kadar boyu ölçün.\nÖlçüleri santimetre cinsinden girin ve kasa payını kontrol edin.',install:'Montaj yerine uygun aparatla sabitleyin.\nZincir yönünü ve mekanizmayı kontrol edin.\nÇocuk güvenliği için zinciri sabitleyin.',care:'Tozu kuru mikrofiber bezle veya yumuşak fırçayla temizleyin.\nLekeleri hafif nemli bezle silin.\nKumaşı makinede yıkamayın.'}
};
const defaults=fallbacks[cat];
const labels=[['description','Ürün Açıklaması','▤'],['measure','Ölçü Alma','↔'],['install','Dikim ve Montaj','⚒'],['care','Bakım ve Temizlik','✧']];
const wrapper=document.createElement('section');wrapper.id='pk-product-tab-system';wrapper.setAttribute('aria-label','Ürün açıklaması ve rehber sekmeleri');
if(cat==='tul')wrapper.classList.add('tc-product-only');
if(cat==='plise')wrapper.classList.add('pp-product-only');
if(cat==='wood')wrapper.classList.add('wb-product-only');
wrapper.innerHTML='<div class="pk-tabs-nav" role="tablist" aria-label="Ürün bilgileri"></div><div class="pk-tabs-panels"></div>';
section.parentNode.insertBefore(wrapper,section);
const nav=wrapper.querySelector('.pk-tabs-nav'),panels=wrapper.querySelector('.pk-tabs-panels');
const originalGuide=document.querySelector('#pk-guide');
if(originalGuide)originalGuide.hidden=true;
if(cat==='tul'){const old=document.querySelector('#tc-below .tc-help');if(old)old.hidden=true}
if(cat==='wood'){for(const selector of ['#wb-below .wb-quick-guides','#wb-below .wb-guides']){const old=document.querySelector(selector);if(old)old.hidden=true}}
let active='description',data={};
for(const [id,title,icon] of labels){
 const b=document.createElement('button');b.type='button';b.id='pk-tab-'+id;b.className='pk-tab';b.setAttribute('role','tab');b.setAttribute('aria-controls','pk-tab-panel-'+id);b.textContent=icon+'  '+title;
 const panel=document.createElement('div');panel.id='pk-tab-panel-'+id;panel.className='pk-tab-panel';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',b.id);
 if(id==='description'){section.classList.add('pk-description-inside');panel.append(section);}
 else {
  const heading=document.createElement('h2');heading.textContent=title;panel.append(heading);
  const img=document.createElement('img');img.className='pk-tab-guide-image';img.alt=title+' rehber görseli';img.hidden=true;panel.append(img);
  if(id==='measure'){
   const illustration=document.createElement('div');illustration.className='pk-default-illustration';
   illustration.innerHTML='<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="En ve boy ölçü okları"><rect x="70" y="20" width="170" height="155" rx="4" stroke="#a99e92" stroke-width="8" fill="#e7efeb"/><path d="M155 22v150M74 95h164" stroke="#fff" stroke-width="6"/><path d="M75 61h163M75 61l12 -6v12zM238 61l-12 -6v12zM268 22v150M268 22l-6 12h12zM268 172l-6 -12h12z" stroke="#aa7b42" stroke-width="3" fill="#aa7b42"/><rect x="137" y="50" width="38" height="22" fill="#fff9ea" rx="3"/><text x="156" y="65" fill="#72542d" font-family="Arial" font-size="13" text-anchor="middle">EN</text><text x="285" y="107" fill="#72542d" font-family="Arial" font-size="12">BOY</text></svg>';
   panel.append(illustration);
  }
  const content=document.createElement('div');content.id='pk-tab-text-'+id;content.className='pk-tab-text';panel.append(content);
 }
 nav.append(b);panels.append(panel);
 b.addEventListener('click',()=>activate(id));
}
function activate(id){
 active=id;
 for(const [key] of labels){
  const selected=key===id;
  const button=document.getElementById('pk-tab-'+key),panel=document.getElementById('pk-tab-panel-'+key);
  button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;panel.hidden=!selected;
 }
}
function localImage(value){
 const text=String(value||'').trim();
 if(!text)return '';
 if(/^https:\/\/[^\s]+$/i.test(text))return text;
 if(/^[a-z0-9_./-]+$/i.test(text)&&!text.includes('..')&&!text.startsWith('/'))return new URL(text,location.href).href;
 return '';
}
function fillGuides(d){
 data=d||{};
 for(const id of ['measure','install','care']){
  const el=document.getElementById('pk-tab-text-'+id);
  el.replaceChildren();
  const value=String(data[id+'_text']||defaults[id]||'');
  for(const line of value.split(/\r?\n/)){if(!line.trim())continue;const p=document.createElement('p');p.textContent=line;el.append(p)}
  const img=document.querySelector('#pk-tab-panel-'+id+' .pk-tab-guide-image');
  const source=localImage(data[id+'_image']);img.hidden=!source;
  if(source){img.src=source;img.onerror=()=>{img.hidden=true;img.removeAttribute('src')}}else img.removeAttribute('src');
  const illustration=document.querySelector('#pk-tab-panel-'+id+' .pk-default-illustration');
  if(illustration)illustration.hidden=!!source;
 }
}
fillGuides(null);activate('description');
async function load(){
 try{
  let lib=window.supabase;
  if(!lib?.createClient)return;
  const sb=lib.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
  const {data:record,error}=await sb.from('shop_product_guides').select('measure_text,install_text,care_text,measure_image,install_image,care_image').eq('slug',slug).maybeSingle();
  if(!error&&record)fillGuides(record);
 }catch(e){/* show category-appropriate guide defaults if unavailable */}
}
load();
})();

/* Smooth, finger-following product carousel. Uses each gallery's existing thumbnail actions. */
(function(){
 'use strict';
 if(window.pkGallerySwipeInstalled)return;
 window.pkGallerySwipeInstalled=true;
 const galleries=[
  ['img.mainpic','#main','.thumbs button'],
  ['#pp-window','#pp-main-image','#pp-gallery-strip button'],
  ['#tc-photo','#tc-photo','#tc-gallery button'],
  ['#wb-main-image','#wb-main-image','#wb-gallery button']
 ];
 const style=document.createElement('style');
 style.textContent=[
  'img.mainpic,#pp-window,#tc-photo,#wb-main-image{touch-action:pan-y;user-select:none;-webkit-user-select:none;-webkit-user-drag:none}',
  '.pk-swipe-window{position:fixed;z-index:1000;overflow:hidden;pointer-events:none;background:#f4f0ec;contain:paint}',
  '.pk-swipe-track{height:100%;width:300%;display:flex;will-change:transform}',
  '.pk-swipe-slide{width:33.333333%;height:100%;flex:0 0 33.333333%;overflow:hidden}',
  '.pk-swipe-slide img{width:100%;height:100%;display:block;user-select:none;-webkit-user-drag:none}'
 ].join('');
 document.head.appendChild(style);
 let gesture=null;
 function findGallery(target){
  if(!(target instanceof Element))return null;
  for(const [surface,image,selector] of galleries){
   const el=target.closest(surface);
   if(el)return {el,image,selector};
  }
  return null;
 }
 function destroy(g){
  if(g?.overlay){g.overlay.remove();g.overlay=null;g.track=null}
 }
 function makeOverlay(g){
  const img=document.querySelector(g.gallery.image);
  if(!img)return false;
  const box=g.gallery.el.getBoundingClientRect();
  if(box.width<30||box.height<30)return false;
  const overlay=document.createElement('div');
  overlay.className='pk-swipe-window';
  Object.assign(overlay.style,{left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px',borderRadius:getComputedStyle(g.gallery.el).borderRadius||'0px'});
  const track=document.createElement('div');
  track.className='pk-swipe-track';
  const fit=getComputedStyle(img).objectFit||'cover';
  const position=getComputedStyle(img).objectPosition||'center';
  for(const offset of [-1,0,1]){
   const slide=document.createElement('div');slide.className='pk-swipe-slide';
   const photo=document.createElement('img');
   const index=g.index+offset;
   const thumb=g.buttons[index]?.querySelector('img');
   photo.src=offset===0?img.currentSrc||img.src:(thumb?.currentSrc||thumb?.src||img.src);
   photo.alt='';
   photo.draggable=false;
   photo.style.objectFit=fit;photo.style.objectPosition=position;
   slide.appendChild(photo);track.appendChild(slide);
  }
  overlay.appendChild(track);document.body.appendChild(overlay);
  g.overlay=overlay;g.track=track;g.width=box.width;
  return true;
 }
 function position(g,dx,animate){
  g.track.style.transition=animate?'transform 240ms cubic-bezier(.22,.8,.22,1)':'none';
  g.track.style.transform='translate3d(calc(-33.333333% + '+dx+'px),0,0)';
 }
 document.addEventListener('touchstart',e=>{
  if(e.touches.length!==1||gesture?.overlay)return;
  const gallery=findGallery(e.target);
  if(!gallery)return;
  const buttons=[...document.querySelectorAll(gallery.selector)].filter(b=>!b.disabled);
  if(buttons.length<2)return;
  const img=document.querySelector(gallery.image);
  let index=buttons.findIndex(b=>b.classList.contains('active')||b.getAttribute('aria-pressed')==='true');
  if(index<0&&img)index=buttons.findIndex(b=>b.querySelector('img')?.src===img.src);
  gesture={gallery,buttons,index:Math.max(index,0),x:e.touches[0].clientX,y:e.touches[0].clientY,time:Date.now(),mode:'pending',overlay:null};
 },{passive:true});
 document.addEventListener('touchmove',e=>{
  const g=gesture;
  if(!g||e.touches.length!==1)return;
  const dx=e.touches[0].clientX-g.x;
  const dy=e.touches[0].clientY-g.y;
  if(g.mode==='pending'){
   if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>9){gesture=null;return}
   if(Math.abs(dx)<8||Math.abs(dx)<Math.abs(dy)*1.2)return;
   if(!makeOverlay(g)){gesture=null;return}
   g.mode='drag';
  }
  if(g.mode!=='drag')return;
  if(e.cancelable)e.preventDefault();
  const edge=dx>0&&g.index===0||dx<0&&g.index===g.buttons.length-1;
  const shown=edge?dx*.18:dx;
  position(g,Math.max(-g.width,Math.min(g.width,shown)),false);
 },{passive:false});
 document.addEventListener('touchend',e=>{
  const g=gesture;gesture=null;
  if(!g||g.mode!=='drag'||!g.overlay||e.changedTouches.length!==1)return;
  const dx=e.changedTouches[0].clientX-g.x;
  const dy=e.changedTouches[0].clientY-g.y;
  const direction=dx<0?1:-1;
  const next=g.index+direction;
  const shouldChange=Math.abs(dx)>Math.max(45,g.width*.18)&&Math.abs(dx)>Math.abs(dy)*1.2&&next>=0&&next<g.buttons.length;
  position(g,shouldChange?-direction*g.width:0,true);
  window.setTimeout(()=>{
   if(shouldChange&&g.buttons[next].isConnected)g.buttons[next].click();
   destroy(g);
  },250);
 },{passive:true});
 document.addEventListener('touchcancel',()=>{destroy(gesture);gesture=null},{passive:true});
})();
