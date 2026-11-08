(()=>{
"use strict";
const SUPA_URL='https://rwylhxrtggsicieuyjrm.supabase.co';
const SUPA_KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const CART_KEY='perdeKonagiCartV1';
const client=()=>window.supabase?.createClient(SUPA_URL,SUPA_KEY);
const slug=location.pathname.split('/').pop().replace(/\.html$/,'');
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(n);
function getSelected(name){return document.querySelector('input[name="'+name+'"]:checked')?.value||''}
function parameters(){
 const kasa=getSelected('Kasa Seçeneği');
 return {p_slug:slug,p_width_cm:Number(document.getElementById('en')?.value),p_height_cm:Number(document.getElementById('boy')?.value),
 p_kasa_tip:kasa,p_kasa_renk:kasa==='acik'?'':document.querySelector('#kasa-swatches button[aria-pressed="true"]')?.title||'',
 p_zincir:getSelected('Mekanizma Zincir Tipi'),p_yon:getSelected('Mekanizma Zincir Yönü'),
 p_boru:getSelected('Mekanizma Borusu'),p_ayak:getSelected('Mekanizma Yan Ayak')};
}
function safeCart(){try{let parsed=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(parsed)?parsed.filter(p=>p?.quote?.slug&&p?.options):[]}catch{return[]}}
window.addCart=async function(){
 const btn=document.getElementById('add-cart'),msg=document.getElementById('cart-message');
 if(!btn||!msg)return;
 const p=parameters();
 if(!Number.isInteger(p.p_width_cm)||!Number.isInteger(p.p_height_cm)||p.p_width_cm<50||p.p_height_cm<50){msg.textContent='Lütfen geçerli en ve boy ölçüleri girin.';return}
 const sb=client();if(!sb){msg.textContent='Bağlantı kurulamadı. Lütfen sayfayı yenileyin.';return}
 btn.disabled=true;msg.textContent='Fiyat Supabase üzerinde doğrulanıyor…';
 try{
 const {data,error}=await sb.rpc('shop_quote_item',p);
 if(error||!data)throw Error(error?.message||'Fiyat alınamadı');
 const cart=safeCart();if(cart.length>=50)throw Error('Sepet dolu. Önce sepetinizi düzenleyin.');
 cart.push({id:crypto.randomUUID(),options:p,quote:data,quantity:1,variantSelections:{...(window.pkVariantSelections||{})},productImage:window.pkProductImage||null,added_at:new Date().toISOString()});
 localStorage.setItem(CART_KEY,JSON.stringify(cart));
 msg.textContent='✓ '+money(data.unit_total)+' tutarında ürün sepete eklendi. ';
 const a=document.createElement('a');a.href='sepet.html';a.textContent='Sepetime git →';a.style.cssText='font-weight:700;color:#92621c;text-decoration:underline';msg.append(a);
 }catch(e){msg.textContent='Ürün sepete eklenemedi: '+(e.message||'Bağlantı hatası')}
 finally{btn.disabled=false}
};
const btn=document.getElementById('add-cart');
if(btn){btn.removeAttribute('onclick');btn.addEventListener('click',()=>window.addCart());
const link=document.createElement('a');link.href='sepet.html';link.textContent='🛒 Sepetim';link.style.cssText='display:inline-flex;margin:12px 0;color:#8c6427;font-size:14px;font-weight:600;text-decoration:underline';btn.insertAdjacentElement('afterend',link);
const note=document.querySelector('.cart-disclaimer');if(note)note.textContent='Sepet ürün fiyatlarını güvenli sunucuda doğrular. Gerçek ödeme ve sipariş alımı henüz açılmadı.';
}
})();