/* AuriMon 1.3.14 – make the right control panel fit on smartphone landscape displays. */
(() => {
  'use strict';
  function apply(){
    const brand = document.querySelector('.brand span');
    if(brand) brand.textContent = '20 ORTE · 151 AURIMON · VERSION 1.3.14';
    const help = document.querySelector('#page-world .tablet-help');
    if(help) help.textContent = 'Handy-Modus: kompakter Steuerbereich · nichts soll unten abgeschnitten werden';
  }
  apply();
  window.addEventListener('load', apply, { once:false });
  window.addEventListener('resize', apply);
})();
