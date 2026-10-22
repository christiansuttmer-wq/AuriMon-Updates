/* AuriMon 4.0 · privates Fanprojekt, eigenständige Spiellogik. */
'use strict';
const $=id=>document.getElementById(id),rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,choice=arr=>arr[rand(0,arr.length-1)],clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const D=window.POKEDEX,POKE=Object.fromEntries(D.map(p=>[p.id,p]));
const VERSION=4,KEY='aurelio_pokemon_abenteuer_v4',PREVKEY='aurelio_pokemon_abenteuer_v3',OLDKEY='aurelio_pokemon_abenteuer_v1';
const AREAS=[
 ['Sonnenwiese','Das Dorf, in dem alles beginnt.','grass','🌿','Wiesenorden','Lina'],
 ['Mondsee','Silbernes Wasser und ruhige Ufer.','ocean','🌊','Seeorden','Finn'],
 ['Felsenwald','Zwischen Kiefern und steilen Felsen.','mountain','🪨','Felsorden','Rika'],
 ['Blumenpfad','Ein Meer aus Blumen und Schmetterlingen.','grass','🌸','Blütenorden','Elly'],
 ['Windküste','Salzluft und tosende Wellen.','ocean','🌬️','Küstenorden','Noah'],
 ['Bernsteinwald','Im Wald funkelt goldener Bernstein.','grass','🍂','Waldorden','Mia'],
 ['Flüsterdorf','Ein kleines Dorf voller Geheimnisse.','dark','🏘️','Dorforden','Leon'],
 ['Kristallsee','Funkelnde Kristalle am Seeufer.','ocean','💎','Kristallorden','Ada'],
 ['Vulkanpass','Lava glüht unter alten Brücken.','volcano','🌋','Flammenorden','Bruno'],
 ['Wolkenhöhe','Ein Gebirge über den Wolken – hier wartet die letzte Prüfung.','mountain','☁️','Wolkenorden','Champion Nova']
].map(([name,desc,theme,icon,badge,leader],index)=>({name,desc,theme,icon,badge,leader,index}));
// Thirty additional regions; the original ten indices, badges and save slots remain stable.
const EXTENDED_REGIONS=["Nebelfjord","Moossteppe","Sternenmoor","Kupferklippen","Tiefenriff","Glimmerhain","Sturmtal","Runenheide","Kristallgarten","Aschenküste","Nachtbucht","Silbergrat","Wüstenzirkel","Donnerfeld","Rosenwald","Nebelarchipel","Dunkelstadt","Korallenweg","Frostkuppel","Drachenhorst","Spiegelstadt","Traumwald","Himmelsmarkt","Mondruinen","Zeittal","Nullzone","Sternentor","Weltenbruch","Ursprungsinsel","Letzte Sphäre"];
const EXTENDED_LEADERS=["Mara","Bennet","Seren","Ruben","Nele","Liora","Storm","Rune","Kira","Ignis","Milo","Nora","Sahra","Vito","Rosa","Levi","Mora","Kora","Eira","Drako","Silva","Tara","Aris","Luna","Chronos","Null","Stella","Rex","Aurelia","Nova Ultima"];
EXTENDED_REGIONS.forEach((name,i)=>{const index=10+i,theme=['grass','ocean','mountain','dark','volcano'][i%5];AREAS.push({name,desc:'Eine neue Etappe der neun Risse.',theme,icon:['🌿','🌊','🏔️','🔮','🌋'][i%5],badge:'Kristallsiegel '+(index+1),leader:EXTENDED_LEADERS[i],index})});
const REGION_COUNT=AREAS.length;
const FINAL_ZONE=REGION_COUNT-1;
const AREA_STRENGTH=[
 {wild:[4,7], trainer:[5,7], gym:[8,10], gymSize:2},
 {wild:[6,9], trainer:[7,10], gym:[10,13], gymSize:2},
 {wild:[9,12], trainer:[10,13], gym:[13,16], gymSize:2},
 {wild:[12,15], trainer:[13,16], gym:[16,19], gymSize:3},
 {wild:[15,18], trainer:[16,19], gym:[19,22], gymSize:3},
 {wild:[18,21], trainer:[19,22], gym:[22,25], gymSize:3},
 {wild:[22,25], trainer:[23,26], gym:[26,29], gymSize:4},
 {wild:[26,29], trainer:[27,30], gym:[30,33], gymSize:4},
 {wild:[30,33], trainer:[31,34], gym:[34,38], gymSize:4},
 {wild:[34,38], trainer:[35,39], gym:[40,45], gymSize:5}
].slice(0,REGION_COUNT);
while(AREA_STRENGTH.length<REGION_COUNT){const z=AREA_STRENGTH.length,base=Math.min(143,36+Math.floor((z-9)*3.1));AREA_STRENGTH.push({wild:[base,Math.min(150,base+4)],trainer:[base+1,Math.min(150,base+5)],gym:[base+3,Math.min(150,base+8)],gymSize:Math.min(6,4+Math.floor(z/10))})}
const ITEM_INFO={ball:['AuriBall','🔴','Fange wilde AuriMon.',45],greatball:['Superball','🔵','Bessere Fangchance als mit AriBällen.',110],potion:['Trank','🧴','Heilt 35 KP.',55],superpotion:['Supertrank','💚','Heilt 85 KP.',125],revive:['Beleber','✨','Belebt ein besiegtes AuriMon.',200],candy:['EP-Bonbon','🍬','Schenkt einem AuriMon einen Levelaufstieg.',240],repel:['Schutz','🛡️','Verhindert 20 Schritte lang Zufallsbegegnungen.',95],Feuerstein:['Feuerstein','🔥','Für Feuer-Entwicklungen.',260],Wasserstein:['Wasserstein','💧','Für Wasser-Entwicklungen.',260],Donnerstein:['Donnerstein','⚡','Für Elektro-Entwicklungen.',260],Blattstein:['Blattstein','🍃','Für Pflanzen-Entwicklungen.',260],Mondstein:['Mondstein','🌙','Für besondere Entwicklungen.',260],'Tausch-Kabel':['Tausch-Kabel','🔗','Für Entwicklungen ohne zweiten Spieler.',300]};
// Type-specific ascension items, only consumed on explicitly confirmed levels 101–150.
const ELEMENT_TYPES=['Normal','Feuer','Wasser','Pflanze','Elektro','Eis','Kampf','Gift','Boden','Flug','Psycho','Käfer','Gestein','Geist','Drache','Unlicht','Stahl','Fee'];
const ELEMENT_EMOJIS=['⭐','🔥','💧','🌿','⚡','❄️','🥊','☠️','🌍','🪽','🔮','🐛','🪨','👻','🐉','🌑','⚙️','🧚'];
ELEMENT_TYPES.forEach((type,i)=>{ITEM_INFO['crystal_'+type]=[type+'kristall',ELEMENT_EMOJIS[i],'Für den Aufstieg eines '+type+'-Pokémon über Level 100.',0]});
// Every special evolution item belongs to the existing inventory and is sold in AuriMarkt.
for(const i of window.AuriEvolutionItems||[])ITEM_INFO[i.key]=[i.name,'💎','Für besondere Entwicklungen.',i.cost];
const START_BAG={ball:12,greatball:3,potion:5,superpotion:2,revive:1,candy:2,repel:1,Feuerstein:0,Wasserstein:0,Donnerstein:0,Blattstein:0,Mondstein:0,'Tausch-Kabel':0};
for(const i of window.AuriEvolutionItems||[])START_BAG[i.key]=0;
const TYPES={Feuer:{Pflanze:2,Eis:2,Käfer:2,Stahl:2,Wasser:.5,Feuer:.5,Gestein:.5,Drache:.5},Wasser:{Feuer:2,Boden:2,Gestein:2,Wasser:.5,Pflanze:.5,Drache:.5},Pflanze:{Wasser:2,Boden:2,Gestein:2,Feuer:.5,Pflanze:.5,Gift:.5,Flug:.5,Käfer:.5,Drache:.5,Stahl:.5},Elektro:{Wasser:2,Flug:2,Elektro:.5,Pflanze:.5,Drache:.5,Boden:0},Eis:{Pflanze:2,Boden:2,Flug:2,Drache:2,Wasser:.5,Eis:.5,Feuer:.5,Stahl:.5},Kampf:{Normal:2,Eis:2,Gestein:2,Stahl:2,Gift:.5,Flug:.5,Psycho:.5,Käfer:.5,Geist:0},Gift:{Pflanze:2,Gift:.5,Boden:.5,Gestein:.5,Geist:.5,Stahl:0},Boden:{Feuer:2,Elektro:2,Gift:2,Gestein:2,Stahl:2,Pflanze:.5,Käfer:.5,Flug:0},Flug:{Pflanze:2,Kampf:2,Käfer:2,Elektro:.5,Gestein:.5,Stahl:.5},Psycho:{Kampf:2,Gift:2,Psycho:.5,Stahl:.5},Käfer:{Pflanze:2,Psycho:2,Feuer:.5,Kampf:.5,Gift:.5,Flug:.5,Geist:.5,Stahl:.5},Gestein:{Feuer:2,Eis:2,Flug:2,Käfer:2,Kampf:.5,Boden:.5,Stahl:.5},Geist:{Geist:2,Psycho:2,Normal:0},Drache:{Drache:2,Stahl:.5},Stahl:{Eis:2,Gestein:2,Feuer:.5,Wasser:.5,Elektro:.5,Stahl:.5},Normal:{Gestein:.5,Stahl:.5,Geist:0}};
TYPES.Unlicht={Geist:2,Psycho:2,Kampf:.5,Unlicht:.5,Fee:.5};
TYPES.Fee={Kampf:2,Drache:2,Unlicht:2,Feuer:.5,Gift:.5,Stahl:.5};
const TYPE_MOVE={Normal:'Ruckzuckhieb',Feuer:'Glut',Wasser:'Aquaknarre',Pflanze:'Rankenhieb',Elektro:'Donnerschock',Eis:'Eisstrahl',Kampf:'Karateschlag',Gift:'Giftstachel',Boden:'Lehmschuss',Flug:'Windstoß',Psycho:'Konfusion',Käfer:'Käferbiss',Gestein:'Steinwurf',Geist:'Spukball',Drache:'Drachenpuls',Stahl:'Metallklaue',Fee:'Feenwind',Unlicht:'Biss'};
const TRAINER_NAMES=['Ben','Maja','Sami','Tess','Olli','Kim','Robin','Luca','Ava','Theo','Nina','Fritz','Nova','Juna','Kai','Jules','Sam','Jana','Milo','Yara'];
function hash(a,b,c){let x=((a+1)*214013+(b+5)*2531011+(c+11)*11749)>>>0; x=(Math.imul(x^(x>>>16),2246822519))>>>0;return(x^(x>>>13))>>>0}
const evoTo={}; D.forEach(p=>p.evol.forEach(e=>{evoTo[e.to]=p.id}));
function stage(id){let n=0;while(evoTo[id]&&n<4){id=evoTo[id];n++}return n}
const ZONE_POOLS=Array.from({length:REGION_COUNT},()=>[]);
// Verteile die 151 AuriMon zuverlässig auf die 10 Orte. Seltene und starke Arten tauchen eher später auf.
D.forEach(p=>{
 let z;
 if(p.id>=144) z=Math.max(0,REGION_COUNT-3)+((p.id-144)%Math.min(3,REGION_COUNT));
 else if([1,4,7,10,13,16,19,21,25,43,52,129,133].includes(p.id)) z=0;
 else {
  const tier=stage(p.id);
  if(tier===0) z=hash(p.id,4,7)%Math.max(1,REGION_COUNT-1);
  else if(tier===1) z=Math.min(FINAL_ZONE,1+hash(p.id,5,8)%Math.max(1,REGION_COUNT-1));
  else z=Math.max(0,REGION_COUNT-4)+hash(p.id,6,9)%Math.min(4,REGION_COUNT);
 }
 ZONE_POOLS[Math.max(0,Math.min(FINAL_ZONE,z))].push(p.id);
});
for(let z=0;z<REGION_COUNT;z++){
 const share=ZONE_POOLS[z];
 let next=z;
 while(share.length<12){
  const donor=(next+3)%REGION_COUNT;
  const copy=ZONE_POOLS[donor].find(id=>id<144&&!share.includes(id));
  if(copy)share.push(copy);
  next=(next+1)%REGION_COUNT;
  if(next===z)break;
 }
}
function sprite(id){return window.ARIMON_SPRITES?.[id]||''}
function art(id,cls=''){const p=POKE[id];const src=cls.includes('allyart')?(window.ARIMON_BATTLE_BACK?.[id]||sprite(id)):cls.includes('enemyart')?(window.ARIMON_BATTLE_FRONT?.[id]||sprite(id)):sprite(id)||'';
return `<div class="art ${cls} ${src?'has-src':''}"><span class="fallback" aria-hidden="true">${p?.symbol||'✨'}</span><img src="${src}" alt="${p?.name||'Pokémon'}" crossorigin="anonymous" loading="lazy" onload="this.parentElement.classList.add('loaded')" onerror="this.style.display='none';this.parentElement.classList.remove('loaded')"></div>`}
function newMon(id,lv){const level=clamp(lv,1,150);return{shiny:Math.random()<1/500,status:null,uid:'m'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),id,level,xp:0,hp:hpMax(id,level),bondSteps:state?.steps||0,gender:Math.random()<.5?'female':'male'}}
function hpMax(id,level){
 const base=window.POKEMON_BASESTATS?.[id]?.[0]||50;
 // Konstante DV 15, ohne EV: nachvollziehbare Form der modernen Pokémon-KP-Formel.
 return Math.floor((2*base+15)*level/100)+level+10;
}
function xpNeeded(lv,id){
 if(lv>=150)return Infinity;
 // Alle neun Starter-Generationen wachsen mittels Mittel-Langsam.
 // Legendäre und mysteriöse Pokémon werden über Art-Metadaten erkannt, nicht über ID-Schwellen.
 const starterRanges=[[1,9],[152,160],[252,260],[387,395],[495,503],[650,658],[722,730],[810,818],[906,914]];
 const starter=starterRanges.some(([first,last])=>id>=first&&id<=last);
 const rare=!!(POKE[id]?.legendary||POKE[id]?.mythical);
 function total(level){
  if(starter)return Math.max(0,Math.floor(1.2*level**3-15*level**2+100*level-140));
  if(rare)return Math.floor(1.25*level**3);
  return level**3;
 }
 return Math.max(1,total(lv+1)-total(lv));
}
function bagCount(id){return state.bag[id]||0}
function defaultState(){return{version:4,coins:350,bag:{...START_BAG},party:[],box:[],seen:[],caught:[],zone:0,x:5,y:6,facing:'up',steps:0,repelSteps:0,badges:[],trainerWins:[],found:[],visited:[0],battleWins:0,starterChosen:false,gameWon:false,activeUid:null,pendingEvol:[],created:Date.now()}}
function migrate(old){const s=defaultState();s.coins=old.coins??s.coins;s.bag.ball=old.balls??s.bag.ball;s.bag.potion=old.potions??s.bag.potion;s.zone=clamp(old.zone===3?2:old.zone||0,0,2);s.x=clamp(old.x??5,1,9);s.y=clamp(old.y??6,1,7);s.party=(old.owned||[]).slice(0,6).map(o=>{const p=newMon(o.id,o.level||5);return{...p,uid:o.uid||p.uid,xp:o.xp||0,hp:clamp(o.hp??p.hp,0,hpMax(p.id,p.level))}});s.box=(old.owned||[]).slice(6).map(o=>{const p=newMon(o.id,o.level||5);return{...p,uid:o.uid||p.uid,xp:o.xp||0,hp:clamp(o.hp??p.hp,0,hpMax(p.id,p.level))}});s.activeUid=s.party.find(p=>p.uid===old.activeUid)?.uid||s.party[0]?.uid||null;s.seen=(old.seen||[]).filter(i=>POKE[i]);s.caught=(old.caught||[]).filter(i=>POKE[i]);s.badges=(old.badges||[]).map((x,i)=>typeof x==='number'?x:i).filter(i=>i>=0&&i<REGION_COUNT);s.starterChosen=!!old.starterChosen||s.party.length>0;s.visited=[0,...Array.from({length:s.zone},(_,i)=>i+1)];return s}
let state,battle=null,modalOpen=false,currentPage='world',dexFilter='all',dexSearch='',dexShownLimit=60,toastTimer=null;
// Spielerprofile v4.3: Vor der Profilauswahl bleibt die Spielwelt neutral.
// Ältere Speicherstände werden später einmalig in Profil 1 KOPIERT (Original bleibt erhalten).
state=defaultState();
state={...defaultState(),...state,bag:{...START_BAG,...state.bag}};
for(const field of ['party','box','seen','caught','badges','trainerWins','found','visited','pendingEvol'])if(!Array.isArray(state[field]))state[field]=[];
state.zone=clamp(state.zone||0,0,FINAL_ZONE);state.x=clamp(state.x||5,0,10);state.y=clamp(state.y||6,0,8);
function save(){
 const profiles=window.PokemonProfiles;
 if(!profiles||!Number.isInteger(profiles.activeSlot)||profiles.activeSlot<1||profiles.activeSlot>6)return;
 try{state.updatedAt=Date.now();localStorage.setItem(profiles.slotKey(profiles.activeSlot),JSON.stringify(state))}
 catch(e){console.warn('Spielerprofil konnte nicht gespeichert werden',e);profiles.showStorageError?.()}
}
function seen(id){if(!state.seen.includes(id))state.seen.push(id)}
function caught(id){seen(id);if(!state.caught.includes(id))state.caught.push(id)}
function active(){return state.party.find(p=>p.uid===state.activeUid)||state.party[0]||null}
function living(){return state.party.filter(p=>p.hp>0)}
function chooseAlive(){const a=active();if(a&&a.hp>0)return a;const other=living()[0];if(other){state.activeUid=other.uid;return other}return null}
function allMons(){return state.party.concat(state.box)}
function mon(uid){return allMons().find(p=>p.uid===uid)}
function hpPercent(m){return clamp(Math.round(100*m.hp/hpMax(m.id,m.level)),0,100)}
function gainItem(id,num=1){state.bag[id]=(state.bag[id]||0)+num;save()}
function toast(str){const el=$('toast');el.textContent=str;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2700)}
function openModal(html){modalOpen=true;$('modal-content').innerHTML=html;$('modal-overlay').classList.remove('hidden')}
function closeModal(){if(!state.starterChosen)return;modalOpen=false;$('modal-overlay').classList.add('hidden');$('modal-content').innerHTML=''}
function modal(title,text,buttons=[['Schließen','close']]){openModal(`<h2>${title}</h2><p>${text}</p><div class="dialog-actions">${buttons.map(([t,a,c])=>`<button class="btn ${c||''}" data-action="${a}">${t}</button>`).join('')}</div>`)}
function start(){render();if(!state.starterChosen)starterScreen();else if(state.party.length===0)starterScreen()}
function starterScreen(){openModal(`<div class="eyebrow">HALLO, TRAINER! 👋</div><h2>Dein Abenteuer beginnt!</h2><p>Professorin Mira hat drei besondere AuriMon für dich. Wähle deinen ersten Freund und beginne deine Reise durch 40 Regionen mit insgesamt 200 Gebieten!</p><div class="starter-grid">${[1,4,7].map(id=>`<button class="starter" data-action="starter" data-id="${id}">${art(id)}<b>${POKE[id].name}</b><small>${POKE[id].types[0]}</small></button>`).join('')}</div><p class="muted">Du kannst später alle 1.025 Pokémon aus Generation 1–9 entdecken und weiterentwickeln. Der Spielstand bleibt auf deinem Gerät gespeichert.</p>`)}
function chooseStarter(id){if(state.starterChosen||![1,4,7].includes(id))return;const m=newMon(id,6);state.party.push(m);state.activeUid=m.uid;state.starterChosen=true;caught(id);closeModal();modal('🌟 Los geht’s!',`<b>${POKE[id].name}</b> ist jetzt dein Begleiter! Professorin Mira schenkt dir außerdem zwölf AriBälle. Folge dem Weg, erkunde Grasfelder und suche die erste Prüfhalle.`,[['Auf ins Abenteuer!','close','gold']]);render()}
function switchPage(page){if(battle||modalOpen)return;currentPage=page;document.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id==='page-'+page));document.querySelectorAll('.tabs button').forEach(e=>e.classList.toggle('selected',e.dataset.page===page));renderPage();$('.main')?.scrollTo?.(0,0)}
function renderPage(){if(currentPage==='team')renderTeam();if(currentPage==='dex')renderDex();if(currentPage==='bag')renderBag();if(currentPage==='travel')renderTravel()}
function render(){if(!state.starterChosen){$('coins').textContent=state.coins;$('balls').textContent=bagCount('ball');return}
 $('coins').textContent=state.coins;$('balls').textContent=bagCount('ball');$('badge-total').textContent=state.badges.length+' / '+REGION_COUNT;$('zone-step').textContent='ORT '+String(state.zone+1).padStart(2,'0')+' / '+REGION_COUNT;$('zone-name').textContent=AREAS[state.zone].name;$('zone-desc').textContent=AREAS[state.zone].desc;
 $('goal-title').textContent=state.gameWon?'👑 Champion!':state.badges.includes(state.zone)?'Entdecke neue AuriMon!':'Besiege '+AREAS[state.zone].leader;
 $('goal-desc').textContent=state.gameWon?'Alle '+REGION_COUNT+' Siegel! Vervollständige den AuriDex.':state.badges.includes(state.zone)?'Nächstes Ziel: '+(AREAS[state.zone+1]?.name||'AuriDex vervollständigen'):'Prüfhalle finden, trainieren und den Siegel gewinnen.';
 renderMap();renderPage();save()}
