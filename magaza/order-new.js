(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co',KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.supabase?.createClient(API,KEY),$=id=>document.getElementById(id);
const categories=[{name:'TÜL PERDE',count:10},{name:'FON PERDE',count:5},{name:'GÜNEŞLİK',count:5},{name:'STOR PERDE',count:6,kind:'list'},{name:'AKSESUAR',count:6,kind:'list'}];
const fmt=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const asNum=v=>Number(v)||0;
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let user=null,org=null,branches=[],existingCustomers=[],products=new Map(),active=null,saving=false,editing=null;
const key=(category,index)=>category+'|'+index;
const pileFactors={'1.0x':1,'2.0x':2,'3.0x':3,'3.5x':3.5,'4.5x':4.5,'Özel':1,'':1};
const pileFactor=(pile)=>pileFactors[pile]??1;
const rounded=(n)=>Math.round((Number(n)+Number.EPSILON)*100)/100;
const priceFromBase=(base,pile)=>rounded(Number(base)*pileFactor(pile));
const storCaseColors={open:[],classic:['Beyaz','Krem'],colored:['Gri','Antrasit','Kahve']};
let catalogCache=[],catalogOrg=null,catalogRequest=null,manualPrice=false;
function isStor(){return $('product-category').value==='STOR PERDE'}
function storSettings(){
 return {caseType:$('stor-case').value,color:$('stor-color').value,chain:$('stor-chain').value,side:$('stor-side').value,tube:$('stor-tube').value,foot:$('stor-foot').value}
}
function storUnitPrice(base,w,h,opts){
 const calcWidth=Math.max(100,Number(w)||0),calcHeight=Math.max(200,Number(h)||0);
 const meter=calcWidth/100,area=calcWidth*calcHeight/10000;
 const caseCost=(opts.caseType==='classic'?140:opts.caseType==='colored'?170:0)*meter;
 const chainCost=opts.chain==='metal'?105:0;
 const tubeCost=opts.tube==='38'?200*meter:0;
 return rounded(area*base+caseCost+chainCost+tubeCost)
}
function storSpecs(opts,w,h){
 const cases={open:'Açık Kasa',classic:'Kapalı Kasa Klasik',colored:'Kapalı Kasa Renkli'};
 return ['Kasa: '+cases[opts.caseType],opts.caseType!=='open'&&'Kasa Rengi: '+opts.color,
 'Zincir: '+(opts.chain==='metal'?'Metal':'Plastik'),'Zincir Yönü: '+(opts.side==='right'?'Sağ':'Sol'),
 'Boru: '+(opts.tube==='38'?'38 Jumbo':'32 Standart'),'Yan Ayak: '+(opts.foot==='metal'?'Metal':'Plastik'),
 'Hesap En: '+Math.max(100,Number(w)||0)+' cm','Hesap Boy: '+Math.max(200,Number(h)||0)+' cm'].filter(Boolean).join('; ')
}
function parseStorSpecs(spec){
 const get=key=>(String(spec||'').match(new RegExp('(?:^|;\\\\s*)'+key+':\\\\s*([^;]+)'))?.[1]||'').trim();
 const kase=get('Kasa');
 return {caseType:kase==='Kapalı Kasa Klasik'?'classic':kase==='Kapalı Kasa Renkli'?'colored':'open',
 color:get('Kasa Rengi'),chain:get('Zincir')==='Metal'?'metal':'plastic',
 side:get('Zincir Yönü')==='Sağ'?'right':'left',tube:get('Boru').startsWith('38')?'38':'32',
 foot:get('Yan Ayak')==='Metal'?'metal':'plastic'}
}
function syncStorColor(value){
 const colors=storCaseColors[value]||[];
 $('stor-color-row').hidden=!colors.length;
 $('stor-color').replaceChildren(...colors.map(c=>new Option(c,c)));
 if(!colors.includes($('stor-color').value))$('stor-color').value=colors[0]||'';
}
function syncCategoryUI(){
 const stor=isStor();
 $('stor-options').hidden=!stor;
 $('product-pile').closest('label').hidden=stor;
 $('product-price').closest('label').firstChild.textContent=stor?'m² Birim Fiyatı (₺) *':'Temel Birim Fiyat (₺) *';
 $('product-width').required=stor;$('product-height').required=stor;
 if(stor)syncStorColor($('stor-case').value);
}
async function fetchCatalog(){
 if(!org?.id)return;
 if(catalogOrg===org.id)return;
 catalogCache=[];catalogOrg=org.id;
 const requested=org.id;
 const promise=sb.from('erp_catalog_products').select('id,name,category,unit_price').eq('organization_id',requested).eq('active',true).order('name').limit(1000);
 catalogRequest=promise;
 const {data,error}=await promise;
 if(catalogOrg!==requested)return;
 if(error){$('catalog-hint').textContent='Katalog yüklenemedi: '+error.message;return}
 catalogCache=data||[];
 $('catalog-hint').textContent='Ürün seçilince fiyat otomatik gelir. Tek harften itibaren arama yapabilirsiniz.';
}
function showCatalog(){
 const category=$('product-category').value;
 const search=$('catalog-search').value.trim().toLocaleUpperCase('tr-TR');
 const matches=catalogCache.filter(p=>p.category===category&&(!search||p.name.toLocaleUpperCase('tr-TR').startsWith(search)));
 const list=$('catalog-results');list.replaceChildren();
 for(const p of matches.slice(0,150)){
  const button=newElement('button','catalog-choice');button.type='button';button.setAttribute('role','option');
  button.append(newElement('span','',p.name),newElement('strong','',fmt(p.unit_price)+(category==='STOR PERDE'?' / m²':'')));
  button.onclick=()=>{
   $('product-name').value=p.name;$('catalog-search').value=p.name;
   $('product-price').value=p.unit_price;manualPrice=false;list.hidden=true;calculateItemTotal();
  };
  list.append(button);
 }
 if(matches.length>150)list.append(newElement('p','catalog-hint','İlk 150 ürün gösteriliyor. Aramanızı daraltın.'));
 if(!matches.length)list.append(newElement('p','catalog-hint','Bu harfle başlayan ürün bulunamadı.'));
 list.hidden=false;
}

function alertText(text){$('order-alert').textContent=text;$('order-alert').hidden=!text;window.scrollTo({top:0,behavior:'smooth'})}
function setDate(days){
 const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+days);
 const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
 $('delivery-date').value=[y,m,day].join('-');
}
function moneyValue(){
 let subtotal=0;
 for(const value of products.values())subtotal+=value.price*value.qty;
 const percent=asNum($('discount-percent').value),fixed=asNum($('discount-amount').value);
 const discount=Number((subtotal*percent/100+fixed).toFixed(2)),total=Number((subtotal-discount).toFixed(2));
 const paid=asNum($('paid-value').value);
 return {subtotal,percent,fixed,discount,total,paid};
}
function updateMoney(){
 const v=moneyValue();
 $('subtotal-value').textContent=fmt(v.subtotal);
 $('discount-value').textContent=fmt(v.discount);
 $('grand-value').textContent=fmt(Math.max(0,v.total));
 $('balance-value').textContent=fmt(Math.max(0,v.total-v.paid));
 $('balance-value').style.color=(v.paid>v.total||v.total<0)?'#ad3923':'';
}
const statusNames={processing:'İşlemde',workshop:'Atölyede',ready:'Mağazada · Teslime Hazır',delivered:'Teslim Edildi',cancelled:'İptal'};
const statusCss={processing:'processing',workshop:'workshop',ready:'ready',delivered:'delivered',cancelled:'cancelled'};
function newElement(tag,className,text){
 const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;
}
function pileParts(record){
 if(!record)return {pile:'',spec:''};
 return {pile:record.pile||'',spec:record.spec||''};
}
function drawSlots(){
 const target=$('category-sections');target.replaceChildren();
 for(const group of categories){
  const section=newElement('section','category-section');
  const heading=newElement('div','category-heading');
  heading.append(newElement('h3','',group.name),
    newElement('span','',[...products.keys()].filter(k=>k.startsWith(group.name+'|')).reduce((n,k)=>n+products.get(k).qty,0)+' parça'));
  section.append(heading);
  const grid=newElement('div',group.kind==='list'?'slot-list':'slot-grid');
  for(let i=0;i<group.count;i++){
   const k=key(group.name,i),record=products.get(k);
   if(!record){
    const add=newElement('button','product-slot');add.type='button';
    add.append(newElement('span','slot-add',group.kind==='list'?(i+1)+'. + Ekle':'+ Ekle'));
    add.onclick=()=>openItem(group.name,i);grid.append(add);continue;
   }
   const wrapper=newElement('div','slot-record status-'+(statusCss[record.status]||'processing'));
   const details=newElement('div','slot-record-detail');
   details.append(newElement('strong','',record.name));
   details.append(newElement('small','',record.qty+' adet · '+(record.width||'—')+' × '+(record.height||'—')+' cm'));
   if(record.pile)details.append(newElement('small','',record.pile));
   details.append(newElement('small','',fmt(record.price*record.qty)));
   wrapper.append(details);
   if(editing&&record.id){
    const select=newElement('select','slot-status');select.setAttribute('aria-label','Satır durumu: '+record.name);
    for(const v of ['processing','workshop','ready','delivered','cancelled']){
     const option=new Option(statusNames[v],v);
     if(v==='ready'||v==='delivered'||record.status==='ready'||record.status==='delivered')option.disabled=v!==record.status;
     select.add(option);
    }
    select.value=record.status||'processing';
    if(record.status==='ready'||record.status==='delivered'||editing.status==='delivered'||editing.status==='cancelled'||editing.status==='waiting')select.disabled=true;
    select.onchange=async()=>{const prev=record.status;select.disabled=true;
      try{await updateItemStatus(record,select.value);record.status=select.value;drawSlots();}
      catch(e){record.status=prev;drawSlots();alertText('Satır durumu değiştirilemedi: '+e.message);}
    };
    wrapper.append(select);
   }else{
    wrapper.append(newElement('span','status-label',statusNames[record.status||'processing']));
   }
   const controls=newElement('div','slot-controls');
   const edit=newElement('button','slot-edit','Düzenle');edit.type='button';edit.onclick=()=>openItem(group.name,i);
   const remove=newElement('button','slot-remove','Sil');remove.type='button';remove.onclick=()=>removeItem(group.name,i);
   if(record.status==='ready'||record.status==='delivered'){remove.disabled=true;remove.title='Teslim alınan ürün silinemez';}
   controls.append(edit,remove);wrapper.append(controls);grid.append(wrapper);
  }
  section.append(grid);target.append(section);
 }
 updateMoney();
}
async function updateItemStatus(record,next){
 if(!editing||!record.id)throw Error('Kaydedilmemiş ürünün durumu değiştirilemez.');
 const {error}=await sb.rpc('erp_set_item_workflow_status',{p_org:org.id,p_item:record.id,p_status:next});
 if(error)throw error;
 const {data,error:readError}=await sb.from('erp_orders').select('updated_at').eq('organization_id',org.id).eq('id',editing.id).single();
 if(readError)throw readError;
 editing.updated_at=data.updated_at;
}
function removeItem(category,index){
 const k=key(category,index),item=products.get(k);
 if(!item)return;
 if(['ready','delivered'].includes(item.status)){alertText('Mağazaya ulaşmış veya teslim edilmiş ürün silinemez.');return}
 if(item.id&&!confirm(item.name+' ürünü siparişten kaldırılacak. Değişiklik, siparişi kaydedince gerçekleşecek. Devam edilsin mi?'))return;
 products.delete(k);closeItem();drawSlots();
}
function openItem(category,index){
 active={category,index};
 const value=products.get(key(category,index));
 $('product-category-title').textContent=category+' · Kutucuk '+(index+1);
 $('product-dialog-title').textContent=value?'Satırı Düzenle':'Yeni Satır Ekle';
 $('product-form').reset();
 $('product-category').value=category;
 $('catalog-search').value='';
 $('catalog-results').hidden=true;
 $('stor-case').value='open';$('stor-chain').value='plastic';$('stor-side').value='left';$('stor-tube').value='32';$('stor-foot').value='plastic';
 syncCategoryUI();
 $('product-name').value=value?.name||'';
 $('product-width').value=value?.width??'';
 $('product-height').value=value?.height??'';
 $('product-price').value=value?(value.basePrice??value.price):'';
 $('product-quantity').value=value?.qty??1;
 $('product-pile').value=value?.pile||'';
 $('product-spec').value=value?.spec||'';
 if(category==='STOR PERDE'){
  const cfg=value?.stor||parseStorSpecs(value?.spec||'');
  $('stor-case').value=cfg.caseType;syncStorColor(cfg.caseType);
  if(cfg.color&&[...$('stor-color').options].some(x=>x.value===cfg.color))$('stor-color').value=cfg.color;
  $('stor-chain').value=cfg.chain;$('stor-side').value=cfg.side;$('stor-tube').value=cfg.tube;$('stor-foot').value=cfg.foot;
 }
 manualPrice=false;
 fetchCatalog().then(()=>{if(active?.category===category)showCatalog()});
 $('product-note').value=value?.note||'';
 $('product-status').value=value?.status||'processing';
 $('product-status').disabled=!value?.id||['ready','delivered'].includes(value.status)||['waiting','delivered','cancelled'].includes(editing?.status);
 $('product-status-wrapper').title=value?.id?'Durum değişikliği seçildiğinde anında kaydedilir.':'Sipariş kaydedilince ürün İşlemde durumunda başlar.';
 $('delete-product').hidden=!value;
 $('delete-product').disabled=!!value&&['ready','delivered'].includes(value.status);
 $('product-quantity').disabled=!!value?.id;
 if(value?.id)$('product-quantity').value='1';
 $('product-status-message').textContent=value?.id?'Satır durumu seçildiğinde hemen kaydedilir. Ürün bilgileri için ayrıca Kaydet butonuna basın.':'';
 $('product-overlay').hidden=false;
 calculateItemTotal();
 $('product-name').focus();
}
function closeItem(){$('product-overlay').hidden=true;active=null}
function calculateItemTotal(){
 const base=asNum($('product-price').value),qty=asNum($('product-quantity').value);
 if(isStor()){
  const width=asNum($('product-width').value),height=asNum($('product-height').value);
  const effectiveWidth=Math.max(100,width),effectiveHeight=Math.max(200,height);
  const unit=storUnitPrice(base,width,height,storSettings());
  $('product-total').textContent=fmt(unit*qty);
  $('pile-price-hint').textContent='Fiyat: '+fmt(unit)+' × '+qty+' adet = '+fmt(unit*qty);
  $('stor-calculation').textContent='Gerçek ölçü: '+(width||'—')+' × '+(height||'—')+' cm · Fiyat hesabı: '+effectiveWidth+' × '+effectiveHeight+' cm ('+(effectiveWidth*effectiveHeight/10000).toLocaleString('tr-TR')+' m²) · Kasa / mekanizma farkları dahil: '+fmt(unit)+' / adet';
 }else{
  const p=$('product-pile').value,factor=pileFactor(p);
  $('product-total').textContent=fmt(priceFromBase(base,p)*qty);
  $('pile-price-hint').textContent='Hesap: '+fmt(base)+' × '+String(factor).replace('.',',')+' (pile) × '+qty+' adet = '+fmt(priceFromBase(base,p)*qty)+(p==='Özel'?' · Özel pile için temel fiyat doğrudan kullanılır.':'');
 }
}
function storeItem(e){
 e.preventDefault();
 const name=$('product-name').value.trim(),qty=Number($('product-quantity').value),basePrice=Number($('product-price').value),pile=isStor()?'':$('product-pile').value,price=isStor()?storUnitPrice(basePrice,$('product-width').value,$('product-height').value,storSettings()):priceFromBase(basePrice,pile);
 const width=$('product-width').value,height=$('product-height').value,category=$('product-category').value;
 if(name.length<2||!Number.isInteger(qty)||qty<1||qty>20||!Number.isFinite(basePrice)||basePrice<0||!Number.isFinite(price)||price<0||price>99999999){$('product-status-message').textContent='Ürün adı, fiyatı veya adedi geçersiz.';return}
 if((width!==''&&(!Number.isFinite(Number(width))||Number(width)<0))||(height!==''&&(!Number.isFinite(Number(height))||Number(height)<0))){$('product-status-message').textContent='En ve boy negatif olamaz.';return}
 if(category==='STOR PERDE'&&(!Number.isFinite(Number(width))||Number(width)<=0||!Number.isFinite(Number(height))||Number(height)<=0)){$('product-status-message').textContent='Stor perdede gerçek en ve boy ölçüsü sıfırdan büyük olmalı.';return}
 const oldKey=key(active.category,active.index),old=products.get(oldKey);
 if(old&&['ready','delivered'].includes(old.status)){ $('product-status-message').textContent='Teslim alınmış ürün üretim bilgilerinde değişiklik yapılamaz.';return }
 const group=categories.find(c=>c.name===category);
 if(!group){$('product-status-message').textContent='Kategori geçersiz.';return}
 let index=active.index;
 if(category!==active.category){
  index=Array.from({length:group.count},(_,i)=>i).find(i=>!products.has(key(category,i)))??-1;
  if(index<0){$('product-status-message').textContent='Seçilen kategoride boş kutucuk yok.';return}
 }
 const totalBefore=[...products.values()].reduce((n,p)=>n+p.qty,0)-(old?.qty||0);
 if(totalBefore+qty>60){$('product-status-message').textContent='Bir siparişte en fazla 60 fiziksel parça eklenebilir.';return}
 const cfg=category==='STOR PERDE'?storSettings():null;
 const spec=cfg?[storSpecs(cfg,width,height),$('product-spec').value.trim()].filter(Boolean).join('; '):$('product-spec').value.trim();
 const record={name,qty,price,basePrice,width,height,pile,spec,stor:cfg,note:$('product-note').value.trim(),id:old?.id||null,barcode:old?.barcode||null,status:old?.status||'processing'};
 products.delete(oldKey);products.set(key(category,index),record);
 closeItem();drawSlots();
}
function toggleCustomer(which){
 const existing=which==='existing';
 $('existing-customer').hidden=!existing;$('new-customer').hidden=existing;
 $('choose-existing').classList.toggle('selected',existing);
 $('choose-new').classList.toggle('selected',!existing);
 $('choose-existing').setAttribute('aria-pressed',String(existing));
 $('choose-new').setAttribute('aria-pressed',String(!existing));
 if(existing)renderCustomers();
}
function renderCustomers(){
 const text=$('customer-search').value.trim().toLocaleLowerCase('tr-TR');
 const area=$('customer-results');area.replaceChildren();
 const found=existingCustomers.filter(c=>[c.name,c.phone].some(v=>String(v||'').toLocaleLowerCase('tr-TR').includes(text))).slice(0,30);
 for(const c of found){
  const btn=document.createElement('button');btn.type='button';btn.textContent=c.name+(c.phone?' — '+c.phone:'');
  btn.onclick=()=>{$('customer-name').value=c.name;$('customer-phone').value=c.phone||'';toggleCustomer('new');alertText('')};
  area.append(btn);
 }
 if(!found.length)area.textContent='Kayıtlı müşteri bulunamadı.';
}
function stage(next){
 $('stage1').hidden=next!==1;$('stage2').hidden=next!==2;
 $('step-label').textContent=next===1?'1 / 2 · Müşteri Bilgileri':'2 / 2 · Sipariş ve Ürünler';
 if(next===2){
  $('order-status-display').value=editing?.status==='new'?'processing':editing?.status||'processing';
  $('editor-print-a4').hidden=!editing;
  $('editor-print-label').hidden=!editing;
  $('editor-print-label').disabled=!editing||!['processing','new'].includes(editing.status)||Boolean(editing.barcode_printed_at);
  $('editor-print-label').title=editing?.barcode_printed_at?'Bu siparişin barkodu daha önce basılmış':'';
  syncOrderStatusOptions();
  $('summary-customer').textContent=$('customer-name').value.trim();
  $('summary-phone').textContent=$('customer-phone').value.trim()||'—';
  $('summary-delivery').textContent=$('delivery-date').value?new Date($('delivery-date').value+'T12:00:00').toLocaleDateString('tr-TR'):'—';
  $('delivery-copy').value=$('delivery-date').value;
  $('type-copy').value=$('order-type').value;
  $('note-copy').value=$('order-note').value;
  const branch=branches.find(x=>x.id===$('store-select').value);
  $('branch-heading').textContent=branch?.name||'Şube';
  $('organization-heading').textContent=org?.name||'KONAK ERP';
  $('company-contact').textContent=[org?.phone,org?.email,org?.address].filter(Boolean).join(' · ')||'KONAK ERP · Mağaza Yönetimi';
  if(org?.logo_url&&/^https:\/\//i.test(org.logo_url)){$('company-logo-image').src=org.logo_url;$('company-logo-image').hidden=false;$('company-logo-fallback').hidden=true}
  drawSlots();
 }
 window.scrollTo({top:0,behavior:'smooth'});
}
async function start(){
 if(!sb){$('auth-warning').hidden=false;alertText('Bağlantı yüklenemedi. Sayfayı yenileyin.');return}
 const response=await sb.auth.getUser();
 user=response.error?null:response.data?.user;
 if(!user){$('auth-warning').hidden=false;return}
 $('order-user-email').textContent=user.email||'Oturum açık';
 try{
  const {data:membership,error:membershipError}=await sb.from('erp_members').select('organization_id,role').eq('user_id',user.id);
  if(membershipError)throw membershipError;
  if(!membership?.length){$('auth-warning').hidden=false;alertText('Önce Hesabım → Şirket Ayarları bölümünden işletme oluşturun.');return}
  const preferred=new URLSearchParams(location.search).get('org');
  const selected=membership.find(x=>x.organization_id===preferred)||membership[0];
  const [{data:company,error:companyErr},{data:branchData,error:branchErr},{data:orders,error:ordersErr}]=await Promise.all([
   sb.from('erp_organizations').select('id,name,phone,email,address,logo_url').eq('id',selected.organization_id).single(),
   sb.from('erp_branches').select('id,name').eq('organization_id',selected.organization_id).order('name'),
   sb.from('erp_orders').select('customer_name,customer_phone').eq('organization_id',selected.organization_id).order('created_at',{ascending:false}).limit(500)]);
  if(companyErr||branchErr||ordersErr)throw companyErr||branchErr||ordersErr;
  org=company;branches=branchData||[];
  const seen=new Set();existingCustomers=[];
  for(const record of orders||[]){const name=record.customer_name?.trim(),phone=record.customer_phone?.trim()||'';if(!name)continue;const k=(name+'|'+phone).toLocaleLowerCase('tr-TR');if(!seen.has(k)){seen.add(k);existingCustomers.push({name,phone})}}
  const selector=$('store-select');selector.replaceChildren(new Option('Şube seçiniz',''));
  branches.forEach(b=>selector.add(new Option(b.name,b.id)));
  if(branches.length===1)selector.value=branches[0].id;
  if(!branches.length){$('auth-warning').hidden=false;alertText('Şirket Ayarlarından önce şube ekleyin.');return}
  setDate(7);$('stage1').hidden=false;
  const editId=new URLSearchParams(location.search).get('edit');
  if(editId)await loadForEdit(editId,selected.organization_id);
 }catch(e){$('auth-warning').hidden=false;alertText('Sipariş ekranı yüklenemedi: '+e.message)}
}
async function loadForEdit(orderId,orgId){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)){alertText('Geçersiz sipariş bağlantısı.');return}
 try{
  const {data:order,error:orderError}=await sb.from('erp_orders').select('id,organization_id,branch_id,customer_name,customer_phone,delivery_date,customer_note,paid_amount,discount_percent,discount_amount,order_type,payment_method,status,updated_at').eq('organization_id',orgId).eq('id',orderId).single();
  if(orderError)throw orderError;
  if(['delivered','cancelled'].includes(order.status))throw Error('Teslim edilmiş veya iptal edilmiş sipariş düzenlenemez.');
  const {data:lines,error:lineError}=await sb.from('erp_order_items').select('id,category,product_name,width_cm,height_cm,unit_price,production_note,barcode,slot_key,status').eq('organization_id',orgId).eq('order_id',orderId).order('created_at',{ascending:true});
  if(lineError)throw lineError;
  editing=order;products.clear();
  const taken=new Set();
  for(const line of lines||[]){
   const group=categories.find(x=>x.name===line.category);
   if(!group)throw Error('Desteklenmeyen ürün kategorisi: '+line.category);
   let idx=-1;
   if(line.slot_key){
    const match=line.slot_key.match(/\|(\d+)(?:-\d+)?$/);
    if(match&&Number(match[1])<group.count&&!taken.has(key(group.name,Number(match[1]))))idx=Number(match[1]);
   }
   if(idx<0)idx=Array.from({length:group.count},(_,i)=>i).find(i=>!taken.has(key(group.name,i)))??-1;
   if(idx<0)throw Error('Bu sipariş için '+group.name+' kutucuğu yetersiz. Kaydı değiştirmeden destek alın.');
   const slotKey=key(group.name,idx);taken.add(slotKey);
   const notes=line.production_note||'';
   const spec=notes.startsWith('Özellikler: ')?notes.split('\n')[0].replace('Özellikler: ',''):'';
   const specParts=spec.match(/^Pile:\s*([^;]+)(?:;\s*(.*))?$/);
   const baseMatch=spec.match(/(?:^|;\s*)Baz Fiyat:\s*(\d+(?:\.\d+)?)/);
   const parsedPile=specParts?.[1]||'';
   const legacyBase=Number(line.unit_price)/pileFactor(parsedPile);
   const basePrice=baseMatch?Number(baseMatch[1]):rounded(legacyBase);
   const detailedSpec=(specParts?.[2]||(!specParts?spec:''))?.replace(/(?:^|;\s*)Baz Fiyat:\s*\d+(?:\.\d+)?/,'').trim().replace(/^;\s*|;\s*$/g,'');
   products.set(slotKey,{id:line.id,barcode:line.barcode,name:line.product_name,qty:1,price:Number(line.unit_price),width:line.width_cm??'',height:line.height_cm??'',pile:parsedPile,basePrice,spec:detailedSpec,status:line.status||'processing',note:spec?notes.split('\n').slice(1).join('\n'):notes});
  }
  $('store-select').value=order.branch_id;
  $('customer-name').value=order.customer_name;
  $('customer-phone').value=order.customer_phone||'';
  $('delivery-date').value=order.delivery_date||'';
  $('order-type').value=order.order_type||'new';
  $('order-note').value=order.customer_note||'';
  $('discount-percent').value=order.discount_percent??0;
  $('discount-amount').value=order.discount_amount??0;
  $('paid-value').value=order.paid_amount??0;
  $('paid-value').disabled=true;
  $('paid-value').title='Tahsilatları Siparişler > Ödeme Ekle bölümünden kaydedin.';
  $('payment-method').value=order.payment_method||'cash';
  document.querySelector('.order-topline h1').textContent='Siparişi Düzenle';
  $('submit-order').textContent='Değişiklikleri Kaydet';
  $('continue-btn').textContent='Siparişe Devam Et →';
  stage(2);
 }catch(err){
  alertText('Sipariş yüklenemedi: '+err.message);
  $('stage1').hidden=true;$('stage2').hidden=true;
 }
}
async function submit(){
 if(saving)return;
 const count=[...products.values()].reduce((a,p)=>a+p.qty,0),v=moneyValue();
 if(!count){alertText('En az bir ürün ekleyin.');return}
 if(count>60){alertText('En fazla 60 ürün parçası eklenebilir.');return}
 if(!Number.isFinite(v.percent)||v.percent<0||v.percent>100||v.fixed<0||v.total<0||v.paid<0||v.paid>v.total){alertText('İskonto ve ödemeleri kontrol edin. Ödeme toplamı aşamaz.');return}
 if(!$('delivery-copy').value||!org||!branches.some(b=>b.id===$('store-select').value)){alertText('Teslim tarihini ve şubeyi kontrol edin.');return}
 const payload=[];
 for(const [slot,p] of products){
  const category=slot.split('|')[0],spec=[p.pile&&'Pile: '+p.pile, 'Baz Fiyat: '+(p.basePrice??p.price),p.spec].filter(Boolean).join('; '),fullNote=[spec&&'Özellikler: '+spec,p.note].filter(Boolean).join('\n');
  for(let i=0;i<p.qty;i++)payload.push({id:p.id||null,slot_key:key(category,Number(slot.split('|')[1]))+(p.qty>1?'-'+i:''),category,product_name:p.name,width_cm:p.width||null,height_cm:p.height||null,unit_price:p.price,production_note:fullNote});
 }
 saving=true;$('submit-order').disabled=true;$('save-message').textContent='Kaydediliyor...';
 try{
  const {data,error}=await sb.rpc(editing?'erp_update_order':'erp_create_order_v2',{
   ...(editing?{p_order:editing.id,p_expected_updated_at:editing.updated_at}:{p_org:org.id}),p_branch:$('store-select').value,p_customer:$('customer-name').value.trim(),
   p_phone:$('customer-phone').value.trim(),p_delivery:$('delivery-copy').value,
   p_note:$('note-copy').value.trim(),p_paid:v.paid,p_items:payload,
   p_order_type:$('type-copy').value,p_discount_percent:v.percent,
   p_discount_amount:v.fixed,p_payment_method:$('payment-method').value});
  if(error)throw error;
  location.replace('./?'+(editing?'updated':'created')+'='+encodeURIComponent(data));
 }catch(e){$('save-message').textContent='Kaydedilemedi: '+e.message;alertText('Sipariş kaydedilemedi: '+e.message)}
 finally{saving=false;$('submit-order').disabled=false}
}
$('customer-form').onsubmit=e=>{
 e.preventDefault();
 if(!$('customer-name').value.trim()||!$('store-select').value||!$('delivery-date').value){alertText('Şube, müşteri adı ve teslim tarihi gerekli.');return}
 alertText('');stage(2);
};
$('choose-existing').onclick=()=>toggleCustomer('existing');
$('choose-new').onclick=()=>toggleCustomer('new');
$('customer-search').oninput=renderCustomers;
document.querySelectorAll('[data-days]').forEach(b=>b.onclick=()=>setDate(Number(b.dataset.days)));
$('back-step').onclick=()=>{$('delivery-date').value=$('delivery-copy').value;$('order-type').value=$('type-copy').value;$('order-note').value=$('note-copy').value;stage(1)};
$('delivery-copy').onchange=()=>{$('delivery-date').value=$('delivery-copy').value};
$('type-copy').onchange=()=>{$('order-type').value=$('type-copy').value};
$('note-copy').oninput=()=>{$('order-note').value=$('note-copy').value};
$('product-form').onsubmit=storeItem;
$('order-status-display').onchange=async()=>{
 const select=$('order-status-display'),previous=editing?.status||'processing',next=select.value;
 if(!editing){select.value='processing';return}
 if(previous===next)return;
 if(!((previous==='processing'&&next==='waiting')||(previous==='waiting'&&next==='processing'))){
  select.value=previous;$('order-status-help').textContent='Atölyeye geçiş barkod baskısıyla, mağaza kabulü barkod okutularak yapılır.';return;
 }
 let reason=null;
 if(next==='waiting'){
  reason=prompt('Sipariş neden Beklemede? Müşteriden beklenen bilgiyi yazın:','');
  if(reason===null||reason.trim().length<3){select.value=previous;$('order-status-help').textContent='En az 3 karakterlik bekleme nedeni zorunlu.';return}
 }
 select.disabled=true;$('order-status-help').textContent='Durum kaydediliyor...';
 try{
  const {error}=await sb.rpc('erp_set_order_waiting',{p_org:org.id,p_order_id:editing.id,p_action:next==='waiting'?'wait':'resume',p_reason:reason?.trim()||null});
  if(error)throw error;
  const {data,error:readError}=await sb.from('erp_orders').select('updated_at,status,waiting_reason').eq('organization_id',org.id).eq('id',editing.id).single();
  if(readError)throw readError;
  Object.assign(editing,data);
  $('order-status-help').textContent=next==='waiting'?'Beklemede: '+data.waiting_reason:'Sipariş İşlemde durumuna alındı.';
  drawSlots();
 }catch(e){select.value=previous;$('order-status-help').textContent='Durum değiştirilemedi: '+e.message}
 finally{select.disabled=false;syncOrderStatusOptions()}
};
function syncOrderStatusOptions(){
 const select=$('order-status-display'),current=editing?.status||'processing';
 for(const option of select.options){
  option.disabled=editing?!((current==='processing'||current==='waiting')&&(option.value==='processing'||option.value==='waiting')||option.value===current):option.value!=='processing';
 }
 select.disabled=!editing||!['processing','waiting'].includes(current);
}
$('product-status').onchange=async()=>{
 if(!active)return;
 const item=products.get(key(active.category,active.index)),select=$('product-status');
 if(!item?.id)return;
 const before=item.status,next=select.value;
 select.disabled=true;$('product-status-message').textContent='Durum kaydediliyor...';
 try{
  await updateItemStatus(item,next);
  item.status=next;
  $('product-status-message').textContent='Satır durumu kaydedildi: '+statusNames[next]+'.';
  drawSlots();
 }catch(err){
  select.value=before;
  $('product-status-message').textContent='Durum değiştirilemedi: '+err.message;
 }finally{
  select.disabled=['ready','delivered'].includes(item.status)||['waiting','delivered','cancelled'].includes(editing?.status);
 }
};
$('delete-product').onclick=()=>{if(!active)return;removeItem(active.category,active.index)};
$('product-shade').onclick=$('close-product').onclick=closeItem;
['product-price','product-quantity'].forEach(id=>$(id).oninput=calculateItemTotal);
 ['product-width','product-height'].forEach(id=>$(id).oninput=calculateItemTotal);
 ['stor-chain','stor-side','stor-tube','stor-foot','stor-color'].forEach(id=>$(id).onchange=calculateItemTotal);
 $('stor-case').onchange=()=>{syncStorColor($('stor-case').value);calculateItemTotal()};
 $('product-category').onchange=()=>{syncCategoryUI();$('catalog-search').value='';$('catalog-results').hidden=true;showCatalog();calculateItemTotal()};
 $('catalog-search').oninput=()=>{showCatalog()};
 $('catalog-search').onfocus=showCatalog;
$('product-pile').onchange=calculateItemTotal;
['discount-percent','discount-amount','paid-value'].forEach(id=>$(id).oninput=updateMoney);
$('submit-order').onclick=submit;
function openEditorPrint(type){
 if(!editing||!org)return;
 const url='./print.html?type='+encodeURIComponent(type)+'&org='+encodeURIComponent(org.id)+'&id='+encodeURIComponent(editing.id);
 const win=window.open(url,'_blank','noopener');
 if(!win)location.href=url;
}
$('editor-print-a4').onclick=()=>openEditorPrint('a4');
$('editor-print-label').onclick=()=>openEditorPrint('label');
$('order-logout').onclick=async()=>{await sb.auth.signOut();location.href='./'};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('product-overlay').hidden)closeItem()});
start();
})();