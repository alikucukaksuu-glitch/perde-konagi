(()=>{'use strict';
const BASE='https://rwylhxrtggsicieuyjrm.supabase.co';
const KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const slug=location.pathname.split('/').pop().replace(/\.html$/,'');
const productPage=document.querySelector('#en')&&document.querySelector('#boy')&&document.querySelector('.customizer');
const fmt=value=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(Number(value));
async function catalog(){
 const response=await fetch(BASE+'/rest/v1/shop_products?select=slug,title,price_per_sqm,is_active',{headers:{apikey:KEY,Accept:'application/json'},cache:'no-store'});
 if(!response.ok)throw Error('Ürün katalog hizmeti yanıt vermedi');
 return response.json();
}
function productError(txt){const add=document.getElementById('add-cart');if(add)add.disabled=true;const msg=document.getElementById('measure-message');if(msg)msg.textContent=txt}
function showProduct(p){
 window.pkCatalogPricePerSqm=Number(p.price_per_sqm);
 window.pkCatalogValidated=true;
 const h=document.querySelector('h1');if(h)h.textContent=p.title;
 const unit=document.querySelector('.customizer .unit');if(unit){unit.textContent=fmt(p.price_per_sqm)+' TL ';const small=document.createElement('small');small.textContent='/ m²';unit.append(small)}
 document.title=p.title+' | Perde Konağı';
 if(typeof window.calc==='function')window.calc();
}
function updateListings(bySlug){
 const links=document.querySelectorAll('.product-card .product-image[href],.cards a.product[href]');
 for(const a of links){
 const name=a.getAttribute('href')?.split('/').pop().replace(/\.html$/,'');if(!name)continue;
 const p=bySlug.get(name),card=a.closest('.product-card,.product');
 if(!card)continue;
 if(!p){card.hidden=true;card.style.display='none';continue}
 const h=card.querySelector('h3');if(h)h.textContent=p.title;
 const price=card.querySelector('.product-price');
 if(price){price.textContent=fmt(p.price_per_sqm)+' TL ';const small=document.createElement('small');small.textContent='/ m²';price.append(small)}
 const desc=card.querySelector('.desc');if(desc&&/\d+\s*TL\s*\/\s*m²/.test(desc.textContent))desc.textContent=desc.textContent.replace(/\d+\s*TL\s*\/\s*m²/,fmt(p.price_per_sqm)+' TL/m²');
 }
}
catalog().then(rows=>{
 const bySlug=new Map(rows.filter(p=>p.is_active).map(p=>[p.slug,p]));
 if(productPage){const p=bySlug.get(slug);if(p)showProduct(p);else productError('Bu ürün şu anda satışa kapalıdır.')}
 else updateListings(bySlug);
}).catch(()=>{
 if(productPage)productError('Güncel fiyat doğrulanamadı. Lütfen sayfayı yenileyin.');
});
})();