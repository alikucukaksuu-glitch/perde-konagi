(()=>{'use strict';
const article=document.querySelector('section.article');if(!article)return;
const pageSlug=location.pathname.split('/').pop().replace('.html','');
const slug=new URLSearchParams(location.search).get('slug')||'';
if(!slug){article.hidden=true;return;}
const sb=window.supabase&&window.supabase.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const root=document.createElement('section');root.className='pk-reviews';root.id='pk-reviews';
root.innerHTML='<header><div><span class="eyebrow">MÜŞTERİ DENEYİMLERİ</span><h2>Müşteri Yorumları ve Değerlendirmeler</h2><p>Bu ürünü kullanan müşterilerin yorumları.</p></div><div class="pk-score"><b id="pk-avg">—</b><span id="pk-stars">☆☆☆☆☆</span><small id="pk-count">0 değerlendirme</small></div></header><div id="pk-bars"></div><div class="pk-filters"><label>Sırala <select id="pk-sort"><option value="recent">En yeni</option><option value="high">En yüksek puan</option><option value="low">En düşük puan</option></select></label><label><input id="pk-only-photo" type="checkbox"> Fotoğraflı yorumlar</label></div><div id="pk-list" aria-live="polite">Yükleniyor…</div><div class="pk-write"><h3>Ürünü değerlendirin</h3><p>Yorumlar yayınlanmadan önce kontrol edilir. Değerlendirme yazmak için hesabınızla giriş yapın.</p><div id="pk-login-area"><a class="pk-account-link" href="hesabim.html">Hesabım: Giriş Yap / Üye Ol →</a></div><p id="pk-auth-message" role="status"></p><form id="pk-form"><label>Görünen adınız<input id="pk-name" minlength="2" maxlength="60" required></label><label>Puanınız<select id="pk-rating"><option value="5">★★★★★ (5)</option><option value="4">★★★★☆ (4)</option><option value="3">★★★☆☆ (3)</option><option value="2">★★☆☆☆ (2)</option><option value="1">★☆☆☆☆ (1)</option></select></label><label>Yorumunuz<textarea id="pk-comment" required minlength="10" maxlength="2000" rows="4"></textarea></label><label>Fotoğraflar (en fazla 3, her biri 3 MB)<input id="pk-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><button id="pk-submit">Yorumu gönder</button><p id="pk-message" role="status"></p></form></div>';
article.insertAdjacentElement('afterend',root);
const $=x=>document.getElementById(x);let user=null,rows=[];
const msg=(id,t)=>$(id).textContent=t;
const stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
async function auth(){if(!sb)return;const v=await sb.auth.getUser();user=v.data.user||null;$('pk-login-area').hidden=!!user;msg('pk-auth-message',user?'Giriş yapıldı: '+user.email:'Yorum yazmak için önce Hesabım sayfasından giriş yapın.')}
async function load(){if(!sb){msg('pk-list','Yorumlar şu anda yüklenemiyor.');return}
const {data,error}=await sb.from('product_reviews').select('id,display_name,rating,comment,created_at').eq('product_slug',slug).eq('status','approved').order('created_at',{ascending:false}).limit(200);
if(error){msg('pk-list','Yorumlar yüklenemedi.');return}
rows=data||[];let photos={};if(rows.length){let p=await sb.from('review_photos').select('review_id,object_path').in('review_id',rows.map(x=>x.id));
if(!p.error){await Promise.all((p.data||[]).map(async x=>{const r=await sb.storage.from('review-photos').createSignedUrl(x.object_path,600);if(r.data?.signedUrl)(photos[x.review_id]??=[]).push(r.data.signedUrl)}))}}
rows.forEach(x=>x.photos=photos[x.id]||[]);
const n=rows.length,avg=n?rows.reduce((v,x)=>v+x.rating,0)/n:0;msg('pk-avg',n?avg.toFixed(1).replace('.',','):'—');msg('pk-stars',n?stars(Math.round(avg)):'☆☆☆☆☆');msg('pk-count',n+' değerlendirme');
const bars=$('pk-bars');bars.textContent='';for(let i=5;i>=1;i--){let c=rows.filter(x=>x.rating===i).length;let el=document.createElement('div');el.className='pk-bar';let a=document.createElement('span');a.textContent=i+' ★';let b=document.createElement('div');b.className='pk-bar-track';let f=document.createElement('i');f.style.width=(n?c/n*100:0)+'%';b.appendChild(f);let d=document.createElement('small');d.textContent=c;el.append(a,b,d);bars.append(el)}render()}
function render(){let list=$('pk-list');list.textContent='';let filtered=rows.filter(x=>!$('pk-only-photo').checked||x.photos.length);
if($('pk-sort').value==='high')filtered.sort((a,b)=>b.rating-a.rating);else if($('pk-sort').value==='low')filtered.sort((a,b)=>a.rating-b.rating);
if(!filtered.length){msg('pk-list','Henüz yayınlanmış bir yorum yok. İlk yorumu siz yapabilirsiniz.');return}
for(const r of filtered){let card=document.createElement('article');card.className='pk-comment';let title=document.createElement('div');title.className='pk-comment-title';let name=document.createElement('strong');name.textContent=r.display_name;let date=document.createElement('small');date.textContent=new Date(r.created_at).toLocaleDateString('tr-TR');title.append(name,date);let rating=document.createElement('div');rating.className='pk-gold';rating.textContent=stars(r.rating);let comment=document.createElement('p');comment.textContent=r.comment;card.append(title,rating,comment);if(r.photos.length){let images=document.createElement('div');images.className='pk-images';for(const src of r.photos){let a=document.createElement('a');a.href=src;a.target='_blank';a.rel='noopener noreferrer';let img=document.createElement('img');img.src=src;img.loading='lazy';img.alt='Müşteri fotoğrafı';a.append(img);images.append(a)}card.append(images)}list.append(card)}}
$('pk-sort').onchange=render;$('pk-only-photo').onchange=render;
$('pk-form').onsubmit=async e=>{e.preventDefault();if(!sb)return;await auth();if(!user){msg('pk-message','Önce Hesabım sayfasından giriş yapın.');return}
let name=$('pk-name').value.trim(),comment=$('pk-comment').value.trim(),rating=Number($('pk-rating').value),files=[...$('pk-photos').files];
if(files.length>3||files.some(f=>f.size>3145728||!['image/jpeg','image/png','image/webp'].includes(f.type))){msg('pk-message','En fazla üç JPG, PNG veya WebP fotoğraf ekleyebilirsiniz. Her fotoğraf 3 MB altında olmalıdır.');return}
$('pk-submit').disabled=true;msg('pk-message','Gönderiliyor…');
try{const r=await sb.from('product_reviews').insert({product_slug:slug,user_id:user.id,display_name:name,rating,comment}).select('id').single();if(r.error)throw r.error;
let added=0;for(const f of files){const ext=f.type==='image/png'?'png':f.type==='image/webp'?'webp':'jpg',path=user.id+'/'+r.data.id+'/'+crypto.randomUUID()+'.'+ext;
const u=await sb.storage.from('review-photos').upload(path,f,{contentType:f.type});if(u.error)continue;
const p=await sb.from('review_photos').insert({review_id:r.data.id,owner_id:user.id,object_path:path});if(!p.error)added++}
$('pk-form').reset();msg('pk-message','Yorumunuz yönetici onayına gönderildi.'+(added!==files.length?' '+added+'/'+files.length+' fotoğraf yüklendi.':''))}
catch(e){msg('pk-message',e.code==='23505'?'Bu ürün için zaten yorum göndermişsiniz.':'Yorum kaydedilemedi: '+e.message)}finally{$('pk-submit').disabled=false}};
if(sb){sb.auth.onAuthStateChange(()=>setTimeout(auth,0));auth();load()}else msg('pk-list','Yorum sistemi kullanılamıyor.');
})();