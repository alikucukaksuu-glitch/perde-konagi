/* Perde Konağı: visitor maintenance routing with authenticated admin preview.
   GitHub Pages is static; this is a visitor UX redirect, not protection for public files. */
(()=>{'use strict';
if(/(?:^|\/)admin(?:\.html)?$|(?:^|\/)bakim(?:\.html)?$/.test(location.pathname))return;
if(/\b(?:type=recovery|access_token=|refresh_token=|token_hash=)\b/.test(location.hash+location.search))return;
const origin='https://rwylhxrtggsicieuyjrm.supabase.co';
const key='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const style=document.createElement('style');style.id='pk-maintenance-preload';style.textContent='html{visibility:hidden!important}';document.head.append(style);
const ctrl=new AbortController();
const maxWait=setTimeout(()=>{ctrl.abort();style.remove()},10500);
let finish=false;
function release(){if(!finish){finish=true;clearTimeout(maxWait);style.remove()}}
async function maintenanceEnabled(){
 const response=await fetch(origin+'/rest/v1/site_maintenance?id=eq.1&select=enabled',{headers:{apikey:key,accept:'application/json'},cache:'no-store',signal:ctrl.signal});
 if(!response.ok)throw Error('Maintenance status could not be read');
 const data=await response.json();return Array.isArray(data)&&data[0]?.enabled===true;
}
function supabaseReady(){
 if(window.supabase?.createClient)return Promise.resolve(window.supabase);
 return new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/dist/umd/supabase.js';
  script.onload=()=>window.supabase?.createClient?resolve(window.supabase):reject(Error('Auth SDK missing'));
  script.onerror=()=>reject(Error('Auth SDK failed to load'));
  document.head.append(script);
 });
}
async function verifiedAdmin(){
 // Keep this check identical to the administrator panel's own authentication.
 // This client also refreshes expired sessions using the official Auth flow.
 const lib=await supabaseReady();
 const sb=lib.createClient(origin,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 const {data,error}=await sb.auth.getUser();
 if(error||!data?.user)return false;
 const role=await sb.from('admin_access').select('role').eq('user_id',data.user.id).maybeSingle();
 return !role.error&&['owner','admin'].includes(role.data?.role);
}
function redirectToMaintenance(){location.replace(new URL('bakim.html',location.href).href)}
function markAdminPreview(){
 const create=()=>{
  if(document.getElementById('pk-admin-maintenance-preview'))return;
  const banner=document.createElement('div');banner.id='pk-admin-maintenance-preview';
  banner.setAttribute('role','status');
  banner.textContent='YÖNETİCİ ÖNİZLEMESİ · Bakım modu açık — müşteriler bakım sayfasını görüyor';
  Object.assign(banner.style,{position:'fixed',top:'0',left:'0',right:'0',zIndex:'2147483647',padding:'7px 14px',background:'#3d2b21',color:'#fff',textAlign:'center',font:'bold 12px Arial,sans-serif',pointerEvents:'none'});
  document.body.prepend(banner);
 };
 if(document.body)create();else document.addEventListener('DOMContentLoaded',create,{once:true});
}
async function run(){
 try{
  const enabled=await maintenanceEnabled();
  if(!enabled)return;
  if(await verifiedAdmin()){markAdminPreview();return}
  redirectToMaintenance();
 }catch(_){
  // When maintenance status or role cannot be verified, prefer maintenance
  // to accidentally exposing the storefront during an outage.
  redirectToMaintenance();
 }finally{release()}
}
run();
})();