(()=>{'use strict';
const url='https://rwylhxrtggsicieuyjrm.supabase.co',key='sb_publishable_ZuVtzdkaKytcl7i4rWcEuQ_XWgA28sA';
const form=document.getElementById('ct-form'),status=document.getElementById('ct-feedback'),btn=document.getElementById('ct-send');
const sb=window.supabase?.createClient(url,key);
if(!form||!sb){if(status)status.textContent='İletişim formu şu anda kullanılamıyor.';return}
const sentKey='perde_konagi_contact_last_submission';
form.addEventListener('submit',async e=>{
 e.preventDefault();if(!form.reportValidity())return;
 const honeypot=form.elements.website.value.trim();
 if(honeypot)return;
 const last=Number(sessionStorage.getItem(sentKey)||0);
 if(Date.now()-last<60000){status.textContent='Yeni mesaj göndermek için kısa bir süre sonra tekrar deneyin.';return}
 const name=form.elements.full_name.value.trim(),email=form.elements.email.value.trim(),phone=form.elements.phone.value.trim(),message=form.elements.message.value.trim();
 if(name.length<2||name.length>120||message.length<10||message.length>3000||!form.elements.consent.checked){status.textContent='Lütfen zorunlu alanları doğru doldurun.';return}
 btn.disabled=true;status.textContent='Mesajınız gönderiliyor…';
 try{
  const {error}=await sb.from('contact_messages').insert({full_name:name,email,phone,message});
  if(error)throw error;
  sessionStorage.setItem(sentKey,String(Date.now()));
  form.reset();status.textContent='Mesajınız başarıyla iletildi. En kısa sürede yanıtlamaya çalışacağız.';
 }catch(err){status.textContent='Mesaj gönderilemedi. Lütfen tekrar deneyin.';console.error('Contact form error:',err)}
 finally{btn.disabled=false}
});
})();