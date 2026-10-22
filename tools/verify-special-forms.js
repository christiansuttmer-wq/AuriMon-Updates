/* Official form-catalog and gameplay regression. No access to real save files. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path='app/src/main/assets/';
const get=file=>fs.readFileSync(path+file,'utf8');
const ctx={window:{},Math:Object.create(Math)};
vm.runInNewContext(get('pokemon_stats_151.js'),vm.createContext(ctx));
vm.runInNewContext(get('dex.js'),ctx);
vm.runInNewContext(get('pokemon_gen2_9.js'),ctx);
vm.runInNewContext(get('aurimon_special_forms_data.js'),ctx);
const dex=ctx.window.POKEDEX,cat=ctx.window.AuriSpecialFormCatalog;
assert.equal(dex.length,1025);
assert.equal(cat.speciesCount,1025);
assert.equal(cat.totalForms,554);
const forms=Object.entries(cat.bySpecies).flatMap(([id,fs])=>fs.map(f=>({...f,species:+id})));
assert.equal(forms.length,554);
assert.equal(new Set(forms.map(f=>f.key)).size,554,'Form identifiers not unique');
assert(forms.every(f=>f.species>=1&&f.species<=1025&&f.pokemonId>0&&f.types.length>0&&
 Array.isArray(f.stats)&&f.stats.length===6&&f.stats.every(s=>s>0)),'Incomplete form data');
for(const region of ['alola','galar','hisui','paldea'])assert(forms.some(f=>f.kind===region),'Missing '+region+' variants');
for(const mode of ['mega','primal','gmax','battle','variant'])assert(forms.some(f=>f.kind===mode),'Missing '+mode+' forms');
const find=(id,kind)=>cat.bySpecies[id]?.find(f=>f.kind===kind);
assert(find(26,'alola')?.types.includes('Psycho'),'Alolan Raichu type incorrect');
assert(find(6,'mega'),'Charizard mega forms missing');
assert(find(382,'primal'),'Primal Kyogre missing');
assert(find(25,'gmax'),'Pikachu Gigantamax missing');
let saves=0;
const pokemon={uid:'demo',id:26,level:55,hp:80,formKey:null};
Object.assign(ctx,{
 D:dex,POKE:Object.fromEntries(dex.map(p=>[p.id,p])),
 ITEM_INFO:{},START_BAG:{},ELEMENT_TYPES:['Normal','Feuer','Wasser','Pflanze','Elektro','Eis','Kampf','Gift','Boden','Flug','Psycho','Käfer','Gestein','Geist','Drache','Unlicht','Stahl','Fee'],
 state:{party:[pokemon],box:[],bag:{},zone:11,coins:10000},
 $:()=>null,save:()=>saves++,render:()=>{},renderTeam:()=>{},renderBattle:()=>{},
 art:(id)=>'<div class="art"><img src="base.png" alt="Base"></div>',
 sprite:()=>'',randomWild:()=>({id:26,uid:'wild',hp:50,level:55}),mon:uid=>ctx.state.party.find(p=>p.uid===uid),
 doAction:()=>{},battleAction:()=>{},showShop:()=>{},showGuide:()=>{},flee:()=>{ctx.battle=null},
 battleAttack:()=>{},battleSwitch:()=>{},battleVictory:()=>{ctx.battle=null},
 battleDefeat:()=>{ctx.battle=null},startBattle:()=>{ctx.battle={auriUsed:false,auriZUsed:false,auriZReady:null,log:''}},
 chooseAlive:()=>ctx.state.party.find(p=>p.hp>0),foe:()=>({id:1,hp:100,level:55}),
 closeModal:()=>{},openModal:()=>{},toast:()=>{},gainItem:(id,n)=>ctx.state.bag[id]=(ctx.state.bag[id]||0)+(n||1),
 bagCount:id=>ctx.state.bag[id]||0,hpMax:(id,level)=>100+level,
 effectiveness:()=>1,aurimonDamage:()=>({amount:15,mult:1,crit:false}),
 TYPE_MOVE:{Elektro:'Donnerblitz',Psycho:'Konfusion'},Math:Object.assign(Object.create(Math),{random:()=>0.01})
});
vm.runInNewContext(get('aurimon_special_mechanics.js'),ctx);
const sys=ctx.window.AuriFormSystem;
assert.equal(sys.inspect().forms,554);
assert.equal(sys.formsFor(26).length,cat.bySpecies[26].length);
ctx.doAction('forms-pick:demo:'+find(26,'alola').key);
assert(!pokemon.formKey,'Form switch without form pass was permitted');
ctx.state.bag.formenpass=1;
ctx.doAction('forms-pick:demo:'+find(26,'alola').key);
assert.equal(pokemon.formKey,find(26,'alola').key);
assert(sys.formTypes(pokemon).includes('Psycho'));
assert.equal(pokemon.id,26,'National Pokédex ID changed with form');
ctx.doAction('forms-pick:demo:base');
assert(!pokemon.formKey);
const wild=ctx.randomWild(14);
assert.equal(wild.id,26);
assert(wild.formKey,'Late-game wild regional form could not spawn');
const char={uid:'charizard',id:6,level:90,hp:160};
ctx.state.party=[char];ctx.state.bag.mega_ring=1;ctx.state.bag.mega_stone=1;
ctx.startBattle();assert(ctx.battle);
ctx.doAction('forms-transform:charizard:'+find(6,'mega').key);
assert.equal(char.battleFormKey,find(6,'mega').key);
assert(ctx.battle.auriUsed);
const megaName=sys.formName(char);assert(megaName.includes('Mega')||megaName.includes('mega'));
ctx.battleVictory();assert(!char.battleFormKey,'Mega form survived the battle');
ctx.state.bag.dynamax_band=1;ctx.startBattle();sys.activateDyna();
assert(char.auriDyna&&char.auriDyna.turns===3);
const giantHp=char.hp;assert(giantHp>160);
for(let i=0;i<3;i++)ctx.battleAttack('Feuer');
assert(!char.auriDyna,'Dynamax did not expire after 3 attacks');
assert(char.hp<=160,'Dynamax HP not reverted');
ctx.battleVictory();
ctx.state.bag.tera_orb=1;ctx.startBattle();sys.activateTera('Fee');
assert.equal(char.battleTeraType,'Fee');
assert.deepEqual(Array.from(sys.formTypes(char)),['Fee']);
ctx.battleVictory();assert(!char.battleTeraType);
ctx.state.bag['z_crystal_Feuer']=1;ctx.startBattle();sys.activateZ();
assert.equal(ctx.battle.auriZReady,'Feuer');
const z=ctx.aurimonDamage(char,{uid:'target',id:1,level:90}, {type:'Feuer',power:40},'Klar');
assert(z.amount>0);
ctx.battleAttack('Feuer');assert(ctx.battle.auriZUsed,'Z attack not consumed');
ctx.battleVictory();
assert(saves>0,'Form choices never saved');
console.log('[PASS] 554 unique source-backed forms, regional and special form categories, individual profile IDs, wild encounters, Mega reset, 3-turn Dynamax reset, Tera and Z move.');
