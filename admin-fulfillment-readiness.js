(()=>{'use strict';
const btn=document.getElementById('pk-fulfillment-readiness-refresh'),msg=document.getElementById('pk-fulfillment-readiness-message'),body=document.getElementById('pk-fulfillment-readiness-body');
if(!btn||!msg||!body||!window.supabase)return;
const sb=window.supabase.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
btn.addEventListener('click',async()=>{
 btn.disabled=true;body.replaceChildren();msg.textContent='Sipariş hazırlığı kontrol ediliyor…';
 try{
  const {data:{user},error}=await sb.auth.getUser();if(error||!user)throw Error('Yönetici girişi gerekli.');
  const role=await sb.from('admin_access').select('role').eq('user_id',user.id).maybeSingle();
  if(role.error||!['owner','admin'].includes(role.data?.role))throw Error('Yönetici yetkisi gerekli.');
  const orders=await sb.from('shop_orders').select('id,created_at,status').order('created_at',{ascending:false}).limit(30);
  if(orders.error)throw orders.error;
  const ids=(orders.data||[]).map(x=>x.id);
  if(!ids.length){msg.textContent='Henüz sipariş kaydı yok.';return}
  const [ful,pay,inv,ship]=await Promise.all([
   sb.from('shop_order_fulfillment').select('order_id,recipient_name,recipient_phone,delivery_address,shipping_fee,invoice_recipient_verified,invoice_recipient_kind').in('order_id',ids),
   sb.from('shop_payment_transactions').select('order_id,status').in('order_id',ids),
   sb.from('shop_invoices').select('order_id,status').in('order_id',ids),
   sb.from('shop_shipments').select('order_id,status').in('order_id',ids)
  ]);
  for(const r of [ful,pay,inv,ship])if(r.error)throw r.error;
  const fMap=new Map((ful.data||[]).map(x=>[x.order_id,x]));
  const pMap=new Map(),iMap=new Map(),sMap=new Map();
  for(const x of pay.data||[])if(x.status==='paid'||!pMap.has(x.order_id))pMap.set(x.order_id,x.status);
  for(const x of inv.data||[])iMap.set(x.order_id,x.status);
  for(const x of ship.data||[])sMap.set(x.order_id,x.status);
  let incomplete=0;
  for(const order of orders.data||[]){
   const f=fMap.get(order.id);
   const delivery=!!(f?.recipient_name&&f?.recipient_phone&&f?.delivery_address&&Object.keys(f.delivery_address).length&&f.shipping_fee!==null);
   const invoice=!!(f?.invoice_recipient_verified&&f?.invoice_recipient_kind);
   if(!delivery||!invoice)incomplete++;
   const row=document.createElement('tr');
   const values=[order.id,pMap.get(order.id)==='paid'?'Ödendi':pMap.get(order.id)||'Ödeme bekleniyor',delivery?'Hazır':'Eksik bilgi',invoice?(iMap.get(order.id)||'Tür doğrulandı'):'Alıcı türü doğrulanmadı',sMap.get(order.id)||'Gönderi oluşturulmadı'];
   for(const value of values){const cell=document.createElement('td');cell.textContent=value;cell.style.padding='10px 8px';cell.style.borderBottom='1px solid #e8ded4';row.appendChild(cell)}
   body.appendChild(row);
  }
  msg.textContent=ids.length+' sipariş kontrol edildi. '+incomplete+' siparişte teslimat veya e-belge doğrulaması eksik. Bu ekran fatura kesmez ve gönderi oluşturmaz.';
 }catch(e){msg.textContent='Kontrol yapılamadı: '+e.message}finally{btn.disabled=false}
});
})();