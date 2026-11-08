(()=>{'use strict';
const sb=window.supabase?.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const $=id=>document.getElementById(id),el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!=null)x.textContent=String(txt);return x};
let rows=[],role='',loading=false,initialized=false;
async function load(){
 if(loading||!sb)return;loading=true;const feedback=$('cm-feedback');feedback.textContent='Mesajlar yükleniyor…';
 try{
  const auth=await sb.auth.getUser();const user=auth.data?.user;if(!user)throw Error('Yönetici hesabıyla giriş yapın.');
  const access=await sb.from('admin_access').select('role').eq('user_id',user.id).maybeSingle();if(access.error)throw access.error;
  role=access.data?.role||'';if(!['owner','admin','staff'].includes(role))throw Error('Mesajları görüntüleme yetkiniz yok.');
  const res=await sb.from('contact_messages').select('id,full_name,email,phone,message,status,created_at').order('created_at',{ascending:false}).limit(300);
  if(res.error)throw res.error;rows=res.data||[];render();feedback.textContent=rows.length+' mesaj listelendi.';
 }catch(err){feedback.textContent='Mesajlar yüklenemedi: '+err.message; $('cm-list').replaceChildren()}finally{loading=false}
}
function render(){
 const target=$('cm-list');if(!target)return;target.replaceChildren();
 const filter=$('cm-status').value,data=rows.filter(x=>filter==='all'||x.status===filter);
 if(!data.length){target.append(el('p','cm-empty','Bu filtreye uygun mesaj bulunmuyor.'));return}
 for(const row of data){
  const card=el('article','cm-card');
  const top=el('div','cm-top'),heading=el('div');heading.append(el('strong','',row.full_name),el('small','',new Date(row.created_at).toLocaleString('tr-TR')));
  top.append(heading,el('span','cm-badge '+row.status,({new:'Yeni',read:'Okundu',closed:'Kapandı'})[row.status]||row.status));
  card.append(top);
  const contact=el('div','cm-contact');const email=el('a','',row.email);email.href='mailto:'+encodeURIComponent(row.email);contact.append(email);
  if(row.phone)contact.append(el('span','',row.phone));card.append(contact,el('p','cm-message',row.message));
  if(role==='owner'||role==='admin'){
   const actions=el('div','cm-actions');
   for(const [value,label] of [['read','Okundu'],['closed','Kapat'],['new','Yeni olarak işaretle']]){
    if(value===row.status)continue;
    const button=el('button','',label);button.type='button';button.onclick=async()=>{
     button.disabled=true;
     const result=await sb.from('contact_messages').update({status:value}).eq('id',row.id).select('id,status').maybeSingle();
     if(result.error||!result.data){alert(result.error?.message||'Durum güncellenemedi.');button.disabled=false;return}
     row.status=value;render();
    };actions.append(button)
   }
   card.append(actions);
  }
  target.append(card);
 }
}
function init(){if(initialized)return;initialized=true;$('cm-refresh').onclick=load;$('cm-status').onchange=render;load()}
document.addEventListener('click',e=>{if(e.target.closest('[data-section="messages"]'))setTimeout(()=>{init();load()},50)});
window.addEventListener('hashchange',()=>{if(location.hash==='#messages'){init();load()}});
sb?.auth.onAuthStateChange((event,session)=>{if(session?.user&&['SIGNED_IN','INITIAL_SESSION'].includes(event)&&location.hash==='#messages')setTimeout(init,70)});
if(location.hash==='#messages')setTimeout(init,400);
})();