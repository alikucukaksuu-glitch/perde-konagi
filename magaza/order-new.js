(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co',KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.supabase?.createClient(API,KEY),$=id=>document.getElementById(id);
const categories=[{name:'TÜL PERDE',count:10},{name:'FON PERDE',count:5},{name:'GÜNEŞLİK',count:5},{name:'STOR PERDE',count:6,kind:'list'},{name:'AKSESUAR',count:6,kind:'list'}];
const fmt=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const asNum=v=>Number(v)||0;
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let user=null,org=null,branches=[],existingCustomers=[],products=new Map(),active=null,saving=false;
const key=(category,index)=>category+'|'+index;
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
function drawSlots(){
 const target=$('category-sections');target.replaceChildren();
 for(const group of categories){
  const section=document.createElement('section');section.className='category-section';
  const heading=document.createElement('div');heading.className='category-heading';
  const h=document.createElement('h3');h.textContent=group.name;
  const info=document.createElement('span');info.textContent=[...products.keys()].filter(k=>k.startsWith(group.name+'|')).reduce((a,k)=>a+products.get(k).qty,0)+' parça';
  heading.append(h,info);section.append(heading);
  const grid=document.createElement('div');grid.className=group.kind==='list'?'slot-list':'slot-grid';
  for(let i=0;i<group.count;i++){
   const value=products.get(key(group.name,i)),button=document.createElement('button');
   button.type='button';button.className='product-slot'+(value?' filled':'');
   button.dataset.category=group.name;button.dataset.slot=String(i);
   if(value){
    const title=document.createElement('strong');title.textContent=value.name;
    const detail=document.createElement('small');detail.textContent=(value.width||'—')+' × '+(value.height||'—')+' cm · '+value.qty+' adet';
    const price=document.createElement('small');price.textContent=fmt(value.price*value.qty);
    button.append(title,detail,price);
   }else{const add=document.createElement('span');add.className='slot-add';add.textContent=group.kind==='list'?(i+1)+'. + Ekle':'+ Ekle';button.append(add)}
   button.onclick=()=>openItem(group.name,i);grid.append(button);
  }
  section.append(grid);target.append(section);
 }
 updateMoney();
}
function openItem(category,index){
 active={category,index};
 const value=products.get(key(category,index));
 $('product-category-title').textContent=category+' · Kutucuk '+(index+1);
 $('product-dialog-title').textContent=value?'Ürünü Düzenle':'Yeni Ürün Ekle';
 $('product-form').reset();
 $('product-name').value=value?.name||'';
 $('product-width').value=value?.width??'';
 $('product-height').value=value?.height??'';
 $('product-price').value=value?.price??'';
 $('product-quantity').value=value?.qty??1;
 $('product-spec').value=value?.spec||'';
 $('product-note').value=value?.note||'';
 $('delete-product').hidden=!value;
 $('product-overlay').hidden=false;
 calculateItemTotal();
 $('product-name').focus();
}
function closeItem(){$('product-overlay').hidden=true;active=null}
function calculateItemTotal(){$('product-total').textContent=fmt(asNum($('product-price').value)*asNum($('product-quantity').value))}
function storeItem(e){
 e.preventDefault();
 const name=$('product-name').value.trim(),qty=Number($('product-quantity').value),price=Number($('product-price').value);
 const width=$('product-width').value,height=$('product-height').value;
 if(name.length<2||!Number.isInteger(qty)||qty<1||qty>20||!Number.isFinite(price)||price<0||price>99999999){alertText('Ürün adı, fiyatı veya adedi geçersiz.');return}
 if((width!==''&&(!Number.isFinite(Number(width))||Number(width)<0))||(height!==''&&(!Number.isFinite(Number(height))||Number(height)<0))){alertText('En ve boy negatif olamaz.');return}
 const record={name,qty,price,width,height,spec:$('product-spec').value.trim(),note:$('product-note').value.trim()};
 const totalBefore=[...products.values()].reduce((a,p)=>a+p.qty,0)-(products.get(key(active.category,active.index))?.qty||0);
 if(totalBefore+qty>60){alertText('Bir siparişte en fazla 60 fiziksel parça ekleyebilirsiniz.');return}
 products.set(key(active.category,active.index),record);closeItem();drawSlots();alertText('');
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
 }catch(e){$('auth-warning').hidden=false;alertText('Sipariş ekranı yüklenemedi: '+e.message)}
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
  const category=slot.split('|')[0],spec=p.spec,fullNote=[spec&&'Özellikler: '+spec,p.note].filter(Boolean).join('\n');
  for(let i=0;i<p.qty;i++)payload.push({category,product_name:p.name,width_cm:p.width||null,height_cm:p.height||null,unit_price:p.price,production_note:fullNote});
 }
 saving=true;$('submit-order').disabled=true;$('save-message').textContent='Kaydediliyor...';
 try{
  const {data,error}=await sb.rpc('erp_create_order_v2',{
   p_org:org.id,p_branch:$('store-select').value,p_customer:$('customer-name').value.trim(),
   p_phone:$('customer-phone').value.trim(),p_delivery:$('delivery-copy').value,
   p_note:$('note-copy').value.trim(),p_paid:v.paid,p_items:payload,
   p_order_type:$('type-copy').value,p_discount_percent:v.percent,
   p_discount_amount:v.fixed,p_payment_method:$('payment-method').value});
  if(error)throw error;
  location.replace('./?created='+encodeURIComponent(data));
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
$('delete-product').onclick=()=>{if(!active)return;products.delete(key(active.category,active.index));closeItem();drawSlots()};
$('product-shade').onclick=$('close-product').onclick=closeItem;
['product-price','product-quantity'].forEach(id=>$(id).oninput=calculateItemTotal);
['discount-percent','discount-amount','paid-value'].forEach(id=>$(id).oninput=updateMoney);
$('submit-order').onclick=submit;
$('order-logout').onclick=async()=>{await sb.auth.signOut();location.href='./'};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('product-overlay').hidden)closeItem()});
start();
})();