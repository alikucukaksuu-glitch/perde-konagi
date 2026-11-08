(()=>{'use strict';
const sb=window.supabase?.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const dateText=d=>{if(!d)return'—';const [y,m,day]=d.split('-');return day+'.'+m+'.'+y};
const labels={indirim:'İndirim',avantaj:'Avantaj',firsat:'Fırsat',yeni_fiyat:'Yeni Fiyat',kargo_bedava:'Kargo Bedava',kupon:'Kupon Kodu'};
const staticSlugs=new Set(['bambu-bej-zebra-perde','bambu-beyaz-zebra-perde','bambu-gri-zebra-perde','bambu-kahve-zebra-perde','bambu-siyah-gecisli-zebra-perde','bambu-siyah-zebra-perde','mat-stor-antrasit','mat-stor-gri','mat-stor-kahve','mat-stor-kirik-beyaz','mat-stor-krem','mat-stor-mavi','mat-stor-siyah','mat-stor-turuncu']);
let products=[],details=[],campaigns=[],editing=null,authorized=false,loading=false;
const photo=slug=>{const d=details.find(v=>v.slug===slug);if(d?.image_paths?.length){const p=d.image_paths[0];return p.startsWith('legacy:')?p.slice(7):p.startsWith('https://')?p:'https://rwylhxrtggsicieuyjrm.supabase.co/storage/v1/object/public/product-images/'+p.split('/').map(encodeURIComponent).join('/')}return slug.startsWith('mat-stor-')?slug+'-1.webp':slug.startsWith('bambu-')?slug.replace('-zebra-perde','')+'-1.'+(slug.includes('siyah')?'png':'webp'):'perde-konagi-hero-banner.jpg'};
function status(c){const t=today();if(!c.enabled)return'paused';if(c.starts_on>t)return'scheduled';if(c.ends_on<t||(c.usage_limit!=null&&c.used_count>=c.usage_limit))return'expired';return'active'}
function statusText(s){return{active:'Aktif',scheduled:'Planlanan',paused:'Durduruldu',expired:'Süresi Doldu'}[s]||s}
function discount(c,amount){const val=Number(c.discount_value)||0;switch(c.discount_type){case'percent':return Math.round(amount*val)/100;case'fixed':return Math.min(amount,val);case'new_price':return Math.max(0,amount-val);default:return 0}}
function findProduct(slug){return products.find(p=>p.slug===slug)}
function tag(c){const span=document.createElement('span');span.className='cm-tag '+c.campaign_type;span.textContent=c.badge_text;return span}
function make(tagName,value,cls){const el=document.createElement(tagName);el.textContent=String(value??'');if(cls)el.className=cls;return el}
function feedback(msg,isError=false){$('cm-feedback').textContent=msg;$('cm-feedback').style.color=isError?'#a53d2c':'#7a6044'}
function defaultDates(){const date=new Date();const days=new Date(date.getTime()+30*86400000);const format=d=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);$('cm-start').value=format(date);$('cm-end').value=format(days)}
function resetForm(mode='indirim'){
 editing=null;$('cm-form').reset();
 $('cm-type').value=mode;$('cm-discount-type').value=mode==='kargo_bedava'?'none':'percent';
 $('cm-value').value=mode==='kargo_bedava'?0:20;
 $('cm-name').value='';$('cm-coupon-code').value='';$('cm-limit').value='';
 $('cm-enabled').checked=true;
 $('cm-badge').value=labels[mode]||'İndirim';
 $('cm-save').textContent='✓  Kampanyayı Kaydet';
 defaultDates();configureForm();preview();feedback('');
}
function configureForm(){
 const type=$('cm-type').value,discountType=$('cm-discount-type').value;
 const coupon=type==='kupon';$('cm-coupon-wrap').hidden=!coupon;$('cm-limit-wrap').hidden=!coupon;
 $('cm-coupon-code').required=coupon;
 if(type==='kargo_bedava'&&discountType!=='none'){$('cm-discount-type').value='none'}
 if(type==='kupon'&&$('cm-discount-type').value==='none')$('cm-discount-type').value='percent';
 const kind=$('cm-discount-type').value,disabled=kind==='none';
 $('cm-value-label').hidden=disabled;$('cm-value').required=!disabled;
 $('cm-value-symbol').textContent=kind==='percent'?'%':'TL';
 const t=kind==='percent'?'İndirim Oranı':kind==='fixed'?'Sabit İndirim Tutarı':kind==='new_price'?'Yeni m² Fiyatı':'İndirim Değeri';
 $('cm-value-label').childNodes[0].textContent=t+' ';
 $('cm-value').min=disabled?'0':'0.01';$('cm-value').max=kind==='percent'?'90':'100000';
 if(disabled)$('cm-value').value=0;
 preview();
}
function preview(){
 const p=findProduct($('cm-product').value),type=$('cm-type').value;
 const badge=$('cm-badge').value.trim()||labels[type];
 $('cm-preview-badge').textContent=badge;$('cm-preview-badge').className='cm-tag '+type;
 $('cm-preview-image').src=p?photo(p.slug):'perde-konagi-hero-banner.jpg';
 $('cm-preview-name').textContent=p?.title||'Ürün seçin';
 const base=Number(p?.price_per_sqm)||0,kind=$('cm-discount-type').value,val=Number($('cm-value').value)||0;
 const reduction=discount({discount_type:kind,discount_value:val},base);
 $('cm-preview-old').textContent=p&&reduction>0?money(base):'';
 $('cm-preview-new').textContent=p?money(Math.max(0,base-reduction)):'—';
 $('cm-preview-description').textContent=kind==='none'?badge:kind==='percent'?'%'+val+' İndirim':kind==='fixed'?money(val)+' sabit indirim':kind==='new_price'?'Yeni m² fiyatı':'';
}
function renderStats(){
 $('cm-stat-active').textContent=campaigns.filter(c=>status(c)==='active').length;
 $('cm-stat-scheduled').textContent=campaigns.filter(c=>status(c)==='scheduled').length;
 $('cm-stat-products').textContent=new Set(campaigns.filter(c=>status(c)==='active').map(c=>c.product_slug)).size;
 $('cm-stat-usage').textContent=campaigns.reduce((sum,c)=>sum+Number(c.used_count||0),0).toLocaleString('tr-TR');
}
function productNode(p){
 const wrap=make('div','','cm-name'),img=document.createElement('img');img.src=photo(p?.slug||'');img.alt=p?.title||'Ürün';
 const text=make('div','');text.append(make('b',p?.title||'Ürün bulunamadı'),make('small',p?.slug||''));wrap.append(img,text);return wrap;
}
function renderRows(){
 const term=$('cm-search').value.trim().toLocaleLowerCase('tr-TR'),type=$('cm-type-filter').value,filter=$('cm-status-filter').value;
 const list=campaigns.filter(c=>{const p=findProduct(c.product_slug);return(!type||c.campaign_type===type)&&(!filter||status(c)===filter)&&(!term||(c.campaign_name+' '+(p?.title||'')+' '+c.badge_text+' '+(c.coupon_code||'')).toLocaleLowerCase('tr-TR').includes(term))});
 const tbody=$('cm-rows');tbody.replaceChildren();
 for(const c of list){
 const row=document.createElement('tr'),p=findProduct(c.product_slug),name=document.createElement('td');name.append(productNode(p));row.append(name);
 row.append(make('td',labels[c.campaign_type]));
 const badgeCell=document.createElement('td');badgeCell.append(tag(c));row.append(badgeCell);
 row.append(make('td',dateText(c.starts_on)+' – '+dateText(c.ends_on)));
 const state=document.createElement('td');state.append(make('span',statusText(status(c)),'cm-status '+status(c)));row.append(state);
 const actions=document.createElement('td');const edit=make('button','✎ Düzenle');edit.type='button';edit.onclick=()=>editCampaign(c);
 const toggle=make('button',c.enabled?'Duraklat':'Etkinleştir');toggle.type='button';toggle.onclick=()=>setEnabled(c,!c.enabled);
 const remove=make('button','Sil');remove.type='button';remove.onclick=()=>removeCampaign(c);
 actions.append(edit,toggle,remove);row.append(actions);tbody.append(row)
 }
 if(!list.length){let row=document.createElement('tr'),cell=make('td','Bu filtreye uygun kampanya bulunmuyor. Yeni kampanya oluşturarak başlayabilirsiniz.','cm-empty');cell.colSpan=6;row.append(cell);tbody.append(row)}
 $('cm-count').textContent=list.length+' kayıt gösteriliyor';
}
function renderCards(){
 const container=$('cm-preview-grid');container.replaceChildren();
 const items=campaigns.filter(c=>status(c)==='active'&&!c.coupon_code).slice(0,4);
 if(!items.length){container.append(make('p','Henüz aktif ürün etiketi bulunmuyor. Kampanya oluşturduğunda burada önizlemesini göreceksin.','cm-empty'));return}
 for(const c of items){
 const p=findProduct(c.product_slug);if(!p)continue;
 const card=make('article','','cm-product-card'),image=make('div','','cm-product-image'),img=document.createElement('img');img.src=photo(p.slug);img.alt=p.title;image.append(img,tag(c));card.append(image,make('h4',p.title));
 const base=Number(p.price_per_sqm),off=discount(c,base);
 if(off>0)card.append(make('s',money(base)));
 card.append(make('strong',money(base-off)),make('small',off>0?'1 m² örnek fiyat · '+c.badge_text:c.badge_text));container.append(card);
 }
}
function render(){renderStats();renderRows();renderCards();preview()}
function fillProducts(){
 const select=$('cm-product'),prev=select.value;select.replaceChildren(new Option('Ürün seçiniz...',''));
 const cat=$('cm-collection').value;
 for(const p of products.filter(x=>!cat||x.collection===cat).sort((a,b)=>a.title.localeCompare(b.title,'tr'))){
 select.append(new Option(p.title+' ('+p.slug+')',p.slug));
 }
 if([...select.options].some(o=>o.value===prev))select.value=prev;
 preview();
}
async function requireAuth(){
 const {data,error}=await sb.auth.getUser();if(error||!data?.user)return false;
 const {data:a,error:e}=await sb.from('admin_access').select('role').eq('user_id',data.user.id).maybeSingle();
 if(e||!a)return false;authorized=['owner','admin'].includes(a.role);return true;
}
async function load(){
 if(loading||!sb)return;loading=true;
 try{
 const access=await requireAuth();if(!access)return;
 const responses=await Promise.all([
  sb.from('shop_products').select('slug,title,collection,price_per_sqm,is_active,visibility').order('title'),
  sb.from('shop_product_details').select('slug,image_paths').limit(500),
  sb.from('shop_campaigns').select('*').order('created_at',{ascending:false})
 ]);
 for(const res of responses)if(res.error)throw res.error;
 [products,details,campaigns]=responses.map(r=>r.data||[]);
 if(!authorized){$('cm-feedback').textContent='Bu hesabın kampanya düzenleme yetkisi yok.';$('cm-save').disabled=true}
 fillProducts();render();
 }catch(e){feedback('Kampanyalar yüklenemedi: '+e.message,true)}
 finally{loading=false}
}
function editCampaign(c){
 editing=c.id;$('cm-collection').value='';fillProducts();$('cm-product').value=c.product_slug;$('cm-name').value=c.campaign_name;$('cm-type').value=c.campaign_type;
 $('cm-badge').value=c.badge_text;$('cm-discount-type').value=c.discount_type;$('cm-value').value=c.discount_value;
 $('cm-coupon-code').value=c.coupon_code||'';$('cm-limit').value=c.usage_limit??'';$('cm-start').value=c.starts_on;$('cm-end').value=c.ends_on;
 $('cm-enabled').checked=c.enabled;$('cm-save').textContent='✓  Kampanyayı Güncelle';
 configureForm();preview();feedback('Düzenleme: '+c.campaign_name);
 $('cm-form').scrollIntoView({behavior:'smooth',block:'start'});
}
function values(){
 const product_slug=$('cm-product').value,campaign_name=$('cm-name').value.trim(),campaign_type=$('cm-type').value,badge_text=$('cm-badge').value.trim();
 const discount_type=$('cm-discount-type').value,discount_value=discount_type==='none'?0:Number($('cm-value').value);
 const starts_on=$('cm-start').value,ends_on=$('cm-end').value,enabled=$('cm-enabled').checked;
 const coupon_code=campaign_type==='kupon'?$('cm-coupon-code').value.trim().toUpperCase():null;
 const usage_limit=campaign_type==='kupon'&&$('cm-limit').value!==''?Number($('cm-limit').value):null;
 if(!findProduct(product_slug))throw Error('Ürün seçiniz');
 if(campaign_name.length<3||campaign_name.length>120)throw Error('Kampanya adı 3–120 karakter olmalıdır');
 if(badge_text.length<2||badge_text.length>32)throw Error('Etiket yazısı 2–32 karakter olmalıdır');
 if(!starts_on||!ends_on||ends_on<starts_on)throw Error('Başlangıç ve bitiş tarihleri geçerli olmalıdır');
 if(!Number.isFinite(discount_value)||discount_value<0||discount_value>100000)throw Error('İndirim değeri geçersiz');
 if(discount_type==='percent'&&(discount_value<=0||discount_value>90))throw Error('Yüzde indirim 0 ile 90 arasında olmalıdır');
 if(discount_type!=='none'&&discount_value<=0)throw Error('İndirim değeri sıfır olamaz');
 if(campaign_type==='kargo_bedava'&&discount_type!=='none')throw Error('Kargo etiketi fiyatı değiştiremez');
 if(campaign_type==='kupon'&&!/^[A-Z0-9_-]{4,24}$/.test(coupon_code))throw Error('Kupon kodu 4–24 harf/rakam olmalıdır');
 if(usage_limit!=null&&(!Number.isInteger(usage_limit)||usage_limit<1))throw Error('Kullanım limiti pozitif tam sayı olmalıdır');
 return{product_slug,campaign_name,campaign_type,badge_text,discount_type,discount_value,coupon_code,starts_on,ends_on,enabled,usage_limit}
}
async function save(e){
 e.preventDefault();if(!authorized){feedback('Yalnızca yönetici kampanya kaydedebilir.',true);return}
 let valuesToSave;try{valuesToSave=values()}catch(error){feedback(error.message,true);return}
 const button=$('cm-save');button.disabled=true;feedback('Kampanya kaydediliyor...');
 try{
 let request=editing?sb.from('shop_campaigns').update({...valuesToSave,updated_at:new Date().toISOString()}).eq('id',editing):sb.from('shop_campaigns').insert(valuesToSave);
 const {data,error}=await request.select().single();if(error||!data)throw error||Error('Kayıt bulunamadı');
 if(editing){campaigns=campaigns.map(c=>c.id===editing?data:c)}else campaigns.unshift(data);
 editing=data.id;$('cm-save').textContent='✓  Kampanyayı Güncelle';render();feedback('✓ Kampanya kaydedildi. Etkinlik tarihine göre mağazada görüntülenecek.');
 }catch(error){feedback('Kaydetme başarısız: '+error.message,true)}finally{button.disabled=false}
}
async function setEnabled(c,enabled){
 if(!authorized)return feedback('Yetkiniz yok.',true);
 const {data,error}=await sb.from('shop_campaigns').update({enabled,updated_at:new Date().toISOString()}).eq('id',c.id).select().single();
 if(error)return feedback(error.message,true);campaigns=campaigns.map(x=>x.id===c.id?data:x);render();feedback(enabled?'Kampanya etkinleştirildi.':'Kampanya durduruldu.');
}
async function removeCampaign(c){
 if(!authorized)return feedback('Yetkiniz yok.',true);
 if(!confirm('“'+c.campaign_name+'” kampanyası kalıcı olarak silinsin mi?'))return;
 const {error}=await sb.from('shop_campaigns').delete().eq('id',c.id);if(error)return feedback(error.message,true);
 campaigns=campaigns.filter(x=>x.id!==c.id);if(editing===c.id)resetForm();render();feedback('Kampanya silindi.');
}
function create(mode){resetForm(mode);$('cm-form').scrollIntoView({behavior:'smooth',block:'start'});$('cm-product').focus()}
$('cm-create').onclick=()=>create('indirim');$('cm-create-label').onclick=()=>create('firsat');$('cm-create-coupon').onclick=()=>create('kupon');
$('cm-cancel').onclick=()=>{resetForm();$('cm-form').scrollIntoView({behavior:'smooth',block:'start'})};
$('cm-form').addEventListener('submit',save);
$('cm-search').addEventListener('input',renderRows);$('cm-type-filter').addEventListener('change',renderRows);$('cm-status-filter').addEventListener('change',renderRows);
$('cm-collection').addEventListener('change',fillProducts);
$('cm-type').addEventListener('change',()=>{$('cm-badge').value=labels[$('cm-type').value];if($('cm-type').value==='kargo_bedava')$('cm-discount-type').value='none';configureForm()});
$('cm-discount-type').addEventListener('change',configureForm);
for(const id of ['cm-product','cm-name','cm-badge','cm-value','cm-start','cm-end','cm-enabled'])$(id).addEventListener('input',preview);
document.addEventListener('click',e=>{if(e.target.closest('[data-section="coupons"],[data-goto="coupons"]'))load()});
resetForm();load();
})();