// 10 reproduzierbare Pixelkarten mit Wegekreuz, Gebäuden, Fundgegenständen und Trainern.
const MIN_W=11,MIN_H=9;
function getGround(z,x,y){
 if(x===0||x===10){return y===4?'portal':'tree'}
 if(y===0||y===8)return AREAS[z].theme==='mountain'||AREAS[z].theme==='dark'?'rock':'tree';
 if(y===4||x===5||y===3&&x>=2&&x<=9)return 'path';
 if(x===2&&y===2)return 'center';if(x===3&&y===6)return 'market';if(x===8&&y===2)return 'gym';
 if(x===5&&y===6)return 'path';if(x===5&&y===5)return 'path';if(x===3&&y===5)return 'path';if(x===8&&y===3)return 'path';
 const rnd=hash(z,x,y)%100;
 if(rnd<13)return (AREAS[z].theme==='ocean'&&rnd<8)?'water':(AREAS[z].theme==='mountain'||AREAS[z].theme==='volcano')?'rock':'tree';
 return rnd<74?'wild':'grass'
}
function trainers(z){const spots=[[4,2],[7,6],[2,6],[9,6]],count=z>=Math.ceil(REGION_COUNT/2)?3:2;return spots.slice(0,count).map(([x,y],j)=>({id:`${z}:${j}`,x,y,j,name:TRAINER_NAMES[(z*3+j*5)%TRAINER_NAMES.length],defeated:state.trainerWins.includes(`${z}:${j}`)}))}
function drops(z){const coords=[[7,2],[1,6],[8,6],[4,7]],kinds=['ball','potion','candy','greatball','revive','superpotion','repel',...Object.keys(ITEM_INFO).filter(k=>k.endsWith('stein')||k==='Tausch-Kabel')];return coords.map(([x,y],n)=>({id:`${z}:${n}`,x,y,item:kinds[(z*5+n*3)%kinds.length],picked:state.found.includes(`${z}:${n}`)}))}
function atPosition(z,x,y){if(x===5&&y===6&&z===0)return 'path';const trainersHere=trainers(z).find(p=>p.x===x&&p.y===y);if(trainersHere)return 'trainer';const d=drops(z).find(p=>!p.picked&&p.x===x&&p.y===y);if(d)return 'loot';return getGround(z,x,y)}
function renderMap(){const z=state.zone,map=$('game-map');map.className='map '+AREAS[z].theme;let html='';for(let y=0;y<MIN_H;y++)for(let x=0;x<MIN_W;x++){
 const tile=atPosition(z,x,y),hero=state.x===x&&state.y===y,trainer=trainers(z).find(p=>p.x===x&&p.y===y);
 const back={up:[0,1],down:[0,-1],left:[1,0],right:[-1,0]}[state.facing]||[0,1],buddy=state.x+back[0]===x&&state.y+back[1]===y&&state.party.length>0&&!['rock','wall','water','tree'].includes(tile);
 let special='';if(trainer)special=`<span class="actor personactor" title="Trainer ${trainer.name}"></span>`;
 else if(tile==='loot')special='<span class="actor glow" aria-hidden="true">✦</span>';
 else if(tile==='gym')special=z===FINAL_ZONE?'<span class="actor" aria-hidden="true">👑</span>':'';
 else if(tile==='portal')special='<span class="actor" aria-hidden="true">↔️</span>';
 if(buddy)special+=`<span class="buddyactor" aria-label="Begleiter ${POKE[active().id].name}">${POKE[active().id].symbol}</span>`;
 if(hero)special+='<span class="actor heroactor" aria-hidden="true"></span>';
 html+=`<button class="cell ${tile} ${hero?'player':''}" aria-label="${hero?'Spielfigur, ':''}${tile==='trainer'?'Trainer '+trainer.name:tile}" data-x="${x}" data-y="${y}"><span class="ornament"></span>${special}</button>`;
 }map.innerHTML=html}
