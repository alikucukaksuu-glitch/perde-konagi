(()=>{'use strict';
const sb=window.supabase?.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const $=id=>document.getElementById(id);
const make=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e};
const stages=['received','measure_approved','preparing','production','ready','shipped','delivered'];
const titles=['Sipariş Alındı','Ölçü Onayı','Hazırlanıyor','Üretimde','Kargoya Hazır','Kargoda','Teslim Edildi'];
const money=v=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(v)||0);
const day=v=>v?new Date(v).toLocaleDateString('tr-TR'):'—';
const images={};
const fallback=slug=>slug?.startsWith('mat-stor-')?slug+'-1.webp':slug?.startsWith('bambu-')?(slug.replace('-zebra-perde','').replace('bambu-siyah-gecisli','bambu-siyah-gecisli')+'-1.'+(slug.includes('siyah')?'png':'webp')):'zebra-koleksiyon.png';
let user=null,orders=[],items=[],progress=[],addresses=[],favorites=[],products=[],busy=false,mode='',editing=null,request=0;
function accountName(){const x=user?.user_metadata||{};return String(x.full_name||[x.first_name,x.last_name].filter(Boolean).join(' ')||'Üye').trim().slice(0,120)}
function phone(){return String(user?.user_metadata?.phone_number||'').trim()}
function showLogin(){const signed=!!user;$('login').hidden=signed;$('account').hidden=!signed}
function accountInfo(){
 $('ac-display-name').textContent=accountName();$('ac-name').textContent=accountName();
 $('ac-email').textContent=user.email||'—';$('who').textContent=user.email||'—';
 $('ac-phone').textContent=phone()||'Telefon eklenmedi';$('ac-phone-short').textContent=phone()||'Telefon eklenmedi';
 $('ac-date').textContent=day(user.created_at);$('ac-member-date').textContent='Üyelik: '+day(user.created_at)
}
function stats(){
 const stage=o=>progress.find(p=>p.order_id===o.id)?.stage||(o.status==='completed'?'delivered':o.status==='shipped'?'shipped':o.status==='processing'?'production':'received');
 $('ac-count-all').textContent=orders.length;
 $('ac-count-prep').textContent=orders.filter(o=>['received','measure_approved','preparing','production','ready'].includes(stage(o))&&!['draft','pending_payment','cancelled','refunded'].includes(o.status)).length;
 $('ac-count-ship').textContent=orders.filter(o=>stage(o)==='shipped').length;
 $('ac-count-done').textContent=orders.filter(o=>stage(o)==='delivered').length;
}
function orderUI(){const target=$('ac-order-list');target.replaceChildren();
 if(!orders.length){target.append(make('p','ac-empty','Henüz bu üyelik hesabına ait sipariş bulunmuyor. Siparişler oluştuğunda burada takip edebileceksiniz.'));return}
 for(const o of orders){const lines=items.filter(i=>i.order_id===o.id);const p=progress.find(x=>x.order_id===o.id)||{};
 const stage=p.stage||(o.status==='completed'?'delivered':o.status==='shipped'?'shipped':o.status==='processing'?'production':'received'),idx=Math.max(0,stages.indexOf(stage));
 const card=make('article','ac-order');
 const image=make('img');image.alt='Sipariş ürünü';image.loading='lazy';image.src=fallback(lines[0]?.product_slug);image.onerror=()=>{image.src='zebra-koleksiyon.png';image.onerror=null};
 const main=make('div');const top=make('div','ac-order-top'),title=make('h3','', 'Sipariş #PK-'+o.id.slice(0,8).toUpperCase()),badge=make('span','ac-status'+(idx===6?' done':''),titles[idx]);
 top.append(title,badge);main.append(top,make('p','',lines.map(i=>i.product_title+' · '+i.width_cm+' × '+i.height_cm+' cm · '+i.quantity+' adet').join(' | ')||'Sipariş kalemi bulunamadı.'),make('p','','Sipariş Tarihi: '+day(o.created_at)+'　·　 Toplam: '+money(o.total_amount)));
 const steps=make('div','ac-steps');titles.forEach((label,i)=>{const w=make('div','ac-step '+(i<idx?'passed':i===idx?'current':''));w.append(make('i','',i<idx?'✓':i+1),make('span','',label));steps.append(w)});
 main.append(steps);if(p.due_date)main.append(make('p','','Planlanan termin: '+day(p.due_date)));if(p.tracking_no)main.append(make('p','','Kargo takip numarası: '+p.tracking_no));
 card.append(image,main);target.append(card)}
}
function addressUI(){const box=$('ac-address-list');box.replaceChildren();if(!addresses.length){box.append(make('p','ac-empty','Henüz adres kaydetmediniz. Teslimat ve fatura adreslerinizi ekleyebilirsiniz.'));return}
 addresses.forEach(a=>{const w=make('article','ac-address'),line=make('div'),title=make('strong','',(a.address_type==='billing'?'Fatura: ':'Teslimat: ')+a.label);line.append(title);if(a.is_default)line.append(make('span','ac-default','Varsayılan'));w.append(line,make('p','',a.recipient_name+' · '+a.phone),make('p','',a.address_line+' · '+a.district+' / '+a.city+(a.postal_code?' '+a.postal_code:'')));
 const controls=make('div','ac-address-actions'),edit=make('button','','Düzenle'),remove=make('button','','Sil');edit.type=remove.type='button';edit.onclick=()=>openAddress(a);remove.onclick=async()=>{if(!confirm('Bu adres silinsin mi?'))return;const res=await sb.from('customer_addresses').delete().eq('id',a.id).eq('user_id',user.id);if(res.error)alert(res.error.message);else await loadData()};controls.append(edit,remove);w.append(controls);box.append(w)})}
