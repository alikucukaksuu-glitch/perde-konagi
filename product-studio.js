(()=>{'use strict';
const sb=window.supabase?.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const $=id=>document.getElementById(id);
const bucket='product-images',money=v=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(v)||0);
const defaults={min_width:50,max_width:280,min_height:50,max_height:280};
const photoUrl=path=>path?.startsWith('https://')?path:sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
let current=null,images=[],originalPaths=[],busy=false,authorized=false;
const slugify=text=>text.toLocaleLowerCase('tr-TR').replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90);
const cleanText=s=>String(s??'').trim();
function feedback(s){$('ps-feedback').textContent=s||''}
function authorStatus(){document.querySelectorAll('.ps-state').forEach(l=>l.classList.toggle('selected',l.querySelector('input').checked));$('ps-active').value=document.querySelector('input[name="ps-publish"]:checked')?.value||'draft';refreshSummary()}
function setStatus(status){document.querySelectorAll('[name="ps-publish"]').forEach(input=>{input.checked=input.value===status});authorStatus()}
function assetImg(src){const img=new Image();img.src=src;img.alt='Ürün görseli';return img}
function escapeHTML(str){return String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function sanitize(html){
 const doc=new DOMParser().parseFromString('<div>'+html+'</div>','text/html');
 const allowed=new Set(['P','BR','STRONG','B','EM','I','U','UL','OL','LI','H2','H3','H4','BLOCKQUOTE']);
 function safe(n){
  if(n.nodeType===3)return escapeHTML(n.textContent);
  if(n.nodeType!==1)return '';
  let tag=n.tagName,children=[...n.childNodes].map(safe).join('');
  if(tag==='DIV')return children?'<p>'+children+'</p>':'';
  if(!allowed.has(tag))return children;
  return '<'+tag.toLowerCase()+'>'+children+'</'+tag.toLowerCase()+'>';
 }
 return [...(doc.body.firstElementChild?.childNodes||[])].map(safe).join('').slice(0,30000);
}
function clearImages(){images.forEach(i=>{if(i.objectURL)URL.revokeObjectURL(i.objectURL)});images=[];originalPaths=[]}
function addFiles(files){
 const available=12-images.length;
 if(available<=0){feedback('En fazla 12 fotoğraf eklenebilir.');return}
 let rejected=[];
 for(const file of [...files].slice(0,available)){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10485760||file.size===0){rejected.push(file.name);continue}
  images.push({id:crypto.randomUUID(),file,objectURL:URL.createObjectURL(file),path:null});
 }
 if(files.length>available)rejected.push('12 fotoğraf sınırı aşıldı');
 renderImages();if(rejected.length)feedback('Eklenemeyen dosyalar: '+rejected.join(', '));else feedback('');
}
function renderImages(){
 const holder=$('ps-image-list');holder.replaceChildren();
 images.forEach((item,index)=>{
  let box=document.createElement('div');box.className='ps-photo';box.draggable=true;box.dataset.id=item.id;
  box.append(assetImg(item.objectURL||photoUrl(item.path)));
  let remove=document.createElement('button');remove.type='button';remove.className='ps-delete';remove.textContent='×';remove.title='Fotoğrafı kaldır';remove.onclick=()=>{if(item.objectURL)URL.revokeObjectURL(item.objectURL);images=images.filter(x=>x.id!==item.id);renderImages();};
  box.append(remove);
  const move=document.createElement('div');move.className='ps-photo-moves';
  for(const [symbol,direction] of [['←',-1],['→',1]]){
   const b=document.createElement('button');b.type='button';b.textContent=symbol;b.title=direction<0?'Sola taşı':'Sağa taşı';
   b.disabled=index+direction<0||index+direction>=images.length;
   b.addEventListener('click',()=>{const [v]=images.splice(index,1);images.splice(index+direction,0,v);renderImages()});
   move.append(b);
  }
  box.append(move);
  let number=document.createElement('span');number.className='ps-move';number.textContent=(index+1)+' · ↔';box.append(number);
  if(index===0){let main=document.createElement('span');main.className='ps-main-badge';main.textContent='♛ Ana Görsel';box.append(main)}
  box.addEventListener('dragstart',e=>{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',item.id)});
  box.addEventListener('dragover',e=>e.preventDefault());
  box.addEventListener('drop',e=>{e.preventDefault();const from=e.dataTransfer.getData('text/plain');const a=images.findIndex(x=>x.id===from),b=images.findIndex(x=>x.id===item.id);if(a<0||b<0||a===b)return;const [v]=images.splice(a,1);images.splice(b,0,v);renderImages()});
  holder.append(box);
 });
 const summary=$('ps-summary-img');if(images[0])summary.src=images[0].objectURL||photoUrl(images[0].path);else summary.src=current?legacyPhoto(current.slug):'perde-konagi-hero-banner.jpg';
}
function legacyPhoto(slug){return slug.startsWith('mat-stor-')?slug+'-1.webp':slug.replace('-zebra-perde','')+'-1.'+(slug.includes('siyah')?'png':'webp')}
function variantRow(label='',values=''){
 const container=document.createElement('div');container.className='ps-variant-row';
 const name=document.createElement('input');name.className='ps-input';name.placeholder='Grup adı: Renk';name.value=label;name.maxLength=45;
 const choices=document.createElement('input');choices.className='ps-input';choices.placeholder='Krem, Beyaz, Gri';choices.value=values;choices.maxLength=350;
 const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.title='Varyant grubunu kaldır';remove.onclick=()=>{container.remove();refreshSummary()};
 for(const e of [name,choices])e.addEventListener('input',refreshSummary);
 container.append(name,choices,remove);$('ps-variant-rows').append(container)
}
function variants(){
 const result=[];document.querySelectorAll('.ps-variant-row').forEach(row=>{
  const fields=row.querySelectorAll('input');let label=cleanText(fields[0].value),values=fields[1].value.split(',').map(cleanText).filter(Boolean).slice(0,30);
  if(label&&values.length)result.push({label,values:[...new Set(values)]})
 });return result;
}
function measurements(){return {min_width:Number($('ps-minw').value),max_width:Number($('ps-maxw').value),min_height:Number($('ps-minh').value),max_height:Number($('ps-maxh').value),minimum_billable_width:100}}
function refreshSummary(){
 $('ps-short-count').textContent=$('ps-short').value.length;
 $('ps-summary-name').textContent=$('ps-name').value.trim()||'Yeni Ürün';
 $('ps-summary-category').textContent=$('ps-category').value==='zebra'?'Zebra Perde':'Stor Perde';
 $('ps-summary-price').textContent=money($('ps-price').value);
 $('ps-summary-stock').textContent=$('ps-stock').value===''?'∞ (Sınırsız)':$('ps-stock').value+' adet';
 $('ps-summary-variants').textContent=variants().reduce((n,v)=>n+v.values.length,0)+' seçenek';
 const published=$('ps-active').value==='published',sale=$('ps-sale-enabled').checked;$('ps-summary-status').textContent=published?(sale?'● Yayında':'● Satışa Kapalı'):'● Taslak';$('ps-summary-status').style.background=published?'#e5f1e4':'#f7e7d5';$('ps-summary-status').style.color=published?'#467b45':'#91683f';
}
function reset(){
 clearImages();current=null;
 for(const id of ['ps-name','ps-price','ps-short','ps-desc','ps-seo-title','ps-seo-desc','ps-stock']){const field=$(id);if(field)field[field.isContentEditable?'innerHTML':'value']=''}
 $('ps-category').value='zebra';$('ps-variant-rows').replaceChildren();
 for(const [id,value] of [['ps-minw',50],['ps-maxw',280],['ps-minh',50],['ps-maxh',280]])$(id).value=value;
 $('ps-sale-enabled').checked=true;$('ps-summary-date').textContent='—';$('ps-page-title').textContent='Yeni Ürün Ekle';$('ps-crumb').textContent='Yeni Ürün Ekle';
 setStatus('draft');renderImages();feedback('');
}
async function open(slug){
 if(!await checkAccess())return;
 reset();
 $('product-index').hidden=true;$('ps-studio').hidden=false;
 if(slug){
  feedback('Ürün bilgileri yükleniyor…');
  const [{data:p,error:e},{data:d,error:f}]=await Promise.all([sb.from('shop_products').select('slug,title,collection,price_per_sqm,is_active,visibility,updated_at').eq('slug',slug).single(),sb.from('shop_product_details').select('*').eq('slug',slug).maybeSingle()]);
  if(e||f||!p){feedback('Ürün bilgileri yüklenemedi: '+(e?.message||f?.message||'Kayıt bulunamadı'));return}
  current=p;
  $('ps-name').value=p.title;$('ps-price').value=p.price_per_sqm;$('ps-category').value=p.collection;
  $('ps-short').value=d?.short_description||'';$('ps-desc').innerHTML=sanitize(d?.description_html||'');
  $('ps-seo-title').value=d?.seo_title||'';$('ps-seo-desc').value=d?.seo_description||'';
  $('ps-stock').value=d?.stock_qty??'';$('ps-sale-enabled').checked=Boolean(p.is_active);
  const m=d?.measurement_options||defaults;
  for(const [id,key] of [['ps-minw','min_width'],['ps-maxw','max_width'],['ps-minh','min_height'],['ps-maxh','max_height']])$(id).value=m[key]??defaults[key];
  for(const item of Array.isArray(d?.variant_options)?d.variant_options:[])variantRow(item.label,(item.values||[]).join(', '));
  originalPaths=[...(d?.image_paths||[])];
  images=originalPaths.map(path=>({id:crypto.randomUUID(),path}));
  $('ps-page-title').textContent='Ürünü Düzenle';$('ps-crumb').textContent=p.title;
  $('ps-summary-date').textContent=new Date(d?.updated_at||p.updated_at).toLocaleDateString('tr-TR');
  setStatus(d?.display_status||p.visibility|| (p.is_active?'published':'draft'));renderImages();feedback('');
 }else feedback('Yeni ürün hazırlayın. Kaydet ile taslak oluşturabilir veya Yayınla ile satışa açabilirsiniz.');
 refreshSummary();$('ps-studio').scrollIntoView({block:'start',behavior:'smooth'});
}
async function checkAccess(){
 if(authorized)return true;
 try{const {data:{user},error}=await sb.auth.getUser();if(error||!user)throw Error('Oturum açın.');
 const {data:access,error:err}=await sb.from('admin_access').select('role').eq('user_id',user.id).single();
 if(err||!['owner','admin'].includes(access?.role))throw Error('Ürün yönetim yetkiniz yok.');
 authorized=true;return true
 }catch(e){alert(e.message||'Yönetici girişi gerekiyor');return false}
}
function validate(){
 const title=cleanText($('ps-name').value),price=Number($('ps-price').value),m=measurements(),stock=$('ps-stock').value;
 if(title.length<5||title.length>160)throw Error('Ürün adı 5–160 karakter arasında olmalıdır.');
 if(!Number.isFinite(price)||price<1||price>100000)throw Error('Geçerli bir m² fiyatı girin.');
 if(!['zebra','mat-stor'].includes($('ps-category').value))throw Error('Kategori seçin.');
 if(!Object.values(m).every(Number.isFinite)||m.min_width<50||m.max_width>280||m.min_height<50||m.max_height>280||m.min_width>m.max_width||m.min_height>m.max_height)throw Error('Ölçü sınırları 50 ile 280 cm arasında ve tutarlı olmalıdır.');
 if(stock!==''&&(!Number.isInteger(Number(stock))||Number(stock)<0))throw Error('Stok sıfır veya pozitif bir tam sayı olmalıdır.');
 if(variants().length>8)throw Error('En fazla 8 varyant grubu ekleyebilirsiniz.');
 return {title,price,m,stock:stock===''?null:Number(stock)};
}
async function save(force){
 if(busy)return;
 if(!await checkAccess())return;
 let data;try{data=validate()}catch(e){feedback(e.message);return}
 let status=force||$('ps-active').value;
 if(status==='published'&&!current&&!images.length){feedback('Yeni ürünü yayınlamak için en az bir fotoğraf yükleyin.');return}
 if(status==='published'&&data.stock===0&&$('ps-sale-enabled').checked){feedback('Stok sıfırsa önce Satışa açık seçeneğini kapatın veya Taslak kaydedin.');return}
 busy=true;['ps-publish','ps-save-draft'].forEach(id=>$(id).disabled=true);
 feedback('Ürün ve fotoğraflar kaydediliyor…');
 const slug=current?.slug||slugify(data.title);
 if(!slug||slug.length<3){busy=false;feedback('Ürün adı geçerli bir kod oluşturamıyor.');['ps-publish','ps-save-draft'].forEach(id=>$(id).disabled=false);return}
 const product={slug,title:data.title,collection:$('ps-category').value,price_per_sqm:data.price,is_active:status==='published'&&$('ps-sale-enabled').checked,visibility:status};
 let justCreated=false;
 try{
  if(!current){
   const {error}=await sb.from('shop_products').insert({...product,is_active:false,visibility:'draft'});if(error)throw error;justCreated=true;
   current={...product,is_active:false};
  }else{
   const {error}=await sb.from('shop_products').update({title:data.title,collection:product.collection,price_per_sqm:data.price}).eq('slug',slug);if(error)throw error;
  }
  const stored=[];
  for(const image of images){
   if(image.path){stored.push(image.path);continue}
   const extension=image.file.type==='image/jpeg'?'jpg':image.file.type==='image/png'?'png':'webp';
   const path=slug+'/'+crypto.randomUUID()+'.'+extension;
   const {error}=await sb.storage.from(bucket).upload(path,image.file,{contentType:image.file.type,cacheControl:'3600',upsert:false});
   if(error)throw error;image.path=path;stored.push(path);
  }
  const record={slug,short_description:cleanText($('ps-short').value),description_html:sanitize($('ps-desc').innerHTML),image_paths:stored,variant_options:variants(),measurement_options:data.m,seo_title:cleanText($('ps-seo-title').value),seo_description:cleanText($('ps-seo-desc').value),stock_qty:data.stock,display_status:status,updated_at:new Date().toISOString()};
  const {error:detailsError}=await sb.from('shop_product_details').upsert(record,{onConflict:'slug'});if(detailsError)throw detailsError;
  const {error:publishError}=await sb.from('shop_products').update({is_active:product.is_active,visibility:status}).eq('slug',slug);if(publishError)throw publishError;
  const removed=originalPaths.filter(path=>!stored.includes(path)&&!path.startsWith('legacy:'));
  if(removed.length){const {error:cleanupError}=await sb.storage.from(bucket).remove(removed);if(cleanupError)feedback('Ürün kaydedildi ancak kaldırılan fotoğraflar depodan silinemedi: '+cleanupError.message)}
  originalPaths=[...stored];
  current={...product,updated_at:record.updated_at};images.forEach(i=>{if(i.objectURL){URL.revokeObjectURL(i.objectURL);i.objectURL=null;i.file=null}});
  renderImages();$('ps-summary-date').textContent=new Date().toLocaleDateString('tr-TR');
  feedback('✓ Ürün başarıyla '+(status==='published'?'yayınlandı.':'kaydedildi.')+' Mağaza bağlantısı: urun.html?slug='+slug);
  // Keep the admin view visible to allow further photo/description changes.
  $('ps-crumb').textContent=data.title;$('ps-page-title').textContent='Ürünü Düzenle';setStatus(status);
  const link=document.createElement('a');link.href='urun.html?slug='+encodeURIComponent(slug);link.target='_blank';link.rel='noopener';link.textContent='Ürünü Mağazada Aç →';link.style.cssText='display:block;color:#865326;font-weight:700;margin-top:8px';$('ps-feedback').append(link);
 }catch(e){feedback('Kaydedilemedi: '+(e?.message||'Beklenmeyen hata')+(justCreated?' Yeni ürün taslak kaydı oluşturulmuş olabilir; aynı ürünü listeden açıp işlemi yeniden deneyin.':''))}
 finally{busy=false;['ps-publish','ps-save-draft'].forEach(id=>$(id).disabled=false)}
}
function back(){$('ps-studio').hidden=true;$('product-index').hidden=false;window.location.hash='products';if(current){location.reload()}}
$('ps-create').addEventListener('click',()=>open());
$('ps-new').addEventListener('click',()=>open());
$('ps-back').addEventListener('click',back);
$('ps-add-variant').addEventListener('click',()=>variantRow());
$('ps-file').addEventListener('change',e=>{addFiles(e.target.files);e.target.value=''});
const drop=$('ps-dropzone');
drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragging')});
drop.addEventListener('dragleave',()=>drop.classList.remove('dragging'));
drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragging');addFiles(e.dataTransfer.files)});
document.querySelectorAll('input[name="ps-publish"]').forEach(r=>r.addEventListener('change',()=>{$('ps-active').value=r.value;authorStatus()}));
$('ps-active').addEventListener('change',()=>setStatus($('ps-active').value));$('ps-sale-enabled').addEventListener('change',refreshSummary);
['ps-name','ps-price','ps-category','ps-stock','ps-short'].forEach(id=>$(id).addEventListener('input',refreshSummary));
$('ps-save-draft').addEventListener('click',()=>save());
$('ps-publish').addEventListener('click',()=>{setStatus('published');save('published')});
document.querySelectorAll('[data-ps-scroll]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-ps-scroll]').forEach(b=>b.classList.toggle('selected',b===button));$(button.dataset.psScroll)?.scrollIntoView({behavior:'smooth',block:'start'})}));
document.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',()=>{const editor=$('ps-desc');editor.focus();document.execCommand(button.dataset.command,false,button.dataset.value||null)}));
$('ps-desc').addEventListener('paste',e=>{e.preventDefault();const text=e.clipboardData?.getData('text/plain')||'';document.execCommand('insertText',false,text)});
window.pkStudio={open};
})();