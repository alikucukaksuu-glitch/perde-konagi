(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co',KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.supabase?.createClient(API,KEY),$=id=>document.getElementById(id);
const q=new URLSearchParams(location.search),id=q.get('id'),orgId=q.get('org'),mode=q.get('type')==='label'?'label':'a4',reprint=q.get('reprint')==='1';
let order=null,company=null,branch=null,items=[],printedRequested=false;
const fmt=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const date=s=>s?new Date(s.length===10?s+'T12:00:00':s).toLocaleDateString('tr-TR'):'—';
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text??'');return e}
function txt(parent,tag,cls,text){const n=el(tag,cls,text);parent.append(n);return n}
function fail(t){$('warning').textContent=t;$('print-btn').disabled=true;$('confirm-label').disabled=true}
function pair(parent,key,val){txt(parent,'dt','',key);txt(parent,'dd','',val||'—')}
function a4OrderItem(card,item,index){
 const product=el('article','a4-product'+(item?' is-filled':' is-empty'));
 if(!item)return product;
 const details=parseProductionInfo(item.production_note);
 txt(product,'strong','a4-product-name',(index+1)+'. '+item.product_name);
 const size=(item.width_cm??'—')+' × '+(item.height_cm??'—')+' cm';
 const specs=[
  ['Ölçü',size],['Adet','1'],['Pile',details.pile||'—'],['Tutar',fmt(item.unit_price)]
 ];
 for(const [key,value] of specs){
  const row=el('div','a4-product-detail');
  txt(row,'span','',key);
  txt(row,'b','',value);
  product.append(row);
 }
 card.append(product);
 return product;
}
function a4Category(page,category,limit){
 const all=items.filter(x=>x.category===category&&x.status!=='cancelled');
 const section=el('section','a4-category');
 const heading=el('div','a4-category-heading');
 txt(heading,'h2','',category);
 if(all.length)txt(heading,'span','',all.length+' ürün');
 section.append(heading);
 if(category==='STOR PERDE'||category==='AKSESUAR'){
  const grid=el('div','a4-entry-lines');
  const count=Math.max(6,all.length);
  for(let i=0;i<count;i++){
   const line=el('div','a4-entry-line');
   const item=all[i];
   txt(line,'span','',(i+1)+'.');
   txt(line,'span','',item?item.product_name+' · '+(item.width_cm??'—')+' × '+(item.height_cm??'—')+' cm · '+fmt(item.unit_price):'');
   grid.append(line);
  }
  section.append(grid);
 }else{
  const grid=el('div','a4-product-grid');
  const cells=Math.max(limit,all.length);
  for(let i=0;i<cells;i++)a4OrderItem(grid,all[i],i);
  section.append(grid);
 }
 page.append(section);
}
function addA4(){
 const page=$('page');page.replaceChildren();
 document.body.classList.add('a4-mode');
 const header=el('header','a4-new-head');
 const brand=el('div','a4-new-brand');
 if(company.logo_url&&/^https:\/\//.test(company.logo_url)){
  const logo=el('img','a4-new-logo');logo.src=company.logo_url;logo.alt=company.name;brand.append(logo);
 }
 const brandCopy=el('div','a4-brand-copy');
 txt(brandCopy,'h1','',company.name);
 txt(brandCopy,'strong','',(branch.name||'')+' ŞUBESİ');
 brand.append(brandCopy);
 const contact=el('div','a4-new-contact');
 if(branch.address)txt(contact,'p','',branch.address);
 if(branch.phone)txt(contact,'p','','Tel: '+branch.phone);
 if(company.phone&&company.phone!==branch.phone)txt(contact,'p','','Merkez: '+company.phone);
 if(company.instagram)txt(contact,'p','',company.instagram);
 brand.append(contact);
 const customer=el('div','a4-new-customer');
 const dl=el('dl');
 pair(dl,'Sipariş No','#'+order.order_number);
 pair(dl,'Müşteri',order.customer_name);
 pair(dl,'Telefon',order.customer_phone);
 pair(dl,'Teslim Tarihi',date(order.delivery_date));
 if(order.created_at)pair(dl,'Sipariş Tarihi',date(order.created_at));
 customer.append(dl);
 header.append(brand,customer);
 page.append(header);
 a4Category(page,'TÜL PERDE',10);
 a4Category(page,'FON PERDE',5);
 a4Category(page,'GÜNEŞLİK',5);
 a4Category(page,'STOR PERDE',6);
 a4Category(page,'AKSESUAR',6);
 const note=el('div','a4-new-note');
 txt(note,'strong','','SİPARİŞ NOTU');
 txt(note,'p','',order.customer_note||'—');
 page.append(note);
 const totals=el('div','a4-new-totals');
 const discount=Math.max(0,Number(order.subtotal_amount||0)-Number(order.total_amount||0));
 for(const [name,value] of [
  ['Toplam',order.total_amount],['Ödenen',order.paid_amount],
  ['Kalan',Math.max(0,Number(order.total_amount)-Number(order.paid_amount))]
 ]){
  const cell=el('div','a4-new-total');
  txt(cell,'span','',name);txt(cell,'strong','',fmt(value));totals.append(cell);
 }
 page.append(totals);
 txt(page,'footer','a4-new-footer','Özel ölçüyle hazırlanan ürünlerde iade ve değişim koşulları yürürlükteki mevzuata tabidir.');
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
 const box=el('article','thermal-label qr-label');
 const details=parseProductionInfo(item.production_note);
 const head=el('div','qr-label-head');
 const heading=el('div','qr-brand');
 if(company.logo_url&&/^https:\/\//.test(company.logo_url)){
  const img=el('img','qr-company-logo');img.src=company.logo_url;img.alt=company.name;
  heading.append(img);
 }
 const companyText=el('div','qr-company-text');
 txt(companyText,'strong','',company.name);
 txt(companyText,'small','','#'+order.order_number+' · '+branch.name);
 heading.append(companyText);head.append(heading);
 box.append(head);
 txt(box,'div','qr-customer','MÜŞTERİ: '+(order.customer_name||'—'));
 txt(box,'h3','','ÜRÜN: '+item.product_name);
 const split=el('div','qr-label-mid'),left=el('div','qr-label-info'),right=el('div','qr-label-code');
 const specs=el('div','label-specs');
 const isStor=item.category==='STOR PERDE',isPlise=item.category==='PLİSE PERDE',isWood=item.category==='AHŞAP JALUZİ';
 const meta=(isStor||isPlise||isWood)?String(item.production_note||'').split(/\r?\n/)[0]:''; 
 const option=(label)=>meta.match(new RegExp('(?:^|;\\s*)'+label+':\\s*([^;]+)'))?.[1]?.trim()||'';
 const lines=['Adet: 1','En: '+(item.width_cm??'—')+' cm','Boy: '+(item.height_cm??'—')+' cm'];
 if(isStor){
  if(option('Kasa'))lines.push('Kasa: '+option('Kasa')+(option('Kasa Rengi')?' / '+option('Kasa Rengi'):''));
  if(option('Zincir'))lines.push('Zincir: '+option('Zincir')+' / '+(option('Zincir Yönü')||'—'));
  if(option('Boru'))lines.push('Boru: '+option('Boru'));
 }else if(isPlise){
  if(option('Montaj'))lines.push('Montaj: '+option('Montaj'));
  if(option('Kasa Rengi'))lines.push('Kasa: '+option('Kasa Rengi'));
 }else if(isWood){
  lines.push('Kurdela: '+(option('Kurdela')||'Yok'));
  if(option('Mekanizma'))lines.push('Mekanizma: '+option('Mekanizma'));
 }else lines.push('Pile: '+(details.pile||'—'));
 for(const x of lines)txt(specs,'span','',x);
 left.append(specs);
 txt(right,'strong','qr-code-heading','MAĞAZAYA KABUL QR');
 const qr=el('div','qr-image');
 right.append(qr);
 const qrUrl=new URL('./receive.html',location.href);
 qrUrl.searchParams.set('t',item.receiveToken);
 try{
  if(!window.QRCode||!item.receiveToken)throw Error('QR oluşturulamadı');
  new window.QRCode(qr,{text:qrUrl.href,width:220,height:220,colorDark:'#000000',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel.L});
 }catch(e){fail('QR oluşturulamadı: '+e.message)}
 split.append(left,right);box.append(split);
 const notes=el('div','qr-notes');
 txt(notes,'strong','','ÜRÜN / SİPARİŞ NOTU');
 const noteText=[details.detail&&'Ürün: '+details.detail,order.customer_note&&'Sipariş: '+order.customer_note].filter(Boolean).join('\n');
 txt(notes,'p','',noteText||'—');
 box.append(notes);
 return box;
}

