(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co',KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const sb=window.supabase?.createClient(API,KEY),$=id=>document.getElementById(id);
let orgId=null,order=null,eligible=[],busy=false;
const SUPPORTED=/STOR|ZEBRA|PLİSE|JALUZİ/i;
const message=s=>$('message').textContent=s||'';
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
async function init(){
 if(!sb){message('Bağlantı yüklenemedi. Sayfayı yenileyin.');return}
 const {data:{user},error}=await sb.auth.getUser();
 if(error||!user){message('Önce KONAK ERP hesabınızla giriş yapın.');return}
 const {data:members,error:e}=await sb.from('erp_members').select('organization_id').eq('user_id',user.id);
 if(e||!members?.length){message('Bu işletmeye erişim yetkiniz bulunmuyor.');return}
 const requested=new URLSearchParams(location.search).get('org');
 orgId=members.find(m=>m.organization_id===requested)?.organization_id||members[0].organization_id;
}
function updateCount(){
 const selected=eligible.filter(i=>i.checkbox.checked).length;
 $('selected-count').textContent=selected+' ürün seçildi';$('accept').disabled=!selected||busy;
}
async function search(event){
 event.preventDefault();if(busy)return;
 const raw=$('order-number').value.trim();
 if(!/^[0-9]{1,12}$/.test(raw)){message('Geçerli bir sipariş numarası girin.');return}
 if(!orgId){message('İşletme bilgisi yüklenemedi. Girişinizi kontrol edin.');return}
 $('results').hidden=true;order=null;eligible=[];message('Sipariş aranıyor...');
 const {data:found,error:e}=await sb.rpc('erp_find_receivable_order_by_number',{p_org:orgId,p_order_number:Number(raw)});
 if(e){message('Arama yapılamadı: '+e.message);return}
 if(!found){message('Bu numarada sipariş bulunamadı.');return}
 const items=found.items||[];
 order=found;
 $('title').textContent='Sipariş #'+found.order_number;
 const summary=$('summary');summary.replaceChildren();
 [['Müşteri',found.customer_name],['Durum',({workshop:'Atölyede',partial_ready:'Kısmi Hazır',ready:'Teslime Hazır',processing:'İşlemde'})[found.status]||found.status]].forEach(([k,v])=>{const d=el('div');d.append(el('span','',k),el('strong','',v));summary.append(d)});
 const host=$('items');host.replaceChildren();
 const filtered=(items||[]).filter(i=>SUPPORTED.test(i.category||''));
 eligible=[];
 for(const item of filtered){
  const isReady=item.status==='ready'||item.status==='delivered';
  const ok=item.status==='workshop'&&(item.printed_at||found.barcode_printed_at);
  const row=el('label','item'),input=document.createElement('input');input.type='checkbox';input.disabled=!ok;input.addEventListener('change',updateCount);
  const detail=el('div');detail.append(el('strong','',item.category+' – '+item.product_name),el('small','',Number(item.quantity||1)+' adet · '+(item.width_cm??'—')+' × '+(item.height_cm??'—')+' cm · '+(isReady?'Zaten mağazada':ok?'Atölyede – Kabul edilebilir':item.status==='workshop'?'Barkod basılmamış':'Durum: '+item.status)));
  row.append(input,detail);host.append(row);
  if(ok)eligible.push({...item,checkbox:input});
 }
 if(!filtered.length)host.append(el('p','muted','Bu siparişte Stor, Zebra, Plise veya Jaluzi ürünü bulunmuyor.'));
 else if(!eligible.length)host.append(el('p','muted','Mağazaya kabul edilebilecek atölye ürünü bulunmuyor.'));
 $('results').hidden=false;updateCount();message('Sipariş yüklendi. Yalnızca gerçekten gelen ürünleri seçin.');
}
async function receive(){
 if(busy||!order)return;
 const chosen=eligible.filter(i=>i.checkbox.checked);
 if(!chosen.length)return;
 if(!confirm('Sipariş #'+order.order_number+' içindeki '+chosen.length+' ürün mağazaya teslim alındı olarak kaydedilecek. Onaylıyor musunuz?'))return;
 busy=true;$('accept').disabled=true;message('Mağaza kabul işlemi kaydediliyor...');
 try{
  const {data,error}=await sb.rpc('erp_receive_order_items_by_number',{p_org:orgId,p_order_number:Number(order.order_number),p_item_ids:chosen.map(i=>i.id)});
  if(error)throw error;
  busy=false;
  await search({preventDefault(){}});
  message(chosen.length+' ürün mağazaya kabul edildi. Sipariş durumu: '+(data.status==='ready'?'Teslime Hazır':data.status==='partial_ready'?'Kısmi Hazır':data.status)+'.');
 }catch(e){message('Kabul işlemi yapılamadı: '+e.message)}
 finally{busy=false;updateCount()}
}
$('lookup').addEventListener('submit',search);
$('accept').addEventListener('click',receive);
$('select-all').addEventListener('click',()=>{for(const i of eligible)i.checkbox.checked=true;updateCount()});
init();
})();