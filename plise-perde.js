(()=>{'use strict';
const $=id=>document.getElementById(id);
const sb=window.supabase?.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const colors=[['Beyaz','#f7f7f5'],['Krem','#eee2c6'],['Antrasit','#444649'],['Gri','#c0c2c4'],['Bej','#d6b894']];
const profiles=[['Beyaz','#e7e5e0'],['Krem','#d8cfb6'],['Gri','#b4b7b8'],['Bronz','#8f7456'],['Antrasit','#54565a']];
const surfaces=['Pimapen','Cam Balkon','Sürgülü Kapı/Pencere','Cam Balkon Isıcam'];
const mountings=['Vidalı','Yapışkanlı','Vida + Yapışkanlı'];
const prices={};
let selected={fabric:'Beyaz',profile:'Beyaz',surface:'Pimapen',mounting:'Vidalı'},config=null,price=null,version=0,priceTimer=null,busy=false;
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n));
const fmt=n=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:1}).format(Number(n));
const clean=v=>String(v??'').trim().replace(',','.');
const parse=v=>{const s=clean(v);if(!/^\d+(?:\.\d)?$/.test(s))return null;return Number(s)};
const note=t=>$('pp-status').textContent=t;
const optionParams=()=>({p_width_cm:parse($('pp-width').value),p_height_cm:parse($('pp-height').value),p_fabric:selected.fabric,p_profile:selected.profile,p_surface:selected.surface,p_mounting:selected.mounting});
const validation=()=>{const v=optionParams();if(v.p_width_cm===null||v.p_height_cm===null)return 'Fiyat hesaplamak için en ve boy ölçülerini giriniz.';if(v.p_width_cm<20||v.p_width_cm>120||v.p_height_cm<20||v.p_height_cm>250)return 'En 20–120 cm, boy 20–250 cm aralığında olmalıdır.';if(config&&selected.mounting==='Yapışkanlı'&&config.adhesive_fee_sqm===null)return 'Yapışkanlı montaj ek ücreti henüz tanımlanmadı. Fiyat için bize ulaşın.';if(config&&selected.mounting==='Vida + Yapışkanlı'&&config.combined_fee_sqm===null)return 'Vida + Yapışkanlı montaj ek ücreti henüz tanımlanmadı. Fiyat için bize ulaşın.';return ''};
function card(value,kind,label,figure,extra){const b=document.createElement('button');b.type='button';b.className='pp-choice';b.setAttribute('aria-pressed',String(selected[kind]===value));b.dataset.value=value;b.dataset.kind=kind;
 const picture=document.createElement('span');picture.className='pp-swatch '+(kind==='fabric'?'fabric':kind==='profile'?'profile':kind==='surface'?'surface':'mounting');if(kind==='fabric'||kind==='profile'){picture.style.setProperty('--swatch',figure)}else if(kind==='surface'){picture.style.setProperty('--frame',figure)}else picture.textContent=figure;
 const check=document.createElement('span');check.className='pp-check';check.textContent='✓';
 const title=document.createElement('strong');title.textContent=label; b.append(picture,check,title);
 if(extra){const small=document.createElement('small');small.textContent=extra;b.append(small)}
 b.addEventListener('click',()=>{selected[kind]=value;render();update()});return b}
