(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co';
const KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.supabase?.createClient(API,KEY);
const $=id=>document.getElementById(id);
let user=null,organizations=[],members=[],branches=[],current=null,role='',permissionRows=[],branchAssignments=[],editingMember=null;
const staffMenuItems=[['orders','Siparişler'],['products','Ürünler ve Eksik Ürünler'],['workshop','Atölye'],['customers','Müşteriler'],['cash','Kasa'],['reports','Raporlar'],['calendar','Takvim'],['team','Personel Yönetimi'],['company','Şirket ve Şubeler'],['create_company','Yeni İşletme Oluştur']];
const safeText=(el,value)=>{el.textContent=String(value??'')};
function message(id,value){safeText($(id),value||'')}
function showAuth(){ $('company-auth').hidden=false;$('company-dashboard').hidden=true;$('reset-password-setup').hidden=true}
function showResetPassword(){ $('company-auth').hidden=true;$('company-dashboard').hidden=true;$('reset-password-setup').hidden=false;$('reset-password-setup').scrollIntoView({block:'center'})}
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
  if(response.error&&/invalid refresh token|refresh token not found/i.test(response.error.message||'')){
   await sb.auth.signOut({scope:'local'}).catch(()=>{});
  }
  user=response.error?null:response.data?.user;
  if(new URLSearchParams(location.search).has('reset')){
   if(user){showResetPassword();return}
   showAuth();message('company-login-message','Sıfırlama bağlantısının süresi dolmuş veya bağlantı geçersiz. Yeni bağlantı istemek için Şifremi Unuttum seçeneğini kullanın.');return;
  }
  if(!user){showAuth();return}
  $('current-email').textContent=user.email||'Oturum açık';$('logout-company').hidden=false;
  if(new URLSearchParams(location.search).has('invite')){
   const accept=await sb.rpc('erp_accept_team_invitations');
   if(accept.error)throw accept.error;
  }
  await reloadOrganizations();
  showDashboard();
  if(new URLSearchParams(location.search).has('invite')){
   $('invite-setup').hidden=false;
   $('invite-setup').scrollIntoView({block:'start'});
  }
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
  const canCreate=ownMembers.length===0||ownMembers.some(m=>m.role==='owner');
  $('new-company').hidden=!canCreate;$('open-create-company').hidden=!canCreate;
  if(canCreate)document.querySelector('#new-company').scrollIntoView({block:'start',behavior:'auto'});
 }
}
async function reloadCurrent(){
 if(!current)return;
 const ownPermissions=await getRows('erp_member_permissions','menu_key,can_view',q=>q.eq('organization_id',current.id).eq('user_id',user.id));
 const maySeeTeam=isManager()||ownPermissions.some(p=>p.menu_key==='team'&&p.can_view);
 const [teamResponse,branchRows,permissionResponse,assignmentResponse]=await Promise.all([
  maySeeTeam?sb.rpc('erp_list_team',{p_org:current.id}):Promise.resolve({data:[]}),
  getRows('erp_branches','id,name,code,phone,address,created_at',q=>q.eq('organization_id',current.id).order('created_at')),
  getRows('erp_member_permissions','user_id,menu_key,can_view,can_edit',q=>q.eq('organization_id',current.id)),
  getRows('erp_member_branch_access','user_id,branch_id',q=>q.eq('organization_id',current.id))
 ]);
 if(teamResponse.error)throw teamResponse.error;
 members=teamResponse.data||[];
 branches=branchRows;permissionRows=permissionResponse;branchAssignments=assignmentResponse;
 $('staff-permission-panel').hidden=true;
 ['company-profile','team','branches'].forEach(id=>$(id).hidden=false);
 $('team').hidden=!(isManager()||permissionRows.some(p=>p.user_id===user.id&&p.menu_key==='team'&&p.can_view));
 $('new-company').hidden=role!=='owner';$('open-create-company').hidden=role!=='owner';
 document.querySelectorAll('a[href="#new-company"]').forEach(a=>a.hidden=role!=='owner');
 safeText($('quick-company'),current.name);
 safeText($('quick-members'),members.length);safeText($('hero-members'),members.length);
 safeText($('quick-branches'),branches.length);safeText($('hero-branches'),branches.length);
 safeText($('team-count'),members.length+' kişi');
 safeText($('profile-name'),current.name);safeText($('profile-site'),current.website||'Web sitesi eklenmedi');
 safeText($('profile-monogram'),current.name.slice(0,1).toLocaleUpperCase('tr-TR'));
 const preview=$('company-logo-preview');preview.replaceChildren();
 if(current.logo_url && /^https:\/\//i.test(current.logo_url)){const image=el('img');image.src=current.logo_url;image.alt='Şirket Logosu';image.width=105;image.height=75;image.loading='lazy';preview.append(image);}
 $('company-logo-upload').disabled=!isManager();
 safeText($('profile-role'),role==='owner'?'İşletme Sahibi':role==='manager'?'Yönetici':'Personel');
 const form=$('profile-form');
 for(const field of ['name','phone','email','address','tax_number','tax_office','instagram','website','logo_url']) form.elements.namedItem(field).value=current[field]||'';
 form.querySelectorAll('input,textarea').forEach(input=>input.disabled=!isManager());
 $('save-profile').hidden=!isManager();$('toggle-branch-form').hidden=!isManager();$('toggle-staff-form').hidden=!isManager();
 $('staff-form').hidden=true;$('branch-form').hidden=true;
 renderMembers();renderBranches();
}
function renderMembers(){
 const area=$('team-list');area.replaceChildren();
 members.forEach(m=>{
  const row=el('div','team-item'),left=el('div');
  left.append(el('strong','',m.email||'Personel'),el('small','',m.user_id===user.id?'Bu hesap · Oturum açık':'İşletme personeli'));
  const actions=el('div','staff-actions');
  const level=el('span','chip',m.role==='owner'?'Sahip':m.role==='manager'?'Yönetici':'Personel');
  actions.append(level);
  if(isManager()&&m.role!=='owner'&&m.user_id!==user.id&&(role==='owner'||m.role==='staff')){
   const choose=el('select','staff-role');choose.setAttribute('aria-label','Kullanıcı rolü');
   ['staff','manager'].filter(x=>role==='owner'||x==='staff').forEach(x=>choose.add(new Option(x==='staff'?'Personel':'Yönetici',x)));
   choose.value=m.role;choose.onchange=()=>manageTeam('role',m.user_id,null,choose.value);
   const remove=el('button','secondary small','Kaldır');remove.type='button';remove.onclick=()=>{
    if(confirm((m.email||'Kullanıcı')+' işletmeden çıkarılsın mı?'))manageTeam('remove',m.user_id);
   };
   actions.append(choose,remove);
   if(role==='owner'&&m.role==='staff'){
    const permissionsButton=el('button','secondary small','Yetkiler');permissionsButton.type='button';permissionsButton.onclick=()=>openStaffPermissions(m);actions.prepend(permissionsButton);
   }
  }
  row.append(left,actions);area.append(row);
 });
 if(!members.length)area.append(el('p','fine','Henüz kullanıcı bulunmuyor.'));
}
function openStaffPermissions(member){
 if(role!=='owner'||member.role!=='staff')return;
 editingMember=member;
 $('staff-permission-target').textContent=member.email||'Personel';
 const area=$('staff-permission-rows');area.replaceChildren();
 for(const [key,label] of staffMenuItems){
  const saved=permissionRows.find(p=>p.user_id===member.user_id&&p.menu_key===key);
  const defaults={orders:[true,true],products:[true,false],workshop:[true,true],customers:[true,true],cash:[false,false],reports:[false,false],calendar:[true,true],team:[false,false],company:[false,false],create_company:[false,false]};
  const view=saved?saved.can_view:defaults[key][0],edit=saved?saved.can_edit:defaults[key][1];
  const row=el('div','staff-actions');row.style.cssText='display:grid;grid-template-columns:1fr 85px 90px;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid #e3ebe6';
  const title=el('strong','',label);
  const viewLabel=el('label');viewLabel.style.cssText='display:flex;align-items:center;gap:5px;font-size:12px';
  const viewCheck=el('input');viewCheck.type='checkbox';viewCheck.dataset.permissionView=key;viewCheck.checked=view;viewCheck.disabled=key==='create_company';
  viewLabel.append(viewCheck,document.createTextNode('Gör'));
  const editLabel=el('label');editLabel.style.cssText='display:flex;align-items:center;gap:5px;font-size:12px';
  const editCheck=el('input');editCheck.type='checkbox';editCheck.dataset.permissionEdit=key;editCheck.checked=edit;editCheck.disabled=key==='create_company'||!view;
  viewCheck.onchange=()=>{editCheck.disabled=!viewCheck.checked;if(!viewCheck.checked)editCheck.checked=false;};
  editLabel.append(editCheck,document.createTextNode('İşlem'));
  row.append(title,viewLabel,editLabel);area.append(row);
 }
 const areaBranches=$('staff-permission-branches');areaBranches.replaceChildren();
 const restricted=branchAssignments.filter(x=>x.user_id===member.user_id).map(x=>x.branch_id);
 areaBranches.append(el('p','fine','Hiçbir şube işaretlenmezse personel tüm şubeleri kullanabilir. Belirli şubeler seçildiğinde yalnız o şubelere erişir.'));
 for(const b of branches){
  const label=el('label');label.style.cssText='display:flex;align-items:center;gap:5px;font-size:13px';
  const check=el('input');check.type='checkbox';check.value=b.id;check.dataset.staffBranch='1';check.checked=restricted.includes(b.id);
  label.append(check,document.createTextNode(b.name));areaBranches.append(label);
 }
 $('staff-permission-panel').hidden=false;message('staff-permission-message','');
 $('staff-permission-panel').scrollIntoView({block:'start',behavior:'smooth'});
}
$('staff-permission-close').onclick=()=>{$('staff-permission-panel').hidden=true;editingMember=null};
$('staff-permission-save').onclick=async()=>{
 if(!current||role!=='owner'||!editingMember)return;
 const permissions={};
 for(const [key] of staffMenuItems){
  permissions[key]={view:!!document.querySelector('[data-permission-view="'+key+'"]')?.checked,
  edit:!!document.querySelector('[data-permission-edit="'+key+'"]')?.checked};
 }
 permissions.create_company={view:false,edit:false};
 const selected=[...document.querySelectorAll('[data-staff-branch]:checked')].map(el=>el.value);
 const button=$('staff-permission-save');button.disabled=true;message('staff-permission-message','Yetkiler kaydediliyor...');
 try{
  const {error}=await sb.rpc('erp_save_staff_permissions',{p_org:current.id,p_user:editingMember.user_id,p_permissions:permissions,p_branch_ids:selected});
  if(error)throw error;
  await reloadCurrent();message('team-message','Personel yetkileri kaydedildi.');
 }catch(err){message('staff-permission-message','Kaydedilemedi: '+err.message)}
 finally{button.disabled=false}
};
async function manageTeam(action,memberId=null,email=null,nextRole='staff'){
 message('team-message','İşlem kaydediliyor...');
 try{
  const {error}=await sb.rpc('erp_manage_team',{p_org:current.id,p_action:action,p_member:memberId,p_email:email,p_role:nextRole});
  if(error)throw error;
  await reloadCurrent();message('team-message','Kullanıcı işlemi kaydedildi.');
 }catch(e){message('team-message','İşlem başarısız: '+e.message)}
}
function openBranchEditor(b){
 const form=$('branch-form');form.hidden=false;
 form.elements.namedItem('branch_edit_id').value=b?.id||'';
 for(const name of ['name','phone','code','address'])form.elements.namedItem(name).value=b?.[name]||'';
 $('branch-form-title').textContent=b?'Şubeyi Düzenle':'Yeni Şube';
 form.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function renderBranches(){
 const area=$('branches-list');area.replaceChildren();
 branches.forEach((b,index)=>{
  const row=el('div','branch-item'),left=el('div');
  left.append(el('strong','',(index+1)+'. '+b.name),el('small','',[b.code,b.phone,b.address].filter(Boolean).join(' · ')||'Şube bilgileri henüz girilmedi'));
  const right=el('div','staff-actions');right.append(el('span','chip','Şube'));
  if(isManager()){
   const edit=el('button','secondary small','Düzenle');edit.type='button';edit.onclick=()=>openBranchEditor(b);right.append(edit);
  }
  row.append(left,right);area.append(row);
 });
 if(!branches.length)area.append(el('p','fine','Henüz şube bulunmuyor.'));
}
async function createCompany(e){
 e.preventDefault();
 if(role!=='owner'&&organizations.length){message('create-company-message','Yalnız işletme sahibi yeni işletme oluşturabilir.');return}
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
  const editId=String(formData.get('branch_edit_id')||'');
  const response=editId
   ?await sb.from('erp_branches').update({name:payload.name,phone:payload.phone,code:payload.code,address:payload.address}).eq('organization_id',current.id).eq('id',editId)
   :await sb.from('erp_branches').insert(payload);
  if(response.error)throw response.error;
  form.reset();form.hidden=true;
  await reloadCurrent();message('branch-message','');
 }catch(err){message('branch-message','Şube eklenemedi: '+err.message)}
 finally{button.disabled=false}
}
function showForgotPassword(open){
 $('company-login').hidden=open;
 $('forgot-password-form').hidden=!open;
 message('forgot-password-message','');
 if(open)$('forgot-password-form').elements.namedItem('email').value=$('company-login').elements.namedItem('email').value||'';
}
$('forgot-password-open').onclick=()=>showForgotPassword(true);
$('forgot-password-cancel').onclick=()=>showForgotPassword(false);
$('forgot-password-form').onsubmit=async e=>{
 e.preventDefault();
 const form=e.currentTarget,email=String(new FormData(form).get('email')||'').trim();
 const button=form.querySelector('[type=submit]');button.disabled=true;
 message('forgot-password-message','Bağlantı gönderiliyor...');
 try{
  if(!sb)throw Error('Bağlantı kurulamadı');
  const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:'https://perdekonagi.com/magaza/company.html?reset=1'});
  if(error)throw error;
  message('forgot-password-message','Bu adrese kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.');
 }catch(error){message('forgot-password-message','E-posta gönderilemedi: '+error.message)}
 finally{button.disabled=false}
};
$('reset-password-form').onsubmit=async e=>{
 e.preventDefault();
 const form=e.currentTarget,fd=new FormData(form),password=String(fd.get('password')||''),repeat=String(fd.get('repeat')||'');
 if(password.length<8||password!==repeat){message('reset-password-message','Şifre en az 8 karakter olmalı ve iki alan aynı olmalı.');return}
 const button=form.querySelector('[type=submit]');button.disabled=true;
 try{
  const {error}=await sb.auth.updateUser({password});if(error)throw error;
  message('reset-password-message','Şifreniz yenilendi. Giriş ekranına yönlendiriliyorsunuz...');
  await sb.auth.signOut({scope:'local'});
  location.replace('/magaza/company.html');
 }catch(error){message('reset-password-message','Şifre yenilenemedi: '+error.message)}
 finally{button.disabled=false}
};
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
$('toggle-branch-form').onclick=()=>{if(isManager())openBranchEditor(null)};
$('cancel-branch').onclick=()=>{$('branch-form').hidden=true};
$('open-create-company').onclick=()=>{if(role==='owner')document.querySelector('#new-company').scrollIntoView({behavior:'smooth',block:'start'})};

