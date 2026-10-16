/* AURELIOS AURIMON 4.0 — Erweiterung des Originalspiels 3.0
   Original-Dex und alle 151 Arten bleiben erhalten. Keine Arten >151.
   Alle Spielinhalte lokal; AuriMon-Grafiken optional aus dem Netzwerk. */
'use strict';
const V4_CAVES=[2,5,8,9];
const V4_ROCKET=[3,7,8,9];
const V4_LEGENDS={144:{zone:7,badges:8,place:'Kristallsee',story:'Der eisige Schutzgeist Arktos wartet in den stillen Kristallhöhlen.'},145:{zone:9,badges:10,place:'Wolkenhöhe',story:'Zapdos versteckt sich in den Gewitterwolken über dem Gipfel.'},146:{zone:8,badges:9,place:'Vulkanpass',story:'Lavados bewacht das Feuer im Vulkan.'},150:{zone:9,badges:10,place:'Wolkenhöhe',story:'Mewtu erwartet dich hinter dem Geheimnis der Schatten.'},151:{zone:9,badges:10,place:'Wolkenhöhe',story:'Mew erscheint nur dem Trainer mit den 150 anderen Arten.'}};
const V4_MOVES={
 Normal:['Ruckzuckhieb','Megahieb','Bodycheck'],Feuer:['Glut','Flammenwurf','Feuersturm'],Wasser:['Aquaknarre','Blubbstrahl','Hydropumpe'],Pflanze:['Rankenhieb','Rasierblatt','Solarstrahl'],Elektro:['Donnerschock','Donnerblitz','Donner'],Eis:['Pulverschnee','Eisstrahl','Blizzard'],Kampf:['Karateschlag','Fußkick','Kreuzhieb'],Gift:['Giftstachel','Smog','Schlammbombe'],Boden:['Lehmschuss','Schaufler','Erdbeben'],Flug:['Windstoß','Flügelschlag','Himmelsfeger'],Psycho:['Konfusion','Psystrahl','Psychokinese'],Käfer:['Käferbiss','Zornklinge','Kreuzschere'],Gestein:['Steinwurf','Felswurf','Steinhagel'],Geist:['Schlecker','Nachtnebel','Spukball'],Drache:['Drachenwut','Drachenpuls','Hyperstrahl'],Stahl:['Metallklaue','Eisenkopf','Metallstoß']};
