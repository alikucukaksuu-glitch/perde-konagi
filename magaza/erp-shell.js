(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co',KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const menus={orders:'orders.html?v=receive-number-shortcut-20261127b',quotes:'quotes.html',appointments:'appointments.html?v=whatsapp-popup-fix-20261118',missing:'missing.html?v=accessory-pdf-whatsapp-20261125',products:'hub.html?tab=products&v=product-actions-20261125',workshop:'hub.html?tab=workshop',customers:'hub.html?tab=customers',cash:'cash-approval.html?v=manager-approval-20261125',reports:'reports.html',calendar:'calendar.html',notifications:'notifications.html?v=notify-client-v2-20261120',company:'company.html#account'};
const defaults={orders:true,quotes:true,appointments:true,missing:true,products:true,workshop:true,customers:true,cash:false,reports:false,calendar:true,notifications:true,company:true};
const stage=document.getElementById('erp-shell-stage'),notice=document.getElementById('erp-shell-notice'),navigation=document.querySelector('.erp-shell-nav');
const frames=new Map(),allowed={...defaults};let selected='',orgId='',authenticated=false;
const mobileToggle=document.querySelector('.erp-mobile-toggle');
function closeMobileMenu(){navigation.classList.remove('open');mobileToggle?.setAttribute('aria-expanded','false')}
mobileToggle?.addEventListener('click',event=>{event.stopPropagation();const open=navigation.classList.toggle('open');mobileToggle.setAttribute('aria-expanded',String(open))});
document.addEventListener('click',event=>{if(!event.target.closest('.erp-shell-nav,.erp-mobile-toggle'))closeMobileMenu()});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMobileMenu()});

