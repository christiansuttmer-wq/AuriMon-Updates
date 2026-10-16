/* AuriMon 1.4.22: update button always available in the global header. */
(() => {
  'use strict';
  const button = document.getElementById('aurimon-check-updates');
  const travelButton = document.getElementById('aurimon-updates-travel');
  if (!button) return;

  function draw(available) {
    button.classList.toggle('aurimon-new-update', Boolean(available));
    button.innerHTML = '<span class="auri-update-glyph" aria-hidden="true">' +
      (available ? '⬇️' : '🔄') + '</span><span class="auri-update-title">' +
      (available ? 'Update da!' : 'Update') + '</span>';
  }

  function trigger(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const bridge = window.AuriMonUpdateBridge;
    if (bridge && typeof bridge.checkForUpdates === 'function') {
      bridge.checkForUpdates();
    } else {
      alert('Die GitHub-Updateprüfung funktioniert in der installierten Android-App.');
    }
  }

  button.addEventListener('click', trigger, true);
  if (travelButton) travelButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    button.click();
  }, true);

  draw(false);
  window.addEventListener('aurimon-update-status', (event) => {
    const status = String(event.detail || '');
    const available = status.startsWith('Update verfügbar:');
    draw(available);
    button.title = status || 'GitHub-Updates prüfen';
    button.setAttribute('aria-label', available ? status + ', zum Herunterladen tippen' : 'GitHub-Updates prüfen: ' + status);
    if (travelButton) {
      travelButton.textContent = available ? '⬇️ ' + status : '🔄 GitHub-Update prüfen';
      travelButton.title = status;
      travelButton.classList.toggle('aurimon-new-update', available);
    }
  });

  const brand = document.querySelector('.brand span');
  const updateVersion = () => {
    if (brand) brand.textContent = '10 ORTE · 151 AURIMON · VERSION 1.4.22';
  };
  updateVersion();
  // Old layout handlers also update the label on resize, so register last.
  window.addEventListener('resize', updateVersion);
})();
