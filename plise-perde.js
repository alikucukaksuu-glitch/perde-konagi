(()=>{'use strict';
const $=id=>document.getElementById(id);
const sb=window.supabase?.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
let colors=[['Beyaz','#f7f7f5'],['Krem','#eee2c6'],['Antrasit','#444649'],['Gri','#c0c2c4'],['Bej','#d6b894']];
let profiles=[['Beyaz','#e7e5e0'],['Krem','#d8cfb6'],['Gri','#b4b7b8'],['Bronz','#8f7456'],['Antrasit','#54565a']];
let surfaces=['Pimapen','Cam Balkon','Sürgülü Kapı/Pencere','Cam Balkon Isıcam'];
let mountings=['Vidalı','Yapışkanlı','Vida + Yapışkanlı'];
const slug=new URLSearchParams(location.search).get('slug')||'';
let currentProduct=null,detail=null,products=[];
function makeGallery(paths){const strip=$('pp-gallery-strip');strip.replaceChildren();const photos=(paths||[]).filter(Boolean);if(!photos.length)return;const main=$('pp-main-image');main.style.display='block';document.querySelector('.pp-curtain').style.display='none';document.querySelector('.pp-window-ledger').style.display='none';const pick=(path,button)=>{main.src=photo(path);main.alt=currentProduct.title+' ürün fotoğrafı';for(const b of strip.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===button))};for(let i=0;i<photos.length;i++){const b=document.createElement('button');b.type='button';b.className='pp-gallery-thumb';b.setAttribute('aria-label',(i+1)+'. ürün fotoğrafını göster');b.setAttribute('aria-pressed',String(i===0));const image=document.createElement('img');image.src=photo(photos[i]);image.alt=currentProduct.title+' '+(i+1)+'. fotoğraf';image.loading='lazy';b.append(image);b.onclick=()=>pick(photos[i],b);strip.append(b)}main.src=photo(photos[0]);main.alt=currentProduct.title+' ürün fotoğrafı'}
let selected={fabric:'Beyaz',profile:'Beyaz',surface:'Pimapen',mounting:'Vidalı'},config=null,price=null,version=0,priceTimer=null,busy=false;
const palette=Object.fromEntries([...colors,...profiles]);
const photo=path=>path?.startsWith('https://')?path:'https://rwylhxrtggsicieuyjrm.supabase.co/storage/v1/object/public/product-images/'+String(path).split('/').map(encodeURIComponent).join('/');
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n));
const fmt=n=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:1}).format(Number(n));
const clean=v=>String(v??'').trim().replace(',','.');
const parse=v=>{const s=clean(v);if(!/^\d+(?:\.\d)?$/.test(s))return null;return Number(s)};
const note=t=>$('pp-status').textContent=t;
const optionParams=()=>({p_slug:currentProduct?.slug||'',p_width_cm:parse($('pp-width').value),p_height_cm:parse($('pp-height').value),p_fabric:selected.fabric,p_profile:selected.profile,p_surface:selected.surface,p_mounting:selected.mounting});
const validation=()=>{const v=optionParams();if(v.p_width_cm===null||v.p_height_cm===null)return 'Fiyat hesaplamak için en ve boy ölçülerini giriniz.';if(v.p_width_cm<(detail?.measurement_options?.min_width??20)||v.p_width_cm>(detail?.measurement_options?.max_width??200)||v.p_height_cm<(detail?.measurement_options?.min_height??20)||v.p_height_cm>(detail?.measurement_options?.max_height??200))return 'Ölçüler bu ürünün izin verdiği en ve boy sınırları içinde olmalıdır.';if(config&&selected.mounting==='Yapışkanlı'&&config.adhesive_fee===null)return 'Yapışkanlı montaj ek ücreti henüz tanımlanmadı. Fiyat için bize ulaşın.';if(config&&selected.mounting==='Vida + Yapışkanlı'&&config.combined_fee===null)return 'Vida + Yapışkanlı montaj ek ücreti henüz tanımlanmadı. Fiyat için bize ulaşın.';return ''};
function card(value,kind,label,figure,extra){const b=document.createElement('button');b.type='button';b.className='pp-choice';b.setAttribute('aria-pressed',String(selected[kind]===value));b.dataset.value=value;b.dataset.kind=kind;
 const picture=document.createElement('span');picture.className='pp-swatch '+(kind==='fabric'?'fabric':kind==='profile'?'profile':kind==='surface'?'surface':'mounting');if(kind==='fabric'||kind==='profile'){picture.style.setProperty('--swatch',figure)}else if(kind==='surface'){picture.style.setProperty('--frame',figure)}else picture.textContent=figure;
 const check=document.createElement('span');check.className='pp-check';check.textContent='✓';
 const title=document.createElement('strong');title.textContent=label; b.append(picture,check,title);
 if(extra){const small=document.createElement('small');small.textContent=extra;b.append(small)}
 b.addEventListener('click',()=>{selected[kind]=value;render();update()});return b}
