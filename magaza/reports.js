(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co',KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.supabase?.createClient(API,KEY),$=id=>document.getElementById(id);
const fmtMoney=v=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(v)||0);
const fmtNum=v=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2,minimumFractionDigits:0}).format(Number(v)||0);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const GROUPS=['TÜL PERDE','FON PERDE','GÜNEŞLİK','STOR PERDE','PLİSE PERDE','AHŞAP JALUZİ','AKSESUAR'];
const METERS=new Set(['TÜL PERDE','FON PERDE','GÜNEŞLİK']);
const AREA=new Set(['STOR PERDE','PLİSE PERDE','AHŞAP JALUZİ']);
let user=null,members=[],orgs=[],branches=[],allOrders=[],allItems=[],products=[],page=0,requestId=0,statusMode='active';
function feedback(t,error=false){$('feedback').textContent=t;$('feedback').classList.toggle('error',error)}
function unit(category){return METERS.has(category)?'metre':AREA.has(category)?'metrekare':'adet'}
function measure(row){
 const count=Number(row.quantity)||1, w=Number(row.width_cm), h=Number(row.height_cm);
 if(METERS.has(row.category))return row.width_cm!=null&&Number.isFinite(w)&&w>0?w/100*count:null;
 if(AREA.has(row.category))return row.width_cm!=null&&row.height_cm!=null&&w>0&&h>0?w*h/10000*count:null;
 return count;
}
async function readAll(table,select,query){
 let output=[];
 for(let start=0;start<100000;start+=1000){
  let q=sb.from(table).select(select);
  q=query(q).range(start,start+999);
  const {data,error}=await q;
  if(error)throw error;
  output=output.concat(data||[]);
  if(!data||data.length<1000)return output;
 }
 throw Error('Çok fazla kayıt var. Rapor kapsamını daraltın.');
}
function renderOptions(){
 $('org').innerHTML=orgs.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.name)+'</option>').join('');
 const initial=new URLSearchParams(location.search).get('org');
 if(orgs.some(o=>o.id===initial))$('org').value=initial;
}
async function init(){
 if(!sb){feedback('Veri bağlantısı yüklenemedi.',true);return}
 const {data,error}=await sb.auth.getUser();user=error?null:data?.user;
 if(!user){feedback('Raporları görüntülemek için önce KONAK ERP hesabınıza giriş yapın.',true);return}
 try{
  members=await readAll('erp_members','organization_id,role',q=>q.eq('user_id',user.id));
  const ids=members.map(m=>m.organization_id);
  if(!ids.length){feedback('Bu kullanıcıya bağlı işletme bulunamadı.',true);return}
  orgs=await readAll('erp_organizations','id,name',q=>q.in('id',ids));
  if(!orgs.length){feedback('Görüntülenebilecek işletme bulunamadı.',true);return}
  renderOptions();
  await reload();
 }catch(e){feedback('Raporlar yüklenemedi: '+e.message,true)}
}
async function reload(){
 const req=++requestId,org=$('org').value,branchSelected=$('branch').value;
 if(!org)return;
 feedback('Sipariş kayıtları hesaplanıyor...');
 try{
  const [b,orders]=await Promise.all([
   readAll('erp_branches','id,name',q=>q.eq('organization_id',org)),
   readAll('erp_orders','id,branch_id,created_at,status,total_amount,paid_amount',q=>{
    q=q.eq('organization_id',org).order('created_at',{ascending:false});
    if($('start').value)q=q.gte('created_at',$('start').value+'T00:00:00+03:00');
    if($('end').value){
      const endDate=new Date($('end').value+'T00:00:00+03:00');
      endDate.setDate(endDate.getDate()+1);
      q=q.lt('created_at',endDate.toISOString());
    }
    return q;
   })
  ]);
  if(req!==requestId)return;
  branches=b;
  $('branch').innerHTML='<option value="">Tüm şubeler</option>'+branches.map(v=>'<option value="'+esc(v.id)+'">'+esc(v.name)+'</option>').join('');
  if(branches.some(v=>v.id===branchSelected))$('branch').value=branchSelected;
  allOrders=orders;
  // Read only matching order item IDs; large installations require date filtering to keep the browser responsive.
  const ids=orders.map(o=>o.id);
  const fetched=[];
  for(let idx=0;idx<ids.length;idx+=120){
   const piece=await readAll('erp_order_items','order_id,category,product_name,width_cm,height_cm,quantity,unit_price,status',q=>q.eq('organization_id',org).in('order_id',ids.slice(idx,idx+120)));
   fetched.push(...piece);
  }
  if(req!==requestId)return;
  allItems=fetched;
  compute();
 }catch(e){if(req===requestId)feedback('Rapor yüklenemedi: '+e.message,true)}
}
function compute(){
 const branch=$('branch').value;
 const orders=allOrders.filter(o=>(statusMode==='all'||(statusMode==='completed'?['delivered','completed'].includes(o.status):!['cancelled','delivered','completed'].includes(o.status)))&&(!branch||o.branch_id===branch));
 const orderIds=new Set(orders.map(o=>o.id));
 const lines=allItems.filter(i=>orderIds.has(i.order_id)&&i.status!=='cancelled');
 const subtotal=orders.reduce((a,o)=>a+Number(o.total_amount||0),0);
 const paid=orders.reduce((a,o)=>a+Number(o.paid_amount||0),0);
 fillOverview(orders,subtotal,paid);
 const byCategory=new Map(GROUPS.map(c=>[c,{category:c,quantity:0,measure:0,revenue:0,missing:0,measureCount:0}]));
 const byProduct=new Map();
 for(const line of lines){
  const category=line.category||'DİĞER',name=String(line.product_name||'İsimsiz ürün').trim();
  if(!byCategory.has(category))byCategory.set(category,{category,quantity:0,measure:0,revenue:0,missing:0,measureCount:0});
  const qty=Math.max(1,Number(line.quantity)||1),revenue=qty*Number(line.unit_price||0),size=measure(line);
  const key=category+'\u0000'+name;
  if(!byProduct.has(key))byProduct.set(key,{name,category,quantity:0,measure:0,revenue:0,missing:0,measureCount:0});
  for(const obj of [byCategory.get(category),byProduct.get(key)]){
   obj.quantity+=qty;obj.revenue+=revenue;
   if(size===null)obj.missing+=qty;
   else{obj.measure+=size;obj.measureCount+=qty}
  }
 }
 products=[...byProduct.values()];
 renderDailyChart(orders);renderCategoryChart([...byCategory.values()]);renderBranches(orders);

 $('categories-body').innerHTML=[...byCategory.values()].filter(x=>x.quantity).map(c=>'<tr><td class="product-name">'+esc(c.category)+'</td><td>'+esc(unit(c.category))+'</td><td class="num">'+fmtNum(c.quantity)+'</td><td class="num">'+(c.measureCount?fmtNum(c.measure):'—')+(c.missing?' <small title="Eksik ölçülü kayıt var">⚠ '+fmtNum(c.missing)+' eksik</small>':'')+'</td><td class="num"><b>'+fmtMoney(c.revenue)+'</b></td></tr>').join('')||'<tr><td colspan="5">Bu filtrede sipariş bulunamadı.</td></tr>';
 page=0;renderProducts();
 const missing=[...byCategory.values()].reduce((a,x)=>a+x.missing,0);
 feedback(orders.length+' sipariş, '+lines.length+' kalem listelendi.'+(missing?' '+missing+' kalemde ölçü eksik; bu kalemlere ölçü toplamı atanmadı.':''));
}

