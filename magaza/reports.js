(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co',KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.supabase?.createClient(API,KEY),$=id=>document.getElementById(id);
const fmtMoney=v=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(v)||0);
const fmtNum=v=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2,minimumFractionDigits:0}).format(Number(v)||0);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const GROUPS=['TÜL PERDE','FON PERDE','GÜNEŞLİK','STOR PERDE','PLİSE PERDE','AHŞAP JALUZİ','AKSESUAR'];
const METERS=new Set(['TÜL PERDE','FON PERDE','GÜNEŞLİK']);
const AREA=new Set(['STOR PERDE','PLİSE PERDE','AHŞAP JALUZİ']);
let user=null,members=[],orgs=[],branches=[],allOrders=[],allItems=[],products=[],page=0,requestId=0;
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
 const orders=allOrders.filter(o=>o.status!=='cancelled'&&(!branch||o.branch_id===branch));
 const orderIds=new Set(orders.map(o=>o.id));
 const lines=allItems.filter(i=>orderIds.has(i.order_id)&&i.status!=='cancelled');
 const subtotal=orders.reduce((a,o)=>a+Number(o.total_amount||0),0);
 const paid=orders.reduce((a,o)=>a+Number(o.paid_amount||0),0);
 $('total-orders').textContent=fmtNum(orders.length);
 $('total-sales').textContent=fmtMoney(subtotal);
 $('total-paid').textContent=fmtMoney(paid);
 $('total-due').textContent=fmtMoney(Math.max(0,subtotal-paid));
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
 $('categories-body').innerHTML=[...byCategory.values()].filter(x=>x.quantity).map(c=>'<tr><td class="product-name">'+esc(c.category)+'</td><td>'+esc(unit(c.category))+'</td><td class="num">'+fmtNum(c.quantity)+'</td><td class="num">'+(c.measureCount?fmtNum(c.measure):'—')+(c.missing?' <small title="Eksik ölçülü kayıt var">⚠ '+fmtNum(c.missing)+' eksik</small>':'')+'</td><td class="num"><b>'+fmtMoney(c.revenue)+'</b></td></tr>').join('')||'<tr><td colspan="5">Bu filtrede sipariş bulunamadı.</td></tr>';
 page=0;renderProducts();
 const missing=[...byCategory.values()].reduce((a,x)=>a+x.missing,0);
 feedback(orders.length+' sipariş, '+lines.length+' kalem listelendi.'+(missing?' '+missing+' kalemde ölçü eksik; bu kalemlere ölçü toplamı atanmadı.':''));
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