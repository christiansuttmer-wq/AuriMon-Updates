/* AuriMon 1.3.9 – compact centered successful catch popup, UI only. */
(() => {
  'use strict';
  const overlay = document.getElementById('modal-overlay');
  const dialog = document.getElementById('modal-content');
  if (!overlay || !dialog) return;
  function update(){
    const head = dialog.querySelector('h2');
    // Existing capture flow uses modal('🎊 AuriMon gefangen!', ...).
    // Match only that dialog and leave all other popups unchanged.
    const isCatch = /(?:AuriMon|Pokémon) gefangen!/i.test(head?.textContent || '');
    overlay.classList.toggle('auri139-catch', isCatch);
  }
  const observer = new MutationObserver(update);
  observer.observe(dialog, {childList:true, subtree:false});
  update();
  const label=document.querySelector('.brand span');
  if(label)label.textContent='20 ORTE · 151 AURIMON · VERSION 1.3.9';
})();
