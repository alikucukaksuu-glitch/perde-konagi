(()=>{'use strict';
const path=location.pathname.split('/').pop()||'';
const query=new URLSearchParams(location.search);
if(['plise-perde.html','tul-perde.html','ahsap-jaluzi.html'].includes(path)&&!query.has('slug'))return;
const slug=path==='urun.html'?query.get('slug'):query.get('slug')||path.replace(/\.html$/,'');
if(!slug||!/^[a-z0-9-]{3,95}$/.test(slug))return;
const sb=window.supabase?.createClient('https://rwylhxrtggsicieuyjrm.supabase.co','sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA');
if(!sb)return;
let button=null,user=null,stored=false,busy=false,serial=0;
const style=document.createElement('style');
style.textContent='.pk-fav-image-wrap{position:relative;width:100%;min-width:0}.pk-fav-image-wrap>.mainpic{width:100%}.pk-fav-image-wrap,.pk-fav-photo-container{isolation:isolate}.pk-fav-photo-container{position:relative!important}.pk-favorite-btn{position:absolute;z-index:12;top:14px;right:14px;width:43px;height:43px;display:grid;place-items:center;cursor:pointer;border:1px solid rgba(123,95,65,.22);border-radius:50%;background:rgba(255,253,250,.94);box-shadow:0 3px 12px rgba(25,20,16,.16);color:#80583a;transition:background .18s,transform .18s,color .18s;padding:0;line-height:1}.pk-favorite-btn:hover{transform:scale(1.07);background:#fff}.pk-favorite-btn[aria-pressed="true"]{color:#ba4444;background:#fff8f8}.pk-favorite-btn svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.pk-favorite-btn[aria-pressed="true"] svg{fill:currentColor}.pk-favorite-btn:focus-visible{outline:3px solid #aa8755;outline-offset:3px}.pk-favorite-btn:disabled{opacity:.65;cursor:wait}@media(max-width:590px){.pk-favorite-btn{top:11px;right:11px;width:40px;height:40px}}';
document.head.append(style);
function render(){
 if(!button)return;
 button.setAttribute('aria-pressed',String(stored));
 button.setAttribute('aria-label',stored?'Favorilerimden çıkar':'Favorilerime ekle');
 button.title=stored?'Favorilerimden çıkar':'Favorilerime ekle';
}
async function refresh(){
 const token=++serial;
 try{
  const response=await sb.auth.getUser();
  if(token!==serial)return;
  user=response.data?.user||null;
  if(!user){stored=false;render();return}
  const record=await sb.from('customer_favorites').select('product_slug').eq('user_id',user.id).eq('product_slug',slug).maybeSingle();
  if(token!==serial)return;
  if(!record.error){stored=!!record.data;render()}
 }catch(_){/* Keep the button usable and do not expose auth failures. */}
}
function mount(){
 if(button)return true;
 const image=document.querySelector('#main.mainpic,#pp-main-image,#tc-photo,#wb-main-image');
 if(!image)return false;
 let container;
 if(image.id==='main'){
  container=document.createElement('div');container.className='pk-fav-image-wrap';
  image.parentNode.insertBefore(container,image);
  container.append(image);
 }else{
  container=image.parentElement;
  if(!container)return false;
  if(image.id==='pp-main-image')container=document.getElementById('pp-window')||container;
  container.classList.add('pk-fav-photo-container');
 }
 button=document.createElement('button');
 button.type='button';button.className='pk-favorite-btn';
 button.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.7a5.4 5.4 0 0 0-7.6 0L12 5.9l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.7a5.4 5.4 0 0 0 0-7.6Z"/></svg>';
 container.append(button);
 render();
 button.addEventListener('click',async()=>{
  if(busy)return;
  if(!user){location.href='hesabim.html';return}
  busy=true;button.disabled=true;
  try{
   const response=stored
    ?await sb.from('customer_favorites').delete().eq('user_id',user.id).eq('product_slug',slug)
    :await sb.from('customer_favorites').insert({user_id:user.id,product_slug:slug});
   if(response.error)throw response.error;
   stored=!stored;render();
  }catch(e){alert('Favori değiştirilemedi: '+(e?.message||'Bağlantıyı kontrol edin.'))}
  finally{busy=false;button.disabled=false}
 });
 refresh();
 return true;
}
document.addEventListener('DOMContentLoaded',mount);
window.addEventListener('pk-catalog-ready',mount);
if(document.readyState!=='loading')mount();
sb.auth.onAuthStateChange((event)=>{
 if(['SIGNED_IN','SIGNED_OUT','INITIAL_SESSION'].includes(event))setTimeout(refresh,40);
});
})();
