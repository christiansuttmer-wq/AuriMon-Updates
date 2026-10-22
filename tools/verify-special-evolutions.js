/* All sixty-four formerly-blocked modern evolutions have a reachable
 * AuriMon-compatible trigger, while Shedinja retains its extra-party mechanic.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const base='app/src/main/assets/',source=n=>fs.readFileSync(base+n,'utf8');
const ctx={window:{}};
vm.runInNewContext(source('dex.js'),vm.createContext(ctx));
vm.runInNewContext(source('pokemon_gen2_9.js'),ctx);
vm.runInNewContext(source('pokemon_gen9_evolutions.js'),ctx);
vm.runInNewContext(source('aurimon_special_forms_data.js'),ctx);
vm.runInNewContext(source('aurimon_special_evolutions_data.js'),ctx);
const D=ctx.window.POKEDEX,POKE=Object.fromEntries(D.map(x=>[x.id,x]));
const rules=ctx.window.AuriSpecialEvolutionRules,cat=ctx.window.AuriSpecialFormCatalog;
assert.equal(Object.keys(rules).length,64);
const TYPE_NAMES=['Normal','Feuer','Wasser','Pflanze','Elektro','Eis','Kampf','Gift','Boden','Flug','Psycho','Käfer','Gestein','Geist','Drache','Unlicht','Stahl','Fee'];
let saved=0;
const state={party:[],box:[],bag:{ball:99,candy:10000},coins:1000000,steps:100000,badges:Array.from({length:40},(_,i)=>i)};
for(let i=0;i<9000;i++)state.bag['evoitem_'+i]=20;
Object.assign(ctx,{
 D,POKE,state,ITEM_INFO:{},START_BAG:{},ELEMENT_TYPES:TYPE_NAMES,
 window:{...ctx.window,AuriFormSystem:{formsFor:id=>cat.bySpecies[id]||[]}},
 bondSteps:()=>1000000,bagCount:id=>state.bag[id]||0,save:()=>saved++,render:()=>{},
 mon:uid=>state.party.find(p=>p.uid===uid),newMon:(id,level)=>({id,uid:'additional',level,shiny:false}),
 seen:()=>{},caught:()=>{},toast:()=>{},showShop:()=>{},showEvolutions:()=>{},
 doAction:()=>{},renderBattle:()=>{},renderTeam:()=>{},openModal:()=>{},
 $:()=>null,battle:null,chooseAlive:()=>state.party[0],foe:()=>({id:2}),
 enemyTurn:()=>{},battleAttack:()=>{},battleVictory:()=>{},gainXP:()=>{},
 aurimonDamage:()=>({amount:5,mult:1,crit:false}),
 v4Weather:()=> 'Regen',
 evolutionReason:(p,e)=>e.kind==='trial'?'Vorher blockiert':null,
 evolutionLabel:()=>'',evolve:(uid,to)=>{
  const p=ctx.mon(uid),e=POKE[p.id].evol.find(x=>x.to===to);
  if(e&&!ctx.evolutionReason(p,e))p.id=to;
 }
});
vm.runInNewContext(source('aurimon_special_evolutions.js'),ctx);
const feature=ctx.window.AuriSpecialEvolutions;
assert.equal(feature.total,64);
let playable=0,shed=0;
for(const [key,r] of Object.entries(rules)){
 const evo=POKE[r.source].evol.find(e=>e.to===r.target);
 assert(evo&&evo.kind==='trial','Missing data for '+key);
 const p={id:r.source,uid:'primary',level:150,hp:100,
  gender:r.gender===1?'female':'male',
  auriEvoStats:{moves:Object.fromEntries(TYPE_NAMES.map(t=>[t,100])),crits:10,taken:200,wins:10,levels:4},
  auriEvoFocus:r.relativeStats===1?'attack':r.relativeStats===-1?'defense':'balance'};
 const form=cat.bySpecies[p.id]?.find(f=>f.formId===r.formId);
 if(r.formId>=10000&&form)p.formKey=form.key;
 state.party=[p,{uid:'partner',id:r.partySpecies||1,level:120,hp:100}];
 state.steps=100000;state.coins=1000000;
 const reason=ctx.evolutionReason(p,evo);
 if(r.trigger==='shed'){
  assert(reason&&reason.includes('automatisch'),'Shedinja should be a bonus Pokémon');
  shed++;continue;
 }
 assert.equal(reason,null,'Special evolution unplayable: '+key+' / '+reason);
 ctx.evolve(p.uid,r.target);
 assert.equal(p.id,r.target,'Evolution produced wrong species: '+key);
 playable++;
}
assert.equal(playable+shed,64);
assert.equal(shed,1);
assert(saved>0,'Special evolutions were never persisted');
console.log('[PASS] All 64 original trial evolutions: 63 unlockable challenge paths + 1 correctly additive Shedinja branch; form, weather, item and battle-gate contracts.');
