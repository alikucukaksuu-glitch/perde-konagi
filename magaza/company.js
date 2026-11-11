(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co';
const KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.supabase?.createClient(API,KEY);
const $=id=>document.getElementById(id);
let user=null,organizations=[],members=[],branches=[],current=null,role='';
const safeText=(el,value)=>{el.textContent=String(value??'')};
function message(id,value){safeText($(id),value||'')}
function showAuth(){ $('company-auth').hidden=false;$('company-dashboard').hidden=true}
function showDashboard(){$('company-auth').hidden=true;$('company-dashboard').hidden=false}
function el(tag,cls,value){const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined)node.textContent=value;return node}
function isManager(){return role==='owner'||role==='manager'}
async function getRows(table,columns,query){
 let req=sb.from(table).select(columns);
 if(query)req=query(req);
 const {data,error}=await req;
 if(error)throw error;
 return data||[];
}
async function init(){
 if(!sb){showAuth();message('company-login-message','Bağlantı kütüphanesi yüklenemedi.');return}
 try{
  const response=await sb.auth.getUser();
  user=response.error?null:response.data?.user;
  if(!user){showAuth();return}
  $('current-email').textContent=user.email||'Oturum açık';$('logout-company').hidden=false;
  await reloadOrganizations();
  showDashboard();
 }catch(err){showAuth();message('company-login-message','Şirket bilgileri yüklenemedi: '+err.message)}
}
async function reloadOrganizations(preferred){
 const ownMembers=await getRows('erp_members','organization_id,user_id,role',q=>q.eq('user_id',user.id));
 const ids=ownMembers.map(m=>m.organization_id);
 organizations=ids.length?await getRows('erp_organizations','id,name,phone,email,address,tax_number,tax_office,instagram,website,logo_url',q=>q.in('id',ids).order('name')):[];
 const previously=preferred||current?.id;
 current=organizations.find(o=>o.id===previously)||organizations[0]||null;
 $('company-select').replaceChildren();
 organizations.forEach(o=>$('company-select').add(new Option(o.name,o.id)));
 if(current){
  $('company-select').value=current.id;
  role=ownMembers.find(m=>m.organization_id===current.id)?.role||'staff';
  await reloadCurrent();
 }else{
  role='';
  safeText($('quick-company'),'Yeni işletme');
  safeText($('quick-members'),0);safeText($('quick-branches'),0);
  safeText($('hero-branches'),0);safeText($('hero-members'),0);
  ['company-profile','team','branches'].forEach(id=>$(id).hidden=true);
  document.querySelector('#new-company').scrollIntoView({block:'start',behavior:'auto'});
 }
}
async function reloadCurrent(){
 if(!current)return;
 members=await getRows('erp_members','organization_id,user_id,role,created_at',q=>q.eq('organization_id',current.id).order('created_at'));
 branches=await getRows('erp_branches','id,name,code,phone,address,created_at',q=>q.eq('organization_id',current.id).order('created_at'));
 ['company-profile','team','branches'].forEach(id=>$(id).hidden=false);
 safeText($('quick-company'),current.name);
 safeText($('quick-members'),members.length);safeText($('hero-members'),members.length);
 safeText($('quick-branches'),branches.length);safeText($('hero-branches'),branches.length);
 safeText($('team-count'),members.length+' kişi');
 safeText($('profile-name'),current.name);safeText($('profile-site'),current.website||'Web sitesi eklenmedi');
 safeText($('profile-monogram'),current.name.slice(0,1).toLocaleUpperCase('tr-TR'));
 safeText($('profile-role'),role==='owner'?'İşletme Sahibi':role==='manager'?'Yönetici':'Personel');
 const form=$('profile-form');
 for(const field of ['name','phone','email','address','tax_number','tax_office','instagram','website','logo_url']) form.elements.namedItem(field).value=current[field]||'';
 form.querySelectorAll('input,textarea').forEach(input=>input.disabled=!isManager());
 $('save-profile').hidden=!isManager();$('toggle-branch-form').hidden=!isManager();
 renderMembers();renderBranches();
}
function renderMembers(){
 const area=$('team-list');area.replaceChildren();
 members.forEach(m=>{
  const row=el('div','team-item'),left=el('div'),name=el('strong','',m.user_id===user.id?(user.email||'Bu hesap'):'Personel kimliği: '+m.user_id.slice(0,8)+'…');
  const desc=el('small','',m.user_id===user.id?'Aktif kullanıcı':'Hesap bilgileri yalnızca yetkili kullanıcılara açıktır');
  left.append(name,desc);row.append(left,el('span','chip',m.role==='owner'?'Sahip':m.role==='manager'?'Yönetici':'Personel'));area.append(row);
 });
}
function renderBranches(){
 const area=$('branches-list');area.replaceChildren();
 branches.forEach((b,index)=>{
  const row=el('div','branch-item'),left=el('div');
  left.append(el('strong','',(index+1)+'. '+b.name),el('small','',[b.code,b.phone,b.address].filter(Boolean).join(' · ')||'Şube bilgileri henüz girilmedi'));
  row.append(left,el('span','chip','Şube'));area.append(row);
 });
 if(!branches.length)area.append(el('p','fine','Henüz şube bulunmuyor.'));
}
async function createCompany(e){
 e.preventDefault();
 const form=e.currentTarget,submit=form.querySelector('button[type=submit]');
 const data=new FormData(form);message('create-company-message','İşletme oluşturuluyor...');
 submit.disabled=true;
 try{
  const response=await sb.rpc('erp_create_organization',{p_name:data.get('organization').trim(),p_branch:data.get('branch').trim()});
  if(response.error)throw response.error;
  form.reset();
  await reloadOrganizations(response.data);
  message('create-company-message','İşletme ve ilk şube başarıyla oluşturuldu.');
  document.querySelector('#company-profile').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(err){message('create-company-message','İşletme oluşturulamadı: '+err.message)}
 finally{submit.disabled=false}
}
async function saveProfile(e){
 e.preventDefault();if(!current||!isManager())return;
 const form=e.currentTarget,data=new FormData(form),submit=$('save-profile');
 const fields={};
 for(const name of ['name','phone','email','address','tax_number','tax_office','instagram','website','logo_url'])fields[name]=String(data.get(name)||'').trim()||null;
 if(!fields.name||fields.name.length<2){message('profile-message','Şirket adı en az 2 karakter olmalı.');return}
 if(fields.logo_url&&!fields.logo_url.startsWith('https://')){message('profile-message','Logo adresi HTTPS olmalı.');return}
 submit.disabled=true;message('profile-message','Kaydediliyor...');
 try{
  const response=await sb.from('erp_organizations').update(fields).eq('id',current.id).select('id').single();
  if(response.error)throw response.error;
  const selected=current.id;await reloadOrganizations(selected);
  message('profile-message','Şirket bilgileri kaydedildi.');
 }catch(err){message('profile-message','Kaydedilemedi: '+err.message)}
 finally{submit.disabled=false}
}
async function createBranch(e){
 e.preventDefault();if(!current||!isManager())return;
 const form=e.currentTarget,formData=new FormData(form),button=form.querySelector('button[type=submit]');
 const name=String(formData.get('name')||'').trim();
 if(name.length<2){message('branch-message','Şube adı girin.');return}
 button.disabled=true;message('branch-message','Şube kaydediliyor...');
 try{
  const payload={organization_id:current.id,name,phone:String(formData.get('phone')||'').trim()||null,code:String(formData.get('code')||'').trim()||null,address:String(formData.get('address')||'').trim()||null};
  const response=await sb.from('erp_branches').insert(payload);
  if(response.error)throw response.error;
  form.reset();form.hidden=true;
  await reloadCurrent();message('branch-message','');
 }catch(err){message('branch-message','Şube eklenemedi: '+err.message)}
 finally{button.disabled=false}
}
$('company-login').onsubmit=async e=>{
 e.preventDefault();const data=new FormData(e.currentTarget);
 message('company-login-message','Giriş yapılıyor...');
 const res=await sb.auth.signInWithPassword({email:data.get('email'),password:data.get('password')});
 if(res.error)message('company-login-message',res.error.message);
 else {message('company-login-message','');await init()}
};
$('logout-company').onclick=async()=>{
 await sb.auth.signOut();
 user=null;current=null;$('logout-company').hidden=true;$('current-email').textContent='';showAuth();
};
$('company-select').onchange=async e=>{
 current=organizations.find(o=>o.id===e.target.value)||null;
 if(!current)return;
 const myRoles=await getRows('erp_members','role',q=>q.eq('organization_id',current.id).eq('user_id',user.id));
 role=myRoles[0]?.role||'staff';await reloadCurrent();
};
$('create-company-form').onsubmit=createCompany;
$('profile-form').onsubmit=saveProfile;
$('branch-form').onsubmit=createBranch;
$('toggle-branch-form').onclick=()=>{if(isManager()){$('branch-form').hidden=!$('branch-form').hidden;if(!$('branch-form').hidden)$('branch-form').scrollIntoView({behavior:'smooth',block:'nearest'})}};
$('cancel-branch').onclick=()=>{$('branch-form').hidden=true};
$('open-create-company').onclick=()=>document.querySelector('#new-company').scrollIntoView({behavior:'smooth',block:'start'});
init();
})();