const V4_WEATHERS={grass:['Sonnig','Klar','Regen'],ocean:['Regen','Klar','Wind'],mountain:['Wind','Klar','Gewitter'],volcano:['Sonnig','Klar','Wind'],dark:['Nebel','Regen','Klar'],ice:['Schnee','Klar','Wind']};
const V4_EMOJI={'Sonnig':'☀️','Klar':'🌤️','Regen':'🌧️','Wind':'💨','Gewitter':'⛈️','Nebel':'🌫️','Schnee':'❄️'};
const V4_DUNGEON=[
 '###########',
 '#....T....#',
 '#####D#####',
 '#S.......S#',
 '#..##.##..#',
 '#..##.##..#',
 '#.........#',
 '#...K.....#',
 '#####E#####'
];
ITEM_INFO.safariball=['Safariball','🟢','Nur in der Safari-Zone, erhöhte Fangchance.',0];
ITEM_INFO.ether=['Äther','💠','Stellt 10 AP aller Attacken wieder her.',145];
ITEM_INFO.antidote=['Gegengift','🌿','Entfernt Gift, Schlaf oder Paralyse.',45];
START_BAG.safariball=0;START_BAG.ether=2;START_BAG.antidote=2;
// Umstellung der alten lokalen v3-Spielstände, auch von älteren Charakteren.
state.version=4;
state.shards=state.shards||[];
state.rocketWins=state.rocketWins||[];
state.leagueWins=state.leagueWins||[];
state.caveSolved=state.caveSolved||[];
state.dungeon=state.dungeon||null;
state.safariActive=!!state.safariActive;
state.safariSteps=state.safariSteps||0;
state.bicycle=!!state.bicycle;
state.followerUid=state.followerUid||state.activeUid||null;
state.achievements=state.achievements||[];
state.questClaims=state.questClaims||[];
state.daily=state.daily||null;
state.leagueDone=!!state.leagueDone;
state.storyFlags=state.storyFlags||[];
state.bag={...START_BAG,...state.bag};
state.seen=state.seen.filter(id=>id>=1&&id<=151);
state.caught=state.caught.filter(id=>id>=1&&id<=151);
for(const m of allMons()){if(!(m.id>=1&&m.id<=151))continue;m.shiny=!!m.shiny;m.status=m.status||null}
function v4Moves(m){
 if(!m)return [];
 if(Array.isArray(m.moves)&&m.moves.length===4&&m.moves.every(v=>v&&typeof v.name==='string'&&Number.isFinite(v.pp)))return m.moves;
 const main=POKE[m.id]?.types[0]||'Normal',alt=POKE[m.id]?.types[1]||main;
 const definitions={
  Tackle:['Normal',40,35],Kratzer:['Normal',40,35],Ruckzuckhieb:['Normal',40,30],Bodycheck:['Normal',85,15],Biss:['Unlicht',60,25],Hyperzahn:['Normal',80,15],
  Glut:['Feuer',40,25],Flammenwurf:['Feuer',90,15],Feuersturm:['Feuer',110,5],Feuerzahn:['Feuer',65,15],
  Aquaknarre:['Wasser',40,25],Blubbstrahl:['Wasser',65,20],Hydropumpe:['Wasser',110,5],Surfer:['Wasser',90,15],
  Rankenhieb:['Pflanze',45,25],Rasierblatt:['Pflanze',55,25],Solarstrahl:['Pflanze',120,10],
  Donnerschock:['Elektro',40,30],Donnerblitz:['Elektro',90,15],Donner:['Elektro',110,10],
  Giftstachel:['Gift',15,35],Schlammbombe:['Gift',90,10],Steinwurf:['Gestein',50,15],Erdbeben:['Boden',100,10],
  Flügelschlag:['Flug',60,35],Windstoß:['Flug',40,35],Konfusion:['Psycho',50,25],Psychokinese:['Psycho',90,10],
  Eisstrahl:['Eis',90,10],Pulverschnee:['Eis',40,25],Schlecker:['Geist',30,30],Spukball:['Geist',80,15],
  Käferbiss:['Käfer',60,20],Karateschlag:['Kampf',50,25],Fußkick:['Kampf',60,20],
  Metallklaue:['Stahl',50,35],Drachenpuls:['Drache',85,10],Drachenwut:['Drache',40,10],
  Giftpuder:['Gift',0,35,'gift',75],Toxin:['Gift',0,10,'gift',90],Irrlicht:['Feuer',0,15,'burn',85],
  Donnerwelle:['Elektro',0,20,'paralyze',90],Hypnose:['Psycho',0,20,'sleep',60],Schlafpuder:['Pflanze',0,15,'sleep',75]
 };
 // Kuratierte Kanto-Familien. Die übrigen Arten erhalten sichere, zu ihren Typen passende Moves.
 const special={
  1:['Tackle','Rankenhieb','Rasierblatt','Giftpuder'],2:['Tackle','Rankenhieb','Rasierblatt','Giftpuder'],3:['Bodycheck','Rasierblatt','Solarstrahl','Schlafpuder'],
  4:['Kratzer','Glut','Feuerzahn','Irrlicht'],5:['Kratzer','Glut','Flammenwurf','Irrlicht'],6:['Kratzer','Flammenwurf','Feuersturm','Flügelschlag'],
  7:['Tackle','Aquaknarre','Biss','Blubbstrahl'],8:['Tackle','Aquaknarre','Biss','Blubbstrahl'],9:['Bodycheck','Blubbstrahl','Hydropumpe','Biss'],
  25:['Ruckzuckhieb','Donnerschock','Donnerblitz','Donnerwelle'],26:['Ruckzuckhieb','Donnerblitz','Donner','Donnerwelle'],
  19:['Tackle','Ruckzuckhieb','Biss','Hyperzahn'],20:['Ruckzuckhieb','Biss','Hyperzahn','Bodycheck'],
  133:['Tackle','Ruckzuckhieb','Biss','Bodycheck'],134:['Aquaknarre','Biss','Surfer','Hydropumpe'],135:['Donnerschock','Ruckzuckhieb','Donnerblitz','Donnerwelle'],136:['Kratzer','Glut','Feuerzahn','Flammenwurf'],
  129:['Tackle','Bodycheck','Biss','Ruckzuckhieb'],130:['Biss','Aquaknarre','Hydropumpe','Bodycheck'],
  150:['Konfusion','Psychokinese','Bodycheck','Hypnose'],151:['Konfusion','Psychokinese','Ruckzuckhieb','Hypnose']
 };
 const typical={Normal:'Bodycheck',Feuer:'Glut',Wasser:'Aquaknarre',Pflanze:'Rankenhieb',Elektro:'Donnerschock',Eis:'Pulverschnee',Kampf:'Karateschlag',Gift:'Giftstachel',Boden:'Erdbeben',Flug:'Windstoß',Psycho:'Konfusion',Käfer:'Käferbiss',Gestein:'Steinwurf',Geist:'Schlecker',Drache:'Drachenwut',Stahl:'Metallklaue',Unlicht:'Biss'};
 const advanced={Normal:'Bodycheck',Feuer:'Flammenwurf',Wasser:'Blubbstrahl',Pflanze:'Rasierblatt',Elektro:'Donnerblitz',Eis:'Eisstrahl',Kampf:'Fußkick',Gift:'Schlammbombe',Boden:'Erdbeben',Flug:'Flügelschlag',Psycho:'Psychokinese',Käfer:'Käferbiss',Gestein:'Steinwurf',Geist:'Spukball',Drache:'Drachenpuls',Stahl:'Metallklaue',Unlicht:'Biss'};
 const effects={Pflanze:'Giftpuder',Gift:'Giftpuder',Feuer:'Irrlicht',Elektro:'Donnerwelle',Psycho:'Hypnose'};
 const names=special[m.id]||['Tackle',typical[main]||'Tackle',advanced[alt]||'Bodycheck',effects[main]||'Bodycheck'];
 m.moves=names.map(name=>{const def=definitions[name]||definitions.Tackle;return{name,type:def[0],power:def[1],pp:def[2],maxpp:def[2],effect:def[3]||null,accuracy:def[4]||100}});
 return m.moves;
}
for(const m of allMons())v4Moves(m);
function v4Time(){const d=new Date();return{hour:d.getHours(),date:d.toLocaleDateString('sv-SE'),night:d.getHours()<7||d.getHours()>=20}}
function v4Weather(z=state.zone){const options=V4_WEATHERS[AREAS[z].theme]||['Klar'];const n=Math.floor(Date.now()/3600000);return options[hash(z,n%99991,31)%options.length]}
function v4Daily(){const today=v4Time().date;if(!state.daily||state.daily.date!==today){state.daily={date:today,baseSteps:state.steps,baseBattles:state.battleWins,baseCaught:state.caught.length,claimed:[]}}return state.daily}
function v4QuestRows(){const d=v4Daily();return [
 ['gehen','Wandere 30 Schritte',Math.min(30,state.steps-d.baseSteps),30,'candy',1],
 ['kaempfen','Gewinne drei Kämpfe',Math.min(3,state.battleWins-d.baseBattles),3,'greatball',3],
 ['fangen','Entdecke ein neues AuriMon',Math.min(1,state.caught.length-d.baseCaught),1,'candy',1],
 ['trainer','Gewinne 10 Trainerkämpfe (gesamt)',Math.min(10,state.trainerWins.length),10,'revive',2]
 ]}
function v4CanLegend(id){const q=V4_LEGENDS[id];if(!q)return false;const badges=state.badges.length;if(badges<q.badges)return false;if(id===151&&state.caught.filter(x=>x!==151).length<150)return false;if(id===150&&state.rocketWins.length<5)return false;return true}
function v4EncounterLegend(id){if(!v4CanLegend(id)){toast('🔒 Die Legenden-Quest ist noch nicht freigeschaltet.');return}if(state.caught.includes(id)){toast('✨ Diese Legende ist bereits in deinem AuriDex!');return}if(!chooseAlive()){toast('Heile erst dein Team!');return}closeModal();const m=newMon(id,id===151?72:55+Math.min(18,state.badges.length));m.shiny=false;startBattle('legend',[m],POKE[id].name,'legend:'+id,3000);}
const v4BaseAt=atPosition;
atPosition=function(z,x,y){if(state.dungeon)return v4CaveTile(x,y);if(AREAS[z].theme==='ocean'&&[[8,5],[9,5],[9,6]].some(a=>a[0]===x&&a[1]===y))return 'water';if(V4_CAVES.includes(z)&&x===6&&y===2)return 'cave';if(V4_ROCKET.includes(z)&&x===7&&y===3)return 'rocketteam';if(z===5&&x===6&&y===6)return 'safari';if(Object.entries(V4_LEGENDS).some(([id,q])=>q.zone===z)&&x===7&&y===6)return 'legend';return v4BaseAt(z,x,y)};
function v4CaveTile(x,y){if(x<0||x>10||y<0||y>8)return 'dungeonwall';const ch=V4_DUNGEON[y][x];if(ch==='#')return 'dungeonwall';if(ch==='E')return 'exit';if(ch==='D')return (state.dungeon.switches.length===2)?'dungeonpath':'door';if(ch==='S')return 'switch';if(ch==='T')return 'treasure';if(ch==='K')return 'dungeonpath';return 'dungeonfloor'}

