(()=>{'use strict';
const BASE='https://rwylhxrtggsicieuyjrm.supabase.co';
const KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const slug=location.pathname.split('/').pop().replace(/\.html$/,'');
const productPage=Boolean(document.querySelector('#en')&&document.querySelector('#boy')&&document.querySelector('.customizer'));
const fmt=value=>new Intl.NumberFormat('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value));
const statusMsg='Bu ürün şu anda satışa kapalıdır. Ürünü inceleyebilirsiniz ancak sepetinize ekleyemezsiniz.';
async function catalog(){
 const response=await fetch(BASE+'/rest/v1/shop_products?select=slug,title,price_per_sqm,is_active',{headers:{apikey:KEY,Accept:'application/json'},cache:'no-store'});
 if(!response.ok)throw Error('Katalog alınamadı');
 return response.json();
}
function notice(parent,kind,text){
 let n=parent.querySelector('[data-catalog-notice]');
 if(!n){n=document.createElement('div');n.dataset.catalogNotice='true';n.setAttribute('role','status');n.style.cssText='border-radius:9px;padding:12px 14px;margin:12px 0;font-size:13px;line-height:1.5;font-weight:700;';parent.prepend(n)}
 n.style.background=kind==='off'?'#fff0dc':'#fff3e6';
 n.style.color='#795020';n.style.border='1px solid #e8c69d';n.textContent=text;
}
function blockPurchase(text){
 window.pkCatalogValidated=false;window.pkCatalogActive=false;
 const add=document.getElementById('add-cart'),box=document.getElementById('breakdown');
 if(add){add.disabled=true;add.textContent='Şu Anda Satışa Kapalı'}
 if(box)box.hidden=true;
 const wrapper=document.querySelector('.customizer');
 if(wrapper)notice(wrapper,'off',text);
 const msg=document.getElementById('measure-message');
 if(msg){msg.textContent=text;msg.className='measure-message invalid'}
}
function productPrice(p){
 const unit=document.querySelector('.customizer .unit');
 if(unit){unit.replaceChildren(document.createTextNode(fmt(p.price_per_sqm)+' TL '));const small=document.createElement('small');small.textContent='/ m²';unit.append(small)}
}
function showProduct(p){
 const value=Number(p.price_per_sqm);
 if(!Number.isFinite(value)||value<=0){blockPurchase('Ürünün fiyat bilgisi doğrulanamadı.');return}
 productPrice(p);
 const h=document.querySelector('h1');if(h)h.textContent=p.title;
 document.title=p.title+' | Perde Konağı';
 window.pkCatalogPricePerSqm=value;
 window.pkCatalogActive=p.is_active===true;
 window.pkCatalogValidated=p.is_active===true;
 if(!p.is_active){blockPurchase(statusMsg);return}
 if(typeof window.calc==='function')window.calc();
}
function updateListings(bySlug){
 const links=document.querySelectorAll('.product-card .product-image[href],.cards a.product[href]');
 for(const a of links){
  const name=a.getAttribute('href')?.split('/').pop().replace(/\.html$/,'');
  if(!name)continue;
  const p=bySlug.get(name),card=a.closest('.product-card,.product');
  if(!card)continue;
  const price=card.querySelector('.product-price');
  const desc=card.querySelector('.desc');
  if(!p){
   if(price)price.textContent='Fiyat doğrulanamadı';
   if(desc&&/Fiyat yükleniyor/.test(desc.textContent))desc.textContent=desc.textContent.replace('Fiyat yükleniyor…','Fiyat doğrulanamadı');
   notice(card,'off','Ürün bilgisi şu anda alınamıyor.');
   continue;
  }
  const h=card.querySelector('h3');if(h)h.textContent=p.title;
  if(price){price.textContent=fmt(p.price_per_sqm)+' TL ';const small=document.createElement('small');small.textContent='/ m²';price.append(small)}
  if(desc&&/Fiyat yükleniyor/.test(desc.textContent))desc.textContent=desc.textContent.replace('Fiyat yükleniyor…',fmt(p.price_per_sqm)+' TL/m²');
  if(!p.is_active){notice(card,'off','Şu anda satışa kapalı');card.dataset.saleStatus='inactive'}
 }
}
catalog().then(rows=>{
 const bySlug=new Map(rows.map(p=>[p.slug,p]));
 if(productPage){const p=bySlug.get(slug);if(p)showProduct(p);else blockPurchase('Ürün bilgisi alınamadı. Bu ürün şu anda satın alınamaz.')}
 else updateListings(bySlug);
}).catch(()=>{
 if(productPage)blockPurchase('Güncel fiyat doğrulanamadı. Lütfen daha sonra tekrar deneyin.');
 else updateListings(new Map());
});
})();