/* v0.5.1 · Modern UI polish + Stuck button + clearer player figure */
'use strict';
(() => {
  document.body.classList.add('v581-modern');
  const playbar = document.querySelector('#page-world .playbar');
  if(playbar){
    playbar.innerHTML=`<div class="dpad" role="group" aria-label="Steuerkreuz">
      <i></i><button data-dir="up" aria-label="Hoch">▲</button><i></i>
      <button data-dir="left" aria-label="Links">◀</button><i></i><button data-dir="right" aria-label="Rechts">▶</button>
      <i></i><button data-dir="down" aria-label="Runter">▼</button><i></i>
    </div><div class="v58-control-right">
      <div class="v581-right-main">
        <button data-action="interact" aria-label="A: Ansprechen und bestätigen">A</button>
        <button data-action="retro-back" aria-label="B: Zurück">B</button>
      </div>
      <div class="v581-util">
        <button data-action="retro-menu" aria-label="Menü öffnen">MENÜ</button>
        <button data-action="stuck-center" aria-label="Zum nächsten AuriCenter">STUCK</button>
      </div>
    </div>`;
  }
  const menu = window.PokemonGame?.retro;
  // Extend current retro menu options without changing its overall structure.
  const open = menu?.show;
  function nearestCenterTarget(){
    if(state.zone===0 && window.PokemonGame?.world50?.getSpawn){const [x,y]=window.PokemonGame.world50.getSpawn();return {zone:0,x,y}}
    const world = window.PokemonWorld56;
    const buildings = world?.buildings || [];
    const center = buildings.find(b=>b.id==='center');
    if(center) return {zone: state.zone, x:center.x+1, y:center.y+center.h};
    return {zone: state.zone, x:2, y:3};
  }
  function doStuck(){
    const ok = confirm('Zum nächsten AuriCenter teleportieren? Das hilft, wenn du feststeckst.');
    if(!ok) return;
    const t = nearestCenterTarget();
    state.zone=t.zone; state.x=t.x; state.y=t.y; state.facing='up';
    // A rescue must also work from caves, indoor scenes and scripted encounters.
    state.dungeon=null; state.v51Indoor=null; state.safariActive=false;
    if(typeof battle!=='undefined' && battle){battle=null;document.getElementById('battle-overlay')?.classList.add('hidden');}
    if(typeof closeModal==='function') try{ closeModal(); }catch(_e){}
    if(typeof save==='function') try{ save(); }catch(_e){}
    if(typeof render==='function') render();
    if(typeof toast==='function') toast('🆘 Du wurdest sicher vor das nächste AuriCenter gebracht.');
  }
  const oldDoAction = doAction;
  doAction = function(act,el){
    if(act==='stuck-center') return doStuck();
    return oldDoAction(act,el);
  };
  // Hook button click directly too.
  document.addEventListener('click',e=>{
    const btn = e.target.closest('button[data-action="stuck-center"]');
    if(!btn) return;
    e.preventDefault(); e.stopImmediatePropagation();
    doStuck();
  }, true);
  // Clearer player figure: glow ring + marker, NPCs remain calmer.
  const world = window.PokemonWorld56;
  if(world && world.character && !world.__v581Patched){
    const baseCharacter = world.character.bind(world);
    world.character = function(c,cx,cy,gender,dir,walkTime,enemy){
      const x=Math.round(cx), y=Math.round(cy);
      if(!enemy){
        c.save();
        c.fillStyle='rgba(88,198,255,.22)';
        c.beginPath(); c.ellipse(x, y+15, 18, 8, 0, 0, Math.PI*2); c.fill();
        c.fillStyle='rgba(255,255,255,.15)';
        c.beginPath(); c.ellipse(x, y+15, 12, 5, 0, 0, Math.PI*2); c.fill();
        c.restore();
      }
      const r = baseCharacter(c,cx,cy,gender,dir,walkTime,enemy);
      if(!enemy){
        c.save();
        // soft outline halo around player upper body
        c.strokeStyle='rgba(103,225,255,.55)'; c.lineWidth=2;
        c.strokeRect(x-13,y-31,26,42);
        // overhead marker for fast identification
        c.fillStyle='#67e1ff'; c.beginPath(); c.moveTo(x,y-40); c.lineTo(x-6,y-31); c.lineTo(x+6,y-31); c.closePath(); c.fill();
        c.fillStyle='#ffffff'; c.fillRect(x-1,y-37,2,3);
        c.restore();
      }
      return r;
    };
    world.__v581Patched = true;
  }
  // keep the menu shape but make title text modern/clear
  const mapTitle=document.querySelector('.maptop b'); if(mapTitle) mapTitle.textContent='KARTE · KOMPAKT & MODERN';
  const mapSub=document.querySelector('.maptop span'); if(mapSub) mapSub.textContent='14 × 11 · A / B / MENÜ · STUCK';
  if(window.PokemonGame?.retro) window.PokemonGame.retro.version='1.0.0';
})();
