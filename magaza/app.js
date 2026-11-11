(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co';
const KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.supabase?.createClient(API,KEY);
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles={new:'Yeni Sipariş',workshop:'Atölyede',partial_ready:'Kısmi Hazır',ready:'Teslime Hazır',delivered:'Teslim Edildi',cancelled:'İptal'};
let user=null,organizations=[],branches=[],orders=[],items=[],org='',filterStatus='',lineSeq=0;
function show(id){['auth-panel','setup-panel','erp-panel'].forEach(n=>$(n).hidden=n!==id)}
function msg(id,message){$(id).textContent=message||''}
function dateTR(s){return s?new Date(s.length===10?s+'T12:00:00':s).toLocaleDateString('tr-TR'):'Belirtilmedi'}
function isAuthError(e){return /jwt|session|permission|not authorized|unauthorized/i.test(e?.message||'')}
async function fetchAll(table,select,query){
 let q=sb.from(table).select(select);
 if(query)q=query(q);
 const {data,error}=await q;
 if(error)throw error;
 return data||[];
}
async function initialize(){
 if(!sb){show('auth-panel');msg('login-message','Bağlantı kütüphanesi yüklenemedi. Sayfayı yenileyin.');return}
 const {data,error}=await sb.auth.getUser();
 user=error?null:data?.user;
 if(!user){show('auth-panel');return}
 $('session-user').textContent=user.email||'Oturum açık';
 $('logout').hidden=false;
 try{
  const members=await fetchAll('erp_members','organization_id,role',q=>q.eq('user_id',user.id));
  organizations=await fetchAll('erp_organizations','id,name',q=>q.in('id',members.map(m=>m.organization_id).length?members.map(m=>m.organization_id):['00000000-0000-0000-0000-000000000000']));
  if(!organizations.length){show('setup-panel');return}
  const valid=organizations.some(o=>o.id===org);
  org=valid?org:organizations[0].id;
  $('organization-select').replaceChildren();
  organizations.forEach(o=>{const opt=new Option(o.name,o.id);$('organization-select').add(opt)});
  $('organization-select').value=org;
  show('erp-panel');
  await load();
 }catch(e){show('auth-panel');msg('login-message','İşletme bilgileri yüklenemedi: '+e.message)}
}
async function load(){
 msg('orders-message','Siparişler yükleniyor...');
 try{
  branches=await fetchAll('erp_branches','id,name,organization_id',q=>q.eq('organization_id',org).order('name'));
  orders=await fetchAll('erp_orders','id,organization_id,branch_id,order_number,customer_name,customer_phone,delivery_date,status,customer_note,total_amount,paid_amount,created_at',q=>q.eq('organization_id',org).order('created_at',{ascending:false}).limit(250));
  items=orders.length?await fetchAll('erp_order_items','id,order_id,category,product_name,width_cm,height_cm,unit_price,production_note,status,barcode',q=>q.eq('organization_id',org).in('order_id',orders.map(x=>x.id))):[];
  const dropdown=$('filter-branch'),old=dropdown.value;
  dropdown.innerHTML='<option value="">Tüm Şubeler</option>';
  branches.forEach(b=>dropdown.add(new Option(b.name,b.id)));
  dropdown.value=branches.some(b=>b.id===old)?old:'';
  render();
  msg('orders-message',orders.length?'':'Henüz sipariş bulunmuyor. İlk siparişinizi oluşturabilirsiniz.');
 }catch(e){msg('orders-message','Sipariş verileri alınamadı: '+e.message)}
}
function branchName(id){return branches.find(b=>b.id===id)?.name||'Şube'}
function render(){
 $('stat-total').textContent=orders.length;
 $('stat-workshop').textContent=orders.filter(o=>o.status==='workshop'||o.status==='partial_ready').length;
 $('stat-ready').textContent=orders.filter(o=>o.status==='ready').length;
 $('stat-balance').textContent=money(orders.reduce((s,o)=>s+Number(o.total_amount)-Number(o.paid_amount),0));
 const text=$('filter-search').value.toLocaleLowerCase('tr-TR').trim();
 const branch=$('filter-branch').value,payment=$('filter-payment').value;
 const subset=orders.filter(o=>{
  if(filterStatus&&o.status!==filterStatus)return false;
  if(branch&&o.branch_id!==branch)return false;
  const remaining=Number(o.total_amount)-Number(o.paid_amount);
  if(payment==='paid'&&remaining>0)return false;
  if(payment==='unpaid'&&Number(o.paid_amount)>0)return false;
  if(payment==='partial'&&!(Number(o.paid_amount)>0&&remaining>0))return false;
  if(text&&!([o.customer_name,o.customer_phone,String(o.order_number),branchName(o.branch_id)].join(' ').toLocaleLowerCase('tr-TR').includes(text)))return false;
  return true;
 });
 $('orders-list').innerHTML=subset.map(o=>{
  const remaining=Number(o.total_amount)-Number(o.paid_amount);
  return '<article class="order card"><div class="order-head"><div><small>#'+escapeHtml(o.order_number)+' · '+escapeHtml(dateTR(o.created_at))+'</small><h3>'+escapeHtml(o.customer_name)+'</h3></div><span class="chip '+escapeHtml(o.status)+'">'+escapeHtml(titles[o.status]||o.status)+'</span></div><div class="order-meta"><span>⌂ '+escapeHtml(branchName(o.branch_id))+'</span><span>☎ '+escapeHtml(o.customer_phone||'Telefon belirtilmedi')+'</span><span>▣ '+items.filter(i=>i.order_id===o.id).length+' ürün</span><span>◷ Teslim '+escapeHtml(dateTR(o.delivery_date))+'</span></div><div class="money-grid"><div><small>Toplam</small><b>'+money(o.total_amount)+'</b></div><div><small>Ödenen</small><b>'+money(o.paid_amount)+'</b></div><div><small>Kalan</small><b class="'+(remaining>0?'debt':'')+'">'+money(remaining)+'</b></div></div><div class="order-buttons"><button type="button" class="secondary" data-detail="'+escapeHtml(o.id)+'">Siparişi Aç / Düzenle</button></div></article>';
 }).join('');
 if(!subset.length&&orders.length)msg('orders-message','Seçilen filtrelerde sipariş bulunamadı.');else if(orders.length)msg('orders-message','');
}
function addLine(){
 lineSeq++;
 const el=document.createElement('div');el.className='line-card';
 el.innerHTML='<div class="line-head"><b>Ürün #'+lineSeq+'</b><button type="button" class="remove-item">Kaldır</button></div>'+
 '<div class="three"><label>Kategori<select class="it-category"><option>TÜL PERDE</option><option>FON PERDE</option><option>GÜNEŞLİK</option><option>STOR PERDE</option><option>AKSESUAR</option></select></label><label>Ürün / Kumaş *<input class="it-name" required maxlength="200" placeholder="Örn. Bambu Tül Beyaz"></label><label>Birim Fiyat (₺)<input class="it-price" type="number" min="0" step=".01" required value="0"></label></div>'+
 '<div class="three"><label>En (cm)<input class="it-width" type="number" min="0" step=".01"></label><label>Boy (cm)<input class="it-height" type="number" min="0" step=".01"></label><label>Ürüne Özel Üretim Notu<textarea class="it-note" maxlength="1500" rows="2" placeholder="Bu ürünün barkodunda gösterilecek."></textarea></label></div>';
 el.querySelector('.remove-item').onclick=()=>{el.remove();calcTotal()};
 el.querySelector('.it-price').addEventListener('input',calcTotal);
 $('line-items').append(el);calcTotal();
}
function calcTotal(){
 const total=[...document.querySelectorAll('.it-price')].reduce((a,e)=>a+(Number(e.value)||0),0);
 $('draft-total').textContent=money(total);
}
function openEditor(){
 $('order-editor').hidden=false;
 $('order-form').reset();$('line-items').replaceChildren();lineSeq=0;
 $('order-branch').replaceChildren();
 branches.forEach(b=>$('order-branch').add(new Option(b.name,b.id)));
 addLine();msg('editor-message','');
}
async function saveOrder(e){
 e.preventDefault();
 const form=e.currentTarget;
 const cards=[...document.querySelectorAll('.line-card')];
 if(!cards.length){msg('editor-message','En az bir ürün ekleyin.');return}
 const products=cards.map(c=>({
  category:c.querySelector('.it-category').value,
  product_name:c.querySelector('.it-name').value.trim(),
  unit_price:Number(c.querySelector('.it-price').value),
  width_cm:c.querySelector('.it-width').value||null,
  height_cm:c.querySelector('.it-height').value||null,
  production_note:c.querySelector('.it-note').value.trim()
 }));
 if(products.some(p=>p.product_name.length<2||p.unit_price<0)){msg('editor-message','Ürün isimlerini ve fiyatlarını kontrol edin.');return}
 const total=products.reduce((s,p)=>s+p.unit_price,0);
 const fd=new FormData(form),paid=Number(fd.get('paid_amount')||0);
 if(!Number.isFinite(paid)||paid<0||paid>total){msg('editor-message','Kapora toplam tutarı aşamaz.');return}
 const save=$('save-order');save.disabled=true;msg('editor-message','Sipariş kaydediliyor...');
 try{
  const {data,error}=await sb.rpc('erp_create_order',{p_org:org,p_branch:fd.get('branch_id'),p_customer:fd.get('customer_name'),p_phone:fd.get('customer_phone'),p_delivery:fd.get('delivery_date')||null,p_note:fd.get('customer_note'),p_paid:paid,p_items:products});
  if(error)throw error;
  $('order-editor').hidden=true;
  await load();
  if(data)openDetail(data);
 }catch(err){msg('editor-message','Sipariş kaydedilemedi: '+err.message)}
 finally{save.disabled=false}
}
function openDetail(id){
 const o=orders.find(x=>x.id===id);if(!o)return;
 const rows=items.filter(x=>x.order_id===id);
 const list=rows.map((i,index)=>'<div class="item-box"><b>'+(index+1)+'. '+escapeHtml(i.category)+' · '+escapeHtml(i.product_name)+'</b><p>En: '+escapeHtml(i.width_cm??'—')+' cm · Boy: '+escapeHtml(i.height_cm??'—')+' cm · Fiyat: '+money(i.unit_price)+'</p><p><strong>Üretim notu:</strong> '+escapeHtml(i.production_note||'—')+'</p><span class="barcode">Barkod: '+escapeHtml(i.barcode)+'</span><span class="chip '+escapeHtml(i.status)+'">'+escapeHtml(i.status==='ready'?'Mağazada · Teslime Hazır':'Atölyede')+'</span></div>').join('');
 $('detail-body').innerHTML='<div class="detail-body"><div class="detail-row"><span>Sipariş No</span><b>#'+escapeHtml(o.order_number)+'</b></div><div class="detail-row"><span>Müşteri</span><b>'+escapeHtml(o.customer_name)+'</b></div><div class="detail-row"><span>Şube</span><b>'+escapeHtml(branchName(o.branch_id))+'</b></div><div class="detail-row"><span>Teslim Tarihi</span><b>'+escapeHtml(dateTR(o.delivery_date))+'</b></div><div class="detail-row"><span>Genel Sipariş Notu (A4 ve barkodlarda)</span><b>'+escapeHtml(o.customer_note||'—')+'</b></div><div class="item-section"><h3>Ürün Kutucukları</h3>'+list+'</div><div class="money-grid"><div><small>Toplam</small><b>'+money(o.total_amount)+'</b></div><div><small>Ödenen</small><b>'+money(o.paid_amount)+'</b></div><div><small>Kalan</small><b>'+money(Number(o.total_amount)-Number(o.paid_amount))+'</b></div></div><div class="detail-buttons"><button type="button" id="print-a4" class="secondary">A4 Müşteri Çıktısı (yakında)</button><button type="button" id="print-barcode" class="secondary">Barkod Yazdır (yakında)</button></div><p class="fine">A4 formunun onaylanan düzeni korunacak. Barkod okutma ve mağazaya kabul sonraki geliştirme aşamasıdır.</p></div>';
 $('print-a4').disabled=true;$('print-barcode').disabled=true;
 $('order-detail').hidden=false;
}
function exportCSV(){
 const header=['Sipariş','Müşteri','Telefon','Şube','Durum','Teslim','Toplam','Ödenen','Kalan','Not'];
 const rows=orders.map(o=>[o.order_number,o.customer_name,o.customer_phone,branchName(o.branch_id),titles[o.status],o.delivery_date,o.total_amount,o.paid_amount,Number(o.total_amount)-Number(o.paid_amount),o.customer_note]);
 const escapeCSV=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const csv='\uFEFF'+[header,...rows].map(r=>r.map(escapeCSV).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='konak-erp-siparisler.csv';a.click();URL.revokeObjectURL(url);
}
function handlers(){
 $('login-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);msg('login-message','Giriş yapılıyor...');const {error}=await sb.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});if(error)msg('login-message',error.message);else{msg('login-message','');await initialize()}};
 $('logout').onclick=async()=>{await sb.auth.signOut();user=null;org='';$('logout').hidden=true;$('session-user').textContent='';show('auth-panel')};
 $('setup-form').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,f=new FormData(form);msg('setup-message','İşletme oluşturuluyor...');const {error}=await sb.rpc('erp_create_organization',{p_name:f.get('organization'),p_branch:f.get('branch')});if(error)msg('setup-message','Oluşturulamadı: '+error.message);else{msg('setup-message','');await initialize()}};
 $('organization-select').onchange=async e=>{org=e.target.value;await load()};
 $('refresh').onclick=load;
 $('filter-search').oninput=render;$('filter-branch').onchange=render;$('filter-payment').onchange=render;
 $('status-filters').onclick=e=>{const b=e.target.closest('button[data-status]');if(!b)return;filterStatus=b.dataset.status;document.querySelectorAll('#status-filters button').forEach(x=>x.classList.toggle('active',x===b));render()};
 $('new-order').onclick=()=>{location.href='./order-new.html?org='+encodeURIComponent(org)};$('close-editor').onclick=$('cancel-editor').onclick=()=>$('order-editor').hidden=true;
 $('close-detail').onclick=()=>$('order-detail').hidden=true;
 $('add-item').onclick=addLine;
 $('order-form').onsubmit=saveOrder;
 $('orders-list').onclick=e=>{const button=e.target.closest('[data-detail]');if(button)openDetail(button.dataset.detail)};
 $('export-csv').onclick=exportCSV;
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('order-editor').hidden=true;$('order-detail').hidden=true}});
}
if(!sb){show('auth-panel');msg('login-message','Supabase bağlantı kütüphanesi yüklenemedi.');return}
handlers();initialize();
})();