function favoriteUI(){const box=$('ac-fav-list');box.replaceChildren();if(!favorites.length){const p=make('p','ac-empty','Henüz favori ürün eklemediniz. Beğendiğiniz perdeleri buradan takip edebilirsiniz.'),a=make('a','ac-text-button','Ürünleri İncele →');a.href='zebra-perde.html';box.append(p,a);return}
 for(const f of favorites){const p=products.find(x=>x.slug===f.product_slug),card=make('div','ac-fav'),img=make('img');img.alt=p?.title||'Perde';img.src=fallback(f.product_slug);img.onerror=()=>{img.src='zebra-koleksiyon.png';img.onerror=null};const details=make('div'),link=make('a','',p?.title||f.product_slug);link.href=f.product_slug.startsWith('mat-stor-')||f.product_slug.startsWith('bambu-')?f.product_slug+'.html':'urun.html?slug='+encodeURIComponent(f.product_slug);details.append(link,make('small','',p?.price_per_sqm?money(p.price_per_sqm)+' / m²':''));const del=make('button','','♥');del.title='Favorilerden çıkar';del.onclick=async()=>{const q=await sb.from('customer_favorites').delete().eq('user_id',user.id).eq('product_slug',f.product_slug);if(q.error)alert(q.error.message);else{favorites=favorites.filter(x=>x.product_slug!==f.product_slug);favoriteUI()}};card.append(img,details,del);box.append(card)}
}
async function loadData(){if(!user||busy)return;busy=true;const version=++request;try{
 const a=await Promise.all([sb.from('shop_orders').select('id,customer_id,status,total_amount,created_at').eq('customer_id',user.id).order('created_at',{ascending:false}).limit(100),sb.from('customer_addresses').select('*').eq('user_id',user.id).order('is_default',{ascending:false}),sb.from('customer_favorites').select('product_slug,created_at').eq('user_id',user.id).order('created_at',{ascending:false}),sb.from('shop_products').select('slug,title,price_per_sqm').eq('is_active',true)]);
 for(const x of a)if(x.error)throw x.error;
 if(version!==request)return;
 orders=a[0].data||[];addresses=a[1].data||[];favorites=a[2].data||[];products=a[3].data||[];
 const ids=orders.map(x=>x.id);
 if(ids.length){const b=await Promise.all([sb.from('shop_order_items').select('order_id,product_slug,product_title,width_cm,height_cm,quantity').in('order_id',ids),sb.from('shop_order_progress').select('order_id,stage,due_date,tracking_no').in('order_id',ids)]);for(const x of b)if(x.error)throw x.error;items=b[0].data||[];progress=b[1].data||[]}else{items=[];progress=[]}
 stats();orderUI();addressUI();favoriteUI();
 }catch(e){$('ac-order-list').replaceChildren(make('p','ac-empty','Veriler yüklenemedi: '+e.message))}finally{busy=false}}
