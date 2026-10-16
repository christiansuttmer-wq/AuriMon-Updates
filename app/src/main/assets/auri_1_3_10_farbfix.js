/* AuriMon 1.3.10 - enforce colors even if an older theme loads or controls move. */
(()=>{'use strict';
 const cfg={interact:['auri-color-a','linear-gradient(180deg,#55e89a,#0b8441)','#08723d','#ffffff'],
 'retro-back':['auri-color-b','linear-gradient(180deg,#ff8190,#b51c3b)','#99152d','#ffffff'],
 'retro-menu':['auri-color-menu','linear-gradient(180deg,#72c3ff,#1958b2)','#124893','#ffffff'],
 'stuck-center':['auri-color-stuck','linear-gradient(180deg,#ffdb83,#dc8710)','#b5710c','#382208']};
 function apply(){
  const root=document.querySelector('#page-world .playbar');if(!root)return;
  for(const [key,[cls,bg,border,fg]] of Object.entries(cfg)){
   const el=root.querySelector('button[data-action="'+key+'"]');if(!el)continue;
   el.classList.add(cls);
   el.style.setProperty('background',bg,'important');
   el.style.setProperty('background-image',bg,'important');
   el.style.setProperty('border','2px solid '+border,'important');
   el.style.setProperty('color',fg,'important');
  }
  const brand=document.querySelector('.brand span');if(brand)brand.textContent='20 ORTE · 151 AURIMON · VERSION 1.3.10';
 }
 apply();document.addEventListener('DOMContentLoaded',apply,{once:true});window.addEventListener('load',apply,{once:true});
 const playbar=document.querySelector('#page-world .playbar');
 if(playbar && typeof MutationObserver!=='undefined'){
  const observer=new MutationObserver(()=>{observer.disconnect();apply();observer.observe(playbar,{childList:true,subtree:true});});
  observer.observe(playbar,{childList:true,subtree:true});
 }
})();
