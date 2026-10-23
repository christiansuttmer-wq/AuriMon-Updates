/* AuriMon v1.5.8: user-requested one-time deletion of ALL previous local saves.
 * This must be loaded before ALL game/profile scripts, not during UI initialization.
 * No previous profile, autosave, backups, NG+ save, or story progress is migrated.
 */
'use strict';
(() => {
  const key = 'aurimon_reset_v158_completed';
  try {
    const store = window.localStorage;
    if (store.getItem(key) === '1') {
      window.AuriReset158 = {performed:false,alreadyDone:true};
      return;
    }
    const removed = store.length;
    // This WebView is exclusively for AuriMon. Clear all local gameplay/profile
    // namespaces, including unknown legacy saves and offline story/quest states.
    store.clear();
    try { window.sessionStorage?.clear(); } catch (_) {}
    store.setItem(key,'1');
    window.AuriReset158 = {performed:true,removed,alreadyDone:false};
  } catch (error) {
    // Never mark the reset complete if it failed.
    window.AuriReset158 = {performed:false,error:true};
    console.error('AuriMon: vollständiger Spielstand-Reset fehlgeschlagen',error);
  }
})();
