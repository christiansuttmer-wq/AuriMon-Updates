/* AuriMon 1.0.3: progressive battles and inventory-only item buttons.
   All balancing is computed per battle, never serialized to saved profiles.
   The shop deliberately remains a catalogue of purchasable items. */
'use strict';
(() => {
  const clampLevel = n => Math.max(1, Math.min(100, Math.round(n)));
  const REGION_COUNT = AREAS.length;
  const regionIndex = () => Math.max(0, Math.min(REGION_COUNT - 1, Number(state?.zone)||0));
  const isStoryBoss = kind => /^(gym|boss|league|rocket|legend|v52-rival|v52-cup|v53-shadow|v55-path)/.test(kind);
  const isTrainer = kind => ['trainer','v52-rematch'].includes(kind);
  const isWild = kind => ['wild','safari'].includes(kind);

  // Gentle, visible-to-the-player progression through normal gameplay (no labels).
  // 0-2: unchanged. 3-6: +1 lv, 7-10: +2, 11-14: +3, 15-17: +4, 18-19: +5.
  const trainerBonusByRegion = [0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,5,5];
  function enemyLevelBonus(kind,region){
    const ramp=trainerBonusByRegion[region];
    if(isWild(kind)) return Math.floor(ramp/2);       // Wild encounters stay gentler.
    if(kind==='legend') return 1+Math.floor(ramp/2);  // Legendary encounters remain special.
    if(kind==='v52-training') return 0;               // Training offers its own levels.
    if(isStoryBoss(kind)) return ramp+(region>=10?1:0);
    return ramp;
  }
  const previousStartBattle = startBattle;
  startBattle = function(kind,enemies,name,key,reward){
    const region=regionIndex(), bonus=enemyLevelBonus(kind,region);
    if(Array.isArray(enemies) && enemies.length){
      // Don't make difficulty adjustments persistent in saved party or Pokedex.
      for(const m of enemies){
        if(!m || !POKE[m.id] || !Number.isFinite(m.level)) continue;
        if(bonus>0){m.level=clampLevel(m.level+bonus);m.hp=hpMax(m.id,m.level);}
      }
      // Trainer teams begin small and grow naturally; late gyms get a fifth slot.
      const isArena = kind==='gym' || kind==='boss';
      const shouldAdd = (isTrainer(kind) && region>=8 && enemies.length<4) ||
        (isArena && region>=10 && enemies.length<5);
      if(shouldAdd){
        const ids=ZONE_POOLS[region] || [];
        if(ids.length){
          const species=ids[(region+enemies.length*7)%ids.length];
          const lv=Math.max(2,Math.min(100,(enemies[enemies.length-1]?.level||5)-1));
          enemies.push(newMon(species,lv));
        }
      }
    }
    return previousStartBattle(kind,enemies,name,key,reward);
  };

  // Enemies gradually make better type choices instead of receiving free damage.
  // Early opponents usually play casually; skilled opponents look for weaknesses.
  enemyTurn = function(prefix=''){
    if(!battle)return;
    const e=foe(),a=chooseAlive();if(!e||!a)return;
    const moves=v4Moves(e).filter(m=>m && m.pp>0);
    const damaging=moves.filter(m=>m.power>0);
    const candidates=damaging.length?damaging:moves;
    let move={name:'Verzweifler',type:'Normal',power:35,pp:1};
    if(candidates.length){
      const z=regionIndex();
      const trained=isStoryBoss(battle.kind)||isTrainer(battle.kind);
      const awareness=Math.min(.78,.10+z*.025+(trained?.08:0));
      if(Math.random()<awareness){
        const targets=POKE[a.id]?.types || ['Normal'];
        const userTypes=POKE[e.id]?.types || ['Normal'];
        const scored=candidates.map(m=>({m,score:(m.power||0)*
          (userTypes.includes(m.type)?1.25:1)*effectiveness(m.type,targets)}));
        const best=Math.max(...scored.map(v=>v.score));
        const top=scored.filter(v=>v.score>=best-.01);
        move=top[Math.floor(Math.random()*top.length)].m;
      } else {
        move=candidates[Math.floor(Math.random()*candidates.length)];
      }
    }
    if(move.pp>0)move.pp--;
    let message='';
    if(e.status==='sleep'&&Math.random()<.6){message=`${POKE[e.id].name} schläft!`;}
    else if(e.status==='paralyze'&&Math.random()<.25){message=`${POKE[e.id].name} ist paralysiert!`;}
    else if(move.power>0){
      const hit=v4Damage(e,a,move);
      a.hp=Math.max(0,a.hp-hit.amount);
      message=`${POKE[e.id].name} nutzt ${move.name} (${hit.amount} KP).`;
    }else if(move.effect && !a.status){
      a.status=move.effect;
      message=`${POKE[e.id].name} nutzt ${move.name}!`;
    }else{message=`${POKE[e.id].name} setzt ${move.name} ein.`;}
    if(a.status==='gift'&&a.hp>0){
      const tick=Math.max(1,Math.floor(hpMax(a.id,a.level)/14));
      a.hp=Math.max(0,a.hp-tick);
      message+=` Gift verursacht ${tick} KP.`;
    }
    battle.log=(prefix?prefix+' ':'')+battle.log+' '+message;
    if(a.hp<=0){
      battle.log+=` ${POKE[a.id].name} ist kampfunfähig!`;
      if(!living().length){battleDefeat();return;}
      const next=living()[0];state.activeUid=next.uid;
      battle.log+=` ${POKE[next.id].name} übernimmt!`;
    }
  };

  const availability = id => Math.max(0,Number(bagCount(id))||0);
  const previousRenderBag=renderBag;
  renderBag=function(){
    previousRenderBag();
    const container=document.getElementById('bag-list');if(!container)return;
    // Use a snapshot so removing one row never shifts the IDs of later rows.
    const keys=Object.keys(ITEM_INFO);
    const rows=[...container.querySelectorAll('.bag-entry')];
    rows.forEach((row,index)=>{
      if(index<keys.length && availability(keys[index])===0)row.remove();
    });
    if(!container.querySelector('.bag-entry')){
      container.innerHTML='<div class="card">Deine Tasche ist noch leer. Im AuriMarkt bekommst du neue Gegenstände.</div>';
    }
  };

  const previousItemMenu=showItemMenu;
  showItemMenu=function(uid){
    previousItemMenu(uid);
    const container=document.getElementById('modal-content');if(!container)return;
    let visible=0;
    for(const row of [...container.querySelectorAll('.bag-entry')]){
      const button=row.querySelector('[data-action^="use:"]');
      if(!button)continue;
      const id=button.dataset.action.split(':')[1];
      if(!availability(id))row.remove();else visible++;
    }
    if(!visible){
      const back=container.querySelector('button[data-action="close"]');
      back?.insertAdjacentHTML('beforebegin','<p>Du hast aktuell keine einsetzbaren Gegenstände.</p>');
    }
  };

  // Evolution options that require an unowned stone/cable are also hidden.
  const previousEvolutionMenu=showEvolutions;
  showEvolutions=function(uid){
    previousEvolutionMenu(uid);
    const current=mon(uid),container=document.getElementById('modal-content');
    if(!current||!container)return;
    for(const row of [...container.querySelectorAll('.bag-entry')]){
      const action=row.querySelector('[data-action^="evolve:"]')?.dataset.action;
      const target=action?Number(action.split(':').pop()):NaN;
      const requirement=POKE[current.id]?.evol?.find(e=>e.to===target);
      if(requirement?.kind==='item'&&!availability(requirement.item))row.remove();
    }
    if(!container.querySelector('.bag-entry')){
      const back=container.querySelector('button[data-action="close"]');
      back?.insertAdjacentHTML('beforebegin','<p>Momentan ist keine Entwicklung verfügbar.</p>');
    }
  };

  const previousRenderBattle=renderBattle;
  renderBattle=function(){
    previousRenderBattle();
    if(!battle)return;
    const actions=document.querySelector('#battle-content .battleactions');
    if(!actions)return;
    const foeMon=foe();
    const legend=!!foeMon && (Object.prototype.hasOwnProperty.call(V4_LEGENDS,foeMon.id));
    const canThrow=['wild','legend'].includes(battle.kind);
    for(const b of [...actions.querySelectorAll('button')]){
      const action=b.dataset.battle||'';
      let id=null;
      if(action==='heal')id='potion';
      else if(action==='heal-super')id='superpotion';
      else if(action.startsWith('throw:'))id=action.slice(6);
      if(!id)continue;
      const unusableBall=id.includes('ball') && (!canThrow || (legend&&id!=='masterball'));
      if(availability(id)===0 || unusableBall)b.remove();
    }
  };

  // Information only; the player never sees a mode label or any damage percentage.
  window.AriMonsBalance=Object.freeze({
    version:'1.0.3',
    mode:'progressive',
    regionLevels:[...trainerBonusByRegion],
    hasDamageMultiplier:false,
    keepsSaves:true
  });
  window.AriMons=Object.assign(window.AriMons||{},{version:'1.0.3'});
  const label=document.querySelector('.brand span');
  if(label)label.textContent='DEINE AURIMON-WELT · VERSION 1.3.0';
  document.title = 'AuriMon';
})();
