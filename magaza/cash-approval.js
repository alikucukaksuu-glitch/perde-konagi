(()=>{'use strict';
const $=id=>document.getElementById(id), api='https://rwylhxrtggsicieuyjrm.supabase.co',key='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const client=window.supabase?.createClient(api,key);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
let role='',uid='',org='',selectedId='',requests=[];
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
async function setup(){
 if(!client)return;
 const {data:{user}}=await client.auth.getUser();
 if(!user)return;
 uid=user.id;
 org=$('org')?.value;
 if(!org)return;
 const {data:member,error}=await client.from('erp_members').select('role').eq('user_id',uid).eq('organization_id',org).maybeSingle();
 if(error||!member)return;
 role=member.role;
 $('cash-approvals').hidden=role!=='owner'&&role!=='manager';
 await refreshRequests();
}
function recordRow(r){
 const b=r.before_data||{},p=r.proposed_data||{};
 const oldAmount=r.source==='initial'?b.paid_amount:b.amount;
 const oldMethod=b.method||b.payment_method||'cash';
 const label=r.source==='initial'?'Başlangıç Tahsilatı':r.source==='payment'?'Sipariş Tahsilatı':r.order_id?'Sipariş Tahsilatı':'Manuel Kasa Hareketi';
 const change=(name,a,z)=>'<div><b>'+escape(name)+':</b> '+escape(a??'—')+' → '+escape(z??'—')+'</div>';
 const changes=change('Tutar',money(oldAmount),money(p.amount))
 +change('Yöntem',oldMethod,p.method)
 +(r.source==='cash'?change('İşlem Türü',b.direction,p.direction):'')
 +(r.source!=='initial'?change('Açıklama',b.description||b.note,p.description):'');
 const actions=r.status==='pending'&&['owner','manager'].includes(role)?'<button type="button" data-approve="'+escape(r.id)+'" class="primary">Onayla</button> <button type="button" data-reject="'+escape(r.id)+'">Reddet</button>':'';
 const status={pending:'Onay Bekliyor',approved:'Onaylandı',rejected:'Reddedildi'}[r.status]||r.status;
 return '<div class="cash-review-entry"><strong>'+escape(label)+'</strong> · '+escape(r.created_by)+' · '+escape(new Date(r.created_at).toLocaleString('tr-TR'))+' <span class="status">'+escape(status)+'</span>'+changes+'<div>'+actions+'</div>'+(r.review_note?'<small>Yönetici notu: '+escape(r.review_note)+'</small>':'')+'</div>';
}
async function refreshRequests(){
 if(!org)return;
 const {data,error}=await client.rpc('erp_list_cash_edit_requests',{p_org:org});
 if(error){$('cash-approval-list').textContent='Onay talepleri yüklenemedi: '+error.message;return}
 requests=Array.isArray(data)?data:[];
 const pending=requests.filter(r=>r.status==='pending');
 $('cash-approval-count').textContent=pending.length;
 $('cash-approval-list').innerHTML=requests.map(recordRow).join('')||'Henüz kasa düzeltme talebi bulunmuyor.';
}
async function review(id,approved){
 if(!['owner','manager'].includes(role))return;
 let note=prompt(approved?'Onay notu (isteğe bağlı)':'Ret gerekçesi', '');
 if(note===null)return;
 if(!approved&&!note.trim()){alert('Ret gerekçesi zorunludur.');return}
 if(!confirm(approved?'Onayladığınızda gerçek kasa kaydı değişecektir. Devam edilsin mi?':'Talep reddedilsin mi?'))return;
 const {error}=await client.rpc('erp_review_cash_edit_request',{p_org:org,p_request:id,p_approve:approved,p_note:note.trim()});
 if(error){alert('İşlem gerçekleştirilemedi: '+error.message);return}
 await refreshRequests();
 if(approved)location.reload();
}
$('cash-approval-list')?.addEventListener('click',e=>{
 const approve=e.target.closest('[data-approve]'),reject=e.target.closest('[data-reject]');
 if(approve)review(approve.dataset.approve,true);
 if(reject)review(reject.dataset.reject,false);
});
$('reload-approvals')?.addEventListener('click',refreshRequests);
$('org')?.addEventListener('change',()=>{role='';selectedId='';setTimeout(setup,150)});
$('movements')?.addEventListener('click',e=>{
 const btn=e.target.closest('[data-edit-expense]');
 if(!btn)return;
 selectedId=btn.dataset.editExpense;
 if(role==='staff')setTimeout(()=>{
  $('save-expense-edit').textContent='Yöneticiye Onaya Gönder';
  $('edit-expense-help').textContent+=' Bu talep yönetici onaylamadan kasayı değiştirmez.';
 },0);
},true);
document.addEventListener('submit',async e=>{
 if(e.target?.id!=='edit-expense-form'||role!=='staff')return;
 e.preventDefault();e.stopImmediatePropagation();
 const record=selectedId;
 if(!record){alert('Düzenlenecek işlem bulunamadı.');return}
 const source=record.startsWith('initial-')?'initial':null;
 const recordId=source?record.slice(8):record;
 const data={
  p_org:org,p_source:source,p_record:recordId,p_branch:$('edit-expense-branch').value,
  p_direction:$('edit-expense-direction').value,p_amount:Number($('edit-expense-amount').value),
  p_method:$('edit-expense-method').value,p_description:$('edit-expense-description').value.trim(),
  p_counterparty:$('edit-expense-counterparty').value.trim()||null,
  p_recorded_at:new Date($('edit-expense-date').value+':00+03:00').toISOString()
 };
 const feedback=$('edit-expense-feedback'),button=$('save-expense-edit');
 button.disabled=true;feedback.textContent='Onay talebi hazırlanıyor...';
 try{
  if(!source){
   let found=await client.from('erp_cash_movements').select('id').eq('organization_id',org).eq('id',recordId).maybeSingle();
   if(found.error)throw found.error;
   if(found.data)data.p_source='cash';
   else{
    found=await client.from('erp_order_payments').select('id').eq('organization_id',org).eq('id',recordId).maybeSingle();
    if(found.error)throw found.error;
    if(!found.data)throw Error('Kasa hareketi bulunamadı');
    data.p_source='payment';
   }
  }
  if(!confirm('Değişiklik talebini yönetici onayına gönderelim mi? Mevcut kasa kaydı değiştirilmez.'))return;
  const {error}=await client.rpc('erp_request_cash_edit',data);
  if(error)throw error;
  $('edit-expense-modal').hidden=true;
  await refreshRequests();
  alert('Düzenleme talebi yöneticiye gönderildi. Onay verilmeden kayıt değiştirilemez.');
  location.reload();
 }catch(err){feedback.textContent='Talep gönderilemedi: '+err.message}
 finally{button.disabled=false}
},true);
setTimeout(setup,900);
})();