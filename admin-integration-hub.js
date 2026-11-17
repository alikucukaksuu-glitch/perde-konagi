(()=>{'use strict';
const view=document.getElementById('view-settings'),grid=view?.querySelector('.pk-settings-grid');if(!view||!grid)return;
const oldHeading=view.querySelector('.section-heading');if(oldHeading){oldHeading.classList.add('pk-hub-old-heading');}
const hub=document.createElement('div');hub.className='pk-hub';
hub.innerHTML=`<div class="pk-hub-heading"><span class="pk-hub-gear" aria-hidden="true">⚙</span><div><h2>Ayarlar</h2><p>Ödeme, fatura ve kargo entegrasyonlarınızı buradan yönetin.</p></div></div>
<div class="pk-hub-cards">
<article class="pk-hub-card pk-hub-qnb"><header class="pk-hub-card-top"><div class="pk-hub-big-icon">▤</div><div class="pk-hub-card-heading"><h3>QNB Pay ve Kasa</h3><p>Online ödeme, sanal POS ve kasa işlemleri</p></div><div class="pk-hub-symbol">✳ QNB<br>PAY</div></header><div class="pk-hub-card-content"><div class="pk-hub-status"><span>◷ Bağlantı Bekleniyor</span><small>Canlı ödeme kapalı</small></div>
<button class="pk-hub-link" data-hub-open="qnb"><span class="pk-hub-list-icon">◇</span><span><b>QNB Pay Entegrasyon Bilgileri</b><small>Merchant ID, API anahtarı, güvenlik ayarları</small></span><i>›</i></button>
<button class="pk-hub-link" data-hub-open="qnb"><span class="pk-hub-list-icon">▤</span><span><b>Ödeme Ayarları</b><small>3D Secure, taksit, işlem limiti, para birimi</small></span><i>›</i></button>
<button class="pk-hub-link" data-hub-open="qnb"><span class="pk-hub-list-icon">▦</span><span><b>Kasa ve Tahsilat Ayarları</b><small>Mağaza kasa işlemleri ve ödeme yöntemleri</small></span><i>›</i></button>
<button class="pk-hub-link" data-hub-open="qnb"><span class="pk-hub-list-icon">♧</span><span><b>Ödeme Bildirimleri</b><small>Başarılı/başarısız ödeme, e-posta ve SMS</small></span><i>›</i></button>
<button class="pk-hub-link" data-hub-open="qnb"><span class="pk-hub-list-icon">↶</span><span><b>İade ve İptal Ayarları</b><small>Ödeme iadesi, iptal politikası ve süreler</small></span><i>›</i></button>
<button class="pk-hub-cta" data-hub-open="qnb">⚙ &nbsp; QNB Pay ve Kasa Ayarlarını Yönet <span>›</span></button></div></article>
<article class="pk-hub-card pk-hub-invoice"><header class="pk-hub-card-top"><div class="pk-hub-big-icon">▤</div><div class="pk-hub-card-heading"><h3>Fatura Bölümü</h3><p>e-Fatura / e-Arşiv ve faturalama ayarları</p></div><div class="pk-hub-symbol">₺<br>▤</div></header><div class="pk-hub-card-content"><div class="pk-hub-status"><span>◷ Kurulum Bekleniyor</span><small>Otomatik fatura kapalı</small></div>
<button class="pk-hub-link" data-hub-open="invoice"><span class="pk-hub-list-icon">▱</span><span><b>Fatura Entegrasyon Ayarları</b><small>Entegratör seçimi, API bilgileri ve bağlantı</small></span><i>›</i></button>
<button class="pk-hub-link" data-hub-open="invoice"><span class="pk-hub-list-icon">▤</span><span><b>Fatura Türleri</b><small>e-Fatura, e-Arşiv, e-İrsaliye ayarları</small></span><i>›</i></button>
<button class="pk-hub-link" data-hub-open="invoice"><span class="pk-hub-list-icon">▥</span><span><b>Firma ve Vergi Bilgileri</b><small>Ünvan, VKN/TCKN, adres ve iletişim bilgileri</small></span><i>›</i></button>
<button class="pk-hub-link" data-hub-open="invoice"><span class="pk-hub-list-icon">⚙</span><span><b>Fatura Kuralları</b><small>Otomatik kesim, KDV, istisna ve dipnotlar</small></span><i>›</i></button>
<button class="pk-hub-link" data-hub-open="invoice"><span class="pk-hub-list-icon">▣</span><span><b>Fatura Şablonları</b><small>Logo, metin ve tasarım ayarları</small></span><i>›</i></button>
<button class="pk-hub-cta" data-hub-open="invoice">⚙ &nbsp; Fatura Ayarlarını Yönet <span>›</span></button></div></article>
<article class="pk-hub-card pk-hub-shipping"><header class="pk-hub-card-top"><div class="pk-hub-big-icon">▱</div><div class="pk-hub-card-heading"><h3>Kargo Bölümü</h3><p>Kargo firması, gönderi ve takip ayarları</p></div><div class="pk-hub-symbol pk-hub-carrier">yurtiçi<span>kargo</span></div></header><div class="pk-hub-card-content"><div class="pk-hub-status"><span>◷ Bağlantı Bekleniyor</span><small>Otomatik gönderi kapalı</small></div>
<button class="pk-hub-link" data-hub-open="shipping"><span class="pk-hub-list-icon">▱</span><span><b>Kargo Firması Ayarları</b><small>Yurtiçi Kargo (öncelikli) ve diğer firmalar</small></span><i>›</i></button>
<button class="pk-hub-link" data-hub-open="shipping"><span class="pk-hub-list-icon">▦</span><span><b>Kargo Ücretleri ve Politikası</b><small>Ücretsiz kargo limiti, sabit ücret ve bölge ayarları</small></span><i>›</i></button>
<button class="pk-hub-link" data-hub-open="shipping"><span class="pk-hub-list-icon">⬡</span><span><b>Desi ve Paketleme Kuralları</b><small>Ürün bazlı desi hesaplama ve paket ölçüleri</small></span><i>›</i></button>
<button class="pk-hub-link" data-hub-open="shipping"><span class="pk-hub-list-icon">▥</span><span><b>Kargo Etiketi ve Gönderi</b><small>Otomatik gönderi oluşturma ve etiket yazdırma</small></span><i>›</i></button>
<button class="pk-hub-link" data-hub-open="shipping"><span class="pk-hub-list-icon">♧</span><span><b>Kargo Takip ve Bildirimler</b><small>Takip numarası, teslimat durumu ve müşteri bildirimi</small></span><i>›</i></button>
<button class="pk-hub-cta" data-hub-open="shipping">⚙ &nbsp; Kargo Ayarlarını Yönet <span>›</span></button></div></article>
</div><div class="pk-hub-tip"><strong>ⓘ &nbsp; Bilgi</strong><span>Entegrasyonlar API bilgileri girilmeden canlıya alınmaz. Bağlantı testleri tamamlanmadan otomatik ödeme, fatura veya kargo gönderimi başlatılmaz.</span></div>
<button class="pk-hub-general-button" type="button" id="pk-hub-general-open">⚙ &nbsp; Genel Site Ayarları ve Bakım Modu</button><div class="pk-hub-detail" id="pk-hub-detail" hidden><div class="pk-hub-detail-heading"><button type="button" id="pk-hub-back">‹ &nbsp; Entegrasyon Ayarları</button><h3 id="pk-hub-detail-title"></h3><p id="pk-hub-detail-desc"></p></div><div id="pk-hub-detail-content"></div></div>`;
view.insertBefore(hub,grid);
grid.classList.add('pk-hub-legacy');
const detail=hub.querySelector('#pk-hub-detail'),target=hub.querySelector('#pk-hub-detail-content');
const nodes=Array.from(grid.children);
const sections={
 qnb:[
 ['QNB Pay Entegrasyon Bilgileri','Bağlantı kontrolü ve güvenli API yapılandırması','qnb-check'],
 ['Ödeme Ayarları','3D Secure, para birimi ve işlem kuralları','qnb-payment'],
 ['Kasa ve Tahsilat Ayarları','Ödeme hareketleri ve tahsilat geçmişi','qnb-transactions'],
 ['Ödeme Bildirimleri','Ödeme durumlarına bağlı bildirim hazırlığı','qnb-notifications'],
 ['İade ve İptal Ayarları','İade hareketleri ve iptal süreci','qnb-refunds']],
 invoice:[
 ['Fatura Entegrasyon Ayarları','e-Fatura / e-Arşiv sağlayıcısı seçimi','invoice-provider'],
 ['Fatura Türleri','e-Fatura alıcı doğrulaması ve e-Arşiv ayrımı','invoice-kinds'],
 ['Firma ve Vergi Bilgileri','Ünvan, vergi dairesi, VKN/TCKN ve adres','invoice-company'],
 ['Fatura Kuralları','KDV, otomatik kesim ve işlem hazırlığı','invoice-rules'],
 ['Fatura Şablonları','Belge görünümü ve şablon hazırlığı','invoice-templates']],
 shipping:[
 ['Kargo Firması Ayarları','Yurtiçi Kargo ve alternatif taşıyıcılar','shipping-provider'],
 ['Kargo Ücretleri ve Politikası','2.000 TL ücretsiz kargo sınırı ve altı ücret','shipping-pricing'],
 ['Desi ve Paketleme Kuralları','Kutu ölçüleri ve desi hesaplama','shipping-desi'],
 ['Kargo Etiketi ve Gönderi','Gönderi etiketi ve hazırlık kayıtları','shipping-label'],
 ['Kargo Takip ve Bildirimler','Takip numarası, teslimat ve bildirimler','shipping-tracking']]
};
const titles={qnb:['QNB Pay ve Kasa','Ödeme, tahsilat ve iade kayıtları'],invoice:['Fatura Bölümü','Fatura sağlayıcısı ve e-belge hazırlık kayıtları'],shipping:['Kargo Bölümü','Kargo firması, ücretler ve gönderi kayıtları'],general:['Genel Site Ayarları','Bakım modu ve yönetici hesabı']};
const owned=new Map();
function findById(id){return nodes.find(n=>n.id===id||n.querySelector('#'+id))}
function findByTitle(t){return nodes.find(n=>(n.querySelector('h3')?.textContent||'').toLocaleLowerCase('tr-TR').includes(t))}
const assigned={
 'qnb-check':[findById('pk-qnb-check')],
 'qnb-transactions':[findById('pk-qnb-transactions-refresh')],
 'qnb-refunds':[findById('pk-qnb-refunds-refresh')],
 'invoice-rules':[findById('pk-fulfillment-readiness-refresh'),findById('pk-fulfillment-jobs-refresh')],
 'shipping-label':[findById('pk-fulfillment-records-refresh')]
};
for(const [key,list] of Object.entries(assigned))for(const node of list)if(node)owned.set(node,key);
const shared=findById('pk-fulfillment-settings');
if(shared)owned.set(shared,'invoice-provider');
const defaultNotes={
 'qnb-payment':'3D Secure ve ödeme kuralları QNB Pay sözleşmesi doğrulanınca yapılandırılacaktır. Canlı ödeme kapalıdır.',
 'qnb-notifications':'Ödeme başarılı/başarısız bildirimleri, doğrulanmış ödeme sonucu geldikten sonra etkinleştirilecektir.',
 'invoice-kinds':'e-Fatura mükellef sorgusu olmadan belge türü otomatik seçilmez. Alıcı doğrulaması zorunludur.',
 'invoice-company':'Firma vergi bilgileri henüz bu ekrandan kaydedilmiyor. Entegratör bağlantısı ve güvenli firma kartı tamamlanmalıdır.',
 'invoice-templates':'Belge şablonu sağlayıcı özelliklerine bağlıdır. Henüz canlı belge veya PDF üretilmez.',
 'shipping-desi':'Paketleme kuralları henüz otomatik gönderiye bağlanmadı. Gerçek desi ve ağırlık bilgisi olmadan kargo etiketi oluşturulmaz.',
 'shipping-tracking':'Takip numarası ve teslimat bilgisi kargo API bağlantısı sonrasında otomatik güncellenecektir.'
};
let current=null,active=null;
function note(message){const p=document.createElement('p');p.className='pk-hub-section-note';p.textContent=message;return p}
function sectionFor(type,item){
 const [name,desc,key]=item;
 const section=document.createElement('section');section.className='pk-hub-subsection';section.dataset.subsection=key;
 const heading=document.createElement('button');heading.type='button';heading.className='pk-hub-subsection-heading';heading.setAttribute('aria-expanded','false');
 const label=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=name;small.textContent=desc;label.append(strong,small);
 const arrow=document.createElement('span');arrow.textContent='⌄';heading.append(label,arrow);
 const body=document.createElement('div');body.className='pk-hub-subsection-body';body.hidden=true;
 for(const node of assigned[key]||[])if(node)body.appendChild(node);
 if(key==='invoice-provider'||key==='shipping-provider'||key==='shipping-pricing'){
  if(shared&&!body.contains(shared)){
   if(key==='invoice-provider')body.appendChild(shared);
   else {
    const jump=document.createElement('button');jump.type='button';jump.className='pk-hub-jump';jump.textContent='Sağlayıcı ve kargo tarifesi ayarlarını aç';
    jump.addEventListener('click',()=>{show('invoice','invoice-provider');});
    body.appendChild(jump);
   }
  }
 }
 if(key==='invoice-provider')body.appendChild(note('Bu ortak formda fatura ve kargo sağlayıcısı ile kargo ücret tarifesi birlikte kaydedilir. API bilgileri tarayıcıya girilmez.'));
 if(defaultNotes[key])body.appendChild(note(defaultNotes[key]));
 if(!body.children.length)body.appendChild(note('Bu alanın gerçek işlem kontrolleri API ve iş kuralları tamamlandığında etkinleştirilecektir.'));
 heading.addEventListener('click',()=>toggle(section));
 section.append(heading,body);return section;
}
function toggle(section){
 const open=section.querySelector('.pk-hub-subsection-body').hidden;
 target.querySelectorAll('.pk-hub-subsection').forEach(s=>{s.querySelector('.pk-hub-subsection-body').hidden=true;s.querySelector('button').setAttribute('aria-expanded','false')});
 if(open){section.querySelector('.pk-hub-subsection-body').hidden=false;section.querySelector('button').setAttribute('aria-expanded','true');}
}
function show(type,key){
 if(!titles[type])return;
 current=type;target.replaceChildren();
 if(type==='general'){
  for(const node of nodes)if(!owned.has(node))target.appendChild(node);
 }else{
  const items=sections[type];for(const item of items)target.appendChild(sectionFor(type,item));
  if(type==='invoice'){
   const extra=document.createElement('div');extra.className='pk-hub-additional';extra.appendChild(note('Fatura ve kargo hareketleri, işlem kuyruğu ve hazırlık kontrolü aşağıdaki ilgili panellerde görüntülenir.'));
   target.appendChild(extra);
  }
 }
 hub.querySelector('#pk-hub-detail-title').textContent=titles[type][0];
 hub.querySelector('#pk-hub-detail-desc').textContent=titles[type][1];
 hub.querySelector('.pk-hub-cards').hidden=true;hub.querySelector('.pk-hub-tip').hidden=true;hub.querySelector('#pk-hub-general-open').hidden=true;
 detail.hidden=false;
 const openKey=key||sections[type]?.[0]?.[2];
 const initial=target.querySelector('[data-subsection="'+openKey+'"]');
 if(initial)toggle(initial);
 detail.scrollIntoView({block:'start',behavior:'smooth'});
}
function back(){
 current=null;detail.hidden=true;hub.querySelector('.pk-hub-cards').hidden=false;hub.querySelector('.pk-hub-tip').hidden=false;hub.querySelector('#pk-hub-general-open').hidden=false;
 for(const node of nodes)grid.appendChild(node);
 hub.scrollIntoView({block:'start',behavior:'smooth'});
}
hub.querySelectorAll('[data-hub-open]').forEach(b=>b.addEventListener('click',()=>{
 const type=b.dataset.hubOpen;
 const key=b.classList.contains('pk-hub-link')?sections[type]?.[Array.from(b.parentNode.querySelectorAll('.pk-hub-link')).indexOf(b)]?.[2]:null;
 show(type,key);
}));
hub.querySelector('#pk-hub-back').addEventListener('click',back);
hub.querySelector('#pk-hub-general-open').addEventListener('click',()=>show('general'));
})();
