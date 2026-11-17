(()=>{
'use strict';
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(n);
let lines=[],sum=0,serverVerified=false;
let policy={free_shipping_threshold:2000,shipping_provider:'Yurtiçi Kargo',shipping_fee_under_threshold:null};
function renderShipping(data){
  const threshold=Number(data.free_shipping_threshold),eligible=lines.length>0&&sum>=threshold;
  const fee=Number(data.shipping_fee_under_threshold);
  const hasFee=data.shipping_fee_under_threshold!==null&&Number.isFinite(fee)&&fee>=0;
  $('shipping').textContent=eligible?'Ücretsiz':hasFee?money(fee):'Hesaplanacak';
  $('shipping-note').textContent=eligible?money(threshold)+' ve üzeri siparişlerde '+data.shipping_provider+' ile ücretsiz kargo.':hasFee?data.shipping_provider+' kargo bedeli ödeme öncesi kesinleştirilir.':money(threshold)+' altındaki siparişlerde kargo bedeli henüz belirlenmedi.';
  $('grand-row').hidden=!(lines.length&&(eligible||hasFee));
  if(!$('grand-row').hidden)$('grand-total').textContent=money(sum+(eligible?0:fee));
}
function renderCart(){
 let cart=[];
 try{cart=JSON.parse(localStorage.getItem('perdeKonagiCartV1')||'[]')}catch{}
 lines=Array.isArray(cart)?cart.filter(x=>x?.quote&&Number.isFinite(Number(x.quote.unit_total))&&Number.isInteger(x.quantity)&&x.quantity>0&&x.quantity<=20):[];
 const summary=$('summary');
 summary.replaceChildren();sum=0;
 for(const line of lines){
  const amount=Number(line.quote.unit_total)*line.quantity;
  sum+=amount;
  const row=document.createElement('div'),label=document.createElement('span'),price=document.createElement('strong');
  row.className='line';label.textContent=(line.quote.title||'Ürün')+' × '+line.quantity;
  price.textContent=money(amount);row.append(label,price);summary.append(row);
 }
 if(!lines.length)summary.textContent='Sepet boş. Önce ürün ekleyin.';
 $('total').textContent=money(sum);renderShipping(policy);
}
async function loadShippingPolicy(){
 try{
  if(!window.supabase)return;
  const sb=window.supabase.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
  const {data,error}=await sb.from('shop_checkout_config').select('free_shipping_threshold,shipping_provider,shipping_fee_under_threshold,checkout_enabled').eq('id',1).single();
  if(error||!data)return;
  policy=data;if(!serverVerified)renderShipping(policy);
 }catch{}
}
window.addEventListener('pk-quote-verified',()=>{serverVerified=true});
window.addEventListener('storage',event=>{
 if(event.storageArea!==localStorage||!['perdeKonagiCartV1','pkCouponCode',null].includes(event.key))return;
 serverVerified=false;renderCart();
 window.dispatchEvent(new Event('pk-checkout-cart-changed'));
});
renderCart();loadShippingPolicy();
const keys=['name','phone','email','city','district','postal','address'];try{const saved=JSON.parse(localStorage.getItem('pkCheckoutAddressDraft')||'null');if(saved&&typeof saved==='object')for(const k of keys)if(typeof saved[k]==='string')$(k).value=saved[k]}catch{}$('invoice-type').addEventListener('change',()=>{const corp=$('invoice-type').value==='corporate';$('corporate').hidden=!corp;$('individual').hidden=corp;for(const id of ['company','tax-office','tax-number'])$(id).required=corp});$('different-invoice').addEventListener('change',()=>{$('invoice-address-wrap').hidden=!$('different-invoice').checked;$('invoice-address').required=$('different-invoice').checked});$('checkout-form').addEventListener('submit',e=>{e.preventDefault();if(!lines.length){$('message').textContent='Önce sepete ürün ekleyin.';return}if($('save-address').checked){const draft={};for(const k of keys)draft[k]=$(k).value;localStorage.setItem('pkCheckoutAddressDraft',JSON.stringify(draft))}else localStorage.removeItem('pkCheckoutAddressDraft');$('message').textContent='Adres bilgileriniz yalnızca bu cihazda hazırlanmıştır. Sunucu fiyat doğrulaması ve ödeme altyapısı tamamlanmadığı için sipariş oluşturulmadı, ödeme alınmadı.'})})();