function trDate(d){
 return new Date(d).toLocaleDateString('sv-SE',{timeZone:'Europe/Istanbul'});
}
function fillOverview(orders,subtotal,paid){
 const today=trDate(new Date()),year=Number(today.slice(0,4)),month=Number(today.slice(5,7))-1,day=Number(today.slice(8,10));
 const todayDate=new Date(Date.UTC(year,month,day));
 const monday=new Date(todayDate);monday.setUTCDate(monday.getUTCDate()-(monday.getUTCDay()+6)%7);
 const weekStart=monday.toISOString().slice(0,10);
 const monthStart=today.slice(0,8)+'01';
 const valueFor=from=>orders.reduce((a,o)=>a+(trDate(o.created_at)>=from&&trDate(o.created_at)<=today?Number(o.total_amount||0):0),0);
 $('today-sales').textContent=fmtMoney(valueFor(today));
 $('week-sales').textContent=fmtMoney(valueFor(weekStart));
 $('month-sales').textContent=fmtMoney(valueFor(monthStart));
 $('lifetime-paid').textContent=fmtMoney(paid);
 $('bottom-sales').textContent=fmtMoney(subtotal);
 $('bottom-paid').textContent=fmtMoney(paid);
}
function svgNode(name,attrs={},value){
 const n=document.createElementNS('http://www.w3.org/2000/svg',name);
 for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));
 if(value!==undefined)n.textContent=value;
 return n;
}
function clearSvg(id){const svg=$(id);svg.replaceChildren();return svg}
function renderDailyChart(orders){
 const svg=clearSvg('daily-chart');
 const end=new Date();
 const days=[];
 for(let i=29;i>=0;i--){
  const date=new Date(end);date.setDate(date.getDate()-i);
  days.push({date:trDate(date),income:0,paid:0,total:0});
 }
 const lookup=new Map(days.map((d,i)=>[d.date,i]));
 for(const o of orders){
  const index=lookup.get(trDate(o.created_at));
  if(index!==undefined){
   days[index].income+=Number(o.total_amount||0);
   days[index].paid+=Number(o.paid_amount||0);
  }
 }
 let cumul=0;for(const d of days){cumul+=d.income;d.total=cumul}
 const max=Math.max(1,...days.map(x=>x.total),...days.map(x=>x.income));
 const left=57,top=18,height=198,width=527,bottom=top+height;
 const x=i=>left+(i/(days.length-1))*width;
 const y=v=>bottom-(v/max)*height;
 for(let i=0;i<=4;i++){
  const yy=top+height*i/4;
  svg.append(svgNode('line',{x1:left,y1:yy,x2:590,y2:yy,stroke:'#e3e9e4','stroke-dasharray':'3 3'}));
  svg.append(svgNode('text',{x:50,y:yy+4,'text-anchor':'end',fill:'#87938a','font-size':10},fmtNum(max*(1-i/4))));
 }
 const defs=svgNode('defs'),grad=svgNode('linearGradient',{id:'daily-fill',x1:'0',x2:'0',y1:'0',y2:'1'});
 grad.append(svgNode('stop',{offset:'0%','stop-color':'#2889ff','stop-opacity':'.22'}),svgNode('stop',{offset:'100%','stop-color':'#2889ff','stop-opacity':'.015'}));defs.append(grad);svg.append(defs);
 for(let i=0;i<30;i++){
  const x0=x(i),bar=5;
  svg.append(svgNode('rect',{x:x0-bar-1,y:y(days[i].income),width:bar,height:Math.max(0,bottom-y(days[i].income)),fill:'#277a49',rx:1}));
  svg.append(svgNode('rect',{x:x0+1,y:y(days[i].paid),width:bar,height:Math.max(0,bottom-y(days[i].paid)),fill:'#f5b669',rx:1}));
  if(i%5===0||i===29)svg.append(svgNode('text',{x:x0,y:244,'text-anchor':'middle',fill:'#77867c','font-size':10},days[i].date.slice(8,10)+'.'+days[i].date.slice(5,7)));
 }
 const path=days.map((d,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(d.total).toFixed(1)).join(' ');
 svg.append(svgNode('path',{d:path+' L '+x(29)+' '+bottom+' L '+x(0)+' '+bottom+' Z',fill:'url(#daily-fill)'}));
 svg.append(svgNode('path',{d:path,fill:'none',stroke:'#2386f5','stroke-width':2.5}));
 for(let i=0;i<30;i+=3)svg.append(svgNode('circle',{cx:x(i),cy:y(days[i].total),r:2.6,fill:'#fff',stroke:'#2386f5','stroke-width':1.5}));
}
function renderCategoryChart(groups){
 const svg=clearSvg('category-chart'),data=groups.filter(x=>x.quantity>0),max=Math.max(1,...data.map(x=>x.revenue));
 const left=44,top=14,bottom=215,height=201,step=535/Math.max(1,data.length);
 for(let i=0;i<=4;i++){
  const yy=bottom-height*i/4;
  svg.append(svgNode('line',{x1:left,y1:yy,x2:585,y2:yy,stroke:'#e0e6e2','stroke-dasharray':'3 3'}));
  svg.append(svgNode('text',{x:40,y:yy+3,'text-anchor':'end','font-size':9,fill:'#7d8a80'},fmtNum(max*i/4)));
 }
 data.forEach((d,i)=>{
  const bw=Math.min(62,step*.66),x=left+step*(i+.5)-bw/2,y=bottom-(d.revenue/max)*height;
  svg.append(svgNode('rect',{x,y,width:bw,height:bottom-y,rx:5,fill:'#6256ef'}));
  const name=d.category.split(' ');
  const label=svgNode('text',{x:x+bw/2,y:234,'font-size':9,fill:'#596a5d','text-anchor':'middle'});
  label.append(svgNode('tspan',{x:x+bw/2},name.slice(0,2).join(' ')));
  if(name.length>2)label.append(svgNode('tspan',{x:x+bw/2,dy:11},name.slice(2).join(' ')));
  svg.append(label);
 });
 if(!data.length)svg.append(svgNode('text',{x:300,y:130,'text-anchor':'middle',fill:'#929c95'},'Satış bulunamadı'));
}
function renderBranches(orders){
 const result=new Map(branches.map(b=>[b.id,{name:b.name,revenue:0,paid:0}]));
 for(const o of orders){
  if(!result.has(o.branch_id))result.set(o.branch_id,{name:'Şube belirtilmedi',revenue:0,paid:0});
  const b=result.get(o.branch_id);b.revenue+=Number(o.total_amount||0);b.paid+=Number(o.paid_amount||0);
 }
 $('branches-body').innerHTML=[...result.values()].filter(b=>b.revenue||b.paid).sort((a,b)=>b.revenue-a.revenue).map(b=>'<tr><td class="product-name">'+esc(b.name)+'</td><td class="num">'+fmtMoney(b.revenue)+'</td><td class="num">'+fmtMoney(b.paid)+'</td><td class="num"><span class="performance-pill">'+(b.revenue?(100*b.paid/b.revenue).toLocaleString('tr-TR',{maximumFractionDigits:1}):'0')+'%</span></td></tr>').join('')||'<tr><td colspan="4">Bu filtrede şube satışı bulunamadı.</td></tr>';
}
function renderProducts(){
 const q=$('search').value.trim().toLocaleLowerCase('tr-TR'),sort=$('sort').value,per=Number($('per-page').value);
 const data=products.filter(x=>!q||x.name.toLocaleLowerCase('tr-TR').includes(q));
 data.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name,'tr'):sort==='quantity'?b.quantity-a.quantity:sort==='measure'?b.measure-a.measure:b.revenue-a.revenue);
 const pages=Math.max(1,Math.ceil(data.length/per));page=Math.min(Math.max(0,page),pages-1);
 $('products-body').innerHTML=data.slice(page*per,(page+1)*per).map((p,index)=>'<tr><td><span class="rank">'+(page*per+index+1)+'</span></td><td class="product-name">'+esc(p.name)+'</td><td>'+esc(p.category)+'</td><td class="num">'+fmtNum(p.quantity)+'</td><td class="num">'+(p.measureCount?fmtNum(p.measure):'—')+(p.missing?' ⚠':'')+'</td><td class="unit">'+esc(unit(p.category))+'</td><td class="num"><b>'+fmtMoney(p.revenue)+'</b></td></tr>').join('')||'<tr><td colspan="7">Eşleşen ürün bulunamadı.</td></tr>';
 $('page-info').textContent=data.length+' ürün · Sayfa '+(page+1)+' / '+pages;
 $('prev').disabled=page===0;$('next').disabled=page>=pages-1;
}
document.querySelectorAll('[data-status]').forEach(btn=>btn.addEventListener('click',()=>{statusMode=btn.dataset.status;document.querySelectorAll('[data-status]').forEach(el=>el.classList.toggle('active',el===btn));compute()}));
$('start').onchange=reload;$('end').onchange=reload;
$('refresh').onclick=reload;
$('org').onchange=()=>{$('branch').value='';reload()};
$('branch').onchange=compute;
$('search').oninput=()=>{page=0;renderProducts()};
$('sort').onchange=()=>{page=0;renderProducts()};
$('per-page').onchange=()=>{page=0;renderProducts()};
$('prev').onclick=()=>{page--;renderProducts()};
$('next').onclick=()=>{page++;renderProducts()};
init();
})();