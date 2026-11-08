(()=>{'use strict';
if(document.getElementById('pk-ai-widget'))return;
const endpoint='https://rwylhxrtggsicieuyjrm.supabase.co/functions/v1/perde-support';
const wa='https://wa.me/905019415045';
const origin=location.origin;
const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 0 1-8 8 9 9 0 0 1-3-.55L4 20l1.5-4.4A8 8 0 1 1 20 11Z"/></svg>';
const root=document.createElement('div');root.id='pk-ai-widget';
root.innerHTML='<section id="pkai-panel" class="pkai-panel" hidden aria-label="Perde Konağı canlı destek"><div class="pkai-head"><div class="pkai-logo" aria-hidden="true">⌂</div><div class="pkai-head-title"><strong>Perde Konağı Asistanı</strong><small><span class="pkai-dot"></span> 7/24 otomatik destek</small></div><button type="button" class="pkai-close" id="pkai-close" aria-label="Sohbeti kapat">×</button></div><div class="pkai-body" id="pkai-body" role="log" aria-live="polite"><div class="pkai-msg bot">Merhaba! 👋\nPerde Konağı’na hoş geldiniz. Perde seçimi, ölçü alma, ürünler ve sipariş konularında yardımcı olabilirim.\n\nNasıl yardımcı olabilirim?</div><div class="pkai-quick" id="pkai-quick"></div><div class="pkai-wa" id="pkai-wa"><span aria-hidden="true" style="color:#14a87b;font-size:27px">✆</span><div>Gerçek bir personelle görüşmek ister misiniz?<div><a href="'+wa+'" target="_blank" rel="noopener noreferrer" id="pkai-whatsapp">WhatsApp’a Yaz ›</a></div></div></div><p class="pkai-small">Sipariş bilgilerini güvenle görmek için <a href="hesabim.html">Hesabım</a> sayfasına giriş yapın.</p></div><div class="pkai-bottom"><p id="pkai-status" class="pkai-status" role="status"></p><form id="pkai-form" class="pkai-form"><label for="pkai-input" class="pkai-hidden-caption">Mesajınızı yazın</label><input id="pkai-input" type="text" maxlength="500" autocomplete="off" placeholder="Mesajınızı yazın..." required><button type="submit" aria-label="Mesaj gönder">➤</button></form><p class="pkai-note">Otomatik asistan · Kesin fiyat ve sipariş durumu için ilgili sayfayı kontrol edin.</p></div></section><button type="button" id="pkai-launch" class="pkai-launch" aria-controls="pkai-panel" aria-expanded="false">'+icon+' <span>Bize Yazın</span></button>';
document.body.append(root);
const $=id=>root.querySelector('#'+id),panel=$('pkai-panel'),launch=$('pkai-launch'),close=$('pkai-close'),body=$('pkai-body'),form=$('pkai-form'),input=$('pkai-input'),status=$('pkai-status'),quick=$('pkai-quick');
const suggestions=[['📏','Perde ölçüsünü nasıl almalıyım?'],['▣','Siparişim hangi aşamada?'],['★','Ürünleriniz hakkında bilgi almak istiyorum'],['◇','Fiyat bilgisi almak istiyorum'],['☏','Canlı destek ile görüşmek istiyorum']];
const history=[];
const show=open=>{panel.hidden=!open;launch.setAttribute('aria-expanded',String(open));if(open){input.focus();body.scrollTop=body.scrollHeight}else launch.focus()};
launch.addEventListener('click',()=>show(panel.hidden));close.addEventListener('click',()=>show(false));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)show(false)});
const msg=(role,text)=>{const p=document.createElement('p');p.className='pkai-msg '+role;p.textContent=text;body.insertBefore(p,$('pkai-wa'));body.scrollTop=body.scrollHeight};
function fallback(q){
 const t=q.toLocaleLowerCase('tr-TR');
 if(/whatsapp|canlı destek|müşteri temsilcisi|personel|telefon|ara/.test(t))return 'Size mağaza ekibimiz yardımcı olabilir. WhatsApp üzerinden +90 501 941 50 45 numarasına yazabilirsiniz. Her gün 10:00–20:00 saatleri arasında mağazalarımız açıktır.';
 if(/sipari|kargo|teslim|nerede|hangi aşama/.test(t))return 'Sipariş durumunuzu Hesabım → Siparişlerim bölümünden güvenli giriş yaparak takip edebilirsiniz. Gizliliğiniz için burada sipariş verilerini gösteremiyorum.';
 if(/ölçü|en boy|nasıl ölç/.test(t))return 'Perde ölçüsünde önce pencere veya montaj alanının genişliğini ve yüksekliğini santimetre olarak ölçün. Montaj şekline göre ölçü değişebilir; kesin kesim payı için ürünün ölçü rehberine bakın. İsterseniz ölçünüzü WhatsApp’tan ekibimize danışabilirsiniz.';
 if(/fiyat|kaç para|tutar|indirim|kampanya/.test(t))return 'Güncel fiyatlar perde modeline ve girdiğiniz en-boy ölçülerine göre ürün sayfasında hesaplanır. Kesin fiyat için ürününüzü seçip ölçüleri girin. Buradan doğrulanmamış tutar söylemiyorum.';
 if(/adres|konum|mağaza|şube|çalışma saat/.test(t))return 'Gaziosmanpaşa ve Sultangazi şubelerimiz haftanın 7 günü 10:00–20:00 saatlerinde açıktır. Ayrıntılı adresler ve yol tarifi için İletişim sayfasını ziyaret edebilirsiniz.';
 if(/stor|zebra|plise|bambu|perde|ürün/.test(t))return 'Perde Konağı’nda zebra, stor ve farklı mekanik perde seçeneklerini inceleyebilirsiniz. Işık kesme, kumaş tipi ve montaj koşulları ürüne göre değişir. İhtiyacınızı söylerseniz uygun ürün kategorisine yönlendirebilirim.';
 return 'Sorunuzu aldım. Kesin bilgi verebilmem için perde modeli, ölçü veya ihtiyacınızı biraz daha açıklayabilir misiniz? Dilerseniz WhatsApp üzerinden ekibimize de yazabilirsiniz.';
}
let pending=false;
async function submit(question){const q=String(question||'').trim().slice(0,500);if(!q||pending)return;quick.hidden=true;msg('user',q);input.value='';pending=true;form.querySelector('button').disabled=true;status.textContent='Yanıt hazırlanıyor…';
 let answer='';
 try{
  const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),15000);
  try{
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q,history:history.slice(-6)}),signal:ctrl.signal});
   if(!response.ok)throw Error('Bağlantı başarısız');
   const data=await response.json();if(typeof data.reply!=='string'||!data.reply.trim())throw Error('Yanıt gelmedi');
   answer=data.reply.slice(0,1800);
  }finally{clearTimeout(timer)}
 }catch(_){answer=fallback(q)}
 history.push({role:'user',content:q},{role:'assistant',content:answer});if(history.length>12)history.splice(0,history.length-12);
 msg('bot',answer);status.textContent='';pending=false;form.querySelector('button').disabled=false;input.focus();
}
suggestions.forEach(([ico,q])=>{const b=document.createElement('button');b.type='button';b.textContent=ico+'  '+q;b.addEventListener('click',()=>{if(q.includes('Canlı destek')){msg('bot',fallback(q));return}submit(q)});quick.append(b)});
form.addEventListener('submit',e=>{e.preventDefault();submit(input.value)});
})();