const v4OldWild=randomWild;
randomWild=function(z){const rare=[144,145,146,150,151],ids=zonePool(z).filter(id=>!rare.includes(id));const w=v4Weather(z),night=v4Time().night;const desired=night?['Geist','Gift','Unlicht']:w==='Regen'?['Wasser']:w==='Sonnig'?['Feuer','Pflanze']:w==='Wind'?['Flug']:w==='Gewitter'?['Elektro']:w==='Schnee'?['Eis']:[];const preferred=ids.filter(id=>POKE[id].types.some(t=>desired.includes(t)));const pool=preferred.length&&Math.random()<.4?preferred:ids;return newMon(pool.length?choice(pool):19,rand(4+z*3,8+z*3))};
const v4OldMap=renderMap;
renderMap=function(){if(state.dungeon){v4DrawCave();return}v4OldMap();const z=state.zone;const special=[{x:6,y:2,kind:'cave',icon:'🕯️'},{x:7,y:3,kind:'rocketteam',icon:'🕶️'},{x:6,y:6,kind:'safari',icon:'🦒'},{x:7,y:6,kind:'legend',icon:'✨'}];for(const a of special){const tile=atPosition(z,a.x,a.y);if(tile!==a.kind)continue;const cell=document.querySelector(`#game-map .cell[data-x="${a.x}"][data-y="${a.y}"]`);if(cell)cell.insertAdjacentHTML('beforeend',`<span class="actor" aria-hidden="true">${a.icon}</span>`)}
 const follow=state.party.find(p=>p.uid===state.followerUid)||active();document.querySelectorAll('#game-map .buddyactor').forEach(e=>{e.textContent=follow?.shiny?'✨':POKE[follow?.id||1].symbol;e.title=follow?'Begleiter: '+POKE[follow.id].name:''});
 document.body.classList.toggle('night',v4Time().night);const weather=v4Weather();for(const cls of ['weather-rain','weather-snow','weather-storm'])document.body.classList.remove(cls);if(weather==='Regen')document.body.classList.add('weather-rain');if(weather==='Schnee')document.body.classList.add('weather-snow');if(weather==='Gewitter')document.body.classList.add('weather-storm');
 $('v4-clock').textContent=v4Time().night?'🌙 Nacht':'☀️ Tag';$('v4-weather').textContent=V4_EMOJI[weather]+' '+weather;$('v4-transport').textContent=state.safariActive?`🦒 Safari ${Math.max(0,24-state.safariSteps)}`:state.surfing?'🌊 Surfen':state.bicycle?'🚲 Fahrrad':'🚶 Zu Fuß';
};
function v4DrawCave(){const map=$('game-map');map.className='map cavemap';let out='';const d=state.dungeon;for(let y=0;y<9;y++)for(let x=0;x<11;x++){const tile=v4CaveTile(x,y),at=d.x===x&&d.y===y,ch=V4_DUNGEON[y][x];let icon=at?'🧢':ch==='S'?(d.switches.includes(`${x}:${y}`)?'✅':'🔘'):ch==='D'?(d.switches.length===2?'🟩':'🚪'):ch==='T'?'🎁':ch==='K'&&!state.caveSolved.includes(d.zone)?'💎':ch==='E'?'🚪':'';out+=`<button class="cell ${tile} ${at?'player':''}" data-x="${x}" data-y="${y}" aria-label="${tile}"><span class="ornament"></span><span class="actor">${icon}</span></button>`}map.innerHTML=out;$('v4-clock').textContent='🕯️ Geheimhöhle';$('v4-weather').textContent=`🔘 ${d.switches.length} / 2`; $('v4-transport').textContent='🧩 Rätsel';}
const v4OldRender=render;
render=function(){v4OldRender();if(!state.starterChosen)return;if(state.dungeon){$('zone-name').textContent='🕯️ Geheimhöhle';$('zone-desc').textContent='Finde beide Bodenschalter, um die Schatzkammer zu öffnen.';$('goal-title').textContent='Löse das Höhlenrätsel';$('goal-desc').textContent=`${state.dungeon.switches.length}/2 Schalter aktiviert · Ausgang unten`;}
 if(state.safariActive){$('goal-title').textContent='🦒 Safari-Zone';$('goal-desc').textContent=`Noch ${Math.max(0,24-state.safariSteps)} Schritte · ${bagCount('safariball')} Safaribälle`;}
 if(state.caught.length===151&&!state.achievements.includes('dex151')){state.achievements.push('dex151');state.coins+=5000;state.bag.candy+=10;save();setTimeout(()=>modal('🏆 151/151 — AuriMon-Meister!', 'Du hast alle 151 ursprünglichen AuriMon gesammelt! Als Belohnung gibt es 5.000 Münzen und 10 EP-Bonbons.',[['Unfassbar!','close','gold']]),50)}
};
function v4EnterCave(){if(!V4_CAVES.includes(state.zone)){toast('Hier gibt es keine Höhle. Die Geheimhöhlen findest du in den Bergen und Wäldern.');return}if(state.safariActive){toast('Verlasse erst die Safari-Zone.');return}const z=state.zone;state.dungeon={zone:z,x:5,y:7,switches:[],picked:false};render();toast('🕯️ Betritt die geheimnisvolle Höhle!')}
function v4WalkCave(dx,dy){if(modalOpen||battle||!state.dungeon)return;const d=state.dungeon,x=d.x+dx,y=d.y+dy,t=v4CaveTile(x,y);if(['dungeonwall','door'].includes(t)){toast(t==='door'?'🔒 Aktiviere beide Schalter!':'🪨 Hier ist eine Felswand.');return}d.x=x;d.y=y;state.steps++;
 if(t==='exit'){state.dungeon=null;state.x=17;state.y=4;toast('🌄 Du verlässt die Höhle.');render();return}
 if(t==='switch'){const key=x+':'+y;if(!d.switches.includes(key)){d.switches.push(key);toast(`🔘 Schalter aktiviert: ${d.switches.length}/2!`)}}
 if(x===4&&y===7&&!state.found.includes('cave:'+d.zone)){state.found.push('cave:'+d.zone);gainItem('ball',3);toast('💎 Drei AriBälle hinter einem Felsen gefunden!')}
 if(x===5&&y===1){if(d.switches.length!==2){toast('🔒 Beide Schalter müssen aktiv sein.');return}if(!state.caveSolved.includes(d.zone)){state.caveSolved.push(d.zone);const reward=d.zone%2?'candy':'Tausch-Kabel';gainItem(reward,d.zone===18?3:2);state.coins+=300;modal('💎 Geheimer Höhlenschatz',`Du hast das Rätsel gelöst! Du findest ${ITEM_INFO[reward][0]} und 300 Münzen.`,[['Schatz sichern','close','gold']])}else toast('Diese Kammer hast du bereits erkundet.')}
 render()}
