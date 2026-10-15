(()=>{
 const card=document.getElementById('newsletter-invite');if(!card)return;
 const key='techletter-invitation-dismissed';const cooldown=30*24*60*60*1000;let dismissed=false;
 try{const last=Number(localStorage.getItem(key));dismissed=last>0&&Date.now()-last<cooldown}catch{}
 document.querySelectorAll('[data-newsletter-open],[data-newsletter-reset]').forEach(button=>button.addEventListener('click',()=>{
  if(button.hasAttribute('data-newsletter-reset')){try{localStorage.removeItem(key)}catch{}}
  dismissed=false;card.hidden=false;card.querySelector('.newsletter-dismiss').focus();
 }));
 function dismiss(){card.hidden=true;dismissed=true;try{localStorage.setItem(key,String(Date.now()))}catch{}}
 card.querySelector('.newsletter-dismiss').addEventListener('click',dismiss);
 card.querySelector('.newsletter-subscribe').addEventListener('click',dismiss);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!card.hidden)dismiss()});
 const reading=document.getElementById('reading');
 if(reading&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{
  if(entries.some(entry=>entry.isIntersecting)){if(!dismissed)card.hidden=false;observer.disconnect()}
 },{threshold:0.2});observer.observe(reading)}
})();