function enterZone(z){if(z<0||z>=REGION_COUNT){toast('⛔ Hier endet der Weg.');return}if(z>state.badges.length){toast('🔒 Gewinne erst das Siegel dieser Region!');return}state.zone=z;state.x=z>state.zone?1:5;state.x=5;state.y=4;if(!state.visited.includes(z))state.visited.push(z);toast(`${AREAS[z].icon} ${AREAS[z].name} entdeckt!`);currentPage='world';document.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id==='page-world'));document.querySelectorAll('.tabs button').forEach(e=>e.classList.toggle('selected',e.dataset.page==='world'));render()}
function walk(dx,dy){if(modalOpen||battle||!state.starterChosen||currentPage!=='world')return;const nx=state.x+dx,ny=state.y+dy;
 state.facing=dx>0?'right':dx<0?'left':dy>0?'down':'up';
 if(nx<0||ny<0||nx>=MIN_W||ny>=MIN_H){toast('⛔ Kein Weg!');return}
 const t=atPosition(state.zone,nx,ny);
 if(['tree','rock','wall','water'].includes(t)){toast('🌳 Hier kommst du nicht durch.');return}
 if(t==='portal'){const dest=state.zone+(nx===10?1:-1);if(dest>=0&&dest<REGION_COUNT&&dest<=state.badges.length){enterZone(dest);state.x=nx===10?1:9;state.y=4;render()}else toast(dest>state.zone?'🔒 Erst den Prüfhalleorden verdienen!':'⛔ Hier ist der Anfang deiner Reise.');return}
 state.x=nx;state.y=ny;state.steps++;if(state.repelSteps>0)state.repelSteps--;
 if(t==='loot'){pickupHere();render();return}
 if(t==='trainer'){trainerHere();render();return}
 if(t==='center'){healCenter();render();return}
 if(t==='market'){showShop();render();return}
 if(t==='gym'){enterGym();render();return}
 if((t==='wild'&&Math.random()<.24)||(t==='grass'&&Math.random()<.04))if(state.repelSteps===0)startWild();
 render()
}
function interact(){if(modalOpen||battle)return;const here=atPosition(state.zone,state.x,state.y);if(here==='market')return showShop();if(here==='center')return healCenter();if(here==='gym')return enterGym();if(here==='trainer')return trainerHere();if(here==='loot')return pickupHere();
 const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]},[dx,dy]=dirs[state.facing]||[0,-1];const x=state.x+dx,y=state.y+dy;if(x>=0&&x<11&&y>=0&&y<9){const t=atPosition(state.zone,x,y);if(t==='trainer'){const n=trainers(state.zone).find(n=>n.x===x&&n.y===y);return interactTrainer(n)}if(t==='gym')return enterGym();if(t==='market')return showShop();if(t==='center')return healCenter();if(t==='loot'){state.x=x;state.y=y;return pickupHere()}}
 modal('🧭 Trainer-Tipp',`Du bist in <b>${AREAS[state.zone].name}</b>. Betritt hohes Gras für wilde AuriMon, sammle glitzernde Gegenstände, sprich Trainer an und besiege den Prüfhallenleiter.`,[['Verstanden','close']])}
