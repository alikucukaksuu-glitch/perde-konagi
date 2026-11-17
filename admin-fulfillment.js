(()=>{'use strict';
const $=id=>document.getElementById(id);
if(!window.supabase||!$('pk-fulfillment-save'))return;
const sb=window.supabase.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const ids={invoice:'pk-invoice-provider',carrier:'pk-shipping-provider',threshold:'pk-shipping-threshold',fee:'pk-shipping-fee'};
const msg=$('pk-fulfillment-message'),save=$('pk-fulfillment-save'),refresh=$('pk-fulfillment-refresh');
let ready=false;
async function authorized(){
 const {data:{user},error}=await sb.auth.getUser();if(error||!user)throw Error('Yönetici oturumu gerekli.');
 const role=await sb.from('admin_access').select('role').eq('user_id',user.id).maybeSingle();
 if(role.error||!['owner','admin'].includes(role.data?.role))throw Error('Bu işlem için yönetici yetkisi gerekli.');
}
async function load(){
 ready=false;save.disabled=true;refresh.disabled=true;msg.textContent='Entegrasyon ayarları yükleniyor…';
 try{
  await authorized();
  const [a,b]=await Promise.all([
   sb.from('shop_fulfillment_settings').select('invoice_provider,shipping_provider,invoice_enabled,shipping_enabled').eq('id',1).single(),
   sb.from('shop_checkout_config').select('free_shipping_threshold,shipping_fee_under_threshold').eq('id',1).single()
  ]);
  if(a.error||b.error)throw a.error||b.error;
  $(ids.invoice).value=a.data.invoice_provider;
  $(ids.carrier).value=a.data.shipping_provider;
  $(ids.threshold).value=b.data.free_shipping_threshold;
  $(ids.fee).value=b.data.shipping_fee_under_threshold??'';
  ready=true;save.disabled=false;
  msg.textContent='Ayarlar yüklendi. Fatura: '+(a.data.invoice_enabled?'aktif':'bağlantı bekliyor')+' · Kargo: '+(a.data.shipping_enabled?'aktif':'bağlantı bekliyor')+'.';
 }catch(e){msg.textContent='Ayarlar yüklenemedi: '+e.message}finally{refresh.disabled=false}
}
refresh.addEventListener('click',load);
save.addEventListener('click',async()=>{
 if(!ready)return;
 const threshold=Number($(ids.threshold).value),raw=$(ids.fee).value.trim(),fee=raw===''?null:Number(raw);
 if(!Number.isFinite(threshold)||threshold<0||threshold>1000000||Math.round(threshold*100)!==threshold*100||fee!==null&&(!Number.isFinite(fee)||fee<0||fee>100000||Math.round(fee*100)!==fee*100)){msg.textContent='Geçerli bir TL tutarı girin (en fazla iki ondalık).';return}
 save.disabled=true;msg.textContent='Kaydediliyor…';
 try{
  await authorized();
  const invoice=$(ids.invoice).value,carrier=$(ids.carrier).value;
  if(!['unselected','logo','foriba','uyumsoft','parasut','other'].includes(invoice)||!['yurtici','aras','mng','surat','ptt','other'].includes(carrier))throw Error('Geçersiz sağlayıcı.');
  const a=await sb.from('shop_fulfillment_settings').update({invoice_provider:invoice,shipping_provider:carrier}).eq('id',1).select('id').single();
  if(a.error)throw a.error;
  const label={yurtici:'Yurtiçi Kargo',aras:'Aras Kargo',mng:'MNG Kargo',surat:'Sürat Kargo',ptt:'PTT Kargo',other:'Diğer'}[carrier];
  const b=await sb.from('shop_checkout_config').update({free_shipping_threshold:threshold,shipping_fee_under_threshold:fee,shipping_provider:label}).eq('id',1).select('id').single();
  if(b.error)throw b.error;
  msg.textContent='Ayarlar kaydedildi. API anahtarları olmadan otomatik fatura/kargo aktif edilmez.';
 }catch(e){msg.textContent='Kaydetme başarısız: '+e.message}finally{save.disabled=false}
});
const status={draft:'Taslak',queued:'Sırada',processing:'İşleniyor',issued:'Kesildi',failed:'Hata',cancelled:'İptal',label_ready:'Etiket hazır',handed_over:'Kargoya verildi',in_transit:'Yolda',delivered:'Teslim edildi',returned:'İade'};
$('pk-fulfillment-records-refresh')?.addEventListener('click',async()=>{
 const button=$('pk-fulfillment-records-refresh'),body=$('pk-fulfillment-records-body'),m=$('pk-fulfillment-records-message');
 button.disabled=true;body.replaceChildren();m.textContent='Kayıtlar alınıyor…';
 try{
  await authorized();
  const [a,b]=await Promise.all([
   sb.from('shop_invoices').select('order_id,created_at,provider,status,invoice_number').order('created_at',{ascending:false}).limit(30),
   sb.from('shop_shipments').select('order_id,created_at,provider,status,tracking_number').order('created_at',{ascending:false}).limit(30)
  ]);
  if(a.error||b.error)throw a.error||b.error;
  const records=[...(a.data||[]).map(x=>({...x,kind:'Fatura',reference:x.invoice_number})),...(b.data||[]).map(x=>({...x,kind:'Kargo',reference:x.tracking_number}))].sort((x,y)=>new Date(y.created_at)-new Date(x.created_at)).slice(0,30);
  for(const item of records){const tr=document.createElement('tr');for(const v of [item.kind,new Date(item.created_at).toLocaleString('tr-TR'),item.order_id,item.provider||'—',status[item.status]||item.status,item.reference||'—']){const td=document.createElement('td');td.textContent=v;td.style.padding='10px 8px';td.style.borderBottom='1px solid #e8ded4';tr.appendChild(td)}body.appendChild(tr)}
  m.textContent=records.length?records.length+' kayıt listelendi.':'Henüz fatura veya kargo kaydı yok.';
 }catch(e){m.textContent='Kayıtlar alınamadı: '+e.message}finally{button.disabled=false}
});
load();
})();