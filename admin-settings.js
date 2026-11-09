(()=>{'use strict';
const $=id=>document.getElementById(id);
const sw=$('pk-maint-toggle'),save=$('pk-maint-save'),status=$('pk-maint-state'),feedback=$('pk-maint-feedback');
if(!sw||!save||!window.supabase)return;
const sb=window.supabase.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
let current=false,requested=false,userId='',canEdit=false,busy=false;
const draw=()=>{sw.setAttribute('aria-checked',String(requested));sw.setAttribute('aria-label',requested?'Bakım modunu kapat':'Bakım modunu aç');status.textContent=requested?'BAKIM MODU AÇIK':'SİTE YAYINDA';status.classList.toggle('is-on',requested);save.textContent=requested!==current?(requested?'Bakım Modunu Aç':'Bakım Modunu Kapat'):'Değişiklik Yok';save.disabled=busy||!canEdit||requested===current;sw.disabled=busy||!canEdit};
const note=s=>feedback.textContent=s;
async function load(){
 busy=true;draw();note('Ayarlar kontrol ediliyor…');
 try{
  const u=await sb.auth.getUser();if(u.error||!u.data?.user)throw Error('Önce yetkili yönetici girişi yapın.');
  userId=u.data.user.id;
  const role=await sb.from('admin_access').select('role').eq('user_id',userId).maybeSingle();
  if(role.error)throw role.error;
  canEdit=['owner','admin'].includes(role.data?.role);
  const r=await sb.from('site_maintenance').select('enabled').eq('id',1).single();
  if(r.error)throw r.error;
  current=requested=Boolean(r.data.enabled);
  note(canEdit?'Ayar güncel. Değişiklikler Kaydet ile uygulanır.':'Bu ayarı yalnızca kurucu veya yönetici değiştirebilir.');
 }catch(e){canEdit=false;note('Ayar yüklenemedi: '+e.message)}
 finally{busy=false;draw()}
}
sw.addEventListener('click',()=>{if(!canEdit||busy)return;requested=!requested;draw();note(requested!==current?'Değişikliği uygulamak için Kaydet butonuna basın.':'Değişiklik yok.')});
save.addEventListener('click',async()=>{if(!canEdit||busy||requested===current)return;
 const mode=requested?'açılacak':'kapatılacak';
 if(!confirm('Bakım modu '+mode+'. '+(requested?'Ziyaretçiler bakım ekranına yönlendirilecek.':'Ziyaretçiler siteyi yeniden görebilecek.')+' Onaylıyor musunuz?'))return;
 busy=true;draw();note('Kaydediliyor…');
 try{
  const r=await sb.from('site_maintenance').update({enabled:requested,updated_by:userId,updated_at:new Date().toISOString()}).eq('id',1).select('enabled').single();
  if(r.error)throw r.error;
  current=requested=Boolean(r.data.enabled);
  note(current?'Bakım modu açıldı. Ziyaretçilere bakım ekranı gösterilecek.':'Bakım modu kapatıldı. Site ziyaretçilere açıldı.');
 }catch(e){note('Kaydedilemedi: '+e.message)}
 finally{busy=false;draw()}
});
$('pk-maint-refresh')?.addEventListener('click',load);
draw();load();
})();