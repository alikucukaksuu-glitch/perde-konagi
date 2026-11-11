(()=>{'use strict';
const SB_URL='https://rwylhxrtggsicieuyjrm.supabase.co',SB_KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.supabase?.createClient(SB_URL,SB_KEY),$=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const dateTR=v=>v?new Date(v).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul',dateStyle:'short',timeStyle:'short'}):'—';
const localDate=v=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v));
const methodLabel={cash:'Nakit',card:'Kart',transfer:'Havale/EFT'};
let user=null,orgs=[],branches=[],orders=[],payments=[],moves=[],members=[],rows=[],filtered=[],selectedOrg='',page=0,entryType='income',loading=false;
function feedback(t,error=false){$('feedback').textContent=t;$('feedback').style.color=error?'#bd4431':'#547b62'}
async function readAll(table,columns,filter){
 let result=[];
 for(let start=0;start<100000;start+=1000){
  const {data,error}=await filter(sb.from(table).select(columns)).range(start,start+999);
  if(error)throw error;
  result.push(...(data||[]));if(!data||data.length<1000)return result;
 }
 throw Error('Çok fazla işlem var. Veri kapsamını daraltın.');
}
function selectedOrders(){return orders.filter(o=>$('branch').value===''||o.branch_id===$('branch').value)}
function unitMoney(n){return Math.round(Number(n||0)*100)/100}
function makeRows(){
 const paymentsByOrder=new Map(),cashByOrder=new Map();
 for(const p of payments)paymentsByOrder.set(p.order_id,(paymentsByOrder.get(p.order_id)||0)+Number(p.amount||0));
 for(const m of moves)if(m.order_id&&m.direction==='income')cashByOrder.set(m.order_id,(cashByOrder.get(m.order_id)||0)+Number(m.amount||0));
 const orderMap=new Map(orders.map(o=>[o.id,o]));
 let result=[];
 for(const o of orders){
  const implicit=Math.max(0,unitMoney(Number(o.paid_amount||0)-(paymentsByOrder.get(o.id)||0)-(cashByOrder.get(o.id)||0)));
  if(implicit>0.005)result.push({id:'initial-'+o.id,branch_id:o.branch_id,order_id:o.id,date:o.created_at,direction:'income',method:o.payment_method||'cash',amount:implicit,description:'Sipariş başlangıç tahsilatı',customer:o.customer_name,actor:o.created_by,initial:true});
 }
 for(const p of payments){
  const o=orderMap.get(p.order_id);if(!o)continue;
  result.push({id:p.id,branch_id:o.branch_id,order_id:p.order_id,date:p.recorded_at,direction:'income',method:p.method||o.payment_method||'cash',amount:Number(p.amount),description:p.note||'Sipariş tahsilatı',customer:o.customer_name,actor:p.recorded_by});
 }
 for(const m of moves){
  const o=orderMap.get(m.order_id);
  result.push({id:m.id,branch_id:m.branch_id,order_id:m.order_id,date:m.created_at,direction:m.direction,method:m.method,amount:Number(m.amount),description:m.description,customer:m.counterparty||o?.customer_name||'',actor:m.created_by});
 }
 return result.sort((a,b)=>new Date(b.date)-new Date(a.date));
}
function filteredOrders(){return selectedOrders().filter(o=>o.status!=='cancelled')}
function apply(){
 const branch=$('branch').value,start=$('start').value,end=$('end').value,method=$('method').value,q=$('search').value.trim().toLocaleLowerCase('tr-TR');
 const orderMap=new Map(orders.map(o=>[o.id,o]));
 filtered=rows.filter(r=>(!branch||r.branch_id===branch)&&(!start||localDate(r.date)>=start)&&(!end||localDate(r.date)<=end)&&(!method||r.method===method)&&(!q||[r.description,r.customer,orderMap.get(r.order_id)?.order_number,methodLabel[r.method]].some(x=>String(x||'').toLocaleLowerCase('tr-TR').includes(q))));
 page=0;render();
}
function render(){
 const today=localDate(new Date()),visible=rows.filter(r=>!$('branch').value||r.branch_id===$('branch').value);
 const todayIn=visible.filter(r=>r.direction==='income'&&localDate(r.date)===today).reduce((v,r)=>v+r.amount,0);
 const todayOut=visible.filter(r=>r.direction==='expense'&&localDate(r.date)===today).reduce((v,r)=>v+r.amount,0);
 const net=visible.reduce((v,r)=>v+(r.direction==='income'?r.amount:-r.amount),0);
 const owed=filteredOrders().reduce((v,o)=>v+Math.max(0,Number(o.total_amount||0)-Number(o.paid_amount||0)),0);
 $('today-in').textContent=money(todayIn);$('today-out').textContent=money(todayOut);$('balance').textContent=money(net);$('receivable').textContent=money(owed);$('net-total').textContent=money(net);
 const orderMap=new Map(orders.map(o=>[o.id,o]));
 const size=12,totalPages=Math.max(1,Math.ceil(filtered.length/size));page=Math.max(0,Math.min(page,totalPages-1));
 $('movements').innerHTML=filtered.slice(page*size,page*size+size).map(r=>{
  const order=orderMap.get(r.order_id),typ=r.direction==='income'?'Tahsilat':'Ödeme';
  return '<tr><td>'+esc(dateTR(r.date))+'</td><td><span class="type '+r.direction+'">'+typ+'</span></td><td>'+esc(r.description)+(r.initial?' <small>(eski kayıt)</small>':'')+'</td><td>'+esc(order?'#'+order.order_number:'—')+'</td><td>'+esc(r.customer||'—')+'</td><td>'+esc(methodLabel[r.method]||r.method)+'</td><td class="amount">'+money(r.amount)+'</td><td>'+esc(r.actor===user?.id?'Ben':'Kullanıcı')+'</td><td><span class="status">Kaydedildi</span></td></tr>';
 }).join('')||'<tr><td colspan="9">Bu filtrede kasa hareketi bulunamadı.</td></tr>';
 $('page-caption').textContent=filtered.length+' kayıt · Sayfa '+(page+1)+' / '+totalPages;
 $('prev').disabled=page===0;$('next').disabled=page===totalPages-1;
 renderMethods();renderTrend(visible);renderRecent();renderBranches();
 feedback(filtered.length+' kayıt listelendi. Kasa neti filtrelenmiş dönem yerine tüm kayıtlı hareketlerden hesaplanır.');
}
function renderMethods(){
 const sums={card:0,cash:0,transfer:0};
 for(const r of filtered)if(r.direction==='income'&&Object.hasOwn(sums,r.method))sums[r.method]+=r.amount;
 const total=Object.values(sums).reduce((a,b)=>a+b,0);
 const pct=m=>total?100*sums[m]/total:0;
 const p1=pct('card'),p2=pct('cash');
 $('methods-chart').innerHTML='<div class="donut" style="background:conic-gradient(#245a3b 0 '+p1+'%,#a1caa1 '+p1+'% '+(p1+p2)+'%,#efd5a8 '+(p1+p2)+'% 100%)"><div class="donut-center"><strong>'+money(total)+'</strong><small>Tahsilat</small></div></div><div class="donut-legend">'+[['card','#245a3b'],['cash','#a1caa1'],['transfer','#efd5a8']].map(([m,color])=>'<div><i style="background:'+color+'"></i><span>'+methodLabel[m]+' · '+pct(m).toLocaleString('tr-TR',{maximumFractionDigits:1})+'%</span><b>'+money(sums[m])+'</b></div>').join('')+'</div>';
}
function svg(name,attributes={},value){const el=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v] of Object.entries(attributes))el.setAttribute(k,String(v));if(value!==undefined)el.textContent=value;return el}
function renderTrend(visible){
 const view=$('trend');view.replaceChildren();
 const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push({date:localDate(d),income:0,expense:0})}
 const lookup=new Map(days.map((d,i)=>[d.date,i]));
 for(const r of visible){const idx=lookup.get(localDate(r.date));if(idx!==undefined)days[idx][r.direction]+=r.amount}
 const peak=Math.max(1,...days.flatMap(d=>[d.income,d.expense])),bottom=210,h=170;
 for(let i=0;i<=4;i++){let y=bottom-i*h/4;view.append(svg('line',{x1:45,x2:610,y1:y,y2:y,stroke:'#e8eee9','stroke-dasharray':'3 3'}));view.append(svg('text',{x:39,y:y+4,'text-anchor':'end','font-size':10,fill:'#829186'},new Intl.NumberFormat('tr-TR',{notation:'compact'}).format(peak*i/4)))}
 days.forEach((d,i)=>{const center=82+i*75;for(const [field,color,off] of [['income','#347e4a',-15],['expense','#e9c694',4]]){const value=d[field],bar=h*value/peak;view.append(svg('rect',{x:center+off,y:bottom-bar,width:18,height:Math.max(0,bar),rx:3,fill:color}))}view.append(svg('text',{x:center,y:237,'text-anchor':'middle','font-size':11,fill:'#708176'},d.date.slice(8,10)+'.'+d.date.slice(5,7)))});
}
function renderRecent(){
 $('recent').innerHTML=filtered.slice(0,6).map(r=>'<div><span class="'+(r.direction==='income'?'recent-income':'recent-expense')+'">'+(r.direction==='income'?'↓ Tahsilat':'↑ Ödeme')+' · '+esc(r.customer||r.description)+'</span><b>'+money(r.amount)+'</b></div>').join('')||'<p class="hint">İşlem bulunamadı.</p>';
}
function renderBranches(){
 const data=new Map(branches.map(b=>[b.id,{name:b.name,income:0,expense:0,todayIn:0,todayOut:0}]));const today=localDate(new Date());
 for(const r of rows){const b=data.get(r.branch_id);if(!b)continue;b[r.direction]+=r.amount;if(localDate(r.date)===today)b[r.direction==='income'?'todayIn':'todayOut']+=r.amount}
 $('branch-summary').innerHTML=[...data.values()].map(b=>'<tr><td>'+esc(b.name)+'</td><td class="amount">'+money(b.income-b.expense)+'</td><td class="amount">'+money(b.todayIn)+'</td><td class="amount">'+money(b.todayOut)+'</td></tr>').join('');
}
async function init(){
 if(!sb){feedback('Veri bağlantısı yüklenemedi.',true);return}
 const {data,error}=await sb.auth.getUser();user=error?null:data?.user;
 if(!user){feedback('Kasa için önce KONAK ERP hesabınıza giriş yapın.',true);return}
 try{
  members=await readAll('erp_members','organization_id,role',q=>q.eq('user_id',user.id));
  const ids=members.map(x=>x.organization_id);
  if(!ids.length)throw Error('Bu kullanıcıya tanımlı işletme bulunamadı.');
  orgs=await readAll('erp_organizations','id,name',q=>q.in('id',ids));
  $('org').innerHTML=orgs.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.name)+'</option>').join('');
  const param=new URLSearchParams(location.search).get('org');
  if(orgs.some(o=>o.id===param))$('org').value=param;
  await load();
 }catch(e){feedback('Kasa açılamadı: '+e.message,true)}
}
async function load(){
 if(loading)return;loading=true;selectedOrg=$('org').value;feedback('Kasa verileri yükleniyor...');
 const role=members.find(m=>m.organization_id===selectedOrg)?.role;
 $('expense-btn').disabled=!['owner','manager','admin'].includes(role);
 $('expense-btn').title=$('expense-btn').disabled?'Gider ekleme yetkisi yalnızca işletme yöneticisindedir':'';
 try{
  const [b,o,p,m]=await Promise.all([
   readAll('erp_branches','id,name',q=>q.eq('organization_id',selectedOrg)),
   readAll('erp_orders','id,organization_id,branch_id,order_number,customer_name,total_amount,paid_amount,payment_method,created_at,status,created_by',q=>q.eq('organization_id',selectedOrg)),
   readAll('erp_order_payments','id,order_id,amount,method,note,recorded_at,recorded_by',q=>q.eq('organization_id',selectedOrg)),
   readAll('erp_cash_movements','id,organization_id,branch_id,order_id,direction,amount,method,description,counterparty,created_by,created_at',q=>q.eq('organization_id',selectedOrg))
  ]);
  branches=b;orders=o;payments=p;moves=m;rows=makeRows();
  const old=$('branch').value;
  $('branch').innerHTML='<option value="">Tüm Şubeler</option>'+branches.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('');
  if(branches.some(b=>b.id===old))$('branch').value=old;
  apply();
 }catch(e){feedback('Veriler yüklenemedi: '+e.message,true)}
 finally{loading=false}
}
function entry(openType){
 entryType=openType;$('entry-title').textContent=openType==='income'?'Tahsilat Ekle':'Ödeme Ekle';
 $('entry-help').textContent=openType==='income'?'Siparişe bağlı tahsilat girerseniz kalan borç güncellenir. Sipariş seçmezseniz yalnızca kasaya gelir eklenir.':'Gider, kasadan düşülür; sipariş alacağını değiştirmez.';
 $('entry-branch').innerHTML=branches.map(b=>'<option value="'+esc(b.id)+'">'+esc(b.name)+'</option>').join('');
 if($('branch').value)$('entry-branch').value=$('branch').value;
 $('entry-form').reset();if($('branch').value)$('entry-branch').value=$('branch').value;
 $('entry-order').closest('label').hidden=openType!=='income';
 $('entry-feedback').textContent='';populateOrderOptions();$('entry-modal').hidden=false;
}
function populateOrderOptions(){
 const id=$('entry-branch').value,opts=orders.filter(o=>o.branch_id===id&&o.status!=='cancelled'&&Number(o.total_amount)-Number(o.paid_amount)>.005);
 $('entry-order').innerHTML='<option value="">Siparişe bağlama</option>'+opts.map(o=>'<option value="'+esc(o.id)+'">#'+esc(o.order_number)+' · '+esc(o.customer_name)+' · Kalan: '+money(Number(o.total_amount)-Number(o.paid_amount))+'</option>').join('');
}
async function saveEntry(e){
 e.preventDefault();const btn=$('save-entry');if(btn.disabled)return;
 const amount=Number($('entry-amount').value),orderId=$('entry-order').value;
 if(!Number.isFinite(amount)||amount<=0||amount>1000000000){$('entry-feedback').textContent='Geçerli bir tutar girin.';return}
 if(orderId){
  const o=orders.find(x=>x.id===orderId);
  if(!o||o.branch_id!==$('entry-branch').value||amount>Number(o.total_amount)-Number(o.paid_amount)+.001){$('entry-feedback').textContent='Tahsilat tutarı kalan borcu aşamaz.';return}
 }
 btn.disabled=true;$('entry-feedback').textContent='İşlem kaydediliyor...';
 try{
  const {error}=await sb.rpc('erp_record_cash_movement',{p_org:selectedOrg,p_branch:$('entry-branch').value,p_direction:entryType,p_amount:amount,p_method:$('entry-method').value,p_description:$('entry-description').value.trim(),p_counterparty:$('entry-counterparty').value.trim()||null,p_order:entryType==='income'&&orderId?orderId:null});
  if(error)throw error;
  $('entry-modal').hidden=true;await load();feedback('Kasa işlemi başarıyla kaydedildi.');
 }catch(err){$('entry-feedback').textContent='Kaydedilemedi: '+err.message}
 finally{btn.disabled=false}
}
function csvData(){
 const map=new Map(orders.map(o=>[o.id,o]));
 return [['Tarih','Tür','Açıklama','Sipariş No','Müşteri','Yöntem','Tutar','Personel'],...filtered.map(r=>[dateTR(r.date),r.direction==='income'?'Tahsilat':'Ödeme',r.description,map.get(r.order_id)?.order_number||'',r.customer||'',methodLabel[r.method]||r.method,r.amount,r.actor===user?.id?'Ben':r.actor||''])];
}
function exportCsv(){
 const csv='\ufeff'+csvData().map(row=>row.map(v=>{let value=String(v??'');if(/^[\s]*[=+@\-]/.test(value)&&!/^\d{1,2}\.\d{1,2}\.\d{4}/.test(value))value="'"+value;return '"'+value.replaceAll('"','""')+'"'}).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='KONAK_ERP_Kasa_'+localDate(new Date())+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function exportPdf(){
 if(!window.jspdf?.jsPDF){feedback('PDF kitaplığı yüklenemedi.',true);return}
 const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4',orientation:'landscape'});
 const map=new Map(orders.map(o=>[o.id,o]));
 const latin=s=>String(s??'').replaceAll('İ','I').replaceAll('ı','i').replaceAll('Ş','S').replaceAll('ş','s').replaceAll('ğ','g').replaceAll('Ğ','G').replaceAll('ü','u').replaceAll('Ü','U').replaceAll('ç','c').replaceAll('Ç','C').replaceAll('ö','o').replaceAll('Ö','O');
 const cols=[{label:'Tarih',x:12},{label:'Tur',x:44},{label:'Aciklama',x:63},{label:'Siparis',x:137},{label:'Musteri',x:159},{label:'Yontem',x:222},{label:'Tutar',x:282,right:true}];
 let y=18,printed=0;
 function heading(){
  doc.setFillColor(235,244,238);doc.rect(8,8,281,16,'F');
  doc.setFontSize(15);doc.setTextColor(23,65,40);
  doc.text('KONAK ERP | Kasa Hareketleri',12,17);
  doc.setFontSize(9);doc.setTextColor(90,110,97);
  doc.text('Kayit sayisi: '+filtered.length+' | '+localDate(new Date()),285,17,{align:'right'});
  doc.setFontSize(8);doc.setTextColor(30,57,38);
  cols.forEach(c=>doc.text(c.label,c.x,33,c.right?{align:'right'}:undefined));
  doc.setDrawColor(215,227,217);doc.line(10,36,287,36);
  y=42;
 }
 heading();
 doc.setFontSize(7);
 for(const r of filtered){
  if(y>192){doc.addPage();heading();doc.setFontSize(7)}
  const o=map.get(r.order_id);
  const values=[dateTR(r.date),r.direction==='income'?'Tahsilat':'Odeme',r.description,o?'#'+o.order_number:'—',r.customer||'—',methodLabel[r.method]||r.method,money(r.amount)];
  const widths=[30,18,72,20,61,34,30];
  cols.forEach((c,i)=>{
   const text=doc.splitTextToSize(latin(values[i]),widths[i]);
   doc.text(text.slice(0,2),c.x,y,c.right?{align:'right'}:undefined);
  });
  doc.setDrawColor(239,242,239);doc.line(10,y+5,287,y+5);y+=Math.max(9,Math.min(2,doc.splitTextToSize(latin(r.description),72).length)*4.2+3);
  printed++;
 }
 if(!printed){doc.setTextColor(130,140,130);doc.text('Secili filtrede kayit bulunamadi.',13,46)}
 doc.save('KONAK_ERP_Kasa_'+localDate(new Date())+'.pdf');
}
$('org').onchange=()=>{$('branch').value='';load()};
$('branch').onchange=apply;$('apply').onclick=apply;
$('reset').onclick=()=>{$('branch').value='';$('start').value='';$('end').value='';$('method').value='';$('search').value='';apply()};
$('income-btn').onclick=()=>entry('income');$('expense-btn').onclick=()=>entry('expense');
$('entry-branch').onchange=populateOrderOptions;
$('close-modal').onclick=$('cancel-modal').onclick=()=>$('entry-modal').hidden=true;
$('entry-form').onsubmit=saveEntry;
$('prev').onclick=()=>{page--;render()};$('next').onclick=()=>{page++;render()};
$('download').onclick=$('excel-btn').onclick=exportCsv;
$('pdf-btn').onclick=exportPdf;
init();
})();