/* AuriMon 1.3.15 — keep version label reliable despite older update listeners. */
(() => {
 'use strict';
 const VERSION=document.querySelector('.brand span')?.dataset.gameVersion || '1.5.6';
 const label=document.querySelector('.brand span');
 function placeActions(){
   const toggle=document.querySelector('#page-world .aur-more-toggle');
   if(!toggle)return;
   const top=Math.max(0,Math.min(window.innerHeight-100,Math.ceil(toggle.getBoundingClientRect().bottom+5)));
   document.documentElement.style.setProperty('--auri1315-menu-top',top+'px');
 }
 placeActions();
 function syncVersion(){
   const str='DEINE AURIMON-WELT · VERSION '+VERSION;
   if(label && label.textContent!==str) label.textContent=str;
   if(window.AriMons && window.AriMons.version!==VERSION) window.AriMons.version=VERSION;
 }
 if(label){
   new MutationObserver(syncVersion).observe(label,{childList:true,subtree:true,characterData:true});
 }
 syncVersion();
 window.addEventListener('resize',()=>requestAnimationFrame(()=>{syncVersion();placeActions()}));
 document.addEventListener('click',()=>requestAnimationFrame(()=>{syncVersion();placeActions()}));
})();
