(()=>{'use strict';
const BASE='https://rwylhxrtggsicieuyjrm.supabase.co';
const KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const pageSlug=location.pathname.split('/').pop().replace(/\.html$/,'');
const slug=pageSlug==='urun'?(new URLSearchParams(location.search).get('slug')||''):pageSlug;
const productPage=Boolean(document.querySelector('#en')&&document.querySelector('#boy')&&document.querySelector('.customizer'));
const fmt=value=>new Intl.NumberFormat('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value));
const statusMsg='Bu ürün şu anda satışa kapalıdır. Ürünü inceleyebilirsiniz ancak sepetinize ekleyemezsiniz.';
const staticSlugs=new Set(['bambu-bej-zebra-perde','bambu-beyaz-zebra-perde','bambu-gri-zebra-perde','bambu-kahve-zebra-perde','bambu-siyah-gecisli-zebra-perde','bambu-siyah-zebra-perde','mat-stor-antrasit','mat-stor-gri','mat-stor-kahve','mat-stor-kirik-beyaz','mat-stor-krem','mat-stor-mavi','mat-stor-siyah','mat-stor-turuncu']);
const publicPhoto=path=>path.startsWith('legacy:')?path.slice(7):'https://rwylhxrtggsicieuyjrm.supabase.co/storage/v1/object/public/product-images/'+path.split('/').map(encodeURIComponent).join('/');
const allowedTags=new Set(['P','BR','STRONG','B','EM','I','U','UL','OL','LI','H2','H3','H4','BLOCKQUOTE']);
function cleanHTML(html){const p=new DOMParser().parseFromString('<div>'+html+'</div>','text/html');const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function walk(n){if(n.nodeType===3)return esc(n.textContent);if(n.nodeType!==1)return '';const inner=[...n.childNodes].map(walk).join('');if(n.tagName==='DIV')return inner;if(!allowedTags.has(n.tagName))return inner;const t=n.tagName.toLowerCase();return '<'+t+'>'+inner+'</'+t+'>'}return [...(p.body.firstElementChild?.childNodes||[])].map(walk).join('')}
async function request(path){
 const r=await fetch(BASE+'/rest/v1/'+path,{headers:{apikey:KEY,Accept:'application/json'},cache:'no-store'});
 if(!r.ok)throw Error('Katalog yanıtı alınamadı');return r.json()
}
function notice(parent,kind,text){
 let n=parent.querySelector('[data-catalog-notice]');
 if(!n){n=document.createElement('div');n.dataset.catalogNotice='true';n.setAttribute('role','status');n.style.cssText='border-radius:9px;padding:12px 14px;margin:12px 0;font-size:13px;line-height:1.5;font-weight:700;';parent.prepend(n)}
 n.style.background=kind==='off'?'#fff0dc':'#fff3e6';n.style.color='#795020';n.style.border='1px solid #e8c69d';n.textContent=text;
}
function blockPurchase(text){
 window.pkCatalogValidated=false;window.pkCatalogActive=false;
 const add=document.getElementById('add-cart'),box=document.getElementById('breakdown');
 if(add){add.disabled=true;add.textContent='Şu Anda Satışa Kapalı'}
 if(box)box.hidden=true;
 const wrapper=document.querySelector('.customizer');
 if(wrapper)notice(wrapper,'off',text);
 const msg=document.getElementById('measure-message');
 if(msg){msg.textContent=text;msg.className='measure-message invalid'}
}
function renderGallery(d){
 if(!Array.isArray(d?.image_paths)||!d.image_paths.length)return;
 window.pkProductImage=publicPhoto(d.image_paths[0]);
 const main=document.getElementById('main'),thumbs=document.querySelector('.thumbs');
 if(!main||!thumbs)return;
 const paths=d.image_paths.map(publicPhoto);
 main.src=paths[0];thumbs.replaceChildren();
 paths.forEach((src,i)=>{
  let button=document.createElement('button');button.type='button';button.className=i?'':'active';button.setAttribute('aria-label','Fotoğraf '+(i+1));const img=document.createElement('img');img.src=src;img.alt='Ürün fotoğrafı '+(i+1);button.append(img);
  button.addEventListener('click',()=>{main.src=src;thumbs.querySelectorAll('button').forEach((b,j)=>b.classList.toggle('active',j===i))});thumbs.append(button);
 });
}
function renderVariantChoices(d){
 const options=Array.isArray(d?.variant_options)?d.variant_options:[];
 if(!options.length)return;
 const custom=document.querySelector('.customizer'),breakdown=document.getElementById('breakdown');
 if(!custom||!breakdown)return;
 const wrapper=document.createElement('div');wrapper.style.cssText='padding:13px;margin:14px 0;border-radius:9px;border:1px solid #e6d7c4;background:#fcf7f1;';
 const title=document.createElement('strong');title.textContent='Ürün Varyantları';title.style.cssText='display:block;font-size:14px;margin:0 0 9px';wrapper.append(title);
 function selected(){const choices={};wrapper.querySelectorAll('input[type=radio]:checked').forEach(e=>choices[e.dataset.label]=e.value);window.pkVariantSelections=choices}
 for(const group of options){
  if(!group?.label||!Array.isArray(group.values)||!group.values.length)continue;
  const name=document.createElement('p');name.style.cssText='font-size:12px;font-weight:700;margin:12px 0 6px';name.textContent=group.label;wrapper.append(name);
  const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;flex-wrap:wrap;';
  group.values.forEach((v,i)=>{const label=document.createElement('label');label.style.cssText='border:1px solid #dfceb9;background:white;border-radius:7px;padding:8px 10px;font-size:12px;cursor:pointer;';const radio=document.createElement('input');radio.type='radio';radio.name='pk-variant-'+group.label;radio.dataset.label=group.label;radio.value=v;radio.checked=i===0;radio.addEventListener('change',selected);label.append(radio,document.createTextNode(' '+v));row.append(label)});wrapper.append(row);
 }
 breakdown.after(wrapper);selected();
}
function showProduct(p,d){
 const value=Number(p.price_per_sqm);
 if(!Number.isFinite(value)||value<=0){blockPurchase('Ürünün fiyat bilgisi doğrulanamadı.');return}
 const unit=document.querySelector('.customizer .unit');
 if(unit){unit.replaceChildren(document.createTextNode(fmt(value)+' TL '));const small=document.createElement('small');small.textContent='/ m²';unit.append(small)}
 const h=document.querySelector('h1');if(h)h.textContent=p.title;
 document.title=(d?.seo_title||p.title)+' | Perde Konağı';
 if(d?.seo_description){let meta=document.querySelector('meta[name="description"]');if(!meta){meta=document.createElement('meta');meta.name='description';document.head.append(meta)}meta.content=d.seo_description}
 if(d?.short_description){const desc=document.querySelector('h1 + p.desc');if(desc)desc.textContent=d.short_description}
 if(pageSlug==='urun'||(d&&typeof d.description_html==='string')){let section=document.querySelector('section.article');if(section){const heading=section.querySelector('h2')||document.createElement('h2');section.replaceChildren(heading);const body=document.createElement('div');body.innerHTML=d?.description_html?cleanHTML(d.description_html):'<p>Bu ürüne henüz açıklama eklenmemiştir.</p>';section.append(body)}}
 renderGallery(d);renderVariantChoices(d);
 if(pageSlug==='urun'){
   const crumb=document.getElementById('pk-crumb-name');
   if(crumb)crumb.textContent=p.title;
   const link=document.getElementById('pk-collection-link');
   if(link){link.href=p.collection==='mat-stor'?'stor-perde.html':'zebra-perde.html';link.textContent=p.collection==='mat-stor'?'Stor Perdeler':'Zebra Perdeler'}
   const subtitle=document.querySelector('.layout .eyebrow');
   if(subtitle)subtitle.textContent=p.collection==='mat-stor'?'PERDE KONAĞI · STOR KOLEKSİYONU':'PERDE KONAĞI · ZEBRA KOLEKSİYONU';
   const loader=document.getElementById('pk-loading');
   const main=document.querySelector('main.wrap');
   if(loader)loader.hidden=true;
   if(main)main.style.display='';
 }
 window.pkMeasureBounds=d?.measurement_options||{};
 const dimensions=[['en','min_width','max_width'],['boy','min_height','max_height']];
 for(const [id,minName,maxName] of dimensions){const input=document.getElementById(id);if(input){input.min=window.pkMeasureBounds[minName]??50;input.max=window.pkMeasureBounds[maxName]??280}}
 window.pkCatalogPricePerSqm=value;window.pkCatalogActive=p.is_active===true;window.pkCatalogValidated=p.is_active===true;
 if(!p.is_active||d?.stock_qty===0||d?.display_status==='draft'){blockPurchase(statusMsg);return}
 if(typeof window.calc==='function')window.calc();
}
function adjustStatic(cards,bySlug,byDetails){
 for(const a of cards){
  const name=a.getAttribute('href')?.split('/').pop().replace(/\.html$/,'');
  if(!name)continue;
  const p=bySlug.get(name),card=a.closest('.product-card,.product');if(!card)continue;
  const price=card.querySelector('.product-price'),desc=card.querySelector('.desc');
  if(!p){if(price)price.textContent='Fiyat doğrulanamıyor';notice(card,'off','Güncel ürün bilgisi alınamadı. Ürün ayrıntılarını inceleyebilirsiniz.');continue}
  const h=card.querySelector('h3');if(h)h.textContent=p.title;
  if(price){price.textContent=fmt(p.price_per_sqm)+' TL ';let small=document.createElement('small');small.textContent='/ m²';price.append(small)}
  if(desc&&/Fiyat yükleniyor/.test(desc.textContent))desc.textContent=desc.textContent.replace('Fiyat yükleniyor…',fmt(p.price_per_sqm)+' TL/m²');
  const d=byDetails.get(name);
  if(d?.image_paths?.[0]){const img=card.querySelector('img');if(img)img.src=publicPhoto(d.image_paths[0])}
  if(!p.is_active||d?.stock_qty===0||d?.display_status==='draft'){notice(card,'off','Şu anda satışa kapalı');card.dataset.saleStatus='inactive'}
 }
}
function addProducts(products,details,container,type){
 const existing=new Set([...container.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')?.split('/').pop().replace(/\.html$/,'')));
 for(const p of products){
  if(existing.has(p.slug)||staticSlugs.has(p.slug)||!details.has(p.slug)||p.collection!==type)continue;
  const d=details.get(p.slug);if(d.display_status!=='published')continue;
  const url='urun.html?slug='+encodeURIComponent(p.slug);
  if(container.classList.contains('product-grid')){
   const card=document.createElement('article');card.className='product-card';
   const a=document.createElement('a');a.href=url;a.className='product-image';
   const img=document.createElement('img');img.src=d.image_paths?.[0]?publicPhoto(d.image_paths[0]):'perde-konagi-hero-banner.jpg';img.alt=p.title;img.loading='lazy';a.append(img);
   const info=document.createElement('div');info.className='product-info';
   const h=document.createElement('h3');h.textContent=p.title;const text=document.createElement('p');text.textContent=d.short_description||'Özel ölçü perde';const price=document.createElement('div');price.className='product-price';price.textContent=fmt(p.price_per_sqm)+' TL / m²';
   const btn=document.createElement('a');btn.className='product-cta';btn.href=url;btn.textContent='Ölçünü Seç ve İncele';
   info.append(h,text,price,btn);card.append(a,info);container.append(card);
   if(!p.is_active||d.stock_qty===0)notice(card,'off','Şu anda satışa kapalı');
  }else{
   const a=document.createElement('a');a.className='product';a.href=url;
   const img=document.createElement('img');img.loading='lazy';img.src=d.image_paths?.[0]?publicPhoto(d.image_paths[0]):'perde-konagi-hero-banner.jpg';img.alt=p.title;
   const info=document.createElement('div');info.className='info';let h=document.createElement('h3');h.textContent=p.title;let summary=document.createElement('p');summary.className='desc';summary.textContent=(d.short_description||'Özel ölçü perde')+' · '+fmt(p.price_per_sqm)+' TL/m²';let link=document.createElement('strong');link.textContent='Ürünü İncele →';link.style.color='#a9824b';info.append(h,summary,link);a.append(img,info);container.append(a);
   if(!p.is_active||d.stock_qty===0)notice(a,'off','Şu anda satışa kapalı');
  }
 }
}
function updateListings(products,details){
 const bySlug=new Map(products.map(p=>[p.slug,p])),byDetails=new Map(details.map(d=>[d.slug,d]));
 const cards=document.querySelectorAll('.product-card .product-image[href],.cards a.product[href]');
 adjustStatic(cards,bySlug,byDetails);
 if(slug==='index'){const grid=document.querySelector('.product-grid');if(grid){addProducts(products,byDetails,grid,'zebra');addProducts(products,byDetails,grid,'mat-stor')}}
 if(slug==='zebra-perde'||slug==='stor-perde'){const grid=document.querySelector('.cards');if(grid)addProducts(products,byDetails,grid,slug==='zebra-perde'?'zebra':'mat-stor')}
 window.pkCatalogSearchProducts=products.map(p=>[p.title,staticSlugs.has(p.slug)?p.slug+'.html':'urun.html?slug='+encodeURIComponent(p.slug)]);
}
Promise.all([request('shop_products?select=slug,title,collection,price_per_sqm,is_active'),request('shop_product_details?select=slug,short_description,description_html,image_paths,variant_options,measurement_options,seo_title,seo_description,display_status,stock_qty')]).then(([products,details])=>{
 if(productPage){const p=products.find(p=>p.slug===slug);if(p)showProduct(p,details.find(d=>d.slug===slug));else blockPurchase('Bu ürün şu anda satın alınamaz.')}
 else updateListings(products,details);
}).catch(()=>{
 if(productPage){
  blockPurchase('Güncel ürün bilgileri doğrulanamadı. Lütfen sayfayı yenileyin.');
  if(pageSlug==='urun'){const loader=document.getElementById('pk-loading');if(loader)loader.textContent='Ürün bilgileri doğrulanamadı. Lütfen sayfayı yenileyin.'}
 }
 else document.querySelectorAll('.product-price').forEach(x=>x.textContent='Fiyat doğrulanamadı');
});
})();