function healCenter(){state.party.forEach(p=>p.hp=hpMax(p.id,p.level));toast('💚 Dein gesamtes Team ist geheilt!');save();render()}
function pickupHere(){const d=drops(state.zone).find(d=>d.x===state.x&&d.y===state.y&&!d.picked);if(!d)return;state.found.push(d.id);const n=d.item==='ball'?rand(2,5):1;gainItem(d.item,n);state.coins+=rand(20,65);toast(`✨ Gefunden: ${ITEM_INFO[d.item][0]} ×${n}!`);render()}
function zonePool(z){return ZONE_POOLS[z]}
function randomWild(z){const ids=zonePool(z),range=AREA_STRENGTH[z]||AREA_STRENGTH[FINAL_ZONE];const possible=ids.filter(i=>i<144||Math.random()<.15);const id=choice(possible.length?possible:ids);return newMon(id,rand(range.wild[0],range.wild[1]))}
function startWild(){if(!chooseAlive()){healCenter();return}const foe=randomWild(state.zone);seen(foe.id);startBattle('wild',[foe],'Wildes '+POKE[foe.id].name,'wild:'+state.zone,0)}
function trainerHere(){const n=trainers(state.zone).find(n=>n.x===state.x&&n.y===state.y);if(n)interactTrainer(n)}
function trainerParty(z,j){const ids=ZONE_POOLS[z],range=AREA_STRENGTH[z]||AREA_STRENGTH[FINAL_ZONE],num=Math.min(4,2+Math.floor(z/3)+(j%2));return Array.from({length:num},(_,i)=>newMon(ids[(hash(z,j,i)%ids.length)],Math.round(range.trainer[0]+i*1.2)))}
function interactTrainer(n){if(!n)return;if(n.defeated){modal('🤝 Trainer '+n.name,`„Du hast mich schon besiegt! Aber ich kämpfe gern wieder gegen dich!“`,[['Nochmal kämpfen','rematch:'+n.id,'gold'],['Später','close']]);return}modal('⚔️ Trainer '+n.name,`„Hey, du! Ich trainiere hier in ${AREAS[state.zone].name}. Möchtest du gegen mein Team antreten?“`,[['Kämpfen!','trainer:'+n.id,'gold'],['Noch nicht','close']])}
function battleTrainer(id){closeModal();const [z,j]=id.split(':').map(Number);const n=trainers(z).find(n=>n.j===j);if(!n)return;startBattle('trainer',trainerParty(z,j),'Trainer '+n.name,id,110+z*38)}
function gymParty(z){const ids=ZONE_POOLS[z],range=AREA_STRENGTH[z]||AREA_STRENGTH[FINAL_ZONE],num=z===FINAL_ZONE?6:(range.gymSize||4);const all=[...ids,...ZONE_POOLS[Math.max(0,z-1)]];return Array.from({length:num},(_,i)=>newMon(all[(hash(z,i,47)+i)%all.length],Math.min(150,range.gym[0]+i*2)))}
function enterGym(){
  const z=state.zone,range=AREA_STRENGTH[z]||AREA_STRENGTH[FINAL_ZONE];
  if(state.badges.includes(z)){
    modal('🏅 '+AREAS[z].badge,`Du hast das Siegel von ${AREAS[z].leader} schon gewonnen. Möchtest du den Prüfhallenleiter noch einmal herausfordern?`,[['Revanche','gym:'+z,'gold'],['Zurück','close']]);
    return;
  }
  if(!chooseAlive()){toast('💚 Heile dein Team im AuriCenter!');return}
  const atArena=window.PokemonGame?.world50?.getStage?.()===z*5+4;
  const baseLevel=z<10?[11,20,30,40,50,60,70,80,90,96][z]:Math.min(147,95+Math.floor((z-9)*1.7));
  const teamSize=z===FINAL_ZONE?6:(range.gymSize||4);
  const recommendedMin=atArena?baseLevel:range.gym[0];
  const recommendedMax=atArena?Math.min(150,baseLevel+teamSize-1):Math.min(150,range.gym[0]+(teamSize-1)*2);
  const finale=z===FINAL_ZONE;
  modal(finale?'👑 Die letzte Prüfung':'🏟️ Prüfhalle von '+AREAS[z].name,
    `<b>${AREAS[z].leader}</b> wartet auf dich! ${finale?'Der Champion setzt <b>sechs</b> mächtige AuriMon ein.':'Sieg bedeutet den '+AREAS[z].badge+' und Zugang zum nächsten Ort.'}<p>Empfohlenes Level: <b>${recommendedMin}–${recommendedMax}</b>.</p>`,
    [['Herausfordern','gym:'+z,'gold'],['Erst trainieren','close']]);
}
function battleGym(z){closeModal();startBattle(z===FINAL_ZONE?'boss':'gym',gymParty(z),AREAS[z].leader,'gym:'+z,Math.round(220+z*140))}
function showShop(){const entries=['ball','greatball','potion','superpotion','revive','candy','repel','Feuerstein','Wasserstein','Donnerstein','Blattstein','Mondstein','Tausch-Kabel'];openModal(`<h2>🏪 AuriMarkt</h2><p>Du hast 🪙 <b>${state.coins}</b>. Trainerkämpfe und Arenen bringen neue Münzen!</p>${entries.map(id=>{const [name,icon,,price]=ITEM_INFO[id];return `<div class="bag-entry"><span class="item-emoji">${icon}</span><span class="meta"><b>${name}</b><small>🪙 ${price} · Im Rucksack: ${bagCount(id)}</small></span><button class="smallbtn gold" data-action="buy:${id}">Kaufen</button></div>`}).join('')}<div class="dialog-actions"><button class="btn ghost" data-action="close">Zurück</button></div>`)}
function purchase(id){const meta=ITEM_INFO[id];if(!meta)return;if(state.coins<meta[3]){toast('🪙 Nicht genug Münzen.');return}state.coins-=meta[3];gainItem(id);toast('🛍️ '+meta[0]+' gekauft!');showShop();render()}
function showGuide(){modal('📜 Trainerhandbuch',`<b>🗺️ Karte:</b> Mit Pfeiltasten, WASD oder dem Steuerkreuz bewegen. A = ansprechen. Links und rechts stehen Wege zu anderen Orten.<p><b>🌿 Fangen:</b> Im hohen Gras findest du wilde AuriMon. Schwäche sie im Kampf und wirf einen AuriBall.</p><p><b>⚔️ Kämpfen:</b> Jeder Sieg bringt Erfahrungspunkte (EP) und manchmal Items. Nutze Typenvorteile.</p><p><b>✨ Entwicklung:</b> Level-Entwicklungen sind im Team verfügbar, sobald das Level erreicht ist. Für andere brauchst du Entwicklungssteine oder ein Tausch-Kabel.</p><p><b>🏅 Ziel:</b> Besiege alle 40 Arenen; die letzte wird vom Champion mit sechs AuriMon bewacht. Versuche, alle 1.025 Pokémon im AuriDex zu sammeln!</p>`,[['Alles klar!','close','gold']])}
// Team-basierte Kämpfe: 6 eigene AuriMon, Trainerteams und der finale Fünferboss.
function startBattle(kind,enemies,name,key,reward){if(!chooseAlive()){healCenter();return}battle={kind,enemies,index:0,name,key,reward,log:kind==='wild'?'Ein wildes AuriMon taucht auf!':name+' fordert dich zum Kampf!',turn:0,finished:false};seen(enemies[0].id);$('battle-overlay').classList.remove('hidden');renderBattle();save()}
function foe(){return battle?.enemies[battle.index]||null}
function effectiveness(att,def){return def.reduce((p,t)=>p*(TYPES[att]?.[t]??1),1)}
function damage(attacker,target,type,boost=false){
 return aurimonDamage(attacker,target,{name:TYPE_MOVE[type]||'Tackle',type,power:boost?70:40},'Klar');
}
function typeMessage(mult){return mult===0?' Ohne Wirkung!':mult>=2?' Sehr effektiv!':mult<1?' Nicht sehr effektiv.':''}
function renderBattle(){if(!battle)return;const e=foe(),a=chooseAlive();if(!e||!a)return;const wild=battle.kind==='wild';$('battle-content').innerHTML=`<div class="battletop"><b>${battle.kind==='boss'?'👑 CHAMPION-FINALE':wild?'🌿 WILDES AURIMON':'⚔️ TRAINERKAMPF'}</b><span>${battle.name} · ${battle.index+1}/${battle.enemies.length}</span></div>
 <div class="arena">${art(e.id,'enemyart')}${art(a.id,'allyart')}<div class="battlemon enemylabel"><b>${POKE[e.id].name}</b> · Lv.${e.level}<div class="hpbar"><span style="width:${hpPercent(e)}%"></span></div><small>KP ${Math.ceil(e.hp)} / ${hpMax(e.id,e.level)}</small></div><div class="battlemon allylabel"><b>${POKE[a.id].name}</b> · Lv.${a.level}<div class="hpbar"><span style="width:${hpPercent(a)}%"></span></div><small>KP ${Math.ceil(a.hp)} / ${hpMax(a.id,a.level)}</small></div></div>
 <div class="battlelog">${battle.log}</div><div class="battleactions"><button class="attack" data-battle="attack:Normal">👊 Ruckzuckhieb</button><button class="special" data-battle="attack:${POKE[a.id].types[0]}">${POKE[a.id].symbol} ${TYPE_MOVE[POKE[a.id].types[0]]||'Spezialangriff'}</button><button data-battle="heal">🧴 Trank (${bagCount('potion')})</button><button data-battle="heal-super">💚 Supertrank (${bagCount('superpotion')})</button><button data-battle="throw:ball" ${wild&&bagCount('ball')?'':'disabled'}>🔴 AuriBall (${bagCount('ball')})</button><button data-battle="throw:greatball" ${wild&&bagCount('greatball')?'':'disabled'}>🔵 Superball (${bagCount('greatball')})</button><button data-battle="switch">🔄 AuriMon wechseln</button><button data-battle="flee" ${!wild?'disabled':''}>🏃 Fliehen</button></div>`}