const v4OldWalk=walk;
walk=function(dx,dy){if(state.dungeon)return v4WalkCave(dx,dy);if(!state.starterChosen||battle||modalOpen)return;const steps=state.bicycle&&!state.safariActive?2:1;for(let k=0;k<steps;k++){const nx=state.x+dx,ny=state.y+dy;if(nx<0||ny<0||nx>=11||ny>=9)break;const t=atPosition(state.zone,nx,ny);if(t==='water'){if(state.badges.length<8){toast('🌊 Surfen wird nach acht Siegel freigeschaltet!');break}state.x=nx;state.y=ny;state.steps++;state.surfing=true;toast('🌊 Du surfst über das Wasser!');if(Math.random()<.13){startWild();return}render();continue}state.surfing=false;v4OldWalk(dx,dy);if(battle||modalOpen)return;if(t==='cave'){v4EnterCave();return}if(t==='rocketteam'){v4RocketHere();return}if(t==='safari'){v4SafariStart();return}if(t==='legend'){v4LegendsHere();return}if(state.safariActive){state.safariSteps++;if(state.safariSteps>=24){state.safariActive=false;state.bag.safariball=0;toast('🦒 Die Safari-Runde ist vorbei.');render();return}if(Math.random()<.19&&!battle){v4WildSafari();return}}if(['center','market','gym','trainer','loot','portal'].includes(t)||state.x!==nx||state.y!==ny)break;}render()};
const v4OldInteract=interact;
interact=function(){if(battle||modalOpen)return;if(state.dungeon){const d=state.dungeon;const t=v4CaveTile(d.x,d.y);if(t==='exit'){state.dungeon=null;render();return}modal('🕯️ Geheimhöhle',`Suche in den dunklen Gängen nach dem Mechanismus. Wenn er erwacht, öffnet sich die Tür zur Schatzkammer. Der Ausgang ist unten.`,[['Verstanden','close']]);return}const here=atPosition(state.zone,state.x,state.y);if(here==='cave')return v4EnterCave();if(here==='rocketteam')return v4RocketHere();if(here==='safari')return v4SafariStart();if(here==='legend')return v4LegendsHere();return v4OldInteract()};
const v4OldEnterZone=enterZone;
enterZone=function(z){state.dungeon=null;state.safariActive=false;state.safariSteps=0;return v4OldEnterZone(z)};
function v4SafariStart(){if(state.zone!==5){toast('Die Safari-Zone liegt im Bernsteinwald.');return}if(state.safariActive){toast('🦒 Du bist bereits auf Safari!');return}if(state.coins<90){toast('Für die Safari fehlen dir 90 Münzen.');return}modal('🦒 Willkommen in der Safari-Zone!', 'Für 90 Münzen erhältst du 12 Safaribälle und 24 Schritte. Hier verstecken sich besonders seltene AuriMon aus der ersten Generation.',[['Safari starten','safari-confirm','gold'],['Später','close']])}
function v4SafariConfirm(){if(state.coins<90)return;state.coins-=90;state.bag.safariball=12;state.safariSteps=0;state.safariActive=true;closeModal();render();toast('🦒 Safari beginnt!')}
function v4WildSafari(){const ids=[29,32,46,47,102,103,111,112,113,114,115,123,127,128,131,132,133,137,138,140,147];const id=choice(ids);const m=newMon(id,rand(23,37));seen(id);startBattle('wild',[m],'Safari: '+POKE[id].name,'safari:'+state.zone,0)}
function v4RocketHere(){const j=V4_ROCKET.indexOf(state.zone);if(j<0)return;if(state.rocketWins.includes(state.zone)){toast('🕶️ An diesem Ort sind keine neuen Schattenkämpfe verfügbar.');return}modal('🕶️ Das Schatten-Team',`Die Schurken haben in ${AREAS[state.zone].name} seltene AuriMon gestohlen! Ihr Kommandant fordert dich heraus. Besiege sein Team und rette die AuriMon!`,[['Team bekämpfen','rocket:'+state.zone,'gold'],['Erst trainieren','close']])}
function v4RocketFight(z){if(state.rocketWins.includes(z))return;const ids=[20,24,42,49,73,89,93,94,105,110,122,125,126,130,139,141];const enemies=Array.from({length:clamp(2+Math.floor(z/6),2,5)},(_,i)=>newMon(ids[(z*3+i*5)%ids.length],Math.min(85,12+z*3+i)));closeModal();startBattle('rocket',enemies,'Schatten-Kommandant','rocket:'+z,600+z*60)}
function v4LegendsHere(){const ids=Object.keys(V4_LEGENDS).map(Number).filter(id=>V4_LEGENDS[id].zone===state.zone);if(!ids.length)return;const id=ids[0];const q=V4_LEGENDS[id];const unlocked=v4CanLegend(id);modal('✨ Der Schrein von '+POKE[id].name,`${q.story}<p>${state.caught.includes(id)?'✅ Diese Legende ist bereits gefangen.':unlocked?'🌟 Die Legende ist bereit, sich dir zu stellen.':`🔒 Benötigt ${q.badges} Siegel${id===150?', fünf Siege gegen das Schatten-Team':''}${id===151?' und die anderen 150 AuriMon':''}.`}</p>`,state.caught.includes(id)?[['Weiter','close']]:[['Herausfordern','legend:'+id,unlocked?'gold':''],['Zurück','close']])}
function v4QuestLog(){
 const leg=Object.entries(V4_LEGENDS).map(([id,q])=>{
  const p=POKE[id],known=state.visited?.includes(q.zone),caughtAlready=state.caught.includes(+id),seenHere=known||caughtAlready;
  const where=seenHere?'📍 '+q.place:'🔎 Fundort noch nicht entdeckt';
  const status=caughtAlready?'✅ Gefangen':seenHere?'✨ Eine Spur entdeckt':'🧩 Der Legende auf der Spur';
  return `<div class="v4-questitem"><b>${p.symbol} ${p.name}</b><small>${where} · ${status}</small><small>Lausche den Geschichten der Bewohner und halte nach ungewöhnlichen Zeichen Ausschau.</small>${seenHere?`<button data-action="quest-travel:${q.zone}">Zur entdeckten Region</button>`:''}</div>`;
 }).join('');
 const d=v4Daily();
 openModal(`<h2>📜 Deine Abenteueraufträge</h2><p>Rette AuriMon vor dem Schatten-Team (${state.rocketWins.length}/5), löse Höhlenrätsel (${state.caveSolved.length}/${V4_CAVES.length}) und erforsche die Legenden.</p><h3>☀️ Tagesaufträge · ${d.date}</h3>${v4QuestRows().map(([id,title,n,total,item,amount])=>`<div class="v4-questitem"><b>${title}</b><small>Fortschritt: ${n}/${total} · Belohnung: ${ITEM_INFO[item][0]} ×${amount}</small><button data-action="claim:${id}" ${n>=total&&!d.claimed.includes(id)?'':'disabled'}>${d.claimed.includes(id)?'✅ Erledigt':'Belohnung abholen'}</button></div>`).join('')}<h3>✨ Legendäre AuriMon</h3>${leg}<button class="btn ghost" data-action="close">Zurück</button>`);
}
function v4Claim(id){const d=v4Daily(),q=v4QuestRows().find(x=>x[0]===id);if(!q||q[2]<q[3]||d.claimed.includes(id))return;d.claimed.push(id);gainItem(q[4],q[5]);toast('🎁 Auftragsbelohnung abgeholt!');v4QuestLog();render()}
function v4TrainerPass(){const badgeHtml=AREAS.map((a,i)=>`<div class="${state.badges.includes(i)?'':'locked'}" title="${a.badge}">${state.badges.includes(i)?'🏅':'○'}<br>${i+1}</div>`).join('');modal('🎫 Dein Trainerpass',`<div class="v4-highlight"><b>🧢 Trainer deinen Trainer</b><p>⭐ Begleiter: ${state.party.find(p=>p.uid===state.followerUid)?POKE[state.party.find(p=>p.uid===state.followerUid).id].name:'Noch keiner'}</p><p>🏅 ${state.badges.length}/${AREAS.length} Siegel · 📖 ${state.caught.length}/151 AuriMon</p><p>⚔️ ${state.battleWins} Siege · 👟 ${state.steps} Schritte</p><p>🕶️ Schatten-Team: ${state.rocketWins.length}/5 · 🧩 Höhlen: ${state.caveSolved.length}/${V4_CAVES.length}</p><p>🏆 Liga: ${state.leagueWins.length}/5 · ✨ Shinys: ${allMons().filter(p=>p.shiny).length}</p></div><h3>Deine Siegel</h3><div class="v4-badgegrid">${badgeHtml}</div>${state.leagueDone?'<p>👑 Liga-Champion!</p>':''}`, [['Schließen','close','gold']])}
function v4LeagueMenu(){if(state.badges.length<AREAS.length){toast('🔒 Die Meisterliga öffnet nach '+AREAS.length+' Siegel.');return}if(state.leagueDone){modal('👑 Meister der Liga!', 'Du hast die Top Vier und den Champion besiegt! Du kannst immer wieder zu einer Herausforderung antreten.',[['Noch einmal','league:0','gold'],['Zurück','close']]);return}const next=state.leagueWins.length;const names=['Elena – Wasser','Komet – Elektro','Drako – Drache','Nox – Geist','Meisterin Mira – Champion'];modal('🏆 Meisterliga',`<p>Alle ${AREAS.length} Siegel sind geschafft! Gewinne jetzt fünf aufeinanderfolgende Herausforderungen. Deine Siege werden gespeichert.</p><div class="v4-achievement"><b>${next}/5 Liga-Kämpfe geschafft</b><p>Als Nächstes: ${names[next]}</p><p>Heile dein Team vor jedem Kampf. Die finale Meisterin hat sechs AuriMon.</p></div>`,[['Herausfordern','league:'+next,'gold'],['Später','close']])}
function v4LeagueBattle(index){if(state.badges.length<AREAS.length||index<0||index>4||(!state.leagueDone&&index>state.leagueWins.length))return;const names=['Elena','Komet','Drako','Nox','Professorin Mira'];const teams=[[134,131,121,130,9],[26,82,101,125,135],[142,130,149,143,148],[94,122,124,65,150],[3,6,9,143,149,150]];const enemies=teams[index].map((id,i)=>newMon(id,clamp(72+index*3+i,1,99)));closeModal();startBattle('league',enemies,names[index], 'league:'+index,2000+index*400)}
const v4OldVictory=battleVictory;
battleVictory=function(){const b=battle;if(!b)return;if(b.kind==='rocket'){const z=Number(b.key.split(':')[1]);if(!state.rocketWins.includes(z)){state.rocketWins.push(z);gainItem('candy',3);state.coins+=900;state.storyFlags.push('rocket:'+z)}}if(b.kind==='league'){const n=Number(b.key.split(':')[1]);if(!state.leagueWins.includes(n)){state.leagueWins.push(n);state.leagueWins.sort((a,b)=>a-b);if(state.leagueWins.length===5){state.leagueDone=true;state.coins+=10000;gainItem('candy',10);state.achievements.push('league')}}}if(b.kind==='legend'){state.coins+=300}if(['rocket','league','legend'].includes(b.kind))state.battleWins++;v4OldVictory();if(b.kind==='league'){$('modal-content').querySelector('h2').textContent=state.leagueDone?'👑 LIGA-CHAMPION!':'🏆 Ein Ligakampf gewonnen!';$('modal-content').querySelector('p')?.insertAdjacentHTML('afterend',`<p>${state.leagueWins.length}/5 Liga-Herausforderungen geschafft!</p>`)}if(b.kind==='rocket')$('modal-content').querySelector('h2').textContent='🕶️ Schurkenteam besiegt!';if(b.kind==='legend')$('modal-content').querySelector('h2').textContent='✨ Legendärer Kampf gewonnen';save()};
const v4OldCenter=healCenter;
healCenter=function(){state.party.forEach(m=>{v4Moves(m).forEach(x=>x.pp=x.maxpp);m.status=null});v4OldCenter()};
const v4OldArt=art;
art=function(id,cls=''){return v4OldArt(id,cls)};
const v4OldTeam=renderTeam;
renderTeam=function(){v4OldTeam();[...$('team-list').children].forEach((node,i)=>{const m=state.party[i];if(!m)return;const row=node.querySelector('.poke-row strong');if(m.shiny){node.classList.add('shiny');if(row)row.insertAdjacentHTML('beforeend',' <span class="shiny-mark">✨ SHINY</span>')}if(row){const b=document.createElement('button');b.className='smallbtn';b.textContent=m.uid===state.followerUid?'🐾 Begleitet dich':'🐾 Folgen';b.dataset.action='follow:'+m.uid;node.querySelector('.rowactions')?.appendChild(b)}if(m.status)node.querySelector('.poke-desc .muted')?.insertAdjacentHTML('beforeend',` · ⚠️ ${m.status}`)});[...$('box-list').children].forEach((node,i)=>{if(state.box[i]?.shiny)node.classList.add('shiny')})};
const v4OldEvolve=evolve;
evolve=function(uid,to){const m=mon(uid),prev=m?.id;v4OldEvolve(uid,to);if(!m||m.id===prev)return;m.moves=null;v4Moves(m);if(m.shiny)$('modal-content').classList.add('shiny');const artNode=$('modal-content').querySelector('.art');if(artNode){const container=document.createElement('div');container.className='evo-show';artNode.replaceWith(container);container.appendChild(artNode)}save()};
const v4OldThrow=throwBall;
throwBall=function(id){
 if(!battle||!bagCount(id))return;
 if(id==='safariball'&&!state.safariActive)return;
 if(battle.kind!=='wild'&&battle.kind!=='legend')return;
 const old=battle,foeMon=foe(),species=foeMon.id;
 if(id==='safariball'){
  state.bag.safariball--;
  const loss=1-foeMon.hp/hpMax(species,foeMon.level);
  const odds=clamp(.38+loss*.5,.05,.93);
  if(Math.random()<odds){
   caught(species);const target=state.party.length<6?'party':'box';state[target].push(foeMon);gainXP(chooseAlive(),Math.round(foeMon.level*4));
   battle=null;$('battle-overlay').classList.add('hidden');save();render();
   modal('🦒 Safari-Fang!',`${art(species)}<b>${POKE[species].name}</b> ist jetzt dein AuriMon! ${target==='box'?'Es wartet in der AuriMon-Box.':'Es reist mit dir.'}`, [['Weiter','close','gold']]);return;
  }
  battle.log=POKE[species].name+' ist aus dem Safariball entkommen!';enemyTurn();if(battle)renderBattle();save();return;
 }
 const wasLegend=battle.kind==='legend';if(wasLegend)battle.kind='wild';
 v4OldThrow(id);
 if(battle&&wasLegend){battle.kind='legend';renderBattle()}
 if(old&&battle===null&&state.caught.includes(species)&&foeMon.shiny){
  const div=$('modal-content');if(div){div.classList.add('shiny');div.insertAdjacentHTML('beforeend','<p>✨ Ein besonderes, schillerndes AuriMon!</p>')}
 }
 save();
};
const v4OldBattle=renderBattle;
renderBattle=function(){if(!battle)return;v4OldBattle();if(!battle)return;const a=chooseAlive(),e=foe();if(!a||!e)return;const moves=v4Moves(a),wild=battle.kind==='wild';const ui=$('battle-content');const actions=ui.querySelector('.battleactions');const title=ui.querySelector('.battletop b');if(title){if(battle.kind==='legend')title.textContent='✨ LEGENDÄRE BEGEGNUNG';if(battle.kind==='league')title.textContent='🏆 MEISTERLIGA';if(battle.kind==='rocket')title.textContent='🕶️ SCHATTEN-TEAM'}
 actions.innerHTML=moves.map((m,i)=>`<button class="movebtn ${i===0?'attack':'special'}" data-battle="move:${i}" ${m.pp>0?'':'disabled'}><span class="v4-move-title">${m.name}</span><small>${m.type} · AP ${m.pp}/${m.maxpp}${m.power?' · St. '+m.power:' · Status'}</small></button>`).join('')+(moves.every(m=>m.pp===0)?'<button data-battle="move:99">💥 Verzweifler · Keine AP nötig</button>':'')+`<button data-battle="heal">🧴 Trank (${bagCount('potion')})</button><button data-battle="heal-super">💚 Supertrank (${bagCount('superpotion')})</button><button data-battle="throw:ball" ${wild&&bagCount('ball')?'':'disabled'}>🔴 Ball (${bagCount('ball')})</button><button data-battle="throw:greatball" ${wild&&bagCount('greatball')?'':'disabled'}>🔵 Superball (${bagCount('greatball')})</button>${state.safariActive?`<button data-battle="throw:safariball" ${wild&&bagCount('safariball')?'':'disabled'}>🟢 Safariball (${bagCount('safariball')})</button>`:''}<button data-battle="switch">🔄 Wechseln</button><button data-battle="flee" ${!wild?'disabled':''}>🏃 Fliehen</button>`;
 if(a.shiny)ui.querySelector('.allyart')?.classList.add('shiny');if(e.shiny)ui.querySelector('.enemyart')?.classList.add('shiny');if(a.status)ui.querySelector('.allylabel')?.insertAdjacentHTML('beforeend',`<div class="v4-status">⚠️ ${a.status}</div>`);if(e.status)ui.querySelector('.enemylabel')?.insertAdjacentHTML('beforeend',`<div class="v4-status">⚠️ ${e.status}</div>`);
};
function v4UseMove(index){if(!battle)return;const a=chooseAlive(),e=foe();if(!a||!e)return;const move=index===99?{name:'Verzweifler',type:'Normal',power:32,pp:1,maxpp:1}:v4Moves(a)[index];if(!move||move.pp<=0)return;if(index!==99)move.pp--;let msg='';if(a.status==='sleep'){a.sleepTurns=(a.sleepTurns??2)-1;if(a.sleepTurns>0){battle.log=POKE[a.id].name+' schläft und kann nicht angreifen!';enemyTurn();if(battle)renderBattle();save();return;}a.status=null;a.sleepTurns=0;}if(a.status==='paralyze'&&Math.random()<.25){battle.log=POKE[a.id].name+' ist paralysiert!';enemyTurn();if(battle)renderBattle();save();return}
 if(move.accuracy&&Math.random()*100>=move.accuracy){battle.log=POKE[a.id].name+' setzt '+move.name+' ein, aber verfehlt!';enemyTurn();if(battle)renderBattle();save();return;}
 if(move.power){const hit=v4Damage(a,e,move);e.hp=Math.max(0,e.hp-hit.amount);msg=`${POKE[a.id].name} setzt ${move.name} ein! ${hit.amount} Schaden.${typeMessage(hit.mult)}${hit.crit?' Volltreffer!':''}`}
 else if(move.effect==='gift'&&POKE[e.id].types.some(t=>t==='Gift'||t==='Stahl')){msg='Gegen dieses Pokémon wirkt Gift nicht.'}else if(move.effect==='burn'&&POKE[e.id].types.includes('Feuer')){msg='Dieses Feuer-Pokémon kann nicht verbrannt werden.'}else if(e.status){msg=`${POKE[e.id].name} hat bereits eine Statusveränderung.`}else if(Math.random()<.8){e.status=move.effect;if(move.effect==='sleep')e.sleepTurns=2;msg=`${POKE[e.id].name} ist jetzt ${move.effect==='gift'?'vergiftet':move.effect==='burn'?'verbrannt':move.effect==='sleep'?'eingeschlafen':'paralysiert'}!`}else{msg='Die Status-Attacke ist fehlgeschlagen.'}battle.log=msg;
 if(e.hp<=0){defeatEnemy();return}if(e.status==='gift'||e.status==='burn'){e.hp=Math.max(0,e.hp-Math.max(1,Math.floor(hpMax(e.id,e.level)/(e.status==='burn'?16:8))));if(e.hp<=0){defeatEnemy();return}}enemyTurn();if(battle)renderBattle();save();}
