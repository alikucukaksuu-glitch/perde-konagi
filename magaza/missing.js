(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co',KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.supabase?.createClient(API,KEY),$=id=>document.getElementById(id);
const label=val=>String(val??'');
let user=null,org='',organizations=[],branches=[],items=[],tab='all',busy=new Set();
const dateParts=()=>{const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const obj=Object.fromEntries(parts.map(p=>[p.type,p.value]));return obj.year+'-'+obj.month+'-'+obj.day};
const today=dateParts();
const days=(date)=>{if(!date)return null;const a=Date.parse(date+'T12:00:00Z'),b=Date.parse(today+'T12:00:00Z');return Math.round((a-b)/86400000)};
const formatDate=s=>s?new Date(s+'T12:00:00').toLocaleDateString('tr-TR'):'Belirtilmedi';
function msg(s){$('message').textContent=s||''}
function hideAuth(){$('auth-needed').hidden=true;$('main-area').hidden=false}
function showAuth(text){$('auth-needed').hidden=false;$('main-area').hidden=true;if(text)$('auth-needed').querySelector('p').textContent=text}
function create(tag,klass,content){const e=document.createElement(tag);if(klass)e.className=klass;if(content!==undefined)e.textContent=label(content);return e}
function optionList(select,values,placeholder,prior=''){
 select.replaceChildren(new Option(placeholder,''));
 values.forEach(v=>select.add(new Option(v.name,v.id)));
 select.value=values.some(v=>v.id===prior)?prior:'';
}
async function init(){
 if(!sb){showAuth('Veritabanı bağlantısı yüklenemedi. Sayfayı yenileyin.');return}
 const {data,error}=await sb.auth.getUser();
 user=error?null:data?.user;
 if(!user){showAuth();return}
 $('user-email').textContent=user.email||'Personel';
 try{
  const {data:members,error:memberError}=await sb.from('erp_members').select('organization_id').eq('user_id',user.id);
  if(memberError)throw memberError;
  const ids=(members||[]).map(x=>x.organization_id);
  if(!ids.length){showAuth('İşletme üyeliği bulunamadı. Hesabım bölümünden işletme oluşturun.');return}
  const {data:orgData,error:orgError}=await sb.from('erp_organizations').select('id,name').in('id',ids).order('name');
  if(orgError)throw orgError;
  organizations=orgData||[];
  const preferred=new URLSearchParams(location.search).get('org');
  org=organizations.find(o=>o.id===preferred)?.id||organizations[0]?.id||'';
  const select=$('org-filter');select.replaceChildren();
  organizations.forEach(x=>select.add(new Option(x.name,x.id)));select.value=org;
  hideAuth();await load();
 }catch(e){showAuth('Eksik ürünlere erişilemedi: '+e.message)}
}
async function load(){
 if(!org)return;
 msg('Eksik ürünler yükleniyor...');
 try{
  const [branchResponse,missingResponse]=await Promise.all([
   sb.from('erp_branches').select('id,name').eq('organization_id',org).order('name'),
   sb.rpc('erp_list_missing_items',{p_org:org})
  ]);
  if(branchResponse.error||missingResponse.error)throw branchResponse.error||missingResponse.error;
  branches=branchResponse.data||[];items=missingResponse.data||[];
  const previous=$('branch-filter').value;
  optionList($('branch-filter'),branches,'Tüm Şubeler',previous);
  render();msg(items.length>=2000?'En fazla 2.000 ürün gösteriliyor. Daha fazlası için işletme bazında rapor alınmalıdır.':'');
 }catch(e){msg('Liste yüklenemedi: '+e.message)}
}
function filteredItems(){
 const branch=$('branch-filter').value,query=$('search-filter').value.trim().toLocaleLowerCase('tr-TR');
 return items.filter(i=>{
  if(branch&&i.branch_id!==branch)return false;
  if(tab==='urgent'&&!i.urgent)return false;
  if(tab==='late'&&!(days(i.delivery_date)<0))return false;
  if(tab==='today'&&days(i.delivery_date)!==0)return false;
  if(query&&![i.order_number,i.customer_name,i.product_name,i.category,i.barcode,i.branch_name].join(' ').toLocaleLowerCase('tr-TR').includes(query))return false;
  return true;
 });
}
function render(){
 $('total-missing').textContent=items.length;
 $('total-urgent').textContent=items.filter(i=>i.urgent).length;
 $('total-late').textContent=items.filter(i=>days(i.delivery_date)<0).length;
 $('total-today').textContent=items.filter(i=>days(i.delivery_date)===0).length;
 $('tab-filters').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
 const container=$('product-list');container.replaceChildren();
 const filtered=filteredItems().sort((a,b)=>(Number(b.urgent)-Number(a.urgent))||((days(a.delivery_date)??9999)-(days(b.delivery_date)??9999))||(Number(a.order_number)-Number(b.order_number)));
 if(!filtered.length){container.append(create('div','card missing-empty','Bu filtrede eksik ürün bulunmuyor.'));return}
 for(const item of filtered){
  const card=create('article','card missing-card'+(item.urgent?' urgent':''));
  const details=create('div');
  const heading=create('div','missing-card-head');
  heading.append(create('strong','',('#'+item.order_number+' · '+item.customer_name)));
  if(item.urgent)heading.append(create('span','missing-badge','ACİL'));
  const diff=days(item.delivery_date),due=create('span','due'+(diff!==null&&diff<0?' late':diff===0?' today':''),diff===null?'Teslim tarihi yok':diff<0?Math.abs(diff)+' gün gecikti':diff===0?'Bugün teslim':diff+' gün kaldı');
  heading.append(due);details.append(heading);
  details.append(create('div','item-name',item.category+' · '+item.product_name));
  const meta=create('div','meta');
  [item.branch_name,'En: '+(item.width_cm??'—')+' cm','Boy: '+(item.height_cm??'—')+' cm','Teslim: '+formatDate(item.delivery_date)].forEach(v=>meta.append(create('span','',v)));
  details.append(meta);
  if(item.production_note)details.append(create('p','item-notes','Üretim notu: '+item.production_note));
  const actions=create('div','missing-card-actions');
  const checkboxLabel=create('label','urgent-checkbox');
  const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=!!item.urgent;checkbox.disabled=busy.has(item.item_id);
  checkbox.addEventListener('change',()=>changeUrgent(item,!item.urgent));
  checkboxLabel.append(checkbox,document.createTextNode('Acil listeye ekle'));actions.append(checkboxLabel);
  if(item.urgent){
   const note=create('div','urgent-note','Acil notu: '+(item.urgent_note||'Not belirtilmedi'));actions.append(note);
  }
  const tools=create('div','missing-urgent-tools');
  const edit=create('button','secondary',item.urgent?'Acil Notunu Düzenle':'Acil Notuyla Ekle');edit.type='button';edit.disabled=busy.has(item.item_id);edit.onclick=()=>editUrgent(item);
  const orderLink=create('a','view-order','Siparişi Aç');orderLink.href='./order-new.html?org='+encodeURIComponent(org)+'&edit='+encodeURIComponent(item.order_id);
  tools.append(edit,orderLink);actions.append(tools);card.append(details,actions);container.append(card);
 }
}
async function changeUrgent(item,urgent,note){
 if(busy.has(item.item_id))return;
 busy.add(item.item_id);render();
 try{
  const {error}=await sb.rpc('erp_set_item_urgent',{p_org:org,p_item:item.item_id,p_urgent:urgent,p_note:urgent?(note??item.urgent_note??''):''});
  if(error)throw error;
  await load();
  msg(urgent?'Ürün acil listeye eklendi.':'Ürün acil listeden çıkarıldı.');
 }catch(e){msg('Acil işareti güncellenemedi: '+e.message);render()}
 finally{busy.delete(item.item_id);render()}
}
function editUrgent(item){
 const note=prompt('Atölyeye iletilecek acil ürün notu:',item.urgent_note||'');
 if(note===null)return;
 if(note.length>1000){msg('Acil açıklaması 1.000 karakteri geçemez.');return}
 changeUrgent(item,true,note.trim());
}
function urgentList(){
 const chosen=items.filter(x=>x.urgent&&(!$('branch-filter').value||x.branch_id===$('branch-filter').value));
 const orgName=organizations.find(o=>o.id===org)?.name||'İşletme';
 const rows=chosen.map((i,index)=>(index+1)+'. Sipariş #'+i.order_number+' | '+i.customer_name+' | '+i.category+' - '+i.product_name+' | '+(i.width_cm??'—')+' × '+(i.height_cm??'—')+' cm | '+i.branch_name+' | Teslim: '+formatDate(i.delivery_date)+(i.urgent_note?' | Acil Notu: '+i.urgent_note:''));
 return {chosen,text:'KONAK ERP – ACİL EKSİK ÜRÜN LİSTESİ\nİşletme: '+orgName+'\n\n'+rows.join('\n')+'\n\nToplam: '+chosen.length+' ürün'};
}
async function copyList(){
 const {chosen,text}=urgentList();if(!chosen.length){msg('Acil listede ürün bulunmuyor.');return}
 try{await navigator.clipboard.writeText(text);msg(chosen.length+' acil ürünün listesi kopyalandı. Atölyeye gönderebilirsiniz.')}
 catch(e){msg('Kopyalama engellendi. Tarayıcı izinlerini kontrol edin.')}
}
async function shareList(){
 const {chosen,text}=urgentList();if(!chosen.length){msg('Önce acil ürünleri işaretleyin.');return}
 if(navigator.share){try{await navigator.share({title:'KONAK ERP Acil Eksik Ürünler',text})}catch(e){if(e.name!=='AbortError')msg('Paylaşılamadı: '+e.message)}}
 else await copyList();
}
$('org-filter').onchange=e=>{org=e.target.value;load()};
$('branch-filter').onchange=render;
$('search-filter').oninput=render;
$('tab-filters').onclick=e=>{const button=e.target.closest('[data-tab]');if(!button)return;tab=button.dataset.tab;render()};
$('refresh').onclick=load;
$('copy-urgent').onclick=copyList;
$('share-urgent').onclick=shareList;
$('logout').onclick=async()=>{await sb.auth.signOut();location.href='./'};
init();
})();