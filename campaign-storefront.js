(()=>{'use strict';
const base='https://rwylhxrtggsicieuyjrm.supabase.co';
const key='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const money=v=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(v)||0);
const slug=location.pathname.endsWith('/urun.html')?new URLSearchParams(location.search).get('slug'):location.pathname.split('/').pop().replace(/\.html$/,'');
const productPage=Boolean(document.getElementById('en')&&document.querySelector('.customizer'));
let campaigns=[],promosReady=false,quotes=0;
const priceDiscount=(c,base)=>{const v=Number(c.discount_value)||0;switch(c.discount_type){case 'percent':return Math.round(base*v)/100;case'fixed':return Math.min(base,v);case'new_price':return Math.max(0,base-v);default:return 0}};
function best(list,base){let winner=null,high=-1;for(const item of list){const n=priceDiscount(item,base);if(n>high){high=n;winner=item}}return winner}
async function fetchCampaigns(){
 const r=await fetch(base+'/rest/v1/shop_campaigns?select=product_slug,campaign_type,badge_text,discount_type,discount_value,starts_on,ends_on,enabled,coupon_code',{headers:{apikey:key,Accept:'application/json'},cache:'no-store'});
 if(!r.ok)throw new Error('Kampanyalar yüklenemedi');return r.json();
}
function addBadge(card,c){
 if(!card||card.querySelector('.pk-campaign-tag'))return;
 const anchor=card.querySelector('.product-image')||card.querySelector('img')?.parentElement;
 if(!anchor)return;
 anchor.classList.add('pk-campaign-anchor');
 const tag=document.createElement('span');tag.className='pk-campaign-tag '+c.campaign_type;tag.textContent=c.badge_text;
 anchor.append(tag);
}
function updateCards(){
 for(const card of document.querySelectorAll('.product-card,.cards .product')){
  if(card.dataset.pkCampaignApplied==='true')continue;
  const a=card.querySelector('a[href*=".html"]')||(card.matches('a')?card:null);
  const href=a?.getAttribute('href')||'';
  const itemSlug=href.includes('urun.html?')?new URLSearchParams(href.split('?')[1]||'').get('slug'):href.split('/').pop().replace(/\.html$/,'');
  if(!itemSlug)continue;
  const entries=campaigns.filter(c=>c.product_slug===itemSlug);
  if(!entries.length)continue;
  const price=card.querySelector('.product-price'),desc=card.querySelector('.desc');
  const listed=(price?.textContent||'').match(/(\d[\d.,]*)\s*TL/)||(desc?.textContent||'').match(/(\d[\d.,]*)\s*TL\/m²/);
  const current=listed?Number(listed[1].replace(/\./g,'').replace(',','.')):0;
  const c=best(entries,current);
  if(!c)continue;addBadge(card,c);
  // Fixed TL discounts apply to the entire configured curtain, not to each square metre.
  if(c.discount_type==='fixed'){card.dataset.pkCampaignApplied='true';continue}
  if(!current)continue;
  const off=priceDiscount(c,current);
  if(off>0&&price){
   const old=document.createElement('s');old.textContent=money(current);old.className='pk-campaign-original';
   price.replaceChildren(old,document.createTextNode(' '+money(current-off)+' / m²'));
   price.classList.add('pk-campaign-price');
  }else if(off>0&&desc){
   desc.textContent=desc.textContent.replace(/\s*·?\s*\d[\d.,]*\s*TL\/m²/,'').trim();
   const line=document.createElement('div');line.className='pk-category-campaign-price';
   const old=document.createElement('s');old.textContent=money(current);old.className='pk-campaign-original';
   const discounted=document.createElement('strong');discounted.textContent=money(current-off)+' / m²';
   line.append(old,discounted);desc.after(line);
  }
  card.dataset.pkCampaignApplied='true';
 }
}
function getValue(name){return document.querySelector('input[name="'+name+'"]:checked')?.value||''}
function quoteOptions(){
 const kasa=getValue('Kasa Seçeneği');
 return {p_slug:slug,p_width_cm:Number(document.getElementById('en')?.value),p_height_cm:Number(document.getElementById('boy')?.value),p_kasa_tip:kasa,p_kasa_renk:kasa==='acik'?'':document.querySelector('#kasa-swatches button[aria-pressed="true"]')?.title||'',p_zincir:getValue('Mekanizma Zincir Tipi'),p_yon:getValue('Mekanizma Zincir Yönü'),p_boru:getValue('Mekanizma Borusu'),p_ayak:getValue('Mekanizma Yan Ayak')};
}
async function refreshQuote(){
 if(!promosReady||!window.pkCatalogValidated)return;
 const seq=++quotes,inputs=quoteOptions();
 if(!Number.isInteger(inputs.p_width_cm)||!Number.isInteger(inputs.p_height_cm)||inputs.p_width_cm<50||inputs.p_height_cm<50)return;
 const add=document.getElementById('add-cart'),box=document.getElementById('breakdown');if(!add||!box)return;
 add.disabled=true;add.textContent='İndirimli fiyat doğrulanıyor…';box.hidden=true;
 try{
  const response=await fetch(base+'/rest/v1/rpc/shop_quote_with_promo',{method:'POST',headers:{'Content-Type':'application/json',apikey:key},body:JSON.stringify(inputs),cache:'no-store'});
  if(!response.ok)throw new Error('Fiyat doğrulanamadı');
  const q=await response.json();if(seq!==quotes)return;
  const total=Number(q.unit_total),diff=Number(q.discount_amount)||0;
  if(diff>0){
   const previous=box.querySelector('.pk-campaign-discount');previous?.remove();
   const row=document.createElement('div');row.className='break-row pk-campaign-discount';
   const label=document.createElement('span');label.textContent='✓ '+(q.campaign_badge||'Kampanya indirimi');
   const amount=document.createElement('span');amount.textContent='−'+money(diff);row.append(label,amount);
   const last=box.querySelector('.break-total');if(last)last.before(row);
  }
  const last=box.querySelector('.break-total b:last-child');if(last)last.textContent=money(total);
  box.hidden=false;
  add.textContent=money(total)+' — Sepete Ekle';add.disabled=false;
 }catch{
  if(seq!==quotes)return;
  add.disabled=true;add.textContent='İndirimli fiyat doğrulanamadı';
 }
}
function updateProduct(){
 if(!productPage||!window.pkCatalogValidated)return;
 const list=campaigns.filter(c=>c.product_slug===slug);
 if(!list.length)return;
 const price=Number(window.pkCatalogPricePerSqm)||0,c=best(list,price);
 if(!c)return;
 const title=document.querySelector('h1');if(!title)return;
 if(!document.querySelector('.pk-product-campaign')){
  const notice=document.createElement('div');notice.className='pk-product-campaign';notice.textContent='✦ '+c.badge_text;
  title.after(notice);
 }
 const unit=document.querySelector('.customizer .unit'),off=priceDiscount(c,price);
 if(unit&&off>0&&c.discount_type!=='fixed'){
  const suffix=c.discount_type==='fixed'?' (1 m² örneği)':'';
  unit.innerHTML='';
  const old=document.createElement('s');old.className='pk-campaign-original';old.textContent=money(price);
  const amount=document.createElement('strong');amount.textContent=money(price-off);
  const small=document.createElement('small');small.textContent=' / m²'+suffix;
  unit.append(old,document.createTextNode(' '),amount,small);
 }
 if(!promosReady){
  promosReady=true;
  document.addEventListener('input',e=>{if(e.target.closest('.customizer'))refreshQuote()});
  document.addEventListener('change',e=>{if(e.target.closest('.customizer'))refreshQuote()});
  document.addEventListener('click',e=>{if(e.target.closest('#kasa-swatches'))refreshQuote()});
 }
 refreshQuote();
}
function paint(){if(productPage)updateProduct();else updateCards()}
async function init(){
 try{campaigns=(await fetchCampaigns()).filter(c=>!c.coupon_code);paint()}catch(e){/* Catalog remains functional if campaigns service is offline. */ }
}
window.addEventListener('pk-catalog-ready',()=>paint());
init();
})();