function v4Damage(a,e,move){return aurimonDamage(a,e,move,v4Weather())}
enemyTurn=function(prefix=''){
 if(!battle)return;
 const e=foe(),a=chooseAlive();if(!e||!a)return;
 const choices=v4Moves(e).filter(m=>m.pp>0);
 const attacks=choices.filter(m=>m.power>0);
 const m=choices.length?choice(attacks.length&&Math.random()<.75?attacks:choices):{name:'Verzweifler',type:'Normal',power:50,pp:1,accuracy:100};
 if(m.pp>0)m.pp--;
 let message='';
 if(e.status==='sleep'){
   e.sleepTurns=(e.sleepTurns??2)-1;
   if(e.sleepTurns>0)message=POKE[e.id].name+' schläft!';
   else {e.status=null;e.sleepTurns=0;message=POKE[e.id].name+' wacht auf!';}
 }else if(e.status==='paralyze'&&Math.random()<.25){message=POKE[e.id].name+' ist paralysiert!';}
 else if(m.accuracy&&Math.random()*100>=m.accuracy){message=POKE[e.id].name+' verfehlt mit '+m.name+'!';}
 else if(m.power>0){
   const hit=v4Damage(e,a,m);a.hp=Math.max(0,a.hp-hit.amount);
   message=POKE[e.id].name+' nutzt '+m.name+' ('+hit.amount+' KP).'+typeMessage(hit.mult);
 }else if(m.effect){
   const immune=(m.effect==='gift'&&POKE[a.id].types.some(t=>t==='Gift'||t==='Stahl'))||(m.effect==='burn'&&POKE[a.id].types.includes('Feuer'));
   if(!a.status&&!immune){a.status=m.effect;if(m.effect==='sleep')a.sleepTurns=2;message=POKE[a.id].name+' leidet unter '+m.name+'!';}
   else message=m.name+' hat keine Wirkung.';
 }else message=m.name+' zeigt keine Wirkung.';
 if((a.status==='gift'||a.status==='burn')&&a.hp>0){
   const tick=Math.max(1,Math.floor(hpMax(a.id,a.level)/(a.status==='burn'?16:8)));
   a.hp=Math.max(0,a.hp-tick);message+=' '+(a.status==='burn'?'Verbrennung':'Gift')+' verursacht '+tick+' KP.';
 }
 battle.log=(prefix?prefix+' ':'')+battle.log+' '+message;
 if(a.hp<=0){
   battle.log+=' '+POKE[a.id].name+' ist kampfunfähig!';
   if(!living().length){battleDefeat();return}
   const next=living()[0];state.activeUid=next.uid;battle.log+=' '+POKE[next.id].name+' übernimmt!';
 }
}
const v4OldBattleAction=battleAction;
battleAction=function(act){if(act.startsWith('move:'))return v4UseMove(Number(act.split(':')[1]));return v4OldBattleAction(act)};
const v4OldUseItem=useItem;
useItem=function(id,uid){const m=mon(uid);if(id==='ether'||id==='antidote'){if(!m||!bagCount(id))return;if(id==='antidote'&&!m.status){toast('Keine Statusveränderung.');return}if(id==='ether'&&v4Moves(m).every(x=>x.pp===x.maxpp)){toast('Alle AP sind noch voll!');return}if(id==='antidote')m.status=null;else v4Moves(m).forEach(x=>x.pp=Math.min(x.maxpp,x.pp+10));state.bag[id]--;closeModal();render();toast('💠 Item erfolgreich benutzt!');return}return v4OldUseItem(id,uid)};
const v4OldItemMenu=showItemMenu;
showItemMenu=function(uid){v4OldItemMenu(uid);const el=$('modal-content');const back=el.querySelector('button[data-action="close"]');if(!back)return;for(const id of ['ether','antidote']){const[name,icon,desc]=ITEM_INFO[id];back.insertAdjacentHTML('beforebegin',`<div class="bag-entry"><span class="item-emoji">${icon}</span><span class="meta"><b>${name} ×${bagCount(id)}</b><small>${desc}</small></span><button class="smallbtn" data-action="use:${id}:${uid}" ${bagCount(id)?'':'disabled'}>Benutzen</button></div>`)}}
const v4OldShop=showShop;
showShop=function(){v4OldShop();const el=$('modal-content');const actions=el.querySelector('.dialog-actions');for(const id of ['ether','antidote']){const[name,icon,,price]=ITEM_INFO[id];actions.insertAdjacentHTML('beforebegin',`<div class="bag-entry"><span class="item-emoji">${icon}</span><span class="meta"><b>${name}</b><small>🪙 ${price} · Im Rucksack: ${bagCount(id)}</small></span><button class="smallbtn gold" data-action="buy:${id}">Kaufen</button></div>`)}}
const v4OldTravel=renderTravel;
renderTravel=function(){v4OldTravel();$('journal').insertAdjacentHTML('beforeend',`<div class="v4-achievement"><b>🕶️ Schatten-Team: ${state.rocketWins.length}/5</b><p>🕯️ Höhlenrätsel: ${state.caveSolved.length}/${V4_CAVES.length} · ✨ Legendäre: ${[144,145,146,150,151].filter(id=>state.caught.includes(id)).length}/5</p><p>🏆 Meisterliga: ${state.leagueWins.length}/5 · ${state.leagueDone?'👑 LIGA-CHAMPION!':'Nach ${AREAS.length} Siegel freigeschaltet'}</p><p>🪄 Schillernde AuriMon: ${allMons().filter(m=>m.shiny).length}</p></div>`)};
function v4FlyMenu(){const flyReq=Math.max(5,AREAS.length);if(state.badges.length<flyReq){toast('🔒 Fliegen wird nach '+flyReq+' Siegel freigeschaltet!');return}const visited=state.visited.filter(z=>z<AREAS.length&&z<=state.badges.length);openModal(`<h2>🕊️ Fliegen</h2><p>Wähle einen bereits besuchten Ort. Dein Flug-AuriMon bringt dich dorthin.</p><div class="travelgrid">${visited.map(z=>`<button class="travelcard" data-action="fly:${z}">${AREAS[z].icon}<b>${AREAS[z].name}</b></button>`).join('')}</div><button class="btn ghost" data-action="close">Zurück</button>`)}
function v4SaveMenu(){const slots=[1,2,3];openModal(`<h2>💾 Sicherungskopien</h2><p>Du spielst im ausgewählten Spielerprofil. Jede Person besitzt drei eigene Sicherheitskopien.</p>${slots.map(i=>{let data;try{data=JSON.parse(localStorage.getItem(window.PokemonProfiles.backupKey(i))||'null')}catch{}return `<div class="bag-entry"><span class="item-emoji">💾</span><span class="meta"><b>Speicherplatz ${i}</b><small>${data?`${data.badges?.length||0} Siegel · ${data.caught?.length||0}/151 AuriMon`:'Noch leer'}</small></span><button class="smallbtn" data-action="save-slot:${i}">Sichern</button><button class="smallbtn" data-action="load-slot:${i}" ${data?'':'disabled'}>Laden</button></div>`}).join('')}<button class="btn" data-action="export-save">📤 JSON-Backup exportieren</button><button class="btn ghost" data-action="import-save">📥 Backup importieren</button><p class="muted">Import und Export funktionieren im Browser. Für Android am besten die drei Sicherungsplätze verwenden.</p><button class="btn ghost" data-action="close">Zurück</button>`)}
function v4SafeLoad(input){if(!input||typeof input!=='object'||!Array.isArray(input.party)||!Array.isArray(input.caught))throw Error('Kein gültiger Spielstand');const clone=JSON.parse(JSON.stringify(input));for(const m of [...clone.party,...(clone.box||[])]){if(!POKE[m.id]||m.id<1||m.id>151)throw Error('Unzulässiges AuriMon im Spielstand.');m.level=clamp(Number(m.level)||1,1,100);m.hp=clamp(Number.isFinite(Number(m.hp))?Number(m.hp):hpMax(m.id,m.level),0,hpMax(m.id,m.level));if(!Array.isArray(m.moves)||m.moves.length!==4)m.moves=null;else m.moves=m.moves.map(mv=>({...mv,pp:clamp(Number(mv.pp)||0,0,Number(mv.maxpp)||35)}));}clone.seen=clone.seen.filter(x=>POKE[x]);clone.caught=clone.caught.filter(x=>POKE[x]);clone.zone=clamp(clone.zone,0,AREAS.length-1);clone.badges=(clone.badges||[]).filter(x=>Number.isInteger(x)&&x>=0&&x<AREAS.length);state={...defaultState(),...clone,version:4,bag:{...START_BAG,...clone.bag},dungeon:null,safariActive:false};for(const m of allMons())v4Moves(m);state.followerUid=state.followerUid||state.activeUid;save();battle=null;$('battle-overlay').classList.add('hidden');closeModal();currentPage='world';document.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id==='page-world'));document.querySelectorAll('.tabs button').forEach(e=>e.classList.toggle('selected',e.dataset.page==='world'));render();toast('✅ Spielstand wiederhergestellt!')}
function v4Export(){const data=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const link=document.createElement('a');link.href=URL.createObjectURL(data);link.download='PokemonAbenteuer_Spielstand_v4.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),2000)}
const v4OldAction=doAction;
doAction=function(act,el){if(act==='quests')return v4QuestLog();if(act==='trainerpass')return v4TrainerPass();if(act==='cave-enter')return v4EnterCave();if(act==='safari-enter')return v4SafariStart();if(act==='safari-confirm')return v4SafariConfirm();if(act==='bike-toggle'){if(state.badges.length<2){toast('🚲 Ein Fahrrad gibt es ab dem zweiten Siegel!');return}state.bicycle=!state.bicycle;toast(state.bicycle?'🚲 Fahrrad aktiviert!':'🚶 Zu Fuß unterwegs.');return render()}if(act==='fly-menu')return v4FlyMenu();if(act==='league-menu')return v4LeagueMenu();if(act==='save-menu')return v4SaveMenu();if(act==='export-save')return v4Export();if(act==='import-save'){$('v4-import').click();return}
 const [cmd,...param]=act.split(':');if(cmd==='claim')return v4Claim(param[0]);if(cmd==='legend')return v4EncounterLegend(+param[0]);if(cmd==='rocket'){return v4RocketFight(+param[0])}if(cmd==='league')return v4LeagueBattle(+param[0]);if(cmd==='quest-travel'){closeModal();return enterZone(+param[0])}if(cmd==='follow'){if(!state.party.find(p=>p.uid===param[0]))return;state.followerUid=param[0];render();toast('🐾 Neues AuriMon folgt dir!');return}if(cmd==='fly'){closeModal();return enterZone(+param[0])}if(cmd==='save-slot'){localStorage.setItem(window.PokemonProfiles.backupKey(+param[0]),JSON.stringify(state));toast('💾 Sicherungsplatz '+param[0]+' gespeichert!');return v4SaveMenu()}if(cmd==='load-slot'){const v=localStorage.getItem(window.PokemonProfiles.backupKey(+param[0]));if(v)try{v4SafeLoad(JSON.parse(v))}catch(e){toast('⚠️ '+e.message)}return}
 return v4OldAction(act,el)};
const v4OldGuide=showGuide;
showGuide=function(){v4OldGuide();$('modal-content').querySelector('p')?.insertAdjacentHTML('beforeend','<p>🕯️ In geheimen Höhlen zwei Schalter finden. 🕶️ Schatten-Trainer besiegen. 🦒 Im Bernsteinwald warten Safari-AuriMon. 🚲 Fahrrad nach zwei Siegel, 🕊️ Fliegen nach zehn Siegel. 🏆 Die Meisterliga startet nach allen ${AREAS.length} Siegel. Im Trainerpass siehst du deine Erfolge.</p>')};
// Sicherheitsprüfung beim Import: nur JSON, validierte Werte und höchstens 151 Arten.
const v4Input=document.createElement('input');v4Input.type='file';v4Input.id='v4-import';v4Input.accept='.json,application/json';v4Input.style.display='none';document.body.appendChild(v4Input);
v4Input.addEventListener('change',async()=>{const f=v4Input.files?.[0];if(!f)return;try{if(f.size>2_000_000)throw Error('Datei zu groß.');v4SafeLoad(JSON.parse(await f.text()))}catch(e){toast('⚠️ Backup ungültig: '+e.message)}v4Input.value=''});
// Optimierte Hauptansicht nach der migration initialisieren.
render();save();
window.PokemonGame.v4={legendary:V4_LEGENDS,leagueTeams:5,goCave:v4EnterCave,enterSafari:v4SafariConfirm,quests:v4QuestRows,moves:v4Moves,saveSlot:v4SafeLoad};
