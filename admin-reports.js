(()=>{'use strict';
const $=id=>document.getElementById(id),sb=window.supabase?.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const mk=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e};
const cash=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const num=n=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:1}).format(Number(n)||0);
const dt=v=>new Date(v).toLocaleDateString('tr-TR',{timeZone:'Europe/Istanbul'});
const iso=d=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const stages=['received','measure_approved','preparing','production','ready','shipped','delivered'];
const stageNames=['Sipariş Alındı','Ölçü Onayı','Hazırlanıyor','Üretimde','Kargoya Hazır','Kargoda','Teslim Edildi'];
const colors=['#343434','#777777','#aaaaaa','#c5c5c5','#e1e1e1'];
let raw={orders:[],items:[],products:[],progress:[],events:[],campaigns:[]},data=null,started=false,loading=false,partial=false,lastLoaded=0;
const paid=new Set(['paid','processing','shipped','completed']);
const isTest=o=>/\[\s*TEST\s*\]/i.test(o.customer_note||'');
const sale=o=>paid.has(o.status)&&!isTest(o)&&Number(o.total_amount)>0;
function bounds(){return{start:$('rp-start').value,end:$('rp-end').value}}
function setPeriod(days=30){const end=new Date(),start=new Date(end.getTime()-(days-1)*86400000);$('rp-start').value=iso(start);$('rp-end').value=iso(end)}
function rangeCheck(){const {start,end}=bounds();if(!start||!end||start>end){$('rp-info').textContent='Geçerli bir başlangıç ve bitiş tarihi seçiniz.';return false}return true}
function inRange(date,start,end){const str=iso(new Date(date));return str>=start&&str<=end}
async function pageRows(table,cols,sort='created_at'){let all=[],from=0;const pageSize=1000,max=10000;while(from<max){let q=sb.from(table).select(cols).order(sort,{ascending:false}).range(from,from+pageSize-1);const r=await q;if(r.error)throw Error(table+': '+r.error.message);const block=r.data||[];all.push(...block);if(block.length<pageSize)return all;from+=pageSize}partial=true;return all}
async function load(){if(!sb||loading)return;loading=true;$('rp-info').textContent='Rapor verileri yükleniyor…';try{
 const who=await sb.auth.getUser();const user=who.data?.user;if(who.error||!user){$('rp-info').textContent='Raporları görmek için yönetici hesabınızla giriş yapın.';return}
 const access=await sb.from('admin_access').select('role').eq('user_id',user.id).maybeSingle();if(access.error||!['owner','admin','staff'].includes(access.data?.role)){$('rp-info').textContent='Raporları görüntüleme yetkiniz bulunmuyor.';return}
 partial=false;
 const result=await Promise.all([
  pageRows('shop_orders','id,customer_id,status,total_amount,created_at,customer_note'),
  pageRows('shop_order_items','id,order_id,product_slug,product_title,quantity,line_total,width_cm,height_cm','id'),
  pageRows('shop_products','slug,title,collection,price_per_sqm','slug'),
  pageRows('shop_order_progress','order_id,stage,updated_at,due_date','updated_at'),
  pageRows('shop_order_progress_events','order_id,stage,changed_at','changed_at'),
  pageRows('shop_campaigns','id,product_slug,campaign_name,campaign_type,starts_on,ends_on,enabled,used_count,usage_limit','created_at')
 ]);
 [raw.orders,raw.items,raw.products,raw.progress,raw.events,raw.campaigns]=result;
 lastLoaded=Date.now();render();
}catch(e){$('rp-info').textContent='Rapor yüklenemedi: '+e.message}finally{loading=false}}
function groupKey(date,gran){const d=new Date(date),str=iso(d);if(gran==='day')return str;if(gran==='year')return str.slice(0,4);if(gran==='month')return str.slice(0,7);
 const day=new Date(str+'T12:00:00Z'),dow=(day.getUTCDay()+6)%7;day.setUTCDate(day.getUTCDate()-dow);return day.toISOString().slice(0,10)}
