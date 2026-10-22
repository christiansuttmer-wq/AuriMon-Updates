/* AuriMon: complete repeatable quest-path regression suite.
 * Runs real quest functions against the actual 200-map world model.
 * Never reads, modifies or resets player saves.
 */
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ROOT='app/src/main/assets/';
const src=name=>fs.readFileSync(ROOT+name,'utf8');
const slice=(code,begin,end)=>{const a=code.indexOf(begin),b=code.indexOf(end,a+begin.length);assert(a>=0&&b>a,'Missing audit entry: '+begin);return code.slice(a,b)};
const ELEMENT_TYPES=['Normal','Feuer','Wasser','Pflanze','Elektro','Eis','Kampf','Gift','Boden','Flug','Psycho','Käfer','Gestein','Geist','Drache','Unlicht','Stahl','Fee'];
const AREAS=Array.from({length:40},(_,z)=>({name:'Region '+z,leader:'Boss '+z,badge:'Siegel '+z}));
const noop=()=>{};
const state={starterChosen:true,party:[{id:1,uid:'starter'}],zone:10,x:1,y:6,steps:0,badges:[],coins:0,bag:{},found:[],trainerWins:[],
 epicQuests:{},aurWorld50:{stage:50,runestones:[],completed:[]}};
const mapContext={state,ELEMENT_TYPES,AREAS,window:{PokemonGame:{},PokemonProfiles:{activeSlot:1},addEventListener(){}},
 document:{createElement:()=>({setAttribute(){},getContext:()=>({scale(){}})}),addEventListener(){}},requestAnimationFrame(){}};
for(const fn of ['renderMap','walk','interact','trainerParty','randomWild','gymParty','enterZone','battleDefeat','atPosition','trainers','drops','render','doAction'])mapContext[fn]=noop;
vm.runInNewContext(src('aurimon_world50_pilot.js'),vm.createContext(mapContext),{timeout:5000});
const world=mapContext.window.PokemonGame.world50;
assert.equal(world.getCount(),200);
for(let z=0;z<40;z++){
 const npcKinds=world.getFeatures(z*5).npcs.map(n=>n.kind);
 for(const kind of ['side','runeA','runeB','cache'])assert(npcKinds.includes(kind),'Missing '+kind+' in region '+z);
 const features=world.getFeatures(z*5+3);
 assert.equal(features.runes.length,3,'Three temple runes required in region '+z);
 assert.equal(new Set(features.runes.map(r=>r.id)).size,3);
 const entry=world.getMap(z*5+3);
 for(const r of features.runes)assert.equal(entry[r.y][r.x],'R','Rune not on navigable puzzle tile in region '+z);
 assert(features.runeOrder.length===3&&features.runeOrder.every(id=>features.runes.some(r=>r.id===id)));
 assert(world.getFeatures(z*5+4).buildings.some(b=>b.kind==='gym'),'Missing final arena of region '+z);
}
assert(world.validate().every(r=>r.reachable),'Map objectives cannot all be reached');

// The 30 crystal chronicles: no shortcuts, 3 actual clues, required steps,
// 3 temple runes, arena badge and one-time crystal/coin rewards.
let lastModal=null;
let saves=0;
const epicCtx={state,ELEMENT_TYPES,window:{PokemonGame:{world50:world}},modal:(title,body,actions)=>{lastModal={title,body,actions}},
 toast:noop,render:noop,save:()=>{saves++},gainItem:(id,n)=>{state.bag[id]=(state.bag[id]||0)+n}};
const epicCode=src('aurimon_2_0.js');
vm.runInNewContext(slice(epicCode,' const questTitles=[',' function ascendDialog(uid)')+
 '\nglobalThis.auditEpic={questTitles,storyEntries,progress,renderQuest,accept,claim,investigate};',vm.createContext(epicCtx),{timeout:4000});
