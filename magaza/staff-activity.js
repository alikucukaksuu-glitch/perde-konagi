(()=>{'use strict';
const API='https://rwylhxrtggsicieuyjrm.supabase.co',KEY='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA',sb=window.supabase?.createClient(API,KEY),$=id=>document.getElementById(id);
const labels={order_number:'Sipariş No',quote_number:'Teklif No',customer_name:'Müşteri',status:'Durum',total_amount:'Toplam Tutar',paid_amount:'Ödenen',subtotal_amount:'Ara Toplam',discount_percent:'İskonto %',discount_amount:'İskonto Tutarı',payment_method:'Ödeme Yöntemi',method:'Ödeme Yöntemi',amount:'Tutar',direction:'Yön',description:'Açıklama',counterparty:'İlgili Kişi',product_name:'Ürün',category:'Kategori',unit_price:'Birim Fiyat',quantity:'Adet',width_cm:'En',height_cm:'Boy',order_id:'Sipariş Referansı',branch_id:'Şube Referansı',printed_at:'Etiket Yazdırma',arrived_at:'Mağazaya Geliş',barcode_printed_at:'Barkod Baskısı',rejection_reason:'Ret Nedeni',cancellation_reason:'İptal Nedeni',appointment_type:'Randevu Türü',appointment_date:'Randevu Tarihi',appointment_time:'Randevu Saati',active:'Aktif',deleted_at:'Arşivlenme',menu_key:'Menü',can_view:'Görme Yetkisi',can_edit:'Düzenleme Yetkisi',name:'Ürün Adı'};
let org='',all=[],offset=0,loading=false,exhausted=false;
const dateText=v=>new Date(v).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'});
const csvValue=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
const fmt=(v,k)=>{if(v==null)return '—';if(/amount|price/.test(k)&&Number.isFinite(Number(v)))return new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(v));return typeof v==='object'?JSON.stringify(v):String(v)};
const make=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text==null?'—':String(text);if(cls)el.className=cls;return el};
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error)}
function filters(){const f=$('from').value,t=$('to').value,s=$('search').value.trim().toLocaleLowerCase('tr-TR');return all.filter(row=>(!$('branch').value||row.branch_id===$('branch').value)&&(!$('actor').value||row.actor_id===$('actor').value)&&(!$('kind').value||row.source_table===$('kind'))&&(!f||row.created_at.slice(0,10)>=f)&&(!t||row.created_at.slice(0,10)<=t)&&(!s||[row.title,row.actor_name,row.branch_name,JSON.stringify(row.details)].join(' ').toLocaleLowerCase('tr-TR').includes(s)))}
function selectItems(id,list,getValue,getLabel){const el=$(id),prev=el.value;el.replaceChildren(new Option(id==='branch'?'Tüm şubeler':'Tüm personel',''));for(const row of list)el.append(new Option(getLabel(row),getValue(row)));el.value=[...el.options].some(x=>x.value===prev)?prev:''}
function render(){
 const branches=[...new Map(all.filter(x=>x.branch_id).map(x=>[x.branch_id,x])).values()];
 const actors=[...new Map(all.filter(x=>x.actor_id).map(x=>[x.actor_id,x])).values()];
 selectItems('branch',branches,x=>x.branch_id,x=>x.branch_name);selectItems('actor',actors,x=>x.actor_id,x=>x.actor_name);
 const rows=filters();$('rows').replaceChildren();
 for(const row of rows){
  const tr=document.createElement('tr');tr.append(make('td',dateText(row.created_at)),make('td',row.actor_name),make('td',row.branch_name));
  const tag=make('span',row.title,'tag '+(row.action==='delete'?'delete':row.action==='update'?'update':'')),td=document.createElement('td');td.append(tag);tr.append(td);
  const details=document.createElement('td'),body=make('div','','changes');
  for(const [key,val] of Object.entries(row.details||{})){
   if(key==='order_id')continue;
   const before=val&&typeof val==='object'&&'old' in val?fmt(val.old,key):null;
   const after=val&&typeof val==='object'&&'new' in val?fmt(val.new,key):null;
   const info=before!=null&&after!=null?before+' → '+after:before!=null?'Önce: '+before:after!=null?after:fmt(val,key);
   body.append(make('div',(labels[key]||key)+': '+info));
  }
  details.append(body);tr.append(details);$('rows').append(tr);
 }
 $('total').textContent=rows.length;$('kinds').textContent=new Set(rows.map(x=>x.source_table)).size;$('actors').textContent=new Set(rows.map(x=>x.actor_id).filter(Boolean)).size;
 if(!rows.length)$('rows').append(make('tr',''));if(!rows.length){const td=make('td','Bu filtrelerle eşleşen hareket bulunamadı.','muted');td.colSpan=5;$('rows').lastChild.append(td)}
 $('more').disabled=loading||exhausted;
}
async function load(more=false){
 if(loading)return;loading=true;$('more').disabled=true;
 if(!more){all=[];offset=0;exhausted=false}
 status('Hareket kayıtları yükleniyor…');
 const {data,error}=await sb.rpc('erp_staff_activity_list',{p_org:org,p_limit:300,p_offset:offset});
 loading=false;if(error){status('Kayıtlar açılamadı: '+error.message,true);render();return}
 const chunk=data||[];all=all.concat(chunk);offset+=chunk.length;exhausted=chunk.length<300;
 status(all.length+' kayıt yüklendi'+(exhausted?'':'. Daha eski kayıtları getirebilirsiniz.'));
 render();
}
async function init(){
 if(!sb){status('Bağlantı kurulamadı.',true);return}
 const {data:{session},error}=await sb.auth.getSession();if(error||!session){status('Giriş yapmanız gerekiyor.',true);return}
 const {data:members,error:memberError}=await sb.from('erp_members').select('organization_id,role').eq('user_id',session.user.id);
 if(memberError){status('Yetkiler okunamadı.',true);return}
 const requested=new URLSearchParams(location.search).get('org');
 const membership=(members||[]).find(x=>x.organization_id===requested)||(members||[])[0];
 if(!membership||!['owner','manager'].includes(membership.role)){status('Bu bölüm yalnızca yönetici hesabına açıktır.',true);$('refresh').disabled=true;return}
 org=membership.organization_id;
 await load();
}
for(const id of ['branch','actor','kind','from','to','search'])$(id).addEventListener('input',render);
$('refresh').addEventListener('click',()=>load());
$('more').addEventListener('click',()=>load(true));
$('export').addEventListener('click',()=>{const records=filters(),matrix=[['Tarih','Personel','Şube','İşlem','Detaylar'],...records.map(x=>[dateText(x.created_at),x.actor_name,x.branch_name,x.title,JSON.stringify(x.details)])];const blob=new Blob(['\ufeff'+matrix.map(r=>r.map(csvValue).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='konak-erp-personel-hareketleri.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),500)});
init();
})();