function build(){const {start,end}=bounds();const all=raw.orders.filter(o=>inRange(o.created_at,start,end)),valid=all.filter(sale),idset=new Set(valid.map(o=>o.id));
 const lineItems=raw.items.filter(i=>idset.has(i.order_id)),map=new Map(raw.products.map(p=>[p.slug,p]));
 const categories=new Map(),tops=new Map();
 for(const i of lineItems){const p=map.get(i.product_slug),category=p?.collection==='zebra'?'Zebra Perde':p?.collection==='mat-stor'?'Stor Perde':'Diğer';const qty=Number(i.quantity)||0,rev=Number(i.line_total)||0;
 const c=categories.get(category)||{qty:0,revenue:0};c.qty+=qty;c.revenue+=rev;categories.set(category,c);
 const old=tops.get(i.product_slug)||{name:i.product_title,qty:0,revenue:0,slug:i.product_slug};old.qty+=qty;old.revenue+=rev;tops.set(i.product_slug,old)}
 const prod=raw.progress.filter(p=>idset.has(p.order_id)),progressMap=new Map(raw.progress.map(p=>[p.order_id,p]));
 const history=raw.events.filter(e=>idset.has(e.order_id));
 const done=valid.filter(o=>progressMap.get(o.id)?.stage==='delivered'||o.status==='completed');
 const starts=new Map();for(const e of history){if(e.stage!=='production')continue;const existing=starts.get(e.order_id);if(!existing||new Date(e.changed_at)<new Date(existing))starts.set(e.order_id,e.changed_at)}
 const durations=[];for(const o of done){const startTime=starts.get(o.id),endEvents=history.filter(e=>e.order_id===o.id&&e.stage==='delivered').sort((a,b)=>new Date(a.changed_at)-new Date(b.changed_at));if(startTime&&endEvents[0]){const d=(new Date(endEvents[0].changed_at)-new Date(startTime))/86400000;if(d>=0&&d<365)durations.push(d)}}
 const statuses=new Map(stages.map(s=>[s,0]));for(const o of valid){const stage=progressMap.get(o.id)?.stage||(o.status==='completed'?'delivered':o.status==='shipped'?'shipped':o.status==='processing'?'production':'received');statuses.set(stage,(statuses.get(stage)||0)+1)}
 const campaign=raw.campaigns.filter(c=>c.starts_on<=end&&c.ends_on>=start);
 const series=new Map();for(const o of valid){const key=groupKey(o.created_at,$('rp-granularity').value);series.set(key,(series.get(key)||0)+Number(o.total_amount))}
 return{all,valid,lineItems,category:[...categories].map(([name,v])=>({name,...v})).sort((a,b)=>b.revenue-a.revenue),top:[...tops.values()].sort((a,b)=>b.qty-a.qty),prod,history,statuses,campaign,series,done,durations,turnover:valid.reduce((s,o)=>s+Number(o.total_amount),0),testExcluded:all.filter(isTest).length,unpaidExcluded:all.filter(o=>!paid.has(o.status)).length,zeroExcluded:all.filter(o=>paid.has(o.status)&&!isTest(o)&&Number(o.total_amount)<=0).length}}
function kpis(d){const box=$('rp-kpis');box.replaceChildren();const avg=d.valid.length?d.turnover/d.valid.length:0;
 const avgDays=d.durations.length?num(d.durations.reduce((a,b)=>a+b,0)/d.durations.length)+' gün':'Veri yok';
 for(const [label,value,sub] of [['Toplam Sipariş',d.valid.length+' adet','Ödenmiş, test dışı sipariş'],['Toplam Ciro',cash(d.turnover),'Gerçek sipariş geliri'],['Üretim Tamamlama',d.valid.length?num(d.done.length/d.valid.length*100)+'%':'—','Teslim edilen / gerçek sipariş'],['Üretimden Teslime',avgDays,d.durations.length+' ölçülebilir sipariş']]){const card=mk('div','rp-kpi');card.append(mk('span','rp-kpi-label',label),mk('strong','',value),mk('small','',sub));box.append(card)}}
