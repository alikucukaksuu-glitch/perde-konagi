(()=>{
'use strict';
const sb=window.supabase?.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const key='perdeKonagiCartV1',items=document.getElementById('items'),status=document.getElementById('status'),total=document.getElementById('total'),count=document.getElementById('count');
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(n);
const read=()=>{try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x.filter(v=>v?.options?.p_slug&&v.quantity>=1):[]}catch{return[]}};
let cart=read(),version=0;
function save(){localStorage.setItem(key,JSON.stringify(cart))}
function text(tag,s,cls){const e=document.createElement(tag);e.textContent=s;if(cls)e.className=cls;return e}
function show(){
 items.textContent='';let sum=0,qty=0;
 if(!cart.length){items.appendChild(text('div','Sepetiniz henüz boş. Koleksiyonlarımızdan ürün seçebilirsiniz.','empty'))}
 for(const line of cart){const q=line.quote;if(!q)continue;const unit=Number(q.unit_total),lineTotal=unit*line.quantity;sum+=lineTotal;qty+=line.quantity;
 const card=document.createElement('article');card.className='item';
 const img=document.createElement('img');img.src=(q.slug.startsWith('mat-stor-')?q.slug+'-1.webp':q.slug.replace('-zebra-perde','')+'-1.'+(q.slug.includes('siyah')?'png':'webp'));img.alt=q.title;img.loading='lazy';img.onerror=()=>img.style.visibility='hidden';
 const block=document.createElement('div'),h=text('h2',q.title),meta=text('div',q.width_cm+' × '+q.height_cm+' cm • '+q.options.kasaTip+' kasa'+(q.options.kasaRenk?' ('+q.options.kasaRenk+')':'')+' • '+q.options.zincir+' zincir • '+q.options.boru+' boru • '+q.options.yon+' yön','meta');
 const bottom=document.createElement('div');bottom.className='item-bottom';const price=text('strong',money(lineTotal),'price');const control=document.createElement('div');control.className='qty';
 const minus=text('button','−');minus.type='button';minus.setAttribute('aria-label','Adedi azalt');minus.onclick=()=>change(line.id,line.quantity-1);
 const n=text('span',String(line.quantity));const plus=text('button','+');plus.type='button';plus.setAttribute('aria-label','Adedi artır');plus.onclick=()=>change(line.id,line.quantity+1);const remove=text('button','Kaldır','remove');remove.type='button';remove.onclick=()=>change(line.id,0);
 control.append(minus,n,plus,remove);bottom.append(price,control);block.append(h,meta,bottom);card.append(img,block);items.append(card)}
 total.textContent=money(sum);count.textContent=qty+' adet ürün';
}
function change(id,n){if(n>20){status.textContent='Bir üründen en fazla 20 adet ekleyebilirsiniz.';return}if(n<1)cart=cart.filter(x=>x.id!==id);else cart=cart.map(x=>x.id===id?{...x,quantity:n}:x);save();show()}
async function verify(){
 const t=++version;if(!sb){status.textContent='Fiyat servisine bağlanılamadı. Sepet fiyatları doğrulanamadı.';return}
 if(!cart.length){status.textContent='Sepetiniz boş.';show();return}
 const next=[];let rejected=0;
 for(const line of cart.slice(0,50)){try{let {data,error}=await sb.rpc('shop_quote_item',line.options);if(error||!data)throw Error();next.push({...line,quote:data,quantity:Math.min(20,Math.max(1,Math.floor(line.quantity)))})}catch{rejected++}}
 if(t!==version)return;
 cart=next;save();show();status.textContent=rejected?rejected+' üründe fiyat doğrulanamadı ve ürün sepetten çıkarıldı.':'✓ Ürün fiyatları güncel katalog üzerinden doğrulandı.';
}
show();verify();
})();