function render(){const fabric=$('pp-fabrics'),profile=$('pp-profiles'),surface=$('pp-surfaces'),mounting=$('pp-mountings');fabric.replaceChildren(...colors.map(([n,c])=>card(n,'fabric',n,c)));const find=$('pp-search').value.toLocaleLowerCase('tr-TR');profile.replaceChildren(...profiles.filter(([n])=>n.toLocaleLowerCase('tr-TR').includes(find)).map(([n,c])=>card(n,'profile',n,c)));
 surface.replaceChildren(...surfaces.map((s,i)=>card(s,'surface',s,['#f2f0ed','#504c48','#a7aeb5','#818e8f'][i])));
 mounting.replaceChildren(...mountings.map((m,i)=>card(m,'mounting',m,['⚙','✋','🔩'][i],i===0?'Ücretsiz':i===1?(config?.adhesive_fee==null?'Fiyat teyidi gerekli':'+'+money(config.adhesive_fee)+' / m²'):(config?.combined_fee==null?'Fiyat teyidi gerekli':'+'+money(config.combined_fee)+' / m²'))));
 const color=colors.find(x=>x[0]===selected.fabric)?.[1]||'#eee2c6';document.querySelector('.pp-curtain').style.background='repeating-linear-gradient(180deg,'+color+' 0px,color-mix(in srgb,'+color+',#333 13%) 9px,'+color+' 11px,color-mix(in srgb,'+color+',#fff 13%) 22px,color-mix(in srgb,'+color+',#333 19%) 24px)';
}
function update(){clearTimeout(priceTimer);const current=++version;price=null;$('pp-add').disabled=true;$('pp-total').textContent='—';const reason=validation();if(reason){$('pp-summary').textContent=reason;note('');return}if(!sb||!config||!currentProduct){$('pp-summary').textContent='Fiyat bağlantısı kurulamadı. Sayfayı yenileyin.';return}
 $('pp-summary').textContent='Güncel fiyat sunucuda hesaplanıyor…';priceTimer=setTimeout(async()=>{const {data,error}=await sb.rpc('plise_quote_product',optionParams());if(current!==version)return;if(error||!data){$('pp-summary').textContent='Fiyat alınamadı. Lütfen tekrar deneyin.';note(error?.message||'Fiyat servisi yanıt vermiyor.');return}price=data;$('pp-total').textContent=money(data.unit_total);$('pp-summary').textContent=selected.fabric+' plise · '+fmt(data.width_cm)+' × '+fmt(data.height_cm)+' cm · '+fmt(data.billed_sqm)+' m² üzerinden hesaplandı.';$('pp-add').disabled=false;note('')},320)}
