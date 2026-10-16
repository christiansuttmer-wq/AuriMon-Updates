/* AuriMon 1.3.0 – landscape UI initialization (does not touch game saves). */
'use strict';
(() => {
  document.body.classList.add('auri130');
  document.title = 'AuriMon';
  const label = document.querySelector('.brand span');
  const keepVersion = () => {
    if(label) label.textContent = '20 ORTE · 151 AURIMON · VERSION 1.3.1';
  };
  keepVersion();
  const layoutInfo = document.querySelector('.tablet-help');
  if(layoutInfo) layoutInfo.textContent = 'Steuerkreuz: Bewegen · A: Ansprechen · B: Zurück · Menü: Weitere Funktionen';
  const mapTitle = document.querySelector('.maptop b');
  if(mapTitle) mapTitle.textContent = 'SPIELWELT';
  const turnNotice = document.createElement('div');
  turnNotice.id = 'auri-rotate-notice';
  turnNotice.setAttribute('role', 'status');
  turnNotice.innerHTML = '<span style="font-size:38px" aria-hidden="true">📱</span><strong>Bitte ins Querformat drehen</strong><span>AuriMon wurde für die horizontale Ansicht entwickelt.</span>';
  turnNotice.style.cssText = 'display:none;position:fixed;inset:0;z-index:10000;align-items:center;justify-content:center;flex-direction:column;gap:12px;background:#09263a;color:white;padding:24px;text-align:center;font:600 16px system-ui';
  document.body.appendChild(turnNotice);
  const checkOrientation=()=>{
    turnNotice.style.display = innerWidth<innerHeight ? 'flex':'none';
    keepVersion();
  };
  checkOrientation();
  window.addEventListener('resize', checkOrientation);
  const controller = document.querySelector('#page-world .tablet-controls');
  // Close the mobile secondary-action drawer when moving to a different main page.
  document.querySelectorAll('.tabs [data-page]').forEach(b=>b.addEventListener('click',()=>{
    controller?.classList.remove('aur-shortcuts-open');
    const toggle = document.querySelector('.aur-more-toggle');
    if(toggle){ toggle.setAttribute('aria-expanded','false'); const mark=toggle.querySelector('span'); if(mark) mark.textContent='⌄'; }
  }));
})();
