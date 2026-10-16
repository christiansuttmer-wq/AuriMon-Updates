/* AuriMon 1.3.7 – finger-friendly control rebuild for smartphones. */
(() => {
  'use strict';

  function applyControlLayout(){
    const playbar = document.querySelector('#page-world .playbar');
    if(!playbar) return false;

    const dpad = playbar.querySelector('.dpad');
    if(!dpad) return false;

    let stack = playbar.querySelector('.auri137-action-stack');
    if(!stack){
      stack = document.createElement('div');
      stack.className = 'auri137-action-stack';
      stack.setAttribute('aria-label','Aktionsknöpfe');
    }

    const order = [
      '[data-action="interact"]',
      '[data-action="retro-back"]',
      '[data-action="retro-menu"]',
      '[data-action="stuck-center"]'
    ];

    for(const selector of order){
      const btn = playbar.querySelector(selector) || document.querySelector(selector);
      if(btn) stack.appendChild(btn);
    }

    // Remove now-empty helper groups from older patches.
    for(const cls of ['.v581-right-main','.v581-util']){
      for(const group of Array.from(playbar.querySelectorAll(cls))){
        if(!group.querySelector('button')) group.remove();
      }
    }
    for(const node of Array.from(playbar.querySelectorAll('.v58-control-right,.auri135-actions'))){
      if(node !== stack && !node.querySelector('button')) node.remove();
    }

    playbar.classList.add('auri137-playbar');
    stack.classList.add('auri137-action-stack');

    if(playbar.firstElementChild !== stack) playbar.prepend(stack);
    if(playbar.lastElementChild !== dpad) playbar.appendChild(dpad);

    // Update labels for clarity.
    const mapSub = document.querySelector('.maptop span');
    if(mapSub) mapSub.textContent = '18 × 11 Felder · großes Steuerkreuz';
    const help = document.querySelector('#page-world .tablet-help');
    if(help) help.textContent = 'Großes Steuerkreuz · A / B / MENÜ / STUCK links daneben';
    const brand = document.querySelector('.brand span');
    if(brand) brand.textContent = '20 ORTE · 151 AURIMON · VERSION 1.3.7';

    return true;
  }

  // Run immediately and also shortly after load because some older scripts rebuild controls.
  applyControlLayout();
  window.addEventListener('load', applyControlLayout, { once:false });
  setTimeout(applyControlLayout, 60);
  setTimeout(applyControlLayout, 250);
  setTimeout(applyControlLayout, 800);
})();
