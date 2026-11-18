(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co',KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.__konakErpClient||(window.__konakErpClient=window.supabase?.createClient(API,KEY));
const $=id=>document.getElementById(id),fmt=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(+n||0),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={draft:'Taslak',pending:'Onay Bekliyor',approved:'Onaylandı',rejected:'Reddedildi'};
const cats=['TÜL PERDE','FON PERDE','GÜNEŞLİK','STOR PERDE','AKSESUAR','PLİSE PERDE','AHŞAP JALUZİ'];
let org='',orgs=[],branches=[],quotes=[],editing=null,user=null,role='staff',saving=false;
function msg(t){$('quote-message').textContent=t||''}
function formMsg(t){$('quote-form-message').textContent=t||''}
function close(){ $('quote-dialog').hidden=true;editing=null }
function addItem(item={}){
 const card=document.createElement('div');card.className='quote-item';
 card.innerHTML='<div class="quote-head"><h4>Ürün Kalemi</h4><button type="button" class="secondary q-remove">✕ Kaldır</button></div><div class="quote-grid"><label>Kategori<select class="q-category">'+cats.map(c=>'<option value="'+esc(c)+'"'+(c===item.category?' selected':'')+'>'+esc(c)+'</option>').join('')+'</select></label><label>Ürün Adı *<input class="q-name" required maxlength="200" value="'+esc(item.product_name||'')+'"></label><label>En (cm)<input class="q-width" type="number" min="0" step=".01" value="'+esc(item.width_cm??'')+'"></label><label>Boy (cm)<input class="q-height" type="number" min="0" step=".01" value="'+esc(item.height_cm??'')+'"></label><label>Ürün Fiyatı (₺)<input class="q-price" required type="number" min="0" step=".01" value="'+esc(item.unit_price??0)+'"></label><label>Üretim Notu<input class="q-note" maxlength="1500" value="'+esc(item.production_note||'')+'"></label></div>';
 card.querySelector('.q-remove').onclick=()=>{card.remove();recalc()};
 card.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',recalc));
 $('quote-items').append(card);recalc();
}
function readItems(){return [...document.querySelectorAll('.quote-item')].map(c=>({category:c.querySelector('.q-category').value,product_name:c.querySelector('.q-name').value.trim(),width_cm:c.querySelector('.q-width').value||null,height_cm:c.querySelector('.q-height').value||null,unit_price:Number(c.querySelector('.q-price').value),production_note:c.querySelector('.q-note').value.trim()}))}
function recalc(){const f=$('quote-form'),sub=readItems().reduce((a,p)=>a+(Number.isFinite(p.unit_price)?p.unit_price:0),0),d=Number(f.elements.discount_percent.value||0),x=Number(f.elements.discount_amount.value||0);$('quote-total').textContent=fmt(sub-sub*d/100-x)}
function open(q=null){
 editing=q;const form=$('quote-form');form.reset();$('quote-items').replaceChildren();formMsg('');
 $('quote-heading').textContent=q?'Teklif #'+q.quote_number+' Düzenle':'Yeni Teklif';
 $('quote-branch').replaceChildren();branches.forEach(b=>$('quote-branch').add(new Option(b.name,b.id)));
 if(q){for(const name of ['customer_name','customer_phone','branch_id','delivery_date','valid_until','status','discount_percent','discount_amount','customer_note']){form.elements[name].value=q[name]??''} (q.items||[]).forEach(addItem)}
 else{form.elements.status.value='draft';form.elements.discount_percent.value='0';form.elements.discount_amount.value='0';addItem()}
 $('quote-dialog').hidden=false;recalc();
}
async function load(){
 msg('Teklifler yükleniyor...');
 const {data:bs,error:be}=await sb.from('erp_branches').select('id,name').eq('organization_id',org).order('name');
 if(be)throw be;branches=bs||[];
 const {data, error}=await sb.from('erp_quotes').select('*').eq('organization_id',org).order('created_at',{ascending:false});
 if(error)throw error;quotes=data||[];render();msg('');
}
function render(){
 const s=$('quote-search').value.trim().toLocaleLowerCase('tr-TR'),status=$('quote-filter').value;
 $('q-stat-all').textContent=quotes.length;$('q-stat-pending').textContent=quotes.filter(x=>x.status==='pending').length;$('q-stat-approved').textContent=quotes.filter(x=>x.status==='approved').length;
 const visible=quotes.filter(q=>(!status||q.status===status)&&(!s||[q.quote_number,q.customer_name,q.customer_phone].some(v=>String(v||'').toLocaleLowerCase('tr-TR').includes(s))));
 $('quote-list').innerHTML=visible.map(q=>'<article class="quote-card"><div><h3>#T-'+esc(q.quote_number)+' · '+esc(q.customer_name)+' <span class="quote-chip '+esc(q.status)+'">'+esc(labels[q.status])+'</span></h3><p>'+esc(q.customer_phone||'Telefon yok')+' · '+esc(branches.find(b=>b.id===q.branch_id)?.name||'Şube')+' · '+new Date(q.created_at).toLocaleDateString('tr-TR')+'</p><p>'+ (q.items||[]).length +' ürün · <b>'+fmt(q.total_amount)+'</b>'+(q.valid_until?' · Geçerli: '+esc(q.valid_until):'')+'</p>'+(q.converted_order_id?'<p>Gerçek siparişe dönüştürüldü</p>':'')+'</div><div class="quote-buttons"><button class="secondary" data-action="preview" data-id="'+q.id+'">Teklif Çıktısı</button>'+(q.status!=='approved'?'<button class="secondary" data-action="edit" data-id="'+q.id+'">Düzenle</button><button class="primary" data-action="approve" data-id="'+q.id+'">✓ Onayla</button>':'<button class="secondary" data-action="order" data-id="'+q.id+'">Siparişe Git</button>')+'</div></article>').join('')||'<div class="quote-card">Henüz teklif bulunmuyor.</div>';
}
async function approve(q){
 if(!confirm('#T-'+q.quote_number+' teklifini gerçek siparişe dönüştürmek istiyor musunuz? Bu işlem sonrası kasa/rapor etkisi başlayacak, teklif değiştirilemeyecek.'))return;
 msg('Teklif onaylanıyor...');
 const {data,error}=await sb.rpc('erp_approve_quote',{p_org:org,p_quote:q.id});
 if(error){msg('Onaylanamadı: '+error.message);return}
 await load();msg('Teklif onaylandı. Gerçek sipariş oluşturuldu; sipariş numarası için Siparişler bölümüne geçebilirsiniz.');
}
function preview(q){
 const itemRows=(q.items||[]).map((p,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(p.category)+' · '+esc(p.product_name)+'</td><td>'+esc(p.width_cm||'—')+' × '+esc(p.height_cm||'—')+' cm</td><td>'+fmt(p.unit_price)+'</td></tr>').join('');
 const body='<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Teklif #T-'+q.quote_number+'</title><style>body{font:14px Arial;color:#1f332a;padding:30px;max-width:850px;margin:auto}h1{color:#233e32}table{border-collapse:collapse;width:100%;margin:20px 0}td,th{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f2f5f1}.total{text-align:right;font-size:20px;font-weight:bold}.note{margin-top:30px;color:#667}.controls{text-align:right}@media print{.controls{display:none}}</style></head><body><div class="controls"><button onclick="print()">Yazdır / PDF Kaydet</button></div><h1>KONAK ERP · FİYAT TEKLİFİ</h1><p><b>Teklif:</b> #T-'+esc(q.quote_number)+' &nbsp; <b>Tarih:</b> '+new Date(q.created_at).toLocaleDateString('tr-TR')+'</p><p><b>Müşteri:</b> '+esc(q.customer_name)+' &nbsp; <b>Telefon:</b> '+esc(q.customer_phone)+'</p><p><b>Geçerlilik:</b> '+esc(q.valid_until||'Belirtilmedi')+'</p><table><thead><tr><th>No</th><th>Ürün</th><th>Ölçü</th><th>Fiyat</th></tr></thead><tbody>'+itemRows+'</tbody></table><p>Ara Toplam: '+fmt(q.subtotal_amount)+'</p><p>İskonto: %'+esc(q.discount_percent)+' + '+fmt(q.discount_amount)+'</p><div class="total">Teklif Toplamı: '+fmt(q.total_amount)+'</div><p>'+esc(q.customer_note||'')+'</p><p class="note">Bu belge fiyat teklifidir, kesinleşmiş sipariş veya tahsilat makbuzu değildir. Üretim müşteri onayından sonra başlar.</p></body></html>';
 const w=window.open('','_blank');if(!w){alert('Teklif çıktısı için açılır pencerelere izin verin.');return}w.document.open();w.document.write(body);w.document.close();
}
async function init(){
 if(!sb){$('quote-auth').textContent='Bağlantı yüklenemedi.';return}
 const {data}=await sb.auth.getSession();user=data?.session?.user;
 if(!user)return;
 const {data:members,error}=await sb.from('erp_members').select('organization_id,role').eq('user_id',user.id);if(error)throw error;
 orgs=members||[];if(!orgs.length)throw Error('Kayıtlı işletme yok.');
 $('quote-auth').hidden=true;$('quote-main').hidden=false;
 $('quote-organization').replaceChildren();for(const m of orgs)$('quote-organization').add(new Option(m.organization_id,m.organization_id));
 const requested=new URLSearchParams(location.search).get('org');org=orgs.some(m=>m.organization_id===requested)?requested:orgs[0].organization_id;$('quote-organization').value=org;
 await load();
}
$('quote-new').onclick=()=>open();$('quote-refresh').onclick=()=>load().catch(e=>msg(e.message));$('quote-close').onclick=close;$('quote-cancel').onclick=close;$('quote-add-item').onclick=()=>addItem();
$('quote-form').addEventListener('input',recalc);
$('quote-search').addEventListener('input',render);$('quote-filter').onchange=render;
$('quote-organization').onchange=async()=>{org=$('quote-organization').value;await load().catch(e=>msg(e.message))};
$('quote-list').onclick=e=>{const button=e.target.closest('button[data-action]');if(!button)return;const q=quotes.find(x=>x.id===button.dataset.id);if(!q)return;switch(button.dataset.action){case 'edit':open(q);break;case 'preview':preview(q);break;case 'approve':approve(q);break;case 'order':window.top.location.href='./?view=orders';break}};
$('quote-form').onsubmit=async e=>{e.preventDefault();if(saving)return;const f=e.currentTarget,items=readItems();if(!items.length){formMsg('En az bir ürün ekleyin');return}if(items.some(p=>p.product_name.length<2||!Number.isFinite(p.unit_price)||p.unit_price<0)){formMsg('Ürün adı ve fiyatlarını kontrol edin');return}
 saving=true;$('quote-save').disabled=true;formMsg('Teklif kaydediliyor...');
 try{const fd=new FormData(f),params={p_org:org,p_branch:fd.get('branch_id'),p_customer:fd.get('customer_name'),p_phone:fd.get('customer_phone'),p_delivery:fd.get('delivery_date')||null,p_note:fd.get('customer_note'),p_items:items,p_discount_percent:Number(fd.get('discount_percent')||0),p_discount_amount:Number(fd.get('discount_amount')||0),p_valid_until:fd.get('valid_until')||null,p_status:fd.get('status'),p_quote:editing?.id||null};const {error}=await sb.rpc('erp_save_quote',params);if(error)throw error;close();await load();msg('Teklif kaydedildi. Kasaya ve raporlara yansımadı.')}catch(err){formMsg('Kaydedilemedi: '+err.message)}finally{saving=false;$('quote-save').disabled=false}
};
init().catch(e=>{$('quote-auth').textContent='Teklif ekranı açılamadı: '+e.message;msg(e.message)});
})();