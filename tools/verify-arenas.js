/* Regression tests for the 40 AuriMon arenas and final six-Pokémon team.
 * Runs with Node only, without Android SDK or access to personal saves.
 */
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path='app/src/main/assets/';
const game=fs.readFileSync(path+'game.js','utf8');
const world=fs.readFileSync(path+'aurimon_world50_pilot.js','utf8');
const begin=game.indexOf('function gymParty(z)');
const end=game.indexOf('\nfunction battleGym(z)',begin);
assert(begin>=0&&end>begin,'Base arena logic missing');
const areaStrength=Array.from({length:40},(_,z)=>({
  gym:[Math.min(146,8+z*4),Math.min(150,13+z*4)],
  gymSize:z<3?2:z<6?3:z<9?4:z<20?5:6
}));
const state={zone:0,badges:[]};
let dialog=null;
const ctx={
  state,AREA_STRENGTH:areaStrength,REGION_COUNT:40,FINAL_ZONE:39,
  REGIONS:Array.from({length:40},(_,i)=>'Region '+i),
  ZONE_POOLS:Array.from({length:40},(_,i)=>[1+i,2+i,3+i,4+i,5+i,6+i]),
  AREAS:Array.from({length:40},(_,i)=>({name:'Region '+i,leader:i===39?'Nova Ultima':'Boss '+i,badge:'Siegel '+i})),
  hash:(a,b,c)=>a+b+c,
  newMon:(id,level)=>({id,level,hp:level+id}),
  hpMax:(id,level)=>level+id,
  chooseAlive:()=>true,
  toast:s=>{throw new Error('Unexpected toast: '+s)},
  modal:(title,html,actions)=>{dialog={title,html,actions}},
  window:{PokemonGame:{world50:{getStage:()=>state.zone*5+4}}},
  active:()=>true,
  ensure:()=>({stage:state.zone*5+4})
};
vm.createContext(ctx);
vm.runInContext(game.slice(begin,end),ctx,{timeout:2000});
const baseGym=ctx.gymParty;
assert.equal(baseGym(39).length,6,'Final base team must contain six Pokémon');
assert(baseGym(39).every(m=>m.level<=150),'Base gym cannot exceed level 150');
const wBegin=world.indexOf(' gymParty=function(z)');
const wEnd=world.indexOf('\n randomWild=function(z)',wBegin);
assert(wBegin>=0&&wEnd>wBegin,'World arena scaling wrapper missing');
vm.runInContext('const oldGymParty=gymParty;\n'+world.slice(wBegin,wEnd),ctx,{timeout:2000});
let previousMinimum=0;
for(let z=0;z<40;z++){
  state.zone=z;
  const team=ctx.gymParty(z);
  const expectedSize=z===39?6:areaStrength[z].gymSize;
  assert.equal(team.length,expectedSize,'Arena '+(z+1)+' team size');
  const expectedBase=z<10?[11,20,30,40,50,60,70,80,90,96][z]:
    Math.min(147,95+Math.floor((z-9)*1.7));
  assert.equal(team[0].level,expectedBase,'Arena '+(z+1)+' should use world-specific level');
  for(let i=0;i<team.length;i++){
    assert.equal(team[i].level,Math.min(150,expectedBase+i),'Arena '+(z+1)+' opponent '+(i+1));
    assert.equal(team[i].hp,ctx.hpMax(team[i].id,team[i].level),'Arena '+(z+1)+' opponent HP');
  }
  assert(team[0].level>=previousMinimum,'Arena boss scaling must never decrease');
  previousMinimum=team[0].level;
  dialog=null;
  ctx.enterGym();
  assert(dialog,'Arena '+(z+1)+' has no entry dialogue');
  assert(!/NaN|undefined|\*\*/.test(dialog.html),'Arena '+(z+1)+' shows broken level or markup');
  assert(dialog.html.includes('Empfohlenes Level: <b>'+expectedBase),'Wrong arena '+(z+1)+' recommendation');
}
state.zone=39;
assert(dialog.html.includes('sechs'),'Final boss should promise six opponents');
assert(dialog.html.includes('Nova Ultima'),'Final boss name must match world story');
ctx.window.PokemonGame.world50.getStage=()=>0;
dialog=null;
ctx.enterGym();
assert(dialog&&!/NaN|undefined/.test(dialog.html),'Fallback arena cannot display NaN');
// Already-won gyms offer a rematch, never another first-time badge.
state.badges=[39];
dialog=null;
ctx.enterGym();
assert(dialog&&dialog.actions[0][0]==='Revanche','Already-won final arena must offer a rematch');
console.log('[PASS] 40 arena battle teams, monotonic boss levels 11–150, six-Pokémon finale, UI level previews and rematches.');
