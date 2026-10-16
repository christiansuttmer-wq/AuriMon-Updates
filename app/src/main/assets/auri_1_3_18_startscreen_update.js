/* AuriMon 1.4.22 - Kompakter Update-Button oben rechts im Startfenster.
   Behebt WebView-Absturz durch den 1.3.18 MutationObserver.
   Keinerlei Aenderung an Spielstand oder Spielregeln.
*/
(() => {
  'use strict';
  const CURRENT = '1.4.22';
  const HOME_BTN_ID = 'aurimon-updates-startscreen';
  let lastStatus = 'GitHub-Updates prüfen';
  let observedPicker = null;

  function syncVersion() {
    const brand = document.querySelector('.brand span');
    const value = '10 ORTE · 151 AURIMON · VERSION ' + CURRENT;
    if (brand && brand.textContent !== value) brand.textContent = value;
    if (window.AriMons && window.AriMons.version !== CURRENT) window.AriMons.version = CURRENT;
  }

  function checkUpdates(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const bridge = window.AuriMonUpdateBridge;
    if (bridge && typeof bridge.checkForUpdates === 'function') {
      bridge.checkForUpdates();
    } else {
      alert('Updateprüfung ist nur in der installierten Android-App verfügbar.');
    }
  }

  function showStatus(button) {
    if (!button) return;
    const available = /^Update verfügbar:/i.test(lastStatus);
    const text = available ? 'Update da!' : 'Updates prüfen';
    const icon = available ? '⬇' : '↻';
    const accessible = available ? lastStatus + ', zum Herunterladen tippen' : 'GitHub-Updates prüfen';

    // Wichtig: Niemals innerHTML bei jedem MutationObserver-Aufruf neu schreiben.
    // Dadurch hatte Version 1.3.18 eine endlose WebView-Mutationsschleife.
    button.classList.toggle('aurimon-new-update', available);
    const iconNode = button.querySelector('.picker-update-icon');
    const textNode = button.querySelector('.picker-update-text');
    if (iconNode && iconNode.textContent !== icon) iconNode.textContent = icon;
    if (textNode && textNode.textContent !== text) textNode.textContent = text;
    if (button.title !== lastStatus) button.title = lastStatus;
    if (button.getAttribute('aria-label') !== accessible) button.setAttribute('aria-label', accessible);
  }

  function ensureButton() {
    const picker = document.getElementById('player-picker');
    if (!picker || picker.hidden) return;
    const home = picker.querySelector('.player-picker-inner.picker-mode-home');
    if (!home) return;
    const actions = home.querySelector('.profile-start-actions');
    if (!actions) return;

    let button = home.querySelector('#' + HOME_BTN_ID);
    if (!button) {
      const shell = document.createElement('div');
      shell.className = 'picker-update-shell';
      button = document.createElement('button');
      button.type = 'button';
      button.id = HOME_BTN_ID;
      button.className = 'picker-update-button';
      button.innerHTML = '<span class="picker-update-icon" aria-hidden="true">↻</span><span class="picker-update-text">Updates prüfen</span>';
      button.addEventListener('click', checkUpdates);
      // Only one small update icon in the top-right corner of the start dialog.
      // No extra text block below the game buttons; no MutationObserver feedback.
      shell.append(button);
      home.insertBefore(shell, home.firstChild);
    }
    showStatus(button);
  }

  function observePicker() {
    const picker = document.getElementById('player-picker');
    if (!picker || observedPicker === picker) return;
    observedPicker = picker;
    // Nur Austausch des direkten Picker-Inhalts und Ein-/Ausblenden beachten.
    // KEIN subtree: true - sonst beobachtet der Handler seine eigenen DOM-Aenderungen.
    const observer = new MutationObserver(() => {
      ensureButton();
    });
    observer.observe(picker, {
      childList: true,
      attributes: true,
      attributeFilter: ['hidden']
    });
    ensureButton();
  }

  window.addEventListener('aurimon-update-status', (event) => {
    lastStatus = String(event.detail || '') || 'GitHub-Updates prüfen';
    showStatus(document.getElementById(HOME_BTN_ID));
  });

  syncVersion();
  observePicker();
  window.addEventListener('load', () => { syncVersion(); observePicker(); ensureButton(); });
  window.addEventListener('resize', syncVersion);
  // Fallback fuer spaeter initialisierte Spielerprofil-Overlays.
  if (!observedPicker) {
    document.addEventListener('DOMContentLoaded', observePicker, {once:true});
  }
})();
