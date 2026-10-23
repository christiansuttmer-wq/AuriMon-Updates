/* AuriMon v4.1 – persönliche Trainerfigur und große Weltkarte. */
'use strict';
const V41_W=18, V41_H=11, V41_VIEW_W=18, V41_VIEW_H=11;
const V41_SPECIAL={cave:[12,4],rocketteam:[12,6],safari:[7,9],legend:[12,8]};
const V41_TRAINERS=[[4,2],[8,2],[4,7],[8,8],[4,9],[6,7]];
const V41_DROPS=[[1,4],[7,3],[12,3],[4,6],[2,9],[1,9],[12,7],[7,8]];
const v41DefaultState=defaultState;
defaultState=function(){return {...v41DefaultState(),x:7,y:5,profileName:'',profileGender:'',worldLayout:'compact18x11'}};
function v41SafeName(){return (typeof state.profileName==='string'&&state.profileName.trim())?state.profileName.trim():'Trainer'}
function escapeTrainerName(){return v41SafeName().replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function v41HasProfile(){return typeof state.profileName==='string'&&state.profileName.trim().length>0&&['boy','girl'].includes(state.profileGender)}
// A 4.0 save is upgraded once, not overwritten: extend both map dimensions, preserve progress.
function v41ScaleSave(s){
 // Migration: old 22x18 profile coordinates -> smaller fully visible 14x11 map.
 // This alters POSITION only; collected AuriMon, six profile slots, quests and badges stay intact.
 if(s.worldLayout==='large22x18'){
   s.x=Math.round((Number(s.x)||10)*13/21);
   s.y=Math.round((Number(s.y)||9)*10/17);
 }else if(s.worldLayout!=='compact14x11'&&s.worldLayout!=='compact18x11'){
   s.x=Math.round((Number(s.x)||5)*13/10);
   s.y=Math.round((Number(s.y)||4)*10/8);
 }
 s.x=clamp(Number.isFinite(s.x)?s.x:7,1,V41_W-2);
 s.y=clamp(Number.isFinite(s.y)?s.y:5,1,V41_H-2);
 s.worldLayout='compact18x11';
 if(!['boy','girl'].includes(s.profileGender))s.profileGender='';
 if(typeof s.profileName!=='string')s.profileName='';
 return s;
}
v41ScaleSave(state);
let v41SelectedGender=state.profileGender||'';
function v41ApplyAvatar(){document.body.classList.toggle('profile-boy',state.profileGender==='boy');document.body.classList.toggle('profile-girl',state.profileGender==='girl');}
function v41ProfileScreen(edit=false){
 v41SelectedGender=state.profileGender||'';
 const name=edit?escapeTrainerName():'';
 openModal(`<div class="eyebrow">DEIN EIGENES ABENTEUER · 1.025 AURIMON</div>
   <h2>🌟 Erstelle deinen Trainer!</h2><p>Wie heißt du und welche Figur soll dich durch 40 Regionen und 200 Ebenen begleiten?</p>
   <label class="profile-label" for="profile-name">Dein Trainername</label>
   <input class="field profile-input" id="profile-name" maxlength="18" autocomplete="nickname" placeholder="Gib deinen Namen ein" value="${name}">
   <div class="profile-label">Wähle deine Spielfigur</div>
   <div class="profile-choices">
    <button type="button" class="profile-choice ${v41SelectedGender==='boy'?'chosen':''}" data-action="profile-gender:boy" aria-pressed="${v41SelectedGender==='boy'}"><img src="ari_sprites/hero_boy_down.svg" alt="Jungenfigur"><b>👦 Junge</b></button>
    <button type="button" class="profile-choice ${v41SelectedGender==='girl'?'chosen':''}" data-action="profile-gender:girl" aria-pressed="${v41SelectedGender==='girl'}"><img src="ari_sprites/hero_girl_down.svg" alt="Mädchenfigur"><b>👧 Mädchen</b></button>
   </div><p class="profile-error" id="profile-error" role="alert" aria-live="polite"></p>
   <button class="btn gold profile-submit" data-action="profile-confirm">${edit?'Änderungen speichern':'🎒 Abenteuer beginnen!'}</button>
   ${edit?'<button class="btn ghost" data-action="close">Abbrechen</button>':''}
   <p class="muted">Dein Name und deine Figur werden nur im Spielstand auf diesem Gerät gespeichert.</p>`);
 // Auf dem Handy nicht automatisch die Bildschirmtastatur oeffnen.
 // Das Eingabefeld kann jederzeit angetippt werden.
}
function v41ConfirmProfile(){const value=$('profile-name')?.value.trim().replace(/\s+/g,' ')||'';const error=$('profile-error');
 if(value.length<2){error.textContent='Bitte gib einen Namen mit mindestens zwei Zeichen ein.';return}
 if(!v41SelectedGender){error.textContent='Bitte wähle zuerst Junge oder Mädchen.';return}
 if(/[<>\x00-\x1f]/.test(value)){error.textContent='Bitte verwende einen Namen ohne Sonderzeichen wie < oder >.';return}
 state.profileName=value.slice(0,18);state.profileGender=v41SelectedGender;v41ApplyAvatar();save();
 modalOpen=false;$('modal-overlay').classList.add('hidden');$('modal-content').innerHTML='';
 if(!state.starterChosen)starterScreen();else {render();toast('✅ Willkommen, '+v41SafeName()+'!')}
}
const v41StarterScreen=starterScreen;
starterScreen=function(){if(!v41HasProfile()){v41ProfileScreen();return}v41StarterScreen();const title=$('modal-content').querySelector('.eyebrow');if(title)title.textContent='HALLO '+v41SafeName().toLocaleUpperCase('de-DE')+'! 👋'};
const v41CloseModal=closeModal;
closeModal=function(){if(!v41HasProfile())return;return v41CloseModal()};

// Contiguous 22 x 18 world with a larger town, connected roads, hidden fields and more challenges.
getGround=function(z,x,y){
 if(x<0||y<0||x>=V41_W||y>=V41_H)return 'wall';
 // Both exits remain at (0,5) and (17,5). Doors are SOUTH of their buildings.
 if(x===0||x===V41_W-1)return y===5?'portal':'tree';
 if(y===0||y===V41_H-1)return ['mountain','dark','volcano'].includes(AREAS[z].theme)?'rock':'tree';
 const road = y===5||y===4&&x>=1&&x<=16||y===8&&x>=1&&x<=16||
   x===2&&y>=2&&y<=8||x===6&&y>=2&&y<=9||x===11&&y>=2&&y<=5||
   x===10&&y>=6&&y<=9||x===4&&y>=3&&y<=8||x===8&&y>=3&&y<=9||
   x===7&&y>=3&&y<=9;
 if(road)return 'path';
 const rnd=hash(z,x,y)%100,theme=AREAS[z].theme;
 if(rnd<9)return theme==='ocean'&&rnd<6?'water':['mountain','volcano'].includes(theme)?'rock':'tree';
 if(theme==='ocean'&&rnd>=9&&rnd<17)return 'water';
 return rnd<75?'wild':'grass';
};
trainers=function(z){const count=z>14?6:z>8?5:4;return V41_TRAINERS.slice(0,count).map(([x,y],j)=>({id:`${z}:${j}`,x,y,j,name:TRAINER_NAMES[(z*3+j*5)%TRAINER_NAMES.length],defeated:state.trainerWins.includes(`${z}:${j}`)}))};
drops=function(z){const kinds=['ball','potion','candy','greatball','revive','superpotion','repel',...Object.keys(ITEM_INFO).filter(k=>k.endsWith('stein')||k==='Tausch-Kabel')];return V41_DROPS.map(([x,y],n)=>({id:`${z}:${n}`,x,y,item:kinds[(z*5+n*3)%kinds.length],picked:state.found.includes(`${z}:${n}`)}))};
atPosition=function(z,x,y){if(state.dungeon)return v4CaveTile(x,y);
 if(x<0||y<0||x>=V41_W||y>=V41_H)return 'wall';
 if(V4_CAVES.includes(z)&&x===V41_SPECIAL.cave[0]&&y===V41_SPECIAL.cave[1])return 'cave';
 if(V4_ROCKET.includes(z)&&x===V41_SPECIAL.rocketteam[0]&&y===V41_SPECIAL.rocketteam[1])return 'rocketteam';
 if(z===5&&x===V41_SPECIAL.safari[0]&&y===V41_SPECIAL.safari[1])return 'safari';
 if(Object.entries(V4_LEGENDS).some(([id,q])=>q.zone===z)&&x===V41_SPECIAL.legend[0]&&y===V41_SPECIAL.legend[1])return 'legend';
 if(trainers(z).some(t=>t.x===x&&t.y===y))return 'trainer';
 if(drops(z).some(t=>t.x===x&&t.y===y&&!t.picked))return 'loot';
 return getGround(z,x,y);
};

function v42Camera(){return [V41_VIEW_W,V41_VIEW_H]} // whole town always visible; no panning
function v41UpdateWeather(){document.body.classList.toggle('night',v4Time().night);
 const weather=v4Weather();for(const cls of ['weather-rain','weather-snow','weather-storm'])document.body.classList.remove(cls);
 if(weather==='Regen')document.body.classList.add('weather-rain');if(weather==='Schnee')document.body.classList.add('weather-snow');if(weather==='Gewitter')document.body.classList.add('weather-storm');
 $('v4-clock').textContent=v4Time().night?'🌙 Nacht':'☀️ Tag';$('v4-weather').textContent=(V4_EMOJI[weather]||'🌤️')+' '+weather;
 $('v4-transport').textContent=state.safariActive?`🦒 Safari ${Math.max(0,24-state.safariSteps)}`:state.surfing?'🌊 Surfen':state.bicycle?'🚲 Fahrrad':'🚶 Zu Fuß';
}
renderMap=function(){v41ApplyAvatar();const map=$('game-map');if(state.dungeon){map.style.setProperty('--map-cols','11');map.style.setProperty('--map-rows','9');v4DrawCave();const cell=document.querySelector('#game-map .cell.player .actor');if(cell){cell.textContent='';cell.classList.add('heroactor')}return}
 const [viewW,viewH]=v42Camera();map.style.setProperty('--map-cols',String(viewW));map.style.setProperty('--map-rows',String(viewH));
 const z=state.zone,x0=clamp(state.x-Math.floor(viewW/2),0,V41_W-viewW),y0=clamp(state.y-Math.floor(viewH/2),0,V41_H-viewH);
 map.className='map '+AREAS[z].theme;
 const npc=new Map(trainers(z).map(t=>[t.x+':'+t.y,t]));let html='';
 const follower=state.party.find(p=>p.uid===state.followerUid)||active();
 const dirs={up:[0,1],down:[0,-1],left:[1,0],right:[-1,0]},behind=dirs[state.facing]||[0,1];
 for(let y=y0;y<y0+viewH;y++)for(let x=x0;x<x0+viewW;x++){
   const tile=atPosition(z,x,y),hero=state.x===x&&state.y===y,trainer=npc.get(x+':'+y);
   const buddy=!!follower&&state.x+behind[0]===x&&state.y+behind[1]===y&&!['rock','wall','water','tree'].includes(tile);
   let special='';
   if(trainer)special=`<span class="actor personactor" title="Trainer ${trainer.name}"></span>`;
   else if(tile==='loot')special='<span class="actor glow" aria-hidden="true">✦</span>';
   else if(tile==='portal')special='<span class="actor" aria-hidden="true">↔️</span>';
   else if(tile==='gym'&&z===19)special='<span class="actor" aria-hidden="true">👑</span>';
   else if(tile==='cave')special='<span class="actor" aria-hidden="true">🕯️</span>';
   else if(tile==='rocketteam')special='<span class="actor" aria-hidden="true">🕶️</span>';
   else if(tile==='legend')special='<span class="actor" aria-hidden="true">✨</span>';
   else if(tile==='safari')special='<span class="actor" aria-hidden="true">🦒</span>';
   if(buddy)special+=`<span class="buddyactor" aria-label="Begleiter ${POKE[follower.id].name}" title="${POKE[follower.id].name}">${follower.shiny?'✨':POKE[follower.id].symbol}</span>`;
   if(hero)special+='<span class="actor heroactor" aria-hidden="true"></span>';
   html+=`<button class="cell ${tile} ${hero?'player':''}" aria-label="${hero?'Spielfigur, ':''}${trainer?'Trainer '+trainer.name:tile}" data-x="${x}" data-y="${y}"><span class="ornament"></span>${special}</button>`;
 }
 map.innerHTML=html;v41UpdateWeather();
 const caption=$('camera-position');if(caption)caption.textContent=`Karte ${state.x+1}/${V41_W} · ${state.y+1}/${V41_H}`;
};
enterZone=function(z,entry){if(z<0||z>=AREAS.length){toast('⛔ Hier endet der Weg.');return}if(z>state.badges.length){toast('🔒 Gewinne erst das Siegel dieser Region!');return}
 state.dungeon=null;state.safariActive=false;state.safariSteps=0;state.surfing=false;state.zone=z;
 state.x=entry==='from-left'?1:entry==='from-right'?V41_W-2:7;state.y=5;
 if(!state.visited.includes(z))state.visited.push(z);
 toast(`${AREAS[z].icon} ${AREAS[z].name} entdeckt!`);currentPage='world';document.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id==='page-world'));document.querySelectorAll('.tabs button').forEach(e=>e.classList.toggle('selected',e.dataset.page==='world'));render();
};
function v41ProcessTile(t,nx,ny){
 if(t==='portal'){const right=nx===V41_W-1;enterZone(state.zone+(right?1:-1),right?'from-left':'from-right');return true}
 state.x=nx;state.y=ny;state.steps++;if(state.repelSteps>0)state.repelSteps--;
 if(t==='water'){state.surfing=true;if(Math.random()<.13&&state.repelSteps===0){startWild();return true}return false}
 state.surfing=false;
 if(t==='loot'){pickupHere();return true}
 if(t==='trainer'){trainerHere();return true}
 if(t==='center'){healCenter();return true}
 if(t==='market'){showShop();return true}
 if(t==='gym'){enterGym();return true}
 if(t==='cave'){v4EnterCave();return true}
 if(t==='rocketteam'){v4RocketHere();return true}
 if(t==='safari'){v4SafariStart();return true}
 if(t==='legend'){v4LegendsHere();return true}
 if((t==='wild'&&Math.random()<.24)||(t==='grass'&&Math.random()<.04))if(state.repelSteps===0){startWild();return true}
 if(state.safariActive){state.safariSteps++;if(state.safariSteps>=24){state.safariActive=false;state.bag.safariball=0;toast('🦒 Die Safari-Runde ist vorbei.');return true}if(Math.random()<.19){v4WildSafari();return true}}
 return false;
}
walk=function(dx,dy){if(state.dungeon)return v4WalkCave(dx,dy);if(!v41HasProfile()||modalOpen||battle||!state.starterChosen||currentPage!=='world')return;
 state.facing=dx>0?'right':dx<0?'left':dy>0?'down':'up';
 const count=state.bicycle&&!state.safariActive?2:1;
 for(let k=0;k<count;k++){
   const nx=state.x+dx,ny=state.y+dy;
   if(nx<0||ny<0||nx>=V41_W||ny>=V41_H){toast('⛔ Hier endet der Weg.');break}
   const t=atPosition(state.zone,nx,ny);
   if(['tree','rock','wall'].includes(t)){toast('🌳 Hier kommst du nicht durch.');break}
   if(t==='water'&&state.badges.length<8){toast('🌊 Surfen wird nach acht Siegel freigeschaltet!');break}
   if(v41ProcessTile(t,nx,ny))break;
   if(modalOpen||battle)break;
 }
 render();
};
interact=function(){if(modalOpen||battle||!v41HasProfile())return;
 if(state.dungeon){if(v4CaveTile(state.dungeon.x,state.dungeon.y)==='exit'){state.dungeon=null;state.x=11;state.y=4;render();return}modal('🕯️ Geheimhöhle','Aktiviere die beiden Schalter und finde den Schatz.',[['Verstanden','close']]);return}
 const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};const [dx,dy]=dirs[state.facing]||[0,-1];
 for(const [x,y] of [[state.x,state.y],[state.x+dx,state.y+dy]]){
  const t=atPosition(state.zone,x,y);
  if(t==='trainer'){const n=trainers(state.zone).find(n=>n.x===x&&n.y===y);return interactTrainer(n)}
  if(t==='loot'){state.x=x;state.y=y;return pickupHere()}
  if(t==='center')return healCenter();if(t==='market')return showShop();if(t==='gym')return enterGym();
  if(t==='cave')return v4EnterCave();if(t==='rocketteam')return v4RocketHere();if(t==='safari')return v4SafariStart();if(t==='legend')return v4LegendsHere();
 }
 modal('🧭 Trainer-Tipp',`Du erkundest ${AREAS[state.zone].name}. Die Karte ist jetzt 14 × 11 Felder groß. Die gesamte Karte bleibt immer sichtbar. Entdecke weitere Wege, Trainer und Schätze!`,[['Alles klar','close']]);
};
const v41Render=render;
render=function(){v41Render();v41ApplyAvatar();if(!state.starterChosen)return;
 if(state.gameWon)$('goal-title').textContent='👑 Champion '+v41SafeName()+'!';
};
const v41BattleDefeat=battleDefeat;
battleDefeat=function(){v41BattleDefeat();state.x=7;state.y=5;save();render()};
const v41ConfirmReset=confirmReset;
confirmReset=function(){v41ConfirmReset();v41ProfileScreen()};
const v41Load=v4SafeLoad;
v4SafeLoad=function(input){v41Load(input);v41ScaleSave(state);save();if(!v41HasProfile())v41ProfileScreen();else render()};
const v41TrainerPass=v4TrainerPass;
v4TrainerPass=function(){v41TrainerPass();const m=$('modal-content');const h=m.querySelector('h2');if(h)h.textContent='🎫 Trainerpass von '+v41SafeName();const trainer=m.querySelector('.v4-highlight b');if(trainer)trainer.textContent=(state.profileGender==='girl'?'👧 Trainerin ':'👦 Trainer ')+v41SafeName()};
const v41Guide=showGuide;
showGuide=function(){v41Guide();$('modal-content').querySelector('p')?.insertAdjacentHTML('beforeend','<p>🧭 Jede Region umfasst 14 × 11 Felder. Der Kartenausschnitt bewegt sich mit deiner Figur. Deinen Namen und deine Figur kannst du im Reise-Menü ändern.</p>')};
const v41DoAction=doAction;
doAction=function(action,el){if(action?.startsWith('profile-gender:')){
 v41SelectedGender=action.split(':')[1];document.querySelectorAll('.profile-choice').forEach(btn=>{const chosen=btn.dataset.action==='profile-gender:'+v41SelectedGender;btn.classList.toggle('chosen',chosen);btn.setAttribute('aria-pressed',String(chosen))});return;
 }if(action==='profile-confirm')return v41ConfirmProfile();if(action==='profile-edit')return v41ProfileScreen(true);
 return v41DoAction(action,el)};
// On a fresh run and on old saves from 4.0 ask for personal identity before gameplay.
if(!$('camera-position')){
 const label=document.createElement('span');label.id='camera-position';label.textContent='Karte 11/22 · 10/18';
 document.querySelector('.maptop')?.appendChild(label);
}
const profileButton=document.createElement('button');profileButton.type='button';profileButton.setAttribute('data-action','profile-edit');profileButton.textContent='👤 Trainerfigur & Namen ändern';document.querySelector('.v4-travel-buttons')?.appendChild(profileButton);
window.PokemonGame.walk=(dx,dy)=>walk(dx,dy);window.PokemonGame.enterZone=(z)=>enterZone(z);window.PokemonGame.v4.saveSlot=(data)=>v4SafeLoad(data);
window.PokemonGame.mapSize={width:V41_W,height:V41_H,viewWidth:V41_VIEW_W,viewHeight:V41_VIEW_H};window.PokemonGame.camera=v42Camera;
render();save();if(!v41HasProfile())v41ProfileScreen();
