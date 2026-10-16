/* AuriMon 0.5.2 – Meisterbälle, EP-Verteiler und geheime Aufgaben.
   Profilgetrennte, einmalige Belohnungen. Keine Änderung an Monster-IDs. */
'use strict';
(() => {
  const TITLE='Meisterball';
  const QUESTS = [
    {id:'spuren', zone:0, title:'Die Spuren des Forschers', hint:'Eine vergessene Spur wartet irgendwo in der Welt.', clue:'Ein alter Kompass schlägt aus, wenn du Neues entdeckst. Der Weg selbst könnte die Antwort sein.', target:60,
     progress:()=>Math.max(0,state.steps-(state.v052Start?.spuren?.steps??state.steps)), label:'Schritte seit Entdeckung'},
    {id:'duelle', zone:3, title:'Die fünf Duelle', hint:'Ein verblichenes Wettkampfzeichen wartet auf jemanden mit Kampfgeist.', clue:'Das Abzeichen glänzt stärker, wenn du dich immer neuen Herausforderern stellst.', target:5,
     progress:()=>Math.max(0,state.trainerWins.length-(state.v052Start?.duelle?.wins??state.trainerWins.length)), label:'neue Trainersiege'},
    {id:'runen', zone:5, title:'Das Runenarchiv', hint:'Alte Schriften erzählen von einem verschollenen Archiv.', clue:'Das Archiv reagiert auf Wissen, das du an verschiedenen Orten aus uralten Zeichen gewinnst.', target:3,
     progress:()=>Array.isArray(state.v51Puzzles)?state.v51Puzzles.length:0, label:'gelöste Ortsrunen'},
    {id:'schatten', zone:7, title:'Die Schattenprüfung', hint:'Man erzählt von einer unbekannten Gestalt im Schatten.', clue:'Wo die Dunkelheit ihre Spuren hinterlässt, verlangt die Prüfung nach Mut.', target:2,
     progress:()=>Array.isArray(state.rocketWins)?state.rocketWins.length:0, label:'Schattenbund-Siege'},
    {id:'tempel', zone:8, title:'Das Echo der Tempel', hint:'Manche Ruinen erzählen von Echos aus längst vergessenen Zeiten.', clue:'Mehr als ein alter Schrein muss deine Entschlossenheit erkennen.', target:2,
     progress:()=>Array.isArray(state.v53Temples)?state.v53Temples.length:0, label:'entschlüsselte Tempel'}
  ];
  const LEGENDS = Object.keys(V4_LEGENDS).map(Number);
  for(const id of LEGENDS){V4_LEGENDS[id].story=String(V4_LEGENDS[id].story).replace(/Arktos|Zapdos|Lavados|Mewtu|Mew/g,POKE[id].name);}
  ITEM_INFO.masterball=['Meisterball','🟣','Fängt jedes AuriMon garantiert. Legendäre AuriMon nur damit fangbar.',0];
  ITEM_INFO.epshare=['EP-Verteiler','🌟','Einmal kaufen, an- und ausschaltbar: weitere Teammitglieder erhalten je 50 % Kampf-EP.',900];
  START_BAG.masterball=1;
  START_BAG.epshare=0;
  const oldDefault=defaultState;
  defaultState=function(){const s=oldDefault();return {...s,bag:{...s.bag,masterball:1,epshare:0},v052WelcomeGranted:true,v052Found:[],v052Claimed:[],v052Start:{},v052ExpShareEnabled:false};};
  function ensure(){
    if(!state?.bag)state.bag={};
    if(!state.v052WelcomeGranted){state.bag.masterball=Math.max(0,Number(state.bag.masterball)||0)+1;state.v052WelcomeGranted=true;}
    state.bag.masterball=Math.max(0,Number(state.bag.masterball)||0);
    state.bag.epshare=Math.min(1,Math.max(0,Number(state.bag.epshare)||0));
    if(!Array.isArray(state.v052Found))state.v052Found=[];
    if(!Array.isArray(state.v052Claimed))state.v052Claimed=[];
    if(!state.v052Start||typeof state.v052Start!=='object')state.v052Start={};
    if(typeof state.v052ExpShareEnabled!=='boolean')state.v052ExpShareEnabled=!!state.bag.epshare;
  }
  const oldLoad=v4SafeLoad;
  v4SafeLoad=function(input){
    const data=JSON.parse(JSON.stringify(input));
    if(!data.v052WelcomeGranted){data.bag={...(data.bag||{})};data.bag.masterball=Math.max(0,Number(data.bag.masterball)||0)+1;data.v052WelcomeGranted=true;}
    if(!Array.isArray(data.v052Found))data.v052Found=[];
    if(!Array.isArray(data.v052Claimed))data.v052Claimed=[];
    if(!data.v052Start||typeof data.v052Start!=='object')data.v052Start={};
    return oldLoad(data);
  };
  // A previously locked legend can be challenged now. The encounter is still
  // a real battle and requires a Master Ball for capture.
  v4CanLegend=function(id){return Object.prototype.hasOwnProperty.call(V4_LEGENDS,id);};
  const oldShop=showShop;
  showShop=function(){
    ensure();oldShop();
    const el=$('modal-content'), before=el.querySelector('.dialog-actions');if(!before)return;
    const owned=!!bagCount('epshare'),price=ITEM_INFO.epshare[3];
    before.insertAdjacentHTML('beforebegin',`<div class="bag-entry"><span class="item-emoji">🌟</span><span class="meta"><b>EP-Verteiler</b><small>Einmalig 🪙 ${price} · Teilt 50 % der Kampf-EP mit weiteren Teammitgliedern</small></span><button class="smallbtn gold" data-action="buy:epshare" ${owned?'disabled':''}>${owned?'✓ Gekauft':'Kaufen'}</button></div>`);
  };
  const oldPurchase=purchase;
  purchase=function(id){
    if(id!=='epshare')return oldPurchase(id);
    ensure(); if(state.bag.epshare){toast('🌟 EP-Verteiler ist bereits vorhanden.');return}
    if(state.coins<ITEM_INFO.epshare[3]){toast('🪙 Nicht genug Münzen.');return}
    state.coins-=ITEM_INFO.epshare[3]; state.bag.epshare=1;state.v052ExpShareEnabled=true;
    save();render();showShop();toast('🌟 EP-Verteiler aktiviert!');
  };
  const oldBag=renderBag;
  renderBag=function(){ensure();oldBag();const el=$('bag-list');if(!el||!state.bag.epshare)return;
    const row=Array.from(el.querySelectorAll('.bag-entry')).find(e=>e.textContent.includes('EP-Verteiler'));
    if(row)row.insertAdjacentHTML('beforeend',`<button class="smallbtn ${state.v052ExpShareEnabled?'gold':''}" data-action="v052-share">${state.v052ExpShareEnabled?'AN':'AUS'}</button>`);
  };
  const oldXP=gainXP;
  gainXP=function(member,amount){
    const canShare=!!battle&&!!member&&state.v052ExpShareEnabled&&!!bagCount('epshare')&&amount>0;
    oldXP(member,amount);
    if(canShare){
      const others=state.party.filter(m=>m.uid!==member.uid&&m.hp>0&&m.level<100);
      for(const m of others)oldXP(m,Math.max(1,Math.floor(amount*.5)));
      if(others.length&&battle)battle.log+=' 🌟 EP-Verteiler: '+others.length+' weitere AuriMon erhalten EP.';
    }
  };
  // Render after every combat redraw, including re-rendered move choices.
  const oldBattleView=renderBattle;
  renderBattle=function(){oldBattleView();if(!battle)return;
    const e=foe(),accepts=battle.kind==='wild'||battle.kind==='legend';
    const legend=e&&LEGENDS.includes(e.id);
    const actions=$('battle-content')?.querySelector('.battleactions');if(!actions)return;
    for(const id of ['ball','greatball','safariball']){
      const btn=actions.querySelector(`[data-battle="throw:${id}"]`);
      if(btn&&legend){btn.disabled=true;btn.title='Legendäre AuriMon brauchen den Meisterball';}
    }
    if(!actions.querySelector('[data-battle="throw:masterball"]')){
      const count=bagCount('masterball');
      actions.insertAdjacentHTML('beforeend',`<button class="v052-masterball" data-battle="throw:masterball" ${accepts&&count?'':'disabled'}>🟣 Meisterball (${count})${legend?' · Garantierter Fang':''}</button>`);
    }
    if(legend){const log=$('battle-content')?.querySelector('.battlelog');if(log&&!log.querySelector('.v052-legend-hint'))log.insertAdjacentHTML('beforeend','<div class="v052-legend-hint">🟣 Legendäres AuriMon: Nur mit Meisterball fangbar.</div>');}
  };
  const oldThrow=throwBall;
  throwBall=function(id){
    if(!battle||!foe())return;
    const e=foe(),legend=LEGENDS.includes(e.id);
    if(legend&&id!=='masterball'){toast('🔒 Legendäre AuriMon lassen sich nur mit einem Meisterball fangen!');return}
    if(id!=='masterball')return oldThrow(id);
    if(!['wild','legend'].includes(battle.kind)||!bagCount('masterball')){toast('🟣 Hier kannst du keinen Meisterball verwenden.');return}
    const species=e.id;
    state.bag.masterball--;
    caught(species);
    const target=state.party.length<6?'party':'box';state[target].push(e);
    battle=null;$('battle-overlay').classList.add('hidden');
    save();render();
    modal('🟣 Meisterball – sicherer Fang!',`${art(species)}<b>${POKE[species].name}</b> wurde garantiert gefangen! ${target==='box'?'Es wartet in der AuriMon-Box.':'Es ist in deinem Team.'}`, [['Weiter','close','gold']]);
  };
  // A small, reachable clue is hidden in one world location for each quest.
  // BFS avoids walls, houses, NPCs and unwalkable dead ends.
  const spots=new Map();
  function passable(x,y){
    if(x<0||x>=14||y<0||y>=11)return false;
    if(window.PokemonWorld56?.buildingAt?.(x,y))return false;
    if(window.PokemonWorld56?.npcAt?.(state.zone,x,y))return false;
    const t=atPosition(state.zone,x,y);
    return !['tree','rock','wall','water','trainer','gym','center','market','portal','cave','legend','rocketteam','safari','v51-house','v51-atelier'].includes(t)&&!String(t).startsWith('v56-solid');
  }
  function questSpot(zone){
    const key=String(zone);if(spots.has(key))return spots.get(key);
    if(state.zone!==zone)return null;
    const seeds=[[7,5],[6,5],[7,4],[5,5],[6,6],[5,4],[4,4],[3,4],[8,4],[9,4],[2,3]];
    const fallback=()=>{for(let y=1;y<10;y++)for(let x=1;x<13;x++)if(passable(x,y))return {x,y};return null};
    const start=seeds.map(([x,y])=>({x,y})).find(p=>passable(p.x,p.y))||fallback();
    if(!start)return null;
    const queue=[start],seenCells=new Set([`${start.x}:${start.y}`]);let best=null;
    const anchors={0:[9,7],3:[4,8],5:[11,8],7:[9,8],8:[13,7]};const anchor=anchors[zone]||[7,8];
    while(queue.length){
      const p=queue.shift(),dist=Math.abs(p.x-anchor[0])+Math.abs(p.y-anchor[1]);
      if(passable(p.x,p.y)&&Math.abs(p.x-start.x)+Math.abs(p.y-start.y)>=2){
        if(!best||dist<best.dist)best={x:p.x,y:p.y,dist};
      }
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,k=`${x}:${y}`;
        if(!seenCells.has(k)&&passable(x,y)){seenCells.add(k);queue.push({x,y});}
      }
    }
    const pos=best?{x:best.x,y:best.y}:null;
    if(pos)spots.set(key,pos);
    return pos;
  }
  function findQuest(q){
    ensure();if(state.v052Found.includes(q.id))return;
    state.v052Found.push(q.id);
    state.v052Start[q.id]={steps:state.steps,wins:state.trainerWins.length};
    save();
    modal('✨ Geheime Aufgabe entdeckt!',`<b>${q.title}</b><p>${q.clue}</p><p>Wenn du glaubst, das Geheimnis verstanden zu haben, prüfe deine Entdeckung später im Auftragsbuch.</p>`,[['Ich nehme an!','close','gold']]);
  }
  window.__debugQuestSpot=questSpot;
  const oldInteract=interact;
  interact=function(){
    if(!modalOpen&&!battle&&!state.dungeon&&!state.v51Indoor&&state.starterChosen){
      const q=QUESTS.find(q=>q.zone===state.zone&&!state.v052Found?.includes(q.id));
      if(q){const spot=questSpot(q.zone);if(spot&&Math.abs(state.x-spot.x)+Math.abs(state.y-spot.y)<=1)return findQuest(q);}
    }
    return oldInteract();
  };
  if(window.PokemonWorld56?.drawStructures){
    const originalDraw=window.PokemonWorld56.drawStructures;
    window.PokemonWorld56.drawStructures=function(c,view,T,pal){
      const res=originalDraw.call(this,c,view,T,pal);
      if(!state?.starterChosen||state.dungeon||state.v51Indoor)return res;
      const q=QUESTS.find(q=>q.zone===state.zone&&!state.v052Found?.includes(q.id));if(!q)return res;
      const spot=questSpot(q.zone);if(!spot)return res;
      const x=(spot.x-view.x0)*T+T/2,y=(spot.y-view.y0)*T+T/2;
      if(x<0||y<0||x>view.w*T||y>view.h*T)return res;
      c.save();c.fillStyle='rgba(255,242,165,.55)';c.beginPath();c.arc(x,y,8,0,Math.PI*2);c.fill();c.fillStyle='#fff7cd';c.fillRect(x-2,y-9,4,18);c.fillRect(x-9,y-2,18,4);c.fillStyle='#e3a63d';c.fillRect(x-3,y-3,6,6);c.restore();return res;
    };
  }
  function questPanel(){
    ensure();
    const cards=QUESTS.map(q=>{
      const discovered=state.v052Found.includes(q.id),claimed=state.v052Claimed.includes(q.id);
      const progress=discovered?Math.min(q.target,q.progress()):0;
      const ready=discovered&&progress>=q.target&&!claimed;
      const desc=discovered?q.clue:'Diese geheime Aufgabe ist noch nicht entdeckt. Erkunde die Spielwelt aufmerksam.';
      return `<div class="v052-quest"><b>${claimed?'✅':discovered?'✨':'🔎'} ${discovered?q.title:'Versteckte Spur'}</b><small>${desc}</small><small>${claimed?'🟣 Meisterball bereits erhalten':discovered?(ready?'✨ Geheimnis gelöst – Belohnung bereit':'🧩 Geheimnis ungelöst – beobachte die Welt'):'Achte auf besondere Zeichen und untersuche sie mit A.'}</small><div class="v052-actions">${discovered?`<button data-action="v052-qtravel:${q.zone}" type="button">🧭 Zur entdeckten Spur</button>`:''}${discovered?`<button data-action="v052-claim:${q.id}" type="button" ${ready?'':'disabled'}>${claimed?'Erledigt':'🎁 Belohnung'}</button>`:''}</div></div>`;
    }).join('');
    const links=[
      ['☀️ Tagesaufträge','v052-oldquests'],
      ['✨ Legendäre AuriMon','v052-all:legend'],
      ['📜 Ortsaufträge','v052-all:side'],
      ['🗿 Runen & Ruinen','v052-all:ruin'],
      ['🔮 Ortsrunen (10)','v052-all:runes'],
      ['✨ Legendäre Tempel','v052-all:temple'],
      ['🕶️ Schattenbund-Kapitel','v052-all:shadow'],
      ['⚔️ Rivale & Turniere','v052-all:extras']
    ];
    openModal(`<h2>📜 Auftragsbuch</h2><p>Alle bestehenden Auftragsarten sind von Anfang an erreichbar. Jede Aufgabe kann ausgewählt werden. Rätselorte und Lösungen musst du selbst entdecken; erledigte Aufgaben bleiben gespeichert.</p><div class="v052-quick">${links.map(([label,action])=>`<button data-action="${action}" type="button">${label}</button>`).join('')}</div><h3>🟣 Fünf verborgene Meisterball-Aufgaben</h3><p>Fünf Rätsel sind in der Welt verborgen. Halte die Augen offen: Jede Entdeckung kann eine besondere Belohnung eröffnen.</p>${cards}<button class="btn ghost" data-action="close">Schließen</button>`);
  }
  function questCategory(category){
    if(category==='extras')return openModal('<h2>⚔️ Weitere Abenteuer</h2><p>Rivale, Training und Turniere sind im Kampf-Menü erreichbar.</p><div class="v052-quick"><button data-action="v52-rival-menu">Rivale</button><button data-action="v52-tournaments">Turniere</button><button data-action="v52-training">Training</button></div><button class="btn ghost" data-action="quests">Zurück</button>');
    const arr=category==='runes'?AREAS.map((a,i)=>({zone:i,name:'Ortsrunen: '+a.name,act:'v51-guide',visible:true})):
      category==='legend'?Object.entries(V4_LEGENDS).map(([id,q],i)=>({zone:q.zone,name:state.visited?.includes(q.zone)?'Legende: '+POKE[id].name+' · '+AREAS[q.zone].name:'Legendäre Spur '+(i+1),act:'v052-legend:'+id,visible:!!state.visited?.includes(q.zone)})):
      category==='side'?AREAS.map((a,i)=>({zone:i,name:'Ortsauftrag: '+a.name,act:'v53-side',visible:true})):
      category==='ruin'?V4_CAVES.map((z,i)=>({zone:z,name:state.visited?.includes(z)?'Runenruine: '+AREAS[z].name:'Runenruine '+(i+1),act:'v53-ruin',visible:!!state.visited?.includes(z)})):
      category==='temple'?Object.entries(V4_LEGENDS).map(([id,q],i)=>({zone:q.zone,name:state.visited?.includes(q.zone)?'Tempel: '+POKE[id].name+' · '+AREAS[q.zone].name:'Tempellegende '+(i+1),act:'v53-temple',visible:!!state.visited?.includes(q.zone)})):
      category==='shadow'?V4_ROCKET.map((z,i)=>({zone:z,name:state.visited?.includes(z)?'Schattenbund: '+AREAS[z].name:'Schattenchronik '+(i+1),act:'v53-story',visible:!!state.visited?.includes(z)})) : [];
    openModal(`<h2>🗺️ Alle ${category==='side'?'Ortsaufträge':category==='runes'?'Ortsrunen':category==='ruin'?'Runenruinen':category==='temple'?'legendären Tempel':category==='legend'?'legendären AuriMon':'Schattenbund-Kapitel'}</h2><p>Alle Quests sind verfügbar. Verborgene Orte werden erst mit deiner Entdeckung in die Reiseauswahl aufgenommen.</p><div class="v052-quest-list">${arr.map(row=>`<button ${row.visible?'data-action="v052-questzone:'+row.zone+':'+row.act+'"':'disabled'} type="button">${row.visible?'📍 '+row.name:'🔎 '+row.name+' · Unentdeckt'}</button>`).join('')}</div><button class="btn ghost" data-action="quests">Zurück</button>`);
  }
  function travelQuest(zone,action){
    if(!Number.isInteger(zone)||zone<0||zone>=AREAS.length||!state.starterChosen||battle)return;
    if(zone!==state.zone&&!state.visited?.includes(zone)){toast('🔒 Entdecke diese Region zuerst auf dem normalen Reiseweg!');return;}
    closeModal();state.dungeon=null;state.v51Indoor=null;state.safariActive=false;
    state.zone=zone;state.x=7;state.y=5;state.facing='up';
    window.PokemonWorld56?.repairOldPosition?.();
    if(!state.visited.includes(zone))state.visited.push(zone);
    spots.delete(String(zone));
    switchPage('world');save();render();
    if(action)doAction(action);
    else toast('🧭 Fundort erreicht: '+AREAS[zone].name);
  }
  function claim(id){
    ensure();const q=QUESTS.find(q=>q.id===id);if(!q||!state.v052Found.includes(id)||state.v052Claimed.includes(id))return;
    if(q.progress()<q.target){toast('📜 Aufgabe noch nicht erfüllt.');return}
    state.v052Claimed.push(id);
    state.bag.masterball++;
    save();render();
    modal('🟣 Verborgener Meisterball!',`Du hast <b>${q.title}</b> abgeschlossen und einen <b>Meisterball</b> erhalten! Diese Quest ist jetzt endgültig als erledigt markiert.`,[['Weiter','quests','gold']]);
  }
  const oldDoAction=doAction;
  doAction=function(act,el){
    if(act==='quests')return questPanel();
    if(act==='v052-oldquests')return v4QuestLog();
    if(act?.startsWith('v052-legend:'))return v4EncounterLegend(Number(act.split(':')[1]));
    if(act==='v052-share'){
      ensure();if(!state.bag.epshare)return;
      state.v052ExpShareEnabled=!state.v052ExpShareEnabled;save();render();toast('🌟 EP-Verteiler '+(state.v052ExpShareEnabled?'aktiviert':'deaktiviert'));
      return;
    }
    if(act?.startsWith('v052-claim:'))return claim(act.split(':')[1]);
    if(act?.startsWith('v052-all:'))return questCategory(act.split(':')[1]);
    if(act?.startsWith('v052-qtravel:'))return travelQuest(Number(act.split(':')[1]));
    if(act?.startsWith('v052-questzone:')){const parts=act.split(':');return travelQuest(Number(parts[1]),parts.slice(2).join(':'));}
    return oldDoAction(act,el);
  };
  const oldGuide=showGuide;
  showGuide=function(){oldGuide();const el=$('modal-content');el?.querySelector('.dialog-actions')?.insertAdjacentHTML('beforebegin','<p><b>🟣 Meisterball:</b> Du startest mit einem; fünf weitere sind in geheimen Aufgaben versteckt. Legendäre AuriMon lassen sich nur mit diesem Ball fangen.</p><p><b>🌟 EP-Verteiler:</b> Einmalig im AuriMarkt kaufen und in der Tasche an- oder ausschalten.</p>');};
  const oldRenderTravel=renderTravel;
  renderTravel=function(){oldRenderTravel();const el=$('journal');el?.insertAdjacentHTML('beforeend',`<p>🟣 Meisterbälle: ${bagCount('masterball')} · Geheime Aufgaben: ${(state.v052Claimed||[]).length}/5</p><button class="smallbtn gold" data-action="quests">📜 Alle Aufgaben öffnen</button>`);};
  window.AriMons=Object.assign(window.AriMons||{}, {version:'1.0.0',masterballQuests:5,masterballOnlyLegends:true,shareAvailable:true,questBoard:true});
})();
