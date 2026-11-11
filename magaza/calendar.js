(()=>{'use strict';
const URL='https://rwylhxrtggsicieuyjrm.supabase.co',KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.supabase?.createClient(URL,KEY),$=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const tz='Europe/Istanbul',localDay=date=>new Intl.DateTimeFormat('sv-SE',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(date));
const dateFmt=iso=>new Intl.DateTimeFormat('tr-TR',{timeZone:'UTC',day:'numeric',month:'short',year:'numeric'}).format(new Date(iso+'T12:00:00Z'));
const dayNames=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
const today=localDay(new Date());
let weekStart=monday(today),members=[],orgs=[],branches=[],orders=[],items=[],view=[],filter='all',loadVersion=0;
function parseDay(iso){return new Date(iso+'T12:00:00Z')}
function shift(iso,n){const d=parseDay(iso);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function monday(iso){const d=parseDay(iso);return shift(iso,-((d.getUTCDay()+6)%7))}
function notice(s,err=false){$('notice').textContent=s;$('notice').style.color=err?'#a92c35':'#567e59'}
async function readAll(table,columns,query){
 const data=[];
 for(let start=0;start<100000;start+=1000){
  const {data:part,error}=await query(sb.from(table).select(columns)).range(start,start+999);
  if(error)throw error;
  data.push(...(part||[]));
  if(!part||part.length<1000)return data;
 }
 throw Error('Kayıt sayısı sınırı aşıldı. Daha dar filtre kullanın.');
}
function readyItem(item){return item.status==='ready'||!!item.arrived_at}
function derive(order,lines){
 const active=lines.filter(i=>i.status!=='cancelled');
 const ready=active.filter(readyItem);
 const total=active.reduce((s,i)=>s+Math.max(1,Number(i.quantity)||1),0);
 const readyQty=ready.reduce((s,i)=>s+Math.max(1,Number(i.quantity)||1),0);
 const missing=active.filter(i=>!readyItem(i));
 const missingQty=total-readyQty;
 let state=total&&missingQty===0?'ready':readyQty>0?'partial':'missing';
 if(order.status==='waiting'&&missingQty>0)state='waiting';
 if(order.status==='delivered'||order.status==='completed')state='done';
 const daysUntil=Math.round((parseDay(order.delivery_date)-parseDay(today))/86400000);
 const urgent=missingQty>0&&daysUntil<=2&&order.status!=='waiting';
 return {...order,items:active,total,readyQty,missing,missingQty,state,urgent,daysUntil,branchName:branches.find(b=>b.id===order.branch_id)?.name||'Şube belirtilmemiş'};
}
function stateName(o){return o.state==='ready'?'Teslime Hazır':o.state==='partial'?'Kısmi Hazır':o.state==='waiting'?'Beklemede':o.state==='done'?'Teslim Edildi':'Eksik Ürün'}
function pill(o){const cl=o.urgent?'urgent':o.state;return '<span class="status-pill '+cl+'">'+(o.urgent?'⚡ Acil':stateName(o))+'</span>'}
function eligible(o){return filter==='all'||filter==='urgent'&&o.urgent||filter==='partial'&&o.state==='partial'||filter==='missing'&&o.missingQty>0}
function inWeek(o){return o.delivery_date>=weekStart&&o.delivery_date<=shift(weekStart,6)}
function sortPriority(a,b){return Number(b.urgent)-Number(a.urgent)||a.delivery_date.localeCompare(b.delivery_date)||b.missingQty-a.missingQty||Number(a.order_number)-Number(b.order_number)}
function card(o){return '<button type="button" class="order-tile" data-order="'+esc(o.id)+'"><strong>'+esc(o.customer_name)+'</strong><small>'+esc(o.branchName)+'</small><small>'+esc(o.items.slice(0,2).map(i=>i.product_name).join(' + ')||'Ürün kaydı yok')+'</small>'+pill(o)+'</button>'}
function render(){
 const branch=$('branch').value;
 const weekOrders=view.filter(o=>(!branch||o.branch_id===branch)&&inWeek(o));
 const subset=weekOrders.filter(eligible);
 const pending=weekOrders.filter(o=>o.missingQty>0&&o.state!=='done');
 const urgent=weekOrders.filter(o=>o.urgent);
 const ready=weekOrders.filter(o=>o.state==='ready');
 $('stat-deliveries').textContent=weekOrders.length+' Sipariş';
 $('stat-urgent').textContent=urgent.length+' Sipariş';
 $('stat-missing').textContent=new Set(pending.map(o=>o.customer_name.toLocaleLowerCase('tr-TR'))).size+' Müşteri';
 $('stat-ready').textContent=ready.length+' Sipariş';
 $('week-label').textContent=dateFmt(weekStart)+' – '+dateFmt(shift(weekStart,6))+(weekStart===monday(today)?' (Bu Hafta)':'');
 const days=dayNames.map((name,i)=>{
  const date=shift(weekStart,i),all=subset.filter(o=>o.delivery_date===date).sort(sortPriority);
  return '<div class="day"><header><strong>'+name+'</strong><small>'+dateFmt(date)+'</small></header><div class="day-count">'+all.length+' Sipariş</div><div class="day-orders">'+(all.length?all.map(card).join(''):'<div class="empty">Teslimat yok</div>')+'</div></div>'
 });
 $('week-days').innerHTML=days.join('');
 const priority=weekOrders.filter(o=>o.state!=='done').sort(sortPriority);
 const visiblePriority=priority.filter(eligible).slice(0,8);
 $('priority-date').textContent='Bugün: '+dateFmt(today);
 $('priority-list').innerHTML=visiblePriority.map((o,i)=>'<div class="priority-entry" data-order="'+esc(o.id)+'" role="button" tabindex="0"><span class="number">'+(i+1)+'</span><span class="copy"><strong>'+esc(o.customer_name)+' · '+esc(o.branchName)+'</strong><small>'+dateFmt(o.delivery_date)+' · '+o.missingQty+' eksik / '+o.total+' adet</small></span>'+pill(o)+'</div>').join('')||'<div class="empty">Bu hafta öncelikli teslimat bulunmuyor.</div>';
 const missingRows=weekOrders.filter(o=>o.missingQty>0&&o.state!=='done').sort(sortPriority).flatMap(o=>o.missing.map(i=>({order:o,item:i})));
 $('missing-table').innerHTML=missingRows.slice(0,70).map(({order:o,item:i})=>'<tr data-order="'+esc(o.id)+'" class="clickable"><td><strong>'+esc(o.customer_name)+'</strong></td><td>'+esc(i.product_name)+' ('+Math.max(1,Number(i.quantity)||1)+' adet)</td><td>'+esc(o.branchName)+'</td><td>'+pill(o)+'</td></tr>').join('')||'<tr><td colspan="4">Bu hafta eksik ürün bulunmuyor.</td></tr>';
 const byCustomer=new Map();
 for(const o of weekOrders){
  const key=o.branch_id+'|'+o.customer_name.toLocaleLowerCase('tr-TR');
  if(!byCustomer.has(key))byCustomer.set(key,{name:o.customer_name,branch:o.branchName,quantity:0,ready:0,missing:0,partial:0,orders:0});
  const c=byCustomer.get(key);c.quantity+=o.total;c.ready+=o.readyQty;c.missing+=o.missingQty;c.partial+=o.state==='partial'?1:0;c.orders++;
 }
 $('summary-table').innerHTML=[...byCustomer.values()].sort((a,b)=>b.missing-a.missing||a.name.localeCompare(b.name,'tr')).map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+esc(c.branch)+'</td><td>'+c.quantity+' adet / '+c.orders+' sipariş</td><td>'+c.ready+'</td><td>'+c.partial+'</td><td>'+c.missing+'</td></tr>').join('')||'<tr><td colspan="6">Bu hafta teslimat bulunmuyor.</td></tr>';
 const sums=branches.filter(b=>!branch||b.id===branch).map(b=>{
  const o=weekOrders.filter(o=>o.branch_id===b.id);
  return '<div class="branch-row"><span>▣</span><div><strong>'+esc(b.name)+'</strong><small>'+o.length+' Sipariş</small></div><span class="branch-split"><b title="Teslime hazır">'+o.filter(x=>x.state==='ready').length+'</b><b class="partial" title="Kısmi hazır">'+o.filter(x=>x.state==='partial').length+'</b><b class="missing" title="Eksik ürünlü">'+o.filter(x=>x.missingQty>0).length+'</b></span></div>'
 });
 $('branch-list').innerHTML=sums.join('')||'<div class="empty">Şube bulunamadı.</div>';
 notice(weekOrders.length+' teslimat listelendi. Kırmızı işaretli kayıtların mağazaya ulaşmamış ürünleri var.');
}
function showOrder(id){
 const o=view.find(x=>x.id===id);if(!o)return;
 $('modal-title').textContent='#'+o.order_number+' · '+o.customer_name;
 const items=o.items.map(i=>'<p><strong>'+esc(i.product_name)+'</strong> · '+Math.max(1,Number(i.quantity)||1)+' adet · '+(i.width_cm??'—')+' × '+(i.height_cm??'—')+' cm · '+(readyItem(i)?'<span style="color:#287e40">Mağazada</span>':'<span class="warning-text">Eksik / '+esc(i.status)+'</span>')+'</p>').join('');
 $('modal-content').innerHTML='<div class="section"><p><strong>Şube:</strong> '+esc(o.branchName)+'</p><p><strong>Teslim tarihi:</strong> '+dateFmt(o.delivery_date)+'</p><p><strong>Durum:</strong> '+stateName(o)+'</p><p><strong>Ürün:</strong> '+o.total+' adet · <strong>Hazır:</strong> '+o.readyQty+' · <strong>Eksik:</strong> '+o.missingQty+'</p></div><div class="section"><strong>Ürün Bazlı Teslim Kontrolü</strong>'+items+'</div><a href="./order-new.html?org='+encodeURIComponent(o.organization_id)+'&edit='+encodeURIComponent(o.id)+'">Siparişi Aç / Düzenle</a>';
 $('modal').hidden=false;
}
async function reload(){
 const load=++loadVersion,org=$('organization').value,previousBranch=$('branch').value;
 if(!org)return;
 notice('Sipariş ve ürün durumları yükleniyor...');
 try{
  const [branchRows,orderRows]=await Promise.all([
   readAll('erp_branches','id,name',q=>q.eq('organization_id',org)),
   readAll('erp_orders','id,organization_id,branch_id,order_number,customer_name,customer_phone,delivery_date,status',q=>q.eq('organization_id',org).gte('delivery_date',shift(weekStart,-14)).lte('delivery_date',shift(weekStart,20)).order('delivery_date'))
  ]);
  if(load!==loadVersion)return;
  branches=branchRows;orders=orderRows.filter(o=>o.delivery_date&&o.status!=='cancelled');
  $('branch').innerHTML='<option value="">Tüm Şubeler</option>'+branches.map(b=>'<option value="'+esc(b.id)+'">'+esc(b.name)+'</option>').join('');
  if(branches.some(b=>b.id===previousBranch))$('branch').value=previousBranch;
  const ids=orders.map(o=>o.id),found=[];
  for(let i=0;i<ids.length;i+=110){
   const batch=await readAll('erp_order_items','id,order_id,product_name,category,quantity,width_cm,height_cm,status,arrived_at',q=>q.eq('organization_id',org).in('order_id',ids.slice(i,i+110)));
   found.push(...batch);
  }
  if(load!==loadVersion)return;
  items=found;
  const byOrder=new Map();
  for(const item of items){if(!byOrder.has(item.order_id))byOrder.set(item.order_id,[]);byOrder.get(item.order_id).push(item)}
  view=orders.map(o=>derive(o,byOrder.get(o.id)||[]));
  render();
 }catch(e){if(load===loadVersion)notice('Takvim yüklenemedi: '+e.message,true)}
}
async function init(){
 if(!sb){notice('Veri bağlantısı yüklenemedi.',true);return}
 const {data,error}=await sb.auth.getUser();if(error||!data?.user){notice('Takvimi görmek için KONAK ERP hesabınıza giriş yapın.',true);return}
 try{
  members=await readAll('erp_members','organization_id',q=>q.eq('user_id',data.user.id));
  if(!members.length){notice('İşletme erişimi bulunmuyor.',true);return}
  orgs=await readAll('erp_organizations','id,name',q=>q.in('id',members.map(m=>m.organization_id)));
  $('organization').innerHTML=orgs.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.name)+'</option>').join('');
  const preferred=new URLSearchParams(location.search).get('org');
  if(orgs.some(o=>o.id===preferred))$('organization').value=preferred;
  await reload();
 }catch(e){notice('Takvim başlatılamadı: '+e.message,true)}
}
$('organization').onchange=()=>{$('branch').value='';reload()};
$('branch').onchange=render;
$('today').onclick=()=>{weekStart=monday(today);reload()};
$('refresh').onclick=reload;
$('previous').onclick=()=>{weekStart=shift(weekStart,-7);reload()};
$('next').onclick=()=>{weekStart=shift(weekStart,7);reload()};
document.querySelectorAll('[data-filter]').forEach(btn=>btn.onclick=()=>{filter=btn.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b===btn));render()});
document.addEventListener('click',e=>{const node=e.target.closest('[data-order]');if(node)showOrder(node.dataset.order)});
document.addEventListener('keydown',e=>{if(e.key==='Enter'){const node=e.target.closest('[data-order]');if(node)showOrder(node.dataset.order)}if(e.key==='Escape')$('modal').hidden=true});
$('modal-close').onclick=()=>$('modal').hidden=true;
$('modal').onclick=e=>{if(e.target===$('modal'))$('modal').hidden=true};
$('print-week').onclick=()=>window.print();
init();
})();