const client=window.__konakErpClient||(window.__konakErpClient=window.supabase?.createClient(API,KEY));
function routeFromUrl(raw){
 const url=new URL(raw,location.href),path=url.pathname;
 if(url.origin!==location.origin||!path.startsWith('/magaza/'))return null;
 if(path.endsWith('/order-new.html'))return null;
 if(path.endsWith('/quotes.html'))return 'quotes';
 if(path.endsWith('/appointments.html'))return 'appointments';
 if(path.endsWith('/missing.html'))return 'missing';
 if(path.endsWith('/cash.html')||path.endsWith('/cash-approval.html'))return 'cash';
 if(path.endsWith('/reports.html'))return 'reports';
 if(path.endsWith('/calendar.html'))return 'calendar';
 if(path.endsWith('/notifications.html'))return 'notifications';
 if(path.endsWith('/company.html'))return 'company';
 if(path.endsWith('/hub.html'))return ['products','workshop','customers'].includes(url.searchParams.get('tab'))?url.searchParams.get('tab'):'products';
 if(path.endsWith('/orders.html')||path.endsWith('/index.html')||path==='/magaza/')return 'orders';
 return null;
}
function iframeAddress(view){const [base,fragment]=menus[view].split('#'),url=new URL(base,location.href);url.searchParams.set('embedded','1');const requestedOrg=orgId||new URLSearchParams(location.search).get('org');if(requestedOrg&&view!=='company')url.searchParams.set('org',requestedOrg);if(view==='orders'){const initial=new URLSearchParams(location.search);for(const key of ['scan','received'])if(initial.has(key))url.searchParams.set(key,initial.get(key)||'1')}return url.href+(fragment?'#'+fragment:'')}
function hideEmbeddedChrome(frame){
 try{
  const doc=frame.contentDocument;if(!doc)return;
  if(!doc.getElementById('konak-shell-embedded-style')){
   const style=doc.createElement('style');style.id='konak-shell-embedded-style';
   style.textContent='header.topbar, footer, .foot {display:none !important} body {background:#f5f7f6 !important} main.shell, main.hub-main {padding-top:24px !important}';
   doc.head.append(style);
  }
  doc.addEventListener('click',event=>{
   const link=event.target.closest?.('a[href]');if(!link||link.target==='_blank'||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   const view=routeFromUrl(link.href);
   if(view&&allowed[view]!==false){event.preventDefault();event.stopPropagation();navigate(view,true)}
  },true);
 }catch(error){/* Files outside this origin retain their normal navigation. */}
}
function ensureFrame(view){
 if(frames.has(view))return frames.get(view);
 const frame=document.createElement('iframe');frame.className='erp-shell-page';frame.title='KONAK ERP '+view;frame.setAttribute('allow','camera; clipboard-write');frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
 const record={frame,loaded:false};frames.set(view,record);
 frame.addEventListener('load',()=>{
  try{
   const url=new URL(frame.contentWindow.location.href);
   if(url.pathname==='/magaza/'||url.pathname.endsWith('/index.html')){
    if(view==='orders'){frame.src=iframeAddress('orders');return}
    frame.remove();frames.delete(view);navigate('orders',true);return;
   }
  }catch(e){}
  hideEmbeddedChrome(frame);record.loaded=true;
  if(selected===view){showFrame(view);notice.hidden=true}
 });
 stage.append(frame);frame.src=iframeAddress(view);
 return record;
}
function showFrame(view){
 for(const [key,value] of frames)value.frame.classList.toggle('active',key===view);
}
function navigate(view,push){
 if(!menus[view]||allowed[view]===false)return;
 selected=view;
 closeMobileMenu();
 document.querySelectorAll('[data-view]').forEach(node=>{if(node.tagName==='A'){if(node.dataset.view===view)node.setAttribute('aria-current','page');else node.removeAttribute('aria-current')}});
 if(push&&view==='orders'){
  const orders=frames.get('orders');
  const currentPath=orders?.frame.contentDocument?.location.pathname;
  if(orders?.loaded&&currentPath&&currentPath!==new URL(menus.orders,location.href).pathname){
   orders.frame.remove();
   frames.delete('orders');
  }
 }
 const record=ensureFrame(view);
 if(record.loaded){showFrame(view);notice.hidden=true;if(view==='orders')record.frame.contentWindow.postMessage({type:'konak-erp-refresh-orders'},location.origin)}
 else{notice.textContent='Bölüm açılıyor...';notice.hidden=false}
 if(push){const url=new URL(location.href);url.searchParams.set('view',view);history.pushState({view},'',url.pathname+url.search+url.hash)}
 document.title='KONAK ERP | '+({orders:'Siparişler',quotes:'Teklif Siparişleri',appointments:'Montaj Randevu',missing:'Eksik Ürünler',products:'Ürünler',workshop:'Atölye',customers:'Müşteriler',cash:'Kasa',reports:'Raporlar',calendar:'Takvim',notifications:'Bildirim Merkezi',company:'Hesabım'}[view]||'Mağaza');
}
async function initialize(){
 authenticated=false;
 Object.assign(allowed,defaults);
 try{
  const session=(await client.auth.getSession()).data?.session;
  if(session?.user){
   authenticated=true;
   const {data:members,error}=await client.from('erp_members').select('organization_id,role').eq('user_id',session.user.id);
   if(error)throw error;
   const chosen=(members||[]).find(m=>m.organization_id===new URLSearchParams(location.search).get('org'))||(members||[])[0];
   if(chosen){
    orgId=chosen.organization_id;
    if(chosen.role!=='staff')Object.keys(allowed).forEach(key=>allowed[key]=true);
    else{
     const {data:rows,error:permissionError}=await client.from('erp_member_permissions').select('menu_key,can_view').eq('organization_id',orgId).eq('user_id',session.user.id);
     if(permissionError)throw permissionError;
     for(const row of rows||[])allowed[row.menu_key]=!!row.can_view;
     const savedKeys=new Set((rows||[]).map(row=>row.menu_key));
     if(!savedKeys.has('missing'))allowed.missing=allowed.workshop;
     if(!savedKeys.has('quotes'))allowed.quotes=allowed.orders;
     if(!savedKeys.has('appointments'))allowed.appointments=allowed.orders;
     if(!savedKeys.has('notifications'))allowed.notifications=allowed.orders;
     allowed.company=true;
    }
   }else Object.keys(allowed).forEach(key=>allowed[key]=(key==='orders'||key==='company'));
  }else {Object.keys(allowed).forEach(key=>allowed[key]=(key==='orders'||key==='company'));for(const record of frames.values())record.frame.remove();frames.clear()}
 }catch(error){
  authenticated=false;
  Object.keys(allowed).forEach(key=>allowed[key]=(key==='orders'||key==='company'));
  console.warn('KONAK ERP menü yetkileri okunamadı',error?.message);
 }
 for(const [key,record] of frames){if(!allowed[key]){record.frame.remove();frames.delete(key)}}
 for(const link of navigation.querySelectorAll('[data-view]'))link.hidden=!allowed[link.dataset.view];
 navigation.style.visibility=authenticated?'visible':'hidden';
 document.querySelector('.erp-shell-account-wrap').hidden=!authenticated;
 document.body.classList.toggle('erp-shell-guest',!authenticated);
 document.querySelector('.erp-shell-brand').href=authenticated?'./?view=orders':'../erp/';
 if(!authenticated)closeAccountMenu();
 const requested=new URLSearchParams(location.search).get('view')||'orders';
 const fallback=Object.keys(menus).find(key=>allowed[key])||'orders';
 navigate(allowed[requested]===false?fallback:requested,false);
}
const accountTrigger=document.getElementById('erp-account-trigger'),accountMenu=document.getElementById('erp-account-menu');
function closeAccountMenu(){accountMenu.hidden=true;accountTrigger.setAttribute('aria-expanded','false')}
accountTrigger.addEventListener('click',event=>{
 event.stopPropagation();
 accountMenu.hidden=!accountMenu.hidden;
 accountTrigger.setAttribute('aria-expanded',String(!accountMenu.hidden));
});
document.addEventListener('click',event=>{if(!event.target.closest('.erp-shell-account-wrap'))closeAccountMenu()});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeAccountMenu()});
function showPasswordSection(){
 navigate('company',true);
 const record=frames.get('company');
 const reveal=()=>{
  try{const target=record.frame.contentDocument?.getElementById('security');if(target){target.scrollIntoView({block:'start'});record.frame.contentWindow.location.hash='security'}}catch(e){}
 };
 if(record.loaded)reveal();else record.frame.addEventListener('load',reveal,{once:true});
}
document.querySelectorAll('[data-account-action]').forEach(button=>button.addEventListener('click',async()=>{
 const action=button.dataset.accountAction;closeAccountMenu();
 if(action==='password'){showPasswordSection();return}
 if(action==='logout'){
  button.disabled=true;
  try{const {error}=await client.auth.signOut();if(error)throw error;
   window.location.replace(new URL('../erp/',location.href).href);
  }catch(error){alert('Çıkış yapılamadı: '+(error?.message||'Bilinmeyen hata'))}
  finally{button.disabled=false}
 }
}));
document.addEventListener('click',event=>{
 const link=event.target.closest?.('a[href]');if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 const view=link.dataset.view||routeFromUrl(link.href);
 if(view){event.preventDefault();closeAccountMenu();navigate(view,true)}
});
window.addEventListener('popstate',()=>{const view=new URLSearchParams(location.search).get('view')||'orders';navigate(view,false)});
let sessionRefreshTimer;
window.addEventListener('storage',event=>{
 if(event.key&&event.key.includes('auth-token')){
  clearTimeout(sessionRefreshTimer);
  sessionRefreshTimer=setTimeout(()=>initialize(),120);
 }
});
window.addEventListener('message',event=>{
 if(event.origin!==location.origin)return;
 if(event.data?.type==='konak-erp-members-changed'){initialize();return}
 if(event.data?.type==='konak-erp-org-changed'&&/^[0-9a-f-]{36}$/i.test(String(event.data.org||''))){
  orgId=event.data.org;
  const url=new URL(location.href);url.searchParams.set('org',orgId);history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  for(const [key,record] of frames)if(record.frame.contentWindow!==event.source){record.frame.remove();frames.delete(key)}
  initialize();
 }
});
ensureFrame('orders');
initialize();
})();