document.documentElement.classList.add('js');
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
 const observer = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }),{threshold:.08});
 reveals.forEach(el=>observer.observe(el));
} else reveals.forEach(el=>el.classList.add('visible'));
const toggle=document.querySelector('.menu-toggle');
const mobileNav=document.querySelector('.mobile-nav');
function closeMenu(){ toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');mobileNav.classList.remove('open');mobileNav.inert=true; }
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');mobileNav.classList.toggle('open',open);mobileNav.inert=!open;});
mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){closeMenu();toggle.focus();}});
document.addEventListener('click',e=>{if(!e.target.closest('.header'))closeMenu();});
matchMedia('(min-width: 801px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
const navLinks=document.querySelectorAll('.desktop-nav a');
if('IntersectionObserver' in window){const sections=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){navLinks.forEach(link=>link.classList.toggle('active',link.hash===`#${entry.target.id}`));}}),{rootMargin:'-15% 0px -65% 0px'});document.querySelectorAll('main section[id]:not(#trade-journey)').forEach(el=>sections.observe(el));}
document.querySelectorAll('.service-item>button').forEach(button=>button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!open));document.getElementById(button.getAttribute('aria-controls')).hidden=open;button.querySelector('.expand-icon').textContent=open?'+':'−';}));
const form=document.querySelector('#inquiry-form');
document.querySelectorAll('[data-inquiry],[data-message]').forEach(link=>link.addEventListener('click',()=>{if(link.dataset.inquiry)form.elements.service.value=link.dataset.inquiry;if(link.dataset.message)form.elements.message.value=link.dataset.message;}));
const status=document.querySelector('.form-status');
form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;const button=form.querySelector('[type=submit]');button.disabled=true;button.firstElementChild.textContent='Recording your inquiry…';status.textContent='';status.className='form-status';try{const data=Object.fromEntries(new FormData(form));data.consent=form.elements.consent.checked;const response=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw new Error(result.error||'We could not save your inquiry. Please try again.');status.classList.add('success');status.textContent=`Your inquiry has been recorded. Reference: ${result.id}. Please keep this reference. No automatic email has been sent.`;form.reset();}catch(error){status.classList.add('error');status.textContent=error instanceof TypeError?'Connection interrupted. Please check your connection and try again.':error.message;}finally{button.disabled=false;button.firstElementChild.textContent='Send your inquiry';}});
const privacy=document.querySelector('#privacy-dialog');
document.querySelectorAll('.privacy-open').forEach(button=>button.addEventListener('click',()=>privacy.showModal()));
document.querySelectorAll('.dialog-close,.dialog-done').forEach(button=>button.addEventListener('click',()=>privacy.close()));
privacy.addEventListener('click',event=>{if(event.target===privacy){const bounds=privacy.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)privacy.close();}});
document.querySelector('#year').textContent=new Date().getFullYear();

// Move the hero headline with the incoming three-panel section while the
// sticky hero keeps the suspended object anchored until the panels cover it.
const scrollHeroTitle=document.querySelector('.hero h1');
const tradeJourney=document.querySelector('.trade-journey');
if(scrollHeroTitle&&tradeJourney){
 let heroScrollFrame=0;
 const updateHeroTitle=()=>{
  heroScrollFrame=0;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const progress=Math.min(1,Math.max(0,1-tradeJourney.getBoundingClientRect().top/Math.max(innerHeight,1)));
  scrollHeroTitle.style.setProperty('--hero-title-shift',String(-progress*innerHeight*.82)+'px');
 };
 const queueHeroTitle=()=>{if(!heroScrollFrame)heroScrollFrame=requestAnimationFrame(updateHeroTitle);};
 addEventListener('scroll',queueHeroTitle,{passive:true});
 addEventListener('resize',queueHeroTitle,{passive:true});
 updateHeroTitle();
}
