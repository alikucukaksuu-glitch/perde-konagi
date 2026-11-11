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
const cat=path.includes('tul')?'tul':path.includes('plise')?'plise':path.includes('jaluzi')?'wood':path.includes('mat-stor')?'stor':'zebra';
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
const originalGuide=section.parentNode.querySelector('#pk-guide');
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