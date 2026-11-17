(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co',KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const defaults={orders:[true,true],products:[true,false],workshop:[true,true],customers:[true,true],cash:[false,false],reports:[false,false],calendar:[true,true],team:[false,false],company:[false,false],create_company:[false,false]};
const permissionForLink=href=>{
 const u=new URL(href,location.href),path=u.pathname;
 if(path.endsWith('/missing.html'))return 'workshop';
 if(path.endsWith('/cash.html'))return 'cash';
 if(path.endsWith('/reports.html'))return 'reports';
 if(path.endsWith('/calendar.html'))return 'calendar';
 if(path.endsWith('/order-new.html'))return 'orders';
 if(path.endsWith('/company.html'))return u.hash==='#team'?'team':null;
 if(path.endsWith('/hub.html'))return ['products','workshop','customers'].includes(u.searchParams.get('tab'))?u.searchParams.get('tab'):'products';
 if(path.endsWith('/magaza/')||path.endsWith('/index.html'))return 'orders';
 return null;
};
function denyPage(){
 if(document.getElementById('staff-access-denied'))return;
 const box=document.createElement('div');box.id='staff-access-denied';box.setAttribute('role','alert');
 box.style.cssText='position:fixed;inset:120px 12px auto;max-width:500px;margin:auto;z-index:9999;background:white;border:1px solid #dbe6df;border-radius:16px;padding:28px;box-shadow:0 8px 30px #0002;text-align:center';
 const title=document.createElement('h2');title.textContent='Bu menü için yetkiniz bulunmuyor';
 const p=document.createElement('p');p.textContent='İşletme sahibinden erişim yetkisi isteyin.';
 const a=document.createElement('a');a.href='./company.html#security';a.textContent='Hesabıma Git';a.style.cssText='display:inline-block;padding:12px 20px;background:#1c3b2f;border-radius:8px;color:white';
 box.append(title,p,a);document.body.append(box);
 const main=document.querySelector('main');if(main)main.style.visibility='hidden';
}
async function run(){
 if(!window.supabase)return;
 const sb=window.supabase.createClient(API,KEY,{auth:{storageKey:'sb-rwylhxrtggsicieuyjrm-auth-token'}});
 const {data:{user},error}=await sb.auth.getUser();if(error||!user)return;
 const {data:members}=await sb.from('erp_members').select('organization_id,role').eq('user_id',user.id);if(!members?.length)return;
 const selector=document.querySelector('#organization-select,#company-select');
 const chosen=members.find(m=>m.organization_id===selector?.value)||members[0];
 if(chosen.role!=='staff')return;
 const {data:rows}=await sb.from('erp_member_permissions').select('menu_key,can_view,can_edit').eq('organization_id',chosen.organization_id).eq('user_id',user.id);
 const map={};for(const key of Object.keys(defaults))map[key]=defaults[key][0];
 for(const row of rows||[])map[row.menu_key]=row.can_view;
 map.create_company=false;
 for(const a of document.querySelectorAll('a[href]')){
  const key=permissionForLink(a.getAttribute('href'));if(key&&!map[key])a.hidden=true;
 }
 for(const el of document.querySelectorAll('#new-company,#open-create-company,a[href="#new-company"]'))el.hidden=true;
 const page=permissionForLink(location.href);
 if(page&&!map[page])denyPage();
}
document.addEventListener('DOMContentLoaded',()=>{run().catch(()=>{});});
})();