function lineChart(d){const box=$('rp-sales-chart');box.replaceChildren();const values=[...d.series.entries()].sort((a,b)=>a[0].localeCompare(b[0]));if(!values.length){box.append(mk('div','rp-empty','Bu dönemde gerçekleşmiş satış bulunmuyor.'));return}
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 760 270');svg.setAttribute('role','img');svg.setAttribute('aria-label','Dönem satış grafiği');
 const add=(type,props,text)=>{const x=document.createElementNS(ns,type);for(const [k,v] of Object.entries(props||{}))x.setAttribute(k,String(v));if(text!=null)x.textContent=text;svg.append(x);return x};
 const max=Math.max(1,...values.map(v=>v[1]));for(let j=0;j<5;j++){const y=20+j*51;add('line',{x1:65,y1:y,x2:742,y2:y,stroke:'#e8e0d7','stroke-width':1});add('text',{x:55,y:y+4,'text-anchor':'end',fill:'#8b8176','font-size':12},num(max*(4-j)/4))}
 const xAt=i=>values.length===1?400:65+i*677/(values.length-1);
 const yAt=v=>224-(v/max)*204;
 const points=values.map((v,i)=>xAt(i)+','+yAt(v[1])).join(' ');
 if(values.length===1){add('line',{x1:65,y1:yAt(values[0][1]),x2:742,y2:yAt(values[0][1]),stroke:'#8c6a4d','stroke-width':2})}
 else add('polyline',{points,fill:'none',stroke:'#795f4d','stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'});
 values.forEach(([x,y],i)=>{if(values.length<=35||i%Math.ceil(values.length/30)===0){const dot=add('circle',{cx:xAt(i),cy:yAt(y),r:3,fill:'#795f4d'});dot.appendChild(document.createElementNS(ns,'title')).textContent=x+': '+cash(y)}});
 const ticks=Math.min(6,values.length);for(let i=0;i<ticks;i++){const k=Math.round(i*(values.length-1)/Math.max(1,ticks-1));add('text',{x:xAt(k),y:252,'text-anchor':'middle',fill:'#7f7366','font-size':11},values[k][0].slice(5)||values[k][0])}
 box.append(svg);$('rp-chart-caption').textContent=values.length+' dönem · '+cash(d.turnover)}
function donut(d){const box=$('rp-category-chart');box.replaceChildren();const sum=d.category.reduce((s,v)=>s+v.revenue,0);if(!sum){box.append(mk('div','rp-empty','Ürün dağılımı için satış verisi yok.'));return}
 let deg=0;const gradients=d.category.map((c,i)=>{const end=deg+c.revenue/sum*360,s=colors[i%colors.length]+' '+deg+'deg '+end+'deg';deg=end;return s});const wrap=mk('div','rp-donut-wrap'),circle=mk('div','rp-donut'),inner=mk('div','rp-donut-inner','%100');circle.style.background='conic-gradient('+gradients.join(',')+')';circle.append(inner);wrap.append(circle);
 const legend=mk('div','rp-legend');d.category.forEach((c,i)=>{const row=mk('div','rp-legend-row'),name=mk('span','rp-legend-name'),dot=mk('i','rp-legend-dot');dot.style.background=colors[i%colors.length];name.append(dot,mk('span','',c.name));row.append(name,mk('strong','',num(c.revenue/sum*100)+'%'));legend.append(row)});wrap.append(legend);box.append(wrap)}
function ordersTable(d){const target=$('rp-orders');target.replaceChildren();const subset=d.valid.slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,8);if(!subset.length){const row=mk('tr'),td=mk('td','','Bu dönemde gerçek sipariş bulunmuyor.');td.colSpan=5;row.append(td);target.append(row);return}
 for(const o of subset){const tr=mk('tr'),lines=raw.items.filter(i=>i.order_id===o.id).map(i=>i.product_title).join(', ');['PK-'+o.id.slice(0,8).toUpperCase(),lines||'—',o.status,cash(o.total_amount),dt(o.created_at)].forEach(v=>tr.append(mk('td','',v)));target.append(tr)}}
