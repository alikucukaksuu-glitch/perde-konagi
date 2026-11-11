(()=>{'use strict';
const sb=window.supabase?.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const $=id=>document.getElementById(id);
const qs=new URLSearchParams(location.search);
const tab=['products','workshop','customers'].includes(qs.get('tab'))?qs.get('tab'):'products';
const categories=['TÜL PERDE','FON PERDE','GÜNEŞLİK','STOR PERDE','AKSESUAR'];
const fmt=x=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(x)||0);
const trDate=x=>x?new Date(x).toLocaleString('tr-TR'):'—';
let user=null,org='',members=[],orgs=[],catalog=[],orders=[],items=[],branches=[],productEditing=null,role='staff',expanded=new Set(),working=false;
const el=(tag,cls,text)=>{let n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text??'');return n};
function put(parent,tag,cls,text){const n=el(tag,cls,text);parent.append(n);return n}
function message(s){$('hub-message').textContent=s||''}
async function get(table,columns,fn){let query=sb.from(table).select(columns);if(fn)query=fn(query);const {data,error}=await query;if(error)throw error;return data||[]}
function canEdit(){return ['owner','manager'].includes(role)}
function settings(){
 const content={
 products:['ÜRÜN KATALOĞU','Kategoriler & Ürünler','İşletmenizin kumaş, perde ve aksesuar fiyatlarını tek ekrandan yönetin.'],
 workshop:['ÜRETİM TAKİBİ','Atölye · Basılan Barkodlar','Barkodu yazdırılmış siparişlerin ve ürünlerin üretim durumları.'],
 customers:['MÜŞTERİ KAYITLARI','Müşteriler','Mevcut siparişlerden oluşan müşteri listesi ve sipariş geçmişi.']
 }[tab];
 $('hub-eyebrow').textContent=content[0];$('hub-title').textContent=content[1];$('hub-desc').textContent=content[2];
 document.querySelectorAll('[data-tab]').forEach(a=>a.classList.toggle('selected',a.dataset.tab===tab));
 $('product-add').hidden=tab!=='products'||!canEdit();
 $('hub-category').hidden=tab!=='products';
 $('hub-archived-wrap').hidden=tab!=='products';
 $('hub-search').placeholder=tab==='products'?'Ürün veya kumaş ara...':tab==='workshop'?'Sipariş no, müşteri, ürün ara...':'Müşteri adı, telefon ara...';
 $('stat-label-a').textContent=tab==='products'?'Kategori':tab==='workshop'?'Baskılı Sipariş':'Müşteri';
 $('stat-label-b').textContent=tab==='products'?'Aktif Ürün':tab==='workshop'?'Atölyede Ürün':'Sipariş';
}
async function initialize(){
 if(!sb){$('hub-auth').hidden=false;return}
 const {data,error}=await sb.auth.getUser();
 user=error?null:data?.user;
 if(!user){$('hub-auth').hidden=false;return}
 $('session-user').textContent=user.email||'Personel';
 members=await get('erp_members','organization_id,role',q=>q.eq('user_id',user.id));
 if(!members.length){$('hub-auth').hidden=false;return}
 orgs=await get('erp_organizations','id,name',q=>q.in('id',members.map(m=>m.organization_id)));
 if(!orgs.length){$('hub-auth').hidden=false;return}
 org=orgs.some(x=>x.id===qs.get('org'))?qs.get('org'):orgs[0].id;
 const select=$('hub-org');
 select.replaceChildren(...orgs.map(o=>new Option(o.name,o.id)));select.value=org;
 $('hub-content').hidden=false;
 await refresh();
}
async function refresh(){
 role=members.find(m=>m.organization_id===org)?.role||'staff';settings();
 message('Veriler yükleniyor...');
 try{
  if(tab==='products'){
   catalog=await get('erp_catalog_products','id,organization_id,category,name,unit_price,description,active,updated_at',q=>q.eq('organization_id',org).order('category').order('name').limit(1000));
  }else{
   orders=await get('erp_orders','id,branch_id,order_number,customer_name,customer_phone,created_at,delivery_date,status,barcode_printed_at,total_amount,paid_amount',q=>q.eq('organization_id',org).order('created_at',{ascending:false}).limit(1000));
   if(tab==='workshop'){
    const stamped=orders.filter(o=>o.barcode_printed_at);
    items=stamped.length?await get('erp_order_items','id,order_id,product_name,category,width_cm,height_cm,barcode,status,production_note',q=>q.eq('organization_id',org).in('order_id',stamped.map(o=>o.id)).limit(1000)):[];
    branches=await get('erp_branches','id,name',q=>q.eq('organization_id',org));
   }
  }
  message('');render();
 }catch(e){message('Veriler yüklenemedi: '+e.message)}
}
function productRow(p){
 const row=el('div','hub-product-row');
 const info=el('div','hub-product-name');
 put(info,'strong','',p.name);
 if(p.description)put(info,'small','',p.description);
 row.append(info);
 put(row,'span','hub-price',fmt(p.unit_price));
 if(!p.active)put(row,'span','hub-pill dim','Arşivde');
 if(canEdit()&&p.active){
  const actions=el('div','hub-row-buttons');
  const edit=put(actions,'button','secondary','Düzenle');edit.type='button';edit.onclick=()=>openProduct(p);
  const remove=put(actions,'button','secondary hub-danger','Arşivle');remove.type='button';remove.onclick=()=>archiveProduct(p);
  row.append(actions);
 }
 return row;
}
function renderProducts(){
 const search=$('hub-search').value.trim().toLocaleLowerCase('tr-TR'),category=$('hub-category').value,showArchived=$('hub-archived').checked;
 const list=$('hub-list');list.replaceChildren();
 $('stat-a').textContent=categories.filter(c=>catalog.some(p=>p.category===c&&p.active)).length;
 $('stat-b').textContent=catalog.filter(p=>p.active).length;
 const filtered=catalog.filter(p=>(p.active||showArchived)&&(!category||p.category===category)&&(!search||(p.name+' '+p.description).toLocaleLowerCase('tr-TR').includes(search)));
 for(const cat of categories){
  const rows=filtered.filter(p=>p.category===cat);
  if(!rows.length&&category&&cat!==category)continue;
  const group=el('section','hub-group'),heading=el('button','hub-group-heading');
  heading.type='button';
  const left=el('span');put(left,'strong','',cat);put(left,'small','',rows.length+' ürün');
  heading.append(left,el('span','hub-arrow',expanded.has(cat)?'▾':'▸'));
  const contents=el('div','hub-group-content');contents.hidden=!expanded.has(cat);
  if(rows.length)rows.forEach(p=>contents.append(productRow(p)));else put(contents,'p','hub-muted','Bu kategoride ürün bulunmuyor.');
  heading.onclick=()=>{if(expanded.has(cat))expanded.delete(cat);else expanded.add(cat);renderProducts()};
  group.append(heading,contents);list.append(group);
 }
 if(!filtered.length)put(list,'p','hub-muted','Arama sonucunda ürün bulunamadı.');
}
function openProduct(p=null){
 if(!canEdit())return;
 productEditing=p?.id||null;
 $('product-modal-title').textContent=p?'Ürünü Düzenle':'Yeni Ürün Ekle';
 $('product-category').value=p?.category||categories[0];
 $('product-name').value=p?.name||'';
 $('product-price').value=p?.unit_price??0;
 $('product-description').value=p?.description||'';
 $('product-error').textContent='';
 $('product-modal').hidden=false;$('product-name').focus();
}
function closeProduct(){$('product-modal').hidden=true;productEditing=null}
async function saveProduct(e){
 e.preventDefault();if(working||!canEdit())return;
 const name=$('product-name').value.trim(),price=Number($('product-price').value);
 if(name.length<2||!Number.isFinite(price)||price<0){$('product-error').textContent='Ürün adı veya fiyat hatalı.';return}
 working=true;$('product-save').disabled=true;$('product-error').textContent='Kaydediliyor...';
 try{
  const {error}=await sb.rpc('erp_catalog_save',{p_org:org,p_category:$('product-category').value,p_name:name,p_unit_price:price,p_description:$('product-description').value.trim(),p_id:productEditing});
  if(error)throw error;
  const category=$('product-category').value;closeProduct();expanded.add(category);await refresh();message('Ürün kataloğa kaydedildi.');
 }catch(e){$('product-error').textContent='Ürün kaydedilemedi: '+e.message}
 finally{working=false;$('product-save').disabled=false}
}
async function archiveProduct(p){
 if(!canEdit()||!confirm(p.name+' ürünü arşive taşınsın mı? Mevcut siparişler etkilenmeyecek.'))return;
 const {error}=await sb.rpc('erp_catalog_archive',{p_org:org,p_id:p.id});
 if(error)message('Arşivlenemedi: '+error.message);else{await refresh();message('Ürün arşivlendi.')}
}
function renderWorkshop(){
 const list=$('hub-list');list.replaceChildren();
 const stamped=orders.filter(o=>o.barcode_printed_at&&o.status!=='cancelled');
 const search=$('hub-search').value.trim().toLocaleLowerCase('tr-TR');
 $('stat-a').textContent=stamped.length;
 $('stat-b').textContent=items.filter(i=>i.status==='workshop').length;
 const matching=stamped.filter(o=>{
  const related=items.filter(i=>i.order_id===o.id);
  return !search||[o.order_number,o.customer_name,o.customer_phone,...related.map(i=>i.product_name)].join(' ').toLocaleLowerCase('tr-TR').includes(search);
 });
 for(const order of matching){
  const card=el('section','hub-work-order');
  const header=el('div','hub-work-head');
  const title=el('div');put(title,'strong','','#'+order.order_number+' · '+order.customer_name);put(title,'small','','Barkod basıldı: '+trDate(order.barcode_printed_at)+' · '+(branches.find(b=>b.id===order.branch_id)?.name||'Şube'));
  header.append(title);
  const a=el('a','secondary hub-link','Siparişi Aç');a.href='./order-new.html?org='+encodeURIComponent(org)+'&edit='+encodeURIComponent(order.id);header.append(a);
  card.append(header);
  const rows=items.filter(i=>i.order_id===order.id);
  for(const item of rows){
   const row=el('div','hub-work-row');
   const i=el('div');put(i,'strong','',item.category+' · '+item.product_name);put(i,'small','',String(item.width_cm??'—')+' × '+String(item.height_cm??'—')+' cm · '+item.barcode);
   row.append(i);
   put(row,'span','hub-pill '+(item.status==='workshop'?'blue':item.status==='ready'?'green':'dim'),({processing:'İşlemde',workshop:'Atölyede',ready:'Teslime Hazır',delivered:'Teslim Edildi',cancelled:'İptal'})[item.status]||item.status);
   card.append(row);
  }
  list.append(card);
 }
 if(!matching.length)put(list,'p','hub-muted','Barkodu basılmış sipariş bulunamadı.');
}
function renderCustomers(){
 const list=$('hub-list');list.replaceChildren();
 const byCustomer=new Map();
 for(const o of orders.filter(o=>o.status!=='cancelled')){
  const name=(o.customer_name||'').trim(),phone=(o.customer_phone||'').replace(/\D/g,'');
  const key=phone||name.toLocaleLowerCase('tr-TR');
  if(!key)continue;
  if(!byCustomer.has(key))byCustomer.set(key,{name,phone:o.customer_phone,orders:[],amount:0,paid:0});
  const c=byCustomer.get(key);c.orders.push(o);c.amount+=Number(o.total_amount)||0;c.paid+=Number(o.paid_amount)||0;
 }
 const all=[...byCustomer.values()];
 $('stat-a').textContent=all.length;$('stat-b').textContent=orders.filter(o=>o.status!=='cancelled').length;
 const search=$('hub-search').value.trim().toLocaleLowerCase('tr-TR');
 for(const c of all.filter(c=>(c.name+' '+c.phone).toLocaleLowerCase('tr-TR').includes(search)).sort((a,b)=>a.name.localeCompare(b.name,'tr'))){
  const card=el('section','hub-customer');
  const h=el('div','hub-customer-head');
  const name=el('div');put(name,'strong','',c.name);put(name,'small','',c.phone||'Telefon yok');h.append(name);
  put(h,'span','hub-pill',c.orders.length+' sipariş');card.append(h);
  const summary=el('div','hub-customer-stats');
  put(summary,'span','','Toplam: '+fmt(c.amount));put(summary,'span','','Ödenen: '+fmt(c.paid));put(summary,'span','','Kalan: '+fmt(c.amount-c.paid));card.append(summary);
  const toggle=el('button','secondary','Sipariş Geçmişini Göster');toggle.type='button';
  const detail=el('div','hub-customer-detail');detail.hidden=true;
  for(const o of c.orders){
   const a=el('a','','#'+o.order_number+' · '+trDate(o.created_at)+' · '+fmt(o.total_amount));
   a.href='./order-new.html?org='+encodeURIComponent(org)+'&edit='+encodeURIComponent(o.id);detail.append(a);
  }
  toggle.onclick=()=>{detail.hidden=!detail.hidden;toggle.textContent=detail.hidden?'Sipariş Geçmişini Göster':'Geçmişi Gizle'};
  card.append(toggle,detail);list.append(card);
 }
 if(!list.children.length)put(list,'p','hub-muted','Müşteri kaydı bulunamadı. Bu ekran sipariş veren müşterilerden otomatik oluşur.');
}
function render(){if(tab==='products')renderProducts();else if(tab==='workshop')renderWorkshop();else renderCustomers()}
$('hub-org').onchange=async e=>{org=e.target.value;qs.set('org',org);history.replaceState(null,'',location.pathname+'?'+qs);expanded.clear();await refresh()};
$('hub-refresh').onclick=refresh;
$('hub-search').oninput=render;
$('hub-category').onchange=()=>{if($('hub-category').value)expanded.add($('hub-category').value);render()};
$('hub-archived').onchange=render;
$('product-add').onclick=()=>openProduct();
$('product-form').onsubmit=saveProduct;
$('product-close').onclick=$('product-cancel').onclick=closeProduct;
$('product-modal').addEventListener('click',e=>{if(e.target===$('product-modal'))closeProduct()});
$('logout').onclick=async()=>{await sb.auth.signOut();location.href='./'};
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeProduct()});
initialize().catch(e=>{message('Giriş yapılamadı: '+e.message);$('hub-auth').hidden=false});
})();