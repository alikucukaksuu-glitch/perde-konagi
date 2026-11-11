(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co',KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.supabase?.createClient(API,KEY),$=id=>document.getElementById(id);
const q=new URLSearchParams(location.search),id=q.get('id'),orgId=q.get('org'),mode=q.get('type')==='label'?'label':'a4';
let order=null,company=null,branch=null,items=[],printedRequested=false;
const fmt=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const date=s=>s?new Date(s.length===10?s+'T12:00:00':s).toLocaleDateString('tr-TR'):'—';
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text??'');return e}
function txt(parent,tag,cls,text){const n=el(tag,cls,text);parent.append(n);return n}
function fail(t){$('warning').textContent=t;$('print-btn').disabled=true;$('confirm-label').disabled=true}
function pair(parent,key,val){txt(parent,'dt','',key);txt(parent,'dd','',val||'—')}
function addA4(){
 const page=$('page');page.replaceChildren();
 const head=el('div','a4-head'),info=el('div','a4-company'),client=el('div','a4-client');
 txt(info,'h1','',company.name);const branchLabel=(branch.name||'')+' ŞUBESİ';
 txt(info,'b','',branchLabel);
 txt(info,'p','',[branch.address,branch.phone].filter(Boolean).join('\n'));
 if(company.address)txt(info,'p','',company.address);
 if(company.phone)txt(info,'p','','Tel: '+company.phone);
 if(company.instagram)txt(info,'p','',company.instagram);
 if(company.logo_url&&/^https:\/\//.test(company.logo_url)){
  const img=el('img','a4-logo');img.src=company.logo_url;img.alt=company.name;client.append(img);
 }else txt(client,'h2','',company.name);
 const dl=el('dl');pair(dl,'Sipariş No','#'+order.order_number);pair(dl,'Müşteri Adı',order.customer_name);pair(dl,'Telefon',order.customer_phone);pair(dl,'Teslim Tarihi',date(order.delivery_date));client.append(dl);
 head.append(info,client);page.append(head);
 for(const category of ['TÜL PERDE','FON PERDE','GÜNEŞLİK','STOR PERDE','AKSESUAR']){
  const group=el('section','a4-group');
  txt(group,'h2','',category);
  const rows=items.filter(x=>x.category===category&&x.status!=='cancelled');
  if(category==='STOR PERDE'||category==='AKSESUAR'){
   const grid=el('div','a4-lines');
   for(let i=0;i<6;i++){const r=rows[i],line=el('div');line.textContent=(i+1)+'. '+(r?r.product_name+' · '+(r.width_cm??'—')+' × '+(r.height_cm??'—')+' cm':'');grid.append(line)}
   group.append(grid);
  }else{
   const grid=el('div','a4-grid');
   for(let i=0;i<(category==='TÜL PERDE'?10:5);i++){
    const r=rows[i],cell=el('div','a4-cell');
    if(r){txt(cell,'strong','',r.product_name);txt(cell,'span','',(r.width_cm??'—')+' × '+(r.height_cm??'—')+' cm');txt(cell,'div','',r.production_note||'');}
    grid.append(cell);
   }group.append(grid);
  }
  page.append(group);
 }
 txt(page,'div','a4-note','Not: '+(order.customer_note||''));
 const totals=el('div','a4-totals');
 for(const [name,value] of [['Toplam',order.total_amount],['Ödenen',order.paid_amount],['Kalan',Number(order.total_amount)-Number(order.paid_amount)]]){
  const cell=el('div');txt(cell,'span','',name);txt(cell,'b','',fmt(value));totals.append(cell);
 }page.append(totals);
 txt(page,'div','a4-footer','ÖZEL SİPARİŞ YAPILAN TÜLLERDE DEĞİŞİM YAPILMAMAKTADIR. MÜŞTERİ KAYNAKLI HATALI ÖLÇÜLERDE ÜCRET ALINIR.');
}
function parseProductionInfo(note){
 const source=String(note||'');
 const lines=source.split(/\r?\n/);
 const first=lines[0]||'';
 const prefix=/^Özellikler:\s*/i.test(first);
 const metadata=prefix?first.replace(/^Özellikler:\s*/i,''):'';
 const parts=metadata.split(/\s*;\s*/).filter(Boolean);
 const pilePart=parts.find(part=>/^Pile:\s*/i.test(part));
 const pile=pilePart?pilePart.replace(/^Pile:\s*/i,'').trim():'';
 const extra=parts.filter(part=>!/^(Pile|Baz Fiyat):\s*/i.test(part)).join('; ');
 const noteLines=prefix?lines.slice(1):lines;
 const cleanNote=noteLines.join('\n').replace(/(?:^|[;\n]\s*)Baz Fiyat:\s*[\d.,]+/gi,'').trim();
 return {pile,detail:[extra,cleanNote].filter(Boolean).join(' · ')};
}
function makeLabel(item){
 const box=el('article','thermal-label');
 const info=parseProductionInfo(item.production_note);
 const head=el('div','label-top');
 txt(head,'strong','','#'+order.order_number+' · '+order.customer_name);
 txt(head,'span','',branch.name);
 box.append(head);
 txt(box,'h3','',item.category+' · '+item.product_name);
 const specs=el('div','label-specs');
 txt(specs,'span','','Adet: 1');
 txt(specs,'span','','En: '+(item.width_cm??'—')+' cm');
 txt(specs,'span','','Boy: '+(item.height_cm??'—')+' cm');
 txt(specs,'span','','Pile: '+(info.pile||'Belirtilmedi'));
 box.append(specs);
 if(info.detail)txt(box,'p','label-note','Üretim Notu: '+info.detail);
 if(order.customer_note)txt(box,'p','label-note','Sipariş Notu: '+order.customer_note);
 const graphic=el('div','label-barcode');
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.classList.add('barcode-graphic');graphic.append(svg);
 txt(graphic,'div','barcode-text',item.barcode);
 box.append(graphic);
 try{
  if(!window.JsBarcode)throw Error('Barkod kütüphanesi yüklenemedi');
  if(!item.barcode)throw Error('Ürün barkod değeri bulunamadı');
  window.JsBarcode(svg,item.barcode,{format:'CODE128',displayValue:false,margin:0,height:40,width:1.2});
 }catch(e){fail('Barkod çizimi başarısız: '+e.message)}
 return box;
}
function addLabels(){
 document.body.classList.add('label-mode');
 const sheet=document.createElement('style');sheet.textContent='@media print{@page{size:80mm 50mm;margin:0}}';document.head.append(sheet);
 const page=$('page');page.replaceChildren();
 const labels=items.filter(i=>i.status!=='cancelled');
 for(const item of labels)page.append(makeLabel(item));
 if(!labels.length)fail('Yazdırılacak etkin ürün bulunamadı');
}
async function start(){
 $('print-title').textContent=mode==='label'?'Üretim Barkod Etiketleri':'A4 Müşteri Çıktısı';
 $('back').href='./order-new.html?org='+encodeURIComponent(orgId||'')+'&edit='+encodeURIComponent(id||'');
 if(!sb||!id||!orgId){fail('Eksik bağlantı veya giriş bilgisi');return}
 const {data:user,error:authError}=await sb.auth.getUser();
 if(authError||!user?.user){fail('Giriş yapmanız gerekiyor');return}
 const [{data:o,error:e1},{data:rows,error:e2},{data:co,error:e3}]=await Promise.all([
  sb.from('erp_orders').select('id,organization_id,branch_id,order_number,customer_name,customer_phone,delivery_date,customer_note,total_amount,paid_amount,status,barcode_printed_at').eq('id',id).eq('organization_id',orgId).single(),
  sb.from('erp_order_items').select('id,category,product_name,width_cm,height_cm,unit_price,production_note,barcode,status').eq('order_id',id).eq('organization_id',orgId).order('created_at'),
  sb.from('erp_organizations').select('id,name,logo_url,phone,email,address,instagram').eq('id',orgId).single()
 ]);
 if(e1||e2||e3){fail('Sipariş bilgileri alınamadı: '+(e1||e2||e3).message);return}
 order=o;items=rows||[];company=co;
 const {data:br,error:e4}=await sb.from('erp_branches').select('name,address,phone').eq('id',o.branch_id).eq('organization_id',orgId).single();
 if(e4){fail('Şube bilgisi alınamadı: '+e4.message);return}
 branch=br;
 $('warning').textContent='';
 if(mode==='label'){
  if(order.barcode_printed_at){fail('Barkod bu sipariş için daha önce basılmış. Tekrar baskı yetkili işlem gerektirir.');return}
  if(!['processing','new'].includes(order.status)){fail('Barkod yalnızca İşlemde durumundaki sipariş için yazdırılır.');return}
  if(items.some(i=>!['processing','cancelled'].includes(i.status))){fail('Siparişte üretim aşaması farklı ürünler var. Barkod basmadan önce kontrol edin.');return}
  addLabels();
  if($('warning').textContent)return;
  $('print-hint').textContent='Baskıyı başlatın. Çıktının gerçekten alındığını kontrol ettikten sonra “Yazdırıldı · Atölyeye Gönder” düğmesine basın. Bu onay barkodu kilitler ve siparişi Atölyede durumuna geçirir.';
  const flow=$('label-flow');
  if(flow){flow.hidden=false;flow.querySelector('#label-order-no').textContent='#'+order.order_number;flow.querySelector('#label-count').textContent=String(items.filter(i=>i.status!=='cancelled').length);}
 }else{
  addA4();$('print-hint').textContent='A4 müşteri formu. Üretim barkodlarını ayrıca Barkod Yazdır üzerinden alın.';
 }
 $('print-btn').disabled=false;
 $('print-btn').onclick=()=>{
  printedRequested=true;
  if(mode==='label'){$('confirm-label').hidden=false;$('confirm-label').disabled=false}
  window.print();
 };
 $('confirm-label').onclick=async()=>{
  if(!printedRequested||!confirm('Etiketlerin gerçekten yazdırıldığını onaylıyor musunuz? Sipariş Atölyede durumuna geçecek ve aynı barkod tekrar basılamayacak.'))return;
  $('confirm-label').disabled=true;
  try{
   const {error}=await sb.rpc('erp_mark_barcode_printed',{p_org:orgId,p_order:id});
   if(error)throw error;
   $('warning').textContent='Barkod baskısı onaylandı. Sipariş Atölyede durumuna geçirildi.';
   $('print-btn').disabled=true;$('confirm-label').hidden=true;
   $('print-hint').textContent='Barkod işlemi tamamlandı. Siparişler sayfasına dönebilirsiniz.';
  }catch(e){$('warning').textContent='Baskı onaylanamadı: '+e.message;$('confirm-label').disabled=false}
 };
}
start().catch(e=>fail(e.message));
})();