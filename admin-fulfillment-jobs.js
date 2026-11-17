(()=>{'use strict';
const button=document.getElementById('pk-fulfillment-jobs-refresh'),body=document.getElementById('pk-fulfillment-jobs-body'),msg=document.getElementById('pk-fulfillment-jobs-message');
if(!button||!body||!msg||!window.supabase)return;
const sb=window.supabase.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const statuses={waiting:'Bekliyor',processing:'İşleniyor',retry:'Tekrar denenecek',succeeded:'Başarılı',failed:'Başarısız',cancelled:'İptal'};
const types={invoice_issue:'Fatura kes',shipment_create:'Gönderi oluştur',shipment_track:'Kargo takip',invoice_cancel:'Fatura iptal',shipment_cancel:'Kargo iptal'};
button.addEventListener('click',async()=>{
 button.disabled=true;body.replaceChildren();msg.textContent='Görevler yükleniyor…';
 try{
  const {data:{user},error}=await sb.auth.getUser();if(error||!user)throw Error('Yönetici oturumu gerekli.');
  const role=await sb.from('admin_access').select('role').eq('user_id',user.id).maybeSingle();
  if(role.error||!['owner','admin'].includes(role.data?.role))throw Error('Yönetici yetkisi gerekli.');
  const r=await sb.from('shop_fulfillment_jobs').select('job_type,order_id,provider,status,attempt_count,max_attempts,last_error_code,created_at').order('created_at',{ascending:false}).limit(50);
  if(r.error)throw r.error;
  for(const x of r.data||[]){
   const tr=document.createElement('tr');
   for(const value of [types[x.job_type]||x.job_type,x.order_id,x.provider,statuses[x.status]||x.status,x.attempt_count+'/'+x.max_attempts,x.last_error_code||'—']){
    const td=document.createElement('td');td.textContent=value;td.style.padding='10px 8px';td.style.borderBottom='1px solid #e8ded4';tr.appendChild(td);
   }body.appendChild(tr);
  }
  msg.textContent=(r.data||[]).length+' görev görüntülendi. API bağlantıları tamamlanmadan görev çalıştırılmaz.';
 }catch(e){msg.textContent='Görevler alınamadı: '+e.message}finally{button.disabled=false}
});
})();