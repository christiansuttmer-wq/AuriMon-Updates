/* AuriMon 5.3.0 — Schattenchronik, 10 Nebenaufträge,
   Runenruinen, fünf Legendäre Tempel und Fossilien.
   Erweiterung der originalen 151 Arten; ältere Spielstände bleiben lesbar. */
'use strict';
(() => {
 const TEAM_ZONES=[3,5,7,8,9],RUIN_ZONES=[2,3,4,5,6,8,9];
 const TEMPLE_ENTRIES=Object.entries(V4_LEGENDS).map(([id,q])=>({id:+id,...q}));
 const GLYPHS=['☀️','🌙','⭐','💎'];
 const SIDESTORIES=[
  'Ein verlorenes Paket für das Forschungslabor','Eine geheimnisvolle Spur im hohen Gras',
  'Der verschwundene Wanderstab','Blumen für die Gastgeberin','Flaschenpost vom Leuchtturm',
  'Ein schimmernder Bernsteinstein','Das Rätsel des alten Wegweisers','Der letzte Kristallsplitter',
  'Ein Brief aus dem Vulkanlager','Der verschwundene Bergkompass'];
 const SHADOW_STORY=[
  ['Das gestohlene Tagebuch','Das Schatten-Team stiehlt Aufzeichnungen der Professorin. Spüre den Kommandanten auf und hole die Seiten zurück.'],
  ['Das Kristallsignal','Aus Kristallen wird Energie gestohlen. Stelle den Sender in der Nähe des Außenpostens ab.'],
  ['Die vergessene Maschine','Ein uralter Mechanismus erwacht in der Ruinenstadt. Besiege seine Wächter.'],
  ['Der Drachenkompass','Ein besonderer Kompass führt die Schatten zu seltenen AuriMon. Gewinne ihn zurück.'],
  ['Die letzte Schattenfeste','Das Schatten-Team bereitet seine letzte Operation vor. Besiege den Oberkommandanten.']
 ];
 const fossilNames={helixfossil:'Helixfossil',domfossil:'Domfossil'};
 ITEM_INFO.helixfossil=['Helixfossil','🐚','In der Werkstatt zu Amonitas wiederbeleben.',0];
 ITEM_INFO.domfossil=['Domfossil','🦴','In der Werkstatt zu Kabuto wiederbeleben.',0];
 START_BAG.helixfossil=0;START_BAG.domfossil=0;
 function checkData(){
  const ar=['v53Ruins','v53Temples','v53StoryWins','v53SideDone'];
  for(const k of ar)if(!Array.isArray(state[k]))state[k]=[];
  if(!state.v53RuinsProgress||typeof state.v53RuinsProgress!=='object'||Array.isArray(state.v53RuinsProgress))state.v53RuinsProgress={};
  if(!state.v53TemplesProgress||typeof state.v53TemplesProgress!=='object'||Array.isArray(state.v53TemplesProgress))state.v53TemplesProgress={};
  if(!state.v53SideActive||typeof state.v53SideActive!=='object'||Array.isArray(state.v53SideActive))state.v53SideActive={};
  state.v53SideDone=[...new Set(state.v53SideDone.filter(z=>Number.isInteger(z)&&z>=0&&z<AREAS.length))];
  state.v53StoryWins=[...new Set(state.v53StoryWins.filter(z=>TEAM_ZONES.includes(z)))];
  state.v53Ruins=[...new Set(state.v53Ruins.filter(z=>RUIN_ZONES.includes(z)))];
  state.v53Temples=[...new Set(state.v53Temples.filter(id=>TEMPLE_ENTRIES.some(t=>t.id===id)))];
  state.bag.helixfossil=Math.max(0,Number(state.bag.helixfossil)||0);
  state.bag.domfossil=Math.max(0,Number(state.bag.domfossil)||0);
 }
 const baseDefault=defaultState;
 defaultState=function(){return {...baseDefault(),v53Ruins:[],v53Temples:[],v53StoryWins:[],v53SideDone:[],v53RuinsProgress:{},v53TemplesProgress:{},v53SideActive:{}}};
 const ready=()=>Number.isInteger(window.PokemonProfiles?.activeSlot)&&!!state.starterChosen&&state.party.length>0;
 const canInteract=()=>ready()&&!modalOpen&&!battle&&!state.dungeon&&!state.v51Indoor;
 const count=(arr)=>Array.isArray(arr)?arr.length:0;
 const esc=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ebtn=(title,act,off=false)=>`<button type="button" data-action="${act}" ${off?'disabled':''}>${title}</button>`;
 function sideTask(z){
  const started=state.v53SideActive[z];
  if(!started)return 'Starte den Auftrag beim Ortsbewohner.';
  const ty=z%4;
  if(ty===0)return `Noch ${Math.max(0,24-(state.steps-started.steps))} Schritte erkunden.`;
  if(ty===1)return `Noch ${Math.max(0,2-(state.battleWins-started.wins))} Kämpfe gewinnen.`;
  if(ty===2)return state.v51Puzzles?.includes(z)?'Runenrätsel ist gelöst!':'Das regionale Runenrätsel lösen.';
  return state.v51Caches?.includes(z)?'Geheimschatz ist gefunden!':'Den regionalen Runenschatz bergen.';
 }
 function sideReady(z){const a=state.v53SideActive[z];if(!a)return false;
  return z%4===0?state.steps-a.steps>=24:z%4===1?state.battleWins-a.wins>=2:z%4===2?state.v51Puzzles?.includes(z):state.v51Caches?.includes(z);
 }
 function sideDialog(){if(!ready())return;checkData();const z=state.zone,done=state.v53SideDone.includes(z),started=!!state.v53SideActive[z];
  modal('📜 Ortsauftrag: '+AREAS[z].name,`<div class="v53-flavor"><strong>${esc(SIDESTORIES[z])}</strong><p>${done?'✅ Du hast dem Bewohner geholfen.':sideTask(z)}</p><small>Ort ${z+1} von ${AREAS.length} · Die Belohnung gibt es nur einmal pro Spielstand.</small></div>`,
  done?[[ 'Zurück','close']]:[[started?(sideReady(z)?'🎁 Belohnung abholen':'Auftrag prüfen'):'Auftrag annehmen','v53-side-progress','gold'],['Zurück','close']]);
 }
 function sideProgress(){checkData();const z=state.zone;if(state.v53SideDone.includes(z))return sideDialog();
  if(!state.v53SideActive[z]){state.v53SideActive[z]={steps:state.steps,wins:state.battleWins};save();return sideDialog()}
  if(!sideReady(z))return sideDialog();
  state.v53SideDone.push(z);delete state.v53SideActive[z];state.coins+=120+z*22;
  const reward=z%3===0?'candy':z%3===1?'greatball':'superpotion';gainItem(reward,1);save();render();
  modal('🎉 Ortsauftrag abgeschlossen!',`Du erhältst ${120+z*22} Münzen und ${esc(ITEM_INFO[reward][0])}. Geschaffte Ortsaufträge: ${state.v53SideDone.length}/${AREAS.length}.`,[['Weiter','close','gold']]);
 }
 function ruinPattern(z){return [(z+1)%4,(z+2)%4,(z+3)%4]}
 function ruinDialog(){if(!ready())return;checkData();const z=state.zone;
  if(!RUIN_ZONES.includes(z))return modal('🏛️ Uralte Ruinen','Nicht jeder Ort verbirgt eine Runenruine. Halte nach alten Steinen und ungewöhnlichen Zeichen Ausschau.',[['Zurück','close']]);
  const done=state.v53Ruins.includes(z),progress=state.v53RuinsProgress[z]||0;
  const omitted=['Sonne','Mond','Stern','Kristall'][z%4];
  const story=`In der Ruine von ${AREAS[z].name} siehst du ein uraltes Runenrad: ☀️ · 🌙 · ⭐ · 💎. <em>„Das Zeichen von ${omitted} schweigt. Drei Stimmen bleiben, und ihr Kreis dreht sich nur in eine Richtung.“</em>`;
  if(done)return modal('🏛️ Alte Ruine von '+AREAS[z].name,`${story}<p>✅ Diese Ruine wurde bereits entschlüsselt.</p>`,[['Weiterreisen','close']]);
  modal('🏛️ Alte Ruine von '+AREAS[z].name,`<p>${story}</p><p>Aktivierte Symbole: <b>${progress}/3</b></p><div class="v53-glyphs">${GLYPHS.map((g,i)=>ebtn(g,'v53-glyph:'+i)).join('')}</div>`,[['Zurück','close']]);
 }
 function selectGlyph(g){checkData();const z=state.zone;if(!RUIN_ZONES.includes(z)||state.v53Ruins.includes(z))return;
  const seq=ruinPattern(z),cur=Number(state.v53RuinsProgress[z])||0;
  if(g!==seq[cur]){state.v53RuinsProgress[z]=0;save();return modal('🪨 Die Schrift verblasst','Die Reihenfolge war falsch. Die Symbole setzen sich zurück.',[['Noch einmal','v53-ruin','gold'],['Zurück','close']])}
  if(cur<2){state.v53RuinsProgress[z]=cur+1;save();return ruinDialog()}
  state.v53Ruins.push(z);state.v53RuinsProgress[z]=3;
  const treasure=z===2?'helixfossil':z===5?'domfossil':z===4?'Tausch-Kabel':'candy';
  gainItem(treasure,treasure==='candy'?3:1);state.coins+=200+z*17;save();render();
  modal('💎 Ruine entschlüsselt!',`Du entdeckst ${esc(ITEM_INFO[treasure]?.[0]||treasure)} und ${200+z*17} Münzen. Insgesamt ${state.v53Ruins.length}/7 Ruinen gelöst.`,[['Großartig!','close','gold']]);
 }
 function templePattern(id){return [(id+1)%4,(id+3)%4,(id+2)%4]}
 function templeDialog(id=null){if(!ready())return;checkData();const here=TEMPLE_ENTRIES.filter(t=>t.zone===state.zone);
  if(id===null&&here.length>1)return modal('✨ Legendäre Tempel',`<p>Wähle den Schrein, dessen Geheimnis du erforschen möchtest.</p><div class="v53-glyphs">${here.map(t=>ebtn((state.v53Temples.includes(t.id)?'✅ ':'🔮 ')+esc(POKE[t.id].name),'v53-temple:'+t.id)).join('')}</div>`,[['Zurück','close']]);
  const q=id===null?here[0]:here.find(t=>t.id===id);
  if(!q)return modal('✨ Legendäre Tempel','Die Legenden erzählen von fünf verborgenen Schreinen. Erforsche die Welt und folge den Spuren der Elemente.',[['Zurück','close']]);
  const done=state.v53Temples.includes(q.id),progress=state.v53TemplesProgress[q.id]||0;
  const silent=['Sonne','Mond','Stern','Kristall'][q.id%4];
  const intro=`Eine alte Überlieferung spricht von <b>${esc(POKE[q.id].name)}</b> und einem verlorenen Zeichen.<p>Auf dem Tempelboden steht: <em>„Vier Zeichen sind auf einem Ring vereint: ☀️ · 🌙 · ⭐ · 💎. ${silent} verstummt. Vorwärts öffnet das Tor, rückwärts folgt der Wächter, gegenüber endet die Reise.“</em></p>`;
  if(done)return modal('✨ Tempel von '+POKE[q.id].name,`${intro}<p>✅ Der Tempel ist geöffnet.</p><p>${state.caught.includes(q.id)?'✅ Diese Legende wurde bereits gefangen.':state.badges.length<q.badges?'🔒 Mehr Siegel sind nötig, um die Legende herauszufordern.':'✨ Das AuriMon kann an seinem bekannten Fundort herausgefordert werden.'}</p>`,[[ 'Legendäres AuriMon suchen','v53-legend:'+q.id,'gold'],['Zurück','close']]);
  modal('✨ Tempel von '+POKE[q.id].name,`${intro}<p>Aktivierte Glyphen: ${progress}/3</p><div class="v53-glyphs">${GLYPHS.map((g,i)=>ebtn(g,'v53-temple-glyph:'+q.id+':'+i)).join('')}</div>`,[['Zurück','close']]);
 }
 function templeGlyph(id,g){checkData();const q=TEMPLE_ENTRIES.find(t=>t.id===id);if(!q||q.zone!==state.zone||state.v53Temples.includes(id))return;
  const cur=Number(state.v53TemplesProgress[id])||0;if(g!==templePattern(id)[cur]){state.v53TemplesProgress[id]=0;save();return modal('🔮 Die Energie erlischt','Die Reihenfolge war falsch. Versuche es erneut.',[['Noch einmal','v53-temple','gold'],['Zurück','close']])}
  if(cur<2){state.v53TemplesProgress[id]=cur+1;save();return templeDialog(id)}
  state.v53TemplesProgress[id]=3;state.v53Temples.push(id);gainItem('greatball',5);save();render();
  modal('🌟 Legendärer Schrein erwacht!',`Der Tempel für ${POKE[id].name} ist geöffnet. Du erhältst fünf Superbälle. Um ${POKE[id].name} zu begegnen, gelten weiterhin die bisherigen Siegel- und AuriDex-Voraussetzungen.`,[['Zum Tempel','v53-temple:'+id,'gold'],['Weiterreisen','close']]);
 }
 function legendary(id){const q=TEMPLE_ENTRIES.find(t=>t.id===id);if(!q||q.zone!==state.zone||!state.v53Temples.includes(id))return toast('🔒 Entschlüssele zuerst den Tempel dieser Region.');
  if(!v4CanLegend(id))return toast('🔒 Die Voraussetzungen für diese legendäre Begegnung fehlen noch.');
  if(state.caught.includes(id))return toast('✨ Diese Legende hast du bereits gefangen.');
  v4EncounterLegend(id);
 }
 function storyDialog(){if(!ready())return;checkData();
  const z=state.zone,i=TEAM_ZONES.indexOf(z);
  const rows=TEAM_ZONES.map((zone,n)=>`<div class="v53-story-row"><b>${state.v53StoryWins.includes(zone)?'✅':state.rocketWins?.includes(zone)?'✨':'🔒'} Kapitel ${n+1}: ${SHADOW_STORY[n][0]}</b><small>${state.visited?.includes(zone)?AREAS[zone].name:'Ort unbekannt'}${state.v53StoryWins.includes(zone)?' · Kommandant besiegt':state.rocketWins?.includes(zone)?' · Bereit für den Kommandanten':' · Suche die Spur des Schatten-Teams'}</small></div>`).join('');
  const can=i!==-1&&state.rocketWins?.includes(z)&&!state.v53StoryWins.includes(z);
  modal('🕶️ Die Schattenchronik',`<p>Fünf neue Kapitel führen durch die verborgenen Pläne des Schatten-Teams. Gewinne zuerst den ursprünglichen Schatten-Kampf der Region.</p>${rows}<p>${i!==-1?esc(SHADOW_STORY[i][1]):'Der nächste Kommandant wartet in einem Schatten-Team-Gebiet.'}</p><div class="v53-action">${ebtn('⚔️ Schattenkommandant herausfordern','v53-shadow',!can)}</div>`,[['Zurück','close']]);
 }
 function shadowFight(){checkData();const z=state.zone,i=TEAM_ZONES.indexOf(z);
  if(i<0||!state.rocketWins?.includes(z)||state.v53StoryWins.includes(z)||!chooseAlive())return toast('🔒 Kapitel gesperrt oder Team nicht kampfbereit.');
  const pool=[[20,42],[24,89,93],[49,94,110],[105,122,125,130],[65,94,130,149,150]][i];
  const team=pool.map((id,j)=>newMon(id,clamp(18+i*13+j*2,18,96)));
  closeModal();startBattle('v53-shadow',team,'Schattenkommandant · Kapitel '+(i+1),'v53:shadow:'+z,250+i*300);
 }
 function fossilDialog(){if(!ready())return;checkData();
  const isWorkshop=state.v51Indoor?.kind==='atelier';
  modal('🦴 Fossilien-Labor',`<p>Zwei verschollene Fossilien warten auf ihre Entdeckung. Ein kundiger Chronist könnte ihre Geheimnisse lüften.</p><p>Du besitzt <b>${bagCount('helixfossil')} Helixfossil</b> und <b>${bagCount('domfossil')} Domfossil</b>.</p><p>${isWorkshop?'✅ Du stehst in einer Werkstatt.':'🏠 Betritt eine Werkstatt in einer der 10 Regionen, um Fossilien wiederzubeleben.'}</p><p>Jede Wiederbelebung kostet 200 Münzen. Das AuriMon kommt bei vollem Team in die Box.</p><div class="v53-fossils">${ebtn('🐚 Amonitas wiederbeleben','v53-fossil:helixfossil',!isWorkshop||!bagCount('helixfossil')||state.coins<200)}${ebtn('🦴 Kabuto wiederbeleben','v53-fossil:domfossil',!isWorkshop||!bagCount('domfossil')||state.coins<200)}</div>`,[['Zurück','close']]);
 }
 function reviveFossil(kind){checkData();if(!['helixfossil','domfossil'].includes(kind)||state.v51Indoor?.kind!=='atelier'||bagCount(kind)<1||state.coins<200)return toast('🔒 Du benötigst die Werkstatt, das Fossil und 200 Münzen.');
  const id=kind==='helixfossil'?138:140;state.bag[kind]--;state.coins-=200;
  const m=newMon(id,20);m.shiny=false;const target=state.party.length<6?'party':'box';state[target].push(m);caught(id);save();render();
  modal('🥚 Fossil wiederbelebt!',`${art(id)}<b>${POKE[id].name}</b> ist geschlüpft! Es wartet ${target==='box'?'in deiner AuriMon-Box':'in deinem Team'}.`,[['Juhu!','close','gold']]);
 }
 function overview(){if(!ready())return;checkData();
  const current=state.zone,quest=state.v53SideDone.includes(current)?'✅ Abgeschlossen':sideReady(current)?'🎁 Belohnung bereit':state.v53SideActive[current]?'⏳ In Arbeit':'✨ Neu';
  modal('📖 Abenteuer 5.3',`<p>Weitere Geschichten aus den 10 Regionen – alle ohne neue AuriMon-Arten.</p>
   <div class="v53-grid">
    <div class="v53-card"><b>📜 Ortsaufträge</b><small>${state.v53SideDone.length}/${AREAS.length} erledigt · Hier: ${quest}</small>${ebtn('Ortsauftrag öffnen','v53-side')}</div>
    <div class="v53-card"><b>🕶️ Schattenchronik</b><small>${state.v53StoryWins.length}/5 Kommandanten</small>${ebtn('Kapitel ansehen','v53-story')}</div>
    <div class="v53-card"><b>🏛️ Runenruinen</b><small>${state.v53Ruins.length}/7 entschlüsselt</small>${ebtn('Ruine erkunden','v53-ruin',!RUIN_ZONES.includes(current))}</div>
    <div class="v53-card"><b>✨ Legendäre Tempel</b><small>${state.v53Temples.length}/5 entschlüsselt</small>${ebtn('Tempel erkunden','v53-temple',!TEMPLE_ENTRIES.some(t=>t.zone===current))}</div>
    <div class="v53-card"><b>🦴 Fossilien</b><small>${bagCount('helixfossil')+bagCount('domfossil')} Fossilien im Rucksack</small>${ebtn('Fossilien-Labor','v53-fossils')}</div>
   </div>`,[['Schließen','close']]);
 }
 const origAction=doAction;
 doAction=function(act,el){if(!act)return;
  if(act==='v53-overview')return overview();if(act==='v53-side')return sideDialog();if(act==='v53-side-progress')return sideProgress();
  if(act==='v53-ruin')return ruinDialog();if(act.startsWith('v53-glyph:'))return selectGlyph(Number(act.split(':')[1]));
  if(act==='v53-temple')return templeDialog();if(act.startsWith('v53-temple:'))return templeDialog(+act.split(':')[1]);if(act.startsWith('v53-temple-glyph:')){const parts=act.split(':');return templeGlyph(+parts[1],+parts[2])}
  if(act.startsWith('v53-legend:'))return legendary(+act.split(':')[1]);
  if(act==='v53-story')return storyDialog();if(act==='v53-shadow')return shadowFight();
  if(act==='v53-fossils')return fossilDialog();if(act.startsWith('v53-fossil:'))return reviveFossil(act.split(':')[1]);
  return origAction(act,el);
 };
 const origWin=battleVictory;
 battleVictory=function(){
  if(!battle)return;const b=battle;
  if(b.kind==='v53-shadow'){
   checkData();const z=Number(b.key.split(':')[2]);if(!TEAM_ZONES.includes(z)||state.v53StoryWins.includes(z))return origWin();
   state.v53StoryWins.push(z);state.coins+=b.reward;state.battleWins++;
   gainItem('candy',z===9?4:2);save();
   origWin();$('modal-content')?.insertAdjacentHTML('beforeend',`<p>🕶️ Das Kapitel wurde abgeschlossen! ${state.v53StoryWins.length}/5 Schattenkommandanten besiegt. Du erhältst ${b.reward} Münzen und Sonderbonbons.</p>`);return;
  }
  return origWin();
 };
 const origTravel=renderTravel;
 renderTravel=function(){origTravel();checkData();const report=document.createElement('section');report.className='v53-report';report.innerHTML=`<h2>🗝️ Erweiterte Abenteuer</h2><p>📜 Ortsaufträge: ${state.v53SideDone.length}/${AREAS.length} · 🕶️ Schattenchronik: ${state.v53StoryWins.length}/5</p><p>🏛️ Ruinen: ${state.v53Ruins.length}/7 · ✨ Tempel: ${state.v53Temples.length}/5</p>${ebtn('📖 Geschichten & Rätsel ansehen','v53-overview')}`;$('journal')?.appendChild(report)};
 const origGuide=showGuide;
 showGuide=function(){origGuide();$('modal-content')?.insertAdjacentHTML('beforeend','<p>🗝️ 5.3: Starte im Schnellmenü die Abenteuerübersicht. Die 10 Orte besitzen Nebenaufträge. Erkunde ungewöhnliche Bauwerke, achte auf Inschriften und lass dir von Bewohnern helfen.</p>')};
 const extras=document.createElement('div');extras.className='v53-shortcuts';extras.innerHTML='<button type="button" data-action="v53-overview">🗝️ Abenteuer & Rätsel</button>';
 document.querySelector('.v4-shortcuts')?.appendChild(extras);
 const origDraw=window.PokemonBattle52?.drawRival;
 if(window.PokemonBattle52){window.PokemonBattle52.drawRival=function(c,view,T,ms){origDraw?.(c,view,T,ms);if(!ready()||state.dungeon||state.v51Indoor)return;
   const z=state.zone;
   const marks=[];
   if(RUIN_ZONES.includes(z))marks.push({x:16,y:15,col:'#92ebf5',icon:'◆',done:state.v53Ruins?.includes(z)});
   if(TEMPLE_ENTRIES.some(e=>e.zone===z))marks.push({x:11,y:15,col:'#ffcf7e',icon:'✦',done:state.v53Temples?.some(id=>V4_LEGENDS[id]?.zone===z)});
   if(TEAM_ZONES.includes(z))marks.push({x:19,y:11,col:'#d5a6ff',icon:'!',done:state.v53StoryWins?.includes(z)});
   for(const m of marks){const x=(m.x-view.x0)*T,y=(m.y-view.y0)*T;if(x<0||y<0||x>=view.w*T||y>=view.h*T)continue;
    const drift=Math.sin(ms/350)*3;c.save();c.font='bold 22px monospace';c.textAlign='center';c.shadowBlur=10;c.shadowColor=m.col;c.fillStyle=m.done?'#b6c2ca':m.col;c.fillText(m.done?'✓':m.icon,x+T/2,y+T/2+drift);c.restore();}
  };}
 window.PokemonAdventure53={version:'5.3.0',areas:AREAS.length,maxSpecies:151,ruinZones:[...RUIN_ZONES],shadowZones:[...TEAM_ZONES],templeIds:TEMPLE_ENTRIES.map(t=>t.id),status:()=>{checkData();return{ruins:[...state.v53Ruins],temples:[...state.v53Temples],story:[...state.v53StoryWins],side:[...state.v53SideDone]}}};
 checkData();
})();
