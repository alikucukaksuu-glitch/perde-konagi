(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co',KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.__konakErpClient||(window.__konakErpClient=window.supabase?.createClient(API,KEY));
const $=id=>document.getElementById(id);
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const types={measurement:'Evde Ölçü Alma',installation:'Montaj'};
const statuses={pending:'Bekliyor',scheduled:'Planlandı',completed:'Tamamlandı',cancelled:'İptal'};
let organizations=[],org='',branches=[],records=[],editing=null,working=false;
const note=t=>$('message').textContent=t||'';
const formNote=t=>$('form-message').textContent=t||'';
function options(select,items,placeholder){select.replaceChildren();if(placeholder)select.add(new Option(placeholder,''));items.forEach(i=>select.add(new Option(i.name,i.id)))}
async function refresh(){
 note('Randevular yükleniyor...');
 const [br,ap]=await Promise.all([sb.from('erp_branches').select('id,name').eq('organization_id',org).order('name'),sb.from('erp_appointments').select('*').eq('organization_id',org).order('created_at',{ascending:false})]);
 if(br.error)throw br.error;if(ap.error)throw ap.error;
 branches=br.data||[];records=ap.data||[];
 const selected=$('branch-filter').value;options($('branch-filter'),branches,'Tüm Şubeler');if(branches.some(b=>b.id===selected))$('branch-filter').value=selected;
 render();note('');
}
function branchName(id){return branches.find(x=>x.id===id)?.name||'Şube'}
function messageFor(a){
 const date=a.appointment_date?new Date(a.appointment_date+'T12:00:00').toLocaleDateString('tr-TR'):'Henüz belirlenmedi';
 const lines=['📌 KONAK ERP · MONTAJ / ÖLÇÜ RANDEVUSU','İşlem: '+types[a.appointment_type],'Şube: '+branchName(a.branch_id),'Müşteri: '+a.customer_name,'Telefon: '+a.customer_phone,'Ev adresi: '+a.customer_address,'Tarih: '+date,'Saat: '+(a.appointment_time?String(a.appointment_time).slice(0,5):'Henüz belirlenmedi'),'Durum: '+statuses[a.status]];
 if(a.notes)lines.push('Not: '+a.notes);return lines.join('\n');
}
function render(){
 const b=$('branch-filter').value,t=$('type-filter').value;
 const shown=records.filter(a=>(!b||a.branch_id===b)&&(!t||a.appointment_type===t));
 $('list').innerHTML=shown.map(a=>'<article class="item"><div><span class="chip '+safe(a.appointment_type)+'">'+safe(types[a.appointment_type]||'Randevu')+'</span> <span class="chip">'+safe(statuses[a.status]||a.status)+'</span></div><h3>'+safe(a.customer_name)+'</h3><div class="meta"><strong>Şube:</strong> '+safe(branchName(a.branch_id))+' &nbsp; <strong>Telefon:</strong> '+safe(a.customer_phone)+'<br><strong>Randevu:</strong> '+safe(a.appointment_date?new Date(a.appointment_date+'T12:00:00').toLocaleDateString('tr-TR'):'Tarih belirlenmedi')+' '+safe(a.appointment_time?String(a.appointment_time).slice(0,5):'')+'</div><div class="address"><strong>Ev Adresi:</strong> '+safe(a.customer_address)+'</div>'+(a.notes?'<div class="muted">Not: '+safe(a.notes)+'</div>':'')+'<div class="actions"><button data-action="edit" data-id="'+a.id+'">Düzenle</button><button class="primary" data-action="whatsapp" data-id="'+a.id+'">WhatsApp’tan Gönder</button></div></article>').join('')||'<div class="panel">Bu filtreye uygun randevu bulunamadı.</div>';
}
function open(a=null){
 editing=a;$('form').reset();formNote('');
 options($('form-branch'),branches);const f=$('form').elements;
 if(a){for(const k of ['appointment_type','branch_id','customer_name','customer_phone','customer_address','appointment_date','appointment_time','status','notes'])f[k].value=a[k]||((k==='status')?'pending':'')}
 else if($('branch-filter').value)f.branch_id.value=$('branch-filter').value;
 $('form-heading').textContent=a?'Randevuyu Düzenle':'Yeni Randevu';$('dialog').showModal();
}
$('new').onclick=()=>open();$('close').onclick=$('cancel').onclick=()=>$('dialog').close();
$('organization').onchange=()=>{org=$('organization').value;refresh().catch(e=>note('Yükleme hatası: '+e.message))};
$('branch-filter').onchange=render;$('type-filter').onchange=render;
$('list').onclick=async e=>{
 const btn=e.target.closest('button[data-action]');if(!btn)return;
 const a=records.find(r=>r.id===btn.dataset.id);if(!a)return;
 if(btn.dataset.action==='edit'){open(a);return}
 if(btn.dataset.action==='whatsapp'){
  const text=messageFor(a);
  const url='https://api.whatsapp.com/send?text='+encodeURIComponent(text);
  // Open synchronously while the user's click is still active. Never navigate the embedded ERP frame.
  const link=document.createElement('a');
  link.href=url;link.target='_blank';link.rel='noopener noreferrer';
  document.body.append(link);link.click();link.remove();
  try{await navigator.clipboard.writeText(text)}catch(_){}
  note('Mesaj hazırlandı. WhatsApp ayrı sekmede açılır. “Montaj ve Ölçü” grubunu seçip Gönder’e basın.');return;
 }
};
$('form').onsubmit=async e=>{
 e.preventDefault();if(working)return;
 const f=e.currentTarget,fd=new FormData(f),payload={
 organization_id:org,branch_id:String(fd.get('branch_id')||''),appointment_type:String(fd.get('appointment_type')||''),
 customer_name:String(fd.get('customer_name')||'').trim(),customer_phone:String(fd.get('customer_phone')||'').trim(),customer_address:String(fd.get('customer_address')||'').trim(),
 appointment_date:fd.get('appointment_date')||null,appointment_time:fd.get('appointment_time')||null,
 status:String(fd.get('status')||'pending'),notes:String(fd.get('notes')||'').trim(),updated_at:new Date().toISOString()
 };
 if(!branches.some(b=>b.id===payload.branch_id)){formNote('Geçerli bir şube seçin.');return}
 working=true;$('save').disabled=true;formNote('Kaydediliyor...');
 try{
  if(!editing){const {data}=await sb.auth.getUser();if(!data?.user)throw Error('Oturum bulunamadı');payload.created_by=data.user.id}
  const result=editing?await sb.from('erp_appointments').update(payload).eq('id',editing.id).eq('organization_id',org).select('id').single():await sb.from('erp_appointments').insert(payload).select('id').single();
  if(result.error)throw result.error;
  $('dialog').close();await refresh();note('Randevu başarıyla kaydedildi.');
 }catch(error){formNote('Kayıt yapılamadı: '+error.message)}finally{working=false;$('save').disabled=false}
};
async function init(){
 if(!sb)throw Error('Supabase yüklenemedi');
 const session=(await sb.auth.getSession()).data?.session;if(!session?.user){$('auth').textContent='Randevuları görmek için KONAK ERP hesabınıza giriş yapın.';return}
 const {data:members,error}=await sb.from('erp_members').select('organization_id,role').eq('user_id',session.user.id);if(error)throw error;
 if(!members?.length)throw Error('Yetkili işletme bulunamadı');
 const {data:names}=await sb.from('erp_organizations').select('id,name').in('id',members.map(m=>m.organization_id));
 const lookup=new Map((names||[]).map(n=>[n.id,n.name]));organizations=members.map(m=>({id:m.organization_id,name:lookup.get(m.organization_id)||'İşletme'}));
 options($('organization'),organizations);
 const requested=new URLSearchParams(location.search).get('org');org=organizations.some(x=>x.id===requested)?requested:organizations[0].id;$('organization').value=org;
 $('auth').hidden=true;$('app').hidden=false;await refresh();
}
init().catch(e=>{$('auth').textContent='Montaj randevuları açılamadı: '+e.message;note(e.message)});
})();