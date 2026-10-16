/* AuriMon 1.3.6 – only reposition "Weitere Aktionen" above the D-pad. */
(() => {
  'use strict';
  const controls = document.querySelector('#page-world .tablet-controls');
  const toggle = controls?.querySelector('.aur-more-toggle');
  const shortcuts = controls?.querySelector('.v4-shortcuts');
  if (controls && toggle && shortcuts) {
    /* Preserve the real nodes and all existing event listeners. */
    controls.prepend(shortcuts);
    controls.prepend(toggle);
    controls.classList.add('auri136-top-actions');
  }
  const label=document.querySelector('.brand span');
  if(label) label.textContent='20 ORTE · 151 AURIMON · VERSION 1.3.6';
})();
