/* Perde Konağı: public maintenance notice with authenticated owner preview.
   Static hosting note: the gate is a UI redirect, not access control for public files. */
(()=>{'use strict';
if(/(?:^|\/)admin(?:\.html)?$|(?:^|\/)bakim(?:\.html)?$/.test(location.pathname))return;
const origin='https://rwylhxrtggsicieuyjrm.supabase.co';
const key='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sessionKey='sb-rwylhxrtggsicieuyjrm-auth-token';
const recovery=/\b(?:type=recovery|access_token=|refresh_token=|token_hash=)\b/.test(location.hash+location.search);
if(recovery)return;
const style=document.createElement('style');
style.id='pk-maintenance-preload';
style.textContent='html{visibility:hidden!important}';
document.head.append(style);
const controller=new AbortController();
let finished=false;
const finish=()=>{if(!finished){finished=true;style.remove()}};
const timeout=setTimeout(()=>{controller.abort();finish()},6500);
const headers={apikey:key,accept:'application/json'};
async function responseJson(url,options={}){
 const response=await fetch(url,{...options,cache:'no-store',signal:controller.signal});
 if(!response.ok)throw new Error('HTTP '+response.status);
 return response.json();
}
async function currentAdmin(){
 let record;
 try{record=JSON.parse(localStorage.getItem(sessionKey)||'null')}catch(_){return false}
 if(!record?.access_token)return false;
 let token=record.access_token;
 let user;
 try{
  user=await responseJson(origin+'/auth/v1/user',{headers:{...headers,Authorization:'Bearer '+token}});
 }catch(e){
  if(!record.refresh_token)return false;
  try{
   const renewed=await responseJson(origin+'/auth/v1/token?grant_type=refresh_token',{
    method:'POST',headers:{...headers,'Content-Type':'application/json'},
    body:JSON.stringify({refresh_token:record.refresh_token})
   });
   if(!renewed?.access_token||!renewed.user?.id)return false;
   token=renewed.access_token;
   const fresh={...record,...renewed,expires_at:Math.floor(Date.now()/1000)+(renewed.expires_in||3600)};
   if(localStorage.getItem(sessionKey)===JSON.stringify(record))localStorage.setItem(sessionKey,JSON.stringify(fresh));
   user=renewed.user;
  }catch(_){return false}
 }
 if(!user?.id)return false;
 try{
  const u=origin+'/rest/v1/admin_access?user_id=eq.'+encodeURIComponent(user.id)+'&select=role&limit=1';
  const rows=await responseJson(u,{headers:{...headers,Authorization:'Bearer '+token}});
  return Array.isArray(rows)&&['owner','admin'].includes(rows[0]?.role);
 }catch(_){return false}
}
async function gate(){
 try{
  const rows=await responseJson(origin+'/rest/v1/site_maintenance?id=eq.1&select=enabled',{headers});
  if(!Array.isArray(rows)||rows[0]?.enabled!==true)return;
  if(await currentAdmin())return;
  const dest=new URL('bakim.html',location.href);
  location.replace(dest.href);
 }catch(_){
  // Existing behavior: a network outage must not permanently blank the storefront.
 }finally{clearTimeout(timeout);finish()}
}
gate();
})();