function topProducts(d){const box=$('rp-top-products');box.replaceChildren();if(!d.top.length){box.append(mk('div','rp-empty','Satış yapan ürün bulunmuyor.'));return}const max=Math.max(...d.top.map(v=>v.qty),1);d.top.slice(0,6).forEach((p,i)=>{const card=mk('div','rp-product'),rank=mk('em','',i+1+'.'),body=mk('div'),meter=mk('div','rp-meter'),bar=mk('span');bar.style.width=p.qty/max*100+'%';meter.append(bar);body.append(mk('strong','',p.name),mk('small','',p.qty+' adet · '+cash(p.revenue)),meter);card.append(rank,body,mk('small','',num(p.qty/max*100)+'%'));box.append(card)})}
function production(d){const box=$('rp-production');box.replaceChildren();const n=d.valid.length;if(!n){box.append(mk('div','rp-empty','Üretim performansı için gerçek sipariş bulunmuyor.'));return}
 const wrap=mk('div','rp-bars');for(const [i,stage] of stages.entries()){const value=d.statuses.get(stage)||0,row=mk('div'),head=mk('div','rp-bar-title');head.append(mk('span','',stageNames[i]),mk('strong','',value+' sipariş'));const track=mk('div','rp-bar-track'),fill=mk('div','rp-bar-fill');fill.style.width=value/n*100+'%';track.append(fill);row.append(head,track);wrap.append(row)}box.append(wrap,mk('p','rp-mini','Teslim edilen: '+d.done.length+' · Üretimden teslimata süresi ölçülebilen: '+d.durations.length+' sipariş.'))}
function campaigns(d){const box=$('rp-campaigns');box.replaceChildren();const active=d.campaign.filter(c=>c.enabled&&c.starts_on<=iso(new Date())&&c.ends_on>=iso(new Date())&&(c.usage_limit==null||Number(c.used_count)<Number(c.usage_limit)));const header=mk('div','rp-bars');for(const [k,v] of [['Dönemle kesişen kampanyalar',d.campaign.length],['Bugün aktif',active.length],['Kaydedilmiş kullanım',d.campaign.reduce((s,c)=>s+Number(c.used_count||0),0)]]){const row=mk('div','rp-bar-title');row.append(mk('span','',k),mk('strong','',v));header.append(row)}box.append(header);d.campaign.slice(0,6).forEach(c=>{const row=mk('div','rp-campaign'),left=mk('div');left.append(mk('strong','',c.campaign_name),mk('small','',c.campaign_type+' · '+c.starts_on+' / '+c.ends_on));row.append(left,mk('strong','',Number(c.used_count||0)+' kullanım'));box.append(row)});box.append(mk('p','rp-campaign-note','Kampanya kullanım sayaçları gösterilir. Sipariş-kampanya bağlantısı kaydedilmediği için kampanyaya atfedilen gelir hesaplanmaz.'))}
function render(){if(!rangeCheck())return;data=build();kpis(data);lineChart(data);donut(data);ordersTable(data);topProducts(data);production(data);campaigns(data);$('rp-info').textContent=dt($('rp-start').value+'T12:00:00')+' – '+dt($('rp-end').value+'T12:00:00')+' · '+data.testExcluded+' test siparişi, '+data.unpaidExcluded+' ödeme onaysız ve '+data.zeroExcluded+' sıfır tutarlı sipariş hariç. '+(partial?'Uyarı: bazı tablolar 10.000 satır sınırına ulaştı; sonuçlar eksik olabilir.':'')+' Güncellendi: '+new Date(lastLoaded).toLocaleTimeString('tr-TR')}
function exportRows(){const rows=[['TÜR','SİPARİŞ','ÜRÜN','ADET','TUTAR TL','TARİH','DURUM','AÇIKLAMA']];for(const o of data.valid){const its=raw.items.filter(i=>i.order_id===o.id);if(!its.length)rows.push(['SİPARİŞ',o.id,'',1,Number(o.total_amount),iso(new Date(o.created_at)),o.status,'Ürün kalemi yok']);else its.forEach((i,k)=>rows.push(['SİPARİŞ',o.id,i.product_title,Number(i.quantity),Number(i.line_total),iso(new Date(o.created_at)),o.status,k===0?'Sipariş toplamı: '+Number(o.total_amount)+' TL':'']))}
 rows.push(['ÖZET','','',data.valid.length,data.turnover,'','','Toplam gerçek sipariş cirosu']);return rows}