$('toggle-staff-form').onclick=()=>{if(isManager()){$('staff-form').hidden=false;$('staff-form').scrollIntoView({behavior:'smooth',block:'nearest'})}};
$('cancel-staff').onclick=()=>{$('staff-form').hidden=true};
$('staff-form').onsubmit=async e=>{
 e.preventDefault();if(!current||!isManager())return;
 const form=e.currentTarget,fd=new FormData(form),button=form.querySelector('[type=submit]');
 button.disabled=true;
 try{
  const email=String(fd.get('email')||'').trim(),nextRole=String(fd.get('role')||'staff');
  message('team-message','Kullanıcı kontrol ediliyor...');
  message('team-message','Personel davet e-postası gönderiliyor...');
  const invited=await sb.functions.invoke('erp-invite-staff',{body:{org:current.id,email,role:nextRole}});
  let inviteResult=invited.data||{};
  if(invited.error?.context?.json){
   try{inviteResult=await invited.error.context.json()}catch(_){/* HTTP body unavailable */}
  }
  if(inviteResult.registered){
   const otp=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:'https://perdekonagi.com/magaza/company.html?invite=1'}});
   if(otp.error)throw otp.error;
  }else if(invited.error||inviteResult.error){
   throw Error(inviteResult.error||invited.error?.message||'Davet gönderilemedi');
  }
  form.reset();form.hidden=true;message('team-message','Davet bağlantısı gönderildi: '+email+'. E-posta kabul edilmeden işletme erişimi açılmaz.');
 }catch(error){message('team-message','İşlem başarısız: '+error.message)}
 finally{button.disabled=false}
};
$('password-form').onsubmit=async e=>{
 e.preventDefault();const form=e.currentTarget,fd=new FormData(form),old=String(fd.get('current_password')||''),password=String(fd.get('new_password')||''),repeat=String(fd.get('new_password_repeat')||'');
 if(password.length<8||password!==repeat){message('password-message','Yeni şifre en az 8 karakter olmalı ve iki kez aynı girilmeli.');return}
 if(old===password){message('password-message','Yeni şifre mevcut şifreden farklı olmalı.');return}
 const submit=form.querySelector('[type=submit]');submit.disabled=true;message('password-message','Şifre güncelleniyor...');
 try{
  const {error}=await sb.auth.updateUser({current_password:old,password});
  if(error)throw error;
  form.reset();message('password-message','Şifreniz başarıyla değiştirildi.');
 }catch(error){message('password-message','Şifre değiştirilemedi: '+error.message)}
 finally{submit.disabled=false}
};
$('company-logo-upload').onchange=async e=>{
 if(!current||!isManager())return;
 const file=e.target.files?.[0];if(!file)return;
 if(file.size>2097152||!['image/jpeg','image/png','image/webp'].includes(file.type)){message('profile-message','En fazla 2 MB PNG, JPG veya WebP yükleyin.');e.target.value='';return}
 message('profile-message','Logo yükleniyor...');
 try{
  const extension={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type];
  const path=current.id+'/logo-'+crypto.randomUUID()+'.'+extension;
  const {error}=await sb.storage.from('erp-company-logos').upload(path,file,{contentType:file.type,upsert:false});
  if(error)throw error;
  const {data}=sb.storage.from('erp-company-logos').getPublicUrl(path);
  $('profile-form').elements.namedItem('logo_url').value=data.publicUrl;
  message('profile-message','Logo yüklendi. Şirket profiline kaydetmek için Değişiklikleri Kaydet butonuna basın.');
  const preview=$('company-logo-preview');preview.replaceChildren();const img=el('img');img.src=data.publicUrl;img.alt='Yeni Şirket Logosu';img.width=105;img.height=75;preview.append(img);
 }catch(error){message('profile-message','Logo yüklenemedi: '+error.message)}
};

$('invite-password-form').onsubmit=async e=>{
 e.preventDefault();const form=e.currentTarget,fd=new FormData(form),password=String(fd.get('password')||''),repeat=String(fd.get('repeat')||'');
 if(password.length<8||password!==repeat){message('invite-password-message','Şifre en az 8 karakter olmalı ve iki alan eşleşmeli.');return}
 const button=form.querySelector('button[type=submit]');button.disabled=true;
 try{const {error}=await sb.auth.updateUser({password});if(error)throw error;message('invite-password-message','Şifreniz oluşturuldu. KONAK ERP giriş ekranına yönlendiriliyorsunuz...');await sb.auth.signOut({scope:'local'});location.replace('/magaza/')}
 catch(error){message('invite-password-message','Şifre kaydedilemedi: '+error.message)}finally{button.disabled=false}
};
init();
})();