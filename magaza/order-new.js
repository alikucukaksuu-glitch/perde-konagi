(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co',KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.supabase?.createClient(API,KEY),$=id=>document.getElementById(id);
const quoteMode=new URLSearchParams(location.search).get('quote')==='1';let quoteEditing=null;
const categories=[{name:'TÜL PERDE',count:10},{name:'FON PERDE',count:5},{name:'GÜNEŞLİK',count:5},{name:'STOR PERDE',count:6,kind:'list'},{name:'PLİSE PERDE',count:6,kind:'list'},{name:'AHŞAP JALUZİ',count:6,kind:'list'},{name:'AKSESUAR',count:6,kind:'list'}];
const fmt=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const asNum=v=>Number(v)||0;
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let memberRole='staff';
let user=null,org=null,branches=[],existingCustomers=[],products=new Map(),active=null,saving=false,editing=null;
const key=(category,index)=>category+'|'+index;
const pileFactors={'1.0x':1,'2.0x':2,'3.0x':3,'3.5x':3.5,'4.5x':4.5,'Özel':1,'':1};
const pileFactor=(pile)=>pileFactors[pile]??1;
const rounded=(n)=>Math.round((Number(n)+Number.EPSILON)*100)/100;
const priceFromBase=(base,pile)=>rounded(Number(base)*pileFactor(pile));
const tulUnitPrice=(base,widthCm,pile)=>rounded((Number(widthCm)/100)*pileFactor(pile)*Number(base));
const storCaseColors={open:[],classic:['Beyaz','Krem'],colored:['Gri','Antrasit','Kahve']};
let catalogCache=[],catalogOrg=null,catalogRequest=null,manualPrice=false;
function isStor(){return $('product-category').value==='STOR PERDE'}
function isPlise(){return $('product-category').value==='PLİSE PERDE'}
function isWood(){return $('product-category').value==='AHŞAP JALUZİ'}
function isFon(){return $('product-category').value==='FON PERDE'}
function isTul(){return $('product-category').value.trim().toLocaleUpperCase('tr-TR')==='TÜL PERDE'}
const fonSizes=['60','65','70','75','80','85','90','95','100'];
function syncFonSizes(selected=''){
 const kind=$('fon-wing-type').value,select=$('fon-wing-size');select.replaceChildren();
 const prompt=document.createElement('option');prompt.value='';prompt.textContent=kind?'Kanat ölçüsü seçiniz':'Önce kanat tipi seçiniz';select.append(prompt);
 for(const size of kind?fonSizes:[]){const option=document.createElement('option');option.value=kind==='Çift Kanat'?size+'/'+size:size;option.textContent=option.value+' cm';select.append(option)}
 select.value=[...select.options].some(o=>o.value===selected)?selected:'';
}
function parseFonConfiguration(spec){const text=String(spec||'');const kind=text.match(/(?:^|;\s*)Kanat Tipi:\s*(Tek Kanat|Çift Kanat)(?:;|$)/)?.[1]||'';const size=text.match(/(?:^|;\s*)Kanat Ölçüsü:\s*(\d+(?:\/\d+)?)(?:;|$)/)?.[1]||'';return {kind,size}}
function stripFonFields(spec){return String(spec||'').split(/;\s*/).filter(x=>!/^Kanat (Tipi|Ölçüsü):\s*/.test(x)).join('; ').trim()}
function woodConfiguration(){return {ribbon:$('wood-ribbon').checked,mechanism:$('wood-mechanism').value}}
function parseWoodConfiguration(spec){
 const str=String(spec||'');
 return {ribbon:/(?:^|;\s*)Kurdela:\s*Var(?:;|$)/.test(str),mechanism:/(?:^|;\s*)Mekanizma:\s*Redüktörlü(?:;|$)/.test(str)?'Redüktörlü':'İpli'};
}
function stripWoodFields(spec){
 return String(spec||'').split(/;\s*/).filter(x=>!/^(Kurdela|Mekanizma|Hesap En|Hesap Boy):\s*/.test(x)).join('; ').trim()
}
function validWoodMeasure(v){
 const n=Number(v);
 return String(v).trim()!==''&&Number.isFinite(n)&&n>0&&Math.abs(n*2-Math.round(n*2))<1e-7;
}
function woodPrice(base,w,h){
 const cw=Math.ceil(Number(w)-1e-9),ch=Math.ceil(Number(h)-1e-9);
 return rounded(Math.max(1,cw*ch/10000)*Number(base));
}

const pliseMounts=['Vidalı Montaj','Yapışkanlı Montaj','Pratik Montaj','Askılı Montaj'];
const pliseCaseColors=['Beyaz','Krem','Siyah','Antrasit','Vizon','Gri'];
function pliseConfiguration(){return {mount:$('plise-mount').value,caseColor:$('plise-case-color').value}}
function parsePliseConfiguration(spec){
 const fields=String(spec||'').split(/;\s*/);
 const field=name=>(fields.find(p=>p.startsWith(name+': '))||'').slice(name.length+2);
 return {mount:pliseMounts.includes(field('Montaj'))?field('Montaj'):pliseMounts[0],
 caseColor:pliseCaseColors.includes(field('Kasa Rengi'))?field('Kasa Rengi'):pliseCaseColors[0]};
}
function stripPliseSystemFields(spec){
 return String(spec||'').split(/;\s*/).filter(x=>!(/^(Montaj|Kasa Rengi|Hesap En|Hesap Boy):\s*/.test(x))).join('; ').trim();
}

function plisePrice(base,w,h){
 const width=Math.ceil(Number(w)-1e-9),height=Math.ceil(Number(h)-1e-9);
 return rounded(Math.max(1,width*height/10000)*Number(base));
}
function validPliseMeasure(v){
 const n=Number(v);
 return String(v).trim()!==''&&Number.isFinite(n)&&n>0&&Math.abs(n*10-Math.round(n*10))<1e-7;
}
function storSettings(){
 return {caseType:$('stor-case').value,color:$('stor-color').value,chain:$('stor-chain').value,side:$('stor-side').value,tube:$('stor-tube').value,foot:$('stor-foot').value,hem:$('stor-hem').value}
}
function storUnitPrice(base,w,h,opts){
 const calcWidth=Math.max(100,Number(w)||0),calcHeight=Math.max(200,Number(h)||0);
 const meter=calcWidth/100,area=calcWidth*calcHeight/10000;
 const caseCost=(opts.caseType==='classic'?140:opts.caseType==='colored'?170:0)*meter;
 const chainCost=opts.chain==='metal'?105:0;
 const tubeCost=opts.tube==='38'?200*meter:0;
 return rounded(area*base+caseCost+chainCost+tubeCost)
}
function storSpecs(opts,w,h){
 const cases={open:'Açık Kasa',classic:'Kapalı Kasa Klasik',colored:'Kapalı Kasa Renkli'};
 return ['Kasa: '+cases[opts.caseType],opts.caseType!=='open'&&'Kasa Rengi: '+opts.color,
 'Zincir: '+(opts.chain==='metal'?'Metal':'Plastik'),'Zincir Yönü: '+(opts.side==='right'?'Sağ':'Sol'),
 'Boru: '+(opts.tube==='38'?'38 Jumbo':'32 Standart'),'Yan Ayak: '+(opts.foot==='metal'?'Metal':'Plastik'),
 opts.hem&&'Etek Dilim Modeli: Etek Dilim '+opts.hem,
 'Hesap En: '+Math.max(100,Number(w)||0)+' cm','Hesap Boy: '+Math.max(200,Number(h)||0)+' cm'].filter(Boolean).join('; ')
}
function parseStorSpecs(spec){
 const get=key=>(String(spec||'').match(new RegExp('(?:^|;\\\\s*)'+key+':\\\\s*([^;]+)'))?.[1]||'').trim();
 const kase=get('Kasa');
 return {caseType:kase==='Kapalı Kasa Klasik'?'classic':kase==='Kapalı Kasa Renkli'?'colored':'open',
 color:get('Kasa Rengi'),chain:get('Zincir')==='Metal'?'metal':'plastic',
 side:get('Zincir Yönü')==='Sağ'?'right':'left',tube:get('Boru').startsWith('38')?'38':'32',
 foot:get('Yan Ayak')==='Metal'?'metal':'plastic',hem:(get('Etek Dilim Modeli').match(/(?:Etek Dilim )?(1[01]|[1-9])$/)?.[1]||'')}
}
function stripStorOptions(spec){
 return String(spec||'').split(/;\s*/).filter(part=>!/^(Kasa|Kasa Rengi|Zincir|Zincir Yönü|Boru|Yan Ayak|Etek Dilim Modeli|Hesap En|Hesap Boy):\s*/.test(part)).join('; ').trim();
}
function syncStorColor(value){
 const colors=storCaseColors[value]||[];
 $('stor-color-row').hidden=!colors.length;
 $('stor-color').replaceChildren(...colors.map(c=>new Option(c,c)));
 if(!colors.includes($('stor-color').value))$('stor-color').value=colors[0]||'';
}
const pileControlRow=document.getElementById('pile-selection-row');
const pileControlSelect=document.getElementById('product-pile');
function syncCategoryUI(){
 const stor=isStor(),plise=isPlise(),wood=isWood();
 $('stor-options').hidden=!stor;
 $('plise-options').hidden=!plise;
 $('wood-options').hidden=!wood;
 $('fon-options').hidden=!isFon();
 // Remove the pile field from the DOM for stor products, not just visually hide it.
 // Restore the exact same field when switching back to tulle/fon/other categories.
 const pileRow=pileControlRow,unitRow=$('unit-options-row');
 if(stor||plise||wood){
  pileRow.hidden=true;
  pileRow.remove();
  pileControlSelect.disabled=true;
  pileControlSelect.value='';
 }else{
  if(!unitRow.contains(pileRow))unitRow.insertBefore(pileRow,unitRow.firstChild);
  pileRow.hidden=false;
  pileControlSelect.disabled=false;
 }
 unitRow.classList.toggle('stor-price-only',stor||plise||wood);
 $('product-price').closest('label').firstChild.textContent=(stor||plise||wood)?'m² Birim Fiyatı (₺) *':isTul()?'Metre Fiyatı (₺ / m) *':'Temel Birim Fiyat (₺) *';
 $('product-width').required=stor||plise||wood||isTul();$('product-height').required=stor||plise||wood;
 $('product-width').step=wood?'0.5':plise?'0.1':'0.01';$('product-height').step=wood?'0.5':plise?'0.1':'0.01';
 if(stor)syncStorColor($('stor-case').value);
}
async function fetchCatalog(){
 if(!org?.id)return;
 if(catalogOrg===org.id)return;
 catalogCache=[];catalogOrg=org.id;
 const requested=org.id;
 const promise=sb.from('erp_catalog_products').select('id,name,category,unit_price').eq('organization_id',requested).eq('active',true).order('name').limit(1000);
 catalogRequest=promise;
 const {data,error}=await promise;
 if(catalogOrg!==requested)return;
 if(error){$('catalog-hint').textContent='Katalog yüklenemedi: '+error.message;return}
 catalogCache=data||[];
 $('catalog-hint').textContent='Ürün seçilince fiyat otomatik gelir. Tek harften itibaren arama yapabilirsiniz.';
}
function showCatalog(){
 const category=$('product-category').value;
 const search=$('catalog-search').value.trim().toLocaleUpperCase('tr-TR');
 const matches=catalogCache.filter(p=>p.category===category&&(!search||p.name.toLocaleUpperCase('tr-TR').startsWith(search)));
 const list=$('catalog-results');list.replaceChildren();
 for(const p of matches.slice(0,150)){
  const button=newElement('button','catalog-choice');button.type='button';button.setAttribute('role','option');
  button.append(newElement('span','',p.name),newElement('strong','',fmt(p.unit_price)+(['STOR PERDE','PLİSE PERDE','AHŞAP JALUZİ'].includes(category)?' / m²':'')));
  button.onclick=()=>{
   $('product-name').value=p.name;$('catalog-search').value=p.name;
   $('product-price').value=p.unit_price;manualPrice=false;list.hidden=true;calculateItemTotal();
  };
  list.append(button);
 }
 if(matches.length>150)list.append(newElement('p','catalog-hint','İlk 150 ürün gösteriliyor. Aramanızı daraltın.'));
 if(!matches.length)list.append(newElement('p','catalog-hint','Bu harfle başlayan ürün bulunamadı.'));
 list.hidden=false;
}

function alertText(text){$('order-alert').textContent=text;$('order-alert').hidden=!text;window.scrollTo({top:0,behavior:'smooth'})}
function setDate(days){
 const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+days);
 const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
 $('delivery-date').value=[y,m,day].join('-');
}
function moneyValue(){
 let subtotal=0;
 for(const value of products.values())if(value.status!=='cancelled')subtotal+=value.price*value.qty;
 const percent=asNum($('discount-percent').value),fixed=asNum($('discount-amount').value);
 const discount=Math.min(subtotal,Number((subtotal*percent/100+fixed).toFixed(2))),total=Number((subtotal-discount).toFixed(2));
 const paid=asNum($('paid-value').value);
 return {subtotal,percent,fixed,discount,total,paid};
}
function updateMoney(){
 const v=moneyValue();
 $('subtotal-value').textContent=fmt(v.subtotal);
 $('discount-value').textContent=fmt(v.discount);
 $('grand-value').textContent=fmt(Math.max(0,v.total));
 $('balance-value').textContent=fmt(Math.abs(v.total-v.paid));
 $('balance-value').style.color=(v.paid>v.total||v.total<0)?'#ad3923':'';
}
const statusNames={processing:'İşlemde',waiting:'Beklemede',workshop:'Atölyede',ready:'Mağazada · Teslime Hazır',delivered:'Teslim Edildi',cancelled:'İptal'};
const statusCss={processing:'processing',waiting:'waiting',workshop:'workshop',ready:'ready',delivered:'delivered',cancelled:'cancelled'};
function newElement(tag,className,text){
 const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;
}
function pileParts(record){
 if(!record)return {pile:'',spec:''};
 return {pile:record.pile||'',spec:record.spec||''};
}
function drawSlots(){
 const target=$('category-sections');target.replaceChildren();
 for(const group of categories){
  const section=newElement('section','category-section');
  const heading=newElement('div','category-heading');
  heading.append(newElement('h3','',group.name),
    newElement('span','',[...products.keys()].filter(k=>k.startsWith(group.name+'|')).reduce((n,k)=>n+products.get(k).qty,0)+' parça'));
  section.append(heading);
  const grid=newElement('div',group.kind==='list'?'slot-list':'slot-grid');
  for(let i=0;i<group.count;i++){
   const k=key(group.name,i),record=products.get(k);
   if(!record){
    const add=newElement('button','product-slot');add.type='button';
    if(editing&&['ready','partial_ready'].includes(editing.status)){add.disabled=true;add.title='Mağazada teslime hazır siparişe yeni ürün eklenemez';}
    add.append(newElement('span','slot-add',group.kind==='list'?(i+1)+'. + Ekle':'+ Ekle'));
    add.onclick=()=>openItem(group.name,i);grid.append(add);continue;
   }
   const wrapper=newElement('div','slot-record status-'+(statusCss[record.status]||'processing'));
   const details=newElement('div','slot-record-detail');
   details.append(newElement('strong','',record.name));
   details.append(newElement('small','',record.qty+' adet · '+(record.width||'—')+' × '+(record.height||'—')+' cm'));
   if(record.pile)details.append(newElement('small','',record.pile));
   if(group.name==='FON PERDE'){const fon=parseFonConfiguration(record.spec);if(fon.kind&&fon.size)details.append(newElement('small','',fon.kind+' · '+fon.size+' cm'));}
   if(record.status==='waiting'&&record.waitingReason)details.append(newElement('small','', 'Bekleme nedeni: '+record.waitingReason));
   if(record.cancellationRequestedAt&&record.status!=='cancelled')details.append(newElement('small','', 'İptal talebi: Yönetici onayı bekleniyor.'));
   if(record.status==='cancelled')details.append(newElement('small','', 'Bu ürün iptal edildi.'));
   details.append(newElement('small','',fmt(record.price*record.qty)));
   wrapper.append(details);
   if(editing&&record.id){
    const select=newElement('select','slot-status');select.setAttribute('aria-label','Satır durumu: '+record.name);
    for(const v of ['processing','waiting','workshop','ready','delivered','cancelled']){
     const option=new Option(statusNames[v],v);
     if(v==='workshop'&&!['owner','manager'].includes(memberRole))option.disabled=true;
     if(v==='ready'||v==='delivered'||record.status==='ready'||record.status==='delivered'||record.status==='cancelled'||(v==='processing'&&(record.status!=='processing'&&record.status!=='waiting'||Boolean(editing.barcode_printed_at)))||(v==='waiting'&&(record.status!=='processing'||Boolean(editing.barcode_printed_at)))||(record.status==='waiting'&&v!=='waiting'&&v!=='processing'&&v!=='cancelled'))option.disabled=v!==record.status;
     select.add(option);
    }
    select.value=record.status||'processing';
    if(record.status==='ready'||record.status==='delivered'||record.status==='cancelled'||editing.status==='delivered'||editing.status==='cancelled'||editing.status==='voided'||(editing.status==='waiting'&&record.status!=='waiting'))select.disabled=true;
    select.onchange=async()=>{const prev=record.status,next=select.value;select.disabled=true;
      try{if(next==='cancelled'){await cancelItemInEditor(record);return;}await updateItemStatus(record,next);record.status=next;drawSlots();}
      catch(e){record.status=prev;drawSlots();alertText('Satır durumu değiştirilemedi: '+e.message);}
    };
    wrapper.append(select);
   }else{
    wrapper.append(newElement('span','status-label',quoteMode?'Teklif Kalemi':statusNames[record.status||'processing']));
   }
   const controls=newElement('div','slot-controls');
   const edit=newElement('button','slot-edit','Düzenle');edit.type='button';edit.onclick=()=>openItem(group.name,i);
   const remove=newElement('button','slot-remove','Sil');remove.type='button';remove.onclick=()=>removeItem(group.name,i);
   if(['workshop','ready','delivered','cancelled'].includes(record.status)||record.printedAt){remove.disabled=true;remove.title='Atölyeye gönderilen veya teslim alınan ürün silinemez';}
   controls.append(edit,remove);wrapper.append(controls);grid.append(wrapper);
  }
  section.append(grid);target.append(section);
 }
 updateMoney();
}
async function cancelItemInEditor(record){
 if(!editing||!record?.id)throw Error('Kaydedilmemiş ürün iptal edilemez.');
 if(record.cancellationRequestedAt)throw Error('Bu ürün için yönetici onayı bekleniyor.');
 const reason=prompt(record.name+' için iptal nedeni (en az 3 karakter):','');
 if(reason===null){drawSlots();return;}
 if(reason.trim().length<3)throw Error('İptal nedeni en az 3 karakter olmalı.');
 if(!confirm(record.name+' ürünü için iptal işlemi başlatılsın mı?')){drawSlots();return;}
 const {data,error}=await sb.rpc('erp_request_item_cancellation',{p_org:org.id,p_item:record.id,p_reason:reason.trim()});
 if(error)throw error;
 const state=typeof data==='string'?data:(data?.status||data?.result||'');
 alertText(state==='pending'?'Etiketi basılmış ürün için iptal talebi oluşturuldu. Yönetici onayı bekleniyor.':'Ürün iptal edildi. Sipariş tutarı yeniden hesaplandı.');
 window.location.reload();
}
async function updateItemStatus(record,next){
 if(!editing||!record.id)throw Error('Kaydedilmemiş ürünün durumu değiştirilemez.');
 let result,waitingReason='';
 if(next==='waiting'||record.status==='waiting'){
  let reason=null;
  if(next==='waiting'){
   reason=prompt('Ürün için bekleme nedeni (en az 3 karakter):','');
   if(reason===null)throw Error('Beklemeye alma iptal edildi');
   if(reason.trim().length<3)throw Error('Bekleme nedeni en az 3 karakter olmalı');
  }
  waitingReason=next==='waiting'?reason?.trim()||'':'';
  result=await sb.rpc('erp_set_item_waiting',{p_org:org.id,p_item:record.id,p_action:next==='waiting'?'wait':'resume',p_reason:reason?.trim()||null});
 }else result=await sb.rpc('erp_set_item_workflow_status',{p_org:org.id,p_item:record.id,p_status:next});
 if(result.error)throw result.error;
 if(next==='waiting'||record.status==='waiting')record.waitingReason=waitingReason;
 const {data,error:readError}=await sb.from('erp_orders').select('updated_at,status,waiting_reason').eq('organization_id',org.id).eq('id',editing.id).single();
 if(readError)throw readError;
 Object.assign(editing,data);
 $('order-status-display').value=data.status;
 syncOrderStatusOptions();
}
function removeItem(category,index){
 const k=key(category,index),item=products.get(k);
 if(!item)return;
 if(['workshop','ready','delivered','waiting','cancelled'].includes(item.status)||item.printedAt){alertText('Atölyeye gönderilmiş, beklemeye alınmış veya teslim edilmiş ürün siparişten silinemez.');return}
 if(item.id&&!confirm(item.name+' ürünü siparişten kaldırılacak. Değişiklik, siparişi kaydedince gerçekleşecek. Devam edilsin mi?'))return;
 products.delete(k);closeItem();drawSlots();
}
function openItem(category,index){
 if(editing&&['ready','partial_ready','voided'].includes(editing.status)&&!products.has(key(category,index))){alertText('Mağazada teslime hazır siparişe yeni ürün eklenemez.');return}
 active={category,index};
 const value=products.get(key(category,index));
 if(value?.status==='cancelled'){alertText('İptal edilmiş ürün düzenlenemez.');active=null;return}
 $('product-category-title').textContent=category+' · Kutucuk '+(index+1);
 $('product-dialog-title').textContent=value?'Satırı Düzenle':'Yeni Satır Ekle';
 $('product-form').reset();
 $('product-category').value=category;
 $('catalog-search').value='';
 $('catalog-results').hidden=true;
 $('stor-case').value='open';$('stor-chain').value='plastic';$('stor-side').value='left';$('stor-tube').value='32';$('stor-foot').value='plastic';$('stor-hem').value='1';
 $('plise-mount').value=pliseMounts[0];$('plise-case-color').value=pliseCaseColors[0];
 $('wood-ribbon').checked=false;$('wood-mechanism').value='İpli';
 $('fon-wing-type').value='';syncFonSizes();
 syncCategoryUI();
 $('product-name').value=value?.name||'';
 $('product-width').value=value?.width??'';
 $('product-height').value=value?.height??'';
 $('product-price').value=value?(value.basePrice??value.price):'';
 $('product-quantity').value=value?.qty??1;
 pileControlSelect.value=value?.pile||'';
 $('product-spec').value=category==='STOR PERDE'?stripStorOptions(value?.spec||''):category==='PLİSE PERDE'?stripPliseSystemFields(value?.spec||''):category==='AHŞAP JALUZİ'?stripWoodFields(value?.spec||''):category==='FON PERDE'?stripFonFields(value?.spec||''):value?.spec||'';
 if(category==='STOR PERDE'){
  const cfg=value?.stor||parseStorSpecs(value?.spec||'');
  $('stor-case').value=cfg.caseType;syncStorColor(cfg.caseType);
  if(cfg.color&&[...$('stor-color').options].some(x=>x.value===cfg.color))$('stor-color').value=cfg.color;
  $('stor-chain').value=cfg.chain;$('stor-side').value=cfg.side;$('stor-tube').value=cfg.tube;$('stor-foot').value=cfg.foot;$('stor-hem').value=cfg.hem??'';
 }
 if(category==='PLİSE PERDE'){
  const config=value?.plise||parsePliseConfiguration(value?.spec);
  $('plise-mount').value=config.mount;
  $('plise-case-color').value=config.caseColor;
 }
 if(category==='FON PERDE'){
  const cfg=parseFonConfiguration(value?.spec);$('fon-wing-type').value=cfg.kind;syncFonSizes(cfg.size);
 }
 if(category==='AHŞAP JALUZİ'){
  const cfg=value?.wood||parseWoodConfiguration(value?.spec);
  $('wood-ribbon').checked=cfg.ribbon;$('wood-mechanism').value=cfg.mechanism;
 }
 manualPrice=false;
 fetchCatalog().then(()=>{if(active?.category===category)showCatalog()});
 $('product-note').value=value?.note||'';
 $('product-status').value=value?.status||'processing';
 $('product-status').disabled=!value?.id||['ready','delivered'].includes(value.status)||(editing?.status==='waiting'&&value?.status!=='waiting'||['delivered','cancelled'].includes(editing?.status));
 for(const option of $('product-status').options){if(option.value==='processing'&&(value?.status!=='processing'&&value?.status!=='waiting'||Boolean(editing?.barcode_printed_at)))option.disabled=true;else if(option.value==='waiting')option.disabled=value?.status!=='processing'||Boolean(editing?.barcode_printed_at);else if(value?.status==='waiting')option.disabled=option.value!=='waiting'&&option.value!=='processing'&&option.value!=='cancelled';else option.disabled=false;}
 $('product-status-wrapper').title=value?.id?'Durum değişikliği seçildiğinde anında kaydedilir.':'Sipariş kaydedilince ürün İşlemde durumunda başlar.';
 $('delete-product').hidden=!value;
 $('delete-product').disabled=!!value&&(['workshop','ready','delivered','waiting','cancelled'].includes(value.status)||value.printedAt);
 $('product-quantity').disabled=!!value?.id;
 if(value?.id)$('product-quantity').value='1';
 $('product-status-message').textContent=value?.id?'Satır durumu seçildiğinde hemen kaydedilir. Ürün bilgileri için ayrıca Kaydet butonuna basın.':'';
 $('product-overlay').hidden=false;
 calculateItemTotal();
 $('product-name').focus();
}
function closeItem(){$('product-overlay').hidden=true;active=null}
function calculateItemTotal(){
 const base=asNum($('product-price').value),qty=asNum($('product-quantity').value);
 if(isStor()){
  const width=asNum($('product-width').value),height=asNum($('product-height').value);
  const effectiveWidth=Math.max(100,width),effectiveHeight=Math.max(200,height);
  const unit=storUnitPrice(base,width,height,storSettings());
  $('product-total').textContent=fmt(unit*qty);
  $('pile-price-hint').textContent='Fiyat: '+fmt(unit)+' × '+qty+' adet = '+fmt(unit*qty);
  $('stor-calculation').textContent='Gerçek ölçü: '+(width||'—')+' × '+(height||'—')+' cm · Fiyat hesabı: '+effectiveWidth+' × '+effectiveHeight+' cm ('+(effectiveWidth*effectiveHeight/10000).toLocaleString('tr-TR')+' m²) · Kasa / mekanizma farkları dahil: '+fmt(unit)+' / adet';
 }else if(isPlise()){
  const w=$('product-width').value,h=$('product-height').value;
  const valid=validPliseMeasure(w)&&validPliseMeasure(h);
  const roundedWidth=valid?Math.ceil(Number(w)-1e-9):0,roundedHeight=valid?Math.ceil(Number(h)-1e-9):0;
  const area=valid?Math.max(1,roundedWidth*roundedHeight/10000):0;
  const price=valid?plisePrice(base,w,h):0;
  $('product-total').textContent=valid?fmt(price*qty):'—';
  $('pile-price-hint').textContent=valid?'Gerçek ölçü: '+w+' × '+h+' cm · Fiyatlandırılan ölçü: '+roundedWidth+' × '+roundedHeight+' cm · '+area.toLocaleString('tr-TR',{maximumFractionDigits:4})+' m² (min. 1 m²) × '+fmt(base)+' × '+qty+' adet = '+fmt(price*qty):'Plise perde için en ve boyu 0,1 cm hassasiyetle girin.';
 }else if(isWood()){
  const w=$('product-width').value,h=$('product-height').value;
  const valid=validWoodMeasure(w)&&validWoodMeasure(h);
  const cw=valid?Math.ceil(Number(w)-1e-9):0,ch=valid?Math.ceil(Number(h)-1e-9):0;
  const area=valid?Math.max(1,cw*ch/10000):0;
  const unit=valid?woodPrice(base,w,h):0;
  $('product-total').textContent=valid?fmt(unit*qty):'—';
  $('pile-price-hint').textContent=valid?'Gerçek ölçü: '+w+' × '+h+' cm · Fiyat ölçüsü: '+cw+' × '+ch+' cm · '+area.toLocaleString('tr-TR',{maximumFractionDigits:4})+' m² (min. 1 m²) × '+fmt(base)+' × '+qty+' adet = '+fmt(unit*qty):'En ve boyu 0,5 cm aralıklarla girin (örn. 40,5; 41; 41,5).';
  $('wood-calculation').textContent=valid?'Üretim: '+w+' × '+h+' cm · Fiyatlandırma: '+cw+' × '+ch+' cm · '+fmt(unit)+' / adet':'Gerçek ölçüler girildiğinde fiyat otomatik hesaplanır.';
 }else if(isTul()){
  const width=asNum($('product-width').value),p=pileControlSelect.value,factor=pileFactor(p);
  const unit=width>0?tulUnitPrice(base,width,p):0;
  $('product-total').textContent=width>0?fmt(unit*qty):'—';
  $('pile-price-hint').textContent=width>0?'Hesap: '+width+' cm ÷ 100 × '+String(factor).replace('.',',')+' (pile) × '+fmt(base)+' / metre × '+qty+' adet = '+fmt(unit*qty):'Tül perde en ölçüsünü cm olarak girin; fiyat en (metre) × pile × metre fiyatıdır.';
 }else{
  const p=pileControlSelect.value,factor=pileFactor(p);
  $('product-total').textContent=fmt(priceFromBase(base,p)*qty);
  $('pile-price-hint').textContent='Hesap: '+fmt(base)+' × '+String(factor).replace('.',',')+' (pile) × '+qty+' adet = '+fmt(priceFromBase(base,p)*qty)+(p==='Özel'?' · Özel pile için temel fiyat doğrudan kullanılır.':'');
 }
}
function storeItem(e){
 e.preventDefault();
 const name=$('product-name').value.trim(),qty=Number($('product-quantity').value),basePrice=Number($('product-price').value),pile=(isStor()||isPlise()||isWood())?'':pileControlSelect.value,price=isStor()?storUnitPrice(basePrice,$('product-width').value,$('product-height').value,storSettings()):isPlise()?plisePrice(basePrice,$('product-width').value,$('product-height').value):isWood()?woodPrice(basePrice,$('product-width').value,$('product-height').value):isTul()?tulUnitPrice(basePrice,$('product-width').value,pile):priceFromBase(basePrice,pile);
 const width=$('product-width').value,height=$('product-height').value,category=$('product-category').value;
 if(name.length<2||!Number.isInteger(qty)||qty<1||qty>20||!Number.isFinite(basePrice)||basePrice<0||!Number.isFinite(price)||price<0||price>99999999){$('product-status-message').textContent='Ürün adı, fiyatı veya adedi geçersiz.';return}
 if((width!==''&&(!Number.isFinite(Number(width))||Number(width)<0))||(height!==''&&(!Number.isFinite(Number(height))||Number(height)<0))){$('product-status-message').textContent='En ve boy negatif olamaz.';return}
 if(category==='TÜL PERDE'&&(!Number.isFinite(Number(width))||Number(width)<=0)){$('product-status-message').textContent='Tül perde için en (cm) sıfırdan büyük olmalıdır.';return}
 if(category==='STOR PERDE'&&(!Number.isFinite(Number(width))||Number(width)<=0||!Number.isFinite(Number(height))||Number(height)<=0)){$('product-status-message').textContent='Stor perdede gerçek en ve boy ölçüsü sıfırdan büyük olmalı.';return}
 if(category==='PLİSE PERDE'&&(!validPliseMeasure(width)||!validPliseMeasure(height))){$('product-status-message').textContent='Plise perde en ve boy ölçüleri pozitif ve 0,1 cm hassasiyetinde olmalıdır (örn. 80,1 cm).';return}
 if(category==='AHŞAP JALUZİ'&&(!validWoodMeasure(width)||!validWoodMeasure(height))){$('product-status-message').textContent='Ahşap Jaluzi ölçülerini 0,5 cm aralıklarla girin (örn. 40,5; 41; 41,5).';return}
 if(category==='FON PERDE'&&(!$('fon-wing-type').value||!$('fon-wing-size').value)){$('product-status-message').textContent='Fon perde için kanat tipi ve kanat ölçüsünü seçin.';return}
 const oldKey=key(active.category,active.index),old=products.get(oldKey);
 if(old&&['ready','delivered'].includes(old.status)){ $('product-status-message').textContent='Teslim alınmış ürün üretim bilgilerinde değişiklik yapılamaz.';return }
 const group=categories.find(c=>c.name===category);
 if(!group){$('product-status-message').textContent='Kategori geçersiz.';return}
 let index=active.index;
 if(category!==active.category){
  index=Array.from({length:group.count},(_,i)=>i).find(i=>!products.has(key(category,i)))??-1;
  if(index<0){$('product-status-message').textContent='Seçilen kategoride boş kutucuk yok.';return}
 }
 const totalBefore=[...products.values()].reduce((n,p)=>n+p.qty,0)-(old?.qty||0);
 if(totalBefore+qty>60){$('product-status-message').textContent='Bir siparişte en fazla 60 fiziksel parça eklenebilir.';return}
 const cfg=category==='STOR PERDE'?storSettings():null;
 const plise=category==='PLİSE PERDE'?pliseConfiguration():null;
 const wood=category==='AHŞAP JALUZİ'?woodConfiguration():null;
 const spec=cfg?[storSpecs(cfg,width,height),$('product-spec').value.trim()].filter(Boolean).join('; '):plise?['Montaj: '+plise.mount,'Kasa Rengi: '+plise.caseColor,'Hesap En: '+Math.ceil(Number(width)-1e-9)+' cm','Hesap Boy: '+Math.ceil(Number(height)-1e-9)+' cm',$('product-spec').value.trim()].filter(Boolean).join('; '):wood?['Kurdela: '+(wood.ribbon?'Var':'Yok'),'Mekanizma: '+wood.mechanism,'Hesap En: '+Math.ceil(Number(width)-1e-9)+' cm','Hesap Boy: '+Math.ceil(Number(height)-1e-9)+' cm',$('product-spec').value.trim()].filter(Boolean).join('; '):category==='FON PERDE'?['Kanat Tipi: '+$('fon-wing-type').value,'Kanat Ölçüsü: '+$('fon-wing-size').value,$('product-spec').value.trim()].filter(Boolean).join('; '):$('product-spec').value.trim();
 const record={name,qty,price,basePrice,width,height,pile,spec,stor:cfg,plise,wood,note:$('product-note').value.trim(),id:old?.id||null,barcode:old?.barcode||null,status:old?.status||'processing',printedAt:old?.printedAt||null};
 products.delete(oldKey);products.set(key(category,index),record);
 closeItem();drawSlots();
}
function toggleCustomer(which){
 const existing=which==='existing';
 $('existing-customer').hidden=!existing;$('new-customer').hidden=existing;
 $('choose-existing').classList.toggle('selected',existing);
 $('choose-new').classList.toggle('selected',!existing);
 $('choose-existing').setAttribute('aria-pressed',String(existing));
 $('choose-new').setAttribute('aria-pressed',String(!existing));
 if(existing)renderCustomers();
}
function renderCustomers(){
 const text=$('customer-search').value.trim().toLocaleLowerCase('tr-TR');
 const area=$('customer-results');area.replaceChildren();
 const found=existingCustomers.filter(c=>[c.name,c.phone,c.email].some(v=>String(v||'').toLocaleLowerCase('tr-TR').includes(text)));
 for(const c of found){
  const btn=document.createElement('button');btn.type='button';btn.textContent=c.name+(c.phone?' — '+c.phone:'');
  btn.onclick=()=>{$('customer-name').value=c.name;$('customer-phone').value=c.phone||'';toggleCustomer('new');alertText('')};
  area.append(btn);
 }
 if(!found.length)area.textContent='Kayıtlı müşteri bulunamadı.';
}
function renderOrderBranches(selectedId){
 const host=$('order-branch-cards');if(!host)return;host.replaceChildren();
 const sorted=[...branches].sort((a,b)=>{const rank=x=>/GAZİOSMANPAŞA/i.test(x.name)?0:/SULTANGAZİ/i.test(x.name)?1:2;return rank(a)-rank(b)||a.name.localeCompare(b.name,'tr')});
 for(let i=0;i<sorted.length;i++){
  const b=sorted[i],selected=b.id===selectedId;
  const card=newElement('div','order-branch'+(selected?' order-branch-selected':''));
  const label=newElement('strong','order-branch-name',(i+1)+'. ŞUBE · '+b.name);card.append(label);
  if(selected)card.append(newElement('span','order-branch-tag','SATIŞ YAPILAN ŞUBE'));
  if(b.address)card.append(newElement('span','order-branch-contact',b.address));
  if(b.phone)card.append(newElement('span','order-branch-contact','Tel: '+b.phone));
  if(org?.email)card.append(newElement('span','order-branch-contact',org.email));
  host.append(card);
 }
 const social=$('order-social');if(!social)return;social.replaceChildren();
 social.append(newElement('span','','Web: perdekonagi.com'));
 const instagram=String(org?.instagram||'').trim();
 social.append(newElement('span','','Instagram: '+(instagram||'@perdekonagi')));
}
function stage(next){
 $('stage1').hidden=next!==1;$('stage2').hidden=next!==2;
 $('step-label').textContent=next===1?'1 / 2 · Müşteri Bilgileri':(quoteMode?'2 / 2 · Teklif ve Ürünler':'2 / 2 · Sipariş ve Ürünler');
 if(next===2){
  $('order-status-display').value=editing?.status==='new'?'processing':editing?.status||'processing';
  $('editor-print-a4').hidden=!editing;
  $('editor-print-label').hidden=!editing||!['owner','manager'].includes(memberRole);
  $('editor-print-label').disabled=!editing||!['processing','new'].includes(editing.status)||Boolean(editing.barcode_printed_at);
  $('editor-print-label').title=editing?.barcode_printed_at?'Bu siparişin barkodu daha önce basılmış':'';
  $('editor-whatsapp').hidden=!editing||![...products.keys()].some(k=>['STOR PERDE','PLİSE PERDE','AHŞAP JALUZİ'].some(c=>k.startsWith(c+'|')));
  syncOrderStatusOptions();
  if(quoteMode){$('editor-print-a4').hidden=true;$('editor-print-label').hidden=true;$('editor-whatsapp').hidden=true;}
  $('summary-customer').textContent=$('customer-name').value.trim();
  $('summary-phone').textContent=$('customer-phone').value.trim()||'—';
  $('summary-delivery').textContent=$('delivery-date').value?new Date($('delivery-date').value+'T12:00:00').toLocaleDateString('tr-TR'):'—';
  $('delivery-copy').value=$('delivery-date').value;
  $('type-copy').value=$('order-type').value;
  $('note-copy').value=$('order-note').value;
  const branch=branches.find(x=>x.id===$('store-select').value);
  renderOrderBranches(branch?.id);
  $('organization-heading').textContent=org?.name||'KONAK ERP';
  if(org?.logo_url&&/^https:\/\//i.test(org.logo_url)){$('company-logo-image').src=org.logo_url;$('company-logo-image').hidden=false;$('company-logo-fallback').hidden=true}
  drawSlots();
 }
 window.scrollTo({top:0,behavior:'smooth'});
}
async function start(){
 if(!sb){$('auth-warning').hidden=false;alertText('Bağlantı yüklenemedi. Sayfayı yenileyin.');return}
 const response=await sb.auth.getUser();
 user=response.error?null:response.data?.user;
 if(!user){$('auth-warning').hidden=false;return}
 $('order-user-email').textContent=user.email||'Oturum açık';
 try{
  const {data:membership,error:membershipError}=await sb.from('erp_members').select('organization_id,role').eq('user_id',user.id);
  if(membershipError)throw membershipError;
  if(!membership?.length){$('auth-warning').hidden=false;alertText('Önce Hesabım → Şirket Ayarları bölümünden işletme oluşturun.');return}
  const preferred=new URLSearchParams(location.search).get('org');
  const selected=membership.find(x=>x.organization_id===preferred)||membership[0];
  memberRole=selected.role||'staff';
  const [{data:company,error:companyErr},{data:branchData,error:branchErr},{data:orders,error:ordersErr}]=await Promise.all([
   sb.from('erp_organizations').select('id,name,phone,email,address,logo_url,instagram').eq('id',selected.organization_id).single(),
   sb.from('erp_branches').select('id,name,address,phone').eq('organization_id',selected.organization_id).order('name'),
   sb.from('erp_orders').select('customer_name,customer_phone').eq('organization_id',selected.organization_id).order('created_at',{ascending:false}).limit(500)]);
  if(companyErr||branchErr||ordersErr)throw companyErr||branchErr||ordersErr;
  org=company;branches=branchData||[];
  const [{data:poolFirst,error:poolErr},{data:poolSecond,error:poolNextErr}]=await Promise.all([
   sb.from('erp_customers').select('customer_name,customer_phone,email,normalized_phone').eq('organization_id',selected.organization_id).order('customer_name').order('id').range(0,999),
   sb.from('erp_customers').select('customer_name,customer_phone,email,normalized_phone').eq('organization_id',selected.organization_id).order('customer_name').order('id').range(1000,1999)
  ]);
  if(poolErr||poolNextErr)throw poolErr||poolNextErr;
  const seen=new Set();existingCustomers=[];
  const normalize=raw=>{let digits=String(raw||'').replace(/\D/g,'');if(digits.startsWith('90')&&digits.length===12)digits=digits.slice(2);if(digits.startsWith('0')&&digits.length===11)digits=digits.slice(1);return digits};
  for(const record of [...(poolFirst||[]),...(poolSecond||[]),...(orders||[])]){
   const name=(record.customer_name||'').trim(),phone=(record.customer_phone||'').trim(),email=(record.email||'').trim();
   if(!name)continue;
   const k=record.normalized_phone||normalize(phone)||name.toLocaleLowerCase('tr-TR')+'|'+email.toLocaleLowerCase('tr-TR');
   if(!seen.has(k)){seen.add(k);existingCustomers.push({name,phone,email})}
  }
  const selector=$('store-select');selector.replaceChildren(new Option('Şube seçiniz',''));
  branches.forEach(b=>selector.add(new Option(b.name,b.id)));
  if(branches.length===1)selector.value=branches[0].id;
  if(!branches.length){$('auth-warning').hidden=false;alertText('Şirket Ayarlarından önce şube ekleyin.');return}
  setDate(7);$('stage1').hidden=false;
  if(quoteMode){configureQuoteMode();const quoteId=new URLSearchParams(location.search).get('quote_edit');if(quoteId)await loadQuoteForEdit(quoteId,selected.organization_id);}
  const editId=quoteMode?null:new URLSearchParams(location.search).get('edit');
  if(editId){
   await loadForEdit(editId,selected.organization_id);
   if(new URLSearchParams(location.search).get('whatsapp')==='1'&&editing?.id){
    const clean=new URL(location.href);clean.searchParams.delete('whatsapp');
    history.replaceState(null,'',clean.pathname+clean.search);
    await openWhatsAppProduction();
   }
  }
 }catch(e){$('auth-warning').hidden=false;alertText('Sipariş ekranı yüklenemedi: '+e.message)}
}
function configureQuoteMode(){
 document.body.classList.add('quote-mode');
 document.querySelector('.order-topline h1').textContent='Yeni Teklif';
 document.querySelector('.order-topline p').textContent='Normal sipariş ekranındaki kutucuklarla fiyat teklifi hazırlayın.';
 document.querySelector('.back-link').textContent='‹ Teklif Siparişleri';
 document.querySelector('.back-link').href='./?view=quotes';
 document.querySelector('.form-actions a').href='./?view=quotes';
 $('submit-order').textContent='Teklifi Kaydet';
 $('continue-btn').textContent='Teklife Devam Et →';
 const field=document.createElement('div');field.className='quote-extra-fields';field.innerHTML='<div class="two"><label>Teklif Durumu<select id="quote-state"><option value="draft">Taslak</option><option value="pending">Onay Bekliyor</option></select></label><label>Teklif Geçerlilik Tarihi<input id="quote-valid" type="date"></label></div>';
 $('order-type').closest('label').after(field);$('order-type').closest('label').hidden=true;
 $('paid-value').value='0';$('paid-value').disabled=true;
 const finance=document.querySelector('.finance-box');if(finance)finance.querySelector('h3').textContent='Teklif Özeti';
 const noteLabel=document.querySelector('.notes-block label');if(noteLabel)noteLabel.firstChild.textContent='Teklif Notu';
 const noteHelp=document.querySelector('.notes-block p');if(noteHelp)noteHelp.textContent='Bu not müşteriye sunulacak teklifte gösterilebilir.';
 const firstNote=$('order-note').closest('label');if(firstNote)firstNote.firstChild.textContent='Genel Teklif Notu';
 $('order-note').placeholder='Müşteriye verilen teklif notu';
}
async function loadQuoteForEdit(id,orgId){
 if(!/^[0-9a-f-]{36}$/i.test(id)){alertText('Teklif bağlantısı geçersiz');return}
 try{
  const {data:order,error}=await sb.from('erp_quotes').select('*').eq('organization_id',orgId).eq('id',id).single();
  if(error)throw error;
  if(order.status==='approved')throw Error('Onaylanan teklif değiştirilemez.');
  quoteEditing=order;products.clear();
  const grouped=new Map();
  for(const [index,line] of (order.items||[]).entries()){
   const slot=String(line.slot_key||line.category+'|'+index).replace(/-\d+$/,'');
   const existing=grouped.get(slot);
   if(existing)existing.qty+=1;
   else grouped.set(slot,{...line,slot_key:slot,qty:1,id:null,barcode:null,status:'processing',printed_at:null,cancellation_requested_at:null,waiting_reason:null});
  }
  const lines=[...grouped.values()];
  const taken=new Set();
  for(const line of lines||[]){
   const group=categories.find(x=>x.name===line.category);
   if(!group)throw Error('Desteklenmeyen ürün kategorisi: '+line.category);
   let idx=-1;
   if(line.slot_key){
    const match=line.slot_key.match(/\|(\d+)(?:-\d+)?$/);
    if(match&&Number(match[1])<group.count&&!taken.has(key(group.name,Number(match[1]))))idx=Number(match[1]);
   }
   if(idx<0)idx=Array.from({length:group.count},(_,i)=>i).find(i=>!taken.has(key(group.name,i)))??-1;
   if(idx<0)throw Error('Bu sipariş için '+group.name+' kutucuğu yetersiz. Kaydı değiştirmeden destek alın.');
   const slotKey=key(group.name,idx);taken.add(slotKey);
   const notes=line.production_note||'';
   const spec=notes.startsWith('Özellikler: ')?notes.split('\n')[0].replace('Özellikler: ',''):'';
   const specParts=spec.match(/^Pile:\s*([^;]+)(?:;\s*(.*))?$/);
   const baseMatch=spec.match(/(?:^|;\s*)Baz Fiyat:\s*(\d+(?:\.\d+)?)/);
   const parsedPile=specParts?.[1]||'';
   const legacyBase=Number(line.unit_price)/(line.category==='TÜL PERDE'&&Number(line.width_cm)>0?(Number(line.width_cm)/100)*pileFactor(parsedPile):pileFactor(parsedPile));
   const basePrice=baseMatch?Number(baseMatch[1]):rounded(legacyBase);
   const detailedSpec=(specParts?.[2]||(!specParts?spec:''))?.replace(/(?:^|;\s*)Baz Fiyat:\s*\d+(?:\.\d+)?/,'').trim().replace(/^;\s*|;\s*$/g,'');
   products.set(slotKey,{id:line.id,barcode:line.barcode,name:line.product_name,qty:line.qty||1,price:Number(line.unit_price),width:line.width_cm??'',height:line.height_cm??'',pile:parsedPile,basePrice,spec:detailedSpec,plise:line.category==='PLİSE PERDE'?parsePliseConfiguration(detailedSpec):null,wood:line.category==='AHŞAP JALUZİ'?parseWoodConfiguration(detailedSpec):null,status:line.status||'processing',waitingReason:line.waiting_reason||'',printedAt:line.printed_at||null,cancellationRequestedAt:line.cancellation_requested_at||null,note:spec?notes.split('\n').slice(1).join('\n'):notes});
  }

  $('store-select').value=order.branch_id;
  $('customer-name').value=order.customer_name;
  $('customer-phone').value=order.customer_phone||'';
  $('delivery-date').value=order.delivery_date||'';
  $('order-note').value=order.customer_note||'';
  $('discount-percent').value=order.discount_percent??0;
  $('discount-amount').value=order.discount_amount??0;
  $('quote-state').value=order.status==='rejected'?'draft':(order.status||'draft');
  $('quote-valid').value=order.valid_until||'';
  document.querySelector('.order-topline h1').textContent='Teklif #T-'+order.quote_number+' Düzenle';
  $('submit-order').textContent='Teklifi Güncelle';
  stage(2);
 }catch(err){alertText('Teklif yüklenemedi: '+err.message)}
}

async function loadForEdit(orderId,orgId){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)){alertText('Geçersiz sipariş bağlantısı.');return}
 try{
  const {data:order,error:orderError}=await sb.from('erp_orders').select('id,organization_id,branch_id,customer_name,customer_phone,delivery_date,customer_note,paid_amount,discount_percent,discount_amount,order_type,payment_method,status,barcode_printed_at,updated_at').eq('organization_id',orgId).eq('id',orderId).single();
  if(orderError)throw orderError;
  if(['delivered','cancelled','voided'].includes(order.status))throw Error('Teslim edilmiş veya iptal edilmiş sipariş düzenlenemez.');
  const {data:lines,error:lineError}=await sb.from('erp_order_items').select('id,category,product_name,width_cm,height_cm,unit_price,production_note,barcode,slot_key,status,waiting_reason,printed_at,cancellation_requested_at,cancellation_reason').eq('organization_id',orgId).eq('order_id',orderId).order('created_at',{ascending:true});
  if(lineError)throw lineError;
  editing=order;products.clear();
  const taken=new Set();
  for(const line of lines||[]){
   const group=categories.find(x=>x.name===line.category);
   if(!group)throw Error('Desteklenmeyen ürün kategorisi: '+line.category);
   let idx=-1;
   if(line.slot_key){
    const match=line.slot_key.match(/\|(\d+)(?:-\d+)?$/);
    if(match&&Number(match[1])<group.count&&!taken.has(key(group.name,Number(match[1]))))idx=Number(match[1]);
   }
   if(idx<0)idx=Array.from({length:group.count},(_,i)=>i).find(i=>!taken.has(key(group.name,i)))??-1;
   if(idx<0)throw Error('Bu sipariş için '+group.name+' kutucuğu yetersiz. Kaydı değiştirmeden destek alın.');
   const slotKey=key(group.name,idx);taken.add(slotKey);
   const notes=line.production_note||'';
   const spec=notes.startsWith('Özellikler: ')?notes.split('\n')[0].replace('Özellikler: ',''):'';
   const specParts=spec.match(/^Pile:\s*([^;]+)(?:;\s*(.*))?$/);
   const baseMatch=spec.match(/(?:^|;\s*)Baz Fiyat:\s*(\d+(?:\.\d+)?)/);
   const parsedPile=specParts?.[1]||'';
   const legacyBase=Number(line.unit_price)/pileFactor(parsedPile);
   const basePrice=baseMatch?Number(baseMatch[1]):rounded(legacyBase);
   const detailedSpec=(specParts?.[2]||(!specParts?spec:''))?.replace(/(?:^|;\s*)Baz Fiyat:\s*\d+(?:\.\d+)?/,'').trim().replace(/^;\s*|;\s*$/g,'');
   products.set(slotKey,{id:line.id,barcode:line.barcode,name:line.product_name,qty:1,price:Number(line.unit_price),width:line.width_cm??'',height:line.height_cm??'',pile:parsedPile,basePrice,spec:detailedSpec,plise:line.category==='PLİSE PERDE'?parsePliseConfiguration(detailedSpec):null,wood:line.category==='AHŞAP JALUZİ'?parseWoodConfiguration(detailedSpec):null,status:line.status||'processing',waitingReason:line.waiting_reason||'',printedAt:line.printed_at||null,cancellationRequestedAt:line.cancellation_requested_at||null,note:spec?notes.split('\n').slice(1).join('\n'):notes});
  }
  $('store-select').value=order.branch_id;
  $('customer-name').value=order.customer_name;
  $('customer-phone').value=order.customer_phone||'';
  $('delivery-date').value=order.delivery_date||'';
  $('order-type').value=order.order_type||'new';
  $('order-note').value=order.customer_note||'';
  $('discount-percent').value=order.discount_percent??0;
  $('discount-amount').value=order.discount_amount??0;
  $('paid-value').value=order.paid_amount??0;
  $('paid-value').disabled=true;
  $('paid-value').title='Tahsilatları Siparişler > Ödeme Ekle bölümünden kaydedin.';
  $('payment-method').value=order.payment_method||'cash';
  document.querySelector('.order-topline h1').textContent='Siparişi Düzenle';
  $('submit-order').textContent='Değişiklikleri Kaydet';
  $('continue-btn').textContent='Siparişe Devam Et →';
  stage(2);
 }catch(err){
  alertText('Sipariş yüklenemedi: '+err.message);
  $('stage1').hidden=true;$('stage2').hidden=true;
 }
}
async function submit(){
 if(saving)return;
 if(editing&&['ready','partial_ready'].includes(editing.status)&&[...products.values()].some(p=>!p.id)){alertText('Mağazada teslime hazır siparişe yeni ürün eklenemez.');return}
 const count=[...products.values()].reduce((a,p)=>a+p.qty,0),v=moneyValue();
 if(!count){alertText('En az bir ürün ekleyin.');return}
 if(count>60){alertText('En fazla 60 ürün parçası eklenebilir.');return}
 if(!Number.isFinite(v.percent)||v.percent<0||v.percent>100||v.fixed<0||v.total<0||v.paid<0){alertText('İskonto ve ödemeleri kontrol edin. Ödeme toplamı aşamaz.');return}
 if(!$('delivery-copy').value||!org||!branches.some(b=>b.id===$('store-select').value)){alertText('Teslim tarihini ve şubeyi kontrol edin.');return}
 const payload=[];
 for(const [slot,p] of products){
  const category=slot.split('|')[0],spec=[p.pile&&'Pile: '+p.pile, 'Baz Fiyat: '+(p.basePrice??p.price),p.spec].filter(Boolean).join('; '),fullNote=[spec&&'Özellikler: '+spec,p.note].filter(Boolean).join('\n');
  for(let i=0;i<p.qty;i++)payload.push({id:p.id||null,slot_key:key(category,Number(slot.split('|')[1]))+(p.qty>1?'-'+i:''),category,product_name:p.name,width_cm:p.width||null,height_cm:p.height||null,unit_price:p.price,production_note:fullNote});
 }
 saving=true;$('submit-order').disabled=true;$('save-message').textContent=quoteMode?'Teklif kaydediliyor...':'Kaydediliyor...';
 try{
  const quoteParams={p_org:org.id,p_branch:$('store-select').value,p_customer:$('customer-name').value.trim(),p_phone:$('customer-phone').value.trim(),p_delivery:$('delivery-copy').value||null,p_note:$('note-copy').value.trim(),p_items:payload,p_discount_percent:v.percent,p_discount_amount:v.fixed,p_status:$('quote-state')?.value||'draft',p_valid_until:$('quote-valid')?.value||null,p_quote:quoteEditing?.id||null};
  if(quoteMode){const {error}=await sb.rpc('erp_save_quote',quoteParams);if(error)throw error;location.replace('./?view=quotes');return}
  const {data,error}=await sb.rpc(editing?'erp_update_order':'erp_create_order_v2',{
   ...(editing?{p_order:editing.id,p_expected_updated_at:editing.updated_at}:{p_org:org.id}),p_branch:$('store-select').value,p_customer:$('customer-name').value.trim(),
   p_phone:$('customer-phone').value.trim(),p_delivery:$('delivery-copy').value,
   p_note:$('note-copy').value.trim(),p_paid:v.paid,p_items:payload,
   p_order_type:$('type-copy').value,p_discount_percent:v.percent,
   p_discount_amount:v.fixed,p_payment_method:$('payment-method').value});
  if(error)throw error;
  location.replace('./?'+(editing?'updated':'created')+'='+encodeURIComponent(data));
 }catch(e){$('save-message').textContent='Kaydedilemedi: '+e.message;alertText((quoteMode?'Teklif':'Sipariş')+' kaydedilemedi: '+e.message)}
 finally{saving=false;$('submit-order').disabled=false}
}
$('customer-form').onsubmit=e=>{
 e.preventDefault();
 if(!$('customer-name').value.trim()||!$('store-select').value||!$('delivery-date').value){alertText('Şube, müşteri adı ve teslim tarihi gerekli.');return}
 alertText('');stage(2);
};
$('choose-existing').onclick=()=>toggleCustomer('existing');
$('choose-new').onclick=()=>toggleCustomer('new');
$('customer-search').oninput=renderCustomers;
document.querySelectorAll('[data-days]').forEach(b=>b.onclick=()=>setDate(Number(b.dataset.days)));
$('back-step').onclick=()=>{$('delivery-date').value=$('delivery-copy').value;$('order-type').value=$('type-copy').value;$('order-note').value=$('note-copy').value;stage(1)};
$('delivery-copy').onchange=()=>{$('delivery-date').value=$('delivery-copy').value};
$('type-copy').onchange=()=>{$('order-type').value=$('type-copy').value};
$('note-copy').oninput=()=>{$('order-note').value=$('note-copy').value};
$('product-form').onsubmit=storeItem;
$('order-status-display').onchange=async()=>{
 const select=$('order-status-display'),previous=editing?.status||'processing',next=select.value;
 if(!editing){select.value='processing';return}
 if(previous===next)return;
 if(next==='cancelled'){
  const reason=prompt('Siparişin tamamı için iptal nedeni (en az 3 karakter):','');
  if(reason===null){select.value=previous;return;}
  if(reason.trim().length<3){select.value=previous;$('order-status-help').textContent='İptal nedeni en az 3 karakter olmalı.';return;}
  if(!confirm('Siparişin tamamı iptal edilecek. Etiketi basılmış siparişlerde yönetici yetkisi gerekir. Devam edilsin mi?')){select.value=previous;return;}
  select.disabled=true;$('order-status-help').textContent='İptal işlemi kaydediliyor...';
  try{const {error}=await sb.rpc('erp_void_order',{p_org:org.id,p_order:editing.id,p_reason:reason.trim()});if(error)throw error;window.location.href='./?org='+encodeURIComponent(org.id);}
  catch(e){select.value=previous;$('order-status-help').textContent='Sipariş iptal edilemedi: '+e.message;syncOrderStatusOptions();}
  return;
 }
 if(!((previous==='processing'&&next==='waiting')||(previous==='waiting'&&next==='processing'&&!([...products.values()].some(p=>p.status==='waiting'))))){
  select.value=previous;$('order-status-help').textContent='Atölyeye geçiş barkod baskısıyla, mağaza kabulü barkod okutularak yapılır.';return;
 }
 let reason=null;
 if(next==='waiting'){
  reason=prompt('Sipariş neden Beklemede? Müşteriden beklenen bilgiyi yazın:','');
  if(reason===null||reason.trim().length<3){select.value=previous;$('order-status-help').textContent='En az 3 karakterlik bekleme nedeni zorunlu.';return}
 }
 select.disabled=true;$('order-status-help').textContent='Durum kaydediliyor...';
 try{
  const {error}=await sb.rpc('erp_set_order_waiting',{p_org:org.id,p_order_id:editing.id,p_action:next==='waiting'?'wait':'resume',p_reason:reason?.trim()||null});
  if(error)throw error;
  const {data,error:readError}=await sb.from('erp_orders').select('updated_at,status,waiting_reason').eq('organization_id',org.id).eq('id',editing.id).single();
  if(readError)throw readError;
  Object.assign(editing,data);
  $('order-status-help').textContent=next==='waiting'?'Beklemede: '+data.waiting_reason:'Sipariş İşlemde durumuna alındı.';
  drawSlots();
 }catch(e){select.value=previous;$('order-status-help').textContent='Durum değiştirilemedi: '+e.message}
 finally{select.disabled=false;syncOrderStatusOptions()}
};
function syncOrderStatusOptions(){
 const select=$('order-status-display'),current=editing?.status||'processing';
 for(const option of select.options){
  option.disabled=editing?!(option.value==='cancelled'||(current==='processing'||current==='waiting'&&![...products.values()].some(p=>p.status==='waiting'))&&(option.value==='processing'||option.value==='waiting')||option.value===current):option.value!=='processing';
 }
 select.disabled=!editing||['cancelled','voided'].includes(current);
}
$('product-status').onchange=async()=>{
 if(!active)return;
 const item=products.get(key(active.category,active.index)),select=$('product-status');
 if(!item?.id)return;
 const before=item.status,next=select.value;
 if(next==='workshop'&&!['owner','manager'].includes(memberRole)){select.value=before;$('product-status-message').textContent='Atölyeye aktarma yalnızca yöneticiler tarafından yapılabilir.';return;}
 if(next==='cancelled'){select.disabled=true;try{await cancelItemInEditor(item);}catch(e){select.value=before;$('product-status-message').textContent='İptal edilemedi: '+e.message;}finally{select.disabled=false;}return;}
 if(next==='processing'&&(before!=='processing'&&before!=='waiting'||Boolean(editing?.barcode_printed_at))){select.value=before;$('product-status-message').textContent='Atölyeye alınan ürün tekrar İşlemde durumuna geçirilemez.';return}
 select.disabled=true;$('product-status-message').textContent='Durum kaydediliyor...';
 try{
  await updateItemStatus(item,next);
  item.status=next;
  $('product-status-message').textContent='Satır durumu kaydedildi: '+statusNames[next]+'.';
  drawSlots();
 }catch(err){
  select.value=before;
  $('product-status-message').textContent='Durum değiştirilemedi: '+err.message;
 }finally{
  select.disabled=['ready','delivered'].includes(item.status)||(editing?.status==='waiting'&&item.status!=='waiting'||['delivered','cancelled'].includes(editing?.status));
 }
};
$('delete-product').onclick=()=>{if(!active)return;removeItem(active.category,active.index)};
$('product-shade').onclick=$('close-product').onclick=closeItem;
['product-price','product-quantity'].forEach(id=>$(id).oninput=calculateItemTotal);
 ['product-width','product-height'].forEach(id=>$(id).oninput=calculateItemTotal);
 ['stor-chain','stor-side','stor-tube','stor-foot','stor-color','stor-hem'].forEach(id=>$(id).onchange=calculateItemTotal);
 $('stor-case').onchange=()=>{syncStorColor($('stor-case').value);calculateItemTotal()};
 $('fon-wing-type').onchange=()=>syncFonSizes();
 $('product-category').onchange=()=>{syncCategoryUI();$('fon-wing-type').value='';syncFonSizes();$('catalog-search').value='';$('catalog-results').hidden=true;showCatalog();calculateItemTotal()};
 $('catalog-search').oninput=()=>{showCatalog()};
 $('catalog-search').onfocus=showCatalog;
