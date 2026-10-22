/* AuriMon 5.1.0: 10 regionale Bildwelten, 20 begehbare Innenräume,
   10 Rätsel mit 2 Runen, Bewohner und verborgene Fundstücke.
   Erweiterung der vorhandenen 5.0-Engine – KEINE neuen AuriMon-Arten. */
'use strict';
(() => {
 const zName = () => AREAS[state.zone].name;
 const THEMES=[
  ['Sonnenblumen','🌻','#f5d469','#6baa71'],['Mondschimmer','🌙','#9ae3ff','#478abc'],
  ['Felsflechten','🪨','#c2a989','#657991'],['Blütentanz','🌸','#ffaacb','#8ed2a1'],
  ['Seeglas','🐚','#a5f5df','#41aec5'],['Bernstein','🍂','#eec57a','#b97836'],
  ['Laternen','🏮','#ffbd75','#535b88'],['Kristalle','💎','#b0edff','#61bad6'],
  ['Lavasteine','🌋','#ff8463','#97594e'],['Wolkenwirbel','☁️','#f4ecdd','#8cacc8'],
  ['Funken','⚡','#ffe484','#758da9'],['Irrlichter','🕯️','#a2f5d9','#526b89'],
  ['Runensäulen','🏛️','#d5c69d','#82746b'],['Eisblumen','❄️','#d5fbff','#83c8e0'],
  ['Leuchtpilze','🍄','#f2a9ea','#58658b'],['Sternenmeer','✨','#e0e7ff','#4799bc'],
  ['Drachenschuppen','🐉','#c6b6f4','#85728c'],['Himmelsgärten','🌿','#dbffa8','#8acbb2'],
  ['Uralte Zeichen','🔮','#dfbdff','#7e7194'],['Goldene Kronen','👑','#ffe1a1','#ce8660']
 ];
 // Die ersten zehn Orte besitzen die klassischen Doppelrunen-Rätsel.
 // Neuere Regionen verwenden Kristallchroniken, brauchen aber weiterhin sichere Farbthemen für Innenräume.
 const CLASSIC_RUNE_REGIONS=10;
 const originalThemes=THEMES.map(t=>t.slice());
 while(THEMES.length<AREAS.length)THEMES.push(originalThemes[THEMES.length%originalThemes.length].slice());
 const SPECIAL={house:{x:6,y:2},atelier:{x:10,y:7},notice:{x:7,y:4},runeA:{x:1,y:8},runeB:{x:12,y:9},cache:{x:5,y:9}};
 const specialAt=(x,y)=>Object.entries(SPECIAL).find(([,pos])=>pos.x===x&&pos.y===y)?.[0]||null;
 const rewards=['ball','potion','greatball','repel','superpotion','candy','revive','ether','antidote','Feuerstein','Wasserstein','Donnerstein','Blattstein','Mondstein','Tausch-Kabel'];
 const key=(z,k)=>String(z)+':'+k;
 const has=(arr,s)=>Array.isArray(arr)&&arr.includes(s);
 function ensure(){
   if(!Array.isArray(state.v51RoomsLoot))state.v51RoomsLoot=[];
   if(!Array.isArray(state.v51Puzzles))state.v51Puzzles=[];
   if(!state.v51Runes||typeof state.v51Runes!=='object'||Array.isArray(state.v51Runes))state.v51Runes={};
   if(!Array.isArray(state.v51Caches))state.v51Caches=[];
   if(state.v51Indoor&&(!['house','atelier'].includes(state.v51Indoor.kind)||state.v51Indoor.zone!==state.zone))state.v51Indoor=null;
 }
 const prevDefault=defaultState;
 defaultState=function(){return {...prevDefault(),v51RoomsLoot:[],v51Runes:{},v51Puzzles:[],v51Caches:[],v51Indoor:null};};
 // Nur an sicheren, zuvor nicht belegten Koordinaten: alte Arenen, Trainer, Loot etc. bleiben unangetastet.
 const previousAt=atPosition;
 atPosition=function(z,x,y){
   const t=previousAt(z,x,y);if(state.dungeon)return t;
   if(z!==state.zone)return t;
   const type=specialAt(x,y);
   return type&&!['trainer','loot','gym','center','market','portal','cave','legend','rocketteam','safari','wall'].includes(t)?'v51-'+type:t;
 };
 const prevRender=renderMap;
 renderMap=function(){prevRender();showIndoor()};
 const prevEnter=enterZone;
 enterZone=function(z,entry){if(state.v51Indoor)state.v51Indoor=null;prevEnter(z,entry);showIndoor()};
 function markDirty(){render();window.PokemonGame.hd?.forceRedraw?.()}
 function interactSpecial(type){
   ensure();const z=state.zone;
   if(type==='house'||type==='atelier')return enterHouse(type);
   if(type==='notice')return modal('📜 Ortschronik: '+zName(),`In ${zName()} erzählen die Leute von <b>${THEMES[z][0]}</b>. Die alten Steine flüstern von zwei Stimmen. Nur wer die Zeichen richtig deutet, erweckt das Verborgene.`,[['Auf die Suche!','close','gold']]);
   if(type==='runeA'){
     if(has(state.v51Puzzles,z))return toast('✅ Die westliche Rune leuchtet weiterhin.');
     if(state.v51Runes[z]>=1)return toast('✨ Die erste Rune ist bereits aktiv.');
     state.v51Runes[z]=1;save();markDirty();return modal('🗿 Erste Rune aktiviert',`Ein Zeichen aus ${zName()} glüht auf. Irgendwo antwortet ein zweites Zeichen auf das erste.`,[['Weiter suchen','close','gold']]);
   }
   if(type==='runeB'){
     if(has(state.v51Puzzles,z))return toast('✅ Die Runen sind bereits gelöst.');
     if(state.v51Runes[z]!==1)return modal('🔒 Versiegelte Rune','Das Zeichen bleibt still. Vielleicht hast du den Anfang der Geschichte noch nicht gefunden.',[['Verstanden','close']]);
     state.v51Runes[z]=2;state.v51Puzzles.push(z);save();markDirty();
     return modal('✨ Rätsel gelöst!',`Du hast die beiden Runen von ${zName()} verbunden! Irgendwo in diesem Ort hat sich ein Geheimnis geöffnet.`,[['Zum Schatz!','close','gold']]);
   }
   if(type==='cache'){
     if(has(state.v51Caches,z))return toast('📦 Dieses Versteck wurde bereits geleert.');
     if(!has(state.v51Puzzles,z))return modal('🔐 Verschlossenes Versteck','Zwei Runen halten die Schatzkiste versiegelt. Die Ortschronik gibt dir einen Hinweis.',[['Zurück','close']]);
     const item=rewards[(z*7+3)%rewards.length],coins=75+z*20;
     state.v51Caches.push(z);gainItem(item,1);state.coins+=coins;save();markDirty();
     return modal('🎁 Geheimer Schatz gefunden!',`Du erhältst <b>${ITEM_INFO[item]?.[1]||'✨'} ${ITEM_INFO[item]?.[0]||item}</b> und <b>${coins} Münzen</b>!`,[['Großartig!','close','gold']]);
   }
 }
 function enterHouse(kind){
   ensure();const z=state.zone;
   state.v51Indoor={zone:z,kind,x:4,y:5};save();showIndoor();toast(kind==='house'?'🏠 Willkommen im Gasthaus!':'📚 Willkommen in der Werkstatt!');
 }
 function leaveHouse(){state.v51Indoor=null;save();showIndoor();render();toast('🌿 Wieder draußen in '+zName());}
 function indoorBlock(x,y){return y===0||x===0||x===8||y===6&&(x!==4)||y===1&&(x===2||x===6)||x===2&&y===2||x===6&&y===2||x===4&&y===2;}
 function insideWalk(dx,dy){const o=state.v51Indoor;if(!o||modalOpen||battle)return;
  const nx=o.x+dx,ny=o.y+dy;
  state.facing=dx>0?'right':dx<0?'left':dy>0?'down':'up';
  if(nx===4&&ny===6){leaveHouse();return}
  if(indoorBlock(nx,ny)||nx<0||ny<0||nx>8||ny>6){toast('🪑 Dort steht ein Möbelstück.');return}
  o.x=nx;o.y=ny;save();showIndoor();
  if(nx===4&&ny===2)indoorTalk('person');
  if(nx===6&&ny===3)indoorTalk('gift');
 }
 function indoorTalk(type){const o=state.v51Indoor;if(!o)return;ensure();const z=o.zone;
   if(type==='person'){
     if(o.kind==='house')return modal('💚 Die Gastgeberin',`„Schön, dass du ${zName()} besuchst! Ich heile dein AuriMon-Team gern kostenlos.“`,[['Team heilen','v51-heal','gold'],['Später','close']]);
     return modal('📚 Der Chronist',`„${THEMES[z][1]} ${THEMES[z][0]} sind das Wahrzeichen unserer Region! Alte Geschichten sprechen von zwei Zeichen, die sich gegenseitig antworten.“`,[['Vielen Dank','close','gold']]);
   }
   if(type==='gift'){
     const k=key(z,o.kind);if(has(state.v51RoomsLoot,k))return modal('📦 Holztruhe','Die Truhe ist leer. Vielleicht gibt es in einer anderen Stadt noch etwas zu entdecken!',[['Schließen','close']]);
     const item=o.kind==='house'?'potion':rewards[(z*3+1)%rewards.length];state.v51RoomsLoot.push(k);gainItem(item,1);save();
     return modal('🎁 Truhe entdeckt!',`Du findest <b>${ITEM_INFO[item]?.[1]||'✨'} ${ITEM_INFO[item]?.[0]||item}</b>!`,[['Mitnehmen','close','gold']]);
   }
 }
 const prevWalk=walk;
 walk=function(dx,dy){
  ensure();if(!window.PokemonProfiles?.activeSlot||modalOpen||battle||currentPage!=='world'||!state.starterChosen)return;
  if(state.v51Indoor)return insideWalk(dx,dy);
  if(state.dungeon)return prevWalk(dx,dy);
  const nx=state.x+dx,ny=state.y+dy;
  if(nx>=0&&ny>=0&&nx<V41_W&&ny<V41_H){
   const tile=atPosition(state.zone,nx,ny);
   if(tile.startsWith('v51-')){
    // Hinweistafeln und bereits erledigte Fundstellen unterbrechen normales Laufen nicht.
    const type=tile.slice(4);const z=state.zone;
    if(type==='notice'||(type==='runeA'&&(has(state.v51Puzzles,z)||state.v51Runes?.[z]>=1))||
       (type==='runeB'&&has(state.v51Puzzles,z))||(type==='cache'&&has(state.v51Caches,z))){return prevWalk(dx,dy)}
    state.facing=dx>0?'right':dx<0?'left':dy>0?'down':'up';
    state.steps++;if(state.repelSteps>0)state.repelSteps--;
    if(tile!=='v51-house'&&tile!=='v51-atelier'){state.x=nx;state.y=ny;}
    save();markDirty();interactSpecial(tile.slice(4));return;
   }
  }
  prevWalk(dx,dy);
 };
 const prevInteract=interact;
 interact=function(){ensure();if(!window.PokemonProfiles?.activeSlot||modalOpen||battle)return;
   if(state.v51Indoor){const o=state.v51Indoor;
     if(o.y>=5&&o.x===4)return leaveHouse();
     if(Math.abs(o.x-4)+Math.abs(o.y-2)<=1)return indoorTalk('person');
     if(Math.abs(o.x-6)+Math.abs(o.y-3)<=1)return indoorTalk('gift');
     return modal('🏠 '+(o.kind==='house'?'Gasthaus':'Werkstatt'),'Sprich mit den Bewohnern oder öffne die Truhe. Der Ausgang liegt unten in der Mitte.',[['Alles klar','close']]);
   }
   if(state.dungeon)return prevInteract();
   const dir={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[state.facing]||[0,-1];
   for(const [x,y] of [[state.x,state.y],[state.x+dir[0],state.y+dir[1]]]){
    const t=atPosition(state.zone,x,y);if(t.startsWith('v51-'))return interactSpecial(t.slice(4));
   }
   return prevInteract();
 };
 const prevDoAction=doAction;
 doAction=function(a,e){
  if(a==='v51-exit')return leaveHouse();
  if(a==='v51-heal'){state.party.forEach(m=>{m.hp=hpMax(m.id,m.level);m.status=null;v4Moves(m).forEach(t=>t.pp=t.maxpp)});save();closeModal();return toast('💚 Dein Team ist vollständig geheilt!')}
  if(a==='v51-guide')return showGuide51();
  return prevDoAction(a,e);
 };
 const prevAndroidBack=window.androidBack;
 window.androidBack=()=>{if(state.v51Indoor&&!modalOpen){leaveHouse();return 'handled'}return prevAndroidBack()};
 const oldGuide=showGuide;
 showGuide=function(){oldGuide();$('modal-content')?.insertAdjacentHTML('beforeend','<p>🏠 In jedem Ort warten ein Gasthaus, eine Werkstatt und verborgene Geschichten. Beobachte die Umgebung und sprich mit den Bewohnern.</p>')};
 const oldTravel=renderTravel;
 renderTravel=function(){oldTravel();ensure();
  const cards=AREAS.slice(0,CLASSIC_RUNE_REGIONS).map((a,z)=>{
    const isUnlocked=z<=state.badges.length;
    return `<div class="v51-world-row ${isUnlocked?'':'locked'}"><span>${a.icon}</span><strong>${a.name}</strong><small>${THEMES[z][1]} ${THEMES[z][0]} · ${has(state.v51Puzzles,z)?'🗿 Rätsel gelöst':'🗿 Rätsel offen'} · ${has(state.v51Caches,z)?'🎁 Schatz gefunden':'🎁 Schatz offen'}</small></div>`
  }).join('');
  const holder=document.createElement('section');holder.className='v51-journal';holder.innerHTML=`<h2>🧩 Geheimnisse der 10 Orte</h2><p>${state.v51Puzzles.filter(z=>z<CLASSIC_RUNE_REGIONS).length} / ${CLASSIC_RUNE_REGIONS} Runenrätsel gelöst · ${state.v51Caches.filter(z=>z<CLASSIC_RUNE_REGIONS).length} / ${CLASSIC_RUNE_REGIONS} geheime Truhen entdeckt · ${state.v51RoomsLoot.length} / ${AREAS.length*2} Haus-Truhen gefunden</p><details><summary>Die ${CLASSIC_RUNE_REGIONS} klassischen Ortsrätsel ansehen</summary><div class="v51-world-list">${cards}</div></details>`;
  $('journal').appendChild(holder);
 };
 // Pixel-Details: jedes Gebiet hat eigene Motive und markante architektonische Marker.
 function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
 function stroke(c,x,y,w,h,color){rect(c,x,y,w,3,color);rect(c,x,y+h-3,w,3,color);rect(c,x,y,3,h,color);rect(c,x+w-3,y,3,h,color)}
 function mark(c,x,y,t,z,wx,wy){
   const [,icon,accent,secondary]=THEMES[z];const seed=hash(z*3+1,wx,wy)%15;
   if(['grass','wild','path'].includes(t) && seed<=3){
     if([3,13,17,0].includes(z)){rect(c,x+20,y+19,3,11,'#326c45');rect(c,x+14,y+17,17,5,accent);rect(c,x+20,y+12,6,18,accent);rect(c,x+22,y+18,3,3,'#fffce0')}
     else if([8,10,16,19].includes(z)){rect(c,x+10,y+25,29,4,secondary);rect(c,x+17,y+18,5,9,accent);rect(c,x+24,y+15,9,6,accent)}
     else if([7,12,14,18].includes(z)){rect(c,x+20,y+18,12,19,secondary);rect(c,x+24,y+7,5,16,accent);rect(c,x+17,y+15,21,7,accent)}
     else if([5,6,11].includes(z)){rect(c,x+14,y+15,8,15,secondary);rect(c,x+12,y+11,15,9,accent);rect(c,x+21,y+24,11,4,'#e5d6a0')}
     else{rect(c,x+12,y+20,22,3,accent);rect(c,x+17,y+15,12,4,secondary);rect(c,x+20,y+11,5,4,'#f4f8ed')}
   }
 }
 function drawBuilding(c,x,y,kind,pal,z){
   const atelier=kind==='atelier',theme=THEMES[z];
   rect(c,x,y,48,48,pal.path);rect(c,x+4,y+20,41,24,'#e7cfb0');rect(c,x+6,y+22,37,20,atelier?'#ded2bb':'#f7e8cf');
   rect(c,x+2,y+11,44,15,'#253b58');rect(c,x+5,y+6,38,16,atelier?theme[3]:theme[2]);rect(c,x+9,y+3,29,7,'#cdd7da');
   rect(c,x+8,y+25,8,11,'#a5e3f0');rect(c,x+33,y+25,8,11,'#a5e3f0');
   rect(c,x+20,y+28,10,17,'#574454');rect(c,x+22,y+32,6,12,'#342e40');
   if(atelier){rect(c,x+19,y+11,12,3,'#fff3c2');rect(c,x+23,y+14,4,7,'#fff3c2')}
   else{rect(c,x+18,y+10,12,4,'#fff7ea');rect(c,x+21,y+7,6,11,'#fff7ea')}
 }
 function drawRune(c,x,y,kind,z,active){
    const accent=THEMES[z][2];
    rect(c,x+11,y+25,26,15,'#4b4c5a');rect(c,x+14,y+15,19,23,'#8a8d9f');rect(c,x+17,y+11,14,8,'#bab7bd');rect(c,x+22,y+18,4,13,active?'#aefce0':accent);
    if(active){stroke(c,x+13,y+13,21,23,'#b4ffe0');rect(c,x+18,y+6,11,4,'#fff5b5')}
 }
 function paintTile(c,x,y,t,T,pal,wx,wy){
  const z=state.zone;
  mark(c,x,y,t,z,wx,wy);
  if(!t.startsWith('v51-'))return;
  const type=t.slice(4);
  if(type==='house'||type==='atelier')return drawBuilding(c,x,y,type,pal,z);
  rect(c,x,y,T,T,pal.path);
  if(type==='notice'){rect(c,x+18,y+13,12,25,'#87674d');rect(c,x+7,y+7,34,22,'#8b664b');rect(c,x+10,y+10,28,15,'#e5d09e');rect(c,x+15,y+14,17,2,'#a58964');rect(c,x+15,y+20,13,2,'#a58964')}
  else if(type==='runeA'||type==='runeB'){drawRune(c,x,y,type,z,has(state.v51Puzzles,z)||(type==='runeA'?state.v51Runes?.[z]>=1:state.v51Runes?.[z]>=2))}
  else if(type==='cache'){rect(c,x+11,y+23,26,17,'#6e5043');rect(c,x+12,y+19,24,9,has(state.v51Caches,z)?'#786c61':'#c68b4c');rect(c,x+19,y+26,11,10,has(state.v51Puzzles,z)?'#ffdd7e':'#596074');rect(c,x+18,y+17,12,3,'#ffe49e')}
 }
 window.PokemonWorld51={paintTile,themes:THEMES,locationType:specialAt};
 const roomCanvas=document.createElement('canvas');roomCanvas.id='v51-room';roomCanvas.className='v51-room-canvas';roomCanvas.width=576;roomCanvas.height=448;roomCanvas.setAttribute('aria-label','Begehbarer Innenraum');roomCanvas.hidden=true;
 const map=document.getElementById('game-map');map.appendChild(roomCanvas);
 const roomUi=document.createElement('div');roomUi.className='v51-room-bar';roomUi.hidden=true;
 roomUi.innerHTML='<strong>🏠 Innenraum</strong><button type="button" data-action="v51-exit">↩ Verlassen</button>';
 map.appendChild(roomUi);
 function showIndoor(){ensure();const o=state.v51Indoor;
  roomCanvas.hidden=!o;roomUi.hidden=!o;
  if(!o)return;
  if(roomCanvas.parentNode!==map)map.appendChild(roomCanvas);
  if(roomUi.parentNode!==map)map.appendChild(roomUi);
  roomUi.querySelector('strong').textContent=(o.kind==='house'?'🏠 Gasthaus':'📚 Werkstatt')+' · '+zName();
  const c=roomCanvas.getContext('2d');c.imageSmoothingEnabled=false;
  const T=64,accent=THEMES[o.zone][2],alt=THEMES[o.zone][3];
  rect(c,0,0,576,448,'#b28e73');
  for(let y=0;y<7;y++)for(let x=0;x<9;x++){
   const px=x*T,py=y*T;
   rect(c,px,py,T,T,y===0||x===0||x===8?'#4b6071':(x+y)%2?'#cfac86':'#d5b592');
   rect(c,px+3,py+3,T-6,3,y===0?'#78899a':'#e7c9a0');
   if(indoorBlock(x,y)){rect(c,px+5,py+8,54,44,'#4c5365');rect(c,px+10,py+12,44,28,'#797d8b');}
  }
  rect(c,2*T+19,3*T+12,5*T-40,3*T-16,accent);rect(c,2*T+25,3*T+17,5*T-53,3*T-26,alt);
  // Furniture and a friendly resident, drawn in a deliberately large pixel style.
  rect(c,2*T+4,2*T-4,53,45,'#6e4c47');rect(c,2*T+10,2*T+4,41,29,'#b79c71');
  rect(c,6*T+4,3*T+5,54,44,'#744f3e');rect(c,6*T+8,3*T+2,46,14,'#e5b76c');
  rect(c,4*T+19,2*T+2,26,28,o.kind==='house'?'#ed8d9c':'#7393c8');
  rect(c,4*T+24,2*T-15,17,21,'#e3bd96');rect(c,4*T+22,2*T-18,20,8,'#4d3548');
  rect(c,4*T+17,2*T+17,30,8,'#243954');
  const face=state.v56IndoorFacing||'down';if(face==='down'){rect(c,4*T+27,2*T-7,3,3,'#292f49');rect(c,4*T+36,2*T-7,3,3,'#292f49')}
  if(face==='left')rect(c,4*T+23,2*T-7,4,3,'#292f49');
  if(face==='right')rect(c,4*T+37,2*T-7,4,3,'#292f49');
  if(face==='up')rect(c,4*T+25,2*T-16,17,6,'#4d3548');
  rect(c,4*T+12,6*T+12,40,48,'#4d3f43');rect(c,4*T+17,6*T+15,30,43,'#d9c79c');
  const hx=o.x*T+32,hy=o.y*T+34;
  rect(c,hx-11,hy+17,22,5,'#473d4d');rect(c,hx-10,hy-6,20,26,state.profileGender==='girl'?'#e36d9e':'#327dc3');
  rect(c,hx-9,hy-27,18,23,'#ecc3a1');rect(c,hx-10,hy-31,20,8,'#41385e');rect(c,hx-8,hy+16,7,12,'#3d5576');rect(c,hx+2,hy+16,7,12,'#3d5576');
  c.fillStyle='#fffdf4';c.font='bold 15px monospace';c.fillText('A: SPRECHEN  ·  ENTDECKE DEN RAUM',12,22);
 }
 roomCanvas.addEventListener('click',e=>{if(!state.v51Indoor||modalOpen)return;const r=roomCanvas.getBoundingClientRect();const x=Math.floor((e.clientX-r.left)/r.width*9),y=Math.floor((e.clientY-r.top)/r.height*7),o=state.v51Indoor;
  if(Math.abs(o.x-x)+Math.abs(o.y-y)===1)walk(x-o.x,y-o.y);else if(x===4&&y===6)leaveHouse();else if(x===4&&y===2)indoorTalk('person');else if(x===6&&y===3)indoorTalk('gift');
 });
 const guide=document.createElement('button');guide.className='v51-helpbtn';guide.type='button';guide.dataset.action='v51-guide';guide.textContent='🗝️ Geheimnisse';document.querySelector('.v4-shortcuts')?.appendChild(guide);
 function showGuide51(){modal('🗺️ Entdecke die Regionen',`<b>10 Orte, 20 Häuser, 10 Runenrätsel!</b><p>🏠 In jedem Ort findest du ein Gasthaus und eine Werkstatt. Betritt die Gebäude und öffne ihre Truhen.</p><p>📜 Hinweistafeln und Bewohner erzählen von den Geheimnissen der Region.</p><p>🗿 Manche Zeichen reagieren erst, wenn andere Geheimnisse entdeckt wurden.</p><p>🎁 Achte auf ungewöhnliche Steine, alte Inschriften und verborgene Behälter.</p><p>Deine bisherigen Siegel, AuriMon und Spielstände bleiben erhalten.</p>`,[['Auf Entdeckung!','close','gold']])}
 // Loaded save migration: supplementary fields are optional and not destructive.
 const origLoad=v4SafeLoad;
 v4SafeLoad=function(data){const cleaned={...data,v51Indoor:null};origLoad(cleaned);ensure();showIndoor()};
 window.PokemonGame.walk=(dx,dy)=>walk(dx,dy);
 window.PokemonGame.world51={version:'5.1.0',interiorsPerRegion:2,regions:AREAS.length,location:specialAt,open:(kind)=>enterHouse(kind),activate:(type)=>interactSpecial(type),leave:leaveHouse,inspect:()=>({interior:state.v51Indoor,puzzles:state.v51Puzzles?.length||0,treasures:state.v51Caches?.length||0,rooms:state.v51RoomsLoot?.length||0})};
 ensure();showIndoor();
})();