function excel(){if(!data||!data.valid){alert('Önce rapor yükleyin.');return}const filename='Perde-Konagi-Rapor-'+$('rp-start').value+'-'+$('rp-end').value;
 if(window.XLSX?.utils){const wb=XLSX.utils.book_new(),make=(name,rows)=>{const ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=rows[0].map(()=>({wch:24}));XLSX.utils.book_append_sheet(wb,ws,name)};
 make('Siparisler',exportRows());make('Urunler',[['Ürün','Satış Adedi','Satış Geliri'],...data.top.map(x=>[x.name,x.qty,x.revenue])]);make('Uretim',[['Aşama','Sipariş Sayısı'],...stages.map((s,i)=>[stageNames[i],data.statuses.get(s)||0])]);make('Kampanyalar',[['Kampanya','Tür','Başlangıç','Bitiş','Kullanım'],...data.campaign.map(c=>[c.campaign_name,c.campaign_type,c.starts_on,c.ends_on,Number(c.used_count||0)])]);make('Ozet',[['Gösterge','Değer'],['Toplam Sipariş',data.valid.length],['Toplam Ciro',data.turnover],['Test Siparişleri Hariç',data.testExcluded]]);XLSX.writeFile(wb,filename+'.xlsx');return}
 const csv=exportRows().map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('rp-info').textContent+=' · Excel kitaplığı yüklenemedi; Excel ile açılabilen CSV indirildi.'}
function pdf(){if(!data)return;const safe=v=>String(v??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));const win=window.open('','_blank');if(!win){alert('PDF önizlemesi için açılır pencerelere izin verin.');return}
 const rows=data.top.slice(0,20).map(p=>'<tr><td>'+safe(p.name)+'</td><td>'+p.qty+'</td><td>'+safe(cash(p.revenue))+'</td></tr>').join('');
 const prod=stages.map((s,i)=>'<tr><td>'+safe(stageNames[i])+'</td><td>'+Number(data.statuses.get(s)||0)+'</td></tr>').join('');
 const html='<html lang="tr"><head><meta charset="utf-8"><title>Perde Konağı Raporu</title><style>@page{size:A4 portrait;margin:15mm}body{font:12px Arial,sans-serif;color:black}h1{font-size:22px;border-bottom:3px solid #111;padding-bottom:10px}h2{margin-top:25px;font-size:16px}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #888;text-align:left;padding:7px}th{background:#eee}.muted{color:#444}p{line-height:1.5}</style></head><body><h1>PERDE KONAĞI · SATIŞ RAPORU</h1><p>'+safe($('rp-start').value)+' — '+safe($('rp-end').value)+'</p><h2>Performans Özeti</h2><table><tr><th>Gerçek Sipariş</th><th>Ciro</th><th>Ortalama Sepet</th></tr><tr><td>'+data.valid.length+'</td><td>'+safe(cash(data.turnover))+'</td><td>'+safe(cash(data.valid.length?data.turnover/data.valid.length:0))+'</td></tr></table><h2>En Çok Satılan Ürünler</h2><table><tr><th>Ürün</th><th>Adet</th><th>Gelir</th></tr>'+rows+'</table><h2>Üretim Durumları</h2><table><tr><th>Aşama</th><th>Sipariş</th></tr>'+prod+'</table><p class="muted">'+data.testExcluded+' test siparişi ve ödeme onayı olmayan siparişler dahil edilmedi. Kampanya gelir atfı yapılamıyor.</p></body></html>';
 win.document.open();win.document.write(html);win.document.close();win.focus();win.print()}
function init(){if(started)return;started=true;setPeriod(30);$('rp-range').onchange=e=>{if(e.target.value!=='custom'){setPeriod(Number(e.target.value));render()}};$('rp-start').onchange=$('rp-end').onchange=()=>{$('rp-range').value='custom'};$('rp-granularity').onchange=()=>{if(data)render()};$('rp-apply').onclick=render;$('rp-refresh').onclick=load;$('rp-excel').onclick=excel;$('rp-pdf').onclick=pdf;load()}
document.addEventListener('click',e=>{if(e.target.closest('[data-section="reports"]'))setTimeout(init,30)});
window.addEventListener('hashchange',()=>{if(location.hash==='#reports')init()});
sb?.auth.onAuthStateChange((event,session)=>{if(session?.user&&['SIGNED_IN','INITIAL_SESSION'].includes(event)&&location.hash==='#reports')setTimeout(init,50)});
if(location.hash==='#reports')setTimeout(init,400);
})();