function battleAttack(type){if(!battle)return;const a=chooseAlive(),e=foe();if(!a||!e)return;const boost=type!=='Normal';let hit=damage(a,e,type,boost);e.hp=Math.max(0,e.hp-hit.amount);battle.log=`${POKE[a.id].name} nutzt ${boost?TYPE_MOVE[type]:'Ruckzuckhieb'}! ${hit.amount} Schaden.${typeMessage(hit.mult)}${hit.crit?' Volltreffer!':''}`;
 if(e.hp<=0){defeatEnemy();return}enemyTurn();renderBattle();save()}
function enemyTurn(prefix=''){if(!battle)return;const e=foe(),a=chooseAlive();if(!a)return;const type=Math.random()<.7?POKE[e.id].types[0]:'Normal';let hit=damage(e,a,type,type!=='Normal');hit.amount=Math.max(1,Math.round(hit.amount*.72));a.hp=Math.max(0,a.hp-hit.amount);battle.log=(prefix?prefix+' ':'')+battle.log+` ${POKE[e.id].name} greift an (${hit.amount} KP).`;
 if(a.hp<=0){battle.log+=` ${POKE[a.id].name} ist kampfunfähig!`;if(!living().length){battleDefeat();return}const fresh=living()[0];state.activeUid=fresh.uid;battle.log+=` ${POKE[fresh.id].name} übernimmt!`}}
function defeatEnemy(){const e=foe(),a=chooseAlive();if(!a)return;const xp=12+e.level*10+(battle.kind==='wild'?0:25);gainXP(a,xp);battle.log=`🏆 ${POKE[e.id].name} besiegt! ${POKE[a.id].name} erhält ${xp} EP.`;
 if(battle.index+1<battle.enemies.length){battle.index++;seen(foe().id);battle.log+=` ${battle.name} schickt ${POKE[foe().id].name} in den Kampf!`;renderBattle();save();return}
 battleVictory()}
