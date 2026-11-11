(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co';
const KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.supabase?.createClient(API,KEY);
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles={new:'İşlemde',processing:'İşlemde',waiting:'Beklemede',workshop:'Atölyede',partial_ready:'Kısmi Hazır',ready:'Teslime Hazır',delivered:'Teslim Edildi',cancelled:'İptal'};
let user=null,organizations=[],branches=[],orders=[],items=[],org='',filterStatus='',lineSeq=0,expandedOrders=new Set(),memberRole='staff';
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
  window.__erpMembers=members;
  organizations=await fetchAll('erp_organizations','id,name',q=>q.in('id',members.map(m=>m.organization_id).length?members.map(m=>m.organization_id):['00000000-0000-0000-0000-000000000000']));
  if(!organizations.length){show('setup-panel');return}
  const valid=organizations.some(o=>o.id===org);
  org=valid?org:organizations[0].id;
  memberRole=window.__erpMembers.find(m=>m.organization_id===org)?.role||'staff';
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
  orders=await fetchAll('erp_orders','id,organization_id,branch_id,order_number,customer_name,customer_phone,delivery_date,status,customer_note,total_amount,paid_amount,created_at,subtotal_amount,discount_percent,discount_amount,payment_method,waiting_reason,barcode_printed_at',q=>q.eq('organization_id',org).order('created_at',{ascending:false}).limit(250));
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
 $('stat-total').textContent=orders.filter(o=>o.status!=='cancelled').length;
 $('stat-workshop').textContent=orders.filter(o=>o.status==='workshop'||o.status==='partial_ready').length;
 $('stat-ready').textContent=orders.filter(o=>o.status==='ready').length;
 $('stat-balance').textContent=money(orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+Number(o.total_amount)-Number(o.paid_amount),0));
 const text=$('filter-search').value.toLocaleLowerCase('tr-TR').trim();
 const branch=$('filter-branch').value,payment=$('filter-payment').value;
 const subset=orders.filter(o=>{
  if(filterStatus&&o.status!==filterStatus)return false;
  if(!filterStatus&&o.status==='cancelled')return false;
  if(branch&&o.branch_id!==branch)return false;
  const remaining=Number(o.total_amount)-Number(o.paid_amount);
  if(payment==='paid'&&remaining>0)return false;
  if(payment==='unpaid'&&Number(o.paid_amount)>0)return false;
  if(payment==='partial'&&!(Number(o.paid_amount)>0&&remaining>0))return false;
  if(text&&!([o.customer_name,o.customer_phone,String(o.order_number),branchName(o.branch_id)].join(' ').toLocaleLowerCase('tr-TR').includes(text)))return false;
  return true;
 });
 $('orders-list').innerHTML=subset.map(o=>{
  const rows=items.filter(i=>i.order_id===o.id);
  const remaining=Number(o.total_amount)-Number(o.paid_amount);
  const base=Number(o.subtotal_amount)||Number(o.total_amount);
  const discount=Math.max(0,base-Number(o.total_amount));
  const expanded=expandedOrders.has(o.id);
  const status=escapeHtml(titles[o.status]||o.status);
  const orderItems=rows.map((item,index)=>'<div class="compact-item"><span class="compact-item-number">'+(index+1)+'</span><div><b>'+escapeHtml(item.category)+' · '+escapeHtml(item.product_name)+'</b><small>En '+escapeHtml(item.width_cm??'—')+' × Boy '+escapeHtml(item.height_cm??'—')+' cm · '+money(item.unit_price)+'</small><small>Üretim Notu: '+escapeHtml(item.production_note||'—')+'</small></div><span class="chip '+escapeHtml(item.status)+'">'+escapeHtml(titles[item.status]||item.status||'İşlemde')+'</span></div>').join('');
  return '<article class="order card order-compact" id="order-'+escapeHtml(o.id)+'">'+
  '<div class="compact-main"><div class="compact-info">'+
   '<div class="compact-title"><span class="compact-number">'+escapeHtml(o.order_number)+'</span><h3>'+escapeHtml(o.customer_name)+'</h3><span class="chip '+escapeHtml(o.status)+'">'+status+'</span></div>'+
   '<div class="compact-person"><div><small>MÜŞTERİ</small><strong>'+escapeHtml(o.customer_name)+'</strong></div><div><small>TELEFON</small><strong>'+escapeHtml(o.customer_phone||'—')+'</strong></div></div>'+
   '<div class="compact-person"><div class="compact-date"><small>TESLİM TARİHİ</small><strong>'+escapeHtml(dateTR(o.delivery_date))+'</strong></div><div><small>SİPARİŞ TARİHİ</small><strong>'+escapeHtml(dateTR(o.created_at))+'</strong></div></div>'+
   '<div class="compact-branch">'+escapeHtml(branchName(o.branch_id))+' · '+rows.length+' ürün</div>'+
  '</div><div class="compact-right"><div class="compact-money">'+
   '<div><small>G.TOPLAM</small><strong>'+money(base)+'</strong></div>'+
   '<div><small>İskonto</small><strong>'+money(discount)+'</strong></div>'+
   '<div><small>Ödenen</small><strong>'+money(o.paid_amount)+'</strong></div>'+
   '<div><small>Kalan</small><strong class="'+(remaining>0?'debt':'')+'">'+money(remaining)+'</strong></div>'+
  '</div><div class="compact-actions">'+
   '<button class="secondary" type="button" data-print-a4="'+escapeHtml(o.id)+'">▣ A4 Yazdır</button>'+ 
   '<button class="secondary" type="button" data-print-label="'+escapeHtml(o.id)+'" '+(o.barcode_printed_at||!['processing','new'].includes(o.status)?'disabled title="Barkod yalnızca İşlemde iken bir kez basılabilir"':'')+'>▥ Barkod Yazdır</button>'+
   '<button class="secondary" type="button" data-edit="'+escapeHtml(o.id)+'">✎ Önizleme / Düzenle</button>'+
   '<button class="secondary" type="button" data-payment="'+escapeHtml(o.id)+'" '+(remaining<=0||o.status==='cancelled'?'disabled':'')+'>◷ Ödeme Ekle</button>'+
   '<button class="secondary compact-delete" type="button" data-delete="'+escapeHtml(o.id)+'" '+(!['owner','manager'].includes(memberRole)||['cancelled','ready','partial_ready','delivered'].includes(o.status)?'disabled title="Silme yetkisi yöneticidedir; teslim aşamasındaki siparişler silinemez"':'')+'>▤ Sil</button>'+
  '</div></div></div>'+
  ((o.status==='processing'||o.status==='new')?
   '<div class="waiting-controls"><button type="button" class="secondary waiting-open" data-wait="'+escapeHtml(o.id)+'">⏸ Beklemeye Al</button><div class="wait-form" id="wait-form-'+escapeHtml(o.id)+'" hidden><label>Bekleme nedeni *<textarea id="wait-reason-'+escapeHtml(o.id)+'" maxlength="1500" rows="2" placeholder="Örn. Müşteriden ölçü bilgisi bekleniyor."></textarea></label><div class="wait-buttons"><button type="button" class="secondary" data-cancel-wait="'+escapeHtml(o.id)+'">Vazgeç</button><button type="button" class="primary" data-confirm-wait="'+escapeHtml(o.id)+'">Beklemeye Al</button></div></div></div>':
   o.status==='waiting'?
   '<div class="waiting-controls is-waiting"><div class="wait-current"><b>⏸ Müşteriden Bilgi Bekleniyor</b><p>'+escapeHtml(o.waiting_reason||'Bekleme nedeni belirtilmedi')+'</p></div><button type="button" class="primary" data-resume="'+escapeHtml(o.id)+'">▶ Tekrar İşleme Al</button></div>':'')+
  '<button type="button" class="compact-expand" data-expand="'+escapeHtml(o.id)+'" aria-expanded="'+expanded+'"><span>'+(expanded?'⌃ Detayı Gizle':'⌄ Detayı Göster')+'</span></button>'+
  (expanded?'<div class="compact-expanded"><div class="compact-expanded-head"><b>Ürünler ('+rows.length+')</b><span>'+status+'</span></div>'+orderItems+'<div class="compact-order-note"><b>Genel Sipariş Notu</b><p>'+escapeHtml(o.customer_note||'Not girilmemiş.')+'</p></div><div class="compact-audit"><b>Değişiklik Geçmişi</b><div id="audit-'+escapeHtml(o.id)+'" class="audit-list">Yükleniyor...</div></div></div>':'')+
  '</article>';
 }).join('');
 if(!subset.length&&orders.length)msg('orders-message','Seçilen filtrelerde sipariş bulunamadı.');else if(orders.length)msg('orders-message','');
}
const auditLabels={waiting_reason:'Bekleme Nedeni',customer_name:'Müşteri Adı',customer_phone:'Telefon',delivery_date:'Teslim Tarihi',customer_note:'Sipariş Notu',branch_id:'Şube',order_type:'Sipariş Tipi',payment_method:'Ödeme Şekli',total_amount:'Genel Toplam',subtotal_amount:'Ara Toplam',discount_percent:'İskonto %',discount_amount:'İskonto ₺',paid_amount:'Ödenen Tutar',status:'Sipariş Durumu',category:'Kategori',product_name:'Ürün',width_cm:'En',height_cm:'Boy',unit_price:'Ürün Fiyatı',production_note:'Üretim Notu'};
const ignoredAuditFields=new Set(['updated_at','created_at','id','order_id','organization_id','created_by','barcode','arrived_at','arrived_by','quantity','slot_key']);
function auditValue(field,value){
 if(value===null||value===undefined||value==='')return '—';
 if(field==='branch_id')return branchName(value);
 if(['subtotal_amount','total_amount','paid_amount','discount_amount','unit_price'].includes(field))return money(value);
 if(field==='status')return titles[value]||value;
 if(field==='delivery_date')return dateTR(value);
 return String(value);
}
async function loadHistory(orderId){
 const target=$('audit-'+orderId);if(!target)return;
 try{
  const [{data:records,error:logError},{data:team,error:teamError}]=await Promise.all([
   sb.from('erp_order_audit').select('id,action,actor_id,changed_at,old_data,new_data,item_id').eq('organization_id',org).eq('order_id',orderId).order('changed_at',{ascending:false}).order('id',{ascending:false}).limit(100),
   sb.rpc('erp_list_team',{p_org:org})
  ]);
  if(logError)throw logError;
  const names=new Map((teamError?[]:team||[]).map(x=>[x.user_id,x.email]));
  if(!records?.length){target.textContent='Bu sipariş için henüz kayıtlı bir değişiklik bulunmuyor. Geçmiş kayıtlar sistem etkinleştirildikten sonra tutulur.';return}
  target.replaceChildren();
  for(const record of records){
   const prev=record.old_data||{},next=record.new_data||{};
   const fields=Object.keys({...prev,...next}).filter(k=>!ignoredAuditFields.has(k)&&JSON.stringify(prev[k]??null)!==JSON.stringify(next[k]??null));
   const wrapper=document.createElement('div');wrapper.className='audit-entry';
   const heading=document.createElement('div');heading.className='audit-heading';
   const when=new Date(record.changed_at).toLocaleString('tr-TR');
   const who=names.get(record.actor_id)||('Kullanıcı '+String(record.actor_id||'bilinmiyor').slice(0,8));
   const type=record.action==='item_insert'?'Yeni ürün eklendi':record.action==='item_delete'?'Ürün kaldırıldı':record.action==='order_insert'?'Sipariş oluşturuldu':'Düzenleme yapıldı';
   heading.textContent=who+' · '+when+' · '+type;wrapper.append(heading);
   const body=document.createElement('div');body.className='audit-changes';
   if(fields.length===0){body.textContent='Ürün veya sipariş kaydı güncellendi.'}
   else for(const field of fields){
    const line=document.createElement('div');line.className='audit-change';
    const label=document.createElement('strong');label.textContent=auditLabels[field]||field;
    const detail=document.createElement('span');
    if(record.action.endsWith('insert'))detail.textContent=auditValue(field,next[field]);
    else if(record.action.endsWith('delete'))detail.textContent=auditValue(field,prev[field])+' (kaldırıldı)';
    else detail.textContent=auditValue(field,prev[field])+' → '+auditValue(field,next[field]);
    line.append(label,detail);body.append(line);
   }
   wrapper.append(body);target.append(wrapper);
  }
 }catch(e){target.textContent='Değişiklik geçmişi alınamadı: '+e.message}
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
 const list=rows.map((i,index)=>'<div class="item-box"><b>'+(index+1)+'. '+escapeHtml(i.category)+' · '+escapeHtml(i.product_name)+'</b><p>En: '+escapeHtml(i.width_cm??'—')+' cm · Boy: '+escapeHtml(i.height_cm??'—')+' cm · Fiyat: '+money(i.unit_price)+'</p><p><strong>Üretim notu:</strong> '+escapeHtml(i.production_note||'—')+'</p><span class="barcode">Barkod: '+escapeHtml(i.barcode)+'</span><span class="chip '+escapeHtml(i.status)+'">'+escapeHtml(titles[i.status]||i.status||'İşlemde')+'</span></div>').join('');
 $('detail-body').innerHTML='<div class="detail-body"><div class="detail-row"><span>Sipariş No</span><b>#'+escapeHtml(o.order_number)+'</b></div><div class="detail-row"><span>Müşteri</span><b>'+escapeHtml(o.customer_name)+'</b></div><div class="detail-row"><span>Şube</span><b>'+escapeHtml(branchName(o.branch_id))+'</b></div><div class="detail-row"><span>Teslim Tarihi</span><b>'+escapeHtml(dateTR(o.delivery_date))+'</b></div><div class="detail-row"><span>Genel Sipariş Notu (A4 ve barkodlarda)</span><b>'+escapeHtml(o.customer_note||'—')+'</b></div><div class="item-section"><h3>Ürün Kutucukları</h3>'+list+'</div><div class="money-grid"><div><small>Toplam</small><b>'+money(o.total_amount)+'</b></div><div><small>Ödenen</small><b>'+money(o.paid_amount)+'</b></div><div><small>Kalan</small><b>'+money(Number(o.total_amount)-Number(o.paid_amount))+'</b></div></div><div class="detail-buttons"><button type="button" id="print-a4" class="secondary">A4 Müşteri Çıktısı</button><button type="button" id="print-barcode" class="secondary">Barkod Yazdır</button></div><p class="fine">Barkod baskısı onaylandığında sipariş Atölyede durumuna alınır. Mağaza barkod okuma modülü ayrı aşamadadır.</p></div>';
 $('print-a4').onclick=()=>openPrint(id,'a4');$('print-barcode').onclick=()=>openPrint(id,'label');
 $('order-detail').hidden=false;
}
function openPrint(id,type){
 const o=orders.find(x=>x.id===id);
 if(!o)return;
 const url='./print.html?type='+encodeURIComponent(type)+'&org='+encodeURIComponent(org)+'&id='+encodeURIComponent(id);
 const win=window.open(url,'_blank','noopener');
 if(!win)location.href=url;
}
let paymentOrderId=null,paymentSubmitting=false;
function closePayment(){$('payment-modal').hidden=true;paymentOrderId=null;}
function addPayment(id){
 const o=orders.find(x=>x.id===id);if(!o)return;
 const remaining=Math.round((Number(o.total_amount)-Number(o.paid_amount))*100)/100;
 if(remaining<=0){msg('orders-message','Bu siparişin kalan borcu yok.');return}
 paymentOrderId=id;
 $('payment-total').textContent=money(o.total_amount);
 $('payment-paid').textContent=money(o.paid_amount);
 $('payment-remaining').textContent=money(remaining);
 $('payment-amount').value='';$('payment-amount').max=String(remaining);
 $('payment-method-input').value='cash';$('payment-note').value='';
 $('payment-message').textContent='';
 $('payment-modal').hidden=false;$('payment-amount').focus();
}
async function savePayment(e){
 e.preventDefault();
 if(paymentSubmitting||!paymentOrderId)return;
 const o=orders.find(x=>x.id===paymentOrderId);
 if(!o)return;
 const remaining=Math.round((Number(o.total_amount)-Number(o.paid_amount))*100)/100;
 const value=Number($('payment-amount').value),method=$('payment-method-input').value,note=$('payment-note').value.trim();
 if(!Number.isFinite(value)||value<=0||value>remaining){$('payment-message').textContent='Tutar kalan borcu aşamaz.';return}
 paymentSubmitting=true;$('payment-submit').disabled=true;$('payment-message').textContent='Ödeme kaydediliyor...';
 try{
  const {error}=await sb.rpc('erp_add_payment',{p_org:org,p_order:paymentOrderId,p_amount:value,p_method:method,p_note:note});
  if(error)throw error;
  closePayment();await load();msg('orders-message',money(value)+' tahsilat başarıyla kaydedildi.');
 }catch(err){$('payment-message').textContent='Ödeme kaydedilemedi: '+err.message}
 finally{paymentSubmitting=false;$('payment-submit').disabled=false}
}
async function archiveOrder(id){
 const o=orders.find(x=>x.id===id);if(!o)return;
 if(!['owner','manager'].includes(memberRole)){msg('orders-message','Yalnızca işletme yöneticisi siparişi silebilir.');return}
 const reason=prompt('#'+o.order_number+' siparişi Silinenler bölümüne taşınacak. Silme nedenini yazın:','');
 if(reason===null)return;
 if(reason.trim().length<5){msg('orders-message','Silme nedeni en az 5 karakter olmalı.');return}
 if(!confirm('#'+o.order_number+' siparişini Silinenler bölümüne taşımak istediğinize emin misiniz? Tahsilat kayıtları korunur, otomatik ödeme iadesi yapılmaz.'))return;
 msg('orders-message','Sipariş siliniyor...');
 const {error}=await sb.rpc('erp_cancel_order',{p_org:org,p_order:id,p_reason:reason.trim()});
 if(error){msg('orders-message','Sipariş silinemedi: '+error.message);return}
 await load();msg('orders-message','Sipariş Silinenler bölümüne taşındı; değişiklik geçmişi korundu.');
}
function exportCSV(){
 const header=['Sipariş','Müşteri','Telefon','Şube','Durum','Teslim','Toplam','Ödenen','Kalan','Not'];
 const rows=orders.map(o=>[o.order_number,o.customer_name,o.customer_phone,branchName(o.branch_id),titles[o.status],o.delivery_date,o.total_amount,o.paid_amount,Number(o.total_amount)-Number(o.paid_amount),o.customer_note]);
 const escapeCSV=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const csv='\uFEFF'+[header,...rows].map(r=>r.map(escapeCSV).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='konak-erp-siparisler.csv';a.click();URL.revokeObjectURL(url);
}
let qrScanner=null,qrNavigating=false,qrStarting=false;
function qrMessage(value){$('qr-scan-message').textContent=value||''}
function validateQrText(raw){
 let url;
 try{url=new URL(String(raw||'').trim())}catch(e){throw Error('QR içeriği geçerli bir bağlantı değil.')}
 if(url.protocol!=='https:'||!['perdekonagi.com','www.perdekonagi.com'].includes(url.hostname)||!/^\/magaza\/receive\.html$/.test(url.pathname))throw Error('Bu QR KONAK ERP ürün kabul kodu değil.');
 const token=url.searchParams.get('t');
 if(token){if(!/^[0-9a-f]{24}$/i.test(token))throw Error('QR kodu geçersiz');return './receive.html?t='+encodeURIComponent(token)}
 const qrOrg=url.searchParams.get('org'),item=url.searchParams.get('item'),code=url.searchParams.get('code');
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(!uuid.test(qrOrg||'')||!uuid.test(item||'')||!code||code.length>128)throw Error('QR kodunun ürün bilgileri eksik.');
 if(qrOrg!==org)throw Error('QR başka bir işletmeye ait. İşletmeyi değiştirip yeniden deneyin.');
 return './receive.html?org='+encodeURIComponent(qrOrg)+'&item='+encodeURIComponent(item)+'&code='+encodeURIComponent(code);
}
async function stopQr(){
 const current=qrScanner;qrScanner=null;
 if(current){
  try{await current.stop()}catch(e){}
  try{current.clear()}catch(e){}
 }
}
async function closeQr(){
 $('qr-scan-modal').hidden=true;
 qrStarting=false;
 await stopQr();
}
async function onQrRead(raw){
 if(qrNavigating)return;
 let destination;
 try{destination=validateQrText(raw)}
 catch(e){qrMessage(e.message);return}
 qrNavigating=true;qrMessage('Kod okundu, ürün kabul ekranına geçiliyor...');
 await stopQr();
 location.href=destination;
}
async function openQr(){
 if(!user||!org){msg('orders-message','Önce işletme hesabıyla giriş yapın.');return}
 if(!$('qr-scan-modal').hidden)return;
 qrNavigating=false;$('qr-paste').value='';qrMessage('Kamera başlatılıyor...');
 $('qr-scan-modal').hidden=false;
 if(!window.Html5Qrcode){qrMessage('Kamera okuyucusu yüklenemedi. QR bağlantısını aşağıya yapıştırabilirsiniz.');return}
 qrStarting=true;
 try{
  const scanner=new window.Html5Qrcode('qr-camera',{formatsToSupport:[window.Html5QrcodeSupportedFormats.QR_CODE],verbose:false});
  qrScanner=scanner;
  await scanner.start({facingMode:'environment'},{fps:10,qrbox:(w,h)=>({width:Math.min(260,w-24),height:Math.min(260,h-24)}),aspectRatio:1},onQrRead,()=>{});
  if($('qr-scan-modal').hidden||qrScanner!==scanner){await stopQr();return}
  qrMessage('Kamerayı ürün etiketindeki QR koduna tutun.');
 }catch(e){qrMessage('Kameraya erişilemedi. Kamera iznini kontrol edin veya QR bağlantısını yapıştırın.');await stopQr()}
 finally{qrStarting=false}
}
function handlers(){
 $('login-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);msg('login-message','Giriş yapılıyor...');const {error}=await sb.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});if(error)msg('login-message',error.message);else{msg('login-message','');await initialize()}};
 $('logout').onclick=async()=>{await sb.auth.signOut();user=null;org='';$('logout').hidden=true;$('session-user').textContent='';show('auth-panel')};
 $('setup-form').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,f=new FormData(form);msg('setup-message','İşletme oluşturuluyor...');const {error}=await sb.rpc('erp_create_organization',{p_name:f.get('organization'),p_branch:f.get('branch')});if(error)msg('setup-message','Oluşturulamadı: '+error.message);else{msg('setup-message','');await initialize()}};
 $('organization-select').onchange=async e=>{org=e.target.value;memberRole=window.__erpMembers?.find(m=>m.organization_id===org)?.role||'staff';await load()};
 $('refresh').onclick=load;
 $('scan-qr').onclick=openQr;
 $('qr-scan-close').onclick=$('qr-scan-stop').onclick=closeQr;
 $('qr-scan-modal').addEventListener('click',e=>{if(e.target===$('qr-scan-modal'))closeQr()});
 $('qr-paste-open').onclick=()=>onQrRead($('qr-paste').value);

 $('filter-search').oninput=render;$('filter-branch').onchange=render;$('filter-payment').onchange=render;
 $('status-filters').onclick=e=>{const b=e.target.closest('button[data-status]');if(!b)return;filterStatus=b.dataset.status;document.querySelectorAll('#status-filters button').forEach(x=>x.classList.toggle('active',x===b));render()};
 $('new-order').onclick=()=>{location.href='./order-new.html?org='+encodeURIComponent(org)};$('close-editor').onclick=$('cancel-editor').onclick=()=>$('order-editor').hidden=true;
 $('close-detail').onclick=()=>$('order-detail').hidden=true;
 $('add-item').onclick=addLine;
 $('order-form').onsubmit=saveOrder;
 async function setWaiting(orderId,action){
 const order=orders.find(o=>o.id===orderId);if(!order)return;
 const reason=action==='wait'?$('wait-reason-'+orderId)?.value.trim():null;
 if(action==='wait'&&(!reason||reason.length<3)){
  msg('orders-message','Bekleme nedenini en az 3 karakter olarak yazın.');return;
 }
 const button=document.querySelector('[data-'+(action==='wait'?'confirm-wait':'resume')+'="'+orderId+'"]');
 if(button)button.disabled=true;
 msg('orders-message','Durum güncelleniyor...');
 try{
  const {error}=await sb.rpc('erp_set_order_waiting',{p_order_id:orderId,p_org:org,p_action:action,p_reason:reason});
  if(error)throw error;
  await load();
  msg('orders-message',action==='wait'?'Sipariş Beklemede durumuna alındı.':'Sipariş yeniden İşlemde durumuna alındı.');
 }catch(err){msg('orders-message','Durum değiştirilemedi: '+err.message)}
 finally{if(button?.isConnected)button.disabled=false}
}
$('orders-list').onclick=e=>{
 const wait=e.target.closest('[data-wait]');
 if(wait){const f=$('wait-form-'+wait.dataset.wait);if(f){f.hidden=false;f.querySelector('textarea')?.focus();}return;}
 const cancel=e.target.closest('[data-cancel-wait]');
 if(cancel){$('wait-form-'+cancel.dataset.cancelWait).hidden=true;return;}
 const confirmWait=e.target.closest('[data-confirm-wait]');
 if(confirmWait){setWaiting(confirmWait.dataset.confirmWait,'wait');return;}
 const resume=e.target.closest('[data-resume]');
 if(resume){setWaiting(resume.dataset.resume,'resume');return;}
 const printA4=e.target.closest('[data-print-a4]');if(printA4){openPrint(printA4.dataset.printA4,'a4');return;}
 const printLabel=e.target.closest('[data-print-label]');if(printLabel){openPrint(printLabel.dataset.printLabel,'label');return;}
 const payment=e.target.closest('[data-payment]');if(payment){addPayment(payment.dataset.payment);return;}
 const deletion=e.target.closest('[data-delete]');if(deletion){archiveOrder(deletion.dataset.delete);return;}
 const expand=e.target.closest('[data-expand]');if(expand){const id=expand.dataset.expand;if(expandedOrders.has(id))expandedOrders.delete(id);else expandedOrders.add(id);render();if(expandedOrders.has(id))loadHistory(id);return}const edit=e.target.closest('[data-edit]');if(edit){location.href='./order-new.html?org='+encodeURIComponent(org)+'&edit='+encodeURIComponent(edit.dataset.edit);return}const button=e.target.closest('[data-detail]');if(button)openDetail(button.dataset.detail)};
 $('payment-form').onsubmit=savePayment;
 $('payment-close').onclick=$('payment-cancel').onclick=closePayment;
 $('payment-modal').addEventListener('click',e=>{if(e.target===$('payment-modal'))closePayment()});
 $('export-csv').onclick=exportCSV;
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('order-editor').hidden=true;$('order-detail').hidden=true;closePayment();if(!$('qr-scan-modal').hidden)closeQr()}});
}
if(!sb){show('auth-panel');msg('login-message','Supabase bağlantı kütüphanesi yüklenemedi.');return}
handlers();initialize();
})();