(()=>{'use strict';
const sb=window.supabase?.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const q=new URLSearchParams(location.search);let org=q.get('org'),item=q.get('item'),code=q.get('code');const token=q.get('t'),$=s=>document.getElementById(s);
let order=null,record=null,ready=false;
function message(txt,type=''){const n=$('message');n.textContent=txt;n.className=type}
function visible(){ $('details').hidden=false; $('login').hidden=true}
async function init(){
 if(!sb||(!token&&(!org||!item||!code))){message('QR kod eksik veya geçersiz.','error');return}
 const {data:u,error:authError}=await sb.auth.getUser();
 if(authError||!u?.user){message('Personel girişi gerekli.','error');$('login').hidden=false;return}
 if(token){
  if(!/^[0-9a-f]{24}$/i.test(token)){message('QR kod biçimi geçersiz.','error');return}
  const {data:result,error:tokenError}=await sb.rpc('erp_resolve_item_receive_token',{p_token:token});
  if(tokenError||!result?.length){message('QR kodu geçersiz veya işletme erişiminiz yok.','error');return}
  org=result[0].organization_id;item=result[0].item_id;code=result[0].barcode;
 }
 const {data:m,error:memErr}=await sb.from('erp_members').select('organization_id').eq('organization_id',org).eq('user_id',u.user.id).maybeSingle();
 if(memErr||!m){message('Bu işletmenin ürününü kabul etmeye yetkiniz yok.','error');return}
 const {data:i,error:e1}=await sb.from('erp_order_items').select('id,order_id,organization_id,category,product_name,width_cm,height_cm,status,barcode').eq('id',item).eq('organization_id',org).single();
 if(e1||!i||i.barcode!==code){message('Ürün bulunamadı veya QR bilgisi geçersiz.','error');return}
 record=i;
 const [{data:o,error:e2},{data:orgData,error:e3}]=await Promise.all([
  sb.from('erp_orders').select('id,organization_id,order_number,branch_id,customer_name,status,barcode_printed_at').eq('id',i.order_id).eq('organization_id',org).single(),
  sb.from('erp_organizations').select('name').eq('id',org).single()
 ]);
 if(e2||e3){message('Sipariş bilgileri alınamadı.','error');return}
 order=o;
 const {data:branch}=await sb.from('erp_branches').select('name').eq('id',o.branch_id).eq('organization_id',org).single();
 $('business').textContent=orgData.name;
 $('branch').textContent=branch?.name||'—';
 $('order').textContent='#'+o.order_number;
 $('customer').textContent=o.customer_name;
 $('product').textContent=i.category+' · '+i.product_name;
 $('size').textContent=(i.width_cm??'—')+' × '+(i.height_cm??'—')+' cm';
 $('status').textContent=({processing:'İşlemde',workshop:'Atölyede',ready:'Mağazada – Teslime Hazır',delivered:'Teslim Edildi',cancelled:'İptal'})[i.status]||i.status;
 visible();
 if(i.status==='ready'){message('Bu ürün daha önce mağazaya kabul edilmiş.','success');return}
 if(i.status!=='workshop'||!o.barcode_printed_at){message('Ürün henüz Atölyede aşamasında değil. Önce üretim barkod baskısını onaylayın.','error');return}
 ready=true;$('accept').disabled=false;message('Ürün kontrol edildi. Mağazada teslim aldıysanız onaylayın.');
}
$('accept').onclick=async()=>{
 if(!ready||!record)return;
 if(!confirm('Bu ürünü mağazada fiziksel olarak teslim aldığınızı onaylıyor musunuz?'))return;
 $('accept').disabled=true;message('Teslim alınıyor...');
 try{
  const {data,error}=await sb.rpc('erp_receive_qr_item',{p_org:org,p_item:item,p_code:code});
  if(error)throw error;
  ready=false;
  $('status').textContent='Mağazada – Teslime Hazır';
  message(data==='ready'?'Ürün teslim alındı. Siparişteki tüm ürünler mağazada hazır.':'Ürün teslim alındı. Diğer ürünler bekleniyor; sipariş Kısmi Hazır.','success');
 }catch(e){message('Kabul işlemi başarısız: '+e.message,'error');$('accept').disabled=false}
};
init().catch(e=>message('Beklenmeyen hata: '+e.message,'error'));
})();