(()=>{'use strict';
const $=id=>document.getElementById(id);
const message=$('server-quote-status'),button=$('server-quote-refresh');
if(!message||!button||!window.supabase)return;
const endpoint='https://rwylhxrtggsicieuyjrm.supabase.co/functions/v1/qnbpay-cart-quote';
const key='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.supabase.createClient('https://rwylhxrtggsicieuyjrm.supabase.co',key);
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(n);
const safeCart=()=>{try{const data=JSON.parse(localStorage.getItem('perdeKonagiCartV1')||'[]');return Array.isArray(data)?data:[]}catch{return[]}};
button.addEventListener('click',async()=>{
 button.disabled=true;message.textContent='Sunucu üzerinden güncel ürün ve kargo tutarları kontrol ediliyor…';
 try{
  const {data:{session},error}=await sb.auth.getSession();
  if(error||!session?.access_token)throw Error('Fiyat kontrolü için önce müşteri hesabınıza giriş yapmalısınız.');
  const cart=safeCart();
  if(!cart.length||cart.length>50)throw Error('Sepetinizde doğrulanabilir ürün bulunamadı.');
  const items=cart.map(x=>({type:x.type||'zebra',quantity:x.quantity,options:x.options}));
  const coupon=localStorage.getItem('pkCouponCode')||'';
  const response=await fetch(endpoint,{method:'POST',headers:{authorization:'Bearer '+session.access_token,apikey:key,'content-type':'application/json'},body:JSON.stringify({items,coupon_code:coupon})});
  const result=await response.json();
  if(!response.ok)throw Error(result.error==='product_quote_failed'?'Ürün fiyatlarından biri doğrulanamadı. Sepete dönüp ürünleri güncelleyin.':result.error==='invalid_item'?'Sepet ürün seçenekleri eksik. Sepete dönüp fiyatları yenileyin.':'Sunucu fiyat doğrulaması başarısız ('+(result.error||response.status)+').');
  const cartAfter=safeCart();
  if(JSON.stringify(cart)!==JSON.stringify(cartAfter))throw Error('Sepet değişti. Güncel tutarı yeniden kontrol edin.');
  $('total').textContent=money(result.items_total);
  $('shipping').textContent=result.shipping_amount===null?'Hesaplanacak':result.shipping_amount===0?'Ücretsiz':money(result.shipping_amount);
  $('shipping-note').textContent=result.shipping_amount===null?'Kargo ücreti henüz kesinleşmedi.':result.shipping_provider+' · '+money(result.free_shipping_threshold)+' ve üzeri ücretsiz kargo.';
  $('grand-row').hidden=result.grand_total===null;
  if(result.grand_total!==null)$('grand-total').textContent=money(result.grand_total);
  message.textContent=result.grand_total===null?'Ürün fiyatları sunucudan doğrulandı; kargo tutarı henüz belirlenmedi. Ödeme kapalıdır.':'Ürün ve kargo toplamı sunucudan doğrulandı: '+money(result.grand_total)+'. Ödeme altyapısı hazırlık aşamasındadır; ödeme alınmaz.';
 }catch(e){$('grand-row').hidden=true;message.textContent=e.message||'Fiyat kontrolü yapılamadı.'}
 finally{button.disabled=false}
});
})();