pileControlSelect.onchange=calculateItemTotal;
['discount-percent','discount-amount','paid-value'].forEach(id=>$(id).oninput=updateMoney);
$('submit-order').onclick=submit;
function openEditorPrint(type){
 if(!editing||!org)return;
 const url='./print.html?type='+encodeURIComponent(type)+'&org='+encodeURIComponent(org.id)+'&id='+encodeURIComponent(editing.id);
 const win=window.open(url,'_blank','noopener');
 if(!win)location.href=url;
}

const whatsappCategories=new Set(['STOR PERDE','PLİSE PERDE','AHŞAP JALUZİ']);
let whatsappInvite=null;
function whatsappClose(){
 $('whatsapp-overlay').hidden=true;
}
function whatsappCleanNote(text){
 return String(text||'').replace(/(?:^|;\s*)Baz Fiyat:\s*[^;\n]*/gi,'').replace(/(?:^|;\s*)Hesap (?:En|Boy):\s*[^;\n]*/gi,'').replace(/^Özellikler:\s*/i,'').replace(/^[\s;]+|[\s;]+$/g,'').trim();
}
async function openWhatsAppProduction(){
 if(!editing?.id||!org?.id)return;
 const notice=$('whatsapp-result');notice.textContent='Kayıtlı sipariş hazırlanıyor...';
 $('whatsapp-overlay').hidden=false;
 $('whatsapp-message').value='';
 $('whatsapp-confirm').disabled=true;
 $('whatsapp-group').disabled=true;
 try{
  const [{data:o,error:oe},{data:lines,error:le},{data:config,error:ce},{data:dispatch,error:de}]=await Promise.all([
   sb.from('erp_orders').select('id,order_number,customer_name,customer_phone,delivery_date,customer_note,branch_id,status').eq('organization_id',org.id).eq('id',editing.id).single(),
   sb.from('erp_order_items').select('category,product_name,width_cm,height_cm,quantity,production_note,status').eq('organization_id',org.id).eq('order_id',editing.id).order('created_at'),
   sb.from('erp_whatsapp_groups').select('invite_url').eq('organization_id',org.id).maybeSingle(),
   sb.from('erp_whatsapp_dispatches').select('confirmed_at').eq('organization_id',org.id).eq('order_id',editing.id).maybeSingle()
  ]);
  if(oe||le||ce||de)throw oe||le||ce||de;
  if(o.status==='cancelled')throw Error('İptal edilen sipariş gönderilemez.');
  const filtered=(lines||[]).filter(x=>whatsappCategories.has(x.category)&&x.status!=='cancelled');
  if(!filtered.length)throw Error('Stor, Plise veya Ahşap Jaluzi ürünü bulunamadı.');
  const branch=branches.find(b=>b.id===o.branch_id);
  const when=o.delivery_date?new Date(o.delivery_date+'T12:00:00').toLocaleDateString('tr-TR'):'—';
  const message=[
    '🏭 '+org.name.toLocaleUpperCase('tr-TR')+' · ÜRETİM SİPARİŞİ',
    'Sipariş: #'+o.order_number,
    'Şube: '+(branch?.name||'—'),
    'Müşteri: '+o.customer_name,
    ...(o.customer_phone?['Telefon: '+o.customer_phone]:[]),
    'Teslim Tarihi: '+when,
    ''
  ];
  filtered.forEach((line,i)=>{
   message.push('■ '+(i+1)+'. '+line.category);
   message.push('Ürün: '+line.product_name);
   message.push('Ölçü: '+(line.width_cm??'—')+' × '+(line.height_cm??'—')+' cm');
   message.push('Adet: '+(line.quantity||1));
   if(line.production_note){
    const details=whatsappCleanNote(line.production_note);
    if(details)message.push('Üretim Bilgisi: '+details);
   }
   message.push('');
  });
  if(o.customer_note)message.push('GENEL SİPARİŞ NOTU: '+o.customer_note);
  message.push('KONAK ERP · Üretim için iletilmiştir.');
  $('whatsapp-message').value=message.join('\n');
  whatsappInvite=config?.invite_url||null;
  $('whatsapp-group').disabled=!whatsappInvite;
  $('whatsapp-confirm').disabled=false;
  notice.textContent=dispatch?.confirmed_at
    ?'Daha önce gönderildi olarak işaretlendi: '+new Date(dispatch.confirmed_at).toLocaleString('tr-TR')+'. Tekrar paylaşabilirsiniz.'
    :'Mesaj hazır. WhatsApp grubuna gönderdikten sonra onay verin.';
 }catch(e){
  notice.textContent='Mesaj hazırlanamadı: '+e.message;
  whatsappInvite=null;
 }
}
$('editor-whatsapp').onclick=openWhatsAppProduction;
$('whatsapp-close').onclick=whatsappClose;
$('whatsapp-overlay').addEventListener('click',e=>{if(e.target===$('whatsapp-overlay'))whatsappClose()});
$('whatsapp-copy').onclick=async()=>{
 const text=$('whatsapp-message').value;if(!text)return;
 try{await navigator.clipboard.writeText(text);$('whatsapp-result').textContent='Mesaj kopyalandı. Grup sohbetine yapıştırabilirsiniz.'}
 catch(e){$('whatsapp-message').focus();$('whatsapp-message').select();$('whatsapp-result').textContent='Metni seçtim. Ctrl+C ile kopyalayın.'}
};
$('whatsapp-group').onclick=()=>{
 if(whatsappInvite)window.open(whatsappInvite,'_blank','noopener,noreferrer');
};
$('whatsapp-share').onclick=async()=>{
 const message=$('whatsapp-message').value.trim();if(!message)return;
 try{
  if(navigator.share){
   await navigator.share({text:message,title:'KONAK ERP · Üretim Siparişi'});
   $('whatsapp-result').textContent='Paylaşım açıldı. Mesajın gruba gönderildiğini kontrol edip ardından onaylayın.';
  }else{
   window.open('https://api.whatsapp.com/send?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');
   $('whatsapp-result').textContent='WhatsApp açıldı. Hedef grubu seçip mesajı gönderin. Davet bağlantısı otomatik mesaj göndermez.';
  }
 }catch(e){
  if(e.name!=='AbortError')$('whatsapp-result').textContent='Paylaşım açılamadı. Mesajı Kopyala ve Grubu Aç seçeneklerini kullanabilirsiniz.';
 }
};
$('whatsapp-confirm').onclick=async()=>{
 if(!$('whatsapp-message').value.trim()||!editing?.id)return;
 if(!confirm('WhatsApp sipariş hattı grubuna mesajı gerçekten gönderdiniz mi? Bu işlem kullanıcı hesabınıza kaydedilecek.'))return;
 $('whatsapp-confirm').disabled=true;
 const {error}=await sb.rpc('erp_confirm_whatsapp_dispatch',{p_org:org.id,p_order:editing.id});
 if(error){$('whatsapp-result').textContent='Gönderim onayı kaydedilemedi: '+error.message;$('whatsapp-confirm').disabled=false;return}
 $('whatsapp-result').textContent='Gönderim onayı kaydedildi. Sipariş durumu değiştirilmedi.';
 whatsappClose();
 alertText('Üretim siparişinin WhatsApp grubuna gönderildiği personel onayıyla kaydedildi. Sipariş durumu değişmedi.');
};

$('editor-print-a4').onclick=()=>openEditorPrint('a4');
$('editor-print-label').onclick=()=>{if(!['owner','manager'].includes(memberRole)){alert('Etiket yazdırma yalnızca yöneticiler tarafından yapılabilir.');return;}openEditorPrint('label')};
$('order-logout').onclick=async()=>{await sb.auth.signOut();location.href='./'};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('product-overlay').hidden)closeItem()});
start();
})();