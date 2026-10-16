/* AuriMon 1.3.11 – display only, no changes to saved data. */
(() => { 'use strict';
 const label=document.querySelector('.brand span');
 const update=()=>{if(label)label.textContent='20 ORTE · 151 AURIMON · VERSION 1.3.11';};
 update(); window.addEventListener('resize',update);
})();
