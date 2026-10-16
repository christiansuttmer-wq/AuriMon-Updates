/* AuriMon 1.3.4: final battle level guard, loaded after all prior game scripts.
   No save format change; only the levels of NEW ordinary encounters are controlled. */
'use strict';
(() => {
  const curve = [[2, 5], [4, 7], [6, 9], [8, 12], [11, 15], [14, 18], [17, 21], [20, 24], [23, 28], [26, 31], [29, 34], [32, 37], [35, 40], [38, 43], [41, 46], [44, 49], [47, 52], [50, 55], [53, 58], [56, 62]];
  const area = () => {
    const z=Number(state?.zone);
    return Number.isFinite(z) ? Math.max(0,Math.min(19,Math.trunc(z))) : 0;
  };
  const limits = (z,kind) => {
    const [lo,hi]=curve[z];
    if(kind==='trainer') return [hi,Math.min(100,hi+3)];
    if(kind==='gym'||kind==='boss') return [Math.min(100,hi+2),Math.min(100,hi+5)];
    return [lo,hi];
  };
  const apply = (mon,min,max) => {
    if(!mon || !POKE?.[mon.id]) return;
    const oldLevel=Math.max(1,Number(mon.level)||min);
    const level=Math.max(min,Math.min(max,Math.round(oldLevel)));
    if(level===oldLevel)return;
    const oldMax=hpMax(mon.id,oldLevel);
    const fraction=Math.max(0,Math.min(1,(Number(mon.hp)||oldMax)/Math.max(1,oldMax)));
    mon.level=level;
    mon.hp=Math.max(1,Math.min(hpMax(mon.id,level),Math.round(hpMax(mon.id,level)*fraction)));
  };
  // Protect all normal wild encounter creation paths, including overrides and fishing.
  const previousRandomWild=randomWild;
  randomWild=function(z){
    const mon=previousRandomWild.apply(this,arguments);
    const zi=Number.isFinite(Number(z))?Math.max(0,Math.min(19,Math.trunc(Number(z)))):area();
    apply(mon,...limits(zi,'wild'));
    return mon;
  };
  const previousStartBattle=startBattle;
  startBattle=function(kind,enemies,name,key,reward){
    const k=String(kind||'');
    const token=String(key||'');
    const regularWild=k==='wild' && !/^(legend:|v55:path:|v53:shadow:|v52:|rocket:|v55:)/.test(token);
    const regularBattle=regularWild || ['trainer','gym','boss','safari'].includes(k);
    // Scripted legendary fights and story events keep their intentionally fixed difficulty.
    if(regularBattle && Array.isArray(enemies)){
      const bounds=limits(area(),k==='safari'?'wild':k);
      enemies.forEach(m=>apply(m,...bounds));
    }
    return previousStartBattle.apply(this,arguments);
  };
  // A current (already open) battle is corrected once as well.
  if(typeof battle!=='undefined' && battle && Array.isArray(battle.enemies)) {
    const k=String(battle.kind||'');
    if(['wild','trainer','gym','boss','safari'].includes(k)) {
      const bounds=limits(area(),k==='safari'?'wild':k);
      battle.enemies.forEach(m=>apply(m,...bounds));
      if(typeof renderBattle==='function')renderBattle();
    }
  }
  const showVersion=()=>{
    const b=document.querySelector('.brand span');
    if(b)b.textContent='20 ORTE · 151 AURIMON · VERSION 1.3.4';
    if(window.AriMons)window.AriMons.version='1.3.4';
  };
  showVersion();
  window.addEventListener('resize',showVersion);
  window.AuriMonLevelGuard={version:'1.3.4',ranges:curve.map(v=>v.slice()),check:()=>({zone:area()+1,wild:limits(area(),'wild'),trainer:limits(area(),'trainer'),gym:limits(area(),'gym')})};
})();