const epic=epicCtx.auditEpic;
assert.equal(epic.questTitles.length,30);
assert.equal(epic.storyEntries.length,30);
assert.equal(new Set(epic.questTitles).size,30,'Duplicate crystal quest titles');
for(let z=10;z<40;z++){
 state.zone=z;state.aurWorld50.stage=z*5;
 const type=ELEMENT_TYPES[(z-10)%18],item='crystal_'+type,initial=state.bag[item]||0,coins=state.coins;
 epic.investigate(z,'runeA');
 assert(!state.epicQuests[z],'Unaccepted quest progress '+z);
 epic.accept(z);
 assert(state.epicQuests[z]&&!epic.progress(z).complete,'Quest unlocked too early '+z);
 for(const kind of ['runeA','runeB','cache'])epic.investigate(z,kind);
 assert.equal(epic.progress(z).clueCount,3,'Missing clues in region '+z);
 epic.claim(z);
 assert.equal(state.coins,coins,'Quest reward before temple and arena '+z);
 state.steps+=80+(z-10)*8;
 state.aurWorld50.runestones.push(...world.getFeatures(z*5+3).runes.map(r=>r.id));
 assert(!epic.progress(z).complete,'Arena badge not required in '+z);
 state.badges.push(z);
 assert(epic.progress(z).complete,'Unfinishable crystal chronicle in '+z);
 epic.claim(z);
 assert.equal(state.coins,coins+500,'Coin reward in region '+z);
 assert.equal(state.bag[item],initial+2,'Crystal reward in region '+z);
 assert(state.epicQuests[z].claimed,'Quest not marked complete '+z);
 epic.claim(z);
 assert.equal(state.coins,coins+500,'Double coins in region '+z);
 assert.equal(state.bag[item],initial+2,'Double crystals in region '+z);
}
assert.equal(Object.values(state.epicQuests).filter(q=>q.claimed).length,30);
assert.equal(state.coins,15000);

// The ten classic local mysteries must not be confused with the new 30 chronicles.
const v51=src('v5_1.js');
const themes=vm.runInNewContext(v51.match(/const THEMES=(\[[\s\S]*?\]);/)[1]);
assert.equal(themes.length,20,'Classic theme definitions changed unexpectedly');
assert.match(v51,/while\(THEMES.length<AREAS.length\)/,'The 40-region palette migration was removed');
assert.match(v51,/AREAS\.slice\(0,CLASSIC_RUNE_REGIONS\)/,'Classic puzzle overview must show ten regions');
// A quest journal must remain renderable in every unlocked extended region.
const journalCards=[];
const palette=themes.map(t=>Array.from(t));
const travelContext={
 AREAS,ELEMENT_TYPES,THEMES:palette,
 state:{zone:0,badges:[],v51Puzzles:[],v51Caches:[],v51RoomsLoot:[]},
 renderTravel:noop,ensure:noop,has:(arr,z)=>Array.isArray(arr)&&arr.includes(z),
 document:{createElement:()=>({className:'',innerHTML:''})},
 $:()=>({appendChild:node=>journalCards.push(node)})
};
const paletteSetup=slice(v51,' const CLASSIC_RUNE_REGIONS=10;',' const SPECIAL=');
const travelUi=slice(v51,' const oldTravel=renderTravel;',' // Pixel-Details:');
vm.runInNewContext(paletteSetup+'\n'+travelUi+'\nglobalThis.auditTravel=renderTravel;',
 vm.createContext(travelContext),{timeout:3500});
assert.equal(palette.length,40,'Extended regions have missing decorative palettes');
for(let z=0;z<40;z++){
 travelContext.state.zone=z;travelContext.auditTravel();
 assert(journalCards[z]?.innerHTML.includes('10 klassischen Ortsrätsel'),
   'Travel journal crashed or mislabelled quests in region '+z);
}

const classic={zone:0,v51Runes:{},v51Puzzles:[],v51Caches:[],bag:{},coins:0};
const classicContext={state:classic,THEMES:themes,AREAS,ensure:noop,zName:()=>AREAS[classic.zone].name,
 has:(arr,z)=>Array.isArray(arr)&&arr.includes(z),rewards:['ball','potion','greatball','repel','superpotion','candy','revive','ether','antidote','Feuerstein','Wasserstein','Donnerstein','Blattstein','Mondstein','Tausch-Kabel'],
 ITEM_INFO:new Proxy({}, {get:(_,k)=>[String(k),'✨']}),markDirty:noop,toast:noop,modal:noop,save:noop,
 gainItem:(id,n)=>{classic.bag[id]=(classic.bag[id]||0)+n}};
vm.runInNewContext(slice(v51,' function interactSpecial(type)',' function enterHouse(kind)')+
 '\nglobalThis.classicInteract=interactSpecial;',vm.createContext(classicContext),{timeout:3000});
