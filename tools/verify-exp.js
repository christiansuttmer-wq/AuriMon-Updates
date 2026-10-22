/* Experience point regression checks across all nine generations.
 * Reads the real 1,025-Pokémon catalog. No Android SDK or save writes required.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root='app/src/main/assets/';
const source=n=>fs.readFileSync(root+n,'utf8');
const ctx=vm.createContext({window:{}});
for(const n of ['pokemon_stats_151.js','dex.js','pokemon_gen2_9.js'])
  vm.runInContext(source(n),ctx,{timeout:4000});
const dex=ctx.window.POKEDEX;
assert.equal(dex.length,1025);
ctx.POKE=Object.fromEntries(dex.map(p=>[p.id,p]));
const game=source('game.js');
const start=game.indexOf('function xpNeeded(lv,id)');
const end=game.indexOf('\nfunction bagCount(id)',start);
assert(start>=0&&end>start,'Experience function missing from game engine');
vm.runInContext(game.slice(start,end)+'\nglobalThis.xpForTest=xpNeeded;',ctx,{timeout:2000});
const xp=ctx.xpForTest;
const starterBases=[1,152,252,387,495,650,722,810,906];
for(const id of starterBases){
  assert.equal(xp(100,id),xp(100,1),'Starter experience curve differs for species '+id);
  assert.equal(xp(100,id+1),xp(100,1),'Starter middle evolution curve differs for species '+(id+1));
  assert.equal(xp(100,id+2),xp(100,1),'Starter final evolution curve differs for species '+(id+2));
}
assert.equal(xp(100,161),xp(100,19),'Ordinary Gen2 species must grow like ordinary Gen1 species');
assert.equal(xp(100,906),xp(100,1),'Gen9 starter must not be treated as legendary');
for(const id of [144,151,243,249,1025]){
  assert(ctx.POKE[id].legendary||ctx.POKE[id].mythical,'Rarity test specimen '+id+' has missing catalog marker');
  assert(xp(100,id)>xp(100,19),'Rare species '+id+' must use slower growth');
}
for(const id of [1,19,144,151,152,161,243,252,387,495,650,722,810,906,1025]){
  for(let level=1;level<150;level++){
    const value=xp(level,id);
    assert(Number.isInteger(value)&&value>0,'Invalid XP '+id+' at level '+level);
  }
  assert.equal(xp(150,id),Infinity,'Level cap broken for species '+id);
}
assert(!/if\(id>=144\)/.test(game.slice(start,end)),'Do not conflate Gen2–9 with legendary species');
console.log('[PASS] XP curves across nine starter generations, ordinary/rare species and crystal-gated level 150.');