function openModal(title,kind,record){mode=kind;editing=record||null;$('ac-modal-title').textContent=title;$('ac-modal-message').textContent='';$('ac-modal-fields').replaceChildren();$('ac-modal').hidden=false;setTimeout(()=>$('ac-modal-fields').querySelector('input')?.focus(),30)}
function field(key,label,type,value,required=true){const l=make('label','',label),input=type==='textarea'?make('textarea'):type==='select'?make('select'):make('input');input.name=key;if(type!=='textarea'&&type!=='select')input.type=type;input.value=value||'';input.required=required;input.maxLength=type==='textarea'?500:120;l.append(input);$('ac-modal-fields').append(l);return input}
function openProfile(){openModal('Üyelik Bilgilerini Düzenle','profile');field('full_name','Ad Soyad','text',accountName()==='Üye'?'':accountName());field('phone_number','Telefon','tel',phone(),false)}
function openAddress(a){openModal(a?'Adresi Düzenle':'Yeni Adres Ekle','address',a);field('label','Adres Başlığı','text',a?.label||'Ev');field('recipient_name','Alıcı Ad Soyad','text',a?.recipient_name||accountName().replace(/^Üye$/,''));field('phone','Telefon','tel',a?.phone||phone());field('address_line','Açık Adres','textarea',a?.address_line||'');field('district','İlçe','text',a?.district||'');field('city','İl','text',a?.city||'');field('postal_code','Posta Kodu','text',a?.postal_code||'',false);
 const l=make('label','','Adres Türü'),select=make('select');select.name='address_type';[['delivery','Teslimat'],['billing','Fatura']].forEach(([v,t])=>{const o=make('option','',t);o.value=v;select.append(o)});select.value=a?.address_type||'delivery';l.append(select);$('ac-modal-fields').append(l);
 const check=make('label','','Varsayılan adres olarak kullan'),input=make('input');input.type='checkbox';input.name='is_default';input.checked=a?.is_default||false;input.style.width='auto';check.prepend(input);$('ac-modal-fields').append(check)}
async function saveModal(e){e.preventDefault();if(!user)return;const form=e.currentTarget,button=form.querySelector('[type=submit]');button.disabled=true;$('ac-modal-message').textContent='Kaydediliyor…';try{
 const fd=new FormData(form);let error=null;
 if(mode==='password_reset'){
  const newPassword=String(fd.get('new_password')||'');
  if(newPassword.length<8)throw Error('Şifreniz en az 8 karakter olmalıdır.');
  const r=await sb.auth.updateUser({password:newPassword});error=r.error;
 }else if(mode==='profile'){
 const name=String(fd.get('full_name')||'').trim(),phone=String(fd.get('phone_number')||'').trim();if(name.length<2||name.length>120)throw Error('Ad soyad 2–120 karakter olmalıdır.');if(phone&&!/^[+0-9 ()-]{7,25}$/.test(phone))throw Error('Telefon numarası geçerli değil.');
 const res=await sb.auth.updateUser({data:{full_name:name,phone_number:phone}});error=res.error;if(!error)user=res.data.user;
 }else{
 const v=Object.fromEntries(['label','recipient_name','phone','address_line','district','city','postal_code','address_type'].map(k=>[k,String(fd.get(k)||'').trim()]));v.user_id=user.id;v.is_default=fd.has('is_default');
 if(v.label.length<1||v.recipient_name.length<2||v.phone.length<7||v.address_line.length<10||v.district.length<2||v.city.length<2)throw Error('Lütfen alıcı, telefon ve adres bilgilerini eksiksiz doldurun.');
 if(v.is_default){const q=await sb.from('customer_addresses').update({is_default:false}).eq('user_id',user.id).eq('address_type',v.address_type).eq('is_default',true);if(q.error)throw q.error}
 const res=editing?await sb.from('customer_addresses').update(v).eq('id',editing.id).eq('user_id',user.id):await sb.from('customer_addresses').insert(v);error=res.error;
 }
 if(error)throw error;
 $('ac-modal').hidden=true;accountInfo();await loadData();
 }catch(e){$('ac-modal-message').textContent='Kaydedilemedi: '+e.message}finally{button.disabled=false}}
