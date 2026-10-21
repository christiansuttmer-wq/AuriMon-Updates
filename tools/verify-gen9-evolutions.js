/* AuriMon v1.5.1: canonical evolution links, crystal quality and epic quest controls. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=n=>fs.readFileSync('app/src/main/assets/'+n,'utf8');
const ctx=vm.createContext({window:{}});
for(const n of ['pokemon_stats_151.js','dex.js','pokemon_gen2_9.js','pokemon_gen9_evolutions.js'])
 vm.runInContext(src(n),ctx,{timeout:2000});
const dex=ctx.window.POKEDEX,coverage=ctx.window.AuriEvolutionCoverage,items=ctx.window.AuriEvolutionItems;
assert.equal(dex.length,1025);
assert(coverage.ruleCount>=400,'More than 400 expanded evolution branches required');
assert(items.length>=25,'Most canonical evolution items are available');
const byId=id=>dex[id-1];
for(const species of dex){
 assert.equal(species.id,byId(species.id).id);
 for(const e of species.evol)assert(byId(e.to),'Dangling evolution from '+species.id+' -> '+e.to);
 assert.equal(new Set(species.evol.map(e=>e.to)).size,species.evol.length,
   'Duplicate evolution target for '+species.name);
}
const crobat=byId(42).evol.find(e=>e.to===169);
assert(crobat&&crobat.kind==='bond','Golbat -> Crobat must need friendship');
const espeon=byId(133).evol.find(e=>e.to===196);
assert(espeon&&espeon.kind==='bond'&&espeon.time==='day','Eevee -> Espeon requires daytime friendship');
const umbreon=byId(133).evol.find(e=>e.to===197);
assert(umbreon&&umbreon.time==='night','Eevee -> Umbreon requires nighttime friendship');
const steelix=byId(95).evol.find(e=>e.to===208);
assert(steelix&&steelix.kind==='trade'&&steelix.heldItem,'Onix -> Steelix needs metal coat + trade');
const togekiss=byId(176).evol.find(e=>e.to===468);
assert(togekiss&&togekiss.kind==='item'&&items.some(i=>i.key===togekiss.item),
  'Togetic -> Togekiss must need an actual purchasable evolution stone');
const distinct=new Set(items.map(i=>i.key));assert.equal(distinct.size,items.length);
const game=src('game.js'),story=src('aurimon_2_0.js'),world=src('aurimon_world50_pilot.js');
const a=game.indexOf('function bondSteps(p)'),b=game.indexOf('function renderTeam()',a);
assert(a>0&&b>a);
const state={steps:0,bag:{'Tausch-Kabel':1,[steelix.heldItem]:1,[togekiss.item]:1}};
const types=Object.fromEntries(dex.map(p=>[p.id,p]));
const sub=vm.createContext({state,POKE:types,ITEM_INFO:Object.fromEntries(items.map(i=>[i.key,[i.name]])),
 Date,Math,console});
vm.runInContext('function bagCount(id){return state.bag[id]||0}\n'+game.slice(a,b)+
 '\nglobalThis.checkEvo={evolutionReason,evolutionOptions,bondSteps}',sub,{timeout:2000});
const logic=sub.checkEvo;
const mon={id:42,uid:'t',level:55,bondSteps:0,gender:'male'};
assert(logic.evolutionReason(mon,crobat),'Newly captured Golbat cannot skip friendship');
state.steps=160;
assert.equal(logic.evolutionReason(mon,crobat),null,'Friendship after 160 shared steps');
assert.equal(logic.evolutionReason({id:95,uid:'onix',level:45},steelix),null,
 'Onix should be able to trade with cable and held item');
state.bag[steelix.heldItem]=0;
assert(logic.evolutionReason({id:95,uid:'onix',level:45},steelix),
 'Onix must refuse evolution without held metal coat');
const hidden=byId(52).evol.find(e=>e.to===863);
assert(hidden&&hidden.kind==='trial'&&logic.evolutionReason({id:52,uid:'meow',level:150},hidden),
  'Unsupported regional mechanics must not be silently bypassable');
const plotMatch=story.match(/const storyEntries=(\[[^\n]*\]);\n/);
assert(plotMatch,'New region episode stories not found');
const plots=JSON.parse(plotMatch[1]);
assert.equal(plots.length,30);assert.equal(new Set(plots).size,30);
assert.match(story,/clueCount===3/);
assert.match(story,/q\.clues\[kind\]/);
assert.match(story,/if\(cmd==='evo-buy'\)/);
assert.match(world,/talkToGuide\?\.\(state\.zone,n\.kind\)/);
assert.match(game,/dexShownLimit=60/);
assert.match(src('index.html'),/pokemon_gen9_evolutions\.js/);
console.log('[PASS] 1025 species, '+coverage.ruleCount+' evolution paths, '+items.length+
 ' shop items, friendship/day/night/trade gates, 30 unique quest chapters, 3 on-map clues, paginated Dex.');
