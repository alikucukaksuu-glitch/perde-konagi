/* Perde Konağı: read-only public maintenance gate. Never put secrets here. */
(()=>{'use strict';
if(/(?:^|\/)admin(?:\.html)?$|(?:^|\/)bakim(?:\.html)?$/.test(location.pathname))return;
const api='https://rwylhxrtggsicieuyjrm.supabase.co/rest/v1/site_maintenance?id=eq.1&select=enabled';
const key='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const isRecovery=/\b(?:type=recovery|access_token=|refresh_token=|token_hash=)\b/.test(location.hash+location.search);
if(isRecovery)return; // Allow password recovery to reach the account flow.
const style=document.createElement('style');style.id='pk-maintenance-preload';style.textContent='html{visibility:hidden!important}';document.head.append(style);
const ctrl=new AbortController(),timeout=setTimeout(()=>{ctrl.abort();style.remove()},6000);
fetch(api,{headers:{apikey:key,accept:'application/json'},cache:'no-store',signal:ctrl.signal})
.then(r=>{if(!r.ok)throw Error('Service unavailable');return r.json()})
.then(rows=>{if(Array.isArray(rows)&&rows[0]?.enabled===true){const dest=new URL('bakim.html',location.href);location.replace(dest.href);return}style.remove()})
.catch(()=>{style.remove()})
.finally(()=>clearTimeout(timeout));
})();