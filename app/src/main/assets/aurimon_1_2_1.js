/* AuriMon 1.3.0 – level progression, brand and new navigation shell. */
'use strict';
(() => {
  document.body.classList.add('auri121');
  document.title = 'AuriMon';
  const setVersion = () => {
    const label = document.querySelector('.brand span');
    if(label) label.textContent = '20 ORTE · 151 AURIMON · VERSION 1.3.0';
    window.AriMons = Object.assign(window.AriMons || {}, { version: '1.3.0' });
  };
  setVersion();
  const toggle=document.querySelector('.aur-more-toggle');
  toggle?.addEventListener('click',()=>{
    const panel=document.querySelector('#page-world .tablet-controls');
    if(!panel)return;
    const open=panel.classList.toggle('aur-shortcuts-open');
    toggle.setAttribute('aria-expanded',String(open));
    toggle.querySelector('span').textContent=open?'⌃':'⌄';
  });
  const setTop = () => {
    const caption = document.querySelector('.maptop b');
    if(caption) caption.textContent = 'SPIELWELT';
  };
  setTop();
  // Whenever the world is shown again, keep the redesigned shell in charge.
  const updateNav=()=>{
    const active=document.querySelector('.page.active');
    document.body.classList.toggle('aur-world-active', active?.id==='page-world');
    setVersion();
  };
  document.addEventListener('click',e=>{if(e.target.closest('.tabs button,[data-action="retro-menu"],[data-action="retro-back"]'))requestAnimationFrame(updateNav)});
  updateNav();
  // Every ordinary encounter obeys the regional level curve, even after NG+.
  // Scripted legendaries, cups, rematches and training retain their special levels.
  const originalRandomWild=randomWild;
  randomWild=function(z){
    const ranges=[[2,5],[4,7],[6,9],[8,12],[11,15],[14,18],[17,21],[20,24],[23,28],[26,31],[29,34],[32,37],[35,40],[38,43],[41,46],[44,49],[47,52],[50,55],[53,58],[56,62]];
    const idx=Math.max(0,Math.min(19,Number(z)||0));
    const mon=originalRandomWild(z);
    if(mon){const [lo,hi]=ranges[idx];mon.level=rand(lo,hi);mon.hp=hpMax(mon.id,mon.level);}
    return mon;
  };
  const previousStartBattle=startBattle;
  startBattle=function(kind,enemies,name,key,reward){
    const z=Math.max(0,Math.min(19,Number(state?.zone)||0));
    const isNormal=['wild','trainer','gym','boss'].includes(kind);
    const storyWild=kind==='wild' && /^wild:|^fish:|^roam:/.test(String(key||''));
    const ordinary=isNormal && (kind!=='wild'||storyWild);
    if(ordinary && Array.isArray(enemies)){
      const wildRanges=[[2,5],[4,7],[6,9],[8,12],[11,15],[14,18],[17,21],[20,24],[23,28],[26,31],[29,34],[32,37],[35,40],[38,43],[41,46],[44,49],[47,52],[50,55],[53,58],[56,62]];
      const [low,high]=wildRanges[z];
      let min=low,max=high;
      if(kind==='trainer'){min=high;max=Math.min(100,high+3);}
      if(kind==='gym'||kind==='boss'){min=Math.min(100,high+2);max=Math.min(100,high+5);}
      for(const m of enemies){
        if(!m||!POKE[m.id])continue;
        const level=Math.max(min,Math.min(max,Math.round(Number(m.level)||min)));
        if(m.level!==level){
          const ratio=(m.hp||1)/Math.max(1,hpMax(m.id,m.level||level));
          m.level=level;
          m.hp=Math.max(1,Math.min(hpMax(m.id,level),Math.round(hpMax(m.id,level)*ratio)));
        }
      }
    }
    return previousStartBattle(kind,enemies,name,key,reward);
  };
  // Keep visible HUD free of stale warnings and version text.
  window.addEventListener('resize',()=>{setVersion();setTop();});
})();