async function init(){
 try{
  if(!sb)throw Error('Ürün servisine bağlantı kurulamadı.');
  const {data:rows,error:listError}=await sb.from('shop_products').select('slug,title,price_per_sqm').eq('collection','plise').eq('visibility','published').eq('is_active',true).order('title');
  if(listError)throw listError;products=rows||[];
  const listing=$('pp-product-list');listing.replaceChildren();
  for(const p of products){const a=document.createElement('a');a.href='plise-perde.html?slug='+encodeURIComponent(p.slug);a.className='pp-product-link';a.textContent=p.title+' · '+money(p.price_per_sqm)+'/m²';if(slug===p.slug)a.classList.add('chosen');listing.append(a)}
  if(!products.length){$('pp-product-message').textContent='Henüz yayında plise perde ürünü bulunmuyor. Yeni bir ürünü yönetim panelinden ekleyebilirsiniz.';note('Plise modelleri henüz satışa açılmadı.');return}
  if(!slug){$('pp-product-message').textContent='Özelleştirmek istediğiniz plise modeline tıklayın.';note('Önce yukarıdan bir plise perde modeli seçin.');return}
  currentProduct=products.find(p=>p.slug===slug);
  if(!currentProduct){note('Bu plise ürününe şu anda ulaşılamıyor. Lütfen başka bir model seçin.');return}
  const [dr,cr]=await Promise.all([
   sb.from('shop_product_details').select('image_paths,measurement_options,short_description,description_html,display_status,stock_qty').eq('slug',slug).eq('display_status','published').single(),
   sb.from('plise_product_config').select('*').eq('slug',slug).single()
  ]);
  if(dr.error||cr.error||!dr.data||!cr.data)throw Error(dr.error?.message||cr.error?.message||'Ürün seçenekleri bulunamadı');
  detail=dr.data;config=cr.data;
  if(detail.stock_qty===0)throw Error('Ürün geçici olarak stokta yok.');
  colors=config.fabrics.map(n=>[n,palette[n]||'#e8ded0']);
  profiles=config.profiles.map(n=>[n,palette[n]||'#a0a0a0']);
  surfaces=config.surfaces;mountings=config.mountings;
  selected={fabric:colors[0][0],profile:profiles[0][0],surface:surfaces[0],mounting:mountings[0]};
  $('pp-title').textContent=currentProduct.title;$('pp-breadcrumb-title').textContent=currentProduct.title;$('pp-sqm-price').textContent=money(currentProduct.price_per_sqm);document.title=currentProduct.title+' | Perde Konağı';
  document.querySelector('.pp-sub').textContent=detail.short_description||'Modern, şık ve fonksiyonel çözümler';
  const m=detail.measurement_options||{};
  $('pp-limits').textContent='En '+(m.min_width??20)+'–'+(m.max_width??200)+' cm, Boy '+(m.min_height??20)+'–'+(m.max_height??200)+' cm.';
  makeGallery(detail.image_paths);const desc=$('pp-description');if(detail.description_html&&window.PKDescriptionFormat?.sanitize){desc.innerHTML=window.PKDescriptionFormat.sanitize(detail.description_html)}else desc.textContent='Bu ürüne henüz açıklama eklenmemiş.';
  render();update();
 }catch(e){note('Ürün yüklenemedi: '+e.message);$('pp-add').disabled=true}
}
['pp-width','pp-height'].forEach(id=>$(id).addEventListener('input',update));
$('pp-search').addEventListener('input',render);
$('pp-note').addEventListener('input',e=>$('pp-note-count').textContent=e.target.value.length+' / 250');
$('pp-form').addEventListener('submit',e=>e.preventDefault());
$('pp-add').addEventListener('click',async()=>{if(busy||!sb)return;const problem=validation();if(problem){note(problem);return}
 busy=true;$('pp-add').disabled=true;note('Ürün fiyatı doğrulanıyor…');
 try{const params=optionParams();const {data,error}=await sb.rpc('plise_quote_product',params);if(error||!data)throw error||Error('Fiyat doğrulanamadı');const key='perdeKonagiCartV1';const items=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(items)||items.length>=50)throw Error('Sepet dolu ya da erişilemiyor.');
 items.push({id:crypto.randomUUID(),type:'plise',options:params,quote:data,quantity:1,productImage:detail?.image_paths?.[0]?photo(detail.image_paths[0]):'plise-product.svg',orderNote:$('pp-note').value.trim(),added_at:new Date().toISOString()});
 localStorage.setItem(key,JSON.stringify(items));$('pp-cart-badge').textContent=String(items.reduce((n,a)=>n+Number(a.quantity||0),0));note('✓ Plise perde sepetinize eklendi. Sepetim bağlantısından kontrol edebilirsiniz.');
 }catch(e){note('Sepete eklenemedi: '+e.message)}finally{busy=false;update()}});
try{const x=JSON.parse(localStorage.getItem('perdeKonagiCartV1')||'[]');if(Array.isArray(x))$('pp-cart-badge').textContent=String(x.reduce((n,a)=>n+Number(a.quantity||0),0))}catch(_){}
init();
})();