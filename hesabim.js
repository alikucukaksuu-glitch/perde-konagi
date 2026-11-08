(()=>{'use strict';
const sb=window.supabase?.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const $=x=>document.getElementById(x);
const stages=['received','measure_approved','preparing','production','ready','shipped','delivered'];
const labels=['Sipariş Alındı','Ölçü Onayı','Hazırlanıyor','Üretimde','Kargoya Hazır','Kargoda','Teslim Edildi'];
const text=(tag,cls,s)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(s!=null)el.textContent=String(s);return el};
const money=v=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(v)||0);
const date=v=>new Date(v).toLocaleDateString('tr-TR');
let busy=false;
async function load(){if(!sb||busy)return;busy=true;try{
 const {data:{user},error}=await sb.auth.getUser();
 $('login').hidden=Boolean(user);$('account').hidden=!user;
 if(error||!user)return;
 $('who').textContent=user.email||'Üyelik hesabım';
 const res=await Promise.all([sb.from('shop_orders').select('id,customer_id,status,total_amount,created_at,customer_note').eq('customer_id',user.id).order('created_at',{ascending:false}).limit(100),
 sb.from('shop_order_items').select('order_id,product_title,width_cm,height_cm,quantity,options').limit(500),
 sb.from('shop_order_progress').select('order_id,stage,due_date,tracking_no,updated_at').limit(100)]);
 for(const v of res)if(v.error)throw v.error;
 const [orders,items,progress]=res.map(v=>v.data||[]);
 const box=$('my-orders');box.replaceChildren();
 if(!orders.length){box.append(text('div','card','Henüz bu üyelik hesabına ait bir sipariş bulunmuyor. Satın alma sistemi etkinleştirildiğinde siparişleriniz burada görünecek.'));return}
 for(const o of orders){
 const p=progress.find(x=>x.order_id===o.id)||{};
 const stage=p.stage||(o.status==='completed'?'delivered':o.status==='shipped'?'shipped':o.status==='processing'?'production':'received');
 const idx=stages.indexOf(stage);
 const card=text('article','card');
 card.append(text('h2','','Sipariş #PK-'+o.id.slice(0,8).toUpperCase()),text('span','status',labels[idx]),text('p','',date(o.created_at)+' · '+money(o.total_amount)));
 const own=items.filter(i=>i.order_id===o.id);
 const lines=text('div','order-items');own.forEach(i=>lines.append(text('p','',i.product_title+' · '+i.width_cm+' × '+i.height_cm+' cm · '+i.quantity+' adet')));card.append(lines);
 const timeline=text('div','steps');labels.forEach((label,i)=>{const c=text('div','step '+(i<idx?'passed':i===idx?'now':''));c.append(text('i','',i<idx?'✓':String(i+1)),text('span','',label));timeline.append(c)});card.append(timeline);
 if(p.due_date)card.append(text('p','','Planlanan termin: '+p.due_date));
 if(p.tracking_no)card.append(text('p','','Kargo takip numarası: '+p.tracking_no));
 box.append(card);
 }
 }catch(e){$('my-orders').replaceChildren(text('div','card','Siparişler yüklenemedi: '+(e.message||'Bağlantı sorunu')))}finally{busy=false}}
$('login-form').onsubmit=async e=>{e.preventDefault();if(!sb)return;$('login-message').textContent='Giriş bağlantısı gönderiliyor…';const btn=e.currentTarget.querySelector('button');btn.disabled=true;try{const email=$('email').value.trim();const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname,shouldCreateUser:true}});if(error)throw error;$('login-message').textContent='Giriş bağlantısı e-posta adresinize gönderildi. Gelen bağlantıyla hesabınıza giriş yapabilirsiniz.'}catch(err){$('login-message').textContent='Giriş bağlantısı gönderilemedi: '+err.message}finally{btn.disabled=false}};
$('logout').onclick=async()=>{await sb?.auth.signOut();$('my-orders').replaceChildren();load()};
$('refresh').onclick=load;
sb?.auth.onAuthStateChange((event)=>{if(['SIGNED_IN','SIGNED_OUT','INITIAL_SESSION'].includes(event))setTimeout(load,30)});
load();
})();