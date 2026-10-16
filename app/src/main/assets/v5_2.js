/* AuriMon 5.2.0 – Rivale, Trainer-Rückkämpfe, drei Pokalturniere,
   Trainingsarena und Kampfanimationen. Ergänzung zur unveränderten 151er-Datenbank. */
'use strict';
(() => {
  const RIVAL_ZONES=[0,2,4,6,8,9],RX=8,RY=6;
  const TOURNEYS=[
    {name:'Wiesen-Cup',min:3,icon:'🌿',zone:2,bonus:750,teams:[[16,21],[25,43,37],[3,6,9]]},
    {name:'Kristall-Cup',min:10,icon:'💎',zone:9,bonus:2250,teams:[[75,95,112],[121,134,131],[65,94,130,142]]},
    {name:'Meister-Cup',min:10,icon:'👑',zone:9,bonus:7500,teams:[[143,149,130,145],[146,144,150,94],[3,6,9,149,150]]}
  ];
  function data(){
    if(!Array.isArray(state.v52RivalWins))state.v52RivalWins=[];
    if(!state.v52Tournaments||typeof state.v52Tournaments!=='object'||Array.isArray(state.v52Tournaments))state.v52Tournaments={};
    for(let i=0;i<3;i++)state.v52Tournaments[i]=clamp(Number(state.v52Tournaments[i])||0,0,3);
    if(!state.v52Rematches||typeof state.v52Rematches!=='object'||Array.isArray(state.v52Rematches))state.v52Rematches={};
    if(!Number.isFinite(state.v52TrainingWins))state.v52TrainingWins=0;
    if(!Number.isFinite(state.v52TournamentWins))state.v52TournamentWins=0;
  }
  const hadDefault=defaultState;
  defaultState=function(){return {...hadDefault(),v52RivalWins:[],v52Tournaments:{0:0,1:0,2:0},v52Rematches:{},v52TrainingWins:0,v52TournamentWins:0}};
  function ready(){return Number.isInteger(window.PokemonProfiles?.activeSlot)&&!!state.starterChosen&&!!state.party.length}
  function rivalAt(z,x,y){return RIVAL_ZONES.includes(z)&&x===RX&&y===RY&&(!window.PokemonGame?.world50?.getStage||window.PokemonGame.world50.getStage()===z*5)}
  const prevTile=atPosition;
  atPosition=function(z,x,y){
    const t=prevTile(z,x,y);
    if(!state.dungeon&&!state.v51Indoor&&rivalAt(z,x,y)&&['path','grass','wild'].includes(t))return 'v52-rival';
    return t;
  };
  const oldWalk=walk;
  walk=function(dx,dy){
    if(!ready()||state.dungeon||state.v51Indoor||modalOpen||battle||currentPage!=='world')return oldWalk(dx,dy);
    const priorX=state.x,priorY=state.y,priorZone=state.zone;
    oldWalk(dx,dy);
    if(state.zone===priorZone&&(priorX!==state.x||priorY!==state.y)&&rivalAt(state.zone,state.x,state.y)&&!modalOpen&&!battle&&!state.v52RivalWins?.includes(state.zone))rivalDialog();
  };
  const oldInteract=interact;
  interact=function(){
    if(!ready()||state.dungeon||state.v51Indoor||modalOpen||battle)return oldInteract();
    const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[state.facing]||[0,-1];
    if(rivalAt(state.zone,state.x,state.y)||rivalAt(state.zone,state.x+d[0],state.y+d[1]))return rivalDialog();
    return oldInteract();
  };
  function rivalDialog(){
    data();if(!RIVAL_ZONES.includes(state.zone))return modal('⚡ Alex sucht neue Herausforderungen','Alex sucht in der weiten Welt ebenfalls nach neuen Herausforderungen. Vielleicht begegnet ihr euch auf euren Reisen erneut.',[['Alles klar','close']]);
    const won=state.v52RivalWins.includes(state.zone),name=state.profileGender==='girl'?'Rivale Alex':'Rivalin Alex';
    return modal('⚡ '+name,won?
      `„${escapeTrainerName()}, unser letztes Duell war klasse! Lust auf eine Revanche? Mein Team trainiert weiter.“`:
      `„Hey ${escapeTrainerName()}! Ich sammle ebenfalls alle 10 Siegel. Bei jeder wichtigen Etappe messen wir unsere Teams. Bereit für unser nächstes Duell?“`,
      [[won?'Revanche':'Duell starten','v52-rival-fight','gold'],['Später','close']]);
  }
  function rivalTeam(){
    const z=state.zone,badges=state.badges.length,lv=clamp(7+Math.max(z,badges)*3,7,84);
    const starter=state.party.find(m=>[1,4,7,2,5,8,3,6,9].includes(m.id))?.id||1;
    const rivalStarter=[1,2,3].includes(starter)?4:[4,5,6].includes(starter)?7:1;
    const evolved=lv>=35?rivalStarter+2:lv>=17?rivalStarter+1:rivalStarter;
    const pool=[evolved,25,18,65,130,143];
    return pool.slice(0,clamp(2+Math.floor(badges/5),2,6)).map((id,j)=>newMon(id,Math.min(99,lv+j)));
  }
  function doRival(){if(!RIVAL_ZONES.includes(state.zone))return toast('⚡ Alex ist in einer anderen Region!');if(!ready()||battle||!chooseAlive())return toast('💚 Heile zuerst dein AuriMon-Team!');data();closeModal();startBattle('v52-rival',rivalTeam(),'Alex – dein Rivale','v52:rival:'+state.zone,220+state.zone*80)}
  function tournamentMenu(){data();if(!ready())return;
    const body=TOURNEYS.map((t,i)=>{const rounds=state.v52Tournaments[i],unlock=state.badges.length>=t.min;
      return `<article class="v52-card"><div class="v52-card-top"><strong>${t.icon} ${t.name}</strong><span>${rounds===3?'🏆 Sieger':rounds+'/3 Siege'}</span></div>
      <p>${unlock?`Drei Trainer hintereinander besiegen. ${rounds===3?'Du darfst den Pokal verteidigen.':'Nächste Runde: '+(rounds+1)+'/3.'}`:`🔒 Ab ${t.min} Siegel freigeschaltet.`}</p>
      <button data-action="v52-cup:${i}" ${unlock?'':'disabled'}>${rounds===3?'Pokal verteidigen':'Turnierrunde starten'}</button></article>`;
    }).join('');
    modal('🏆 AuriMon-Turniere',`<p>Gewinne alle drei Pokale! Jede Runde ist ein richtiger Trainerkampf. Vor einer neuen Runde kannst du dein Team im Center heilen.</p><div class="v52-grid">${body}</div>`,[['Zurück','close']]);
  }
  function startCup(id){data();const t=TOURNEYS[id];if(!t||state.badges.length<t.min||!ready())return;
    if(!chooseAlive())return toast('💚 Bitte zuerst im Center heilen.');
    const round=state.v52Tournaments[id]===3?2:state.v52Tournaments[id];
    const level=clamp(9+t.min*3+round*2,9,92),mons=t.teams[round].map((p,i)=>newMon(p,Math.min(100,level+i)));
    closeModal();startBattle('v52-cup',mons,t.name+' – Runde '+(round+1),'v52:cup:'+id+':'+round,t.bonus);
  }
  function trainingMenu(){data();if(!ready())return;
    const highest=Math.max(...state.party.map(m=>m.level),5),lo=Math.max(3,highest-5),mid=highest,hi=Math.min(100,highest+5);
    modal('🥊 Trainingsarena',`<p>Trainiere deine Attacken in einem Freundschaftskampf. <b>Keine Münzverluste bei einer Niederlage.</b> Deine AuriMon erhalten reguläre Erfahrungspunkte.</p><div class="v52-grid">
    ${[['leicht',lo,16],['normal',mid,95],['schwer',hi,143]].map(([kind,lv,poke])=>`<article class="v52-card"><strong>${kind==='leicht'?'🌱 Leicht':kind==='normal'?'⚔️ Normal':'🔥 Schwer'}</strong><p>Gegner Level ${lv} · ${POKE[poke].name}</p><button data-action="v52-train:${kind}">Trainieren</button></article>`).join('')}</div>`,[['Zurück','close']]);
  }
  function startTraining(diff){if(!ready()||!chooseAlive())return toast('💚 Bitte zuerst das Team heilen.');
    const highest=Math.max(...state.party.map(m=>m.level),5),adjust={leicht:-5,normal:0,schwer:5}[diff];if(adjust===undefined)return;
    const ids=diff==='leicht'?[16,21]:diff==='normal'?[95,75]:[143,149];const count=diff==='schwer'?2:1;
    closeModal();startBattle('v52-training',ids.slice(0,count).map((id,i)=>newMon(id,clamp(highest+adjust+i,3,100))),'Trainingsarena','v52:training:'+diff,0);
  }
  function rematch(id){
    data();const parts=id.split(':'),z=Number(parts[0]),j=Number(parts[1]);
    if(!Number.isInteger(z)||!Number.isInteger(j)||z!==state.zone||!state.trainerWins.includes(id))return toast('🔒 Diesen Trainer hast du noch nicht besiegt.');
    const npc=trainers(z).find(n=>n.id===id);if(!npc||!chooseAlive())return toast('💚 Heile zuerst dein Team!');
    const count=state.v52Rematches[id]||0,bonus=Math.min(12,Math.floor(count/2)*2),mons=trainerParty(z,j);
    mons.forEach(m=>{m.level=clamp(m.level+Math.min(22,state.badges.length)+bonus,1,100);m.hp=hpMax(m.id,m.level)});
    closeModal();startBattle('v52-rematch',mons,'Trainer '+npc.name+' – Revanche','v52:rematch:'+id,60+z*15);
  }
  const previousAction=doAction;
  doAction=function(act,el){if(act==='v52-rival-menu')return rivalDialog();if(act==='v52-rival-fight')return doRival();
    if(act==='v52-tournaments')return tournamentMenu();if(act==='v52-training')return trainingMenu();
    if(act?.startsWith('v52-cup:'))return startCup(Number(act.slice('v52-cup:'.length)));
    if(act?.startsWith('v52-train:'))return startTraining(act.slice('v52-train:'.length));
    if(act?.startsWith('rematch:'))return rematch(act.slice('rematch:'.length));
    return previousAction(act,el);
  };
  const originalWin=battleVictory;
  battleVictory=function(){
    if(!battle)return;
    const b=battle;data();let bonus='';
    if(b.kind==='v52-rival'){
      const zone=Number(b.key.split(':')[2]),first=!state.v52RivalWins.includes(zone);
      if(first){state.v52RivalWins.push(zone);state.v52RivalWins.sort((a,c)=>a-c)}
      state.coins+=first?b.reward:Math.floor(b.reward/3);state.battleWins++;
      bonus=`<p>⚡ ${first?'Etappensieg gegen Alex!':'Rivalen-Revanche geschafft!'} ${state.v52RivalWins.length}/${RIVAL_ZONES.length} Rivalen-Etappen gewonnen.</p>`;
    }
    if(b.kind==='v52-cup'){
      const [, ,n,r]=b.key.split(':'),id=Number(n),round=Number(r),t=TOURNEYS[id];
      if(!t)return originalWin();
      if(state.v52Tournaments[id]===round){state.v52Tournaments[id]=Math.min(3,round+1);if(round===2){state.v52TournamentWins++;gainItem('candy',2+id*2)}}
      state.coins+=round===2?t.bonus:Math.round(t.bonus/4);state.battleWins++;
      bonus=`<p>${round===2?'🏆 Pokal gewonnen!':'🎖️ Turnierrunde gewonnen!'} ${t.name}: ${state.v52Tournaments[id]}/3 Runden.</p>`;
    }
    if(b.kind==='v52-rematch'){
      const id=b.key.substring('v52:rematch:'.length);state.v52Rematches[id]=(state.v52Rematches[id]||0)+1;
      state.coins+=b.reward;state.battleWins++;
      bonus=`<p>🥊 ${state.v52Rematches[id]}. Revanche gegen diesen Trainer! +${b.reward} Münzen.</p>`;
    }
    if(b.kind==='v52-training'){
      state.v52TrainingWins++;state.battleWins++;
      bonus='<p>💪 Training geschafft! Dein Team hat Erfahrung gesammelt.</p>';
    }
    originalWin();
    if(bonus){const dialog=$('modal-content');if(dialog)dialog.insertAdjacentHTML('beforeend',bonus);save();}
  };
  const oldLoss=battleDefeat;
  battleDefeat=function(){
    if(battle?.kind!=='v52-training')return oldLoss();
    data();battle=null;$('battle-overlay').classList.add('hidden');
    state.party.forEach(p=>{p.hp=hpMax(p.id,p.level);p.status=null;v4Moves(p).forEach(m=>m.pp=m.maxpp)});
    save();render();modal('🥊 Training beendet','Du hast viel gelernt. Dein Team ist wieder fit, und du hast keine Münzen verloren.',[['Weiter üben','v52-training','gold'],['Zur Welt','close']]);
  };
  const originalBattleView=renderBattle;
  renderBattle=function(){originalBattleView();if(!battle)return;
    const c=$('battle-content');if(!c)return;
    c.classList.add('v52-battle');const t=c.querySelector('.battletop b');
    if(t&&battle.kind==='v52-rival')t.textContent='⚡ RIVALEN-DUELL';
    if(t&&battle.kind==='v52-cup')t.textContent='🏆 AURIMON-TURNIER';
    if(t&&battle.kind==='v52-training')t.textContent='🥊 TRAININGSARENA';
    if(t&&battle.kind==='v52-rematch')t.textContent='🔁 TRAINER-REVANCHE';
    const arena=c.querySelector('.arena');if(arena&&!arena.querySelector('.v52-floor'))arena.insertAdjacentHTML('afterbegin','<div class="v52-floor" aria-hidden="true"><span></span><span></span><span></span></div>');
    const log=c.querySelector('.battlelog');if(log)log.setAttribute('aria-live','polite');
  };
  document.addEventListener('click',e=>{
    const btn=e.target.closest('button[data-battle]');if(!btn||btn.disabled||!battle)return;
    const action=btn.dataset.battle;
    if(!action.startsWith('move:')&&!action.startsWith('attack:'))return;
    const scene=$('battle-content')?.querySelector('.arena');if(!scene)return;
    scene.classList.remove('v52-impact');void scene.offsetWidth;scene.classList.add('v52-impact');
  },true);
  const oldTravel=renderTravel;
  renderTravel=function(){oldTravel();data();const element=document.createElement('section');element.className='v52-report';
    element.innerHTML=`<h2>⚡ Rivalen, Cups & Training</h2><p>Rivale: ${state.v52RivalWins.length}/6 Etappensiege · Turniere: ${TOURNEYS.filter((_,i)=>state.v52Tournaments[i]===3).length}/3 Pokale · Training: ${state.v52TrainingWins} Siege.</p><p>Trainer-Revanchen: ${Object.values(state.v52Rematches).reduce((a,b)=>a+(Number(b)||0),0)}</p>`;
    $('journal')?.appendChild(element);
  };
  const oldGuide=showGuide;
  showGuide=function(){oldGuide();$('modal-content')?.insertAdjacentHTML('beforeend','<p>⚡ 5.2: Alex taucht im Verlauf deiner Reise immer wieder überraschend auf. Starte Pokalturniere und die Trainingsarena über das Schnellmenü. Besiegte Trainer bieten stärkere Rückkämpfe an.</p>')};
  const controls=document.querySelector('.v4-shortcuts');
  const shortcuts=document.createElement('div');shortcuts.className='v52-shortcuts';
  shortcuts.innerHTML='<button data-action="v52-tournaments">🏆 Turniere</button><button data-action="v52-training">🥊 Training</button><button data-action="v52-rival-menu">⚡ Rivale</button>';
  controls?.appendChild(shortcuts);
  // Im HD-Renderer ruft ein optionaler Hook diese Figur auf. Kein neuer AuriMon-Eintrag.
  window.PokemonBattle52={drawRival(c,view,T,ms){
    if(!ready()||state.dungeon||state.v51Indoor||!RIVAL_ZONES.includes(state.zone))return;
    const x=(RX-view.x0)*T,y=(RY-view.y0)*T;
    if(x<0||x>=view.w*T||y<0||y>=view.h*T)return;
    const wave=Math.round(Math.sin(ms/380)*2),won=state.v52RivalWins.includes(state.zone);
    const rect=(xx,yy,w,h,color)=>{c.fillStyle=color;c.fillRect(xx,yy,w,h)};
    rect(x+12,y+40,25,4,'#101b3855');rect(x+18,y+28+wave,6,15,'#34476f');rect(x+26,y+28+wave,6,15,'#34476f');
    rect(x+13,y+11+wave,23,22,'#7946b5');rect(x+11,y+14+wave,5,14,'#edd1aa');rect(x+36,y+14+wave,5,14,'#edd1aa');
    rect(x+17,y+1+wave,16,15,'#ebc6a3');rect(x+14,y-3+wave,23,8,'#452f66');
    rect(x+21,y+9+wave,3,3,'#27364d');rect(x+29,y+9+wave,3,3,'#27364d');
    if(!won){rect(x+21,y-18+wave,7,13,'#ffe78c');rect(x+21,y-3+wave,7,4,'#ffe78c')}
  },getInfo(){data();return {rivals:[...state.v52RivalWins],tournaments:{...state.v52Tournaments},training:state.v52TrainingWins,rematches:{...state.v52Rematches}}}};
  window.PokemonGame.v52={version:'5.2.0',rivalZones:RIVAL_ZONES,events:window.PokemonBattle52.getInfo,training:startTraining,cup:startCup,rival:doRival};
  data();
})();
