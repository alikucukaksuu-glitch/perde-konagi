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
const groups={qnb:[],invoice:[],shipping:[],general:[]};
const nodes=Array.from(grid.children);
for(const node of nodes){
 const title=(node.querySelector('h3')?.textContent||'').toLocaleLowerCase('tr-TR');
 const id=node.id||'';
 let type='general';
 if(title.includes('qnb')||title.includes('ödeme hareketleri')||title.includes('iade hareketleri'))type='qnb';
 else if(id==='pk-fulfillment-settings')type='general';
 else if(title.includes('fatura')||title.includes('kargo')||title.includes('entegrasyon işlem kuyruğu'))type='general';
 groups[type].push(node);
}
const shared=nodes.find(n=>n.id==='pk-fulfillment-settings');
if(shared){groups.general=groups.general.filter(n=>n!==shared);const selectors=[['invoice','pk-invoice-provider'],['shipping','pk-shipping-provider']];for(const [type] of selectors){const copy=document.createElement('div');copy.className='pk-hub-shared-placeholder';copy.textContent='Fatura ve kargo sağlayıcısı ile ücret tarifesi ayarları aşağıdaki ortak ayarlar bölümündedir.';groups[type].push(copy)}}
const titles={qnb:['QNB Pay ve Kasa','Ödeme, tahsilat ve iade kayıtları'],invoice:['Fatura Bölümü','Fatura sağlayıcısı ve e-belge hazırlık kayıtları'],shipping:['Kargo Bölümü','Kargo firması, ücretler ve gönderi kayıtları'],general:['Genel Site Ayarları','Bakım modu ve yönetici hesabı']};
let current=null;
function show(type){
 if(!titles[type])return;
 current=type;target.replaceChildren();
 for(const node of groups[type])target.appendChild(node);
 if(type==='invoice'||type==='shipping'){
  if(shared)target.appendChild(shared);
  for(const node of groups.general)target.appendChild(node);
 }
 hub.querySelector('#pk-hub-detail-title').textContent=titles[type][0];
 hub.querySelector('#pk-hub-detail-desc').textContent=titles[type][1];
 hub.querySelector('.pk-hub-cards').hidden=true;hub.querySelector('.pk-hub-tip').hidden=true;hub.querySelector('#pk-hub-general-open').hidden=true;
 detail.hidden=false;detail.scrollIntoView({block:'start',behavior:'smooth'});
}
function back(){current=null;detail.hidden=true;hub.querySelector('.pk-hub-cards').hidden=false;hub.querySelector('.pk-hub-tip').hidden=false;hub.querySelector('#pk-hub-general-open').hidden=false;for(const node of nodes)grid.appendChild(node);hub.scrollIntoView({block:'start',behavior:'smooth'});}
hub.querySelectorAll('[data-hub-open]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.hubOpen)));
hub.querySelector('#pk-hub-back').addEventListener('click',back);hub.querySelector('#pk-hub-general-open').addEventListener('click',()=>show('general'));
})();