function gainXP(p,amount){if(p.level>=150)return;p.xp+=amount;let raises=0;while(p.level<100&&p.xp>=xpNeeded(p.level,p.id)){p.xp-=xpNeeded(p.level,p.id);p.level++;raises++;p.hp=Math.min(hpMax(p.id,p.level),p.hp+hpMax(p.id,p.level)-hpMax(p.id,p.level-1));const evo=POKE[p.id].evol.filter(e=>e.kind==='level'&&p.level>=e.at);if(evo.length&&!state.pendingEvol.includes(p.uid))state.pendingEvol.push(p.uid)}if(p.level>=100)p.xp=Math.min(p.xp,xpNeeded(p.level,p.id));if(raises)toast(`🌟 ${POKE[p.id].name} erreicht Level ${p.level}!`)}
function battleVictory(){const b=battle;if(!b)return;let label='🏆 Gewonnen!';if(b.kind==='trainer'){if(!state.trainerWins.includes(b.key))state.trainerWins.push(b.key);state.coins+=b.reward;state.battleWins++;if(Math.random()<.4)gainItem('candy');label=`🏆 ${b.name} besiegt! +${b.reward} Münzen.`}
 if(b.kind==='gym'||b.kind==='boss'){const z=Number(b.key.slice(4));if(!state.badges.includes(z)){state.badges.push(z);state.badges.sort((a,b)=>a-b);state.coins+=b.reward;gainItem(z%3===0?'candy':z%3===1?'greatball':'superpotion',2);label=`🏅 ${AREAS[z].badge} gewonnen! +${b.reward} Münzen.`;if(z===FINAL_ZONE){state.gameWon=true;label='👑 Du bist Champion! Alle '+REGION_COUNT+' Siegel gewonnen!'}}else{const bonus=Math.round(b.reward/2);state.coins+=bonus;label=`🏆 Revanche gewonnen! +${bonus} Münzen.`}state.battleWins++;state.party.forEach(p=>{if(p.hp>0)p.hp=Math.min(hpMax(p.id,p.level),p.hp+Math.round(hpMax(p.id,p.level)*.25))})}
 if(b.kind==='wild'){state.coins+=rand(8,25);state.battleWins++}
 battle=null;$('battle-overlay').classList.add('hidden');save();render();modal('🎉 '+(b.kind==='boss'?'Großes Finale!':'Sieg!'),`<b>${label}</b>${state.pendingEvol.length?'<p>✨ Eines deiner AuriMon kann sich jetzt entwickeln! Schau in deinem Team nach.</p>':''}${b.kind==='boss'?'<p>Du hast den letzten Boss mit seinen sechs AuriMon besiegt. Du bist der Champion der ganzen Welt! Die Reise geht weiter: Fange alle 1.025 Pokémon und vervollständige deinen AuriDex.</p>':''}`,[['Weiterreisen','close','gold']]);}
function battleDefeat(){battle=null;$('battle-overlay').classList.add('hidden');const loss=Math.min(state.coins,Math.max(25,Math.floor(state.coins*.08)));state.coins-=loss;state.party.forEach(p=>p.hp=hpMax(p.id,p.level));state.x=5;state.y=4;save();render();modal('💚 Kein Problem!',`Dein Team wurde im AuriCenter wieder fit gemacht. Du hast ${loss} Münzen verloren. Trainiere deine AuriMon, nutze Tränke und versuche es erneut!`,[['Nochmal versuchen','close']])}
function useHealBattle(superHeal){if(!battle)return;const a=chooseAlive();const id=superHeal?'superpotion':'potion',amt=superHeal?85:35;if(!bagCount(id)){toast('Kein Trank mehr!');return}if(a.hp===hpMax(a.id,a.level)){toast('Dein AuriMon hat volle KP!');return}state.bag[id]--;a.hp=Math.min(hpMax(a.id,a.level),a.hp+amt);enemyTurn(`🧴 ${ITEM_INFO[id][0]} wirkt!`);if(battle)renderBattle();save()}
function throwBall(id){if(!battle||battle.kind!=='wild'||!bagCount(id))return;state.bag[id]--;const e=foe(),loss=1-e.hp/hpMax(e.id,e.level);const legendary=POKE[e.id]?.legendary||POKE[e.id]?.mythical||e.id>=144&&e.id<=151;const chance=clamp((legendary?.035:.25)+loss*.57+(id==='greatball'?.24:0),.025,.92);if(Math.random()<chance){caught(e.id);const size=state.party.length<6?'party':'box';state[size].push(e);gainXP(chooseAlive(),Math.round(e.level*4));battle=null;$('battle-overlay').classList.add('hidden');save();render();modal('🎊 AuriMon gefangen!',`${art(e.id)}<b>${POKE[e.id].name}</b> (Level ${e.level}) gehört jetzt zu deinem Team! ${size==='box'?'Es wartet in deiner AuriMon-Box.':'Es reist ab sofort mit dir.'}`,[['Weiter!','close','gold']]);return}
 battle.log='Oh nein! '+POKE[e.id].name+' ist aus dem Ball ausgebrochen!';enemyTurn();if(battle)renderBattle();save()}
function flee(){if(!battle||battle.kind!=='wild')return;if(Math.random()<.82){battle=null;$('battle-overlay').classList.add('hidden');toast('🏃 Sicher entkommen!');render()}else{battle.log='Flucht gescheitert!';enemyTurn();if(battle)renderBattle()}}
function switchBattle(){if(!battle)return;const p=state.party.filter(p=>p.hp>0);openModal(`<h2>🔄 AuriMon wechseln</h2><p>Wer soll als Nächstes kämpfen?</p>${p.map(m=>`<div class="bag-entry">${art(m.id,'thumb')}<span class="meta"><b>${POKE[m.id].name}</b><small>Lv.${m.level} · ${m.hp}/${hpMax(m.id,m.level)} KP</small></span><button class="smallbtn" data-action="bswitch:${m.uid}" ${m.uid===state.activeUid?'disabled':''}>Wählen</button></div>`).join('')}<button class="btn ghost" data-action="close">Zurück</button>`)}
function battleSwitch(uid){const m=state.party.find(p=>p.uid===uid&&p.hp>0);if(!m||!battle)return;state.activeUid=m.uid;closeModal();battle.log=POKE[m.id].name+' ist jetzt im Einsatz!';enemyTurn();if(battle)renderBattle();save()}
// Team, Box und ausnahmslos alle in Kanto verfügbaren Entwicklungen.
function bondSteps(p){if(!Number.isInteger(p.bondSteps))p.bondSteps=state.steps||0;return Math.max(0,(state.steps||0)-p.bondSteps)}
function evolutionReason(p,e){
 if(e.kind==='trial')return e.note||'Besondere Entwicklung folgt in einem Update';
 if(e.at&&p.level<e.at)return 'Benötigt Level '+e.at;
 if(e.time){const h=new Date().getHours();if(e.time==='day'&&(h<7||h>=20))return 'Nur tagsüber (7–20 Uhr)';
   if(e.time==='night'&&h>=7&&h<20)return 'Nur nachts (20–7 Uhr)';}
 if(e.gender){const g=p.gender|| (String(p.uid).length%2===0?'female':'male');
   if((e.gender===1?'female':'male')!==g)return e.gender===1?'Nur weibliche Pokémon':'Nur männliche Pokémon'}
 if(e.bond&&bondSteps(p)<e.bond)return 'Freundschaft: '+bondSteps(p)+' / '+e.bond+' gemeinsame Schritte';
 if(e.kind==='item'&&(!e.item||!bagCount(e.item)))return 'Benötigt '+(ITEM_INFO[e.item]?.[0]||'Evolutionsitem');
 if(e.kind==='trade'&&!bagCount('Tausch-Kabel'))return 'Benötigt Tausch-Kabel';
 if(e.heldItem&&!bagCount(e.heldItem))return 'Benötigt '+(ITEM_INFO[e.heldItem]?.[0]||'Tauschitem');
 return null;
}
function evolutionOptions(p){return POKE[p.id].evol.filter(e=>!evolutionReason(p,e))}
function evolutionLabel(p,e){
 const parts=[];
 if(e.at)parts.push('Ab Lv. '+e.at);
 if(e.bond)parts.push('Freundschaft: '+Math.min(e.bond,bondSteps(p))+'/'+e.bond+' Schritte');
 if(e.time)parts.push(e.time==='day'?'Tagsüber':'Nachts');
 if(e.kind==='trade')parts.push('Tausch-Kabel');
 if(e.item)parts.push((ITEM_INFO[e.item]?.[0]||'Evolutionsitem')+' ×'+bagCount(e.item));
 if(e.heldItem)parts.push((ITEM_INFO[e.heldItem]?.[0]||'Tauschitem')+' ×'+bagCount(e.heldItem));
 return parts.join(' · ')||'Besondere Entwicklung';
}
function allEvolutionOptions(p){return POKE[p.id].evol}
function renderTeam(){const arr=state.party;const el=$('team-list');el.innerHTML=arr.map((m,i)=>{const evol=allEvolutionOptions(m),options=evolutionOptions(m);return `<div class="card"><div class="poke-row">${art(m.id)}<div class="poke-desc"><strong>${m.uid===state.activeUid?'⭐ ':''}${POKE[m.id].name} <span class="muted">Lv.${m.level}</span></strong><span class="muted">${POKE[m.id].types.join(' / ')} · KP ${m.hp}/${hpMax(m.id,m.level)}</span><div class="hpbar"><span style="width:${hpPercent(m)}%"></span></div><div class="xpbar"><span style="width:${Math.round(100*m.xp/xpNeeded(m.level,m.id))}%"></span></div><span class="muted">${m.level<150?`${m.xp}/${xpNeeded(m.level,m.id)} EP${m.level>=100?' · 💎 Kristall-Aufstieg':''}`:'MAX. LEVEL'}</span></div></div><div class="rowactions"><button class="smallbtn" data-action="lead:${m.uid}" ${m.uid===state.activeUid?'disabled':''}>⭐ Anführer</button><button class="smallbtn gold" data-action="item-menu:${m.uid}">🎒 Item</button>${evol.length?`<button class="smallbtn ${options.length?'gold':''}" data-action="evolve-menu:${m.uid}">✨ Entwicklung</button>`:''}${arr.length>1?`<button class="smallbtn" data-action="deposit:${m.uid}">📦 Box</button>`:''}</div></div>`}).join('');$('box-count').textContent=state.box.length+' AuriMon';$('box-list').innerHTML=state.box.length?state.box.map(m=>`<div class="boxpoke">${art(m.id)}<b>${POKE[m.id].name}</b><small>Level ${m.level}</small><button class="smallbtn" data-action="withdraw:${m.uid}" ${state.party.length>=6?'disabled':''}>Ins Team</button></div>`).join(''):'<p class="muted">Deine AuriMon-Box ist noch leer.</p>'}
function setLeader(uid){const p=state.party.find(p=>p.uid===uid);if(p){state.activeUid=uid;toast(`⭐ ${POKE[p.id].name} ist jetzt Anführer!`);render()}}
function deposit(uid){if(state.party.length<2){toast('Mindestens ein AuriMon muss im Team sein.');return}const i=state.party.findIndex(m=>m.uid===uid);if(i<0)return;state.box.push(state.party.splice(i,1)[0]);if(state.activeUid===uid)state.activeUid=state.party[0].uid;render()}
function withdraw(uid){if(state.party.length>=6){toast('Dein Team ist voll!');return}const i=state.box.findIndex(m=>m.uid===uid);if(i<0)return;state.party.push(state.box.splice(i,1)[0]);render()}
function showEvolutions(uid){const m=mon(uid);if(!m)return;const options=allEvolutionOptions(m);
 openModal(`<h2>✨ ${POKE[m.id].name} entwickeln</h2><p>Für jede Entwicklung musst du ihre Bedingungen erfüllen. Bereits gefangene Pokémon bleiben erhalten.</p>
 ${options.length?options.map(e=>{const reason=evolutionReason(m,e);return `<div class="bag-entry">${art(e.to,'thumb')}<span class="meta"><b>${POKE[e.to].name}</b><small>${evolutionLabel(m,e)}${reason?' · 🔒 '+reason:' · ✅ Bereit'}</small></span><button class="smallbtn gold" data-action="evolve:${uid}:${e.to}" ${reason?'disabled':''}>Entwickeln</button></div>`}).join(''):'<p>Keine weitere Entwicklung für diese Art vorhanden.</p>'}
 <button class="btn ghost" data-action="close">Zurück</button>`)}
