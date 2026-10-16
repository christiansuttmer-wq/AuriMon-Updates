/* AuriMon 1.3.13: on-screen bounds for player selection and trainer creation. */
(() => {
  'use strict';
  const overlay=document.getElementById('modal-overlay');
  const modal=document.getElementById('modal-content');
  const picker=document.getElementById('player-picker');
  if(!overlay||!modal)return;

  function fitScreen(){
    const vv=window.visualViewport;
    const height=vv ? vv.height : window.innerHeight;
    const offset=vv ? vv.offsetTop : 0;
    document.documentElement.style.setProperty('--auri133-view-height',Math.max(140,Math.floor(height))+'px');
    document.documentElement.style.setProperty('--auri133-view-top',Math.max(0,Math.floor(offset))+'px');
  }
  function update(){
    const isProfile=!!modal.querySelector('#profile-name');
    overlay.classList.toggle('auri133-profile-dialog',isProfile);
    if(picker)picker.classList.add('auri133-bounded-picker');
    const brand=document.querySelector('.brand span');
    if(brand) brand.textContent='20 ORTE · 151 AURIMON · VERSION 1.3.13';
  }
  new MutationObserver(update).observe(modal,{childList:true});
  window.addEventListener('resize',()=>{fitScreen();update();});
  window.visualViewport?.addEventListener('resize',fitScreen);
  window.visualViewport?.addEventListener('scroll',fitScreen);
  fitScreen();
  update();
})();
