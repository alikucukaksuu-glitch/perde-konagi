(()=>{'use strict';
const sb=window.supabase?.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const el=id=>document.getElementById(id),slug=new URLSearchParams(location.search).get('slug');
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const base='https://rwylhxrtggsicieuyjrm.supabase.co/storage/v1/object/public/product-images/';
let product=null,details=null,quote=null,ready=false;
const imgurl=path=>path.startsWith('https://')?path:path.startsWith('legacy:')?path.slice(7):base+path.split('/').map(encodeURIComponent).join('/');
const getValue=name=>document.querySelector('input[name="'+name+'"]:checked')?.value||'';
const meta=details=>details?.measurement_options||{};
function safeHTML(html){
 const parser=new DOMParser().parseFromString('<div>'+html+'</div>','text/html');
 const allowed=new Set(['P','BR','STRONG','B','EM','I','U','UL','OL','LI','H2','H3','H4','BLOCKQUOTE']);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function walk(n){if(n.nodeType===3)return esc(n.textContent);if(n.nodeType!==1)return'';const inner=[...n.childNodes].map(walk).join('');if(n.tagName==='DIV')return inner;if(!allowed.has(n.tagName))return inner;const t=n.tagName.toLowerCase();return '<'+t+'>'+inner+'</'+t+'>'}
 return [...(parser.body.firstElementChild?.childNodes||[])].map(walk).join('')
}
function disabled(reason){
 ready=false;quote=null;el('dp-add').disabled=true;
 el('dp-add').textContent='Şu Anda Sipariş Verilemiyor';
 el('dp-quote').textContent=reason;
 el('dp-unavailable').hidden=false;el('dp-unavailable').textContent=reason;
}
function images(paths){
 const list=el('dp-thumbnails');list.replaceChildren();
 const fallback=product.slug.startsWith('mat-stor-')?product.slug+'-1.webp':product.slug.replace('-zebra-perde','')+'-1.webp';
 const listpaths=paths?.length?paths:[fallback];
 listpaths.forEach((path,i)=>{
  const url=paths?.length?imgurl(path):path;
  let btn=document.createElement('button');btn.type='button';btn.className=i===0?'current':'';
  const image=document.createElement('img');image.src=url;image.alt='Ürün görseli '+(i+1);btn.append(image);
  btn.onclick=()=>{el('dp-image').src=url;[...list.children].forEach(b=>b.classList.toggle('current',b===btn))};
  list.append(btn);
 });
 el('dp-image').src=paths?.length?imgurl(paths[0]):fallback;
 el('dp-image').alt=product.title;
}
function variants(data){
 const target=el('dp-variant-groups');target.replaceChildren();
 for(const group of (Array.isArray(data)?data:[])){
  if(!group?.label||!Array.isArray(group.values)||!group.values.length)continue;
  const h=document.createElement('h3');h.textContent=group.label;target.append(h);
  const block=document.createElement('div');block.className='dp-selectbox';
  group.values.forEach((choice,i)=>{const label=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='dp-variant-'+group.label;input.value=choice;input.checked=i===0;label.append(input,document.createTextNode(choice));block.append(label)});
  target.append(block);
 }
}
function choices(){
 const data={};
 for(const group of (Array.isArray(details?.variant_options)?details.variant_options:[])){
  const selected=document.querySelectorAll('#dp-variant-groups input[type="radio"]:checked');
  const chosen=[...selected].find(e=>e.name==='dp-variant-'+group.label);
  if(chosen)data[group.label]=chosen.value;
 }
 return data;
}
function params(){
 const kasa=getValue('dp-kasa'),color=el('dp-kasa-color').value;
 return {p_slug:slug,p_width_cm:Number(el('dp-width').value),p_height_cm:Number(el('dp-height').value),p_kasa_tip:kasa,p_kasa_renk:kasa==='acik'?'':color,p_zincir:getValue('dp-zincir'),p_yon:getValue('dp-yon'),p_boru:getValue('dp-boru'),p_ayak:getValue('dp-ayak')};
}
function sizes(){const m=meta(details);return {minw:Number(m.min_width??50),maxw:Number(m.max_width??280),minh:Number(m.min_height??50),maxh:Number(m.max_height??280)}}
function colors(){
 const type=getValue('dp-kasa'),wrap=el('dp-kasa-color-wrap'),select=el('dp-kasa-color');
 const list=type==='klasik'?['Beyaz','Krem']:type==='renkli'?['Gri','Antrasit','Kahve']:[];
 wrap.hidden=!list.length;const prev=select.value;
 select.replaceChildren(...list.map(x=>new Option(x,x)));if(list.includes(prev))select.value=prev;
}
let sequence=0;
async function calculate(){
 if(!product)return;
 const {minw,maxw,minh,maxh}=sizes(),p=params();
 if(!product.is_active||details?.display_status==='draft'||details?.stock_qty===0){disabled('Bu ürün şu anda satışa kapalıdır. Ürünü inceleyebilirsiniz ancak satın alamazsınız.');return}
 el('dp-unavailable').hidden=true;
 if(!Number.isInteger(p.p_width_cm)||!Number.isInteger(p.p_height_cm)||p.p_width_cm<minw||p.p_width_cm>maxw||p.p_height_cm<minh||p.p_height_cm>maxh){
  ready=false;el('dp-add').disabled=true;el('dp-quote').textContent='Ölçüleri '+minw+'–'+maxw+' cm en, '+minh+'–'+maxh+' cm boy aralığında giriniz.';return;
 }
 const seq=++sequence;ready=false;el('dp-add').disabled=true;el('dp-quote').textContent='Güncel fiyat hesaplanıyor…';
 try{const {data,error}=await sb.rpc('shop_quote_item',p);
  if(seq!==sequence)return;
  if(error||!data)throw error||Error('Fiyat alınamadı');
  quote=data;ready=true;el('dp-quote').textContent='Toplam: '+money(data.unit_total);el('dp-add').disabled=false;el('dp-add').textContent=money(data.unit_total)+' — Sepete Ekle';
  el('dp-quote-note').textContent='Güncel fiyat sunucu tarafından doğrulandı.';
 }catch(e){if(seq!==sequence)return;ready=false;quote=null;el('dp-add').disabled=true;el('dp-quote').textContent='Fiyat doğrulanamadı';el('dp-quote-note').textContent=e.message||'Bağlantı sorunu'}
}
let debounce;
function schedule(){clearTimeout(debounce);debounce=setTimeout(calculate,220)}
function dynamicPrice(){el('dp-unit-price').textContent=money(product.price_per_sqm)}
async function init(){
 if(!sb||!slug||!/^[a-z0-9-]{3,95}$/.test(slug)){el('dp-loading').textContent='Ürün bağlantısı geçersiz.';return}
 const {data:p,error}=await sb.from('shop_products').select('slug,title,collection,price_per_sqm,is_active').eq('slug',slug).maybeSingle();
 if(error||!p){el('dp-loading').textContent='Ürün bulunamadı.';return}
 product=p;
 const {data:d}=await sb.from('shop_product_details').select('*').eq('slug',slug).maybeSingle();
 details=d;el('dp-loading').hidden=true;el('dp-product').hidden=false;
 el('dp-title').textContent=p.title;el('dp-crumb-title').textContent=p.title;
 el('dp-short').textContent=d?.short_description||'Ölçünüze özel hazırlanmış perde modeli.';
 el('dp-collection-name').textContent=p.collection==='zebra'?'ZEBRA PERDE':'MAT STOR PERDE';
 el('dp-collection-link').textContent=p.collection==='zebra'?'Zebra Perdeler':'Stor Perdeler';
 el('dp-collection-link').href=p.collection==='zebra'?'zebra-perde.html':'stor-perde.html';
 document.title=(d?.seo_title||p.title)+' | Perde Konağı';
 const description=d?.seo_description||d?.short_description||'Perde Konağı özel ölçü perde modelleri.';
 document.querySelector('meta[name="description"]').content=description.slice(0,320);
 el('dp-description-text').innerHTML=safeHTML(d?.description_html||'<p>Ürün ayrıntıları ve ölçü seçenekleri yukarıda sunulmaktadır.</p>');
 images(d?.image_paths||[]);variants(d?.variant_options||[]);
 const s=sizes();el('dp-width').min=s.minw;el('dp-width').max=s.maxw;el('dp-height').min=s.minh;el('dp-height').max=s.maxh;
 el('dp-width').value=s.minw;el('dp-height').value=s.minh;
 dynamicPrice();colors();calculate()
}
document.querySelectorAll('input[name^="dp-"],#dp-kasa-color').forEach(input=>input.addEventListener('change',()=>{if(input.name==='dp-kasa')colors();schedule()}));
['dp-width','dp-height'].forEach(id=>el(id).addEventListener('input',schedule));
el('dp-add').addEventListener('click',async()=>{
 if(!ready||!quote||!product?.is_active)return;
 const button=el('dp-add');button.disabled=true;
 try{
 const {data,error}=await sb.rpc('shop_quote_item',params());if(error||!data)throw error||new Error('Fiyat doğrulanamadı');
 let cart=JSON.parse(localStorage.getItem('perdeKonagiCartV1')||'[]');if(!Array.isArray(cart))cart=[];
 if(cart.length>=50)throw Error('Sepetiniz dolu');
 cart.push({id:crypto.randomUUID(),options:params(),quote:data,quantity:1,variantSelections:choices(),productImage:el('dp-image').src,added_at:new Date().toISOString()});
 localStorage.setItem('perdeKonagiCartV1',JSON.stringify(cart));
 el('dp-quote-note').textContent='✓ Ürün sepete eklendi. Sepetimi Gör bağlantısını kullanabilirsiniz.';
 }catch(e){el('dp-quote-note').textContent='Sepete eklenemedi: '+e.message}
 finally{button.disabled=!ready}
});
init().catch(e=>{el('dp-loading').hidden=false;el('dp-product').hidden=true;el('dp-loading').textContent='Ürün yüklenemedi: '+e.message});
})();