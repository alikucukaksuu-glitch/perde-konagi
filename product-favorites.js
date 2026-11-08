(()=>{'use strict';
const sb=window.supabase?.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
const p=location.pathname.split('/').pop().replace(/\.html$/,'');
const slug=p==='urun'?new URLSearchParams(location.search).get('slug'):p;
if(!sb||!slug||!/^[a-z0-9-]{3,95}$/.test(slug))return;
let button=null,currentUser=null,stored=false,loading=false,epoch=0;
async function update(){
 const token=++epoch;
 const response=await sb.auth.getUser();if(token!==epoch)return;
 currentUser=response.data?.user||null;if(!button)return;
 if(!currentUser){button.textContent='♡ Favorilerime Ekle';button.title='Favorilere eklemek için üyelik hesabınıza giriş yapın';return}
 const row=await sb.from('customer_favorites').select('product_slug').eq('user_id',currentUser.id).eq('product_slug',slug).maybeSingle();
 if(token!==epoch)return;if(row.error){button.textContent='♡ Favorilerime Ekle';return}
 stored=!!row.data;button.textContent=stored?'♥ Favorilerimden Çıkar':'♡ Favorilerime Ekle';
}
function mount(){
 if(button)return;
 const title=document.querySelector('main h1');
 if(!title)return;
 const eligible=document.querySelector('.customizer')||document.getElementById('dp-product');if(!eligible)return;
 button=document.createElement('button');button.type='button';button.className='pk-favorite-btn';button.textContent='♡ Favorilerime Ekle';
 button.style.cssText='display:inline-flex;align-items:center;gap:5px;background:#fff9f4;color:#815a3a;border:1px solid #d5bca4;border-radius:9px;padding:8px 12px;margin:8px 0 12px;cursor:pointer;font:700 12px Arial,sans-serif';
 title.insertAdjacentElement('afterend',button);
 button.onclick=async()=>{
  if(loading)return;
  if(!currentUser){location.href='hesabim.html';return}
  loading=true;button.disabled=true;
  try{
   const r=stored?await sb.from('customer_favorites').delete().eq('user_id',currentUser.id).eq('product_slug',slug)
    :await sb.from('customer_favorites').insert({user_id:currentUser.id,product_slug:slug});
   if(r.error)throw r.error;
   stored=!stored;button.textContent=stored?'♥ Favorilerimden Çıkar':'♡ Favorilerime Ekle';
  }catch(e){alert('Favori değiştirilemedi: '+e.message)}finally{loading=false;button.disabled=false}
 };
 update();
}
window.addEventListener('pk-catalog-ready',()=>setTimeout(mount,50));
document.addEventListener('DOMContentLoaded',()=>{mount();setTimeout(mount,750)});
sb.auth.onAuthStateChange(event=>{if(['SIGNED_IN','SIGNED_OUT','INITIAL_SESSION'].includes(event))setTimeout(update,50)});
})();