function evolve(uid,to){const p=mon(uid);if(!p)return;const e=POKE[p.id].evol.find(e=>e.to===to);if(!e)return;const reason=evolutionReason(p,e);if(reason){toast('🔒 '+reason);return}if(e.kind==='item'&&e.item)state.bag[e.item]--;if(e.kind==='trade')state.bag['Tausch-Kabel']--;if(e.heldItem)state.bag[e.heldItem]--;const prev=POKE[p.id].name;const oldMax=hpMax(p.id,p.level);p.id=to;p.moves=null;p.hp=clamp(p.hp+hpMax(p.id,p.level)-oldMax,0,hpMax(p.id,p.level));caught(to);state.pendingEvol=state.pendingEvol.filter(x=>x!==uid);closeModal();save();render();modal('🌟 Entwicklung!',`${art(to)}<b>Herzlichen Glückwunsch!</b> ${prev} hat sich zu <b>${POKE[to].name}</b> entwickelt!`,[['Juhu!','close','gold']])}
function showItemMenu(uid){const m=mon(uid);if(!m)return;const inventory=['potion','superpotion','revive','candy'];openModal(`<h2>🎒 Item für ${POKE[m.id].name}</h2><p>Level ${m.level} · ${m.hp}/${hpMax(m.id,m.level)} KP</p>${inventory.map(id=>{const[name,icon,desc]=ITEM_INFO[id];return `<div class="bag-entry"><span class="item-emoji">${icon}</span><span class="meta"><b>${name} ×${bagCount(id)}</b><small>${desc}</small></span><button class="smallbtn" data-action="use:${id}:${uid}" ${bagCount(id)?'':'disabled'}>Benutzen</button></div>`}).join('')}<button class="btn ghost" data-action="close">Zurück</button>`)}
function useItem(id,uid){const p=mon(uid);if(!p||!bagCount(id))return;const max=hpMax(p.id,p.level);if(id==='potion'||id==='superpotion'){if(p.hp<=0||p.hp>=max){toast('Hier wirkt dieser Trank nicht.');return}p.hp=Math.min(max,p.hp+(id==='potion'?35:85))}else if(id==='revive'){if(p.hp>0){toast('Das AuriMon ist nicht kampfunfähig.');return}p.hp=Math.floor(max/2)}else if(id==='candy'){if(p.level>=100){toast('Ab Level 100 sind Elementkristalle für den Aufstieg erforderlich.');return}gainXP(p,xpNeeded(p.level,p.id)-p.xp)}else if(id==='repel'){state.repelSteps=20}else return;state.bag[id]--;closeModal();render();toast('✨ '+ITEM_INFO[id][0]+' verwendet!')}
function ascendWithCrystal(uid,type){const p=mon(uid);if(!p||p.level<100||p.level>=150)return;
 if(!POKE[p.id].types.includes(type)){toast('Dieser Kristall passt nicht zum Pokémon-Typ.');return}
 const id='crystal_'+type;if(bagCount(id)<1){toast('💎 Du brauchst einen '+type+'kristall.');return}
 if(p.xp<xpNeeded(p.level,p.id)){toast('Noch nicht genügend Erfahrung für den Aufstieg.');return}
 const old=hpMax(p.id,p.level);state.bag[id]--;p.xp-=xpNeeded(p.level,p.id);p.level++;p.hp=Math.min(hpMax(p.id,p.level),p.hp+hpMax(p.id,p.level)-old);save();render();toast('💎 '+POKE[p.id].name+' ist auf Level '+p.level+' aufgestiegen!')}
function renderDex(){const found=state.caught.length,seenNum=state.seen.length;$('dex-progress').textContent=`${found} / ${D.length}`;$('seen-progress').textContent=seenNum;
 const query=dexSearch.trim().toLocaleLowerCase('de-DE');const shown=D.filter(p=>(!query||p.name.toLocaleLowerCase('de-DE').includes(query)||String(p.id).includes(query))&&(dexFilter==='all'||dexFilter==='seen'&&state.seen.includes(p.id)||dexFilter==='caught'&&state.caught.includes(p.id)||dexFilter==='missing'&&!state.caught.includes(p.id)));
 $('dex-list').innerHTML=shown.slice(0,dexShownLimit).map(p=>{const c=state.caught.includes(p.id),s=state.seen.includes(p.id);return `<button class="dexcell ${!s?'unknown':''}" data-action="dex:${p.id}"><small>Nr. ${String(p.id).padStart(3,'0')}</small>${s?art(p.id):'<div class="art"><span class="fallback">❔</span></div>'}<strong>${s?p.name:'???'}</strong><small>${c?'✅ Gefangen':s?'👀 Gesehen':'🔒 Unentdeckt'}</small></button>`}).join('')+(shown.length>dexShownLimit?`<button class="smallbtn gold" style="grid-column:1/-1" data-action="dex-more">Weitere 60 Pokémon anzeigen (${dexShownLimit}/${shown.length})</button>`:'')||'<div class="card muted">Keine AuriMon für diese Auswahl gefunden.</div>'}