for(let z=0;z<10;z++){
 classic.zone=z;const before=classic.coins;
 classicContext.classicInteract('cache');
 assert.equal(classic.coins,before,'Locked treasure incorrectly awarded '+z);
 classicContext.classicInteract('runeB');
 assert(!classic.v51Puzzles.includes(z),'Second rune bypasses first '+z);
 classicContext.classicInteract('runeA');
 classicContext.classicInteract('runeB');
 classicContext.classicInteract('cache');
 assert(classic.v51Puzzles.includes(z)&&classic.v51Caches.includes(z),'Classic quest did not complete '+z);
 assert.equal(classic.coins,before+75+z*20);
 const bag=JSON.stringify(classic.bag);
 classicContext.classicInteract('cache');
 assert.equal(classic.coins,before+75+z*20);
 assert.equal(JSON.stringify(classic.bag),bag,'Double chest reward '+z);
}
assert.equal(classic.v51Puzzles.length,10);
assert.equal(classic.v51Caches.length,10);

// Seven ruin puzzles and five legendary shrines: wrong glyph sequence resets,
// correct sequence completes, and every reward is paid once.
const v53=src('v5_3.js'),v4=src('v4.js'),v55=src('v5_5.js');
const legends=vm.runInNewContext(v4.match(/const V4_LEGENDS=(\{[^;]+\});/)[1]);
const temples=Object.entries(legends).map(([id,q])=>({id:+id,...q}));
const ruins=[2,3,4,5,6,8,9];
const puzzle={zone:0,v53Ruins:[],v53RuinsProgress:{},v53Temples:[],v53TemplesProgress:{},caught:[],badges:[],coins:0,bag:{}};
const puzzleContext={state:puzzle,AREAS,GLYPHS:['☀️','🌙','⭐','💎'],RUIN_ZONES:ruins,TEMPLE_ENTRIES:temples,
 POKE:Object.fromEntries(temples.map(t=>[t.id,{name:'Pokémon '+t.id}])),ready:()=>true,checkData:noop,
 ebtn:(name,act)=>name+' '+act,esc:x=>String(x),modal:noop,toast:noop,save:noop,render:noop,
 ITEM_INFO:new Proxy({}, {get:(_,k)=>[String(k)]}),
 gainItem:(id,n=1)=>{puzzle.bag[id]=(puzzle.bag[id]||0)+n}};
vm.runInNewContext(slice(v53,' function ruinPattern(z)',' function legendary(id)')+
 '\nglobalThis.auditPuzzles={ruinPattern,selectGlyph,templePattern,templeGlyph};',vm.createContext(puzzleContext),{timeout:3000});
const logic=puzzleContext.auditPuzzles;
for(const z of ruins){
 puzzle.zone=z;const before=puzzle.coins,order=logic.ruinPattern(z);
 logic.selectGlyph((order[0]+1)%4);
 assert.equal(puzzle.v53RuinsProgress[z],0,'Wrong glyph should reset ruin '+z);
 for(const glyph of order)logic.selectGlyph(glyph);
 assert(puzzle.v53Ruins.includes(z),'Unfinishable ruin '+z);
 const earned=puzzle.coins;logic.selectGlyph(order[2]);
 assert.equal(earned,before+200+z*17);
 assert.equal(puzzle.coins,earned,'Duplicate ruin reward '+z);
}
for(const q of temples){
 puzzle.zone=q.zone;const order=logic.templePattern(q.id),before=puzzle.bag.greatball||0;
 logic.templeGlyph(q.id,(order[0]+1)%4);
 assert.equal(puzzle.v53TemplesProgress[q.id],0,'Wrong glyph should reset temple '+q.id);
 for(const glyph of order)logic.templeGlyph(q.id,glyph);
 assert(puzzle.v53Temples.includes(q.id),'Unfinishable temple '+q.id);
 logic.templeGlyph(q.id,order[2]);
 assert.equal(puzzle.bag.greatball,before+5,'Duplicate/missing temple reward '+q.id);
}
assert.equal(puzzle.v53Ruins.length,7);
assert.equal(puzzle.v53Temples.length,5);

// Preserve integration between legacy menus, the crystal chronicle UI,
// achievement counters and the true Kanto legendary prerequisite.
assert.match(v53,/state\.zone>=SIDESTORIES\.length\)return window\.AuriMonEpic\?\.openQuest/);
assert.match(epicCode,/openQuest:renderQuest/);
assert.match(v55,/length\(state\.v53SideDone\)\+Object\.entries\(state\.epicQuests/);
assert.match(v4,/x>=1&&x<=150/);
assert.match(src('aurimon_world50_pilot.js'),/getCount:\(\)=>maps\.length/);
console.log('[PASS] 200 world maps + 40 arenas/temples + 30 crystal chronicles (complete & single reward) + 10 classic puzzles/chests + 7 rune ruins + 5 legendary temples + progression/menu/trophy/legend integration.');
