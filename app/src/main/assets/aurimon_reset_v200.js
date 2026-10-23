/* AuriMon 2.0.0 — user-requested single reset of all previous saves.
 * Runs after the legacy 1.5.8 reset, before gameplay and player profiles.
 * Never repeats on later boots: new 2.0 profiles remain safe.
 */
'use strict';
(() => {
  const key='aurimon_reset_v200_completed';
  const older='aurimon_reset_v158_completed';
  try {
    const store=window.localStorage;
    if(store.getItem(key)==='1'){
      window.AuriReset200={performed:false,alreadyDone:true,removed:0};
      return;
    }
    const removed=store.length;
    store.clear();
    try{window.sessionStorage?.clear()}catch(_){}
    // Important: the earlier 1.5.8 bootstrap also runs on EVERY boot.
    // Preserve its completed marker or it would erase all NEW 2.0 saves.
    store.setItem(older,'1');
    store.setItem(key,'1');
    window.AuriReset200={performed:true,alreadyDone:false,removed};
  }catch(error){
    window.AuriReset200={performed:false,alreadyDone:false,error:true};
    console.error('AuriMon 2.0.0: Alter Spielstand konnte nicht geloescht werden',error);
  }
})();
