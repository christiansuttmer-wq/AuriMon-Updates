/* AuriMon 5.5.0 — Trophäenhalle, Meisterpfad und Neues Spiel+.
   Additives Endgame für die ersten 151 AuriMon. Alle sechs Profile bleiben unabhängig.
*/
'use strict';
(() => {
  const MAX_SPECIES=151, PATH_NAMES=['Waldwächterin Elara','Wellenmeister Taron','Sternenforscherin Lyra','Hüter des Horizonts'];
  const PATH_TEAMS=[[3,65,71,103,143],[9,121,131,134,130],[26,135,142,149,144],[6,94,145,146,150,151]];
  const PATH_LEVELS=[138,142,146,148];
  const PROFILE_PREFIX='pokemon_abenteuer_v55_ng_backup_';
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hasProfile=()=>Number.isInteger(window.PokemonProfiles?.activeSlot)&&window.PokemonProfiles.activeSlot>=1;
  const ready=()=>hasProfile()&&!!state.starterChosen&&!!state.party?.length;
  const length=x=>Array.isArray(x)?x.length:0;
  const number=x=>Number.isFinite(x)?x:0;
  const link=(label,action)=>`<button type="button" data-action="${action}">${label}</button>`;
  const unique=x=>[...new Set((Array.isArray(x)?x:[]).filter(v=>Number.isInteger(v)&&v>=1&&v<=MAX_SPECIES))];
  // Kanto-only trophy calculations use unique(); NG+ must preserve every Gen1–9 species.
  const uniqueAll=x=>[...new Set((Array.isArray(x)?x:[]).filter(v=>Number.isInteger(v)&&v>=1&&v<=1025))];
  const safeData=()=>{
    if(!state||typeof state!=='object')return;
    if(!Array.isArray(state.v55Trophies))state.v55Trophies=[];
    state.v55Trophies=[...new Set(state.v55Trophies.filter(s=>typeof s==='string'))];
    if(!Array.isArray(state.v55PathWins))state.v55PathWins=[];
    state.v55PathWins=[...new Set(state.v55PathWins.filter(n=>Number.isInteger(n)&&n>=0&&n<4))].sort((a,b)=>a-b);
    if(!Array.isArray(state.v55Hall))state.v55Hall=[];
    state.v55Hall=state.v55Hall.filter(x=>x&&typeof x==='object'&&Number.isFinite(x.at)).slice(-15);
    state.v55Prestige=Math.max(0,Math.min(99,Math.floor(number(state.v55Prestige))));
    state.v55FinalReward=!!state.v55FinalReward;
    state.v55StartTime=Number.isFinite(state.v55StartTime)?state.v55StartTime:(state.created||Date.now());
  };
  const prevDefault=defaultState;
  defaultState=function(){return {...prevDefault(),v55Trophies:[],v55PathWins:[],v55Hall:[],v55Prestige:0,v55FinalReward:false,v55StartTime:Date.now()}};
  const TROPHIES=[
    {id:'first',emoji:'🌱',title:'Erste Schritte',goal:1,progress:()=>Math.min(length(state.party),1),detail:'Dein erstes AuriMon erhalten'},
    {id:'steps100',emoji:'👟',title:'Entdecker',goal:100,progress:()=>number(state.steps),detail:'100 Schritte laufen'},
    {id:'steps1000',emoji:'🥾',title:'Weltenbummler',goal:1000,progress:()=>number(state.steps),detail:'1.000 Schritte laufen'},
    {id:'caught10',emoji:'🔴',title:'AuriMon-Freund',goal:10,progress:()=>unique(state.caught).length,detail:'10 Arten sammeln'},
    {id:'caught50',emoji:'📚',title:'AuriDex-Profi',goal:50,progress:()=>unique(state.caught).length,detail:'50 Arten sammeln'},
    {id:'caught100',emoji:'🔎',title:'AuriDex-Forscher',goal:100,progress:()=>unique(state.caught).length,detail:'100 Arten sammeln'},
    {id:'dex151',emoji:'🌟',title:'Alle 151',goal:151,progress:()=>unique(state.caught).length,detail:'Alle 151 Kanto-Arten sammeln'},
    {id:'badge1',emoji:'🏅',title:'Erstes Siegel',goal:1,progress:()=>length(state.badges),detail:'Das erste Siegel gewinnen'},
    {id:'badge5',emoji:'🎖️',title:'Fünf Siegel',goal:5,progress:()=>length(state.badges),detail:'Fünf der 40 Siegel gewinnen'},
    {id:'badge10',emoji:'👑',title:'Arenenmeister',goal:AREAS.length,progress:()=>length(state.badges),detail:'Alle '+AREAS.length+' Siegel gewinnen'},
    {id:'league',emoji:'🏆',title:'Liga-Champion',goal:1,progress:()=>state.leagueDone?1:0,detail:'Meisterliga abschließen'},
    {id:'path',emoji:'💫',title:'Herr des Meisterpfads',goal:4,progress:()=>length(state.v55PathWins),detail:'Die vier neuen Prüfungen gewinnen'},
    {id:'rival',emoji:'⚡',title:'Rivalenmeister',goal:6,progress:()=>length(state.v52RivalWins),detail:'Sechs Rivalen-Etappen gewinnen'},
    {id:'cups',emoji:'🥇',title:'Turnierlegende',goal:3,progress:()=>Object.values(state.v52Tournaments||{}).filter(n=>n===3).length,detail:'Alle drei Turniere gewinnen'},
    {id:'side',emoji:'📜',title:'Hilfsbereiter Held',goal:40,progress:()=>length(state.v53SideDone)+Object.entries(state.epicQuests||{}).filter(([z,e])=>+z>=10&&+z<40&&e?.claimed===true).length,detail:'10 klassische Ortsaufträge und 30 Kristallchroniken abschließen'},
    {id:'ruins',emoji:'🏛️',title:'Runenforscher',goal:7,progress:()=>length(state.v53Ruins),detail:'Alle sieben Ruinen enträtseln'},
    {id:'temples',emoji:'✨',title:'Tempelforscher',goal:5,progress:()=>length(state.v53Temples),detail:'Alle fünf Tempel öffnen'},
    {id:'hatches',emoji:'🥚',title:'Eier-Experte',goal:3,progress:()=>number(state.v54Hatched),detail:'Drei AuriMon ausbrüten'},
    {id:'friends',emoji:'💗',title:'Beste Freunde',goal:1,progress:()=>state.party.concat(state.box||[]).some(m=>number(m.friendship)>=220)?1:0,detail:'Ein AuriMon auf 220 Freundschaft bringen'},
    {id:'photos',emoji:'📷',title:'Fotoalbum',goal:5,progress:()=>length(state.v54Photos),detail:'Fünf Erinnerungsbilder aufnehmen'},
    {id:'shiny',emoji:'🌈',title:'Schillernder Fund',goal:1,progress:()=>state.party.concat(state.box||[]).some(m=>m.shiny)?1:0,detail:'Ein schillerndes AuriMon besitzen'},
    {id:'newplus',emoji:'🔁',title:'Neue Legende',goal:1,progress:()=>number(state.v55Prestige),detail:'Neues Spiel+ starten'}
  ];
  let syncing=false;
  function syncTrophies(){
    if(!ready()||syncing)return 0;
    safeData();syncing=true;let earned=0;
    try{
      for(const t of TROPHIES){
        if(state.v55Trophies.includes(t.id)||t.progress()<t.goal)continue;
        state.v55Trophies.push(t.id);earned++;
        state.coins+=t.id==='dex151'?1510:180;
        if(['dex151','badge5','badge10','league','path'].includes(t.id))state.bag.candy=(state.bag.candy||0)+2;
      }
      if(earned){baseSave();if(earned<=2&&!modalOpen&&!battle)toast(`🏆 ${earned} neue Trophäe${earned===1?'':'n'} freigeschaltet!`)}
    }finally{syncing=false}
    return earned;
  }
  const baseSave=save;
  save=function(){if(ready())syncTrophies();return baseSave()};
  function progress(t){return Math.max(0,Math.min(t.goal,t.progress()))}
  function trophies(){if(!ready())return;safeData();syncTrophies();
    const done=state.v55Trophies.length;
    const cards=TROPHIES.map(t=>{const n=progress(t),earned=state.v55Trophies.includes(t.id),pct=Math.round(n/t.goal*100);return `<div class="v55-trophy ${earned?'unlocked':'locked'}"><span class="v55-trophy-emoji">${earned?t.emoji:'🔒'}</span><div class="v55-trophy-body"><b>${safe(t.title)}</b><small>${safe(t.detail)}</small><div class="v55-meter"><i style="width:${pct}%"></i></div><small>${n} / ${t.goal} ${earned?'· Geschafft!':''}</small></div></div>`}).join('');
    modal('🏆 Trophäenhalle',`<p>Jeder Spieler sammelt seine eigenen Erfolge. <b>${done}/${TROPHIES.length}</b> Trophäen freigeschaltet.</p><div class="v55-trophy-grid">${cards}</div><p>Für neue Trophäen gibt es einmalig Münzen. Große Meilensteine schenken zusätzlich EP-Bonbons.</p>`,[['Zum Meisterpfad','v55-path'],['Schließen','close','gold']]);
  }
  function hall(){if(!ready())return;safeData();
    const entries=[...state.v55Hall].reverse().map((e,i)=>`<div class="v55-history"><b>🏅 Ruhmesblatt ${state.v55Hall.length-i}</b><span>${safe(e.title)} · ${new Date(e.at).toLocaleDateString('de-DE')}</span><small>${safe(e.trainer||'Trainer')} · Abenteuer ${number(e.run)+1} · ${safe((e.team||[]).map(id=>POKE[id]?.name||'?').join(' · '))}</small></div>`).join('')||'<p>Hier erscheinen deine besonderen Champion-Siege.</p>';
    modal('📜 Halle der Legenden',`<p>👑 ${state.v55Prestige}× Neues Spiel+ · 💫 Meisterpfad ${state.v55PathWins.length}/4</p><div class="v55-history-list">${entries}</div>`,[['Trophäen','v55-trophies'],['Zurück','close','gold']]);
  }
  function pathMenu(){if(!ready())return;safeData();
    if(!state.leagueDone)return modal('🔒 Der Meisterpfad','Gewinne zuerst alle ${AREAS.length} Siegel und schließe die Meisterliga ab. Danach warten vier neue Prüfungen.',[['Zurück','close']]);
    const completed=state.v55PathWins.length,allWon=completed===4;
    const cards=PATH_NAMES.map((name,i)=>`<div class="v55-path-item ${state.v55PathWins.includes(i)?'won':''}"><div><b>${i+1}. ${safe(name)}</b><small>${state.v55PathWins.includes(i)?'✅ Gewonnen':i>completed&&!allWon?'🔒 Erst vorherige Prüfung':'⚔️ Bereit'} · Team aus ${PATH_TEAMS[i].length} AuriMon · Lv. ${Math.min(150,PATH_LEVELS[i]+state.v55Prestige*4)}+</small></div>${i>completed&&!allWon?'<button type="button" disabled>Gesperrt</button>':link(state.v55PathWins.includes(i)?'Revanche':'Kämpfen','v55-battle:'+i)}</div>`).join('');
    modal('💫 Der Meisterpfad',`<div class="v55-endgame-header"><b>${allWon?'👑 Großmeister!':'Vier Prüfungen nach der Liga'}</b><p>Vier mächtige Gegner erwarten dich. Die letzte Prüfung hat ein Team aus sechs AuriMon. Heile deine AuriMon vor jeder Runde.</p><div class="v55-meter"><i style="width:${25*completed}%"></i></div><small>${completed}/4 Prüfungen abgeschlossen</small></div><div class="v55-path-list">${cards}</div>${allWon?'<p>🏆 Deine Legende lebt weiter! Du kannst alle Prüfungen wiederholen oder Neues Spiel+ beginnen.</p>':''}`,[['Zurück','close']]);
  }
  function startPath(n){if(!ready()||!state.leagueDone||!Number.isInteger(n)||n<0||n>3)return;
    safeData();if(n>state.v55PathWins.length)return toast('🔒 Gewinne erst die vorherige Prüfung.');
    if(!chooseAlive())return toast('💚 Dein Team braucht Heilung.');
    const base=PATH_LEVELS[n]+Math.min(state.v55Prestige*4,16);
    const enemy=PATH_TEAMS[n].map((id,i)=>newMon(id,clamp(base+Math.floor(i/2),1,150)));
    closeModal();startBattle('v55-path',enemy,PATH_NAMES[n],'v55:path:'+n,2400+n*850);
  }
  function completedDex(){return unique(state.caught).length===MAX_SPECIES}
  function finalMenu(){if(!ready())return;safeData();
    const kanto=unique(state.caught).length, all=uniqueAll(state.caught).length;
    const progress='<p>🌍 <b>Gesamter AuriDex: '+all+'/1.025</b> · Noch '+(1025-all)+' Pokémon-Arten fehlen.</p>'+
      '<p>🏅 <b>Kanto-Chronik: '+kanto+'/151</b> · Noch '+(151-kanto)+' der ursprünglichen 151 Arten fehlen.</p>';
    if(!completedDex())return modal('📖 Die AuriMon-Chronik',progress+
      '<p>Die besondere Meisterfeier belohnt das vollständige Kanto-Kapitel. Für den großen AuriDex sammelst du alle 1.025 Arten.</p>'+
      (!state.leagueDone?'<p>Die Kanto-Meisterfeier wartet außerdem hinter der Meisterliga.</p>':''),
      [['Zum AuriDex','v55-open-dex','gold'],['Schließen','close']]);
    if(!state.leagueDone)return modal('🌟 Kanto komplett!',progress+'<p>Du hast alle 151 Kanto-Pokémon! Besiege jetzt die Meisterliga für die Kanto-Meisterfeier.</p>',[['Zum AuriDex','v55-open-dex','gold'],['Schließen','close']]);
    if(state.v55FinalReward)return modal('🌟 Ehrenplatz im AuriDex',progress+'<p>Deine 151 Kanto-Pokémon sind verewigt. Die Kanto-Belohnung wurde bereits verliehen.</p>',[['Halle der Legenden','v55-hall'],['Zum AuriDex','v55-open-dex']]);
    modal('🌟 Kanto – Meisterfeier!',progress+`<div class="v55-celebration"><span>🏆 ✨ 🌟</span><b>Du hast alle 151 Pokémon der ersten Generation gefangen!</b><p>Die Professorin veranstaltet die Kanto-Meisterfeier. Als Belohnung warten 3.000 Münzen, fünf EP-Bonbons und ein Eintrag in der Halle der Legenden.</p></div>`,[['Belohnung abholen','v55-final-claim','gold'],['Später','close']]);
  }
  function record(title){safeData();state.v55Hall.push({title,at:Date.now(),trainer:state.profileName||'Trainer',run:state.v55Prestige,team:state.party.map(m=>m.id).filter(id=>id>=1&&id<=1025)});state.v55Hall=state.v55Hall.slice(-15)}
  function claimFinal(){if(!ready()||!state.leagueDone||!completedDex()||state.v55FinalReward)return finalMenu();
    state.v55FinalReward=true;state.coins+=3000;state.bag.candy=(state.bag.candy||0)+5;
    record('151 AuriMon – Vollständiger AuriDex');save();render();
    modal('🎊 Große AuriMon-Feier','🏆 Herzlichen Glückwunsch! Dein Name steht nun in der Halle der Legenden. Du hast 3.000 Münzen und fünf EP-Bonbons erhalten.',[['Halle ansehen','v55-hall','gold'],['Weiterreisen','close']]);
  }
  function plusMenu(){if(!ready())return;safeData();
    if(!state.leagueDone)return modal('🔒 Neues Spiel+','Neues Spiel+ wird erst freigeschaltet, wenn du die Meisterliga gewonnen hast. Dein aktuelles Abenteuer bleibt unverändert.',[['Zurück','close']]);
    modal('🔁 Neues Spiel+',`<div class="v55-plus-info"><b>Ein weiteres Abenteuer starten</b><p>Du behältst: Trainername und Figur, alle AuriMon im Team und in der Box, gefangene AuriDex-Arten, Fotoalbum, Trophäen und deinen Ruhmeshallen-Verlauf.</p><p>Zurückgesetzt werden: Siegel, Orte, Trainer-, Rivalen- und Turniersiege, Ruinen, Quests, Prüfhalle-/Ligafortschritt und die Geschichte. Die Gegner werden stärker.</p><p>Vor dem Start wird eine zusätzliche Sicherheitskopie dieses Spielerprofils angelegt. Nur dieses Profil ist betroffen.</p></div>`,[['Sicherheitskopie & Neustart','v55-plus-confirm','gold'],['Abbrechen','close']]);
  }
  function plusConfirm(){if(!ready()||!state.leagueDone)return;
    safeData();const slot=window.PokemonProfiles.activeSlot;
    const previous=JSON.stringify(state);
    // Fail closed: Wenn kein Backup geschrieben werden kann, NICHT neu beginnen.
    try{localStorage.setItem(PROFILE_PREFIX+slot,previous);if(localStorage.getItem(PROFILE_PREFIX+slot)!==previous)throw Error('Backup konnte nicht überprüft werden.')}catch(e){return modal('⚠️ Sicherheitskopie fehlgeschlagen','Es war nicht genügend Speicherplatz frei. Dein Abenteuer wurde NICHT zurückgesetzt. Sichere den Spielstand und schaffe etwas Speicher frei.',[['Zurück','close']])}
    const old=state,fresh=defaultState();
    fresh.profileName=old.profileName;fresh.profileGender=old.profileGender;fresh.starterChosen=true;
    fresh.party=JSON.parse(JSON.stringify(old.party));fresh.box=JSON.parse(JSON.stringify(old.box||[]));
    fresh.activeUid=old.activeUid;fresh.followerUid=old.followerUid;
    fresh.seen=uniqueAll(old.seen);fresh.caught=uniqueAll(old.caught);
    fresh.coins=Math.min(5000,Math.max(350,Number(old.coins)||0));
    fresh.bag={...START_BAG,ball:Math.max(15,Math.min(99,old.bag?.ball||0)),greatball:Math.max(4,Math.min(99,old.bag?.greatball||0)),potion:8,superpotion:6,revive:4,candy:Math.min(15,old.bag?.candy||0)};
    fresh.v54Photos=JSON.parse(JSON.stringify(old.v54Photos||[]));
    fresh.v55Trophies=[...old.v55Trophies];fresh.achievements=[...(old.achievements||[])];
    fresh.v55Hall=JSON.parse(JSON.stringify(old.v55Hall));fresh.v55Prestige=Math.min(99,old.v55Prestige+1);
    fresh.v55FinalReward=old.v55FinalReward;fresh.v55Outfit=old.v55Outfit?{...old.v55Outfit}:null;
    fresh.v55StartTime=Date.now();
    for(const m of fresh.party){m.hp=hpMax(m.id,m.level);m.status=null;const moves=v4Moves(m);moves.forEach(x=>{if(x&&Number.isFinite(x.maxpp))x.pp=x.maxpp})}
    state=fresh;v41ScaleSave(state);
    battle=null;modalOpen=false;$('battle-overlay').classList.add('hidden');$('modal-overlay').classList.add('hidden');
    currentPage='world';document.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id==='page-world'));document.querySelectorAll('.tabs button').forEach(e=>e.classList.toggle('selected',e.dataset.page==='world'));
    save();render();modal('🌟 Neues Spiel+ gestartet!',`Dein ${state.v55Prestige+1}. Abenteuer beginnt! Alle gesammelten AuriMon und Trophäen sind noch da. Die Gegner passen sich nun stärker an dein Team an.`,[['Auf ins Abenteuer!','close','gold']]);
  }
  function restoreMenu(){if(!ready())return;const key=PROFILE_PREFIX+window.PokemonProfiles.activeSlot;
    let s;try{s=JSON.parse(localStorage.getItem(key)||'null')}catch(e){}
    if(!s)return modal('💾 Sicherheitskopie','Für dieses Profil wurde noch kein automatisches Neues-Spiel+-Backup angelegt.',[['Zurück','close']]);
    modal('💾 Vorheriges Abenteuer wiederherstellen',`<p>Ein Backup von <b>${new Date(s.updatedAt||s.created||Date.now()).toLocaleDateString('de-DE')}</b> ist vorhanden.</p><p>Das aktuelle Abenteuer dieses Profils wird ersetzt. Andere Spieler bleiben unverändert. Eine Rückgängig-Funktion gibt es nicht.</p>`,[['Alten Fortschritt wiederherstellen','v55-restore-confirm','gold'],['Abbrechen','close']]);
  }
  function restoreConfirm(){if(!ready())return;let old;try{old=JSON.parse(localStorage.getItem(PROFILE_PREFIX+window.PokemonProfiles.activeSlot)||'null')}catch(e){}
    if(!old||!Array.isArray(old.party)||!Array.isArray(old.caught))return toast('⚠️ Sicherheitskopie ungültig');
    try{v4SafeLoad(old);modal('💾 Abenteuer wiederhergestellt','Das frühere Abenteuer wurde aus der Sicherheitskopie geladen. Dein Spielerprofil ist unverändert.',[['Weiter','close','gold']]);}catch(e){toast('⚠️ Wiederherstellung fehlgeschlagen: '+e.message)}
  }
  const origStartBattle=startBattle;
  startBattle=function(kind,enemies,name,key,reward){
    if(ready()&&state.v55Prestige>0 && !['wild','safari','trainer','gym','boss'].includes(kind)){
      const strongest=Math.max(5,...state.party.map(m=>m.level||5));
      enemies.forEach(e=>{if(!POKE[e.id]||e.id>151)return;e.level=clamp(Math.max(e.level+Math.min(state.v55Prestige*4,20),strongest-5),1,150);e.hp=hpMax(e.id,e.level)})
    }
    return origStartBattle(kind,enemies,name,key,reward);
  };
  const origWin=battleVictory;
  battleVictory=function(){if(!battle)return;const b=battle;
    let info='';if(b.kind==='v55-path'&&ready()){
      safeData();const n=Number(b.key.split(':')[2]);if(Number.isInteger(n)&&n>=0&&n<4){
        const first=!state.v55PathWins.includes(n);
        if(first){state.v55PathWins.push(n);state.v55PathWins.sort((a,b)=>a-b);state.coins+=b.reward;if(n===3){record('Meisterpfad – Vier Prüfungen');state.bag.candy=(state.bag.candy||0)+8;}}
        else state.coins+=Math.floor(b.reward/3);
        state.battleWins++;info=first?`💫 Prüfung ${n+1}/4 gewonnen! +${b.reward} Münzen.`:'💫 Revanche gewonnen!';
      }
    }
    origWin();if(info){save();$('modal-content')?.insertAdjacentHTML('beforeend',`<p>${safe(info)}</p>${state.v55PathWins.length===4?'<p>👑 Du hast den Meisterpfad abgeschlossen! Ein Ruhmeseintrag und acht EP-Bonbons warten auf dich.</p>':''}`)}
  };
  const origTravel=renderTravel;
  renderTravel=function(){origTravel();if(!ready())return;safeData();syncTrophies();const card=document.createElement('section');card.className='v55-travel-card';
    card.innerHTML=`<h2>🏆 Trophäen & Endgame</h2><p>🏅 ${state.v55Trophies.length}/${TROPHIES.length} Trophäen · 💫 Meisterpfad ${state.v55PathWins.length}/4</p><p>📖 AuriDex ${uniqueAll(state.caught).length}/1.025 · Kanto ${unique(state.caught).length}/151 · 🔁 Neues Spiel+ ${state.v55Prestige}</p><div class="v55-actions">${link('🏆 Trophäenhalle','v55-trophies')}${link('💫 Meisterpfad','v55-path')}${link('📖 AuriMon-Chronik','v55-finale')}${link('📜 Ruhmeshalle','v55-hall')}${link('🔁 Neues Spiel+','v55-plus')}${link('💾 NG+-Backup','v55-restore')}</div>`;
    $('journal')?.appendChild(card);
  };
  const origAction=doAction;
  doAction=function(act,el){
    if(act==='v55-trophies')return trophies();if(act==='v55-path')return pathMenu();if(act==='v55-hall')return hall();
    if(act==='v55-finale')return finalMenu();if(act==='v55-open-dex'){closeModal();return switchPage('dex');}if(act==='v55-final-claim')return claimFinal();
    if(act==='v55-plus')return plusMenu();if(act==='v55-plus-confirm')return plusConfirm();
    if(act==='v55-restore')return restoreMenu();if(act==='v55-restore-confirm')return restoreConfirm();
    if(act?.startsWith('v55-battle:'))return startPath(Number(act.slice(11)));
    return origAction(act,el);
  };
  const origGuide=showGuide;
  showGuide=function(){origGuide();$('modal-content')?.insertAdjacentHTML('beforeend','<p>🏆 Version 5.5: Trophäenhalle für deine Leistungen, vier Meisterpfad-Kämpfe nach der Liga und die große 151-AuriMon-Abschlussfeier. Nach dem Ligafinale kannst du außerdem Neues Spiel+ starten. Vorher wird automatisch eine Sicherheitskopie angelegt.</p>')};
  document.querySelector('.v4-shortcuts')?.insertAdjacentHTML('beforeend','<div class="v55-shortcuts"><button type="button" data-action="v55-trophies">🏆 Erfolge</button><button type="button" data-action="v55-path">💫 Meisterpfad</button></div>');
  window.PokemonAdventure55={version:'5.5.0',maxSpecies:151,trophyCount:TROPHIES.length,pathCount:4,inspect:()=>{safeData();return {trophies:state.v55Trophies.length,path:[...state.v55PathWins],prestige:state.v55Prestige,dex:unique(state.caught).length,profiles:6}},trophies,pathMenu,plusMenu,claimFinal};
  safeData();
})();
