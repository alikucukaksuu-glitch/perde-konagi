(()=>{
'use strict';
const sb=window.supabase?.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const key='perdeKonagiCartV1';
const items=document.getElementById('items'),status=document.getElementById('status'),total=document.getElementById('total'),count=document.getElementById('count'),badge=document.getElementById('cart-badge');
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(n);
const read=()=>{try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x.filter(v=>v?.options?.p_slug&&v.quantity>=1):[]}catch{return[]}};
let cart=read(),version=0,couponCode=localStorage.getItem('pkCouponCode')||'';
const couponInput=document.getElementById('coupon-code'),couponMsg=document.getElementById('coupon-message');
if(couponInput)couponInput.value=couponCode;
function save(){localStorage.setItem(key,JSON.stringify(cart))}
function text(tag,value,cls){const e=document.createElement(tag);e.textContent=String(value);if(cls)e.className=cls;return e}
const icons={
 ruler:'<path d="M4 18 18 4l4 4L8 22zM10 12l3 3M13 9l3 3"/>',
 layer:'<path d="m12 2 9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',
 link:'<path d="m10 13 4-4M8 16H6a4 4 0 0 1 0-8h3M16 8h2a4 4 0 0 1 0 8h-3"/>',
 gear:'<circle cx="12" cy="12" r="4"/><path d="m10 2-.5 3-2 1L5 4 3 7l2 2-.5 3L2 14l2 3 3-.5 2 2 .5 3H14l.5-3 2-2 3 .5 2-3-2.5-2 .5-3 2-2-2-3-3 2-2-1-.5-3z"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 10v7M14 10v7"/>'
};
function svg(kind){const e=document.createElementNS('http://www.w3.org/2000/svg','svg');e.setAttribute('viewBox','0 0 24 24');e.setAttribute('aria-hidden','true');e.innerHTML=icons[kind];return e}
function detail(label,value,icon){const d=document.createElement('div');d.className='custom-cell';const b=document.createElement('div');b.append(text('span',label,'custom-label'),text('strong',value,'custom-value'));d.append(svg(icon),b);return d}
const kasaName=v=>({acik:'Açık Kasa',klasik:'Kapalı Kasa Klasik',renkli:'Kapalı Kasa Renkli'})[v]||v||'—';
const tr=v=>({metal:'Metal',plastik:'Plastik',jumbo:'38’lik Jumbo',standart:'32’lik Standart',sag:'Sağ',sol:'Sol'})[v]||v||'—';
function show(){
 items.replaceChildren();let sum=0,qty=0;
 if(!cart.length){const empty=text('div','Sepetiniz henüz boş. Size uygun perdeyi koleksiyonlarımızdan seçebilirsiniz.','empty');const a=text('a','Zebra Perdeleri İncele →');a.href='zebra-perde.html';empty.append(document.createElement('br'),a);items.append(empty)}
 for(const line of cart){const q=line.quote;if(!q)continue;const unit=Number(q.unit_total),lineTotal=unit*line.quantity;sum+=lineTotal;qty+=line.quantity;
 const o=q.options||{};const card=document.createElement('article');card.className='item';
 const top=document.createElement('div');top.className='item-main';
 const img=document.createElement('img');img.className='item-image';img.src=line.productImage||(line.type==='tul'?'tul-perde-placeholder.svg':line.type==='wood-blind'?'wood-jaluzi-product.svg':line.type==='plise'?'plise-product.svg':(q.slug.startsWith('mat-stor-')?q.slug+'-1.webp':q.slug.replace('-zebra-perde','')+'-1.'+(q.slug.includes('siyah')?'png':'webp')));img.alt=q.title;img.loading='lazy';img.onerror=()=>img.style.visibility='hidden';
 const block=document.createElement('div');block.className='item-info';
 const productLink=document.createElement('a');productLink.href=line.type==='tul'?'tul-perde.html?slug='+encodeURIComponent(q.slug):line.type==='wood-blind'?'ahsap-jaluzi.html?slug='+encodeURIComponent(q.slug):line.type==='plise'?'plise-perde.html?slug='+encodeURIComponent(q.slug):(q.slug.startsWith('mat-stor-')||q.slug.startsWith('bambu-'))?q.slug+'.html':'urun.html?slug='+encodeURIComponent(q.slug);productLink.append(text('h2',q.title));
 const sub=text('p',line.type==='tul'?q.width_cm+' × '+q.height_cm+' cm · '+o.pleat+' · '+o.sewing:line.type==='wood-blind'?q.width_cm+' × '+q.height_cm+' cm · '+o.color+' · '+o.system+' · '+o.surface:line.type==='plise'?q.width_cm+' × '+q.height_cm+' cm · '+o.fabric+' Kumaş · '+o.profile+' Profil · '+o.surface+' · '+o.mounting:q.width_cm+' × '+q.height_cm+' cm · '+kasaName(o.kasaTip)+(o.kasaRenk?' ('+o.kasaRenk+')':'')+' · '+tr(o.zincir)+' Zincir · '+tr(o.boru)+' Boru · '+tr(o.yon)+' Yön','item-subtitle');
 const bottom=document.createElement('div');bottom.className='item-bottom';const price=text('strong',money(lineTotal),'price');
 if(Number(q.discount_amount)>0){const before=text('s',money(Number(q.original_unit_total)*line.quantity));before.style.cssText='display:block;color:#9e8e7d;font-size:12px;margin-bottom:4px;font-weight:400';block.append(before);const promo=text('p','✓ '+(q.campaign_badge||'Kampanya')+' · '+money(Number(q.discount_amount)*line.quantity)+' avantaj');promo.style.cssText='font-size:12px;color:#3c824e;font-weight:700;margin:7px 0';block.append(promo)}const controls=document.createElement('div');controls.className='qty';
 const minus=text('button','−');minus.type='button';minus.setAttribute('aria-label',q.title+' adedini azalt');minus.onclick=()=>change(line.id,line.quantity-1);
 const n=text('span',String(line.quantity),'qty-count');
 const plus=text('button','+');plus.type='button';plus.setAttribute('aria-label',q.title+' adedini artır');plus.onclick=()=>change(line.id,line.quantity+1);
 const remove=document.createElement('button');remove.type='button';remove.className='remove';remove.append(svg('trash'),text('span','Sil'));remove.setAttribute('aria-label',q.title+' ürününü sepetten kaldır');remove.onclick=()=>change(line.id,0);
 controls.append(minus,n,plus,remove);bottom.append(price,controls);block.append(productLink,sub,bottom);top.append(img,block);
 const custom=document.createElement('section');custom.className='custom-box';custom.setAttribute('aria-label','Ürün özelleştirmeleri');
 const title=document.createElement('h3');title.append(svg('gear'),text('span','Ürün Özelleştirmeleri'));
 const grid=document.createElement('div');grid.className='custom-grid';
 if(line.type==='tul'){grid.append(detail('Ölçü',q.width_cm+' × '+q.height_cm+' cm','ruler'),detail('Pile',o.pleat||'—','layer'),detail('Dikim',o.sewing||'—','gear'));if(line.orderNote)custom.append(text('p','Sipariş Notu: '+line.orderNote,'extra-options'))}else if(line.type==='wood-blind'){grid.append(detail('Ölçü',q.width_cm+' × '+q.height_cm+' cm','ruler'),detail('Ahşap Rengi',o.color||'—','layer'),detail('Sistem',o.system||'—','gear'),detail('Montaj',o.surface||'—','gear'));if(line.orderNote)custom.append(text('p','Sipariş Notu: '+line.orderNote,'extra-options'))}else if(line.type==='plise'){grid.append(detail('Ölçü',q.width_cm+' × '+q.height_cm+' cm','ruler'),detail('Kumaş Rengi',o.fabric||'—','layer'),detail('Profil Rengi',o.profile||'—','layer'),detail('Montaj Yeri',o.surface||'—','gear'),detail('Montaj Şekli',o.mounting||'—','gear'));if(line.orderNote)custom.append(text('p','Sipariş Notu: '+line.orderNote,'extra-options'))}else{grid.append(detail('Ölçü',q.width_cm+' × '+q.height_cm+' cm','ruler'),detail('Kasa / Renk',kasaName(o.kasaTip)+(o.kasaRenk?' · '+o.kasaRenk:''),'layer'),detail('Zincir / Yön',tr(o.zincir)+' · '+tr(o.yon),'link'),detail('Mekanizma',tr(o.boru)+' Boru','gear'),detail('Yan Ayak',tr(o.ayak)+' Yan Ayak','gear'));}
 custom.append(title,grid);
 if(line.variantSelections&&Object.keys(line.variantSelections).length){
 const extra=text('p','Varyantlar: '+Object.entries(line.variantSelections).map(([k,v])=>k+': '+v).join(' · '),'extra-options');
 custom.append(extra);
 }
 card.append(top,custom);items.append(card)}
 total.textContent=money(sum);count.textContent=qty+' adet ürün';if(badge)badge.textContent=qty>99?'99+':String(qty);
 const savings=cart.reduce((n,l)=>n+Math.max(0,Number(l.quote?.discount_amount)||0)*l.quantity,0);
 const savingsEl=document.getElementById('coupon-savings');if(savingsEl){savingsEl.hidden=savings<=0;document.getElementById('coupon-savings-value').textContent='−'+money(savings)}
}
function change(id,n){if(n>20){status.textContent='Bir üründen en fazla 20 adet ekleyebilirsiniz.';return}if(n<1)cart=cart.filter(x=>x.id!==id);else cart=cart.map(x=>x.id===id?{...x,quantity:n}:x);save();show()}
async function verify(){
 const t=++version;if(!sb){status.textContent='Fiyat servisine bağlanılamadı. Sepet fiyatları doğrulanamadı.';return}
 if(!cart.length){status.textContent='Sepetiniz boş.';show();return}
 const next=[];let rejected=0,validCouponUses=0;
 const applyBtn=document.getElementById('coupon-apply');if(applyBtn)applyBtn.disabled=true;
 for(const line of cart.slice(0,50)){
  try{
   const isTul=line.type==='tul';const isWood=line.type==='wood-blind';const isPlise=line.type==='plise'||line.options?.p_slug==='plise-perde';const {data:normal,error:normalError}=isTul?await sb.rpc('tul_quote_product',{p_slug:line.options.p_slug,p_width_cm:line.options.p_width_cm,p_height_cm:line.options.p_height_cm,p_pleat:line.options.p_pleat,p_sewing:line.options.p_sewing}):isWood?await sb.rpc('wood_blind_quote_product',{p_slug:line.options.p_slug,p_width_cm:line.options.p_width_cm,p_height_cm:line.options.p_height_cm,p_color:line.options.p_color,p_system:line.options.p_system,p_surface:line.options.p_surface}):isPlise?await sb.rpc('plise_quote_product',{p_slug:line.options.p_slug,p_width_cm:line.options.p_width_cm,p_height_cm:line.options.p_height_cm,p_fabric:line.options.p_fabric,p_profile:line.options.p_profile,p_surface:line.options.p_surface,p_mounting:line.options.p_mounting}):await sb.rpc('shop_quote_with_promo',line.options);
   if(normalError||!normal)throw Error(normalError?.message||'Fiyat doğrulanamadı');
   let selected=normal;
   if(couponCode&&!isPlise&&!isWood&&!isTul){
    const {data:withCode,error:couponError}=await sb.rpc('shop_quote_with_promo',{...line.options,p_coupon_code:couponCode});
    if(!couponError&&withCode){selected=withCode;if(withCode.coupon_applied===couponCode)validCouponUses++}
   }
   next.push({...line,quote:selected,quantity:Math.min(20,Math.max(1,Math.floor(line.quantity)))});
  }catch{rejected++}
 }
 if(t!==version)return;
 if(couponCode&&validCouponUses===0){couponMsg.textContent='Kupon geçersiz, süresi dolmuş veya sepetinizdeki ürünlere uygulanamıyor.';couponCode='';couponInput.value='';localStorage.removeItem('pkCouponCode')}
 else if(couponCode){couponMsg.textContent='✓ '+couponCode+' kuponu doğrulandı. Uygun ürünlerde avantaj hesaplandı.';localStorage.setItem('pkCouponCode',couponCode)}
 else couponMsg.textContent='';
 cart=next;save();show();status.textContent=rejected?rejected+' üründe fiyat doğrulanamadı ve ürün sepetten çıkarıldı.':'✓ Ürün ve kampanya fiyatları güncel katalog üzerinden doğrulandı.';
 if(applyBtn)applyBtn.disabled=false;
}
document.getElementById('coupon-form')?.addEventListener('submit',e=>{
 e.preventDefault();
 const raw=couponInput.value.trim().toUpperCase();
 if(raw!==''&&!/^[A-Z0-9_-]{4,24}$/.test(raw)){couponMsg.textContent='Kupon kodu 4–24 harf/rakam olmalıdır.';return}
 couponCode=raw;
 couponMsg.textContent=raw?'Kupon doğrulanıyor…':'Kupon kaldırıldı.';
 items.replaceChildren(text('div','Kampanya fiyatları hesaplanıyor…','empty'));total.textContent='—';
 verify();
});
items.replaceChildren(text('div','Sepet fiyatları doğrulanıyor…','empty'));total.textContent='—';count.textContent='Ürünler kontrol ediliyor';verify();
})();