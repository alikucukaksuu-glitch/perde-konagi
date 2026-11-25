(()=>{'use strict';
const api='https://rwylhxrtggsicieuyjrm.supabase.co',key='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA',sb=window.supabase?.createClient(api,key);
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
let role='',org='';
window.loadApprovalRequests=async function(){
 org=$('org').value;
 const user=(await sb.auth.getUser()).data.user;
 if(!user)return [];
 const {data:member,error:memberError}=await sb.from('erp_members').select('role').eq('user_id',user.id).eq('organization_id',org).maybeSingle();
 if(memberError)throw memberError;
 role=member?.role||'staff';
 const {data,error}=await sb.rpc('erp_list_cash_edit_requests',{p_org:org});
 if(error)throw error;
 const requests=Array.isArray(data)?data:[];
 const pending=requests.filter(x=>x.status==='pending');
 $('cash-approval-count').textContent=pending.length;
 $('cash-approvals').hidden=!['owner','manager'].includes(role);
 const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
 $('cash-approval-list').innerHTML=requests.map(x=>{
 const old=x.before_data||{},now=x.proposed_data||{},amount=x.source==='initial'?old.paid_amount:old.amount;
 const status={pending:'Onay Bekliyor',approved:'Onaylandı',rejected:'Reddedildi'}[x.status];
 const controls=x.status==='pending'&&['owner','manager'].includes(role)?'<button type="button" class="primary" data-cash-approve="'+esc(x.id)+'">Onayla</button> <button type="button" data-cash-reject="'+esc(x.id)+'">Reddet</button>':'';
 return '<div class="cash-review-entry"><strong>'+esc(x.created_by)+'</strong> · '+esc(x.created_at?new Date(x.created_at).toLocaleString('tr-TR'):'')+' · '+esc(status)+'<div><b>Tutar:</b> '+esc(money(amount))+' → '+esc(money(now.amount))+'</div><div><b>Yöntem:</b> '+esc(old.method||old.payment_method||'')+' → '+esc(now.method||'')+'</div>'+(x.source==='cash'?'<div><b>İşlem Türü:</b> '+esc(old.direction||'')+' → '+esc(now.direction||'')+'</div>':'')+'<div><b>Açıklama:</b> '+esc(old.description||old.note||'')+' → '+esc(now.description||'')+'</div>'+controls+(x.review_note?'<small>Yönetici notu: '+esc(x.review_note)+'</small>':'')+'</div>';
 }).join('')||'Onay bekleyen kasa değişikliği bulunmuyor.';
 return requests;
};
$('cash-approval-list')?.addEventListener('click',async e=>{
 const yes=e.target.closest('[data-cash-approve]'),no=e.target.closest('[data-cash-reject]');
 if(!yes&&!no||!['owner','manager'].includes(role))return;
 const approve=!!yes,id=(yes||no).dataset[approve?'cashApprove':'cashReject'];
 const note=prompt(approve?'Onay notu (isteğe bağlı)':'Reddetme gerekçesi','');
 if(note===null||!approve&&!note.trim())return;
 if(!confirm(approve?'Bu talep onaylanınca kasa kaydı değişecek. Onaylıyor musunuz?':'Bu değişiklik talebini reddetmek istiyor musunuz?'))return;
 const {error}=await sb.rpc('erp_review_cash_edit_request',{p_org:org,p_request:id,p_approve:approve,p_note:note.trim()});
 if(error){alert('İşlem başarısız: '+error.message);return;}
 location.reload();
});
$('reload-approvals')?.addEventListener('click',()=>window.loadApprovalRequests().catch(e=>alert(e.message)));
})();