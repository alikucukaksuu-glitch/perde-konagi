(()=>{
'use strict';
const url='https://rwylhxrtggsicieuyjrm.supabase.co',key='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const client=window.supabase?.createClient(url,key);
const el=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(Number(n)||0);
const day=d=>new Date(d).toLocaleDateString('tr-TR',{day:'2-digit',month:'short',year:'numeric'});
const statusText={draft:'Taslak',pending_payment:'Ödeme Bekliyor',paid:'Ödendi',processing:'Üretimde',shipped:'Kargolandı',completed:'Tamamlandı',cancelled:'İptal',refunded:'İade'};
const paidStatuses=['paid','processing','shipped','completed'];
let sessionUser=null,role=null,orders=[],orderItems=[],products=[],reviews=[],filter='pending',view='dashboard';
function message(txt){el('app-notice').textContent=txt||''}
function fill(node,children){node.replaceChildren(...children)}
function node(tag,content,cls){let x=document.createElement(tag);x.textContent=String(content??'');if(cls)x.className=cls;return x}
function empty(txt){return node('p',txt,'empty-text')}
function pimage(slug){return slug.startsWith('mat-stor-')?slug+'-1.webp':slug.replace('-zebra-perde','')+'-1.'+(slug.includes('siyah')?'png':'webp')}
function setText(id,value){let x=el(id);if(x)x.textContent=String(value)}
function sidebarGo(next){if(!['dashboard','orders','products','collections','customers','reviews','production','coupons','messages','reports','settings'].includes(next))return;view=next;document.querySelectorAll('.view').forEach(x=>x.hidden=x.id!=='view-'+next);document.querySelectorAll('[data-section]').forEach(x=>x.classList.toggle('active',x.dataset.section===next));const labels={dashboard:'Yönetim Paneli',orders:'Siparişler',products:'Ürünler',collections:'Koleksiyonlar',customers:'Müşteriler',reviews:'Yorumlar',production:'Üretim Takibi',coupons:'Kuponlar',messages:'Mesajlar',reports:'Raporlar',settings:'Ayarlar'};setText('page-heading',labels[next]);el('sidebar').classList.remove('open');location.hash=next==='dashboard'?'':next}
document.querySelectorAll('[data-section],[data-goto]').forEach(b=>b.addEventListener('click',()=>sidebarGo(b.dataset.section||b.dataset.goto)));
el('sidebar-toggle').onclick=()=>el('sidebar').classList.toggle('open');
async function signout(){await client?.auth.signOut();location.replace('admin.html')}
el('signout').onclick=signout;el('settings-signout').onclick=signout;
el('login-toggle-password').addEventListener('click',()=>{
 const field=el('login-password'),button=el('login-toggle-password');
 const visible=field.type==='password';field.type=visible?'text':'password';
 button.textContent=visible?'Gizle':'Göster';button.setAttribute('aria-pressed',String(visible));
});
el('login-form').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!client)return setText('login-status','Giriş servisine bağlanılamadı.');
 const btn=e.currentTarget.querySelector('button[type=submit]'),email=el('login-email').value.trim().toLowerCase(),password=el('login-password').value;
 if(!email||!password)return setText('login-status','Lütfen e-posta ve şifrenizi giriniz.');
 btn.disabled=true;setText('login-status','Giriş yapılıyor…');
 try{
  const {data,error}=await client.auth.signInWithPassword({email,password});
  if(error)throw error;
  if(!data?.user)throw Error('Oturum açılamadı.');
  const {data:access,error:accessError}=await client.from('admin_access').select('role').eq('user_id',data.user.id).maybeSingle();
  if(accessError)throw Error('Yönetici yetkisi kontrol edilemedi.');
  if(!access||!['owner','admin','staff'].includes(access.role)){
   await client.auth.signOut();
   setText('login-status','Bu hesap için yönetim paneli yetkisi yok.');
   return;
  }
  el('login-password').value='';
  setText('login-status','Giriş başarılı.');
  await boot();
 }catch(error){
  const m=String(error?.message||'');
  setText('login-status',/invalid login credentials/i.test(m)?'E-posta veya şifre hatalı.':/email not confirmed/i.test(m)?'E-posta hesabınız doğrulanmamış.':/rate.?limit/i.test(m)?'Çok fazla giriş denemesi yapıldı. Daha sonra tekrar deneyin.':m==='Yönetici yetkisi kontrol edilemedi.'?m:'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
 }finally{btn.disabled=false}
});
function stats(){const real=orders.filter(o=>paidStatuses.includes(o.status)),today=new Date().toLocaleDateString('en-CA'),month=today.slice(0,7),totalDay=real.filter(o=>new Date(o.created_at).toLocaleDateString('en-CA')===today).reduce((n,o)=>n+Number(o.total_amount),0),totalMonth=real.filter(o=>new Date(o.created_at).toLocaleDateString('en-CA').slice(0,7)===month).reduce((n,o)=>n+Number(o.total_amount),0);
setText('stat-orders',orders.length.toLocaleString('tr-TR'));setText('stat-production',orders.filter(o=>o.status==='processing'||o.status==='paid').length.toLocaleString('tr-TR'));setText('stat-today',money(totalDay));setText('stat-month',money(totalMonth));
return{real,totalDay,totalMonth}}
function orderTr(o,short=false){const tr=document.createElement('tr');const id=node('td','#PK-'+o.id.slice(0,8).toUpperCase(),'order-link'),customer=node('td',o.customer_id.slice(0,8)+'…');tr.append(id,customer);
if(short){const matching=orderItems.filter(i=>i.order_id===o.id);tr.append(node('td',matching.map(x=>x.product_title).slice(0,2).join(', ')||'—'))}
const statusCell=document.createElement('td');statusCell.append(node('span',statusText[o.status]||o.status,'order-status '+o.status));tr.append(statusCell,node('td',money(o.total_amount)),node('td',day(o.created_at)));return tr}
function renderOrders(){let sorted=orders.slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));const recent=el('recent-orders'),all=el('all-orders');fill(recent,sorted.length?sorted.slice(0,5).map(o=>orderTr(o,true)):[emptyTr(6,'Henüz sipariş bulunmuyor.')]);fill(all,sorted.length?sorted.map(o=>orderTr(o)):[emptyTr(5,'Henüz sipariş bulunmuyor.')])}
function emptyTr(n,text){let tr=document.createElement('tr'),td=node('td',text,'empty-row');td.colSpan=n;tr.append(td);return tr}
function renderProduction(){const stages=[['Hazırlanıyor','paid'],['Üretimde','processing'],['Kargoya Hazır','shipped'],['Tamamlandı','completed']];const total=orders.filter(o=>paidStatuses.includes(o.status)).length;const cards=stages.map(([label,status])=>{let n=orders.filter(o=>o.status===status).length;const item=document.createElement('div');item.className='production-stage';let top=node('div','','stage-top');top.append(node('strong',label),node('span',n+' sipariş'));const track=node('div','','production-track'),bar=node('div','','production-fill');bar.style.width=(total?Math.round(n/total*100):0)+'%';track.append(bar);item.append(top,track);return item});fill(el('production-bars'),cards);
const detail=document.createElement('div');detail.className='production-bars';detail.append(...cards.map(x=>x.cloneNode(true)));el('production-detail').replaceChildren(detail)}
function makeReviewCard(r,mode){let x=document.createElement('article');x.className='review-preview-card';let circle=node('div',(r.display_name||'M').slice(0,1).toUpperCase(),'person-badge');let main=node('div','','review-main');const heading=document.createElement('div');heading.append(node('strong',r.display_name||'Müşteri'),node('span','★'.repeat(r.rating)+'☆'.repeat(5-r.rating),'stars'));main.append(heading,node('small',day(r.created_at)+' • '+r.product_slug),node('p',r.comment||'Yazılı yorum yok.'));
if(r.status==='pending'){const actions=node('div','','moderation-buttons');let approve=node('button','✓ Onayla'),reject=node('button','✕ Reddet','reject');approve.type=reject.type='button';approve.onclick=()=>moderate(r,'approved',actions);reject.onclick=()=>moderate(r,'rejected',actions);actions.append(approve,reject);main.append(actions)}else main.append(node('small',r.status==='approved'?'Onaylandı':'Reddedildi'));x.append(circle,main);return x}
async function moderate(r,next,container){if(!['owner','admin'].includes(role)){message('Yorum onayı için yönetici yetkisi gerekiyor.');return}container.querySelectorAll('button').forEach(b=>b.disabled=true);try{const {error}=await client.from('product_reviews').update({status:next}).eq('id',r.id);if(error)throw error;r.status=next;renderReviews();message('Yorum durumu güncellendi.')}catch(e){message('Yorum güncellenemedi: '+e.message);container.querySelectorAll('button').forEach(b=>b.disabled=false)}}
function renderReviews(){const pending=reviews.filter(r=>r.status==='pending');setText('notification-count',pending.length);setText('pending-count',pending.length);el('pending-count').hidden=!pending.length;
const preview=pending.slice(0,3);fill(el('review-preview'),preview.length?preview.map(r=>makeReviewCard(r,'preview')):[empty('Onay bekleyen müşteri yorumu bulunmuyor.')]);
const selected=reviews.filter(r=>r.status===filter);fill(el('review-list'),selected.length?selected.map(r=>makeReviewCard(r,'all')):[empty('Bu kategoride yorum bulunmuyor.')])}
document.querySelectorAll('[data-review-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.reviewFilter;document.querySelectorAll('[data-review-filter]').forEach(x=>x.classList.toggle('active',x===b));renderReviews()}));
let editingProductSlug=null;
function openProductEditor(p){
 if(window.pkStudio?.open){window.pkStudio.open(p.slug);return}
 if(!['owner','admin'].includes(role)){message('Ürün düzenleme yetkiniz bulunmuyor.');return}
 editingProductSlug=p.slug;
 setText('product-edit-slug','Ürün kodu: '+p.slug);
 el('product-edit-title').value=p.title;
 el('product-edit-price').value=String(p.price_per_sqm);
 el('product-edit-active').checked=Boolean(p.is_active);
 setText('product-save-feedback','');
 el('product-editor').showModal();
}
function renderProducts(){
 const term=(el('product-search')?.value||'').toLocaleLowerCase('tr-TR').trim();
 const list=products.filter(p=>p.title.toLocaleLowerCase('tr-TR').includes(term)||p.slug.toLocaleLowerCase('tr-TR').includes(term));
 const rows=list.map(p=>{
  const tr=document.createElement('tr'),td=document.createElement('td'),a=document.createElement('a');
  a.href=p.collection==='tul'?'tul-perde.html?slug='+encodeURIComponent(p.slug):p.collection==='ahsap-jaluzi'?'ahsap-jaluzi.html?slug='+encodeURIComponent(p.slug):p.collection==='plise'?'plise-perde.html?slug='+encodeURIComponent(p.slug):(['bambu-bej-zebra-perde','bambu-beyaz-zebra-perde','bambu-gri-zebra-perde','bambu-kahve-zebra-perde','bambu-siyah-zebra-perde','bambu-siyah-gecisli-zebra-perde','mat-stor-krem','mat-stor-kirik-beyaz','mat-stor-gri','mat-stor-antrasit','mat-stor-kahve','mat-stor-mavi','mat-stor-siyah','mat-stor-turuncu'].includes(p.slug)?p.slug+'.html':'urun.html?slug='+encodeURIComponent(p.slug));a.target='_blank';a.rel='noopener';a.className='order-link';a.textContent=p.title;td.append(a);tr.append(td,node('td',p.collection==='tul'?'Tül Perde':p.collection==='ahsap-jaluzi'?'Ahşap Jaluzi Perde':p.collection==='plise'?'Plise Perde':p.collection==='zebra'?'Zebra Perde':'Mat Stor'),node('td',money(p.price_per_sqm)));
  const state=document.createElement('td'),status=node('span',p.visibility==='draft'?'Taslak':(p.is_active?'Satışta':'Satışa Kapalı'),'catalog-status '+(p.is_active?'yes':'no'));state.append(status);tr.append(state);
  const actions=document.createElement('td'),edit=node('button','Düzenle','catalog-edit');edit.type='button';edit.disabled=!['owner','admin'].includes(role);edit.addEventListener('click',()=>{if(['plise','ahsap-jaluzi','tul'].includes(p.collection)&&window.pkStudio?.open)window.pkStudio.open(p.slug);else openProductEditor(p)});actions.append(edit);tr.append(actions);
  return tr;
 });
 fill(el('product-list'),rows.length?rows:[emptyTr(5,'Eşleşen ürün bulunamadı.')]);
 setText('product-summary',products.length+' ürün · '+products.filter(p=>p.is_active).length+' satışta · '+products.filter(p=>!p.is_active).length+' kapalı');
 const groups=['zebra','mat-stor','plise','ahsap-jaluzi','tul'].map(cat=>{const count=products.filter(p=>p.collection===cat).length;const card=document.createElement('div');card.className='collection-card';card.append(node('h3',cat==='tul'?'Tül Perde':cat==='ahsap-jaluzi'?'Ahşap Jaluzi Perde':cat==='plise'?'Plise Perde':cat==='zebra'?'Zebra Perde':'Mat Stor'),node('strong',count+' ürün'),node('p','Ürün kataloğundan alınan güncel bilgi.'));return card});
 fill(el('collection-list'),groups)
}
el('product-search').addEventListener('input',renderProducts);
el('product-editor-close').addEventListener('click',()=>el('product-editor').close());
el('product-editor-cancel').addEventListener('click',()=>el('product-editor').close());
el('product-edit-form').addEventListener('submit',async event=>{
 event.preventDefault();
 if(!editingProductSlug||!['owner','admin'].includes(role))return;
 const title=el('product-edit-title').value.trim(),price=Number(el('product-edit-price').value),active=el('product-edit-active').checked;
 if(title.length<5||title.length>160||!Number.isFinite(price)||price<1||price>100000){setText('product-save-feedback','Geçerli ürün adı ve m² fiyatı giriniz.');return}
 const button=el('product-editor-save');button.disabled=true;setText('product-save-feedback','Kaydediliyor…');
 try{
  const {data,error}=await client.from('shop_products').update({title,price_per_sqm:price,is_active:active}).eq('slug',editingProductSlug).select('slug,title,collection,price_per_sqm,is_active').single();
  if(error||!data)throw error||new Error('Kayıt doğrulanamadı');
  const index=products.findIndex(p=>p.slug===editingProductSlug);if(index<0)throw new Error('Ürün listesi değişti');
  products[index]=data;renderProducts();message('✓ '+data.title+' güncellendi. Yeni sepette sunucu fiyatı kullanılacak.');
  setText('product-save-feedback','✓ Kaydedildi.');el('product-editor').close();
 }catch(error){setText('product-save-feedback','Kaydetme başarısız: '+(error?.message||'Bilinmeyen hata'))}
 finally{button.disabled=false}
});
function renderTopProducts(){const sums=new Map();for(const item of orderItems){if(!orders.some(o=>o.id===item.order_id&&paidStatuses.includes(o.status)))continue;const old=sums.get(item.product_slug)||{name:item.product_title,count:0,sales:0};old.count+=item.quantity;old.sales+=Number(item.line_total);sums.set(item.product_slug,old)}const ranked=[...sums.entries()].sort((a,b)=>b[1].count-a[1].count).slice(0,3);fill(el('top-products'),ranked.length?ranked.map(([slug,d])=>{let row=node('div','','mini-product'),img=document.createElement('img');img.src=pimage(slug);img.alt=d.name;img.loading='lazy';let details=node('div','','details');details.append(node('strong',d.name),node('small',d.count+' adet • '+money(d.sales)));row.append(img,details);return row}):[empty('Henüz satış verisi yok.')])}
function renderCustomers(){const ids=new Set(orders.map(o=>o.customer_id));el('customer-list').replaceChildren(empty(ids.size?'Sipariş oluşturmuş '+ids.size+' farklı müşteri hesabı var. Kişisel bilgi alanları güvenli sipariş sistemiyle tamamlanacak.':'Henüz müşteri siparişi bulunmuyor.'))}
function renderChart(id){const target=el(id);target.replaceChildren();const today=new Date();let points=[],labels=[];for(let i=29;i>=0;i--){let d=new Date(today.getFullYear(),today.getMonth(),today.getDate()-i);let iso=d.toLocaleDateString('en-CA');labels.push(d.getDate()+'/'+(d.getMonth()+1));points.push(orders.filter(o=>paidStatuses.includes(o.status)&&new Date(o.created_at).toLocaleDateString('en-CA')===iso).reduce((n,o)=>n+Number(o.total_amount),0))}
const max=Math.max(100,...points),width=600,height=220;const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 600 240');svg.setAttribute('role','img');svg.setAttribute('aria-label','Son 30 günlük gerçek satışlar grafiği');
function line(x1,y1,x2,y2,color='#ded5cb'){const a=document.createElementNS(svg.namespaceURI,'line');Object.entries({x1,y1,x2,y2,stroke:color,'stroke-width':'1'}).forEach(([k,v])=>a.setAttribute(k,v));svg.append(a)}
for(let n=0;n<5;n++){let y=20+n*43;line(45,y,584,y);const t=document.createElementNS(svg.namespaceURI,'text');t.setAttribute('x','37');t.setAttribute('y',y+4);t.setAttribute('text-anchor','end');t.setAttribute('font-size','10');t.setAttribute('fill','#82796f');t.textContent=Math.round((4-n)*max/4).toLocaleString('tr-TR');svg.append(t)}
let coords=points.map((v,i)=>[45+i*539/29,192-v/max*172]);const shape=document.createElementNS(svg.namespaceURI,'path');shape.setAttribute('d','M '+coords.map(p=>p.join(',')).join(' L '));shape.setAttribute('stroke','#9e7b52');shape.setAttribute('stroke-width','3');shape.setAttribute('fill','none');svg.append(shape);
for(let i of [0,7,14,21,29]){const t=document.createElementNS(svg.namespaceURI,'text');t.setAttribute('x',coords[i][0]);t.setAttribute('y','219');t.setAttribute('font-size','11');t.setAttribute('text-anchor','middle');t.setAttribute('fill','#82796f');t.textContent=labels[i];svg.append(t)}
target.append(svg);if(!points.some(Boolean))target.append(node('p','Henüz ödenmiş sipariş olmadığından grafik sıfır gösteriyor.','empty-text'))}
function renderReports(s){const holder=el('report-stats');holder.replaceChildren();[['Toplam Sipariş',orders.length],['Onaylı Ödeme',s.real.length],['Bugünkü Satış',money(s.totalDay)],['Aylık Ciro',money(s.totalMonth)]].forEach(([label,value])=>{const card=node('div','','stat-card');const body=node('div','','stat-body');body.append(node('span',label),node('strong',value));card.append(body);holder.append(card)});renderChart('sales-chart');renderChart('reports-chart')}
async function loadData(){message('Güncel bilgiler yükleniyor…');const queries=await Promise.all([client.from('shop_orders').select('id,customer_id,status,total_amount,created_at').order('created_at',{ascending:false}).limit(500),client.from('shop_order_items').select('order_id,product_slug,product_title,quantity,line_total').limit(1000),client.from('shop_products').select('slug,title,collection,price_per_sqm,is_active,visibility').order('title'),client.from('product_reviews').select('id,display_name,product_slug,rating,comment,status,created_at').order('created_at',{ascending:false}).limit(500)]);
const names=['siparişler','sipariş kalemleri','ürünler','yorumlar'];let errors=queries.map((q,i)=>q.error?names[i]+': '+q.error.message:'').filter(Boolean);[orders,orderItems,products,reviews]=queries.map(q=>q.data||[]);renderOrders();renderProduction();renderProducts();renderReviews();renderTopProducts();renderCustomers();renderReports(stats());message(errors.length?'Bazı veriler yüklenemedi: '+errors.join(' · '):'Gerçek verilerle güncellendi. Ödeme sistemi açılana kadar satış rakamları sıfır olabilir.')}
function searchText(t){const q=t.toLocaleLowerCase('tr-TR').trim();document.querySelectorAll('#product-list tr,#all-orders tr').forEach(row=>{row.hidden=Boolean(q&&!row.textContent.toLocaleLowerCase('tr-TR').includes(q))})}
el('global-search').addEventListener('input',e=>{searchText(e.target.value);if(e.target.value&&view!=='orders'&&view!=='products')sidebarGo('products')});
async function boot(){
if(!client){setText('login-status','Giriş servisine bağlanılamadı.');return}
try{const {data,error}=await client.auth.getUser();if(error||!data?.user){el('login-screen').hidden=false;return}
sessionUser=data.user;const {data:allowed,error:roleError}=await client.from('admin_access').select('role').eq('user_id',sessionUser.id).maybeSingle();
if(roleError||!allowed){el('login-screen').hidden=false;setText('login-status','Bu hesap için yönetim paneli yetkisi tanımlanmamış. Yönetici erişimi açılmadan panel görüntülenemez.');return}
role=allowed.role;setText('account-label',sessionUser.email?.split('@')[0]||'Yönetici');setText('account-role',role==='owner'?'Kurucu':role==='admin'?'Admin':'Personel');setText('admin-email',sessionUser.email||'');
el('login-screen').hidden=true;el('admin-app').hidden=false;sidebarGo(location.hash.slice(1)||'dashboard');await loadData();
}catch(e){el('login-screen').hidden=false;setText('login-status','Yönetici oturumu kontrol edilemedi. Lütfen yeniden deneyin.')}
}
boot();
})();