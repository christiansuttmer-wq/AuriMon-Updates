/* AuriMon 50-stage CI regression check. No credentials, no player data. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('app/src/main/assets/aurimon_world50_pilot.js','utf8');
const st={starterChosen:true,zone:0,x:9,y:9,facing:'down',found:[],badges:[],trainerWins:[],coins:0,steps:0,
 aurWorld50:{stage:0,runestones:[],completed:[]}};
const ctx={
 window:{PokemonGame:{},PokemonProfiles:{activeSlot:1},addEventListener(){}},
 document:{createElement:()=>({setAttribute(){},getContext:()=>({scale(){}})}),addEventListener(){}},
 state:st,requestAnimationFrame(){},
};
for(const n of ['renderMap','walk','interact','trainerParty','randomWild','gymParty','enterZone','battleDefeat','atPosition','trainers','drops','render','doAction'])
 ctx[n]=()=>{};
vm.runInNewContext(code,vm.createContext(ctx),{filename:'aurimon_world50_pilot.js',timeout:2000});
const api=ctx.window.PokemonGame.world50;
assert(api,'World50 API was not registered');
assert.equal(api.getCount(),50);
assert.equal(api.names.length,50);
assert.equal(api.names[49],'Kronenarena');
const reports=api.validate();
assert.equal(reports.length,50);
for(const r of reports)assert(r.reachable,'Stage '+r.stage+': missing accessible targets');
for(let i=0;i<50;i++){
 const m=api.getMap(i);
 assert.equal(m.length,12);for(const row of m)assert.equal(row.length,20);
 assert.equal(m[6][19],'E','Missing east exit on stage '+(i+1));
 if(i%5===3){
  assert.equal(m.flat().filter(t=>t==='R').length,3,'Missing runes at stage '+(i+1));
  assert.equal(m[6][17],'G','Dungeon gate missing at '+(i+1));
 }
 if(i%5===0)assert.equal(api.getRegion(i),[
 'Sonnenwiese','Mondsee','Felsenwald','Blumenpfad','Windküste','Bernsteinwald',
 'Flüsterdorf','Kristallsee','Vulkanpass','Wolkenhöhe'][i/5]);
}
console.log('[PASS] 50 maps / 10 dungeons / 10 regions / all targets accessible.');
