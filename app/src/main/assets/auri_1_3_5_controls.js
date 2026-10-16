/* AuriMon 1.3.5 – only UI layout; no world, level, battle or save changes. */
(() => {
  'use strict';
  const app=document.getElementById('app');
  const tabs=app?.querySelector(':scope > .tabs');
  const header=app?.querySelector(':scope > .header');
  if(app && tabs && header) header.after(tabs);
  const playbar=document.querySelector('#page-world .playbar');
  const dpad=playbar?.querySelector('.dpad');
  const controls=playbar?.querySelector('.v58-control-right');
  if(playbar && dpad && controls){
    /* Reuse original buttons and handlers – simply lay them out differently. */
    controls.classList.add('auri135-actions');
    for(const selector of ['[data-action="interact"]','[data-action="retro-back"]','[data-action="retro-menu"]','[data-action="stuck-center"]']){
      const button=controls.querySelector(selector);
      if(button) controls.appendChild(button);
    }
    for(const group of Array.from(controls.querySelectorAll('.v581-right-main,.v581-util'))){if(!group.children.length)group.remove();}
    playbar.classList.add('auri135-playbar');
    playbar.prepend(controls);
    playbar.appendChild(dpad);
  }
  const label=document.querySelector('.brand span');
  const updateLabel=()=>{if(label)label.textContent='20 ORTE · 151 AURIMON · VERSION 1.3.5';};
  updateLabel();
  window.addEventListener('resize',updateLabel);
})();
