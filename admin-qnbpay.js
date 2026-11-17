(()=>{'use strict';const b=document.getElementById('pk-qnb-check'),out=document.getElementById('pk-qnb-feedback');if(!b||!out)return;const sb=window.supabase?.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');b.addEventListener('click',async()=>{b.disabled=true;out.textContent='Bağlantı kontrol ediliyor…';try{const session=await sb.auth.getSession();const token=session.data.session?.access_token;if(!token)throw Error('Yönetici oturumu gerekli.');const res=await fetch('https://rwylhxrtggsicieuyjrm.supabase.co/functions/v1/qnbpay-connection-check',{method:'POST',headers:{'authorization':'Bearer '+token,'apikey':'sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA','content-type':'application/json'},body:'{}'});const data=await res.json();out.textContent=data.configured===false?'API bilgileri henüz tanımlanmadı: '+data.missing.join(', '):data.token_endpoint_reachable?'QNB Pay test bağlantısı başarılı.':'Bağlantı henüz hazır değil: '+(data.error||'HTTP '+(data.http_status||res.status));}catch(e){out.textContent='Kontrol yapılamadı: '+e.message}finally{b.disabled=false}})})();
;(()=>{'use strict';
const button=document.getElementById('pk-qnb-transactions-refresh');
const body=document.getElementById('pk-qnb-transactions-body');
const message=document.getElementById('pk-qnb-transactions-message');
if(!button||!body||!message||!window.supabase)return;
const sb=window.supabase.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const date=s=>s?new Date(s).toLocaleString('tr-TR'):'—';
const status={created:'Oluşturuldu',pending_3ds:'3D onayı bekleniyor',pending_confirmation:'Banka onayı bekleniyor',paid:'Ödendi',failed:'Başarısız',cancelled:'İptal',refund_pending:'İade bekleniyor',partially_refunded:'Kısmi iade',refunded:'İade edildi'};
const cell=(row,value)=>{const td=document.createElement('td');td.textContent=value;td.style.padding='10px';row.appendChild(td)};
button.addEventListener('click',async()=>{
 button.disabled=true;message.textContent='İşlemler yükleniyor…';body.replaceChildren();
 try{
  const auth=await sb.auth.getUser();if(auth.error||!auth.data.user)throw Error('Yönetici girişi gerekli.');
  const role=await sb.from('admin_access').select('role').eq('user_id',auth.data.user.id).maybeSingle();
  if(role.error||!['owner','admin'].includes(role.data?.role))throw Error('Bu alan yalnızca yöneticilere açıktır.');
  const result=await sb.from('shop_payment_transactions').select('invoice_id,amount,currency,status,created_at').order('created_at',{ascending:false}).limit(30);
  if(result.error)throw result.error;
  for(const tx of result.data||[]){const tr=document.createElement('tr');cell(tr,date(tx.created_at));cell(tr,tx.invoice_id);cell(tr,money(tx.amount));cell(tr,status[tx.status]||tx.status);body.appendChild(tr)}
  message.textContent=(result.data?.length||0)+' ödeme kaydı listelendi. Liste yalnızca görüntüleme amaçlıdır.';
 }catch(e){message.textContent='İşlemler alınamadı: '+e.message}finally{button.disabled=false}
});
})();

;(()=>{'use strict';
const button=document.getElementById('pk-qnb-refunds-refresh'),body=document.getElementById('pk-qnb-refunds-body'),msg=document.getElementById('pk-qnb-refunds-message');
if(!button||!body||!msg||!window.supabase)return;
const sb=window.supabase.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const status={requested:'Talep edildi',processing:'İşleniyor',succeeded:'Başarılı',failed:'Başarısız'};
button.addEventListener('click',async()=>{
 button.disabled=true;body.replaceChildren();msg.textContent='İadeler yükleniyor…';
 try{
  const user=await sb.auth.getUser();if(user.error||!user.data.user)throw Error('Yönetici oturumu gerekli.');
  const role=await sb.from('admin_access').select('role').eq('user_id',user.data.user.id).maybeSingle();
  if(role.error||!['owner','admin'].includes(role.data?.role))throw Error('Yönetici yetkisi gerekli.');
  const res=await sb.from('shop_payment_refunds').select('created_at,amount,status,transaction_id').order('created_at',{ascending:false}).limit(30);
  if(res.error)throw res.error;
  for(const item of res.data||[]){
   const tr=document.createElement('tr');
   for(const value of [new Date(item.created_at).toLocaleString('tr-TR'),new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(item.amount),status[item.status]||item.status,item.transaction_id]){
    const td=document.createElement('td');td.textContent=value;td.style.padding='10px';tr.appendChild(td);
   }
   body.appendChild(tr);
  }
  msg.textContent=(res.data?.length||0)+' iade kaydı listelendi. Bu ekrandan iade başlatılamaz.';
 }catch(e){msg.textContent='İade kayıtları alınamadı: '+e.message}finally{button.disabled=false}
});
})();