function init(){if(!sb){$('login-message').textContent='Giriş servisine bağlanılamadı.';return}
 const authMessage=(id,message)=>{$(id).textContent=message};
 const cleanError=error=>{const x=String(error?.message||'');if(/invalid login credentials/i.test(x))return 'E-posta veya şifre hatalı.';if(/email not confirmed/i.test(x))return 'E-posta doğrulaması hâlâ açık. Yönetici tarafından Supabase e-posta onayı kapatılmalıdır.';if(/already registered|user already registered/i.test(x))return 'Bu e-posta ile üyelik mevcut. Giriş yapın veya şifrenizi yenileyin.';if(/password/i.test(x)&&/weak|short|least/i.test(x))return 'Daha güçlü, en az 8 karakterli bir şifre seçiniz.';return x||'İşlem gerçekleştirilemedi.'};
 $('login-form').onsubmit=async e=>{
  e.preventDefault();const button=e.currentTarget.querySelector('button[type=submit]');button.disabled=true;authMessage('login-message','Giriş yapılıyor…');
  try{
   const email=$('email').value.trim().toLowerCase(),password=$('login-password').value;
   const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;
   if(!data?.session)throw Error('Oturum açılamadı. Lütfen tekrar deneyin.');
   authMessage('login-message','Giriş başarılı. Hesabınız açılıyor…');await refreshAuth();
  }catch(err){authMessage('login-message',cleanError(err))}finally{button.disabled=false}
 };
 $('ac-signup-form').onsubmit=async e=>{
  e.preventDefault();const button=e.currentTarget.querySelector('button[type=submit]');button.disabled=true;authMessage('ac-signup-message','Üyeliğiniz oluşturuluyor…');
  try{
   const name=$('ac-signup-name').value.trim(),email=$('ac-signup-email').value.trim().toLowerCase(),phone=$('ac-signup-phone').value.trim(),password=$('ac-signup-password').value;
   if(name.length<2||name.length>120)throw Error('Ad soyad 2–120 karakter olmalıdır.');
   if(!/^[+0-9 ()-]{7,25}$/.test(phone))throw Error('Geçerli bir telefon numarası giriniz.');
   if(password.length<8)throw Error('Şifreniz en az 8 karakter olmalıdır.');
   if(!$('ac-terms').checked)throw Error('Üyelik koşullarını kabul etmeniz gerekiyor.');
   const {data,error}=await sb.auth.signUp({email,password,options:{data:{full_name:name,phone_number:phone}}});if(error)throw error;
   if(data?.session?.user){
    authMessage('ac-signup-message','Üyeliğiniz oluşturuldu. Hesabınız açılıyor…');
    await refreshAuth();
   }else{
    authMessage('ac-signup-message','Hesabınız henüz oturum açamadı. Supabase e-posta doğrulaması açık olabilir; anında üyelik için bu ayarın kapatılması gerekir.');
   }
  }catch(err){authMessage('ac-signup-message',cleanError(err))}finally{button.disabled=false}
 };
 $('ac-magic-form').onsubmit=async e=>{
  e.preventDefault();const button=e.currentTarget.querySelector('button[type=submit]');button.disabled=true;
  try{
   const email=($('ac-magic-email').value||$('email').value).trim().toLowerCase();
   if(!email)throw Error('Lütfen önce e-posta adresinizi girin.');
   const {error}=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:location.origin+location.pathname}});
   if(error)throw error;authMessage('login-message','Giriş bağlantısı e-posta adresinize gönderildi.');
  }catch(err){authMessage('login-message',cleanError(err))}finally{button.disabled=false}
 };
 $('ac-forgot').onclick=async()=>{
  const email=($('email').value||'').trim().toLowerCase();if(!email){authMessage('login-message','Şifre yenilemek için e-posta adresinizi giriniz.');return}
  const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
  authMessage('login-message',error?cleanError(error):'Bu e-posta için hesap varsa şifre yenileme bağlantısı gönderilir.');
 };
 $('logout').onclick=async()=>{await sb.auth.signOut();user=null;orders=[];items=[];progress=[];showLogin()};
 $('refresh').onclick=()=>loadData();$('ac-edit-profile').onclick=$('ac-edit-profile-side').onclick=openProfile;$('ac-add-address').onclick=()=>openAddress(null);
 $('ac-all-favorites').onclick=()=>{const el=$('ac-favorites');el.scrollIntoView({behavior:'smooth',block:'center'})};
 $('ac-modal-close').onclick=$('ac-modal-cancel').onclick=()=>{$('ac-modal').hidden=true};
 $('ac-modal-form').onsubmit=saveModal;
 $('ac-modal').onclick=e=>{if(e.target===$('ac-modal'))$('ac-modal').hidden=true};
 document.addEventListener('keydown',e=>{if(e.key==='Escape')$('ac-modal').hidden=true});
 sb.auth.onAuthStateChange((event)=>{if(['SIGNED_IN','SIGNED_OUT','USER_UPDATED','INITIAL_SESSION','PASSWORD_RECOVERY'].includes(event))setTimeout(()=>{refreshAuth();if(event==='PASSWORD_RECOVERY')openPasswordReset()},25)});
 refreshAuth();
}
function openPasswordReset(){
 openModal('Yeni Şifre Belirle','password_reset');
 field('new_password','Yeni şifre (en az 8 karakter)','password','');
}
async function refreshAuth(){if(!sb)return;const {data,error}=await sb.auth.getUser();if(error){user=null;showLogin();return}const previous=user?.id;user=data.user||null;showLogin();if(user){accountInfo();if(previous!==user.id||!orders.length)loadData()}}
init();
})();