function dexDetails(id){const p=POKE[id],s=state.seen.includes(id),c=state.caught.includes(id);modal(`📖 #${String(id).padStart(3,'0')} ${s?p.name:'Unbekannt'}`,`${s?art(id):'<div class="art"><span class="fallback">❔</span></div>'}<p>${s?`Typ: ${p.types.map(t=>`<span class="typepill">${t}</span>`).join('')}<br>Im Team oder in Box: ${allMons().filter(m=>m.id===id).length}`:'Dieses AuriMon wurde noch nicht entdeckt.'}</p><p>Status: ${c?'✅ Gefangen':s?'👀 Gesehen':'🔒 Unentdeckt'}</p>${s?`<div class="aridex-lore"><strong>✦ AuriDex-Forschungseintrag</strong><p>${p.lore||'Über diese Art liegen noch keine Forschungsnotizen vor.'}</p></div>`:''}${s?`<p>🗺️ <b>Fundorte:</b> ${AREAS.filter((z,i)=>ZONE_POOLS[i].includes(id)).map(z=>z.name).join(', ')}</p>`:''}${s&&p.evol.length?`<p>Mögliche Weiterentwicklungen: <b>${p.evol.map(e=>POKE[e.to].name+(e.kind==='level'?' (Lv. '+e.at+')':' ('+e.item+')')).join(', ')}</b></p>`:''}`, [['Zurück','close']])}
function renderBag(){const entries=Object.keys(ITEM_INFO);$('bag-list').innerHTML=entries.map(id=>{const[name,icon,desc]=ITEM_INFO[id];return `<div class="bag-entry"><span class="item-emoji">${icon}</span><div class="meta"><b>${name}</b><small>${desc}</small></div><span class="qty">× ${bagCount(id)}</span>${id==='repel'&&bagCount(id)?'<button class="smallbtn" data-action="repel">Benutzen</button>':''}</div>`}).join('')}
function renderTravel(){const count=state.badges.length;$('journey-meter').style.width=(count/REGION_COUNT*100)+'%';$('travel-list').innerHTML=AREAS.map((z,i)=>{const unlocked=i<=count;const done=state.badges.includes(i);return `<button class="travelcard ${unlocked?'':'locked'} ${i===state.zone?'current':''}" data-action="travel:${i}" ${unlocked?'':'disabled'}><em>${z.icon} ORT ${String(i+1).padStart(2,'0')} ${done?'· 🏅':unlocked?'· ✨':'· 🔒'}</em><b>${z.name}</b><small>${done?z.badge:unlocked?'Prüfhallenleiter: '+z.leader:'Noch gesperrt'}</small></button>`}).join('');$('journal').innerHTML=`<p>🏅 <b>${count} / ${REGION_COUNT}</b> Siegel errungen</p><p>📖 <b>${state.caught.length} / ${D.length}</b> AuriMon gefangen, <b>${state.seen.length}</b> gesehen</p><p>⚔️ <b>${state.battleWins}</b> Kämpfe gewonnen · 👟 <b>${state.steps}</b> Schritte</p><p>🧑‍🎓 <b>${state.trainerWins.length}</b> Trainer besiegt · ✨ <b>${state.found.length}</b> Fundstellen entdeckt</p>${state.gameWon?'<p>👑 <b>Champion – das Abenteuer ist gemeistert!</b></p>':'<p>🌟 Noch '+(REGION_COUNT-count)+' Siegel bis zum Champion-Finale!</p>'}`}
function resetGame(){modal('⚠️ Spielstand wirklich löschen?','Dein aktueller AuriMon-Spielstand geht verloren. Das kann nicht rückgängig gemacht werden.',[['Abbrechen','close'],['Ja, neu beginnen','confirm-reset','gold']])}
function confirmReset(){localStorage.removeItem(KEY);localStorage.removeItem(PREVKEY);localStorage.removeItem(OLDKEY);state=defaultState();battle=null;modalOpen=false;currentPage='world';document.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id==='page-world'));document.querySelectorAll('.tabs button').forEach(e=>e.classList.toggle('selected',e.dataset.page==='world'));$('modal-overlay').classList.add('hidden');render();starterScreen()}
function doAction(act,el){if(!act)return;
 if(act==='starter'){chooseStarter(Number(el.dataset.id));return}
 if(act==='dex-more'){dexShownLimit+=60;renderDex();return}
 if(act==='close'){closeModal();render();return}
 if(act==='interact')return interact();
 if(act==='open-guide')return showGuide();
 if(act==='open-travel')return switchPage('travel');
 if(act==='open-bag')return switchPage('bag');
 if(act==='reset')return resetGame();
 if(act==='confirm-reset')return confirmReset();
 if(act==='repel'){state.bag.repel--;state.repelSteps=20;toast('🛡️ 20 Schritte ohne wilde Begegnungen!');render();return}
 const [command,...params]=act.split(':');
 if(command==='ascend')return ascendWithCrystal(params[0],params[1]);
 if(command==='trainer'||command==='rematch')return battleTrainer(params.join(':'));
 if(command==='gym')return battleGym(Number(params[0]));
 if(command==='buy')return purchase(params[0]);
 if(command==='lead')return setLeader(params[0]);
 if(command==='deposit')return deposit(params[0]);
 if(command==='withdraw')return withdraw(params[0]);
 if(command==='evolve-menu')return showEvolutions(params[0]);
 if(command==='evolve')return evolve(params[0],Number(params[1]));
 if(command==='item-menu')return showItemMenu(params[0]);
 if(command==='use')return useItem(params[0],params[1]);
 if(command==='bswitch')return battleSwitch(params[0]);
 if(command==='dex')return dexDetails(Number(params[0]));
 if(command==='travel')return enterZone(Number(params[0]));
}
function battleAction(act){if(!battle)return;const [c,arg]=act.split(':');if(c==='attack')return battleAttack(arg);if(c==='heal')return useHealBattle(false);if(c==='heal-super')return useHealBattle(true);if(c==='throw')return throwBall(arg);if(c==='switch')return switchBattle();if(c==='flee')return flee()}
document.addEventListener('click',e=>{
 const btn=e.target.closest('button');if(!btn||btn.disabled)return;
 if(btn.dataset.dir){if(btn.dataset.dir==='up')walk(0,-1);else if(btn.dataset.dir==='down')walk(0,1);else if(btn.dataset.dir==='left')walk(-1,0);else walk(1,0);return}
 if(btn.dataset.battle){battleAction(btn.dataset.battle);return}
 if(btn.dataset.page){switchPage(btn.dataset.page);return}
 if(btn.dataset.action){doAction(btn.dataset.action,btn);return}
 if(btn.classList.contains('cell')){const x=Number(btn.dataset.x),y=Number(btn.dataset.y),dist=Math.abs(state.x-x)+Math.abs(state.y-y);if(dist===1){walk(x-state.x,y-state.y)}else if(dist===0)interact();else toast('Bewege dich mit dem Steuerkreuz zum Ziel.');return}
 });
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(e.key==='Escape'||e.key==='Backspace'){if(modalOpen){closeModal();e.preventDefault()}return}const dirs={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};if(dirs[e.key]){e.preventDefault();walk(...dirs[e.key]);return}if(e.key==='Enter'||e.key===' '){e.preventDefault();interact()}});
$('dex-search').addEventListener('input',e=>{dexSearch=e.target.value;dexShownLimit=60;renderDex()});$('dex-filter').addEventListener('click',e=>{const btn=e.target.closest('button[data-filter]');if(!btn)return;dexFilter=btn.dataset.filter;dexShownLimit=60;document.querySelectorAll('#dex-filter button').forEach(b=>b.classList.toggle('chosen',b===btn));renderDex()});
window.androidBack=()=>{if(modalOpen){closeModal();return 'handled'}if(battle){return 'handled'}if(currentPage!=='world'){switchPage('world');return 'handled'}return 'exit'};
window.PokemonGame={// Diagnostische, lesende Schnittstelle für automatisierte Funktionstests.
 getState:()=>JSON.parse(JSON.stringify(state)),areas:AREAS,pokedex:D,pools:ZONE_POOLS,
 startBattle,enterZone,walk,starter:chooseStarter,battleAttack,throwBall,gainXP,evolve
};
start();
