/* Ergänzungen für 5.5.0: Angelplätze, Outfits, Schatzkarten, sichtbare Wildbegegnungen. */
'use strict';
(() => {
 const COATS=[['Ozeanblau','#337ed5','#90ddff'],['Koralle','#e96e9a','#ffc0db'],['Waldgrün','#418d59','#a9e4a3'],['Sonnengelb','#d3a34a','#ffe2a6'],['Nachtviolett','#8060bd','#d0b2ff'],['Feuerrot','#bf555c','#ffa3a6']];
 const HAIR=[['Dunkelbraun','#503a63'],['Blond','#e5ba70'],['Schwarz','#252c45'],['Silber','#ccd9e5']];
 const FISH=[129,118,120,72,90,54,60,86,98,116,79,131];
 const ready=()=>Number.isInteger(window.PokemonProfiles?.activeSlot)&&state.starterChosen&&state.party.length;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const previousDefault=defaultState;
 defaultState=function(){return {...previousDefault(),v55Outfit:null,v55FishCount:0,v55TreasureActive:{},v55TreasureFound:[],v55VisibleSeen:{}}};
 function ensure(){
  if(!state.v55Outfit||!COATS.some(c=>c[1]===state.v55Outfit.coat)||!HAIR.some(h=>h[1]===state.v55Outfit.hair)){
   state.v55Outfit={coat:state.profileGender==='girl'?COATS[1][1]:COATS[0][1],light:state.profileGender==='girl'?COATS[1][2]:COATS[0][2],hair:HAIR[0][1]};
  }
  if(!state.v55TreasureActive||typeof state.v55TreasureActive!=='object')state.v55TreasureActive={};
  if(!Array.isArray(state.v55TreasureFound))state.v55TreasureFound=[];
  if(!state.v55VisibleSeen||typeof state.v55VisibleSeen!=='object')state.v55VisibleSeen={};
  if(!Number.isFinite(state.v55FishCount))state.v55FishCount=0;
 }
 function wardrobe(){if(!ready())return;ensure();
  const coats=COATS.map((v,i)=>`<button class="v55-color-pick ${state.v55Outfit.coat===v[1]?'active':''}" data-action="v55-coat:${i}"><i style="background:${v[1]}"></i>${esc(v[0])}</button>`).join('');
  const hairs=HAIR.map((v,i)=>`<button class="v55-color-pick ${state.v55Outfit.hair===v[1]?'active':''}" data-action="v55-hair:${i}"><i style="background:${v[1]}"></i>${esc(v[0])}</button>`).join('');
  modal('🎨 Dein Trainer-Outfit',`<p>Wähle Farben für deine HD-Pixel-Spielfigur. Die Auswahl gehört nur zu deinem Spielerprofil.</p><h3>Jacke</h3><div class="v55-colors">${coats}</div><h3>Haare</h3><div class="v55-colors">${hairs}</div>`,[['Fertig','close','gold']]);
 }
 function chooseCoat(i){if(!ready()||!COATS[i])return;ensure();state.v55Outfit.coat=COATS[i][1];state.v55Outfit.light=COATS[i][2];save();wardrobe()}
 function chooseHair(i){if(!ready()||!HAIR[i])return;ensure();state.v55Outfit.hair=HAIR[i][1];save();wardrobe()}
 function fishing(){if(!ready()||modalOpen||battle||state.dungeon||state.v51Indoor)return;
  const water=AREAS[state.zone]?.theme==='ocean'||[[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>getGround(state.zone,state.x+dx,state.y+dy)==='water');
  if(!water)return toast('🎣 Suche einen See oder die Küste zum Angeln.');
  if(Math.random()<.17)return toast('🎣 Heute hat leider nichts angebissen.');
  ensure();state.v55FishCount++;
  const z=state.zone,id=FISH[(hash(z,state.steps,state.v55FishCount)+Math.floor(z/2))%FISH.length];
  save();startBattle('wild',[newMon(id,clamp(5+z*3,4,87))],'Geangeltes '+POKE[id].name,'fish:'+z,0);
 }
 function treasure(){if(!ready())return;ensure();const z=state.zone,found=state.v55TreasureFound.includes(z),active=state.v55TreasureActive[z];
  modal('🗺️ Schatzkarte: '+AREAS[z].name,`<p>${found?'✅ Schatz bereits gefunden!':active?'Die alte Karte zeigt einen Pfad und ein verblasstes Zeichen. Suche nach einer Stelle, die nicht ganz zu ihrer Umgebung passt.':'Eine alte Schatzkarte führt dich zu einem verborgenen Fund. Du kannst sie für diese Region entschlüsseln.'}</p><p>🎁 ${state.v55TreasureFound.length}/${AREAS.length} regionale Schatzkarten abgeschlossen.</p>`,found?[[ 'Schließen','close']]:[[active?'Weiter suchen':'Schatzkarte entschlüsseln',active?'close':'v55-map-start','gold'],['Schließen','close']]);
 }
 function startMap(){if(!ready())return;ensure();state.v55TreasureActive[state.zone]=true;save();treasure()}
 function encounter(){if(!ready()||battle||modalOpen)return;ensure();const z=state.zone,id=ZONE_POOLS[z].find(n=>n<=143)||25;
  state.v55VisibleSeen[z]=state.steps;save();
  seen(id);startBattle('wild',[newMon(id,clamp(5+z*3,4,88))],'Freilaufendes '+POKE[id].name,'roam:'+z,0);
 }
 function markerVisible(){if(!ready()||state.dungeon||state.v51Indoor)return false;ensure();return state.v55VisibleSeen[state.zone]===undefined||state.steps-state.v55VisibleSeen[state.zone]>=35}
 const prevWalk=walk;
 walk=function(dx,dy){const oldZ=state.zone,oldX=state.x,oldY=state.y;prevWalk(dx,dy);
  if(!ready()||battle||modalOpen||state.dungeon||state.v51Indoor||state.zone!==oldZ||oldX===state.x&&oldY===state.y)return;
  ensure();if(state.v55TreasureActive[state.zone]&&!state.v55TreasureFound.includes(state.zone)&&state.x===9&&state.y===9){
   state.v55TreasureFound.push(state.zone);const coins=120+state.zone*18;state.coins+=coins;gainItem('candy',1);save();
   modal('🗺️ Vergrabener Schatz!',`Du hast die Schatzkarte gelöst! +${coins} Münzen und ein EP-Bonbon.`,[['Weiter','close','gold']]);return;
  }
  if(state.x===8&&state.y===9&&markerVisible())encounter();
 };
 const oldAction=doAction;
 doAction=function(act,el){if(act==='v55-outfit')return wardrobe();if(act==='v55-fish'){closeModal();return fishing()};
  if(act==='v55-treasure')return treasure();if(act==='v55-map-start')return startMap();
  if(act?.startsWith('v55-coat:'))return chooseCoat(Number(act.split(':')[1]));
  if(act?.startsWith('v55-hair:'))return chooseHair(Number(act.split(':')[1]));
  return oldAction(act,el)
 };
 const oldTravel=renderTravel;
 renderTravel=function(){oldTravel();if(!ready())return;ensure();const row=document.createElement('section');row.className='v55-travel-card';row.innerHTML=`<h2>🧢 Weitere Entdeckungen</h2><p>🎣 ${state.v55FishCount} Angelbegegnungen · 🗺️ ${state.v55TreasureFound.length}/${AREAS.length} Schatzkarten</p><div class="v55-actions"><button data-action="v55-outfit">🎨 Trainerkleidung</button><button data-action="v55-treasure">🗺️ Schatzkarte</button><button data-action="v55-fish">🎣 Angeln</button></div>`;$('journal')?.appendChild(row)};
 const previousRender=window.PokemonBattle52?.drawRival;
 if(window.PokemonBattle52)window.PokemonBattle52.drawRival=function(c,view,T,ms){previousRender?.(c,view,T,ms);if(!markerVisible())return;
  const x=(10-view.x0)*T+T/2,y=(12-view.y0)*T+T/2;
  if(x<0||y<0||x>=view.w*T||y>=view.h*T)return;
  const id=ZONE_POOLS[state.zone].find(n=>n<=143)||25;
  c.save();c.font='bold 25px monospace';c.textAlign='center';c.shadowColor='#fff9b0';c.shadowBlur=8;c.fillStyle='#fff0ad';c.fillText(POKE[id]?.symbol||'✦',x,y+Math.sin(ms/300)*3+7);c.restore();
 };
 const outer=showGuide;
 showGuide=function(){outer();$('modal-content')?.insertAdjacentHTML('beforeend','<p>🎣 Angeln ist an Seen oder Küsten möglich. 🗺️ Schatzkarten enthalten Hinweise auf versteckte Funde. 🎨 Dein Outfit kannst du jederzeit über die neuen Schnellaktionen anpassen. Sichtbare wilde AuriMon warten auf dem Hauptweg.</p>')};
 document.querySelector('.v4-shortcuts')?.insertAdjacentHTML('beforeend','<div class="v55-shortcuts"><button type="button" data-action="v55-outfit">🎨 Outfit</button><button type="button" data-action="v55-treasure">🗺️ Schatz</button><button type="button" data-action="v55-fish">🎣 Angeln</button></div>');
 // preserve the player's wardrobe when using NG+: wrapper that restores it immediately afterward.
 window.PokemonAdventure55.extras={get:()=>{ensure();return{fish:state.v55FishCount,treasures:state.v55TreasureFound.length,outfit:{...state.v55Outfit}}},wardrobe,fishing,treasure};
 ensure();
})();