function render(){const fabric=$('pp-fabrics'),profile=$('pp-profiles'),surface=$('pp-surfaces'),mounting=$('pp-mountings');fabric.replaceChildren(...colors.map(([n,c])=>card(n,'fabric',n,c)));const find=$('pp-search').value.toLocaleLowerCase('tr-TR');profile.replaceChildren(...profiles.filter(([n])=>n.toLocaleLowerCase('tr-TR').includes(find)).map(([n,c])=>card(n,'profile',n,c)));
 surface.replaceChildren(...surfaces.map((s,i)=>card(s,'surface',s,['#f2f0ed','#504c48','#a7aeb5','#818e8f'][i])));
 mounting.replaceChildren(...mountings.map((m,i)=>card(m,'mounting',m,['⚙','✋','🔩'][i],i===0?'Ücretsiz':i===1?(config?.adhesive_fee_sqm==null?'Fiyat teyidi gerekli':'+'+money(config.adhesive_fee_sqm)+' / m²'):(config?.combined_fee_sqm==null?'Fiyat teyidi gerekli':'+'+money(config.combined_fee_sqm)+' / m²'))));
 const color=colors.find(x=>x[0]===selected.fabric)?.[1]||'#eee2c6';document.querySelector('.pp-curtain').style.background='repeating-linear-gradient(180deg,'+color+' 0px,color-mix(in srgb,'+color+',#333 13%) 9px,'+color+' 11px,color-mix(in srgb,'+color+',#fff 13%) 22px,color-mix(in srgb,'+color+',#333 19%) 24px)';
}
function update(){clearTimeout(priceTimer);const current=++version;price=null;$('pp-add').disabled=true;$('pp-total').textContent='—';const reason=validation();if(reason){$('pp-summary').textContent=reason;note('');return}if(!sb||!config){$('pp-summary').textContent='Fiyat bağlantısı kurulamadı. Sayfayı yenileyin.';return}
 $('pp-summary').textContent='Güncel fiyat sunucuda hesaplanıyor…';priceTimer=setTimeout(async()=>{const {data,error}=await sb.rpc('plise_quote',optionParams());if(current!==version)return;if(error||!data){$('pp-summary').textContent='Fiyat alınamadı. Lütfen tekrar deneyin.';note(error?.message||'Fiyat servisi yanıt vermiyor.');return}price=data;$('pp-total').textContent=money(data.unit_total);$('pp-summary').textContent=selected.fabric+' plise · '+fmt(data.width_cm)+' × '+fmt(data.height_cm)+' cm · '+fmt(data.billed_sqm)+' m² üzerinden hesaplandı.';$('pp-add').disabled=false;note('')},320)}
async function init(){render();try{if(!sb)throw Error('Bağlantı bulunamadı.');const {data,error}=await sb.from('plise_config').select('*').eq('id',1).single();if(error||!data)throw error||Error('Fiyat tanımları yüklenemedi');config=data;if(!config.enabled)throw Error('Plise ürünü şu anda pasif');render();update()}catch(e){note('Fiyatlandırma yüklenemedi: '+e.message);$('pp-add').disabled=true}}
['pp-width','pp-height'].forEach(id=>$(id).addEventListener('input',update));
$('pp-search').addEventListener('input',render);
$('pp-note').addEventListener('input',e=>$('pp-note-count').textContent=e.target.value.length+' / 250');
$('pp-form').addEventListener('submit',e=>e.preventDefault());
$('pp-add').addEventListener('click',async()=>{if(busy||!sb)return;const problem=validation();if(problem){note(problem);return}
 busy=true;$('pp-add').disabled=true;note('Ürün fiyatı doğrulanıyor…');
 try{const params=optionParams();const {data,error}=await sb.rpc('plise_quote',params);if(error||!data)throw error||Error('Fiyat doğrulanamadı');const key='perdeKonagiCartV1';const items=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(items)||items.length>=50)throw Error('Sepet dolu ya da erişilemiyor.');
 items.push({id:crypto.randomUUID(),type:'plise',options:{p_slug:'plise-perde',...params},quote:data,quantity:1,orderNote:$('pp-note').value.trim(),added_at:new Date().toISOString()});
 localStorage.setItem(key,JSON.stringify(items));$('pp-cart-badge').textContent=String(items.reduce((n,a)=>n+Number(a.quantity||0),0));note('✓ Plise perde sepetinize eklendi. Sepetim bağlantısından kontrol edebilirsiniz.');
 }catch(e){note('Sepete eklenemedi: '+e.message)}finally{busy=false;update()}});
try{const x=JSON.parse(localStorage.getItem('perdeKonagiCartV1')||'[]');if(Array.isArray(x))$('pp-cart-badge').textContent=String(x.reduce((n,a)=>n+Number(a.quantity||0),0))}catch(_){}
init();
})();