function customerPhoneDigits(value){
 let digits=String(value||'').replace(/\D/g,'');
 if(digits.length===10&&digits.startsWith('5'))digits='90'+digits;
 else if(digits.length===11&&digits.startsWith('0'))digits='9'+digits;
 return /^90[1-9]\d{9}$/.test(digits)?digits:'';
}
function customerPdfFileName(){
 const name=String(order.customer_name||'musteri').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,45);
 return 'Perde_Konagi_Siparis_'+String(order.order_number||'').replace(/[^0-9a-zA-Z_-]/g,'')+'_'+name+'.pdf';
}
let pdfBusy=false;
async function createCustomerPdf(){
 if(mode!=='a4'||!order||!company||!branch)throw Error('Müşteri formu yüklenmedi.');
 if(!window.html2pdf)throw Error('PDF oluşturma bileşeni yüklenemedi. İnternet bağlantınızı kontrol edin.');
 const page=$('page');
 await document.fonts?.ready;
 const images=[...page.querySelectorAll('img')];
 await Promise.all(images.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true})})));
 const options={
  margin:0,
  filename:customerPdfFileName(),
  image:{type:'jpeg',quality:0.97},
  html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff',scrollX:0,scrollY:0,windowWidth:1000},
  jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},
  pagebreak:{mode:['css','legacy'],avoid:['.a4-product','.a4-category-heading','.a4-new-customer']}
 };
 return await window.html2pdf().set(options).from(page).outputPdf('blob');
}
function downloadPdfBlob(blob){
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');
 link.href=url;link.download=customerPdfFileName();document.body.append(link);
 link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function pdfStatus(message,failed=false){
 const box=$('pdf-action-status');box.textContent=message;
 box.dataset.error=failed?'1':'0';
}
async function downloadCustomerPdf(){
 if(pdfBusy)return;
 pdfBusy=true;$('pdf-btn').disabled=true;$('customer-whatsapp-btn').disabled=true;
 pdfStatus('A4 müşteri PDF dosyası hazırlanıyor...');
 try{
  const blob=await createCustomerPdf();downloadPdfBlob(blob);
  pdfStatus('PDF indirildi. Dosyayı bilgisayarınızın İndirilenler klasöründe bulabilirsiniz.');
 }catch(e){pdfStatus('PDF hazırlanamadı: '+e.message,true)}
 finally{pdfBusy=false;$('pdf-btn').disabled=false;$('customer-whatsapp-btn').disabled=false}
}
async function sendCustomerPdfWhatsapp(){
 if(pdfBusy)return;
 const number=customerPhoneDigits(order?.customer_phone);
 if(!number){pdfStatus('Müşteri telefon numarası eksik veya geçersiz. Numara 05xx xxx xx xx biçiminde olmalıdır.',true);return}
 // Create/open the WhatsApp tab synchronously as part of the user's click to avoid popup blockers.
 const message='Merhaba '+(order.customer_name||'')+',\nPerde Konağı '+(order.order_number?'#'+order.order_number+' ':'')+'numaralı sipariş formunuz hazırdır. PDF dosyasını bu sohbet üzerinden iletiyoruz.\nİyi günler dileriz.';
 const url='https://wa.me/'+number+'?text='+encodeURIComponent(message);
 const tab=window.open(url,'_blank');
 if(tab){try{tab.opener=null}catch(_){}}
 if(!tab){pdfStatus('WhatsApp sekmesi engellendi. Açılır pencere izni verip tekrar deneyin.',true);return}
 pdfBusy=true;$('pdf-btn').disabled=true;$('customer-whatsapp-btn').disabled=true;
 pdfStatus('WhatsApp sohbeti açıldı. PDF dosyası hazırlanıyor...');
 try{
  const blob=await createCustomerPdf();downloadPdfBlob(blob);
  pdfStatus('PDF indirildi ve müşterinin WhatsApp sohbeti açıldı. PDF’yi sohbete dosya olarak ekleyip Gönder’e basın. Dosya otomatik eklenmez veya gönderilmez.');
 }catch(e){pdfStatus('WhatsApp sohbeti açıldı fakat PDF hazırlanamadı: '+e.message+'. Gerekirse Yazdır > PDF olarak kaydet seçeneğini kullanın.',true)}
 finally{pdfBusy=false;$('pdf-btn').disabled=false;$('customer-whatsapp-btn').disabled=false}
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
  sb.from('erp_orders').select('id,organization_id,branch_id,order_number,customer_name,customer_phone,delivery_date,customer_note,total_amount,paid_amount,status,barcode_printed_at,created_at').eq('id',id).eq('organization_id',orgId).single(),
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
  if(reprint){
   const {data:membership,error:roleError}=await sb.from('erp_members').select('role').eq('organization_id',orgId).eq('user_id',user.user.id).maybeSingle();
   if(roleError||!['owner','manager'].includes(membership?.role)){fail('Yeniden baskı için yönetici yetkisi gerekli.');return}
   if(!order.barcode_printed_at){fail('Henüz ilk barkod baskısı tamamlanmadı.');return}
   if(order.status==='cancelled'){fail('İptal edilen sipariş yazdırılamaz.');return}
  }else{
   if(order.barcode_printed_at){fail('Barkod daha önce basılmış. Yeniden baskı için yöneticinin Yeniden Yazdır seçeneğini kullanması gerekir.');return}
   if(!['processing','new'].includes(order.status)){fail('Barkod yalnızca İşlemde durumunda basılabilir.');return}
   if(items.some(i=>!['processing','cancelled'].includes(i.status))){fail('Bazı ürünlerin durumu farklı, baskıdan önce kontrol edin.');return}
  }
  try{
   const active=items.filter(i=>i.status!=='cancelled');
   const tokens=await Promise.all(active.map(i=>sb.rpc('erp_get_item_receive_token',{p_org:orgId,p_item:i.id})));
   for(let index=0;index<tokens.length;index++){
    if(tokens[index].error||!tokens[index].data)throw tokens[index].error||new Error('QR erişim kodu üretilemedi');
    active[index].receiveToken=tokens[index].data;
   }
  }catch(e){fail('QR kod hazırlanamadı: '+e.message);return}
  addLabels();
  if($('warning').textContent)return;
  $('print-hint').textContent=reprint?'Yönetici yeniden baskısıdır. Sipariş ve üretim durumu değişmez. Baskı gerekçesi işlem geçmişine kaydedilir.':'Baskıyı başlatın. Çıktının gerçekten alındığını kontrol ettikten sonra “Yazdırıldı · Atölyeye Gönder” düğmesine basın. Bu onay barkodu kilitler ve siparişi Atölyede durumuna geçirir.';
  const flow=$('label-flow');
  if(flow){flow.hidden=false;flow.querySelector('#label-order-no').textContent='#'+order.order_number;flow.querySelector('#label-count').textContent=String(items.filter(i=>i.status!=='cancelled').length);}
 }else{
  addA4();$('print-hint').textContent='A4 müşteri formu. Üretim barkodlarını ayrıca Barkod Yazdır üzerinden alın.';
  $('pdf-btn').hidden=false;$('customer-whatsapp-btn').hidden=false;
  $('pdf-btn').disabled=false;$('customer-whatsapp-btn').disabled=false;
  $('pdf-btn').onclick=downloadCustomerPdf;
  $('customer-whatsapp-btn').onclick=sendCustomerPdfWhatsapp;
 }
 $('print-btn').disabled=false;
 $('print-btn').onclick=async()=>{
  if(mode==='label'&&reprint){
   const reason=prompt('Etiket yeniden baskı gerekçesi (en az 5 karakter):','QR kod okunmuyor');
   if(reason===null)return;
   if(reason.trim().length<5){$('warning').textContent='Yeniden baskı açıklaması en az 5 karakter olmalı.';return}
   $('print-btn').disabled=true;
   const {error}=await sb.rpc('erp_log_label_reprint',{p_org:orgId,p_order:id,p_reason:reason.trim()});
   $('print-btn').disabled=false;
   if(error){$('warning').textContent='Yeniden baskı kaydı oluşturulamadı: '+error.message;return}
  }
  printedRequested=true;
  if(mode==='label'&&!reprint){$('confirm-label').hidden=false;$('confirm-label').disabled=false}
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