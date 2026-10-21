/* AuriMon 2.0 foundation: 18 ascension crystals + playable extended-world quests.
   Additive by design: old slots, Kanto side quests and 50-map state remain intact. */
'use strict';
(() => {
 const questTitles=[
  'Die gestohlene Seekarte','Der schweigende Mooswächter','Sterne unter schwarzem Wasser','Die Kupferbotschaft',
  'Stimmen aus dem Tiefenriff','Die verschwundene Kristallbotin','Das Herz des Sturms','Die gebrochene Runenschrift',
  'Die Bibliothek der Kristalle','Der Ascheregen','Das Schiff ohne Mannschaft','Die Stufen im Silbergrat',
  'Der letzte Wüstenzug','Der unsichtbare Blitz','Die Rosen der Vergangenheit','Schiffbruch im Nebel',
  'Die sieben Schatten','Das geheime Korallentor','Ein Herz aus Frost','Der Erbe des Drachen',
  'Die Stadt im Spiegel','Ein Traum von gestern','Der Händler der Himmelssteine','Licht unter dem Mond',
  'Der Tag, der zweimal kam','Wer ist Null?','Das Versprechen der Sterne','Die zerbrochene Welt',
  'Die Insel des Anfangs','Der letzte Riss'];
 const actNames=['Das Erwachen','Die neun Risse','Der Kristallkrieg','Jenseits der Grenzen'];
 const questText=[
  'Ein Reisender wurde zuletzt am Grenzportal gesehen. Seine Aufzeichnungen enthalten den ersten Hinweis.',
  'Die Spuren des Orden Null führen tiefer ins Land. Der Kristall reagiert auf die drei alten Runen.',
  'Ein verschollener Freund wird auf einer alten Karte wiedererkannt. Die Wahrheit liegt hinter der Arena.',
  'Die Sphäre im Zentrum des Risses muss versiegelt werden, bevor die Regionen miteinander verschmelzen.'
 ];
 function data(){if(!state.epicQuests||typeof state.epicQuests!=='object'||Array.isArray(state.epicQuests))state.epicQuests={};return state.epicQuests}
 function progress(z){const entry=data()[z];if(!entry)return null;const stage=z*5+3;
  const runeIds=window.PokemonGame.world50.getFeatures(stage).runes.map(r=>r.id);
  const doneRunes=runeIds.filter(id=>state.aurWorld50?.runestones?.includes(id)).length;
  const distance=Math.max(0,(state.steps||0)-(entry.steps||0)),required=80+(z-10)*8;
  const badge=state.badges.includes(z);
  return {...entry,distance,required,doneRunes,badge,complete:distance>=required&&doneRunes===3&&badge};
 }
 function renderQuest(z){
  z=Number(z);if(z<10||z>=40)return;
  const q=data()[z],p=progress(z),title=questTitles[z-10],type=ELEMENT_TYPES[(z-10)%18];
  const phase=actNames[Math.floor((z*5)/50)]||actNames[3];
  const story=questText[Math.floor((z*5)/50)]||questText[3];
  const intro='<b>📜 '+title+'</b><p>'+story+'</p><p>Nach Hinweisen in mehreren Gebieten musst du die Ruinen prüfen, drei Runen entschlüsseln und den regionalen Wächter bezwingen.</p>';
  if(!q)return modal('📜 '+phase,intro+'<p>Belohnung: zwei '+type+'kristalle + 500 Münzen.</p>',[['Auftrag annehmen','epic-accept:'+z,'gold'],['Später','close']]);
  if(q.claimed)return modal('🏆 '+title,intro+'<p>✅ Abgeschlossen. Kristallbelohnung bereits eingesammelt.</p>',[['Zurück','close']]);
  const status='<p>👟 Erkundung: '+Math.min(p.distance,p.required)+' / '+p.required+' Schritte</p>'+
   '<p>🔮 Runen: '+p.doneRunes+' / 3</p><p>🏅 Regionaler Orden: '+(p.badge?'✅':'❌')+'</p>';
  modal('📜 '+title,intro+status,[...(p.complete?[['Belohnung abholen','epic-claim:'+z,'gold']]:[]),['Weiter erkunden','close']]);
 }
 function accept(z){const q=data();if(!q[z]){q[z]={steps:state.steps||0,acceptedAt:Date.now(),claimed:false};save()}renderQuest(z)}
 function claim(z){const p=progress(z);if(!p||p.claimed||!p.complete)return;
  const type=ELEMENT_TYPES[(z-10)%18];data()[z].claimed=true;
  gainItem('crystal_'+type,2);state.coins+=500;save();render();
  modal('💎 Kristallauftrag erfüllt!',questTitles[z-10]+' abgeschlossen! Du erhältst 2 '+type+'kristalle und 500 Münzen.',[['Weiter','close','gold']]);
 }
 function ascendDialog(uid){const m=mon(uid);if(!m||m.level<100||m.level>=150)return;
  const n=POKE[m.id],needed=xpNeeded(m.level,m.id),ready=m.xp>=needed;
  const rows=n.types.map(type=>{const id='crystal_'+type,count=bagCount(id);return '<div class="bag-entry"><span class="item-emoji">'+(ITEM_INFO[id]?.[1]||'💎')+'</span><span class="meta"><b>'+type+'kristall ×'+count+'</b><small>'+((count&&ready)?'Bereit zum Aufstieg':'Kristall oder Erfahrung fehlt')+'</small></span><button class="smallbtn gold" data-action="ascend:'+uid+':'+type+'" '+(count&&ready?'':'disabled')+'>Verwenden</button></div>'}).join('');
  openModal('<h2>💎 Element-Aufstieg</h2><p>'+n.name+' · Level '+m.level+' → '+(m.level+1)+'</p><p>Erfahrung: '+Math.floor(m.xp)+' / '+needed+'</p><p>Für jeden Aufstieg benötigt dieses Pokémon <b>einen Kristall eines seiner eigenen Typen</b>.</p>'+rows+'<button class="btn ghost" data-action="close">Zurück</button>');
 }
 const oldTeam=renderTeam;
 renderTeam=function(){
  oldTeam();
  [...$('team-list').children].forEach((card,i)=>{const m=state.party[i];if(!m||m.level<100||m.level>=150)return;
   const actions=card.querySelector('.rowactions');if(!actions)return;
   const btn=document.createElement('button');btn.className='smallbtn gold';btn.dataset.action='ascend-open:'+m.uid;
   btn.textContent='💎 Aufstieg '+m.level+'/150';
   actions.appendChild(btn);
  });
 };
 const oldTravel=renderTravel;
 renderTravel=function(){
  oldTravel();
  const h=document.querySelector('#page-travel .subhead h1');
  if(h)h.textContent='🧭 40 Regionen · 200 Ebenen · 40 Siegel';
  const z=state.zone;
  const journal=$('journal');if(journal){
   const cleared=Object.values(data()).filter(x=>x.claimed).length;
   journal.insertAdjacentHTML('beforeend','<p>💎 <b>'+cleared+'/30</b> Kristallchroniken abgeschlossen · Levelgrenze 150</p>');
   if(z>=10){
    const p=progress(z),done=p?.claimed;
    const container=document.createElement('div');container.className='card';
    container.innerHTML='<b>📜 '+questTitles[z-10]+'</b><p>'+((!p)?'Neuer Auftrag im Gebiet':done?'✅ Abgeschlossen':Math.min(p.distance,p.required)+'/'+p.required+' Schritte · '+p.doneRunes+'/3 Runen')+'</p><button class="smallbtn gold" data-action="epic-open:'+z+'">Quest ansehen</button>';
    journal.appendChild(container);
   }
  }
 };
 const oldAction=doAction;
 doAction=function(act,el){
  if(typeof act==='string'){
   const [cmd,a,b]=act.split(':');
   if(cmd==='ascend-open')return ascendDialog(a);
   if(cmd==='ascend'){const m=mon(a);const was=m?.level;ascendWithCrystal(a,b);if(m&&m.level!==was)ascendDialog(a);return}
   if(cmd==='epic-open')return renderQuest(+a);
   if(cmd==='epic-accept')return accept(+a);
   if(cmd==='epic-claim')return claim(+a);
  }
  return oldAction(act,el);
 };
 const originalStarter=starterScreen;
 starterScreen=function(){originalStarter();const m=$('modal-content');if(m){
  const text=m.querySelector('.muted');if(text)text.textContent='40 Regionen, 200 Ebenen und 1.025 Pokémon – deine Abenteuer bleiben im Spielerprofil gespeichert.';
 }};
 window.AuriMonEpic={questTitles:questTitles.slice(),talkToGuide:renderQuest,progress,ascendDialog,inspect:()=>({worldCount:window.PokemonGame.world50.getCount(),species:D.length,levelLimit:150,elementTypes:ELEMENT_TYPES.slice(),availableCrystalKinds:ELEMENT_TYPES.length})};
})();
